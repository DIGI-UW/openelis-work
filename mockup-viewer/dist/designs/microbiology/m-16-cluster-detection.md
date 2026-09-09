# M-16 Cluster Detection & Outbreak Signals — Functional Requirements Specification

**Version:** 1.0 (canonical — reuse-first; no separate addendum)
**Date:** 2026-09-04
**Module:** Surveillance → Cluster Detection
**Routes:** `/surveillance/clusters` · `/surveillance/clusters/history` · `/MasterListsPage/clusterDetection`
**Owner:** Microbiology Module (M-00 parent) — but scope spans all three domains
**Status:** Draft
**Companion:** `m-16-cluster-detection-crosscheck-and-brief.md`

> Self-contained. Key decisions written inline. **(1)** The scan statistic is implemented **natively in
> Java** — no SaTScan binary, no proprietary redistribution question, works air-gapped (§5.1).
> **(2)** The engine consumes a **domain-aware detection-event stream**, not isolates directly, so one
> scan serves clinical, environmental and vector surveillance without three engines (§5.2). **(3)** The
> scan **never crosses a domain boundary** — a clinical *E. coli* and an environmental *E. coli* are not
> the same population (§5.6, extends D-004). **(4)** Clinical isolate selection **reuses the M-09
> first-isolate de-duplication unchanged**, as M-13 already does; this module defines no second
> denominator (§5.3). **(5)** Alert volume is a **design target of roughly 3–6 signals per lab per
> year**, not an outcome (§5.9). All interaction is inline; the only modal is the outbound-send confirm.

---

## 1. Lab Context

**Current State.** When several patients in the same ward grow the same bacterium in the same week, or
several water samples from the same district test positive for the same pathogen, the laboratory is
the first place in the health system where that pattern is visible — the results are all sitting in
one database, entered by the same technicians. Almost no laboratory looks. In the deployments we
support, the check either does not happen at all, or it happens because an experienced microbiologist
happened to notice the same organism name three times in a row while validating results. The formal
tool for this is WHONET, a free desktop program from the WHO Collaborating Centre in Boston: a
technician exports the laboratory's results to a file, carries it to a separate computer, imports it
into WHONET, and runs a statistical routine called a scan statistic — which WHONET performs by handing
the data to a second program called SaTScan. Almost nobody does this monthly. Many laboratories that
own WHONET use it only to produce the annual antibiotic resistance report for the ministry.

**Pain.** The delay is the harm. An outbreak of a resistant organism in a hospital ward doubles while
nobody is counting; by the time a clinician says "we seem to be seeing a lot of *Klebsiella*", the
transmission chain is weeks long. The specific failures are concrete. Exporting to WHONET is a manual
job nobody owns, so it slips. The export is a snapshot, so the analysis is always of last month.
Reading SaTScan output requires understanding *p*-values and recurrence intervals, which the bench
staff who have the data do not have training in and the epidemiologists who have the training are not
in the laboratory. And when WHONET does produce signals, it produces too many: a published three-year
evaluation in an Italian hospital generated 287 raw statistical signals, which only became useful after
a human collapsed them by hand into 71. A tool that hands a busy laboratory 287 things to check is a
tool the laboratory stops opening. Meanwhile environmental and vector surveillance — water testing,
mosquito pool testing — have no equivalent tool at all, so a cluster of positive sites is noticed only
when someone builds a spreadsheet.

**What Changes.** Every night, OpenELIS analyses its own results and asks one question: is anything
happening more than it usually does, in one place, in one stretch of time? It compares the last few
weeks against the laboratory's own prior year, for every organism and every antibiotic-resistance
pattern it has seen, and for environmental and mosquito-pool pathogen detections as well. When the
answer is yes, a signal appears in a short queue — a handful of times a year, not hundreds. A
supervisor opens it and sees the actual specimens behind it, when each was collected, where the
patients live or where the samples were taken, and whether the organisms share a resistance pattern.
The supervisor records what it turned out to be: still investigating, a confirmed outbreak, or ruled
out with a reason. On confirmation, the infection prevention team is notified through the same
messaging OpenELIS already uses for critical results, and the isolates are flagged so they go to the
national reference laboratory first rather than in the next quarterly batch. The laboratory does not
export anything, install anything, or interpret a *p*-value. Nobody has to remember to run it.

---

## 2. Overview

### 2.1 Purpose

Detect disease and antimicrobial-resistance clusters automatically, inside the laboratory information
system, on the day the data arrives — and give the laboratory enough evidence, in one screen, to
decide whether a signal is a real outbreak. The statistical method matches what WHONET achieves
through SaTScan; the difference is that it runs unattended on live data, speaks in plain language,
holds itself to a small alert budget, and does not stop at the alert.

**AMR = antimicrobial resistance.** **AST = antimicrobial susceptibility testing**, the laboratory test
that determines which antibiotics still kill a bacterium; its result per antibiotic is Susceptible,
Intermediate or Resistant (S/I/R). **GLASS** is the World Health Organization's Global Antimicrobial
Resistance and Use Surveillance System, the international database countries report AMR data into.
**IPC** = infection prevention and control, the hospital team responsible for stopping transmission.

### 2.2 What "at least as good as WHONET" means here

| | WHONET + SaTScan | M-16 |
|---|---|---|
| Statistical method | Kulldorff scan statistic (space-time permutation, Poisson) | **The same methods**, implemented natively |
| Where it runs | Separate desktop install | **Inside OpenELIS** |
| Data preparation | Manual export and import | **None** |
| Cadence | When someone remembers | **Nightly, unattended** |
| Space unit | Ward and clinical service | **Ward/service, patient residence, and sampling site** |
| Domains covered | Clinical only | **Clinical, environmental and vector** |
| Reader | Trained epidemiologist | **Laboratory supervisor** |
| Signal volume | 287 raw signals over 3 years in one evaluation | **Design target 3–6 per year, pre-merged** |
| After the signal | Nothing — the tool ends | **Line list, disposition, outbound notification, priority export** |

Parity on statistics is the floor. The gains are integration, cadence, signal discipline and
follow-through.

### 2.3 Navigation & URL

**IA note — a new top-level group is proposed, not assumed.** Cluster detection covers all three
domains, so it cannot sit under `Microbiology` without hiding it from the environmental and vector
users who need it. The existing tree has no home for cross-domain surveillance. This FRS therefore
proposes a new top-level **`Surveillance`** group, in the same way `Analyzers` is a top-level group
(D-027), and flags it as an IA gap for explicit approval rather than inventing it silently. If the
group is rejected, the fallback is `Microbiology → Cluster Detection` with the environmental and
vector signals reachable only from there.

