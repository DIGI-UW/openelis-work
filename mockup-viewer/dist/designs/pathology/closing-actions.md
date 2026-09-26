# Closing actions — AP case-view harmonization pass

**2026-09-04.** Accompanies `case-view-shell.md` v1.0, `pathology-case-view-v2.md` v2.0 and `ihc-case-view-v2.md` v2.0.

Three things need applying by hand, because none of them belong to the files above: an amendment to the cytology FRS, three new rows plus one refresh in the spec registry, and eleven new decision-log entries. The registry and decision log live in the `openelis-design` skill's `references/`, and the on-disk copy of a synced skill is a read-only cache — edits there do not reach the account skill — so they are written out here to be applied at the source.

---

## 1. Cytology Case View v2.0 — amendment

`designs/pathology/cytology-case-view.md` conforms to **nine of the ten** shell elements as written. It needs three small changes, not a rewrite.

**1.1 — Re-point the inherited pattern.** Its `## Related and prior art` opens:

> - **Pathology Case View** (`designs/pathology/pathology-case-view.md`) — the parent design pattern for the pathology module; layout conventions (PatientHeader, sticky summary, slide list) follow it.

That names the **December 2025** pathology FRS as the parent, so cytology v2 is formally inheriting from a document that was never brought up to standard. Replace with:

> - **Case View Shell** (`case-view-shell.md`) — the shared structural contract this screen implements; layout conventions (PatientHeader, prior-results panel, sticky Case Summary, action bar, section state model, critical-result hook) are defined there. This screen is the shell's reference implementation for the critical-result hook.
> - **Pathology Case View v2** (`pathology-case-view-v2.md`) — sibling case-detail screen; the shell's heaviest adopter and the only one rendering the progress rail.

**1.2 — Broaden S-2 from "Prior Pap result" to the shared panel.** FR-1's Data Sources table currently has:

> | Prior Pap result | Most recent prior `cytology_sample` for same patient, displayed as `[Result] (date)` — read from sibling samples on the same patient |

Shell element S-2 is cross-bench: a cytopathologist benefits from seeing a prior breast biopsy or an IHC panel, not only a prior Pap. Replace with the shared prior-results panel per S-2.1–S-2.4, reading the patient's prior anatomic-pathology cases across pathology, IHC and cytology, capped and with a link to the full history. The existing narrower behaviour becomes the first row of that panel rather than a separate field.

**1.3 — Add a Shell Conformance table** after `## Layout`, per the shell's Conformance requirement. Content, ready to paste:

| Element | Status | Variation / note |
|---|---|---|
| S-1 PatientHeader | conforms | — |
| S-2 Prior related results | conforms | broadened from prior-Pap-only per amendment 1.2 |
| S-3 Accordion sections | conforms | four sections; section 1 collapsed by default |
| S-4 Section state model | conforms | sections 3 and 4 disable on `satisfaction = UN_SATISFACTORY_FOR_EVALUATION` (FR-2.4); the ASCCP panel carries a second, nested lock |
| S-5 Progress rail | conforms — **off** | one gated section, well below the S-5.1 threshold; the wizard was deliberately removed in v2 |
| S-6 Case Summary panel | conforms | — |
| S-7 Action bar | conforms | `Discard changes` / `Save draft` / `Sign out & finalize`, with the unsatisfactory-specimen carve-out |
| S-8 Status transitions | conforms | `CytologyStatus`, with reopen voiding the prior report |
| S-9 Critical-result hook | conforms | the origin of this shell element |
| S-10 Identified objects | conforms | slides only; no blocks concept in cytology |

**Not required to change:** its route (`:cytologySampleId` is already correct), its permissions model, its localization convention, its audit verbs or its Envers declarations. All four already match the shell.

---

## 2. `references/spec-registry.md` — three new rows, one refresh

Add:

| Feature | Entities touched | Routes / pages | Shared concepts | Upstream deps (→) | Downstream deps (←) | Jira | Docs | Status |
|---|---|---|---|---|---|---|---|---|
| Case View Shell | *(none of its own)* — contract over `PathologySample`, `ImmunohistochemistrySample`, `CytologySample` | *(no route)* — shared pattern | **PatientHeader**, **prior-results panel**, **section state model**, **action bar**, **CriticalResultEvent**, identified-objects rule, audit-verb + Envers + i18n conventions | Critical Result Ack (TODO) | **Pathology v2, IHC v2, Cytology v2 all conform** | **OGC-1195** (Story; relates to OGC-264/265/266) | pending | specced |
| Pathology Case View v2 | PathologySample (**PathologyStatus reworked**), PathologyBlock, PathologySlide, PathologyRequest, PathologyConclusion, PathologyTechnique, PathologyReport, **PathologyStageEvent (NEW)**, **PathologyConsultation (NEW)** | `/PathologyCaseView/:pathologySampleId`; Pathology Dashboard stage filter | Case View Shell, **identified objects + derived reconciliation**, configurable identifier scheme, scan-verified labelling, **CriticalResultEvent**, Deactivate | **PathologyStatus rework + migration (blocks)**; Envers + `orphanRemoval` removal on all pathology entities (blocks); `barcodeWorkflow` OGC-284; Macro Library OGC-788; Report Print Queue OGC-1031; Storage OGC-657 | **IHC v2 (reads its blocks/slides + receives its referral)**; Pathology Dashboard (filter values change) | OGC-264 | pending | specced |
| IHC Case View v2 | ImmunohistochemistrySample (**+`UNDER_REVIEW`**), ImmunohistochemistrySampleReport, **IhcMarkerResult (NEW)**; reads PathologyBlock + PathologySlide | `/ImmunohistochemistryCaseView/:immunohistochemistrySampleId` | Case View Shell, **versioned interpretive threshold sets**, **CriticalResultEvent**, pre-analytic times, controls | **Interpretive threshold sets — Catalog Subscription epic (blocks interpretation)**; Pathology v2 (identifier scheme + referral); Macro Library OGC-788; Report Print Queue OGC-1031 | Molecular subtype (parked); AMR breakpoints share the threshold-set mechanism | OGC-265 | — | specced (held — threshold sets) |

