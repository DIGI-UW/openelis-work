**S06 Laporan Hasil — Domain Variants landed (S06c Environmental LHU + S06d Vector LHU)**

The S06 chassis (letterhead, customer block, dates timeline, signature/verification block, page footer, certificate-numbering, e-signature, audit trail) now has two domain-specific siblings that plug their own result-table shapes into the same chassis — no fork of the config surface or parameter list.

### What ships

- **S06 base FRS — §7a "Domain Variants" added.** Cross-references S06c + S06d, restates the inheritance principle (no new config keys; `Admin → General Configuration → Printed Reports Configuration` from patient-report-spec §15 controls layout for all variants identically), and points at the bilingual annotated previews.
- **S06c — Environmental LHU** (`S06c-environmental-lhu-frs-v1.0.md`)
  - Result table columns `No. | Parameter | Hasil Uji | Baku Mutu | Satuan | Ket.` (Metode column dropped — methods in compact footnote)
  - Covers water (air minum, air limbah), food (pangan/makanan), ambient air (udara ruang), surface swabs (usap), and physical conditions (pencahayaan, kebisingan, kelembaban)
  - KAN per-parameter asterisk; methods + accreditation coverage as compact footnote
  - Multi-matrix bundling supported
  - Ships canonical Indonesian preview + bilingual annotated sibling
- **S06d — Vector LHU** (`S06d-vector-lhu-frs-v1.0.md`)
  - Three flexible result-table modes:
    - **A — Species ID** via PCR
    - **B — Surveillance Indices** (MIR, infection rate, density, positive_resolution_%)
    - **C — Larval Population Indices** (House/Container/Breteau Index, Angka Bebas Jentik)
  - Covers mosquito species ID, larval/imago surveys, infection indices (DBD, malaria, JE)
  - Multi-LHU number bundling supported
  - Ships canonical Indonesian preview + bilingual annotated sibling
- **Research artifact** — `S06-lhu-crosswalk-raw.md`: bucketing + crosswalk of 37 real LHU sample PDFs (10 environmental, 1 vector, 22 clinical-skipped) collected from Indonesian Labkesmas. Evidence base for both S06c and S06d field/column choices.
- **Gallery housekeeping** — renamed the existing S06 base files in the gallery to align with the new S06X naming convention (`laporan-hasil-compliance-report.{md,jsx,html}` → `S06-laporan-hasil-compliance-report-{frs-v1.0.md,mockup.jsx,preview.html}`).

### Files

**S06 (base, renamed + amended):**
- Gallery permalink: <https://digi-uw.github.io/openelis-work/#/vector-surveillance/laporan-hasil-compliance-report>
- FRS: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06-laporan-hasil-compliance-report-frs-v1.0.md>
- HTML preview: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06-laporan-hasil-compliance-report-preview.html>
- JSX mockup: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06-laporan-hasil-compliance-report-mockup.jsx>

**S06c — Environmental LHU:**
- Gallery permalink: <https://digi-uw.github.io/openelis-work/#/reports/s06c-environmental-lhu>
- FRS: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06c-environmental-lhu-frs-v1.0.md>
- HTML preview (canonical Indonesian): <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06c-environmental-lhu-preview.html>
- HTML preview (bilingual annotated): <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06c-environmental-lhu-preview-annotated.html>
- JSX mockup: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06c-environmental-lhu-mockup.jsx>

**S06d — Vector LHU:**
- Gallery permalink: <https://digi-uw.github.io/openelis-work/#/reports/s06d-vector-lhu>
- FRS: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06d-vector-lhu-frs-v1.0.md>
- HTML preview (canonical Indonesian): <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06d-vector-lhu-preview.html>
- HTML preview (bilingual annotated): <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06d-vector-lhu-preview-annotated.html>
- JSX mockup: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06d-vector-lhu-mockup.jsx>

**Research artifact:**
- Crosswalk: <https://github.com/DIGI-UW/openelis-work/blob/`<commit>`/designs/reports/S06-lhu-crosswalk-raw.md>

### Status

**Selected for Development.** Chassis locked (no new config keys; inherits from patient-report-spec §15 Printed Reports Configuration). Bilingual annotated previews are devel-only aids for non-Indonesian reviewers — hidden on print; canonical Indonesian-only output matches real Labkesmas convention.
