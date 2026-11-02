# Spec Analysis: Analyzer Setup From a Real Result (v0.3)

| Field | Value |
|---|---|
| **Artifacts checked** | `analyzer-setup-from-traffic.md` (FRS v0.3), `analyzer-setup-from-traffic-preview.html`, `analyzer-setup-from-traffic.jsx` (main at 9e39eef, PR #378) |
| **Checked against** | decision log D-001 to D-372, spec registry, PR DIGI-UW/OpenELIS-Global-2#3443 privilege catalogue, OpenELIS-Global-2 `develop` code search |
| **Date** | 2026-10-28 |
| **Jira** | OGC-1573 (Epic OGC-1054) |

## Summary

The FRS is in good shape: Lab Context is concrete, every FR traces to a QA finding or a June FRS item, the no-matching-engine rule is stated once and followed, and nothing in it introduces a site selector, a hard delete or an unsearchable list. There are three things to fix before Piotr slices it. First, the privilege catalogue in #3443 seeds the Bridge account role (`Analyser Import`) with `analyzer:configure`, the same code this FRS gives to analyzer setup, so reusing it as written would give the Bridge account setup rights. Second, FR-I2 states its own resend rule while DEP-7 says it must follow Import v2. Third, the IA cites D-069, which D-360 amended two days earlier (the group is now labelled Instruments). The JSX also has three hard-coded breadcrumbs.

## Findings

| ID | Pass | Location | Issue | Severity | Fix |
|---|---|---|---|---|---|
| F-01 | J Access | FRS Access table | #3443 `specs/012-privilege-based-rbac/data-model.md` seeds role `Analyser Import` (the Bridge sign-in identity, D-044) with `analyzer:import` **and** `analyzer:configure`. The FRS nominates `analyzer:configure` for set up, connect, activate and undelivered handling, and says Analyser Import "gains nothing here". Both cannot hold. | HIGH | Either ask #3443 to drop `analyzer:configure` from the Analyser Import seed (the Bridge only needs `analyzer:import`), or nominate a separate setup code. Record the choice in the Access section. |
| F-02 | J Access | FRS Access table | Catalogue check done: `analyzer:configure`, `analyzer:import` and `result:enter` exist in #3443, so they are reuse, not NEW. `analyzer_type:manage` and `analyzer:map` are absent, so they are NEW. The catalogue's categories are single words (`extconnection`, `testcalc`), so `analyzer_type` breaks the pattern. | LOW | Mark `analyzer:configure` as existing. Rename `analyzer_type:manage` to `analyzertype:manage` (or fold it into an `analyzer:` action). Update the NEW list. |
| F-03 | M Crosscheck | FRS Navigation & URL; JSX header comment and breadcrumbs | The IA cites D-069 (Analyzers group: Analyzers, Analyzer Types, Import Issues). D-360 (2026-10-26) amends D-069: the group is labelled **Instruments**, with children Instruments, Analyzer Types, Import Issues, Maintenance. Routes stay `/analyzers`. | MEDIUM | Relabel the SideNav and breadcrumbs as Instruments and cite D-360. No route change. |
| F-04 | M / O | FRS FR-I2 vs DEP-7 | FR-I2 says a resend "replaces the held row (or offers Keep or Replace, per Import v2)". That is a default of its own, while DEP-7 says not to build a separate resend rule (OGC-288, OGC-1200, D-052, D-059). | HIGH | Reword FR-I2: a resend follows Import v2 Keep or Replace and the run model; this FRS adds only that a resend is never staged read-only with no message. |
| F-05 | A i18n | JSX lines 224, 313, 337 | Breadcrumb labels are hard-coded ("Home", "Analyzers", "Field Mappings / {name}"), while line 85 uses `t('label.home')`. Constitution Principle 1. | CRITICAL | Wrap them in `t()` with the same keys as line 85, plus a key for Field Mappings. |
| F-06 | A i18n | FRS Localization vs JSX | 30 keys used in the JSX are not in the Localization table: common.cancel, common.edit, common.remove, common.required, common.saveDraft, label.analyzer.connect.dataflow, label.analyzer.fix.saveRetry, label.analyzer.importIssues, label.analyzer.mapping.catalogTest, label.analyzer.protocol.file, label.analyzer.qc.condition, label.analyzer.qc.prefix, label.analyzer.retry, label.analyzer.review.remove, label.analyzer.scope.updateProfile, label.analyzer.setup.activate, label.analyzer.setup.connect, label.analyzer.setup.identify, label.analyzer.setup.verify, label.analyzer.type.create, label.analyzer.type.framing, label.analyzer.type.model, label.analyzer.type.name, label.analyzer.type.publish, label.analyzer.type.tests, label.analyzer.undelivered.title, label.analyzer.verify.againstType, label.analyzer.verify.confirm, label.analyzers, label.home. | MEDIUM | Run `npm run i18n:find` against OE2. Mark keys that already exist as existing, and add the rest to the table. A GitHub code search of `frontend/src/languages/en.json` for `label.analyzer` returned nothing, which may just be an index gap, so the local search is still needed. |
| F-07 | O Reuse | FRS DEP-1, DEP-1a, FR-A5, FR-A8 | Built mechanisms exist that the FRS doesn't name: `clinlims.analyzer.discovered_source_id` (unique, for "bridge-discovered analyzer stubs", OGC-526, `liquibase/3.4.14.x/009-analyzer-discovered-source-id.xml`), `analyzer_error.error_type = UNREGISTERED_SOURCE`, `AnalyzerDeliveryIssueService` and `DeliveryIssuesPanel.jsx`. These are the natural base for the claimable list and the stored identity. | MEDIUM | In DEP-1 and DEP-1a, name these as what the setup capture and identity extend. This partly answers Piotr's DEP-1 question. Ask whether `discovered_source_id` already holds the sender text and source address. |
| F-08 | O Reuse | FRS FR-A3b (Share with IT) | Checked: a printable view has a precedent, `frontend/src/components/workplan/batch/BatchWorkplanPrint.jsx` (browser print, no storage). | LOW | Cite it in FR-A3b so the sheet reuses that print pattern. |
| F-09 | E Coverage | Preview and JSX | Not drawn: FR-F4 "Leave without saving?", FR-F6 Reload saved draft, FR-I7 missing control lot notice. FR-F5 appears only in the preview. FR-I1 to FR-I8 (import review defects) are mostly not drawn. | MEDIUM | Either add one review-page scene, or state in the FRS that section I and FR-F4 to FR-F6 are behaviour fixes on existing screens and fence them as existing UI (D-063). |
| F-10 | L Lab Context | What Changes | "LIS" is used unexpanded ("the instrument's LIS settings"). | MEDIUM | Expand it on first use: LIS (Laboratory Information System). |
| F-11 | F Consistency | AC-2 vs FR-A3 | AC-2 says "the ask-your-administrator message"; FR-A3 and v0.3 say "Ask your IT person". | LOW | Change AC-2 to "the ask-your-IT-person message". |
| F-12 | F Consistency | FRS header; registry | The FRS title is "Analyzer Setup From a Real Result", but the registry and gallery name is "Analyzer Setup From Traffic". The companion artifacts list `analyzer-setup-from-traffic-mockup.jsx`, but the file is `analyzer-setup-from-traffic.jsx`. | LOW | Pick one name, and fix the file name in the header. |
| F-13 | M Crosscheck | FRS Information & Data, States | D-361 separates derived service status from `Analyzer.status` (connection state). The FRS states "Analyzer: SETUP, ACTIVE, INACTIVE" without saying which one it is. | LOW | Call it the connection state (`Analyzer.status`), and note that Instruments service status (D-361) is unchanged. |
| F-14 | D IA | FRS Navigation & URL | The live label and route of Import Issues (`/analyzers/errors`, seen titled "Undelivered results") are still unverified. QA's browser was logged out. | LOW | Verify on testing.openelis-global.org before build. Already flagged in the FRS. |

Passes with no findings: B Carbon (`ComboBox` for test search, `Select` only for short fixed option lists, `Modal` only for the destructive Remove-from-review confirm), C Interaction, G Invented data (new data is declared in DEP-1 to DEP-8), H Multitenancy (none), I Stubbed preview (six scenes, all populated), K (no breakdown file), N Docs (the Analyzer Types & Mapping registry row has no published manual page).

## Constitution Violations

F-05: hard-coded breadcrumb strings in the JSX (Principle 1, i18n).

## Recommended Fix Order

1. F-05 (JSX breadcrumbs).
2. F-01 (Analyser Import seed vs `analyzer:configure`; needs a decision with the #3443 authors), then F-04 (FR-I2 wording).
3. F-03, F-06, F-07, F-09, F-10.
4. F-02, F-08, F-11 to F-14.
