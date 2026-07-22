# Handoff — Admin redesign MVP, Story B in progress (2026-07-22)

**Purpose.** OpenELIS admin section redesign (Phase 5 MVP). 9 of 11 target surfaces shipped as mockup + preview; 3 pages remain (B.3 Result Entry, B.6 Non-Conformity, B.7 Printed Reports) plus 2 non-page follow-ups (Jira story write-up, shell brief update note).

All artifacts are **pure local design files** in the workspace folder — nothing on a branch, no PRs, no OGC tickets yet. Story A (Admin Shell) approved 2026-04-23; Story B work opened after the Y-pivot on 2026-05-13. Latest scope doc = v1.8.

## State

**Where things live.** All under `/mnt/OpenELIS Feature Design/` (the workspace folder mounted from disk):

- Scope + governance
  - `admin-mvp-scope.md` (v1.8 — Y pivot + all locked decisions + §10b cross-cutting patterns)
  - `admin-mvp-direction-critique.md` (strategic checkpoint, 2026-05-13)
  - `admin-mvp-analyze-report.md` (cross-artifact /analyze, 3 CRITICAL/HIGH fixes applied)
  - `admin-shell-design-brief.md` (Story A shell brief, D1–D7 locked)
- Shipped surfaces (JSX mockup + HTML preview each, except where noted)
  - Story A shell: `admin-shell-preview.html` (preview only — shell is behavior, not settings)
  - B.1 Site Information: `site-information-mockup.jsx` + `site-information-preview.html`
  - B.2 Order & Patient Entry: `order-patient-entry-preview.html` **(preview only — JSX not built)**
  - B.4 Validation Rules: `validation-rules-mockup.jsx` + `validation-rules-preview.html`
  - B.5 WorkPlan: `workplan-mockup.jsx` + `workplan-preview.html`
  - B.8 Application Properties: `application-properties-mockup.jsx` + `application-properties-preview.html` (v2 connection cards)
  - B.9 Feature Flags: `feature-flags-mockup.jsx` + `feature-flags-preview.html` (curated dictionary + module switches + destructive modal)
  - Menu Configuration: `menu-configuration-mockup.jsx` + `menu-configuration-preview.html` (single Main tree + Billing inline URL — post-simplification)
  - Test Notification: `test-notification-mockup.jsx` + `test-notification-preview.html` (v2 rebuilt post-verify, /analyze fix applied — stacked sections not tabs)

**Story B remaining (3 pages):**
- **B.3 Result Entry** — audit says ~12 booleans; NOT verified against live yet. Legacy at `testing.openelis-global.org/MasterListsPage/ResultEntryConfigurationMenu` (guess — verify).
- **B.6 Non-Conformity** — NOT verified. Legacy at `.../NonConformityConfigurationMenu`.
- **B.7 Printed Reports** — NOT verified. Legacy at `.../PrintedReportConfigurationMenu`. Natural fit for the same live-preview pattern used on B.5 WorkPlan.

**Other follow-ups (open workbench items when resuming):**
- Sync B.2 JSX mockup (only the HTML preview exists — JSX still needs writing).
- Sync JSX for /analyze fixes across all Story B pages (only Application Properties JSX + Test Notification JSX were updated fully; other JSX may lag the preview).
- Task #23 — Draft Jira stories for Story A (Shell) + Story B (Distributed Redesigns) once the last 3 pages ship. Ask Casey for Epic/labels/assignee first per openelis-design skill.
- Task #25 — Small note update in `admin-shell-design-brief.md` confirming D5 (depth-2 only) holds under the Y pivot. Low priority.

## Established design patterns (scope doc §10b — applied to all pages)

Any new admin page in this MVP inherits these — do NOT invent new patterns:

1. **Recent Changes drawer** — 🕐 button in the page header opens a right-side drawer with last 5 changes (user · timestamp · field · before → after). Reads from OpenELIS's existing `audit_trail` table. Full audit log is Phase 6.
2. **Setup Checklist on /admin** — conditional on `facility.id` empty. 6 steps in fixed order (Site Info → Users → Modules → Messaging → Catalog → Notifications). Renders above the bucket grid on fresh installs; self-dismisses.
3. **Dependency surfacing** — Feature Flags curated dictionary supports `affects`/`dependsOn` fields. Destructive modal renders "Also affected" (when disabling) or "Required dependencies — currently OFF" (when enabling).
4. **Cross-link banners** — every settings page includes a "See also" `InlineNotification` linking to related surfaces (Feature Flags ↔ Application Properties ↔ Menu Configuration; Test Notification → Feature Flags).
5. **i18n externalization** — data-driven metadata (card titles, field labels, helper text) goes through `t('prop.<key>.label', raw)` helpers. Raw strings are preview-only fallbacks; production wires via React Intl per Principle VII.

## UX polish patterns (added post-B.1 based on Casey feedback 2026-05-14)

Applied to all pages from B.1 onward. Any earlier page (B.8 / B.9 / Menu Config / Test Notification) may need a polish pass to bring in line:

