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
- **Per-user visibility:** a user whose assigned lab unit(s) belong to a domain sees **that domain's** order-entry action(s) only.
- **Admin visibility:** an admin user sees **all three** order-entry actions/paths.
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
- **Collect:** the collector **confirms** the pre-populated sample(s)/tests (or enters them if not pre-populated), sets Unit if a quantity is recorded, and captures collection details.

#### 4.1.1 Sample↔Test linkage (v2 — the Option-C interaction to refine in the FRS + mockup)
The ordered tests from Enter Order appear in a **Requested Tests** table at Collect with three columns: Test/Panel · **Compatible Sample Types** (from the test catalog) · **Sample Assignments**. The collector turns tests into samples here:
- Each test shows its compatible sample types as chips (e.g., `+ Serum`, `+ Whole Blood`).
- Clicking a compatible-type chip prompts an **explicit choice**: *"Add to Sample 1 (Serum)"* vs *"New Serum sample (separate draw)"* — never silently auto-assign (this is the error-prevention safeguard from the mockup that must be preserved/restored).
- Supports **multiple samples** (a test can map to Sample 1, a second draw can be Sample 2, etc.); the Sample Assignments column reflects the current mapping.
- A test with no assignment is flagged so nothing is collected-but-unmapped.
- **v1→v2 refinement needed:** the mockup's popover choice and multi-sample mapping must be re-specced and re-mocked (the v1 build drifted to forcing tests at step 1 and may auto-assign). This is Reagan's Story 3.

### 4.2 Environmental
- **Stages:** Enter Order → Label & Store → QA Review (no Collect stage).
- **Enter Order:** Sampling Site (registry search, **required**), applicable Compliance Standards (**required**), default collection conditions (collection method — **optional**, water/ambient temp, weather, preservation), GPS/geolocation, per-sample manifest (container), "lab performed sampling", SOP max holding time. Requester = Requesting Organization + Requestor contact (see §5). Required: see §7.

### 4.3 Vector
- **Stages:** organism-based order entry → (downstream) species identification & pool deconvolution at Results › Vector Identification.
- **Enter Order:** Sampling Site (**required**), trap/collection metadata, organism/pool fields; no compliance-standards block, no GPS manifest. Program is **optional**. Vector Field Survey Program (OGC-779) interplay applies. Requester = Requesting Organization + Requestor contact (see §5). Required: see §7.

---

## 5. Field behaviour rules (corrected)

- **Sample type & requested tests are OPTIONAL pre-population at step 1.** Intent: reception holds the order form (and maybe the samples) and *may* log sample/tests at Enter Order so the Step-2 collector only **confirms** them rather than re-entering. The order can be saved/advanced without sample or tests selected at step 1. (Fixes G5/G6; aligns with v2 ORD-1b.)
- **Quantity is blank by default and optional** (fixes G7). No hardcoded default of 1.
- **Unit of measure** derives from the test catalog where available; a blank UOM must not error the save. Only when a quantity is explicitly entered should a UOM be required (fixes G8).
- **Label printing is optional** to advance (fixes G10).
- **Storage assignment is optional** to advance. If the user does nothing, unassigned samples are processed immediately — **skipping storage must NOT require any click** (no forced "Skip storage" action) (fixes G10).
- **QA checklist is advisory by default** and only gates Submit when the corresponding configuration option is enabled (Samuel's setting). When enabled, checklist items are conditional on the order (e.g., "Storage assigned" is not required when storage was skipped). (Fixes G11; aligns with v2 BR-007 "advisory, not blocking.")
- **Required fields are configuration-driven**, honouring the existing Order Entry / Patient Entry configuration (the same ~14 Order Entry + 8 Patient Entry properties) via the **same API** as the legacy order form. Admins set which fields are required/shown in Admin → General Configuration → Order Entry configuration; the new workflow must not hardcode its own required set.
- **Ordering Site and Provider are required** for clinical orders and are respected exactly as in the legacy form — OpenELIS breaks downstream without an ordering site/provider.
- **Program is not mandatory** (G2 resolved): it defaults to the "no program" (Routine Testing) program; Save & Next must not be gated on Program. (Applies to Clinical and Vector.)
- **Requester model (Environmental / Vector):** the requester is the **customer requesting the test** — a **Requesting Organization** (the company) plus a **Requestor** (the contact person for the order). At least one of the two is required (possibly both — confirm); the current UI does not make this distinction clear and should. **Also capture the requestor's contact details (phone, email).** (Clinical uses Site + Provider instead of the org/contact pair.)
- **Free-text vs. restricted controlled lists** (per Order Entry configuration): the existing option that **allows or restricts free-text entry** of requester / organization / provider / site still applies. If **restricted**, the user must select from the existing DB list; if **allowed**, the user may type a new value, which is then **saved and persisted in the DB for future reuse**.
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
