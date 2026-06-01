# Results Entry — Functional Requirements Specification v3.0

**Version:** 3.0
**Date:** 2026-05-28
**Status:** Draft for Review
**Jira:** [TBD — `/breakdown` will create Epic + child stories]
**Mockup:** `results-page-v3-mockup.jsx`
**Preview:** `results-page-v3-preview.html`
**Technology:** Java Spring Framework + Carbon React (`@carbon/react`)
**Replaces:** `results-page-requirements-v2.1.md`
**Related Modules:** Test Catalog · Order Entry · Validation · Reagent Inventory · Storage Tracking · EQA · Non-Conformity (NCE) · Alerts Dashboard · Critical Result Acknowledgment

---

## Lab Context

### Current State

Bench technicians (techs) enter results all day from a handful of routes that look the same but search differently. In production OpenELIS Global, six URLs (`/LogbookResults`, `/PatientResults`, `/AccessionResults`, `/StatusResults`, `/RangeResults`, `/result`) all render the same React component (`SearchResultForm`) — only the search filter at the top changes. After picking a Test Unit (Hematology, Chemistry, etc.) the tech sees a table of pending samples and enters values for each one. Values can be numeric (Hemoglobin g/dL), single-choice from a dictionary (HIV Rapid: Non-Reactive / Reactive / Indeterminate / Invalid), multi-choice (stool ova & parasites — multiple organisms per slide), or free text. The tech also documents method (Manual, Automated, Point-of-Care), which analyzer fed the value, reagent lot numbers, attachments (printouts, requisitions), notes for the validator, and — increasingly — where the sample is now stored (Freezer A → Rack 2 → Box 7). If something is wrong with the sample, the tech files a Non-Conformity Event (NCE) describing what happened and what to do with the result (cancel it, reject it, retest, refer to another lab). At the end, a single Save button at the bottom commits the batch; that Save is wrapped in an e-signature flow that requires the tech to re-type their password, because the act of authoring a result is regulated.

### Pain

Six routes that share a single component create a maintenance burden but don't help the tech: they choose the URL from a sidenav with five sub-items they have to memorize. The expanded-row editor mixes always-needed actions (Method, Storage, Refer) with rarely-needed ones (Attachments, QA/QC history) on the same plane, so techs scroll past important fields to find what they want. Storage location lives in a hierarchical picker that's hard to discover — many samples sit unassigned because nobody knows where to click. Reject result and Refer test are two different surfaces (a column and a checkbox) even though both are really *outcomes of an NCE*; this fragments the workflow and means rejections happen without an NCE record being filed (audit gap). Critical values can be saved without acknowledgment in the current build; the global Alerts dashboard exists but isn't wired to result entry. Polymorphic result types (dictionary, multi-checkbox, cascading) are implemented in code today but the recent redesign mockups only document numeric entry, so devs would not know to preserve the existing dictionary / multi-select / cascading patterns. Reagent kit fields are commented out in the source ("re-enable after new inventory frontend integration") so reagent tracking degrades silently as the inventory frontend lags. Patient data masking has two parallel mechanisms (site-wide `showPatientName` toggle and role-based `PATIENT_DATA_ON_RESULTS_BY_ROLE`) that don't agree on precedence.

### What Changes

The six routes collapse into one **Results** page with a single search bar that intelligently parses lab number, patient ID, accession, or test name, plus a Lab Unit selector. Inside an expanded row, the always-needed sections — Notes, Interpretation, Method & Reagents, Order Info, **Storage Location** (new), Referral, Attachments — are visible as collapsible always-on panels in priority order. The secondary surfaces (QA/QC, History) are tabs. **Storage** gets a dedicated section with a clear "Assign storage location" or "Move storage location" affordance; unassigned samples are visible at a glance. **Result Disposition** moves from two separate surfaces into the inline NCE form: techs choose Cancel / Reject (with reason) / Retest / Refer-out from inside the NCE itself, so a result can never be rejected without an audit-trail-grade NCE record. **Critical values** require acknowledgment that is now logged to the global Alerts dashboard before Save is enabled. **Polymorphic result types** (N, D, M, C) are documented end-to-end so devs preserve the dictionary / multi-checkbox patterns when porting to Carbon. **PII visibility** harmonizes into a clear precedence: site-wide `showPatientName` overrides role-based masking; when neither is on, the row shows ID + sex + age but never the name. **Save** is unchanged in spirit (mandatory e-signature, batch commit) but the result-list response now carries `reflexTests` and `calculatedTests` so the post-save toast can name the downstream accessions instead of just saying "Done."

---

## User Stories

1. **As a Hematology bench tech**, I want to enter Hemoglobin values for the day's pending samples in one screen and see the normal range, critical range, and previous value alongside each, so I can flag concerning results without leaving the page.
2. **As a Microbiology tech**, I want to record ova-and-parasite findings as a multi-checkbox against a fixed organism dictionary, so I don't free-text organism names that downstream reports can't aggregate.
3. **As a tech**, I want to assign a freezer location to every sample I process today, so the lab can find it during reflex testing or follow-up, and so unassigned samples show up in a freezer-audit report.
4. **As a tech**, when a sample is unusable, I want to file an NCE that captures what happened *and* directly chooses whether the result is Cancelled, Rejected, Retested, or Referred-out, so the disposition and the audit record can never drift apart.
5. **As a validator**, I want results saved with e-signature, with reflex and calculated tests visibly listed in the save confirmation, so I know what other accessions are waiting for me in the validation queue.
6. **As a lab manager**, I want a single Results page (not six) so new staff learn one screen, and so we have one place to fix bugs.

---

## Navigation & URL

| Item | Value |
|---|---|
| **Route** | `/Results` (canonical) |
| **Replaces routes** | `/LogbookResults`, `/PatientResults`, `/AccessionResults`, `/StatusResults`, `/RangeResults`, `/result` (all redirected to `/Results` with appropriate URL params) |
| **Workplan deep-link** | `/Results?source=WorkPlanByTest` (or `ByPanel` / `ByTestSection` / `ByPriority`) adds a "Workplan" link to the breadcrumb |
| **Deep-link params** | `?labNumber=`, `?patientId=`, `?accession=`, `?labUnit=`, `?status=`, `?from=`, `?to=` |
| **SideNav** | `Results` (top-level) — sub-items removed; route consolidation |
| **Breadcrumb** | `Home / Results` (or `Home / Workplan / Results` when `?source=WorkPlan*`) |
| **i18n** | `nav.results`, `nav.workplan`, `breadcrumb.home` |

---

## Overview

Redesigned Results Entry page consolidates the six legacy routes into a single `/Results` page with smart search, restructured expanded-row layout (always-visible sections + 2 tabs), and full coverage of features present in the live system that prior mockups had dropped (storage, polymorphic result types, NCE-driven result disposition, e-signature).

### Design Goals

1. **One page, six search modes** — Unified search bar + Lab Unit selector replace `/LogbookResults`, `/PatientResults`, `/AccessionResults`, `/StatusResults`, `/RangeResults`, `/result`.
2. **Inline-first expanded panel** — Notes, Interpretation, Method, Order Info, Storage, Referral, Attachments are always-visible collapsible sections in priority order. Only QA/QC and History are tabs.
3. **NCE-driven disposition** — Reject / Cancel / Retest / Refer-out are options *inside* the inline NCE form, not separate columns. Every result disposition produces an NCE record.
4. **Polymorphic result types fully supported** — Numeric (N), dictionary single-select (D), and dictionary multi-checkbox (M) shown in mockup; cascading multi-select (C) documented in spec.
5. **Storage as a first-class section** — Assign / move storage location is visible immediately, not buried.
6. **Critical Acknowledgment writes to Alerts dashboard** — Per global TODO, critical-value acks are logged to the central Alerts feed.
7. **Carbon component fidelity** — Component Map (§Carbon Component Map) specifies exact `@carbon/react` component per UI element.

---

## Start State / Page Load Behavior

When the user arrives at `/Results` with no URL parameters, the page shows the search toolbar and an empty-state message. Results load only after a deliberate action (Lab Unit selection, search query, or filter application). Empty/loading/no-results states match v2.x behavior. Lab Unit selection persists for the browser session.

URL parameters pre-populate filters and auto-trigger the search. Workplan deep-links (`?source=WorkPlanByTest|ByPanel|ByTestSection|ByPriority`) add a "Workplan" crumb to the breadcrumb chain.

---

## Search & Filters

Single search input parses lab number, accession, patient ID, patient name. Quick filter for **Lab Unit** is required. Date From / Date To always visible. Advanced filters panel (toggle "Advanced"): Lab Number / Range, Order Date Range, Tests / Panels (multi-select), Status. Status defaults to **Pending**. Active filters appear as removable chips.

**Server-side pagination indicator** appears in the toolbar showing `Server page X / Y` with prev/next icons (separate from the client-side Carbon Pagination at the table footer). Server pagination is invoked when the result set exceeds the server-page batch size (100 rows default).

---

## Results Table

### Columns (left to right)

| Column | Width | Content |
|---|---|---|
| Expand | 40px | Chevron |
| **Sample / Patient** | 240px | Patient avatar (initials, color-hashed) + accession (`labNumber-sequenceNumber`) + copy-to-clipboard button + nonconforming icon (if `nonconforming=true`) + (one of: full name / `ID · sex · age` / masked) + EQA priority badge (if `isEqaSample`) |
| **Test Date** | 140px | Inline editable date picker + time picker stacked; disallowFutureDate |
| **Analyzer Result** | 120px | Text label of which analyzer (or "MANUAL", "MANUAL — Microscopy", etc.) fed the row |
| **Test Name** | 200px | Test name (strike-through if Cancelled) |
| **Sample** | 100px | Sample type (Whole Blood, Serum, Stool…) |
| **Normal Range** | 110px | Reference range + unit |
| **Result** | 140px | **Polymorphic by `resultType`:** numeric input (live range tier styling) / single Select (D) / multi-checkbox details (M) / cascading multi-select (C, see Dependencies) / text input (R/A) |
| **Current Result** | 110px | Read-only shadow value (previous result); for D/M/C, resolves dictionary IDs to labels |
| **Status** | 110px | Carbon Tag (Pending / Entered / Awaiting Validation / Released / Cancelled) |
| **Flags** | 100px | H · L · Δ · C · ! · NCE — additive |
| **Actions** | 100px | Save (with KeyRound icon — denotes e-sig) / Modify Result (Pencil) / NCE Tag (when Cancelled) |

### Patient Privacy — Three Layers (Harmonized)

| Layer | Setting | Behavior when ON |
|---|---|---|
| 1. Site-wide override | Admin config `results.entry.showPatientName` (default: off) | Show full patient name in every row |
| 2. Role-based mask | App config `PATIENT_DATA_ON_RESULTS_BY_ROLE` (default: off) + current user's `PatientResults` permission | If config on AND user lacks perm: mask patient line to `— — —`; else show ID + sex + age |
| 3. Default | Both off / user has perm | Show ID + sex + age (no name) |

**Precedence:** Layer 1 overrides Layer 2. If `showPatientName=true`, full name is always shown regardless of role.

### Result Status Workflow

```
Pending → Entered → Awaiting Validation → Released
   ↓         ↓             ↓
                       (Modify → returns to Awaiting Validation, requires reason)
   ↓         ↓             ↓
                Cancelled (via NCE with Disposition=CANCEL)
```

