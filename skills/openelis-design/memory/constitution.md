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

**Synced version:** `1.10.0` (Principle X: Legacy Code Removal, dated 2026-04-06)
**Last synced into this skill:** 2026-06-18

> ⚠️ **Re-sync trigger:** Before relying on this summary in `/analyze` or `/specify`, check
> the raw URL's version header. If upstream is newer than the "Synced version" above,
> re-read the upstream constitution, update this pointer (version + date + any changed
> design-relevant principles), and reconcile `design-addendum.md` against it. Do not edit
> the upstream constitution from this skill — propose changes via the repo's amendment
> process (see its Governance section).

## Constitution structure (upstream, v1.10.0)

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
| VII | Internationalization First | HIGH — every visible string needs an i18n key |
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

## Design-specific additions

The MUSTs this skill enforces that are *not* (yet) in the upstream constitution — the
No-Hard-Delete and Design-for-Large-Catalogs principles, data-reuse, no-multitenancy,
shipped-app-as-style-source — live in `memory/design-addendum.md`. They are candidates to
upstream via the repo's amendment process; until then the addendum is this skill's
authority and `/analyze` treats addendum MUST violations as CRITICAL.
