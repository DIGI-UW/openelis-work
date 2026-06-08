# Jira — Test Catalog Management v2.5 v2 — Epic + Stories (DRAFT, not yet filed)

**Date:** 2026-05-14
**FRS:** `test-catalog-requirements-v2.5.md` §3 (v2 scope)
**Status:** Draft for Casey's review. Once approved, will be filed to OGC project following the same pattern as v1 (OGC-746 + OGC-747 through OGC-756).
**Companion artifacts already filed (v1):** OGC-746 (epic), OGC-747–OGC-756 (10 child stories), OGC-757 (Sample Storage display propagation — sibling of OGC-746, not under v1 epic, touches Order Entry / Results / Validation screens).

## Suggested epic labels and parent

- **Parent / project:** OpenELIS Global (OGC)
- **Common labels** (apply to epic + every child story): `test-catalog`, `admin`, `v2`, `carbon`, `openelis-global`, `Madagascar`, `Indonesia`
- **Story-specific extras suggested:**
  - Story 6 (Compliance) — add `silnas`, `environmental`, `vector`
  - Story 9 (Localization Hardening) — add `i18n`, `localization`
- **Assignees:** all unassigned (let triage route) — matches v1 pattern

---

## EPIC — Test Catalog Management v2.5 v2 (Labels / Reagents / Alerts / Reflex & Calc / Compliance + v1 polish + Localization Hardening)

**Summary:** Second-stage release of the unified Test Catalog Management editor. Builds entirely on the v1 foundation (OGC-746). Adds the remaining 5 SideNav sections — **Labels** (constrained to the 4 existing fixed presets), **Reagents** (consuming a test-reagent linkage that's built as part of this epic's scope), **Alerts** (per-test rule authoring with per-rule acknowledgment toggle; delivery via the shipped Test Notification system), **Reflex & Calc** (read-only cross-links to Master Lists), **Compliance** (per S-01 FRS — primary evaluation surface for Environmental and Vector tests). Plus polish on v1 sections (Range Editor Table + Visual views, Sample Storage audit-write triggers) and full Localization Hardening behavior (the table was created in v1; v2 lights up the fallback function + API contract + UI indicators).

**Builds on:** OGC-746 (v1 — Unified Editor + Foundation). Every v2 section is additive on top of v1; no schema rework required.

**SideNav grows from 9 entries to 14:** when v2 ships, the 5 new SideNav entries appear in their pre-positioned slots (Labels, Reagents, Alerts, Reflex & Calc, Compliance per the workflow ordering in v2.4 §Internal IA).

## Design artifacts

- **FRS:** `test-catalog-requirements-v2.5.md` §3 (v2 section detail), §3.7 (polish on v1 sections), §3.8 (Localization Hardening)
- **Source-of-truth content:** `test-catalog-requirements-v2.4.md` (full original text for each v2 section)
- **v1 preview (for reference; v2 preview to be added):** `test-catalog-preview-v2.5-v1.html`

## Why v2 sequences after v1

- **Lower-risk MVP path.** v1 ships the foundation + most-used sections without the dependencies in this epic. Partners can use the new editor day-1 for everything that doesn't need Compliance / Labels / Reagents / Alerts / Reflex.
- **Test-reagent linkage builds in v2.** The Reagents tab depends on a linkage feature that doesn't exist yet. Building it in v2 keeps the v1 scope clean.
- **Compliance aligned to S-01 + Sprint 7 SILNAS.** The Compliance tab depends on `S01-compliance-standards-admin-frs-v1.0.md` and partner-specific work happening in parallel. v2 timing matches that wave.
- **Notification system is shipped** (per Casey 2026-05-14), so Alerts can ship cheaply once we wire up the v2 epic — no infrastructure work, just per-test rule authoring + acknowledgment-required toggle.

## v2 scope (this epic)

5 new SideNav sections (Labels, Reagents, Alerts, Reflex & Calc, Compliance) + 3 polish improvements on v1 sections (Range Editor Table + Visual views, Sample Storage audit, Panel preview drag-drop is **already in v1**) + Localization Hardening behavior.

## Hard dependencies

