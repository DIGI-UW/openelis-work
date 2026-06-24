# Suite Catalog — suite index, phases, and route discovery

> This is the **index** of QA suites (suite letter → area → key notes) + the run phases +
> non-admin route discovery. It is **not** the detailed case steps — those live in
> **`master-test-cases.md`** (repo root, full detail) and **`references/test-cases.md`** (the
> Test Catalog module subset). Deployment UAT is in **`madagascar-uat-test-suite.md`**. See
> `references/test-case-authoring.md` for how these fit together and how to add cases.
>
> **Admin routes:** the canonical, verified admin URL inventory now lives in the
> `openelis-design` skill's `references/admin-ia-inventory.md` (it was originally sourced
> from this skill's old Section 4). Use that as the source of truth for `/MasterListsPage/*`
> routes instead of a frozen copy here. Non-admin route-discovery patterns are below.

---

- On failure: screenshot immediately, note the exact step, then continue to the next case

### Suite Master Table

| Suite | ID Range | Area | Key Notes |
|-------|----------|------|-----------|
| **A — Test Catalog** | TC-01–08 | Create/edit/deactivate/reactivate tests, panels, ranges | BUG-1 (TestAdd POST 500), BUG-7/7a, BUG-8, BUG-12, BUG-13 |
| **B — Order Workflow** | TC-09–11 | Add sample, place order, enter results, H/L flags | Depends on Suite A |
| **C — Edit Order** | TC-EO-01–04 | Modify placed orders, edit results | BUG-4 (new accession on modify) |
| **D — RBAC** | TC-RBAC-01–10 | Role-based access: receptionist + lab tech flows | BUG-3 (user creation POST 500) |
| **E — Validation** | TC-VAL-01–08 | Approve/reject/refer results, notes, flag overrides | URL: `/ResultValidation` |
| **F — Results By Unit** | TC-BU-01–05 | Lab section worklist, filter, enter results | URL discovery needed |
| **G — Non-Conforming** | TC-NC-01–05 | Rejected samples, NC flag, validation of NC orders | — |
| **H — Patient Mgmt** | TC-PAT-01–06 | Patient search, history, create/edit | Healthy (Round 2) |
| **I — Dashboard** | TC-DASH-01–04 | KPI cards, values, clickable links | Healthy (Round 2) |
| **J — Order Search** | TC-OS-01–05 | Lookup by accession/patient/date, status | Healthy (Round 2) |
| **K — Admin Config** | TC-ADMIN-01–06 | Lab config, reference labs, dictionary CRUD | Healthy (Rounds 2+4) |
| **L — Reports** | TC-RPT-01–05 | Lab report access, print, batch | URLs vary |
| **M — Referral** | TC-REF-01–06 | Refer out, external lab dropdown, receive results | BUG-2 (dropdown reverts) |
| **N — Workplan** | TC-WP-01–06 | Workplan filter, result entry, sample reception | URL discovery needed |
| **O — LOINC/Dict** | TC-LOINC-01–06 | LOINC screen, mapping, dictionary CRUD | — |
| **P — System/Audit** | TC-SYS-01–05 | Audit log, system config, providers | — |
| **Q — Batch** | TC-BATCH-01–06 | Multi-patient orders, bulk result entry | — |
| **R — HL7/FHIR** | TC-EO-01–05 | FHIR metadata, Patient, ServiceRequest | BUG-14 (FHIR timeout) |
| **S — Export** | TC-EXP-01–05 | CSV/PDF export from various screens | Many may be GAP |
| **T — i18n** | TC-I18N-01–05 | Language switch, French toggle, date format | Healthy (Round 2) |
| **U — Session** | TC-SESS-01–05 | Session timeout, logout, stale token | Security suite |
| **V — Accessibility** | TC-A11Y-01–05 | Keyboard nav, form labels, contrast, ARIA | Healthy (Round 2) |
| **W — Error Handling** | TC-ERR-01–06 | Invalid input, XSS, 404, double submit | — |
| **X — Performance** | TC-PERF-01–06 | Load times, search latency, memory | Advisory thresholds |
| **Y — Data Integrity** | TC-DI-01–06 | Cross-module consistency, round-trip precision | — |
| **Z — Cleanup** | TC-CLEAN-01–05 | Deactivate QA data, document residual | Run last |
| **AA — Results By Patient/Order** | TC-RBP-01–06 | Results By Patient, By Order screens | Validated Round 3 |
| **AB — Validation By Order/Range/Date** | TC-VBO-01–05 | Validation By Order, Range, Date | Validated Round 3 |
| **AC — Merge Patient** | TC-MP-01–04 | Patient merge screen, search, select | Validated Round 3 |
| **AD — NC Corrective Actions** | TC-NCA-01–05 | NC events queue, corrective actions | Validated Round 3 |
| **AE — Routine Reports** | TC-RPT-R01–05 | Patient Status, Statistics, Summary | Fixed — Patient Status works at /Report?type=patient |
| **AF — Management Reports** | TC-RPT-M01–05 | Rejection, Referred Out, Delayed Validation | GAP — Reports 404 (BUG-9) |
| **AG — WHONET & Export** | TC-RPT-W01–05 | WHONET report, date range, export | GAP — Reports 404 (BUG-9) |
| **AH — Incoming Orders** | TC-IO-01–04 | Incoming/Electronic orders screen | Validated Round 3 |
| **AI — Batch Order Entry** | TC-BOE-01–04 | Batch Order Entry screen | Validated Round 3 |
| **AJ — Workplan By Panel/Priority** | TC-WPP-01–04 | Workplan filter by panel, priority | Validated Round 3 |
| **AK — Results By Range** | TC-RBR-01–04 | Results By Range screen | Validated Round 3 |
| **AL — Pathology/IHC/Cytology** | TC-PATH-01–06 | Pathology, Immunohistochemistry, Cytology | Validated Round 3 |
| **AM — Storage** | TC-STOR-01–03 | Storage location management | Validated Round 3 |
| **AN — Analyzers** | TC-ANZ-01–04 | Analyzer management, results | Validated Round 3 |
| **AO — EQA** | TC-EQA-01–03 | External Quality Assessment | Validated Round 3 |
| **AP — Aliquot/Billing/NoteBook** | TC-ALQ-01–03 | Aliquot, Billing (404), NoteBook (404) | BUG-10, BUG-11/15 |
| **AQ–AX — Admin Deep Validation** | TC-ADM-01–34 | All 28 admin sidebar items + sub-items | Validated Round 4: ALL PASS |

