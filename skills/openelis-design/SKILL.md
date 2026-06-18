---
name: openelis-design
description: "Expert assistant for designing features in OpenELIS Global, an open-source laboratory information management system (LIMS). Use this skill whenever the user asks to design, specify, mockup, or document any feature for OpenELIS Global — including new modules, admin configuration pages, workflow improvements, analyzer integrations, or clinical data views. Also triggers for Jira story creation, FRS documents, React/Carbon mockups, or any request involving lab informatics design for OpenELIS. If the user mentions lab workflows, LIMS features, clinical lab software, or says anything about \"OpenELIS\", use this skill immediately. Also use for design critique, crosswalk analysis, harmonization reviews, or when the user asks to review, improve, or validate an existing mockup or spec."
---

# OpenELIS Global Design Skill v3.2

OpenELIS Global is an open-source LIMS used in clinical laboratories worldwide.

**Before doing anything else, load both governance files:**
- `memory/constitution.md` — **pointer** to the upstream engineering constitution
  (`DIGI-UW/OpenELIS-Global-2` → `.specify/memory/constitution.md`). It records the synced
  version, summarizes the design-relevant principles, and links to the raw URL. Check the
  re-sync trigger at the top: if upstream is newer than the synced version, re-read it and
  update the pointer before relying on the summary.
- `memory/design-addendum.md` — design-specific MUSTs that this skill enforces during
  `/specify` and `/analyze`, plus standing UI/IA conventions.

Together these are the non-negotiable authority for all design decisions in this skill.
The addendum's MUSTs (data reuse, no multitenancy, shipped-app style source, no-hard-delete,
design-for-large-catalogs) are CRITICAL findings in `/analyze` when violated.

---

## The Six Commands

OpenELIS design work is organized into six commands, each with a distinct trigger and output.

| Command | Trigger phrase | What it does |
|---|---|---|
| `/clarify` | "What do I need to decide?", "Am I missing anything?", new feature with gaps | Structured ambiguity scan → up to 5 questions → answers encoded into spec |
| `/constitution` | "Update the design rules", "Add a new principle", "What are our standards?" | View or amend `memory/constitution.md` |
| `/specify` | "Write the spec", "Build the FRS", "Document this feature" | Full FRS + mockup + visual preview via guided dialogue |
| `/analyze` | "Review this spec", "Check for issues", crosswalk/harmonization requests | Cross-artifact consistency report |
| `/checklist` | "Generate a checklist", "What should I validate?", pre-story quality gate | Domain-specific requirements quality checklist ("unit tests for English") |
| `/breakdown` | "Break this into stories", "Plan the sprints", "Create the epic" | Slice approved mockup into 1 Epic + versioned child Stories (~20 pts each, 2-week sprints) |

Commands chain naturally: a new feature typically runs `/clarify` → `/specify` → `/analyze` → `/checklist` → `/breakdown`. `/breakdown` is the only command that creates Jira tickets.

---

## Thread Role & Workspace Protocol

This thread **only writes to `upload/`**. It does not run git commands, does not touch
`designs/`, `mockup-viewer/`, `MANIFEST.yaml`, `INDEX.md`, or `App.jsx`.

**Workflow:**
1. Produce FRS `.md` and mockup `.jsx` files during the design session (save anywhere for review).
2. When a deliverable is complete and approved, copy the final files into `upload/` as the last step.
3. Notify Casey — the gallery thread handles registration, commits, and PRs from there.

This separation prevents git index lock conflicts when two sessions share the same repo folder.

---

## `/clarify` — Ambiguity Detection

**Purpose:** Detect and reduce ambiguity or missing decision points in an in-progress spec
or feature description. Encode answers back into the spec. Run this BEFORE `/specify` for
new features.

**Ambiguity taxonomy:** Scan the feature description or draft spec across these categories.
For each, mark status: Clear / Partial / Missing.

1. **Functional Scope & Behavior** — Core user goals, success criteria, out-of-scope declarations, user roles
2. **Domain & Data Model** — Entities, attributes, lifecycle/state transitions, uniqueness rules, data scale
3. **Interaction & UX Flow** — Critical user journeys, error/empty/loading states, accessibility, localization
4. **Non-Functional Attributes** — Performance targets, scalability, reliability, observability, security posture
5. **Integration & Dependencies** — External services/APIs, data import/export formats, protocol assumptions
6. **Edge Cases & Failure Handling** — Negative scenarios, concurrency/conflict resolution, rate limiting
7. **Constraints & Tradeoffs** — Technical constraints, explicitly rejected alternatives
8. **Terminology** — Canonical glossary terms, avoided synonyms, deprecated terms
9. **Completion Signals** — Acceptance criteria testability, measurable Definition of Done indicators
10. **Placeholders** — TODO markers, unresolved decisions, vague adjectives ("robust", "intuitive") without quantification

**Question generation rules:**
- Maximum 5 questions total per clarify session (maximum 10 across full session)
- Each question must be answerable with: a short multiple-choice (2–5 options), OR a ≤5-word phrase
- Only ask questions whose answers materially impact architecture, data modeling, task decomposition, UX behavior, or compliance
- Present **exactly ONE question at a time** — wait for the answer before asking the next
- For multiple-choice: analyze options and suggest the best one with rationale before asking the user to confirm or override
- Select questions by highest `(Impact × Uncertainty)` score across unresolved categories
- Skip questions already answered in the user's prior input

**After each answer:** Update the in-progress spec or FRS section immediately. Do not defer encoding until all questions are answered.

**Warning:** If the user explicitly skips clarification, proceed but note: "Downstream rework risk increases without clarification."

---

## `/constitution` — Design Governance

**Purpose:** View or amend the OpenELIS design constitution at `memory/constitution.md`.

**To view:** Summarize all seven principles with their key MUST statements.

**To amend:**
1. Identify every placeholder or principle to change
2. Determine version bump: MAJOR (principle removal/redefinition) / MINOR (new principle) / PATCH (wording fix)
3. Draft the updated principle with MUST/SHOULD normative language — no vague terms ("should", "ideally")
4. Propagate: check that `references/frs-template.md`, `references/carbon-anti-patterns.md`, and the analyze command's detection passes still align
5. Produce a Sync Impact Report listing: version change, modified principles, files updated, follow-up TODOs
6. Write the updated constitution back to `memory/constitution.md`
7. Output a commit message: `docs: amend constitution to vX.Y.Z ([summary of change])`

