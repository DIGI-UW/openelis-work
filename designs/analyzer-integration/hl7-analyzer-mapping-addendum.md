# OpenELIS HL7 Analyzer Mapping Specification — Addendum v1.1

**Addendum to:** OpenELIS Analyzer Mapping Templates FRS v2.0 (February 25, 2026)
**Addendum Version:** 1.1
**Date:** February 27, 2026
**Status:** Draft for Review
**Technology:** Java Spring Framework, Carbon React
**Protocol:** HL7 v2.3.1 / MLLP (TCP/IP)

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.1 | 2026-02-27 | Casey | HL7 addendum: segment field catalog, MLLP connection config, QC identification, value transformations, message simulator, field extraction config, result aggregation, ACK handling, database schema, localization tags |

---

## Table of Contents

1. Purpose of This Addendum
2. HL7 v2.3.1 Protocol Overview
3. HL7 v2.3.1 Segment Field Catalog
4. HL7 ↔ ASTM Field Crosswalk
5. New Functional Requirements (FR-22 through FR-30)
6. New Business Rules (BR-18 through BR-25)
7. New User Stories (Epic 9 through Epic 12)
8. New API Endpoints
9. Database Schema
10. Complete Localization Tags
11. Acceptance Criteria
12. Appendix A — Sample HL7 Messages
13. Related Documents

---

## 1. Purpose of This Addendum

The parent specification (Analyzer Mapping Templates FRS v2.0) and the ASTM Addendum v1.1 define a template-based, GUI-configurable analyzer mapping system for ASTM LIS2-A2 instruments. This addendum extends that system to support **HL7 v2.3.1 analyzers** — instruments that communicate using HL7 ORU^R01 messages over MLLP transport.

The architectural goal is identical: a **single generic HL7 plugin** where all instrument-specific behavior (segment usage, test code encoding, QC identification, value transformations) is driven by GUI configuration rather than per-instrument compiled Java plugins.

### Why a Separate Addendum?

While the mapping concepts (test code mapping, QC rules, value transformations, message simulator) are shared between ASTM and HL7 analyzers, the underlying message structure differs fundamentally:

| Aspect | ASTM LIS2-A2 | HL7 v2.3.1 |
|--------|--------------|-------------|
| **Transport** | ENQ/EOT framing, NAK retries | MLLP (VT/FS/CR framing) |
| **Message type** | Record-oriented (H, P, O, R, C, L) | Segment-oriented (MSH, PID, OBR, OBX, NTE) |
| **Acknowledgment** | ENQ/ACK/NAK at transport level | HL7 ACK message (MSA segment) at application level |
| **Field notation** | Record.Position (e.g., `R.4`) | Segment-Field.Component (e.g., `OBX-5.1`) |
| **Encoding** | `\|`, `^`, `\`, `&` (configurable in H.2) | `\|`, `^`, `~`, `\`, `&` (declared in MSH-1/MSH-2) |
| **Test identification** | Universal Test ID in R.3 (`^^^CODE`) | OBX-3 Coded Element (`code^text^codingSystem`) |
| **Result cardinality** | One R record per result | One OBX segment per result |
| **Order grouping** | Implicit by P→O→R hierarchy | Explicit via OBR with child OBX segments |

These differences require HL7-specific field catalogs, connection configuration, parsing logic, and simulator behavior — hence this addendum.

### Scope

This addendum covers:
- Complete HL7 v2.3.1 ORU^R01 segment field catalog
- MLLP connection configuration (FR-22)
- HL7 ACK generation configuration (FR-23)
- HL7-specific QC identification rules (FR-24)
- HL7-adapted value transformations (FR-25)
- HL7 field extraction configuration (FR-26)
- HL7 result aggregation (FR-27)
- HL7 abnormal flag mapping (FR-28)
- HL7 message simulator (FR-29)
- HL7 auto-detect test codes (FR-30)
- Database schema for HL7 analyzer configuration
- Standard 3-feature UI: Select List Value Mapping, Query Analyzer, Preview Tab

### Instruments Covered

This addendum is designed to support at minimum the following confirmed HL7 v2.3.1 analyzers:

| Instrument | Manufacturer | Discipline | Message Pattern |
|-----------|-------------|------------|-----------------|
| BC-5380 | Mindray | Hematology | ORU^R01 via MLLP, host query via QRY^R02 |
| BS-240 / BS-480 / BS-800 | Mindray | Chemistry | ORU^R01 via MLLP |
| Sysmex XN-series | Sysmex | Hematology | ORU^R01 via MLLP |
| cobas 6000 / e601 / c501 | Roche | Chemistry/Immunoassay | ORU^R01 via MLLP |

---

## 2. HL7 v2.3.1 Protocol Overview

### 2.1 Message Structure

An HL7 v2.3.1 ORU^R01 (Unsolicited Observation Result) message carries laboratory results from an analyzer to the LIS. The standard segment order is:

```
MSH            Message Header (exactly 1)
PID            Patient Identification (0..1)
[PV1]          Patient Visit (0..1)
{              Repeating group per order:
  ORC          Common Order (0..1)
  OBR          Observation Request (exactly 1 per order)
  {OBX}        Observation/Result (1..* per OBR)
  {NTE}        Notes and Comments (0..* per OBX or OBR)
}
```

### 2.2 MLLP Transport

HL7 messages are transmitted over TCP/IP using the **Minimal Lower Layer Protocol (MLLP)**:

```
<VT> [HL7 Message] <FS><CR>
```

| Byte | Hex | Name | Purpose |
|------|-----|------|---------|
| VT | 0x0B | Vertical Tab | Start of message |
| FS | 0x1C | File Separator | End of message data |
| CR | 0x0D | Carriage Return | End of frame |

### 2.3 Acknowledgment Model

Unlike ASTM's transport-level ACK/NAK, HL7 uses **application-level acknowledgment** via an ACK message:

```
MSH|^~\&|OpenELIS||BC-5380||20260227120000||ACK^R01|MSG00001|P|2.3.1
MSA|AA|MSG00001
```

| MSA-1 Code | Meaning | Description |
|------------|---------|-------------|
| `AA` | Application Accept | Message processed successfully |
| `AE` | Application Error | Message received but had errors |
| `AR` | Application Reject | Message could not be processed |

The HL7 plugin must generate ACK responses for every received ORU^R01 message. The ACK behavior is configurable (see FR-23).

### 2.4 Encoding Characters

HL7 v2.3.1 uses five encoding characters declared in MSH-1 and MSH-2:

| Character | Position | Default | Purpose |
|-----------|----------|---------|---------|
| Field Separator | MSH-1 | `\|` | Separates fields within a segment |
| Component Separator | MSH-2[1] | `^` | Separates components within a field |
| Repetition Separator | MSH-2[2] | `~` | Separates repeating fields |
| Escape Character | MSH-2[3] | `\` | Escape sequences |
| Sub-component Separator | MSH-2[4] | `&` | Separates sub-components |

### 2.5 Field Notation Convention

This specification uses **Segment-Field.Component.SubComponent** notation:

- `OBX-5` — OBX segment, field 5 (Observation Value)
- `OBX-3.1` — OBX segment, field 3, component 1 (Observation Identifier code)
- `PID-3.1` — PID segment, field 3, component 1 (Patient ID value)

Field numbering is **1-indexed** per HL7 convention. MSH-1 is the field separator character itself; MSH-2 is the encoding characters. Data fields begin at MSH-3.

### 2.6 HL7 Data Types Reference

| Type | Name | Format | Example |
|------|------|--------|---------|
| ST | String | Free text | `John Smith` |
| NM | Numeric | Decimal number | `95.5` |
| TS | Timestamp | `YYYYMMDDHHmmss[.S[S[S[S]]]][+/-ZZZZ]` | `20260227120000` |
| CE | Coded Element | `code^text^codingSystem^altCode^altText^altSystem` | `WBC^White Blood Cell Count^L` |
| CX | Extended Composite ID | `id^checkDigit^checkDigitScheme^assigningAuth^idType` | `LAB-2026-001^^^L^AN` |
| XPN | Extended Person Name | `familyName^givenName^middleName^suffix^prefix^degree` | `Smith^John^Q^^Mr.` |
| HD | Hierarchic Designator | `namespace^universalId^universalIdType` | `BC-5380^Mindray^L` |
| ID | Coded Value | HL7-defined table value | `F` (for Female) |
| IS | Coded Value (User) | User-defined table value | `SER` (for Serum) |
| TX | Text Data | Multi-line text | Comment text |
| SN | Structured Numeric | `comparator^num1^separator^num2` | `>^500` |
| SI | Sequence ID | Non-negative integer | `1` |
| XCN | Extended Composite Name/ID | `id^familyName^givenName^...` | `DR001^Smith^John` |
| XAD | Extended Address | `street^city^state^zip^country` | `123 Main^Anytown^CA^90210^US` |
| EI | Entity Identifier | `entityId^namespaceId^universalId^universalIdType` | `LAB-001^OpenELIS` |

---

## 3. HL7 v2.3.1 Segment Field Catalog

This section defines every field in the HL7 v2.3.1 segments relevant to laboratory result communication. This catalog is the foundation of the **Blank HL7 Template** — the HL7 equivalent of the ASTM field catalog in FRS v2.0 Section 3.

### 3.1 MSH — Message Header

The Message Header segment identifies the sending/receiving applications and establishes message metadata.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| MSH-1 | Field Separator | `label.hl7.msh.fieldSeparator` | ST | R | Always `\|` | — (parser config) |
| MSH-2 | Encoding Characters | `label.hl7.msh.encodingChars` | ST | R | Typically `^~\&` — component, repetition, escape, sub-component | — (parser config) |
| MSH-3 | Sending Application | `label.hl7.msh.sendingApp` | HD | R | Analyzer application name, e.g., `BC-5380` | `analyzer.senderApp` |
| MSH-4 | Sending Facility | `label.hl7.msh.sendingFacility` | HD | O | Analyzer facility/site identifier | `analyzer.senderFacility` |
| MSH-5 | Receiving Application | `label.hl7.msh.receivingApp` | HD | O | LIS application name, e.g., `OpenELIS` | — (validation) |
| MSH-6 | Receiving Facility | `label.hl7.msh.receivingFacility` | HD | O | LIS facility identifier | — (validation) |
| MSH-7 | Date/Time of Message | `label.hl7.msh.messageDateTime` | TS | R | Message creation timestamp | `import.messageTimestamp` |
| MSH-9 | Message Type | `label.hl7.msh.messageType` | CM | R | `ORU^R01` for results, `QRY^R02` for queries, `ACK^R01` for acknowledgment | — (message routing) |
| MSH-10 | Message Control ID | `label.hl7.msh.messageControlId` | ST | R | Unique message identifier — echoed in ACK response (MSA-2) | `import.messageId` |
| MSH-11 | Processing ID | `label.hl7.msh.processingId` | PT | R | `P`=Production, `D`=Debugging, `T`=Training | — (filter) |
| MSH-12 | Version ID | `label.hl7.msh.versionId` | VID | R | HL7 version, e.g., `2.3.1` | — (validation) |
| MSH-15 | Accept Acknowledgment Type | `label.hl7.msh.acceptAckType` | ID | O | `AL`=Always, `NE`=Never, `ER`=Error only | — (ACK config) |
| MSH-16 | Application Acknowledgment Type | `label.hl7.msh.appAckType` | ID | O | `AL`=Always, `NE`=Never, `ER`=Error only | — (ACK config) |

**Analyzer-specific notes:**
- Mindray BC-5380: MSH-3 = `BC-5380`, MSH-4 typically empty
- Mindray BS-series: MSH-3 = `BS-480` or `BS-800`, varies by model
- Sysmex XN: MSH-3 = `XN-1000` or similar model identifier
- Roche cobas: MSH-3 = `COBAS` with instrument serial in MSH-4

### 3.2 PID — Patient Identification

The Patient Identification segment carries demographic information. Analyzers populate this from barcode data or host query responses.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| PID-1 | Set ID | `label.hl7.pid.setId` | SI | O | Sequence number (usually `1`) | — |
| PID-2 | Patient ID (External) | `label.hl7.pid.externalId` | CX | O | External patient identifier | `patient.externalId` |
| PID-3 | Patient ID (Internal) | `label.hl7.pid.internalId` | CX | R | Primary patient identifier — often the lab number | `patient.subjectNumber` |
| PID-4 | Alternate Patient ID | `label.hl7.pid.alternateId` | CX | O | Alternate patient ID | `patient.nationalId` |
| PID-5 | Patient Name | `label.hl7.pid.patientName` | XPN | R | Last^First^Middle^Suffix^Prefix | `patient.lastName`, `patient.firstName` |
| PID-7 | Date/Time of Birth | `label.hl7.pid.dateOfBirth` | TS | O | Date of birth (YYYYMMDD format typical) | `patient.birthDate` |
| PID-8 | Sex | `label.hl7.pid.sex` | IS | O | Administrative sex: `M`, `F`, `O`, `U`, `A`, `N` | `patient.gender` |
| PID-10 | Race | `label.hl7.pid.race` | CE | O | Race code | — (log) |
| PID-11 | Patient Address | `label.hl7.pid.address` | XAD | O | Street^City^State^ZIP^Country | `patient.address` |
| PID-13 | Phone Number — Home | `label.hl7.pid.phoneHome` | XTN | O | Home phone number | `patient.phone` |
| PID-18 | Patient Account Number | `label.hl7.pid.accountNumber` | CX | O | Billing/account number | — (log) |
| PID-19 | SSN Number | `label.hl7.pid.ssn` | ST | O | Social security / national ID number | — (log, restricted) |

**Analyzer-specific notes:**
- Mindray: PID-3 populated from barcode scan; PID-5 from host query response
- Some analyzers (especially chemistry) send minimal PID with only PID-3

### 3.3 PV1 — Patient Visit

The Patient Visit segment provides encounter context. Optional for most analyzer integrations but used by some hospital-grade instruments.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| PV1-1 | Set ID | `label.hl7.pv1.setId` | SI | O | Sequence number | — |
| PV1-2 | Patient Class | `label.hl7.pv1.patientClass` | IS | R | `I`=Inpatient, `O`=Outpatient, `E`=Emergency, `P`=Preadmit | `order.patientClass` |
| PV1-3 | Assigned Patient Location | `label.hl7.pv1.location` | PL | O | Ward^Room^Bed^Facility | `order.location` |
| PV1-7 | Attending Doctor | `label.hl7.pv1.attendingDoctor` | XCN | O | Attending physician ID and name | `order.providerName` |
| PV1-8 | Referring Doctor | `label.hl7.pv1.referringDoctor` | XCN | O | Referring physician | — (log) |
| PV1-19 | Visit Number | `label.hl7.pv1.visitNumber` | CX | O | Encounter/visit identifier | `order.visitNumber` |
| PV1-44 | Admit Date/Time | `label.hl7.pv1.admitDateTime` | TS | O | Admission timestamp | — (log) |

### 3.4 ORC — Common Order

The Common Order segment provides order-level control information. Some analyzers include ORC; others skip directly to OBR.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| ORC-1 | Order Control | `label.hl7.orc.orderControl` | ID | R | `RE`=Observations to follow, `NW`=New order, `SC`=Status changed | — (routing) |
| ORC-2 | Placer Order Number | `label.hl7.orc.placerOrderNumber` | EI | O | LIS-assigned order number | `order.accessionNumber` |
| ORC-3 | Filler Order Number | `label.hl7.orc.fillerOrderNumber` | EI | O | Analyzer-assigned order number | `order.analyzerOrderId` |
| ORC-5 | Order Status | `label.hl7.orc.orderStatus` | ID | O | `CM`=Completed, `IP`=In Process, `SC`=Scheduled | `order.status` |
| ORC-9 | Date/Time of Transaction | `label.hl7.orc.transactionDateTime` | TS | O | When order event occurred | — (log) |
| ORC-12 | Ordering Provider | `label.hl7.orc.orderingProvider` | XCN | O | Ordering clinician | `order.providerName` |
| ORC-14 | Call Back Phone Number | `label.hl7.orc.callbackPhone` | XTN | O | Callback contact | — (log) |
| ORC-21 | Ordering Facility Name | `label.hl7.orc.orderingFacility` | XON | O | Ordering organization | `order.facilityName` |

**Analyzer-specific notes:**
- Mindray BC-5380: Sends ORC with ORC-1=`RE`, ORC-3=internal sequence
- Many chemistry analyzers omit ORC entirely

### 3.5 OBR — Observation Request

The Observation Request segment groups a set of related results (OBX segments) under a single test order. Each OBR corresponds to one panel or test order.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| OBR-1 | Set ID | `label.hl7.obr.setId` | SI | R | Sequence number (1, 2, 3...) | — |
| OBR-2 | Placer Order Number | `label.hl7.obr.placerOrderNumber` | EI | O | LIS accession number — key field for specimen matching | `order.accessionNumber` |
| OBR-3 | Filler Order Number | `label.hl7.obr.fillerOrderNumber` | EI | O | Analyzer-assigned order ID | `order.analyzerOrderId` |
| OBR-4 | Universal Service ID | `label.hl7.obr.universalServiceId` | CE | R | Panel/profile code: `code^text^codingSystem` — identifies the ordered test or panel | `order.panelCode` |
| OBR-7 | Observation Date/Time | `label.hl7.obr.observationDateTime` | TS | O | When specimen was observed/analyzed | `order.analysisDate` |
| OBR-8 | Observation End Date/Time | `label.hl7.obr.observationEndDateTime` | TS | O | End of observation period | — (log) |
| OBR-10 | Collector Identifier | `label.hl7.obr.collectorId` | XCN | O | Person who collected the specimen | — (log) |
| OBR-13 | Relevant Clinical Info | `label.hl7.obr.clinicalInfo` | ST | O | Clinical notes relevant to testing | `order.clinicalHistory` |
| OBR-14 | Specimen Received Date/Time | `label.hl7.obr.specimenReceivedDateTime` | TS | O | When lab received the specimen | `order.receivedDate` |
| OBR-15 | Specimen Source | `label.hl7.obr.specimenSource` | CM | O | Specimen type (source^additives^method^bodysite) | `order.sampleType` |
| OBR-16 | Ordering Provider | `label.hl7.obr.orderingProvider` | XCN | O | Ordering clinician | `order.providerName` |
| OBR-22 | Results Rpt/Status Chng Date/Time | `label.hl7.obr.resultsStatusChangeDateTime` | TS | O | When results became available | `order.resultDate` |
| OBR-24 | Diagnostic Service Section ID | `label.hl7.obr.diagnosticServiceId` | ID | O | `HM`=Hematology, `CH`=Chemistry, `MB`=Microbiology, `IM`=Immunology | `order.labSection` |
| OBR-25 | Result Status | `label.hl7.obr.resultStatus` | ID | O | `F`=Final, `P`=Preliminary, `C`=Corrected, `X`=Cancelled | `order.resultStatus` |
| OBR-26 | Parent Result | `label.hl7.obr.parentResult` | CM | O | Link to parent result (for reflex testing) | — (log) |
| OBR-27 | Quantity/Timing | `label.hl7.obr.quantityTiming` | TQ | O | Priority and frequency: `^^^S` = STAT, `^^^R` = Routine | `order.priority` |
| OBR-31 | Reason for Study | `label.hl7.obr.reasonForStudy` | CE | O | Coded reason / diagnosis | `order.diagnosis` |

**Analyzer-specific notes:**
- Mindray BC-5380: OBR-4 = `CBC^Complete Blood Count^L`, OBR-2 = barcode value
- Mindray BS-series: One OBR per panel, OBR-4 identifies the chemistry profile
- Specimen matching uses OBR-2 (placer order number) to match against OpenELIS accession numbers

### 3.6 OBX — Observation/Result

The Observation/Result segment carries individual test results. This is the HL7 equivalent of the ASTM Result record (R). Each OBX contains one result value.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| OBX-1 | Set ID | `label.hl7.obx.setId` | SI | R | Sequence number within the OBR group (1, 2, 3...) | — |
| OBX-2 | Value Type | `label.hl7.obx.valueType` | ID | R | Data type of OBX-5: `NM`=Numeric, `CE`=Coded, `ST`=String, `TX`=Text, `SN`=Structured Numeric, `FT`=Formatted Text | `result.valueType` |
| OBX-3 | Observation Identifier | `label.hl7.obx.observationId` | CE | R | Test code: `code^displayName^codingSystem` — **primary test identification field** | `result.testCode` (maps to test catalog) |
| OBX-4 | Observation Sub-ID | `label.hl7.obx.subId` | ST | O | Distinguishes multiple OBX with same OBX-3 (e.g., differential sub-populations) | `result.subId` |
| OBX-5 | Observation Value | `label.hl7.obx.observationValue` | varies | R | **The actual result value.** Type determined by OBX-2: numeric (`95.5`), coded (`POS^Positive^L`), string, structured numeric (`>^500`) | `result.value` |
| OBX-6 | Units | `label.hl7.obx.units` | CE | O | Unit of measure: `code^text^codingSystem`, e.g., `mg/dL^mg/dL^L` or `10*3/uL^10*3/uL^UCUM` | `result.unit` |
| OBX-7 | References Range | `label.hl7.obx.referenceRange` | ST | O | Normal range as string: `70-100`, `3.5-5.5`, `<0.5` | `result.referenceRange` |
| OBX-8 | Abnormal Flags | `label.hl7.obx.abnormalFlags` | ID | O | `N`=Normal, `L`=Low, `H`=High, `LL`=Critical Low, `HH`=Critical High, `A`=Abnormal, `AA`=Very Abnormal, `<`=Below low normal, `>`=Above high normal | `result.abnormalFlag` |
| OBX-11 | Observation Result Status | `label.hl7.obx.resultStatus` | ID | R | `F`=Final, `P`=Preliminary, `C`=Corrected, `R`=Results entered (not verified), `X`=Cancelled, `I`=Pending, `W`=Post original as wrong (retracted) | `result.status` |
| OBX-12 | Date Last Obs Normal Values | `label.hl7.obx.normalValuesDate` | TS | O | Date reference range was last verified | — (log) |
| OBX-14 | Date/Time of the Observation | `label.hl7.obx.observationDateTime` | TS | O | When this specific result was produced | `result.analysisDate` |
| OBX-15 | Producer's ID | `label.hl7.obx.producerId` | CE | O | Identifies the instrument that produced the result | `result.instrumentId` |
| OBX-16 | Responsible Observer | `label.hl7.obx.responsibleObserver` | XCN | O | Person responsible for result | `result.technicianId` |
| OBX-17 | Observation Method | `label.hl7.obx.observationMethod` | CE | O | Method used for the test | — (log) |

**Critical field details:**

**OBX-2 (Value Type)** determines how to parse OBX-5:

| OBX-2 | OBX-5 Format | Example | OpenELIS Storage |
|--------|-------------|---------|-----------------|
| `NM` | Plain numeric | `95.5` | Numeric result |
| `CE` | Coded element (`code^text^system`) | `POS^Positive^L` | Select list / coded value |
| `ST` | Free text string | `Escherichia coli` | Text result |
| `SN` | Structured numeric (`comparator^number^separator^number2`) | `>^500` or `<^0.1` | Numeric with flag |
| `TX` | Multi-line text | Comment block | Text result |
| `FT` | Formatted text with escape sequences | Rich text | Text result |

**OBX-3 (Observation Identifier)** encoding varies by manufacturer:

| Manufacturer | OBX-3 Pattern | Example |
|-------------|---------------|---------|
| Mindray | `code^displayName^codingSystem` | `WBC^White Blood Cell Count^L` |
| Sysmex | `code^displayName^99SYS` | `WBC^WBC^99SYS` |
| Roche | `LOINC^displayName^LN` | `6690-2^WBC^LN` |
| Generic | `localCode^text^L` | `GLU^Glucose^L` |

**OBX-5 Structured Numeric (SN type)** is particularly important for handling linearity flags:

```
SN format: comparator^num1^separator^num2

