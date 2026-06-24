# Jira Conventions

> Read during `/breakdown` (and any reporting). These are recurring conventions and
> corrections — apply them by default. Complements `references/jira-template.md` (which is
> the per-issue body format).

---

## Links must be clickable
When creating or commenting on issues via the Atlassian MCP, use `contentFormat: markdown`
with `[label](url)` syntax — it renders as a real clickable link. Verify via `renderedFields`
after creating. Plain pasted URLs and ADF-escaped links often render as dead text.

## "Done" ≠ shipped
A ticket marked **Done** is not proof the capability is live in the app. Before claiming an
OGC ticket as delivered in any status report or stakeholder update, confirm with Casey (and
ideally against the running app). Example burn: OGC-173. (The new **Acceptance** gate makes Done a stronger signal — it
means a human verified the work on the test instance — but still confirm before reporting.)

## Size slices to the implementation pipeline
- **Human team:** ~20 story points / 2-week sprint, Fibonacci estimates (see `/breakdown`).
- **Claude Code (agentic):** size each slice to **one reviewable PR** — "one branch, one
  PR, one review" — not to story points. Prefer fewer, larger-but-coherent vertical slices
  (often ~5–7 where a human plan would have ~14 stories). The diff is where subtle errors
  are caught, so reviewability matters *more* with an AI implementer, not less.
- Re-slice over-granular existing breakdowns. Known offender: the AMR review workflow
  micro-module breakdown.

## Linking, not re-parenting
New mockup-Epics link to a program umbrella epic via an **"is part of"** link, not a
parent-child epic nest (Jira epic hierarchy is flat by default). Known umbrella:
OGC-899 (PNG/CPHL Phase II) is linked-not-reparented, with `PNG` / `Phase2` labels.

## Labels
Combine country/deployment (`Madagascar`, `Indonesia`, `global`, `PNG`), domain (`vector`,
`environmental`, `blood-bank`), and compliance/program (`iso-15189`, `SILNAS`, `Phase2`).
Labels go on the Epic and propagate to every child Story, plus a version label
(`v1`/`v2`/…) for sprint filtering.

**Contract attribution moved to a field.** Set the single-select
**Contract** field on every active issue (see `references/ogc-workflow.md`); the old `contract:*`
labels are retired. Country/domain/program labels above still apply.

## Writing style for funder/stakeholder-facing outputs
- **No emoji checkmarks.** Strip ✅ / ➡️ / ☑ from milestone lists in funder-facing or
  professional reports — use prose, not symbol bullets.
- Verify trip/program facts before reporting (e.g. PNG/CPHL March 2026: Casey + Jen only;
  no Sonora; no strategic-plan launch — ministry briefings + stakeholder meetings did happen).

## OGC Lean workflow — LIVE (2026-06)
The Jira reorg has shipped. OGC now runs a lean 6-state workflow
(Backlog → Ready → In Progress → In Review → Acceptance → Done) + Icebox, with an **Acceptance
gate**, a **Reject Count** field, a **Contract** single-select field (replacing `contract:*`
labels), and **per-Epic documentation** (a Feature Doc child, auto-created at In Review — staged).
Full details and what it means for `/breakdown` and ticket creation: **`references/ogc-workflow.md`** —
read it whenever you create epics/stories or report. (The doc-automation rules are built but
staged-off; confirm with Casey before assuming they fire.)

---

## Maintenance
When a new Jira convention or correction recurs, add it here rather than letting it live
only in chat/memory.
