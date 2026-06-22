# Admin Redesign — MVP Scope

**Version:** 1.8 (B.1 Site Information shipped; multi-locale fields dropped per Casey 2026-05-14 — labs set banner / address labels once in their primary language)
**Date:** 2026-05-14
**Prerequisites:**
- IA v2.3 (ratified)
- Pattern Library v1.0 (ratified 2026-04-20)
- Admin Shell Design Brief v0.1 (approved 2026-04-24; D1–D7 locked)

---

## 1. Purpose

Define a shippable MVP for the OpenELIS admin redesign that (a) delivers a modern frame, (b) retires the worst legacy pages by consolidating fragmented settings, and (c) can be delivered as two independently shippable Jira stories so neither blocks the other.

## 2. MVP shape

Two stories. Either is independently shippable:

| Story | Ships | What admins get if *only* this story lands |
|---|---|---|
| **Story A — Admin Shell** | New sidenav, bucket grid, breadcrumb, routing | New navigation frame. Each bucket page opens the existing legacy screen inside the new shell. |
| **Story B — Consolidated Contents** | 3 consolidated page redesigns covering 15 retired legacy pages | New consolidated pages at their canonical URLs. Old sidenav entries for retired pages redirect into the new pages with the right tab preselected. |

**Net impact when both ship:** 42 admin pages → 27 pages. 15 legacy pages retired. Every surviving page still reachable.

## 3. Story A — Admin Shell

### A.1 Scope (in)

- Carbon `SideNav` for the 11 IA-v2.3 buckets (per approved shell brief)
- Bucket index grid at `/admin` (launcher-only, no widgets)
- Bucket landing template (shared across all 11 buckets)
- Carbon `Breadcrumb` pattern (`Admin › Bucket › Page`)
- Route structure: `/admin`, `/admin/<bucket>`, `/admin/<bucket>/<page>`
- Legacy bucket pinned to bottom, gray-60 styling, per-item "Legacy" Tag
- Expand-in-place accordion, multi-expand allowed
- Keyboard + screen-reader behavior per shell brief §10
- Responsive collapse to hamburger below Carbon `md` breakpoint (1056px)
- Carbon icon set per shell brief §8 (UserMultiple, Catalog, Book, Flow, Notification, Building, ColorPalette, Connect, Report, Settings, Archive)

### A.2 Scope (out)

- Individual page content (covered by Story B or future phases)
- Admin-to-operational-page deep links
- Permission-based bucket hiding
- Cross-bucket search / Ctrl+K palette
- Expansion-state persistence across sessions
- Recently-edited shortcut on `/admin`

### A.3 Fallback when Story B hasn't shipped

Each of the 42 bucket-page routes opens the **existing legacy screen** inside the new shell frame. The rail, header, and breadcrumb are new; the page body is the existing React or JSP page, rendered inside the main content area. No consolidation yet — sidenav shows 42 entries across 11 buckets.

### A.4 Acceptance criteria

- AC-A-01: Clicking a bucket name in the rail navigates to that bucket's landing AND expands the bucket's submenu.
- AC-A-02: Clicking the chevron on a bucket expands/collapses the submenu without navigating.
- AC-A-03: Any number of buckets may be expanded simultaneously; state resets to "current bucket only" on each session.
- AC-A-04: Every non-root admin page shows a breadcrumb. The "Admin" crumb links to `/admin`; the bucket crumb links to the bucket landing.
- AC-A-05: The Legacy bucket is visually distinct (gray-60, divider above, per-item Legacy tag) and pinned to the rail bottom.
- AC-A-06: Every rail label, grid label, and breadcrumb label is wrapped in `t(key, fallback)`.
- AC-A-07: Every bucket landing and page has a canonical URL that can be deep-linked; hitting it directly expands the right bucket and highlights the right item.
- AC-A-08: Tab cycles rail items in order; Enter/Space on a bucket item expands AND navigates; `Esc` collapses the currently focused expanded bucket.
- AC-A-09: Expansion state is announced via `aria-expanded`; active item via `aria-current="page"`.
- AC-A-10: Rail collapses to a hamburger-triggered overlay below 1056px width.

