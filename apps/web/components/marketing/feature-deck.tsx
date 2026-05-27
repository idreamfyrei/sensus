"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Pattern = "stripes-v" | "stripes-h" | "dots" | "halftone" | "grid";

type Card = {
  id: string;
  title: string;
  body: string;
  bg: string;
  ink: string;
  artBg: string;
  pattern: Pattern;
};

const CARDS: Card[] = [
  {
    id: "themes",
    title: "Pick a feeling.",
    body: "Calm, loud, soft, retro, gallery quiet. The whole form takes the mood. Your form starts looking like you, not like a default form.",
    bg: "#D85A28",
    ink: "#FFF4D6",
    artBg: "#C04E20",
    pattern: "stripes-v",
  },
  {
    id: "sections",
    title: "Tell a story.",
    body: "Break the form into parts. Walk people through one question at a time, or put it all on a single page. You set the pace.",
    bg: "#F2EAD8",
    ink: "#3D2E1A",
    artBg: "#E6DCC4",
    pattern: "grid",
  },
  {
    id: "logic",
    title: "Skip what doesn't fit.",
    body: "Questions can hide, appear, or be required based on earlier answers. Nobody answers boxes that don't apply to them.",
    bg: "#1B5BA8",
    ink: "#D4F0FF",
    artBg: "#164D8E",
    pattern: "dots",
  },
  {
    id: "responses",
    title: "Watch them come in.",
    body: "Every answer, every view, who finished, who left. See the room without leaving your desk. Download it all whenever.",
    bg: "#5DBA85",
    ink: "#0F3D1F",
    artBg: "#4FA873",
    pattern: "halftone",
  },
  {
    id: "share",
    title: "Send it anywhere.",
    body: "One link, no signup wall. Make it public if you want, keep it unlisted if you don't. Nothing stands between people and the form.",
    bg: "#1A1A1A",
    ink: "#F2EAD8",
    artBg: "#0E0E0E",
    pattern: "stripes-h",
  },
];

const FAN_POSITIONS = [
  { x: -340, y: 30, rot: -8 },
  { x: -180, y: 0, rot: 4 },
  { x: -10, y: 50, rot: -2 },
  { x: 160, y: 10, rot: 1 },
  { x: 320, y: 40, rot: 5 },
];

const CARD_W = 300;
const CARD_H = 420;

