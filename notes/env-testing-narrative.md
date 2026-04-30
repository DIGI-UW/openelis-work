# How a Mall, a School District, and a Lab in Jakarta Use OpenELIS

*A team primer for the Environmental & Vector Testing module, told as a one-week story.*

---

## Cast

- **Bu Nadia Wijaya** — Lab Director, SILNAS Lab Jakarta. Owns compliance standards configuration. Drinks too much kopi tubruk.
- **Pak Aris Pratama** — Reception. Six years at the lab. Knows every cold-chain shortcut by heart. Hates messy CSVs.
- **Ibu Sari Kurniawan** — Senior Lab Technician. Runs the noise meter, the spectrophotometer, and the gossip channel.
- **Dr. Budi Santoso** — Validator. Signs nothing without reading it twice. Owns three pens. Distrusts auto-flags but appreciates good ones.

**This week's customers:**

- Plaza Senayan facility ops (a mall) — quarterly cooling-tower discharge compliance.
- Dinas Pendidikan DKI Jakarta, Water Safety Program — quarterly drinking-water testing across twelve public schools.

---

## Act 1 · Monday, 8:42 AM — Bu Nadia Sets the Stage

Bu Nadia opens **Admin → Compliance Standards**. She's bringing **PP No. 22/2021 — Baku Mutu Air Permukaan** online for the new fiscal year.

She clicks **+ Add Compliance Standard**. The form opens inline. Standard name: `PP No. 22/2021 — Baku Mutu Air Permukaan`. Regulation number: `PP No. 22/2021`. Version: `2021-01`. Issuing body: `Pemerintah Republik Indonesia`. Effective date set, status flipped to Active. Save.

The new standard appears in the list. She expands its row to reveal the Parameter Groups accordion and adds three groups by name: **Physical Parameters**, **Chemical Parameters**, **Microbiological Parameters**. The accordion now has three empty sections waiting for thresholds.

She uses the Quick Link workflow on each group. From the **Microbiological Parameters** accordion she clicks **+ Link Test**. A ComboBox pops; she types "total coli," selects **Total Coliform** from the test catalog, and the threshold add form expands inline, pre-populated with the standard and group. She picks Threshold Type = **Maximum**, enters Value = `5000`, Unit = `MPN/100mL`.

Then — and this is the part she's been waiting for — she expands the **Borderline window (optional)** section under the value inputs. PP No. 22/2021 says ≤ 5000 MPN/100mL is fine, but internally she wants a *yellow* flag at 4000+ so the lab can spot drift before it becomes a violation. She enters Borderline lower edge = `4000`. Inline help reminds her: results landing in the band emit a yellow `BORDERLINE` chip instead of green or red. Save. The threshold appears in the table with a teal `Range` Tag and a small yellow indicator showing it has a borderline window configured.

She repeats Quick Link for **pH** under Chemical Parameters (Range type, 6.0–9.0, no borderline — she lets the regulation speak for itself), **Turbidity** (Maximum 25 NTU), **Lead (Pb)** (Maximum 0.05 mg/L, borderline lower 0.04 — Lead deserves a heads-up before a violation), and a few more. The accordions fill up.

> 📘 **The spec says:** S-01 v1.2 §4.1 (standards list inline expansion), §4.2 (parameter groups accordion), §4.3 FR-3-013 / FR-3-014 (borderline window optional, conditional inputs by threshold type), and §4.4 FR-4-003 (Quick Link from parameter group → opens threshold add form pre-populated with the standard and group).

She repeats the whole flow for **Permenkes 32/2017 — Drinking Water Sanitation**. By the second standard, she's clicking through it from muscle memory. Two regulations now live in the system. Their thresholds — including the borderline windows — sit on `ComplianceThreshold` rows attached to tests in the catalog.

> 📘 *Side note for new deployments:* For the very first standards on a fresh install, dropping a pre-prepared CSV into `/data/compliance-standards/` is the faster bootstrap path — the seed loader does in 30 seconds what Bu Nadia just did in 20 minutes. The runtime CSV import button on the standards list does the same job for bulk additions later. Both paths are specced (S-01 §4.5 / §4.6) and accept the new borderline columns. Today Bu Nadia chose the GUI because she was adding two carefully-tuned standards and wanted to feel each threshold land.

Bu Nadia notices a quiet detail when she opens the regular Reference Range Admin: it doesn't show any of this. That page stays clean for clinical use only. There's a small banner pointing back to her: "Regulation-scoped thresholds live in Compliance Standard Admin."

