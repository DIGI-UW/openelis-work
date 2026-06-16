# S-09 Pre-Analytical Eligibility Gate — Story Breakdown (v3.0)

**FRS:** `S09-eligibility-gate-frs-v3.0.md`
**Mockup:** `S09-eligibility-gate-mockup-v3.jsx` · **Preview:** `S09-eligibility-gate-preview-v3.html`
**Existing ticket:** [OGC-580](https://uwdigi.atlassian.net/browse/OGC-580) — currently a single Story, *Selected for Development*. Recommend converting to an **Epic** and rewriting from this FRS; the current single-story scoping understates the work and is built on the superseded v2.0 design.
**Pipeline:** Claude Code (agentic) — slices sized to **one reviewable PR each**, not story points.
**Status:** PLAN ONLY — no Jira changes until you confirm the end goal and say to assign.

---

## Epic
**Title:** S-09 Pre-Analytical Eligibility Gate & Resampling
**Summary:** A generic, manually-completed sample acceptance checklist at reception Step 3, plus a Resample action that rejects a sample and spawns a linked pre-populated draft order with requester notification. Configuration is a lightweight master list, fully decoupled from the Test Catalog editor.
**Linked program epic:** OGC-527 (Environmental/Vector) — "is part of", not reparented.
**Labels (propagate to all stories):** `S-09`, `clinical`, `environmental`, `vector`, `indonesia`
**Depends on:** OGC-537 (S-03 v2.0 Step 3 + per-sample NCE button).

---

## Slices

Four vertical slices, dependency-ordered. v1 is independently demoable. Each is a single PR a reviewer can read in one sitting.

### v1 — Resample action + checklist read from a seeded list
*The thinnest end-to-end win. Usable on its own; no new admin UI needed to demo.*

| Slice item | What lands | Notes / cross-cutting |
|---|---|---|
| Backend: `sample_acceptance_checklist_item` table + seed 6 defaults; read endpoint | Schema migration + seed + `GET /rest/sample-acceptance-checklist` | Envers `@Audited` on the item table |
| Backend: `sample_acceptance_record` table + persist endpoint | Immutable record write; `POST /rest/samples/{id}/acceptance-record` | `SAMPLE_ACCEPTANCE_RECORDED` audit event |
| Backend: Resample orchestration | `POST /rest/samples/{id}/resample` — transactional: NCE + reject + new draft order (copy fields) + `resampled_from`/`resampled_to` columns + queue notification | reuses existing NCE/order/notification services; `SAMPLE_RESAMPLE_COMMITTED` audit; i18n `notification.eligibility.*` |
| Frontend: Step 3 checklist side panel + eligibility Tags | Side panel (Pass/Fail/NA + note) filtered to the order's domain, read-only transit context, row Tags (Accepted/Review/Pending) | i18n `label.eligibility.*`, `tag.eligibility.*`; reuses `order.qa` |
| Frontend: NCE pre-population (FR-07A) | Opening the NCE dialog from a sample with failed items auto-fills the reason with those items + notes; editable; blank when opened manually | carries failed-item set into the NCE record |
| Frontend: Resample radio on the NCE dialog | Third `sample_action`; hidden without `order.enter`; cross-reference banner on both orders | i18n `label.nce.sampleAction.resample` |

**Demo:** open Step 3 → tick the domain-specific seeded checklist → a failed item routes to the NCE dialog with the reason pre-filled → choose Resample → a linked pre-filled draft order appears and the requester is notified.

### v2 — Checklist master-list admin (domain-organized)
*Make the checklist editable instead of seed-only, organized by domain.*

| Slice item | What lands |
|---|---|
| Checklist + enforcement editor under **Admin → General Configuration → Order Entry Configuration** (extends that page's route with `section=sampleAcceptanceChecklist&domain={...}`) | CRUD + soft-deactivate + reorder + domain tag; **domain navigation via SideNav submenu items** (All domains / Clinical / Environmental / Vector — not in-page tabs); precedence: domain list overrides lab-wide; on Step 3 only the resolved list shows, while the admin view shows superseded lab-wide items visible-disabled; lab-wide applied as fallback when a domain has no list; `ACCEPTANCE_CHECKLIST_ITEM_CHANGED` written to the existing system-wide `audit_trail` |

### v3 — Enforcement modes (per domain)
*Turn the checklist from advisory into a gate where labs want it — keyed to domain, not lab unit.*

| Slice item | What lands |
|---|---|
| Per-domain enforcement (Mandatory / Optional / Off for each of Clinical / Environmental / Vector) + Step 3 submit guard | Three config values (no per-lab-unit setting); the order's domain selects which applies; `ELIGIBILITY_ENFORCEMENT_CHANGED` audit incl. domain; default Optional on upgrade |

### v4 — Intake queue filter
*Make the daily receiving queue visible without a new screen.*

| Slice item | What lands |
|---|---|
| Order Dashboard "awaiting intake" filter | Reuses existing dashboard filtering; sort by received-at-lab asc; no new route, no new status enum |

---

## Deferred (not in this Epic)
- Shipment-level batch grouping (one NCE across a shared root cause) — P2 follow-up.
- Vector CollectionLot pool variant — V-02 spec.
- Order status-enum formalization — separate initiative if dashboards later need named states.

## Coverage check
- Every FR maps to a slice: FR-01/02 → v1 (seed/read), FR-03 → v2 (domain-organized admin); FR-04/05/06/07/07A → v1; FR-08 → v3 (per-domain); FR-09/10/11 → v1; FR-12 → v1; FR-13 → v4. ✅
- Every mockup element built: checklist panel + Tags + NCE Resample → v1; admin list + enforcement → v2/v3; dashboard filter → v4. ✅
- Cross-cutting assigned: i18n per slice; audit events per state-changing slice; Envers on the item table (v1); permissions reuse existing keys (no new keys). ✅
- No forward dependencies; v1 ships alone. ✅

## Suggested minimal first assignment
If you want the smallest possible next-sprint commitment: **v1 only.** It delivers the auditable acceptance record and the one-click Resample — the whole point of S-09 — with zero new admin screens and zero coupling to the Test Catalog work.