- **SideNav placement:**
  ```
  Surveillance                        ← proposed new top-level group
  ├── Cluster Detection
  │   ├── Signals                      (default landing)
  │   └── Detection History
  ```
  Future home for `WHONET Export` (M-09) and `Surveillance Submission` (M-15), which currently sit
  under `Reports`. This FRS does **not** move them — that is a separate change.
- **Breadcrumbs:**
  - `Home / Surveillance / Cluster Detection / Signals`
  - `Home / Surveillance / Cluster Detection / Detection History`
  - `Home / Admin Management / Microbiology Reference Data / Cluster Detection`
    (preserving the shipped `Admin` → `Admin Management` breadcrumb drift, D-013)
- **URL routes:**
  - `/surveillance/clusters` — signal queue. Deep-linkable to one signal:
    `/surveillance/clusters?signal=<uuid>` (identifiers in the query string, D-012).
  - `/surveillance/clusters/history` — detection runs and dispositioned signals.
  - `/MasterListsPage/clusterDetection` — admin configuration (path-segment `editorKey`, D-012).

> ⚠ **Route verification owed.** The microbiology module is not on `develop`, so `/surveillance/*`
> cannot be confirmed against `testing.openelis-global.org`. Per MUST C the shipped app is the source
> of truth; these routes are **provisional pending confirmation against `amr.openelis-global.org`**.

### 2.4 Detection is in-app; analytics roll-up is not

Detection is operational, single-laboratory and real-time, so it lives in OpenELIS. Multi-site
analytics, national AMR dashboards and GLASS indicator reporting stay in the external Superset/Power BI
layer over the consolidated FHIR store — the boundary M-15 §4.7 and D-041 already draw. M-16 never
aggregates across laboratories and has no site selector (D-001).

---

## 3. User Stories

- As a **microbiology supervisor**, I want to be told when an organism is appearing more often than
  usual in one ward, so that I raise it while it is three patients and not thirty.
- As a **surveillance officer**, I want the specimens behind a signal listed with their dates,
  locations and resistance patterns, so that I can judge whether it is one transmission event or a
  coincidence, without exporting anything.
- As a **laboratory manager**, I want the very first carbapenem-resistant isolate we have ever seen to
  alert immediately, because no statistical test can flag a single case and that single case is the
  one that matters most.
- As an **environmental surveillance officer**, I want positive water samples clustering in one
  district to raise the same kind of signal as a hospital cluster, so that I am not the only programme
  still doing this in a spreadsheet.
- As a **vector surveillance officer**, I want a rise in pathogen-positive mosquito pools at particular
  trapping sites to be detected, so that vector control is directed where transmission risk is rising.
- As a **laboratory manager**, I want to record what each signal turned out to be, so that we can show
  the ministry that detection is working and tune it against what actually happened.

---

## 4. Functional Requirements

### 4.1 Detection run

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | A detection run executes automatically on a schedule (default nightly, configurable), covering every domain enabled in configuration. | Reuses the existing OpenELIS scheduler, as M-09's scheduled export does. |
| FR-2 | A run may also be started on demand for a chosen period by a user with configuration access. | For tuning and for catching up after downtime. |
| FR-3 | Each run is recorded with its parameters, the data window analysed, counts examined, signals raised, and duration. | Makes threshold tuning auditable; visible on Detection History. |
| FR-4 | A run that fails does not silently disappear — the failure and its reason are recorded and surfaced to configuration users. | A detection system that quietly stops running is worse than none. |

### 4.2 What gets counted — the detection event

| ID | Requirement | Notes |
|---|---|---|
| FR-5 | The engine analyses a normalised **detection event** stream rather than reading each domain's records directly. Every event carries: event date, domain, agent, location, subject key. | See §5.2. This is a computed view, not stored data. |
| FR-6 | **Clinical** events derive from finalised microbiology cases: one event per de-duplicated isolate, agent = organism, optionally organism + resistance phenotype. | §5.3 |
| FR-7 | **Environmental and vector** events derive from positive results on tests marked detection-eligible in configuration: one event per sample, or per pool for pooled vector testing. Agent = the pathogen detected. | §5.4 |
| FR-8 | Clinical events apply the **M-09 first-isolate de-duplication routine, invoked unchanged**. This module defines no de-duplication of its own. | §5.3. Same reuse M-13 §4.2 makes. |
| FR-9 | Screening cultures are **excluded** from detection counts. | Decision, Casey 2026-09-04. §5.3 gives the reasoning. |
| FR-10 | Contaminants, non-final results and results not yet verified are excluded. | Consistent with M-13 §4.1. |
| FR-11 | Environmental and vector events are **not** patient-de-duplicated — there is no patient. Repeat sampling of the same site is deliberate and each positive result is a real event. | §5.4 |

### 4.3 Where events are — location resolution

| ID | Requirement | Notes |
|---|---|---|
| FR-12 | Clinical events resolve location in this order: **patient GPS coordinates**, then **ward**, then **department**. The resolution actually used is recorded on the event. | Reuses `Person.gpsLatitude`/`gpsLongitude` and the microbiology case's ward and department. No new field. |
| FR-13 | Environmental and vector events resolve location from the **sample's GPS coordinates**, then the **vector sampling site's** coordinates. | Reuses existing sample and sampling-site coordinates. |
| FR-14 | Coordinate locations are assigned to cells of a square grid whose **edge length is configurable** (default 500 m). | Decision, Casey 2026-09-04. §5.5 covers why this is a real tradeoff. |
| FR-15 | Events with no resolvable location are included in the temporal scan and excluded from the spatial scan; the count of such events is shown on the run and on any resulting signal. | Never silently drop data. |
| FR-16 | Where **no** events in a domain have a resolvable location, that domain runs the temporal scan only, and the interface states plainly that spatial detection is unavailable and why. | §5.10 — this is the expected state in laboratories that have not enabled coordinate capture. |

### 4.4 The scan