> 📘 **The spec says:** S-05 v2.0 §4.3. Reference Range Admin = standalone only. Regulation-scoped thresholds live on `ComplianceThreshold` (S-01).

She closes the laptop. The lab is ready.

---

## Act 2 · Tuesday, 2:15 PM — The Mall Walks In

A man in a Plaza Senayan polo drops a small cooler on Pak Aris's desk. Three bottles inside, labeled `Cooling Tower Loop A`, `Cooling Tower Loop B`, `Make-up Water`. The mall's facility ops needs them tested against PP No. 22/2021 because their building permit requires periodic discharge compliance proof.

Pak Aris fires up **Order Entry**. Step 1 lays everything out on one page: branch, site, regulations, manifest, tests, conditions.

```
Step 1 — Branch & Order Setup
◉ Regulation-driven   ○ Ad-hoc
```

He clicks **Regulation-driven**. The site picker comes up — he ties this batch to the mall's registered site code `PSN-CT-01`. Then the Compliance Standards MultiSelect: he picks **PP No. 22/2021**. (Just one — most cooling-tower jobs are single-regulation.)

The Sample Manifest auto-populates with the sample types PP No. 22/2021 covers: Surface Water, Wastewater, Cooling Water, Drinking Water. He sets quantity = 3 for Cooling Water and leaves the others at 0.

The moment the manifest crosses ≥ 1 active sample, the **Test Plan** panel slides open. Every PP No. 22/2021 test linked to the active sample types is pre-checked already — pH, Turbidity, TDS, Total Coliform, Lead, Mercury, fourteen tests in all. No two-stack panel/test picker here; just a tidy list of what will run, each row tagged with the regulation that ordered it.

Two tests are quarantined in a yellow warning box at the bottom of the panel:

```
⚠ 2 tests blocked by missing sample types
   • BOD₅ needs Wastewater (st-001) — quantity is 0
     [+ Add 1 Wastewater to manifest]   [Skip this test]
   • Fecal Coliform needs Wastewater (st-001) — quantity is 0
     [+ Add 1 Wastewater to manifest]   [Skip this test]
```

The mall didn't bring any wastewater — it's not a discharge job. Pak Aris clicks **Skip this test** on the BOD₅ row, then again on the Fecal Coliform row. Both drop out of the order. The active test count ticks down from sixteen to fourteen.

> 📘 **The spec says:** S-03 §5.1.6.A. Each blocked-by-missing-sample row gets two affordances: `+ Add 1 {SampleType} to manifest` (jumps to the manifest, sets quantity to 1) and `Skip this test` (per-row, removes from order). No batch skip — fidelity to the actual designs means each blocked test gets its own decision.

> 📘 **The spec says:** S-03 §5.1.6.A. Regulation-driven branch shows a deduped Test Plan, all checked by default. Blocked-by-missing-sample tests appear in a separate warning region with `+ Add 1 to manifest` and `Skip this test` affordances. The full two-stack OE Order Panels + Order Tests picker is reserved for the ad-hoc branch (§5.1.6.B) where reception is choosing freely without a regulation as a guide.

Default collection conditions: Manual Grab, Cloudy, water temp 28.5 °C. Save. **Continue to Label & Store**.

Step 2 generates three sample rows. The UI is the same labeling and storage screen OpenELIS has always had — with two env-specific deltas. Sample Type is locked from Step 1, and the hold-time clock starts the moment he enters the collection date/time. None of the three sample rows is past its hold-time today.

> 📘 **The spec says:** S-03 §5.2. Step 2 reuses the existing OpenELIS label/storage pattern — no custom UI. Env-specific behaviors layered on: read-only sample type, hold-time clock starts at collection date/time, exceeded rows show a red indicator (not blocked, advances to Step 3 for NCE decision).

Step 3 he breezes through. No NCEs, one duplicate QC, batch submitted. Three bottles head to Ibu Sari's bench.

---

## Act 3 · Wednesday, 9:00 AM — A Bigger Story Arrives

Pak Aris's inbox has three messages from the **Dinas Pendidikan DKI Jakarta — Water Safety Program**. Their courier delivers a milk crate of twelve labeled sample bottles plus a CSV manifest the Dinas pre-printed.

This one is multi-regulation.

Why two? School water gets discharged eventually (PP No. 22/2021 — surface water cares), but more importantly the kids drink it (Permenkes 32/2017 — drinking-water sanitation cares). Both apply.

