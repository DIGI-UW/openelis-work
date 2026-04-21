# OGC-296 Addendum: SampleType Multi-Domain Classification

**Addendum to:** [OGC-296 — Sample Type Management Module](https://uwdigi.atlassian.net/browse/OGC-296)  
**Related spec:** S-04 FRS (OGC-538) — Sample Type Domain Classification (admin UI)  
**Related dependency:** Lab Section domain config — adding `VECTOR` to LabSection (separate Jira, TBD)  
**Last updated:** 2026-04-20  
**Status:** Draft — for comment on OGC-296

---

## 1. Overview

This addendum extends the SampleType entity being built in OGC-296 to support **multi-domain classification**. Each SampleType record gains a required set of domain tags indicating which workflow contexts the sample type participates in.

**Motivation:** The original OGC-296 scope covers clinical sample types only. As the environmental and vector surveillance modules come online (S-03, V-01–V-04), order-entry dropdowns must filter to only show sample types relevant to the current workflow context. A single-value enum cannot express a sample type that spans multiple domains (e.g., a water sample type used in both environmental and clinical parasite testing).

**Replaces:** The single-value `sampleDomain` enum planned in S-04 (OGC-538). S-04's admin UI design is unchanged — only the underlying field changes from `sampleDomain: SampleDomain` to `domains: Set<SampleDomain>`.

---

## 2. User Stories

- **US-01** — As a lab administrator, I want to tag each sample type with one or more domain contexts (Clinical, Environmental, Vector) so that order-entry staff only see relevant sample types for their current workflow.
- **US-02** — As a lab administrator, I want to be prevented from saving a sample type with no domain selected, so that every sample type appears in at least one order-entry context.
- **US-03** — As a developer, I want the domain field to be serialized as a string array in the REST API so that existing integrations using the SampleType endpoint are not broken by the change.

---

## 3. Data Model Change

### 3.1 New Enum

```java
public enum SampleDomain {
    CLINICAL,
    ENVIRONMENTAL,
    VECTOR
}
```

Canonical string representations (for API and DB storage): `"CLINICAL"`, `"ENVIRONMENTAL"`, `"VECTOR"`.

### 3.2 SampleType Entity Change

**Remove** (if previously added per S-04 single-enum approach):
```java
@Column(name = "sample_domain")
@Enumerated(EnumType.STRING)
private SampleDomain sampleDomain;
```

**Add:**
```java
@ElementCollection(fetch = FetchType.EAGER)
@CollectionTable(
    name = "sample_type_domain",
    joinColumns = @JoinColumn(name = "sample_type_id")
)
@Column(name = "domain")
@Enumerated(EnumType.STRING)
private Set<SampleDomain> domains = new HashSet<>();
```

### 3.3 New Table: `sample_type_domain`

| Column | Type | Constraints |
|--------|------|-------------|
| `sample_type_id` | `BIGINT` | FK → `sample_type.id`, NOT NULL |
| `domain` | `VARCHAR(32)` | NOT NULL, CHECK IN ('CLINICAL','ENVIRONMENTAL','VECTOR') |

**Composite primary key:** `(sample_type_id, domain)` — prevents duplicate domain tags per type.

### 3.4 Validation Constraint

`domains` must be non-empty. Enforce at:
- **Service layer:** throw `ValidationException("sampleType.domains.required")` if `domains.isEmpty()` before persist/merge.
- **UI layer:** Carbon `CheckboxGroup` shows inline error if user clears all checkboxes and attempts save (see §5).

---

## 4. Database Migration (Flyway)

### Script: `V[next]__add_sample_type_domain_table.sql`

```sql
-- Create the domain join table
CREATE TABLE sample_type_domain (
    sample_type_id BIGINT NOT NULL,
    domain         VARCHAR(32) NOT NULL,
    CONSTRAINT pk_sample_type_domain PRIMARY KEY (sample_type_id, domain),
    CONSTRAINT fk_std_sample_type FOREIGN KEY (sample_type_id)
        REFERENCES sample_type(id) ON DELETE CASCADE,
    CONSTRAINT chk_std_domain CHECK (domain IN ('CLINICAL', 'ENVIRONMENTAL', 'VECTOR'))
);

-- Backfill: all existing sample types default to CLINICAL
INSERT INTO sample_type_domain (sample_type_id, domain)
SELECT id, 'CLINICAL'
FROM   sample_type;

-- Drop old single-value column if it was added by a prior migration
-- (Only execute if the column exists — wrap in a DO block for safety)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sample_type' AND column_name = 'sample_domain'
    ) THEN
        ALTER TABLE sample_type DROP COLUMN sample_domain;
    END IF;
END $$;
```

**Rollback note:** The `ON DELETE CASCADE` on `sample_type_domain` ensures no orphan rows if a SampleType is deleted. There is no data loss risk — all existing records default to `CLINICAL`.

---

## 5. Admin UI Change (Addendum to OGC-296 Basic Info Tab)

This section amends the SampleType editor being built in OGC-296. The Basic Info tab gains a new required field group below the existing Name / Active toggle fields.

### 5.1 New Field: Domain Context

**Label:** "Domain context" (i18n key: `sampleType.domain.label`)  
**Helper text:** "Select all workflow contexts this sample type appears in. At least one is required." (i18n key: `sampleType.domain.helperText`)  
**Control:** Three checkboxes in a `CheckboxGroup`:

| Checkbox label | i18n key | Value |
|----------------|----------|-------|
| Clinical | `sampleType.domain.clinical` | `CLINICAL` |
| Environmental | `sampleType.domain.environmental` | `ENVIRONMENTAL` |
| Vector | `sampleType.domain.vector` | `VECTOR` |

**Default for new records:** `CLINICAL` pre-checked.  
**Default for existing records:** `CLINICAL` pre-checked (per migration backfill).

### 5.2 Validation Behavior

| State | UI Behavior |
|-------|-------------|
| All boxes unchecked, user clicks Save | Inline error below `CheckboxGroup`: "At least one domain context is required." (`sampleType.domain.error.required`) |
| At least one checked, user clicks Save | Normal save flow; no error |

### 5.3 List View Badge (Domain Tags)

In the SampleType list table (OGC-296 dashboard), add a **Domain** column showing Carbon `Tag` components for each enabled domain:

| Domain | Tag kind |
|--------|----------|
| Clinical | `blue` |
| Environmental | `teal` |
| Vector | `green` |

A sample type with `{CLINICAL, ENVIRONMENTAL}` shows two tags side by side.

---

## 6. API Contract

### 6.1 SampleType REST Response

Add `domains` field to the SampleType DTO. This is a **backward-compatible additive change** — existing clients that don't read `domains` are unaffected.

```json
{
  "id": 42,
  "name": "Water Sample",
  "active": true,
  "domains": ["ENVIRONMENTAL"],
  ...
}
```

### 6.2 SampleType Create/Update Request

`domains` is **required** in create/update requests. API returns `HTTP 400` with `{"error": "sampleType.domains.required"}` if the array is absent or empty.

```json
{
  "name": "Mosquito Pool",
  "active": true,
  "domains": ["VECTOR"],
  ...
}
```

### 6.3 Order Entry Filter Endpoint

The endpoint that populates the sample type dropdown in order entry MUST accept a `domain` query parameter:

```
GET /api/v1/sample-types?domain=ENVIRONMENTAL&active=true
```

Returns only SampleTypes whose `domains` set contains `ENVIRONMENTAL`. This is the mechanism by which S-03 (environmental order entry) and V-02 (vector collection) filter the dropdown.

If no `domain` parameter is supplied, all active sample types are returned (existing behavior — backward compatible).

---

## 7. Order Entry Domain Context Resolution

The effective domain for an order is resolved at the **lab unit (Sample Category) level** — before the SampleType field is reached. By the time a user selects a sample type, the domain is already known and the dropdown is pre-filtered.

### 7.1 Sample Category toggle — the domain selection point

The order entry form contains a **"Sample Category" section** near the top, implemented as a segmented button group (Clinical / Environmental / Other / Vector).

**Visibility rule:**
- **Lab unit configured for a single domain** → the Sample Category section is hidden; the domain is auto-selected silently and no user action is required.
- **Lab unit configured for multiple domains** → the Sample Category toggle is shown, and the user must pick one before the rest of the form becomes active.

This mirrors the existing `workflow-toggle` pattern in the sample collection redesign mockup (`sample-collection-redesign-mockup.html`, "Sample Category" section).

### 7.2 Resolved domain drives SampleType filtering and section rendering

Once the domain is resolved (either automatically or via the toggle):

1. The SampleType dropdown calls `GET /api/v1/sample-types?domain=<resolved>&active=true` and shows only matching types.
2. The context-specific form sections render based on the resolved domain:

| Resolved domain | Sections/fields shown in order entry |
|-----------------|--------------------------------------|
| `CLINICAL` | Standard clinical fields only (patient, test panel, collection date) |
| `ENVIRONMENTAL` | + Sampling site selector, compliance standard picker, collection conditions (S-03 fields) |
| `VECTOR` | + Collection lot / trap metadata, pooling strategy, GPS (V-02 fields) |

### 7.3 Role of SampleType.domains in this flow

The `domains` set on a SampleType is a **filter criterion only** — it controls whether a given sample type appears in a module's filtered dropdown. It does not trigger any prompt during order entry. A SampleType tagged `{CLINICAL, ENVIRONMENTAL}` appears in both dropdowns because each context's resolved domain is passed separately as the `?domain=` query parameter.

> **Note:** The lab unit multi-domain config (determining when the toggle is shown vs. hidden) is covered in the separate Jira TBD for lab section domain configuration. This addendum only specifies what the SampleType entity must expose for the filter to work.

---

## 8. Filter Integration

The following modules consume the domain filter and must pass the correct `domain` value when populating order-entry sample type dropdowns:

| Module | Jira | Domain value to pass |
|--------|------|----------------------|
| Standard clinical order entry | (existing) | `CLINICAL` |
| Environmental Order Entry (S-03) | OGC-537 | `ENVIRONMENTAL` |
| Vector Collection Workflow (V-02) | OGC-581 | `VECTOR` |

**Note on lab section domain gating:** A complementary filter at the lab section level (where a section is configured for specific domains) is planned in a separate Jira issue. Until that issue is implemented, the `domain` query parameter alone drives filtering. The two filters will be ANDed when the lab section filter is available.

---

## 8. Out of Scope

- **Lab section domain configuration** — tagging a LabSection as CLINICAL / ENVIRONMENTAL / VECTOR and cascading that to order entry visibility. Separate Jira issue (TBD). This addendum covers only the SampleType-level domain set.
- **BOTH as an enum value** — replaced by the multi-value set. A SampleType that previously would have been `BOTH` should now have `{CLINICAL, ENVIRONMENTAL}` checked.
- **Domain-based reporting or analytics** — downstream use of the `domains` field beyond order-entry filtering is not in scope for OGC-296.

---

## 9. Localization Table

| i18n Key | English Fallback |
|----------|-----------------|
| `sampleType.domain.label` | Domain context |
| `sampleType.domain.helperText` | Select all workflow contexts this sample type appears in. At least one is required. |
| `sampleType.domain.clinical` | Clinical |
| `sampleType.domain.environmental` | Environmental |
| `sampleType.domain.vector` | Vector |
| `sampleType.domain.error.required` | At least one domain context is required. |
| `sampleType.domain.column.header` | Domain |

> **Removed:** `orderEntry.domain.prompt.*` i18n keys (previously drafted) are not needed — domain is resolved at the program/lab unit level before SampleType selection. No disambiguation prompt renders at the SampleType field.

---

## 10. Acceptance Criteria

**Data model**
- [ ] `sample_type_domain` table created by Flyway migration on startup
- [ ] All existing SampleType records backfilled with `CLINICAL` domain
- [ ] No `sample_domain` column remains on `sample_type` table after migration
- [ ] `SampleType.domains` is persisted as a set (no duplicate domains per type)

**Validation**
- [ ] Saving a SampleType with an empty `domains` set via API returns HTTP 400
- [ ] Saving a SampleType with an empty `domains` set via admin UI shows inline error and does not submit

**Admin UI**
- [ ] Basic Info tab shows CheckboxGroup with Clinical, Environmental, Vector checkboxes
- [ ] New SampleType form defaults to Clinical pre-checked
- [ ] Existing SampleType records load with their persisted domain set pre-checked
- [ ] SampleType list table shows domain Tag(s) per row (blue=Clinical, teal=Environmental, green=Vector)

**API**
- [ ] `GET /api/v1/sample-types` returns `domains` array on every SampleType
- [ ] `GET /api/v1/sample-types?domain=ENVIRONMENTAL` returns only types with ENVIRONMENTAL in their set
- [ ] `GET /api/v1/sample-types` (no domain param) returns all active types (unchanged behavior)
- [ ] `POST/PUT` without `domains` field returns HTTP 400

**Filter integration**
- [ ] Environmental order entry dropdown shows only sample types with `ENVIRONMENTAL` in their domain set (resolved domain passed as `?domain=ENVIRONMENTAL` at program/lab unit selection)
- [ ] Vector collection dropdown shows only sample types with `VECTOR` in their domain set (resolved domain passed as `?domain=VECTOR`)
- [ ] Clinical order entry continues to show only sample types with `CLINICAL` in their domain set
- [ ] No domain disambiguation prompt appears at the SampleType selection field — domain is already resolved upstream

---

## 11. Dependencies & Cross-References

| Issue | Relationship |
|-------|-------------|
| OGC-538 (S-04) | Admin UI spec — references this data model. S-04's checkbox UI is unchanged; only the entity field changes from single enum to set. |
| OGC-537 (S-03) | Environmental order entry — consumes `?domain=ENVIRONMENTAL` filter |
| OGC-555 (V-01) | Vector reference data — defines VECTOR sample types; depends on this field existing |
| OGC-581 (V-02) | Vector collection — consumes `?domain=VECTOR` filter |
| Lab Section Domain Config (TBD) | Future: adds domain tags to LabSection entities. Will AND with SampleType domain filter. |
