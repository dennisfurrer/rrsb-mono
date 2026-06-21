import type { CSSProperties } from "react";

// Stylized "Ulster Banner" - the government flag of Northern Ireland used until 1972/1973.
export function NorthernIrelandFlagIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 30" style={{ display: "inline-block", ...style }}>
      <rect x={0} y={0} width={40} height={30} fill="#ffffff" />
      <rect x={0} y={11} width={40} height={8} fill="#c8102e" />
      <rect x={16} y={0} width={8} height={30} fill="#c8102e" />
      <polygon points="20,8 26.06,18.5 13.94,18.5" fill="#ffffff" stroke="#c8102e" strokeWidth={0.6} />
      <polygon points="20,22 13.94,11.5 26.06,11.5" fill="#ffffff" stroke="#c8102e" strokeWidth={0.6} />
      <circle cx={20} cy={15} r={4} fill="#ffffff" stroke="#c8102e" strokeWidth={0.5} />
      <rect x={17.5} y={8.4} width={5} height={1.6} rx={0.3} fill="#f4c430" stroke="#b8860b" strokeWidth={0.3} />
      <polygon points="17.6,8.4 18.6,8.4 18.1,5.9" fill="#f4c430" stroke="#b8860b" strokeWidth={0.3} />
      <polygon points="18.9,8.4 21.1,8.4 20,4.8" fill="#f4c430" stroke="#b8860b" strokeWidth={0.3} />
      <polygon points="21.4,8.4 22.4,8.4 21.9,5.9" fill="#f4c430" stroke="#b8860b" strokeWidth={0.3} />
      <circle cx={18.1} cy={5.9} r={0.45} fill="#f4c430" />
      <circle cx={20} cy={4.8} r={0.5} fill="#f4c430" />
      <circle cx={21.9} cy={5.9} r={0.45} fill="#f4c430" />
      <rect x={18.2} y={13} width={3.6} height={2.4} rx={0.8} fill="#c8102e" />
      <rect x={18.4} y={11.3} width={0.65} height={1.8} rx={0.3} fill="#c8102e" />
      <rect x={19.15} y={11} width={0.65} height={2} rx={0.3} fill="#c8102e" />
      <rect x={19.9} y={11} width={0.65} height={2} rx={0.3} fill="#c8102e" />
      <rect x={20.65} y={11.3} width={0.65} height={1.8} rx={0.3} fill="#c8102e" />
      <rect x={17.3} y={13.2} width={0.9} height={1.4} rx={0.3} fill="#c8102e" />
    </svg>
  );
}
