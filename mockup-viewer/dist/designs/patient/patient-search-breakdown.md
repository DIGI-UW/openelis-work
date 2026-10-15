# Patient Search (Shared Panel) — Story Breakdown

**Mockup:** `patient-search-mockup.jsx`
**FRS:** `patient-search-frs-v1.md` (v1.2)
**Preview:** `patient-search-preview.html`
**Pipeline assumption:** Claude Code (agentic) implementer, so slices are sized to **one reviewable PR each** (D-026); story points are shown for human planning only.
**Total slices:** 4 in this Epic + 2 owned by other epics
**Total points (this Epic):** 23
**Sprints required (estimate, human team):** 2

> This guide is a **non-binding suggestion**. The developer owns the real breakdown. Every slice below is independently shippable, dependency-ordered, and covered by FRS acceptance criteria.

## Handoff ticket (Epic)

**Title:** Patient search: one search box, stable results, registry results that never block
**Type:** Epic — three backend additions (single-term search parameter, source-scoped requests, identifier types exposed to the client), a shared component with eight consumers, and at least three PRs. Not one screen, not one PR.
**Description summary:** Redesign the shared patient search panel so Reception finds the right patient from whatever identifier they have in hand, with local results that render at once and never move, registry results that append beneath, and shared identifiers flagged.
**Parent / linked program epic (optional):** to confirm with Casey (no obvious umbrella; candidates: none, or the RBAC revamp epic for the Merge doorway only)
**Labels (proposed):** `global`, `patient`, `reception`, `accessibility`, `client-registry`
**Contract:** to confirm with Casey

---

## v1 — "Find a patient with one search box, and trust the rows"
**Sprint target:** 20 points · **Actual:** 13 points · **PRs:** 2

| Story (what the user can do) | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| Reception types one identifier, lab number or surname, presses Enter, and sees local matches without waiting on anything else. Includes the route-synced Search / New Patient switcher on `/PatientManagement` and the clinical Add Order step, the configuration-driven helper text, the demographics refinement accordion with label-bearing tags, skeleton loading, the pre-search and no-match empty states with Create new patient, and the local-search error state. Backend: single-term `q` parameter expanded over the Lucene index (D-1); enabled identifier types exposed to the client (D-2). | 8 | FR-1 to FR-12, FR-25, FR-26, FR-30 to FR-33 | localization `patient.search.*` (input, refine, empty, error keys); Reception role; External Search button and CR toggle removed (FR-12) |
| Reception can tell the Sebbys apart: rows are fixed height, photos fill in after the table settles, identifier columns follow configuration (National ID, Health ID, External ID, and any others enabled), Mother's name and Contact phone are shown, rows sharing an identifier carry the Shared ID tag with its tooltip, merged rows are tagged and unselectable, source tags recoloured. | 5 | FR-13 to FR-16, FR-18 | localization column and tag keys; style-guide casing normalised (D02/D56) |

**PR boundary rationale:** PR 1 is "the form and the request"; PR 2 is "the table". Each is reviewable in one sitting and the first is usable without the second (the existing table renders behind the new form until PR 2 lands).

## v2 — "Registry results arrive without blocking, and duplicates fold"
**Sprint target:** 20 points · **Actual:** 8 points · **PRs:** 1

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| When the administrator has enabled a client registry or external source, every search queries it in parallel; its rows append beneath the local table in a labelled group with an inline loading line; a registry hit matching a local patient by FHIR identifier folds into the local row as "In registry"; registry-only rows keep Import patient; timeouts show a status with Retry and never disturb local rows; the three registry-aware empty states, including withholding Create new patient while the registry is pending and flagging a patient created after a registry failure. Backend: source-scoped requests and FHIR identifier on the registry response (D-3); optional "created without registry check" marker (D-6). | 8 | FR-19 to FR-24, FR-27 to FR-29 | localization external and empty keys; admin configuration read only (D-022), no user control |

## v3 — "A shared identifier is a doorway to Merge"
**Sprint target:** 20 points · **Actual:** 2 points · **PRs:** 1 (small)

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| A user who can open Patient Merge clicks the Shared ID tag and lands in Merge pre-filtered to that identifier value; everyone else sees the tag with no link. Backend/Merge: accept an identifier pre-filter on the Merge route (D-5). | 2 | FR-17 | follows Merge's existing gate; inherits the RBAC-revamp capability when it lands (D-8) |

v3 totals 2 points and could fold into v2 if the Merge route change is trivial; kept separate because it touches the Merge feature's code.

## Owned elsewhere (declared dependencies, not tickets in this Epic)

| Slice | Owner | FRs |
|---|---|---|
| The OGC-354 four-step order entry patient step adopts `PatientSearchPanel` (with New Patient in the clinical workflow only) in place of `PatientSearchSection.jsx` | OGC-354 Sample Collection Redesign | FR-34, FR-4 |
| Patient Merge adopts `PatientSearchPanel` (search-only) in place of `PatientSearchPanel.tsx` in `patientMerge/` | Patient Merge | FR-34 |

Both should be filed as one story each in their owning epics once this Epic exists, with an "is blocked by" link to v1 here.

## Coverage check

- Every FR from the FRS appears in at least one slice: FR-1 to FR-33 in v1 to v3; FR-34 owned elsewhere and declared. **Yes.**
- Every UI element in the mockup is built by at least one slice: ContentSwitcher, Search + helper, refinement accordion and tags, skeleton, empty states, error notification (v1 PR 1); results table, avatar, identifier columns, Shared ID, Merged, source tags (v1 PR 2); registry group, In registry tag, Import, timeout notification (v2); Shared ID link (v3). **Yes.**
- Every slice is titled and scoped around user value, not a technical layer: **Yes** (backend additions ride inside the user-facing slice that needs them).
- Cross-cutting concerns folded in: localization per slice **yes**; access per slice **yes** (Reception throughout; Merge gate in v3).
- Forward dependencies: none. v2 needs v1; v3 needs v1 PR 2; nothing needs a later slice.
- Docs impact (Pass N): verify during ticket creation whether `docs-manual/contracts.json` has a patient management page; if so the Epic's Documentation line says it is re-captured.
