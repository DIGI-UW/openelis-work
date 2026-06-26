# BD EpiCenter — Microbiology / AMR Data Manager Integration Spec
**OpenELIS Global | Analyzer Integration | PNG / CPHL Port Moresby Deployment**

Version: v1.0
Date: 2026-06-08
Protocol: ASTM LIS2-A2 (E1394-97) over ASTM E1381 / TCP-IP
Plugin: `generic-astm`
Jira: OGC-434
Confidence: MEDIUM-HIGH (built from BD LIS Vendor Interface Document Rev 22; not yet validated in production)

---

## 1. Overview

**BD EpiCenter** is a data-management workstation, not a bench instrument. It aggregates results from up to three BD microbiology instrument families and presents a single LIS interface to OpenELIS:

| Instrument | Output covered | Result types |
|---|---|---|
| BD BACTEC MGIT 960 | Mycobacterial liquid culture | TB growth & detection (`MGIT_960_GND`); first-line/second-line DST (`MGIT_960_AST`) |
| BD Phoenix 100 / M50 | Aerobic ID + AST combo panels | Organism ID + MIC/interpretation (`NMIC/ID-x` gram-negative, `PMIC/ID-x` gram-positive) |
| BD BACTEC FX / 9000 | Blood-culture growth & detection | Bottle growth/no-growth (`PLUSAEF`, `STDAEF`, etc.) |

Because EpiCenter is the single egress point, OpenELIS connects **once** to EpiCenter rather than to each instrument. EpiCenter labels every transmitted result with its source instrument so OpenELIS can route to the correct test.

- **Protocol version:** ASTM LIS2-A2 (E1394-97) record structure, framed per ASTM E1381 over TCP/IP.
- **Communication mode:** SERVER — OpenELIS listens; EpiCenter connects as the client and pushes results. **Bidirectional**: EpiCenter also issues demographic/order queries (Q records) which OpenELIS answers (host-query mode), eliminating manual demographic entry at the workstation.
- **Default TCP port:** `14567`.
- **Deployment:** CPHL Port Moresby — TB, Bacteriology, and Blood Culture benches all feed EpiCenter.

> **Architecture note for the contract:** MGIT 960 (contract item 10) and Phoenix M50 (item 12) do **not** get standalone interfaces — both are delivered through this single EpiCenter integration. Confirm CPHL operates EpiCenter as the data manager before build.

## 2. Message Flow

Standard LIS2-A2 result upload (EpiCenter → OpenELIS):

```
H → P → O → R… → (C comments, optional) → L
```

- EpiCenter **initiates** the connection (client) and pushes a result batch when a panel/bottle/DST completes.
- One `P` (patient) may carry multiple `O` (orders), one per organism/isolate or per bottle; each `O` carries one or more `R` (results).
- **Bidirectional host query:** EpiCenter may send a query record (`Q`) keyed on the accession number; OpenELIS responds with patient/order demographics so the technologist does not re-key them at EpiCenter.
- **Isolate handling:** when `O.5.4` (test-ID 4th component) = `ISOLATE RESULT`, the order represents an isolate-level result set (organism ID + its AST), which OpenELIS must attach to the parent culture/case rather than treat as a standalone sample. See §8.

## 3. Record Field Mapping Table

Field positions follow the BD LIS Vendor Interface Document (Rev 22). BD uses several **non-standard** field positions (notably `O.12` for the QC flag and `O.5.4` for the isolate marker) — these are called out below and in §8.

