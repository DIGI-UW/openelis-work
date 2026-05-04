# Electronic Signature Log
## FRS Outline — Sprint 3 (QA Menu Roadmap)

**Document Version:** 0.1 (outline)
**Date:** 2026-04-23
**Author:** Casey Iiams-Hauser
**Status:** Outline only — full FRS authored in Sprint 3
**Sidenav placement:** `Quality Assurance → QMS & Improvement → Electronic Signature Log`

---

## 1. Purpose

A filterable, exportable log of every electronic signature event in the system. Required by 21 CFR Part 11 (where it applies), CLIA-equivalent record-keeping requirements, and ISO 15189:2022 §8.4 / §8.5 (control of records and risk).

Inspectors and auditors arrive expecting to be able to demonstrate, for any signed record, *who signed it, when, why, and on what artifact*. Today this lives in scattered audit-trail entries; this log centralizes it.

## 2. Scope

In scope:
- Read-only filterable list of e-signature events.
- Filter by: signer, date range, artifact type, action / reason, optionally artifact ID.
- Export to CSV (filtered set) and PDF (current view as report).
- Drill-through to the signed artifact (where the artifact is a navigable record).
- Cross-link to the parent record's full audit trail.

Out of scope:
- Authoring or modifying signatures (those happen in the originating workflow, not here).
- Cryptographic signature verification UI (out of scope for v1; trust model lives in the signing service).
- Bulk re-signing or bulk repudiation (intentional — anything that can edit a signed record is out of scope for a log view).
- Standalone signed documents not tied to a system artifact (handled by Document Control module, deferred to v2 per qa-menu-roadmap §11).

## 3. What counts as an "electronic signature" in OpenELIS

OpenELIS already has a unified **`electronic_signature`** table (entity at `org.openelisglobal.esig.valueholder.ElectronicSignature`, migration `liquibase/3.5.x.x/004-electronic-signature.xml`). It uses a `record_type` + `record_id` discriminator to attach signatures to any artifact, plus a `signature_meaning` enum (AUTHORED / VALIDATED_AND_RELEASED / REJECTED / etc.) for the action. The table already captures `signer_id`, `signed_at`, `client_ip`, `user_agent`, and `rejection_reason`.

The Electronic Signature Log is a read view over this single table, filtered by `record_type` and grouped by artifact category. The four "audit tables" the earlier draft assumed (`result_history`, `nce_audit_log`, `sample_audit_log`, `qc_audit_log`) **do not exist** — the audit confirmed everything is unified through `electronic_signature`. No UNION ALL across heterogeneous tables required.

For v1, the log surfaces signatures with these `record_type` values:

| Artifact type | record_type | Action(s) via signature_meaning | Coverage status |
|---|---|---|---|
| Result | `RESULT` | AUTHORED / VALIDATED_AND_RELEASED / REJECTED / AMENDED | Already written by result workflow |
| NCE event | `NCE_EVENT` | ACKNOWLEDGED / CLOSED_VERIFIED / CLOSED_RECURRENCE | Sprint 2 NCE build must write these |
| CAPA | `CAPA` | COMPLETED / EFFECTIVENESS_REVIEWED | Sprint 2 NCE build must write these |
| Sample | `SAMPLE` | REJECTED / OVERRIDE_ACCEPTED | Sample rejection workflow may need a small write-side update |
| QC run | `QC_RUN` | SIGNED_OFF | QC sign-off workflow may need a small write-side update |

