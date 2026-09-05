# Pathology Case View v2 — Slicing Guide

**Non-binding suggestion for the implementer.** The developer slices; this is a starting order that respects the dependencies, not a contract.

**FRS:** `pathology-case-view-v2.md` v2.0
**Shell:** `case-view-shell.md` v1.0
**Mockup:** `pathology-case-view-mockup.jsx`
**Preview:** `pathology-case-view-v2-preview.html`
**Epic:** `OGC-264`
**Implementer:** community volunteer — existing OpenELIS contributor, new to the pathology module
**Scope of this handoff:** Case View Shell + Pathology only. **IHC (`OGC-265`) is deliberately held** until the interpretive threshold-set mechanism exists in the Catalog Subscription epic, so that no guideline value gets compiled into the application in the meantime.

---

## Read this before planning the volunteer's commitment

**Total: 5 versions, 15 slices, 91 points.** At a nominal 20 points per two-week sprint that is roughly ten weeks of sustained effort. That is a large ask of a volunteer, and framing it as "here is the whole epic" is how volunteer contributions stall at 40% with a half-migrated schema on a branch.

**Recommended framing: ask for v1 and v2 (39 points, ~4 weeks) as the initial commitment**, with v3–v5 offered rather than assigned. v1 and v2 together are genuinely shippable and genuinely useful on their own — after them the lab can see where every case is, and blocks and slides are individually identified and traceable, which is the accreditation-relevant half. If the volunteer wants to continue, the remaining versions are already ordered for them. If they stop, nothing is left half-built.

**One slice needs a named reviewer arranged before the volunteer starts.** Slice 1 changes the `PathologyStatus` enum, which the shipped Pathology Dashboard filters on. It is a migration against live data plus a change to shipped behaviour, and it is the volunteer's first PR. That is a demanding opening. It is sequenced first because everything else depends on it, but it should not be reviewed casually.

---

## v1 — Stage visibility (21 points)

*Ships: the lab can see which bench stage every case is actually in, and the case view opens on real data.*

| Slice | Points | FRs | Cross-cutting included |
|---|---|---|---|
| S1 · Lab manager sees the real bench stages on the dashboard filter and case header | 8 | FR-2.1, FR-2.2, FR-2.6 | localization `pathology.stage.*`; existing `Histopathology` bundle |
| S2 · Shared case-view shell components, used by the pathology screen | 8 | Shell S-1, S-3, S-4, S-6, S-7 | localization `caseView.*`; a11y (`aria-expanded`, keyboard headers) |
| S3 · Technician opens a case and sees its stage progress and case information | 5 | FR-1, FR-2.3, S-5 | localization `pathology.section.*`, `pathology.locked.*` |

**S1 in detail**, because it is the risky one. Rework `PathologyStatus` to the eleven values in FR-2.1: add `ACCESSIONED`, `DECALCIFICATION`, `EMBEDDING`, `COVERSLIPPING`, `UNDER_REVIEW`; rename `SLICING` → `MICROTOMY`; retire `CUTTING` and `ADDITIONAL_REQUEST`. Liquibase changeset under `2.9.x.x` mapping existing rows per FR-2.2 (`CUTTING`→`GROSSING`, `SLICING`→`MICROTOMY`, `ADDITIONAL_REQUEST`→`READY_PATHOLOGIST`). Update `DisplayListService.createPathologyStatusList()`, the Pathology Dashboard's stage filter, and the Cypress fixture at `frontend/cypress/pages/DashBoard.js` that selects `"Processing"`. Add the `pathology.stage.<value>.enabled` common properties from FR-2.3 with `ACCESSIONED`, `GROSSING`, `READY_PATHOLOGIST` and `COMPLETED` non-disableable. **The open-request flag replaces `ADDITIONAL_REQUEST`** — derived from `pathology_request` rows at `OPENED`, which the `requests` collection already supports.

**S2 in detail.** The shell components, built once and consumed by all three case views: the `PatientHeader` additions (status Tag, assigned staff), the `Section` accordion shell carrying title / badge / locked + `lockedHint` / `aria-expanded`, the four-state section model as a derived function rather than stored state, the sticky Case Summary panel, and the action bar with a status-and-role-driven primary action. Cytology and IHC adopt these later; nothing in them is pathology-specific.

**Over the 20-point target by 1.** Justified: S1 and S2 are both prerequisites for S3 and neither splits cleanly — S1 is one migration and S2 is one component set. Alternative if the volunteer prefers a tighter first sprint: move S3 to v2 and ship v1 at 16 points.

---

## v2 — Identified objects (18 points)

*Ships: blocks and slides become individually identified, parented and traceable, and reconciliation stops being a number someone typed. This is the accreditation-relevant half — `ISO 15189:2022` 7.2.6.1(g).*

