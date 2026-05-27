"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

const SKIN_TONES = ["#f4d4ad", "#e6b58c", "#c89570", "#9a6b46", "#5f3e22"];

const STROKE = "#1a1a1a";
const STROKE_WIDTH = 1.3;

/**
 * Four single-line hand silhouettes. Each is a continuous outline traced
 * in one path: wrist → up the arm → out to the thumb → around the
 * thumb tip → back to the palm → up index → around → down → across to
 * middle → up → around → down → ring → pinky → down the palm right
 * → down the wrist → close.
 *
 * Variations differ only in finger heights and thumb angle, so the
 * crowd reads as different people with different hand shapes without
 * each silhouette becoming a different illustration.
 */
const HAND_PATHS = [
  // open palm, mid finger tallest
  "M 24 160 L 24 132 Q 18 124 14 112 Q 8 100 11 86 Q 16 78 22 84 L 22 80 L 20 78 L 20 40 C 20 32 30 32 30 40 L 30 80 L 32 80 L 32 28 C 32 20 42 20 42 28 L 42 80 L 44 80 L 44 34 C 44 26 54 26 54 34 L 54 80 L 56 80 L 56 46 C 56 38 64 38 64 46 L 64 82 Q 64 100 62 114 Q 58 126 56 132 L 56 160 Z",
  // index taller (pointing-up vibe)
  "M 24 160 L 24 132 Q 19 124 16 114 Q 11 102 13 88 Q 17 80 23 85 L 23 80 L 21 78 L 21 32 C 21 24 30 24 30 32 L 30 78 L 32 78 L 32 30 C 32 22 42 22 42 30 L 42 78 L 44 78 L 44 38 C 44 30 54 30 54 38 L 54 78 L 56 78 L 56 50 C 56 42 64 42 64 50 L 64 82 Q 64 100 62 114 Q 58 126 56 132 L 56 160 Z",
  // shorter, more reserved
  "M 24 160 L 24 132 Q 19 124 15 113 Q 9 100 12 86 Q 17 78 23 84 L 23 80 L 21 78 L 21 46 C 21 38 30 38 30 46 L 30 78 L 32 78 L 32 36 C 32 28 42 28 42 36 L 42 78 L 44 78 L 44 40 C 44 32 54 32 54 40 L 54 78 L 56 78 L 56 52 C 56 44 64 44 64 52 L 64 82 Q 64 100 62 114 Q 58 126 56 132 L 56 160 Z",
  // narrower, more elegant
  "M 26 160 L 26 132 Q 22 124 19 114 Q 13 102 16 88 Q 21 80 26 85 L 26 80 L 24 78 L 24 42 C 24 34 31 34 31 42 L 31 78 L 33 78 L 33 32 C 33 24 41 24 41 32 L 41 78 L 43 78 L 43 36 C 43 28 51 28 51 36 L 51 78 L 53 78 L 53 48 C 53 40 60 40 60 48 L 60 82 Q 60 100 58 114 Q 56 126 54 132 L 54 160 Z",
];

type Hand = {
  variant: number;
  tone: string;
  dip: number;
  delay: number;
  baseRotation: number;
};

function generateCrowd(count: number): Hand[] {
  const out: Hand[] = [];
  for (let i = 0; i < count; i++) {
    const tone = SKIN_TONES[i % SKIN_TONES.length] ?? "#c89570";
    out.push({
      variant: i % HAND_PATHS.length,
      tone,
      dip: 60 + ((i * 13) % 22),
      delay: (i % 6) * 0.06,
      baseRotation: (((i * 7) % 5) - 2) * 0.7,
    });
  }
  return out;
}

function HandFigure({ hand, raised }: { hand: Hand; raised: boolean }) {
  const d = HAND_PATHS[hand.variant];

  return (
    <motion.svg
      viewBox="0 0 80 160"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMax meet"
      animate={{
        y: raised ? 0 : hand.dip,
        rotate: raised
          ? [hand.baseRotation - 1.4, hand.baseRotation + 1.4, hand.baseRotation - 1.4]
          : hand.baseRotation,
      }}
      transition={{
        y: {
          type: "spring",
          stiffness: 60,
          damping: 18,
          delay: hand.delay,
        },
        rotate: raised
          ? {
              duration: 3.6 + hand.delay * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }
          : { duration: 0.5 },
      }}
      style={{
        transformOrigin: "50% 100%",
        display: "block",
      }}
    >
      {/* skin tint */}
      <path d={d} fill={hand.tone} opacity={0.38} />
      {/* line outline */}
      <path
        d={d}
        stroke={STROKE}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </motion.svg>
  );
}

export function HandCrowd({
  height = 180,
  minHandWidth = 56,
  maxHandWidth = 92,
}: {
  height?: number;
  minHandWidth?: number;
  maxHandWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [raisedSet, setRaisedSet] = useState<Set<number>>(new Set());

  useEffect(() => {
    function measure() {
      const el = ref.current;
      if (!el) return;
      const w = el.offsetWidth;
      if (w <= 0) return;
      const target = Math.max(4, Math.min(16, Math.floor(w / (minHandWidth + 14))));
      setCount(target);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [minHandWidth]);

  useEffect(() => {
    if (count === 0) return;
    function pick() {
      const fraction = 0.5 + Math.random() * 0.3;
      const target = Math.max(2, Math.round(count * fraction));
      const next = new Set<number>();
      const indices = Array.from({ length: count }, (_, i) => i);
      for (let i = 0; i < target; i++) {
        const j = i + Math.floor(Math.random() * (indices.length - i));
        const a = indices[i];
        const b = indices[j];
        if (a === undefined || b === undefined) continue;
        indices[i] = b;
        indices[j] = a;
        next.add(b);
      }
      setRaisedSet(next);
    }
    pick();
    const id = setInterval(pick, 3000);
    return () => clearInterval(id);
  }, [count]);

  const crowd = useMemo(() => generateCrowd(count), [count]);
  const handWidth = Math.min(
    maxHandWidth,
    Math.max(minHandWidth, count > 0 ? 1200 / count : minHandWidth),
  );

  return (
    <div ref={ref} className="w-full overflow-hidden" style={{ height }} aria-hidden>
      <div className="w-full h-full flex items-end justify-center" style={{ gap: 6 }}>
        {crowd.map((hand, i) => (
          <div
            key={i}
            style={{
              width: handWidth,
              height,
              flex: "0 0 auto",
            }}
          >
            <HandFigure hand={hand} raised={raisedSet.has(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}
