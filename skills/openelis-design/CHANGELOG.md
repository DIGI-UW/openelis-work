# openelis-design — Changelog

## 2026-09-02 — monthly consolidation

**Constitution:** re-verified against upstream raw file — still v1.11.0, no re-sync needed.

**Decision log fixed, not just appended.** D-017 (EQA V2) had been left `provisional` even
though `current-state-gotchas.md` already recorded EQA V2 as built (verified 2026-08-01) —
marked **superseded**. More importantly: recovered two of Casey's real 2026-07-01 decisions
(`/breakdown` Epic-only, API & i18n reuse) that the 2026-08-01 pass's own CHANGELOG *claimed*
would land as D-043/D-044, but never actually did — those IDs were reused a few days later by
the unrelated analyzer-results-lab-unit-access work (D-043–D-045) without cross-checking the
earlier promise, so the two decisions had no row at all. Re-recorded as **D-049**/**D-050** —
and, checked against the actual shipped `SKILL.md`/`frs-template.md`, **neither is implemented**
yet (`/breakdown` still creates child Stories; the FRS template has no API & Data Reuse
section). This is the same "needs Casey, not an unattended judgment call" gap the 2026-08-01
CHANGELOG flagged for the `openelis-design-skill-src/` divergence — now pinned to exact
line numbers instead of a vague "SKILL.md bodies diverged" note.

**spec-registry.md corrected against GitHub**, not just left with stale `?`s: the Inventory
redesign's OGC-657 dependency (`PR #3840`) was recorded as "open" — it is actually **closed,
not merged** (2026-08-09, `mergeable_state: blocked`), no successor PR found. The Inventory
FRS's Storage-model dependency is therefore not delivered; flagged rather than silently carried
as "open."

**Not done (still needs Casey, carried forward again):** the SKILL.md `/breakdown` and
`frs-template.md` edits implementing D-049/D-050 — same class of judgment call the 2026-08-01
pass deferred for the `openelis-design-skill-src/` divergence, now scoped precisely (see
decision-log.md's 2026-09-02 note for exact line numbers). Recommend a dedicated session,
not another unattended pass, since it changes what `/breakdown` and `/specify` actually output.

**Live-app re-verification deferred this cycle** (unattended run — authenticated session/JS
extraction blocked by tool-use policy in the browser tool; cross-confirmed the front-end build
hash is unchanged since 2026-08-26 via the `openelis-qa-tracker` artifact's own 2026-09-01
probe instead of re-probing directly). Route table, admin-ia-inventory, and verified-data-models
carry their 2026-08-01 last-confirmed status.


## 2026-08-01 — monthly consolidation

**Decision log unblocked.** Applied `upload/decision-log-additions.md` (D-035…D-042) *and* the
missing D-028…D-034 test-catalog data-model rows, both of which existed only in the untracked
working copy at `OpenELIS Feature Design/openelis-design-skill-src/`. Resolved the
D-028/D-029 **ID collision** that had blocked three consecutive gallery-ledger runs: the
test-catalog rows keep D-028/D-029 (cited by ID elsewhere) and the two orphaned 2026-07-01
process decisions land as **D-043** (Epic-only `/breakdown`) and **D-044** (API & i18n reuse).

**Three decisions superseded against live verification** on `testing.openelis-global.org`:
- D-017 → **D-045**: EQA V2 is built (`/rest/eqa/programs`, `/…/enrollments`, `/my-programs`, `/orders/summary` all 200).
- D-018 → **D-046**: Test↔Reagent linkage is built (`/rest/test-catalog/{testId}/reagents` 200; the flat `/rest/reagents` 404s).
- D-019 → **D-047**: configurable Label Preset Management is built (`/MasterListsPage/labelPresets`).
- New **D-048**: alert acknowledgment is built; only per-*result* critical ack remains.

**Route inventory rebuilt from the shipped router.** Extracted all `Route,{path:…}`
declarations from the live bundle instead of guessing at HTTP status (a SPA 200s on
everything). Six documented routes are wrong or nonexistent — `/Inventory` (really
`/inventory`), `/Storage/samples` (really `/Storage/sample-items`), `/AuditLog` + `/SystemLog`
(really `/AuditTrailReport`), `/ResultsByPatient`, `/ResultsByOrder`, `/LOINCManagement` — and
three admin `editorKey`s are stale (`eqaProgram`, `barcodeConfiguration`, `testManagement`).
`/MasterListsPage/menuConfiguration` is genuinely absent, which explains BUG-49.

**Constitution pointer resynced 1.10.0 → 1.11.0.** The re-sync trigger fired: upstream
amended Principle VII on 2026-07-15 (commit `496c910`) with a mandatory **i18n Key Reuse &
Hygiene** section, after finding `en.json` had grown 2,385 → 7,133 keys with ~25% duplicates
and ~35% orphans. This makes D-044's reuse-first Localization table a *constitutional*
requirement — minting a near-synonym key is now a CRITICAL `/analyze` finding, and
`openelis-ui-vocabulary` is the tool for it. The July label discrepancy (footer 1.9.1 vs
pointer 1.10.0) resolved itself upstream; noted separately that upstream's amendment log
still stops at v1.9.1, so read the `**Version**` line rather than that list.

**Also:** spec-registry gained Inventory redesign, QA/QC (Westgard) and Test catalog data
model rows; carbon-anti-patterns gained the D-042 acknowledge-to-quiet refinement of P-16 and
the D-037 managed-lookup-vs-tag guidance.

**Not done (needs Casey):** the untracked `openelis-design-skill-src/` SKILL.md has diverged
from the committed one (63KB vs 60KB, plus `docs-spine.md` and `test-catalog-data-model.md`
that don't exist in the repo). Only the decision rows were promoted this cycle; reconciling
the SKILL.md bodies is a judgement call, not an unattended one.


## 2026-07-01 — Monthly consolidation pass

- constitution.md pointer: added a **2026-07-01 verification note**. Upstream governance footer
  currently reads Version 1.9.1 (Last Amended 2026-04-05) with Principle X present; that label is
  lower than the recorded 1.10.0, so the re-sync trigger did not fire. Flagged the version-label
  mismatch to reconcile with repo owners; principles I–X unchanged.
- current-state-gotchas.md: promoted the **home-dashboard domain-filtering gap** from auto-memory
  (order entry is domain-scoped today; dashboard Domain filtering is not built). Noted order-entry
  domain scoping on the Domain-enum line. Added a dated re-confirmation footer; live-app route
  re-verification deferred (unattended run, instance gated at login).
- decision-log.md: re-confirmed provisional **D-017** (EQA V2 still not built); no decisions
  superseded, none newly promoted (domain delta is a current-state fact, not a new decision).
- spec-registry.md: reviewed; no new FRS this cycle, `?` cells left as-is (no confirmed values).
- Repackaged the root openelis-design.skill bundle from the current tree.

## 2026-06-26 (v3.3) — Specs stay implementation-free; tickets scoped to user value

- Removed all implementation direction from the spec path. `/analyze` Passes K (Audit Trail)
  and L (Envers) deleted; remaining passes relabeled so A–M stay contiguous (Breakdown→K,
  Lab Context→L, Cross-Feature→M; "Pass O" references updated).
- `/specify` Stage 2 "Permissions & Audit" brief item is now "Access" — who can use the
  feature and do what, in terms of existing roles; no audit_trail/Envers/permission-key/
  Spring Security/Roles Builder mechanics.
- `/breakdown` now slices and titles strictly by user value: principle 2 forbids splitting a
  version *or a story* by technical layer; new anti-patterns for layer-split stories and
  technical-layer titles; story-point rubric, examples, and coverage check reworded to
  user-facing capabilities; cross-cutting = localization + access only.
- references/permissions-and-audit.md rewritten as "Access & Roles" (no audit/Envers).
- references/frs-template.md: "Data Model" → "Information & Data" (domain terms, traces to
  real data); "Permissions & Audit" → "Access"; URL pattern corrected to /MasterListsPage/
  <editorKey>; Dependencies reworded off "services/entities".
- references/jira-template.md: title-format and rules require user-scoped stories (no
  backend/API vs frontend/UI split); cross-cutting lines drop audit_trail/Envers; route fixed.
- Repackaged the root bundle from the current tree (now includes ogc-workflow.md, previously
  missing).


- 2026-06-23 — Added references/ogc-workflow.md and updated jira-conventions.md for the now-LIVE OGC Lean workflow (Acceptance gate, Reject Count, Contract field, per-Epic Feature Doc).

## 2026-06-18 (round 4) — First /crosscheck run folded back in

- Ran /crosscheck on the Analyzer Types & Mapping FRS (vs Analyzer Maintenance FRS).
- spec-registry.md: added the **Analyzer Maintenance & Service** row; enriched the
  **Analyzer Types & Mapping** row (routes, shared concepts, up/downstream deps); added
  Alerts-model and Analyzers-IA hotspots.
- decision-log.md: added **D-027** (Analyzers is a top-level SideNav group; per-analyzer
  detail uses `/analyzers/{id}/<subpage>`) to resolve the two specs' IA disagreement.
- SKILL.md /crosscheck output format tuned: Verdict now leads with a clear/⚠/blocked call;
  Contradictions section sits above Overlaps; "You may be forgetting" scoped to build-once
  items not already tabled; added a Registry-upkeep section to the template.


## 2026-06-18 (round 3) — Portfolio awareness: /crosscheck + decision log + spec registry

- New command **/crosscheck**: scans a feature (early at brief time, and as /analyze Pass O)
  for (1) overlap with other specs, (2) contradiction of prior decisions, (3) up/downstream
  dependency gaps. Commands table is now Seven; chain is /clarify → /crosscheck → /specify
  → /analyze → /checklist → /breakdown.
