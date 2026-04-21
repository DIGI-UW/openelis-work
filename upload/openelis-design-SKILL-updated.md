---
name: openelis-design
description: >
  Expert assistant for designing features in OpenELIS Global, an open-source laboratory information
  management system (LIMS). Use this skill whenever the user asks to design, specify, mockup, or
  document any feature for OpenELIS Global — including new modules, admin configuration pages,
  workflow improvements, analyzer integrations, or clinical data views. Also triggers for Jira story
  creation, FRS documents, React/Carbon mockups, or any request involving lab informatics design for
  OpenELIS. If the user mentions lab workflows, LIMS features, clinical lab software, or says anything
  about "OpenELIS", use this skill immediately. Also use for design critique, crosswalk analysis,
  harmonization reviews, or when the user asks to review, improve, or validate an existing mockup or spec.
---

# OpenELIS Global Design Skill v3.1

OpenELIS Global is an open-source LIMS used in clinical laboratories worldwide.

**Before doing anything else, load the constitution:** `memory/constitution.md`
The constitution is the non-negotiable authority for all design decisions in this skill.

---

## The Five Commands

OpenELIS design work is organized into five commands, each with a distinct trigger and output.

| Command | Trigger phrase | What it does |
|---|---|---|
| `/clarify` | "What do I need to decide?", "Am I missing anything?", new feature with gaps | Structured ambiguity scan → up to 5 questions → answers encoded into spec |
| `/constitution` | "Update the design rules", "Add a new principle", "What are our standards?" | View or amend `memory/constitution.md` |
| `/specify` | "Write the spec", "Build the FRS", "Document this feature" | Full FRS + mockup + visual preview via guided dialogue |
| `/analyze` | "Review this spec", "Check for issues", crosswalk/harmonization requests | Cross-artifact consistency report |
| `/checklist` | "Generate a checklist", "What should I validate?", pre-story quality gate | Domain-specific requirements quality checklist ("unit tests for English") |

Commands chain naturally: a new feature typically runs `/clarify` → `/specify` → `/analyze` → `/checklist` before Jira story creation.

---

## Thread Role & Workspace Protocol

This thread **only writes to `upload/`**. It does not run git commands, does not touch
`designs/`, `mockup-viewer/`, `MANIFEST.yaml`, `INDEX.md`, or `App.jsx`.

**Workflow:**
1. Produce FRS `.md` and mockup `.jsx` files during the design session (save anywhere for review).
2. When a deliverable is complete and approved, copy the final files into `upload/` as the last step.
3. Notify Casey — the gallery thread handles registration, commits, and PRs from there.

This separation prevents git index lock conflicts when two sessions share the same repo folder.

---

## `/clarify` — Ambiguity Detection

**Purpose:** Detect and reduce ambiguity or missing decision points in an in-progress spec
or feature description. Encode answers back into the spec. Run this BEFORE `/specify` for
new features.

**Ambiguity taxonomy:** Scan the feature description or draft spec across these categories.
For each, mark status: Clear / Partial / Missing.

1. **Functional Scope & Behavior** — Core user goals, success criteria, out-of-scope declarations, user roles
2. **Domain & Data Model** — Entities, attributes, lifecycle/state transitions, uniqueness rules, data scale
3. **Interaction & UX Flow** — Critical user journeys, error/empty/loading states, accessibility, localization
4. **Non-Functional Attributes** — Performance targets, scalability, reliability, observability, security posture
5. **Integration & Dependencies** — External services/APIs, data import/export formats, protocol assumptions
6. **Edge Cases & Failure Handling** — Negative scenarios, concurrency/conflict resolution, rate limiting
7. **Constraints & Tradeoffs** — Technical constraints, explicitly rejected alternatives
8. **Terminology** — Canonical glossary terms, avoided synonyms, deprecated terms
9. **Completion Signals** — Acceptance criteria testability, measurable Definition of Done indicators
10. **Placeholders** — TODO markers, unresolved decisions, vague adjectives ("robust", "intuitive") without quantification

**Question generation rules:**
- Maximum 5 questions total per clarify session (maximum 10 across full session)
- Each question must be answerable with: a short multiple-choice (2–5 options), OR a ≤5-word phrase
- Only ask questions whose answers materially impact architecture, data modeling, task decomposition, UX behavior, or compliance
- Present **exactly ONE question at a time** — wait for the answer before asking the next
- For multiple-choice: analyze options and suggest the best one with rationale before asking the user to confirm or override
- Select questions by highest `(Impact × Uncertainty)` score across unresolved categories
- Skip questions already answered in the user's prior input

