"use client";

import Navbar from "./Navbar";
import AmbientGlow from "./AmbientGlow";
import { motion } from "framer-motion";

export default function PremiumLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background grid overlay */}
      <div className="absolute inset-0 z-0 grid-bg opacity-75" />
      
      {/* Layered cinematic radial glows */}
      {/* 1. Static top-center lighting gradient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-full max-w-[1200px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.12),transparent_75%)] z-0" />

      {/* 2. Floating drifting violet blob */}
      <motion.div
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -30, 40, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-brand-violet/10 blur-[120px] z-0"
      />

      {/* 3. Floating drifting emerald blob (credits) */}
      <motion.div
        animate={{
          x: [0, -40, 60, 0],
          y: [0, 50, -30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="pointer-events-none absolute top-[40%] -right-40 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] z-0"
      />

      {/* 4. Floating drifting blue/indigo blob */}
      <motion.div
        animate={{
          x: [0, 30, -50, 0],
          y: [0, 40, 20, 0],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear",
        }}
        className="pointer-events-none absolute -bottom-40 left-[20%] h-[550px] w-[550px] rounded-full bg-blue-500/5 blur-[120px] z-0"
      />
      
      {/* Cursor reactive mouse tracking glow */}
      <AmbientGlow />

      {/* Navigation Header */}
      <Navbar />

      {/* Main App Page Context */}
      <main className="relative z-10">{children}</main>
    </div>
  );
}
