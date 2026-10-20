// UI: athlete inputs, the measurement ledger, sketched Z-bars and the calculation panel.
import rough from "../vendor/rough.esm.js";
import { EQUATIONS, STATUS } from "./equations.js";
import { evaluate, normalCdf, percentPredictedAtZ } from "./zscore.js";

const $ = (s) => document.querySelector(s);
const fmt = (x, d) => (Number.isFinite(x) ? x.toFixed(d) : "—");
const sgn = (x, d = 2) => (Number.isFinite(x) ? (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(d) : "—");
function ord(p) {
  const r = Math.round(p);
  if (r < 1) return "<1st";
  if (r > 99) return ">99th";
  const s = ["th", "st", "nd", "rd"], v = r % 100;
  return r + (s[(v - 20) % 10] || s[v] || s[0]);
}

const state = { sex: "M", disc: "E", hUnit: "cm", hrMode: "bpm", sel: "lvedv", values: {} };
EQUATIONS.forEach((e) => (state.values[e.id] = e.example));

function athlete() {
  const hv = parseFloat($("#height").value), hr = parseFloat($("#hr").value);
  const heightM = state.hUnit === "cm" ? hv / 100 : hv * 0.0254;
  const rrSec = state.hrMode === "bpm" ? 60 / hr : hr / 1000;
  return { heightM, rrSec, hr: 60 / rrSec, sex: state.sex, discipline: state.disc };
}

/* ---------- sketched Z-bar ---------- */
const Z0 = -3, Z1 = 3;
const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs = {}) {
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
}
function put(svg, cls, node) {
  const g = el("g", { class: cls });
  g.appendChild(node);
  svg.appendChild(g);
  return g;
}
// rough.js strokes use currentColor, so each group takes its colour from the theme tokens.
function drawBar(svg, z, za, seed, lims) {
  const W = Math.max(120, svg.clientWidth || 200), H = 46, pad = 9, cy = 16;
  const X = (v) => pad + ((Math.max(Z0, Math.min(Z1, v)) - Z0) / (Z1 - Z0)) * (W - 2 * pad);
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.replaceChildren();
  const R = rough.svg(svg);
  put(svg, "g-band", R.rectangle(X(-1.96), cy - 7, X(1.96) - X(-1.96), 14,
    { stroke: "none", fill: "currentColor", fillStyle: "hachure", hachureGap: 3.5, fillWeight: 1.1, hachureAngle: -41, roughness: 1.3, seed }));
  put(svg, "g-rule", R.line(pad, cy, W - pad, cy, { stroke: "currentColor", strokeWidth: 1, roughness: 0.9, bowing: 1.2, seed: seed + 1 }));
  [-2, -1, 0, 1, 2].forEach((t, i) =>
    put(svg, "g-rule", R.line(X(t), cy - (t ? 4 : 7), X(t), cy + (t ? 4 : 7),
      { stroke: "currentColor", strokeWidth: t ? 0.9 : 1.3, roughness: 0.7, seed: seed + 2 + i })));
  if (Number.isFinite(za)) {
    put(svg, "g-ghost", R.circle(X(za), cy, 14, { stroke: "currentColor", strokeWidth: 1.5, strokeLineDash: [3, 3], roughness: 1.5, seed: seed + 9 }));
  }
  if (Number.isFinite(z)) {
    const g = put(svg, "g-dot", R.circle(X(z), cy, 13, { stroke: "currentColor", strokeWidth: 1.4, fill: "currentColor", fillStyle: "solid", roughness: 1.1, seed: seed + 10 }));
    g.classList.toggle("out", Math.abs(z) > 1.96);
    if (Math.abs(z) > Z1) {
      const t = el("text", { x: z > 0 ? W - pad : pad, y: H - 1, "text-anchor": z > 0 ? "end" : "start", class: "zl out" });
      t.textContent = z > 0 ? "beyond +3 →" : "← beyond −3";
      svg.appendChild(t);
    }
  }
  // Absolute values at the edges of the central 95%, handwritten under the band.
  if (lims) {
    for (const [v, zz] of [[lims.lo, -1.96], [lims.hi, 1.96]]) {
      const t = el("text", { x: X(zz), y: H - 3, "text-anchor": "middle", class: "lim" });
      t.textContent = fmt(v, lims.dp);
      svg.appendChild(t);
    }
  }
}

