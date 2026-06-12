"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowRight,
  Receipt,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Minus,
  Command,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import AppLayout from "@/components/layouts/AppLayout";
import CreateGroupDialog from "@/components/CreateGroupDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
}

interface GroupMember {
  id: string;
  userId: string;
  user: UserProfile;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  ownerId: string;
  members: GroupMember[];
  _count?: { expenses: number };
}

interface ActivityItem {
  id: string;
  type: "EXPENSE" | "SETTLEMENT";
  title: string;
  amount: number;
  groupName: string;
  groupId: string;
  date: string;
  user: string;
}

interface DashboardSummary {
  totalOwed: number;
  totalReceivable: number;
  netBalance: number;
  activeGroupsCount: number;
  activities: ActivityItem[];
}

// ─── Command Center Widget ────────────────────────────────────────────────────

function CommandCenter({
  onCreateGroup,
  groups,
}: {
  onCreateGroup: () => void;
  groups: Group[];
}) {
  const router = useRouter();

  const quickActions = [
    {
      id: "add-expense",
      icon: Receipt,
      label: "Add Expense",
      desc: "Record a new shared expense",
      accent: "var(--emerald)",
      action: () => groups[0] && router.push(`/groups/${groups[0].id}`),
    },
    {
      id: "create-group",
      icon: Users,
      label: "Create Group",
      desc: "Start a new workspace",
      accent: "var(--cyan)",
      action: onCreateGroup,
    },
    {
      id: "settle-debt",
      icon: Wallet,
      label: "Settle Debt",
      desc: "Record a payment",
      accent: "var(--violet)",
      action: () => groups[0] && router.push(`/groups/${groups[0].id}?tab=balances`),
    },
  ];

  return (
    <div
      className="rounded-2xl p-5 mb-8"
      style={{
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: "rgba(15,212,146,0.10)" }}
          >
            <Command className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
          </div>
          <span
            className="text-[13px] font-semibold"
            style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
          >
            Command Center
          </span>
        </div>
        <kbd
          className="text-[9px] px-1.5 py-0.5 rounded font-mono"
          style={{
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-float)",
            color: "var(--text-tertiary)",
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              onClick={action.action}
              className="flex flex-col items-start gap-2 p-3.5 rounded-xl text-left group cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: "var(--bg-float)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${action.accent}30`;
                (e.currentTarget as HTMLElement).style.backgroundColor = `${action.accent}06`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-float)";
              }}
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${action.accent}12` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: action.accent }} />
              </div>
              <div>
                <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  {action.label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {action.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recent Groups Quick Access */}
      {groups.length > 0 && (
        <div>
          <p
            className="text-[10px] font-semibold uppercase mb-2"
            style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
          >
            Recent Groups
          </p>
          <div className="flex gap-2 flex-wrap">
            {groups.slice(0, 4).map((group) => (
              <button
                key={group.id}
                onClick={() => router.push(`/groups/${group.id}`)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer"
                style={{
                  backgroundColor: "var(--bg-overlay)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--emerald)" }}
                />
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Balance Statement Cards ──────────────────────────────────────────────────

function BalanceCard({
  label,
  amount,
  isPositive,
  isNeutral,
}: {
  label: string;
  amount: number;
  isPositive: boolean;
  isNeutral: boolean;
}) {
  const color = isNeutral
    ? "var(--text-secondary)"
    : isPositive
    ? "var(--credit)"
    : "var(--debt)";

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(amount) / 100);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--bg-raised)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[10px] font-semibold uppercase"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
        >
          {label}
        </p>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <p
        className="text-2xl font-semibold"
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          color,
          letterSpacing: "-0.03em",
        }}
      >
        {isNeutral ? "Settled" : `${isPositive && !isNeutral ? "+" : ""}${formatted}`}
      </p>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: summary, isLoading: isSummaryLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  const { data: groupsData, isLoading: isGroupsLoading } = useQuery<{ groups: Group[] }>({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  const groups = groupsData?.groups ?? [];
  const net = summary?.netBalance ?? 0;

  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
    }),
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-start justify-between mb-8"
        >
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.025em",
                fontFamily: "var(--font-inter)",
              }}
            >
              Good morning, {user?.firstName ?? "there"}.
            </h1>
            <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              {" · "}
              <span style={{ fontFamily: "var(--font-jetbrains-mono)", fontSize: "12px" }}>
                {groups.length} active {groups.length === 1 ? "group" : "groups"}
              </span>
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 font-semibold rounded-xl cursor-pointer transition-all duration-150"
            style={{
              backgroundColor: "var(--emerald)",
              color: "var(--bg-void)",
              padding: "8px 16px",
              fontSize: "13px",
              letterSpacing: "-0.01em",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Group
          </button>
        </motion.div>

        {/* ── Balance Cards ─────────────────────────────────────────────────── */}
        {!isSummaryLoading && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: "You owe", amount: summary?.totalOwed ?? 0, isPositive: false, isNeutral: (summary?.totalOwed ?? 0) === 0 },
              { label: "Owed to you", amount: summary?.totalReceivable ?? 0, isPositive: true, isNeutral: (summary?.totalReceivable ?? 0) === 0 },
              { label: "Net position", amount: net, isPositive: net >= 0, isNeutral: net === 0 },
            ].map((card, i) => (
              <motion.div key={card.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
                <BalanceCard {...card} />
              </motion.div>
            ))}
          </div>
        )}

        {isSummaryLoading && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl animate-pulse"
                style={{ backgroundColor: "var(--bg-raised)" }}
              />
            ))}
          </div>
        )}

        {/* ── Command Center ────────────────────────────────────────────────── */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <CommandCenter onCreateGroup={() => setIsCreateOpen(true)} groups={groups} />
        </motion.div>

        {/* ── Main Content: Groups + Activity ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Groups */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-[10px] font-semibold uppercase"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
              >
                Workspaces
              </p>
              <p
                className="text-[11px]"
                style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-tertiary)" }}
              >
                {groups.length} groups
              </p>
            </div>

            {isGroupsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: "var(--bg-raised)" }} />
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
                style={{
                  backgroundColor: "var(--bg-raised)",
                  border: "1px dashed var(--border-default)",
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "rgba(15,212,146,0.08)" }}
                >
                  <Users className="h-5 w-5" style={{ color: "var(--emerald)" }} />
                </div>
                <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  No workspaces yet
                </p>
                <p className="text-[12px] mb-4" style={{ color: "var(--text-secondary)" }}>
                  Create your first group to start splitting
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="text-[12px] font-semibold px-4 py-2 rounded-lg cursor-pointer"
                  style={{ backgroundColor: "var(--emerald)", color: "var(--bg-void)" }}
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groups.map((group, i) => (
                  <motion.div
                    key={group.id}
                    custom={i + 4}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    onClick={() => router.push(`/groups/${group.id}`)}
                    className="rounded-xl p-4 cursor-pointer group transition-all duration-150"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border-subtle)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(15,212,146,0.20)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3
                        className="text-[14px] font-semibold leading-snug"
                        style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}
                      >
                        {group.name}
                      </h3>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--bg-float)",
                          color: "var(--text-tertiary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {group.currency}
                      </span>
                    </div>

                    {group.description && (
                      <p
                        className="text-[12px] mb-3 line-clamp-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {group.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Member avatars */}
                      <div className="flex -space-x-1.5">
                        {group.members.slice(0, 4).map((m) => (
                          <Image
                            key={m.id}
                            src={m.user.avatarUrl}
                            alt={m.user.fullName}
                            width={22}
                            height={22}
                            className="rounded-full object-cover"
                            style={{ border: "2px solid var(--bg-raised)" }}
                          />
                        ))}
                        {group.members.length > 4 && (
                          <div
                            className="h-[22px] w-[22px] rounded-full flex items-center justify-center text-[8px] font-bold"
                            style={{
                              backgroundColor: "var(--bg-float)",
                              border: "2px solid var(--bg-raised)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            +{group.members.length - 4}
                          </div>
                        )}
                      </div>
                      <ArrowRight
                        className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity"
                        style={{ color: "var(--emerald)" }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase mb-3"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
            >
              Recent Activity
            </p>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {isSummaryLoading ? (
                <div className="p-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--bg-float)" }} />
                  ))}
                </div>
              ) : !summary?.activities?.length ? (
                <div className="p-6 text-center">
                  <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                    No activity yet
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {summary.activities.slice(0, 6).map((act) => (
                    <div
                      key={act.id}
                      onClick={() => router.push(`/groups/${act.groupId}`)}
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-120"
                      style={{}}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-float)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      }}
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: act.type === "EXPENSE"
                            ? "rgba(15,212,146,0.08)"
                            : "rgba(34,211,238,0.08)",
                        }}
                      >
                        {act.type === "EXPENSE" ? (
                          <Receipt className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
                        ) : (
                          <Wallet className="h-3.5 w-3.5" style={{ color: "var(--cyan)" }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[12px] font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {act.title}
                        </p>
                        <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>
                          {act.groupName}
                        </p>
                      </div>
                      <p
                        className="text-[12px] font-medium shrink-0"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          color: act.type === "SETTLEMENT" ? "var(--credit)" : "var(--text-primary)",
                        }}
                      >
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(act.amount / 100)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateGroupDialog isOpen={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </AppLayout>
  );
}
