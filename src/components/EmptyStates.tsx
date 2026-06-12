"use client";

import { motion } from "framer-motion";
import { Users, Receipt, MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
}

/**
 * Empty state for when the user is not member of any group. Renders on Dashboard.
 */
export function NoGroupsState({ onAction, actionLabel = "Create Group" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/25 p-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-brand-violet mb-6">
        <Users className="h-6 w-6 text-brand-violet" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Active Groups Found</h3>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground mb-6">
        Bring clarity to shared bills by creating your first group workspace to start sharing bills.
      </p>
      {onAction && (
        <Button onClick={onAction} className="bg-primary hover:bg-primary/95 text-white gap-2 font-medium cursor-pointer">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Empty state for when a group has no expenses recorded. Renders on Group Tab 1.
 */
export function NoExpensesState({ onAction, actionLabel = "Add Expense" }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-card/25 p-12 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-brand-violet mb-6">
        <Receipt className="h-6 w-6 text-brand-violet" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No Expenses Logged Yet</h3>
      <p className="mx-auto max-w-xs text-sm text-muted-foreground mb-6">
        This group has no transaction history yet. Add an expense to divide costs equally, by shares, or by percentage.
      </p>
      {onAction && (
        <Button onClick={onAction} className="bg-primary hover:bg-primary/95 text-white gap-2 font-medium cursor-pointer">
          <Plus className="h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Empty state for when an expense has no chat messages. Renders on Chat column.
 */
export function EmptyChatState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px]">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border text-muted-foreground mb-4">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200 mb-1">No Discussion Yet</h4>
      <p className="max-w-xs text-xs text-muted-foreground">
        Ask a question, add clarification, or post a receipt link to start the discussion thread.
      </p>
    </div>
  );
}
