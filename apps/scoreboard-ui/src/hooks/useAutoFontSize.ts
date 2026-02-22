import { useCallback, useEffect, useRef } from "react";

/**
 * Auto-sizes text to fill its container using a binary search approach.
 * Replicates the old scoreboard's dynamic font scaling.
 */
export function useAutoFontSize(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;

    const maxW = parent.clientWidth * 0.9;
    const maxH = parent.clientHeight * 0.85;

    let lo = 8;
    let hi = 500;

    while (lo < hi - 1) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = `${mid}px`;
      if (el.scrollWidth <= maxW && el.scrollHeight <= maxH) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    el.style.fontSize = `${lo}px`;
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resize, ...deps]);

  return ref;
}
