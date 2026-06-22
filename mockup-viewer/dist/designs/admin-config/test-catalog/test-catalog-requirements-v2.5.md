# Test Catalog Management — FRS v2.5 (Staging Companion to v2.4)

**Version:** 2.5
**Date:** 2026-05-14
**Author:** Casey Iiams-Hauser
**Relationship to v2.4:** v2.5 does not replace `test-catalog-requirements-v2.4.md`. It adds **staging** (v1 / v2 release sequencing) on top of the v2.4 scope and applies the 11 fixes from the v2.5 staging review. Read v2.4 as the source of truth for full requirement text; read v2.5 for what ships when, what's been corrected, and what the implementation order is.

## Changes from v2.4

- **v2.5** — Two-stage release sequencing (v1 / v2). The entire v2.4 vision still ships; v2.5 splits it into two code-reviewable, sprint-sized chunks so engineering can land v1 cleanly before starting v2. Applies the 11 health-check corrections (D-01 through D-11) below. Locks the Alerts authoring/delivery split (per-test rule authoring here, delivery via the shipped Test Notification system, per-rule acknowledgment toggle that couples to the Critical Result Acknowledgment workflow). Pulls Compliance to v2 (was Final-only in earlier drafts; required for Environmental tests in Sprint 7 SILNAS work). Updates dependency calls based on confirmed shipped-app state — reagents-as-inventory exist but the test-reagent **linkage** is not built; label presets are 4 fixed system presets, not user-configurable.
- **v2.5 — design-critique resolutions applied (2026-05-14):** Feature flag deleted (v1 directly replaces legacy admin pages). v2 SideNav entries are **hidden** in v1 (not shown as "Coming Soon" stubs). `Save as new test…` editor-header CTA added. Coverage Validation uses a **warn-on-save, acknowledge-on-Activate** pattern (no hard block on save; explicit acknowledgment required to Activate a test with incomplete coverage; acknowledgment is logged). AMR retention behavior defined (results frozen at result-time export status). Per-component accordion pattern for the Sample & Results section when a test has 2+ components. Keyboard reorder (Arrow Up/Down per row) added as a cross-section accessibility standard for every drag-drop surface. Small clarifications applied throughout (Domain switch modal copy for v1, Ranges view selector for v1, filter bar default state, Override Restricted behavior for in-progress orders, inline panel creation follow-up notification, "All" sex coverage clarification, Sample Storage emoji removal).

---

## §0 Staging Plan

### §0.1 Two stages, one product

The v2.4 vision is one product: a unified Test Catalog Management editor that replaces the shipped Test / Test Section / Panel / Method admin pages, adds Domain + AMR + Result Components + Compliance + Alerts, and consolidates 14 distinct admin jobs into a single SideNav-routed editor. Splitting into v1 and v2 does **not** reduce scope — everything in v2.4 still ships. The split exists to give engineering a clean checkpoint for code review, partner demos, and sprint-sized work.

### §0.2 What v1 delivers

> A working unified Test Editor that **directly replaces** the shipped Test / Section / Panel / Method admin pages, with **Basic Info (+ Domain + AMR) / Sample & Results (multi-component) / Methods / Ranges (Structured + Coverage Validation + acknowledge-to-Activate) / Sample Storage / Display Order / Panels (typeahead + expandable + drag-drop) / Terminology / Analyzers**, plus the click-to-open Test List View with the full filter bar and pagination. Heaviest schema migrations land here (Result Components, Domain, AMR, Localization, Sample Storage, junction tables). **No feature flag** — v1 ships as a direct replacement; legacy Test / Section / Panel / Method admin entries are decommissioned at v1 release. v1 has parity with shipped behavior for everything not yet in v2 (reagent admin, label presets, etc. remain accessible through their existing Master Lists surfaces until v2 brings them into the editor).

That's 9 of the 14 sections + the editor scaffold + Test List View + permissions + states. v2 SideNav entries are **hidden in v1**, not shown as "Coming Soon" stubs — the SideNav shows 9 entries in v1 and grows to 14 in v2.

### §0.3 What v2 delivers

> The remaining 6 SideNav sections — **Display Order, Labels (constrained to 4 fixed presets), Reagents (consumes the test-reagent linkage built as a v2 prerequisite), Alerts (authoring + per-rule ack toggle, delivery via shipped Notification system), Reflex & Calc (read-only cross-links), Compliance (per the S-01 FRS)** — plus polish on v1's sections (Range Editor Visual + Table views, Sample Storage audit history, Panel preview drag-drop) and Localization Hardening (multi-language metadata fallback chain).

### §0.4 Section-by-section staging table

| # | Section | v1 | v2 | Hard dependency for v2 |
|---|---|:---:|:---:|---|
| 1 | Basic Info | ✓ (full — Domain + AMR + all status flags) | — | — |
| 2 | Sample & Results | ✓ (full — multi-component + Result Interpretations + Select List Options + inline-add Unit) | — | — |
| 3 | Methods | ✓ (full — link + inline create + shortcodes + default + effective date + Copy from test) | — | — |
| 4 | Ranges | ✓ (Structured + Table + Visual views, Coverage Validation, hour granularity, Fill Gap, Copy-to-other-sex, Add/Edit modal, Activation Acknowledgment modal) | — | — |
| 5 | Sample Storage | ✓ (full — without audit history) | + version-history audit | — |
| 6 | Display Order | ✓ (full — drag-drop UI, drag infrastructure already exists) | — | — |
| 7 | Panels | ✓ (filterable typeahead picker + inline create + expandable rows per selected panel + position via drag-drop, numeric input, and keyboard arrows — all three paths) | — | — |
| 8 | Labels | — | ✓ (constrained to 4 fixed presets) | Full Label Preset Management is a separate FRS (not v2) |
| 9 | Terminology | ✓ (display + add LOINC/SNOMED/CIEL/OCL mappings + relationship type) | + bulk import, conflict detection | — |
| 10 | Reagents | — | ✓ | **Test-reagent linkage must be built as part of v2 scope** |
| 11 | Analyzers | ✓ (**read-only** display derived from analyzer test-code mappings; edits happen at the analyzer end) | — | — |
| 12 | Alerts | — | ✓ (authoring + per-rule ack toggle) | Shipped Test Notification system (confirmed live) |
| 13 | Reflex & Calc | — | ✓ (read-only cross-links to Master Lists) | — |
| 14 | Compliance | — | ✓ (per S-01 FRS) | Companion FRS `S01-compliance-standards-admin-frs-v1.0.md` |

