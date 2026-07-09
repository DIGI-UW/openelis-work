# FRS — Analyzer Ingestion of Multi-Component Results

**Status:** Draft for review
**Technology:** Java / Spring backend (analyzer import), analyzer profiles + connection specs (JSON / docs)
**Jira:** OGC-1129 (this FRS) · epic **OGC-1131** (Multi-Component Results) · program OGC-949
**Depends on:** OGC-1124 (runtime `RESULT.component_id`), OGC-1128 (component `code` + component terminology), OGC-1125 (seeded components to map to).
**Related:** OGC-811 (Results Entry v4 — import prefill), the analyzer connection specs (`designs/analyzer-integration/*`) and profiles (`projects/analyzer-profiles/*`).

---

## Lab Context

### Current State
Analyzers send results to OpenELIS; the importer maps each incoming result identifier to an OpenELIS
**test** and stores the value. For **multiplex molecular** assays this is a poor fit. A Cepheid GeneXpert
cartridge reports an overall call plus several target-gene / probe values; a BioRad CFX Opus qPCR run
emits **one row per fluorophore channel per well** (Cy5 / FAM / Texas Red / VIC), each with its own **Cq**
(quantification cycle). The instruments already produce per-target values — the CFX parser even groups
rows by well to reconstruct a multiplex result.

### Pain
The mapping layer resolves an incoming target/channel only to a **test**, never to a **component within a
test**. So today a multiplex run either (a) fragments into several separate OpenELIS tests (one per
channel — the current BioRad CFX connection spec maps `Fluor`/`Target` → an OpenELIS *test name*), or
(b) captures only the overall call and drops the per-target Cq values. There is no way for a multiplex
run to populate the several components of **one** multi-component test.

### What Changes
The analyzer mapping can resolve an incoming target/channel to a specific **result component** of a test.
A multiplex run then populates that test's components automatically — each Cq into its target's numeric
component, the call into the primary component — matched on a stable code, in one analysis. Unmapped
targets are surfaced for follow-up rather than dropped. Deployments that already map channels to separate
tests keep working unchanged.

---

## Overview

This extends the existing analyzer import + mapping (`analyzer_test_map`, the analyzer profiles'
`default_test_mappings`, and the per-analyzer connection specs) so a reported result identifier can map to
a **(test, component)** pair, not only a test. It reuses the existing multi-result import path (the
`RESULT` table is already one-to-many off `Analysis`) and the OGC-1124 `RESULT.component_id` storage. It is
grounded in real exports: GeneXpert per-probe values and the BioRad CFX Opus per-fluor multiplex rows.

The **mechanism** (exact profile-schema field names, resolution-code changes) is engineering's to finalize;
this FRS fixes the **functional model and the mapping granularity**, which is the crux.

---

## User Stories

- **As a lab technician,** I want a multiplex analyzer run to land each target's value in the right
  component of the right test automatically, so I don't re-key probe Cqs from a printout or juggle one
  test per channel.
- **As a Test Catalog Manager,** I want to map an analyzer's targets/channels to a test's components (or
  keep them as separate tests) per assay, so the analyzer feed matches how the lab models the assay.
- **As a lab technician,** I want a reported target that isn't mapped to surface as a visible exception,
  so nothing is silently lost.

---

## Functional Requirements

### A. Mapping granularity (the core change)
- **FR-A1.** The analyzer mapping can associate an incoming result identifier (analyzer result code /
  HL7 OBX-3 / ASTM result id / CFX `Fluor`(+`Target`)) with a **result component of a test**, in addition
  to today's target→test mapping.
- **FR-A2.** When a mapping specifies no component, the value resolves to the test's **PRIMARY** component
  — i.e. **today's behavior**, unchanged.
- **FR-A3.** Resolution order: resolve the **test first** (existing LOINC-interlingua / `analyzer_test_map`
  path), then the **component within that test** by a **stable code** — the component `code`, or its
  optional terminology code (OGC-1128) where set. **Never** match on a translated / display string.
- **FR-A4.** The mapping is **deployment-configurable per assay** (connection specs already note channel↔
  target mappings are deployment-specific).

### B. Multiplex handling
- **FR-B1.** For an instrument that emits multiple rows per sample (one per channel/target — e.g. CFX
  groups by well), each row maps to its component; the set assembles into one analysis's components.