**Conflict rule:** When a spec or design element conflicts with a MUST, the spec changes.
The constitution does not bend. If a principle needs revision, do it explicitly via `/constitution`.

---

## `/specify` — FRS + Mockup + Preview Generation

Guided three-stage workflow to produce a complete FRS + React mockup + visual HTML preview.

### Stage 1: Context Gathering

Run `/clarify` first if the request has ambiguous scope (see taxonomy above).

Invite a context dump: ask the user to brain-dump everything they know — pain points, data fields, existing workarounds, regulatory constraints, reference artifacts (Excel, paper forms, screenshots). Then ask 5–8 gap-filling questions.

### Stage 2: Design Brief (required before any JSX)

Constitution Principle 7 mandates this. Commit in writing to:
- **Purpose:** What workflow problem does this UI solve?
- **Primary user action:** Single most important thing a user does
- **Layout pattern:** Admin config table / Workbench + sidebar / Dashboard / Wizard / Inline editor
- **Interaction model:** Inline expansion / Collapsible sections / Tabs
- **Scope boundary:** What explicitly does NOT appear
- **Carbon components:** List the 4–6 primary components before writing code
- **IA Placement:** *(see IA Placement Conventions below)* declare three things together:
  1. **SideNav placement** — the full menu path: top-level group → parent → sibling order (e.g. `Admin → Configuration → Application Properties`, listed after `Print Layout`)
  2. **Breadcrumb trail** — the exact crumb chain rendered at the top of the page, including the active leaf (e.g. `Home / Admin / Configuration / Application Properties`)
  3. **URL route** — the stable, well-formed URL the dev should wire up. Must match an existing pattern (see conventions). Call out the route in `code formatting`, e.g. `/MasterListsPage/commonproperties`. If extending an existing page, reuse its URL; if new, pick the pattern that fits the closest neighbor.
- **Permissions & Audit:** *(see `references/permissions-and-audit.md`)* declare four things together:
  1. **Role attachment** — which existing role bundle(s) grant access to this feature. Default to attaching to an existing role (Reception / Analyst / Validator / Provider / Admin / Test Catalog Manager / EQA Provider). **Do not invent granular permission keys** — OpenELIS uses binary admin + per-module role bundles, not per-action keys.
  2. **Roles Builder additions** — if the feature introduces a new module-level grant that admins toggle per role, declare: grant label (with i18n key), default role assignments on upgrade, and where it appears on the Roles Builder page. If no new grant is needed, state that explicitly: "None — accessible via existing `[Role]` bundle."
  3. **Audit events** — for each user action that changes state, declare the `audit_trail` entry: action verb (e.g. `LABEL_PRESET_UPDATED`), target entity type/id, short payload summary, actor (auto-captured from Spring Security). Don't audit reads; do audit configuration changes, validations, state transitions, exports, and security-relevant events.
  4. **Envers coverage** — for each new entity introduced, declare whether it gets `@Audited` (Hibernate Envers row-level history). Default yes for configuration/clinical/patient data; default no for transient or high-churn entities.

Share the brief. Adjust on feedback. Then produce the deliverables.

### IA Placement Conventions

A spec without a declared SideNav slot, breadcrumb, and URL is incomplete — devs will guess, and the result is fragmented IA and unstable URLs. These three items always travel together and must match each other (the breadcrumb chain and SideNav path describe the same hierarchy; the URL is what loads that page).

