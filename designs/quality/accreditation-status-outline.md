# Accreditation Status
## FRS Outline — Sprint 3 (QA Menu Roadmap)

**Document Version:** 0.2 (outline — restructured to self-attestation model)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline only — full FRS authored in Sprint 3
**Sidenav placement:** `Quality Assurance → QMS & Improvement → Accreditation Status`

---

## What changed in v0.2

The earlier draft modeled this page as a clause-by-clause evidence rollup: the system mapped each ISO 15189 / CAP item to OpenELIS evidence sources, then auto-determined Met / Outstanding / Not Ready status. That model required a default mapping (~50–200+ items per standard) plus stale-evidence windows plus override rules — a significant amount of internal expertise we don't reliably have, and a brittle page on first install.

**v0.2 reframes the page as a lab-attested accreditation registry.** The lab declares which accreditations it holds, the scope each covers, the dates, and (optionally) the certificate document. The system surfaces those declarations and tracks date-driven status (current / expiring soon / expired). The page also has a separate "QA evidence at a glance" section that shows system-tracked quality data without claiming it maps to any specific accreditation clause.

This is easier to manage in an incomplete-information state, easier to ship, and matches how labs actually talk about their accreditation status to inspectors and customers ("we hold ISO 15189 for these scopes" rather than "here is our automated coverage of clause 6.4").

---

## 1. Purpose

A registry of the accreditations the lab claims to hold, plus a thin window into system-tracked QA evidence. Inspectors and customers regularly ask "what accreditations do you have, when do they expire, and what's their scope?" — this page answers that, fast.

The page does **not** auto-verify accreditation status against system data. It trusts the lab's attestation. Inspectors who want to verify will check the underlying evidence in QC, EQA, NCE Register, etc. directly — and the "QA evidence at a glance" section gives them a shortcut to those surfaces.

## 2. Scope

In scope:
- Accreditation registry: CRUD on accreditation records the lab claims.
- Each record captures: body / standard / version, awarded date, expires date, scope (free text + optional structured fields for which test categories or sections are covered), inspection-due date if applicable, certificate-document attachment, internal notes.
- Date-driven status: Current / Expiring soon (within 90 days) / Expired / Inspection overdue.
- Single-site v1 (per DEC03).
- "QA evidence at a glance" section: read-only summary tiles for QC, EQA, internal audit (manual entry), open critical NCEs, open CAPAs. **Not** mapped to any specific accreditation clause — just at-a-glance pointers to existing surfaces.

Out of scope:
- Auto-verification of accreditation against system evidence (the v0.1 design — replaced).
- Default mapping tables for ISO 15189 or CAP clauses (the v0.1 design — replaced).
- Accreditation Binder PDF export (deferred to v2 per DEC09).
- Multi-site rollup (DEC03).
- Internal audit tracker (qa-menu roadmap §11) — v1 surfaces a single "Last internal audit" date with manual entry; full tracker is v2.
- Standalone document control module — out of scope.

## 3. Accreditation record fields

Each accreditation a lab claims is a single record with these fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| Standard | Text | Yes | e.g., "ISO 15189:2022", "CAP Lab General", "ISO 17025", "Country-specific accreditation body". Free text — labs can name standards we haven't anticipated. |
| Body | Text | Yes | The accrediting body (e.g., "DAkkS", "CAP", "UKAS", "Ministry of Health Indonesia"). |
| Awarded date | Date | Yes | Date the current accreditation period began. |
| Expires date | Date | Yes | Date the accreditation expires. Drives the date-status indicator. |
| Scope (text) | Text area | Yes | Free-text description of what the accreditation covers (e.g., "All clinical chemistry and hematology testing"). |
| Scope (test categories) | Multi-select | No | Optional structured list of which test categories are covered (Chemistry / Hematology / Microbiology / Molecular / Anatomic Pathology / All testing). Used for filtering and the QA evidence section. |
| Inspection due date | Date | No | Next on-site inspection date if known. Drives the inspection-status indicator. |
| Certificate document | File upload | No | Optional PDF / image of the certificate. Stored against the existing document attachment system. |
| Internal notes | Text area | No | Free-text notes (e.g., "renewing in Q3, lead time ~6 months"). Inspector-visible if `accreditation.view` includes them; labs can choose to keep notes private — see §6. |

## 4. Page layout

