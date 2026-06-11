# Sysmex XN-L Series ASTM Field Mapping & Integration Specification

**Target Instruments:** XN-330, XN-350, XN-430, XN-450, XN-530, XN-550
**Software:** XN-L-IPU (Information Processing Unit)
**OpenELIS Module:** ASTM Bi-Directional Analyzer Interface
**Version:** 0.1 (Draft)
**Date:** 2026-03-04
**Validated Against:**
- _No real instrument captures yet — spec built from Sysmex LIS Interface Implementation Guide (1273-MKT, Rev 3, May 2020)_
- _Existing OpenELIS plugin reference: IntelliSOFT-Consulting/openelisglobal_plugins_xnl_xp_

---

## Validation Status

### Built from manufacturer documentation — pending instrument validation

- Interface type: Host-Query ASTM (ASTM E-1394-97)
- XN-L-IPU queries LIS for demographics and test orders after barcode scan
- LIS responds (downloads) with patient info and test parameters
- XN-L performs analysis and sends results back to LIS
- All XN-L models (XN-330 through XN-550) use the same interface format
- Rerun/reflex automatic only on XN-550 (rack-based sampler); other models require manual re-introduction
- XN-530 and XN-550 have internal barcode readers; XN-330, XN-350, XN-430, XN-450 require manual input or external reader

### Key differences between XN-L models

| Feature | XN-330 / XN-350 | XN-430 / XN-450 | XN-530 / XN-550 |
|---------|-----------------|-----------------|-----------------|
| Barcode reader | External only | External only | **Internal** |
| Sampling mode | Manual (open tube) only | Manual (open tube) only | Manual + Sampler (rack, XN-550 only) |
| OPEN indicator | Always present | Always present | Only when manually aspirated |
| LWBC mode | XN-350 only | XN-450 only | XN-550 only |
| Auto rerun/reflex | No | No | XN-550 only (rack mode) |
| Sampler Analysis ordering | N/A | N/A | XN-550 only |
| Retic licensing | Optional | Optional | Optional |
| Body Fluid licensing | Optional | Optional | Optional |
| Barcode read error handling | N/A | N/A | XN-530, XN-550 (ERR prefix) |

### Pending clarification

- **Real ASTM message captures** needed to confirm exact field positions and parameter ID formatting
- **Extended Order behavior** for WBC, NEUT%, NEUT# — confirm ^^^^WBC^1^^^^W format handling
- **LOINC code mapping** — not included in XN-L ASTM transactions; must be mapped in OpenELIS configuration
- **Unit configuration** — units are configurable on XN-L-IPU; need to confirm site-specific settings

---

## 1. Communication Protocol

### 1.1 Primary: TCP/IP (Ethernet)

XN-L is the client; OpenELIS (LIS) must be the server.

| Setting | Value |
|---------|-------|
| Format | XN-L series ASTM1381-02/ASTM1894-97 |
| Transport | TCP/IP |
| Default Port | Configurable (site-specific, e.g., 9994) |
| Network | 100 MBPS / Full duplex minimum |
| Network drops required | 2 (XN-L-IPU + BeyondCare Quality Monitor) |

### 1.2 Secondary: Serial (RS-232)

Required if LIS cannot act as TCP/IP server.

| Setting | Value |
|---------|-------|
| Format | XN-L series ASTM |
| Port | COM1 |
| Baud Rate | 9600 |
| Data Bits | 8-Bit |
| Stop Bit | 1-Bit |
| Parity | None |
| Interval | 2 |
| Class | Class B |
| Connector | 9-pin D-SUB (null modem required) |

**Null modem pinout:**
- Tx out (XN-L-IPU) = pin 3
- Rx in (XN-L-IPU) = pin 2
- Signal Ground = pin 5
- Jumper pins 4 and 6 (DTR ↔ DSR)
- Jumper pins 7 and 8 (RTS ↔ CTS)

### 1.3 ASTM Protocol Flow

```
1. XN-L reads barcode → sends QUERY to LIS (H, Q, L records)
2. LIS responds with ORDER DOWNLOAD (H, P, O, L records)
3. XN-L performs analysis
4. XN-L sends RESULTS to LIS (H, P, C, O, R..., L records)
5. If rerun/reflex triggered (XN-550 only), additional result set follows
```

---

## 2. ASTM Record Structure

### 2.1 Header Record (H)

```
H|\^&|||    XN-550^00-11^11090^^^^BD634545||||||||E1394-97
```

| Field | Position | Content | Notes |
|-------|----------|---------|-------|
| Record Type | H.1 | `H` | Always H |
| Delimiter | H.2 | `\^&` | Field, repeat, component delimiters |
| Sender ID | H.5 | `XN-550^00-11^11090^^^^BD634545` | Model^Config^SerialNo^^^^InstrumentID |
| Protocol Version | H.13 | `E1394-97` | ASTM E-1394-97 |