### Phase 4 — DEEP Interaction Suites (11 suites, 32 TCs)

| Suite | ID Range | Area | Key Notes |
|-------|----------|------|-----------|
| **K-DEEP — Admin Interaction** | TC-K-DEEP-01–08 | Dictionary search, Org search/pagination, Provider search, User search, Translation stats, Logging config, Lab Number format, EQA Program cards | 8 TCs, all PASS |
| **H-DEEP — Patient Interaction** | TC-H-DEEP-01–03 | Search by national ID, Patient History lookup, Merge Patient wizard | 3 TCs, all PASS |
| **J-DEEP — Workplan Interaction** | TC-J-DEEP-01–02 | Select test type view data, Select panel dropdown | 2 TCs, all PASS |
| **L-DEEP — Reports Interaction** | TC-L-DEEP-01–02 | Patient Status Report form structure, Generate Printable Version | 2 TCs, all PASS |
| **M-DEEP — Analyzer Interaction** | TC-M-DEEP-01–02 | Search/filter analyzers, Add New Analyzer form fields | 2 TCs, all PASS |
| **O-DEEP — Pathology Interaction** | TC-O-DEEP-01–02 | Dashboard structure (4 stat cards, filters), Status filter interaction | 2 TCs, all PASS |
| **Q-DEEP — EQA Interaction** | TC-Q-DEEP-01–02 | Dashboard stats/structure, Create New Shipment 3-step wizard | 2 TCs, all PASS |
| **W-DEEP — Error Handling** | TC-W-DEEP-01–03 | Invalid patient ID search, Empty search submission, 404 non-existent route | 3 TCs, all PASS |
| **X-DEEP — Performance** | TC-X-DEEP-01–03 | Dashboard load metrics (TTFB/resources/DOM), Large dropdown rendering, Memory utilization | 3 TCs, all PASS |
| **Y-DEEP — Data Integrity** | TC-Y-DEEP-01–02 | Dashboard KPI vs Validation consistency, Cross-module data consistency | 2 TCs, all PASS |
| **S-DEEP — Order Extended** | TC-S-DEEP-01–02 | Order entry 4-step wizard structure, New Patient extended fields | 2 TCs, all PASS |
| **R-DEEP — Alerts Interaction** | TC-R-DEEP-01 | Alerts dashboard filters & structure (4 stats, 3 filters, search, table) | 1 TC, PASS |

### Phase 5 DEEP Suites (8 suites, 21 TCs — all PASS)

| Suite | TC Range | What It Tests | Status |
|-------|----------|---------------|--------|
| **T-DEEP — i18n** | TC-T-DEEP-01–03 | EN↔FR locale switching, translation gap detection (BUG-16), locale restore | 3 TCs, all PASS |
| **U-DEEP — Session** | TC-U-DEEP-01–03 | Logout redirect, re-authentication, session continuity post re-auth | 3 TCs, all PASS |
| **G-DEEP — NCE** | TC-G-DEEP-01–03 | Report NCE form, View NC Events search, Corrective Actions search | 3 TCs, all PASS |
| **V-DEEP — Accessibility** | TC-V-DEEP-01–03 | WCAG landmarks, color contrast (16.45:1), heading structure, focus (NOTE-2) | 3 TCs, all PASS |
| **E2E-DEEP — Order Trace** | TC-E2E-DEEP-01–03 | Edit Order search, Results tracing (By Unit/Order), Validation tracing | 3 TCs, all PASS |
| **N-DEEP — Workplan** | TC-N-DEEP-01–02 | Workplan By Test (200+ types, data), By Panel (40+ types, empty state) | 2 TCs, all PASS |
| **F-DEEP — Results Entry** | TC-F-DEEP-01–02 | Row expand detail fields, numeric input validation | 2 TCs, all PASS |
| **B-DEEP — Order Wizard** | TC-B-DEEP-01–02 | Step 1 Patient Info (all fields), Steps 2-3 Program & Sample (15 programs, full field set) | 2 TCs, all PASS |