**Source of truth for current patterns:** the live testing instance at `https://testing.openelis-global.org` plus the verified route snapshot in `references/admin-ia-inventory.md` (self-contained in this skill; mirrors the `openelis-test-catalog-qa` Section 4 inventory). **Always verify against the live app** before declaring a route — memory of URL patterns can be stale. Open the existing page closest to your new feature and copy the pattern (including the exact `editorKey`, which is often not the feature's plain name — Application Properties is `commonproperties`).

**URL patterns currently in use (verify each against live — see `references/admin-ia-inventory.md` for the full route table):**

| Pattern | When to use | Example |
|---|---|---|
| `/MasterListsPage/<editorKey>` | React admin editor under the "Master Lists" admin shell (the common case) | `/MasterListsPage/commonproperties` |
| `/<Resource>` | Dedicated top-level React page | `/Alerts`, `/Inventory`, `/analyzers` |
| `/<Resource>Edit?id=<uuid>` | Per-record editor opened from a list | `/SystemUserEdit?id=...` |
| `/api/OpenELIS-Global/<Page>` | Legacy JSP shell — only reference for not-yet-migrated pages | `/api/OpenELIS-Global/ProviderMenu` |

> ⚠ The admin shell uses a **path segment** (`/MasterListsPage/<editorKey>`), **not** a query
> string (`?type=`). Earlier versions of this skill taught the `?type=` form — it's wrong
> against the live app. IDs still go in query strings (`?id=<uuid>`).

**Well-formed URL rules:**
- Match the casing and separator of the closest neighbor. Don't mix kebab-case routes into a camelCase neighborhood (or vice versa) for cosmetic reasons.
- The `editorKey` path segment must be a stable identifier — the same string the menu item links to and the breadcrumb leaf maps to via i18n. Copy it exactly from the inventory; don't auto-generate or guess it from the feature name.
- Path segments must be stable across navigations. No session IDs, no auto-incrementing screen tokens.
- IDs go in query strings (`?id=<uuid>`), never as path segments, to stay consistent with existing editors.
- Deep-linkable: pasting the URL into a new tab must load the same view. If the page has tabs or filters that matter to the bookmark, declare which ones get encoded into the URL.
- One canonical URL per page. If a page can be reached two ways, mark one canonical and have the other redirect.

**SideNav rules:** Reuse an existing group/parent — don't invent a new top-level. The global Admin SideNav buckets are **Config / Organization / Resources / Automation / Compliance** (these are GLOBAL groupings, not editor-internal — see `feedback_admin_ia_vs_editor_ia` in memory). Multi-view screens use SideNav submenus, not in-page Carbon Tabs (see `feedback_openelis_sidenav_submenus`). If a feature genuinely has no home in the existing tree, flag it explicitly in the brief as an IA gap and propose the new group rather than silently inventing one.

**Breadcrumb rules:** Always start at `Home`. The chain must match the SideNav path exactly — same labels, same casing, same order. Every crumb must have an i18n key (declared in the FRS Localization table). The active leaf is the page title.

**Where this appears in the deliverables:**
- **FRS:** Add the SideNav placement, breadcrumb chain, and URL near the top of the Overview section (or as a small "Navigation & URL" subsection if the feature touches multiple pages). The i18n keys for breadcrumb labels go in the Localization table.
- **Mockup (JSX):** Render the breadcrumb using `<Breadcrumb>` + `<BreadcrumbItem>` from `@carbon/react` at the top of the page. Put the declared URL in a leading comment so it survives copy/paste:
  ```jsx
  // Route: /MasterListsPage/commonproperties
  // SideNav: Admin → Configuration → Application Properties
  ```
- **HTML preview:** Echo the route in the preview banner so reviewers see it without opening the JSX.
- **Jira story:** Include the route and SideNav path in the description so the implementing dev has it at hand.

### Stage 3: Three Deliverables (FRS + Mockup + Preview)

Always produce all three together unless the user explicitly asks for only some.

**FRS structure:** See `references/frs-template.md`. The FRS opens with a **Lab Context** section (see below), followed by Overview, User Stories, Functional Requirements, and the rest of the standard sections (including the mandatory Localization table).

**Lab Context (MUST — first section of every FRS):** Before any other content, the FRS opens with a `## Lab Context` section written in plain English for a developer who has never set foot in a clinical laboratory. Three required subsections, in this order:

1. **Current State** — How the lab handles this workflow today. What tools, paper forms, spreadsheets, instrument printouts, or workarounds are in use. Who does it (which role), when in their day, and how often.
2. **Pain** — Specifically what is slow, error-prone, unsafe, or just frustrating about the current state. Use concrete examples (e.g. *"techs hand-transcribe AST results from instrument printouts into Excel and email the file to the validator; transcription errors caught at validation force a full retest"*), not vague adjectives like "inefficient" or "suboptimal".
3. **What Changes** — In plain English, what the lab's day looks different once this feature ships. Not "implements X feature" — describe the workflow shift (e.g. *"AST results flow from the analyzer straight into the validation queue; no manual transcription, no email, validator sees results in real time and can release the report the same shift"*).

Writing rules for Lab Context:
- No unexplained jargon. Expand acronyms on first use (AST = Antimicrobial Susceptibility Testing). Assume the reader has never worked in a clinical lab.
- No cross-references to other parts of the spec (no *"as per FR-3"*, no *"see Data Model"*).
- No vague adjectives in place of concrete examples ("robust", "efficient", "improved" — say *what specifically* is slow and *by how much*).
- 1–2 short paragraphs per subsection. A backend dev with no LIMS background should be able to read the whole Lab Context in under 90 seconds and understand both what they're building and why.

This section is the developer's onboarding to the feature. Everything below — User Stories, Functional Requirements, Data Model — assumes the reader has read and understood Lab Context first.

**User Stories:** Immediately after Overview and before Functional Requirements, include a **User Stories** section listing 2–5 "As a [role], I want to [action] so that [outcome]" statements that frame the feature from the user's perspective. User Stories complement Lab Context — Lab Context is the workflow narrative; User Stories are the per-role goals.

**FRS stays version-agnostic.** The FRS describes the full feature. Version boundaries (v1, v2, v3) are decided downstream in `/breakdown`, not in the FRS. This lets the breakdown plan re-slice without rewriting the spec.

**Mockup:** See React/Carbon Patterns section below. Save as `[feature-name]-mockup.jsx`. The mockup also stays version-agnostic — show the full feature; `/breakdown` decides what lands in v1 vs v2.

**Visual preview — required every time:** After writing the JSX mockup, always produce a
`[feature-name]-preview.html` file. The JSX file is the implementation artifact; the preview
is what lets the user **see the design right now** without any build step. Save it to the
workspace folder and share a `computer://` link right away in your reply. See the HTML
Preview Pattern section below.

**Jira handoff:** `/specify` does NOT create Jira tickets. After delivering the FRS, mockup, and preview, ask: *"Happy with the FRS, mockup, and preview? When you give the green light I'll run `/breakdown` to slice this into an Epic with versioned sprint stories."*

All Jira creation (Epic + child Stories with version labels) happens in `/breakdown`. Metadata gathering (epic linkage, labels, assignee) also moves to `/breakdown` — see that command for details.

---

## `/analyze` — Cross-Artifact Consistency Report

**Purpose:** Non-destructive quality scan across FRS, mockup, and (if it exists) the breakdown plan after `/specify`. Constitution violations are automatically CRITICAL. Run this before `/breakdown` so the breakdown plan isn't built on a broken FRS/mockup.

**Detection passes:**

**A. i18n Compliance** (Constitution Principle 1)
- Every visible JSX string wrapped in `t(key, fallback)`?
- Every key named with correct `[category].[feature].[identifier]` convention?
- Every key present in FRS Localization table?

**B. Carbon Fidelity** (Constitution Principle 2)
- Status indicators using Carbon `Tag` with correct `kind`?
- `DataTable` used for all tabular data?
- No hardcoded colors or magic spacing values?
- No Bootstrap/Tailwind/external CSS classes?
- Built-in Carbon validation props used (not custom error divs)?
- See `references/carbon-anti-patterns.md` for full catalog

**C. Interaction Pattern Consistency** (Constitution Principle 3)
- Edit forms using inline row expansion (not modals)?
- Modals used only for destructive confirmations or 5+ section forms?
- `Accordion` used for optional/advanced config?

**D. Constitution Alignment** (upstream Principles I–X + design-addendum MUSTs)
- Any requirement or design element conflicting with a MUST?
- Write operations attached to an existing role bundle, with no invented per-action permission keys (Principle VIII)?
- Design brief produced before code (Principle IX / Stage 2)?
- **Design-addendum MUSTs** (see `memory/design-addendum.md`): hard "Delete" on a domain record → CRITICAL; domain-record list with no show/hide-deactivated affordance → MEDIUM (No-Hard-Delete). Static dropdown over a large/growing set → MEDIUM; inline "create heavy entity" flow → MEDIUM (Design-for-Large-Catalogs).

> The No-Hard-Delete and Design-for-Large-Catalogs principles, plus data-reuse, no-multitenancy, and shipped-app-as-style-source, are defined in `memory/design-addendum.md`. They are candidates to upstream into the engineering constitution via the repo's amendment process; until then the addendum is this skill's authority and its MUST violations are CRITICAL here.

**E. Coverage Gaps**
- Every FRS requirement has a corresponding UI element in mockup?
- Every UI element in mockup traces to a requirement?
- Every Jira acceptance criterion traces to an FRS requirement?

**F. Cross-Module Harmonization**
- Shared concepts (resistance status, QC badges, validation levels) rendered identically to existing modules?
- Terminology consistent across FRS, mockup, and Jira story?
- Data entities referenced in mockup present in FRS Data Model?

**G. Invented Data** (design-addendum MUST A)
- Every form field, table column, and badge in the mockup traces to a real OpenELIS entity?
- Any "plausible-looking but not in schema" fields (e.g. invented enums, made-up attributes)?
- Where new data is needed, is it declared in the FRS Dependencies section as a named entity/attribute?
- Auto-CRITICAL: any unflagged invented field.

**H. Multitenancy Smell** (design-addendum MUST B)
- Any "Lab selector", "Site:" filter, "Tenant:" dropdown, or cross-organization view in the mockup?
- Any FRS language implying multiple labs share a deployment or that data is scoped by site?
- Note: referral relationships (sample sent to external lab) are FHIR referrals, NOT multitenancy — those are fine.
- Auto-CRITICAL: any multitenancy UI element.

**I. Stubbed Preview Sections**
- Does the HTML preview have any section with placeholder copy ("[content for Section X]", "TODO", a single dummy row)?
- For multi-section features (tabs, accordion panels, sidenav submenus, wizard steps), is every section populated with realistic content?
- If a section is genuinely out of scope, is it declared out of scope in the FRS *and* removed from the preview (not left as a stub)?
- Auto-CRITICAL: any stubbed section in the preview that isn't declared out of scope.

**J. Permissions / Role Attachment** (see `references/permissions-and-audit.md`)
- Does the FRS declare which existing role bundle(s) grant access?
- Are any invented per-action permission keys present (e.g. `results.validate`, `test.create` as enforced strings)? OpenELIS uses binary admin + module-bundle roles, not granular keys — flag any invented key as CRITICAL.
- If a new Roles Builder grant is proposed, are the grant label (with i18n key), default role assignments on upgrade, and Roles Builder UI placement all declared?
- Is there a role matrix proposed for a feature that lives wholly inside one role's workflow? (Unnecessary — the role's bundle already covers it.)
- Auto-CRITICAL: write actions with no declared role attachment, OR any invented per-action permission key.