Examples:
  >^500        → "greater than 500"
  <^0.1        → "less than 0.1"
  >=^100       → "greater than or equal to 100"
  ^100^-^200   → "100 to 200" (range)
  ^1^:^16      → "1:16" (ratio, e.g., titers)
```

### 3.7 NTE — Notes and Comments

The Notes segment carries free-text comments attached to either an OBR (order-level) or OBX (result-level).

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| NTE-1 | Set ID | `label.hl7.nte.setId` | SI | O | Sequence number (1, 2, 3...) | — |
| NTE-2 | Source of Comment | `label.hl7.nte.source` | ID | O | `L`=Lab, `P`=Pathologist, `O`=Other | `note.source` |
| NTE-3 | Comment | `label.hl7.nte.comment` | FT | R | Free-text comment content — may span multiple NTE segments for long comments | `result.note` or `order.note` |
| NTE-4 | Comment Type | `label.hl7.nte.commentType` | CE | O | Coded comment type | `note.type` |

**Placement rules:**
- NTE after OBR → order-level comment (maps to `order.note`)
- NTE after OBX → result-level comment (maps to `result.note`)
- Multiple NTE segments are concatenated with newlines

### 3.8 MSA — Message Acknowledgment

The Message Acknowledgment segment is part of the ACK response that OpenELIS sends back to the analyzer.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| MSA-1 | Acknowledgment Code | `label.hl7.msa.ackCode` | ID | R | `AA`=Accept, `AE`=Error, `AR`=Reject | — (outbound) |
| MSA-2 | Message Control ID | `label.hl7.msa.messageControlId` | ST | R | Echoes MSH-10 from the original message | — (outbound) |
| MSA-3 | Text Message | `label.hl7.msa.textMessage` | ST | O | Human-readable error/status description | — (outbound) |
| MSA-6 | Error Condition | `label.hl7.msa.errorCondition` | CE | O | Coded error condition | — (outbound) |

### 3.9 ERR — Error Segment

Optionally included in ACK responses when MSA-1 = AE or AR.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| ERR-1 | Error Code and Location | `label.hl7.err.errorCodeLocation` | CM | R | Segment^Field^Component where error occurred | — (outbound) |

### 3.10 QRD — Query Definition (for Host Query)

Used when OpenELIS sends a query to retrieve pending results from an analyzer (bidirectional mode). This is the HL7 equivalent of the ASTM Q (Query) record.

| Position | Field Name | i18n Key | Data Type | Req | Description | OpenELIS Target |
|----------|-----------|----------|-----------|-----|-------------|-----------------|
| QRD-1 | Query Date/Time | `label.hl7.qrd.queryDateTime` | TS | R | When query was issued | — (outbound) |
| QRD-2 | Query Format Code | `label.hl7.qrd.formatCode` | ID | R | `R`=Record-oriented, `D`=Display-oriented | — (outbound) |
| QRD-3 | Query Priority | `label.hl7.qrd.priority` | ID | R | `D`=Deferred, `I`=Immediate | — (outbound) |
| QRD-4 | Query ID | `label.hl7.qrd.queryId` | ST | R | Unique query identifier | — (outbound) |
| QRD-7 | Quantity Limited Request | `label.hl7.qrd.quantityLimited` | CQ | R | Max results to return | — (outbound) |
| QRD-8 | Who Subject Filter | `label.hl7.qrd.whoSubjectFilter` | XCN | R | Patient/specimen identifier for query | — (outbound) |
| QRD-9 | What Subject Filter | `label.hl7.qrd.whatSubjectFilter` | CE | R | What to query: `RES`=Results, `ORD`=Orders | — (outbound) |
| QRD-10 | What Department Data Code | `label.hl7.qrd.departmentCode` | CE | O | Department filter | — (outbound) |

**Query message structure (QRY^R02):**
```
MSH|^~\&|OpenELIS||BC-5380||20260227120000||QRY^R02|Q001|P|2.3.1
QRD|20260227120000|R|I|Q001||RD^10^RD|ALL|RES|
```

---

## 4. HL7 ↔ ASTM Field Crosswalk

This crosswalk maps equivalent fields between the two protocols, enabling shared concepts in the UI while respecting protocol-specific field references.

### 4.1 Core Data Crosswalk

| Concept | ASTM Field | HL7 Field | Notes |
|---------|-----------|-----------|-------|
| **Message Timestamp** | H.14 | MSH-7 | |
| **Sender Name** | H.5 | MSH-3 | ASTM=string, HL7=HD type |
| **Processing ID** | H.12 | MSH-11 | Same values (P, D, T) |
| **Protocol Version** | H.13 | MSH-12 | |
| **Patient ID** | P.4 | PID-3 | ASTM=lab ID, HL7=CX type |
| **Patient Name** | P.6 | PID-5 | ASTM=Last^First, HL7=XPN type |
| **Date of Birth** | P.8 | PID-7 | |
| **Patient Sex** | P.9 | PID-8 | Same value set (M, F, U) |
| **Specimen ID** | O.3 | OBR-2 | **Primary specimen match field** |
| **Test Code** | R.3 (component 4) | OBX-3.1 | ASTM=^^^CODE, HL7=code^text^system |
| **Test Display Name** | — | OBX-3.2 | ASTM doesn't carry display name in R record |
| **Result Value** | R.4 | OBX-5 | HL7 type-aware via OBX-2 |
| **Result Units** | R.5 | OBX-6 | ASTM=string, HL7=CE type |
| **Reference Range** | R.6 | OBX-7 | Same format (e.g., `70-100`) |
| **Abnormal Flag** | R.7 | OBX-8 | Same value set (N, L, H, LL, HH, A) |
| **Result Status** | R.8 | OBX-11 | HL7 adds W (retracted) |
| **Analysis Timestamp** | R.13 | OBX-14 | |
| **Comment Text** | C.4 | NTE-3 | |
| **Comment Source** | C.3 | NTE-2 | Same value set (L, I/O, P) |
| **Termination Status** | L.3 | MSA-1 | ASTM=N/T/R/E, HL7=AA/AE/AR |
| **Order Priority** | O.6 | OBR-27 | ASTM=single char, HL7=TQ type |
| **Specimen Type** | O.16 | OBR-15 | |
| **Clinical Info** | O.14 | OBR-13 | |

### 4.2 HL7-Only Fields (No ASTM Equivalent)

| HL7 Field | Description | Significance |
|-----------|-------------|--------------|
| OBX-2 (Value Type) | Declares result data type | Enables type-safe parsing; ASTM infers type from context |
| OBX-4 (Sub-ID) | Distinguishes multiple results with same test code | Used for differential sub-populations |
| ORC (entire segment) | Explicit order control | ASTM has implicit order hierarchy |
| PV1 (entire segment) | Patient visit/encounter context | ASTM has no encounter segment |
| OBR-24 (Diagnostic Service) | Lab section identifier | Used for routing |
| OBX-15 (Producer's ID) | Specific instrument identifier | Useful for multi-module systems |
| MSH-10 (Message Control ID) | Unique message ID for ACK | ASTM uses transport-level ACK |

### 4.3 ASTM-Only Fields (No HL7 Equivalent)

| ASTM Field | Description | Significance |
|-----------|-------------|--------------|
| H.2 (Delimiter Definition) | Explicit delimiter config | HL7 has fixed MSH-1/MSH-2 |
| L (Terminator Record) | Message termination with status | HL7 uses MLLP framing for message boundaries |
| Q (Query Record) | Inline query in message stream | HL7 uses separate QRY message type |
| M (Manufacturer Record) | Vendor-specific extension | HL7 uses Z-segments for extensions |

---

## 5. New Functional Requirements

### FR-22: MLLP Connection Configuration

The system shall support MLLP (Minimal Lower Layer Protocol) connection configuration for HL7 analyzers. MLLP replaces the ASTM ENQ/EOT transport layer.

#### FR-22.1: Connection Modes

| Mode | Behavior | Required Fields |
|------|----------|----------------|
| **Server (Listener)** | OpenELIS listens on a configured MLLP port; analyzer connects to OpenELIS | Listen Port |
| **Client (Initiator)** | OpenELIS connects to the analyzer at a configured IP and port | Analyzer IP Address, Analyzer Port |

**Default:** Server mode. This is the standard pattern for Mindray BC-5380, BS-series, and most clinical HL7 analyzers.

**Rationale:** Identical to ASTM FR-14 — most analyzers connect to the LIS, not the other way around. However, MLLP uses a persistent TCP connection rather than ASTM's session-oriented ENQ/EOT framing, which changes timeout and keepalive behavior.

#### FR-22.2: MLLP-Specific Configuration Fields

| Field | i18n Key | Type | Default | Description |
|-------|----------|------|---------|-------------|
| Connection Role | `label.hl7.connectionRole` | Dropdown | Server | Server (Listen) / Client (Connect) |
| Listen Port | `label.hl7.listenPort` | Number | — | Port for MLLP listener (Server mode) |
| Analyzer IP Address | `label.hl7.analyzerIpAddress` | Text | — | Analyzer IP (Client mode) |
| Analyzer Port | `label.hl7.analyzerPort` | Number | — | Analyzer port (Client mode) |
| Connection Timeout | `label.hl7.connectionTimeout` | Number (sec) | 30 | TCP connection timeout |
| Idle Timeout | `label.hl7.idleTimeout` | Number (sec) | 300 | Close connection after inactivity (0 = keep alive) |
| Max Connections | `label.hl7.maxConnections` | Number | 5 | Maximum concurrent MLLP connections (Server mode) |
| Character Encoding | `label.hl7.characterEncoding` | Dropdown | UTF-8 | Character encoding for HL7 messages: `UTF-8`, `ISO-8859-1`, `ASCII` |

**Differences from ASTM FR-14:**

| Aspect | ASTM | HL7 (MLLP) |
|--------|------|-------------|
| Framing | ENQ/EOT session boundaries | VT/FS/CR message boundaries |
| Connection persistence | Session-based (connect per transfer) | Persistent TCP (may stay open) |
| Retry mechanism | NAK retries (configurable count) | ACK-based (see FR-23) |
| Multi-connection | Single session at a time | Multiple concurrent connections possible |
| Idle handling | Session ends with EOT | Configurable idle timeout |

**No NAK retry count** — HL7 uses application-level ACK instead of transport-level NAK. If the analyzer doesn't receive an ACK within its own timeout, it retransmits the message. OpenELIS handles deduplication via MSH-10 (Message Control ID).

#### FR-22.3: Shared MLLP Listener Service

For Server mode, HL7 analyzers **share a single MLLP listener** on a common port. The listener routes incoming messages to the correct analyzer configuration based on MSH-3 (Sending Application).

| Field | i18n Key | Type | Description |
|-------|----------|------|-------------|
| Sender Application Filter | `label.hl7.senderAppFilter` | Text | Expected MSH-3 value — used to route messages from the shared listener to this analyzer config |
| Sender Facility Filter | `label.hl7.senderFacilityFilter` | Text | Optional MSH-4 filter for multi-site routing |

**Routing logic:**
1. MLLP listener receives message on shared port
2. Parse MSH-3 (Sending Application) from message header
3. Match MSH-3 against registered analyzer configurations
4. If match found → route to that analyzer's parser
5. If no match → log warning, send ACK with AE code

**Alternative:** Dedicated port per analyzer (each analyzer config gets its own listen port). Administrator chooses between shared listener or dedicated port via `label.hl7.listenerMode` dropdown:
- `SHARED` — uses global MLLP port, routes by MSH-3
- `DEDICATED` — per-analyzer listen port (same as ASTM model)

#### FR-22.4: UI Behavior

```
┌─────────────────────────────────────────────────────────────────┐
│ MLLP Connection Configuration                                    │
│                                                                   │
│  Connection Role:  [● Server (Listen)  ○ Client (Connect)]       │
│                                                                   │
│  ── Server Mode ──────────────────────────────────────────────── │
│  Listener Mode:    [Shared MLLP Port ▼]                          │
│  Sender App (MSH-3): [BC-5380_________]                          │
│  Sender Facility:    [________________] (optional)               │
│                                                                   │
│  ── OR if Dedicated ──────────────────────────────────────────── │
│  Listen Port:      [5000______________]                          │
│                                                                   │
│  ── Connection Settings ──────────────────────────────────────── │
│  Connection Timeout:  [30_] seconds                              │
│  Idle Timeout:        [300] seconds (0 = keep alive)             │
│  Max Connections:     [5__]                                      │
│  Character Encoding:  [UTF-8 ▼]                                  │
│                                                                   │
│  Bidirectional (Host Query): [○ Off ● On]                        │
│  ℹ️ When enabled, OpenELIS can send QRY^R02 messages to          │
│     retrieve pending results from the analyzer.                   │
└─────────────────────────────────────────────────────────────────┘
```

**Carbon components:** `<RadioButtonGroup>` for connection role, `<Dropdown>` for listener mode, `<TextInput>` for MSH-3 filter, `<NumberInput>` for ports/timeouts, `<Toggle>` for bidirectional.

---

### FR-23: HL7 ACK Generation Configuration

The system shall allow administrators to configure how OpenELIS generates HL7 ACK (Acknowledgment) messages in response to received ORU^R01 messages.

**Rationale:** This is HL7-specific — ASTM uses transport-level ENQ/ACK/NAK with no application-layer acknowledgment content. HL7 ACK messages carry structured information (MSA segment) that analyzers use to determine message delivery status.

#### FR-23.1: ACK Mode

| Mode | i18n Key | Behavior | Use Case |
|------|----------|----------|----------|
| Always Accept | `label.hl7.ack.alwaysAccept` | Send AA for all parseable messages, regardless of mapping errors | Default — ensures analyzer queue doesn't back up |
| Accept on Success Only | `label.hl7.ack.successOnly` | Send AA only if all OBX codes are mapped; send AE if unmapped codes found | Strict mode — forces administrator to map all codes |
| Accept with Errors | `label.hl7.ack.acceptWithErrors` | Send AA if ≥1 OBX is mapped; send AE only if zero OBX codes are mapped | Balanced — accepts partial results |
| Never (Suppress ACK) | `label.hl7.ack.never` | Do not send ACK responses | Rare — for analyzers that don't expect ACK |

**Default:** Always Accept.

#### FR-23.2: ACK Configuration Fields

| Field | i18n Key | Type | Default | Description |
|-------|----------|------|---------|-------------|
| ACK Mode | `label.hl7.ack.mode` | Dropdown | Always Accept | When to send AA vs AE/AR |
| ACK Sending Application | `label.hl7.ack.sendingApp` | Text | `OpenELIS` | Value for MSH-3 in ACK response |
| ACK Delay (ms) | `label.hl7.ack.delayMs` | Number | 0 | Milliseconds to wait before sending ACK (some analyzers need a delay) |
| Include Error Detail | `label.hl7.ack.includeErrorDetail` | Toggle | On | Include ERR segment and MSA-3 text in error ACKs |

#### FR-23.3: ACK Template

The system generates ACK messages using this template:

```
MSH|^~\&|{ackSendingApp}||{originalMSH3}|{originalMSH4}|{timestamp}||ACK^R01|{ackControlId}|P|2.3.1
MSA|{ackCode}|{originalMSH10}|{errorText}
[ERR|{errorLocation}]
```

Variables:
- `{ackSendingApp}` — from configuration (default: `OpenELIS`)
- `{originalMSH3}` / `{originalMSH4}` — echoed from received message
- `{ackCode}` — `AA`, `AE`, or `AR` based on ACK mode and parse result
- `{originalMSH10}` — echoed from received message MSH-10
- `{errorText}` — human-readable error description (only if Include Error Detail is on)
- `{errorLocation}` — segment^field^component of first error (only for AE/AR with error detail)

#### FR-23.4: Duplicate Message Detection

Because HL7 analyzers may retransmit messages when no ACK is received:

| Field | i18n Key | Type | Default | Description |
|-------|----------|------|---------|-------------|
| Dedup Enabled | `label.hl7.ack.dedupEnabled` | Toggle | On | Detect and reject duplicate messages |
| Dedup Window | `label.hl7.ack.dedupWindowMinutes` | Number (min) | 60 | Time window for duplicate detection |

**Dedup logic:** If MSH-10 (Message Control ID) has been seen within the dedup window, respond with AA but do not re-process the message. Log as `label.hl7.ack.duplicateDetected`.

#### FR-23.5: UI Presentation

```
┌─────────────────────────────────────────────────────────────────┐
│ ACK Response Configuration                                   [?] │
│                                                                   │
│  ACK Mode:         [Always Accept ▼]                             │
│  ℹ️ Sends AA (Accept) for all parseable messages. Unmapped test   │
│     codes are logged but do not block acknowledgment.             │
│                                                                   │
│  Sending Application: [OpenELIS_______]                          │
│  ACK Delay:           [0___] ms                                  │
│  Include Error Detail: [On ▼]                                    │
│                                                                   │
│  ── Duplicate Detection ──────────────────────────────────────── │
│  Enable Dedup:     [● On  ○ Off]                                 │
│  Dedup Window:     [60__] minutes                                │
└─────────────────────────────────────────────────────────────────┘
```

**Carbon components:** `<Dropdown>` for ACK mode, `<TextInput>` for sending app, `<NumberInput>` for delay/window, `<Toggle>` for dedup, `<InlineNotification kind="info">` for mode description.

---

### FR-24: HL7 QC Sample Identification Rules

The system shall allow administrators to configure rules that identify which incoming HL7 results are quality control (QC) samples versus patient samples.

**Rationale:** Identical to ASTM FR-15. The Analyzer Import workflow evaluates QC results before allowing patient result acceptance. QC identification rules are protocol-agnostic in concept but use HL7 field references instead of ASTM field references.

#### FR-24.1: QC Rule Types

| Rule Type | i18n Key | Description | Configuration Fields |
|-----------|----------|-------------|---------------------|
| Segment Field Equals | `label.hl7.qcRule.fieldEquals` | HL7 segment field equals a specific value | Segment-Field reference (e.g., `PID-5.1`), Expected value |
| Specimen ID Prefix | `label.hl7.qcRule.specimenIdPrefix` | Specimen ID (OBR-2) starts with a string | Prefix string |
| Specimen ID Pattern | `label.hl7.qcRule.specimenIdRegex` | Specimen ID matches a regex pattern | Regex pattern |
| Segment Field Contains | `label.hl7.qcRule.fieldContains` | HL7 segment field contains a substring | Segment-Field reference, Substring |
| Patient Name Pattern | `label.hl7.qcRule.patientNamePattern` | PID-5 (Patient Name) matches a pattern | Regex pattern |

**New rule type — Patient Name Pattern:** HL7 analyzers commonly identify QC samples by sending specific patient names (e.g., `QC Control^Normal Level 1`). This rule type matches against PID-5 content, which has no direct ASTM equivalent because ASTM P.6 is rarely populated by analyzers for QC samples.

#### FR-24.2: Common HL7 QC Identification Patterns

| Analyzer | QC Pattern | Rule Config |
|----------|-----------|-------------|
| Mindray BC-5380 | Specimen ID starts with `CTRL-` | Specimen ID Prefix = `CTRL-` |
| Mindray BC-5380 | Patient name contains `QC Control` | Patient Name Pattern = `.*QC Control.*` |
| Mindray BS-series | OBR-2 starts with `QC` | Specimen ID Prefix = `QC` |
| Sysmex XN | PID-3 starts with `QC-` | Specimen ID Prefix = `QC-` |
| Roche cobas | OBR-15 (Specimen Source) contains `CTRL` | Segment Field Contains, field=`OBR-15`, substring=`CTRL` |

#### FR-24.3: Rule Evaluation

Identical to ASTM FR-15.2:
- Rules are evaluated with **OR** logic — any matching rule identifies the sample as QC
- At least one QC rule must be configured before an analyzer can be activated
- If no rules are configured, the system warns: `label.hl7.qcRule.noneConfigured`

#### FR-24.4: QC Rule Builder UI

```
┌─────────────────────────────────────────────────────────────────┐
│ QC Sample Identification                                    [?]  │
│                                                                   │
│  A sample is identified as QC if ANY of these rules match:       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Rule 1                                             [🗑️]    │  │
│  │ Type: [Specimen ID Prefix ▼]                                │  │
│  │ Prefix: [CTRL-_______]                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Rule 2                                             [🗑️]    │  │
│  │ Type: [Patient Name Pattern ▼]                              │  │
│  │ Pattern: [.*QC Control.*]                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [+ Add QC Rule]                            [Test QC Rules]      │
└─────────────────────────────────────────────────────────────────┘
```

#### FR-24.5: HL7 Field Reference Selector

When the rule type requires a segment-field reference (Field Equals, Field Contains), the UI shows a dropdown with common HL7 fields grouped by segment:

```
┌──────────────────────────────────────┐
│ HL7 Field:                           │
│ ┌──────────────────────────────────┐ │
│ │ MSH — Message Header             │ │
│ │   MSH-3  Sending Application     │ │
│ │   MSH-4  Sending Facility        │ │
│ │   MSH-11 Processing ID           │ │
│ │ PID — Patient Identification     │ │
│ │   PID-3  Patient ID (Internal)   │ │
│ │   PID-5  Patient Name            │ │
│ │   PID-8  Sex                     │ │
│ │ OBR — Observation Request        │ │
│ │   OBR-2  Placer Order Number     │ │
│ │   OBR-4  Universal Service ID    │ │
│ │   OBR-15 Specimen Source         │ │
│ │   OBR-24 Diagnostic Service ID   │ │
│ │   OBR-25 Result Status           │ │
│ │ OBX — Observation/Result         │ │
│ │   OBX-3  Observation Identifier  │ │
│ │   OBX-8  Abnormal Flags          │ │
│ │   OBX-11 Result Status           │ │
│ │ [Custom Field...]                │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

