# Environmental and Vector Order Entry v4: Critique of FRS v0.1

Date: 2026-09-27. Reviewed against:
- ISO/IEC 17025:2017, the standard that applies to environmental and vector testing (ISO 15189 is clinical)
- EPA and TNI sample receipt practice
- the clinical v4 principles
- common data-entry UX practice

**Weight:** H = users will reject it or it creates wrong data. M = friction or an audit finding. L = polish.

## 1. What users will dislike or be confused by

| # | Issue | Why it bites | Proposal | Weight |
|---|---|---|---|---|
| U1 | **Big unsorted catches create hundreds of organism samples at intake.** A light trap can hold 300 to 1,000 mosquitoes, and C-6 creates `-1.1` to `-1.1000` before anyone has sorted them. | Slow saves, huge tables, and a label run nobody wants. The bench re-pools them anyway. | For an **Unsorted catch**, store the count only and create organism records when the bench sorts it (V-03). For a **Sorted pool**, create organisms at intake as specified. Organism labels are never printed by default. | H |
| U2 | **`-1.1` means three different things:** an aliquot, an environmental duplicate, or a mosquito. | People misread lists, reports and exports. | Every child row always carries its kind Tag (Aliquot, QC Duplicate, Organism). The kind is a column in every export, and QC appears on the label. | M |
| U3 | **A QC blank looks like a real sample.** `-5` sits among the client's samples. | Blank results end up on the client report, or get counted as a site result. | QC rows are left off client reports and site statistics by default, shown in their own report section, and sorted to the end of the table. | H |
| U4 | **Changing the default site after rows exist.** Does `-3` move too? | Silent changes, or none, are both surprising. | Changing the default updates only rows still marked "From order". The user sees "Updated 4 rows; 2 rows with their own site were not changed", with Undo. | M |
| U5 | **"Hold" reads as "on hold".** | Wrong mental model on a lab screen. | Label the column **Time to test**, with the tooltip "Holding time left". | M |
| U6 | **False temperature alarms.** Samples dropped off an hour after collection are still warm, even on ice. | Every same-day delivery raises an NCE, people learn to click past it, and the real problems hide. | Apply the EPA rule: received on ice within the lab's "same-day cooling" window (for example 4 h after collection) is **acceptable, with evidence of cooling**, not out of range. The window is set on the sample type. | H |
| U7 | **Reception measuring pH.** Many labs check pH at the bench, and volatile organic vials must never be opened at receipt. | The column gets skipped or faked. | Each preservation check has **Checked at bench** as an allowed answer. Volatile organic containers only ever offer headspace. | H |
| U8 | **Assigning rows to shipments one by one.** | Tedious with 3 coolers and 40 bottles. | Select rows, then **Assign to shipment**. New rows join the last shipment used. | M |
| U9 | **One compliance standard for a mixed batch.** A run can mix drinking water and wastewater. | Wrong limits are applied to some bottles. | The standard is chosen at order level, and each row can override it (a Standard column shown only when rows differ). | M |
| U10 | **Species "as submitted" treated as confirmed.** | Surveillance counts use unverified species. | Show "as submitted" wherever it appears (Tag, export column, report). V-03 identification replaces it and keeps the original. | M |
| U11 | **Sample check feels like a repeat of Enter Order**, now that receipt condition is captured on Enter Order. | Small labs see double work. | State the purpose: Enter Order records, Sample check is a second person verifying. Recommend Off for single-person benches in the setting's help text. | L |

## 2. ISO/IEC 17025 gaps