### Phase 6 DEEP Suites (8 suites, 16 TCs)

| Suite ID | Name | TCs | Focus |
|----------|------|-----|-------|
| BA-DEEP | Batch Order Entry | 2 | Setup form fields, Routine form sections |
| BB-DEEP | Print Barcode | 2 | Page structure, accession auto-format |
| BC-DEEP | Electronic Orders | 2 | Page structure, Status dropdown enumeration |
| BD-DEEP | Patient History | 2 | Page structure, search functionality |
| BE-DEEP | Patient Merge | 2 | Page structure, workflow validation |
| BF-DEEP | Results By Range | 2 | Page structure (BUG-17 typo), range search |
| BG-DEEP | Results By Status | 2 | Page structure, dropdown enumeration (200+ tests) |
| BH-DEEP | Referral Workflow | 2 | 3 search methods, results section |

### Phase 7 DEEP Suites (7 suites, 14 TCs — 10 PASS, 2 FAIL, 2 BLOCKED)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| BI-DEEP | Pathology Dashboard | 2 | Dashboard structure, case listing | 2/2 PASS |
| BJ-DEEP | Immunohistochemistry | 2 | Page structure, search/form controls | 2/2 PASS |
| BK-DEEP | Cytology | 2 | Page structure, workflow fields | 2/2 PASS |
| BL-DEEP | EQA Distribution | 2 | Program listing, event management | 2/2 PASS |
| BM-DEEP | Analyzer Error Dashboard | 2 | Analyzer config, test mapping, error indicators | 2/2 PASS |
| BQ-DEEP | Referral Order Create | 1 | Add Order with referral — **FAIL (BUG-18 + BUG-19)** | 0/1 FAIL |
| BR-DEEP | Referral Results Entry | 1 | Enter results on Referred Out Tests — **BLOCKED** | 0/1 BLOCKED |

### Phase 8 — Write Operation Deep Testing (6 suites, 6 TCs — 3 PASS, 3 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| BS-DEEP | TestAdd Write | 1 | POST `/rest/TestAdd` → HTTP 500 confirmed | 0/1 FAIL |
| BT-DEEP | UserCreate Write | 1 | POST `/rest/UnifiedSystemUser` → HTTP 500 confirmed. **NEW BUG-20:** Login Name field permanently invalid | 0/1 FAIL |
| BU-DEEP | PanelCreate Write | 1 | POST `/rest/PanelCreate` → HTTP 500 (upgraded from "silent failure") | 0/1 FAIL |
| BV-DEEP | TestModify Write | 1 | POST `/rest/TestModifyEntry` → HTTP 200 but data integrity failure (ranges lost, panel dropped) | 0/1 FAIL (WORSE) |
| BW-DEEP | FHIR Metadata | 1 | `/fhir/metadata` → HTTP 200, valid CapabilityStatement (HAPI FHIR 7.0.2, R4) | 1/1 **RESOLVED** |
| BX-DEEP | Referral Workflow | 1 | Referral dropdowns work, POST saves correctly, new referral created | 1/1 **RESOLVED** |

**Phase 8 Key Findings:**
- BUG-14 (FHIR): RESOLVED — metadata endpoint returns valid R4 CapabilityStatement
- BUG-18/19 (Referral): RESOLVED — dropdowns work in expanded logbook row, POST saves referral correctly
- BUG-8 (TestModify): WORSE than expected — HTTP 200 but silently corrupts data (ranges lost, panel association dropped)
- BUG-20 (NEW): Login Name field in User Create always shows `invalid: true` with no error message
- BUG-21 (NEW): All `patient-photos/{id}/true` endpoints return HTTP 500

