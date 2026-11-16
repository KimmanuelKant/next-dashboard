// src/components/ShareButton.tsx
"use client";
import { useState } from "react";
import { Share } from "react-bootstrap-icons";

/**
 * Shares the page as it is now: the address holds the tab, the table's view
 * and sorting, and the gameweek. Phones open their share sheet; elsewhere
 * the link is copied, which is what a desktop visitor wants to paste.
 */
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    // The visitor's own team is left out: for whoever opens the link it
    // would mark the wrong row as theirs.
    const url = new URL(window.location.href);
    url.searchParams.delete("team");
    try {
      if (window.matchMedia("(pointer: coarse)").matches && navigator.share) {
        await navigator.share({ title: document.title, url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The visitor closed the share sheet, or the browser refused. Nothing to do.
    }
  };

  return (
    <button
      type="button"
      className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1"
      onClick={share}
    >
      <Share size={13} aria-hidden="true" />
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