Pak Aris picks **Regulation-driven**, opens the MultiSelect, adds both. The Test Plan recomputes. PP No. 22/2021 contributes Turbidity, pH, TDS, Lead. Permenkes 32/2017 contributes Total Coliform, *E. coli*, Lead (already there — deduped), Mercury, Arsenic. Each row shows the regulation tags that cover it:

```
☑  pH                       LOINC 11558-4   [PP 22/2021] [Permenkes 32/2017]
☑  Total Dissolved Solids   LOINC 3745-7    [PP 22/2021]
☑  Lead (Pb)                LOINC 5671-0    [PP 22/2021] [Permenkes 32/2017]
☑  Total Coliform           LOINC 5794-0    [Permenkes 32/2017]
…
```

> 📘 **The spec says:** S-03 §5.1.5. Multi-regulation orders use a symmetric M:N `order_compliance_standard` join — no "primary" regulation, equal weight. The Test Plan §5.1.6.A renders the deduped union with coverage tags so reception can see which regulation ordered which test.

He uploads the Dinas CSV manifest. The dialog parses it: "Detected 12 samples — 12 Drinking Water. Apply to manifest?" Yes. Twelve sample-row entries appear. Continue, twelve barcode scans (Dinas pre-printed them), commit.

Two of the twelve had hold-time exceeded by the time he labeled them — one of the schools is up in the hills and the courier hit traffic. The Step 2 row indicator goes red on those two. Step 3 auto-pre-populates an NCE flag on each. Pak Aris confirms accept-with-flag, adds a note ("late delivery — hill route"), and the samples advance.

---

## Act 4 · Wednesday afternoon and Thursday — On the Bench

