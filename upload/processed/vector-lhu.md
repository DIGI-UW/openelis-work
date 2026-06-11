# Vector Laporan Hasil (LHU) — Feature Requirements Specification

**Version:** 2.0
**Date:** 2026-05-26
**Status:** Design Review
**Supersedes:** v1.0
**Scope:** OpenELIS Global, Carbon React printable PDF report for vector surveillance samples
**Related specs:** S-06 Laporan Hasil (base), patient-report-redesign-spec, V-01 Vector Specimen Types Taxonomy, environmental-lhu.md (sibling, ISO 17025 layout patterns)

---

## Changelog — v1.0 → v2.0

This rewrite incorporates the structural review findings from 2026-05-26 covering ISO/IEC 17025:2017 §7.8, WHO vector surveillance indicators (2003 + 2021), PAHO dengue surveillance guidance, and Kemenkes PE/PSN program conventions. P1 + P2 items folded in.

**New report-face content (ISO 17025 §7.8):**
- §8.6 Results-apply-only disclaimer (§7.8.2.1(l))
- §8.7 Decision rule statement (§7.8.6.1 — binary risk classification with documented thresholds)
- §8.8 End-of-report marker (§7.8.2.1(d))
- §8.9 Reproduction restriction notice
- §13.6 Amendment workflow on report face (§7.8.8)

**New WHO/Kemenkes-aligned content:**
- §5C ABJ (Angka Bebas Jentik) — Indonesian national vector-control primary indicator, target ≥ 95% (V-P1-1)
- §5B MLE (Maximum Likelihood Estimation) alongside MIR — preferred per WHO 2021 for pooled samples (V-P1-2)
- §5B / §5C 95% confidence intervals on every rate-based metric (V-P1-3)
- §5D NEW Mode D: Pupal survey — Pupae Per Person Index (PPI) per WHO 2003 / Focks et al. (V-P2-2)
- §7.5 Risk thresholds — configurable per deployment, defaults cited to PAHO 2017 + Kemenkes Permenkes 50/2017 (V-P2-1)
- §10 Hierarchical geographic granularity (province → kota/kabupaten → kecamatan → kelurahan → RT/RW) (V-P2-5)

**New data model fields:**
- VectorSpecimen: `trap_type`, `lure`, `deployment_start`, `deployment_end`, `serotype`, `genotype` (V-P2-3, V-P2-4)
- SurveillanceEvent: `mir_ci_low`, `mir_ci_high`, `mle`, `mle_ci_low`, `mle_ci_high`, `infection_rate_ci_low`, `infection_rate_ci_high` (V-P1-2, V-P1-3)
- LarvalSurvey: `abj`, `hi_ci_low`, `hi_ci_high`, `ci_ci_low`, `ci_ci_high`, `bi_ci_low`, `bi_ci_high`, `pupae_count`, `population_at_risk`, `pupae_per_person_index`, `ppi_ci_low`, `ppi_ci_high`, `survey_method` (V-P1-1, V-P1-3, V-P2-2)
- Order/Report: `amends_lhu_number`, `amendment_number`, `amendment_reason` (cross-cutting)
- GeographicHierarchy entity for hierarchical geo (V-P2-5)
- VectorRiskThreshold entity for deployment-configurable thresholds (V-P2-1)

**New i18n keys** (§17): `resultsApplyOnlyDisclaimer`, `endOfReport`, `decisionRule` and variants, `reproductionRestriction`, `larvaFreeRate`, `larvaFreeRateAbj`, `mle`, `mleCi`, `confidenceInterval95`, `pupaePerPerson`, `pupaeCount`, `populationAtRisk`, `trapType`, `lure`, `deploymentPeriod`, `serotype`, `genotype`, `surveyMethod`, `province`, `kotaKabupaten`, `kecamatan`, `kelurahan`, `riskThresholdHigh`, `riskThresholdModerate`, `riskThresholdLow`, `amendmentNotice`, etc. Full list in §17.

Strong-points kept from v1.0: S-06 inheritance, patient-report-redesign config surface, three-mode design (Species ID / Surveillance Indices / Larval Population) extended to four (adding Mode D Pupal), KAN per-parameter asterisk + `/R` suffix, real BBLKM Jakarta crosswalk data, i18n key separation pattern.

---

## Table of Contents

1. Overview
2. User Stories
2.5 Configuration System Inheritance
3. Inheritance Map: S-06 → Vector LHU
4. Vector-Specific Data Model
5. Result Table Modes (A Species ID / B Surveillance Indices / C Larval Population / D Pupal Survey)
6. Multi-LHU Bundling
7. KAN Accreditation & Report Suffix
7.5 Risk Thresholds (Deployment-Configurable)
8. Page Layout & Print Requirements (incl. ISO 17025 §7.8 report-face blocks)
9. Mode Selection Logic
10. Geographic Granularity (Hierarchical)
11. E-Signature Integration
12. Sample Matrix Variants
13. Edge Cases & Constraints
14. Real-World Data & Synthesis Notes
15. Acceptance Criteria
16. Open Questions
17. i18n Keys (MessageResources additions)

---

## 1. Overview

The **Vector Laporan Hasil (LHU)** is a printable, Carbon-styled result report for vector surveillance samples in the Indonesian public health lab network (Labkesmas/BBLKM). It reports on entomological surveillance activities: mosquito species identification via PCR (including arbovirus serotype/genotype where applicable), pooled infection-rate estimation (MIR + MLE), larval and pupal population surveys, and adult-vector indices.

**Scope**: Extends the S-06 Laporan Hasil baseline. Inherits letterhead, customer block, e-signature integration, page footer, and the v2.0 ISO 17025 report-face blocks (disclaimer, decision rule statement, end-of-report marker, reproduction restriction). Introduces **four** flexible result-table modes:

- **Mode A: Species Identification** (PCR-confirmed mosquito species, with arbovirus serotype/genotype when available)
- **Mode B: Surveillance Indices** (MIR + MLE with 95% CIs, infection rate per 1000, collection density)
- **Mode C: Larval Population** (HI, CI, BI + ABJ + 95% CIs)
- **Mode D: Pupal Survey** (NEW v2.0 — Pupae Per Person Index per WHO 2003)

**Users**: Lab analysts (BBLKM), provincial epidemiologists, district vector control officers (Kemenkes PE/PSN), KAN auditors.

---

## 2. User Stories

### Story 1: Species ID Report (Mode A)
*As a BBLKM analyst, I want to print a report showing PCR-confirmed mosquito species from a trap event, including arbovirus serotype where detected, so that epidemiologists can verify species distribution and arbovirus circulation in the district.*

**Acceptance**: Report shows specimen barcode, trap type + lure + deployment period, collection date/location (down to kelurahan), genus/species, PCR Ct value, target gene, arbovirus serotype (DENV-1/2/3/4 when applicable), genotype where typed, quality flag, analyst signature.

### Story 2: Surveillance Indices Report (Mode B)
*As a provincial epidemiologist, I want to see MIR **and** MLE with 95% confidence intervals per district so that I can assess dengue risk with statistically appropriate uncertainty and evaluate vector control effectiveness.*

**Acceptance**: Report shows MIR (positives/1000) with 95% CI; MLE (maximum likelihood prevalence per 1000) with 95% CI; infection rate per individual organism with 95% CI; collection density (organisms/trap-night); accreditation flags; date range; geographic hierarchy down to the consistent finest level.

### Story 3: Larval Population Report (Mode C)
*As a district vector control officer, I want a report summarizing larval habitat survey counts (house, container, Breteau indices) **with ABJ vs. the national 95% target** and 95% CIs so that I can track seasonal trends and justify control resource allocation per Kemenkes PSN program.*

**Acceptance**: Report shows survey type and method, geographic hierarchy, HI / CI / BI / **ABJ** with 95% CIs each, ABJ-vs-target (≥ 95%) status flag, confidence flag, regional baseline comparison (if configured), analyst/supervisor signatures.

