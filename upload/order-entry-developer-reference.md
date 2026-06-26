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
- **Sample Type and Tests are OPTIONAL pre-population** — the order can be saved/advanced without them; they're confirmed/entered at Collect. (Today the build wrongly requires them.)
- Requester (Env/Vector) = **Requesting Organization (company) + Requestor (contact person)**, ≥1 required; capture phone + email. Honor **free-text vs. restricted** config (restricted → pick from DB; allowed → free-text, persisted for reuse).

**Collect** (clinical)
- The collector confirms/enters samples. **Quantity is blank by default** (never pre-fill `1`); UOM derives from the catalog and a blank UOM must not block save.
- **Sample↔test mapping (Option C, v2):** ordered tests show with Compatible Sample Types chips; clicking a chip prompts an **explicit choice — "add to existing Sample N" vs "new sample (separate draw)"** (never silent auto-assign); supports multiple samples; unmapped tests are flagged. (Today this is half-built — the multi-sample block is a hardcoded static example.)
- Collection/Received dates must serialize in the **configured Date locale** and reflect the field value (see §4).

**Label & Store**
- Printing labels and assigning storage are **optional** to advance. **Skipping storage requires no click.** Save & Next is never conditioned on print/storage.

**QA Review**
- The checklist is **advisory** and only gates Submit when a **configuration option** is enabled (Samuel's setting). When on, items are conditional on the order (don't require "Storage assigned" when storage was skipped).

## 3. Cross-cutting requirements
- **Validation is non-destructive and recoverable** — inline field errors, correctable in place; never a fatal/unrecoverable error. **Surface the real server fieldError** (not a generic "Save failed" toast).
- **Clean state:** a new Add Order starts blank; no Site/Provider/Program/sample leaks from a prior in-session order.
- **Every field carries instructional helper text** (guide, don't just present). Restore the mockup's dropped microcopy and extend everywhere.
- **Localization:** every label via i18n keys (EN + ID; English source of truth). No hardcoded single-language strings (e.g., "Laporan Hasil").
- **Visibility:** a user sees order-entry actions for their lab unit's domain(s); admins see all three.
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
| **Scroll** | Stages load scrolled to bottom. | Load at top. | OGC-1067 |
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