```
Quality Assurance › QMS & Improvement › Accreditation Status

  ┌────────────────────────────────────────────────────────────────┐
  │ Accreditations held by this laboratory       [+ Add accreditation]│
  │                                                                  │
  │ ┌────────────────────────────────────────────────────────────┐ │
  │ │ ISO 15189:2022                              ✓ Current      │ │
  │ │   Body: DAkkS                                                │ │
  │ │   Awarded: 2024-06-15        Expires: 2027-06-14            │ │
  │ │   Scope: Chemistry, Hematology, Microbiology                │ │
  │ │   📎 certificate.pdf                       Edit ↗  Delete ↗ │ │
  │ └────────────────────────────────────────────────────────────┘ │
  │                                                                  │
  │ ┌────────────────────────────────────────────────────────────┐ │
  │ │ CAP Lab General                  ⚠ Inspection overdue      │ │
  │ │   Body: College of American Pathologists                    │ │
  │ │   Awarded: 2025-01-10        Expires: 2027-01-09           │ │
  │ │   Scope: All clinical testing                                │ │
  │ │   Inspection due: 2025-12-15 (overdue 134 days)             │ │
  │ │   📎 cap-cert.pdf                          Edit ↗  Delete ↗ │ │
  │ └────────────────────────────────────────────────────────────┘ │
  │                                                                  │
  │ ┌────────────────────────────────────────────────────────────┐ │
  │ │ Country-specific accreditation       ⚠ Expiring in 47 days │ │
  │ │   …                                                          │ │
  │ └────────────────────────────────────────────────────────────┘ │
  └────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────┐
  │ QA evidence at a glance                                          │
  │                                                                  │
  │ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐│
  │ │ Statistical QC   │ │ EQA              │ │ Internal audit   ││
  │ │  ✓ in control    │ │  ⚠ pending V2    │ │  Last: 2025-Q4   ││
  │ │  47/47 runs (30d)│ │                  │ │  [Record review] ││
  │ │  View ↗          │ │  View ↗          │ │                  ││
  │ └──────────────────┘ └──────────────────┘ └──────────────────┘│
  │ ┌──────────────────┐ ┌──────────────────┐                     │
  │ │ Open critical    │ │ Open CAPAs       │                     │
  │ │ NCEs             │ │                  │                     │
  │ │  5 pending ack   │ │  12 in progress  │                     │
  │ │  View ↗          │ │  View ↗          │                     │
  │ └──────────────────┘ └──────────────────┘                     │
  └────────────────────────────────────────────────────────────────┘
```

### 4.1 Top section — Accreditation registry

A list of accreditation cards, sorted by status (Inspection overdue → Expired → Expiring soon → Current). Each card shows the record fields per §3 plus a single status pill. Edit / Delete actions per card require `accreditation.manage`.

`+ Add accreditation` button is visible only with `accreditation.manage`. Opens an inline form (no modal, per OpenELIS sidenav-submenus convention) with all the fields from §3.

### 4.2 Bottom section — QA evidence at a glance

Five tiles linking to existing QA surfaces:

| Tile | Source | Drill-through |
|---|---|---|
| Statistical QC | QC pillar rollup endpoint (Sprint 1 wrapper) | `/qa/statistical-qc/run-review` |
| EQA | EQA pillar rollup endpoint (Sprint 5 wrapper) | `/qa/eqa/oversight/lab-performance` |
| Internal audit | Manual entry: "Last review: {date}" + "Record review" button | (no target — record entered inline) |
| Open critical NCEs | Existing `/rest/nce/dashboard` filtered client-side | `/qa/qms/nce/all?severity=Critical&status=open,acknowledged` |
| Open CAPAs | Existing CAPA Register endpoint (Sprint 3) | `/qa/qms/capa-register?status=in_progress,pending` |

These tiles are explicitly **not** mapped to any specific accreditation. They're a convenient pointer to the underlying QA data an inspector or QA officer might want to look at after reviewing the registry. The "Internal audit" tile is the only one with a small lab-side entry — it captures a date + reviewer + free-text note via an inline form, and stores in a small new `internal_audit_review_log` table (similar to v0.1's `accreditation_review_log`, narrower scope).

## 5. Status logic

### 5.1 Per-accreditation status

| Status | Definition |
|---|---|
| ✓ Current | `now() < expires_date` AND (no inspection-due date OR `now() < inspection_due_date`) |
| ⚠ Inspection overdue | `now() < expires_date` AND `inspection_due_date < now()` |
| ⚠ Expiring soon | `expires_date - now() < 90 days` |
| ✗ Expired | `now() > expires_date` |

Lab-configurable: the "expiring soon" window (default 90 days) — admin setting under `Admin → QI Configuration` or equivalent.

### 5.2 No overall page status

The page deliberately has no aggregated "lab is accredited / not accredited" rollup. Different accreditations have different scopes; aggregating them hides important detail. The card list itself carries the message.

## 6. Permissions

| Permission | Behavior |
|---|---|
| `qa.view.qms` | Required to see the QMS pillar in the sidenav. |
| `accreditation.view` | Required to see this page. Renders all cards read-only. |
| `accreditation.manage` | Required to add / edit / delete accreditation records, upload certificates, record internal-audit reviews, and edit the "expiring soon" window setting. Without it, those controls are hidden. |

QA Officer default role bundles `accreditation.view`. Lab Director recipe adds `accreditation.manage`. Inspector/Auditor recipe gets `accreditation.view` only (no edits).

