# KH Medical RADIONE (KM010): Molecular POC Analyzer Integration Spec

**OpenELIS Global | Analyzer Integration | DRC Ebola response (3 public health laboratories)**

| | |
|---|---|
| Version | v0.3 |
| Date | 2026-11-05 |
| Protocol | **File export**: one ZIP per run, containing an Excel workbook and a JSON file. No ASTM or HL7 output seen |
| Integration | **Built-in Analyzer Bridge profile** `kh-medical-radione-rp033` (FILE), plus the Bridge changes in §14 |
| Jira | [OGC-1610](https://uwdigi.atlassian.net/browse/OGC-1610). Parent epic and assignee open (Q7) |
| Companion | [Ebola and Marburg PCR catalog metadata](radione-rp033-ebola-marburg-catalog-metadata.md) |
| Author | Casey (Director of Product, OpenELIS Global) |
| Confidence | **MEDIUM**: structure from one captured export; interpretation rules from the WHO-published IFU. Not HIGH until a vendor interface document or a PC/NTC and positive export confirm the open fields |

> v0.2 replaces the pre-protocol skeleton. Every field position below traces to the captured export `RadioOne data Export_676_RP033_2026-10-10-00-22-19_2_0027.zip` (received 2026-11-05) or to the RP033 IFU Rev.03. Fields not seen in that file are marked **UNCONFIRMED**.

---

## 1. Overview

### 1.1 Instrument

| Item | Value | Source |
|---|---|---|
| Manufacturer | KH Medical Co., Ltd., Republic of Korea | IFU |
| Instrument | RADIONE 4-channel instrument, catalogue KM010 | IFU RP033; export serial `KM010-BE0027` |
| Software in the export | `NATV1.0.17.6`, system `ITAB-01S.V203.20241023` | Export, Result sheet row 1 |
| Software named in the IFU | `NATV1.0.17.12` | IFU RP033 Rev.03. The DRC unit is on an older build (Q10) |
| Category | Fully automated closed POC molecular system: extraction, real-time PCR and detection in one device | IFU |

### 1.2 Classification

An analytical instrument producing reportable patient results (per-target qualitative calls with Ct). In scope.

### 1.3 Deployment context

Three DRC public health laboratories running OpenELIS Global for the Ebola response. The labs work in French: every label this integration adds must be translatable. The captured export uses English headers and `.` as the decimal separator (Q9 resolved for this unit).

### 1.4 Assays

| Kit | Code | Status |
|---|---|---|
| **RADIONE Ebola/Marburg Detection Kit** | **RP033** | **In use at the DRC lab that sent the export. Primary scope** (Q1 resolved) |
| RADIONE Pan-Ebola Genotyping & Marburg Multiplex Kit | RP038 | Not seen. Add if any lab adopts it; it differentiates Bundibugyo, Sudan and Zaire, which RP033 does not |
| RADIONE Mpox Detection Kit | RP001 | Not seen. Add if the labs run it (Q2) |

---

## 2. Integration path

### 2.1 What the instrument produces

One **ZIP archive per run**, created when the operator exports the run. The captured archive was created about 33 hours after the run finished, which suggests a manual export (likely to USB) rather than an automatic one (Q11).

```
RadioOne data Export_676_RP033_2026-10-10-00-22-19_2_0027/
  data.xlsx            Result table, run parameters, fluorescence curves
  PC                   JSON: the full run record (sample number, kit, per-well Ct and calls)
  shiyanstatedata      Byte-identical copy of PC, gzip-compressed and base64-encoded with a "zip" prefix. Ignore
  WellA_CH1.png ...    Amplification curve images, one per well and channel (16 files)
```

### 2.2 Routing

| Option | Fit |
|---|---|
| `generic-astm`, `generic-hl7` | No: no message output seen |
| `flat-file` (CSV, and Excel as for FluoroCycler OGC-420) | **Partial.** The Result sheet has the per-target results, but **not the sample number**, which is only in the folder name and in the JSON. The results are also inside a ZIP |
| JSON | The `PC` file carries every required element except the full serial number. No generic JSON support exists |

**Dependency for engineering:** OpenELIS needs to accept a RADIONE export ZIP and read the sample number from the JSON (or the folder name) together with the results. Read from openelis-analyzer-bridge `5a3b8a3`: the Bridge's FILE parser skips every row without a per-row sample ID, and emits one value per tabular row. How to close that gap is engineering's decision.

### 2.3 Decided: a built-in profile

RADIONE RP033 ships as a **built-in Bridge profile** (shipped set, `catalog.source` SHIPPED), so no site authors it. It follows `docs/profile-authoring.md`:

- Tests Ebola and Marburg, qualitative, LOINC 86518-8 and 86574-1; raw values `P` and `N` with answer codes LA11882-0 and LA11883-8; the internal control as a sample flag raised on `N`. Standard coding systems only.
- Sources: the RP033 IFU Rev.03 for targets, wells, values and cut-off; this spec and the captured export (filed as a fixture in analyzer-mock-server) for the file layout. The shipped Madagascar FluoroCycler profile uses the same basis. A vendor interface document, if KH Medical sends one, becomes the source in a later revision.
- An evidence note `docs/profiles/kh-medical-radione-rp033.md` with a Not verified section, and a replay test like the GeneXpert and Mindray baseline tests.

---

## 3. Data contract

| # | Element | Where it is | Required | Status |
|---|---|---|---|---|
| D1 | Sample number as entered on the instrument | JSON `sampleno`; folder name token 2. **Not in the Result sheet** | Yes | Seen: `676` |
| D2 | Kit code | JSON `projectname`; folder name token 3 | Yes | Seen: `RP033` |
| D3 | Per-target Ct and call | Result sheet rows 4+ (`CT`, `P/N`); JSON `modifyProject.kongArgs[well].cts`, `item_yinyangs` | Yes | Seen |
| D4 | Internal control Ct and call | Same rows, channel CH4 (Cy5) | Yes | Seen |
| D5 | Overall interpreted result | **Not in the export.** OpenELIS derives it (§5.3) | Yes | Resolved: absent (Q4) |
| D6 | Run date and time | Result sheet B2; JSON `checktime`; folder name token 4 | Yes | Seen: `2026-10-10-00-22-19_2` |
| D7 | Instrument serial | Result sheet B1 (full); folder name token 5 (last 4 digits only) | Yes | Seen: `KM010-BE0027` |
| D8 | Operator | JSON `checkuser` | If available | **Empty** in this export |
| D9 | Reagent and extraction lot | Not present | If available | **Absent**. Record manually if needed |
| D10 | Control marker (PC, NTC) | Candidate: JSON `kongArgs[well].types` (`Unknown` for this patient run) | Yes | **UNCONFIRMED** (Q5) |
| D11 | Slot | Candidate: the `_2` suffix on the run time | If available | **UNCONFIRMED** (Q12) |

The export carries **no patient identifiers**, only the sample number.

---

## 4. Field map

### 4.1 Folder name

Pattern: `RadioOne data Export_{SampleNo}_{Kit}_{RunTime}_{SerialLast4}`

| Token | Example | Maps to |
|---|---|---|
| SampleNo | `676` | D1 (cross-check against JSON `sampleno`) |
| Kit | `RP033` | D2 |
| RunTime | `2026-10-10-00-22-19_2` | D6, format `YYYY-MM-DD-HH-MM-SS_n` |
| SerialLast4 | `0027` | Cross-check against D7 |

Matching on the folder name alone is fragile because the sample number could contain `_`. Prefer the JSON for D1, and use the folder name as a cross-check.

### 4.2 `data.xlsx`, sheet `Result`

| Cell / column | Label | Example | Maps to |
|---|---|---|---|
| B1 | Serial Number | `KM010-BE0027` | D7 |
| D1 | Software Version | `NATV1.0.17.6` | Audit |
| F1 | System Version | `ITAB-01S.V203.20241023` | Audit |
| B2 | Run Time | `2026-10-10-00-22-19_2` | D6 |
| Row 3 | Header | `Location, Target, CT, Copies, P/N` | |
| Col A | Location | `WellA_CH1` | Well (`A` to `D`) and channel (`CH1` FAM, `CH2` VIC, `CH3` ROX, `CH4` Cy5) |
| Col B | Target | `Ebola`, `Marburg`, `IC` | Component, by kit layout (§5.2) |
| Col C | CT | `25.61` or `NA` | Ct value; `NA` = no amplification |
| Col D | Copies | `NA` | Not used (qualitative kit) |
| Col E | P/N | `P`, `N`, or blank | Per-target call. **Blank = channel not used by the kit; ignore the row** |

The other sheets (`Project`, `Raw`, `Origin`, `Filter`, `DeltaRn&Normalize`, `Image`) hold run parameters and fluorescence curves per cycle. Not needed for results.

### 4.3 `PC` (JSON), fields used

| Path | Example | Maps to | Notes |
|---|---|---|---|
| `sampleno` | `"676"` | D1 | |
| `projectname` | `"RP033"` | D2 | |
| `checktime` | `"2026-10-10-00-22-19_2"` | D6 | |
| `checkuser` | `""` | D8 | Empty here |
| `softversion` | `"1.0.17.6"` | Audit | |
| `modifyProject.kongArgs[i]` | | One entry per well, `i` = 0 for A, 1 for B, and so on | Array has 8 entries; only the first 4 are wells |
| `.itemnames` | `["Ebola","VIC","ROX","IC"]` | Target name per channel | Unused channels carry the channel name |
| `.guangAbles` | `[true,false,false,true]` | Channel in use | |
| `.cts` | `[0.0,0.0,0.0,25.61]` | Ct per channel | **`0.0` means no Ct**, not Ct zero |
| `.item_yinyangs` | `[0,0,0,1]` | Call per channel | `1` = P, `0` = N, in the used wells. Unused wells show `0` or `2`, so do not rely on this alone |
| `.itemyuzhis` | `[40,40,40,40]` | Ct cut-off | Matches the IFU |
| `.types` | `["Unknown",...]` | Candidate D10 | Patient run = `Unknown` |

Where the Result sheet and the JSON both carry a value, they must agree. If they disagree, hold the result for review.

### 4.4 Unused rows

Wells C and D are unused by RP033 but still appear in the Result sheet with the channel name as Target and a blank P/N. Ignore them silently: they are not unmapped targets.

---

## 5. Result model

### 5.1 Two assays in one run

RP033 runs **two independent assays**, each in its own well with its own internal control (human RNase P). One can be invalid while the other is valid.

### 5.2 Kit layout (IFU RP033 Rev.03, confirmed by the export)

| Well | CH1 (FAM) | CH4 (Cy5) | CH2, CH3 |
|---|---|---|---|
| A | Ebola (pan-Ebola: Zaire, Sudan, Bundibugyo, Taï Forest, Reston, not differentiated) | IC | Unused |
| B | Marburg | IC | Unused |

### 5.3 Interpretation (IFU, applied per well)

| Target (CH1) | IC (CH4) | Result |
|---|---|---|
| P (Ct ≤ 40) | P or N | **Positive** |
| N | P | **Negative** |
| N | N | **Invalid**: repeat with new test components; if still invalid, collect a new specimen |

A positive target is valid even without the IC. The export has no overall call, so OpenELIS must apply this table. It is deterministic and uses only the exported P/N values.

### 5.4 Proposed OpenELIS model: decision needed (Q13)

**Recommended: two tests, ordered together as a panel "Ebola/Marburg PCR (RADIONE)".** This keeps each assay's validity separate, so an invalid Marburg well does not hide a valid Ebola result.

| Test | Component code | Meaning | Type | On report |
|---|---|---|---|---|
| Ebola PCR | `RESULT` (PRIMARY) | Ebola Positive / Negative / Invalid | Coded | Yes |
| | `EBOV_CT` | Well A CH1 Ct | Numeric, unit Ct | Lab decides (Q6) |
| | `IC_CT` | Well A CH4 Ct | Numeric, unit Ct | No |
| Marburg PCR | `RESULT` (PRIMARY) | Marburg Positive / Negative / Invalid | Coded | Yes |
| | `MARV_CT` | Well B CH1 Ct | Numeric, unit Ct | Lab decides |
| | `IC_CT` | Well B CH4 Ct | Numeric, unit Ct | No |

Alternative: one test with two coded result components. Simpler to order, but needs a rule for the single PRIMARY component when only one assay is invalid.

### 5.5 Result options (French and English required)

| Derived value | English | French |
|---|---|---|
| Ebola Positive | Ebola virus RNA detected | ARN du virus Ebola détecté |
| Ebola Negative | Ebola virus RNA not detected | ARN du virus Ebola non détecté |
| Marburg Positive | Marburg virus RNA detected | ARN du virus Marburg détecté |
| Marburg Negative | Marburg virus RNA not detected | ARN du virus Marburg non détecté |
| Invalid | Invalid, retest | Invalide, à refaire |

Labs should confirm the French wording (Q14).

### 5.6 Rules

- `NA` in the sheet, and `0.0` in the JSON, mean no amplification.
- Invalid is stored and routed for retest, never dropped or treated as an error.
- A used channel with an unexpected Target name (for example, a different kit's layout) is an unmapped-result exception, shown for review.
- A ZIP whose kit code has no mapping is held for review, not dropped.

---

## 6. QC

### 6.1 Acceptance (IFU RP033)

| Control | Wells A and B, FAM and Cy5 | Failure means |
|---|---|---|
| NTC | No Ct, or Ct > 40 | Contamination: investigate before reporting |
| PC (RP033-PC) | 18 ≤ Ct ≤ 25 | Kit invalid: do not use |

### 6.2 Identification: UNCONFIRMED

The captured run is a patient sample with `types` = `Unknown`. Whether the instrument sets `types` for PC and NTC runs is not known. Until a control export is seen, use OR logic:

| Rule | Field | Value |
|---|---|---|
| fieldEquals (candidate) | JSON `kongArgs[i].types` | Any value other than `Unknown` (to confirm) |
| specimenIdPrefix | D1 | `PC-`, `NTC-` (lab convention, if the sample number allows letters) |

PC and NTC must never post to a patient. They feed Analyzer Manual QC until Runs (OGC-1200) lands.

---

## 7. Abnormal flags

N/A. Qualitative kit.

## 8. Aggregation

One ZIP = one run = one sample number. Every result in the ZIP belongs to that sample. No time window needed.

## 9. Connectivity

No network interface seen. Export appears to be manual, per run, to removable media (Q11). Likely first workflow: the technician copies the ZIP to the OpenELIS workstation and imports it. The import screen is a UI matter for `openelis-design`.

## 10. Sample file, traced

Input: `RadioOne data Export_676_RP033_2026-10-10-00-22-19_2_0027.zip`

| Check | Result |
|---|---|
| Sample number, JSON vs folder name | `676` = `676` ✓ |
| Serial suffix vs Result sheet | `0027` in `KM010-BE0027` ✓ |
| Kit | `RP033` → Ebola PCR + Marburg PCR |
| Well A | Ebola N (CT `NA`), IC P (25.61) → **Ebola Negative** |
| Well B | Marburg N (CT `NA`), IC P (25.25) → **Marburg Negative** |
| Wells C, D | P/N blank → ignored |
| QC classification | `types` = `Unknown` → patient sample |

Still needed to complete the evidence: a positive, an invalid, a PC and an NTC export.

---

## 11. Test catalog

The tests, components, result options and panel are listed in the companion [Ebola and Marburg PCR catalog metadata](radione-rp033-ebola-marburg-catalog-metadata.md). How they are delivered is decided in the reference data rework (OGC-1530, OGC-1531). The target sites run the base openelis-docker and are already installed, so the route has to reach an upgraded site.

## 12. Privileges

No new privileges. Existing `analyzer:view` and `analyzer:manage`; `result:enter` and `result:validate` per lab unit.

---

## 13. Open questions

| # | Question | Status | Who |
|---|---|---|---|
| Q1 | Which Ebola kit is in use? | **Resolved: RP033** at the sending lab. Confirm the other two labs | DRC field team |
| Q2 | Mpox or other kits on the same instruments? | Open | DRC field team |
| Q3 | Channel and well layout, cut-off, control ranges | **Resolved** from the RP033 IFU | |
| Q4 | Does the export carry an overall call? | **Resolved: no.** OpenELIS derives it | |
| Q5 | How are PC and NTC runs marked? | Open. Need one PC and one NTC export | DRC lab |
| Q6 | Ct values on the patient report, or only the call? | Open | DRC labs / national reference lab |
| Q7 | DRC Jira epic, tracker page, labels, assignee | Partial: story OGC-1610 created, labels DRC, Ebola, analyzer-integration; epic and assignee open | Casey |
| Q8 | Models and number of units per lab | Partial: this unit is KM010 | DRC field team |
| Q9 | French-locale export? | **Resolved for this unit**: English headers, `.` decimal | |
| Q10 | Software `NATV1.0.17.6` vs `NATV1.0.17.12` in the IFU: does the newer build change the export? | Open | KH Medical |
| Q11 | Export method: USB, network folder, or automatic? Can several runs be exported at once? | Open | DRC lab, KH Medical |
| Q12 | What does the `_2` suffix on the run time mean (slot)? | Open | KH Medical, or exports from other slots |
| Q13 | Two tests in a panel, or one test with two coded components? | **Decision needed** | Casey |
| Q14 | French result wording | Open | DRC labs |
| Q15 | Can the Sample No. hold the OpenELIS lab number (letters, length, barcode scanner)? Matching depends on it | **Open, critical** | DRC lab |

## 14. Dependencies

- **Import of a ZIP containing JSON and XLSX**, with the sample number taken from outside the result table. No generic plugin does this today; the profile contract, schema and validator gain what the built-in profile needs to describe it.
- **Derived result**: OpenELIS must apply the §5.3 table to produce the call. Engineering chooses the mechanism.
- Multi-component ingestion (OGC-1129): done.
- Runs (OGC-1200) and instrument locks: not built. PC and NTC go through Analyzer Manual QC meanwhile.

## 15. Checklist status

| Area | Status |
|---|---|
| Grounding | One real export + IFU. MEDIUM |
| Field coverage | Done for patient runs |
| Multi-component decision | Recommended, needs Casey (Q13) |
| QC acceptance | Done. Identification unconfirmed |
| Value map | Done, French wording to confirm |
| Connectivity | Partial (Q11) |
| Sample traced | Done for a negative. Positive, invalid, PC, NTC still needed |
| Jira, tracker | Story OGC-1610 created; epic, assignee and tracker row open |

---

## Appendix A: Sources

- Captured export `RadioOne data Export_676_RP033_2026-10-10-00-22-19_2_0027.zip`, received 2026-11-05 from a DRC lab.
- WHO EUL submission, IFU RP033 RADIONE Ebola/Marburg Detection Kit, Rev.03.
- WHO EUL public report, RADIONE Mpox Detection Kit, MPXV-13227-214-00 (for the RP001 shape).

## Appendix B: Test fixture

The captured file contains no patient identifiers, only sample number `676` and a negative result. Before using it as a public test fixture, confirm with the lab, and consider renumbering the sample.

## Version history

| Version | Date | Changes |
|---|---|---|
| v0.1 | 2026-11-04 | Skeleton before the format was known |
| v0.2 | 2026-11-05 | Format identified from a real RP033 export: field map, RP033 layout and interpretation from the IFU, trace of the sample file, new questions Q10 to Q15 |
| v0.3 | 2026-11-05 | Story OGC-1610; decided a built-in Bridge profile (§2.3); Bridge gap from code (§2.2); catalog moved to the companion metadata doc (§11) |
