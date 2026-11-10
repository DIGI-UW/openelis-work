# Pathogen Whole Genome Sequencing (WGS): FRS

| | |
|---|---|
| **Version** | v0.1 for Casey's review (no Jira yet) |
| **Date** | 21 Oct 2026 |
| **Owner** | Casey (Director of Product, OpenELIS Global) |
| **Inputs** | `pathogen-wgs-clarify-brief.md` (Q1 to Q6, crosscheck of 28 Sep 2026) |
| **Companion** | `pathogen-wgs-preview.html` (interactive preview of all six surfaces) |
| **Consumes** | Result components (OGC-949 M1, built); Runs (OGC-1200, specced); Microbiology v2 isolate sample item (D-136) and Additional testing (A-15, FR-15.1a); Microbiology v3 resistance mapping on coded components (D-285) and the antibiotic master (R-19); Reference Data as Configuration and the Import Review (P1b, P3); Test Catalog QC Targets (D-058); Validation clearance rule (D-056, D-057) |
| **Supersedes** | The data model parts of MinION + TB-Profiler field mapping v2.2 (T-2 to T-5) and M-14 §3.3 `targets[]` / `tb_sequencing_qc`. Their wire-format mapping stays valid. |
| **Evidence basis** | `DIGI-UW/OpenELIS-Global-2` default branch read on 28 Sep and 21 Oct 2026 (micro module, `sample_item.parent_sample_item_id`, `SampleItemAliquotRelationship`, `MicrobiologyReference/sectionConfig.js`); Jira OGC-318 (Ready), OGC-334 (Done, but no TB-Profiler code on the default branch, D-025), OGC-1200 (Backlog). Not live-verified on a running instance. |

---

## Lab Context

### Current State
Whole genome sequencing (WGS) reads the entire DNA or RNA of a pathogen. National public health and reference laboratories use it to answer three questions a routine test cannot: which drugs a germ resists (for tuberculosis, from the mutations in genes such as *rpoB* and *katG*), which strain or lineage it is, and whether two patients' germs are close enough to be part of the same outbreak.

Here is how it works today. A scientist grows the germ (bacteria such as *Mycobacterium tuberculosis* or *Salmonella* Typhi) or takes the patient specimen directly (viruses such as SARS-CoV-2 or mpox). They extract the DNA and attach a short **barcode** sequence to each sample so that 12 to 96 samples can share one run. They load these onto a **flowcell** in an Oxford Nanopore MinION or an Illumina MiSeq. The run takes one to three days. A bioinformatician then runs a **pipeline** on a separate computer: TB-Profiler for tuberculosis, AMRFinderPlus for bacterial resistance genes, Nextclade for SARS-CoV-2. The pipeline writes one result file per sample. It names the sample by the barcode or by the lab number the scientist typed into a sample sheet.

None of this is in OpenELIS. The barcode-to-sample sheet is a spreadsheet. The result reaches OpenELIS, if at all, as a typed comment ("MDR-TB, rpoB S450L, katG S315T"). Isolates sent abroad for sequencing come back as a PDF.

### Pain
- **Wrong patient.** One shifted row in the barcode spreadsheet gives sample 7's resistance profile to sample 8's patient. Nothing checks it.
- **"Susceptible" when it wasn't tested.** When a gene is poorly covered (the *pncA* gene read only 8 times instead of the 30 the lab requires), the drug can be reported susceptible when the honest answer is "insufficient coverage".
- **Lost early warnings.** A resistance mutation present in 23% of the reads (heteroresistance, often the first sign of emerging multidrug-resistant TB) is below the reporting threshold and disappears.
- **No provenance.** When WHO updated its TB mutation catalogue (2021 to 2023), mutations changed grade. The lab cannot tell which reports used which catalogue or pipeline version.
- **Failed runs reach patients.** A negative control with reads in it means the run was contaminated. Nothing links that control to the 23 samples on the same flowcell.
- **Uncountable findings.** Typed comments cannot be searched or counted, so the lab cannot say how many isolates this year carried a carbapenemase gene.

### What Changes
The WGS order sits on the worklist like any other test. The scientist selects the samples going on a flowcell and batches them into a **sequencing run** in OpenELIS. The run records the flowcell and kit lots, each sample's barcode, and the negative and positive controls. When the pipeline finishes, its output lands in a watched folder. OpenELIS matches each file to its order and to the run row with that barcode, and fills the result:

- **Headline calls:** species, lineage, and resistant or susceptible per drug.
- **Target table:** gene, mutation, how many reads carry it, read depth and catalogue grade.
- **Sequencing quality:** reads, depth, coverage.
- **Provenance:** pipeline, version and catalogue version.

If quality failed or the negative control had reads, the affected results are **held** and say why. The validator reviews everything on one screen: the Validation page, or the microbiology case for isolates. Heteroresistance is flagged. The validator ticks which extra findings go on the report, then releases. The printed report shows the calls, the reported findings and the versions used.

---

## Overview

This FRS adds pathogen WGS (bacterial and viral; human genomics is out of scope) to OpenELIS by reusing what exists:

1. A **Genomic targets** library per organism, loaded from reference catalogues (WHO TB mutation catalogue, NCBI AMRFinderPlus reference gene catalogue, Nextclade clade definitions) through the reference data pipeline.
2. A WGS test in the **test catalog** whose result components hold the headline calls, and which links the targets it reports on.
3. The **sequencing run** as a Run (OGC-1200) with a barcode per row.
4. Pipeline output imported through **analyzer profiles** on the flat-file plugin's general JSON reader.
5. A shared **Genomic result detail** shown wherever the result is reviewed: Results, Validation and the microbiology case.
6. A **genomic block** on the patient report.

One noun runs through every screen: a **target** is a gene, gene region, promoter or genome position that a test examines. A **finding** is what the pipeline reports at a target (a mutation, a gene present, wild type, insufficient coverage).

### Design brief