| # | Clause | Gap | Proposal | Weight |
|---|---|---|---|---|
| I1 | 7.4.3 | When an item is unsuitable (warm, broken, out of hold) and the lab proceeds, the **customer must be consulted and their instructions recorded**. A "recorded deviation" alone isn't enough. | Proceed asks for: customer contacted (who and when), their instruction (Proceed, Cancel, Resample), and a note. The report carries the disclaimer. | H |
| I2 | 7.1.1, 7.1.3 | **Review of requests.** The requested method and the **decision rule** for conformity statements must be agreed before work starts. | Each test gets a **Requested method** (defaults to the lab's method; when they differ, "Customer informed" is recorded). The compliance standard carries its decision rule, shown at order entry, and the order records "Decision rule agreed". | H |
| I3 | 7.3, 7.8.2.1 | **Who sampled.** When the laboratory sampled, the sampling plan and method must be recorded. When the customer sampled, the report must say that results apply to the sample as received. | An order-level **Sampled by** field: Laboratory (sampling plan reference, sampler) or Customer. It drives the report statement. | H |
| I4 | 7.4.1 | **Chain-of-custody discrepancies**: the form lists 20 bottles and 19 arrive, or an extra bottle arrives. | A row status of **Listed, not received**, and an "Extra, not on chain-of-custody" flag. Both raise an NCE, the customer is informed (I1), and the report states it. | H |
| I5 | 7.4.2, 7.4.4 | **Storage conditions** during holding must be monitored. Samples are stored cold, but nothing links storage to the cold-storage temperature records. | Storage locations that are cold-storage devices show their current status. An excursion flags the samples in them (links to the cold-storage module). | M |
| I6 | 6.4, 6.5 | **Thermometer traceability**: calibration status of the receipt thermometer. | The thermometer picker comes from the equipment list and warns when calibration is overdue. | M |
| I7 | 7.5 | **Receipt record**: who received, and who signed the chain-of-custody. | The receiver is recorded (clinical pattern). "Chain-of-custody signed by receiver" is recorded, with the scanned form attached. | M |
| I8 | 7.8.2.1 (e) | The report must show the **date of receipt** and the **sampling date**. For composites, it must show the sampling period. | Add composites (B1 below), and keep receipt and sampling dates in the presets and on the report. | M |

## 3. Best-practice gaps (EPA, TNI, surveillance)

| # | Gap | Proposal | Weight |
|---|---|---|---|
| B1 | **Composite samples.** A 24-hour wastewater composite has a collection **start and end**, and holding time starts at the end. | Each row has a Sample kind of **Grab** or **Composite**. A composite has a start and an end; hold, reports and export use the end. | H |
| B2 | **Late add-on tests.** A client phones to add a test after receipt. | Adding a test checks holding time at that moment and applies F3 if it is already exceeded. | M |
| B3 | **Duplicate submission.** The same field IDs come in again, as a resend or double entry. | Warn when a field ID already exists on an open order from the same requester in the last 30 days. | M |
| B4 | **Pool size limits.** Arbovirus pools are usually 50 or fewer. | A maximum pool size on the organism group or program, with a warning above it. | L |
| B5 | **Species not in the list.** | "Other (as submitted)" with free text, flagged for bench identification. | L |
| B6 | **Biosafety.** Vector specimens may carry live virus. | The organism group or program carries a biosafety note, shown at receipt and printed on the label when set. | L |
| B7 | **Qualifier codes.** Regulators expect standard flags (for example H for hold exceeded, and a temperature flag). | Qualifiers come from a configurable list, with a code and text. The presets export the code. | M |

## 4. UI and UX

| # | Issue | Proposal | Weight |
|---|---|---|---|
| X1 | **Batch speed.** 40 rows typed cell by cell. | Spreadsheet-style keyboard: Tab across cells, Enter down. **Paste from a spreadsheet** (clipboard columns into rows). Copy row and fill down move from phase 2 into the MVP. Scanning a client barcode fills Field ID. | H |
| X2 | **The receipt panel takes space when all is well.** | It collapses to one line: "1 shipment, 4.1 °C, on ice, seals intact". It expands automatically when anything is out of range. | M |
| X3 | **The live countdown with screen readers.** | Update every minute, not every second. Do not use a live region. Announce only when a row crosses into warning or exceeded. Colour always comes with text and an icon. | M |
| X4 | **A long page for large batches.** | Sticky table header and toolbar, a sticky To continue panel, and a jump-to filter for "Rows with problems". | M |
| X5 | **Receiving at a bench tablet.** | Must work at 1024 px wide. The row expansion holds overflow columns; the required ones stay (D-078). | L |
| X6 | **Jargon.** "Arrives as", "Sorted pool", "Field ID". | Keep them, but add one-line helper text on first use. Vector labs call it "Catch" or "Collection"; confirm with a vector user. | L |

## Recommended to fold in now

U1, U3, U6, U7, I1, I2, I3, I4, B1 and X1. The rest are FRS edits of a line or two. Candidate decisions:

- Organisms from an unsorted catch are created when the bench sorts it (amends C-6).
- QC rows never reach client reports by default.
- Proceeding past an unsuitable sample records the customer's instruction (17025 7.4.3).

---

# Round 2: critique of FRS v0.3 and the v0.3 preview (2026-09-28)

Measured on the preview: an 8-bottle environmental order is a page about 6,000 px tall at 1440 px wide. The samples table, which is the main work, starts about 60 % of the way down. The To continue checklist starts at 7 items.

## What users will hate or find too slow

| # | Issue | Proposal | Weight |
|---|---|---|---|
| R1 | **Waiting on a phone call blocks the whole order.** The customer instruction (EV-E7) is a complete-level item, and reception often can't reach the customer at intake. | The order completes. Only the affected tests get **On hold: awaiting customer instruction**, and those tests can't be released for testing until the instruction is recorded. The dashboard lists orders with held tests. | H |
| R2 | **One card per problem.** Three problems mean three cards and three identical phone-call records. | One **Record customer instruction** form covers all selected problems ("Applies to -2, -3, BTL-09"), with a per-row instruction only when they differ. | H |
| R3 | **Asking every time what doesn't change.** The decision rule agreement, Sampled by, requested methods and the thermometer are the same for a given client or program week after week. | These default from the **requester or program agreement** and the last order, filled visibly. Reception confirms by leaving them alone. The agreement is recorded once, on the requester or program (Locations & Organizations), not per order. | H |
| R4 | **The main task is buried.** Compliance, decision rule, collection conditions, receipt and customer instruction all sit above the samples. | Reorder to: order details, site and requester, **Samples**, then Receipt condition (collapsed to one line when fine), then the rest. Compliance and conditions collapse to a one-line summary once filled. Customer instruction is not a section; it is a panel opened from the problem. | H |
| R5 | **Tall rows.** Every row has two dropdowns, a stack of test Tags, "+ Add", 5 icons and status Tags, so only 5 to 6 rows fit on screen. A 40-bottle batch means constant scrolling. | Single-line compact rows: text cells with typeahead instead of dropdown widgets; tests as "3 tests" with a popover; statuses as one icon plus a short word. Target 15 or more rows on a 1080 px screen. | H |
| R6 | **Temperature required when it doesn't matter.** Soil or submitted objects often have no receipt range. | Temperature is required only when a row's sample type has a range. | M |
| R7 | **A preservation cell on every row.** Most read "Not needed". | Show the cell only for containers that need a check. Otherwise it is blank. | M |
| R8 | **Arrives as on every vector row.** Most submissions are all catches or all pools. | Set it once at the order level and override it on a row. | M |
| R9 | **The label grid for 40 bottles is another long table.** | Labels collapse to a one-line summary ("46 labels: 40 sample, 6 order") with Print all, and expand to edit. | M |

## What breaks UI and UX practice

| # | Practice | Where it breaks | Proposal | Weight |
|---|---|---|---|---|
| X7 | **Carbon batch actions.** Selection-dependent actions appear in the batch action bar only when rows are selected. | The toolbar shows 12 controls at all times (Hick's law). | The default toolbar is Add sample, Scan, Add blank and Paste. Selecting rows swaps in the batch bar: Print, Store, Refer out, NCE, Assign to shipment, Copy row, Fill down, Customer instruction. | H |
| X8 | **One signal per problem (alarm fatigue).** | A warm cooler shows in the receipt panel, a row tint, a row Tag, an instruction card, the checklist, and a prefilled NCE: six times. Rows are tinted red and yellow. | Show the problem in one place, on the row, as one icon plus a short word. The checklist links to it. No row tints; colour stays on the icon. The receipt panel shows only the measured value. | H |
| X9 | **Don't ask what the system can know.** | See R3. Also: sampler, collection method and weather are asked on every order. | Default from the requester, program or last order, shown visibly. | H |
| X10 | **Row actions: at most 3 visible icons** (Carbon data table guidance), with the rest in overflow. This is in tension with D-078. | 5 icons plus Tags on every row. | Two icons visible, Print and Report non-conformity, plus overflow. Refer out, duplicate and remove stay one click through the batch bar and the overflow. Amend D-078 to "one click, or one click from selection". | M |
| X11 | **A grid built from form widgets can't be driven by keyboard.** | Tab and Enter get trapped inside Carbon Select and ComboBox inside cells. | Cells are plain text until focused. Typing opens an inline typeahead. Enter commits and moves down. | H |
| X12 | **Progressive disclosure.** | The decision rule explainer, sampled-by statements and helper paragraphs are always open. | Helper text goes in a tooltip or an info icon, shown once per user and then collapsed. | M |
| X13 | **The checklist is far from the action.** | The To continue panel sits after Labels and Attachments. | It becomes a sticky panel beside the footer showing a count, and expands on click. | M |
| X14 | **Touch and click targets.** | Row icons at about 24 px, and the version badges. | 32 px minimum for icon buttons in compact rows; tooltips on every icon-only button. | M |
| X15 | **Consistency with clinical.** | Environmental adds a receipt panel and a customer instruction flow that clinical lacks, so the same user switching domains meets two layouts. | Build the receipt and instruction components once, as shared ones (EV-E6), and place them the same way in clinical when it adopts them. | L |

## Recommended to apply now

- **Workflow:** R1 to R5.
- **UI:** X7, X8, X9 and X11.
- **Decision changes to note:**
  - An unsuitable-sample hold applies to tests, not the order (amends EV-E7 and EV-I2).
  - Standing agreements live on the requester or program.
  - D-078 is amended to allow one click from selection.
