// src/components/Narrow.tsx
import type { ReactNode } from "react";

/**
 * Shows `short` on phone-width screens and the children on wider ones.
 * Both are rendered and CSS picks one (see global.css), so there is no flash
 * on load. Inside the row panel the full version shows at any width.
 */
export default function Narrow({ short, children }: { short: ReactNode; children: ReactNode }) {
  return (
    <>
      <span className="narrow-short">{short}</span>
      <span className="narrow-full">{children}</span>
    </>
  );
}
