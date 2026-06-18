# Analyzer Types & Mapping — Functional Requirements Specification

| Field | Value |
|-------|-------|
| **Status** | Draft for review |
| **Module** | Admin → Analyzers (Analyzer Profiles, Analyzer setup, Field Mappings) |
| **Author** | Casey Iiams-Hauser |
| **Date** | 2026-06-17 |
| **Supersedes** | The deployed "Analyzer Types" page (the first cut of this work) and the unbuilt portions of the Generic ASTM/HL7/Flat-file module: profile management and GUI mapping of tests and results |
| **Front end** | Carbon React |
| **Companion artifacts** | `analyzer-profile-mapping-prototype.html` (functional prototype), `analyzer-profile-mapping-gap-analysis.md` |

> This FRS is version-agnostic — it describes the whole feature. Version/sprint boundaries are decided later in `/breakdown`.
>
> **Terminology:** the user-facing name is **Analyzer Type** — the reusable, forkable configuration for a kind of analyzer (test codes, result mappings, QC codes, formatting). This document uses **"profile"** as a synonym for that same object/entity; all UI labels read "Analyzer Type." (It is distinct from the dev-only **Plugin Type**, which stays in the Advanced/implementer area.)

---

## Lab Context

### Current State

A clinical lab runs benchtop and molecular instruments — a Cepheid GeneXpert for TB and viral load, a Mindray or Sysmex hematology analyzer, a Tecan ELISA reader. Each instrument can send its results to OpenELIS electronically instead of a tech reading a printout and typing numbers into the computer by hand. For that to work, OpenELIS has to know two things about each instrument: how it talks (the network connection and message format) and what its codes mean — when the GeneXpert sends a result labeled `RIF` with the value `DETECTED`, OpenELIS has to know that means the "Rifampin Resistance" test and the result "Resistant" in the lab's own catalog.

Today OpenELIS ships a generic plugin that can talk to ASTM and HL7 (the two common standards instruments use to transmit results) and flat-file instruments, and an admin can add an analyzer and connect it. But the part that translates the instrument's codes into the lab's tests and results was never finished in the interface. The current "Analyzer Types" admin page exposes developer-level fields — a Java plugin class name, a regular expression — that no lab person can fill in, and the mapping of an instrument's result values to the lab's result options can't be done through the screen at all. Labs that need it today rely on a developer to hand-edit configuration.

### Pain

Because the mapping interface is unfinished, connecting an analyzer is a developer task, not a lab task. A lab that gets a new GeneXpert cartridge — which makes the instrument start reporting a new test code — has no way to map that new code themselves; the result arrives and there's nowhere for it to go. Qualitative instruments are the worst case: a GeneXpert reports `DETECTED` / `NOT DETECTED` / `INDETERMINATE`, and without a way to say which of the lab's result options each of those means, the results can't be recorded correctly. When a shipped configuration doesn't quite match a particular lab's catalog, the lab has no safe way to fix it — and the screen that should help is full of fields meant for programmers. The net effect is that automated result import, the whole point of connecting an instrument, stalls on configuration that the lab can't do for itself.

### What Changes

A lab administrator sets up an analyzer by answering one question — *which instrument is this?* — and picking it from a searchable list. OpenELIS loads a ready-made **profile** for that instrument (its test codes, the results it reports, its quality-control codes, how it formats values) and shows the administrator a short list to **verify**: "this analyzer sends MTB-RIF, which matches your MTB Detection test by its LOINC code (the international standard code that identifies a lab test) — confirm." The administrator confirms the matches, enters the network address, tests the connection, and the analyzer is live. They never see a Java class or a regular expression. When something doesn't line up — a test the instrument reports isn't in the lab's catalog, or a result value isn't recognized — only that one item opens an editor to fix, and the administrator either points it at an existing catalog test (searchable, because catalogs run to hundreds of tests) or is sent to add the test in the Test Catalog first. If the instrument later sends something new, like a new cartridge's test, OpenELIS doesn't lose the result — it parks it and raises an alert so a person maps it. The same screens work whether the instrument speaks ASTM, HL7, or sends a file.

---

## Overview

