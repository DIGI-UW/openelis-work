# OGC Lean Jira Workflow (LIVE)

> Live in the OGC project since 2026-06 (company-managed Jira Cloud). This **replaces** the
> old "reorg proposal — not yet applied" note. Apply these by default when running
> `/breakdown`, creating epics/stories, or reporting. Companion: `jira-conventions.md`.

## The flow
`Backlog → Ready → In Progress → In Review → Acceptance → Done`, with **Icebox** as a parallel
parking lane for uncommitted / unfunded work. Every work type uses this one workflow.

- **Icebox** — parked ideas / fully-scoped-but-unfunded work. Excluded from sprint planning and
  hygiene filters. Park whole unfunded trees here.
- **Backlog** — committed but not yet groomed.
- **Ready** — groomed & sprintable today (acceptance criteria + estimate + design link).
- **In Progress** — actively being built.
- **In Review** — PR open / under code review.
- **Acceptance** — merged and deployed to `testing.openelis-global.org`; the product owner
  (Casey or the Component lead) verifies as a user against the acceptance criteria.
- **Done** — accepted; all sub-tasks closed; Fix Version set.

## The Acceptance gate (the key change)
- **Approve** transition (Acceptance → Done): blocked by a validator until **all sub-tasks are
  Done**.
- **Reject** transition (Acceptance → In Progress): shows a screen prompting for a rejection
  comment, and a **Reject Count** number field (`customfield_10611`) auto-increments via
  automation. Stories that bounce 3+ times signal an ambiguous spec, not a bad implementation.

## Fields
- **Contract** (`customfield_10644`, single-select): SILNAS Indonesia · CPHL PNG ·
  DIGI-UW / I-TECH · Madagascar e-SIL · Haiti. Set **exactly one** on every *active* issue
  (Icebox-parked work is exempt). This is the new home for contract attribution — it replaces
  the old `contract:*` labels. Country/domain/program labels still apply (see `jira-conventions.md`).
- **Docs N/A** (`customfield_10677`, checkbox "Docs not needed"): the documentation escape hatch.

## Documentation is per-Epic, not per-Story
Docs correspond to features/mockups, and **one Epic ≈ one mockup**. So documentation lives at
the **Epic** level: a **Feature Doc** child issue is (will be) auto-created under an Epic when the
Epic enters **In Review** (deployed, so there's something real to document). Tick **Docs N/A** on a
Feature Doc to skip docs for trivial work. **Stories, Bugs, Tasks, and Tech Debt never get docs.**
(The Epic-level auto-create + auto-close automation is staged but not yet enabled — confirm with
Casey before assuming it fires.)

## What this means for /breakdown and ticket creation
- New **Epics** = one per mockup/feature; expect a Feature Doc child once In Review is reached.
- New **Stories**: land in Backlog; promote to Ready only when groomed; they pass through the
  Acceptance gate before Done. Don't add doc sub-tasks to Stories.
- Set the **Contract** field on every active issue you create.
- "Done" still ≠ shipped — but the Acceptance gate now makes Done a stronger signal (it means a
  human verified it on the test instance). Still confirm with Casey for stakeholder reporting.

## Saved hygiene filters (publishable)
- "OGC: Acceptance items >7 days old" (filter 10380) — target < 5.
- "OGC: Unowned Backlog >30 days" (filter 10381) — target < 20.
