// Prediction equations for left heart structure and function in elite cyclists.
//
// Source: Herrera-Leaño N, ... Oxborough D. Allometric scaling of left heart structure and
// function in elite cyclists: development of sport-specific prediction equations.
// J Am Heart Assoc. 2026;15:e050142. doi:10.1161/JAHA.126.050142
//
// Model:  predicted = C · height(m)^a · (male factor) · (endurance factor) · RR(s)^b
//         Z = k · ln(measured / predicted),   k = 1 / σ(log)
//
// Values are from Table 4 of the main article. Where Table S3 (supplement) disagrees,
// the S3 value is kept in `alt` so both versions can be shown until the authors confirm.
// See docs/equation-audit.md for the cross-checks behind each status.

export const SOURCE = {
  citation: "Herrera-Leaño N, Malhotra A, Cooper R, et al. Allometric scaling of left heart structure and function in elite cyclists: development of sport-specific prediction equations. J Am Heart Assoc. 2026;15:e050142.",
  doi: "10.1161/JAHA.126.050142",
  primary: "Table 4",
  alternate: "Table S3",
};

export const STATUS = {
  confirmed: "Confirmed",
  resolved: "Resolved",
  open: "Open question",
};

/**
 * @typedef {Object} Equation
 * @property {string} id
 * @property {string} name
 * @property {string} abbr
 * @property {string} unit
 * @property {number} dp        decimals for display
 * @property {number} C         constant
 * @property {number} a         height exponent (height in metres)
 * @property {number} male      multiplicative factor applied to men
 * @property {number} end       multiplicative factor applied to endurance discipline
 * @property {number} b         RR-interval exponent (RR in seconds)
 * @property {number} k         Z slope, 1/σ on the natural-log scale
 * @property {"confirmed"|"resolved"|"open"} status
 * @property {number} example   example measurement for the demo athlete
 * @property {Partial<Equation>} [alt]  Table S3 values that differ from Table 4
 * @property {string} [issue]   note shown with the calculation
 */

/** @type {Equation[]} */
export const EQUATIONS = [
  { id: "lvedv", name: "LV end-diastolic volume", abbr: "LVEDV", unit: "mL", dp: 0,
    C: 46.38, a: 1.7, male: 1.15, end: 1.09, b: 0.30, k: 7.44, status: "confirmed", example: 190 },

  { id: "lvesv", name: "LV end-systolic volume", abbr: "LVESV", unit: "mL", dp: 0,
    C: 19.09, a: 1.7, male: 1.19, end: 1.05, b: 0.30, k: 5.09, status: "confirmed", example: 80 },

  { id: "lvsv", name: "LV stroke volume", abbr: "LVSV", unit: "mL", dp: 0,
    C: 27.07, a: 1.7, male: 1.13, end: 1.14, b: 0.27, k: 5.58, status: "open", example: 110,
    alt: { b: 0 },
    issue: "Table 4 includes RR<sup>0.27</sup>; Table S3 has no RR term." },

  { id: "lvef", name: "LV ejection fraction", abbr: "LVEF", unit: "%", dp: 0,
    C: 60.36, a: 0, male: 0.96, end: 1.01, b: 0, k: 12.06, status: "confirmed", example: 58 },

  { id: "co", name: "Cardiac output", abbr: "CO", unit: "L/min", dp: 1,
    C: 1.89, a: 1.7, male: 1.06, end: 1.05, b: 0, k: 4.92, status: "open", example: 5.5,
    alt: { C: 1.81 },
    issue: "Constant is 1.89 in Table 4 and 1.81 in Table S3. Neither version has an RR term, although CO = SV × 60/RR and SV scales with RR<sup>0.27</sup>, which implies CO ∝ RR<sup>−0.73</sup>. That may explain the validation cohort's low mean Z (−0.59) at a resting HR of 51 bpm." },

  { id: "lvm", name: "LV mass", abbr: "LVM", unit: "g", dp: 0,
    C: 50.99, a: 1.7, male: 1.22, end: 1.14, b: 0.07, k: 5.99, status: "open", example: 205,
    alt: { b: 0.1 },
    issue: "RR exponent is 0.07 in Table 4 and 0.1 in Table S3. The difference is under 1% at typical heart rates." },

  { id: "lav", name: "Left atrial volume", abbr: "LAV", unit: "mL", dp: 0,
    C: 18.04, a: 1.7, male: 1.0, end: 1.17, b: 0.5, k: 4.24, status: "confirmed", example: 66 },

  { id: "lvd", name: "LV diastolic diameter", abbr: "LVd", unit: "mm", dp: 1,
    C: 35.70, a: 0.6, male: 1.03, end: 1.0, b: 0, k: 16.49, status: "open", example: 56,
    alt: { end: 1.02 },
    issue: "Table S3 adds a 1.02 endurance factor that Table 4 omits. At Table 1 cohort means, both versions predict about 4% below observed (cohort mean Z ≈ +0.7, versus ≈ 0 in Table S4)." },

  { id: "lvs", name: "LV systolic diameter", abbr: "LVs", unit: "mm", dp: 1,
    C: 24.02, a: 0.6, male: 1.04, end: 1.0, b: 0, k: 10.57, status: "resolved", example: 37,
    issue: "Table S3 repeats the LVEDV terms (1.15, 1.09, RR<sup>0.3</sup>, k 7.44). Table 4, Figure S6 (k = 10.57), Table 5 and the validation cohort all support the Table 4 version used here." },
];
