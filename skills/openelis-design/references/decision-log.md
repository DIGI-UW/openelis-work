# Decision Log

> The "what we already decided and why" ledger. `/crosscheck` reads this to flag when a new
> design contradicts a prior decision. Each entry is a precedent you can cite by ID in a
> review (e.g. "blocked by D-002").
>
> **Scope tag:** `GLOBAL` = applies to every spec (most are also design-addendum MUSTs);
> `FEATURE` = a precedent set on one feature that new/adjacent work should stay consistent
> with. **Status:** `active` / `superseded` (note the superseding ID) / `provisional`.
>
> Keep entries terse — decision + why + where it bites. Detail lives in the linked
> reference. When a decision is reversed, mark it `superseded`, don't delete it (the history
> is the point).

| ID | Decision | Why | Applies to | Scope | Status | Source |
|---|---|---|---|---|---|---|
| D-001 | Single-tenant per deployment; no lab/site/tenant selector | OpenELIS is deployed per-lab; cross-org sharing is FHIR referral, not tenancy | any cross-org view, site filter | GLOBAL | active | design-addendum MUST B |
| D-002 | No hard delete — Deactivate/Reactivate only; lists hide deactivated by default | ISO 15189 audit/traceability; deletion breaks result provenance | any domain-record action | GLOBAL | active | design-addendum MUST D |
| D-003 | Multi-view screens use SideNav submenus, not in-page Carbon Tabs | matches shipped IA; deep-linkable views | any multi-view screen | GLOBAL | active | design-addendum |
| D-004 | Domain enum is strictly CLINICAL / ENVIRONMENTAL / VECTOR — no BOTH | no escape-hatch value anywhere (catalog and orders) | any Domain field/filter | GLOBAL | active | feedback_domain_enum_no_both |
| D-005 | Inline row expansion for edits; modals only for destructive confirms or 5+ section forms | keeps editing in context; avoids modal overload | any edit form | GLOBAL | active | design-addendum / carbon-anti-patterns B1–B2 |
| D-006 | Binary admin + per-module role bundles; no invented per-action permission keys | matches OpenELIS auth model | any permissions design | GLOBAL | active | permissions-and-audit |
| D-007 | Large-set pickers are ComboBox/typeahead; link out for heavy-entity create | catalogs run to 500+; long dropdowns/inline mega-forms don't scale | any picker over tests/orgs/providers/panels | GLOBAL | active | design-addendum MUST E |
| D-008 | Shipped app (live + repo) is the style/IA/URL source of truth, not Figma | Figma is exploratory; running app is canonical | any style/IA/route claim | GLOBAL | active | design-addendum MUST C |
| D-009 | Reuse existing data elements; declare genuinely-new data as a named Dependency | invented fields produce unbuildable specs | every mockup field/column/badge | GLOBAL | active | design-addendum MUST A / verified-data-models |
| D-010 | Global admin SideNav buckets = Config / Organization / Resources / Automation / Compliance (global grouping, NOT editor-internal) | one consistent admin IA; don't confuse with sections inside a record editor | any new admin page placement | GLOBAL | active | feedback_admin_ia_vs_editor_ia |
| D-011 | Result Entry expanded-panel additions slot in as a new inline row (alongside Methods/Storage), never an Accordion | consistency with the existing panel pattern | Result Entry panel work | FEATURE | active | feedback_result_entry_panel_inline_rows |
| D-012 | Admin URL pattern is path-segment `/MasterListsPage/<editorKey>`, not `?type=` | verified against live app v3.2.1.x | any admin route declaration | GLOBAL | active | admin-ia-inventory |
| D-013 | Preserve the breadcrumb label drift: SideNav "Admin" → breadcrumb "Admin Management" | matches shipped app | any spec rendering admin breadcrumbs | GLOBAL | active | reference_admin_breadcrumb_label_quirk |
| D-014 | QA Dashboard v1 = Average TAT only; no per-test TAT targets (deferred to v8) | scope control; avoid premature per-test thresholds | QA dashboard, home-page TAT | FEATURE | active | qa_dashboard_tat_v1_decisions |
| D-015 | Home-page TAT must reuse the QA Dashboard threshold model — don't invent a parallel one | single source for TAT logic | home-page Attention/TAT | FEATURE | active | qa_dashboard_tat_v1_decisions |
| D-016 | Referral in-transit signal uses the activated `ReferralStatus` enum; canonical view `/SampleShipment/reference-lab-results`; do NOT invent `Sample.location` | reuse existing status model | referral / shipment specs | FEATURE | active | referral_redesign_in_transit_signal |
| D-017 | EQA-touching specs defer or gray-state until the EQA V2 controller is built (QA-menu sprint) | no V2 controller exists yet | any EQA feature | FEATURE | provisional | eqa_v2_status |
| D-018 | A "Reagents" tab / Test↔Reagent feature needs the linkage built first (declare as dependency) | reagents-as-inventory exist; linkage does not | Test Catalog reagents | FEATURE | active | reagent_test_catalog_link |
| D-019 | Label work may pick from the 4 fixed system presets; configurable preset management is a separate FRS | configurable presets don't exist yet | Labels tab / preset work | FEATURE | active | label_presets_state |
| D-020 | Admin MVP introduces Feature Flags as the 10th Application Settings tab; Menu Config = navigation-scoped flags | hybrid auto-aggregate + curated dictionary | admin settings, menu config | FEATURE | active | admin_mvp_feature_flag_pattern |
| D-021 | RETROCI study forms are gated by `useRetroCIStudyForms` (off by default); Study Menu Configuration retires | replaces hardcoded ARV/EID/VL/Indeterminate forms | study forms / menu config | FEATURE | active | retroci_study_forms_flag |
| D-022 | External patient source: `patientSearchURL` is admin-editable but request/response format is hardcoded in Java — new endpoint types need engineering | don't design config UI implying arbitrary endpoints | patient search / external source | FEATURE | active | external_patient_source_hardcoded |
| D-023 | Catalyst (OGC-70/OGC-113) is a FUTURE LLM layer — don't deprecate existing admin paths in favor of "Catalyst will do it" | near-term specs must stand alone | any spec tempted to defer to Catalyst | GLOBAL | active | catalyst_llm_tool |
| D-024 | No emoji checkmarks (✅/➡️/☑) in funder-facing/professional reports — prose only | tone for external audiences | reports, stakeholder updates | GLOBAL | active | no_emoji_checkmarks_in_reports |
| D-025 | Jira "Done" ≠ shipped — confirm with Casey before claiming an OGC ticket delivered | status field lies about live state | any delivery/status claim | GLOBAL | active | jira_done_not_shipped |
| D-026 | For a Claude Code pipeline, size slices to one reviewable PR, not story points | agent implements bigger coherent chunks; diff reviewability matters most | /breakdown slicing | GLOBAL | active | jira-conventions / pr_sized_slicing |
| D-027 | Analyzers is a top-level SideNav group (Analyzers List / Analyzer Types / Error Dashboard / Quality Control / Maintenance); per-analyzer detail uses `/analyzers/{id}/<subpage>` (e.g. `/mappings`, `/configuration`) | live app already exposes `/analyzers`, `/analyzers/types`, `/analyzers/errors`; two analyzer specs disagreed on the baseline (Maintenance framed it as elevation from Admin→Resources, Types & Mapping treated it as existing). Single shared IA prevents route/subnav collisions | any Analyzers-module feature | FEATURE | active | crosscheck 2026-06-18 (analyzer-profile-mapping vs analyzer-maintenance); admin-ia-inventory |

---

## How to use in a review
- `/crosscheck` matches a new design's choices against this table and reports any that
  contradict an `active` decision, citing the ID.
- To intentionally reverse a decision: add a new row with the new call, set the old row to
  `superseded` (note the new ID), and record the reason. Never silently contradict.

## Maintenance
`/specify` and `/breakdown` append any new precedent they set as a closing step. The monthly
consolidation task promotes stable decisions out of memory into this log. Re-confirm
`provisional` rows (e.g. D-017) each planning cycle.
