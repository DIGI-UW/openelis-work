# Ebola and Marburg PCR: test catalog metadata

**For:** OGC-1610 | **Kit:** RADIONE Ebola/Marburg Detection Kit (RP033), IFU Rev.03 | **Date:** 2026-11-05

This is the metadata the DRC labs need. How it is added to OpenELIS is decided by Piotr's reference data rework (OGC-1530 import engine, OGC-1531 Import Review). Items marked **Confirm** are listed at the end.

---

## 1. Tests

| | Ebola PCR | Marburg PCR |
|---|---|---|
| Name (en) | Ebola PCR | Marburg PCR |
| Name (fr) | PCR Ebola | PCR Marburg |
| Name (es) | PCR Ébola | PCR Marburgo |
| Reporting name | Ebola virus RNA | Marburg virus RNA |
| Local code | EBOV-PCR | MARV-PCR |
| LOINC | 86518-8 (**Confirm**) | 86574-1 |
| Test section | Molecular Biology | Molecular Biology |
| Sample type | Plasma (EDTA per IFU, **Confirm**) | Plasma |
| Domain | Clinical | Clinical |
| Orderable, reportable | Yes | Yes |
| Notify on result | Yes (**Confirm**) | Yes |

Both are qualitative. Each runs in its own well with its own internal control, so they are separate tests: one can be invalid while the other is valid.

## 2. Result components (same shape for both tests)

Every component is filled first; the primary `RESULT` is then **calculated** from the two calls and is **required** (the test cannot be resulted, validated or released without it).

| Code | Label (en) | Label (fr) | Type | Primary | Required | On report | Ebola source | Marburg source |
|---|---|---|---|---|---|---|---|---|
| EBOV / MARV | Ebola target / Marburg target | Cible Ebola / Cible Marburg | Select list: Detected, Not detected | No | No | No | Well A, CH1 (FAM) call | Well B, CH1 (FAM) call |
| EBOV_CT / MARV_CT | Ebola Ct / Marburg Ct | Ct Ebola / Ct Marburg | Numeric, 2 decimals, unit Ct | No | No | No (**Confirm**) | Well A, CH1 Ct | Well B, CH1 Ct |
| IC | Internal control | Contrôle interne | Select list: Detected, Not detected | No | No | No | Well A, CH4 (Cy5) call | Well B, CH4 (Cy5) call |
| IC_CT | Internal control Ct | Ct contrôle interne | Numeric, 2 decimals, unit Ct | No | No | No | Well A, CH4 Ct | Well B, CH4 Ct |
| RESULT | Result | Résultat | Select list: Detected, Not detected, Invalid | **Yes** | **Yes** | Yes | **Calculated** (§5) | **Calculated** (§5) |

No unit "Ct" exists in the shipped catalog; add one or leave the unit blank.

## 3. Result options for RESULT

One shared list, used by both tests. The call components use Detected and Not detected; RESULT uses all three.

| Value | English | French | Spanish | Normal | Significance | LOINC answer |
|---|---|---|---|---|---|---|
| Detected | Detected | Détecté | Detectado | No | Positive | LA11882-0 |
| Not detected | Not detected | Non détecté | No detectado | **Yes** | Negative | LA11883-8 |
| Invalid | Invalid, retest | Invalide, à refaire | Inválido, repetir | No | Indeterminate | LA15841-2 |

French wording to be confirmed by the DRC labs.

## 4. Panel

| Name (en) | Name (fr) | Name (es) | Tests | Sample type | LOINC |
|---|---|---|---|---|---|
| Ebola Marburg PCR | PCR Ebola Marburg | PCR Ébola Marburgo | Ebola PCR, Marburg PCR | Plasma | 88186-2 |

## 5. RESULT calculation (from the IFU, per test)

Calculated from the **calls**, not the Ct values, and recalculated whenever a call changes:

| Target call (EBOV / MARV) | Internal control call (IC) | RESULT |
|---|---|---|
| Detected (Ct ≤ 40) | Detected or Not detected | Detected |
| Not detected | Detected | Not detected |
| Not detected | Not detected | Invalid |

Incomplete calls leave RESULT empty, so the test stays unresulted.

## 6. Quality control (from the IFU)

| Control | Both wells, FAM and Cy5 | Material |
|---|---|---|
| Positive control | 18 ≤ Ct ≤ 25 | RADIONE Ebola/Marburg Positive Control Kit (RP033-PC) |
| No-template control | No Ct, or Ct > 40 | Contamination-free buffer |

---

## Notes for the developer (openelis-docker, read 2026-11-05)

Read from openelis-docker `200a538` and OpenELIS-Global-2 `develop` `3aca57f`. These are predictions from the code, not checked on a live instance.

- **Core CSVs are hidden on openelis-docker for five areas.** openelis-docker ships header-only example files in `tests`, `sample-types`, `test-sections`, `dictionaries` and `test-results`. The loader reads an area from the filesystem or from the classpath, never both, so any file there hides every core CSV in that area. A CSV added only to core would not load on an openelis-docker site. The same applies to what core already ships there (the Molecular Biology section, molecular sample types, Horiba CBC tests, the analyzer result options dictionary): worth one check on a live openelis-docker instance.
- **Molecular Biology exists only in a core CSV**, not in the Liquibase seed. On openelis-docker it may be missing, so the tests' section may not resolve. Plasma is in the Liquibase seed.
- **`upgrade.sh` does not add new files to an existing `configs/configuration`.** It copies only top-level config folders that do not exist yet. A file added to openelis-docker reaches fresh installs, not upgraded sites.
- **The Import Catalog page cannot take dictionaries or result options**, only tests, components and panels. Those two need a file in the configuration folder plus a restart, or the reload API.
- The DRC labs were just installed, so they are existing sites by the time this ships.

## Confirm before go-live

| Item | Question |
|---|---|
| Ebola LOINC 86518-8 | Does "Ebola virus" cover all five species RP033 detects, not Zaire only? Is Blood acceptable for EDTA plasma? |
| Marburg LOINC 86574-1, panel 88186-2 | Blood acceptable for EDTA plasma? |
| Sample type | Do the DRC sites spell it "Plasma", or should an EDTA plasma type be added? |
| Notify on result | Should a Detected result trigger notification? |
| Ct on report | Should Ct values stay off the patient report? |
| Override | May a technician override RESULT, or only correct a call so it recalculates? (Recommended: correct the call, audited) |
| French wording | Confirm the French result options with the labs |

## Sources

- IFU RP033 RADIONE Ebola/Marburg Detection Kit Rev.03 (WHO EUL submission).
- loinc.org: 86518-8, 86574-1, 88186-2; LOINC answers LA11882-0, LA11883-8, LA15841-2 (the same answer codes the shipped FluoroCycler profile cites).