| Slice | Points | FRs | Cross-cutting included |
|---|---|---|---|
| S4 · Blocks and slides carry a designation, a barcode and a parent, and are deactivated rather than deleted | 8 | FR-9.1–9.5, S-10.4, FR-18 | Envers on five entities; `orphanRemoval` removal; localization `pathology.label.*` |
| S5 · Technician records the macroscopic description and the cassettes cut from the specimen | 5 | FR-3 | localization; `Histopathology` bundle |
| S6 · Technician embeds cassettes and the case shows which one is outstanding | 5 | FR-6, FR-9.6 | localization `pathology.badge.*` |

**S4 carries the schema work the FRS declares as dependencies**, and it belongs here rather than in a foundation slice because this is where it first becomes user-visible: `pathology_block` gains `designation`, `barcode`, `cassette_state`, `tissue_type_id`, `part_designation`, `active`; `pathology_slide` gains **`block_id`** (the parentage that does not exist today), `designation`, `barcode`, `level`, `stain_id`, `stain_status`, `active`. Add `@Audited` to `PathologySample`, `PathologyBlock`, `PathologySlide`, `PathologyRequest` and `PathologyConclusion` — none are annotated today — and remove `orphanRemoval = true` from the five collections on `PathologySample`, because today removing a child from a collection hard-deletes a row that `42 CFR 493.1105` requires retained for ten years. Add the `pathology.identifier.*` configuration from FR-9.3.

**S6 is where the design's central argument lands in code:** the badge reads "3 of 4 embedded" as a count computed over rows, and the section names cassette A4 as outstanding. No count column, no count input. If a reviewer sees a stored count anywhere in this slice, the slice is wrong.

---

## v3 — Microtomy and the label control (18 points)

*Ships: the single highest-value safety control on the screen. 52% of all mislabelling happens at this one transition.*

| Slice | Points | FRs | Cross-cutting included |
|---|---|---|---|
| S7 · Every stage records who did it and when, and a case can be sent forward or returned with a reason | 8 | FR-2.4, FR-2.5, Data Model `PathologyStageEvent` | localization `pathology.action.*`; audit verbs |
| S8 · Technician cuts slides from a block and sees them nested under it | 5 | FR-7.1, FR-7.2 | localization |
| S9 · Slide labels are scan-verified against the block before sectioning | 5 | FR-7.3–7.5 | localization `pathology.banner.labelMismatch`; a11y `role="alert"` |

S7 introduces `pathology_stage_event` — the append-only table that satisfies `ISO 15189:2022` 7.3.1(d), and the reason no per-stage operator or timestamp columns go on `pathology_sample`. Operator from the session, timestamp from the server clock; **no typed name and no typed date anywhere on the screen.**

S9 delegates printing to the shared `barcodeWorkflow` flow — `PathologyCaseView.jsx` already imports `PostSavePrintDialog`, and `OGC-284` schedules this screen as M8 "Pathology family rollout via shared orchestration". Do not build a print dialog. The degradation path in FR-7.5 (`pathology.microtomy.scanVerificationRequired`) matters for sites without scanners and should not be skipped.

---

## v4 — Staining through to the pathologist (16 points)

*Ships: the bench half is complete and cases reach the pathologist with their outstanding work visible.*

| Slice | Points | FRs | Cross-cutting included |
|---|---|---|---|
| S10 · Technician records staining and coverslipping QC, individually or in a batch | 5 | FR-8, FR-2.3 | localization; stage-enablement config |
| S11 · Pathologist requests more work from the bench and the bench sees it | 8 | FR-10 | localization; audit verbs; the open-request flag from S1 |
| S12 · Anyone opening a case sees the patient's prior anatomic-pathology results | 3 | Shell S-2 | localization `pathology.empty.noPriorResults` |

S11 extends the **existing** `pathology_request` table — `request_kind`, `target_block_id`, `target_slide_id`, `priority`, `result_block_id`, `result_slide_id`, `cancel_reason` — leaving the shipped `type` (`DICTIONARY`/`TEXT`) and `value` alone. The instruction text stays in `value`. Do not create a new request entity; the December 2025 design did and that is the mistake this FRS exists to undo. The target picker must be **filtered by request kind** (FR-10.4).

S12 is small, cross-bench and benefits all three screens; it is here rather than in v1 because it is the least urgent shell element.

---

## v5 — Sign-out and report (18 points)

*Ships: the pathologist can complete a case end to end.*