| Dependency | Status (per Casey 2026-05-14) | Mitigation |
|---|---|---|
| Test Notification system shipped and live | Confirmed shipped | If misremembered, Alerts story moves out of v2 |
| S-01 Compliance Standards FRS written + built | Specced (companion FRS exists) | If S-01 build slips, Compliance moves to a follow-on release |
| OGC-746 (v1) shipped | Will be in flight when v2 starts | None — v2 is sequenced after v1 |

## Acceptance (epic-level demo criteria)

- [ ] After v1 ships and v2 ships, opening Admin → Test Catalog Management → any test reveals **14 SideNav entries** instead of 9
- [ ] Labels section: pick from the 4 fixed system presets per test, set default qty / max qty / Allow Override toggle; Order Entry pre-populates labels from this config
- [ ] Reagents section: link reagents from inventory with usage type (PRIMARY/SECONDARY) and quantity per test; current stock from inventory shown alongside
- [ ] Alerts section: per-test rules with 5 triggers (All / Abnormal / Critical / Specific Value / Compliance Breach for ENV/VECTOR); per-rule channel selection from Notification system; per-rule `acknowledgment_required` toggle; rule list with enable/disable
- [ ] Reflex & Calc section: read-only display of reflex rules + calculated results that touch this test; "Edit in Master Lists" links navigate correctly
- [ ] Compliance section: visible for ENV/VECTOR tests only; threshold authoring per S-01 FRS; grouping by Standard or Parameter Group; type-coded badges (MAX / MIN / RANGE / DESCRIPTIVE)
- [ ] Range Editor exposes view selector with **Structured / Table / Visual** — selector persists view choice in URL state
- [ ] Range Editor Visual view: demographic selector + stacked horizontal bars for the 4 range types
- [ ] Sample Storage history audit: every change to `test_sample_handling` writes a row to `test_sample_handling_history`; admin can view change log per test
- [ ] Localization Hardening: missing translations fall back gracefully (selected language → primary language → first available → internal code); fallback values render in italic with language indicator; bulk export of untranslated strings available

## Schema migrations that land in v2

1. `test_alert_rule` (per FRS D-03: trigger + recipients + acknowledgment_required, NO templates — templates live in Notification system)
2. `test_reagent_link` (the prerequisite linkage — Story 1 of this epic owns building it)
3. `test_label_preset_link`
4. `result_reading` (multi-reading capture; result-entry side, formal spec in the result-entry FRS)
5. Light up audit-write triggers on `test_sample_handling_history` (table already exists from v1 schema)
6. Activate `get_localized_test_field()` PL/pgSQL function + API + UI fallback path on `test_localization` (table already exists from v1 schema)

## Out of scope for this epic

- Standalone Master Lists admin for **configurable Label Preset Management** (custom dimensions, content fields, drag-drop, barcode position) — separate FRS, not yet written
- **Critical Result Acknowledgment workflow** — the per-rule `acknowledgment_required` toggle exists in v2 but no-ops until the global workflow is built; placeholder link in helper text
- Sample Storage info display propagation to Order Entry / Results / Validation screens — tracked as **OGC-757** (separate sibling story)
- Cross-test analytics, recall workflows, batch reagent-QC integration — separate future epics

## Story breakdown

9 child stories. Suggested sequencing:

- **Story 1** lands first (test-reagent linkage) — unblocks Story 3 (Reagents).
- **Stories 2 / 4 / 5 / 7 / 8 / 9** can all run in parallel after Story 1.
- **Story 6** (Compliance) is gated on S-01 FRS being ready — pull in last if S-01 slips; can be filed but not started until then.

---

## Child stories

### Story 1 — Test-Reagent linkage (prerequisite for Reagents tab)

**Summary:** Build the `test_reagent_link` table + API endpoints that map reagent inventory records to tests in the catalog, with usage-type and quantity-per-test metadata. This is the prerequisite for Story 3 (Reagents tab). Reagents-as-inventory already exist in OpenELIS; this story adds the linkage that doesn't currently exist.

**Acceptance criteria:**