| Item | Commitment |
|---|---|
| **Purpose** | Turn a pipeline file into a traceable, reviewable, reportable OpenELIS result, without retyping and without losing quality and provenance. |
| **Primary user action** | A validator reviews a sequenced result (headline calls, target findings, sequencing QC, provenance) and releases it. |
| **Layout patterns** | Genomic targets: Record list (Admin type B, D-193). Test catalog: existing editor, one new section. Sequencing run: existing Runs workbench (`/Results?run=`). Result review: inline row expansion on the existing worklists and case view. Report: existing report layout, one block. |
| **Interaction model** | Inline row expansion everywhere (D-005, D-011). No modals except the existing Deactivate confirmation. Other findings and sub-threshold findings are their own tables under a toggle button, not accordions. |
| **Scope boundary** | No pipeline orchestration, raw read storage, phylogenetic trees, cluster analysis, GISAID or ENA submission, wet-lab step tracking, human genomics, or wastewater lineage-abundance results (see Out of Scope). |
| **Carbon components** | `DataTable` (with expandable rows, toolbar search, batch actions), `ComboBox` / `FilterableMultiSelect` (organism, antibiotic, target pickers, D-007), `Tag` (calls, QC verdicts, hold), `Toggle` (Report by default), `InlineNotification` (hold reasons, version warnings), `Tile` (run header blocks, provenance), `Link` (raw reads). |
| **Access** | Nominated privileges in the D-233 form (Access section). |

### Navigation & URL

| Surface | SideNav placement | Breadcrumb | Route |
|---|---|---|---|
| Genomic targets library | Admin → (bucket that holds Microbiology Reference in Admin Redesign §3.1; verify) → Microbiology Reference → **Genomic targets**, after Breakpoints and before Patient origins | `Home / Admin Management / Microbiology Reference / Genomic targets` (D-192) | `/MasterListsPage/MicrobiologyReference/genomic-targets` (new section key in the built `sectionConfig.js`); open target `/genomic-targets/<id>`; deep link `?organism=<id>&category=<key>&q=<text>&status=active\|inactive\|all` |
| Test catalog | Existing Test Catalog editor; new **Genomic targets** section after Sample & Results; sequencing rules inside the existing **QC Targets** section | existing | existing `/MasterListsPage/TestCatalogEditor/*` route; section anchor `#genomic-targets` |
| Sequencing run | Existing Results worklist, Runs chip | `Home / Results` (existing) | `/Results?run=<runId>` (Runs FRS; no new parameter) |
| Result review | Existing Results Entry and Validation worklists; existing microbiology case view, Additional testing section | existing | existing routes; no new route |
| Pipeline profiles | Existing Analyzers → Analyzer Types | existing | `/analyzers/types` (existing; profiles only, no new screen) |

The Genomic targets page sits in Microbiology Reference because targets hang off the organism and antibiotic lists that live there. A virology lab uses the same page. Viral organisms are added to the organism list if the seed lacks them (FR-A4).

---

## User Stories

1. As a **TB reference lab scientist**, I want to batch the WGS samples going on one flowcell into a run with their barcodes, so that the pipeline's results land on the right patient without a spreadsheet.
2. As a **validator**, I want to see each drug's call with the mutation, read frequency, depth and catalogue grade behind it, and to have results held when sequencing quality or the run's negative control failed, so that I never release a call the data cannot support.
3. As a **validator**, I want findings the test does not normally report (a carbapenemase gene in a *Klebsiella*, a 23% *rpoB* mutation) shown to me separately, so that I can decide to report them instead of losing them.
4. As a **catalog manager**, I want to load the targets for an organism from a published catalogue and link the ones a test reports, so that every lab names genes the same way and can update when the catalogue changes.
5. As a **quality manager**, I want every genomic result to carry its pipeline, pipeline version, catalogue version and run, so that I can answer an assessor's question about any report and find every report affected by a catalogue change.

---

## Functional Requirements

### A. Genomic targets library

| ID | Requirement |
|---|---|
| FR-A1 | A **target** has: organism (from the organism list; an organism group such as "Enterobacterales" is allowed), name (the gene or region symbol as the catalogue writes it, for example `rpoB`, `blaKPC`, `ORF1ab`), optional display name, **type** (Gene, Promoter or regulatory region, rRNA gene, Genome position or region), **category** (Drug resistance, Virulence, Toxin, Typing, Species marker, Lineage marker), for Drug resistance one or more **antibiotics or antibiotic classes** it informs (from the antibiotic master, R-19), optional reference sequence accession and coordinates as the catalogue gives them, **source catalogue and version**, notes, and Active. |
| FR-A2 | The page is an Admin Record list (D-193): a toolbar with search (name, display name, alias, antibiotic), **Organism** filter (ComboBox, required to narrow lists over 200 rows), **Category** filter, **Source** filter, and Status (Active by default, D-002). Server-side paging; columns Target, Organism, Type, Category, Informs (antibiotic or class labels, never a count), Source and version, Used by (number of tests, links to them), Active. |
| FR-A3 | A row opens inline (D-005) to edit its fields. Name, organism and type of a target **loaded from a catalogue** are read-only with "Managed by {catalogue}" (Reference Data 4.7); display name, notes and Active are local settings and survive catalogue updates. A target added by the lab is fully editable. |
| FR-A4 | **Add target** opens an inline row at the top of the list. The organism picker searches the full organism list (FR-R13.1a ranking). If the organism is missing (a virus not in the seed), the picker offers **Add organism**, which opens Microbiology Reference > Organisms in a new tab (D-007: no inline heavy create). |
| FR-A5 | Targets are never deleted; **Deactivate** asks for confirmation and states what uses the target ("Linked to 2 tests: MTB WGS, MTB targeted sequencing"). A deactivated target stays on past results and on tests already linked, shown with an Inactive tag; it cannot be newly linked. |
| FR-A6 | **Aliases.** A target keeps the other names pipelines use for it (for example `Rv0667` for `rpoB`, `blaCTX-M-15` under the `blaCTX-M` family). Import matches a pipeline finding to a target by name, then alias, then family prefix declared on the target (FR-E6). |
| FR-A7 | **Loaded through the reference data pipeline.** Genomic targets are a reference data area (Reference Data 4.13) with its own Import and Export through the shared Import Review. Columns: matching identifier, organism (by organism code), name, display name, type, category, informs (antibiotic codes or class codes, `;`-separated), aliases, family prefix, reference accession, start, end, source, source version, active, `localization:xx` for display name. Matching identifier: catalogue system plus target name. |
| FR-A8 | **Seed packs** (opt-in, applied through the Import Review): WHO *M. tuberculosis* mutation catalogue (2023 edition, the genes it grades), NCBI AMRFinderPlus reference gene catalogue (resistance, virulence and stress genes, by organism group), Nextclade SARS-CoV-2 and mpox gene sets. A new catalogue release is a new pack version, previewed like any update (D-286 pattern). Each pack carries its licence and source URL in the manifest; packs whose licence is not cleared do not ship. |
| FR-A9 | A target library with no targets for an organism shows an empty state that names the seed packs available for it and links to the Import Review. |

