---
name: analyzer-mapping-spec
description: >
  Build OpenELIS Global analyzer integration specifications.
  Use this skill whenever a user mentions an analyzer, instrument, LIS integration, ASTM, HL7, MLLP,
  CSV flat file, or anything related to connecting laboratory equipment to OpenELIS. Always trigger
  this skill when asked to write a spec, mapping doc, integration spec, companion guide, or Jira story
  for any lab analyzer or instrument. Also trigger when the user wants to update the Analyzer
  Integration Tracker on Confluence. This skill covers the full workflow: instrument classification,
  protocol identification, spec authoring, companion setup guide, Jira story creation, and
  Confluence tracker update. Protocol/field-mapping is owned here; analyzer UI design defers
  to the openelis-design skill.
---

# Analyzer Mapping Spec Skill

Produces the **three standard deliverables** for every analyzer integration in OpenELIS Global:

1. **Integration / Mapping Spec** — technical, protocol-level document grounded in vendor protocol docs (field positions, record/segment maps, QC rules, transforms)
2. **Companion Analyzer Setup Guide** — step-by-step setup walkthrough for lab staff
3. **Analyzer Integration Tracker Update** — Confluence row update at the canonical tracker page

## Scope boundary — this skill vs. `openelis-design`

This skill owns the **per-instrument, protocol-level** work: classifying the device, identifying the protocol, mapping fields/records/segments, QC rules, transforms, the companion setup guide, the Jira story, and the Confluence tracker.

It does **not** own the analyzer UI/feature design. The screens an administrator uses to set up an analyzer (inline setup, profiles, verify-first mapping) are designed in the **`openelis-design`** skill — see its **Analyzer Types & Mapping FRS** and **decision-log**. Whenever this skill describes OpenELIS UI (especially in the companion guide or any mockup), it **defers to `openelis-design`**: the live app + that skill's decisions are the source of truth. Do not reinvent the UI here, and do not contradict the design decisions — notably:

- **Inline setup, not a modal** (D-005); setup flows **Instrument → Verify → Connect**, verify-first.
- **SideNav submenus, not in-page tabs** (D-003).
- **Carbon design tokens, not hardcoded colors** (carbon-anti-patterns A1).
- **Deactivate/Reactivate, never delete** (D-002).
- **Analyzers is a top-level group**; routes are `/analyzers/...`, per-analyzer detail `/analyzers/{id}/<subpage>` (D-027) — not `Admin → Analyzer Management`.

If a UI detail isn't settled in `openelis-design` yet, flag it as a dependency rather than inventing it.

> **Atlassian constant (stable)**
> - cloudId: `57b4e32d-23d4-4a71-8985-82ac0274d145`
>
> **Deployment-driven values — do NOT hardcode Madagascar.** Choose the parent epic, tracker page, labels, and assignee from the device's deployment (see Step 4 and `references/jira-confluence-patterns.md` → Deployment Routing). Madagascar (`OGC-304`, tracker `1097531396` / space `mdgoe`, dev Piotr Mankowski `5e765a025e755d0cd425c863`) is *one* deployment, not the default.

---

## Step 0 — Instrument Classification (always do this first)

Before writing anything, confirm the device is an **analytical instrument** that produces reportable results. Ask or verify:

- Does it output patient result data? (Not just sample prep, storage, or transport)
- What is the output format? (ASTM messages, HL7 messages, CSV/flat file, proprietary binary)
- Which **deployment** is this for? (Madagascar / PNG / Env-Vector / Indonesia / …) — this drives the parent epic, tracker, labels, and assignee in Step 4. Capture it now.

**Red flags that disqualify a device:** magnetic particle processors, liquid handlers, centrifuges, aliquoters, freezers, sequencing *prep* modules (e.g., Kingfisher Flex — out of scope). If uncertain, look up the device category before proceeding. (Aligns with `openelis-design` decision D-002 / current-state: analyzers are domain records — deactivated, never deleted; a disqualified device is simply not added.)

---

