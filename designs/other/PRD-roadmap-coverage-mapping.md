# PRD → Roadmap Coverage Mapping
## SILNAS PRD v0.5 — Environmental & Vector Modules

**Source:** [Revise] PRD Human, ENV, Vector & BPP Module Ver. V.0.5  
**Mapped against:** OGC-527 Epic — Environmental & Vector Testing Module roadmap  
**Date:** 2026-04-20

---

## Summary

| Area | PRD items | Covered | Partial | Gap |
|------|-----------|---------|---------|-----|
| ENV Dashboard | 4 | 3 | 0 | 1 |
| ENV Registration & Pre-Analytical | 11 | 7 | 2 | 2 |
| ENV Testing (Analytical) | 2 | 0 | 1 | 1 |
| ENV Verification & Validation | 7 | 4 | 1 | 2 |
| Vector Registration & Pre-Analytical | 10 | 7 | 1 | 2 |
| Vector Testing (Analytical) | 2 | 0 | 1 | 2 |
| Vector Verification & Validation | 6 | 4 | 1 | 1 |

---

## Environmental Module

### ENV Dashboard

| PRD Item | PRD Acceptance Criteria (key points) | Our Spec | Status | Notes |
|----------|---------------------------------------|----------|--------|-------|
| Internal Laboratory Environmental Dashboard | Real-time refresh, mobile-responsive, filters by test type / date range / location (province → village) | **S-07** (OGC-553) | ✅ Covered | S-07 covers compliance trend charts, KPI cards, exceedance table, date/site filters. Mobile-responsiveness not explicitly spec'd. |
| Environmental Table List | Sample type, parameters, compliant/non-compliant counts, location, total count; XLSX export | **S-07** (OGC-553) | ✅ Covered | Exceedance DataTable in S-07 covers this pattern; XLSX export included. |
| Curve Chart | Trend lines, threshold reference lines, hover tooltips, PNG/PDF export | **S-07** (OGC-553) | ✅ Covered | Monthly compliance trend chart with threshold reference lines, CSV export. PNG/PDF export of charts not explicitly spec'd — minor gap. |
| **Geographic Distribution Map** | Interactive map (Leaflet/OpenLayers), markers by sample location, choropleth by district, case cluster overlays, disease toggle, PNG/PDF export | — | ❌ **Gap** | S-07 has no geographic map component. PRD requires map with choropleth, markers, clusters. New spec needed. |

### ENV Sample Registration & Pre-Analytical

| PRD Item | Key Requirements | Our Spec | Status | Notes |
|----------|-----------------|----------|--------|-------|
| View Registration Main Page | Worklist sorted by date, searchable, sortable columns, "New Registration" and "Process referral" buttons | **S-03** (OGC-537) | ✅ Covered | S-03 defines the order entry worklist and new registration entry point. |
| Process Referral Registration | Search by referral ID, match form data, reject with reason | Core OpenELIS / **S-03** | ✅ Covered | Core functionality extended by S-03. |
| Registration Form | Multi-step form: customer, collection date, sample collector, payment type, subcontract, special needs | **S-03** (OGC-537) | ✅ Covered | S-03 4-step form covers these fields. |
| Sample Input | Add/import/duplicate/delete samples; coordinates; preservation; parameters/Baku Mutu; **uncertainty value** field; GPS coordinates | **S-03** (OGC-537) | ⚠️ Partial | S-03 covers sample type, compliance standard, collection conditions, GPS. **Uncertainty value** field is not in S-03 — appears in PRD as mandatory ENV sample data field. Needs addendum. |
| Review Registration Data | Read-only summary before submit; confirmation modal; status → Received | **S-03** (OGC-537) | ✅ Covered | S-03 step 4 (Review & Submit) covers this. |
| Edit Registration | Edit allowed before payment and before collection; modifiable in form and sample form | Core OpenELIS | ✅ Covered | Standard core functionality. |
| Print Registration / Print QR Code | Print registration PDF; print QR code label, repeatable | Core OpenELIS | ✅ Covered | Standard core functionality. |
| **Transfer to other Laboratory Unit** | Transfer with reason; target unit selection; WhatsApp/email notification; status → Referred; history preserved | — | ❌ **Gap** | Not spec'd in any ENV spec. Likely needs a cross-cutting transfer workflow spec (applies to all three modules). |
| Eligibility Test | Review criteria, Eligible/Non-Eligible decision, QR label generation, status update | **S-03** (OGC-537) | ✅ Covered | S-03 pre-analytical eligibility gate covers this (also referenced in pre-analytical-eligibility-gate.html). |
| Resampling | Resampling action when non-eligible but re-submittable; reason required; WhatsApp/email notification; status → Pending | **S-03** (OGC-537) | ⚠️ Partial | S-03 covers eligibility rejection. Resampling as a distinct named workflow step with notification is not explicitly spec'd. |
| **Payment** | Validate payment type (General/Unpaid vs. Program/Paid); payment receipt print; non-mandatory (unpaid can still process) | — | ❌ **Gap** | Payment workflow is not in our ENV/Vector specs. PRD treats it as a step between eligibility and distribution. Likely a separate cross-cutting story. |