## 4. Story B — Distributed Redesigns (Y pivot, 2026-05-13)

**Submenus, not tabs.** Per the OpenELIS sidenav convention (memory: "nest multi-view screens as sidenav submenu items; don't use in-page Carbon Tabs"), Story B does NOT bundle the 9 legacy "settings-shaped" pages behind a single Application Settings page with tabs. Each domain is redesigned in place in its IA-correct bucket. The bucket structure carries the grouping work.

**Story B now ships as 9 surfaces distributed across 5 buckets:**

### B.1 Site Information — Lab Setup bucket

**Retires:** Site Information (C039 Critical, C040 High, C041 High, C042 Medium)
**Canonical URL:** `/admin/lab-setup/site-information`
**Shape:** in-place Carbon-native redesign. PasswordInput masking for `patientSearchPassword` (fixes C039 Critical privacy bug). Localized fields for `bannerHeading` (fixes C041). Carbon `Accordion` to group fields by sub-domain (Lab identity · Patient search · Banner · Locale).

### B.2 Order & Patient Entry — Workflow Tuning bucket (merged)

**Retires:** Order Entry Configuration (C050 High, "ancient") + Patient Entry Configuration (C047 Medium)
**Canonical URL:** `/admin/workflow-tuning/order-patient-entry`
**Shape:** single page covering both. Both legacy pages have only 2 settings each — natural merge candidate. Carbon `Accordion` with two sections.

### B.3 Result Entry — Workflow Tuning bucket

**Retires:** Result Entry Configuration (C045 Medium, C046 Medium)
**Canonical URL:** `/admin/workflow-tuning/result-entry`
**Shape:** in-place redesign. Inline form grouped by purpose.

### B.4 Validation Rules — Workflow Tuning bucket

**Retires:** Validation Configuration (C051 High)
**Canonical URL:** `/admin/workflow-tuning/validation-rules`
**Shape:** in-place redesign. Threshold + rule editor with live validation preview.

### B.5 WorkPlan — Workflow Tuning bucket

**Retires:** WorkPlan Configuration (C038 Medium)
**Canonical URL:** `/admin/workflow-tuning/workplan`
**Shape:** in-place redesign.

### B.6 Non-Conformity — Workflow Tuning bucket

**Retires:** NonConformity Configuration (C036 High)
**Canonical URL:** `/admin/workflow-tuning/non-conformity`
**Shape:** in-place redesign.

### B.7 Printed Reports — Reporting & Exchange bucket

**Retires:** Printed Report Configuration (C048 Medium, C049 Low)
**Canonical URL:** `/admin/reporting-exchange/printed-reports`
**Shape:** in-place redesign with real-data preview affordance (per critique §3.6).

### B.8 Application Properties — System Administration bucket

**Retires:** Application Properties (C052 Critical — highest-priority redesign target; C053 High). Legacy URL `/MasterListsPage/commonproperties` redirects here.
**Canonical URL:** `/admin/system-admin/application-properties`
**Shape (rebuilt 2026-05-13):** the 61 verified properties collapse into **~14 connection cards** organized into 5 task-oriented groups:
- **Lab identity** — Facility card + Default Requester card (open by default; required at every deployment)
- **Authentication** — SAML SSO card (gated by `login.saml` toggle)
- **Outbound messaging** — SMTP card + Twilio SMS card
- **Integrations** — 8 cards: FHIR Subscriber, FHIR Store, Provider list, Facility list, Client Registry, Odoo (gated), OCL, Remote order source
- **Cold-storage** — Freezer monitoring card (gated by `freezermonitoring.enabled`)

Plus an **Advanced** disclosure (collapsed by default) containing operational defaults (configuration/menu/program autocreate, task semantics, paging defaults) and Help links.

**Per-card affordances:**
- Status badge in card header: Configured · Partial · Not configured · Disabled (visible from collapsed state)
- Enabled toggle (where applicable) gates the card body
- "Test connection" button on testable connections (SMTP, SMS, FHIR endpoints, Odoo, Remote source, SAML) — calls a backend health-check endpoint; surfaces success/failure inline
- Each field row shows friendly name + raw key as code annotation + correct input type per `type` (boolean → Toggle, integer → NumberInput, URL/email/path → typed/monospace TextInput, string → TextInput)
- Search across all cards auto-expands matching cards

