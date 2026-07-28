# Constitution Amendment Draft — Principle II expansion: Style Guide Library

> **Prepared:** 2026-07-28 · **Proposer:** Casey Iiams-Hauser · **Type:** MINOR (materially expanded guidance)
> **Process:** per Amendment Process — open a GitHub issue with the `constitution-amendment` label using §5 below, discuss at the weekly architecture sync, merge on consensus.
> **Version note:** footer currently reads 1.9.1 but the newest SYNC IMPACT REPORT (Principle X, 2026-04-06) declares 1.10.0 — reconcile first, then this amendment lands as **1.11.0**.

---

## 1. Amended Principle II text (replaces the current Principle II block)

### II. Carbon Design System First

**MANDATE** (Effective August 2024; expanded July 2026): All new UI components MUST use Carbon
Design System exclusively. NO custom CSS frameworks, NO Bootstrap, NO Tailwind.
Where OpenELIS diverges from, extends, or constrains Carbon, the **OpenELIS Style
Guide** is binding; where the Style Guide is silent, Carbon upstream documentation
governs — do not invent local variants.

**Rules**:

- Use `@carbon/react` v1.15+ components exclusively for new features. Confirm a
  component or prop exists in the pinned version before using it — live Carbon
  docs run ahead of the shipped stack (React 17, `@carbon/react` 1.15 line).
- Styling via Carbon tokens (`$spacing-*`, `$text-*`, `$layer-*`) ONLY
- Typography: IBM Plex Sans (Carbon default) - NO custom fonts without
  justification
- Layout: Carbon Grid + Column system - NO flexbox/grid outside Carbon patterns
- Icons: `@carbon/icons-react` v11.17+ - NO custom icon libraries
- Customize via Carbon theme tokens, NOT custom CSS overrides
- **Consult the Style Guide Library before building any listed component or
  pattern** (data tables, pagination, dates, forms, search/filters, empty states,
  tags, icons, wizards, navigation, page shell, slide-overs, dashboard tiles,
  workplan grids, referral queues, barcode inputs, reports). Its Divergences,
  Extensions, and Pins are binding for new code.
- **New divergences from Carbon require a Style Guide entry ratified through
  design review** before merge — a PR may not introduce one ad hoc.
- Entries badged 🔶 (pending ratification) are the default for new code until
  ratified or overturned; entries badged 🟡 (provisional) may be firmed up via
  the same design-review path.

**Rationale**: Strategic adoption of Carbon ensures UI/UX consistency,
accessibility (WCAG 2.1 AA), and alignment with modern design systems used by
major healthcare platforms. Ad-hoc styling creates maintenance debt and
accessibility failures. The Style Guide records the small, deliberate set of
OpenELIS deltas so that neither humans nor AI agents re-litigate them or
re-document Carbon.

