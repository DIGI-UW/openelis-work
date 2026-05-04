# Quality in the Lab — A Narrative Walk-Through of QA & QC in OpenELIS

**Audience:** Anyone who needs to understand why a clinical lab cares so much about quality control — engineers, designers, project managers, donors, partner labs, QA officers new to the discipline.
**Author:** Casey Iiams-Hauser
**Date:** 2026-05-01
**Companion docs:** `qa-menu-roadmap.md`, `qa-v0.5-rehome-outline.md`, Piotr Mankowski's landscape review (Slack #oe-madagascar-internal, 2026-05-01)

---

## Preamble — what is "quality" in a lab, really?

A clinical laboratory's job is to give doctors numbers they can trust. A potassium of 4.2. A hemoglobin of 13.6. A culture growing E. coli. Nothing about the lab matters more than that those numbers are right.

The trouble is, *being right* is hard to prove from the inside. The lab can't simply do the test again and check — that's the same machine, the same reagent, the same analyst, on the same day. To know your numbers are trustworthy, you need to look at the lab from four different angles, each answering a slightly different question:

1. **Are the numbers from this analyzer-test-control-lot tuple still in tolerance?** *(Westgard / Internal QC.)*
2. **Has this reagent lot been verified before we use it?** *(Reagent QC.)*
3. **Did the technician run a daily control on this instrument today?** *(Analyzer Manual QC.)*
4. **Do our results match what an external program says they should be?** *(EQA / Proficiency Testing.)*

These are four separate lenses on the same question — *is the lab making valid measurements?* — and a serious lab does all four. ISO 15189 §7.7, the international standard for medical-lab quality, expects all four. The Madagascar GRIST requirements derive from §7.7. So do CAP and CLIA and the inspection regimes labs around the world live under.

When something goes wrong — a control out of range, a missed reagent verification, a failed EQA cycle — the lab has to investigate, fix, and prove the fix worked. That investigation is called an **NCE** (Non-Conformity Event). The fix is called a **CAPA** (Corrective and Preventive Action). The proof-of-fix is called an **Effectiveness Review**. These are how the lab learns.

The whole thing — the four lenses plus the NCE/CAPA cycle plus the records that prove all of it happened — is what people in the field call the lab's **QMS**, its Quality Management System. It's what an inspector audits. It's what an accreditor signs off on. It's what a hospital trusts.

This narrative is seven acts. The first four are the four lenses. The fifth is what happens when one of the lenses sees something wrong. The sixth is how the QA Officer keeps an eye on all of it day-to-day. The seventh is the morning of an inspection.

---

## Act 1 — *The drift before the disaster* (Westgard / Internal QC)

It's 6:47 AM in the chemistry lab. The first analyst on shift, Maria, hasn't taken off her coat yet. Before any patient sample touches the Architect ci8200, she runs three small bottles labeled *Level 1*, *Level 2*, *Level 3*. These are **control samples** — bottles of liquid with **known**, expected values for every analyte the analyzer measures. The lab gets them from the manufacturer in big lots; today's bottles are from lot 22417C, which the lab has been using for two months.

Maria doesn't watch the controls run. She makes coffee. By the time she comes back, the analyzer has reported potassium on the Level 1 control as 4.36 mmol/L. The expected value, established six weeks ago when the lot opened, is 4.30 with a standard deviation of 0.04. So today's run sits at +1.5 standard deviations from the mean.

That's fine. Anything within ±2 SD is fine, on its own. But Maria opens the **Levey-Jennings chart** — a running scatter plot of every Level 1 result for the last 20 days — and pauses. The last four mornings have been at +1.0, +1.4, +1.2, and +1.5 SD. Each individually unremarkable; together, a slow drift in the same direction.

This is what **Westgard rules** are for. The system flags the pattern: "**4-1s**: four consecutive results on the same side of the mean, all > 1 SD." Not a critical violation, but a *warning* — the analyzer is starting to drift. If the drift continues, by next week some patient results will be biased high in a way no individual run will detect.

