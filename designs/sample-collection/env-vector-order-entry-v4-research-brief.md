# Environmental and Vector Order Entry v4: Best Practice and Competitor Gaps

Date: 2026-09-26. The design brief was compared against:

- **Environmental:**
  - US EPA sample receipt and inspection guidance (MARLAP chapter 11)
  - ISO/IEC 17025 §7.4 and TNI practice for handling test items
  - environmental LIMS: Promium Element, LabWare, LabVantage, STARLIMS, Wavefront
- **Vector:**
  - CDC and California arbovirus surveillance practice (VectorSurv Gateway, with Esri FieldSeeker integration)
  - WHO entomological surveillance, run in DHIS2 as the WHO entomology and vector control modules

"Have" means develop today or the brief. Every "gap" row that needs new data is a candidate Dependency. None of them is assumed to exist.

## Environmental

| # | Practice | Have | Gap | Weight |
|---|---|---|---|---|
| E1 | **One chain of custody covers many sampling points.** A monitoring run brings 20 bottles from 8 points on one form | One sampling site per order (the site is order-level) | A **sampling point on each sample row**, defaulting from the order | High |
| E2 | **Client or field sample ID** recorded beside the lab number and printed on the report | Not found as a per-sample field | A field sample ID column (external ID); it prints on labels and reports | High |
| E3 | **Condition on receipt:** cooler temperature (with the thermometer used), ice present, custody seals intact, container integrity, preservation check (pH per bottle, headspace for volatile organics) | Sample check has a yes/no checklist. No measured values | Receipt measurements are recorded: temperature per cooler, pH per bottle. An out-of-range value raises an NCE and a **qualifier** that reaches the report ("received at 9 °C") | High |
| E4 | **Holding time per test, visible at receipt.** Limits differ by method: coliform 8 h (drinking water compliance 30 h), BOD 48 h, metals 6 months | Anchor fixed to collection (brief). No per-test limit shown at intake | Hold time comes from the test catalog. Each row shows time remaining. "Received out of hold" becomes a qualifier. Rush priority is suggested | High |
| E5 | **Custody transfer log:** relinquished by, received by, date and time for each transfer | The COC can only be attached as a file | Transfers recorded as structured rows (who, when); the attachment stays | Medium |
| E6 | **Field measurements taken at the sampling point** (field pH, temperature, chlorine residual, conductivity), entered at intake as results with the field method | Order-level collection conditions (weather) only | Field-parameter tests can be resulted at intake, per sample | Medium |
| E7 | **Sample purpose for compliance:** routine, repeat or confirmation, with a repeat sample linked to the original positive (for example, the US Revised Total Coliform Rule) | Not found | A purpose on each sample, plus a link to the original sample | Medium |
| E8 | **Bottle kits and pre-registration:** the lab sends labelled bottles before sampling, and receipt becomes "scan and confirm" | Not found | Plan or pre-register an order, print kit labels, then receive it | Medium (phase 2) |
| E9 | **Recurring monitoring templates:** the same points and tests every week for a program | Not found | Start a new order from a program template or from the last order | Medium |
| E10 | **Batch entry speed:** fill down, copy row, scan-to-add | Partly (Fill all in the clinical table) | Copy row and fill down across 40 rows; CSV in OGC-1138 | Medium |
| E11 | **Report-to and invoice-to contacts, requested turnaround and due date** | Requester only | Report-to contact, requested turnaround, and a due date computed from turnaround | Low |
| E12 | **Retention and disposal date** | Not found | Retention date from the sample type or program | Low |

**Competitor features** that OpenELIS environmental ordering lacks today:
- online chain-of-custody submitted by the client, received by scanning (Element, Wavefront)
- bottle orders and kits (Element)
- mobile field capture
- per-test hold-time dashboards
- automatic QC batch creation
- EDD (electronic data deliverable) and regulatory exports, such as SDWIS in the US

OpenELIS is already ahead on in-app QC evaluation (S-08), compliance standards with limits, FHIR, and sharing one system with clinical.

## Vector

