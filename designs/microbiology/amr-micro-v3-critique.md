# AMR Micro v3 preview: design critique

| | |
|---|---|
| **Reviewed** | `amr-micro-v3-preview.html` (spec draft 0.14, D-275 to D-280 applied), 2026-10-20 |
| **Method** | Rendered in headless Chromium at 1440 px; every view opened; key interactions clicked; DOM metrics (page height, controls, unlabelled inputs, button heights) |
| **Constraint** | Keep the V2 UI and UX (D-274). Recommendations are ranked by how little V2 they change. |

## Summary

v3 now sits cleanly on V2. R, I and S show once in the case, there is one notes mechanism, there is one place for suggestions, status is worked out rather than stored, and the admin pages reuse V2 patterns. Data integrity is the strongest area: every change to a report tick, rule note or suggestion lands on the Timeline. Final release is gated by the checklist and confirmed, and imports go through Import Review. The main weakness is the case view's length and hierarchy. The blood culture case is about 8,900 px (roughly ten screens at 900 px) with 94 buttons and 12 sections. The header shows two status-like fields (Stage and Status) and buries STAT priority. The release actions sit at the very bottom, and inline panels open below long tables, away from the control that opened them. Those are V2 traits that v3 inherited rather than introduced, so the fixes are layout changes, not new components.

## Strengths

1. **One source per fact.** The report tick, the reason it was set and the reading sit on the same AST row (D-276). Rule notes are ordinary notes (D-275). Status comes from the releases (D-277). There is less to keep in sync and less to explain.
2. **Every automatic decision is explained.** "Default for Enterobacterales from any sample type", "Cascade met: ceftriaxone is R", "Expert rule: Klebsiella, ampicillin always R". The tech always sees why.
3. **Release is protected the right way.** Partial release is one click and repeatable. Final release lists exactly what blocks it, then asks for confirmation because it locks the case (D-Q1).
4. **The Reporting Rules Preview** (try an isolate against panels, expert rules, suggestions and the report) lets an admin test a rule before a tech ever sees it. That is rare, and it is the right way to build trust in rules.

## Issues

| # | Severity | Where | Issue |
|---|---|---|---|
| 1 | **Major** | Case header | **Stage and Status overlap.** "Stage: AST in progress" sits next to "Status: Partial". Two fields answer "where is this case?". Stage is work progress and Status is release state, but the labels do not say so, and the worklist adds Tags as a third layer. |
| 2 | **Major** | Case view | **Length and wayfinding.** 12 sections and about 8,900 px, with no jump links and nothing sticky. Status is in the header and the release actions are at the bottom, ten screens apart. The tech who checks the checklist cannot see the case number or patient. |
| 3 | **Major** | Case view | **Inline panels open far from their trigger.** Notes on a run, Record reading and Notes on an isolate open below the whole table (below 12 antibiotic rows in AST). The tech clicks, sees nothing change on screen and has to scroll. |
| 4 | **Major** | AST table | **Repeated reason text.** "Report · rule: Enterobacterales, any sample type" is printed on 9 of 12 rows. The unusual rows (cascade met, expert rule, SDD) do not stand out from the routine ones. |
| 5 | **Major** | Header | **STAT is plain text** ("Priority STAT from the order") at the bottom of the header card. It should be a visible tag beside the case number. |
| 6 | Minor | Checklist | ✓ and ✗ glyphs carry pass and fail. These should be Carbon icons (CheckmarkFilled, Misuse) with text, which also read correctly to screen readers. |
| 7 | Minor | Accessibility | 4 to 6 unlabelled inputs per case view. ReleaseConfirm is a hand-built dialog with no focus trap, no Escape and no focus return. Use Carbon `Modal`. |
| 8 | Minor | Notes | The rule note's **Remove** is a ghost button. It removes printed content, so it should be `danger--ghost` with an undo toast, not a confirm (keeping it to one click matches D-Q1's spirit). |
| 9 | Minor | Suggestions | **Dismiss** asks for no reason. That is fine for speed, but surveillance labs may want an optional reason picker (Not indicated, Tested elsewhere, Other) for audit. |
| 10 | Minor | Naming | The breadcrumb says "Microbiology Reference Data" but the nav says "AMR reference data". The spec file is "reporting-profiles" but the page is "Reporting Rules". Pick one term for each. |
| 11 | Minor | Worklist | 2 buttons under 32 px high. On a bench screen used with gloves, row actions should be at least 32 px (Carbon `md`). |
| 12 | Minor | Mockup | 137 to 172 muted annotation lines per case view (FR references, "v3" chips, explanations) are mixed with product UI. Fine for review, but the JSX handoff must keep annotations in a toggleable layer so developers don't build them. |
| 13 | Minor | i18n | 286 `t()` keys, but many visible strings (table rows, helper text, admin seeds) are literals. Text expansion is a risk in narrow columns ("Susceptible dose-dependent (SDD)", "Why it starts ticked or not"). Check at 130% string length. |