### B. The WGS test in the test catalog

| ID | Requirement |
|---|---|
| FR-B1 | A WGS test is an ordinary test (domain, lab unit, sample type, LOINC, specimen-is-identity D-028). "MTB WGS on isolate" and "SARS-CoV-2 WGS on nasopharyngeal swab" are separate tests. Its linked **Method** is a Method entry for the technique ("Sequencing, Nanopore", "Sequencing, Illumina"), which is how screens and the molecular resistance table name it (D-285). |
| FR-B2 | **Headline calls are result components** (built model): for example Species (coded), Lineage or clade (coded, or text where the catalogue is large such as Pango lineages), one coded component per reported drug or drug class (values Resistant, Susceptible, Resistance not detected, Insufficient coverage, No interpretation), Resistance classification (coded, for TB: Susceptible, RR-TB, HR-TB, MDR-TB, pre-XDR-TB, XDR-TB), and Overall interpretation (text). Each per-drug component carries the **resistance mapping to its antibiotic or class** (D-285), so WGS calls appear in the case's Molecular resistance table beside phenotypic AST with agreement shown. |
| FR-B3 | A new **Genomic targets** section in the test editor lists the targets the test **reports**. Add uses a FilterableMultiSelect over the library, filtered to the test's organism or group, with the selected targets shown as labelled rows, never a count. Each linked row has: **Report by default** (Toggle, on), **Rolls up to** (optional: the per-drug component this target's findings explain, for example `rpoB` to Rifampicin), and order. |
| FR-B4 | The section shows a hint when a per-drug component has no linked target that informs that drug ("Ethambutol has no target: findings for embB will appear under Other findings") and when a linked target is inactive. Neither blocks saving. |
| FR-B5 | **Sequencing acceptance rules live in the test's QC Targets section** (D-058, one QC authoring section per test). New rule types for a test whose Method is Sequencing: minimum reads, minimum % reads mapped, minimum median depth, minimum % of genome covered at a stated depth, minimum depth per reported target, maximum reads in the negative control, and **expected species** (species component value must match). Each rule has a value and an outcome on failure: **Hold** or **Warn** (D-054 pattern). Labs set their own values; the preview shows TB-Profiler's published defaults as examples, not seeded values. |
| FR-B6 | The test's **Reportable** setting (`test.is_reportable`), In lab only (Micro v2 FR-15.3) and every other existing test attribute behave as for any test. |

### C. What WGS is ordered on

| ID | Requirement |
|---|---|
| FR-C1 | A WGS test can be ordered on a **primary specimen** (order entry, as any test) or on an **isolate**. |
| FR-C2 | On an isolate, the test is added from the microbiology case's Additional testing section, or by a reflex rule. Adding it creates the **isolate sample item** (D-136, Micro v2 FR-10.1c: Isolate sample type, child of the specimen's sample item, linked to its `micro_isolate`) if one does not exist yet. The test belongs to the case and is validated there (Micro v2 AC-V2-57). |
| FR-C3 | An isolate received from another laboratory for sequencing is entered as an order on an Isolate sample (Micro v2 FR-02.13a); WGS is ordered on it like any test. |
| FR-C4 | A WGS test referred out (for example an MTB isolate to QMRL Brisbane) uses the existing referral on the sample item; the returned result is entered or imported against the same test and shows the genomic detail when the referral lab sends a pipeline file, or headline components only when it sends a PDF. |

### D. The sequencing run

| ID | Requirement |
|---|---|
| FR-D1 | A sequencing run is a **Run** (OGC-1200) created by **Batch these** on the Results worklist (Runs FR-B4) or from the Workplan (Runs FR-B2). It is described as information on the run, not a separate record (D-055). |
| FR-D2 | **Several tests on one flowcell.** Batch these allows pending rows of **different tests that share a Sequencing method** in one run (for example MTB WGS and *Salmonella* WGS on one MinION flowcell). QC verdicts stay per test within the run (D-053). This relaxes Runs FR-B4 ("rows of different tests cannot be batched together") for the Sequencing method only; coordination with the Runs owner (Dependencies N-8). |
| FR-D3 | **Run settings** block (Runs FR-E1) shows, for a sequencing run: instrument (analyzer instance, optional), **flowcell** and **library kit** as reagent lots (Runs reagent-lot provenance; consumables from Inventory), barcode kit name, and the date loaded. |
| FR-D4 | Each run row carries a **barcode** (text, for example `barcode07` or `NB07`). The run view shows a Barcode column, editable while the run is Open. **Duplicate barcodes in one run are refused**, naming both rows. **Assign barcodes in order** fills empty barcodes, in the row order shown, with the next barcodes of the run's barcode kit not yet used in the run; it never changes a barcode already entered. |
| FR-D5 | **Run controls**: a negative control (no-template control, NTC) and a positive control (a known strain such as H37Rv for TB) are recorded as the run's controls (Runs FR-C, OGC-1147 source-typed controls). The negative control's verdict comes from the reads it produced compared with the test's "maximum reads in negative control" rule (FR-B5); the positive control's verdict from its expected species and calls. |
| FR-D6 | **Sample sheet export.** The run view offers **Download sample sheet** (CSV: barcode, lab number, sample item, test, organism expected) so the bioinformatician's pipeline uses the same mapping OpenELIS holds. This replaces the hand-made spreadsheet. |
| FR-D7 | A run with a failed negative control (Hold) holds every row of the tests it covers, with the reason "Negative control NTC-1 had 48,210 reads (rule: at most 1,000)". The hold follows D-053 and D-056: rows are released only by retest or by an authorised Accept despite failure with a reason (Runs FR-C5). |

### E. Import from pipelines

