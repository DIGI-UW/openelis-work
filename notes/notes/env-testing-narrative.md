# How a Mall, a School District, and a Lab in Jakarta Use OpenELIS

*A team primer for the Environmental & Vector Testing module, told as a one-week story.*

---

## Cast

- **Bu Nadia Wijaya** â Lab Director, SILNAS Lab Jakarta. Owns compliance standards configuration. Drinks too much kopi tubruk.
- **Pak Aris Pratama** â Reception. Six years at the lab. Knows every cold-chain shortcut by heart. Hates messy CSVs.
- **Ibu Sari Kurniawan** â Senior Lab Technician. Runs the noise meter, the spectrophotometer, and the gossip channel.
- **Dr. Budi Santoso** â Validator. Signs nothing without reading it twice. Owns three pens. Distrusts auto-flags but appreciates good ones.

**This week's customers:**

- Plaza Senayan facility ops (a mall) â quarterly cooling-tower discharge compliance.
- Dinas Pendidikan DKI Jakarta, Water Safety Program â quarterly drinking-water testing across twelve public schools.

---

## Act 1 Â· Monday, 8:42 AM â Bu Nadia Sets the Stage

Bu Nadia opens **Admin â Compliance Standards**. She's bringing **PP No. 22/2021 â Baku Mutu Air Permukaan** online for the new fiscal year.

She has two ways to do it. She could click through the UI and add each parameter (pH, Turbidity, Total Coliform, Leadâ¦), one threshold at a time. Or she could drop the CSV the consultant prepared into `/data/compliance-standards/` and let the seed loader take it from there.

She picks the CSV. The columns are familiar â `standard_name`, `regulation_number`, `version`, `parameter_group`, `test_loinc_code`, `threshold_type`, `value_lower`, `value_upper`, `unit` â plus three new optional ones added this year: `borderline_lower`, `borderline_upper`, `borderline_values`.

She set those last three deliberately. For Total Coliform, PP No. 22/2021 says â¤ 5000 MPN/100mL is fine. But internally she wants a *yellow* flag at 4000+ so the lab can spot drift before it becomes a violation. So she enters `borderline_lower = 4000` for that row. For pH she leaves them empty â she'll let the regulation speak for itself.

She drops the file in. On startup OpenELIS scans the directory, validates each row, creates the standard, marks it `isPreSeeded = true`, tags it with a teal "Default" pill in the admin. Bu Nadia goes for more coffee.

> ð **The spec says:** S-01 v1.2 Â§4.5 (Runtime CSV) and Â§4.6 (Deployment-Time Seed). Idempotent loading by `standard_name + regulation_number`. The three new optional borderline columns are FR-5-009 â backward-compatible: old CSV files without them load fine and produce PASS/FAIL-only thresholds.

She repeats the move for **Permenkes 32/2017 â Drinking Water Sanitation**. Two regulations alive in the system. Their thresholds â including the borderline windows â sit on `ComplianceThreshold` rows attached to tests in the catalog.

Bu Nadia notices a quiet detail when she opens the regular Reference Range Admin: it doesn't show any of this. That page stays clean for clinical use only. There's a small banner pointing back to her: "Regulation-scoped thresholds live in Compliance Standard Admin."

> ð **The spec says:** S-05 v2.0 Â§4.3. Reference Range Admin = standalone only. Regulation-scoped thresholds live on `ComplianceThreshold` (S-01).

She closes the laptop. The lab is ready.

---

## Act 2 Â· Tuesday, 2:15 PM â The Mall Walks In

A man in a Plaza Senayan polo drops a small cooler on Pak Aris's desk. Three bottles inside, labeled `Cooling Tower Loop A`, `Cooling Tower Loop B`, `Make-up Water`. The mall's facility ops needs them tested against PP No. 22/2021 because their building permit requires periodic discharge compliance proof.

Pak Aris fires up **Order Entry**. Step 1 lays everything out on one page: branch, site, regulations, manifest, tests, conditions.

