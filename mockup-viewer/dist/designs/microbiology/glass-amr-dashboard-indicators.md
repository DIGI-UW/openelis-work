# AMR dashboard indicators — the content layer on W3

**Version** 1.0 · **Date** 2026-08-08 · **Status** Draft for review
**Companion to** `glass-on-aspect-parity.md` v2.0 · **Extends** `designs/reports/disease-surveillance-dashboard.md` v1.0
**Jira** OGC-918 / OGC-794

> Tags: **[WHO]** required or defined by the GLASS manual 2023 (9789240076600) · **[ASPECT]** from the Aspect gap analysis / engagement scope · **[REC]** design opinion.

---

## 1. What this document is, and what it is not

**[ASPECT]** W3 commits the *pipe*: *"OHS FHIR Data Pipes → warehouse → Superset/Power BI dashboards; DHIS2 push scoped; spec refreshed."* The gap analysis notes the dashboard draft spec *"needs a refresh"* — that draft is `disease-surveillance-dashboard.md` v1.0 (March 2026).

Reading v1.0: it is a **FHIR publication-completeness specification**. Its functional requirements are §4.1 DiagnosticReport, §4.2 Observation, §4.3 ServiceRequest (for TAT), §4.4 Device (equipment utilization), §4.5 Organization hierarchy (geography), §4.6–4.7 admin configuration, §4.8 navigation. It defines **what must exist in the FHIR store for dashboards to be possible**. It defines **no indicator**.

That is a reasonable division and this document does not disturb it. This is the AMR **content layer**: which questions the dashboards answer, what each number is made of, and what must therefore be published to FHIR that v1.0 does not yet require.

**Not in scope here.** The GLASS submission itself — periodic, WHO-format, produced for a human to upload — is a different surface with different constraints (`glass-submission-console.html`). The failure mode worth naming once more: **a country can have excellent AMR dashboards and still be unable to submit to GLASS**, because submission needs line-level records, first-isolate de-duplication and denominators that a dashboard warehouse does not by itself provide.

---

## 2. The publication gap this exposes

**[REC]** Mapping the indicators in §3–§5 back to FHIR surfaces a concrete finding: **three resource types AMR depends on are absent from v1.0's completeness requirements.**

| Resource | In v1.0? | Why AMR needs it |
|---|---|---|
| `DiagnosticReport` | ✅ §4.1 | The micro report |
| `Observation` | ✅ §4.2 | Carries organism ID and each AST result — the core AMR datum |
| `ServiceRequest` | ✅ §4.3 (for TAT) | **Also carries test *intent*** — needed to keep stool-for-O&P and genital-swab-for-microscopy out of the denominator |
| `Organization` | ✅ §4.5 (geography) | Site attribution and stratification |
| `Device` | ✅ §4.4 | Not AMR-relevant; retained for equipment panels |
| **`Specimen`** | ❌ **absent** | GLASS is stratified by **specimen group** (blood / urine / stool / genital / urethral-cervical). Without it, no GLASS-conformant breakdown is possible at all |
| **`Patient` demographics** | ❌ **absent** | **[WHO]** age group and sex are required stratifications for both RIS and SAMPLE |
| **`Encounter`** | ❌ **absent** | The natural FHIR home for **admission date**, which drives `INFECTION_ORIGIN` (`HO`/`CO`/`UNK`) — the hospital- vs community-acquired split |

**[REC] These three should be added to the refreshed publication spec.** They are cheap to state now and expensive to retrofit: if the warehouse is built without `Specimen` and `Patient` demographics, every AMR panel below is unbuildable and the discovery happens after the pipeline is in production.

---

## 3. Core AMR indicators

**[WHO]** GLASS reports two fundamentally different things, and conflating them is the most common analytical error in AMR surveillance.

### 3.1 Proportion of resistance (%R) — the percentage

> Of the isolates tested for this pathogen–antibiotic combination, what share were resistant?

| | |
|---|---|
| **Numerator** | First isolates with interpretation `R` for the pathogen–antibiotic combination |
| **Denominator** | First isolates of that pathogen **tested against that antibiotic** — not all isolates of the pathogen |
| **Source** | RIS dataset |
| **Needs negatives?** | No |

**[REC] The denominator trap to guard against in the warehouse.** It is per *pathogen–antibiotic pair*, not per pathogen. If a lab tests 200 *E. coli* isolates but only 120 against ciprofloxacin, the ciprofloxacin denominator is 120. Dividing by 200 understates resistance, and the error is invisible in the output. Every %R panel must show its own denominator beside the percentage.

**[REC] Suppress small denominators.** Below a configurable threshold (30 is a common convention) show the counts and withhold the percentage. A "67% resistant" built on 3 isolates will be read as a crisis and quoted in a meeting.

### 3.2 Frequency of infection — the rate

> How many people in this population had a confirmed bloodstream infection with this pathogen?

| | |
|---|---|
| **Numerator** | Patients with a confirmed infection by the pathogen |
| **Denominator** | **Population under surveillance** — requires the SAMPLE dataset plus a catchment population |
| **Source** | RIS + SAMPLE |
| **Needs negatives?** | **Yes — this is what negatives are for** |

**This is the indicator most OpenELIS deployments cannot currently produce**, because M-09 does not export negatives (§3.1 change 3 of the companion doc). A country without it reports percentages forever and can never say whether resistant infections are becoming *more common* — only what share of tested isolates were resistant, which moves when testing practice moves.

