import React, { useState } from "react";

/**
 * Analyzer Results Import — redesign v2 (OGC-288)
 * QC-first batch review · multi-component (multiplex) results · accession-keyed
 * matching + exception surfacing · QC-fail action set (Retest / Report NCE /
 * Reject / Accept-despite-files-NCE). Access: `results` permission.
 *
 * Self-contained mockup for the design gallery. Carbon look via @carbon/styles
 * (loaded by the gallery shell); styling below is scoped inline for portability.
 * No required props; default export.
 */

const STYLE = `
.air-wrap{padding:1rem 1.25rem;max-width:1240px;margin:0 auto;font-family:'IBM Plex Sans',sans-serif;color:#161616;}
.air-layout{display:flex;gap:16px;}
.air-main{flex:1;min-width:0;} .air-side{width:250px;flex:none;}
.air-card{background:#fff;border:1px solid #e0e0e0;margin-bottom:14px;}
.air-card h3{margin:0;padding:10px 14px;font-size:14px;border-bottom:1px solid #e0e0e0;}
.air-pad{padding:12px 14px;}
.air-sub{color:#6f6f6f;font-size:12px;}
.air-qcpass{border:1px solid #24a148;background:#defbe6;padding:10px 14px;font-size:13px;font-weight:600;color:#0e6027;margin-bottom:14px;}
.air-qcfail{border:1px solid #da1e28;background:#fff1f1;padding:10px 14px;font-size:13px;font-weight:600;color:#a2191f;margin-bottom:14px;}
.air-lvls{display:flex;gap:8px;margin-top:8px;}
.air-lvl{border:1px solid #c6c6c6;background:#fff;border-radius:4px;padding:6px 12px;font-size:12px;text-align:center;}
.air-ok{color:#24a148;font-weight:700;} .air-bad{color:#da1e28;font-weight:700;}
.air-runset{display:flex;gap:20px;flex-wrap:wrap;font-size:12.5px;}
.air-chip{display:inline-block;border:1px solid #c6c6c6;border-radius:14px;padding:2px 10px;margin:2px;font-size:11.5px;background:#f4f4f4;}
.air-table{width:100%;border-collapse:collapse;}
.air-table th{font-size:11.5px;font-weight:600;color:#525252;text-align:left;padding:8px 10px;border-bottom:1px solid #c6c6c6;white-space:nowrap;}
.air-table td{font-size:12.5px;padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:middle;}
.air-comp td{background:#fafafa;} .air-comp .air-cname{padding-left:24px;color:#393939;}
.air-arrow{color:#a8a8a8;margin-right:6px;}
.air-tag{display:inline-block;border-radius:4px;padding:0 7px;font-size:11px;font-weight:600;}
.air-green{background:#defbe6;color:#0e6027;} .air-red{background:#fff1f1;color:#a2191f;} .air-gray{background:#f2f4f8;color:#525252;} .air-purple{background:#f6f2ff;color:#6929c4;} .air-amber{background:#fcf4d6;color:#8e6a00;}
.air-exc{background:#fff8e1;} .air-ncrow td{background:#fff4f4 !important;}
.air-num{color:#161616;} .air-muted{color:#a8a8a8;}
.air-btn{font-size:12px;border:1px solid #0f62fe;background:#0f62fe;color:#fff;padding:7px 12px;cursor:pointer;border-radius:2px;}
.air-btn:disabled{background:#c1c7cd;border-color:#c1c7cd;cursor:not-allowed;}
.air-btn.ghost{background:none;color:#0f62fe;} .air-btn.amber{border-color:#8e6a00;color:#8e6a00;background:none;}
.air-expbtn{background:none;border:none;color:#0f62fe;cursor:pointer;font-size:12px;padding:2px 6px;}
.air-toolbar{display:flex;align-items:center;gap:14px;padding:10px 12px;border-bottom:1px solid #e0e0e0;font-size:12.5px;background:#f9f9f9;}
.air-link{color:#0f62fe;background:none;border:none;cursor:pointer;font-size:12.5px;padding:0;}
.air-warn{display:inline-flex;align-items:center;gap:6px;color:#8e6a00;font-weight:600;font-size:12.5px;}
.air-tri{display:inline-block;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid #f1c21b;position:relative;}
.air-tri::after{content:"!";position:absolute;left:-2.5px;top:2px;font-size:8px;font-weight:700;color:#161616;}
.air-sideitem{font-size:12px;padding:8px 12px;border-bottom:1px solid #f0f0f0;}
.air-note{background:#edf5ff;border-left:3px solid #0f62fe;padding:9px 13px;font-size:12.5px;margin:8px 10px;}
.air-toggle{font-size:11.5px;border:1px solid #8d8d8d;background:#fff;border-radius:2px;padding:3px 8px;cursor:pointer;}
`;