**Migration**: Legacy components may use older frameworks until refactored. New
features have NO exemption. The legacy JSP UI is outside Style Guide scope
(styling-frozen; see the Style Guide's Legacy JSP boundary page).

**Reference**:
[Style Guide — v1 Foundations](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/621346838) (tokens, typography, color, voice & tone) ·
[Style Guide — v2 Component Usage library](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/1514864643) (per-component Divergences/Extensions/Pins + ratification register) ·
Machine-readable mirror: `.specify/guides/style-guide-component-usage.md` (this repo)

---

## 2. Compliance Verification — PR Review Checklist additions

Add to the existing `**PR Review Checklist**: Reviewers MUST confirm:` list:

- [ ] Style Guide Library consulted for any component/pattern it covers; no unratified divergence from Carbon introduced (Principle II)

---

## 3. Claude Code / agent consumption wiring

Per the house convention (every amendment mirrors into AGENTS.md + CLAUDE.md, with detail delegated to `.specify/guides/`):

**a. Commit the machine-readable mirror into this repo** as
`.specify/guides/style-guide-component-usage.md` (single-file markdown; source maintained alongside the Confluence library; update both in the same change). This is the copy Claude Code and other agents actually load — agents cannot fetch Confluence.

**b. AGENTS.md** — add to the principle summaries:

> **Principle II (expanded):** Carbon by default; the OpenELIS Style Guide is binding where it diverges/extends/pins Carbon. Before building any UI component or pattern, read `.specify/guides/style-guide-component-usage.md`. Never introduce a new divergence from Carbon without a ratified style-guide entry. Confirm components exist in the pinned `@carbon/react` version (React 17-era 1.15 line) before using live-doc features.

**c. CLAUDE.md** — add to the checklist:

> - Before any frontend work: read `.specify/guides/style-guide-component-usage.md`. Follow Carbon upstream for anything it doesn't cover. Its 🔶 items are defaults pending ratification — do not "fix" them in the opposite direction.

**d. CONTRIBUTING.md** — add one line under "How to Contribute":

> - **UI style rules:** see the [OpenELIS Style Guide](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/1514864643) (mirrored for agents at `.specify/guides/style-guide-component-usage.md`) — Carbon by default, documented deltas binding.

---

## 4. SYNC IMPACT REPORT block (paste at top of constitution.md)

```
SYNC IMPACT REPORT - Principle II: Style Guide Library (expansion)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Version Change: 1.10.0 → 1.11.0
Change Type: MINOR - Materially expanded guidance (Principle II)
Date: 2026-07-XX
Added Sections:
* Principle II: Style Guide Library binding-delta rule, version-pin rule,
  no-ad-hoc-divergence rule, 🔶/🟡 badge semantics
* Compliance Verification: Style Guide checklist item
Rationale: The v2 Component Usage library (Confluence, OG space) now codifies
where OpenELIS diverges from / extends / pins Carbon, with an evidence-backed
ratification register. Binding it into Principle II prevents pattern
re-litigation by contributors and AI agents and gives PR review an objective
reference.
Templates Requiring Updates:
⚠️ AGENTS.md - Add Principle II expansion summary
⚠️ CLAUDE.md - Add style-guide checklist item
⚠️ CONTRIBUTING.md - Add style-guide pointer
✅ .specify/guides/style-guide-component-usage.md - NEW: machine-readable mirror
Follow-up TODOs:
* Reconcile footer version (reads 1.9.1; Principle X report declares 1.10.0)
* Ratify open register items R1/R2/R5/R8 + slide-over radius (#digi-devs poll)
```

---

## 5. GitHub issue body (label: `constitution-amendment`)

**Title:** Constitution amendment: expand Principle II to bind the OpenELIS Style Guide Library

**Rationale.** Principle II mandates Carbon but doesn't say what governs where OpenELIS legitimately differs. That gap is where drift comes from: the Stage 2A walkthrough logged 214 drift findings, and codebase evidence passes (2026-07-28) confirmed structural symptoms — ~50 files with six different pagination defaults, four inconsistent date-locale ternaries, two table libraries, a copy-pasted report dispatcher wiring one report to the wrong output. The new [Style Guide v2 Component Usage library](https://uwdigi.atlassian.net/wiki/spaces/oeg/pages/1514864643) codifies the deltas (Divergences / Extensions / Pins per component, evidence appendix, ratification register). This amendment makes it binding and wires it into agent guidance.

**Impact analysis.** New code only; no retroactive obligation (existing violations tracked as cleanup per the register). Adds one PR-review checklist item. Adds a repo-mirrored markdown file agents load. No build/tooling changes.

**Migration plan.** (1) Merge mirror file + AGENTS.md/CLAUDE.md/CONTRIBUTING.md lines with the amendment PR. (2) Open register items (R1, R2, R5, R8, slide-over radius) proceed through the #digi-devs poll / dev call already drafted; outcomes recorded in the register. (3) Optional follow-up: ESLint enforcement (ban `react-data-table-component`, `bx--` imports, raw hex) as a separate PR.

**Approval:** architecture review team, weekly sync, consensus per Amendment Process.
