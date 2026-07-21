# Optional Requesting Provider (Requester Requirement Toggle) — FRS

**Feature area:** Admin → General Configurations → Order Entry Configuration
**Route:** `/MasterListsPage/SampleEntryConfigurationMenu`
**Status:** Draft for review
**Version-agnostic** — version boundaries are decided in `/breakdown`, not here.

---

## Lab Context

### Current State
When a lab registers a new order in OpenELIS, the order-entry form asks *who asked for the
test*. Today that "who" is split into two fields in the Requester section: the **requesting
provider** (the clinician / physician who ordered the test) and the **referring facility**
(the site or organization the sample came from — in OpenELIS this is the "Site Name"). In
the shipped configuration, the requesting provider is a **required** field: the person doing
data entry (usually Reception, sometimes the ordering Provider) cannot save the order and move
on until a provider name is filled in.

### Pain
Many labs receive samples where the individual ordering clinician is genuinely unknown or
irrelevant, and only the **sending facility** matters. Environmental and vector-surveillance
samples come from a monitoring station, not a doctor. Referral samples arrive from a partner
clinic with only the clinic named on the request form. Public-health screening batches are
identified by site, not by an individual prescriber. Because the provider field is hard-required,
staff work around it: they type junk ("Unknown", "N/A", a dot) into the provider name just to
get past the validation. That junk then flows onto printed reports, into FHIR exports, and into
provider-based search and notifications — polluting the very data the requirement was meant to
protect. The lab has no way to say "for us, the facility is the requester of record."

### What Changes
An administrator can flip a single setting in Order Entry Configuration so that, for their
deployment, the **requesting provider is optional and the referring facility is required
instead**. With the setting on, a Reception clerk registering a batch of environmental samples
picks the sending facility from the site list, leaves the provider blank, and saves — no more
typing "Unknown" into a name field. Labs that need the individual provider (most clinical labs)
change nothing: the setting ships **off**, so the requesting provider stays mandatory exactly
as it is today. The requester attribution on reports, exports, and notifications is driven by
whichever field the lab actually captured, instead of by placeholder text.

---

## Overview

This feature adds one property, **`requireProviderEntry` ("Require requesting provider")**, to
the existing Order Entry Configuration property table. Like every other row on that page, it is
a name/description/value row edited by selecting the row and clicking **Modify** — this feature
introduces no new UI control, only one new row.

- **Default (value `true` — required):** the **requesting provider is required** — identical to
  today's shipped behavior. No lab that upgrades sees any change unless an admin changes the value.
- **Value `false` (optional):** the requesting provider becomes **optional** (the field still
  appears on order entry, just without the required marker), and the **referring facility (Site
  Name) becomes required** in its place, so every order still carries a requester of record.

The property is deployment-wide (single tenant — D-001) and admin-controlled. It joins the
existing Order-Entry properties (e.g. `restrictFreeTextProviderEntry`,
`restrictFreeTextRefSiteEntry`, `eqaEnabled`) and is stored and edited exactly like them.

Because the requesting provider has been mandatory for the life of the product, code and
integrations downstream of order entry may assume it is always present. This FRS therefore
carries a mandatory **Downstream Data Audit** section (below) that directs the implementing
developer and Claude Code to enumerate and null-safe every consumer of provider data before
the setting can ship — so making provider optional never produces a system error on a report,
export, or notification.

### Navigation & URL
- **SideNav:** `Admin → General Configurations → Order Entry Configuration`
- **Breadcrumb:** `Home / Admin Management / Sample Entry Configuration Menu / Order Entry Configuration`
  *(verified against the live page; preserve the shipped label drift — SideNav reads "Admin",
  breadcrumb reads "Admin Management" — D-013)*
- **Route:** `/MasterListsPage/SampleEntryConfigurationMenu` (existing page; this feature adds
  one row to it — it does not create a new route)

---

## User Stories

1. **As a lab administrator**, I want to make the requesting provider optional and require the
   referring facility instead, so that staff registering facility-attributed samples aren't
   forced to invent a provider name.
2. **As a Reception clerk** at a lab that has enabled the setting, I want to save an order with
   only the referring facility filled in, so that I can register facility-sourced samples
   without workarounds.
3. **As a lab administrator at a clinical lab**, I want the requesting provider to stay
   mandatory by default, so that upgrading OpenELIS changes nothing about how my staff register
   orders.
4. **As a validator / report consumer**, I want reports, exports, and notifications to show the
   facility as the requester when no provider was captured, so that nothing breaks and the
   requester of record is still accurate.

---

## Functional Requirements