### §0.5 Cross-cutting items

| Item | v1 | v2 | Notes |
|---|:---:|:---:|---|
| Editor scaffold (SideNav routing, breadcrumb, Test List View) | ✓ | — | Required scaffolding |
| Permissions (`admin.testCatalog.manage`, `compliance.threshold.view`) | ✓ | — | `compliance.threshold.view` enforcement lights up in v2 |
| Standard states (empty / loading / error / no-permission) | ✓ | — | Applies to v1 sections; v2 sections add their own |
| **No feature flag** — v1 replaces legacy admin pages directly | ✓ | — | Legacy Test / Section / Panel / Method admin entries decommissioned at v1 release |
| `Save as new test…` editor-header CTA (Duplicate workflow) | ✓ | — | Per-row Duplicate stays dropped; in-editor Duplicate replaces it |
| Activation Acknowledgment modal (incomplete-coverage acknowledgment with audit logging) | ✓ | — | Pragmatic patient-safety gate — see §2.4 |
| Keyboard reorder (Arrow Up/Down per row) on every drag-drop surface | ✓ | — | Cross-section accessibility standard (WCAG 2.1 AA) |
| Per-component accordion in Sample & Results when test has 2+ components | ✓ | — | Avoids scroll fatigue on multi-component tests |
| i18n keys for v1 sections (~140 of ~229) | ✓ | — | Remaining ~85 keys for v2 sections land in v2 |
| Localization Hardening (multi-language metadata + fallback chain + translation status indicators) | Schema table only (`test_localization`) | Full fallback function + API contract + UI indicators | Schema in v1, behavior in v2 |
| URL-reflected filter + pagination state in Test List View | ✓ | — | — |
| Test List View filters: Section / Sample Type / Result Type / Status | ✓ | — | — |
| Test List View filters: Domain (multi-select chip) + AMR | ✓ | — | Lights up day-1 with Domain + AMR backfill |
| Click-to-open rows, no Actions column, keyboard navigation | ✓ | — | — |

### §0.6 Schema migrations that land in v1

All v1 schema work happens up-front so v2 is purely additive:

1. `test.domain VARCHAR(20) NOT NULL CHECK (...)` — backfill CLINICAL
2. `test.is_amr_test BOOLEAN DEFAULT FALSE` + `test_amr_config` table + `whonet_antibiotic_codes` reference seed
3. `test_result_component` table + `component_id` columns on `test_range`, `test_interpretation`, `test_select_list_option` — auto-create one PRIMARY component per existing test, backfill all referencing rows
4. `unit_of_measure` master table — seeded with the §"Domain seeding" list from v2.4 §"Unit of Measure Master List + Inline Add"
5. `test_localization` table — schema only; fallback function/API contracts come in v2
6. `test_sample_handling` table + `test_sample_handling_history` audit table — table created in v1; audit-write triggers in v2 (the table sits empty for one release)
7. `panel_test (panel_id, test_id, display_order)` junction
8. `test_section_assignment (test_id, section_id, is_primary)` junction for multi-section
9. `test_sample_type.display_order` column — populated by deployment default (alphabetical or existing order); drag-drop UI is v2
10. `test_activation_acknowledgment (test_id, user_id, acknowledged_at, gaps_acknowledged JSONB)` table — logs each Coverage Validation acknowledgment when a test is set Active with incomplete coverage (per §2.4 Activation Acknowledgment pattern). Re-presented if the gap pattern changes after acknowledgment.

Legacy per-test result fields (`test.result_type`, `test.unit_of_measure`, `test.significant_digits`, `test.default_result`) become **deprecated** in v1 and remain in the schema through v2 to support callers (analyzer interfaces, FHIR sync, reports) that may still read them. A v3 release removes them. **Audit before removal:** every internal and external caller must transparently read from the PRIMARY component instead — see §5 acceptance criteria for the explicit caller-audit step.

### §0.7 Schema migrations that land in v2

1. `result_reading` table for multi-reading capture (the result-entry side of multi-reading; FRS for result entry will spec this fully)
2. `test_alert_rule` table — note: no template/channel columns on this table; templates are owned by the Test Notification system
3. `alert_delivery_log` — owned by the Test Notification system, not Test Catalog
4. `test_reagent_link` table — **prerequisite for the Reagents tab; must be built as part of v2 scope**
5. `test_label_preset_link` table — links the 4 fixed presets to tests with default qty / max qty / override flag

### §0.8 i18n key staging

The ~234 keys extracted in v2.4 §Localization split roughly:

| Bucket | Count | Stage |
|---|---:|:---:|
| `admin.testCatalog.common.*` | 24 | v1 |
| `admin.testCatalog.list.*` | 25 | v1 |
| `admin.testCatalog.editor.*` (header + footer only; SideNav group keys deleted — see D-01) | 5 | v1 |
| `admin.testCatalog.basicInfo.*` | 30 | v1 |
| `admin.testCatalog.sampleResults.*` | 50 | v1 |
| `admin.testCatalog.ranges.*` (Structured + Coverage; Visual view keys deferred) | 50 | v1 |
| `admin.testCatalog.sampleStorage.*` | 60 | v1 |
| `admin.testCatalog.panels.*` | 13 | v1 |
| `admin.testCatalog.terminology.*` | 14 | v1 |
| `admin.testCatalog.analyzers.*` | 14 | v1 |
| `admin.testCatalog.displayOrder.*` | 8 | v2 |
| `admin.testCatalog.labels.*` | 14 | v2 |
| `admin.testCatalog.reagents.*` | 4 | v2 |
| `admin.testCatalog.alerts.*` | 26 | v2 |
| `admin.testCatalog.reflexCalc.*` | 14 | v2 |
| `admin.testCatalog.compliance.*` | 12 | v2 |
| `admin.testCatalog.ranges.visualView.*` | 14 | v2 |

