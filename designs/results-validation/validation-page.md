# Validation Page — Functional Requirements Specification v3.0

**Version:** 3.0
**Date:** 2026-05-30
**Status:** Draft for Review
**Jira:** OGC-291 (Validation Page), OGC-343 (Multi-Level Pipeline + Admin Config)
**Mockup:** `validation-page-v3-mockup.jsx`
**Preview:** `validation-page-v3-preview.html`
**Technology:** Java Spring Framework + Carbon React (`@carbon/react`)
**Supersedes:** `validation-page-requirements-v2.1.md`
**Companion spec:** `results-page-v3-frs.md` (parallel architecture)
**Related Modules:** Results Entry · Reference Ranges · Storage · Aliquots · NCE · Alerts Dashboard · EQA · Order Programs

---

## Lab Context

### Current State

After a bench tech finishes entering a result (Results Entry page, FRS `results-page-v3-frs.md`), the result moves into a Validation queue. A validator — usually a Supervisor, Senior Tech, or Lab Manager — opens the Validation page, sees a list of results waiting for review, examines each one against the patient demographics, normal range, QC status, and prior history, then either **releases** the result to the clinician's chart, **forwards** it to a higher validation level (when the lab is configured for multi-level validation), **rejects** it back to the tech for re-entry, or **requests a retest** if the sample needs to be redrawn. In production OpenELIS Global today, this page exists but shows limited context — validators see the test name, value, normal range, who entered it, and a brief expanded view; they often need to click out to the patient record, lab order, or instrument printout to gather enough context to confidently sign. Multi-level validation (OGC-343) adds a configurable pipeline of 0–5 sequential review levels, each gated by a role with the `result.validate` permission; the same admin page supports per-lab-unit overrides and auto-validation for results that don't need human review (e.g. all-normal results in low-risk labs).

### Pain

Validators today work without the full clinical context the tech had at entry time. They see *the number* but not the **storage location** (relevant when the validator wants to suggest a retest pulled from frozen aliquot), not the **structured critical-value notification record** (so they can't verify the tech followed CLSI GP47 read-back protocol on a panic value), not the **modification history** (so a result that was silently corrected after first save looks identical to one that was right the first time), not the **demographic-aware reference range** (so a validator reviewing a 3-month-old's hemoglobin sees the adult range and may flag a perfectly normal pediatric value as abnormal), and not the **Program Info** (so an EQA submission missing a panel code or a study order missing a visit number gets released and then has to be retracted by the program coordinator). The expanded-row layout uses a 6-tab bar — Method, Order Info, Attachments, QA/QC, History, Referral — which forces a validator to click through tabs to find context that should be visible at a glance. Critical-tier results and modifications carry no visible chain-of-custody at the validator level; the audit trail is in the database but not on screen, so the validator has to trust that what they see is what was saved. Patient-data masking has two parallel mechanisms (site-wide and role-based) that don't agree on precedence. And there's no stale-page guard — two validators reviewing the same accession can both press Save and create conflicting state.

### What Changes

The Validation page is restructured to mirror Results Entry v3: an **inline-first expanded panel** with the validate/reject/retest **action bar at the top**, then always-visible collapsible sections for Notes / Interpretation / Method & Reagents / Order Info / Program Info / Storage Location / Aliquots / Referral / Attachments — all **read-only on the validator side**, with QA/QC and History remaining as the only two tabs. A **Modification History banner** at the top of every expanded panel makes prior corrections immediately visible. A **Critical Notification Display panel** shows the CLSI GP47 record the tech captured at Results Entry — recipient, role, method, read-back text, time, escalation log — so the validator can confirm the notification loop was closed before releasing. **Demographic-aware reference ranges** display the selected range label (e.g. "Adult Female (18–65y)") next to the value, so a pediatric ranges issue is impossible to miss. The action bar is **e-signature-gated** when the action releases the result to the clinician (final level), so every release of a clinical-grade result has a Part 11 / ISO 15189 §7.5.1.2 attribution. **PII visibility precedence** is harmonized with Results Entry (site-wide override > role-based mask). A **stale-page conflict guard** detects when another validator validates the same accession and surfaces a toast + reload. **Polymorphic result display** correctly renders Dictionary (D) and Multi-Checkbox (M) result types — resolving dictionary IDs to human-readable labels for the validator. The Admin Validation Configuration page (OGC-343) and multi-level pipeline are preserved as-is from v2.1, now linked to the new structured panel.

---

## User Stories

1. **As a routine validator**, I want to see the result, the demographic-aware reference range, the prior value, who entered it, when, and any modification history — all in one expanded view — so I can sign or reject without clicking through tabs or navigating away.
2. **As a supervisor validator on a critical result**, I want to see the critical flag prominently and any notes the tech captured about physician notification, so I can confirm acknowledgment evidence before releasing.
3. **As a Level 2 validator on a multi-level result**, I want to see which Level 1 validator already signed off, when, and on what role basis, so I know the result has passed the lower review and I'm acting as the final gate.
4. **As a validator reviewing a modified result**, I want the original value and modification reason visible at the top of the panel, so I can verify the correction was legitimate before releasing.
5. **As a lab manager**, I want to configure validation levels per-lab-unit, restrict each level to a specific role, and enable auto-validation for normal results in low-risk units, so my staff spends review time only where it's needed.
6. **As a validator with limited PatientResults permission**, I want patient identifiers masked unless site policy explicitly shows them, so I don't see PHI I'm not entitled to.

---

## Navigation & URL

| Item | Value |
|---|---|
| **Route** | `/Validation` (canonical; replaces `/RoutineValidation`, `/TechnicalValidation`, `/SupervisorValidation` legacy routes) |
| **Workplan deep-link** | `/Validation?source=WorkPlanByTest` (or `ByPanel` / `ByTestSection` / `ByPriority`) adds a "Workplan" link to the breadcrumb |
| **Deep-link params** | `?labUnit=`, `?status=`, `?level=`, `?accession=`, `?from=`, `?to=` |
| **Admin config page route** | `/admin/validation-configuration` (separate, OGC-343 scope) |
| **SideNav** | `Validation` (top-level) |
| **Breadcrumb** | `Home / Validation` (or `Home / Workplan / Validation` when `?source=WorkPlan*`) |
| **i18n** | `nav.validation`, `nav.workplan`, `breadcrumb.home` |