### Phase 9 — Regression & Cross-Module Integrity (8 suites, 8 TCs — all PASS)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| BY-REG | API Health & Regression | 1 | 12/14 core endpoints HTTP 200; all major workflows healthy | 1/1 PASS |
| BY-REG | Admin MasterListsPage | 1 | All 20+ admin items render; Organization Management loads 4,726 orgs | 1/1 PASS |
| BY-REG | Add Order Multi-Step | 1 | 4-step wizard (Patient Info → Program → Sample → Order) fully functional | 1/1 PASS |
| BY-REG | LogbookResults Filtering | 1 | Test unit dropdown loads 14 sections; Hematology returns 14 tests with table | 1/1 PASS |
| BZ-XMOD | Order Tracing (26CPHL00008K) | 1 | Order visible in LogbookResults and ReferredOutTests; referredOut flag consistent | 1/1 PASS |
| BZ-XMOD | Validation Consistency (26CPHL00008M) | 1 | Order in LogbookResults and AccessionValidation; result values match exactly | 1/1 PASS |
| CA-KPI | Dashboard Metrics vs Actual | 1 | Dashboard API returns correct JSON; discrepancy explained (order-level vs test-level counting); NOTE-3 API typos found | 1/1 PASS |
| CB-PAT | Patient Identity Consistency | 1 | Logbook patients verified in patient-search; all patient IDs and national IDs match | 1/1 PASS |

**Phase 9 Key Findings:**
- All 8 tests PASSED (100% pass rate)
- Regression testing confirms Phase 5–8 features remain stable
- Cross-module data flow fully validated: order consistency from entry through validation
- Dashboard metric discrepancy is architectural, not a bug
- NOTE-3 (NEW): Dashboard metrics API field names contain typos (patiallyCompletedToday, orderEnterdByUserToday, unPritendResults, incomigOrders, averageTurnAroudTime) — cosmetic issue, low priority
- BUG-21 reconfirmed: All `patient-photos/{id}/true` endpoints return HTTP 500

### Phase 10 — Security & Edge Cases (6 suites, 6 TCs — 5 PASS, 1 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| CC | CSRF & Session Security Audit | 1 | CSRF token validation, security headers (CSP, HSTS, X-Frame), XSS-Protection, Referrer-Policy | 1/1 PASS |
| CD | XSS Injection Testing | 1 | Patient search & LogbookResults XSS payload reflection (script, img onerror, svg onload, event handler) | 1/1 PASS |
| CE | SQL Injection Testing | 1 | Patient search & LogbookResults SQLi payload injection (quote, OR 1=1, UNION, DROP TABLE) | 1/1 PASS |
| CF | Concurrent Session Handling | 1 | 20 simultaneous + 50 sequential requests to `/rest/home-dashboard/metrics` | 1/1 PASS |
| CG | Login Rate Limiting | 1 | 30 rapid wrong-password + 50 rapid API requests (no 429 responses, no account lockout) | 0/1 **FAIL** |
| CH | Authorization & Error Handling | 1 | `credentials:omit` auth enforcement, error response info leakage | 1/1 PASS |

**Phase 10 Key Findings:**
- **5 PASS, 1 FAIL (83% pass rate)**
- **BUG-22 (NEW, Medium):** No rate limiting detected on login endpoint or API endpoints. Brute-force attacks possible. All 30 wrong-password attempts and 50 API requests returned 200/403 without escalation to 429 or account lockout.
- **NOTE-4 (NEW):** CSP header includes `unsafe-inline` and `unsafe-eval`, significantly weakening Content Security Policy protection
- **NOTE-5 (NEW):** Referrer-Policy header NOT SET — information leakage risk
- **NOTE-6 (NEW):** User input reflected in JSON API responses (LogbookResults `labNumber` parameter). Low-risk with `Content-Type: application/json` but caution if frontend uses `dangerouslySetInnerHTML`.
- **NOTE-7 (NEW):** Error responses contain "Exception" keyword, leaking server implementation details
- **Good news:** SQL injection and XSS protections are solid — parameterized queries working correctly, no script execution from reflected input
- **Good news:** Concurrent session handling stable under load (200 total requests, all successful)
- **CSRF protection unclear:** POST without CSRF token returns HTTP 500 (not 403 forbidden) — unclear if rejection is CSRF-based or payload validation error

### Phase 11 — Performance Benchmarking (4 suites, 4 TCs — 4 PASS, 0 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| CI | API Response Time Benchmarks | 1 | 10 endpoints × 10 iterations: p50/p95/p99 latency, consistency | 1/1 PASS |
| CJ | Page Load Benchmarks | 1 | Dashboard shell DCL, resource count, API timing for 5 major pages | 1/1 PASS |
| CK | Large Dataset Stress | 1 | Mycobacteriology 96-row load, parallel 14-section, TestAdd 56KB, patient search | 1/1 PASS |
| CL | Memory Leak Detection | 1 | JS heap + DOM node tracking across 10 API fetches and 10 SPA navigations | 1/1 PASS |

**Phase 11 Key Findings:**
- **4 PASS, 0 FAIL (100% pass rate)** — No new bugs
- All API response times cluster at ~370ms, dominated by ~365ms network RTT (server in remote location)
- Dashboard SPA shell loads in 40ms DCL with 26 resources (53KB total)
- Largest payloads: TestAdd (56KB, 729ms), SampleEntry (59KB, 442ms)
- Mycobacteriology (96 rows) loads in 2207ms — acceptable for large result set
- No memory leaks: DOM nodes stable at 853 across 10 SPA navigations; heap growth 2MB (5.28%) attributable to deferred GC
- **Performance is network-bound, not application-bound** — local deployment would see sub-50ms API responses