Drop the five `admin.testCatalog.editor.sidenav.*` group-header keys per D-01 — net total drops from 234 → 229.

---

## §1 Health-Check Fixes Applied in v2.5

All 11 drift items from `test-catalog-v2.5-staging-review.md` §1.2 are resolved here. Each fix is normative — v2.4's text is superseded for these specific items.

### D-01 — Drop stale `editor.sidenav.*` group-header keys (HIGH)

**Fix:** Remove the following five i18n keys from v2.4 §Localization → editor. They reference admin-global SideNav group labels that the editor explicitly does not use (§Internal Information Architecture states a flat list with no group headers):

- `admin.testCatalog.editor.sidenav.configuration`
- `admin.testCatalog.editor.sidenav.organization`
- `admin.testCatalog.editor.sidenav.resources`
- `admin.testCatalog.editor.sidenav.automation`
- `admin.testCatalog.editor.sidenav.compliance`

Net i18n key count drops from 234 → 229.

### D-02 — Lock FHIR mapping to "one Observation per component" (CRITICAL)

**Fix:** v2.4 line 996 (in the Result Components section) is canonical. v2.4 line 3020 (in the Updated Acceptance Criteria section) is rewritten to match. The committed mapping:

> Each result component is exposed as its own `Observation`. Multi-component tests do **not** use FHIR's `Observation.component[]` array. Components from one biological measurement share `Observation.effectiveDateTime` and may optionally link via `Observation.derivedFrom` / `hasMember`. Multi-reading components produce one Observation per reading, each with its own `effectiveDateTime`. The "(or one `Observation.component`...)" alternative in v2.4 line 3020 is removed.

### D-03 — Alerts authoring lives here, delivery via Test Notification system (HIGH)

**Fix:** The v2.4 Alert Rules section (§"NEW: Alert Rules Configuration") is rewritten for v2 to:

- **Keep:** rule authoring per-test (trigger condition, recipients), the rule list/grid, enable/disable toggle, the Add/Edit Rule modal's structure
- **Remove from the rule schema:** SMS template, Email subject template, Email body template, substitution variable handling (these live in the Test Notification system, not on each rule)
- **Add to the rule schema:** `acknowledgment_required BOOLEAN DEFAULT FALSE` (per D-05)
- **Reference:** the verified Test Notification model — 4 channels (Patient Email, Patient SMS, Provider Email, Provider SMS); 3-tier template fallback (channel → test → system); 4 substitution variables; BCC on Provider Email only
- **Channel selection** in the rule: rather than "Send via SMS/Email," the rule picks one or more of the 4 verified channels. The Notification system resolves the template and delivers.

Revised `test_alert_rule` table:

```sql
CREATE TABLE test_alert_rule (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('ALL','ABNORMAL','CRITICAL','SPECIFIC_VALUE')),
    trigger_value VARCHAR(100),                         -- For SPECIFIC_VALUE
    channels VARCHAR(100) NOT NULL,                     -- Comma-separated: 'patient_email,provider_sms'
    notify_ordering_physician BOOLEAN DEFAULT FALSE,
    notify_patient BOOLEAN DEFAULT FALSE,
    notify_referring_facility BOOLEAN DEFAULT FALSE,
    notify_custom_phone VARCHAR(20),
    notify_custom_email VARCHAR(100),
    notify_role_id INTEGER REFERENCES user_role(id),
    acknowledgment_required BOOLEAN DEFAULT FALSE,      -- See D-05
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

The `alert_delivery_log` table moves out of Test Catalog scope and into the Test Notification system's ownership. The Alerts tab links to the Notification system's delivery log for audit visibility but does not own that table.

### D-04 — Alerts trigger for Environmental/Vector tests (MEDIUM)

**Fix:** The "Critical" trigger fires on the Critical Range. For ENVIRONMENTAL and VECTOR tests where Ranges are de-emphasized in favor of Compliance, the Critical trigger has no input. v2.5 resolves this:

- The Alerts tab gains a **fifth trigger type** for ENV/VECTOR tests: `COMPLIANCE_BREACH`. Fires when a result exceeds a configured compliance threshold for the test.
- CLINICAL tests do not see the `COMPLIANCE_BREACH` trigger option (consistent with Compliance section being hidden for CLINICAL).
- ENV/VECTOR tests see `CRITICAL` (greyed with helper text "Configure clinical Critical ranges to enable this trigger; for environmental thresholds use Compliance Breach") and `COMPLIANCE_BREACH` as separate options.

```sql
-- Updated trigger_type constraint:
trigger_type VARCHAR(30) NOT NULL CHECK (trigger_type IN ('ALL','ABNORMAL','CRITICAL','SPECIFIC_VALUE','COMPLIANCE_BREACH'))
```

### D-05 — Per-rule "Acknowledgment Required" toggle (MEDIUM)

**Fix:** Each alert rule includes an explicit `acknowledgment_required BOOLEAN` (default false). When true, results triggered by the rule land on the global Critical Result Acknowledgment queue. The Alerts tab dispatches; it does **not** own the acknowledgment workflow — that's a separate cross-cutting feature.

UI: a checkbox below the Trigger Condition section: "☐ Require acknowledgment from recipient" with helper text "When enabled, this result lands on the Acknowledgment queue and remains there until the recipient acknowledges. See [Acknowledgment Settings →]."

The Acknowledgment Settings link is non-functional in v2 (placeholder); it lights up when the Critical Acknowledgment workflow is built.

### D-06 — Cross-reference to Critical Result Acknowledgment workflow (MEDIUM)

**Fix:** v2.5 Alerts section explicitly references the queued Critical Result Acknowledgment workflow (per memory: global TODO, dependency for home-page Attention feed). No new acknowledgment infrastructure invented here. When the Acknowledgment workflow is built, it consumes the `acknowledgment_required` flag from `test_alert_rule` rows and the matching result records.

### D-07 — Reagents tab depends on building test-reagent linkage (MEDIUM)

**Fix:** v2.4 assumed the test-reagent linkage existed. v2.5 corrects: reagents-as-inventory exist, but the **linkage** does not. The Reagents tab (v2) requires the linkage to be built as part of v2 scope. New schema migration added to §0.7:

```sql
CREATE TABLE test_reagent_link (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES test(id),
    reagent_id INTEGER NOT NULL REFERENCES reagent(id),
    usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('PRIMARY','SECONDARY')),
    quantity_per_test DECIMAL(15,6),
    quantity_unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(test_id, reagent_id)
);
```

A dedicated v2 Jira story owns building this linkage table + API endpoints. Reagents tab consumes it.

### D-08 — Labels tab consumes 4 fixed presets, not configurable presets (MEDIUM)

**Fix:** v2.4 embedded a full Label Preset Management UX inside this FRS. v2.5 separates:

- **In scope for this FRS (v2 Labels tab):** consume the 4 existing fixed label presets — Order Label, Specimen Label, Block Label, Slide Label — let admins pick one of those 4 per test and set default qty / max qty / override toggle.
- **Out of scope (separate not-yet-specced FRS):** user-configurable Label Preset Management with custom dimensions, content fields, drag-drop reordering, barcode position config. Reference it; don't include it.

The Label Preset Management content in v2.4 §"Label Preset Management" (lines 1349–1448) is excised from v2.5 and moved to a new placeholder FRS: `label-preset-management-frs.md` (to be authored separately).

### D-09 — Sample Storage audit table created in v1, write triggers in v2 (LOW)

**Fix:** `test_sample_handling_history` table is created in v1's schema migration but receives no writes until v2 lights up audit triggers. This avoids a separate v2 schema migration on a small lookup-style table.

### D-10 — Removed: v1 directly replaces legacy admin (no feature flag)

**Fix (revised 2026-05-14 critique resolution H-02):** The earlier `useTestCatalogV2` feature flag is **deleted**. v1 ships as a direct replacement for the legacy Test / Section / Panel / Method admin pages — those legacy entries are removed from the Admin SideNav at v1 release. Rationale: v1 has parity with shipped behavior for everything not yet in v2; there is no legacy state to roll back to. If a release goes sideways, rollback happens through normal release-versioning (revert the release), not through a runtime flag.

### D-11 — Internal QA flag scope clarification (LOW)

**Fix:** v2.4 §"Test Editor Status Flags" lists "Internal QA - No Results Release." Add a one-line scope note: "This flag suppresses results from patient reports for internal validation tests (proficiency testing imports, instrument verification runs). It is **not** the EQA participant workflow surface — see the EQA V2 FRS for participant proficiency-testing tracking."

---

## §2 v1 Section Detail

This section restates v2.4's section requirements with `[v1]`/`[v2]` scope tags applied. For full text, see v2.4. Tags here are normative for staging.

### §2.1 Basic Info — `[v1]` (full)

Everything in v2.4 §"Test Editor Status Flags" and §"Test Domain" and §"NEW: Antimicrobial Resistance (AMR) Test Flag" lands in v1.

- Test Name / Reporting Name / Test Code / Description — `[v1]`
- Active / Orderable / Internal QA flags — `[v1]`
- Active toggle gated by Activation Acknowledgment modal when Coverage Validation is incomplete (see §2.4) — `[v1]`
- Internal QA flag tooltip clarifies it is **not** the EQA participant workflow (see D-11) — `[v1]`
- Domain (CLINICAL / ENVIRONMENTAL / VECTOR), required, mandatory radio group — `[v1]`
- AMR Test flag + conditional WHONET fields (Antibiotic Code, Antibiotic Class, Test Method, Breakpoint Standard, Disk Potency) — `[v1]`
- **AMR retention behavior (NEW for v2.5):** when an admin disables AMR on a test that already has results:
  - **Historical results are frozen at result-time export status** — results already exported to WHONET remain in those batches; results created while AMR-flagged that are pending export still go out.
  - **New results respect the current flag** — results created after AMR is disabled are not eligible for WHONET export.
  - **WHONET config persists** — the WHONET Antibiotic Code, Antibiotic Class, Test Method, Breakpoint Standard, and Disk Potency are preserved on the test record so re-enabling AMR later restores the full config in one click.
- Domain switch confirmation modal — `[v1]` — v1 copy focuses on "historical results were evaluated against the prior domain's rules. New results will use the new domain's rules." The v2.4 "section visibility may change" line is removed for v1 (no section visibility changes in v1 because Compliance is hidden for everyone); the section-visibility warning re-appears in v2 when Compliance lights up.

### §2.2 Sample & Results — `[v1]` (full, multi-component, per-component accordion)

Result Components (v2.4 §"Result Components") lands in v1 in full. Per Casey's call: rip the migration off in v1 so all later features in v2 inherit the per-component model.

- **Sample Types selection — Carbon `<FilterableMultiSelect>` (typeahead)**, not a checkbox list. Some deployments configure dozens of sample types (clinical + environmental + vector); typeahead with filter scales. Selected sample types appear as removable tags below the input — `[v1]`
- **Default Sample Type — Carbon `<ComboBox>` (typeahead)** scoped to the currently selected Sample Types set. Disabled until at least one Sample Type is selected — `[v1]`
- Removing the Default Sample Type from the Sample Types set clears the Default and shows a Carbon `<InlineNotification kind="warning">` — `[v1]`
- Result Components sub-table (compact single-row when only one; full multi-column when 2+) — `[v1]`
- Per-component fields: Code / Label / Display Order / Result Type / Unit of Measure (FK) / Significant Digits / Default Result / Allow Multiple Readings / Active — `[v1]`
- **Per-component accordion (NEW for v2.5):** when a test has 2+ components, the per-component configuration (Select List Options sub-table + Result Interpretations sub-table) is wrapped in Carbon `<Accordion>` items below the Result Components table — one accordion item per component, accordion header shows the component's label + Code, badge counts for "N options" and "N interpretations". Single-component tests skip the accordion entirely — Select List Options + Interpretations render flat as before. This prevents vertical scroll fatigue on multi-component tests (BP, spirometry, etc.).
- Select List Options sub-table per component (inside the accordion when 2+ components) — `[v1]`
- Result Interpretations sub-table per component (inside the accordion when 2+ components) — `[v1]`
- Result Interpretation modal with adaptive value field (numeric vs. select list) — `[v1]`
- Color dropdown for interpretations + live preview — `[v1]`
- Copy from Test (interpretations) with replace/append modes — `[v1]`
- Inline "+ Add new unit…" affordance — `[v1]`
- FHIR mapping per D-02 (one Observation per component) — `[v1]`
- Keyboard reorder (Arrow Up/Down per row) on Result Components table, Select List Options sub-table, Result Interpretations sub-table — `[v1]`

### §2.3 Methods — `[v1]` (full)

- Link existing method — `[v1]`
- Inline method creation (Create & Link button) — `[v1]`
- Method shortcodes (Code field for macro entry) — `[v1]`
- Default method (one default per test) — `[v1]`
- Effective date — `[v1]`
- Copy methods from another test — `[v1]`

### §2.4 Ranges — `[v1]` (Structured + Coverage Validation + Activation Acknowledgment)

- Four range types (Normal / Valid / Critical / Reporting) — `[v1]`
- Age/sex-specific ranges (Male / Female / All) — `[v1]`
- Hour-level age unit for neonatal cases — `[v1]`
- `test_range.component_id` foreign key (per Result Components in v1) — `[v1]`
- **Structured View** (default; accordion per range type, grouped by sex, sorted by age) — `[v1]`
- **Table View** (flat sortable Carbon `<DataTable>` showing every range across every type; columns Type / Sex / Age From / Age To / Low / High / Actions; default sort Type → Sex → Age From normalized to days; bulk-actions toolbar gated by `admin.testCatalog.manage`) — `[v1]` (pulled into v1 since the Carbon DataTable + sort infrastructure already works in OpenELIS)
- **Visual View** (demographic-selector at top — sex Dropdown + age NumberInput + unit Select; four stacked horizontal bars for Valid → Normal → Critical → Reporting; live-updates on demographic change; legend; "Not defined for this demographic" italic placeholder where no range applies) — `[v1]` (pulled into v1)
- View-mode dropdown (Carbon `<Dropdown>`) in the section header lets admins switch between the three views; selected view persists in URL state (`?rangeView=structured|table|visual`)
- Add/Edit Range modal with source banner for Fill Gap / Copy-to-other-sex — `[v1]`
- Coverage Validation Panel (Male/Female cards, GAP / OVERLAP issue display, Fill Gap CTA) — `[v1]`
- **"All" sex ranges:** tests with only "All" ranges still display two cards (Male and Female) in the Coverage Validation panel — both cards indicate coverage via the "All" ranges. This preserves the mental model that admins can add Male-only or Female-only ranges later.
- **Save behavior:** Coverage Validation runs on save and surfaces GAPs and OVERLAPs. **Save is never blocked** by incomplete coverage — admins making multi-session edits or partial set-ups can save and return later.
- **Activation Acknowledgment modal (NEW for v2.5):** when an admin attempts to set a test to **Active** with incomplete Coverage Validation, a Carbon `<Modal>` appears:
  - **Title:** "Activate test with incomplete coverage?"
  - **Body:** lists each unresolved gap (e.g., "Female: 56 days to 1 year not covered for Normal range") and explains the consequence ("Results from patients in this demographic will not be evaluated against a normal range — no H/L flag will be applied. Critical-range gaps will not trigger critical alerts.")
  - **Primary action:** `Activate anyway` — admin must check a confirmation box ("I understand this test will not be validated against the listed demographics") before the primary becomes enabled
  - **Secondary action:** `Fill gaps now` — closes the modal and navigates to the Ranges section with the first gap pre-selected for Fill Gap
  - **Audit:** the acknowledgment is logged to a new `test_activation_acknowledgment` table with `(test_id, user_id, acknowledged_at, gaps_acknowledged JSONB)` so the acknowledgment is auditable and re-presented if the gap pattern changes
  - **Visual indicator after Activate:** the Test List View row and the editor header show a Carbon `<Tag kind="warm-gray">` reading "Coverage incomplete" so the partial-coverage state is visible
- `validate_coverage` API endpoint — `[v1]`
- `applicable_range` API endpoint (for result entry) — `[v1]`
- Bulk Actions toolbar (Delete Selected, Change Sex, Change Type) — `[v1]` (lives in Table View)

**Rationale for warn-and-acknowledge instead of hard block:** Coverage Validation is patient-safety relevant, but a hard block punishes labs that legitimately don't see certain demographics. A senior clinic that never sees infants shouldn't be required to configure neonatal ranges — they need to be able to acknowledge "this test will not be validated for infants" and proceed. The acknowledgment is conscious (requires a checkbox + primary action), logged, and surfaced visibly on the test thereafter.

### §2.5 Sample Storage — `[v1]` (full, audit deferred)

Everything in v2.4 §"Sample Storage Tab" lands in v1, except:

- Version-history audit writes — `[v2]` (table created in v1 per D-09, writes light up in v2)
- **Override Restricted + in-progress orders:** when an admin enables Override Restricted on a test that has orders already in progress, **those orders keep their existing storage settings** (locked-but-unchanged). New orders created after the flag is enabled use the locked version. Document in API + UI behavior.
- **No emojis in checkbox labels:** the v2.4 string table includes emojis (🔒, ❄️, 🔥, etc.) in special-handling labels — these are removed in v2.5; if a visual marker is desired, use Carbon icons (e.g., `<WarningFilled />`) inline.

### §2.5b Display Order — `[v1]` (full — pulled from v2 per Casey's confirmation that drag-drop infrastructure exists)

Full content from v2.4 §"NEW: Test Display Order (Within Sample Type)" lands in v1.

- Sample Type selector (Carbon `<ComboBox>`, typeahead) at the top — admin picks which sample type's order to edit — `[v1]`
- Drag-and-drop ordering of tests within the selected sample type — drag handle `≡` on each row; existing tests in the list are all reorderable (this section is about reordering the catalog as a whole for a sample type, not just one test) — `[v1]`
- **Keyboard reorder:** Arrow Up / Arrow Down on a focused row moves it within the list — `[v1]`
- Position numbers (1, 2, 3, ...) update live as rows are reordered — `[v1]`
- Auto-save on drop (no explicit Save button required for this section) — `[v1]`
- Order persists to `test_sample_type.display_order` (column added by v1 schema migration) and is applied in order entry, result entry, worklists, and reports — `[v1]`
- Out of scope (deferred): per-section ordering (this is about sample-type ordering specifically); cross-sample-type bulk reorder — `[future]`

### §2.6 Panels — `[v1]` (full, typeahead picker + separate Add New Panel + expandable rows + drag-drop)

The section uses **two distinct components** for the two intents (find vs. create), matching the Methods section pattern (`+ Link Method` and `+ Create New Method` as separate buttons):

- **Add-panel picker — Carbon `<FilterableMultiSelect>` (typeahead)** at the top: "Add this test to panel…" — admin types panel name to filter; selecting a panel adds it as an expandable row below — `[v1]`
- **`+ Create New Panel` button** next to the picker, separate component. Toggles open an inline form (Panel Name only). On Create, the new panel is added to the picker's selected set and the post-creation InlineNotification appears — `[v1]`
- **Selected panels render as expandable rows below the picker** (Carbon `<Accordion>` pattern): each row's collapsed header shows the panel name, test count, and current position of "This test"; clicking expands to reveal the position editor + position preview list — `[v1]`
- **Post-creation notification:** after a panel is created inline, show a Carbon `<InlineNotification>` for ~5 seconds: "Panel '{name}' created and selected. Configure additional panel settings in [Master Lists → Panels]." Link is in-app navigation to the Master Lists Panels admin where description, code, default specimens, and other panel fields live.
- **Display position within panel — three synchronized input paths: drag-drop, numeric input, and keyboard arrows.** Each expanded panel row shows: a numeric input ("Position N of M") + a preview list of the panel's tests where "This test" has a drag-handle `≡` and is keyboard-focusable. Existing panel tests are static (not draggable). All three paths write to the same `panel_test.display_order` field — `[v1]`
- Drag-drop infrastructure is already working in OpenELIS; v1 ships the established pattern, not a degraded numeric-only version — `[v1]`

**Why two components rather than embedding Create in the picker's dropdown:** Carbon `<FilterableMultiSelect>` doesn't natively support a footer slot. Forking the component or building a custom wrapper adds engineering overhead for a one-off UX. A separate `+ Create New Panel` button is the standard Carbon pattern, matches the existing Methods section, and reads more clearly to users as a distinct intent.

### §2.7 Terminology — `[v1]` (full)

- Add LOINC / SNOMED CT / CIEL / OCL mappings — `[v1]`
- Relationship type (Same As / Broader Than / Narrower Than) — `[v1]`
- Display existing mappings + delete — `[v1]`
- **Bulk import** — `[v2]`
- **Mapping conflict detection across tests** — `[v2]`

### §2.8 Analyzers — `[v1]` (read-only display, source of truth is analyzer mappings)

The Analyzers section is a **read-only display** showing which analyzers can run this test. The list is **derived from the analyzer test-code mappings** configured in the analyzer interface setup — admins do not link/unlink analyzers from the Test Editor. Changes are made at the analyzer end (Administration → Master Lists → Analyzers → [analyzer] → test code mappings), and this section reflects those changes.

- Read-only table of analyzers that can run this test, columns: Analyzer Name / Location / Serial Number / Status (Online / Offline / Maintenance Tag) — `[v1]`
- Each row links out to the analyzer's record in Master Lists for editing — `[v1]`
- Info card explains: "This list is maintained in the analyzer's test code mappings. To add or remove an analyzer for this test, go to Administration → Master Lists → Analyzers → [analyzer name] → test code mappings." — `[v1]`
- Empty state when no analyzer has this test in its mappings — `[v1]`
- No Link / Unlink buttons; no modal; no write operations from this surface — `[v1]`
- This is a deliberate departure from v2.4 §"Analyzers Tab" which described a link/unlink editor. v2.5 walks that back per Casey's call (2026-05-14): the mappings live with the analyzer and should be edited there; the Test Editor reflects them.

### §2.9 Editor scaffold + Test List View — `[v1]`

- SideNav routing for the 8 v1 sections only — v2 sections are **hidden** in v1 (no "Coming Soon" stubs); the SideNav grows from 8 entries to 14 when v2 ships — `[v1]`
- Test List View with click-to-open rows, no Actions column, keyboard navigation — `[v1]`
- Filter bar (Section / Sample Type / Result Type / Status / Domain / AMR), **default collapsed** — Filters toggle expands; active filter count shown as badge on toggle — `[v1]`
- URL-reflected filter + pagination state (incl. page-number jump-to input on Carbon `<Pagination>`) — `[v1]`
- AMR badge + Domain Tag in row — `[v1]`
- Empty / loading / error / no-permission states — `[v1]`
- Breadcrumb pattern Admin › Test Catalog Management › [Test Name] › [Section Name] — `[v1]`
- Editor header CTAs: **primary `Save Test`** + **secondary `Save as new test…`** (Duplicate workflow; opens a small modal asking for new Name + Code, clones the rest of the test's configuration) + **tertiary `Cancel`** — `[v1]`

### §2.10 Permissions — `[v1]`

- `admin.testCatalog.manage` gates all `/admin/test-catalog/...` routes — `[v1]`
- UI hide + API HTTP 403 — `[v1]`
- `compliance.threshold.view` schema-level permission exists but has no UI surface in v1 (Compliance section is hidden); fully active in v2

### §2.11 Cross-cutting v1 items

- **No feature flag** — v1 replaces legacy admin pages directly at release (legacy Test / Test Section / Panel / Method admin entries decommissioned) — `[v1]`
- 144 i18n keys for v1 sections (per §0.8) — `[v1]`
- Schema migrations 1–9 per §0.6 — `[v1]`
- Carbon Tag mapping for status indicators (Active/Inactive/etc.) — `[v1]`
- Keyboard reorder (Arrow Up/Down per row) on every drag-drop surface in v1 sections — Result Components, Select List Options, Result Interpretations — cross-section accessibility standard — `[v1]`
- Production code uses `@carbon/react` components (`<Tag>`, `<DataTable>`, `<TableToolbar>`, `<Modal>`, `<Accordion>`, `<Pagination>`, `<ComboBox>`, `<FilterableMultiSelect>`, etc.); HTML preview CSS is for visual approximation only — `[v1]`
- **Selection pattern standard:** any picker that selects from a potentially-long list (sample types, panels, sections, methods, analyzers, terminology mapping source, WHONET antibiotic codes, units of measure) uses Carbon `<ComboBox>` (single-select) or `<FilterableMultiSelect>` (multi-select) — never a static `<Dropdown>` or checkbox list. Bounded short lists (≤6 options like Result Type, Domain, Range Type) can use static controls — `[v1]`
- All modals MUST use Carbon `<Modal>` and inherit its focus-trap behavior; do not implement custom modal containers — `[v1]`

---

## §3 v2 Section Detail

### §3.1 ~~Display Order~~ — moved to v1

Display Order is no longer a v2 section; it lands in v1 per §2.5b. Drag-drop infrastructure already exists in OpenELIS and is being used in Result Components / Select List Options / Result Interpretations / Panels — no reason to defer Display Order's drag-drop UI separately.

### §3.2 Labels — `[v2]` (constrained per D-08)

Scope-bounded to picking from the 4 existing fixed presets. Full content from v2.4 §"Labels Tab" applies, **excluding** the v2.4 §"Label Preset Management" content (moved to a separate FRS).

- Pick one of 4 fixed presets per test — `[v2]`
- Set default qty, max qty, Allow Override toggle per linked preset — `[v2]`
- Allow label count override at order entry global setting — `[v2]`
- Order Entry preview — `[v2]`
- New `test_label_preset_link` table — `[v2]`

### §3.3 Reagents — `[v2]` (requires building linkage)

Per D-07: building the `test_reagent_link` table + API endpoints is a v2 scope item. The Reagents tab consumes it.

- Link existing reagents to test (multi-select link modal) — `[v2]`
- Per-link fields: Usage Type (PRIMARY / SECONDARY), Quantity per Test, Quantity Unit — `[v2]`
- Display current stock level from reagent inventory — `[v2]`
- Unlink with confirmation — `[v2]`

### §3.4 Alerts — `[v2]` (per D-03 + D-04 + D-05)

Authoring per-test rules; delivery via the shipped Test Notification system; per-rule `acknowledgment_required` toggle; `COMPLIANCE_BREACH` trigger for ENV/VECTOR.

Full content from v2.4 §"NEW: Alert Rules Configuration" applies, modified by D-03 (remove template/channel storage), D-04 (add COMPLIANCE_BREACH trigger), D-05 (add ack toggle), D-06 (cross-reference Critical Result Acknowledgment workflow).

### §3.5 Reflex & Calc — `[v2]`

Read-only cross-link surface per v2.4 §"NEW: Reflex Tests & Calculated Results." No new editor here — every "Edit" or "Add" button navigates to `/MasterListsPage#reflex` or `/MasterListsPage#calculatedValue`.

