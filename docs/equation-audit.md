# Equation audit

Herrera-Leaño et al., *J Am Heart Assoc.* 2026;15:e050142 ([doi:10.1161/JAHA.126.050142](https://doi.org/10.1161/JAHA.126.050142)).

Cross-check of Table 4 (main article) against Table S3 (supplement), tested against Table 5 (percent-predicted percentiles), Table 6 and Table S6 (validation cohort), and Table 1 (derivation cohort means).

## Model form

```
predicted μ = C · Ht^a · (male factor) · (endurance factor) · RR^b
Z           = k · ln(y / μ),   k = 1 / σ(log)
```

Height in metres, RR in seconds (Table 4 footnote). Table 4 labels some rows as "index", but the constants give absolute values (mL, g, mm, %, L/min).

## Reconciled coefficients

| Measurement | C | Ht exp | Male × | Endurance × | RR exp | k | Status |
|---|---|---|---|---|---|---|---|
| LVEDV | 46.38 | 1.7 | 1.15 | 1.09 | 0.30 | 7.44 | Consistent |
| LVESV | 19.09 | 1.7 | 1.19 | 1.05 | 0.30 | 5.09 | Consistent |
| LAV | 18.04 | 1.7 | — | 1.17 | 0.50 | 4.24 | Consistent |
| LVEF | 60.36 | — | 0.96 | 1.01 | — | 12.06 | Consistent |
| LVSV | 27.07 | 1.7 | 1.13 | 1.14 | **0.27 (T4) / none (S3)** | 5.58 | Conflict |
| CO | **1.89 (T4) / 1.81 (S3)** | 1.7 | 1.06 | 1.05 | — | 4.92 | Conflict; poorly calibrated |
| LVM | 50.99 | 1.7 | 1.22 | 1.14 | **0.07 (T4) / 0.1 (S3)** | 5.99 | Minor (<1% effect) |
| LVd | 35.70 | 0.6 | 1.03 | **— (T4) / 1.02 (S3)** | — | 16.49 | Conflict; derivation mismatch |
| LVs | 24.02 | 0.6 | 1.04 | — | — | 10.57 | Resolved: Table 4 and Fig S6; the S3 row repeats LVEDV |

## Z slope against Table 5

The slope implied by Table 5, Z / ln(PP/100) at the 2.5th, 5th, 95th and 97.5th percentiles, reproduces every S3 slope within a few percent. For LVs it gives about 10.5 (range 10.15–10.75), which supports 10.57 over the 7.44 printed in S3. The 50th percentile is 100% for every parameter, so no intercept ("Z shift") is needed.

## Validation cohort (male endurance, height 1.80 m, HR 51)

Observed/predicted at cohort means, against the S6 calibration constant:

- LVEF 0.964 vs 0.968
- LVs (Table 4) 1.027 vs 1.026; LVs (S3) 0.811
- LVd (S3) 1.027 vs 1.022; LVd (Table 4) 1.047
- CO 0.84 (C = 1.81) or 0.81 (C = 1.89) vs 0.898
- Volumes run 2–4% above the S6 constants, consistent with averaging HR before applying the RR exponent.

## Derivation cohort (Table 1 means; no RR term needed)

- LVEF: predicted 58.3 / 60.9 vs observed 58.5 / 61.2 (men / women).
- LVd: predicted about 52–53 / 48–49 mm vs observed 55.0 / 50.5 mm. About 4% low, implying a cohort mean Z near +0.7, where Table S4 reports about 0.
- LVs: predicted 35.5 / 32.4 vs 36.9 / 33.3 mm, about 3% low.

## Measurement methods (main text)

Biplane Simpson LV volumes; LV mass by the ASE corrected linear formula; biplane LA volume; 2D parasternal long-axis LV diameters, inner edge to inner edge; GE Vivid with offline EchoPAC 204.

## Open questions for the authors

1. LVSV: RR^0.27 or no RR term?
2. CO: constant 1.81 or 1.89? Was an RR or HR term considered (CO = SV × HR)?
3. LVd: endurance factor 1.02 or none? Why do the equations under-predict the Table 1 diameters by about 4%?
4. LVM: RR exponent 0.07 or 0.1?
5. Confirm LVs = 24.02 · Ht^0.6 · 1.04 (male), k = 10.57.
6. Derivation cohort HR or RR (mean, SD, range) and height range.
7. Piecewise-linear knots, or is the single slope acceptable?
8. A few anonymized cases with expected Z-scores, for regression tests.
