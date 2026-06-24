---
name: openelis-test-catalog-qa
description: >
  Automated QA testing skill for OpenELIS Global — drives a live instance to execute test
  suites and produce a maturity-rated pass/fail report with Jira tickets. Broad coverage
  (100+ suites across Orders, Validation, Results, Patient, Dashboard, Admin pages, all
  Reports, Referrals, Workplan, FHIR, i18n, Accessibility, Pathology, Analyzers, EQA, Alerts,
  Storage, Batch Entry, Barcode) plus DEEP interaction suites, cross-module Chains, role
  Personas, dashboard reconciliation, security (CSRF/XSS/SQLi), and WCAG checks. Runs
  interactively via Claude in Chrome and/or via a Playwright harness. Use whenever the user
  wants to QA-test, regression-test, smoke-test, or audit an OpenELIS Global instance, or file
  QA bug tickets.
---

# OpenELIS Global QA Skill

You are a QA automation agent for OpenELIS Global. Navigate a live instance, execute the
requested suites, log every action with screenshots/captures, produce a structured,
**maturity-rated** report, and file Jira tickets for *revalidated* new failures.

> **This file is evergreen methodology.** Time-varying state lives in references or Jira:
> bug status → Jira (`references/bug-triage.md`), run history → `references/validation-history.md`,
> version notes → `CHANGELOG.md`. Don't paste bug tables, dated findings, or per-version counts
> back into this file — that's what rots.

## Two execution substrates — pick per task
- **Claude in Chrome** — interactive/exploratory runs, manual DEEP phases, anything needing a
  real rendered SPA and screenshots. The default for ad-hoc QA.
- **Playwright harness** — repeatable Chains, Personas, and data seeding (specs + helpers live
  in the QA automation repo; see `references/playwright-harness.md`). Use for deterministic,
  re-runnable coverage and CI.

Most full runs use both: Chrome for interactive suites, the harness for chains/personas/seed.
State which substrate a given result came from.

## Run tiers
- **Smoke** — login + Data Census + Chain A (Order Lifecycle) + Y-RECON. Fast health check.
- **Standard** — a chosen suite subset + all Chains + Y-RECON (personas optional).
- **Full** — all suites + all Chains + all Personas + Y-RECON + (quarterly) Partial-Feature Audit.

"Mandatory every run" items (Chains, Y-RECON) scale by tier per `references/workflows.md`.

---

## Step 0 — Setup
**Ask the user:** (1) which OpenELIS URL to test (`BASE_URL`); (2) which suites/tier; (3) Jira project key (optional).

- **Credentials:** `admin` / `adminADMIN!` (widely-published default; override if the user gives others).
- **Test-data prefix:** `QA_AUTO_<MMDD>` for anything you create — eases cleanup, avoids collisions.
- **CSRF:** token is in `localStorage['CSRF']`; send as `X-CSRF-Token` on all POSTs. If Formik submit fails, POST directly with `URLSearchParams({loginName, password})`.
- **EQA prerequisite:** EQA features are hidden until `eqaEnabled=true` (Admin → `/MasterListsPage/SampleEntryConfigurationMenu` → General Configurations → Order Entry Configuration → set `eqaEnabled=true`). Run this before any EQA suite/chain.
- **Don't trust baked-in fixtures.** Discover real data per instance via Step 0.6 — instance-specific patients/accessions/analyzers drift and differ across instances.

## Step 0.5 — Calibration (before any new test phase)
Re-verify the current state of the top open issues you'll touch, using **non-destructive** evidence only (API probe, DOM/React-prop inspection, live-capture vs signature). Never re-trigger a known browser-hanging/pool-exhausting action just to "confirm" (see hazards in `references/playwright-harness.md`). Record STILL PRESENT / RESOLVED / CHANGED. New failures route through `references/bug-triage.md`. Skip only if the last run was ≤24h ago on the same instance. Calibration is what prevents status drift.

