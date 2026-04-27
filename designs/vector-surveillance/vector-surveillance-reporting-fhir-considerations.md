# V-04 Vector Surveillance Reporting — FHIR Considerations
**For review by:** Piotr  
**Related spec:** V-04 FRS (OGC-TBD) — Vector Surveillance Reporting  
**Related story:** [OGC-527 Epic](https://uwdigi.atlassian.net/browse/OGC-527)  
**Last updated:** 2026-04-20  
**Status:** Draft — awaiting architectural review

---

## 1. Scope and Intent

The V-04 pipeline pushes OpenELIS vector surveillance data to HAPI FHIR R4, which the Google Open Health Stack (OHS) SQL-on-FHIR ETL then flattens into Postgres analytics views for Superset to query. The current implementation is **OpenELIS-only** — no multi-LIS federation is planned. FHIR is functioning as a structured ETL transport rather than an interoperability layer.

That said, the intent is to align extension design with the **WHO Vector Surveillance Digital Adaptation Kit (DAK) / FHIR Implementation Guide**, currently in early development under the SMART Guidelines programme. This doc should be revisited when that IG reaches ballot status. All custom extension URLs and CodeSystem URIs are namespaced under `https://openelis-global.org/fhir/` so they can be migrated or aliased when WHO guidance is finalized.

---

## 2. FHIR R4 Coverage Assessment

FHIR R4 was designed for clinical patient data. Vector surveillance spans environmental monitoring, entomological field data, and public health — none of which are first-class FHIR domains. Coverage of V-04 data points breaks down as follows:

| Data category | Native R4 coverage | Gap description |
|---|---|---|
| Pathogen test results | ~70% | `pool_size` has no standard element (see §3.1) |
| Species identification | ~50% | Taxonomy CodeSystem, lifecycle stage, sex, ID method all need extensions |
| Collection lot / trap deployment | ~40% | Trap type, GPS on trap, trap-nights duration, pooling strategy need extensions |
| Aggregated indices (MIR, catch rate) | 0% | Derived values — live entirely in OHS Postgres, no FHIR equivalent |
| Environmental conditions | ~20% | Temperature, humidity, rainfall have no Specimen home; need Observation extensions |

**Overall: approximately 45–50% of V-04 data points have direct or close FHIR R4 mappings without extensions.**

The OHS ETL bears the weight of the extension-heavy fields. If extension definitions drift from what the ETL expects, views silently return NULLs. Formal StructureDefinition profiles mitigate this risk (see §5).

---

## 3. Issues in the Current FRS Mapping

### 3.1 `specimenCount` and `poolFlag` mapped to `Specimen.note`

The existing FRS maps `specimenCount` to `Specimen.note[0].text` as the string `"specimenCount:{n}"` and `poolFlag` to `Specimen.note[1].text`. This is fragile:

- `Specimen.note` is a free-text annotation field. The OHS ETL would need a regex or string parse to extract the value — not a reliable extraction path.
- Array position (`note[0]`, `note[1]`) is not guaranteed if other code paths add notes.
- `specimenCount` is the denominator in the MIR formula. If this extraction fails, every MIR row in `vector_mir_weekly` silently returns NULL.

**Recommended fix:** Replace both with formal extensions (see §4 below).

### 3.2 Trap-nights not captured

The V-04 analytics require `trap_nights` (duration of deployment) for the `vector_trap_catch_daily` catch rate view. The current FRS maps `collectionDate` to `Specimen.collection.collectedDateTime` but does not map the trap deployment start date. There is no `Specimen.collection.deployedDateTime` element in R4.

The `vector_trap_catch_daily` view therefore cannot compute catch rate (`specimens ÷ trap-nights`) from the FHIR data as currently specified. Either:
- **Option A:** Add a `deployedDateTime` extension to the Specimen push and update the OHS view to use `collected - deployed` as trap-nights.
- **Option B:** Compute trap-nights in OpenELIS at collection time, push as a decimal extension directly.
- **Option C:** Source trap-nights from the OpenELIS database directly in the OHS ETL (bypassing FHIR for this field).

Option A is preferred for consistency. Option C is a pragmatic fallback if Piotr determines the ETL can query the OpenELIS DB directly.

### 3.3 GPS coordinates not captured

Trap GPS latitude/longitude (set on the CollectionLot in V-02) are not in the FRS FHIR mapping. The `vector_trap_catch_daily` and `vector_collection_lots` views don't include coordinates, so Superset cannot render a map chart or do geographic filtering. This is a V-04 gap unless added now.

The closest R4 path would be `Specimen.collection.bodySite` (designed for anatomical site, not geographic coordinates — a semantic mismatch). A dedicated extension is cleaner.

### 3.4 Species taxonomy CodeSystem coverage

The FRS uses `https://openelis-global.org/vector-species` as the coding system for species. This is fine for internal use, but SNOMED CT does have codes for some of the V-01 seed species (e.g., Aedes aegypti = SNOMED 60904002). If WHO IG alignment is the goal, the Observation should carry both the OpenELIS internal code and the SNOMED CT code as a second `coding[]` entry where SNOMED coverage exists.

Approximately 18 of the 40 V-01 seed species have SNOMED CT codes. The remaining 22 (mostly subspecies-level entries) would remain OpenELIS-only codes. Dual coding costs nothing at push time and improves alignment.

### 3.5 Pool deconvolution parent chain

The current mapping pushes a deconvolution outcome as a `Task` resource (FR-V04-FHIR-004). This captures the aggregate outcome (positive count, outcome percentage) but does not link individual positive child specimens back to their parent pool via `Specimen.parent`. Without this chain, the OHS ETL cannot trace which specific individual was positive — it can only know the pool was positive.

For MIR calculation this is acceptable (MIR uses pool-level positive counts). For any future individual-level epidemiological analysis it would be a gap. Recommend flagging this as a known limitation in the FRS rather than solving it now.

---

## 4. Recommended Extensions

All extensions should be defined as FHIR StructureDefinitions published at `https://openelis-global.org/fhir/StructureDefinition/`. This allows the OHS ETL to reference them by URL for reliable extraction.

### 4.1 Specimen extensions (CollectionLot)

| Extension name | URL suffix | Type | Replaces |
|---|---|---|---|
| `poolSize` | `vector-pool-size` | `integer` | `Specimen.note[0]` hack |
| `poolFlag` | `vector-pool-flag` | `boolean` | `Specimen.note[1]` hack |
| `poolingStrategy` | `vector-pooling-strategy` | `code` (INDIVIDUAL / POOL_FIXED / POOL_VARIABLE) | Not currently mapped |
| `trapNights` | `vector-trap-nights` | `decimal` | Not currently mapped |
| `deployedDateTime` | `vector-deployed-date-time` | `dateTime` | Not currently mapped |
| `trapGpsLatitude` | `vector-trap-gps-latitude` | `decimal` | Not currently mapped |
| `trapGpsLongitude` | `vector-trap-gps-longitude` | `decimal` | Not currently mapped |

### 4.2 Observation extensions (VectorSpecimenIdentification)

| Extension name | URL suffix | Type | Notes |
|---|---|---|---|
| `lifecycleStage` | `vector-lifecycle-stage` | `code` (LARVA / PUPA / ADULT) | Not currently mapped |
| `sex` | `vector-sex` | `code` (MALE / FEMALE / UNKNOWN) | Not currently mapped |
| `identificationMethod` | `vector-identification-method` | `code` (MORPHOLOGICAL / MOLECULAR / BOTH) | Currently mapped to `Observation.method` — OK, but extension gives cleaner OHS path |

### 4.3 DiagnosticReport extensions (Pathogen result)

| Extension name | URL suffix | Type | Notes |
|---|---|---|---|
| `poolPositive` | `vector-pool-positive` | `boolean` | Already in FRS as custom extension — just needs formal StructureDefinition |
| `poolSize` | `vector-pool-size` | `integer` | Needed on DiagnosticReport as well as Specimen for MIR view |

---

## 5. Custom CodeSystems Required

These should be defined as FHIR `CodeSystem` resources and published alongside the extensions:

| CodeSystem name | URI | Values |
|---|---|---|
| Vector Organism Group | `https://openelis-global.org/fhir/CodeSystem/vector-organism-group` | MOSQUITO, TICK, RODENT, OTHER_ARTHROPOD, OTHER_ANIMAL |
| Vector Trap Type | `https://openelis-global.org/fhir/CodeSystem/vector-trap-type` | BG_SENTINEL, CDC_LIGHT_TRAP, GRAVID_TRAP, OVITRAP, STICKY_TRAP, etc. (mirrors V-01 seed) |
| Vector Species | `https://openelis-global.org/fhir/CodeSystem/vector-species` | Full V-01 seed taxonomy (~40 entries); dual-coded with SNOMED CT where available |
| Pooling Strategy | `https://openelis-global.org/fhir/CodeSystem/vector-pooling-strategy` | INDIVIDUAL, POOL_FIXED, POOL_VARIABLE |
| Identification Method | `https://openelis-global.org/fhir/CodeSystem/vector-identification-method` | MORPHOLOGICAL, MOLECULAR, BOTH |

---

## 6. OHS ETL Implications

The OHS SQL-on-FHIR engine generates the analytics views by running SQL against HAPI FHIR's internal Postgres tables. Extension values are stored in HAPI as JSON within a `myValueJson` column on the extension table, keyed by URL. The ETL SQL for each view needs a JOIN against the extension table for each custom extension.

Example extraction pattern for `poolSize`:
```sql
-- Extension value extraction in HAPI FHIR JPA schema
LEFT JOIN hfj_res_link ext_pool_size
  ON ext_pool_size.src_resource_id = s.res_id
  AND ext_pool_size.src_path = 'Specimen.extension'
  AND ext_pool_size.target_resource_url =
      'https://openelis-global.org/fhir/StructureDefinition/vector-pool-size'
```

The current FRS OHS view SQL uses column names like `s.pool_size` which implies the ETL abstracts this — verify with Piotr whether the OHS config layer handles this or whether raw HAPI JPA SQL is being used. If raw JPA, all views in §8 of the FRS need the extension JOIN pattern added for each unmapped field.

---

## 7. WHO Vector Surveillance IG Alignment

The WHO SMART Guidelines programme includes a planned Digital Adaptation Kit (DAK) for Vector Surveillance, which will eventually produce a FHIR Implementation Guide. As of early 2025 this was in early development stages.

**Alignment approach for V-04:**

1. Namespace all extensions and CodeSystems under `https://openelis-global.org/fhir/` now. When the WHO IG is published, migration is a namespace swap plus any semantic reconciliation — no data model changes.
2. Use SNOMED CT dual-coding on `Observation.valueCodeableConcept` for species where codes exist (approximately 18 of 40 V-01 seed species).
3. Monitor WHO IG progress. When it reaches ballot, schedule a sprint to align OpenELIS StructureDefinitions with the IG profiles. This is an addendum to V-04, not a blocker.
4. Consider publishing the OpenELIS vector surveillance extensions as a lightweight public IG on `https://openelis-global.org/fhir/` — this costs little effort at definition time and allows other OpenELIS deployments to reuse the profiles.

The V-04 FRS should be updated to add a conformance note: *"Extension definitions SHOULD align with the WHO Vector Surveillance FHIR IG when published. Until that IG is available, this FRS serves as the normative extension definition for OpenELIS vector surveillance FHIR resources."*

---

## 8. Questions for Piotr

The following decisions require architectural input before the V-04 FHIR implementation sprint begins:

1. **OHS ETL implementation:** Is the OHS ETL using the Google OHS `sql-on-fhir` library (which has its own extraction DSL) or raw SQL against the HAPI JPA Postgres schema? This determines whether extension extraction is configured declaratively or written as custom JOINs. The current FRS §8 view SQL assumes direct Postgres access — confirm this is correct.

2. **Trap-nights gap (§3.2):** Which option is preferred — `deployedDateTime` extension (Option A), push computed value directly (Option B), or source from OpenELIS DB in ETL (Option C)?

3. **`Specimen.note` hack (§3.1):** Confirm whether to replace with formal extensions before implementation begins. Changing this post-deployment requires a data migration of existing HAPI Specimen resources.

4. **Lifecycle stage and sex (§3.2, §4.2):** These are V-01/V-03 data points not currently pushed. Should they be added to the Observation push in V-04, or deferred to a future spec?

5. **StructureDefinition publication:** Should OpenELIS formally publish the extension StructureDefinitions as a FHIR IG, or keep them as internal definitions documented in this spec? Publication is low-effort and enables WHO IG alignment later.

6. **SNOMED dual-coding (§5):** Approved as an approach? If yes, a mapping table of V-01 species → SNOMED codes is needed. I can draft this as part of the V-04 implementation notes.

7. **Pool deconvolution chain (§3.5):** Confirmed acceptable to leave individual specimen → pool parent linkage as a known gap for V-04?

---

## 9. Summary of FRS Changes Needed

Once Piotr has reviewed, the V-04 FRS (§6.2 and §7) should be updated to:

- Replace the `Specimen.note` mappings for `specimenCount` and `poolFlag` with formal extension paths (§3.1)
- Add `deployedDateTime`, `trapNights`, `trapGpsLatitude`, `trapGpsLongitude` to the §7.1 mapping table (§3.2, §3.3)
- Add `lifecycleStage`, `sex` to the §7.2 mapping table if approved (§4.2)
- Add `poolSize` extension to the §7.3 DiagnosticReport mapping (§4.3)
- Add a WHO IG alignment conformance note to §7 (§7 above)
- Add extension StructureDefinition URLs to the §8 OHS view SQL for custom fields
- Add a "Known FHIR Limitations" subsection noting pool deconvolution chain gap and aggregated index gap