### §3.6 Compliance — `[v2]` (per S-01 FRS)

Per v2.4 §"NEW: Compliance Tab (S-01 Integration)". Companion FRS: `S01-compliance-standards-admin-frs-v1.0.md`. Lands in v2, aligned with the Sprint 7 SILNAS Indonesia work on the Vector / Environmental side of the system.

### §3.7 Polish on v1 sections — `[v2]`

- Sample Storage audit write triggers — `[v2]` (audit table created in v1; trigger writes light up in v2)

(Range Editor Table + Visual views are now in v1 per §2.4 — pulled in alongside Display Order and Panel drag-drop since the underlying Carbon infrastructure already works. Panel preview drag-drop is also in v1.)

### §3.8 Localization Hardening — `[v2]`

`test_localization` table created in v1; fallback function (`get_localized_test_field`) + API response shape + UI fallback indicators + bulk untranslated export — all `[v2]`.

---

## §4 Dependencies and Risks

### §4.1 v1 dependencies (must be true to ship v1)

| Dependency | Status | Owner | Mitigation if not ready |
|---|---|---|---|
| Carbon DataTable, ComboBox, Accordion, Modal, Pagination components | Standard `@carbon/react` | OpenELIS frontend | n/a |
| Existing test schema (test, test_section, panel, method, panel_test, etc.) | Shipped | OpenELIS backend | n/a |
| Legacy Test / Section / Panel / Method admin pages can be safely decommissioned | Confirmed per Casey 2026-05-14: v1 has parity for everything not yet in v2 | OpenELIS frontend | If parity gap surfaces, hold release until the gap-section is added to v1 |
| `test_activation_acknowledgment` table for logging Coverage acknowledgments | New schema migration in v1 | OpenELIS backend | n/a |

