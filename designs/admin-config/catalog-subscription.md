# Catalog Subscription & Metadata Sync
## Functional Requirements Specification — v1.0

**Version:** 1.2
**Date:** 2026-03-24
**Status:** Draft for Review
**Jira:** OGC-[TBD]
**Technology:** Java Spring Framework, Carbon React
**Related Modules:** Test Catalog (OGC-49), AMR Configuration (OGC-312), FHIR Integration, Lab Management Dashboard

---

## Table of Contents

1. Executive Summary
2. Problem Statement
3. User Roles & Permissions
4. Functional Requirements
5. Data Model
6. API Endpoints
7. UI Design
8. Business Rules
9. Localization
10. Validation Rules
11. Security & Permissions
12. Acceptance Criteria

---

## 1. Executive Summary

The Catalog Subscription & Metadata Sync feature allows OpenELIS administrators to subscribe to external FHIR-based metadata catalogs — published by organizations such as EUCAST, WHO, or national reference laboratories — and receive structured updates to test definitions and clinical decision rules. When upstream changes are detected, administrators review a field-level diff and selectively accept or reject individual field changes, preserving local customizations (e.g., a locally meaningful test name) while absorbing authoritative clinical updates (e.g., revised normal ranges or updated EUCAST breakpoints). This extends OpenELIS's existing FHIR usage (currently applied to facilities, providers, and patients) into the metadata management domain.

---

## 2. Problem Statement

**Current state:** Test catalog data and clinical decision rules (e.g., EUCAST antimicrobial breakpoints) are managed entirely locally within each OpenELIS instance. When EUCAST publishes annual breakpoint revisions, or when a national reference lab updates a shared test panel, administrators must manually compare the upstream source to their local configuration and make updates by hand — a process that is error-prone, time-consuming, and frequently skipped.

**Impact:** Outdated breakpoints and normal ranges directly affect clinical interpretation. A lab running 2023 EUCAST breakpoints in 2026 may issue incorrect susceptibility calls. Manual synchronization overhead is also disproportionate in low-resource laboratory settings that rely on OpenELIS precisely because of limited staffing.

**Proposed solution:** OpenELIS will allow administrators to register one or more FHIR catalog endpoints and configure a polling schedule. A background job periodically fetches `ActivityDefinition` (test definitions) and `PlanDefinition` (clinical rules) resources from each endpoint, compares them to local entities using a dual-key identity strategy (canonical URL primary, LOINC code fallback), and queues detected changes as pending updates. Administrators review diffs in a structured UI, accepting or rejecting changes at the individual field level before they are applied to the local catalog.

---

## 3. User Roles & Permissions

| Role | Subscriptions Tab | Pending Updates Tab | Trigger Sync | Notes |
|---|---|---|---|---|
| Lab Technician | Hidden | Hidden | No | No access to admin catalog management |
| Lab Manager | View only | View only | No | Can monitor subscription status and pending update count |
| System Administrator | Full | Full | Yes | Can add, edit, remove subscriptions; apply or reject updates |

**Required permission keys:**

- `catalog.subscription.view` — View the Catalog Subscriptions page and subscription list
- `catalog.subscription.manage` — Add, edit, remove subscriptions; trigger manual sync
- `catalog.update.review` — View and resolve (accept/reject) pending catalog updates

---

## 4. Functional Requirements

### 4.1 Subscription Management

**FR-1-001:** The system SHALL provide a Catalog Subscriptions page accessible at Admin → Test Management → Catalog Subscriptions.

**FR-1-002:** The system SHALL display all configured catalog subscriptions in a searchable, paginated DataTable with the following columns: Name, FHIR Base URL, Resource Types, Polling Interval, Last Polled, Status, Actions.

**FR-1-003:** The system SHALL allow a user with `catalog.subscription.manage` to add a new subscription by entering: a display name, FHIR base URL, resource types to subscribe to (ActivityDefinition, PlanDefinition, or both), and polling interval in hours.

**FR-1-004:** The system SHALL allow a user with `catalog.subscription.manage` to edit an existing subscription via inline row expansion. Changes take effect on the next polling cycle.

**FR-1-005:** The system SHALL allow a user with `catalog.subscription.manage` to remove a subscription via a destructive confirmation modal. Removing a subscription does NOT delete previously accepted local data or resolved updates; it only stops future polling.

**FR-1-006:** The system SHALL allow a user with `catalog.subscription.manage` to trigger an immediate manual sync for any subscription by clicking "Check for updates." The system SHALL display an inline loading state during the sync and show an `InlineNotification` (kind="success" or kind="error") when the sync completes.

**FR-1-007:** The system SHALL display a subscription's status as one of: Active (green), Paused (warm-gray), Syncing (blue), or Error (red). A subscription enters Error status if the last polling attempt returned a non-2xx HTTP response or a malformed FHIR Bundle. A subscription in Error status SHALL display the HTTP status code and a truncated error message in an expandable detail row.

