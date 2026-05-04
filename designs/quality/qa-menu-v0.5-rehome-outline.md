# QA Menu v0.5 — IA Rehome (existing + in-progress)
## FRS Outline — ships **before** v1 (MVP)

**Document Version:** 0.1 (outline)
**Date:** 2026-05-01
**Author:** Casey Iiams-Hauser
**Status:** Outline; replaces the rehome scope previously in v2 of the versioning plan
**Companion mockup:** `qa-v0.5-preview.html` (forthcoming)
**Sources of truth:**
- Piotr Mankowski's landscape review (Slack #oe-madagascar-internal, 2026-05-01) — four-QC-feature mental model
- Piotr's "Concrete proposal for aligning the three reqs" (Slack same channel, same day) — Madagascar GRIST LO-07-02/03/04 alignment
- `designs/quality/analyzer-manual-qc.md` (DIGI-UW/openelis-work)
- `designs/quality/batch-workplan-reagent-qc.md` (DIGI-UW/openelis-work)
- Beth Dunbar's note that Audit Trail is missing from the menu (per MedX validation L0-02-03)

---

## 0. Why v0.5 exists

The Madagascar GRIST treats Quality Control as one umbrella with three "QC reqs" (LO-07-02, -03, -04). Piotr's landscape review surfaced what's actually under the hood: **four distinct QC features at different ship stages**, none of which currently have a coherent menu home, plus **NCE v2 in active development** without a final IA destination.

Today, a user looking for any of these features has to know to navigate through Validation, the Analyzer module, the legacy NCE workflow, or the Admin menu — depending on which feature they want. UAT testers can't validate the QC reqs because the surfaces are too fragmented.

v0.5 fixes the IA without adding net-new features: it brings everything that already exists (or is actively being built) under a new top-level **Quality Assurance** menu. This unblocks the Madagascar UAT, gives in-progress NCE v2 work a final IA destination, and sets up the foundation that v1 (MVP) and later versions will build on.

**The four-feature mental model** (Piotr) is preserved in the v0.5 IA: each gets its own slot under Statistical QC, with FUTURE features rendered as placeholder leaves cross-linked to their design docs.

---

## 1. Scope

### 1.1 In scope

1. **New top-level Quality Assurance sidenav group** — same as v1 spec, but lands in v0.5 instead.
2. **Statistical QC pillar** with the Westgard / QC Dashboard module rehomed:
   - QC Dashboard (existing — at `/analyzers/qc/db`, fully merged)
   - QC Alerts tab (existing — accessed via QC Dashboard)
   - **Reagent QC** placeholder leaf — cross-links to `designs/quality/batch-workplan-reagent-qc.md`. **FUTURE**, no functional UI.
   - **Analyzer Manual QC** placeholder leaf — cross-links to `designs/quality/analyzer-manual-qc.md`. **FUTURE**, no functional UI.
3. **EQA pillar** with the existing EQA module rehomed (V1 EQA, the `isEqaSample` flag flow, validates today).
4. **QMS & Improvement pillar** with:
   - **NCE v2** rehomed under `/qa/qms/nce-register` — the in-progress Carbon-React modernization. v0.5 ships whatever NCE v2 includes at the time it lands.
   - **Audit Trail** rehomed from Admin (cross-link preserved). Currently missing from the menu per Beth's L0-02-03 note — v0.5 fixes this.
5. **301 redirects** from old paths:
   - `/analyzers/qc/db` → `/qa/qc/dashboard`
   - `/analyzers/qc/db/alerts` → `/qa/qc/dashboard/alerts`
   - `/eqa/...` → `/qa/eqa/...` (preserve all sub-paths)
   - `/non-conform/...` → `/qa/qms/nce/...` (the NCE v2 paths)
   - `/admin/audit-trail` → `/qa/qms/audit-trail`
6. **Permission registry additions**:
   - `qa.view.overview` (visibility of the QA top-level node)
   - `qa.view.qc` (Statistical QC pillar)
   - `qa.view.eqa` (EQA pillar)
   - `qa.view.qms` (QMS pillar)
