"use client";

import { useEffect, useRef } from "react";

// ─── Aurora Field Component ───────────────────────────────────────────────────
// A cursor-reactive aurora effect using canvas.
// Creates flowing, organic light bands that respond to mouse movement.
// Used on auth pages (left panel) and landing page hero.

interface AuroraFieldProps {
  className?: string;
  /** Primary hue — controls the dominant aurora color (degrees, 0–360) */
  primaryHue?: number;
  /** Secondary hue */
  secondaryHue?: number;
  /** Opacity of the entire effect (0–1) */
  intensity?: number;
}

export default function AuroraField({
  className = "",
  primaryHue = 158,    // Emerald: ~158°
  secondaryHue = 192,  // Cyan: ~192°
  intensity = 0.7,
}: AuroraFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match container
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Track mouse position normalized 0–1
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Aurora rendering — multiple overlapping radial gradients
    // that shift position based on time and mouse
    const draw = () => {
      timeRef.current += 0.003;
      const t = timeRef.current;
      const { x: mx, y: my } = mouseRef.current;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Helper to draw one aurora band
      const drawBand = (
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        hue: number,
        alpha: number
      ) => {
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
        gradient.addColorStop(0, `hsla(${hue}, 80%, 55%, ${alpha})`);
        gradient.addColorStop(0.5, `hsla(${hue + 15}, 70%, 45%, ${alpha * 0.4})`);
        gradient.addColorStop(1, `hsla(${hue + 30}, 60%, 35%, 0)`);

        ctx.save();
        ctx.scale(1, ry / rx);
        ctx.beginPath();
        ctx.arc(cx, cy * (rx / ry), rx, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
      };

      // Band 1: Large primary — moves with slow sine + mouse influence
      drawBand(
        w * (0.3 + Math.sin(t * 0.7) * 0.15 + mx * 0.1),
        h * (0.6 + Math.cos(t * 0.5) * 0.12 + my * 0.08),
        w * 0.55,
        h * 0.45,
        primaryHue,
        intensity * 0.18
      );

      // Band 2: Secondary — offset phase
      drawBand(
        w * (0.7 + Math.cos(t * 0.6) * 0.12 - mx * 0.08),
        h * (0.3 + Math.sin(t * 0.8) * 0.10 - my * 0.06),
        w * 0.45,
        h * 0.50,
        secondaryHue,
        intensity * 0.14
      );

      // Band 3: Small violet accent — fast, reactive to cursor
      drawBand(
        w * (0.5 + mx * 0.25 - 0.125 + Math.sin(t * 1.1) * 0.08),
        h * (0.5 + my * 0.25 - 0.125 + Math.cos(t * 0.9) * 0.08),
        w * 0.28,
        h * 0.32,
        258, // violet
        intensity * 0.08
      );

      // Band 4: Thin bright streak — simulates aurora curtain
      drawBand(
        w * (0.2 + Math.sin(t * 0.4 + 1) * 0.25 + mx * 0.05),
        h * (0.8 + Math.cos(t * 0.6) * 0.08),
        w * 0.35,
        h * 0.15,
        primaryHue + 20,
        intensity * 0.10
      );

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
    };
  }, [primaryHue, secondaryHue, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ mixBlendMode: "screen" }}
      aria-hidden="true"
    />
  );
}
