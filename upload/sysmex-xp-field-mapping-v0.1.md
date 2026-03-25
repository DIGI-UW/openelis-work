# Sysmex XP Series ASTM Field Mapping & Integration Specification

**Target Instruments:** XP-100, XP-300
**Software:** XP Series Firmware / Built-in Interface
**OpenELIS Module:** ASTM Bi-Directional Analyzer Interface
**Version:** 0.2 (Revised Draft)
**Date:** 2026-03-05
**Validated Against:**
- _Sysmex XP-300 Product Specification Document (496087349-XP-300-01.pdf)_ — Official Sysmex internal spec
- _Sysmex XP-300 Instructions for Use (303466651, Edición para toda América, Oct 2012, Software v00-05)_ — Official Sysmex user manual
- _Existing OpenELIS plugin reference: IntelliSOFT-Consulting/openelisglobal_plugins_xnl_xp_
- _No real ASTM message captures yet — ASTM record structure based on general ASTM E-1394-97 protocol knowledge_

---

## Validation Status

### Confidence Assessment

| Aspect | Confidence | Source |
|--------|-----------|--------|
| Parameter names & codes | **HIGH** | Official Sysmex product spec + user manual |
| Parameter ranges & units | **HIGH** | Official Sysmex product spec + user manual |
| Flag/alarm codes | **HIGH** | Official Sysmex product spec + user manual |
| Formulas & calculations | **HIGH** | Official Sysmex user manual (Section 14.6) |
| Connectivity (RS-232 / LAN) | **HIGH** | Official Sysmex product spec (Section 1.6.3.8) |
| ASTM record structure (H/P/O/R/L) | **MEDIUM-HIGH** | General ASTM E-1394-97 protocol — no XP-specific LIS Interface Implementation Guide available |
| ASTM field positions | **MEDIUM-HIGH** | Inferred from protocol standard — pending real instrument captures |
| Overall Spec Confidence | **HIGH** | Weighted assessment — parameters confirmed from official docs |

### Summary

- Interface type: ASTM (ASTM E-1394-97 / LIS2-A2)
- XP series is a **3-part differential** analyzer (Lymphocytes, Mixed/Mid cells, Neutrophils)
- The 3-part WBC differential uses histogram analysis with 4 discriminators (LD, T1, T2, UD) on the WBC histogram (30–300 fL range)
- 20 reportable parameters in whole blood mode
- Unlike the XN series (host-query), the XP series typically operates in **upload-only mode** — results are transmitted to the LIS after analysis, without prior host query
- Both XP-100 and XP-300 share the same ASTM message format
- **CRITICAL UPDATE (v0.2):** Official Sysmex documentation confirms the 3-part differential uses **LYM/MXD/NEUT** naming (not LYM/MXD/GRA). Internal Sysmex codes are W-SCR/W-MCR/W-LCR (ratios) and W-SCC/W-MCC/W-LCC (counts). The print output and user-facing display consistently uses the LYM/MXD/NEUT notation.

### Key differences between XP-100 and XP-300

| Feature | XP-100 | XP-300 |
|---------|--------|--------|
| Differential type | 3-part (LYM, MXD, NEUT) | 3-part (LYM, MXD, NEUT) |
| Connectivity | Serial (RS-232) | Serial (RS-232) + LAN (Ethernet) |
| Sampling mode | Open tube (manual) | Open tube (manual) + closed tube |
| Display | LCD | Color LCD |
| Throughput | ~60 samples/hr | ~60 samples/hr |
| Histograms | WBC, RBC, PLT | WBC, RBC, PLT |
| Internal QC | L-J charts | L-J charts |
| Barcode reader | Optional external | Optional external (RS-232C, DIN 8P connector) |
| Research parameters | None confirmed | ResearchW, ResearchS, ResearchM, ResearchL |

### Pending clarification

- **Real ASTM message captures** needed to confirm exact field positions and parameter ID formatting
- **Host-query capability** — confirm whether XP-300 with LAN supports host-query or upload-only
- **LOINC code mapping** — must be mapped in OpenELIS configuration (not transmitted by analyzer)
- **Research parameter transmission** — confirm whether ResearchW/S/M/L parameters are transmitted via ASTM

---

## 1. Communication Protocol