## Step 1 — Protocol Identification

Map the device to one of the three supported integration paths:

| Protocol | Plugin | Key markers |
|---|---|---|
| ASTM LIS2-A2 | `generic-astm` | H/P/O/R/L record structure; field positions like R.3, O.3, P.5 |
| HL7 v2.3.1 over MLLP | `generic-hl7` | MSH/PID/OBR/OBX segments; `^^^CODE` format in OBX-3 |
| CSV / Flat File | `flat-file` | Polled folder; delimited columns; locale-dependent headers |

**Do not assume** — Mindray products (both hematology and chemistry) use HL7 v2.3.1/MLLP, not ASTM. Always verify against vendor documentation or IFU.

Some devices support **dual-mode** (e.g., Wondfo Finecare: ASTM real-time + CSV flat file; Cepheid GeneXpert: ASTM + HL7). Each mode gets its own Jira story and spec section.

### When it's none of the three (classify and route — don't force a fit)

Not every instrument output is ASTM, HL7, or delimited CSV. If the output is something else, **classify it and route it** — do not pretend it's one of the three, and do not write implementation direction for a new adapter (that's engineering's call, not the spec's):

| What you have | Classification | Route |
|---|---|---|
| **Structured JSON / XML** (e.g. TB-Profiler JSON, a vendor REST/JSON export) | Not covered by the generic ASTM/HL7/flat-file plugins | Spec the **data contract** (fields → OpenELIS test/result, transforms, QC) as usual, but flag in the spec that **generic-plugin support does not exist** for this format → declare it as a dependency / engineering coordination item. Don't invent the adapter. |
| **Genomic / sequencing artifacts** (FASTQ, AB1 electropherograms, `.psm` plate ZIPs) | Upstream inputs, not reportable result messages | Out of scope as a direct integration. The reportable artifact is the **downstream analysis output** (e.g. TB-Profiler JSON/CSV) — spec that instead. Note the upstream→downstream chain in the spec. |
| **Proprietary binary** (e.g. FluoroCycler `.at`) | No open protocol | Work from the vendor's protocol docs or an exported text/CSV; if neither exists, flag as **blocked pending vendor documentation** — confidence cannot be HIGH without it. |
| **Print-only / no digital export** | Not integrable | Out of scope; record on the tracker as "no LIS output" so it isn't re-investigated. |

In every "none of the three" case the spec still describes **what the mapping is**, and explicitly names the missing capability as a dependency — it never prescribes how to build the integration.

---

## Step 2 — Write the Integration Spec (Deliverable 1)

