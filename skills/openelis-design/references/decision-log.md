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
| D-017 | EQA-touching specs defer or gray-state until the EQA V2 controller is built (QA-menu sprint) | no V2 controller exists yet | any EQA feature | FEATURE | superseded (by D-045) | eqa_v2_status |
| D-018 | A "Reagents" tab / Test↔Reagent feature needs the linkage built first (declare as dependency) | reagents-as-inventory exist; linkage does not | Test Catalog reagents | FEATURE | superseded (by D-046) | reagent_test_catalog_link |
| D-019 | Label work may pick from the 4 fixed system presets; configurable preset management is a separate FRS | configurable presets don't exist yet | Labels tab / preset work | FEATURE | superseded (by D-047) | label_presets_state |
| D-020 | Admin MVP introduces Feature Flags as the 10th Application Settings tab; Menu Config = navigation-scoped flags | hybrid auto-aggregate + curated dictionary | admin settings, menu config | FEATURE | active | admin_mvp_feature_flag_pattern |
| D-021 | RETROCI study forms are gated by `useRetroCIStudyForms` (off by default); Study Menu Configuration retires | replaces hardcoded ARV/EID/VL/Indeterminate forms | study forms / menu config | FEATURE | active | retroci_study_forms_flag |
| D-022 | External patient source: `patientSearchURL` is admin-editable but request/response format is hardcoded in Java — new endpoint types need engineering | don't design config UI implying arbitrary endpoints | patient search / external source | FEATURE | active | external_patient_source_hardcoded |
| D-023 | Catalyst (OGC-70/OGC-113) is a FUTURE LLM layer — don't deprecate existing admin paths in favor of "Catalyst will do it" | near-term specs must stand alone | any spec tempted to defer to Catalyst | GLOBAL | active | catalyst_llm_tool |
| D-024 | No emoji checkmarks (✅/➡️/☑) in funder-facing/professional reports — prose only | tone for external audiences | reports, stakeholder updates | GLOBAL | active | no_emoji_checkmarks_in_reports |
| D-025 | Jira "Done" ≠ shipped — confirm with Casey before claiming an OGC ticket delivered | status field lies about live state | any delivery/status claim | GLOBAL | active | jira_done_not_shipped |
| D-026 | For a Claude Code pipeline, size slices to one reviewable PR, not story points | agent implements bigger coherent chunks; diff reviewability matters most | /breakdown slicing | GLOBAL | active | jira-conventions / pr_sized_slicing |
| D-027 | Analyzers is a top-level SideNav group (Analyzers List / Analyzer Types / Error Dashboard / Quality Control / Maintenance); per-analyzer detail uses `/analyzers/{id}/<subpage>` (e.g. `/mappings`, `/configuration`) | live app already exposes `/analyzers`, `/analyzers/types`, `/analyzers/errors`; two analyzer specs disagreed on the baseline (Maintenance framed it as elevation from Admin→Resources, Types & Mapping treated it as existing). Single shared IA prevents route/subnav collisions | any Analyzers-module feature | FEATURE | active | crosscheck 2026-06-18 (analyzer-profile-mapping vs analyzer-maintenance); admin-ia-inventory |
| D-028 | Specimen-is-identity: exactly one `SAMPLETYPE_TEST` row per TEST row (app convention; schema is m:n with no unique pair). "Same assay, other specimen" = a separate Test row with its own LOINC. Sample-type "Associated Tests" = **reassign, not attach** | LOINC first-match routing and `getSampleTypeFromTest` assume 1 link; attach-to-second-type silently breaks both | test catalog, sample type, order entry specs | GLOBAL | active | test-catalog-data-model.md §3–4 |
| D-029 | Panel sample types are UI-derived from member tests, but `SAMPLETYPE_PANEL` stays backend-synced — order-entry panel list and e-order panel→sample-type resolution consume it | retiring it requires rewriting order-entry + intake; a separate backend story | Panels, Sample Types, order entry | FEATURE | active | test-catalog-data-model.md §4 #2 |
| D-030 | Domain columns: built on Test only (OGC-936). Panel + TestSection columns and the TypeOfSample varchar(1) migration are **unbuilt** — each FRS declares its own migration; propagation = independently-set + guards (panel/lab-unit/sample-type membership must match domain), not derivation | 3 of 4 domain columns don't exist on develop | any domain field/guard | FEATURE | active | test-catalog-data-model.md §4 #3; extends D-004 |
| D-031 | Storage/handling ownership: `test_sample_handling` (1:1, structured, history) is authoritative; sample-type disposal text is reference-only guidance (column doesn't exist yet); per-specimen disposal = Sample Storage module | prevents three drifting sources of truth | test catalog Storage, sample type, storage module | FEATURE | active | test-catalog-data-model.md §4 #4 |
| D-032 | OGC-361 (lab-unit domain) marked Done but absent from develop — reconcile ticket vs branch before the Lab Units redesign assumes it | instance of D-025 (Done ≠ shipped), verified by repo-wide search | Lab Units redesign | FEATURE | provisional | test-catalog-data-model.md §2.7 |
| D-033 | Assay grouping = an explicit, persisted variant-link record only (declared data addition, mechanism dev's call); groups form via variant creation or admin Link action — NO name matching/suggestions anywhere; day one silent | heuristics assert relationships the engine can't know; auto-linking in migrations mutates data silently | test catalog list, variant flows | FEATURE | active | test-catalog-completion-v2 FR-46/51 |
| D-034 | Cascading result type (C) is retired from the chooser; existing C tests work as Multi-select, tagged legacy w/ convert suggestion; no grouping UI will be built | never configurable (no grouping UI shipped); no longer needed | Sample & Results result types | FEATURE | active | test-catalog-completion-v2 FR-75 |
| D-035 | Inventory storage reuses the shared **sample Storage model** (OGC-657); no parallel inventory storage tree | one storage hierarchy for the lab; avoids drift | inventory lots, storage | FEATURE | active | Inventory FRS §5 |
| D-036 | Run-out shown as a **±1SD window, not a single date**; order-by uses the conservative early end | daily use varies — a single date is false precision | inventory projections; any stock-out forecast surface | FEATURE | active | Inventory FRS FR-2/FR-3 |
| D-037 | Inventory **"type" is a free-form tag**, not a managed entity; **track-lots is a per-item property**; **auto-consume is derived from the Test↔Reagent link** (no flag) | a curated type entity carried nothing that couldn't move to the item or be derived | inventory item model; any "managed lookup vs tag" call | FEATURE | active (supersedes v1.2 types-in-context) | Inventory FRS §4.2 |
| D-038 | **OGC-658 closed as superseded** by type-as-tag — no `inventory_item_type` CRUD | removes a managed-list maintenance burden | inventory catalog | FEATURE | active | Jira OGC-658 (closed 2026-07-22) |
| D-039 | Reorder set = **at/below reorder threshold OR projected to reach it within a user-set horizon N days**; same rule drives Reorder-now/soon badges; lead time feeds order-by + suggested qty only, not membership | a static below-threshold list ignores velocity and resupply time | inventory reorder logic | FEATURE | active | Inventory FRS FR-20a |
| D-040 | Lead time is **local per lab/instance**, never a shared/seeded catalog attribute | the same item takes different times to arrive at different labs | inventory item; any seeded-catalog design | FEATURE | active | Inventory FRS FR-3 |
| D-041 | Multi-lab oversight is a **downstream external BI dashboard (Superset/Power BI)** fed by the central FHIR repo via FHIR transactions — never an in-OpenELIS surface | keeps OpenELIS single-tenant (D-001); national view assembled outside it | any cross-lab/oversight request | FEATURE | active | Inventory FRS §8 |
| D-042 | Alert **acknowledge-to-quiet** for persistent operational criticals (mirrors critical-result ack); refines P-16 (non-dismissible stays for transient criticals) | an always-red banner in a chronically-short lab becomes wallpaper | inventory alerts; any persistent-critical banner | GLOBAL | active (refines P-16) | Inventory FRS FR-5 |
| D-043 | `/breakdown` creates **one Epic per mockup and NO child Stories**; the slicing guide is attached to the Epic as guidance, the implementing dev slices | slicing is better done by the implementer against live code; avoids stale pre-sliced tickets | `/breakdown` output | GLOBAL | active | Casey 2026-07-01; feedback_breakdown_epic_only (was cited as "D-028" — see ID-collision note) |
| D-044 | *(now backed by constitution v1.11.0 Principle VII)* Specs reuse existing **API endpoints** (FRS "API & Data Reuse" table, `/analyze` Pass P) and existing **i18n keys** (Localization table marks Reuse/New + New-key count, `/analyze` Pass Q); a new endpoint or key is a justified exception under Dependencies | "here's the feature" invites a from-scratch rebuild; every new key is a translation job in every deployment language | every FRS; `/analyze` | GLOBAL | active | Casey 2026-07-01; feedback_reuse_api_and_i18n (was cited as "D-029" — see ID-collision note) |
| D-045 | **EQA V2 is BUILT** — supersedes D-017's defer/gray-state instruction. EQA specs may now design against the live surface | verified 2026-08-01 on `testing`: `GET /rest/eqa/programs` 200, `/rest/eqa/programs/{id}/enrollments` 200, `/rest/eqa/my-programs` 200, `/rest/eqa/orders/summary` 200; routes `/EQAManagement`, `/EQADistribution(/create)`, `/EQAMyPrograms`, `/EQAOrders`, `/EQAParticipants`, `/EQAResults` all in the shipped router | any EQA feature | FEATURE | active (supersedes D-017) | live-app verification 2026-08-01 |
| D-046 | **Test↔Reagent linkage is BUILT** — supersedes D-018. A Test Catalog Reagents tab no longer needs the linkage declared as a dependency | verified 2026-08-01: `GET /rest/test-catalog/{testId}/reagents` 200 (bundle also shows POST/DELETE `.../reagents/{reagentId}`). Note `/rest/test-reagents` and `/rest/reagents` 404 — the linkage is **nested under test-catalog**, use that path | Test Catalog reagents; inventory | FEATURE | active (supersedes D-018) | live-app verification 2026-08-01 |
| D-047 | **Configurable Label Preset Management is BUILT** — supersedes D-019's "4 fixed presets" constraint. Label work composes from managed presets, not a hardcoded set | verified 2026-08-01: admin route `/MasterListsPage/labelPresets` in the shipped router, with a real editor (name ≤120 chars, `heightMm`/`widthMm` 5–200 validation, `admin.labelPresets.validation.*` i18n keys) | Labels tab, barcode/label printing | FEATURE | active (supersedes D-019) | live-app verification 2026-08-01; OGC-285 |
| D-048 | **Alert acknowledgment is BUILT** (`POST /rest/alerts/{id}/acknowledge`, `POST /rest/qc/violations/{id}/acknowledge`, `AlertAcknowledgeModal`, `acknowledgmentRequired`/`acknowledgedBy`/`acknowledgedDate`). What remains unbuilt is **per-result critical-result ack** specifically — declare only that as a dependency, not "acknowledgment" wholesale | prevents specs re-declaring an ack model that already ships | alerts, critical-result ack, analyzer unmapped-code alerts | FEATURE | active | live-app verification 2026-08-01 |

---

## ⚠ ID-collision note (resolved 2026-08-01)

Two different decision sets both claimed **D-028 / D-029**:

- The **test-catalog data-model** decisions (specimen-is-identity; panel sample types) — these
  keep D-028/D-029, because `test-catalog-data-model.md` and the Inventory FRS cite them by ID
  and renumbering would break those citations.
- The **2026-07-01 process decisions** (Epic-only `/breakdown`; API & i18n reuse) — recorded in
  auto-memory as "D-028"/"D-029" but never landed in this log. They are now **D-043 / D-044**.

**If you meet an older citation of D-028/D-029 meaning `/breakdown` or API-reuse, read it as
D-043/D-044.** This collision is what blocked `upload/decision-log-additions.md` from being
appended for three consecutive gallery-ledger runs (2026-07-29 → 07-31); that file is now
applied and can be drained to `upload/processed/`.

## How to use in a review
- `/crosscheck` matches a new design's choices against this table and reports any that
  contradict an `active` decision, citing the ID.
- To intentionally reverse a decision: add a new row with the new call, set the old row to
  `superseded` (note the new ID), and record the reason. Never silently contradict.

## Maintenance
`/specify` and `/breakdown` append any new precedent they set as a closing step. The monthly
consolidation task promotes stable decisions out of memory into this log. Re-confirm
`provisional` rows (e.g. D-017) each planning cycle.

**2026-07-01 (monthly consolidation):** re-confirmed provisional **D-017** (EQA-touching
specs defer/gray-state until the EQA V2 controller is built) — still provisional; no EQA V2
controller in code this cycle (see `current-state-gotchas.md`). No decisions superseded; no
new global decisions promoted from memory (domain-scoping delta recorded as a current-state
gotcha, not a new decision — D-004 already governs the Domain enum).

**2026-08-01 (monthly consolidation):** applied the long-pending
`upload/decision-log-additions.md` (D-035…D-042) **plus** the D-028…D-034 test-catalog
data-model rows that were missing from this log — both were carried only in the untracked
working copy at `OpenELIS Feature Design/openelis-design-skill-src/`. Resolved the D-028/D-029
ID collision (see note above) by landing the two orphaned 2026-07-01 process decisions as
**D-043/D-044**. **Superseded three stale rows against live verification on
`testing.openelis-global.org`:** D-017→D-045 (EQA V2 is built), D-018→D-046 (Test↔Reagent
linkage is built), D-019→D-047 (configurable Label Presets are built). Added **D-048**
(alert acknowledgment is built; only per-result critical ack remains). No provisional rows
remain except D-032 (OGC-361 lab-unit domain: Done-but-absent — re-confirm next cycle).