The "Custom Field..." option allows typing an arbitrary segment-field reference (e.g., `PV1-3.2`) for advanced use.

---

### FR-25: HL7 Value Transformation Rules

The system shall support configurable transformation rules for HL7 result values. This is the HL7 equivalent of ASTM FR-16, with identical transformation types but adapted parsing behavior for HL7 data types.

#### FR-25.1: Transformation Types

Identical to ASTM FR-16.1:

| Type | i18n Key | Description | Example |
|------|----------|-------------|---------|
| Pass-through | `label.analyzer.transform.passThrough` | Value stored as-is (default) | `8.5` → `8.5` |
| Greater/Less Flag | `label.analyzer.transform.greaterLessFlag` | Extract operator and value | `>^500` → value=`500`, flag=`>` |
| Value Map | `label.analyzer.transform.valueMap` | Map coded values | `POS^Positive^L` → `Positive` |
| Threshold Classify | `label.analyzer.transform.thresholdClassify` | Numeric → label | `2.31` → `HIGH_CONFIDENCE` |
| Coded Lookup | `label.analyzer.transform.codedLookup` | Text → master table | `Escherichia coli` → organism code |

#### FR-25.2: HL7 Value Type-Aware Parsing

Unlike ASTM (where all result values are plain strings), HL7 declares the value type in **OBX-2**. The transformation engine must handle each type:

| OBX-2 | Parsing Behavior | Applicable Transformations |
|--------|-----------------|---------------------------|
| `NM` | Extract plain number from OBX-5 | Pass-through, Greater/Less Flag, Threshold Classify |
| `CE` | Extract code from OBX-5.1, text from OBX-5.2 | Value Map (maps OBX-5.1 code), Coded Lookup |
| `ST` | Extract plain text from OBX-5 | Pass-through, Value Map, Coded Lookup |
| `SN` | Parse structured numeric: comparator^num1^sep^num2 | **Auto Greater/Less Flag** (see FR-25.3) |
| `TX` | Extract text, concatenate if multi-segment | Pass-through |
| `FT` | Extract text, strip formatting escapes | Pass-through |

#### FR-25.3: Automatic SN (Structured Numeric) Handling

When OBX-2 = `SN`, the parser **automatically** extracts comparator and numeric components without requiring the Greater/Less Flag transformation to be explicitly configured:

```
OBX|6|SN|CHOL^Total Cholesterol^L||>^500|...

Parsed as:
  comparator = ">"
  value = 500
  separator = (none)
  value2 = (none)

Stored as:
  result.value = "500"
  result.flag = ">"
```

For SN values with separators (ranges, ratios):

```
OBX|7|SN|TITER^Titer^L||^1^:^16|...

Parsed as:
  value = "1:16"
  flag = (none)

Stored as:
  result.value = "1:16"
```

**Configuration:**

| Field | i18n Key | Default | Description |
|-------|----------|---------|-------------|
| SN Auto-Parse | `label.hl7.transform.snAutoParse` | On | Automatically extract comparator from SN values |
| SN Range Format | `label.hl7.transform.snRangeFormat` | `{num1}{sep}{num2}` | How to store SN range/ratio values |

#### FR-25.4: CE (Coded Element) Value Map Integration

When OBX-2 = `CE`, the Value Map transformation maps **OBX-5.1** (the code component) to OpenELIS select list options:

```
OBX|1|CE|HIVAG^HIV Ag/Ab Combo^L||NEG^Negative^L|...

Value Map:
  NEG → Negative
  POS → Positive
  IND → Indeterminate

Result stored: "Negative" (from OBX-5.1 code "NEG")
```

The mapping uses the **code** (OBX-5.1), not the display text (OBX-5.2), because display text may vary between firmware versions while codes are stable.

#### FR-25.5: Configuration UI

Identical to ASTM FR-16 — the transformation dropdown appears in the test code mapping table. The Value Map sub-table, Threshold Classify range table, and Coded Lookup selector all use the same Carbon components.

**HL7-specific addition:** An info banner when OBX-2 is detected as `SN`:

`label.hl7.transform.snAutoInfo` = "This test sends Structured Numeric (SN) values. Greater/Less operators are automatically extracted from the SN format."

---

### FR-26: HL7 Field Extraction Configuration

The system shall allow administrators to override the default HL7 segment-field positions used for extracting key data elements.

**Rationale:** Identical to ASTM FR-17. While most HL7 analyzers use standard field positions, some instruments use non-standard locations for key data. The HL7 field extraction configuration uses Segment-Field.Component notation instead of ASTM Record.Position notation.

#### FR-26.1: Configurable Fields

| Parameter | i18n Key | Default | Description |
|-----------|----------|---------|-------------|
| Specimen ID Field | `label.hl7.extract.specimenIdField` | `OBR-2` | Where to find the sample accession number |
| Test Code Field | `label.hl7.extract.testCodeField` | `OBX-3` | Where to find the test code |
| Test Code Component | `label.hl7.extract.testCodeComponent` | `1` | Which component of OBX-3 contains the code (1=code, 2=text) |
| Test Display Name Component | `label.hl7.extract.testDisplayComponent` | `2` | Which component of OBX-3 has the display name |
| Result Value Field | `label.hl7.extract.resultValueField` | `OBX-5` | Where to find the result measurement |
| Result Value Type Field | `label.hl7.extract.valueTypeField` | `OBX-2` | Where to find the value type indicator |
| Result Units Field | `label.hl7.extract.resultUnitsField` | `OBX-6` | Where to find the units |
| Units Component | `label.hl7.extract.unitsComponent` | `1` | Which component of OBX-6 (1=code, 2=text) |
| Abnormal Flag Field | `label.hl7.extract.abnormalFlagField` | `OBX-8` | Where to find the abnormal indicator |
| Result Status Field | `label.hl7.extract.resultStatusField` | `OBX-11` | Final/Preliminary status |
| Result Timestamp Field | `label.hl7.extract.resultTimestampField` | `OBX-14` | When the result was produced |
| Sender Application Field | `label.hl7.extract.senderAppField` | `MSH-3` | Instrument identifier in the Header |
| Patient ID Field | `label.hl7.extract.patientIdField` | `PID-3` | Patient identifier |
| Patient ID Component | `label.hl7.extract.patientIdComponent` | `1` | Which component of PID-3 |

#### FR-26.2: HL7 vs ASTM Extraction Differences