**Read `references/spec-templates.md`** before writing (full section structure for ASTM, HL7, CSV). **Also check `references/mapping-library.md` first** — reuse a verified value-map, QC rule, abnormal-flag table, or per-instrument fragment instead of re-deriving it. (Respect each fragment's confidence: never paste an `ILLUSTRATIVE` field position into a spec as fact.) Worked reference: `references/example-spec-annotated.md` shows a complete, annotated spec to calibrate against.

Key requirements for all specs:
- Version header: `v1.0` on first issue; bump to `v1.1`, `v2.0`, etc. on revisions
- Ground every field mapping in actual **LIS2-A2 field positions** (for ASTM) or **HL7 segment/field numbers** (for HL7) from vendor docs — not abstract categories
- Document **all record types** actually used by the instrument (for ASTM: H, P, O, R, L; for HL7: MSH, PID, OBR, OBX, NTE)
- Include a **QC identification rules** section with specific field/value/prefix triggers
- Include an **abnormal flag mapping** table
- Document **result aggregation mode**: BY_SPECIMEN (with window) or PER_MESSAGE
- For CSV: document column headers (locale-sensitive!), encoding (UTF-8 vs Latin-1), unit scales (0–100% vs 0–1.0 ratio)
- Assign a **confidence rating**: HIGH (built from vendor docs), MEDIUM-HIGH (unverified menu paths), VALIDATED (confirmed in production)

For **dual-mode devices**, include both protocol sections in one doc or create two separate docs — use judgment based on complexity.

---

## Step 3 — Write the Companion Setup Guide (Deliverable 2)

**Read `references/companion-guide-template.md`** for the standard structure.

The companion guide is a lab-staff-facing document. It has two clearly separated halves:

1. **Instrument-side configuration (this skill owns it).** Enabling LIS output *on the analyzer itself* — vendor menu paths, LIS mode, host IP/port, protocol selection, test/result code config. This is protocol- and vendor-specific and is the heart of the guide. Keep it concrete and grounded in vendor docs.
2. **OpenELIS-side configuration (defer to `openelis-design`).** How the administrator sets the analyzer up *inside OpenELIS* follows the **Analyzer Types & Mapping FRS** and the live app, not a UI invented here. Describe it as the FRS does — pick the instrument, **verify** the profile's tests/QC codes (verify-first), connect (port + data flow), with the flow **inline** in the Analyzers list. Reference the real routes (`/analyzers`, `/analyzers/{id}/mappings`). Do **not** describe a modal, in-page tabs, an `Admin → Analyzer Management` path, or a hardcoded-color mockup — those contradict current design decisions. If the FRS leaves a detail open, say so.

Still include: the correct **TCP port** and **connection role** (usually SERVER / OpenELIS listens), and a **communication-test / message-simulator** step to confirm parsing.

**Mockups:** if a visual is needed, build it per the `openelis-design` **React/Carbon patterns + HTML-preview pattern** (CDN Carbon, Carbon tokens, SideNav submenus, inline expansion) — not the old dark-navy/tabs/modal template. There is no separate canonical mockup file for this skill anymore; the design skill's prototype + the Analyzer Types & Mapping FRS are the reference.

---

## Step 3.5 — Crosscheck & register (portfolio hook)

Before creating the Jira story, run the `openelis-design` **`/crosscheck`** discipline against this integration so analyzer specs don't drift from each other or from prior decisions:

- **Decision-log check** — does anything in the spec/guide contradict an active decision (modal, tabs, delete, hardcoded colors, `?type=` routes, a site selector)? Fix before proceeding.
- **Overlap check** — does this instrument's integration touch shared concepts already in the **spec-registry** (the Analyzer Types & Mapping feature, the Alerts/unmapped-code model, Test Catalog LOINC/result options, the Analyzers IA/route namespace per D-027)? Note coordination needs.
- **Dependency check** — does it rely on something not built yet (per `current-state-gotchas`: e.g. the pending/unmapped-result queue, the Alerts acknowledgment model)? Declare it.
- **Register it** — add/refresh a row for this instrument's integration in the **spec-registry** so the next analyzer spec sees it.

(These references live in the `openelis-design` skill: `references/decision-log.md`, `references/spec-registry.md`, `references/current-state-gotchas.md`, `references/admin-ia-inventory.md`.)

---

## Step 4 — Create the Jira Story

**Read `references/jira-confluence-patterns.md`** for current API patterns and the **Deployment Routing** table. Don't hardcode IDs — discover them.

Standard Jira story structure:
- Project: `OGC`, issue type **Story** — resolve the type id from project metadata (`getJiraProjectIssueTypesMetadata`), don't assume a fixed number.
- **Parent epic: deployment-driven** — Madagascar → `OGC-304`; PNG/CPHL → `OGC-899`; Environmental/Vector → `OGC-527`; others per the routing table. Confirm the key is current and open before linking.
- **Assignee: deployment-driven** — default unassigned unless the deployment has a known owner (e.g. Madagascar analyzer work → Piotr Mankowski). Don't assume.
- Labels: deployment tag (`Madagascar` / `PNG` / `Indonesia` / `vector` / …) + `analyzer-integration`. Add via a separate `editJiraIssue` call (the create call drops them).
- Transition to "Selected for Development" **after** discovering the transition id with `getTransitionsForJiraIssue` (don't hardcode `21` — it varies by workflow/project, and a Jira reorg is proposed but not yet applied).
- Blocking links: use **`createIssueLink`** with link type "blocks" — `inwardIssue` = blocker, `outwardIssue` = blocked. (There is no `linkJiraIssues` tool.)
- Use **markdown** content with `[label](url)` links so they render clickable (design jira-conventions).

---

## Step 5 — Update the Analyzer Integration Tracker (Deliverable 3)

**Read `references/jira-confluence-patterns.md`** for the exact `updateConfluencePage` call pattern. Use the **deployment's** tracker page (Madagascar = `1097531396` / space `mdgoe`; other deployments use their own tracker — confirm the page id from the routing table, don't assume the Madagascar page).

The tracker table row for each analyzer must include:
- Analyzer name, manufacturer, protocol
- OGC story number (link)
- Confidence rating (N/A → HIGH → VALIDATED)
- Status (Spec Complete, In Development, Deployed, Deprioritized / Out of Scope)
- Notes (any dual-mode, locale, or special handling flags)

Always fetch the current page content before updating — preserve the existing table structure. Use `markdown` contentFormat with an explicit `versionMessage`.

---

## Before handoff — run the spec checklist

**Read `references/spec-checklist.md`** and run it against the finished spec + companion guide before marking the tracker "Spec Complete" or handing to a developer. It's the "unit tests for the spec" gate — grounding, record/segment coverage, QC rules, sample-message-shown-parsing, no implementation direction, portfolio registration. Close every gap or mark it explicit N/A.

---

## Quick Reference: Key Learnings

- **Instrument classification matters first** — confirm the device produces results before speccing
- **Protocol assumptions must be verified** — never assume ASTM; always check vendor docs
- **CSV exports need their own section** — unit scales, locale-dependent headers, and encoding (Latin-1 vs UTF-8) must be explicit
- **Confidence ratings** track documentation quality: HIGH = from vendor docs, MEDIUM-HIGH = unverified UI paths, VALIDATED = confirmed production
- **Defer UI to `openelis-design`** — the companion guide's OpenELIS-side steps and any mockup follow the Analyzer Types & Mapping FRS + decision-log, not a UI invented here
- **Don't hardcode Madagascar** — parent epic, tracker, labels, and assignee are deployment-driven (Step 4 routing table)
- **Discover Jira IDs** — issue-type and transition ids vary; resolve them at runtime, don't hardcode. Use `createIssueLink` (not the non-existent `linkJiraIssues`)
- **File-handling gotchas (verify before relying — may be model/version-specific):** FluoroCycler `.at` files have crashed prior sessions — prefer text paste or rename to `.dat`/`.bin`, or work from protocol docs · SeqStudio `.psm` files are plate-config ZIPs; results are AB1 electropherograms · MinION/TB-Profiler raw FASTQ are upstream inputs, TB-Profiler JSON/CSV outputs are what OpenELIS imports

---

## Reference Files (read when relevant)

| File | When to read |
|---|---|
| `references/spec-templates.md` | Before writing any spec doc — full section structure for all three protocol types |
| `references/mapping-library.md` | Before writing a spec — reuse verified value-maps, QC rules, flag tables, per-instrument fragments |
| `references/example-spec-annotated.md` | When you want a complete, annotated worked example to calibrate quality against |
| `references/companion-guide-template.md` | Before writing a companion setup guide |
| `references/spec-checklist.md` | Before handoff / marking "Spec Complete" — the spec-quality gate |
| `references/jira-confluence-patterns.md` | Before creating Jira stories or updating the Confluence tracker — incl. the Deployment Routing table |

**Cross-skill references (in the `openelis-design` skill) — consult for anything UI or portfolio-related:** `references/decision-log.md` (design decisions to honor), `references/spec-registry.md` (register the integration, check overlap), `references/current-state-gotchas.md` (what's built vs not), `references/admin-ia-inventory.md` (real routes), and the **Analyzer Types & Mapping FRS** (the analyzer setup UI this skill's companion guide describes).