- `references/decision-log.md` — ADR-lite ledger seeded with 26 decisions from memory
  (GLOBAL + FEATURE scope, active/superseded/provisional). /crosscheck cites these by ID.
- `references/spec-registry.md` — overlap/dependency index, one row per feature (entities,
  routes, shared concepts, up/downstream deps). Seeded from known specs; many cells TODO.
- /analyze gains Pass O (cross-feature overlap & contradiction).
- /specify and /breakdown now have a closing "registry upkeep" step so the index stays fed.
- Reference Files table lists all 10 references.


## 2026-06-18 (round 2) — Memory promoted into references + verified IA

- Added `references/verified-data-models.md` — field-verified data models (App/Common
  Properties, Site Info, Validation, WorkPlan, Order/Patient Entry, Menu Config, Test
  Notification, Test Catalog Alerts) so /specify reuses real fields (design-addendum MUST A).
- Promoted `references/module-inventory.md` and `references/current-state-gotchas.md` from
  draft stubs to populated (Jira anchors OGC-527/899/1031/556, referral URL, EQA V2,
  reagent linkage, label presets, known-broken routes from QA).
- Added `references/jira-conventions.md` — clickable links, Done≠shipped, PR-sized slicing
  for Claude Code, labels, no-emoji-in-funder-docs, reorg proposal (unapplied).