**K. Audit Trail Coverage** (see `references/permissions-and-audit.md`)
- For every user action that changes state (writes, validations, status transitions, exports, configuration changes, security events), is an `audit_trail` entry declared?
- Does each declared entry have: action verb, target entity type/id, payload summary, and actor source?
- Are any reads/getters being audited unnecessarily? (Audit only state changes and security-relevant events.)
- Does any audit payload include PII beyond what's needed to identify the target? (Entity id + type is enough.)
- Auto-HIGH: state-changing actions with no audit_trail declaration. Auto-CRITICAL: audit payloads with unnecessary PII, or any proposal for a parallel audit table.

**L. Envers Coverage** (see `references/permissions-and-audit.md`)
- For every new entity introduced by the spec, is `@Audited` coverage declared (yes/no with rationale)?
- Default expectation: yes for configuration / clinical / patient entities; no for transient or high-churn entities.
- Auto-MEDIUM: new entities with no Envers declaration. Auto-HIGH: clinical/patient entities explicitly opted out of Envers without strong justification.

**M. Breakdown Plan Coverage** (only if a `[feature-name]-breakdown.md` exists)
- Does every FR in the FRS appear in at least one version of the breakdown plan?
- Does every UI element in the mockup get built by at least one story in the breakdown plan?
- Are all cross-cutting concerns (i18n keys, permissions, audit_trail entries, Envers config) assigned to specific stories?
- Does any version exceed 20 story points without a declared `over-capacity: justified` reason?
- Is v1 a thin shippable slice (not "backend only" or "frontend only")?
- Auto-HIGH: FRs or UI elements not assigned to any story. Auto-MEDIUM: over-capacity versions without justification.

**N. Lab Context Coverage** (FRS opening section)
- Does the FRS open with a `## Lab Context` section *before* the Overview?
- Does it have all three subsections in order: Current State, Pain, What Changes?
- Is the writing plain English? Flag any unexpanded acronym on first use (AST, EQA, AMR, QC, LOINC, FHIR, etc. should all have a one-time inline expansion when introduced).
- Is the Pain subsection concrete? Flag vague adjectives like "inefficient", "suboptimal", "cumbersome", "robust", "improved" that aren't backed by a concrete example or number.
- Does Lab Context cross-reference other parts of the spec (e.g. "as per FR-3", "see Data Model")? It shouldn't — it must stand on its own.
- Could a backend developer with no LIMS background read this section in under 90 seconds and explain what the lab does today and what changes? If not, flag it.
- Auto-HIGH: missing Lab Context section, or any of its three subsections absent.
- Auto-MEDIUM: present but written in jargon, full of vague adjectives, or relying on cross-references to other FRS sections.

**Severity assignment:**