- [ ] New schema: `test_reagent_link (id, test_id FK, reagent_id FK, usage_type CHECK IN ('PRIMARY','SECONDARY'), quantity_per_test DECIMAL, quantity_unit VARCHAR, created_at, UNIQUE(test_id, reagent_id))`
- [ ] REST endpoints:
  - `GET /api/v1/tests/{testId}/reagents` — list linked reagents with usage type, quantity, current stock
  - `POST /api/v1/tests/{testId}/reagents` — link a reagent to a test
  - `PUT /api/v1/tests/{testId}/reagents/{reagentId}` — update usage type / quantity
  - `DELETE /api/v1/tests/{testId}/reagents/{reagentId}` — unlink
- [ ] Permission: `admin.testCatalog.manage` (binary, same as the editor)
- [ ] All endpoints return HTTP 403 when permission missing
- [ ] Schema migration runs cleanly with no data backfill required (table starts empty)
- [ ] Reagent inventory module unaffected (read-only consumer of `reagent.id`)

**FRS trace:** §0.7 (v2 schema migrations), §3.3, D-07
**Dependencies:** None within v2 epic. OGC-746 (v1) must be shipped.
**Estimated size:** M

---

### Story 2 — Labels (constrained to 4 fixed presets)

**Summary:** Labels section — pick from the 4 existing fixed label presets (Order Label / Specimen Label / Block Label / Slide Label) per test; set default quantity, max quantity, and Allow Override toggle per linked preset. Full configurable Label Preset Management is out of scope (separate FRS, not yet written).

**Acceptance criteria:**

- [ ] Labels section is the 8th SideNav entry per workflow order
- [ ] Per-test linked presets table: Preset (from the 4 fixed) / Default Qty / Max Qty / Allow Override / Actions
- [ ] "+ Add Label Type" opens a picker with the 4 fixed presets minus any already linked
- [ ] Per-preset config: Default Qty (integer), Max Qty (integer ≥ Default), Allow Override (checkbox)
- [ ] Global "Allow label count override at order entry" toggle on the section
- [ ] Order Entry preview shows the configuration as it will appear when this test is ordered
- [ ] Aggregation rules with other tests in the same order: same preset → highest default qty wins; different presets → all included; no-config tests → system defaults from Barcode Configuration
- [ ] Persists to new `test_label_preset_link (id, test_id, preset_id, default_qty, max_qty, allow_override)` junction
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.labels.*`

**FRS trace:** §3.2, v2.4 §Labels Tab (excluding the §Label Preset Management content moved to a separate FRS), D-08
**Dependencies:** OGC-746 (v1)
**Estimated size:** M

---

### Story 3 — Reagents (consumes test-reagent linkage from Story 1)

**Summary:** Reagents section — link reagents from inventory to a test with usage type (PRIMARY/SECONDARY) and quantity per test; display current stock level from inventory; unlink with confirmation.

**Acceptance criteria:**

- [ ] Reagents section is the 10th SideNav entry per workflow order
- [ ] Linked reagents table: Reagent Name / Usage Type (Tag: PRIMARY=blue, SECONDARY=warm-gray) / Quantity per Test / Stock Level (from inventory) / Actions
- [ ] "+ Link Reagent" opens multi-select modal scoped to reagent inventory; selected reagents linked with default usage type = PRIMARY
- [ ] Per-link inline edit: usage type, quantity per test, quantity unit
- [ ] Unlink action triggers confirmation modal
- [ ] Stock level pulled from reagent inventory (read-only consumer)
- [ ] Empty state: "No reagents linked. Link reagents from inventory to track consumption per test."
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.reagents.*`

**FRS trace:** §3.3, v2.4 §Reagents Tab, D-07
**Dependencies:** Story 1 (test-reagent linkage table + API)
**Estimated size:** M

---

### Story 4 — Alerts (per-test rule authoring + per-rule acknowledgment toggle)

**Summary:** Alerts section — per-test alert rules with trigger condition (All / Abnormal / Critical / Specific Value / Compliance Breach for ENV/VECTOR), channel selection from the shipped Test Notification system (4 channels: Patient Email/SMS, Provider Email/SMS), recipient selection, enable/disable, per-rule `acknowledgment_required` toggle. **No template authoring here** — templates live in the Notification system per its 3-tier fallback (channel → test → system).

