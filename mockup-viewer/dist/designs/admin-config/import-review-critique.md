# Import Review: Design Critique, Rage Pass 3 and Proposed Layout

**Reviews:** `import-review-preview.html` (preview v0.3) against Import Review FRS v0.3 and Architecture v0.5
**Date:** 2026-10-20
**Method:** every scenario rendered in Chromium at 1440 px and 1024 px; contrast measured on the rendered page; findings checked against the FRS text. Earlier rounds (H-1 to H-17, Y-1 to Y-19) are not repeated. New findings here are numbered **Z-1 to Z-16**.
**Status:** applied on 2026-10-20 in Import Review FRS v0.4, preview v0.4, the new developer mockup (`import-review-mockup.jsx`) and Architecture v0.6. Casey decided RD-24 (Z-1), RD-25 (layout) and RD-26 (Z-16). The slicing guide is `reference-data-config-breakdown.md`.
**Stage:** refinement. Most of the rules are right. The open question is whether the page's layout lets a site lead act on them.

Each finding says whether it is a **preview** fix (the mockup differs from the FRS), a **spec** fix (the FRS needs to change) or a **decision** (Casey to choose).

---

## Overall impression

The rules underneath are now solid: one count model, answers saved as they are given, Apply safe on a dropped connection, Undo with its limits. The screen does not show them well. It is one long page that grows with the file. The things that block Apply are spread over about 4,000 px: decisions at the top, the guarded-field tick in the middle of Will change, and warnings only inside the confirmation modal. The summary is shown three times (sentence, nine tiles, bar).

The biggest opportunity is to collect everything that needs the user into a single to-do list at the top, and to collapse the rest of the review into sections that open on demand, instead of one long scroll. One catalog rule also needs to change for patient safety (Z-1).

---

## Usability

| # | Finding | Severity | Type | Recommendation |
|---|---|---|---|---|
| Z-1 | **A unit change on a test with results goes through on a tick.** Glucose moves from mg/dL to mmol/L with 12,400 results. The message reads "Past results will show the new unit", so a stored 90 would display as "90 mmol/L". A lab manager reads it as a relabel and ticks the box. "Create a new version of this test instead" is offered as an alternative, but it is not the default (FR-E6, Architecture 4.11). | Critical | Decision | A change of unit or result type on a test with results becomes a **decision under Needs your answer**, not a tick. The choices are **Create a new version of this test** (recommended) and **Same measurement, only the label changes**. The second choice is offered only when the two units are UCUM-equivalent (mg/dl and mg/dL, or ug and µg). Otherwise the row is Rejected unless the user picks a new version. |
| Z-2 | **Children lose their reference range without a word.** The ranges file lists only the adult band, so Child 1 to 17 and Infant under 1 show as Removed. After the import, glucose results for children have no range and are not flagged. Y-7 made the removed bands visible but does not say what is left uncovered. | Critical | Spec | Add a sense check (architecture 4.10): "After this import, Glucose has no normal range for: children 1 to 17, infants under 1. Their results will not be flagged." List it under Warnings, which need acknowledging (Z-5). Run the same check for sex: a band for M only leaves F uncovered. |
| Z-3 | **Apply is blocked by something the user cannot see.** The bar says "1 change needs your tick" in red. The checkbox is in Will change, about 1,500 px further down, with no link to it. The user scrolls the decisions, finds nothing wrong and cannot tell why Apply is grey. | Critical | Preview + spec | Every blocking item is a link that scrolls to it and moves focus there. Better still, use the to-do list in the proposed layout below. FR-H2 says only that "the bar says how many"; add "and links to the first one". |
| Z-4 | **"Too many questions" points to Export, but the page has none.** It says "add a code column (export first to get the codes)". The page is called **Import / Export**, yet the Upload step has no Export control. Apply shows "Apply 0 changes". The user is stuck. | Moderate | Preview + spec | Put **Export with codes** next to the explanation. It downloads the matching records with their codes in the file's column layout. Also show the Export panel on the Upload step, or rename the page if Export lives on the list pages. |
| Z-5 | **Warnings are ticked in the confirmation modal, after the user has scrolled past them.** "I have checked 3 warnings" is the last thing between the user and Apply, so it gets ticked out of habit. | Moderate | Spec | Acknowledge warnings where they are shown, one tick per check group, as with guarded fields. Count them in the to-do list. The modal restates the counts and needs nothing else, except the Replace confirmation. |
| Z-6 | **The riskiest bulk answer gets the strongest button.** In Several possible matches, **Create all as new** is the filled primary button. It is the answer that makes duplicates. In Possible renames, both group answers are tertiary. | Moderate | Preview | Make all group answers tertiary (or ghost) buttons with the same visual weight. No group answer should look like "the next step". FR-C3 already requires the reach line; keep it. |
| Z-7 | **The numbers disagree.** (a) The Will change pager says "1 to 11 of 32 · 25 per page · 1 of 2". (b) Catalog Replace: the alert says it "would deactivate the other 47" while the Deactivated tile says 1. (c) The summary says "updates 31" and the heading says "Will change 32 records" (31 updated and 1 reactivated, not explained). (d) The heading reads "1 records". | Moderate | Preview (a, b, d), spec (c) | (a, b, d) Fix the mock data; the preview must not contradict the count model the FRS sells. (c) The Will change heading uses the same clauses as the summary: "32 records: 31 updated, 1 reactivated". |
| Z-8 | **You must open every row to see what changes.** The column "Fields changing: 2" carries no information. With 31 updates that means 31 clicks. | Moderate | Spec | Rename the column **What changes** and show the field names ("Phone, Address"). When one field changes, show it inline: "Phone: +675 325 1190 → +675 325 1199". Expanding is only needed for ranges and children. |
| Z-9 | **Four controls do one job.** Will be deactivated (catalog) offers a "Keep selected active" link, row checkboxes, a "Keep active" checkbox per row, and "Make not orderable / Keep as is" radios. | Moderate | Preview + spec | One control per row: a radio group with **Deactivate** / **Make not orderable** (only when there are open analyses) / **Keep active**. Drop the selection checkboxes and the header link. A group answer **Keep all active** covers the bulk case, as in FR-C3. |
| Z-10 | **Possible renames take about 110 px per row as cards.** FR-C2 says a table. Six rows take 650 px; 30 rows would take 3,300 px. | Moderate | Preview | Build it as FR-C2 says: one row per line, with columns Line, In your file, Already in OpenELIS, Why matched, Answer. The two answers sit in the last column as a compact radio pair. |
| Z-11 | **"Registry" tag with no explanation.** Mount Hagen Provincial Hospital carries it, but nothing says what it means for the import. | Minor | Preview | Add a toggletip: "From the facility registry. Name, code and location come from the registry and are not changed by this file. Active status and local settings are." This is the "explain, don't lock" rule (RD). |

