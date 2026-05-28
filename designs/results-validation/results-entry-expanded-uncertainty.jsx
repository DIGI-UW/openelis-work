/**
 * Results Entry — Expanded Uncertainty (U) Capture
 *
 * Source ticket: OGC-775 — S-15a Result Expanded Uncertainty Capture (MVP)
 *   https://uwdigi.atlassian.net/browse/OGC-775
 * Parent epic: OGC-527
 * Consumed by: OGC-552 (S-06 LHU v2.0 conditional U column)
 * Spec: results-entry-expanded-uncertainty.md (this directory)
 *
 * What's new in this mockup:
 *   - Inline "U (k=2)" column added right of "Result" in the existing Results
 *     Entry table. Optional. Backward compatible — empty cell = lab did not
 *     enter U (most rows in non-accredited deployments).
 *
 * Scope reminders:
 *   - MVP only — no tooltip, no admin toggle, no method-level prefill,
 *     no placeholder text. Per OGC-775 "Out of scope". File S-15a v2 if
 *     evidence later shows the UX scaffolding is needed.
 *   - Coverage factor is hidden in MVP; always k=2. Per-row override is v2.
 *
 * Carbon React conventions: DataTable, NumberInput, Button, Tag.
 * IBM Plex Sans, Carbon design tokens (gray100 / gray70 / gray20 / blue60).
 */

import React, { useState } from "react";
import {
  DataTable,
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  NumberInput,
  Button,
  Tag,
  Stack,
  Layer,
  Breadcrumb,
  BreadcrumbItem,
  OverflowMenu,
  OverflowMenuItem,
} from "@carbon/react";
import { Edit, OverflowMenuVertical } from "@carbon/icons-react";

// ============================================================================
// Example data — Order LHU-2026-0042 / PT. Unggulrejo Wasono wastewater
//
// Same example values as Environmental LHU v2.0 FRS §6.2 so the mockup
// tells a coherent story end-to-end: the values entered here are what
// the LHU's conditional U column will render.
// ============================================================================

const SAMPLE_INFO = {
  orderNumber: "LHU-2026-0042/R",
  customer: "PT. Unggulrejo Wasono",
  matrix: "Air Limbah (Wastewater)",
  receivedDate: "2026-03-08",
  testDate: "2026-03-12 → 2026-03-15",
};

const INITIAL_RESULTS = [
  {
    id: "r-1",
    test: "BOD5",
    result: "11.2",
    expandedUncertainty: "1.8",
    coverageFactor: 2.0,
    unit: "mg/L",
    referenceRange: "≤ 60",
    method: "SNI 6989.72-2009",
    status: "Released",
  },
  {
    id: "r-2",
    test: "COD",
    result: "21.5",
    expandedUncertainty: "3.2",
    coverageFactor: 2.0,
    unit: "mg/L",
    referenceRange: "≤ 150",
    method: "SNI 6989.2-2019",
    status: "Released",
  },
  {
    id: "r-3",
    test: "pH",
    result: "6.7",
    expandedUncertainty: "0.1",
    coverageFactor: 2.0,
    unit: "—",
    referenceRange: "6.0–9.0",
    method: "SNI 6989.11-2019",
    status: "Released",
  },
  {
    id: "r-4",
    test: "Amonia Total (NH3 as N)",
    result: "0.255",
    expandedUncertainty: "0.038",
    coverageFactor: 2.0,
    unit: "mg/L",
    referenceRange: "≤ 8.0",
    method: "SNI 06-6989.30-2005",
    status: "Released",
  },
  {
    id: "r-5",
    test: "Fenol Total",
    result: "<0.0033",
    expandedUncertainty: null, // below LOD — lab leaves blank
    coverageFactor: null,
    unit: "mg/L",
    referenceRange: "≤ 0.5",
    method: "SNI 06-6989.21-2004",
    status: "Released",
  },
  {
    id: "r-6",
    test: "TSS",
    result: "14",
    // U left blank — backward-compat default for labs that haven't computed U
    // for this in-house method
    expandedUncertainty: null,
    coverageFactor: null,
    unit: "mg/L",
    referenceRange: "≤ 50",
    method: "In House",
    status: "Released",
  },
  {
    id: "r-7",
    test: "Krom Total (Cr)",
    result: "<0.0095",
    expandedUncertainty: null, // below LOD — lab leaves blank
    coverageFactor: null,
    unit: "mg/L",
    referenceRange: "≤ 1",
    method: "SNI 6989.84-2019",
    status: "Released",
  },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format an expanded-uncertainty value for display.
 *  - null / undefined / empty → empty string (lab did not enter U, or U doesn't
 *    apply to this row — either way the cell stays blank)
 *  - otherwise → "± <value>"
 *
 * The system does not infer whether U applies to a given row. The lab decides
 * by entering a value (numeric) or leaving it blank. No "—" or "N/A" sentinel
 * is rendered in Results Entry; that's an LHU rendering concern (the LHU
 * template can choose to render "—" on the report face when it detects a
 * `<`-prefixed result value with a null U).
 */
