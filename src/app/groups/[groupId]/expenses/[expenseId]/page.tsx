"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Trash2,
  Send,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import Pusher from "pusher-js";
import AppLayout from "@/components/layouts/AppLayout";
import AddExpenseModal, { ExpenseToEdit } from "@/components/AddExpenseModal";

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
  currency: string;
  members: GroupMember[];
  ownerId: string;
}

interface ExpenseSplit {
  id: string;
  userId: string;
  amountOwed: number;
  percentageValue: string | null;
  sharesValue: string | null;
  user: UserProfile;
}

interface Expense {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  amount: number;
  paidByUserId: string;
  splitMethod: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARES";
  createdByUserId: string;
  createdAt: string;
  paidByUser: UserProfile;
  splits: ExpenseSplit[];
}

interface ChatMessage {
  id: string;
  expenseId: string;
  userId: string;
  message: string;
  createdAt: string;
  user: UserProfile;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = use(params);
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────

  // Fetch expense details
  const { data: expenseData, isLoading: isExpenseLoading, isError: isExpenseError } = useQuery<{ expense: Expense }>({
    queryKey: ["expense", expenseId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}`);
      if (!res.ok) throw new Error("Failed to fetch expense");
      return res.json();
    },
    retry: false,
  });

  // Fetch group details (for members/currency context in modal)
  const { data: groupData, isLoading: isGroupLoading } = useQuery<{ group: Group }>({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch group");
      return res.json();
    },
  });

  // Fetch chat thread messages
  const { data: chatData, isLoading: isChatLoading } = useQuery<{ messages: ChatMessage[] }>({
    queryKey: ["expense-messages", expenseId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
  });

  const expense = expenseData?.expense;
  const group = groupData?.group;
  const messages = chatData?.messages ?? [];

  // Determine current user ID from group member list
  const currentMember = group?.members.find(
    (m) => m.user.email === clerkUser?.primaryEmailAddress?.emailAddress
  );
  const currentUserId = currentMember?.userId ?? "";
  const isOwner = group?.ownerId === currentUserId;
  const isCreator = expense?.createdByUserId === currentUserId;
  const isPayer = expense?.paidByUserId === currentUserId;
  const canDelete = isOwner || isCreator || isPayer;

  // ─── Realtime Socket Integration ───────────────────────────────────────────

  useEffect(() => {
    if (!expenseId) return;

    // Retrieve Pusher keys
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn("Pusher keys not configured client-side.");
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channelName = `expense-chat-${expenseId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-message", (data: { message: ChatMessage }) => {
      queryClient.setQueryData<{ messages: ChatMessage[] }>(
        ["expense-messages", expenseId],
        (prev) => {
          if (!prev) return { messages: [data.message] };
          // Deduplicate message check
          if (prev.messages.some((m) => m.id === data.message.id)) return prev;
          return { messages: [...prev.messages, data.message] };
        }
      );
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [expenseId, queryClient]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/expenses/${expenseId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ messages: ChatMessage[] }>(
        ["expense-messages", expenseId],
        (prev) => {
          if (!prev) return { messages: [data.message] };
          if (prev.messages.some((m) => m.id === data.message.id)) return prev;
          return { messages: [...prev.messages, data.message] };
        }
      );
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete expense");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      router.push(`/groups/${groupId}`);
    },
  });

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText.trim());
    setMessageText("");
  };

  const handleDeleteExpense = () => {
    if (confirm("Are you sure you want to delete this expense? This cannot be undone.")) {
      deleteExpenseMutation.mutate();
    }
  };

  // Convert current expense to format expected by AddExpenseModal
  const getExpenseToEdit = (): ExpenseToEdit | null => {
    if (!expense) return null;
    return {
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      paidByUserId: expense.paidByUserId,
      splitMethod: expense.splitMethod,
      splits: expense.splits.map((s) => ({
        userId: s.userId,
        amountOwed: s.amountOwed,
        percentageValue: s.percentageValue ? parseFloat(s.percentageValue) : null,
        sharesValue: s.sharesValue ? parseFloat(s.sharesValue) : null,
      })),
    };
  };

  // ─── Render States ──────────────────────────────────────────────────────────

  if (isExpenseLoading || isGroupLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--emerald)" }} />
        </div>
      </AppLayout>
    );
  }

  if (isExpenseError || !expense || !group) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto px-6 py-24 text-center">
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Expense Not Found
          </h2>
          <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>
            This expense does not exist or you don&apos;t have permissions to view it.
          </p>
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="text-[13px] font-semibold cursor-pointer"
            style={{ color: "var(--emerald)" }}
          >
            ← Back to Group Workspace
          </button>
        </div>
      </AppLayout>
    );
  }

  // Calculate currency format
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: group.currency,
  }).format(expense.amount / 100);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8 h-full flex flex-col">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <button
            onClick={() => router.push(`/groups/${groupId}`)}
            className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer group transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)")}
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Group
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 rounded-xl text-[12px] font-medium cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                padding: "6px 12px",
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
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </button>
            {canDelete && (
              <button
                onClick={handleDeleteExpense}
                disabled={deleteExpenseMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl text-[12px] font-medium cursor-pointer transition-all duration-150"
                style={{
                  backgroundColor: "rgba(244,63,94,0.08)",
                  border: "1px solid rgba(244,63,94,0.18)",
                  color: "var(--debt)",
                  padding: "6px 12px",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.14)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.08)";
                }}
              >
                {deleteExpenseMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            )}
          </div>
        </div>

        {/* ── Two-Column Layout ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
          {/* ── LEFT COLUMN: Details (40% width) ────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 pb-6">
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Title & Description */}
              <h2
                className="text-xl font-bold mb-1.5"
                style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                {expense.title}
              </h2>
              {expense.description && (
                <p className="text-[13px] mb-4" style={{ color: "var(--text-secondary)" }}>
                  {expense.description}
                </p>
              )}

              {/* Amount */}
              <div className="flex items-baseline gap-2 mb-6">
                <span
                  className="text-4xl font-semibold"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    color: "var(--cyan)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {formattedAmount}
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--bg-float)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {expense.splitMethod}
                </span>
              </div>

              {/* Payer & Date Info */}
              <div className="space-y-3 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center gap-3">
                  <Image
                    src={expense.paidByUser.avatarUrl}
                    alt={expense.paidByUser.fullName}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Paid By
                    </p>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {expense.paidByUser.fullName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--bg-float)" }}
                  >
                    <Calendar className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Date Created
                    </p>
                    <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {new Date(expense.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Visualization Centerpiece */}
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase mb-4"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
              >
                Split Shares
              </p>

              {/* Horizontal Stacked Bar */}
              <div className="h-6 w-full rounded-full flex overflow-hidden mb-6 relative" style={{ backgroundColor: "var(--bg-float)" }}>
                {expense.splits.map((split, i) => {
                  const pct = (split.amountOwed / expense.amount) * 100;
                  if (pct <= 0) return null;

                  // Unique colors for visual segmentation
                  const colors = [
                    "linear-gradient(to right, var(--emerald) 0%, var(--cyan) 100%)",
                    "linear-gradient(to right, var(--cyan) 0%, var(--violet) 100%)",
                    "linear-gradient(to right, var(--violet) 0%, #a855f7 100%)",
                    "linear-gradient(to right, #ec4899 0%, #f43f5e 100%)",
                    "linear-gradient(to right, #f59e0b 0%, var(--emerald) 100%)",
                  ];
                  const segmentBg = colors[i % colors.length];

                  return (
                    <div
                      key={split.id}
                      style={{
                        width: `${pct}%`,
                        background: segmentBg,
                      }}
                      className="h-full relative group/segment cursor-default flex items-center justify-center"
                      title={`${split.user.fullName}: ${new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: group.currency,
                      }).format(split.amountOwed / 100)} (${pct.toFixed(1)}%)`}
                    >
                      {/* Floating tooltip */}
                      <div className="absolute bottom-full mb-2 bg-slate-900 border border-slate-700/55 text-[10px] text-white px-2 py-1 rounded shadow-xl opacity-0 pointer-events-none group-hover/segment:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap">
                        {split.user.fullName} · {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: group.currency,
                        }).format(split.amountOwed / 100)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* List of Split Amounts */}
              <div className="space-y-3">
                {expense.splits.map((split) => {
                  const sharePct = ((split.amountOwed / expense.amount) * 100).toFixed(0);
                  const isUserPayer = split.userId === expense.paidByUserId;
                  const shareFormatted = new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: group.currency,
                  }).format(split.amountOwed / 100);

                  return (
                    <div key={split.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Image
                          src={split.user.avatarUrl}
                          alt={split.user.fullName}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                        <div>
                          <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                            {split.user.fullName}
                          </p>
                          <p className="text-[9px] uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>
                            {sharePct}% share
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-[12px] font-semibold"
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            color: "var(--text-primary)",
                          }}
                        >
                          {shareFormatted}
                        </p>
                        {isUserPayer && (
                          <p className="text-[8px] font-semibold text-emerald-400 uppercase tracking-wide">
                            Payer
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Discussion & Chat (60% width) ─────────────────── */}
          <div
            className="lg:col-span-3 flex flex-col rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-raised)",
              border: "1px solid var(--border-subtle)",
              height: "100%",
            }}
          >
            {/* Thread Header */}
            <div
              className="px-5 py-4 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-float)" }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: "var(--cyan)" }} />
                <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
                  Discussion Thread
                </span>
              </div>
              <span className="text-[10px]" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-tertiary)" }}>
                {messages.length} messages
              </span>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 scrollbar-thin">
              {isChatLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-12 w-2/3 rounded-lg animate-pulse"
                      style={{ backgroundColor: "var(--bg-float)" }}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-12">
                  <MessageSquare className="h-8 w-8 mb-2" style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                    No messages yet
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Ask questions or resolve split questions right here.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.userId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : ""}`}>
                      <Image
                        src={msg.user.avatarUrl}
                        alt={msg.user.fullName}
                        width={26}
                        height={26}
                        className="rounded-full object-cover shrink-0 border"
                        style={{ borderColor: "var(--border-subtle)" }}
                      />
                      <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : ""}`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[10px] font-semibold" style={{ color: "var(--text-primary)" }}>
                            {msg.user.fullName}
                          </span>
                          <span className="text-[8px]" style={{ color: "var(--text-tertiary)" }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div
                          className="px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed"
                          style={{
                            backgroundColor: isMe ? "rgba(15,212,146,0.08)" : "var(--bg-float)",
                            color: "var(--text-primary)",
                            border: isMe ? "1px solid rgba(15,212,146,0.18)" : "1px solid var(--border-default)",
                          }}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t shrink-0 flex gap-2"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-float)" }}
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#141B24] border border-white/5 rounded-xl px-4 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={sendMessageMutation.isPending || !messageText.trim()}
                className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer"
                style={{
                  backgroundColor: "var(--emerald)",
                  color: "var(--bg-void)",
                  opacity: messageText.trim() ? 1 : 0.4,
                }}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <AddExpenseModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        groupId={groupId}
        groupCurrency={group.currency}
        members={group.members}
        currentUserId={currentUserId}
        expenseToEdit={getExpenseToEdit()}
      />
    </AppLayout>
  );
}