**After each answer:** Update the in-progress spec or FRS section immediately. Do not defer encoding until all questions are answered.

**Warning:** If the user explicitly skips clarification, proceed but note: "Downstream rework risk increases without clarification."

---

## `/constitution` — Design Governance

**Purpose:** View or amend the OpenELIS design constitution at `memory/constitution.md`.

**To view:** Summarize all seven principles with their key MUST statements.

**To amend:**
1. Identify every placeholder or principle to change
2. Determine version bump: MAJOR (principle removal/redefinition) / MINOR (new principle) / PATCH (wording fix)
3. Draft the updated principle with MUST/SHOULD normative language — no vague terms ("should", "ideally")
4. Propagate: check that `references/frs-template.md`, `references/carbon-anti-patterns.md`, and the analyze command's detection passes still align
5. Produce a Sync Impact Report listing: version change, modified principles, files updated, follow-up TODOs
6. Write the updated constitution back to `memory/constitution.md`
7. Output a commit message: `docs: amend constitution to vX.Y.Z ([summary of change])`

**Conflict rule:** When a spec or design element conflicts with a MUST, the spec changes.
The constitution does not bend. If a principle needs revision, do it explicitly via `/constitution`.

---

## `/specify` — FRS + Mockup + Preview Generation

Guided three-stage workflow to produce a complete FRS + React mockup + visual HTML preview.

### Stage 1: Context Gathering

Run `/clarify` first if the request has ambiguous scope (see taxonomy above).

Invite a context dump: ask the user to brain-dump everything they know — pain points, data fields, existing workarounds, regulatory constraints, reference artifacts (Excel, paper forms, screenshots). Then ask 5–8 gap-filling questions.

### Stage 2: Design Brief (required before any JSX)

Constitution Principle 7 mandates this. Commit in writing to:
- **Purpose:** What workflow problem does this UI solve?
- **Primary user action:** Single most important thing a user does
- **Layout pattern:** Admin config table / Workbench + sidebar / Dashboard / Wizard / Inline editor
- **Interaction model:** Inline expansion / Collapsible sections / Tabs
- **Scope boundary:** What explicitly does NOT appear
- **Carbon components:** List the 4–6 primary components before writing code

Share the brief. Adjust on feedback. Then produce the deliverables.

### Stage 3: Three Deliverables

Always produce all three together unless the user explicitly asks for only some.

**FRS structure:** See `references/frs-template.md` — 12 sections including mandatory Localization table. Always include a **User Stories** section listing 2–5 "As a [role], I want to [action] so that [outcome]" statements that frame the feature from the user's perspective. Place it after the Overview and before Functional Requirements.

**Mockup:** See React/Carbon Patterns section below. Save as `[feature-name]-mockup.jsx`.

**Jira story:** See `references/jira-template.md` — rich markdown with traced acceptance criteria.
**⚠ Do not create the Jira story until Casey has explicitly approved both the FRS and the mockup.**
After delivering the FRS and mockup, ask: *"Happy with the FRS and mockup? I'll hold off on the Jira story until you give the green light."*

Once Casey approves, gather Jira metadata before writing the story. Ask these **three questions, one at a time**, with suggestions drawn from the feature context and patterns seen in previous stories:

1. **Epic** — Suggest the most likely Epic based on feature domain (e.g. OGC-527 for Environmental/Vector, OGC-354 for Sample Collection, OGC-517 for Results). Ask Casey to confirm or override.

2. **Labels/Tags** — Suggest a tag set. Labels typically combine:
   - A **country/deployment context** (e.g. `Madagascar`, `Indonesia`, `global`)
   - A **domain attribute** (e.g. `vector`, `environmental`, `blood-bank`, `clinical`)
   - Any **compliance or program tag** relevant to the spec (e.g. `iso-15189`, `SILNAS`, `iso-17025`)
   Present 3–5 suggested labels and ask Casey to confirm, remove, or add any.

3. **Assignee (optional)** — Ask if Casey wants to assign to a specific developer, or leave unassigned. If the feature domain matches a known contributor pattern (e.g. Piotr for front-end Carbon components), note the suggestion but don't assume.

Only after all three are answered, write the full Jira story with those values populated.

