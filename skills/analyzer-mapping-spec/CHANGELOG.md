# analyzer-mapping-spec — Changelog

## 2026-06-18 (round 3) — LOINC reuse is Default-TC-conditional

- Corrected the reuse claim: a profile's LOINC panel only auto-matches a deployment whose test
  catalog carries those LOINCs — i.e. **out of the box only on the OpenELIS Global Default test
  catalog**. Custom-TC deployments must do their own LOINC↔catalog matching (not reusable).
- Added a deliverable to every spec: **contribute the analyzer's LOINC-coded tests to the
  Default TC** when missing, so the integration works out of the box on a fresh install.
- Reflected in profile-reuse.md, SKILL.md deliverables, spec-checklist, golden example, and the
  Jira deliverables list.

## 2026-06-18 (round 2) — Reuse, quality gate, coverage, exemplar

- **`references/profile-reuse.md`** — reuse mechanism grounded in the **real profile schema**
  (`analyzer-defaults/1.0`). Teaches the correct reuse axis: the **test→LOINC panel map** is
  reusable across vendors *and* protocols (Sysmex XN ASTM == Mindray BC-5380 HL7 for CBC), while
  transport/QC/identifier are per-instrument. Points at distro profile sets (e.g. Madagascar
  `configs/analyzer-profiles/`) as **examples to adapt — not a universal source** — and flags the
  canonical/community profile home as an open question. (Replaced an earlier hand-typed
  "mapping-library" that organized by the wrong axis and carried misleading specifics.)
- **`references/spec-checklist.md`** — "unit tests for the spec": a pre-handoff quality gate
  (grounding, record/segment coverage, QC rules, sample-message-shown-parsing, no
  implementation direction, portfolio registration).
- **Non-ASTM/HL7/CSV branch** in Step 1 — classify & route JSON/proprietary/genomic/print-only
  instruments instead of forcing a fit. Classification only — no implementation direction.
- **`references/example-spec-annotated.md`** — a complete, annotated worked example (Mindray
  BC-5380 HL7) to calibrate quality; marked ILLUSTRATIVE, verify-against-IFU.
- Dropped the unexplained "1.2-style profiling approach" phrase from the description.
- Reinforced throughout: specs describe the **mapping/behavior**, not how to implement it.

## 2026-06-18 — De-stale + harmonize with openelis-design

- **Scope boundary added.** This skill owns protocol/field-mapping + companion setup +
  Jira/Confluence tracker; the analyzer *UI* is owned by `openelis-design` (Analyzer Types &
  Mapping FRS). The skill now defers to that FRS + decision-log for any UI it describes.
- **Companion guide UI model corrected.** Removed the stale modal / in-page-tabs /
  `Admin → Analyzer Management` / dark-navy-mockup model. OpenELIS-side setup now tracks the
  FRS: inline, verify-first (Instrument → Verify → Connect), SideNav submenus, Carbon tokens,
  `/analyzers/{id}/...` routes. Live-result step uses the FRS "send a result now" reconciliation.
- **De-hardcoded Madagascar.** Parent epic, tracker page, labels, and assignee are now
  deployment-driven via a Deployment Routing table (Madagascar OGC-304 / PNG OGC-899 /
  Env-Vector OGC-527 / Indonesia-SILNAS). Madagascar is one row, not the default.
- **Fixed stale Jira API patterns.** `linkJiraIssues` → **`createIssueLink`**; issue-type and
  transition ids are now discovered at runtime (`getJiraProjectIssueTypesMetadata`,
  `getTransitionsForJiraIssue`) instead of hardcoded `10009` / `21`; clickable markdown links.
- **Portfolio hook (Step 3.5).** Before creating the Jira story, run the openelis-design
  `/crosscheck` discipline (decision-log / spec-registry / current-state-gotchas) and register
  the integration in the spec-registry.
- **Mockup guidance** now points to the openelis-design React/Carbon + HTML-preview pattern;
  removed the unreachable `analyzer-mapping-templates-mockup.jsx` "project knowledge" pointer.
- spec-templates.md largely unchanged (protocol content is current); only generalized the
  hardcoded "Madagascar Deployment" header and added a protocol-vs-UI scope note.

> Cross-skill note: this skill references files that live in the `openelis-design` skill
> (decision-log, spec-registry, current-state-gotchas, admin-ia-inventory, Analyzer Types &
> Mapping FRS). Keep both skills installed.
