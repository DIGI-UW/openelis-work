# Order Entry — Developer Reference (single source of truth)

**Purpose.** The order-entry build drifted from the spec and accumulated unintended gates and bugs. This is the **one document to anchor on** when working on order entry — for Reagan, anyone helping, or a coding agent. If a change to order entry isn't consistent with this doc, don't make it. Epic: **OGC-1066** (stories OGC-1067–1073).

**How to use.** Sections 1–3 are the north star (what it must be). Section 4 is the current-vs-required delta with exact evidence. Section 5 is the anti-drift guardrails. Section 6 maps everything to the stories. Source docs (in `OpenELIS Feature Design/`): `order-entry-FRS-v3-three-workflows.md`, `clinical-order-entry-GATES.md` (gate register + spec crosswalk + live captures), `order-entry-three-domain-crosswalk.md`, `order-entry-mockup-vs-delivered-UX-drift.md`. Original spec/mockup in the gallery `designs/sample-collection/` (`sample-collection-redesign.md`, `sample-collection-redesign-mockup.html`).

---

## 1. Target model (north star)

- **Three SEPARATE domain workflows** — Clinical, Environmental, Vector — on one **shared wizard framework**. Not one toggled workflow. Each has its own route and Menu action (already true: dashboards at `/order/clinical`, `/order/environmental`).
- **Option C linkage:** reception records the *requested tests* at Enter Order; the *collector* turns tests into samples at Collect. Ordering (tests) is separate from "what to draw" (tubes).
- **Configuration-driven, not hardcoded:** required/shown fields come from the existing **Order Entry / Patient Entry configuration** (Admin → General Configuration) via the **same API as the legacy order form**. Gating, required fields, and behavior must not be hardcoded in the new UI.
- **Bring the build back to the spec** — the spec already describes the looser, intended behavior. Most "fixes" are *removing* gates the build added, not adding new ones.

## 2. Per-stage behavior (authoritative)

**Stages:** Clinical = Enter Order → **Collect** → Label & Store → QA Review. Env = Enter Order → Label & Store → QA Review (no Collect). Vector = organism-based entry → downstream species ID / deconvolution.

**Enter Order**
- Required (clinical): Lab Number + Patient + **Site + Provider** (OpenELIS breaks downstream without an ordering site/provider). **Program is NOT mandatory** (defaults to the "no program"/Routine Testing program).
- **Ward / Unit / Department (clinical only):** a **sub-unit of the selected ordering facility** = where the patient is (ICU, Maternity, etc.; maps to legacy `requesterDepartmentId`). Disabled until a facility/site is selected; then enabled and populated from that facility's subunits. Optional. Env/Vector do not have it (no patient).
- **Sample Type and Tests are OPTIONAL pre-population** — the order can be saved/advanced without them; they're confirmed/entered at Collect. (Today the build wrongly requires them.)
- **Test/panel search is by name OR code (clinical)** — reception can find a test from just the name on the requisition (no code guessing). **Sample type is not required to add a test at Enter Order**; sample-type disambiguation happens at Collect (Option-C, §2). Don't gate test selection on choosing a sample type first.
- **Requester element — preserve the full legacy field set; do NOT drop fields.** The legacy `SamplePatientEntry` "Add Order" step captures: Site Name*, Requester search, Requester First Name*, Last Name*, **Phone**, **Fax**, **Email**, requester **Department**, and a "Remember site and requester" toggle. The v1 build dropped **email** (and fax). **Surface Email (and fax) for all three domains.** Env/Vector frame the requester as **Requesting Organization (company) + Requestor (contact person)** (≥1 required) using this same element; Clinical frames it as the ordering **Provider**. It is the **exact same element across Env and Vector** (Vector relabeled away from "doctor").
  - **Capture ALL fields for both the Organization and the Requestor.** Surface the **full field set**, not just a name: the **Organization**'s full contact set (name, address/city, phone, fax, email, and any other Organization schema fields), and the **Requestor**'s First/Last Name, **Phone, Fax, Email, Department** — at parity with the clinical requesting provider.
  - **Search & store exactly like the requesting provider.** Type-ahead against the existing registry, select to bind, values persist for reuse — the **same search/store mechanism** for Provider (clinical) and Org + Requestor (env/vector).
  - **Edit-lock on found records.** A record pulled from search is **read-only until the user clicks "Edit details"** — prevents an accidental keystroke from persisting a change to a saved org/provider/contact. **Newly-added** records start editable. Applies to facility/site, organization, provider, and requestor across all three domains.
  - **Free-text vs. restricted** is config-driven (Order Entry config): restricted → pick from DB; allowed → free-text, persisted for reuse.
  - **Add-new gated by admin.** When config allows, the search list offers **"+ Add new facility/organization"** and **"+ Add new requestor/contact"** to create inline (then persisted). When restricted, that affordance is **shown disabled with a clear "adding new entries is disabled by the administrator" message** — never silently hidden. Applies to facility/site, organization, and requestor/provider across all three domains.