### Story 4: Pupal Survey Report (NEW v2.0 — Mode D)
*As a provincial vector-control program manager, I want a Pupae Per Person Index (PPI) report because WHO 2003+ recommends PPI as a better predictor of transmission risk than HI/CI/BI for Aedes-borne diseases.*

**Acceptance**: Report shows pupae count, population at risk (denominator), PPI with 95% CI, transmission-threshold flag (configurable per setting), and adjacency to corresponding HI/CI/BI from the same survey when available.

### Story 5: KAN Auditor (NEW v2.0)
*As a KAN auditor, I want to verify that the Vector LHU complies with ISO/IEC 17025:2017 §7.8 — disclaimer, decision rule, end-of-report marker, accreditation coverage, amendment trail — even though most surveillance metrics fall outside testing-accreditation scope.*

**Acceptance**: The report includes the §7.8.2.1(l) disclaimer, decision-rule statement (the binary risk classification with documented thresholds), end-of-report marker, accreditation-coverage footnote (PCR rows in Mode A/B accredited; field-surveillance rows in Mode C/D explicitly noted as non-accredited surveillance activity), and amendment notice when applicable.

---

## 2.5 Configuration System Inheritance

The Vector LHU reuses the **patient-report-redesign configuration surface**—it does **not** introduce parallel keys. Inherits these JRXML parameters:

- **`headerName`** — subreport selector
- **`accreditationImage`** — accreditation logo image
- **`accreditationNumber`** — accreditation registry number
- **`accreditationLogoPosition`** — TOP / BOTTOM enum

**New in v2.0 — additional Print Report Configuration entries** (same admin page, no new namespace):

- **`decisionRule`** (String enum, default `BINARY_ACCEPTANCE`) — controls the decision-rule statement printed on every LHU. For Vector LHU, the rule applies to *risk classification* (e.g., "MIR > 100 = High Risk") rather than chemical Baku Mutu — but the statement is required either way.
- **`reproductionRestriction`** (Boolean, default `true`)
- **`endOfReportMarker`** (Boolean, default `true`)
- **`vectorRiskThresholdProfile`** (String, references VectorRiskThreshold deployment record) — controls which threshold profile is used for risk classification (default: Kemenkes PSN profile for Indonesia).

These are configured globally in **Admin → General Configuration → Printed Reports Configuration**.

---

## 3. Inheritance Map: S-06 → Vector LHU

| Section | Status | Notes |
|---------|--------|-------|
| Lab Letterhead | Inherited from patient-report spec §7.1 / §7.1b | 3-column grid header band |
| Report Number | Modified | Format: `LHU-NNN.EN.XXX/SN/YYYY` where EN = Entomological, XXX = district code; `/R` if all accredited; `/Am.N` if amended |
| Customer/Yth Block | Inherited as-is | Provincial health office or epidemiological unit |
| Report Header Info | Modified | Adds Vector Type, Surveillance Objective, Date Range, **Geographic Hierarchy** (NEW v2.0) |
| Sample Info Block | Modified | Maps to vector specimen fields; **adds trap_type, lure, deployment_period (Mode A/B), survey_method (Mode C/D)** |
| Result Tables | New | Four modes: A (Species ID), B (Surveillance Indices), C (Larval Population), **D (Pupal Survey)** |
| Standards/References | Modified | Vector-specific: PCR assay SOP, WHO entomological surveillance protocol, Kemenkes PSN, Permenkes 50/2017 |
| Accreditation logo slot (top + bottom) | Inherited | Position-configurable |
| Admin config | Inherited from patient-report spec §15.6 | Extends with `decisionRule`, `reproductionRestriction`, `endOfReportMarker`, `vectorRiskThresholdProfile` |
| **Decision Rule Statement (NEW v2.0)** | New | Binary risk classification with documented thresholds, §7.8.6.1 compliance |
| **Results-Apply-Only Disclaimer (NEW v2.0)** | New | §7.8.2.1(l) |
| **Risk Threshold Reference Block (NEW v2.0)** | New | Cites the source of risk thresholds (PAHO / Kemenkes / WHO) |
| Compliance Conclusion | Inherited as-is | KAN accreditation statement + `/R` suffix logic |
| E-Signature Block | Inherited as-is | electronic_signature table + timestamp |
| **Reproduction Restriction (NEW v2.0)** | New | Pre-footer line |
| Page Footer | Inherited from patient-report spec §7.8 | "Halaman X dari Y" + QR code (optional) |
| **End-of-Report Marker (NEW v2.0)** | New | §7.8.2.1(d) terminal block |
| **Amendment Notice (NEW v2.0)** | New | §7.8.8 — renders when Vector LHU amends a prior report |

---

## 4. Vector-Specific Data Model

### VectorSpecimen Entity (extended in v2.0)
```
VectorSpecimen
  - specimen_id (PK)
  - collection_lot_id (FK)
  - genus [Aedes | Anopheles | Culex | Mansonia | ...]
  - species (e.g., aegypti, albopictus, subpictus)
  - lifecycle_stage [EGG | LARVA | PUPA | NYMPH | ADULT | ENGORGED_ADULT]
  - sex [MALE | FEMALE | MIXED | UNKNOWN]
  - condition [VIABLE | DEAD | DAMAGED]
  - pool_number (X-Y notation: LABNO.X-Y)
  - count
  - pcr_ct_value
  - pcr_target (gene_name: e.g., dengue NS5, malaria 18S)
  - infection_status [POSITIVE | NEGATIVE | INDETERMINATE]
  - quality_flag [PASSED | FAILED | BORDERLINE]
  - trap_type [BG_SENTINEL | CDC_BOTTLE | GRAVID | OVITRAP | LIGHT_TRAP | HUMAN_LANDING_CATCH | DIPPER | PIPETTE | OTHER]   ← NEW v2.0
  - lure [BG_LURE | CO2 | OCTENOL | NONE | OTHER]                                                                              ← NEW v2.0
  - deployment_start (DATETIME)                                                                                                  ← NEW v2.0
  - deployment_end (DATETIME)                                                                                                    ← NEW v2.0
  - serotype (Text; e.g., DENV-1, DENV-2, CHIKV, ZIKV, JEV — null when not typed)                                              ← NEW v2.0
  - genotype (Text; sublineage/lineage when typed — null when not typed)                                                       ← NEW v2.0
  - storage_temperature_c (DECIMAL; chain-of-custody record)                                                                    ← NEW v2.0
```

### SurveillanceEvent (extended in v2.0)
```
SurveillanceEvent
  - event_id (PK)
  - collection_lot_id (FK)
  - genus / species filter
  - geographic_hierarchy_id (FK)                                                                                                ← NEW v2.0
  - date_range_start, date_range_end
  - total_pools_tested
  - positive_pools
  - mir (positives / total_pools_tested × 1000)
  - mir_ci_low, mir_ci_high (Wilson 95% CI on mir/1000 proportion, then scaled)                                                 ← NEW v2.0
  - mle (Maximum Likelihood Estimation, prevalence per 1000)                                                                    ← NEW v2.0
  - mle_ci_low, mle_ci_high (likelihood-based 95% CI)                                                                           ← NEW v2.0
  - infection_rate_per_1000 (deconvoluted individual estimate)
  - infection_rate_ci_low, infection_rate_ci_high                                                                               ← NEW v2.0
  - collection_density (organisms / trap-night)
  - positive_resolution_pct (legacy v1.0 field; deprecated in favor of MLE CI — retain for backward compat)
```

### LarvalSurvey (extended in v2.0)
```
LarvalSurvey
  - survey_id (PK)
  - survey_type [HOUSE | CONTAINER | BREEDING_SITE]
  - survey_method [VISUAL_INSPECTION | DIPPER | PIPETTE | LIGHT_TRAP_LARVAL]                                                   ← NEW v2.0
  - geographic_hierarchy_id (FK)                                                                                                ← NEW v2.0
  - houses_examined, houses_positive
  - house_index = (houses_positive / houses_examined) × 100
  - hi_ci_low, hi_ci_high (Wilson 95% CI)                                                                                       ← NEW v2.0
  - abj = (1 − house_index/100) × 100  [Angka Bebas Jentik; computed]                                                          ← NEW v2.0
  - abj_target (DECIMAL, default 95.0; from VectorRiskThreshold profile)                                                       ← NEW v2.0
  - containers_examined, containers_positive
  - container_index, ci_ci_low, ci_ci_high                                                                                      ← NEW v2.0
  - breteau_index, bi_ci_low, bi_ci_high                                                                                        ← NEW v2.0
  - collection_date, location_name, analyst_id
```