7. **Pillar landings** (Statistical QC, EQA, QMS) — simple tile-grid pages listing the leaves under each pillar. No pillar rollup status (that's v1+ territory).
8. **i18n** — new menu / breadcrumb / pillar-landing strings.

### 1.2 Out of scope (deferred, version listed)

| Feature | Lands in |
|---|---|
| QA Overview landing page (5-question strip + 4 pillar tiles) | v1 |
| QI Dashboard MVP | v1 |
| 3 new REST wrappers (rejection-rate, amendment-rate, tat-compliance) | v1 |
| QA Officer default role | v1 |
| Electronic Signature Log | v2 |
| Accreditation Status registry | v3 |
| Modern NCE Create/Report flow (if not already in NCE v2 scope) | v5 |
| NCE Analytics page | v6 |
| CAPA Register | v7 |
| QI Dashboard full + QI Configuration + Pillar-3 detail pages | v8 |
| Critical Callback Compliance | v9 |
| EQA V2 full build (My EQA, Lab Performance, Follow-Up, Competency, Program Mgmt) | v10–v11 |
| Results Entry inline NCE upgrade | v12 |
| **Reagent QC** functional UI (per Piotr) | TBD — design doc exists, build not scoped |
| **Analyzer Manual QC** functional UI (per Piotr) | TBD — design doc exists, build not scoped |

### 1.3 Non-goals

- v0.5 does **not** redesign any of the rehomed pages. It moves them; the existing UI continues to render at the new URL.
- v0.5 does **not** modernize Audit Trail or QC Dashboard beyond what's already merged.
- v0.5 does **not** add net-new database tables or schema migrations.
- v0.5 does **not** redefine the Madagascar GRIST reqs — see `qa-v0.5-grist-alignment.md` for how v0.5 enables passing them, but the reqs themselves are owned by the Madagascar consortium.

---

## 2. Information architecture (v0.5)

### 2.1 Sidenav

```
Home
Order
Results
Patient
Sample
Quality Assurance                              ◄── NEW (top-level)
  ├── Statistical QC                           ◄── NEW pillar
  │   ├── QC Dashboard           [rehomed]     ◄── existing /analyzers/qc/db
  │   ├── QC Alerts              [rehomed]     ◄── existing /analyzers/qc/db/alerts
  │   ├── Reagent QC             [future]      ◄── placeholder, cross-links to design doc
  │   └── Analyzer Manual QC     [future]      ◄── placeholder, cross-links to design doc
  ├── EQA                                       ◄── NEW pillar
  │   └── (existing EQA pages, rehomed under)
  └── QMS & Improvement                         ◄── NEW pillar
      ├── NCE Register           [in progress] ◄── NCE v2, rehomed when it lands
      └── Audit Trail            [rehomed]     ◄── existing, was missing from menu
Reports
Administration
```

The legacy entry points (top-level NCE if it existed; Validation > Westgard; Admin > Audit Trail) are **removed** from the sidenav in v0.5. Legacy URLs continue to resolve via 301 redirects for one major release.

### 2.2 Pillar landing pages (new in v0.5)

Three simple landing pages, one per pillar. Each page renders a tile grid of the pillar's leaves with one-line descriptions, plus standardized placeholder treatment for FUTURE leaves.

**Statistical QC landing** (`/qa/qc`):
```
Statistical QC

QC Dashboard          [rehomed]
  Internal-control monitoring with Westgard rules.
  View ↗

QC Alerts             [rehomed]
  Westgard rule violations across analyzers.
  View ↗

Reagent QC            [future]
  Per-lot reagent QC frequency tracking. Design doc.
  Read design ↗

Analyzer Manual QC    [future]
  PASS/FAIL log per instrument per day. Design doc.
  Read design ↗
```

**EQA landing** (`/qa/eqa`):
```
EQA (Proficiency Testing)

(Tile grid of existing EQA pages — same titles, new URL.)
```

**QMS & Improvement landing** (`/qa/qms`):
```
QMS & Improvement

NCE Register          [in progress]
  Non-conformity events. NCE v2 lands here.
  View ↗

Audit Trail           [rehomed]
  Configuration / record-change audit log.
  View ↗
```

### 2.3 Pillar landings vs. QA Overview

v0.5 does **not** ship a QA Overview page. The QA top-level node defaults its landing to the Statistical QC pillar (or the most recently visited pillar via user-pref). v1 (MVP) introduces QA Overview later as a rollup of the QI Dashboard MVP plus pillar status.

### 2.4 FUTURE-leaf placeholder UX

For Reagent QC and Analyzer Manual QC (and any other FUTURE leaves added later), the placeholder page shows:

- Page title (e.g., "Reagent QC")
- Banner: "This feature is in design. Read the design doc on GitHub."
- Cross-link to the design doc URL on `DIGI-UW/openelis-work`
- Brief functional summary (1–2 paragraphs from the design doc)
- "Notify me when this ships" button (optional; defers to v2+ if email notifications aren't wired up)

This treatment is also how the v0.5 IA enables the Madagascar GRIST partial passes (LO-07-03 instrument-verification + reagent-batch bullets).

---

## 3. Madagascar GRIST alignment (per Piotr)

v0.5 directly enables the three QC reqs to pass UAT, in the way Piotr proposed:

| Req | Today | After v0.5 | Round-2 rewrite |
|---|---|---|---|
| **LO-07-02** Internal Control | Test points at `/analyzers/errors`, no clear surface | Test points at `/qa/qc/dashboard` (the rehomed Westgard module) and seeds a Westgard violation | Update test step paths + seed a 1-3s violation via the harness. ✓ Achievable in v0.5. |
| **LO-07-03** Calibration samples | Smushed: EQA + instrument-verification + reagent-batch all under one req | Split: EQA path validates against the rehomed `/qa/eqa/...` (V1 EQA `isEqaSample` flag flow). Instrument-verification + reagent-batch bullets marked **PARTIAL** with cross-links to the future-feature placeholders at `/qa/qc/analyzer-manual-qc` and `/qa/qc/reagent-qc` (which themselves link to the design docs). | Validate EQA path; mark the other two bullets PARTIAL with design-doc references. ✓ Achievable in v0.5. |
| **LO-07-04** Invalid quality indicators | No clear surface | 3-step pass-through against `/qa/qc/dashboard/alerts` (the rehomed Alerts tab); piggybacks on the LO-07-02 seeded violation | 3-step Alerts-tab walk. ✓ Achievable in v0.5. |

Companion doc: `qa-v0.5-grist-alignment.md` (forthcoming) — captures the test-step rewrites for each LO and the harness fixture seed (control lot with established mean/SD + a fresh control result that breaches 1-3s).

---

## 4. Permission registry

Four new permissions, all visibility-scoped (no `manage` permissions in v0.5 — nothing in v0.5 is editable that wasn't already editable in its pre-rehome location):

| Permission key | Description |
|---|---|
| `qa.view.overview` | Visibility of the Quality Assurance top-level sidenav node. |
| `qa.view.qc` | Visibility of the Statistical QC pillar + its leaves. |
| `qa.view.eqa` | Visibility of the EQA pillar + existing EQA pages at new URLs. |
| `qa.view.qms` | Visibility of the QMS pillar + NCE Register + Audit Trail. |

**Existing permissions inherit unchanged.** A user who could see Westgard at `/analyzers/qc/db` can see it at `/qa/qc/dashboard` if they have `qa.view.qc` plus whatever permission gated the original Westgard page. Existing permission keys (e.g., for NCE, EQA, audit access) remain authoritative for the underlying actions.

No default role changes in v0.5. The QA Officer role is added in v1 (MVP).

---

## 5. Frontend implementation

### 5.1 What changes

- **Sidenav**: new Carbon `SideNavMenu` for Quality Assurance with three sub-`SideNavMenu` for the pillars and `SideNavMenuItem` for each leaf.
- **Routes** (react-router):
  - `/qa` → redirects to `/qa/qc` (default) or last-visited pillar via user-pref
  - `/qa/qc` → Statistical QC landing
  - `/qa/qc/dashboard` → existing `<QCDashboard />` component (no change to the component itself)
  - `/qa/qc/dashboard/alerts` → existing `<QCAlerts />` component
  - `/qa/qc/reagent-qc` → `<FutureFeaturePlaceholder feature="reagent-qc" />`
  - `/qa/qc/analyzer-manual-qc` → `<FutureFeaturePlaceholder feature="analyzer-manual-qc" />`
  - `/qa/eqa` → EQA landing
  - `/qa/eqa/*` → existing EQA components (mounted at new path prefix)
  - `/qa/qms` → QMS landing
  - `/qa/qms/nce/*` → NCE v2 components (whatever NCE v2 lands with)
  - `/qa/qms/audit-trail` → existing `<AuditTrail />` component
- **301 redirects** from old paths configured in the existing OpenELIS routing layer.

### 5.2 What does **not** change

- Component implementations of QC Dashboard, QC Alerts, EQA pages, NCE v2, Audit Trail. v0.5 mounts them at new routes; their internals are untouched.
- Database schema. No new tables, no migrations.
- Backend endpoints. Existing REST endpoints continue to serve. (NCE v2 may add endpoints as part of its own scope — those are separate from v0.5.)

### 5.3 New components (small)

- `<QualityAssurancePillarLanding pillar="qc|eqa|qms" />` — tile-grid landing.
- `<FutureFeaturePlaceholder feature="..." />` — placeholder + design-doc link.

Both are thin compositions of existing Carbon `Tile` components. Estimated build: ~4–6h.

---

## 6. Acceptance criteria

### 6.1 IA + sidenav

- [ ] Quality Assurance top-level node renders in the sidenav.
- [ ] Three pillar sub-menus render: Statistical QC, EQA, QMS & Improvement.
- [ ] Statistical QC pillar shows four leaves: QC Dashboard, QC Alerts, Reagent QC (future), Analyzer Manual QC (future).
- [ ] EQA pillar lists existing EQA pages.
- [ ] QMS pillar shows two leaves: NCE Register, Audit Trail.
- [ ] Top-level Validation node no longer contains Westgard / QC Dashboard entries.
- [ ] Admin → Audit Trail entry is removed (cross-link preserved as a redirect; old Admin item is hidden).
- [ ] Old top-level NCE entry (if present) is hidden.

### 6.2 Routing + redirects

- [ ] `/analyzers/qc/db` 301-redirects to `/qa/qc/dashboard`.
- [ ] `/analyzers/qc/db/alerts` 301-redirects to `/qa/qc/dashboard/alerts`.
- [ ] `/eqa/*` 301-redirects to `/qa/eqa/*` preserving sub-paths.
- [ ] `/non-conform/*` 301-redirects to `/qa/qms/nce/*`.
- [ ] `/admin/audit-trail` 301-redirects to `/qa/qms/audit-trail`.
- [ ] All three pillar landings render at `/qa/qc`, `/qa/eqa`, `/qa/qms`.
- [ ] Future-feature placeholders render at `/qa/qc/reagent-qc` and `/qa/qc/analyzer-manual-qc` with working design-doc cross-links.

### 6.3 Permissions

- [ ] User without `qa.view.overview` does not see the Quality Assurance node.
- [ ] User without `qa.view.qc` does not see the Statistical QC pillar; direct navigation 403s.
- [ ] User without `qa.view.eqa` does not see the EQA pillar; direct nav 403s.
- [ ] User without `qa.view.qms` does not see the QMS pillar; direct nav 403s.
- [ ] Underlying page-level permissions (Westgard config edit, Audit Trail view, NCE permissions) remain authoritative for actions within each page.

### 6.4 Madagascar GRIST UAT

- [ ] LO-07-02 Round-2 test points at `/qa/qc/dashboard` and a seeded Westgard 1-3s violation appears.
- [ ] LO-07-03 EQA-bullet validates against rehomed EQA path.
- [ ] LO-07-03 instrument-verification + reagent-batch bullets are marked PARTIAL in Grist with links to the design-doc cross-link pages.
- [ ] LO-07-04 3-step Alerts-tab walk passes against `/qa/qc/dashboard/alerts`.

### 6.5 Cross-cutting

- [ ] All new strings (sidenav labels, pillar landings, future-feature placeholder text) localized.
- [ ] Lighthouse a11y score ≥ 95 on each new pillar-landing page.
- [ ] Existing component a11y is unchanged (no regressions from rehome).

---

## 7. Effort estimate

| Item | Hours (low–high) |
|---|---|
| Top-level QA sidenav group + IA wiring | 4–6 |
| Three pillar landings (`<QualityAssurancePillarLanding />`) | 4–6 |
| Two FUTURE-feature placeholders (`<FutureFeaturePlaceholder />`) | 2–3 |
| Route mounts for existing components at new paths | 4–6 |
| 301 redirects for legacy URLs | 2–3 |
| Permission registry (4 new keys, visibility-only) | 3–5 |
| Hide legacy entry points (Validation > Westgard, Admin > Audit Trail, top-level NCE) | 2–3 |
| Madagascar GRIST UAT step rewrites + seed fixture | 3–5 |
| Tests (route resolution + permission gating + redirect coverage) | 4–6 |
| Cross-team PR review iteration (Westgard / EQA / NCE owners flagged) | 2–3 |
| **v0.5 total** | **30–46** |

Baseline: ~35h with Claude.

This sits between the original "Sprint 2 fast-follow MVP" estimate (~30h) and the previous v2 estimate (~30–40h). It also subsumes most of what was in v2, so the **post-v0.5 v2 shrinks to just the E-Sig Log + any v2 cleanup** (~15–20h).

---

## 8. Versioning impact

v0.5 inserts before v1 (MVP). The version sequence becomes:

| Version | Scope | Effort | Status |
|---|---|---|---|
| **v0.5** | IA reorganization + rehomes (Westgard / EQA / NCE v2 / Audit Trail) + future-feature placeholders + Madagascar GRIST alignment | 30–46h | NEW |
| v1 | MVP QI Dashboard (QA Overview + 4 KPI tiles + 3 wrappers + permissions) | 45–55h | Unchanged scope; lands on v0.5 IA |
| v2 | Electronic Signature Log + cleanup | ~15–20h (down from 30–40h) | Reduced — most v2 rehomes moved to v0.5 |
| v3 | Accreditation Status registry | 25–30h | Unchanged |
| v4 | NCE Register modernization | 40–50h | **Reconsider:** if NCE v2 covers the modernization, v4 may collapse into v0.5 / NCE v2 scope |
| v5 | NCE Create/Report flow | 30–40h | Reconsider in light of NCE v2 scope |
| v6 | NCE Analytics | 30–40h | Reconsider in light of NCE v2 scope |
| v7 | CAPA Register | 25–35h | Unchanged |
| v8 | QI Dashboard full + QI Configuration + Pillar-3 detail pages | 50–60h | Unchanged |
| v9 | Critical Callback Compliance | 30–40h | Unchanged |
| v10 | EQA V2 part 1 | 45–55h | Unchanged |
| v11 | EQA V2 part 2 | 40–50h | Unchanged |
| v12 | Results Entry inline NCE upgrade | 10–15h | Unchanged |

**v0.5 reframes v4–v6** because NCE v2 (in progress) covers some or all of the NCE modernization scope we previously had in v4. Once NCE v2 lands and we know what it shipped, v4–v6 can be re-scoped (or collapsed) accordingly. **Action item:** clarify NCE v2 scope with Piotr / Mozzy before v0.5 ships so the post-v0.5 v4 / v5 / v6 plan is accurate.

---

## 9. Open questions

1. **NCE v2 scope** — does the in-progress NCE v2 build cover everything we previously had in v4 (modern Carbon-React register), v5 (Create/Report flow with 11 trigger points), and v6 (Analytics page)? Or just the register? Need confirmation from Piotr / Mozzy. **Owner:** Casey.
2. **Old Admin → Audit Trail menu entry** — completely remove, or leave a "Moved" entry that redirects? Recommend remove + 301 redirect on the URL; admins who have muscle memory get the redirect. Confirm with Piotr.
3. **Old Validation → Westgard entries** — same question. Recommend remove + 301 redirect.
4. **Future-feature placeholder voice** — should the page say "in design" / "coming soon" / "design doc"? Recommend "in design" with link to GitHub design doc — matches Piotr's framing as "future feature with referenced design".
5. **Madagascar fixture seeding** — Piotr suggested seeding "a control lot with established mean/SD, a fresh control result that breaches 1-3s." Confirm this is a one-time harness setup that lives in the test repo, not a v0.5 deliverable per se.

---

## 10. Cross-references

| Document | Relevance |
|---|---|
| `qa-menu-versioning-plan.md` | Master version sequence — needs v0.5 insertion (this outline informs that update) |
| `qa-v1-mvp-frs.md` | v1 ships on top of the v0.5 IA |
| `qa-final-preview.html` | End-state mockup; v0.5 is a stepping stone |
| `qa-mvp-kpi-rollup-outline.md` | The v1 (MVP) KPI dashboard, unchanged by v0.5 |
| Piotr's Slack message (2026-05-01 06:18:12 +07) | Four-QC-feature mental model — basis for v0.5's Statistical QC pillar IA |
| Piotr's Slack message (2026-05-01 06:22:38 +07) | Madagascar GRIST alignment proposal — basis for §3 |
| `designs/quality/analyzer-manual-qc.md` (DIGI-UW/openelis-work) | Cross-linked from Analyzer Manual QC placeholder |
| `designs/quality/batch-workplan-reagent-qc.md` (DIGI-UW/openelis-work) | Cross-linked from Reagent QC placeholder |
| Beth's L0-02-03 Audit Trail note | Justification for adding Audit Trail to the menu via QMS pillar |

---

## 11. Revision history

| Version | Date | Author | Notes |
|---|---|---|---|
| 0.1 | 2026-05-01 | Casey | Initial outline. Inserts a v0.5 before v1 (MVP) per user request. Incorporates Piotr's four-QC-feature mental model + Madagascar GRIST alignment proposal + Beth's Audit Trail note. |

---

*Outline only — full FRS authored alongside the v0.5 mockup.*
