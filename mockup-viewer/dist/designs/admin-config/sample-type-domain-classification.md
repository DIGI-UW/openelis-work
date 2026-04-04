# Sample Type Domain Classification
## Functional Requirements Specification — v1.0

**Version:** 1.0
**Date:** 2026-04-03
**Status:** Draft for Review
**Jira:** [OGC-538](https://uwdigi.atlassian.net/browse/OGC-538) (addendum to [OGC-296](https://uwdigi.atlassian.net/browse/OGC-296), tracked under Vector epic [OGC-527](https://uwdigi.atlassian.net/browse/OGC-527))
**Technology:** Java Spring Framework, Carbon React (`@carbon/react`)
**Related Modules:** Sample Type Management Module (OGC-296), Test Catalog Redesign (OGC-173, Done), Environmental Order Entry (S-03, OGC-537), Sample Collection Redesign (ORD-3 workflow toggle)

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. Goals & Non-Goals
4. Existing Infrastructure
5. Functional Requirements
   - 5.1 Domain Field on Sample Type Entity
   - 5.2 Basic Info Tab Extension
   - 5.3 Bulk Domain Assignment
   - 5.4 Workflow Toggle Filtering
   - 5.5 Compliance Standard Filtering
   - 5.6 API Filtering Support
6. Data Model
7. API Endpoints
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

S-04 adds a `sampleDomain` classification field to the SampleType entity, enabling OpenELIS to distinguish between clinical sample types (Serum, Plasma, Whole Blood), environmental sample types (Surface Water, Groundwater, Ambient Air), and dual-use types that appear in both contexts (e.g., Drinking Water may be tested in either a clinical water-quality context or an environmental monitoring context).

**This spec introduces no new pages or modules.** The underlying sample type management infrastructure already exists and is fully functional (OGC-296, In Progress). S-04 adds a single enum field (`sampleDomain`) to the existing entity, extends the existing Basic Info tab with a dropdown, and provides a bulk assignment utility for classifying existing sample types. The field is then consumed by the workflow toggle (ORD-3), the environmental order entry sample type checklist (S-03 ENV-2-001), and the compliance standard's `applicableSampleTypes` filter (S-01).

This is a **UI and data model addendum** to OGC-296, not a standalone module.

---

## 2. Problem Statement

**Current state:** OpenELIS treats all sample types identically. There is no way to distinguish a clinical specimen (Serum) from an environmental sample (Surface Water). When the Sample Collection Redesign's workflow toggle (ORD-3) switches between Clinical and Environmental modes, there is no mechanism to filter sample type dropdowns accordingly — a technician in Environmental mode sees "Serum" and "Whole Blood" alongside "Surface Water" and "Groundwater."

**Impact:** Without domain classification, the environmental workflow extensions (S-03) cannot properly filter sample types. The compliance standard's `applicableSampleTypes` field (S-01) has no domain context. Users must mentally filter irrelevant sample types from long dropdown lists, increasing error risk and slowing data entry.

**Proposed solution:** Add a `sampleDomain` enum (`CLINICAL`, `ENVIRONMENTAL`, `BOTH`) to the SampleType entity. Expose it as a dropdown on the existing OGC-296 Basic Info tab. Provide a one-time bulk assignment utility for existing deployments. Wire the enum into the workflow toggle filter and the S-03 sample type checklist.

---

## 3. Goals & Non-Goals

### 3.1 Goals

1. **Classify every sample type by domain** — CLINICAL, ENVIRONMENTAL, or BOTH
2. **Filter sample type dropdowns by workflow mode** — Clinical mode shows CLINICAL + BOTH; Environmental mode shows ENVIRONMENTAL + BOTH
3. **Provide bulk assignment for existing deployments** — A utility view to quickly classify all existing sample types without editing each one individually
4. **Support S-03 sample type checklist** — The compliance standard's `applicableSampleTypes` list only references ENVIRONMENTAL or BOTH types
5. **Zero disruption to existing clinical workflows** — Default value is CLINICAL so nothing changes for existing deployments until explicitly configured

### 3.2 Non-Goals

1. **New admin page** — S-04 extends the existing OGC-296 editor, not a new page
2. **Sample type CRUD** — Already covered by OGC-296
3. **Test catalog changes** — Tests are linked to sample types, not to domains. A test for pH can apply to both Serum and Surface Water
4. **Environmental sample type creation** — Labs create their own environmental sample types using the existing OGC-296 creation flow; S-04 just classifies them
5. **Migration of existing data** — Default value handles backward compatibility; bulk assignment is optional

---

## 4. Existing Infrastructure

S-04 builds on functionality that **already exists** in OpenELIS. This section documents what is already in place vs. what S-04 adds.

### 4.1 Already Exists (OGC-296 — In Progress)

| Capability | Status | Where |
|-----------|--------|-------|
| Sample Type entity (name, description, active status) | Exists | Database + API |
| Sample Type Management admin page (`/admin/sample-type-management`) | In Progress | OGC-296 |
| 5-tab editor (Basic Info, Display Order, Associated Tests, Storage & Disposal, WHONET Mapping) | In Progress | OGC-296 |
| Create / edit / activate / deactivate sample types | In Progress | OGC-296 |
| Sample type → test associations (bidirectional) | In Progress | OGC-296 |
| Display order management | In Progress | OGC-296 |
| WHONET code mapping | In Progress | OGC-296 |
| Search and filtering on sample type list | In Progress | OGC-296 |

### 4.2 Added by S-04

| Capability | What's New |
|-----------|-----------|
| `sampleDomain` enum on SampleType entity | New column: `CLINICAL` / `ENVIRONMENTAL` / `BOTH` |
| Domain dropdown on Basic Info tab | New field in existing tab |
| Domain Tag in sample type list table | New column with colored Tags |
| Domain filter on sample type list | New filter dropdown on existing toolbar |
| Bulk Domain Assignment utility | New section below the sample type list (expandable) |
| Workflow toggle filtering | Consumer behavior: ORD-3 toggle filters by domain |
| S-03 sample type checklist filtering | Consumer behavior: ENV-2-001 checklist filters by domain |
| API query parameter `?domain=ENVIRONMENTAL` | New filter on existing list endpoint |

---

## 5. Functional Requirements

### 5.1 Domain Field on Sample Type Entity

**ID:** STD-1-001
**Priority:** P0
**Requirement:**
The SampleType entity SHALL include a `sampleDomain` field with the following enum values:

| Value | Description | When shown |
|-------|------------|-----------|
| `CLINICAL` | Clinical specimen type (blood, urine, tissue, etc.) | Clinical workflow only |
| `ENVIRONMENTAL` | Environmental sample type (water, air, soil, etc.) | Environmental workflow only |
| `BOTH` | Dual-use type applicable in either context | Both workflows |

The default value for all existing sample types is `CLINICAL`, ensuring zero disruption to existing deployments. New sample types default to `CLINICAL` unless explicitly set.

**Acceptance Criteria:**
- [ ] `sampleDomain` column exists on the sample_type table
- [ ] Default value is `CLINICAL`
- [ ] All existing sample types retain `CLINICAL` after migration
- [ ] Enum is validated at API level (rejects invalid values)

---

### 5.2 Basic Info Tab Extension

**ID:** STD-2-001
**Priority:** P0
**Requirement:**
The Sample Type Editor Basic Info tab (OGC-296) SHALL include a **Sample Domain** dropdown field after the Active toggle and before the Description field. The dropdown contains three options:

- Clinical — for clinical specimen types
- Environmental — for environmental sample types
- Both — for dual-use types

The field is required. When creating a new sample type, the default is "Clinical." A helper text reads: "Determines which workflow mode (Clinical or Environmental) this sample type appears in."

A Domain Tag SHALL also appear next to the sample type name in the editor header, using the same color mapping as the list table (green=Clinical, purple=Environmental, teal=Both).

**Acceptance Criteria:**
- [ ] Domain dropdown appears on Basic Info tab
- [ ] Three options: Clinical, Environmental, Both
- [ ] Default is Clinical for new sample types
- [ ] Helper text displayed
- [ ] Domain Tag shown in editor header
- [ ] Change is saved with other Basic Info fields
- [ ] i18n keys used for all labels and options

---

### 5.3 Bulk Domain Assignment

**ID:** STD-3-001
**Priority:** P1
**Requirement:**
The Sample Type Management list page SHALL include a **"Classify Sample Domains"** expandable section (Accordion) below the main sample type table. When expanded, it shows a compact table listing all sample types with their current domain classification, and provides inline dropdowns for quick bulk assignment. This is intended as a one-time setup utility for existing deployments migrating to environmental workflows.

The bulk assignment table contains:

| Column | Content |
|--------|---------|
| Sample Type Name | Read-only |
| Current Domain | Tag (green/purple/teal) |
| New Domain | Select dropdown (Clinical / Environmental / Both) — pre-filled with current value |
| Test Count | Number of associated tests (for reference) |

Below the table:
- **"Apply Changes" button** (kind="primary") — saves all modified rows in a single batch
- **"Reset" button** (kind="ghost") — reverts unsaved changes
- **Count indicator:** "N of M sample types classified as Environmental or Both"

An `InlineNotification` (kind="info") above the table reads: "Use this utility to quickly classify your existing sample types. This determines which sample types appear in Clinical vs. Environmental workflow modes."

**Acceptance Criteria:**
- [ ] Accordion section appears below the sample type list
- [ ] Table shows all sample types with current domain tags
- [ ] Inline dropdowns allow quick classification changes
- [ ] "Apply Changes" saves all modified rows in one batch API call
- [ ] "Reset" reverts unsaved changes
- [ ] Count indicator updates dynamically
- [ ] Success notification after bulk save
- [ ] i18n keys for all labels

---

### 5.4 Workflow Toggle Filtering

**ID:** STD-4-001
**Priority:** P0
**Requirement:**
When the Sample Collection Redesign workflow toggle (ORD-3) is set to **Clinical**, all sample type dropdowns throughout the order entry workflow SHALL be filtered to show only sample types where `sampleDomain` is `CLINICAL` or `BOTH`. When set to **Environmental**, dropdowns SHALL show only `ENVIRONMENTAL` or `BOTH`.

This filtering applies to:
- Step 1 (Enter Order) — sample type selection
- Step 2 (Collect Sample) — sample type confirmation/change
- S-03 ENV-2-001 — sample type checklist from compliance standard (already filtered by standard's `applicableSampleTypes`, now additionally filtered by domain)
- S-03 "Add Other Sample Type" override ComboBox — shows `ENVIRONMENTAL` or `BOTH` types when in Environmental mode

**Acceptance Criteria:**
- [ ] Clinical mode shows CLINICAL + BOTH sample types
- [ ] Environmental mode shows ENVIRONMENTAL + BOTH sample types
- [ ] Filtering applies to all sample type dropdowns in the order workflow
- [ ] S-03 sample type checklist respects domain filter
- [ ] S-03 override ComboBox respects domain filter
- [ ] Changing workflow toggle updates the filtered list
- [ ] No sample types are orphaned (every type appears in at least one mode)

---

### 5.5 Compliance Standard Filtering

**ID:** STD-5-001
**Priority:** P1
**Requirement:**
When configuring a Compliance Standard's `applicableSampleTypes` in the S-01 admin UI (FR-1-008), the sample type picker SHALL be filtered to show only `ENVIRONMENTAL` or `BOTH` types. Clinical-only sample types are not relevant to compliance standards and should not appear in the picker.

**Acceptance Criteria:**
- [ ] S-01 `applicableSampleTypes` picker shows only ENVIRONMENTAL + BOTH types
- [ ] Existing associations with CLINICAL types (if any from before migration) are preserved but flagged with a warning
- [ ] i18n warning message: "This sample type is classified as Clinical-only and may not appear in environmental workflows."

---

### 5.6 API Filtering Support

**ID:** STD-6-001
**Priority:** P0
**Requirement:**
The sample type list API endpoint SHALL support a `domain` query parameter that filters results by `sampleDomain`. This enables all consuming UIs to request only relevant sample types.

Examples:
- `GET /api/v1/sample-types?domain=CLINICAL` — returns CLINICAL + BOTH
- `GET /api/v1/sample-types?domain=ENVIRONMENTAL` — returns ENVIRONMENTAL + BOTH
- `GET /api/v1/sample-types` (no filter) — returns all sample types

Note: When `domain` is specified, the API returns types matching that domain **plus** types with `BOTH`, since dual-use types are always relevant.

**Acceptance Criteria:**
- [ ] `?domain=CLINICAL` returns CLINICAL and BOTH types
- [ ] `?domain=ENVIRONMENTAL` returns ENVIRONMENTAL and BOTH types
- [ ] No `domain` parameter returns all types
- [ ] Invalid domain value returns HTTP 400
- [ ] Filter combines with existing filters (active, search) via AND

---

## 6. Data Model

### 6.1 Modified Entities

**SampleType (extends existing)**

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `sampleDomain` | Enum | Yes | `CLINICAL` | Values: CLINICAL, ENVIRONMENTAL, BOTH |

### 6.2 Database Schema Changes

```sql
-- Create enum type
CREATE TYPE sample_domain AS ENUM ('CLINICAL', 'ENVIRONMENTAL', 'BOTH');

-- Add domain column with default (non-breaking migration)
ALTER TABLE sample_type
ADD COLUMN sample_domain sample_domain NOT NULL DEFAULT 'CLINICAL';

-- Index for filtered queries
CREATE INDEX idx_sample_type_domain ON sample_type(sample_domain);
```

**Migration note:** The `DEFAULT 'CLINICAL'` ensures all existing sample types are classified as Clinical automatically. This is a non-breaking change — existing deployments continue to work identically until an admin explicitly classifies environmental types.

---

## 7. API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|-----------|
| GET | `/api/v1/sample-types?domain={CLINICAL\|ENVIRONMENTAL}` | List sample types filtered by domain | `sampletype.view` |
| PUT | `/api/v1/sample-types/{id}` | Update sample type (includes sampleDomain) | `sampletype.edit` |
| PUT | `/api/v1/sample-types/bulk-domain` | Batch update domain classifications | `sampletype.edit` |

**Bulk domain update request body:**
```json
{
  "assignments": [
    { "sampleTypeId": 1, "sampleDomain": "ENVIRONMENTAL" },
    { "sampleTypeId": 2, "sampleDomain": "BOTH" },
    { "sampleTypeId": 5, "sampleDomain": "ENVIRONMENTAL" }
  ]
}
```

**Response:** `200 OK` with count of updated records, or `400` with validation errors.

---

## 8. Business Rules

**BR-001:** Default value for `sampleDomain` is `CLINICAL`. This ensures backward compatibility — existing deployments see no change in behavior until explicitly configured.

**BR-002:** The `BOTH` domain means the sample type appears in both Clinical and Environmental workflow modes. It does NOT mean "unclassified." Every sample type must have an explicit classification.

**BR-003:** When the API is queried with `?domain=CLINICAL`, it returns sample types where `sampleDomain IN ('CLINICAL', 'BOTH')`. Similarly, `?domain=ENVIRONMENTAL` returns `sampleDomain IN ('ENVIRONMENTAL', 'BOTH')`. The `BOTH` value is always included in either filter.

**BR-004:** Changing a sample type's domain does not affect existing orders that reference it. Orders store the sample type ID; the domain is only used for filtering in new order entry.

**BR-005:** Bulk domain assignment (STD-3-001) is idempotent — assigning a type to its current domain has no effect and is not counted as a change.

**BR-006:** The compliance standard `applicableSampleTypes` picker (S-01) only shows ENVIRONMENTAL + BOTH types, since compliance standards are an environmental concept. If a standard was previously linked to a CLINICAL-only type (e.g., due to data migration), the link is preserved but a warning is displayed.

---

## 9. Localization

| i18n Key | Default English Text |
|----------|---------------------|
| `label.sampleType.domain` | Sample Domain |
| `label.sampleType.domain.clinical` | Clinical |
| `label.sampleType.domain.environmental` | Environmental |
| `label.sampleType.domain.both` | Both |
| `label.sampleType.domain.helper` | Determines which workflow mode (Clinical or Environmental) this sample type appears in. |
| `heading.sampleType.bulkDomain` | Classify Sample Domains |
| `label.sampleType.bulkDomain.current` | Current Domain |
| `label.sampleType.bulkDomain.new` | New Domain |
| `label.sampleType.bulkDomain.testCount` | Tests |
| `label.sampleType.bulkDomain.count` | {count} of {total} sample types classified as Environmental or Both |
| `button.sampleType.bulkDomain.apply` | Apply Changes |
| `button.sampleType.bulkDomain.reset` | Reset |
| `message.sampleType.bulkDomain.info` | Use this utility to quickly classify your existing sample types. This determines which sample types appear in Clinical vs. Environmental workflow modes. |
| `message.sampleType.bulkDomain.success` | {count} sample types updated successfully. |
| `message.sampleType.bulkDomain.noChanges` | No changes to apply. |
| `error.sampleType.domain.required` | Sample domain is required. |
| `error.sampleType.domain.invalid` | Invalid sample domain value. |
| `message.sampleType.domain.clinicalWarning` | This sample type is classified as Clinical-only and may not appear in environmental workflows. |
| `label.sampleType.filter.domain` | Domain |
| `placeholder.sampleType.filter.domain` | All domains |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|-------|------|-----------|
| sampleDomain | Required; must be one of CLINICAL, ENVIRONMENTAL, BOTH | `error.sampleType.domain.required` / `error.sampleType.domain.invalid` |
| Bulk assignment | Each entry must reference a valid sample type ID | `error.sampleType.notFound` |
| Bulk assignment | Each entry must have a valid domain value | `error.sampleType.domain.invalid` |

---

## 11. Security & Permissions

S-04 reuses existing OGC-296 permissions. No new permission keys are introduced.

| Action | Required Permission | UI Behavior if Denied |
|--------|--------------------|-----------------------|
| View sample types + domain | `sampletype.view` | Domain column and tags visible (read-only) |
| Edit sample type domain | `sampletype.edit` | Domain dropdown disabled |
| Bulk domain assignment | `sampletype.edit` | Bulk assignment section hidden |
| API domain filter | `sampletype.view` | Filter works (read-only query) |

---

## 12. Acceptance Criteria

### Functional

- [ ] `sampleDomain` field added to SampleType entity with CLINICAL/ENVIRONMENTAL/BOTH values
- [ ] Default value is CLINICAL — existing deployments unaffected
- [ ] Domain dropdown appears on OGC-296 Basic Info tab
- [ ] Domain Tag (colored) appears in sample type list table and editor header
- [ ] Domain filter dropdown on sample type list toolbar
- [ ] Bulk Domain Assignment accordion with inline dropdowns and batch save
- [ ] Workflow toggle (ORD-3) filters sample types by domain
- [ ] S-03 sample type checklist respects domain filter
- [ ] S-03 override ComboBox respects domain filter
- [ ] S-01 `applicableSampleTypes` picker shows only ENVIRONMENTAL + BOTH
- [ ] API supports `?domain=` filter parameter

### Non-Functional

- [ ] All UI strings use i18n keys — no hardcoded English
- [ ] Migration is non-breaking (DEFAULT 'CLINICAL')
- [ ] Bulk assignment handles 500+ sample types without timeout
- [ ] Domain filter adds < 10ms to existing sample type queries (indexed column)

### Integration

- [ ] S-03 ENV-2-001 sample type checklist filters by ENVIRONMENTAL + BOTH
- [ ] S-03 "Add Other Sample Type" override filters by ENVIRONMENTAL + BOTH in Environmental mode
- [ ] S-01 FR-1-008 `applicableSampleTypes` picker filters by ENVIRONMENTAL + BOTH
- [ ] ORD-3 workflow toggle drives domain filter on all sample type dropdowns

---

## Appendix A: Domain Color Mapping

| Domain | Tag kind | Color |
|--------|---------|-------|
| CLINICAL | `green` | Green — matches clinical/positive conventions |
| ENVIRONMENTAL | `purple` | Purple — matches environmental workflow tag |
| BOTH | `teal` | Teal — neutral dual-use indicator |
