# Clinical Order Entry v4: Research, Crosscheck and Brief Gaps

Status: pre-/clarify research, 2026-09-25. Input to the /clarify and /specify runs for the clinical order entry rework (steps 1 and 2, optional QA step, container types).

Legend: [V] verified against a cited source or the develop code; [G] general practice, not confirmed against a primary source.

---

## 1. What develop does today (code, commit 5e59f8d1)

### Routes and steps
| Step | Route | Component |
|---|---|---|
| Dashboard | `/order/clinical` | `OrderDashboard` |
| 1. Enter | `/order/clinical/enter` | `ClinicalOrderEnter` |
| 2. Collect | `/order/clinical/collect` | `OrderCollect` |
| 3. Label (and Store) | `/order/clinical/label` | `OrderLabel` |
| 4. QA | `/order/clinical/qa` | `OrderQA` |

Legacy `/SamplePatientEntry` (`addOrder/Index.jsx`) still exists and saves in one POST.

### Things in strange places [V]
- Step 1 has a Print Labels accordion inside the Lab Number tile whose buttons have no `onClick`; Sample Label is hard-disabled.
- Step 2 per-sample Print Labels is a `// TODO` no-op (`SamplesCollectionSection.jsx:82`).
- Refer Out lives on the Label step (`OrderLabel.jsx:1369`); storage also lives there and the stepper treats Label as complete once storage is assigned or skipped.
- Samples and tests can each be added on both Step 1 and Step 2.
- Step 1 says sample/test selection is optional, but `canSave` requires sample types.
- NCE and sample acceptance appear on both Collect and QA.
- "Save as Draft" calls the same save as Save; no draft status is sent.

### Why it is not atomic [V]
- Step 1 commits a `sample` row (status Entered) with patient, provider, requester and requested sample types but zero sample items or analyses. Abandoned orders stay; nothing expires them.
- Step 2 re-POSTs the whole order to create sample items and analyses; the client then re-reads to detect a partial save (`order.save.notPersisted`).
- Step 3 assigns storage with one POST per sample in a sequential loop, fires `storage-skipped` fire-and-forget, and Refer Out is another full-order POST plus a dispatch call. A failure mid-loop leaves some samples assigned and others not.
- Label print requests, no-patient override records and STAT notifications are written after the main transaction commits; FHIR and Odoo events are async after-commit and only logged on failure.
- The lab number is reserved on Step 1 page load (`UPDATE accession_number_info ... RETURNING` commits immediately), so every unsaved page load burns a number. The "no increment" path also increments. Duplicate protection is the unique index, surfacing as a 500.
- "Order complete" is inferred from the existence of a QA checklist row, not a status.

### Data already in the model (reuse candidates, D-009)
- `SampleItem.container` exists as a free-text String column. No container entity.
- `SampleItem` carries quantity, UOM, collection date, collector (free text), collection method, specimen origin (ward type, not body site), temperature, received date, rejected/reason, voided/reason, external id.
- Aliquots are built: `parentSampleItem`, `childAliquots`, `remainingQuantity`, `SampleItemAliquotRelationship`, `POST /rest/sample-management/aliquot`. Exposed only on `/SampleManagement` and `/Aliquot`, not order entry.
- Body site is already modelled: `SampleItem.sourceOfSample` (`SourceOfSample` entity with description and domain) plus `sourceOther`, mapped to FHIR `Specimen.collection.bodySite`. Hidden in the new UI (`SourceOfSampleMenu` defaults false).
- Storage: `SampleStorageAssignment` per sample item (OGC-657 shared storage model).
- Referral hangs off Analysis (`Referral`, `Analysis.referredOut`), grouped by `ReferralSet`.
- NCE links to sample items and analyses via `nce_specimen`.
- Labels: `LabelMakerServlet` types `order`, `specimen` (labNo.sortOrder), `default`; per-test label presets (`TestLabelPresetLink`); printing writes `BarcodeLabelInfo` rows.
- Test to sample type: `SAMPLETYPE_TEST` only; one row per test in practice (D-028).