### PupalSurvey (NEW v2.0)
```
PupalSurvey
  - survey_id (PK)
  - collection_lot_id (FK)
  - geographic_hierarchy_id (FK)
  - pupae_count (count of pupae found)
  - population_at_risk (denominator: persons living in surveyed area)
  - pupae_per_person_index = pupae_count / population_at_risk
  - ppi_ci_low, ppi_ci_high
  - survey_date
  - linked_larval_survey_id (FK; nullable — when paired with a LarvalSurvey)
```

### GeographicHierarchy (NEW v2.0)
```
GeographicHierarchy
  - id (PK)
  - province (Text)
  - kota_or_kabupaten (Text)
  - kecamatan (Text)
  - kelurahan (Text)
  - rw (Text; nullable)
  - rt (Text; nullable)
  - finest_level [PROVINCE | KOTA | KECAMATAN | KELURAHAN | RW | RT]  ← used for rendering "the consistent finest level"
```

### VectorRiskThreshold (NEW v2.0)
```
VectorRiskThreshold (deployment-configurable)
  - profile_id (PK; e.g., "kemenkes-psn-default-2026")
  - profile_name (Text)
  - profile_source (Text; citation — e.g., "PAHO 2017 Manual for Indicators in Dengue Surveillance" or "Kemenkes Permenkes 50/2017")
  - mir_high_threshold, mir_moderate_threshold (DECIMAL)
  - hi_threshold, ci_threshold, bi_threshold (DECIMAL)
  - abj_target (DECIMAL; Indonesia default 95.0)
  - ppi_transmission_threshold (DECIMAL; Focks et al. epidemiological threshold)
  - effective_date (DATE)
```

### Order (extended in v2.0 — common with env LHU)
- `amends_lhu_number` : TEXT
- `amendment_number` : INTEGER
- `amendment_reason` : TEXT

---

## 5. Result Table Modes

### Mode A: Species Identification (PCR + Serotype)

**When**: Specimen-level molecular typing; confirms species and (where applicable) arbovirus serotype/genotype from trap samples.

**Sample Info Block (Mode A specific):**
- Trap type, lure (if any), deployment period (start–end), GPS coordinates of trap location

**Columns**:

| Kode Barcode | Tanggal Koleksi | Lokasi (Kelurahan) | Genus | Spesies | Target PCR | Ct Value | Serotype | Status | Ket. |
|---|---|---|---|---|---|---|---|---|---|
| 500133 | 2026-01-15 | Kel. Mampang | *Aedes* | *aegypti* * | dengue NS5 | 18.5 | DENV-2 | Positif | – |
| 500134 | 2026-01-15 | Kel. Mampang | *Aedes* | *aegypti* * | dengue NS5 | 31.2 | DENV-2 | Positif (borderline) | # |
| 500135 | 2026-01-15 | Kel. Mampang | *Aedes* | *albopictus* * | dengue NS5 | Indetermin | — | Negatif | – |

**Notes**:
- Ct < 30 = reliable; 30–37 = borderline (Ket. `#`); > 37 = negative.
- Serotype column shows specific DENV-1/2/3/4 (or CHIKV, ZIKV, JEV) when PCR uses a typing assay; "—" when only pan-dengue NS5 used.
- Genotype shown in footnote when typed (not column to conserve width).
- Parameter-level asterisk (`*`) on accredited species/PCR.

**§6.4-style footnote (one per Mode A table):**

> **Metode / Methods.** Identifikasi spesies: PCR primer-spesifik (real-time TaqMan). Serotipe dengue: typing assay multiplex (DENV-1/2/3/4). Genotipe: Sanger sequencing E gene (jika ditipekan).
>
> **Akreditasi / Accreditation coverage.** Identifikasi spesies dan PCR typing dalam ruang lingkup akreditasi KAN ISO/IEC 17025 — LP-XXX-IDN.
>
> **Penjebakan / Trap details.** [trap_type], lure: [lure]; periode: [deployment_start] s.d. [deployment_end].
>
> **Rantai dingin / Cold chain.** Spesimen disimpan pada [storage_temperature_c]°C sejak koleksi hingga ekstraksi.

---

### Mode B: Surveillance Indices (Entomological Risk)

**When**: Aggregate risk assessment across multiple trap/pool events; supports epidemiological decision-making.

**Header Block:**

| Tujuan Surveilans | Tanggal Mulai | Tanggal Selesai | Genus | Spesies | Cakupan Geografis (finest consistent level) |
|---|---|---|---|---|---|
| Surveilans Endemis Dengue | 2026-01-01 | 2026-03-31 | *Aedes* | *aegypti* | Kec. Tebet, Kota Jakarta Selatan |

**Metrics Table:**

| Metric | Nilai / Value | 95% CI | Satuan / Unit | Interpretasi (per profile) |
|---|---|---|---|---|
| Total Pools Diuji | 157 | — | pools | — |
| Pools Positif | 23 | — | pools | — |
| MIR (point estimate, biased per WHO 2021) | 146.5 | [98, 213] | per 1000 | Risiko Tinggi (>100) — see §7.5 |
| **MLE (Maximum Likelihood Estimation)** ← NEW v2.0 | 161.2 | [106, 235] | per 1000 | Estimasi tak-bias preferensi WHO 2021 |
| Infection Rate / Individu | 8.7 | [5.7, 12.6] | per 1000 organism | — |
| Kepadatan Koleksi | 12.3 | — | organism/trap-night | Tinggi |

**Notes (NEW v2.0):**
- MLE is the preferred estimator per WHO 2021 Operational Manual on Aedes Surveillance. MIR is retained for backward compatibility with historical Kemenkes records and because MIR is more interpretable for the operational reader; MLE is statistically appropriate when prevalence is non-trivial. Both are reported with 95% CIs.
- 95% CIs on MIR/infection-rate use Wilson interval on the proportion, then scaled to the per-1000 metric. MLE CI is from the likelihood profile.
- Risk thresholds (`MIR > 100 = High`) reference the configured `vectorRiskThresholdProfile` and are cited explicitly in the footnote.

**§6.4 footnote (Mode B):**

> **Metode / Methods.** Pool deconvolution + multiplex RT-PCR per protokol BBLKM. MIR dihitung sebagai (positif/total)×1000; MLE dihitung dengan PoolInfR (Biggerstaff 2006). Interval kepercayaan 95% (Wilson untuk MIR, profile likelihood untuk MLE).
>
> **Akreditasi / Accreditation coverage.** Pengujian PCR dalam ruang lingkup KAN ISO/IEC 17025 — LP-XXX-IDN. Estimasi MIR/MLE adalah perhitungan epidemiologis dan bukan kegiatan terakreditasi.
>
> **Ambang risiko / Risk thresholds.** Profil: [vectorRiskThresholdProfile]. Sumber: [profile_source citation]. MIR > [mir_high]/1000 = Risiko Tinggi; [mir_moderate]–[mir_high]/1000 = Moderat; < [mir_moderate]/1000 = Rendah.

---

### Mode C: Larval Population (Habitat Index + ABJ)

**When**: House-to-house larval surveys; tracks seasonal trends, breeding site density, and Kemenkes PSN program performance.

**Header Block:**

| Tipe Survei | Metode Survei | Cakupan Geografis | Tanggal Survei |
|---|---|---|---|
| Survei Jentik Rutin | Inspeksi visual + dipper | Kel. Tebet Barat, Kec. Tebet | 2026-03-12 |

**Metrics Table (NEW v2.0 — ABJ column added, 95% CIs added):**

