import { SignIn } from "@clerk/nextjs";
import AuroraField from "@/components/AuroraField";

// ─── Sign In Page — Full Split Layout ────────────────────────────────────────
// Left: Brand identity column with aurora + marketing copy
// Right: Auth form column with Clerk component

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-void)" }}
    >
      {/* ── LEFT PANEL: Brand Identity ──────────────────────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "var(--bg-void)" }}
      >
        {/* Aurora background effect */}
        <div className="absolute inset-0">
          <AuroraField primaryHue={158} secondaryHue={192} intensity={0.9} />
        </div>

        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-30" />

        {/* Content — above aurora */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--emerald) 0%, var(--cyan) 100%)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M2 4h6M2 10h8"
                  stroke="var(--bg-void)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span
              className="text-lg font-bold"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.025em",
                fontFamily: "var(--font-inter)",
              }}
            >
              BalanceOS
            </span>
          </div>

          {/* Headline in Instrument Serif */}
          <h1
            className="text-5xl leading-[1.05] mb-6"
            style={{
              fontFamily: "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            Where shared money
            <br />
            becomes{" "}
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, var(--emerald) 0%, var(--cyan) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              shared clarity.
            </em>
          </h1>

          <p
            className="text-base leading-relaxed mb-10 max-w-sm"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-inter)" }}
          >
            Precision expense-sharing for the people you trust. Track every
            dollar, split every bill, settle every debt — transparently.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              "Real-time balances",
              "Smart split engine",
              "Team workspaces",
              "Instant settlement",
            ].map((feat) => (
              <div
                key={feat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
                style={{
                  backgroundColor: "rgba(15,212,146,0.08)",
                  border: "1px solid rgba(15,212,146,0.18)",
                  color: "var(--emerald)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--emerald)" }}
                />
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: mini product preview card */}
        <div className="relative z-10">
          <div
            className="rounded-2xl p-4"
            style={{
              backgroundColor: "rgba(20,27,36,0.75)",
              border: "1px solid var(--border-subtle)",
              backdropFilter: "blur(16px)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase mb-3"
              style={{ color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
            >
              Current net position
            </p>
            <div className="flex items-end gap-2 mb-3">
              <span
                className="text-3xl font-semibold"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: "var(--emerald)",
                  letterSpacing: "-0.02em",
                }}
              >
                +$247.50
              </span>
              <span
                className="text-[11px] pb-1"
                style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-jetbrains-mono)" }}
              >
                across 3 groups
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Europe Trip", amount: "+$120.00", positive: true },
                { label: "Apartment", amount: "+$87.50", positive: true },
                { label: "Ski Weekend", amount: "+$40.00", positive: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    {item.label}
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono)",
                      color: item.positive ? "var(--credit)" : "var(--debt)",
                    }}
                  >
                    {item.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Form ──────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16"
        style={{
          backgroundColor: "var(--bg-ground)",
          borderLeft: "1px solid var(--border-subtle)",
        }}
      >
        <div className="w-full max-w-sm">
          {/* Form header */}
          <div className="mb-8">
            {/* Logo for mobile (hidden on desktop) */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center"
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
                style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
              >
                BalanceOS
              </span>
            </div>

            <h2
              className="text-2xl font-bold mb-2"
              style={{
                color: "var(--text-primary)",
                letterSpacing: "-0.025em",
                fontFamily: "var(--font-inter)",
              }}
            >
              Sign in to BalanceOS
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Continue to your workspace
            </p>
          </div>

          {/* Clerk component — deeply themed */}
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#0FD492",
                colorBackground: "#141B24",
                colorForeground: "#E8EFF7",
                colorMutedForeground: "#8896A8",
                colorNeutral: "#8896A8",
                colorDanger: "#F43F5E",
                fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
                borderRadius: "8px",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-none bg-transparent p-0 w-full",
                card: "bg-transparent shadow-none w-full gap-4",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton:
                  "border text-sm font-medium h-10 transition-colors duration-150",
                formButtonPrimary:
                  "h-10 text-sm font-semibold transition-all duration-150 shadow-none",
                formFieldLabel:
                  "text-[10px] font-semibold uppercase tracking-wider mb-1",
                formFieldInput:
                  "h-10 text-sm transition-all duration-150",
                footerActionText: "text-sm",
                footerActionLink: "text-sm font-semibold",
                dividerText: "text-xs",
                identityPreviewText: "text-sm font-medium",
                identityPreviewEditButtonLink: "text-sm font-medium",
                alert: "text-sm rounded-lg",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
