# Carbon Anti-Patterns — OpenELIS Global Design

> Compiled from the `openelis-design` skill (`/analyze` Carbon passes B/C, constitution amendments) and standing design feedback. This is a working reconstruction, not the verbatim `references/carbon-anti-patterns.md` (that file was not reachable in-session). Treat the original skill reference as canonical if the two ever diverge.

Each entry: **the anti-pattern → the correct pattern**, with the `/analyze` pass and severity it triggers.

---

## A. Component & Styling Fidelity (`/analyze` Pass B)

| # | Anti-pattern | Correct pattern | Severity |
|---|---|---|---|
| A1 | Hardcoded hex colors or magic spacing values (`margin: 13px`) | Carbon tokens — `var(--cds-spacing-05)`, Carbon color tokens | HIGH |
| A2 | Bootstrap / Tailwind / external CSS classes on components | `@carbon/react` components + Carbon CSS classes only | CRITICAL |
| A3 | Custom error `<div>` for field validation | Carbon built-in validation props (`invalid`, `invalidText`) | HIGH |
| A4 | Status as plain text or custom-colored span | Carbon `Tag` with correct `kind` (see Status Badge Mapping) | HIGH |
| A5 | Tabular data rendered as `<div>` grid, `<ul>`, or raw `<table>` | Carbon `DataTable` for all tabular data | HIGH |
| A6 | Rolling a custom dropdown / autocomplete | Carbon `ComboBox` / `Select` / `MultiSelect` | MEDIUM |
| A7 | Inline `<style>` or styled-components overriding Carbon internals | Compose with Carbon props; tokens for any custom spacing | MEDIUM |

### Status Badge Mapping (the only sanctioned `Tag` kinds)

| Status | `kind` |
|---|---|
| Susceptible / Positive / Pass | `green` |
| Resistant / Fail / Critical | `red` |
| Intermediate / Borderline | `warm-gray` |
| In Progress / Draft | `blue` |
| Pending / In Queue | `purple` |
| QC Pass / Verified | `teal` |
| Unknown / Indeterminate | `gray` |

Inventing a new color or reusing a kind for an off-list status is an anti-pattern — map to the nearest sanctioned status or raise it as a dependency.

---

## B. Interaction & Layout Patterns (`/analyze` Pass C)

| # | Anti-pattern | Correct pattern | Severity |
|---|---|---|---|
| B1 | Modal for a routine edit | **Inline row expansion** | HIGH |
| B2 | Modal for a long form by default | Modals only for destructive confirmations or 5+ section forms | MEDIUM |
| B3 | In-page Carbon `Tabs` for multi-view screens | **SideNav submenus** (`feedback_openelis_sidenav_submenus`) | HIGH |
| B4 | Wrapping inline additions in an `Accordion` | Slot in as a new inline row alongside Methods / Storage (`feedback_result_entry_panel_inline_rows`) | MEDIUM |
| B5 | `Accordion` used for primary/required content | `Accordion` only for optional / advanced config | MEDIUM |
| B6 | Inventing a new top-level SideNav group | Reuse Config / Organization / Resources / Automation / Compliance; flag a genuine gap explicitly | HIGH |
| B7 | Confusing global admin buckets with editor-internal grouping | Global groups are SideNav-level, not inside a record editor (`feedback_admin_ia_vs_editor_ia`) | MEDIUM |

---

## C. Data-Scale Patterns (Constitution: *Design for Large Catalogs*) — `/analyze` Pass B

| # | Anti-pattern | Correct pattern | Severity |
|---|---|---|---|
| C1 | Long static `Select` over a large/growing set (tests ~500+, orgs, providers, panels) | Search / typeahead `ComboBox` (filterable) | MEDIUM |
| C2 | Embedding a multi-step "create heavy entity" flow (e.g. create a Test) inside another workflow | Link out to the dedicated admin page, then return | MEDIUM |
| C3 | Creating a new record where linking to an existing one would do | Prefer mapping/linking to an existing record | LOW |

---

## D. Domain Safety (Constitution: *No Hard Delete*) — `/analyze` Pass D

