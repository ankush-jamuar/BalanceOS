"use client";

import PublicNavbar from "@/components/PublicNavbar";

// ─── Public Layout ────────────────────────────────────────────────────────────
// Used on: landing page, sign-in, sign-up
// Provides the top navbar + a clean full-viewport base.

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-void)" }}
    >
      <PublicNavbar />
      <div>{children}</div>
    </div>
  );
}
