import { useCallback, useEffect, useRef } from "react";

/**
 * Auto-sizes text to fill its container using a binary search approach.
 * The ref should be on an inline-level element (inline-block/inline-flex)
 * inside a fixed-size parent. The parent's dimensions define the max bounds.
 */
export function useAutoFontSize(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el || !el.parentElement) return;

    const parent = el.parentElement;
    const maxW = parent.clientWidth * 0.95;
    const maxH = parent.clientHeight * 0.9;

    if (maxW <= 0 || maxH <= 0) return;

    // Temporarily set height to auto so we measure intrinsic text height
    // (the CSS sets height:100% which would always exceed maxH)
    el.style.height = "auto";

    let lo = 8;
    let hi = 500;

    while (lo < hi - 1) {
      const mid = Math.floor((lo + hi) / 2);
      el.style.fontSize = `${mid}px`;
      if (el.offsetWidth <= maxW && el.offsetHeight <= maxH) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    el.style.fontSize = `${lo}px`;
    el.style.height = "";
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resize, ...deps]);

  return ref;
}