| Metric | Nilai | 95% CI | Target / Threshold | Status |
|---|---|---|---|---|
| Rumah Diperiksa | 450 | — | — | — |
| Rumah Positif | 92 | — | — | — |
| **HI (House Index)** | 20.4% | [16.8, 24.5] | < 5% (PAHO 2017) | ✗ |
| **ABJ (Angka Bebas Jentik)** ← NEW v2.0 | 79.6% | [75.5, 83.2] | ≥ 95% (Kemenkes target nasional) | ✗ |
| Kontainer Diperiksa | 1280 | — | — | — |
| Kontainer Positif | 156 | — | — | — |
| **CI (Container Index)** | 12.2% | [10.5, 14.1] | < 5% (PAHO 2017) | ✗ |
| **BI (Breteau Index)** | 34.7% | [29.0, 41.3] | < 5 per 100 (PAHO transmission threshold) | ✗ |

**Field Definitions:**

- **HI** = (houses_positive / houses_examined) × 100. PAHO 2017 transmission threshold: < 5%. Historical PAHO Aedes-aegypti eradication target: < 1%.
- **ABJ** (Angka Bebas Jentik / Larva-Free Rate) = (1 − HI/100) × 100. Kemenkes national target: ≥ 95%. ABJ is the **primary** Indonesian operational metric for PSN-3M+ program performance per Permenkes 50/2017. Every PE (Pemeriksaan Epidemiologi) and PSN report is judged against this target.
- **CI** = (containers_positive / containers_examined) × 100. PAHO 2017 transmission threshold: < 5%.
- **BI** = (containers_positive / houses_examined) × 100. PAHO 2017 transmission threshold: < 5 (one of the more sensitive indicators).

**§6.4 footnote (Mode C):**

> **Metode / Methods.** Survei jentik rumah-ke-rumah; metode: [survey_method] (inspeksi visual + dipper untuk kontainer berair); per WHO 2003 *Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control*. Interval kepercayaan 95% Wilson untuk proporsi binomial (HI, CI). BI dihitung dengan CI eksak Clopper-Pearson.
>
> **Akreditasi / Accreditation coverage.** Survei jentik adalah kegiatan surveilans lapangan, **bukan kegiatan pengujian terakreditasi**. KAN ISO/IEC 17025 tidak berlaku untuk indeks habitat.
>
> **Ambang risiko / Risk thresholds.** Profil: [vectorRiskThresholdProfile]. ABJ ≥ [abj_target]% = memenuhi target nasional; < [abj_target]% = perlu intervensi PSN. HI/CI/BI < [threshold]% per PAHO 2017.
>
> **Standar / Standards.** Permenkes RI No. 50 Tahun 2017 tentang Standar Baku Mutu Kesehatan Lingkungan dan Persyaratan Kesehatan untuk Vektor dan Binatang Pembawa Penyakit; PAHO 2017 *Manual for Indicators in Dengue Surveillance*.

---

### Mode D: Pupal Survey — Pupae Per Person Index (PPI) (NEW v2.0)

**When**: Pupal demographic surveys; WHO 2003+ and Focks et al. recommend PPI as a better predictor of transmission risk than HI/CI/BI for *Aedes*-borne diseases. Use when the lab has run a pupal count alongside or instead of a larval survey.

**Header Block:**

| Cakupan Geografis | Populasi Berisiko | Tanggal Survei | Survei Jentik Terkait |
|---|---|---|---|
| Kel. Tebet Barat, Kec. Tebet | 1,847 jiwa | 2026-03-12 | LarvalSurvey #2026-031 |

**Metrics Table:**

| Metric | Nilai | 95% CI | Ambang Transmisi | Status |
|---|---|---|---|---|
| Jumlah Pupa | 142 | — | — | — |
| Populasi Berisiko | 1,847 | — | — | — |
| **PPI (Pupae Per Person)** | 0.077 | [0.065, 0.090] | [profile-configured; Focks et al. 0.5–1.5 range] | ✓ — di bawah ambang transmisi |

**Notes:**
- Population at risk should be sourced from BPS census data for the surveyed kelurahan/RW.
- Transmission threshold is setting-specific (depends on vector capacity, herd immunity, temperature, vector competence); the FRS does **not** publish a universal threshold. Defaults in `vectorRiskThresholdProfile` per Focks et al. 2000 (0.5–1.5 pupae per person as the indicative threshold range for dengue endemic transmission).
- Where Mode D is paired with Mode C (same survey event), the report shows both tables in sequence and the §6.4 footnote calls out that PPI is the WHO-preferred predictor.

**§6.4 footnote (Mode D):**

> **Metode / Methods.** Survei pupa rumah-ke-rumah; pencacahan langsung pupa pada kontainer berair; per WHO 2003 dan Focks et al. 2000 *Transmission thresholds for dengue in terms of Aedes aegypti pupae per person*.
>
> **Akreditasi / Accreditation coverage.** Survei pupa adalah kegiatan surveilans lapangan, **bukan kegiatan pengujian terakreditasi**.
>
> **Ambang transmisi / Transmission threshold.** Profil: [vectorRiskThresholdProfile.ppi_transmission_threshold]. Sumber: Focks et al. 2000. Ambang spesifik untuk pengaturan (vector capacity, suhu, herd immunity).

---

## 6. Multi-LHU Bundling

A single Vector LHU report may bundle two sequential LHU numbers (e.g., covering multiple trapping events or survey rounds merged for epidemiological review):

```
Nomor Laporan: 201-220.EN.JKT/SN/2026 dan 221-240.EN.JKT/SN/2026
Periode: 2026-01-01 s.d. 2026-03-31
Cakupan Geografis (finest consistent level): Kec. Tebet, Kota Jakarta Selatan
```

When bundled:
- Show both numbers in report header.
- Use single result table (data already aggregated by upstream backend) OR one table per mode if multiple modes apply.
- Compliance conclusion applies to entire bundle.
- Single signature block.
- Single ISO 17025 §7.8 report-face block (disclaimer, decision rule, end-of-report marker, reproduction restriction) — does not repeat per LHU.

---

## 7. KAN Accreditation & Report Suffix

### 7.1 Paper-conservation note (retained from v1.0)

The wide method/Metode column is removed from result tables and consolidated into the §6.4-style footnote. Per-parameter accreditation shown as asterisk on parameter name (Mode A/B); issuing body + scope number in the footnote.

**Surveillance vs. testing accreditation (clarified in v2.0):**
- Mode A (PCR species ID) and Mode B (PCR-derived MIR/MLE) **are** testing-accredited activities under ISO 17025 — KAN flags apply.
- Mode C (larval surveys) and Mode D (pupal surveys) are **surveillance** activities. The lab can be accredited for these under different standards (ISO 17020 for inspection, or surveillance-specific KAN schemes), but **not** under ISO 17025 testing accreditation. The Vector LHU explicitly states this in the §6.4 footnote of each table.

### 7.2 Per-Parameter Asterisk (`*`)

In Parameter cells (Mode A/B): `*` after species/PCR-target denotes accredited.
In Mode C/D: asterisks are **not** used; the footnote explicitly notes surveillance activity is outside ISO 17025 testing scope.

### 7.3 Report-Level `/R` Suffix

If **all** testing-accredited parameters in the report are accredited (Mode A/B rows; Mode C/D rows are excluded from this calculation):
```
Nomor Laporan: 201-220.EN.JKT/SN/2026/R
```
Otherwise omit `/R`; rely on per-parameter asterisks.

### 7.4 Amendment Suffix `/Am.N` (NEW v2.0)

When the LHU amends a prior one, the suffix is `/Am.N` (appended after `/R` if present). Example: `201-220.EN.JKT/SN/2026/R/Am.1`.

---

## 7.5 Risk Thresholds (Deployment-Configurable — NEW v2.0)

Risk classification thresholds are **deployment-configurable** via the `VectorRiskThreshold` profile, with the active profile selected by `vectorRiskThresholdProfile` in Print Report Config. The **default profile for Indonesia** is `kemenkes-psn-default-2026`:

| Threshold | Default value | Source |
|---|---|---|
| `mir_high_threshold` | 100 per 1000 | Kemenkes operational guidance (BBLKM Jakarta convention) — locally validated, not WHO universal |
| `mir_moderate_threshold` | 50 per 1000 | Same |
| `hi_threshold` | 5% | PAHO 2017 *Manual for Indicators in Dengue Surveillance* (transmission threshold) |
| `ci_threshold` | 5% | PAHO 2017 (same) |
| `bi_threshold` | 5 per 100 | PAHO 2017 (transmission threshold) |
| `abj_target` | 95% | Kemenkes Permenkes 50/2017 + national PSN program |
| `ppi_transmission_threshold` | 0.5 (lower bound of Focks range) | Focks et al. 2000 |

Each threshold's source is rendered in the §6.4 footnote of the relevant table so the reader knows the citation. The FRS does **not** publish a universal MIR threshold — it explicitly notes that the `mir_high_threshold` is operational, locally-validated, and not a WHO-universal value.

Profiles can be defined per deployment for non-Indonesia uses or for different vector species/diseases.

---

## 8. Page Layout & Print Requirements

### 8.1 A4 Portrait Dimensions

- Container: 794 × 1123 px (100% of A4 at 96 DPI).
- Margins: 20 mm top/bottom, 15 mm left/right.
- Font: IBM Plex Sans (Carbon default), 11pt body, 14pt headings.
- Line height: 1.5.

### 8.2 Page Structure (with NEW v2.0 ISO 17025 blocks)

```
┌─ Header Block — inherited patient-report §7.1 ─────────────┐
│ [Lab Logo]  [KAN Logo if TOP]  [Facility Name/Meta]  ...   │
├────────────────────────────────────────────────────────────┤
│ LAPORAN HASIL SURVEILANS VEKTOR / VECTOR SURVEILLANCE REPORT│
│ No. [201-220.EN.JKT/SN/2026 / /R / /Am.N as applicable]    │
│ Tanggal Penerbitan: [Date]                                 │
├────────────────────────────────────────────────────────────┤
│ [Amendment Notice if applicable — §13.6]                   │
├────────────────────────────────────────────────────────────┤
│ Yth. [Customer Name / Provincial Health Office]            │
├────────────────────────────────────────────────────────────┤
│ INFORMASI SURVEILANS / SURVEILLANCE INFORMATION            │
│ Tujuan: [objective]                                        │
│ Periode: [start] s.d. [end]                                │
│ Cakupan Geografis: Province → Kota → Kec → Kel (as configured)│
│ [Mode A: trap_type, lure, deployment_period, storage temp] │
│ [Mode C/D: survey_method, population_at_risk]              │
├────────────────────────────────────────────────────────────┤
│ HASIL SURVEILANS / SURVEILLANCE RESULTS                    │
│ [Mode A, B, C, and/or D tables — see §5]                   │
│ [§6.4 footnote per table]                                  │
├────────────────────────────────────────────────────────────┤
│ AMBANG RISIKO / RISK THRESHOLDS                            │
│ [Threshold profile cited; source per §7.5]                 │
├────────────────────────────────────────────────────────────┤
│ ATURAN KEPUTUSAN / DECISION RULE                           │
│ [§8.7 — binary risk classification]                        │
├────────────────────────────────────────────────────────────┤
│ KESIMPULAN / CONCLUSION                                    │
│ [Bilingual statement of risk level + recommendation]       │
├────────────────────────────────────────────────────────────┤
│ TANDA TANGAN / SIGNATURES                                  │
│ Diuji oleh / Tested by:    Disahkan oleh / Approved:       │
│ [Analyst]                  [Supervisor]                     │
│ [Timestamp]                [Timestamp]                      │
├────────────────────────────────────────────────────────────┤
│ Hasil pengujian ini hanya berlaku untuk contoh yang diuji  │
│ Test results apply only to the items tested                │
├────────────────────────────────────────────────────────────┤
│ Dilarang menggandakan sebagian dari LHU ini tanpa izin     │
│ tertulis dari Laboratorium                                 │
├────────────────────────────────────────────────────────────┤
│ Ditandatangani secara elektronik / Electronically signed   │
│ Halaman [X] dari [Y]                                       │
├────────────────────────────────────────────────────────────┤
│ ─── AKHIR LAPORAN / END OF REPORT ───                      │
└────────────────────────────────────────────────────────────┘
```

### 8.3 Page Breaks

- Hard page break after each mode's result table when multi-mode bundling
- Soft break: conclusion + signature + disclaimer + repro restriction + end-marker stay together on final page; if not, repaginate so ALL move to next page
- No orphan splitting of the disclaimer / restriction / end-marker block

### 8.4 Print CSS

```css
@media print {
  body { margin: 0; }
  .page-break { page-break-after: always; }
  .no-print { display: none; }
  .signature-block { margin-top: 2rem; }
  .iso-footer-block { page-break-inside: avoid; }
}
```

### 8.6 Results-Apply-Only Disclaimer (NEW v2.0)

Renders immediately above the reproduction restriction. Required by ISO/IEC 17025:2017 §7.8.2.1(l). Fixed text:

- **Indonesian:** *Hasil pengujian ini hanya berlaku untuk contoh yang diuji.*
- **English:** *Test results apply only to the items tested.*

i18n key: `resultsApplyOnlyDisclaimer`.

Note: For Vector LHU, this disclaimer applies to PCR-based Mode A/B results (testing). For Mode C/D surveillance, the disclaimer's spirit is captured by the §6.4 footnote noting "kegiatan surveilans, bukan kegiatan pengujian terakreditasi." Both render — the disclaimer is universal across LHUs.

### 8.7 Decision Rule Statement (NEW v2.0)

Renders between the Risk Thresholds block and the Conclusion. Text per the `decision_rule` enum from Print Report Config:

| Enum value | Indonesian text | English text |
|---|---|---|
| `BINARY_ACCEPTANCE` (default) | Aturan keputusan: klasifikasi risiko ditetapkan dengan membandingkan nilai indeks (point estimate) terhadap ambang yang dideklarasikan; interval kepercayaan dilaporkan untuk transparansi tetapi tidak digunakan dalam klasifikasi. | Decision rule: risk classification is based on comparing the point estimate of each index to the declared threshold; confidence intervals are reported for transparency but not used in the classification. |
| `GUARD_BANDED` | Aturan keputusan: klasifikasi risiko dinaikkan jika batas atas interval kepercayaan 95% melebihi ambang. | Decision rule: risk classification is escalated when the upper 95% CI bound exceeds the threshold. |
| `SHARED_RISK` | Aturan keputusan: aturan khusus pelanggan per ILAC-G8 §4.3. | Decision rule: customer-specified per ILAC-G8 §4.3. |

i18n keys: `decisionRule`, `decisionRuleBinaryAcceptance`, `decisionRuleGuardBanded`, `decisionRuleSharedRisk`.

### 8.8 End-of-Report Marker (NEW v2.0)

Renders as the terminal block. Required by ISO/IEC 17025:2017 §7.8.2.1(d):

```
─── AKHIR LAPORAN / END OF REPORT ───
```

Controlled by `printedReport.endOfReportMarker` (default `true`). i18n key: `endOfReport`.

### 8.9 Reproduction Restriction (NEW v2.0)

Renders below the disclaimer when `printedReport.reproductionRestriction = true`. Fixed text:

- **Indonesian:** *Dilarang menggandakan sebagian dari LHU ini tanpa izin tertulis dari Laboratorium.*
- **English:** *No part of this report may be reproduced without the written consent of the Laboratory.*

i18n key: `reproductionRestriction`.

---

## 9. Mode Selection Logic

**Backend-Driven**: OpenELIS application determines which mode(s) to render based on:
1. **Sample data presence**: If PCR Ct values present → Mode A.
2. **Aggregate metrics present**: If MIR/MLE/infection_rate fields → Mode B.
3. **Larval survey data present**: If HI/CI/BI fields → Mode C.
4. **Pupal survey data present (NEW v2.0)**: If `pupae_count` + `population_at_risk` fields → Mode D.

**Frontend**: VectorLHU component receives `modes` array (e.g., `["A", "B"]` or `["C", "D"]`) and result data; renders appropriate tables in sequence.