---

## Expanded Panel — Always-Visible Sections + 2 Tabs

### Section Order (top to bottom)

1. **Patient Banner** — Avatar + full name + IDs + DOB + sex + age + clinician + dept + priority Tag
2. **Program Banner** (conditional) — EQA Round badge + due date + Open program details
3. **Modification notice** (conditional) — when status = Awaiting Validation or Released
4. **Notes** — collapsible (default open)
5. **Interpretation** — collapsible (default open)
6. **Method & Reagents** — collapsible (default open) ← was a tab
7. **Order Info** — collapsible (default open) ← was a tab
8. **Program Info** — collapsible (default open) ← NEW (conditional: rendered only when `result.program` is set)
9. **Storage Location** — collapsible (default open) ← NEW
10. **Aliquots** — collapsible (default open) ← NEW (ISO/HIGH I1; conditional when sample has any aliquots OR user has Analyst/Reception bundle)
11. **Referral** — collapsible (default open) ← was a tab
12. **Attachments** — collapsible (default open) ← was a tab
13. **Modification History** — banner at top of panel (conditional) ← NEW (ISO/HIGH A3; appears when result has any saved modifications)
14. **Result Entry Action Bar** — value input + range hint + Report Non-Conformity Event (NCE) button + Save (E-sign)
15. **Conditional banners** — Invalid range / Critical Communication Form (structured) / Reagent-lot-required warning
16. **NCE Inline Form** (conditional — opens on Report NCE click)
17. **Tabs:** QA/QC · History

### Notes Section

Structured notes (date · author · type tag · body) plus a **Past Notes (legacy)** sub-panel that preserves linebreaks from legacy plain-text notes. Add new note with type radio (In Lab Only / Send with Result), default In Lab Only.

### Interpretation Section

System-suggested interpretation banner (when applicable) + clickable interpretation options (color-coded) that copy text into a textarea. Textarea supports interpretation-code macros (e.g. `HGB-NL` + space → expanded text). User can edit. Clear button resets.

### Method & Reagents Section

| Field | Carbon component | Notes |
|---|---|---|
| Method | `Select` | Per-row method override populated from `/rest/displayList/METHODS` (Manual / Automated / Semi-Automated / Point of Care) |
| Analyzer | `Select` (conditional) | Only shown when method = Automated or Semi-Automated; populated from `/rest/test/{testId}/analyzers`; shows status + QC indicator |
| Method Details | `TextInput` | Optional. Supports macros: `MAN-DIFF` `MAN-HEM` `MAN-MICRO` `QNS` `CLOT` `HEMOLYZED` `LIPEMIC` (type + space → expand) |
| Reagent Lots | inline table | FIFO suggestion: oldest unexpired lot gets "Use First" tag; expiring lots get amber warning; expired lots disabled. **Required for Save when `requireReagentLotsForResults` site flag is ON** (ISO 15189 §6.4.4). When ON and no lot selected: inline warning + Save disabled with explanatory tooltip. Default ON for ISO-accredited deployments. |

### Order Info Section

3-column grid: Clinician, Phone, Department, Priority, Collection Date/Time, Received Date/Time, Fasting Status, Clinical History, Diagnosis. Multi-line fields (History, Diagnosis) span the row. All fields read-only on Results page (edited in Order Entry).

### Program Info Section — NEW

**Conditional rendering:** This section appears only when `result.program` is set (i.e. the order is linked to a program — EQA round, RETROCI ARV / EID / VL / Indeterminate study, or any custom program). When no program is linked, the section is hidden entirely (not a collapsed empty state).

**Purpose:** Programs capture additional metadata at Order Entry that techs need to see during result entry: study identifiers, visit numbers, treatment regimen, expected analytes, panel codes, EQA round metadata, etc. Without surfacing these fields here, techs have to navigate back to the order to see context that affects how they interpret or report the result.

**Layout:** Section header shows `BookOpen` icon + "Program Info" + program name as a magenta badge. Body is a 3-column grid of up to 15 fields. Field rendering:

| Field type | Layout |
|---|---|
| `text` (short) | 1-column cell with uppercase field label + value |
| `text` (long, e.g. clinical notes, provider comments) | Full-row span (col-span-3) |
| `datetime` | 1-column cell, value formatted to locale |
| `longtext` | Full-row span (col-span-3) |
| `enum` | 1-column cell with value as Tag |

**Read-only on Results page.** Fields are edited on the originating order (Order Entry page) or via the program admin. A muted help line under the grid states: *"Program-captured fields are read-only here. Edit them on the originating order."*

**Data model:** `result.program.fields[]` — array of `{ label, value, type }` objects, up to 15 items. The field set is config-driven per program type (declared in Test Catalog program configuration), so an EQA program surfaces panel ID / round number / expected analyte / coordinator while a RETROCI VL study surfaces regimen / prior VL / adherence / visit number.

**RETROCI study forms:** When the `useRetroCIStudyForms` feature flag is ON, the Program Info section is the surface where hardcoded RETROCI ARV / EID / VL / Indeterminate fields render. The hardcoded field set per study type is documented in the RETROCI program spec (separate document); this section is the renderer.

**EQA-specific fields:** Standard EQA fields shown by default: EQA Panel ID, Round Number, Specimen Code, Expected Analyte, Submission Deadline, Lab Code (Provider), Round Coordinator, Provider Comments.

### Storage Location Section — NEW

| State | UI |
|---|---|
| **Unassigned** | Section header shows badge "Unassigned". Body shows muted help text and an "Assign storage location" primary button. |
| **Assigned** | Body shows the full path (Freezer → Rack → Shelf → Box), position coordinate, condition (e.g. −20 °C), and a "Move storage location" secondary button. |
| **Picker open** | Inline panel with 4-column grid of freezer/refrigerator tiles. Drill-down to Rack → Shelf → Box → Position. On Move (existing location), a **Reason for move** text input is required before Confirm is enabled. |

API:
- `GET /rest/storage/sample-items/{sampleItemId}` — current assignment
- `POST /rest/storage/sample-items/assign` — first assignment
- `POST /rest/storage/sample-items/move` — re-assignment (requires `reason`)

### Aliquots Section — NEW (ISO HIGH I1)

**Purpose:** Surface and manage aliquots derived from this sample. Aliquoting (splitting one sample into N portions, each with its own accession suffix `LABNO.X-Y`) is a core lab workflow that today lives in a separate `/Aliquot` page; moving it inline here matches the tech's mental model — when entering a result they often need to create a retention aliquot, send-out aliquot, or pooled-sample aliquot in the same workstation breath.

**Layout:**
- Section header: "Aliquots" + count badge.
- Inline table with columns: **Aliquot ID** (`LABNO.X-Y`), **Purpose** (Test / Retention / Send-out / Pool / Pour-off), **Linked Test** (when Purpose=Test), **Status** (Created / In-Storage / Sent / Used / Destroyed), **Created** (date · by-whom), **Storage** (Freezer path or "—"), **Actions** (View / Print Label / Mark Used / Destroy).
- Below the table: **Create aliquot** affordance — opens an inline mini-form with: (a) **How many aliquots?** numeric input (default 1), (b) **Purpose** select, (c) when Purpose=Test: a Test Catalog picker; when Purpose=Send-out: opens linked Referral fields, (d) **Destination storage** (optional — opens LocationPicker), (e) **Reason / Notes** (optional textarea). On submit, auto-assigns the next `LABNO.X-N` suffixes, creates the aliquot rows, optionally orders linked tests, and prints labels.

**Pool composition (vector deployments):** When the source sample is a pool (per memory `project_vector_referral_deconvolution`), the Aliquots section additionally displays the pool composition (member specimen IDs) above the aliquot table. This is read-only at Results Entry; pool authoring happens at Sample Reception.

**Role attachment:** Both **Analyst** and **SampleReception** bundles can create aliquots from Results Entry. Aliquot destroy/mark-used actions require **Analyst** (Reception techs can create but not destroy).

**API:**
- `GET /rest/samples/{sampleId}/aliquots` — list
- `POST /rest/samples/{sampleId}/aliquots` — create one or more
- `PATCH /rest/aliquots/{aliquotId}` — update status (mark used, destroy)

**Conditional rendering:** Section always rendered when the user has Analyst or SampleReception bundle. Empty state when no aliquots exist: "No aliquots from this sample. [Create aliquot]"

### Referral Section

Checkbox: "Refer this test to an external laboratory". When checked, reveals: Referral Reason (Select, required), Institute (Select, required), Test to Perform (TextInput, prefilled with current test), Sent Date (DatePicker, defaults to today). When triggered as the disposition of an NCE (BR-032), the form auto-fills.

### Attachments Section

List view: file icon, name, size, source tag (Order Entry purple / Result Entry teal), uploader, date, download button (always), delete button (Result Entry only). Files from Order Entry are read-only. New upload via `FileUploader`; supports JPEG, PNG, PDF.

### Modification History Banner — NEW (ISO HIGH A3 / CFR Part 11 §11.10(e))

**Purpose:** Make the original value visible in the UI — not just buried in audit_trail. ISO 15189 §7.5.2 and 21 CFR Part 11 §11.10(e) require that the original observation remain retrievable when a result is amended.

**Rendering:** When `result.modificationHistory[]` has one or more entries, a stable banner renders at the top of the expanded panel (above Notes, below Patient Banner / Program Banner / modification-notice strip). For each prior modification entry, display:

```
[Pencil icon]  Original: 142 mg/dL  →  Modified: 138 mg/dL  ·  J. Smith · 12/19/2025 14:32
              Reason: "Corrected from instrument printout (calibration drift detected late)."
              [View all history (N)] ▾
```

When multiple modifications exist, only the most recent transition is shown by default; clicking "View all history (N)" expands a full chronological list (`original → mod1 → mod2 → … → current`) with reason + actor + timestamp for each step. A small Tag in the table row (`Modified` in `warm-gray` kind) signals to validators scanning the list that this result has prior history.

**Data model:** `result.modificationHistory[]` — array of `{ id, fromValue, toValue, modifiedBy, modifiedAt, reason, action }` where `action` is `RESULT_MODIFIED` or `RESULT_MODIFIED_RELEASED`. Backend derives this from existing audit_trail rows scoped to `analysis_id` — no schema addition required (the trail itself becomes the source of truth, just surfaced).

**Validator visibility:** On the Validation page (separate spec), this banner displays identically and is read-only; validators reviewing a modification chain see the full history before approving.

### Demographic-Aware Reference Ranges — NEW (ISO HIGH B2 / CLSI EP28-A3c)

**Purpose:** A single range per test is insufficient for ISO 15189 §7.5.1.4 ("biological reference data") and CLSI EP28-A3c. Pediatric, pregnancy, and geriatric reference intervals differ for many analytes (creatinine, hemoglobin, alkaline phosphatase, etc.).

**Data model change:** Replace the v3.0 `result.rangeBounds` (single range) with `Test.referenceRanges[]` — an ordered array of ranges with selection criteria. Each entry has:

```typescript
interface ReferenceRange {
  id: string;
  // Selection criteria — all that are non-null must match the patient at sample collection date
  ageMin?: number;         // years (use fractional for neonates: 0.0833 = 1 month)
  ageMax?: number;         // exclusive
  sex?: 'M' | 'F' | 'U';
  lifeStage?: 'neonate' | 'pediatric' | 'adolescent' | 'adult' | 'pregnant' | 'geriatric';
  // Range values
  normalLow: number; normalHigh: number;
  criticalLow?: number; criticalHigh?: number; criticalLowMsg?: string; criticalHighMsg?: string;
  validLow?: number; validHigh?: number;
  unit: string;
  // For display
  label: string;            // "Adult Female (18-65y)" — shown next to selected range
}
```

**Selection rule:** at expand time, the frontend (or backend if pre-computed) picks the **most specific** matching range. Specificity = count of non-null selection criteria that match. Ties broken by Test Catalog priority order. When no range matches, fall back to the lowest-priority "default" range and display a yellow warning Tag: **"⚠ No reference range for this demographic — using default."**

**UI:** The selected range's `label` appears as a small Tag next to the displayed range in both the table row and the expanded action bar. Hovering the Tag opens a Popover showing the selection criteria + a list of other configured ranges for this test (so the tech can see why this range was selected).

**Validation-page parity:** Same selection logic applies on the Validation page so the validator sees the same range as the tech did.

**Migration:** Existing tests configured with one range get a single `referenceRanges[0]` entry with no selection criteria (matches any patient). Multi-range configuration is a Test Catalog Admin task (separate spec).

### Critical Value Communication Form — NEW / EXPANDED (ISO HIGH A1 / CLSI GP47)

**Replaces the v3.0 "I Acknowledge" single-click button.** CLSI GP47 (Critical Result Communication) requires documented evidence of: (a) who was notified, (b) by what method, (c) what was read back to confirm receipt, (d) when, and (e) escalation history when initial attempts failed. A single click does not satisfy this.

**Trigger:** When the entered result is in the `critical` range tier, the existing "Critical Value — Physician Notification Required" banner displays. The single "I Acknowledge" button is replaced by **"Open Notification Form"**. Save remains blocked.

**Form layout (Usability H3) — progressive disclosure across two steps:**

The form is broken into two visually separated steps. Step 2 only reveals once Step 1 has the minimum fields filled. This reduces friction at the moment of patient-safety stress.

**Step 1 — "Who are you contacting?"** (always visible):

| Field | Type | Required | Source |
|---|---|---|---|
| **Recipient** | TextInput with "Use order clinician" quick-fill button | ✓ | `order.clinician` defaulted into the field; "Use order clinician" button shown when the user has typed something else |
| **Recipient role** | Select | optional (defaults to Clinician) | Clinician / Nurse / On-call clinician / Patient (direct) / Other |
| **Method of communication** | Select | optional (defaults to Phone) | Phone / In-person / Secure message / Pager / Other |
| **Time of notification** | TextInput + [Now] button | ✓ | Auto-filled with `now`; [Now] button refreshes the value; manual edit supported for backfill |

**Step 2 — "What happened?"** (reveals when Recipient + Time are filled). Two buttons:

| Button | Reveals |
|---|---|
| **✓ Reached on this attempt** (green) | Read-back textarea (required). Submit unblocks when read-back is filled. |
| **⚠ Could not reach — log escalation** (amber) | Escalation log panel with one attempt entry pre-added. Each entry has Method / Recipient / Outcome. When outcome=`reached` on any entry, a Read-back textarea appears inline for that entry; Submit unblocks when read-back is captured. |

A "Change" link in Step 2 lets the user go back and re-pick the outcome if they made a mistake.

| Field (Step 2) | Type | Required | Source |
|---|---|---|---|
| **Read-back text** | TextArea | ✓ on the reached-attempt | The verbatim words read back by the recipient confirming they understood the value. CLSI GP47 §5.4.2. |
| **Escalation entry: Method** | Select | when not reached | Phone / Pager / In-person / Secure message |
| **Escalation entry: Recipient** | TextInput | when not reached | Whoever was attempted on this escalation |
| **Escalation entry: Outcome** | Select | when not reached | No answer / Left voicemail / Busy / Wrong number / Escalated to supervisor / ✓ Reached |
| **Additional notes** | TextInput | optional | Anything else relevant — e.g. "Patient also notified directly per family request" |

**On submit (Confirm Notification button):**
1. POST to `/rest/alerts/critical-acknowledgment` with the full structured payload.
2. On success: ack pill replaces the form ("Notified Dr. Williams at 12/18/2025 12:04 via Phone — read-back confirmed"). Save unblocks.
3. On failure: follow BR-025 retry policy (toast + queued replay).
4. Audit: `CRITICAL_NOTIFICATION_LOGGED` row written to `audit_trail` with the full payload, plus the existing `CRITICAL_ACK`.

**Modification:** Once a critical notification has been logged, the form collapses to a read-only summary card. Editing requires the Validator bundle and produces a new modification-history entry (per A3).

**Validator visibility:** On the Validation page, the structured notification record is shown read-only above the result; validators verify the read-back text is meaningful before releasing.

### QA/QC Tab

Overall status banner (pass / warning / fail / none). Control results table with level, value, expected range, pass/fail. Analyzer status + last calibrated timestamp.

### History Tab

Delta-check alert banner (when threshold exceeded). Previous results table with today highlighted; for D/M result types, dictionary IDs resolved to labels. Empty state when no history.

---

## Polymorphic Result Cell — Result Types

| Code | Type | Input | Live Validation |
|---|---|---|---|
| **N** | Numeric | `NumberInput` with parsed value | range tier (normal / abnormal / critical / invalid) drives input border + cell background + flag badges (H/L/C/!) |
| **D** | Dictionary single-select | `Select` (or `Dropdown`) over `dictionaryResults` | none — value validated against allowed set |
| **M** | Dictionary multi-checkbox | Carbon `MultiSelect` (or details/summary pattern in compact rows) | CSV of selected dictionary IDs |
| **C** | Cascading multi-select | Parent `Select` → child `MultiSelect` (organism → AST drug panel) | declared in spec; **out of scope for v1 mockup** — see Dependencies |
| **R** | Remark (single-line text) | `TextInput` | none |
| **A** | Alpha (paragraph text) | `TextArea` (1 row, expands) | none |

### Numeric (N) — Range Tier Evaluation

Evaluation order: `invalid` (outside physiologically valid range) → `critical` (panic) → `abnormal` (outside normal but inside critical) → `normal`.

| Tier | Visual | Save behavior |
|---|---|---|
| Normal | No highlight | Save enabled |
| Abnormal | Yellow border + yellow cell background + "H"/"L" flag | Save enabled |
| Critical | Orange border + orange cell background + "C" flag + critical banner in expanded panel | **Save disabled until "I Acknowledge" clicked. Acknowledgment is logged to Alerts dashboard.** |
| Invalid | Dark red border + dark red cell + "!" flag + invalid banner | Save NOT disabled (so tech can correct); dark red banner warns to verify and repeat |

### Acknowledgment → Alerts Dashboard

Per `project_critical_result_ack_global_todo`, critical-value acknowledgment from this page MUST POST to the Alerts service so the central Alerts dashboard reflects: result identifier, tech who acknowledged, timestamp, and message. The Save action does not complete until the ack is recorded.

---

## Save Workflow

### Action Bar

| Element | Carbon component | Notes |
|---|---|---|
| Result Value | `NumberInput` (N) / `Select` (D) / `MultiSelect` (M) / `TextInput` (R) / `TextArea` (A) | Live range tier styling for N |
| Range hint | text | "Ref: 16.00–20.00 g/dL · Critical: <7.0 or >25.0" |
| Report Non-Conformity | `Button kind="tertiary"` w/ Warning icon | Opens inline NCE form |
| Save / Modify Result | `Button kind="primary"` w/ KeyRound icon | Triggers e-signature modal |

### E-Signature Modal

| Field | Source |
|---|---|
| Title | "E-Signature Required" |
| Body | "You are about to save N result(s) for accession X. Per lab policy, results must be e-signed before they enter the validation queue." |
| Meaning | `AUTHORED` (sent to backend) |
| Record type | `RESULT_BATCH` |
| Record id | First analysisId in batch |
| Password | required `PasswordInput` |
| Cancel | Returns to Result Entry without saving |
| Sign & Save | POSTs to `/rest/LogbookResults` with `eSignature` envelope |

First-use-per-session: an additional Certification flow may be required (covered by existing `ESignatureButton`).

### Post-Save Behavior

| Outcome | UI |
|---|---|
| Plain save | Toast: "Result saved and queued for validation." |
| Reflex tests fired | Same toast adds: `Reflex tests created: <accession list>` |
| Calculated tests fired | Same toast adds: `Calculated tests: <test name list>` |
| STAT priority | Same toast adds: "STAT result — validators have been notified." Backend additionally fires an in-app Notification to every user with the Validator role bundle. |
| Modification of previously-saved result | Toast: "Result modified and returned to Validation queue." |
| **Stale-page conflict** | Toast (warning): "Result has been saved by another user — refreshing the page." Page reloads; conflicting rows show in error state. |

### Modification Workflow

| Status when re-saving | Button label | Additional requirement |
|---|---|---|
| Pending / Entered | **Save** | None |
| Awaiting Validation | **Modify Result** | Reason-for-modification text required; reason auto-appended to result's internal notes as `[Modification reason] …`; status stays Awaiting Validation |
| Released | **Modify Result** (amber) | (a) Confirm amber warning banner → (b) reason text required; status returns to Awaiting Validation for re-approval |

---

## Inline NCE Form — Result Disposition (Replaces Reject Column)

The standalone Reject column is removed. Reject becomes a **Result Disposition** option inside the Report NCE form. Every result that is voided, rejected, retested, or referred-out from Results Entry produces a Non-Conformity record.

### NCE Form Fields

| Field | Required | Notes |
|---|---|---|
| NCE number | Auto | Format `NCE-YYYYMMDD-NNNN` |
| Auto-linked context | — | Read-only: test name + lab number + result value (or "not entered") |
| Category | ✓ | Pre-Analytical / Analytical / Post-Analytical / Administrative |
| Subcategory | ✓ | Dependent on Category |
| Severity | ✓ | **Radio with description:** Critical (patient safety risk) / Major (significant quality impact) / Minor (limited impact) |
| Title | — | Short summary |
| Description | — | What happened, when, how discovered |
| Immediate Action | — | What was done to contain |
| Suspected Causes | — | Likely root causes |
| Proposed Action | — | Recommended corrective action |
| **Result Disposition** | ✓ | One of: **Cancel result** (default, voids result) / **Reject result + reason** (permanently deletes; requires rejection reason) / **Retest** (result stays Pending; retest order created; Workplan-tracked) / **Refer out** (opens Referral section with reason pre-filled) |
| Rejection reason | ✓ when Disposition=Reject | Select from `REJECTION_REASONS` dictionary (Hemolyzed / QNS / Clotted / Incorrect container / Mislabeled / Sample expired / Other) |

### Disposition → Status Mapping

| Disposition | Resulting status | Side-effect |
|---|---|---|
| Cancel result | `cancelled` | NCE record created; result value voided |
| Reject result + reason | `cancelled` (result row deleted) | NCE record created; `RejectionReason` stored on NCE |
| Retest | `pending` | NCE record created; retest order auto-generated; tracked in Workplan |
| Refer out | `awaiting-validation` (referred) | NCE record created; Referral section pre-filled with NCE-derived reason |