const ANALYSES = [
  { id: "a1", labno: "TB-2026-004182-1", patient: "Achieng, Mary", test: "Xpert MTB/RIF", normal: false,
    comps: [
      { code: "MTB", label: "MTB detection", val: "MTB DETECTED", kind: "red" },
      { code: "RIF", label: "RIF resistance", val: "NOT DETECTED", kind: "green" },
      { code: "rpoB_A", label: "rpoB Probe A", val: "24.6", unit: "Ct" },
      { code: "rpoB_B", label: "rpoB Probe B", val: "25.1", unit: "Ct" },
      { code: "rpoB_C", label: "rpoB Probe C", val: "24.9", unit: "Ct" },
      { code: "rpoB_D", label: "rpoB Probe D", val: "25.4", unit: "Ct" },
      { code: "rpoB_E", label: "rpoB Probe E", val: "25.0", unit: "Ct" },
      { code: "SPC", label: "Sample Processing Control", val: "valid", kind: "gray", internal: true },
    ] },
  { id: "a2", labno: "RESP-2026-009913-1", patient: "Odhiambo, John", test: "Xpert Xpress SARS-CoV-2", normal: false,
    comps: [
      { code: "SARS", label: "SARS-CoV-2", val: "DETECTED", kind: "red" },
      { code: "N2", label: "N2 gene", val: "22.8", unit: "Ct" },
      { code: "E", label: "E gene", val: "23.5", unit: "Ct" },
      { code: "ORF1ab", label: "ORF1ab", val: "21.9", unit: "Ct", unmapped: true },
    ] },
  { id: "a3", labno: "CHEM-2026-118840-1", patient: "Wanjiru, Grace", test: "Glucose, fasting", normal: true,
    comps: [{ code: "GLU", label: "Glucose, fasting", val: "96", unit: "mg/dL", range: "70–99" }] },
  { id: "a4", labno: "CHEM-2026-118842-1", patient: "Okoth, Peter", test: "Glucose, fasting", normal: true,
    comps: [{ code: "GLU", label: "Glucose, fasting", val: "88", unit: "mg/dL", range: "70–99" }] },
];

function Val({ c }) {
  if (c.kind) return <span className={"air-tag air-" + c.kind}>{c.val}</span>;
  return <span className="air-num">{c.val}{c.unit && <span className="air-sub"> {c.unit}</span>}</span>;
}

