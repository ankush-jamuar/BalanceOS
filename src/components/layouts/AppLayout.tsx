"use client";

import { useRef, useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import CommandPalette from "@/components/CommandPalette";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff } from "lucide-react";

// ─── Cursor-reactive ambient glow for app workspace ───────────────────────────

function WorkspaceGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let targetX = currentX;
    let targetY = currentY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
      }
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-0 h-[400px] w-[400px] rounded-full opacity-[0.04]"
      style={{
        background: "radial-gradient(circle, var(--emerald) 0%, transparent 70%)",
        filter: "blur(60px)",
        willChange: "transform",
      }}
    />
  );
}

// ─── Offline Warning Toast ────────────────────────────────────────────────────

function OfflineToast() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setShowReconnected(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    // Check initial state
    if (!navigator.onLine) {
      setIsOffline(true);
      setWasOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3 text-[12px] font-medium shadow-xl"
          style={{
            backgroundColor: "rgba(244,63,94,0.12)",
            border: "1px solid rgba(244,63,94,0.30)",
            color: "var(--debt)",
            backdropFilter: "blur(16px)",
          }}
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You&apos;re offline — changes will not sync until reconnected</span>
        </motion.div>
      )}
      {showReconnected && !isOffline && (
        <motion.div
          key="reconnected"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 rounded-xl px-4 py-3 text-[12px] font-medium shadow-xl"
          style={{
            backgroundColor: "rgba(15,212,146,0.12)",
            border: "1px solid var(--emerald-border)",
            color: "var(--emerald)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--emerald)" }} />
          <span>Back online — connection restored</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── App Layout (Authenticated Workspace) ─────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-ground)" }}
    >
      {/* Workspace ambient glow */}
      <WorkspaceGlow />

      {/* Left Sidebar — passes a callback that fires a synthetic Cmd+K */}
      <AppSidebar onCommandPalette={() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        );
      }} />

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-y-auto relative"
        style={{ backgroundColor: "var(--bg-ground)" }}
      >
        {/* Subtle top ambient gradient */}
        <div
          className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(15,212,146,0.04) 0%, transparent 100%)",
          }}
        />
        <div className="relative z-10 h-full">
          {children}
        </div>
      </main>

      {/* Command Palette — self-controlled, listens for Cmd+K globally */}
      <CommandPalette />

      {/* Offline Warning Toast */}
      <OfflineToast />
    </div>
  );
}