**Collect** (clinical)
- The collector confirms/enters samples. **Quantity is blank by default** (never pre-fill `1`); UOM derives from the catalog and a blank UOM must not block save.
- **Sample & test selection at Collect (no step-1↔step-2 matching — decision 26 Jun):** there is **no "Assign to" mapping**. The collector uses the **standard OpenELIS Add-Sample UI**: per sample a Sample Type picker + optional Filter by Lab Unit + Order Panels search/checklist + Order Tests search/checklist (search by name or code); **Add Sample** for a separate draw. **Step 1 test entry is optional pre-population, unlinked** — it pre-fills/pre-checks this UI as a convenience; the collector confirms/edits/adds and is the authority on what was drawn. Matches the current shipped OE interaction. (Both the v1 popover and the interim "Assign to" menu are dropped. See FRS §4.1.1.)
- Collection/Received dates must serialize in the **configured Date locale** and reflect the field value (see §4).

**Label & Store**
- Printing labels and assigning storage are **optional** to advance. **Skipping storage requires no click.** Save & Next is never conditioned on print/storage.

**QA Review**
- **Host Samuel's configurable QA checklist here.** The QA Review page must give a clear place (a "QA Checklist" section, above the audit trail) to the **custom QA checklist QA admins build** in the **QA Configuration admin page** (Samuel's QA-gate work). The item set, order, and each item's **Required (gate) vs Advisory** flag are configuration — not hardcoded. An item gates **Submit** only when marked **Required (gate)**; if none are required, the checklist is advisory and never blocks. Items are **conditional on the order** (hide "Storage assigned" when storage was skipped — don't fail it). Per-item reviewer note. Per domain.