### ENV Testing (Analytical)

| PRD Item | Key Requirements | Our Spec | Status | Notes |
|----------|-----------------|----------|--------|-------|
| Input Manual Testing | Instrument QC check before testing; manual result entry; auto-validation against reference ranges (High/Critical/Normal/Low); status → Test Completed; final storage disposition (Temp/Biorepository/Disposal) | **S-05** (OGC-547) | ⚠️ Partial | S-05 covers compliance evaluation and result validation against thresholds. Instrument QC gate and storage disposition are not in our ENV specs — instrument QC is addressed in S-08 (QC rules) at the protocol level but not the per-test analyst gate. Storage disposition is cross-cutting. |
| **Analyzer / Instrument Interfacing (LIMS Bridge)** | Auto-populate results from analyzer via LIMS Bridge; send worklist to analyzer; pull results automatically | Analyzer integration epic | ❌ **Gap** (out of scope) | This is the analyzer/instrument interfacing epic — separate from OGC-527. Not our responsibility to spec within ENV module. Flag for cross-epic dependency. |

### ENV Verification & Validation

| PRD Item | Key Requirements | Our Spec | Status | Notes |
|----------|-----------------|----------|--------|-------|
| Verification of Final Results | Verificator reviews, corrects, approves; status → Technically Verified; forward to Validator | Core OpenELIS | ✅ Covered | Standard verificator workflow. |
| Print Verification Report | Print pre-validation result as PDF, repeatable | Core OpenELIS + **S-06** | ✅ Covered | |
| View PDF LH | Verificator can preview LH PDF | **S-06** (OGC-552) | ✅ Covered | S-06 defines LH PDF generation and preview. |
| **View PDF SR (Surat Rekomendasi)** | Verificator can view Recommendation Letter PDF | — | ❌ **Gap** | S-06 covers LH (Laporan Hasil) only. SR is a separate Indonesian administrative document not spec'd anywhere. |
| **View PDF SP (Surat Pengantar)** | Verificator can view Cover Letter PDF | — | ❌ **Gap** | Same as above — SP not spec'd. |
| Test Result Validation (Validator) | Validator reviews, inputs validation data, Save Draft / Return to Validator flow; LH numbering; e-sign | **S-06** (OGC-552) | ✅ Covered | S-06 covers dual e-sign, LH numbering, sequential cert numbering, PDF generation. |
| E-sign | National e-Signature Service integration; online and offline signing; PDF generation prior to signing | **S-06** (OGC-552) | ✅ Covered | S-06 §11 covers dual e-signature. |
| Download LH | Customer download via email link after signed + numbered; audit log; access control | **S-06** (OGC-552) | ⚠️ Partial | S-06 covers PDF generation and batch download. Email delivery link to customer not explicitly spec'd in S-06. Minor gap. |

---

## Vector / Reservoir Module

### Vector Registration & Pre-Analytical