| Aspect | ASTM Extraction | HL7 Extraction |
|--------|----------------|----------------|
| **Notation** | `R.4` (Record.Position) | `OBX-5` (Segment-Field) |
| **Component access** | Single component index | Segment-Field.Component (e.g., `OBX-3.1`) |
| **Value type** | Inferred from context | Declared in OBX-2 |
| **Repeating fields** | `\` delimiter | `~` repetition separator |
| **Test code** | `R.3` component 4 (^^^CODE) | `OBX-3.1` (first component is code) |

#### FR-26.3: UI Presentation

Display as a collapsible `<Accordion>` section labeled `label.hl7.extract.advanced` ("Advanced Field Extraction"). **Collapsed by default.**

```
┌─────────────────────────────────────────────────────────────────┐
│ ▸ Advanced Field Extraction                                      │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │ ℹ️ These defaults work for most HL7 analyzers. Only change    ││
│ │    them if your instrument uses non-standard field positions.  ││
│ └───────────────────────────────────────────────────────────────┘│
│                                                                   │
│  Specimen ID:      [OBR-2__] . Component: [1_]                   │
│  Test Code:        [OBX-3__] . Component: [1_] (code)            │
│  Test Display:     [OBX-3__] . Component: [2_] (display name)    │
│  Result Value:     [OBX-5__]                                     │
│  Value Type:       [OBX-2__]                                     │
│  Units:            [OBX-6__] . Component: [1_]                   │
│  Abnormal Flag:    [OBX-8__]                                     │
│  Result Status:    [OBX-11_]                                     │
│  Timestamp:        [OBX-14_]                                     │
│  Sender App:       [MSH-3__]                                     │
│  Patient ID:       [PID-3__] . Component: [1_]                   │
└─────────────────────────────────────────────────────────────────┘
```

Each field shows the default value as placeholder text. If the user hasn't overridden a value, the default is used.

---

### FR-27: HL7 Result Aggregation Mode

The system shall support configurable result aggregation behavior to handle HL7 instruments that transmit results across multiple messages.

#### FR-27.1: Aggregation Modes

| Mode | i18n Key | Behavior | Use Case |
|------|----------|----------|----------|
| Per Message | `label.hl7.aggregation.perMessage` | Each ORU^R01 message = one import batch | Default; most analyzers |
| By Specimen | `label.hl7.aggregation.bySpecimen` | Collect messages sharing the same OBR-2 (Placer Order Number) within a time window | Instruments sending one panel per message |
| By OBR Group | `label.hl7.aggregation.byObrGroup` | Treat each OBR segment (and its child OBX segments) within a single message as a separate batch | Multi-panel messages where panels should import independently |

**Difference from ASTM FR-18:** The ASTM "By Session" mode (ENQ→EOT boundaries) has no HL7 equivalent because MLLP doesn't have session framing. Instead, the HL7-specific "By OBR Group" mode handles the common case where a single HL7 message contains multiple OBR groups (multiple panels).

#### FR-27.2: Configuration

| Field | i18n Key | Type | Default |
|-------|----------|------|---------|
| Aggregation Mode | `label.hl7.aggregation.mode` | Dropdown | Per Message |
| Aggregation Window | `label.hl7.aggregation.windowSeconds` | Number (sec) | 30 |

The aggregation window is only shown when mode = By Specimen.

#### FR-27.3: Multi-OBR Message Handling

A single HL7 message can contain multiple OBR groups:

```
MSH|...
PID|...
OBR|1|LAB-001||CBC^Complete Blood Count^L|...
OBX|1|NM|WBC^...|...
OBX|2|NM|RBC^...|...
OBR|2|LAB-001||CHEM^Chemistry Panel^L|...
OBX|1|NM|GLU^...|...
OBX|2|NM|BUN^...|...
```

In **Per Message** mode: all OBX from both OBR groups appear as one batch.
In **By OBR Group** mode: OBR-1 (CBC) and OBR-2 (CHEM) are separate import batches.

---

### FR-28: HL7 Abnormal Flag Mapping

The system shall allow administrators to customize the mapping of HL7 OBX-8 abnormal flag values to OpenELIS interpretations.

#### FR-28.1: Default Mapping

**Default mapping (pre-populated):**

| OBX-8 Flag | OpenELIS Interpretation | i18n Key |
|------------|------------------------|----------|
| `N` | Normal | `label.analyzer.flag.normal` |
| `L` | Low | `label.analyzer.flag.low` |
| `H` | High | `label.analyzer.flag.high` |
| `LL` | Critical Low | `label.analyzer.flag.criticalLow` |
| `HH` | Critical High | `label.analyzer.flag.criticalHigh` |
| `A` | Abnormal | `label.analyzer.flag.abnormal` |
| `AA` | Very Abnormal | `label.hl7.flag.veryAbnormal` |
| `<` | Below Low Normal | `label.hl7.flag.belowLowNormal` |
| `>` | Above High Normal | `label.hl7.flag.aboveHighNormal` |
| (empty) | Normal | `label.analyzer.flag.empty` |

**HL7 additions vs ASTM:** `AA` (Very Abnormal), `<` (Below Low Normal), `>` (Above High Normal) are defined in HL7 Table 0078 but not in ASTM.

#### FR-28.2: Shared i18n Keys

Flag mapping uses shared `label.analyzer.flag.*` tags for flags common to both protocols (N, L, H, LL, HH, A). HL7-only flags use `label.hl7.flag.*` tags.

#### FR-28.3: UI

Identical to ASTM FR-19 — editable table with default rows pre-populated. "Add Row" button for custom flags.

---

### FR-29: HL7 Message Simulator

The system shall provide a message simulation tool that allows administrators to validate their HL7 analyzer configuration against real or sample HL7 messages without requiring a live analyzer connection.

**Rationale:** Identical to ASTM FR-20. This is the single most critical feature for making the generic HL7 plugin viable without developer support.

#### FR-29.1: Simulator Interface

```
┌─────────────────────────────────────────────────────────────────┐
│ Message Simulator                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Paste HL7 Message:                                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ MSH|^~\&|BC-5380||OpenELIS||20260227120000||ORU^R01|MSG001│  │
│  │ PID|1||LAB-2026-001^^^L||Smith^John||19850315|M            │  │
│  │ OBR|1|LAB-2026-001||CBC^Complete Blood Count^L             │  │
│  │ OBX|1|NM|WBC^White Blood Cell Count^L||7.5|10*3/uL|4-11|N │  │
│  │ OBX|2|NM|RBC^Red Blood Cell Count^L||4.85|10*6/uL|4.5-5.5 │  │
│  │ OBX|3|NM|HGB^Hemoglobin^L||14.2|g/dL|13-17|N              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│                                        [Clear]  [Parse ▶]       │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Parse Results                                                    │
│                                                                   │
│  Instrument:  BC-5380 (from MSH-3)                               │
│  Message ID:  MSG001 (from MSH-10)                               │
│  Specimen:    LAB-2026-001 (from OBR-2)                          │
│  Panel:       CBC — Complete Blood Count (from OBR-4)            │
│  QC Status:   Patient Sample ✅ (no QC rules matched)            │
│                                                                   │
│  ┌──────────┬──────┬──────────┬───────┬───────┬──────┬────────┐ │
│  │Analyzer  │Type  │OpenELIS  │Value  │Units  │Flag  │Xform   │ │
│  │Code      │(OBX2)│Test      │       │       │      │        │ │
│  ├──────────┼──────┼──────────┼───────┼───────┼──────┼────────┤ │
│  │WBC       │NM    │WBC       │7.5    │10*3/uL│N     │—       │ │
│  │RBC       │NM    │RBC       │4.85   │10*6/uL│N     │—       │ │
│  │HGB       │NM    │Hemoglobin│14.2   │g/dL   │N     │—       │ │
│  └──────────┴──────┴──────────┴───────┴───────┴──────┴────────┘ │
│                                                                   │
│  ⚠️ 0 warnings  ❌ 0 errors                                     │
└─────────────────────────────────────────────────────────────────┘
```

**HL7-specific differences from ASTM simulator (FR-20):**
- Shows **Message ID** (MSH-10) — not present in ASTM
- Shows **Panel/Profile** (OBR-4) — ASTM has implicit test grouping via O record
- Shows **OBX-2 Value Type** column — ASTM doesn't declare value types
- Parses segment-based structure instead of record-based structure
- Generates **ACK preview** showing what ACK response would be sent

#### FR-29.2: Simulator Features

| Feature | Description |
|---------|-------------|
| **Parse** | Run the pasted HL7 message through the generic parser using current config |
| **Segment extraction display** | Show which HL7 segments/fields were extracted and their values |
| **Test code matching** | Show which OBX-3 codes matched to OpenELIS tests, highlight unmatched |
| **QC identification** | Show QC rule evaluation and specimen classification |
| **Value transformation** | Show before/after for transformations, including SN auto-parse |
| **Value type validation** | Verify OBX-2 type matches expected transformation type |
| **ACK preview** | Show the ACK message that would be generated |
| **OBR group display** | Show how results group under OBR panels |
| **Error display** | Parse errors, missing required segments, type mismatches |

#### FR-29.3: ACK Preview

Below the results table, display the ACK that would be generated:

```
┌─────────────────────────────────────────────────────────────────┐
│ ACK Response Preview                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ MSH|^~\&|OpenELIS||BC-5380||20260227120001||ACK^R01|...   │  │
│  │ MSA|AA|MSG001                                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│  Status: ✅ Application Accept (all codes mapped)                │
└─────────────────────────────────────────────────────────────────┘
```

#### FR-29.4: Simulator Output States

| State | i18n Key | Display |
|-------|----------|---------|
| No message | `label.hl7.simulator.empty` | "Paste an HL7 message above and click Parse to validate your configuration" |
| Parse success | `label.hl7.simulator.success` | Green notification + results table + ACK preview |
| Parse with warnings | `label.hl7.simulator.warnings` | Yellow notification + results + warnings + ACK preview |
| Parse failure | `label.hl7.simulator.error` | Red notification + error details + ACK preview (AE/AR) |
| Invalid format | `label.hl7.simulator.invalidFormat` | Red notification: "Message does not appear to be valid HL7. Expected MSH segment header." |

#### FR-29.5: Carbon Components

- `<TextArea rows={10}>` for message input (monospace font)
- `<DataTable>` for parsed results (includes OBX-2 type column)
- `<InlineNotification>` for success/warning/error states
- `<Tag>` for matched/unmatched test codes and value types
- `<CodeSnippet kind="multi">` for ACK preview
- `<Accordion>` for segment extraction detail

---

### FR-30: HL7 Auto-Detect Test Codes

The system shall support passive auto-detection of test codes from live HL7 messages received from an analyzer.

**Rationale:** Identical to ASTM FR-21. Complements active Query Analyzer (QRY^R02) with passive detection from incoming ORU^R01 messages.

#### FR-30.1: Behavior

- When enabled, the generic HL7 parser logs all OBX-3 codes seen in incoming messages that are **not yet mapped** in the test code mapping table
- Detected codes capture: OBX-3.1 (code), OBX-3.2 (display name), OBX-3.3 (coding system), OBX-2 (value type), OBX-6 (sample units)
- These appear in a "Pending Codes" section of the mapping interface
- Administrator can then map them to OpenELIS tests from the pending list

**HL7 advantage over ASTM:** Because HL7 OBX-3 carries both code and display name (unlike ASTM R.3 which only has the code), auto-detected codes include human-readable names, making mapping easier.

#### FR-30.2: Configuration

| Field | i18n Key | Default |
|-------|----------|---------|
| Auto-detect enabled | `label.hl7.autoDetect.enabled` | Off |
| Max pending codes | `label.hl7.autoDetect.maxPending` | 100 |

#### FR-30.3: Pending Codes Display

```
┌─────────────────────────────────────────────────────────────────┐
│ Unmapped Codes (3 detected)                              [Clear] │
│                                                                   │
│  Code  │ Display Name       │ Type │ First Seen  │ Count │ Map   │
│  ──────┼────────────────────┼──────┼─────────────┼───────┼────── │
│  TBIL  │ Total Bilirubin    │ NM   │ 2026-02-24  │ 12    │ [→]   │
│  DBIL  │ Direct Bilirubin   │ NM   │ 2026-02-24  │ 12    │ [→]   │
│  RPR   │ RPR Qualitative    │ CE   │ 2026-02-25  │ 4     │ [→]   │
└─────────────────────────────────────────────────────────────────┘
```

**HL7-specific columns:**
- **Display Name** — from OBX-3.2 (ASTM doesn't have this)
- **Type** — from OBX-2 (NM, CE, ST, SN) — helps administrator choose correct result type and transformation

Clicking the [→] map button opens the standard mapping editor pre-populated with the detected code, display name, and suggested result type based on OBX-2.

---

## 6. New Business Rules

### BR-18: MLLP Connection Validation

- **Shared listener mode:** MSH-3 sender application filter must be unique across all active HL7 analyzers sharing the same MLLP port. Duplicate MSH-3 filters are rejected at save.
- **Dedicated port mode:** port must not conflict with another active analyzer's listen port (same as ASTM BR-11) or the shared MLLP listener port.
- Changing connection role or listener mode on an active analyzer requires confirmation.
- Maximum concurrent connections (Server mode) must be between 1 and 20.
- Idle timeout of 0 = persistent connection (keep alive); valid range otherwise is 30–3600 seconds.

### BR-19: ACK Generation Rules

- ACK messages must always echo the original MSH-10 (Message Control ID) in MSA-2.
- ACK must be sent within the analyzer's expected timeout window (typically 30 seconds). If OpenELIS processing takes longer, send ACK immediately upon receipt and process asynchronously.
- Duplicate detection (MSH-10 dedup): if a message with the same MSH-10 is received within the dedup window, respond with AA but do not re-import results. Log as duplicate.
- Dedup window range: 5–1440 minutes (5 minutes to 24 hours).
- ACK delay must be 0–5000 milliseconds.

### BR-20: QC Rule Requirements (HL7)

- At least one QC identification rule must be configured before an HL7 analyzer can be set to Active status.
- If all QC rules are deleted from an active analyzer, display warning but do not force deactivation.
- QC rules are evaluated on every incoming ORU^R01 message before staging results.
- Patient Name Pattern rule applies to PID-5.1 (family name) concatenated with PID-5.2 (given name).
- Segment Field references must be valid HL7 segment-field notation (e.g., `OBR-15`, `PID-3.1`). Invalid references are rejected at save with `label.hl7.qcRule.invalidFieldRef`.

### BR-21: HL7 Transformation Validation

- Same rules as ASTM BR-13, plus:
- SN auto-parse is only applied when OBX-2 = `SN`. For OBX-2 = `NM` with operator prefixes (non-standard), the Greater/Less Flag transformation must be explicitly configured.
- CE value maps must map on OBX-5.1 (code component), not OBX-5.2 (display text). The UI enforces this by showing the code column as the mapping key.
- If OBX-2 declares `NM` but OBX-5 contains non-numeric content, log a type mismatch warning. The result is stored as-is with a `TYPE_MISMATCH` flag.
- Value Map transformation is the expected transformation for OBX-2 = `CE` results. If Pass-through is selected for a CE-type result, show info: `label.hl7.transform.cePassThroughInfo` ("Coded values will be stored as raw code^text. Consider using Value Map for standardized storage.")

### BR-22: HL7 Aggregation Constraints

- Same window constraints as ASTM BR-14: minimum 5 seconds, maximum 300 seconds.
- **By OBR Group** mode: each OBR and its child OBX segments form a separate batch. OBR segments without any OBX children are ignored (logged as warning).
- **By Specimen** mode: groups on OBR-2 (Placer Order Number). If OBR-2 is empty, falls back to OBR-3 (Filler Order Number).
- Results held during aggregation are not visible in the import queue until the window expires or a new specimen is detected.

### BR-23: HL7 Message Simulator Constraints

- Simulator does not persist parsed results — it is a validation tool only.
- Simulator uses the current unsaved configuration (preview mode).
- Maximum message size for simulator: 100KB (larger than ASTM's 50KB because HL7 messages are typically more verbose).
- Simulator validates MSH segment is present and well-formed. If MSH is missing or malformed, return `label.hl7.simulator.invalidFormat` error.
- ACK preview is generated but not sent over the network.
- Simulator is available regardless of analyzer active status.

### BR-24: HL7 Auto-Detect Code Limits

- Same as ASTM BR-16: 30-day purge, 100 max pending codes.
- Auto-detected codes capture OBX-3.1 (code), OBX-3.2 (display name), OBX-3.3 (coding system), OBX-2 (value type), and a sample OBX-5/OBX-6 value.
- If the same OBX-3.1 code is seen with different OBX-3.3 coding systems, they are treated as separate pending codes.

### BR-25: HL7 Field Notation Convention

All field references in the HL7 system use **Segment-Field.Component** notation per HL7 v2.3.1 convention:

| Notation | Meaning | Example |
|----------|---------|---------|
| `OBX-5` | OBX segment, field 5 (all components) | Observation Value |
| `OBX-3.1` | OBX segment, field 3, component 1 | Test code from Coded Element |
| `PID-5.1` | PID segment, field 5, component 1 | Patient family name |
| `MSH-9.1` | MSH segment, field 9, component 1 | Message type (e.g., `ORU`) |

Field numbering is 1-indexed. MSH-1 is the field separator; MSH-2 is the encoding characters. Data fields start at MSH-3.

Component numbering is 1-indexed within a `^`-delimited field.

---

## 7. New User Stories

### Epic 9: HL7 Connection & ACK Configuration

#### US-9.1: Configure MLLP Connection

*As a* laboratory administrator
*I want to* configure the MLLP connection settings for an HL7 analyzer
*So that* OpenELIS can receive HL7 messages from the instrument over TCP/IP

**Acceptance Criteria:**

- Given I am creating or editing an HL7 analyzer configuration
- When I select "HL7 v2.3.1" as the protocol
- Then I see MLLP-specific connection fields (listener mode, MSH-3 filter, idle timeout, max connections, character encoding)
- And Server mode shows shared/dedicated listener options
- And Client mode shows IP address and port fields

#### US-9.2: Configure ACK Behavior

*As a* laboratory administrator
*I want to* control how OpenELIS acknowledges received HL7 messages
*So that* the analyzer queue doesn't back up when unmapped test codes are encountered

**Acceptance Criteria:**

- Given I am configuring an HL7 analyzer
- When I select an ACK mode (Always Accept, Success Only, Accept with Errors, Never)
- Then the system shows a description of the selected mode's behavior
- And I can configure the sending application name, ACK delay, and error detail inclusion
- And duplicate detection settings are available with configurable dedup window

#### US-9.3: Route Messages from Shared Listener

*As a* laboratory administrator
*I want to* connect multiple HL7 analyzers to a single MLLP port
*So that* I don't need to manage separate ports for each instrument

**Acceptance Criteria:**

- Given two HL7 analyzers are configured in shared listener mode on the same port
- When each analyzer sends messages with different MSH-3 values (e.g., `BC-5380` and `BS-480`)
- Then messages are routed to the correct analyzer configuration based on MSH-3
- And unrecognized MSH-3 values receive an AE acknowledgment and are logged

### Epic 10: HL7 QC Configuration

#### US-10.1: Configure QC Identification Rules for HL7

*As a* laboratory administrator
*I want to* define rules for identifying QC samples in HL7 messages
*So that* QC results are automatically separated from patient results during import

**Acceptance Criteria:**

- Given I am on the HL7 analyzer configuration page
- When I navigate to the QC Identification section
- Then I can add rules using HL7 field references (OBR-2, PID-5, OBR-15, etc.)
- And I can select from a grouped dropdown of common HL7 fields
- And I can add Patient Name Pattern rules (HL7-specific)
- And the system warns me if no QC rules are configured

#### US-10.2: Test QC Rules Against HL7 Message

*As a* laboratory administrator
*I want to* test my QC rules against a real HL7 message
*So that* I can verify QC samples are correctly identified before going live

**Acceptance Criteria:**

- Given I have configured QC rules for an HL7 analyzer
- When I paste an HL7 ORU^R01 message and click "Test QC Rules"
- Then I see each specimen (OBR group) classified as QC or Patient
- And I see which rules matched for each specimen
- And field references show HL7 notation (e.g., "matched PID-5.1 = QC Control")

### Epic 11: HL7 Value Transformations

#### US-11.1: Configure Result Transformation for HL7

*As a* laboratory administrator
*I want to* specify how HL7 result values should be transformed during import
*So that* analyzer-specific formats are standardized to OpenELIS conventions

**Acceptance Criteria:**

- Given I am configuring a test code mapping for an HL7 analyzer
- When I select a transformation type from the dropdown
- Then I see the appropriate configuration fields
- And the system shows the detected OBX-2 value type for the test code (if auto-detected)
- And I can preview the transformation in the Message Simulator

#### US-11.2: Handle HL7 Structured Numeric Values

*As a* laboratory administrator
*I want to* have SN (Structured Numeric) values automatically parsed
*So that* results like `>^500` are stored correctly without manual transformation configuration

**Acceptance Criteria:**

- Given an HL7 analyzer sends OBX with OBX-2=`SN` and OBX-5=`>^500`
- When SN auto-parse is enabled (default)
- Then OpenELIS stores `500` as the numeric value and `>` as the result flag
- And the auto-parse behavior is indicated in the mapping configuration

#### US-11.3: Map Coded Element Results

*As a* laboratory administrator
*I want to* map CE (Coded Element) result codes to OpenELIS select list options
*So that* coded results like `POS^Positive^L` are stored as standardized values

**Acceptance Criteria:**

- Given a test code mapping has OBX-2 = `CE` and Value Map transformation selected
- When I configure the value map with entries (NEG → Negative, POS → Positive, IND → Indeterminate)
- Then the system maps incoming OBX-5.1 codes to the corresponding OpenELIS values
- And unmapped codes are handled per the default action (Reject, Pass-through, Default)

### Epic 12: HL7 Message Simulator & Auto-Detection

#### US-12.1: Validate HL7 Configuration with Test Message

*As a* laboratory administrator
*I want to* paste an HL7 message and see how it would be parsed
*So that* I can validate my entire configuration before connecting a live analyzer

**Acceptance Criteria:**

- Given I am on the HL7 analyzer configuration page
- When I open the Message Simulator and paste a raw HL7 ORU^R01 message
- Then I click Parse and see extracted segments, matched test codes, OBX-2 value types, QC classification, and transformed values
- And any unmatched codes or errors are highlighted
- And I see an ACK preview showing the response that would be sent

#### US-12.2: Review Auto-Detected HL7 Test Codes

*As a* laboratory administrator
*I want to* see test codes that appeared in live HL7 messages but are not yet mapped
*So that* I can complete my mapping using the display names provided in OBX-3.2

**Acceptance Criteria:**

- Given auto-detect is enabled for an HL7 analyzer
- When the analyzer sends results with unmapped OBX-3 test codes
- Then those codes appear in a "Pending Codes" list with code (OBX-3.1), display name (OBX-3.2), value type (OBX-2), first-seen date, count, and sample value
- And I can click to map each code to an OpenELIS test
- And the mapping editor is pre-populated with the detected code, display name, and suggested result type

---

## 8. New API Endpoints

### MLLP Connection Configuration

**GET /api/analyzers/{id}/hl7-config**

Retrieve HL7/MLLP connection configuration for an analyzer.

- Returns: HL7 config object including connection role, listener mode, MSH-3 filter, timeouts, ACK config
- **Authorization:** LAB_USER

**PUT /api/analyzers/{id}/hl7-config**

Update HL7/MLLP connection configuration.

- Body: `{ connectionRole, listenerMode, listenPort, senderAppFilter, senderFacilityFilter, analyzerIp, analyzerPort, connectionTimeoutSec, idleTimeoutSec, maxConnections, characterEncoding, bidirectionalEnabled }`
- **Authorization:** LAB_ADMIN

### ACK Configuration

**GET /api/analyzers/{id}/ack-config**

Retrieve ACK generation settings.

- Returns: `{ ackMode, sendingApp, delayMs, includeErrorDetail, dedupEnabled, dedupWindowMinutes }`
- **Authorization:** LAB_USER

**PUT /api/analyzers/{id}/ack-config**

Update ACK generation settings.

- Body: `{ ackMode: "ALWAYS_ACCEPT"|"SUCCESS_ONLY"|"ACCEPT_WITH_ERRORS"|"NEVER", sendingApp, delayMs, includeErrorDetail, dedupEnabled, dedupWindowMinutes }`
- **Authorization:** LAB_ADMIN

### QC Rules (HL7)

**GET /api/analyzers/{id}/hl7-qc-rules**

Retrieve QC identification rules for an HL7 analyzer.

- Returns: Array of QC rule objects with HL7 field references
- **Authorization:** LAB_USER

**POST /api/analyzers/{id}/hl7-qc-rules**

Create or replace QC rules (batch).

- Body: Array of `{ ruleType, fieldReference, matchValue, displayOrder, isActive }`
- `ruleType` enum: `FIELD_EQUALS`, `SPECIMEN_ID_PREFIX`, `SPECIMEN_ID_REGEX`, `FIELD_CONTAINS`, `PATIENT_NAME_PATTERN`
- `fieldReference`: HL7 segment-field notation (e.g., `OBR-15`, `PID-3.1`) — required for FIELD_EQUALS and FIELD_CONTAINS
- **Authorization:** LAB_ADMIN

**DELETE /api/analyzers/{id}/hl7-qc-rules/{ruleId}**

Delete a single QC rule.

- **Authorization:** LAB_ADMIN

### Field Extraction Configuration (HL7)

**GET /api/analyzers/{id}/hl7-extraction-config**

Retrieve field extraction overrides.

- Returns: Object with field→segment.field mappings (only overrides; defaults for unset fields)
- **Authorization:** LAB_USER

**PUT /api/analyzers/{id}/hl7-extraction-config**

Update field extraction overrides.

- Body: `{ specimenIdField, testCodeField, testCodeComponent, testDisplayComponent, resultValueField, valueTypeField, resultUnitsField, unitsComponent, abnormalFlagField, resultStatusField, resultTimestampField, senderAppField, patientIdField, patientIdComponent }`
- **Authorization:** LAB_ADMIN

### Value Transformation (HL7)

**GET /api/analyzers/{id}/mappings/{mid}/hl7-transformation**

Retrieve transformation configuration for a specific test code mapping, including SN auto-parse settings.

- Returns: `{ type, config, snAutoParse, detectedValueType }`
- **Authorization:** LAB_USER

**PUT /api/analyzers/{id}/mappings/{mid}/hl7-transformation**

Update transformation configuration.

- Body: `{ type: "PASS_THROUGH"|"GREATER_LESS_FLAG"|"VALUE_MAP"|"THRESHOLD_CLASSIFY"|"CODED_LOOKUP", config: {...}, snAutoParse: boolean }`
- **Authorization:** LAB_ADMIN

### Message Simulator (HL7)

**POST /api/analyzers/{id}/hl7-simulate**

Parse a raw HL7 message using the analyzer's current configuration.

- Body: `{ rawMessage: string }`
- Returns: `{ messageControlId, sendingApp, obrGroups: [{ obrSetId, placerOrderNumber, serviceId, isQC, matchedQcRules, results: [{ analyzerCode, displayName, valueType, openelisTest, rawValue, transformedValue, units, referenceRange, flag, warnings }] }], ackPreview: string, errors: [], warnings: [] }`
- **Authorization:** LAB_ADMIN
- **Note:** Does not persist any data. Uses current configuration including unsaved changes if provided in body. Maximum message size: 100KB.

### Aggregation Configuration (HL7)

**GET /api/analyzers/{id}/hl7-aggregation-config**

Retrieve aggregation mode and window.

- Returns: `{ mode, windowSeconds }`
- **Authorization:** LAB_USER

**PUT /api/analyzers/{id}/hl7-aggregation-config**

Update aggregation configuration.

- Body: `{ mode: "PER_MESSAGE"|"BY_SPECIMEN"|"BY_OBR_GROUP", windowSeconds: 30 }`
- **Authorization:** LAB_ADMIN

### Auto-Detected Codes (HL7)

**GET /api/analyzers/{id}/hl7-pending-codes**

Retrieve unmapped test codes detected from live HL7 messages.

- Returns: Array of `{ code, displayName, codingSystem, valueType, firstSeen, lastSeen, count, sampleValue, sampleUnits }`
- **Authorization:** LAB_USER

**DELETE /api/analyzers/{id}/hl7-pending-codes/{code}**

Dismiss a pending code (remove from list without mapping).

- **Authorization:** LAB_ADMIN

### MLLP Listener Management

**GET /api/mllp-listener/status**

Retrieve shared MLLP listener status.

- Returns: `{ port, isRunning, activeConnections, registeredAnalyzers: [{ analyzerId, senderAppFilter, lastMessageReceived }] }`
- **Authorization:** LAB_ADMIN

**POST /api/mllp-listener/restart**

Restart the shared MLLP listener (e.g., after port change).

- **Authorization:** SYS_ADMIN

---

## 9. Database Schema

### New Tables

```sql
-- Per-analyzer HL7 configuration (extends analyzer master)
CREATE TABLE hl7_analyzer_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analyzer_id INTEGER NOT NULL REFERENCES analyzer(id),
    
    -- MLLP Connection
    connection_role VARCHAR(10) NOT NULL DEFAULT 'SERVER',
    listener_mode VARCHAR(10) NOT NULL DEFAULT 'SHARED',    -- SHARED or DEDICATED
    listen_port INTEGER,                                     -- For DEDICATED mode
    sender_app_filter VARCHAR(100),                          -- MSH-3 match for SHARED mode
    sender_facility_filter VARCHAR(100),                     -- MSH-4 match (optional)
    analyzer_ip VARCHAR(45),                                 -- For CLIENT mode
    analyzer_port INTEGER,                                   -- For CLIENT mode
    connection_timeout_sec INTEGER NOT NULL DEFAULT 30,
    idle_timeout_sec INTEGER NOT NULL DEFAULT 300,           -- 0 = keep alive
    max_connections INTEGER NOT NULL DEFAULT 5,
    character_encoding VARCHAR(20) NOT NULL DEFAULT 'UTF-8',
    bidirectional_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- ACK Configuration
    ack_mode VARCHAR(30) NOT NULL DEFAULT 'ALWAYS_ACCEPT',
    ack_sending_app VARCHAR(100) NOT NULL DEFAULT 'OpenELIS',
    ack_delay_ms INTEGER NOT NULL DEFAULT 0,
    ack_include_error_detail BOOLEAN NOT NULL DEFAULT TRUE,
    dedup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    dedup_window_minutes INTEGER NOT NULL DEFAULT 60,
    
    -- Field extraction overrides (NULL = use default)
    specimen_id_field VARCHAR(20),          -- Default: OBR-2
    test_code_field VARCHAR(20),            -- Default: OBX-3
    test_code_component INTEGER,            -- Default: 1
    test_display_component INTEGER,         -- Default: 2
    result_value_field VARCHAR(20),         -- Default: OBX-5
    value_type_field VARCHAR(20),           -- Default: OBX-2
    result_units_field VARCHAR(20),         -- Default: OBX-6
    units_component INTEGER,               -- Default: 1
    abnormal_flag_field VARCHAR(20),        -- Default: OBX-8
    result_status_field VARCHAR(20),        -- Default: OBX-11
    result_timestamp_field VARCHAR(20),     -- Default: OBX-14
    sender_app_field VARCHAR(20),           -- Default: MSH-3
    patient_id_field VARCHAR(20),           -- Default: PID-3
    patient_id_component INTEGER,           -- Default: 1
    
    -- SN Auto-Parse
    sn_auto_parse BOOLEAN NOT NULL DEFAULT TRUE,
    sn_range_format VARCHAR(50) DEFAULT '{num1}{sep}{num2}',
    
    -- Aggregation
    aggregation_mode VARCHAR(20) NOT NULL DEFAULT 'PER_MESSAGE',
    aggregation_window_sec INTEGER NOT NULL DEFAULT 30,
    
    -- Auto-detect
    auto_detect_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    auto_detect_max_pending INTEGER NOT NULL DEFAULT 100,
    
    -- Metadata
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    modified_by INTEGER REFERENCES system_user(id),
    
    UNIQUE(analyzer_id),
    CONSTRAINT chk_hl7_listener_mode CHECK (
        (listener_mode = 'SHARED' AND sender_app_filter IS NOT NULL) OR
        (listener_mode = 'DEDICATED' AND listen_port IS NOT NULL) OR
        connection_role = 'CLIENT'
    ),
    CONSTRAINT chk_hl7_ack_mode CHECK (
        ack_mode IN ('ALWAYS_ACCEPT', 'SUCCESS_ONLY', 'ACCEPT_WITH_ERRORS', 'NEVER')
    ),
    CONSTRAINT chk_hl7_aggregation_mode CHECK (
        aggregation_mode IN ('PER_MESSAGE', 'BY_SPECIMEN', 'BY_OBR_GROUP')
    )
);

