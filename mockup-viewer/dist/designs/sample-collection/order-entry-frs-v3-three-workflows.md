# Order Entry FRS v3 — Three Domain-Scoped Workflows

**Supersedes/updates:** Sample Collection Redesign / Order Entry FRS v2 (`designs/sample-collection/sample-collection-redesign.md`, OGC-537). **Status:** DRAFT for review. **Date:** 25 Jun 2026.

This update reflects decisions taken after FRS v2 and the live behaviour audit (see `clinical-order-entry-GATES.md` and the spec crosswalk). The biggest change: order entry is no longer one decoupled workflow with a clinical/environmental toggle — it is **three separate, domain-scoped workflows** (Clinical, Environmental, Vector) on a shared wizard framework, with domain-driven navigation and visibility.

---

## 1. What changed from v2 (summary)

1. **Three separate workflows**, not one toggled workflow: Clinical, Environmental, Vector each have their own order-entry route and stages.
2. **Navigation:** each domain's order entry is its own top-level menu action (e.g., **Menu → Add Clinical Order**, with its submenus), **not** all nested under a single generic "Add Order."
3. **Domain visibility:** which order-entry action(s) a user sees is driven by the **domain of their assigned lab unit(s)**; admins see all three paths.
4. **Required-field sets are per domain** (v2's unified §11 is replaced by §7 below).
5. **Corrected field/gate behaviour:** sample/tests are optional pre-population at step 1; quantity is blank/optional; label printing and storage are optional; the QA checklist is advisory (config-gated); validation is non-destructive and recoverable; a new order always starts from clean state. These correct live defects G1, G7–G12.
6. **Required fields mirror legacy order entry and are configuration-driven** — the new order entry honours the existing **Order Entry / Patient Entry configuration** (Admin → General Configuration → Order Entry configuration) via the **same API** as the legacy form, so admins keep control of which fields are required/shown. Ordering **Site and Provider are required** (OpenELIS breaks downstream without them); **Program is not mandatory** (the "no program" / Routine Testing default applies).

---

## 2. Navigation & visibility

- **Menu structure:** the order-entry actions appear directly under the main **Menu**, one per domain — **Add Clinical Order**, **Add Environmental Order**, **Add Vector Order** — each opening its own workflow (with any domain submenus beneath it). Do **not** nest them under a single "Add Order" parent.
- **Domain assignment:** every lab unit (test section) is assigned a domain (Clinical / Environmental / Vector) via Test Catalog administration.
- **Per-user visibility (domain-level):** a user whose assigned lab unit(s) belong to a domain sees **that domain's** order-entry action(s) only.
- **Per-user scoping (unit-level):** scoping is **finer than domain** — it follows the user's assigned **lab unit(s)**. A user who only has access to **Hematology** sees only Hematology orders (in lists, dashboards, and worklists), not all Clinical orders. The dashboards are **separate per domain** and each list is filtered to the orders for the user's assigned unit(s). (Admins see all units/domains.)
- **Admin visibility:** an admin user sees **all three** order-entry actions/paths and **all units**.
- Dependency: builds on the lab-unit domain assignment (Test Catalog work) and the department/role scoping in OGC-391 / OGC-392.

---

## 3. Shared wizard framework (all domains)

- The order-entry workflow is a multi-step wizard with a stepper header, an order summary banner (Lab Number, Patient/Subject, Samples), and **Save**, **Save & Next**, and **Save Draft** actions.
- **Save & Next** advances to the next stage; **Save** persists in place; **Save Draft** retains an incomplete order for later.
- **Stage entry** scrolls to the top of the page and focuses the first actionable field (fixes G9).
- **Recoverability (fixes G1):** validation never throws a fatal/unrecoverable error. Blocking conditions are shown as inline field errors and are correctable in place. Auto-save keeps the order recoverable (per v2 XC-1).
- **Clean state (fixes G12):** starting a new order resets all order context (requester, program, samples); no field from a prior order persists into a new one. A selected Site/Provider must actually bind to the order and be used by downstream saves.

---

## 4. Per-domain workflows

### 4.1 Clinical
- **Stages:** Enter Order → **Collect** → Label & Store → QA Review.
- **Enter Order:** Lab Number (generated); **Patient** (search or New Patient; New Patient requires National ID). Sample Type and Tests **may** be entered here as optional pre-population (see §5). Program, Clinical Information, Requester (Site/Provider), Priority, Required By are available; see §7 for which are required.
- **Test/panel selection is by name OR code (clinical):** at Enter Order, reception finds tests and panels by **either the test name or its code**, so when the requisition lists only the test name, reception does not have to guess a code. **Sample type is not required to add a test here** — which sample(s) each test maps to is **disambiguated at Collect (step 2)** via the Option-C interaction (§4.1.1). (Test selection itself remains optional pre-population at step 1.)
- **Ward / Unit / Department (clinical only):** a **sub-unit of the selected ordering facility** identifying where the patient is (e.g., ICU, Maternity Ward, Emergency Dept.). It is **disabled until a facility/site is selected**; once a facility with subunits is chosen, the dropdown enables and populates from that facility's subunits (maps to legacy `requesterDepartmentId`). It is optional. Environmental and Vector do not have this field (no patient).
- **Collect:** the collector **confirms** the pre-populated sample(s)/tests (or enters them if not pre-populated), sets Unit if a quantity is recorded, and captures collection details.

#### 4.1.1 Sample↔Test linkage (v2 — the Option-C interaction)
The ordered tests from Enter Order appear in a **Requested Tests** table at Collect with three columns: Test/Panel · **Can use sample type** (from the test catalog) · **Assign to**. The collector groups tests into the samples (tubes/containers) they will collect:
- **One self-describing "Assign to" menu per test** (replacing the v1 chip/popover). For each compatible sample type the menu offers: each **existing sample of that type** — e.g., *"Sample 1 — Plasma (with HIV VIRAL LOAD)"* — so the test runs off the **same tube**; and **"New … sample (separate draw)"** to create a new tube of that type. The menu's wording makes the outcome explicit, so there is **no silent auto-assign** — the user always sees and confirms where each test goes.
- **Default grouping:** tests that can share a sample type are grouped into **one sample by default**, minimizing draws. A **panel header** has an **"Assign all panel tests to"** menu so a 15-test panel (e.g., a CBC) lands on one tube in a single action; individual rows can still override.
- **Separate draw / different type:** choosing "New … sample (separate draw)" creates a new sample (Sample 2, 3, …); the Samples section below mirrors it immediately.
- **Same test on multiple draws (rare):** assign it once, then use **"+ also collect on another sample"** on that row to add a second assignment.
- **Unassigned tests are flagged** by a single banner and an amber-outlined menu; **Save & Next is gated only on every test having a sample** — nothing else.
- Uncheck a panel test to drop it from the order.

**Real-life walkthrough.** A requisition orders a **CBC panel (15 tests)**, **Glucose**, and an **HIV Viral Load**. Reception adds them at Enter Order by name or code (no sample type yet) and saves. At Collect, the CBC panel header defaults to **"Assign all panel tests to → Sample 1 (EDTA Whole Blood)"** — all 15 tests on one tube; Glucose and HIV VL default to **Sample 2 (Plasma)**. The collector accepts: **2 draws cover 17 tests**. If a coagulation test needs its own citrate tube, its "Assign to" menu → **"New Citrate sample (separate draw)"** creates Sample 3. Anything left on **"— Choose a sample —"** keeps the banner up and blocks Save & Next.

- **v1→v2 status:** the v1 popover/multi-sample model is replaced by the "Assign to" menu (the v1 build drifted to forcing tests at step 1 and could auto-assign). Built in the v2 clinical mockup. This is Reagan's Story 3.

### 4.2 Environmental
- **Stages:** Enter Order → Label & Store → QA Review (no Collect stage).
- **Enter Order:** Sampling Site (registry search, **required**), applicable Compliance Standards (**required**), default collection conditions (collection method — **optional**, water/ambient temp, weather, preservation), GPS/geolocation, per-sample manifest (container), "lab performed sampling", SOP max holding time. Requester = Requesting Organization + Requestor contact (see §5). Required: see §7.
- **CSV bulk intake (Env + Vector only):** for batch intake of many pre-collected samples (e.g., a 10×10 storage box or 96-well plate), Environmental and Vector offer a **CSV template download + upload with a validating preview** (per-row valid/invalid, fixable before import). **Clinical does not have CSV bulk import** — it doesn't fit the patient-by-patient clinical workflow.

### 4.3 Vector
- **Stages:** organism-based order entry → (downstream) species identification & pool deconvolution at Results › Vector Identification.
- **Enter Order:** Sampling Site (**required**), trap/collection metadata, organism/pool fields; no compliance-standards block, no GPS manifest. Program is **optional**. Vector Field Survey Program (OGC-779) interplay applies. Requester = Requesting Organization + Requestor contact (see §5). Required: see §7.
- **CSV bulk intake (Env + Vector only):** same batch-intake CSV template + validating preview as Environmental, for loading many pre-collected/field-collected samples at once. Not present in Clinical.

---

## 5. Field behaviour rules (corrected)

- **Sample type & requested tests are OPTIONAL pre-population at step 1.** Intent: reception holds the order form (and maybe the samples) and *may* log sample/tests at Enter Order so the Step-2 collector only **confirms** them rather than re-entering. The order can be saved/advanced without sample or tests selected at step 1. (Fixes G5/G6; aligns with v2 ORD-1b.)
- **Quantity is blank by default and optional** (fixes G7). No hardcoded default of 1.
- **Unit of measure** derives from the test catalog where available; a blank UOM must not error the save. Only when a quantity is explicitly entered should a UOM be required (fixes G8).
- **Label printing is optional** to advance (fixes G10).
- **Storage assignment is optional** to advance. If the user does nothing, unassigned samples are processed immediately — **skipping storage must NOT require any click** (no forced "Skip storage" action) (fixes G10).
- **QA checklist = Sample Acceptance Checklist (S-09 / OGC-580, Samuel).** The QA Review page **hosts the manual Pass/Fail/NA checklist** resolved for the order's **domain**. The item list (label + active + display order), and whether completing it blocks acceptance, are configured in **Admin → General Configuration → Order Entry Configuration → Sample Acceptance Checklist** — domains navigated by SideNav submenu items (All domains / Clinical / Env / Vector, not tabs). **Enforcement is per domain: Mandatory / Optional / Off** (default Optional on upgrade): Mandatory = every item must be answered before Submit; Optional = advisory; Off = hidden. A domain with its own items uses that list; otherwise it falls back to the lab-wide "All domains" list (never merged). Read-only transit time is context only and never auto-grades; a failed item can pre-fill an NCE. Give it a clear place on the QA Review page (a "QA Checklist" section, above the audit trail). (Fixes G11; aligns with v2 BR-007 "advisory, not blocking.")
- **Required fields are configuration-driven**, honouring the existing Order Entry / Patient Entry configuration (the same ~14 Order Entry + 8 Patient Entry properties) via the **same API** as the legacy order form. Admins set which fields are required/shown in Admin → General Configuration → Order Entry configuration; the new workflow must not hardcode its own required set.
- **Ordering Site and Provider are required** for clinical orders and are respected exactly as in the legacy form — OpenELIS breaks downstream without an ordering site/provider.
- **Program is not mandatory** (G2 resolved): it defaults to the "no program" (Routine Testing) program; Save & Next must not be gated on Program. (Applies to Clinical and Vector.)
- **Requester model (Environmental / Vector):** the requester is the **customer requesting the test** — a **Requesting Organization** (the company) plus a **Requestor** (the contact person for the order). At least one of the two is required (possibly both — confirm); the current UI does not make this distinction clear and should. (Clinical uses Site + Provider instead of the org/contact pair.)
- **Capture ALL fields for both the Organization and the Requestor.** The element must surface the **full field set** for each, at parity with how OpenELIS already stores the requesting organization and the requesting provider:
  - **Requesting Organization:** name, plus its full contact set (address/city, phone, fax, email, and any other Organization fields the schema already carries) — not just a name string.
  - **Requestor (contact person):** First Name, Last Name, **Phone, Fax, Email**, and Department — the same field set captured for the clinical requesting provider.
- **Search & store exactly like the requesting provider.** Organizations and requestors are **searched and stored the same way the requesting doctor/provider is** today: type-ahead against the existing registry, select to bind, and the values persist for reuse. Clinical (Provider) and Env/Vector (Org + Requestor) use the **same search/store mechanism**.
- **Edit-lock on found records.** When a facility/organization, provider, or requestor is selected from search, its fields are **read-only until the user clicks "Edit details"** — preventing accidental keystrokes from persisting changes to a saved record. Newly-added (free-text) records start editable. Applies across all three domains.
- **Free-text vs. restricted controlled lists** (per Order Entry configuration): the existing option that **allows or restricts free-text entry** of requester / organization / provider / site still applies. If **restricted**, the user must select from the existing DB list; if **allowed**, the user may type a new value, which is then **saved and persisted in the DB for future reuse**.
- **Add-new from the search list, gated by admin.** When the Order Entry configuration **allows** free-text/new entries, the search results offer an explicit **"+ Add new facility/organization"** and **"+ Add new requestor/contact"** affordance so the user can create the entry inline (it is then persisted for reuse, same as a typed free-text value). When the config **restricts** entry, the affordance is **not silently hidden** — it is shown **disabled with a clear message that adding new entries is disabled by the administrator**, so the user understands why they can only pick from the list. (Applies to facility/site, organization, and requestor/provider across all three domains.)
- **Auto-fill is configuration-driven and already solved on the legacy form.** Several auto-fills are **Order Entry Configuration** options (Admin → General Configuration) that the legacy order form implements correctly (e.g., default site, auto-filled received date) — the new workflow should **copy the legacy implementation**, honoring the same config, rather than reinventing it. (The quantity-default-of-1 is *not* such an option — it is a bug; quantity must be blank/null.)
- **Every field carries instructional helper text** — the form must *guide* the user, not just present inputs. Each field/section gets concise helper text (and placeholders) explaining how to use it and when it applies. Restore the mockup's guidance that the v1 build dropped (e.g., "Sample and test selection is optional at this step — these can be specified later during collection"; "Storage is assigned when you Save — no separate Assign button"; placeholders like "e.g., Fasting, Room temp"), and extend the same treatment to every field (requester model, quantity/UOM, collection conditions, the sample↔test mapping, QA checklist items). This is a UX-copy pass to do alongside the build, captured per field in the v2 mockup.

---

## 6. Validation & error handling

- Non-destructive, inline, recoverable (see §3). No state-corrupting or unrecoverable errors.
- A new Add Order always starts from a blank form (per v2 DSH-5).
- **All dates are serialized using the configured Date locale** (Admin → General Configuration → Site Information). The sampleXML sample `date`/`receivedDate` must use the same locale as the rest of the payload — a known live defect emits MM/DD/YYYY in the sampleXML while the app uses DD/MM/YYYY, causing a server 400 ("sampleXML date is not in a valid date format") whenever the day-of-month > 12. Server field errors must surface to the user, not be swallowed by a generic "Save failed" toast.
- Required-field enforcement is limited to the per-domain set in §7; nothing outside that set may block advancement, and any field that must stay required is visibly marked.

---

## 7. Required-field matrix (per domain, to confirm)

| Field | Clinical | Environmental | Vector |
| :-- | :-- | :-- | :-- |
| Lab Number | Required | Required | Required |
| Patient | Required | — | — |
| Sampling Site / Ordering Site | Required | Required | Required |
| Compliance Standard | — | Required | — |
| Collection Method | — | Optional | — |
| Program | Optional (not mandatory) | Optional | Optional |
| Provider (clinical requester) | Required | — | — |
| Requesting Organization (company) | — | Required* | Required* |
| Requestor (contact person) | — | Required* | Required* |
| Requestor contact (phone, email) | — | Captured | Captured |
| Sample Type | Optional (pre-pop) | Optional (pre-pop) | Optional (pre-pop) |
| Tests / Panels | Optional (pre-pop) | Optional (pre-pop) | Optional (pre-pop) |

*Clinical resolved (25 Jun): Site + Provider Required, Program optional, Sample/Tests optional pre-population. Remaining "(confirm)" cells are the Vector minimums. Required fields should ultimately be read from the legacy Order Entry configuration (§5) rather than hardcoded.*

---

## 8. Open decisions & dependencies

- Confirm the per-domain required-field sets (§7) — especially clinical Program/Provider and vector minimums.
- Test Catalog work delivers lab-unit → domain assignment (feeds §2 visibility).
- Samuel's QA-gating configuration option (feeds §5 QA rule).
- Department/role RBAC: OGC-391 (department + scoped assignment) and OGC-392 (effective permissions) underpin §2 visibility.
- Decide whether the step-1 sample/test pre-population is worth the complexity or should be simplified (Casey's open question).

---

*Companion docs: `clinical-order-entry-GATES.md` (gate register + crosswalk), `env-vector-order-entry-gaps-and-stories.md` (per-domain gap analysis + draft stories).*
