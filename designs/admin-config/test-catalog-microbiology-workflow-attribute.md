# Test Catalog v2.5 — Microbiology Workflow Attribute (`culture_workflow_type`) — FRS section

**Version:** 1.0
**Date:** 2026-06-08
**Belongs to:** Test Catalog Management v2.5 — v1 (epic OGC-746), **Basic Info** editor section (sibling to OGC-748). Foldable into `test-catalog-requirements-v2.5.md` §2.1.
**Driven by:** Microbiology module M-00/M-01/M-03 (the Culture-workflow designation the micro trigger resolver reads).
**Status:** Draft — for coordination with the Test Catalog owner.

> This is the **concrete home** for the attribute the micro specs depend on. M-03 §2.1a defines *how it's read* (the trigger resolver); this section defines *where and how an admin sets it* in the Test Catalog editor, and the schema. One nullable enum, in the Basic Info tab, orthogonal to Domain and the AMR flag.

---

## 1. Why this field exists
A microbiology culture test (blood culture, TB culture, wound culture, …) is not just a result — ordering it should **start a multi-day Case workup** in the right profile (bacterial vs TB) and put the specimen on the Microbiology Worklist. Today the Test Catalog has no signal for this: its micro-relevant fields are the **AMR flag** (a WHONET/surveillance marker) and the test's **Methods**, neither of which says "run the culture workflow." Without a first-class field, case creation falls back to the clerk manually picking `Program = Microbiology`, which is forgettable and can't distinguish bacterial from TB. This field closes that gap.

## 2. The field
**`Microbiology workflow`** — a single optional select on the **Basic Info** tab.

| Value | Meaning |
|-------|---------|
| *(blank / None)* | Not a culture-workflow test. Ordering it creates no Microbiology Case. (Default for all existing and new tests.) |
| `BACTERIOLOGY` | Ordering it creates a **bacterial** Microbiology Case (M-04 profile). |
| `MYCOBACTERIOLOGY_TB` | Ordering it creates a **TB** Microbiology Case (M-14 profile). |
| `MYCOLOGY` | *Reserved* — not selectable until the Mycology module (M-16) ships. |

- **Single enum, not a checkbox + select.** The presence of a value *is* "this is a culture-workflow test"; a separate boolean would be redundant and could drift out of sync. Blank = no workflow.
- **Orthogonal to `Domain`.** A TB culture is still `Domain = CLINICAL`; `Domain` (Clinical / Environmental / Vector) answers "what kind of testing program," this answers "which micro case profile." They don't constrain each other.
- **Orthogonal to the `AMR` flag.** `AMR` = "export results to WHONET / AMR surveillance." A test may be: culture-workflow only, AMR only, both (the common case for blood culture), or neither. The editor does not couple them, though selecting a workflow may *suggest* enabling AMR (non-blocking hint).
- **Culture protocol is not set here.** It is the test's **default Method** (`test_method.is_default`) on the existing **Methods** tab (A-REUSE-1) — no `default_culture_protocol_id`. This field only routes the workflow.
- **A test-level property, deliberately *not* a Method property.** `workflow_type` lives on the **test**, not on the Method, and there is **no workflow↔method mapping** — by design:
  - Methods are **assigned to tests** (a test may have several) and are **reusable/shared** across tests, so a Method has no single workflow to carry; putting the enum there would be ambiguous and would leak one test's workflow onto every other test sharing that Method.
  - Methods already do another job: **selecting which analyzer performs the work**. Overloading the Method with workflow routing would entangle "which instrument" with "which case profile" — two unrelated concerns — and force a new workflow↔method mapping the system doesn't have today.
  - **Rejected alternative — "TB default Method prefills `workflow_type`."** Considered and dropped for the same reason: it would create exactly that method→workflow coupling. The TB-Method guidance in §3 stays **purely advisory** (a hint, no stored mapping, no auto-set). The admin sets `workflow_type` directly on the test; the default Method is chosen independently on the Methods tab for protocol + analyzer reasons.