**Why this redesign:** the legacy page treated each of 61 properties as independent. In reality most are parameters of a single config object (an SMTP connection, a FHIR store, an Odoo instance). Treating connections as connections — with status, test affordance, and gating toggle — matches how admins actually think about configuration.

**Naming standardized** to "Application Properties" (legacy UI title was inconsistently "Common Properties").

### B.9 Feature Flags — System Administration bucket (NEW page)

**Replaces:** no legacy page; surfaces the cross-cutting view named in Q5–Q7 (2026-04-24).
**Canonical URL:** `/admin/system-admin/feature-flags`
**Shape:** standalone page; sidenav peer of Application Properties under System Administration. Hybrid auto-aggregate + curated dictionary (Q6); cross-link to Menu Configuration (Q7).

**Module switches section pinned at the top** (per critique decision 1, 2026-05-13): the curated flags with `category: Module` (`useFhirAuthentication`, `usePathology`, `useImmunohistochemistry`, `usePatientReferring`, `useExternalConnections`, `useBilling`, `usePolyclinic`, `useRetroCIStudyForms`, etc.) render first as a "Modules" section with large, labelled toggles. Solves the "hide a module" journey in one click without adding a separate page.

**Curated dictionary keys per flag:**
- `flag.<key>.label` — human-readable name
- `flag.<key>.description` — longer explanation
- `flag.<key>.category` — Module · Integration · Workflow · Notification · Other
- `flag.<key>.destructive` — boolean (per critique decision 2)
- `flag.<key>.impact` — plain-English impact statement, shown in the confirmation modal for destructive flips

**Destructive-action modal (per critique decision 2):** any flag with `destructive: true` triggers a Carbon `Modal` on toggle:
- Flag name + current → new state
- Impact copy from `flag.<key>.impact`
- For highest-risk flags (auth, full-module disable, reset-to-defaults): type-to-confirm input — admin types the flag key to proceed
- Cancel + Confirm
- Non-destructive flags save inline as before

**Layout:** Module switches (pinned) → Integration flags → Workflow flags → Notification flags → Other → Uncurated (visually muted, "Uncurated" Tag, raw key visible — backlog signal).

**Curated dictionary coverage target for ship: ≥80% of flags.** If <80% at ship time, default to "hide Uncurated" with a power-user toggle (per critique §3.2).

### B.2 Menu Configuration (B-2)

**Retires 5 legacy pages:**

| # | Legacy page | Critique IDs |
|---|---|---|
| 1 | Global Menu Configuration | C029 (Critical), C030 (High), C031 (Medium) |
| 2 | Billing Menu Configuration | C032 (Medium) |
| 3 | Non-Conform Menu Configuration | C033 (High) |
| 4 | Patient Menu Configuration | C034 (Medium) |
| 5 | Study Menu Configuration | C035 (Medium) |

**Canonical URL:** `/admin/system-admin/menu-configuration`

**Conceptual frame:** Menu Configuration is a **navigation-scoped feature-flag editor**. Each menu node is "show this nav item / don't" — the same on/off primitive as Application Settings › Feature Flags, but rendered as a tree because navigation has hierarchy. Cross-link footer points to the Feature Flags tab for non-menu toggles.

**Shape (verified 2026-05-13 against live testing.openelis-global.org):**

Single page with Carbon `Tabs` for the 5 scopes:

| Scope tab | Source page | Content |
|---|---|---|
| **Main** | Global Menu Management | Full 4+ level hierarchical menu tree (Home, Generic Sample, Order, Study, Patient, Storage, Analyzers, QC, Non-Conform, EQA, Workplan, Pathology, Results, Validation, Reports, Admin, Billing, Inventory, Help) |
| **Billing** | Billing Menu Management | **No tree.** `Billing URL` TextInput + `Billing Menu Active` toggle. Special-case in the consolidation. |
| **Non-Conform** | Non-Conformity Menu Management | `Non-Conformity Menu Active` toggle + subtree when expanded |
| **Patient** | Patient Menu Management | `Patient Menu Active` toggle + 2-level subtree (Add/Edit Patient · Patient History · Study › 4 items · Merge Patient) |
| **Study** | Study Menu Management | `Study Menu Active` toggle + deep subtree (Study, Patient Status Report, ARV, EID, VL, Indeterminate, Special Request, Indicator, etc.) |

