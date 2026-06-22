import type { CSSProperties } from "react";

/** Crisp vector replacement for the old pixelated trophy.gif "dancing smiley". */
export function DancingSmiley({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={{ display: "inline-block", overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="dancingSmileyFaceGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3a0" />
          <stop offset="55%" stopColor="#ffd400" />
          <stop offset="100%" stopColor="#e0a800" />
        </radialGradient>
      </defs>

      <g className="dancing-smiley-sparkle dancing-smiley-sparkle-1">
        <path d="M8 10 L10 14 L14 16 L10 18 L8 22 L6 18 L2 16 L6 14 Z" fill="#fff066" />
      </g>
      <g className="dancing-smiley-sparkle dancing-smiley-sparkle-2">
        <path d="M56 6 L57.5 9 L60.5 10.5 L57.5 12 L56 15 L54.5 12 L51.5 10.5 L54.5 9 Z" fill="#7dd3fc" />
      </g>
      <g className="dancing-smiley-sparkle dancing-smiley-sparkle-3">
        <path d="M58 40 L59.2 42.4 L61.6 43.6 L59.2 44.8 L58 47.2 L56.8 44.8 L54.4 43.6 L56.8 42.4 Z" fill="#fb7185" />
      </g>

      <g className="dancing-smiley-wiggle">
        <rect x="23" y="46" width="6" height="13" rx="3" fill="#222" className="dancing-smiley-leg-left" />
        <rect x="35" y="46" width="6" height="13" rx="3" fill="#222" className="dancing-smiley-leg-right" />

        <g className="dancing-smiley-hat">
          <path d="M32 2 L40 18 L24 18 Z" fill="#ff5577" stroke="#3a2a00" strokeWidth="1.2" />
          <circle cx="32" cy="2" r="2.4" fill="#fff066" />
          <rect x="24" y="16.5" width="16" height="2.6" rx="1.3" fill="#ff99aa" />
        </g>

        <circle cx="32" cy="30" r="17" fill="url(#dancingSmileyFaceGrad)" stroke="#3a2a00" strokeWidth="2" />

        <g className="dancing-smiley-glasses">
          <path d="M19 24 L13 22" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M45 24 L51 22" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="19" y="23" width="11" height="7" rx="3" fill="#1a1a1a" />
          <rect x="34" y="23" width="11" height="7" rx="3" fill="#1a1a1a" />
          <rect x="30" y="25" width="4" height="2" fill="#1a1a1a" />
          <path d="M22 25 Q24 26.5 22 28" stroke="#fff" strokeWidth="1" opacity="0.6" fill="none" />
        </g>

        <circle cx="18" cy="36" r="3" fill="#ff9999" opacity="0.55" />
        <circle cx="46" cy="36" r="3" fill="#ff9999" opacity="0.55" />

        <path d="M20 36 Q32 48 44 36 Q32 44 20 36 Z" fill="#a5253a" stroke="#1a1a1a" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M24 37 Q32 43 40 37 Q32 41 24 37 Z" fill="#ffffff" opacity="0.9" />
      </g>

      <circle cx="11" cy="28" r="5.5" fill="#fff" stroke="#3a2a00" strokeWidth="1.5" className="dancing-smiley-arm-left" />
      <circle cx="53" cy="28" r="5.5" fill="#fff" stroke="#3a2a00" strokeWidth="1.5" className="dancing-smiley-arm-right" />
    </svg>
  );
}