**Acceptance criteria:**

- [ ] Alerts section is the 12th SideNav entry per workflow order
- [ ] Rules list shown as a Carbon `<DataTable>`: Rule Name / Trigger / Channels / Recipients / Ack Required / Status (enable/disable toggle) / Actions
- [ ] "+ Add Rule" opens inline row expansion form (not modal — per Constitution Principle 3)
- [ ] Trigger condition radio: All Results / Abnormal / Critical / Specific Value / Compliance Breach (the latter only for ENV/VECTOR tests; CLINICAL tests see only the first 4)
- [ ] If Specific Value: text/select input scoped to the test's result type (numeric for NUMERIC, dropdown for SELECT_LIST)
- [ ] Channels: multi-select from the 4 Notification system channels — Patient Email, Patient SMS, Provider Email, Provider SMS; BCC behavior on Provider Email per Notification system rules
- [ ] Recipients: checkbox set — Ordering Physician / Patient / Referring Facility / Custom (phone + email inputs) / Role-based (role select)
- [ ] **`Acknowledgment Required` toggle:** when enabled, results from this rule land on the global Critical Result Acknowledgment queue; helper text: "When enabled, this result lands on the Acknowledgment queue and remains there until the recipient acknowledges. See [Acknowledgment Settings →]." The link is a placeholder until the global Critical Acknowledgment workflow ships.
- [ ] **Templates are NOT authored on the rule** — the Notification system resolves templates per channel → test → system fallback
- [ ] Rule schema (per D-03 + D-04 + D-05): `test_alert_rule (id, test_id FK, name, is_enabled, trigger_type, trigger_value, channels CSV, notify_ordering_physician, notify_patient, notify_referring_facility, notify_custom_phone, notify_custom_email, notify_role_id, acknowledgment_required BOOLEAN DEFAULT FALSE)` — **no template columns**
- [ ] Delivery log link in the Alerts section navigates to the Notification system's delivery log filtered by `test_id`
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.alerts.*`

**FRS trace:** §3.4, D-03, D-04, D-05, D-06
**Dependencies:** OGC-746 (v1); shipped Test Notification system
**Estimated size:** M-L

---

### Story 5 — Reflex & Calc (read-only cross-links)

**Summary:** Reflex & Calc section — read-only display of reflex rules that touch this test (triggered BY this test, or ORDER this test) and calculated results that use this test as input (or are calculated FROM other tests). No editor here — every "Edit" / "Add" link navigates to `/MasterListsPage#reflex` or `/MasterListsPage#calculatedValue` with appropriate pre-filled context.

**Acceptance criteria:**

- [ ] Reflex & Calc section is the 13th SideNav entry per workflow order
- [ ] **Reflex Tests** sub-section:
  - "Rules triggered BY this test" — list of reflex rules where this test's result triggers another test; each row links to Master Lists for editing
  - "Rules that ORDER this test" — list of reflex rules where another test's result orders this test; each row links to Master Lists for editing
  - "+ Add New Reflex Rule in Master Lists" link pre-fills trigger test = this test
  - Empty states for both sub-lists
- [ ] **Calculated Results** sub-section:
  - "Calculations that USE this test as input" — list of calculations; each row links to Master Lists for editing
  - "This test IS a calculated result" — either the formula configuration (read-only) with edit link, or empty state + "Configure in Master Lists" link