**Per-scope controls (shared pattern, except Billing):**
- Carbon `TreeView` rendering the scope's menu hierarchy with single-checkbox-per-node ("Side Nav Active") semantics
- `Show Child Elements` Toggle — expand/collapse the entire tree at once
- "Expand all" / "Collapse all" buttons for finer control
- Optional search-within-scope field to find a specific node by name
- Per-node optimistic save (fixes C031 — submit-all-or-nothing complaint)

**Billing-tab-only:**
- `TextInput` for Billing URL above the toggle
- `Billing Menu Active` toggle (no tree)

**URL deep-linking:** `?scope=main|billing|nonconform|patient|study` controls the active tab. Legacy menu-config pages each redirect to the corresponding scope tab.

**Cross-link footer:** *"For non-menu feature toggles, see Application Settings › Feature Flags."* (Per Q7 decision.)

**Lives in bucket:** System Administration.

**MenuStatement Configuration retires when this ships** per Q2 decision (2026-04-24); removed from the Legacy bucket on release.

### B.3 Test Notification Configuration (B-3)

**Retires 1 legacy page:**

| # | Legacy page | Critique IDs |
|---|---|---|
| 1 | Test Notification Configuration | C054 (Critical) |

**Canonical URL:** `/admin/subscriptions/test-notification`

**Shape (verified 2026-05-13 against testing.openelis-global.org):**

Subscription matrix uses 4 channel columns per test — **Patient Email, Patient SMS, Provider Email, Provider SMS**. Inline-cell checkboxes; bulk-select with batch actions for patterns like "enable Provider Email for all Serology tests." Fixes C054 — no more per-row edit navigation.

A 5th "Templates" column shows a Tag indicating override level: gray `System default` · blue `Test default` · purple `N override(s)`.

**System default template** (subject + message + variable substitution) lives in a banner tile **above** the table — edited once, applies to any test/channel without a more specific override.

**Inline row expansion** (per Result Entry inline-rows pattern; no Accordion wrap) exposes that test's templates:
- Test default template (Subject + Message) — overrides system default for any channel of this test without a per-channel override.
- Per-channel overrides as **4 stacked Tile sections** (one per channel — NOT Carbon Tabs; per F-carbon-01 fix, 2026-05-14). Each tile has a header row with channel name + status Tag (Custom override / Using test default) + Toggle to enable the override. When the Toggle is on, the Tile body exposes Subject + Message; Provider Email channel additionally exposes a BCC field.
- Variables reference rendered as a sidebar tile inside the expansion (always visible while editing): `[testName]`, `[testResult]`, `[patientFirstName]`, `[patientLastNameInitial]`.

**Fallback resolution at notification fire-time:** per-channel-per-test → test default → system default.

**Lives in bucket:** Subscriptions & Notifications.

**Functionality preserved from legacy:** all 4 channel toggles, all 3 template tiers, BCC on Provider Email, variable substitution doc, and the system-default Edit affordance. No legacy field dropped.

### B.4 Scope (out)

- Any admin page not listed in B.1–B.3
- Adding NEW settings (B is a consolidation, not an expansion — same data model, new UI)
- Data migration (assumes legacy data loads into the new page as-is)
- Legacy-page deletion (legacy pages stay on disk as fallback until Story A lands)

### B.5 Fallback when Story A hasn't shipped

The 3 new consolidated pages live at their canonical URLs. The existing OLD sidenav's entries for the 15 retired pages all redirect to the right new page with the correct tab preselected:

