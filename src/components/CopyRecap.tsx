// src/components/CopyRecap.tsx
// The "Copy recap" button on the Gameweek tab: the gameweek in a few lines
// for a group chat, with a link to it. Phones open their share sheet, so
// the recap goes straight into a chat app; elsewhere it is copied.
"use client";
import { useState } from "react";
import { ChatText } from "react-bootstrap-icons";

export default function CopyRecap({
  lines,
  path,
}: {
  /** The recap without the link (see recap.ts). */
  lines: string[];
  /** The page's address without the site, for the link at the end. */
  path: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = [...lines, window.location.origin + path].join("\n");
    try {
      if (window.matchMedia("(pointer: coarse)").matches && navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The visitor closed the share sheet, or the browser refused. Nothing to do.
    }
  };

  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-secondary btn-quiet d-inline-flex align-items-center gap-1 text-nowrap"
      onClick={share}
      title="A few lines on this gameweek for your league's group chat"
    >
      <ChatText size={13} aria-hidden="true" />
      <span aria-live="polite">{copied ? "Recap copied" : "Copy recap"}</span>
    </button>
  );
}