### 1.1 Primary: Serial (RS-232C)

Both XP-100 and XP-300 support serial communication as the primary interface.

| Setting | Default Value | Source |
|---------|--------------|--------|
| Protocol | ASTM E-1394-97 | Product Spec §1.6.3.8 |
| Baud Rate | 9600 BPS | Product Spec §1.6.3.8; Manual §14.4 |
| Data Bits | 8-Bit | Manual §14.4 |
| Stop Bits | 1-Bit | Manual §14.4 |
| Parity | None | Manual §14.4 |
| Connector | D-SUB-9 pin male (host); DIN 8P (barcode reader) | Manual §14.4 |
| Flow Control | RTS/CTS (hardware) | Manual §14.4 |
| Message Framing | STX (02H) ... ETX (03H) | Manual §14.4 |
| Checksum | LRC (Longitudinal Redundancy Check) | ASTM E-1394-97 standard |

**Additional supported baud rates:** 600, 1200, 2400, 4800, 14400 BPS

### 1.2 Secondary: TCP/IP (XP-300 with LAN option)

| Setting | Value | Source |
|---------|-------|--------|
| Protocol | ASTM over TCP/IP | Product Spec §1.6.3.8 |
| Transport | Ethernet (IEEE 802.3) | Product Spec §1.6.3.8 |
| Default Port | 7777 (verify with instrument configuration) | Inferred — needs confirmation |

**Host communication errors** (from Manual §13): HC Buffer Full (441010), HC Off-line (441020), HC ACK Timeout (441030), HC NAK Retry (442020), LAN no Response (486000), LAN Buffer Full (486030)

### 1.3 Data Transmission Capabilities

Per Product Spec §1.6.3.8, the XP-300 can transmit:
- Latest sample analysis results (results, flags, histograms)
- Stored data
- QC data
- SNCS (Sysmex Network Communication System) relative data

### 1.4 ASTM Protocol Flow (Upload Mode)

```
1. Operator loads sample and initiates analysis
2. XP performs CBC + 3-part differential
3. XP sends RESULTS to LIS (H, P, O, R..., L records)
4. LIS acknowledges receipt
```

**Note:** Unlike the XN-L series which uses host-query mode, the XP series typically operates in upload-only mode. The analyzer sends results after analysis without querying the LIS for orders.

---

## 2. ASTM Record Structure

### 2.1 Header Record (H)

| Field | Position | Content | Notes |
|-------|----------|---------|-------|
| Record Type | H.1 | `H` | Always H |
| Delimiter | H.2 | `\^&` | Field, repeat, component delimiters |
| Sender ID | H.5 | Instrument identification | Model + serial number |
| Protocol Version | H.13 | `E1394-97` | ASTM E-1394-97 |

### 2.2 Patient Record (P)

| Field | Position | Content | Notes |
|-------|----------|---------|-------|
| Record Type | P.1 | `P` | Always P |
| Sequence | P.2 | `1` | Sequential |
| Patient ID | P.4 | Lab-assigned ID | Sample number / barcode |

### 2.3 Order Record (O)

| Field | Position | Content | Notes |
|-------|----------|---------|-------|
| Record Type | O.1 | `O` | Always O |
| Sequence | O.2 | `1` | Sequential |
| Specimen ID | O.3 | Sample number | Barcode or manual entry |

### 2.4 Result Record (R)

| Field | Position | Content | Example | Notes |
|-------|----------|---------|---------|-------|
| Record Type | R.1 | `R` | `R` | Always R |
| Sequence | R.2 | Integer | `1` | Sequential |
| Parameter ID | R.3 | Test code | `WBC` | See Section 3 |
| Data Value | R.4 | Numeric | `6.5` | Or error indicator `---.-` |
| Units | R.5 | String | `10^3/uL` | Configurable by unit system type |
| Reference Range | R.6 | — | — | May not be sent |
| Abnormal Flag | R.7 | Flag code | `N` | See Section 4 & 5 |
| Result Status | R.9 | Status code | `F` | F=Final |
| DateTime | R.13 | `YYYYMMDDHHMMSS` | `20260304143022` | Analysis completion time |

**Undetermined values:** When a parameter cannot be calculated (e.g., due to histogram error), the value is displayed as `---.-` (dashes with decimal). These should be parsed as NULL/empty results.