| Legacy sidenav entry | Redirects to |
|---|---|
| Site Information | `…/application-settings?tab=site` |
| Result Entry Configuration | `…/application-settings?tab=results` |
| Patient Entry Configuration | `…/application-settings?tab=patients` |
| Order Entry Configuration | `…/application-settings?tab=orders` |
| Validation Configuration | `…/application-settings?tab=validation` |
| WorkPlan Configuration | `…/application-settings?tab=workplan` |
| NonConformity Configuration | `…/application-settings?tab=nonconformity` |
| Printed Report Configuration | `…/application-settings?tab=printed-reports` |
| Application Properties | `…/application-settings?tab=app-properties` |
| Global Menu Configuration | `…/menu-configuration?scope=main` |
| Billing Menu Configuration | `…/menu-configuration?scope=billing` |
| Non-Conform Menu Configuration | `…/menu-configuration?scope=nonconform` |
| Patient Menu Configuration | `…/menu-configuration?scope=patient` |
| Study Menu Configuration | `…/menu-configuration?scope=study` |
| Test Notification Configuration | `…/test-notification` (no param needed) |

Admins on the OLD sidenav lose no functionality — their old menu entry just routes them to the right place.

### B.6 Acceptance criteria

**B-1 Application Settings**
- AC-B1-01: All 9 tabs render with the current values from the legacy data sources.
- AC-B1-02: Save on a tab persists only that tab's fields; other tabs are untouched (no submit-all).
- AC-B1-03: Site tab masks `patientSearchPassword` using Carbon `PasswordInput`; value is never rendered as plain text.
- AC-B1-04: Site tab presents `bannerHeading` as one localized field per active language.
- AC-B1-05: Opening `?tab=<slug>` selects that tab on load; invalid slugs fall back to Site.
- AC-B1-06: Application Properties tab groups the 60+ dotted keys by domain prefix (SAML, FHIR, Freezer, Mail, Notifications, Paging, Remote, Odoo, OCL, Requester, Facility) with per-field type + help text.

**B-2 Menu Configuration**
- AC-B2-01: TreeView renders the full menu hierarchy for the selected module scope.
- AC-B2-02: Toggling a node's visibility persists optimistically; failed saves show an error tag on that node without discarding other changes.
- AC-B2-03: Drag-to-reorder updates the node's position and persists on drop.
- AC-B2-04: Missing i18n keys in menu labels render a Carbon error surface visible only to admins (fixes C029).
- AC-B2-05: `?scope=<module>` filters the tree to that module on load.

**B-3 Test Notification Configuration**
- AC-B3-01: All 176 tests × 4 checkboxes render inline in the DataTable (no per-row edit modal).
- AC-B3-02: Category MultiSelect filters the visible rows.
- AC-B3-03: Bulk select + "Apply to selected" sets a given column state across N rows in one request.
- AC-B3-04: Individual checkbox toggles persist on change.

## 5. Independence contract

Three contracts that make the two stories independently shippable.

### 5.1 URL stability

The canonical URLs for the 3 consolidated pages are locked regardless of which story ships first:

- `/admin/system-admin/application-settings`
- `/admin/system-admin/menu-configuration`
- `/admin/subscriptions/test-notification`

Story A's shell routes to these URLs. Story B's pages live at these URLs. If Story A ships first, these URLs don't exist yet (shell routes fall through to legacy fallback). If Story B ships first, these URLs serve the new pages and the OLD sidenav redirects to them.

### 5.2 Tab/scope deep-linking

Each consolidated page accepts a single query param:

- Application Settings: `?tab=<tab-slug>` — one of `site`, `results`, `patients`, `orders`, `validation`, `workplan`, `nonconformity`, `printed-reports`, `app-properties`
- Menu Configuration: `?scope=<module>` — one of `main`, `billing`, `nonconform`, `patient`, `study`
- Test Notification: no param (single-screen)

Param rules:
- Invalid values fall back to the first tab/scope
- Tab/scope clicks update the URL via `history.replaceState` (no page reload)
- Story A deep-links into these URLs as if they were normal pages

### 5.3 Bucket inventory pinned to IA v2.3

Both stories pin to the 11-bucket IA v2.3. Neither story alters the bucket list. Post-MVP, bucket page counts shift (see §7); bucket identities do not.

## 6. Page retirement map

Complete mapping of the 15 pages retired in MVP Story B:

| Legacy page | Retired into | Tab/scope | Original bucket |
|---|---|---|---|
| Site Information | Application Settings | Site | Lab Setup |
| Result Entry Configuration | Application Settings | Results | Workflow Tuning |
| Patient Entry Configuration | Application Settings | Patients | Workflow Tuning |
| Order Entry Configuration | Application Settings | Orders | Workflow Tuning |
| Validation Configuration | Application Settings | Validation | Workflow Tuning |
| WorkPlan Configuration | Application Settings | WorkPlan | Workflow Tuning |
| NonConformity Configuration | Application Settings | NonConformity | Workflow Tuning |
| Printed Report Configuration | Application Settings | Printed Reports | Reporting & Exchange |
| Application Properties | Application Settings | Application Properties | System Administration |
| Global Menu Configuration | Menu Configuration | Main | System Administration |
| Billing Menu Configuration | Menu Configuration | Billing | System Administration |
| Non-Conform Menu Configuration | Menu Configuration | NonConform | System Administration |
| Patient Menu Configuration | Menu Configuration | Patient | System Administration |
| Study Menu Configuration | Menu Configuration | Study | System Administration |
| Test Notification Configuration | Test Notification | — | Subscriptions & Notifications |

## 7. IA consequences (post-MVP, informational)

After MVP ships, bucket page counts shift as consolidated pages absorb the legacy pages. The bucket identities stay — the shell is not reopened.

| Bucket | Pre-MVP pages | Post-MVP pages | Net change |
|---|---:|---:|---|
| People & Access | 4 | 4 | — |
| Test Catalog | 6 | 6 | — |
| Reference Data | 1 | 1 | — |
| **Workflow Tuning** | 8 | 2 | 6 pages absorbed into Application Settings |
| Subscriptions & Notifications | 1 | 1 | Test Notification redesigned in place |
| **Lab Setup** | 4 | 3 | Site Information migrates into Application Settings |
| Lab Identity | 2 | 2 | — |
| Integrations | 2 | 2 | — |
| **Reporting & Exchange** | 2 | 1 | Printed Report migrates into Application Settings |
| **System Administration** | 9 | 5 | Absorbs 2 consolidations, loses 5 menu-config pages |
| Legacy | 3 | 3 | — |
| **Total** | **42** | **27** | — |

**Follow-up after MVP ships:** review whether Workflow Tuning (2 pages) and Reporting & Exchange (1 page) are still viable buckets at their post-MVP size, or whether they fold into neighbors. This is a v2 IA question, not an MVP blocker.

## 8. Non-functional

- **Performance:** legacy-fallback pages have no perf regression (same tech); new consolidated pages render initial paint < 1s on p75.
- **i18n:** every new string wrapped in `t(key, fallback)` per Constitution Principle 1.
- **Permissions:** `ADMIN_MENU` gates both stories at the shell and page level; no per-bucket permission matrix in MVP.
- **Accessibility:** WCAG 2.1 AA per Constitution Principle 6; aria-current, aria-expanded, keyboard traversal as specified in the shell brief §10.
- **Browser support:** same matrix as the rest of OpenELIS Global — evergreen Chrome, Edge, Firefox, Safari.

## 9. Sequencing

Stories are independent, so order is a preference, not a dependency. Recommended:

1. **Story A first** — brief + preview are already approved. Fastest to Jira and ship.
2. **Story B next** — 3 redesigns across 3 sessions (B-1, B-2, B-3). B-1 is the biggest and sets the tab-page template that B-2 and B-3 can reuse stylistically.

Parallel is fine if there's bandwidth.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Legacy fallback (Story A alone) feels worse than today because the shell imposes a second frame around each legacy page | Keep the fallback opt-in via feature flag until Story B also lands, or test with one admin before ship |
| Tab deep-link params get forgotten and legacy sidenav stays pointed at old URLs | Include the OLD-sidenav redirect table as part of Story B's Definition of Done |
| Menu Configuration TreeView performance with hundreds of nodes | Virtualize the TreeView or paginate per module scope; verify with real menu data before Jira hands off |
| Application Settings grows a 10th tab during dev as new pages get discovered | Freeze at 9 tabs in this scope doc; any addition requires a scope amendment |
| Test Notification Configuration has performance issues at 176 × 4 checkboxes | Benchmark early in Story B-3; consider virtualization or pagination if needed |