**FR-1-008:** The system SHALL support pausing a subscription without removing it. A paused subscription is not polled automatically but can still be triggered manually.

**FR-1-009:** The system SHALL support optional configuration of an OpenELIS Community Hub endpoint (a FHIR-compatible registry server) via the System Configuration page. When a hub URL is configured, the Subscriptions page SHALL display a hub connection status banner showing: hub name, total available catalog count, current subscribed count, and connection status (Connected / Unreachable).

**FR-1-010:** When a hub is connected, the Subscriptions page SHALL display a "Browse Catalog Registry" button in the hub status banner. Clicking this button SHALL open a full-screen drawer panel listing all catalogs published by the hub, with the following columns: Name (with description), Publisher, Resource Types, Region, Resource Count, Last Updated, and a Subscribe action.

**FR-1-011:** The catalog registry drawer SHALL support filtering by: name/publisher text search, region, and resource type (ActivityDefinition / PlanDefinition / Both). Catalogs already subscribed by the current instance SHALL display a "✓ Subscribed" indicator in place of the Subscribe button and SHALL NOT allow duplicate subscriptions.

**FR-1-012:** Clicking "Subscribe" for a catalog in the registry drawer SHALL immediately create a new `CatalogSubscription` record using the FHIR base URL and metadata from the hub registry entry. The new subscription SHALL default to the instance's standard polling interval. The subscription SHALL appear in the Subscriptions table and the "✓ Subscribed" indicator SHALL appear in the registry drawer without requiring a page reload. When no hub is connected, administrators may still add subscriptions manually by entering a custom FHIR endpoint URL directly in the add-subscription form.

### 4.2 Background Sync Job

**FR-2-001:** The system SHALL run a background job (`CatalogSyncJob`) on a configurable interval (default: every 60 minutes) that iterates over all Active subscriptions and polls those whose `lastPolledAt + pollingIntervalHours` is less than the current time.

**FR-2-002:** For each subscription poll, the system SHALL issue a FHIR search request to `{fhirBaseUrl}/ActivityDefinition?_summary=false&_count=100` (and/or `PlanDefinition` as configured) with pagination via `Bundle.link[next]`.

**FR-2-003:** The system SHALL update `lastPolledAt` and `status` on the CatalogSubscription entity after each poll attempt, regardless of outcome.

**FR-2-004:** The system SHALL write a structured audit log entry for each sync run, recording: subscription ID, resource type, resources fetched, new updates queued, timestamp, and outcome (success/error).

### 4.3 Identity Matching

**FR-3-001:** For each FHIR resource fetched, the system SHALL attempt to match it to an existing local entity using the following ordered strategy:

1. **Canonical URL match:** Compare `ActivityDefinition.url` (or `PlanDefinition.url`) against the `canonicalUrl` field stored on local test/rule entities. If a match is found, link the update to that local entity.
2. **LOINC code fallback:** If no canonical URL match exists, compare `ActivityDefinition.code` (with system `http://loinc.org`) against the local test's LOINC code. If a unique match is found, link the update and store the canonical URL on the local entity for future syncs.
3. **Ambiguous LOINC match:** If the LOINC code fallback matches multiple local entities, flag the update as `match_ambiguous`. The administrator must manually select the correct local entity before the field diff is shown.
4. **No match:** If no match is found on either key, classify the update as `new` — available for import as a new local entity.

**FR-3-002:** The system SHALL NOT create duplicate PendingCatalogUpdate records for the same upstream resource version if a pending update for that resource already exists (idempotent polling).

**FR-3-003:** The system SHALL skip generating a PendingCatalogUpdate if the upstream resource version (`meta.versionId` or `meta.lastUpdated`) is identical to the version recorded on the last resolved update for that canonical URL.

### 4.4 Pending Updates Review

**FR-4-001:** The Pending Updates tab SHALL display all PendingCatalogUpdates with status=pending or status=match_ambiguous, grouped by subscription, then sorted by resource type (ActivityDefinition first) and then by upstream resource name.

**FR-4-002:** The Pending Updates tab header SHALL display a badge with the total count of unresolved updates (pending + match_ambiguous). This same count SHALL appear as a badge on the tab label.

**FR-4-003:** Each row in the Pending Updates table SHALL display: Resource Name (upstream), Resource Type tag, Match Type tag (Linked / LOINC Match / New / Ambiguous), Subscription Name, Detected date, and Actions (Review / Reject All).

**FR-4-004:** Clicking "Review" on a pending update row SHALL expand an inline diff panel showing a field-level comparison table with the following columns: Field Name, Local Value, Upstream Value, Decision (Accept/Reject toggle).

**FR-4-005:** Each field row in the diff panel SHALL default to "Accept" if the field has no local value (i.e., the local field is blank or null). Each field row SHALL default to "Review" (neither accepted nor rejected) if both local and upstream values are present and differ, requiring an explicit decision.