### 2.5 Terminator Record (L)

| Field | Position | Content |
|-------|----------|---------|
| Record Type | L.1 | `L` |
| Sequence | L.2 | `1` |
| Termination Code | L.3 | `N` = Normal |

---

## 3. Test Code Mapping — CBC Parameters

### 3.1 Core CBC (Both XP-100 and XP-300)

| Test Name | Parameter Code (R.3) | Sysmex Internal Code | Data Format | Default Unit (Type 2) | Analysis Range | LOINC Code |
|-----------|---------------------|---------------------|-------------|----------------------|----------------|------------|
| White blood cell count | WBC | WBC | ###.# | ×10³/μL | 0.0–999.9 ×10³/μL | 6690-2 |
| Red blood cell count | RBC | RBC | ##.## | ×10⁶/μL | 0.00–99.99 ×10⁶/μL | 789-8 |
| Hemoglobin | HGB | HGB | ###.# | g/dL | 0.0–99.9 g/dL | 718-7 |
| Hematocrit | HCT | HCT | ###.# | % | 0.0–99.9 % | 4544-3 |
| Mean corpuscular volume | MCV | MCV | ###.# | fL | 0.0–999.9 fL | 787-2 |
| Mean corpuscular hemoglobin | MCH | MCH | ###.# | pg | 0.0–999.9 pg | 785-6 |
| Mean corpuscular hemoglobin concentration | MCHC | MCHC | ###.# | g/dL | 0.0–999.9 g/dL | 786-4 |
| Platelet count | PLT | PLT | #### | ×10³/μL | 0–9999 ×10³/μL | 777-3 |
| Red cell distribution width — CV | RDW-CV | RDW-CV | ###.# | % | 0.0–99.9 % | 788-0 |
| Red cell distribution width — SD | RDW-SD | RDW-SD | ###.# | fL | 0.0–999.9 fL | 21000-5 |
| Mean platelet volume | MPV | MPV | ###.# | fL | 0.0–99.9 fL | 32623-1 |
| Platelet distribution width | PDW | PDW | ###.# | fL | 0.0–99.9 fL | 32207-3 |
| Plateletcrit | PCT | PCT | #.### | % | 0.000–9.999 % | 61928-0 |
| Platelet — large cell ratio | P-LCR | P-LCR | ###.# | % | 0.0–99.9 % | 71258-8 |

**Calculated parameters** (from Manual §14.6):
- MCV (fL) = HCT (%) / RBC (×10⁶/μL) × 10
- MCH (pg) = HGB (g/dL) / RBC (×10⁶/μL) × 10
- MCHC (g/dL) = HGB (g/dL) / HCT (%) × 100
- MPV (fL) = PCT (%) / PLT (×10³/μL) × 10,000
- RDW-CV (%) = (L₂ − L₁) / (L₂ + L₁) × 100 (where L₁, L₂ define 68.26% of RBC distribution area)
- RDW-SD (fL) = width of RBC histogram at 20% of peak height

### 3.2 3-Part WBC Differential

**CONFIRMED (v0.2):** Official Sysmex documentation uses **LYM/MXD/NEUT** — NOT LYM/MXD/GRA. The previous draft used GRA which is incorrect per the manufacturer's official nomenclature.

| Test Name | Parameter Code (R.3) | Sysmex Internal Code | Data Format | Default Unit (Type 2) | Analysis Range | LOINC Code | Histogram Region |
|-----------|---------------------|---------------------|-------------|----------------------|----------------|------------|-----------------|
| Lymphocyte % | LYM% | W-SCR (Small Cell Ratio) | ###.# | % | 0.0–100.0 % | 736-9 | LD to T1 |
| Lymphocyte # | LYM# | W-SCC (Small Cell Count) | ###.# | ×10³/μL | 0.0–999.9 ×10³/μL | 731-0 | LD to T1 |
| Mixed cells % | MXD% | W-MCR (Middle Cell Ratio) | ###.# | % | 0.0–100.0 % | 5905-5 | T1 to T2 |
| Mixed cells # | MXD# | W-MCC (Middle Cell Count) | ###.# | ×10³/μL | 0.0–999.9 ×10³/μL | 742-7 | T1 to T2 |
| Neutrophil % | NEUT% | W-LCR (Large Cell Ratio) | ###.# | % | 0.0–100.0 % | 770-8 | T2 to UD |
| Neutrophil # | NEUT# | W-LCC (Large Cell Count) | ###.# | ×10³/μL | 0.0–999.9 ×10³/μL | 751-8 | Above T2 |