## 10b. Cross-cutting MVP patterns (added 2026-05-14 from /analyze)

These patterns are documented once here and apply to **every Story B page**. Implementation must include them.

### 10b.1 Recent Changes drawer (per F-security-01)

A clock icon next to each page's H1 opens a right-side drawer listing the last 5 changes scoped to that page. Each row: `timestamp · user · field-key · before → after`. The drawer reads from OpenELIS's existing `audit_trail` table. Full audit history is queued for Phase 6; this MVP wedge closes the loudest ISO 15189 accreditation gap.

Reference implementation: `application-properties-mockup.jsx` and the matching preview. Other Story B pages reuse the same `<RecentChangesPanel scope="..." />` component.

### 10b.2 Setup Checklist on `/admin` (per critique §3.1)

When `facility.id` from `SystemConfiguration` is empty, `/admin` renders a "Setup checklist" tile **above** the bucket grid. Six steps in fixed order:

1. Set facility identity → `/admin/lab-setup/site-information`
2. Add the first admin users → `/admin/people-access/user-management`
3. Choose which modules are enabled → `/admin/system-admin/feature-flags`
4. Configure outbound email + SMS → `/admin/system-admin/application-properties`
5. Define your test catalog → `/admin/test-catalog/test-management`
6. Pick who gets notified per test → `/admin/subscriptions/test-notification`

Each step has a numbered badge + link + one-line hint. Completed steps line-through with a green check. The checklist self-dismisses once `facility.id` is set; an admin can also manually dismiss.

Reference implementation: `admin-shell-preview.html` (toggleable in preview to demonstrate both states).

### 10b.3 Dependency surfacing in destructive flag modal (per critique §3.2)

The Feature Flags curated dictionary gains two optional fields per entry:
- `affects: ['otherFlagKey', ...]` — disabling this flag also disables these
- `dependsOn: ['otherFlagKey', ...]` — enabling this flag requires these to be on

The destructive confirmation modal renders extra red-bordered tiles when these are present:
- Disabling a flag with `affects`: "Also affected — these dependent flags will be auto-disabled: …"
- Enabling a flag with `dependsOn` where prerequisites are OFF: "Required dependencies — these must be enabled first: …" (Confirm button disabled until prerequisites are met)

Reference implementation: `feature-flags-mockup.jsx` (Pathology → IHC pair seeded).

### 10b.4 Cross-link banners between related surfaces (per F-harm-01)

| From | To | Reason |
|---|---|---|
| Feature Flags | Menu Configuration + Application Properties | Where non-flag toggles live |
| Menu Configuration | Feature Flags | Where non-menu toggles live (incl. RETROCI Study Forms) |
| Application Properties | Feature Flags | Boolean settings also surface on Feature Flags as a cross-cutting view |
| Test Notification | Feature Flags | `enableEmailNotifications` / `enableSmsNotifications` gate channels system-wide |

Every page that touches "this thing lives elsewhere" surfaces an info banner near the top. Closes orientation loops with zero engineering cost.

### 10b.5 i18n externalization for data-driven content (per F-i18n-01)

For any mockup that defines content in a data structure (cards, fields, flags, steps), the rendered label/subtitle/helper text must go through `t()` keys:
- Cards / sections: `prop.<id>.title`, `prop.<id>.subtitle`, `prop.<id>.note`
- Fields: `prop.<key>.label`, `prop.<key>.helper`
- Flags: `flag.<key>.label`, `flag.<key>.description`, `flag.<key>.impact`

Raw strings in data definitions are fallbacks for the preview only. Production wires via React Intl message keys per constitution Principle VII.

Reference implementation: `application-properties-mockup.jsx` `cardLabel/cardSubtitle/cardNote/fieldLabel/fieldHelper` helper functions.

## 11. Decisions locked (2026-04-24 walkthrough)

