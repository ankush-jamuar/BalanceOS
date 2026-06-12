"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Plus, Home, Settings, LogOut, Loader2, LayoutGrid } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import SettingsDrawer from "@/components/SettingsDrawer";

interface GroupSummary {
  id: string;
  name: string;
}

interface CommandPaletteProps {
  /** Externally controlled — if provided, this controls open state */
  isOpenExternal?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function CommandPalette({ isOpenExternal, onOpenChange }: CommandPaletteProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();
  const { signOut } = useClerk();

  // Sync internal/external open state
  const paletteOpen = isOpenExternal !== undefined ? isOpenExternal : isOpen;
  const setPaletteOpen = (val: boolean) => {
    setIsOpen(val);
    onOpenChange?.(val);
  };

  // Dynamic search fetch of groups inside the palette (enabled only when visible)
  const { data, isLoading } = useQuery<{ groups: GroupSummary[] }>({
    queryKey: ["command-palette-groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
    enabled: paletteOpen,
  });

  const groups = data?.groups || [];

  // Track global key presses to intercept Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen]);

  const navigateTo = (path: string) => {
    setPaletteOpen(false);
    setSearch("");
    router.push(path);
  };

  const handleOpenSettings = () => {
    setPaletteOpen(false);
    setSearch("");
    setIsSettingsOpen(true);
  };

  const handleSignOut = async () => {
    setPaletteOpen(false);
    await signOut();
    router.push("/");
  };

  // Client-side search filters
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent
          className="max-w-xl overflow-hidden p-0"
          style={{
            backgroundColor: "var(--bg-float)",
            border: "1px solid var(--border-default)",
            boxShadow: "var(--glow-card), 0 0 0 1px rgba(255,255,255,0.04)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          {/* Search Input Bar */}
          <div
            className="flex items-center px-4 py-3.5 border-b"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <Search className="h-4 w-4 mr-3 shrink-0" style={{ color: "var(--text-tertiary)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search groups..."
              className="flex-1 bg-transparent text-[13px] border-none outline-none focus:ring-0"
              style={{ color: "var(--text-primary)" }}
              autoFocus
            />
            <kbd
              className="hidden sm:inline-flex items-center rounded border px-1.5 font-mono text-[10px] font-medium uppercase shadow-sm shrink-0"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-tertiary)",
              }}
            >
              ESC
            </kbd>
          </div>

          {/* Command Listing */}
          <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
            {/* Navigation */}
            <div>
              <div
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Navigation
              </div>
              <button
                onClick={() => navigateTo("/dashboard")}
                className="flex w-full items-center px-3 py-2.5 text-[13px] rounded-lg transition-colors cursor-pointer text-left group"
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
                <div
                  className="mr-3 h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--bg-overlay)" }}
                >
                  <Home className="h-3.5 w-3.5" style={{ color: "var(--cyan)" }} />
                </div>
                Go to Dashboard
              </button>
              <button
                onClick={() => navigateTo("/dashboard")}
                className="flex w-full items-center px-3 py-2.5 text-[13px] rounded-lg transition-colors cursor-pointer text-left group"
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
                <div
                  className="mr-3 h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--bg-overlay)" }}
                >
                  <Plus className="h-3.5 w-3.5" style={{ color: "var(--emerald)" }} />
                </div>
                Create New Group
              </button>
            </div>

            {/* Your Groups */}
            <div className="pt-2">
              <div
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-between"
                style={{ color: "var(--text-tertiary)" }}
              >
                <span>Your Groups</span>
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
              {filteredGroups.length === 0 ? (
                <div className="px-3 py-2 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  {search ? `No groups match "${search}"` : "No active groups found"}
                </div>
              ) : (
                filteredGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => navigateTo(`/groups/${g.id}`)}
                    className="flex w-full items-center px-3 py-2.5 text-[13px] rounded-lg transition-colors cursor-pointer text-left"
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
                    <div
                      className="mr-3 h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--bg-overlay)" }}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" style={{ color: "var(--violet)" }} />
                    </div>
                    {g.name}
                  </button>
                ))
              )}
            </div>

            {/* Account */}
            <div
              className="pt-2 border-t mt-1"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Account
              </div>
              <button
                onClick={handleOpenSettings}
                className="flex w-full items-center px-3 py-2.5 text-[13px] rounded-lg transition-colors cursor-pointer text-left"
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
                <div
                  className="mr-3 h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--bg-overlay)" }}
                >
                  <Settings className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                </div>
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center px-3 py-2.5 text-[13px] rounded-lg transition-colors cursor-pointer text-left"
                style={{ color: "var(--debt)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                <div
                  className="mr-3 h-6 w-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(244,63,94,0.10)" }}
                >
                  <LogOut className="h-3.5 w-3.5" style={{ color: "var(--debt)" }} />
                </div>
                Sign Out
              </button>
            </div>
          </div>

          {/* Footer hint */}
          <div
            className="flex items-center justify-between px-4 py-2 border-t"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              BalanceOS Command Palette
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Navigate</span>
              <kbd
                className="rounded border px-1 font-mono text-[9px]"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-overlay)",
                  color: "var(--text-tertiary)",
                }}
              >↑↓</kbd>
              <kbd
                className="rounded border px-1 font-mono text-[9px]"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--bg-overlay)",
                  color: "var(--text-tertiary)",
                }}
              >↵</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Drawer — mounted at command palette level */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