| ID | Requirement |
|---|---|
| FR-E1 | Each pipeline is an **analyzer profile** on the flat-file plugin (watched folder, accession matching, push to the analyzer channel). JSON outputs use the plugin's **general JSON reader** (path and array-flatten rules in the profile, T-1); CSV outputs use the existing CSV reader. First profiles: TB-Profiler JSON and `collate` CSV (field mapping v2.2 §2, §3.5), AMRFinderPlus TSV, Nextclade JSON or TSV. A new pipeline is a new profile, never new code. |
| FR-E2 | **Matching.** A file is matched to its analysis by lab number (accession). When the analysis sits in an **Open sequencing run**, the file's barcode (if the profile maps one) must equal the row's barcode; a mismatch puts the file in the existing unmatched list (Admin → Stuck analyzer events) with the reason "Barcode 07 in file, barcode 08 on run row", and nothing lands on the row. |
| FR-E3 | **Results for rows in an open workplan run land in that run** as values waiting for review (Runs FR-D3 "Waiting in RUN-x"), instead of creating a new analyzer run. Files for analyses not in any run create an analyzer run as today (D-052). Coordination with Runs (N-9). |
| FR-E4 | The profile maps file fields to: the test's **result components** (headline calls), the **target findings** (FR-F2), the **sequencing QC metrics** (FR-F4), and the **provenance** (FR-F5). Profile values that do not match a component's coded answer are listed for the profile author, as for any analyzer value mapping. |
| FR-E4a | **Where per-drug calls come from.** A per-drug or per-class component is filled from the pipeline's own call for that drug or class where the pipeline gives one (TB-Profiler `dr_resistances[].status`, AMRFinderPlus `Class`), mapped by the profile. Linking targets to the test decides what is reported and shown first, never whether a call is made: a *Klebsiella* with `blaCTX-M-15` reads Resistant for 3rd-generation cephalosporins even when `blaCTX-M` is not linked. FR-G7 (insufficient coverage) and FR-G6 (species check) override the pipeline's call. |
| FR-E5 | **Accepting** an imported result writes an ordinary entered, not validated, result (D-059). The validator validates it on the Validation page, or in the case for isolate tests. |
| FR-E6 | **Finding to target.** Each finding is matched to a library target of the test's organism by name, alias, then family prefix (FR-A6). A finding matched to a target **linked to the test** is a reportable finding. A finding matched to a library target **not linked to the test**, or matched to no target, is an **Other finding**; an unmatched name is kept exactly as the pipeline wrote it with the tag "Not in library". |
| FR-E7 | **Re-sequencing.** A second file for the same analysis (a re-run after a failed QC, or a later pipeline version) is a new result on the same test (one test can hold more than one result); the previous result stays in history with its own provenance. Only one result per analysis is current; the validator chooses which when two are pending. |
| FR-E8 | **Manual entry fallback.** Without a profile, a technician enters the headline components as any multi-component result and may add target findings by hand in the same detail panel (FR-G4); provenance fields are then entered by hand and marked "Entered manually". |

### F. What a genomic result holds

