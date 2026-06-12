"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Receipt,
  Scale,
  FileText,
  Users,
  Crown,
  UserPlus,
  Settings,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import AppLayout from "@/components/layouts/AppLayout";
import ExpensesTab from "@/components/ExpensesTab";
import BalancesTab from "@/components/BalancesTab";
import SettlementsTab from "@/components/SettlementsTab";
import AddMemberModal from "@/components/AddMemberModal";
import GroupSettingsDrawer from "@/components/GroupSettingsDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
  username: string;
}

interface GroupMember {
  id: string;
  userId: string;
  role: string;
  user: UserProfile;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  ownerId: string;
  createdAt: string;
  owner: UserProfile;
  members: GroupMember[];
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type TabId = "expenses" | "balances" | "settlements";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "balances", label: "Balances", icon: Scale },
  { id: "settlements", label: "Settlements", icon: FileText },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GroupWorkspacePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState<TabId>("expenses");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<{ group: Group }>({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error("forbidden");
        throw new Error("Failed to fetch group");
      }
      return res.json();
    },
    retry: false,
  });

  const group = data?.group;
  const currentMember = group?.members.find(
    (m) => m.user.email === clerkUser?.primaryEmailAddress?.emailAddress
  );
  const currentUserId = currentMember?.userId ?? "";
  const currentUserRole = currentMember?.role ?? "MEMBER";
  const isOwner = group?.ownerId === currentUserId;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--emerald)" }} />
        </div>
      </AppLayout>
    );
  }

  if (isError || !group) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Access Denied
          </h2>
          <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>
            You don&apos;t have permission to view this workspace.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[13px] font-semibold cursor-pointer"
            style={{ color: "var(--emerald)" }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* ── Back link ─────────────────────────────────────────────────────── */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 text-[12px] font-medium mb-6 cursor-pointer group transition-colors"
          style={{ color: "var(--text-tertiary)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")}
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Dashboard
        </button>

        {/* ── Group Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <h1
                className="text-2xl font-bold truncate"
                style={{
                  color: "var(--text-primary)",
                  letterSpacing: "-0.025em",
                  fontFamily: "var(--font-inter)",
                }}
              >
                {group.name}
              </h1>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                style={{
                  backgroundColor: "var(--bg-float)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-tertiary)",
                }}
              >
                {group.currency}
              </span>
            </div>

            {group.description && (
              <p className="text-[13px] mb-3" style={{ color: "var(--text-secondary)" }}>
                {group.description}
              </p>
            )}

            {/* Members */}
            <div className="flex items-center gap-2.5">
              <div className="flex -space-x-2">
                {group.members.slice(0, 6).map((member) => (
                  <div key={member.id} className="relative" title={member.user.fullName}>
                    <Image
                      src={member.user.avatarUrl}
                      alt={member.user.fullName}
                      width={26}
                      height={26}
                      className="rounded-full object-cover"
                      style={{ border: "2px solid var(--bg-ground)" }}
                    />
                    {member.role === "OWNER" && (
                      <Crown
                        className="absolute -top-1 -right-1 h-3 w-3"
                        style={{ color: "var(--warning)" }}
                      />
                    )}
                  </div>
                ))}
                {group.members.length > 6 && (
                  <div
                    className="h-[26px] w-[26px] rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      backgroundColor: "var(--bg-float)",
                      border: "2px solid var(--bg-ground)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    +{group.members.length - 6}
                  </div>
                )}
              </div>
              <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                <Users className="h-3 w-3" />
                {group.members.length} {group.members.length === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="flex items-center gap-1.5 rounded-xl text-[12px] font-medium cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: "var(--bg-raised)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  padding: "7px 14px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Member
              </button>
            )}
            {/* Group Settings — visible to all members */}
            <button
              onClick={() => setIsGroupSettingsOpen(true)}
              className="h-8 w-8 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-tertiary)",
              }}
              title="Group Settings"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
              }}
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Underline Tab Navigation ───────────────────────────────────────── */}
        <div
          className="flex gap-6 border-b mb-6"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex items-center gap-1.5 pb-3 text-[13px] font-medium cursor-pointer transition-colors duration-150"
                style={{
                  color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                  borderBottom: "2px solid transparent",
                  marginBottom: "-1px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full"
                    style={{ backgroundColor: "var(--emerald)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === "expenses" && (
              <ExpensesTab
                groupId={groupId}
                groupCurrency={group.currency}
                members={group.members}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
              />
            )}
            {activeTab === "balances" && (
              <BalancesTab
                groupId={groupId}
                groupCurrency={group.currency}
                currentUserId={currentUserId}
              />
            )}
            {activeTab === "settlements" && (
              <SettlementsTab
                groupId={groupId}
                groupCurrency={group.currency}
                currentUserId={currentUserId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {isOwner && (
        <AddMemberModal
          isOpen={isAddMemberOpen}
          onOpenChange={setIsAddMemberOpen}
          groupId={groupId}
        />
      )}

      {/* Group Settings Drawer — available to all members, role-gated inside */}
      <GroupSettingsDrawer
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
        group={group}
        currentUserId={currentUserId}
      />
    </AppLayout>
  );
}