**Instrument identification from H.5:** Parse the first component before `^` to identify model (XN-330, XN-350, XN-430, XN-450, XN-530, XN-550).

### 2.2 Patient Record (P)

```
P|1|||MRN-4155|^MORPH^NEG||19901210|M|||||^ DOC,SYS||||||||||^^^CAREU
```

| Field | Position | Content | Notes |
|-------|----------|---------|-------|
| Record Type | P.1 | `P` | Always P |
| Sequence | P.2 | `1` | Sequential |
| Patient ID | P.4 | MRN / Lab ID | Laboratory-assigned |
| Patient Name | P.5 | `^MORPH^NEG` | Last^First^Middle |
| DOB | P.8 | `19901210` | YYYYMMDD |
| Sex | P.9 | `M` or `F` | |
| Attending Physician | P.14 | `^ DOC,SYS` | |
| Location | P.26 | `^^^CAREU` | Care unit |

### 2.3 Comment Record (C)

```
C|1||
```

Follows Patient record. Typically empty for XN-L results.

### 2.4 Order Record (O)

```
O|1||2^2^
4155^B||^^^^WBC\^^^^RBC\^^^^HGB\...||20160315172105|||||N||||||||||||||F
```

| Field | Position | Content | Notes |
|-------|----------|---------|-------|
| Record Type | O.1 | `O` | Always O |
| Sequence | O.2 | `1` | Sequential |
| Specimen ID | O.3 | `2^2^` | Rack^Position^ |
| Instrument Specimen ID | O.4 | `4155^B` | SampleID^SampleType (B=Blood, M=Manual) |
| Test IDs | O.5 | `^^^^WBC\^^^^RBC\...` | Backslash-delimited list of ordered tests |
| Collection DateTime | O.8 | `20160315172105` | YYYYMMDDHHMMSS |
| Action Code | O.12 | — | |
| Specimen Type | O.16 | — | |
| Result Status | O.26 | `F` or `Q` | F=Final, Q=Query response |

**Sample type codes in O.4:**
- `^B` = Whole blood (sampler/closed tube)
- `^M` = Manual mode (open tube)
- `^A` = QC sample

**O.26 field (No Order Exists behavior):**
- `Y` = Analyze with default order
- `X` = Do not aspirate

### 2.5 Result Record (R)

```
R|1|^^^^WBC^1|6.16|10*3/uL||N|N||||20160315161511
```

| Field | Position | Content | Example | Notes |
|-------|----------|---------|---------|-------|
| Record Type | R.1 | `R` | `R` | Always R |
| Sequence | R.2 | Integer | `1` | Sequential within message |
| Analysis Parameter ID | R.3 | `^^^^CODE^DILUTION^^^^EXTENDED` | `^^^^WBC^1` | See Section 3 |
| Data Value | R.4 | Numeric or `----` | `6.16` | Dashes = analysis error |
| Units | R.5 | String | `10*3/uL` | Configurable on XN-L-IPU |
| Reference Range | R.6 | — | — | Not typically sent |
| Result Abnormal Flag | R.7 | Flag code(s) | `N` | See Section 5 |
| Result Status | R.9 | `N`, `F`, or `P` | `N` | N=Normal, F=Final, P=Rerun/Reflex pending |
| Operator ID | R.11 | — | — | |
| DateTime Completed | R.13 | `YYYYMMDDHHMMSS` | `20160315161511` | Fixed format |

**CRITICAL: Analysis Parameter ID format (R.3):**
```
^^^^PARAMETER_CODE^DILUTION_RATIO^^^^EXTENDED_ORDER_INDICATOR
```
- Four carets prefix: `^^^^`
- Parameter code: e.g., `WBC`, `RBC`, `HGB`
- Caret separator: `^`
- Dilution ratio: `1` (standard) or `5` (pre-diluted)
- Extended order suffix (when present): `^^^^W` (switching algorithms / LWBC mode)

### 2.6 Terminator Record (L)

```
L|1|N
```

| Field | Position | Content |
|-------|----------|---------|
| Record Type | L.1 | `L` |
| Sequence | L.2 | `1` |
| Termination Code | L.3 | `N` = Normal termination |

---

## 3. Test Code Mapping — CBC Parameters

### 3.1 Core CBC (Always Available)