When multiple modes apply (e.g., a comprehensive surveillance report covering both PCR ID and larval/pupal indices), tables render in mode-letter order (A → B → C → D) with hard page breaks between.

---

## 10. Geographic Granularity (Hierarchical — NEW v2.0)

Surveillance data is tied to a hierarchical geographic location via `GeographicHierarchy`. The hierarchy follows Indonesian administrative divisions:

```
Province → Kota/Kabupaten → Kecamatan → Kelurahan → RW → RT
```

**Rendering rule:** the report header shows the **finest level that is consistent across all rows in the table**. Examples:

- All Mode A rows from Kel. Mampang → "Cakupan Geografis: Kel. Mampang, Kec. Mampang, Kota Jakarta Selatan"
- Mode B aggregating multiple kelurahan in one kecamatan → "Cakupan Geografis: Kec. Tebet, Kota Jakarta Selatan"
- Mode B aggregating multiple kecamatan in one kota → "Cakupan Geografis: Kota Jakarta Selatan"

**Per-row geographic display:** Mode A's Lokasi column shows the kelurahan (or finer if needed). Mode B/C/D headers show the consistent aggregate level only.

This addresses the v1.0 issue where "Jakarta Barat" (city of ~2.5M) was used as the sole geographic descriptor — too coarse to drive operational vector control.

---

## 11. E-Signature Integration

Uses existing OpenELIS `electronic_signature` table. Vector LHU includes:
- **Analyst** (Lab analyst who performed testing/analysis)
- **Supervisor** (Lab supervisor or QA lead)
- **Timestamp** (ISO 8601, with timezone)

Signature block layout inherited from S-06.

---

## 12. Sample Matrix Variants

Vector LHU supports three collection substrate types:

| Matrix Type | Example Specimen | Mode(s) | Notes |
|---|---|---|---|
| Trap Sample (adult) | Ovitrap, BG-Sentinel, CDC bottle, gravid trap, light trap, HLC | A, B | PCR ID and surveillance indices |
| Larval Sample | House breeding site (visual + dipper) | C | Larval population indices |
| Pupal Sample | House survey pupal count | D (NEW v2.0) | Pupae per person index |
| Pool Sample | Deconvoluted pool | A, B | Multi-organism pools for MIR/MLE |

---

## 13. Edge Cases & Constraints

### 13.1 Missing Ct Value
Show as "Indetermin" in Mode A; quality_flag = FAILED. Status = Negatif.

### 13.2 Zero Positive Pools
MIR = 0/1000; MLE = 0/1000. **95% CI upper bound** for 0/N is critical here — testing 10 pools and finding zero positives only rules out MIR > ~37/1000 (one-sided 95% Wilson). FRS now requires CI upper-bound reporting in §6.4 footnote (NEW v2.0). Interpretasi rendered as "Tidak terdeteksi sirkulasi virus dalam sampel yang diuji; namun batas atas CI 95% = X per 1000."

### 13.3 Single-Specimen Mode B
If only one pool tested: MIR = 1000 if positive, 0 if negative; flag with note "Interpretasi terbatas pada sampel tunggal — di bawah ambang minimum sampel (n ≥ 30 pools per WHO 2021)" — see §13.7.

### 13.4 Mixed-Sex Pool
lifecycle_stage = MIXED; sex = MIXED; do not attempt to disambiguate.

### 13.5 Damaged Specimen
condition = DAMAGED; include in count but note in Keterangan "Spesimen rusak."

### 13.6 Amendment to Prior Vector LHU (NEW v2.0)

When this LHU amends a prior one:
- Report number: original `201-220.EN.JKT/SN/2026/R` becomes `201-220.EN.JKT/SN/2026/R/Am.1`
- Amendment notice block renders below the report number (same pattern as env LHU §5.1.5):
  ```
  ┌──────────────────────────────────────────────┐
  │ AMANDEMEN No. [N] — Menggantikan / Supersedes:│
  │ [Original LHU number]                         │
  │ Alasan / Reason: [amendment reason]           │
  └──────────────────────────────────────────────┘
  ```
- Original report marked `superseded_by`; both retained.

### 13.7 Minimum Sample Size (NEW v2.0)

WHO 2021 suggests minimum sample sizes for routine surveillance:
- Mode B (pooled MIR/MLE): ≥ 30 pools recommended
- Mode C (larval survey): ≥ 100 houses recommended
- Mode D (pupal survey): ≥ 100 houses or representative cluster recommended

When sample size is below the threshold, the §6.4 footnote renders a "Peringatan ukuran sampel / Sample size warning" line stating that interpretation is limited.

### 13.8 Insecticide Resistance Results (DEFERRED — see Open Question §16.4)

Adult-vector insecticide-resistance assays (WHO tube test, CDC bottle bioassay) are not implemented in v2.0. When the lab needs to report resistance, a Mode E will be added in a future v2.1 — flagged as Open Question §16.4.

---

## 14. Real-World Data & Synthesis Notes

**Real LHU**: Aedes aegypti PCR report from BBLKM Jakarta (Jan 2026, Kelurahan Mampang) used for Mode A. Real specimen barcodes (500133-500135 series) retained.

**Synthesized Data:**
- **Mode B**: 23/157 positive pools across Jan–Mar 2026 Kec. Tebet aggregation (plausible for Jakarta dengue surveillance season). 95% CIs computed via Wilson interval.
- **Mode C**: 92/450 houses positive; HI=20.4%, ABJ=79.6%, CI=12.2%, BI=34.7%. Plausible for Jakarta urban environment in dengue season.
- **Mode D (NEW v2.0)**: 142 pupae / 1,847 people population; PPI=0.077. Plausible for moderate-density Jakarta kelurahan.

All synthesized modes marked clearly in mockup and preview.

---

## 15. Acceptance Criteria

### Functional (inherited + extended)

- [ ] **AC01**: Mode A renders correctly for PCR species ID with serotype/genotype when typed
- [ ] **AC02**: Mode B renders MIR + MLE + 95% CIs correctly; CIs computed via Wilson (proportions) and likelihood profile (MLE)
- [ ] **AC03**: Mode C renders HI/CI/BI + ABJ + 95% CIs; ABJ-vs-95%-target status flag renders correctly
- [ ] **AC04**: Mode D (NEW v2.0) renders PPI with 95% CI and transmission threshold flag
- [ ] **AC05**: Multi-mode bundling: a single LHU can render Mode A + B (PCR + indices) or Mode C + D (larval + pupal) sequentially with hard page breaks
- [ ] **AC06**: KAN per-parameter `*` applies in Mode A/B only; Mode C/D footnote explicitly notes surveillance ≠ ISO 17025 testing
- [ ] **AC07**: Report number `/R` suffix applies based on Mode A/B parameters only (Mode C/D excluded)
- [ ] **AC08**: Multi-LHU bundling (sequential LHU numbers) works
- [ ] **AC09**: Page numbering "Halaman X dari Y" + QR code (optional)
- [ ] **AC10**: E-signature block shows analyst + supervisor

### Configuration & Accreditation Logo Position

- [ ] **AC20**: `accreditationLogoPosition = BOTTOM` (default) places logo in sign-off block
- [ ] **AC21**: `accreditationLogoPosition = TOP` places logo in header band 4th column
- [ ] **AC22**: LHU does not introduce new keys to `printedReport.*` config namespace (only adds values within it)

### ISO/IEC 17025 §7.8 Compliance (NEW v2.0)

- [ ] **AC30** (§7.8.2.1(l)): Disclaimer "Hasil pengujian ini hanya berlaku untuk contoh yang diuji" renders above reproduction restriction
- [ ] **AC31** (§7.8.2.1(d)): End-of-report marker renders as terminal block; controlled by `endOfReportMarker` config
- [ ] **AC32** (§7.8.6.1): Decision rule statement renders between Risk Thresholds and Conclusion; text per `decision_rule` enum; i18n-keyed
- [ ] **AC33** (Reproduction restriction): Restriction line renders in pre-footer when `reproductionRestriction = true`
- [ ] **AC34** (§7.8.8): When `amends_lhu_number` non-null, amendment notice renders; `/Am.N` suffix added to report number
- [ ] **AC35** (§7.8.5): Mode A sample info shows trap_type, lure, deployment period (sampling responsibility for vector traps)
- [ ] **AC36** (Accreditation scope clarity): §6.4 footnote per mode states whether mode falls within ISO 17025 testing scope (A/B yes; C/D no, surveillance)

