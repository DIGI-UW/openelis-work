# Playwright Harness & Carbon Component Rules

> **Where the harness lives:** **this repo — `DIGI-UW/OpenELIS-QA`.** The Playwright config
> (`playwright.config.ts`), setup (`auth.setup.ts`, `data.setup.ts`, `seed-data.setup.ts`),
> `helpers/`, `pages/`, `tests/` (chains + personas), `gap-suites-*.spec.ts`, and the legacy
> single-file `openelis-e2e.spec.ts` all live at the repo root. This skill (SKILL.md +
> references/) is the methodology layer over that harness. Canonical spec layout is **one spec
> per chain/persona** (`tests/chains/chain-a-*.spec.ts`, run via `--project=chain-a`); the
> single `openelis-e2e.spec.ts` is legacy.

---

## Section 6 — React/Carbon Component Workarounds

### 6.1 — Native Setter Pattern (React-controlled inputs)

When Carbon dropdowns or inputs don't respond to normal click/type interaction, use the
native setter pattern to trigger React's synthetic event system:

```javascript
// Carbon Select — trigger React onChange
const sel = document.querySelector('select[id*="TARGET" i]');
const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
setter.call(sel, sel.options[1].value);
sel.dispatchEvent(new Event('change', { bubbles: true }));

// Carbon TextInput — trigger React onInput
const input = document.querySelector('input[id*="TARGET" i]');
const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
inputSetter.call(input, 'TARGET_VALUE');
input.dispatchEvent(new Event('input', { bubbles: true }));
```

This workaround is especially needed for the Referral external lab dropdown (BUG-2).

**IMPORTANT:** The native setter pattern sets the internal value but may NOT update the
visible character counter (e.g., "0/23" stays unchanged). If the visible UI must update,
use direct click + `computer.type()` instead.

### 6.2 — Carbon Checkbox Avoidance (BUG-2 EXTENDED)

**CRITICAL:** Calling `.click()` on ANY Carbon for React checkbox causes a 60-second browser
tab hang. This affects ALL checkboxes across the React SPA, not just Referral dropdowns.

**Workarounds:**
- **Results page:** DOM workaround works — `cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles:true}))` sets the DOM state and persists on Save.
- **Validation page:** DOM workaround sets `checked` but React state does NOT update — server POST omits the value. Mark checkbox interaction tests as BLOCKED.
- **General rule:** Never use `.click()` on Carbon checkboxes. Use DOM manipulation where possible, mark as BLOCKED where DOM workaround doesn't propagate to React state.

### 6.3 — React SPA Routing (Sidebar Navigation)

**CRITICAL:** Direct URL navigation for non-admin React pages may hit Spring Boot 404 because
the React SPA router hasn't initialized. Always navigate via the sidebar menu:

```
// WRONG — may get 404 or blank page
await navigate('https://example.com/PatientManagement');

// RIGHT — use sidebar navigation
await page.click('text=Patient');
await page.click('text=Add/Edit Patient');
```

Admin pages at `/MasterListsPage/*` routes generally work with direct URL navigation.

### 6.4 — Dual Authentication Systems

The React SPA at `/login` and legacy JSP admin at `/OpenELIS-Global/LoginPage` maintain
separate sessions. Features behind legacy JSP auth (TestAdd, TestModifyEntry, FHIR) may
require a separate authentication flow. Cookie/session sharing between the two is unreliable.

### 6.5 — No bug filed against a 404 without live capture (MANDATORY)

OpenELIS Global uses a hybrid architecture:

- **Legacy JSP/Struts pages** at `/api/OpenELIS-Global/<PageName>`
- **React SPA REST calls** at `/rest/<endpoint>` — where the endpoint name often does NOT match the page name

Examples from the 2026-04-20 false-positive cluster (6 Jira tickets closed):
- Dictionary page → `/rest/DictionaryMenu` (not `/rest/dictionary`)
- Patient search → `/rest/patient-search-results` (not `/rest/patient`)
- Provider → JSP `/api/OpenELIS-Global/ProviderMenu` (no `/rest/provider`)
- LogbookResults filter → `?testSectionId=N` (not `?labUnit=N`)
- Reports → JSP `/api/OpenELIS-Global/ReportPrint` (not `/rest/report/*`)
- Organization → JSP `/api/OpenELIS-Global/Organization` (no `/rest/organizationSearch`)

