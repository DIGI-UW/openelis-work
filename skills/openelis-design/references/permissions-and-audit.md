# Permissions & Audit

> Read during `/specify` Stage 2 (Permissions & Audit brief item) and `/analyze` Passes
> J/K/L. **DRAFT — verify against the live app and codebase before relying on specifics.**

---

## Permission model — binary admin + per-module role bundles

OpenELIS does **not** use granular per-action permission keys. Access is governed by
role bundles assigned to users. Designs attach a feature to an existing bundle; they do not
invent keys like `results.validate`.

Known role bundles (verify exact names/coverage in the Roles Builder on the live app):
Reception, Analyst, Validator, Provider, Admin, Test Catalog Manager, EQA Provider.

- The admin menu is effectively **all-or-nothing** except Test Catalog Management, which is
  separately grantable. Don't invent a per-page admin role matrix.
- If a feature lives wholly inside one role's workflow, the role's existing bundle already
  covers it — no new grant, no role matrix.

### When a new grant IS needed (Roles Builder addition)
Declare all four: grant label, its i18n key, default role assignments on upgrade, and where
it appears on the Roles Builder page.

### `/analyze` rules (Pass J)
- Auto-CRITICAL: write action with no declared role attachment, OR any invented per-action
  permission key.
- Flag: a role matrix proposed for a single-role feature (unnecessary).

---

## Audit trail (`audit_trail`)

For every user action that **changes state** (writes, validations, status transitions,
exports, configuration changes, security events), declare an `audit_trail` entry:

- **Action verb** (e.g. `LABEL_PRESET_UPDATED`)
- **Target** entity type + id
- **Payload summary** (minimal — entity id + type is enough; no extra PII)
- **Actor** — auto-captured from Spring Security

Do **not** audit reads/getters.

### `/analyze` rules (Pass K)
- Auto-HIGH: state-changing action with no `audit_trail` declaration.
- Auto-CRITICAL: audit payload carrying unnecessary PII, or any proposal for a parallel
  audit table (use the existing `audit_trail`).

---

## Envers (row-level history)

For every **new entity** the spec introduces, declare `@Audited` coverage (yes/no +
rationale).

- Default **yes** for configuration / clinical / patient entities.
- Default **no** for transient or high-churn entities.

### `/analyze` rules (Pass L)
- Auto-MEDIUM: new entity with no Envers declaration.
- Auto-HIGH: clinical/patient entity opted out of Envers without strong justification.

---

## TODO (verify / expand)
- [ ] Confirm exact role bundle names and what each grants against the live Roles Builder.
- [ ] Confirm `audit_trail` table columns and the canonical action-verb naming convention from the codebase.
- [ ] List which existing entities already carry `@Audited` so new specs stay consistent.