-- Test code mapping (per HL7 analyzer) — extends shared test mapping concept
CREATE TABLE hl7_test_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES hl7_analyzer_config(id),
    analyzer_code VARCHAR(50) NOT NULL,             -- OBX-3.1 code
    analyzer_display_name VARCHAR(200),             -- OBX-3.2 display name (informational)
    analyzer_coding_system VARCHAR(50),             -- OBX-3.3 coding system
    expected_value_type VARCHAR(5),                 -- Expected OBX-2 (NM, CE, ST, SN, TX, FT)
    openelis_test_id INTEGER REFERENCES test(id),
    result_type VARCHAR(20) NOT NULL DEFAULT 'NUMERIC',
    unit_override VARCHAR(20),
    transformation_type VARCHAR(30) NOT NULL DEFAULT 'PASS_THROUGH',
    transformation_config JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, analyzer_code, analyzer_coding_system)
);

-- QC identification rules (per HL7 analyzer)
CREATE TABLE hl7_qc_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES hl7_analyzer_config(id),
    rule_type VARCHAR(30) NOT NULL,
    field_reference VARCHAR(30),                    -- HL7 Segment-Field.Component notation
    match_value VARCHAR(200) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hl7_rule_type CHECK (
        rule_type IN ('FIELD_EQUALS', 'SPECIMEN_ID_PREFIX', 'SPECIMEN_ID_REGEX', 
                      'FIELD_CONTAINS', 'PATIENT_NAME_PATTERN')
    )
);