**Visual preview — required every time:** After writing the JSX mockup, always produce a
`[feature-name]-preview.html` file. The JSX file is the implementation artifact; the preview
is what lets the user **see the design right now** without any build step. Save it to the
workspace folder and share a `computer://` link right away in your reply. See the HTML
Preview Pattern section below.

---

## `/analyze` — Cross-Artifact Consistency Report

**Purpose:** Non-destructive quality scan across FRS, mockup, and Jira story after `/specify`.
Constitution violations are automatically CRITICAL.

**Detection passes:**

**A. i18n Compliance** (Constitution Principle 1)
- Every visible JSX string wrapped in `t(key, fallback)`?
- Every key named with correct `[category].[feature].[identifier]` convention?
- Every key present in FRS Localization table?

**B. Carbon Fidelity** (Constitution Principle 2)
- Status indicators using Carbon `Tag` with correct `kind`?
- `DataTable` used for all tabular data?
- No hardcoded colors or magic spacing values?
- No Bootstrap/Tailwind/external CSS classes?
- Built-in Carbon validation props used (not custom error divs)?
- See `references/carbon-anti-patterns.md` for full catalog

**C. Interaction Pattern Consistency** (Constitution Principle 3)
- Edit forms using inline row expansion (not modals)?
- Modals used only for destructive confirmations or 5+ section forms?
- `Accordion` used for optional/advanced config?

**D. Constitution Alignment** (Principles 1–7)
- Any requirement or design element conflicting with a MUST?
- Missing permission keys on write operations (Principle 4)?
- Design brief produced before code (Principle 7)?

**E. Coverage Gaps**
- Every FRS requirement has a corresponding UI element in mockup?
- Every UI element in mockup traces to a requirement?
- Every Jira acceptance criterion traces to an FRS requirement?

**F. Cross-Module Harmonization**
- Shared concepts (resistance status, QC badges, validation levels) rendered identically to existing modules?
- Terminology consistent across FRS, mockup, and Jira story?
- Data entities referenced in mockup present in FRS Data Model?

**Severity assignment:**

| Severity | Criteria |
|---|---|
| **CRITICAL** | Violates a constitution MUST, or requirement with zero coverage blocking core functionality |
| **HIGH** | Conflicting requirements, missing permission enforcement, untestable acceptance criterion |
| **MEDIUM** | Terminology drift, missing non-functional coverage, underspecified edge case |
| **LOW** | Wording improvement, minor redundancy, polish |

**Output format:**
```markdown
## Spec Analysis: [Feature Name]

### Summary
[2–3 sentences on overall quality and top issues]

### Findings

| ID | Pass | Location | Issue | Severity | Fix |
|---|---|---|---|---|---|
| F-01 | i18n | ResultTable | 'Susceptible' hardcoded | CRITICAL | t('label.ast.susceptible', 'Susceptible') |
| F-02 | Carbon | EditForm | Modal used for 5-field edit | HIGH | Replace with inline row expansion |

### Constitution Violations
[List any CRITICAL findings that violate a MUST — these block delivery]

### Recommended Fix Order
1. [All CRITICAL items — must fix before proceeding]
2. [HIGH items]
3. [MEDIUM / LOW items]
```

After the report, offer to apply all CRITICAL fixes immediately, then HIGH fixes in a second pass.

---

## `/checklist` — Requirements Quality Gate

**Purpose:** Generate a domain-specific checklist that functions as **"unit tests for English"** —
validating that the FRS is well-written, complete, and unambiguous, before a Jira story is created
and implementation begins. This is NOT a QA/testing checklist.

**Checklist items validate requirements quality:**
- ✅ "Are error state requirements defined for all form fields?" (completeness)
- ✅ "Is 'fast load' quantified with a specific latency target?" (clarity)
- ✅ "Are permission states consistent across all sections?" (consistency)
- ✅ "Does the spec define behavior when [edge case] occurs?" (coverage)

**NOT:**
- ❌ "Verify the button clicks correctly" — that's QA testing
- ❌ "Confirm the API returns 200" — that's integration testing
- ❌ "Check that validation messages appear" — that's functional testing

**Generation process:**
1. Read the FRS and extract feature domain keywords (auth, results, AMR, validation, reporting, analyzer, admin…)
2. Derive up to 3 clarifying questions about checklist scope:
   - Depth: lightweight pre-spec sanity vs formal release gate?
   - Audience: author self-check, peer review, or QA handoff?
   - Risk areas: which domains need mandatory gating checks?