## Step 0.6 — Data Census (before any E2E/persona/chain)
One-call census: patient count (`lastName=A`), busiest-unit Logbook count, Dashboard KPIs (`GET /rest/home-dashboard/metrics`), recent accession range. **If patients=0 AND logbook=0 AND KPIs zero → the instance was reset:** halt E2E/persona work and either re-seed (Playwright `--project=seed-data`, see `references/playwright-harness.md`) or mark the report "instance empty — render-only." Re-census after seeding. This prevents reporting PASS on an empty database.

## Step 1 — Read the suites
The catalog is layered (see `references/test-case-authoring.md` for how it fits together):
- **`master-test-cases.md`** (repo root) — the detailed master catalog (all suites/DEEP suites, full steps). Source of truth for case detail.
- **`references/test-cases.md`** — the Test Catalog module subset (TC-01…TC-11).
- **`references/suite-catalog.md`** — the suite **index** + run phases + non-admin route discovery.
- **`madagascar-uat-test-suite.md`** — deployment UAT (LO-xx/DU-xx); run on the Madagascar deployment.
- Admin routes: use the canonical `admin-ia-inventory.md` in the `openelis-design` skill, not a frozen copy.

Scan the repo for prior `qa-report-*` and `validation-report-*` outputs. When authoring or extending cases, follow **`references/test-case-authoring.md`** (deep chained cases + surfacing uncovered/uncertain workflows).

## Step 2 — Login
Navigate to `BASE_URL`; log in (`admin`/`adminADMIN!`); verify the Dashboard KPI cards render. If login fails, stop. **ChangePasswordLogin redirect** (the env periodically forces a change): find the form's Formik context via the React fiber tree, `ctx.setValues({loginName, password, newPassword, confirmPassword})`, wait ~1s, `ctx.handleSubmit()`; fall back to the original password if the server rejects the change.

## Step 3 — Run the suites
Execute per `references/suite-catalog.md` and the run tier. For each TC: follow steps exactly, screenshot after each meaningful action, record PASS/FAIL/BLOCKED/GAP + a one-line note + its acceptance criterion (below). On failure: screenshot, note the exact step, continue. Run the mandatory Chains/Personas/Y-RECON per `references/workflows.md`.

---

## Grading language (use on every run)

**Acceptance criterion — every TC declares one (Section 7.6):**
`RENDER` (page/elements exist — lowest) < `FUNCTION` (action completes, 200/nav) < `PERSIST`
(write reads back on same endpoint) < `ROUND-TRIP` (reads back on a *different* endpoint/screen)
< `CROSS-LINK` (module A affects module B) < `REPORTABLE` (compliant output: branded PDF,
validated FHIR, audit entry). A higher tier must carry its evidence (read-back diff, cross-module
check, PDF excerpt) or it's downgraded to RENDER.

**Maturity rubric — rate every module (Section 5.5):**
`M0` stub · `M1` form-only · `M2` saves (same-endpoint read-back) · `M3` round-trips (different
endpoint/screen) · `M4` cross-links · `M5` reportable. A module is rated at the **lowest** level
any sub-feature hits. **A phase reporting only RENDER criteria is capped at M1**, regardless of
pass count. Reports summarize by maturity, not pass count.

**Round-trip write verification (MANDATORY for writes, Section 7.5):**
Every write TC pairs the write with a read-back through a *different* surface, and diffs every
field (arrays/nested included — a 3-condition rule returning 2 is FAIL, not "minor"). Prefer the
screen the user visits next (Modify Order after Add; Patient Search after Create; Admin list
after Admin Create).

**Error handling:**
| Situation | Action |
|---|---|
| Element not found | scroll, wait 2s, retry once; still missing → FAIL |
| URL 404/403 | try discovery alternates; all fail → GAP |
| Page load >10s | FAIL "page load timeout" |
| Error banner/modal | screenshot → FAIL with the text |
| Session "Still There?" | dismiss, re-auth, resume |
| Silent save (form resets, no error) | verify via navigate-away-and-back → FAIL |
| Browser-hanging/pool-exhausting action | do NOT retry; mark **BLOCKED**, note the cause, continue (see Blocking-Bug Etiquette) |
| Blank page after nav | SPA routing — try sidebar nav instead of direct URL |

