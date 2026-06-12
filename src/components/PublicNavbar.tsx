"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";

// ─── Public Navigation Bar ────────────────────────────────────────────────────
// Used on: landing page, sign-in, sign-up
// NOT used in authenticated workspace routes (those use AppLayout with sidebar)

export default function PublicNavbar() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        backgroundColor: "rgba(13,17,23,0.80)",
        borderColor: "var(--border-subtle)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
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
            className="text-[15px] font-bold"
            style={{
              color: "var(--text-primary)",
              letterSpacing: "-0.025em",
              fontFamily: "var(--font-inter)",
            }}
          >
            BalanceOS
          </span>
        </Link>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{ color: "var(--text-secondary)" }}
            >
              Dashboard
            </Link>
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8 rounded-lg" },
              }}
            />
          </Show>
          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="text-[13px] font-medium px-3 py-1.5 rounded-lg transition-all duration-150"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/sign-up"
                className="inline-flex items-center text-[13px] font-semibold px-4 py-1.5 rounded-lg transition-all duration-150"
                style={{
                  backgroundColor: "var(--emerald)",
                  color: "var(--bg-void)",
                  letterSpacing: "-0.01em",
                }}
              >
                Get started
              </Link>
            </motion.div>
          </Show>
        </div>
      </div>
    </header>
  );
}