## 3. Cross-cutting requirements
- **Validation is non-destructive and recoverable** — inline field errors, correctable in place; never a fatal/unrecoverable error. **Surface the real server fieldError** (not a generic "Save failed" toast).
- **Clean state:** a new Add Order starts blank; no Site/Provider/Program/sample leaks from a prior in-session order.
- **Every field carries instructional helper text** (guide, don't just present). Restore the mockup's dropped microcopy and extend everywhere.
- **Localization:** every label via i18n keys (EN + ID; English source of truth). No hardcoded single-language strings (e.g., "Laporan Hasil").
- **Visibility & scoping:** a user sees order-entry actions for their lab unit's domain(s), and scoping is **finer than domain — it follows the assigned lab unit(s)**. A Hematology-only user sees only Hematology orders (lists, dashboards, worklists), not all Clinical orders. **Dashboards are separate per domain**, each list filtered to the user's unit(s). Admins see all units/domains.
- **No in-form domain split:** order entry is three **separate** workflows (Add Clinical / Environmental / Vector Order) with separate routes and dashboards. There is **no three-way "Sample Category" toggle** inside a single form — that legacy split is removed.
- **Env collection method is optional** (no required `*`); like the rest of the env defaults, it's a convenience, not a gate.
- **CSV bulk intake is Env + Vector only** — and **deferred to V2 / candidate community contribution (OGC-1075), not V1.** Template download + upload with a validating preview, for batch intake of pre-collected samples. **Removed from Clinical** — it doesn't fit the patient-by-patient clinical workflow. Don't add CSV import to the clinical wizard.
- **Pages load at the top** (not scrolled to the bottom).

## 4. Known defects — current → required (with evidence)

| Defect | Current (captured live, build v3.2.1.10) | Required | Story |
| :-- | :-- | :-- | :-- |
| **Collect date serialization (CRITICAL)** | `POST rest/SamplePatientEntry` → **400** `fieldErrors:[{field:"sampleXML",message:"Field sampleXML date is not in a valid date format"}]`. sampleXML posts `date='06/25/2026'` (MM/DD) while the rest of the payload uses configured DD/MM (`currentDate="25/06/2026"`). Fails when day-of-month > 12. **Clinical-specific** — Vector posts the same date and returns 200; Env uses a different save path. | Serialize sampleXML date attrs in the configured Date locale (Admin→General Config→Site Information), like the rest of the payload. | OGC-1067 |
| **Date field not bound (CRITICAL, unrecoverable)** | With the Collection Date field showing `01/06/2026`, the payload still posts `06/25/2026` — editing the field doesn't change what's submitted → a failed order can never save. | Submitted sampleXML date must reflect the Collection Date field and update on edit. | OGC-1067 |
| **Quantity default (CRITICAL — data integrity)** | Quantity pre-fills `1`, persisting a false measurement. | Blank/null by default; persist only an entered value. **Null is correct; 1 is NOT.** | OGC-1067 |
| **Error swallowed** | Generic "Save failed" toast hides the server fieldError. | Surface the real field-level error. | OGC-1067 |
| **Sample/Tests required at Enter Order** | Save & Next disabled until Sample Type + ≥1 Test. | Optional pre-population (ORD-1b). | OGC-1068/1069 |
| **Label & Store forced** | Must click Print All Labels + a storage choice to advance. | Both optional; skip needs no click. | OGC-1067 |
| **QA checklist hard gate** | 4-item checklist hard-blocks Submit. | Advisory; config-gated. | OGC-1067 |
| **Stale requester** | Site/Provider leak into a new in-session order and don't function. | Reset on new order; bind correctly. | OGC-1067 |
| **Scroll (CONFIRMED still present)** | Stages still load scrolled to the bottom in the current real build — this defect persisted into the shipped design, it is not just historical. | Every stage entry loads at the **top** of the page and focuses the first actionable field. | OGC-1067 |
| **External-order queue missing** | Order Dashboard has only the local order list — no Incoming External Orders/accept queue. | Build the EMR/FHIR incoming-order acceptance queue. | OGC-1073 |
| **Sample↔test linkage half-built** | Multi-sample shown as a hardcoded static example; chips don't offer add-vs-new choice. | Real Option-C interaction (§2). | OGC-1069 |

## 5. Anti-drift guardrails (do / don't)
- **DO** read required/visible fields from the Order Entry config + the legacy API. **DON'T** hardcode required fields or gates in the new UI.
- **DO copy the legacy form's auto-fill implementation.** Several auto-fills are legitimate **Order Entry Configuration** options (Admin → General Configuration) and the **old form already implements them correctly** (e.g., default site, auto-filled received date, etc.) — copy that behavior rather than reinventing it. **NOTE:** the quantity-default-of-`1` is NOT one of these config auto-fills — it's a bug (null is correct). Keep config-driven auto-fills; drop the hardcoded quantity default.
- **DON'T** add any gate that isn't in the FRS (no forced print, no forced storage, no hard QA, no mandatory sample/tests at step 1). The spec is looser than the build — match the spec.
- **DON'T** prefill data the user didn't enter (no quantity `1`, no defaulted dates that aren't the field value).
- **DON'T** swallow server errors — show the real fieldError.
- **DO** keep the three workflows separate but fix shared-framework bugs once (date, quantity, gates, scroll, recovery) — confirm each on Clinical, Env, and Vector (behaviour differs: the date 400 is clinical-only).
- **DO** route every string through i18n and give every field helper text.
- When unsure, check this doc + the FRS v3; don't invent.

## 6. Story map (epic OGC-1066)
- **OGC-1067** — Step-1 bug fixes (date serialization + binding, quantity default, recoverability/clean-state, de-gate print/storage, advisory QA, scroll, surface errors). *Reagan, High. Do first — it currently blocks clinical orders.*
- **OGC-1068** — config-driven & per-domain required fields.
- **OGC-1069** — Step-1→Step-2 linkage (Option C v2); design prereq: FRS + mockup v2.
- **OGC-1070** — per-domain navigation & domain-scoped visibility.
- **OGC-1071** — field-level instructions / UX copy (design).
- **OGC-1072** — localization (i18n); ties to OGC-607.
- **OGC-1073** — Incoming External Orders acceptance queue (EMR/FHIR).

Dependencies: Test Catalog lab-unit→domain assignment; Samuel's QA-gating config option; OGC-391/392 (RBAC); FRS v3 ratified as baseline.