**Blocking-Bug Etiquette (Section 11.5):** "Mandatory" = must be *attempted and reported*, not
*must succeed*. A genuine feature failure is a real FAIL and must be reported (don't hide it as
BLOCKED). BLOCKED is reserved for steps that would damage the session (hang the tab, exhaust the
6-connection pool); mark BLOCKED, log the cause, continue. A destructive UI step with a
non-destructive API equivalent may be **API-substituted** (tag it; the chain still PASSes if the
round-trip read-back matches, and the UI gap stays visible). Current hazards: see
`references/playwright-harness.md` (verify each via Step 0.5 — don't assume a past hazard still applies).

## Step 4 — Cleanup
Deactivate any `QA_AUTO_` data you created (LIMS rule: **deactivate/reactivate, never hard-delete**). Restore any admin toggles you changed (branding, `eqaEnabled`) — the Playwright personas do this in `afterAll`.

## Step 5 — Report
Produce the report per **`references/report-template.md`** (maturity- and acceptance-criterion driven; includes Chains/Personas/Y-RECON sections). Save as `qa-report-[instance]-[YYYYMMDD-HHMM].md`. Append the run to `references/validation-history.md`.

## Step 6 — File Jira tickets (revalidated failures only)
Follow **`references/bug-triage.md`**: a new FAIL becomes a ticket only after it passes **both
gates** — (1) the `openelis-bug-revalidation` 2-of-3 protocol (fresh tab / re-login / 3× API), and
(2) a Jira search confirming no existing/closed-but-regressed ticket. This is where false
positives are stopped — never file a single transient FAIL.

---

## Harmonization with sibling skills (single-source these — don't duplicate)
- **Admin routes / IA** → `openelis-design` `references/admin-ia-inventory.md` (canonical; verified).
- **What's built vs not / feature maturity facts** → `openelis-design` `references/current-state-gotchas.md` and `spec-registry.md`.
- **Carbon component root-causes** → `openelis-design` `references/carbon-anti-patterns.md` (this skill keeps only the *operational* "how to drive it in a test" form, in `playwright-harness.md`).
- **Bug state** → Jira (`references/bug-triage.md`). **New-failure gating** → `openelis-bug-revalidation` skill.
- **Accessibility depth** → hand off to the `accessibility-review` skill for full WCAG audits; this skill runs a recurring a11y smoke pass (contrast, keyboard, labels) so regressions surface every full run.

## When NOT to use / out of scope
- Designing features or writing specs → `openelis-design`. Protocol/analyzer mapping → `analyzer-mapping-spec`.
- Deciding whether a single new FAIL is a real bug → `openelis-bug-revalidation` (this skill calls it, doesn't reimplement it).
- Real hardware/sensor (Modbus/BACnet) cold-chain integration → out of scope (synthetic events only).

## Reference files
| File | When to read |
|---|---|
| `references/suite-catalog.md` | Step 1/3 — the suite inventory, phases, and non-admin route discovery |
| `references/workflows.md` | Chains, Personas, Y-RECON, Partial-Feature Audit (mandatory, tiered) |
| `references/report-template.md` | Step 5 — the maturity/acceptance-driven report structure |
| `references/bug-triage.md` | Step 0.5 / Step 6 — Jira-as-source-of-truth + the revalidation gate |
| `references/playwright-harness.md` | When using the Playwright harness or Carbon component workarounds; operational hazards. The harness lives in **this repo (OpenELIS-QA)**: `playwright.config.ts`, `*.setup.ts`, `helpers/`, `pages/`, `tests/`, `gap-suites-*.spec.ts` |
| `references/test-case-authoring.md` | When writing or extending the catalog — deep chained cases + surfacing uncovered/uncertain workflows |
| `references/validation-history.md` | Historical run log (append after each run) |
| `master-test-cases.md` (repo root) | Detailed master catalog (all suites) |
| `CHANGELOG.md` | Skill version history |
