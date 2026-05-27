"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Skin tones picked from the Fitzpatrick palette, cycled to represent
 * "anyone, raising a hand". The line art (sleeve + outline) stays
 * constant; only the palm fill crossfades.
 */
const SKIN_TONES = ["#f4d4ad", "#e6b58c", "#c89570", "#9a6b46", "#5f3e22"];

const STROKE = "#1a1a1a";

export function HandRaise({ size = 280 }: { size?: number }) {
  const [tone, setTone] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTone((t) => (t + 1) % SKIN_TONES.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative inline-block select-none"
      style={{ width: size, height: size * 1.15 }}
      aria-label="A hand being raised"
      role="img"
    >
      <motion.svg
        viewBox="0 0 220 260"
        width={size}
        height={size * 1.15}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ originX: "50%", originY: "100%" }}
      >
        {/* skin palm + fingers fill (crossfaded between tones) */}
        <defs>
          <clipPath id="hand-clip">
            <path d="M64 90 C 58 70, 70 38, 84 38 C 94 38, 98 50, 98 64 L 98 96 L 104 96 L 104 30 C 104 18, 114 12, 122 12 C 130 12, 138 18, 138 30 L 138 96 L 144 96 L 144 40 C 144 28, 152 22, 160 22 C 168 22, 174 28, 174 40 L 174 100 L 178 100 L 178 60 C 178 50, 184 44, 192 44 C 200 44, 206 50, 206 60 L 206 130 C 206 170, 184 200, 158 210 L 96 210 C 78 210, 62 196, 58 178 L 50 140 C 46 122, 54 108, 64 108 Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#hand-clip)">
          <AnimatePresence mode="popLayout">
            <motion.rect
              key={tone}
              x={0}
              y={0}
              width={220}
              height={260}
              fill={SKIN_TONES[tone]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
            />
          </AnimatePresence>
        </g>

        {/* sleeve / wrist band */}
        <path
          d="M 50 210 C 50 222, 60 232, 78 232 L 174 232 C 192 232, 202 222, 202 210 L 202 222 C 202 244, 184 254, 162 254 L 92 254 C 70 254, 50 244, 50 222 Z"
          fill={STROKE}
        />
        <path d="M 50 222 L 202 222" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />

        {/* hand outline, single continuous line drawing */}
        <path
          d="M64 90 C 58 70, 70 38, 84 38 C 94 38, 98 50, 98 64 L 98 96 L 104 96 L 104 30 C 104 18, 114 12, 122 12 C 130 12, 138 18, 138 30 L 138 96 L 144 96 L 144 40 C 144 28, 152 22, 160 22 C 168 22, 174 28, 174 40 L 174 100 L 178 100 L 178 60 C 178 50, 184 44, 192 44 C 200 44, 206 50, 206 60 L 206 130 C 206 170, 184 200, 158 210 L 96 210 C 78 210, 62 196, 58 178 L 50 140 C 46 122, 54 108, 64 108 Z"
          stroke={STROKE}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* knuckle / palm crease detail */}
        <path
          d="M 96 110 L 96 140 M 130 96 L 130 130 M 160 102 L 160 138"
          stroke={STROKE}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />
        <path
          d="M 70 150 Q 100 165 150 150"
          stroke={STROKE}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.35"
          fill="none"
        />

        {/* motion sparks above the hand (subtle wave-energy) */}
        <motion.g
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="40" cy="40" r="2.5" fill={STROKE} />
          <circle cx="200" cy="30" r="2" fill={STROKE} />
          <circle cx="60" cy="20" r="1.5" fill={STROKE} />
        </motion.g>
      </motion.svg>
    </div>
  );
}
