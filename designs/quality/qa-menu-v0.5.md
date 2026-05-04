# QA Menu v0.5 (IA Rehome) — Functional Requirements Specification

**Document Version:** 1.0
**Date:** 2026-05-01
**Author:** Casey Iiams-Hauser
**Status:** Ship-ready FRS for v0.5 (the IA-rehome version that lands **before** v1 MVP)
**Effort estimate:** ~30–46 engineer-hours with Claude (~55–85 without)
**Companion mockup:** `qa-v0.5-preview.html`
**Companion outline:** `qa-v0.5-rehome-outline.md`
**Source-of-truth references:**
- Piotr Mankowski, "Landscape review: QC subsystems in OpenELIS Global" (Slack #oe-madagascar-internal, 2026-05-01 06:18:12 +07)
- Piotr Mankowski, "Concrete proposal for aligning the three reqs" (Slack same channel, 2026-05-01 06:22:38 +07)
- `designs/quality/analyzer-manual-qc.md` (DIGI-UW/openelis-work)
- `designs/quality/batch-workplan-reagent-qc.md` (DIGI-UW/openelis-work)
- Beth Dunbar, Audit Trail menu-gap note (Slack same channel, 2026-04-30; ref MedX validation L0-02-03)

---

## 0. What v0.5 actually ships

A new top-level **Quality Assurance** sidenav group, with three pillar landings (Statistical QC, EQA, QMS & Improvement) populated by **rehomed existing pages** plus the **in-progress NCE v2** plus **two FUTURE-feature placeholders** (Reagent QC, Analyzer Manual QC) that cross-link to design docs on GitHub.

v0.5 ships **no net-new functional features**. Its purpose is to give every QA-adjacent surface a coherent home — so the Madagascar GRIST UAT can pass, so NCE v2 has a destination URL when it lands, and so v1 (MVP) lands on a stable IA container.

This FRS is the ship-ready consolidation of:
- `qa-v0.5-rehome-outline.md` — outline-level scope and rationale
- Piotr's two Slack messages — four-QC-feature framing + Madagascar GRIST proposal
- The two GitHub design docs (Reagent QC, Analyzer Manual QC) — for FUTURE-placeholder content

The mockup `qa-v0.5-preview.html` is the canonical visual reference. Any conflict between text below and the mockup → mockup wins for visual layout; FRS wins for data/route/permission/acceptance semantics.

---

## 1. Scope

### 1.1 In scope

1. **Top-level Quality Assurance sidenav group** with the `New` tag.
2. **Three pillar sub-menus**: Statistical QC, EQA, QMS & Improvement. Each pillar has a landing page (`/qa/qc`, `/qa/eqa`, `/qa/qms`).
3. **Statistical QC pillar leaves** (4 total):
   - **QC Dashboard** — rehomed from `/analyzers/qc/db`. Existing UI; new URL + breadcrumb.
   - **QC Alerts** — rehomed from `/analyzers/qc/db/alerts`. Existing UI; new URL + breadcrumb.
   - **Reagent QC** — FUTURE placeholder. No functional UI. Cross-links to `designs/quality/batch-workplan-reagent-qc.md`.
   - **Analyzer Manual QC** — FUTURE placeholder. No functional UI. Cross-links to `designs/quality/analyzer-manual-qc.md`.
4. **EQA pillar** — rehomes the existing OpenELIS EQA pages from `/eqa/...` to `/qa/eqa/...` preserving sub-paths. The V1 `isEqaSample` flag flow continues to validate as it does today.
5. **QMS & Improvement pillar leaves** (2 total in v0.5):
   - **NCE Register** — destination URL for the in-progress NCE v2 build. v0.5 hides the legacy top-level NCE entry and 301-redirects `/non-conform/*` to `/qa/qms/nce/*`. Until NCE v2 ships, the existing legacy NCE workflow renders at this URL.
   - **Audit Trail** — rehomed from `/admin/audit-trail`. Cross-link preserved from Admin so administrators with muscle memory still find it.
6. **301 redirects** from old paths (full table in §3.4).
7. **Permission registry additions**:
   - `qa.view.overview` — visibility of the QA top-level node.
   - `qa.view.qc` — Statistical QC pillar visibility.
   - `qa.view.eqa` — EQA pillar visibility.
   - `qa.view.qms` — QMS pillar visibility.
8. **Madagascar GRIST UAT alignment**: test-step rewrites for LO-07-02, LO-07-03, LO-07-04 + a fixture seed (a control lot with established mean/SD plus a fresh control result that breaches 1-3s).
9. **i18n** — new menu / breadcrumb / pillar-landing / FUTURE-placeholder strings.

### 1.2 Out of scope (deferred, version listed)

| Feature | Lands in |
|---|---|
| QA Overview landing page (5-question strip + 4 pillar tiles) | v1 |
| QI Dashboard MVP (4 KPI tiles) | v1 |
| 3 new REST wrappers (rejection-rate, amendment-rate, tat-compliance) | v1 |
| QA Officer default role | v1 |
| Electronic Signature Log | v2 |
| **Test Accreditation management** (Accrediting Bodies + Test Accreditations admin pages) | **v2 — community may lead.** Spec is ready in `test-accreditation-frs.md`. |
| NCE Register modernization beyond what NCE v2 ships | Reconsider after NCE v2 lands |
| NCE Create/Report flow (11 triggers) beyond what NCE v2 ships | Reconsider |
| NCE Analytics page beyond what NCE v2 ships | Reconsider |
| CAPA Register | v7 (renumbering pending NCE v2 scope confirmation) |
| QI Dashboard full + QI Configuration + Pillar-3 detail pages | v8 |
| Critical Callback Compliance | v9 |
| EQA V2 build | v10–v11 |
| Results Entry inline NCE upgrade | v12 |
| Reagent QC functional UI | TBD — design doc exists; build not scoped |
| Analyzer Manual QC functional UI | TBD — design doc exists; build not scoped |

### 1.3 Non-goals

- v0.5 does **not** redesign any of the rehomed pages. The components, controls, and behavior are unchanged.
- v0.5 does **not** add new database tables, columns, or migrations.
- v0.5 does **not** modify any backend endpoints (NCE v2 may add endpoints as part of its own scope; those are separate).
- v0.5 does **not** redefine the Madagascar GRIST requirements themselves — see §6 for how v0.5 enables passing them.

---

## 2. The four-QC-feature mental model (Piotr's framing)

Per Piotr's landscape review, OpenELIS has four distinct QC features at different ship stages, all under the ISO 15189 §7.7 umbrella but with different data models:

| # | Feature | Status today | Lens it provides |
|---|---|---|---|
| 1 | **Westgard / Internal QC** | Fully merged into OpenELIS-Global-2 | Are the numbers from this analyzer-test-control-lot tuple still in tolerance? |
| 2 | **EQA / Proficiency Testing** | V1 done (`isEqaSample` flag) | Do our results match the external program's target value? |
| 3 | **Reagent QC** | **FUTURE** — design doc only | Has this reagent lot been verified before we use it? |
| 4 | **Analyzer Manual QC** | **FUTURE** — design doc only | Did the technician run a daily control on this instrument today? |

v0.5 preserves this four-lens framing in the IA from day one: each feature gets its own slot under Statistical QC. The two future features render as placeholder pages with prominent design-doc cross-links, so UAT testers (Madagascar GRIST, future inspections) can mark related bullets PARTIAL with documented future-feature references.

---

## 3. Information architecture

### 3.1 Sidenav (v0.5)

```
Home
Order
Results
Patient
Sample
Quality Assurance                              ◄── NEW (top-level, with `New` tag)
  ├── Statistical QC                           ◄── NEW pillar
  │   ├── QC Dashboard           [moved]
  │   ├── QC Alerts              [moved]
  │   ├── Reagent QC             [future]
  │   └── Analyzer Manual QC     [future]
  ├── EQA                                       ◄── NEW pillar
  │   └── (existing EQA pages, rehomed under)
  └── QMS & Improvement                         ◄── NEW pillar
      ├── NCE Register           [in progress]
      └── Audit Trail            [moved]
Reports
Administration
```

The legacy entry points are **removed** from the sidenav in v0.5:
- Top-level NCE menu (if it existed): removed; legacy URLs continue to resolve via 301 redirects for one major release.
- Validation → Westgard / QC Dashboard entries: removed; legacy URLs continue via 301.
- Admin → Audit Trail: removed; legacy URL continues via 301. **Admin-side cross-link preserved** so administrators with muscle memory still find it.

The QA top-level parent shows the **`New`** tag for one major release after launch, auto-removed in v1 once the QI Dashboard child lands.

### 3.2 Routes

| Path | Page |
|---|---|
| `/qa` | Redirects to `/qa/qc` (default) or last-visited pillar via user-pref |
| `/qa/qc` | Statistical QC pillar landing |
| `/qa/qc/dashboard` | QC Dashboard (rehomed) |
| `/qa/qc/alerts` | QC Alerts (rehomed) |
| `/qa/qc/reagent-qc` | Reagent QC future-feature placeholder |
| `/qa/qc/manual-qc` | Analyzer Manual QC future-feature placeholder |
| `/qa/eqa` | EQA pillar landing |
| `/qa/eqa/*` | Existing EQA pages mounted at new path prefix |
| `/qa/qms` | QMS pillar landing |
| `/qa/qms/nce-register` | NCE Register (NCE v2 lands here when it ships; legacy NCE workflow renders here in the meantime) |
| `/qa/qms/nce/*` | NCE v2 sub-paths (whatever NCE v2 ships with) |
| `/qa/qms/audit-trail` | Audit Trail (rehomed) |

### 3.3 Breadcrumbs

```
Quality Assurance  ›  Statistical QC
Quality Assurance  ›  Statistical QC  ›  QC Dashboard
Quality Assurance  ›  Statistical QC  ›  Reagent QC
Quality Assurance  ›  EQA  ›  (sub-paths inherit existing EQA breadcrumb)
Quality Assurance  ›  QMS & Improvement  ›  NCE Register
Quality Assurance  ›  QMS & Improvement  ›  Audit Trail
```

### 3.4 301 redirects

| Old path | New path |
|---|---|
| `/analyzers/qc/db` | `/qa/qc/dashboard` |
| `/analyzers/qc/db/alerts` | `/qa/qc/alerts` |
| `/analyzers/qc/db/*` | `/qa/qc/dashboard/*` (preserve any sub-paths) |
| `/eqa` | `/qa/eqa/eqa-home` |
| `/eqa/*` | `/qa/eqa/*` (preserve sub-paths) |
| `/non-conform` | `/qa/qms/nce-register` |
| `/non-conform/*` | `/qa/qms/nce/*` (preserve sub-paths) |
| `/admin/audit-trail` | `/qa/qms/audit-trail` |

Redirects use HTTP 301 (permanent). They remain in place for one major release, then can be removed once analytics show the new URLs are dominant.

---

## 4. Pillar landing pages

Three new landing pages — one per pillar — render a tile grid of the pillar's leaves.

### 4.1 Statistical QC landing

Tile grid with 4 tiles:
- **QC Dashboard** (rehomed) — "Internal control monitoring with Westgard rules + Levey-Jennings charts."
- **QC Alerts** (rehomed) — "Westgard rule violations across analyzers."
- **Reagent QC** (future) — "Per-lot reagent QC frequency tracking. Design doc on GitHub."
- **Analyzer Manual QC** (future) — "Daily PASS/FAIL log per instrument. Design doc on GitHub."

The two FUTURE tiles render with a dashed border + lighter background to distinguish them from clickable functional tiles. Clicking a future tile navigates to its placeholder page (which itself prominently links to the design doc).

### 4.2 EQA landing

Single-tile grid pointing at the rehomed existing EQA module. Includes a `rehome-note` banner: "v0.5 rehome: existing EQA pages keep their UI and behavior; their URL prefix changes from `/eqa/...` to `/qa/eqa/...`. The `isEqaSample` flag flow continues to validate as it does today. EQA V2 (cycle/scheme model + Lab Performance dashboard + Follow-Up Queue + Analyst Competency + Program Management) arrives in v10–v11."

### 4.3 QMS & Improvement landing

Tile grid with 2 tiles:
- **NCE Register** (in-progress) — "Non-conformity events. Carbon-React modernization (NCE v2) lands here when it ships."
- **Audit Trail** (rehomed) — "Configuration / record-change audit log, rehomed from Admin. Admin cross-link preserved."

Includes a `rehome-note` banner explaining: NCE Register lands as the destination URL for the in-progress NCE v2 build; Audit Trail rehomed from Admin; Electronic Signature Log arrives in v2; Accreditation management arrives in v2 with the existing `test-accreditation-frs.md` spec as the canonical implementation reference (community may lead).

---

## 5. Future-feature placeholder pages

Two placeholder pages, one for each FUTURE feature. Each page has the same structure:

- Page title (e.g., "Reagent QC")
- Page subtitle: "Future feature — design exists; build not yet scheduled."
- A `future-note` banner that explicitly states which of Piotr's four QC features this is, the lens it provides (the question), a one-paragraph functional summary, and a one-sentence "why this matters" closing.
- A "Design document" panel with the GitHub-relative path and a `Read design doc on GitHub ↗` button linking to the public DIGI-UW/openelis-work URL.
- A footer note explaining that the placeholder exists in v0.5 specifically to enable UAT testers to mark Madagascar GRIST LO-07-03 bullets PARTIAL with documented future-feature links.

### 5.1 Reagent QC placeholder content

- **Question (lens):** "Has this reagent lot been verified before we use it on patients?"
- **Summary:** "Per-lot QC frequency tracking. Before a new reagent lot is used clinically, the system requires a documented set of verification samples comparing the new lot against the old lot or a peer-comparison reference. The data model holds which lots, which controls, which analyzer, which user, and which timestamp."
- **Why it matters:** "Without lot verification, a bad reagent lot can ruin a week of patient results before anyone notices. Most labs do this informally today (paper logs, supervisor reminders); shipping it as a system feature catches the cases where the informal process fails."
- **Design doc:** `designs/quality/batch-workplan-reagent-qc.md`

### 5.2 Analyzer Manual QC placeholder content

- **Question (lens):** "Did the technician run a daily control on this instrument today, and did it pass?"
- **Summary:** "Daily PASS/FAIL log per instrument. Different instruments have different daily checks (a microscope has a calibration slide, a hematology analyzer has a precision check on a control sample, a refrigerator has a temperature reading). The system holds them all to one shape: a daily PASS/FAIL log with a signer, a timestamp, and a block on instrument use if FAIL."
- **Why it matters:** "The first thing a CAP inspector asks when they walk into a lab is some version of 'show me your daily QC log for this instrument.' A signed log per instrument per day, every day. Forgetting it is what fails inspections."
- **Design doc:** `designs/quality/analyzer-manual-qc.md`

---

## 6. Madagascar GRIST UAT alignment

Per Piotr's "Concrete proposal for aligning the three reqs" (Slack 2026-05-01), v0.5 directly enables the three QC-related Madagascar UAT requirements to pass UAT with documented Round-2 rewrites.

### 6.1 LO-07-02 (Internal Control)

| Today | After v0.5 |
|---|---|
| Test points at `/analyzers/errors`; no clear surface | Test points at `/qa/qc/dashboard` (rehomed Westgard module); harness seeds a Westgard 1-3s violation |

**Round-2 rewrite:** Update test step paths to `/qa/qc/dashboard`. Pre-seed via the harness fixture: a control lot with established mean/SD plus a fresh control result that breaches 1-3s. UAT tester runs the test; the violation surfaces on the QC Dashboard. ✓ **PASS.**

### 6.2 LO-07-03 (Calibration samples — split)

The original requirement smushes three independent bullets:

| Bullet | Today | After v0.5 |
|---|---|---|
| Identify + exclude verification samples | EQA `isEqaSample` flag (V1, validates today) | Same V1 flow, now at `/qa/eqa/...` — UAT tester validates the EQA path |
| Alert when verification not performed on new instrument | Analyzer Manual QC — future feature | Cross-link to `/qa/qc/manual-qc` placeholder → design doc on GitHub. **PARTIAL** with documented future reference. |
| Batch-by-batch verification on new reagent lots (optimal-only) | Reagent QC — future feature | Cross-link to `/qa/qc/reagent-qc` placeholder → design doc on GitHub. **PARTIAL** with documented future reference. |

**Round-2 rewrite:** Split the requirement into three bullets in Grist. Validate the EQA bullet via the existing V1 flow at the new URL. Mark the other two bullets PARTIAL with the placeholder-page URLs as documented future references. The Mekom team accepts PARTIAL with design-doc reference per the standing ISO 15189 partial-pass convention.

### 6.3 LO-07-04 (Invalid quality indicators)

| Today | After v0.5 |
|---|---|
| No clear surface | 3-step pass-through against `/qa/qc/alerts` (rehomed Alerts tab); piggybacks on LO-07-02's seeded violation |

**Round-2 rewrite:** 3-step Alerts-tab walk against the seeded 1-3s violation from LO-07-02. The Alerts tab shows the violation with timestamp + analyzer + test + lot. ✓ **PASS.**

### 6.4 Fixture seed (one-time harness setup)

Per Piotr's recommendation, a single fixture seed satisfies LO-07-02 and LO-07-04 jointly:

```
Control lot: lot 22417C-TEST
  test:        potassium
  analyzer:    Architect ci8200 (test instance)
  level:       Level 1
  established_mean: 4.30 mmol/L
  established_sd:   0.04
  
Run history (last 9 runs in window):
  4.32, 4.28, 4.31, 4.35, 4.27, 4.29, 4.33, 4.30, 4.28
  (all in tolerance)

Triggering run (10th):
  value: 4.46 mmol/L
  z-score: +4.0 (breaches 1-3s and 1-2s)
  expected violations: 1-3s (critical), 1-2s (warning)
```

The seed lives in the test repo (not in v0.5 production code). One-time setup; reused across UAT cycles.

---

## 7. Permission registry

Four new permissions, all visibility-scoped (no `manage` permissions in v0.5 — nothing in v0.5 introduces editable surfaces that weren't already editable in their pre-rehome locations):

| Permission key | Description |
|---|---|
| `qa.view.overview` | Visibility of the Quality Assurance top-level sidenav node. Required to see the QA group at all. |
| `qa.view.qc` | Visibility of the Statistical QC pillar + its leaves (QC Dashboard, QC Alerts, Reagent QC + Analyzer Manual QC placeholders). |
| `qa.view.eqa` | Visibility of the EQA pillar + existing EQA pages at new URLs. |
| `qa.view.qms` | Visibility of the QMS pillar + NCE Register + Audit Trail. |

**Existing permissions inherit unchanged.** A user who could see Westgard at `/analyzers/qc/db` can see it at `/qa/qc/dashboard` if they have `qa.view.qc` plus whatever permission gated the original Westgard page. Existing permission keys (NCE permissions, EQA permissions, audit permissions) remain authoritative for the underlying actions.

**No default role changes in v0.5.** The QA Officer role is added in v1 (MVP).

### 7.1 Visibility cascade

```
User sees QA top-level sidenav node          ⇔ qa.view.overview
User sees Statistical QC pillar              ⇔ qa.view.overview ∧ qa.view.qc
User sees EQA pillar                         ⇔ qa.view.overview ∧ qa.view.eqa
User sees QMS pillar                         ⇔ qa.view.overview ∧ qa.view.qms
User sees QC Dashboard / Alerts page         ⇔ qa.view.qc ∧ existing QC permission
User sees specific EQA page                  ⇔ qa.view.eqa ∧ existing EQA permission
User sees NCE Register / Audit Trail         ⇔ qa.view.qms ∧ existing NCE / audit permission
```

Direct navigation to `/qa/qc/dashboard` without the prerequisite permissions returns 403.

---

## 8. i18n

### 8.1 New localization keys

| Element | Key |
|---|---|
| Sidenav: Quality Assurance | `label.menu.qa` |
| Sidenav: Statistical QC | `label.menu.qa.qc` |
| Sidenav: EQA | `label.menu.qa.eqa` |
| Sidenav: QMS & Improvement | `label.menu.qa.qms` |
| Sidenav: QC Dashboard | `label.menu.qa.qc.dashboard` |
| Sidenav: QC Alerts | `label.menu.qa.qc.alerts` |
| Sidenav: Reagent QC | `label.menu.qa.qc.reagentQc` |
| Sidenav: Analyzer Manual QC | `label.menu.qa.qc.manualQc` |
| Sidenav: NCE Register | `label.menu.qa.qms.nceRegister` |
| Sidenav: Audit Trail | `label.menu.qa.qms.auditTrail` |
| Pillar landing: Statistical QC heading | `label.qa.qc.landing.heading` |
| Pillar landing: Statistical QC sub | `label.qa.qc.landing.sub` |
| Pillar landing: EQA heading | `label.qa.eqa.landing.heading` |
| Pillar landing: QMS heading | `label.qa.qms.landing.heading` |
| Tile tag: Rehomed | `label.qa.tag.rehome` |
| Tile tag: Future | `label.qa.tag.future` |
| Tile tag: In progress | `label.qa.tag.inProgress` |
| Future-feature page: question label | `label.qa.future.questionLabel` |
| Future-feature page: read design doc CTA | `label.qa.future.readDesignDoc` |
| Rehome-note banner heading | `label.qa.rehomeNote.heading` |

### 8.2 i18n requirements

- Every visible string uses the `t(key, fallback)` pattern.
- No hard-coded English in the new pillar-landing or future-placeholder components.
- French and Khmer translations land alongside the English defaults at v0.5 release.

---

## 9. Frontend implementation

### 9.1 What changes

- **Sidenav**: new Carbon `SideNavMenu` for Quality Assurance with three sub-`SideNavMenu` entries for the pillars, each containing `SideNavMenuItem` entries for the leaves.
- **Routes** (`react-router-dom` v6):

```jsx
<Route path="/qa">
  <Route index element={<Navigate to="/qa/qc" replace />} />
  <Route path="qc" element={<QCLanding />} />
  <Route path="qc/dashboard" element={<QCDashboard />} />        {/* existing component */}
  <Route path="qc/alerts" element={<QCAlerts />} />              {/* existing component */}
  <Route path="qc/reagent-qc" element={<FutureFeaturePlaceholder feature="reagent-qc" />} />
  <Route path="qc/manual-qc" element={<FutureFeaturePlaceholder feature="manual-qc" />} />
  <Route path="eqa" element={<EQALanding />} />
  <Route path="eqa/*" element={<EQARoutes />} />                 {/* existing EQA tree */}
  <Route path="qms" element={<QMSLanding />} />
  <Route path="qms/nce-register" element={<NCERegister />} />    {/* legacy or NCE v2 */}
  <Route path="qms/nce/*" element={<NCEv2Routes />} />           {/* NCE v2 sub-tree */}
  <Route path="qms/audit-trail" element={<AuditTrail />} />      {/* existing component */}
</Route>
```

- **301 redirects** configured in the existing OpenELIS routing layer (path-rewrite middleware).
- **Hidden legacy menu entries** in the existing sidenav component: Validation → Westgard, Admin → Audit Trail, top-level NCE.

### 9.2 What does **not** change

- Component implementations of QC Dashboard, QC Alerts, EQA pages, NCE workflows, Audit Trail. v0.5 mounts them at new routes; their internals are untouched.
- Database schema. No new tables, no migrations.
- Backend REST endpoints. (NCE v2 may add endpoints on its own; those are separate.)
- Existing permission keys.

### 9.3 New components (small)

| Component | Purpose | LOC estimate |
|---|---|---|
| `<QualityAssurancePillarLanding pillar="qc|eqa|qms" />` | Generic tile-grid landing parameterized by pillar | ~120 lines |
| `<FutureFeaturePlaceholder feature="reagent-qc|manual-qc" />` | FUTURE-feature placeholder with question / summary / why / design-doc link | ~90 lines |
| `<RehomeNote leaf={leafSlug} />` | The blue rehome-note banner with old-path → new-path explanation | ~50 lines |

All three are thin compositions of existing Carbon `Tile`, `InlineNotification`, and link components.

### 9.4 File structure

```
src/main/webapp/app/quality-assurance/
  index.jsx                     // route mount
  pillar-landings/
    QualityAssurancePillarLanding.jsx
  placeholders/
    FutureFeaturePlaceholder.jsx
    rehome-content.js           // map of {leafSlug → {oldPath, description, etc.}}
    future-content.js           // map of {feature → {question, summary, why, designDoc}}
  shared/
    RehomeNote.jsx
```

### 9.5 User-prefs

The QA menu's default landing (which pillar opens when a user clicks the QA top-level node) persists per user via `user_pref` (existing). Default for new users: Statistical QC.

---

## 10. Acceptance criteria

### 10.1 IA + sidenav

- [ ] New top-level "Quality Assurance" sidenav group renders with the `New` tag.
- [ ] Three pillar sub-menus render: Statistical QC, EQA, QMS & Improvement.
- [ ] Statistical QC pillar shows four leaves: QC Dashboard, QC Alerts, Reagent QC (future), Analyzer Manual QC (future).
- [ ] EQA pillar lists existing EQA pages at new URL prefix.
- [ ] QMS pillar shows two leaves: NCE Register, Audit Trail.
- [ ] Top-level Validation node no longer contains Westgard / QC Dashboard entries.
- [ ] Admin → Audit Trail entry is removed (cross-link preserved as a redirect; old Admin item is hidden).
- [ ] Old top-level NCE entry (if present) is hidden.
- [ ] Active-state highlighting is correct on every pillar landing and leaf page.
- [ ] Tile-tag rendering: rehomed leaves show a blue "moved" pill; future leaves show a gray "future" pill; in-progress leaves show a yellow "in progress" pill.

### 10.2 Routing + redirects

- [ ] `/analyzers/qc/db` 301-redirects to `/qa/qc/dashboard`.
- [ ] `/analyzers/qc/db/alerts` 301-redirects to `/qa/qc/alerts`.
- [ ] `/eqa/*` 301-redirects to `/qa/eqa/*` preserving sub-paths.
- [ ] `/non-conform/*` 301-redirects to `/qa/qms/nce/*` preserving sub-paths.
- [ ] `/admin/audit-trail` 301-redirects to `/qa/qms/audit-trail`.
- [ ] All three pillar landings render at `/qa/qc`, `/qa/eqa`, `/qa/qms`.
- [ ] FUTURE-feature placeholders render at `/qa/qc/reagent-qc` and `/qa/qc/manual-qc` with working design-doc cross-links to the public DIGI-UW/openelis-work URLs.
- [ ] Browser back/forward preserves user-pref last-visited pillar.

### 10.3 Permissions

- [ ] User without `qa.view.overview` does not see the Quality Assurance node.
- [ ] User without `qa.view.qc` does not see the Statistical QC pillar; direct navigation 403s.
- [ ] User without `qa.view.eqa` does not see the EQA pillar; direct navigation 403s.
- [ ] User without `qa.view.qms` does not see the QMS pillar; direct navigation 403s.
- [ ] Underlying page-level permissions (Westgard config edit, Audit Trail view, NCE permissions) remain authoritative for actions within each page.

### 10.4 FUTURE-feature placeholders

- [ ] Reagent QC placeholder renders with the documented question, summary, why, and design-doc cross-link.
- [ ] Analyzer Manual QC placeholder renders with the same structure.
- [ ] Both placeholders link to the correct GitHub URLs (`designs/quality/batch-workplan-reagent-qc.md` and `designs/quality/analyzer-manual-qc.md` respectively).
- [ ] Both placeholders render the "v0.5 Madagascar GRIST" footer note explaining why the placeholder exists.

### 10.5 Madagascar GRIST UAT

- [ ] LO-07-02 Round-2 test points at `/qa/qc/dashboard` and a seeded Westgard 1-3s violation appears.
- [ ] LO-07-03 EQA-bullet validates against rehomed `/qa/eqa/...` path.
- [ ] LO-07-03 instrument-verification + reagent-batch bullets are marked PARTIAL in Grist with links to the design-doc cross-link pages.
- [ ] LO-07-04 3-step Alerts-tab walk passes against `/qa/qc/alerts`.
- [ ] Fixture seed is in place in the test harness (control lot 22417C-TEST with mean=4.30, SD=0.04, plus a 10th run at 4.46 that breaches 1-3s).

### 10.6 Cross-cutting

- [ ] All new strings (sidenav labels, pillar landings, future-feature placeholder text) localized.
- [ ] Lighthouse a11y score ≥ 95 on each new pillar-landing page.
- [ ] Existing component a11y is unchanged (no regressions from rehome).
- [ ] No console errors / warnings on any v0.5 page mount.

---

## 11. Open items

### 11.1 Resolved during design

| Question | Decision |
|---|---|
| Where do the four QC features live in the IA? | Three under Statistical QC (Westgard via QC Dashboard + QC Alerts; Reagent QC + Analyzer Manual QC as FUTURE placeholders). EQA gets its own pillar. |
| What about NCE v2? | Lands at `/qa/qms/nce-register` when it ships. v0.5 reserves the URL and 301-redirects legacy `/non-conform/*`. |
| Audit Trail location | QMS pillar with Admin cross-link preserved. |
| FUTURE placeholder voice | "Future feature — design exists; build not yet scheduled" + design-doc link. Avoid "coming soon" without context. |
| Madagascar GRIST UAT alignment | Per Piotr's proposal: LO-07-02 PASS, LO-07-03 SPLIT (EQA pass + 2 PARTIAL with design-doc refs), LO-07-04 PASS. |
| Accreditation management | **Moved to v2** (was v3). Community may lead. Canonical implementation reference: `test-accreditation-frs.md`. |

### 11.2 Outstanding (resolve before v0.5 merges)

1. **NCE v2 scope** — does the in-progress NCE v2 build cover the modern register + create flow + analytics + CAPA register, or just the register? Confirm with Piotr / Mozzy. Determines how many later versions (v4–v7) collapse into v0.5/NCE v2 scope. **Owner:** Casey.
2. **Old Admin → Audit Trail menu entry** — remove + 301 redirect (recommended) vs. leave a "Moved" entry. Confirm with Piotr.
3. **Old Validation → Westgard entries** — same question. Recommend remove + 301 redirect.
4. **Madagascar fixture seeding ownership** — Piotr's recommended fixture (control lot 22417C-TEST + 1-3s breach): lives in test repo, not v0.5 production code. Confirm test-repo location + commit ownership with Piotr.

---

## 12. Effort estimate

| Item | Hours (low–high) |
|---|---|
| Top-level QA sidenav group + IA wiring | 4–6 |
| Three pillar landings (`<QualityAssurancePillarLanding />`) | 4–6 |
| Two FUTURE-feature placeholders (`<FutureFeaturePlaceholder />`) | 2–3 |
| Route mounts for existing components at new paths | 4–6 |
| 301 redirects for legacy URLs | 2–3 |
| Permission registry (4 new keys, visibility-only) | 3–5 |
| Hide legacy entry points (Validation > Westgard, Admin > Audit Trail, top-level NCE) | 2–3 |
| Madagascar GRIST UAT step rewrites + fixture seed (test repo) | 3–5 |
| Tests (route resolution + permission gating + redirect coverage + new-component snapshots) | 4–6 |
| Cross-team PR review iteration (Westgard / EQA / NCE owners flagged) | 2–3 |
| **v0.5 total** | **30–46** |

Baseline midpoint: ~38h with Claude. Without Claude: ~55–85h.

This sits between the original "Sprint 2 fast-follow MVP" estimate (~30h) and the previous v2 estimate (~30–40h). It also subsumes most of what was in v2, so the **post-v0.5 v2 shrinks to E-Sig Log + accreditation management (community-led) + cleanup** (~20–30h or less if community leads accreditation).

---

## 13. Cross-references

| Document | Relevance |
|---|---|
| `qa-menu-versioning-plan.md` | Master version sequence — v0.5 inserts before v1; this FRS reflects the updated sequence |
| `qa-v0.5-rehome-outline.md` | Outline-level scope and rationale; this FRS is its ship-ready consolidation |
| `qa-v1-mvp-frs.md` | v1 ships on top of the v0.5 IA |
| `qa-final-preview.html` | End-state mockup; v0.5 is the first ship-ready slice |
| `qa-qc-narrative.md` | Audience-friendly walk-through of the four QC lenses + NCE/CAPA/QI/Accreditation |
| `test-accreditation-frs.md` (uploaded) | Canonical implementation reference for v2 accreditation work (community may lead) |
| `test-accreditation-mockup.jsx` (uploaded) | Reference Carbon-React implementation for the v2 accreditation pages |
| `test-accreditation-preview.html` (uploaded) | Reference HTML preview for the v2 accreditation pages |
| Piotr Mankowski Slack messages (2026-05-01) | Source of the four-QC-feature framing + Madagascar GRIST proposal |
| `designs/quality/analyzer-manual-qc.md` (DIGI-UW/openelis-work) | Cross-linked from Analyzer Manual QC FUTURE placeholder |
| `designs/quality/batch-workplan-reagent-qc.md` (DIGI-UW/openelis-work) | Cross-linked from Reagent QC FUTURE placeholder |
| Beth Dunbar's L0-02-03 Audit Trail note | Justification for adding Audit Trail to the menu via QMS pillar |

---

## 14. Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 1.0 | 2026-05-01 | Casey | Initial ship-ready FRS for v0.5. Inserts before v1 (MVP) per user request. Incorporates Piotr's four-QC-feature mental model + Madagascar GRIST alignment proposal + Beth's Audit Trail note. Accreditation management moved to v2 (community may lead) with `test-accreditation-frs.md` as canonical reference. |

---

## Appendix A — Comparison: v0.5 vs. v1 vs. v2

| Dimension | v0.5 | v1 (MVP) | v2 |
|---|---|---|---|
| Net-new features | None — pure IA | QI Dashboard MVP (4 KPI tiles) | E-Sig Log + Accreditation (community) |
| Sidenav | Adds QA top-level + 3 pillars + 6 leaves | Adds QI Dashboard child to QI pillar (which v1 introduces under QA) | Adds E-Sig Log + Accreditation under QMS |
| Backend | Routes + redirects only | 3 new wrappers (`/rest/qi/*`, `/rest/reports/tat/compliance`) | Accreditation backend (per `test-accreditation-frs.md`) |
| New permissions | 4 visibility (`qa.view.*`) | + `qa.manage.qi` (reserved) + QA Officer role | + accreditation permissions |
| Schema changes | None | None | New tables: `accrediting_body`, `test_accreditation` (per attached FRS) |
| Effort estimate | 30–46h | 45–55h | 25–35h (down from 30–40h after v0.5 absorbs the rehomes) |
| Risk profile | Low — IA only, no logic changes | Low — read-only wrappers + dashboard frontend | Medium — accreditation has report-rendering implications |
| External dependencies | NCE v2 scope (in progress) | Flexible-roles engine, sample_test_order table name | Test Catalog Management surface for accreditation pages |

---

*End of v0.5 (IA Rehome) FRS.*