| PRD Item | Key Requirements | Our Spec | Status | Notes |
|----------|-----------------|----------|--------|-------|
| View Registration Main Page | Same pattern as ENV | **V-02** (OGC-581) | ✅ Covered | V-02 covers CollectionLot registration and worklist. |
| Process Referral Registration | Search by referral ID, match data | Core OpenELIS | ✅ Covered | |
| Registration Form | Customer, collection date, start/end date, sample collector, payment type, subcontract | **V-02** (OGC-581) | ✅ Covered | V-02 covers trap-based collection lot entry, field data capture. |
| Sample Input | Add/import/duplicate/delete vector samples; GPS coordinates; sampling time; parameters/Baku Mutu | **V-02** (OGC-581) + **V-01** (OGC-555) | ✅ Covered | V-01 defines vector sample types; V-02 covers collection entry with GPS, pooling, lot metadata. |
| Review Registration Data | Read-only summary, confirm, status → Received | **V-02** (OGC-581) | ✅ Covered | |
| Edit Registration | Edit before payment and collection | Core OpenELIS | ✅ Covered | |
| Print Registration / QR Code | PDF print, QR code label | Core OpenELIS | ✅ Covered | |
| **Transfer to other Laboratory Unit** | Same as ENV — reason, notification, history | — | ❌ **Gap** | Same cross-cutting gap as ENV. |
| Eligibility Sample | Eligible/Non-Eligible decision; resampling; QR label; status flow | **V-02** (OGC-581) | ✅ Covered | V-02 covers sample intake and eligibility. |
| Payment | Same as ENV | — | ❌ **Gap** | Same cross-cutting gap as ENV. |

### Vector Testing (Analytical)

| PRD Item | Key Requirements | Our Spec | Status | Notes |
|----------|-----------------|----------|--------|-------|
| Input Manual Testing | Instrument QC gate; manual result entry; **reflex test** support (checkbox triggers follow-up test when result > threshold); storage disposition | **V-03** (OGC-583) | ⚠️ Partial | V-03 covers species ID, pathogen screening, pool deconvolution. **Reflex testing** (automatic follow-up test ordered when result exceeds threshold) is not spec'd in V-03. Storage disposition not in V-03. |
| **Analyzer / Instrument Interfacing** | Same as ENV — LIMS Bridge, auto-populate | Analyzer integration epic | ❌ **Gap** (out of scope) | Same cross-epic dependency note as ENV. |
| **Reflex Test** | Reflex test checkbox on result entry; system indicates follow-up test required when result exceeds defined threshold | — | ❌ **Gap** | Not in V-03. Applies to vector pathogen screening where a positive pool triggers individual specimen follow-up. Candidate for a V-03 addendum or separate story. |

### Vector Verification & Validation

| PRD Item | Key Requirements | Our Spec | Status | Notes |
|----------|-----------------|----------|--------|-------|
| Verification of Final Results | Verificator reviews, corrects, approves | Core OpenELIS | ✅ Covered | |
| Print Verified Report | PDF print, repeatable | Core OpenELIS + V-03/V-04 | ✅ Covered | |
| View PDF LH | LH PDF preview for verificator | **V-04** (OGC-585) | ✅ Covered | V-04 covers surveillance report generation. |
| Test Result Validation (Validator) | Validator reviews, Save Draft / Return to Verificator | Core OpenELIS | ✅ Covered | |
| E-sign | National e-Signature, online/offline | Core OpenELIS / **S-06 pattern** | ⚠️ Partial | S-06 defines the e-sign pattern for ENV. Not explicitly spec'd as a separate story for Vector — likely same implementation but should be noted as applying to Vector LH as well. |
| Download LH | Email link, access control, audit | Core OpenELIS / **S-06 pattern** | ✅ Covered | Same as ENV — pattern defined in S-06. |

---

## Gaps Summary

The following items are in the PRD but **not covered** by the current roadmap. Recommended action per item:

