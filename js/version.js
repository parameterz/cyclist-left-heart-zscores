// Single source for version and provenance. Used by the page footer, the printed report
// and the copied report text, so they always agree. Bump `version` and `date` on each release.

export const APP = {
  name: "Elite Cyclist Left Heart Z-Scores",
  version: "0.4",
  date: "2026-10-20",
  url: "https://parameterz.github.io/cyclist-left-heart-zscores/",
  author: "Dan Dyar, MA, ACS, RDCS, FASE",
  authorUrl: "https://www.linkedin.com/in/dan-dyar-ma-acs-rdcs-ae-pe-fe-fase/",
  equations: "Herrera-Leaño N, et al. J Am Heart Assoc. 2026;15:e050142. doi:10.1161/JAHA.126.050142",
  method: "Table 4 coefficients; Z = k · ln(measured / predicted), single published slope",
};

/** "20 October 2026" from an ISO date, without time-zone drift. */
export function longDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Generation timestamp with time zone, e.g. "20 Oct 2026, 20:31 PDT". */
export const stamp = (when = new Date()) =>
  when.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
