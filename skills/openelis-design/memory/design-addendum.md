# OpenELIS Design Addendum

> Skill-specific design MUSTs that `/specify` and `/analyze` enforce. These extend the
> upstream engineering constitution (see `memory/constitution.md`) with design/UX rules
> that aren't yet codified upstream. **Addendum MUST violations are CRITICAL findings in
> `/analyze`.** Each is a candidate to upstream via the repo's amendment process; until
> then this addendum is the skill's authority.

This file consolidates rules that previously lived (a) embedded in the middle of the
`/analyze` command in SKILL.md as a "Constitution Amendment (proposed)" block, and
(b) only in working memory. They are gathered here so there is one authority.

---

## MUST A — Reuse existing data; never invent domain concepts

Every form field, table column, badge, filter, and dropdown option in a mockup MUST trace
to a real OpenELIS entity/attribute. Where new data is genuinely needed, it MUST be
declared in the FRS **Dependencies** section as a named entity/attribute — never silently
introduced in the mockup.

- Auto-CRITICAL (`/analyze` Pass G): any unflagged invented field, enum, or attribute.
- Rationale: a plausible-looking but non-existent field produces specs devs can't build and
  data models that don't match the schema.

## MUST B — No multitenancy

OpenELIS is single-tenant per deployment. Designs MUST NOT include a "Lab selector",
"Site:" filter, "Tenant:" dropdown, or any cross-organization view.

- Referral relationships (a sample sent to an external lab) are **FHIR referrals**, not
  multitenancy — those are fine and expected.
- Auto-CRITICAL (`/analyze` Pass H): any multitenancy UI element or FRS language implying
  multiple labs share one deployment.

## MUST C — Shipped app is the style source of truth

For style guides, token tables, component patterns, IA, and URL conventions, derive from
the **live shipped app** (testing/demo instances + the repo), not from Figma comps or
memory. Figma is exploratory; the running app is canonical.

- Verify routes/IA against `https://testing.openelis-global.org` and the 28-URL admin
  inventory before declaring them.

## MUST D — Preserve, don't delete (No Hard Delete)

Domain records in a LIMS are never destroyed; they are deactivated and can be reactivated.

- Designs MUST NOT offer a hard "Delete" for domain records (analyzers, analyzer
  types/profiles, tests, organizations, providers, results, configurations, lookups, etc.).
  They MUST offer **Deactivate / Reactivate** (or Retire/Archive where the domain uses that
  word).
- Lists of such records MUST default to **hiding deactivated** entries, with an explicit
  **"Show deactivated"** toggle.
- Rationale: clinical/lab data carries audit, traceability, and accreditation obligations
  (ISO 15189); deleting breaks referential history and result provenance. The shipped app
  already reflects this (Master List pages, Analyzer Types, External Connections use Active
  + Deactivate, not Delete).
- Narrow exception: transient, non-clinical scratch data with no audit or referential
  significance MAY be deleted, and only with explicit justification in the spec.
- `/analyze` detection (Pass D): hard "Delete" on a domain record → CRITICAL; a list of
  domain records with no show/hide-deactivated affordance → MEDIUM.

## MUST E — Design for large catalogs

Designs must scale to real deployment data volumes, especially the test catalog (assume
~500+ tests in production).

- Any picker over a large/growing set (tests, organizations, providers, panels) MUST be
  **search/typeahead** based (Carbon `ComboBox`/filterable), never a long static `Select`.
- Designs SHOULD prefer **mapping/linking to an existing record** over creating a new one.
- Designs MUST NOT embed a multi-step "create heavy entity" flow (e.g. creating a Test)
  inside another workflow; link out to the dedicated admin page, then return.
- `/analyze` detection (Pass B): static dropdown bound to a large/growing set → MEDIUM;
  inline create-flow for a heavy entity → MEDIUM.

---

## Standing UI/IA conventions (from accumulated design feedback)

These are SHOULD/MUST conventions surfaced repeatedly in review. They inform `/specify`
Stage 2 (Design Brief) and `/analyze` Pass C.

- **SideNav submenus, not in-page Tabs.** Multi-view screens nest as SideNav submenu items;
  don't use Carbon `Tabs` for top-level view switching.
- **Global admin IA buckets** are Config / Organization / Resources / Automation /
  Compliance. These are GLOBAL SideNav groupings, NOT groupings inside an individual record
  editor. Don't conflate the two.
- **Inline row expansion for edits**, not modals. Modals are reserved for destructive
  confirmations or forms with 5+ sections.
- **Inline rows for in-context additions.** Additions in an expanded panel slot in as a new
  inline row alongside existing rows (e.g. Methods, Storage); never wrap them in an
  `Accordion`. `Accordion` is for optional/advanced config only.
- **Binary admin + per-module role bundles.** OpenELIS has no per-action permission keys.
  Attach features to an existing role bundle (Reception / Analyst / Validator / Provider /
  Admin / Test Catalog Manager / EQA Provider). Don't invent granular keys like
  `results.validate` — that's an auto-CRITICAL in `/analyze` Pass J.
- **No emoji checkmarks in funder-facing / professional outputs.** Use prose, not ✅/➡️/☑.
- **Domain enum has no BOTH.** Domain is strictly CLINICAL / ENVIRONMENTAL / VECTOR
  everywhere (catalog and orders). Never propose BOTH, even as an order-level escape hatch.
- **Confirm "Done" ≠ shipped.** A Jira ticket marked Done is not proof a capability is
  live; confirm before claiming delivery in reports.

---

## Provenance

Folded in from: the embedded "Constitution Amendment (proposed)" block formerly inside the
`/analyze` section of SKILL.md (No-Hard-Delete + Design-for-Large-Catalogs), plus the
design-addendum MUSTs already referenced by `/analyze` Passes G/H, plus standing review
feedback. Consolidated 2026-06-18.
