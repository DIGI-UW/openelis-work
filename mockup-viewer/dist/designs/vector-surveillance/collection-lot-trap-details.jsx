/**
 * Vector Collection Workflow — Trap Detail Fields
 *
 * Source ticket: OGC-777 — V-05a VectorSpecimen Trap-Detail Fields (STRETCH)
 *   https://uwdigi.atlassian.net/browse/OGC-777
 * Parent epic: OGC-527
 * Host screen: V-02 Vector Collection Workflow (OGC-581, ✅ Done)
 * Consumed by: OGC-552 (S-06 LHU v2.0 Mode A "Penjebakan / Trap details" footnote)
 * Spec: collection-lot-trap-details.md (this directory)
 *
 * What's new in this mockup:
 *   - New "Trap Configuration" section on the existing CollectionLot edit form,
 *     adding four optional fields: lure, deployment_start, deployment_end,
 *     storage_temperature_c. trap_type (existing) is grouped into this section
 *     so all trap-config fields cluster visually.
 *
 * Scope reminders (per OGC-777):
 *   - STRETCH ticket. Partner labs report they don't yet capture this data.
 *     Schema + UI ready; fields stay NULL until lab practice catches up.
 *   - All four new fields are optional. Trap Type remains required (existing).
 *   - lure is FREE TEXT (not coded / not enum / not reference data). It's
 *     stored and displayed on the LHU footnote, never used for filtering or
 *     evaluation, so admin reference data is unnecessary overhead. (Decision
 *     made 2026-05-28 after the original ENUM-based scope.)
 *   - No per-field tooltips. One section-level helper line.
 *   - Soft warning if deployment_end < deployment_start; no hard block.
 *
 * Carbon React conventions: Form, Stack, Dropdown, TextInput, DatePicker,
 * TimePicker, NumberInput, InlineNotification, Layer.
 * IBM Plex Sans, Carbon design tokens.
 */

import React, { useState } from "react";
import {
  Form,
  FormGroup,
  Stack,
  Dropdown,
  DatePicker,
  DatePickerInput,
  TimePicker,
  TimePickerSelect,
  SelectItem,
  NumberInput,
  Button,
  InlineNotification,
  Layer,
  Breadcrumb,
  BreadcrumbItem,
  TextInput,
  TextArea,
} from "@carbon/react";
import { Information } from "@carbon/icons-react";

// ============================================================================
// Example data — CollectionLot CL-2026-0117 from a hypothetical
// BBLKM Jakarta Aedes aegypti trap deployment in Kel. Mampang Prapatan.
// Same data the LHU v2.0 Mode A example uses, so end-to-end traceability
// holds: values entered here populate the LHU §5A Mode A footnote
// "Penjebakan / Trap details" + "Rantai dingin / Cold chain" lines.
// ============================================================================

const TRAP_TYPE_OPTIONS = [
  { id: "BG_SENTINEL", label: "BG-Sentinel" },
  { id: "CDC_BOTTLE", label: "CDC bottle trap" },
  { id: "GRAVID", label: "Gravid trap" },
  { id: "OVITRAP", label: "Ovitrap" },
  { id: "LIGHT_TRAP", label: "Light trap" },
  { id: "HUMAN_LANDING_CATCH", label: "Human Landing Catch" },
  { id: "DIPPER", label: "Dipper" },
  { id: "PIPETTE", label: "Pipette" },
  { id: "OTHER", label: "Other" },
];

const INITIAL_LOT = {
  // Existing CollectionLot fields (shown above the Trap Configuration section
  // — collapsed in this mockup since they're not what this ticket changes)
  collectionLotNumber: "CL-2026-0117",
  site: "Kel. Mampang Prapatan, Kec. Mampang Prapatan, Kota Jakarta Selatan",
  collector: "Dr. Budi Santoso",

  // Trap Configuration — the focus of this mockup
  trapType: { id: "BG_SENTINEL", label: "BG-Sentinel" }, // EXISTING, required
  lure: "BG-Lure",                                        // NEW, optional, FREE TEXT
  deploymentStartDate: "2026-01-13",                     // NEW, optional
  deploymentStartTime: "06:00",                           // NEW, optional
  deploymentStartPeriod: "AM",
  deploymentEndDate: "2026-01-15",                       // NEW, optional
  deploymentEndTime: "06:00",                             // NEW, optional
  deploymentEndPeriod: "AM",
  storageTemperatureC: -20.0,                             // NEW, optional

  // Existing fields below the section (Specimens table, Notes) — not shown in mockup
  notes: "",
};

// ============================================================================
// Helpers
// ============================================================================

function combineDateTime(date, time, period) {
  if (!date || !time) return null;
  // Treat as a display-only string in this mockup; the real form persists ISO 8601
  return `${date} ${time} ${period}`;
}

