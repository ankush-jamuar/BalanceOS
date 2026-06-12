"use client";

import { useUser } from "@clerk/nextjs";
import { X, User, Mail, AtSign, Shield, Bell, Palette, ExternalLink, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p
        className="text-[10px] font-bold uppercase tracking-[0.1em] px-3"
        style={{ color: "var(--text-tertiary)" }}
      >
        {title}
      </p>
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--bg-raised)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  iconColor?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      <div
        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--bg-float)" }}
      >
        <Icon
          className="h-3.5 w-3.5"
          style={{ color: iconColor || "var(--text-secondary)" }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
          {label}
        </p>
        {value && (
          <p className="text-[13px] font-medium truncate mt-0.5" style={{ color: "var(--text-primary)" }}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    onClose();
    await signOut();
    router.push("/");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(6,8,11,0.60)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 h-full z-50 w-[380px] flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--bg-float)",
              borderLeft: "1px solid var(--border-default)",
              boxShadow: "-24px 0 80px -12px rgba(0,0,0,0.6)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div>
                <h2 className="text-[15px] font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  Settings
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Account &amp; preferences
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
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
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 scrollbar-thin">

              {/* Profile card */}
              <div
                className="rounded-xl p-4 flex items-center gap-4"
                style={{
                  background: "linear-gradient(135deg, rgba(15,212,146,0.06) 0%, rgba(34,211,238,0.04) 100%)",
                  border: "1px solid var(--emerald-border)",
                }}
              >
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || "Profile"}
                    width={52}
                    height={52}
                    className="rounded-xl object-cover shrink-0"
                    style={{ border: "2px solid var(--emerald-border)" }}
                  />
                ) : (
                  <div
                    className="h-[52px] w-[52px] rounded-xl flex items-center justify-center text-xl font-bold shrink-0"
                    style={{ backgroundColor: "var(--bg-overlay)", color: "var(--emerald)" }}
                  >
                    {user?.firstName?.[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    {user?.fullName || "Anonymous"}
                  </p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                  <div
                    className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "rgba(15,212,146,0.10)",
                      color: "var(--emerald)",
                      border: "1px solid var(--emerald-border)",
                    }}
                  >
                    Active
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <SettingsSection title="Account">
                <SettingsRow
                  icon={User}
                  label="Full Name"
                  value={user?.fullName || "—"}
                  iconColor="var(--cyan)"
                />
                <SettingsRow
                  icon={Mail}
                  label="Email Address"
                  value={user?.primaryEmailAddress?.emailAddress || "—"}
                  iconColor="var(--violet)"
                />
                <SettingsRow
                  icon={AtSign}
                  label="Username"
                  value={user?.username ? `@${user.username}` : "—"}
                  iconColor="var(--emerald)"
                />
              </SettingsSection>

              {/* Security */}
              <SettingsSection title="Security">
                <SettingsRow
                  icon={Shield}
                  label="Authentication"
                  value="Managed by Clerk"
                  iconColor="var(--warning)"
                />
                <div
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--bg-float)" }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" style={{ color: "var(--text-secondary)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                      Manage Account
                    </p>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      Update password, 2FA &amp; connected accounts
                    </p>
                  </div>
                </div>
              </SettingsSection>

              {/* Preferences */}
              <SettingsSection title="Preferences">
                <SettingsRow
                  icon={Bell}
                  label="Notifications"
                  value="Realtime updates enabled"
                  iconColor="var(--cyan)"
                />
                <SettingsRow
                  icon={Palette}
                  label="Theme"
                  value="Deep Graphite (Dark)"
                  iconColor="var(--violet)"
                />
              </SettingsSection>

              {/* App info */}
              <div
                className="rounded-xl p-3 text-center"
                style={{ backgroundColor: "var(--bg-raised)", border: "1px solid var(--border-subtle)" }}
              >
                <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                  BalanceOS · Built with Next.js, Prisma, Clerk &amp; Pusher
                </p>
                <p className="text-[9px] mt-0.5 font-mono" style={{ color: "var(--text-tertiary)" }}>
                  v1.0.0-beta
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 border-t shrink-0"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-150"
                style={{
                  color: "var(--debt)",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(244,63,94,0.15)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,63,94,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,63,94,0.25)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(244,63,94,0.15)";
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