### 6.1 Internal-notes visibility

The "Internal notes" field on each accreditation record is **always visible** to anyone with `accreditation.view`. Labs that want to keep some context private should keep it out of OpenELIS. v1 does not have a separate private-notes mechanism. (If labs ask, v2 adds a "lab-only notes" toggle on each note.)

## 7. Data sources

### 7.1 New table

A single new table is added in Sprint 3 (small Liquibase migration):

```
accreditation_record
  id                       bigint primary key
  org_id                   bigint not null  -- single-site v1, but field carried
                                            -- forward for v2 multi-site
  standard                 varchar(255) not null
  body                     varchar(255) not null
  awarded_date             date not null
  expires_date             date not null
  scope_text               text not null
  scope_categories         text  -- JSON array of test category enum values
  inspection_due_date      date
  certificate_document_id  bigint  -- foreign key to existing document store
  internal_notes           text
  created_at, created_by, updated_at, updated_by   -- standard audit columns
```

Plus a small `internal_audit_review_log` table for the bottom-section internal-audit tile:

```
internal_audit_review_log
  id, org_id, reviewed_at, reviewed_by, notes
```

### 7.2 Endpoint

`GET /rest/qms/accreditation/records` — list accreditation records for the lab.
`POST /rest/qms/accreditation/records` — create one (requires `accreditation.manage`).
`PUT /rest/qms/accreditation/records/{id}` — update (requires `accreditation.manage`).
`DELETE /rest/qms/accreditation/records/{id}` — delete (requires `accreditation.manage`; soft-delete recommended for audit-trail purposes).
`POST /rest/qms/accreditation/records/{id}/certificate` — upload certificate file.

The QA-evidence-at-a-glance section reuses the existing pillar rollup endpoints (the same ones the QA Overview reads), no new wrappers required.

Wrapper / endpoint effort: **~6–8h** (down from v0.1's ~12–16h). New table CRUD + small migration + the certificate upload integration with the existing document store.

## 8. Acceptance criteria (outline)

- [ ] Page renders at `/qa/qms/accreditation` with accreditation registry on top and QA-evidence section below.
- [ ] Cards sort by status (Inspection overdue → Expired → Expiring soon → Current).
- [ ] Each card shows the documented fields per §3 with a single status pill.
- [ ] `+ Add accreditation` button visible only with `accreditation.manage`; inline form supports all required + optional fields.
- [ ] Edit / Delete per card visible only with `accreditation.manage`; soft-delete preserves audit history.
- [ ] Certificate upload accepts PDF/PNG/JPEG; max file size matches the existing document store policy.
- [ ] Date-driven status reflects `expires_date` + `inspection_due_date`; "expiring soon" window is configurable (default 90 days).
- [ ] QA-evidence tiles render with the documented sources; deep-links navigate correctly; internal-audit tile supports inline review entry.
- [ ] User without `accreditation.view` cannot reach the page.
- [ ] User without `accreditation.manage` sees the page in read-only mode.
- [ ] All visible strings localized; no hard-coded English.

## 9. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.accreditation.status.title` |
| Top section header | `label.accreditation.registry.header` |
| Add button | `label.accreditation.add` |
| Field labels | `label.accreditation.field.*` (standard / body / awarded / expires / scope / inspectionDue / certificate / internalNotes) |
| Status pills | `label.accreditation.status.current` / `expiringSoon` / `expired` / `inspectionOverdue` |
| Bottom section header | `label.accreditation.evidence.header` |
| Evidence tile labels | `label.accreditation.evidence.*` (qc / eqa / internalAudit / openCriticalNces / openCapas) |
| Internal-audit "Record review" action | `label.accreditation.internalAudit.recordReview` |

Full list in the Sprint 3 FRS.

## 10. Resolved decisions (2026-04-23)

| ID | Question | Decision |
|---|---|---|
| C1 | ISO 15189 mapping authorship | **Resolved by redirection.** No clause-by-clause mapping in v1. Labs self-attest accreditation records; the system trusts the attestation. |
| C2 | CAP starter-subset sizing | **Resolved by redirection.** No CAP checklist mapping in v1; same reason. |
| C3 | Stale evidence windows | **Resolved by redirection.** No per-evidence-type stale logic; only date-driven status on the accreditation record itself. |
| C4 | `accreditation.manage` override of Outstanding | **Resolved by redirection.** No Outstanding state to override; the page is attestation-driven. |
| C5 | Items with no v1 mapping | **Resolved by redirection.** No mapping table; nothing to be missing. |
| C6 | Internal audit tracking | **Resolved.** v1 surfaces a single "Last internal audit" tile in the QA-evidence section with inline review-date entry by `accreditation.manage` users. Full audit tracker is v2. |

## 11. Open questions

(none — the redirection from clause-by-clause evidence model to lab-attested registry collapsed the entire C-question set.)

---

*Outline only — full FRS authored in Sprint 3.*
