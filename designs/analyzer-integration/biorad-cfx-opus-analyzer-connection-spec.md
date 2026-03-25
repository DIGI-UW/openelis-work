# Analyzer Connection Specification: BioRad CFX Opus Real-Time PCR System

**Document Version:** 1.1 (Manual-Verified)
**Date:** 2026-03-05
**Status:** Draft — Updated with Instrument Guide (Doc #10000119983)
**Author:** Casey / DIGI-UW

---

## 1. Analyzer Overview

| Field | Value |
|---|---|
| **Analyzer Name** | BioRad CFX Opus |
| **Manufacturer** | Bio-Rad Laboratories |
| **Analyzer Type** | Real-Time PCR (qPCR) |
| **Models Covered** | CFX Opus 96 (#12011319), CFX Opus 384 (#12011452), CFX Opus Deepwell (#12016658) |
| **Software** | CFX Maestro Software v2.3 (#12013758) / BR.io Cloud Platform |
| **Test Category** | Molecular / RT-PCR |
| **Use Cases** | SARS-CoV-2, TB/MTB, HIV Viral Load, HCV, HPV, other molecular assays |
| **Manual Reference** | CFX Opus Instrument Guide, Doc #10000119983, © 2021 Bio-Rad |

### 1.1 Instrument Capabilities

The CFX Opus is Bio-Rad's current-generation real-time PCR platform. It supports standalone operation with onboard touchscreen, USB data transfer, Ethernet, and Wi-Fi connectivity. The instrument is controlled and analyzed through CFX Maestro Software, which provides LIMS integration, data analysis, and multi-format export.

### 1.2 Connectivity & Ports (Verified from Instrument Guide)

| Interface | Specification | Location |
|---|---|---|
| **Ethernet** | 10/100 BASE-T (RJ45), DHCP default, IPv4 only | Rear panel |
| **USB Type B** | USB 2.0, connects to computer running CFX Maestro | Rear panel (1 port) |
| **USB Type A** | USB 2.0, for USB drives / barcode scanners | Rear panel (2 ports), Front panel (1 port) |
| **Wi-Fi** | IEEE 802.11b/g/n 2.4 GHz + IEEE 802.11a/n/ac 5 GHz | Requires locale-specific Wi-Fi adapter |
| **Network Drive** | SMB/CIFS shared folder via UNC path (`\\server\share\folder`) | Via Ethernet or Wi-Fi |

> **Note:** Bio-Rad requires use of their approved USB cable (#12012942) and Ethernet cable (#12013205) for EMC compliance.

### 1.3 Optical Detection Specifications

| Model | LEDs | Photodiodes | Wavelength Range | Max Targets/Well |
|---|---|---|---|---|
| CFX Opus 96 | 6 | 6 | 450–730 nm | 5 |
| CFX Opus 384 | 5 | 5 | 450–690 nm | 4 |
| CFX Opus Deepwell | 6 | 6 | 450–730 nm | 5 |

### 1.4 File Storage Capacity (Onboard)

| Model | Total Files | My Files | Run Reports |
|---|---|---|---|
| CFX Opus 96 | 1,000 | 900 | 100 |
| CFX Opus Deepwell | 1,000 | 900 | 100 |
| CFX Opus 384 | 500 | 400 | 100 |

> **Note:** Folder and file names have a 32-character limit on the instrument.

---

## 2. Communication Protocol

### 2.1 Integration Method: File-Based (CSV)

The BioRad CFX Opus does **not** use ASTM or HL7 natively. Integration with OpenELIS Global will use a **file-based approach** where CFX Maestro Software exports result data as CSV files to a monitored directory.

| Parameter | Value |
|---|---|
| **Protocol** | File-based (CSV export to shared/watched folder) |
| **Direction** | Unidirectional (Analyzer → OpenELIS) |
| **Transport** | Local filesystem / Network shared folder |
| **Middleware** | OpenELIS Analyzer Bridge (file watcher transport) or direct plugin file reader |

### 2.2 Data File Types (Verified from Instrument Guide)

| File Type | Extension | Description | Integration Relevance |
|---|---|---|---|
| **Protocol** | (binary) | PCR protocol definition | Not directly relevant |
| **Data / Run file** | `.zpcr` | Raw fluorescence data from completed run | Primary data file; opened in CFX Maestro for analysis and CSV export |
| **JSON** | `.json` | Auto-generated after run (read-only) | Potential alternative data source (structure TBD) |
| **Pending run** | (from BR.io) | Downloaded from BR.io cloud for execution | Not relevant to results flow |

### 2.3 Integration Architecture Options

**Option A — Direct Plugin (Recommended for simplicity)**
CFX Maestro exports CSV → shared folder → OpenELIS file-based analyzer plugin reads and parses the file.

**Option B — Analyzer Bridge Middleware**
CFX Maestro exports CSV → shared folder → OpenELIS Analyzer Bridge (file watcher) → forwards parsed data to OpenELIS via HTTP.

### 2.4 Data Transfer Pathways (Verified from Instrument Guide)

The instrument guide documents several ways data files leave the CFX Opus instrument:

1. **USB Type B → CFX Maestro (primary)**: Instrument connects directly to CFX Maestro computer. CFX Maestro detects the instrument automatically and receives run data.
2. **Shared Network Drive**: Run files can be copied to a network drive via the instrument's File Browser (Network directory). The CFX Maestro computer can then open these files.
3. **USB Drive**: Run files can be copied to a USB Type A flash drive for manual transfer.
4. **Email**: The instrument can email data files directly after run completion (via configured SMTP server).
5. **BR.io Cloud**: Results upload to Bio-Rad's cloud platform for remote analysis.

> **For LIMS integration, the recommended flow is:** CFX Opus → USB/Network → CFX Maestro → LIMS CSV Export → Shared folder → OpenELIS

### 2.5 Shared Network Drive Configuration (Verified from Instrument Guide)

The CFX Opus connects to Windows shared network folders using SMB/CIFS:

| Parameter | Format | Example |
|---|---|---|
| **Folder Path** | `\\server_name\folder_name\...\target_folder` | `\\usherfs\users\023748` |
| **Credentials** | `global_domain_name\user_name` | `Global\CarIn` |
| **Password** | Network password (saved optionally on instrument) | — |
| **Prerequisites** | Ethernet or Wi-Fi configured; CFX Opus user password set | — |

> **Note:** The instrument reports whether a connected network folder is read-only. For LIMS export, the network folder from CFX Maestro's perspective is separate from the instrument's network folder — the CSV export happens from CFX Maestro Software, not from the instrument directly.

### 2.6 Bidirectional Considerations (Future)

CFX Maestro supports a LIMS input file (`.plrn`) for plate setup. A future enhancement could support OpenELIS sending work orders to the analyzer by generating `.plrn` files containing sample IDs, targets, and protocol references. This is **out of scope** for the initial implementation.

---

## 3. Data Format Specification

### 3.1 Export File Format

| Property | Value |
|---|---|
| **File Format** | CSV (`.csv`) |
| **Encoding** | UTF-8 |
| **Delimiter** | Comma (`,`) |
| **Header Row** | Yes (first row) |
| **Source Software** | CFX Maestro → Export → LIMS Export *or* Export All Data Sheets |

### 3.2 LIMS CSV Export Columns

The standard LIMS-compatible CSV export from CFX Maestro contains the following columns:

| Column Name | Description | Data Type | Example | Maps To (OpenELIS) |
|---|---|---|---|---|
| `Well` | Well position on the plate | String | `A01`, `B03` | — (metadata) |
| `Fluor` | Fluorophore / detection channel | String | `FAM`, `HEX`, `ROX` | — (used for target mapping) |
| `Target` | Target gene / assay name | String | `SARS-CoV-2`, `RNase P` | Test name mapping |
| `Content` | Well content type | String | `Unkn`, `Pos Ctrl`, `Neg Ctrl`, `NTC`, `Std` | — (filter: only process `Unkn`) |
| `Sample` | Sample identifier (accession number) | String | `24-00001234` | Accession number |
| `Biological Set Name` | Biological replicate group name | String | `Sample_1` | — (optional grouping) |
| `Cq` | Quantification cycle value | Float or `N/A` | `28.45`, `N/A` | Result value |

### 3.3 Extended Export Columns (Quantification Cq Results)

When using "Export All Data Sheets" → "Quantification Cq Results", additional columns may be present:

| Column Name | Description | Maps To (OpenELIS) |
|---|---|---|
| `Cq Mean` | Mean Cq of replicates | — (informational) |
| `Cq Std. Dev` | Standard deviation of replicate Cqs | — (informational) |
| `Starting Quantity (SQ)` | Calculated starting quantity | Result value (quantitative assays) |
| `Log Starting Quantity` | Log10 of SQ | — (informational) |
| `SQ Mean` | Mean SQ of replicates | — (informational) |
| `SQ Std. Dev` | Std dev of replicate SQs | — (informational) |
| `Set Point` | End-point fluorescence | — (informational) |
| `Call` | Qualitative call (+/-) | Result value (qualitative assays) |

### 3.4 Sample CSV Output Example

```csv
Well,Fluor,Target,Content,Sample,Biological Set Name,Cq
A01,FAM,SARS-CoV-2,Pos Ctrl,PC-001,Positive Control,18.23
A02,FAM,SARS-CoV-2,Neg Ctrl,NC-001,Negative Control,N/A
A03,FAM,SARS-CoV-2,Unkn,24-00001234,Patient_1,25.67
A03,HEX,RNase P,Unkn,24-00001234,Patient_1,22.14
A04,FAM,SARS-CoV-2,Unkn,24-00001235,Patient_2,N/A
A04,HEX,RNase P,Unkn,24-00001235,Patient_2,21.98
B01,FAM,SARS-CoV-2,NTC,NTC-001,No Template,N/A
```

---

## 4. OpenELIS Plugin Specification

### 4.1 Plugin Identity

| Property | Value |
|---|---|
| **Plugin Name** | `BioRadCFXOpus` |
| **Analyzer Name (DB)** | `BioRadCFXOpus` |
| **Package** | `oe.plugin.analyzer` |
| **Reference Plugin** | `GeneXpertFile` (similar file-based molecular analyzer) |
| **Menu Label** | `Bio-Rad CFX Opus` |
| **Action URL** | `/AnalyzerResults?type=BioRadCFXOpus` |

### 4.2 Required Plugin Classes

| Class | Extends / Implements | Purpose |
|---|---|---|
| `BioRadCFXOpusAnalyzerImplementation` | `AnalyzerImporterPlugin` | Registers analyzer, maps test names, provides line inserter |
| `BioRadCFXOpusMenu` | `MenuPlugin` | Adds menu entry under Analyzer Results |
| `BioRadCFXOpusPermission` | `PermissionPlugin` | Binds role-based access |
| `BioRadCFXOpusAnalyzer` | (Analyzer line inserter) | Parses CSV, extracts results, inserts into OpenELIS |

### 4.3 Configuration XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plugin>
  <extension point="org.openelisglobal.analyzerimporter">
    <analyzer name="BioRadCFXOpusAnalyzerImplementation"/>
  </extension>
  <extension point="org.openelisglobal.menu">
    <menu name="BioRadCFXOpusMenu"/>
  </extension>
  <extension point="org.openelisglobal.permission">
    <permission name="BioRadCFXOpusPermission"/>
  </extension>
</plugin>
```

### 4.4 File Identification Logic

The `isTargetAnalyzer()` method should identify BioRad CFX Opus CSV files by checking for:

1. **Header row match**: Presence of columns `Well`, `Fluor`, `Target`, `Content`, `Sample`, `Cq` (in any order)
2. **Optional secondary check**: File naming convention if configured (e.g., `*_Quantification Cq Results*.csv`)

### 4.5 Parsing Logic

```
FOR each row in CSV:
  1. SKIP if Content != "Unkn" (ignore controls, standards, NTC)
  2. EXTRACT Sample → map to OpenELIS accession number
  3. EXTRACT Target + Fluor → map to OpenELIS test name via analyzer-test mapping
  4. EXTRACT Cq value:
     - If Cq == "N/A" or empty → result is "Negative" / "Target Not Detected"
     - If Cq is numeric → store as quantitative result
  5. If "Call" column present:
     - Use Call value (+/-) as qualitative result
  6. INSERT into analyzer_results table
```

### 4.6 Test Name Mapping

The plugin's `connect()` method must register mappings between CFX Maestro target names and OpenELIS test names. These mappings are **deployment-specific** and must be configured per site.

| CFX Maestro Target | Fluor | OpenELIS Test Name (Example) | Notes |
|---|---|---|---|
| `SARS-CoV-2` | `FAM` | `COVID-19 PCR` | Primary target |
| `RNase P` | `HEX` | `RNase P (IC)` | Internal control |
| `MTB` | `FAM` | `TB PCR` | TB detection |
| `rpoB` | `HEX` | `Rifampicin Resistance` | Resistance marker |

> **Note:** Actual mappings depend on the assay kits used at each site. The plugin should support configurable mappings, ideally via a properties file or database configuration.

---

## 5. Result Interpretation

### 5.1 Qualitative Assays (Detection)

| Condition | Result | OpenELIS Value |
|---|---|---|
| Target Cq is numeric AND < cutoff | Detected / Positive | `Positive` or `Detected` |
| Target Cq is `N/A` or > cutoff | Not Detected / Negative | `Negative` or `Not Detected` |
| Internal control Cq is `N/A` | Invalid | `Invalid` — flag for repeat |

### 5.2 Quantitative Assays (Viral Load)

| Condition | Result | OpenELIS Value |
|---|---|---|
| SQ value present and numeric | Quantified | Store numeric value + units (e.g., copies/mL) |
| Cq present but below quantification range | Detected, below LOQ | `Detected < LOQ` |
| Cq is `N/A` | Not Detected | `Not Detected` or `< LOD` |

### 5.3 Quality Control Validation

Before accepting patient results, the plugin should validate QC wells:

| QC Check | Expected | Action on Failure |
|---|---|---|
| Positive Control (`Pos Ctrl`) | Cq within expected range | Reject entire run |
| Negative Control (`Neg Ctrl`) | Cq = `N/A` (no amplification) | Reject entire run |
| No Template Control (`NTC`) | Cq = `N/A` | Reject entire run |
| Internal Control (`IC`) per sample | Cq within expected range | Reject individual sample |

---

## 6. Deployment Configuration

### 6.1 CFX Maestro Software Setup

1. Connect CFX Opus to CFX Maestro computer via USB Type B cable (#12012942)
2. Start CFX Maestro — verify instrument appears in "Detected Instruments" pane
3. Open CFX Maestro → **Tools** → **Options** → **Data Export Settings**
4. Set **LIMS Export Folder** to a path accessible by the OpenELIS server (e.g., network share or local directory if co-located)
5. Set **Export Format** to `CSV (*.csv)`
6. Enable **Auto-export after run completion**
7. Configure **Export columns** to include at minimum: `Well`, `Fluor`, `Target`, `Content`, `Sample`, `Biological Set Name`, `Cq`

> **Tip:** If the instrument does not appear in the Detected Instruments pane, verify the USB cable is properly installed. To reinstall drivers, select Tools > Reinstall Instrument Drivers in CFX Maestro. You must disconnect the CFX Opus before installing/reinstalling CFX Maestro software.

### 6.2 OpenELIS Configuration

1. Deploy the `BioRadCFXOpus` plugin JAR to the OpenELIS `/plugin` directory
2. Restart OpenELIS (or the application server) to load the plugin
3. Configure the file input path (watched folder) to match the LIMS export folder
4. Configure test name mappings in the analyzer configuration
5. Assign appropriate user roles/permissions for the analyzer module

### 6.3 Network / Filesystem Requirements

| Requirement | Details |
|---|---|
| **Shared folder** | CFX Maestro export folder must be readable by OpenELIS |
| **File permissions** | OpenELIS service account needs read access; optionally write to archive processed files |
| **Polling interval** | Configure file watcher polling (recommend 30–60 seconds) |
| **File archival** | Processed CSV files should be moved to an archive folder, not deleted |
| **Network protocol** | SMB/CIFS for shared network folders (UNC path format: `\\server\share\folder`) |
| **IP configuration** | IPv4 only (instrument does not support IPv6); DHCP or static IP |
| **EMC compliance** | Use Bio-Rad approved USB cable (#12012942) and Ethernet cable (#12013205) |

---

## 7. Data Flow Diagram

```
┌─────────────────────┐  USB Type B   ┌──────────────────────┐
│  BioRad CFX Opus    │──────────────►│  CFX Maestro         │
│  (runs PCR,         │  .zpcr file   │  Software (v2.3)     │
│   saves .zpcr)      │               │  (analyzes data)     │
└─────────────────────┘               └──────────┬───────────┘
                                                  │
                                    LIMS CSV auto-export
                                                  │
                                                  ▼
                                      ┌──────────────────────┐
                                      │  Shared / Watched    │
                                      │  Folder (SMB/CIFS)   │
                                      └──────────┬───────────┘
                                                  │
                                                  │ file watcher
                                                  ▼
                                      ┌──────────────────────┐
                                      │  OpenELIS Global     │
                                      │  (Analyzer Plugin /  │
                                      │   Analyzer Bridge)   │
                                      └──────────┬───────────┘
                                                  │
                                                  │ parse + validate
                                                  ▼
                                      ┌──────────────────────┐
                                      │  OpenELIS Results    │
                                      │  Review Queue        │
                                      └──────────────────────┘
                                                  │
                                                  │ technician review
                                                  ▼
                                      ┌──────────────────────┐
                                      │  Validated Patient   │
                                      │  Results             │
                                      └──────────────────────┘
```

> **Key clarification from manual:** The CSV export to LIMS happens from **CFX Maestro Software** (running on a computer), not directly from the CFX Opus instrument. The instrument produces `.zpcr` data files which are transferred to CFX Maestro via USB, network drive, or USB flash drive. CFX Maestro then performs analysis and exports CSV for LIMS integration.

---

## 8. Open Questions & Items Requiring Manual Verification

> **Items verified from Instrument Guide (Doc #10000119983) are marked ✅. Remaining items require hands-on testing or site-specific configuration.**

1. **Exact CSV column headers**: Confirm the exact column names exported by your version of CFX Maestro. Column names may vary between CFX Maestro versions (e.g., `Fluor` vs `Flour` has been seen in documentation). Export a sample file and verify. ⚠️ *Still requires sample file verification*

2. **Sample ID field mapping**: Confirm which CSV column carries the OpenELIS accession number. This is typically `Sample`, but some sites use `Biological Set Name` or a custom column. ⚠️ *Site-specific configuration*

3. **PLRN template format**: If bidirectional support is desired in the future, obtain the `.plrn` template files from CFX Maestro (located in the LIMS Templates folder) and document their CSV structure. ⚠️ *Future scope*

4. **Assay-specific target names**: Document the exact target names used by each assay kit at your site (these are configured in the PCR protocol and appear in the `Target` column). ⚠️ *Site-specific*

5. **Cq cutoff values**: Define per-assay Cq cutoffs for positive/negative determination. These are assay-specific and should be documented per deployment. ⚠️ *Site-specific*

6. **QC acceptance criteria**: Define expected Cq ranges for positive controls per assay. ⚠️ *Site-specific*

7. **BR.io Cloud export**: If using BR.io instead of desktop CFX Maestro, verify the CSV export format is identical. The BR.io platform may have different column naming. ⚠️ *Manual confirms BR.io syncs pending runs and results, but export format details TBD*

8. **Multiple fluorophore handling**: Confirm how multiplexed assays (multiple targets per well) appear in the CSV — each target/fluor combination should be a separate row. ⚠️ *Requires sample file*

9. ✅ **Connectivity ports**: Verified — Ethernet 10/100 BASE-T (RJ45), USB 2.0 Type A ×3, USB 2.0 Type B ×1, Wi-Fi 802.11b/g/n + 802.11a/n/ac. IPv4 only.

10. ✅ **Data file format**: Verified — Instrument saves `.zpcr` run files + auto-generated read-only `.json` files. CSV export is handled by CFX Maestro Software, not the instrument directly.

11. ✅ **Network drive support**: Verified — SMB/CIFS shared folders via UNC path (`\\server\share\folder`), requires Ethernet or Wi-Fi + user password on instrument.

12. ✅ **File storage limits**: Verified — 96/Deepwell: 1,000 files; 384: 500 files. Run Reports stores up to 100 recent runs for recovery.

13. ✅ **CFX Maestro connection method**: Verified — USB Type B cable (#12012942), auto-detection of instruments. Must disconnect instrument before installing/reinstalling software.

14. ✅ **Catalog numbers**: CFX Opus 96 (#12011319), CFX Opus 384 (#12011452), CFX Opus Deepwell (#12016658), CFX Maestro v2.3 (#12013758), USB cable (#12012942), Ethernet cable (#12013205).

---

## 9. References

- **[PRIMARY]** CFX Opus Instrument Guide, Doc #10000119983 — Bio-Rad Laboratories, © 2021. Used for verified specifications in this document.
- [Bio-Rad CFX Opus Real-Time PCR Systems](https://www.bio-rad.com/en-us/product/cfx-opus-real-time-pcr-systems?ID=QBJBMKRT8IG9)
- [CFX Opus Instrument Guide (PDF)](https://www.bio-rad.com/sites/default/files/webroot/web/pdf/lsr/literature/10000119983.pdf)
- [CFX Maestro Software User Guide v2.3 (PDF)](https://www.bio-rad.com/webroot/web/pdf/lsr/literature/10000126764.pdf)
- [CFX Maestro LIMS Integration User Guide (Scribd)](https://www.scribd.com/document/605784563/User-guide-CFX-Maestro-software-LIMS-Integration)
- [Transferring Data from CFX Manager Software (PDF)](https://www.bio-rad.com/webroot/web/pdf/lsr/literature/10016883.pdf)
- [OpenELIS Global Analyzer Plugin Wiki](https://github.com/openelisglobal/openelisglobal-core/wiki/Analyzer-plugins)
- [OpenELIS Global Analyzer Plugins Repository](https://github.com/DIGI-UW/openelisglobal-plugins)
- [OpenELIS Analyzer Bridge](https://github.com/DIGI-UW/openelis-analyzer-bridge)
- [Introducing the CFX Opus Systems (BioRadiations)](https://www.bioradiations.com/introducing-the-cfx-opus-real-time-pcr-systems-a-modern-take-on-bio-rad-consistency/)
