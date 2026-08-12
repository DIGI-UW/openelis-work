# Patient & Order Additional Information — Disease Surveillance & HIV/PMTCT — FRS

**Feature area:** Patient/Order data capture + Admin configuration
**Capture surfaces:** Add Order (patient + order steps) · Patient screen — edit and view are the same screen (`/PatientManagement`)
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
maladies"), and **HIV / PMTCT–EID** ("VIH") — rendered on the capture surfaces, wholly controlled
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
- **Breadcrumb (admin):** `Home / Admin Management / Order & Patient Entry Configuration`
  (preserve the "Admin" → "Admin Management" drift — D-013).

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

**FR-1 — Admin-managed sections (dev-defined fields).** Additional Information is organised into
**sections the admin manages** — add, rename, remove, reorder, and set a Domain scope per section —
and each field is **assigned to a section** by the admin. Sections render as collapsible groups on
the capture surfaces. The feature **ships with three seeded sections**: **General** (a **system**
section holding the existing built-in patient fields — cannot be deleted), **Disease Surveillance**,
and **HIV/PMTCT–EID** (both deletable/renamable). The **field catalog is dev-defined** — admins
arrange fields into sections and configure them, but cannot invent new fields, so every field keeps
a known **FHIR mapping** (FR-11). Deleting a custom section reassigns its fields to General.

**FR-1a — Existing fields folded in as configurable entries.** The current patient Additional
Information fields (Health Region, Health District, Education, Marital Status, Nationality + Specify
Other, Occupation, Target Disease Programme, Custom Notes — verified live) become the **General**
section: same configurable Visible/Required/Domain controls as the new fields. They default to
their **current on-state** (no regression). Their existing response lists (Education, Marital
Status, Nationality, etc.) remain their source; managing them via the same Dictionary affordance is
allowed but not required.

**FR-1b — Domain sensitivity (D-004).** Each section has a **Domain scope** (any of CLINICAL /
ENVIRONMENTAL / VECTOR; never BOTH). At Add Order (domain-scoped route) a section renders only when
the order's domain ∈ its scope. Disease Surveillance and HIV/PMTCT default to CLINICAL; General
defaults to all three. The Patient screen is cross-domain and shows enabled patient-level fields
regardless of domain.

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
sets in config, defaulting per the rule below. Selectable types: **Text**, **Single-select**,
**Multi-select**, **Yes/No**. The inline option editor (FR-3) appears only for the select/Yes-No
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

### Section G — General (existing fields, folded in) — all Patient-level

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
- **Section** (admin-managed record): `id`, `name`, `order`, `domains` (subset of
  CLINICAL/ENVIRONMENTAL/VECTOR), `system` (bool — General only; not deletable). Admin can create,
  rename, reorder, delete (non-system), and set domains.
- **Field** (dev-defined catalog; admin-configured, not admin-created): `sectionId`
  (admin-assignable), `visible` (bool), `required` (bool), `type` (Text / Single-select /
  Multi-select / Yes-No unless an intrinsic locked type), `dictionaryCategoryId` (coded fields),
  and a `label` override (address fields → the Site Information geographic-unit label).
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

**Per section header:** master **Visible** toggle + **Domain scope** chips (Clinical / Environmental
/ Vector, multi-select).

**Per field row:**

| Column | Meaning |
|---|---|
| Field | field label (grouped under its section); existing General fields tagged "existing" |
| Level | patient / order (read-only tag) |
| Type | admin-selectable (Text / Single-select / Multi-select / Yes-No); **locked** chip for Date / Number / Patient link / Address hierarchy |
| Visible | toggle |
| Required | toggle (greys out when not visible) |
| Options / Label | select types → inline option editor (add/deactivate, FR-3); **Address hierarchy** → inline **Label** editor (saved via existing API, FR-13); Text/Date/Number → blank |

Section master toggle greys its field rows when off. Deployment-wide (single tenant — D-001).
Admin-only (existing binary admin — D-006; no new permission key). **Defaults:** General on (all
domains, no regression); Disease Surveillance & HIV/PMTCT off (Clinical scope).

---

## Dependencies

- **Order & Patient Entry Configuration redesign** (`order-patient-entry.html`) — this feature
  adds groups to it; sequence accordingly.
- **"Additional order details" area on the order** — **does not exist yet**; order-level fields
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
- AC-14: Admin can **add, rename, reorder, and delete** sections and **assign any field to a section**;
  General is a **system** section that can't be deleted; deleting a custom section moves its fields to
  General; capture surfaces render fields grouped by their section in the admin's order. Admins cannot
  create new *fields* (dev-defined catalog).
