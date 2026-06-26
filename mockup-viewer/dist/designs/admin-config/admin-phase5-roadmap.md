# OpenELIS Admin Redesign — Phase 5 Roadmap

**Date:** 2026-04-23
**Baseline:** IA v2.3 (approved), Pattern Library v1.0 (ratified 2026-04-20)
**Cadence:** One page per session. Casey reviews each; next page starts on green-light.

---

## Scope

Phase 5 designs the 11 bucket landing pages plus the in-bucket admin pages they contain, using only the 13 ratified patterns from `admin-pattern-library.md`.

**Scope carve-outs:**

| What                              | Why                                                      |
|-----------------------------------|----------------------------------------------------------|
| Test Catalog in-bucket pages (6)  | Will be reworked as a separate project. Keep bucket landing only. |
| Phase 5b deep-dive pages (4)      | Handled in Phase 5b after Phase 5 proper: Program Entry, Reflex Tests, Calculated Values, Validation Configuration. |
| Legacy bucket pages (3)           | Retirement candidates or legacy pointers — no design work, just copy.  |

**Net Phase 5 artifacts:**

| Category                          | Count |
|-----------------------------------|-------|
| Bucket landing pages              | 11    |
| In-bucket pages (designed)        | 31    |
| Deep-dive pages (Phase 5b later)  | 4     |
| Skipped (TC in-bucket, Legacy)    | 9     |

That's **42 pages of design work** before Phase 6 handoff.

---

## Page inventory by bucket

Legend: ⭐ Top-5 priority · 🛠 In-bucket (Phase 5) · 🧩 Bucket landing · 🔬 Deep-dive (Phase 5b) · ⏭ Skipped per scope

### 1. People & Access (3 pages + landing)

| Page                          | Status | Notes                                  |
|-------------------------------|--------|----------------------------------------|
| People & Access landing       | 🧩     | Default bucket template                |
| ⭐ User Management            | 🛠     | **Page 1 of Phase 5** — full pattern exercise |
| ⭐ Provider Management        | 🛠     | Includes FHIR link fields              |
| ⭐ Organization Management    | 🛠     | Hierarchical parent/child              |

### 2. Test Catalog (0 in-bucket + landing, per scope)

| Page                          | Status | Notes                                  |
|-------------------------------|--------|----------------------------------------|
| Test Catalog landing          | 🧩     | Only Test Catalog artifact in Phase 5  |
| Test Management               | ⏭      | Reworked separately                    |
| Methods                       | ⏭      | Reworked separately                    |
| Analyzer Test Name            | ⏭      | Reworked separately                    |
| Program Entry                 | 🔬     | Phase 5b                               |
| Reflex Tests Management       | 🔬     | Phase 5b                               |
| Calculated Value Tests        | 🔬     | Phase 5b                               |

### 3. Reference Data (1 page + landing)

| Page                          | Status | Notes                                  |
|-------------------------------|--------|----------------------------------------|
| Reference Data landing        | 🧩     |                                        |
| ⭐ Dictionary Menu             | 🛠     | Taxonomy + category + term pattern     |

### 4. Workflow Tuning (8 pages + landing)

| Page                                  | Status | Notes                                  |
|---------------------------------------|--------|----------------------------------------|
| Workflow Tuning landing               | 🧩     |                                        |
| ⭐ NonConformity Configuration         | 🛠     | Workflow config pattern (the 5th Top-5)|
| Barcode Configuration                 | 🛠     | Print-preview treatment                |
| Batch test reassignment & cancelation | 🛠     |                                        |
| Validation Configuration              | 🔬     | Phase 5b — rule editor                 |
| Result Entry Configuration            | 🛠     |                                        |
| Order Entry Configuration             | 🛠     |                                        |
| Patient Entry Configuration           | 🛠     |                                        |
| WorkPlan Configuration                | 🛠     | Filter/group complexity — careful      |

### 5. Subscriptions & Notifications (1 page + landing)

| Page                                  | Status | Notes                                  |
|---------------------------------------|--------|----------------------------------------|
| Subscriptions landing                 | 🧩     | Placeholder bucket — grows with pages  |
| Test Notification Configuration       | 🛠     |                                        |

### 6. Lab Setup (4 pages + landing)

| Page                        | Status | Notes                              |
|-----------------------------|--------|------------------------------------|
| Lab Setup landing           | 🧩     |                                    |
| Site Information            | 🛠     | Single-record form, not a list     |
| Calendar Management         | 🛠     | Calendar grid — custom layout      |
| Language Management         | 🛠     |                                    |
| Translation Management      | 🛠     |                                    |