| Test Name | Parameter Code (R.3) | Dilution | Data Format (R.4) | Default Unit (R.5) | Abnormal Flags (R.7) | LOINC Code |
|-----------|---------------------|----------|-------------------|-------------------|---------------------|------------|
| White blood cell count | WBC | 1,5 | OOO.OO | 10^3/uL | L,H,>,A,W,LL,HH | 6690-2 |
| Red blood cell count | RBC | 1,5 | OO.OO | 10^6/uL | L,H,>,A,W,LL,HH | 789-8 |
| Hemoglobin | HGB | 1,5 | OOO.O | g/dL | L,H,>,A,W,LL,HH | 718-7 |
| Hematocrit | HCT | 1,5 | OOO.O | % | L,H,>,A,W,LL,HH | 4544-3 |
| Mean red blood cell volume | MCV | 1,5 | OOO.O | fL | L,H,>,A,W,LL,HH | 787-2 |
| Mean corpuscular hemoglobin | MCH | 1,5 | OOO.O | pg | L,H,>,A,W,LL,HH | 785-6 |
| Mean corpuscular hemoglobin concentration | MCHC | 1,5 | OOO.O | g/dL | L,H,>,A,W,LL,HH | 786-4 |
| Platelet count | PLT | 1,5 | OOOO | 10^3/uL | L,H,>,A,W,LL,HH | 777-3 |
| RBC distribution width — SD | RDW-SD | 1,5 | OOO.O | fL | L,H,>,A,W,LL,HH | 21000-5 |
| RBC distribution width — CV | RDW-CV | 1,5 | OOO.O | % | L,H,>,A,W,LL,HH | 788-0 |
| Mean platelet volume | MPV | 1,5 | OOO.O | fL | L,H,>,A,W,LL,HH | 32623-1 |

### 3.2 6-Part Differential (DIFF Profile)

| Test Name | Parameter Code (R.3) | Dilution | Data Format (R.4) | Default Unit (R.5) | LOINC Code |
|-----------|---------------------|----------|-------------------|-------------------|------------|
| Neutrophil % | NEUT% | 1,5 | OOO.O | % | 770-8 |
| Lymphocyte % | LYMPH% | 1,5 | OOO.O | % | 736-9 |
| Monocyte % | MONO% | 1,5 | OOO.O | % | 5905-5 |
| Eosinophil % | EO% | 1,5 | OOO.O | % | 713-8 |
| Basophil % | BASO% | 1,5 | OOO.O | % | 706-2 |
| Neutrophil # | NEUT# | 1,5 | OOO.OO | 10^3/uL | 751-8 |
| Lymphocyte # | LYMPH# | 1,5 | OOO.OO | 10^3/uL | 731-0 |
| Monocyte # | MONO# | 1,5 | OOO.OO | 10^3/uL | 742-7 |
| Eosinophil # | EO# | 1,5 | OOO.OO | 10^3/uL | 711-2 |
| Basophil # | BASO# | 1,5 | OOO.OO | 10^3/uL | 704-7 |
| Immature granulocyte % | IG% | 1,5 | OOO.O | % | 71695-1 |
| Immature granulocyte # | IG# | 1,5 | OOO.OO | 10^3/uL | 53115-2 |

**Note:** IG% and IG# are automatically output with every automated differential. The LIS profile must include these or the differential will not sum to 100%.

### 3.3 Extended Order Parameters (WBC, NEUT%, NEUT#)

When LWBC mode or XN-L switching algorithms are active, the parameter ID format changes:

| Test Code | Normal Analysis R.3 | LWBC/Switching R.3 | Notes |
|-----------|--------------------|--------------------|-------|
| WBC | `^^^^WBC^1` | `^^^^WBC^1^^^^W` | Parser must match both |
| NEUT% | `^^^^NEUT%^1` | `^^^^NEUT%^1^^^^W` | Parser must match both |
| NEUT# | `^^^^NEUT#^1` | `^^^^NEUT#^1^^^^W` | Parser must match both |

**Parser requirement:** Strip the `^^^^W` suffix before matching the parameter code. Both forms map to the same OpenELIS test.

### 3.4 Reticulocyte Parameters (Optional Licensing)

| Test Name | Parameter Code (R.3) | Dilution | Data Format (R.4) | Default Unit (R.5) | LOINC Code |
|-----------|---------------------|----------|-------------------|-------------------|------------|
| Reticulocyte % | RET% | 1,5 | OO.OO | % | 4679-7 |
| Reticulocyte # | RET# | 1,5 | O.OOOO | 10^6/uL | 60474-4 |
| Immature reticulocyte fraction | IRF | 1,5 | OOO.O | % | 42758-0 |
| Reticulocyte hemoglobin equivalent | RET-HE | 1,5 | OOO.O | pg | 70182-1 |

