"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "rrsb-walkthrough-dismissed";
const ACCENT = "#D4A843";
const ACCENT_DIM = "#B8923A";

interface WalkthroughStep {
  id: string;
  target: string;
  questionKey: string;
  subtextKey: string;
  arrowDirection: "top" | "bottom" | "left" | "right";
  offsetX?: number;
}

const STEPS: WalkthroughStep[] = [
  {
    id: "sidebar",
    target: "sidebar-nav",
    questionKey: "walkthrough.steps.sidebar.question",
    subtextKey: "walkthrough.steps.sidebar.subtext",
    arrowDirection: "right",
    offsetX: 80,
  },
  {
    id: "stats",
    target: "stats-grid",
    questionKey: "walkthrough.steps.stats.question",
    subtextKey: "walkthrough.steps.stats.subtext",
    arrowDirection: "bottom",
  },
  {
    id: "match-setup",
    target: "match-setup",
    questionKey: "walkthrough.steps.matchSetup.question",
    subtextKey: "walkthrough.steps.matchSetup.subtext",
    arrowDirection: "left",
  },
  {
    id: "assignments",
    target: "recent-assignments",
    questionKey: "walkthrough.steps.assignments.question",
    subtextKey: "walkthrough.steps.assignments.subtext",
    arrowDirection: "right",
  },
];

/* ── Hand-drawn SVG arrow with organic, sketchy feel ── */
const HandDrawnArrow = ({
  from,
  to,
  flip = false,
  delay = 0,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  flip?: boolean;
  delay?: number;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  const mid1x = from.x + dx * 0.3 + (flip ? -20 : 20);
  const mid1y = from.y + dy * 0.3 + (flip ? 15 : -15);
  const mid2x = from.x + dx * 0.65 + (flip ? -12 : 12);
  const mid2y = from.y + dy * 0.65 + (flip ? -10 : 10);

  const angle = Math.atan2(dy, dx);
  const headLen = 14;
  const head1x = to.x - headLen * Math.cos(angle - 0.45);
  const head1y = to.y - headLen * Math.sin(angle - 0.45);
  const head2x = to.x - headLen * Math.cos(angle + 0.45);
  const head2y = to.y - headLen * Math.sin(angle + 0.45);

  const pathD = `M ${from.x} ${from.y} C ${mid1x} ${mid1y}, ${mid2x} ${mid2y}, ${to.x} ${to.y}`;
  const headD = `M ${head1x} ${head1y} L ${to.x} ${to.y} L ${head2x} ${head2y}`;

  return (
    <g style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <path
        d={pathD}
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={len * 1.5}
        strokeDashoffset={visible ? 0 : len * 1.5}
        style={{
          transition: `stroke-dashoffset 0.8s ease ${delay + 200}ms`,
          filter: "url(#sketchy)",
        }}
      />
      <path
        d={headD}
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity 0.3s ease ${delay + 900}ms`,
          filter: "url(#sketchy)",
        }}
      />
    </g>
  );
};

/* ── Welcome modal ── */
const WelcomeModal = ({
  visible,
  onStart,
  onSkip,
  t,
}: {
  visible: boolean;
  onStart: () => void;
  onSkip: () => void;
  t: (key: string) => string;
}) => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: visible
        ? "translate(-50%, -50%) scale(1)"
        : "translate(-50%, -50%) scale(0.95)",
      opacity: visible ? 1 : 0,
      transition: "all 0.5s ease",
      pointerEvents: visible ? "auto" : "none",
      zIndex: 100,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: "'Caveat', cursive",
        fontSize: "84px",
        color: ACCENT,
        marginBottom: "12px",
        textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        lineHeight: 1,
      }}
    >
      {t("walkthrough.welcome")}
    </div>
    <p
      style={{
        fontSize: "22px",
        color: "#839088",
        fontFamily: "monospace",
        lineHeight: 1.6,
        marginBottom: "36px",
        textShadow: "0 2px 12px rgba(0,0,0,0.8)",
      }}
    >
      {t("walkthrough.welcomeSubtext")}
    </p>
    <button
      onClick={onStart}
      style={{
        width: "46px",
        height: "46px",
        background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DIM} 100%)`,
        border: "none",
        borderRadius: "50%",
        color: "#080b09",
        fontSize: "20px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        boxShadow: "0 4px 24px rgba(212, 168, 67, 0.3)",
      }}
    >
      →
    </button>
    <button
      onClick={onSkip}
      style={{
        background: "none",
        border: "none",
        color: "#465249",
        fontSize: "12px",
        fontFamily: "monospace",
        cursor: "pointer",
        padding: "8px 12px",
        marginTop: "20px",
      }}
    >
      {t("walkthrough.skip")}
    </button>
  </div>
);

