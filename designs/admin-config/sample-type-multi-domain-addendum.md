# Domain Routing via Lab Unit — Single-Domain Classification

**Supersedes:** Prior draft of "OGC-296 Addendum: SampleType Multi-Domain Classification" (which proposed `Set<SampleDomain>` — withdrawn)
**Addendum to:** [OGC-296 — Sample Type Management Module](https://uwdigi.atlassian.net/browse/OGC-296)
**Related specs:** S-04 FRS (OGC-538), panel.md v1.2, V-03 FRS v1.2
**Last updated:** 2026-04-23
**Status:** Active — supersedes multi-domain draft

---

## Design Decision: Single Domain per Entity

Every entity that carries a domain classification — SampleType, Panel, Test, Lab Unit — has exactly **one** domain value: `CLINICAL`, `ENVIRONMENTAL`, or `VECTOR`.

There is no `ALL`, `BOTH`, or multi-domain set. If a concept genuinely spans domains (e.g., a water quality test used in both environmental and clinical contexts), it is represented as separate entities in each domain's catalog. This keeps filtering logic simple and explicit, and prevents silent cross-contamination of domain-specific workflows.

| Entity | Domain field | Enum values |
|---|---|---|
| `SampleType` | `sampleDomain` | CLINICAL / ENVIRONMENTAL / VECTOR |
| `Panel` | `panelDomain` | CLINICAL / ENVIRONMENTAL / VECTOR |
| `Test` | (via lab unit / panel assignment) | Inherited from lab unit context |
| `LabUnit` | `labUnitDomain` | CLINICAL / ENVIRONMENTAL / VECTOR |

---

## Data Model

### SampleType (single-domain)

```java
@Column(name = "sample_domain", nullable = false)
@Enumerated(EnumType.STRING)
private SampleDomain sampleDomain = SampleDomain.CLINICAL;
```

```sql
ALTER TABLE sample_type
  ADD COLUMN sample_domain VARCHAR(20) NOT NULL DEFAULT 'CLINICAL'
    CHECK (sample_domain IN ('CLINICAL', 'ENVIRONMENTAL', 'VECTOR'));
```

Backfill: all existing rows default to `CLINICAL`. No join table required.

### LabUnit (add domain field)

```sql
ALTER TABLE lab_unit
  ADD COLUMN lab_unit_domain VARCHAR(20) NOT NULL DEFAULT 'CLINICAL'
    CHECK (lab_unit_domain IN ('CLINICAL', 'ENVIRONMENTAL', 'VECTOR'));
```

Backfill: all existing lab units default to `CLINICAL`.

---

## Lab Unit Domain Drives Routing

The **lab unit assigned to an order** is the single source of truth for domain routing. Once resolved, it silently determines:

1. Which **order entry form** renders (standard clinical fields / ENV extensions / Vector collection fields)
2. Which **sample type dropdown** is shown (filtered to `sampleDomain = labUnit.labUnitDomain`)
3. Which **panel ComboBox** is shown (filtered to `panelDomain = labUnit.labUnitDomain`)
4. Which **results screen** is used (future: domain-specific results views)
5. Which **validation screen** is used (currently shared; domain-aware routing is in place for future divergence — see §Validation below)

**No user-facing domain selector exists.** The technician selects a lab unit; everything else follows automatically.

### Domain Resolution Flow

```
User selects Lab Unit
        ↓
labUnit.labUnitDomain resolved (CLINICAL | ENVIRONMENTAL | VECTOR)
        ↓
┌──────────────────────────────────────────────────────────┐
│  Order entry form variant  → domain-specific sections     │
│  SampleType dropdown       → ?domain=<resolved>           │
│  Panel ComboBox            → panelDomain = <resolved>     │
│  Results screen            → domain-aware routing         │
│  Validation screen         → shared (future: per-domain)  │
└──────────────────────────────────────────────────────────┘
```

---

## Admin UI Change (OGC-296 Basic Info Tab)

The SampleType editor's Basic Info tab gains a **Domain** `Select` field (not a checkbox group). Options: Clinical / Environmental / Vector. Default: Clinical.

| Field | Control | Required | Default |
|---|---|---|---|
| **Domain** | `Select` | Yes | Clinical |

A Domain Tag appears in the sample type list table:

| Domain | Tag kind |
|---|---|
| CLINICAL | `blue` |
| ENVIRONMENTAL | `teal` |
| VECTOR | `green` |

---

## API Contract

```
GET /api/v1/sample-types?domain=ENVIRONMENTAL&active=true
```

Returns only SampleTypes where `sampleDomain = 'ENVIRONMENTAL'`. The filter is exact — no fallback to BOTH or ALL. If no `domain` parameter is supplied, all active sample types are returned (existing behavior — backward compatible).

---

## Validation Screen — Future-Proofing Note

The current OpenELIS validation screen is shared across all domains. However, domain-aware routing is architecturally present: the lab unit domain is available at validation time, and the routing layer can inspect it to render a domain-specific view if needed in a future release.

**Current behavior:** All domains use the shared validation workbench.
**Future path:** When domain-specific validation views diverge (e.g., an ENV compliance evaluation step inline with validation), the routing layer routes to the appropriate screen based on `labUnit.labUnitDomain`. No re-architecture required — it is a configuration change, not a structural one.

---

## Filter Integration

| Module | Jira | Domain value passed |
|---|---|---|
| Standard clinical order entry | (existing) | `CLINICAL` |
| Environmental Order Entry (S-03) | OGC-537 | `ENVIRONMENTAL` |
| Vector Collection Workflow (V-02) | OGC-581 | `VECTOR` |

---

## Acceptance Criteria

**Data model**
- [ ] `sample_type.sample_domain` column exists with CHECK constraint (CLINICAL/ENVIRONMENTAL/VECTOR)
- [ ] All existing SampleType records backfilled with CLINICAL
- [ ] `lab_unit.lab_unit_domain` column exists with CHECK constraint
- [ ] All existing LabUnit records backfilled with CLINICAL

**Admin UI**
- [ ] SampleType Basic Info tab shows Domain Select with three options (Clinical, Environmental, Vector)
- [ ] New SampleType defaults to Clinical
- [ ] SampleType list shows Domain Tag column (blue/teal/green)

**Routing**
- [ ] Selecting a CLINICAL lab unit on order entry shows only CLINICAL sample types and panels
- [ ] Selecting an ENVIRONMENTAL lab unit shows only ENVIRONMENTAL sample types and panels
- [ ] Selecting a VECTOR lab unit shows only VECTOR sample types and panels
- [ ] No domain selector prompt is shown to the user at order entry — routing is automatic

**API**
- [ ] `GET /api/v1/sample-types?domain=ENVIRONMENTAL` returns only ENVIRONMENTAL types
- [ ] `GET /api/v1/sample-types?domain=VECTOR` returns only VECTOR types
- [ ] No `domain` param returns all types (backward compatible)
- [ ] Invalid domain value returns HTTP 400

---

## Dependencies

| Issue | Relationship |
|---|---|
| OGC-538 (S-04) | Admin UI spec — updated to reflect single-domain Select (not CheckboxGroup) |
| panel.md v1.2 | Panel domain also single-value; ALL removed |
| OGC-537 (S-03) | Environmental order entry — passes `?domain=ENVIRONMENTAL` to sample type filter |
| OGC-581 (V-02) | Vector collection — passes `?domain=VECTOR` |
| Lab Unit admin (TBD) | Adds `labUnitDomain` field to lab unit configuration UI |
