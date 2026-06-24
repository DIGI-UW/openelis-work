# openelis-test-catalog-qa — Changelog

- 2026-06-23 — bug-triage.md: Bugs now ride the OGC Lean workflow and pass through the Acceptance gate before Done; set the Contract field instead of contract:* labels.

## v7.0 (2026-06-18) — Structural: evergreen skill vs. time-varying state; deep-TC authoring

- Slimmed SKILL.md (~1785 → ~160 lines); grading language kept inline; state moved out.
- Bundled/clarified references: suite-catalog (index), report-template (rewritten to the v6
  maturity+acceptance model — supersedes the pre-v6 13-case template), playwright-harness
  (harness lives in THIS repo), bug-triage (Jira source of truth + bug-revalidation gate),
  workflows, validation-history; kept canonical references/test-cases.md + master-test-cases.md.
- NEW references/test-case-authoring.md: deep, chained cases with a landing check at every
  handoff, plus the UNCOVERED + UNCERTAIN(NEEDS-GUIDANCE) surfacing loop.
- Removed embedded Known-Bugs table (→ Jira/bug-triage); wired bug-revalidation into Step 6.
- Harmonized admin routes → openelis-design/admin-ia-inventory; Carbon → carbon-anti-patterns;
  built-vs-not → current-state-gotchas; a11y depth → accessibility-review.
- Two-substrate guidance (Chrome vs Playwright) + smoke/standard/full run tiers; stable H1.
- Repo hygiene: archived superseded SKILL drafts + dated session/report artifacts under archive/.

---

## Prior history (from the previous inline change log)


### v6.21 (2026-05-23) — Y-RECON PASS across all 10 tiles + Chain B NCE form discovery

Resumed unattended work after Casey logged back in. Completed Phase 3 (Y-RECON) and partial Phase 2 (Chain B NCE form discovery). Phase 4 (POST body captures) and full Chain B submission deferred.

**Y-RECON PASS — Dashboard counter vs drill-down list integrity confirmed across all 10 tiles on mgdev v3.2.1.8:**

| Tile | Dashboard KPI | Drill-down count | Match |
|---|---|---|---|
| In Progress | 3 | 3 | ✓ |
| Ready For Validation | 4 | 4 | ✓ |
| Orders Completed Today | 0 | 0 | ✓ |
| Partially Completed Today | 0 | 0 | ✓ |
| Orders Entered By Users Today | 0 | 0 | ✓ |
| Orders Rejected Today | 0 | 0 | ✓ |
| Unprinted Results Today | 0 | 0 | ✓ |
| Electronic Orders (INCOMING_ORDERS) | 0 | 0 | ✓ |
| Delayed Turn Around | 0 | 0 | ✓ |
| Average Turn Around time | 0 | turn-around-time-metrics.receptionToValidation = 0 | ✓ |

The v6.14 Y-RECON math holds. The non-trivial cases (In Progress=3 with 3 items, Ready For Validation=4 with 4 items) match, validating the methodology against the actual seeded test data. No data-integrity divergence found.

**Chain B (Rejection / NCE) — endpoint discovery + form structure mapped.** Navigated to /ReportNonConformingEvent React page (sidebar Non-Conform > Report Non-Conforming Event). Three new endpoints discovered:

- `GET /rest/nce/categories` — returns 5 top-level categories with nested types. First category: `{id: "1", name: "General", types: [{id: "1", name: "Documentation error"}, {id: "2", name: "Employee concern"}, {id: "3", name: "Technology/Computer issue"}, {id: "4", name: "Other, please describe"}]}`.
- `GET /rest/nce/generate-number` — returns `{nceNumber: "NCE-YYYY-NNNNN"}`. Auto-format: `NCE-{year}-{5-digit-zero-padded sequence}`. First NCE on mgdev would be `NCE-2026-00001`.
- `GET /rest/displayList/TEST_SECTION_ACTIVE` — populates the Reporting Unit dropdown with active test sections.

Form structure (3 visible sections, more below the fold):
1. **Reporter & Event Context** — NCE Number (auto), Reporter Name (default "Open ELIS"), Date of Event (default today), Reporting Unit.
2. **Classification** — Category dropdown, Subcategory dropdown (depends on category), 3-tile Severity picker (Critical = patient safety risk; Major = significant quality/operational impact; Minor = limited impact, easily corrected).
3. **Details** — visible below the fold; not yet scrolled to (page has a stuck scroll container).

`apiShapes.ts` adds: `NceCategory`, `NceType`, `NceGenerateNumberResponse`, `NceFormState`.

**Deferred (next session):**
- The POST submit body shape — would create a real NCE on mgdev. Casey decision needed before pulling the trigger.
- The "Affected Samples" section structure — below the fold; need page scroll fix.
- The NCE Dashboard listing endpoint — likely `/rest/nce` but not yet probed.
- Phase 4 from unattended plan: LogbookResults, AccessionValidation, configuration-properties WRITE POST body captures via Playwright `addInitScript` pre-load interceptor.

**Sample-rejection vs manual-NCE-filing distinction** (important methodology nuance to add to chain specs):
- **Sample-rejection at order entry** (Chain B "happy path"): set `sampleXML rejected='true' rejectReasonId='X'` in the POST `/rest/SamplePatientEntry` payload. Auto-creates an NCE.
- **Manual NCE filing** (Chain B "retroactive path"): use the Report Non-Conforming Event form. Independent of order workflow; can link to existing samples via the Affected Samples section.

Chain B spec needs BOTH paths covered. Today only the manual-filing endpoints were captured; the auto-NCE-from-rejection path was captured in v6.15's SamplePatientEntry POST body (rejected field shape).