**FR-4-006:** The diff panel SHALL provide "Accept All" and "Reject All" bulk action buttons that set all field decisions simultaneously. Individual field toggles SHALL override bulk decisions.

**FR-4-007:** Fields that are identical between local and upstream versions SHALL NOT appear in the diff panel. Only changed or new fields are shown.

**FR-4-008:** The system SHALL provide an "Apply Decisions" button that commits the accepted field values to the local entity. Applying decisions SHALL transition the PendingCatalogUpdate status to `accepted`, `rejected`, or `partially_accepted` as appropriate, and store the resolvedAt timestamp and resolvedBy user.

**FR-4-009:** For updates classified as `new` (no local match), the diff panel SHALL display all fields with a default decision of "Accept." Clicking "Apply Decisions" with at least one field accepted SHALL create a new local entity (test or rule) populated with the accepted fields, and store the upstream canonical URL as the permanent identity key on the new entity.

**FR-4-010:** For updates classified as `match_ambiguous`, the diff panel SHALL display a disambiguation UI above the field diff, listing candidate local entities with their names and LOINC codes. The administrator must select one before field decisions are shown.

**FR-4-011:** The Pending Updates tab SHALL support filtering by: Subscription, Resource Type (ActivityDefinition / PlanDefinition), and Match Type (Linked / New / Ambiguous).

**FR-4-012:** The system SHALL support bulk "Reject All" for multiple selected updates via DataTable batch selection, without showing individual field diffs.

### 4.5 PlanDefinition (Clinical Rules) Diff

**FR-5-001:** For PlanDefinition resources (e.g., EUCAST breakpoint sets), the diff panel SHALL present the rule's top-level metadata fields (name, version, status, publisher, description) as standard field rows.

**FR-5-002:** Individual breakpoint conditions (e.g., organism + antimicrobial + breakpoint thresholds) SHALL be presented as nested sub-rows within an expandable Accordion section labeled "Conditions/Breakpoints (N changed)."

**FR-5-003:** Each breakpoint condition row SHALL show: organism name, antimicrobial, SIR category, breakpoint MIC value (local vs. upstream), and an individual Accept/Reject toggle.

**FR-5-004:** New breakpoint conditions (present in upstream, absent locally) SHALL be shown with a "New" tag and default to "Accept." Removed conditions (present locally, absent in upstream) SHALL be shown with a "Removed" tag and default to "Review."

### 4.6 Notifications & Audit

**FR-6-001:** When a background sync detects new pending updates, the system SHALL increment the notification badge on the Catalog Subscriptions menu item in the Admin navigation.

**FR-6-002:** All sync runs, field-level decisions, and apply actions SHALL be recorded in the OpenELIS system audit trail with: actor, timestamp, subscription name, resource canonical URL, action type, and field-level decision summary.

---

## 5. Data Model

### New Entities

**CatalogSubscription**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| name | String (255) | Yes | Display name, unique per instance |
| fhirBaseUrl | String (1024) | Yes | FHIR server base URL, validated as URI |
| resourceTypes | Set\<String\> | Yes | Values: "ActivityDefinition", "PlanDefinition" |
| pollingIntervalHours | Integer | Yes | Min: 1, Max: 168 (1 week), Default: 24 |
| status | Enum | Yes | ACTIVE, PAUSED, SYNCING, ERROR |
| lastPolledAt | Timestamp | No | Null until first poll |
| lastErrorMessage | String (2048) | No | Populated on ERROR status |
| createdBy | String | Yes | Username |
| createdAt | Timestamp | Yes | — |
| updatedAt | Timestamp | Yes | — |

**PendingCatalogUpdate**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| subscriptionId | Long | Yes | FK to CatalogSubscription |
| resourceType | String | Yes | "ActivityDefinition" or "PlanDefinition" |
| resourceCanonicalUrl | String (1024) | Yes | Upstream canonical URL |
| upstreamResourceVersion | String | No | `meta.versionId` or `meta.lastUpdated` |
| upstreamResourceName | String (255) | Yes | Display name from upstream resource |
| localEntityId | Long | No | Null for new/unmatched resources |
| localEntityType | String | No | "Test", "PlanDefinition" |
| matchType | Enum | Yes | CANONICAL_URL, LOINC, NEW, AMBIGUOUS |
| status | Enum | Yes | PENDING, ACCEPTED, REJECTED, PARTIALLY_ACCEPTED, AMBIGUOUS |
| detectedAt | Timestamp | Yes | — |
| resolvedAt | Timestamp | No | — |
| resolvedBy | String | No | Username |

**PendingFieldChange**

| Field | Type | Required | Notes |
|---|---|---|---|
| id | Long | Yes | Primary key |
| pendingUpdateId | Long | Yes | FK to PendingCatalogUpdate |
| fieldName | String | Yes | Canonical field name (e.g., "normalRange.adult.min") |
| fieldLabel | String | Yes | Human-readable label for UI |
| localValue | String (4096) | No | Serialized current local value |
| upstreamValue | String (4096) | Yes | Serialized upstream value |
| decision | Enum | Yes | PENDING, ACCEPTED, REJECTED |
| isNested | Boolean | Yes | True for breakpoint sub-rows |
| parentFieldId | Long | No | FK to parent PendingFieldChange for nested rows |

