// Multi-Component Result Entry — V1 (developer handoff mockup)
//
// Route: the EXISTING Results page (SearchResultForm.jsx, a react-data-table-component grid).
// V1 is additive: a test with >1 result component renders one result-entry field PER component,
// each produced by the SAME result-cell renderer the primary result uses today (chosen by the
// component's result_type). Nothing is hard-coded to "Ct" — that is just the unit on the molecular
// numeric components. Target gene + Ct is the first use case.
//
// Non-breaking (see FRS):
//   • A single-component test renders exactly one result line, as today.
//   • Additional components reuse the existing widgets (Select / numeric TextInput / TextArea /
//     multi-select) — no new widgets, no new columns.
//   • The primary component keeps today's read/write path; extra components persist via a new
//     nullable component linkage.
//
// This file illustrates the REUSED element as <ResultField>, rendered once per component. In the
// real page this is the existing `renderCell` "result" branch — reuse it, don't rebuild it.

import React, { useState, useCallback } from "react";
import { Select, SelectItem, TextInput, TextArea, Button } from "@carbon/react";

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Mock data: each analysis carries its result components. `resultType` mirrors
// the existing set (D single-select, N numeric, R/A free text, M/C multi-select).
// components[0] is the primary result (rendered exactly as today).
// ---------------------------------------------------------------------------
const INITIAL = [
  {
    id: "a1",
    accessionNumber: "TB-2026-004182",
    sequenceNumber: "1",
    patientName: "Achieng, Mary",
    patientInfo: "F · 34y",
    analysisMethod: "GeneXpert",
    testName: "Xpert MTB/RIF",
    sampleType: "(Sputum)",
    components: [
      { id: "a1-mtb", code: "MTB", label: "MTB detection", resultType: "D",
        options: ["", "MTB DETECTED", "MTB NOT DETECTED"], value: "MTB DETECTED", normalRange: "—", unit: "" },
      { id: "a1-rif", code: "RIF", label: "RIF resistance", resultType: "D",
        options: ["", "DETECTED", "NOT DETECTED"], value: "NOT DETECTED", normalRange: "—", unit: "" },
      { id: "a1-a", code: "rpoB_A", label: "rpoB Probe A", resultType: "N", value: "24.6", normalRange: "< 39.0", unit: "Ct", significantDigits: 1 },
      { id: "a1-b", code: "rpoB_B", label: "rpoB Probe B", resultType: "N", value: "25.1", normalRange: "< 39.0", unit: "Ct", significantDigits: 1 },
      { id: "a1-c", code: "rpoB_C", label: "rpoB Probe C", resultType: "N", value: "24.9", normalRange: "< 39.0", unit: "Ct", significantDigits: 1 },
      { id: "a1-d", code: "rpoB_D", label: "rpoB Probe D", resultType: "N", value: "25.4", normalRange: "< 36.0", unit: "Ct", significantDigits: 1 },
      { id: "a1-e", code: "rpoB_E", label: "rpoB Probe E", resultType: "N", value: "25.0", normalRange: "< 36.0", unit: "Ct", significantDigits: 1 },
    ],
  },
  {
    id: "a2",
    accessionNumber: "RESP-2026-009913",
    sequenceNumber: "1",
    patientName: "Odhiambo, John",
    patientInfo: "M · 41y",
    analysisMethod: "GeneXpert",
    testName: "Xpert Xpress SARS-CoV-2",
    sampleType: "(NP swab)",
    components: [
      { id: "a2-call", code: "SARS", label: "SARS-CoV-2", resultType: "D",
        options: ["", "DETECTED", "NOT DETECTED"], value: "DETECTED", normalRange: "—", unit: "" },
      { id: "a2-n2", code: "N2", label: "N2 gene", resultType: "N", value: "22.8", normalRange: "—", unit: "Ct", significantDigits: 1 },
      { id: "a2-e", code: "E", label: "E gene", resultType: "N", value: "23.5", normalRange: "—", unit: "Ct", significantDigits: 1 },
    ],
  },
  {
    id: "a3",
    accessionNumber: "CHEM-2026-118840",
    sequenceNumber: "1",
    patientName: "Wanjiru, Grace",
    patientInfo: "F · 52y",
    analysisMethod: "Cobas c311",
    testName: "Glucose, fasting",
    sampleType: "(Serum)",
    // Single component → renders exactly as today.
    components: [
      { id: "a3-glu", code: "GLU", label: "Glucose, fasting", resultType: "N", value: "96", normalRange: "70–99 mg/dL", unit: "mg/dL", significantDigits: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// REUSED result element — this is the existing `renderCell` "result" branch.
// In the app, call the existing renderer per component instead of duplicating it.
// ---------------------------------------------------------------------------
function ResultField({ component, readOnly, onChange }) {
  const c = component;
  if (readOnly) {
    return (
      <strong>
        {c.value || "—"}
        {c.unit ? <span style={{ color: "var(--cds-text-secondary)", marginLeft: 6, fontSize: "0.75rem" }}>{c.unit}</span> : null}
      </strong>
    );
  }
  switch (c.resultType) {
    case "D": // single-select (dictionary)
      return (
        <Select
          id={`resultValue-${c.id}`}
          name={`testResult[${c.id}].resultValue`}
          labelText=""
          value={c.value}
          onChange={(e) => onChange(c.id, e.target.value)}
        >
          {c.options.map((o, i) => (
            <SelectItem key={i} text={o} value={o} />
          ))}
        </Select>
      );
    case "N": // numeric
      return (
        <div style={{ display: "flex", alignItems: "center" }}>
          <TextInput
            type="number"
            id={`resultValue-${c.id}`}
            name={`testResult[${c.id}].resultValue`}
            labelText=""
            value={c.value}
            onChange={(e) => onChange(c.id, e.target.value)}
          />
          {c.unit ? <span style={{ color: "var(--cds-text-secondary)", marginLeft: 6, fontSize: "0.75rem" }}>{c.unit}</span> : null}
        </div>
      );
    case "R":
    case "A": // free text
      return (
        <TextArea
          rows={1}
          id={`resultValue-${c.id}`}
          name={`testResult[${c.id}].resultValue`}
          labelText=""
          value={c.value}
          onChange={(e) => onChange(c.id, e.target.value)}
        />
      );
    default:
      return <span>{c.value}</span>;
  }
}

export default function MultiComponentResultsEntryV1({ readOnly = false }) {
  const [rows, setRows] = useState(INITIAL);

  const updateValue = useCallback((componentId, value) => {
    setRows((prev) =>
      prev.map((a) => ({
        ...a,
        components: a.components.map((c) => (c.id === componentId ? { ...c, value } : c)),
      })),
    );
  }, []);

  return (
    <div className="cds--data-table-container">
      <table className="cds--data-table">
        <thead>
          <tr>
            <th>{t("column.name.sampleInfo", "Sample Info")}</th>
            <th>{t("column.name.testDate", "Test Date")}</th>
            <th>{t("column.name.analyzerResult", "Analyzer Result")}</th>
            <th>{t("column.name.testName", "Test Name")}</th>
            <th>{t("column.name.normalRange", "Normal Range")}</th>
            <th>{t("column.name.accept", "Accept")}</th>
            <th>{t("column.name.result", "Result")}</th>
            <th>{t("column.name.currentResult", "Current Result")}</th>
            <th>{t("column.name.notes", "Notes")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) =>
            a.components.map((c, idx) => {
              const first = idx === 0;
              return (
                <tr key={c.id} style={first ? undefined : { background: "var(--cds-layer-01)" }}>
                  {/* Sample / date / analyzer / accept render on the primary line only */}
                  <td>
                    {first ? (
                      <div>
                        <strong>
                          {a.accessionNumber}-{a.sequenceNumber}
                        </strong>
                        {a.components.length > 1 ? (
                          <span className="cds--tag cds--tag--purple" style={{ marginLeft: 6 }}>
                            {t("tag.results.multiComponent", "multi")}
                          </span>
                        ) : null}
                        <div style={{ color: "var(--cds-text-secondary)", fontSize: "0.75rem" }}>
                          {a.patientName} · {a.patientInfo}
                        </div>
                      </div>
                    ) : null}
                  </td>
                  <td>{first ? <span style={{ color: "var(--cds-text-secondary)" }}>2026-07-08 09:14</span> : null}</td>
                  <td style={{ color: "var(--cds-text-secondary)" }}>{first ? a.analysisMethod : null}</td>
                  <td style={first ? undefined : { paddingLeft: "1.5rem" }}>
                    {first ? (
                      <span>
                        {a.testName} <span style={{ color: "var(--cds-text-secondary)" }}>{a.sampleType}</span>
                      </span>
                    ) : (
                      <span>↳ {c.label}</span>
                    )}
                  </td>
                  <td style={{ color: "var(--cds-text-secondary)" }}>{c.normalRange}</td>
                  <td>{first ? <input type="checkbox" defaultChecked aria-label={t("column.name.accept", "Accept")} /> : null}</td>
                  <td>
                    <ResultField component={c} readOnly={readOnly} onChange={updateValue} />
                  </td>
                  <td style={{ color: "var(--cds-text-secondary)" }}>—</td>
                  <td>
                    {readOnly ? (
                      <span style={{ color: "var(--cds-text-secondary)" }}>—</span>
                    ) : (
                      <TextArea rows={1} id={`note-${c.id}`} name={`testResult[${c.id}].note`} labelText="" />
                    )}
                  </td>
                </tr>
              );
            }),
          )}
        </tbody>
      </table>
      {!readOnly ? (
        <div style={{ marginTop: "1rem" }}>
          <Button kind="primary">{t("label.button.save", "Save")}</Button>
        </div>
      ) : null}
    </div>
  );
}
