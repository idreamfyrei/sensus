"use client";

import type { CSSProperties, ReactNode } from "react";
import type { RouterOutputs } from "@repo/trpc/client";

type Theme = RouterOutputs["publicForm"]["getBySlug"]["theme"];

type ThemeEffects = {
  scanlines?: boolean;
  glow?: boolean;
  blur?: boolean;
  grain?: boolean;
  halftone?: boolean;
};

function readEffects(theme: Theme): ThemeEffects {
  const raw = theme.effects;
  if (typeof raw !== "object" || raw === null) return {};
  return raw as ThemeEffects;
}

function readableTextOn(hex: string): "#0e0e0e" | "#fffaf0" {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return "#fffaf0";
  const [, r = "00", g = "00", b = "00"] = match;
  const toLinearChannel = (value: string) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  const red = toLinearChannel(r);
  const green = toLinearChannel(g);
  const blue = toLinearChannel(b);
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return luminance > 0.5 ? "#0e0e0e" : "#fffaf0";
}

function themeStyle(theme: Theme): CSSProperties {
  return {
    background: theme.bg,
    color: theme.textColor,
    fontFamily: theme.fontBody,
    minHeight: "100dvh",
    position: "relative",
    overflowX: "hidden",
    ["--sensus-bg" as string]: theme.bg,
    ["--sensus-surface" as string]: theme.surface,
    ["--sensus-primary" as string]: theme.primary,
    ["--sensus-accent" as string]: theme.accent,
    ["--sensus-text" as string]: theme.textColor,
    ["--sensus-muted" as string]: theme.muted,
    ["--sensus-on-primary" as string]: readableTextOn(theme.primary),
    ["--sensus-border-style" as string]: theme.borderStyle,
    ["--sensus-border-radius" as string]: theme.borderRadius,
    ["--sensus-font-heading" as string]: theme.fontHeading,
    ["--sensus-font-body" as string]: theme.fontBody,
  };
}

const OVERLAY_BASE: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 1,
};

function ScanlinesOverlay() {
  return (
    <div
      aria-hidden
      style={{
        ...OVERLAY_BASE,
        backgroundImage:
          "repeating-linear-gradient(to bottom, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

function GrainOverlay() {
  const svg =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>";
  return (
    <div
      aria-hidden
      style={{
        ...OVERLAY_BASE,
        backgroundImage: `url("${svg}")`,
        opacity: 0.18,
        mixBlendMode: "overlay",
      }}
    />
  );
}

function HalftoneOverlay() {
  return (
    <div
      aria-hidden
      style={{
        ...OVERLAY_BASE,
        backgroundImage: "radial-gradient(currentColor 1px, transparent 1.5px)",
        backgroundSize: "8px 8px",
        opacity: 0.08,
      }}
    />
  );
}

function buildCss(effects: ThemeEffects): string {
  const focusGlow = effects.glow
    ? "box-shadow: 0 0 0 4px color-mix(in srgb, var(--sensus-accent) 22%, transparent), 0 0 18px var(--sensus-accent);"
    : "box-shadow: 0 0 0 4px color-mix(in srgb, var(--sensus-primary) 18%, transparent);";
  const cardBlur = effects.blur
    ? "backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);"
    : "";
  return `
    .sensus-themed input,
    .sensus-themed textarea,
    .sensus-themed select {
      background: var(--sensus-surface);
      color: var(--sensus-text);
      border-style: var(--sensus-border-style);
      border-radius: var(--sensus-border-radius);
      border-color: var(--sensus-muted);
      font-family: var(--sensus-font-body);
      min-height: 44px;
      transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
    }
    .sensus-themed input:focus,
    .sensus-themed textarea:focus,
    .sensus-themed select:focus {
      outline: none;
      border-color: var(--sensus-primary);
      ${focusGlow}
    }
    .sensus-themed h1,
    .sensus-themed h2,
    .sensus-themed h3 {
      font-family: var(--sensus-font-heading);
      color: var(--sensus-primary);
    }
    .sensus-themed .sensus-card {
      background: var(--sensus-surface);
      color: var(--sensus-text);
      border: 1px solid var(--sensus-muted);
      border-style: var(--sensus-border-style);
      border-radius: var(--sensus-border-radius);
      box-shadow: 0 24px 80px color-mix(in srgb, var(--sensus-text) 12%, transparent);
      ${cardBlur}
    }
    .sensus-themed .sensus-button-primary {
      background: var(--sensus-primary);
      color: var(--sensus-on-primary);
      border: 1px solid var(--sensus-primary);
      border-radius: var(--sensus-border-radius);
      font-family: var(--sensus-font-heading);
      min-height: 44px;
      transition: transform 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
    }
    .sensus-themed .sensus-button-primary:focus-visible {
      outline: none;
      ${focusGlow}
    }
    .sensus-themed .sensus-button-primary:hover:not(:disabled) {
      background: var(--sensus-accent);
      border-color: var(--sensus-accent);
      transform: translateY(-1px);
    }
    .sensus-themed .sensus-button-primary:active:not(:disabled) {
      transform: translateY(0) scale(0.99);
    }
    .sensus-themed .sensus-muted { color: var(--sensus-muted); }
    .sensus-themed .sensus-accent { color: var(--sensus-accent); }
    @media (prefers-reduced-motion: reduce) {
      .sensus-themed *,
      .sensus-themed *::before,
      .sensus-themed *::after {
        transition-duration: 1ms !important;
        animation-duration: 1ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
}

export function ThemedShell({ theme, children }: { theme: Theme; children: ReactNode }) {
  const effects = readEffects(theme);

  return (
    <div className="sensus-themed" style={themeStyle(theme)}>
      <style dangerouslySetInnerHTML={{ __html: buildCss(effects) }} />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>

      {effects.scanlines && <ScanlinesOverlay />}
      {effects.grain && <GrainOverlay />}
      {effects.halftone && <HalftoneOverlay />}
    </div>
  );
}