### WHO / Kemenkes Surveillance Compliance (NEW v2.0)

- [ ] **AC40** (ABJ): Mode C result table includes ABJ row with 95% CI and target (95%) comparison; status ✓/✗ flag against target
- [ ] **AC41** (MLE): Mode B result table includes MLE row alongside MIR with 95% CI for each
- [ ] **AC42** (Confidence Intervals): All rate-based metrics (MIR, MLE, infection rate, HI, CI, BI, ABJ, PPI) include 95% CI in their respective tables
- [ ] **AC43** (Zero-positive CI handling): When positive count is zero, the upper 95% CI bound is rendered in the footnote (per §13.2)
- [ ] **AC44** (PPI Mode D): Mode D renders correctly for PPI surveys with population_at_risk denominator
- [ ] **AC45** (Risk thresholds cited): §6.4 footnote in each table cites the threshold source (PAHO 2017 / Kemenkes Permenkes 50/2017 / Focks et al. 2000) and the active profile name
- [ ] **AC46** (Trap details): Mode A sample info / §6.4 footnote shows trap_type, lure, deployment_start, deployment_end, storage_temperature_c
- [ ] **AC47** (Serotype): Mode A result table column "Serotype" renders DENV-1/2/3/4 (or CHIKV, ZIKV, JEV) when PCR typing performed; "—" otherwise. Genotype rendered in footnote when typed.
- [ ] **AC48** (Survey method): Mode C/D header shows `survey_method` from LarvalSurvey/PupalSurvey
- [ ] **AC49** (Min sample size): When pool/house count is below threshold (§13.7), §6.4 footnote renders sample-size warning
- [ ] **AC50** (Geographic hierarchy): Report header shows the finest geographic level consistent across all rows in the table; finer per-row data shown in Lokasi column (Mode A)

### Data Quality

- [ ] **AC60**: All result data pulled from VectorSpecimen, SurveillanceEvent, LarvalSurvey, PupalSurvey entities
- [ ] **AC61**: Geographic hierarchy resolved via GeographicHierarchy entity
- [ ] **AC62**: Risk thresholds resolved via active `vectorRiskThresholdProfile`
- [ ] **AC63**: Trap type, lure, deployment period sourced from VectorSpecimen fields
- [ ] **AC64**: Serotype / genotype sourced from VectorSpecimen fields
- [ ] **AC65**: CIs sourced from {SurveillanceEvent, LarvalSurvey, PupalSurvey}.ci_low/ci_high fields (computed upstream during surveillance processing, not in the LHU template)
- [ ] **AC66**: Amendment metadata sourced from Order entity

### Layout & Localization & Print

- [ ] **AC70**: A4 portrait, 20/15 mm margins, IBM Plex Sans, body 11pt, headings 14pt
- [ ] **AC71**: All visible strings use i18n keys
- [ ] **AC72**: Field labels Indonesian-primary, English secondary
- [ ] **AC73**: Mode tables do not break mid-row
- [ ] **AC74**: Final-page block (disclaimer + repro restriction + end-marker) stays together
- [ ] **AC75**: PDF downloads as `LHU-{reportNumber}_VECTOR.pdf` (or `_Am.N` suffix when amended)

---

## 16. Open Questions

1. **MLE computation responsibility:** Should OpenELIS compute MLE in-application (via Java port of PoolInfR / PooledInfRate) or delegate to an external service / R script? (Recommendation: in-application using a vetted likelihood-profile implementation; precompute on result release. Confirm with backend team.)

2. **Historical baseline indices (Mode B):** Should the report show, e.g., "Jakarta 5-year average MIR = 82" alongside the current MIR/MLE? (Recommendation: yes, when configured; add `vectorBaselineProfile` to Print Report Config as v2.1.)

3. **PPI population_at_risk source:** Should population_at_risk be auto-pulled from BPS census data per kelurahan, or entered manually per survey? (Recommendation: manual entry in v2.0, BPS integration in v2.1.)

4. **Insecticide resistance Mode E:** When does Mode E land? BBLKM Jakarta runs WHO tube tests and CDC bottle bioassays — this is a real surveillance output today. Defer to v2.1 epic.

5. **Decision-rule default for vector:** BINARY_ACCEPTANCE feels right for routine surveillance reports. Should high-risk dengue-endemic deployments default to GUARD_BANDED (escalate risk when upper-CI bound crosses threshold)? Confirm with epidemiology stakeholder.

6. **`/R` suffix when only Mode A/B is partially accredited:** If half of Mode A specimens are accredited and the rest aren't, what is the right report-level signal? (Current spec: no `/R`. Confirm with KAN auditor expectations.)

7. **Storage temperature display:** §6.4 Mode A footnote shows `storage_temperature_c`. Real chain-of-custody is min/max range across collection→testing. Should we capture min/max instead of a single value?

---

## References

### Source Documents (Read-Only)

- **S06-laporan-hasil-compliance-report-frs-v1.0.md** — Base FRS for S-06 Laporan Hasil (OGC-552)
- **environmental-lhu.md v2.0** — Sibling LHU; shares ISO 17025 §7.8 report-face patterns
- **patient-report-redesign-spec.md** — Canonical patient report spec
- **patient-report-redesign-addendum-r5.md** — Accreditation-logo position config
- **vector-lhu-preview.html** — HTML preview reference (mockup; pending v2.0 update)
- **V-01 Vector Specimen Types Taxonomy FRS** — VectorSpecimen entity baseline
- **env-vector-lhu-review-2026-05-26.md** — Structural review that drove this v2.0 rewrite

### Accreditation Standards

- **ISO/IEC 17025:2017** — General requirements (§7.2, §7.8 reporting, §7.8.6.1 decision rules, §7.8.8 amendments)
- **ILAC-G8:09/2019** — Decision Rules and Statements of Conformity
- **KAN DP.01.34** — Persyaratan tambahan akreditasi laboratorium pengujian/kalibrasi

### WHO / PAHO Vector Surveillance

- **WHO 2003** — *Dengue: Guidelines for Diagnosis, Treatment, Prevention and Control* (HI/CI/BI/PPI definitions, larval+pupal survey protocols)
- **WHO 2021** — *Operational Manual on Aedes Surveillance* (MLE recommendation, 95% CI guidance, minimum sample sizes)
- **PAHO 2017** — *Manual for Indicators in Dengue Surveillance* (transmission thresholds for HI, CI, BI)
- **Focks DA et al. 2000** — *Transmission thresholds for dengue in terms of Aedes aegypti pupae per person* (PPI rationale + threshold ranges)
- **Biggerstaff BJ 2006** — *PooledInfRate software* (MLE for pooled samples; basis for MLE implementation)
- **Wilson EB 1927** — *Probable inference, the law of succession, and statistical inference* (Wilson 95% CI for binomial proportions; basis for HI/CI/BI CI computation)

### Kemenkes / Indonesia MoH

- **Permenkes RI No. 50 Tahun 2017** — Standar Baku Mutu Vektor & Binatang Pembawa Penyakit (ABJ target, PSN program)
- **Permenkes RI No. 949 Tahun 2004** — Sistem Kewaspadaan Dini Penyakit Menular (dengue early warning)
- **Kemenkes Pedoman Penyelenggaraan PSN-3M+** — National PSN program operational guidance

### Related OpenELIS Specs

- **S-06 (OGC-552):** Laporan Hasil base
- **S-06b:** LH Delivery Notification
- **V-01:** Vector Specimen Types Taxonomy
- **V-02+:** Vector Surveillance (when filed)

---

## 17. i18n Keys (MessageResources additions)

### Reused from patient-report-spec §8

