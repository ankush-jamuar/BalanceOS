"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertTriangle,
  X,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
}

interface BalanceEntry {
  user: UserProfile;
  netBalance: number;
}

interface SuggestedPayment {
  fromUser: UserProfile;
  toUser: UserProfile;
  amount: number;
}

interface BalancesResponse {
  balances: BalanceEntry[];
  suggestedPayments: SuggestedPayment[];
}

interface BalancesTabProps {
  groupId: string;
  groupCurrency: string;
  currentUserId: string;
}

// ─── Settle Up Modal ──────────────────────────────────────────────────────────

function SettleUpModal({
  payment,
  groupId,
  groupCurrency,
  onClose,
}: {
  payment: SuggestedPayment;
  groupId: string;
  groupCurrency: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [customAmount, setCustomAmount] = useState(
    (payment.amount / 100).toFixed(2)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const maxAmount = payment.amount; // cents
  const parsedCents = Math.round(parseFloat(customAmount || "0") * 100);
  const isOverSettlement = parsedCents > maxAmount;
  const isInvalidAmount = parsedCents <= 0 || isNaN(parsedCents);

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: groupCurrency }).format(
      cents / 100
    );

  const mutation = useMutation({
    mutationFn: async () => {
      if (isOverSettlement) {
        throw new Error(
          `Amount exceeds the owed balance of ${formatAmount(maxAmount)}. Cannot over-settle.`
        );
      }
      if (isInvalidAmount) {
        throw new Error("Please enter a valid amount greater than zero.");
      }

      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          payerUserId: payment.fromUser.id,
          receiverUserId: payment.toUser.id,
          amount: parsedCents,
          note: note.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to record settlement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-settlements", groupId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(6,8,11,0.75)", backdropFilter: "blur(6px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{
          backgroundColor: "var(--bg-float)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--glow-card)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(15,212,146,0.10)", border: "1px solid var(--emerald-border)" }}
            >
              <CheckCircle2 className="h-5 w-5" style={{ color: "var(--emerald)" }} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                Record Settlement
              </h3>
              <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                Mark this payment as completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-overlay)";
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Payment summary */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <Image
                src={payment.fromUser.avatarUrl}
                alt={payment.fromUser.fullName}
                width={36}
                height={36}
                className="rounded-full object-cover"
                style={{ border: "2px solid var(--border-default)" }}
              />
              <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: "var(--text-primary)" }}>
                {payment.fromUser.fullName}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--debt)" }}>
                Payer
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-4 w-4" style={{ color: "var(--text-tertiary)" }} />
              <span
                className="text-[13px] font-black tabular-nums"
                style={{ color: "var(--text-primary)", fontFamily: "var(--font-jetbrains-mono)" }}
              >
                {formatAmount(maxAmount)}
              </span>
              <span className="text-[9px]" style={{ color: "var(--text-tertiary)" }}>owed</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <Image
                src={payment.toUser.avatarUrl}
                alt={payment.toUser.fullName}
                width={36}
                height={36}
                className="rounded-full object-cover"
                style={{ border: "2px solid var(--border-default)" }}
              />
              <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: "var(--text-primary)" }}>
                {payment.toUser.fullName}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "var(--emerald)" }}>
                Receiver
              </span>
            </div>
          </div>
        </div>

        {/* Amount input with over-settlement guard */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
              Settlement Amount
            </label>
            <button
              type="button"
              className="text-[9px] font-semibold cursor-pointer transition-colors"
              style={{ color: "var(--cyan)" }}
              onClick={() => {
                setCustomAmount((maxAmount / 100).toFixed(2));
                setErrorMsg(null);
              }}
            >
              Use full amount
            </button>
          </div>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold"
              style={{ color: "var(--text-tertiary)" }}
            >
              {groupCurrency === "USD" ? "$" : groupCurrency === "EUR" ? "€" : groupCurrency === "GBP" ? "£" : ""}
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={(maxAmount / 100).toFixed(2)}
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full pl-7 pr-4 py-2.5 rounded-xl text-[13px] font-mono transition-all outline-none"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: `1px solid ${isOverSettlement ? "var(--debt)" : "var(--border-subtle)"}`,
                color: "var(--text-primary)",
                boxShadow: isOverSettlement ? "0 0 0 3px rgba(244,63,94,0.10)" : "none",
              }}
              onFocus={(e) => {
                if (!isOverSettlement) {
                  (e.target as HTMLElement).style.borderColor = "var(--emerald)";
                  (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(15,212,146,0.10)";
                }
              }}
              onBlur={(e) => {
                if (!isOverSettlement) {
                  (e.target as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.target as HTMLElement).style.boxShadow = "none";
                }
              }}
            />
          </div>

          {/* Over-settlement warning */}
          {isOverSettlement && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg p-2.5 text-[11px]"
              style={{
                backgroundColor: "rgba(244,63,94,0.08)",
                border: "1px solid rgba(244,63,94,0.20)",
                color: "var(--debt)",
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Over-settlement detected. Max allowed:{" "}
                <strong style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                  {formatAmount(maxAmount)}
                </strong>
              </span>
            </motion.div>
          )}
        </div>

        {/* Error */}
        {errorMsg && !isOverSettlement && (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl p-3 text-[11px]"
            style={{
              backgroundColor: "rgba(244,63,94,0.08)",
              border: "1px solid rgba(244,63,94,0.20)",
              color: "var(--debt)",
            }}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            {errorMsg}
          </div>
        )}

        {/* Note */}
        <div className="space-y-1.5 mb-5">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
            Note (Optional)
          </label>
          <input
            placeholder="e.g. Paid via Venmo"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none transition-all"
            style={{
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              (e.target as HTMLElement).style.borderColor = "var(--emerald)";
              (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(15,212,146,0.10)";
            }}
            onBlur={(e) => {
              (e.target as HTMLElement).style.borderColor = "var(--border-subtle)";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: "var(--bg-overlay)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setErrorMsg(null);
              mutation.mutate();
            }}
            disabled={mutation.isPending || isOverSettlement || isInvalidAmount}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
            style={{
              backgroundColor: (isOverSettlement || isInvalidAmount) ? "var(--bg-overlay)" : "rgba(15,212,146,0.12)",
              color: (isOverSettlement || isInvalidAmount) ? "var(--text-tertiary)" : "var(--emerald)",
              border: `1px solid ${(isOverSettlement || isInvalidAmount) ? "var(--border-subtle)" : "var(--emerald-border)"}`,
              opacity: mutation.isPending ? 0.7 : 1,
              cursor: (isOverSettlement || isInvalidAmount || mutation.isPending) ? "not-allowed" : "pointer",
            }}
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm Payment
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BalancesTab({
  groupId,
  groupCurrency,
  currentUserId,
}: BalancesTabProps) {
  const [settlePayment, setSettlePayment] = useState<SuggestedPayment | null>(null);

  const { data, isLoading, isError, refetch } = useQuery<BalancesResponse>({
    queryKey: ["group-balances", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/balances`);
      if (!res.ok) throw new Error("Failed to fetch balances");
      return res.json();
    },
  });

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: groupCurrency }).format(
      Math.abs(cents) / 100
    );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl animate-pulse"
            style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] mb-4" style={{ color: "var(--debt)" }}>
          Failed to calculate balances.
        </p>
        <button
          onClick={() => refetch()}
          className="text-[12px] font-medium cursor-pointer"
          style={{ color: "var(--emerald)" }}
        >
          Try again
        </button>
      </div>
    );
  }

  const balances = data?.balances ?? [];
  const suggestedPayments = data?.suggestedPayments ?? [];
  const allSettled = suggestedPayments.length === 0;

  return (
    <>
      {/* Net Balances Section */}
      <div className="mb-8">
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          <Scale className="h-3.5 w-3.5" />
          Net Balances
        </h3>
        <div className="space-y-2">
          {balances.map((entry, i) => {
            const isPositive = entry.netBalance > 0;
            const isNeutral = entry.netBalance === 0;
            const isCurrentUser = entry.user.id === currentUserId;

            return (
              <motion.div
                key={entry.user.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between gap-4 p-3.5 rounded-2xl transition-all"
                style={{
                  border: `1px solid ${isCurrentUser ? "var(--violet-border)" : "var(--border-subtle)"}`,
                  backgroundColor: isCurrentUser ? "var(--violet-glow)" : "transparent",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Image
                      src={entry.user.avatarUrl}
                      alt={entry.user.fullName}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                      style={{ border: "2px solid var(--border-default)" }}
                    />
                    {isCurrentUser && (
                      <div
                        className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: "var(--violet)",
                          border: "2px solid var(--bg-ground)",
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: "var(--text-primary)" }}>
                      {entry.user.fullName}
                      {isCurrentUser && (
                        <span
                          className="ml-1.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--violet)" }}
                        >
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      {isNeutral ? "All settled up" : isPositive ? "is owed money" : "owes money"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isNeutral && (
                    isPositive
                      ? <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--credit)" }} />
                      : <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--debt)" }} />
                  )}
                  <span
                    className="text-[14px] font-black tabular-nums"
                    style={{
                      color: isNeutral ? "var(--text-tertiary)" : isPositive ? "var(--credit)" : "var(--debt)",
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}
                  >
                    {isNeutral ? "Settled" : `${isPositive ? "+" : "-"}${formatAmount(entry.netBalance)}`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Suggested Payments */}
      <div>
        <h3
          className="text-[10px] font-bold uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Suggested Payments
        </h3>

        {allSettled ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: "rgba(15,212,146,0.08)",
                border: "1px solid var(--emerald-border)",
              }}
            >
              <CheckCircle2 className="h-6 w-6" style={{ color: "var(--emerald)" }} />
            </div>
            <h3 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
              All settled up! 🎉
            </h3>
            <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
              Everyone in this group is even. No payments needed.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2.5">
            {suggestedPayments.map((payment, i) => {
              const isCurrentUserPayer = payment.fromUser.id === currentUserId;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl p-4 transition-all"
                  style={{
                    border: `1px solid ${isCurrentUserPayer ? "rgba(244,63,94,0.18)" : "var(--border-subtle)"}`,
                    backgroundColor: isCurrentUserPayer ? "rgba(244,63,94,0.04)" : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* From → To */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Image
                          src={payment.fromUser.avatarUrl}
                          alt={payment.fromUser.fullName}
                          width={32}
                          height={32}
                          className="rounded-full object-cover shrink-0"
                          style={{ border: "2px solid var(--border-default)" }}
                        />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                            {isCurrentUserPayer ? "You" : payment.fromUser.fullName}
                          </p>
                          <p className="text-[9px] font-bold" style={{ color: "var(--debt)" }}>owes</p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                      <div className="flex items-center gap-2">
                        <Image
                          src={payment.toUser.avatarUrl}
                          alt={payment.toUser.fullName}
                          width={32}
                          height={32}
                          className="rounded-full object-cover shrink-0"
                          style={{ border: "2px solid var(--border-default)" }}
                        />
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                            {payment.toUser.id === currentUserId ? "You" : payment.toUser.fullName}
                          </p>
                          <p className="text-[9px] font-bold" style={{ color: "var(--credit)" }}>receives</p>
                        </div>
                      </div>
                    </div>

                    {/* Amount + Settle CTA */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className="text-[14px] font-black tabular-nums"
                        style={{ color: "var(--text-primary)", fontFamily: "var(--font-jetbrains-mono)" }}
                      >
                        {formatAmount(payment.amount)}
                      </span>
                      <button
                        onClick={() => setSettlePayment(payment)}
                        className="h-7 text-[10px] font-bold cursor-pointer rounded-lg px-3 transition-all"
                        style={
                          isCurrentUserPayer
                            ? {
                                backgroundColor: "rgba(15,212,146,0.12)",
                                color: "var(--emerald)",
                                border: "1px solid var(--emerald-border)",
                              }
                            : {
                                backgroundColor: "var(--bg-overlay)",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-subtle)",
                              }
                        }
                      >
                        {isCurrentUserPayer ? "Settle Up" : "Record"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settle Up Modal */}
      <AnimatePresence>
        {settlePayment && (
          <SettleUpModal
            payment={settlePayment}
            groupId={groupId}
            groupCurrency={groupCurrency}
            onClose={() => setSettlePayment(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