| Severity | Criteria |
|---|---|
| **CRITICAL** | Violates a constitution MUST, or requirement with zero coverage blocking core functionality |
| **HIGH** | Conflicting requirements, missing permission enforcement, untestable acceptance criterion |
| **MEDIUM** | Terminology drift, missing non-functional coverage, underspecified edge case |
| **LOW** | Wording improvement, minor redundancy, polish |

**Output format:**
```markdown
## Spec Analysis: [Feature Name]

### Summary
[2–3 sentences on overall quality and top issues]

### Findings

| ID | Pass | Location | Issue | Severity | Fix |
|---|---|---|---|---|---|
| F-01 | i18n | ResultTable | 'Susceptible' hardcoded | CRITICAL | t('label.ast.susceptible', 'Susceptible') |
| F-02 | Carbon | EditForm | Modal used for 5-field edit | HIGH | Replace with inline row expansion |

### Constitution Violations
[List any CRITICAL findings that violate a MUST — these block delivery]

### Recommended Fix Order
1. [All CRITICAL items — must fix before proceeding]
2. [HIGH items]
3. [MEDIUM / LOW items]
```

After the report, offer to apply all CRITICAL fixes immediately, then HIGH fixes in a second pass.

---

## `/checklist` — Requirements Quality Gate

**Purpose:** Generate a domain-specific checklist that functions as **"unit tests for English"** —
validating that the FRS is well-written, complete, and unambiguous, before a Jira story is created
and implementation begins. This is NOT a QA/testing checklist.

**Checklist items validate requirements quality:**
- ✅ "Are error state requirements defined for all form fields?" (completeness)
- ✅ "Is 'fast load' quantified with a specific latency target?" (clarity)
- ✅ "Are permission states consistent across all sections?" (consistency)
- ✅ "Does the spec define behavior when [edge case] occurs?" (coverage)

**NOT:**
- ❌ "Verify the button clicks correctly" — that's QA testing
- ❌ "Confirm the API returns 200" — that's integration testing
- ❌ "Check that validation messages appear" — that's functional testing

**Generation process:**
1. Read the FRS and extract feature domain keywords (auth, results, AMR, validation, reporting, analyzer, admin…)
2. Derive up to 3 clarifying questions about checklist scope:
   - Depth: lightweight pre-spec sanity vs formal release gate?
   - Audience: author self-check, peer review, or QA handoff?
   - Risk areas: which domains need mandatory gating checks?
3. Generate 15–30 checklist items organized by category. Use domain signals from the FRS.
4. For OpenELIS features, always include these mandatory categories:

**Mandatory checklist categories for OpenELIS:**

```markdown
### Lab Context (developer onboarding narrative)
- [ ] Is there a `## Lab Context` section as the FIRST section of the FRS, before Overview?
- [ ] Does it cover all three subsections: Current State, Pain, What Changes?
- [ ] Is every acronym expanded on first use (AST, EQA, AMR, QC, LOINC, FHIR, etc.)?
- [ ] Is the Pain section grounded in concrete examples, not vague adjectives?
- [ ] Could a backend dev with no LIMS background read it in under 90 seconds and understand what the lab does and what changes?

### i18n / Localization
- [ ] Are all UI strings represented in the Localization section with i18n keys?
- [ ] Are error messages, button labels, placeholders, and headings all covered?
- [ ] Are all i18n keys named consistently ([category].[feature].[identifier])?

### Permissions & Security
- [ ] Is a permission key defined for every write action?
- [ ] Is UI-layer enforcement (hide/disable) specified for each permission?
- [ ] Is API-layer enforcement (HTTP 403) specified for each permission?

### Carbon Design System
- [ ] Are all status indicators mapped to Carbon Tag kinds?
- [ ] Is inline row expansion used for edit forms (not modals)?
- [ ] Is the admin table column pattern followed if this is a config page?

### Acceptance Criteria Quality
- [ ] Are all acceptance criteria testable (observable, specific, falsifiable)?
- [ ] Does each criterion trace to a functional requirement?
- [ ] Are edge cases and error paths included, not just happy path?