Maria recalibrates the analyzer. Reruns Level 1. It comes back at 4.30, dead-on. She signs off the morning's QC. She makes a note in the system: "Recalibrated Architect ci8200 channel 4 (potassium) at 06:58 — 4-1s warning observed on lot 22417C, dawn shift."

Patient samples can now run. Nothing went out wrong. The drift was caught before any patient was affected.

This is **Westgard / Internal QC**. The lab uses control samples — substances with known expected values — and statistical rules to ask, every day: *are the numbers from this analyzer, on this test, with this control lot, still in tolerance?* The Westgard rules are the multi-rule statistical framework the field uses: 1-2s (warning), 1-3s (critical), 2-2s, R-4s, 4-1s, 10-x. Each rule has a specific failure mode it's designed to catch.

In OpenELIS, Westgard rules and Levey-Jennings charts live under the Statistical QC pillar of the new Quality Assurance menu, in the QC Dashboard.

---

## Act 2 — *A new lot arrives* (Reagent QC) — *future feature*

Tuesday afternoon, a courier drops off a flat box at Receiving. Inside: ten boxes of glucose reagent, lot **GL-26-04-117**, each box good for about 400 tests. The lab has been using lot 116; this is the next lot.

Reagents are how analyzers actually run tests. The glucose enzyme reagent is what reacts with the patient's serum to produce a measurable color change. Different lots are made on different days, with slightly different enzyme batches, and a careful lab does not assume the new lot performs identically to the old one. Even small differences in reagent activity can shift patient results in clinically meaningful ways.

So before the lab uses a single drop of lot 117 on a patient sample, the system requires **lot verification**: run a set of known control samples on the new lot and confirm that results match the old lot within a tolerance. The system tells Maria: "**New reagent lot GL-26-04-117. Run 4 verification samples (Levels 1, 2, 3, plus a peer-comparison reference) before clinical use.**"

She queues the verification samples on the analyzer. Twenty minutes later, the system compares the four results to expected values and to lot 116's recent mean. All four within tolerance. The system marks lot 117 verified, records who verified it (Maria), at what time, on which analyzer. Lot 116 stays available until it's depleted; from this point, either lot can run patient samples.

If the verification had failed — say, the Level 2 control read 0.5 mmol/L higher than expected — the system would have blocked lot 117 from clinical use until the lab investigated. Most often the answer is "ship the lot back, ask the manufacturer for a replacement." Sometimes the answer is "lot is fine, our analyzer's calibration is off; recalibrate." Either way the system tracks the question being asked, who asked it, what the answer was.

This is **Reagent QC**. The lens is: *has this reagent lot been verified before we use it on patients?* The mechanism is per-lot QC frequency tracking — a list, per lot, of which verifications are required and when. The data model is small (which lot, which controls, which analyzer, which user, which timestamp), but the consequence of skipping it is large: a bad lot can ruin a week of patient results before anyone notices.

In OpenELIS, Reagent QC is in design (`designs/quality/batch-workplan-reagent-qc.md` in DIGI-UW/openelis-work). Until it ships, the lab does this verification informally — a paper log, a lab supervisor's email reminders, an institutional habit. The placeholder leaf under the Statistical QC pillar in the new QA menu cross-links to the design doc so users can see where this is going.

---

## Act 3 — *The first thing the inspector asks* (Analyzer Manual QC) — *future feature*

7:00 AM, cytology bench. James, the day-shift cytotechnologist, sits down at the microscope. Before he looks at a single patient slide, he pulls a calibration slide out of a small drawer — a glass slide etched with a graticule of known dimensions. He places it on the stage, focuses, and confirms that the 100µm marking on the graticule reads 100µm in the eyepiece reticle. He clicks **PASS** on a tablet next to the microscope.

That's it. That's the entire workflow.

The system records: James, this microscope, today's date, PASS. If James had clicked FAIL — say, the calibration was off — the system would have blocked test orders on this microscope until a supervisor cleared it. James would have called maintenance.