Ibu Sari runs the analyses. Most tests post results back automatically (the lab's TOC analyzer feeds OpenELIS via the integration she helped wire up last quarter). Total Coliform takes a day to incubate.

Thursday at 11 AM, results start coming in. She opens **Result Entry** for the school batch. A typical row looks like:

```
ENV-2026-0916.003   pH        7.4    [PASS — PP No. 22/2021]   [PASS — Permenkes 32/2017]
ENV-2026-0916.003   Lead      0.04   [PASS — PP No. 22/2021]   [BORDERLINE — Permenkes 32/2017]
ENV-2026-0916.007   Coliform  4200   [BORDERLINE — Permenkes 32/2017]
```

Each row carries one chip per applicable regulation. PASS in green. BORDERLINE in yellow. FAIL in red. INFO in cool-gray when no threshold applies.

Two things catch Ibu Sari's eye:

1. **School #3's Lead** is 0.04 mg/L. Fine for surface-water discharge (PP 22 limit = 0.05). Borderline against drinking water (Permenkes limit = 0.01, borderline window 0.005–0.01). Worth a heads-up to Dr. Budi.
2. **School #7's Total Coliform** is 4200 — exactly the kind of drift Bu Nadia configured the borderline window to catch. Permenkes still says ≤ 5000 is okay, but Bu Nadia's `borderline_lower = 4000` makes the chip yellow. Early warning.

> 📘 **The spec says:** S-05 v2.0 §4.5 FR-04a. One chip per applicable regulation per result row, format `STATUS — RegName`. Colors: PASS / BORDERLINE / FAIL / INFO. The chip color comes from the threshold's type (Max/Min/Range/Descriptive) plus its borderline window — both configured per-threshold in S-01 v1.2 (§4.3 FR-3-013).

For one of the schools she also runs a **Noise Pollution Survey** at the playground (Dinas added it because of construction next door). This test is multi-component (Heading °, Sound Pressure dB) and supports multiple readings. She enters Reading 1 — North face: 90°, 71 dB. The chips show `[INFO]` for the heading (no threshold applies to a compass bearing) and `[BORDERLINE — PP No. 41/1999]` for the dB level (limit 70, borderline 65–70). She clicks **+ Add reading** on the test header, gets a fresh empty reading group, enters Reading 2 — East face: 180°, 64 dB. Both readings display under their own labeled headers in the same table.

> 📘 **The spec says:** S-05 v2.0 §4.5 FR-04b. Tests with `allowsMultipleReadings = true` get a `+ Add reading` button on the test header that appends an empty reading group with the same component shape. Reading groups can be removed (with ≥1 always retained).

---

## Act 5 · Friday Morning — Dr. Budi Decides

Dr. Budi sits down with his three pens. He opens **Validation**. Same chips as Result Entry — read-side. He scans the school batch, sees most rows are green, the borderline lead jumps out, the noise survey reads cleanly, the borderline coliform hits the early-warning threshold but doesn't fail.

He approves all but School #3, which he sends back with a comment asking for a re-test on the Lead and a check on the building's plumbing age. The mall batch he validates without a hitch.

> 📘 **The spec says:** S-05 v2.0 §4.5 FR-04a. Same chip pattern on Validation as on Result Entry — same component, same data source, same colors. S-08 inherits — no separate validation UX is designed.

---

## Act 6 · Friday Afternoon — The Reports

Pak Aris opens **Reports → Laporan Hasil**. Two reports:

- **Plaza Senayan** — single-regulation header (PP No. 22/2021). All 14 results PASS. Clean PDF. He emails facility ops.
- **Dinas Pendidikan** — multi-regulation header (PP No. 22/2021 + Permenkes 32/2017). Per-result rows render the per-regulation chip pattern side by side. School #3 stays open pending re-test; the other eleven are reported. He uploads to the program's portal.

> 📘 **The spec says:** S-06 multi-regulation rendering. Report header lists every regulation the order was evaluated against. Result rows render the per-result chips side by side per regulation. Multi-component tests render their reading-group structure.

Friday 5:42 PM. Nadia closes the laptop. Cooler bottles head back to PSN. The Dinas portal pings the next steps for School #3. The lab earns its weekend.

---

## Curtain · The Spec Map

Each scene above ties to a spec the team has been building:

| Story moment | Spec |
|--------------|------|
| Bu Nadia adds the standard via the GUI + Quick Link to thresholds | **S-01** v1.2 §4.1 / §4.2 / §4.4 FR-4-003 |
| Bu Nadia configures borderline windows on Total Coliform + Lead | **S-01** v1.2 §4.3 FR-3-013 / FR-3-014 / FR-3-015 |
| (Side note) CSV seed for fresh installs | **S-01** v1.2 §4.5 (runtime) / §4.6 (seed) |
| The standalone Reference Range Admin still works as before | **S-05** v2.0 §4.3 |
| Pak Aris picks Regulation-driven, single regulation (mall) | **S-03** v2.0 §5.1.4 + §5.1.5 |
| Pak Aris picks two regulations for the school batch | **S-03** v2.0 §5.1.5 (MultiSelect, M:N join, no "primary") |
| Test Plan auto-loads with deduped union + reg tags | **S-03** v2.0 §5.1.6.A |
| Blocked-by-missing-sample warning, per-row `Skip this test` (BOD₅, Fecal Coliform) | **S-03** v2.0 §5.1.6.A |
| Step 2 inherits OpenELIS's existing label & storage UI | **S-03** v2.0 §5.2 |
| Hold-time clock starts on collection date/time | **S-03** v2.0 §5.2.2 |
| Hill-route NCE on hold-time exceeded | **S-03** v2.0 §5.3.1 |
| Per-regulation chips on result rows | **S-05** v2.0 §4.5 FR-04a |
| Borderline result fires from per-threshold config | **S-01** v1.2 + **S-05** v2.0 §4.2 (Path A evaluator) |
| Noise survey multi-component + dynamic reading groups | **S-05** v2.0 §4.5 FR-04b |
| Same chips on Validation | **S-05** v2.0 §4.5 FR-04a → **S-08** |
| Compliance report multi-regulation header + side-by-side rows | **S-06** multi-regulation rendering |

---

## The Takeaway

Five-sentence version of the loop:

1. Regulation goes in once (**S-01**) — UI or CSV, with optional borderline windows.
2. Order picks regulation(s) (**S-03**) — single or many, equal weight, deduped Test Plan auto-loads.
3. Evaluator runs each result against the regulation's `ComplianceThreshold` rows (**S-05** Path A); standalone `referenceRange` only fires when the order has no regulation (**S-05** Path B).
4. Reviewer sees the chips (**S-08** inherits **S-05**'s pattern).
5. Customer gets the report (**S-06**) with per-regulation chip rendering.

When you pick up a story for a sprint, a useful question is: *which scene am I in?* The spec map tells you which doc to open. The regulation chips tell you whether the lab is having a green Friday or a borderline one.

---

*Story is fictional. PP No. 22/2021, Permenkes 32/2017, and PP No. 41/1999 are real Indonesian regulations. Plaza Senayan exists; the cooling-tower job is invented. Any resemblance to actual lab kopi consumption is intentional.*