### FRS–Mockup Alignment
- [ ] Does every requirement have a corresponding UI element?
- [ ] Does every UI element trace to a requirement?
- [ ] Are all data model fields visible in the mockup?
```

---

## `/breakdown` — Epic + Versioned Sprint Plan

**Purpose:** Slice an approved FRS + mockup into one Jira Epic and a versioned set of
child Stories that fit 2-week sprints. `/breakdown` is the **only command that creates
Jira tickets**. Run it after `/specify` (and ideally after `/analyze` clears CRITICAL
findings).

**Core principles:**

1. **One mockup → one Epic.** Every mockup that ships gets its own Epic. The Epic is the
   feature; child Stories are the work that builds it. Even a tiny feature still gets an
   Epic with v1 only — the invariant holds.
2. **A version is a functional slice.** v1 must be a thin end-to-end slice that's
   shippable and usable on its own (e.g. read-only list). v2 builds on v1 (e.g. inline
   edit). v3 builds on v2 (e.g. bulk actions). Never "v1 = backend, v2 = frontend" —
   that produces unshippable intermediate states.
3. **Each version fits in one ~2-week sprint with a target of 20 story points,** sized
   using the Fibonacci scale (1, 2, 3, 5, 8, 13). A small feature has only v1; a large
   feature may have v1 → v2 → v3 (or more). Each version's points sum to ≤20 unless
   explicitly justified.
4. **Cross-cutting work rolls into the functional story that touches it.** i18n keys,
   permission wiring, `audit_trail` entries, and Envers config are *not* separate
   stories — they live in the acceptance criteria of whichever functional story
   introduces them.
5. **FRS stays version-agnostic.** Functional requirements describe the full feature.
   Version boundaries are decided here in the breakdown plan, not in the FRS. This lets
   you re-slice (combine v2+v3, split v1 into v1a/v1b) without rewriting the FRS.
6. **Plan first, Jira after approval.** `/breakdown` produces a markdown plan and waits
   for Casey's green light before touching Jira. Same gate as the FRS/mockup approval.

7. Size to the implementation pipeline. When the implementer is Claude Code (agentic) rather than a human team, size each slice to one reviewable PR ("one branch, one PR, one review"), not to story points. Prefer fewer, larger-but-coherent vertical slices (often ~5–7 for a feature that would be ~14 human stories), because an agent implements a bigger coherent chunk in one pass than a human fits in a sprint. Story points and the 20-point/2-week target are human-planning artifacts; for an agent pipeline, replace "≤20 points per version" with "each slice is a PR a reviewer can actually read in one sitting."
The breakdown is what enables small PRs — it does not happen automatically. Pointing Claude Code at a whole Epic produces one unreviewable chunk. Drive it slice-by-slice, one PR per slice.
Every slice must still be: independently shippable, dependency-ordered (never needs an unbuilt dependency), and carry explicit, machine-checkable acceptance criteria so CI and the reviewer can confirm it. Reviewability of the diff matters more with an AI implementer, not less — the diff is where subtle errors are caught.



Note for existing breakdowns

Re-slice over-granular existing breakdowns against this principle. Known offender: the AMR review workflow micro-module breakdown.

### Stage 1: Slice the feature into versions

Read the approved FRS and mockup. Identify the *thinnest end-to-end slice* that delivers
value on its own — that's v1. Then identify the next slice that builds on v1 — that's
v2. Continue until every FR from the FRS is covered.

**Heuristics for good slice boundaries:**

- **Read before write.** v1 = view/list/dashboard. v2 = create/edit. v3 = delete/bulk/admin.
- **Single record before batch.** v1 = one at a time. v2 = bulk select + batch actions.
- **Manual before automated.** v1 = user clicks a button. v2 = scheduled job / auto-trigger.
- **Core before edge cases.** v1 = happy path + the two most common error states.
  v2 = remaining edge cases, retries, recovery flows.
- **Configuration before operation.** Admin-config pages frequently land as v1 of a
  feature so the schema/lookup data is in place before the operational workflow ships
  in v2.

**Anti-patterns to reject:**

- **Backend-only v1 with no UI.** Never shippable on its own. Both backend and frontend
  for the v1 slice must ship together.
- **"v1 = MVP, v2 = polish."** Too vague — each version has to be a concrete functional
  cut, not a maturity level.
- **Forward dependencies.** A version may depend on past versions, never on future ones.
  If v1 needs something from v2 to be usable, the slice boundary is wrong.

### Stage 2: Estimate each story in story points

For each version, decompose the work into 3–6 child Stories. Estimate each in Fibonacci
points using this rubric:

| Points | Size | Typical scope |
|---|---|---|
| 1 | Trivial | Add a column to an existing table; rename an i18n key |
| 2 | Small | New form field with validation; one new API DTO field |
| 3 | Standard | New admin row editor for an existing entity; one new GET endpoint with paging |
| 5 | Medium | New page with table + filter + inline edit; new POST + audit_trail wiring |
| 8 | Large | New entity (schema + Envers + DAO + service + REST + React page) |
| 13 | XL — should usually be split | Cross-module workflow spanning 3+ entities, or a wizard with persistence between steps |

A story estimated at 13 should almost always be split into two ≤8s. Anything above 13 is
too big — break it up before continuing.

**Cross-cutting work is already inside each estimate.** A "new admin row editor" at 5
points already includes its i18n keys, permission check (existing role bundle), and
`audit_trail` entry. Do not add separate stories for these. The acceptance criteria of
the functional story spell them out.

### Stage 3: Check capacity, propose splits if needed

Sum the points per version. Target: **≤20 points per version**.

If a version exceeds 20, the skill MUST flag it and propose a split:

1. State the overage clearly: *`v1 totals 28 points — over the 20-point sprint target.`*
2. Propose a concrete split with rationale: *`Proposed split — v1a (read-only list + filter, 13 pts) ships sprint 1; v1b (inline edit + audit, 15 pts) ships sprint 2.`*
3. Ask Casey to approve the split, override (with a one-line `over-capacity: justified` reason for tightly-coupled work that can't slice cleanly), or re-slice manually.

If a version is under 10 points, flag it too: *`v3 totals 8 points — may have headroom to absorb v4 work or fold into v2.`* Don't auto-merge; just surface the option.

If the pipeline is Claude Code, the capacity check is "is this slice a reviewable PR?" not "≤20 points." Flag and consolidate over-granular stories (many 1–2 point micro-stories that would each be a trivial PR) into coherent PR-sized slices. Flag the opposite too: a slice whose diff a human couldn't review in one sitting should still be split.

### Stage 4: Output the breakdown plan

Produce a markdown file named `[feature-name]-breakdown.md` with this structure:

````markdown
# [Feature Name] — Story Breakdown

**Mockup:** `[feature-name]-mockup.jsx`
**FRS:** `[feature-name]-frs.md`
**Total versions:** [N]
**Total points:** [sum]
**Sprints required (estimate):** [N × 2-week sprints]

## Epic
**Title:** [feature name as it will appear in Jira]
**Description summary:** [1–2 sentences from the FRS Overview]
**Parent / linked program epic (optional):** [e.g. OGC-527 Environmental/Vector, or "none"]
**Labels:** [country, domain, compliance tags — propagated to every child story]

## v1 — [slice name, e.g. "Read-only list + filter"]
**Sprint target:** 20 points
**Actual:** [sum] points

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| Render lab section table with paging | 5 | FR-1, FR-2 | i18n keys `label.foo.*`, view permission via Analyst bundle |
| Filter by status + section dropdown | 3 | FR-3 | i18n keys `filter.foo.*` |
| ... | ... | ... | ... |

## v2 — [slice name, e.g. "Inline edit + audit"]
...

## Coverage check
- Every FR from the FRS appears in at least one version: ✅ / ❌ (list gaps)
- Every UI element in the mockup is built by at least one story: ✅ / ❌
- All cross-cutting concerns assigned:
  - i18n keys: ✅ (per-story)
  - Role attachment: ✅ (`[role bundle name]` on all write stories)
  - `audit_trail` entries: ✅ (per state-changing story)
  - Envers coverage: ✅ ([entity list with @Audited status])
````

Save the plan to the workspace folder and share a `computer://` link in your reply.

### Stage 5: Get approval, then create Jira

**⚠ Do not create any Jira tickets until Casey has explicitly approved the breakdown plan.**

