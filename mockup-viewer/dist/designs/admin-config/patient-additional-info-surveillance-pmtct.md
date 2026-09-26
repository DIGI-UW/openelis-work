# Patient & Order Additional Information — Disease Surveillance & HIV/PMTCT — FRS

**Feature area:** Patient/Order data capture + Admin configuration
**Capture screens:** Add Order (patient + order steps) · Patient screen — edit and view are the same screen (`/PatientManagement`)
**Admin surface:** Order & Patient Entry Configuration (redesign) — new "Additional Information" groups
**Response options:** OpenELIS Dictionary (`/MasterListsPage/DictionaryMenu`)
**Domain-sensitive:** each section scoped to CLINICAL / ENVIRONMENTAL / VECTOR (D-004)
**Status:** Draft v4 — **BAKED INTO OGC-781.** This is now the **field-catalog appendix** to
`programs-management-frs-consolidated.md` (Programs Management rework), which owns the build. It holds
the Madagascar Disease-Surveillance / HIV-PMTCT field detail + baseline-region field list; read it
alongside the Programs FRS's "Baked-in: Baseline Additional Information" section (FR-21–FR-26). Note:
the order-details region **already exists for ENV** entry (extend to Clinical + Vector); the patient
Additional Information block already exists (add config).
**Locale:** Single-language deployment (Madagascar). **English UI.** Response options are entered by the admin as free text in the site's working language and stored/displayed as-is — no multi-language or translation support needed.
**Version-agnostic** — version boundaries decided in `/breakdown`.

> **v5 change (2026-08-26).** Three additions, all driven by the same gap: the admin could arrange
> and configure questions but could not **create**, **re-order**, or **domain-scope** them
> individually. (a) Admins can now **add a new question** to any section — this **supersedes the
> earlier "field catalog is dev-defined, admins cannot invent fields" rule** in FR-1/FR-12/AC-14,
> and aligns this doc with `programs-management-frs-consolidated.md` **FR-21.1** (admin-authored
> questions get FHIR for free as `QuestionnaireResponse` items). (b) Questions can be **re-ordered
> within a section** (FR-15). (c) **Domain lives on the section, one domain per
> section** — there are no domain chips on questions and no multi-domain sections, because
> environmental and vector orders share **no** fields with clinical (FR-1d). The baseline region is
> **three separate sections**, one per domain, and an admin-side toggle switches between them
> (FR-16, FR-17). Reordering is also added to the shared builder in Programs FR-13 so the capability
> is built once, not twice.
>
> **v5.1 (2026-08-26) — usability pass.** Eleven review findings folded in: a **page-level Save**
> instead of instant commit (FR-18, closing an inconsistency with Programs FR-13); **type locks once
> a question is answered** (FR-14.3, the sibling rule to FR-14.2); a **progressive-disclosure question
> row** that moves Required, Section, Position and Level off the collapsed row (FR-19); **move-to-
> position** alongside the arrows (FR-15.1); **cross-domain question search** (FR-20); **hidden
> questions collapsed into a disclosure** (FR-21); an explicit **new-question state** (FR-14.4);
> self-explaining class badges (FR-1c); level described by consequence (FR-14.1); and **"question"
> fixed as the canonical noun** (FR-22).
>
> **v5.2 (2026-08-26).** Patient-level and order-level questions render in **different physical areas
> of the app** and are never seen together, so the **Patient screen / Order entry** switch is promoted
> from a preview control to the **primary filter over the whole admin surface** (FR-23). Level is then
> implied by the selected surface: the per-question level chips and the Level control are **removed**.
> Baseline sections become one per **(domain, level)** pair — adding a clinical **Order details**
> baseline (FR-1d). Reordering gains **drag-and-drop**, with the arrows retained as the keyboard path
> (FR-15.2). The right-hand panel is renamed **Live preview**, matching Programs FR-13.5.
>
> **v5.3 (2026-08-26) — second usability pass.** The domain × screen segmented controls are replaced
> by **four SideNav items with four routes** (FR-17), which the standing IA convention requires and
> which also removes the silent mode-switching they caused. The save bar **names where its pending
> changes are** (FR-18.1). A read-only **Required** indicator returns to the collapsed row (FR-19.1).
> A section spanning both screens **states its counterpart count** (FR-23.3). Search results carry the
> **screen** in their path (FR-20). And, on performance grounds, a question records a **`hasData`
> boolean, not an answer count** (FR-14.5) — counting answers per question would mean a COUNT per row
> on every page load.

---

## Lab Context

### Current State
When a lab registers a patient or an order, OpenELIS captures fixed demographics plus a small
"Additional Information" area. For **disease surveillance** (tracking notifiable diseases) and
**PMTCT/EID** (Prevention of Mother-To-Child Transmission of HIV / Early Infant Diagnosis —
testing an infant born to an HIV-positive mother), clinicians must record extra context the
system has no home for today: symptoms and case classification for a suspected disease, or the
mother's HIV treatment and breastfeeding history for an infant's HIV test. Today that context
lives on the **paper request form** or in a free-text notes box, so it never becomes structured,
searchable data. (This deployment does not use the legacy hardcoded RETROCI study forms; it needs
a general, admin-configurable mechanism.)

### Pain
Three concrete problems. The data is **lost to reporting**: a surveillance officer can't query
"suspected cases with an epidemiological link this month," and an EID coordinator can't query
"infants whose mother had a high viral load and who were breastfed" — it only exists on paper.
It gets **re-keyed or lost between visits**: an infant tested at 6 weeks and again at 9 months has
the mother's details and ARV history hand-written twice, with transcription errors each time. And
**every deployment sees the same fixed form**: a general clinical lab has no need for "maternal
viral load (copies/ml)," so a hardcoded field set would clutter their screens.

### What Changes
The lab captures this as **structured Additional Information** in two labelled sections —
**Disease Surveillance** and **HIV / PMTCT–EID** — on the surfaces staff already use. Fields that
describe the *person* (medical history, the linked mother, her HIV status) persist on the patient
and aren't re-entered next visit; fields that describe *this request* (case classification,
symptom onset, this episode's maternal viral load, reason for the request) attach to the order.
An **administrator turns each section and field on or off, and defines the answer choices**
(reusing the existing Dictionary), so a general clinical lab sees none of it and a PMTCT site sees
exactly what it needs, with response lists it controls. Once captured, the data is structured and
reportable instead of trapped on paper.

---

## In one line

We are making **parts of the patient/order forms dynamic** — config-driven regions instead of
hard-coded fields. Three dynamic regions: (a) a **patient** Additional Information region, (b) an
**order** baseline region, and (c) an **order** program region that renders a selected **Program's
FHIR Questionnaire** (OGC-781). The forms gain render points that pull from config + questionnaires;
the fields themselves stay dev-defined (FHIR-mapped).

---

## Relationship to Programs (OGC-781) — unified model

**This feature is reframed to sit on top of the Programs Management rework (OGC-781), not to
duplicate it.** Additional Information is captured in **three attachment modes**:

1. **Patient-baseline** — fields **always** on the patient (persist on the patient record; shown on
   the Patient screen [edit = view] and Add Order). This is the existing **General** set (incl. the
   address-hierarchy fields delegating to Site Information) plus any always-on patient traits (e.g.
   the mother link + mother HIV status, which persist and so can't live in a per-order questionnaire).
2. **Order-baseline** — customary fields on **every** order, regardless of program.
3. **Program presets** — an optional bundle **attached to an order** = an OGC-781 **Program** carrying
   a **FHIR Questionnaire**. Disease Surveillance and HIV/PMTCT–EID are authored as **Programs** using
   OGC-781's **Visual Builder ↔ JSON** questionnaire editor (question cards, 10 field types, inline
   answer-options, live preview) — **not** a separate field-builder in this feature.

**What OGC-781 already provides (reuse — do not rebuild here):** the program/preset concept and
order attachment; the questionnaire field editor (types, inline options, live preview) that earlier
drafts of this FRS specced independently; per-program **Domain** (our domain-sensitivity) and
order-picker filtering; **Lab unit (Test Section)** binding (our lab-unit-sensitivity); Deactivate/
Reactivate lifecycle; FHIR Questionnaire storage → QuestionnaireResponse export.

**Net-new in this feature (the delta):** the two **baseline** groups (patient-always, order-always)
and their admin show/hide + label config (incl. address-hierarchy delegation); folding the existing
patient Additional Information fields into the patient-baseline group; and authoring the Madagascar
Disease Surveillance / HIV-PMTCT **content as Programs** via OGC-781. Sections below that describe a
standalone "sections + field type + inline option" admin surface are **superseded by OGC-781's
questionnaire builder for the program-preset mode**; they remain only as the shape of the two
baseline groups.

---

## Overview