### §4.2 v2 dependencies (must be true to ship v2)

| Dependency | Status | Owner | Mitigation if not ready |
|---|---|---|---|
| Test Notification system shipped and live | Per Casey 2026-05-14: shipped | Notification team | If misremembered, Alerts moves to a later release; v2 ships without Alerts |
| Test-reagent linkage built | Not built — v2 scope includes building it | Catalog backend | Carve as separate v2 sub-story; Reagents tab gated until linkage lands |
| S-01 Compliance Standards FRS written and built | Specced (companion FRS exists) | Compliance / Environmental team | If S-01 build slips, Compliance moves to v2.1 |
| Sprint 7 SILNAS alignment | Per memory: scheduled | Vector / SILNAS team | If Sprint 7 changes, re-time Compliance only |

### §4.3 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Result Components migration corrupts data in long-tail deployments | Low–Medium | High | v1 migration is reversible (legacy per-test fields retained); dry-run validation in pre-prod; partner-by-partner rollout via feature flag |
| Domain backfill to CLINICAL is wrong for partners with ENV / VECTOR tests today | Medium | Medium | Post-migration admin sweep tool; clearly documented re-classification process |
| Critical Result Acknowledgment workflow doesn't exist when ack toggle is enabled | High (already known) | Low | Toggle exists but no-ops in v2 until workflow lands; placeholder link in helper text |
| Test Notification system isn't actually shipped (memory wrong) | Low | High | Verify against testing.openelis-global.org before v2 kickoff; if wrong, move Alerts to v2.1 |
| Test-reagent linkage scope blows up v2 | Medium | Medium | Define linkage as an additive table only (no rework of existing reagent records); cap scope at the table + 3 endpoints |

