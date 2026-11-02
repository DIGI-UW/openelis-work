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

- Don't describe how access is checked (filters, annotations, error codes): that's
  implementation, decided downstream. **Do** nominate privilege codes for every capability the
  feature adds (next section); that is a product decision for the role builder, not enforcement.
- Don't propose a per-role matrix for a feature that sits inside one role's workflow.
- Don't describe error codes or enforcement layers. Describe what the user *sees* when they
  lack access (the item is hidden, or the action is disabled).
- Don't specify how actions are recorded or how record history is kept. That a change should
  be traceable is fine to note as a user need; *how* it's stored is not the spec's job.

---

## Nominate privileges for every new feature (Casey, 2026-10-15)

Every FRS ends its `## Access` section with a **nominated privileges** table, so the eventual role
builder can offer each capability. Rules are in SKILL.md Stage 3 **Nominating privileges**:
`category:action` codes from the PR #3443 catalogue (reuse before minting; mark NEW), a display
group from Users and Roles Appendix A (never Administration for non-administrative capabilities,
because UR-F5 treats that group as administrator power), and a default grant on upgrade stated as
"roles that already hold `<code>`". Split a capability into its own code when a lab could want to
grant it separately. Worked example: `result-delivery/result-delivery-critique.md` §8.

| Capability | Privilege | Group | Default grant on upgrade |
|---|---|---|---|
| Send a report from the print queue | **NEW** `report:send` | Reports | Roles with `report:run` |
| Edit a facility's delivery contacts | `organization:manage` (existing) | Test catalog and reference data | As today |

---

## `/analyze` Pass J — Access / Roles

- Does the FRS say who can use the feature, in terms of existing user roles?
- For each action, is it clear which role can perform it (view vs. change), and what a user
  without access sees?
- Is access described as user capability, not an enforcement mechanism?
- Is there a nominated privileges table, with existing codes reused, NEW codes marked, groups and default grants?
- HIGH: a non-administrative capability placed in the Administration group, or no privileges table.
- Auto-CRITICAL: a write action with no stated role that can perform it.
