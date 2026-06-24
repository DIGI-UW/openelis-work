---
name: openelis-screenshots
description: Capture real screenshots and screen-recordings of a live OpenELIS Global instance for the user manual, the website, release notes, or design reviews. Use whenever Casey asks for OpenELIS screenshots, to capture or grab a screen or page, screenshots for the website, or to record a walkthrough or refresh the docs-capture media. The harness is a Playwright project on Casey's Mac (the sandbox cannot launch a browser); drive it via the Control-your-Mac connector.
---

# OpenELIS screenshot / walkthrough capture

A Playwright harness logs into a live OpenELIS instance once, then navigates by SPA route and
saves a labeled PNG per step plus a `walkthrough.webm` video per capability. Output lands in
`docs-media/<capability-id>/`.

## Where it lives
- **Project:** `~/Documents/OpenELIS QA/` (self-contained Playwright project; also a mounted
  Cowork folder so you can Read/Edit the files directly).
- **Specs:** `tests/docs/<capability-id>.docs.spec.ts` — one per capability.
- **Route map (source of truth):** `scripts/author-doc-specs.mjs` — the capability→routes→labels
  table. Re-run it to regenerate every spec.
- **Helper:** `tests/docs/capture.ts` — `go()`, `shot()`, `saveWalkthrough()`, `dismissModals()`.
- **Route reference:** `routes.md` next to this skill (the live nav dump, captured 2026-06-23).
- **Output:** `~/Documents/OpenELIS QA/docs-media/<id>/NN-<label>.png` + `walkthrough.webm`.

## Hard prerequisites (do these every session)
This MUST run on Casey's Mac via `mcp__Control_your_Mac__osascript`. The Cowork sandbox cannot
launch Chromium (no OS libs / no root). In **every** shell command:

```bash
export PATH="$HOME/.nvm/versions/node/v24.11.0/bin:$PATH"   # node/npx are nvm-managed, NOT on bash -lc PATH
cd "$HOME/Documents/OpenELIS QA"
```

Long runs hit the connector's per-call timeout — launch capture with `nohup ... & echo DONE > capture.done`
and poll for the sentinel, e.g.:

```bash
nohup bash -lc 'export PATH="$HOME/.nvm/versions/node/v24.11.0/bin:$PATH"; cd "$HOME/Documents/OpenELIS QA"; npx playwright test --project=docs > capture.log 2>&1; echo DONE > capture.done' >/dev/null 2>&1 &
# then poll: [ -f capture.done ] && echo COMPLETE || echo RUNNING ; tail -5 capture.log
```

## Run it
1. **Install the browser (once per machine):** `npx playwright install chromium`
2. **Authenticate (saves storage state to `.auth/user.json`):** `npx playwright test --project=setup`
3. **Capture all capabilities:** `npx playwright test --project=docs`  (run via nohup, see above)
   **Or one:** `npx playwright test --project=docs tests/docs/results-entry.docs.spec.ts`
4. **Verify media:** `find docs-media -name '*.png' | wc -l ; find docs-media -name '*.webm' | wc -l`
   then list per-folder counts. Optional HTML report: `npx playwright show-report`.

## Targeting an instance / credentials
- Instance: `BASE=https://testing.openelis-global.org` (default) or `BASE=https://indonesiademo.openelis-global.org`.
- Credentials default to `admin` / `adminADMIN!`; override with `OE_USER` / `OE_PASS` env vars.
  Do not paste real secrets into specs — pass them as env vars on the command.

## Capture a NEW page or feature
Edit the `SPECS` array in `scripts/author-doc-specs.mjs` — add an entry with the capability `id`,
a `name`, and `steps: [{ route, label }]` (find the route in `routes.md`), optionally `pii: [...]`
to mask extra selectors. Then:
```bash
node scripts/author-doc-specs.mjs        # regenerates tests/docs/*.docs.spec.ts
npx playwright test --project=docs tests/docs/<id>.docs.spec.ts
```
For a quick one-off of a single URL, you can also add a step to any spec; navigation is just
`go(page, '/SomeRoute')` then `shot(page, info, 'Label')`.

## Website screenshots
The `docs` project already renders at 1440×900, `deviceScaleFactor: 2` (retina-crisp), video on.
For website hero/marketing shots, take **full-page** shots (default) or crop to a panel with
`shot(page, info, 'Label', { target: mainPanel(page) })`. Keep PII masked (`DEFAULT_PII`, plus
per-spec `pii`). Deliver the PNGs from `docs-media/<id>/` to wherever the site assets live.

## Gotchas (learned the hard way)
- **Navigate by route, not by clicking nav text.** Side-nav anchors are render-hidden when the
  nav is collapsed (`visible=false`); `page.goto(route)` works (verified status 200 for all routes).
- **"Still There?" session-timeout modal** overlays the page on idle — `shot()`/`go()` call
  `dismissModals()` to clear it. If a new modal appears, add its button text to `dismissModals`.
- **Never `.click()` a Carbon checkbox** — it hangs ~60s. Use DOM / native-setter patterns.
- **`setup` project needs `testDir: '.'`** in `playwright.config.ts` (root-level `auth.setup.ts`
  is outside the global `./tests` dir). Already fixed; don't regress it.
- Media is **not committed** by default (`.gitignore` covers `docs-media/`, `.auth/`,
  `test-results/`). To publish, copy PNGs out to the gallery/site repo or attach to Confluence.

## Drift baselines & contracts (so a page can be watched for going stale)
When you capture a section for the manual, also register its **UI-drift contract** in
`docs-manual/contracts.json`: the section `id`, the `base` instance, `capturedVersion`, and per
`route` the on-load `anchors[]` (headings / field labels / buttons the screenshots depend on). The
captured PNGs in `docs-media/<id>/` are the visual baseline; the anchors are the structural baseline.
`tests/docs/drift.check.spec.ts` re-checks the anchors and writes `docs-manual/drift-report.json`,
which the weekly `openelis-docs-drift-weekly` task commits to `DIGI-UW/openelis-work` and the
**OpenELIS Doc Freshness Tracker** artifact displays. Prefer the anchor/structural check over raw
pixel-diffing for this data-driven app (lab numbers, dates, and dashboards change every run, so pixel
diffs false-positive). Keep anchors to stable on-load text.

## Done well =
Every targeted capability has ≥1 labeled PNG that shows the real screen (no session modal, PII
masked) plus a `walkthrough.webm`, and the run reports all specs passing.