### 7. Lab Identity (2 pages + landing)

| Page                        | Status | Notes                              |
|-----------------------------|--------|------------------------------------|
| Lab Identity landing        | 🧩     |                                    |
| Site Branding               | 🛠     | Live theme preview                 |
| Lab Number Management       | 🛠     | Format-once, irreversible UX       |

### 8. Integrations (2 pages + landing)

| Page                        | Status | Notes                              |
|-----------------------------|--------|------------------------------------|
| Integrations landing        | 🧩     |                                    |
| External Connections        | 🛠     |                                    |
| List Plugins                | 🛠     | Read-mostly, install/remove        |

### 9. Reporting & Exchange (2 pages + landing)

| Page                             | Status | Notes                          |
|----------------------------------|--------|--------------------------------|
| Reporting & Exchange landing     | 🧩     |                                |
| Result Reporting Configuration   | 🛠     |                                |
| Printed Report Configuration     | 🛠     |                                |

### 10. System Administration (9 pages + landing)

| Page                             | Status | Notes                          |
|----------------------------------|--------|--------------------------------|
| SysAdmin landing                 | 🧩     | Gated visual treatment         |
| Application Properties           | 🛠     |                                |
| Notify User                      | 🛠     | Ad-hoc broadcast               |
| Search Index Management          | 🛠     | Break-glass                    |
| Logging Configuration            | 🛠     | Dev-facing                     |
| Global Menu Configuration        | 🛠     | Menu layout                    |
| Billing Menu Configuration       | 🛠     | Menu layout                    |
| Non-Conform Menu Configuration   | 🛠     | Menu layout                    |
| Patient Menu Configuration       | 🛠     | Menu layout                    |
| Study Menu Configuration         | 🛠     | Menu layout                    |

(Five menu-config pages share a template — design one, reuse the shell.)

### 11. Legacy (0 designs + landing)

| Page                             | Status | Notes                          |
|----------------------------------|--------|--------------------------------|
| Legacy landing                   | 🧩     | Explains what's here and why   |
| MenuStatement Configuration      | ⏭      | Retire — no design             |
| Field Validation Configuration   | ⏭      | Retire — no design             |
| Legacy Admin                     | ⏭      | Legacy pointer — no design     |

---

## Top-5 opening priority (with rationale)

These 5 pages exercise the full pattern set and set the design template for the other 37. Order is deliberate — each page tests a different "shape" so the next designer has a worked precedent.

**Revision 2026-04-23 — Role Management inserted at slot 2** because Casey's existing RBAC PRD (`openelis-work/designs/rbac/rbac-revamp-prd.md`) directly couples User Management (which holds role *assignment*) to Role Management (which holds role *definition*). Shipping one without the other leaves an orphaned assignment modal with no roles to pick from. NonConformity Configuration drops to the first post-Top-5 page in the Workflow Tuning bucket run.

| # | Page                          | Why first                                                             | Patterns exercised                              |
|---|-------------------------------|-----------------------------------------------------------------------|-------------------------------------------------|
| 1 | **User Management**           | Widest pattern coverage; people know what a user list looks like. Ports existing RBAC mockup + absorbs password-enhancements UX. | P-01 through P-13 (all 13)                      |
| 2 | **Role Management** 🆕         | Dependency of User Management — defines the roles that Add Role Assignment consumes. Tests permission-composition form + sticky action bar. | P-01 P-02 P-03 P-05 P-06 P-07 P-08 P-09 P-10 P-11 P-12 P-13 |
| 3 | **Provider Management**       | Similar shape with an extra wrinkle (FHIR link fields); tests reusability of the User Mgmt shell. | P-01 P-02 P-03 P-04 P-05 P-06 P-07 P-08 P-09 P-10 P-11 P-12 P-13 |
| 4 | **Organization Management**   | Hierarchical parent/child — tests tree/table relationship & bulk.     | P-01 P-02 P-03 P-04 P-05 P-06 P-07 P-08 P-09 P-10 P-11 P-12 P-13 |
| 5 | **Dictionary Menu**           | Different shape (taxonomy with categories + terms). Tests nested lists. | P-01 P-02 P-03 P-04 P-05 P-06 P-07 P-08 P-09 P-10 P-12 P-13 |

**NonConformity Configuration** moves from Top-5 to first Workflow-Tuning bucket page (still tests config-form shell for that bucket; patterns P-01…P-10 + P-13).

After Top 5 ship and Casey signs off, the remaining pages follow in bucket order, reusing the templates established by Top 5.

