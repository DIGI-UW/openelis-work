# RETIRED — do not add files here

This `openelis-design-skill-src/references/` folder is **retired as of 2026-09-22.**
It was a stray partial duplicate that only ever held `decision-log.md` and
`spec-registry.md`, and it repeatedly forked from the real skill because
different sessions updated one copy but not the other (the decision log ended up
numbered three different ways; see the 2026-09-22 reconciliation).

**The single canonical location for all openelis-design skill references is:**

    skills/openelis-design/references/

Edit `decision-log.md`, `spec-registry.md`, and every other reference file there
and nowhere else. The `openelis-design` skill loads `references/*` relative to
its own directory (`skills/openelis-design/`), so this folder is not read by the
skill and must not be re-created as a second source of truth.