- **No count chips** on section headers (e.g. no "(7)" pill next to "Lab identity")
- **Raw key in hover tooltip** — friendly label visible; `Key: <raw>` shows in `title` attribute on hover only. Ops/devs can still debug; admins aren't distracted.
- **Section description under name** — not competing in header row. Two-line accordion titles.
- **Sticky bottom action bar** — Save + Discard + dirty summary pinned to viewport bottom. Always reachable.
- **Content-sized inputs** — width classes `input-w-short` (220px, e.g. ports/locales), `-medium` (400px, usernames), `-long` (600px, URLs), `-full` (100%, JSON). Don't render a 4-char "Region" field with a 600px input.
- **Inline validation** — URL/email fields blur-validate; malformed shows red underline + error text.
- **Helper text = "how + where"** — not "what it is". Every helper explains where the value shows up in the app and what changes if you flip it. Casey called out that helpers had gone "nose blind" in the middle of B.1 — the rewrite is the reference pattern.
- **Destructive-string save-time modal** — non-boolean destructive fields (e.g. `siteOrganizationFhirUuid`) don't confirm at edit time (users need to type the new value first); a dirty destructive field triggers a type-to-confirm modal when the admin clicks Save. Boolean destructive fields still confirm at toggle time.
- **Select over free text** where the option set is small — Barcode type = dropdown of Code 128 / QR, not free-text "BARCODE".

## Key design decisions locked

- **Y pivot (2026-05-13):** the original scope had 3 consolidated pages behind a single "Application Settings" with tabs; the Y pivot dissolved it because OpenELIS uses sidenav submenus, not in-page tabs (memory: `feedback_openelis_sidenav_submenus`). Story B now ships 9 surfaces distributed across their natural IA buckets. Application Settings as a wrapper concept is gone.
- **Feature Flags as a page** (not a tab) — module toggles pinned at top; curated dictionary + Uncurated tier; destructive modal with type-to-confirm for high-risk flags.
- **Multi-locale dropped** for admin-set labels (banner heading, address line labels, geographic unit labels, billing ref number label) — Casey 2026-05-14: labs pick one string in their primary language and don't change it; multi-locale support is overhead the lab doesn't use. Applies to any future "label" field.
- **RETROCI Study Forms** gated by `useRetroCIStudyForms` feature flag; Study Menu Configuration retires entirely (not consolidated).
- **Menu Configuration simplified** — instead of 5 tabs per legacy sub-scope, ONE Main tree with Billing node getting an inline-expansion for its URL (the only sub-page with extra data). 4 of 5 legacy sub-pages were redundant with parent-node checkboxes on the Main tree.
- **Test Notification stacked-not-tabbed** (F-carbon-01 fix) — per-channel overrides render as 4 stacked Tile sections inside the inline row expansion, NOT Carbon Tabs.
- **External patient source URL is hardcoded in Java** — the admin field stores the URL but request/response parsing lives in code. See memory `project_external_patient_source_hardcoded`.

## Coordinates

- **Workspace folder:** `/sessions/<session>/mnt/OpenELIS Feature Design/` (mounted from Mac disk)
- **Scope doc:** `admin-mvp-scope.md` v1.8
- **Testing instance:** testing.openelis-global.org (Chrome-saved creds, session expires often — Casey clicks Login manually)
- **Branch state:** none — this is pure local design work; no commits, no PRs
- **OGC tickets:** none created yet; will happen at Jira-story stage (task #23)
- **Constitution:** `.specify/memory/constitution.md` in openelis-work repo (source of truth: DIGI-UW/OpenELIS-Global-2)

## Verified data models (memory notes)

Every shipped page has a matching `project_*_data_model.md` memory note capturing field lists + defaults + destructive flags:

- `project_admin_mvp_feature_flag_pattern` — pattern doc
- `project_retroci_study_forms_flag` — RETROCI as a feature flag
- `project_test_notification_data_model` — 4 channels, 3 template tiers
- `project_menu_configuration_data_model` — 5 scopes originally, simplified to 1
- `project_application_properties_data_model` — 61 properties, 7 domains
- `project_site_information_data_model` — 29 properties, 6 domains, C039/C041 fixes
- `project_validation_configuration_data_model` — 4 charset fields, live preview
- `project_workplan_configuration_data_model` — 3 booleans, live workplan preview
- `project_order_patient_entry_data_model` — 14+8=22 properties merged
- `project_external_patient_source_hardcoded` — caveat for the URL field

## Resume — next concrete action

1. Log into testing.openelis-global.org and navigate to Result Entry Configuration (likely at `.../ResultEntryConfigurationMenu`, verify).
2. Capture the full field list, defaults, types (audit said ~12 booleans; may be more).
3. Save as `project_result_entry_data_model.md` in `.auto-memory/`.
4. Design brief in chat, then build `result-entry-mockup.jsx` + `result-entry-preview.html` in the workspace folder.
5. Apply §10b patterns + B.1 UX polish patterns (no count chips, hover-tooltip keys, sticky save bar, content-sized inputs, "how + where" helper text).
6. Cross-link banner → Order & Patient Entry (sibling in Workflow Tuning) + Feature Flags.
7. Repeat for B.6 Non-Conformity and B.7 Printed Reports.
8. Then draft the two Jira stories (task #23) — ask Casey for Epic/labels/assignee first per openelis-design Stage-3.