| # | Gap | Module(s) | Severity | Recommended Action |
|---|-----|-----------|----------|--------------------|
| 1 | **Geographic Distribution Map** — interactive Leaflet/OpenLayers map with markers, choropleth by district, cluster overlays, disease toggle | ENV | High | New spec — S-07 addendum or new S-09 story. Geographic map is explicitly required in PRD dashboard layout. |
| 2 | **SR (Surat Rekomendasi) document** — Recommendation Letter PDF, viewable/printable by verificator | ENV | Medium | Addendum to S-06. Indonesian administrative document, likely companion to LH. |
| 3 | **SP (Surat Pengantar) document** — Cover Letter PDF, viewable/printable | ENV | Medium | Same — addendum to S-06. |
| 4 | **Inter-lab transfer workflow** — transfer with reason, target unit, WhatsApp/email notification, history | ENV + Vector | Medium | Cross-cutting spec. One story covering all three modules. Likely OGC-296 or a new cross-module story. |
| 5 | **Payment workflow** — Unpaid/Paid status gate between eligibility and distribution; receipt print; non-mandatory | ENV + Vector | Medium | Cross-cutting. May already exist in core OpenELIS — needs a gap check against current implementation before speccing. |
| 6 | **Uncertainty value on ENV samples** — mandatory field on environmental sample data entry | ENV | Low–Medium | Addendum to S-03. Single field addition to the Sample Input step. |
| 7 | **Reflex testing for Vector** — checkbox on result entry triggering follow-up test when result exceeds threshold | Vector | Medium | Addendum to V-03. Relevant for positive pool pathogen screening triggering individual specimen follow-up. |
| 8 | **Analyzer / LIMS Bridge** — auto-populate results from instruments | ENV + Vector | — | **Out of scope for OGC-527.** Separate analyzer integration epic. Flag as cross-epic dependency. |
| 9 | **Email delivery of LH download link** to customer | ENV + Vector | Low | Minor addendum to S-06 — email notification on LH finalization. |
| 10 | **PNG/PDF export of dashboard charts** | ENV | Low | Minor addendum to S-07. Chart export buttons. |
| 11 | **Service Officer role** for LH numbering (Vector) | Vector | Low | Noted in PRD for Vector only. Core role management — check if covered by existing RBAC spec. |
| 12 | **Offline mode** (non-functional) | All | — | Infrastructure/non-functional requirement. Out of scope for feature specs. Note for architects. |

---

---

## Bogor Requirements Spreadsheet Reconciliation

**Source:** "Results Bogor (ENG Ver) Group 1. SILNAS Features in PRD IN _ Hasil diskusi.xlsx"  
**Read via:** Google Drive API, 2026-04-20  
**Sheets reviewed:** Tab 3 — Modul Lingkungan (ENV), Tab 4 — Vector & BPP Module

This section compares the Bogor group discussion doc against the PRD v0.5 gap analysis above. The spreadsheet represents a **later, authoritative decision record** (Bogor workshop outcomes) and overrides or contextualizes several items from the PRD.

### Changes from PRD v0.5 → Bogor decisions

| PRD Gap # | Item | PRD Status | Bogor Decision | Implication for Roadmap |
|-----------|------|-----------|----------------|------------------------|
| 1 | Geographic Distribution Map (ENV dashboard) | High gap | **Not listed in ENV module.** Map is in Module 7 (Surveillance Module), not ENV. | **Remove S-09 from OGC-527 scope.** Flag as Surveillance Module (Module 7) requirement. |
| 2 | SR (Surat Rekomendasi) | Medium gap | Clinical module: **Not Required**. ENV module: not listed at all. | **Deprioritize / remove S-10 from OGC-527 scope.** |
| 3 | SP (Surat Pengantar) | Medium gap | Clinical module: **Not Required** (final decision). ENV not listed. | **Deprioritize / remove S-10 from OGC-527 scope.** |
| 7 | Reflex testing for Vector | Medium gap | **Not listed in Vector & BPP module.** Reflex testing is Clinical-only (Must Have, Phase 1 in Clinical tab). | **Remove V-03b from Layer 4.** Not a Vector module requirement. |
| 9 | Email LH download link | Low | **Confirmed Must Have** (with delivery notification/mark if email fails). | S-06b confirmed — promote to confirmed gap. |
| 10 | PNG/PDF chart export | Low | QC/Surveillance dashboards confirm "Chart Export: Must Have, Next Phase". ENV module dashboard not listed separately. | S-07b still valid — keep. |
| 11 | Service Officer / LH numbering | Low | Both ENV and Vector: LHU Numbering = **Not Required** ("same as registration/lab number"). | **Remove.** Not required. |