After delivering the plan, ask: *"Happy with the breakdown? When you give the green light I'll create the Epic and child Stories in Jira."*

Once approved, gather the remaining Jira metadata. Ask **three questions, one at a time:**

1. **Parent / linked program epic** — Suggest the most likely existing umbrella epic
   based on feature domain (e.g. OGC-527 for Environmental/Vector, OGC-354 for Sample
   Collection, OGC-517 for Results). The new mockup-Epic gets linked to this via a Jira
   "is part of" link, **not** a parent-child epic nest (Jira's epic hierarchy is flat by
   default). Casey can decline if the mockup is standalone.

2. **Labels** — Suggest 3–5 labels combining country/deployment context (e.g.
   `Madagascar`, `Indonesia`, `global`), domain attribute (e.g. `vector`,
   `environmental`, `blood-bank`), and compliance/program tags (e.g. `iso-15189`,
   `SILNAS`). These labels go on the Epic *and* are propagated to every child Story.

3. **Assignee (optional)** — Default unassigned. If the feature domain matches a known
   contributor pattern (e.g. Piotr for front-end Carbon components), note the suggestion
   but don't assume.

Then create the tickets in this order:

1. **Create the Epic** (issue type `Epic`):
   - Title: the feature name.
   - Description: FRS Overview + link to the FRS and mockup files in the gallery + link to the breakdown plan.
   - Labels: from question 2.
   - Optional "is part of" link to the program epic from question 1.

2. **For each version, create the child Stories** under the Epic. For each Story:
   - **Title format:** `[feature]: [story summary] (v1)` — the `(v1)` / `(v2)` / `(v3)` suffix is mandatory and matches the version label.
   - **Labels:** the Epic's labels **plus** a version label (`v1`, `v2`, `v3`, etc.). The version label is what enables sprint filtering in Jira.
   - **Description:** Use `references/jira-template.md`. Acceptance criteria must trace to the FRs listed for that story in the breakdown plan. Include the route, SideNav path, and the cross-cutting concerns (i18n key list, role attachment, audit_trail entries, Envers flag) so the implementing dev has it at hand.
   - **Epic Link:** Set to the newly-created mockup-Epic.
   - **Story Points:** Set to the Fibonacci estimate from the breakdown plan.

3. **Confirm the result.** Report the Epic key and a per-version count of child Stories created. Share Jira links.

### Output: relationship to other commands

| Step | Produced by | When | Creates Jira? |
|---|---|---|---|
| FRS, mockup, preview | `/specify` | First | No |
| Quality report | `/analyze` | After /specify — fix CRITICALs before /breakdown | No |
| Requirements quality checklist | `/checklist` | Optional, before /breakdown | No |
| **Epic + versioned child stories** | **`/breakdown`** | **Last — the only Jira-creating step** | **Yes** |

If a feature truly fits in one sprint (≤20 points, one version), `/breakdown` still
runs — it just produces an Epic with v1 only. This keeps the one-mockup-one-Epic
invariant intact and makes future scope expansion (adding v2 later) frictionless.

---

## React + Carbon Mockup Patterns

### Standard Import Block

```jsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack, SideNav, SideNavItems, SideNavMenuItem, SideNavMenu,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Checkbox, RadioButton, RadioButtonGroup, DatePicker, DatePickerInput, MultiSelect,
  Button, IconButton, InlineNotification, Tag, Modal, Loading, Accordion, AccordionItem,
  Tile, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem,
} from '@carbon/react';
import { Add, Edit, TrashCan, ChevronDown, ChevronUp, Download, Save, Renew } from '@carbon/icons-react';
```

### i18n Helper (top of every component)

```jsx
const t = (key, fallback) => fallback || key;
```

### Status Badge Mapping (Carbon Tag kinds)

| Status | kind |
|---|---|
| Susceptible / Positive / Pass | `green` |
| Resistant / Fail / Critical | `red` |
| Intermediate / Borderline | `warm-gray` |
| In Progress / Draft | `blue` |
| Pending / In Queue | `purple` |
| QC Pass / Verified | `teal` |
| Unknown / Indeterminate | `gray` |

### Inline Row Expansion Pattern

```jsx
const [expandedRow, setExpandedRow] = useState(null);
const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

// In table body:
<TableRow key={row.id}>
  <TableCell>
    <Button kind="ghost" size="sm" onClick={() => toggleRow(row.id)}
      renderIcon={expandedRow === row.id ? ChevronUp : ChevronDown}>
      {t('button.edit', 'Edit')}
    </Button>
  </TableCell>
</TableRow>
{expandedRow === row.id && (
  <TableRow>
    <TableCell colSpan={headers.length + 1}>
      <Tile style={{ padding: '1rem' }}>
        <Grid><Column lg={8}><TextInput ... /></Column></Grid>
        <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
          <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
          <Button kind="ghost" size="sm" onClick={() => setExpandedRow(null)}>{t('button.cancel', 'Cancel')}</Button>
        </Stack>
      </Tile>
    </TableCell>
  </TableRow>
)}
```

---

## HTML Preview Pattern

The JSX mockup is the implementation artifact. The HTML preview is what lets the user
**see the design right now** — no Node.js, no npm install, no build pipeline. Open it
in any browser and it renders immediately.

The reason a dedicated preview is needed: `@carbon/react` is an npm package, not
available on CDN. The preview instead uses CDN-hosted React + Babel + Carbon CSS, and
builds the UI using Carbon CSS classes directly on plain JSX elements. The visual result
is near-identical — same typography, same color tokens, same spacing, same look.

### CDN resources to load

```html
<!-- Carbon Design System CSS — same visual tokens as @carbon/react -->
<link rel="stylesheet" href="https://unpkg.com/@carbon/styles@1/css/styles.min.css">

<!-- React + ReactDOM -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" crossorigin></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" crossorigin></script>

<!-- Babel standalone — transpiles JSX in the browser, no build step needed -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
```

Write all component code inside `<script type="text/babel">`.

### Carbon CSS class mappings

These classes produce the same visual output as their @carbon/react counterparts:

