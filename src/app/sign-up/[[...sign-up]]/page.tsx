import { SignUp } from "@clerk/nextjs";
import AuroraField from "@/components/AuroraField";

// ─── Sign Up Page — Full Split Layout (Mirrored) ─────────────────────────────
// Left: Auth form column with Clerk component
// Right: Social proof + product preview column

export default function SignUpPage() {
  const stats = [
    { value: "$4.2M+", label: "tracked in expenses" },
    { value: "12,000+", label: "active group workspaces" },
    { value: "98%", label: "debt resolution rate" },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-void)" }}
    >
      {/* ── LEFT PANEL: Auth Form ───────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16"
        style={{
          backgroundColor: "var(--bg-ground)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div className="w-full max-w-sm">
          {/* Form header */}
          <div className="mb-8">
            {/* Logo for mobile */}
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
              Create your workspace
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Free forever. No credit card required.
            </p>
          </div>

          {/* Clerk sign up */}
          <SignUp
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
                alert: "text-sm rounded-lg",
              },
            }}
          />
        </div>
      </div>

      {/* ── RIGHT PANEL: Social Proof ───────────────────────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden"
        style={{ backgroundColor: "var(--bg-void)" }}
      >
        {/* Aurora — cyan-shifted for visual differentiation from sign-in */}
        <div className="absolute inset-0">
          <AuroraField primaryHue={192} secondaryHue={255} intensity={0.85} />
        </div>
        <div className="absolute inset-0 dot-grid opacity-25" />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-3">
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
            style={{ color: "var(--text-primary)", letterSpacing: "-0.025em" }}
          >
            BalanceOS
          </span>
        </div>

        {/* Center: headline + stats */}
        <div className="relative z-10">
          <h2
            className="text-4xl leading-[1.1] mb-8"
            style={{
              fontFamily: "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif",
              color: "var(--text-primary)",
            }}
          >
            Join teams who
            <br />
            <em
              style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, var(--cyan) 0%, var(--emerald) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              split smarter.
            </em>
          </h2>

          {/* Stats */}
          <div className="space-y-4">
            {stats.map((stat) => (
              <div
                key={stat.value}
                className="flex items-baseline gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: "rgba(20,27,36,0.60)",
                  border: "1px solid var(--border-subtle)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <span
                  className="text-2xl font-semibold"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    color: "var(--cyan)",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {stat.value}
                </span>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: trust signal */}
        <div className="relative z-10">
          <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
            No credit card. Free forever. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