---

## Overview

Restructured Validation page mirrors the Results Entry v3 expanded-panel architecture: action bar at top, always-visible inline sections in priority order, only QA/QC + History as tabs. All result-context sections are **read-only** on the validator side — the validator's role is review-and-decide, not author. Adds visible Modification History, Critical Notification Display, Demographic-aware Range Tag, polymorphic Dictionary/Multi-Checkbox display, e-signature on release, stale-page guard, and PII precedence parity with Results Entry. The multi-level pipeline (OGC-343) and Admin Validation Configuration page are preserved unchanged from v2.1.

### Design Goals

1. **Parity with Results Entry v3** — Validator sees the same expanded-panel structure the tech used; everything is read-only except Notes (validators add validation notes) and the action bar.
2. **Critical context visible at a glance** — Modification History banner and a light Critical Value awareness banner sit at the top of the expanded panel; the validator's evidence for clinician acknowledgment comes from existing notes and the critical flag (no fabricated GP47 record).
3. **Demographic-aware ranges** — Selected reference range label visible next to value (e.g. "Range: Pediatric Female (1–5y)").
4. **No tabs for primary context** — Notes / Interpretation / Method / Order Info / Program Info / Storage / Aliquots / Referral / Attachments are always-visible (collapsible) sections; only QA/QC + History remain tabs.
5. **E-signature on release** — Final-level validation that releases the result to the clinician requires e-sig (Part 11 §11.50).
6. **Stale-page conflict detection** — Two-validator collision surfaces a toast + reload, never silent data loss.
7. **Multi-level pipeline preserved** — OGC-343 admin config, auto-validation, per-unit overrides, role-based queue filtering all unchanged.

---

## Start State / Page Load

When a validator arrives at `/Validation`, the page shows the search toolbar + filter chips + an initial query that defaults to "results awaiting your validation" — filtered to the validator's role and current pending level. Empty state shows a friendly "Nothing in your queue right now" message. URL deep-link params pre-populate filters. Workplan deep-links add the breadcrumb crumb.

---

## Search & Filters

