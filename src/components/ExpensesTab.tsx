"use client";

import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Loader2,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import AddExpenseModal, { ExpenseToEdit } from "@/components/AddExpenseModal";

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

interface ExpenseSplit {
  userId: string;
  amountOwed: number;
  percentageValue: number | null;
  sharesValue: number | null;
  user: UserProfile;
}

interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  paidByUserId: string;
  splitMethod: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARES";
  createdAt: string;
  paidByUser: UserProfile;
  splits: ExpenseSplit[];
}

interface ExpensesPage {
  expenses: Expense[];
  totalCount: number;
  nextPage: number | null;
  page: number;
}

interface ExpensesTabProps {
  groupId: string;
  groupCurrency: string;
  members: GroupMember[];
  currentUserId: string;
  currentUserRole: string;
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  expense,
  groupId,
  onClose,
}: {
  expense: Expense;
  groupId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm mx-4 rounded-2xl border border-white/5 bg-zinc-950/95 backdrop-blur-md p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Delete Expense</h3>
            <p className="text-[10px] text-muted-foreground">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-xs text-slate-300 mb-6">
          Are you sure you want to delete{" "}
          <span className="font-bold text-white">&ldquo;{expense.title}&rdquo;</span>? All split
          records will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer flex items-center gap-1.5"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExpensesTab({
  groupId,
  groupCurrency,
  members,
  currentUserId,
  currentUserRole,
}: ExpensesTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseToEdit | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<ExpensesPage>({
      queryKey: ["group-expenses", groupId],
      queryFn: async ({ pageParam }) => {
        const res = await fetch(
          `/api/groups/${groupId}/expenses?page=${pageParam as number}&limit=10`
        );
        if (!res.ok) throw new Error("Failed to fetch expenses");
        return res.json();
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    });

  const expenses = data?.pages.flatMap((p) => p.expenses) ?? [];
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
    });

  const canManage = (expense: Expense) =>
    expense.paidByUserId === currentUserId || currentUserRole === "OWNER";

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground">
            {totalCount} expense{totalCount !== 1 ? "s" : ""} in this group
          </p>
        </div>
        <Button
          onClick={() => {
            setExpenseToEdit(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 bg-brand-violet hover:bg-brand-violet/90 text-white text-xs font-bold cursor-pointer rounded-xl px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-zinc-900/40 animate-pulse border border-white/5"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-rose-400 text-sm">
          Failed to load expenses. Please refresh.
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center mb-4">
            <Receipt className="h-6 w-6 text-brand-violet/60" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No expenses yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Add your first shared expense and choose how to split it.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {expenses.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-2xl border border-white/5 bg-zinc-950/30 hover:border-brand-violet/20 hover:bg-zinc-900/20 transition-all duration-200 p-4 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: icon + text */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-brand-violet/10 border border-brand-violet/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Receipt className="h-4 w-4 text-brand-violet" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">{expense.title}</h3>
                        <span className="text-[9px] font-mono font-bold text-muted-foreground border border-white/5 px-1.5 py-0.5 rounded bg-zinc-900/40 shrink-0">
                          {expense.splitMethod}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Image
                          src={expense.paidByUser.avatarUrl}
                          alt={expense.paidByUser.fullName}
                          width={16}
                          height={16}
                          className="h-4 w-4 rounded-full border border-white/10"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          Paid by{" "}
                          <span className="text-slate-300 font-medium">
                            {expense.paidByUser.fullName}
                          </span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(expense.createdAt)}
                        </span>
                      </div>
                      {expense.description && (
                        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                          {expense.description}
                        </p>
                      )}
                      {/* Splits preview */}
                      <div className="flex -space-x-1 mt-2">
                        {expense.splits.slice(0, 6).map((split) => (
                          <Image
                            key={split.userId}
                            src={split.user.avatarUrl}
                            alt={split.user.fullName}
                            width={18}
                            height={18}
                            title={`${split.user.fullName}: ${formatAmount(split.amountOwed)}`}
                            className="h-4.5 w-4.5 rounded-full border-2 border-zinc-950 object-cover"
                          />
                        ))}
                        {expense.splits.length > 6 && (
                          <div className="h-[18px] w-[18px] rounded-full bg-zinc-800 border-2 border-zinc-950 flex items-center justify-center text-[7px] font-bold text-slate-400">
                            +{expense.splits.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-base font-black text-white tabular-nums">
                      {formatAmount(expense.amount)}
                    </span>
                    {canManage(expense) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setExpenseToEdit({
                              id: expense.id,
                              title: expense.title,
                              description: expense.description,
                              amount: expense.amount,
                              paidByUserId: expense.paidByUserId,
                              splitMethod: expense.splitMethod,
                              splits: expense.splits,
                            });
                            setIsAddOpen(true);
                          }}
                          className="h-7 w-7 rounded-lg bg-zinc-800/60 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-brand-violet hover:border-brand-violet/30 transition-all cursor-pointer"
                          title="Edit expense"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setExpenseToDelete(expense)}
                          className="h-7 w-7 rounded-lg bg-zinc-800/60 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="ghost"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-muted-foreground hover:text-white flex items-center gap-1.5 text-xs cursor-pointer"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Load more expenses
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddOpen}
        onOpenChange={setIsAddOpen}
        groupId={groupId}
        groupCurrency={groupCurrency}
        members={members}
        currentUserId={currentUserId}
        expenseToEdit={expenseToEdit}
      />

      <AnimatePresence>
        {expenseToDelete && (
          <DeleteConfirmDialog
            expense={expenseToDelete}
            groupId={groupId}
            onClose={() => setExpenseToDelete(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