**3-part differential method:** The WBC histogram (30–300 fL) is divided using 4 discriminators:
- **LD** (Lower Discriminator): 30–60 fL, auto-positioned
- **T1** (Valley 1): Separates lymphocytes from mid cells
- **T2** (Valley 2): Separates mid cells from neutrophils
- **UD** (Upper Discriminator): Fixed at 300 fL

**Population definitions:**
- **LYM** (Lymphocytes) — small cells between LD and T1, correlates with lymphocyte count
- **MXD** (Mixed/Mid cells) — middle cells between T1 and T2, correlates with monocytes + basophils + eosinophils
- **NEUT** (Neutrophils) — large cells above T2, correlates with neutrophil count

The LYM% + MXD% + NEUT% should sum to approximately 100%.

### 3.3 Research Parameters (XP-300)

The English product spec (§1.6.2.1) lists research parameters. These are NOT part of the standard clinical result set and may not be transmitted via ASTM:

| Parameter Name | Description | Notes |
|---------------|-------------|-------|
| ResearchW | Research parameter — WBC related | Non-standard; verify if transmitted |
| ResearchS | Research parameter — Small cell related | Non-standard; verify if transmitted |
| ResearchM | Research parameter — Middle cell related | Non-standard; verify if transmitted |
| ResearchL | Research parameter — Large cell related | Non-standard; verify if transmitted |

---

## 4. Result Abnormal Flags (R.7) — Standard ASTM Flags

| ASTM R.7 Value | Meaning | Severity |
|---------------|---------|----------|
| `N` | Normal result | — |
| `L` | Below reference range | informational |
| `H` | Above reference range | informational |
| `LL` | Critical low (panic value) | critical |
| `HH` | Critical high (panic value) | critical |
| `A` | Abnormal — analysis error or value outside display range | blocking (if no data) / warning (if data present) |
| `>` | Out of assured linearity | warning |
| `<` | Below detection limit | warning |

**Parser behavior:** Same logic as XN series — see Section 6 of this spec.

---

## 5. Histogram Alarm / Flag Codes

These are instrument-specific flag codes transmitted to the host computer alongside or in place of the standard ASTM R.7 flags. They indicate histogram analysis abnormalities.

### 5.1 WBC Histogram Flags

| Flag Code | Description | Affected Parameters | Clinical Significance |
|-----------|-------------|--------------------|-----------------------|
| WL | Lower discriminator (LD) frequency exceeds interval | WBC, LYM%, MXD%, NEUT%, LYM#, MXD#, NEUT# | Platelet clumps, large platelets in WBC channel |
| WU | Upper discriminator (UD) frequency exceeds interval | WBC (marked); others may not be flagged | WBC aggregation or abnormal blood cells |
| T1 | Cannot determine T1 valley (LYM/MXD boundary) | LYM%, MXD%, NEUT%, LYM#, MXD#, NEUT# (not WBC) | Differential unreliable — no LYM/MXD separation |
| T2 | Cannot determine T2 valley (MXD/NEUT boundary) | MXD%, NEUT%, MXD#, NEUT# (not WBC, LYM%, LYM#) | MXD/NEUT separation unreliable |
| F1 | Small cell histogram error — T1 relative frequency exceeds interval | LYM%, LYM# | Abnormal lymphocyte distribution |
| F2 | Middle cell histogram error — T1 or T2 relative frequency exceeds interval | MXD%, MXD# | Abnormal mid-cell distribution |
| F3 | Large cell histogram error — T2 relative frequency exceeds interval | NEUT%, NEUT# | Abnormal neutrophil distribution |
| AG | Particle count ≤LD exceeds interval | PLT (flagged with AG) | Platelet clumping — may cause falsely low PLT |

### 5.2 RBC Histogram Flags