| ID | Requirement | Notes |
|---|---|---|
| FR-17 | The primary analysis is a **space-time permutation scan statistic**, evaluating cylindrical windows over location and time. | §5.1. Needs no population-at-risk denominator, which OpenELIS does not hold. |
| FR-18 | A **Poisson temporal scan** runs for events without usable location, and as the whole analysis where a domain has no location data. | §5.1 |
| FR-19 | Statistical significance is established by **Monte Carlo replication**; the replication count is configurable (default 999). | Matches the published WHONET-SaTScan parameters. |
| FR-20 | Signal strength is reported as a **recurrence interval** — how rarely a pattern this strong would arise by chance — expressed in plain language ("expected about once every 4 years"), not as a *p*-value. | §5.8 |
| FR-21 | A signal is raised only when its recurrence interval exceeds a configurable threshold (default 365 days). | Matches the published WHONET-SaTScan threshold. |
| FR-22 | The scan runs over: organism alone; organism with resistance phenotype; and, for environmental and vector domains, pathogen alone. | Broad organism coverage, not AMR only. |
| FR-23 | **The scan never crosses a domain boundary.** Clinical, environmental and vector events are scanned as separate populations and are never pooled. | §5.6. Extends D-004. |
| FR-24 | Overlapping and adjacent windows describing the same event set are **merged into a single signal** before the signal is presented. | §5.7. This is the step WHONET leaves to the user. |
| FR-25 | The maximum temporal window scanned is configurable (default 60 days), as is the baseline period (default 365 days). | Matches the published WHONET-SaTScan parameters. |

### 4.5 Baseline sufficiency

