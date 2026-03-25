# OpenELIS Instrument Integration — Software & Export Companion Guide

**Purpose:** Software download links, step-by-step export instructions, LIS configuration guides, and published validation datasets for each instrument integrated with OpenELIS Global.  
**Version:** 1.0  
**Date:** 2025-02-19  
**Maintained by:** OpenELIS Global Community

---

## Table of Contents

1. [QuantStudio 5 / 7 Flex (Real-Time PCR)](#1-quantstudio-5--7-flex)
2. [MALDI Biotyper / Sirius (Organism ID)](#2-maldi-biotyper--sirius)
3. [Attune CytPix (Flow Cytometry)](#3-attune-cytpix)
4. [MinION + TB-Profiler (WGS TB Resistance)](#4-minion--tb-profiler)
5. [FluoroCycler XT (RT-PCR / Line Probe Assays)](#5-fluorocycler-xt)
6. [SeqStudio Genetic Analyzer (Sanger Sequencing)](#6-seqstudio-genetic-analyzer)
7. [KingFisher Flex (Extraction Robot)](#7-kingfisher-flex)

---

## 1. QuantStudio 5 / 7 Flex

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer | Thermo Fisher Scientific / Applied Biosystems |
| Models | QuantStudio 5 (96-well), QuantStudio 7 Flex (96/384-well) |
| Use Cases | HIV Viral Load, TB Detection, Respiratory Panels, COVID-19 |
| Export Format | Tab-delimited CSV from Design & Analysis Software |

### Software Downloads

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **QuantStudio Design & Analysis Software** (desktop) | 2.7.x | [ThermoFisher Connect Downloads](https://www.thermofisher.com/us/en/home/global/forms/life-science/quantstudio-flex-software.html) | Requires ThermoFisher Connect account (free). Desktop application for Windows. |
| **QuantStudio Design & Analysis Software** (cloud) | 2.x | [ThermoFisher Connect Cloud](https://apps.thermofisher.com/apps/spa/#/dashboard) | Browser-based version. Same export functionality. Login required. |
| **Instrument Firmware** | Varies | [ThermoFisher Connect → Instruments](https://www.thermofisher.com/us/en/home/technical-resources/software-downloads/applied-biosystems-quantstudio-5-real-time-pcr-instrument.html) | Firmware updates for the instrument itself. |

**Registration note:** All ThermoFisher software downloads require a free ThermoFisher Connect account. Register at [thermofisher.com/connect](https://www.thermofisher.com/us/en/home/digital-science/thermo-fisher-connect.html).

### Export Instructions — Results CSV

**Menu Path:** Analysis → Export → Results

1. Open your completed experiment in QuantStudio Design & Analysis Software
2. Ensure analysis is complete (green checkmark on all wells or "Analysis" tab shows results)
3. Navigate to **Export** tab (top menu bar)
4. In the Export dialog:
   - **Content:** Select `Results`
   - **File Type:** Select `CSV` (or `.txt` — both produce tab-delimited output)
   - **Fields to include:** Ensure at minimum: `Well`, `Well Position`, `Sample Name`, `Target Name`, `Task`, `Reporter`, `Quencher`, `CT`, `Ct Mean`, `Ct SD`, `Quantity`, `Quantity Mean`, `Quantity SD`, `Amp Status`, `Amp Score`
   - For Standard Curve experiments also include: `Standard Quantity`, `Automatic Ct Threshold`, `Ct Threshold`
5. Click **Export**
6. Choose save location → the file is generated with metadata header block + `[Results]` section

**Video Guides:**
- [ThermoFisher: Exporting Data from QuantStudio Software](https://www.thermofisher.com/us/en/home/technical-resources/software-downloads/applied-biosystems-quantstudio-5-real-time-pcr-instrument.html) — Check the "Training & Support" tab for video tutorials
- [Applied Biosystems YouTube: QuantStudio Software Walkthrough](https://www.youtube.com/user/AppliedBiosystems) — Search for "QuantStudio Design and Analysis export"

**Key export settings to verify:**
- Ensure `Sample Name` contains the OpenELIS accession number
- Confirm `Amp Status` column is included (some export presets omit it)
- For quantitative assays (HIV VL), ensure `Quantity` column is present and the standard curve has been applied

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| ThermoFisher QuantStudio Application Notes | [thermofisher.com/quantstudio-resources](https://www.thermofisher.com/us/en/home/life-science/pcr/real-time-pcr/real-time-pcr-instruments/quantstudio-systems.html) | Application notes with example datasets for various assay types |
| WHO HIV VL EQA Program | [QCMD](https://www.qcmd.org/) | Quality Control for Molecular Diagnostics — proficiency panels with known copy numbers |
| CDC DGHT Molecular QA Resources | [CDC International Laboratory Branch](https://www.cdc.gov/global-hiv-tb/php/laboratories/index.html) | Reference materials for HIV VL and EID testing |
| Abbott RealTime HIV-1 Package Insert | Provided with reagent kit | Contains expected Ct ranges and standard curve parameters for validation |

---

## 2. MALDI Biotyper / Sirius

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer | Bruker Daltonics |
| Models | MALDI Biotyper, MALDI Biotyper Sirius |
| Use Cases | Microbial organism identification (bacteria, fungi, mycobacteria) |
| Export Formats | ASTM E1394 over TCP/IP (primary), CSV export (fallback) |

### Software Downloads

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **MBT Compass** (IVD) | 4.x / 6.x | [Bruker Clinical Microbiology Portal](https://www.bruker.com/en/products-and-solutions/microbiology-and-diagnostics/maldi-biotyper-systems.html) | Contact Bruker representative or download via Bruker Care portal. IVD-certified version. |
| **MBT Compass** (RUO) | 4.x / 6.x | Same portal | Research Use Only — larger database, more configurable. |
| **MBT Compass IVD Library** | Rev 12+ | Provided by Bruker with service contract | Library updates require Bruker service contract. Includes IVD bacteria, mycobacteria, and fungi modules. |
| **flexControl** | 4.x | [Bruker Downloads](https://www.bruker.com/en/services/software-downloads.html) | Instrument control software (for hardware operation, not results). |

**Registration note:** MBT Compass downloads require a Bruker Care account and active service/support contract. Contact your Bruker field service representative for access.

### Export Instructions — CSV Results Table

**Menu Path:** MBT Compass → Classification → Export Results

1. In MBT Compass, complete the identification run
2. Navigate to the **Classification** view (shows all identified spots)
3. Select all results (Ctrl+A) or use the checkbox column
4. Click **Export** (toolbar button or File → Export → Results Table)
5. In the Export dialog:
   - **Format:** CSV (tab-delimited)
   - **Fields:** Ensure all columns are selected, especially: Analyte Name, Analyte ID, Target Position, Organism (Best Match), Score Value (Best Match), Organism (Second Best Match), Score Value (Second Best Match), Category, Identification, Comment, Analysis Date, Operator, Instrument, Library, Method, Spot Type
6. Save file to the designated import folder

### LIS Configuration — ASTM E1394 TCP/IP (Recommended)

**Menu Path:** MBT Compass → Administration → LIS Configuration

1. Open MBT Compass as Administrator
2. Navigate to **Administration → LIS Configuration**
3. Configure the following:
   - **Connection Type:** TCP/IP
   - **Host/IP Address:** OpenELIS server IP address
   - **Port:** `9100` (or as configured in OpenELIS ASTM listener)
   - **Protocol:** ASTM E1394 / LIS2-A2
   - **Direction:** Bidirectional (enable both Send Results and Receive Orders)
   - **Send Results Automatically:** Enable if desired (auto-sends after each classification)
4. **Field Mapping** (within LIS Configuration):
   - **Sample ID field:** Map to `Analyte Name` (this carries the accession number)
   - **Result field:** Map to `Identification` (reported organism name)
   - **Score field:** Enable sending score in Comment records
5. Click **Test Connection** to verify connectivity
6. Run a BTS (Bacterial Test Standard) to verify end-to-end data flow

**Key LIS configuration notes:**
- The exact field positions in ASTM records depend on this configuration screen. If OpenELIS receives unexpected data placement, check here first.
- The "Test LIS Connection" button sends a sample ASTM message — capture this with a TCP sniffer to validate the message format before deploying the parser.

**Video Guides:**
- [Bruker MALDI Biotyper Training Videos](https://www.bruker.com/en/products-and-solutions/microbiology-and-diagnostics/maldi-biotyper-systems/maldi-biotyper-sirius-system.html) — Check "Resources" tab for video library
- Bruker provides on-site training as part of instrument installation; request LIS integration training specifically

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| Bruker IVD Library Validation Data | Provided with library purchase | Species-level validation data per library module (bacteria, fungi, mycobacteria) |
| MALDI Biotyper Application Notes | [bruker.com/microbiology](https://www.bruker.com/en/products-and-solutions/microbiology-and-diagnostics/maldi-biotyper-systems.html) | Published application notes with identification accuracy studies |
| WHO EQAS for Microbiology | [WHO External Quality Assessment](https://www.who.int/teams/health-product-policy-and-standards/assistive-and-medical-technology/medical-devices/eqa) | Proficiency testing programs for clinical microbiology |
| Singhal et al. (2015) "MALDI-TOF mass spectrometry: an emerging technology for microbial identification and diagnosis" | [PubMed: PMC4525074](https://pubmed.ncbi.nlm.nih.gov/26185088/) | Comprehensive review of MALDI-TOF validation studies |
| Croxatto et al. (2012) "Applications of MALDI-TOF mass spectrometry in clinical diagnostic microbiology" | [PubMed: PMC3232461](https://pubmed.ncbi.nlm.nih.gov/22034323/) | Large-scale validation across multiple clinical sites |
| S. pneumoniae / S. mitis Discrimination | [PubMed: PMC3553912](https://pubmed.ncbi.nlm.nih.gov/23224093/) | Validation data on known MALDI-TOF limitation for viridans streptococci |

---

## 3. Attune CytPix

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer | Thermo Fisher Scientific / Invitrogen |
| Models | Attune NxT, Attune CytPix |
| Use Cases | CD4/CD8 T-cell enumeration (HIV monitoring), immunophenotyping |
| Export Format | CSV from Attune Cytometric Software |

### Software Downloads

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **Attune Cytometric Software** | 5.x | [ThermoFisher Connect Downloads](https://www.thermofisher.com/us/en/home/life-science/cell-analysis/flow-cytometry/flow-cytometers/attune-nxt-flow-cytometer/attune-nxt-software.html) | Requires ThermoFisher Connect account. Windows application. |
| **Attune Performance Tracking Software** | Included | Bundled with Attune Cytometric Software | QC bead tracking and performance monitoring. |

**Registration note:** Same ThermoFisher Connect account as QuantStudio software.

### Export Instructions — Statistics CSV

**Menu Path:** Experiment → Export → Statistics Table

1. In Attune Cytometric Software, complete your acquisition and analysis
2. Ensure gating is applied and population statistics are calculated
3. Navigate to **Experiment** menu → **Export**
4. In the Export dialog:
   - **Export Type:** Statistics Table
   - **Format:** CSV
   - **Populations:** Select all populations you want exported. For TBNK panel, ensure at minimum: All Events, Singlets, Lymphocytes, CD3+, CD3+CD4+, CD3+CD8+, CD4/CD8 Ratio
   - **Statistics:** Select: Count, % of Parent, Count/uL (absolute count), and any custom statistics
   - **Include metadata:** Enable (adds header block with instrument, operator, panel info)
5. Click **Export**

**Alternative export — Plate Layout Export (96-well autosampler):**
1. If using the autosampler, you can also export from the **Plate** view
2. File → Export → Plate Statistics
3. This produces one row per well × population × statistic (same format as individual export but for the full plate)

**Key export settings to verify:**
- Ensure `Count/uL` statistic is selected — this is the volumetric absolute count (the Attune's key feature)
- Verify that the gating template name matches what the OpenELIS parser expects for population names
- Check that `Sample Name` in the experiment setup contains the OpenELIS accession number

**Video Guides:**
- [ThermoFisher: Attune NxT Software Training](https://www.thermofisher.com/us/en/home/life-science/cell-analysis/flow-cytometry/flow-cytometers/attune-nxt-flow-cytometer/attune-nxt-software.html) — Check "Training" section
- [Invitrogen YouTube: Attune Software Tutorials](https://www.youtube.com/playlist?list=PLp0VO8v2gXY4AhNJ1PeVIhS7p_p2vxE2X) — Playlist covering acquisition, analysis, and export
- [ThermoFisher Learning Center: Flow Cytometry](https://www.thermofisher.com/us/en/home/life-science/cell-analysis/flow-cytometry/flow-cytometry-learning-center.html) — Comprehensive flow cytometry training resources

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| Attune NxT Performance Specifications | [thermofisher.com/attune](https://www.thermofisher.com/us/en/home/life-science/cell-analysis/flow-cytometry/flow-cytometers/attune-nxt-flow-cytometer.html) | Official specifications including volumetric counting accuracy |
| BD FACS CD4 Reference Method Comparison | See instrument validation studies in literature | Comparison of Attune volumetric counting vs BD FACSCount/FACSCalibur for CD4 |
| WHO Prequalification for CD4 Technologies | [WHO PQ Diagnostics](https://extranet.who.int/pqweb/vitro-diagnostics) | List of WHO-prequalified CD4 testing technologies and performance criteria |
| PEPFAR CD4 Testing Guidelines | [PEPFAR Technical Guidance](https://www.state.gov/pepfar/) | CD4 testing quality requirements for PEPFAR-supported programs |
| Pattanapanyasat et al. — CD4 Volumetric Counting Validation | [PubMed](https://pubmed.ncbi.nlm.nih.gov/) — Search: "Attune CD4 volumetric counting validation" | Published validation studies comparing Attune to reference methods |
| Stabilized Blood Controls | [Streck CD-Chex](https://www.streck.com/collection/cd-chex-cd4/) / [Beckman Coulter Immuno-Trol](https://www.beckmancoulter.com/) | QC control materials with lot-specific CD4/CD8 target ranges |

---

## 4. MinION + TB-Profiler

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer (hardware) | Oxford Nanopore Technologies |
| Manufacturer (pipeline) | London School of Hygiene & Tropical Medicine (open source) |
| Models | MinION Mk1B, MinION Mk1C, GridION (higher throughput) |
| Use Cases | TB whole-genome sequencing, drug resistance prediction, lineage typing |
| Export Format | JSON per-sample + CSV batch summary from TB-Profiler |

### Software Downloads — Sequencing

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **MinKNOW** (instrument control) | 24.x | [Oxford Nanopore Community](https://community.nanoporetech.com/downloads) | Requires ONT Community account (free with instrument purchase). Controls MinION sequencing. |
| **Dorado** (basecaller) | 0.5.x+ | [GitHub: nanoporetech/dorado](https://github.com/nanoporetech/dorado) | Open source GPU-accelerated basecaller. Recommended over Guppy (deprecated). |
| **Guppy** (legacy basecaller) | 6.x | [ONT Community Downloads](https://community.nanoporetech.com/downloads) | Legacy; being replaced by Dorado. Still used in some pipelines. |
| **EPI2ME** (cloud analysis) | Current | [epi2me.nanoporetech.com](https://epi2me.nanoporetech.com/) | ONT's cloud analysis platform. Includes some TB workflows. |

**Registration note:** MinKNOW and Guppy downloads require an Oxford Nanopore Community account, which is provided with instrument purchase. Dorado is open source on GitHub (no account needed).

### Software Downloads — Bioinformatics Pipeline

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **TB-Profiler** | 6.3.0+ | [GitHub: jodyphelan/TBProfiler](https://github.com/jodyphelan/TBProfiler) | **Open source.** Primary pipeline for TB resistance prediction. Install via conda or pip. |
| **TB-Profiler (conda)** | Latest | `conda install -c bioconda tb-profiler` | Easiest installation method. |
| **TB-Profiler (pip)** | Latest | `pip install tb-profiler` | Alternative Python package installation. |
| **TB-Profiler (Docker)** | Latest | `docker pull quay.io/biocontainers/tb-profiler` | Containerized — recommended for reproducible deployments. |
| **WHO Mutation Catalogue Database** | 2023.5 | Bundled with TB-Profiler; update via `tb-profiler update_tbdb` | WHO 2023 catalogue integrated. Auto-updates. |
| **minimap2** (aligner) | 2.26+ | [GitHub: lh3/minimap2](https://github.com/lh3/minimap2) | Dependency of TB-Profiler; installed automatically via conda. |
| **samtools** | 1.19+ | [GitHub: samtools/samtools](https://github.com/samtools/samtools) | Dependency. |
| **bcftools** | 1.19+ | [GitHub: samtools/bcftools](https://github.com/samtools/bcftools) | Dependency. |

### Running TB-Profiler — Quick Reference

**Single sample (FASTQ input):**
```bash
tb-profiler profile \
  --read1 sample_001.fastq.gz \
  --platform nanopore \
  --prefix 2502190001 \
  --threads 8 \
  --csv
```

**Batch (multiple samples):**
```bash
# Run each sample
for sample in barcode01 barcode02 barcode03; do
  tb-profiler profile \
    --read1 ${sample}/*.fastq.gz \
    --platform nanopore \
    --prefix ${sample} \
    --threads 8
done

# Collate into batch summary CSV
tb-profiler collate --prefix batch_20250219
```

**Output locations:**
- Per-sample JSON: `results/{prefix}.results.json`
- Batch CSV: `{collate_prefix}.txt` (tab-delimited despite .txt extension)

### Export Instructions — Getting Results to OpenELIS

Since TB-Profiler is a command-line tool, "export" means collecting the output files:

1. **Per-sample JSON (preferred):** Copy `results/*.results.json` to OpenELIS import folder
2. **Batch CSV:** Run `tb-profiler collate` then copy the output `.txt` file
3. **Automated pipeline:** Set up a cron job or workflow manager (e.g., Nextflow, Snakemake) to:
   a. Monitor for new FASTQ files from MinKNOW
   b. Run TB-Profiler automatically
   c. Copy results JSON to OpenELIS import directory
   d. Optionally trigger OpenELIS import via API

**Nextflow pipeline option:**
| Pipeline | Link | Description |
|----------|------|-------------|
| **nf-core/tbprofile** | Check [nf-core](https://nf-co.re/) for community pipelines | Nextflow wrapper for TB-Profiler with QC and reporting |
| **ARTIC-TB** | [GitHub: artic-network](https://github.com/artic-network) | ARTIC network TB sequencing protocols and pipelines |

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| **TB-Profiler Publication** | [Phelan et al., Genome Medicine (2019)](https://pubmed.ncbi.nlm.nih.gov/30862020/) | Original TB-Profiler paper with validation data |
| **WHO Catalogue of TB Mutations (2023)** | [WHO TB Mutation Catalogue](https://www.who.int/publications/i/item/9789240082410) | The definitive reference for TB resistance mutations and confidence gradings |
| **WHO Technical Manual on TB WGS** | [WHO TB WGS Manual](https://www.who.int/publications/i/item/9789240028173) | Comprehensive guide on implementing TB WGS in reference laboratories |
| **TB-Profiler Benchmark Dataset** | [GitHub: jodyphelan/TBProfiler/test_data](https://github.com/jodyphelan/TBProfiler) | Test FASTQ files included in the TB-Profiler repository for validation |
| **CRyPTIC Consortium Dataset** | [CRyPTIC Project](https://www.crypticproject.org/) | Large-scale WGS + phenotypic DST dataset (>40,000 isolates) for validation |
| **ReSeqTB Knowledge Base** | [ReSeqTB](https://platform.reseqtb.org/) | Curated TB mutation database with phenotypic correlation data |
| **COMBAT-TB / TB-MODS** | [GitHub: COMBAT-TB](https://github.com/COMBAT-TB) | South African TB bioinformatics tools and reference datasets |
| **Nanopore TB Sequencing Validation** | [Votintseva et al., J Clin Microbiol (2017)](https://pubmed.ncbi.nlm.nih.gov/28077699/) | Early validation of nanopore sequencing for TB resistance prediction |
| **ONT TB Application Note** | [nanoporetech.com/resource-centre](https://nanoporetech.com/resource-centre) | Search for "tuberculosis" — ONT application notes with protocols |
| **EQA for TB WGS** | [GenomeTrakr / WHO GLASS](https://www.who.int/initiatives/glass) | Emerging EQA programs for genomic TB surveillance |

---

## 5. FluoroCycler XT

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer | Bruker / Hain Lifescience |
| Models | FluoroCycler XT |
| Use Cases | RT-PCR (FluoroType assays), Line Probe Assays (GenoType MTBDRplus, MTBDRsl) |
| Export Format | CSV from FluoroSoft |

### Software Downloads

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **FluoroSoft** | 2.x | [Bruker/Hain Lifescience](https://www.bruker.com/en/products-and-solutions/microbiology-and-diagnostics/molecular-diagnostics.html) | Contact Bruker/Hain representative. Bundled with instrument. |

**Registration note:** FluoroSoft is not publicly downloadable; it is provided with the FluoroCycler XT instrument and updated through Bruker service.

### Export Instructions

**Detailed export instructions to be added after FluoroCycler XT field mapping specification is complete.**

General path: FluoroSoft → Results → Export → CSV

Two distinct export types depending on assay:
1. **FluoroType assays (RT-PCR):** Ct-based results similar to QuantStudio export
2. **GenoType assays (LPA):** Band pattern interpretation results — unique format with probe presence/absence and resistance interpretation

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| Hain Lifescience GenoType MTBDRplus Package Insert | Provided with kit | Band interpretation tables, sensitivity/specificity data |
| Hain Lifescience GenoType MTBDRsl Package Insert | Provided with kit | Second-line drug resistance interpretation |
| WHO Policy: MTBDRplus/sl | [WHO Molecular TB Diagnostics](https://www.who.int/publications/i/item/9789241506335) | WHO recommendation and performance data for line probe assays |
| Nathavitharana et al. (2017) — LPA Systematic Review | [PubMed: PMC5470001](https://pubmed.ncbi.nlm.nih.gov/28405456/) | Meta-analysis of GenoType MTBDRplus/sl accuracy |

---

## 6. SeqStudio Genetic Analyzer

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer | Thermo Fisher Scientific / Applied Biosystems |
| Models | SeqStudio, SeqStudio Flex |
| Use Cases | HIV drug resistance genotyping, HCV genotyping, TB targeted sequencing |
| Export Format | .ab1 (raw) → bioinformatics pipeline → CSV/JSON to OpenELIS |

### Software Downloads

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **SeqStudio Software** | 1.x / 2.x | [ThermoFisher Connect Downloads](https://www.thermofisher.com/us/en/home/life-science/sequencing/sanger-sequencing/sanger-sequencing-technology-accessories/seqstudio-genetic-analyzer.html) | Instrument control and .ab1 file generation. ThermoFisher Connect account required. |
| **Sequencing Analysis Software** | 6.x / 7.x | [ThermoFisher Downloads](https://www.thermofisher.com/us/en/home/life-science/sequencing/sanger-sequencing/sanger-sequencing-data-analysis.html) | For viewing/editing .ab1 trace files. |
| **Minor Variant Finder** | 2.x | Same portal | For detecting mixed bases / minor populations (relevant for drug resistance). |

**HIV Drug Resistance Pipeline Software:**

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **Stanford HIVdb Algorithm** | Current | [hivdb.stanford.edu](https://hivdb.stanford.edu/) | Gold standard for HIV drug resistance interpretation. Web-based and API available. |
| **Sierra Web Service (HIVdb API)** | 2.x | [GitHub: hivdb/sierra-graphql](https://github.com/hivdb/sierra-graphql) | Open source GraphQL API for programmatic HIVdb access. |
| **RECall** (basecalling/assembly) | Current | [recall.bccfe.ca](https://recall.bccfe.ca/) | BC Centre for Excellence HIV drug resistance basecalling tool. |
| **HyDRA** (PHAC pipeline) | Current | [GitHub: phac-nml/hydra](https://github.com/phac-nml/hydra) | Public Health Agency of Canada HIV DR pipeline. |

### Export Instructions

**SeqStudio → .ab1 files:**
1. Complete sequencing run in SeqStudio Software
2. Navigate to **Results** → **Export**
3. Export .ab1 trace files for each sample
4. Transfer .ab1 files to bioinformatics workstation

**.ab1 → HIV Drug Resistance Report (via Stanford HIVdb):**
1. Assemble forward/reverse .ab1 traces into consensus sequence (using RECall or manual alignment)
2. Submit consensus FASTA to [Stanford HIVdb](https://hivdb.stanford.edu/hivdb/by-sequences/)
3. Download structured JSON report (or use API)
4. Import JSON into OpenELIS

**Detailed export and pipeline instructions to be added after SeqStudio field mapping specification is complete.**

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| Stanford HIVdb Validation | [hivdb.stanford.edu/page/algorithm-validation](https://hivdb.stanford.edu/) | Validation datasets and algorithm performance data |
| WHO HIV Drug Resistance Surveillance Guidelines | [WHO HIVDR](https://www.who.int/teams/global-hiv-hepatitis-and-stis-programmes/hiv/treatment/hiv-drug-resistance) | Guidance on genotyping for DR surveillance |
| VQA (Virology Quality Assurance) Program | [VQA](https://www.hanc.info/labs/virology-quality-assurance.html) | Proficiency testing for HIV genotyping laboratories |
| ANRS HIV Resistance Algorithm | [hivfrenchresistance.org](https://www.hivfrenchresistance.org/) | Alternative resistance interpretation algorithm |
| Sanger Sequencing for HIV DR: WHO Protocol | [WHO Manual](https://www.who.int/publications/i/item/9789241506830) | Standard protocol for HIV DR genotyping |

---

## 7. KingFisher Flex

### Instrument Overview

| Item | Detail |
|------|--------|
| Manufacturer | Thermo Fisher Scientific |
| Models | KingFisher Flex, KingFisher Apex |
| Use Cases | Nucleic acid extraction (pre-analytical); sample tracking & audit trail |
| Export Format | CSV log from BindIt Software |

### Software Downloads

| Software | Version | Link | Notes |
|----------|---------|------|-------|
| **BindIt Software** | 4.x | [ThermoFisher Downloads](https://www.thermofisher.com/us/en/home/life-science/dna-rna-purification-analysis/automated-purification-extraction/kingfisher-flex-purification-system.html) | Protocol design and run logging. ThermoFisher Connect account required. |
| **KingFisher Instrument Control** | Bundled | Included with BindIt | Firmware and hardware control. |

### Export Instructions

**Menu Path:** BindIt Software → Run Log → Export

1. Complete extraction run in BindIt Software
2. Navigate to **Run History** or **Log**
3. Select the completed run
4. Click **Export** → CSV
5. The log contains: Sample ID, Protocol Name, Plate Position, Start Time, End Time, Status, Reagent Lot, Operator

**Key note:** KingFisher exports are **pre-analytical tracking data**, not analytical results. The CSV links the extraction event (sample ID, protocol, reagent lot, operator, timestamps) to downstream testing for chain-of-custody audit trail.

**Detailed export instructions to be added after KingFisher field mapping specification is complete.**

### Published Validation Data & References

| Resource | Link | Description |
|----------|------|-------------|
| KingFisher Application Notes | [thermofisher.com/kingfisher](https://www.thermofisher.com/us/en/home/life-science/dna-rna-purification-analysis/automated-purification-extraction/kingfisher-flex-purification-system.html) | Extraction efficiency validation for various sample types |
| MagMAX Extraction Kit Validation | Provided with kit | Recovery rates, carry-over data, lot-specific QC |

---

## General Resources

### Cross-Instrument References

| Resource | Link | Description |
|----------|------|-------------|
| **CLSI AUTO11** — LIS Interface Standard | [CLSI.org](https://clsi.org/) | Clinical Laboratory Standards Institute standard for instrument-LIS communication |
| **ASTM E1394-97** — Standard Specification for Transferring Information Between Clinical Instruments and Computer Systems | [ASTM.org](https://www.astm.org/) | The ASTM protocol standard used by MALDI and other instruments |
| **WHONET Software** | [whonet.org](https://whonet.org/) | Free microbiology lab database software for AMR surveillance; includes organism/antibiotic code files |
| **WHONET Organism Code File** | [whonet.org/resources](https://whonet.org/resources.html) | Master organism code lookup table for WHONET export mapping |
| **WHONET Antibiotic Code File** | [whonet.org/resources](https://whonet.org/resources.html) | Master antibiotic code lookup table |
| **WHO GLASS** | [who.int/glass](https://www.who.int/initiatives/glass) | Global Antimicrobial Resistance and Use Surveillance System |
| **HL7 FHIR Laboratory Resource** | [hl7.org/fhir/diagnosticreport](https://www.hl7.org/fhir/diagnosticreport.html) | FHIR standard for laboratory result reporting |

### Vendor Support Portals

| Vendor | Portal | Covers |
|--------|--------|--------|
| ThermoFisher Connect | [thermofisher.com/connect](https://www.thermofisher.com/us/en/home/digital-science/thermo-fisher-connect.html) | QuantStudio, Attune, SeqStudio, KingFisher |
| Bruker Care | [bruker.com/services](https://www.bruker.com/en/services.html) | MALDI Biotyper, FluoroCycler XT |
| Oxford Nanopore Community | [community.nanoporetech.com](https://community.nanoporetech.com/) | MinION, MinKNOW, Dorado |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-02-19 | Initial release covering all 7 instruments |