---

## §5 Acceptance Criteria — v1 Top-Level

The full per-section acceptance criteria from v2.4 apply where the section is tagged `[v1]` in §2. The following are **the v1-level demoability criteria** — the things a partner should be able to do after v1 ships.

- [ ] Open Admin → Test Catalog Management and see the new list view (no Actions column, click-to-open rows, filter bar collapsed by default with Filters toggle + active-filter-count badge)
- [ ] Filter the list by Section, Sample Type, Result Type, Status, Domain (multi-select chip), AMR; Clear All resets every filter
- [ ] Filter state + page + page size reflected in URL; preserved on refresh; Carbon `<Pagination>` exposes page-number jump input
- [ ] Click any test → open the new SideNav-routed editor with **8 entries** (the 8 v1 sections); v2 sections are not yet visible — they appear when v2 ships
- [ ] Editor header shows primary `Save Test`, secondary `Save as new test…` (Duplicate), and tertiary `Cancel`
- [ ] `Save as new test…` opens a modal asking for new Name + Code, clones the rest of the test's configuration on confirm
- [ ] Edit Basic Info including Domain (forced selection on save) and AMR flag (revealing WHONET sub-fields)
- [ ] Disable AMR on a test with historical results: historical exports unchanged, new results not exported, WHONET config still on the test record
- [ ] Edit Sample & Results, including adding/editing result components on a multi-component test (BP, spirometry, etc.); per-component config wrapped in a Carbon `<Accordion>` item per component when 2+ components, flat when 1 component
- [ ] Configure a numeric component's unit by typing in the Unit ComboBox; create a new unit via "+ Add new unit…" without leaving the editor
- [ ] Reorder Result Components / Select List Options / Result Interpretations via drag-handle OR via Arrow Up/Arrow Down buttons per row (keyboard-only path works end-to-end)
- [ ] Add neonatal-bilirubin-style critical ranges at hour granularity; see Coverage Validation green-light when every age window is covered; see Fill Gap pre-fill from adjacent range when a gap exists
- [ ] **Save a test with incomplete Coverage Validation** — save succeeds; coverage warnings are surfaced but not blocking
- [ ] **Attempt to set the test Active with incomplete coverage** — Activation Acknowledgment modal appears listing the gaps; primary action `Activate anyway` is disabled until the "I understand…" checkbox is checked; on confirm, acknowledgment is logged to `test_activation_acknowledgment` and the test goes Active with a `Coverage incomplete` Tag in the list view
- [ ] Test with only "All" sex ranges shows two Coverage Validation cards (Male + Female), both indicating coverage via the "All" ranges
- [ ] Configure Sample Storage including special handling checkboxes (no emojis) and Override Restricted; enabling Override Restricted on a test with in-progress orders leaves those orders' settings unchanged
- [ ] Assign the test to multiple panels and set its display position within each panel via numeric input; after inline panel creation, see a temporary InlineNotification linking to Master Lists → Panels for additional config
- [ ] Add LOINC / SNOMED / CIEL / OCL terminology mappings with relationship type
- [ ] Link analyzers that can run this test
- [ ] Permission `admin.testCatalog.manage` correctly hides the entry and returns HTTP 403 on the routes
- [ ] No errors in the console when a test is viewed in a language that doesn't have a translation for every field (graceful behavior even though full Localization Hardening lands in v2)
- [ ] After v1 ships, the legacy Test / Test Section / Panel / Method admin entries are gone from the Admin SideNav

---

## §6 What's Next After This FRS

1. **`test-catalog-preview-v2.5-v1.html`** — v1 visual preview (8 active sections + scaffold + list view; no v2 SideNav entries). Companion to this FRS.
2. **Jira v1 epic + child stories** — single epic, ~9 stories: editor scaffold + list view, Basic Info, Sample & Results, Methods, Ranges, Sample Storage, Panels, Terminology, Analyzers.
3. **v2 epic + stories** — written when v1 is in flight, not now. Same FRS, the v2 sections.
4. **Companion FRSs to commission separately:**
   - `label-preset-management-frs.md` — full configurable Label Preset Management (out of this FRS's scope per D-08)
   - Critical Result Acknowledgment workflow — separate FRS (referenced here, not specced here)
