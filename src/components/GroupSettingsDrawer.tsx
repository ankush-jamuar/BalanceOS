"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  X,
  Settings,
  Crown,
  UserMinus,
  Trash2,
  AlertTriangle,
  Loader2,
  Shield,
  Users,
} from "lucide-react";

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

interface GroupSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentUserId: string;
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmDestructive,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ backgroundColor: "rgba(6,8,11,0.75)" }}
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none px-4"
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6 pointer-events-auto"
              style={{
                backgroundColor: "var(--bg-float)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--glow-card)",
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.20)" }}
                >
                  <AlertTriangle className="h-4 w-4" style={{ color: "var(--debt)" }} />
                </div>
                <div>
                  <h3
                    className="text-[15px] font-bold"
                    style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                  >
                    {title}
                  </h3>
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {message}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
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
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all"
                  style={{
                    backgroundColor: confirmDestructive ? "rgba(244,63,94,0.12)" : "rgba(15,212,146,0.12)",
                    color: confirmDestructive ? "var(--debt)" : "var(--emerald)",
                    border: `1px solid ${confirmDestructive ? "rgba(244,63,94,0.25)" : "var(--emerald-border)"}`,
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GroupSettingsDrawer({
  isOpen,
  onClose,
  group,
  currentUserId,
}: GroupSettingsDrawerProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [confirmRemove, setConfirmRemove] = useState<GroupMember | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwner = group.ownerId === currentUserId;

  // ── Remove Member ──────────────────────────────────────────────────────────

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/groups/${group.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to remove member");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setConfirmRemove(null);
      setErrorMsg(null);
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setConfirmRemove(null);
    },
  });

  // ── Delete Group ───────────────────────────────────────────────────────────

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/groups/${group.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to delete group");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      onClose();
      router.push("/dashboard");
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setConfirmDelete(false);
    },
  });

  const handleRemoveMember = (member: GroupMember) => {
    setErrorMsg(null);
    setConfirmRemove(member);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55]"
              style={{ backgroundColor: "rgba(6,8,11,0.60)", backdropFilter: "blur(4px)" }}
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed right-0 top-0 h-full z-[60] w-[420px] flex flex-col overflow-hidden"
              style={{
                backgroundColor: "var(--bg-float)",
                borderLeft: "1px solid var(--border-default)",
                boxShadow: "-24px 0 80px -12px rgba(0,0,0,0.6)",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "var(--bg-overlay)" }}
                  >
                    <Settings className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <h2
                      className="text-[15px] font-bold"
                      style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                    >
                      Group Settings
                    </h2>
                    <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {group.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "var(--bg-overlay)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin">

                {/* Error banner */}
                {errorMsg && (
                  <div
                    className="flex items-start gap-2.5 rounded-xl p-3 text-[12px]"
                    style={{
                      backgroundColor: "rgba(244,63,94,0.08)",
                      border: "1px solid rgba(244,63,94,0.20)",
                      color: "var(--debt)",
                    }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-1.5">
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.1em] px-3"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Group Info
                  </p>
                  <div
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Name</span>
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {group.name}
                      </span>
                    </div>
                    {group.description && (
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[11px] shrink-0" style={{ color: "var(--text-tertiary)" }}>Description</span>
                        <span className="text-[12px] text-right" style={{ color: "var(--text-secondary)" }}>
                          {group.description}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Currency</span>
                      <span
                        className="text-[11px] font-mono px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "var(--bg-float)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {group.currency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>Created</span>
                      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {new Date(group.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-3">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Members
                    </p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {group.members.length}
                      </span>
                    </div>
                  </div>
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    {group.members.map((member, index) => {
                      const isMemberOwner = member.userId === group.ownerId;
                      const isCurrentUser = member.userId === currentUserId;
                      const canRemove = isOwner && !isMemberOwner && !isCurrentUser;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 px-4 py-3 transition-colors"
                          style={{
                            borderBottom: index < group.members.length - 1 ? "1px solid var(--border-subtle)" : "none",
                          }}
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <Image
                              src={member.user.avatarUrl}
                              alt={member.user.fullName}
                              width={32}
                              height={32}
                              className="rounded-lg object-cover"
                              style={{ border: "1.5px solid var(--border-subtle)" }}
                            />
                            {isMemberOwner && (
                              <div
                                className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                              >
                                <Crown className="h-2.5 w-2.5" style={{ color: "var(--warning)" }} />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className="text-[13px] font-semibold truncate"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {member.user.fullName}
                              </p>
                              {isCurrentUser && (
                                <span
                                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                                  style={{
                                    backgroundColor: "rgba(15,212,146,0.10)",
                                    color: "var(--emerald)",
                                    border: "1px solid var(--emerald-border)",
                                  }}
                                >
                                  You
                                </span>
                              )}
                              {isMemberOwner && (
                                <span
                                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                                  style={{
                                    backgroundColor: "rgba(245,158,11,0.10)",
                                    color: "var(--warning)",
                                    border: "1px solid rgba(245,158,11,0.20)",
                                  }}
                                >
                                  Owner
                                </span>
                              )}
                            </div>
                            <p
                              className="text-[10px] truncate mt-0.5"
                              style={{ color: "var(--text-tertiary)" }}
                            >
                              {member.user.email}
                            </p>
                          </div>

                          {/* Remove button */}
                          {canRemove && (
                            <button
                              onClick={() => handleRemoveMember(member)}
                              disabled={removeMemberMutation.isPending}
                              className="h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer transition-all shrink-0"
                              style={{ color: "var(--text-tertiary)" }}
                              title="Remove member"
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.10)";
                                (e.currentTarget as HTMLElement).style.color = "var(--debt)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                              }}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Owner section */}
                {!isOwner && (
                  <div
                    className="flex items-center gap-2.5 rounded-xl p-3 text-[12px]"
                    style={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Shield className="h-4 w-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
                    Only the group owner can manage members and settings.
                  </div>
                )}

                {/* Danger zone — owner only */}
                {isOwner && (
                  <div className="space-y-1.5">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.1em] px-3"
                      style={{ color: "var(--debt)" }}
                    >
                      Danger Zone
                    </p>
                    <div
                      className="rounded-xl p-4"
                      style={{
                        backgroundColor: "rgba(244,63,94,0.04)",
                        border: "1px solid rgba(244,63,94,0.15)",
                      }}
                    >
                      <p className="text-[12px] mb-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        Deleting this group will permanently remove all expenses, balances, and chat messages. This action cannot be undone.
                      </p>
                      <button
                        onClick={() => {
                          setErrorMsg(null);
                          setConfirmDelete(true);
                        }}
                        className="flex items-center gap-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-all px-4 py-2"
                        style={{
                          backgroundColor: "rgba(244,63,94,0.10)",
                          color: "var(--debt)",
                          border: "1px solid rgba(244,63,94,0.20)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.16)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.10)";
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete Group
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remove Member confirm */}
      <ConfirmModal
        isOpen={!!confirmRemove}
        title={`Remove ${confirmRemove?.user.fullName}?`}
        message={`This will remove ${confirmRemove?.user.fullName} from the group. They must have a zero net balance to be removed.`}
        confirmLabel="Remove Member"
        confirmDestructive
        isLoading={removeMemberMutation.isPending}
        onConfirm={() => {
          if (confirmRemove) {
            removeMemberMutation.mutate(confirmRemove.id);
          }
        }}
        onCancel={() => {
          setConfirmRemove(null);
        }}
      />

      {/* Delete Group confirm */}
      <ConfirmModal
        isOpen={confirmDelete}
        title="Delete Group?"
        message={`"${group.name}" and all its data will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete Group"
        confirmDestructive
        isLoading={deleteGroupMutation.isPending}
        onConfirm={() => deleteGroupMutation.mutate()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
