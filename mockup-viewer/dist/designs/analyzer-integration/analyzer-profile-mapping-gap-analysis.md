# Analyzer Profile Management & Test/Select-List Mapping — Functional Gap Analysis

**Date:** 2026-06-17
**Author:** Casey Iiams-Hauser
**Status:** Draft for review
**Scope:** The two parts of the Generic Analyzer module (ASTM / HL7 / Flat File) that were **not** brought in when the module shipped — (1) profile management through the GUI and (2) mapping of tests and select-list values through the GUI.
**Lens:** This document describes *function* only — what a lab administrator should be able to do. It deliberately avoids implementation (data shapes, endpoints, field numbering, component choices); developers decide those later.

**Source material reviewed**
- ASTM Analyzer Mapping — Addendum v1.2 (profile system: apply, library, import/export, lab-unit assignment)
- HL7 Analyzer Mapping — Addendum v1.1 (mapping surface, including Select List Value Mapping)
- Flat File Import — Analyzer Configuration v2.0
- Analyzer File Upload FRS v3.0
- Mockups: `analyzer-mapping-templates.jsx` (ASTM), `hl7-analyzer-mapping.jsx`, `flat-file-analyzer-config.jsx`
- The **full set of ~20 shipped profiles** in the Madagascar distro (`configs/analyzer-profiles/{astm,hl7,file}/`), examined in depth across a representative span: GeneXpert in all three protocols (ASTM, HL7, CSV), Sysmex XN, Mindray BC-5380, Abbott Architect, Tecan F50, Wondfo Finecare, Bruker FluoroCycler XT
- Confluence admin guide "Analyzers / ASTM Management" (OGC-138)

---

## 1. What we actually have today

**The delivered module.** The Generic ASTM / HL7 / Flat File module is in production. An administrator can register an analyzer, choose its protocol/plugin, set up the connection (or watch folder), test it, and map analyzer test codes to OpenELIS tests. Results flow in and land in the Analyzer Results review queue.

**Profiles that actually ship.** About 20 profiles exist today as files in the distro, split across `astm/`, `hl7/`, and `file/` folders. Most profiles carry, in some form: identity (display name, manufacturer, category) and a **confidence rating**; an **instrument-recognition signature**; transport/connection defaults; a list of **test codes** with name hint, LOINC, and units; and a set of **QC identification rules**. The QC rules in particular are quite mature — site-specific control prefixes (`CNEG`/`CPOS`/`NTC`/`PTC`, `C+`/`C-`), field-equals checks, etc.

But the most important thing the full corpus reveals is **how inconsistent the profiles are** — and that inconsistency is itself the core finding. All ~20 declare the same `analyzer-defaults/1.0` schema, yet they are structurally different documents:

