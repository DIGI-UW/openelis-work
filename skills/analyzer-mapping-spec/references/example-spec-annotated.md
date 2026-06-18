# Worked Example — Annotated Integration Spec

> A complete spec to **calibrate quality against** — the shape, depth, and grounding a good
> integration spec has. It uses the Mindray BC-5380 (HL7 hematology) because that instrument
> appears throughout this skill.
>
> ⚠ **This is an exemplar, not an authoritative Mindray reference.** Field positions, the port,
> and codes below are the *standard HL7 shape* and are marked accordingly — they are
> `ILLUSTRATIVE` and **must be verified against the BC-5380 LIS interface manual** before use
> in a real spec. The point of this file is to show *structure and rigor*, not to be copied as
> fact. Annotation callouts (`▸ Why:`) explain why each part is there — those are the
> transferable lessons.

---

# Mindray BC-5380 — Hematology Analyzer Integration Spec
**OpenELIS Global | Analyzer Integration | [Deployment]**
Version: v1.0
Date: 2026-06-18
Protocol: HL7 v2.3.1 over MLLP/TCP
Plugin: generic-hl7
Jira: OGC-XXX
Author: [name]
Confidence: **MEDIUM-HIGH** (shape from HL7 standard + product class; exact field positions/port not verified against the BC-5380 IFU)

▸ **Why a confidence line:** it tells the reader how much to trust the field positions. "MEDIUM-HIGH, IFU not verified" is honest and sets the dev's expectation to confirm before wiring.

## 1. Overview
- **Instrument:** Mindray BC-5380, 5-part differential hematology analyzer.
- **Test menu:** CBC + 5-part WBC differential (WBC, RBC, HGB, HCT, PLT, NEU%, LYM%, …).
- **Deployment context:** [lab unit = Hematology; site].
- **Protocol confirmed:** HL7 v2.3.1 over MLLP. *(Verify against IFU — Mindray uses HL7, not ASTM; this is a common misclassification.)*
- **Communication mode:** SERVER — OpenELIS listens.
- **Default TCP port:** 9100 *(ILLUSTRATIVE — confirm per install)*.

▸ **Why call out SERVER + port up front:** the companion guide and the firewall request both depend on it; getting it wrong blocks the whole integration.

## 2. MLLP Framing
- Start block `0x0B`; end block `0x1C 0x0D`.
- OpenELIS role: SERVER (listens). ACK: standard HL7 ACK; NAK retry per instrument default.

▸ **Why:** MLLP framing bytes are the #1 silent failure in HL7 integrations — state them explicitly, don't assume.

## 3. Segment Field Mapping
*(Positions follow standard HL7 v2.3.1 — verify each against the BC-5380 IFU. ILLUSTRATIVE.)*

| Segment | Field | Name | Example | OpenELIS mapping | Notes |
|---|---|---|---|---|---|
| MSH | MSH-3 | Sending App | `BC-5380` | instrument_id | |
| MSH | MSH-9 | Message Type | `ORU^R01` | message_type | result message |
| MSH | MSH-10 | Message Control ID | `20260618093012` | message_uid | |
| PID | PID-3 | Patient ID | `PAT-2026-0618` | patient_uid | |
| PID | PID-5 | Patient Name | `Doe^Jane` | patient_name | `^` delimited |
| OBR | OBR-3 | Filler Order No. | `LAB-2026-0618` | sample_id | **QC prefix check here** |
| OBR | OBR-7 | Observation DateTime | `20260618093012` | result_datetime | |
| OBX | OBX-2 | Value Type | `NM` | result_type | NM = numeric |
| OBX | OBX-3 | Observation ID | `^^^WBC` | test_code | strip `^^^` |
| OBX | OBX-5 | Value | `7.5` | result_value | |
| OBX | OBX-6 | Units | `10³/µL` | result_units | |
| OBX | OBX-8 | Abnormal Flags | `H` | abnormal_flag | see §5 |
| OBX | OBX-11 | Result Status | `F` | result_status | F = final |