### Provider honorific gap [V]
- Providers admin (`ProviderMenu.tsx`) has a title Select backed by `person.title_code` (OGC-1223) and the `providerTitle` dictionary.
- Order entry "+ Add new provider" (`RequesterSection.jsx`) has First, Last, Phone, Fax, Email only; backend `initProvider` never sets `titleCode`. Providers created from order entry always have a null title.

### Search-first today [V]
- Patient: a "New Patient" tab sits beside "Search for Patient"; creating without searching is possible.
- Organization, requestor, provider: "+ Add new" appears only after a 2+ character search returns zero results, but the provider name/phone grid renders before any search and, when free text is not restricted, typing there creates a new provider on save.

### Order entry configuration found
`requesterRequired`, `PatientRequired`, `SampleEntryReferralSiteNameRequired`, `consentRequiredForCollection`, `restrictFreeText*Entry`, `orderEntryWorkflowType`, label defaults/max, and `sampleAcceptCheck.clinical|environmental|vector` = MANDATORY / OPTIONAL / OFF. No toggle hides a step.

---

## 2. Gold-standard practice

### Test to specimen requirement model
- FHIR SpecimenDefinition separates `typeCollected` from one or more `typeTested`, each with `preference` (preferred | alternate), `singleUse`, `container` (type, cap, capacity, minimumVolume, additive), handling and rejection criteria. ObservationDefinition points to SpecimenDefinition. [V]
- HL7 v2 OM4 carries container description, volume, additive, normal and minimum collection volume, one segment per alternate. [V]
- Cerner PathNet performs "label netting" to compute the minimum number of containers per patient; Epic shows the tubes needed and the collection sequence; SCC SoftID prints labels in draw order. [V]
- Tube governance matters: one lab moved two tests from SST to PST and saved 4,000+ tubes a year (Onuska, JALM 2021). [V]
- Netting rule [G]: tests share a container when specimen type, container type (or compatible alternate), priority/time and performing department match, summed minimum volume fits capacity, and no test is single-use or needs special handling.

### Container master list
- HL7 v2 SPM-27 uses table 0785; FHIR container-type value set is SNOMED CT descendants of 706041008 (125 concepts). No clear swab or VTM codes. [V]
- Cap colour is not identity: EDTA is lavender under ISO 6710 / US practice and red under the Sarstedt European code; citrate is light blue vs green; heparin green vs orange. [V] Identity must be additive + material + volume; colour is a site-configurable display attribute.
- Order of draw (CLSI PRE02, which replaced GP41): blood culture, citrate, serum, heparin, EDTA, fluoride. [V]
- Proposed pre-seed (~30): K2EDTA 4 mL, K2EDTA 2 mL paed, EDTA microtainer, Na citrate 3.2%, plain serum, SST, Li-heparin, PST, Na-heparin, NaF/oxalate, trace element, ACD, ESR citrate, DBS card, capillary; blood culture aerobic, anaerobic, paediatric; dry swab, Amies gel swab, liquid Amies flocked (ESwab), VTM/UTM, molecular inactivating transport; sterile urine cup, boric acid urine, 24 h urine, urine molecular transport; stool pot, Cary-Blair, SAF/formalin O&P; sputum pot, sterile CSF tube, sterile tissue/fluid container, slide, Other (specify).

### Lifecycle and identifiers
- Epic: collect, print labels, scan each label to document collection, receive; orders flagged Unit Collect vs Lab Collect; add-ons to a received specimen for ~24 h. [V]
- Sunquest: the logged-in user is recorded as collector even when someone else drew; a known data-quality gap. [V]
- Cerner: accession number generated on SAVE; received date/time defaults to now, received-by defaults to user. [V]
- FHIR: `accessionIdentifier` vs `identifier`, `parent` for derived, R5 adds pooled/grouped. HL7 v2 SAC distinguishes accession, container and parent container IDs. [V]
- Pattern [G]: order-level lab number, per-container suffix (`ACC.1`, `ACC.2`), aliquot suffix off the parent (`ACC.1-1`), one label per physical container. OpenELIS already prints `labNo.sortOrder`; env spec uses `LABNO.X-Y` for aliquots.

