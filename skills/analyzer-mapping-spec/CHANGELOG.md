# analyzer-mapping-spec — Changelog

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
