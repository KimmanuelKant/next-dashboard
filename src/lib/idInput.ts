// src/lib/idInput.ts
// What to tell a visitor whose entry in a front-page ID box was not an ID.
// Some visitors type their league's or team's name, expecting a search; FPL
// offers no search by name, so they need to be told where the number is,
// not only that the entry was wrong.

export type IdKind = "league" | "team";

/** Why an entry could not be read as an ID. */
export type IdInputProblem = "empty" | "name" | "url" | "other";

/** A web address, or something pasted from one. */
function looksLikeUrl(input: string): boolean {
  return /^https?:\/\/|^www\.|premierleague\.com|\//i.test(input);
}

/**
 * Classifies an entry that `parseLeagueId()` or `parseTeamId()` rejected.
 * Any letter (in any alphabet) outside a web address counts as a name.
 */
export function idInputProblem(input: string): IdInputProblem {
  const trimmed = input.trim();
  if (trimmed === "") return "empty";
  if (looksLikeUrl(trimmed)) return "url";
  if (/\p{L}/u.test(trimmed)) return "name";
  return "other";
}

/** The error message shown under the box. */
export function idInputError(input: string, kind: IdKind): string {
  const problem = idInputProblem(input);
  if (kind === "league") {
    switch (problem) {
      case "name":
        return "FPL cannot look up a league by its name. Enter the league's number instead: see “How to find your League ID” below.";
      case "url":
        return "That address has no league number in it. Open the league's standings on the FPL site and copy the address from there.";
      default:
        return "Enter the league number, or paste the league URL from the FPL site.";
    }
  }
  switch (problem) {
    case "name":
      return "FPL cannot look up a team by its name or its manager's. Enter the team's number instead: see “How to find your Team ID” below.";
    case "url":
      return "That address has no team number in it. Open your Points page on the FPL site and copy the address from there.";
    default:
      return "Enter the team number, or paste your team URL from the FPL site.";
  }
}
