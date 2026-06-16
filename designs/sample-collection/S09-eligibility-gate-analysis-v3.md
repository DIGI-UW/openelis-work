# S-09 Pre-Analytical Eligibility Gate — Revisit Analysis & Recommendation

**Date:** 2026-06-16
**Jira:** [OGC-580](https://uwdigi.atlassian.net/browse/OGC-580) (currently a single Story, *Selected for Development*, Sprint 3)
**Reviewed artifacts:** S-09 v1.0 FRS (`designs/sample-collection/`), S-09 v2.0 FRS (`upload/processed/S09-eligibility-gate-resampling-frs-v2.0.md`), OGC-580 description
**Cross-checked against:** Test Catalog Management v2.5 ([OGC-949](https://uwdigi.atlassian.net/browse/OGC-949) umbrella; [OGC-746](https://uwdigi.atlassian.net/browse/OGC-746) v1 **Done 2026-06-15**), S-03 v2.0 Environmental Order Entry ([OGC-537](https://uwdigi.atlassian.net/browse/OGC-537))

---

## 1. Why we're revisiting

Two concerns prompted this review, and both check out:

1. **The spec is overengineered** relative to what the lab and the system can actually support.
2. **It collides with the Test Catalog redesign**, whose v1 foundation shipped the day before this review.

The recommendation below resolves both by replacing the spec's auto-evaluating, per-SampleType "criteria engine" with a **generic, manually-completed acceptance checklist** — and by decoupling the configuration surface from the test catalog entirely. The genuinely valuable piece, the **Resample action**, is preserved.

---

## 2. The collision (confirmed, specific)

OGC-580's acceptance criteria open with:

> *"SampleType admin form gains new 'Acceptance Criteria' tab (6th tab after existing 5: Basic Info, Display Order, Associated Tests, Storage & Disposal, WHONET)."*

That admin surface is being removed. OGC-746 ("Test Catalog Management v2.5 — v1"), marked **Done on 2026-06-15**, states it *"directly replaces the shipped Test / Test Section / Panel / Method admin pages (legacy entries decommissioned at v1 release)"* and consolidates everything into a single SideNav-routed unified editor. In the new editor, **Sample Types are a typeahead picker inside a Test's "Sample & Results" section** (OGC-749), not a standalone tabbed form.

Consequences for S-09 as currently written:

| S-09 v2.0 assumption | Reality after OGC-746 | Severity |
|---|---|---|
| Bolt a tab onto the SampleType admin form | That form is gone; sample types are a picker in the test editor | **CRITICAL** — the config surface no longer exists |
| `sample_type_acceptance_criteria` table keyed 1:1 to SampleType | Per-SampleType config has no admin home in the new test-scoped editor | **HIGH** |
| Config conceptually adjacent to test catalog | Compliance (OGC-765) and Alerts (OGC-763) are already claimed as v2 editor sections; a third overlapping "criteria" concept invites confusion | **MEDIUM** |

Building S-09 v2.0 as specced would mean either reviving a just-decommissioned admin page or wedging sample-type config into a test-scoped editor it doesn't belong in. Either way it fights the redesign.

---

## 3. Overengineering findings

Independent of the collision, the spec carries weight the workflow doesn't need. The root issue: **it models an automated criteria-evaluation engine for data OpenELIS does not reliably capture.**

| # | Heavy element (v2.0) | Problem | Recommendation |
|---|---|---|---|
| O-1 | **Per-criterion auto-compute rules** (transit_window / temperature_range / volume_range / pool_size) that compute pass/fail from Step 2 data | The system doesn't capture most of these as structured values. Volume, receipt temperature, and container type are rarely keyed numerically at intake; auto-evaluation would be wrong or empty most of the time. Builds a calculation engine that mostly can't calculate. | **Drop the engine.** Use a manual checklist the receiver ticks. Keep transit time as *displayed* read-only context only (it's the one value derivable for free from existing timestamps), not an enforced gate. |
| O-2 | **Per-SampleType criteria registry** with severity mapping, recoverable flags, subcategory mapping, default library + vector overrides | Elaborate configuration for rules a lab states once. Per-sample-type granularity is rarely needed and now has no clean admin home. | Replace with a **flat, lab-wide checklist master list** (label, optional domain, active, order). Decoupled from the test catalog. |
| O-3 | **Order status enum formalization** (7+ new values, migration/backfill, HTTP 409 transition validation) | A large backend change bundled into a feature whose value is the intake decision, not a status-machine rewrite. The intake queue can filter on existing status; outcome is already captured by the NCE + resample link. | **Defer.** Out of scope for the eligibility gate. Revisit as its own initiative if dashboards need it. |
| O-4 | **Granular permission keys** (`eligibility.view/assess/resample/reject`) | Violates the OpenELIS permission model (binary admin + per-module role bundles; no per-action keys). S-03 v2.0 explicitly reuses existing keys (`order.qa`, `nce.create`, `order.enter`). | **Remove all four.** Reuse `order.qa` (intake decision) and `order.enter` (spawn resample order). No new keys. |
| O-5 | **Per-domain lab-unit gate behavior matrix** (Mandatory/Prompted/Disabled × Clinical/Env/Vector) | A 3×3 config matrix for a binary need ("must the checklist be completed before advancing?"). | Collapse to **one lab-wide setting**: checklist enforcement = Mandatory / Optional / Off. Per-domain can come later if a real lab asks. |
| O-6 | **`sampleDomain = BOTH`** referenced in v1.0 US-17 | The Domain enum is strictly CLINICAL / ENVIRONMENTAL / VECTOR — there is no BOTH anywhere. | Already dropped in v2.0; keep it gone. |
| O-7 | **Eligibility Worklist sidebar** (v1.0) | A whole new screen for what is a filtered view. | Already replaced in v2.0 by an Order Dashboard status filter; keep as a filter, not a new page. |
| O-8 | **Shipment-level batch grouping**, **Vector CollectionLot variant** | Real but secondary; they expand scope before the core ships. | Already deferred in v2.0 (P2 / V-02). Keep deferred. |

v2.0 already trimmed ~50% off v1.0 (good). This pass removes the remaining structural weight — the calculation engine (O-1), the registry (O-2), the status rewrite (O-3), the invented permissions (O-4), and the config matrix (O-5).

---

## 4. Recommended end goal (the "proper" target)

A pre-analytical eligibility gate that is **a checklist plus a decision**, nothing heavier:

**At intake (Step 3 — QA/QC + Intake Acceptance):**
For each sample, the receiving tech sees a short **Sample Acceptance Checklist** — a generic, configurable list of yes/no items the tech verifies by eye (container intact, label legible, volume adequate, cold chain intact, paperwork present, …). Items are answered **manually**; nothing is auto-graded. Transit time is shown beside the checklist as read-only context (computed from the existing collection and receipt timestamps) so the tech can see a long transit at a glance — but it does not auto-fail anything.

If the tech marks the sample acceptable, the batch advances as it does today. If not, the **existing NCE flow** (S-03 v2.0 §5.3.1) opens, now with a **third action alongside "accept with flag" and "reject": Resample.** Resample rejects the original and spawns a linked new draft order pre-populated from the original, then notifies the requester. The `resampled_from` link is preserved for audit and analytics.

**Configuration (decoupled from the test catalog):**
One new lightweight **Sample Acceptance Checklist** master list — the same shape as any other OpenELIS master list (label + i18n key, optional domain tag, active, display order). Managed under Admin like rejection reasons or NCE categories. One lab-wide setting: **checklist enforcement = Mandatory / Optional / Off.**

**Explicitly NOT in the end goal:** auto-compute rules, per-SampleType criteria, the order status-enum rewrite, new permission keys, the per-domain gate matrix. The checklist master list never touches the unified Test Catalog Editor, so there is no collision with OGC-746/949.

This keeps every regulatory benefit that matters for ISO 15189 §5.4 / ISO 17025 §7.4 — a documented, recorded acceptance decision with reason and operator — while dropping the machinery that pretended the system could grade samples automatically.

---

## 5. What this changes vs. v2.0

| Area | v2.0 | v3.0 (recommended) |
|---|---|---|
| Criteria evaluation | Auto-computed per criterion from Step 2 data | Manual tick-through; transit time shown as context only |
| Criteria config | Per-SampleType registry on SampleType admin tab | Flat lab-wide checklist master list (own admin page) |
| Test-catalog coupling | Tab on a now-removed admin form | None — fully decoupled |
| Order status | Formalize 7-value enum + transitions | Deferred / out of scope |
| Permissions | 4 new `eligibility.*` keys | Reuse `order.qa`, `order.enter` |
| Gate behavior | Per-domain 3×3 matrix | One lab-wide Mandatory/Optional/Off setting |
| Resample action | ✅ keep | ✅ keep (the core value) |
| Resample notification | ✅ keep (reuse Notification Admin) | ✅ keep |

Net effect: roughly another ~50% reduction on top of v2.0, the collision removed, and a feature that ships in a small slice.

---

## 6. Recommendation

Adopt v3.0 as the end goal: **generic manual checklist + Resample, decoupled from the test catalog.** Rewrite OGC-580 from this FRS, then re-slice it (the current single Story understates the work and is built on the stale design). Suggested minimal first slice: the Resample action + a checklist read from a seeded default list at Step 3 — usable on its own, no new admin UI required to demo. Config UI, enforcement modes, and the dashboard filter follow as later slices.

See the companion files: `S09-eligibility-gate-frs-v3.0.md`, `S09-eligibility-gate-mockup-v3.jsx`, `S09-eligibility-gate-preview-v3.html`, and `S09-eligibility-gate-breakdown-v3.md`.