### New gaps identified from spreadsheet (not in PRD v0.5)

| # | Gap | Module(s) | Severity | Notes |
|---|-----|-----------|----------|-------|
| A | **Subcontract management** — Track samples sent to external laboratories; record external lab assignment and disposition | ENV + Vector | Medium | Listed in ENV registration ("Subcontract Management: Must Have, Phase 1"). Implicit in Vector. Not covered in S-03 or V-02. |
| B | **SOP deadline calculation** — Compute testing deadline based on SOP requirements from collection date/time | ENV | Medium | Listed under ENV Special Features ("SOP Deadline Calculation: Must Have, Phase 1"). Not in any ENV spec. |
| C | **Final storage disposition** — Record sample final location (Temporary / Biorepository / Disposal) after result entry | ENV + Vector | Medium | ENV: "Final Storage: Must Have, Phase 1." Vector: implied. Both PRD and spreadsheet confirm this. Cross-cutting with Biorepository module. |

### V-04 scope note (Vector Surveillance Reporting)

The spreadsheet explicitly marks all Vector surveillance features as **"Not Required"** in the Vector & BPP module tab, with the note "Available in Surveillance Module":

- Geographic Distribution of vector → Surveillance Module
- Outbreak Detection from vector data → Surveillance Module
- Seasonal Pattern monitoring → Surveillance Module
- SKDR Integration → Surveillance Module

This means V-04 (OGC-585 — Vector Surveillance Reporting with embedded Superset dashboard, MIR heatmap, FHIR pipeline) is **architecturally correct but may be out of OGC-527 scope**. The V-04 spec positions these features as an internal part of the Vector module; the Bogor decisions position them as belonging to Module 7 (Surveillance). Recommended action: flag V-04 for scope review with the team — the implementation may be shared, but the Jira epic and UX entry point should shift to the Surveillance Module.

### ENV-only scope confirmation

The ENV module tab in the spreadsheet does **not** include a dashboard section. The ENV data visualization (tables, trend charts, compliance summaries) is referenced in Module 7's "Three Main Module Dashboard" section, with a note: "located in 3 main modules." This confirms S-07 (Environmental Dashboard) is correctly placed within OGC-527 as an internal module view. The geographic surveillance map in Module 7 is a separate Surveillance Module deliverable.

---

## Items Confirmed Covered

All core ENV/Vector spec work (S-01 through S-08, V-01 through V-04) covers the following PRD requirements:

- Compliance Standards (Baku Mutu) administration → **S-01**
- Sampling Site Registry → **S-02**
- Environmental order entry, multi-step registration, collection conditions → **S-03**
- Sample type domain classification (Clinical/Environmental/Vector toggle) → **S-04 + OGC-296 addendum**
- Compliance evaluation (pass/marginal/fail against thresholds, unit conversion, overrides) → **S-05**
- Laporan Hasil (LH) PDF generation, dual e-sign, sequential numbering, batch download, audit trail → **S-06**
- Environmental trend dashboard (compliance curves, KPI cards, parameter drill-down, exceedance table, site comparison, CSV export) → **S-07**
- Environmental QC rules (field blank, trip blank, RPD, spike recovery; per-standard protocol config; analyst gate; acknowledgment modal) → **S-08**
- Vector specimen types, taxonomy, trap types, pooling strategies → **V-01**
- Vector collection workflow (CollectionLot, trap metadata, GPS, pool intake) → **V-02**
- Vector species identification, pathogen screening, pool deconvolution → **V-03**
- Vector surveillance reporting (Superset embedded dashboard, MIR heatmap, trap catch rate, FHIR pipeline) → **V-04**