function isDeploymentWindowInverted(lot) {
  const start = combineDateTime(lot.deploymentStartDate, lot.deploymentStartTime, lot.deploymentStartPeriod);
  const end = combineDateTime(lot.deploymentEndDate, lot.deploymentEndTime, lot.deploymentEndPeriod);
  if (!start || !end) return false;
  // Naive string compare works for the mockup's ISO-like format; real impl uses Date
  return end < start;
}

// ============================================================================
// Main mockup component
// ============================================================================

export default function CollectionLotTrapDetailsMockup() {
  const [lot, setLot] = useState(INITIAL_LOT);
  const windowInverted = isDeploymentWindowInverted(lot);

  function update(field, value) {
    setLot((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Layer style={{ padding: "1.5rem 2rem", background: "#f4f4f4", minHeight: "100vh" }}>
      <Stack gap={5}>
        {/* Breadcrumb */}
        <Breadcrumb noTrailingSlash aria-label="page navigation">
          <BreadcrumbItem href="#">Home</BreadcrumbItem>
          <BreadcrumbItem href="#">Vector</BreadcrumbItem>
          <BreadcrumbItem href="#">Collection</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{lot.collectionLotNumber}</BreadcrumbItem>
        </Breadcrumb>

        {/* Header card — minimal context */}
        <Layer level={1} style={{ background: "white", padding: "1.25rem 1.5rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 400, color: "var(--cds-text-primary, #161616)", margin: 0 }}>
                Edit Collection Lot &mdash; {lot.collectionLotNumber}
              </h1>
              <p style={{ marginTop: "0.5rem", color: "var(--cds-text-secondary, #525252)", fontSize: "0.875rem" }}>
                {lot.site}
              </p>
            </div>
            <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--cds-text-helper, #6f6f6f)" }}>
              <div>Collector: {lot.collector}</div>
              <div>Created: 2026-01-13</div>
            </div>
          </div>
        </Layer>

        {/* What's new banner (mockup-only annotation) */}
        <Layer level={1} style={{ background: "#edf5ff", borderLeft: "4px solid var(--cds-link-primary, #0f62fe)", padding: "0.875rem 1.25rem" }}>
          <div style={{ fontSize: "0.875rem", color: "var(--cds-text-primary, #161616)" }}>
            <strong>OGC-777 mockup callout (not in production UI):</strong> the change to this screen is the new <strong>Trap Configuration</strong> section grouping the existing <em>Trap Type</em> field with four new optional fields &mdash; <strong>Lure</strong>, <strong>Deployment Start</strong>, <strong>Deployment End</strong>, and <strong>Storage Temperature</strong>. Other sections of the CollectionLot form (Sample Info, Site, Specimens, Notes) are unchanged. All four new fields are optional &mdash; backward-compatible default is blank.
          </div>
        </Layer>

        {/* Existing sections collapsed to a placeholder bar in the mockup */}
        <Layer level={1} style={{ background: "white", padding: "0.875rem 1.25rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)", color: "var(--cds-text-helper, #6f6f6f)", fontSize: "0.8125rem", fontStyle: "italic" }}>
          &uarr; Sample Info &middot; Site &middot; Collector sections (existing &mdash; not shown in this mockup) &uarr;
        </Layer>

        {/* THE NEW SECTION — Trap Configuration */}
        <Layer level={1} style={{ background: "white", padding: "1.5rem 1.75rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--cds-text-primary, #161616)", margin: "0 0 1.25rem", borderBottom: "2px solid var(--cds-border-subtle, #e0e0e0)", paddingBottom: "0.625rem" }}>
            Trap Configuration
          </h2>

          <Form>
            <Stack gap={6}>
              {/* Row 1: Trap Type (existing) + Lure (NEW) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <Dropdown
                  id="trap-type"
                  titleText={
                    <span>
                      Trap Type <span style={{ color: "var(--cds-support-error, #da1e28)" }}>*</span>
                    </span>
                  }
                  label="Select a trap type"
                  items={TRAP_TYPE_OPTIONS}
                  itemToString={(item) => (item ? item.label : "")}
                  selectedItem={lot.trapType}
                  onChange={({ selectedItem }) => update("trapType", selectedItem)}
                />

                <TextInput
                  id="lure"
                  labelText={
                    <span>
                      Lure
                      <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", color: "var(--cds-link-primary, #0f62fe)", fontWeight: 600 }}>
                        NEW
                      </span>
                    </span>
                  }
                  placeholder="e.g., BG-Lure, CO₂, octenol"
                  helperText="Free text — whatever the lab used."
                  value={lot.lure ?? ""}
                  onChange={(e) => update("lure", e.target.value)}
                />
              </div>

              {/* Row 2: Deployment Start (NEW) + Deployment End (NEW) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <FormGroup
                  legendText={
                    <span>
                      Deployment Start
                      <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", color: "var(--cds-link-primary, #0f62fe)", fontWeight: 600 }}>
                        NEW
                      </span>
                    </span>
                  }
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 6rem", gap: "0.75rem", alignItems: "end" }}>
                    <DatePicker
                      datePickerType="single"
                      value={lot.deploymentStartDate}
                      onChange={(dates) =>
                        update("deploymentStartDate", dates[0] ? dates[0].toISOString().slice(0, 10) : "")
                      }
                    >
                      <DatePickerInput
                        id="deployment-start-date"
                        labelText=""
                        placeholder="yyyy-mm-dd"
                        size="md"
                      />
                    </DatePicker>
                    <TimePicker
                      id="deployment-start-time"
                      labelText=""
                      value={lot.deploymentStartTime}
                      onChange={(e) => update("deploymentStartTime", e.target.value)}
                      size="md"
                    >
                      <TimePickerSelect
                        id="deployment-start-period"
                        labelText=""
                        value={lot.deploymentStartPeriod}
                        onChange={(e) => update("deploymentStartPeriod", e.target.value)}
                      >
                        <SelectItem value="AM" text="AM" />
                        <SelectItem value="PM" text="PM" />
                      </TimePickerSelect>
                    </TimePicker>
                  </div>
                </FormGroup>

                <FormGroup
                  legendText={
                    <span>
                      Deployment End
                      <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", color: "var(--cds-link-primary, #0f62fe)", fontWeight: 600 }}>
                        NEW
                      </span>
                    </span>
                  }
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 6rem", gap: "0.75rem", alignItems: "end" }}>
                    <DatePicker
                      datePickerType="single"
                      value={lot.deploymentEndDate}
                      onChange={(dates) =>
                        update("deploymentEndDate", dates[0] ? dates[0].toISOString().slice(0, 10) : "")
                      }
                    >
                      <DatePickerInput
                        id="deployment-end-date"
                        labelText=""
                        placeholder="yyyy-mm-dd"
                        size="md"
                      />
                    </DatePicker>
                    <TimePicker
                      id="deployment-end-time"
                      labelText=""
                      value={lot.deploymentEndTime}
                      onChange={(e) => update("deploymentEndTime", e.target.value)}
                      size="md"
                    >
                      <TimePickerSelect
                        id="deployment-end-period"
                        labelText=""
                        value={lot.deploymentEndPeriod}
                        onChange={(e) => update("deploymentEndPeriod", e.target.value)}
                      >
                        <SelectItem value="AM" text="AM" />
                        <SelectItem value="PM" text="PM" />
                      </TimePickerSelect>
                    </TimePicker>
                  </div>
                </FormGroup>
              </div>

              {/* Row 3: Storage Temperature (NEW) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <NumberInput
                  id="storage-temperature"
                  label={
                    <span>
                      Storage Temperature
                      <span style={{ marginLeft: "0.375rem", fontSize: "0.6875rem", color: "var(--cds-link-primary, #0f62fe)", fontWeight: 600 }}>
                        NEW
                      </span>
                    </span>
                  }
                  helperText="°C (negative values allowed for frozen storage)"
                  step={0.1}
                  value={lot.storageTemperatureC ?? ""}
                  onChange={(_, { value }) => update("storageTemperatureC", value === "" ? null : Number(value))}
                />
                {/* Empty column for layout symmetry */}
                <div />
              </div>

              {/* Soft warning if deployment window inverted */}
              {windowInverted && (
                <InlineNotification
                  kind="warning"
                  title="Deployment window check"
                  subtitle="Deployment end is before deployment start. Confirm before saving."
                  hideCloseButton
                  lowContrast
                />
              )}

              {/* Section-level helper */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: "0.8125rem", color: "var(--cds-text-helper, #6f6f6f)", paddingTop: "0.5rem", borderTop: "1px dashed var(--cds-border-subtle, #e0e0e0)" }}>
                <Information size={16} style={{ flexShrink: 0, marginTop: "0.125rem" }} />
                <span>
                  All trap-configuration fields except <strong>Trap Type</strong> are optional. The LHU Mode A footnote renders these when populated; absent fields are silently omitted.
                </span>
              </div>
            </Stack>
          </Form>
        </Layer>

        {/* Existing sections below collapsed */}
        <Layer level={1} style={{ background: "white", padding: "0.875rem 1.25rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)", color: "var(--cds-text-helper, #6f6f6f)", fontSize: "0.8125rem", fontStyle: "italic" }}>
          &darr; Specimens table &middot; Notes section (existing &mdash; not shown in this mockup) &darr;
        </Layer>

        {/* Action bar */}
        <Layer level={1} style={{ background: "white", padding: "1rem 1.25rem", border: "1px solid var(--cds-border-subtle, #e0e0e0)", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <Button kind="ghost">Cancel</Button>
          <Button kind="secondary">Save Draft</Button>
          <Button kind="primary">Save</Button>
        </Layer>
      </Stack>
    </Layer>
  );
}
