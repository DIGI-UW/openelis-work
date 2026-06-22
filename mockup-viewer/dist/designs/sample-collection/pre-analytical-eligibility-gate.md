# S-09 — Pre-Analytical Eligibility Gate & Resampling
## Functional Requirements Specification — v3.0

**Version:** 3.0 (simplification rewrite of v2.0)
**Date:** 2026-06-16
**Status:** Draft for Review
**Jira:** [OGC-580](https://uwdigi.atlassian.net/browse/OGC-580) (to be rewritten + re-sliced from this FRS)
**Addendum to:** S-03 v2.0 — Environmental Order Entry ([OGC-537](https://uwdigi.atlassian.net/browse/OGC-537)) §5.3 (Step 3 QA/QC + Intake Acceptance)
**Supersedes:** v2.0 — which still modelled an auto-evaluating per-SampleType criteria engine and planned to extend a SampleType admin tab that the Test Catalog redesign ([OGC-746](https://uwdigi.atlassian.net/browse/OGC-746), Done 2026-06-15) has since removed. v3.0 replaces the engine with a generic manual checklist and decouples configuration from the test catalog. See `S09-eligibility-gate-analysis-v3.md`.

---

## Lab Context

### Current State
When physical samples arrive at the lab, a receiving technician inspects each one before it goes to the bench: is the container intact, is the label readable, is there enough sample, did the cold chain hold, is the request paperwork present. Today in OpenELIS this happens at Step 3 of the reception workflow ("QA/QC + Intake Acceptance"). The tech eyeballs each sample and either lets it through or clicks the existing **NCE button** (Non-Conformity Event) to record a problem and either flag the sample (let it continue with a note) or reject it. There is no on-screen list of *what to check* — the checks live in the tech's head or on a paper SOP taped to the bench. When a sample is rejected and the field team needs to collect a fresh one, the tech rejects it here, then separately creates a brand-new order by hand and phones or emails the requester.

### Pain
Two concrete problems. First, the acceptance checks are undocumented in the system: an accreditation auditor (ISO 15189 / ISO 17025 require a recorded acceptance decision for every primary sample) cannot see *which* criteria were verified — only that the sample was or wasn't flagged. New techs miss checks because nothing prompts them. Second, "reject and ask for a new sample" is two disconnected actions: reject here, then re-key an entire order from scratch elsewhere, with no link between the rejected sample and its replacement. A tech re-typing a 10-test environmental order by hand after every cold-chain break wastes minutes per sample and breaks the data trail — analytics can't tell a first attempt from a re-collection.

### What Changes
At Step 3, each sample now shows a short **acceptance checklist** — a configurable list of plain yes/no checks (container intact, label legible, volume adequate, cold chain intact, paperwork present) that the tech ticks off by eye. The transit time since collection is shown next to it for reference. The checklist is recorded with the sample, so the acceptance decision is auditable. Nothing is auto-graded — the tech is the judge; the checklist just makes sure nothing is forgotten and writes down what was checked. When a sample fails, the same NCE dialog the tech already uses gains one new option: **Resample**. Choosing it rejects the original *and* creates a ready-made new draft order copied from the original (same site, tests, sample types) *and* texts or emails the requester with the reason and a link — all in one click. The lab's day: fewer missed checks, an audit-ready acceptance record, and re-collection that takes one click instead of a manual re-entry.

---

## 1. Overview

S-09 adds a documented pre-analytical acceptance step to the existing reception workflow without adding a new workflow step, a new screen for daily work, or a new permission scheme. It does three things:

1. **A generic Sample Acceptance Checklist at Step 3.** A configurable, lab-wide list of manually-verified yes/no acceptance items renders per sample at S-03 v2.0 §5.3 (Step 3 — QA/QC + Intake Acceptance). The tech answers each item; answers are persisted as the acceptance record. Transit time (computed from existing timestamps) is shown as read-only context, not as an auto-graded criterion.
2. **A Resample action.** The existing per-sample NCE dialog (S-03 v2.0 §5.3.1) gains a third action alongside the existing "Continue with NCE flag" and "Reject sample": **Resample**, which rejects the original and spawns a linked, pre-populated new draft order plus a requester notification.
3. **Lightweight, domain-keyed configuration.** One new master list (Sample Acceptance Checklist items, each tagged to a domain or "all"), plus a per-domain enforcement setting (Mandatory / Optional / Off for each of Clinical / Environmental / Vector). Configuration is keyed to **domain, not lab unit** — a reception clerk serves multiple lab units in one shift, so a lab-unit setting would be ambiguous at intake; domain is intrinsic to every order and is a fixed 3-value enum, so there are exactly three settings, not a per-lab-unit matrix. Neither surface touches the unified Test Catalog Editor.

**What S-09 deliberately does NOT do** (see §3 Non-Goals and the analysis memo): no auto-evaluation engine, no per-SampleType criteria registry, no Order status-enum formalization, no new permission keys, no per-lab-unit gate configuration, no new daily-work screen. Shipment batch grouping and the Vector CollectionLot variant remain deferred.

### Navigation & URL

S-09 surfaces in three places, all reusing existing shells:

- **Step 3 checklist** — rendered inside the existing reception Step 3 screen (S-03 v2.0). No new route.
  - SideNav: `Order → Add Order` (existing 3-step wizard, Step 3)
  - Breadcrumb: `Home / Order / Add Order / QA-QC + Intake Acceptance`
- **Checklist + enforcement admin** — lives under the existing **Order Entry Configuration** page, navigated by domain via **SideNav submenu items** (not in-page tabs). Both the checklist items and the per-domain enforcement settings are order-intake configuration, so they belong with the other order-entry settings rather than as a standalone master list.
  - SideNav: `Admin → General Configuration → Order Entry Configuration → Sample Acceptance Checklist`, with submenu items `All domains`, `Clinical`, `Environmental`, `Vector`
  - Breadcrumb: `Home / Admin / General Configuration / Order Entry Configuration / Sample Acceptance Checklist / {domain}`
  - Route: extends the existing Order Entry Configuration page route with a section + domain selector, e.g. `…/OrderEntryConfiguration?section=sampleAcceptanceChecklist&domain={all|clinical|environmental|vector}` (deep-linkable per domain). **Confirm the exact Order Entry Configuration route against the live admin before implementation** and reuse it.
- **Intake queue** — a Status filter value on the existing Order Dashboard (no new page).

---

## 2. Scope

**In scope:**
- A **Sample Acceptance Checklist** master list (CRUD): label (i18n), domain (Clinical / Environmental / Vector, or "all"), active flag, display order — so each domain can have its own checklist.
- Per-sample checklist rendering at Step 3, filtered to the order's domain, with manual pass/fail/NA per item + optional note.
- Read-only **transit-time** context at Step 3 (computed from collection date/time and received-at-lab date/time already captured in Steps 1–2).
- Persisted **acceptance record** per sample (which items, answers, notes, operator, timestamp).
- **NCE pre-population**: opening the existing NCE dialog from a sample with failed checklist items auto-fills the NCE reason with those items and notes.
- **Resample** action on the existing NCE dialog → spawns linked pre-populated draft order + requester notification.
- A **per-domain enforcement** setting: Mandatory / Optional / Off for each of Clinical / Environmental / Vector.
- Order Dashboard filter value to surface the daily intake queue.

**Out of scope:**
- Per-sample NCE button + coded-reason picklist + reject decision — already shipped in S-03 v2.0 §5.3.1.
- Auto-evaluation / auto-compute of any criterion.
- Per-SampleType acceptance criteria — explicitly removed (no longer has a home; not needed).
- Order status-enum formalization and transition validation — deferred to a separate initiative.
- Per-lab-unit gate configuration — enforcement is keyed to domain, not lab unit (see §6.3).
- New permission keys.
- Shipment-level batch grouping (P2 follow-up).
- Vector CollectionLot pool variant (V-02 spec).
- Label-completeness checking — handled by the existing OpenELIS label module.

---

## 3. Goals & Non-Goals

### 3.1 Goals
1. Make the intake acceptance decision **explicit, prompted, and recorded** for audit, without adding a workflow step.
2. Keep evaluation **manual** — the tech judges; the system records.
3. Turn "reject and re-collect" into **one action** (Resample) with a preserved data link.
4. Keep configuration **light and decoupled** from the test catalog redesign.

### 3.2 Non-Goals
1. Auto-grading samples from captured data.
2. Per-SampleType rule configuration.
3. Rewriting the Order status model.
4. Introducing new roles or permission keys.
5. A new daily-work screen (the intake queue is a dashboard filter).

---

## 4. User Roles & Permissions

No new roles, no new permission keys. The eligibility gate operates entirely within roles that already work Step 3 and order entry, reusing existing keys (consistent with S-03 v2.0 §4):

| Action | Required permission (existing) |
|---|---|
| Complete the acceptance checklist; accept a sample | `order.qa` |
| Flag / reject a sample via NCE | `order.qa` + `nce.create` |
| Choose Resample (creates the new draft order) | `order.qa` + `nce.create` + `order.enter` |
| Manage the Sample Acceptance Checklist (under Order Entry Configuration) | binary admin (existing Admin access) |
| Set the per-domain enforcement mode (under Order Entry Configuration) | binary admin |

---

## 5. User Stories

- **US-1** — As a **receiving technician**, I want a short checklist of acceptance items to appear for each sample at Step 3 so I verify the same things every time and nothing is forgotten.
- **US-2** — As a **receiving technician**, I want to see the transit time since collection next to the checklist so a long transit catches my eye, without the system overruling my judgement.
- **US-3** — As a **receiving technician**, when a sample isn't acceptable I want the existing NCE dialog to open so I record the problem the same way I always have.
- **US-4** — As a **receiving technician**, I want a **Resample** option on that dialog that rejects the sample, creates a ready-made replacement order, and notifies the requester in one click.
- **US-5** — As a **quality officer / auditor**, I want each sample's acceptance decision (items checked, answers, notes, who, when) stored so I can produce accreditation-grade pre-analytical records.
- **US-6** — As a **lab administrator**, I want to manage the checklist items in a simple master list and choose whether completing the checklist is mandatory, optional, or off for my lab.
- **US-7** — As a **requester / field collector**, I want a notification when my sample is rejected or needs re-collection, with the reason and a link to the new draft order, so I can act without calling the lab.
- **US-8** — As a **lab manager**, I want to filter the Order Dashboard to samples awaiting intake so the daily receiving queue is visible without a separate screen.

---

## 6. Functional Requirements

### 6.1 Sample Acceptance Checklist (master list)

**FR-01.** The system SHALL provide a configurable **Sample Acceptance Checklist**, administered under the existing **Order Entry Configuration** page (see Navigation & URL) — not as a standalone top-level master list. Each item has: `label` (with i18n key), `domain` (optional — CLINICAL / ENVIRONMENTAL / VECTOR; null = applies to all), `active` (boolean), `display_order` (integer).

**FR-02.** The list SHALL ship seeded with a generic default set, all `domain = null`, that any lab can edit or deactivate:

| Default item | Note |
|---|---|
| Container intact and undamaged | |
| Label legible and matches request | Visual only — label *completeness* validation stays in the label module |
| Sample volume / quantity adequate | |
| Cold chain / temperature acceptable | |
| Within acceptable transit time | Tech judges against the displayed transit time |
| Request paperwork / chain-of-custody present | |

**FR-03.** Items are managed with the standard master-list affordances: add, edit, deactivate (soft), reorder. The admin view is **organized by domain as SideNav submenu items** (not in-page tabs — consistent with OpenELIS IA): under `Sample Acceptance Checklist` the SideNav lists `All domains`, `Clinical`, `Environmental`, `Vector`. Selecting a domain shows and edits that domain's own items. The `All domains` list is the **fallback** (see FR-04): when a domain has its own items, the lab-wide items are shown under that domain **visible-disabled** (greyed, editable only from `All domains`) so the override is explicit; when a domain has no items of its own, the `All domains` list is what will apply at Step 3. Display order is maintained per domain. Deactivating an item removes it from future checklists but does not alter acceptance records already captured.

### 6.2 Step 3 Checklist Rendering

**FR-04.** At Step 3 (S-03 v2.0 §5.3), selecting a sample row SHALL open a side panel showing the **single resolved checklist** for the order's domain:
- If the order's domain has ≥1 active item of its own, the **domain list** is shown.
- Otherwise, the **lab-wide ("all domains") list** is shown.

Only the resolved list is shown. Superseded lab-wide items are **NOT** displayed on the QA/QC screen — the operator needs the effective checklist, not the items it replaced. (The override relationship is surfaced in the admin view only, FR-03.) Items render as a manual three-state control — **Pass / Fail / N/A** — defaulting to unanswered, with an optional free-text note, ordered by `display_order`.

**FR-05.** The side panel SHALL display, above the checklist, a **read-only context block**: lab number, sample type, domain, collection date/time, received-at-lab date/time, and **computed transit duration** (`received_at_lab − collection_date_time`). Transit duration is informational; it does not set any checklist answer.

**FR-06.** A per-row summary indicator on the Step 3 sample table SHALL reflect checklist state:
- All answered Pass/NA → green Tag **"Accepted"**
- Any item Fail → yellow Tag **"Review"** (cue to open the NCE dialog)
- Any item unanswered → gray Tag **"Pending"**
- No active items configured → no Tag (gate effectively off for that sample)

**FR-07.** On accept, the system SHALL persist a **SampleAcceptanceRecord**: sample id, ordered snapshot of items shown with each answer + note, operator (from session), and commit timestamp. The record is immutable once written (a re-assessment writes a new record; both are retained).

**FR-07A (NCE pre-population from checklist).** When the tech opens the existing NCE dialog (S-03 v2.0 §5.3.1) from a sample that has one or more checklist items marked **Fail**, the system SHALL pre-populate the NCE reason/description with those failed items and their notes — one line per failed item, e.g. *"Cold chain / temperature acceptable: FAIL — cooler at 14°C"* — so the tech does not re-type what the checklist already captured. The pre-filled text is fully editable. If no items are marked Fail (the tech opened the dialog manually), the reason opens blank as today. The set of failed items at the moment of commit is carried into the NCE record so the rejection reason is reconstructable for audit.

### 6.3 Enforcement Setting (per domain)

**FR-08.** Enforcement SHALL be configured **per domain** — one setting each for Clinical, Environmental, and Vector — not per lab unit. Each domain's setting is one of:
- `Mandatory` — Step 3 cannot be submitted while any sample of that domain has unanswered items or a Fail item with no NCE recorded.
- `Optional` — the checklist renders and is recorded, but Step 3 can be submitted regardless (a single-click acknowledgment is logged when items are skipped).
- `Off` — the checklist side panel and Tags are hidden for that domain; only the existing NCE button (S-03 v2.0 §5.3.1) is available.

The order's domain selects which setting applies at Step 3. Default on upgrade: `Optional` for all three domains (visible and recorded, non-blocking) so existing labs see no hard workflow break. (SILNAS labs typically set Environmental and Vector to `Mandatory`.)

### 6.4 Resample Action

**FR-09.** The existing per-sample NCE dialog (S-03 v2.0 §5.3.1) SHALL gain a third `sample_action` radio option: **Resample**, alongside the existing "Continue with NCE flag" and "Reject sample". It is available to any user with `order.enter` (so they can create the replacement order).

**FR-10 (commit behavior).** On NCE commit with `sample_action = Resample`, the system SHALL, in a single transaction:
1. Record the NCE per the existing flow (the failing checklist items, if any, pre-populate the NCE reason text).
2. Mark the original sample rejected for resampling (terminal for the original physical sample), reusing the existing rejection mechanism — **no new status enum** is introduced; the resample case is distinguished by the presence of the `resampled_to` link.
3. Create a new **draft order** pre-populated from the original: site, compliance standard(s), sample types, tests, customer, requester, default conditions. A fresh lab number is generated. The new order carries `resampled_from = original order id`; the original carries `resampled_to = new order id` (bidirectional link).
4. Queue a requester notification (FR-12).

**FR-11.** The new draft order behaves like any other order — reception completes it when the re-collected sample arrives. The `resampled_from` / `resampled_to` links are preserved for audit and first-attempt-vs-resample analytics. Opening either order shows a banner linking to the other ("Resample of Lab #… — see NCE #…" / "Resample created: Lab #…").

### 6.5 Notification

**FR-12.** On Resample (and on plain Reject where the requester has contact details), the system SHALL queue a notification to the original requester via the **existing Notification Admin** (email and/or TextIt SMS per lab config) containing: original lab number, rejection reason / failing items, and — for Resample — a deep link to the new draft order. Template text uses i18n keys (`notification.eligibility.reject.*`, `notification.eligibility.resample.*`). Send failures follow the existing Notification Admin retry policy; send attempts are audited.

### 6.6 Intake Queue (Dashboard filter)

**FR-13.** The existing Order Dashboard SHALL expose a filter that surfaces samples awaiting intake acceptance (orders at Step 3 not yet accepted), sortable by received-at-lab ascending (oldest first). This reuses the dashboard's existing filtering; **no new screen and no new status enum** — it filters on the order's existing step/state plus the absence of a SampleAcceptanceRecord.

---

## 7. Data Model

```sql
-- Checklist item master list (generic, lab-wide)
CREATE TABLE sample_acceptance_checklist_item (
  id            BIGSERIAL PRIMARY KEY,
  label_key     VARCHAR(120) NOT NULL,        -- i18n key
  label_default VARCHAR(200) NOT NULL,        -- English fallback
  domain        VARCHAR(20),                  -- CLINICAL|ENVIRONMENTAL|VECTOR; null = all
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  fhir_uuid     UUID,
  lastupdated   TIMESTAMP,
  sys_user_id   BIGINT
);

-- Per-sample acceptance record (immutable; multiple allowed per sample)
CREATE TABLE sample_acceptance_record (
  id            BIGSERIAL PRIMARY KEY,
  sample_id     BIGINT NOT NULL REFERENCES sample(id),
  answers       JSONB NOT NULL,   -- [{item_id, label_snapshot, answer:PASS|FAIL|NA, note}]
  operator_id   BIGINT NOT NULL,
  assessed_at   TIMESTAMP NOT NULL DEFAULT now(),
  fhir_uuid     UUID
);
CREATE INDEX idx_sar_sample ON sample_acceptance_record(sample_id);

-- Resample linkage (two nullable FK columns on the existing order table; no status enum)
ALTER TABLE orders ADD COLUMN resampled_from_order_id BIGINT REFERENCES orders(id);
ALTER TABLE orders ADD COLUMN resampled_to_order_id   BIGINT REFERENCES orders(id);
CREATE INDEX idx_orders_resampled_from ON orders(resampled_from_order_id);

-- Enforcement: one value per domain, stored in the existing application
-- configuration table (no new table). Domain is the key axis, NOT lab unit.
--   key = 'sampleAcceptanceChecklist.enforcement.clinical'      value in {MANDATORY, OPTIONAL, OFF}
--   key = 'sampleAcceptanceChecklist.enforcement.environmental' value in {MANDATORY, OPTIONAL, OFF}
--   key = 'sampleAcceptanceChecklist.enforcement.vector'        value in {MANDATORY, OPTIONAL, OFF}
-- (default OPTIONAL for all three on upgrade)
```

Notes: transit duration is computed at read time from existing `collection_date_time` and `received_at_lab` — **no new stored column**. The acceptance record snapshots item labels so historical records survive checklist edits.

## 8. API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/rest/sample-acceptance-checklist?domain={d}&activeOnly=true` | Items for Step 3 rendering / admin list |
| POST / PUT / DELETE | `/rest/sample-acceptance-checklist[/{id}]` | Master-list CRUD (admin) |
| GET | `/rest/samples/{id}/acceptance-record` | Latest acceptance record for a sample |
| POST | `/rest/samples/{id}/acceptance-record` | Persist a completed checklist (accept) |
| POST | `/rest/samples/{id}/resample` | Commit Resample (NCE + reject + new draft order + notification), transactional |

(Existing NCE and order-dashboard endpoints are reused; the Resample endpoint orchestrates existing services.)

## 9. Business Rules

- **Checklist precedence (override with fallback):** a domain's own list takes precedence over the lab-wide ("all domains") list. If a domain has ≥1 active item, that domain list is the resolved checklist; if it has none, the lab-wide list applies. The two lists are never merged. On the Step 3 operator screen only the resolved list is shown; the superseded lab-wide items appear (visible-disabled) **only in the admin view**, for the admin's transparency.
- A sample whose resolved checklist has **no active items** shows no Tag and never blocks submission (gate effectively off for that domain).
- **Transit duration is advisory only** — it is never auto-translated into a Pass/Fail.
- Resample requires `order.enter`; if the user lacks it, the Resample radio is hidden (Reject and Continue remain).
- The Resample transaction is **all-or-nothing**: if the new order or the queued notification fails, NCE, rejection, and order creation roll back and the original sample is unchanged.
- Acceptance records are **append-only**; a corrected assessment writes a new record rather than editing the prior one.

## 10. Localization

| Key | Default |
|---|---|
| `nav.admin.sampleAcceptanceChecklist` | Sample Acceptance Checklist |
| `breadcrumb.admin.sampleAcceptanceChecklist` | Sample Acceptance Checklist |
| `label.eligibility.checklist.title` | Acceptance checklist |
| `label.eligibility.context.transit` | Transit time |
| `label.eligibility.answer.pass` | Pass |
| `label.eligibility.answer.fail` | Fail |
| `label.eligibility.answer.na` | N/A |
| `label.eligibility.note.placeholder` | Optional — note any observed condition |
| `tag.eligibility.accepted` | Accepted |
| `tag.eligibility.review` | Review |
| `tag.eligibility.pending` | Pending |
| `label.nce.sampleAction.resample` | Resample |
| `help.nce.sampleAction.resample` | Reject this sample and create a new collection order for re-collection. The requester will be notified. |
| `label.eligibility.enforcement` | Checklist enforcement |
| `option.eligibility.enforcement.mandatory` | Mandatory |
| `option.eligibility.enforcement.optional` | Optional |
| `option.eligibility.enforcement.off` | Off |
| `checklist.default.containerIntact` | Container intact and undamaged |
| `checklist.default.labelLegible` | Label legible and matches request |
| `checklist.default.volumeAdequate` | Sample volume / quantity adequate |
| `checklist.default.coldChain` | Cold chain / temperature acceptable |
| `checklist.default.transit` | Within acceptable transit time |
| `checklist.default.paperwork` | Request paperwork / chain-of-custody present |
| `notification.eligibility.reject.subject` | Sample rejected: Lab #{labNumber} |
| `notification.eligibility.resample.subject` | Resampling required: Lab #{labNumber} |
| `banner.resample.fromOriginal` | Resample of Lab #{labNumber} — see NCE #{nceNumber} |
| `banner.resample.toNew` | Resample created: Lab #{labNumber} |

## 11. Permissions & Audit

**Role attachment:** none new — `order.qa`, `nce.create`, `order.enter` (existing). Master-list management and the enforcement setting use existing binary admin access.

All events below are written to OpenELIS's **existing system-wide `audit_trail`** (the single global audit log) — not a parallel or feature-specific audit table. Configuration changes (checklist items and enforcement) appear in the same system-wide history as every other admin change.

**Audit events** (system-wide `audit_trail`):
- `SAMPLE_ACCEPTANCE_RECORDED` — target sample id; payload: item count, fail count, enforcement mode; actor from session.
- `SAMPLE_RESAMPLE_COMMITTED` — target original order/sample id; payload: new order id, NCE id; actor from session.
- `ACCEPTANCE_CHECKLIST_ITEM_CHANGED` — target item id; payload: create/update/deactivate + changed fields.
- `ELIGIBILITY_ENFORCEMENT_CHANGED` — payload: domain, old → new mode.
- Notification send attempts (success/failure) audited via existing Notification Admin.
Reads are not audited.

**Envers (`@Audited`):** `sample_acceptance_checklist_item` (configuration — yes). `sample_acceptance_record` is itself the immutable history, so it is **not** Envers-tracked (no row mutation to version). The two new `orders` FK columns inherit the existing `orders` Envers coverage.

## 12. Acceptance Criteria

- [ ] Sample Acceptance Checklist master list exists with CRUD, i18n labels, domain tag, active, reorder; seeded with the 6 default items.
- [ ] Admin view is organized by domain via **SideNav submenu items** (All domains / Clinical / Environmental / Vector) — not in-page tabs.
- [ ] Precedence: a domain with its own items uses that list (lab-wide items shown visible-disabled); a domain with no items falls back to the lab-wide list; lists are never merged.
- [ ] Config and enforcement changes are written to the existing system-wide `audit_trail` (no parallel table).
- [ ] Step 3 sample rows show Accepted / Review / Pending / no-tag indicator.
- [ ] Side panel renders ONLY the resolved checklist (domain list, or lab-wide fallback) as manual Pass/Fail/NA with optional note — superseded lab-wide items are not shown on the QA/QC screen.
- [ ] Side panel shows read-only context incl. computed transit duration; transit never auto-sets an answer.
- [ ] Completing the checklist persists an immutable SampleAcceptanceRecord with operator + timestamp.
- [ ] Opening the NCE dialog from a sample with failed items pre-populates the reason with those items + notes; editable; blank when opened manually.
- [ ] Enforcement is configured **per domain** (Clinical / Environmental / Vector), each Mandatory / Optional / Off; default Optional on upgrade; the order's domain selects which applies.
- [ ] NCE dialog gains a **Resample** `sample_action`, hidden when the user lacks `order.enter`.
- [ ] Resample commit (transactional): records NCE, rejects original, creates pre-populated draft order with bidirectional `resampled_from`/`resampled_to`, queues notification.
- [ ] Both linked orders show a cross-reference banner.
- [ ] Requester notification fires via existing Notification Admin on Resample/Reject.
- [ ] Order Dashboard exposes an "awaiting intake" filter; no new screen, no new status enum.
- [ ] No new permission keys introduced.
- [ ] Configuration does not touch the unified Test Catalog Editor.

## 13. Dependencies

- **S-03 v2.0** (OGC-537) — Step 3 QA/QC + Intake Acceptance and the per-sample NCE button must be in place. (The Resample action extends that dialog.)
- **Notification Admin** (email + TextIt SMS) — existing; reused for FR-12.
- **Order Dashboard** — existing; reused for FR-13.
- No dependency on the Test Catalog redesign (OGC-746/949) — intentionally decoupled.

## 14. Appendix — Cross-reference to superseded versions

- **v2.0** (`upload/processed/S09-eligibility-gate-resampling-frs-v2.0.md`) — auto-evaluating per-SampleType criteria registry on a SampleType admin tab; status-enum formalization; per-domain gate matrix. Superseded: the admin tab surface was removed by OGC-746, and the auto-evaluation modelled data the system doesn't capture.
- **v1.0** (`designs/sample-collection/pre-analytical-eligibility-gate.md`) — 4-step-model design with Eligibility Worklist sidebar and `eligibility.*` permission keys. Superseded by v2.0, further simplified here.