Refresh the existing cytology row (if present) to note `conforms to Case View Shell v1.0` under Shared concepts, and add `Case View Shell` to its upstream deps.

---

## 3. `references/decision-log.md` — eleven new entries

| ID | Decision | Why | Applies to | Scope | Status | Source |
|---|---|---|---|---|---|---|
| D-046 | The **Case View Shell** is the canonical structural contract for all anatomic-pathology case-detail screens; each adopting FRS carries a Shell Conformance table stating conforms / conforms-with-variation / not-applicable per element | three screens had drifted, and cytology v2 was formally inheriting from an unconverted December 2025 document | Pathology, IHC, Cytology case views and any future one | FEATURE | active | case-view-shell.md v1.0 |
| D-047 | An AP case's stage is the module's **own shipped status enum**. No parallel completion boolean, and no per-stage timestamp column that duplicates a transition already recorded | the Dec-2025 pathology design stored a `caseReadyForReview` boolean beside `PathologyStatus`; they never synchronised, so sections unlocked while the sidebar showed a padlock and Generate Report never enabled | any case-view state model | FEATURE | active | shell S-4.1 / S-8.1 |
| D-048 | **Identified objects, never counts.** Blocks, slides and cassettes are first-class rows with parentage; every count is derived, and reconciliation at a handoff names the outstanding object | `ISO 15189:2022` 7.2.6.1(g) requires every portion be traceable to the original sample — a stored count cannot say which block is missing. Verified against Beaker AP (per-object tasks), LigoLab (Block Log / Slide Log), LabWare (case objects) and the Leica STS scan-at-every-handoff pattern | any AP object tracking; any "expected vs actual" count | GLOBAL | active | shell S-10.3; pathology FRS FR-9.6 |
| D-049 | Block and slide **designation and barcode schemes are configurable per deployment**; the hierarchy (case → part → block → slide) and the required label content are enforced regardless | the CAP/NSH *Uniform Labeling* guideline explicitly declined to set a universal convention — "insufficient evidence in the published literature" — and requires each institution to establish its own. Picking one would be wrong for half our deployments | any AP identifier or label scheme | FEATURE | active | pathology FRS FR-9.3 |
| D-050 | Slide labels are printed and **scan-verified at the microtome before sectioning**, not batch-printed from a toolbar afterwards | 52% of all mislabelling occurs at this one transition (22% block labelling, 30% cutting — CAP Q-Probes, 136 institutions); barcode verification here cut slide misidentification 92% at one centre and slide-printing errors 27.4→0.4/month at another | pathology microtomy; any block→slide handoff | FEATURE | active | pathology FRS FR-7.3 |
| D-051 | **Interpretive thresholds are versioned, source-stamped reference data**, folded into the Catalog Subscription epic — one mechanism serving both IHC biomarker thresholds and AMR breakpoints. The applied set's identity is recorded per result; a new edition applies forward and does **not** re-interpret a signed-out result | guideline editions move (HER2 2007/2013/2018/2023; ER-PgR 2020; IKWG 2021) and a raw number is meaningless without the edition applied to it. CAP `MIC.11380`/`MIC.11385` already require a "breakpoints in use" list naming source and publication year. Note: no published rule on retrospective re-interpretation was found — freeze-at-report is our decision, not a cited requirement | IHC marker results; AMR breakpoints; any guideline-driven interpretation | GLOBAL | active | ihc FRS FR-5; Casey 2026-09-04 |
| D-052 | HER2 IHC **0 and 1+ are distinct, non-collapsible stored values**; a "HER2-low" descriptor is configurable threshold-set vocabulary, not application logic | trastuzumab deruxtecan's extension to IHC 1+ and 2+/ISH-negative made the distinction therapy-determining; ASCO/CAP declined to create a HER2-low category in 2023 while ESMO uses it, so two guideline bodies disagree on the vocabulary | IHC HER2 capture and reporting | FEATURE | active | ihc FRS FR-6.1 / FR-6.3 |
| D-053 | AP case views report **measurement categories only — never therapy-eligibility or retesting recommendations** | the Dec-2025 IHC design rendered "Patient eligible for HER2-targeted therapy". Eligibility is a clinical decision; a laboratory report states what was measured and how it was categorised | any predictive-marker or diagnostic screen | GLOBAL | active | ihc FRS FR-9.3 |
| D-054 | A report row **opens in a new browser tab on one click**; no per-row View / Download / Print / Email buttons. Report generation likewise opens the new version in a new tab | the tab's own PDF viewer already does download, print and share better than four application buttons duplicating them; this matches shipped behaviour | any AP reports section | FEATURE | active | Casey 2026-09-04; pathology FRS FR-15.2 |
| D-055 | A **second-opinion consultation's outcome is a queryable field** (`AGREE` / `DISAGREE` / `MODIFIED`), its triggers are configurable rules, and it never blocks sign-out | CAP/ADASP interpretive-error guidance requires labs to monitor review *results* continuously — only possible if the outcome is a field, not a comment — while deliberately leaving selection criteria to the institution, so a hardcoded diagnosis list would be wrong | pathology and cytology review; any peer-review feature | FEATURE | active | pathology FRS FR-11 |
| D-056 | SideNav **submenus for Pathology, Cytology and IHC were re-added** after `OGC-17` removed them; case views hang off `<Module> → Dashboard → Case View` | confirmed by Casey 2026-09-04; resolves the contradiction between `OGC-17` (Done, "remove the submenus for cytology, IHC, and pathology") and cytology v2's declared SideNav path | any AP case-view IA declaration | FEATURE | active | Casey 2026-09-04 |