| Record | Field | Field Name | Example | OpenELIS Mapping | Notes |
|---|---|---|---|---|---|
| H | H.5 | Sender | `EpiCenter^BD` | instrument_id | Split on `^`; identifies the workstation |
| P | P.3 | Patient ID | `PAT-2026-0412` | patient_uid | |
| P | P.5 | Patient Name | `Doe^Jane` | patient_name | `^` delimited |
| P | P.8 | DOB | `19850315` | date_of_birth | YYYYMMDD |
| P | P.9 | Sex | `M` | gender | M/F/U |
| O | O.3 | Specimen / Accession ID | `CPHL-2026-0412` | sample_id | QC accession-prefix check here (see §5) |
| O | O.5 | Universal Test ID | `^^^MGIT_960_AST` | test_code(s) | `\`-separated; strip `^^^`; 4th component is the **isolate marker** (O.5.4) |
| O | O.5.4 | Test-ID 4th component | `ISOLATE RESULT` | isolate_flag | Non-standard. Marks an isolate-level order — attach to parent culture (see §8) |
| O | O.11 | Action Code | `A` | action_code | A=add, Q=query |
| O | O.12 | **QC flag (BD-specific)** | `Q` | qc_flag_input | **Non-standard position.** `Q` = QC/control material. Primary QC trigger (see §5) |
| O | O.16 | Specimen source/descriptor | `BLOOD` | specimen_source | Free-text/coded specimen origin |
| O | O.26 | Report Type | `F` | result_status | F=Final, P=Preliminary |
| R | R.2 | Test Code | `^^^MGIT_960_GND` | test_code | Strip `^^^` |
| R | R.3 | Result value | `DETECTED` / `S` / `2` | result_value | Organism, S/I/R interpretation, MIC, or growth flag depending on test (see §4) |
| R | R.4 | Units | `µg/mL` | result_units | Present for MIC; blank for qualitative/ID |
| R | R.5 | Reference / breakpoint range | `S≤2 / R≥8` | reference_range | CLSI/EUCAST breakpoint band when supplied |
| R | R.6 | Abnormal / interpretation flag | `R` | abnormal_flag | AST interpretation S/I/R/N/X — see §6 |
| R | R.8 | Result result-type | `F` | result_status | I=Interpreted, X=Expert, F=Final (see §4 AST tiers) |
| C | C.4 | Comment text | `Confirm with reference lab` | result_comment | Optional technologist/expert-rule comment |
| L | L.3 | Termination code | `N` | — | N=normal end of transmission |

*Verify each position against BD LIS Vendor Interface Document Rev 22 (L-005933(22)) before implementation.*

## 4. Test Code Reference Table

26 codes span the three instrument families. Representative set (full enumeration to be confirmed against the EpiCenter test-code export):

| Analyzer Code | Source instrument | Test Name | Result Type | Transform | OE Test ID |
|---|---|---|---|---|---|
| `MGIT_960_GND` | MGIT 960 | TB liquid-culture growth & detection | CODED (Detected/Not Detected) | VALUE_MAP | TBD |
| `MGIT_960_AST` | MGIT 960 | TB drug-susceptibility (1st/2nd line) | CODED (S/R) per drug | VALUE_MAP → S/I/R | TBD |
| `NMIC/ID-x` | Phoenix 100/M50 | Gram-negative ID + AST combo panel | ALPHANUMERIC (organism) + MIC/interp per antibiotic | CODED_LOOKUP (organism) + S/I/R map | TBD |
| `PMIC/ID-x` | Phoenix 100/M50 | Gram-positive ID + AST combo panel | ALPHANUMERIC + MIC/interp | CODED_LOOKUP + S/I/R map | TBD |
| `PLUSAEF` | BACTEC FX/9000 | Aerobic blood-culture bottle | CODED (Positive/Negative growth) | VALUE_MAP | TBD |
| `STDAEF` | BACTEC FX/9000 | Standard aerobic bottle | CODED | VALUE_MAP | TBD |

Transforms in use: `VALUE_MAP` (growth & S/I/R), `CODED_LOOKUP` (organism → Organism Master, WHONET-aligned), `THRESHOLD_CLASSIFY` (MIC → S/I/R via CLSI/EUCAST breakpoints when EpiCenter sends raw MIC).

**AST result tiers** (carried in `R.8`): EpiCenter can emit the same antibiotic result at up to three tiers — `I` (interpreted, sent for all AST), `X` (expert-rule-adjusted, isolate-level only), `F` (final, isolate-level only). OpenELIS should prefer the highest available tier (F > X > I) for the released result and retain the others as history.

## 5. QC Identification Rules (OR logic — any match = QC)

| Rule Type | Field | Value / Pattern | Notes |
|---|---|---|---|
| fieldEquals | O.12 | `Q` | **Primary** — BD-specific QC flag |
| testCodeIn | O.5 / R.2 | Phoenix QC panel codes | BD QC-panel product codes flag control organisms (ATCC strains) |
| specimenIdPrefix | O.3 | `QC-` | CPHL QC accession convention |
| specimenIdPrefix | O.3 | `CTRL-` | Control material |
| specimenIdRegex | O.3 | `^(QC\|CTRL\|ATCC).*` | Catch-all |

## 6. Abnormal / Interpretation Flag Mapping

AST interpretation flags (microbiology-specific), carried in `R.6`:

| BD/ASTM Flag | OpenELIS Interpretation |
|---|---|
| S | SUSCEPTIBLE |
| I | INTERMEDIATE |
| R | RESISTANT |
| N | NON-SUSCEPTIBLE / not reportable |
| X | NO INTERPRETATION (expert rule suppressed / not tested) |
| H | HIGH (numeric, e.g., growth index) |
| L | LOW |
| * | SUSPECT_FLAG |

Render S/I/R using the shared OpenELIS resistance-status vocabulary (green=Susceptible, red=Resistant, warm-gray=Intermediate) so EpiCenter results match AMR-module presentation.

## 7. Result Aggregation

- Mode: **BY_SPECIMEN** — group all `R` records under one accession/order so an organism's full antibiogram lands as one result set.
- Window: 10–15 seconds (panels emit many `R` records in a burst; longer than the chemistry default).
- Isolate orders (O.5.4 = `ISOLATE RESULT`) aggregate under the **parent culture/case**, not as new specimens (see §8).

## 8. Field Extraction Overrides (BD non-standard usage)

| Field | Overridden Purpose | Example | Handling |
|---|---|---|---|
| O.12 | QC flag | `Q` | Treat as QC trigger (standard LIS2-A2 puts QC in O.16/H.12) |
| O.5.4 | Isolate-result marker | `ISOLATE RESULT` | Order is isolate-level; resolve parent culture by accession (O.3) and attach organism ID + AST to that case/isolate rather than creating a new sample |

## 9. Implementation Notes

- **Character set:** ASCII (BD interface is 7-bit ASCII; no French-locale handling needed for EpiCenter).
- **TCP framing:** standard ASTM E1381 (`<STX>…<ETX><checksum><CR><LF>`), ENQ/ACK handshake. No vendor framing deviation documented.
- **Bidirectional/host-query** must be enabled on the EpiCenter side and OpenELIS must answer Q records within EpiCenter's timeout (typically a few seconds) or EpiCenter falls back to manual entry.
- The full 26-code list and the exact Phoenix panel product codes should be exported from the live EpiCenter configuration and reconciled against the OpenELIS Test Catalog + Organism Master (WHONET codes) during setup.
- Depends on the AMR/Microbiology module (OGC-782 suite) for organism master, breakpoint tables, and isolate/case data model — the EpiCenter feed lands into those structures.

## 10. Sample ASTM Message

```
H|\^&|||EpiCenter^BD|||||||LIS2-A2|20260608101500
P|1||PAT-2026-0412||Doe^Jane||19850315|M
O|1|CPHL-2026-0412||^^^NMIC/ID-x^ISOLATE RESULT|R|20260608101500|||||A||||BLOOD||||||||||F
R|1|^^^ORGANISM|Escherichia coli||||F
R|2|^^^AMP|R|µg/mL|S<=8 / R>=32|R|F
R|3|^^^CIP|S|µg/mL|S<=0.25 / R>=1|S|F
R|4|^^^GEN|I|µg/mL|S<=4 / R>=16|I|F
L|1|N
```

---

## Spec Versioning

| Version | Date | Changes |
|---|---|---|
| v1.0 | 2026-06-08 | Initial spec from BD LIS Vendor Interface Document Rev 22 + OGC-434 |

## Open items to confirm before build
- [ ] Full 26-code test list + Phoenix panel product codes exported from live EpiCenter
- [ ] Confirm CPHL runs EpiCenter as the data manager for MGIT 960 + Phoenix M50 + BACTEC FX
- [ ] Confirm O.12 / O.5.4 positions against Rev 22 on the deployed firmware
- [ ] Whether MICs are sent raw (needs THRESHOLD_CLASSIFY) or pre-interpreted by EpiCenter
- [ ] Promote confidence to VALIDATED after first production message capture
