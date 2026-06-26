# Access & Roles

> Read during `/specify` Stage 2 (Access brief item) and `/analyze` Pass J. This describes
> how to express *who can use a feature* in user terms. A spec says what a user can do and
> see — never how access is enforced. Enforcement, storage, and history-keeping are
> implementation decisions made downstream, not in the spec.

---

## Describe access by existing role

OpenELIS access is organized around a small set of user roles. A spec attaches a feature to
the role(s) whose work it belongs to, and says — for each action — which role can do it.

Common roles (confirm exact names on the live app): Reception, Analyst, Validator, Provider,
Admin, Test Catalog Manager, EQA Provider.

Write access in plain user terms:
- *"A Validator can release results; an Analyst can enter them but not release."*
- *"Only Admin can change these settings; everyone else sees them read-only."*
- *"A user without access doesn't see the menu item at all."*

If a feature lives wholly inside one role's existing workflow, that role already covers it —
say so ("Accessible via the existing Analyst role") and don't propose anything more.

---

## What to keep out of the spec

- Don't invent fine-grained permission names, and don't describe how access is checked —
  that's implementation, decided downstream.
- Don't propose a per-role matrix for a feature that sits inside one role's workflow.
- Don't describe error codes or enforcement layers. Describe what the user *sees* when they
  lack access (the item is hidden, or the action is disabled).
- Don't specify how actions are recorded or how record history is kept. That a change should
  be traceable is fine to note as a user need; *how* it's stored is not the spec's job.

---

## `/analyze` Pass J — Access / Roles

- Does the FRS say who can use the feature, in terms of existing user roles?
- For each action, is it clear which role can perform it (view vs. change), and what a user
  without access sees?
- Is access described as user capability, not an enforcement mechanism?
- Is access over-specified — e.g. a per-role matrix for a feature inside one role's workflow?
- Auto-CRITICAL: a write action with no stated role that can perform it.
