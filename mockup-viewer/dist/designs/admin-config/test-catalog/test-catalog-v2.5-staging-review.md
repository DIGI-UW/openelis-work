# Test Catalog Management — v2.4 Health Check + MVP/Final Staging Proposal

**Date:** 2026-05-14
**Author:** Casey (with Claude)
**Purpose:** Re-baseline the v2.4 spec, identify drift since it was written, and propose a two-stage release (MVP + Final) anchored on "parity with shipped app + biggest gaps."
**Companion artifacts to follow once this is approved:** `test-catalog-requirements-v2.5.md` (FRS with [MVP] / [Final] tags), `test-catalog-preview-v2.5-mvp.html` (MVP-only visual preview), Jira epic + child stories for the MVP stage.

---

## 1. v2.4 Health Check

### 1.1 What's holding up well

| Area | Status | Notes |
|---|---|---|
| **IA: flat 14-section SideNav** | Solid | Aligned with the "OpenELIS sidenav uses submenus, not tabs" memory. v2.2 cleanup is paying off — no Carbon Tabs anywhere in the editor's primary nav. |
| **Click-to-open list, no per-row Actions** | Solid | Single write surface = the editor; matches "Verify JTBD before bucketing" — every operation lives in the editor. |
| **Range Editor (Structured / Table / Visual + Coverage Validation)** | Solid | Three view modes are well-differentiated. Hour-level age unit unlocks neonatal bilirubin. |
| **Domain attribute (CLINICAL / ENVIRONMENTAL / VECTOR)** | Solid | Powers section visibility, list filter, and downstream Compliance/Vector flows. Small data-model footprint. |
| **AMR flag + WHONET fields** | Solid | Clean conditional reveal in Basic Info. Schema is additive. |
| **Result Components (v2.4 new)** | Solid concept, heavy migration | The Components vs. Panels boundary is crisp; FHIR mapping ("one Observation per component") is well-justified. But this is the largest schema change in the spec — see §2 for staging. |
| **i18n keys (~234, namespaced)** | Solid | Naming convention is consistent; common keys factored out. |
| **Permissions (binary, `admin.testCatalog.manage`)** | Solid | Honors the "OpenELIS admin permissions are binary" memory — no invented role matrix. |

### 1.2 Drift / inconsistencies to fix in v2.5