/* ── Summary card ── */
const SummaryCard = ({
  visible,
  onDismiss,
  t,
}: {
  visible: boolean;
  onDismiss: () => void;
  t: (key: string) => string;
}) => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: visible
        ? "translate(-50%, -50%) scale(1)"
        : "translate(-50%, -50%) scale(0.95)",
      opacity: visible ? 1 : 0,
      transition: "all 0.5s ease",
      pointerEvents: visible ? "auto" : "none",
      zIndex: 100,
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: "'Caveat', cursive",
        fontSize: "84px",
        color: ACCENT,
        marginBottom: "12px",
        textShadow: "0 4px 24px rgba(0,0,0,0.8)",
        lineHeight: 1,
      }}
    >
      {t("walkthrough.summary")}
    </div>
    <p
      style={{
        fontSize: "22px",
        color: "#839088",
        fontFamily: "monospace",
        lineHeight: 1.6,
        marginBottom: "36px",
        textShadow: "0 2px 12px rgba(0,0,0,0.8)",
      }}
    >
      {t("walkthrough.summarySubtext")}
    </p>
    <button
      onClick={onDismiss}
      style={{
        width: "46px",
        height: "46px",
        background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DIM} 100%)`,
        border: "none",
        borderRadius: "50%",
        color: "#080b09",
        fontSize: "20px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        boxShadow: "0 4px 24px rgba(212, 168, 67, 0.3)",
      }}
    >
      →
    </button>
  </div>
);

/* ── Completing phase — checkmark draws in ── */
const CompletingPhase = ({
  visible,
  onComplete,
  circlePosition,
}: {
  visible: boolean;
  onComplete: () => void;
  circlePosition: { x: number; y: number } | null;
}) => {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStarted(false);
      return;
    }
    setStarted(true);
    const timeout = setTimeout(onComplete, 700);
    return () => clearTimeout(timeout);
  }, [visible, onComplete]);

  if (!visible || !circlePosition) return null;

  const sz = 56;
  const sw = 2;
  const r = (sz - sw) / 2;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(6, 9, 7, 0.9)",
          backdropFilter: "blur(6px)",
          zIndex: 50,
          opacity: started ? 0 : 1,
          transition: "opacity 0.5s ease-out",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: circlePosition.x,
          top: circlePosition.y,
          zIndex: 100,
        }}
      >
        <svg width={sz} height={sz} style={{ overflow: "visible" }}>
          <circle
            cx={sz / 2}
            cy={sz / 2}
            r={r}
            fill="rgba(212, 168, 67, 0.1)"
            stroke="rgba(212, 168, 67, 0.5)"
            strokeWidth={sw}
            style={{
              opacity: started ? 0 : 1,
              transition: "opacity 0.5s ease-out",
            }}
          />
          <text
            x={sz / 2}
            y={sz / 2}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: "monospace",
              fontSize: "24px",
              fontWeight: 700,
              fill: ACCENT,
              opacity: started ? 0 : 1,
              transition: "opacity 0.05s ease",
            }}
          >
            {STEPS.length}
          </text>
          {started && (
            <path
              d={`M ${sz * 0.28} ${sz * 0.52} L ${sz * 0.42} ${sz * 0.66} L ${sz * 0.72} ${sz * 0.36}`}
              fill="none"
              stroke={ACCENT}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 50,
                filter: "drop-shadow(0 0 6px rgba(212, 168, 67, 0.5))",
                animation: "drawCheckmarkAndFade 0.6s ease-out forwards",
              }}
            />
          )}
        </svg>
      </div>
      <style>{`
        @keyframes drawCheckmarkAndFade {
          0% { stroke-dashoffset: 50; opacity: 1; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
      `}</style>
    </>
  );
};

/* ── Position calculation ── */
function calculatePositions(
  rect: DOMRect,
  direction: "top" | "bottom" | "left" | "right",
  offsetX = 0,
): {
  arrowFrom: { x: number; y: number };
  arrowTo: { x: number; y: number };
  annotationPos: { x: number; y: number };
  flip: boolean;
} {
  const padding = 16;
  const arrowLen = 80;
  const annotationOffset = 20;
  const annotationWidth = 380;

  switch (direction) {
    case "top": {
      const textX = rect.left + rect.width / 2 - annotationWidth / 2 + offsetX;
      const textY = rect.top - 180;
      return {
        arrowFrom: { x: 0, y: 0 },
        arrowTo: { x: 0, y: 0 },
        annotationPos: { x: textX, y: textY },
        flip: false,
      };
    }
    case "bottom": {
      const arrowFromX = rect.left + rect.width * 0.5;
      const arrowFromY = rect.bottom + arrowLen + 30;
      return {
        arrowFrom: { x: arrowFromX, y: arrowFromY },
        arrowTo: {
          x: rect.left + rect.width * 0.5,
          y: rect.bottom + padding,
        },
        annotationPos: {
          x: arrowFromX - annotationWidth / 2 + 40 + offsetX,
          y: arrowFromY + annotationOffset,
        },
        flip: false,
      };
    }
    case "left": {
      const arrowFromX = rect.left - arrowLen - 30;
      const arrowFromY = rect.top + rect.height * 0.3;
      return {
        arrowFrom: { x: arrowFromX, y: arrowFromY },
        arrowTo: {
          x: rect.left - padding,
          y: rect.top + rect.height * 0.25,
        },
        annotationPos: {
          x: arrowFromX - annotationWidth / 2 + offsetX,
          y: arrowFromY + annotationOffset,
        },
        flip: false,
      };
    }
    case "right": {
      const arrowFromX = rect.right + arrowLen + 30;
      const arrowFromY = rect.top + rect.height * 0.3;
      return {
        arrowFrom: { x: arrowFromX, y: arrowFromY },
        arrowTo: {
          x: rect.right + padding,
          y: rect.top + rect.height * 0.25,
        },
        annotationPos: {
          x: arrowFromX - annotationWidth / 2 + offsetX,
          y: arrowFromY + annotationOffset,
        },
        flip: true,
      };
    }
  }
}

/* ── Main Walkthrough component ── */
export function Walkthrough() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<
    "welcome" | "steps" | "completing" | "summary"
  >("welcome");
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [lastCirclePos, setLastCirclePos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* Measure target element */
  const measureTarget = useCallback(() => {
    if (phase !== "steps" || step >= STEPS.length) {
      setTargetRect(null);
      return;
    }
    const currentStep = STEPS[step];
    if (!currentStep) return;
    const element = document.querySelector(
      `[data-walkthrough="${currentStep.target}"]`,
    );
    if (element) {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
      }
    }
  }, [phase, step]);

  /* Listen for restart event from Tour button */
  useEffect(() => {
    const handleRestart = () => {
      localStorage.removeItem(STORAGE_KEY);
      setDismissed(false);
      setShouldShow(true);
      setIsInitialized(true);
      setPhase("welcome");
      setStep(0);
    };
    window.addEventListener("rrsb-restart-walkthrough", handleRestart);
    return () =>
      window.removeEventListener("rrsb-restart-walkthrough", handleRestart);
  }, []);

  /* Check localStorage on mount — skip on mobile */
  useEffect(() => {
    if (window.innerWidth < 768) {
      setDismissed(true);
      setIsInitialized(true);
      return;
    }
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (wasDismissed) {
      setDismissed(true);
      setIsInitialized(true);
    } else {
      const timer = setTimeout(() => {
        setShouldShow(true);
        setIsInitialized(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  /* Measure on step change and resize */
  useEffect(() => {
    if (!shouldShow || dismissed || phase !== "steps") return;
    measureTarget();
    measureTimeoutRef.current = setTimeout(measureTarget, 50);
    const handleResize = () => {
      if (measureTimeoutRef.current) clearTimeout(measureTimeoutRef.current);
      measureTimeoutRef.current = setTimeout(measureTarget, 50);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (measureTimeoutRef.current) clearTimeout(measureTimeoutRef.current);
    };
  }, [phase, step, shouldShow, dismissed, measureTarget]);

  const handleStart = useCallback(() => {
    setPhase("steps");
    setStep(0);
  }, []);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      if (targetRect) {
        const positions = calculatePositions(
          targetRect,
          STEPS[step]!.arrowDirection,
          STEPS[step]!.offsetX,
        );
        setLastCirclePos({
          x: positions.annotationPos.x,
          y: positions.annotationPos.y,
        });
      }
      setPhase("completing");
    }
  }, [step, targetRect]);

  const handleCompletingDone = useCallback(() => {
    setPhase("summary");
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }, []);

  /* Keyboard navigation */
  useEffect(() => {
    if (dismissed || !shouldShow) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleDismiss();
        return;
      }
      if (
        phase === "welcome" &&
        (e.key === "Enter" || e.key === " ")
      ) {
        e.preventDefault();
        handleStart();
      } else if (
        phase === "steps" &&
        (e.key === "ArrowRight" || e.key === " " || e.key === "Enter")
      ) {
        e.preventDefault();
        handleNext();
      } else if (
        phase === "summary" &&
        (e.key === "Enter" || e.key === " ")
      ) {
        e.preventDefault();
        handleDismiss();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dismissed, shouldShow, phase, handleStart, handleNext, handleDismiss]);

  if (dismissed) return null;

  /* Pre-init: dark overlay to prevent content flash */
  if (!isInitialized) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(6, 9, 7, 0.85)",
          backdropFilter: "blur(6px)",
        }}
      />
    );
  }

  if (!shouldShow) return null;

  const currentStep = phase === "steps" ? STEPS[step] : null;
  const positions =
    currentStep && targetRect
      ? calculatePositions(targetRect, currentStep.arrowDirection, currentStep.offsetX)
      : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "auto",
      }}
    >
      {/* Load Caveat font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes pulseBorder {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* ── Overlay ── */}
      {phase !== "completing" &&
        (phase === "steps" && targetRect ? (
          <>
            {/* 4-div cutout creating hole around highlighted element */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: Math.max(0, targetRect.top - 6),
                background: "rgba(6, 9, 7, 0.82)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                top: targetRect.top + targetRect.height + 6,
                background: "rgba(6, 9, 7, 0.82)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: targetRect.top - 6,
                left: 0,
                width: Math.max(0, targetRect.left - 6),
                height: targetRect.height + 12,
                background: "rgba(6, 9, 7, 0.82)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: targetRect.top - 6,
                left: targetRect.left + targetRect.width + 6,
                right: 0,
                height: targetRect.height + 12,
                background: "rgba(6, 9, 7, 0.82)",
                backdropFilter: "blur(4px)",
                zIndex: 50,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </>
        ) : (
          /* Full overlay for welcome / summary */
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(6, 9, 7, 0.85)",
              backdropFilter: "blur(6px)",
              transition: "all 0.5s ease",
              zIndex: 50,
            }}
          />
        ))}

      {/* ── SVG layer — arrows + border highlight ── */}
      {phase !== "completing" && (
        <svg
          width="100%"
          height="100%"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 60,
            pointerEvents: "none",
          }}
        >
          <defs>
            <filter id="sketchy">
              <feTurbulence
                type="turbulence"
                baseFrequency="0.03"
                numOctaves="3"
                result="noise"
                seed="2"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="1.5"
              />
            </filter>
          </defs>

          {/* Dashed border highlight */}
          {phase === "steps" && targetRect && (
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="12"
              fill="none"
              stroke={ACCENT}
              strokeWidth="2"
              strokeDasharray="8 4"
              style={{
                opacity: 0.7,
                animation: "pulseBorder 2s ease-in-out infinite",
              }}
            />
          )}

          {/* Arrow */}
          {phase === "steps" &&
            currentStep &&
            positions &&
            currentStep.arrowDirection !== "top" && (
              <HandDrawnArrow
                from={positions.arrowFrom}
                to={positions.arrowTo}
                flip={positions.flip}
                delay={100}
              />
            )}
        </svg>
      )}

      {/* ── Step annotation ── */}
      {phase === "steps" && currentStep && positions && (
        <div
          style={{
            position: "absolute",
            left: positions.annotationPos.x,
            top: positions.annotationPos.y,
            width: 380,
            zIndex: 70,
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "20px",
            }}
          >
            {/* Step number circle */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                border: "2px solid rgba(212, 168, 67, 0.5)",
                background: "rgba(212, 168, 67, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: ACCENT,
                  lineHeight: 1,
                }}
              >
                {step + 1}
              </span>
            </div>

            {/* Text */}
            <div
              style={{
                fontFamily: "'Caveat', cursive",
                color: ACCENT,
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  textShadow: "0 3px 16px rgba(0,0,0,0.8)",
                }}
              >
                {t(currentStep.questionKey)}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  color: "#839088",
                  marginTop: "8px",
                  lineHeight: 1.25,
                  textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                }}
              >
                {t(currentStep.subtextKey)}
              </div>
            </div>
          </div>

          {/* Next button */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "24px",
            }}
          >
            <button
              onClick={handleNext}
              style={{
                width: "56px",
                height: "56px",
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DIM} 100%)`,
                border: "none",
                borderRadius: "50%",
                color: "#080b09",
                fontSize: "24px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 24px rgba(212, 168, 67, 0.3)",
                transition: "all 0.2s ease",
              }}
            >
              →
            </button>
          </div>

          {/* Skip */}
          <div style={{ textAlign: "center", marginTop: "12px" }}>
            <button
              onClick={handleDismiss}
              style={{
                background: "none",
                border: "none",
                color: "#465249",
                fontSize: "12px",
                fontFamily: "monospace",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              {t("walkthrough.skip")}
            </button>
          </div>
        </div>
      )}

      {/* Welcome modal */}
      <WelcomeModal
        visible={phase === "welcome"}
        onStart={handleStart}
        onSkip={handleDismiss}
        t={t}
      />

      {/* Completing phase */}
      {phase === "completing" && (
        <CompletingPhase
          visible
          onComplete={handleCompletingDone}
          circlePosition={lastCirclePos}
        />
      )}

      {/* Summary */}
      <SummaryCard
        visible={phase === "summary"}
        onDismiss={handleDismiss}
        t={t}
      />
    </div>
  );
}

/* ── Hook to trigger walkthrough manually ── */
export function useWalkthrough() {
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const triggerWalkthrough = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowWalkthrough(true);
  }, []);

  const resetWalkthrough = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    showWalkthrough,
    setShowWalkthrough,
    triggerWalkthrough,
    resetWalkthrough,
  };
}