- Added `references/admin-ia-inventory.md` — self-contained verified admin route snapshot
  (no longer depends on the openelis-test-catalog-qa skill being loaded).
- **Corrected the admin URL pattern** in SKILL.md: live app uses path-segment
  `/MasterListsPage/<editorKey>` (e.g. `/MasterListsPage/commonproperties`), NOT the old
  `?type=` query form. Updated IA section, examples, and JSX route comment.
- Updated the Reference Files table to list all 8 references.


## 2026-06-18 — Reference docs added + governance consolidation
- Added the support files SKILL.md referenced but that weren't shipped in the bundle:
  - `references/carbon-anti-patterns.md` (full catalog)
  - `references/frs-template.md`, `references/jira-template.md` (complete templates)
  - `references/permissions-and-audit.md`, `references/current-state-gotchas.md`,
    `references/module-inventory.md` (DRAFT — populated from known facts, marked for verify)
  - `memory/constitution.md` (pointer to upstream + design-relevant summary)
  - `memory/design-addendum.md` (consolidated)
- Constitution wired in as a pointer to
  `DIGI-UW/OpenELIS-Global-2/.specify/memory/constitution.md` (synced v1.10.0, 2026-04-06),
  with a re-sync trigger so it can't silently drift.
- Removed the "Constitution Amendment (proposed)" block that was pasted into the middle of
  the `/analyze` section; its two principles (No-Hard-Delete, Design-for-Large-Catalogs)
  now live in `memory/design-addendum.md`, referenced from `/analyze` Pass D.
- Updated the top governance-load block and Reference Files table to match.

> DRAFT reference files (`permissions-and-audit`, `current-state-gotchas`,
> `module-inventory`) contain TODO markers — verify against the live app/codebase and
> replace with confirmed content.