**Rule.** Before filing a bug against a 404 on a REST endpoint, use `read_network_requests` to capture what the browser actually calls when a real user performs the action. If the captured path returns 200 but your guessed path returns 404, the bug is a false positive — file no ticket.

**Apply this rule to:** every BUG-* candidate whose only evidence is `GET /rest/X → 404`. The verification step is non-optional.

### 6.5a — Harness-enforced capture (Phase E2)

The §6.5 rule above was previously enforced by **discipline**. As of Phase E2 the harness enforces it. Use `helpers/networkCapture.ts`:

```typescript
import { captureAround, assertBugEvidence, assert404Observed } from '../../helpers/networkCapture';

test('Step X — verify Dictionary endpoint is reached', async ({ page }, testInfo) => {
  const { session } = await captureAround(page, async () => {
    await page.goto(`${BASE}/MasterListsPage/DictionaryMenu`);
    await page.waitForLoadState('networkidle');
  });

  // BEFORE filing a 404 bug against /rest/dictionary, prove the app
  // actually called that path. If it doesn't (likely — see the
  // 2026-04-20 cluster), this throws with a descriptive error and
  // saves the capture as evidence in .auth/captures/.
  assertBugEvidence(testInfo, session, '/rest/dictionary', 'BUG-51-candidate');

  // Then prove the call returned 404 (not 200/500/etc.)
  assert404Observed(session, '/rest/dictionary', 'BUG-51-candidate');
});
```

**What the helper does:**

- `startCapture(page)` and `captureAround(page, action)` attach Playwright `request`/`response` listeners, buffer the traffic, and return a `CaptureSession` with `.captures`, `.failed`, `.notFound` slices.
- `saveAsEvidence(testInfo, session, label)` writes the session to `.auth/captures/<label>-<timestamp>.json` AND attaches it to the Playwright test report. Auth/cookie headers are redacted automatically so the evidence file is safe to commit or paste into a Jira ticket.
- `assertBugEvidence(testInfo, session, claimedPath, bugLabel)` throws with a descriptive error if the app never called `claimedPath` during the capture window. The error message references the OGC-535/562/563/565/566/568 cluster precedent and points at the actual paths the app did call — so the next test iteration probes the right endpoint.

**Discipline → enforcement.** A test that tries to file a bug against `/rest/dictionary` without `assertBugEvidence` should be considered incomplete. CI should flag specs that mark a 404 as FAIL without first calling either `assertBugEvidence` or `assert404Observed`.

### 6.5b — Use captureAround when authoring NEW spec steps (v6.12)

The 2026-05-13 A1 pilot found 10 spec bugs in the chains and personas — every one of them was the spec author (me) inferring an endpoint shape from documents rather than from live capture. `patient-search-results` returns `{patientSearchResults}` not `{patientList}`. Patient ID is `patientID` not `patientPK`. LogbookResults filter is `?testUnitId=N` not `?testSectionId=N`. None of these would have shipped if the helper had been used at *authoring* time, not just at *bug-filing* time.

**Rule (v6.12):** before adding a new step to any chain or persona that calls a non-trivial endpoint, the author MUST first capture the equivalent action via the live UI (or via direct probe) and validate the response shape. Patterns:

```typescript
// Authoring pattern — probe before committing the spec
const { session } = await captureAround(page, async () => {
  await page.goto(`${BASE}/some-page`);
  await page.waitForLoadState('networkidle');
});
console.log(summarize(session));
// Inspect session.captures to find the actual endpoint + payload shape
// Update helpers/apiShapes.ts with the discovered keys
// Then write the spec step against the real shape
```

**Source of truth:** `helpers/apiShapes.ts` (added in v6.12) holds the live-validated response types and key constants. Every chain/persona spec that reads a REST response should import from there rather than typing keys inline. When a new endpoint is introduced or a shape changes, update `apiShapes.ts` in the same commit.

**Practical effect:** the next round of chain/persona corrections (post-pilot) and any future chain/persona additions should not re-inference any shape that isn't already validated in `apiShapes.ts`. If you find yourself typing a field name from memory, stop and run `captureAround` first.

---

## Section 7 — Error Handling

---

## Section 10 — Playwright Rules