function formatU(value) {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `± ${value}`;
}

// ============================================================================
// Main mockup component
// ============================================================================

export default function ResultsEntryExpandedUncertaintyMockup() {
  const [results, setResults] = useState(INITIAL_RESULTS);
  const [editingId, setEditingId] = useState(null);

  const headers = [
    { key: "test", header: "Test" },
    { key: "result", header: "Result" },
    { key: "uncertainty", header: "U (k=2)" }, // ← NEW column
    { key: "unit", header: "Unit" },
    { key: "referenceRange", header: "Reference Range" },
    { key: "method", header: "Method" },
    { key: "status", header: "Status" },
    { key: "actions", header: "" },
  ];

  function handleUChange(id, raw) {
    setResults((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              expandedUncertainty: raw === "" ? null : raw,
              // coverage factor stays 2.0 in MVP; hidden field
              coverageFactor: raw === "" ? null : 2.0,
            }
          : r,
      ),
    );
  }

  return (
    <Layer className="results-entry-uncertainty-mockup" style={{ padding: "1.5rem 2rem", background: "#f4f4f4", minHeight: "100vh" }}>
      <Stack gap={5}>
        {/* Breadcrumb */}
        <Breadcrumb noTrailingSlash aria-label="page navigation">
          <BreadcrumbItem href="#">Home</BreadcrumbItem>
          <BreadcrumbItem href="#">Results</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Order {SAMPLE_INFO.orderNumber}</BreadcrumbItem>
        </Breadcrumb>

        {/* Header card with sample context */}
        <Layer level={1} style={{ background: "white", padding: "1.25rem 1.5rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--cds-text-primary, #161616)", margin: 0 }}>
                Results Entry &mdash; {SAMPLE_INFO.orderNumber}
              </h1>
              <p style={{ marginTop: "0.5rem", color: "var(--cds-text-secondary, #525252)", fontSize: "0.875rem" }}>
                {SAMPLE_INFO.customer} &middot; {SAMPLE_INFO.matrix}
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--cds-text-helper, #6f6f6f)" }}>
              <div>Received: {SAMPLE_INFO.receivedDate}</div>
              <div>Tested: {SAMPLE_INFO.testDate}</div>
            </div>
          </div>
        </Layer>

        {/* What's new banner (mockup-only annotation; not part of the production UI) */}
        <Layer level={1} style={{ background: "#edf5ff", borderLeft: "4px solid var(--cds-link-primary, #0f62fe)", padding: "0.875rem 1.25rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{ flex: 1, fontSize: "0.875rem", color: "var(--cds-text-primary, #161616)" }}>
              <strong>OGC-775 mockup callout (not in production UI):</strong>{" "}
              the only change to this screen is the new <strong>U (k=2)</strong> column right of <strong>Result</strong>. Optional, numeric, blank by default. Backward-compatible &mdash; rows with no U entered render as empty cells (see Fenol Total, TSS, and Krom Total rows). The system does not auto-detect "uncertainty doesn't apply here" &mdash; the lab simply leaves the cell blank. The LHU template (OGC-552) can render its own &mdash; (em dash) on the report face for below-LOD rows; that's a presentation concern, not an entry concern.
            </div>
          </div>
        </Layer>

        {/* Results table */}
        <DataTable rows={results.map((r) => ({ ...r, id: r.id }))} headers={headers}>
          {({ getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
            <TableContainer
              title="Results"
              description="Validated test results for this order. Edit a row to enter or update U (k=2)."
              {...getTableContainerProps()}
            >
              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader
                        key={header.key}
                        {...getHeaderProps({ header })}
                        // Highlight the new column subtly in the mockup banner is fine;
                        // production header has no special styling
                      >
                        {header.header}
                        {header.key === "uncertainty" && (
                          <span
                            style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", color: "var(--cds-link-primary, #0f62fe)", fontWeight: 600 }}
                            aria-hidden
                            title="New for v2 — see callout above"
                          >
                            NEW
                          </span>
                        )}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((row) => {
                    const isEditing = editingId === row.id;
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {/* Test */}
                        <TableCell>
                          <span>{row.test}</span>
                        </TableCell>

                        {/* Result */}
                        <TableCell>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{row.result}</span>
                        </TableCell>

                        {/* U (k=2) — NEW for OGC-775. Empty by default. Lab fills in
                            when it applies; leaves blank otherwise (below-LOD,
                            qualitative, or U-not-computed-by-this-method). */}
                        <TableCell>
                          {isEditing ? (
                            <NumberInput
                              id={`u-${row.id}`}
                              label=""
                              hideLabel
                              hideSteppers
                              min={0}
                              step={0.001}
                              value={row.expandedUncertainty ?? ""}
                              onChange={(_, { value }) => handleUChange(row.id, value)}
                              size="sm"
                              invalidText="Uncertainty must be a non-negative number."
                              invalid={row.expandedUncertainty != null && Number(row.expandedUncertainty) < 0}
                            />
                          ) : (
                            <span style={{ fontVariantNumeric: "tabular-nums", color: row.expandedUncertainty ? "var(--cds-text-primary, #161616)" : "var(--cds-text-placeholder, #a8a8a8)" }}>
                              {row.expandedUncertainty ? formatU(row.expandedUncertainty) : ""}
                            </span>
                          )}
                        </TableCell>

                        {/* Unit */}
                        <TableCell>
                          <span style={{ color: "var(--cds-text-secondary, #525252)" }}>{row.unit}</span>
                        </TableCell>

                        {/* Reference Range */}
                        <TableCell>{row.referenceRange}</TableCell>

                        {/* Method */}
                        <TableCell>
                          <span style={{ fontSize: "0.8125rem", color: "var(--cds-text-helper, #6f6f6f)" }}>{row.method}</span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Tag type={row.status === "Released" ? "green" : "gray"} size="sm">
                            {row.status}
                          </Tag>
                        </TableCell>

                        {/* Actions */}
                        <TableCell style={{ width: "8rem" }}>
                          {isEditing ? (
                            <>
                              <Button
                                kind="primary"
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                Save
                              </Button>
                              <Button
                                kind="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                style={{ marginLeft: "0.25rem" }}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Edit}
                                onClick={() => setEditingId(row.id)}
                                iconDescription="Edit row"
                                hasIconOnly
                              />
                              <OverflowMenu
                                size="sm"
                                aria-label="more actions"
                                renderIcon={OverflowMenuVertical}
                                flipped
                              >
                                <OverflowMenuItem itemText="View audit trail" />
                                <OverflowMenuItem itemText="View method details" />
                                <OverflowMenuItem itemText="Mark as overridden" />
                              </OverflowMenu>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>

        {/* Footer / legend */}
        <Layer level={1} style={{ background: "white", padding: "1rem 1.25rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)", fontSize: "0.8125rem", color: "var(--cds-text-secondary, #525252)" }}>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <div>
              <strong>U (k=2):</strong>
              <span style={{ marginLeft: "0.5rem" }}>
                Expanded measurement uncertainty at coverage factor k = 2 (~95% coverage). Optional — leave blank if not applicable or not computed for this method.
              </span>
            </div>
          </div>
        </Layer>
      </Stack>
    </Layer>
  );
}