| # | Practice | Have | Gap | Weight |
|---|---|---|---|---|
| V1 | **Zero catches are data.** A trap night with no mosquitoes is the abundance denominator | A row with count 0 creates nothing | A catch with count 0 saves as a real collection with no organisms | High |
| V2 | **Trap failure is not zero.** Fan, battery or CO2 failures are flagged and excluded from abundance | Not found | Trap status on each catch: Operated, Failed (with reason) | High |
| V3 | **Set and retrieved date and time** for the trap. Trap nights are derived, not typed | Trap nights typed as a number | Set and retrieved date-times; nights calculated | High |
| V4 | **Pools often arrive pre-sorted.** In arbovirus programs the field or district sorts by species, sex and status and submits pools, usually up to 50 per pool (VectorSurv "create pools from collection", with count validators) | Intake makes one pool of the whole catch; re-pooling at the bench (C-4) | A second intake shape: a catch arrives as pools, each with species, sex, status and count. The validators check that the pool counts add up to the catch | High |
| V5 | **Caught versus submitted.** Abundance uses all caught; only a subsample is tested | One count | Total caught and number submitted, on each catch | High |
| V6 | **Sex and physiological status** (unfed, blood-fed, gravid; parity for malaria vectors) | Life stage only | Sex and status at catch or pool level; species optional at intake | Medium |
| V7 | **Attractant or lure** (CO2, gravid infusion, BG-Lure) and trap placement (indoor or outdoor, height) | Trap type only | Lure and placement on each catch | Medium |
| V8 | **Larval sampling:** habitat type, number of dips, larvae per dip, instar | Life stage only | Larval collection fields when the life stage is larva or pupa | Medium |
| V9 | **Host-associated vectors:** ticks by flagging or off a host; fleas off a rodent, which needs the host species or host sample ID | Organism group only | A host on each catch, linkable to a rodent sample in the same order | Medium |
| V10 | **Preservation and cold chain for specimens** (dry ice, RNAlater, silica; temperature at receipt) | Not found | The same receipt condition as E3 | Medium |
| V11 | **Field capture and import.** Collections recorded on phones in FieldSeeker, DHIS2 or ODK flow in without re-typing | CSV epic only (OGC-1138) | Import collection records from a field system into the same rows (FHIR or CSV) | Medium (phase 2) |

**Competitor features:**
- **VectorSurv Gateway:** pools created from collection records with sex, life-stage and species count validators; bulk import through Excel, CSV or web services; abundance anomaly tools; FieldSeeker integration.
- **DHIS2 entomology tracker:** individual-mosquito records with lab results (sporozoite, molecular ID, resistance mechanism, parity).

OpenELIS is already ahead on real accessioning and barcodes for pools, sub-pools and organisms, bench deconvolution, and quality-managed testing in a lab system.

## Disposition (Casey, 2026-09-26)

**Vector: dropped as upstream field data.** The lab receives specimens after the field work is done, so these don't belong in order entry:
- V1 zero catches
- V2 trap failure
- V3 set and retrieved times
- V5 caught versus submitted
- V7 lure and placement
- V8 larval sampling
- V9 host

Trap type, traps deployed and nights remain as optional pass-through fields.

**Vector: kept.**
- V4 sorted pools, as an **Arrives as** choice on the row.
- V6 species, sex and status, only as submitted with a sorted pool.
- V10, which is part of the shared receipt condition.

**Environmental.**
- E1 to E4 are folded in.
- E5, E6, E7, E10, E11 and E12 go to phase 2 as optional fields.
- E8 and E9 are future work.

**Vector import.** V11 is future work.

## Both domains

- **Receipt condition** (E3 and V10) belongs on the shared samples table, with NCE and qualifier reuse.
- **Qualifiers** must flow to the report and to FHIR. Otherwise receipt problems only live in the NCE log.
- **Per-row site** (E1) matches the vector per-catch site (C-4). One pattern, both domains.

## Sources

- [EPA MARLAP ch. 11, Sample Receipt, Inspection and Tracking](https://www.epa.gov/sites/default/files/2015-05/documents/402-b-04-001b-11-final.pdf)
- [Eurofins container, preservation and holding time list](https://www.eurofinsus.com/media/447768/appendix-d-section-5-attachment-holdtime-container-list_2016-july.pdf)
- [NC DEQ sample receipt checklist](https://files.nc.gov/ncdeq/Water%20Quality/Chemistry%20Lab/Certification/Checklists/Sample%20Receipt%20Checklist06-2015.doc)
- [Promium Element sample control](https://www.promium.com/solutions/element-lims/sample-control/)
- [QIA, chain of custody in field sampling with an environmental LIMS](https://www.qi-a.com/learning-center/managing-chain-of-custody-in-field-sampling-with-environmental-lims/)
- [Wavefront environmental LIMS](https://www.wavefrontsoftware.com/lims-for-environmental-labs/)
- [VectorSurv, getting started and data entry](https://vectorsurv.org/starting/)
- [VectorSurv Gateway integrated with FieldSeeker](https://frontierprecision.com/news/vectorsurv-gateway-now-integrated-with-fieldseeker/)
- [California mosquito-borne virus surveillance and response plan](https://westnile.ca.gov/pdfs/CAMosquitoSurveillanceResponsePlan.pdf)
- [WHO DHIS2 standard modules for entomology and vector control](https://community.dhis2.org/t/who-dhis2-standard-modules-for-entomology-and-vector-control/41347)