## Recommendations

Ranked by value against how much V2 they change.

| Priority | Recommendation | V2 change |
|---|---|---|
| P1 | **Merge Stage into Status** (issue 1). Show one status tag (In progress, Partial, Final, Amended) with Stage as its subtitle ("Partial · AST in progress"). Keep tags beside it. Or rename Stage to "Work in progress" and Status to "Report". Either way, one glance answers one question. | Header text only |
| P1 | **Sticky case header and section jump bar** (issue 2). Keep the V2 header card. When it scrolls off, a slim bar shows the case number, patient, status tag, STAT tag, jump links to the 12 sections, and the Release partial / Release final buttons with the blocked count ("Final: 3 missing"). | Adds one sticky bar; sections unchanged |
| P1 | **Open panels in place** (issue 3). Use Carbon DataTable expandable rows: Record reading expands under the antibiotic row, and Notes expands under the run or isolate row. This is the same content V2 has, in a different spot. | Placement only |
| P2 | **Show the reason only when it is not the routine one** (issue 4). Rows ticked by the lab default or a plain Report rule show nothing. Cascade, expert rule, inferred, Don't report and manual changes show their reason. Hovering the tick (Toggletip) still gives the full rule. | Fewer words |
| P2 | **STAT as a red tag beside the case number** (issue 5), and on the sticky bar. | Tag |
| P2 | **Carbon icons, labels and Modal** (issues 6 and 7). | Component swaps |
| P3 | Danger-ghost Remove with undo (8), optional Dismiss reason (9), naming pass (10), 32 px row actions (11). | Small |
| Handoff | Annotation layer toggle in the JSX (12) and a 130% pseudo-locale check (13). | Handoff only |

## Score card

| Dimension | Score | Note |
|---|---|---|
| Clinical workflow fit | 4 / 5 | Default panels, one-click suggestions, inoculate adds the culture test, and batch inoculation on the worklist. Release actions at the bottom cost scrolling on every case. |
| Carbon compliance | 3 / 5 | Carbon tags, buttons and inline notification are used. The modal, expandable rows, icons and toggletips are hand-built or missing. |
| Information hierarchy | 3 / 5 | Explained defaults are excellent. Length, the Stage/Status overlap, buried STAT and repeated reasons cost scanability. |
| Accessibility | 3 / 5 | Text accompanies every color tag. There are unlabelled inputs, glyph-only pass/fail, and the dialog has no focus management. |
| Data integrity and safety | 5 / 5 | Every automatic and manual report change is on the Timeline. Final release is gated and confirmed. Rules have History and Preview, and imports go through Import Review with Undo. |

## Second pass: first impression, visual hierarchy, consistency (2026-10-20)

Run with the general design-critique framework. It adds measured contrast and a review of colour and component use to the workflow review above.

**First impression.** The case view (blood culture example, 1440 px) leads with the blue preview banner, then the large H1 case number, then a grey "Why this is one case" box that is design commentary, not product. On the first screen the strongest element after the case number is that annotation, while the case's status and STAT priority are small text inside the header card.

### Usability

| Finding | Severity | Recommendation |
|---|---|---|
| Stage and Status are two status fields in the header | Moderate | One status tag, with Stage as its subtitle |
| Release actions are about ten screens below the status | Moderate | Sticky bar with status, STAT, jump links and both release buttons |
| Record reading and Notes open below the whole table | Moderate | Expandable rows under the row that was clicked |
| 23 Edit buttons in a column on Reporting Rules; one Override per AST row | Minor | Row click to edit, or an overflow menu; keep Override as a row action but show it on hover and focus |

### Visual hierarchy

- **What draws the eye first:** the case number, which is correct, then a design annotation, which is not. The product's own state (Partial, STAT, what blocks final) is not visually emphasised.
- **Reading flow:** strictly top to bottom through 12 equal-weight sections. Every section header has the same weight, whether it needs action (Incoming results, AST awaiting validation) or not (Nonconformance, collapsed).
- **Emphasis:** a section that needs action should say so in its header (count or tag, as Incoming results already does with "1 waiting"), and sections with nothing to do should collapse by default.

### Consistency

