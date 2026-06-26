# UX-Drift Report — Order-Entry Mockup vs Delivered Build (v3.2.1.10)

Compares the intended UX of `designs/sample-collection/sample-collection-redesign-mockup.html` (+ its design critique) against the delivered 4-stage clinical wizard verified live this session. Companion to the gate register, FRS v3, and the three-domain crosswalk. Feeds epic OGC-1066.

**Headline:** the build reproduced the mockup's **four-stage skeleton** and the **Collect test→sample assignment** concept, but **inverted its interaction philosophy**. The mockup was a forgiving, free-navigation, optional-everything tool; the build is a rigid, gated, mandatory-everything checklist. The biggest drifts are all hardening of things the mockup left soft (step-1 optionality, label/storage gating, advisory QA) plus the loss of the mockup's safety nets (auto-save, scan feedback, draft state).

## Drift table

| Area | Mockup intent | Delivered | Severity | Note |
|---|---|---|---|---|
| Overall step structure | 4 steps: Enter Order → Collect → Label & Store → QA Review | Identical 4 stages | Match | Skeleton landed cleanly. |
| Navigation model | Wizard-with-shortcuts — every step clickable, free jumping | Linear gated wizard; Save & Next disabled until conditions met | Major | Non-linear jumping not delivered. |
| Step-1 sample/test optional | *"Sample and test selection is optional at this step. Tests and sample type can be specified later during collection."* | Save & Next disabled until Lab#+Patient+Site+SampleType+≥1 Test | Major | Direct contradiction; build fuses ordering with what-to-draw. |
| Step-1→Step-2 linkage | Step-1 tests flow into Step-2 "Requested Tests" table; assignment happens at collection via popover | Requested Tests table w/ Compatible Sample Types chips + Sample Assignments column | Minor | Concept carried; drift is tests forced at step 1. |
| Collect test↔sample mapping | Click `+ Plasma` chip → inline popover "Add to Sample 1" vs "New Plasma sample (separate draw)"; multi-sample | Table + chips + Sample Assignments present | Minor→Major | Confirm the add-to-existing-vs-new-draw popover shipped; if chips auto-assign, the explicit-choice safeguard was lost. |
| Collect manifest fields | Sample Type, Quantity+UOM (from catalog), Conditions, Date/Time/Collector (optional), Received (auto, editable) | Same field set | Match | Landed well. |
| Collection Date optional | *"Collection Date (optional — filled when specimen is physically collected)"* | Collect save 400s on date-format bug | Major (defect) | Build can't reliably save the step. |
| Informed Consent | Not in mockup | Build added a consent checkbox on Collect | Minor (added) | Reasonable; not from mockup. |
| Label printing gating | Print Labels is a non-gating action on Steps 1 & 3 | Step 3 forces "Print All Labels" to advance | Major | Mockup let you skip; build mandates. |
| Storage gating | Inline, optional, commits on Save: *"assigned when you click Save… No separate Assign button needed."* | Forces a storage choice; adds a "Skip storage" toggle | Major | Build made storage mandatory then invented a Skip toggle — a tell that gating was added late. |
| Refer Out | Single Step-1 checkbox | Added a Step-3 Refer Out/Subcontract table | Minor (added) | Richer, but net-new. |
| QA Review | 4 **advisory** status cards; Approve free; Reject → Return-to-Step dropdown | Fixed 4-item checklist that **hard-blocks** Submit | Major | Advisory → mandatory gate. |
| Validation / errors | Auto-save every 30s; explicit Draft state; inline scan banners | Generic "Save failed" toast hides server errors; no auto-save | Major | The critique's #1 P0 (auto-save + specific errors) not delivered. |
| Layout / scroll | Top → stepper → context card → sections | Pages load scrolled to the bottom | Major (defect) | Breaks orientation/anchor. |
| Barcode scan bar | Persistent Order Lookup bar w/ green/red feedback; routes into the right step | Not observed | Major (dropped?) | Signature feature — confirm. |
| Order Dashboard (Step 0) | Workflow hub + Incoming External Orders (EMR/FHIR) acceptance queue | Not in clinical-wizard scope | Major (dropped/deferred?) | Mockup's entry point. |
| CSV bulk import | Step-2 batch intake w/ templates + validating preview | Not observed | Major (dropped?) | Confirm deferred vs cut. |
| NCE (Non-Conforming Event) | Structured inline reporter (sample- + order-level), replaces legacy Rejected? dropdown | Not confirmed | Major (dropped?) | Confirm kept vs reverted. |
| Domain toggle | 3-way Clinical/Env/Vector toggle in "Both" labs | Delivered as 3 separate routes | Match (by other means) | Consistent w/ domain-scoping model; not a drift. |

