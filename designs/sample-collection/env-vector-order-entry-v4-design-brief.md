# Design Brief: Environmental and Vector Order Entry v4

Date: 2026-09-26. Inputs:
- the clarify log (C-1 to C-7)
- `env-vector-order-entry-v4-crosscheck.md`
- Clinical Order Entry v4 FRS v0.8 (OGC-1266), section L
- develop 44dbc44

**Purpose.** Reception registers a batch of field samples: water, soil, food or swabs for environmental; trap catches for vector. The batch is saved all at once, with nothing lost or overwritten. Every container gets the right number, tests, storage and label. Field QC and vector trap data are captured once, at intake, where the paperwork arrives.

**Primary user action.** Enter a sampling event (site, requester, samples or catches, tests) and save it in one step.

**Layout pattern.** Wizard reduced to one working step, **Enter Order**, plus the optional **Sample check**. Enter Order reads top to bottom in the order of the field sheet:

1. Order details
2. Site and requester
3. Program and compliance (environmental) or surveillance context (vector)
4. Collection conditions
5. **Samples table**, always shown
6. Labels
7. Attachments

The footer and progress indicator are the clinical ones.

**Interaction model.**
- **Inline editing in the samples table.** Required data sits on the row, never behind an expansion (D-078).
- **One-click row actions:** print, refer out, report NCE, remove, and add QC child (environmental).
- **Group rows:**
  - An environmental sample with its QC duplicate child, `-1` then `-1.1`.
  - A vector catch `-1` with its organisms `-1.1` to `-1.n`, shown collapsed as "25 organisms, pool -P01". Expanding it lists the organisms.
- **Per-row fields added by C-8 and C-9:**
  - sampling point (defaults from the order)
  - field or submitter sample ID
  - holding time remaining, from the test catalog limit
  - **Vector:** **Arrives as**, either Unsorted catch or Sorted pool. A sorted pool also carries species, sex and status as submitted.
- **Receipt condition, a shared panel above the table.** It covers shipment or cooler temperature with the thermometer used, ice present, seals and integrity, plus a preservation check per container on each row. Out-of-range values raise an NCE and a report qualifier.
- **Save model:** Save and exit, Save and finish, or Save and next when Sample check is on. Each save is one transaction (D-072). A disabled button always shows the To continue checklist (D-074).

**Scope boundary.** These do not appear:
- a Collect or Prepare Samples step
- the Label step, and the Complete page as a separate step
- deconvolution, species ID and re-pooling, which stay in V-03
- lab QC (method blanks, spikes)
- CSV import (OGC-1138), which is only required to use the same rows
- the external orders queue
- compliance-driven QC warnings
- any site, lab or tenant selector (D-001)
- upstream vector field data: zero catches, trap failure, set and retrieved times, caught versus submitted, lure, larval habitat, host (C-8)
- phase 2 optional fields and future work (C-9)

**Carbon components.** `DataTable` with expandable group rows and a batch toolbar; `ComboBox` (site, requester, compliance standard, tests: large sets, D-007); `DatePicker` and `TimePicker`; `NumberInput` (catch count, traps, nights); `Tag` (QC Blank, QC Duplicate, Pool, required markers); `InlineNotification` (To continue checklist, save errors).

**IA placement.**

| Domain | SideNav | Breadcrumb | Routes |
|---|---|---|---|
| Environmental | Orders & Patients › Add Environmental Order | Home / Orders / Environmental / Enter Order | `/order/environmental/enter`, `/order/environmental/qa`; `/order/environmental/label` redirects to enter (D-066) |
| Vector | Orders & Patients › Add Vector Order | Home / Orders / Vector / Enter Order | `/order/vector/enter`, `/order/vector/qa`; `/label` and `/complete` redirect |

- Sample check is labelled "Sample check" (D-083). The existing `sampleAcceptCheck.environmental` and `sampleAcceptCheck.vector` settings switch it off (Off hides the step).
- Dashboards stay at `/order/environmental` and `/order/vector`.
- The SideNav labels are unconfirmed. Check them against the navigation redesign (OGC-1241, D-064) and the live app before the FRS.

**Access.**
- The existing Reception role enters and saves orders, and can refer out.
- The Sample check role releases for testing.
- Creating a new sampling site from the order form is available to Reception unless `restrictFreeTextSampSiteEntry` is on. In that case the Create option is hidden and an admin adds sites in Sampling Sites admin.
- No new roles.

**Decisions the FRS will record** (candidates for the decision log, numbered from D-085 after re-checking the repo):
- **Container numbering is GLOBAL:** `-n` and `-n.m` in all domains, superseding D-082 (C-1). Vector pools are labelled groups, `-P01` and `-S1` (C-1).
- **Steps:** environmental and vector use Enter Order plus Sample check (C-2).
- **Vector catch:** the catch is the sample and organisms are its children. Fan-out never deletes (C-6, D-002).
- **Field QC at intake:** QC rows write the S-08 QC profile (C-5).
- **Sampling sites:** created only after a successful search, inside the order transaction, and never edited from the order form.
- **Compliance standard:** complete level, with an explicit investigative option (C-7).
- **Holding time:** anchored on collection time everywhere (MVP). Each test's limit comes from the test catalog, and "received out of hold" becomes a qualifier.
- **Receipt condition:** recorded as measured values on a shared component. Out-of-range values raise an NCE and a report qualifier (C-9).
- **Regulatory exports:** shipped as Custom Data Export presets (distro JSON). Order entry captures the regulatory identifiers and sample purpose (C-10). Expanded reporting is queued as a separate design.
- **Vector intake:** records only what the lab receives. Two intake shapes, unsorted catch and sorted pool (C-8).

**Deliverables next.** The FRS (both domains; shared parts cite clinical section L instead of repeating it) and an HTML preview. The preview shows:
- an environmental water batch with a blank and a duplicate
- a vector batch with one unsorted catch and two sorted pools
- the receipt condition panel with one out-of-range cooler temperature and one sample past its hold time
- the To continue checklist
- Sample check for each domain
- the MVP versus phase 2 split
