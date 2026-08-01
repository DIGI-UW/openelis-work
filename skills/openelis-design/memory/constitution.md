# OpenELIS Global Engineering Constitution — Pointer

> **This file is a pointer, not a mirror.** The canonical engineering constitution lives
> in the OpenELIS Global source repo and is the single source of truth. This skill
> summarizes only the design-relevant parts and links back so the full document can never
> silently drift from a stale local copy.

## Canonical source

- **Repo:** `DIGI-UW/OpenELIS-Global-2`
- **Path:** `.specify/memory/constitution.md` (branch: `develop`)
- **Raw URL:** https://raw.githubusercontent.com/DIGI-UW/OpenELIS-Global-2/develop/.specify/memory/constitution.md
- **Web view:** https://github.com/DIGI-UW/OpenELIS-Global-2/blob/develop/.specify/memory/constitution.md

**Synced version:** `1.11.0` (Principle VII: i18n Key Reuse & Hygiene, amended 2026-07-15)
**Last synced into this skill:** 2026-08-01
**Last verified against upstream:** 2026-08-01 — upstream footer now reads
`**Version**: 1.11.0 | **Ratified**: 2025-10-30 | **Last Amended**: 2026-07-15`. The
re-sync trigger **fired** this cycle (upstream 1.11.0 > previously-synced 1.10.0) and the
pointer has been resynced. ✅ The July 2026 label discrepancy (footer showing 1.9.1 while
this pointer recorded 1.10.0) is **resolved** — upstream has since caught its own footer up;
no reconciliation with the repo owners is needed.

⚠ Upstream housekeeping gap (not ours to fix, but don't be confused by it): the
"Ratification Signatories" comment block at the foot of the upstream document still stops at
**Amendment v1.9.1** — the v1.10.0 (Principle X) and v1.11.0 (Principle VII i18n) amendments
were never added to that list. Read the `**Version**` line, not the amendment log.

> ⚠️ **Re-sync trigger:** Before relying on this summary in `/analyze` or `/specify`, check
> the raw URL's version header. If upstream is newer than the "Synced version" above,
> re-read the upstream constitution, update this pointer (version + date + any changed
> design-relevant principles), and reconcile `design-addendum.md` against it. Do not edit
> the upstream constitution from this skill — propose changes via the repo's amendment
> process (see its Governance section).

## Constitution structure (upstream, v1.11.0)

Ten Core Principles, followed by Technical Stack Constraints, Development Workflow, and
Governance. The principles are:

| # | Principle | Design relevance |
|---|---|---|
| I | Configuration-Driven Variation | HIGH — features vary by config/lookup data, not forks |
| II | **Carbon Design System First** | **CRITICAL — the basis for `references/carbon-anti-patterns.md`** |
| III | FHIR/IHE Standards Compliance | MED — referrals are FHIR, not multitenancy |
| IV | Layered Architecture Pattern | LOW (backend) — informs Dependencies declarations |
| V | Test-Driven Development | LOW (design) |
| VI | Database Schema Management | MED — informs Envers/audit declarations |
| VII | **Internationalization First** (+ Key Reuse & Hygiene, v1.11.0) | **CRITICAL — every visible string needs an i18n key, and the key must be REUSED where one exists. See the section below.** |
| VIII | Security & Compliance | HIGH — role bundles, audit_trail |
| IX | Spec-Driven Iteration | HIGH — this skill's whole workflow |
| X | Legacy Code Removal (2026-04-06) | MED — don't design dual-write/legacy-first paths |

## Principle II — Carbon Design System First (verbatim mandate, for quick reference)

> **MANDATE** (Effective August 2024): All new UI components MUST use Carbon Design System
> exclusively. NO custom CSS frameworks, NO Bootstrap, NO Tailwind.

Rules (upstream):
- `@carbon/react` v1.15+ components exclusively for new features
- Styling via Carbon tokens (`$spacing-*`, `$text-*`, `$layer-*`) ONLY
- Typography: IBM Plex Sans (Carbon default) — no custom fonts without justification
- Layout: Carbon Grid + Column — no flexbox/grid outside Carbon patterns
- Icons: `@carbon/icons-react` v11.17+ — no custom icon libraries
- Customize via Carbon theme tokens, NOT custom CSS overrides

Upstream reference: OpenELIS Carbon Design Guide —
https://uwdigi.atlassian.net/wiki/spaces/OG/pages/621346838

`references/carbon-anti-patterns.md` operationalizes this principle into the concrete
"don't do this → do this" catalog used during `/analyze` Pass B.

## Principle VII — i18n Key Reuse & Hygiene (NEW in v1.11.0, 2026-07-15)

Added upstream in commit `496c910` after an audit of `develop` found `en.json` had grown
**2,385 → 7,133 keys** between January and July 2026, of which:
- **~25% duplicate an existing English value** — 56× "Status", 34× "Active", 28× "Cancel";
- **~35% are orphans**, referenced nowhere in `frontend/src`;
- **386 ids** are referenced at react-intl call sites but **missing from `en.json`**.

Every redundant key multiplies into roughly **20 locales of Transifex translator work**.

The mandate (now constitutional, not merely a skill convention):
- **Search before minting** a key (`i18n:find`).
- **`common.*` canonical keys** for generic UI strings.
- **No cross-feature key references** — if a second feature needs the string, promote it to
  `common.*` rather than reaching into another feature's namespace.
- Context-driven exceptions go in a **committed allowlist**.
- Dynamic key families are declared with an **`i18n-keys` pragma**.
- **Referenced ids must exist.**
- A **CI ratchet** on duplicate/orphan counts.
- Consolidating existing keys requires a **translation-preserving Transifex migration**
  (add new keys → API-copy translations → codemod → delete old) — never a bare rename.

**What this means for design work.** This elevates decision **D-044** (reuse-first
Localization tables, `/analyze` Pass Q) from a house rule to a constitutional requirement:
a spec that mints a near-synonym key is now a **CRITICAL** finding, not a nit. The
`openelis-ui-vocabulary` skill is the operational tool for this — compose UI strings from
existing `common.*` keys and mark every row of the FRS Localization table Reuse vs New with
a justification for each New. Note also that "referenced ids must exist" cuts the other way:
a spec that cites an i18n key must cite one that is really in `en.json`.

## Design-specific additions

The MUSTs this skill enforces that are *not* (yet) in the upstream constitution — the
No-Hard-Delete and Design-for-Large-Catalogs principles, data-reuse, no-multitenancy,
shipped-app-as-style-source — live in `memory/design-addendum.md`. They are candidates to
upstream via the repo's amendment process; until then the addendum is this skill's
authority and `/analyze` treats addendum MUST violations as CRITICAL.