| Slice | Points | FRs | Cross-cutting included |
|---|---|---|---|
| S13 · Pathologist records findings, techniques and a coded conclusion | 8 | FR-12, FR-13 | localization; `Histopathology` bundle; macro-field consumption |
| S14 · Pathologist requests a second opinion and its outcome is recorded | 5 | FR-11, Data Model `PathologyConsultation` | localization; audit verbs |
| S15 · Pathologist signs out, the report opens in a new tab, and malignant conclusions raise a critical result | 5 | FR-14, FR-15, S-8.3, S-8.4 | localization `pathology.banner.criticalResult`; a11y `role="alert"` |

S13 persists to the **existing** `grossExam` and `microscopyExam` columns and creates `pathology_conclusion` rows with `type = DICTIONARY` for coded conclusions. No new diagnosis table. Techniques use the **existing** `PathologyTechnique` entity, which the December 2025 FRS wrongly declared new.

S15's report rows open in a new tab on one click, with no per-row View / Download / Print / Email buttons (`D-054`). Generation is gated on both descriptions being non-empty and at least one conclusion existing — **the same condition its disabled tooltip states.** The December 2025 mockup gated on case status, tooltipped a different condition, and was permanently dead; that is the specific bug this slice must not reproduce.

---

## Dependency order — what must not be reordered

```
S1 (enum + migration)
 ├─► S3 (stage rail reads status)
 ├─► S11 (open-request flag replaces ADDITIONAL_REQUEST)
 └─► S7 (transitions write stage events)
S2 (shell components) ──► S3, and every later UI slice
S4 (designation + barcode + block_id parentage + Envers + no orphanRemoval)
 ├─► S5 (cassette rows)
 ├─► S6 (derived reconciliation)
 └─► S8 (slides nested under their block — needs block_id)
S8 ──► S9 (scan verification needs slide rows)
S8 ──► S10 (staining operates on slides)
S13 ──► S15 (generation gated on findings + conclusion)
```

External dependencies that are **not** the volunteer's to build, and where each is owned:

| Needed by | Dependency | Owner | If it is not ready |
|---|---|---|---|
| S9 | shared `barcodeWorkflow` print orchestration | `OGC-284` (built; rollout scheduled) | print through the existing `PostSavePrintDialog` as-is; do not build a dialog |
| S9, FR-9.4 | label preset fields | `OGC-285` | use the four fixed system presets; custom presets are unattachable until completion-v2 FR-66 |
| S5, S13 | macro expansion in text fields | `OGC-788` (in progress) | plain `TextArea`; the field is macro-ready, the engine arrives later |
| S15 | report delivery and print presets | `OGC-1031`, anchor `OGC-431` | list and open only |
| S15 | `CriticalResultEvent` consumer | Critical Result Ack (TODO) | emit anyway; `criticalResultAcknowledgmentEnabled` gates only the consumer, and sign-out is never blocked |
| S4, S6 | shared sample Storage model + `LocationPickerModal` | `OGC-657`, PR #3840 open | leave block storage on the existing free-text `location` and mark the field interim |
| FR-5 | tissue processor run registry | not built | free-text run reference on the stage event, with the banner from `pathology.banner.runReferenceInterim` |

---

## Coverage check

- Every FR from the FRS appears in at least one slice: ✅ — FR-1 → S3, FR-2 → S1/S7, FR-3 → S5, FR-4 → S10 (stage enablement), FR-5 → S7, FR-6 → S6, FR-7 → S8/S9, FR-8 → S10, FR-9 → S4/S6, FR-10 → S11, FR-11 → S14, FR-12 → S13, FR-13 → S13, FR-14 → S15, FR-15 → S15, FR-16 → per-slice, FR-17 → per-slice, FR-18 → S4
- Every UI element in the mockup is built by at least one slice: ✅
- Every slice is titled and scoped around user value, not a technical layer: ✅ — including S1, S2 and S4, which carry schema work but are titled and justified by what the user gets
- Cross-cutting folded into its user-facing slice — localization ✅ (per slice), access/roles ✅ (existing `Histopathology` bundle, stated per slice), audit verbs ✅ (with the slice that emits them)
- No version depends on a later one: ✅
- No slice is backend-only: ⚠ **S2 is the exception** — shared components with no user-facing behaviour of their own until S3. Justified: they are consumed by three screens, and inlining them into S3 would mean cytology and IHC later extract them from pathology, which is how the current drift happened.

---

## Deliberately not in this plan

- **IHC (`OGC-265`)** — held pending the threshold-set mechanism.
- **Cytology amendment** — three small changes in `closing-actions.md`; core-team work, not volunteer work, since it touches an approved spec.
- **The JSX mockup** — a handoff artifact, not a slice. Nothing in it ships.
- **Synoptic conclusion capture, WSI, processor run registry, molecular subtype** — out of scope in the FRS, and each named there with its owner.

---

*End of slicing guide — 2026-09-04*