- **Search bar** — Parses accession, patient ID, patient name, test name. Smart parsing hint below input.
- **Lab Unit selector** — Required (matches validator's assigned units).
- **Date From / Date To** — Default last 7 days.
- **Status filter chips** — Default "Awaiting Validation"; chips: All / Awaiting Validation / Released / Cancelled.
- **Level filter** — When multi-level config is active, chips for each level the validator can act on (e.g. "Level 1 (8)", "Level 2 (3)").
- **STAT filter chip** — Auto-prioritizes STAT results to top of list when toggled.
- **"Show auto-validated"** toggle — Reveals auto-validated results (read-only, audit view) per OGC-343.
- **Advanced filters panel** — Accession range, Tests/Panels multi-select, Patient ID, Has NCE filter.
- **Server-side pagination indicator** (top) — `Server page X / Y` + prev/next, separate from client Carbon Pagination (bottom).
- **Active filters** displayed as removable chips with count.

---

## Results Table

### Columns (left to right)

| Column | Width | Content |
|---|---|---|
| Select | 40px | Carbon Checkbox |
| Expand | 40px | Chevron |
| **Sample / Patient** | 240px | Patient avatar + accession + copy button + nonconforming icon + (name OR ID·sex·age OR masked per PII precedence) + EQA priority badge |
| **Sex** | 60px | M / F / U (single letter) |
| **Age (D-M-Y)** | 100px | `XD-YM-ZY` calculated at sample collection date |
| **Test** | 180px | Test name + LOINC code (when configured) |
| **Analyzer** | 120px | Analyzer name or "MANUAL" |
| **Result** | 140px | **Polymorphic by `resultType`:** value (N) with range tier coloring / dictionary label (D) / labels CSV (M) — all read-only |
| **Current Result** | 110px | Prior value (read-only); for D/M, dictionary IDs resolved to labels |
| **Range** | 120px | Reference range + unit + Range Tag (demographic-selected) |
| **Status** | 100px | Carbon Tag |
| **Flags** | 120px | H · L · Δ · C · ! · NCE · Modified — additive |
| **Validation** | 110px | "Validation X/Y" tag (conditional on multi-level config); checkmark for completed levels; teal at final |
| **Save** | 40px | Inline Carbon Checkbox to include row in batch Validate |

### Patient Privacy — Three Layers (Mirrors Results Entry BR-026)

| Layer | Setting | Behavior when ON |
|---|---|---|
| 1. Site-wide override | `results.entry.showPatientName` (default OFF) | Show full patient name in every row |
| 2. Role-based mask | `PATIENT_DATA_ON_RESULTS_BY_ROLE` + current user's `PatientResults` permission | Mask patient line to `— — —` when config ON + user lacks perm |
| 3. Default | both OFF / user has perm | Show ID + sex + age (no name) |

**Precedence:** Layer 1 > Layer 2. Same as Results Entry.

### Nonconforming legend

Always-visible strip above the table: `⚠ = Sample or Order is nonconforming or Test has been rejected` (matches Results Entry pattern).

### Batch action bar (above table)

| Element | Behavior |
|---|---|
| Save All Normal | Select all rows where `isNormal=true` AND `isNonconforming=false` |
| Save All Results | Select all rows where `isNonconforming=false` |
| **Save (E-Sign) — context-aware label** | When ≥1 selected: dynamic label per BR-009. Triggers batch e-sig modal. |
| Reject Selected | Sends selected rows back to Pending; reason note required |
| Request Retest | Marks selected for retest; creates retest order; pipeline restarts at Level 1 |

---

## Expanded Panel — Always-Visible Sections + 2 Tabs (mirrors Results Entry v3 H1/H2)

### Section Order (top to bottom)

1. **Patient Banner** — Avatar + full name + IDs + DOB + sex + age (D-M-Y) + clinician + dept + priority Tag
2. **Program Banner** (conditional — EQA / RETROCI study with priority badge)
3. **Modification History Banner** (conditional — when `result.modificationHistory[]` has entries)
4. **Critical Value Awareness Banner** (conditional — when result is in critical tier)
5. **═══ PRIMARY ACTION BLOCK ═══**
6. **Action Bar** — `Validate at Level N` / `Validate & Release` / `Reject + Reason` / `Request Retest` / `Forward to Level N+1` — context-aware labels per BR-V3-001
7. **Conditional banners** — Invalid range warning / Critical-value tier acknowledgment confirmation / Stale-page conflict
8. **═══ SECONDARY CONTEXT BLOCK ═══**
9. **Notes** (validators ADD validation notes; tech notes are read-only) — H2 default open when notes exist
10. **Interpretation** (read-only display) — H2 default open when interpretation exists
11. **Method & Reagents** (read-only display — Method, Analyzer, Reagent Lot + Expiry) — H2 default open when reagent lot present
12. **Order Info** (read-only) — H2 default closed
13. **Program Info** (read-only — up to 15 program-captured fields) — H2 default open when shown
14. **Storage Location** (read-only — path + position + condition; no Move action on validator side) — H2 default open when assigned (so validator sees chain-of-custody)
15. **Aliquots** (read-only display of derived aliquots with status; validator cannot create) — H2 default open when aliquots exist
16. **Referral** (read-only) — H2 default open when referred
17. **Attachments** (read-only view; validator cannot add or delete) — H2 default open when attachments exist
18. **Tabs:** QA/QC · History

### Critical Value Awareness Banner — REVISED

**Important scope clarification:** OpenELIS Global today does NOT track a structured CLSI GP47 read-back / recipient / escalation record at the validation level. Earlier v3 drafts described a "Critical Notification Display" panel that read a `criticalNotificationRecord` and offered a "Log Notification Now" backfill flow — that was fabricated; the underlying data does not exist in the current data model. This section has been revised to reflect what actually ships.

**What's actually shown on Validation:** When the result is in the critical tier, a light awareness banner appears at the top of the expanded panel (between Modification History and the Action Bar). The banner is a reminder, not an interactive surface:

```
⚠ Critical value — Confirm clinician acknowledgment via the existing notes / critical-flag audit before releasing.
```

That's it. No fabricated recipient/method/read-back fields. The validator's evidence for clinician acknowledgment comes from the **existing** mechanisms:
- The H / L / Δ / C / ! flag badges that already exist in OpenELIS today
- Notes (any visibility) authored by the tech indicating clinician was notified
- The audit_trail entries already produced by the current Critical Acknowledgment system (if implemented per Results Entry v3 BR-016, which IS a documented new schema addition on that side)

**Future-state link:** Results Entry v3 BR-033 proposes a NEW `critical_notification` table to capture structured CLSI GP47 records. That spec explicitly flags it as new schema. **IF and WHEN** that work lands, a follow-up spec can add a read-only display of the GP47 record here. Until then, this Validation spec does not depend on it and does not block Validate based on its presence.

**Validate is NOT gated on critical notification status.** The validator releases or holds based on their professional judgment, supported by the existing flag/notes/audit evidence — same as today.

### Modification History Banner

Identical to Results Entry: shows `original → current` with actor, timestamp, reason. Multi-modification chain expandable. Read-only.

### Polymorphic Result Display

| Type | Display |
|---|---|
| **N** numeric | Value as monospace text + range tier coloring (yellow/orange/red) + Demographic Range Tag |
| **D** dictionary single | Resolved label (not ID): "Reactive" rather than "HIV_R" |
| **M** dictionary multi | Comma-joined labels: "Giardia lamblia, Entamoeba histolytica" rather than "OVA_GL,OVA_EH" |
| **C** cascading | Parent → child(ren) display (out of scope for v3.0 implementation; documented for future) |
| **R / A** | Text as entered |

All read-only on validator. To change a value, validator rejects the row back to the tech with a reason note (S-03 decision: read-only with reject-for-re-entry; cleaner audit trail than inline editing).

### Demographic-Aware Reference Range Display

Mirrors Results Entry §Demographic-Aware Reference Ranges (BR-036). Validator sees the same Range Tag the tech saw, e.g. `Range: Pediatric Female (1–5y)`. Hovering the Tag reveals a Popover showing why this range was selected (matching criteria) and listing other configured ranges for the test. When no range matches the patient demographics, the warning Tag `⚠ No reference range for this demographic — using default` is shown, and the validator should review extra carefully or reject.

### Aliquots Display

Read-only table listing aliquots derived from this sample (LABNO.X-Y suffix, purpose, linked test, status, storage). Validator cannot create or destroy aliquots. Visible to validator for chain-of-custody — useful when a result is referred or retested using a known-good aliquot.

### Storage Display

Read-only. Path + position + condition. No Assign/Move buttons. If `result.storage.path` is null, displays `Unassigned`. Validators rarely care about storage during routine validation, but for referrals and retests it's relevant to know where the source sample is. H2 default: open when assigned.

### Critical Acknowledgment Ownership — S-01 Decision

**Policy A (revised):** OpenELIS today does not store a structured CLSI GP47 read-back record. The validator's evidence that the responsible clinician was acknowledged comes from the existing notes (tech-authored, especially "Send with Result" notes) and the critical-flag audit history. The Validation page does NOT block release on a missing "notification record" — that gating concept belongs to Results Entry if/when the new `critical_notification` table proposed in Results Entry v3 BR-033 ships. Until then, the Validation page surfaces a light awareness banner and trusts the validator's professional judgment supported by the existing audit evidence.

### Multi-Level Validation × Disposition — S-02 Decision

When the validator chooses Disposition = Cancel / Reject / Retest / Refer-out via the inline NCE form, behavior depends on the validation level:

| Validator action | Status mapping |
|---|---|
| **Validate** at intermediate level (level N < total) | Advances to level N+1; result stays in validation chain |
| **Validate** at final level (level N == total) | Releases to clinician (with e-sig); leaves validation chain |
| **Reject (no NCE)** | Returns to Pending; tech must re-enter; pipeline restarts at level 1 when retest result lands |
| **NCE Disposition = Cancel** | Result cancelled immediately; leaves validation chain; NCE record retained |
| **NCE Disposition = Reject + reason** | Result deleted (per BR-024); NCE retained; leaves validation chain |
| **NCE Disposition = Retest** | Status returns to Pending; retest order auto-created; pipeline restarts at level 1 when retest result lands |
| **NCE Disposition = Refer-out** | Status moves to "Referred — awaiting external"; leaves validation chain; re-enters at level 1 when external result lands |

---

## Multi-Level Validation Pipeline (preserved from OGC-343)

Unchanged from v2.1 § Multi-Level Validation:
- 0–5 sequential validation levels
- Each level gated by a role with `result.validate` permission
- Config snapshot onto result at entry time (changing config does not retroactively affect in-flight results)
- User who entered the result cannot validate at any level
- Same user can validate at multiple levels (no separation-of-duties requirement enforced; can be added via custom rule)
- Context-aware action button labels (single-level vs intermediate vs final)
- Role-based queue filtering
- Validation progress timeline in expanded row

## Auto-Validation (preserved from OGC-343)

Unchanged from v2.1: Results auto-validate when `validations_required = 0`, trigger = "No Results", or (trigger = "Abnormal Only" AND result is normal). System-generated `validation_history` entry with `validatedBy=SYSTEM`, `action=AUTO_VALIDATE`.

## Admin Validation Configuration (preserved from OGC-343)

Unchanged from v2.1 § Admin Configuration. Lives at `/admin/validation-configuration`. Lab-wide default + per-lab-unit overrides + permission-filtered role dropdowns + Summary Banner.

---

## E-Signature on Release — NEW (Part 11 §11.50 / §11.70 / §11.100 / §11.200)

When the validator's action releases the result to the clinician's chart (final-level validation OR single-level validation), the Save button triggers an e-sig modal:

| Field | Source |
|---|---|
| Title | "E-Signature Required — Result Release" |
| Body | "You are about to release N result(s) for accession X. Per lab policy, validations that release results to clinicians must be e-signed (Part 11 §11.50, ISO 15189 §7.5.1.2)." |
| Meaning | `APPROVED` |
| Record type | `RESULT_VALIDATION` (distinct from `RESULT_BATCH` used at Results Entry) |
| Record id | First analysis_id in batch |
| Password | required PasswordInput |
| Cancel | Returns to Validation page without releasing |
| Sign & Release | POSTs to `/api/v1/validation/validate` with `eSignature` envelope |

**When NOT required:** Intermediate-level validation that advances to the next level (not yet released). Reject and Retest actions also don't require e-sig (they don't release to clinician). The e-sig is *specifically* gated on releasing to the clinical chart.