The log is a pure read; if a write-side workflow doesn't currently produce an `electronic_signature` row, that's a **separate Sprint 2 / Sprint 3 fix** in the originating module (not the log's concern), but worth flagging as a dependency.

### 3.1 What is *not* counted

- Routine logins (those are session events, not signatures).
- View-only access (audit-trail's job).
- Configuration changes by admins (those go to the Audit Trail page).

A signature, for log purposes, is a deliberate action attesting to or finalizing a clinical or quality artifact. Login and config audit events are intentionally excluded so the log stays signal-dense.

### 3.2 Optional Liquibase migration (small)

For result-state-change tracking on the log, two optional columns may be added to `electronic_signature`:

- `prior_state VARCHAR(50)` — null for non-state-tracking records
- `new_state VARCHAR(50)` — null for non-state-tracking records

Backward-compatible. Lets the row expansion show "Status: Acknowledged → Under Investigation" without a separate state-history table. **Recommendation:** include this migration in Sprint 3 alongside the log build; it's small and the row expansion meaningfully benefits.

### 3.1 What is *not* counted

- Routine logins (those are session events, not signatures).
- View-only access (audit-trail's job).
- Configuration changes by admins (those go to the Audit Trail page).

A signature, for log purposes, is a deliberate action attesting to or finalizing a clinical or quality artifact. Login and config audit events are intentionally excluded so the log stays signal-dense.

## 4. Page layout

```
Quality Assurance › QMS & Improvement › Electronic Signature Log

  Filters:  [Signer ▾]  [Date range]  [Artifact type ▾]  [Action ▾]
            [Artifact ID]   Clear all

  ┌─────────────────────────────────────────────────────────────────┐
  │ When                Signer        Action       Artifact         │
  ├─────────────────────────────────────────────────────────────────┤
  │ 2026-04-23 10:14    A. Johnson    Validated    Result R-44218   │
  │   Reason: routine validation                       [Open ↗]      │
  ├─────────────────────────────────────────────────────────────────┤
  │ 2026-04-23 09:52    M. Garcia     Acknowledged  NCE-20260423-007 │
  │   Reason: critical hemolysis                       [Open ↗]      │
  ├─────────────────────────────────────────────────────────────────┤
  │ 2026-04-23 09:41    J. Smith      Amended       Result R-44209   │
  │   Reason: corrected calculation error              [Open ↗]      │
  └─────────────────────────────────────────────────────────────────┘

  Showing 1–25 of 312 · Page size [25 ▾]   < Prev   1 2 3 …   Next >
                                                  ⬇ Export CSV   ⬇ Export PDF
```

### 4.1 Row content

Each log row shows:

| Element | Description |
|---|---|
| When | Timestamp with timezone. Hover for absolute UTC. |
| Signer | User name + role (if available). Click → user profile page (existing). |
| Action | Validated / Released / Amended / Acknowledged / Closed / Completed CAPA / Reviewed (effectiveness) / Rejected sample / Signed off QC. |
| Artifact | Type + identifier (e.g., "Result R-44218" or "NCE-20260423-007"). Click via "Open ↗" navigates to the artifact. |
| Reason | Free-text reason captured at sign time, when applicable. |

### 4.2 Row expansion

Clicking the row body expands inline (per OpenELIS convention; no modals). The expanded panel shows:

- Full reason text.
- Prior state → new state (e.g., "Status: Acknowledged → Under Investigation"; "Result value: 4.2 → 4.5 mg/dL").
- IP address and user-agent if captured by the underlying audit log.
- "View full audit trail for this artifact ↗" link.

The expanded panel is read-only.

## 5. Filters

| Filter | Type | Notes |
|---|---|---|
| Signer | Multi-select user picker | All users who have ever signed in the system |
| Date range | Date picker | Filters by `signed_at` |
| Artifact type | Multi-select dropdown | Result / NCE / CAPA / Sample / QC Run |
| Action | Multi-select dropdown | Per §3 — Validated / Released / Amended / Acknowledged / Closed / etc. |
| Artifact ID | Text input | Exact-match or prefix match on the artifact ID (e.g., "R-44" matches all results starting with R-44) |
| Search (reason) | Text input | Free-text search on the captured reason text |
| Clear all | Link button | Resets all filters |

URL query params reflect active filters for shareability — important for inspectors who may want a permalink to a specific filtered view.

## 6. Export

### 6.1 CSV

One row per log entry. Columns: timestamp (ISO 8601 UTC), signer name, signer role, signer email, action, artifact type, artifact ID, reason, prior state, new state, IP address, user agent. Exports the full filtered set, not just the current page.

### 6.2 PDF

Header: lab name, current filter set, generated-at timestamp, generated-by user.
Body: same columns as CSV, formatted as a printable table.
Footer: page number, "Generated from OpenELIS Electronic Signature Log."

PDF export is a single canonical record that an inspector can take away. Pagination handled at the print-template level.

Both exports require `audit.export` permission. Without it, the export buttons are hidden.

## 7. Data sources

| Source | Field(s) | Purpose |
|---|---|---|
| `electronic_signature` | `id`, `signer_id`, `signed_at`, `client_ip`, `user_agent`, `signature_meaning`, `rejection_reason`, `record_type`, `record_id`, (optional) `prior_state`, `new_state` | Single unified signature event source. All artifact types route here via `record_type`. |
| `users` (joined via `signer_id`) | `name`, `email`, `role` | Signer display |
| `result` / `nce_event` / `capa` / `sample` / `qc_run` (joined via `record_type` + `record_id`) | Identifier strings, parent metadata | Artifact display per row |

The page reads from a new endpoint: `GET /rest/qms/esig-log?signer=...&from=...&to=...&recordType=...&...` — a single query against `electronic_signature` filtered and sorted by `signed_at DESC`. Implementation in a new `ElectronicSignatureLogService` that queries the existing entity.

Wrapper / endpoint effort: **~2–3h** (down from the original 6–8h estimate). The unified table eliminates the UNION ALL pattern; remaining work is filter handling, joining to artifact tables for display, and CSV/PDF export.

### 7.1 Sprint-3 ordering recommendation (from code audit)

1. **Build union service first**, ship the read view. Validates the data model in production.
2. **Then add `prior_state` + `new_state` columns** via Liquibase migration (non-breaking, backward-compatible).
3. **Then update the originating workflows** to write `electronic_signature` rows for any artifact type not currently writing them (NCE acknowledgment, CAPA completion, effectiveness review, sample rejection if not present, QC sign-off if not present). Sprint 2 NCE build picks up the NCE/CAPA writes.

## 8. Permissions

| Permission | Behavior |
|---|---|
| `qa.view.qms` | Required to see the QMS pillar in the sidenav. |
| `esig.view` | Required to see this page. |
| `esig.export` | Required to use CSV / PDF export. Without it, export buttons are hidden. |

Per qa-menu roadmap permissions table, QA Officer default role bundles `esig.view` (not `esig.export`). Lab Director recipe adds `esig.export`. Inspector/Auditor recipe also has `esig.view` and `esig.export`.

## 9. Acceptance criteria (outline)

- [ ] Page renders at `/qa/qms/esig-log` with the filterable log table.
- [ ] All nine v1 artifact types and their signature events appear in the log.
- [ ] Login events and view-only access do **not** appear.
- [ ] Config-change events do **not** appear (those are on Audit Trail).
- [ ] Filters work independently and in combination; URL params reflect active filters.
- [ ] Row expansion shows full reason, prior/new state, IP, user agent (when captured), and a link to the artifact's full audit trail.
- [ ] CSV export contains all currently-filtered rows with the documented columns.
- [ ] PDF export renders with header (lab + filter set + generated-by) and consistent pagination.
- [ ] Export buttons hidden for users without `esig.export`.
- [ ] User without `esig.view` cannot reach the page (404 / redirect).
- [ ] All visible strings localized; no hard-coded English.

## 10. Localization tags (preliminary)

| Element | Tag |
|---|---|
| Page title | `label.esig.log.title` |
| Filter labels | `label.esig.filter.*` |
| Action names | `label.esig.action.*` (validated / released / amended / acknowledged / closed / capaCompleted / effectivenessReviewed / sampleRejected / qcSignedOff) |
| Column headers | `label.esig.column.*` |
| Row expansion: prior state / new state | `label.esig.priorState` / `label.esig.newState` |
| Export CSV | `label.esig.export.csv` |
| Export PDF | `label.esig.export.pdf` |

Full list in the Sprint 3 FRS.

## 11. Resolved decisions + remaining open questions

### Resolved 2026-04-23

- **B1 — Schema audit (RESOLVED via DIGI-UW/OpenELIS-Global-2 code audit):** The four assumed audit tables (`result_history`, `nce_audit_log`, `sample_audit_log`, `qc_audit_log`) **do not exist**. Instead, OpenELIS already has a unified `electronic_signature` table (`org.openelisglobal.esig.valueholder.ElectronicSignature`) with `record_type` + `record_id` discriminator. This is a major simplification: single-table read instead of UNION ALL across four heterogeneous tables. Endpoint effort drops from ~6–8h to ~2–3h.
- **B2 — IP / user-agent capture (RESOLVED, same audit):** Both `client_ip` and `user_agent` are already captured by the existing `electronic_signature` table. No migration needed.
- **B3 — Bulk-action signatures (LOCKED):** When a user batch-acknowledges N NCEs in a single click, the log shows **N rows** (one per attested artifact), not 1 row with an N-affected count.

### Resolved 2026-04-23 (continued)

- **B4 — API-driven signatures (LOCKED):** Signer field shows the API client name with `(via API)` suffix; reason captured from the API payload. Inspectable as a non-human signature; documented as machine-driven. Worth flagging for v2 when first partner integration surfaces it; out of v1 MVP scope.
- **B5 — Retention policy (LOCKED):** **Unlimited retention by default in v1.** Configurable retention policy (e.g., GDPR right-to-erasure, regulatory minimums) deferred to v2. Storage is cheap; deleting signed-record evidence is risky.

### Still open

(none — all five resolved.)

---

*Outline only — full FRS authored in Sprint 3.*
