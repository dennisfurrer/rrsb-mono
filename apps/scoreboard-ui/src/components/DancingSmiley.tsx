import type { CSSProperties } from "react";

/** Faithful vector recreation of the classic pixel "dancing smiley" trophy.gif. */
function Hand({
  x, y, rotate, scale = 1, className,
}: { x: number; y: number; rotate: number; scale?: number; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <g className={className}>
        <rect x="-4.2" y="-1" width="8.4" height="7" rx="2.2" fill="#ffd400" stroke="#3a1408" strokeWidth="1.4" />
        <rect x="-3.6" y="-7" width="2.1" height="6.5" rx="1" fill="#ffd400" stroke="#3a1408" strokeWidth="1.1" />
        <rect x="-1.05" y="-8" width="2.1" height="7.5" rx="1" fill="#ffd400" stroke="#3a1408" strokeWidth="1.1" />
        <rect x="1.5" y="-7" width="2.1" height="6.5" rx="1" fill="#ffd400" stroke="#3a1408" strokeWidth="1.1" />
        <rect x="-6.2" y="0.5" width="2.6" height="4" rx="1.2" fill="#ffd400" stroke="#3a1408" strokeWidth="1.1" />
      </g>
    </g>
  );
}

export function DancingSmiley({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={{ display: "inline-block", overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="dancingSmileyFaceGrad" cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#fff3a0" />
          <stop offset="55%" stopColor="#ffd400" />
          <stop offset="100%" stopColor="#c98300" />
        </radialGradient>
      </defs>

      <g className="dancing-smiley-wiggle">
        <circle cx="32" cy="30" r="17" fill="url(#dancingSmileyFaceGrad)" stroke="#3a1408" strokeWidth="2.4" />

        <g className="dancing-smiley-pose-grin">
          <path d="M23 26 L29 24" stroke="#3a1408" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M35 24 L41 26" stroke="#3a1408" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <path d="M21 34 Q32 31 43 34 Q41 47 32 47 Q23 47 21 34 Z" fill="#ffffff" stroke="#3a1408" strokeWidth="2.2" />
          <path d="M23.5 35 Q32 33.5 40.5 35" stroke="#3a1408" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </g>

        <g className="dancing-smiley-pose-shout">
          <ellipse cx="32" cy="37" rx="13" ry="11" fill="#0a0a0a" stroke="#3a1408" strokeWidth="2.2" />
          <path d="M21 40 Q23.5 46 26 40 Q28.5 46 31 40 Q33.5 46 36 40 Q38.5 46 41 40 Z" fill="#e8281c" />
        </g>
      </g>

      <g className="dancing-smiley-pose-grin">
        <Hand x={11} y={11} rotate={-25} className="dancing-smiley-hand-a" />
        <Hand x={50} y={38} rotate={150} className="dancing-smiley-hand-b" />
      </g>
      <g className="dancing-smiley-pose-shout">
        <Hand x={5} y={30} rotate={-100} scale={1.05} className="dancing-smiley-hand-c" />
        <Hand x={59} y={30} rotate={100} scale={1.05} className="dancing-smiley-hand-d" />
      </g>
    </svg>
  );
}
