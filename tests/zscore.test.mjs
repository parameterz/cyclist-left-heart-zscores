// Run with: npm test  (or: node --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { EQUATIONS } from "../js/equations.js";
import { evaluate, predict, percentPredictedAtZ, normalCdf } from "../js/zscore.js";

const byId = Object.fromEntries(EQUATIONS.map((e) => [e.id, e]));
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (±${tol})`);

test("worked example: male endurance, 1.80 m, HR 50, LVEDV 190 mL", () => {
  const ath = { heightM: 1.8, rrSec: 1.2, sex: "M", discipline: "E" };
  const r = evaluate(byId.lvedv, 190, ath);
  close(r.predicted, 166.8, 0.1, "predicted LVEDV");
  close(r.percentPredicted, 113.9, 0.1, "% predicted");
  close(r.z, 0.97, 0.01, "Z");
});

test("Z slopes reproduce the Table 5 percent-predicted percentiles", () => {
  // Table 5 values at Z = −1.96 and +1.96. Tolerance allows for the paper's piecewise mapping.
  const table5 = {
    lvedv: [76.7, 129.2], lvesv: [67.1, 146.3], lav: [62.9, 158.7], lvef: [85.0, 117.1],
    lvsv: [70.4, 141.8], co: [67.1, 148.3], lvm: [71.5, 138.9], lvd: [88.9, 112.9], lvs: [83.0, 120.0],
  };
  for (const [id, [lo, hi]] of Object.entries(table5)) {
    const e = byId[id];
    close(percentPredictedAtZ(e, -1.96), lo, lo * 0.02, `${id} 2.5th`);
    close(percentPredictedAtZ(e, 1.96), hi, hi * 0.03, `${id} 97.5th`);
  }
});

test("LVEF reproduces Table 1 cohort means (no height or RR terms)", () => {
  const male = predict(byId.lvef, { heightM: 1.8, rrSec: 1, sex: "M", discipline: "E" });
  const female = predict(byId.lvef, { heightM: 1.65, rrSec: 1, sex: "F", discipline: "E" });
  close(male, 58.5, 0.8, "male LVEF");
  close(female, 61.2, 0.8, "female LVEF");
});

test("LV systolic diameter: Table 4 version matches the validation cohort", () => {
  // Validation cohort: male endurance, 1.80 m, HR 51, LVs 36.5 mm; Table S6 calibration constant 1.026.
  const ath = { heightM: 1.8, rrSec: 60 / 51, sex: "M", discipline: "E" };
  close(36.5 / predict(byId.lvs, ath), 1.026, 0.01, "obs/pred");
});

test("measured value of zero or blank returns NaN, not a number", () => {
  const ath = { heightM: 1.8, rrSec: 1, sex: "M", discipline: "E" };
  assert.ok(Number.isNaN(evaluate(byId.lvedv, 0, ath).z));
  assert.ok(Number.isNaN(evaluate(byId.lvedv, NaN, ath).z));
});

test("normal CDF", () => {
  close(normalCdf(0), 0.5, 1e-7, "Φ(0)");
  close(normalCdf(1.96), 0.975, 1e-4, "Φ(1.96)");
  close(normalCdf(-1.645), 0.05, 1e-4, "Φ(−1.645)");
});