```
Step 1 â Branch & Order Setup
â Regulation-driven   â Ad-hoc
```

He clicks **Regulation-driven**. The site picker comes up â he ties this batch to the mall's registered site code `PSN-CT-01`. Then the Compliance Standards MultiSelect: he picks **PP No. 22/2021**. (Just one â most cooling-tower jobs are single-regulation.)

The Sample Manifest auto-populates with the sample types PP No. 22/2021 covers: Surface Water, Wastewater, Cooling Water, Drinking Water. He sets quantity = 3 for Cooling Water and leaves the others at 0.

The moment the manifest crosses â¥ 1 active sample, the **Test Plan** panel slides open. Every PP No. 22/2021 test linked to the active sample types is pre-checked already â pH, Turbidity, TDS, Total Coliform, Lead, Mercury, fourteen tests in all. No two-stack panel/test picker here; just a tidy list of what will run, each row tagged with the regulation that ordered it.

Two tests are quarantined in a yellow warning box: BODâ and Fecal Coliform need a Wastewater sample, but the mall didn't bring any. Pak Aris hits **Skip these tests**. Done.

> ð **The spec says:** S-03 Â§5.1.6.A. Regulation-driven branch shows a deduped Test Plan, all checked by default. Blocked-by-missing-sample tests appear in a separate warning region with `+ Add 1 to manifest` and `Skip this test` affordances. The full two-stack OE Order Panels + Order Tests picker is reserved for the ad-hoc branch (Â§5.1.6.B) where reception is choosing freely without a regulation as a guide.

Default collection conditions: Manual Grab, Cloudy, water temp 28.5 Â°C. Save. **Continue to Label & Store**.

Step 2 generates three sample rows. The UI is the same labeling and storage screen OpenELIS has always had â with two env-specific deltas. Sample Type is locked from Step 1, and the hold-time clock starts the moment he enters the collection date/time. None of the three sample rows is past its hold-time today.

> ð **The spec says:** S-03 Â§5.2. Step 2 reuses the existing OpenELIS label/storage pattern â no custom UI. Env-specific behaviors layered on: read-only sample type, hold-time clock starts at collection date/time, exceeded rows show a red indicator (not blocked, advances to Step 3 for NCE decision).

Step 3 he breezes through. No NCEs, one duplicate QC, batch submitted. Three bottles head to Ibu Sari's bench.

---

## Act 3 Â· Wednesday, 9:00 AM â A Bigger Story Arrives

Pak Aris's inbox has three messages from the **Dinas Pendidikan DKI Jakarta â Water Safety Program**. Their courier delivers a milk crate of twelve labeled sample bottles plus a CSV manifest the Dinas pre-printed.

This one is multi-regulation.

Why two? School water gets discharged eventually (PP No. 22/2021 â surface water cares), but more importantly the kids drink it (Permenkes 32/2017 â drinking-water sanitation cares). Both apply.

Pak Aris picks **Regulation-driven**, opens the MultiSelect, adds both. The Test Plan recomputes. PP No. 22/2021 contributes Turbidity, pH, TDS, Lead. Permenkes 32/2017 contributes Total Coliform, *E. coli*, Lead (already there â deduped), Mercury, Arsenic. Each row shows the regulation tags that cover it:

```
â  pH                       LOINC 11558-4   [PP 22/2021] [Permenkes 32/2017]
â  Total Dissolved Solids   LOINC 3745-7    [PP 22/2021]
â  Lead (Pb)                LOINC 5671-0    [PP 22/2021] [Permenkes 32/2017]
â  Total Coliform           LOINC 5794-0    [Permenkes 32/2017]
â¦
```

> ð **The spec says:** S-03 Â§5.1.5. Multi-regulation orders use a symmetric M:N `order_compliance_standard` join â no "primary" regulation, equal weight. The Test Plan Â§5.1.6.A renders the deduped union with coverage tags so reception can see which regulation ordered which test.