- [ ] Order mode badges: Auto-order (warning) / Suggest (info)
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.reflexCalc.*`

**FRS trace:** §3.5, v2.4 §NEW: Reflex Tests & Calculated Results
**Dependencies:** OGC-746 (v1)
**Estimated size:** S-M

---

### Story 6 — Compliance (per S-01 FRS)

**Summary:** Compliance section — per-test regulatory threshold management (Baku Mutu, WHO, EPA). Visible for ENVIRONMENTAL and VECTOR domain tests; hidden for CLINICAL. Gated by `compliance.threshold.view` permission. Implementation follows the companion S-01 FRS.

**Acceptance criteria:**

- [ ] Compliance section is the 14th SideNav entry per workflow order
- [ ] Visibility: ENV/VECTOR tests show the section; CLINICAL tests hide it from the SideNav and return 403 from the API
- [ ] `compliance.threshold.view` gates UI visibility; `compliance.threshold.manage` (per S-01 FRS) gates writes
- [ ] DataTable of compliance thresholds: Standard / Parameter Group / Type (Tag: MAX=red, MIN=blue, RANGE=teal, DESCRIPTIVE=purple) / Value / Unit / Effective Date / Status
- [ ] Group By toggle: Standard / Parameter Group
- [ ] Inline row expansion for add/edit (no modal per Constitution Principle 3)
- [ ] Conditional form fields based on threshold type: MAX → upper value; MIN → lower value; RANGE → both; DESCRIPTIVE → text
- [ ] Standard selection: Carbon ComboBox with type-ahead, scoped to ACTIVE ComplianceStandard entities
- [ ] Threshold count badge on the Compliance SideNav item
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.compliance.*`
- [ ] Compliance Breach trigger in Alerts (Story 4) consumes threshold breaches from this section

**FRS trace:** §3.6, v2.4 §NEW: Compliance Tab (S-01 Integration); companion FRS `S01-compliance-standards-admin-frs-v1.0.md`
**Dependencies:** OGC-746 (v1); S-01 Compliance Standards FRS implementation
**Estimated size:** L

---

### Story 7 — Range Editor — Table View + Visual View (polish on v1 Story 5)

**Summary:** Adds the remaining two view modes to the Range Editor: Table View (flat sortable Carbon DataTable for bulk review/export) and Visual View (demographic-selector + stacked horizontal bars showing the four range types for a selected demographic).

**Acceptance criteria:**

- [ ] Range Editor header gains a view-mode dropdown (Carbon `<Dropdown>`): Structured (default) / Table / Visual
- [ ] Selected view persists in URL state (`?rangeView=structured|table|visual`)
- [ ] **Table View:** Carbon `<DataTable>` with columns Type / Sex / Age From / Age To / Low / High / Actions; sortable on any column; default sort by Type → Sex → Age From (normalized to days); third click on a header returns to default
- [ ] Table View Bulk Actions toolbar (gated by `admin.testCatalog.manage`): Delete Selected, Change Sex, Change Type
- [ ] **Visual View:** demographic selector at top (sex Dropdown + age NumberInput + unit Select); four stacked horizontal bars below for Valid → Normal → Critical → Reporting; each bar shows applicable range for the selected demographic; "Not defined for this demographic" italic placeholder if no range applies; legend below
- [ ] Visual View live-updates when demographic selector changes; no Save action (read-only view)
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.ranges.visualView.*` and `admin.testCatalog.ranges.table.*`

**FRS trace:** §3.7, v2.4 §"Detailed Range Requirements" → Table View, Visual View
**Dependencies:** OGC-746 (v1) — specifically the Ranges story (OGC-751)
**Estimated size:** M

---

### Story 8 — Sample Storage audit history (polish on v1 Story 6)

**Summary:** Light up audit-write triggers on `test_sample_handling_history` (the table created in v1 schema). Every change to `test_sample_handling` writes a row. Admin can view a per-test change log.

**Acceptance criteria:**

- [ ] On any UPDATE to `test_sample_handling`, a row is written to `test_sample_handling_history` with `changed_by` (FK to system_user), `changed_at`, `change_type` ('UPDATE'), `previous_values` (JSONB), `new_values` (JSONB)
- [ ] On INSERT, a corresponding row is written with `change_type` ('CREATE')
- [ ] Sample Storage section in the Test Editor gains a "View change history" link/button that opens a modal showing the change log for this test
- [ ] Change log displays: changed_by (user name), changed_at (formatted), change_type Tag, side-by-side diff of changed fields only
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.sampleStorage.history.*`

**FRS trace:** §3.7, v2.5 D-09
**Dependencies:** OGC-746 (v1) — specifically Sample Storage story (OGC-752)
**Estimated size:** S-M