It seems trivial. It is not. The first thing a CAP inspector asks when they walk into a lab is some version of: *show me your daily QC log for this instrument*. They want to see, for every day the lab claims to have run patient samples on this microscope, that someone signed off PASS or FAIL. Not "I think we did it." Not "I'm sure the night shift handled it." A signed log. Per instrument. Per day.

This is **Analyzer Manual QC**. The lens is: *did the technician run a control on this instrument today, and did it pass?* Different instruments have different daily checks — a microscope has a calibration slide, a hematology analyzer has a precision check on a control sample, a refrigerator has a temperature reading. The system holds them all to the same shape: a daily PASS/FAIL log with a signer, a timestamp, and a block on instrument use if FAIL.

It's the simplest of the four QC features. But the simplest is often the easiest to forget, and forgetting it is what fails inspections. The design doc lives at `designs/quality/analyzer-manual-qc.md` in DIGI-UW/openelis-work. The placeholder leaf under Statistical QC in the new QA menu links there.

---

## Act 4 — *The blind test from headquarters* (EQA / Proficiency Testing)

In April, a small box arrives at the lab from CAP — the College of American Pathologists, the largest accreditor for clinical labs in the United States. Inside: five tubes of plasma, labeled with sample IDs but not with expected values. CAP knows what's in them. The lab does not.

These are **EQA samples** — External Quality Assessment, also called Proficiency Testing or PT samples. The lab runs them through its analyzers exactly as if they were patient samples. The results don't go on any patient report. Instead, in May, the lab submits them back to CAP. In June, CAP grades the lab's results: how close was each one to the true value? Where did the lab fall in the distribution of all participating labs' results?

This is the only one of the four lenses that is truly external. The first three (Westgard, Reagent QC, Manual QC) are the lab checking *itself*. EQA is somebody else checking the lab. If the lab's potassium control is happily reporting 4.30 every day but a third of all other labs running the same EQA sample report 4.40 — the lab might be subtly wrong in a way none of its internal controls can detect. That's why §7.7 of ISO 15189 mandates EQA participation: it's the only lens that can catch *systematic, lab-wide* error.

The lab pays CAP for participation. CAP pays an entire department of staff to design samples, ship them, grade them, and publish the results. Several times a year, every clinical lab in the world that wants to be accredited goes through this cycle.

In OpenELIS, when a sample arrives marked `isEqaSample = true`, the system handles it exactly like any other sample with one critical exception: it does not let the result go on a real patient report. Results route to an EQA submission file instead. This was already done in OpenELIS V1 — the `isEqaSample` flag works today. The full EQA V2 build (My EQA, Lab Performance dashboard, Follow-Up Queue, Analyst Competency, Program Management) is in spec, with implementation in v10–v11 of the QA menu roadmap. Until then, the lab uses the existing EQA module under the new EQA pillar.

When the lab fails an EQA cycle — say, two of the five samples come back unsatisfactory — that triggers the next act.

---

## Act 5 — *When QC fails* (NCE → CAPA → Effectiveness Review)

A signal from any of the four lenses can start this story. For ours: Maria's morning Westgard 4-1s violation from Act 1 came back the next day as a 1-3s — a single result more than 3 SD from the mean, which is a critical violation. Patient samples get held. Maria opens an **NCE** (Non-Conformity Event).

An NCE is an investigation record. It captures the *what happened* (1-3s violation on Architect ci8200, channel 4, lot 22417C), the *immediate action* (samples held; recalibrate; rerun controls), the *trigger source* (which of 11 documented OpenELIS triggers fired this — in this case, QC invalidation), and the *severity* (Critical). It assigns to a person to investigate. It rides the affected sample as a flag downstream, so a clinician reading the eventual report sees that this result came from a run with a QC issue.

Maria investigates. She finds it: the chemistry fridge's overnight temperature dipped to 2°C three nights in a row. The reagent isn't supposed to go below 4°C. The cold-stress shifted the enzyme kinetics enough to bias the potassium readings high. Root cause identified.

