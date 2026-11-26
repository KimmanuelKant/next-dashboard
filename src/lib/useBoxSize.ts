// src/lib/useBoxSize.ts
import { useEffect, useState } from "react";

/**
 * The size an element has on the page, kept up to date as the window
 * changes; null until the browser has laid it out. The charts are drawn at
 * this size in pixels rather than scaled from a fixed drawing, so their text
 * stays readable on a phone.
 */
export function useBoxSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width: Math.round(width), height: Math.round(height) });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