/** Absolute values that correspond to a given Z for this equation and predicted value. */
const valueAtZ = (e, mu, z) => (mu * percentPredictedAtZ(e, z)) / 100;
const limits = (e, mu) => Number.isFinite(mu) && mu > 0
  ? { lo: valueAtZ(e, mu, -1.96), hi: valueAtZ(e, mu, 1.96), dp: e.dp } : null;
function drawLegend() {
  const mk = (id, cls, fn) => {
    const s = $("#" + id);
    s.setAttribute("viewBox", "0 0 26 16");
    s.replaceChildren();
    put(s, cls, fn(rough.svg(s)));
  };
  mk("lg-dot", "g-dot", (rc) => rc.circle(13, 8, 11, { stroke: "currentColor", fill: "currentColor", fillStyle: "solid", roughness: 1.1, seed: 7 }));
  mk("lg-ghost", "g-ghost", (rc) => rc.circle(13, 8, 11, { stroke: "currentColor", strokeWidth: 1.5, strokeLineDash: [3, 3], roughness: 1.4, seed: 8 }));
  mk("lg-band", "g-band", (rc) => rc.rectangle(2, 2, 22, 12, { stroke: "none", fill: "currentColor", fillStyle: "hachure", hachureGap: 3, hachureAngle: -41, seed: 9 }));
}

/* ---------- ledger ---------- */
function buildRows() {
  const host = $("#rows");
  host.innerHTML = "";
  EQUATIONS.forEach((e) => {
    const row = document.createElement("div");
    row.className = "prow";
    row.dataset.id = e.id;
    row.tabIndex = 0;
    row.innerHTML = `
      <div class="pname c-name"><span class="t">${e.name}</span><span class="s">${e.abbr} · ${e.unit}</span><span class="pill ${e.status}">${STATUS[e.status]}</span></div>
      <div class="c-inp"><input type="number" id="v-${e.id}" aria-label="${e.name} in ${e.unit}" step="${e.dp ? 0.1 : 1}" value="${e.example}" inputmode="decimal"></div>
      <div class="r num c-pred" id="p-${e.id}"></div>
      <div class="r num c-pp" id="pp-${e.id}"></div>
      <div class="r num c-z"><span class="zval" id="z-${e.id}"></span><span class="alt" id="za-${e.id}"></span></div>
      <div class="c-bar"><svg class="zbar" id="b-${e.id}" aria-hidden="true"></svg></div>`;
    host.appendChild(row);
    const select = () => { state.sel = e.id; render(); };
    row.addEventListener("click", (ev) => { if (ev.target.tagName !== "INPUT") select(); });
    row.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" || ev.key === " ") && ev.target === row) { ev.preventDefault(); select(); }
    });
    const input = row.querySelector("input");
    input.addEventListener("input", (ev) => { state.values[e.id] = parseFloat(ev.target.value); render(); });
    input.addEventListener("focus", select);
  });
}

function buildRef() {
  const cell = (e, key, f) =>
    e.alt && key in e.alt ? `<td class="q">${f(e[key])} / ${f(e.alt[key])}</td>` : `<td>${f(e[key])}</td>`;
  const exp = (x) => (x === 0 ? "—" : String(x));
  const fac = (x) => (x === 1 ? "—" : x.toFixed(2));
  $("#reftable").innerHTML = `<thead><tr><th>Measurement</th><th>C</th><th>Height exp.</th><th>Male ×</th><th>Endurance ×</th><th>RR exp.</th><th>k (= 1/σ)</th><th>σ log</th></tr></thead><tbody>${
    EQUATIONS.map((e) => `<tr><td>${e.abbr} (${e.unit})</td>${cell(e, "C", (x) => x.toFixed(2))}${cell(e, "a", exp)}${cell(e, "male", fac)}${cell(e, "end", fac)}${cell(e, "b", exp)}<td>${e.k.toFixed(2)}</td><td>${(1 / e.k).toFixed(3)}</td></tr>`).join("")
  }</tbody>`;
}