## Visual hierarchy

- **What draws the eye first:** the 20 px summary sentence. That is correct; it is the best element on the page.
- **What comes next:** the nine tiles, which repeat the sentence. Four to seven of them are greyed zeros. The tiles are buttons (filters, FR-B3), but they look like static numbers, so nobody finds the filter.
- **Reading flow:** summary, tiles, then a long unbroken scroll. Nothing tells the user "these 3 things are yours; the rest is for checking". The sticky bar is the only persistent guide, and its key message is red text without a link.
- **Emphasis:** the dark **Back** button is the heaviest element in the bar while Apply is disabled. "All answers saved" sits 2 px under the main message in 12 px green and reads as part of it.

## Consistency (Carbon and OpenELIS)

| Element | Issue | Recommendation |
|---|---|---|
| Apply bar button order | Apply is on the left and Back on the right. Carbon and other OpenELIS forms put primary on the right. | Back (secondary) on the left, Apply (primary) on the right. |
| Mode cards | Selection is shown by a blue border only. Carbon RadioTile adds a checkmark. | Use RadioTile with the checkmark. |
| Vocabulary (Z-12) | One idea has five names: "Needs decision" (tile), "Needs your answer" (section), "No answer" (tag), "wait for your answer" (bar), "without an answer" (count). Translators get five strings, and users wonder whether they are five things. | One term: **Needs your answer** for the tile and section, "{n} not answered yet" for counts and the tag. Update table 1 keys. |
| Tags | "Changes reports" (organizations) and "Changes past results" (catalog) use the same magenta, although one is a reporting change and the other a clinical one. | Catalog guarded tags use red (Carbon `red` tag); organization reporting changes stay magenta. |
| Decision rows | Renames use cards, Several possible matches uses a different layout, and the catalog Possible matches uses a third. | One table pattern for every decision group (FR-C2). |
| Pager | Text pager ("25 per page ▾ · ‹ 1 of 2 ›"). | Carbon Pagination component. |

## Accessibility