**Configurable:** Site flag `validation.requireESigOnRelease` (default ON for ISO-accredited deployments; OFF for upgrades). Same precedent as `requireReagentLotsForResults` at Results Entry.

---

## Stale-Page Conflict Guard — NEW (mirrors Results Entry BR-030)

When the backend detects another validator validated any row in the validator's current batch between page load and the validate attempt, the response marks conflicting rows as `failedValidation=true` and the frontend displays a warning toast + reloads the queue. Audit: `STALE_PAGE_CONFLICT_VALIDATION` row written for each affected accession.

---

## Cross-Domain Support — CLINICAL / ENVIRONMENTAL / VECTOR

OpenELIS supports three sample domains (`CLINICAL`, `ENVIRONMENTAL`, `VECTOR` — per the domain enum, no `BOTH`). The same Validation page (`/Validation`) flexes across all three. **No separate validation pages, no parallel routes.**

### Lab Unit drives domain context

Validators arrive at the Validation page from a Lab Unit selection. Each Lab Unit carries a `domain` attribute, and the page derives `currentDomain` from that selection. Lab Unit is already required to load the validation queue, so the domain context is implicit.

### Domain badge in toolbar

Next to the Lab Unit selector, a small **Domain badge** displays the active domain (`Clinical` / `Environmental` / `Vector`) so the validator always knows the context they're reviewing.

### What changes per domain on the Validation page

| Surface | CLINICAL | ENVIRONMENTAL | VECTOR |
|---|---|---|---|
| **Patient Banner** (expanded panel) | Full patient details | **Site/Source block** | **Trap block** |
| **Sex column** in table | ✓ shown | hidden | hidden |
| **Age (D-M-Y) column** in table | ✓ shown | hidden | hidden |
| **Sample / Patient column** | Patient avatar + name + ID | Site name + sample source | Trap ID + species |
| **PII masking config** | applies (site-wide + role-based per BR-V3-012) | n/a | n/a |
| **Order Info section labels** | clinical labels | env labels (Collector / Site Authority / Sampling Date / Sample Source / Site Conditions) | vector labels (Field Collector / Surveillance Program / Trap Set Date / Trap Type / Habitat) |
| **Program Info section** | EQA / RETROCI / Clinical Studies | Surveillance Program (utility ID, monitoring schedule) | IRM / Surveillance Cycle / Vector Program ID |
| **Demographic-aware Range Tag** | "Adult Female (18–65y)", "Pediatric Male (1–5y)" | replaced with **"Regulatory Limit"** Tag (e.g. "EPA MCL 0.3 mg/L") | replaced with **"Surveillance Threshold"** Tag or hidden when result is categorical |
| **Critical-value awareness banner copy** | "Confirm clinician acknowledgment…" | "Confirm regulatory contact acknowledgment…" | "Confirm surveillance team acknowledgment…" |
| **Pool composition block** (Aliquots section) | hidden | hidden | ✓ shown when sample is a pool — primary use case for vector pool deconvolution |
| **Multi-level validation pipeline** | applies | applies | applies — pipeline configuration is per Lab Unit |
| **Auto-validation** | applies | applies | applies |
| **Reject for re-entry** (S-03) | applies | applies | applies |
| **Validate / Retest / Reject actions** | applies | applies | applies |
| **E-Signature on Release** | applies (Part 11) | applies (regulatory submission) | applies |
| **Stale-page conflict guard** | applies | applies | applies |
| **Modification History banner** | applies | applies | applies |

