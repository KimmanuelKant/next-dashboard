// src/components/Loading.tsx

/**
 * Shown while a tab's data loads. The second line appears only if loading
 * takes a few seconds (see global.css), which is the first visit to a
 * league: its whole season is then fetched from FPL.
 */
export default function Loading({ what }: { what: string }) {
  return (
    <div className="py-4 text-body-secondary" role="status">
      <div className="d-flex align-items-center gap-2">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        Loading {what}…
      </div>
      <div className="loading-slow small mt-2">
        The first visit to a league takes a little longer.
      </div>
    </div>
  );
}
