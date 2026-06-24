# Handoff — UAT steps → User-manual authoring

**Purpose.** Let the UAT-steps thread hand verified workflows to a manual-authoring run so user-manual
pages can be built (and kept fresh) in parallel. The UAT thread owns *what the verified steps are*;
the `openelis-user-manual` skill owns *turning them into a doc + screenshots + a drift contract*.

## The pipeline
1. **UAT thread** gathers and verifies the real steps for a feature on a live instance, and fills in a
   handoff block (below) — one per feature.
2. **Manual run** (a separate chat, can run in parallel per feature) invokes the `openelis-user-manual`
   skill, which: captures screenshots/video via `openelis-screenshots`, builds the Word doc (overview +
   numbered steps + cropped images), emits a Confluence storage XHTML + `images/`, **publishes a draft
   to Confluence with the screenshots embedded** (`docs-manual/publish/confluence-publish.py` →
   parent 1189609473 "New User Manual sections to be verified", space OG), and registers a **drift
   contract** in `OpenELIS QA/docs-manual/contracts.json`.
3. **Drift watch** (`openelis-docs-drift-weekly`, Mondays 07:36) re-checks every contract and updates
   `docs-manual/drift-report.json`; the **OpenELIS Doc Freshness Tracker** artifact shows per-section
   UI drift + per-feature manual-page staleness.

> Parallelize the *drafting*, but **serialize the capture** step — the Playwright harness uses one
> browser + one stored auth on Casey's Mac; concurrent capture runs collide on session/auth and create
> interleaved demo data. Doc-building (docx) parallelizes freely.

## The one rule
**Document only what is BUILT and verified on a live instance — never spec-only behavior.** Example
already caught: environmental *compliance-standard-driven test suggestion* is designed but NOT built, so
the manual says "select the applicable standard" with no auto-suggest claim. If a step only works in the
spec, omit it or label it clearly as not-yet-available.

## Per-feature handoff block (copy one per feature)
```
### <Feature / workflow name>
# "At a glance" job-aid header inputs (lead the page; access stays a soft "typical role + configurable")
- purpose (the task in the user's terms):
- output / what you end up with:
- who typically does this (role only — access is permission-based & configurable; no exact matrix):
- materials/data needed before starting:
# capture + verification
- capability id (from features-inventory):
- instance + base URL:           # clinical → testing.openelis-global.org · env/vector → indonesiademo.openelis-global.org
- route(s):                      # see openelis-work/skills/openelis-screenshots/routes.md
- verified step sequence:        # ordered, imperative; call out non-obvious GATES
    e.g. "Label & Store: Save & Next unlocks only after Print All Labels + skip/assign storage"
- required fields + demo data to use:
- on-load UI anchors per route:  # headings/labels/buttons the manual depends on (drift contract)
- BUILT vs SPEC flags:           # anything documented that is NOT actually built today
- ui source paths (optional):    # frontend files/dirs that render this screen (for commit-based recheck)
- definition of done:            # what the finished page must show
```

## Backlog — what still needs manual pages
- **Live source of truth:** the Doc Freshness Tracker → "Doc coverage" card lists *shipped capabilities
  with no manual page yet* (currently ~24). Pull the backlog from there, not a static list here.
- **Already captured & contracted (16 sections in `contracts.json`)** — these have screenshots and a
  drift contract; UAT only needs to flag step changes, not start from scratch: add-patient,
  environmental-order-results, results-entry, result-validation, order-entry, patient-order-enhancements,
  barcode-labels, electronic-lab-notebook, electronic-signatures, sample-shipment-referral,
  sample-storage-management, analyzer-framework, analyzer-file-import, westgard-qc, nce-capa, eqa,
  organizations-management. Two of these (add-patient, environmental-order-results) are full Word drafts;
  the rest are tier-1 (route + anchors) ready to deepen into full manual pages.
- **Priority suggestion:** lead with shipped/production capabilities that lab staff use daily and that
  have no manual yet; defer in-development and "designed — ready to build" items.

## Training materials (related, but not per-feature yet)
The training archive (Google Drive `1FTFNxqQEg…`, linked in the inventory `meta.training_folder`) is
organized by **cohort/country + audience** (End User / Super User Admin / Leadership / TOT), not by
feature — and much of it is **"OpenELIS Classic" (old JSP UI)**, i.e. stale against the React app.
So:
- Treat the Classic end-user decks as the **stale baseline to replace**, not a source to map to.
- **New per-feature training assets should be derived from the user-manual pages** this pipeline
  produces (same verified steps + screenshots), so manual and training stay in lockstep.
- Don't populate per-capability `docs.training_doc` from this folder; it's linked at the program level
  only until materials are reorganized by feature.

## Pointers
- Skills: `openelis-work/skills/openelis-user-manual/`, `openelis-work/skills/openelis-screenshots/`
- Routes: `openelis-work/skills/openelis-screenshots/routes.md`
- Contracts + drift report + freshness feed: `openelis-work/docs-manual/` (and `OpenELIS QA/docs-manual/` on the Mac)
- Capture harness: `OpenELIS QA/` (run on Casey's Mac; node via nvm)
- Tracker artifact: "OpenELIS Doc Freshness Tracker" (Cowork)