/* ---------- render ---------- */
function render() {
  document.querySelectorAll("[data-sex]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.sex === state.sex));
  document.querySelectorAll("[data-disc]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.disc === state.disc));
  const ath = athlete();
  $("#hunit").textContent = state.hUnit;
  $("#hrmode").textContent = state.hrMode === "bpm" ? "bpm" : "RR ms";
  $("#hr-label").textContent = state.hrMode === "bpm" ? "Heart rate" : "RR interval";
  $("#height-m").textContent = Number.isFinite(ath.heightM) ? `${ath.heightM.toFixed(3)} m` : "Enter height";
  $("#rr-derived").textContent = Number.isFinite(ath.rrSec) && ath.rrSec > 0
    ? (state.hrMode === "bpm" ? `RR ${ath.rrSec.toFixed(3)} s` : `HR ${ath.hr.toFixed(0)} bpm`)
    : "Enter heart rate";

  // Range warnings. Approximate: Table 1 mean ± 3 SD for height; HR from the validation cohort.
  const w = [];
  const [hm, hs] = state.sex === "M" ? [1.80, 0.07] : [1.65, 0.06];
  if (Number.isFinite(ath.heightM) && (ath.heightM < hm - 3 * hs || ath.heightM > hm + 3 * hs)) {
    w.push(`Height is outside the approximate derivation range for ${state.sex === "M" ? "men" : "women"} (${(hm - 3 * hs).toFixed(2)}–${(hm + 3 * hs).toFixed(2)} m, Table 1 mean ± 3 SD).`);
  }
  if (Number.isFinite(ath.hr) && (ath.hr < 35 || ath.hr > 80)) {
    w.push(`Heart rate ${ath.hr.toFixed(0)} bpm is outside a typical resting range for elite cyclists (validation cohort 51 ± 8 bpm). The derivation cohort's range is not published.`);
  }
  $("#rangewarn").hidden = !w.length;
  $("#rangewarn").innerHTML = w.join("<br>");

  EQUATIONS.forEach((e, i) => {
    const r = evaluate(e, state.values[e.id], ath);
    const ra = e.alt ? evaluate(e, state.values[e.id], ath, e.alt) : null;
    $("#p-" + e.id).textContent = fmt(r.predicted, e.dp);
    $("#pp-" + e.id).textContent = Number.isFinite(r.percentPredicted) ? r.percentPredicted.toFixed(0) + "%" : "—";
    const zEl = $("#z-" + e.id);
    zEl.textContent = sgn(r.z);
    zEl.className = "zval" + (r.z > 1.96 ? " hi" : r.z < -1.96 ? " lo" : "");
    $("#za-" + e.id).textContent = ra && Number.isFinite(ra.z) ? `S3 ${sgn(ra.z)}` : "";
    drawBar($("#b-" + e.id), r.z, ra ? ra.z : NaN, i * 20 + 3, limits(e, r.predicted));
    document.querySelector(`.prow[data-id="${e.id}"]`).classList.toggle("sel", state.sel === e.id);
  });
  renderMath(ath);
}

function termStr(e, override = {}) {
  const p = { ...e, ...override };
  const parts = [p.C.toFixed(2)];
  if (p.a) parts.push(`Ht<sup>${p.a}</sup>`);
  if (state.sex === "M" && p.male !== 1) parts.push(p.male.toFixed(2));
  if (state.disc === "E" && p.end !== 1) parts.push(p.end.toFixed(2));
  if (p.b) parts.push(`RR<sup>${p.b}</sup>`);
  return parts.join(" × ");
}

// Reference values in the athlete's own units: each Z mapped back through μ.
function rangeBlock(e, r) {
  const lim = limits(e, r.predicted);
  if (!lim) return "";
  const rows = [
    { z: -1.96, label: "2.5th", lim: true }, { z: -1.645, label: "5th" }, { z: 0, label: "50th" },
    { z: 1.645, label: "95th" }, { z: 1.96, label: "97.5th", lim: true },
  ].map((x) => ({ ...x, pp: percentPredictedAtZ(e, x.z), v: valueAtZ(e, r.predicted, x.z) }));
  if (Number.isFinite(r.z)) {
    rows.push({ z: r.z, label: ord(100 * normalCdf(r.z)), pp: r.percentPredicted, v: r.measured, you: true });
    rows.sort((p, q) => p.z - q.z);
  }
  return `<p class="rangeline">Normal range (Z ±1.96): <b>${fmt(lim.lo, e.dp)} – ${fmt(lim.hi, e.dp)} ${e.unit}</b></p>
  <table class="ztable"><thead><tr><th>Percentile</th><th>Z</th><th>% pred</th><th>${e.abbr} (${e.unit})</th></tr></thead><tbody>${
    rows.map((x) => `<tr class="${x.lim ? "lim" : ""}${x.you ? " you" : ""}"><td>${x.you ? "This athlete" : x.label}</td><td>${sgn(x.z)}</td><td>${x.pp.toFixed(0)}%</td><td>${fmt(x.v, e.dp)}</td></tr>`).join("")
  }</tbody></table>`;
}

function renderMath(ath) {
  const e = EQUATIONS.find((x) => x.id === state.sel);
  const r = evaluate(e, state.values[e.id], ath);
  const ra = e.alt ? evaluate(e, state.values[e.id], ath, e.alt) : null;
  const who = `${state.sex === "M" ? "male" : "female"}, ${state.disc === "E" ? "endurance" : "sprint"}, ${fmt(ath.heightM, 2)} m, RR ${fmt(ath.rrSec, 3)} s`;
  let html = `<span class="eyebrow">Calculation</span><h3>${e.name}</h3><p class="note">${who}</p>
  <dl class="steps">
    <dt>Predicted μ</dt><dd>${termStr(e)} = <b>${fmt(r.predicted, e.dp + 1)} ${e.unit}</b></dd>
    <dt>Measured y</dt><dd>${fmt(r.measured, e.dp)} ${e.unit}</dd>
    <dt>% predicted</dt><dd>100 × ${fmt(r.measured, e.dp)} / ${fmt(r.predicted, e.dp + 1)} = <b>${fmt(r.percentPredicted, 1)}%</b></dd>
    <dt>ln(y/μ)</dt><dd>${fmt(r.lnRatio, 4)}</dd>
    <dt>Z</dt><dd>${e.k} × ${fmt(r.lnRatio, 4)} = <b>${sgn(r.z)}</b></dd>
    <dt>Percentile</dt><dd>${Number.isFinite(r.z) ? ord(100 * normalCdf(r.z)) : "—"}</dd>
  </dl>
  ${rangeBlock(e, r)}`;
  if (ra) {
    html += `<div class="issue"><span><b>Open question.</b> ${e.issue}</span>
      <table class="cmp"><thead><tr><th>Source</th><th>μ</th><th class="num">Predicted</th><th class="num">% pred</th><th class="num">Z</th></tr></thead><tbody>
      <tr><td>Table 4</td><td>${termStr(e)}</td><td class="num mono">${fmt(r.predicted, e.dp + 1)}</td><td class="num mono">${fmt(r.percentPredicted, 1)}</td><td class="num mono">${sgn(r.z)}</td></tr>
      <tr><td>Table S3</td><td>${termStr(e, e.alt)}</td><td class="num mono">${fmt(ra.predicted, e.dp + 1)}</td><td class="num mono">${fmt(ra.percentPredicted, 1)}</td><td class="num mono">${sgn(ra.z)}</td></tr>
      </tbody></table>
      <span>Difference in Z: <span class="mono">${sgn(ra.z - r.z)}</span></span></div>`;
  } else if (e.issue) {
    html += `<div class="issue res"><span><b>Resolved.</b> ${e.issue}</span></div>`;
  } else {
    html += `<p class="note">Table 4 and Table S3 agree, and the Z slope matches the Table 5 percentiles.</p>`;
  }
  $("#mathpanel").innerHTML = html;
}

/* ---------- controls ---------- */
document.querySelectorAll("[data-sex]").forEach((b) => b.addEventListener("click", () => { state.sex = b.dataset.sex; render(); }));
document.querySelectorAll("[data-disc]").forEach((b) => b.addEventListener("click", () => { state.disc = b.dataset.disc; render(); }));
$("#height").addEventListener("input", render);
$("#hr").addEventListener("input", render);
$("#hunit").addEventListener("click", () => {
  const h = $("#height"), v = parseFloat(h.value);
  if (state.hUnit === "cm") { state.hUnit = "in"; if (Number.isFinite(v)) h.value = (v / 2.54).toFixed(1); }
  else { state.hUnit = "cm"; if (Number.isFinite(v)) h.value = (v * 2.54).toFixed(1); }
  render();
});
$("#hrmode").addEventListener("click", () => {
  const h = $("#hr"), v = parseFloat(h.value);
  if (v > 0) h.value = Math.round(60000 / v);
  if (state.hrMode === "bpm") { state.hrMode = "ms"; h.step = "10"; }
  else { state.hrMode = "bpm"; h.step = "1"; }
  render();
});

/* ---------- report ---------- */
function reportData() {
  const ath = athlete();
  const rows = EQUATIONS.map((e) => ({ e, r: evaluate(e, state.values[e.id], ath) }))
    .filter(({ r }) => Number.isFinite(r.z))
    .map(({ e, r }) => ({ e, r, lim: limits(e, r.predicted), pct: 100 * normalCdf(r.z) }));
  const date = $("#rep-date").value;
  return {
    ath, rows,
    id: $("#rep-id").value.trim(),
    date: date ? new Date(date + "T00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "",
    sex: state.sex === "M" ? "Male" : "Female",
    disc: state.disc === "E" ? "Endurance" : "Sprint",
    height: `${fmt(ath.heightM * 100, 1)} cm`,
    hr: `${fmt(ath.hr, 0)} bpm (RR ${fmt(ath.rrSec, 3)} s)`,
    pending: rows.some(({ e }) => e.status === "open"),
  };
}

function reportText() {
  const d = reportData();
  const lines = ["Left heart Z-scores, elite cyclist reference (Herrera-Leaño et al., J Am Heart Assoc 2026)"];
  if (d.id || d.date) lines.push([d.id, d.date].filter(Boolean).join(" · "));
  lines.push(`${d.sex}, ${d.disc.toLowerCase()}; height ${d.height}; HR ${d.hr}`, "");
  for (const { e, r, lim, pct } of d.rows) {
    const flag = e.status === "open" ? "*" : "";
    lines.push(`${e.abbr}${flag} ${fmt(r.measured, e.dp)} ${e.unit}: Z ${sgn(r.z)} (${ord(pct)} percentile), ${r.percentPredicted.toFixed(0)}% of predicted ${fmt(r.predicted, e.dp)}; normal ${fmt(lim.lo, e.dp)}–${fmt(lim.hi, e.dp)}`);
  }
  if (!d.rows.length) lines.push("No measurements entered.");
  lines.push("", "Normal = Z −1.96 to +1.96 (2.5th–97.5th percentile).");
  if (d.pending) lines.push("* Equation coefficients pending confirmation by the authors.");
  return lines.join("\n");
}

function miniBar(z) {
  const X = (v) => 4 + ((Math.max(Z0, Math.min(Z1, v)) - Z0) / (Z1 - Z0)) * 122;
  return `<svg viewBox="0 0 130 14" aria-hidden="true"><rect x="${X(-1.96)}" y="3" width="${X(1.96) - X(-1.96)}" height="8" fill="#dfe5ea"/>
    <line x1="4" y1="7" x2="126" y2="7" stroke="#888" stroke-width=".6"/><line x1="${X(0)}" y1="2" x2="${X(0)}" y2="12" stroke="#888" stroke-width=".6"/>
    <circle cx="${X(z)}" cy="7" r="3.6" fill="${Math.abs(z) > 1.96 ? "#000" : "#fff"}" stroke="#000" stroke-width="1"/></svg>`;
}

function buildReport() {
  const d = reportData();
  const demo = [["Athlete / ID", d.id || "—"], ["Exam date", d.date || "—"], ["Sex", d.sex], ["Discipline", d.disc],
    ["Height", d.height], ["Heart rate", d.hr]];
  $("#report").innerHTML = `
    <h1>Left heart Z-scores · elite cyclist reference</h1>
    <p class="sub">Herrera-Leaño N, … Oxborough D. J Am Heart Assoc. 2026;15:e050142. doi:10.1161/JAHA.126.050142</p>
    <dl class="demo">${demo.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
    <table>
      <thead><tr><th>Measurement</th><th>Measured</th><th>Predicted</th><th>Normal range</th><th>% pred</th><th>Z</th><th>Percentile</th><th>−3 · 0 · +3</th></tr></thead>
      <tbody>${d.rows.length ? d.rows.map(({ e, r, lim, pct }) => `<tr>
        <td>${e.name}${e.status === "open" ? " *" : ""}</td>
        <td>${fmt(r.measured, e.dp)} ${e.unit}</td>
        <td>${fmt(r.predicted, e.dp)}</td>
        <td>${fmt(lim.lo, e.dp)} – ${fmt(lim.hi, e.dp)}</td>
        <td>${r.percentPredicted.toFixed(0)}%</td>
        <td class="${Math.abs(r.z) > 1.96 ? "flag" : ""}">${sgn(r.z)}</td>
        <td>${ord(pct)}</td>
        <td class="bar">${miniBar(r.z)}</td></tr>`).join("") : `<tr><td colspan="8">No measurements entered.</td></tr>`}</tbody>
    </table>
    <div class="notes">
      <span>Normal range = Z −1.96 to +1.96 (2.5th–97.5th percentile of healthy elite cyclists of the same height, sex, discipline and heart rate). Filled markers fall outside it.</span>
      ${d.pending ? "<span>* Equation coefficients pending confirmation by the authors.</span>" : ""}
      <span>Reference population: 181 elite British cyclists, age 22.7 ± 5.5 years; biplane Simpson volumes, ASE linear LV mass, 2D PLAX diameters. May not apply to other populations or methods. Not a substitute for clinical judgment.</span>
      <span>Generated ${new Date().toLocaleString()} · parameterz.github.io/cyclist-left-heart-zscores</span>
    </div>`;
}

function setStatus(msg, ok = false) {
  const st = $("#copy-status");
  st.textContent = msg;
  st.classList.toggle("ok", ok);
}

$("#rep-date").value = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
$("#btn-print").addEventListener("click", () => { buildReport(); window.print(); });
window.addEventListener("beforeprint", buildReport);
$("#btn-copy").addEventListener("click", async () => {
  const text = reportText();
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Report text copied. Paste it into your report.", true);
  } catch {
    setStatus("Copy was blocked by the browser. Use Print report instead.");
  }
});
$("#btn-clear").addEventListener("click", () => {
  EQUATIONS.forEach((e) => { state.values[e.id] = NaN; $("#v-" + e.id).value = ""; });
  setStatus("Measurements cleared. Enter the values you measured.");
  render();
  $("#v-" + EQUATIONS[0].id).focus();
});

buildRows();
buildRef();
drawLegend();
render();
if (window.ResizeObserver) {
  let raf = 0;
  new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }).observe($("#rows"));
}
document.fonts?.ready.then(render);