**Note:** RET-HE is automatically reported when any retic parameter (RET#, RET%, IRF) is ordered.

### 3.5 Body Fluid Parameters (Optional Licensing)

| Test Name | Parameter Code (R.3) | Dilution | Data Format (R.4) | Default Unit (R.5) | LOINC Code |
|-----------|---------------------|----------|-------------------|-------------------|------------|
| Body fluid — WBC | WBC-BF | 1 | OOO.OOO | 10^3/uL | 26464-8 |
| Body fluid — RBC | RBC-BF | 1 | OO.OOO | 10^6/uL | 26453-1 |
| Body fluid — mononuclear # | MN# | 1 | OOO.OOO | 10^3/uL | 35050-1 |
| Body fluid — mononuclear % | MN% | 1 | OOO.O | % | 71690-2 |
| Body fluid — polymorphonuclear # | PMN# | 1 | OOO.OOO | 10^3/uL | 35039-4 |
| Body fluid — polymorphonuclear % | PMN% | 1 | OOO.O | % | 71689-4 |
| Body fluid — total cell count | TC-BF# | 1 | OOO.OOO | 10^3/uL | 26465-5 |

**Note:** When running body fluid mode, no other parameters are reported. Downloaded blood test parameters are ignored.

---

## 4. Discrete Test Profiles

The XN-L uses predefined profile names for ordering groups of tests:

| Discrete Profile | Analysis Parameters Included |
|-----------------|------------------------------|
| CBC | WBC, RBC, HGB, HCT, MCV, MCH, MCHC, RDW-SD, RDW-CV, PLT, MPV |
| DIFF | NEUT#, LYMPH#, MONO#, EO#, BASO#, NEUT%, LYMPH%, MONO%, EO%, BASO%, IG#, IG% |
| RET | RET#, RET%, IRF, RET-HE |
| CBC+DIFF | All CBC + all DIFF parameters |
| CBC+RET | All CBC + all RET parameters (requires retic licensing) |
| CBC+DIFF+RET | All CBC + DIFF + RET parameters (requires retic licensing) |

**Parser note:** The XN-L-IPU will only display, print, and output results for the test parameters downloaded from the LIS. Even if the XN-L internally performs a full CBC+DIFF, only the requested parameters are sent.

**Exception:** When NEUT% and/or NEUT# are ordered, IG% and IG# are automatically included.

---

## 5. Result Abnormal Flags (R.7)

| XN-L-IPU Display | ASTM R.7 Value | Meaning | Severity |
|------------------|---------------|---------|----------|
| `-` | `L` | Below reference interval | informational |
| `+` | `H` | Above reference interval | informational |
| `@` | `>` | Out of assured linearity | warning |
| (None) | `N` | Normal result | — |
| `----` | `A` | Analysis error — value cannot be displayed | blocking |
| `++++` | `A` | Value exceeds display limit | blocking |
| IP message | `A` | IP Message flag present | warning |
| `*` | `W` | Low reliability | warning |
| `!` | `HH` or `LL` | Critical panic value / background check exceeded | blocking |

**Parser behavior:**
- `N` = Accept result as normal
- `L` or `H` = Accept result, attach flag for review
- `LL` or `HH` = Accept result, mark as critical for immediate review
- `A` = Check if data value is `----`; if so, reject result (analysis error). If data value is numeric, accept with IP message flag
- `W` = Accept result, attach low-reliability warning
- `>` = Accept result, attach linearity warning

---

## 6. Result Status (R.9)

| Value | Meaning | Parser Action |
|-------|---------|---------------|
| `F` | Final result — no applicable rerun/reflex rule | Accept as final |
| `N` | Normal (same as F for most purposes) | Accept as final |
| `P` | Rerun or Reflex rule triggered — additional results will follow | Accept but flag as preliminary; await subsequent result for same sample |

**Rerun/Reflex handling:** When R.9 = `P`, the XN-L will send the initial result set, then after the rerun/reflex analysis completes, send a second result set for the same sample ID. The LIS must handle both sets — typically the second (reflexed) result supersedes the first.

---

## 7. IP Messages

IP Messages are interpretive flags transmitted as additional R records. They have no numeric data value and always have R.7 = `A`. The parser should store these as comments/flags attached to the sample, not as test results.

### 7.1 Abnormal IP Messages (Analyzer-Generated)

| Parameter Code (R.3) | Meaning | User-Defined? |
|----------------------|---------|---------------|
| WBC_Abn_Scattergram | Abnormal WBC scattergram detected | No |
| Neutropenia | Low neutrophil count | Yes |
| Neutrophilia | High neutrophil count | Yes |
| Lymphopenia | Low lymphocyte count | Yes |
| Lymphocytosis | High lymphocyte count | Yes |
| Leukocytopenia | Low total WBC | Yes |
| Leukocytosis | High total WBC | Yes |
| Monocytosis | High monocyte count | Yes |
| Eosinophilia | High eosinophil count | Yes |
| Basophilia | High basophil count | Yes |
| IG_Present | Immature granulocytes detected | Yes |
| RBC_Abn_Distribution | Abnormal RBC distribution | Yes |
| Dimorphic_Population | Two distinct RBC populations | No |
| Anisocytosis | Abnormal RBC size variation | Yes |
| Microcytosis | Small RBC predominance | Yes |
| Macrocytosis | Large RBC predominance | Yes |
| Hypochromia | Low hemoglobin content in RBCs | Yes |
| Anemia | Low hemoglobin/RBC | Yes |
| Erythrocytosis | High RBC count | Yes |
| RET_Abn_Scattergram | Abnormal retic scattergram | Yes (optional licensing) |
| Reticulocytosis | High reticulocyte count | Yes (optional licensing) |
| PLT_Abn_Scattergram | Abnormal PLT scattergram | No |
| PLT_Abn_Distribution | Abnormal PLT distribution | No |
| Thrombocytopenia | Low platelet count | Yes |
| Thrombocytosis | High platelet count | Yes |

### 7.2 Suspect IP Messages (Q-Flag Based)

Sent with Q-Flag numeric value in R.4. Considered abnormal (present) only when Q-Flag exceeds threshold set on XN-L-IPU.

| Parameter Code (R.3) | Meaning |
|----------------------|---------|
| Left_Shift? | Possible left shift (immature neutrophils) |
| Atypical_Lympho? | Possible atypical lymphocytes |
| Blasts/Abn_Lympho? | Possible blasts or abnormal lymphocytes |
| NRBC? | Possible nucleated red blood cells |
| RBC_Agglutination? | Possible RBC agglutination |
| Turbidity/HGB_Interference? | Possible turbidity or hemoglobin interference |
| Iron_Deficiency? | Possible iron deficiency |
| HGB_Defect? | Possible hemoglobin defect |
| Fragments? | Possible cell fragments |
| PLT_Clumps? | Possible platelet clumps |

### 7.3 Positive and Error Judgments

| Parameter Code (R.3) | Meaning |
|----------------------|---------|
| Positive_Diff | Positive judgment on differential |
| Positive_Morph | Positive judgment on morphology |
| Positive_Count | Positive judgment on count |
| Error_Func | Analysis function error (e.g., "Sample Not Asp Error") |
| Error_Result | Analysis result error (e.g., "Low Blood Volume") |

### 7.4 Action Messages (Delta Check / Review)

| Parameter Code (R.3) | Meaning |
|----------------------|---------|
| ACTION_MESSAGE_Delta | General delta check triggered |
| ACTION_MESSAGE_Delta_WBC | WBC delta check triggered |
| ACTION_MESSAGE_Delta_HGB | HGB delta check triggered |
| ACTION_MESSAGE_Delta_MCV | MCV delta check triggered |
| ACTION_MESSAGE_Delta_PLT | PLT delta check triggered |
| ACTION_MESSAGE_RBC | RBC action required |
| ACTION_MESSAGE_Review_PLT | PLT review required |
| ACTION_MESSAGE_PLT | PLT action required |
| ACTION_MESSAGE_Aged_Sample? | Possible aged sample |

---

## 8. Scattergram and Histogram Images

The XN-L-IPU can transmit file paths to PNG scattergram/histogram images in R records:

| Parameter Code (R.3) | Image Type |
|----------------------|------------|
| DIST_RBC | RBC distribution histogram |
| DIST_PLT | PLT distribution histogram |
| SCAT_WDF | WDF scattergram |
| SCAT_RET | Retic scattergram |
| SCAT_WDF-CBC | WDF-CBC scattergram |
| SCAT_WDF-E | WDF (ext) scattergram |

**Data value (R.4):** File path string (e.g., `PNG&R&20151117&R&2015_11_17_08_1234567890_WDF.PNG`)

**Parser note:** These are file-based references to images stored on the XN-L-IPU shared drive. OpenELIS can optionally retrieve and store these images for result review.

---

## 9. QC Data Output

QC results can be transmitted in two formats:

| Format | Sample ID Pattern | Notes |
|--------|------------------|-------|
| QC Sample Number | `QC-XXXXXXXXXXXX` | Real-time QC; uses barcode label as ID |
| QC File Number | `1-96`, `XbarM1`, `XbarM2`, `XbarM3` | QC Chart data; XbarM1=CBC, XbarM2=DIFF, XbarM3=RET |

**Parser behavior:** Identify QC samples by `QC-` prefix or XbarM pattern. Route to QC module, not patient results.

---

## 10. Sample Classification

### 10.1 Sample ID Patterns

| Pattern | Example | Classification |
|---------|---------|---------------|
| Patient accession | `LM0523001`, `4155` | Patient sample |
| QC sample | `QC-XXXXXXXXXXXX` | QC control |
| QC file/XbarM | `XbarM1`, `1-96` | QC chart data |
| Barcode read error | `ERR000000000005` | Barcode error (XN-530/550 only) |

**Barcode read error:** When the XN-530 or XN-550 cannot read the barcode, it assigns an auto-incrementing ERR number and runs the default test. Results are still sent to the LIS.

### 10.2 Sample Type (from O.4)

| Code | Meaning |
|------|---------|
| `^B` | Whole blood (closed tube / sampler) |
| `^M` | Manual aspiration (open tube) |
| `^A` | QC material |

---

## 11. XN-L-IPU Settings for OpenELIS Integration

### 11.1 Recommended Operational Settings

| Setting | Location | Recommended Value | Notes |
|---------|----------|-------------------|-------|
| Auto Validate | Operational Settings | Selected, Use simple settings, All Samples | Results won't transmit until validated |
| Auto Output | Operational Settings | Selected; HC, Negative Data, Diff. Posi., Morph. Posi., Count Posi. all selected | Controls which result categories auto-output to LIS |
| Analysis Ordering | Operational Settings | Key Setting = Sample No.; Manual Analysis = Selected; Sampler Analysis = Selected (XN-550) | Enables host query on barcode scan |
| Units | Operational Settings | Match OpenELIS expected units | Verify decimal placement matches |

### 11.2 Connection Settings

| Setting | Location | TCP/IP Value | Serial Value |
|---------|----------|-------------|--------------|
| Connect to Host Computer | Output Settings → HOST | Selected | Selected |
| Connection Type | Output Settings → HOST | TCP/IP Connection | Serial Connection |
| Format | Output Settings → HOST | XN-L series ASTM1381-02/ASTM1894-97 | XN-L series ASTM |
| IP Address | Output Settings → HOST | OpenELIS server IP | N/A |
| Port | Output Settings → HOST | Match OpenELIS config | COM1 |

---

## 12. Result Interpretation Logic

### 12.1 Primary Interpretation

```
STEP 1: Check data value (R.4)
  IF R.4 = "----" (dashes):
    → result = ANALYSIS_ERROR (instrument could not compute)
    → Check for Error_Func / Error_Result IP messages
  ELIF R.4 = numeric:
    → result = VALID_NUMERIC

STEP 2: Check abnormal flag (R.7)
  IF R.7 = "A" AND R.4 = "----":
    → result = REJECT (hardware/analysis error)
  IF R.7 = "A" AND R.4 = numeric:
    → result = ACCEPT with IP_MESSAGE_FLAG
  IF R.7 = "LL" or "HH":
    → result = ACCEPT as CRITICAL
  IF R.7 = "L" or "H":
    → result = ACCEPT as ABNORMAL
  IF R.7 = "W":
    → result = ACCEPT with LOW_RELIABILITY warning
  IF R.7 = ">":
    → result = ACCEPT with LINEARITY warning
  IF R.7 = "N":
    → result = ACCEPT as NORMAL

STEP 3: Check result status (R.9)
  IF R.9 = "P":
    → Mark as PRELIMINARY — await rerun/reflex result
  IF R.9 = "F" or "N":
    → Mark as FINAL

STEP 4: Parse IP messages
  FOR each R record where parameter code matches IP message list:
    → Attach as comment/flag to the sample
    → Do NOT create a test result entry
```

### 12.2 Extended Order Handling

```
WHEN parsing R.3 (Analysis Parameter ID):
  1. Strip leading carets: ^^^^WBC^1^^^^W → WBC^1^^^^W
  2. Extract parameter code: WBC
  3. Extract dilution: 1
  4. Check for extended indicator: ^^^^W present?
     IF yes: note LWBC/switching mode in audit log
  5. Map parameter code to OpenELIS test using test_mapping config
```

---

## 13. Parser Configuration Schema

```json
{
  "analyzer_name": "Sysmex-XN-L",
  "instrument_models": ["XN-330", "XN-350", "XN-430", "XN-450", "XN-530", "XN-550"],

  "communication": {
    "protocol": "ASTM",
    "astm_version": "E1394-97",
    "transport_layer": "E1381-02",
    "mode": "host_query",
    "supported_transports": ["tcp_ip", "serial_rs232"],
    "tcp_default_port": 9994,
    "serial_settings": {
      "baud_rate": 9600,
      "data_bits": 8,
      "stop_bits": 1,
      "parity": "none"
    }
  },

  "record_parsing": {
    "header_instrument_field": "H.5",
    "instrument_id_component": 0,
    "patient_id_field": "P.4",
    "specimen_id_field": "O.4",
    "test_list_field": "O.5",
    "test_delimiter": "\\",
    "result_parameter_field": "R.3",
    "result_value_field": "R.4",
    "result_unit_field": "R.5",
    "result_flag_field": "R.7",
    "result_status_field": "R.9",
    "result_timestamp_field": "R.13",
    "timestamp_format": "YYYYMMDDHHMMSS"
  },

  "parameter_id_parsing": {
    "prefix": "^^^^",
    "component_separator": "^",
    "extended_suffix": "^^^^W",
    "strip_prefix_before_matching": true,
    "strip_extended_suffix_before_matching": true
  },

  "undetermined_values": ["----", ""],

  "flag_severity": {
    "N": "normal",
    "L": "informational",
    "H": "informational",
    "LL": "critical",
    "HH": "critical",
    "A": "conditional",
    "W": "warning",
    ">": "warning"
  },

  "result_status_mapping": {
    "F": "final",
    "N": "final",
    "P": "preliminary_rerun_pending"
  },

  "sample_classification": {
    "patient_pattern": "^[A-Z]{2}\\d+$|^\\d+$",
    "qc_sample_pattern": "^QC-",
    "qc_file_pattern": "^(\\d{1,2}|XbarM[1-3])$",
    "barcode_error_pattern": "^ERR\\d+$"
  },

  "ip_message_codes": [
    "WBC_Abn_Scattergram", "Neutropenia", "Neutrophilia",
    "Lymphopenia", "Lymphocytosis", "Leukocytopenia", "Leukocytosis",
    "Monocytosis", "Eosinophilia", "Basophilia", "IG_Present",
    "RBC_Abn_Distribution", "Dimorphic_Population", "Anisocytosis",
    "Microcytosis", "Macrocytosis", "Hypochromia", "Anemia",
    "Erythrocytosis", "RET_Abn_Scattergram", "Reticulocytosis",
    "PLT_Abn_Scattergram", "PLT_Abn_Distribution",
    "Thrombocytopenia", "Thrombocytosis",
    "Left_Shift?", "Atypical_Lympho?", "Blasts/Abn_Lympho?",
    "NRBC?", "RBC_Agglutination?", "Turbidity/HGB_Interference?",
    "Iron_Deficiency?", "HGB_Defect?", "Fragments?", "PLT_Clumps?",
    "Positive_Diff", "Positive_Morph", "Positive_Count",
    "Error_Func", "Error_Result",
    "ACTION_MESSAGE_Delta", "ACTION_MESSAGE_Delta_WBC",
    "ACTION_MESSAGE_Delta_HGB", "ACTION_MESSAGE_Delta_MCV",
    "ACTION_MESSAGE_Delta_PLT", "ACTION_MESSAGE_RBC",
    "ACTION_MESSAGE_Review_PLT", "ACTION_MESSAGE_PLT",
    "ACTION_MESSAGE_Aged_Sample?"
  ],

  "image_parameter_codes": [
    "DIST_RBC", "DIST_PLT", "SCAT_WDF", "SCAT_RET",
    "SCAT_WDF-CBC", "SCAT_WDF-E"
  ],

  "target_test_mapping": {
    "WBC": {"test_id": "CBC_WBC", "result_type": "quantitative", "loinc": "6690-2", "default_unit": "10^3/uL"},
    "RBC": {"test_id": "CBC_RBC", "result_type": "quantitative", "loinc": "789-8", "default_unit": "10^6/uL"},
    "HGB": {"test_id": "CBC_HGB", "result_type": "quantitative", "loinc": "718-7", "default_unit": "g/dL"},
    "HCT": {"test_id": "CBC_HCT", "result_type": "quantitative", "loinc": "4544-3", "default_unit": "%"},
    "MCV": {"test_id": "CBC_MCV", "result_type": "quantitative", "loinc": "787-2", "default_unit": "fL"},
    "MCH": {"test_id": "CBC_MCH", "result_type": "quantitative", "loinc": "785-6", "default_unit": "pg"},
    "MCHC": {"test_id": "CBC_MCHC", "result_type": "quantitative", "loinc": "786-4", "default_unit": "g/dL"},
    "PLT": {"test_id": "CBC_PLT", "result_type": "quantitative", "loinc": "777-3", "default_unit": "10^3/uL"},
    "RDW-SD": {"test_id": "CBC_RDW_SD", "result_type": "quantitative", "loinc": "21000-5", "default_unit": "fL"},
    "RDW-CV": {"test_id": "CBC_RDW_CV", "result_type": "quantitative", "loinc": "788-0", "default_unit": "%"},
    "MPV": {"test_id": "CBC_MPV", "result_type": "quantitative", "loinc": "32623-1", "default_unit": "fL"},
    "NEUT%": {"test_id": "DIFF_NEUT_PCT", "result_type": "quantitative", "loinc": "770-8", "default_unit": "%"},
    "LYMPH%": {"test_id": "DIFF_LYMPH_PCT", "result_type": "quantitative", "loinc": "736-9", "default_unit": "%"},
    "MONO%": {"test_id": "DIFF_MONO_PCT", "result_type": "quantitative", "loinc": "5905-5", "default_unit": "%"},
    "EO%": {"test_id": "DIFF_EO_PCT", "result_type": "quantitative", "loinc": "713-8", "default_unit": "%"},
    "BASO%": {"test_id": "DIFF_BASO_PCT", "result_type": "quantitative", "loinc": "706-2", "default_unit": "%"},
    "NEUT#": {"test_id": "DIFF_NEUT_ABS", "result_type": "quantitative", "loinc": "751-8", "default_unit": "10^3/uL"},
    "LYMPH#": {"test_id": "DIFF_LYMPH_ABS", "result_type": "quantitative", "loinc": "731-0", "default_unit": "10^3/uL"},
    "MONO#": {"test_id": "DIFF_MONO_ABS", "result_type": "quantitative", "loinc": "742-7", "default_unit": "10^3/uL"},
    "EO#": {"test_id": "DIFF_EO_ABS", "result_type": "quantitative", "loinc": "711-2", "default_unit": "10^3/uL"},
    "BASO#": {"test_id": "DIFF_BASO_ABS", "result_type": "quantitative", "loinc": "704-7", "default_unit": "10^3/uL"},
    "IG%": {"test_id": "DIFF_IG_PCT", "result_type": "quantitative", "loinc": "71695-1", "default_unit": "%"},
    "IG#": {"test_id": "DIFF_IG_ABS", "result_type": "quantitative", "loinc": "53115-2", "default_unit": "10^3/uL"},
    "RET%": {"test_id": "RET_PCT", "result_type": "quantitative", "loinc": "4679-7", "default_unit": "%"},
    "RET#": {"test_id": "RET_ABS", "result_type": "quantitative", "loinc": "60474-4", "default_unit": "10^6/uL"},
    "IRF": {"test_id": "RET_IRF", "result_type": "quantitative", "loinc": "42758-0", "default_unit": "%"},
    "RET-HE": {"test_id": "RET_HE", "result_type": "quantitative", "loinc": "70182-1", "default_unit": "pg"},
    "WBC-BF": {"test_id": "BF_WBC", "result_type": "quantitative", "loinc": "26464-8", "default_unit": "10^3/uL"},
    "RBC-BF": {"test_id": "BF_RBC", "result_type": "quantitative", "loinc": "26453-1", "default_unit": "10^6/uL"},
    "MN#": {"test_id": "BF_MN_ABS", "result_type": "quantitative", "loinc": "35050-1", "default_unit": "10^3/uL"},
    "MN%": {"test_id": "BF_MN_PCT", "result_type": "quantitative", "loinc": "71690-2", "default_unit": "%"},
    "PMN#": {"test_id": "BF_PMN_ABS", "result_type": "quantitative", "loinc": "35039-4", "default_unit": "10^3/uL"},
    "PMN%": {"test_id": "BF_PMN_PCT", "result_type": "quantitative", "loinc": "71689-4", "default_unit": "%"},
    "TC-BF#": {"test_id": "BF_TC", "result_type": "quantitative", "loinc": "26465-5", "default_unit": "10^3/uL"}
  }
}
```

---

## 14. Localization Tags

| Context | Tag | Default (English) |
|---------|-----|-------------------|
| Normal result | `label.result.normal` | Normal |
| Below reference | `label.result.belowReference` | Below Reference Range |
| Above reference | `label.result.aboveReference` | Above Reference Range |
| Critical low | `label.result.criticalLow` | Critical Low |
| Critical high | `label.result.criticalHigh` | Critical High |
| Analysis error | `label.result.analysisError` | Analysis Error — Value Not Available |
| Low reliability | `label.result.lowReliability` | Low Reliability |
| Linearity exceeded | `label.result.linearityExceeded` | Out of Assured Linearity Range |
| IP message present | `label.result.ipMessagePresent` | Interpretive Flag Present |
| Rerun pending | `label.result.rerunPending` | Preliminary — Rerun/Reflex Pending |
| Barcode read error | `label.sample.barcodeError` | Barcode Read Error |
| QC sample | `label.sample.qcSample` | QC Sample |
| Quantity not sufficient | `label.error.qns` | Quantity Not Sufficient |
| Error function | `label.error.errorFunc` | Instrument Function Error |
| Error result | `label.error.errorResult` | Instrument Result Error |

---

## 15. Error Handling

| Scenario | Parser Behavior |
|----------|----------------|
| ASTM connection timeout | Retry per configured interval; log connection failure |
| Malformed ASTM frame | Reject frame; send NAK; log parse error |
| Unknown instrument model in H.5 | Accept if ASTM format matches; log warning |
| Required R field missing | Flag result as incomplete |
| R.4 = `----` (dashes) | Reject result; store Error_Func/Error_Result IP messages |
| R.7 = `A` with no IP messages | Flag for manual review |
| Unknown parameter code in R.3 | Flag "Unmapped Parameter" in import preview |
| Sample ID not found in OpenELIS | Flag "Unmatched" in import preview |
| QC sample received | Route to QC module |
| Barcode error sample (ERR prefix) | Flag for operator resolution |
| Duplicate sample ID in transaction | Accept both; flag duplicates |
| R.9 = `P` (rerun pending) | Accept as preliminary; await final result |
| LWBC/Extended order format in R.3 | Strip `^^^^W` suffix; map normally |
| Body fluid parameters received | Route to body fluid result module |
| Image file path in R.4 | Store path; optionally retrieve PNG from XN-L-IPU share |

---

## 16. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-04 | Initial draft built from Sysmex XN-L LIS Interface Implementation Guide (1273-MKT, Rev 3, May 2020). All test codes, ASTM field positions, IP messages, flag mappings, and transaction structure from manufacturer documentation. LOINC codes added from standard hematology mappings. Pending validation against real instrument ASTM captures. |