A single, configurable **Additional Information** framework governing three sections — **General**
(the fields OpenELIS already has today, folded in as entries), **Disease Surveillance** ("Autres
maladies"), and **HIV / PMTCT–EID** ("VIH") — rendered on the capture screens, wholly controlled
from admin. Design pillars:

0. **One framework, existing fields included.** The current patient "Additional Information" fields
   (verified live: Health Region, Health District, Education, Marital Status, Nationality +
   Specify Other, Occupation, Target Disease Programme, Custom Notes) become the **General** section
   — configurable entries alongside the new sections. They keep today's behavior (default on) so
   nothing regresses; the two new sections ship off.

1. **Patient-level vs order-level split.** Person-traits persist on the patient (all patient
   surfaces); episode data attaches to the order. Order-level fields need a new **"Additional
   order details"** area on the order (does not exist today — see Dependencies).

1a. **Domain-sensitive (D-004).** Each section carries a **Domain scope** (CLINICAL / ENVIRONMENTAL
   / VECTOR — never BOTH). Order entry is domain-scoped (three routes), so a section renders only
   when the order's domain is in its scope; Disease Surveillance and HIV/PMTCT default to
   **CLINICAL**, so they don't appear on environmental/vector orders. General defaults to all three.
   The Patient screen is cross-domain (not domain-routed) and shows enabled patient-level fields.
2. **Admin-controlled visibility + response options (default off).** Each section and field has
   admin **Visible** and **Required** toggles, and each coded field is **bound to a Dictionary
   category** whose entries (the answer choices) the admin maintains via the existing Dictionary
   (Add/Modify/**Deactivate**). Everything ships **off** — no deployment is affected until an
   admin opts in.
3. **Tie-in to the Order & Patient Entry redesign.** This is delivered as new configuration
   groups within the redesigned **Order & Patient Entry Configuration** page
   (`designs/admin-config/order-patient-entry.html`), not a bolt-on to the thin legacy table.

### Navigation & URLs (verified live v3.2.1.11 unless noted)
- **Admin config:** Order & Patient Entry Configuration (redesign). Legacy pages it consolidates:
  Patient Entry Configuration `/MasterListsPage/PatientConfigurationMenu` and Order Entry
  Configuration `/MasterListsPage/SampleEntryConfigurationMenu`. New "Additional Information"
  groups live here.
- **Response options:** Dictionary `/MasterListsPage/DictionaryMenu` (Category → Entry, Add /
  Modify / Deactivate).
- **Patient capture:** `/PatientManagement` ("Add Or Modify Patient" — search → patient form;
  Additional Information renders in the form). **Edit and View are the same screen** — one Patient
  surface, no separate read-only view.
- **Order capture:** Add Order flow (patient step + a new "Additional order details" order step).
- **Breadcrumb (admin):** `Home / Admin Management / Order & Patient Entry Configuration /
  Additional Information / <view>` (preserve the "Admin" → "Admin Management" drift — D-013).
- **The four Additional Information views are four SideNav items and four routes** (FR-17). New
  `editorKey`s following the verified `/MasterListsPage/<editorKey>` pattern:

| SideNav item | Route | Configures |
|---|---|---|
| Patient screen | `/MasterListsPage/addlInfoPatient` | clinical patient-level questions |
| Clinical order | `/MasterListsPage/addlInfoClinicalOrder` | clinical order-level questions |
| Environmental order | `/MasterListsPage/addlInfoEnvOrder` | environmental order-level questions |
| Vector order | `/MasterListsPage/addlInfoVectorOrder` | vector order-level questions |

  SideNav path: `Admin Management → Order & Patient Entry Configuration → Additional Information →
  <the four items>`. Each route is deep-linkable and loads that view directly.

---

## User Stories

1. **As a PMTCT clinician**, I record the mother's HIV/ARV context once on the infant's record, so
   I don't re-transcribe it from paper each visit.
2. **As a surveillance officer**, I get case classification, symptoms, onset and epi-link as
   structured order fields, so suspected cases become reportable.
3. **As an administrator**, I turn each section and field on/off and define the answer choices, so
   my deployment shows only the Additional Information it uses, with lists I control.
4. **As an admin at a general clinical lab**, all of this is off by default, so nothing changes
   unless I opt in.
5. **As a report consumer**, values are structured/coded, so I can filter and export them.

---

## Functional Requirements

**FR-1 — Admin-managed sections.** Additional Information is organised into **sections the admin
manages** — add, rename, remove, reorder, and set a Domain scope per section — and each question is
**assigned to a section** by the admin. Sections render as collapsible groups on the capture
surfaces. The feature **ships with three seeded sections**: **General** (a **system** section holding
the existing built-in patient fields — cannot be deleted), **Disease Surveillance**, and
**HIV/PMTCT–EID** (both deletable/renamable). Deleting a custom section reassigns its questions to
**its domain's baseline section** (FR-1d) — never across domains.

**FR-1c — Two classes of question (supersedes the old "dev-defined only" rule).** A section holds
questions of two kinds, visually distinguished in the admin surface:

| Class | Origin | What the admin can do | FHIR |
|---|---|---|---|
| **Existing structured field** (badged `existing`) | Dev-defined; already backed by a real OpenELIS entity — address hierarchy, Education, Marital Status, Nationality, Occupation, Target Disease Programme, Custom Notes, the mother patient-link | **Configure only**: show/hide, required, label, section, order, domain scope. Cannot be re-authored or removed. | Keeps its **bespoke existing mapping** (e.g. `Patient.address`) — Programs FR-21.2 |
| **Authored question** (badged `added`) | Created by the admin via FR-14 | Full authoring: text, type, answer options, level, section, order, domain scope; removable per FR-14.2 | Exported automatically as a **`QuestionnaireResponse`** item — no per-field developer mapping needed — Programs FR-21.1 |

Earlier drafts of this FRS stated the catalog was closed and admins could not invent fields. That
The badges are the only on-screen signal that these two classes behave differently, so they must
explain themselves rather than rely on the admin having read this table: each badge carries a
tooltip stating what the class can and cannot do, and when an admin looks for a **Remove** on an
`existing` question the row says why there isn't one ("built-in question — hide it instead of
removing it") rather than simply omitting the control.

The old rule now applies **only to the first row of the table**. It is superseded for authored questions,
because the FHIR-mapping concern that motivated it is answered by the Questionnaire mechanism rather
than by locking the catalog.

**FR-1a — Existing fields folded in as configurable entries.** The current patient Additional
Information fields (Health Region, Health District, Education, Marital Status, Nationality + Specify
Other, Occupation, Target Disease Programme, Custom Notes — verified live) become the **General**
section: same configurable Visible/Required/Domain controls as the new fields. They default to
their **current on-state** (no regression). Their existing response lists (Education, Marital
Status, Nationality, etc.) remain their source; managing them via the same Dictionary affordance is
allowed but not required.

**FR-1b — One domain per section (D-004).** Every section belongs to **exactly one** domain —
CLINICAL, ENVIRONMENTAL or VECTOR (never BOTH, never a multi-domain set). A section renders at Add
Order only on its own domain's route. There is **no per-question domain scope**: a question's domain
is simply its section's domain, so there are no domain chips on question rows and nothing to
reconcile between the two levels. Disease Surveillance and HIV/PMTCT–EID are CLINICAL. The Patient
screen is cross-domain and shows enabled patient-level questions — which, per FR-1d, exist only in
the clinical domain anyway.

**FR-1d — Three baseline sections, one per domain (environmental and vector orders have no
patient).** The baseline region is **not one section shown three ways** — it is three separate,
unrelated sections, because the domains share no fields:

There is **one baseline section per (domain, level) pair** — not per domain — because a question's
physical home is determined by both:

| Domain | Level | Baseline section | Contents |
|---|---|---|---|
| CLINICAL | patient | **Patient details** (the section previously called "General") | The existing built-in patient Additional Information fields (FR-1a) |
| CLINICAL | order | **Order details** | Empty on delivery. This is the clinical **order-baseline** — the always-on questions for the "Additional order details" area declared in Dependencies. Because it ships with nothing in it, it MUST carry an empty state saying what it is for ("Questions asked on every clinical order. Nothing here yet — add the first one."), never a bare empty list |
| ENVIRONMENTAL | order | **Environmental order details** | The sampling-site / collection fields already specced in `sample-collection/environmental-order-entry.md` |
| VECTOR | order | **Vector order details** | The intake / collection-context fields already specced in `vector-surveillance/vector-collection-workflow.md` FR-V02-S1-002 / 002a |

There is deliberately **no environmental or vector patient baseline** — those orders have no patient
record at all (below). Keying baselines on the pair also makes the delete-fallback unambiguous: a
deleted custom section's questions each return to the baseline for **their own** domain *and* level,
so an order-level question can never land in a patient-level section.

**Patient details is hard-locked to CLINICAL** and its domain cannot be changed. This is not a
preference — `vector-collection-workflow.md` **FR-V02-S1-001** states that *"When Vector domain is
active, the Patient section MUST be hidden. No patient demographics are captured for vector
orders,"* and environmental orders identify the requester as an **Organization** (Submitter), not a
patient. Patient-level questions on an environmental or vector order would have no patient record to
bind to. The admin surface shows the lock with that reason rather than silently disabling the
control. All three baseline sections are **system** sections — renamable, but not deletable.

**FR-2 — Admin visibility + required (default off).** In the redesigned Order & Patient Entry
Configuration, each section has a master **Visible** toggle; each field has **Visible** and (where
applicable) **Required** toggles. All default **off**; child controls grey out when the section is
off (matches the redesign's existing conditional-field pattern).

**FR-3 — Inline, admin-defined response options (Dictionary-backed).** Each coded field is bound to
a **Dictionary category**; its answer choices are the category's active entries. The admin manages
the list **inline** on the config page — expanding a field reveals its options as chips with an
**"Add option" (type + Enter)** input and per-option **deactivate/reactivate** — with **no page
jump** to the Dictionary screen. Under the hood it's still the Dictionary category (Add / Modify /
Deactivate — never delete, D-002), so deactivating an option removes it as a choice without breaking
saved values. Where a category is **shared by multiple fields**, the editor flags that (editing
affects all of them). Coded fields render at capture time as typeahead ComboBox/Select over the
active entries (D-007).

> UX note (Casey): keep option management inline and low-friction — no context switch to the
> Dictionary page just to add one value. The dedicated Dictionary page remains available for bulk
> work, but day-to-day "add a response" happens right where the field is configured.

**FR-4 — Patient-level vs order-level placement.** Patient-level fields render on Add Order and on
the single Patient screen (edit = view), and persist on the patient (one current value, editable,
with change history). Order-level fields render on Add Order (and the order/sample view) in the new
"Additional order details" area and persist against that order. (Per-field split in Data Model.)

**FR-5 — Mother as a patient link.** In the HIV section the mother is captured by patient search
(typeahead — D-007); selecting her fills read-only Mother code / Nom / Prénoms and links the
records. Free-text fallback when the mother has no OpenELIS record. Patient-level.

**FR-6 — Structured field types** (Select/ComboBox for coded, DatePicker, NumberInput with units,
TextArea for narrative) — never a single free-text blob.

**FR-7 — Required enforcement.** A visible Required field blocks save (form + save API) until
filled and shows the required marker. Required has no effect while hidden.

**FR-8 — No impact when disabled.** With all toggles off (default), the surfaces are unchanged;
an upgrade with no admin action is a no-op.

**FR-9 — Single-language (no translation layer).** UI labels ship in **English** via i18n keys.
This is a single-language deployment: response options are entered by the admin as free text in
the site's working language and stored/displayed **as-is** — no per-locale variants, no translation
of options or labels required.

**FR-10 — Reporting-ready.** Values stored as structured/coded, queryable for downstream reports
and export (report screens themselves out of scope).

**FR-11 — FHIR mapping (developer task).** OpenELIS exports data over FHIR, so every Additional
Information element must be mapped to the appropriate FHIR resource/element by the implementing
developer, and that mapping recorded somewhere durable (see FHIR Mapping section). Fields with no
sensible FHIR target are captured as OpenELIS-local data and explicitly marked "no FHIR export."
This is a required part of the build, not an afterthought.

**FR-12 — Admin-configurable field type (locked intrinsics).** Each field has a **Type** the admin
sets in config, defaulting per the rule below. Selectable types for an existing structured field:
**Text**, **Single-select**, **Multi-select**, **Yes/No**. An **authored** question (FR-14) has no
locked intrinsics and offers the fuller set in FR-14.1. The inline option editor (FR-3) appears only for the select/Yes-No
types. **Locked (intrinsic) types the admin cannot change:** **Date**, **Number** (with unit),
**Patient link** (the mother), and **Address hierarchy** (Region/District — see FR-13) — these are
fixed by the data's nature so, e.g., "maternal viral load" can't be set to free text.
- **Type decision rule (defaults):** use **Select** when the answer is a finite, reusable set the
  lab standardizes and reports on; use **Text** when it's open-ended/narrative/unique. There is a
  single **Text** type — single- vs multi-line is a rendering detail, not a separate admin type.

**FR-13 — Address hierarchy fields delegate to the existing mechanism.** Health Region and Health
District are **Address hierarchy** fields (governed by `useNewAddressHierarchy`); their option
values come from **Organization data** and their labels are the **mappable geographic-unit labels**.
Verified live: these labels are set today in **Site Information** (`/MasterListsPage/SiteInformationMenu`)
as **"Geographic Unit 1 Label" = Region** and **"Geographic Unit 2 Label" = District** (alongside
"Address line 1/2/3 label" = Street / Camp-Commune / Town). In this framework an admin can
**show/hide** these fields and **edit their label** inline — but the edits **write through the
existing Site Information / address-hierarchy API** (no back-end change) and values stay
Organization-sourced (not a Dictionary category, no inline option editor). This lets the new admin
surface **replace the old Site-Information geographic-unit-label + show/hide option** while reusing
the existing back end.

**FR-14 — Add a question to a section.** Every section (including **General**) carries an **"Add
question"** action at the foot of its question list. Activating it appends a new question to **that
section, in last position**, seeded with a default text ("New question") and type **Text**, and opens
it inline for editing — no modal, no page jump, consistent with the inline editing already used for
answer options (FR-3). The new question is created **hidden** (`visible` off) so a half-authored
question never reaches a capture screen; the admin turns it on when it is ready. The action is
available on the seeded sections and on admin-created ones alike. Authored questions are stored as
**FHIR Questionnaire items** on the section's questionnaire and therefore export as
`QuestionnaireResponse` with no developer mapping work (Programs FR-21.1) — that is what makes admin
authoring safe here, and it is why FR-11's per-field mapping deliverable applies only to the
dev-defined existing fields.

**FR-14.1 — Properties of an authored question.** Editing an authored question inline exposes:
**Question text** (the capture-screen label), **Type** (Text / Single-select / Multi-select /
Yes-No / Date / Number / Decimal), **Answer options** for the select and Yes-No types via the same
inline chip editor as FR-3, **Level is not asked for** — it is inherited from the surface the admin is
working in when the question is created (FR-23), because a question authored while configuring the
Patient screen is by definition a patient-level question, **Required**, **Visible**, **Section**, **Order** (FR-15) and **Domain scope**
(FR-16). Changing type **preserves any answer options already entered**, so mis-picking a type is not
destructive. Where a Number question needs a **unit**, the unit is written to the questionnaire item
as the FHIR `questionnaire-unit` extension (mirrors Programs FR-15.3, which notes that a Quantity
authored in the Visual Builder alone is otherwise unit-unconstrained).

**FR-14.2 — Removing an authored question (no hard delete once answered).** An authored question can
be **removed outright only while `hasData` is false** (FR-14.5) — no saved patient or order has ever
held a value for it. Removal is confirmed in a Carbon `Modal` naming the question. **Once any answer exists,
remove is unavailable**; the admin **hides** the question instead (Visible → off), which takes it off
every capture screen while preserving the stored answers and their provenance. The admin surface
states which case applies **on the question row**, rather than letting the admin find out at the
confirmation step. Existing structured fields are never removable at all — they are hidden. (Design
addendum MUST D — preserve, don't delete.)

**FR-14.5 — `hasData`, not an answer count.** Every rule that turns on "this question has been
answered" (FR-14.2 remove, FR-14.3 type lock, and the row's state tag) reads a **boolean
`hasData`** on the question record — **never a count of answers**. Counting would mean one aggregate
query per question on every render of this page; a deployment with several sections of a dozen
questions each would issue dozens of COUNTs over the answer store just to draw an admin screen, and
those tables grow without bound.

`hasData` is set to true **once**, when the first answer for that question is saved, and is never
recomputed or decremented. It is therefore a single indexed column read, not an aggregate. It is
deliberately **one-way**: it is not cleared if answers are later voided, because the question's type
must stay locked for as long as any historical answer references it — which, under the no-hard-delete
rule (MUST D), is forever.

The UI shows it as a plain state — **"Data entered"** — and never a number. Nothing in this feature
needs to know *how many*; every rule is "is there any". Where an admin genuinely needs volume, that
is a reporting question, not an admin-config one.

**FR-14.3 — Type locks once answered.** A question's **Type cannot be changed once `hasData` is
true** (FR-14.5) — the sibling rule to FR-14.2, and for the same reason. Re-typing an answered
Single-select to Number does not migrate the stored answers; it leaves them uninterpretable against
a control that can no longer render them. Once it holds data, the Type control becomes a read-only tag
stating why ("Locked — data entered"). Everything else about an answered question stays
editable: its text, its answer options (add / deactivate, never delete — FR-3), required, visible,
section and position. Adding an option to an answered coded question is safe; removing one is
already prevented by the Dictionary's deactivate-don't-delete rule.

**FR-14.4 — A new question is visibly new.** A question created by FR-14 is hidden, which means
nothing changes on the capture screen when the admin adds one — a state that reads as "the button
didn't work". So until it is first switched on, the row is **visually marked as new** (a leading
accent and a "New — hidden until you switch it on" tag on the row itself, not buried in the expanded
panel), and it is **exempt from the hidden-question disclosure** (FR-21) so it never vanishes into a
collapsed group the moment it is created.

**FR-15 — Re-order questions within a section.** Each question row carries **Move up** and **Move
down** controls, matching the ↑↓ affordance sections already use on this same surface. Moving is
constrained to the question's own section; moving a question **between** sections keeps using the
existing "Move to section" control (FR-1). The controls are ordinary buttons — keyboard-reachable and
screen-reader-labelled ("Move *[question text]* up") — so re-ordering never depends on a pointer
drag. At the first and last position the corresponding control is **disabled, not hidden**, so a
row's controls don't reflow as questions move past it. The resulting order is persisted per question
(`displayOrder`, Data Model) and is the order the capture screens render, for existing and authored
questions alike.

**FR-15.1 — Move to position (companion to the arrows).** Arrows are the accessible, always-present
mechanism, but they are one step per press: in a fifteen-question section, moving the last question
to the top is fourteen presses. The expanded row (FR-19) therefore also offers **"Move to
position"** — a `Select` of the section's positions (1…n) that relocates the question in a single
action. Both mechanisms write the same `displayOrder`. Drag-and-drop is deliberately **not** the
primary mechanism: it is unusable by keyboard and screen-reader users, and Carbon offers no
first-class drag-reorder primitive.

**FR-15.2 — Drag-and-drop (primary for pointer users).** A question row can also be **dragged** to a
new position within its section. Drag is the fastest mechanism for a pointer user and the one most
admins will reach for, so it is offered as the primary affordance: the row shows a grab cursor and a
drag handle, the drop target is indicated during the drag, and dropping outside the section is a
no-op (cross-section moves stay with the Section control — FR-19).

It is **additive, never exclusive.** The arrows (FR-15) and Move-to-position (FR-15.1) remain, because
drag-and-drop is unusable by keyboard-only and screen-reader users and Carbon provides no accessible
drag primitive. All three mechanisms write the same `displayOrder`. A build that ships drag alone
fails WCAG 2.1 §2.1.1 (Keyboard) and is not acceptable.

**FR-16 — Domain is a property of the section, not of the question.** A section is created **in**
a domain and stays there; a question's domain is its section's domain, full stop. There are no domain
controls on a question row. Consequently a question is moved between domains only by moving it to a
section in another domain, which is a deliberate act rather than a chip toggle.

This is a **deliberate reversal of the per-question domain scope** proposed earlier in this feature's
design. It was dropped because the premise behind it was wrong: per-question scope pays off when
sections are *mostly* shared across domains and differ in a few questions. Here the domains share
**nothing** — a clinical order captures a person, an environmental order captures a sampling site,
a vector order captures a trapped organism pool. Modelling that as one section with per-question
overrides would give every admin a grid of chips to maintain for a case that never arises, and would
let them build a state (a patient question on a vector order) that the order screens cannot render.
Separate sections make the difference structural and unmistakable.

**FR-17 — Four views, four SideNav items, four routes (not in-page switches).** Domain (FR-16) and
screen (FR-23) together define **four real configurations**, and only four — clinical has both a
patient screen and an order screen; environmental and vector have an order screen only, because those
orders carry no patient (FR-1d). These are **not two in-page selectors** whose six combinations the
admin must compose in their head, two of which don't exist. They are **four SideNav submenu items**:

```
Admin Management
└ Order & Patient Entry Configuration
  └ Additional Information
    ├ Patient screen          /MasterListsPage/addlInfoPatient
    ├ Clinical order          /MasterListsPage/addlInfoClinicalOrder
    ├ Environmental order     /MasterListsPage/addlInfoEnvOrder
    └ Vector order            /MasterListsPage/addlInfoVectorOrder
```

This follows the standing convention that **multi-view screens nest as SideNav submenu items rather
than in-page tabs or segmented controls for top-level view switching** (design addendum, standing
UI/IA conventions). Three things fall out of it, each of which fixes a real problem the in-page
version had:

- **The whole set is visible at once.** The admin can see all four configurations without composing
  them from two controls, and can never select a combination that doesn't exist — the impossible
  "environmental patient screen" simply isn't in the tree, so FR-23.2's disabled-with-a-reason
  control is no longer needed.
- **Each view is deep-linkable.** A route per view means an admin can bookmark "vector order
  questions" and link a colleague straight to it. Pasting the URL loads the same view (skill URL
  rules).
- **No silent mode changes.** With in-page switches, choosing a domain with no patient screen forced
  the screen selection to change underneath the admin, and changing back did not restore it.
  Navigation is now explicit in both directions.

The active item is reflected in the breadcrumb and the page heading. Every scoped action still names
its target — the section-creation control reads "Add section to **Vector order**", not "Add section".

**FR-18 — Page-level save (nothing commits on change).** No control on this surface persists on
change. Edits accumulate in page state; a persistent action bar reports **"N unsaved changes"** with
**Save** and **Cancel**. Save persists everything in one transaction; Cancel discards every pending
edit and restores the last saved state. Leaving the page with unsaved changes warns first.

This is not a style preference. Two reasons: (a) **consistency** — the same builder in Programs
**FR-13** already works this way ("no per-card Save — inputs commit to in-memory state on blur; the
page Submit persists in one transaction"), and one feature must not have two save models; and (b)
**blast radius** — these toggles govern a live order-entry form. Switching **Required** on commits
instantly today, which would block every reception user's save on the next order, lab-wide, with no
undo. A staged save makes that a reviewable action instead of an accident.

**FR-18.1 — Pending changes are named, not just counted.** Because each view shows one physical area
(FR-23) while the save state spans all four, an admin can be standing on *Vector order* with pending
edits made on *Patient screen* — invisible in the current view, yet committed by Save and silently
discarded by Cancel. A bare count invites exactly that mistake.

The action bar therefore **names where its pending changes are** — "2 changes on Patient screen, 1 on
Clinical order" — and each name links to that view. Where more than one view is affected, the bar
also offers **Review changes**: a list of every pending edit grouped by view, stating what changed
(question, property, old → new). Cancel is confirmed when changes span more than the current view,
naming the views whose edits will be discarded.

**FR-19 — Progressive-disclosure question row.** A question carries a dozen configurable
properties. Rendering them all inline produces a control strip too dense to scan and too wide for a
laptop, and puts the **Visible** and **Required** switches side by side — two identical controls,
one of which breaks order entry when flipped by mistake. The row is therefore split:

| Collapsed row (always visible) | Expanded panel (one **Configure** disclosure) |
|---|---|
| Drag handle (FR-15.2) · move up / down (FR-15) · **Visible** · question text · Type · state tags (new / answered / class badge) | Question text · **Required** · Section · **Move to position** (FR-15.1) · answer options or label editor (FR-3, FR-13) · unit · **Remove** (FR-14.2) |

The collapsed row carries **no `patient` / `order` chip** — level is implied by the view (FR-23), so
a chip there would only ever restate where the admin already is.

**FR-19.1 — Required stays visible even though its control moved.** Moving the **Required** switch
into the panel removed a misclick risk (two identical switches side by side) but must not remove the
*signal*: required-ness is the property that blocks reception's saves, and an admin scanning a section
needs to see which questions carry it without opening each row. The collapsed row therefore shows a
**read-only required indicator** — the same `*` convention the capture screens use — on every required
question. It is not interactive; the switch stays in the panel.

Only one question is expanded at a time. **Visible** stays on the collapsed row because it is the
one property an admin scans and flips in bulk; **Required** moves into the panel, where it is
labelled in full rather than abbreviated ("req" is both a misclick risk beside an identical switch
and an abbreviation that does not localize).

**FR-20 — Find a question across every domain.** Because domains are hard-partitioned (FR-1b), a
question in another domain is not merely collapsed — it is **absent from the page**. Combined with
the section-collapsed and question-hidden states, an admin has three unrelated reasons a question
they are looking for is not on screen, and no way to tell which applies.

The surface therefore carries a **search** over **all** questions in **all** domains. Each result
names its full location **including the screen**, because the screen is the primary axis of the
navigation (FR-17) — *"Occupation — Clinical › Patient screen › Patient details"*. Selecting a result
navigates there: open that view's route, expand that section, expand that row. Search matches question text and
covers hidden questions and questions in collapsed sections. It is a navigation aid only; it never
edits.

**FR-21 — Hidden questions collapse into a disclosure.** An answered question can never be removed
(FR-14.2), so a section's list only ever grows: an abandoned question stays in it permanently.
Questions with **Visible off** are therefore collected at the foot of their section behind a
**"N hidden — show"** disclosure, collapsed by default, rather than listed among the active ones.
This mirrors the pattern the Dictionary already uses for deactivated options (FR-3), and the
No-Hard-Delete convention that domain-record lists default to hiding deactivated entries (design
addendum MUST D). Newly created questions are exempt until first enabled (FR-14.4).

**FR-22 — "Question" is the canonical noun.** One concept had four names across this feature —
"field" (admin table), "question" (the builder), "Additional Information" (capture screen) and
"Question card" (Programs FR-13). The user-facing noun is **question** everywhere: admin column
headings, badges, empty states, search results, i18n key names and the handoff ticket. "Field" is
retained only where it names something genuinely different — a *FHIR* element, or a database column
in the Data Model — and the class badges stay `existing` / `added` (FR-1c). Programs' "Question
card" is consistent and needs no change. The right-hand panel is the **Live preview**, matching
Programs FR-13.5's live example pane — not "capture screen", which named an internal concept rather
than what an admin is looking at.

**FR-23 — One view = one physical area of the application.** Patient-level and order-level questions
are rendered by the application in **two different physical areas** — the Add/Modify Patient screen,
and the "Additional order details" area on the order — and **no view ever shows both**. The admin
surface matches one-to-one: each of the four SideNav views (FR-17) configures exactly one real area,
admin panel and Live preview together.

Consequences, all of which simplify the surface:
- **Level is implied, never chosen.** A question created while configuring the Patient screen is
  patient-level; one created under Order entry is order-level. The Level control (FR-14.1) and the
  per-question `patient` / `order` chips are **removed** — the switch already says which you are
  looking at, and a chip that only ever states the current filter is noise.
- **Sections appear under whichever surfaces they hold questions for.** A single-level section such as
  **Patient details** appears only under Patient screen. A mixed clinical section such as **Disease
  Surveillance** appears under both, showing only its patient-level questions in one and only its
  order-level questions in the other — which is exactly how the lab sees it.
- **A newly created, still-empty section stays visible** under the surface it was created in, so the
  admin can add its first question.

**FR-23.1 — Each view states its consequence.** A view's name is not enough: the difference between
the patient screen and an order screen is whether an answer persists into every future order for that
person, which is the most consequential property a question has. Each view therefore carries a
standing guidance line below its heading:

| View | Guidance shown |
|---|---|
| **Patient screen** | "Add / Modify Patient. Answered once and carried into every future order for this person." |
| **Clinical / Environmental / Vector order** | "The Additional order details area on the order. Answered per order — a new order starts blank." |

**FR-23.2 — There is no environmental or vector patient view.** Those orders carry no patient record
(vector **FR-V02-S1-001**, FR-1d), so no such view exists in the SideNav. Because the tree shows only
real configurations, an admin cannot select an impossible one and never has to be told why one is
unavailable — the earlier disabled-with-a-reason control is superseded by the navigation itself.

**FR-23.3 — A section spanning both screens states its counterpart.** A clinical section may hold
both patient-level and order-level questions — Disease Surveillance holds *Medical history* (persists
on the patient) and *Case classification* (per order). Each view shows only its own level's
questions, so the same named section legitimately shows different contents in two places. Left
unexplained an admin who saw six questions and now sees two will conclude four were deleted. A
section with questions on the other screen therefore states so in its header — **"2 here · 6 on
Clinical order →"** — and the link navigates to that view with the section expanded.

---

## FHIR Mapping (developer deliverable)

Because these fields feed FHIR export, the **implementing developer must produce a field → FHIR
mapping** and keep it with the code (e.g. a mapping table in the module, or the project's FHIR
mapping registry). For each element the mapping states: the FHIR resource, the element/path, and any
code system, or "no FHIR export" when none applies. Indicative targets (developer confirms against
the OpenELIS FHIR model — not prescriptive here per "specs say what, not how"):

- **Patient-level traits** (medical history, comorbidity, mother HIV status, at-risk population,
  prior vaccination) → most likely `Observation` resources referencing the `Patient` (or Patient
  extensions where an Observation doesn't fit).
- **The mother link** (B1) → a `Patient`↔`Patient` / `RelatedPerson` relationship rather than free text.
- **Order/episode fields** (case classification, symptoms, onset, maternal viral load + value,
  breastfeeding/weaning, reason for request, travel, treatment received) → `Observation` /
  supporting resources referencing the `ServiceRequest`/`Specimen` for that order.
- **Coded fields** → the bound Dictionary entries should carry a code (Dictionary already supports a
  LOINC/local code column) so the FHIR `code`/`valueCodeableConcept` is populated, not just display text.
- **Address hierarchy** (Region/District) → **reuse the existing `Patient.address` mapping** — no new
  Observation; these already flow through the address hierarchy's export path (FR-13).

Deliverable: the mapping table exists, is reviewed, and each element is either mapped or marked
"no FHIR export." Capturing the code system for coded fields is part of this task.

---

## Data Model

New structured data elements (declared new — D-009). **Reuse** the existing patient
additional-attribute/observation store (patient-level), the order/sample observation store
(order-level), and the **Dictionary** for coded response lists — declare, don't invent stores.

### Baseline section — CLINICAL: **Patient details** (existing fields, folded in) — all Patient-level

> Verified on the live patient form (`/PatientManagement` → New Patient → Additional Information).
> These already exist; folding them in gives them the same Visible/Required/Domain config. Default
> **on** (current behavior preserved). Existing response lists remain their source.

| # | Label (UI, English) | Control | Level | Response source |
|---|---|---|---|---|
| G1 | Health Region | **Address hierarchy** (locked) | Patient | Organization data via address hierarchy; label = mappable address label; show/hide + label via existing API (FR-13) |
| G2 | Health District | **Address hierarchy** (locked) | Patient | Organization data via address hierarchy; label = mappable address label; show/hide + label via existing API (FR-13) |
| G3 | Education | Select | Patient | existing list (none/primary/secondary/upper) |
| G4 | Marital Status | Select | Patient | existing list |
| G5 | Nationality (+ Specify Other) | Select + text | Patient | existing nationality list |
| G6 | Occupation | TextInput | Patient | free text |
| G7 | Target Disease Programme | Select | Patient | Program list |
| G8 | Custom Notes | TextArea (0/255) | Patient | free text |

### Baseline section — ENVIRONMENTAL: **Environmental order details** — all Order-level

> Not new fields. These are the sampling-site / collection fields **already specced** in
> `sample-collection/environmental-order-entry.md`; folding them in gives them the same
> Visible/Required/order config as everything else. Default **on** (no regression). There is **no
> patient** on an environmental order — the requester is an Organization (Submitter).

| # | Label (UI, English) | Control | Level | Response source |
|---|---|---|---|---|
| E1 | Sampling Site | ComboBox (typeahead) | Order | SamplingSite registry (S-02) |
| E2 | Submitter | ComboBox (typeahead) | Order | existing **Organization** entity (`order.requestingOrganizationId`) |
| E3 | Container Type | ComboBox (typeahead + custom) | Order | list maintained in Test Catalog admin → Env subsection |
| E4 | GPS coordinates | TextInput | Order | free text; defaults from the selected site |
| E5 | Location Details | TextInput | Order | free text |
| E6 | Address | TextInput | Order | free text |
| E7 | Collection Date/Time | DateTimePicker | Order | — |
| E8 | Notes | TextInput (0/255) | Order | free text |

### Baseline section — VECTOR: **Vector order details** — all Order-level

> Not new fields. These are the intake and Collection Context fields **already specced** in
> `vector-surveillance/vector-collection-workflow.md` **FR-V02-S1-002** and **FR-V02-S1-002a**.
> That spec's **FR-V02-S1-001** requires the Patient section to be hidden entirely on vector orders,
> which is why there is no vector patient-level question anywhere in this framework (FR-1d).

| # | Label (UI, English) | Control | Level | Response source |
|---|---|---|---|---|
| V1 | Organism Group | ComboBox | Order | VectorGroup catalog (V-01, active only); maps to VECTOR-domain SampleType |
| V2 | Lifecycle Stage | Select | Order | Dictionary `VECTOR_LIFECYCLE_STAGE` (EGG / LARVA / PUPA / ADULT / UNKNOWN) |
| V3 | Quantity (organisms) | NumberInput (int, min 1) | Order | — |
| V4 | Trap Type / Collection Method | ComboBox | Order | Dictionary `VECTOR_TRAP_TYPE` |
| V5 | Sampling Site | ComboBox (typeahead) | Order | SamplingSite registry (S-02) |
| V6 | Time of Day | Select | Order | Dictionary `VECTOR_COLLECTION_TIME_OF_DAY` (DAWN / DAYLIGHT / DUSK / NIGHT / UNKNOWN) |
| V7 | Resting Context | Select | Order | Dictionary `VECTOR_RESTING_CONTEXT` (INDOOR / OUTDOOR / UNKNOWN) |
| V8 | Human-Biting Catch | Yes/No | Order | — |
| V9 | Collection Context Notes | TextArea (0/500) | Order | free text |

### Section A — Disease Surveillance ("Autres maladies")

> **UI labels are English** (column below). The "Source doc (FR)" column is provenance from the
> customer's original French document — not shipped text.

| # | Source doc (FR) | Label (UI, English) | Control | Level | Response source |
|---|---|---|---|---|---|
| A1 | Signe(s) et symptôme(s) | Signs & symptoms | TextArea (or multi-select if coded) | Order | free text / optional Dictionary |
| A2 | Date de début des signes/symptômes | Symptom onset date | DatePicker | Order | — |
| A3 | Classification du cas | Case classification | Select | Order | Dictionary: `caseClassification` (Suspect/Probable/Confirmé) |
| A4 | Lien épidémiologique | Epidemiological link | TextArea | Order | free text |
| A5 | Voyage en région endémique (+ région) | Travel to endemic region | Select Yes/No (+ region text) | **Order** | Dictionary: yes/no |
| A6 | Date de séjour | Dates of stay | Date range | **Order** | — |
| A7 | Antécédents médicaux | Medical history | TextArea | Patient | free text |
| A8 | Comorbidité | Comorbidity | TextArea / multi-select | Patient | free text / optional Dictionary |
| A9 | Vaccination antérieure | Prior vaccination | TextArea / structured | Patient | free text / optional Dictionary |
| A10 | Autres | Other | TextArea | Patient | free text |

> A5 (travel) and A6 (dates of stay) are **order-level** per Casey — they belong to the new
> "Additional order details" area, which doesn't exist yet (Dependencies).

### Section B — HIV / PMTCT–EID ("VIH")

| # | Source doc (FR) | Label (UI, English) | Control | Level | Response source |
|---|---|---|---|---|---|
| B1 | Mère (lien patient) → Code/Nom/Prénoms | Mother (patient link) | Patient-search ComboBox → read-only fields (+ free-text fallback) | Patient | patient records |
| B2 | Statut VIH (mère) | Mother HIV status | Select | **Patient** | Dictionary: `hivStatus` (Positif/Négatif/Inconnu) |
| B3 | Traitement ARV pendant la grossesse | ARV during pregnancy | Select Yes/No | Order | Dictionary: yes/no |
| B4 | Type de traitement (mère) | Treatment type (mother) | Select | Order | Dictionary: `arvTreatmentType` |
| B5 | Charge virale maternelle récente | Recent maternal viral load (taken?) | Select Yes/No (+ date) | Order | Dictionary: yes/no |
| B6 | Valeur (copies/ml) | Value (copies/ml) | NumberInput (copies/ml) | Order | — |
| B7 | Allaitement | Breastfeeding | Select Yes/No | Order | Dictionary: yes/no |
| B8 | Durée d'allaitement (mois) | Breastfeeding duration (months) | NumberInput | Order | — |
| B9 | Sevrage | Weaning | Select Yes/No | Order | Dictionary: yes/no |
| B10 | Durée de sevrage (mois) | Weaning duration (months) | NumberInput | Order | — |
| B11 | Motif de la demande | Reason for request | Select | Order | Dictionary: `eidRequestReason` |
| B12 | Population à risque | At-risk population | Select/typeahead | Patient | Dictionary: `riskPopulation` |
| B13 | Date de début du traitement ARV | ARV treatment start date | DatePicker | Patient | — |
| B14 | Traitement reçu | Treatment received | Select | **Order** | Dictionary: `arvTreatmentType` (or `treatmentReceived`) |

> Per Casey: **B2 mother HIV status = patient-level** (rarely changes, lives with the patient);
> **B14 treatment received = order-level** (per request). B2 could still be re-confirmed per
> episode; the patient-level value is the current one.

**Dictionary categories to create** (deployment seeds the entries; admin maintains):
`caseClassification`, `hivStatus`, `arvTreatmentType`, `eidRequestReason`, `riskPopulation`, and a
shared yes/no category (reuse an existing one if present). Fixed lists (Suspect/Probable/Confirmé;
Positif/Négatif/Inconnu) still go through Dictionary so labels localize and stay maintainable.

### Config data
- **Section** (admin-managed record): `id`, `name`, `order`, `domain` (**exactly one** of
  CLINICAL / ENVIRONMENTAL / VECTOR — FR-1b), `system` (bool — the three baseline sections; not
  deletable), `domainLocked` (bool — **Patient details** only, FR-1d). Admin can create (in the
  currently-selected domain), rename, reorder and delete (non-system) sections. A section's domain is
  fixed at creation.
- **Question** (was "Field"): `id`, `sectionId` (admin-assignable), `origin` (`existing` |
  `authored` — FR-1c), `displayOrder` (int, unique within section — FR-15), `visible` (bool),
  `required` (bool), `level` (patient | order), `type`, `dictionaryCategoryId` (coded existing
  fields), `answerOption[]` (authored coded questions), `unit` (authored Number questions, written as
  the FHIR `questionnaire-unit` extension), `hasData` (bool, write-once — FR-14.5; **not** a count), and a `label` / question-text value (address fields → the Site
  Information geographic-unit label). A question has **no** domain of its own — it takes its
  section's (FR-16). `level` is likewise **implied by the section**: questions in **Patient details**
  are patient-level; questions in the environmental and vector baseline sections are order-level.
  - `origin = existing` rows are **dev-defined and neither creatable nor removable** by the admin;
    their `type` may be locked by the intrinsic rule (FR-12) and their FHIR mapping is the bespoke one.
  - `origin = authored` rows are **created by the admin** (FR-14), stored as **FHIR Questionnaire
    items** on the section's questionnaire, and removable only while unanswered (FR-14.2).
- **Defaults:** General (system) on + all domains + its existing fields on (no regression); seeded
  Disease Surveillance & HIV/PMTCT sections off + domain = CLINICAL + their fields off. Deleting a
  custom section reassigns its fields to General.
- Stored with the Order & Patient Entry Configuration settings — reuse that store. The dev-defined
  field catalog + its FHIR mappings live in code; only section records and per-field config/assignment
  are data.

---

## Admin Configuration (Order & Patient Entry Configuration — redesign tie-in)

Add an **Additional Information** group to the redesigned config page, with three subsections
(General, Disease Surveillance, HIV/PMTCT–EID) whose rows extend the page's toggle pattern:

**Above the section list:** a **Clinical / Environmental / Vector** switch (FR-17) showing that
domain's sections only, echoed in the page heading.

**Per section header:** master **Visible** toggle + the section's single **domain** (a read-only tag;
fixed at creation, and locked with a stated reason on Patient details — FR-1d).

**Per section footer:** an **"Add question"** action appending an authored question to that section
(FR-14).

**Per field row:**

| Column | Meaning |
|---|---|
| Move | **↑ / ↓** re-order within the section; disabled at first/last position (FR-15) |
| Question | question text (grouped under its section); dev-defined ones tagged `existing`, admin-created ones tagged `added`; `added` rows are editable in place |
| Level | patient / order (read-only tag) |
| Type | admin-selectable (Text / Single-select / Multi-select / Yes-No); **locked** chip for Date / Number / Patient link / Address hierarchy |
| Visible | toggle |
| Required | toggle (greys out when not visible) |
| Remove | `added` questions only, and only while unanswered — otherwise the row reads "answered — hide instead" (FR-14.2) |
| Options / Label | select types → inline option editor (add/deactivate, FR-3); **Address hierarchy** → inline **Label** editor (saved via existing API, FR-13); Text/Date/Number → blank |

Section master toggle greys its field rows when off. Deployment-wide (single tenant — D-001).
Admin-only (existing binary admin — D-006; no new permission key). **Defaults:** General on (all
domains, no regression); Disease Surveillance & HIV/PMTCT off (Clinical scope).

---

## Dependencies

- **Environmental order entry** (`sample-collection/environmental-order-entry.md`) — source of the
  ENVIRONMENTAL baseline question set (E1–E8); those fields exist there, this feature configures them.
- **Vector collection workflow** (`vector-surveillance/vector-collection-workflow.md`) — source of the
  VECTOR baseline question set (V1–V9), and the origin of the **FR-V02-S1-001** MUST that keeps
  patient-level questions off vector orders entirely.
- **Order & Patient Entry Configuration redesign** (`order-patient-entry.html`) — this feature
  adds groups to it; sequence accordingly.
- **"Additional order details" area on the order** — **does not exist yet**; it is the physical home of
  the clinical **Order details** baseline section (FR-1d) and of every order-level question; order-level fields
  (A1–A6, B3–B11, B14) need it. Declare as a required new container (best delivered as part of the
  Order & Patient Entry redesign / Add Order flow).
- **Dictionary** (`/MasterListsPage/DictionaryMenu`) — reuse for coded response lists; new
  categories to be created + seeded.
- **Patient additional-attribute / observation store** + **order/sample observation store** —
  reuse for values.
- **Patient search** — reuse for the Mother link (FR-5).
- **Address hierarchy + Organization data + its existing API** (`useNewAddressHierarchy`) — reuse for
  Region/District show/hide, label, values, and FHIR `Patient.address` export; this feature is a new
  front-end over it, not a back-end change (FR-13). **Verified:** labels are the Geographic Unit 1/2
  Labels in **Site Information** (`/MasterListsPage/SiteInformationMenu`); values come from
  **Organization Management** (`/MasterListsPage/organizationManagement`, via Parent Org hierarchy).
- **Not** dependent on RETROCI study forms (`useRetroCIStudyForms`); this is the generic path.
- Patient Entry Configuration legacy route (`/MasterListsPage/PatientConfigurationMenu`) is being
  consolidated by the redesign — coordinate so toggles land in the new page, not the legacy table.

---

## Access & Roles

- **Configuring visibility/required + binding/maintaining Dictionary options:** Admin only.
- **Capturing/editing fields:** whoever registers orders/edits patients today (Reception,
  clinicians) — no change to who can create/edit patients or orders.
- **Viewing:** anyone who can view the patient/order sees enabled fields. The Mother link exposes
  only data already available via patient search — no new exposure.

---

## Localization

**English UI, single language — no translation layer.** Static UI labels use i18n keys with
English text (`patientAddlInfo.surveillance.*`, `patientAddlInfo.hiv.*`, `patientAddlInfo.config.*`;
reuse `common.*` where exact — `common.firstName`, `common.lastName`, `common.patient`,
`common.save`, `common.cancel`). Each field label in the tables above maps to one key. Verify
against `en.json` at implementation.

**Response options are data, not i18n keys.** The admin types each option's text once (in whatever
language the site uses) as a Dictionary entry; it is stored and displayed as-is. No `fr.json`
work, no per-locale option variants, and no requirement that option text be English. This keeps
the feature simple for a single-language deployment.

Config-page strings (English): Visible `patientAddlInfo.config.visible`; Required
`patientAddlInfo.config.required`; Response options `patientAddlInfo.config.responseOptions`;
Manage options `patientAddlInfo.config.manageOptions`.

Added in v5:

| Key | English |
|---|---|
| `patientAddlInfo.config.addQuestion` | Add question |
| `patientAddlInfo.config.newQuestion` | New question |
| `patientAddlInfo.config.questionText` | Question text |
| `patientAddlInfo.config.questionType` | Type |
| `patientAddlInfo.config.level` | Level |
| `patientAddlInfo.config.unit` | Unit |
| `patientAddlInfo.config.added` | added |
| `patientAddlInfo.config.existing` | existing |
| `patientAddlInfo.config.moveUp` | Move up |
| `patientAddlInfo.config.moveDown` | Move down |
| `patientAddlInfo.config.moveUpNamed` | Move {0} up |
| `patientAddlInfo.config.moveDownNamed` | Move {0} down |
| `patientAddlInfo.config.remove` | Remove |
| `patientAddlInfo.config.removeConfirmTitle` | Remove this question? |
| `patientAddlInfo.config.removeConfirmBody` | "{0}" has never been answered and will be removed from this section. |
| `patientAddlInfo.config.removeBlocked` | Answered — hide instead |
| `patientAddlInfo.config.domainView` | Domain |
| `patientAddlInfo.config.domainLocked` | Clinical only |
| `patientAddlInfo.config.domainLockedWhy` | Environmental and vector orders have no patient record. |
| `patientAddlInfo.config.addSectionTo` | Add section to {0} |
| `patientAddlInfo.config.addQuestionTo` | Add question to {0} |
| `patientAddlInfo.section.patientDetails` | Patient details |
| `patientAddlInfo.section.envOrderDetails` | Environmental order details |
| `patientAddlInfo.section.vectorOrderDetails` | Vector order details |

Added in v5.1:

| Key | English |
|---|---|
| `patientAddlInfo.config.configure` | Configure |
| `patientAddlInfo.config.save` | Save |
| `patientAddlInfo.config.cancel` | Cancel |
| `patientAddlInfo.config.unsavedCount` | {0} unsaved changes |
| `patientAddlInfo.config.unsavedOne` | 1 unsaved change |
| `patientAddlInfo.config.noChanges` | No unsaved changes |
| `patientAddlInfo.config.leaveWarning` | You have unsaved changes. Leave without saving? |
| `patientAddlInfo.config.typeLocked` | Locked — {0} saved answers |
| `patientAddlInfo.config.typeLockedWhy` | Changing the type would make saved answers unreadable. |
| `patientAddlInfo.config.isNew` | New — hidden until you switch it on |
| `patientAddlInfo.config.hiddenShow` | {0} hidden — show |
| `patientAddlInfo.config.hiddenHide` | Hide |
| `patientAddlInfo.config.moveToPosition` | Move to position |
| `patientAddlInfo.config.search` | Search questions |
| `patientAddlInfo.config.searchPlaceholder` | Search all domains… |
| `patientAddlInfo.config.searchNone` | No question matches "{0}" |
| `patientAddlInfo.config.searchCount` | {0} matches across all domains |
| `patientAddlInfo.config.levelPatient` | Stays with the patient |
| `patientAddlInfo.config.levelOrder` | Only this order |
| `patientAddlInfo.config.badgeExistingHelp` | Built-in question. Configure it — it can't be re-authored or removed. |
| `patientAddlInfo.config.badgeAddedHelp` | You created this question. Full authoring; removable while unanswered. |
| `patientAddlInfo.config.noRemoveExisting` | Built-in question — hide it instead of removing it |

Added in v5.2:

| Key | English |
|---|---|
| `patientAddlInfo.surface.patient` | Patient screen |
| `patientAddlInfo.surface.order` | Order entry |
| `patientAddlInfo.surface.patientHelp` | Add / Modify Patient. Answered once and carried into every future order for this person. |
| `patientAddlInfo.surface.orderHelp` | The Additional order details area on the order. Answered per order — a new order starts blank. |
| `patientAddlInfo.surface.noPatientForDomain` | {0} orders have no patient record. |
| `patientAddlInfo.preview.title` | Live preview |
| `patientAddlInfo.config.dragHandle` | Drag to reorder {0} |
| `patientAddlInfo.section.orderDetails` | Order details |

Added in v5.3:

| Key | English |
|---|---|
| `patientAddlInfo.nav.additionalInformation` | Additional Information |
| `patientAddlInfo.nav.patientScreen` | Patient screen |
| `patientAddlInfo.nav.clinicalOrder` | Clinical order |
| `patientAddlInfo.nav.envOrder` | Environmental order |
| `patientAddlInfo.nav.vectorOrder` | Vector order |
| `patientAddlInfo.config.hasData` | Data entered |
| `patientAddlInfo.config.typeLockedData` | Locked — data entered |
| `patientAddlInfo.config.typeLockedDataWhy` | This question has saved answers. Changing its type would make them unreadable. |
| `patientAddlInfo.config.removeBlockedData` | Can't be removed — this question has data. Switch it off to take it off the form; the answers stay. |
| `patientAddlInfo.config.requiredMark` | Required |
| `patientAddlInfo.config.pendingIn` | {0} on {1} |
| `patientAddlInfo.config.reviewChanges` | Review changes |
| `patientAddlInfo.config.cancelConfirm` | Discard unsaved changes on {0}? |
| `patientAddlInfo.config.counterpart` | {0} here · {1} on {2} |
| `patientAddlInfo.config.orderDetailsEmpty` | Questions asked on every clinical order. Nothing here yet — add the first one. |

---

## Out of Scope

- Surveillance/EID report screens (storage is reportable-ready; reports are separate work).
- Migrating/backfilling from paper or RETROCI forms.
- A full mother↔infant relationship model beyond the single mother link (FR-5).
- Per-test auto-show of sections beyond the admin toggles (possible later enhancement).
- The Order & Patient Entry redesign itself and the generic "Additional order details" container —
  consumed here as dependencies, specced/owned separately.

---

## Acceptance Criteria

- AC-1: New sections (Disease Surveillance, HIV/PMTCT) default **off** → not shown; the **General**
  section keeps today's fields on. An upgrade with no admin action changes nothing for any user.
- AC-2: Admin can set section + field Visible/Required; child controls grey out when section/field off.
- AC-2a: **Existing fields folded in:** the current patient Additional Information fields appear as
  General-section entries, on by default, still saving to their existing storage/lists — no regression.
- AC-2b: **Domain scope:** each section has a Domain scope; at Add Order a section shows only when the
  order's domain ∈ scope. With defaults, Disease Surveillance/HIV-PMTCT appear on a Clinical order and
  are hidden on Environmental/Vector orders; General shows on all three.
- AC-3: Each coded field can be bound to a Dictionary category; its choices are that category's
  active entries; "Manage options" reaches Dictionary; deactivating an entry removes it as a choice
  without breaking stored values.
- AC-4: Visible patient-level field appears/editable on Add Order and the Patient screen (edit = view,
  one screen) and persists on the patient across orders.
- AC-5: Visible order-level field appears in the order's Additional order details, persists against
  that order; a new order starts blank (no carry-over from the prior order).
- AC-6: Mother patient search links records + fills read-only mother code/name; free-text fallback works.
- AC-7: Required visible field blocks save (form + API); no effect when hidden.
- AC-8: B2 stored patient-level; A5/A6 and B14 stored order-level (per Casey's decisions).
- AC-9: UI labels resolve in **English** via `patientAddlInfo.*` / reused `common.*`; coded answers
  come from admin-entered Dictionary options stored/displayed as-is (site language); no translation layer.
- AC-10: Admin can manage a coded field's options **inline** (expand → add via type+Enter, deactivate/
  reactivate) without leaving the config page; shared categories are flagged; deactivating never breaks
  saved values.
- AC-11: A **field → FHIR mapping** exists and is reviewed; every element is either mapped to a FHIR
  resource/element (with code system for coded fields) or explicitly marked "no FHIR export."
- AC-12: Admin can set each field's **Type** (Text / Single-select / Multi-select / Yes-No); the option
  editor appears only for select types; Date / Number / Patient link / Address hierarchy are locked and
  cannot be retyped. There is one Text type (no separate short/long).
- AC-13: Region/District render as **Address hierarchy** fields; admin can show/hide and edit their
  **label** here, persisted via the **existing address API** (no back-end change), with values still
  Organization-sourced and FHIR via `Patient.address`. This surface can replace the old address show/hide
  + label admin option.
- AC-14: Admin can **add, rename, reorder, and delete** sections and **assign any question to a
  section**; General is a **system** section that can't be deleted; deleting a custom section moves its
  questions to General; capture screens render questions grouped by their section in the admin's order.
- AC-15: Admin can **add a question** to any section, including General. It is appended last, opens
  inline for editing, and is created **hidden** so it never appears on a capture screen mid-authoring.
  Turning it visible makes it render on the capture screen, in its section, in its position.
- AC-16: An authored question supports text, type (Text / Single-select / Multi-select / Yes-No /
  Date / Number / Decimal), answer options for the coded types, level, required, visible, section,
  order and domain scope. Switching type preserves already-entered answer options. Its answers export
  as a `QuestionnaireResponse` item with **no developer-authored FHIR mapping**.
- AC-17: An authored question can be **removed only while `hasData` is false**, confirmed in a modal
  naming it. Once it holds data, remove is unavailable and the row directs the admin to hide it instead; hiding removes it from every capture screen while stored answers survive. Existing
  structured fields are never removable.
- AC-18: **Re-order:** ↑/↓ on each question row moves it within its section only; the control is
  **disabled** (not hidden) at first/last position; both controls are keyboard-reachable and
  screen-reader-labelled. The saved order is the order the capture screens render, for existing and
  authored questions alike. Cross-section moves still go through "Move to section".
- AC-19: **One domain per section:** every section belongs to exactly one domain, fixed at creation;
  no question row exposes a domain control. Deleting a custom section moves its questions to **its own
  domain's** baseline section, never across domains.
- AC-19a: **Three baseline sections:** Patient details (clinical, patient-level), Environmental order
  details and Vector order details (order-level) exist as system sections. **Patient details cannot be
  moved off CLINICAL**, and the surface states why — environmental and vector orders have no patient
  record (vector FR-V02-S1-001). A vector order renders no patient-level question anywhere.
- AC-20: **Admin domain switch:** selecting Clinical / Environmental / Vector shows only that domain's
  sections, never edits stored config, defaults to Clinical, is reflected in the page heading, and stays
  in sync with the capture-screen preview. Domain-scoped actions name their target ("Add section to
  Vector").
- AC-21: **Page-level save:** no control persists on change; the action bar reports the count of
  unsaved changes; Save commits them in one transaction; Cancel discards all pending edits and restores
  the last saved state; leaving with unsaved changes warns first. Matches Programs FR-13's save model.
- AC-22: **Type locks once answered:** a question with `hasData` true renders Type as a read-only tag
  reading "Locked — data entered"; its text, answer options, required, visible, section and position all remain editable.
  A question with `hasData` false can still be retyped, and retyping preserves entered answer options.
- AC-23: **Progressive disclosure:** the collapsed row shows only move, Visible, question text, Type and
  state tags; Required, Level, Section, Move-to-position, options/label, unit and Remove appear in the
  Configure panel. **Visible and Required are never adjacent.** One question is expanded at a time.
- AC-24: **Move to position:** the expanded row offers a position select (1…n) that relocates a question
  in one action; it and the arrows write the same `displayOrder`.
- AC-25: **Cross-domain search:** searching matches question text across all domains, including hidden
  questions and questions in collapsed sections; each result names its full path
  ("Occupation — Clinical › Patient details"); selecting one switches domain, expands the section and
  expands the row. Search never edits.
- AC-26: **Hidden disclosure:** questions with Visible off are collected behind a collapsed
  "N hidden — show" disclosure at the foot of their section. A newly created question stays in the main
  list until first enabled and shows a "New — hidden until you switch it on" tag.
- AC-27: **Self-explaining classes:** each class badge carries a tooltip describing what the class can
  and cannot do, and an `existing` question's row states why it has no Remove rather than just omitting
  the control. The user-facing noun is "question" throughout — no column, badge, empty state or key
  calls it a "field".
- AC-28: **Surface filter:** the Patient screen / Order entry switch filters the admin panel and the
  Live preview together; no view ever shows patient-level and order-level questions at once. A mixed
  clinical section appears under both surfaces showing only that surface's questions; a single-level
  section appears under one. A newly created empty section stays visible under the surface it was
  created in.
- AC-29: **Level is implied:** no question row shows a patient/order chip and no Configure panel offers
  a Level control. A question created under Patient screen is patient-level; one created under Order
  entry is order-level.
- AC-30: **Switch guidance:** the selected option states its consequence — Patient screen says the
  answer is carried into every future order for that person; Order entry says a new order starts blank.
- AC-31: **No impossible views:** the SideNav contains exactly four items — there is no environmental
  or vector patient view to select, so no disabled control and no explanation are needed.
- AC-34: **SideNav navigation:** the four views are four SideNav submenu items under Admin Management →
  Order & Patient Entry Configuration → Additional Information, each with its own deep-linkable route
  (`/MasterListsPage/addlInfoPatient`, `addlInfoClinicalOrder`, `addlInfoEnvOrder`,
  `addlInfoVectorOrder`). Pasting a route loads that view. Breadcrumb and page heading name the active
  view. No in-page tabs or segmented controls are used for switching between them.
- AC-35: **Named pending changes:** the action bar names the views its pending changes belong to and
  links to each; with changes in more than the current view it offers Review changes (grouped by view,
  showing question, property, old → new) and confirms Cancel, naming the views to be discarded.
- AC-36: **Required visible in the list:** every required question shows a read-only `*` indicator on
  its collapsed row; the interactive Required control stays in the Configure panel. Visible and Required
  are still never adjacent.
- AC-37: **Counterpart count:** a section holding questions on the other screen states so in its header
  ("2 here · 6 on Clinical order →"); the link opens that view with the section expanded.
- AC-38: **`hasData`, not counts:** no screen displays a number of answers; the state reads "Data
  entered". Rendering the page issues no per-question aggregate query over the answer store.
- AC-39: **Order details empty state:** the clinical order baseline ships empty and explains what it is
  for rather than rendering a bare empty list.
- AC-32: **Four baselines:** one per (domain, level) — Patient details, Order details (clinical,
  order-level, empty on delivery), Environmental order details, Vector order details. A deleted custom
  section's questions each return to the baseline matching their own domain **and** level.
- AC-33: **Drag-and-drop:** a row can be dragged to a new position within its section, with the drop
  target indicated; dropping outside the section is a no-op. The arrows and Move-to-position still work
  and write the same `displayOrder`. Reordering is fully operable by keyboard alone.