| ID | Requirement |
|---|---|
| FR-F1 | **Headline calls** in the test's result components (FR-B2). |
| FR-F2 | **Target findings**, zero or more per result. Each: target (or the pipeline's name when unmatched), **call** (Mutation detected, Gene detected, Wild type or not detected, Insufficient coverage, Sub-threshold), nucleotide change and protein change exactly as the pipeline wrote them (HGVS style, for example `c.1349C>T`, `p.Ser450Leu`; OpenELIS does not re-annotate), variant type (missense, frameshift, deletion, promoter, rRNA, gene presence), **allele frequency** (0 to 1), **depth** at the position or target, **catalogue grade** as written (for example "Assoc w R - High confidence", WHO group 1 to 5), drug or class it informs (from the target, or as the pipeline states it), and **Report** (tick). |
| FR-F3 | **Sub-threshold findings** (allele frequency below the pipeline's calling threshold, for example `rpoB p.Ser450Leu` at 0.23) are stored as findings with call Sub-threshold. They never set a per-drug call, and they always surface to the validator with the tag "Possible heteroresistance". |
| FR-F4 | **Sequencing QC metrics** per result: number of reads, % reads mapped, median depth, % genome covered at 10x and at the test's stated depth, read length (mean, N50), and depth per reported target. Each metric with a rule (FR-B5) shows its verdict: Pass, Warn or Fail. |
| FR-F5 | **Provenance** per result: pipeline name, pipeline version, reference catalogue or database name and version, analysis date and time, run and barcode, instrument and flowcell (from the run), basecaller and model when the file gives them, and a **raw data reference** (a URI or an archive accession such as an ENA or SRA run accession; OpenELIS stores the reference, never the reads). |
| FR-F6 | Target findings, QC metrics and provenance are stored as data (filterable, exportable), never as a comment or a file attachment. The original pipeline file is kept with the analyzer message (existing raw-message view) for audit. |

### G. Review and validation

| ID | Requirement |
|---|---|
| FR-G1 | **One Genomic result detail.** The same detail panel opens under a WGS row on Results Entry, Validation and in the microbiology case (Micro v2 FR-15.1a). It sits in the row's expanded panel as its own inline row after the result components (D-011), and contains, in order: (1) **Hold and warnings** banner, only when present; (2) **Sequencing QC** strip (each metric with its rule and verdict tag); (3) **Reported targets** table; (4) **Other findings** and **Sub-threshold** tables, each behind a button that shows its count and the first three names ("Other findings (4): blaCTX-M-15, aac(6')-Ib-cr, qnrS1, …"); (5) **Provenance** tile. |
| FR-G2 | **Reported targets table** columns: Target, Informs, Call (Tag: red Mutation detected or Gene detected; green Wild type; gray Insufficient coverage; warm-gray Sub-threshold), Change (nucleotide; protein), Frequency (as %), Depth, Grade, Report (checkbox). Linked targets with **no finding** show a row "No finding" so the validator sees the test looked there (for a presence/absence target such as a gene, the row reads Not detected). |
| FR-G3 | **Report ticks.** Reported targets with a finding start ticked when Report by default is on; Other findings and Sub-threshold findings start unticked. The validator can tick any of them. Ticks are saved with the result and printed on the report (FR-H1). Changing a tick after validation follows the normal correction rules. |
| FR-G4 | Before validation a technician with result entry rights can correct a target finding's call or Report tick, or add a finding by hand (FR-E8). Imported values that were changed show the imported value beside the new one and who changed it. |
| FR-G5 | **Holds** from sequencing QC rules (FR-B5) and run controls (FR-D5, FR-D7) use the Runs per-test hold and the Validation row QC slot (D-061): the row shows the Held tag with the failing rule ("Median depth 12x (rule: at least 30x)"), and it is cleared only as Runs defines. **Absence** of a QC metric (a CSV import that has no per-target depth) neither holds nor clears (D-056); the strip shows "Not reported" for that metric. |
| FR-G6 | **Species check.** When the Species component differs from the test's expected species rule (for example the TB-Profiler file says Non-tuberculous mycobacterium), the result is held under that rule, per-drug calls are not shown as interpretable ("No interpretation: species is not M. tuberculosis complex"), and on a case the isolate's identification is not changed automatically (the validator re-identifies if needed). |
| FR-G7 | **Insufficient coverage per drug.** When a target that rolls up to a drug is below the per-target depth rule, that drug's component is set to **Insufficient coverage**, never Susceptible, and the row says which target was short ("pncA 8x, rule 30x"). |
| FR-G8 | **Pipeline classification check.** When the pipeline reports its own classification (TB-Profiler `drtype`), the detail compares it with the Resistance classification OpenELIS derives from the per-drug calls (v2 A-14, molecular and phenotypic together): agreement shows as a short success line; a difference shows "Pipeline says {x}, OpenELIS derives {y}" as a warning for the validator. |
| FR-G9 | **Genotype and phenotype.** On a case, WGS per-drug calls appear in the Molecular resistance table with the phenotypic AST or DST result and agreement (D-285); a disagreement is flagged for the validator as v3 R-AST-5 already defines. No new screen. |
| FR-G10 | **Catalogue version warning.** When a result's catalogue version is older than the library's active version for that catalogue, the provenance tile says "Interpreted with {catalogue} {version}; the library now has {newer}". Released results are never re-interpreted automatically. |

### H. Reporting and exchange

| ID | Requirement |
|---|---|
| FR-H1 | **Patient report.** A WGS result prints its reported components as any multi-component result, then a **Genomic findings** block listing ticked findings (target, change, call, frequency when below 100%, grade), with linked targets that read Wild type or Not detected printed as one summary line ("Other targets examined had no mutation: inhA promoter, embB, gyrA"), then one line of provenance: "Sequenced on {instrument}, run {run}, {date}. Analysed with {pipeline} {version} and {catalogue} {version}." On a case it prints in the Additional testing group (Micro v2 FR-11.4a). |
| FR-H2 | Pending WGS on a case does not block final release (Micro v2 FR-15.7); the report shows "To follow" for it until it is released, then is amended. |
| FR-H3 | **FHIR.** Each result component is its own Observation (D-02). Each reported target finding is exposed as an Observation following the HL7 Genomics Reporting implementation guide's variant profile, linked to the WGS Observations with `hasMember`, with the provenance as Observation components or a Provenance resource. The exact profile choice is made in the OpenELIS FHIR IG (N-11). |
| FR-H4 | **Data export.** Custom Data Export can include target findings (one row per finding) and QC metrics, with lab number, test, organism, call, change, frequency, depth, grade, pipeline and catalogue versions, so a lab can count, for example, carbapenemase genes by month. WHONET, GLASS and other surveillance exports consume genomic data only when their own specs say so (out of scope here). |
| FR-H5 | Every import, accept, finding edit, report-tick change, validation and release is in the result's history (who, when, before and after). |

### I. Empty, loading and error states

| ID | Requirement |
|---|---|
| FR-I1 | A WGS row with no result yet shows the test's linked targets as "Awaiting sequencing" in the detail panel, so the reviewer knows what will be examined. |
| FR-I2 | A file that cannot be read (malformed JSON, missing required field) goes to the unmatched list with the field named; nothing lands on any row. |
| FR-I3 | A file whose species, sample or barcode cannot be matched never creates an order or a patient (existing analyzer rule). |
| FR-I4 | The Genomic targets list over a large catalogue (AMRFinderPlus has several thousand genes) pages on the server and keeps search under 1 second on the reference server; the test's target picker searches the same way (D-007). |

---

## Information & Data

Data elements are named; storage shape is the implementing engineer's call. "Existing" means on the default branch today; everything else is in Dependencies.

| Information | Status | Notes |
|---|---|---|
| Test, result components, coded answers, Method, `test.is_reportable`, LOINC | Existing | WGS test is an ordinary test (FR-B1, FR-B2) |
| Resistance mapping on a coded component to an antibiotic or class | Micro v3 (D-285), specced | Reused for per-drug calls |
| Organism list, antibiotic master with classes | Existing tables; v3 seed (R-13, R-19) | Targets point at them |
| Sample item parent and child (`parent_sample_item_id`, aliquot relationship) | Existing | Isolate sample item (D-136) |
| `micro_isolate` to isolate sample item link; Isolate sample type | Micro v2 (D-136), specced | Shared, not restated here |
| Run, run controls, run reagent lots, per-test hold | Runs (OGC-1200), specced | Sequencing run reuses all of it |
| QC Targets section and its rule and outcome model | Specced (D-054, D-058) | Gains sequencing rule types |
| Analyzer profile, watched folder, unmatched list, raw message | Existing (flat-file plugin, Stuck analyzer events) | JSON reader is new (T-1) |
| **Genomic target** (library record) | **New** | FR-A1, FR-A6 |
| **Test to target link** (report by default, rolls up to, order) | **New** | FR-B3 |
| **Target finding** per result | **New** | FR-F2, FR-F3; replaces M-14 `targets[]` |
| **Sequencing QC metrics** per result | **New** | FR-F4; replaces `tb_sequencing_qc` |
| **Provenance** per result (pipeline, versions, raw data reference) | **New** | FR-F5 |
| **Barcode** per run row | **New** | FR-D4 |
| **Sequencing rule types** in QC Targets | **New** | FR-B5 |

**Lifecycle.** A target is Active or Inactive (never deleted). A target finding follows its result: imported (pending), accepted (entered), validated, released, corrected through the normal correction rules. A result's provenance never changes after import; a re-sequence is a new result (FR-E7).

**Uniqueness.** One target per organism (or group), catalogue and name. One barcode per run. One current result per analysis.

---

## Access

Nominated privileges in the D-233 form (`category:action`, display group from Users and Roles Appendix A, default grant on upgrade). Until PR #3443 merges, the existing role checks named in the last column stand in.

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| View the Genomic targets list | `catalogue:view` (existing) | Basic access | Everyone |
| Add, edit, deactivate genomic targets | `test:configure` (existing) | Test catalog and reference data | As today (Admin, Test Catalog Manager) |
| Import, review and undo genomic target packs and files | `reference_data:import` (nominated by Reference Data FRS) | Test catalog and reference data | Roles with `test:configure` |
| Export genomic targets | `reference_data:export` (nominated by Reference Data FRS) | Test catalog and reference data | Roles with `test:configure` |
| Link targets to a test; set sequencing rules in QC Targets | `test:configure` (existing) | Test catalog and reference data | As today |
| Batch rows into a sequencing run, set barcodes, flowcell and kit lots, record run controls, download the sample sheet | `result:enter` (existing), per lab unit (D-043) | Results | Roles with Results rights for the lab unit |
| Accept imported WGS results; edit findings and report ticks before validation | `result:enter` (existing), per lab unit | Results | As today |
| Validate and release WGS results, including report ticks | `result:validate` (existing), per lab unit | Results | As today |
| Accept despite a failed sequencing rule or control (with reason) | as Runs FR-C5 defines | Results | As Runs |
| Configure pipeline profiles | as Analyzer Types today | Results (`analyzer`) | As today |

**No new privilege codes.** A user without `test:configure` sees the Genomic targets list read-only with no Add, Edit or Deactivate controls. A user without Results rights for the lab unit cannot open its runs (D-043); the WGS rows are not on their worklist.

---

## Localization

REUSE marks an existing key; NEW keys are namespaced `genomics.*` (shared surfaces), `microbiology.admin.genomicTargets.*` (the admin section, following `sectionConfig.js`), `catalog.test.genomicTargets.*` and `catalog.test.qc.seq.*` (test editor), `run.seq.*` (run view). Search with `npm run i18n:find` before minting (Constitution VII); generic words use `common.*`.

| Key | English | Status |
|---|---|---|
| `common.home`, `common.active`, `common.inactive`, `common.save`, `common.cancel`, `common.edit`, `common.deactivate`, `common.reactivate`, `common.search`, `common.showDeactivated` | as today | REUSE |
| `microbiology.admin.genomicTargets.title` | Genomic targets | NEW (SideNav, breadcrumb, page title) |
| `microbiology.admin.genomicTargets.subtitle` | Genes and genome regions that sequencing tests examine, by organism | NEW |
| `microbiology.admin.genomicTargets.add` | Add target | NEW |
| `microbiology.admin.genomicTargets.col.target` | Target | NEW |
| `microbiology.admin.genomicTargets.col.organism` | Organism | NEW |
| `microbiology.admin.genomicTargets.col.type` | Type | NEW |
| `microbiology.admin.genomicTargets.col.category` | Category | NEW |
| `microbiology.admin.genomicTargets.col.informs` | Informs | NEW |
| `microbiology.admin.genomicTargets.col.source` | Source | NEW |
| `microbiology.admin.genomicTargets.col.usedBy` | Used by | NEW |
| `microbiology.admin.genomicTargets.field.aliases` | Other names | NEW |
| `microbiology.admin.genomicTargets.field.familyPrefix` | Family prefix | NEW |
| `microbiology.admin.genomicTargets.field.reference` | Reference sequence and position | NEW |
| `microbiology.admin.genomicTargets.addOrganism` | Organism not listed? Add it in Organisms | NEW |
| `microbiology.admin.genomicTargets.managedBy` | Managed by {catalogue} | NEW |
| `microbiology.admin.genomicTargets.usedBy.confirm` | Linked to {count, plural, one {# test} other {# tests}}: {names}. It stays on those tests and on past results. | NEW |
| `microbiology.admin.genomicTargets.empty` | No targets for {organism} yet. Load them from {packs}. | NEW |
| `genomics.target.type.gene` / `.promoter` / `.rrna` / `.region` | Gene / Promoter or regulatory region / rRNA gene / Genome position or region | NEW |
| `genomics.target.category.resistance` / `.virulence` / `.toxin` / `.typing` / `.species` / `.lineage` | Drug resistance / Virulence / Toxin / Typing / Species marker / Lineage marker | NEW |
| `catalog.test.genomicTargets.title` | Genomic targets | NEW |
| `catalog.test.genomicTargets.help` | Targets this test reports. Other findings are kept and shown to the validator. | NEW |
| `catalog.test.genomicTargets.reportByDefault` | Report by default | NEW |
| `catalog.test.genomicTargets.rollsUpTo` | Explains | NEW |
| `catalog.test.genomicTargets.hint.noTarget` | {drug} has no target: findings for it will appear under Other findings | NEW |
| `catalog.test.qc.seq.minReads` / `.minMapped` / `.minMedianDepth` / `.minCoverage` / `.minTargetDepth` / `.maxNtcReads` / `.expectedSpecies` | Minimum reads / Minimum reads mapped (%) / Minimum median depth / Minimum genome covered (%) at {depth}x / Minimum depth per reported target / Most reads allowed in the negative control / Expected species | NEW |
| `catalog.test.qc.outcome.hold`, `.warn` | Hold / Warn | REUSE (QC Targets, D-054) |
| `run.seq.flowcell` / `.libraryKit` / `.barcodeKit` / `.loaded` | Flowcell / Library kit / Barcode kit / Loaded | NEW |
| `run.seq.barcode` | Barcode | NEW |
| `run.seq.assignBarcodes` | Assign barcodes in order | NEW |
| `run.seq.duplicateBarcode` | Rows {a} and {b} both have barcode {barcode} | NEW |
| `run.seq.sampleSheet` | Download sample sheet | NEW |
| `run.control.negative` / `.positive` | Negative control / Positive control | REUSE if Runs mints them, else NEW |
| `genomics.detail.qc` | Sequencing quality | NEW |
| `genomics.detail.reported` | Reported targets | NEW |
| `genomics.detail.other` | Other findings ({count}) | NEW |
| `genomics.detail.subThreshold` | Below threshold ({count}) | NEW |
| `genomics.detail.provenance` | Provenance | NEW |
| `genomics.col.call` / `.change` / `.frequency` / `.depth` / `.grade` / `.report` | Call / Change / Frequency / Depth / Grade / Report | NEW |
| `genomics.call.mutation` / `.present` / `.wildType` / `.notDetected` / `.insufficient` / `.subThreshold` / `.noFinding` | Mutation detected / Gene detected / Wild type / Not detected / Insufficient coverage / Below threshold / No finding | NEW |
| `genomics.tag.heteroresistance` | Possible heteroresistance | NEW |
| `genomics.tag.notInLibrary` | Not in library | NEW |
| `genomics.qc.notReported` | Not reported | NEW |
| `genomics.hold.rule` | {metric} {value} (rule: {rule}) | NEW |
| `genomics.hold.species` | No interpretation: species is not {expected} | NEW |
| `genomics.warn.pipelineClass` | Pipeline says {pipeline}; OpenELIS derives {derived} | NEW |
| `genomics.ok.pipelineClass` | Pipeline and OpenELIS agree: {classification} | NEW |
| `report.genomics.noMutation` | Other targets examined had no mutation: {targets} | NEW |
| `genomics.warn.catalogueVersion` | Interpreted with {catalogue} {version}; the library now has {newer} | NEW |
| `genomics.provenance.pipeline` / `.catalogue` / `.analysed` / `.run` / `.rawData` / `.manual` | Pipeline / Catalogue / Analysed / Run and barcode / Raw data / Entered manually | NEW |
| `genomics.awaiting` | Awaiting sequencing | NEW |
| `genomics.unmatched.barcode` | Barcode {file} in file, barcode {row} on run row | NEW |
| `report.genomics.findings` | Genomic findings | NEW |
| `report.genomics.provenance` | Sequenced on {instrument}, run {run}, {date}. Analysed with {pipeline} {version} and {catalogue} {catalogueVersion}. | NEW |

Coded answers for headline components (Resistant, Insufficient coverage, MDR-TB and so on) are catalog data with `localization:xx`, not UI keys.

---

## Dependencies

| ID | What | Owner / status | Needed by |
|---|---|---|---|
| N-1 | **Genomic target** data and the **Genomic targets** reference data area (columns FR-A7, export, Import Review), plus seed packs with licence check | New (this FRS); pipeline from Reference Data P1a/P1b, P3 | FR-A1 to FR-A9 |
| N-2 | **Test to target link** and the test editor section | New | FR-B3, FR-B4 |
| N-3 | **Target finding** data per result, including sub-threshold and unmatched findings and report ticks | New; replaces M-14 `targets[]` (and v2.2 T-5) | FR-F2, FR-F3, FR-G |
| N-4 | **Sequencing QC metrics** per result and **sequencing rule types** in QC Targets | New; replaces `tb_sequencing_qc` (v2.2 T-3); QC Targets section (D-058) specced | FR-B5, FR-F4, FR-G5 |
| N-5 | **Provenance** per result (pipeline, versions, raw data reference) | New; replaces v2.2 T-4 | FR-F5 |
| N-6 | **General JSON reader** on the flat-file plugin | v2.2 T-1, not built | FR-E1 |
| N-7 | **Run** record, run controls, reagent lots, per-test hold, Waiting tag | Runs OGC-1200, Backlog | FR-D, FR-E3, FR-G5 |
| N-8 | **Runs FR-B4 change:** Batch these across tests sharing a Sequencing method | Runs owner to accept | FR-D2 |
| N-9 | **Runs rule:** an analyzer file for an analysis in an Open workplan run lands in that run | Runs owner to accept (D-052 unchanged: no new creation source) | FR-E3 |
| N-10 | **Barcode** per run row | New, on the Runs row | FR-D4, FR-E2 |
| N-11 | **FHIR profile** for target findings (HL7 Genomics Reporting IG variant) | OpenELIS FHIR IG | FR-H3 |
| N-12 | Isolate sample item and Isolate sample type | Micro v2 D-136 (specced, OGC-1383 in progress) | FR-C2 |
| N-13 | Resistance mapping on coded components; Molecular resistance table | Micro v3 D-285 (specced) | FR-B2, FR-G9 |
| N-14 | Antibiotic master with classes; organism seed | Micro v3 R-13, R-19 | FR-A1 |
| N-15 | Custom Data Export source for target findings and QC metrics | New | FR-H4 |
| N-16 | Licence review of each seed catalogue (WHO catalogue, AMRFinderPlus database, Nextclade data) before a pack ships | Casey / DIGI | FR-A8 |

**Import area declaration (Reference Data 4.13).** Genomic targets: own area under Microbiology reference data; columns as FR-A7; matching identifier = catalogue system + name; export in the same format. Test to target links: catalog area, a `test-genomic-targets` file keyed by test matching identifier and target matching identifier, with Report by default, Explains and order. Sequencing rule types travel with QC Targets in its catalog area.

---

## Coordination (changes this FRS asks of other specs)

| Spec | Change |
|---|---|
| **M-14 Mycobacteriology / TB** | `tb_molecular_result.targets[]` and `tb_sequencing_qc` are replaced by N-3, N-4 and N-5. Xpert and LPA keep their headline values as coded components with D-285 mapping; LPA probe results may use target findings. |
| **MinION + TB-Profiler v2.2 (OGC-318)** | Becomes a profile over this model: §2 and §3.5 field paths stay; §3 "lands in `tb_molecular_result`" becomes "lands in the WGS test's components, target findings, QC metrics and provenance"; `WGS_TBPROFILER` assay enum and `INSUFFICIENT_COVERAGE` value become component answers. OGC-318 needs re-grooming before build. OGC-334 (custom preview, Done) has no code on the default branch; FR-G1 replaces it. |
| **Runs (OGC-1200)** | N-8, N-9, N-10. Sequencing rule types feed the per-test verdict like any QC target. |
| **Microbiology v2 / v3** | FR-15.1a already points here; no change. Molecular resistance table (D-285) shows WGS rows with Method "Sequencing". |
| **Reference Data as Configuration** | Add Genomic targets to section 3.3 (AMR / microbiology) and to the P3 domain list. |
| **Patient Report** | Genomic findings block (FR-H1) inside the multi-component result layout. |
| **OpenELIS FHIR IG** | N-11. |
| **M-16 Cluster detection** | Lineage and sequence type components are candidate cluster keys later; no change now. |

---

## Crosscheck (refreshed 21 Oct 2026)

**Verdict: Proceed with coordination.** No active GLOBAL decision is contradicted. Since 28 Sep, Microbiology v2 and v3 have absorbed two of the brief's open items (isolate sample item D-136, per-drug molecular mapping D-285), which removes the biggest upstream risk. Two Runs changes (N-8, N-9) need the Runs owner's agreement before either is built.

| Design choice | Decision | Check | Severity |
|---|---|---|---|
| Sequencing failures hold rows; absence of a metric neither holds nor clears | D-053, D-056, D-061 | Clean (FR-G5) | none |
| Sequencing run is information on a Run | D-052, D-055 | Clean, with N-8 and N-9 as Runs changes | HIGH (coordination) |
| Batch across tests on one flowcell | Runs FR-B4 | Relaxed for Sequencing only (N-8) | HIGH (coordination) |
| Imported results are entered, not validated | D-059 | Clean (FR-E5) | none |
| Isolate WGS validated in the case | D-136, Micro v2 AC-V2-57 | Clean (FR-C2) | none |
| WGS per-drug calls feed the molecular resistance table | D-285 | Clean (FR-B2, FR-G9) | none |
| Target pickers are searches | D-007 | Clean (FR-A2, FR-B3, FR-I4) | none |
| Targets deactivated, not deleted | D-002 | Clean (FR-A5) | none |
| Catalogue-managed fields | Reference Data 4.7 | Clean (FR-A3) | none |
| New reference data has an import area | Reference Data 4.13 | Declared (Dependencies) | none |
| No new privilege codes | D-233 form | Clean (Access) | none |
| Domain is CLINICAL, ENVIRONMENTAL or VECTOR | D-004 | Model is domain-neutral; an environmental isolate's WGS test is an ENVIRONMENTAL test | none |

---

## Out of Scope

- Human genomics (germline, somatic, ACMG classification, genetic consent).
- Running or orchestrating pipelines; storing FASTQ, BAM, POD5 or FAST5 files.
- Phylogenetic trees, SNP distance matrices, cluster or transmission analysis (M-16 may later use lineage or sequence type).
- Submission to GISAID, ENA, SRA or PathogenWatch.
- Wet-lab step tracking (extraction, library preparation, pooling, quantification).
- Wastewater or other mixture sequencing that reports lineage abundances (a different result shape; to be designed with environmental surveillance).
- Re-annotating variants or re-calling resistance inside OpenELIS.
- Automatic re-interpretation of released results when a catalogue changes (FR-G10 warns only).

---

## Acceptance Criteria

- **AC-1** Loading the WHO TB catalogue pack through the Import Review creates targets for *M. tuberculosis* complex, each with its type, category and the antibiotics it informs; re-loading the same version changes nothing.
- **AC-2** A target linked to a test cannot be deleted; Deactivate names the tests it is linked to; the list hides it by default and Show deactivated shows it.
- **AC-3** The target picker on a test lists only targets of the test's organism or group, searches by name and alias, and shows selected targets as labelled rows.
- **AC-4** Batch these on three pending MTB WGS rows and one *Salmonella* WGS row (both with a Sequencing method) creates one run; batching an MTB WGS row with a chemistry row is refused.
- **AC-5** Two rows in one run cannot both have barcode `NB07`; the message names both rows.
- **AC-6** Download sample sheet gives one line per row with barcode, lab number, sample item, test and expected organism.
- **AC-7** A TB-Profiler JSON for lab number CPHL26-004812 with barcode `NB07` lands on the row with that lab number and barcode as a value waiting in the run; a file with barcode `NB08` for the same lab number goes to Stuck analyzer events with the barcode reason and nothing lands.
- **AC-8** After Accept, the result is entered and not validated; the components hold species, lineage, per-drug calls and resistance classification; target findings, QC metrics and provenance are stored as data.
- **AC-9** A result with median depth 12x and a rule "at least 30x, Hold" is held with "Median depth 12x (rule: at least 30x)"; a CSV result with no per-target depth is not held for per-target depth and shows "Not reported".
- **AC-10** A negative control with 48,210 reads under a rule "at most 1,000, Hold" holds every row of the tests it covers in that run.
- **AC-11** With `pncA` at 8x and a per-target rule of 30x, the Pyrazinamide component reads Insufficient coverage, never Susceptible.
- **AC-12** `rpoB p.Ser450Leu` at frequency 0.23 is listed under Below threshold with Possible heteroresistance, unticked, and does not change the Rifampicin call.
- **AC-13** A `blaCTX-M-15` finding on a *Klebsiella pneumoniae* WGS test that links only `blaKPC` and `blaNDM` appears under Other findings, unticked; ticking it prints it under Genomic findings on the report.
- **AC-14** A file whose species is Non-tuberculous mycobacterium on an MTB WGS test is held under Expected species, and per-drug calls show No interpretation.
- **AC-15** When TB-Profiler `drtype` is MDR-TB and OpenELIS derives pre-XDR-TB (because a phenotypic fluoroquinolone R exists), the row shows the pipeline classification warning.
- **AC-16** A WGS test added to ISO-1 in a case creates the isolate sample item, and its result is reviewed with the same Genomic result detail in the case; its Rifampicin call appears in the Molecular resistance table with Method "Sequencing, Nanopore".
- **AC-17** The printed report shows the reported components, ticked findings and the provenance line with pipeline and catalogue versions.
- **AC-18** A second file for the same analysis creates a second result; the first stays in history with its own provenance; only one is current.
- **AC-19** Every string in the Genomic targets page, the test section, the run view additions and the detail panel comes from an i18n key; switching to French shows French labels.
- **AC-20** A user without `test:configure` sees Genomic targets read-only; a user without Results rights for the TB lab unit cannot open its sequencing runs.

---

## Decisions (document-local IDs; ledger IDs assigned at registration)

The skill's ledger copy stops at D-234 while specs cite up to D-286, so these use local IDs to avoid collisions.

| ID | Decision | Why | Scope |
|---|---|---|---|
| WGS-1 | Pathogen WGS only; human genomics out of scope | Different reporting and consent model; the labs asking are public health labs | FEATURE |
| WGS-2 | Headline calls are result components; per-target detail is one shared target-finding model used by every sequencing test, replacing TB-only structures | One model for TB, bacterial AMR and viral genomics; the Results page already renders components | FEATURE (genomics, micro, TB) |
| WGS-3 | **Target** is the UI and catalog noun; a finding is what the pipeline reports at a target | One word across screens, catalog and exports | GLOBAL (vocabulary) |
| WGS-4 | Targets come from a per-organism library loaded from catalogues; a test links the targets it reports; findings off that list are kept as Other findings and unticked | A test cannot list thousands of AMRFinderPlus genes; nothing a pipeline finds is silently dropped | FEATURE |
| WGS-5 | Bioinformatics stays outside OpenELIS; each pipeline is an analyzer profile; provenance (pipeline, versions, raw data reference) is stored on every result | Reproducibility and accreditation; no pipeline hosting | FEATURE |
| WGS-6 | The sequencing run is a Run with a barcode per row; sequencing QC rules live in the test's QC Targets and hold on failure only | Reuses Runs and QC Targets; consistent with D-053, D-054, D-056, D-058 | FEATURE |
| WGS-7 | Low per-target coverage makes the drug Insufficient coverage, never Susceptible; sub-threshold findings never set a call and always surface | Patient safety | FEATURE |

---

## Docs Impact

- New manual page: "Admin: Genomic targets".
- New manual page: "Results: sequencing runs and reviewing a WGS result" (worklist and case).
- Test catalog manual: Genomic targets section and sequencing rules in QC Targets.
- Analyzer integration tracker: TB-Profiler, AMRFinderPlus and Nextclade profiles; MinION setup guide v1.0 updated to the new landing model.