| ID | Requirement | Notes |
|---|---|---|
| FR-26 | The space-time and temporal scans are **suppressed** for a domain until that domain has at least a configurable minimum of history (default 365 days of data since the laboratory's first recorded result in the domain). | Decision, Casey 2026-09-04. §5.10 |
| FR-27 | While suppressed, the interface states that statistical detection is not yet available for that domain and shows **how much longer** until it is. | A blank screen with no explanation reads as broken. |
| FR-28 | **Sentinel first-occurrence alerts (FR-31) remain active from day one**, including while the statistical scan is suppressed. | The single most urgent alert class must not wait a year. |

### 4.6 Signal classes

| ID | Requirement | Notes |
|---|---|---|
| FR-29 | **Space-time cluster** — an agent above expectation in a location over a window. Carries recurrence interval, observed and expected counts, window, and location. | The scan statistic. |
| FR-30 | **Temporal cluster** — the same, laboratory-wide, where location is unusable. | |
| FR-31 | **Sentinel first occurrence** — the first ever detection of a watchlisted agent in this laboratory, raised at a single event. Labelled in the interface as a watchlist alert, not a statistical finding. | Deterministic. No scan statistic can flag n = 1, and n = 1 is often what matters most. |
| FR-32 | Every signal states which class it is, in plain language, so a supervisor is never left guessing whether a number is statistical or a rule. | |

### 4.7 The signal queue

| ID | Requirement | Notes |
|---|---|---|
| FR-33 | Open signals are listed with: domain, agent, signal class, location, strength, event count, first and last event dates, age, and disposition state. | Carbon `DataTable`. |
| FR-34 | The list filters by domain, signal class, disposition state, agent, and date range. Selected filter values are shown as their **labels**, never as a bare count. | Design-addendum selection-labels convention. |
| FR-35 | The empty state states that no signals are open, when detection last ran, and that an empty queue is the expected normal state. | An empty queue must not read as a broken feature. |
| FR-36 | The count of open signals surfaces on the laboratory home page attention feed. | Reuses the existing attention feed rather than requiring users to visit the module. |
| FR-37 | Signals are listed **strongest first by default**, not newest first. | The queue is short; strength is the useful ordering. |

### 4.8 Investigating a signal

| ID | Requirement | Notes |
|---|---|---|
| FR-38 | Selecting a signal opens an investigation panel **inline** — no modal — showing everything below. | D-005 |
| FR-39 | **Line list** — every event in the signal: laboratory number, collection date, patient identifier or sampling site, specimen or sample type, location, agent, and the resistance interpretations where present. Each row links to its case or order. | The evidence, assembled. |
| FR-40 | **Epidemic curve** — event counts over time across the signal window and the preceding baseline, so the rise is visible rather than asserted. Rendered with **`@carbon/charts-react`**, already a frontend dependency; no new charting library. | A text-equivalent table accompanies it (WCAG 2.1 AA). |
| FR-41 | **Location breakdown** — counts by ward, department or grid cell, as a table plus a `@carbon/charts-react` visualisation; a map where coordinates are available. | |
| FR-42 | **Resistance profile comparison** — for clinical signals with AST results, the per-antibiotic interpretations of the isolates side by side, so a supervisor can see at a glance whether they share a phenotype. | Shared phenotype is the strongest available evidence of a common source without sequencing. |
| FR-43 | **Comparison to normal** — observed count against the expected count for that agent, location and window length, in plain numbers. | |
| FR-44 | A signal carries a free-text investigation note with an activity trail of who changed what and when. | Reuses the existing history and note mechanism, as M-04's case timeline does. |

### 4.9 Disposition

| ID | Requirement | Notes |
|---|---|---|
| FR-45 | A signal is dispositioned as **Under investigation**, **Confirmed outbreak**, or **Ruled out**. A reason is required for Ruled out. | |
| FR-46 | Disposition changes are traceable — who, when, from what state to what state, with the reason. | |
| FR-47 | A dispositioned signal moves out of the open queue to Detection History and remains readable there permanently. | |
| FR-48 | **Signals and investigations are never deleted.** There is no delete action anywhere in this feature. | D-002 |
| FR-49 | A signal left undispositioned beyond a configurable age (default 14 days) is marked overdue in the queue and in the attention feed. | A queue nobody clears is a queue nobody reads. |
| FR-50 | A confirmed cluster does **not** create a non-conforming event. | Decision, Casey 2026-09-04. A cluster is an epidemiological finding, not a laboratory quality failure. |

### 4.10 Acting on a confirmed cluster

| ID | Requirement | Notes |
|---|---|---|
| FR-51 | Confirming a cluster offers to notify the configured infection prevention contacts, using the **existing test notification delivery channels and template mechanism**. No new delivery channel is introduced. | Reuses the built Test Notification system. |
| FR-52 | Confirming a cluster offers to flag its events' isolates for **priority surveillance export**, so they reach the national reference laboratory ahead of the next routine batch. | Touches the M-09 / M-15 export selection; coordinate rather than duplicating. |
| FR-53 | The outbound send is confirmed through a modal stating exactly who will be notified and what will be flagged. | The only modal in the feature; outbound and hard to retract. |
| FR-54 | The line list exports to CSV and PDF through the existing reporting infrastructure, carrying the signal's parameters and method footnote. | Same Jasper infrastructure M-13 §5.3 reuses. |
| FR-55 | What was sent, to whom, and when is recorded on the signal. | |

### 4.11 Configuration

| ID | Requirement | Notes |
|---|---|---|
| FR-56 | Detection is enabled or disabled **per domain**, independently. | |
| FR-57 | Scan parameters are editable: schedule, baseline period, maximum temporal window, Monte Carlo replications, recurrence-interval threshold, grid edge length, minimum baseline before the scan activates, and overdue age. Each shows its default and a plain-language explanation of what raising or lowering it does to alert volume. | Tuning is the difference between 3 signals a year and 287. |
| FR-58 | A **sentinel watchlist** of agents — organism, or organism with resistance phenotype — that alert on first occurrence. Entries are added, deactivated and reactivated; **never deleted**. Deactivated entries are hidden by default behind a "Show deactivated" toggle. | D-002. Organism and antibiotic pickers are filterable (D-007). |
| FR-59 | The tests whose positive results count as environmental or vector detection events are selected from the test catalogue using a filterable picker. | D-007. No inline test creation (MUST E). |
| FR-60 | Infection prevention notification recipients are configured here. **This recipient list is new information** — see Dependencies. Message *delivery* reuses the existing notification channels and templates unchanged. | The existing notification system addresses patients and providers; it has no concept of a standing surveillance contact list. |
| FR-61 | A **tuning view** shows, for the current parameters, how many signals would have been raised over the past year and how they were dispositioned — so a change to a threshold can be judged before it is saved. | Makes the alert budget a controllable design target rather than a hope. |
| FR-62 | Configuration changes are traceable, and the parameters in force are recorded on every detection run. | A signal must be interpretable against the settings that produced it. |

### 4.12 Enabling patient coordinate capture

| ID | Requirement | Notes |
|---|---|---|
| FR-63 | Patient coordinate capture is switched **on by default** for new and upgraded deployments as part of this work. | Decision, Casey 2026-09-04. It is currently off by default, which is why no laboratory has this data. |
| FR-64 | Turning capture on does **not** back-populate coordinates for existing patients, and does not require them. Coordinates remain optional at registration. | Stated because the alternative expectation — that spatial detection works on historical data on upgrade day — is wrong and would be discovered late. |
| FR-65 | The configuration page shows what proportion of the domain's recent events resolved to coordinates, so a laboratory can see its own spatial detection becoming usable as capture accumulates. | Turns an invisible ramp into a visible one. |

---

## 5. Method

### 5.1 The engine

Implemented natively in the OpenELIS backend. There is no SaTScan executable, no external process, no
proprietary component to redistribute, and no network dependency — it works in an air-gapped ministry
deployment. The methods are the published Kulldorff scan statistics, the same ones WHONET obtains by
driving SaTScan:

- **Space-time permutation model.** Scans cylindrical windows over (location, time), comparing observed
  events inside each window against what the marginal distributions of place and time would produce if
  the two were independent. Chosen as the primary model because it requires **no population-at-risk
  denominator** — OpenELIS holds no patient-days or catchment population, and neither does WHONET,
  which is why WHONET uses this model too.
- **Poisson temporal model.** A time-only scan against the laboratory's own historical rate, used where
  location is unusable.
- **Monte Carlo replication** for significance, since the scan statistic's null distribution has no
  closed form.

### 5.2 One engine, three domains — the detection event

The three domains store their work differently. Clinical microbiology produces cases, isolates and AST
runs. Environmental and vector surveillance produce ordinary samples with results, and vector samples
are **pools** — many mosquitoes tested as one specimen. Reading each domain's records directly inside
the scan would mean three engines and three sets of bugs.

Instead each domain contributes to a normalised **detection event** stream, computed at run time:

| Field | Clinical | Environmental | Vector |
|---|---|---|---|
| Event date | specimen collection date | sample collection date | collection date |
| Domain | CLINICAL | ENVIRONMENTAL | VECTOR |
| Agent | organism, or organism + resistance phenotype | pathogen detected | pathogen detected in the pool |
| Location | patient coordinates → ward → department | sample coordinates | sampling site coordinates |
| Subject key | patient | sample (identified by lab number and coordinates — see below) | pool, at its sampling site |

The scan sees only this shape. Adding a fourth domain later means adding a source, not touching the
statistics.

### 5.3 Clinical event selection

Isolate selection **invokes the M-09 first-isolate de-duplication routine unchanged**, exactly as M-13
§4.2 does. There is one de-duplication implementation in the module and this is not it. Detection, the
antibiogram and the WHONET export therefore reconcile against the same isolate set — which matters,
because a supervisor who sees a cluster signal and then opens the antibiogram must not find two
different counts for the same organism and period.

**Screening cultures are excluded.** A laboratory that already suspects an outbreak starts screening
contacts, which produces a burst of positive cultures caused by the *investigation* rather than by
transmission. Including them would let a signal feed itself: detect, screen, detect harder. The cost of
excluding them is that a screening-only outbreak is invisible, which is acceptable because by
definition someone already knows about it.

Contaminants, non-final and unverified results are excluded, consistent with M-13 §4.1.

### 5.4 Environmental and vector event selection

Which tests count as detection events is configured (FR-59) rather than inferred, because a positive
result means "detected" only for tests that are pathogen detections.

**There is no patient de-duplication.** Repeat sampling of the same water point or trapping site is the
design of environmental surveillance, not a duplicate. Each positive result is a real event.

**Environmental samples have no named sampling-site record.** Vector surveillance has a sampling-site
entity with its own coordinates; environmental sampling does not — an environmental sample carries
coordinates captured at order entry and nothing else identifying the point. Environmental events are
therefore identified by **laboratory number and coordinates**, and "the same point sampled twice" is
recognised by coordinates falling in the same grid cell, not by a shared site identifier. Stated
explicitly because assuming a site record that does not exist would produce a line list the developer
cannot build. Creating one is **not** in scope here — if a named environmental sampling-site register is
wanted, it is its own specification.

**Vector counts are pool-positivity events, not individual counts.** One positive pool of 25 mosquitoes
is one event. The scan compares pool-positive counts against the laboratory's own historical
pool-positive counts, so the comparison is consistent even though the underlying number of insects is
unknown. Stating this because the plausible alternative — treating a pool as 25 detections — would
inflate every vector signal.

### 5.5 The spatial grid

Coordinate events are assigned to cells of a square grid before scanning, because a scan over raw
coordinates in a sparse dataset finds clusters of two houses.

The edge length is configurable (default 500 m) and the tradeoff is real in both directions. Too fine
and true clusters split across cell boundaries and never reach threshold; too coarse and a genuine
neighbourhood cluster is diluted into a district that shows nothing. A dense urban catchment and a
rural district with one clinic per 40 km do not want the same value, which is why this is a setting and
not a constant.

There is also a privacy consideration worth stating plainly: in a sparsely populated area a very fine
grid combined with an organism name approaches identifying an individual household. The grid is the
control for that, and the default is deliberately coarse.

### 5.6 Domains are separate populations

A clinical *Escherichia coli* isolate from a patient and an environmental *Escherichia coli* detection
in a water sample are the same species and are **not** the same population, do not share a baseline
rate, and must never be pooled into one count. The scan runs independently per domain and a signal
belongs to exactly one domain. This extends D-004's rule that the domain enumeration has no combined
value into the analytical layer.

A cluster of the same organism appearing in two domains in the same place and period is exactly the
kind of finding an investigator wants — but it is a human judgement made across two signals, not a
statistical result, and the interface presents it as a cross-reference rather than merging them.

### 5.7 Signal merging

A raw scan produces many overlapping windows describing the same underlying events — a 14-day window,
an 18-day window, and a 21-day window over the same eleven isolates are one finding, not three. Windows
whose event sets substantially overlap are collapsed into a single signal carrying the strongest
recurrence interval and the union of the events, before anything reaches the queue.

This is the step WHONET leaves to the user, and it is most of the distance between 287 signals and a
number a laboratory will actually read.

### 5.8 Speaking in recurrence intervals

Strength is reported as a recurrence interval and phrased in words: *"A pattern this strong would be
expected about once every 4 years."* The underlying quantity is what SaTScan reports and what the
published WHONET evaluations threshold on, so nothing is lost against the benchmark — but it is a
sentence a laboratory supervisor can act on, and *p* = 0.008 is not. The numeric recurrence interval is
shown alongside for anyone who wants it.

### 5.9 The alert budget

A randomised trial across 82 hospitals evaluated automated detection of exactly this kind — statistical
comparison against each hospital's own prior experience, on culture data alone with no sequencing,
across more than a hundred bacterial and fungal species. It produced roughly **three alerts per
hospital per year** and, before the pandemic period, a **64% reduction in the size of potential
outbreaks**.

Two consequences are built into this specification rather than left to chance. First, **breadth beats
depth**: the value came from watching every organism, not from watching a few resistant ones closely,
which is why FR-22 scans organisms as well as resistance phenotypes. Second, **alert volume is a target
we design to, not a number we report afterwards** — hence the merging in §5.7, the threshold defaults
in FR-21, and the tuning view in FR-61. A statistically defensible signal nobody reads is worth
nothing.

### 5.10 Degraded modes, stated not hidden

Two states are expected in real deployments and both must be visible rather than presenting as an empty
or broken screen:

- **No usable location.** A laboratory that has not accumulated patient coordinates gets the temporal
  scan only. The interface says so and points at the configuration page, where FR-65 shows coordinate
  coverage climbing.
- **Insufficient baseline.** A laboratory live for four months has no year of history to compare
  against. The statistical scan is suppressed for that domain, the interface says how much longer, and
  sentinel watchlist alerts run regardless (FR-28).

---

## 6. Information & Data

M-16 **reads** existing information and **creates no clinical data**. Everything it persists is
non-clinical: the record of what was analysed, what was found, and what a human decided about it.

**Read (existing, no new fields):**

| Information | Source | Used for |
|---|---|---|
| Finalised microbiology cases — ward, department, patient origin, workflow type, screening flag | microbiology case | clinical events, location, exclusions |
| Isolates and their organisms | microbiology isolate | the agent |
| AST runs and their per-antibiotic S/I/R interpretations | AST run and result records | resistance phenotype; profile comparison |
| Patient coordinates | person record (latitude, longitude) | clinical spatial location |
| Sample coordinates | sample and sample item | environmental and vector spatial location |
| Vector sampling site and its coordinates | vector sampling site | vector spatial location |
| Specimen collection dates, sample and specimen types, domain | sample and sample item | event date, filters, domain separation |
| Test catalogue entries | test | which results count as detection events |

**Created (new, non-clinical, declared):**

| Record | What it holds | Lifecycle |
|---|---|---|
| **Detection run** | when it ran, domains covered, period analysed, parameters in force, events examined, signals raised, duration, outcome | immutable once complete |
| **Cluster signal** | domain, class, agent, location, window, observed and expected counts, recurrence interval, current disposition, merged-from provenance | created by a run; dispositioned by a user; never deleted |
| **Signal event link** | which detection events belong to which signal | immutable |
| **Cluster investigation** | notes, activity trail, disposition history with reasons, what was sent outward and to whom | append-only |
| **Sentinel watchlist entry** | the agent watched, active state | added, deactivated, reactivated — never deleted |
| **Detection configuration** | per-domain enablement, scan parameters, notification recipients, detection-eligible tests | edited; changes traceable |

No microbiology case, isolate, AST run or result is created or modified by cluster detection.

---

## 7. Access

Attached to existing role bundles. No new per-action permission keys are introduced (D-006).

| Capability | Who can do it |
|---|---|
| See that signals exist — the count on the home attention feed and the module badge | Microbiology Technician, Microbiology Supervisor, Laboratory Manager, Surveillance Officer |
| Open a signal and read the line list, epidemic curve, location breakdown and resistance comparison | Microbiology Supervisor, Laboratory Manager, Surveillance Officer |
| Set or change a disposition, and write investigation notes | Microbiology Supervisor, Laboratory Manager, Surveillance Officer |
| Notify infection prevention and flag isolates for priority export on a confirmed cluster | Laboratory Manager, Surveillance Officer |
| Export a line list | Microbiology Supervisor, Laboratory Manager, Surveillance Officer |
| Start a run on demand, change scan parameters, manage the sentinel watchlist and detection-eligible tests | Laboratory Manager (Admin) |

A user with none of these does not see the `Surveillance` group at all. A Microbiology Technician sees
the Cluster Detection item **disabled, with the open-signal count visible** — so the existence of a
signal is never hidden from bench staff, only its clinical detail. On the configuration page, a user
without configuration access sees the parameters read-only rather than not at all, because knowing how
detection is tuned is part of interpreting a signal.

---

## 8. Localization

Every visible string carries an i18n key. Namespace `surveillance.cluster.*`, reserved so it does not
collide with `reports.antibiogram.*` or a future `surveillance.submission.*`.

| Key | English fallback | Context |
|---|---|---|
| `surveillance.cluster.title` | Cluster Detection | Page title, SideNav |
| `surveillance.cluster.nav.group` | Surveillance | Top-level SideNav group |
| `surveillance.cluster.nav.signals` | Signals | SideNav submenu |
| `surveillance.cluster.nav.history` | Detection History | SideNav submenu |
| `surveillance.cluster.queue.heading` | Open signals | Queue heading |
| `surveillance.cluster.queue.empty.title` | No open signals | Empty state |
| `surveillance.cluster.queue.empty.body` | Detection last ran {{when}}. An empty queue is normal — signals appear only when something is above expectation. | Empty state |
| `surveillance.cluster.column.domain` | Domain | Table column |
| `surveillance.cluster.column.agent` | Organism / pathogen | Table column |
| `surveillance.cluster.column.class` | Signal type | Table column |
| `surveillance.cluster.column.location` | Location | Table column |
| `surveillance.cluster.column.strength` | Strength | Table column |
| `surveillance.cluster.column.count` | Cases | Table column |
| `surveillance.cluster.column.window` | Period | Table column |
| `surveillance.cluster.column.age` | Age | Table column |
| `surveillance.cluster.column.disposition` | Status | Table column |
| `surveillance.cluster.class.spaceTime` | Space-time cluster | Signal class |
| `surveillance.cluster.class.temporal` | Time cluster | Signal class |
| `surveillance.cluster.class.sentinel` | Watchlist alert | Signal class |
| `surveillance.cluster.class.sentinel.help` | First occurrence of a watched organism in this laboratory. Not a statistical finding. | Signal class help |
| `surveillance.cluster.domain.clinical` | Clinical | Domain |
| `surveillance.cluster.domain.environmental` | Environmental | Domain |
| `surveillance.cluster.domain.vector` | Vector | Domain |
| `surveillance.cluster.strength.recurrence` | Expected about once every {{interval}} | Strength, plain language |
| `surveillance.cluster.strength.detail` | Recurrence interval {{days}} days | Strength, numeric |
| `surveillance.cluster.disposition.open` | Needs review | Disposition |
| `surveillance.cluster.disposition.investigating` | Under investigation | Disposition |
| `surveillance.cluster.disposition.confirmed` | Confirmed outbreak | Disposition |
| `surveillance.cluster.disposition.ruledOut` | Ruled out | Disposition |
| `surveillance.cluster.disposition.overdue` | Overdue | Queue flag |
| `surveillance.cluster.action.setDisposition` | Record outcome | Button |
| `surveillance.cluster.action.ruledOut.reason` | Why is this being ruled out? | Required field |
| `surveillance.cluster.action.notify` | Notify infection prevention | Button |
| `surveillance.cluster.action.priorityExport` | Flag isolates for priority export | Button |
| `surveillance.cluster.action.exportList` | Export line list | Button |
| `surveillance.cluster.action.runNow` | Run detection now | Button |
| `surveillance.cluster.panel.lineList` | Specimens in this signal | Panel heading |
| `surveillance.cluster.panel.curve` | Cases over time | Panel heading |
| `surveillance.cluster.panel.location` | Where | Panel heading |
| `surveillance.cluster.panel.profile` | Resistance patterns | Panel heading |
| `surveillance.cluster.panel.comparison` | Compared to normal | Panel heading |
| `surveillance.cluster.panel.notes` | Investigation notes | Panel heading |
| `surveillance.cluster.comparison.text` | {{observed}} cases where about {{expected}} would be usual for this organism, place and period. | Comparison |
| `surveillance.cluster.lineList.noAst` | No susceptibility results | Line list cell |
| `surveillance.cluster.degraded.noLocation.title` | Spatial detection unavailable | Notification |
| `surveillance.cluster.degraded.noLocation.body` | No location could be determined for recent results, so detection is running on time only. Enable coordinate capture to detect clusters by place. | Notification |
| `surveillance.cluster.degraded.baseline.title` | Statistical detection not yet available | Notification |
| `surveillance.cluster.degraded.baseline.body` | This laboratory needs {{days}} more days of results before clusters can be compared against normal. Watchlist alerts are active now. | Notification |
| `surveillance.cluster.confirm.send.title` | Send this cluster onward? | Modal title |
| `surveillance.cluster.confirm.send.body` | {{recipients}} will be notified and {{count}} isolates will be flagged for priority export. | Modal body |
| `surveillance.cluster.history.title` | Detection History | Page title |
| `surveillance.cluster.history.runs` | Detection runs | Section |
| `surveillance.cluster.history.closed` | Closed signals | Section |
| `surveillance.cluster.config.title` | Cluster Detection | Admin page title |
| `surveillance.cluster.config.domains` | Domains | Section |
| `surveillance.cluster.config.parameters` | Detection settings | Section |
| `surveillance.cluster.config.watchlist` | Watchlist | Section |
| `surveillance.cluster.config.eligibleTests` | Tests counted as detections | Section |
| `surveillance.cluster.config.recipients` | Notification recipients | Section |
| `surveillance.cluster.config.baselineDays` | Baseline period (days) | Setting |
| `surveillance.cluster.config.maxWindow` | Longest cluster considered (days) | Setting |
| `surveillance.cluster.config.replications` | Simulation runs | Setting |
| `surveillance.cluster.config.threshold` | Alert threshold (recurrence interval, days) | Setting |
| `surveillance.cluster.config.gridMetres` | Location grid size (metres) | Setting |
| `surveillance.cluster.config.gridMetres.help` | Smaller values find tighter clusters but may split real ones; larger values are better for rural catchments. | Setting help |
| `surveillance.cluster.config.overdueDays` | Mark unreviewed signals overdue after (days) | Setting |
| `surveillance.cluster.config.showDeactivated` | Show deactivated | Watchlist toggle |
| `surveillance.cluster.config.action.deactivate` | Deactivate | Watchlist action |
| `surveillance.cluster.config.action.reactivate` | Reactivate | Watchlist action |
| `surveillance.cluster.config.coverage` | {{percent}}% of recent results have a usable location | Coverage indicator |
| `surveillance.cluster.config.tuning.title` | What these settings would have done | Tuning view |
| `surveillance.cluster.config.tuning.body` | Over the past year these settings would have raised {{count}} signals. | Tuning view |
| `surveillance.cluster.lineList.column.labNumber` | Lab number | Line list column |
| `surveillance.cluster.lineList.column.collected` | Collected | Line list column |
| `surveillance.cluster.lineList.column.patient` | Patient | Line list column, clinical |
| `surveillance.cluster.lineList.column.sampleSubject` | Sample / coordinates | Line list column, environmental |
| `surveillance.cluster.lineList.column.samplingSite` | Sampling site | Line list column, vector |
| `surveillance.cluster.lineList.column.specimen` | Specimen | Line list column, clinical |
| `surveillance.cluster.lineList.column.sampleType` | Sample type | Line list column, environmental and vector |
| `surveillance.cluster.lineList.action.openCase` | Open case | Line list row action |
| `surveillance.cluster.curve.legend.baseline` | Baseline weeks | Epidemic curve legend |
| `surveillance.cluster.curve.legend.window` | Signal window | Epidemic curve legend |
| `surveillance.cluster.curve.axis.week` | Week beginning | Epidemic curve axis and table |
| `surveillance.cluster.curve.axis.cases` | Cases | Epidemic curve axis and table |
| `surveillance.cluster.location.gridCaption` | Detections by grid cell — {{metres}} m grid | Location panel |
| `surveillance.cluster.location.column.location` | Location | Location table column |
| `surveillance.cluster.location.column.inWindow` | In signal window | Location table column |
| `surveillance.cluster.location.wardOnly` | This signal resolved to ward. No map is shown because no coordinates were available for these cases. | Location panel |
| `surveillance.cluster.profile.legend` | S = Susceptible · I = Intermediate · R = Resistant · — = not tested | Resistance panel legend |
| `surveillance.cluster.profile.none` | No susceptibility testing is performed for this domain. | Resistance panel |
| `surveillance.cluster.queue.sortNote` | Sorted strongest first. Select a row to investigate. | Queue footer |
| `surveillance.cluster.queue.lastRun` | Detection last ran {{when}} · next run {{next}} · {{count}} results examined | Page subtitle |
| `surveillance.cluster.queue.budgetNote` | {{count}} signals raised in the past 12 months. | Queue footer |
| `surveillance.cluster.action.save` | Save outcome | Button |
| `surveillance.cluster.action.addNote` | Add a note… | Placeholder |
| `surveillance.cluster.action.outboundLocked` | Outbound actions unlock once the cluster is confirmed. | Action bar help |
| `surveillance.cluster.saved.title` | Outcome recorded | Success notification |
| `surveillance.cluster.history.column.run` | Run | History column |
| `surveillance.cluster.history.column.window` | Window analysed | History column |
| `surveillance.cluster.history.column.events` | Events | History column |
| `surveillance.cluster.history.column.noLocation` | No location | History column |
| `surveillance.cluster.history.column.signals` | Signals | History column |
| `surveillance.cluster.history.column.duration` | Duration | History column |
| `surveillance.cluster.history.column.outcome` | Outcome | History column |
| `surveillance.cluster.history.run.completed` | Completed | Run outcome |
| `surveillance.cluster.history.run.partial` | Partial | Run outcome |
| `surveillance.cluster.history.column.closedOn` | Closed | Closed-signal column |
| `surveillance.cluster.history.column.closedBy` | By | Closed-signal column |
| `surveillance.cluster.history.column.reason` | Reason recorded | Closed-signal column |
| `surveillance.cluster.config.schedule` | Detection schedule | Setting |
| `surveillance.cluster.config.action.addWatchlist` | Add watchlist entry | Button |
| `surveillance.cluster.config.action.addTest` | Add a test | Button |
| `surveillance.cluster.config.action.searchCatalogue` | Search the test catalogue… | Placeholder |
| `surveillance.cluster.config.action.save` | Save settings | Button |
| `surveillance.cluster.config.action.restoreDefaults` | Restore defaults | Button |
| `surveillance.cluster.footnote.method` | First isolate per patient per period; screening cultures, contaminants and unverified results excluded. | Method footnote on exports |

---

## 9. Dependencies

**Upstream — must exist first:**

1. **The microbiology module (OGC-782) — CRITICAL.** Microbiology cases, isolates and AST runs exist
   only on the stacked OGC-782 branch deployed to `amr.openelis-global.org`; nothing matching them is
   on `develop`. Two High UAT findings are open against it. Clinical cluster detection cannot be built
   until this merges. **Environmental and vector detection do not share this dependency** and could
   ship first if sequencing demanded it.
2. **The M-09 first-isolate de-duplication routine — HIGH.** Specified for Phase 1B, not built. FR-8
   invokes it. If M-09 slips, clinical detection slips with it. This is the same dependency M-13
   carries.
3. **Critical-result acknowledgment and the alerts model — MEDIUM.** Recorded as a queued idea, not
   built. FR-36's attention-feed integration depends on it; until it exists the queue stands alone and
   adopts the shared model later.
4. **The home page attention feed (OGC-896) — MEDIUM.** FR-36 places a count there.
5. **Priority surveillance export — MEDIUM.** FR-52 flags isolates for the M-09 / M-15 export
   selection, which must gain the concept of a priority flag.

**New information this feature must introduce:**

5a. **A surveillance notification recipient list.** The built notification system delivers to *patients*
   and *providers* on four channels. It holds no standing list of infection-prevention contacts, so the
   recipients in FR-60 are genuinely new information and are declared here rather than assumed. Only the
   list is new — the channels, templates and delivery mechanism are reused unchanged.

**Configuration change owned by this work:**

6. **Patient coordinate capture becomes default-on (FR-63).** Currently off by default, which is why
   no deployment holds this data. Changing the default affects upgrades and must be release-noted.

**Data reality to plan around, not a blocker:**

7. **Patient coordinates are unpopulated everywhere today.** Enabling capture starts accumulation; it
   does not create history. Spatial clinical detection becomes useful over months, not on upgrade day
   (FR-64, FR-65). Ward and department scanning works immediately.

**No new dependency for:** patient coordinates, sample coordinates, vector sampling sites, ward,
department, organism, AST interpretation, specimen type, or collection date — all exist today.

---

## 10. Out of Scope

- **Cross-laboratory or national cluster views.** Single tenant (D-001). Confirmed clusters are pushed
  outward; they are never aggregated in the application.
- **Genomic or whole-genome-sequencing cluster confirmation.** Signals are phenotypic. Sequencing is
  what an investigator does after the alert, outside OpenELIS.
- **Contact tracing, patient movement history, bed-level or admission/transfer tracking.** OpenELIS does
  not hold this information.
- **Outbreak case management.** M-16 detects, evidences and hands off. Managing the response is not a
  laboratory information system's job.
- **Any SaTScan executable or external statistical service.**
- **Adjustment for population at risk or for long-term secular trend.** Neither is available without
  patient-days or catchment denominators OpenELIS does not hold — the same limitation WHONET has, and
  the reason the space-time permutation model is the primary one.
- **Automatic escalation.** Nothing is sent onward without a human confirming the cluster.
- **Predictive or forecasting analytics.** Detection answers "is something happening now", not "what
  will happen next".
- **Merging signals across domains.** Presented as a cross-reference; never combined (§5.6).

---

## 11. Acceptance Criteria

- **AC-M16-01** — A scheduled detection run executes across every enabled domain without user action,
  and records its parameters, window, counts, signals raised and outcome.
- **AC-M16-02** — Clinical events are selected by **invoking the M-09 de-duplication routine**, not a
  second implementation, and the parameters used are recorded on the run.
- **AC-M16-03** — Screening cultures, contaminants, and non-final or unverified results are excluded
  from clinical detection counts.
- **AC-M16-04** — Environmental and vector events are not patient-de-duplicated, and a positive vector
  pool counts as exactly one event.
- **AC-M16-05** — Clinical location resolves patient coordinates first, then ward, then department, and
  the resolution used is recorded on the event.
- **AC-M16-06** — Coordinate events are gridded at the configured edge length, and changing that
  setting changes the grouping on the next run.
- **AC-M16-07** — A space-time permutation scan raises a signal when the recurrence interval exceeds the
  configured threshold, and a Poisson temporal scan runs for events without usable location.
- **AC-M16-08** — Overlapping windows over substantially the same events are merged into one signal
  before it appears in the queue.
- **AC-M16-09** — Signals are never raised from events in more than one domain.
- **AC-M16-10** — Where a domain has less than the configured minimum history, the statistical scan is
  suppressed, the interface states how much longer, and **watchlist alerts still fire**.
- **AC-M16-11** — Where no recent events resolve to a location, detection runs on time only and the
  interface states that spatial detection is unavailable and why.
- **AC-M16-12** — A watchlist alert is raised on the first ever occurrence of a watched agent, at a
  single event, and is labelled as a watchlist alert rather than a statistical finding.
- **AC-M16-13** — Signal strength is displayed in plain language as a recurrence interval, with the
  numeric value available alongside; no *p*-value appears in the interface.
- **AC-M16-14** — Selecting a signal shows, inline, the line list, epidemic curve, location breakdown,
  resistance-pattern comparison and observed-versus-expected comparison.
- **AC-M16-15** — A signal can be dispositioned Under investigation, Confirmed outbreak, or Ruled out;
  Ruled out requires a reason; every change is traceable.
- **AC-M16-16** — There is **no delete action** anywhere in the feature; dispositioned signals remain
  readable in Detection History permanently, and watchlist entries deactivate rather than delete.
- **AC-M16-17** — Confirming a cluster offers notification through the **existing** notification
  delivery channels and offers to flag isolates for priority export, both behind one confirm modal
  naming exactly who and what.
- **AC-M16-18** — A confirmed cluster creates no non-conforming event.
- **AC-M16-19** — The line list exports to CSV and PDF through the existing reporting infrastructure,
  carrying the method footnote.
- **AC-M16-20** — Every scan parameter in §4.11 is editable, shows its default and a plain-language
  effect, and is recorded on runs made under it.
- **AC-M16-21** — The tuning view reports how many signals the current parameters would have raised over
  the past year, before the change is saved.
- **AC-M16-22** — Patient coordinate capture is on by default on new and upgraded deployments, existing
  patients are not back-populated, and coordinates remain optional at registration.
- **AC-M16-23** — The configuration page reports the proportion of recent events resolving to a
  location.
- **AC-M16-24** — Every visible string resolves through an i18n key in the `surveillance.cluster.*`
  namespace.
- **AC-M16-25** — Signals appear with an open count on the home attention feed, and a user who may see
  the count but not open signals sees the item disabled with the count rather than hidden.
- **AC-M16-26** — An undispositioned signal older than the configured age is marked overdue in the queue
  and the attention feed.

---

## 12. Non-functional

- A nightly run over one year of a busy laboratory's results (order of 5,000 isolates plus environmental
  and vector events) completes within the maintenance window and does not degrade interactive use;
  Monte Carlo replication is the dominant cost and is bounded by the configured replication count.