### Validator-relevant notes per domain

- **CLINICAL:** Validator is releasing the result to a clinician's chart. "Send with Result" means it reaches the clinician report.
- **ENVIRONMENTAL:** Validator is releasing the result to a regulatory record / utility report. "Send with Result" means it flows into the regulatory submission. The result might also feed a public-health surveillance dashboard.
- **VECTOR:** Validator is releasing the result to a surveillance feed (IRM database, malaria surveillance, etc.). "Send with Result" means it joins the surveillance dataset. Pool deconvolution often triggers follow-up individual-mosquito tests; that workflow surfaces via the Aliquots section's read-only display.

### i18n key conventions for domain-aware labels

Domain-namespaced keys with a fallback to clinical defaults:

```
label.validation.banner.recipient.clinical       # "Confirm clinician acknowledgment"
label.validation.banner.recipient.env            # "Confirm regulatory contact acknowledgment"
label.validation.banner.recipient.vector         # "Confirm surveillance team acknowledgment"
```

### Components hidden / shown by domain on Validation

| Component | CLINICAL | ENVIRONMENTAL | VECTOR |
|---|---|---|---|
| PatientBanner | ✓ | hidden — SiteBanner replaces | hidden — TrapBanner replaces |
| SiteBanner | hidden | ✓ | hidden |
| TrapBanner | hidden | hidden | ✓ |
| Sex column | ✓ | hidden | hidden |
| Age (D-M-Y) column | ✓ | hidden | hidden |
| PII masking toggles in toolbar | ✓ | hidden | hidden |
| Demographic Range Tag | ✓ | replaced with Regulatory Limit Tag | replaced or hidden |
| Pool composition (Aliquots section) | hidden | hidden | ✓ when pool |
| Domain badge in toolbar | ✓ "Clinical" | ✓ "Environmental" | ✓ "Vector" |

### Acceptance criteria — cross-domain on Validation

- [ ] Lab Unit options expose a `domain` attribute
- [ ] On Lab Unit selection, `currentDomain` is derived and the page renders accordingly
- [ ] Domain badge displays next to the Lab Unit selector
- [ ] CLINICAL: full PatientBanner, Sex + Age columns visible, PII masking config applies, demographic range Tag shown
- [ ] ENVIRONMENTAL: SiteBanner replaces PatientBanner; Sex/Age columns hidden; PII config hidden; Regulatory Limit Tag replaces demographic Tag
- [ ] VECTOR: TrapBanner replaces PatientBanner; Sex/Age columns hidden; pool composition surfaced when applicable; demographic Tag hidden
- [ ] Order Info labels swap per domain via i18n key suffix
- [ ] Critical-value awareness banner recipient phrasing adapts per domain
- [ ] No domain selector at the result level — domain is fixed per Lab Unit
- [ ] Multi-level pipeline + auto-validation + reject/retest + e-sig on release behave identically across domains

---

## Carbon Implementation Notes

This mockup uses Tailwind utility classes + raw HTML for portable preview. Production implementation MUST use `@carbon/react` per the Component Map below. Patterns the Tailwind mockup does NOT demonstrate that MUST be used in production: Carbon `Tabs` / `Modal` (e-sig) / `FileUploader` / `ToastNotification` / `Accordion` / `DataTable` / `NumberInput` / `Select` / `MultiSelect` / `TextArea`.

## Carbon Component Map

| UI Element | `@carbon/react` Component |
|---|---|
| Page table | `DataTable` + `TableExpandRow` + `TableExpandedRow` + `TableSelectAll` + `TableSelectRow` |
| Search input | `Search` |
| Lab Unit, Status, Level filters | `Select` + `SelectItem` (or `Dropdown` for searchable) |
| Status filter chips | `Tag` with `filter={true}` |
| Patient avatar | Custom (Carbon has no Avatar) — initials in color-hashed circle |
| Status badge | `Tag` w/ `type` prop |
| Flag badges | `Tag` (compact) or `<span>` |
| Result display (read-only) | `<span>` with conditional class for range tier |
| Range Tag (demographic) | `Tag kind="purple"` + Popover for criteria |
| Validation Level Tag | `Tag kind="warm-gray"` (intermediate) or `kind="teal"` (final) + Popover tooltip |
| Action bar buttons | `Button kind="primary\|secondary\|danger\|danger--ghost\|tertiary"` |
| E-Signature Modal | `Modal` + `PasswordInput` + `ModalFooter` |
| Modification History banner | `Tile` w/ amber theme + expandable detail |
| Critical Value awareness banner | `InlineNotification kind="warning"` (low) — informational only |
| Notes section | `StructuredList` or custom; new note via `TextArea` + `Button` |
| Inline NCE form (for validator-initiated NCE) | `Form` + `Select` (severity radios + disposition radios) |
| Toast | `ToastNotification` |
| Pagination | `Pagination` (bottom) + custom server-pagination indicator (top) |
| Nonconforming legend | `InlineNotification kind="warning"` (low-severity) |
| Accordion (collapsible sections) | `Accordion` + `AccordionItem` |
| Tabs (QA/QC + History) | `Tabs` + `Tab` + `TabList` + `TabPanels` + `TabPanel` |

---

## Responsive Design — Breakpoints (mirrors Results Entry Q1)

| Viewport | Layout |
|---|---|
| **≥1440px** | Full table + 3-col grids in expanded sections |
| **1024–1439px** | Full table; sections wrap to 2-col grids |
| **768–1023px** | Hide Sex / Age / Analyzer / Current Result columns (accessible via Columns overflow menu); single-column section grids |
| **<768px** | Card-row layout (each row = vertical card); expanded panel sections stack single-column; action bar sticks to card bottom. *v3.0 mockup demonstrates table layout; card layout deferred to a polish spec.* |

**Touch targets:** WCAG 2.5.5 (24×24 min, 44×44 for primary actions: Validate & Release, Reject, Retest, expand chevrons).

---

## Data Model

### Modified Entities