**Source docs for Top-5 Pages 1 and 2:**
- `openelis-work/designs/rbac/rbac-revamp-prd.md` (v1.0, 2026-03-04) — authoritative RBAC PRD
- `openelis-work/designs/rbac/rbac-ui-mockup.html` — reference visual for User Management + Role Management
- `openelis-work/designs/admin-config/password-enhancements.md` (v1.0, 2026-03-15) — force-reset UX absorbed into User Management FRS
- `openelis-work/jira-handoff-rbac.md` — existing Epic + 4 phase tasks (indonesia label, Reagan)

---

## Per-page deliverable format

Each page produces three files (per openelis-design skill v3.1 `/specify`):

1. **`[slug]-frs.md`** — Functional Requirements Spec, 12 sections, including:
   - Overview (one paragraph)
   - User Stories (2–5 "As a [role], I want [action] so that [outcome]")
   - JTBD
   - Functional Requirements (FR-01, FR-02, …)
   - Data Model (entities + fields)
   - Patterns Used (references by ID, e.g. P-01, P-03)
   - Permission Scope (ADMIN_MENU or TEST_CATALOG_MANAGE)
   - Non-Functional Requirements (perf, a11y, i18n)
   - Acceptance Criteria (each traces to FR)
   - Localization (i18n key table)
   - Out of Scope
   - Open Questions

2. **`[slug]-mockup.jsx`** — Carbon React implementation mockup using `@carbon/react` imports. Uses `t(key, fallback)` for every string.

3. **`[slug]-preview.html`** — standalone HTML preview via CDN Carbon styles + React + Babel. Fast visual review, no build step.

**Naming convention:** lowercase, hyphenated slug. E.g. `user-management-frs.md`, `user-management-mockup.jsx`, `user-management-preview.html`.

---

## Process per session

1. **Brief first** (constitution Principle 7). Before any JSX, post a short design brief: purpose, primary user action, layout pattern, interaction model, scope boundary, Carbon components list.
2. **Clarify if ambiguous.** If the brief surfaces unknowns, run `/clarify` with up to 5 questions.
3. **Produce all three artifacts.** FRS + mockup + preview together.
4. **Share and wait for sign-off.** Post `computer://` links. Casey reviews, flags changes or approves.
5. **Green-light → next page.** Jira story creation (via Phase 6) only after FRS+mockup are approved.

---

## Cadence and timeline

- **One page per session.** Casey reviews between sessions.
- **Top-5 first run:** 5 sessions. Each session = brief + FRS + mockup + preview.
- **Remainder:** 28 in-bucket pages + 10 bucket landings = 38 more sessions, but several pages share templates (5 menu-config pages share one shell; most bucket landings share a template). Realistic working estimate: 25 sessions for the remainder.
- **Phase 5b deep-dives:** 4 sessions (Program Entry, Reflex, Calc, Validation Config). Handled separately.
- **Total projected Phase 5 sessions:** ~30 sessions to full coverage.

If any page raises a new pattern not in the library, the Phase 4 audit doc reopens as an amendment (governance rule in the library).

---

## Sign-off process

After each page design, Casey reviews three artifacts and responds:

- ✅ **Approved** — move to next page. FRS + mockup become locked Phase 6 inputs.
- ✏️ **Approved with changes** — apply changes, re-share, then move on.
- 🔄 **Rework required** — diagnose the gap (brief was wrong? pattern mismatch? missing JTBD?), revise, re-share.

Approved pages are added to a running index at the top of `admin-phase5-index.md` (created after page 1 ships).

---

## Risk register

| Risk                                           | Mitigation                                                            |
|------------------------------------------------|-----------------------------------------------------------------------|
| Pattern library misses a pattern we need       | Propose amendment to `admin-patterns-audit.md`; don't invent silently |
| Drift between FRS and mockup                   | `/analyze` pass before handoff; trace table at bottom of FRS          |
| Test Catalog rework scope creep                | Pin TC scope to bucket landing only in every FRS; reject in-bucket design requests |
| Five menu-config pages copy-paste              | Design one, extract template, reuse for the other four                |
| Calendar / Site Branding have custom UX        | Flagged in roadmap; allocate extra session if needed                  |
| Phase 5b deep-dives bleed into Phase 5         | Strict gate: no 5b work until Top-5 complete                          |

---

## Next step (this session)

Proceed to Page 1: **User Management**.
Deliverables: design brief (for your approval before mockup), `user-management-frs.md`, `user-management-mockup.jsx`, `user-management-preview.html`.