This feature completes the Generic Analyzer module by adding (1) **analyzer profiles** — reusable, shareable configurations for a kind of instrument — and (2) a **GUI for mapping** an instrument's tests, result values, and QC codes to the lab's catalog. It reframes the deployed, developer-facing "Analyzer Types" page into a lab-facing **Analyzer Profiles** page, and replaces the bare "Add Analyzer" form with a **guided, instrument-first setup** whose normal path is *verify*, not hand-editing.

The governing principle: **verifying is the norm, editing is the exception.** A clean, profile-matched analyzer is set up by confirming a short list and entering a network address; the full mapping editor only appears for items that don't line up or when an administrator deliberately changes a profile.

### Navigation & URL

- **SideNav:** `Analyzers → Analyzer Types` (a sibling of Analyzers List, Error Dashboard, Quality Control). This is the **next version of the existing `Analyzers → Analyzer Types` page**, which it replaces (today that page is a developer-facing plugin registry; it becomes the lab-facing analyzer-type/profile manager).
- **Breadcrumb:** `Home / Analyzers / Analyzer Types`; the mapping editor is `Home / Analyzers / Field Mappings / [Analyzer or Type name]`.
- **Routes:** analyzer-types list `/analyzers/types` (existing route, repurposed); mapping editor `/analyzers/{id}/mappings` (existing) and `/analyzers/types/{typeId}` for type-context editing. Add-analyzer setup is **inline within `/analyzers`** (expands in the list; not a modal, not a separate page).

### Permissions & Audit

- **Role attachment:** accessible via the existing **Admin** role bundle (the same that governs Analyzers List / Analyzer Types today). No new per-action permission keys. Verification/confirmation, profile edits, deactivation, and connection changes are admin actions; do not invent a granular matrix.
- **Audit events** (`audit_trail`): `ANALYZER_PROFILE_CREATED`, `ANALYZER_PROFILE_UPDATED`, `ANALYZER_PROFILE_DEACTIVATED`/`_REACTIVATED`, `ANALYZER_MAPPING_VERIFIED` (records the human sign-off on setup, with analyzer + profile id), `ANALYZER_TESTMAP_CHANGED`, `ANALYZER_RESULTMAP_CHANGED`, `ANALYZER_CONNECTION_CHANGED`. Do not audit reads.
- **Envers:** the analyzer profile entity and analyzer↔profile association are configuration data → `@Audited`.

### Scope boundaries (out of scope)

- **Instrument auto-recognition** from an incoming message (cut — unreliable signal; an admin who can't identify their instrument shouldn't be setting it up).
- **Creating a new test inline** during mapping (multi-step; done in Test Catalog, then mapped).
- **Importing profiles from a file** and any **community profile sharing/marketplace** (future). Profile **Export** is download-only (for backup or sending to support); **re-importing** an exported profile is part of the deferred sharing work.
- **LLM-assisted authoring** (esp. flat-file CSV/XML parsing and value inference) — parked as a Catalyst candidate.
- Deep flat-file column/layout configuration beyond what a profile already carries (candidate for the Catalyst path).

---

## User Stories

1. *As a lab administrator,* I want to set up an analyzer by choosing my instrument and confirming a short list, so that I can connect it without developer help or technical jargon.
2. *As a lab administrator,* I want OpenELIS to tell me which of the instrument's tests already exist and are active in my catalog (matched by LOINC), so that I can trust what will receive results and fix what won't.
3. *As a lab administrator,* I want to confirm — not hand-build — how the instrument's result values map to my result options, so that qualitative results record correctly with a human sign-off.
4. *As a lab administrator,* when an instrument's test or value isn't recognized, I want to map it to an existing catalog test by searching, or be told to add it in Test Catalog first, so that I'm never stuck and never silently dropping results.
5. *As a lab administrator,* I want a change I make for one analyzer to default to a new profile (not silently alter every other analyzer), so that I can't break the others by accident.
6. *As a lab administrator,* I want unmapped codes or results from a live analyzer to raise an alert and flag the analyzer, so that nothing piles up unnoticed.
7. *As a lab administrator,* I want one place that lists the reusable profiles with how complete their mappings are, so that I can see and manage what's configured.

---

## Functional Requirements

### A. Profiles

