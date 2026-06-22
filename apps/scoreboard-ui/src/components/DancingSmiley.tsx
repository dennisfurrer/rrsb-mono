import type { CSSProperties } from "react";

/** Crisp vector replacement for the old pixelated trophy.gif "dancing smiley". */
export function DancingSmiley({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={{ display: "inline-block", overflow: "visible", ...style }}>
      <g className="dancing-smiley-wiggle">
        <circle cx="32" cy="30" r="17" fill="#ffd400" stroke="#3a2a00" strokeWidth="2" />
        <circle cx="25" cy="26" r="2.6" fill="#1a1a1a" />
        <circle cx="39" cy="26" r="2.6" fill="#1a1a1a" />
        <circle cx="18" cy="32" r="3" fill="#ff9999" opacity="0.55" />
        <circle cx="46" cy="32" r="3" fill="#ff9999" opacity="0.55" />
        <path d="M21 35 Q32 46 43 35" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round" />
        <rect x="23" y="46" width="6" height="13" rx="3" fill="#222" />
        <rect x="35" y="46" width="6" height="13" rx="3" fill="#222" />
      </g>
      <circle cx="11" cy="28" r="5.5" fill="#fff" stroke="#3a2a00" strokeWidth="1.5" className="dancing-smiley-arm-left" />
      <circle cx="53" cy="28" r="5.5" fill="#fff" stroke="#3a2a00" strokeWidth="1.5" className="dancing-smiley-arm-right" />
    </svg>
  );
}