**FR-1 — New Order-Entry property.** Add one boolean property, `requireProviderEntry`
("Require requesting provider"), to the Order Entry Configuration property table, defaulting to
value **`true` (required)**. It is a name/description/value row edited the same way as every
existing row — select the row's radio, click **Modify**, change the value. No new UI control is
introduced.

**FR-2 — Default preserves today's behavior.** When the value is `true` (the default), the order
entry form requires the requesting provider exactly as it does today. An upgrade with no admin
action produces no behavioral change.

**FR-3 — Optional-provider behavior.** When the value is `false`, the order entry form:
  - keeps the requesting provider field **visible** but removes its required marker and its
    save-blocking validation (Provider stays a typeahead ComboBox — D-007);
  - marks the **referring facility (Site Name)** field as **required**, and blocks save until a
    facility is selected;
  - allows the order to be saved with the provider left blank.

**FR-4 — Clarity in the property description.** The property's Description text states the
coupled effect — that setting it to `false` makes the referring facility required instead — so
an admin editing the value understands the paired behavior without guessing (see Localization).

**FR-5 — Facility field required only in this mode.** Requiring the referring facility is a
consequence of setting `requireProviderEntry` to `false`; when it is `true`, the facility field
keeps its current (unchanged) behavior. This feature does not otherwise change facility-field
behavior.

**FR-6 — Requester of record resolves to what was captured.** Wherever the order's "requester"
is displayed or transmitted (reports, exports, notifications, search), the value resolves to
the provider when present, otherwise to the referring facility. No placeholder text is
introduced by the system.

**FR-7 — No impact on existing orders.** Orders already saved (with or without a provider) are
unaffected. The setting governs new order entry and edits going forward only.

**FR-8 — Null-safe downstream (see Downstream Data Audit).** With the setting off, every
downstream consumer of provider data must degrade gracefully (render blank or fall back to the
facility) rather than error. This is a hard acceptance condition, verified per the audit
section below.

---

## Data Model

This feature is **configuration + validation behavior**; it does not introduce a new domain
entity.

| Element | Where it lives | Notes |
|---|---|---|
| `requireProviderEntry` property | Order Entry Configuration property table (`SampleEntryConfigurationMenu`), stored like every other row | New boolean, default `true`. Reuse the existing config-property store used by the other Order-Entry properties — declare, don't invent a new store. |
| Requesting provider (order field) | Existing order/sample "Requester → Provider" field | No schema change proposed here; **the audit must confirm** the provider reference on the order/analysis is already nullable (see Downstream Data Audit item 7). |
| Referring facility / Site Name (order field) | Existing order "Requester → Site Name" (Organization) field | Reused; becomes required when `requireProviderEntry` is `false`. |