- The signal queue and an investigation panel render within the interactive targets applied elsewhere in
  the module.
- WCAG 2.1 AA: the queue and line list are keyboard navigable; signal strength, class and disposition
  are conveyed by text and not by colour alone; the epidemic curve and location breakdown have
  text-equivalent tabular views; map content is not the only representation of location.
- All numbers, dates and plain-language strength phrasings are localisable, including the recurrence
  interval sentence.
- Detection failure is visible (FR-4). Silent non-execution is the principal failure mode of a
  scheduled analysis and is treated as a defect, not an edge case.

---

## 13. References

- M-00 Microbiology Module Parent Specification — module scope, glossary, domain and workflow rules
- M-09 WHONET Export — **first-isolate de-duplication routine, invoked unchanged**; surveillance export
- M-13 Antibiogram — precedent for reusing the M-09 de-duplication; shared isolate set and reporting
  infrastructure
- M-15 GLASS Surveillance via Consolidated FHIR — the in-app / central boundary; priority export path
- M-11 Critical Result Acknowledgment — alert and acknowledgment model
- `m-16-cluster-detection-crosscheck-and-brief.md` — portfolio crosscheck, design brief, decision record
- Kulldorff scan statistic — space-time permutation and Poisson models, as used by SaTScan and WHONET
- WHONET-SaTScan evaluation, Italian hospital 2012–2014 — parameter set and signal-volume evidence
- SaTScan versus WHONET comparison study — WHONET's limitations without population-at-risk adjustment
- CLUSTER randomised trial, 82 hospitals — alert-volume budget and outbreak-size reduction evidence