- **Value handling is captured three different ways — even for the same instrument.** GeneXpert ships as three profiles, one per protocol, and each handles result values differently:
  - *GeneXpert ASTM* lists each test's **expected value set** (`result_type: qualitative`, `values: ["DETECTED","NOT DETECTED"]`) — the raw values, but no mapping target.
  - *GeneXpert CSV* carries an actual **raw → label map** (`result_interpretation.qualitative_values`: `MTB DETECTED → Detected`, `… INDETERMINATE → Indeterminate`, `INVALID → Invalid`, `NO RESULT → No Result`).
  - *GeneXpert HL7* carries **nothing** of the sort — code, name hint, LOINC, unit only.
  
  None of the three binds its values to the lab's actual OpenELIS select-list options; the closest (CSV) maps to normalized free-text labels. So the "value mapping" that exists is partial, inconsistent, and not connected to the lab's catalog. (This refines P-1 below — it isn't "profiles can't carry value info," it's "they carry it inconsistently and never bound to the lab's options.")
- **The shape of a profile varies by protocol and by author.** File profiles add whole sections the ASTM/HL7 ones don't (`column_mapping`, `layouts` including 8×12 plate grids, `locale_support`, `parsing_notes`, PHI-exclusion notes). Some profiles carry a `communication`/bidirectional block, some an `msh3_pattern`, some serial baud settings. Several also carry **internal authoring/tracking signals** — `confidence` (HIGH…LOW), `verification_required`, and `validation_status` prose ("PENDING — awaiting real CSV sample") — which the OpenELIS team uses to track which profiles still need real-sample testing. These are bookkeeping, not admin-facing settings; the point here is only that they sit inline with the operational config rather than being cleanly separated (see P-3).

This is exactly why "what *is* a profile?" (P-2) has to be settled before any GUI is built on top of it — the real files already disagree.

**Mapping functions that are designed.** Across the addenda and mockups, the intended mapping surface is well thought out:

- **Test mapping** — analyzer code → OpenELIS test, with auto-match (exact / suggested / unmapped), a "pending codes" list that learns codes seen in live traffic, and a query/scan to discover what an instrument sends.
- **Select-list value mapping** — for qualitative tests, map each analyzer value (e.g., `DETECTED`) to one of the OpenELIS test's select-list options (e.g., `Positive`), with a defined behavior for values that have no mapping.
- A **preview/simulator** that shows how a real message would parse under the current mapping.

The gaps below are the distance between *that designed surface* and *what an administrator can actually rely on today* — described functionally.

---

## 2. Profile management — functional gaps

| # | Gap | Severity | Why it matters |
|---|-----|----------|----------------|
| P-1 | **No consistent value mapping bound to the lab's select-list options.** Some profiles carry the analyzer's expected values (GeneXpert ASTM), some carry a raw→label map (GeneXpert CSV), some carry nothing (GeneXpert HL7) — and none binds those values to the lab's actual OpenELIS select-list options. | **High** | This is the biggest "didn't get brought in" item. For qualitative instruments (GeneXpert, ELISA readers, rapid molecular), value mapping *is* the hard, error-prone part of onboarding. Today even where a profile lists the expected values, an admin still has to bind each one to the right option in their own test catalog by hand — and where the profile carries nothing (HL7), they build it from scratch. The profile system doesn't yet deliver its core promise (fast, known-good onboarding) for exactly the instruments that need it most. The raw material is already in some profiles; it needs to be made consistent and catalog-bound. |
| P-2 | **"Profile" isn't defined consistently — across ~20 shipped files on one nominal schema.** All claim `analyzer-defaults/1.0`, yet they differ structurally: value handling appears in three forms (or not at all), file profiles add column/layout/locale sections, some carry communication or recognition blocks, confidence and validation state are encoded inconsistently (including as prose). | **High** | Before any GUI work, we need one agreed answer to "what does a profile capture?" — including which parts are shared across protocols and which are protocol-specific (file parsing, plate layouts). Otherwise the import/export/library functions promise capability many profiles can't express, admins import a profile expecting turnkey and get a partial one, and the library shows profiles that behave inconsistently. The fix is functional, not cosmetic: define what a profile *means*, then make shipped and admin-exported profiles carry the same information. |
| P-3 | **Authoring/tracking metadata is mixed in with operational config.** Fields like `confidence`, `verification_required`, and `validation_status` prose are **internal** signals the OpenELIS team uses to track which profiles still need real-sample testing — they are not meant for lab admins. Today they sit inline alongside the operational settings. | **Low** | These should *not* be surfaced in the GUI or gate an admin's setup — they're project bookkeeping. The only functional implication: the profile contract should cleanly separate "operational config the product uses" from "authoring metadata the team uses," so the GUI simply ignores the latter and nobody builds admin behavior on top of it. |
| P-4 | **Instrument auto-recognition — CUT (see §7).** Suggesting a profile from an incoming message was considered and dropped: the in-message identity signal is unreliable (configurable/generic ASTM sender; none for flat file) and unverified in several profiles, and an admin should be able to pick their own instrument from the list. | **Cut** | The analyzer is already identified by its connection; the ongoing case is handled by unmapped-prompting (path 3), which doesn't need to guess the instrument. |
| P-5 | **No profile update / re-adopt path.** When a better version of a built-in profile ships, there's no described function for an admin to see what changed and adopt it without losing local customizations. | **Medium** | Profiles are versioned (the shipped one is `1.2.0`). Without an adopt-changes function, improvements never reach existing sites, or sites re-import and silently lose their local edits. Needs a "review changes / keep my customizations" function. |
| P-6 | **Export round-trip isn't guaranteed to reproduce the setup.** Export is only as complete as P-1/P-2 allow. If a profile can't carry value maps, then what an admin builds by hand can't be exported and re-used elsewhere. | **Medium** | The whole point of "export your working analyzer as a profile" is that another site (or the community) can reproduce it. That only holds if export captures everything the admin configured — most importantly the value maps. |
| P-7 | **Where profiles come from — RESOLVED (see §5).** The admin guide implied profiles live in the application package; the real ones live in a per-distro config folder. Decision: a three-layer model — base catalog shipped with OpenELIS, curated distro bundles, and site-added imports — with the portable profile kept catalog-independent. | **Resolved** | Functionally the admin needs "a catalog of trustworthy profiles to start from," available out of the box and easy to extend. Distros tune the set (and can pre-bind to their catalog); sites add their own. This defines what "base / bundled / site" means in the library and who maintains each layer. |

---

## 3. Test & select-list mapping — functional gaps

The test-code mapping function (analyzer code → OpenELIS test) is in good shape conceptually. The gaps concentrate in **select-list (qualitative value) mapping** and in **consistency across the three protocols**.

| # | Gap | Severity | Why it matters |
|---|-----|----------|----------------|
| M-1 | **The select-list mapping target isn't consistently tied to the chosen test's own result options.** The HL7 mockup correctly shows "options from the mapped test's select list" and warns when the test has none. The ASTM mockup treats the target more loosely (a generic value type). | **High** | A value map is only safe if its right-hand side is constrained to the result values the chosen test can actually store. If an admin can map `DETECTED` to free text that the test doesn't recognize, the result can't validate or report correctly. Functionally: once a test is chosen, the value-map options should always come from *that test's* configured result list — same behavior in ASTM, HL7, and flat file. |
| M-2 | **No guided path when the test has no select-list options yet.** A qualitative analyzer needs the target test to already have its result options defined; if it doesn't, the admin is stuck. | **Medium** | The mapping screen should detect "this test has no result options defined yet" and point the admin to set them up first (in Test Catalog), rather than letting them build a value map against nothing. The HL7 mock hints at this; it should be a guaranteed, consistent function. |
| M-3 | **Unmapped-value behavior isn't consistent or visible end-to-end.** When the analyzer sends a coded value with no mapping, behavior (reject / pass-through / use a default) is described for HL7 but not uniformly, and it isn't clearly connected to what the reviewer sees. | **High** | An unmapped qualitative value must never silently drop or land as a raw code on a patient result. The function needed: a consistent, configurable behavior for unmapped values **and** a clear warning that surfaces in the Analyzer Results review queue (parallel to the existing "test not mapped" warning) so a human catches it. |
| M-4 | **No completeness feedback on value mapping.** Nothing tells the admin "you've mapped 3 of the 4 values this analyzer is known to send." | **Medium** | If a profile declared the expected value set (ties to P-1), the mapping screen could show value-map completeness the same way it shows test-code match stats — turning "did I cover every result this thing can emit?" from a guess into a visible check. This is what prevents a surprise unmapped value on a live patient sample months later. |
| M-5 | **The three protocols describe the same mapping job three different ways.** ASTM, HL7, and flat-file mapping live in separate addenda with divergent emphasis and terminology. | **Medium** | An admin mapping a flat-file analyzer and an HL7 analyzer should experience the *same* test-mapping and value-mapping functions, with only the source-field reference differing. Today there's real risk of three subtly different mapping editors. We should state the mapping functions once, protocol-agnostically, and let each protocol only vary the "where the value comes from" part. |
| M-6 | **Reverse mapping (for outbound work orders) is unaddressed.** All mapping described is inbound (results → OpenELIS). Bidirectional instruments also need OpenELIS test → analyzer code for work orders / host query. | **Low (flag)** | Out of scope for this pass, but worth naming explicitly so it's a deliberate deferral, not an oversight. The query/host-query features already hint at it. |

---

## 4. One cross-cutting observation

The published admin guide ("Analyzers / ASTM Management", OGC-138) already walks through **loading profiles, value mapping, and QC configuration as if they are fully shipped.** In reality, what's delivered is the generic module plus a defaults file; the richer profile and value-mapping functions described here are the parts not yet brought in. The documentation is currently ahead of the delivered function. Closing the gaps above also closes that gap between the docs and the product.

A related mismatch worth flagging for the team: the HL7 design work is written around MLLP transport and HL7 v2.3.1, but the real GeneXpert profile declares HL7 **v2.5 over HTTP**. That's a connection-layer detail developers will sort out, but functionally it confirms the profile must be able to *say* how a given instrument actually talks (transport and version), and the mapping/connection functions can't assume one fixed answer.

---

## 5. Target functional model (agreed 2026-06-17)

These decisions resolve the pivotal questions and set the direction for the spec revision. Described as function only.

**A profile is the analyzer's living configuration — and it carries the select-list value maps.** There is no "profile mode" versus "manual mode." Every configured analyzer *has* a profile; the only difference is how that profile came to exist. A profile carries both the test-code mappings and the qualitative value → select-list-option mappings (resolving P-1 and P-2). This builds on what some profiles already do — listing an analyzer's expected values (GeneXpert ASTM) and even normalizing them (GeneXpert CSV) — and adds the missing piece: a consistent representation in which each analyzer value is bound to an actual option in the lab's test catalog. Value-map targets always come from the chosen test's own result options (resolving M-1); if the test has none defined yet, the admin is guided to set them up in Test Catalog first (M-2).

**Three ways an analyzer gets configured — all end in a profile:**

1. **Apply a prebuilt profile that matches the lab's test catalog.** Best case: pick it, confirm, activate. The profile already contains the test mappings and the value maps, so there's little or nothing left to do.
2. **Build the mapping by hand in the GUI.** When no prebuilt profile fits, the admin maps test codes and value lists manually — and that work is **saved as a local profile**, so it's reusable, exportable, and not thrown away. Manual setup and profile creation are the same act.
3. **Connect the analyzer with no (or partial) mapping and let it learn.** The system parses incoming messages and **prompts the admin to resolve anything it can't map** — unknown test codes and unknown coded values alike. Each resolution extends the local profile.

**The "prompt me for what's unmapped" behavior is continuous, not just at setup.** The same mechanism that handles path 3 at onboarding also catches change over time:

- An analyzer gets a **new cartridge** and starts sending a **new test code** that isn't in OpenELIS yet → it surfaces as a pending item for the admin to map.
- An analyzer sends a **new coded value** a mapped test's value-list hasn't seen before (e.g., a result option that wasn't in the original profile) → it surfaces the same way.

Unmapped tests and unmapped values are **never silently dropped**. They queue for the admin and are visible in the Analyzer Results review so a human always closes the loop (resolving M-3, and giving M-4 its completeness signal). This makes profiles self-maintaining: the configuration grows as the instrument's real behavior reveals itself.

**How profiles are distributed — and why they stay catalog-independent.** Profiles are portable, drop-in units (think of a profile, or a bundle of them, as something added without rebuilding the application — "like a plugin"). They reach a site in three layers:

1. **Base catalog (ships with OpenELIS).** Anyone who downloads the software gets a starting catalog of known-instrument profiles, available out of the box.
2. **Distro bundles.** A deployment (Madagascar, PNG, …) can package a chosen subset — or all — of the profiles relevant to its instruments. Because a distro controls its own test catalog, its bundled profiles can ship **already bound** to that catalog's tests and select-list options — this is the "prebuilt profile that matches my catalog perfectly" best case from the three paths above.
3. **Site-added profiles.** An admin can drop in or import a profile easily — hand-built (path 2) or shared from elsewhere — without a rebuild or a developer.

The pivotal design consequence: **the portable profile must be catalog-independent.** Different distros and sites have different test catalogs, so a profile can't hard-wire bindings to one lab's tests. A portable profile describes the *analyzer's* behavior (its test codes, expected values, QC rules) and *suggests* targets (e.g., by LOINC and name); the actual binding to a site's tests and select-list options **resolves when the profile is applied** (resolving M-1 at apply-time, and explaining why auto-match exists). A distro bundle is then just the special case where that binding is pre-done because the catalog is known. This keeps one profile reusable everywhere while still allowing a perfect, zero-touch fit where the catalog is controlled.

**What this closes:** P-1, P-2, P-7, M-1, M-2, M-3 are resolved in principle by this model; M-4 (completeness feedback) and P-5/P-6 (update path, faithful export) become the supporting functions that make the paths trustworthy and reusable. (P-4 recognition is cut — see §7.) P-3 is just a clean-up: keep the team's authoring/tracking metadata separate from the operational profile so the GUI ignores it.

---

## 6. Recommended sequence (functional, not implementation)

1. **Settle what a profile is.** Agree the functional contents of a profile — and make it include the qualitative value/select-list mappings (P-1, P-2). Everything else in profile management depends on this answer.
2. **Make select-list mapping safe and consistent.** Always source value-map targets from the chosen test's own result options, define one consistent unmapped-value behavior, and surface unmapped values to the reviewer (M-1, M-3, M-2).
3. **Make profiles trustworthy and reusable.** Surface confidence, support a clean update/re-adopt path, and guarantee export reproduces what the admin built (P-3, P-5, P-6).
4. **Unify the mapping experience across protocols** and add value-map completeness feedback (M-5, M-4).
5. **Add instrument recognition** as the setup-effort payoff once profiles are complete (P-4).

---

## 7. Decisions and remaining questions

**Decided (2026-06-17):**

1. **Profile contents — DECIDED:** A profile **carries the qualitative value/select-list maps** (and is the analyzer's living configuration). See §5.
2. **Select-list target — DECIDED:** Value-map options are always bound to the chosen test's own result list. See §5.
3. **Unmapped tests/values — DECIDED:** Never dropped. The system parses the message and **prompts the admin to resolve** unmapped test codes and unmapped coded values, both at setup and continuously (new cartridge / new value). See §5.
4. **Trust signals — DECIDED:** `confidence` / `verification_required` / `validation_status` are **internal** team-tracking metadata, not admin-facing. They should not appear in the GUI or gate setup; keep them separate from the operational profile. (P-3)
5. **Distribution — DECIDED:** Profiles are portable, drop-in units in three layers — a base catalog that ships with OpenELIS for everyone, curated distro bundles (which may ship pre-bound to that distro's catalog), and site-added imports. The portable profile is catalog-independent; binding to a site's tests/options resolves at apply-time. See §5. (P-7)

6. **Recognition — DECIDED (cut / out of scope):** Auto-suggesting a profile from an incoming message is **not** pursued. The in-message identity signal is unreliable (often a configurable/generic sender string in ASTM H.5; absent entirely for flat file) and several profiles' recognition patterns are unverified. More to the point: an admin who can't pick their own instrument from the profile list shouldn't be setting it up. The analyzer is already identified by its connection, and the unmapped-prompting (path 3 / §5) covers the ongoing case without needing to guess the instrument. (P-4)

**Still open for the team:**

7. **Pending-value review home:** Should unmapped tests/values be resolved from within the analyzer's mapping screen, from the Analyzer Results review queue, or both? (Affects M-3/M-4 surfacing.)