He uploads the Dinas CSV manifest. The dialog parses it: "Detected 12 samples â 12 Drinking Water. Apply to manifest?" Yes. Twelve sample-row entries appear. Continue, twelve barcode scans (Dinas pre-printed them), commit.

Two of the twelve had hold-time exceeded by the time he labeled them â one of the schools is up in the hills and the courier hit traffic. The Step 2 row indicator goes red on those two. Step 3 auto-pre-populates an NCE flag on each. Pak Aris confirms accept-with-flag, adds a note ("late delivery â hill route"), and the samples advance.

---

## Act 4 Â· Wednesday afternoon and Thursday â On the Bench

Ibu Sari runs the analyses. Most tests post results back automatically (the lab's TOC analyzer feeds OpenELIS via the integration she helped wire up last quarter). Total Coliform takes a day to incubate.

Thursday at 11 AM, results start coming in. She opens **Result Entry** for the school batch. A typical row looks like:

```
ENV-2026-0916.003   pH        7.4    [PASS â PP No. 22/2021]   [PASS â Permenkes 32/2017]
ENV-2026-0916.003   Lead      0.04   [PASS â PP No. 22/2021]   [BORDERLINE â Permenkes 32/2017]
ENV-2026-0916.007   Coliform  4200   [BORDERLINE â Permenkes 32/2017]
```

Each row carries one chip per applicable regulation. PASS in green. BORDERLINE in yellow. FAIL in red. INFO in cool-gray when no threshold applies.

Two things catch Ibu Sari's eye:

1. **School #3's Lead** is 0.04 mg/L. Fine for surface-water discharge (PP 22 limit = 0.05). Borderline against drinking water (Permenkes limit = 0.01, borderline window 0.005â0.01). Worth a heads-up to Dr. Budi.
2. **School #7's Total Coliform** is 4200 â exactly the kind of drift Bu Nadia configured the borderline window to catch. Permenkes still says â¤ 5000 is okay, but Bu Nadia's `borderline_lower = 4000` makes the chip yellow. Early warning.

> ð **The spec says:** S-05 v2.0 Â§4.5 FR-04a. One chip per applicable regulation per result row, format `STATUS â RegName`. Colors: PASS / BORDERLINE / FAIL / INFO. The chip color comes from the threshold's type (Max/Min/Range/Descriptive) plus its borderline window â both configured per-threshold in S-01 v1.2 (Â§4.3 FR-3-013).

For one of the schools she also runs a **Noise Pollution Survey** at the playground (Dinas added it because of construction next door). This test is multi-component (Heading Â°, Sound Pressure dB) and supports multiple readings. She enters Reading 1 â North face: 90Â°, 71 dB. The chips show `[INFO]` for the heading (no threshold applies to a compass bearing) and `[BORDERLINE â PP No. 41/1999]` for the dB level (limit 70, borderline 65â70). She clicks **+ Add reading** on the test header, gets a fresh empty reading group, enters Reading 2 â East face: 180Â°, 64 dB. Both readings display under their own labeled headers in the same table.

> ð **The spec says:** S-05 v2.0 Â§4.5 FR-04b. Tests with `allowsMultipleReadings = true` get a `+ Add reading` button on the test header that appends an empty reading group with the same component shape. Reading groups can be removed (with â¥1 always retained).

---

## Act 5 Â· Friday Morning â Dr. Budi Decides

Dr. Budi sits down with his three pens. He opens **Validation**. Same chips as Result Entry â read-side. He scans the school batch, sees most rows are green, the borderline lead jumps out, the noise survey reads cleanly, the borderline coliform hits the early-warning threshold but doesn't fail.

He approves all but School #3, which he sends back with a comment asking for a re-test on the Lead and a check on the building's plumbing age. The mall batch he validates without a hitch.

> ð **The spec says:** S-05 v2.0 Â§4.5 FR-04a. Same chip pattern on Validation as on Result Entry â same component, same data source, same colors. S-08 inherits â no separate validation UX is designed.

---

## Act 6 Â· Friday Afternoon â The Reports

Pak Aris opens **Reports â Laporan Hasil**. Two reports:

- **Plaza Senayan** â single-regulation header (PP No. 22/2021). All 14 results PASS. Clean PDF. He emails facility ops.
- **Dinas Pendidikan** â multi-regulation header (PP No. 22/2021 + Permenkes 32/2017). Per-result rows render the per-regulation chip pattern side by side. School #3 stays open pending re-test; the other eleven are reported. He uploads to the program's portal.

> ð **The spec says:** S-06 multi-regulation rendering. Report header lists every regulation the order was evaluated against. Result rows render the per-result chips side by side per regulation. Multi-component tests render their reading-group structure.

Friday 5:42 PM. Nadia closes the laptop. Cooler bottles head back to PSN. The Dinas portal pings the next steps for School #3. The lab earns its weekend.

---

## Curtain Â· The Spec Map

Each scene above ties to a spec the team has been building:

| Story moment | Spec |
|--------------|------|
| Bu Nadia drops the regulation CSV in `/data/compliance-standards/` | **S-01** v1.2 Â§4.5 (runtime) / Â§4.6 (seed) |
| Bu Nadia configures borderline windows on Total Coliform | **S-01** v1.2 Â§4.3 FR-3-013 / FR-3-015 |
| The standalone Reference Range Admin still works as before | **S-05** v2.0 Â§4.3 |
| Pak Aris picks Regulation-driven, single regulation (mall) | **S-03** v2.0 Â§5.1.4 + Â§5.1.5 |
| Pak Aris picks two regulations for the school batch | **S-03** v2.0 Â§5.1.5 (MultiSelect, M:N join, no "primary") |
| Test Plan auto-loads with deduped union + reg tags | **S-03** v2.0 Â§5.1.6.A |
| Blocked-by-missing-sample warning (BODâ, Fecal Coliform) | **S-03** v2.0 Â§5.1.6.A |
| Step 2 inherits OpenELIS's existing label & storage UI | **S-03** v2.0 Â§5.2 |
| Hold-time clock starts on collection date/time | **S-03** v2.0 Â§5.2.2 |
| Hill-route NCE on hold-time exceeded | **S-03** v2.0 Â§5.3.1 |
| Per-regulation chips on result rows | **S-05** v2.0 Â§4.5 FR-04a |
| Borderline result fires from per-threshold config | **S-01** v1.2 + **S-05** v2.0 Â§4.2 (Path A evaluator) |
| Noise survey multi-component + dynamic reading groups | **S-05** v2.0 Â§4.5 FR-04b |
| Same chips on Validation | **S-05** v2.0 Â§4.5 FR-04a â **S-08** |
| Compliance report multi-regulation header + side-by-side rows | **S-06** multi-regulation rendering |

---

## The Takeaway

Five-sentence version of the loop:

1. Regulation goes in once (**S-01**) â UI or CSV, with optional borderline windows.
2. Order picks regulation(s) (**S-03**) â single or many, equal weight, deduped Test Plan auto-loads.
3. Evaluator runs each result against the regulation's `ComplianceThreshold` rows (**S-05** Path A); standalone `referenceRange` only fires when the order has no regulation (**S-05** Path B).
4. Reviewer sees the chips (**S-08** inherits **S-05**'s pattern).
5. Customer gets the report (**S-06**) with per-regulation chip rendering.

When you pick up a story for a sprint, a useful question is: *which scene am I in?* The spec map tells you which doc to open. The regulation chips tell you whether the lab is having a green Friday or a borderline one.

---

*Story is fictional. PP No. 22/2021, Permenkes 32/2017, and PP No. 41/1999 are real Indonesian regulations. Plaza Senayan exists; the cooling-tower job is invented. Any resemblance to actual lab kopi consumption is intentional.*