### System Configuration Settings (new keys)

These settings are stored in the existing OpenELIS system configuration table (`site_information`) and are not new entities:

| Config Key | Type | Default | Description |
|---|---|---|---|
| `catalog.hub.url` | String (1024) | null | FHIR base URL of the connected OpenELIS Community Hub. Empty/null = hub not configured. |
| `catalog.hub.name` | String (255) | null | Display name of the hub (fetched from hub `/metadata` or set manually). |
| `catalog.defaultPollingIntervalHours` | Integer | 24 | Default polling interval used when subscribing from the registry browser. |

### Modified Entities

**Test** — Add fields:

| Field | Type | Notes |
|---|---|---|
| canonicalUrl | String (1024) | FHIR canonical URL; populated at import or on LOINC match confirmation |
| upstreamVersion | String (255) | Last accepted upstream resource version identifier |

**AMR Rule / PlanDefinition mapping** — Add fields:

| Field | Type | Notes |
|---|---|---|
| canonicalUrl | String (1024) | FHIR canonical URL for the linked PlanDefinition |
| upstreamVersion | String (255) | Last accepted upstream version identifier |

---

## 6. API Endpoints

| Method | Path | Description | Permission |
|---|---|---|---|
| GET | `/api/v1/catalog-subscriptions` | List all subscriptions | `catalog.subscription.view` |
| POST | `/api/v1/catalog-subscriptions` | Create subscription | `catalog.subscription.manage` |
| PUT | `/api/v1/catalog-subscriptions/{id}` | Update subscription | `catalog.subscription.manage` |
| DELETE | `/api/v1/catalog-subscriptions/{id}` | Remove subscription | `catalog.subscription.manage` |
| POST | `/api/v1/catalog-subscriptions/{id}/sync` | Trigger manual sync | `catalog.subscription.manage` |
| PUT | `/api/v1/catalog-subscriptions/{id}/pause` | Pause subscription | `catalog.subscription.manage` |
| PUT | `/api/v1/catalog-subscriptions/{id}/resume` | Resume subscription | `catalog.subscription.manage` |
| GET | `/api/v1/catalog-subscriptions/pending-updates` | List pending updates (filterable) | `catalog.update.review` |
| GET | `/api/v1/catalog-subscriptions/pending-updates/count` | Badge count (pending + ambiguous) | `catalog.update.review` |
| GET | `/api/v1/catalog-subscriptions/pending-updates/{id}` | Get update with field diffs | `catalog.update.review` |
| PUT | `/api/v1/catalog-subscriptions/pending-updates/{id}/decisions` | Submit field decisions | `catalog.update.review` |
| POST | `/api/v1/catalog-subscriptions/pending-updates/{id}/apply` | Apply accepted decisions | `catalog.update.review` |
| POST | `/api/v1/catalog-subscriptions/pending-updates/{id}/reject-all` | Reject all fields | `catalog.update.review` |
| POST | `/api/v1/catalog-subscriptions/pending-updates/reject-batch` | Reject multiple updates | `catalog.update.review` |
| PUT | `/api/v1/catalog-subscriptions/pending-updates/{id}/link` | Link ambiguous update to local entity | `catalog.update.review` |
| GET | `/api/v1/catalog-registry` | Fetch available catalogs from configured hub | `catalog.subscription.manage` |
| GET | `/api/v1/catalog-registry/hub-status` | Get hub connection status, name, counts | `catalog.subscription.view` |

---

## 7. UI Design

See companion React mockup: `catalog-subscription-mockup.jsx`

### Navigation Path

Admin → Test Management → Catalog Subscriptions → [Subscriptions | Pending Updates]

The feature is surfaced as a nested **SideNavMenu** under "Test Management" in the Admin side navigation. "Catalog Subscriptions" expands to reveal two **SideNavMenuItems**: Subscriptions and Pending Updates. There are no tabs — navigation between the two sections is performed exclusively via the side nav sub-menu items, consistent with OpenELIS admin navigation conventions.

The "Pending Updates" side nav item displays a red notification badge with the unresolved update count when count > 0.

### Key Screens

1. **Subscriptions** (Admin → Test Management → Catalog Subscriptions → Subscriptions) — DataTable listing all configured FHIR catalog endpoints. When a hub is configured, a Hub Status Banner appears above the table (see below). Inline row expansion for add/edit form. Status tags (Active/Paused/Syncing/Error). Manual sync trigger per row. Remove subscription via confirmation modal.

2. **Pending Updates** (Admin → Test Management → Catalog Subscriptions → Pending Updates) — DataTable listing all unresolved catalog updates, with count shown in the side nav badge. Filterable by subscription, resource type, and match type. Expandable rows reveal the field-level diff panel with per-field Accept/Reject toggles. "Apply Decisions" commits changes to local entities.