API: `POST /rest/non-conformity-events` with `{ result, disposition, rejectionReason?, ...nceFields }`

---

## Responsive Design — Breakpoints

OpenELIS is deployed across desktop workstations and bench tablets. The layout adapts at four breakpoints:

| Viewport | Layout |
|---|---|
| **≥1440px (large desktop)** | Full 11-column table + 3-column grids in expanded panel sections |
| **1024–1439px (standard desktop / landscape tablet)** | Full table; sections wrap to 2-column grids when needed |
| **768–1023px (portrait tablet)** | "Compact columns" mode — hide Analyzer Result and Current Result columns (accessible via the Columns overflow menu); section grids stack to single-column |
| **<768px (small tablet / phone)** | "Card row" layout — each row becomes a vertical card showing Accession + Patient + Test + Result input + Status + Expand toggle. Expanded panel sections stack single-column. Action bar sticks to the bottom of the card. *Note: v3 mockup demonstrates the table layout; card layout is deferred to a polish spec but the breakpoint plan is fixed here so the implementation slot is reserved.* |

**Touch targets:** All interactive elements meet WCAG 2.5.5 (24×24 CSS pixels minimum, 44×44 preferred for primary actions). Critical Acknowledgment button, Save (E-Sign) button, and section expand chevrons use the 44×44 minimum.

**Column hiding policy:** When a column is hidden by the breakpoint, its data is still accessible via the expanded row. The Columns overflow menu (Carbon DataTable `ColumnControl`) lets users re-show hidden columns when viewport space allows.

## Information Architecture — Expanded Panel Order (Usability H1)

**Primary action block (top of expanded panel):** Patient Banner → Program Banner (conditional) → Modification History banner (conditional) → Modification notice (conditional) → **Action bar (Result Value + Range hint + Report NCE + Save)** → Modification reason (conditional) → Invalid range banner (conditional) → Critical Notification Form (conditional) → NCE inline form (conditional).

**Secondary context block (below primary action):** Notes → Interpretation → Method & Reagents → Order Info → Program Info (conditional) → Storage Location → Aliquots → Referral → Attachments → Tabs (QA/QC, History).

**Rationale (H1):** The bench tech's primary task is enter value → save. Putting the action bar at the top of the expanded panel means the tech doesn't scroll past 9 context sections to reach the field they're filling in. Context sections live below the action and serve as on-demand reference, not workflow steps.

## Section Default-Open Behavior (Usability H2)

Each inline section computes its own default-open state from row context. Empty or irrelevant sections collapse on first view; only sections that need attention auto-open.

| Section | Default open when |
|---|---|
| **Notes** | `result.notes.length > 0` OR `result.pastNotesLegacy` exists |
| **Interpretation** | `result.suggestedInterpretation` exists OR `result.interpretationOptions.length > 0` |
| **Method & Reagents** | `requireReagentLotsForResults` flag is ON (so the gate is immediately visible) |
| **Order Info** | Closed by default (read-only context, accessible on demand) |
| **Program Info** | Open when shown (conditional on `result.program` existing) |
| **Storage Location** | Open when sample's storage path is unset (prompts the tech to assign); closed when storage is already set |
| **Aliquots** | Open when aliquots exist OR sample is a pool; closed otherwise. *Future enhancement:* lab-unit-aware default (open for Microbiology / Pathology / Vector even when empty) |
| **Referral** | Open when result has an existing referral; closed otherwise. Auto-opens when NCE Disposition = Refer-out (BR-032) |
| **Attachments** | Open when attachments exist; closed otherwise |

**Behavior:** Section header chevron remains a manual toggle. The smart default applies only to the first render when the row is expanded; subsequent open/close actions persist for the session.

## Carbon Implementation Notes

The mockup intentionally uses Tailwind utility classes and raw HTML elements (`<select>`, `<input>`, `<table>`, custom toggle/tab divs) so the gallery preview can render without a Webpack build step or `@carbon/react` install. **Production implementation MUST use `@carbon/react`**. The Component Map below binds each UI element to its Carbon component.

**Patterns the Tailwind mockup intentionally does NOT demonstrate** — devs implementing this MUST use the Carbon equivalents instead of the visual mockup pattern:

| Mockup shows | Production must use |
|---|---|
| Custom toggleable `<div>` for collapsible sections | `Accordion` + `AccordionItem` |
| Custom tab bar with border-bottom highlight | `Tabs` + `Tab` + `TabList` + `TabPanels` + `TabPanel` |
| Custom modal overlay div for E-Sig | `Modal` + `PasswordInput` + `ModalFooter` |
| `<details>` element for M-type result | `MultiSelect` (`selectionFeedback="fixed"`) |
| Inline `<table>` for results | `DataTable` + `TableExpandRow` + `TableExpandedRow` |
| Fixed-position toast stack | `ToastNotification` rendered via portal |
| Inline LocationPicker stub | `ComposedModal` + custom drill-down tree component |
| Inline file-upload placeholder | `FileUploader` / `CompactFileInput` |
| Manual `<input type="date">` + `<input type="time">` | `DatePicker` + `DatePickerInput` + `TimePicker` + `TimePickerSelect` |
| `<select>` elements with native styling | `Select` + `SelectItem` (or `Dropdown` for searchable) |
| `<textarea>` | `TextArea` |
| Status badge `<span>` with rolled colors | `Tag` with `type` prop |

The Tailwind mockup is acceptable as a *design reference* but **must not be copy-pasted as implementation code**. The intent of each rendered element maps to a Carbon component in the table below.

## Carbon Component Map

This map binds each UI element to its Carbon component.

| UI Element | `@carbon/react` Component | Notes |
|---|---|---|
| Page table | `DataTable` + `TableExpandRow` + `TableExpandedRow` | Replace raw `<table>` |
| Test Unit dropdown | `Select` + `SelectItem` | Required indicator with `labelText` + `helperText` |
| Search input | `Search` | with `placeholder`, scan-barcode-friendly |
| Date From/To | `DatePicker` + `DatePickerInput` (range) | `dateFormat="d/m/Y"` |
| Test Date (per-row inline) | `DatePicker` + `TimePicker` + `TimePickerSelect` | Date + hh + mm stacked |
| Status filter chips | `FilterableMultiSelect` or rolled `Tag` w/ `filter` prop | Carbon `Tag` `filter={true}` |
| Patient avatar | Custom — initials in color-hashed circle | Carbon does not ship an Avatar component; use a lightweight wrapper |
| Status badge | `Tag` w/ `type="green\|blue\|warm-gray\|red\|gray"` | StatusTag mapping in spec |
| Flag badges (H/L/Δ/C/!) | `Tag` (compact) or `<span>` w/ inline styles | C and ! use `kind="red"`/custom for orange |
| Result input (numeric) | `NumberInput` | with `invalidText`, `step`, `min`, `max` |
| Result input (dictionary single) | `Select` or `Dropdown` | over `dictionaryOptions` |
| Result input (dictionary multi) | `MultiSelect` | `selectionFeedback="fixed"` |
| Result input (cascading) | `Select` (parent) → `MultiSelect` (child) | C type — out of scope for v1 mockup |
| Result input (text) | `TextInput` / `TextArea` | per resultType |
| Range tier banners | `InlineNotification` `kind="warning\|error\|info"` | Critical = warning; Invalid = error |
| Critical Ack button | `Button kind="danger"` | logs to Alerts on click |
| Section header (collapsible) | `Accordion` + `AccordionItem` or custom toggleable `Tile` | use Carbon Accordion for collapsibility |
| Notes table | `StructuredList` or inline `<div>` rows | with `Tag` for type badge |
| Note type radio | `RadioButtonGroup` + `RadioButton` | "In Lab Only" / "Send with Result" |
| Method dropdown | `Select` | populated from `/rest/displayList/METHODS` |
| Analyzer dropdown | `Select` (or `Dropdown` for searchable) | from `/rest/test/{testId}/analyzers` |
| Storage Picker | Inline `Tile` grid + drill-down; production: custom `LocationPickerModal` | full freezer/rack/shelf/box hierarchy |
| Storage "Reason for move" | `TextInput` | required when moving existing location |
| Refer checkbox | `Checkbox` | gates the referral form |
| Referral Reason / Institute | `Select` | from `/rest/displayList/REFERRAL_REASONS`, `/rest/displayList/REFERRAL_ORGANIZATIONS` |
| File upload | `FileUploader` / `CompactFileInput` | image/PDF, base64 |
| Toast | `ToastNotification` | reflex/calc lists appear in body |
| E-signature modal | `Modal` + `PasswordInput` | mandatory flow |
| Report NCE button | `Button kind="tertiary"` w/ `renderIcon={Warning}` | opens inline NCE form |
| NCE Severity radios | `RadioButtonGroup` with `legendText` | Critical / Major / Minor with helper text |
| NCE Result Disposition | `RadioButtonGroup` (custom-styled tiles) or `Tile` grid | Cancel / Reject / Retest / Refer |
| Rejection reason | `Select` | conditional on Disposition=Reject |
| Save (E-Sign) button | `Button kind="primary"` w/ `renderIcon={KeyRound}` | triggers ESignature flow |
| Pagination (bottom) | `Pagination` | items per page 10/20/30/50/100 |
| Pagination (server, top) | inline icon `Button` x2 + text indicator | shows `current/total`, page size 100 |
| Nonconforming legend | `InlineNotification` (low) or inline `Tag` + text | always-visible above table |

---

## Data Dependencies — Named Entities & Attributes

The redesign introduces fields not present in OpenELIS today. Each must be backed by a real entity attribute (per `feedback_reuse_existing_data_elements`).