She authors a **CAPA** — Corrective And Preventive Action. Two actions, actually: corrective ("Replace fridge thermometer; thermometer has been drifting"), and preventive ("Add daily temperature log, pre-printed on the lab's morning checklist; log auto-uploaded to the system"). Each CAPA gets an owner, a due date, and a category (Equipment / Process Change in this case).

Three weeks later, the corrective action is done — new thermometer in, daily log running, no further temperature excursions. The CAPA goes to **Closed — Pending Verification**.

Thirty days after that, the system prompts the QA Officer for an **Effectiveness Review**. She looks at the QC data for the past month: 28 days of in-control morning Westgard runs, no further drift, no 1-3s violations on the Architect for any analyte. She checks the new daily fridge log: 30 readings, all within range. She marks the CAPA *Effective*. The original NCE moves to **Closed — Verified**.

If she had marked the CAPA *Not Effective* — say, drift had recurred — the system would automatically open a new NCE linked to the original, marked as a *recurrence*. The original moves to **Closed — Recurrence**. The investigation continues.

This is **NCE / CAPA / Effectiveness Review**: the lab's learning loop. Every QC failure, every wrong patient result, every missed daily check — they all flow through this loop. Run it well and the lab gets quietly better, year over year. Run it poorly and the same problem keeps biting, and an inspector will eventually notice the pattern.

In OpenELIS, NCE is the Carbon-React modernization currently being built ("NCE v2"). It rehomes under the QMS & Improvement pillar of the new QA menu. CAPA and Effectiveness Review live inside the NCE detail.

---

## Act 6 — *The QA Officer's morning* (Quality Indicators)

7:50 AM, QA Officer's office. Sara has been the lab's QA Officer for three years. She has three children, an espresso machine, and a habit of starting every morning by opening one page on her computer.

That page is the **QI Dashboard** under the Quality Indicators pillar of the new QA menu. Four tiles — five once Critical Callback Compliance is opted in:

- **Average TAT** (turnaround time): 18h 47m, down 32 minutes from last month. *Acceptable.* She clicks in: Microbiology is the slowest at 61 hours, which makes sense — culture and sensitivity has biological time built in. Chemistry is at 18 hours; that's good, last summer it crept above 24 and she had to chase three sections to clean up holding times.
- **Rejection Rate**: 1.7%, down from 2.0% last month. *Within target* (target < 2%). She drills in: hemolysis is still the top reason at 38%, but Hematology — the worst category — has come down from 4.1% to 3.2% since the phlebotomy retraining she ordered three months ago. The retraining worked.
- **Amendment Rate**: 0.31%, up slightly from 0.26%. *Approaching action threshold* (target < 0.5%). Eight results amended this month after release. She doesn't drill in yet — the count is small enough that she'll wait another week before investigating.
- **NCE Pulse**: 5 critical NCEs pending acknowledgment. *Red.* All five are within their acknowledgment SLA, but she clicks in to check: three are from yesterday (a fridge incident, a hemolysis cluster, and a wrong-tube event from the ER); two are from earlier in the week and have been assigned. None are stuck. She acknowledges the three from yesterday so the analysts know they're seen.

That's most of her daily check. Eight minutes, four numbers, a sense of the lab's health.

The point of the QI Dashboard is not to surface emergencies — those route through alerts and pages directly. The point is to surface the *slow drift*: the rejection rate creeping up over months, the TAT slowly degrading on a busy section, the amendment rate edging toward the action threshold one week at a time. These patterns are invisible at the per-result level. They reveal themselves on the dashboard.

In OpenELIS, this dashboard is the v1 (MVP) deliverable of the new QA menu — the first net-new feature after the IA reorganization in v0.5. It launches with four tiles. Critical Callback Compliance opts in via QI Configuration in v8 for labs that need the fifth tile.

---

## Act 7 — *The morning of the inspection*

8:30 AM, Wednesday. The inspector arrives. She is from CAP, has been doing this for fifteen years, has seen every lab story imaginable. She has two hours scheduled with Sara before she rotates to the analyzer floor.