**FR-A1 — Profile as the unit of configuration.** A *profile* is a reusable configuration for a kind of analyzer. It carries: test-code mappings (analyzer code → catalog test, with the test's LOINC), result mappings (analyzer value → the test's result option), QC codes (control identifiers and how they're recognized), result formatting (date format, decimal separator, units), and the instrument's protocol/connection capability (including whether it supports two-way). It does **not** carry analyzer-specific facts: name, lab unit assignment, network address, or connection direction in use.

**FR-A2 — Shared, with fork.** An analyzer references exactly one profile. Multiple analyzers may share a profile. There is no per-analyzer override layer and no "clone": when an analyzer must differ, the change is saved as a **new profile** (a fork).

**FR-A3 — Deactivate, never delete.** Profiles (and analyzers) are deactivated/reactivated, never hard-deleted. Lists hide deactivated profiles by default with a "Show deactivated" toggle. (See constitution: no hard delete in a LIMS.)

**FR-A4 — Shipped profiles.** OpenELIS ships a base catalog of profiles for common instruments, with their tests pre-mapped by LOINC. Deployments/distros may ship additional profiles bound to their own catalogs. Profiles created by a site are also stored. The Analyzer Profiles list can filter by **Created** (site-created vs. shipped) but does not otherwise organize by source.

**FR-A5 — Trust metadata is internal.** Authoring/validation metadata (confidence, verification-required, validation status) is internal team tracking and is **not** surfaced in the admin UI nor used to gate setup.

### B. Guided analyzer setup (inline)

**FR-B1 — Inline, in the list.** "Add Analyzer" expands a guided setup **inline within the Analyzers List** (the list stays visible for context); it is not a modal. Setup is presented as stacked sections that reveal in order: **Instrument → Verify → Connect**. Completed sections collapse to a one-line summary with Edit.

**FR-B2 — Instrument-first.** Section 1 asks the administrator to pick the instrument from a **searchable** list (manufacturer/model). Selecting it loads that instrument's profile. The administrator names the analyzer and assigns one or more **lab units**. No protocol, plugin, or pattern fields appear here.

**FR-B3 — "Not listed" path.** If the instrument isn't listed, the administrator defines a **new profile**: profile name, protocol (ASTM / HL7 / flat file), and connection type. (This is the only place these fields appear in the lab flow; they otherwise live with the profile.)

**FR-B4 — Verify, don't build (the sign-off).** Section 2 shows the profile's tests as a list to **verify**: each row shows the analyzer code, the matched catalog test, the matching LOINC, and a status. Verification is a **mandatory human confirmation** (per-row, or confirm-all) and is recorded in the audit trail. Nothing maps itself silently. This is by design a patient-safety gate; the fragility is intentional.

**FR-B5 — QC codes are verified too.** Section 2 also lists the instrument's **QC codes** (control identifiers, e.g., specimen-ID prefixes or a control flag field) for confirmation, so control runs are recognized and don't post as patient results.

**FR-B6 — Connect.** Section 3 collects the network address and the **data flow** (see FR-F). A connection test reports the result in plain language.

**FR-B7 — Push-a-result option.** The verify step offers "send a result from the analyzer now" — capturing a real message so the administrator can verify against the codes/values the instrument *actually* sends (proactive learn-from-traffic; reflects that, e.g., GeneXpert sites enable/disable assays so the live code set may differ from the profile).

**FR-B8 — Reconcile the transmission against the mappings.** When a result is received during setup, the screen reconciles each transmitted item against the current mappings and updates live:

- **Verified:** a transmitted test code / result value that matches an existing mapping is marked **verified against the live message** (a per-test "checked vs live" indicator flips from "not seen yet" to "verified"). This is stronger than a profile match — it confirms the instrument really sends what the profile assumed.
- **New result value:** a value arriving for a mapped test that the result-map doesn't cover surfaces inline, pre-populated with the transmitted value, with the test's result options offered so the administrator maps it on the spot.
- **New test code:** a code arriving with no test mapping surfaces inline with a catalog **search** to map it (or send to Test Catalog per FR-C2).
- **Not transmitted:** a mapped test that did *not* appear in this message stays "not seen yet" (not an error — the assay may simply not have run).
- **Nothing matches / blank profile:** when the profile has no mappings yet (the "not listed → new profile" path), the transmission **populates** the rows from what was received and the administrator maps each — i.e., a new profile is built directly from a real message rather than from a blank form.

Mappings resolved this way update the profile immediately (subject to the save-scope rule, FR-H). Reconciliation never discards a transmitted item.

### C. Catalog readiness check (LOINC matching)

**FR-C1 — Deterministic 1:1 LOINC match.** A profile test is matched to a catalog test when the profile's LOINC **equals** a LOINC on an **active** catalog test — a deterministic 1:1 key, not fuzzy auto-matching. The verify step shows, per test: matched · active / not matched.

**FR-C2 — Resolve a non-match (inline, for the exception only).** When a profile test has no LOINC match, the row offers a **Resolve** action with, in priority order: (a) **Map to an existing test** via a **search** of the catalog (by name, code, or LOINC) — the primary path; (b) **Add it in Test Catalog first**, then return and map (a link out; inline test creation is out of scope because adding a test is multi-step); (c) **Don't receive this test** from this analyzer. Resolving updates the readiness state.

**FR-C3 — Missing tests don't block the rest.** A test absent from the catalog is flagged and does not block verifying/activating the others. Results for an unmapped test follow FR-G (never dropped).

### D. Test mapping (editor)

**FR-D1 — Editable rows.** In the mapping editor, every test-code row is editable — the administrator can change the analyzer code or **re-point the linked test**, even on rows already matched, and can remove a row or add one.

**FR-D2 — Search-based test picker.** Linked-test selection is a **search** over the catalog (assume ~500 tests), implemented as a Carbon `ComboBox`/typeahead (match on name, code, or LOINC). It is never a long static dropdown.

**FR-D3 — Protocol-agnostic surface.** The editor is identical for ASTM, HL7, and flat-file analyzers; only the field-reference label differs (e.g., `R.3` for ASTM, `OBX-3` for HL7). 

### E. Result mapping (editor)

**FR-E1 — Bound to the test's own results.** For a qualitative test, the result-mapping targets are exactly the **result options defined on the matched catalog test** (its dictionary/select-list results). The administrator can only map to results that test can store.

**FR-E2 — Guided empty state.** If the matched test has no result options defined, the editor explains this and links to Test Catalog to define them first, rather than allowing a map against nothing.

**FR-E3 — Unmatched-value behavior.** Each qualitative mapping defines what happens to a value with no mapping: flag for review (default — never dropped), pass through raw, or use a default. (See FR-G for the active-analyzer alerting.)

**FR-E4 — Completeness.** Mapping completeness is shown as **X / Y · %** for both tests mapped and results mapped, on the profile and in the editor.

### F. Connection & data flow

**FR-F1 — Per-analyzer connection.** Network address (IP/port or watched folder) and **data flow** are analyzer-level, not part of the shared profile.

**FR-F2 — Direction is intent + probe, not a guarantee.** Default is **Results only (one-way)**. **Two-way** (OpenELIS sends orders/queries back) is offered only when the profile declares the instrument supports it. The connection test attempts the round trip; on timeout it reports that two-way isn't reachable (e.g., analyzer on a private network) and the analyzer runs one-way. Setup is never blocked by a failed two-way probe. The verified direction is shown on the analyzer.

### G. Learn-from-traffic (never drop, make it loud)

**FR-G1 — Accept and flag, don't block.** OpenELIS cannot control what an instrument sends, so inbound results are **never blocked**. An unmapped test code or unmapped result value is accepted and held, not dropped.

**FR-G2 — Active analyzers raise alerts.** For an **active** analyzer, an unmapped code/result posts to the **Alerts** page for acknowledgment and handling (acknowledged by Admin; Lab Manager optional), and raises a visible flag on the **Analyzers List** row and on the **profile**. (Aligns with the global critical-acknowledgment direction.)

**FR-G3 — Resolve updates the profile.** Resolving a pending item from the alert/queue maps it; the resolution updates the analyzer's profile so the same code/value maps automatically next time. This is the same mechanism that handles a new cartridge's new test code or a newly-seen result value. HL7 pending items show the display name (OBX-3.2) and value type (OBX-2); ASTM shows the bare code.

### H. Edit scope (shared-with-fork)

**FR-H1 — Save choices.** Saving changes made from an analyzer's mapping editor presents two choices: **Save as a new profile** (default) or **Update this profile (affects N analyzers)**.

**FR-H2 — Safe default.** When the profile is used by more than one analyzer, **Save as a new profile** is the default and "Update this profile" carries an explicit warning naming the affected analyzers. When the profile is used by only the current analyzer, "Update this profile" is harmless and may be the default.

**FR-H3 — Unique names by default.** A new (forked) profile's suggested name is the source profile's name with an **auto-incremented suffix** (`-1`, `-2`, …) chosen as the next value that is not already in use, guaranteeing uniqueness; the administrator may rename. The fork records its **lineage** ("derived from …").

### I. Analyzer Types page

**FR-I1 — List.** Columns: Profile (name + manufacturer/model/version), Protocol, **Tests mapped (X/Y · %)**, **Results mapped (X/Y · %)**, Used by (count), Status. Row actions: Edit mappings, Export (download a copy for backup/support — re-import is future), Deactivate/Reactivate. (No Clone, no Delete.)

**FR-I2 — Search & filters.** A search over name/manufacturer/model (built for large libraries). Filters: **Created** (site-created / shipped), **Protocol**, **Mapping status** (has unmapped results / fully mapped), and **Show deactivated** (off by default).

**FR-I3 — Intro/explainer.** The page opens with a short plain-language explanation of what a profile is and how to use it (share across identical analyzers; fork when one differs; deactivate not delete).

**FR-I4 — Editing a profile == the mapping editor.** Editing a profile opens the same editor reached from an analyzer's Field Mappings — a profile *is* its mappings, not just a list row.

---

## Data Model & Dependencies

Grounded in existing OpenELIS entities; new data is flagged as a named dependency, not invented domain concepts.

| Concept | Source / status |
|---------|-----------------|
| Catalog test, result type, result options | **Existing** — Test Catalog; qualitative results are dictionary-backed result options. Result mapping targets these. |
| LOINC on a test | **Existing** field; the deterministic match key. OpenELIS ships default tests pre-mapped with LOINC as part of this work. |
| Lab unit (test unit) | **Existing** — used for analyzer assignment and RBAC context. |
| Analyzer (instance) | **Existing** — gains a profile reference, lab-unit association, and verified data-flow direction. |
| Analyzer plugin / type | **Existing** ("Analyzer Types" registry) — the generic plugin per protocol; profiles ride on the generic plugin. Lab-facing surface replaced by Analyzer Profiles. |
| **Analyzer profile** | **NEW** — reusable config entity (FR-A1) with lineage to a parent profile for forks; `@Audited`. |
| Pending/unmapped code & result queue | **Dependency** — learn-from-traffic store; surfaces to Alerts. Partly exists as "pending codes" on the deployed Field Mappings page; extend to cover unmapped result values. |
| Alerts | **Existing** Alerts page — receives unmapped-code/result events for active analyzers (FR-G2). |
| QC identification rules / control codes | **Existing** in profiles/QC config — surfaced for verification (FR-B5); detailed QC limits live in Quality Control. |

---

## Localization

All UI strings use localization keys (`label.analyzer.profile.*`, `label.analyzer.setup.*`, `label.analyzer.mapping.*`, `label.analyzer.verify.*`). Representative keys:

| Key | English |
|-----|---------|
| `label.analyzer.profiles.title` | Analyzer Profiles |
| `label.analyzer.profiles.intro` | A profile is the reusable setup for a kind of analyzer… |
| `label.analyzer.setup.identify` | Instrument |
| `label.analyzer.setup.verify` | Verify the mappings |
| `label.analyzer.setup.connect` | Connect it |
| `label.analyzer.verify.matchedActive` | matched · active |
| `label.analyzer.verify.needsAttention` | needs attention |
| `label.analyzer.verify.confirm` | Confirm & continue |
| `label.analyzer.catalog.notInCatalog` | Not in your catalog |
| `label.analyzer.catalog.mapExisting` | Map to an existing test in your catalog |
| `label.analyzer.catalog.addInCatalog` | Add it in Test Catalog first, then return and map |
| `label.analyzer.qc.recognized` | recognized |
| `label.analyzer.connect.dataflow` | Data flow |
| `label.analyzer.connect.oneway` | Results only (one-way) |
| `label.analyzer.connect.twoway` | Two-way (send orders/queries) |
| `label.analyzer.connect.twowayUnreachable` | Two-way not reachable on this network; running results-only |
| `label.analyzer.scope.newProfile` | Save as a new profile |
| `label.analyzer.scope.updateProfile` | Update this profile (affects {count} analyzers) |
| `label.analyzer.mapping.testsMapped` | Tests mapped |
| `label.analyzer.mapping.resultsMapped` | Results mapped |
| `label.analyzer.unmapped.alert` | Analyzer is sending a result that isn't mapped |

---

## Acceptance Criteria

- [ ] **AC-1** Add Analyzer expands inline in the Analyzers List (not a modal); the list remains visible.
- [ ] **AC-2** Setup proceeds Instrument → Verify → Connect as stacked, progressively revealed sections; completed sections collapse to a summary with Edit.
- [ ] **AC-3** The instrument picker is search-based; selecting an instrument loads its profile.
- [ ] **AC-4** "My instrument isn't listed" collects profile name, protocol, and connection type to define a new profile.
- [ ] **AC-5** The verify step shows each profile test with analyzer code, matched catalog test, LOINC, and status; matching is deterministic LOINC==LOINC against active tests.
- [ ] **AC-6** Verification requires explicit human confirmation and writes `ANALYZER_MAPPING_VERIFIED` to the audit trail.
- [ ] **AC-7** QC codes appear in the verify step and require confirmation.
- [ ] **AC-8** A non-matching test offers Resolve → map-to-existing (search), add-in-Test-Catalog (link out), or don't-receive; inline test creation is not offered.
- [ ] **AC-9** A missing test does not block verifying/activating the others.
- [ ] **AC-10** Connect defaults to one-way; two-way is offered only when the profile supports it, is verified by a probe, and degrades to one-way on timeout without blocking setup.
- [ ] **AC-11** In the editor, every test-code row is editable (re-point linked test via search, edit code, remove, add).
- [ ] **AC-12** Result mapping targets are exactly the matched test's result options; an empty option set shows the Test-Catalog guidance.
- [ ] **AC-13** Saving from an analyzer defaults to Save-as-new-profile when used-by > 1; Update-this-profile warns and names affected analyzers.
- [ ] **AC-14** A forked profile's suggested name uses the next free `-N` suffix and is guaranteed unique; lineage is recorded.
- [ ] **AC-15** Unmapped codes/results from an active analyzer post to Alerts and flag the row and the profile; results are never dropped or blocked.
- [ ] **AC-16** The Analyzer Profiles list shows Tests mapped and Results mapped as X/Y · %, supports search and the four filters, and hides deactivated by default.
- [ ] **AC-17** Profiles are deactivated/reactivated; no delete action exists.
- [ ] **AC-18** The mapping editor is identical across ASTM/HL7/flat file except the field-reference label.
- [ ] **AC-19** No developer-only fields (plugin class, identifier-pattern regex, raw config JSON) appear in the lab-facing flow; any such reference is in a clearly secondary "Advanced — for IT/implementers" area.
- [ ] **AC-20** All UI strings use localization keys.
- [ ] **AC-21** "Send a result from the analyzer" reconciles the transmission live: matched items are marked verified-against-live; a new result value surfaces pre-populated with the test's options to map; a new test code surfaces with a catalog search; a mapped test not in the message stays "not seen yet."
- [ ] **AC-22** Reconciliation never discards a transmitted item; resolving one updates the profile (per FR-H scope).
- [ ] **AC-23** On the "not listed → new profile" path, a received message populates the (empty) mapping rows so a new profile can be built from real data; the "My instrument isn't listed" control reveals the new-profile fields (name, protocol, connection type).

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| `analyzer-profile-mapping-gap-analysis.md` | Why this work exists; the gap between shipped profiles and the needed GUI |
| `analyzer-profile-mapping-prototype.html` | Functional prototype embodying this FRS |
| ASTM / HL7 / Flat-file mapping addenda | Prior protocol-level mapping specs this consolidates and supersedes for the GUI surface |
| Deployed "Analyzer Types" page | The first cut of this work; superseded by Analyzer Profiles |
| Test Catalog FRS | Defines the tests, result types, and result options that mappings target |
| Alerts | Receives unmapped-code/result events for active analyzers |
| Ideas backlog — Catalyst-assisted analyzer mapping | The LLM-assisted future direction (flat-file inference), out of scope here |
