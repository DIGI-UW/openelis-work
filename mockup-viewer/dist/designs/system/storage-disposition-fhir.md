# S-05b — Final Storage Disposition FHIR Publishing
## Addendum to S-05: Compliance Evaluation Engine (OGC-547)
### Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-20
**Status:** Draft for Review
**Jira:** [OGC-592](https://uwdigi.atlassian.net/browse/OGC-592)
**Addendum to:** [S-05 FRS — Compliance Evaluation Engine](./S05-compliance-evaluation-engine-frs-v1.0.md) / [OGC-547](https://uwdigi.atlassian.net/browse/OGC-547)
**Parent epic:** [OGC-527 — Environmental & Vector Testing Module](https://uwdigi.atlassian.net/browse/OGC-527)
**Source requirement:** Bogor requirements spreadsheet — Must Have, Phase 1: "Record final sample fate at result entry. Report disposition to consolidated FHIR server for dashboards."
**Related spec:** [V-04 FRS — Vector Surveillance Reporting](./V04-vector-surveillance-reporting-frs-v1.0.md) / [OGC-585](https://uwdigi.atlassian.net/browse/OGC-585) — same HAPI FHIR server and OHS ETL pipeline

---

## 1. Overview

OpenELIS already supports final sample disposition through the existing **Storage module** — samples can be assigned to Temporary storage, transferred to the Biorepository, or marked as Disposed. The disposition UI and data model exist; however, no FHIR event is currently fired when a sample's final disposition is recorded.

S-05b adds a **FHIR Specimen resource update** triggered when the final disposition of an ENV or Vector sample is set in the storage module. The update is pushed to the same consolidated HAPI FHIR R4 server used by V-04 (OHS / SILNAS Indonesia), extending the `Specimen` resource already present there with a disposition status and structured extension.

The FHIR payload is designed to be rich enough to support future dashboard queries (e.g., "how many ENV samples were disposed this quarter vs. biorepositored?") without requiring a data migration when those dashboards are built.

### 1.1 What this addendum adds

| Area | New capability |
|------|----------------|
| FHIR push trigger | `SPECIMEN_DISPOSITION_FINAL` event fires when final disposition is recorded for an ENV/Vector sample |
| `Specimen.status` update | Updated to `unavailable` (disposed/temporary) or `available` (biorepository — still retrievable) |
| `Specimen` extension | `specimen-final-disposition` custom extension (disposition type, date, location, actor) using the existing `https://openelis-global.org/fhir/` namespace |
| Async dispatch | Same async queue as V-04 FHIR push (3× retry, delivery logging) |
| Applies to | ENV and Vector orders (gated by `sampleDomain` — OGC-296); clinical orders excluded |

### 1.2 What this addendum does NOT change

- The storage/biorepository disposition UI — unchanged; S-05b hooks into the existing save event
- The FHIR push pipeline architecture (V-04 ETL, OHS SQL-on-FHIR views) — unchanged
- Dashboard widgets — no new dashboard panels in v1.0; the FHIR data is published for future consumption
- Clinical sample disposition — S-05b applies to ENV and Vector orders only

### 1.3 Design principle: follow existing FHIR mapping

S-05b follows the same `Specimen` resource structure and extension namespace established in V-04. All new extension URLs use the `https://openelis-global.org/fhir/StructureDefinition/` prefix. If the V-04 FHIR architectural review (OGC-586) changes extension URL conventions before S-05b is implemented, S-05b extension definitions MUST be updated to match.

---

## 2. User Stories

- **US-01** — As a lab manager, I want final sample dispositions for ENV and Vector samples to be reflected on the consolidated FHIR server so that future compliance dashboards can report on sample fate without manual data extraction.
- **US-02** — As a data analyst, I want to query the HAPI FHIR server and retrieve disposition type, date, and storage location for any ENV sample so that I can produce audit-ready reports of sample lifecycle.
- **US-03** — As a system architect, I want disposition data structured using proper FHIR extensions (not free-text notes) so that OHS ETL queries can extract the values reliably without string parsing.

---

## 3. Functional Requirements

### 3.1 Trigger Event

**FR-01** — The system MUST fire a `SPECIMEN_DISPOSITION_FINAL` event when a final disposition is recorded or updated for an ENV or Vector sample in the existing storage module. Specifically, the event fires when:

| Action | Trigger |
|--------|---------|
| Sample marked as **Disposed** | On save of Disposed status |
| Sample transferred to **Biorepository** | On confirmation of biorepository transfer |
| Sample set to **Temporary** storage | On confirmation (treated as interim, not final; see FR-02) |

**FR-02** — `Temporary` storage is treated as **non-final** disposition in this spec. The FHIR push fires only when the status transitions to `Disposed` or `Biorepository`. A sample that remains in Temporary storage indefinitely does NOT generate a FHIR push from S-05b. (Note: if a future sprint defines "Temporary" as final for specific workflows, an addendum can extend this trigger.)

**FR-03** — If a sample's disposition is **updated** after an initial push (e.g., from Biorepository to Disposed after a recall decision), the system MUST push a second update to FHIR with the new disposition values. The `Specimen.status` and the disposition extension are overwritten — no new Specimen resource is created.

**FR-04** — The event MUST be processed through the same async dispatch queue used by V-04 (OGC-585 §3 FHIR push queue) with the same 3× retry and delivery logging behaviour.

**FR-05** — `SPECIMEN_DISPOSITION_FINAL` is scoped to ENV and Vector orders only. The event MUST NOT fire for clinical orders. Order type is determined by `sampleDomain` (OGC-296).

### 3.2 FHIR Specimen Resource Update

**FR-06** — When `SPECIMEN_DISPOSITION_FINAL` fires, the system MUST update the existing `Specimen` resource on the HAPI FHIR server (identified by the existing `Specimen.identifier` mapping established in V-04). If no `Specimen` resource exists for the sample (e.g., the V-04 push was never triggered), the system MUST create one using the standard V-04 Specimen mapping, then apply the disposition extension.

**FR-07** — `Specimen.status` MUST be set as follows:

| Disposition | `Specimen.status` |
|-------------|------------------|
| Disposed / Destroyed | `unavailable` |
| Biorepository | `available` |

This follows standard FHIR R4 Specimen status semantics: `unavailable` = specimen no longer accessible; `available` = specimen accessible (even if in long-term storage).

**FR-08** — The `Specimen` resource MUST include a `specimen-final-disposition` extension containing:

```json
{
  "url": "https://openelis-global.org/fhir/StructureDefinition/specimen-final-disposition",
  "extension": [
    {
      "url": "dispositionType",
      "valueCode": "disposed | biorepository"
    },
    {
      "url": "dispositionDate",
      "valueDate": "YYYY-MM-DD"
    },
    {
      "url": "storageLocation",
      "valueString": "<biorepository location code or name, blank if disposed>"
    },
    {
      "url": "disposedBy",
      "valueReference": { "reference": "Practitioner/<user-id>" }
    },
    {
      "url": "dispositionNotes",
      "valueString": "<free text, max 500 chars, blank if not set>"
    }
  ]
}
```

**FR-09** — The `dispositionType` valueCode MUST use a CodeSystem defined at `https://openelis-global.org/fhir/CodeSystem/specimen-disposition-type` with codes:

| Code | Display |
|------|---------|
| `disposed` | Disposed / Destroyed |
| `biorepository` | Transferred to Biorepository |

**FR-10** — The `dispositionDate` MUST be the date the disposition was recorded in OpenELIS (not the collection date or result date).

**FR-11** — The `storageLocation` MUST be the biorepository location code from the existing OpenELIS storage module if the disposition is `biorepository`. It MUST be omitted (or set to blank) when `dispositionType` is `disposed`.

**FR-12** — The `disposedBy` reference MUST point to the `Practitioner` resource for the OpenELIS user who recorded the disposition. If no `Practitioner` resource exists for that user on the HAPI server, the system MAY push the user's display name as `valueString` instead (graceful fallback).

### 3.3 Delivery Logging

**FR-13** — All `SPECIMEN_DISPOSITION_FINAL` FHIR push attempts MUST be logged in the same FHIR delivery log as V-04 pushes, with `event_type = 'SPECIMEN_DISPOSITION_FINAL'`, sample ID, FHIR Specimen resource ID, push status (SUCCESS / FAILED), and timestamp.

**FR-14** — Failed pushes MUST be retried 3× with exponential backoff (same policy as V-04). After 3 failures, the attempt is marked FAILED and a system alert is raised (existing FHIR failure alert mechanism).

---

## 4. Data Model

No new tables. The existing OpenELIS storage/disposition tables are unchanged. One new column on the FHIR push log table (if it doesn't already support arbitrary event types):

```sql
-- If the existing fhir_push_log table uses a fixed event_type column:
ALTER TABLE fhir_push_log
  MODIFY COLUMN event_type VARCHAR(50); -- ensure it's wide enough for new event type
```

The FHIR StructureDefinition for `specimen-final-disposition` is a JSON document published to the HAPI FHIR server's StructureDefinition endpoint at first deployment:

```
POST /fhir/StructureDefinition
Content-Type: application/fhir+json
{ ...StructureDefinition for specimen-final-disposition... }
```

---

## 5. API Changes

No new OpenELIS REST endpoints. The existing FHIR push infrastructure (V-04) handles the outbound push. The only code-level change is wiring the `SPECIMEN_DISPOSITION_FINAL` event to the existing FHIR dispatch service.

**HAPI FHIR server — new StructureDefinition:** The `specimen-final-disposition` StructureDefinition must be loaded once during deployment. This is a one-time setup step in the deployment runbook, not an ongoing API change.

**HAPI FHIR server — Specimen resource:** Updated via `PUT /fhir/Specimen/<id>` using the existing V-04 push mechanism (not a new endpoint).

---

## 6. FHIR StructureDefinition Summary

The `specimen-final-disposition` extension is a **complex extension** (nested sub-extensions). Extension URL hierarchy:

```
https://openelis-global.org/fhir/StructureDefinition/specimen-final-disposition
  ├── dispositionType         (code — required)
  ├── dispositionDate         (date — required)
  ├── storageLocation         (string — optional)
  ├── disposedBy              (Reference(Practitioner) — optional, string fallback)
  └── dispositionNotes        (string — optional, max 500 chars)
```

**Profile:** Extends `Specimen` (R4). The extension is bound to the `specimen-disposition-type` CodeSystem defined above.

---

## 7. OHS ETL — Future Dashboard Query Pattern

No OHS ETL changes are required in v1.0. The following SQL-on-FHIR pattern is provided as forward guidance for when dashboard views are built:

```sql
-- Future OHS ETL view (not implemented in S-05b v1.0):
CREATE OR REPLACE VIEW env_specimen_disposition AS
SELECT
  s.id                                         AS specimen_id,
  s.subject_reference                          AS order_reference,
  s.status                                     AS fhir_status,
  ext_disp.disposition_type                    AS disposition_type,
  ext_disp.disposition_date                    AS disposition_date,
  ext_disp.storage_location                    AS storage_location,
  ext_disp.disposed_by                         AS disposed_by
FROM hapi_specimen s
CROSS JOIN LATERAL (
  SELECT
    ext->>'dispositionType'   AS disposition_type,
    ext->>'dispositionDate'   AS disposition_date,
    ext->>'storageLocation'   AS storage_location,
    ext->>'disposedBy'        AS disposed_by
  FROM jsonb_array_elements(s.extension) ext
  WHERE ext->>'url' = 'https://openelis-global.org/fhir/StructureDefinition/specimen-final-disposition'
) ext_disp
WHERE s.subject_reference LIKE 'ServiceRequest/%'; -- ENV/Vector orders only
```

This view enables future aggregate queries such as: disposition breakdown by month, disposal rate by lab unit, biorepository utilisation trend.

---

## 8. Business Rules

**BR-01** — FHIR push applies to ENV and Vector samples only. Clinical dispositions are not in scope for S-05b.

**BR-02** — `Temporary` storage does not trigger a FHIR push. It is considered an intermediate state, not a final disposition.

**BR-03** — If disposition is updated (e.g., a sample moved from Biorepository to Disposed after a regulatory recall), the `Specimen` resource on HAPI FHIR is overwritten with the new disposition. No history version is explicitly managed by OpenELIS — HAPI FHIR's native versioning (`_history`) provides the audit trail.

**BR-04** — The FHIR push is **best-effort non-blocking**: a push failure does not prevent the disposition from being saved in OpenELIS. The disposition is stored locally regardless of FHIR push outcome. The delivery log records failures for follow-up.

**BR-05** — Extension field values MUST NOT contain PII beyond what is already present on the Specimen resource (e.g., the `disposedBy` Practitioner reference is acceptable as it is the same staff user already referenced in the Specimen's `collection.collector` element).

---

## 9. Deployment Notes

On first deployment of S-05b:

1. Load the `specimen-final-disposition` StructureDefinition to the HAPI FHIR server.
2. Load the `specimen-disposition-type` CodeSystem to the HAPI FHIR server.
3. No data migration is required — historical dispositions recorded before S-05b deployment are not back-filled to FHIR. Only dispositions recorded after deployment generate FHIR pushes.
4. Confirm with Piotr Mankowski (OGC-586) that the extension URL namespace and StructureDefinition conventions are consistent with V-04 extension decisions before implementation.

---

## 10. Acceptance Criteria

**Trigger:**
- [ ] Recording a `Disposed` disposition for an ENV/Vector sample fires a FHIR push
- [ ] Recording a `Biorepository` disposition for an ENV/Vector sample fires a FHIR push
- [ ] Recording `Temporary` storage does NOT fire a FHIR push
- [ ] Clinical sample dispositions do NOT fire a FHIR push
- [ ] Updating an existing disposition fires an update push (overwrite, not create)

**FHIR Specimen resource:**
- [ ] `Specimen.status` = `unavailable` for Disposed; `available` for Biorepository
- [ ] `specimen-final-disposition` extension is present with all required sub-extensions
- [ ] `dispositionType` code is `disposed` or `biorepository` (from the defined CodeSystem)
- [ ] `dispositionDate` matches the date the disposition was recorded in OpenELIS
- [ ] `storageLocation` is populated for Biorepository dispositions; omitted for Disposed
- [ ] If no Specimen resource exists on HAPI FHIR, one is created before the extension is applied

**Delivery & retry:**
- [ ] 3× retry with exponential backoff on push failure
- [ ] Push attempt logged in FHIR push log with event_type = 'SPECIMEN_DISPOSITION_FINAL'
- [ ] FHIR push failure does NOT prevent disposition from saving in OpenELIS

**Deployment:**
- [ ] `specimen-final-disposition` StructureDefinition loaded to HAPI FHIR server
- [ ] `specimen-disposition-type` CodeSystem loaded to HAPI FHIR server

---

## 11. Dependencies & Cross-References

| Item | Relationship |
|------|-------------|
| S-05 (Compliance Evaluation Engine) / OGC-547 | Parent — S-05b hooks into the result/disposition workflow |
| V-04 (Vector Surveillance Reporting) / OGC-585 | Sibling — same HAPI FHIR server, same async push queue, same extension namespace |
| OGC-586 (V-04 FHIR Architectural Review) | Gate — extension URL and StructureDefinition conventions must be confirmed before S-05b implementation |
| OGC-296 (`sampleDomain`) | Gate — `sampleDomain` determines whether the FHIR push fires |
| Existing OpenELIS Storage Module | Hook point — `SPECIMEN_DISPOSITION_FINAL` event wired to existing disposition save |
| HAPI FHIR R4 `Specimen` resource | Target — updated with status + extension on each disposition event |
| OHS SQL-on-FHIR ETL | Future consumer — query pattern provided in §7; no ETL changes required in v1.0 |