In the old workflow — pre-QA-menu — Sara would have had a binder. Or two binders. Or a folder of PDFs. The QC log lived in the Validation module, the EQA cycle results in a separate report, the NCE list under a top-level menu nobody could find, the audit trail in the Admin menu, the accreditation certificates in a filing cabinet behind her desk. To answer the inspector's question — *show me your evidence that this lab is operating in a state of quality control* — Sara would have spent ten minutes navigating, exporting, and reassembling.

In the new workflow — with the QA menu in place — Sara opens it once.

**Quality Assurance → QA Overview.** The page renders five questions ISO 15189:2022 expects every lab to be able to answer at any moment, with the lab's current answer next to each one:

> 1. **Are runs in control?** ✓ 47 of 47 runs in control, last review 2 days ago.
> 2. **How did EQA perform last cycle?** ✓ 4 of 4 schemes acceptable, cycle 2026-Q1 graded.
> 3. **Are QIs on target?** ⚠ 4 of 5 indicators within target — Amendment Rate amber.
> 4. **Open critical NCEs?** ✗ 5 critical pending acknowledgment — all within SLA.
> 5. **Accreditation status?** ⚠ ISO 15189 + CAP COM current; CAP GEN inspection due in 47 days.

Below the questions, four pillar tiles. Below those, a single click takes the inspector to the underlying detail for any answer she wants to verify. *Show me a Westgard violation from last week.* Click → QC Dashboard → Alerts. *Show me your most recent EQA scorecard.* Click → EQA → Lab Performance. *Show me how that critical NCE from last Friday was resolved.* Click → NCE Register → detail → CAPA tab → Effectiveness Review.

The inspector leaves at 10:32 AM. She tells Sara, on the way out, that she has rarely seen a lab that could navigate its own quality story this fast. The inspection writes up clean.

This is what the QA menu — every act of this story put together in one navigable surface — is for. Each individual feature already exists or is on its way; what was missing was the coherent home that lets a QA Officer or an inspector see the whole picture in three clicks.

ISO 15189 §7.7 is satisfied. CAP is satisfied. The lab passes.

The patients — the actual point of all of this — never knew anything was happening. Their potassium results came back right.

That's the whole job.

---

## How this connects to what we're building

The seven acts of this narrative map directly to the QA menu architecture:

| Act | Feature | Pillar in new QA menu | Status today |
|---|---|---|---|
| 1 | Westgard / Internal QC | Statistical QC → QC Dashboard | Merged into OpenELIS-Global-2 |
| 2 | Reagent QC | Statistical QC → Reagent QC *(future)* | Design doc only |
| 3 | Analyzer Manual QC | Statistical QC → Analyzer Manual QC *(future)* | Design doc only |
| 4 | EQA | EQA pillar | V1 done (`isEqaSample` flag); V2 in v10–v11 |
| 5 | NCE / CAPA / Effectiveness | QMS & Improvement → NCE Register | NCE v2 in progress |
| 6 | QI Dashboard | Quality Indicators → QI Dashboard | MVP in v1; full in v8 |
| 7 | The whole picture (QA Overview) | QA Overview (top of the QA menu) | v1 (MVP) ships an early version; full in v8 |

v0.5 — the first version of the QA menu that lands — gives every existing and in-progress feature a coherent home. v1 (MVP) adds the QI Dashboard. Subsequent versions fill in the rest. By the time v12 ships, every act in this story has a working surface in the system.

---

## Image generation prompts (one per act)

A consistent visual style across the seven images keeps the narrative cohesive. The recommended style:

> **Warm documentary photograph, soft natural light, shallow depth of field, muted color palette, 16:9 aspect ratio, focus on hands or environment over faces, 35mm film aesthetic.**

Each prompt below builds on that base. Add the style line to every prompt, or set it as a system-style if your image generator supports persistent style instructions.

---

### Act 1 — *The drift before the disaster*

> A close-up of a desktop computer screen in a clinical chemistry laboratory at dawn, displaying a Levey-Jennings control chart — a horizontal line graph of small dots scattered around a central mean line, with three of the rightmost dots clearly trending upward toward a +2 SD reference band. A coffee cup sits next to the keyboard. The light is cool blue from the window, warm yellow from the screen. A white-coated arm reaches into the frame from the left, holding a small bottle labeled "QC Level 1 — Lot 22417C." [Style line above.]