| Element | Issue | Recommendation |
|---|---|---|
| Note box | The same grey left-border box is used for product messages ("Susceptibility differs from the sender's") and for design commentary ("Why this is one case") | Product messages use Carbon InlineNotification (info or warning); commentary goes in an annotation layer that can be hidden |
| Helper text | Field helper text is purple (#8a3ffc) and some is blue like a link ("Adjust panel (reason required if changed)"); Carbon helper text is $text-secondary | Use $text-secondary for helper text; use a real Link only where it navigates or opens something |
| Tag colours | Teal means Default panel, Expert rule, Added by rule and From rule; purple means Suggested, Referred, Pending and Received from | One colour per meaning: for example, blue for system-set (default, rule, expert), purple for referral states, gray for provenance |
| Status glyphs | ✓ and ✗ in the checklist; colour tags elsewhere | Carbon status icons with text, everywhere |
| Dialog | ReleaseConfirm is hand-built; everything else uses Carbon classes | Carbon Modal (danger = false, primary "Release final") |

### Accessibility

- **Colour contrast (measured):**
  - Pass: body text; muted #6f6f6f (5.0:1 on white, 4.6:1 on the grey note box); purple helper text (5.0:1); breadcrumbs (7.8:1); v3 chips (7.0:1).
  - Fail at 12 to 13 px: `.warn` #b28600 at 3.3:1, used for inline field warnings; `.dim` #8d8d8d at 3.3:1. Use $support-warning text #8e6a00 or Carbon's warning notification, and #6f6f6f for dim text.
- **Touch targets:** all case-view buttons are at least 32 px; 2 worklist controls are under 32 px.
- **Text readability:** 214 muted 12 px text runs and 24 inline 11 to 12 px sizes. Fine for annotation, small for product text such as rule reasons. Rule reasons and helper text should be at least 12 px with 16 px line height (Carbon helper-text-01), and fewer of them (show only non-routine reasons).
- **Labels:** 4 to 6 unlabelled inputs per case view; the dialog has no focus trap or Escape.

### What works well

- Numbered, collapsible sections in the order the work happens; the case reads like the bench process.
- One status tag colour per state (In progress blue, Partial teal, Final green, Amended magenta), always with text.
- Primary, secondary and ghost buttons are used consistently: one primary per area (Validate run, Release final).

### Priority recommendations

1. **Separate product from commentary.** Product messages become Carbon notifications; commentary moves to a hideable annotation layer. This also fixes the first impression and is required for a clean JSX handoff.
2. **Give the case state top billing.** One status tag with Stage as subtitle, STAT as a red tag next to the case number, and a sticky bar carrying both release buttons.
3. **One meaning per colour** for tags and helper text, and fix the two failing text colours.

## Applied (draft 0.15, 2026-10-20)

Recommendations 1 to 3 of the second pass, plus the matching first-pass items, are in the preview:

- Design commentary and version chips are a layer that is off by default ("Design notes" in the side nav); product messages are notices (D-282). With notes off, no commentary is visible on any view.
- One status tag with Stage as subtitle, STAT tag beside the case number, sticky case bar with section links and both release buttons ("Release final (3 missing)") (D-281).
- Tag colours have one meaning each, the checklist uses status icons with text, helper text is secondary grey, `.warn` and `.dim` pass 4.5:1, and the release confirmation traps focus, closes on Escape and returns focus (D-283).
- Added at Casey's request: a build map so Claude Code can see what exists and must not change (`amr-micro-v3-build-map.md`, `BUILD_MAP` and `data-build` in the preview).

First-pass issues 3, 4, 7 and 11 then fixed in draft 0.16 (D-284): Record reading and all Notes panels open as expanded rows under their row; only non-routine report reasons show (3 of 12 rows on the blood culture example); all inputs labelled (0 unlabelled on every view); all controls at least 32 px (0 under 32 px on every view). Remaining minor items: Remove as danger ghost with undo (8), optional Dismiss reason (9), naming pass (10), annotation and i18n handoff checks (12, 13).


## Applied (draft 0.18, 2026-10-20)

The remaining minor items are done (D-290): Dismiss takes an optional reason in the same click; admin names follow develop (Microbiology reference data, AST panels, Breakpoint standards, and the new AST rules section, which holds reporting and interpretation rules on one page, D-287). Narrow layout (D-289): no page scrolls sideways at 1024 px or 768 px; with 30% longer text nothing is clipped. Item 12 (annotation layer) was done in 0.15; item 13 (130% pseudo-locale) is now checked.

Later (draft 0.19, D-291): Casey noted OpenELIS never lets notes be removed, so the rule note Remove and Undo were taken out; rule notes follow the same rules as every note.
