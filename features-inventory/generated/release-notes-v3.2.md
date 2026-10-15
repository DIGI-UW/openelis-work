# OpenELIS v3.2 — release notes

*Generated from features-inventory on 2026-09-20. OpenELIS Global ships continuously; each dated section below lists what changed in that release.*

## 3.2.2.0
### For decision-makers
- A single modern results surface across clinical, environmental, and vector labs — the primary Results deliverable for SILNAS Phase 1 Indonesia. (OGC-811, OGC-1020) — *Results entry*
- Brings result review, quality events, and specimen handling into one auditable screen, cutting clicks and the risk of overwriting validated values. (OGC-811) — *Results entry*
- Turns the test catalog into a self-checking system that flags incomplete or misconfigured tests before they reach production. (OGC-1142) — *Unified test editor*
- Removes a long-standing data-model limitation — on the Indonesia deployment 155 of 459 tests already span multiple specimen types — cutting duplicate catalog entries and configuration drift. (OGC-1145) — *Unified test editor*
- Extends clinical decision support to the component and specimen level, matching how modern assays actually report. — *Unified test editor*
- Consolidates specimen-type configuration — previously scattered across the app — into one interface, reducing setup errors. (OGC-296) — *Sample type management*
- Modernizes panel setup and enforces domain integrity, so ordering and e-order intake resolve panels consistently. (OGC-224) — *Panel management*
- Lets a country or site localize and adjust the interface language on their own timetable, without an engineering release. — *Deployment-configurable translations*
- Personal data is no longer written to application logs, reducing the risk of exposing patient information through log files. **[security]** — *Strengthened data security*

### For implementers & admins
- The canonical /Results route consolidates the legacy result-entry routes (behind a flag); polymorphic result cell (numeric/dictionary/multi-select); edit-state machine (saved rows read-only until Edit); Lab Unit drives cross-domain rendering (Clinical/Water Quality/Vector); save payload scoped to the edited analysis with an optimistic version check. (OGC-811, OGC-1020) — *Results entry*
- Expanded panel adds the work-zone/reference-zone split, inline NCE form (Cancel/Reject/Retest), separate refer-out action, this-analysis history (revisions/status/notes/audit), critical-value acknowledgment, and aliquot management (LABNO.X-Y incl. vector pool composition). Matches the design-gallery mockup. (OGC-811) — *Results entry*
- Per-result save scoping hardened (OGC-1179 — the unified worklist no longer writes a result nobody edited); worklist 500s resolved (OGC-1170); reflex/calc summary and dashboard patient lookup null-safety fixed; cached Test Result display list refreshes after a catalog sample-results save. (OGC-1179, OGC-1170) — *Results entry*
- Completes the unified test editor: full per-sample label preset picker with Order Entry preview, Terminology display name + LOINC surfacing, all four shared combined-editor sections with a per-field differs view, inline new-select-option creation, a REST-enforced activation gate, a completeness checklist with a no-silent-save rule, and a catalog-health 'only tests with issues' view. (OGC-1142) — *Unified test editor*
- A test can now be associated with many sample types at once (multi-select with chips), sharing configuration by default and overriding ranges/LOINC per specimen where they differ — replacing the old clone-and-variant workaround. Specimen-aware resolution fixes the first-match bug behind duplicate test records. (OGC-1145) — *Unified test editor*
- Fixes the editor's Localization section (writeable, defaults to the session locale), duplicated/unstyled empty states, and non-numeric id 500s; scopes free-text result options to the Test Result category so they stop breaking dictionary-id consumers; restores catalog coverage + LOINC and FHIR specimen terminology. Regression-swept across Test Catalogue, Sample Types, and Results. (OGC-1153) — *Unified test editor*
- Panels and sample types can now carry localized display names and LOINC mappings, matching the per-test terminology model. — *Unified test editor*
- Alert, calculated, and reflex rules can now be scoped to a specific result component and sample type, and the rule builders decide the result type at the component level — so multi-component and multi-specimen tests get the right logic. — *Unified test editor*
- A dedicated Sample Type Management screen in the Test Catalog shell: create/edit/activate specimen types with domain (Clinical/Environmental/Vector), localized terminology, drag-and-drop display order, default storage & disposal, bidirectional test links, and WHONET specimen-code mapping for AMR exports. (OGC-296) — *Sample type management*
- Panels move into the Test Catalog Management shell (peer of Tests / Sample Types / Lab Units) with a list + editor (Basic Info / Tests / Terminology). Each panel carries a single required domain with a domain-guarded membership picker; sample types are derived read-only from member tests; activation requires at least one test; full multi-source terminology mapping with LOINC kept for FHIR-intake routing. (OGC-224) — *Panel management*
- A deployment can supply or override its own UI translation strings without rebuilding the frontend. — *Deployment-configurable translations*
- Background and system-initiated actions now run as a dedicated System/Daemon user, and user identity is resolved through one centralised UserContext — so automated writes are attributable in the audit trail. — *Strengthened data security*
- Validation page: the row link now reads 'Modify Order' (was 'View Patient') and the result-table column header reads 'Validate' (was 'Save'). Sample Entry no longer crashes when the departments list fails to load. — *Result validation*
- Cold Storage timestamps now handle seconds vs. milliseconds correctly, so stored times display and compare accurately. — *Sample storage management*
- The Cytopathologist role name is now consistent across the Cytology module. — *Cytology case view*
- Fixes report and analyzer breadcrumbs, a charted-report 500 (jfreechart/JasperReports version mismatch), Report Non-Conformity gating, and Patient History for multi-component tests.

