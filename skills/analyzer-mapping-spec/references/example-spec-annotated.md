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
Confidence: **HIGH** for the test/LOINC panel and transport (adapted from a real seed profile); **per-deployment** for catalog test IDs. Real HL7 message captures still pending — keep field positions provisional until confirmed against a capture.

▸ **Why a confidence line:** it tells the reader exactly how much to trust each part — here the panel/transport come from a real profile, but field positions await a live capture. Honest, granular confidence beats a single blanket rating.

**Source:** adapted from the Madagascar distro seed profile `configs/analyzer-profiles/hl7/mindray-bc5380.json` (`analyzer-defaults/1.0`). That's a *distro seed*, not a universal source — reuse the panel, re-verify the rest (see `profile-reuse.md`).

## 1. Overview
- **Instrument:** Mindray BC-5380, 5-part differential hematology analyzer.
- **Test menu:** CBC + 5-part differential (WBC, RBC, HGB, HCT, MCV, MCH, MCHC, PLT, NEUT, LYMPH, MONO, EOS, BASO).
- **Deployment context:** [lab unit = Hematology; site].
- **Protocol confirmed:** HL7 v2.3.1 over MLLP. *(Mindray uses HL7, not ASTM — a common misclassification.)*
- **Communication mode:** SERVER — OpenELIS listens. `mode: BOTH` in the seed (bidirectional ORM/ORR documented by vendor, not yet implemented in OE — OGC-327).
- **TCP port / framing:** **5380**, MLLP *(from the seed profile; confirm per install)*.

▸ **Why call out SERVER + port up front:** the companion guide and the firewall request both depend on it; getting it wrong blocks the whole integration. (Note: the port is **5380**, not a generic 9100 — copy it from the real profile, don't guess.)

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

## 4. Test Code Reference (LOINC panel — reused from the seed profile)
The **LOINC column is the reusable core** (identical for any CBC analyzer, ASTM or HL7); copy it from the seed profile, don't re-derive. Units/codes are the BC-5380's. OE Test ID is per-deployment.

| Analyzer code | Test name | LOINC | Unit | Result type | OE Test ID |
|---|---|---|---|---|---|
| `WBC` | White Blood Cells | 6690-2 | 10^3/uL | NUMERIC | TBD |
| `HGB` | Hemoglobin | 718-7 | g/dL | NUMERIC | TBD |
| `PLT` | Platelet Count | 777-3 | 10^3/uL | NUMERIC | TBD |
| `NEUT` | Neutrophils | 751-8 | % | NUMERIC | TBD |
| … | (full CBC panel per seed) | … | … | … | … |

▸ **Why LOINC, not a transform column:** the profile maps the **test by LOINC** and passes the value through; it doesn't rename values. The same LOINC map is reused verbatim by the Sysmex XN (ASTM) — that's the cross-vendor/cross-protocol reuse. **Why `TBD` on OE Test ID:** the catalog match is per-deployment and *verified* (by LOINC) in the live catalog — leaving TBD is correct; inventing an ID would be worse.

▸ **Default-TC deliverable:** for this profile to auto-match on a fresh install, each LOINC above must be carried by a test in the **OpenELIS Global Default test catalog**. Any that aren't (check them) are added to the Default TC as part of this spec. A **custom-TC** deployment instead maps these LOINCs to its own catalog's tests — that part is deployment-specific and not reusable.

## 5. Abnormal Flag Mapping
Protocol-standard flags — from `profile-reuse.md`: H/L → HIGH/LOW, HH/LL → CRITICAL_HIGH/LOW, N → NORMAL.

▸ **Why point to profile-reuse:** this table is the one true protocol-invariant — identical across instruments, so reuse it rather than retype and risk a typo.

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
- A **granular confidence line** + a cited **source profile**, honest about what's verified (panel/transport) vs pending (field positions until a real capture).
- The **LOINC panel reused from an existing profile** — copied, not re-derived — with the transport/port taken from the real profile (5380, not a guessed 9100).
- Every mapping row with an **example value + a note**.
- **QC rules** and **abnormal flags** always present (flags reused from `profile-reuse.md`).
- A **sample message with a parse trace** as evidence.
- **No value renames in the "profile"** — map by LOINC, let result options resolve against the catalog test.
- **No implementation direction** — describe the mapping and the instrument, not how to build the adapter.