- **Colour contrast:** body and caption text pass (#6f6f6f on white, 5.0:1; "No answer" purple, 5.9:1; "1 change needs your tick", 7.8:1). **Zero tiles fail at 2.4:1** (#a8a8a8). They are information, not disabled controls, so the exemption does not apply. Use #6f6f6f.
- **Keyboard and screen reader:** decision rows are radiogroups named "Line 212, Tokarara Urban Clinic", and there is a live region. Good. Several possible matches rows are named "Line 155" only, without the name (FR-L5 requires both). The blocking tick is not reachable from the bar (Z-3).
- **Touch targets:** the expand chevrons (▸) are about 16 px. Carbon's expandable DataTable row uses a 32 px button.
- **Text:** 12 px captions are used for meaningful data (codes, open orders, "They share"). Use 14 px for anything the user decides on.

## What works well

- The summary sentence is in the user's words and is the first thing read.
- The "They share: Tokarara, same district" line under each rename tells the user why a match was suggested. It is the most useful line on the screen.
- Open orders and "Used by" sit next to every risky choice, so the impact is visible where the decision is made.
- The banners about rows waiting since 14 October and Joseph Kila's open preview on Upload stop two real failure modes before they happen.
- Recent imports with **Preview again with my answers** and **Answer the waiting rows** makes the run a durable object, not a single shot.

---

## Rage pass 3: what will make users angry

These are new in this round. They come from looking at the rendered screen, not the spec.

| # | Who, when | What happens | Why they rage | Fix |
|---|---|---|---|---|
| Z-1 | Lab manager, national catalog update | Ticks "I have checked all 1 change to Unit". A week later a clinician calls about a glucose of 90 mmol/L. | The system knew and let it through on a checkbox. | New version by default (above). |
| Z-2 | Paediatric ward, the morning after | Children's glucose results print with no range and no H/L flag. | Nothing on the preview mentioned children. | Range coverage warning. |
| Z-3 | Site lead, 9 answers done | Apply stays grey. They scroll up and down twice and give up. | "It says one change needs my tick. Which one?" | Linked blockers, to-do list. |
| Z-4 | Lead with a DHIS2 facility list | 312 questions; told to export first; no Export anywhere. | Dead end on a page with "Export" in its name. | Export with codes next to the message. |
| Z-6 | Lead in a hurry | Clicks the big blue **Create all as new** because it looks like the next step. 3 duplicate clinics. | The design pointed at it. | Equal-weight group answers. |
| Z-7 | Quality manager checking before Apply | Summary 31, heading 32, pager 11 of 32 on page 1 of 2. | "If the counts don't match, what else is wrong?" Trust in the preview, which is the whole point, is lost. | One count model shown once, labelled. |
| Z-8 | Lead reviewing a 300-row Ministry update | Opens 300 rows one by one to see which fields change. | 300 clicks for information that fits in a column. | What changes column. |
| Z-13 | Lead coming back after lunch | The page reopens at the top; the place in the list is lost. Five decisions in, they cannot see which groups are done without scrolling. | No overview of progress per group. | Per-group answered counts in the to-do list; reopen at the first unanswered item. |
| Z-14 | French-speaking user | "Needs decision", "Needs your answer" and "No answer" come out as three different French phrases. | Looks like three different states. | One term (above). |
| Z-15 | Any user on a 1,366 × 768 laptop (most common in labs) | The sticky bar and the page header leave about 500 px for content; one rename card fills a third of it. | Constant scrolling. | Table rows (Z-10), compact bar. |
| Z-16 | Lead who uploaded the wrong file | Looks for "Cancel this preview" on Review. There is only Back, which keeps the run open, and the next user sees "Open: Casey's preview…". | Can't throw away a mistake. | **Discard this preview** in the bar's overflow menu; the run is kept as Discarded in history. |

---

## Proposed layout: to-do first, review on demand

Two failures sit under most of the findings above: the user cannot see what is theirs to do, and the page gets longer with every row in the file. The proposal keeps every FRS rule and changes only how the review is arranged.

```
Import / Export                                        [Discard preview ▾]
This file adds 12 facilities and 6 wards / depts, updates 31,
reactivates 1 and leaves 1,767 unchanged.
organizations-png-2026-10.csv · Add & update · All answers saved

┌ Before you apply ───────────────────────────────── 3 of 5 done ┐
│ ✓ Possible renames            6 answered                       │
│ ● Several possible matches    3 not answered yet   [Answer]    │
│ ● Reporting code changes      4 to check           [Check]     │
│ ✓ Warnings                    3 checked                        │
│ ○ Optional: rows can wait. Unanswered rows stay waiting.       │
└────────────────────────────────────────────────────────────────┘

Show: [All outcomes ▾]                       Search by name or code [   ]
▾ Needs your answer · 3 not answered yet
┌ Several possible matches ──────────────── Create all as new · Skip all ┐
│ Line │ In your file          │ Candidates                │ Answer       │
│ 155  │ Kila Kila Clinic      │ Kilakila Clinic NCD-KIL…  │ (•) Use …    │
│      │                       │ Kila Kila HSC NCD-KKS…    │ ( ) Create … │
└───────────────────────────────────────────────────────────────────────┘
▸ Will change · 32 records: 31 updated, 1 reactivated
▸ New · 18 records
▸ Problems · 8 rejected, 3 warnings, 1 ignored
▸ Unchanged · 1,767 records
                                         [Back]  [Apply 50 changes]
```

1. **One "Before you apply" list** replaces the tiles and the scattered blockers. Its rows are the decision groups, the guarded-field ticks (or decisions, after Z-1), the warning groups and, in Replace, the deactivation review. Each row shows its own progress and an action that opens its section, scrolled to the item. When only optional items are left (unanswered rows that can wait, FR-C8), Apply is enabled and the list says so. The bar mirrors the list: "2 things left before you can apply · Show".
2. **Collapsible sections replace the long scroll and the nine tiles.** The sections keep the FR-B4 order. Each header carries its count in the summary's words. Needs your answer opens by default, and so does any section holding an open to-do item; the others start closed. A single **Show** dropdown above them filters to one outcome and maps one to one onto the existing `show=` deep links, so the tiles' filter job is kept. Unchanged loads only when opened. The page height no longer depends on the file. (OpenELIS does not use in-page tabs, so these are expandable sections, not tabs.)
3. **Every section is a DataTable** with the same toolbar: search, filter by field or reason, and Carbon Pagination. Decisions use the FR-C2 table (Z-10). Will change gets the What changes column (Z-8). Problems keeps its grouping by reason.
4. **Guarded and clinical items are decisions, not ticks.** The unit or result-type change moves into Needs your answer (Z-1). Range coverage gaps appear as warnings (Z-2), acknowledged in place (Z-5).
5. **The confirmation modal only restates.** Counts, what Undo cannot take back, and in Replace the "I understand {count} records will be deactivated" check. Nothing new is asked there.

**Alternative considered: one step per question type** (renames, then matches, then guarded changes, then warnings, then confirm). It focuses attention but hides the overview, and like tabs it is not an OpenELIS page pattern. Most files would have empty steps, and checking one answer means going back through a wizard. The to-do list gives the same focus without leaving the page, so it is the recommendation.

**FRS impact if adopted:** FR-B3 (tiles become the Show filter), FR-B4 (sections collapse; order unchanged), FR-E6 and FR-O2 (unit and result type become decisions), FR-G5 (range coverage check; warnings acknowledged in place), FR-H2 (modal asks only the Replace check), FR-L5 (to-do list and section headers in reading order; headers are disclosure buttons), table 1 keys (one term for unanswered; new keys for the to-do list, Discard, Export with codes), and ACs 1, 32, 49, 65.

---

## Decisions (made by Casey on 2026-10-20)

1. **Z-1:** a unit or result-type change on a test with results is a decision with a new version recommended, and a relabel is allowed only between equivalent units. **Decided: yes (RD-24).** Applied in Architecture 4.11, FR-E6, FR-O2 and FR-O8.
2. **Layout:** the to-do list and collapsible sections. **Decided: yes (RD-25).** Applied in FR-B3, FR-B4, FR-G5 and FR-H2.
3. **Z-16:** **Discard this preview**. **Decided: yes (RD-26).** Applied in FR-H7.

## Priority recommendations

1. **Make unit and result-type changes a decision, and add the range coverage warning** (Z-1, Z-2). These are the only findings that can hurt a patient.
2. **Adopt the "Before you apply" list and collapsible sections.** This one change fixes Z-3, Z-5, Z-7(c), Z-13 and Z-15, and removes the duplicate count displays.
3. **Clean up the preview:** the table layout for decisions, What changes column, one control per deactivated row, equal-weight group answers, Carbon button order, fixed counts and pager, one term for unanswered (Z-6 to Z-12).