### For lab users
- One /Results worklist replaces the old separate result screens — search, filter by Lab Unit, date, and status, and enter results inline. Each result saves on its own, so two techs working the same worklist no longer overwrite each other. (OGC-811, OGC-1020) — *Results entry*
- Open a result to a focused work zone: enter the value with method and analyzer, see this analysis's own history, flags and critical-value handling, record non-conforming events, refer a test out, or aliquot the sample — all inline, without leaving the worklist. (OGC-811) — *Results entry*
- Saving in the worklist no longer changes a result you didn't touch, and the pages that were throwing errors now load. (OGC-1179, OGC-1170) — *Results entry*
- The main menu now adapts to your screen: pinned and always visible on a desktop, or an on-demand drawer on smaller screens. A pin control lets you switch between the two. — *Modernized user interface*
- Requester details on Add Order are no longer required by default, so you can register an order without them when they aren't available. — *Order & sample entry*
- When your session expires you now see a spinner instead of a 'Not Authenticated' flash, and changing your password reports real success or failure with validation errors. — *Modernized user interface*


## 3.2.1.11
### For decision-makers
- Consolidates test configuration into one maintainable editor, reducing admin training time and configuration errors. (OGC-949) — *Unified test editor*
- Rule-driven alerts and reflex logic are now authored directly in the test catalog, standardizing clinical decision support across the lab. (OGC-949) — *Unified test editor*
- Foundation for molecular and panel-style testing where one test yields several reportable components. (OGC-1131) — *Unified test editor*
- Labs can adapt barcode printing to local hardware without code changes. (OGC-285) — *Barcode label management*
- Improves screen-reader accessibility and non-English usability. — *Order & sample entry*

### For implementers & admins
- Unified test editor replaces the fragmented legacy screens: editor shell, list view, Basic Info, and all v1 sections (M0–M12), with sections always visible in the catalog side nav (disabled until a test is open). (OGC-949) — *Unified test editor*
- Configure barcode labels, result alerts, reflex/calculated tests, and storage per test; alerts now dispatch asynchronously and support multi-terminology FHIR codings. (OGC-949) — *Unified test editor*
- Completion and correction handling added to the test catalog editor. (OGC-1112) — *Unified test editor*
- Associate tests with treatment regimens directly in the catalog. — *Unified test editor*
- Define per-test result components with an is_primary flag, show-on-report control, multi-component terminology, and analyzer ingestion; molecular seed data included. (OGC-1131 epic still in progress — initial delivery.) (OGC-1131) — *Unified test editor*
- Sample & Results and reference-range editing reconciled to the FRS, including range nesting. (OGC-749, OGC-1117) — *Reference range editor*
- Newly created tests are now immediately orderable, and lab unit / sample type can be edited when modifying an existing test. (OGC-1116) — *Unified test editor*
- Create and manage configurable barcode label presets (sizes/layouts) instead of the four fixed system presets. (OGC-285) — *Barcode label management*
- Validation now reuses the existing localization system so labels translate consistently. (OGC-767) — *Result validation*

### For lab users
- A single modern Test Catalog editor — open a test and move through every configuration section in one place. (OGC-949) — *Unified test editor*
- Tests can now report multiple result components (e.g. molecular panels) in a single entry. (OGC-1131) — *Unified test editor*
- Print from label presets that match your printer and label stock. (OGC-285) — *Barcode label management*
- Jump straight to a patient's record from the validation screen. (OGC-767) — *Result validation*
- The validation action button now reads "Validate," matching what it does. — *Result validation*
- Date pickers now display in your locale and the Quick Address Search field is properly labeled. — *Order & sample entry*
- Enter a multi-line provisional clinical diagnosis when adding an order. — *Order & sample entry*
- Home-dashboard turnaround times now show as whole hours. — *Turnaround time report & dashboard*


## 3.2.1.10
### For decision-makers
- Full two-way instrument integration reduces manual order entry at the bench. (OGC-773) — *Outbound order dispatch*