### What must be captured, by standard
| When | Capture | Source |
|---|---|---|
| Collection | Collector identity, collection date and time, source/site, deviations | ISO 15189:2022 7.2.4.4 (via checklist) |
| Receipt | Date and time of receipt, identity of receiver, acceptance/rejection against criteria, accept-with-caveat noted on report | ISO 15189:2022 7.2.6 |
| Label | Two patient identifiers, collection date/time, collector initials; sequential or multi-site samples numbered or site-marked | CLSI PRE01, CAP via UCSF policy |
| Referral | Correct container, requisition, tracked, manifest with hand-off signatures | WHO LQMS, Tanzania national referral guideline |

### Microbiology source and site
- HL7 v2 splits SPM-4 specimen type, SPM-7 collection method, SPM-8 source site, SPM-9 site modifier (laterality). FHIR uses `Specimen.collection.bodySite`, which USCDI binds to SNOMED CT body structure; APHL asked for free text when no code fits. [V]
- Epic's specimen navigator: pick the source, the system suggests specimen type and tests. [V]
- Pattern [G]: keep specimen type separate from body site; a short curated coded site list (20-40) per sample type plus "Other (specify)" free text, plus laterality.

### Atomicity and reception speed
- Barcoding cuts patient-specimen ID errors ~4.4x vs manual entry (CDC LMBP, 17 studies). Labelling errors run ~0.92 per 1,000 labels (CAP Q-Probes). [V]
- Stanford Beaker: most receipts became scan-only; pre-analytic time fell from 20-30 min to ~5 min. [V]
- Patterns [G]: one server transaction per save; lab number on commit, or pre-printed barcode stock validated at save; idempotency key against double submit; drafts that consume no number; labels printed only from a committed record; sticky defaults; tube-plan preview in draw order.

---

## 3. Crosscheck against the portfolio

Verdict: Proceed with coordination. No GLOBAL decision blocks the brief, but it reverses several prior feature positions that must be superseded explicitly, and D-028 must be resolved before containers can land.

### Positions the brief reverses (supersede explicitly)
| Prior position | Where | New brief |
|---|---|---|
| 4 steps: Enter, Collect, Label & Store, QA | Sample Collection Redesign v2.0; FRS v3 | Label & Store removed; labels, storage and referral become a per-sample action set on steps 1 and 2 |
| No step-1 to step-2 test matching, no "Assign to" (26 Jun) | FRS v3 §4.1.1; dev reference Option C | Tests assigned to containers on step 2, constrained by allowed container |
| No expected sample count per test in the catalog | Multi-sample order entry, Out of Scope | Catalog holds expected containers and count per test |
| Refer Out on Step 3 | Referral addendum v2.1 | Refer Out from steps 1 and 2 |
| S-09 checklist anchored to a QA/intake step, Resample lives there | S-09 v3.0 | QA step optional |
| New Patient mode offered on Add Order | Patient search FRS (OGC-1197) | Search before creating |

### Decisions to respect
- D-028 (GLOBAL): one sample type per test. Specimen M:N Phase 1 proposes superseding it but its decision was never minted (D-035 collided with inventory). Multiple swab types per micro test needs this resolved.
- D-066: removing `/order/clinical/label` needs a redirect and menu row removal.
- D-068: checklist items live under Admin Compliance; only an on/off belongs in Order Entry config.
- D-002 no hard delete (samples and aliquots are voided); D-005 inline over modal; D-007 search pickers for tests, providers, facilities, patients, containers; D-009 declare new data; D-016 no invented `Sample.location`; D-031/D-035 storage is the shared Sample Storage model; D-063 fence reused UI; D-026 PR-sized slices.

