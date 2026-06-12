"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Users,
  MessageSquare,
} from "lucide-react";
import PublicLayout from "@/components/layouts/PublicLayout";
import AuroraField from "@/components/AuroraField";

    <span ref={ref} style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
      {prefix}0{suffix}
    </span>
  );
}

// ─── Hero dashboard preview (3D tilted) ──────────────────────────────────────
function HeroDashboardPreview() {
  return (
    <div
      style={{ perspective: "1200px" }}
      className="w-full max-w-4xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 60, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 4 }}
        transition={{ duration: 1.0, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="rounded-2xl overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
          style={{
            backgroundColor: "var(--bg-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* Browser chrome bar */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-float)" }}
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "rgba(244,63,94,0.5)" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "rgba(245,158,11,0.5)" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "rgba(15,212,146,0.5)" }} />
              <span
                className="ml-4 text-[10px] font-mono"
                style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
              >
                app.balanceos.io/dashboard
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--emerald)" }}
              />
              <span className="text-[10px] font-medium" style={{ color: "var(--emerald)", letterSpacing: "0.04em" }}>
                LIVE
              </span>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="flex" style={{ height: "340px" }}>
            {/* Mini sidebar */}
            <div
              className="w-[160px] shrink-0 border-r p-3 flex flex-col gap-1"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-raised)" }}
            >
              <div
                className="h-7 rounded-lg flex items-center gap-2 px-2 mb-3"
                style={{ backgroundColor: "rgba(15,212,146,0.08)" }}
              >
                <div className="h-2 w-2 rounded" style={{ backgroundColor: "var(--emerald)" }} />
                <div className="h-2 w-14 rounded" style={{ backgroundColor: "var(--text-primary)", opacity: 0.7 }} />
              </div>
              {[60, 45, 50, 38].map((w, i) => (
                <div key={i} className="h-6 rounded-lg flex items-center gap-2 px-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--text-tertiary)" }} />
                  <div className="h-1.5 rounded" style={{ backgroundColor: "var(--text-tertiary)", width: `${w}%`, opacity: 0.4 }} />
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 p-5 overflow-hidden">
              {/* Balance cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "You owe", amount: "$45.00", color: "var(--debt)" },
                  { label: "Owed to you", amount: "+$220.00", color: "var(--credit)" },
                  { label: "Net position", amount: "+$175.00", color: "var(--cyan)" },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-xl p-3"
                    style={{
                      backgroundColor: "var(--bg-float)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <p className="text-[9px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {card.label}
                    </p>
                    <p
                      className="text-base font-semibold"
                      style={{ fontFamily: "var(--font-jetbrains-mono)", color: card.color, letterSpacing: "-0.02em" }}
                    >
                      {card.amount}
                    </p>
                  </div>
                ))}
              </div>

              {/* Expense rows */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-subtle)" }}
              >
                <div
                  className="px-4 py-2 border-b"
                  style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-float)" }}
                >
                  <p className="text-[9px] font-semibold uppercase" style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}>
                    Recent Expenses
                  </p>
                </div>
                {[
                  { title: "Ski Cabin Rental", amount: "$450.00", share: "$150.00", badge: "EQUAL", color: "var(--emerald)" },
                  { title: "Group Dinner", amount: "$120.00", share: "$40.00", badge: "SHARES", color: "var(--cyan)" },
                  { title: "Road Trip Gas", amount: "$75.00", share: "$25.00", badge: "%", color: "var(--violet)" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2.5 border-b last:border-0"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{ backgroundColor: `${row.color}15`, color: row.color }}
                      >
                        {row.badge}
                      </div>
                      <p className="text-[11px] font-medium" style={{ color: "var(--text-primary)" }}>{row.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-primary)" }}>{row.amount}</p>
                      <p className="text-[9px]" style={{ fontFamily: "var(--font-jetbrains-mono)", color: "var(--text-tertiary)" }}>Your share: {row.share}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const features = [
    {
      icon: Zap,
      title: "Smart Split Engine",
      desc: "Divide costs with precision. Equal, exact amounts, percentage, or share ratios — computed instantly with zero rounding errors.",
      accent: "var(--emerald)",
      visual: (
        <div className="flex items-end gap-1.5 h-10">
          {[55, 35, 10].map((w, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: `${w}%`,
                height: `${60 + i * 10}%`,
                background: [
                  "linear-gradient(to top, var(--emerald), var(--cyan))",
                  "linear-gradient(to top, var(--cyan), var(--violet))",
                  "linear-gradient(to top, var(--violet), rgba(139,92,246,0.3))",
                ][i],
              }}
            />
          ))}
        </div>
      ),
    },
    {
      icon: Users,
      title: "Group Workspaces",
      desc: "Isolated workspaces for every context — trips, apartments, teams. Add members, track per-person balances, settle transparently.",
      accent: "var(--cyan)",
      visual: (
        <div className="flex -space-x-2">
          {["E", "A", "B", "C"].map((l, i) => (
            <div
              key={i}
              className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0"
              style={{
                backgroundColor: ["var(--emerald)", "var(--cyan)", "var(--violet)", "var(--warning)"][i] + "20",
                borderColor: "var(--bg-void)",
                color: ["var(--emerald)", "var(--cyan)", "var(--violet)", "var(--warning)"][i],
              }}
            >
              {l}
            </div>
          ))}
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold border-2"
            style={{ backgroundColor: "var(--bg-float)", borderColor: "var(--bg-void)", color: "var(--text-secondary)" }}
          >
            +8
          </div>
        </div>
      ),
    },
    {
      icon: MessageSquare,
      title: "Real-time Discussion",
      desc: "Resolve disputes right under the ledger. Pusher-powered messaging delivers context exactly where decisions happen.",
      accent: "var(--violet)",
      visual: (
        <div className="space-y-1.5">
          {[
            { text: "Who paid for the uber?", align: "left", color: "var(--bg-float)" },
            { text: "I did — $24 split 4 ways", align: "right", color: "rgba(15,212,146,0.12)" },
          ].map((msg, i) => (
            <div key={i} className={`flex ${msg.align === "right" ? "justify-end" : ""}`}>
              <div
                className="px-2.5 py-1.5 rounded-xl text-[10px] max-w-[80%]"
                style={{ backgroundColor: msg.color, color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];


  return (
    <PublicLayout>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: "var(--bg-void)" }}>
        {/* Aurora field — signature interaction */}
        <div className="absolute inset-0 z-0">
          <AuroraField primaryHue={158} secondaryHue={192} intensity={1.0} />
        </div>

        {/* Dot grid */}
        <div className="absolute inset-0 z-0 dot-grid opacity-20" />

        {/* Radial vignette at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-40 z-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--bg-void))" }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-5 lg:px-8 pt-24 pb-16 text-center">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-10"
            style={{
              backgroundColor: "rgba(15,212,146,0.07)",
              border: "1px solid rgba(15,212,146,0.18)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--emerald)" }}
            />
            <span
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--emerald)", letterSpacing: "0.10em" }}
            >
              Now in Beta
            </span>
          </motion.div>

          {/* Main headline — Instrument Serif */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif",
              fontSize: "clamp(48px, 8vw, 88px)",
              fontWeight: 400,
              lineHeight: 1.02,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Shared bills.
            <br />
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, var(--emerald) 20%, var(--cyan) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Finally resolved.
            </em>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-7 max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}
          >
            A precision-engineered collaborative expense workspace.
            Track live balances, compute splits four ways, and settle
            debts transparently.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-150"
                style={{
                  backgroundColor: "var(--emerald)",
                  color: "var(--bg-void)",
                  padding: "12px 24px",
                  fontSize: "14px",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 0 40px -8px rgba(15,212,146,0.40)",
                }}
              >
                Open Workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <Link
              href="/sign-in"
              className="inline-flex items-center font-medium rounded-xl transition-all duration-150"
              style={{
                color: "var(--text-secondary)",
                padding: "12px 20px",
                fontSize: "14px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Sign in
            </Link>
          </motion.div>

          {/* Trust signal */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-5 text-[11px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            No credit card · No ads · Free forever
          </motion.p>
        </div>

        {/* Hero dashboard preview */}
        <div className="relative z-10 pb-0 px-5 lg:px-8">
          <HeroDashboardPreview />
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section
        style={{
          backgroundColor: "var(--bg-raised)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="mx-auto max-w-4xl px-5 lg:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { value: "$4.2M+", label: "in tracked expenses" },
            { value: "12,000+", label: "active group workspaces" },
            { value: "98%", label: "debt resolution rate" },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                className="text-3xl font-semibold mb-1"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: "var(--cyan)",
                  letterSpacing: "-0.03em",
                }}
              >
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section
        className="relative py-24"
        style={{ backgroundColor: "var(--bg-void)" }}
      >
        <div className="absolute inset-0 line-grid opacity-60" />
        <div className="relative mx-auto max-w-5xl px-5 lg:px-8">
          <div className="text-center mb-16">
            <p
              className="text-[10px] font-semibold uppercase mb-3"
              style={{ color: "var(--emerald)", letterSpacing: "0.12em" }}
            >
              Core Architecture
            </p>
            <h2
              className="text-4xl font-bold"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.025em",
                fontFamily: "var(--font-inter)",
              }}
            >
              Everything you need.
              <br />
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                Nothing you don&apos;t.
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="rounded-2xl p-6 group cursor-default"
                  style={{
                    backgroundColor: "var(--bg-raised)",
                    border: "1px solid var(--border-subtle)",
                    transition: "border-color 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = `${feat.accent}30`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                  }}
                >
                  {/* Visual */}
                  <div className="mb-5 h-12 flex items-center">
                    {feat.visual}
                  </div>

                  {/* Icon + title */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${feat.accent}12` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: feat.accent }} />
                    </div>
                    <h3
                      className="text-[15px] font-semibold"
                      style={{ color: "var(--text-primary)", letterSpacing: "-0.015em" }}
                    >
                      {feat.title}
                    </h3>
                  </div>

                  <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {feat.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────────────────────────── */}
      <section
        className="py-24 text-center relative overflow-hidden"
        style={{ backgroundColor: "var(--bg-raised)", borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="absolute inset-0 z-0">
          <AuroraField primaryHue={158} secondaryHue={192} intensity={0.5} />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl px-5">
          <h2
            className="text-4xl mb-6"
            style={{
              fontFamily: "var(--font-instrument-serif), Georgia, serif",
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            Ready to settle{" "}
            <em style={{ fontStyle: "italic", color: "var(--emerald)" }}>smarter?</em>
          </h2>
          <p className="text-base mb-10" style={{ color: "var(--text-secondary)" }}>
            Join the teams who split bills without the awkward conversations.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 font-semibold rounded-xl"
              style={{
                backgroundColor: "var(--emerald)",
                color: "var(--bg-void)",
                padding: "14px 32px",
                fontSize: "15px",
                letterSpacing: "-0.01em",
                boxShadow: "0 0 60px -12px rgba(15,212,146,0.50)",
              }}
            >
              Create free workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
          <p className="mt-4 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            No card required · Set up in 2 minutes
          </p>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer
        className="py-8 text-center border-t"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-void)" }}
      >
        <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
          © {new Date().getFullYear()} BalanceOS · Precision Expense Sharing · Built for design-focused teams
        </p>
      </footer>
    </PublicLayout>
  );
}
