# EQA V2 — Design Critique + Harmonization

**Scope:** `eqa-v2-epic-and-stories.md` (Epic 1 + V2.1–V2.5) + `eqa-v2-preview.html` + `eqa-v1-crosswalk.md` + `eqa-v2-ept-platform-crosswalk.md`.

**Purpose:** Structural consistency scan before the V3 expansion work and the final UX copy + a11y pass. Focus is on harmonization and coverage gaps only — deeper UX copy and a11y findings are deferred to the end-stage polish pass.

**Method:** Five passes per the openelis-design `/analyze` taxonomy — i18n, Carbon fidelity, interaction patterns, constitution alignment, coverage gaps — plus a cross-story harmonization pass.

---

## Summary

V2.1–V2.5 stories are in strong shape: schema, state machines, ACs, and permission keys all trace cleanly. The preview mockup has a screen for each of the ten major FR clusters and two modals (panel receipt, blinding wizard). The remaining findings are narrow: one HIGH coverage gap and a handful of MEDIUM/LOW consistency drifts. Nothing in V2 blocks V3 expansion.

---

## Findings

| ID   | Pass         | Location                               | Issue                                                                                                                                                                                                                                                                                                                                                            | Severity | Fix                                                                                                                                                                                                                                                                                                                                                  |
|------|--------------|----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| F-01 | Coverage     | FR-V2.3-04 (per-analyst column)        | FR mandates an Analyst column on the standard result-entry grid when `scheme.per_analyst=true`, but the preview has no corresponding screen. Implementers have to imagine the insertion point from the FR text alone. This is a surgical edit to an existing page, not a new screen — but the docs should name the integration point explicitly.                 | HIGH     | Add a short "Standard result-entry integration" subsection to the FRS (under V2.3 or as a cross-cutting note) that names the existing result-entry page, the position of the new column (right of analyst-facing fields, before Actions), and the conditional-render rule. No mockup screen required — call it out so the eng lead doesn't miss it. |
| F-02 | Coverage     | FR-V2.4-13 (blind-code label sheet)    | Label PDF generation has no visual artifact — reasonable (it's a PDF, not a screen) but the preview has no "Print label sheet" button shown on the in-house blinding screen. A reviewer looking only at the preview won't find the affordance.                                                                                                                    | MEDIUM   | Add a secondary "Print label sheet" Button on the blinding screen tile header (post-seal state), mirroring the pattern from the provider shipment workbench. No modal — just a button that says it generates a PDF.                                                                                                                                  |
| F-03 | Coverage     | FR-V2.5-15 (repeat-shipment reprov.)   | Preview Receipt Monitor doesn't show the reprovisioning / "ship repeat" affordance for a participant that needs re-test.                                                                                                                                                                                                                                          | MEDIUM   | Add a "Send repeat" action in the Receipt Monitor row-level overflow menu for rows in `delivered` + `scored-unacceptable` state. Tooltip ties to FR-V2.5-15.                                                                                                                                                                                          |
| F-04 | Terminology  | V2.3 Follow-Up Queue Source column     | Source column enum values in FR-V2.3-02 are `External provider` / `In-house` / `Inter-lab split`, but the mockup row Tag values drifted in a prior revision. Verify strings match.                                                                                                                                                                               | LOW      | String sweep in `ReviewQueueScreen` / `FollowUpQueue` preview component; make sure exact strings match the FR.                                                                                                                                                                                                                                       |
| F-05 | Terminology  | Cycle state enum                       | FRS uses `ready_to_submit` (participant) and `ready_to_ship` (provider) — both correct. Crosswalk §7.2.9 still references `reviewed` once as a legacy label. No behavioral impact but confusing.                                                                                                                                                                  | LOW      | One-word edit in crosswalk §7.2.9: `reviewed` → `ready_to_submit` with a parenthetical note that `reviewed` was the prior name.                                                                                                                                                                                                                       |
| F-06 | Interaction  | V2.5 Provider IA                       | Sidebar lists "Provider Cycles" with three submenu items (Prep / Shipment / Receipt Monitor) but also lists "Schemes & Programs" as a sibling. In the FRS, Schemes & Programs hosts both participant-visible scheme config AND provider program setup. A provider admin clicking "Schemes & Programs" gets both; a participant-only user gets only the subset. | MEDIUM   | Document this role-conditional rendering in FR-V2.5-01 explicitly (not currently spelled out — preview has a helper hint but the FR doesn't). Add a note: "the same route renders a different sub-panel set based on whether the viewer has `eqa.provider.manage`."                                                                                  |
| F-07 | Carbon       | Preview `cds--btn`/`cds--tile` classes | 45 uses — consistent. `cds--tag` — 21 uses, consistent kinds. No anti-patterns found in spot checks. (Preview uses plain Carbon CSS classes per the preview pattern, which is correct.)                                                                                                                                                                           | —        | No action.                                                                                                                                                                                                                                                                                                                                           |
| F-08 | i18n         | Preview                                | Every rendered string is wrapped in `t(key, fallback)` in the preview. FRS Localization table coverage should be verified against the preview key set during the final polish pass.                                                                                                                                                                              | LOW      | Deferred to polish pass (task #66).                                                                                                                                                                                                                                                                                                                  |
| F-09 | Constitution | Design briefs                          | Every V2 story has a Design brief. Constitution Principle 7 satisfied.                                                                                                                                                                                                                                                                                           | —        | No action.                                                                                                                                                                                                                                                                                                                                           |
| F-10 | Coverage     | Preview `Enrollments` screen           | `EnrollmentsPlaceholder` in preview is intentionally stubbed ("Carbon port of V1 enrollment UI"). That's fine since Mozzy already ported the real thing per FR-V2.2-01, but a first-time reviewer of the preview alone may mistake it for a gap.                                                                                                                  | LOW      | Add a one-liner banner on the placeholder: "V1 enrollment UI already ported — this preview stub reserves the IA slot." Deferred to polish pass.                                                                                                                                                                                                      |
| F-11 | Harmony      | V2.4 + V2.5 share prep schema          | V2.4 (in-house blinding wizard Step 2) and V2.5 (provider Panel Wizard) both write the same `eqa_panel` source/inventory columns (FR-V2.1-17). Good harmonization — the spec calls it out. No divergence risk.                                                                                                                                                    | —        | No action.                                                                                                                                                                                                                                                                                                                                           |
| F-12 | Harmony      | Competency events                      | `eqa_analyst_competency_event` enum values in FR-V2.1-22, FR-V2.3-02, FR-V2.3-06, and FR-V2.4-14 are all consistent. `external_missed_deadline` vs `in_house_missed_deadline` distinction preserved everywhere. Good.                                                                                                                                             | —        | No action.                                                                                                                                                                                                                                                                                                                                           |
| F-13 | Harmony      | Permission keys                        | `eqa.manage`, `eqa.enter`, `eqa.review`, `eqa.triage`, `eqa.inhouse.*`, `eqa.provider.*`, `eqa.signoff` all defined and referenced consistently across FRs and ACs. The role-conditional rendering in F-06 is the only doc gap.                                                                                                                                   | —        | No action beyond F-06 fix.                                                                                                                                                                                                                                                                                                                           |
| F-14 | Coverage     | V2 Localization table                  | FRS has per-story i18n namespaces (FR-V2.2-10, FR-V2.3-11, FR-V2.4-12) but no consolidated Localization table at epic level. The FRS template calls for one. Each story's table covers its own keys, which is workable but not ideal for localizers who'd like a single sheet.                                                                                    | LOW      | Defer to polish pass — add a consolidated `en.json` / `fr.json` key table in an appendix to the FRS.                                                                                                                                                                                                                                                 |
| F-15 | Coverage     | V3 outlines (ties into next task)      | V3.1–V3.8 scope bullets are present, but no User stories, Design brief, or full ACs. Full expansion is task #65 and tracked separately.                                                                                                                                                                                                                          | (tracked) | Addressed by task #65.                                                                                                                                                                                                                                                                                                                              |

## Constitution violations

None. Principles 1–7 hold across V2.

## Recommended fix order

1. **F-01 — HIGH: Per-analyst column integration point.** Add to V2.3 FRS — small text edit, unblocks eng clarity.
2. **F-02 — MEDIUM: Label sheet button in preview.** Already specified in FR-V2.4-13, just missing from preview.
3. **F-03 — MEDIUM: Reprovisioning action in Receipt Monitor.** Already in FR-V2.5-15, just missing from preview.
4. **F-06 — MEDIUM: Document role-conditional rendering** on Schemes & Programs.
5. **F-04, F-05 — LOW:** String sweeps, defer-or-do-now.
6. **F-08, F-10, F-14 — LOW:** Deferred to polish pass (task #66).

## Notes for V3 expansion (task #65)

The V2 structure is the template. Each V3 story should acquire:

- 2–4 User stories (role / action / outcome).
- Design brief (Constitution Principle 7).
- Functional requirements (FR-V3.X-NN), with the same field-level detail as V2.1–V2.5.
- Acceptance criteria (AC-V3.X-NN), each testable.
- Non-functional.
- Permissions — reuse V2 keys where possible; name new ones with `eqa.*` prefix.
- i18n namespace.
- Definition of Done.
- Out of scope.

Two specific V3 items deserve front-loaded design briefs because they touch existing UI:

- **V3.1 (Analytics)** — extends V2.3 Lab Performance with a Trends sub-screen. Decide whether it's a new sidenav submenu child or a sub-view of Recent Cycles.
- **V3.5 (ISO 17043)** — extends V2.5 Panel Wizard mid-flow. Confirm the "ISO 17043 mode" toggle pattern before writing steps.

Also note: V3.7 (Proxy Entry) and V3.8 (ePT FHIR Interop) already have partial AC outlines — they need user stories, design briefs, and FR numbering, but the scope work is largely done.

---

## Polish pass closeout (2026-04-24)

Final polish pass (originally task #66) closed all five deferred LOW findings.

| ID | Status | Outcome |
|---|---|---|
| F-04 | ✅ Verified clean | Preview's Follow-Up Queue Tag strings (`External provider` / `In-house` / `Inter-lab split`) already match FR-V2.3-02 enum exactly. No edit needed. |
| F-05 | ✅ Fixed | `eqa-v1-crosswalk.md` §7.1 Q1 row rewritten: participant-result `submission_status` lifecycle (`draft → validated_partial → submitted → scored`) with a parenthetical note that the cycle-level `ready_to_submit` state was formerly labeled `reviewed`. |
| F-08 | ✅ Fixed | Preview `t(key, fallback)` set harvested and verified against the FRS; new Appendix A in `eqa-v2-epic-and-stories.md` documents every key. One deprecation noted: `eqa.shipment.*` (declared by FR-V2.5-11) was supplanted by `eqa.provider.ship.*` in the preview — deprecation captured in the appendix. |
| F-10 | ✅ Fixed | `EnrollmentsPlaceholder` in the preview now shows a Carbon `InlineNotification--info` banner above the placeholder tile: "V1 enrollment UI has already been ported to Carbon (per FR-V2.2-01). This preview stub reserves the IA slot only — the real screen lives in the shipped app." |
| F-14 | ✅ Fixed | New Appendix A in `eqa-v2-epic-and-stories.md` consolidates every story's i18n namespace declarations into one key registry, with English fallbacks and `fr` placeholders marked TBD. Convention, file layout, and CI-guard note documented. |

### A11y light-scan outcome

A light WCAG 2.1 AA scan ran on `eqa-v2-preview.html`. Three surgical fixes applied this pass; the rest are captured as an implementation-handoff list since the preview is a visual comp — the shipped app uses real `@carbon/react` components, which handle most a11y plumbing natively.

**Applied this pass:**

- **Modal dialogs.** `BlindingWizardModal` + `PanelReceiptModal` now carry `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` / `aria-describedby` pointing at the title + subtitle headings (which now have `id` attributes).
- **Breadcrumb landmark.** All `.breadcrumb` containers (12 screens) now have `role="navigation"` + `aria-label="Breadcrumb"`.
- **Search input.** The My Cycles filter input now carries `aria-label` since placeholder alone is not an accessible name.
- **Preview placeholder banner.** The new F-10 Enrollments banner uses `role="status"` and the Carbon `InlineNotification` markup out of the box.

**Handoff to implementation (shipped app should confirm):**

- **Form label association.** Every `<input>` and `<select>` needs either `<label htmlFor>` paired with a matching `id`, or an `aria-label` if the visual label is absent. In `@carbon/react`, `TextInput`/`Select`/`Dropdown` handle this automatically via their `labelText` prop — implementers just need to always set it.
- **Icon-only buttons.** Any ghost/icon button that renders only an emoji or icon needs `aria-label` (Carbon's `IconButton` forces this). Preview emojis in text-bearing buttons (e.g. `🖨 Print label sheet`) are acceptable since the text is the accessible name, but those emojis should be marked `aria-hidden="true"` in the ported component to prevent screen readers from announcing `printer Print label sheet`.
- **Sidenav active item.** The shipped Carbon `SideNavMenuItem` sets `aria-current="page"` on the active item. Confirm Carbon version in use surfaces this — older versions required a manual prop.
- **Focus-visible states.** Carbon v11 components ship with a high-contrast focus ring. Spot-check on a keyboard-only traversal during QA.
- **Color contrast.** Preview uses Carbon design tokens for all colors; spot-checks on the Tag kinds (`green`/`red`/`blue`/`purple`/`warm-gray`/`teal`) pass WCAG AA for both text and large-text contrast. No action needed.
- **Data table keyboard navigation.** Carbon `DataTable` ships with `role="grid"` + arrow-key traversal. Confirm the `expandedRow` pattern keeps focus on the expansion trigger after collapse (Carbon's `TableExpandRow` handles this).

Nothing in the a11y pass changes the FRS or the mockup functional surface — it is all implementation-phase hygiene.

### Task #66 closed.