| @carbon/react component | CSS class(es) for preview |
|---|---|
| `<Tile>` | `cds--tile` |
| `<Button kind="primary">` | `cds--btn cds--btn--primary` |
| `<Button kind="secondary">` | `cds--btn cds--btn--secondary` |
| `<Button kind="ghost">` | `cds--btn cds--btn--ghost` |
| `<Button kind="danger">` | `cds--btn cds--btn--danger` |
| `<Tag kind="green">` | `cds--tag cds--tag--green` |
| `<Tag kind="red">` | `cds--tag cds--tag--red` |
| `<Tag kind="blue">` | `cds--tag cds--tag--blue` |
| `<Tag kind="purple">` | `cds--tag cds--tag--purple` |
| `<Tag kind="warm-gray">` | `cds--tag cds--tag--warm-gray` |
| `<Tag kind="teal">` | `cds--tag cds--tag--teal` |
| `<Tag kind="gray">` | `cds--tag cds--tag--gray` |
| `<DataTable>` + `<Table>` | `<div class="cds--data-table-container"><table class="cds--data-table">` |
| `<TableHead>` / `<TableHeader>` | `<thead>` / `<th>` |
| `<TableBody>` / `<TableRow>` / `<TableCell>` | `<tbody>` / `<tr>` / `<td>` |
| `<InlineNotification kind="error">` | `cds--inline-notification cds--inline-notification--error` |
| `<InlineNotification kind="success">` | `cds--inline-notification cds--inline-notification--success` |
| `<InlineNotification kind="info">` | `cds--inline-notification cds--inline-notification--info` |
| `<Select>` | `<div class="cds--select"><select class="cds--select-input">` |
| `<Accordion>` | `<ul class="cds--accordion">` |
| `<TextInput>` | `<div class="cds--text-input-wrapper"><input class="cds--text-input">` |

Carbon spacing variables work in inline styles since the stylesheet is loaded:
`style={{ padding: 'var(--cds-spacing-05)' }}` etc.

### Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Feature Name] — OpenELIS Preview</title>
  <link rel="stylesheet" href="https://unpkg.com/@carbon/styles@1/css/styles.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"></script>
  <style>
    body { background: #f4f4f4; margin: 0; font-family: 'IBM Plex Sans', sans-serif; }
    .preview-banner {
      background: #0f62fe; color: #fff;
      padding: 6px 1rem; font-size: 12px; font-family: monospace;
    }
    .preview-content { padding: 1rem 2rem; max-width: 1440px; margin: 0 auto; }
  </style>
</head>
<body class="cds--white">
  <div class="preview-banner">
    ⚡ Visual Preview — [Feature Name] &nbsp;|&nbsp; OpenELIS Design Mockup &nbsp;|&nbsp; Not a live application
  </div>
  <div class="preview-content" id="root"></div>
  <script type="text/babel">
    const { useState } = React;

    // Realistic mock data — use real lab names, section names, plausible numbers
    // Build component using Carbon CSS classes from the mapping table above

    function App() {
      return (
        <div>
          {/* your layout here */}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>
```

### Tips for a good preview

**Use realistic data — and flesh out every section.** Don't write "Item 1" or "Section A".
Use actual lab section names (Hematology, Microbiology, Chemistry), realistic test names, and
plausible numbers. The preview should look like a screenshot from a real deployment — that's
what helps the user evaluate whether the design works for their lab.

**No stubbed sections.** If the feature has multiple sections (tabs, accordion panels, sidenav
submenus, wizard steps), every one must be populated with realistic content — not "[content
for Section X]" or "TODO" or a single placeholder row. Reviewers can't judge a design from a
preview where most sections are stubs; they'll assume the stubbed sections aren't designed
yet, and the spec drifts. This is a CRITICAL `/analyze` finding (Pass I — Stubbed Preview
Sections). If a section genuinely isn't designed yet, declare it out of scope in the FRS and
remove it from the preview — don't ship the preview with placeholder copy in it.

**Implement interactivity.** Use `useState` for tabs, accordions, section filters, and
expandable rows. A static HTML page doesn't convey the interaction model; a page where
tabs actually switch and filters actually update is much more useful feedback.

**Match the Design Brief layout.** The layout pattern committed in Stage 2 (Dashboard /
Admin table / Workbench / Wizard) should be immediately visually recognizable in the
preview. Don't drift from the brief.

**Share the link right away.** After saving the file to the workspace folder, include the
`computer://` link in your reply so the user can open it immediately without hunting for it.

---

## Reference Files

| File | When to read |
|---|---|
| `memory/constitution.md` | **Always first** — pointer to the upstream engineering constitution (synced version + design-relevant summary + raw URL + re-sync trigger) |
| `memory/design-addendum.md` | **Always first** — skill-specific design MUSTs (data reuse, no multitenancy, shipped-app style source, no-hard-delete, large-catalogs) + standing UI/IA conventions |
| `references/current-state-gotchas.md` | During `/specify` Stage 1 and `/analyze` cross-module pass — what's built vs not built; required Dependency/Feature-Flag declarations |
| `references/permissions-and-audit.md` | During `/specify` Stage 2 (Permissions & Audit brief item) and `/analyze` Passes J/K/L — current permission scheme, Roles Builder, audit_trail + Envers infrastructure |
| `references/frs-template.md` | When writing any FRS document |
| `references/jira-template.md` | When `/breakdown` creates the Epic and child Stories |
| `references/carbon-anti-patterns.md` | During `/analyze` Carbon fidelity pass, or self-critique before delivery |
| `references/module-inventory.md` | When a feature touches an existing module — check pattern, route, and Jira anchor |
| `references/verified-data-models.md` | During `/specify` Stage 1 and `/analyze` Pass G — reuse field-verified data models instead of inventing fields |
| `references/admin-ia-inventory.md` | During `/specify` Stage 2 (IA Placement) and `/analyze` IA checks — verified admin routes + SideNav structure (self-contained; route pattern is `/MasterListsPage/<editorKey>`) |
| `references/jira-conventions.md` | During `/breakdown` and any reporting — clickable links, Done≠shipped, PR-sized slicing, labels, no-emoji, reorg proposal |