3. Generate 15–30 checklist items organized by category. Use domain signals from the FRS.
4. For OpenELIS features, always include these mandatory categories:

**Mandatory checklist categories for OpenELIS:**

```markdown
### i18n / Localization
- [ ] Are all UI strings represented in the Localization section with i18n keys?
- [ ] Are error messages, button labels, placeholders, and headings all covered?
- [ ] Are all i18n keys named consistently ([category].[feature].[identifier])?

### Permissions & Security
- [ ] Is a permission key defined for every write action?
- [ ] Is UI-layer enforcement (hide/disable) specified for each permission?
- [ ] Is API-layer enforcement (HTTP 403) specified for each permission?

### Carbon Design System
- [ ] Are all status indicators mapped to Carbon Tag kinds?
- [ ] Is inline row expansion used for edit forms (not modals)?
- [ ] Is the admin table column pattern followed if this is a config page?

### Acceptance Criteria Quality
- [ ] Are all acceptance criteria testable (observable, specific, falsifiable)?
- [ ] Does each criterion trace to a functional requirement?
- [ ] Are edge cases and error paths included, not just happy path?

### FRS–Mockup Alignment
- [ ] Does every requirement have a corresponding UI element?
- [ ] Does every UI element trace to a requirement?
- [ ] Are all data model fields visible in the mockup?
```

---

## React + Carbon Mockup Patterns

### Standard Import Block

```jsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack, SideNav, SideNavItems, SideNavMenuItem, SideNavMenu,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Checkbox, RadioButton, RadioButtonGroup, DatePicker, DatePickerInput, MultiSelect,
  Button, IconButton, InlineNotification, Tag, Modal, Loading, Accordion, AccordionItem,
  Tile, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem,
} from '@carbon/react';
import { Add, Edit, TrashCan, ChevronDown, ChevronUp, Download, Save, Renew } from '@carbon/icons-react';
```

### i18n Helper (top of every component)

```jsx
const t = (key, fallback) => fallback || key;
```

### Status Badge Mapping (Carbon Tag kinds)

| Status | kind |
|---|---|
| Susceptible / Positive / Pass | `green` |
| Resistant / Fail / Critical | `red` |
| Intermediate / Borderline | `warm-gray` |
| In Progress / Draft | `blue` |
| Pending / In Queue | `purple` |
| QC Pass / Verified | `teal` |
| Unknown / Indeterminate | `gray` |

### Inline Row Expansion Pattern

```jsx
const [expandedRow, setExpandedRow] = useState(null);
const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

// In table body:
<TableRow key={row.id}>
  <TableCell>
    <Button kind="ghost" size="sm" onClick={() => toggleRow(row.id)}
      renderIcon={expandedRow === row.id ? ChevronUp : ChevronDown}>
      {t('button.edit', 'Edit')}
    </Button>
  </TableCell>
</TableRow>
{expandedRow === row.id && (
  <TableRow>
    <TableCell colSpan={headers.length + 1}>
      <Tile style={{ padding: '1rem' }}>
        <Grid><Column lg={8}><TextInput ... /></Column></Grid>
        <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
          <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
          <Button kind="ghost" size="sm" onClick={() => setExpandedRow(null)}>{t('button.cancel', 'Cancel')}</Button>
        </Stack>
      </Tile>
    </TableCell>
  </TableRow>
)}
```

---

## HTML Preview Pattern

The JSX mockup is the implementation artifact. The HTML preview is what lets the user
**see the design right now** — no Node.js, no npm install, no build pipeline. Open it
in any browser and it renders immediately.

The reason a dedicated preview is needed: `@carbon/react` is an npm package, not
available on CDN. The preview instead uses CDN-hosted React + Babel + Carbon CSS, and
builds the UI using Carbon CSS classes directly on plain JSX elements. The visual result
is near-identical — same typography, same color tokens, same spacing, same look.

### CDN resources to load

```html
<!-- Carbon Design System CSS — same visual tokens as @carbon/react -->
<link rel="stylesheet" href="https://unpkg.com/@carbon/styles@1/css/styles.min.css">

<!-- React + ReactDOM -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" crossorigin></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" crossorigin></script>

<!-- Babel standalone — transpiles JSX in the browser, no build step needed -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
```

Write all component code inside `<script type="text/babel">`.

### Carbon CSS class mappings