### For implementers & admins
- New live log screen and logging configuration, including under SSO login. — *System monitoring & logs*
- Bidirectional ASTM/HL7 order dispatch via the analyzer bridge. (OGC-773) — *Outbound order dispatch*

### For lab users
- Orders can now be sent to instruments automatically, not just received. (OGC-773) — *Outbound order dispatch*


## 3.2.1.9
### For decision-makers
- Operational visibility into data exchange reliability. — *Automatic result sharing (FHIR)*

### For implementers & admins
- See and act on FHIR data-export retry health from admin. — *Automatic result sharing (FHIR)*
- Filter and manage test notifications more easily. — *Test notifications & SMS gateways*


## 3.2.1.8
### For lab users
- Patient identifiers now show in the modify-order header. — *Patient & order enhancements*
- Entered date/time now persists on result entry. — *Results entry*


## 3.2.1.7
### For decision-makers
- Supports consent-tracking compliance for patient testing. (OGC-557, OGC-558) — *Informed consent capture*
- Stronger quality control supports accreditation readiness. (OGC-41) — *Westgard QC rules & dashboard*
- Modernized, faster UI foundation. — *Modernized user interface*

### For implementers & admins
- Manual consent recording fields configurable on patient orders. (OGC-557, OGC-558) — *Informed consent capture*
- FHIR-based QC pipeline with automated rule evaluation. (OGC-41) — *Westgard QC rules & dashboard*
- Create file-based analyzers from profiles with two-way bridge sync. — *Analyzer file import*
- Breaking change to query translation — review analyzer query configuration on upgrade. **[breaking]** (OGC-346) — *Analyzer integration framework*

### For lab users
- Record patient informed consent against an order. (OGC-557, OGC-558) — *Informed consent capture*
- QC results are evaluated automatically against Westgard rules. (OGC-41) — *Westgard QC rules & dashboard*
- Cleaner, faster storage screens. — *Sample storage management*


## 3.2.1.6
### For lab users
- Attach patient ID documents to records. — *Patient & order enhancements*


## 3.2.1.5
### For decision-makers
- Chain-of-custody for sample referral networks. (OGC-62) — *Sample shipment & referral*
- Audit trail supports accreditation and data integrity. — *System-level audit trail*
- 21 CFR Part 11-aligned electronic signatures. — *Electronic signatures*
- Structured CAPA supports quality management. — *Non-conforming events (NCE) & CAPA*
- Security hardening across the REST API. **[security]** (OGC-150) — *Strengthened data security*
- TAT monitoring surfaces lab performance. (OGC-306, OGC-307) — *Turnaround time report & dashboard*
- Expanded FHIR R4 surface for interoperability. — *FHIR R4 API*
- Supports multilingual deployments. (OGC-349) — *Standardized terminology*
- Broader instrument coverage. (OGC-344, OGC-417, OGC-418) — *Analyzer file import*

### For implementers & admins
- System-wide audit trail of configuration and data changes. — *System-level audit trail*
- Project-wide CSRF and REST @PreAuthorize hardening — re-test custom integrations. **[security]** (OGC-150) — *Strengthened data security*
- Metadata can be translated into any language. (OGC-349) — *Standardized terminology*
- Added flat-file import for additional instruments. (OGC-344, OGC-417, OGC-418) — *Analyzer file import*

### For lab users
- Create electronic shipment manifests for referred samples. (OGC-62) — *Sample shipment & referral*
- Sign results and reports electronically. — *Electronic signatures*
- Track non-conforming events with history and assignment. — *Non-conforming events (NCE) & CAPA*
- Monitor turnaround times; manage the lab calendar. (OGC-306, OGC-307) — *Turnaround time report & dashboard*
- Order entry and sample collection are now separate steps. (OGC-356) — *Order & sample entry*


## 3.2.1.4
### For decision-makers
- Connect instruments without custom code. (OGC-325, OGC-492) — *Analyzer integration framework*
- Validated TB/HIV/COVID instrument support. (OGC-335) — *Validated instrument library*
- Patient/provider SMS notifications in more regions. — *Test notifications & SMS gateways*
- Brings EQA into the LIS for accreditation. — *EQA / proficiency testing*
- Foundation for flexible, self-service reporting. — *Custom data export*

### For implementers & admins
- Generic, bridge-mandatory analyzer framework with per-analyzer mappings. (OGC-325, OGC-492) — *Analyzer integration framework*
- Cepheid GeneXpert ASTM adapter. (OGC-335) — *Validated instrument library*
- Configure Twilio or Africa's Talking for SMS. — *Test notifications & SMS gateways*

### For lab users
- Control how many barcode labels print. (OGC-284) — *Barcode label management*
- Begin managing proficiency-testing events in OpenELIS. — *EQA / proficiency testing*

