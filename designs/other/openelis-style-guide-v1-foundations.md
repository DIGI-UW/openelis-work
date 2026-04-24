# OpenELIS Global — Style Guide v1 Foundations

> **Status:** Draft for publication to Confluence (space `OG`).
> **Authored:** 2026-04-23 · **Owner:** Casey Iiams-Hauser · **Audience:** Developers + designers contributing to OpenELIS Global
> **Source of truth:** Live app at `testing.openelis-global.org` + `DIGI-UW/OpenELIS-Global-2` `develop` branch. All tokens in this document are observed from the shipped app, not aspirational.
> **Supersedes:** Partially supersedes the existing "OpenELIS Global Style Guide" page (621346838, May 2025) in color + typography sections. See [§13 Migration notes](#13-migration-notes).

---

## Table of contents

1. [Purpose & scope](#1-purpose--scope)
2. [Design system stack](#2-design-system-stack)
3. [Brand tokens](#3-brand-tokens)
4. [Typography](#4-typography)
5. [Color](#5-color)
6. [Spacing, radius, elevation](#6-spacing-radius-elevation)
7. [Forms](#7-forms)
8. [Voice & tone](#8-voice--tone)
9. [Notifications](#9-notifications)
10. [Accessibility floor](#10-accessibility-floor)
11. [Known non-Carbon utilities](#11-known-non-carbon-utilities)
12. [Appendix — known technical debt](#12-appendix--known-technical-debt)
13. [Migration notes](#13-migration-notes)

---

## 1. Purpose & scope

OpenELIS Global is a laboratory information system used across diverse health systems and countries. Each deployment has different needs, but they share the same challenges: inconsistent user experience, uneven frontend tooling, and fragmented engineering practices across contributors. Historically, visual and interaction design across OpenELIS implementations has drifted, making collaboration harder and increasing the cost of maintenance and onboarding.

This guide is the response. It sets the baseline for a unified, modern, accessible design language across every OpenELIS Global interface, regardless of country, customization, or use case. It helps contributors ship faster with fewer regressions. It ensures the software stays usable for everyone — users on low-bandwidth networks, older hardware, and varying levels of digital literacy or ability.

**This documentation is not theoretical.** It is derived from the shipped app and the repo — real implementation experience, active deployments, and the lessons of maintaining a global open-source LIS. The aim is to reduce guesswork, eliminate inconsistency, and make OpenELIS easier to contribute to, extend, and scale.

### Objectives

- A clear, consistent user experience across every OpenELIS interface.
- Maintainability and scalability of both design and code.
- Accessibility, internationalization, and responsive behavior by default.
- A shared vocabulary that lets distributed contributors collaborate without re-litigating decisions.

### Who this guide is for

- **Software engineers** writing frontend or backend code that touches the UI.
- **UX/UI designers** producing layouts, workflows, and visual elements.
- **QA testers** verifying functionality aligns with expected behavior.
- **Documentation writers** preparing user manuals and technical guides.
- **Implementers and administrators** customizing or deploying OpenELIS for a specific lab or country.

### What v1 covers (and what it doesn't)

**v1 covers** brand tokens, typography, color, spacing/radius, forms, voice & tone, notifications, accessibility floor, and known non-Carbon utilities.

**v1 does not cover** component-level patterns (data tables, workplan grids, referral queues, report shells), page-shell patterns, iconography catalog, or data-viz conventions. Those land in v2 Patterns.

### How to use this page

Every section has a stable anchor ID (linked in the table of contents). Reference those anchors from Jira stories, PR descriptions, and design reviews. If a new UI introduces something this guide doesn't cover, the default is to follow Carbon upstream and raise a v2 Patterns ticket.

---

## 2. Design system stack

### Why Carbon

OpenELIS Global adopts the [IBM Carbon Design System](https://carbondesignsystem.com/) as the foundation for its UI layer. Carbon is professionally maintained, actively developed, shipped with a first-class React component library, has strong accessibility defaults built in, and provides a token-based theming surface that makes it straightforward to apply OpenELIS's brand without maintaining a bespoke component library.

Carbon enables OpenELIS to maintain a unified, scalable interface while reducing maintenance overhead. Contributors focus on lab-specific functionality rather than on reinventing inputs, tables, and modals.

Alternative design systems (Ant Design, Material UI, Bootstrap) were considered; Carbon was chosen for: (1) open-source enterprise-grade maintenance by IBM, (2) explicit design-token + theming architecture that supports the split-shell brand override we ship, (3) native React components with TypeScript support, and (4) strong accessibility + i18n story aligned with OpenELIS's global deployment profile.

### Key principles for implementers

1. **Consistency** — Use Carbon components for all new features. Do not reach for non-Carbon alternatives when a Carbon component exists.
2. **Extensibility** — Customize via Carbon theme tokens, not custom CSS. The split-shell brand override is the template.
3. **Interoperability** — Follow Carbon's API patterns when integrating with third-party libraries (Formik, charting, maps, etc.).

### Dependency matrix

The shipped versions (from `frontend/package.json`):

| Package | Version | Role |
|---|---|---|
| `@carbon/react` | `^1.15.0` | Current React component library (class prefix `cds--`) |
| `@carbon/themes` | `11.10.0` | Token packages (White, Gray 10, Gray 90, Gray 100) |
| `@carbon/icons-react` | `^11.17.0` | Iconography |
| `@carbon/charts` | `^1.27.2` | Data visualization |
| `@carbon/charts-react` | — | React bindings for charts |
| `carbon-components` | `^10.58.12` | **Legacy v10** (class prefix `bx--`) — isolated to older pages, being migrated out |
| `react` | `17.0.2` | Still on React 17 |
| `sass` | `1.79.5` | SCSS compiler |
| `single-spa` | `5.x` | Micro-frontend plumbing for JSP ↔ React coexistence |

**Rule:** New code uses `@carbon/react` (prefix `cds--`) only. Do not introduce new `carbon-components` v10 (`bx--`) imports. Existing v10 usage is legacy and will be migrated out incrementally.

---

## 3. Brand tokens

OpenELIS ships a **split-shell theme**: the top header and left side nav render in Carbon's `g100` dark theme with a navy override; the content area renders in Carbon's White theme with a custom warm-light background.

**Canonical theme file:** `frontend/src/index.scss`

| Token | Value | Where applied |
|---|---|---|
| Brand navy | `#295785` | `.cds--header` background, side-nav `layer-01`, CSS variable `--site-branding-header` |
| Brand navy (hover) | `#072655` | `.cds--header` hover, `layer-hover-01` |
| Content background | `#f5f6f8` | `.cds--content` background (custom, slightly warmer than Carbon default `#f4f4f4`) |
| Shell text on navy | `#ffffff` | Header and side-nav `text-primary`, `text-secondary`, icons |

**For implementers rebranding OpenELIS:** change `--site-branding-header` for the header color, and the `layer-01` override in `index.scss` for the side nav. Those are the two hooks.

The `#0f62fe` Carbon Blue 60 still governs primary buttons, links, and focus rings inside the content area — that's unchanged from Carbon defaults.

---

## 4. Typography

Base font stack (shipped):

```
"IBM Plex Sans", system-ui, -apple-system, "system-ui", ".SFNSText-Regular", sans-serif
```

Body: `16px / 400 / #161616` (Carbon Gray 100). Links: `#0f62fe / 14px` (Carbon Blue 60, `--cds-link-primary`).

### Heading rule

**Semantic heading level must match the Carbon productive-type scale:**

| HTML element | Carbon token | Size | Weight | Use |
|---|---|---|---|---|
| `h1` | `productive-heading-06` | 42px | 300 | Page title (one per page) |
| `h2` | `productive-heading-05` | 32px | 400 | Primary section |
| `h3` | `productive-heading-04` | 28px | 400 | Subsection |
| `h4` | `productive-heading-03` | 20px | 400 | Sub-subsection |
| `h5` | `productive-heading-02` | 16px | 600 | Small heading |
| `h6` | `productive-heading-01` | 14px | 600 | Label-like heading |

**Known drift (flag for cleanup):** the current order-entry page uses `h2` at both 32px and 20px and `h3` at 28px — heading levels don't correlate with the type scale. Also, dashboard `h4` is styled with `#4b5563` (Tailwind Gray 600), not a Carbon gray. New code must conform to the table above; cleanup tickets are queued in [§12](#12-appendix--known-technical-debt).

**Numeric + tabular data:** use `font-variant-numeric: tabular-nums` on tables of counts, accession numbers, and result values so digits align across rows.

**Line-height and letter-spacing** come from the Carbon type tokens themselves — do not override them with custom values. If a layout feels too tight or too loose, adjust container spacing, not the font metrics.

**Do not** use all-caps headings. Do not introduce new font families.

### Carbon type token reference

A shorthand mapping between Carbon type tokens and their typical role in OpenELIS:

| Carbon token | Role | Use |
|---|---|---|
| `productive-heading-06` | Page title | h1 on page shells |
| `productive-heading-05` | Major section | h2 section breaks |
| `productive-heading-04` | Subsection | h3 subsections |
| `productive-heading-03` | Minor subsection | h4 within a section |
| `productive-heading-02` | Small heading | h5, card / panel title |
| `productive-heading-01` | Label-like heading | h6, table header emphasis |
| `body-long-02` | Long-form body | Paragraph body in descriptive content |
| `body-long-01` | Default body | Body copy in forms and admin pages |
| `body-short-02` | Compact body | Inline text in table cells |
| `body-short-01` | Labels and UI text | Input labels, small UI text |
| `helper-text-01` | Helper text | Helper text under form inputs, captions |
| `label-01` | Form labels | Input and select labels |

---

## 5. Color

OpenELIS uses Carbon White as the base content theme, with the split-shell navy described in [§3](#3-brand-tokens). Status + notification semantic colors come from Carbon directly and are pinned below.

### Status + notification colors (Carbon)

| Semantic role | Token | Hex |
|---|---|---|
| Error / danger | `--cds-support-error` | `#da1e28` (Red 60) |
| Warning | `--cds-support-warning` | `#f1c21b` (Yellow 30) |
| Success | `--cds-support-success` | `#24a148` (Green 50) |
| Info | `--cds-support-info` | `#0043ce` (Blue 70) |

### Neutral scale (in use)

| Token | Hex | Use |
|---|---|---|
| `--cds-background` | `#ffffff` | Tile, modal, input background (Carbon White theme) |
| `--cds-layer-01` (content) | `#f4f4f4` | Field 01, card surfaces |
| Content area override | `#f5f6f8` | `.cds--content` custom background |
| `--cds-border-subtle-01` | `#e0e0e0` | Dividers |
| `--cds-text-primary` | `#161616` | Body text, icons |
| `--cds-text-secondary` | `#525252` | De-emphasized text, helper text |
| `--cds-text-placeholder` | `#a8a8a8` | Placeholders, disabled text |

### Interaction tokens (Carbon defaults in the content area)

These are Carbon defaults that drive buttons, links, and focus — they are NOT the OpenELIS brand (navy `#295785` is). They govern interactive elements inside the White-theme content area only.

| Token | Hex | Use |
|---|---|---|
| `--cds-link-primary` | `#0f62fe` | Primary link color, primary button |
| `--cds-link-secondary` | `#0043ce` | Secondary link, hover state |
| `--cds-link-visited` | `#8a3ffc` | Visited link |
| `--cds-button-primary` | `#0f62fe` | Primary action button |
| `--cds-button-secondary` | `#393939` | Secondary action button |
| `--cds-button-secondary-hover` | `#474747` | Secondary button hover |
| `--cds-button-tertiary` | `#0f62fe` | Tertiary action button |
| `--cds-focus` | `#0f62fe` | Focus ring (do not override) |

**Rule:** if you're about to introduce a hex value that isn't in this page or in Carbon's default tokens, stop — you're drifting. Use the nearest Carbon token or file a ticket to extend this page.

---

## 6. Spacing, radius, elevation

### Spacing

Use Carbon's 8px-step spacing scale via tokens: `$spacing-01` (2px) through `$spacing-13` (160px). The most common in OpenELIS: `$spacing-03` (8px), `$spacing-05` (16px), `$spacing-07` (32px).

Do not use raw pixel values in new code. Do not use Tailwind spacing utilities.

### Radius

**OpenELIS is a sharp-cornered app.** `border-radius: 0` is the default across inputs, buttons, cards, modals, and tiles. Carbon's own default.

**Two intentional exceptions:**

| Element | Radius | Rationale |
|---|---|---|
| Dashboard tiles | `5px` | Deliberate softness on the dashboard home — the one place users spend free-scan time |
| Tags (`.cds--tag`) | `16px` | Carbon tag default — pill-style |

Do not introduce other radii. If you think you need one, file a ticket first.

### Elevation

Use Carbon's `$shadow` tokens for elevation (modals, dropdowns). Do not layer custom `box-shadow` values.

---

## 7. Forms

OpenELIS uses `@carbon/react` inputs wired to `formik` for state + `yup` for validation.

### Field anatomy

| Property | Value |
|---|---|
| Field height | `40px` (Carbon default) |
| Field background | `#f4f4f4` (Gray 10, Field 01) |
| Field border | `1px solid transparent` + `1px solid #8d8d8d` bottom (Gray 50) |
| Field padding | `0 16px` |
| Field font-size | `14px` |
| Label | Carbon `label-01` (12px / 400 / `#525252`) |
| Helper text | Carbon `helper-text-01` (12px / 400 / `#525252`) |

### Validation messages

Use Carbon's built-in `invalid` + `invalidText` props on inputs. Do not render custom error divs beside inputs.

**Required-field message pattern** (declarative): `{Field name} is required`.

Examples from the live app:

- "Entity type is required"
- "Field name is required"
- "Accepted units are required for numeric fields"

**User-instruction pattern** (prefix with "Please", end with a period): `Please {verb} {object}.`

Examples:

- "Please select a device"
- "Please select a Sample Type or Test Section to begin viewing tests."

**System-failure pattern** (prefix with "Failed to"): `Failed to {verb} {object}`.

Examples:

- "Failed to acknowledge alert"
- "Failed to load system configuration"

Do not mix patterns within a single form. Pick the one that matches the cause (user input missing → required; user action needed → Please; system couldn't do its job → Failed).

### Required-field marker

Follow Carbon: asterisk suffix in the label (e.g., `Target Analyzer *`). Do not use red labels or underlined labels.

---

## 8. Voice & tone

### 8.1 Canonical terminology

Use the left column. The right column is the rejected variant. Counts reflect current usage in `frontend/src/languages/en.json`.

| Concept | Canonical | Avoid | Counts observed |
|---|---|---|---|
| Biological material | **sample** | specimen | sample 305 / specimen 14 |
| Testable unit | **test** | assay | test 353 / assay 0 |
| Order record | **order** | request | order 157 / request 45 (mostly HTTP) |
| Ordered-on person | **patient** | subject | patient 123 / subject 3 |
| Ordering clinician | **provider** | physician, clinician | provider 37 / both others 0 |
| Test output | **result** | finding | result 166 / finding 0 |

**Exception — cytology / pathology:** the term "specimen" is retained in cytology and pathology report content because "specimen adequacy" and "specimen source" carry defined clinical meanings (Bethesda System). Everywhere else (barcode, storage, QC, ordering, results), use **sample**.

### 8.2 Status vocabulary

Canonical set and meaning (pinned to remove drift):

| Status | Meaning |
|---|---|
| **Active** | Lifecycle: record is in use |
| **Inactive** | Lifecycle: record exists but is not in use |
| **New** | Recently created, unreviewed |
| **Draft** | Saved but not submitted |
| **Pending** | Submitted, awaiting action |
| **In Progress** | Work started, not complete |
| **Completed** | Work finished successfully |
| **Rejected** | Rejected in review/validation |
| **Accepted** | Approved in review |
| **Cancelled** | Workflow explicitly cancelled |
| **Deactivated** | User explicitly deactivated (distinct from lifecycle Inactive) |
| **Finalized** | Locked, no further changes |
| **Released** | Published to downstream consumers |

Notes: use "Completed" not "Complete". Use "Cancelled" (British spelling) to match existing data — this is an OpenELIS decision; do not switch to "Canceled".

### 8.3 Message archetypes

**Empty state** — describe what's missing + how to recover:

- "No alerts to display"
- "No results found for the selected filters. Try adjusting the date range or filter criteria."

Best-in-class: the recovery hint pattern ("Try adjusting…"). Prefer it whenever filters are in play.

**Success toast** — object + past-tense verb + "successfully":

- "Analyzer saved successfully"
- "Alert acknowledged successfully"
- "Lot quantity adjusted successfully"

**Destructive confirmation** — name the object, warn of irreversibility, enumerate cascade:

- "Are you sure you want to delete '{name}'? This action cannot be undone and will remove all associated field mappings."
- "Are you sure you want to copy {count} mappings? Existing mappings will be overwritten."

**Loading / progress** — short, ellipsis-terminated: `Loading…`, `Saving…`, `Creating…`. Use the Unicode ellipsis (U+2026), not three dots.

### 8.4 Capitalization

**Sentence case** for all button labels, menu items, headings, tab labels, and section titles.

- Right: "Print set", "Create new analyzer type", "Query analyzer"
- Wrong: "Print Set", "Create New Analyzer Type", "Query Analyzer"

**Capitalize only:** the first word, proper nouns, and product/module names. Acronyms stay uppercase (ASTM, HL7, FHIR, EQA, QC, NCE, LIS, HPV).

Existing Title Case strings in `en.json` (61 of them) will be swept in a single cleanup PR. New code must use sentence case from day one.

### 8.5 Punctuation

**Short labels** (buttons, chips, table headers, tabs, status tags) have **no terminal punctuation**.

**Full sentences** (validation messages, error descriptions, helper text, confirmation bodies) end in a period.

Questions end in "?". Exclamations are not used — keep the tone professional.

### 8.6 i18n key naming

Every visible UI string must be wrapped in the i18n helper (`t('key', 'fallback')`). Keys use dotted namespacing:

```
module.feature.subfeature.purpose
```

Examples from `en.json`:

```
analyzer.delete.error.unknown
alerts.acknowledge.comment.required
eqa.distribution.empty
reports.tat.noResults
button.cancel
```

Rules:

- All new keys use `module.feature.purpose` dot-notation. No bare top-level keys (there are 19 legacy stragglers — do not add more).
- Button labels go under `{module}.button.{verb}` or `button.{verb}` for generic. Do not mix into `label.button.{verb}` (legacy namespace — being consolidated).
- Error messages: `{module}.{feature}.error` for a terse title; `{module}.{feature}.error.{specific}` for detail.
- Required-field validation: `{module}.{feature}.validation.{fieldName}.required`.
- Success confirmations: `{module}.{feature}.success`.

---

## 9. Notifications

### 9.1 Inline notifications — `cds--inline-notification`

Use inline notifications for form-level and page-level feedback that's anchored to a specific area.

| Kind | Left-border color | Height | When to use |
|---|---|---|---|
| Error | `#da1e28` (Red 60) | 48px | Form validation failures, destructive warnings |
| Warning | `#f1c21b` (Yellow 30) | 48px | Recoverable problems, risky state |
| Success | `#24a148` (Green 50) | 48px | Confirm a completed action where the user is still on the same page |
| Info | `#0043ce` (Blue 70) | 48px | Contextual hints, non-critical status |

Background: `#f4f4f4` (Gray 10). Title: 14px / 600. Subtitle: 14px / 400. 3px solid left-border in the semantic color. Radius 0.

### 9.2 Toast notifications — `cds--toast-notification`

Use toasts for **transient** operation feedback — user triggered an action that completed in the background, user has moved on.

Same semantic color palette as inline. Height 84px. Auto-dismiss at 4–6 seconds; do not leave success toasts on screen indefinitely.

### 9.3 Tags — `cds--tag`

Pill-style (16px radius — one of two radius exceptions in the app). Height 24px, font 12px. Use semantic colors from Carbon:

| Kind | Example use |
|---|---|
| `green` | Susceptible / Positive / Pass / Active |
| `red` | Resistant / Fail / Critical / Rejected |
| `warm-gray` | Intermediate / Borderline |
| `blue` | In Progress / Draft |
| `purple` | Pending / In Queue |
| `teal` | QC Pass / Verified |
| `gray` | Unknown / Indeterminate |

### 9.4 Placement rules

- Notifications and tags belong in the **content area** only. Do not place them in the navy header or side nav — the light-on-dark contrast breaks Carbon's notification design.
- Inline notifications appear above the form or control they relate to.
- Toasts appear in the bottom-right of the viewport.
- Tags appear inline with the object they describe (table cells, list items, tile headers).

---

## 10. Accessibility floor

OpenELIS targets **WCAG 2.1 Level AA** compliance.

Non-negotiables:

- Every interactive element must be keyboard reachable.
- Focus state must be visible — do not override Carbon's `focus-visible` styles.
- Every form input must have a programmatic `<label>` (Carbon handles this when you use its components correctly).
- Images must have `alt` text; decorative images use `alt=""`.
- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components.
- Status should never be conveyed by color alone — always pair with an icon or text.
- Minimum target font size: 12px for caption/helper, 14px for interactive text, 16px base body.

**Known open items:** contrast verification on the navy header against white icons, and explicit skip-link pattern for the app shell. Both are queued for the v2 Patterns / Accessibility sub-page.

---

## 11. Known non-Carbon utilities

`frontend/src/index.css` declares several OpenELIS-specific utilities not in Carbon:

| Utility | Purpose | Rule |
|---|---|---|
| `.slide-over-root`, `.oeui-slideover-x`, `.oeui-slideover-y` | Slide-over panel transitions | Use for detail / editor panels only. Do not use for modal-style dialogs — use Carbon `Modal` for those. |
| `.backdrop-blur` | Blurred overlay behind modal/slide-over | Pair only with slide-over or modal; do not apply elsewhere. |
| `.translate-x-*`, `.translate-y-*` | Transform helpers | Legacy — prefer Carbon motion + inline transforms in new code. |

Do not introduce new non-Carbon utility classes. If Carbon lacks a pattern you need, raise it in design review before writing CSS.

---

## 12. Appendix — known technical debt

These are observed inconsistencies in the shipped app as of 2026-04-23. Each is queued for cleanup; the rule for new code is to not reproduce them.

| Item | Debt | Fix plan |
|---|---|---|
| Heading hierarchy | Order-entry page uses `h2` at 32px and 20px, `h3` at 28px — levels don't correlate with type scale | Sweep on next order-entry refactor |
| Non-Carbon H4 color | Dashboard `h4` uses `#4b5563` (Tailwind Gray 600) | Replace with Carbon Gray 70 `#525252` |
| Button casing | 61 Title Case button strings in `en.json` | One-PR sweep to sentence case + lint rule |
| Specimen / sample | 6 barcode strings use "specimen" where "sample" is canonical | Rename in `en.json` |
| Dual button namespaces | `button.{verb}` and `label.button.{verb}` both in use | Consolidate under `button.{verb}` |
| "Ok" vs "OK" | Both spellings present | Standardize on "OK" |
| Double-space strings | 15 i18n values contain double spaces | Trim |
| Trailing whitespace | 39 `coldStorage.*` error templates end in ": " expecting dynamic append | Convert to `{detail}` placeholders |
| Carbon v10 legacy | `carbon-components@10.58.12` still installed; `bx--` class prefix in older pages | Identify v10 pages in v2 sweep, migrate per module |
| Stale `App.css` | Create-react-app boilerplate (`App-logo-spin`) not used | Delete |
| Non-Carbon table library | `react-data-table-component` installed alongside Carbon `DataTable` | Pick one in v2 Patterns |
| React 17 | Still on React 17.0.2 | Plan React 18 upgrade |

---

## 13. Migration notes

This page **replaces** the previous "OpenELIS Global Style Guide" page in place. Page history is preserved in Confluence — see the version history panel for earlier drafts.

**Prior authorship:** The original page was authored by Taib (May 2025) and established the initial framing around Carbon adoption, the audience, and the Objectives. That narrative is retained and carried forward in [§1](#1-purpose--scope) and [§2](#2-design-system-stack) of this version.

**What changed vs the May 2025 version:**

- **Brand color corrected.** The prior Primary Colors table listed Carbon Blue `#0f62fe` as the brand primary; the shipped brand is navy `#295785` applied via `--site-branding-header` on the header and a `layer-01` override on the side nav. `#0f62fe` is the content-area interaction color (buttons, links, focus), not the brand.
- **Typography tables verified against the shipped app.** The Carbon type tokens govern line-height and letter-spacing — the arbitrary `1.5 / 1.25 / 1.3` line-heights and `0.5px / 0.3px` letter-spacing values in the prior version were not shipped and have been dropped.
- **Spacing tokens switched to Carbon.** The prior `--spacing-sm/md/lg` shorthand was not shipped; the canonical scale is Carbon's `$spacing-01` through `$spacing-13`.
- **Accessibility / Status color values filled in** (prior page marked these "Not Provided"). Values come from Carbon's semantic tokens and are verified in live DOM samples.
- **Added:** Voice & tone section (canonical terminology, status vocabulary, message archetypes, punctuation rule, sentence-case rule, i18n key naming) — derived from 5,112 shipped `en.json` keys.
- **Added:** Notification + tag patterns with geometry and semantic color mapping.
- **Added:** Technical debt appendix tracking the drift found during the review.
- **v2 Patterns placeholders** (Icons, Tables, Buttons, Forms) carried over as v2 scope.

**Open inline comment from prior page:** A May 2025 inline comment asked why Carbon was chosen over Ant Design. That question is now addressed in [§2 Why Carbon](#2-design-system-stack).

---

_End of v1 Foundations. Questions or proposed changes: file a Jira story in `OG` and link the relevant anchor ID from this page._
