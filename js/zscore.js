// Pure calculation functions. No DOM access, so they run in the browser and under `node --test`.

/**
 * @typedef {Object} Athlete
 * @property {number} heightM   height in metres
 * @property {number} rrSec     RR interval in seconds (60 / heart rate)
 * @property {"M"|"F"} sex
 * @property {"E"|"S"} discipline   endurance or sprint
 */

/** Predicted value μ for one equation. `override` swaps in alternate coefficients (e.g. Table S3). */
export function predict(eq, athlete, override = {}) {
  const p = { ...eq, ...override };
  const male = athlete.sex === "M" ? p.male : 1;
  const end = athlete.discipline === "E" ? p.end : 1;
  return p.C * Math.pow(athlete.heightM, p.a) * male * end * Math.pow(athlete.rrSec, p.b);
}

/** Predicted value, percent predicted, ln(y/μ) and Z for a measured value y. */
export function evaluate(eq, measured, athlete, override = {}) {
  const predicted = predict(eq, athlete, override);
  if (!(measured > 0) || !(predicted > 0)) {
    return { predicted, measured, percentPredicted: NaN, lnRatio: NaN, z: NaN };
  }
  const ratio = measured / predicted;
  const lnRatio = Math.log(ratio);
  return { predicted, measured, percentPredicted: 100 * ratio, lnRatio, z: eq.k * lnRatio };
}

/** Percent predicted that corresponds to a given Z for an equation (inverse of the mapping). */
export function percentPredictedAtZ(eq, z) {
  return 100 * Math.exp(z / eq.k);
}

/** Standard normal CDF via the Abramowitz–Stegun erf approximation (|error| < 1.5e-7). */
export function normalCdf(z) {
  const x = z / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + (x >= 0 ? y : -y));
}

export const hrToRr = (bpm) => 60 / bpm;
