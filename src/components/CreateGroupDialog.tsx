"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createGroupSchema } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type CreateGroupInput = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateGroupDialog({ isOpen, onOpenChange }: CreateGroupDialogProps) {
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "USD"
    }
  });

  // Query mutation to handle API request to create group
  const mutation = useMutation({
    mutationFn: async (data: CreateGroupInput) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to create group");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries so lists reload dynamically
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["command-palette-groups"] });
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      setErrorMsg(err.message);
    }
  });

  const onSubmit = (data: CreateGroupInput) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        reset();
        setErrorMsg(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md border border-white/5 bg-zinc-950/95 backdrop-blur-md p-6 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">Create Workspace Group</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Organize household bills, vacation expenses, or dinner tabs with roommates and friends.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
              {errorMsg}
            </div>
          )}

          {/* Group Name */}
          <div className="space-y-1">
            <label htmlFor="group-name" className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Group Name</label>
            <Input
              id="group-name"
              placeholder="e.g. Apartment 4B, Europe Trip"
              className="bg-zinc-900/40 border-white/5 text-white placeholder-muted-foreground focus-visible:ring-brand-violet"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[10px] text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Group Description */}
          <div className="space-y-1">
            <label htmlFor="group-description" className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Description (Optional)</label>
            <textarea
              id="group-description"
              placeholder="Detail what these shared expenses are about..."
              className="flex min-h-[80px] w-full rounded-md border border-white/5 bg-zinc-900/40 px-3 py-2 text-sm shadow-sm placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-violet text-white"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[10px] text-rose-400 mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Currency Selection */}
          <div className="space-y-1">
            <label htmlFor="group-currency" className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Base Currency</label>
            <div className="relative">
              <select
                id="group-currency"
                className="flex h-9 w-full rounded-md border border-white/5 bg-zinc-900/40 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-violet text-white font-medium cursor-pointer"
                {...register("currency")}
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            {errors.currency && (
              <p className="text-[10px] text-rose-400 mt-1">{errors.currency.message}</p>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-white cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-brand-violet hover:bg-brand-violet/90 text-white font-medium cursor-pointer flex items-center gap-1.5"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
