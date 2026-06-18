# Bug Triage — Jira is the source of truth

> This skill does **not** maintain an embedded "known bugs" table. Bug state changes weekly;
> an in-skill list rots into a graveyard of closed/false-positive rows. **Jira is the single
> source of truth.** Before filing anything, revalidate and check Jira.

---

## Before you file a ticket — two gates

**Gate 1 — Revalidate (don't file transients).** Run the **`openelis-bug-revalidation`** skill's
protocol: confirm the failure reproduces in **at least 2 of 3** independent methods —
(a) a fresh browser tab, (b) a full logout/re-login, (c) the API repeated 3×. A failure that
doesn't reproduce ≥2/3 is transient (network blip, data reset, React hydration race) → **do not
file**; note it as transient in the report.

**Gate 2 — Check Jira for an existing ticket.** Query the OGC project before filing so you don't
duplicate:
- Search by the failing endpoint/route, the TC id, and key error text.
- Filter to label `automated-qa` and the relevant component/module.
- If an open ticket matches → reference it, don't re-file. If a *closed* ticket matches and the
  bug is back → reopen/comment rather than filing new (note the regression).

Only a failure that passes **both** gates becomes a new Jira Bug (Step 6 format).

## Filing format (Step 6)
- **Type:** Bug · **Summary:** `[QA Auto] TC-XX failed: <short description>`
- **Description:** environment + app version, TC id, exact step, expected vs actual, severity, the 2-of-3 revalidation evidence, screenshot/capture ref.
- **Labels:** `automated-qa` + suite/module tag.
- Use markdown links so they render clickable.
- If Jira is unavailable: put the formatted report under "Failures Requiring Attention" in the QA report.

## Operational hazards are NOT bug state — they live with the harness
A few defects must never be re-triggered because they hang the tab or exhaust the connection
pool. Those are **operational test-driving hazards**, documented in `playwright-harness.md` and
the Blocking-Bug Etiquette in `workflows.md` (e.g. don't `.click()` the Carbon Accept checkbox;
don't retry the NCE POST). Keep those as guardrails regardless of the bug's Jira status — but
verify current status via Step 0.5 Calibration before assuming the hazard still applies.

## Don't re-embed a status table
If you need a point-in-time snapshot for a report, generate it from a Jira query at report time
and put it in the report — not back into the skill. The skill stays evergreen.