export default function AnalyzerImportReview() {
  const [qcFail, setQcFail] = useState(false);
  const [open, setOpen] = useState({ a1: true });
  const [sel, setSel] = useState({});
  const ids = ANALYSES.map((a) => a.id);
  const selCount = ids.filter((i) => sel[i]).length;
  const allOn = selCount === ids.length && selCount > 0;
  const toggleRow = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const toggleSel = (id) => setSel((s) => ({ ...s, [id]: !s[id] }));
  const selectAll = () => { const v = {}; ids.forEach((i) => (v[i] = !allOn)); setSel(v); };
  const selectNormal = () => { const v = {}; ANALYSES.forEach((a) => (v[a.id] = a.normal)); setSel(v); };

  return (
    <div className="air-wrap">
      <style>{STYLE}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h2 style={{ fontWeight: 400, margin: "0 0 2px" }}>Analyzer Results Import — GeneXpert (Run RUN-2026-0710-004)</h2>
          <div className="air-sub">QC-first review · multi-component runs group per-target values under the analysis</div>
        </div>
        <button className="air-toggle" onClick={() => setQcFail((f) => !f)}>Demo: QC {qcFail ? "FAILED" : "passed"} — flip</button>
      </div>
      <div style={{ height: 10 }} />

      {qcFail ? (
        <div className="air-qcfail">⛔ QC FAILURE — Level 2 control out of range. Patient results are <u>non-conforming</u> and cannot be accepted until resolved.
          <div className="air-lvls">
            <div className="air-lvl">Pos control<br />DETECTED <span className="air-ok">✓</span></div>
            <div className="air-lvl" style={{ borderColor: "#da1e28" }}>Neg control<br />DETECTED <span className="air-bad">✗</span></div>
            <div className="air-lvl">SPC (IC)<br />valid <span className="air-ok">✓</span></div>
          </div>
          <div className="air-sub" style={{ marginTop: 6, fontWeight: 400 }}>Neg control read DETECTED (expected NOT DETECTED) → fail. <button className="air-link">View Levey-Jennings</button> · <button className="air-link">Create non-conformity</button></div>
        </div>
      ) : (
        <div className="air-qcpass">✓ All controls passed — patient results can be accepted
          <div className="air-lvls">
            <div className="air-lvl">Pos control<br />DETECTED <span className="air-ok">✓</span></div>
            <div className="air-lvl">Neg control<br />NOT DETECTED <span className="air-ok">✓</span></div>
            <div className="air-lvl">SPC (IC)<br />valid <span className="air-ok">✓</span></div>
          </div>
          <div className="air-sub" style={{ marginTop: 6, fontWeight: 400 }}>Verdict = analyzer QC flag when sent; else observed-vs-expected (Pos→DETECTED, Neg→NOT DETECTED, IC→valid).</div>
        </div>
      )}

      <div className="air-layout">
        <div className="air-main">
          <div className="air-card">
            <h3>⚙ Run Settings <span className="air-sub" style={{ fontWeight: 400 }}>· applied to all accepted results</span></h3>
            <div className="air-pad air-runset">
              <div><div className="air-sub">Analyzer</div><b>Cepheid GeneXpert</b> <span className={"air-tag air-" + (qcFail ? "red" : "green")}>{qcFail ? "QC ✗" : "Online · QC ✓"}</span></div>
              <div><div className="air-sub">Cartridge / reagent lots (analyzer-reported or manual — no FIFO)</div>
                <span className="air-chip">Xpert MTB/RIF · LOT-2026-0421 <span className="air-tag air-gray">analyzer-reported</span></span>
                <span className="air-chip">SARS cartridge · <button className="air-link">Select lot…</button> · <button className="air-link">Use last-used lot</button></span>
              </div>
            </div>
          </div>

          <div className="air-card">
            <h3>Patient results</h3>
            <div className="air-note">Keyed on the <b>lab number</b> (accession); patient name = confirmation only, no full demographics. Multi-component tests expand to per-target values; unmapped target (ORF1ab) surfaced with “Map now”; internal controls (SPC) muted.</div>
            <div className="air-toolbar">
              <label><input type="checkbox" checked={allOn} onChange={selectAll} /> Select all</label>
              <button className="air-link" onClick={selectNormal}>Select normal only</button>
              <span className="air-sub">{selCount} selected</span>
            </div>
            <table className="air-table">
              <thead>
                <tr><th style={{ width: 28 }} /><th style={{ width: 28 }} /><th>Sample Info</th><th>Test</th><th>Result</th><th>Range</th><th>QC</th></tr>
              </thead>
              <tbody>
                {ANALYSES.map((a) => {
                  const first = a.comps[0];
                  const has = a.comps.length > 1;
                  return (
                    <React.Fragment key={a.id}>
                      <tr className={qcFail ? "air-ncrow" : ""}>
                        <td><input type="checkbox" checked={!!sel[a.id]} onChange={() => toggleSel(a.id)} /></td>
                        <td>{has ? <button className="air-expbtn" onClick={() => toggleRow(a.id)}>{open[a.id] ? "▾" : "▸"}</button> : ""}</td>
                        <td>{qcFail && <span className="air-tag air-red" style={{ marginRight: 6 }}>NC</span>}<b>{a.labno}</b>{has && <span className="air-tag air-purple" style={{ marginLeft: 6 }}>{a.comps.filter((c) => !c.internal).length} comp</span>}<div className="air-sub">{a.patient}</div></td>
                        <td>{a.test}</td>
                        <td><Val c={first} /></td>
                        <td className="air-sub">{first.range || "—"}</td>
                        <td>{qcFail ? <span className="air-tag air-red">QC ✗</span> : <span className="air-tag air-green">QC ✓</span>}</td>
                      </tr>
                      {has && open[a.id] && a.comps.slice(1).map((c) => (
                        <tr key={c.code} className={"air-comp" + (c.unmapped ? " air-exc" : "")}>
                          <td /><td />
                          <td className="air-cname"><span className="air-arrow">↳</span>{c.label}{c.internal && <span className="air-tag air-gray" style={{ marginLeft: 6 }}>internal control</span>}{c.unmapped && <span className="air-tag air-amber" style={{ marginLeft: 6 }}>unmapped</span>}</td>
                          <td className="air-sub">{c.code}</td>
                          <td>{c.unmapped ? <span className="air-num">{c.val} {c.unit} <button className="air-link">Map now →</button></span> : <Val c={c} />}</td>
                          <td className="air-sub">—</td><td className="air-muted">—</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            <div className="air-pad" style={{ borderTop: "1px solid #e0e0e0" }}>
              {!qcFail ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button className="air-btn" disabled={selCount === 0}>Accept selected ({selCount})</button>
                  <button className="air-btn amber">Retest</button>
                  <button className="air-btn ghost">Ignore</button>
                  {selCount === 0 && <span className="air-sub" style={{ marginLeft: 6 }}>Select results to accept.</span>}
                </div>
              ) : (
                <div>
                  <div className="air-warn" style={{ marginBottom: 8 }}><span className="air-tri" /> QC failed — the usual path is <b>Retest</b> (run it again until QC passes). Releasing these requires filing an NCE.</div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button className="air-btn">Retest</button>
                    <button className="air-btn ghost">Report NCE</button>
                    <button className="air-btn ghost">Reject <span className="air-sub">(NCE optional)</span></button>
                    <button className="air-btn amber">Accept despite QC failure (files NCE)</button>
                    <span className="air-sub" style={{ marginLeft: 6 }}>results permission · logged</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="air-side">
          <div className="air-card">
            <h3>QA / QC</h3>
            <div className="air-sideitem"><b>Current run: {qcFail ? "QC FAILED" : "QC Passed"}</b><div className="air-sub">RUN-2026-0710-004</div></div>
            <div className="air-sideitem">Recent QC<br /><span className="air-sub">07/10 {qcFail ? "✗" : "✓"} · 07/09 ✓ · 07/09 ✓ · 07/08 ✓</span></div>
            <div className="air-sideitem">Analyzer<br /><span className="air-sub">Cepheid GeneXpert · Online</span></div>
            <div className="air-sideitem">Reagents<br /><span className="air-sub">MTB/RIF LOT-0421 · OK<br />SARS LOT-0388 · OK</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