| Key | EN |
|---|---|
| `test` | Test |
| `status` | Status |
| `date` | Date |
| `note` | Note |
| `about` | Page X of Y suffix |

### Reused from env LHU v2.0 §16 (cross-cutting ISO 17025)

| Key | EN | ID |
|---|---|---|
| `resultsApplyOnlyDisclaimer` | Test results apply only to the items tested | Hasil pengujian ini hanya berlaku untuk contoh yang diuji |
| `reproductionRestriction` | No part of this report may be reproduced... | Dilarang menggandakan sebagian dari LHU ini... |
| `endOfReport` | End of Report | Akhir Laporan |
| `decisionRule` | Decision rule | Aturan keputusan |
| `decisionRuleBinaryAcceptance` | Binary acceptance per ILAC-G8 | Penerimaan biner per ILAC-G8 |
| `decisionRuleGuardBanded` | Guard-banded (k=2) | Guard-banded (k=2) |
| `decisionRuleSharedRisk` | Shared risk per ILAC-G8 §4.3 | Risiko bersama per ILAC-G8 §4.3 |
| `amendmentNotice` | Amendment notice | Pemberitahuan amandemen |
| `amendmentNumber` | Amendment No. | Amandemen No. |
| `supersedesLhu` | Supersedes LHU | Menggantikan LHU |
| `amendmentReason` | Amendment reason | Alasan amandemen |
| `accreditationCoverage` | Accreditation coverage | Cakupan akreditasi |

### NEW v2.0 vector-specific keys

| Key | EN | ID (Bahasa Indonesia) |
|---|---|---|
| `inspectionResultReportTitle` | Vector Surveillance Report | LAPORAN HASIL SURVEILANS VEKTOR |
| `reportNumber` | Report Number | Nomor Laporan |
| `reportDate` | Report Date | Tanggal Laporan |
| `sampleBarcode` | Sample Barcode | Kode Barcode |
| `collectionDate` | Collection Date | Tanggal Koleksi |
| `location` | Location | Lokasi |
| `genus` | Genus | Genus |
| `species` | Species | Spesies |
| `pcrTarget` | PCR Target | Target PCR |
| `ctValue` | Ct Value | Ct Value |
| `serotype` | Serotype | Serotipe |
| `genotype` | Genotype | Genotipe |
| `speciesIdentification` | Species Identification Results | Hasil Identifikasi Spesies |
| `trapType` | Trap Type | Tipe Penjebak |
| `lure` | Lure | Umpan |
| `deploymentPeriod` | Deployment Period | Periode Pemasangan |
| `storageTemperature` | Storage Temperature | Suhu Penyimpanan |
| `coldChain` | Cold chain | Rantai dingin |
| `surveillanceObjective` | Surveillance Objective | Tujuan Surveilans |
| `endemicDengueSurveillance` | Endemic Dengue Surveillance | Surveilans Endemis Dengue |
| `totalPoolsTested` | Total Pools Tested | Total Pools Diuji |
| `positivePools` | Positive Pools | Pools Positif |
| `minimumInfectionRate` | Minimum Infection Rate (MIR) | Minimum Infection Rate (MIR) |
| `mle` | Maximum Likelihood Estimation (MLE) | Maximum Likelihood Estimation (MLE) |
| `confidenceInterval95` | 95% Confidence Interval | Interval Kepercayaan 95% |
| `infectionRatePer1000` | Infection Rate per 1000 organisms | Laju Infeksi per 1000 Organisme |
| `collectionDensity` | Collection Density | Kepadatan Koleksi |
| `riskThresholdHigh` | High Risk Threshold | Ambang Risiko Tinggi |
| `riskThresholdModerate` | Moderate Risk Threshold | Ambang Risiko Moderat |
| `riskThresholdLow` | Low Risk Threshold | Ambang Risiko Rendah |
| `riskThresholdSource` | Risk Threshold Source | Sumber Ambang Risiko |
| `highRisk` | High Risk | Risiko Tinggi |
| `moderate` | Moderate | Moderat |
| `highConfidence` | High Confidence | Kepercayaan Tinggi |
| `houseIndex` | House Index | House Index |
| `containerIndex` | Container Index | Container Index |
| `breteauIndex` | Breteau Index | Breteau Index |
| `larvaFreeRate` | Larva-Free Rate | Angka Bebas Jentik |
| `larvaFreeRateAbj` | ABJ (Angka Bebas Jentik) | ABJ (Angka Bebas Jentik) |
| `abjTarget` | ABJ Target (Kemenkes) | Target ABJ (Kemenkes) |
| `pupaePerPerson` | Pupae Per Person (PPI) | Pupa per Orang (PPI) |
| `pupaeCount` | Pupae Count | Jumlah Pupa |
| `populationAtRisk` | Population at Risk | Populasi Berisiko |
| `transmissionThreshold` | Transmission Threshold | Ambang Transmisi |
| `housesExamined` | Houses Examined | Rumah Diperiksa |
| `housesPositive` | Houses Positive | Rumah Positif |
| `containersExamined` | Containers Examined | Kontainer Diperiksa |
| `containersPositive` | Containers Positive | Kontainer Positif |
| `surveyType` | Survey Type | Tipe Survei |
| `surveyMethod` | Survey Method | Metode Survei |
| `routineLarvalSurvey` | Routine Larval Survey | Survei Jentik Rutin |
| `confidence` | Confidence | Kepercayaan |
| `geographicCoverage` | Geographic Coverage | Cakupan Geografis |
| `province` | Province | Provinsi |
| `kotaKabupaten` | City / Regency | Kota / Kabupaten |
| `kecamatan` | Sub-district | Kecamatan |
| `kelurahan` | Village (urban) | Kelurahan |
| `sampleSizeWarning` | Sample Size Warning | Peringatan Ukuran Sampel |

---

## Appendix A — Indonesian Terms Glossary

| Bahasa Indonesia | English / Meaning |
|---|---|
| Akreditasi | Accreditation |
| Akhir Laporan | End of Report |
| Amandemen | Amendment |
| Angka Bebas Jentik (ABJ) | Larva-Free Rate |
| Aturan Keputusan | Decision rule |
| Cakupan Geografis | Geographic coverage |
| Diuji oleh | Tested by |
| Disahkan oleh | Approved by |
| Halaman X dari Y | Page X of Y |
| Indetermin | Indeterminate (PCR result) |
| Interval Kepercayaan 95% | 95% Confidence Interval |
| KAN | Komite Akreditasi Nasional |
| Kelurahan / Kecamatan / Kota / Kabupaten / Provinsi | Indonesian administrative levels |
| Kepadatan Koleksi | Collection density |
| Kepercayaan Tinggi | High confidence |
| Keterangan / Ket. | Note(s) |
| Lokasi Pengambilan | Sampling location |
| Metode Survei | Survey method |
| Pengambil Contoh | Sample collector |
| Periode Pemasangan | Deployment period |
| Permenkes | Peraturan Menteri Kesehatan |
| Populasi Berisiko | Population at risk |
| Pupa | Pupae |
| Pupa per Orang (PPI) | Pupae Per Person Index |
| Rantai Dingin | Cold chain |
| Risiko Tinggi | High risk |
| Sampel | Sample |
| Serotipe / Genotipe | Serotype / Genotype |
| Spesies | Species |
| Subkontrak | Subcontract |
| Survei Jentik | Larval survey |
| Survei Pupa | Pupal survey |
| Suhu Penyimpanan | Storage temperature |
| Surveilans | Surveillance |
| Tanggal Pengujian | Test date |
| Tipe Penjebak | Trap type |
| Tujuan Surveilans | Surveillance objective |
| Umpan | Lure |
| Yth. | Indonesian honorific |

---

**Document Status:** v2.0 ready for design review.
**Next Steps:** Stakeholder review, then push to `designs/vector-surveillance/vector-lhu.md` on DIGI-UW/openelis-work. Mockup (.jsx) and preview (.html) updates to follow in a separate ticket. Upstream data-capture gap analysis (Task #10) queued for post-Jira-update phase.