## Top UX drifts to call out (by user impact)
1. **Step 1 went from "everything optional" to "sample type + test required."** Blocks registering an order before a specimen exists — the mockup's explicit promise.
2. **No auto-save / dirty-state; opaque "Save failed" toast** (hides the date-format 400). Critique's P0; data-loss + debuggability risk.
3. **Label printing and storage are now hard gates** (mockup made both optional; the Skip-storage toggle exists only because storage was made mandatory).
4. **QA Review flipped advisory → hard-blocking checklist.**
5. **Collect date-format save bug breaks the step the redesign exists to serve.**
6. **Pages load scrolled to the bottom** — defeats the intended orientation.
7. **Signature features dropped/unconfirmed:** persistent scan bar, Order Dashboard + external-order queue, CSV bulk import, structured NCE.
8. **Add-to-existing-vs-new-draw sample popover** (explicit-choice safeguard) needs verification.

## What the build got right
- Four-stage structure landed exactly.
- The Collect "Requested Tests" table (Test/Panel · Compatible Sample Types · Sample Assignments) preserved the mockup's best idea — making the test↔sample mapping visible.
- The per-sample collection manifest carried the full field set.
- Domain handling via separate routes is consistent with the domain-scoping model.

## Verification of the "dropped?" items (25 Jun — Casey + live captures)

| Feature | Status | Source |
| :-- | :-- | :-- |
| Add-vs-new-draw sample choice / multi-sample | **Half-delivered, confusing, oddly hardcoded** — the Collect "Multi-Sample Collection Example" is a **static block** ("Plasma (Sample 1) + Plasma (Sample 2) = Creates separate tubes for each type"), not a real interactive add-vs-new popover. Needs the v2 refinement (FRS §4.1.1). | Casey + live (static example block confirmed in Collect page text) |
| Persistent scan bar | **Present** — a "Scan barcode or enter lab number…" field renders on every wizard stage. Green/red feedback + routing behaviour **not yet verified**. | Live (page text, all stages); behaviour unconfirmed |
| Order Dashboard | **Present (live-confirmed).** Per-domain (`/order/clinical`, `/order/environmental`) — filterable order list (Status, Priority, date From/To; columns Lab Number / Patient / Facility / Priority / Progress / Last Updated / Action), a "New Order" button, and a scan-barcode field. Confirms the per-domain nav model. | Live (25 Jun) |
| External-order acceptance queue (Incoming External Orders / EMR-FHIR) | **NOT delivered (live-confirmed).** The clinical Order Dashboard shows only the order list — no incoming/external-order queue or accept action. The mockup's external-order acceptance queue did not ship. | Live (25 Jun) |
| CSV bulk import | **Did NOT land.** | Casey + no evidence in build |
| Structured NCE | **Delivered** — "Report NCE" action present on QA Review; Casey confirms the structured NCE landed. Depth (category/type/severity) not re-verified live. | Casey + live ("Report NCE" on QA page) |
| QA reject → return-to-step target | Not verified. | — |

**Resolved live (25 Jun):** Order Dashboard present (per-domain); external-order acceptance queue NOT delivered. **Remaining low-priority confirmations:** scan-bar feedback/routing behaviour; NCE structured-field depth (category/type/severity); the QA reject-return-to-step target.

**Caveat:** the above mixes live confirmation with Casey's recall; items marked "to verify" need a clean live pass.

## Localization correctness (add to the wrapup)

Labels must render in the **selected locale**, not a hardcoded language. Example: **"Laporan Hasil"** (and "Sertifikat Hasil Uji") are hardcoded Indonesian and show even under an English locale — meaningless to those users; conversely English strings leak into the Indonesian UI. Every order-entry string should route through an i18n key (EN + ID; English as source of truth). Audit all three domains, especially the Env compliance-report labels. Ties to OGC-607 (1,700+ untranslated keys not syncing from Transifex). Tracked as Epic OGC-1066, Story 6.
