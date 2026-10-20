# Elite Cyclist Left Heart Z-Scores

A browser calculator for percent-predicted values and Z-scores of left heart structure and function in elite cyclists, built on the sport-specific allometric equations of Herrera-Leaño, Oxborough and colleagues.

**Live page:** <https://parameterz.github.io/cyclist-left-heart-zscores/>

> **Status: mockup for author review.** Four of the nine equations differ between Table 4 and Table S3 of the paper. The page shows both versions for those rows until the authors confirm. Not for clinical use.

## Source

Herrera-Leaño N, Malhotra A, Cooper R, Robinson S, Ramcharan T, Maxwell J, Place F, George K, Jones N, Khoury P, Ashley EA, Haddad F, Oxborough D. Allometric scaling of left heart structure and function in elite cyclists: development of sport-specific prediction equations. *J Am Heart Assoc.* 2026;15:e050142. [doi:10.1161/JAHA.126.050142](https://doi.org/10.1161/JAHA.126.050142)

## How it works

```
predicted μ = C · height(m)^a · (male factor) · (endurance factor) · RR(s)^b
Z           = k · ln(measured / μ)
```

`k` is 1/σ on the natural-log scale, so this is the familiar (value − mean) / SD applied to ln(value). Because the SD is proportional to the predicted size, one σ fits every athlete, and each Z corresponds to a fixed percent of predicted (Table 5 of the paper).

| Measurement | Status |
|---|---|
| LV end-diastolic volume, LV end-systolic volume, LA volume, LV ejection fraction | Confirmed: Table 4 and Table S3 agree |
| LV systolic diameter | Resolved: Table S3 row is a copy error; Table 4 is used |
| LV stroke volume, cardiac output, LV mass, LV diastolic diameter | Open: tables disagree; both shown |

The cross-checks behind each status, and the questions for the authors, are in [docs/equation-audit.md](docs/equation-audit.md).

### Scope

Derivation cohort: 181 elite British cyclists (105 male, 76 female; 128 endurance, 53 sprint), age 22.7 ± 5.5 years. External validation: 62 elite male endurance cyclists. Measurements: biplane Simpson LV volumes, biplane LA volume, ASE corrected linear LV mass, 2D parasternal long-axis LV diameters. The equations may not apply to other populations, lower training volumes, or other measurement methods.

## Layout

```
index.html          page markup
css/styles.css      styles (light and dark)
js/equations.js     coefficients as data; Table S3 alternates in `alt`
js/zscore.js        pure calculation functions
js/app.js           UI
vendor/rough.esm.js rough.js 4.6.6 (MIT), for the sketched Z-bars
tests/              node:test checks against values from the paper
docs/               equation audit
```

A correction from the authors is a change to `js/equations.js` only.

## Run locally

No build step. ES modules need a local server rather than `file://`:

```sh
python3 -m http.server 8000     # then open http://localhost:8000/
npm test                        # Node 18+; no dependencies
```

## Deploy

GitHub Pages, from the root of `main`.

## Credits

Visual style after [The Heart by Ultrasound](https://intro2echo.com) (intro2echo.com). Sketched figures drawn with [rough.js](https://roughjs.com).

## License

Code: MIT (see `LICENSE`). The equations belong to the cited article; please cite it when using them.