| # | Question | Decision | Rationale |
|---|---|---|---|
| Q1 | Application Properties — stay folded into Application Settings, or peel off as a separate admin-vs-dev surface? | **Folded permanently.** Rendered as the 9th tab, internally organized by domain via Carbon `Accordion` (SAML, FHIR, Freezer, Mail, Monitoring, Misc.). | C052 flags it as the highest-priority redesign target; keeping it inside the consolidated page avoids a second frame and lets the Accordion carry the domain structure. |
| Q2 | When Menu Configuration ships, does MenuStatement Configuration retire too? | **Retires with the Menu Configuration release.** Removed from the Legacy bucket at the same time. | MenuStatement is the same surface with worse UI; shipping Menu Configuration without retiring it leaves two doors to the same data. |
| Q3 | Do the Legacy bucket's remaining pointer entries survive post-MVP or get retired entirely? | **Shrinks organically.** Each remaining Legacy entry is retired as its replacement ships. No forced sunset date. | Keeps the escape hatch for admins who need old screens; the Legacy bucket disappears on its own as Phase 6+ lands. |
| Q4 | Tab layout inside Application Settings — 1:1 with retired pages, or regrouped by domain up front? | **One tab per retired page (9 tabs) in MVP.** Domain regrouping per audit C040 deferred to v2. | Mechanical 1:1 migration preserves muscle memory and keeps Story B's retirement map traceable. Regrouping is a larger taxonomy bet that deserves field feedback first. |
| Q5 | Does the Feature Flags concept ship in MVP, or get parked for Phase 6? | **Ships in MVP** as a 10th tab in Application Settings. No backend change required — reads the same `SystemConfiguration` rows the home tabs do. | Naming the pattern now lets Phase 6 work (Critical Result Ack, AMR redesigns, EQA V2) ship behind flags cleanly. Cost is small (one more tab in an already-consolidating page). |
| Q6 | Scope of what appears in the Feature Flags tab — curated subset, auto-aggregate everything, or hybrid? | **Hybrid auto-aggregate with curated dictionary overlay.** Every boolean is shown; flags with `flag.<key>.label/.description/.category` i18n keys render in full; flags without render muted with an "Uncurated" Tag. | Coverage is complete (no flag hides), curated entries are scannable on day 1, and "Uncurated" becomes a visible backlog signal that's easy for contributors to pick up. |
| Q7 | Relationship between Feature Flags tab and Menu Configuration — keep separate, fold menu into flags, or treat Feature Flags as a master index? | **Keep separate, cross-link both ways.** Menu Configuration stays a TreeView for navigation hierarchy; Feature Flags tab carries a "menu toggles → Menu Configuration" banner; Menu Configuration footer points back. | TreeView is the right render for menu hierarchy; flat-list aggregation would lose information. Cross-linking is enough to keep mental models aligned without forcing a unified surface. |

## 12. Approval gate

Reply with one of:

- ✅ **Approved** — I generate the two Jira stories (Story A and Story B) per the openelis-design skill's Jira template and stand by for Epic/labels/assignee details.
- ✏️ **Approved with changes** — call out what to adjust (tab order, retirement map, URL structure, fallback behavior).
- 🔄 **Rework** — structural issue with the 2-story split; re-discuss.

---

## Appendix A — Source references

- `admin-shell-design-brief.md` v0.1 — 11-bucket shell, D1–D7 locked
- `admin-shell-preview.html` — clickable shell preview
- `admin-phase5-roadmap.md` — bucket inventory, per-page deliverable format
- `admin-pattern-library.md` — P-01 through P-13 component specs
- `admin-menu-redesign-roadmap.xlsx` Critique sheet — 74 findings across 40 pages (C001–C074)
- IA v2.3 — 11-bucket information architecture

## Appendix B — Page count summary

- Before MVP: 42 admin pages (9 of which already redesigned / modern: User Management, EQA-adjacent, etc.)
- Retired in MVP Story B: 15 pages
- After MVP: 27 pages visible in the shell; 15 legacy pages still on disk as Story-A fallback and data source

---

**Next step after approval:** produce Jira stories for A and B (skill will ask for Epic, labels, and assignee before writing them).