-- Abnormal flag mapping overrides (per HL7 analyzer)
CREATE TABLE hl7_flag_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES hl7_analyzer_config(id),
    analyzer_flag VARCHAR(10) NOT NULL,
    openelis_interpretation VARCHAR(30) NOT NULL,
    UNIQUE(config_id, analyzer_flag)
);

-- Auto-detected pending codes (per HL7 analyzer)
CREATE TABLE hl7_pending_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES hl7_analyzer_config(id),
    analyzer_code VARCHAR(50) NOT NULL,             -- OBX-3.1
    display_name VARCHAR(200),                      -- OBX-3.2
    coding_system VARCHAR(50),                      -- OBX-3.3
    detected_value_type VARCHAR(5),                 -- OBX-2
    first_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    sample_value VARCHAR(200),                      -- Sample OBX-5
    sample_units VARCHAR(50),                       -- Sample OBX-6
    UNIQUE(config_id, analyzer_code, coding_system)
);

-- Message deduplication log
CREATE TABLE hl7_message_dedup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL REFERENCES hl7_analyzer_config(id),
    message_control_id VARCHAR(200) NOT NULL,       -- MSH-10
    received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ack_code VARCHAR(5) NOT NULL,                   -- AA, AE, AR
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(config_id, message_control_id)
);

-- Shared MLLP listener configuration (global, not per-analyzer)
CREATE TABLE mllp_listener_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listen_port INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_connections INTEGER NOT NULL DEFAULT 50,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listen_port)
);
```

### Transformation Config JSONB Examples

```json
// PASS_THROUGH
null

// GREATER_LESS_FLAG
{ "operators": [">", "<", ">=", "<="] }

// VALUE_MAP (for CE-type results mapping OBX-5.1 codes)
{
  "mappings": [
    { "analyzerValue": "NEG", "openelisCode": "Negative" },
    { "analyzerValue": "POS", "openelisCode": "Positive" },
    { "analyzerValue": "IND", "openelisCode": "Indeterminate" }
  ],
  "defaultAction": "REJECT"
}

// THRESHOLD_CLASSIFY
{
  "ranges": [
    { "min": 2.0, "max": 3.0, "includeMin": true, "includeMax": true, "label": "HIGH_CONFIDENCE" },
    { "min": 1.7, "max": 2.0, "includeMin": true, "includeMax": false, "label": "LOW_CONFIDENCE" },
    { "min": 0.0, "max": 1.7, "includeMin": true, "includeMax": false, "label": "NO_IDENTIFICATION" }
  ]
}