### Overlaps to coordinate
Order & Patient Entry config; Referral redesign (OGC-796); Label Presets (OGC-285); Inventory/Sample Storage (OGC-657); Test Catalog Completion v2 and Specimen M:N; Sample Type Management v2.1; M-03 micro hook (Number of Sets, Case keyed to SampleItem x workflow); Env QC `parentSampleItemId`; External Lab IDs and Upstream Results handoff (test-list marker on step 1); Patient search OGC-1197; Navigation redesign OGC-1241.

---

## 4. What the brief does not yet cover

1. Container vs sample type: OpenELIS sample types already are the matrix (serum, plasma, whole blood). The container needs a defined relationship to sample type, including derived matrices (EDTA tube spun to plasma).
2. Tube netting: whether shared tests collapse into one container or counts sum.
3. Receipt capture: received date/time, receiver, condition on arrival (ISO 15189 7.2.6). Step 1 "already collected" is also a receipt event.
4. Collector identity and collection time per container, including "unknown / collected elsewhere".
5. Volume: minimum volume per test and actual volume per container (needed for aliquot remaining volume, already modelled).
6. Tests with no compatible container at end of step 2: block, warn, or hold "awaiting specimen".
7. Label numbering scheme for containers and aliquots, and order label vs container label.
8. Lab number timing: reserve on load (today) vs assign on commit.
9. Add-on tests to an already-received container.
10. Draw order / tube-plan preview for collectors.
11. Body site coding: reuse `SourceOfSample` plus free text, laterality, and whether site filters tests.
12. Whether referral at step 1 is order-level (whole sample) or container-level only.
13. Transport condition (temperature, packaging) for samples arriving already collected.
14. What happens to Resample and the intake-queue filter when the QA step is off.

---

## Sources
Code: DIGI-UW/OpenELIS-Global-2 develop @ 5e59f8d1. Portfolio: openelis-work designs/sample-collection, admin-config, microbiology; openelis-design-skill-src references.
Web: http://hl7.org/fhir/specimendefinition.html ; https://build.fhir.org/specimendefinition-example-serum-plasma.html ; https://build.fhir.org/ig/HL7/fhir-order-catalog/labservices.html ; https://www.hl7.org/fhir/valueset-specimen-container-type.html ; https://hl7.eu/refactored/segSPM.html ; https://www.hl7.eu/refactored/segSAC.html ; https://www.hl7.eu/HL7v2x/v27/std27/ch08.html ; https://isp.healthit.gov/uscdi-data/specimen-source-site ; https://www.gbo.com/fileadmin/media/GBO-International/02_Downloads_Preanalytics/TECHNICAL_Instructions_for_Use/980200_Venous_Blood_Collection/980200_IFU_VenousBloodCollection_rev24_EN.pdf ; https://esneftpathology.nhs.uk/wp-content/uploads/2023/05/S-Monovette-A3-Guide-2.5.pdf ; https://www.phleboprep.com/learn/clsi-pre02-venous-collection ; https://www.phleboprep.com/learn/clsi-pre01-patient-identification ; https://goaudits.com/checklist/iso-15189-2022-checklist/920/35/ ; https://clinlab.ucsf.edu/specimen-labeling ; https://www.who.int/publications/i/item/9789241548274 ; https://ntlp.go.tz/site/assets/files/1138/final_sample_referral_guideline.pdf ; https://epicsupport.sites.uiowa.edu/epic-resources/beaker-lab-collection ; https://academic.oup.com/ajcp/article/147/3/261/3053466 ; https://www.downstate.edu/patient-care/lab-services/_documents/PathnetGeneralLab_2010.pdf ; https://cstcernerhelp.healthcarebc.ca/Applications/Clinical_Collect/Specimen_Collection_%E2%80%93_Sunquest_Collect_Workflow.htm ; https://www.softcomputer.com/?product_flyer=SoftID ; https://academic.oup.com/jalm/article/6/3/808/6179015 ; https://pubmed.ncbi.nlm.nih.gov/18834220/ ; https://www.cdc.gov/labbestpractices/pdfs/cdc_barcodingsummary.pdf ; https://www.sciencedirect.com/science/article/pii/S2153353922002115
