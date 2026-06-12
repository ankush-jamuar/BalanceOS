"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Pusher from "pusher-js";
import {
  LayoutDashboard,
  ChevronRight,
  Command,
  Circle,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Group {
  id: string;
  name: string;
  currency: string;
}

interface AppSidebarProps {
  onCommandPalette?: () => void;
}

type RealtimeState = "connected" | "connecting" | "disconnected";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppSidebar({ onCommandPalette }: AppSidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("connecting");

  // Monitor Pusher connection state
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) {
      setRealtimeState("disconnected");
      return;
    }
    const pusher = new Pusher(key, { cluster });
    const update = (state: string) => {
      if (state === "connected") setRealtimeState("connected");
      else if (state === "connecting" || state === "initialized") setRealtimeState("connecting");
      else setRealtimeState("disconnected");
    };
    pusher.connection.bind("state_change", ({ current }: { current: string }) => update(current));
    update(pusher.connection.state);
    return () => { pusher.disconnect(); };
  }, []);

  // Fetch user groups for sidebar listing
  const { data: groupsData } = useQuery<{ groups: Group[] }>({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const groups = groupsData?.groups ?? [];

  // Auto-expand groups section when on a group page
  useEffect(() => {
    if (pathname.startsWith("/groups")) setGroupsExpanded(true);
  }, [pathname]);

  const isDashboardActive = pathname === "/dashboard";

  return (
    <aside
      className="flex flex-col h-full w-[220px] shrink-0 border-r select-none"
      style={{
        backgroundColor: "var(--bg-raised)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 px-4 py-4 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div
          className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--emerald) 0%, var(--cyan) 100%)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7h10M2 4h6M2 10h8"
              stroke="var(--bg-void)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span
          className="text-sm font-bold tracking-tight"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          BalanceOS
        </span>
      </div>

      {/* ── Nav Items ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin space-y-0.5">

        {/* Dashboard */}
        <Link href="/dashboard">
          <div
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-120 cursor-pointer"
            style={{
              backgroundColor: isDashboardActive ? "rgba(15,212,146,0.08)" : "transparent",
              color: isDashboardActive ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" style={{
              color: isDashboardActive ? "var(--emerald)" : "inherit"
            }} />
            Dashboard
          </div>
        </Link>

        {/* Groups section */}
        <div className="pt-3 pb-1">
          <button
            onClick={() => setGroupsExpanded((v) => !v)}
            className="flex items-center justify-between w-full px-2.5 py-1 cursor-pointer group"
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
            >
              Groups
            </span>
            <motion.div
              animate={{ rotate: groupsExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight
                className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-tertiary)" }}
              />
            </motion.div>
          </button>

          <AnimatePresence initial={false}>
            {groupsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-0.5 space-y-0.5">
                  {groups.length === 0 ? (
                    <p
                      className="px-2.5 py-1.5 text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      No groups yet
                    </p>
                  ) : (
                    groups.map((group) => {
                      const isActive = pathname.startsWith(`/groups/${group.id}`);
                      return (
                        <Link key={group.id} href={`/groups/${group.id}`}>
                          <div
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-120 cursor-pointer group"
                            style={{
                              backgroundColor: isActive
                                ? "rgba(15,212,146,0.08)"
                                : "transparent",
                              color: isActive
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                            }}
                          >
                            <Circle
                              className="h-2 w-2 shrink-0 fill-current"
                              style={{
                                color: isActive ? "var(--emerald)" : "var(--text-tertiary)",
                              }}
                            />
                            <span className="truncate">{group.name}</span>
                            <span
                              className="ml-auto text-[9px] font-mono opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
                            >
                              {group.currency}
                            </span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* ── Bottom Actions ─────────────────────────────────────────────────── */}
      <div
        className="px-2 py-3 border-t space-y-0.5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {/* Command palette trigger */}
        <button
          onClick={onCommandPalette}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-120 cursor-pointer group"
          style={{ color: "var(--text-secondary)" }}
        >
          <div className="flex items-center gap-2">
            <Command className="h-3.5 w-3.5" />
            Command Palette
          </div>
          <kbd
            className="text-[9px] px-1.5 py-0.5 rounded border font-mono opacity-50 group-hover:opacity-80 transition-opacity"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--bg-float)",
              color: "var(--text-secondary)",
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Realtime status indicator */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
        >
          <div className="relative h-2 w-2 shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor:
                  realtimeState === "connected" ? "var(--emerald)" :
                  realtimeState === "connecting" ? "var(--warning)" :
                  "var(--debt)",
              }}
            />
            {realtimeState === "connected" && (
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: "var(--emerald)" }}
              />
            )}
          </div>
          <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
            {realtimeState === "connected" ? "Realtime connected" :
             realtimeState === "connecting" ? "Connecting..." :
             "Realtime offline"}
          </span>
        </div>

        {/* User profile */}
        <div
          className="flex items-center gap-2.5 px-2 py-2 rounded-lg mt-1"
          style={{ backgroundColor: "var(--bg-float)" }}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-7 w-7 rounded-lg",
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[12px] font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.firstName} {user?.lastName}
            </p>
            <p
              className="text-[10px] truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