3. **Field Diff Panel** (inline, within row expansion) — Two-column comparison table: Local Value vs. Upstream Value. Toggle per field row. Accept All / Reject All bulk buttons. For PlanDefinition: nested Accordion for breakpoint conditions.

4. **Disambiguation Panel** (inline, for Ambiguous match type) — Candidate local entity selector shown above the field diff when LOINC code matches multiple local tests.

5. **Hub Status Banner** (conditional, appears above Subscriptions DataTable when `catalog.hub.url` is set) — A Carbon `Tile` with two visual states:
   - *Connected:* Green Tag ("Connected"), hub name, total catalog count, subscribed count, "Browse Catalog Registry" Button (primary), "Add Custom Endpoint" Button (ghost).
   - *Unreachable:* Red Tag ("Unreachable"), hub URL, error hint, "Retry" Button, "Add Custom Endpoint" Button (ghost).

6. **Catalog Registry Drawer** (full-width side panel, opens from Hub Status Banner) — Displays all catalogs published by the connected hub. Contains: search TextInput, Region Select dropdown, Resource Type Select dropdown, and a Carbon DataTable. Each row includes Name, Publisher, Resource Types (Tags), Region (Tag), Resource Count, Last Updated, and a Subscribe Button. Subscribed catalogs show a disabled "✓ Subscribed" Tag instead. Footer includes: "Can't find what you need? Add a custom FHIR endpoint manually →" link that opens the standard add-subscription form.

### Interaction Patterns

- Side nav sub-menu items for navigating between Subscriptions and Pending Updates (no tabs)
- Inline row expansion for subscription add/edit forms (no modals for edit)
- Inline row expansion for pending update field diff panels
- Modal dialog exclusively for destructive "Remove subscription" confirmation
- Accordion for nested PlanDefinition breakpoint conditions within the diff panel
- DataTable batch select for bulk "Reject All" on multiple pending updates

---

## 8. Business Rules

**BR-001:** A subscription with status=ERROR does not auto-poll. It must be manually triggered or re-saved to resume. The error message and HTTP status code are displayed in the subscription row detail.

**BR-002:** Tests without a `canonicalUrl` AND without a LOINC code are ineligible for matching and will never appear in the Pending Updates queue for update-type changes. They may still be offered as "New" resources from the upstream catalog if an upstream resource is newly detected with no local counterpart.

**BR-003:** When a field decision is ACCEPTED and "Apply Decisions" is clicked, the system writes the upstream value to the corresponding local entity field immediately, within the same transaction as the status update on the PendingCatalogUpdate.

**BR-004:** A PendingCatalogUpdate transitions to PARTIALLY_ACCEPTED if at least one field decision is ACCEPTED and at least one is REJECTED after apply. ACCEPTED if all field decisions are ACCEPTED. REJECTED if all field decisions are REJECTED.

**BR-005:** The notification badge count displayed in the Admin navigation and on the Pending Updates tab label equals the total count of PendingCatalogUpdate records with status IN (PENDING, AMBIGUOUS).

**BR-006:** If a LOINC code fallback match returns more than one local test, the update is flagged as AMBIGUOUS. No field diff is shown until the administrator selects the target local entity using the disambiguation selector. Once linked, the canonical URL is stored on the local entity to prevent future ambiguity.

**BR-007:** For PlanDefinition resources, accepting a breakpoint condition row that does not currently exist locally creates a new local breakpoint condition record. Accepting a "Removed" condition row (present locally, absent upstream) deletes the local condition record. The administrator must explicitly accept "Removed" rows for deletion to occur — rejection preserves the local record.

**BR-008:** When "Apply Decisions" creates a new local test (from a `new` match type update), the new test is created in INACTIVE status. The administrator must manually activate it in the Test Catalog before it appears in order entry. This prevents untested catalog imports from immediately affecting lab workflows.

**BR-009:** Polling requests include a `Cache-Control: no-cache` header and an `If-Modified-Since` header set to the last successful poll timestamp, to minimize unnecessary data transfer from FHIR servers that support conditional GETs.

**BR-010:** FHIR Bundle pagination (via `Bundle.link[next]`) is followed until all pages are retrieved or a configurable max-page limit (default: 50 pages) is reached. If the page limit is exceeded, the sync job logs a warning and stores a partial result, flagging the subscription with a warning state distinct from ERROR.

**BR-011:** Unsaved field decisions (toggles set in the diff panel but "Apply Decisions" not yet clicked) are not persisted. If the user collapses the diff panel or navigates away from the page without clicking Apply Decisions, all toggle states are discarded and the update remains in PENDING status. The UI MUST display a browser `beforeunload` warning when the user attempts to navigate away while unsaved field decisions exist in any open diff panel.

### FHIR Field Mapping

The following table defines how upstream FHIR resource fields map to local OpenELIS entity fields for the apply operation. Fields not listed are not currently mapped and will be logged but not applied.