---

### Story 9 — Localization Hardening (polish on v1 `test_localization` schema)

**Summary:** Activate the localization fallback function + API response shape + UI fallback indicators + bulk untranslated export. The `test_localization` table was created in v1 schema; v2 lights up the behavior on top.

**Acceptance criteria:**

- [ ] `get_localized_test_field(test_id, field_name, language_code)` PL/pgSQL function deployed; implements the fallback chain: selected language → primary language (`is_primary = TRUE`) → first available → internal code wrapped in brackets
- [ ] API response shape for test fields: `{ value, language, isFallback }` — frontend can distinguish native vs. fallback values
- [ ] Test editor shows translation status per supported language (Carbon Tag set: ✓ translated / ⚠ missing / language code badges)
- [ ] Fallback values in UI render in italic with a small language indicator (e.g., `[en]`) and tooltip "Showing English (translation not available in French)"
- [ ] System never throws errors for missing translations — always renders something readable
- [ ] Bulk export of untranslated strings as a CSV: columns = test_id, field_name, primary_value, primary_language, missing_languages — downloadable from a "Translation Management" Master Lists page (separate small admin surface)
- [ ] All visible strings i18n-wrapped under `admin.testCatalog.localization.*`

**FRS trace:** §3.8, v2.4 §NEW: Localization Hardening
**Dependencies:** OGC-746 (v1) — specifically the schema migration that created `test_localization`
**Estimated size:** M

---

## Summary table

| # | Story | Size | Depends on |
|---|---|---|---|
| 1 | Test-Reagent linkage (prerequisite) | M | OGC-746 (v1) |
| 2 | Labels (4 fixed presets) | M | OGC-746 (v1) |
| 3 | Reagents (consumes Story 1 linkage) | M | Story 1 |
| 4 | Alerts (authoring + ack toggle) | M-L | OGC-746 (v1); shipped Notification system |
| 5 | Reflex & Calc (read-only cross-links) | S-M | OGC-746 (v1) |
| 6 | Compliance (per S-01 FRS) | L | OGC-746 (v1); S-01 FRS implementation |
| 7 | Range Editor Table + Visual views | M | OGC-746 (v1) → Story 5 (OGC-751) |
| 8 | Sample Storage audit history | S-M | OGC-746 (v1) → Story 6 (OGC-752) |
| 9 | Localization Hardening | M | OGC-746 (v1) schema |

**Sequencing suggestion:** Story 1 first (test-reagent linkage). Then Stories 2 / 4 / 5 / 7 / 8 / 9 in parallel. Story 3 (Reagents) unblocked when Story 1 lands. Story 6 (Compliance) can be filed but not started until S-01 FRS is built.

**Suggested labels per story:** `test-catalog`, `admin`, `v2`, `carbon`, `openelis-global`, `Madagascar`, `Indonesia`, plus story-specific extras: `silnas` + `environmental` + `vector` on Story 6; `i18n` + `localization` on Story 9.

---

## What's NOT in this v2 epic (out of scope reminder)

- **OGC-757** (Sample Storage display propagation to Order Entry / Results / Validation) — already filed as a sibling of OGC-746, touches three non-catalog screens.
- **Configurable Label Preset Management** — separate FRS, not yet written. Future epic.
- **Critical Result Acknowledgment workflow** — separate global feature; per-rule toggle here is a no-op until that workflow ships.
- **Cross-test favorites for select lists** — was in OGC-206 scope, deferred to future Master Lists FRS.
- **Reagent batch QC / cost-per-test analytics / recall workflows** — future epics that consume the new linkage table from Story 1.

---

## Ready to file?

If approved as-is, file in this order:
1. Create epic in OGC (single `createJiraIssue` with Epic issuetype)
2. Create 9 child stories with `parent` = new epic key (parallel)
3. Add "Relates" link between v2 epic and OGC-746 (v1)
4. Optionally: add "is blocked by" link from Story 3 (Reagents) to Story 1 (linkage)
5. Optionally: add "is blocked by" link from Story 6 (Compliance) to whatever S-01 implementation story exists