| New / Extended Field | Today's State | Action Required |
|---|---|---|
| `Test.referenceRanges[]` (replaces single `Test.normalRange` + `Test.lowerCritical` / `higherCritical`) | Single range only | **Schema:** New `test_reference_range` table with one row per range variant. Columns: `id`, `test_id`, `age_min`, `age_max`, `sex`, `life_stage`, `normal_low`, `normal_high`, `critical_low`, `critical_high`, `critical_low_msg`, `critical_high_msg`, `valid_low`, `valid_high`, `unit`, `label`, `priority`. `@Audited`. Existing single-range data migrates as one entry with no selection criteria. **Per CLSI EP28-A3c and ISO 15189 §7.5.1.4** (BR-036). |
| `critical_notification` table (only when `criticalNotification.requireReadBack=ON`) | Not present | **Schema:** New `critical_notification` table — optional, only populated when the site opts in to GP47 documentation. Columns: `id`, `analysis_id`, `alerts_ack_id` (FK to existing Alerts ack record — the GP47 form is a *richer attachment* to the Alerts ack, not a parallel acknowledgment system), `value`, `recipient`, `recipient_role`, `method`, `read_back_text`, `notified_at`, `first_attempt_successful`, `escalation_log` (JSONB), `additional_notes`, `logged_by`, `logged_at`. `@Audited`. Captures CLSI GP47 structured notification record per critical result (BR-033). When the flag is OFF, this table is never written to — the baseline Critical Ack flow continues to satisfy ISO 15189 §7.4.5 via the existing Alerts dashboard. |
| `aliquot` table | Aliquot tracking exists in `/Aliquot` page; data model exists but not surfaced on Results Entry | **No new schema** if existing aliquot table covers ID, source-sample link, purpose, status, storage, created-by/at, suffix. **API surface required:** `GET /rest/samples/{sampleId}/aliquots`, `POST /rest/samples/{sampleId}/aliquots`, `PATCH /rest/aliquots/{aliquotId}`. (BR-037) |
| `Test.interpretationOptions[]` | Not present as structured data; some interpretation text in `result_options` for D type | **Schema:** New `test_interpretation` table linked to `test`; columns: code, label, color, range_text, body. `@Audited`. **Follow-up spec required:** Test Catalog Admin page must be extended to manage these rows; until that lands, interpretation options are seeded per-test via SQL migration. |
| `Test.suggestedInterpretation` (auto) | Not present | **Server logic:** Match entered numeric value against `test_interpretation.range_text` bounds to suggest interpretation. No new schema beyond interpretation table. |
| ~~`Result.cascadingMultiSelect (C)` resultType~~ | *Deferred to a separate spec* | **Moved to §Future Considerations.** Extending the `result_type` enum requires a sweep across HL7 export, FHIR export, reports, Validation, and Test Catalog admin to confirm no downstream consumer breaks. Out of scope for v3. |
| `Result.disposition` (Cancel/Reject/Retest/Refer) | Disposition split across `result.status` + `referral` + `rejection` paths | **Server logic:** Persist disposition as part of the linked `NonConformityEvent` (no new column on `result`); on disposition application, drive existing status/referral side-effects. |
| `Alerts.criticalAcknowledgment` | Alerts dashboard exists; not wired to Results Entry | **API:** New `POST /rest/alerts/critical-acknowledgment` endpoint. Payload: `{ resultId, value, ackBy, ackAt, criticalMsg }`. |
| `SampleItem.storageLocation` | Exists today via `/rest/storage/sample-items` | **No new schema** — wire existing API into the Storage Section. |
| `result.reflexTests[]`, `calculatedTests[]` in save response | Backend computes reflex/calc on save; not currently in REST response | **API:** `POST /rest/LogbookResults` response augmented with `reflexTests: [accession]` and `calculatedTests: [testName]` so the toast can name them. |
| `Result.method` (per-row override) | `result.method` text column exists today | **No new schema.** UI surfaces existing field. |
| `EQA priority` (STANDARD/URGENT/CRITICAL) | EQA module tracks rounds; priority per sample not stored as enum | **Schema:** Add `eqa_sample.priority` enum column (STANDARD default). `@Audited`. |
| `Patient.nationalId` in row | Exists; not always displayed | **No schema change** — surface existing field, respect PII mask. |

### Feature Flags Introduced

| Flag | Default | Purpose |
|---|---|---|
| `results.entry.showPatientName` | OFF | Site-wide PII override (existing) |
| `PATIENT_DATA_ON_RESULTS_BY_ROLE` | OFF | Role-based PII mask (existing) |
| `ALERT_FOR_INVALID_RESULTS` | ON | Fire notification on invalid-range save (existing) |
| `allowResultRejection` | ON | Whether NCE Disposition includes "Reject result + reason" option (existing, repurposed) |
| `results.entry.unifiedRoute` | ON for new installs; **OFF** for upgrades during migration | When OFF, legacy six routes remain; when ON, they redirect to `/Results` |
| `requireReagentLotsForResults` | ON for new ISO-accredited installs; **OFF** for upgrades and non-accredited deployments | When ON, Save is blocked unless at least one reagent lot is selected per ISO 15189 §6.4.4 (BR-034) |
| `criticalNotification.requireReadBack` | **OFF (all deployments)** | Optional CLSI GP47 structured form (BR-033). When OFF: single-click "I Acknowledge" + Alerts POST satisfies the critical-value gate (baseline path, ISO 15189 §7.4.5 compliant). When ON: structured GP47 form (recipient / role / method / read-back / escalation) replaces the simple ack. Opt-in for CAP-level documentation; not required for baseline ISO compliance. |
| `useRetroCIStudyForms` | OFF | Render hardcoded RETROCI ARV/EID/VL/Indeterminate forms inside Program Info section (existing) |

---

## Permissions & Audit

### Role Attachment

| Action | Role Bundle |
|---|---|
| View Results page | `Analyst` (existing; binary, all analysts get all results-view) |
| Enter / Modify result value | `Analyst` |
| Save (e-sign) result | `Analyst` |
| File NCE | `Analyst` |
| Assign / move storage location | `Analyst` OR `SampleReception` | Storage assignment happens both at sample receiving (Reception techs) AND during result entry (Analysts re-shelving post-run). Either bundle grants access; the action is the same. |
| View patient name when PII masking is on | `PatientResults` permission bundle (existing) |
| Modify Released result | `Validator` (existing — supervisors only); non-Validators see a disabled "Modify Result" button with tooltip "Released-result modification requires Validator permission." |

**No new permission keys introduced.** Per `feedback_openelis_admin_permissions`, OpenELIS uses binary admin + per-module role bundles, not per-action permission keys.

### Audit Trail Events

For every state-changing action, an entry is written to `audit_trail`:

