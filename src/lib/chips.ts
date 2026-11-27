// src/lib/chips.ts
// FPL's chip names ("bboost") as visitors know them. A file of its own so
// the charts, which run in the browser, can use it without loading the
// season statistics.

const CHIP_NAMES: Record<string, string> = {
  wildcard: "Wildcard",
  "3xc": "Triple Captain",
  bboost: "Bench Boost",
  freehit: "Free Hit",
  manager: "Assistant Manager",
};

export function chipLabel(name: string): string {
  return CHIP_NAMES[name] ?? name;
}

// The usual FPL abbreviations, for phone-width cells.
const CHIP_CODES: Record<string, string> = {
  wildcard: "WC",
  "3xc": "TC",
  bboost: "BB",
  freehit: "FH",
  manager: "AM",
};

export function chipCode(name: string): string {
  return CHIP_CODES[name] ?? name;
}
