"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, UserCheck, AlertTriangle } from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchedUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddMemberModal({ isOpen, onOpenChange, groupId }: AddMemberModalProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // User search query with debounce
  const { data: searchResults, isLoading: isSearching } = useQuery<{ users: SearchedUser[] }>({
    queryKey: ["user-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { users: [] };
      const res = await fetch(`/api/users/search?query=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedQuery.trim().length >= 2,
  });

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedQuery(value), 350);
    setDebounceTimer(timer);
  };

  // Add member mutation
  const mutation = useMutation({
    mutationFn: async (user: SearchedUser) => {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to add member");
      }
      return res.json();
    },
    onSuccess: (_, user) => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setSuccessMsg(`${user.fullName} has been added to the group!`);
      setQuery("");
      setDebouncedQuery("");
    },
    onError: (err) => {
      setErrorMsg(err.message);
    },
  });

  const handleClose = () => {
    setQuery("");
    setDebouncedQuery("");
    setErrorMsg(null);
    setSuccessMsg(null);
    onOpenChange(false);
  };

  const users = searchResults?.users ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6 shadow-2xl rounded-2xl" style={{ backgroundColor: "var(--bg-float)", border: "1px solid var(--border-default)" }}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Add Group Member
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Search for a registered BalanceOS user by name, email, or username.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Success message */}
          {successMsg && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Search input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              Search Users
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
              )}
              <Input
                placeholder="Search by name, email, or username..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="bg-zinc-900/40 border-white/5 text-white pl-9 pr-9 placeholder-muted-foreground focus-visible:ring-brand-violet"
              />
            </div>
          </div>

          {/* Results */}
          {debouncedQuery.trim().length >= 2 && (
            <div className="rounded-xl border border-white/5 bg-zinc-900/30 overflow-hidden">
              {users.length === 0 && !isSearching ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No users found matching &ldquo;{debouncedQuery}&rdquo;
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {users.slice(0, 6).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 p-3 hover:bg-zinc-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Image
                          src={user.avatarUrl}
                          alt={user.fullName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            @{user.username} · {user.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          mutation.mutate(user);
                        }}
                        disabled={mutation.isPending && mutation.variables?.id === user.id}
                        className="h-7 text-[10px] font-bold cursor-pointer rounded-lg px-3 shrink-0"
                        style={{
                          backgroundColor: "rgba(15,212,146,0.12)",
                          color: "var(--emerald)",
                          border: "1px solid var(--emerald-border)",
                        }}
                      >
                        {mutation.isPending && mutation.variables?.id === user.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Add"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-2 border-t border-white/5">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-muted-foreground hover:text-white cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
