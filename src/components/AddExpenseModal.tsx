"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Users, SplitSquareHorizontal, Percent, Hash } from "lucide-react";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/useMediaQuery";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberProfile {
  id: string;
  fullName: string;
  avatarUrl: string;
}

interface GroupMember {
  id: string;
  userId: string;
  user: MemberProfile;
}

export interface ExpenseToEdit {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  paidByUserId: string;
  splitMethod: "EQUAL" | "UNEQUAL" | "PERCENTAGE" | "SHARES";
  splits: {
    userId: string;
    amountOwed: number;
    percentageValue: number | null;
    sharesValue: number | null;
  }[];
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupCurrency: string;
  members: GroupMember[];
  currentUserId: string;
  expenseToEdit?: ExpenseToEdit | null;
}

// ─── Form Schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  amountDollars: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Must be a positive number"),
  paidByUserId: z.string().uuid("Please select who paid"),
  splitMethod: z.enum(["EQUAL", "UNEQUAL", "PERCENTAGE", "SHARES"]),
});

type FormValues = z.infer<typeof formSchema>;

const SPLIT_METHODS = [
  { value: "EQUAL", label: "Equal", icon: Users, desc: "Split evenly between all" },
  { value: "UNEQUAL", label: "Exact", icon: DollarSign, desc: "Enter exact amounts" },
  { value: "PERCENTAGE", label: "Percent", icon: Percent, desc: "Split by percentages" },
  { value: "SHARES", label: "Shares", icon: Hash, desc: "Split by share ratios" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddExpenseModal({
  isOpen,
  onOpenChange,
  groupId,
  groupCurrency,
  members,
  currentUserId,
  expenseToEdit,
}: AddExpenseModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isEditing = !!expenseToEdit;

  // Per-member split values: { [userId]: string }
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  // Selected participant user IDs
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      amountDollars: "",
      paidByUserId: currentUserId,
      splitMethod: "EQUAL",
    },
  });

  const splitMethod = watch("splitMethod");
  const amountDollars = watch("amountDollars");
  const totalCents = Math.round(parseFloat(amountDollars || "0") * 100) || 0;

  // ── Pre-fill form when editing ──────────────────────────────────────────────
  useEffect(() => {
    if (expenseToEdit && isOpen) {
      setValue("title", expenseToEdit.title);
      setValue("description", expenseToEdit.description ?? "");
      setValue("amountDollars", (expenseToEdit.amount / 100).toFixed(2));
      setValue("paidByUserId", expenseToEdit.paidByUserId);
      setValue("splitMethod", expenseToEdit.splitMethod);

      const parts = new Set(expenseToEdit.splits.map((s) => s.userId));
      setSelectedParticipants(parts);

      const vals: Record<string, string> = {};
      expenseToEdit.splits.forEach((s) => {
        if (expenseToEdit.splitMethod === "UNEQUAL") {
          vals[s.userId] = (s.amountOwed / 100).toFixed(2);
        } else if (expenseToEdit.splitMethod === "PERCENTAGE") {
          vals[s.userId] = (s.percentageValue ?? 0).toString();
        } else if (expenseToEdit.splitMethod === "SHARES") {
          vals[s.userId] = (s.sharesValue ?? 1).toString();
        }
      });
      setSplitValues(vals);
    } else if (!expenseToEdit && isOpen) {
      reset({
        title: "",
        description: "",
        amountDollars: "",
        paidByUserId: currentUserId,
        splitMethod: "EQUAL",
      });
      setSelectedParticipants(new Set(members.map((m) => m.userId)));
      setSplitValues({});
      setErrorMsg(null);
    }
  }, [expenseToEdit, isOpen, reset, setValue, currentUserId, members]);

  // ── Equal-split preview ─────────────────────────────────────────────────────
  const getEqualAmount = useCallback(() => {
    const n = selectedParticipants.size;
    if (n === 0 || totalCents === 0) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: groupCurrency,
    }).format(totalCents / n / 100);
  }, [totalCents, selectedParticipants.size, groupCurrency]);

  // ── Validate custom splits ──────────────────────────────────────────────────
  const getSplitValidationMessage = (): string | null => {
    const participants = [...selectedParticipants];
    if (participants.length === 0) return "Select at least one participant";
    if (splitMethod === "UNEQUAL") {
      const sum = participants.reduce(
        (acc, uid) => acc + (parseFloat(splitValues[uid] || "0") * 100),
        0
      );
      if (Math.abs(Math.round(sum) - totalCents) > 1) {
        return `Exact amounts must sum to ${(totalCents / 100).toFixed(2)} (currently ${(sum / 100).toFixed(2)})`;
      }
    }
    if (splitMethod === "PERCENTAGE") {
      const sum = participants.reduce(
        (acc, uid) => acc + parseFloat(splitValues[uid] || "0"),
        0
      );
      if (Math.abs(sum - 100) > 0.01) {
        return `Percentages must sum to 100% (currently ${sum.toFixed(1)}%)`;
      }
    }
    return null;
  };

  // ── Mutation ────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const participants = [...selectedParticipants];
      const splits = participants.map((uid) => ({
        userId: uid,
        value: splitMethod !== "EQUAL" ? parseFloat(splitValues[uid] || "0") : undefined,
      }));

      const payload = {
        groupId,
        title: data.title,
        description: data.description || null,
        amount: Math.round(parseFloat(data.amountDollars) * 100),
        paidByUserId: data.paidByUserId,
        splitMethod: data.splitMethod,
        splits,
      };

      const url = isEditing ? `/api/expenses/${expenseToEdit!.id}` : "/api/expenses";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to save expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-expenses", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-balances", groupId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      handleClose();
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const handleClose = () => {
    reset();
    setErrorMsg(null);
    setSelectedParticipants(new Set(members.map((m) => m.userId)));
    setSplitValues({});
    onOpenChange(false);
  };

  const onSubmit = (data: FormValues) => {
    const validationMsg = getSplitValidationMessage();
    if (validationMsg) {
      setErrorMsg(validationMsg);
      return;
    }
    setErrorMsg(null);
    mutation.mutate(data);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // ─── Form Content ────────────────────────────────────────────────────────────

  const content = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2 overflow-y-auto max-h-[80vh] pr-1">
      {errorMsg && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
          {errorMsg}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          Expense Title *
        </label>
        <Input
          placeholder="e.g. Dinner at Nobu, Electricity Bill"
          className="bg-zinc-900/40 border-white/5 text-white placeholder-muted-foreground focus-visible:ring-emerald"
          {...register("title")}
        />
        {errors.title && <p className="text-[10px] text-rose-400">{errors.title.message}</p>}
      </div>

      {/* Amount + Paid By */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            Amount ({groupCurrency}) *
          </label>
          <div className="relative">
            <SplitSquareHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="bg-zinc-900/40 border-white/5 text-white pl-8 placeholder-muted-foreground focus-visible:ring-emerald"
              {...register("amountDollars")}
            />
          </div>
          {errors.amountDollars && (
            <p className="text-[10px] text-rose-400">{errors.amountDollars.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            Paid By *
          </label>
          <Controller
            name="paidByUserId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="flex h-9 w-full rounded-md border border-white/5 bg-zinc-900/40 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald text-white cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.fullName}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.paidByUserId && (
            <p className="text-[10px] text-rose-400">{errors.paidByUserId.message}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          Description (Optional)
        </label>
        <textarea
          placeholder="Optional notes about this expense..."
          className="flex min-h-[64px] w-full rounded-md border border-white/5 bg-zinc-900/40 px-3 py-2 text-sm shadow-sm placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald text-white resize-none"
          {...register("description")}
        />
      </div>

      {/* Split Method */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          Split Method
        </label>
        <Controller
          name="splitMethod"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-4 gap-1.5">
              {SPLIT_METHODS.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => field.onChange(value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center transition-all duration-200 cursor-pointer ${
                    field.value === value
                      ? "border-emerald/60 bg-emerald/10 text-emerald"
                      : "border-white/5 bg-zinc-900/20 text-muted-foreground hover:border-white/10 hover:text-white"
                  }`}
                  title={desc}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Participants & Custom Split Values */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            Participants
          </label>
          {splitMethod === "EQUAL" && totalCents > 0 && (
            <span className="text-[9px] text-emerald font-bold">
              {getEqualAmount()} each
            </span>
          )}
        </div>
        <div className="space-y-1.5">
          {members.map((member) => {
            const isSelected = selectedParticipants.has(member.userId);
            return (
              <div
                key={member.userId}
                className={`flex items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
                  isSelected
                    ? "border-emerald/30 bg-emerald/5"
                    : "border-white/5 bg-zinc-900/20 opacity-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleParticipant(member.userId)}
                  className="flex items-center gap-2.5 flex-1 cursor-pointer text-left"
                >
                  <div
                    className={`h-4 w-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-emerald bg-emerald"
                        : "border-white/20 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5l2.5 2.5L8 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <Image
                    src={member.user.avatarUrl}
                    alt={member.user.fullName}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full border border-white/10"
                  />
                  <span className="text-xs font-medium text-white">{member.user.fullName}</span>
                </button>

                {/* Custom split input */}
                {isSelected && splitMethod !== "EQUAL" && (
                  <div className="flex items-center gap-1 ml-2">
                    <Input
                      type="number"
                      step={splitMethod === "UNEQUAL" ? "0.01" : "1"}
                      min="0"
                      placeholder={
                        splitMethod === "UNEQUAL"
                          ? "0.00"
                          : splitMethod === "PERCENTAGE"
                          ? "%"
                          : "1"
                      }
                      value={splitValues[member.userId] ?? ""}
                      onChange={(e) =>
                        setSplitValues((prev) => ({
                          ...prev,
                          [member.userId]: e.target.value,
                        }))
                      }
                      className="w-20 h-7 text-xs bg-zinc-900/60 border-white/10 text-white text-right focus-visible:ring-emerald"
                    />
                    <span className="text-[9px] text-muted-foreground w-4 shrink-0">
                      {splitMethod === "PERCENTAGE" ? "%" : splitMethod === "SHARES" ? "sh" : groupCurrency}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/5 sticky bottom-0 bg-zinc-950 pb-1">
        <Button
          type="button"
          variant="ghost"
          onClick={handleClose}
          className="text-muted-foreground hover:text-white cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-emerald hover:bg-emerald/90 text-slate-950 font-semibold cursor-pointer flex items-center gap-1.5"
        >
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg border border-white/5 bg-zinc-950/95 backdrop-blur-md p-6 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white tracking-tight">
              {isEditing ? "Edit Expense" : "Add Expense"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              {isEditing
                ? "Update the details of this shared expense."
                : "Record a shared expense and choose how to split it."}
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent className="border-t border-white/5 bg-zinc-950/98 backdrop-blur-md">
        <DrawerHeader className="text-left px-6 pt-6 pb-2">
          <DrawerTitle className="text-xl font-bold text-white tracking-tight">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground text-xs">
            {isEditing
              ? "Update the details of this shared expense."
              : "Record a shared expense and choose how to split it."}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-6 pb-6">{content}</div>
      </DrawerContent>
    </Drawer>
  );
}