When generating or updating Playwright test specs (`openelis-e2e.spec.ts`), follow these rules:

### 10.1 — Navigation
- Use sidebar menu clicks for React SPA pages, NOT direct `page.goto()` URLs
- Admin `/MasterListsPage/*` routes are safe for direct navigation
- Always `await page.waitForSelector()` after navigation to confirm page loaded

### 10.2 — Carbon Component Interaction
- **NEVER** use `.click()` on Carbon checkboxes (causes 60s hang)
- Use native setter pattern for React-controlled inputs (see Section 6.1)
- For visible UI updates (e.g., char counters), prefer `computer.type()` over native setter
- Use `page.evaluate()` for DOM manipulation when Playwright actions don't trigger React

### 10.3 — Performance Testing
```typescript
// Collect performance metrics via Performance API
const metrics = await page.evaluate(() => {
  const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  return {
    ttfb: Math.round(perf.responseStart - perf.requestStart),
    domNodes: document.getElementsByTagName('*').length,
    resources: performance.getEntriesByType('resource').length,
    jsHeapMB: Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024),
  };
});
```

### 10.4 — Error Handling Tests
```typescript
// Native setter for React inputs (used in error handling tests)
await page.evaluate(() => {
  const input = document.querySelector('input[placeholder="Enter Patient Id"]') as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(input, '9999999');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
```

### 10.5 — Test Data
- Use existing data (patient Abby Sebby ID 0123456, accession 26CPHL00008, Test Analyzer Alpha)
- Avoid creating new tests (BUG-1), new users (BUG-3), or clicking Carbon checkboxes (BUG-2 EXT)
- Use `QA_AUTO_` prefix for any data you must create

### 10.6 — Async Results in javascript_tool
When `await` is not supported in Claude in Chrome's `javascript_tool`, use the
`window.__variable` pattern for async results:
```javascript
(async () => {
  const response = await fetch('/api/endpoint');
  window.__result = await response.json();
})();
// Then read window.__result in a subsequent call
```

### 10.7 — Cookie/Query String Blocking
Claude in Chrome may block `fetch()` results that contain session cookies in the response.
If fetch results are blocked, use DOM inspection (`document.querySelector`) or
`page.evaluate()` as alternatives to read page data.

### 10.8 — Inventory API Payload Field Names (Critical)
The `/rest/inventory/items` POST/PUT endpoint requires **exact** field names from `InventoryItemForm.jsx sanitizedData`:
- `name` (string, required)
- `itemType` (string: "REAGENT"|"CARTRIDGE"|"RDT", required)
- `category` (string)
- `manufacturer` (string)
- `units` (string — NOT `unitOfMeasure`)
- `lowStockThreshold` (number)
- `stabilityAfterOpening` (number, REAGENT only)
- `storageRequirements` (string, REAGENT only)
- `compatibleAnalyzers` (string, CARTRIDGE only)
- `testsPerKit` (number, RDT only)

Wrong field names → HTTP 400 `HttpMessageNotReadableException`. Do NOT include `active`, `description`, or any other fields.

**Lot creation** uses `POST /rest/inventory/management/receive` with:
`{inventoryItem:{id}, lotNumber, currentQuantity, initialQuantity, expirationDate(ISO), receiptDate(ISO), storageLocation(null OK), qcStatus:"PENDING", status:"ACTIVE"}`

**Storage location creation** (`POST /rest/inventory-storage-locations`) → HTTP 500 (BUG-40). Use null for storageLocation when creating lots.

### 10.9 — Connection Pool Exhaustion Prevention (Critical)
Chrome allows max 6 simultaneous connections per origin. When testing endpoints that may hang:
1. **Never** open more than 3 tabs to the same origin simultaneously
2. **Monitor** `/read_network_requests` for pending status
3. **Close hanging tabs immediately** if a POST stays "pending" beyond 30s — use `tabs_close_mcp`
4. **Test from the app page**, not API-direct tabs, for POST requests (app page has session context)
5. **BUG-38 endpoint** (`/rest/reportnonconformingevent`) must NOT be tested — it hangs permanently

If all API calls from all tabs start hanging, connection pool is exhausted:
- Close ALL tabs with pending requests
- Wait 5s for connections to reset
- Reopen needed tabs fresh

---

## Step 4 — Cleanup