These classes produce the same visual output as their @carbon/react counterparts:

| @carbon/react component | CSS class(es) for preview |
|---|---|
| `<Tile>` | `cds--tile` |
| `<Button kind="primary">` | `cds--btn cds--btn--primary` |
| `<Button kind="secondary">` | `cds--btn cds--btn--secondary` |
| `<Button kind="ghost">` | `cds--btn cds--btn--ghost` |
| `<Button kind="danger">` | `cds--btn cds--btn--danger` |
| `<Tag kind="green">` | `cds--tag cds--tag--green` |
| `<Tag kind="red">` | `cds--tag cds--tag--red` |
| `<Tag kind="blue">` | `cds--tag cds--tag--blue` |
| `<Tag kind="purple">` | `cds--tag cds--tag--purple` |
| `<Tag kind="warm-gray">` | `cds--tag cds--tag--warm-gray` |
| `<Tag kind="teal">` | `cds--tag cds--tag--teal` |
| `<Tag kind="gray">` | `cds--tag cds--tag--gray` |
| `<DataTable>` + `<Table>` | `<div class="cds--data-table-container"><table class="cds--data-table">` |
| `<TableHead>` / `<TableHeader>` | `<thead>` / `<th>` |
| `<TableBody>` / `<TableRow>` / `<TableCell>` | `<tbody>` / `<tr>` / `<td>` |
| `<InlineNotification kind="error">` | `cds--inline-notification cds--inline-notification--error` |
| `<InlineNotification kind="success">` | `cds--inline-notification cds--inline-notification--success` |
| `<InlineNotification kind="info">` | `cds--inline-notification cds--inline-notification--info` |
| `<Select>` | `<div class="cds--select"><select class="cds--select-input">` |
| `<Accordion>` | `<ul class="cds--accordion">` |
| `<TextInput>` | `<div class="cds--text-input-wrapper"><input class="cds--text-input">` |

Carbon spacing variables work in inline styles since the stylesheet is loaded:
`style={{ padding: 'var(--cds-spacing-05)' }}` etc.

### Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Feature Name] — OpenELIS Preview</title>
  <link rel="stylesheet" href="https://unpkg.com/@carbon/styles@1/css/styles.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
  <style>
    body { background: #f4f4f4; margin: 0; font-family: 'IBM Plex Sans', sans-serif; }
    .preview-banner {
      background: #0f62fe; color: #fff;
      padding: 6px 1rem; font-size: 12px; font-family: monospace;
    }
    .preview-content { padding: 1rem 2rem; max-width: 1440px; margin: 0 auto; }
  </style>
</head>
<body class="cds--white">
  <div class="preview-banner">
    ⚡ Visual Preview — [Feature Name] &nbsp;|&nbsp; OpenELIS Design Mockup &nbsp;|&nbsp; Not a live application
  </div>
  <div class="preview-content" id="root"></div>
  <script type="text/babel">
    const { useState } = React;

    // Realistic mock data — use real lab names, section names, plausible numbers
    // Build component using Carbon CSS classes from the mapping table above

    function App() {
      return (
        <div>
          {/* your layout here */}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
```

### Tips for a good preview

**Use realistic data.** Don't write "Item 1" or "Section A". Use actual lab section names
(Hematology, Microbiology, Chemistry), realistic test names, and plausible numbers. The
preview should look like a screenshot from a real deployment — that's what helps the user
evaluate whether the design works for their lab.

**Implement interactivity.** Use `useState` for tabs, accordions, section filters, and
expandable rows. A static HTML page doesn't convey the interaction model; a page where
tabs actually switch and filters actually update is much more useful feedback.

**Match the Design Brief layout.** The layout pattern committed in Stage 2 (Dashboard /
Admin table / Workbench / Wizard) should be immediately visually recognizable in the
preview. Don't drift from the brief.

**Share the link right away.** After saving the file to the workspace folder, include the
`computer://` link in your reply so the user can open it immediately without hunting for it.

---

## Reference Files

| File | When to read |
|---|---|
| `memory/constitution.md` | **Always first** — non-negotiable design governance |
| `references/frs-template.md` | When writing any FRS document |
| `references/jira-template.md` | When creating any Jira story |
| `references/carbon-anti-patterns.md` | During `/analyze` Carbon fidelity pass, or self-critique before delivery |
| `references/module-inventory.md` | When a feature touches an existing module — check pattern and Jira key |