### Candidate, not yet a decision

Worth raising before it becomes precedent by accident: **no pathology entity on `develop` is `@Audited`**, and `PathologySample` declares `blocks`, `slides`, `requests`, `conclusions` and `reports` as `@OneToMany(cascade = ALL, orphanRemoval = true)` — so removing a child from a collection hard-deletes the row. That is `D-002` violated in the entity layer rather than in a design, and `42 CFR 493.1105` requires slides retained 10 years and blocks 2 years. Both FRSs declare it as a dependency. If the pattern exists elsewhere in the codebase it deserves its own GLOBAL decision rather than a per-FRS note.

---

## 3a. Tickets written (2026-09-04)

| Key | Type | What | Status |
|---|---|---|---|
| `OGC-264` | Epic | Pathology Case View Redesign — body replaced with the doorway form; labels `pathology`, `anatomic-pathology`, `case-view`; Contract `DIGI-UW / I-TECH`; staging note for v1+v2 | Backlog |
| `OGC-1195` | Story | Anatomic-pathology case views share one screen structure — the shell; labels as above plus `shell`, `cross-cutting`; Contract `DIGI-UW / I-TECH`; `Relates` to OGC-264, OGC-265, OGC-266 | Backlog, unassigned |

**Story rather than Epic for the shell:** a shared component set, no new data model, one reviewable PR — and it needs to be linkable from three case-view Epics rather than nesting under one.

**No child stories were created.** The developer slices, per the handoff model.

**Two follow-ups the tickets could not carry:**

1. **The mockup JSX is linked, not attached.** The Atlassian tooling available in this session has no attachment capability, so `pathology-case-view-mockup.jsx` is a repo link in the body rather than a ticket attachment as the template prefers.
2. **`OGC-264` is assigned to `chinehuu`.** Pre-existing, from before this pass. Left untouched — reassigning someone else's ticket is Casey's call, not an automated one.

---

## 4. Not done in this pass

- **JSX mockups.** Deferred to `/breakdown` per the skill's handoff model — the HTML previews are the review artifact and the JSX is built once the FRSs are approved.
- **Slicing guides.** Also `/breakdown`.
- **Jira tickets.** `/breakdown` is the only Jira-creating step, and it needs approval of these FRSs first. When it runs: `OGC-264` and `OGC-265` already exist as Epics, so those get updated rather than created; the Case View Shell needs a home — probably a Story under whichever of the two lands first, or its own small Epic if the shared components are built ahead of both.
- **Threshold seed content review.** The seeded HER2, ER/PgR and Ki-67 values carry their sources and editions, and are flagged in the IHC FRS as requiring pathologist sign-off **before release**, not before merge. MMR/MSI and some PD-L1 sets are named but deliberately left empty where the numbers could not be verified against a primary source.
- **`RT Number`.** Present in the client's requested design with no known OpenELIS counterpart; an open question for the site.
- **CAP checklist item numbers.** Every `ANP.*` reference available to this pass came from a 2014 edition of the checklist, and CAP renumbers between editions. Both FRSs state requirements generically rather than citing stale item numbers, but anything quoted to an auditor should be re-verified against the current edition first.

---

*End of closing actions — 2026-09-04*