---

### Act 2 — *A new lot arrives*

> A medical laboratory technician's hands unboxing ten neatly stacked boxes of reagent kits on a stainless-steel benchtop. Each box is labeled with a barcode and a lot number "GL-26-04-117." A tablet on the bench displays a checklist titled "Lot Verification Required" with four unchecked boxes. Soft afternoon light from a side window. The technician's face is out of frame; only blue-gloved hands and the boxes are visible. [Style line above.]

---

### Act 3 — *The first thing the inspector asks*

> A cytotechnologist seated at a binocular microscope at a clinical lab bench, viewed from a three-quarter rear angle so their face is not visible. They are placing a thin glass calibration slide onto the microscope stage. A tablet to the right of the microscope shows a simple two-button interface: a large green "PASS" button and a smaller red "FAIL" button, with the heading "Daily Manual QC — Microscope #3 — 2026-05-01." Soft warm overhead light. [Style line above.]

---

### Act 4 — *The blind test from headquarters*

> A small white cardboard shipping box, opened, sitting on a clinical lab bench. Inside the box, five identical plasma sample tubes with bright orange caps, each labeled with a printed sample ID like "PT-26-Q2-A03" but no expected value. A folded letter from "College of American Pathologists" partially visible underneath. A hand in a blue glove reaches in to lift one of the tubes. Cool natural light from a north-facing window. [Style line above.]

---

### Act 5 — *When QC fails*

> A whiteboard or large notebook page in a quality officer's office, titled "NCE-20260105-0023 — Investigation" at the top. Beneath the title, a hand-drawn cause-and-effect diagram (fishbone) with branches labeled "Equipment / Reagent / Method / Personnel / Environment." Sticky notes and a temperature log printout are taped near the bottom. A coffee mug and a half-eaten croissant on the desk. Warm afternoon light through window blinds, casting horizontal stripes across the wall. [Style line above.]

---

### Act 6 — *The QA Officer's morning*

> A QA Officer's desk in a clinical laboratory, photographed from a slight side angle. On a 27-inch monitor, a clean dashboard interface with four large rectangular tiles arranged in a 2×2 grid: "Average TAT — 18h 47m," "Rejection Rate — 1.7%," "Amendment Rate — 0.31%," "NCE Pulse — 5 critical." Each tile shows a small trend arrow. Beside the monitor, a ceramic mug of espresso, a notebook open to a half-written page, and a small framed photograph of a child's drawing. Warm morning light from a window behind the monitor. [Style line above.]

---

### Act 7 — *The morning of the inspection*

> Two women in business-professional attire seated together at a small round meeting table in a clinical laboratory's office, viewed from a respectful distance so neither face is fully visible. One holds a CAP-branded clipboard; the other gestures at a laptop screen between them. The laptop displays a clean web page with a sidebar menu reading "Quality Assurance" and a main panel labeled "QA Overview" with five rows, each showing a question and an answer with a small status icon (✓ ⚠ ✗). On the wall behind them, framed accreditation certificates. Soft daylight from a large window. The mood is calm, professional, even slightly warm. [Style line above.]

---

## Optional bonus image — *the whole story in one frame*

If you want a single hero image for the top of a presentation or an article, this one stitches the four QC lenses into a single composition:

> A laboratory bench photographed from directly above, divided into four quadrants by faint dividers. Quadrant 1 (top-left): a Levey-Jennings chart on a tablet, with control bottles. Quadrant 2 (top-right): an unboxed reagent kit with a tablet showing "Lot Verification." Quadrant 3 (bottom-left): a microscope with a calibration slide and a "PASS / FAIL" tablet. Quadrant 4 (bottom-right): an EQA shipping box with sealed sample tubes. In the very center, where the quadrants meet, a single coffee mug sits as if forgotten there, anchoring the composition. Even, warm overhead light. [Style line above.]

---

*End of narrative.*
