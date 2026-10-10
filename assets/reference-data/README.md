# Reference data

## QuantStudio sample files are illustrative

`qs5-hiv-vl-sample.csv` and `qs7flex-resp-panel-sample.csv` are illustrative files, not instrument exports. They came in with the March 2026 import of design drafts. They differ from real QuantStudio exports in four ways:

1. **Task capitalization.** Task values are title case (`Unknown`, `Standard`). Real exports write them in uppercase: `UNKNOWN`, `STANDARD`, `NTC`.
2. **Targets per well.** Each target sits in its own well. A real export reports every target of a multiplex on the same well, one row per target.
3. **A task QuantStudio doesn't offer.** `qs7flex-resp-panel-sample.csv` gives its positive control the task `Positive Control`. Thermo's Design and Analysis software has no such task for standard-curve runs (*QuantStudio Design and Analysis desktop Software User Guide*, MAN0010408 Rev B.0, p. 14).
4. **Well numbering.** The same file numbers well B1 of its 384-well block as 11. On a 384-well block, B1 is 25.

Their control names (`QC-HIV-HIGH`, `QC-HIV-LOW`, `QC-HIV-NEG`, `QC-RESP-POS`, `QC-RESP-NEG`, `PTC-RESP`) are not the names real plates use. For QuantStudio files, follow `designs/analyzer-integration/quantstudio-field-mapping-spec-v131.md`, which was validated against three real Madagascar exports (§7):

- A positive control is `PC`, with Task `UNKNOWN`.
- NTC wells are named `NC` or `NTC`, with Task `NTC`.

## FluoroCycler XT workbook

`FC-XT_Template.xlsx` is not an instrument export. It is the workbook the FluoroCycler XT spec designs for the lab to fill in by hand, because FluoroSoftware XT-IVD has no export (`designs/analyzer-integration/fluorocycler-xt-integration-spec-v1.0.md` §1.3; `fluorocycler-xt-companion-setup-guide-v1.0.md` §3).

In this workbook a control is marked by its SampleID prefix: `QC-`, `CTRL-`, `NC-` or `PC-` (spec §6).

The Madagascar site's FluoroCycler file does not use this workbook. Its columns are `Row`, `Col`, `Sample ID`, `Type`, `Calc. Conc.` and `Result`, with `Type` = `Unknown` on patient rows (DIGI-UW/analyzer-mock-server commit `835261c`, which copied that shape into the mock fixture). The Bridge profile and the mock follow the site file. Neither shape has been checked on a run that includes controls.