function patternStyle(card: Card): React.CSSProperties {
  const fg = card.ink;
  switch (card.pattern) {
    case "stripes-v":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${fg} 0, ${fg} 1.5px, transparent 1.5px, transparent 10px)`,
        opacity: 0.55,
      };
    case "stripes-h":
      return {
        backgroundImage: `repeating-linear-gradient(0deg, ${fg} 0, ${fg} 1.5px, transparent 1.5px, transparent 8px)`,
        opacity: 0.4,
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(${fg} 1.4px, transparent 2px)`,
        backgroundSize: "11px 11px",
        opacity: 0.45,
      };
    case "halftone":
      return {
        backgroundImage: `radial-gradient(${fg} 2px, transparent 3px)`,
        backgroundSize: "14px 14px",
        opacity: 0.35,
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(0deg, ${fg} 1px, transparent 1px), linear-gradient(90deg, ${fg} 1px, transparent 1px)`,
        backgroundSize: "16px 16px",
        opacity: 0.3,
      };
  }
}

const SOFT_SPRING = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.9,
} as const;

export function FeatureDeck() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Outside click resets
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setActiveId(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Esc resets
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveId(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const anyActive = activeId !== null;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Desktop deck */}
      <div className="hidden md:block w-full">
        <div
          ref={containerRef}
          className="relative mx-auto"
          style={{ width: "100%", maxWidth: 980, height: 560 }}
        >
          <div className="absolute left-1/2 top-1/2">
            {CARDS.map((card, i) => {
              const isActive = card.id === activeId;
              const fan = FAN_POSITIONS[i] ?? FAN_POSITIONS[0] ?? { x: 0, y: 0, rot: 0 };

              // When something is active, non-active cards peek up from
              // BEHIND the active card: they're spread side-by-side in a
              // row below the deck center, only their top portions visible
              // because the active card overlaps them.
              const otherIndex = CARDS.filter((c) => c.id !== activeId).findIndex(
                (c) => c.id === card.id,
              );
              const others = CARDS.length - 1;
              const peekSlot = others > 1 ? otherIndex / (others - 1) - 0.5 : 0;
              const peekX = peekSlot * 540;
              const peekRotate = (otherIndex - (others - 1) / 2) * 1.5;

              let x: number;
              let y: number;
              let rotate: number;
              let scale: number;

              if (isActive) {
                x = 0;
                y = -10;
                rotate = 0;
                scale = 1;
              } else if (anyActive) {
                // peek out from below the active card
                x = peekX;
                y = 200;
                rotate = peekRotate;
                scale = 0.95;
              } else {
                x = fan.x;
                y = fan.y;
                rotate = fan.rot;
                scale = 1;
              }

              return (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveId(isActive ? null : card.id);
                  }}
                  initial={{
                    y: 380,
                    scale: 0.6,
                    opacity: 0,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    x: `calc(-50% + ${x}px)`,
                    y: `calc(-50% + ${y}px)`,
                    rotate,
                    scale,
                    opacity: 1,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    ...SOFT_SPRING,
                    delay: anyActive ? 0 : i * 0.05,
                  }}
                  whileHover={
                    anyActive
                      ? { y: `calc(-50% + ${y - 12}px)` }
                      : { scale: 1.04, y: `calc(-50% + ${y - 10}px)` }
                  }
                  whileTap={{ scale: isActive ? 1 : 0.97 }}
                  className="absolute outline-none rounded-[20px] focus-visible:ring-4 focus-visible:ring-white/40 cursor-pointer"
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    background: card.bg,
                    color: card.ink,
                    zIndex: isActive ? 50 : anyActive ? 10 + otherIndex : 10 + i,
                    boxShadow: isActive
                      ? "0 40px 80px -20px rgba(0,0,0,0.65), 0 14px 30px -10px rgba(0,0,0,0.45)"
                      : "0 14px 30px -14px rgba(0,0,0,0.55)",
                    transformOrigin: "50% 50%",
                    willChange: "transform",
                  }}
                >
                  <CardArt card={card} />
                  <CardCopy card={card} isActive={isActive} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* control row centered below */}
        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="flex items-center justify-center gap-2">
            {CARDS.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId(c.id === activeId ? null : c.id);
                }}
                aria-label={`Focus card ${i + 1}`}
                aria-pressed={c.id === activeId}
                className={`h-1.5 rounded-full transition-all ${
                  c.id === activeId ? "w-10 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
          <AnimatePresence>
            {anyActive && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-xs uppercase tracking-[0.25em] text-white/40 mt-1"
              >
                click anywhere to fan them back out
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile stack */}
      <div className="md:hidden w-full space-y-5">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="rounded-[20px] overflow-hidden"
            style={{
              background: card.bg,
              color: card.ink,
              boxShadow: "0 12px 28px -12px rgba(0,0,0,0.4)",
            }}
          >
            <div className="px-5 pt-5">
              <div
                className="rounded-xl overflow-hidden relative"
                style={{ background: card.artBg, height: 130 }}
              >
                <div className="absolute inset-0" style={patternStyle(card)} />
              </div>
            </div>
            <div className="p-5 space-y-3">
              <h3
                className="text-3xl leading-tight"
                style={{
                  fontFamily: "var(--font-fraunces), Georgia, serif",
                  color: card.ink,
                  fontWeight: 500,
                }}
              >
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: card.ink, opacity: 0.85 }}>
                {card.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardArt({ card }: { card: Card }) {
  return (
    <div
      aria-hidden
      className="absolute rounded-[14px] overflow-hidden"
      style={{
        left: 18,
        top: 18,
        right: 18,
        height: 160,
        background: card.artBg,
      }}
    >
      <div className="absolute inset-0" style={patternStyle(card)} />
    </div>
  );
}

function CardCopy({ card, isActive }: { card: Card; isActive: boolean }) {
  return (
    <div className="absolute left-5 right-5" style={{ top: 196, bottom: 18 }}>
      <motion.h3
        animate={{
          fontSize: isActive ? 30 : 26,
        }}
        transition={SOFT_SPRING}
        style={{
          fontFamily: "var(--font-fraunces), Georgia, serif",
          color: card.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        {card.title}
      </motion.h3>

      <motion.p
        animate={{
          opacity: isActive ? 1 : 0,
          filter: isActive ? "blur(0px)" : "blur(6px)",
          y: isActive ? 0 : 6,
        }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3"
        style={{
          color: card.ink,
          fontSize: 14,
          lineHeight: 1.55,
        }}
      >
        {card.body}
      </motion.p>
    </div>
  );
}