**Live-app check — resolved (D-008, D-009).** Verified against the live Order Entry Configuration
page (v3.2.1.11): the existing provider/site properties are `restrictFreeTextProviderEntry`
("Restrict Free Text Provider Entry") and `restrictFreeTextRefSiteEntry` ("Users cannot enter new
referring sites through sample entry"). Neither governs whether the provider is *required* — they
govern free-text entry. So `requireProviderEntry` is a genuinely new property, not a duplicate;
it sits alongside these rows in the same table.

---

## Downstream Data Audit (implementation gate — for the developer & Claude Code)

> The requesting provider has been mandatory for the entire history of the product, so code and
> integrations may silently assume it is always present. **Before this setting can be shipped
> enabled, the implementing developer and Claude Code must complete this audit** and make each
> consumer null-safe. Each item is an acceptance condition, not a suggestion. Treat a
> provider-absent order as a first-class case, not an error path.

For each consumer below: (a) locate the code path, (b) confirm behavior when the order has **no
provider**, (c) make it degrade gracefully — render blank or fall back to the referring facility
per FR-6 — never throw, never emit placeholder text.

1. **Order-entry validation (frontend + backend).** Remove the hard-required rule on provider
   when the setting is off; add the required rule on Site Name. Confirm the backend save path
   (not just the React form) enforces the same rule, so an API caller can't bypass it or be
   wrongly blocked.
2. **FHIR order export (ServiceRequest / Task `requester`, `Practitioner`).** Confirm the
   `requester`/`performer` mapping is null-safe when there is no provider. Where the spec allows,
   use the referring **Organization** as the requester reference instead of emitting an empty or
   invalid Practitioner reference.
3. **Printed patient/result reports.** The "Requesting Physician" line must render without error
   when provider is blank — show the facility, or leave the line empty — and must not print
   "null" or placeholder text.
4. **Test Notification — Provider Email / Provider SMS channels.** These channels have **no
   recipient** when the provider (and provider contact) are absent. Confirm delivery **skips
   gracefully** (no send attempt, no error) rather than failing the whole notification run.
   Coordinate with the Test Notification config owner — do not silently drop patient-channel
   notifications for the same order.
5. **Result Reporting Configuration / electronic result routing.** If any routing rule keys on
   the ordering provider, confirm it tolerates a missing provider and still routes by
   facility/site where applicable.
6. **Search & reports that filter/group by provider.** Provider-based search, workplans, and any
   "by provider" report must treat provider-less orders as a valid, findable group (e.g. filter
   by facility), not drop or error on them.
7. **Database constraints.** Confirm the provider reference on the order/sample/analysis is
   **nullable** (no `NOT NULL` constraint, no non-null FK requirement). If a constraint exists,
   a migration to relax it is a required part of this work — declare it in the story.
8. **Barcodes / labels & any order summary views.** Confirm any label preset or order-summary
   component that prints the provider handles a blank provider.
9. **Audit/history.** Confirm order audit records a provider-less order cleanly (no exception on
   diff/serialize).

**Definition of done for the audit:** every consumer above has a confirmed, tested
provider-absent behavior; no code path throws or emits placeholder text when an order has no
provider; the Site-Name-required rule is enforced on both the form and the save API.

---

## Dependencies

- **Order Entry Configuration property store** (existing) — reuse for the new boolean. Built.
- **Test Notification system** (Provider Email / Provider SMS channels) — downstream; must be
  made recipient-null-safe (audit item 4). Owner coordination required.
- **FHIR order export** — downstream; requester mapping must be null-safe (audit item 2).
- **Provider reference nullability** — must be confirmed/relaxed at the DB layer (audit item 7).
- No unbuilt-upstream dependency; nothing here waits on EQA V2, Catalyst, or other pending work.

---

## Access & Roles

- **Changing the setting:** Admin only, via the existing Order Entry Configuration admin page.
  A non-admin user does not see the Order Entry Configuration menu item, consistent with the
  rest of the admin area (binary admin — D-006). No new permission key is introduced.
- **Effect on order entry:** the changed validation applies to whoever registers orders today
  (Reception, and Providers entering their own orders) — this feature does not change *who* can
  create orders, only which Requester field is required for them.

---

## Localization

All new strings are domain-namespaced under `orderEntryConfig.*`; existing strings are reused
by key. Reuse verified against the `common.*` snapshot (2026-07-17); confirm against
`frontend/src/languages/en.json` at implementation.

| UI text | Key | Status |
|---|---|---|
| Requester | `common.requester` | REUSE |
| Provider | `common.provider` | REUSE |
| Site Name | `common.siteName` | REUSE |
| Save | `common.save` | REUSE |
| Cancel | `common.cancel` | REUSE |
| Home | `common.home` | REUSE |
| Status | `common.status` | REUSE |
| Require requesting provider | `orderEntryConfig.requireProviderEntry.name` | NEW |
| When on, staff must select a requesting provider to save an order. When off, the referring facility (Site Name) is required instead. | `orderEntryConfig.requireProviderEntry.description` | NEW |
| Requesting provider is optional for this laboratory. | `orderEntryConfig.requireProvider.optionalHint` | NEW |
| Select a referring facility to save this order. | `orderEntryConfig.siteRequired.validation` | NEW |

---

## Out of Scope

- Changing the *facility* field's behavior in any mode other than making it required when the
  provider requirement is off.
- Per-domain or per-test requester rules (this is a single deployment-wide setting).
- Introducing a free-text "requester" fallback or any placeholder-text mechanism.
- Redesigning the Order Entry Configuration page layout beyond adding this one setting.
- Backfilling or altering existing saved orders.

---

## Acceptance Criteria

- AC-1: A new `requireProviderEntry` ("Require requesting provider") row appears in Order Entry
  Configuration, defaulting to `true`; an upgraded instance with no admin action behaves exactly
  as before.
- AC-2: With `requireProviderEntry` = `true`, an order cannot be saved without a requesting
  provider (form + API).
- AC-3: With `requireProviderEntry` = `false`, an order can be saved with the provider blank, and
  **cannot** be saved without a referring facility (form + API).
- AC-4: The property's Description states the coupled effect (value `false` ⇒ facility required),
  visible to the admin when they Modify the value.
- AC-5: Every consumer in the Downstream Data Audit has a confirmed provider-absent behavior;
  no report, FHIR export, notification run, label, search, or audit action errors on a
  provider-less order.
- AC-6: No system-generated placeholder text ("Unknown", "null", ".") is written to the provider
  field or emitted downstream.
- AC-7: All new UI strings resolve through `orderEntryConfig.*` i18n keys; reused strings use
  their existing `common.*` keys.