#### ActivityDefinition → Test

| FHIR Field | Local Test Field | Notes |
|---|---|---|
| `ActivityDefinition.name` | `Test.name` | Display name |
| `ActivityDefinition.title` | `Test.reportingName` | Printed name on reports |
| `ActivityDefinition.description` | `Test.description` | — |
| `ActivityDefinition.code.coding[system=http://loinc.org].code` | `Test.loincCode` | LOINC code |
| `ActivityDefinition.code.coding[system=http://loinc.org].display` | `Test.loincName` | LOINC display name |
| `ActivityDefinition.observationResultRequirement.type` | `Test.resultType` | e.g., Numeric, Text, Coded |
| `ActivityDefinition.observationResultRequirement.normalCodedValueSet` | `Test.normalRange` | Reference range / normal value |
| `ActivityDefinition.observationResultRequirement.extension[unit]` | `Test.uom` | Unit of measure |
| `ActivityDefinition.extension[http://openelis-global.org/fhir/StructureDefinition/tat-target-hours].valueDecimal` | `Test.tatTargetHours` | TAT target in decimal hours (e.g., 4.0 for 4 hours). Nullable; if absent, compliance is not calculated for this test. Used by the Lab Management Dashboard. |
| `ActivityDefinition.status` | `Test.isActive` | `active` → true; `retired` → false |
| `ActivityDefinition.url` | `Test.canonicalUrl` | Identity key; written on first link |
| `ActivityDefinition.meta.versionId` | `Test.upstreamVersion` | Written on each accepted update |

#### PlanDefinition → AMR Rule / Breakpoint Set

| FHIR Field | Local Field | Notes |
|---|---|---|
| `PlanDefinition.name` | `BreakpointSet.name` | — |
| `PlanDefinition.version` | `BreakpointSet.version` | Displayed in AMR config |
| `PlanDefinition.publisher` | `BreakpointSet.publisher` | e.g., "EUCAST" |
| `PlanDefinition.description` | `BreakpointSet.description` | — |
| `PlanDefinition.action[].title` | `Breakpoint.organism` | Organism or condition name |
| `PlanDefinition.action[].input.codeFilter.code` | `Breakpoint.antimicrobialCode` | Antimicrobial SNOMED/LOINC code |
| `PlanDefinition.action[].condition.expression` | `Breakpoint.breakpointExpression` | MIC threshold expression |
| `PlanDefinition.url` | `BreakpointSet.canonicalUrl` | Identity key |
| `PlanDefinition.meta.versionId` | `BreakpointSet.upstreamVersion` | — |

---

## 9. Localization

All UI text is externalized. The following i18n keys must be added to the message properties files:

| i18n Key | Default English Text |
|---|---|
| `heading.catalogSubscription.pageTitle` | Catalog Subscriptions |
| `heading.catalogSubscription.subscriptionsTab` | Subscriptions |
| `heading.catalogSubscription.pendingUpdatesTab` | Pending Updates |
| `heading.catalogSubscription.addNew` | Add Catalog Subscription |
| `heading.catalogSubscription.editSubscription` | Edit Subscription |
| `heading.catalogSubscription.fieldDiff` | Field Changes |
| `heading.catalogSubscription.breakpoints` | Conditions / Breakpoints |
| `heading.catalogSubscription.disambiguate` | Select Matching Local Record |
| `label.catalogSubscription.name` | Subscription Name |
| `label.catalogSubscription.fhirBaseUrl` | FHIR Base URL |
| `label.catalogSubscription.resourceTypes` | Resource Types |
| `label.catalogSubscription.resourceTypeActivity` | ActivityDefinition (Tests) |
| `label.catalogSubscription.resourceTypePlan` | PlanDefinition (Clinical Rules) |
| `label.catalogSubscription.pollingInterval` | Polling Interval (hours) |
| `label.catalogSubscription.lastPolled` | Last Polled |
| `label.catalogSubscription.status` | Status |
| `label.catalogSubscription.statusActive` | Active |
| `label.catalogSubscription.statusPaused` | Paused |
| `label.catalogSubscription.statusSyncing` | Syncing |
| `label.catalogSubscription.statusError` | Error |
| `label.catalogSubscription.resourceType` | Resource Type |
| `label.catalogSubscription.matchType` | Match Type |
| `label.catalogSubscription.matchLinked` | Linked |
| `label.catalogSubscription.matchLoinc` | LOINC Match |
| `label.catalogSubscription.matchNew` | New |
| `label.catalogSubscription.matchAmbiguous` | Ambiguous |
| `label.catalogSubscription.localValue` | Local Value |
| `label.catalogSubscription.upstreamValue` | Upstream Value |
| `label.catalogSubscription.decision` | Decision |
| `label.catalogSubscription.detectedDate` | Detected |
| `label.catalogSubscription.fieldName` | Field |
| `label.catalogSubscription.newCondition` | New |
| `label.catalogSubscription.removedCondition` | Removed |
| `button.catalogSubscription.save` | Save Subscription |
| `button.catalogSubscription.cancel` | Cancel |
| `button.catalogSubscription.remove` | Remove |
| `button.catalogSubscription.checkForUpdates` | Check for Updates |
| `button.catalogSubscription.pause` | Pause |
| `button.catalogSubscription.resume` | Resume |
| `button.catalogSubscription.review` | Review |
| `button.catalogSubscription.acceptAll` | Accept All |
| `button.catalogSubscription.rejectAll` | Reject All |
| `button.catalogSubscription.applyDecisions` | Apply Decisions |
| `button.catalogSubscription.rejectAllSelected` | Reject All Selected |
| `message.catalogSubscription.syncSuccess` | Sync completed. {count} new updates detected. |
| `message.catalogSubscription.syncNoChanges` | Sync completed. No changes detected. |
| `message.catalogSubscription.applySuccess` | Changes applied to local catalog. |
| `message.catalogSubscription.removeConfirm` | Remove this subscription? Pending updates will be discarded. Previously accepted changes will not be affected. |
| `message.catalogSubscription.removeSuccess` | Subscription removed. |
| `message.catalogSubscription.newTestWarning` | New tests are created as Inactive. Activate them in Test Catalog before use. |
| `error.catalogSubscription.urlRequired` | FHIR Base URL is required. |
| `error.catalogSubscription.urlInvalid` | Must be a valid URL (https://...). |
| `error.catalogSubscription.nameRequired` | Subscription name is required. |
| `error.catalogSubscription.nameDuplicate` | A subscription with this name already exists. |
| `error.catalogSubscription.resourceTypesRequired` | Select at least one resource type. |
| `error.catalogSubscription.syncFailed` | Sync failed: {errorMessage} |
| `error.catalogSubscription.applyFailed` | Could not apply changes. Please try again. |
| `placeholder.catalogSubscription.searchSubscriptions` | Search subscriptions... |
| `placeholder.catalogSubscription.fhirBaseUrl` | https://catalog.example.org/fhir |
| `placeholder.catalogSubscription.name` | e.g., EUCAST 2026 |
| `heading.catalogRegistry.title` | Catalog Registry |
| `heading.catalogRegistry.availableCatalogs` | Available Catalogs |
| `label.catalogRegistry.hubConnected` | Connected |
| `label.catalogRegistry.hubUnreachable` | Unreachable |
| `label.catalogRegistry.hubName` | Hub |
| `label.catalogRegistry.totalCatalogs` | Available Catalogs |
| `label.catalogRegistry.subscribedCount` | Subscribed |
| `label.catalogRegistry.publisher` | Publisher |
| `label.catalogRegistry.region` | Region |
| `label.catalogRegistry.resourceCount` | Resources |
| `label.catalogRegistry.lastUpdated` | Last Updated |
| `label.catalogRegistry.subscribed` | ✓ Subscribed |
| `label.catalogRegistry.fromRegistry` | From registry |
| `button.catalogRegistry.browse` | Browse Catalog Registry |
| `button.catalogRegistry.addCustom` | Add Custom Endpoint |
| `button.catalogRegistry.subscribe` | Subscribe |
| `button.catalogRegistry.retry` | Retry |
| `button.catalogRegistry.close` | Close |
| `message.catalogRegistry.subscribeSuccess` | Subscribed to {catalogName}. Sync will begin on the next polling cycle. |
| `message.catalogRegistry.noResults` | No catalogs match your search. |
| `message.catalogRegistry.customEndpointHint` | Can't find what you need? Add a custom FHIR endpoint manually. |
| `error.catalogRegistry.hubUnreachable` | Could not connect to the hub. Check the hub URL in System Configuration. |
| `placeholder.catalogRegistry.search` | Search catalogs... |

---

## 10. Validation Rules

| Field | Rule | Error Key |
|---|---|---|
| name | Required | `error.catalogSubscription.nameRequired` |
| name | Unique per instance | `error.catalogSubscription.nameDuplicate` |
| name | Max 255 characters | `error.catalogSubscription.nameMaxLength` |
| fhirBaseUrl | Required | `error.catalogSubscription.urlRequired` |
| fhirBaseUrl | Valid HTTPS URI | `error.catalogSubscription.urlInvalid` |
| resourceTypes | At least one selected | `error.catalogSubscription.resourceTypesRequired` |
| pollingIntervalHours | Min 1, Max 168 | `error.catalogSubscription.intervalRange` |

---

## 11. Security & Permissions

| Action | Required Permission | UI Behavior if Denied |
|---|---|---|
| View Catalog Subscriptions page | `catalog.subscription.view` | Menu item hidden in Admin nav |
| Add new subscription | `catalog.subscription.manage` | Add button hidden |
| Edit subscription | `catalog.subscription.manage` | Edit button hidden; API returns 403 |
| Remove subscription | `catalog.subscription.manage` | Remove button hidden; API returns 403 |
| Trigger manual sync | `catalog.subscription.manage` | Check for Updates button hidden; API returns 403 |
| Pause / Resume subscription | `catalog.subscription.manage` | Pause/Resume button hidden; API returns 403 |
| View pending updates | `catalog.update.review` | Pending Updates tab hidden |
| Apply / reject field decisions | `catalog.update.review` | Apply Decisions and Reject All buttons hidden; API returns 403 |

---

## 12. Acceptance Criteria

### Functional

- [ ] User with `catalog.subscription.view` can access Admin → Test Management → Catalog Subscriptions
- [ ] User with `catalog.subscription.manage` can add a new subscription with name, FHIR base URL, resource types, and polling interval; the subscription appears in the table on save
- [ ] User with `catalog.subscription.manage` can edit an existing subscription via inline row expansion; changes persist after page reload
- [ ] User with `catalog.subscription.manage` can trigger a manual sync; an `InlineNotification` (kind="success") appears with the count of new updates when sync succeeds
- [ ] If a manual sync fails (e.g., FHIR server returns 404), the subscription status changes to Error and the error message is displayed; an `InlineNotification` (kind="error") is shown
- [ ] Subscription status tags are displayed using Carbon Tag with correct kinds (Active=green, Paused=warm-gray, Syncing=blue, Error=red)
- [ ] User can remove a subscription after confirming the destructive modal; the subscription is removed from the table and previously accepted data is not deleted
- [ ] The Pending Updates tab badge count equals the number of unresolved (pending + ambiguous) updates
- [ ] User with `catalog.update.review` can expand a pending update row to view the field-level diff panel
- [ ] Fields that are identical between local and upstream are not shown in the diff panel
- [ ] User can set individual field decisions (Accept/Reject) independently; "Accept All" and "Reject All" set all fields simultaneously but individual toggles override the bulk action
- [ ] Clicking "Apply Decisions" commits accepted field values to the local entity, updates the PendingCatalogUpdate status appropriately, and removes the row from the Pending Updates table
- [ ] A "new" match type update that has at least one accepted field creates a new local test in INACTIVE status with the canonical URL stored
- [ ] An InlineNotification (kind="info") is shown after applying a "new" update, informing the user the test was created as Inactive (FR-4-009 / BR-008)
- [ ] For an AMBIGUOUS update, the disambiguation selector is shown above the diff; the field diff is only revealed after a local entity is selected
- [ ] For a PlanDefinition update, changed breakpoint conditions appear in a collapsible Accordion section with per-condition Accept/Reject toggles
- [ ] A "Removed" breakpoint condition row only deletes the local record if the administrator explicitly accepts it (BR-007)
- [ ] User without `catalog.subscription.manage` cannot see Add, Edit, Remove, or Check for Updates buttons; direct API calls return HTTP 403
- [ ] User without `catalog.update.review` cannot see the Pending Updates tab; direct API calls return HTTP 403
- [ ] When `catalog.hub.url` is configured and reachable, the Hub Status Banner appears above the Subscriptions table with a green "Connected" Tag, the hub name, available catalog count, and subscribed count
- [ ] When `catalog.hub.url` is configured but unreachable, the Hub Status Banner shows a red "Unreachable" Tag and a Retry button; no registry browse button is shown
- [ ] When no hub is configured, the Hub Status Banner is not shown and the "Add Subscription" form is the only way to add a subscription
- [ ] Clicking "Browse Catalog Registry" opens the registry drawer listing all catalogs from the hub
- [ ] Registry drawer supports filtering by name/publisher search text, region, and resource type; the filtered results update without page reload
- [ ] Catalogs already subscribed display "✓ Subscribed" and cannot be subscribed again from the registry drawer
- [ ] Clicking "Subscribe" in the registry drawer creates a new subscription and immediately reflects it in both the registry drawer ("✓ Subscribed") and the Subscriptions DataTable
- [ ] The "Can't find what you need? Add a custom FHIR endpoint manually" footer link in the registry drawer opens the standard add-subscription inline form

### Non-Functional

- [ ] All UI strings use i18n keys — zero hardcoded English text in JSX
- [ ] Subscriptions list page loads within 2 seconds under normal conditions
- [ ] Pending Updates tab loads within 3 seconds for up to 500 pending update records
- [ ] Background sync job does not block the main application thread (runs asynchronously)
- [ ] All i18n keys documented in the Localization section above

### Integration

- [ ] `canonicalUrl` field is added to the Test entity and persisted correctly to the database
- [ ] Accepting a field from an `ActivityDefinition` update correctly writes the mapped field value to the local Test entity (name, units, normalRange, resultType, etc.)
- [ ] System audit trail records a structured entry for each apply action including actor, timestamp, canonical URL, and field-level decision summary
- [ ] FHIR Bundle pagination is followed correctly — all pages of a catalog are fetched, not just the first
- [ ] `If-Modified-Since` header is sent on subsequent polls to reduce server load (BR-009)