**[REC] Make the distinction visible in the UI, not just in a footnote.** A panel showing %R and a panel showing rate per 100 000 look alike and mean different things. Label them, and grey out the rate panels with an explicit "requires negatives export" state rather than hiding them — an absent panel reads as "not applicable", a disabled one reads as "not yet".

---

## 4. Stratifications

**[WHO]** Every core indicator is reportable across these axes. They are the columns the warehouse must carry.

| Axis | Values | Source | Note |
|---|---|---|---|
| **Pathogen** | GLASS priority pathogens | `Observation` (organism) | Versioned scope profile, not hardcoded |
| **Antibiotic** | GLASS-relevant agents | `Observation` (AST) | Mapped to WHONET codes |
| **Specimen group** | Blood, urine, stool, genital, urethral/cervical | **`Specimen`** | ❌ not yet published |
| **Infection origin** | `HO` / `CO` / `UNK` | Derived: admission + collection date | Needs **`Encounter`** ❌ |
| **Age group** | GLASS bands | **`Patient`** | ❌ not yet published |
| **Sex** | M / F / Unknown | **`Patient`** | ❌ not yet published |
| **Site** | Surveillance site | `Organization` | ✅ |
| **Geography** | Admin level 1/2 | `Organization` hierarchy | ✅ |
| **Period** | Surveillance period, default 12 months | Collection date | **Not** 7 days — see below |

**[REC] The 7-day trap, again.** The shipped i18n string asserts *"WHO GLASS default is 7 days."* That is CLSI M39, correct for a **local antibiogram** (M-13) and wrong for GLASS, which uses one result **per surveillance period, for example 12 months**. Since the antibiogram and the GLASS view will sit in the same product and read the same data, the period must be an explicit, labelled parameter on every panel rather than an inherited default. Two panels differing only by an invisible window is a reliable way to produce two contradictory national numbers.

---

## 5. Data-quality panels — where the real value is

**[REC] This is the strongest recommendation in this document.** The %R and rate panels are what GLASS wants. The panels below are what a country can *act on*, and they are leading indicators of whether the submission will be usable at all. They should be first-class, not an admin afterthought.

| Panel | Measures | Why it earns its place |
|---|---|---|
| **Origin completeness** | % records with `ORIGIN = UNK`, by site | A direct readout of admission-date capture. Today this is **100% everywhere**; it is the single number that shows M-03 v2.1 working in the field |
| **Negatives captured** | Whether each site reports no-growth results | Gates §3.2 entirely. A site at zero silently caps the whole country at percentages |
| **AST coverage** | % isolates of GLASS pathogens with any AST | An identified isolate with no AST contributes nothing to RIS |
| **Unmapped codes** | Count and record impact, by site | Held records are excluded from submission; this is the queue that unblocks them |
| **Site reporting completeness** | Sites reporting / enrolled, and freshness | **[ASPECT]** overlaps W8's site-sync dashboard — **reuse it, do not build a second** |
| **Denominator health** | Pathogen–antibiotic pairs below the suppression threshold | Shows where the country cannot yet report, and why |

**[REC]** Sequence these **before** the %R panels. They are cheaper, they need only data that already exists, and each one tells a programme manager something they can change on Monday. A resistance percentage tells them something true but not actionable at their desk.

---

## 6. Where these run

**[ASPECT]** Superset or Power BI on the FHIR Data Pipes warehouse (W3), **not** a bespoke OpenELIS screen. **[REC] Nothing in §3–§5 argues for building an AMR dashboard module inside OpenELIS.** The obligation this document places on OpenELIS is narrower and entirely upstream:

1. **Publish `Specimen`, `Patient` demographics and `Encounter`** to FHIR (§2).
2. **Export negatives** (M-09 change 3) so §3.2 is possible at all.
3. **Derive `INFECTION_ORIGIN`** rather than shipping ward/location in its place.
4. **Carry test intent** on `ServiceRequest` so denominators stay clean.

Everything else is warehouse and dashboard work in the W3 toolchain.

**Open — needs a decision, not a guess.** DHIS2 receives the ministry national reporting push **[ASPECT]**, and GLASS is a separate channel with its own format and its own human upload. Whether AMR indicators should *also* flow to DHIS2 for domestic reporting is a country-level policy question. It is worth asking early, because the answer changes whether the AMR aggregate layer needs a DHIS2-shaped output in addition to the RIS/SAMPLE files.

---

## 7. What would make this spec wrong

**[REC]** Recorded so the assumptions are falsifiable rather than buried:

- **If W9 picks option C** (facilities on-site, aggregation in the analytics layer), the warehouse becomes the *only* place holding cross-site data, and first-isolate de-duplication has to happen there rather than in OpenELIS. §5's data-quality panels then also become the only cross-site data-quality view that exists — raising their importance further.
- **If the country is not GLASS-enrolled**, §3's core indicators still stand but the submission surface is dormant; the §5 panels and the local antibiogram (M-13) carry all the value.
- **If `PatientType` (Inpatient/Outpatient) turns out to be poorly populated in practice**, the origin stratification degrades to `UNK` regardless of admission-date capture, and fixing `PatientType` becomes higher priority than anything in §3. This is worth measuring on live data before building the origin panels — the *Origin completeness* panel in §5 is precisely the instrument for it.

---

*Companion: `glass-on-aspect-parity.md` (scoping and sequencing), `glass-submission-console.html` (submission surface). Extends `designs/reports/disease-surveillance-dashboard.md` v1.0.*
