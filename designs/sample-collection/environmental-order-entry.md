# Environmental Order Entry — Standalone (Domain-Assigned Lab)
## Functional Requirements Specification — v2.0

**Version:** 2.0 (rewrite of v1.0; amendments through 2026-05-01)
**Date:** 2026-04-25 (last amended 2026-05-01)
**Status:** Draft for Review
**Jira:** [OGC-537](https://uwdigi.atlassian.net/browse/OGC-537) (under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Compliance Standards Administration (S-01, OGC-528), Sampling Site Registry (S-02, OGC-531), **Organization Registry** (existing OE), Test Catalog (OGC-49) — env subsection for Container Types, **Program / Questionnaire Builder** (existing OE — amended for domain picker), Storage Management (existing), NCE / Non-Conformance Events (existing), Sample Collection Redesign (precedent for CSV bulk upload UX)
**Supersedes:** v1.0 (which was framed as an "integration" extending a clinical baseline; v2.0 reframes as a standalone env order entry screen for domain-assigned labs)

> **2026-05-01 amendment.** Step 1 gains five capabilities to align env order entry with the clinical AMAP backend shape and the Sample Collection Redesign's CSV intake UX. Summary:
> 1. **Submitter** at order level → maps to the existing Organization entity (mirrors clinical AMAP backend; the customer/requestor for the entire order, e.g., "Plaza Senayan Cooling Tower Ops" or "Dinas Pendidikan DKI Jakarta — Water Safety Program"). New §5.1.12.
> 2. **Program** at order level (optional) → renders a lab-configurable FHIR Questionnaire as inline dynamic fields (e.g., school name, building age, tower ID). The existing Program/Questionnaire Builder gains a domain picker so labs can scope a Program to ENVIRONMENTAL. New §5.1.13.
> 3. **Sample Intake — CSV Bulk Upload + Per-Sample Manifest** (was §5.1.9 "Sample Manifest" — restructured). CSV upload is now first; the manifest is a per-sample row table (no longer aggregate quantity), with one row per physical sample. Each row carries new per-sample fields (see #4). When CSV sample types don't match or are missing, reception reconciles via bulk-or-individual apply from the regulation's suggested types OR the broader test catalog. Templates: Standard, 10×10 Box, 96-Well Plate (env-flavored).
> 4. **Per-sample fields** (NEW columns on the manifest): GPS (free text), Location Details (free text), Address (free text), Container Type (ComboBox with type-ahead + custom — list lives in Test Catalog admin → Env subsection).
> 5. **Report NCE button** in the page action bar — opens the existing OE NCE dialog scoped to the order (or a specific sample if one is highlighted). Mirrors QA-3 from Sample Collection Redesign. Reuses existing infrastructure.

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Goals & Non-Goals
4. User Roles & Permissions
5. Functional Requirements
   - 5.1 Step 1 — Branch & Order Setup (single page)
   - 5.2 Step 2 — Label & Store
   - 5.3 Step 3 — QA/QC + Intake Acceptance
6. Data Model
7. API Endpoints
8. Navigation & Screen Inventory
9. Business Rules
10. Localization
11. Validation Rules
12. Security & Permissions
13. Acceptance Criteria
14. FHIR Referral Contract (Inbound)
15. Cross-Reference & Glossary

---

## 1. Executive Summary

This spec defines the order entry workflow for **environmental laboratory units** in OpenELIS Global. It assumes the lab unit is domain-assigned (Environmental); there is no clinical/environmental workflow toggle within this screen — the screen *is* the environmental order entry screen for that lab unit.

The workflow is a **3-step wizard at Reception**:

1. **Branch & Order Setup** — single dense page. Reception clerk picks a branch (Regulation-driven or Ad-hoc), enters site + standard (or site + free tests), captures the sample manifest (sample-type quantities or CSV bulk upload), and records default collection conditions.
2. **Label & Store** — per-sample accession + barcode + receipt condition + collection date/time (which starts the hold-time clock) + storage location.
3. **QA/QC + Intake Acceptance** — quick-add QC samples (blank/duplicate/control), per-sample NCE flagging using the existing NCE button, and final batch submission.

A single front-of-house reception clerk may serve multiple domain-assigned lab units (Environmental, Vector, Clinical) in one shift. To prevent context confusion, a **domain badge** is visible on every screen.

OpenELIS-to-OpenELIS referrals are not a separate branch but an **entry path**: they arrive via the Order Dashboard's Incoming queue (driven by FHIR Task), open Step 1 pre-populated, with branch auto-set from the FHIR payload.

> **⚠️ 2026-04-28 amendment — multi-regulation orders.** The Compliance Standard ComboBox is now a **MultiSelect**: an order may be governed by ≥1 regulation simultaneously (e.g., a drinking-water sample evaluated against both PP No. 22/2021 and WHO-DWG-4 in the same submission). Suggested tests union + deduplicate across selected standards. Sample manifest pre-population unions across all selected standards. Each suggested test is annotated with which standards govern it. The data model becomes M:N — the single `complianceStandardId` columns on Order are replaced by an `order_compliance_standard` join table (symmetric — no "primary" regulation). Downstream specs (S-05 v2.0 result evaluation, S-06 Laporan Hasil) consume the join and evaluate / render per regulation.
>
> Multi-component test results (e.g., noise pollution = heading° + dB level + N readings from a device) are handled at the test catalog level in a parallel thread. From the order entry perspective, a multi-component test still appears as one test on the order; component definition + result entry rendering happens downstream in the test catalog admin (Casey's other thread) and S-05 v2.0 (results entry).

---

## 2. Problem Statement

**Current state.** The v1.0 spec was framed as an integration extending a clinical baseline — an "Environmental section" that appears when a workflow toggle is set. With the recent decision to assign each lab unit a single domain (clinical, environmental, or vector), the workflow-toggle framing is no longer correct. The env order entry screen stands alone for environmentally-assigned lab units; it never coexists with a clinical form.

**Pain points addressed:**

- Reception clerks at small labs need to enter a complete order in a single page without a guided sub-wizard. Samples are physically on the desk during entry.
- Multiple physical samples typically arrive together for the same regulation/site (e.g., 5 surface-water samples + 3 groundwater samples for a single PP No. 22/2021 monitoring run). The data entry pattern must default to many samples per order, with bulk-upload acceleration.
- Environmental orders may be regulation-driven (an order under a specific compliance standard) or ad-hoc (site-driven, no standard, free choice from the test catalog). Both are valid v1 paths.
- Vector and inter-lab referrals carry their own metadata (FHIR Task, pool/aliquot scheme); the env entry screen must accept FHIR-driven pre-population without requiring reception to manually re-key referral content.
- Hold-time violations, broken containers, missed cold-chain, and other intake anomalies must be captured via the existing NCE pattern, not invented anew.

**Proposed solution.** A 3-step wizard (Branch+Order / Label & Store / QA-QC) for environmentally-assigned lab units. Reception completes Step 1 in a single page with all sections visible; subsequent steps may be performed by the same person or handed off. Referrals are an entry path that pre-populates Step 1.

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Single-page Step 1 for reception.** All order-setup data entry on one scroll. No nested sub-wizards.
2. **Branch-driven Step 1 conditional content.** Two tiles (Regulation-driven, Ad-hoc) drive what fields render below. Referral-pre-filled orders auto-set the branch based on FHIR payload.
3. **Default to many-samples-per-order.** Sample manifest table + CSV bulk upload as first-class entry mechanisms.
4. **Reuse existing NCE pattern at Step 3.** Per-sample NCE button surfaces the existing coded-reason + reject-decision dialog. No new flag types invented.
5. **Domain badge visible on every screen.** Reception clerks juggling multiple in-progress orders across lab units always see which domain they're in.
6. **FHIR-driven referral pre-population.** Inbound ServiceRequest/Specimen bundle drives branch selection, site, standard, sample manifest, and conditions. Reception confirms or edits.
7. **Provide the structured data contract for the Results Certificate report.**

### 3.2 Non-Goals

1. **Clinical workflow.** This spec defines no clinical surface. A separate clinical order entry spec applies to clinical lab units.
2. **Compliance evaluation engine.** Defined in S-05; this spec only persists the data S-05 consumes.
3. **Reference material registry (CRM/LRM).** v1 lets the QA tech enter material name + expected value(s) inline at Step 3. A future spec may add a registry; not in scope here.
4. **EQA (External Quality Assessment).** EQA is operationally similar to internal QC but has separate reporting obligations. Handled in a separate EQA Management module, not Step 3.
5. **Batch QC frequency rule enforcement.** v1 does not surface "you need N more blanks" warnings at intake. The lab user knows their regulation's QC requirements.
6. **Per-sample test override.** v1 assumes all samples in a batch share the test panel from Step 1. Per-sample override is a P1 follow-up.
7. **Compliance standard administration.** Covered by S-01.
8. **Site registry administration.** Covered by S-02.
9. **Required-By date field.** A generic "Required By" date+time field is being added as a cross-cutting OE feature affecting all order types (clinical, env, vector, EQA). When that ships, this spec inherits the field automatically — no changes needed here. (Was S-03d Part A; split out as cross-cutting.)
10. **SOP holding-time auto-calculation.** Covered by S-03d v2.0 as an env-specific addendum.

---

## 4. User Roles & Permissions

| Role | Step 1 Branch & Order | Step 2 Label & Store | Step 3 QA/QC |
|---|---|---|---|
| Reception Clerk | Full | Full | Full |
| Lab Technician | Full | Full | Full |
| Lab Manager | Full | Full | Full |
| QA Officer | View | View | Full (QC + reject) |
| System Administrator | Full | Full | Full |

Permissions reused from existing keys (no new permission keys introduced):

- `order.enter` — create/edit orders in Step 1
- `order.label` — assign accession + barcode in Step 2
- `order.qa` — add QC samples + reject samples in Step 3
- `compliance.standard.view` — view and select standards (Step 1 regulation-driven branch)
- `site.registry.view` — search and select sites (Step 1)
- `site.registry.create` — create new sites inline (Step 1)
- `nce.create` — flag a sample with an NCE (Step 3)

---

## 5. Functional Requirements

### 5.1 Step 1 — Branch & Order Setup (single page)

#### 5.1.1 Page Layout

**ID:** ENV-1-001
**Priority:** P0
**Requirement:**
Step 1 SHALL render as a single-page form with all sections visible on one scroll. There is no in-page sub-wizard, no Next/Back navigation within Step 1. The page contains the following sections in order, with conditional rendering driven by the selected branch (numbering reflects 2026-05-01 amendment):

1. Action Bar — Lab Number + Domain Badge + Referral Tag + **Report NCE button** (always)
2. Order Type Tile (always)
3. **Submitter** (always — Organization)
4. Sampling Site (always)
5. **Program** (optional — renders a FHIR Questionnaire's dynamic fields when selected)
6. Compliance Standard (Regulation-driven branch only)
7. Test Selection (regulation-driven: pre-loaded plan; ad-hoc: full OE Order Panels + Order Tests picker)
8. Regulatory Reference (Ad-hoc branch only — optional free-text)
9. **Sample Intake** (always — A. CSV Bulk Upload, then B. Per-Sample Manifest table)
10. Default Collection Conditions (always)
11. Pool/Aliquot sub-section (referral-pre-filled orders with `Specimen.parent[]` only)
12. Required-By date+time (GENERIC)
13. Footer actions: Save Draft, Submit Order, Cancel

**Acceptance Criteria:**

- [ ] All sections render on a single page with no sub-stepper
- [ ] Conditional sections render or hide based on branch selection without losing scroll position
- [ ] Carbon `Stack` and `Tile` components used for section grouping
- [ ] Page is keyboard-navigable end-to-end via Tab key
- [ ] WCAG 2.1 AA color contrast on all text + section borders
- [ ] Action bar is sticky on scroll so the Report NCE button stays accessible from any section

---

#### 5.1.2 Action Bar — Lab Number, Domain Badge, Referral Tag, Report NCE button

**ID:** ENV-1-002 (amended 2026-05-01 — Report NCE button added)
**Priority:** P0
**Requirement:**
The page action bar SHALL be a sticky-on-scroll horizontal bar at the top of Step 1 displaying:

- **Lab Number** — auto-generated, read-only TextInput (e.g., `ENV-2026-0412`). Format configurable per lab unit.
- **Domain Badge** — Carbon `Tag` displayed adjacent to the Lab Number. Color and label reflect the lab unit's assigned domain: purple "Environmental", teal "Vector", blue "Clinical". Badge is always visible. Hover tooltip: "This order belongs to {Lab Name} ({Domain})". The badge persists on Steps 2 and 3 so reception can disambiguate when juggling orders across domains.
- **Referral Tag** — Carbon `Tag` (kind="cyan") displayed only when the order originated from an inbound FHIR referral (`order.referralSource != null`). Label format: "Referral: {source lab name}". Click opens a side panel with the full referral payload for inspection.
- **Report NCE button** (NEW 2026-05-01) — right-aligned Carbon `Button kind="ghost"` with the existing OE NCE icon. Clicking opens the existing OE NCE dialog scoped to the order. The dialog's existing scope selector (Sample / Order, per Sample Collection Redesign QA-3) lets reception flag a per-sample NCE if a specific sample row was highlighted on the page when the button was pressed. Reuses existing OE infrastructure — coded reasons, severity, accept-with-flag vs. reject decisions, audit trail. No new NCE component is introduced; this spec only mounts the button on Step 1.

**Acceptance Criteria:**

- [ ] Lab Number renders auto-generated and read-only
- [ ] Domain Badge always visible on Steps 1, 2, and 3
- [ ] Domain Badge color and label match the lab unit's assigned domain
- [ ] Referral Tag renders only when `referralSource` is non-null
- [ ] Referral Tag click opens the referral payload side panel
- [ ] Tooltip on Domain Badge hover names the lab unit
- [ ] Report NCE button is visible on Step 1 in the sticky action bar
- [ ] Report NCE button opens the existing OE NCE dialog (no new dialog component)
- [ ] When a per-sample row is focused/highlighted on the page, the dialog opens with scope = Sample for that row; otherwise scope = Order
- [ ] Reuses the existing OE coded-reason picklist, severity, and reject/accept decisions verbatim

---

#### 5.1.3 Order Type (Branch Selector)

**ID:** ENV-1-003
**Priority:** P0
**Requirement:**
A two-tile branch selector SHALL appear immediately below the Lab Number row. Tiles:

- **Regulation-driven** — "Order is governed by a compliance standard. Tests will be suggested based on the standard's linked thresholds."
- **Ad-hoc** — "Site-driven. Pick tests freely from the catalog. Optional regulatory reference for audit trail."

The selector uses Carbon `ClickableTile` + radio semantics. Selecting a tile updates the conditional sections below without reloading the page; if data has been entered in branch-specific sections, switching branches prompts a confirmation: "Switching order type will clear {section names}. Continue?"

When the order arrives via FHIR referral (ENV-14-001), the branch is auto-set:

- If the FHIR payload carries a `complianceStandard` extension that resolves to an Active local standard → branch = **Regulation-driven**.
- Otherwise → branch = **Ad-hoc**.

A small helper line appears below the tiles: "ⓘ Auto-set when order arrives from referral." When auto-set, the tiles remain editable — reception can override the branch.

**Acceptance Criteria:**

- [ ] Two tiles render: Regulation-driven, Ad-hoc
- [ ] Selecting a tile is a single click; visual state shows current selection
- [ ] Switching branches with entered data prompts a confirmation modal
- [ ] FHIR referrals auto-set the branch per resolution rules
- [ ] Auto-set branch is overridable by reception
- [ ] Helper line explains auto-set behavior

---

#### 5.1.4 Sampling Site

**ID:** ENV-1-004
**Priority:** P0
**Requirement:**
The Sampling Site section SHALL appear in both branches. Behavior reuses S-02 site search/select. When a site is selected, a Selected Site Card displays site code, name, type, region/district, GPS, environmental zone, total collections count, and last collection date (per S-02 FR-5.3.1). Site metadata auto-populates downstream fields:

| Site Field | Target Field | Behavior |
|---|---|---|
| GPS coordinates | Step 2 collection GPS default | Pre-populated; editable per sample |
| Environmental Zone | Default Collection Conditions → Zone | Pre-populated; editable |
| Site Type | Standard ComboBox prioritization (regulation-driven only) | Used to surface matching standards first |
| Total Collections + Last Collection | Selected Site Card display | Reference only |

Site is a required field for both branches.

**Acceptance Criteria:**

- [ ] Site search/select reuses S-02 components
- [ ] Selected Site Card renders all listed metadata
- [ ] GPS pre-fills Step 2 collection GPS as the per-sample default
- [ ] Environmental zone pre-fills default collection conditions
- [ ] Site type drives standard ComboBox prioritization on the regulation-driven branch
- [ ] Total collections and last collection date display on the Selected Site Card
- [ ] All pre-populated downstream fields are editable
- [ ] Changing the selected site re-triggers auto-population (with confirmation if downstream fields were edited)

---

#### 5.1.5 Compliance Standards (Regulation-driven branch only) — MultiSelect

**ID:** ENV-1-005 (amended 2026-04-28 for multi-regulation orders)
**Priority:** P0
**Requirement:**
On the Regulation-driven branch, the Compliance Standards section SHALL appear after the Sampling Site section. **An order may select one or more compliance standards** — orders evaluated against ≥2 regulations are common in environmental labs (e.g., drinking water assessed against both national standard PP No. 22/2021 and WHO drinking-water guidelines). The section contains:

- **Section header:** "Compliance Standards" with info tooltip: "Select one or more regulatory standards. Tests, thresholds, and downstream evaluation will be union'd across all selected standards."
- **Standard MultiSelect** (required, ≥1): Carbon `MultiSelect` with typeahead, filtered to ACTIVE compliance standards (per S-01 BR-001). Each item displays standard name, **regulation number prominently in monospace**, issuing body, and a green "Active" status Tag. The regulation number remains the primary lookup anchor — reception types regulation numbers from paperwork (e.g., "PP No. 22/2021", "WHO-DWG-4") to add each one. Typeahead filters by name, issuing body, OR regulation number.
- **Selected Standards Stack** (read-only, appears below the MultiSelect with one card per selected standard): each card displays
  - Standard name (large, bold)
  - **Regulation number (large, monospace, copy-able with click-to-copy icon)**
  - Issuing body, version, effective date
  - Linked test count for that standard
  - "Active" status Tag
  - **Remove** (✕) button — un-selects this standard
  - "View Thresholds" link → opens an inline accordion for that standard's parameter groups + thresholds; does not navigate away
- **All standards are equal weight (symmetric M:N).** No "primary" regulation. Display order in the stack matches selection order.
- **Site-type prioritization** in the typeahead unchanged: standards matching the site's `siteType` appear first.

**Acceptance Criteria:**

- [ ] MultiSelect component used (not single-select ComboBox)
- [ ] At least one standard required to submit a regulation-driven order
- [ ] One Selected Standard Card per selection, removable independently
- [ ] Click-to-copy on each regulation number
- [ ] No "primary" designation in UI or data model — all selected standards weighted equally

**Acceptance Criteria:**

- [ ] ComboBox appears only on the Regulation-driven branch
- [ ] Typeahead matches against name, issuing body, OR regulation number
- [ ] ComboBox row shows regulation number prominently in monospace
- [ ] Selected Standard Card displays regulation number large, monospace, copy-able
- [ ] "View Thresholds" opens inline accordion without page navigation
- [ ] Site-type prioritization applies when site is selected; toggle disables it
- [ ] Standard selection is required to submit a regulation-driven order
- [ ] Clearing the standard removes the card and clears the suggested test panel (with confirmation if tests were modified)

**Note:** the v1.0 spec's Regulatory Reference field is removed on the Regulation-driven branch. The regulation number is now displayed prominently on the Selected Standard Card; a separate input field would be redundant. See ENV-1-008 for the ad-hoc-branch usage.

---

#### 5.1.6 Test Selection — Branch-Aware UX (rewritten 2026-04-29)

**ID:** ENV-1-006 (rewritten 2026-04-29 — branch-aware UX after Casey review)
**Priority:** P0
**Requirement:**
Test selection on Step 1 takes one of two visual shapes depending on branch. Both shapes are gated behind the manifest having at least one sample type with quantity ≥ 1 — until then, the section displays helper text "Add a sample type with quantity ≥ 1 to the manifest below to choose tests." Both shapes filter their visible test catalog by the union of sample types active in the manifest.

##### 5.1.6.A Regulation-driven branch — Pre-loaded Test Plan

When ≥ 1 compliance standard is selected, the system SHALL automatically load **every test linked to any selected standard's ComplianceThresholds** (deduped union — a test that appears in two standards is loaded once and ordered once). Reception sees a compact, scannable Test Plan rather than a discovery picker.

**Layout:**

```
Test Plan from Selected Regulations
14 tests will run on each sample (from PP No. 22/2021 + Permenkes 32/2017, 3 shared)

☑ pH                            LOINC 11558-4    [PP 22/2021] [Permenkes 32/2017]
☑ Total Dissolved Solids        LOINC 3745-7     [PP 22/2021]
☑ Lead (Pb)                     LOINC 5671-0     [PP 22/2021] [Permenkes 32/2017]
☑ Total Coliform                LOINC 5794-0     [PP 22/2021]
…  (deduped union, all checked by default — uncheck to drop from this order)

⚠ 2 tests blocked by missing sample types
   • Mercury (Hg) needs Drinking Water (st-002) — quantity is 0
     [+ Add 1 to manifest]   [Skip this test]
   • BOD₅ needs Surface Water (st-001) — quantity is 0
     [+ Add 1 to manifest]   [Skip this test]

[+ Add a test or panel not in the regulations]   ← reveals a small ComboBox picker
```

**Component behavior:**
- **Pre-loaded list** — checkbox list, all checked by default, deduped across selected standards. Each row shows test name, LOINC, unit, and one or more regulation tags showing coverage.
- **Blocked-by-missing-sample list** — separate compact warning region listing tests that *would* run if a required sample type had quantity ≥ 1. Each blocked entry offers two affordances: "+ Add 1 to manifest" (jumps focus to the manifest row, adds quantity 1) and "Skip this test" (removes from order; sample type stays at 0).
- **Add-extra affordance** — a single "+ Add a test or panel not in the regulations" button reveals a compact ComboBox typeahead picker scoped to the active sample types. Lets reception bolt on extras (e.g., a client-requested pH check on a chemistry-only regulation order). Selected extras render as additional rows below the pre-loaded list with an `[Ad-hoc]` tag instead of regulation tags.
- **No two-stack panel/test discovery UI** — that's reserved for the ad-hoc branch (§5.1.6.B).

##### 5.1.6.B Ad-hoc branch — Full OE Order Panels + Order Tests Picker

When no regulation is selected (ad-hoc branch), test selection SHALL use **the existing OpenELIS clinical order entry test selection component** — two stacked sections, "Order Panels" above "Order Tests", each rendered as a chip strip + typeahead search + scrollable checkbox list (matches the clinical order entry pattern verbatim).

```
Order Panels
[ Surface Water Physical+Chemical ✕ ]
[ 🔍 Choose Available panel ]
☑ Surface Water Physical+Chemical
☐ Drinking Water Quality
☐ Coliform Microbiological
…

Order Tests
[ pH ✕ ] [ Lead (Pb) ✕ ] [ Total Coliform ✕ ] …
[ 🔍 Choose Available Test ]
☐ Temperature
☑ pH
…
```

Key behaviors (inherited from existing OE clinical order entry, unchanged):
- Selecting a panel auto-adds its constituent tests to the Order Tests selected list. Tests remain individually visible; removing a panel does not auto-remove its constituent tests (panel = grouping convenience).
- Tests selected via panel inclusion render as checked + disabled in the available-tests checkbox list.
- Typeahead search filters within each section.
- Checkbox click toggles selection; chip ✕ removes selection.
- Both lists are filtered to entries whose `applicableSampleTypes` intersect the manifest's active sample types.
- Nothing is pre-checked.

##### Common (both branches)
- Section is hidden until at least one manifest row has quantity ≥ 1.
- All selected tests apply to **every sample row** in the manifest at Step 2 (per-sample test override deferred — BR-007).

**Acceptance Criteria:**

- [ ] Section is hidden when manifest has no active sample types (quantity ≥ 1)
- [ ] Regulation-driven branch shows a single deduped pre-loaded list (all checked) — no two-stack picker
- [ ] Each pre-loaded test displays one or more regulation tags showing which standard(s) cover it
- [ ] Tests linked to a regulation but blocked by 0-quantity sample type appear in a separate warning region with "+ Add 1 to manifest" and "Skip this test" affordances
- [ ] "+ Add a test or panel not in the regulations" button reveals a compact ComboBox picker scoped to active sample types
- [ ] Ad-hoc tests added via the extra picker render with an [Ad-hoc] tag
- [ ] Ad-hoc branch shows the full OE Order Panels + Order Tests two-stack component (chip strip + typeahead + checkbox list per section)
- [ ] Ad-hoc branch starts with all checkboxes empty
- [ ] Both branches filter their visible options by manifest active sample types
- [ ] All selected tests apply to every sample row at Step 2

---

#### 5.1.7 Test Selection — Sample-Type Filter

**ID:** ENV-1-007 (rewritten 2026-04-29)
**Priority:** P0
**Requirement:**
Both branches' test selection UIs SHALL filter their visible options by the manifest's active sample types (rows with quantity ≥ 1). Filter rule: a test or panel is shown only if at least one of its `applicableSampleTypes` is present in the active manifest sample types.

For the regulation-driven branch, this filter is applied **after** the pre-loaded union — so a test linked to a regulation but whose required sample types are all at quantity 0 surfaces in the "blocked by missing sample types" region rather than vanishing silently.

**Acceptance Criteria:**

- [ ] Visible test catalog (ad-hoc) and ComboBox add-extra picker (regulation-driven) are filtered by `applicableSampleTypes ∩ activeManifestSampleTypes`
- [ ] Regulation-driven blocked tests do not silently disappear — they appear in the blocked-by-missing-sample region
- [ ] As manifest sample type quantities change, the filtered options update reactively

---

#### 5.1.8 Regulatory Reference (Ad-hoc branch only)

**ID:** ENV-1-008
**Priority:** P1
**Requirement:**
On the Ad-hoc branch only, an optional Regulatory Reference free-text input SHALL appear (TextArea, max 500 chars). Helper text: "Note any regulation referenced on the requisition. Optional — for audit trail only."

This field exists to capture audit-trail context when a paper requisition references a regulation but no formal standard is being assigned in OpenELIS. The field does NOT drive any system behavior — it is purely an audit/reporting note.

**Acceptance Criteria:**

- [ ] Field appears only on the Ad-hoc branch
- [ ] Field is optional
- [ ] Max 500 characters
- [ ] Value persists with the order and appears on downstream reports as a "Regulatory Reference (Ad-hoc)" footnote when non-empty

---

#### 5.1.9 Sample Intake — CSV Bulk Upload + Per-Sample Manifest (rewritten 2026-05-01)

> **2026-05-01 restructure.** Was "Sample Manifest" — an aggregate quantity table (e.g., "5 × Surface Water"). Now restructured as a per-sample table (one row per physical sample) with CSV bulk upload as the primary intake path. Each manifest row carries new per-sample fields (GPS, Location Details, Address, Container Type) per the 2026-05-01 amendment. Uses the CSV Bulk Upload UX precedent established in the Sample Collection Redesign (COL-6 / COL-7 / COL-8 / COL-9).

**ID:** ENV-1-009 (rewritten 2026-05-01)
**Priority:** P0
**Requirement:**
The Sample Intake section SHALL appear on both branches and is composed of two stacked sub-sections — A. CSV Bulk Upload (primary intake) and B. Per-Sample Manifest (the resolved table reception works against). Manual entry alone is supported (no CSV); CSV upload populates the table and reception edits per row before submitting.

##### 5.1.9.A CSV Bulk Upload

**Templates.** Three downloadable CSV templates, env-flavored (precedent: Sample Collection Redesign COL-6):

| Template | Use case | Required columns | Optional columns |
|----------|----------|------------------|------------------|
| **Standard (flat list)** | One row per sample, no spatial layout | `sample_type_code`, `container_type` | `gps`, `location_details`, `address`, `collection_dt`, `collector`, `notes` |
| **10×10 Box Layout** | Pre-positioned samples in a storage box | `position` (e.g., `A3`), `sample_type_code`, `container_type` | same as Standard |
| **96-Well Plate** | Plate-laid-out samples for high-throughput intake | `well` (e.g., `A1`–`H12`), `sample_type_code`, `container_type` | same as Standard |

Each template downloads as `.csv` with header row, an example row, and column-comment lines explaining accepted values. Sample-type and container-type values may be supplied as a stable `code` (e.g., `st-001`, `cont-whirlpak`) or a human-readable `name` (e.g., `Surface Water`, `Whirl-Pak Bag`); the parser tries code first, then name.

**Upload control.** A two-tile section (precedent: Sample Collection Redesign mockup §Bulk Import from CSV):

- **Left tile — Download CSV Template:** three buttons (Standard / 10×10 Box / 96-Well Plate) wired to the corresponding template download endpoint.
- **Right tile — Upload CSV File:** drag-and-drop area + click-to-browse. Accepts `.csv`, max 5 MB.

**Preview + row-level validation.** On upload, the system parses the file and renders a preview DataTable with row-level status indicators:

- ✓ Valid (green) — row passes all validation checks.
- ⚠ Mismatch (yellow) — sample_type_code does not match a known sample type, OR container_type does not match a known container, OR a required column is missing/blank.
- ✗ Error (red) — row is structurally malformed (e.g., bad date format, non-numeric where numeric required) and cannot be repaired inline.

Status pill summary at the top of the preview: `{N} parsed · {V} valid · {W} need attention · {E} errors`. Cells with mismatches render as inline-editable widgets so reception can fix them in place — see §5.1.9.A.1 reconciliation UX below. Cells that are clean render read-only.

**Sample-type reconciliation UX (§5.1.9.A.1).** When a CSV row's `sample_type_code` doesn't match a system type or is missing, the cell renders as an inline ComboBox with two reconciliation sources stacked in the dropdown:

```
[ Choose sample type… ▾ ]
┌────────────────────────────────────────────┐
│ Suggested by selected regulation(s)         │
│   • Surface Water (PP No. 22/2021)          │
│   • Drinking Water (Permenkes 32/2017)      │
│   • Cooling Water (PP No. 22/2021)          │
│ ─────────────────────────────────────────── │
│ Or pick from full Test Catalog               │
│   [type to search…]                          │
└────────────────────────────────────────────┘
```

Above the preview table when ≥ 2 rows share the same mismatch value, a banner offers a bulk action: **"2 rows have an unknown sample type 'creek_water'. [Apply same fix to all 2 rows ▾]"**. Selecting a value from the bulk dropdown applies it to every matching mismatch row in a single operation.

The same reconciliation pattern applies to **Container Type** mismatches, drawing the suggestion list from the OE Test Catalog → Env subsection (the env-scoped container-type list maintained there) and the broader Test Catalog as fallback.

**Action footer.** Two buttons:

- **Fix Issues** — focuses the first unresolved mismatch row.
- **Import {V} Valid Samples** — imports rows currently in ✓ Valid state into the per-sample manifest table (§5.1.9.B). Mismatch and error rows stay in the preview for reception to repair or discard. Reception can re-import after fixes by clicking the button again.

##### 5.1.9.B Per-Sample Manifest Table

After CSV import (or via manual "+ Add sample row" or via the regulation suggestion strip), each physical sample is represented by one row in the manifest table. There is no aggregate quantity column — quantity is implicit (one row per sample).

**Quick-add strip — regulation-suggested sample types (NEW 2026-05-01).** When the order is on the Regulation-driven branch and ≥ 1 standard is selected, the deduped union of the standards' `applicableSampleTypes` SHALL render above the per-sample manifest table as a horizontal strip of suggestion chips. The strip is **pre-loaded — no click required to reveal**. Each chip shows:

- Sample type name
- Coverage tag(s) — which selected regulation(s) include this sample type
- A small NumberInput (`0–99`) — the count of rows to add
- An `+ Add {N}` button — when clicked, appends N rows of that sample type to the per-sample manifest, each with empty per-sample fields (Container Type, GPS, Location Details, Address) for reception to fill in. The NumberInput resets to `0` after the add.

This gives reception two complementary intake paths on the Regulation-driven branch:

| Path | Use case |
|------|----------|
| **CSV upload** (§5.1.9.A) | Pre-collected samples with full per-sample data already known offline (e.g., school courier with twelve labeled bottles) |
| **Quick-add strip** (here) | Regulation-driven entry where reception types a count per suggested type, then fills in per-row details on the bench |
| **+ Add sample row** | Manual addition of one row at a time; useful for ad-hoc samples or override types not in the regulation's suggestions |

All three paths produce rows in the same per-sample manifest table; rows are indistinguishable after creation.

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `#` | Auto | — | Row index, 1-based |
| Sample Type | ComboBox | Yes | From OE sample-type catalog. Regulation-driven branch annotates with coverage Tags showing which regulation(s) include this type. Ad-hoc branch shows a "Not in any selected standard" Tag if applicable. |
| **Container Type** | ComboBox + custom | Yes | **NEW (2026-05-01).** ComboBox with type-ahead from the OE Test Catalog → Env subsection's container-type list. Allow custom entry — typed values are persisted on the row but flagged for admin review. |
| **GPS** | TextInput (free text) | No | **NEW (2026-05-01).** Free text, max 100 chars. Convention: `lat, lon` (e.g., `-6.1885, 106.8114`). Not validated for format — labs may capture `MGRS`, plus codes, or notes. |
| **Location Details** | TextInput (free text) | No | **NEW (2026-05-01).** Free text, max 500 chars. Per-sample sub-site descriptor (e.g., `Tower A — return loop`, `North playground — by goalpost`). |
| **Address** | TextInput (free text) | No | **NEW (2026-05-01).** Free text, max 500 chars. Per-sample street/postal address when distinct from the Sampling Site's address. |
| Collection Date/Time | DateTimePicker | No (Step 1) | Optional in Step 1; required by Step 2. Carried forward from CSV when supplied. |
| Notes | TextInput | No | Free text, max 255 chars. |
| Actions | — | — | `🗑` row delete; row select for "highlight" so the Action Bar Report NCE button targets that row. |

**Bulk-apply controls** above the table (mirror Sample Collection Redesign precedent):

- "Apply Container Type to all" — applies the picked container to every row.
- "Apply GPS to all" — for sites with a single coordinate.

**"+ Add sample row"** at the bottom — adds an empty row with the Sample Type ComboBox open.

**Total samples count** below the table: `Total: {N} samples in this batch.`

**Validation:** ≥ 1 row with a valid Sample Type AND a valid Container Type is required to submit Step 1. Per-sample fields (GPS / Location / Address / Collection Date) are optional at Step 1 — Step 2 (Label & Store) flags any per-sample required-by-the-existing-OE-pattern omissions.

**Acceptance Criteria:**

- [ ] CSV templates download with env-flavored columns (Standard, 10×10 Box, 96-Well Plate)
- [ ] CSV upload accepts `.csv` up to 5 MB via drag-drop or click-browse
- [ ] Preview table shows row-level Valid / Mismatch / Error status with summary pills
- [ ] Sample-type mismatch cells render an inline ComboBox with regulation-suggested types and full-catalog search
- [ ] Container-type mismatch cells render an inline ComboBox sourced from the OE Test Catalog Env subsection
- [ ] Bulk-apply banner appears when ≥ 2 rows share the same mismatch value, and applies the chosen value to every match
- [ ] "Import N Valid Samples" promotes only ✓ Valid rows into the per-sample manifest table; mismatches and errors stay in the preview for repair
- [ ] Per-sample manifest table renders one row per physical sample (no aggregate quantity column)
- [ ] Each row supports Container Type, GPS, Location Details, Address, Collection Date/Time, and Notes
- [ ] Container Type ComboBox is type-ahead from OE Test Catalog Env subsection with custom entry allowed
- [ ] GPS / Location Details / Address are free-text; not format-validated
- [ ] "Apply Container Type to all" and "Apply GPS to all" bulk controls work as described
- [ ] "+ Add sample row" appends a new empty row
- [ ] On the Regulation-driven branch, a quick-add strip pre-loads the deduped union of selected standards' applicable sample types, no click required to reveal
- [ ] Each suggestion chip shows the sample type name, coverage tag(s), a NumberInput, and an "+ Add N" button
- [ ] Clicking "+ Add N" appends N rows of that sample type to the per-sample manifest with empty per-sample fields
- [ ] NumberInput resets to 0 after a successful add
- [ ] Total samples count updates dynamically
- [ ] ≥ 1 row with valid Sample Type AND Container Type required to submit
- [ ] Manual entry without CSV is fully supported
- [ ] CSV-imported rows are indistinguishable from manually-entered rows after import (same edit affordances)

---

#### 5.1.10 Default Collection Conditions

**ID:** ENV-1-010
**Priority:** P0
**Requirement:**
A Default Collection Conditions section SHALL appear on both branches. Fields are configurable per environmental program (leveraging existing Program infrastructure). The default field set when no program-specific config exists:

| Field | Type | Required | Notes |
|---|---|---|---|
| Collection Method | Select | Yes | Manual Grab, Composite (Time), Composite (Flow), Automated Sampler, Passive, Trap Collection, Other |
| Water Temperature | NumberInput (°C) | No | Visible for water-related programs |
| Ambient Temperature | NumberInput (°C) | No | All programs |
| Weather Conditions | Select | No | Clear, Cloudy, Rain, Storm, Wind, Other |
| Preservation Method | TextInput | No | Free-text |
| Field Notes | TextArea | No | Free-text, max 1000 chars |
| Sampling Uncertainty Value | NumberInput | No (configurable required per program) | Positive decimal, 0.00–999.99, 2 decimal places. ISO 17025 field-collection uncertainty. (Absorbed from S-03b.) |
| Sampling Uncertainty Unit | Select | No (paired with Value) | `%` (Relative) · `mg/L` · `μg/L` · `CFU/100 mL` · `Other` (with free-text input when selected) |

Values entered here apply as defaults to **all samples** in the manifest. Per-sample collection-condition overrides are deferred to a P1 follow-up — for v2.0, defaults from this section apply uniformly to every sample in the batch. Site metadata pre-populates Zone, GPS defaults, etc.

Administrators can configure per-program field sets via the Program configuration in Admin (extending existing "Additional Order Information" pattern).

**Acceptance Criteria:**

- [ ] Section appears on both branches
- [ ] Fields load dynamically based on the selected program
- [ ] Default field set renders when no program-specific config exists
- [ ] Collection Method is required; other fields optional by default
- [ ] Defaults flow through to every sample row at Step 2
- [ ] Fields validate per their type (numeric range, string length)

---

#### 5.1.11 Pool / Aliquot Sub-section (Referral with pool metadata only)

**ID:** ENV-1-011
**Priority:** P1
**Requirement:**
When the order originates from an inbound FHIR referral whose payload contains `Specimen.parent[]` references, a Pool / Aliquot sub-section SHALL appear immediately above the Sample Manifest. The sub-section displays:

- Parent Specimen identifier(s) from the FHIR payload (read-only)
- Aliquot numbering scheme: the receiver assigns local LABNOs as `{LABNO}.X-Y` where X-Y indicates the aliquot range (e.g., `ENV-2026-0412.1-3` for aliquots 1 through 3 of a pool)
- Deconvolution mapping: a small table showing parent specimen ID → local aliquot LABNO

This sub-section is hidden when the order has no parent specimens.

**Acceptance Criteria:**

- [ ] Sub-section renders only when `Specimen.parent[]` is present in the referral payload
- [ ] Parent Specimen identifiers display read-only
- [ ] Local aliquot LABNOs follow the X-Y scheme
- [ ] Deconvolution mapping table is visible
- [ ] Hidden when no parent specimens are present

---

#### 5.1.12 Submitter (Organization) — NEW 2026-05-01

**ID:** ENV-1-012
**Priority:** P0
**Requirement:**
Every env order SHALL carry a **Submitter** — the customer/requestor for the entire order. The Submitter section appears below the Order Type tile and above Sampling Site, on both branches.

**Backend mapping.** Submitter is stored as a foreign key to the existing OE **Organization** entity. This mirrors the clinical AMAP backend shape ("Add Many at Provider/Patient" — clinical multi-order screen uses the existing Organization entity for the requesting facility). No new entity, no new schema migration. The env screen reads/writes the same `order.requestingOrganizationId` column the clinical AMAP path writes to.

**UI.** Carbon `ComboBox` with type-ahead against the active set of Organizations the user can see (per existing OE permission model). Beneath the ComboBox: a small **+ Create new Organization** affordance that opens the existing OE Organization create modal (no env-specific create flow — the existing modal handles all required fields). After creation, the new Organization is auto-selected on the Submitter ComboBox.

**Selected Submitter Card.** When an Organization is picked, a Tile renders below the ComboBox showing: Organization name, address (if recorded), primary contact name + email + phone (if recorded), and a small "X orders in last 90 days" stat (from existing OE order history). Card has a `Change` button to re-open the picker.

**Distinction from Sampling Site.** The Submitter is *who pays / requests* (e.g., `Plaza Senayan Cooling Tower Operations`); the Sampling Site is *where the samples come from* (e.g., site code `PSN-CT-01`). One Submitter may own many Sites; one Site may be sampled for multiple Submitters over time.

**Validation.** Required to submit Step 1.

**Acceptance Criteria:**

- [ ] Submitter section renders on both branches between Order Type and Sampling Site
- [ ] ComboBox provides type-ahead search of OE Organizations
- [ ] "+ Create new Organization" opens the existing OE Organization create modal verbatim
- [ ] Selected Submitter Card shows name, address, primary contact, recent order count
- [ ] Selection persists in `order.requestingOrganizationId` (existing column, no new schema)
- [ ] Required to submit Step 1
- [ ] Mirrors clinical AMAP backend mapping (data parity)

---

#### 5.1.13 Program (FHIR Questionnaire — Optional) — NEW 2026-05-01

**ID:** ENV-1-013
**Priority:** P1
**Requirement:**
The Program section SHALL appear below Sampling Site and above Compliance Standard, on both branches, and is **optional**. When reception selects a Program, the system renders the Program's associated FHIR Questionnaire as inline dynamic fields, capturing program-specific metadata (e.g., school name + building age + last plumbing inspection for a "School Water Safety Program," or tower ID + loop name + last cleaning date for a "Cooling Tower Compliance" program).

**Reuses existing OE Program/Questionnaire Builder.** The Program admin already exists in OpenELIS; this spec does **not** redesign it. The only amendment required upstream is a **domain picker** on the Program admin record so labs can scope a Program to `ENVIRONMENTAL` (or `CLINICAL` / `VECTOR` / `BOTH`). On the env order entry screen, the Program ComboBox filters to programs where `program.domain ∈ {ENVIRONMENTAL, BOTH}`.

**UI.**
- **ComboBox (`Program (optional)`)** — type-ahead from active env-domain Programs. Below the field: helper text *"Select a program to capture program-specific metadata. Programs are configured in Admin → Programs."*
- When a Program is selected, the Questionnaire renders below the ComboBox as a **Tile** containing the dynamic field set. Field types come from the Questionnaire definition (text, number, date, select, boolean, attachment, etc.). All fields are saved as `order.programResponses` (a FHIR `QuestionnaireResponse` resource serialized into the order). Required fields (per the Questionnaire) block Step 1 submission with the same validation pattern used for OE's existing fields; optional fields don't.
- **Change Program** button on the Tile re-opens the picker. Switching Programs prompts a confirmation if any answers were entered: "Switching programs will clear {N} program-specific answers. Continue?"
- **Clear Program** removes the Program association and clears `programResponses`.

**Persistence.** Stored as a FHIR `QuestionnaireResponse` linked to the order via `order.programResponseId`. The Questionnaire itself lives in the existing OE Questionnaire registry, versioned by the Program admin.

**Acceptance Criteria:**

- [ ] Program section renders on both branches between Sampling Site and Compliance Standard
- [ ] ComboBox lists active Programs with `domain ∈ {ENVIRONMENTAL, BOTH}`
- [ ] Selecting a Program renders its Questionnaire as inline dynamic fields
- [ ] Required Questionnaire fields block Step 1 submission with field-level error
- [ ] Optional Questionnaire fields don't block submission
- [ ] Switching Programs with answers entered prompts a confirmation
- [ ] Clearing the Program removes the association and the answers
- [ ] Answers persist as a FHIR `QuestionnaireResponse` linked to the order

**Upstream dependency:** Existing Program/Questionnaire Builder gains a `domain` picker (ENVIRONMENTAL / CLINICAL / VECTOR / BOTH). Tracked separately — small amendment, ~1 dev-day. Cross-reference with the Program admin Jira ticket (TBD).

---

### 5.2 Step 2 — Label & Store

> **2026-04-29 simplification.** Step 2 reuses the existing OpenELIS labeling and storage pattern. This spec does **not** redesign the per-sample labeling UI. The existing pattern handles row generation, accession assignment, barcode entry, collection date/time, receipt condition, storage-location picker, and bulk-apply controls. The only env-specific additions on this step are (1) sample type is sourced from the Step 1 manifest and is read-only, and (2) the hold-time clock starts when Collection Date/Time is recorded. Everything else inherits unchanged.

#### 5.2.1 Reuse Existing OpenELIS Label & Storage Pattern

**ID:** ENV-2-001
**Priority:** P0
**Requirement:**
Step 2 SHALL render the existing OpenELIS per-sample labeling and storage UI for the rows generated from the Step 1 Sample Manifest (one row per physical sample; quantity 5 of Surface Water + quantity 3 of Groundwater → 8 rows). CSV-uploaded rows carry their per-sample data forward as pre-populated row values.

Two env-specific deltas vs. the existing pattern:

1. **Sample Type is locked** — sourced from the Step 1 manifest, displayed read-only.
2. **Hold-time clock starts** when Collection Date/Time is entered (see §5.2.2 below).

All other fields and behaviors (Accession Number scheme, Barcode field, Collection Date/Time picker, Receipt Condition picklist, Storage Location picker, Per-sample Notes, bulk-apply controls) inherit from the existing OpenELIS labeling and storage module.

**Acceptance Criteria:**

- [ ] One row per physical sample, generated from Step 1 quantities
- [ ] Sample Type is locked, not editable on this step
- [ ] All other Step 2 fields and bulk-apply controls match the existing OpenELIS labeling/storage pattern (no custom UI)
- [ ] Per-sample CSV-uploaded values pre-populate the row

---

#### 5.2.2 Hold-Time Clock Start (Env-specific)

**ID:** ENV-2-002
**Priority:** P0
**Requirement:**
When Collection Date/Time is recorded for a sample at Step 2, the system SHALL start the hold-time clock for that sample. Hold-time durations are derived from the test catalog (per-test hold-time) and the selected compliance standard(s) (regulation-driven branch — when multiple standards apply, the strictest hold-time wins). The system computes a per-sample latest-acceptable analysis time and stores it on the sample.

If at the moment of Step 2 recording, the hold-time has already been exceeded for one or more linked tests, the row displays a red "Hold-time exceeded" indicator. The sample is not blocked — it advances to Step 3 where the lab tech decides whether to flag NCE and/or reject.

**Acceptance Criteria:**

- [ ] Hold-time clock starts at Step 2 collection date/time entry
- [ ] Per-test hold-time durations sourced from test catalog
- [ ] Per-sample latest-acceptable-analysis time computed and stored
- [ ] Red "Hold-time exceeded" indicator shown when the threshold has already passed
- [ ] No hard block at Step 2 — sample advances to Step 3 for decision

---

### 5.3 Step 3 — QA/QC + Intake Acceptance

#### 5.3.1 Per-Sample NCE Button (Reuse Existing Pattern)

**ID:** ENV-3-001
**Priority:** P0
**Requirement:**
Step 3 SHALL display the same per-sample table from Step 2 in read-only mode plus an additional **NCE column** containing the existing OpenELIS NCE button per row. Clicking the NCE button opens the existing NCE dialog (coded reason picklist + reject decision). No new NCE infrastructure is introduced — this spec only wires the button onto the env order entry sample row.

When a sample has an active NCE, the row displays the NCE code as a `Tag` and the reject decision as an icon (rejected → red ⓧ; accepted-with-flag → yellow ⚠).

Hold-time-exceeded samples (from ENV-2-002) automatically receive a pre-populated NCE flag when Step 3 opens — the lab tech can confirm, change the code, or accept the sample with flag.

**Acceptance Criteria:**

- [ ] NCE column added to the per-sample table on Step 3
- [ ] NCE button opens the existing NCE dialog (no new dialog component)
- [ ] Existing coded reason picklist used as-is
- [ ] Existing reject decision (reject vs accept-with-flag) used as-is
- [ ] Active NCEs display code Tag + decision icon on the row
- [ ] Hold-time-exceeded samples auto-pre-populate an NCE flag
- [ ] Pre-populated NCE is editable/confirmable by the tech

---

#### 5.3.2 QC Sample Quick-Add

**ID:** ENV-3-002
**Priority:** P0
**Requirement:**
Below the per-sample table, three quick-add buttons SHALL appear:

```
[+ Blank]   [+ Duplicate]   [+ Control]
```

Clicking any button immediately appends a new row to a separate **QC Samples** table below the client-sample table. The new row is pre-populated with sensible defaults and exposes inline-editable fields specific to its QC type. **One click adds the sample; subsequent edits are inline.**

**Blank row fields:**
- QC ID (auto-generated, e.g., `QC-BLNK-001`)
- Blank sub-type (Select: Field, Trip, Equipment, Method, Other) — picklist for downstream reporting
- Storage Location (defaults to client-sample default)
- Notes (free-text, optional)

**Duplicate row fields:**
- QC ID (auto-generated, e.g., `QC-DUP-001`)
- Parent sample (Select: dropdown of existing client-sample LABNOs from Step 2) — required
- Storage Location
- Notes
- Expected value: "inherits from parent" (read-only display)

**Control row fields:**
- QC ID (auto-generated, e.g., `QC-CTRL-001`)
- Material name (TextInput, free-text, e.g., "NIST 1640a Trace Elements in Water") — required
- Source (TextInput, free-text, e.g., "NIST", "Vendor X lot 12345") — optional
- Expected Value(s) (small inline editable table: parameter | expected value | unit)
- Storage Location
- Notes

QC samples join the batch and ride the same downstream flow as client samples (get tested, accumulate results), but carry a `qcType` flag so downstream reports/dashboards distinguish them.

**Acceptance Criteria:**

- [ ] Three quick-add buttons render: Blank, Duplicate, Control
- [ ] Single click on any button appends a row immediately (no modal)
- [ ] QC Samples table renders separately from client samples
- [ ] Each QC type exposes the field set defined above
- [ ] QC ID auto-generated with type prefix
- [ ] Duplicate "Parent sample" picker shows existing client-sample LABNOs
- [ ] Control "Expected Value(s)" is an inline-editable table
- [ ] Each QC row has a delete (ⓧ) button
- [ ] QC samples persist with `qcType` field on the sample entity
- [ ] QC samples ride the same downstream test/result flow as client samples

---

#### 5.3.3 Submit Batch

**ID:** ENV-3-003
**Priority:** P0
**Requirement:**
The Step 3 footer contains:

- "Save Draft" — persists current state, order remains in Draft status
- "Submit Batch" — transitions all non-rejected samples (client + QC) to the next status (Sent to Bench / Pending Analysis), enforces required-field validation, and triggers any pre-bench notifications. Rejected samples remain on the order but do not proceed downstream.
- "Cancel" — discards unsaved changes (with confirmation if any)

**Acceptance Criteria:**

- [ ] Submit Batch transitions non-rejected samples to bench
- [ ] Required-field validation runs before submit (Receipt Condition, Storage Location, Collection Method, etc.)
- [ ] Validation errors anchor inline next to the field with focus management
- [ ] Rejected samples persist on the order with their NCE record
- [ ] Save Draft persists state without status transition
- [ ] Cancel prompts confirmation when unsaved changes exist

---

## 6. Data Model

### 6.1 Modified Entities

**Order (extended) — multi-regulation amendment 2026-04-28:**

The single `complianceStandardId` / `complianceStandardVersion` / `complianceStandardName` / `regulationNumber` columns are **replaced by a join table** (`order_compliance_standard`) supporting M:N. All selected regulations are equal weight (no "primary").

| Field | Type | Required | Notes |
|---|---|---|---|
| `branch` | Enum | Yes | REGULATION_DRIVEN \| AD_HOC |
| `regulatoryReferenceAdhoc` | String(500) | No | Free-text, ad-hoc branch only |

**OrderComplianceStandard (new join table — replaces single FK columns):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `orderId` | Long (FK) | Yes | FK → orders.id |
| `complianceStandardId` | Long (FK) | Yes | FK → compliance_standard.id |
| `complianceStandardVersion` | String(50) | Yes | Snapshot at order time (per-standard version lock) |
| `complianceStandardName` | String(255) | Yes | Denormalized for reporting |
| `regulationNumber` | String(100) | Yes | From standard, snapshot |
| `selectionOrder` | Integer | Yes | Order of selection at order entry; drives display order in stack and certificate header |
| `addedAt` | Timestamp | Yes | When this regulation was attached to the order |
| `addedByUserId` | Long (FK) | Yes | Audit |

Primary key: `(orderId, complianceStandardId)`. The join enforces "each regulation appears at most once per order."
| `siteId` | Long (FK) | Yes | FK → SamplingSite.id |
| `referralSourceId` | Long (FK) | No | FK → external lab/source; non-null = referral order |
| `referralFhirTaskId` | String(100) | No | Inbound FHIR Task ID for traceability |
| `parentSpecimenIds` | String[] | No | For pool/aliquot referrals |
| Default conditions: `defaultCollectionMethod`, `defaultWaterTemperature`, `defaultAmbientTemperature`, `defaultWeatherConditions`, `defaultPreservationMethod`, `defaultFieldNotes` | (various) | (varies) | Defaults applied to all samples |

**Sample (extended; per-sample fields added 2026-05-01):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `sampleType` | Enum/FK | Yes | From manifest |
| `containerType` | String(100) | Yes | **NEW (2026-05-01).** Stable code from OE Test Catalog → Env subsection. Custom values allowed; flagged for admin review. |
| `gpsRaw` | String(100) | No | **NEW (2026-05-01).** Free text; convention `lat, lon` but accepts MGRS / plus codes / labs' free notes. Not format-validated. |
| `locationDetails` | String(500) | No | **NEW (2026-05-01).** Free text; per-sample sub-site descriptor. |
| `address` | String(500) | No | **NEW (2026-05-01).** Free text; per-sample address when distinct from the Site's address. |
| `accessionNumber` | String(50) | Yes | Auto or user-entered |
| `barcode` | String(100) | Yes | Linked to accession |
| `collectionDateTime` | Timestamp | Yes | Starts hold-time clock |
| `receiptCondition` | Enum | Yes | Acceptable / Cold-chain Broken / Container Damaged / Insufficient Volume / Other |
| `storageLocationId` | Long (FK) | Yes | FK → StorageLocation |
| `holdTimeExpiresAt` | Timestamp | No | Computed at Step 2 |
| `qcType` | Enum | No | Null for client samples; BLANK \| DUPLICATE \| CONTROL otherwise |
| `qcParentSampleId` | Long (FK) | No | Required if qcType = DUPLICATE |
| `qcMaterialName` | String(255) | No | Required if qcType = CONTROL |
| `qcMaterialSource` | String(255) | No | Optional, qcType = CONTROL |
| `qcExpectedValues` | JSON | No | qcType = CONTROL only; per-parameter expected values |
| `qcBlankSubtype` | Enum | No | qcType = BLANK only: FIELD \| TRIP \| EQUIPMENT \| METHOD \| OTHER |
| `nceId` | Long (FK) | No | Existing NCE entity reference |

**Order (additions 2026-05-01):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `requestingOrganizationId` | Long (FK) | Yes | **NEW (2026-05-01).** FK → existing Organization entity. The Submitter — order-level customer/requestor. Mirrors clinical AMAP backend mapping (no new schema; this column already exists for clinical). |
| `programId` | Long (FK) | No | **NEW (2026-05-01).** FK → existing Program entity (env-domain via the new `program.domain` field). |
| `programResponseId` | Long (FK) | No | **NEW (2026-05-01).** FK → FHIR `QuestionnaireResponse` linked to the order. Populated when a Program is selected and its Questionnaire is answered. |

### 6.2 Database Schema Changes

```sql
-- Order-level columns
ALTER TABLE orders ADD COLUMN branch VARCHAR(20) NOT NULL DEFAULT 'REGULATION_DRIVEN';
ALTER TABLE orders ADD COLUMN regulatory_reference_adhoc VARCHAR(500);

-- 2026-04-28 amendment: M:N join replacing single-FK regulation columns
CREATE TABLE order_compliance_standard (
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    compliance_standard_id BIGINT NOT NULL REFERENCES compliance_standard(id),
    compliance_standard_version VARCHAR(50) NOT NULL,
    compliance_standard_name VARCHAR(255) NOT NULL,
    regulation_number VARCHAR(100) NOT NULL,
    selection_order INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    added_by_user_id BIGINT NOT NULL REFERENCES users(id),
    PRIMARY KEY (order_id, compliance_standard_id)
);
CREATE INDEX idx_ocs_order ON order_compliance_standard(order_id);
CREATE INDEX idx_ocs_standard ON order_compliance_standard(compliance_standard_id);
ALTER TABLE orders ADD COLUMN site_id BIGINT REFERENCES sampling_site(id);
ALTER TABLE orders ADD COLUMN referral_source_id BIGINT REFERENCES referral_source(id);
ALTER TABLE orders ADD COLUMN referral_fhir_task_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN parent_specimen_ids TEXT[];
ALTER TABLE orders ADD COLUMN default_collection_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN default_water_temperature DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN default_ambient_temperature DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN default_weather_conditions VARCHAR(50);
ALTER TABLE orders ADD COLUMN default_preservation_method VARCHAR(255);
ALTER TABLE orders ADD COLUMN default_field_notes TEXT;

ALTER TABLE sample ADD COLUMN accession_number VARCHAR(50);
ALTER TABLE sample ADD COLUMN barcode VARCHAR(100);
ALTER TABLE sample ADD COLUMN collection_date_time TIMESTAMP;
ALTER TABLE sample ADD COLUMN receipt_condition VARCHAR(50);
ALTER TABLE sample ADD COLUMN storage_location_id BIGINT REFERENCES storage_location(id);
ALTER TABLE sample ADD COLUMN hold_time_expires_at TIMESTAMP;
ALTER TABLE sample ADD COLUMN qc_type VARCHAR(20);
ALTER TABLE sample ADD COLUMN qc_parent_sample_id BIGINT REFERENCES sample(id);

-- 2026-05-01 amendment: per-sample env fields (Container Type, GPS, Location Details, Address)
ALTER TABLE sample ADD COLUMN container_type VARCHAR(100);
ALTER TABLE sample ADD COLUMN gps_raw VARCHAR(100);
ALTER TABLE sample ADD COLUMN location_details VARCHAR(500);
ALTER TABLE sample ADD COLUMN address VARCHAR(500);

-- 2026-05-01 amendment: order-level Submitter (reuses existing Organization),
-- Program (env-domain), and Program response (FHIR QuestionnaireResponse).
-- requesting_organization_id may already exist on the orders table from clinical AMAP;
-- if so, this migration is a no-op for that column.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requesting_organization_id BIGINT REFERENCES organization(id);
ALTER TABLE orders ADD COLUMN program_id BIGINT REFERENCES program(id);
ALTER TABLE orders ADD COLUMN program_response_id BIGINT REFERENCES questionnaire_response(id);
CREATE INDEX idx_orders_requesting_organization ON orders(requesting_organization_id) WHERE requesting_organization_id IS NOT NULL;
CREATE INDEX idx_orders_program ON orders(program_id) WHERE program_id IS NOT NULL;

-- 2026-05-01 amendment: domain picker on Program (small upstream change)
-- Owned by Program/Questionnaire Builder spec; included here for cross-reference.
-- ALTER TABLE program ADD COLUMN domain VARCHAR(20) NOT NULL DEFAULT 'CLINICAL';
-- (allowed values: CLINICAL, ENVIRONMENTAL, VECTOR, BOTH)
ALTER TABLE sample ADD COLUMN qc_material_name VARCHAR(255);
ALTER TABLE sample ADD COLUMN qc_material_source VARCHAR(255);
ALTER TABLE sample ADD COLUMN qc_expected_values JSONB;
ALTER TABLE sample ADD COLUMN qc_blank_subtype VARCHAR(20);
ALTER TABLE sample ADD COLUMN nce_id BIGINT REFERENCES nce(id);

CREATE INDEX idx_orders_branch ON orders(branch);
CREATE INDEX idx_orders_site_id ON orders(site_id);
CREATE INDEX idx_orders_compliance_standard_id ON orders(compliance_standard_id);
CREATE INDEX idx_sample_qc_type ON sample(qc_type);
CREATE INDEX idx_sample_hold_time ON sample(hold_time_expires_at);
```

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/compliance-standards?status=ACTIVE` | List active standards | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}/applicable-sample-types` | Sample types linked to standard | `compliance.standard.view` |
| GET | `/api/v1/compliance-standards/{id}/suggested-tests?sampleTypeIds={ids}` | Tests filtered by standard + sample types | `compliance.threshold.view` |
| GET | `/api/v1/compliance-standards/{id}/parameter-groups` | Parameter groups for accordion | `compliance.threshold.view` |
| GET | `/api/v1/sample-types` | All system sample types | `order.enter` |
| POST | `/api/v1/orders` | Create order (Step 1 submit) | `order.enter` |
| PUT | `/api/v1/orders/{id}` | Update order | `order.enter` |
| POST | `/api/v1/orders/{id}/samples/bulk` | Submit Step 2 sample rows | `order.label` |
| POST | `/api/v1/orders/{id}/qc-samples` | Add a QC sample at Step 3 | `order.qa` |
| POST | `/api/v1/orders/{id}/submit-batch` | Final batch submission | `order.qa` |
| POST | `/api/v1/orders/{id}/manifest/csv` | Upload sample manifest CSV | `order.enter` |
| POST | `/api/v1/orders/from-referral` | Create order pre-populated from FHIR Task ID | `order.enter` |
| GET | `/api/v1/orders/{id}` | Get order detail (includes `complianceContext`) | `order.enter` |

---

## 8. Navigation & Screen Inventory

| Screen | Description | Source Requirement |
|---|---|---|
| **Step 1 — Branch & Order Setup** | Single-page form with conditional branch sections | ENV-1-001 through ENV-1-011 |
| **Step 2 — Label & Store** | Per-sample table with bulk-apply controls | ENV-2-001, ENV-2-002 |
| **Step 3 — QA/QC** | Per-sample NCE column + QC quick-add table + submit | ENV-3-001 through ENV-3-003 |
| **Order Dashboard** | Search by site code/name, filter by compliance standard, "Sample Source" column | (extends existing dashboard; deferred details) |
| **Incoming Referrals (Order Dashboard)** | List of inbound FHIR referrals; click opens Step 1 pre-populated | ENV-14-002 |

Companion mockup: `S03-environmental-order-entry-mockup.jsx` (also rewritten for v2.0).

---

## 9. Business Rules

**BR-001 (amended 2026-04-28):** Regulation-driven orders MUST have **at least one** compliance standard selected before submitting Step 1. Multiple standards may be selected; all are weighted equally (symmetric M:N — no "primary" designation). Ad-hoc orders do not select any.

**BR-002:** The compliance standard version stored on the order is a **snapshot** from order creation time. Subsequent supersession of the standard does not affect existing orders' evaluation.

**BR-003:** Test selection on the Regulation-driven branch is a suggestion only — reception can deselect any suggested test or add non-suggested tests. The order is valid with any combination.

**BR-004:** Default Collection Conditions fields are configurable per environmental program. If program config changes after order entry, existing orders retain their entry-time field values. New orders use updated config.

**BR-005:** Sample Manifest quantity must total ≥ 1 to submit Step 1. Each row's quantity must be a positive integer ≤ 999.

**BR-006:** A user may add sample types not listed in the selected compliance standard via the "Add Other Sample Type" override on the Regulation-driven branch. Override sample types display "Not in Standard" tag; the system does not block submission.

**BR-007:** Per-sample test override is not supported in v1. All samples in a batch run the same test panel (set in Step 1).

**BR-008:** The Domain Badge is always visible on Steps 1, 2, and 3. It cannot be hidden by user action.

**BR-009:** Hold-time clock starts at Step 2 when Collection Date/Time is entered. If hold-time was already exceeded at Step 2 entry, the sample row displays an indicator and Step 3 auto-pre-populates an NCE flag — but the sample is not blocked from advancing.

**BR-010:** QC samples (qcType ≠ null) ride the same downstream flow as client samples — they accumulate results and appear on bench worklists. They are distinguished only by the `qcType` field for reporting.

**BR-011:** Per-sample NCE flagging at Step 3 reuses the existing OpenELIS NCE button + dialog. No new NCE codes or workflow are introduced.

**BR-012:** When an order originates from a FHIR referral, branch resolution is automatic per ENV-14-003 but reception may override. The `referralSource` field persists regardless of override.

**BR-013:** Submit Batch at Step 3 transitions only non-rejected samples to bench. Rejected samples persist on the order with their NCE record but do not proceed downstream.

---

## 10. Localization

All UI text externalized. i18n key namespace is `order.*` (no `envOrder.` prefix — the lab unit's domain assignment is the only context).

| i18n Key | Default English Text |
|---|---|
| `heading.order.complianceStandard` | Compliance Standard |
| `heading.order.collectionConditions` | Default Collection Conditions |
| `heading.order.sampleManifest` | Sample Manifest |
| `heading.order.suggestedTests` | Suggested Tests |
| `heading.order.testCatalog` | Test Catalog |
| `heading.order.poolAliquot` | Pool / Aliquot |
| `heading.order.qaIntake` | QA / QC + Intake |
| `label.order.branch.regulationDriven` | Regulation-driven |
| `label.order.branch.adhoc` | Ad-hoc |
| `label.order.branch.helper.referralAutoSet` | Auto-set when order arrives from referral |
| `label.order.standard.regulationNumber` | Regulation Number |
| `label.order.standard.copyRegNumber` | Copy regulation number |
| `label.order.regulatoryReference.adhoc` | Regulatory Reference (optional) |
| `label.order.regulatoryReference.adhoc.helper` | Note any regulation referenced on the requisition. Optional — for audit trail only. |
| `label.order.manifest.totalSamples` | Total: {count} samples in this batch |
| `label.order.manifest.csvUpload` | Upload CSV manifest |
| `label.order.manifest.addSampleType` | Add Sample Type |
| `label.order.manifest.addOtherSampleType` | Add Other Sample Type |
| `label.order.manifest.notInStandard` | Not in Standard |
| `label.order.collection.method` | Collection Method |
| `label.order.collection.waterTemperature` | Water Temperature (°C) |
| `label.order.collection.ambientTemperature` | Ambient Temperature (°C) |
| `label.order.collection.weatherConditions` | Weather Conditions |
| `label.order.collection.preservationMethod` | Preservation Method |
| `label.order.collection.fieldNotes` | Field Notes |
| `label.order.label.accession` | Accession Number |
| `label.order.label.barcode` | Barcode |
| `label.order.label.collectionDateTime` | Collection Date/Time |
| `label.order.label.receiptCondition` | Receipt Condition |
| `label.order.label.storageLocation` | Storage Location |
| `label.order.label.bulkApplyStorage` | Apply storage location to all |
| `label.order.label.bulkApplyDateTime` | Apply collection date/time to all |
| `label.order.qc.addBlank` | + Blank |
| `label.order.qc.addDuplicate` | + Duplicate |
| `label.order.qc.addControl` | + Control |
| `label.order.qc.blankSubtype` | Blank Sub-type |
| `label.order.qc.parentSample` | Parent Sample |
| `label.order.qc.materialName` | Material Name |
| `label.order.qc.materialSource` | Material Source |
| `label.order.qc.expectedValues` | Expected Value(s) |
| `label.order.qc.qcId` | QC ID |
| `button.order.viewThresholds` | View Thresholds |
| `button.order.showAllStandards` | Show All Standards |
| `button.order.saveDraft` | Save Draft |
| `button.order.submitOrder` | Submit Order |
| `button.order.submitBatch` | Submit Batch |
| `button.order.cancel` | Cancel |
| `tooltip.order.domainBadge` | This order belongs to {labName} ({domain}) |
| `tag.order.referral` | Referral: {sourceLab} |
| `tag.order.notInStandard` | Not in Standard |
| `tag.order.suggestedTest` | Suggested |
| `tag.order.holdTimeExceeded` | Hold-time exceeded |
| `message.order.standardRequired` | A compliance standard is required for regulation-driven orders. |
| `message.order.manifestEmpty` | Add at least one sample type to submit. |
| `message.order.testsSuggested` | Based on {standardName} and {sampleCount} sample types, {testCount} tests have been suggested. |
| `message.order.noLinkedTests` | No tests are linked to this standard. Add tests manually or contact your administrator. |
| `message.order.switchBranchConfirm` | Switching order type will clear {sections}. Continue? |
| `message.order.csvDetected` | Detected: {summary}. Apply to manifest? |
| `error.order.standardRequired` | Please select a compliance standard. |
| `error.order.collectionMethodRequired` | Collection method is required. |
| `error.order.temperatureRange` | Temperature must be between -50 and 100 °C. |
| `error.order.quantityRange` | Quantity must be a positive integer up to 999. |

---

## 11. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| Compliance Standard (regulation-driven) | Required | `error.order.standardRequired` |
| Sample Manifest | At least one row with quantity ≥ 1 | `error.order.manifestEmpty` |
| Sample Manifest quantity per row | Positive integer, max 999 | `error.order.quantityRange` |
| Collection Method | Required | `error.order.collectionMethodRequired` |
| Water/Ambient Temperature | -50 to 100 °C | `error.order.temperatureRange` |
| Field Notes / Notes | Max 1000 chars | `error.order.notesMaxLength` |
| Preservation Method | Max 255 chars | `error.order.preservationMaxLength` |
| Regulatory Reference (ad-hoc) | Max 500 chars | `error.order.referenceMaxLength` |
| Receipt Condition | Required at Step 2 | `error.order.receiptConditionRequired` |
| Storage Location | Required at Step 2 | `error.order.storageRequired` |
| Accession Number | Unique within lab; required | `error.order.accessionRequired` |
| Barcode | Unique within lab when entered | `error.order.barcodeUnique` |
| QC Duplicate Parent Sample | Required when qcType = DUPLICATE | `error.order.qcParentRequired` |
| QC Control Material Name | Required when qcType = CONTROL | `error.order.qcMaterialRequired` |

---

## 12. Security & Permissions

S-03 reuses existing permission keys. No new permissions introduced.

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View standards in ComboBox | `compliance.standard.view` | ComboBox disabled with message |
| View thresholds accordion | `compliance.threshold.view` | "View Thresholds" link hidden |
| Select/change standard on order | `order.enter` | ComboBox disabled |
| Enter Step 1 fields | `order.enter` | Form disabled |
| Enter Step 2 fields | `order.label` | Form disabled |
| Add QC sample / reject sample | `order.qa` | Buttons disabled |
| Flag sample with NCE | `nce.create` | NCE button disabled |
| Upload CSV manifest | `order.enter` | Upload disabled |

---

## 13. Acceptance Criteria

### Functional

- [ ] Step 1 renders as a single page with no sub-stepper
- [ ] Branch selector toggles between Regulation-driven and Ad-hoc; switching with entered data prompts confirmation
- [ ] Domain badge visible on every step, color-coded by lab unit domain
- [ ] Referral tag visible only when order originated from FHIR referral
- [ ] Sampling Site search works on both branches; metadata pre-fills downstream
- [ ] Compliance Standard ComboBox typeahead matches against name, issuing body, and regulation number
- [ ] Selected Standard Card displays regulation number prominently in monospace, copy-able
- [ ] Suggested tests filtered by standard AND manifest sample types
- [ ] Sample Manifest accepts manual entry, CSV upload, and inline row addition
- [ ] CSV upload parses and asks before applying
- [ ] Step 2 generates one row per physical sample from Step 1 quantities
- [ ] Hold-time clock starts at Step 2 collection date/time entry
- [ ] Step 3 reuses existing NCE button per sample row
- [ ] Three quick-add QC buttons render and add rows in a single click
- [ ] Each QC type exposes its inline-editable field set
- [ ] Submit Batch transitions non-rejected samples to bench
- [ ] FHIR referrals open Step 1 pre-populated with branch auto-set

### Non-Functional

- [ ] All UI strings use i18n keys (no hardcoded English)
- [ ] Standard ComboBox loads within 500ms
- [ ] Test auto-suggestion completes within 1 second
- [ ] CSV manifest upload handles up to 1000 rows
- [ ] All sample data persisted with order for reporting
- [ ] Permissions enforced at API level (HTTP 403 for unauthorized)

### Integration

- [ ] S-01 standards appear in the order-time ComboBox
- [ ] S-02 site search reuses S-02 components
- [ ] Existing NCE button works unchanged at Step 3
- [ ] Existing Storage Management module surfaces in Step 2 storage location picker
- [ ] Inbound FHIR referrals via the contract in §14 pre-populate Step 1

---

## 14. FHIR Referral Contract (Inbound)

### 14.1 Bundle Profile

**ID:** ENV-14-001
**Priority:** P0
**Requirement:**
Inbound OpenELIS-to-OpenELIS referrals SHALL arrive as a FHIR Bundle (transaction or message) containing:

- One `ServiceRequest` per order
- One `Specimen` per sample (linked via `Specimen.request` → `ServiceRequest.id`)
- Optional `DiagnosticReport`(s) for partial-result referrals (sender already produced some results)
- Optional `Provenance` for chain-of-custody audit

**ServiceRequest required fields:**

| FHIR Field | Maps To | Notes |
|---|---|---|
| `identifier` | `order.referralSenderLabNumber` | Sender's original LABNO |
| `status` | "active" | |
| `intent` | "order" | |
| `code` | Test panel | Receiver maps to local test catalog by LOINC or by sender→receiver test mapping |
| `priority` | `order.priority` | routine \| urgent \| stat |
| `requester` | `order.referralSourceId` (lookup or create Organization) | Drives Referral Tag |
| `reasonCode` | `order.regulatoryReferenceAdhoc` (fallback if standard doesn't resolve) | |
| `extension[complianceStandard]` | `order.complianceStandardId` (when resolves) | See §14.2 |
| `subject` | Site reference | Maps to local SamplingSite via `siteCode` |
| `occurrenceDateTime` | Default Collection Date/Time | Optional; per-Specimen overrides |

**Specimen required fields:**

| FHIR Field | Maps To | Notes |
|---|---|---|
| `identifier` | Sender's per-sample LABNO | |
| `type` | `sample.sampleType` | Receiver maps to local sample-type registry |
| `collection.collectedDateTime` | `sample.collectionDateTime` | Pre-fills Step 2 |
| `collection.method` | `order.defaultCollectionMethod` | Or per-sample override |
| `collection.bodySite` | `order.defaultCollectionConditions.zone` (or site sub-location) | |
| `collection.fastingStatus` (repurposed as preservation code) | `order.defaultPreservationMethod` | Optional |
| `parent[]` | `order.parentSpecimenIds` | Triggers Pool/Aliquot sub-section (ENV-1-011) |
| `extension[siteCode]` | Cross-validates Site mapping | |
| `note` | `sample.notes` | |

### 14.2 Compliance Standard Extension

**ID:** ENV-14-002
**Priority:** P0
**Requirement:**
The custom FHIR extension `http://openelis-global.org/StructureDefinition/compliance-standard` carries the sender's compliance standard identifier:

```json
{
  "url": "http://openelis-global.org/StructureDefinition/compliance-standard",
  "valueIdentifier": {
    "system": "http://openelis-global.org/standards",
    "value": "PP-22-2021",
    "version": "2021-01"
  }
}
```

The receiver SHALL look up the standard by `system` + `value` + (optional) `version` against its local Active standards. Match found → branch = REGULATION_DRIVEN, standard pre-populated. No match (or extension missing) → branch = AD_HOC.

### 14.3 Branch Resolution Rules

**ID:** ENV-14-003
**Priority:** P0
**Requirement:**
On receipt of a FHIR referral, the receiver SHALL resolve branch as follows:

1. If `ServiceRequest.extension[complianceStandard]` is present AND resolves to a local Active standard → branch = **REGULATION_DRIVEN**, standard pre-populated.
2. Otherwise → branch = **AD_HOC**. If `ServiceRequest.reasonCode.text` is present, copy to `order.regulatoryReferenceAdhoc` so the audit trail preserves the sender's regulatory context.
3. If `Specimen.parent[]` is present in any Specimen → enable Pool/Aliquot sub-section (ENV-1-011); generate local aliquot LABNOs `{LABNO}.X-Y`.
4. Reception may override the auto-set branch on Step 1; the `referralSource` and `referralFhirTaskId` fields persist regardless of override.

### 14.4 Resolution Trace Panel

**ID:** ENV-14-004
**Priority:** P1
**Requirement:**
A "Resolution Trace" expandable panel SHALL appear on Step 1 for referral-pre-filled orders. It shows, in plain language, what FHIR fields drove each pre-populated section. Reception uses this for triage when a pre-fill looks wrong.

**Acceptance Criteria:**

- [ ] Panel appears only for referral-pre-filled orders
- [ ] Lists each pre-populated section with a "Source: FHIR field {path}, value {value}" line
- [ ] Collapsed by default; expand on click
- [ ] Read-only

### 14.5 Acknowledgment & Status Sync

**ID:** ENV-14-005
**Priority:** P0
**Requirement:**
On successful order creation from a referral, the receiver SHALL post a `Task.status = "accepted"` update back to the sender per FHIR Task workflow. On order rejection (e.g., reception declines the referral), `Task.status = "rejected"` with `Task.statusReason` set to the rejection reason.

---

## 15. Cross-Reference & Glossary

### 15.1 Cross-Reference to v1.0 Requirements

| v2.0 Requirement | v1.0 Predecessor | Change |
|---|---|---|
| ENV-1-001 (single-page Step 1) | (new — replaces v1.0 split between Steps 1 and Sample Collection Redesign) | Restructure |
| ENV-1-002 (Domain Badge) | (new) | Add |
| ENV-1-003 (Branch Selector) | (new) | Add |
| ENV-1-004 (Sampling Site) | v1.0 ENV-5-001 | Promoted to its own requirement |
| ENV-1-005 (Compliance Standard) | v1.0 ENV-1-001, ENV-1-002 | Reg# now prominent on card; toggle scaffolding removed |
| ENV-1-006 (Suggested Tests) | v1.0 ENV-2-001, ENV-2-002 | Restructured; depends on manifest sample types |
| ENV-1-007 (Test Catalog Picker) | (new) | Ad-hoc branch only |
| ENV-1-008 (Reg Reference ad-hoc) | v1.0 ENV-4-001 | Reduced — only ad-hoc, free text, no auto-populate/lock |
| ENV-1-009 (Sample Manifest) | v1.0 ENV-2-001 | Restructured to quantity table + CSV |
| ENV-1-010 (Default Conditions) | v1.0 ENV-3-001 | Renamed "Default" to clarify per-sample override at Step 2 |
| ENV-1-011 (Pool/Aliquot) | (new) | Referral-only |
| ENV-2-001 (Per-Sample Rows) | v1.0 ENV-3-002 | Promoted; bulk-apply added |
| ENV-2-002 (Hold-Time Clock) | (new — was implicit) | Made explicit |
| ENV-3-001 (NCE Button) | (new — explicit reuse) | Add |
| ENV-3-002 (QC Quick-Add) | (new) | Add |
| ENV-3-003 (Submit Batch) | (new — explicit) | Add |
| §14 (FHIR Contract) | (new) | Add |

v1.0 ENV-7-* (dashboard extensions) and ENV-8-* (QA review extensions) are deferred to a Dashboard/QA companion spec — they apply to screens outside the order entry wizard.

### 15.2 Glossary

- **Branch** — top-level selector on Step 1: Regulation-driven or Ad-hoc.
- **Domain** — the lab unit's assigned scope: Environmental, Vector, or Clinical. Set at lab unit configuration; not user-selectable per order.
- **NCE** — Non-Conformance Event. Pre-existing OpenELIS concept; carries coded reason + reject decision.
- **Referral** — an order originating from another OpenELIS instance via inbound FHIR Task.
- **Sample Manifest** — Step 1 sample-type quantity table; defines what samples will appear as rows on Step 2.
- **QC Sample** — a Blank, Duplicate, or Control sample added at Step 3; carries `qcType` flag for downstream reporting differentiation.
- **Hold-time** — regulatory time limit between collection and analysis for a given test/sample-type combination.
- **Resolution Trace** — Step 1 panel exposing the FHIR fields that drove referral pre-population.

---

**End of v2.0 spec.**
