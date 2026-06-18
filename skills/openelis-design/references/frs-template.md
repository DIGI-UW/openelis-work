# FRS Template

> Used by `/specify`. Copy this structure for every Functional Requirements Spec. The FRS
> is **version-agnostic** — describe the full feature; version slicing happens in
> `/breakdown`, not here.

---

## Lab Context *(MUST — first section, before Overview)*

Plain English for a developer who has never set foot in a clinical lab. No unexplained
jargon (expand every acronym on first use), no cross-references to other FRS sections, no
vague adjectives in place of concrete examples. A backend dev should read this in under 90
seconds and understand both what they're building and why.

### Current State
How the lab handles this workflow today — tools, paper forms, spreadsheets, instrument
printouts, workarounds. Who does it (role), when, how often.

### Pain
Specifically what is slow, error-prone, unsafe, or frustrating. Concrete examples, not
"inefficient"/"suboptimal".

### What Changes
What the lab's day looks like once this ships — the workflow shift, not "implements X".

---

## Overview

1–2 paragraphs. What the feature is and the value it delivers.

### Navigation & URL
- **SideNav placement:** `Admin → <Group> → <Page>` (sibling order noted)
- **Breadcrumb:** `Home / Admin / <Group> / <Page>`
- **URL route:** `` `/MasterListsPage?type=<editorKey>` `` (must match an existing pattern; verify against the live app)

---

## User Stories

2–5 statements: *As a [role], I want to [action] so that [outcome].*

---

## Functional Requirements

Numbered, testable requirements (FR-1, FR-2, …). Each is observable and falsifiable.
Include happy path + error/empty/loading states.

| ID | Requirement | Notes |
|---|---|---|
| FR-1 | … | … |

---

## Data Model

Entities, attributes, lifecycle/state transitions, uniqueness rules. **Every field here
must trace to a real OpenELIS entity** (design-addendum MUST A). New data goes in
Dependencies, not invented here.

---

## Permissions & Audit

- **Role attachment:** which existing role bundle(s) grant access (no invented per-action keys)
- **Roles Builder additions:** new module-level grant (label + i18n key + default assignments + placement) or "None — via existing `[Role]` bundle"
- **Audit events:** per state-changing action — verb, target entity type/id, payload summary, actor
- **Envers coverage:** per new entity — `@Audited` yes/no + rationale

See `references/permissions-and-audit.md`.

---

## Localization

Every visible string with an i18n key, named `[category].[feature].[identifier]`.

| Key | English fallback | Context |
|---|---|---|
| `label.<feature>.<id>` | … | … |

---

## Dependencies

New entities/attributes/services this feature needs that don't exist yet. Name each one
explicitly. Also note required feature flags and any not-yet-built upstream pieces (cross-
check `references/current-state-gotchas.md`).

---

## Out of Scope

What this feature explicitly does NOT do. (Anything declared out of scope here must also be
absent from the mockup/preview — no stubs.)