| Entity | Field | Notes |
|---|---|---|
| `Result` | `modificationHistory[]` (derived from audit_trail) | Surfaced in Validation banner |
| `Result` | `referenceRange` (selected at expansion) | Already in Results Entry v3 |

### New Audit Events

| Action | `audit_trail.action` | Target | Payload |
|---|---|---|---|
| Validate result (intermediate) | `RESULT_VALIDATED_INTERMEDIATE` | `analysis_id` | `{ level, role }` |
| Validate result (release) | `RESULT_RELEASED` | `analysis_id` | `{ level, role, esignaturePresent }` |
| Reject result | `RESULT_REJECTED` | `analysis_id` | `{ reason, byLevel }` |
| Request retest | `RESULT_RETEST_REQUESTED` | `analysis_id` | `{ reason, retestAnalysisId }` |
| Add validation note | `VALIDATION_NOTE_ADDED` | `analysis_id` | `{ bodyLength }` |
| Stale-page conflict (validation) | `STALE_PAGE_CONFLICT_VALIDATION` | `analysis_id` | `{ conflictingValidator, conflictingAt }` |

### Envers Coverage

`Result`, `ValidationHistory`, `NonConformityEvent`, `CriticalNotification` all `@Audited` (matches Results Entry).

---

## API Endpoints

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/api/v1/validation/results` | `result.validate` | List with all v3 fields (modificationHistory, referenceRange.label, polymorphic resultType, storage, aliquots, programFields) |
| POST | `/api/v1/validation/validate` | `result.validate` | Validate batch; releases at final level (e-sig payload required when releasing); advances at intermediate |
| POST | `/api/v1/validation/reject` | `result.validate` | Reject batch; reason required |
| POST | `/api/v1/validation/retest` | `result.validate` | Request retest; reason required |
| POST | `/api/v1/validation/results/{id}/notes` | `result.validate` | Add validation note |

All endpoints honor the multi-level pipeline rules per OGC-343 (queue filtering by role + level, separation of entry-author and validator, etc.).

---

## Business Rules

(Inherits all v2.1 rules BR-001 through BR-019 from OGC-291/OGC-343 unchanged. The following v3 rules are added.)

**BR-V3-001 — Context-aware action button label:** The primary Validate button label adapts to the row state. Single-level config or final level → "Validate & Release". Intermediate level → "Validate (Lv N/M)". Batch with mixed levels → "Validate Selected (N) — X will release, Y will advance" (mirrors v2.1 BR-009).

**BR-V3-002 — E-Signature on Release (Part 11):** Validations that release results to the clinical chart MUST be e-signed (meaning=APPROVED, recordType=RESULT_VALIDATION). Intermediate-level validations that advance to the next level are NOT e-sig gated. Reject and Retest actions are NOT e-sig gated. Site flag `validation.requireESigOnRelease` controls this gate (default ON).

**BR-V3-003 — Critical Value Awareness Banner (revised):** When the result is in the critical range tier, a light awareness banner renders at the top of the expanded panel reminding the validator to confirm clinician acknowledgment via the existing notes / critical-flag audit. The banner is informational only — it does NOT gate the Validate action, does NOT display any fabricated CLSI GP47 record, and does NOT offer a backfill flow. OpenELIS today does not track structured GP47 notification metadata at the validation level; if Results Entry v3 BR-033 lands and creates a `critical_notification` table, a follow-up spec can add read-only display of that record here.

**BR-V3-004 — Polymorphic Result Display:** D-type and M-type results MUST resolve dictionary IDs to human-readable labels in the table cell, expanded panel, and history view. The raw ID is never surfaced to the validator.

**BR-V3-005 — Demographic-Aware Range Display:** The selected `referenceRange.label` MUST appear next to the displayed range in both the table row and the expanded panel. A Popover on the Tag shows selection criteria and other configured ranges for the test. When no range matches, the warning Tag is shown.

**BR-V3-006 — Read-Only Sections:** Method & Reagents, Order Info, Program Info, Storage, Aliquots, Referral, and Attachments sections are read-only on the Validation page. To modify any of these, the validator MUST reject the result back to the tech with a reason note. This enforces a clean audit trail — only the tech (or admin tools) modify result-context data.

**BR-V3-007 — Validation Notes:** Notes section on the Validation page allows ADDING notes (type = `validation`). Existing notes from Results Entry are read-only. Validation notes are persisted immediately upon save (independent of the validate action).

**BR-V3-008 — Stale-Page Conflict Guard:** Backend detects when another validator has acted on any row in the current page batch between page load and validate attempt. Conflicting rows are marked `failedValidation=true` and the frontend reloads the queue with a warning toast.

**BR-V3-009 — Critical Acknowledgment Ownership (revised):** OpenELIS today does not track a structured GP47 read-back record at the validation level. The validator confirms clinician acknowledgment via the existing notes + critical-flag audit evidence. If Results Entry v3 BR-033 ships and creates a `critical_notification` table, a follow-up spec can wire a read-only display here. The Validation page does NOT block Validate on critical-notification status; that is a Results-Entry-side gating concern only.

**BR-V3-010 — Disposition × Multi-Level (S-02):** Per the table in §Multi-Level Validation × Disposition. Cancel / Reject delete from validation chain; Retest restarts at level 1 when retest result lands; Refer-out moves to "Referred — awaiting external" lane.

**BR-V3-011 — Validator Editability of D/M (S-03):** Validators MAY NOT edit Dictionary (D) or Multi-Checkbox (M) result values inline. To change the value, the validator must reject the row back to the tech for re-entry. This decision optimizes for audit-trail cleanliness over workflow speed.

**BR-V3-012 — PII Visibility Precedence:** Mirrors Results Entry BR-026 exactly. Site-wide `results.entry.showPatientName` overrides role-based `PATIENT_DATA_ON_RESULTS_BY_ROLE` mask.

**BR-V3-013 — Workplan Deep-Link Breadcrumb:** Mirrors Results Entry BR-022. When `?source=WorkPlan*` is in the URL, breadcrumb includes "Workplan" crumb.

**BR-V3-014 — Action Bar at Top (Usability H1 parity):** Action bar (Validate / Reject / Retest / Forward) is at the top of the expanded panel, immediately below conditional banners. Always-visible inline context sections live below the action bar.

**BR-V3-016 — Note Model: Visibility × Context (dual axis):** Every note on a result carries two independent attributes:

| Axis | Values | Meaning |
|---|---|---|
| **`note.visibility`** | `internal` (default) / `external` | `external` notes appear on the patient / clinician report. `internal` notes are in-lab-only. |
| **`note.context`** | `entry` / `modification` / `validation` | Workflow stage when the note was authored. Drives display badge but does NOT determine visibility. |

The two axes are independent: a Validation-context note can be either In Lab Only OR Send with Result, at the validator's discretion. The "Add Note" form on the Validation page MUST present a visibility radio (default `internal`) so the validator explicitly chooses whether the note flows to the patient report. The display MUST show both badges (context + visibility) so consumers can scan whether a note is going out to the clinician.

**External notes audit:** When a note's `visibility` is `external`, the audit trail entry MUST include `visibility: "external"` in the payload — this surfaces in compliance audits as a signal that lab-authored content reached the patient record. Changing visibility on an existing note is treated as a state change and produces a separate audit entry.

**Patient report rendering:** Downstream patient/clinician report generation (out of scope for this spec) filters by `visibility === "external"`. Tech-authored entry-context notes with `visibility=external` appear alongside validator-authored validation-context notes with `visibility=external`; the report does not distinguish by context, only by visibility.

**Migration:** Legacy `note.type` field aliases:
- `note.type === "internal"` → `{ visibility: "internal", context: "entry" }` (or the relevant context)
- `note.type === "external"` → `{ visibility: "external", context: "entry" }`
- `note.type === "validation"` → `{ visibility: "internal", context: "validation" }` (default visibility on legacy validation notes is internal; can be edited by the validator)
- `note.type === "modification"` → `{ visibility: "internal", context: "modification" }`

**BR-V3-015 — Smart Default-Open (Usability H2 parity):** Each inline section computes its initial open state from row context. Notes open when notes exist. Interpretation open when interpretation exists. Method & Reagents open when reagent lot information is present. Order Info closed by default. Program Info open when shown. Storage open when assigned (validator-side default differs from Results Entry which opens when Unassigned — because validators benefit from seeing chain-of-custody confirmation). Aliquots open when aliquots exist. Referral open when referred. Attachments open when files exist.

---

## Localization

(Inherits v2.1 keys. New v3 keys:)

| i18n Key | English |
|---|---|
| `message.validation.criticalAwareness` | Critical value — Confirm clinician acknowledgment via the existing notes / critical-flag audit before releasing. |
| `heading.validation.modification.history` | Modification History |
| `label.validation.range.demographicSelected` | Range selected by demographics |
| `warn.validation.range.fallback` | No reference range for this demographic — using default |
| `heading.validation.aliquots` | Aliquots (from this sample) |
| `heading.validation.storage` | Storage Location |
| `heading.validation.programInfo` | Program Info |
| `help.validation.readonly` | Read-only on validator — to change, reject back to tech |
| `heading.esig.release` | E-Signature Required — Result Release |
| `message.esig.release.intro` | You are about to release |
| `message.esig.release.results` | result(s) for |
| `message.esig.release.policy` | Per lab policy, validations that release results to clinicians must be e-signed (Part 11 §11.50, ISO 15189 §7.5.1.2). |
| `button.esig.signRelease` | Sign & Release |
| `warn.staleValidation` | Result has been validated by another user — refreshing the queue. |
| `column.validation.sex` | Sex |
| `column.validation.age` | Age (D-M-Y) |
| `column.validation.test` | Test |
| `column.validation.analyzer` | Analyzer |
| `column.validation.result` | Result |
| `column.validation.currentResult` | Current Result |
| `column.validation.range` | Range |
| `column.validation.status` | Status |
| `column.validation.flags` | Flags |
| `column.validation.validation` | Validation |
| `column.validation.save` | Save |
| `label.row.modifiedTag` | Modified |
| `legend.nonconforming` | Sample or Order is nonconforming or Test has been rejected |
| `placeholder.validation.search` | Search by accession, patient, or test... |
| `button.validation.batch.reject` | Reject Selected |
| `button.validation.batch.retest` | Request Retest |
| `button.validation.batch.validateRelease` | Validate & Release Selected |
| `button.validation.action.validate` | Validate |
| `button.validation.action.validateRelease` | Validate & Release |
| `button.validation.action.advance` | Validate (Lv {current}/{total}) — Advance |
| `button.validation.action.reject` | Reject |
| `button.validation.action.retest` | Request Retest |
| `button.validation.action.forward` | Forward to Level {level} |

---

## Acceptance Criteria

### Page Architecture (Usability parity)
- [ ] Expanded panel uses inline-first layout per BR-V3-014: action bar at top, sections below
- [ ] Smart default-open per BR-V3-015: each section computes initial state from row context
- [ ] Only 2 tabs (QA/QC + History); all other sections are inline collapsibles

### Critical Value Awareness
- [ ] When result is in the critical tier, light awareness banner renders at top of expanded panel **[BR-V3-003]**
- [ ] Banner is informational only — does NOT gate Validate, does NOT display GP47 record, does NOT offer backfill **[BR-V3-003]**
- [ ] Validator's evidence for clinician acknowledgment comes from existing notes + critical-flag audit; no fabricated UI **[BR-V3-003, BR-V3-009]**

### Modification History Banner
- [ ] Banner renders at top of expanded panel when `modificationHistory[]` has entries
- [ ] Shows `original → current`, actor, timestamp, reason
- [ ] Multi-modification chain expandable
- [ ] Table row shows "Modified" warm-gray Tag in Status/Flags column

### Polymorphic Result Display
- [ ] D-type cell shows dictionary label (not ID) **[BR-V3-004]**
- [ ] M-type cell shows comma-joined labels **[BR-V3-004]**
- [ ] Cells are read-only — no inline editing **[BR-V3-011]**

### Demographic-Aware Range Display
- [ ] Selected `referenceRange.label` shown as Tag next to displayed range **[BR-V3-005]**
- [ ] Popover on Tag shows selection criteria + other configured ranges
- [ ] When no range matches, warning Tag "⚠ No reference range for this demographic — using default" shown

### Read-Only Sections
- [ ] Method & Reagents, Order Info, Program Info, Storage, Aliquots, Referral, Attachments all read-only **[BR-V3-006]**
- [ ] Each section has a small "Read-only — to change, reject back to tech" help text
- [ ] No Save/Edit/Add/Delete affordances anywhere except Notes (validator can add)

### Validation Notes
- [ ] Notes section allows ADDING new notes with type=`validation` **[BR-V3-007]**
- [ ] Existing notes (entry, modification, prior validation) are read-only
- [ ] New note persists immediately via API; appears without page refresh **[BR-V3-007]**
- [ ] Note count badge updates after adding

### E-Signature on Release
- [ ] Final-level Validate action triggers e-sig modal **[BR-V3-002]**
- [ ] Modal body shows result count + accession context
- [ ] Save POST includes eSignature envelope (meaning=APPROVED, recordType=RESULT_VALIDATION) **[BR-V3-002]**
- [ ] Intermediate-level Validate, Reject, and Retest actions do NOT require e-sig **[BR-V3-002]**
- [ ] Site flag `validation.requireESigOnRelease` controls the gate

### Stale-Page Conflict
- [ ] Backend reports conflicts; frontend shows warning toast + reloads queue **[BR-V3-008]**
- [ ] Conflicting rows marked `failedValidation=true`
- [ ] Audit: `STALE_PAGE_CONFLICT_VALIDATION` row written

### Multi-Level Disposition Mapping (S-02)
- [ ] Validate intermediate → advances to next level **[BR-V3-010]**
- [ ] Validate final → releases (with e-sig) **[BR-V3-010]**
- [ ] Reject (no NCE) → returns to Pending; pipeline restarts at level 1 **[BR-V3-010]**
- [ ] NCE Disposition=Cancel → cancelled, leaves chain **[BR-V3-010]**
- [ ] NCE Disposition=Reject → deleted, leaves chain **[BR-V3-010]**
- [ ] NCE Disposition=Retest → returns to Pending; pipeline restarts **[BR-V3-010]**
- [ ] NCE Disposition=Refer → moves to "Referred — awaiting external" lane **[BR-V3-010]**

### Demographics Columns (preserved from v2.1 Enhancement A)
- [ ] Sex column shows M/F/U
- [ ] Age (D-M-Y) column shows `XD-YM-ZY` calculated at sample collection date
- [ ] Both columns sortable; hidden behind Columns overflow menu at <1024px viewport

### Multi-Level Column (preserved from v2.1 Enhancement B)
- [ ] Validation column appears only when `levelsRequired > 1`
- [ ] Tag shows "Validation X/Y"; teal at final, blue/warm-gray at intermediate; checkmark for prior completed levels
- [ ] Popover on Tag shows full validation progress with names and timestamps

### Context-Aware Save Button (preserved from v2.1 Enhancement C)
- [ ] Save button label adapts to mix of selected results (release/advance/mixed)
- [ ] Updates immediately on checkbox toggle

### PII Visibility Precedence (matches Results Entry BR-026)
- [ ] Site-wide `showPatientName` overrides role-based mask **[BR-V3-012]**

### Workplan Deep-Link Breadcrumb
- [ ] `?source=WorkPlan*` adds "Workplan" crumb to breadcrumb **[BR-V3-013]**

### Auto-Validation (preserved from OGC-343)
- [ ] Auto-validated results toggle on; Bot icon badge; read-only

### Admin Validation Configuration (preserved from OGC-343)
- [ ] Lab-wide default + per-unit overrides + permission-filtered role dropdowns + Summary Banner unchanged

### Non-Functional
- [ ] All UI strings wrapped in `t(key, fallback)`
- [ ] Carbon Component Map respected
- [ ] Audit trail entries written per §Data Model
- [ ] WCAG 2.1 AA compliance (production using `@carbon/react`)
- [ ] French locale tested — no layout breakage

---

## Migration Notes

| v2.1 | v3.0 |
|---|---|
| 6-tab expanded panel (Method / Order / Attachments / QA/QC / History / Referral) | Inline-first with 2 tabs only (QA/QC + History); other 4 become inline sections |
| Notes + Interpretation always visible (v2.1 Enhancement E) | Notes + Interpretation always visible (preserved); also added to v3 inline-first layout |
| No Storage / Aliquots / Program Info / Modification History surfaces | All added as inline read-only sections / banners. Critical-value awareness is a light banner only — no fabricated GP47 record display until a `critical_notification` table actually ships. |
| Range tier coloring only (v2.1 Enhancement E) | Range tier coloring + Demographic Range Tag |
| Save button only — no e-sig | Save = e-sig modal when releasing (final level) |
| Validator can re-ack critical (v2.1 implied via banner) | Validator sees light awareness banner only; no fabricated GP47 record display (revised — earlier v3 drafts proposed this but the data doesn't exist today) |
| D/M result types not explicitly supported | Polymorphic display with dictionary ID → label resolution |
| Note types `internal` / `external` | Renamed to `In Lab Only` / `Send with Result` (parity with Results Entry) |

**Backward compatibility:** All v2.1 enhancements A through E remain functional. The Admin Validation Configuration page (OGC-343) is unchanged. Existing single-level labs see no change to the Validation column (still hidden). Multi-level labs see the same column with the new Popover behavior.

---

## Future Considerations

1. **Card-row responsive layout** (`<768px` breakpoint impl)
2. **Validator session-scoped e-sig token** (15-min sliding window — usability parity with Results Entry M2)
3. **Bulk Validate across pages** (currently per-page batch only)
4. **Custom Validation Worklists** (save filter combos as named queries)
5. **Real-time queue updates** (WebSocket push when new results arrive at validator's level)
6. **Cascading (C) Result Type display** (parallel to Results Entry future spec)
7. **Validator dashboard view** — across-lab-unit summary of queue depth + critical/STAT counts
8. **Audit Replay view** — full chain of custody for a single result from order to release, on a single screen