| Action | `audit_trail.action` | Target | Payload summary |
|---|---|---|---|
| Save first result | `RESULT_SAVED` | `analysis_id` | `{ value, method, analyzer, reagentLots[] }` |
| Modify Awaiting Validation result | `RESULT_MODIFIED` | `analysis_id` | `{ prevValue, newValue, reason }` |
| Modify Released result | `RESULT_MODIFIED_RELEASED` | `analysis_id` | `{ prevValue, newValue, reason }` (additional Envers row on Released-result modification) |
| Save interpretation (no value change) | `INTERPRETATION_SAVED` | `analysis_id` | `{ interpretationCode, textLength }` (don't audit body text — too noisy + may contain PII-adjacent free text) |
| Add note | `NOTE_ADDED` | `analysis_id` + `note_id` | `{ type, bodyLength }` (don't audit body text) |
| Assign storage location | `STORAGE_ASSIGNED` | `sample_item_id` | `{ locationPath }` |
| Move storage location | `STORAGE_MOVED` | `sample_item_id` | `{ fromPath, toPath, reason }` |
| File NCE | `NCE_CREATED` | `nce_id` | `{ severity, disposition, category, subcategory }` |
| Apply NCE disposition | `NCE_DISPOSITION_APPLIED` | `nce_id` + `analysis_id` | `{ disposition }` |
| Critical value acknowledged | `CRITICAL_ACK` | `analysis_id` | `{ value, ackBy, criticalMsg }` |
| Critical notification logged (structured CLSI GP47 form) | `CRITICAL_NOTIFICATION_LOGGED` | `analysis_id` | `{ value, recipient, recipientRole, method, readBackText, notifiedAt, escalationCount }` |
| Critical value ack failed (Alerts unreachable) | `CRITICAL_ACK_FAILED` | `analysis_id` | `{ value, errorCode, queuedForReplay }` |
| Aliquot created | `ALIQUOT_CREATED` | `sample_id` + `aliquot_id` | `{ count, purpose, linkedTestId? }` |
| Aliquot status changed (Used / Destroyed / Sent) | `ALIQUOT_STATUS_CHANGED` | `aliquot_id` | `{ fromStatus, toStatus, reason? }` |
| Stale-page conflict detected | `STALE_PAGE_CONFLICT` | `analysis_id` | `{ savedBy, savedAt }` |
| Upload attachment | `ATTACHMENT_UPLOADED` | `analysis_id` + `attachment_id` | `{ filename, size }` |
| Delete attachment (result-entry only) | `ATTACHMENT_DELETED` | `attachment_id` | `{ filename }` |
| Refer test | `RESULT_REFERRED` | `analysis_id` + `referral_id` | `{ reason, institute }` |

Reads are NOT audited. All `audit_trail` entries auto-capture actor from Spring Security context.

### Envers Coverage

| Entity | `@Audited`? | Rationale |
|---|---|---|
| `Result` | Yes (existing) | Clinical data |
| `NonConformityEvent` | Yes | Compliance / quality |
| `Test.criticalRangeLowMsg`, `highMsg` (new attributes) | Yes | Configuration |
| `Test.validRangeLow`, `validRangeHigh` (new attributes) | Yes | Configuration |
| `test_interpretation` (new table) | Yes | Configuration |
| `eqa_sample.priority` (new attribute) | Yes | EQA tracking |
| `sample_item.storage_location` link | Yes (existing in storage module) | Sample chain-of-custody |
| `audit_trail` entries themselves | No | Append-only by design |
| `critical_notification` (new table — structured GP47 record) | Yes | Compliance / patient safety |
| `aliquot` (new table) | Yes | Sample chain-of-custody |
| `aliquot_status_history` (new table) | No | Append-only state transitions |

---

## Localization

(Inherits all i18n keys from v2.1 plus the following new keys.)

| i18n Key | English |
|---|---|
| `nav.results` | Results |
| `nav.workplan` | Workplan |
| `breadcrumb.home` | Home |
| `column.samplepatient` | Sample / Patient |
| `column.testdate` | Test Date |
| `column.analyzerresult` | Analyzer Result |
| `column.testname` | Test Name |
| `column.sample` | Sample |
| `column.normalrange` | Normal Range |
| `column.result` | Result |
| `column.currentresult` | Current Result |
| `column.status` | Status |
| `column.flags` | Flags |
| `column.actions` | Actions |
| `heading.programInfo` | Program Info |
| `help.programInfo.readonly` | Program-captured fields are read-only here. Edit them on the originating order. |
| `heading.aliquots` | Aliquots |
| `column.aliquot.id` | Aliquot ID |
| `column.aliquot.purpose` | Purpose |
| `column.aliquot.linkedTest` | Linked Test |
| `column.aliquot.status` | Status |
| `column.aliquot.created` | Created |
| `column.aliquot.storage` | Storage |
| `aliquot.purpose.test` | Test |
| `aliquot.purpose.retention` | Retention |
| `aliquot.purpose.sendout` | Send-out |
| `aliquot.purpose.pool` | Pool |
| `aliquot.purpose.pouroff` | Pour-off |
| `aliquot.status.created` | Created |
| `aliquot.status.inStorage` | In-Storage |
| `aliquot.status.sent` | Sent |
| `aliquot.status.used` | Used |
| `aliquot.status.destroyed` | Destroyed |
| `button.aliquot.create` | Create aliquot |
| `button.aliquot.printLabel` | Print Label |
| `button.aliquot.markUsed` | Mark Used |
| `button.aliquot.destroy` | Destroy |
| `label.aliquot.count` | How many aliquots? |
| `label.aliquot.purpose` | Purpose |
| `label.aliquot.linkedTest` | Test to perform |
| `label.aliquot.destination` | Destination storage |
| `label.aliquot.reason` | Reason / Notes |
| `message.aliquot.empty` | No aliquots from this sample yet. |
| `message.aliquot.poolHeading` | Pool composition |
| `heading.criticalNotification` | Critical Value — Notification Form |
| `heading.criticalNotification.step1` | Step 1 · Who are you contacting? |
| `heading.criticalNotification.step2` | Step 2 · What happened? |
| `button.criticalNotification.reached` | Reached on this attempt |
| `button.criticalNotification.notReached` | Could not reach — log escalation |
| `button.criticalNotification.open` | Open Notification Form |
| `button.criticalNotification.submit` | Confirm Notification |
| `label.criticalNotification.recipient` | Recipient |
| `label.criticalNotification.recipientRole` | Role |
| `label.criticalNotification.method` | Method of communication |
| `label.criticalNotification.readBack` | Read-back text |
| `placeholder.criticalNotification.readBack` | Verbatim what the recipient read back to confirm the value… |
| `label.criticalNotification.time` | Time of notification |
| `label.criticalNotification.firstSuccessful` | First attempt successful? |
| `label.criticalNotification.escalationLog` | Escalation log |
| `label.criticalNotification.additionalNotes` | Additional notes |
| `message.criticalNotification.summary` | Notified {recipient} at {time} via {method} — read-back confirmed |
| `criticalNotification.method.phone` | Phone |
| `criticalNotification.method.inperson` | In-person |
| `criticalNotification.method.secureMsg` | Secure message |
| `criticalNotification.method.pager` | Pager |
| `criticalNotification.method.other` | Other |
| `criticalNotification.role.clinician` | Clinician |
| `criticalNotification.role.nurse` | Nurse |
| `criticalNotification.role.oncall` | On-call clinician |
| `criticalNotification.role.patient` | Patient (direct) |
| `criticalNotification.role.other` | Other |
| `warn.reagent.required` | A reagent lot is required by site configuration (ISO 15189 §6.4.4 traceability). Select a lot to enable Save. |
| `heading.modification.history` | Modification History |
| `label.modification.original` | Original |
| `label.modification.current` | Current |
| `label.modification.reason` | Reason |
| `button.modification.viewAll` | View all history ({count}) |
| `label.row.modifiedTag` | Modified |
| `label.referenceRange.label` | Range |
| `warn.referenceRange.fallback` | No reference range for this demographic — using default |
| `labUnit.placeholder` | Select Test Unit… |
| `labUnit.hematology` | Hematology |
| `labUnit.chemistry` | Chemistry |
| `labUnit.microbiology` | Microbiology |
| `labUnit.serology` | Serology-Immunology |
| `title.action.modifyReleasedBlocked` | Released-result modification requires Validator permission |
| `column.samplePatient` | Sample / Patient |
| `column.testDate` | Test Date |
| `column.analyzerResult` | Analyzer Result |
| `column.testName` | Test Name |
| `column.sample` | Sample |
| `column.normalRange` | Normal Range |
| `column.result` | Result |
| `column.currentResult` | Current Result |
| `column.status` | Status |
| `column.flags` | Flags |
| `column.actions` | Actions |
| `heading.storage` | Storage Location |
| `label.storage.unassigned` | Unassigned |
| `label.storage.path` | Location |
| `label.storage.position` | Position |
| `label.storage.condition` | Condition |
| `button.storage.assign` | Assign storage location |
| `button.storage.move` | Move storage location |
| `label.storage.moveReason` | Reason for move |
| `placeholder.storage.moveReason` | Why is this sample being moved? |
| `heading.storage.picker` | Choose a location |
| `help.storage.unassigned` | This sample item has no storage record. Assign a location to enable freezer tracking. |
| `help.storage.picker` | Drill down through Freezer → Rack → Shelf → Box → Position. |
| `button.storage.confirmAssign` | Confirm assign |
| `button.storage.confirmMove` | Confirm move |
| `label.nce.disposition` | Result Disposition |
| `help.nce.disposition` | What happens to this result? |
| `label.nce.disp.cancel` | Cancel result |
| `help.nce.disp.cancel` | Result is voided. No value reported. Most common for pre-analytical NCEs. |
| `label.nce.disp.reject` | Reject result + reason |
| `help.nce.disp.reject` | Result is permanently deleted. Requires a rejection reason. Use sparingly. |
| `label.nce.disp.retest` | Retest — request new sample / repeat |
| `help.nce.disp.retest` | Result stays pending. A retest order is created. Track via Workplan. |
| `label.nce.disp.refer` | Refer out to external lab |
| `help.nce.disp.refer` | Result is referred. Opens the Referral section above with reason pre-filled. |
| `label.nce.rejectReason` | Rejection reason |
| `placeholder.nce.rejectReason` | Select a rejection reason… |
| `warn.nce.reject` | Rejecting permanently deletes test results. This action cannot be undone. |
| `label.nce.title` | Title |
| `label.nce.description` | Description |
| `label.nce.immediateAction` | Immediate Action |
| `label.nce.suspectedCauses` | Suspected Causes |
| `label.nce.proposedAction` | Proposed Action |
| `label.nce.severity.critical` | Critical |
| `help.nce.severity.critical` | Patient safety risk |
| `label.nce.severity.major` | Major |
| `help.nce.severity.major` | Significant quality impact |
| `label.nce.severity.minor` | Minor |
| `help.nce.severity.minor` | Limited impact |
| `heading.esig` | E-Signature Required |
| `message.esig.intro` | You are about to save |
| `message.esig.results` | result(s) for |
| `message.esig.policy` | Per lab policy, results must be e-signed before they enter the validation queue. |
| `label.esig.password` | Password |
| `placeholder.esig.password` | Enter your password to sign |
| `help.esig.meaning` | Meaning: AUTHORED · Record type: RESULT_BATCH |
| `button.esig.sign` | Sign & Save |
| `button.save.esig` | Save (E-Sign) |
| `legend.nonconforming` | Sample or Order is nonconforming or Test has been rejected |
| `tooltip.nonconforming` | Sample or order is nonconforming |
| `label.serverPage` | Server page |
| `label.patient.id` | ID |
| `label.patient.nationalId` | National ID |
| `label.patient.dob` | DOB |
| `label.patient.sex` | Sex |
| `label.patient.age` | Age |
| `label.notes.legacy` | Past notes (legacy, plain text) |
| `label.method.select` | Method |
| `label.analyzer.select` | Analyzer |
| `placeholder.analyzer.select` | Select analyzer… |
| `label.method.details` | Method Details |
| `placeholder.method.details` | Type MAN-DIFF, MAN-HEM, QNS, CLOT, HEMOLYZED then space to expand… |
| `help.method.macros` | Macros: MAN-DIFF · MAN-HEM · MAN-MICRO · QNS · CLOT · HEMOLYZED · LIPEMIC |
| `heading.reagent.lots` | Reagent Lots (FIFO suggested) |
| `label.reagent.useFirst` | Use First |
| `label.reagent.next` | Next |
| `label.referral.refer` | Refer this test to an external laboratory |
| `label.referral.referred` | Referred |
| `placeholder.result.select` | Select… |
| `placeholder.result.multiselect` | Click to select… |
| `toast.saved` | Result saved and queued for validation. |
| `toast.modified` | Result modified and returned to Validation queue. |
| `toast.nce.created` | NCE |
| `toast.nce.dispositionApplied` | created. Disposition |
| `toast.nce.followup` | Open NCE module to complete investigation. |
| `warn.stalePage` | Result has been saved by another user — refreshing the page. |
| `label.range.ref` | Ref |
| `label.range.abnormal` | Abnormal |
| `label.range.critical` | Critical |
| `label.range.invalid` | Invalid |
| `heading.critical` | Critical Value — Physician Notification Required |
| `message.critical` | Per laboratory policy, the responsible clinician must be notified before or upon result reporting. Acknowledgment will be recorded in the global Alerts dashboard. |
| `button.critical.ack` | I Acknowledge |
| `message.critical.ack` | Critical value acknowledged — clinician notification confirmed and logged to Alerts dashboard. You may now save. |

---

## Validation Rules

(Inherits from v2.1 plus:)

| Field | Rule | Error i18n Key |
|---|---|---|
| Storage move reason | Required when moving an existing location (not on first assign) | `error.storage.moveReasonRequired` |
| NCE Severity | Required to submit NCE | `error.nce.severityRequired` |
| NCE Subcategory | Required when Category selected | `error.nce.subcategoryRequired` |
| NCE Rejection Reason | Required when Disposition = Reject | `error.nce.rejectReasonRequired` |
| E-sig password | Required to complete Save | `error.esig.passwordRequired` |
| Result value (D type) | Must be one of `dictionaryOptions` IDs | `error.result.invalidDictionaryValue` |
| Result value (M type) | All comma-separated IDs must exist in `dictionaryOptions` | `error.result.invalidMultiselectValue` |

---

## Business Rules

(Inherits BR-001 to BR-020 from v2.1; the following are added or amended.)

**BR-021 — Unified Route Migration:** When `results.entry.unifiedRoute` is ON, `/LogbookResults`, `/PatientResults`, `/AccessionResults`, `/StatusResults`, `/RangeResults`, and `/result` MUST 301-redirect to `/Results` with appropriate query-string preservation. When OFF, legacy routes remain functional. Default ON for new installs; OFF for in-place upgrades for one minor version.

**BR-022 — Workplan Deep-Link Breadcrumb:** When the URL contains `?source=WorkPlan*`, the breadcrumb MUST include a "Workplan" crumb before "Results". The crumb links back to the originating Workplan view.

**BR-023 — Storage Location First-Time Assign:** A first-time `Assign storage location` does NOT require a reason. A subsequent `Move storage location` DOES require a reason. Both produce audit_trail entries (`STORAGE_ASSIGNED` / `STORAGE_MOVED`).

**BR-024 — NCE Disposition is the Only Reject Path:** Result rejection MUST flow through an NCE record. The legacy standalone Reject column is removed. `allowResultRejection=false` hides the "Reject result + reason" option from the NCE Disposition radio group; it does NOT disable the entire NCE flow.

**BR-025 — Critical Acknowledgment → Alerts Dashboard:** Acknowledging a critical value on Results Entry MUST POST to `/rest/alerts/critical-acknowledgment` before the Save action proceeds. The Critical Ack is a hard gate. Retry semantics:

| Failure mode | UI behavior | Server behavior |
|---|---|---|
| Network error / 5xx | `ActionableNotification kind="error"` toast with `actionButtonLabel="Retry"` + explanatory body ("The Alerts service is unreachable. Your acknowledgment has been queued for replay."). Save remains blocked until ack succeeds OR user explicitly cancels. | Backend queues the ack write to a durable replay queue when the Alerts service is unreachable for > 5 seconds. Replay attempts every 30 s for 10 min, then alerts SysAdmin role users. |
| 4xx (validation rejection) | Toast `kind="error"` with the server's error message. Save remains blocked. No retry button (user must correct input). | Returns the validation error; does not queue. |
| Success | Silent — Save proceeds immediately. | Ack written to `critical_acknowledgments` table + linked to `audit_trail` entry `CRITICAL_ACK`. |
| Timeout > 10 s | Same as Network error. | Same as Network error. |

Audit: Every Critical Ack attempt (success OR failure) writes one row to `audit_trail` with action `CRITICAL_ACK` or `CRITICAL_ACK_FAILED` so the failure mode is itself traceable for compliance review.

**BR-026 — PII Masking Precedence:** `results.entry.showPatientName` (site-wide override) takes precedence over `PATIENT_DATA_ON_RESULTS_BY_ROLE` (role-based mask). When the site-wide override is ON, the patient name is shown regardless of user role.

**BR-027 — Polymorphic Result Cell Rendering:** The result cell MUST render the input variant matching `result.resultType`:
- `N` = numeric input with live range tier styling
- `D` = single-select Select over `dictionaryOptions`
- `M` = multi-checkbox stored as CSV of `dictionaryOptions` IDs
- `C` = cascading multi-select (parent → child); **out of scope for v1 implementation, documented for future**
- `R` = single-line text input
- `A` = multi-line text area

**BR-028 — Reflex / Calculated Tests in Save Response:** The save endpoint MUST return `reflexTests` and `calculatedTests` arrays in the response. The frontend toast MUST list them so techs know which downstream accessions to expect in the Validation queue.

**BR-029 — STAT Validator Notification:** Saving a result whose linked order priority is `STAT` MUST fire an in-app Notification to every user with the Validator role bundle. The Notification body includes the lab number, test name, and value.

**BR-030 — Stale-Page Conflict Guard:** When the save endpoint detects another user has saved any row in the current page batch between page load and save attempt, the response MUST mark conflicting rows as `failedValidation=true` and the frontend MUST display a warning toast and reload the results list.

**BR-031 — Method Override:** The per-row Method dropdown stores its selection on the result's `method` text column. When Method = Automated or Semi-Automated, the Analyzer dropdown is shown and required. When Method = Manual or Point of Care, the Analyzer dropdown is hidden.

**BR-032 — Result Cell Conflict Resolution at NCE Disposition = Refer:** When NCE Disposition is set to "Refer out", the form auto-fills the Referral section with: referral reason = "NCE-driven referral", institute = blank (user must select), test = current test, sent date = today.

**BR-033 — Critical Value Notification (Optional CLSI GP47 Upgrade):**

**Scope clarification.** ISO 15189:2022 §7.4.5 (Communication of results) requires that critical results be communicated promptly with documented evidence — but the standard is performance-based, *not* prescriptive about format. The minimum compliant evidence is the existing system: critical flag + tech-authored note + audit trail timestamp + acknowledger + Alerts dashboard linkage (BR-025). That baseline already exists in OpenELIS today and satisfies ISO 15189 §7.4.5 for the majority of accredited labs.

CLSI GP47 (Critical Result Communication) is a **CLSI guideline** — recommended practice, not a regulatory requirement. It's commonly cited by CAP-accredited US hospital labs as the gold standard for read-back / escalation tracking, but most ISO 15189 + WHO + public-health-program deployments do not require it. This BR is therefore positioned as an **optional upgrade**, not a baseline requirement.

**Behavior — baseline (flag OFF, default for everyone):**
- When the result enters the `critical` tier, the tech sees the existing critical banner.
- A single "I Acknowledge — clinician notified" button satisfies the ack gate.
- Click → write `CRITICAL_ACK` audit entry → POST to Alerts dashboard (BR-025) → Save unblocks.
- The tech is encouraged (but not required) to add a Note (any visibility) capturing notification context.
- This is sufficient for ISO 15189 §7.4.5 evidence.

**Behavior — opt-in (flag ON, `criticalNotification.requireReadBack=true`):**
- The single-click ack is replaced by the structured Critical Value Communication Form (per §Critical Value Communication Form).
- Form captures: recipient, role, method, read-back text, time, escalation log.
- Submit writes both `CRITICAL_ACK` (baseline path) **and** `CRITICAL_NOTIFICATION_LOGGED` (extended path) audit entries.
- The structured record persists to a new `critical_notification` table that is **linked to the Alerts dashboard ack record via `critical_notification.alerts_ack_id`** — the structured form is a *richer attachment to* the Alerts ack, not a parallel acknowledgment system.

**Defaults:**
- `criticalNotification.requireReadBack` defaults **OFF** for all new and existing deployments.
- Labs that want CAP-level read-back tracking (typical US hospital, large reference lab) opt in at the admin level.
- The baseline behavior covers the long tail of clinical labs, public health programs, and ISO 15189-only deployments.

**No degradation when OFF:** Every critical result still flags, still acks, still writes to Alerts, still produces audit evidence. The flag controls only whether the *extended structured record* is captured.

**Sizing for the range of deployments:**

| Lab profile | Recommended config | What they get |
|---|---|---|
| Low-resource / rural / single-tech | Default OFF | Flag + simple ack + Alerts. Minimum overhead. |
| Public health / PEPFAR / GFTAM | Default OFF | Same baseline + Alerts audit trail. ISO-15189 compliant. |
| Standard ISO 15189 accredited | Default OFF (most) / ON (subset that wants richer documentation) | Baseline is sufficient for most accreditors. ON-mode for labs whose accreditor specifically asks for read-back tracking. |
| CAP-accredited US hospital lab | ON | Full GP47 structured form, escalation log, audit-trail-grade evidence. |

**Validator-page interaction (cross-ref Validation v3):** The Validation page does NOT depend on this flag or the `critical_notification` table. Validators see the existing critical flag + notes + audit evidence regardless. If/when a lab has the structured record and a future Validation spec adds a read-only display, it lives behind the same site flag.

**BR-034 — Reagent Lot Capture Required for Save (ISO 15189 §6.4.4):** When the site config `requireReagentLotsForResults` is ON (default ON for new deployments), Save MUST be blocked until the user has selected at least one reagent lot in the Method & Reagents section. The block presents an inline warning ("Reagent lot is required by site configuration for ISO 15189 §6.4.4 traceability."). When the flag is OFF, current optional behavior applies. Migration: existing deployments default OFF for one minor version, then default ON for new installs.

**BR-035 — Original Value Retrievability (ISO 15189 §7.5.2 / 21 CFR Part 11 §11.10(e)):** When a result has been modified (one or more `RESULT_MODIFIED` or `RESULT_MODIFIED_RELEASED` audit entries), the original value MUST be visible in the expanded panel without requiring a separate audit-log lookup. The Modification History banner displays at the top of the panel and surfaces: `original → current` transition pair, each prior actor and timestamp, each reason. When more than one modification exists, only the most recent transition is shown by default; an expand control reveals the full chronological chain. The original value MUST NEVER be deleted from the system; modifications append to history rather than overwriting.

**BR-036 — Demographic-Aware Reference Range Selection (CLSI EP28-A3c):** Each `Test` MAY have multiple `referenceRanges[]` entries differentiated by `ageMin`, `ageMax`, `sex`, and `lifeStage` selection criteria. At result expansion, the system MUST select the **most specific** matching range (highest count of matching non-null selection criteria), with ties broken by Test Catalog ordering. When no range matches the patient's demographics at sample collection date, the system MUST fall back to the lowest-priority "default" range AND display a warning Tag ("No reference range for this demographic — using default"). The selected range's label MUST be visible to the tech via a Tag next to the displayed range; a Popover on the Tag MUST show the selection criteria and list other configured ranges.

**BR-038 — Note Model: Visibility × Context (dual axis):** Every note on a result carries two independent attributes:

| Axis | Values | Meaning |
|---|---|---|
| **`note.visibility`** | `internal` (default) / `external` | `external` notes appear on the patient / clinician report. `internal` notes are in-lab-only. |
| **`note.context`** | `entry` / `modification` / `validation` | Workflow stage when the note was authored. Drives display badge but does NOT determine visibility. |

The two axes are independent: a tech-authored entry-context note can be either In Lab Only OR Send with Result, at the tech's discretion. The "Add Note" form on the Results Entry page presents a visibility radio (default `internal`) so the tech explicitly chooses whether the note flows to the patient report. The display shows both badges (context + visibility) so anyone reading the note knows where it ends up.

**Audit:** When a note's `visibility` is `external`, the `NOTE_ADDED` audit_trail entry MUST include `visibility: "external"` in the payload. Changing visibility on an existing note is treated as a state change and produces a separate `NOTE_VISIBILITY_CHANGED` audit entry.

**Patient report rendering:** Downstream patient/clinician report generation filters by `visibility === "external"`. Notes with `visibility=internal` never reach the report regardless of context. This is the single decision point for patient-report inclusion — context (entry / modification / validation) is metadata, not a gating signal.

**Migration:** Legacy `note.type` field aliases:
- `note.type === "internal"` → `{ visibility: "internal", context: "entry" }`
- `note.type === "external"` → `{ visibility: "external", context: "entry" }`
- `note.type === "modification"` → `{ visibility: "internal", context: "modification" }`
- `note.type === "validation"` (only appears in Validation page data, but supported here for cross-page consistency) → `{ visibility: "internal", context: "validation" }`

---

**BR-037 — Aliquot Lifecycle (Vector pool deconvolution + general send-out):** An aliquot derived from a sample MUST inherit the source sample's accession with a suffix (`LABNO.X-Y` where X is the source ordinal and Y is the aliquot ordinal). Aliquots have an independent status lifecycle (Created / In-Storage / Sent / Used / Destroyed) tracked separately from the source sample. Creating an aliquot for a Test purpose MUST create a new analysis row linked to the aliquot; creating an aliquot for Retention or Send-out MUST NOT create new test rows. Aliquot creation from Results Entry requires Analyst OR SampleReception bundle. Destroy / mark-used actions require Analyst.

---

## Acceptance Criteria

### Unified Route & Navigation
- [ ] `/Results` is the canonical route; all 6 legacy routes 301-redirect to it when `results.entry.unifiedRoute` is ON **[BR-021]**
- [ ] Workplan deep-link adds "Workplan" crumb to the breadcrumb **[BR-022]**
- [ ] Server-side pagination indicator (top, prev/next) appears when result set spans multiple server pages

### Sample / Patient Column
- [ ] Patient avatar (color-hashed initials) displayed
- [ ] Accession number includes copy-to-clipboard button
- [ ] Nonconforming icon shown when `result.nonconforming=true`
- [ ] EQA priority badge (STANDARD/URGENT/CRITICAL) displayed when `result.isEqaSample`
- [ ] Patient name shown OR ID+sex+age shown OR masked, per BR-026 precedence

### Inline Test Date + Time
- [ ] Test Date column has inline `DatePicker` + `TimePicker` per row, disallowFutureDate

### Polymorphic Result Cell
- [ ] N type renders numeric input with live range tier styling **[BR-027]**
- [ ] D type renders single Select over `dictionaryOptions` **[BR-027]**
- [ ] M type renders multi-checkbox stored as CSV **[BR-027]**
- [ ] C type documented as out-of-scope-for-v1 with implementation plan in Dependencies **[BR-027]**
- [ ] Current Result column shows previous value with dictionary IDs resolved to labels for D/M types

### Program Info Section (NEW)
- [ ] Program Info section appears only when `result.program` is set; hidden entirely otherwise
- [ ] Section header shows BookOpen icon + program name as a magenta badge
- [ ] Fields render in a 3-column grid, up to 15 fields
- [ ] `longtext` and long `text` fields span all 3 columns
- [ ] All fields read-only with help text noting they are edited on the order
- [ ] EQA programs show Panel ID, Round Number, Specimen Code, Expected Analyte, Submission Deadline, Lab Code, Round Coordinator, Provider Comments by default
- [ ] RETROCI study programs render hardcoded ARV / EID / VL / Indeterminate field sets when `useRetroCIStudyForms` flag is ON
- [ ] Section placed between Order Info and Storage Location

### Storage Location Section (NEW)
- [ ] Storage section always visible in expanded panel
- [ ] When unassigned, "Assign storage location" primary button shown with help text
- [ ] When assigned, full path + position + condition displayed with "Move storage location" button
- [ ] Storage picker shows freezer/refrigerator tiles with drill-down
- [ ] Move requires "Reason for move" text input before Confirm enables **[BR-023]**
- [ ] First assign does NOT require a reason **[BR-023]**
- [ ] Audit trail entries written on assign + move

### Method & Reagents Section (inline; was a tab)
- [ ] Method dropdown shows Manual/Automated/Semi-Auto/POC
- [ ] Analyzer dropdown shown only when Method ∈ {Automated, Semi-Automated} **[BR-031]**
- [ ] Reagent Lots table shows FIFO-suggested lot with "Use First" badge
- [ ] Expiring lots (within 7 days) show amber warning badge

### Referral Section (inline; was a tab)
- [ ] Checkbox toggles referral fields
- [ ] When NCE Disposition = Refer, Referral section auto-fills **[BR-032]**

### Order Info Section (inline; was a tab)
- [ ] 3-column grid layout
- [ ] Multi-line fields (history, diagnosis) span the row
- [ ] All fields read-only on Results page

### Attachments Section (inline; was a tab)
- [ ] Order Entry files marked purple, Result Entry files marked teal
- [ ] Delete button only for Result Entry files **[BR-011]**
- [ ] Upload via Carbon FileUploader (JPEG/PNG/PDF)

### Tabs (only QA/QC + History remain)
- [ ] QA/QC tab shows overall + per-control table + analyzer status
- [ ] History tab shows previous results with delta computation
- [ ] No other tabs in the expanded panel

### Critical Acknowledgment
- [ ] Acknowledgment POSTs to `/rest/alerts/critical-acknowledgment` before Save proceeds **[BR-025]**
- [ ] On network/5xx failure, ActionableNotification with retry button shown; Save blocked **[BR-025]**
- [ ] Backend queues ack for replay (every 30s for 10min) when Alerts service unreachable >5s **[BR-025]**
- [ ] On 4xx, error toast shown; Save blocked; no retry button **[BR-025]**
- [ ] Both success and failure paths write to `audit_trail` (`CRITICAL_ACK` / `CRITICAL_ACK_FAILED`) **[BR-025]**

### Inline NCE Form
- [ ] Severity radios with descriptions (Critical/Major/Minor)
- [ ] Title, Description, Immediate Action, Suspected Causes, Proposed Action fields all present
- [ ] Result Disposition radio with 4 options: Cancel / Reject / Retest / Refer **[BR-024]**
- [ ] Rejection reason Select shown when Disposition=Reject (required) **[BR-024]**
- [ ] "Reject result + reason" option hidden when `allowResultRejection=false` **[BR-024]**
- [ ] Disposition status mapping per BR table (Cancel→cancelled, Reject→cancelled (deleted), Retest→pending, Refer→awaiting-validation w/ referral pre-fill)

### E-Signature on Save
- [ ] Save button opens E-Signature modal with password input
- [ ] Modal body shows result count + accession context
- [ ] Save POST includes eSignature envelope (meaning=AUTHORED, recordType=RESULT_BATCH)

### Post-Save Toasts
- [ ] Reflex tests list shown in toast when triggered **[BR-028]**
- [ ] Calculated tests list shown in toast when triggered **[BR-028]**
- [ ] STAT result fires Validator-role notification stub **[BR-029]**
- [ ] Stale-page conflict — when backend reports another user has saved any row in the current page batch, frontend shows warning toast and reloads list with the conflicting row marked `failedValidation=true` **[BR-030]**

### Permissions on Modify Released
- [ ] Non-Validator users see disabled "Modify Result" button on Released rows with tooltip explaining the Validator-permission requirement
- [ ] Validator users see normal enabled "Modify Result" button on Released rows

### NCE Disposition → Refer-out Auto-Fill
- [ ] When NCE Disposition is set to "Refer out", Referral section opens automatically with reason="NCE-driven referral" pre-filled and Refer checkbox checked **[BR-032]**
- [ ] Institute field remains unselected — user must choose

### Critical Value Acknowledgment (Baseline — flag OFF, default)
- [ ] When result enters critical tier, the critical banner shows a single "I Acknowledge — clinician notified" button **[BR-033]**
- [ ] Click → writes `CRITICAL_ACK` audit + POSTs to Alerts (BR-025) + Save unblocks **[BR-033]**
- [ ] Tech is encouraged but not required to add a Note (any visibility) capturing notification context **[BR-033]**
- [ ] This is the default behavior for all new and existing deployments **[BR-033]**

### Critical Value Communication Form (Optional — flag ON)
*Acceptance criteria below apply only when `criticalNotification.requireReadBack` is ON at the site level.*
- [ ] When the flag is ON and result enters critical tier, "Open Notification Form" button replaces the single-click ack **[BR-033]**
- [ ] Form requires: Recipient, Recipient Role, Method, Read-back text, Time of notification **[BR-033]**
- [ ] When First-attempt-successful=No, Escalation Log is required with at least one entry **[BR-033]**
- [ ] Submit triggers POST to `/rest/alerts/critical-acknowledgment` + writes BOTH `CRITICAL_ACK` (baseline) AND `CRITICAL_NOTIFICATION_LOGGED` (extended) audit entries **[BR-033]**
- [ ] Structured record persists to `critical_notification` table with `alerts_ack_id` FK to the Alerts ack — single acknowledgment system, GP47 form is a richer attachment **[BR-033]**
- [ ] After successful log, form collapses to read-only summary card; Save unblocks **[BR-033]**
- [ ] Editing a logged notification requires Validator bundle and creates a modification-history entry **[BR-033, BR-035]**
- [ ] When the flag is OFF (default), this UI does not appear; baseline single-click ack applies instead

### Reagent Lot Capture Gate (ISO HIGH A2 / ISO 15189 §6.4.4)
- [ ] When site config `requireReagentLotsForResults` is ON, Save is blocked until at least one reagent lot is selected **[BR-034]**
- [ ] Inline warning shown next to Save button explaining the block **[BR-034]**
- [ ] When config is OFF, current optional behavior applies **[BR-034]**

### Modification History Banner (ISO HIGH A3 / CFR Part 11)
- [ ] When `result.modificationHistory[]` has entries, a banner renders at the top of the expanded panel **[BR-035]**
- [ ] Banner shows: original → current value, actor, timestamp, reason **[BR-035]**
- [ ] When multiple modifications exist, only most recent shown by default; expand control reveals full chain **[BR-035]**
- [ ] Table row shows a small "Modified" Tag in warm-gray for rows with any modification history **[BR-035]**
- [ ] Original value MUST NEVER be deleted; modifications append-only **[BR-035]**

### Demographic-Aware Reference Range Selection (ISO HIGH B2 / CLSI EP28-A3c)
- [ ] System selects the most specific matching `referenceRange` for the patient at sample collection date **[BR-036]**
- [ ] Selection criteria: ageMin, ageMax, sex, lifeStage all considered; ties broken by Test Catalog priority **[BR-036]**
- [ ] When no range matches, falls back to default + displays warning Tag "No reference range for this demographic" **[BR-036]**
- [ ] Selected range's label shown next to displayed range as a Tag; Popover lists all configured ranges **[BR-036]**

### Aliquots Section (ISO HIGH I1)
- [ ] Aliquots section always rendered when user has Analyst or SampleReception bundle **[BR-037]**
- [ ] Table shows existing aliquots: Aliquot ID (`LABNO.X-Y`), Purpose, Linked Test, Status, Created, Storage, Actions **[BR-037]**
- [ ] "Create aliquot" form: count, purpose, linked test (when purpose=Test), destination storage, reason/notes **[BR-037]**
- [ ] Submitting auto-assigns `LABNO.X-N` suffixes and creates analysis rows for Test-purpose aliquots **[BR-037]**
- [ ] Destroy / Mark Used actions require Analyst bundle **[BR-037]**
- [ ] Pool composition surfaced read-only above the aliquot table when sample is a pool (vector deployments)
- [ ] Audit: `ALIQUOT_CREATED` and `ALIQUOT_STATUS_CHANGED` rows written

### Patient Privacy Precedence
- [ ] Site-wide `showPatientName=true` overrides role-based mask **[BR-026]**
- [ ] Role-based mask hides name when `PATIENT_DATA_ON_RESULTS_BY_ROLE=true` AND user lacks `PatientResults` perm **[BR-026]**

### Nonconforming Legend
- [ ] Always-visible legend strip above the results table

### Notes — Legacy Past Notes
- [ ] Legacy plain-text notes (with linebreaks) rendered alongside structured notes

### Non-Functional
- [ ] All UI strings wrapped in `t(key, fallback)`
- [ ] All i18n keys present in message properties file
- [ ] Carbon Component Map respected — no raw HTML where Carbon component exists
- [ ] Audit trail entries written per table in §Permissions & Audit
- [ ] Envers `@Audited` annotation set per table
- [ ] WCAG 2.1 AA: keyboard navigation, screen reader labels, color contrast
- [ ] French locale tested — no layout breakage from longer strings

---

## Migration Notes

### Routes Retired

| Old | New |
|---|---|
| `/LogbookResults` | `/Results?labUnit=...` (redirect) |
| `/PatientResults` | `/Results?patientId=...` (redirect) |
| `/AccessionResults` | `/Results?accession=...` (redirect) |
| `/StatusResults` | `/Results?status=...` (redirect) |
| `/RangeResults` | `/Results?labNumberFrom=...&labNumberTo=...` (redirect) |
| `/result` | `/Results` (redirect) |

### UI Patterns Retired

| Old | New | Rationale |
|---|---|---|
| Accept Unconditionally (OGC-745) 3-state inline guard | **Removed** | Workflow rejected by Casey 2026-05-28; relies on validator review instead |
| Standalone Reject column | NCE Disposition radio | Forces every rejection to file an NCE — closes audit gap **[BR-024]** |
| Method tab | Inline Method & Reagents section | Used every save; doesn't belong behind a tab |
| Order Info tab | Inline Order Info section | Read-only context; always visible |
| Attachments tab | Inline Attachments section | Often empty; section header collapses cleanly when so |
| Referral tab | Inline Referral section | Checkbox-gated; matches live app pattern |
| Plain Save button | Save (E-Sign) | E-signature was always mandatory; UI now reflects it |
| Internal / External note types | "In Lab Only" / "Send with Result" | Terminology harmonization (v2.x carryover) |

### Schema Migrations Required

Listed in §Data Dependencies. Summary: 2 columns added to `test`, 1 column added to `eqa_sample`, 1 new table (`test_interpretation`), 1 enum extension (`result_type` += 'C'), 1 future-use table family (`cascading_result_*`). All new attributes `@Audited`.

---

## Future Considerations

1. **Cascading Multi-Select (C) implementation** — Not in v1. Implementation requires extending the `result_type` enum to include 'C' and adding `cascading_result_parent` + `cascading_result_child` tables and a 2-step UI (parent Select → child MultiSelect). Used for nested findings like organism → antibiotic sensitivity panels. **Prerequisite:** dependency review across HL7 export, FHIR export, reports, Validation, and Test Catalog admin to confirm no downstream consumer breaks on the enum extension. Track as its own spec.
2. **Bulk Save** — Select multiple rows in the table for batch e-sign.
3. **Custom Worklists** — Save filter combinations as named worklists.
4. **Real-Time Updates** — WebSocket for live analyzer-import updates.
5. **Mobile / Tablet Optimization** — Bench-tablet responsive layout.
6. **Reagent Inventory Frontend Integration** — Re-enable the test-kit / reagent inventory columns when the inventory frontend stabilizes (currently commented out in source per `LogbookResultsRestController.java` lines 332-346).
