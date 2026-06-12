"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, CheckCircle2, ArrowRight, FileText } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
}

interface Settlement {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
  payerUser: UserProfile;
  receiverUser: UserProfile;
  createdByUser: { id: string; fullName: string };
}

interface SettlementsPage {
  settlements: Settlement[];
  totalCount: number;
  nextPage: number | null;
  page: number;
}

interface SettlementsTabProps {
  groupId: string;
  groupCurrency: string;
  currentUserId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettlementsTab({
  groupId,
  groupCurrency,
  currentUserId,
}: SettlementsTabProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<SettlementsPage>({
      queryKey: ["group-settlements", groupId],
      queryFn: async ({ pageParam }) => {
        const res = await fetch(
          `/api/groups/${groupId}/settlements?page=${pageParam as number}&limit=15`
        );
        if (!res.ok) throw new Error("Failed to fetch settlements");
        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    });

  const settlements = data?.pages.flatMap((p) => p.settlements) ?? [];
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: groupCurrency }).format(
      cents / 100
    );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

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
      <div className="text-center py-16 text-[13px]" style={{ color: "var(--debt)" }}>
        Failed to load settlements. Please refresh.
      </div>
    );
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
        >
          <FileText className="h-6 w-6" style={{ color: "var(--text-tertiary)" }} />
        </div>
        <h3 className="text-[14px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>No settlements recorded</h3>
        <p className="text-[12px] max-w-xs" style={{ color: "var(--text-secondary)" }}>
          Once members settle up, all payment records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <p className="text-[11px] mb-5" style={{ color: "var(--text-tertiary)" }}>
        {totalCount} settlement{totalCount !== 1 ? "s" : ""} recorded
      </p>

      {/* Timeline list */}
      <div className="space-y-3">
        {settlements.map((settlement, i) => {
          const isCurrentUserPayer = settlement.payerUser.id === currentUserId;
          const isCurrentUserReceiver = settlement.receiverUser.id === currentUserId;

          return (
            <motion.div
              key={settlement.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl p-4 transition-all"
              style={{
                border: `1px solid ${
                  isCurrentUserPayer
                    ? "rgba(244,63,94,0.15)"
                    : isCurrentUserReceiver
                    ? "var(--emerald-border)"
                    : "var(--border-subtle)"
                }`,
                backgroundColor: isCurrentUserPayer
                  ? "rgba(244,63,94,0.04)"
                  : isCurrentUserReceiver
                  ? "rgba(15,212,146,0.04)"
                  : "transparent",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Settled icon */}
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(15,212,146,0.08)", border: "1px solid var(--emerald-border)" }}
                  >
                    <CheckCircle2 className="h-4 w-4" style={{ color: "var(--emerald)" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* From → To */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Image
                          src={settlement.payerUser.avatarUrl}
                          alt={settlement.payerUser.fullName}
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] rounded-full object-cover"
                          style={{ border: "1.5px solid var(--border-default)" }}
                        />
                        <span className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                          {isCurrentUserPayer ? "You" : settlement.payerUser.fullName}
                        </span>
                      </div>
                      <ArrowRight className="h-3 w-3 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                      <div className="flex items-center gap-1.5">
                        <Image
                          src={settlement.receiverUser.avatarUrl}
                          alt={settlement.receiverUser.fullName}
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px] rounded-full object-cover"
                          style={{ border: "1.5px solid var(--border-default)" }}
                        />
                        <span className="text-[12px] font-bold" style={{ color: "var(--text-primary)" }}>
                          {isCurrentUserReceiver ? "You" : settlement.receiverUser.fullName}
                        </span>
                      </div>
                    </div>

                    {/* Note + date */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {settlement.note && (
                        <>
                          <span className="text-[10px] italic" style={{ color: "var(--text-secondary)" }}>
                            &ldquo;{settlement.note}&rdquo;
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>·</span>
                        </>
                      )}
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains-mono)" }}>
                        {formatDate(settlement.createdAt)}
                      </span>
                    </div>
                    <p className="text-[9px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      Recorded by {settlement.createdByUser.fullName}
                    </p>
                  </div>
                </div>

                {/* Amount badge */}
                <div className="shrink-0 text-right">
                  <span
                    className="text-[14px] font-black tabular-nums"
                    style={{ color: "var(--emerald)", fontFamily: "var(--font-jetbrains-mono)" }}
                  >
                    {formatAmount(settlement.amount)}
                  </span>
                  {isCurrentUserPayer && (
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: "var(--debt)" }}>You paid</p>
                  )}
                  {isCurrentUserReceiver && (
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: "var(--emerald)" }}>You received</p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Load more */}
      {hasNextPage && (
        <div className="flex justify-center pt-6">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer transition-colors px-4 py-2 rounded-lg"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-raised)",
            }}
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Load more settlements
          </button>
        </div>
      )}
    </div>
  );
}
