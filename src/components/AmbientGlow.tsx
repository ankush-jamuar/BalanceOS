"use client";

import { useEffect } from "react";
import { useMotionValue, useMotionTemplate, motion } from "framer-motion";

export default function AmbientGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Set relative mouse coordinates for radial gradient display
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // radial gradient glow with 600px coverage following the user cursor coordinates
  const background = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(124, 58, 237, 0.05),
      transparent 80%
    )
  `;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 transition duration-300"
      style={{ background }}
    />
  );
}