| Flag Code | Description | Affected Parameters |
|-----------|-------------|-------------------|
| RL | Lower discriminator (LD) frequency exceeds interval | RBC, HCT, MCV, MCH, MCHC, PLT, RDW-SD, RDW-CV |
| RU | Upper discriminator (UD) frequency exceeds interval | RBC, HCT, MCV, MCH, MCHC, PLT, RDW-SD, RDW-CV |
| DW | Distribution width error (20% frequency doesn't cross histogram 2×) | RDW-SD only (data not emitted); RDW-CV may be flagged |
| MP | 2 or more peaks in RBC histogram | RDW-SD (data not emitted); RDW-CV flagged with MP |

### 5.3 PLT Histogram Flags

| Flag Code | Description | Affected Parameters |
|-----------|-------------|-------------------|
| PL | Lower discriminator (LD) frequency exceeds interval | PLT, MPV |
| PU | Upper discriminator (UD) frequency exceeds interval | PLT, MPV |
| DW | Distribution width error | MPV (data not emitted) |
| MP | 2 or more peaks in PLT histogram | MPV (data not emitted) |

### 5.4 Flag-to-Host Transmission

The alarm tables in the manual include a HOST column indicating which alarm combinations are transmitted to the host computer. The specific HOST code numbers (1–8, A for WBC; 1–4 for RBC; 1–4 for PLT) correspond to alarm case patterns. The parser should:
1. Accept these flags alongside numeric results
2. When a flag is present and the value is `---.-` (undetermined), store the result as NULL with the flag code
3. When a flag is present but a numeric value is also provided, store both the value and the flag

---

## 6. Result Interpretation Logic

### 6.1 Primary Interpretation

```
STEP 1: Check data value (R.4)
  IF R.4 is empty, blank, "---.-", or "----":
    → result = ANALYSIS_ERROR (undetermined)
  ELIF R.4 = numeric (possibly with leading +/- for out-of-range):
    → result = VALID_NUMERIC
    IF value has leading "+" prefix:
      → Note: exceeds upper patient limit

STEP 2: Check abnormal flag (R.7)
  IF R.7 = histogram flag code (WL, T1, T2, F1, F2, F3, WU, RL, RU, DW, MP, PL, PU, AG):
    → result = ACCEPT with HISTOGRAM_WARNING
    IF data value = undetermined ("---.-"):
      → result = REJECT (histogram error prevented calculation)
  IF R.7 = "A" AND no data value:
    → result = REJECT (hardware/analysis error)
  IF R.7 = "A" AND data value present:
    → result = ACCEPT with WARNING
  IF R.7 = "LL" or "HH":
    → result = ACCEPT as CRITICAL
  IF R.7 = "L" or "H":
    → result = ACCEPT as ABNORMAL
  IF R.7 = "N":
    → result = ACCEPT as NORMAL

STEP 3: Check result status (R.9)
  IF R.9 = "F":
    → Mark as FINAL
```

### 6.2 Differential Validation

```
CHECK: LYM% + MXD% + NEUT% ≈ 100% (within ±2% tolerance)
  IF sum deviates significantly:
    → Attach warning: differential does not sum to 100%
  IF any differential parameter has undetermined value ("---.-"):
    → Flag the entire differential panel for manual review
```

---

## 7. Unit System Configuration

The XP-300 supports 6 unit system types. The default for most international deployments is **Type 2 (Export/General)**.

| Parameter | Type 1 (Japan) | Type 2 (Export) | Type 3 (SI Canada) | Type 4 (SI Holland) | Type 5 (SI Standard) | Type 6 (SI Hong Kong) |
|-----------|---------------|-----------------|--------------------|--------------------|---------------------|---------------------|
| WBC | ×10²/μL | ×10³/μL | ×10⁹/L | ×10⁹/L | ×10⁹/L | ×10⁹/L |
| RBC | ×10⁴/μL | ×10⁶/μL | ×10¹²/L | ×10¹²/L | ×10¹²/L | ×10¹²/L |
| HGB | g/dL | g/dL | g/L | mmol/L | g/L | g/dL |
| HCT | % | % | L/L | L/L | — | — |
| MCV | fL | fL | fL | fL | fL | fL |
| MCH | pg | pg | pg | amol | pg | pg |
| MCHC | g/dL | g/dL | g/L | mmol/L | g/L | g/dL |
| PLT | ×10⁴/μL | ×10³/μL | ×10⁹/L | ×10⁹/L | ×10⁹/L | ×10⁹/L |
| LYM#, MXD#, NEUT# | ×10²/μL | ×10³/μL | ×10⁹/L | ×10⁹/L | ×10⁹/L | ×10⁹/L |

**Parser note:** The parser must handle unit conversion based on the configured unit system. OpenELIS should normalize all results to a canonical unit for storage and display.

---

## 8. Histograms

The XP series generates three histograms that may be transmitted:

| Histogram | Particle Size Range | Discriminators | Key Parameters |
|-----------|-------------------|---------------|----------------|
| WBC | 30–300 fL | LD (30–60 fL), T1, T2, UD (300 fL) | LYM%, MXD%, NEUT%, LYM#, MXD#, NEUT# |
| RBC | 25–250 fL | LD (25–75 fL), UD (200–250 fL) | RDW-SD, RDW-CV |
| PLT | 2–30 fL | LD (2–6 fL), 12 fL fixed, UD (12–30 fL) | PDW, MPV, P-LCR, PCT |

**Parser note:** Histogram data format (if transmitted) is instrument-specific. Confirm with real ASTM capture whether histograms are sent as binary data, encoded arrays, or not transmitted at all.

---

## 9. Sample Classification

| Pattern | Classification | Notes |
|---------|---------------|-------|
| Patient accession number | Patient sample | Site-specific format |
| QC lot number | QC control | Route to QC module |

**Note:** The XP series does not have a barcode read error auto-increment like the XN-530/550. If the barcode is not read, the sample ID must be entered manually. Barcode reader connection uses RS-232C (DIN 8P connector) with STX/ETX framing.

---

## 10. Parser Configuration Schema

```json
{
  "analyzer_name": "Sysmex-XP",
  "instrument_models": ["XP-100", "XP-300"],

  "communication": {
    "protocol": "ASTM",
    "astm_version": "E1394-97",
    "mode": "upload_only",
    "supported_transports": ["serial_rs232", "tcp_ip"],
    "serial_settings": {
      "baud_rate": 9600,
      "data_bits": 8,
      "stop_bits": 1,
      "parity": "none",
      "flow_control": "rts_cts",
      "framing": "STX_ETX"
    },
    "tcp_default_port": 7777,
    "host_error_codes": {
      "441010": "HC Buffer Full",
      "441020": "HC Off-line",
      "441030": "HC ACK Timeout",
      "442020": "HC NAK Retry",
      "486000": "LAN no Response",
      "486030": "LAN Buffer Full"
    }
  },

  "record_parsing": {
    "header_instrument_field": "H.5",
    "patient_id_field": "P.4",
    "specimen_id_field": "O.3",
    "result_parameter_field": "R.3",
    "result_value_field": "R.4",
    "result_unit_field": "R.5",
    "result_flag_field": "R.7",
    "result_status_field": "R.9",
    "result_timestamp_field": "R.13",
    "timestamp_format": "YYYYMMDDHHMMSS"
  },

  "undetermined_values": ["", "---.-", "----"],

  "flag_severity": {
    "N": "normal",
    "L": "informational",
    "H": "informational",
    "LL": "critical",
    "HH": "critical",
    "A": "conditional",
    ">": "warning",
    "<": "warning"
  },

  "histogram_flags": {
    "WL": {"type": "wbc_histogram", "severity": "warning", "description": "WBC lower discriminator frequency exceeds interval"},
    "WU": {"type": "wbc_histogram", "severity": "warning", "description": "WBC upper discriminator frequency exceeds interval"},
    "T1": {"type": "wbc_histogram", "severity": "warning", "description": "Cannot determine T1 valley (LYM/MXD boundary)"},
    "T2": {"type": "wbc_histogram", "severity": "warning", "description": "Cannot determine T2 valley (MXD/NEUT boundary)"},
    "F1": {"type": "wbc_histogram", "severity": "warning", "description": "Small cell histogram error"},
    "F2": {"type": "wbc_histogram", "severity": "warning", "description": "Middle cell histogram error"},
    "F3": {"type": "wbc_histogram", "severity": "warning", "description": "Large cell histogram error"},
    "AG": {"type": "wbc_histogram", "severity": "warning", "description": "Platelet clumping suspected"},
    "RL": {"type": "rbc_histogram", "severity": "warning", "description": "RBC lower discriminator frequency exceeds interval"},
    "RU": {"type": "rbc_histogram", "severity": "warning", "description": "RBC upper discriminator frequency exceeds interval"},
    "DW": {"type": "rbc_plt_histogram", "severity": "warning", "description": "Distribution width error"},
    "MP": {"type": "rbc_plt_histogram", "severity": "warning", "description": "Multiple peaks in histogram"},
    "PL": {"type": "plt_histogram", "severity": "warning", "description": "PLT lower discriminator frequency exceeds interval"},
    "PU": {"type": "plt_histogram", "severity": "warning", "description": "PLT upper discriminator frequency exceeds interval"}
  },

  "result_status_mapping": {
    "F": "final"
  },

  "sample_classification": {
    "patient_pattern": "^[A-Z]{2}\\d+$|^\\d+$",
    "qc_pattern": "^QC"
  },

  "target_test_mapping": {
    "WBC": {"test_id": "CBC_WBC", "result_type": "quantitative", "loinc": "6690-2", "default_unit": "10^3/uL", "sysmex_code": "WBC"},
    "RBC": {"test_id": "CBC_RBC", "result_type": "quantitative", "loinc": "789-8", "default_unit": "10^6/uL", "sysmex_code": "RBC"},
    "HGB": {"test_id": "CBC_HGB", "result_type": "quantitative", "loinc": "718-7", "default_unit": "g/dL", "sysmex_code": "HGB"},
    "HCT": {"test_id": "CBC_HCT", "result_type": "quantitative", "loinc": "4544-3", "default_unit": "%", "sysmex_code": "HCT"},
    "MCV": {"test_id": "CBC_MCV", "result_type": "quantitative", "loinc": "787-2", "default_unit": "fL", "sysmex_code": "MCV", "calculated": true},
    "MCH": {"test_id": "CBC_MCH", "result_type": "quantitative", "loinc": "785-6", "default_unit": "pg", "sysmex_code": "MCH", "calculated": true},
    "MCHC": {"test_id": "CBC_MCHC", "result_type": "quantitative", "loinc": "786-4", "default_unit": "g/dL", "sysmex_code": "MCHC", "calculated": true},
    "PLT": {"test_id": "CBC_PLT", "result_type": "quantitative", "loinc": "777-3", "default_unit": "10^3/uL", "sysmex_code": "PLT"},
    "RDW-CV": {"test_id": "CBC_RDW_CV", "result_type": "quantitative", "loinc": "788-0", "default_unit": "%", "sysmex_code": "RDW-CV"},
    "RDW-SD": {"test_id": "CBC_RDW_SD", "result_type": "quantitative", "loinc": "21000-5", "default_unit": "fL", "sysmex_code": "RDW-SD"},
    "MPV": {"test_id": "CBC_MPV", "result_type": "quantitative", "loinc": "32623-1", "default_unit": "fL", "sysmex_code": "MPV", "calculated": true},
    "PDW": {"test_id": "CBC_PDW", "result_type": "quantitative", "loinc": "32207-3", "default_unit": "fL", "sysmex_code": "PDW"},
    "PCT": {"test_id": "CBC_PCT", "result_type": "quantitative", "loinc": "61928-0", "default_unit": "%", "sysmex_code": "PCT"},
    "P-LCR": {"test_id": "CBC_PLCR", "result_type": "quantitative", "loinc": "71258-8", "default_unit": "%", "sysmex_code": "P-LCR"},
    "LYM%": {"test_id": "DIFF3_LYM_PCT", "result_type": "quantitative", "loinc": "736-9", "default_unit": "%", "sysmex_code": "W-SCR"},
    "LYM#": {"test_id": "DIFF3_LYM_ABS", "result_type": "quantitative", "loinc": "731-0", "default_unit": "10^3/uL", "sysmex_code": "W-SCC"},
    "MXD%": {"test_id": "DIFF3_MXD_PCT", "result_type": "quantitative", "loinc": "5905-5", "default_unit": "%", "sysmex_code": "W-MCR"},
    "MXD#": {"test_id": "DIFF3_MXD_ABS", "result_type": "quantitative", "loinc": "742-7", "default_unit": "10^3/uL", "sysmex_code": "W-MCC"},
    "NEUT%": {"test_id": "DIFF3_NEUT_PCT", "result_type": "quantitative", "loinc": "770-8", "default_unit": "%", "sysmex_code": "W-LCR"},
    "NEUT#": {"test_id": "DIFF3_NEUT_ABS", "result_type": "quantitative", "loinc": "751-8", "default_unit": "10^3/uL", "sysmex_code": "W-LCC"}
  }
}
```

---

## 11. Localization Tags

| Context | Tag | Default (English) |
|---------|-----|-------------------|
| Normal result | `label.result.normal` | Normal |
| Below reference | `label.result.belowReference` | Below Reference Range |
| Above reference | `label.result.aboveReference` | Above Reference Range |
| Critical low | `label.result.criticalLow` | Critical Low |
| Critical high | `label.result.criticalHigh` | Critical High |
| Analysis error | `label.result.analysisError` | Analysis Error — Value Not Available |
| Linearity exceeded | `label.result.linearityExceeded` | Out of Assured Linearity Range |
| Below detection | `label.result.belowDetection` | Below Detection Limit |
| QC sample | `label.sample.qcSample` | QC Sample |
| Histogram warning | `label.result.histogramWarning` | Histogram Alarm — Review Distribution |

---

## 12. Error Handling

| Scenario | Parser Behavior |
|----------|----------------|
| ASTM connection timeout | Retry per configured interval; log connection failure |
| Malformed ASTM frame | Reject frame; send NAK; log parse error |
| Unknown instrument model | Accept if ASTM format matches; log warning |
| Required R field missing | Flag result as incomplete |
| Data value = `---.-` or `----` | Store as NULL; attach histogram flag code if present |
| Data value with `+` prefix | Accept value; note exceeds patient upper limit |
| Unknown parameter code | Flag "Unmapped Parameter" in import preview |
| Sample ID not found in OpenELIS | Flag "Unmatched" in import preview |
| QC sample received | Route to QC module |
| Duplicate sample ID | Accept both; flag duplicates |
| Differential does not sum to ~100% | Attach warning for review |
| Histogram flag with undetermined value | Store flag, reject the numeric result |
| Histogram flag with valid value | Accept value, store flag as informational |
| HC Buffer Full (441010) | Analyzer-side error — instrument cannot send; check connection |
| HC Off-line (441020) | Analyzer detects host is offline; verify LIS is running |
| HC ACK Timeout (441030) | Analyzer timed out waiting for ACK from host; check network |
| HC NAK Retry (442020) | Analyzer received NAK; message will be retried |
| LAN no Response (486000) | Network connection failure; check Ethernet |
| LAN Buffer Full (486030) | Network buffer overflow; reduce transmission rate |

---

## 13. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-04 | Initial draft built from web research and general ASTM E-1394-97 protocol knowledge. Parameter codes (LYM vs LYMPH, MXD vs MID, GRA vs GRN) flagged as pending confirmation. Overall confidence: MEDIUM-HIGH. |
| 0.2 | 2026-03-05 | **Major revision** based on official Sysmex XP-300 documentation (Product Specification + Instructions for Use). **Key changes:** (1) Corrected 3-part differential naming from GRA/GRN to **NEUT** — official Sysmex name is NEUT%/NEUT# (internal codes W-LCR/W-LCC). (2) Added Sysmex internal codes (W-SCR, W-MCR, W-LCR, W-SCC, W-MCC, W-LCC) for all differential parameters. (3) Added complete histogram alarm flag codes (WL, WU, T1, T2, F1, F2, F3, AG, RL, RU, DW, MP, PL, PU) with affected parameter mapping. (4) Added flag-to-host transmission tables. (5) Added unit system configuration (6 types). (6) Added calculation formulas for MCV, MCH, MCHC, MPV, RDW-CV, RDW-SD. (7) Added analysis ranges for all parameters. (8) Added discriminator ranges (WBC 30–300 fL, RBC 25–250 fL, PLT 2–30 fL). (9) Added host communication error codes. (10) Removed ANC as a separate parameter — NEUT# IS the neutrophil absolute count. (11) Upgraded confidence: Parameter mapping → HIGH, overall → HIGH (weighted). ASTM record format remains MEDIUM-HIGH pending real captures. |