// CODED_LOOKUP
{ "lookupTable": "ORGANISM_MASTER", "caseSensitive": false }
```

### Key Schema Differences from ASTM

| Feature | ASTM Table | HL7 Table | Difference |
|---------|-----------|-----------|------------|
| Config | `astm_analyzer_config` | `hl7_analyzer_config` | HL7 adds ACK config, listener mode, SN auto-parse, dedup settings |
| Test mapping | `astm_test_mapping` | `hl7_test_mapping` | HL7 adds display_name, coding_system, expected_value_type |
| QC rules | `astm_qc_rule` | `hl7_qc_rule` | HL7 adds PATIENT_NAME_PATTERN rule type, field_reference uses HL7 notation |
| Flag mapping | `astm_flag_mapping` | `hl7_flag_mapping` | Identical structure |
| Pending codes | `astm_pending_code` | `hl7_pending_code` | HL7 adds display_name, coding_system, detected_value_type |
| Dedup | — | `hl7_message_dedup` | HL7-only (ASTM uses transport-level ACK) |
| Listener | — | `mllp_listener_config` | HL7-only (shared MLLP listener) |

---

## 10. Complete Localization Tags

All user-facing text in this addendum uses localization tags. HL7-specific tags use the namespace `label.hl7.*`. Tags shared with ASTM continue to use `label.analyzer.*`.

### MLLP Connection Tags

| Tag | Default English |
|-----|----------------|
| `label.hl7.connectionRole` | Connection Role |
| `label.hl7.connectionRole.server` | Server (Listen for MLLP connections) |
| `label.hl7.connectionRole.client` | Client (Connect to analyzer) |
| `label.hl7.listenerMode` | Listener Mode |
| `label.hl7.listenerMode.shared` | Shared MLLP Port (route by MSH-3) |
| `label.hl7.listenerMode.dedicated` | Dedicated Port (per analyzer) |
| `label.hl7.listenPort` | Listen Port |
| `label.hl7.analyzerIpAddress` | Analyzer IP Address |
| `label.hl7.analyzerPort` | Analyzer Port |
| `label.hl7.connectionTimeout` | Connection Timeout (seconds) |
| `label.hl7.idleTimeout` | Idle Timeout (seconds) |
| `label.hl7.idleTimeout.help` | Close connection after this period of inactivity. Set to 0 for persistent connection. |
| `label.hl7.maxConnections` | Maximum Concurrent Connections |
| `label.hl7.characterEncoding` | Character Encoding |
| `label.hl7.senderAppFilter` | Sender Application (MSH-3) |
| `label.hl7.senderAppFilter.help` | Expected MSH-3 value from this analyzer. Used to route messages from the shared MLLP listener. |
| `label.hl7.senderFacilityFilter` | Sender Facility (MSH-4) |
| `label.hl7.bidirectionalEnabled` | Enable Bidirectional (Host Query) |
| `label.hl7.bidirectional.help` | When enabled, OpenELIS can send QRY^R02 messages to retrieve pending results from the analyzer. |

### ACK Configuration Tags

| Tag | Default English |
|-----|----------------|
| `label.hl7.ack.mode` | ACK Response Mode |
| `label.hl7.ack.alwaysAccept` | Always Accept (AA) |
| `label.hl7.ack.alwaysAccept.help` | Sends AA for all parseable messages. Unmapped test codes are logged but do not block acknowledgment. |
| `label.hl7.ack.successOnly` | Accept on Success Only |
| `label.hl7.ack.successOnly.help` | Sends AA only if all OBX codes are mapped. Sends AE if any unmapped codes are found. |
| `label.hl7.ack.acceptWithErrors` | Accept with Errors |
| `label.hl7.ack.acceptWithErrors.help` | Sends AA if at least one OBX is mapped. Sends AE only if zero codes are mapped. |
| `label.hl7.ack.never` | Never (Suppress ACK) |
| `label.hl7.ack.never.help` | No ACK response is sent. Use only for analyzers that do not expect acknowledgment. |
| `label.hl7.ack.sendingApp` | ACK Sending Application |
| `label.hl7.ack.delayMs` | ACK Delay (milliseconds) |
| `label.hl7.ack.includeErrorDetail` | Include Error Detail in ACK |
| `label.hl7.ack.dedupEnabled` | Enable Duplicate Detection |
| `label.hl7.ack.dedupWindowMinutes` | Duplicate Detection Window (minutes) |
| `label.hl7.ack.duplicateDetected` | Duplicate message detected (MSH-10 already processed). ACK sent, results not re-imported. |

### QC Identification Tags (HL7)

| Tag | Default English |
|-----|----------------|
| `label.hl7.qcIdentification` | QC Sample Identification |
| `label.hl7.qcIdentification.help` | A sample is identified as QC if ANY of these rules match |
| `label.hl7.qcRule.addRule` | Add QC Rule |
| `label.hl7.qcRule.testRules` | Test QC Rules |
| `label.hl7.qcRule.ruleType` | Rule Type |
| `label.hl7.qcRule.fieldEquals` | Segment Field Equals Value |
| `label.hl7.qcRule.specimenIdPrefix` | Specimen ID (OBR-2) Starts With |
| `label.hl7.qcRule.specimenIdRegex` | Specimen ID Matches Pattern |
| `label.hl7.qcRule.fieldContains` | Segment Field Contains |
| `label.hl7.qcRule.patientNamePattern` | Patient Name (PID-5) Matches Pattern |
| `label.hl7.qcRule.fieldReference` | HL7 Field |
| `label.hl7.qcRule.matchValue` | Match Value |
| `label.hl7.qcRule.noneConfigured` | No QC rules configured. QC samples will not be identified during import. |
| `label.hl7.qcRule.testResult.qc` | QC Sample |
| `label.hl7.qcRule.testResult.patient` | Patient Sample |
| `label.hl7.qcRule.invalidFieldRef` | Invalid HL7 field reference. Use Segment-Field notation (e.g., OBR-15, PID-3.1). |

### Field Extraction Tags (HL7)

| Tag | Default English |
|-----|----------------|
| `label.hl7.extract.advanced` | Advanced Field Extraction |
| `label.hl7.extract.info` | These defaults work for most HL7 analyzers. Only change them if your instrument uses non-standard field positions. |
| `label.hl7.extract.specimenIdField` | Specimen ID Field |
| `label.hl7.extract.testCodeField` | Test Code Field |
| `label.hl7.extract.testCodeComponent` | Test Code Component |
| `label.hl7.extract.testDisplayComponent` | Test Display Name Component |
| `label.hl7.extract.resultValueField` | Result Value Field |
| `label.hl7.extract.valueTypeField` | Value Type Field |
| `label.hl7.extract.resultUnitsField` | Result Units Field |
| `label.hl7.extract.unitsComponent` | Units Component |
| `label.hl7.extract.abnormalFlagField` | Abnormal Flag Field |
| `label.hl7.extract.resultStatusField` | Result Status Field |
| `label.hl7.extract.resultTimestampField` | Result Timestamp Field |
| `label.hl7.extract.senderAppField` | Sender Application Field |
| `label.hl7.extract.patientIdField` | Patient ID Field |
| `label.hl7.extract.patientIdComponent` | Patient ID Component |

### Value Transformation Tags (HL7-specific)

Shared transformation tags from ASTM (`label.analyzer.transform.*`) are reused. These are HL7-only additions:

| Tag | Default English |
|-----|----------------|
| `label.hl7.transform.snAutoParse` | Auto-parse Structured Numeric (SN) values |
| `label.hl7.transform.snAutoInfo` | This test sends Structured Numeric (SN) values. Greater/Less operators are automatically extracted from the SN format. |
| `label.hl7.transform.snRangeFormat` | SN Range Format |
| `label.hl7.transform.cePassThroughInfo` | Coded values will be stored as raw code^text. Consider using Value Map for standardized storage. |
| `label.hl7.transform.valueTypeDetected` | Detected Value Type |
| `label.hl7.transform.valueTypeMismatch` | OBX-2 declares {type} but OBX-5 content does not match. Result stored with TYPE_MISMATCH warning. |

### Aggregation Tags (HL7)

| Tag | Default English |
|-----|----------------|
| `label.hl7.aggregation.mode` | Result Aggregation Mode |
| `label.hl7.aggregation.perMessage` | Per Message (default) |
| `label.hl7.aggregation.bySpecimen` | Aggregate by Specimen ID (OBR-2) |
| `label.hl7.aggregation.byObrGroup` | Separate by OBR Panel Group |
| `label.hl7.aggregation.windowSeconds` | Aggregation Time Window (seconds) |
| `label.hl7.aggregation.windowHelp` | Time to wait for additional messages with the same specimen ID before presenting the batch |

### Abnormal Flag Tags (HL7 additions)

Shared tags from ASTM (`label.analyzer.flag.*`) are reused for common flags. These are HL7-specific:

| Tag | Default English |
|-----|----------------|
| `label.hl7.flag.veryAbnormal` | Very Abnormal |
| `label.hl7.flag.belowLowNormal` | Below Low Normal |
| `label.hl7.flag.aboveHighNormal` | Above High Normal |

### Message Simulator Tags (HL7)

| Tag | Default English |
|-----|----------------|
| `label.hl7.simulator` | HL7 Message Simulator |
| `label.hl7.simulator.pasteMessage` | Paste HL7 Message |
| `label.hl7.simulator.parse` | Parse |
| `label.hl7.simulator.clear` | Clear |
| `label.hl7.simulator.results` | Parse Results |
| `label.hl7.simulator.instrument` | Instrument (MSH-3) |
| `label.hl7.simulator.messageId` | Message ID (MSH-10) |
| `label.hl7.simulator.specimen` | Specimen (OBR-2) |
| `label.hl7.simulator.panel` | Panel (OBR-4) |
| `label.hl7.simulator.qcStatus` | QC Status |
| `label.hl7.simulator.analyzerCode` | Analyzer Code (OBX-3.1) |
| `label.hl7.simulator.valueType` | Type (OBX-2) |
| `label.hl7.simulator.openelisTest` | OpenELIS Test |
| `label.hl7.simulator.value` | Value |
| `label.hl7.simulator.units` | Units |
| `label.hl7.simulator.refRange` | Ref Range |
| `label.hl7.simulator.flag` | Flag |
| `label.hl7.simulator.transformation` | Transformation |
| `label.hl7.simulator.empty` | Paste an HL7 message above and click Parse to validate your configuration |
| `label.hl7.simulator.success` | HL7 message parsed successfully |
| `label.hl7.simulator.warnings` | HL7 message parsed with warnings |
| `label.hl7.simulator.error` | HL7 message could not be parsed |
| `label.hl7.simulator.invalidFormat` | Message does not appear to be valid HL7. Expected MSH segment header. |
| `label.hl7.simulator.unmatchedCode` | Unmatched test code |
| `label.hl7.simulator.maxSize` | Message exceeds maximum size (100KB) |
| `label.hl7.simulator.ackPreview` | ACK Response Preview |
| `label.hl7.simulator.ackStatus.accept` | Application Accept — all codes mapped |
| `label.hl7.simulator.ackStatus.error` | Application Error — unmapped codes detected |
| `label.hl7.simulator.ackStatus.reject` | Application Reject — message could not be parsed |

### Auto-Detect Tags (HL7)

| Tag | Default English |
|-----|----------------|
| `label.hl7.autoDetect.enabled` | Auto-detect unmapped test codes |
| `label.hl7.autoDetect.maxPending` | Maximum pending codes |
| `label.hl7.autoDetect.pendingCodes` | Unmapped Codes |
| `label.hl7.autoDetect.detected` | detected |
| `label.hl7.autoDetect.code` | Code (OBX-3.1) |
| `label.hl7.autoDetect.displayName` | Display Name (OBX-3.2) |
| `label.hl7.autoDetect.valueType` | Value Type (OBX-2) |
| `label.hl7.autoDetect.codingSystem` | Coding System (OBX-3.3) |
| `label.hl7.autoDetect.firstSeen` | First Seen |
| `label.hl7.autoDetect.lastSeen` | Last Seen |
| `label.hl7.autoDetect.count` | Count |
| `label.hl7.autoDetect.sampleValue` | Sample Value |
| `label.hl7.autoDetect.map` | Map |
| `label.hl7.autoDetect.dismiss` | Dismiss |
| `label.hl7.autoDetect.clearAll` | Clear All |

### Segment Field Catalog Tags

| Tag | Default English |
|-----|----------------|
| `label.hl7.segment.msh` | MSH — Message Header |
| `label.hl7.segment.pid` | PID — Patient Identification |
| `label.hl7.segment.pv1` | PV1 — Patient Visit |
| `label.hl7.segment.orc` | ORC — Common Order |
| `label.hl7.segment.obr` | OBR — Observation Request |
| `label.hl7.segment.obx` | OBX — Observation/Result |
| `label.hl7.segment.nte` | NTE — Notes and Comments |
| `label.hl7.segment.msa` | MSA — Message Acknowledgment |
| `label.hl7.segment.err` | ERR — Error Segment |
| `label.hl7.segment.qrd` | QRD — Query Definition |

---

## 11. Acceptance Criteria

### MLLP Connection Configuration
- [ ] **AC-87**: MLLP connection fields appear when protocol = HL7 v2.3.1
- [ ] **AC-88**: Server mode with Shared Listener shows MSH-3 filter field, hides port
- [ ] **AC-89**: Server mode with Dedicated Port shows listen port, hides MSH-3 filter
- [ ] **AC-90**: Client mode shows IP + port, hides listener fields
- [ ] **AC-91**: MSH-3 filter uniqueness validated across active shared-mode analyzers
- [ ] **AC-92**: Port conflict validation prevents duplicates across active analyzers and shared listener
- [ ] **AC-93**: Idle timeout, max connections, and character encoding save and persist
- [ ] **AC-94**: Connection role change on active analyzer requires confirmation dialog

### ACK Generation
- [ ] **AC-95**: ACK mode dropdown shows all four options with descriptions
- [ ] **AC-96**: Always Accept mode sends AA for any parseable ORU^R01
- [ ] **AC-97**: Success Only mode sends AE when unmapped OBX-3 codes are found
- [ ] **AC-98**: Accept with Errors mode sends AA when ≥1 OBX code is mapped
- [ ] **AC-99**: Never mode suppresses all ACK responses
- [ ] **AC-100**: ACK correctly echoes MSH-10 in MSA-2
- [ ] **AC-101**: ACK delay delays response by configured milliseconds
- [ ] **AC-102**: Error detail inclusion adds ERR segment and MSA-3 text when enabled
- [ ] **AC-103**: Duplicate detection rejects re-processed MSH-10 within dedup window
- [ ] **AC-104**: Duplicate detection responds with AA without re-importing results

### QC Identification (HL7)
- [ ] **AC-105**: QC rule builder displays within HL7 analyzer configuration
- [ ] **AC-106**: All five rule types (Field Equals, Specimen ID Prefix, Specimen ID Regex, Field Contains, Patient Name Pattern) can be created
- [ ] **AC-107**: HL7 field reference dropdown shows fields grouped by segment
- [ ] **AC-108**: Custom Field option allows arbitrary segment-field notation
- [ ] **AC-109**: Patient Name Pattern matches against PID-5.1 + PID-5.2
- [ ] **AC-110**: Rules evaluate with OR logic (any match = QC)
- [ ] **AC-111**: Test QC Rules button parses HL7 message and shows per-OBR classification
- [ ] **AC-112**: Active analyzer without QC rules shows warning notification
- [ ] **AC-113**: Invalid field references rejected at save with error message

### Value Transformations (HL7)
- [ ] **AC-114**: Transformation type dropdown appears in test code mapping table
- [ ] **AC-115**: Pass-through is the default transformation
- [ ] **AC-116**: SN auto-parse correctly extracts `>^500` into value=500, flag=`>`
- [ ] **AC-117**: SN range format correctly stores `^1^:^16` as `1:16`
- [ ] **AC-118**: CE value map maps OBX-5.1 code, not OBX-5.2 display text
- [ ] **AC-119**: Value Map default action (Reject/Pass-through/Default) works for CE results
- [ ] **AC-120**: Greater/Less Flag works for NM-type results with operator prefixes
- [ ] **AC-121**: Type mismatch warning logged when OBX-2 ≠ actual OBX-5 content
- [ ] **AC-122**: Info banner appears for CE results with Pass-through transformation

### Message Simulator (HL7)
- [ ] **AC-123**: Simulator accepts pasted HL7 messages up to 100KB
- [ ] **AC-124**: Parse button runs message through current HL7 configuration
- [ ] **AC-125**: Extracted segments displayed with HL7 field references
- [ ] **AC-126**: Matched test codes shown with OpenELIS test names
- [ ] **AC-127**: OBX-2 value type column displayed in results table
- [ ] **AC-128**: Unmatched test codes highlighted as warnings
- [ ] **AC-129**: QC classification shown per OBR group
- [ ] **AC-130**: Transformation before/after values displayed
- [ ] **AC-131**: ACK preview shows generated ACK message with correct MSA code
- [ ] **AC-132**: Parse errors displayed with descriptive messages
- [ ] **AC-133**: Invalid HL7 format (missing MSH) shows specific error

### Field Extraction (HL7)
- [ ] **AC-134**: Advanced Field Extraction accordion collapsed by default
- [ ] **AC-135**: Default values shown as placeholder text in Segment-Field.Component notation
- [ ] **AC-136**: Override values saved and applied during HL7 parsing
- [ ] **AC-137**: Component selector available for composite fields (OBX-3, OBX-6, PID-3)
- [ ] **AC-138**: Info banner displays explaining when to use this section

### Result Aggregation (HL7)
- [ ] **AC-139**: Aggregation mode dropdown shows three HL7-specific options
- [ ] **AC-140**: Time window field visible only for By Specimen mode
- [ ] **AC-141**: Time window validated within 5–300 second range
- [ ] **AC-142**: By Specimen mode correctly groups results by OBR-2 across messages
- [ ] **AC-143**: By OBR Group mode separates multi-OBR messages into per-panel batches

### Abnormal Flag Mapping (HL7)
- [ ] **AC-144**: Default flag mapping includes HL7-specific flags (AA, <, >)
- [ ] **AC-145**: Custom flag rows can be added and saved
- [ ] **AC-146**: Flag mapping applies to OBX-8 values during HL7 parsing

### Auto-Detect (HL7)
- [ ] **AC-147**: Pending codes list shows unmapped OBX-3 codes from live messages
- [ ] **AC-148**: Pending codes display includes display name (OBX-3.2) and value type (OBX-2)
- [ ] **AC-149**: Map action opens mapping editor pre-populated with code, display name, and suggested result type
- [ ] **AC-150**: Pending codes older than 30 days are automatically purged
- [ ] **AC-151**: Auto-detect toggle is off by default
- [ ] **AC-152**: Same code with different coding systems (OBX-3.3) treated as separate entries

---

## 12. Appendix A — Sample HL7 Messages

### A.1 Mindray BC-5380 — CBC with Differential (ORU^R01)

```
MSH|^~\&|BC-5380||OpenELIS||20260227120000||ORU^R01|MSG20260227001|P|2.3.1
PID|1||LAB-2026-001^^^L||Smith^John^Q||19850315|M
PV1|1|O
ORC|RE||BC5380-001
OBR|1|LAB-2026-001||CBC^Complete Blood Count^L|||20260227115500
OBX|1|NM|WBC^White Blood Cell Count^L||7.5|10*3/uL^10*3/uL^L|4.0-11.0|N|||F|||20260227115500
OBX|2|NM|RBC^Red Blood Cell Count^L||4.85|10*6/uL^10*6/uL^L|4.50-5.50|N|||F|||20260227115500
OBX|3|NM|HGB^Hemoglobin^L||14.2|g/dL^g/dL^L|13.0-17.0|N|||F|||20260227115500
OBX|4|NM|HCT^Hematocrit^L||42.5|%^%^L|38.0-50.0|N|||F|||20260227115500
OBX|5|NM|MCV^Mean Corpuscular Volume^L||87.6|fL^fL^L|80.0-100.0|N|||F|||20260227115500
OBX|6|NM|MCH^Mean Corpuscular Hemoglobin^L||29.3|pg^pg^L|27.0-33.0|N|||F|||20260227115500
OBX|7|NM|MCHC^Mean Corpuscular Hgb Conc^L||33.4|g/dL^g/dL^L|32.0-36.0|N|||F|||20260227115500
OBX|8|NM|PLT^Platelet Count^L||245|10*3/uL^10*3/uL^L|150-400|N|||F|||20260227115500
OBX|9|NM|NEU%^Neutrophils %^L||62.5|%^%^L|40.0-75.0|N|||F|||20260227115500
OBX|10|NM|LYM%^Lymphocytes %^L||28.3|%^%^L|20.0-45.0|N|||F|||20260227115500
OBX|11|NM|MON%^Monocytes %^L||6.2|%^%^L|2.0-10.0|N|||F|||20260227115500
OBX|12|NM|EOS%^Eosinophils %^L||2.5|%^%^L|1.0-6.0|N|||F|||20260227115500
OBX|13|NM|BAS%^Basophils %^L||0.5|%^%^L|0.0-2.0|N|||F|||20260227115500
```

### A.2 Mindray BS-480 — Chemistry Panel with Abnormal Flags

```
MSH|^~\&|BS-480||OpenELIS||20260227130000||ORU^R01|MSG20260227002|P|2.3.1
PID|1||LAB-2026-002^^^L||Doe^Jane||19700801|F
OBR|1|LAB-2026-002||CHEM^Basic Chemistry Panel^L|||20260227125500
OBX|1|NM|GLU^Glucose^L||245|mg/dL^mg/dL^L|70-100|HH|||F|||20260227125500
OBX|2|NM|BUN^Blood Urea Nitrogen^L||14|mg/dL^mg/dL^L|7-20|N|||F|||20260227125500
OBX|3|NM|CRE^Creatinine^L||0.9|mg/dL^mg/dL^L|0.6-1.2|N|||F|||20260227125500
OBX|4|NM|ALT^Alanine Aminotransferase^L||52|U/L^U/L^L|7-35|H|||F|||20260227125500
OBX|5|NM|AST^Aspartate Aminotransferase^L||28|U/L^U/L^L|10-40|N|||F|||20260227125500
OBX|6|SN|CHOL^Total Cholesterol^L||>^500|mg/dL^mg/dL^L|<200|HH|||F|||20260227125500
NTE|1|L|Lipemia noted. Consider fasting specimen.
```

### A.3 QC Sample — Hematology Control

```
MSH|^~\&|BC-5380||OpenELIS||20260227080000||ORU^R01|MSG20260227003|P|2.3.1
PID|1||CTRL-NORMAL-L1^^^L||QC Control^Normal Level 1
OBR|1|CTRL-NORMAL-L1||CBC^Complete Blood Count^L|||20260227075500
OBX|1|NM|WBC^White Blood Cell Count^L||8.2|10*3/uL^10*3/uL^L|4.0-11.0|N|||F|||20260227075500
OBX|2|NM|RBC^Red Blood Cell Count^L||4.50|10*6/uL^10*6/uL^L|4.50-5.50|N|||F|||20260227075500
OBX|3|NM|HGB^Hemoglobin^L||14.0|g/dL^g/dL^L|13.0-17.0|N|||F|||20260227075500
OBX|4|NM|PLT^Platelet Count^L||230|10*3/uL^10*3/uL^L|150-400|N|||F|||20260227075500
```

### A.4 Coded Result — Immunoassay with Select List

```
MSH|^~\&|COBAS||OpenELIS||20260227140000||ORU^R01|MSG20260227004|P|2.3.1
PID|1||LAB-2026-003^^^L||Brown^Robert||19901215|M
OBR|1|LAB-2026-003||IMMUNO^Immunoassay Panel^L|||20260227135500
OBX|1|CE|HIVAG^HIV Ag/Ab Combo^L||NEG^Negative^L||||F|||20260227135500
OBX|2|CE|HBSAG^Hepatitis B Surface Ag^L||NEG^Negative^L||||F|||20260227135500
OBX|3|CE|HCVAB^Hepatitis C Antibody^L||POS^Positive^L||||A|||F|||20260227135500
NTE|1|L|HCV Ab positive — recommend confirmatory RNA testing.
OBX|4|NM|TOXIG^Toxoplasma IgG^L||2.8|IU/mL^IU/mL^L|<1.0|H|||F|||20260227135500
```

### A.5 ACK Response — Application Accept

```
MSH|^~\&|OpenELIS||BC-5380||20260227120001||ACK^R01|ACK20260227001|P|2.3.1
MSA|AA|MSG20260227001
```

### A.6 ACK Response — Application Error (Parse Failure)

```
MSH|^~\&|OpenELIS||BC-5380||20260227120001||ACK^R01|ACK20260227002|P|2.3.1
MSA|AE|MSG20260227002|Unknown test code in OBX-3: XYZ
ERR|OBX^3^1
```

---

## 13. Related Documents

| Document | Relationship |
|----------|-------------|
| Analyzer Mapping Templates FRS v2.0 | Parent specification — defines template architecture, test code mapping, data model |
| ASTM Analyzer Mapping Addendum v1.1 | Sibling addendum — ASTM-specific extensions. Shared concepts (QC rules, transformations, simulator) apply to both protocols |
| Analyzer Import Requirements FRS | Downstream consumer — import page uses mapping config to parse incoming HL7 messages |
| Mindray BC-5380 Integration Spec | Plugin source — the BC-5380 spec maps directly to an HL7 plugin template |
| Mindray BS-Series Integration Spec | Plugin source — BS-series chemistry analyzers using HL7 |
| Shared HL7 MLLP Listener Service | Infrastructure — single MLLP listener that routes messages to per-analyzer config |
| Test Catalog FRS v2 | Target system — test code mappings reference tests defined in the test catalog |
| System Audit Trail FRS | Integration point — mapping changes feed into the unified audit trail |
| Flat File Analyzer Configuration FRS (OGC-329) | Parallel feature — flat file import uses CSV column mapping, not segment field mapping |