▸ **Why every row carries an example + a note:** "OBX-3" alone is ambiguous; `^^^WBC` + "strip `^^^`" tells the dev exactly what arrives and what to do. The note column is where the real knowledge lives.

## 4. Test Code Reference (reuse the mapping-library where verified)
| Analyzer code | Test name | Result type | Unit | Transform | OE Test ID |
|---|---|---|---|---|---|
| `WBC` | White Blood Cell count | NUMERIC | 10³/µL | PASSTHROUGH | TBD |
| `HGB` | Hemoglobin | NUMERIC | g/dL | PASSTHROUGH | TBD |
| `PLT` | Platelet count | NUMERIC | 10³/µL | PASSTHROUGH | TBD |
| `NEU%` | Neutrophil % | NUMERIC | % | PASSTHROUGH | TBD |

▸ **Why `TBD` on OE Test ID:** the mapping to the lab's catalog test is per-deployment and is *verified*, not guessed — leaving TBD is correct until matched (by LOINC) in the live catalog. Inventing an ID would be worse than TBD.

## 5. Abnormal Flag Mapping
Standard ASTM/HL7 flags — reused verbatim from `mapping-library.md` §3: H/L → HIGH/LOW, HH/LL → CRITICAL_HIGH/LOW, N → NORMAL.

▸ **Why point to the library:** this table is identical across most instruments — reuse it, don't retype and risk a typo.

## 6. QC Identification Rules (OR logic)
| Rule type | Field | Value/pattern | Note |
|---|---|---|---|
| specimenIdPrefix | OBR-3 | `QC-` | lab convention |
| fieldEquals | OBR-16 | `QC` | instrument-set, if used |

▸ **Why QC rules are mandatory:** without them, control runs post as patient results — a patient-safety defect. OR logic = any match wins.

## 7. Result Aggregation
- Mode: `BY_SPECIMEN` (group all OBX for one OBR), window ~5–15s.

▸ **Why:** a CBC arrives as many OBX in one specimen; PER_MESSAGE would scatter them into separate results.

## 8. Sample Message (shown parsing — this is the evidence)
```
MSH|^~\&|BC-5380||OpenELIS||20260618093012||ORU^R01|20260618093012|P|2.3.1
PID|||PAT-2026-0618||Doe^Jane||19850315|F
OBR|1|LAB-2026-0618||CBC|||20260618093012
OBX|1|NM|^^^WBC||7.5|10³/µL|4.0-10.0|N|F
OBX|2|NM|^^^HGB||13.5|g/dL|12.0-16.0|N|F
OBX|3|NM|^^^PLT||145|10³/µL|150-400|L|F
```
**Parse trace:** instrument `BC-5380` → 1 patient (`PAT-2026-0618`, not QC: `LAB-` prefix, no `QC-`) → 3 results: WBC 7.5 (N), HGB 13.5 (N), PLT 145 (**L** → LOW). All three codes resolve. ✓

▸ **Why a parse trace, not just a sample:** showing the message *resolving correctly* (codes map, QC classified, a flag interpreted) is what proves the spec actually works. A sample with no trace is half-evidence — see the spec-checklist.

## 9. Implementation Notes
- Character set: confirm (ASCII vs UTF-8 for `µ` in units like `10³/µL`).
- Firmware version affecting output: [note if known].

▸ **Why this section stays descriptive:** it records *facts about the instrument* (encoding, firmware quirks) — it does **not** tell engineering how to build the listener. Specs describe the mapping and the instrument's behavior, never the implementation.

---

## What to copy from this example
- A justified **confidence line** and explicit "verify against IFU" honesty.
- Every mapping row with an **example value + a note**.
- **QC rules** and **abnormal flags** always present (reuse the library).
- A **sample message with a parse trace** as evidence.
- Reuse of `mapping-library.md` fragments instead of retyping.
- **No implementation direction** — describe the mapping and the instrument, not how to build the adapter.