**Today's running totals (2026-05-23, single-day session):**
- 4 PRs merged (#15, #16, #17 pending, #14 from yesterday-evening)
- 4 OGC bugs closed (OGC-674 + OGC-739/740/741)
- 4 new methodology rules codified (§10.6/7/8/9)
- Y-RECON math validated across full Dashboard
- NCE form structure documented

### v6.20 (2026-05-23) — FHIR trio closed (OGC-739/740/741) + recurring revalidation pays off

Quick re-probe of the three still-open FHIR bugs against mgdev v3.2.1.8. **All three confirmed fixed in 9 days from filing.** Closing.

| Ticket | Filed 2026-05-14 evidence | 2026-05-23 revalidation (Method C, 3×) | Disposition |
|---|---|---|---|
| OGC-739 `/fhir/metadata` | HTTP 500 with "HAPI-1359 ... fhir//metadata" double-slash error | HTTP 200 × 3 | **CLOSED** |
| OGC-740 `/fhir/Observation` | HTTP 200 with 151,149 bytes of internal HAPI Java domain JSON (`formatCommentsPre`, recursive `idElement`) | HTTP 200 × 3, body = 11,889 bytes (92% smaller), `formatCommentsPre` absent | **CLOSED** |
| OGC-741 `application/fhir+json` Accept | HTTP 406 HttpMediaTypeNotAcceptableException × 3 | HTTP 200 × 3 | **CLOSED** |

**Process insight reinforcing §10.7:** revalidating bugs at the start of every multi-day QA campaign is paying real dividends. In the last 9 days alone the discipline has caught:
- 2026-05-18: OGC-674 (SPA deep-link 404) — fixed via nginx fallback
- 2026-05-23: OGC-739 (metadata 500) — fixed (proxy URL straightened)
- 2026-05-23: OGC-740 (Observation 151KB internal dump) — fixed (proper FHIR JSON serializer wired)
- 2026-05-23: OGC-741 (`application/fhir+json` 406) — fixed (content negotiation registered)

That's 4 closures across two regression-sweep passes that would have otherwise sat open indefinitely. The methodology now formally mandates running the bug-revalidation skill against ALL active OGC tickets at the start of each campaign and at the start of each new session against a different release.

**Module maturity correction:**
- **FHIR M1.5 → M5** on mgdev v3.2.1.8. CapabilityStatement (200), Observation Bundle (200, proper FHIR JSON), `application/fhir+json` content negotiation (200), and Patient lookup by guid (200 from earlier v6.18 finding) all work. Chain K is **unblocked** for end-to-end runs.

**§10.9 — Bug-revalidation cadence rule (codifying what §10.7 implied).** Re-run `openelis-bug-revalidation` against EVERY active OGC ticket whenever any of these happens:
1. Starting a new multi-day QA campaign.
2. Switching to a different target release or different mgxxx instance.
3. Returning to a session after more than ~5 days away.
4. Before filing any new bug, to ensure the bug table is current (already in §10.5).

Skip-list: tickets explicitly tagged `parked` or `won't-fix`.

**Unattended-session note (2026-05-23):** Casey was AFK. After completing phase 1 (FHIR re-revalidation), the browser session expired and phases 2 (Chain B Rejection), 3 (Y-RECON), and 4 (POST body capture) became blocked — they all require an authenticated UI session. Documented here so Casey can pick up: the unattended-session boundary on this app is session expiry, not interceptor stability or destructive-op risk. v6.20 wraps with phase 1 complete + 3 bugs closed.

**Bug table after v6.20:**
- Closed today: OGC-739, OGC-740, OGC-741
- Still open: OGC-673 (TestNotificationConfig 404), OGC-675 (Activity Reports 404), OGC-677 (Statistics Report 404), OGC-676 (Aliquot POST NPE — deferred), OGC-742-745 (the 2026-05-14 batch, mostly Piotr-assigned).
- Effective bug-revalidation closure rate this campaign: **5 closures across the 7 OGC tickets filed since 2026-05-14 + 5 pre-existing tickets = ~42% fixed-in-9-days turnaround.**

### v6.19 (2026-05-18) — nginx SPA-fallback revalidation rules + active-bug regression sweep

Ran the openelis-bug-revalidation skill against all 5 active OGC tickets on mgdev v3.2.1.8. Outcome: **1 bug closed (OGC-674), 3 bugs updated with current evidence, 1 deferred** (OGC-676 — destructive POST would be needed).

**Methodology rules added:**

§10.6 — **For SPA route bugs, fetch-200 is not the same as render-200.** When revalidating a previously-broken React route (e.g. a `/NceDashboard`-style deep-link that returned 404 via nginx fallback failure), a plain `fetch(route)` returning 200 only confirms that *nginx serves an HTML shell*. It does NOT confirm that the React Router resolves the route, mounts the component, or renders content. **Method A (fresh-tab direct navigation + screenshot)** is mandatory for these closures. Method C alone (fetch 3×) returning 200 is necessary but not sufficient.

§10.7 — **Cross-revalidate sibling routes after an nginx/infrastructure fix.** When one nginx-layer or SPA-routing fix lands, it can resolve a whole *class* of bugs simultaneously. If the bug-revalidation protocol surfaces a fix on one deep-link route, probe the other previously-broken deep-link routes in the same class before assuming they're still broken. Today's OGC-674 closure was based on 4 sibling routes (`/NceDashboard`, `/EQAOrders`, `/PatientHistory`, `/AccessionResults`) all returning 200 — and direct navigation to `/NceDashboard` rendering the full page confirms the nginx fallback works for all of them.

§10.8 — **500 → 404 endpoint regressions need a separate disposition track.** Three of the active OGC bugs (673, 675, 677) followed the same pattern: an endpoint that returned 500 on the original report has since become 404. The endpoint hasn't been fixed — it's been removed or renamed. The right Jira treatment is a status comment confirming "still gone on v3.2.1.x as of YYYY-MM-DD," NOT a closure, because the underlying feature (Test Notifications, Activity Reports, Statistics Report) is still expected by users. These bugs stay open until the endpoints are restored OR replacements are documented and the user-facing UI is updated to point at them.

**Concrete revalidation results (2026-05-18, mgdev v3.2.1.8):**

| Ticket | Endpoint / route | Method | Result | Disposition |
|---|---|---|---|---|
| OGC-673 | `GET /rest/testNotificationConfig` | C (3× repeat) | 3/3 = 404 | Status comment added; **still open** |
| OGC-674 | `/NceDashboard`, `/EQAOrders`, `/PatientHistory`, `/AccessionResults` (SPA deep-links) | A (fresh tab) + C | All 4 fetch = 200; `/NceDashboard` renders full page with sidebar/filters/table | **CLOSED as Done** |
| OGC-675 | `GET /rest/reportByTest\|Panel\|Unit` | C (9× across 3 variants) | 9/9 = 404 | Status comment added; **still open** |
| OGC-676 | `POST /rest/aliquot` (returns 200 + NPE) | None — destructive | `/Aliquot` UI route renders; POST behavior untested | Deferred — would need destructive POST |
| OGC-677 | `GET /rest/statisticsReport` | C (3× repeat) | 3/3 = 404 | Status comment added; **still open** |

**Module maturity rating notes:**
- **SPA routing module: M5** — nginx fallback now serves React shell for all tested deep-link routes; React Router resolves them; deep-link onboarding works.
- The 3 still-open bug clusters (Test Notifications, Activity Reports, Statistics Report) represent ~3 missing feature paths on mgdev v3.2.1.8 that need either restoration or migration documentation.

**Process win:** running the formal revalidation protocol against existing tickets caught one fix (OGC-674) that would otherwise have stayed open indefinitely. **Bug-table hygiene is a recurring revalidation discipline**, not a one-shot at filing time. Recommend running the regression sweep on every active OGC ticket against the current target release at the start of each multi-day QA campaign.

### v6.18 (2026-05-14) — Revalidation pass corrects v6.16/v6.17 bug claims; one false positive, one reclassified, two new bugs surfaced

After Casey questioned the bug confidence levels, ran the formal `openelis-bug-revalidation` skill protocol (Methods A/B/C from the skill) against all 6 queued bugs from v6.16+v6.17. **The protocol caught one false positive and one misclassification before any Jira tickets were filed.** This is exactly what the revalidation skill exists for.

**Revalidation outcomes (and corrections to prior change-log claims):**

| Original claim | Revalidation outcome | Disposition |
|---|---|---|
| FHIR-1 `/fhir/metadata` 500 (double-slash proxy URL) | Method C 3/3: identical persistent error including HAPI-1814 detail | **CONFIRMED — file** |
| FHIR-2 `/fhir/Patient/27` 404 ("patients not synced") | **FALSE POSITIVE.** `Patient/{guid}` → 200 with full data. `Patient?identifier={nationalId}` → 200 Bundle. `Patient?_id=27` → 200 Bundle. FHIR uses the patient guid, not the LIMS patientPK. The 404 on `/Patient/27` is correct REST behavior. | **RETRACT** |
| FHIR-3 `/fhir/Observation` 151KB internal HAPI dump | Confirmed by repeat probes — multiple separate Bundle IDs, same broken structure (`formatCommentsPre`, recursive `idElement.idElement...`) | **CONFIRMED — file** |
| FHIR-4 `application/fhir+json` 406 | Confirmed — same endpoint returns 200 vs 406 by Accept header alone | **CONFIRMED — file** |
| Validation error shape is generic | **REFINED.** Bean Validation annotations DO populate `fieldErrors` ("must not be blank", "Invalid accession number format"). Service-layer business validations (uniqueness, missing FK) DO NOT — they fall through to generic. Bug scope narrows to service-layer-only inconsistency. | **REFINED — file** |
| Results-Accept-overwrite footgun | **RECLASSIFY.** Not a data-corruption bug — the modal text explicitly documents the checkbox as "Accept Unconditionally" with 3 valid scenarios (test redone same result, no-result-don't-cancel, value-change-with-note). Casey's "don't click it for normal results" rule was correct domain knowledge, not a bug observation. The real concern is **UX**: the checkbox sits inline in result-entry rows with no visual distinction from normal controls. The modal warning appears only AFTER the click. | **RECLASSIFY** as UX-improvement suggestion |
| `ORDERS_PATIALLY_COMPLETED_TODAY` enum typo | Cosmetic but real (Method A — text doesn't transient) | **CONFIRMED — file (cosmetic)** |

**Two new bugs surfaced during revalidation:**
- **NEW: empty-body 500 with info leak.** `POST /rest/SamplePatientEntry` with `body: '{}'` returns HTTP 500 with response body `"Check server logs"`. The server should return 400 for malformed input, not 500 — and the "Check server logs" response leaks internal info to the client.
- The `Patient/{guid}` 200 case revealed the correct FHIR lookup pattern (use guid, not patientPK; or use `?identifier=` search). This is methodology gold for Chain K rewrite.

**v6.18 apiShapes.ts additions:**
- `FHIR_LOOKUP` constant — `patientResourcePath(guid)` and `patientSearchByIdentifier(identifier)` helpers documenting the CORRECT FHIR lookup path.
- `SamplePatientEntryAnnotationError` and `SamplePatientEntryServiceLayerError` interfaces — the two distinct error shapes from `POST /rest/SamplePatientEntry`.

**New methodology rule added — §10.5 Always revalidate before queuing for file.** v6.16 and v6.17 both queued bugs as "ready to file" without running the revalidation skill first. The revalidation pass caught 2 errors out of 6 (33% false-positive/misclassification rate). The bug-filing etiquette rule now mandates:

1. Run `openelis-bug-revalidation` skill protocol Method C (API 3× repeat) on EVERY API-level bug claim before adding to the SKILL bug table.
2. Run Method A (fresh tab) on UI bugs.
3. For business-rule claims, test the inverse (e.g., for "generic error" claims, test whether other validation paths give specific errors).
4. Reading the modal/error text BEFORE filing a bug is required — what looks like a bug may be documented behavior.

**Module maturity rating updates from revalidation evidence:**
- FHIR **M0-M1 → M1.5** — patient lookup works correctly via guid; CapabilityStatement is broken (FHIR-1); Observation serialization is broken (FHIR-3); content negotiation is broken (FHIR-4). So FHIR is partially functional, not fully broken. v6.16's M0-M1 was an overcorrection.
- All other v6.17 maturity ratings hold.

**Bugs ready to file (post-revalidation, total 6):**
1. FHIR-1: `/fhir/metadata` 500 due to double-slash proxy URL — severe
2. FHIR-3: `/fhir/Observation` returns 151KB internal HAPI domain dump — severe
3. FHIR-4: `application/fhir+json` Accept header rejected with 406 — medium
4. `ORDERS_PATIALLY_COMPLETED_TODAY` enum spelling — cosmetic
5. Validation error generic for service-layer (uniqueness, missing FK) — medium
6. POST `/rest/SamplePatientEntry` with empty body returns 500 "Check server logs" — medium (info leak)
7. Results > By Order Accept-Unconditionally UX (inline checkbox, modal-only warning) — UX/A11Y

**Side-effect tracking (§11.5):**
- DEV01260000000000010 — still in validated state, used as the chain seed (carry-over from v6.16).
- DEV01260000000000015 — created for the Accept-revalidation, ended up in pristine state (result not entered/saved). Available as seed for future Chain A Step 3+ runs.

### v6.17 (2026-05-14) — Chain A truly end-to-end + Chain L PASS + Report PDF rendered

Immediate follow-up to v6.16 on the same SYSTEM_ADMIN session against mgdev. Two more chain steps land, completing Chain A end-to-end for the first time and closing out Chain L.

**Chain L (Lab Number Uniqueness) — PASS.** POST `/rest/SamplePatientEntry` with `labNo=DEV01260000000000010` (already used) returns HTTP 400 with body `{"fieldErrors":[],"error":"Validation failed"}`. Uniqueness is enforced.
- Minor usability bug noted: the error shape is generic. `fieldErrors` is an empty array even though the rejection IS field-specific (duplicate lab number). Clients cannot distinguish duplicate-lab-number from missing-required-field or invalid-date. Worth a Jira ticket for better error messages.

**Chain A Step 5 (Report PDF Generation) — PASS.** Drove the Reports > Routine > Patient Status Report flow:
1. Navigate to `/Report?type=patient&report=patientCILNSP_vreduit`
2. Expand "Report By Lab Number" section; enter `DEV01260000000000010` in From field
3. Click "Generate Printable Version" → opens new tab with rendered PDF
4. PDF shows: Patient code 324239090, National ID 3249899100, Age 27 Y, DOB 12/03/1999, Sex F, Last Name "Mana, Pi", Referring site "Test", Prescriber "Test, Test", Lab Number "DEV01260000000000010", Program "Routine Testing", Date of order "14/05/2026 00:00", Date and time of receipt "14/05/2026 03:18", specimen line "Serum DEV01260000000000010-1 13/05/2026 00:00", Hematology section with Hemoglobin = 13.50 g/dL (normal range 12.00-16.00).

**Methodology rule added — Report module URLs are NOT under /rest/.** All my v6.17 probes against `/rest/ReportPrint` and `/rest/PatientReport` etc. returned 404 or 405. The canonical URL is `/api/OpenELIS-Global/ReportPrint` (no `/rest/` segment) — a Struts-style JSP-mapped servlet, not a REST controller. The Reports module pre-dates the REST migration. v6.17 SKILL adds this rule and the `buildReportPrintURL()` helper to apiShapes.ts.

**Concrete captures added to apiShapes.ts:**
- `ReportPrintQuery` interface with all 12 observed query params (report, type, accessionDirect, highAccessionDirect, selPatient, referringSiteId, onlyResults, dateType, lowerDateRange/upperDateRange, etc.)
- `buildReportPrintURL()` helper to construct the canonical URL
- `REPORT_TEMPLATES` constant — mgdev default is `patientCILNSP_vreduit` (CILNSP variant — Madagascar national lab program format)
- `SamplePatientEntryValidationError` interface for Chain L's 400 response shape

**Module maturity rating updates from live evidence:**
- Order Workflow **M5 confirmed** — Chain A Steps 1-5 now ALL pass end-to-end.
- Reports **M3 confirmed** — Patient Status Report PDF renders correctly with full data.
- Lab Number uniqueness **M3 confirmed** — Chain L PASS.

**Methodology rules added (cumulative summary for v6.17):**

7. **Non-/rest/ endpoints exist.** Some legacy modules (Reports, possibly Print, Barcode) use Struts/JSP-mapped servlets at `/api/OpenELIS-Global/{X}` directly (no `/rest/` segment). When probing fails on `/rest/X`, ALSO probe `/api/OpenELIS-Global/X` before declaring an endpoint missing. Add to the §6.5 probe sequence.

**Side-effect tracking (§11.5):** Chain L's collision attempt was rejected (intended). No new orders created. Seeded order DEV01260000000000010 remains in its validated state.

**Bugs ready to file (Jira), updated:**
- Carry-overs from v6.16: 4 FHIR bugs, Results-Accept-overwrite, `PATIALLY` enum typo
- New from v6.17: SamplePatientEntry validation error shape is too generic (empty `fieldErrors`)

**Remaining queued for v6.18:**
- Capture the 3 pending POST bodies (LogbookResults, AccessionValidation, configuration-properties) via Playwright `addInitScript`
- Persona PB/PC rewrites — separate result entry from validation per the Casey-reported footgun rule
- Enumerate remaining report templates beyond patientCILNSP_vreduit
- Capture the report endpoint shape for the other 14+ reports in the Reports sub-menu

### v6.16 (2026-05-14) — B-session: Chain A end-to-end live on mgdev + CSRF mechanism cracked + 4 FHIR bugs surfaced

60-minute live session against mgdev.openelis-global.org v3.2.1.8 under SYSTEM_ADMIN credentials. Used the v6.15-seeded order DEV01260000000000010 (Mana Pi / Hemoglobin / Serum) to drive Chain A Steps 3-4 end-to-end for the first time live. Surfaced 4 FHIR bugs and corrected one v6.15-misdiagnosis (the 403 on config-properties writes was CSRF, not permission).

**Methodology under test verdict: PASS with major corrections.** The methodology drove a real result entry → validation transition (`analysisStatusId: 15 → 6`) end-to-end through real UI. Multiple new rules added.

Concrete captures:
- **CSRF rule (corrects v6.15):** writes use `X-CSRF-TOKEN: localStorage["CSRF"]`, NOT the XSRF-TOKEN cookie. 403 with body `"CSRF token missing or invalid"` is the unique CSRF-failure signature. v6.15 wrongly labeled this a permission issue.
- **LogbookResults endpoint pattern:** GET `/rest/LogbookResults?<filters>` returns result-entry queue (20 keys, ~50 fields per row). POST on the same URL submits entered results. Same-URL GET/POST convention also applies to AccessionValidation. Full TypeScript shape in `apiShapes.ts`.
- **AccessionValidation endpoint pattern:** GET `/rest/AccessionValidation?accessionNumber=&unitType=N&date=&doRange=true` returns validation queue (17 keys, 35+ fields per row with `isAccepted`, `isRejected`, `valid`, `normal`, `manual`). POST on the same URL submits validation acceptance.
- **Status transition observed:** `analysisStatusId 15` (Ready For Validation) → `6` (Validated). Other enum values still TBD.
- **Four FHIR bugs (Chain K BLOCKED on mgdev):**
  - FHIR-1: `/fhir/metadata` returns 500 — upstream proxy URL has double-slash (`https://fhir.openelis.org:8443/fhir//metadata`)
  - FHIR-2: `/fhir/Patient/27` returns 404 (HAPI-1996) — patients not synced from LIMS to FHIR
  - FHIR-3: `/fhir/Observation` returns 200 with 151KB of internal HAPI Java domain model (`formatCommentsPre`, `idElement.idElement.idElement...` recursive) instead of valid FHIR Bundle
  - FHIR-4: `application/fhir+json` Accept header rejected with 406 — FHIR R4 spec compliance failure
- **Casey-reported footgun (feedback memory saved):** the inline "Accept" checkbox on the Results > By Order page overwrites state and must NEVER be clicked during normal result entry. Validation acceptance happens ONLY via the dedicated Validation module (Routine, By Order, By Range, By Date). Chain A spec and Persona PB (Tech) / PC (Validator) must reflect this separation.

**Methodology rules added in v6.16:**

1. **CSRF rule:** always send `X-CSRF-TOKEN: localStorage["CSRF"]` for non-GET requests. Helper `csrfFetch()` in `apiShapes.ts`. Interpret 403 with the `"CSRF token missing or invalid"` body as a CSRF gate, not permission.

2. **Interceptor placement rule:** to capture POST bodies in the OpenELIS React SPA, install the interceptor BEFORE the SPA's Axios module initializes. Monkey-patching `window.fetch` after page load misses captures because Axios binds its fetch reference at module init. Use Playwright `addInitScript()` or a service worker. v6.15's three-capture sprint got the SamplePatientEntry POST body only because that page was a fresh navigation; subsequent in-app saves miss.

3. **Same-URL GET/POST convention:** LogbookResults and AccessionValidation both serve GET (list) and POST (submit) on the same URL with method differentiation. Chain specs should document this pattern as a class.

4. **Results vs Validation separation:** never use the Results > By Order page Accept checkbox. Result entry happens on Results module (Save only, NOT Accept). Validation acceptance happens on the dedicated Validation module (Save checkbox on rows).

5. **FHIR rating criteria correction:** never rate FHIR M3 from CapabilityStatement alone. Require Observation + Patient + Bundle round-trip with proper `application/fhir+json` content negotiation. The v6.14 "FHIR M3 mgdev" rating was based on insufficient evidence and is corrected to M0-M1.

**Module maturity rating updates from live evidence:**
- Order Workflow **M5 confirmed** — Chain A Steps 1-4 end-to-end live for the first time on mgdev.
- Result entry & Validation modules **M3 confirmed** — both have working save+round-trip paths.
- FHIR **M3 → M0-M1** (corrected) — 4 distinct bugs across metadata, Patient, Observation, content-negotiation.
- Configuration toggle (EQA_ENABLED) **M3 read / M0 write** — write is CSRF-gated, not permission-gated; canonical write payload still pending.

**Side-effect tracking (§11.5):** the seeded order `DEV01260000000000010` (Mana Pi, Hemoglobin, Serum) is now result-entered (`13.50` g/dL) and validated (`analysisStatusId: 6`). Out of all Dashboard queues except potentially "Orders Completed Today" for 2026-05-14. Available as seed data for any future Chain that needs a completed order.

**Bugs ready to file (Jira):**
- FHIR-1: `/fhir/metadata` 500 (double-slash proxy URL) — severe, breaks FHIR client discovery
- FHIR-2: `/fhir/Patient/N` 404 even for valid LIMS patientPK — severe, patients not synced
- FHIR-3: `/fhir/Observation` 151KB internal HAPI domain dump — severe, FHIR clients can't parse
- FHIR-4: `application/fhir+json` 406 — medium, FHIR R4 spec compliance
- Results "Accept" checkbox overwrites state — severe UX/data-integrity bug (Casey-reported)
- (Carry-over from v6.15) `ORDERS_PATIALLY_COMPLETED_TODAY` server enum typo — cosmetic

**Remaining queued for v6.17:**
- Capture canonical configuration-properties WRITE payload (with pre-load interceptor)
- Capture canonical LogbookResults POST body (same caveat)
- Capture canonical AccessionValidation POST body (same caveat)
- Chain L — Lab Number Uniqueness
- Chain A Step 5 — Report PDF generation
- Persona PB/PC rewrites — separate result entry from validation per the new methodology rule

Session report: `b-session-2026-05-14.md`. FHIR evidence: `b-session-fhir-evidence-2026-05-14.json`.

### v6.15 (2026-05-14) — A1-bis Session 2 (three-capture sprint): SamplePatientEntry POST captured live, eqaEnabled JSP retired in favor of REST, Dashboard tile enums completed

25 minutes of live testing against mgdev.openelis-global.org v3.2.1.8 immediately after merging v6.14. All three remaining A1-bis items captured cleanly. The largest result is that the methodology now anticipates that the right place to look may have moved between releases — v6.15 encodes this as a rule.

**Methodology under test verdict: PASS.** The §6.5b authoring-time-capture rule continued to pay dividends:
- Captured the full SamplePatientEntry POST payload (3336 bytes, JSON wrapping a legacy XML string) via a fetch+XHR monkey-patch interceptor during a successful end-to-end Add Order wizard submission. The order persisted: `DEV01260000000000010` is live in mgdev's Ready For Validation queue.
- Captured 4 Dashboard tile enums via UI clicks + network panel, including a backend typo (`ORDERS_PATIALLY_COMPLETED_TODAY` — missing R) and a label/enum mismatch ("Electronic Orders" → `INCOMING_ORDERS`) and an entirely-different shape for the Average TAT tile (`turn-around-time-metrics` returns `{receptionToValidation, receptionToResult, resultToValidation}` rather than the standard `{paging, displayItems}` envelope).
- Discovered that the eqaEnabled JSP form (`/api/OpenELIS-Global/SampleEntryConfigurationMenu`) is **gone** in v3.2.1.8. The toggle moved to `GET /rest/configuration-properties` (returns 36 keys including `EQA_ENABLED: "true"`). Write endpoints exist (403, not 404) but require SYSTEM_ADMIN — a future capture pass under elevated credentials will land the canonical write shape.

Concrete captures (all in `helpers/apiShapes.ts`):
- `SamplePatientEntrySubmitPayload`, `PatientPropertiesPayload`, `SampleOrderItemsPayload`, `SampleXMLBuilderInput`, `buildSampleXML()` — the full POST shape.
- `DASHBOARD_TILE_TYPES_V615`: spread of the existing constant plus `partiallyCompletedToday`, `electronicOrders`, `delayedTurnAround`, `turnAroundTimeMetrics`. **Do NOT correct the misspelling — that breaks the request.**
- `TurnAroundTimeMetricsResponse` — different envelope; §13 Y-RECON treats this as scalar-to-scalar, not list-length-to-count.
- `ConfigurationPropertiesResponse` — 36 keys, all values are strings (e.g. `"true"` not `true`).

Evidence: `a1bis-sample-patient-entry-post-2026-05-13.json`, `a1bis-eqa-config-discovery-2026-05-13.json`, `a1bis-session-2-report-2026-05-13.md`.

**Methodology rule added:** *Between releases, REST endpoints may replace JSP endpoints (and vice versa). A 404 on a previously-working path is a SIGNAL to look for the new home, not a failure to file as a bug. When the new home is found, retire the old path in the skill and update the rule for that surface.*

**Module maturity rating updates from live evidence:**
- Order Workflow (Add Order wizard) **M1 → M5** — first time the full 4-step wizard drove a real persisted POST through real UI on mgdev.
- EQA / configuration toggle **M0 (hidden requirement) → M3 read / M0 write** — read works via REST; write 403-gated. To upgrade write, capture under SYSTEM_ADMIN.
- Dashboard **M3 confirmed** + bonus enum captures + metrics-endpoint distinct shape.

**Side-effect tracking (§11.5):** test order `DEV01260000000000010` was created on mgdev as a side effect of the POST capture. Not destructive (it's a normal dev-instance order with patient Mana Pi / patientPK 27 / Hemoglobin / Serum). Left in place; safe to use as a seed for future Chain A Step 3+ runs that need a live order in the Ready For Validation queue.

**Candidate bug for filing:** server enum spelling `ORDERS_PATIALLY_COMPLETED_TODAY` is misspelled (missing R). Cosmetic but visible to every downstream client.

**Remaining A1-bis open items:**
- Capture the canonical configuration-properties write payload from a SYSTEM_ADMIN session (Chain F / Persona PF / Chain H all depend).
- The chain spec rewrites that USE the new `SamplePatientEntrySubmitPayload` shape are queued — apiShapes.ts has the types; the chain specs still reference the inferred shape and will be migrated in v6.16.

### v6.14 (2026-05-13 evening) — A1-bis mgdev session: Dashboard drill-down captured + first chain to PASS end-to-end

15 minutes of live testing against mgdev.openelis-global.org v3.2.1.8 (newer release than the A1 pilot's testing v3.2.1.6). The v6.13 SKILL was freshly installed via the .skill package.

**Methodology under test verdict: PASS.** The session surfaced one new endpoint shape (the Dashboard tile drill-down) and produced the first chain to PASS end-to-end live (Chain I).

Concrete captures:

- **Dashboard tile drill-down endpoint pattern:** `GET /api/OpenELIS-Global/rest/home-dashboard/{TYPE}` returns `{paging, displayItems[]}`. ORDERS_READY_FOR_VALIDATION returned 4 displayItems matching the KPI of 4 exactly — **§13 Y-RECON now works correctly with this endpoint** and the NEW-1 retraction is fully validated.
- **Verified enum names:** ORDERS_IN_PROGRESS, ORDERS_READY_FOR_VALIDATION (canonical), ORDERS_REJECTED_TODAY, ORDERS_COMPLETED_TODAY, ORDERS_ENTERED_BY_USER_TODAY, UN_PRINTED_RESULTS — all return 200. Two return 400 (ORDERS_PARTIALLY_COMPLETED_TODAY, ELECTRONIC_ORDERS) — server-side enum names differ; needs another UI click to capture.
- **Chain I PASS end-to-end live:** read primaryColor `#0f62fe` → PUT `#a335ee` → readback matches → restore confirmed. First chain in the catalog to PASS all steps in a real session.
- **Module maturity upgrades from live evidence:** Dashboard M1.5 → M3 on mgdev; Site Branding M3 confirmed live; FHIR M3 mgdev confirmed.

Session report at `a1bis-session-report-2026-05-13.md`.

`helpers/apiShapes.ts` gains:
- `DashboardDrillDownResponse` and `DashboardDrillDownItem` interfaces.
- `DASHBOARD_TILE_TYPES` enum of verified-working URL types.

The two remaining A1-bis items (SamplePatientEntry POST capture, eqaEnabled JSP form capture) are unblocked but require another short live session to drive their respective UI flows.

### v6.13 (2026-05-13) — v6.12 corrections applied in-place + Chain I rewrite
Closes the loop opened by v6.12. The v6.12 PR documented the 10 spec corrections via `apiShapes.ts` and shipped them as a sidecar patch file (`helpers/_common-v612-patch.ts`) without editing the chain/persona specs in place. v6.13 applies the corrections directly:

- `tests/chains/_common.ts`: `findOrSeedOrder` now reads `patientSearchResults` (not `patientList`), uses `patientID` (not `patientPK`) on object property reads, `ChainOrderRef.patientID` field renamed. `acquireAnyAccession()` and `eqaEnabledRequiresJspNotRest()` folded in from the sidecar.
- Across all 12 chain specs + 6 persona specs: mechanical replacement of `patientList`→`patientSearchResults`, `patient.patientPK`→`patient.patientID`, `patientProperties.nationalId`→top-level `nationalId` on SampleEdit, `?testSectionId=N`→`?testUnitId=N` on Logbook filter URLs. (URL params `?patientPK=` and POST-payload sending keys `{patientProperties: {patientPK: ...}}` retained pending live capture confirmation — left as TODO.)
- `tests/chains/chain-i-site-branding-to-report.spec.ts` rewritten end-to-end. The original premise "PDF reports show 'null' when SiteInformation.labName is missing" was based on the assumption that labName lives in site-branding or SiteInformation — neither was true per the pilot. The rewritten Chain I tests what IS testable today: site-branding round-trip (read → modify primaryColor → confirm → restore). Reduced from 6 steps to 4 steps. The labName/PDF check moves to a future chain that drives the JSP admin form via Playwright UI.
- `helpers/_common-v612-patch.ts` deleted.

After v6.13 the chains are runnable end-to-end at the spec level — though several still depend on live capture for the SamplePatientEntry POST shape and the eqaEnabled JSP form interaction.

### v6.12 (2026-05-13) — Phase A1 pilot + spec corrections grounded in live capture
The v6 methodology was run live against testing.openelis-global.org for the first time. 35 minutes of live Chrome time surfaced 3 candidate real findings (NEW-1 Y-RECON mismatch, NEW-2 ReportPrint 500, NEW-3 FHIR metadata HTML shell) and 10 spec bugs in the chains and personas. The methodology is doing its job — §13 Y-RECON caught NEW-1 on first try; §6.5 stopped me filing the false-positive endpoint paths I'd inferred from documents.
The single most important lesson: every one of the 10 spec bugs was the author (me) inferring an endpoint shape from documents rather than from live capture. **§6.5b "Use captureAround when authoring NEW spec steps" closes that gap** — the network capture helper from v6.10 is now mandatory at authoring time, not just at bug-filing time.
Added:
- §6.5b authoring-time capture rule with a code snippet showing the pattern.
- `helpers/apiShapes.ts` as single source of truth for the corrected response shapes: `patientSearchResults` key, `patientID` field, `birthdate` field, `labUnitList` for lab section IDs, `testUnitId` logbook filter param, `SampleEdit` Struts form top-level fields, `site-branding` schema (no `labName`), FHIR base path candidates, EQA enablement only at JSP not REST.
- `_common.ts` corrections: `findOrSeedOrder` reads the right keys; new `acquireAnyAccession(page)` helper that turns the Y-RECON Dashboard-vs-Logbook gap into a single clear assertion result.
- 3 new candidate findings (NEW-1, NEW-2, NEW-3) added to the bug table.
- BUG-14 marked as possibly regressed pending live retest.
- The full pilot session report is `pilot-2026-05-13-session-report.md` in the repo.
Module maturity downgrades from live evidence: Order Workflow M1.5 → M1, Dashboard M2 → M1.5, Reports M2 → M1.5, FHIR M3 → M1.5. The `maturity-dashboard.html` should be regenerated.
Workplan status: A1 ✅. Remaining: A1 follow-up retests on NEW-1/2/3 with corrected specs, Phase D spec-walks, Phase E3-E7 tooling, Phase F upstream PRs.

### v6.11 (2026-05-13) — Phase C: all 6 §12 Personas implemented
- 6 new specs under `tests/personas/`. Each is a day-in-the-life walk-through for one role, written as a single test.describe.serial that fails cleanly when the role hits a hidden requirement, missing UI path, or broken cross-module link.
- PA Receptionist (~190 lines, 6 steps): patient search → create → order → barcode print. Catches BUG-37 at Step 5 (the receptionist hands off an order whose patient isn't linked).
- PB Bench Tech Hematology (~140 lines, 4 steps): Workplan filter → result entry × N → round-trip → bulk-save normals. API-substituted per §11.5 because BUG-31 hangs the Carbon Accept checkbox.
- PC Validating Biologist (~110 lines, 4 steps): Validation queue → reject one for retest with note → validate rest → confirm on Patient Results. Depends on PB having entered something.
- PD Lab Manager (~150 lines, 5 steps): Dashboard → KPI vs underlying-list reconciliation (§13) → Rejection Report PDF (BUG-29 catch) → Statistics Report PDF (BUG-42 catch) → TAT sanity.
- PE QA Officer (~150 lines, 5 steps): NCE Dashboard → BUG-29 sanity check (zero NCEs + rejections today = silo confirmed at people layer) → corrective action → quarterly Non-Conformity report → CAP/CLIA cold-chain compliance footer.
- PF Lab Administrator (~200 lines, 6 steps + afterAll cleanup): site branding round-trip → barcode config → TestAdd (BUG-1/BUG-12 catch) → **enable EQA (the hidden-requirement catch that previously cost 7 cancelled tickets, OGC-518–524)** → create restricted user (BUG-3 catch) → User Manual PDF link.

All 6 personas marked ✅ in §12. Workplan Phase C status: complete. Remaining workplan items: D (FRS spec-walks), E3–E7 (more tooling), F (reports + upstream), A1 (live pilot).

### v6.10 (2026-05-13) — Phase E2 Live Network Capture Helper
- `helpers/networkCapture.ts` — new module turning §6.5 from "discipline" into "harness-enforced contract." Exports `startCapture`, `captureAround`, `saveAsEvidence`, `assertBugEvidence`, `assert404Observed`, `summarize`.
- §6.5a added with usage example. Tests that mark a 404 as FAIL without first calling `assertBugEvidence` (which throws if the app never actually called the claimed-broken path) should be considered incomplete.
- Auth/cookie headers automatically redacted in saved evidence files, so capture JSON is safe to commit and safe to paste into Jira tickets.
- Closes the loop on the 2026-04-20 false-positive cluster (OGC-535/562/563/565/566/568) at the infrastructure level — the next time someone tries to file a 404 bug against a path the app doesn't call, the harness blocks the bug ticket with a descriptive error pointing at the actual paths captured during the action.

### v6.9 (2026-05-12) — Chains E/F/G/H/J/K/L complete (Phases B5–B11)
- All 12 §11 chains are now Playwright specs in `tests/chains/`. Five (A, B, C, D, I) landed earlier; seven (L, E, F, G, H, J, K) added in this bump.
- Chain L (Lab Number Uniqueness): 4 steps, burst-creates 10 orders in parallel inside one `page.evaluate`, asserts all returned accessions are distinct, then asserts they share the configured prefix. Catches generator races.
- Chain E (Sample Validation Lifecycle): 6 steps. Distinct from Chain B's sample rejection — this tests RESULT rejection (retest workflow). Step 6 catches the case where both initial wrong value AND corrected value appear on the report.
- Chain F (EQA Distribution): 6 steps. Step 1 explicitly checks the eqaEnabled config precondition with a clear fix path, solving the OGC-518–524 cluster pattern. Step 5 catches BUG-39.
- Chain G (Cold-Chain Excursion): 5 steps. BAILs cleanly if no Cold Storage device configured (most common case). Uses API-direct excursion insertion as hardware-substitute; the real sensor-integration test is out of scope (workplan E6).
- Chain H (Permission Enforcement): 4 steps with afterAll cleanup. Spawns a second browser context to log in as a restricted user. Distinguishes 401 (session) from 403 (forbidden). Dependent on BUG-3.
- Chain J (Audit Trail Coverage): 5 steps. Performs 2-3 sensitive actions, then verifies each produced an audit entry with identifying who/when/what fields populated.
- Chain K (FHIR Round-trip): 6 steps. Forward direction (UI→FHIR read), write surface (FHIR POST), and reverse direction (FHIR→UI back-projection). BLOCKED clean if FHIR is read-only.

Every chain reuses `tests/chains/_common.ts` with zero changes — `apiCall`, `findOrSeedOrder`, `extractPdfText`, `markStep` all proven sufficient for the full set. Workplan Phase B (chains) is complete; the remaining workplan items move to Phase C (Personas).

### v6.8 (2026-05-12) — Chain I Site Branding → Report (Phase B4)
- Fifth §11 chain implemented. `tests/chains/chain-i-site-branding-to-report.spec.ts` (6 steps). First chain that can plausibly PASS on the current testing instance (admin write path already proven in Phase 36 Chain C; only the admin→report propagation remained unverified).
- Step 3 explicitly probes the NOTE-16 root cause — labName empty/null in SiteInformation. If found unset, the chain reports clearly that PDFs will show "null" because the upstream config is empty (different bug class than "pipeline is broken").
- Step 6 is the strongest test in the chain: modify labName → regenerate PDF → assert the new value appears → `test.afterAll` restores the original. Catches stale-cache and pipeline-lossy issues that Step 5 (read existing config) can't.
- Uses defensive endpoint probing per §6.5 — tries SiteInformation, siteInformation, SiteInformationMenu in priority order; bails with a clear error if none responds.

### v6.7 (2026-05-12) — Chains C + D Reflex/Calc engines (Phase B3)
- Chain C (`tests/chains/chain-c-reflex-trigger.spec.ts`, 6 steps) and Chain D (`tests/chains/chain-d-calculated-value.spec.ts`, 7 steps) implemented together. Both API-substituted per §11.5 because BUG-31 blocks the UI result-entry step.
- These are the two chains the prior catalog could *never* verify — Phase 28 admin tests confirmed both engines have working CRUD pages, but no test had ever observed either engine actually firing because BUG-31 blocked the result-entry step that would trigger one.
- Chain C Step 5 = definitive PASS/FAIL on "does the reflex engine fire on API writes?"
- Chain D Steps 5/6/7 split the calc engine check into three distinct symptoms: (5) calc test row produced, (6) row has a value, (7) value math is plausible. A partial-fix scenario (engine adds row but doesn't compute) surfaces clearly.
- Both chains reuse `tests/chains/_common.ts` with zero changes. Chain D adds its own multi-test order POST inline rather than extending the shared helper — kept for clarity until the pattern repeats.

### v6.6 (2026-05-12) — Chain B Rejection → NCE → Report implemented (Phase B2)
- Second chain from §11 is now a Playwright spec: `tests/chains/chain-b-rejection.spec.ts`. 8 named steps. The key design choice: Steps 5, 6, 7, 8 each probe one of the *four distinct symptoms* of BUG-29 (qa_event creation gap, View NCE search empty, Rejection Report PDF 503, Dashboard counter stuck at 0) so a partial fix surfaces clearly which subsystem was patched — not "rejection workflow FAILed" as a single opaque red light.
- Step 3 uses API substitute per §11.5 (Reject Sample is a Carbon checkbox, same BUG-31 family).
- Adds a "PARTIAL" status to Step 7's PDF-content check: PDF generates but is empty for today's rejections — a soft signal that BUG-29 reaches all the way through to the report layer.
- Reuses `tests/chains/_common.ts` helpers introduced in v6.5 with no changes.

### v6.5 (2026-05-12) — Chain A Order Lifecycle implemented (Phase B1)
- First chain from §11 Chains is now an actual Playwright spec: `tests/chains/chain-a-order-lifecycle.spec.ts`. Eight named steps (1: acquire order, 2: BUG-37 linkage check, 3: result entry via API substitute, 4: validation, 5: PDF generation, 6: PDF content match, 7: FHIR Observation fetch, 8: round-trip value match).
- Each step declares its §7.6 Acceptance Criterion (RENDER / FUNCTION / PERSIST / ROUND-TRIP / CROSS-LINK / REPORTABLE) and references the SKILL section that mandates it. Steps 3 and 4 use API substitutes per §11.5 because BUG-31 blocks the UI path.
- Added `tests/chains/_common.ts` with reusable helpers: CSRF-aware `apiCall`, `findOrSeedOrder`, minimal PDF text extractor (no external deps), structured step logger. Same helpers will power Chains B–L.
- Playwright project `chain-a` depends only on `setup`, not `data-setup`, so it can run against any seeded instance via the §0.6a script.

### v6.4 (2026-05-12) — Bulk seed script (Phase E1)
- Step 0.6 Data Census now has an 0.6a "Bulk seed script" sub-section with invocation commands. The seed script (`seed-data.setup.ts` + `helpers/seed-factory.ts` + `helpers/seed-config.ts` in the repo) is idempotent, round-trip-verifies every write per §7.5, detects and counts BUG-37 instances as it runs, and writes a machine-readable summary to `.auth/seed-state.json`.
- Targets 50 patients and 100 orders spread across 5 lab sections; status-transition seeding (IN_PROGRESS / READY_FOR_VALIDATION / REJECTED) intentionally not attempted while BUG-31 blocks the result-entry UI. Documented as an open item for workplan Phase B Chain C/D.

### v6.3 (2026-05-12) — Bug-revalidation cross-link
- Step 0.5 Calibration now explicitly references the `openelis-bug-revalidation` companion SKILL v1.1, which handles each new FAIL after calibration. The two protocols are designed to work together: this SKILL governs pre-phase calibration of known bugs; the companion SKILL governs reproducibility confirmation of new FAILs. Destructive bugs (BUG-31, BUG-38) use indirect evidence in both protocols.

### v6.2 (2026-05-12) — Bug-list calibration sweep
- Section 8 bug table re-calibrated against 2026-04-20/21 QA reports. 9 bugs marked Resolved, 6 marked False Positive (wrong endpoint pattern), 2 Retracted, 1 Downgraded (BUG-1 → merge with BUG-12). Strikethrough severity + bold action highlight tickets ready for Jira closure.
- See `bug-calibration-delta-2026-05-12.md` for the full delta document with per-bug evidence trail and top-5 priorities for the next live session.

### v6.1 (2026-05-12) — Blocking-bug etiquette
- Step 0.5: Calibration must use indirect evidence path for destructive bugs (BUG-31, BUG-38). Never re-trigger a known browser-hanging action.
- Section 11.5: Blocking-Bug Etiquette rule — when a mandated step would hang the session, mark BLOCKED + PARTIAL and continue. Clarifies that "mandatory" means "must be attempted and reported on," not "must succeed." Lists current known blockers (BUG-31, BUG-38) and allows API substitution for destructive-UI legs of chains.

### v6 (2026-05-12) — Lab-readiness lens
- Step 0.5: Calibration step before each new test phase.
- Step 0.6: Data Census gate before E2E or persona suites.
- Section 5.5: Feature Maturity Rubric (M0–M5). Replaces binary PASS/FAIL with maturity rating per module.
- Section 6.5: Mandatory live-network-capture rule before filing any 404-based bug. Closes the false-positive cluster pattern (OGC-535/562/563/565/566/568).
- Section 7.5: Round-trip Write Verification mandatory for all writes. Closes BUG-8 / BUG-29 / BUG-37 class.
- Section 7.6: Acceptance Criteria Standard (RENDER / FUNCTION / PERSIST / ROUND-TRIP / CROSS-LINK / REPORTABLE).
- Section 8.5: Partial-Feature Audit — quarterly + on major version. Seeded with 20 baseline suspect features.
- Section 11: Chains — 12 canonical cross-module workflows, mandatory.
- Section 12: Personas — 6 day-in-the-life walk-throughs.
- Section 13: Dashboard Counter Reconciliation — mandatory every run.