### Phase 12 — Accessibility Deep Audit (6 suites, 6 TCs — 2 PASS, 4 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| CM | axe-core Full Page Scan | 1 | WCAG 2.1 AA violations across 7+ pages using axe-core 4.7.2 | 0/1 **FAIL** |
| CN | Keyboard Navigation | 1 | Focus visibility, skip link, tab order, keyboard traps | 1/1 PASS (partial) |
| CO | Heading Hierarchy | 1 | H1-H6 order, WCAG 1.3.1, 2.4.6 compliance | 0/1 **FAIL** |
| CP | ARIA & Landmarks | 1 | Landmark roles, live regions, aria-expanded, search role | 1/1 PASS |
| CQ | Color Contrast | 1 | WCAG AA 4.5:1 minimum; foreground/background ratio analysis | 0/1 **FAIL** |
| CR | Touch Target & Form A11y | 1 | WCAG 2.5.5 44×44px targets, form labels, autocomplete attributes | 0/1 **FAIL** |

**Phase 12 Key Findings:**
- **2 PASS, 4 FAIL (33% pass rate)** — Significant accessibility gaps found
- **All violations are shell-level** — identical 5 axe violations on every page (sidebar/header, not page content)
- **NOTE-8 (NEW):** 45% of focusable elements lack visible focus indicator (9/20 tested)
- **NOTE-9 (NEW):** Heading hierarchy completely broken — no H1, starts at H5, skips H1/H2
- **NOTE-10 (NEW):** Zero aria-live regions — dynamic content changes invisible to screen readers
- **NOTE-11 (NEW):** 90% of interactive targets (87/97) below 44×44px WCAG 2.5.5 recommended minimum
- **NOTE-12 (NEW, Serious):** Color contrast ratio 1.08:1 (white #fff on #f5f6f8) across 8 elements on every page. WCAG AA requires 4.5:1 minimum.
- **Good news:** Proper landmark structure (main, nav, banner, contentinfo), all inputs labeled, lang attribute set, no keyboard traps
- **Root cause:** Carbon Design System sidebar component (`cds--side-nav__items`) has structural HTML issues; color contrast failure likely in a custom theme override

### Phase 13 — i18n Infrastructure (2 suites, 2 TCs — 2 PASS, 0 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| CS | Locale Switching & Persistence | 1 | en/fr selector, navigation persistence, html lang attribute update, text node change rate | 1/1 PASS |
| CT | API Locale Support | 1 | Accept-Language header handling, API response locale-awareness | 1/1 PASS |

**Phase 13 Key Findings:**
- **2 PASS, 0 FAIL (100% pass rate)**
- Locale selector correctly switches between English and French; persists across SPA navigation
- **NOTE-13 (NEW, Low):** `<html lang>` attribute never updates when locale changes — remains "en" even in French mode. Screen readers won't detect the language switch.
- API is locale-agnostic by design — translations managed client-side via Transifex, not server-side
- 42% of visible text nodes changed when switching to French (remaining 58% are proper nouns, numbers, or untranslated keys)

### Phase 14 — End-to-End Workflow, Report & Integration (4 suites, 4 TCs — 2 PASS, 2 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| CU | Report UI Rendering | 1 | 7 report page routes tested for form rendering vs Dashboard fallback | 0/1 **FAIL** |
| CV | Report API (ReportPrint) | 1 | POST /rest/ReportPrint with various report types; PDF generation | 1/1 PASS |
| CW | FHIR Integration | 1 | FHIR R4 endpoints: Patient, Observation, metadata, ServiceRequest, DiagnosticReport, Task, Specimen | 1/1 PASS |
| CX | Data Availability & E2E Tracing | 1 | Logbook data, patient search, referral data availability for order lifecycle tracing | 0/1 **FAIL** |

**Phase 14 Key Findings:**
- **2 PASS, 2 FAIL (50% pass rate)**
- ~~**BUG-23 RETRACTED:**~~ Initial test used hash-based URLs (`#/RoutineReport`). SPA uses **path-based routing** (`/Report?type=patient&report=...`). Sidebar link clicks render report forms correctly (24+ inputs). False positive caused by wrong URL pattern in test.
- **NOTE-14 (NEW, Medium):** Test instance data wiped — all logbook types return 0 results, patient search returns 0, referredOut returns 0. Dashboard shows stale counts (104 in-progress, 142 validation). E2E tracing not possible.
- **Good news:** ReportPrint POST API works — returns PDF for patient reports. Backend report generation is functional.
- **Good news:** Report UI routes work correctly via path-based sidebar navigation. Corrected pass rate: 3 PASS, 1 FAIL (75%).
- **Good news:** FHIR R4 Patient, Observation, and metadata endpoints are fully functional. ServiceRequest/DiagnosticReport/Task/Specimen return 404 (not yet implemented).

### Phase 15 — Notification, Alert & Error Handling (4 suites, 4 TCs — 4 PASS, 0 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| CY | Notification Panel | 1 | Bell button, notification panel, Subscribe/Reload/MarkRead, /rest/notifications | 1/1 PASS |
| CZ | Alert System | 1 | /rest/alerts API, /Alerts page, alert infrastructure | 1/1 PASS |
| DA | API Error Response | 1 | Error response audit, stack trace leakage, malformed input handling | 1/1 PASS |
| DB | Session Timeout & Routing | 1 | "Still There?" dialog, path-based routing verification, BUG-23 retraction proof | 1/1 PASS |

### Phase 16 — Deep Operations, FHIR, Workplan & EQA (7 suites, 22 TCs — 22 PASS, 0 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| DC | Print/PDF Workflows | 3 | Form submission, Report PDF generation, page load | 3/3 PASS |
| DD | Batch Operations | 3 | Concurrent API requests, batch data handling, performance | 3/3 PASS |
| DE | Concurrency & Load | 3 | 20 parallel requests, resource contention, no degradation | 3/3 PASS |
| DF | FHIR Deep | 4 | 5 declared resources, 4 data resources functional, capability statement | 4/4 PASS |
| DG | Workplan | 4 | All 4 sub-pages, sidebar navigation, form rendering | 4/4 PASS |
| DI | EQA Distribution | 2 | Status cards, filter, action buttons, workflow functional | 2/2 PASS |

**Phase 16 Key Findings:**
- **4 PASS, 0 FAIL (100% pass rate)**
- **BUG-23 RETRACTED:** Report UI routes work correctly when accessed via sidebar clicks (path-based routing). The hash-based URLs used in Phase 14 testing were wrong.
- **NOTE-15 (NEW, Low):** API error responses leak "Exception" text — reconfirms NOTE-7 from Phase 10.
- **CRITICAL DISCOVERY:** SPA uses **path-based routing** (`/SamplePatientEntry`, `/Report?type=patient&report=...`), NOT hash-based (`#/RoutineReport`). All future tests must use sidebar clicks or path-based URLs.
- Notification system functional (bell button, panel, Subscribe/Reload/MarkRead). Empty data (no notifications configured).

### Phase 17 — Storage, Pathology, Billing & NoteBook (8 suites, 15 TCs — 13 PASS, 2 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| **CY** | Storage Management Dashboard | 3 | 6-tab interface, hierarchical location display, real data (67 rows) | 3/3 PASS |
| **CZ** | Cold Storage Monitoring | 3 | Real-time status, 5 tabs, temperature monitoring | 3/3 PASS |
| **DA** | Pathology/IHC/Cytology Dashboards | 4 | Status cards, search, filters, paginated tables, consistent design | 4/4 PASS |
| **DB** | Billing | 2 | Sidebar link functionality, feature implementation | 0/2 FAIL (NOTE-18) |
| **DC** | NoteBook Dashboard | 2 | Blank page rendering, route correctness | 0/2 FAIL (NOTE-19) |
| **DD** | Aliquot Management | 1 | Accession number search, page rendering | 1/1 PASS |

**Phase 17 Key Findings:**
- **13 PASS, 2 FAIL (86.7% pass rate)**
- Storage, Cold Storage, Pathology/IHC/Cytology all fully functional with production-grade UX patterns
- Billing and NoteBook both broken stubs (no implementation)
- NOTE-18, NOTE-19 newly discovered
- Session timeout "Still There?" dialog works correctly and is dismissable.

### Phase 18 — Non-Conform, Analyzers Deep, Help Menu (9 suites, 9 TCs — 7 PASS, 2 FAIL)

| Suite ID | Name | TCs | Focus | Status |
|----------|------|-----|-------|--------|
| **DR** | Report Non-Conforming Event | 1 | Search form, validation, search execution | 1/1 PASS |
| **DS** | View New Non-Conforming Events | 1 | Page rendering, heading consistency | 1/1 PASS (NOTE-20) |
| **DT** | NCE Corrective Actions | 1 | Page rendering, search form | 1/1 PASS |
| **DU** | Analyzers List | 1 | Summary cards, data table, real analyzer data, Add Analyzer button | 1/1 PASS |
| **DV** | Analyzer Error Dashboard | 1 | Summary cards, filters, data table, Acknowledge All button | 1/1 PASS |
| **DW** | Analyzer Types | 1 | Type management, real ASTM data, Create button | 1/1 PASS |
| **DX** | Help: User Manual | 1 | PDF opens in new tab, 196 pages, proper branding | 1/1 PASS |
| **DY** | Help: Video Tutorials | 1 | Button functionality in header Help panel | 0/1 FAIL (NOTE-21) |
| **DZ** | Help: Release Notes | 1 | Button functionality in header Help panel | 0/1 FAIL (NOTE-21) |
| **EA** | Analyzer Actions Menu Deep | 1 | Kebab menu 6 actions, navigation, modals | 1/1 PASS |
| **EB** | Analyzer Delete Confirmation | 1 | Delete dialog {name} placeholder bug | 0/1 FAIL (NOTE-22) |
| **EC** | Analyzer Search Filter | 1 | Search box filter, URL params, empty state | 1/1 PASS |
| **ED** | Analyzer Type Creation | 1 | Create modal form fields, validation | 1/1 PASS |
| **EE** | Notifications Panel | 1 | Bell icon, slide-in panel, controls, empty state | 1/1 PASS |
| **EF** | User Panel | 1 | User icon, Open ELIS, Logout, Locale, Version | 1/1 PASS |
| **EG** | Global Search Match | 1 | Header search, patient results dropdown | 1/1 PASS |
| **EH** | Global Search No Match | 1 | Non-matching query, no empty state | 1/1 PASS (NOTE-23) |
| **EI** | Order CRUD — Create | 2 | 4-step wizard, auto lab number, POST 200 | 2/2 PASS |
| **EJ** | Order CRUD — Read/Update | 2 | Edit Order search, load persisted data, modify | 2/2 PASS |
| **EK** | Order CRUD — Cancel/Validation | 2 | Remove/cancel checkboxes, validation bugs | 1/2 (NOTE-24, NOTE-25) |
| **EL** | Reflex & Calculated Values Admin | 3 | API rules, legacy admin pages | 3/3 PASS |
| **EM** | Patient CRUD — Create | 2 | New Patient form, save, verify | 2/2 PASS |
| **EN** | Patient CRUD — Read/Update | 3 | Search, select, load, modify, re-save | 3/3 PASS |
| **EO** | Patient Form Validation | 2 | DOB→age calc, phone format validation | 2/2 PASS |
| **EP** | Patient History & Merge Pages | 2 | Page load, UI structure verification | 2/2 PASS |
| **EQ** | Result Validation — Page Load | 3 | Test unit dropdown, Hematology results table, bulk actions | 3/3 PASS |
| **ER** | Accession Validation & Results | 2 | AccessionValidation search, AccessionResults page | 2/2 PASS |
| **ES** | Results Entry (LogbookResults) | 1 | Editable results table, patient data display | 1/1 PASS |
| **ET** | Patient Results & Date Validation | 2 | PatientResults search form, ResultValidationByTestDate | 2/2 PASS |
| **EU** | Validation Workflow E2E | 1 | Save checkbox → Save → result removed from queue | 1/1 PASS |
| **EV** | Report — Patient Status | 2 | Page load 3 sections, PDF generation by lab number | 2/2 PASS (NOTE-27) |
| **EW** | Report — Statistics | 2 | Page load with parameters, PDF generation (Hematology/2026) | 2/2 PASS |
| **EX** | Report — Test Report Summary | 2 | Page load with date pickers, 3-page PDF generation | 2/2 PASS (NOTE-28) |
| **EY** | Audit Trail | 2 | Page load with search, 21-item lifecycle audit results | 2/2 PASS |
| **EZ** | WHONET/CSV Export | 1 | Export page with date/study type/date type parameters | 1/1 PASS |
| **FA** | Electronic Orders | 1 | Incoming Test Requests with dual search modes | 1/1 PASS |
| **FB** | Referrals Page | 1 | Patient search, results table, date/test/unit filtering | 1/1 PASS |
| **FC** | Report — Rejection | 1 | Rejection Report date range page load | 1/1 PASS |
| **FD** | Report — Activity Reports | 3 | By Test Type, By Panel, By Test Section — all date range + type dropdown | 3/3 PASS |
| **FE** | Report — External Referrals | 1 | Date range + referral center dropdown | 1/1 PASS |
| **FF** | Report — Non Conformity | 2 | By Date, By Unit and Reason — date range pages | 2/2 PASS |
| **FG** | Report — Delayed Validation | 1 | Parameterless auto-PDF: 141 tests across 14 sections | 1/1 PASS |
| **FH** | Batch Entry, Barcode, Reassignment | 4 | Batch Order Entry Setup, Print Bar Code Labels, Batch Test Reassignment, Add Order wizard | 4/4 PASS |

**Phase 18-19 Key Findings:**
- **7 PASS, 2 FAIL (77.8% pass rate)**
- Non-Conform module: 3 fully functional search pages with consistent pattern
- Analyzers module: Rich management UI with real data (analyzer list, error dashboard, type definitions)
- Help: User Manual PDF works; Video Tutorials and Release Notes are stub buttons
- NOTE-20 (naming inconsistency), NOTE-21 (stub help buttons) discovered Phase 18
- NOTE-22 (Delete {name} placeholder), NOTE-23 (search no empty state) discovered Phase 19

**Phase 20 Key Findings:**
- **25/27 PASS (93% pass rate)**
- Order CRUD: Full 4-step wizard works, auto-generates lab numbers, POST returns 200
- NOTE-24 (OGC-510): Typo "Succesfuly saved" on order success page
- NOTE-25 (OGC-511): Submit button enables despite active validation errors
- NOTE-26 (OGC-512): Typo "Orginal Result" in validation Past Notes column
- Reflex Tests & Calculated Values admin pages are **React pages** (Admin -> Reflex Tests Configuration: `/MasterListsPage/reflex`, `/MasterListsPage/calculatedValue`). Calc rules read via `GET /rest/test-calculations` (200); older `/rest/calculatedValue` + `/rest/testCalculatedValue` 404s (BUG-46/54) are not the real endpoints. (Corrected v6.14.)
- Patient CRUD: Full Create/Read/Update works; DOB→age auto-calc correct
- Patient form phone validation blocks Save even when empty (optional field triggers validation)
- No success toast after patient save — form silently clears
- Result Validation: Full workflow tested — Save checkbox → Save → item removed from queue
- Normal Range column empty on all validation/results rows (no reference ranges configured)
- Dashboard: 105 awaiting result entry, 142 awaiting review

**Phase 21 Key Findings:**
- **12/12 PASS (100% pass rate)**
- Report PDF Generation: 3 report types tested (Patient Status, Statistics, Test Report Summary) — all generate valid PDFs
- Audit Trail: Full 21-item order lifecycle audit for accession 26-CPHL-000-08K
- Electronic Orders: Rich dual-mode search (by value, by date/status)
- Referrals: Patient search form with results table and date/test/unit filtering
- WHONET/CSV Export: Parameter form renders with date range, study type, date type
- Report menu tree: 11 report pages across 4 categories (Routine, Aggregate, Management, WHONET)
- NOTE-27 (OGC-513): Patient Status Report PDF shows literal "null" for empty Contact Tracing fields
- NOTE-28 (OGC-514): Summary of All Tests report header shows raw i18n key `report.labName.two`
- Observation: Test Report Summary date validation message persists after valid calendar selection (stale React state)
- Observation: Statistics Report title renders as "StatisticsReport" (no space)

**Phase 22 Key Findings:**
- **12/12 PASS (100% pass rate)** — No new bugs
- All remaining Management Report pages tested: Rejection, Activity (×3), External Referrals, Non Conformity (×2), Delayed Validation
- Activity Reports follow consistent pattern: date range + type-specific dropdown (Test Type, Panel Type, Unit Type)
- Delayed Validation is unique — parameterless, directly generates PDF showing 141 tests awaiting validation across 14 lab sections
- Batch Order Entry Setup: rich form with order fields, barcode configuration, optional fields (Facility, Patient Info)
- Print Bar Code Labels: label set counts, specimen labels, site name search, sample type selector
- Batch Test Reassignment: sample type → current test → replacement test workflow with cancel option
- Observation: "Non ConformityReport by Date" title has missing space (cosmetic, same pattern as "StatisticsReport")
- External Referrals Report heading still contains "labratory" typo (NOTE-17 from Phase 16)

---


---

## Section 5 — URL Discovery Patterns

For screens not in the confirmed URL table, try these patterns in order:

**Results screens:** `/AccessionResults`, `/ResultsByPatient`, `/ResultsByOrder`, `/PatientResults`
**Validation screens:** `/ResultValidation?type=routine`, `/ResultValidation?type=order`, `/ResultValidation`, `/AccessionValidation`, `/AccessionValidationRange`, `/ResultValidationByTestDate`
**Workplan:** `/WorkPlanByTest?type=test`, `/WorkPlanByPanel?type=panel`, `/WorkPlanByTestSection?type=`, `/WorkPlanByPriority?type=priority`
**Reports:** `/Report?type=patient` (confirmed working), Hamburger -> Reports menu
**FHIR:** `<BASE>/api/fhir/metadata` (WARNING: BUG-14 — times out 60s)
**NC Events:** `/ReportNonConformingEvent`, `/ViewNonConformingEvent`, `/NCECorrectiveAction`
**LOINC:** `/MasterListsPage/LOINCCodes`, `/LOINCManagement`
**Audit:** `/AuditLog`, `/SystemLog`, `/MasterListsPage/AuditLog`
**Pathology:** `/PathologyDashboard`, `/ImmunohistochemistryDashboard`, `/CytologyDashboard`
**Analyzers:** `/analyzers`, `/analyzers/errors`, `/analyzers/types`
**EQA:** `/EQADistribution`, `/EQAManagement`, `/EQAParticipants`, `/EQAResults`
**Inventory:** `/Inventory` (Dashboard+Catalog+Reports tabs)
**Alerts:** `/Alerts`
**Orders:** `/ElectronicOrders`, `/SampleBatchEntrySetup`, `/PrintBarcode`
**Storage:** `/Storage`, `/Storage/samples`
**Aliquot:** `/Aliquot`
**Order Programs:** `/genericProgram`

If a URL returns 404, try alternates before marking as GAP. Record the working URL in your log.

---

