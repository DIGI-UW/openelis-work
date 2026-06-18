# Analyzer Integration Spec Templates

> These are **protocol-level, developer-facing** templates (field positions, record/segment
> maps, transforms, QC rules). They are the heart of this skill and are largely
> deployment-agnostic — set the deployment in the header, don't bake Madagascar in. The
> *UI/feature* side of analyzer setup (how an admin uses these mappings on screen) is owned by
> the `openelis-design` skill (Analyzer Types & Mapping FRS), not here.

## Table of Contents
1. [ASTM LIS2-A2 Spec Structure](#astm)
2. [HL7 v2.3.1 / MLLP Spec Structure](#hl7)
3. [CSV / Flat File Spec Structure](#csv)
4. [Shared Sections (all specs)](#shared)

---

## 1. ASTM LIS2-A2 Spec Structure {#astm}

### Document Header
```
# [Manufacturer] [Model] — [Test Category] Analyzer Integration Spec
**OpenELIS Global | Analyzer Integration | [Deployment]**
Version: v1.0
Date: [YYYY-MM-DD]
Protocol: ASTM LIS2-A2 (E1394-97)
Plugin: generic-astm
Jira: OGC-XXX
Author: [name]
Confidence: HIGH / MEDIUM-HIGH / VALIDATED
```

### Required Sections (ASTM)

**1. Overview**
- Instrument purpose and test menu
- Deployment context (lab unit, site)
- Protocol version confirmed (LIS2-A2, E1394-97, or vendor-specific variant)
- Communication mode (SERVER: OpenELIS listens / CLIENT: OpenELIS connects)
- Default TCP port

**2. Message Flow**
- Describe the full transaction sequence: H → P → O → R… → L
- Indicate whether the analyzer initiates (push) or waits for query (bidirectional)
- Note any vendor-specific deviations from standard LIS2-A2 record order

**3. Record Field Mapping Table**
For each record type used (H, P, O, R, L), document:

| Record | Field Position | Field Name | Example Value | OpenELIS Mapping | Notes |
|---|---|---|---|---|---|
| H | H.4 | Sender Name | `IndikoPlus^Thermo` | instrument_id | Split on `^` |
| H | H.12 | Processing ID | `P` | qc_flag_input | `Q`=QC batch |
| P | P.3 | Patient ID | `PAT-2026-0412` | patient_uid | |
| P | P.5 | Patient Name | `Doe^Jane` | patient_name | `^` delimited |
| P | P.8 | DOB | `19850315` | date_of_birth | YYYYMMDD |
| P | P.9 | Sex | `F` | gender | M/F/U |
| O | O.3 | Specimen ID | `LAB-2026-0412` | sample_id | QC prefix check here |
| O | O.5 | Test IDs | `^^^GLU\^^^BUN` | test_codes | `\` separated, `^^^` prefix |
| O | O.16 | Specimen Descriptor | `QC` | qc_flag_input | instrument-set value |
| O | O.22 | Result Status | `F` | result_status | F=Final, P=Preliminary |
| R | R.2 | Test Code | `^^^GLU` | test_code | Strip `^^^` |
| R | R.3 | Result | `105` | result_value | May be `>X` or `<X` |
| R | R.4 | Units | `mg/dL` | result_units | |
| R | R.5 | Reference Range | `70-100` | reference_range | |
| R | R.6 | Abnormal Flag | `H` | abnormal_flag | See flag table |
| R | R.9 | Result Status | `F` | result_status | |

*Adjust field positions to the specific instrument — always verify against the vendor's LIS interface manual.*

**4. Test Code Reference Table**
| Analyzer Code | Test Name | Result Type | Unit | Transform | OE Test ID |
|---|---|---|---|---|---|
| `0125` | Glucose | NUMERIC | mg/dL | PASSTHROUGH | TBD |
| `ORGANISM_ID` | Organism Identification | ALPHANUMERIC | — | Coded Lookup → Organism Master | TBD |
| `SCORE` | Confidence Score | NUMERIC | — | Threshold: ≥2.0=HIGH, 1.7–1.99=LOW, <1.7=NO ID | TBD |

Transforms: `PASSTHROUGH`, `GREATER_LESS_FLAG`, `VALUE_MAP`, `THRESHOLD_CLASSIFY`, `CODED_LOOKUP`

**5. QC Identification Rules** (OR logic — any rule match = QC sample)
| Rule Type | Field | Value / Pattern | Notes |
|---|---|---|---|
| specimenIdPrefix | O.3 | `QC-` | Lab QC convention |
| specimenIdPrefix | O.3 | `CTRL-` | Bio-Rad Liquichek |
| fieldEquals | O.16 | `QC` | Instrument-set descriptor |
| specimenIdRegex | O.3 | `^(QC\|CTRL\|CAL).*` | Catch-all |

**6. Abnormal Flag Mapping**
| ASTM Flag | OpenELIS Interpretation |
|---|---|
| H | HIGH |
| L | LOW |
| HH | CRITICAL_HIGH |
| LL | CRITICAL_LOW |
| N | NORMAL |
| A | ABNORMAL |
| * | SUSPECT_FLAG |
| > | GREATER_THAN (result exceeded upper reporting limit) |
| < | LESS_THAN (result below lower reporting limit) |

**7. Result Aggregation**
- Mode: `BY_SPECIMEN` (group all R records for one specimen) or `PER_MESSAGE` (one R per OBX import)
- Window (if BY_SPECIMEN): typically 5–15 seconds

**8. Field Extraction Overrides** (if instrument uses non-standard field positions)
| Standard Field | Overridden Purpose | Example |
|---|---|---|
| P.3 | Run UUID | `RUN-20260226-001` |
| O.13 | Plate Position | `A1`–`H12` |

**9. Implementation Notes**
- Any known quirks, firmware versions affecting output, encoding issues
- Character set / encoding (ASCII, Latin-1, UTF-8)
- TCP framing notes if non-standard

**10. Sample ASTM Message**
```
H|\^&|||IndikoPlus^Thermo Fisher|||||||LIS2-A2
P|1||PAT-2026-0412||Doe^Jane||19850315|F
O|1|LAB-2026-0412||^^^GLU\^^^BUN\^^^CREA|R|20260226103000||||N
R|1|^^^GLU|105|mg/dL|70-100|H|F
R|2|^^^BUN|22|mg/dL|7-20|H|F
R|3|^^^CREA|0.9|mg/dL|0.6-1.2|N|F
L|1|N
```

---

## 2. HL7 v2.3.1 / MLLP Spec Structure {#hl7}

### Document Header
```
# [Manufacturer] [Model] — [Test Category] Analyzer Integration Spec
**OpenELIS Global | Analyzer Integration | [Deployment]**
Version: v1.0
Date: [YYYY-MM-DD]
Protocol: HL7 v2.3.1 over MLLP/TCP
Plugin: generic-hl7
Jira: OGC-XXX
Author: [name]
Confidence: HIGH / MEDIUM-HIGH / VALIDATED
```

### Required Sections (HL7)

**1. Overview** — same structure as ASTM

**2. MLLP Framing**
- Start block: `0x0B`
- End block: `0x1C 0x0D`
- OpenELIS role: SERVER (listens) or CLIENT (connects)
- Default port (e.g., 9100 for Mindray BC-5380, 9101 for Mindray BS-series)
- ACK behavior: ACK/NAK, retry count

**3. Segment Field Mapping Table**
For each segment used (MSH, PID, PV1, OBR, OBX, NTE):

| Segment | Field | Name | Example | OpenELIS Mapping | Notes |
|---|---|---|---|---|---|
| MSH | MSH-3 | Sending Application | `BC-5380` | instrument_id | |
| MSH | MSH-9 | Message Type | `ORU^R01` | message_type | Result message |
| MSH | MSH-10 | Message Control ID | `20260226093012` | message_uid | |
| PID | PID-3 | Patient ID | `PAT-2026-0412` | patient_uid | |
| PID | PID-5 | Patient Name | `Doe^Jane` | patient_name | `^` delimited |
| PID | PID-7 | DOB | `19850315` | date_of_birth | YYYYMMDD |
| PID | PID-8 | Sex | `F` | gender | |
| OBR | OBR-3 | Filler Order Number | `LAB-2026-0412` | sample_id | QC prefix check here |
| OBR | OBR-7 | Observation DateTime | `20260226093012` | result_datetime | |
| OBR | OBR-16 | Ordering Provider | `QC` | qc_flag_input | |
| OBX | OBX-2 | Value Type | `NM` | result_type | NM=Numeric, ST=String |
| OBX | OBX-3 | Observation ID | `^^^WBC` | test_code | Strip `^^^` prefix |
| OBX | OBX-5 | Observation Value | `7.5` | result_value | |
| OBX | OBX-6 | Units | `10³/µL` | result_units | |
| OBX | OBX-7 | Reference Range | `4.0-10.0` | reference_range | |
| OBX | OBX-8 | Abnormal Flags | `H` | abnormal_flag | |
| OBX | OBX-11 | Observation Result Status | `F` | result_status | F=Final |

**4. Test Code Reference Table** — same structure as ASTM, but codes are `^^^CODE` format

**5. QC Identification Rules** — same structure as ASTM, but fields reference HL7 segments (OBR.3, OBR.16, etc.)

**6. Abnormal Flag Mapping** — same as ASTM (H/L/HH/LL/N/A common to both)

**7. Result Aggregation** — same structure as ASTM

**8. Sample HL7 Message**
```
MSH|^~\&|BC-5380||OpenELIS||20260226093012||ORU^R01|20260226093012|P|2.3.1
PID|||PAT-2026-0412||Doe^Jane||19850315|F
OBR|1|LAB-2026-0412||CBC|||20260226093012
OBX|1|NM|^^^WBC||7.5|10³/µL|4.0-10.0|N|F
OBX|2|NM|^^^RBC||4.52|10⁶/µL|3.8-5.8|N|F
OBX|3|NM|^^^HGB||13.5|g/dL|12.0-16.0|N|F
```

---

## 3. CSV / Flat File Spec Structure {#csv}

### Document Header
```
# [Manufacturer] [Model] — [Test Category] Flat File Import Spec
**OpenELIS Global | Analyzer Integration | [Deployment]**
Version: v1.0
Protocol: CSV / Flat File
Plugin: flat-file
Jira: OGC-XXX
```

### Required Sections (CSV)

**1. File Discovery**
- Export folder path (instrument-side)
- File naming convention (e.g., `Results_YYYYMMDD_HHMMSS.csv`)
- OpenELIS poll interval
- Post-import action (delete / move to archive folder)

**2. File Format**
- Delimiter: comma / tab / semicolon / pipe
- Encoding: **always specify** (UTF-8, Latin-1/ISO-8859-1, Windows-1252)
- Line endings: CRLF or LF
- Header row: yes/no; if yes, list exact column names
- **Locale note**: French locale instruments use `;` as delimiter and `,` as decimal separator

**3. Column Mapping Table**
| Column Header | Example Value | OpenELIS Field | Transform | Notes |
|---|---|---|---|---|
| `SampleID` | `LAB-2026-0412` | sample_id | none | |
| `SampleType` | `QC` | qc_flag | fieldEquals QC | |
| `TestCode` | `MTB_DETECT` | test_code | none | |
| `Result` | `DETECTED` | result_value | Value Map | See transform table |
| `Unit` | — | result_units | none | May be blank for qualitative |
| `DateTime` | `2026-02-26 09:30:12` | result_datetime | datetime parse | Format: `YYYY-MM-DD HH:MM:SS` |

**4. Unit Scale Note** (if applicable)
- Example: Finecare reports ratios as 0.0–1.0; OpenELIS expects 0–100%. Transform: multiply by 100.
- Always document expected range at analyzer output and at OpenELIS import.

**5. Value Map Transforms**
| Analyzer Value | OpenELIS Value | Meaning |
|---|---|---|
| `DETECTED` | `Positive` | MTB detected |
| `NOT DETECTED` | `Negative` | No MTB |
| `INVALID` | `Invalid` | Failed run |
| `ERROR` | `Error` | Instrument error |

**6. QC Identification Rules**
- fieldEquals: Column `SampleType` = `QC`
- Any other instrument-set QC markers

**7. Sample File**
```
SampleID,SampleType,TestCode,Result,Unit,DateTime
LAB-2026-0412,PATIENT,MTB_DETECT,DETECTED,,2026-02-26 09:30:12
QC-001,QC,MTB_DETECT,NOT DETECTED,,2026-02-26 09:30:15
```

---

## 4. Shared Sections (all specs) {#shared}

### Appendix: Dual-Mode Protocol (when applicable)
If the instrument supports both real-time (ASTM/HL7) and batch export (CSV), document:
- Which mode is primary (usually real-time)
- What data is available in each mode (real-time may have QC flags; CSV may not)
- Any data field differences between modes
- Separate Jira stories for each mode

### Appendix: French Locale Handling
For deployments in Madagascar (French locale):
- Decimal separator: `,` (not `.`) — may break numeric parsing
- Delimiter shift: `;` replaces `,`
- Date formats: `DD/MM/YYYY` common
- Column headers may be French (document both)
- Encoding: often Latin-1, not UTF-8

### Spec Versioning
| Version | Date | Changes |
|---|---|---|
| v1.0 | YYYY-MM-DD | Initial spec |
| v1.1 | YYYY-MM-DD | Added CSV flat file appendix |
| v2.0 | YYYY-MM-DD | Major rearchitecture — full LIS2-A2 field table |