## 3. Editor behavior (Basic Info)
- Rendered as a Carbon `Select`/`Dropdown` labeled **"Microbiology workflow"** in the Basic Info section, below the status flags, near the AMR flag group. Helper text: *"Set the microbiology workflow to make ordering this test create the matching Microbiology Case and appear in the Worklist. Bacteriology and Mycobacteriology–TB use different case profiles, breakpoints, and reports."*
- When a non-blank value is selected, show a non-blocking inline hint group:
  - if the test has **no default Method**, hint: *"Set a default Method on the Methods tab — it becomes this culture's protocol."* (warning, not a save-block, so configuration order is flexible);
  - if `MYCOBACTERIOLOGY_TB` is selected, hint that the default Method should be a TB Method (MGIT / LJ / agar proportion) and interpretation will use the **WHO-TB critical-concentration** breakpoint family (M-02);
  - if `AMR` is off, hint (dismissible): *"Most culture tests are also exported for AMR surveillance — enable AMR if this one should be."*
- Changing the value on an existing test triggers a confirmation, mirroring the Domain-change pattern: *"New orders will create {workflow} cases. Existing open cases are unaffected; a tech can reclassify an open case from the Case Workbench."* (Existing cases are **not** retro-reclassified — that is the tech's Change-workflow action in M-04 §4.9.)
- `MYCOLOGY` appears disabled with a "coming with the Mycology module" tooltip until M-16.

## 4. Schema
- **`test.culture_workflow_type`** — nullable enum/varchar (`BACTERIOLOGY` | `MYCOBACTERIOLOGY_TB` | `MYCOLOGY`), null = not a culture-workflow test. Liquibase changeset (Test Catalog migrations only; no direct DDL). Audited (`@Audited`) like other `test` fields.
- No change to `test_amr_config` (AMR stays separate). No `default_culture_protocol_id` (protocol = default Method).
- Persists on **Save Basic Info** alongside `test`, per OGC-748's persistence.

## 5. How the rest of the system uses it
- **M-03 trigger resolver** reads `culture_workflow_type` for each ordered test and returns the case `workflow_type` (or none) — the single source of truth for *whether* and *which* Case is created (M-03 §2.1a).
- **Fallback unchanged:** if no ordered test carries the field, the manual `Program = Microbiology` path still creates a `BACTERIOLOGY` case, so untyped deployments keep working.
- **Unassigned / mis-typed → tech reclassifies:** a case created without a valid `workflow_type` is `UNASSIGNED`; the tech sets/changes it via the Case Workbench **Change workflow** action (M-04 §4.9), audited and guarded once results exist. This field is the *configuration* default; M-04 §4.9 is the *runtime* correction.

## 6. Migration / seeding
- Backfill: all existing tests get `culture_workflow_type = NULL` (no behavior change). 
- Deployments doing micro set the field on their culture tests as part of catalog setup; until they do, the fallback (and the M-04 `UNASSIGNED` escape hatch) cover them — no hard cutover.
- Optional: a deployment data pack may seed common culture tests (blood culture → BACTERIOLOGY, TB culture / GeneXpert → MYCOBACTERIOLOGY_TB).

## 7. Acceptance criteria
- **AC-TC-MW-01** Basic Info shows a "Microbiology workflow" select with None / Bacteriology / Mycobacteriology–TB; Mycology disabled.
- **AC-TC-MW-02** Selecting a value persists `test.culture_workflow_type`; blank persists null; field is audited.
- **AC-TC-MW-03** The field is independent of Domain and the AMR flag (any combination is valid; only non-blocking hints are shown).
- **AC-TC-MW-04** Ordering a test with `culture_workflow_type` set creates the matching Microbiology Case profile via the M-03 resolver; a blank test creates no case.
- **AC-TC-MW-05** Changing the value warns that existing open cases are unaffected and reclassification is a Case-Workbench action; it does not retro-reclassify.
- **AC-TC-MW-06** `MYCOBACTERIOLOGY_TB` with no TB default Method saves but surfaces the Method hint; configuration order is not forced.
- **AC-TC-MW-07** Permission reuses `admin.testCatalog.manage`; all strings under `admin.testCatalog.basicInfo.microWorkflow.*`.

## 8. Reuse / no-invention note
Reuses the existing Basic Info editor, `test` table + audit, the Methods tab for the culture protocol, and the AMR flag for surveillance — adds exactly **one nullable enum column** and one select control. No new admin page, no coupling to Domain/AMR, no duplicate protocol store.