- **FR-B2.** Value handling per component follows the assay: numeric **Cq/Ct** (rounded per plugin), a
  **blank/absent Cq = no amplification / negative** for that channel (per the CFX spec), and qualitative
  calls map to dictionary/qualitative components.

### C. Per-assay modeling choice (additive, no forced merge)
- **FR-C1.** A multiplex assay may map either to **separate tests** (today) or to **one multi-component
  test**; this is a per-assay deployment decision. The mapping supports both.
- **FR-C2.** Enabling component mapping for an assay must **not** silently merge or re-point tests that are
  currently modeled separately (consistent with OGC-1125). Moving a deployment from separate-tests to one
  multi-component test is a deliberate remodeling action, out of scope for the importer.

### D. Exceptions & backward compatibility
- **FR-D1.** A target reported by the analyzer with **no matching component** (for a test configured for
  component mapping) is surfaced as a **visible unmapped-result exception** (import error dashboard), not
  silently discarded.
- **FR-D2.** Existing **test-level** analyzer flows are unchanged for tests without components (single
  result resolves to PRIMARY exactly as today). No existing `analyzer_test_map` rows are re-pointed or
  removed by this work.

### E. Results Entry / prefill
- **FR-E1.** Imported component values arrive as **prefilled** component fields on Results Entry (the
  provenance/prefill pattern of OGC-811); a tech confirms/edits per the edit-state machine. Method and
  Analyzer prefill are inherited from OGC-811.

---

## QC / QA boundary (scope decision — on record)

- **In scope:** an assay's **instrument-reported internal controls** (e.g. GeneXpert SPC/PCC, a qPCR
  IPC / endogenous-control channel) that arrive per sample alongside the targets **may be modeled as
  components** and populated via this path (typically `show_on_report = false`).
- **Out of scope:** the **QC program** — running control materials / QC samples, Levey-Jennings, Westgard
  rules, control lots, expected value + SD/uncertainty, pass/fail. That is a distinct domain (control
  analyses + QC dashboard; Results Entry v4 §D control capture) and must **not** be modeled as
  `test_result_component`. Components are result sub-values of the *patient* test, not QC-material data.

---

## Data Model (reuse-first)

| Concept | Entity / field | Notes |
|---|---|---|
| Analyzer→test mapping | `analyzer_test_map` (analyzer_id, analyzer_test_name → test_id) | Unchanged; test-level resolution |
| **Analyzer→component mapping** | **new: an optional component reference** on the mapping (e.g. target code → component `code`), representation is engineering's choice | The net-new element (declared, not prescribed) |
| Analyzer profiles / connection specs | `projects/analyzer-profiles/*`, `designs/analyzer-integration/*` | `default_test_mappings` / field-map gains an optional component reference |
| Per-component result value | `RESULT.component_id` (OGC-1124) | Where imported values land |
| Component identity | `test_result_component.code` + optional terminology (OGC-1128) | The stable match key |
| Multi-result import | existing import path (`RESULT` one-to-many off `Analysis`) | Reused for the per-target rows |

**Declared dependency:** the analyzer→component mapping representation (profile/connection-spec field +
resolution step). Everything else is reuse.

---

## Access & Audit
- No new roles; analyzer import runs under the existing service/import identity.
- Audit: imported component values follow the existing `RESULT_SAVED`/import audit, keyed to the component;
  unmapped-target exceptions are logged to the import error surface.

## Localization
No new per-target keys — component labels come from the component's own label; unmapped-result messaging
reuses the existing import-exception strings (+ one "unmapped analyzer target" key if not present).

## Out of Scope
- The analyzer connection/transport itself (bridge, file watch, ASTM/HL7 parsing) — unchanged.
- The QC program (see QC boundary above).
- Merging/repointing tests currently modeled separately (deployment remodeling decision).
- The exact profile-schema field for component mapping (engineering finalizes; FRS requires the capability).

## Open Questions
- Where the component reference lives in the profile/connection-spec format (extend `default_test_mappings`
  with a `component_code`, or a separate per-target map?) — engineering call.
- Auto-suggest a component mapping when both the test and the component carry LOINC and the analyzer sends
  a LOINC-coded target? (Nice-to-have.)
- For CFX-style channel-only exports (blank `Target`), confirm the channel→component mapping is as
  reliable as channel→test is today.