| # | Anti-pattern | Correct pattern | Severity |
|---|---|---|---|
| D1 | Hard "Delete" on any domain record (analyzers, tests, orgs, providers, results, configs, lookups) | Deactivate / Reactivate (or Retire / Archive) | CRITICAL |
| D2 | List of domain records with no show/hide-deactivated affordance | Default to hiding deactivated, with explicit "Show deactivated" toggle | MEDIUM |

Narrow exception: transient, non-clinical scratch data with no audit or referential significance may be deleted — only with explicit justification in the spec.

---

## E. Data Integrity & Scope (design-addendum MUSTs) — `/analyze` Passes G, H, J

| # | Anti-pattern | Correct pattern | Severity |
|---|---|---|---|
| E1 | Invented fields/columns/badges not traceable to a real OpenELIS entity | Every UI element traces to a real entity; new data declared in FRS Dependencies | CRITICAL |
| E2 | Multitenancy smell — "Lab selector", "Site:" filter, tenant dropdown, cross-org view | Single-tenant per deployment; referral relationships are FHIR referrals, not multitenancy (`project_no_multitenancy`) | CRITICAL |
| E3 | Invented per-action permission keys (e.g. `results.validate`) | Binary admin + per-module role bundles only | CRITICAL |
| E4 | Role matrix for a feature that lives wholly inside one role's workflow | The role's existing bundle already covers it | MEDIUM |

---

## F. Preview Completeness (`/analyze` Pass I)

| # | Anti-pattern | Correct pattern | Severity |
|---|---|---|---|
| F1 | Stubbed preview sections ("[content for Section X]", TODO, single dummy row) | Every section (tabs, accordion panels, sidenav submenus, wizard steps) populated with realistic content | CRITICAL |
| F2 | Placeholder filler data ("Item 1", "Section A") | Real lab section / test names + plausible numbers | MEDIUM |
| F3 | Static preview that doesn't convey the interaction model | Implement interactivity with `useState` (tabs switch, filters update, rows expand) | LOW |
| F4 | Section left in preview that isn't designed yet | Declare out of scope in FRS *and* remove from preview | — |

---

## Quick self-critique checklist (before delivery)

- [ ] No hardcoded colors / magic spacing — Carbon tokens only
- [ ] No Bootstrap / Tailwind / external CSS
- [ ] Status → Carbon `Tag` with a sanctioned `kind`
- [ ] Tabular data → `DataTable`
- [ ] Edits → inline row expansion, not modals
- [ ] Multi-view → SideNav submenus, not in-page Tabs
- [ ] Large-set pickers → `ComboBox`, not long `Select`
- [ ] No hard Delete — Deactivate/Reactivate + hide-deactivated default
- [ ] Every field traces to a real entity; new data declared as a dependency
- [ ] No site/tenant/lab selector
- [ ] No invented per-action permission keys
- [ ] Preview fully fleshed out — no stubbed sections, realistic data, interactive
- [ ] Managed lookup vs free tag — if the entity carries no behaviour of its own, use a tag
- [ ] Persistent operational criticals offer acknowledge-to-quiet (not a permanent red banner)

---

## Alerts: dismissibility (refines P-16)

P-16 keeps *transient* criticals non-dismissible. **D-042 refines this:** a **persistent
operational critical** (chronic stock-out, an instrument down for weeks) gets
**acknowledge-to-quiet** — the user acknowledges, the banner stops shouting, the condition
stays visible in its own surface. An always-red banner in a chronically-short lab becomes
wallpaper and trains people to ignore every banner. Compose from the shipped ack model
(`POST /rest/alerts/{id}/acknowledge`, `AlertAcknowledgeModal`, `acknowledgmentRequired`),
don't invent a parallel one (D-048).

## Managed lookup vs. free-form tag (D-037)

Before adding a managed lookup entity + its CRUD admin page, ask what the entity carries
that couldn't live on the item itself or be derived. If the answer is "nothing", make it a
**free-form tag** and skip the admin page. Precedent: inventory item "type" became a tag,
track-lots became a per-item property, and auto-consume is derived from the Test↔Reagent
link — which closed OGC-658 as superseded (D-038).