| # | Where | Issue | Severity | Fix |
|---|---|---|---|---|
| D-01 | Localization §editor, lines 205–209 | Five keys remain for `editor.sidenav.configuration / organization / resources / automation / compliance`. But the spec body (§Internal IA) explicitly removes group headers and uses a flat list. These keys reference admin-global group labels that the editor no longer uses. | HIGH | Delete the five `editor.sidenav.*` group-header keys. They're leftovers from v2.1. |
| D-02 | Result Components AC (line 996) vs. Updated AC (line 3020) | Line 996 commits to "each component is its own `Observation`; `Observation.component[]` is **not** used." Line 3020 says "each component is one `Observation.component` (or one `Observation` per component, per deployment FHIR mapping config)." Direct contradiction. | CRITICAL | Keep line 996. Delete or rewrite line 3020 to match. |
| D-03 | Alert Rules section (lines 2530–2733) | Defines its own SMS/Email rule model with templates and substitution variables — but the **Test Notification verified data model** (memory) already specifies 4 channels (Patient Email/SMS, Provider Email/SMS), a 3-tier template fallback (channel → test → system), 4 substitution variables, and BCC on Provider Email only. The two models don't reconcile. | HIGH | Reconcile Alert Rules with the verified Test Notification model OR explicitly defer Alert Rules and consume the Test Notification system instead of duplicating it. (Recommend: defer to Final + integrate.) |
| D-04 | Alert Rules "Critical" trigger | The Critical trigger fires when a result lands in the Critical Range. But for ENVIRONMENTAL and VECTOR tests, the Ranges section is de-emphasized in favor of Compliance — so the Critical trigger has no input. Spec doesn't address this. | MEDIUM | Either: (a) Alert Rules trigger from Compliance threshold breaches for ENV/VECTOR, or (b) keep Alert Rules CLINICAL-only and add a parallel "Compliance Alert" mechanism in the Compliance section. Pick before Final. |
| D-05 | Critical Result Acknowledgment | Per memory, "all criticals should require ack and surface in alerts dashboard" is a global TODO and a dependency for the home-page Attention feed. v2.4 Alert Rules notifies but doesn't enforce acknowledgment. | MEDIUM | Add a cross-reference: Alert Rules dispatches; the global Critical Acknowledgment workflow tracks ack. Don't try to own ack inside this FRS. |
| D-06 | Reagents Tab — link to inventory | Per memory, "Reagents not yet linked to tests" — the v1 reagent capture is free-form ComboBox; v2.1 introduces per-test linkage. v2.4 Reagents Tab assumes the linkage already exists. | MEDIUM | Clarify that the Reagents Tab is **dependent on** the v2.1 reagent-test linkage; flag it as a hard dependency. |
| D-07 | Labels Tab — Label Preset Management | The spec embeds full Label Preset Management (lines 1349–1448) inside the Test Catalog FRS, but Label Presets are a separate Master Lists admin. | MEDIUM | Either move Label Preset Management out into its own FRS, or keep it as an Appendix/Reference clearly labeled "see Master Lists FRS — included here for context only." Cleaner: extract. |
| D-08 | Display Order section | Drag-and-drop test ordering is a UI affordance; the underlying `display_order` column is on `test_sample_type`. Coexists with **Panel Membership** drag-drop (different table). No conflict, but worth clarifying scope in v2.5. | LOW | Add a one-line scope note: "Display Order = order within a sample type for list views; Panel Membership = order within a panel for that panel's display." |
| D-09 | "Internal QA - No Results Release" flag | Replaces older "In Lab Only" flag. EQA-adjacent. Per memory, "EQA V2 — specced, not yet built." This flag is independent of EQA V2 (it's a results-suppression flag, not a proficiency-testing surface), so OK to keep — but add cross-reference. | LOW | Add a one-line note distinguishing this flag from EQA participant workflows. |
| D-10 | Feature flag hook | Per memory, "Admin MVP — feature-flag pattern" introduces Feature Flags as the 10th tab in Application Settings. v2.4 has no integration with this — but a phased rollout would benefit from a `useTestCatalogV2` flag to enable per-deployment opt-in. | MEDIUM | Add a Feature Flag section to v2.5: `useTestCatalogV2` gates the unified editor; default off in MVP, default on once stable. |
| D-11 | No multitenancy | Per memory, "No multitenancy in OpenELIS." Confirmed — v2.4 doesn't introduce any. No action needed. | n/a | — |

### 1.3 Specs/data v2.4 quietly punts on

- **Multi-reading reporting**: line 813 says "show all readings + a derived summary like mean/median/max/latest. The summary function will be specified in a follow-up." This is fine to defer, but the FRS should be explicit: multi-reading capture lives in v2.4; multi-reading **reporting** is a separate spec.
- **AMR breakpoint table loading**: `whonet_antibiotic_codes` is defined as a reference table but the FRS doesn't specify who seeds it or how it's kept current with CLSI/EUCAST yearly updates.
- **Coverage validation algorithm at edge units**: the algorithm normalizes to days, but `hours / 24` produces fractional days. Need to confirm gap detection is correct at the hour boundary for neonatal cases.

None of these are blockers — they're "make these explicit in v2.5" items.

---

## 2. Shipped-App Baseline (for anchoring MVP)

Based on the testing instance memory (`testing.openelis-global.org`) and the OpenELIS Global repo conventions, the **shipped state** of test catalog admin today is approximately:

| Shipped admin surface | What it does | Gap vs. v2.4 |
|---|---|---|
| **Test** admin page | Edit one test's basic info: name, code, section, sample type, result type, units, ref ranges, panels, methods (separate forms or tabs). | v2.4 consolidates everything into one editor with 14 sub-sections and richer Ranges / AMR / Compliance. |
| **Test Section** admin page | CRUD on lab sections. | v2.4 introduces multi-section assignment (a test in two sections). |
| **Panel** admin page | CRUD on panels and their member tests. | v2.4 keeps panel CRUD but moves "this test is in these panels" into the test editor with drag-drop position. |
| **Method** admin page | CRUD on methods. | v2.4 adds inline method creation from inside the test editor + method shortcodes. |
| **Reagent** admin page | Free-form reagent records (per memory, not linked to tests). | v2.4 adds per-test reagent linkage with quantity-per-test (depends on a separate reagent-test linkage feature). |
| **Test Catalog Management** list view | Browse all tests with basic filters; per-row Edit/Activate/Deactivate. | v2.4 replaces with click-to-open rows + a Filters bar covering Section/Sample Type/Result Type/Status/Domain/AMR. |
| **(Implicit)** Ranges within Test | Single low/high ranges, sometimes age/sex-specific. | v2.4 introduces 4 range types × age/sex granular ranges × hour-level age unit + Coverage Validation. |

**Biggest visible gaps** (ranked by likely impact on partner deployments):

1. **5 admin pages → 1 editor** — IA win, reduces admin training, fewer broken navigation paths.
2. **Hour-level critical ranges** — clinical-safety gap (neonatal bilirubin).
3. **AMR test flag + WHONET fields** — Madagascar / GLASS reporting demand.
4. **Coverage Validation** — prevents the failure mode of a test going live with undefined ranges in some age window.
5. **Click-to-open list + better filters** — usability.
6. **Drag-drop test ordering** — operational comfort.
7. **Compliance tab** — Indonesia SILNAS / environmental labs (Baku Mutu).
8. **Result Components (multi-component tests)** — heaviest architectural change; benefits BP-style and environmental tests.

---

## 3. Proposed MVP / Final Split

### 3.1 Principle

**MVP** = (shipped admin surface consolidated into the new editor) + (the 3–4 highest-impact additions that ride existing schema with minimal new infrastructure).
**Final** = the rest of v2.4, including features that depend on other not-yet-built systems (Test Notification, S-01 Compliance Standards, reagent-test linkage, Label Presets).

### 3.2 The split, by section

| # | Section | MVP | Final | Why this split |
|---|---|:---:|:---:|---|
| 1 | **Basic Info** | ✓ (with Domain + AMR flag) | — | Foundation. Domain + AMR are low-cost additions that unblock filtering and WHONET. |
| 2 | **Sample & Results** | ✓ (single-component only) | + Result Components (multi) | Single-component path covers every test in shipped today. Multi-component is a schema migration with FHIR implications — Final. |
| 3 | **Methods** | ✓ (link + inline create + shortcodes) | — | Carbon-only change; existing data model already supports it. |
| 4 | **Ranges** | ✓ (Structured view + hour age unit + Coverage Validation panel) | + Table View + Visual View | The Structured view + Coverage Validation delivers the neonatal-bilirubin win. Table/Visual are nice-to-have polish. |
| 5 | **Sample Storage** | ✓ (without version history) | + version history audit | Storage requirements are a known gap; the audit trail can come later. |
| 6 | **Display Order** | — | ✓ | Drag-drop infrastructure + per-sample-type column migration. Skip in MVP. |
| 7 | **Panels** | ✓ (multi-select + inline create + position number) | + drag-drop in panel preview | Position number alone covers the use case. Drag-drop in the preview list is polish. |
| 8 | **Labels** | — | ✓ | Depends on **Label Preset Management** which is a separate Master Lists admin. Defer all Labels work to Final. |
| 9 | **Terminology** | ✓ (read-only display + add basic mappings) | + bulk import, mapping conflict detection | The v2.1 JSX already has this; minimal schema work. |
| 10 | **Reagents** | — | ✓ | Depends on the not-yet-built reagent-test linkage. Out of MVP. |
| 11 | **Analyzers** | ✓ (link/unlink only — no test code mapping) | — | Read-only link surface; test code mapping is already done in analyzer setup. Cheap. |
| 12 | **Alerts** | — | ✓ | Needs reconciliation with the Test Notification verified model. Out of MVP — and integrate, don't duplicate. |
| 13 | **Reflex & Calc** | — | ✓ | Read-only surface that links to Master Lists; depends on master-lists features being polished. Defer. |
| 14 | **Compliance** | — | ✓ | Depends on S-01 Compliance Standards FRS (separate). Hidden for CLINICAL anyway. |

### 3.3 Cross-cutting features

| Feature | MVP | Final | Why |
|---|:---:|:---:|---|
| Click-to-open list view (no Actions column) | ✓ | — | Pure UI; no new data model. |
| Filter bar (Section / Sample Type / Result Type / Status / Domain / AMR) | ✓ | — | Additive over existing list. |
| URL-reflected filter + pagination state | ✓ | — | Comes free with the new list. |
| Permissions (`admin.testCatalog.manage`) | ✓ | — | Already binary; no change. |
| **Localization Hardening** (multi-language metadata + fallback chain) | — | ✓ | Schema change + content migration; substantial. |
| Feature flag `useTestCatalogV2` | ✓ | — | Required to ship MVP behind a flag for opt-in deployments. |
| Multi-reading capture (`allow_multiple_readings`) | — | ✓ | Tied to multi-component result entry; ship together. |
| Inline "+ Add new unit" master-list write | — | ✓ | Master List write from admin editor is a permission/UX call best made alongside Result Components. |

### 3.4 What MVP looks like in one sentence

> A unified Test Editor that **replaces** the shipped Test / Test Section / Panel / Method admin pages, with **Basic Info + Sample & Results + Methods + Ranges (hour-granular + Coverage Validation) + Sample Storage + Panels + Terminology + Analyzers (link-only)**, plus a click-to-open list view with rich filters, plus the **Domain attribute** and **AMR flag** as low-cost foundational additions.

That's **8 of the 14 sections** in MVP, with the other 6 (Display Order, Labels, Reagents, Alerts, Reflex & Calc, Compliance) deferred to Final.

### 3.5 What Final adds

> Result Components (multi-component tests, FHIR mapping, schema migration), Display Order drag-drop, Labels Tab + Label Preset Management, Reagents Tab (per-test linkage), Alerts (integrated with the Test Notification system, not duplicated), Reflex & Calc cross-links, Compliance Tab (S-01 integration), full Range Editor Visual + Table views, Sample Storage version-history audit, Localization Hardening, and the Inline "+ Add new unit" master-list write affordance.

---

## 4. Sequencing & Dependencies for Final

If the split above is right, Final breaks into three logical waves once MVP ships:

| Wave | Features | Blocked by |
|---|---|---|
| **F-1** | Result Components, Display Order, full Range Editor Visual/Table views, Inline Add Unit | MVP shipped |
| **F-2** | Compliance Tab, Reflex & Calc cross-links, Localization Hardening | S-01 FRS, Master Lists features in place |
| **F-3** | Labels Tab + Label Preset Management, Reagents Tab, Alerts (integrated with Test Notification) | Label Preset FRS, reagent-test linkage FRS, Test Notification system available |

This isn't part of the deliverable Casey requested, but it's the natural follow-up shape and worth noting now.

---

## 5. Open questions before I write v2.5 + the MVP preview + Jira stories

1. **Alerts in MVP?** I've moved it to Final because of the Test Notification overlap (D-03). If you want a stub Alerts tab in MVP for visibility, say so and I'll add it with a "Configure in Master Lists" link only (no own data model).
2. **Domain attribute on day-1?** Adding Domain in MVP is cheap, but it forces every existing test in every deployment to be classified (backfilled to CLINICAL). If you'd rather defer Domain to Final, MVP gets even simpler — but Compliance and the Domain filter both move to Final automatically.
3. **AMR in MVP?** Same trade — cheap schema, real partner demand (Madagascar). I have it in MVP. Pull out if you want a truly minimal MVP.
4. **Result Components in MVP?** I have it in Final because it's the heaviest schema/FHIR change. If you want to do the schema migration early (so all later features ride on it), it moves to MVP. Lower-risk path is Final.
5. **Feature flag default?** `useTestCatalogV2` off by default in MVP (opt-in per deployment) or on by default (everyone gets it day-1)?
6. **Reagents / Analyzers consistency?** I have Analyzers in MVP (link-only is cheap) but Reagents in Final (depends on linkage). If you want them paired (both MVP or both Final), say which.

---

## 6. If this split is approved, here's what I'll produce next

1. **`test-catalog-requirements-v2.5.md`** — full FRS keeping v2.4's content, with each section/requirement tagged `[MVP]` or `[Final]` and the §1.2 fixes applied. Adds a §0 Staging Plan summarizing this document.
2. **`test-catalog-preview-v2.5-mvp.html`** — visual preview showing **only** the MVP slice (8 sections + list view). Lets you eyeball whether the smaller cut feels coherent on its own.
3. **Jira epic + child stories for MVP** — one epic, one story per MVP-scope section (~10 stories), each with acceptance criteria traced back to the FRS section.

Total writeup ~3,500–4,000 lines of FRS, one preview file, ~10 Jira stories.
