---
name: openelis-design
description: "Expert assistant for designing features in OpenELIS Global, an open-source laboratory information management system (LIMS). Use this skill whenever the user asks to design, specify, mockup, or document any feature for OpenELIS Global — including new modules, admin configuration pages, workflow improvements, analyzer integrations, or clinical data views. Also triggers for Jira story creation, FRS documents, React/Carbon mockups, or any request involving lab informatics design for OpenELIS. If the user mentions lab workflows, LIMS features, clinical lab software, or says anything about \"OpenELIS\", use this skill immediately. Also use for design critique, crosswalk analysis, harmonization reviews, or when the user asks to review, improve, or validate an existing mockup or spec."
---

# OpenELIS Global Design Skill v3.27

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
design-for-large-catalogs, reuse built mechanisms) are CRITICAL findings in `/analyze` when violated.

**Reuse rule (MUST F, summarized here):** before a design adds a store, list, setting, admin page, status set,
editor, export or job, name the built OpenELIS mechanism that already does that job (test catalog fields and reagent
links, Dictionary, Programs and questionnaires, reflex rules, analysis statuses and Validation, Workplan, `note`,
label presets, Inventory, report states, Organizations, FHIR storage) and reuse or extend it, or say why it cannot,
with the code reference checked. Checked by `/analyze` Pass O.

---

## The Seven Commands

OpenELIS design work is organized into seven commands, each with a distinct trigger and output.

| Command | Trigger phrase | What it does |
|---|---|---|
| `/clarify` | "What do I need to decide?", "Am I missing anything?", new feature with gaps | Structured ambiguity scan → up to 5 questions → answers encoded into spec |
| `/crosscheck` | "Does this overlap anything?", "Are we contradicting a past decision?", "What depends on this?", new feature at brief time | Portfolio scan: overlaps, decision contradictions, and up/downstream dependencies against the decision log + spec registry |
| `/constitution` | "Update the design rules", "Add a new principle", "What are our standards?" | View or amend `memory/constitution.md` |
| `/specify` | "Write the spec", "Build the FRS", "Document this feature" | Full FRS + mockup + visual preview via guided dialogue |
| `/analyze` | "Review this spec", "Check for issues", crosswalk/harmonization requests | Cross-artifact consistency report (includes a cross-feature pass) |
| `/checklist` | "Generate a checklist", "What should I validate?", pre-story quality gate | Domain-specific requirements quality checklist ("unit tests for English") |
| `/breakdown` | "Create the epic", "Hand off to devs", "Break this down" | Build the JSX mockup, then create **exactly one ticket** — an Epic, or a Story if it's small enough. Short plain-language body — four sections (what the lab user is trying to do / what we're building / how it fits the lab workflow / what it touches in OpenELIS) — plus links to the prototype, preview, FRS, mockup source, and slicing guide in `openelis-work`. The **developer slices stories** — the skill does not create child Stories. |

Commands chain naturally: a new feature typically runs `/clarify` → **`/crosscheck`** → `/specify` → `/analyze` → `/checklist` → `/breakdown`. Run `/crosscheck` early (at brief time) so overlaps and contradictions surface *before* you invest in the FRS; it also runs again as a pass inside `/analyze` at the final gate. `/breakdown` is the only command that creates Jira tickets.

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

## `/crosscheck` — Portfolio Overlap, Contradiction & Dependency Scan

**Purpose:** Stop designing each feature in a vacuum. Given a feature brief (or an
in-progress/finished FRS), check it against everything decided and specced before, so three
classes of mistake surface early instead of at PR time:

1. **Overlap** — another spec already touches the same entity, route/page, or shared concept.
2. **Contradiction** — the design reverses a prior decision without saying so.
3. **Dependency gap** — it depends on something not built yet, or it changes something other
   specs depend on.

**Run it early.** The whole value is catching divergence *before* the FRS is written, so
trigger `/crosscheck` at brief time (right after `/clarify`). It also runs automatically as a
pass inside `/analyze` (see Pass M) for the final gate.

**Inputs it reads:**
- `references/decision-log.md` — the prior-decisions ledger (match by ID).
- `references/spec-registry.md` — the overlap/dependency index (match by entity, route/page, shared concept).
- `references/current-state-gotchas.md` — what's built vs not (for upstream-not-built).
- `references/verified-data-models.md` + `references/admin-ia-inventory.md` — to normalize entity/route names so matching is reliable.

**Procedure:**

1. **Extract the design's footprint.** From the brief/FRS, list: entities touched, routes/pages,
   shared concepts (e.g. Critical Acknowledgment, TAT threshold model, Domain enum, QC/validation
   badges, ReferralStatus), and the user-visible actions (especially writes, deletes, state changes).
2. **Overlap scan.** For each entity/route/shared-concept, find every `spec-registry.md` row that
   also has it. Report each as an overlap with the other feature and *why it matters* (shared write
   path, shared SideNav slot, shared model to render identically).
3. **Contradiction scan.** For each design choice, check `decision-log.md` for an `active` decision
   it violates. Report the decision ID, what the design does, and the conflict. (e.g. a Delete action
   → D-002; a long Select over tests → D-007; a `?type=` route → D-012; a site filter → D-001.)
4. **Dependency scan.**
   - *Upstream:* does the footprint require something `current-state-gotchas.md` says isn't built
     (EQA V2 controller, Test↔Reagent linkage, configurable label presets)? Flag as a required
     Dependency declaration.
   - *Downstream:* do any registry rows list this feature's entities/concepts as something *they*
     depend on? Flag them as affected — they may need re-review.
5. **"Are you forgetting?" sweep.** Surface only the *forward-looking* items not already captured
   in Overlaps/Dependencies above — the "design a shared thing once" nudges: a shared component or
   model that several specs should converge on, a sibling spec to align with, shared i18n key /
   audit-verb namespaces to keep from colliding. Don't restate an overlap already tabled; this
   section is for what to *build once*, not a second copy of the findings.

**Severity:**

| Severity | Criteria |
|---|---|
| **CRITICAL** | Contradicts an `active` GLOBAL decision (D-001…), or depends on an unbuilt upstream with no Dependency declaration |
| **HIGH** | Contradicts an `active` FEATURE decision, or overlaps a shared write path / shared model with no coordination noted |
| **MEDIUM** | Overlaps a route/SideNav slot; downstream spec likely affected; shared concept rendered differently than a sibling |
| **LOW** | Minor terminology drift vs an existing spec |

**Output format:**
```markdown
## Crosscheck: [Feature Name]

**Verdict:** [✅ Clear to proceed | ⚠ Proceed with coordination | ⛔ Blocked — resolve CRITICALs first]
— one sentence stating the single most important reason, then the recommended next step.
Lead with this line so a reader gets the call before the detail.

### Footprint
- Entities: … | Routes/pages: … | Shared concepts: … | Write/delete/state actions: …

### Contradictions (vs decision-log)
| Design choice | Decision | Conflict | Severity |
|---|---|---|---|
| "Delete preset" button | D-002 | hard delete on a domain record | CRITICAL |
_State explicitly when there are none — a clean contradiction scan is a useful signal._

### Overlaps (vs spec-registry + sibling specs)
| With | Shared element | Why it matters | Severity |
|---|---|---|---|
| QA Dashboard | TAT threshold model | must reuse, not re-define (D-015) | HIGH |

### Dependencies
- Upstream (must exist first): … (declare in FRS Dependencies; CRITICAL if unbuilt + undeclared)
- Downstream (affected, may need re-review): …

### You may be forgetting (build-once nudges, not already tabled above)
- … (a shared component/model to converge on; a namespace to keep clean)

### Registry upkeep triggered by this run
- Gaps found / rows to add or enrich / candidate new decisions
```
Order is deliberate: **Verdict** first (the call), then Contradictions (hard stops), then
Overlaps and Dependencies (coordination), then the build-once nudges, then upkeep. If a finding
is already in a table, don't repeat it lower down.

**To intentionally reverse a prior decision:** don't just contradict it. Note the reversal,
and (via `/constitution` or a decision-log edit) supersede the old decision — add the new row,
mark the old one `superseded`. `/crosscheck` then stops flagging it.

**Closing step (when run on a finished/approved feature):** append/refresh this feature's row
in `spec-registry.md`, and add any new precedent it set to `decision-log.md`. This is what keeps
the portfolio index from going stale — an out-of-date registry gives false confidence, which is
worse than none.

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
- **Access:** *(see `references/permissions-and-audit.md`)* describe who can use the feature in terms of existing user roles — which role(s) can see it, and for each action which role can perform it (view vs. change). Default to existing roles (Reception / Analyst / Validator / Provider / Admin / Test Catalog Manager / EQA Provider). Describe access as user capability ("a Validator can release results; an Analyst cannot"), not as an enforcement mechanism, and say what a user without access sees (item hidden, action disabled). If the feature lives entirely inside one role's existing workflow, state that: "Accessible via the existing `[Role]` role."
- **Reuse inventory:** *(design-addendum MUST F)* for each thing the design needs to store, list, configure, edit, print or export, name the built OpenELIS mechanism it reuses (with the code reference checked) or say why none fits. New mechanisms are the exception and are listed as such.

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
- **Handoff ticket:** name the route inside the "How it fits" sentence only — the full SideNav + breadcrumb + URL declaration stays in the FRS.

### Stage 3: Design Deliverables — FRS + HTML Preview now; JSX Mockup deferred to handoff

During the design session produce the **FRS + HTML preview** only. Do **not** write the JSX
mockup while the design is still being iterated — it burns tokens re-editing a heavy artifact
before the design is settled. The JSX mockup is a **developer-handoff** artifact: build it once,
at the end, after Casey approves the FRS + preview (or when explicitly asked). The HTML preview —
not the JSX — is what the reviewer looks at during iteration.

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

**Mockup (deferred to handoff):** The JSX mockup (`[feature-name]-mockup.jsx`, see React/Carbon
Patterns below) is produced only at handoff — after the FRS + preview are approved — so tokens
aren't spent re-editing it during iteration. It stays version-agnostic — show the full feature.
It is attached to the handoff ticket for the developer.

**Visual preview — required every time, authored directly from the FRS:** Produce a
`[feature-name]-preview.html` file directly (do **not** wait for a JSX mockup — the preview is the
review artifact and is authored on its own). The preview is what lets the user **see and iterate on
the design right now** without any build step and without spending tokens on JSX. Save it to the
workspace folder and share a `computer://` link right away in your reply. See the HTML
Preview Pattern section below.

**Registry upkeep (closing step):** once the FRS is approved, add/refresh this feature's row in `references/spec-registry.md` (entities, routes/pages, shared concepts, upstream/downstream deps, status, `Docs` = `—`) and add any new precedent it set to `references/decision-log.md`. This is what keeps `/crosscheck` accurate for the next feature — skipping it lets the portfolio index rot. If `/crosscheck` wasn't run earlier, run it now before handoff.

**Jira handoff:** `/specify` does NOT create Jira tickets. After delivering the FRS + preview, ask: *"Happy with the FRS and preview? When you give the green light I'll build the JSX mockup and run `/breakdown` to create the ticket — one Epic (or a Story if it's small enough), with a short plain-language body and links back to the repo. The developer slices the stories."*

All Jira creation happens in `/breakdown`, which creates **exactly one ticket** — an Epic, or a Story when the work is one screen with no new data model. The body stays short and links to the prototype, FRS, and slicing guide in `openelis-work`; the developer slices it into stories. The JSX mockup is built at this handoff step, not during design. Metadata gathering (narrative link, epic linkage, labels, assignee) also happens in `/breakdown` — see that command for details.

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
- Write actions described in terms of which existing role can perform them, not new permission mechanisms (Principle VIII)?
- Design brief produced before code (Principle IX / Stage 2)?
- **Design-addendum MUSTs** (see `memory/design-addendum.md`): hard "Delete" on a domain record → CRITICAL; domain-record list with no show/hide-deactivated affordance → MEDIUM (No-Hard-Delete). Static dropdown over a large/growing set → MEDIUM; inline "create heavy entity" flow → MEDIUM (Design-for-Large-Catalogs).

> The No-Hard-Delete, Design-for-Large-Catalogs and Reuse-Built-Mechanisms principles, plus data-reuse, no-multitenancy, and shipped-app-as-style-source, are defined in `memory/design-addendum.md`. They are candidates to upstream into the engineering constitution via the repo's amendment process; until then the addendum is this skill's authority and its MUST violations are CRITICAL here.

**E. Coverage Gaps**
- Every FRS requirement has a corresponding UI element in mockup?
- Every UI element in mockup traces to a requirement?
- (Acceptance criteria live in the FRS, not in Jira — check the FRS's ACs, and check that no ACs leaked into the handoff ticket body.)

**F. Cross-Module Harmonization**
- Shared concepts (resistance status, QC badges, validation levels) rendered identically to existing modules?
- Terminology consistent across FRS, mockup, and the handoff ticket?
- Data entities referenced in mockup present in FRS Data Model?

**G. Invented Data** (design-addendum MUST A)
- Every form field, table column, and badge in the mockup traces to data OpenELIS actually holds today?
- Any "plausible-looking but not real" fields (e.g. invented categories, made-up attributes the lab doesn't capture)?
- Where new data is needed, is it declared in the FRS Dependencies section as a named data element?
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

**J. Access / Roles** (see `references/permissions-and-audit.md`)
- Does the FRS say who can use the feature, in terms of existing user roles?
- For each action, is it clear which role can perform it (view vs. change) and what a user without access sees?
- Is access described as user capability rather than an enforcement mechanism?
- Is access over-specified — e.g. a per-role matrix for a feature that lives wholly inside one role's existing workflow? (Unnecessary.)
- Auto-CRITICAL: a write action with no stated role that can perform it.

**K. Slicing Guide Coverage** (only if a `[feature-name]-breakdown.md` exists — remember this
artifact is a *non-binding suggestion* for the developer, so grade coverage strictly but treat
sizing quibbles as advisory)
- Does every FR in the FRS appear in at least one version of the slicing guide?
- Does every UI element in the mockup get built by at least one slice?
- Are cross-cutting concerns (localization, access/roles) folded into the user-facing slice that introduces them, not split out on their own?
- Does any version exceed 20 story points without a declared `over-capacity: justified` reason?
- Is v1 a thin shippable slice that delivers a complete user-facing capability (not split by technical layer)?
- Is every slice titled and scoped around user value rather than a technical layer or component?
- Auto-HIGH: FRs or UI elements not assigned to any slice, or any slice scoped/titled by technical layer. Auto-LOW (advisory): over-capacity versions without justification.

**L. Lab Context Coverage** (FRS opening section)
- Does the FRS open with a `## Lab Context` section *before* the Overview?
- Does it have all three subsections in order: Current State, Pain, What Changes?
- Is the writing plain English? Flag any unexpanded acronym on first use (AST, EQA, AMR, QC, LOINC, FHIR, etc. should all have a one-time inline expansion when introduced).
- Is the Pain subsection concrete? Flag vague adjectives like "inefficient", "suboptimal", "cumbersome", "robust", "improved" that aren't backed by a concrete example or number.
- Does Lab Context cross-reference other parts of the spec (e.g. "as per FR-3", "see Data Model")? It shouldn't — it must stand on its own.
- Could a backend developer with no LIMS background read this section in under 90 seconds and explain what the lab does today and what changes? If not, flag it.
- Auto-HIGH: missing Lab Context section, or any of its three subsections absent.
- Auto-MEDIUM: present but written in jargon, full of vague adjectives, or relying on cross-references to other FRS sections.

**M. Cross-Feature Overlap & Contradiction** (runs the `/crosscheck` procedure against the finished FRS/mockup)
- Does the design contradict any `active` decision in `references/decision-log.md`? (cite the ID)
- Does it overlap an entity, route/page, or shared concept already in `references/spec-registry.md` without coordination noted?
- Does it depend on an unbuilt upstream (`references/current-state-gotchas.md`) with no FRS Dependency declaration? Does it change something downstream specs rely on?
- Is a shared concept (Critical Acknowledgment, TAT threshold model, ReferralStatus, QC/validation badges, Domain enum) rendered/modeled differently than the sibling that owns it?
- Auto-CRITICAL: contradicts an active GLOBAL decision, or unbuilt-upstream dependency with no declaration. Auto-HIGH: contradicts an active FEATURE decision, or uncoordinated shared write path/model. See `/crosscheck` for the full procedure and output format.

**N. Docs Impact** (see `references/docs-spine.md`)
- Is this a redesign/extension of a **built** feature whose `spec-registry.md` row has a published manual page in its `Docs` column (or an entry in `openelis-work/docs-manual/contracts.json`)?
- If yes: that published manual page will drift when this ships. Flag it so the handoff ticket's Feature Doc includes re-capturing and re-verifying the page (and bumping its `capturedVersion`).
- Auto-MEDIUM: a shipped manual page is affected and the FRS/breakdown doesn't flag it.

**O. Parallel Mechanism** (design-addendum MUST F)
- For each new store, list, setting, admin page, status set, editor, export or job in the FRS or mockup: is there a built OpenELIS mechanism that does this job (test catalog fields and reagent links, Dictionary, Programs and questionnaires, reflex rules, analysis statuses, Validation, Workplan, `note`, label presets, Inventory, report states, Organizations, FHIR storage)?
- Check the code, not memory: cite the class, table or endpoint found (or searched for and not found), with the develop commit.
- Is an extension of a built mechanism declared as a Dependency on it, not as new module data?
- Do two parts of the design implement the same thing twice (two result editors, two coded lists for one concept)?
- Auto-HIGH: a parallel mechanism where a built one fits. Auto-CRITICAL: it contradicts an active decision about that mechanism (for example a new enum where D-037 says tag).

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

### Access & Roles
- [ ] Is it clear which existing role can perform each action (view vs. change)?
- [ ] Is it specified what a user without access sees (item hidden, action disabled)?
- [ ] Is access described as user capability, not an enforcement mechanism?

### Carbon Design System
- [ ] Are all status indicators mapped to Carbon Tag kinds?
- [ ] Is inline row expansion used for edit forms (not modals)?
- [ ] Is the admin table column pattern followed if this is a config page?

### Acceptance Criteria Quality
- [ ] Are all acceptance criteria testable (observable, specific, falsifiable)?
- [ ] Does each criterion trace to a functional requirement?
- [ ] Are edge cases and error paths included, not just happy path?

### Reuse of built mechanisms (design-addendum MUST F)
- [ ] Does every new store, list, setting, admin page, status set or editor name the built OpenELIS mechanism it reuses, or say why none fits?
- [ ] Are extensions of built mechanisms declared as Dependencies on them?
- [ ] Is anything implemented twice within the design (two editors, two lists for one concept)?

### FRS–Mockup Alignment
- [ ] Does every requirement have a corresponding UI element?
- [ ] Does every UI element trace to a requirement?
- [ ] Are all data model fields visible in the mockup?
```

---

## `/breakdown` — One Ticket + Slicing Guide

**Purpose:** Turn an approved FRS + mockup into **exactly one Jira ticket** for developer handoff.
`/breakdown` is the **only command that creates Jira tickets**, and it creates **one ticket only** —
an **Epic**, or a **Story** when the work is small enough (rule below). The FRS, prototype, and
slicing guide live in `openelis-work` and are **linked**, not pasted. The **developer slices the
work**. The skill does **not** create child Stories. Run it after `/specify` (and ideally after
`/analyze` clears CRITICAL findings).

> **Handoff model (current — supersedes the slicing stages below):** We no longer pre-slice features
> into child Stories, and we no longer stuff the ticket body. We deliver **one ticket** with a short,
> plain-language orientation in four short sections (what the lab user is trying to do / what we're
> building / how it fits the lab workflow / what it touches in OpenELIS) plus links to the prototype,
> preview, FRS, mockup source, and slicing guide in `openelis-work`. Build the **JSX mockup now**
> if `/specify` deferred it (it does by default). Everything below about versions, Fibonacci points,
> and per-version capacity is retained **only** as the *suggested slicing guide shipped to the repo* —
> not as ticket-body content, and not as tickets the skill creates.

**Core principles:**

1. **One mockup → one ticket; the developer slices.** Every mockup that ships gets exactly one Epic
   (or Story). The skill does not create child Stories. The version/slice material below becomes a
   `[feature-name]-breakdown.md` shipped to `openelis-work` and linked in one line from the ticket.

   **Epic or Story?** Create a **Story** when *all* of these hold: it is one screen (a single route,
   or a change to one existing screen), it needs no new data model, and a competent dev could ship it
   in one reviewable PR. Otherwise create an **Epic**. When in doubt, Epic. Say which you picked and
   why in one line when you report back.

2. **The ticket body is a doorway, not a container.** Minimal details, mostly links. Its whole job
   is to get a dev who has never seen the feature oriented in about a minute, in four short labelled
   sections: *What the lab user is trying to do* → *What we're building* → *How it fits the lab
   workflow* → *What it touches in OpenELIS*. Target 250–400 words. **No** acceptance criteria, FR tables, story points,
   version tables, i18n key lists, or permission matrices in the ticket — those live in the FRS. If a
   **full narrative document** exists, link that *instead of* writing the prose sections. Full body
   format: `references/jira-template.md`.
3. **Slice by user value, never by technical layer.** A version is a thin end-to-end
   slice a user can actually use on its own (e.g. read-only list). v2 builds on v1 (e.g.
   inline edit). v3 builds on v2 (e.g. bulk actions). Never split a version *or a story*
   by technical layer ("v1 = backend, v2 = frontend", or separate "API" and "UI"
   stories) — that produces unshippable intermediate states. Every story is something a
   user can do, and its title says so in plain language (not a layer or component name).
4. **Each version fits in one ~2-week sprint with a target of 20 story points,** sized
   using the Fibonacci scale (1, 2, 3, 5, 8, 13). A small feature has only v1; a large
   feature may have v1 → v2 → v3 (or more). Each version's points sum to ≤20 unless
   explicitly justified.
5. **Cross-cutting work rolls into the user-facing story that touches it.** Localization
   and access rules are *not* separate stories — they are covered by the FRS acceptance criteria
   for whichever user-facing slice introduces them.
6. **FRS stays version-agnostic.** Functional requirements describe the full feature.
   Version boundaries are decided here in the breakdown plan, not in the FRS. This lets
   you re-slice (combine v2+v3, split v1 into v1a/v1b) without rewriting the FRS.
7. **Plan first, Jira after approval.** `/breakdown` produces a markdown plan and waits
   for Casey's green light before touching Jira. Same gate as the FRS/mockup approval.

8. **Size slices to the implementation pipeline.** When the implementer is Claude Code (agentic)
   rather than a human team, size each slice to one reviewable PR ("one branch, one PR, one
   review"), not to story points. Prefer fewer, larger-but-coherent vertical slices (often ~5–7
   for a feature that would be ~14 human stories), because an agent implements a bigger coherent
   chunk in one pass than a human fits in a sprint. Story points and the 20-point/2-week target
   are human-planning artifacts; for an agent pipeline, replace "≤20 points per version" with
   "each slice is a PR a reviewer can actually read in one sitting."

   The slicing guide is what enables small PRs — it does not happen automatically. Pointing Claude
   Code at a whole ticket produces one unreviewable chunk. Drive it slice-by-slice, one PR per
   slice. Every slice must still be: independently shippable, dependency-ordered (never needs an
   unbuilt dependency), and covered by explicit, machine-checkable **FRS acceptance criteria** so
   CI and the reviewer can confirm it. Reviewability of the diff matters more with an AI
   implementer, not less — the diff is where subtle errors are caught.

   **Note for existing breakdowns:** re-slice over-granular existing breakdowns against this
   principle. Known offender: the AMR review workflow micro-module breakdown.

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
  feature so the reference/lookup data is in place before the operational workflow ships
  in v2.

**Anti-patterns to reject:**

- **Backend-only v1 with no UI.** Never shippable on its own. Both backend and frontend
  for the v1 slice must ship together.
- **"v1 = MVP, v2 = polish."** Too vague — each version has to be a concrete functional
  cut, not a maturity level.
- **Forward dependencies.** A version may depend on past versions, never on future ones.
  If v1 needs something from v2 to be usable, the slice boundary is wrong.
- **Stories split by technical layer.** No separate "backend"/"API"/"data" and
  "frontend"/"UI" stories for the same capability — that's one user-facing story.
- **Technical-layer titles.** A title naming a layer or component ("Results DAO",
  "validation endpoint") instead of what the user can do — retitle around the user.

### Stage 2: Estimate each story in story points

For each version, describe the work as 3–6 candidate slices (these are *suggestions in the
slicing guide*, never tickets the skill creates). Estimate each in Fibonacci points using this
rubric:

| Points | Size | Typical scope (described as what a user can do) |
|---|---|---|
| 1 | Trivial | Add one column to an existing list; adjust a label |
| 2 | Small | Add one field to a form a user fills in |
| 3 | Standard | Let a user edit one kind of record from a list |
| 5 | Medium | A new page where a user can find, filter, and update records |
| 8 | Large | A new end-to-end capability: a kind of record a user creates, views, and manages |
| 13 | XL — should usually be split | A workflow spanning several record types, or a multi-step wizard the user completes in sequence |

A story estimated at 13 should almost always be split into two ≤8s. Anything above 13 is
too big — break it up before continuing.

**Cross-cutting work is already inside each estimate.** A "let a user edit a record" slice
at 5 points already includes its localization and access rules. Do not add separate slices
for these — the FRS acceptance criteria spell them out.

### Stage 3: Check capacity, propose splits if needed

Sum the points per version. Target: **≤20 points per version**.

If a version exceeds 20, the skill MUST flag it and propose a split:

1. State the overage clearly: *`v1 totals 28 points — over the 20-point sprint target.`*
2. Propose a concrete split with rationale: *`Proposed split — v1a (read-only list + filter, 13 pts) ships sprint 1; v1b (inline edit + audit, 15 pts) ships sprint 2.`*
3. Ask Casey to approve the split, override (with a one-line `over-capacity: justified` reason for tightly-coupled work that can't slice cleanly), or re-slice manually.

If a version is under 10 points, flag it too: *`v3 totals 8 points — may have headroom to absorb v4 work or fold into v2.`* Don't auto-merge; just surface the option.

If the pipeline is Claude Code, the capacity check is "is this slice a reviewable PR?" not "≤20 points." Flag and consolidate over-granular stories (many 1–2 point micro-stories that would each be a trivial PR) into coherent PR-sized slices. Flag the opposite too: a slice whose diff a human couldn't review in one sitting should still be split.

### Stage 4: Output the slicing guide

Produce a markdown file named `[feature-name]-breakdown.md` with this structure:

````markdown
# [Feature Name] — Story Breakdown

**Mockup:** `[feature-name]-mockup.jsx`
**FRS:** `[feature-name]-frs.md`
**Total versions:** [N]
**Total points:** [sum]
**Sprints required (estimate):** [N × 2-week sprints]

## Handoff ticket (Epic, or Story if small)
**Title:** [feature name as it will appear in Jira]
**Description summary:** [1–2 sentences from the FRS Overview]
**Parent / linked program epic (optional):** [e.g. OGC-527 Environmental/Vector, or "none"]
**Labels:** [country, domain, compliance tags — set on the single handoff ticket; the developer's own stories inherit them]

## v1 — [slice name, e.g. "Read-only list + filter"]
**Sprint target:** 20 points
**Actual:** [sum] points

| Story | Points | FRs covered | Cross-cutting included |
|---|---|---|---|
| Lab tech sees results grouped by section | 5 | FR-1, FR-2 | localization `label.foo.*`; visible to Analyst |
| Lab tech filters results by status and section | 3 | FR-3 | localization `filter.foo.*` |
| ... | ... | ... | ... |

## v2 — [slice name, e.g. "Inline edit + audit"]
...

## Coverage check
- Every FR from the FRS appears in at least one version: ✅ / ❌ (list gaps)
- Every UI element in the mockup is built by at least one story: ✅ / ❌
- Every story is titled and scoped around user value, not a technical layer: ✅ / ❌
- Cross-cutting concerns folded into their user-facing story:
  - Localization: ✅ (per-story)
  - Access / roles: ✅ (which role can act, on each story that changes data)
````

Save the plan to the workspace folder and share a `computer://` link in your reply. The plan
**ships to `openelis-work` alongside the FRS and mockup** (via `upload/` → the gallery thread) —
the ticket links to it in one line. Its contents never go into the ticket body.

### Stage 5: Get approval, then create the one ticket

**⚠ Do not create any Jira ticket until Casey has explicitly approved the breakdown plan.**

After delivering the plan, ask: *"Happy with the breakdown? When you give the green light I'll
create the [Epic|Story] in Jira — short body, links to the repo."*

Once approved, gather the remaining metadata. Ask **four questions, one at a time:**

1. **Is there a full narrative document for this feature?** (Confluence page, Google Doc, doc in
   the repo.) If yes, get the URL — the ticket links it *instead of* the written prose sections
   (Form A in `references/jira-template.md`). If no, write the prose sections (Form B). Never
   assume one exists.

2. **Parent / linked program epic** — Suggest the most likely existing umbrella epic
   based on feature domain (e.g. OGC-527 for Environmental/Vector, OGC-354 for Sample
   Collection, OGC-517 for Results). The new ticket gets linked to this via a Jira
   "is part of" link, **not** a parent-child epic nest (Jira's epic hierarchy is flat by
   default). Casey can decline if the mockup is standalone.

3. **Labels** — Suggest 3–5 labels combining country/deployment context (e.g.
   `Madagascar`, `Indonesia`, `global`), domain attribute (e.g. `vector`,
   `environmental`, `blood-bank`), and compliance/program tags (e.g. `iso-15189`,
   `SILNAS`).

4. **Assignee (optional)** — Default unassigned. If the feature domain matches a known
   contributor pattern (e.g. Piotr for front-end Carbon components), note the suggestion
   but don't assume.

Then create **one ticket — and only one** (no child Stories; the developer slices):

1. **Pick Epic or Story** using the rule in Principle 1: Story only if it's one screen, no new
   data model, one reviewable PR. Otherwise Epic.

2. **Create it** with the body from `references/jira-template.md` — Form A if there's a narrative
   to link, Form B otherwise. Keep it to 250–400 words: the four short sections (what the lab user
   is trying to do → what we're building → how it fits the lab workflow → what it touches in
   OpenELIS), the links block, and 1–3 out-of-scope bullets. The links block carries all the
   detail: gallery prototype, standalone HTML preview, FRS, mockup JSX source, and the slicing
   guide — all in `openelis-work`. **Attach the JSX mockup too** (build it now if `/specify`
   deferred it). Set labels and the **Contract** field; add the optional "is part of" link.

   Before saving, re-read the body against these: would a dev outside the lab domain know *why*
   this exists and *where it sits* after one read? Is anything in the body already stated in the
   FRS (cut it and link instead)? Any acceptance criteria, FR ids, points, or i18n keys left
   (cut them)? Any filler like "improve the user experience" (replace with the concrete thing)?

3. **Do NOT create child Stories.** The developer slices. The slicing guide is a linked file in
   the repo, non-binding.

4. **Docs handoff** (see `references/docs-spine.md`). Add a **one-line** "Documentation" note to
   the ticket: a **Feature Doc** child is expected when it reaches In Review (the auto-create
   automation is staged — create the child manually if it doesn't fire), using the body template
   in `references/docs-spine.md` (links: FRS, preview, manual page ID, drift-contract id). The
   manual entry itself is authored at **Acceptance or later** via the `openelis-user-manual`
   skill — never from the FRS. Tick **Docs N/A** for trivial work.

5. **Confirm the result.** Report the ticket key, whether it's an Epic or a Story and the one-line
   reason, and confirm the mockup is attached and the prototype/FRS/slicing-guide links render as
   clickable links (check `renderedFields`). Share the Jira link.

6. **Registry upkeep.** Record the ticket key in this feature's `references/spec-registry.md` row,
   set the row's `Docs` column to `pending`, and log any sequencing/dependency decision in
   `references/decision-log.md` as a FEATURE decision.

### Output: relationship to other commands

| Step | Produced by | When | Creates Jira? |
|---|---|---|---|
| FRS, mockup, preview | `/specify` | First | No |
| Quality report | `/analyze` | After /specify — fix CRITICALs before /breakdown | No |
| Requirements quality checklist | `/checklist` | Optional, before /breakdown | No |
| JSX mockup (deferred from /specify) | `/breakdown` | At handoff, before the ticket | No |
| Slicing guide `[feature]-breakdown.md` → `openelis-work` | `/breakdown` | Before the ticket | No |
| **One ticket (Epic, or Story if small) — short body + repo links** | **`/breakdown`** | **Last — the only Jira-creating step** | **Yes (one ticket)** |

`/breakdown` always produces exactly **one ticket** per mockup — an Epic, or a Story when the work
is one screen / no new data model / one PR. The body stays short and links to `openelis-work`. It
never creates child Stories — the developer slices.

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

## Registry upkeep — the skill directory is READ-ONLY in a session

`/specify`, `/crosscheck` and `/breakdown` all end by updating `references/spec-registry.md` and
`references/decision-log.md`. **You cannot write to them from a running session** — the skill
directory is a synced, read-only cache, and edits there neither persist nor reach the account.
Silently skipping the update is the failure mode this section exists to prevent: a stale registry
gives false confidence, which is worse than no registry.

### Where the writable copies live

Two in-repo copies, both of which must be updated:

- `OpenELIS Feature Design/openelis-design-skill-src/references/` — the **newest** copy; treat as
  source of truth.
- `skills/openelis-design/references/` — the in-repo skill mirror.

**Do NOT create a top-level `openelis-work/references/`** — that path was tried and reverted on
2026-08-12; these two are the real homes.

> **Re-merges (2026-10-01, 2026-10-06).** The two copies keep splitting: sessions write skill-src
> (below says to number from it), while the repo copy is what gets committed. They were re-merged on
> branch `skill/consolidation-2026-10`: skill-src numbering kept; the four repo-only decisions now sit
> at D-218 to D-221 (map in `decision-log.md`, 2026-10-01 and 2026-10-06 notes). Until Casey picks a
> single home, keep writing **both** copies and number after the **highest ID in either**
> (next: D-222).

### Before minting a decision ID: check the REPO, not the synced copy

The three copies have drifted before — on 2026-08-11 the synced cache stopped at **D-034**, the
in-repo mirror at **D-027**, and `openelis-design-skill-src` at **D-042**. A decision drafted as
D-035 against the synced copy would have collided head-on with the Inventory decisions. **Always
read the highest `D-0xx` from `openelis-design-skill-src` and number after that.**

### The two-step close

1. **Write the authoritative copies** to both paths above, then commit them with the design.
2. **Emit a re-installable skill package.** Copy this skill directory, apply the same edits, zip it
   as `openelis-design.skill`, and send it with `SendUserFile` so Casey can click to install and
   fold the change into the account copy. Report it as *delivered*, never as *saved* — you get no
   signal either way.

If the workspace isn't reachable, do step 2 alone and say plainly that step 1 is outstanding,
naming the rows that still need to land.

### Do git and build work on the Mac, not the device mount

The device mount forbids `unlink`. Consequences, all observed on 2026-08-12:

- `vite build` fails on `emptyOutDir` (`EPERM: operation not permitted, unlink .../dist/...`).
  Workaround: `mv` `dist` aside so vite creates it fresh, then verify nothing was lost
  (`comm -23` of the old and new file lists).
- git cannot clean up its own `index.lock` / `HEAD.lock`, so every git write leaves one behind that
  blocks the next command. A stale lock from a crashed run is what stranded the 2026-08-11 gallery
  registration.
- `rm` never works — move unwanted files to a `_to_delete/` folder and tell Casey to delete it.

Use the **Control-your-Mac** connector instead: it has network, a working `rm`, node via nvm
(`/Users/casey/.nvm/versions/node/<ver>/bin`), and `gh` at `/opt/homebrew/bin/gh` authenticated
from `.secrets/gh-pr-token`. That is also the route for `git push`, `gh pr merge` and
`gh issue create` — the GitHub connector is read-only (403 `Resource not accessible by integration`
on `issues:write` and `pull_requests:write`), so **do not hand those commands to Casey to run.**

### Check the remote before assuming the mount is current

`git ls-remote` first. On 2026-08-12 the mount's `main` was three commits stale and showed no sign
of an already-pushed branch **and an already-open PR** for the design being registered — which is
what produced two competing registrations of one feature.

## Reference Files

| File | When to read |
|---|---|
| `memory/constitution.md` | **Always first** — pointer to the upstream engineering constitution (synced version + design-relevant summary + raw URL + re-sync trigger) |
| `memory/design-addendum.md` | **Always first** — skill-specific design MUSTs (data reuse, no multitenancy, shipped-app style source, no-hard-delete, large-catalogs, reuse built mechanisms) + standing UI/IA conventions |
| `references/current-state-gotchas.md` | During `/specify` Stage 1 and `/analyze` cross-module pass — what's built vs not built; required Dependency/Feature-Flag declarations |
| `references/permissions-and-audit.md` | During `/specify` Stage 2 (Access brief item) and `/analyze` Pass J — describing who can use a feature in terms of existing roles |
| `references/frs-template.md` | When writing any FRS document |
| `references/jira-template.md` | **Read every time `/breakdown` creates the ticket** — Epic-vs-Story rule, the ≤350-word body (Form A with a narrative link, Form B without), and what must never go in the body |
| `references/carbon-anti-patterns.md` | During `/analyze` Carbon fidelity pass, or self-critique before delivery |
| `references/module-inventory.md` | When a feature touches an existing module — check pattern, route, and Jira anchor |
| `references/verified-data-models.md` | During `/specify` Stage 1 and `/analyze` Pass G — reuse field-verified data models instead of inventing fields |
| `references/admin-ia-inventory.md` | During `/specify` Stage 2 (IA Placement) and `/analyze` IA checks — verified admin routes + SideNav structure (self-contained; route pattern is `/MasterListsPage/<editorKey>`) |
| `references/jira-conventions.md` | During `/breakdown` and any reporting — clickable links, Done≠shipped, PR-sized slicing, labels, no-emoji, reorg proposal |
| `references/ogc-workflow.md` | The LIVE OGC Lean workflow — statuses, Acceptance gate, Reject Count, Contract field, per-Epic docs. Read when creating epics/stories or reporting. |
| `references/decision-log.md` | During `/crosscheck` and `/analyze` Pass M — the prior-decisions ledger to check new designs against (cite by ID) |
| `references/spec-registry.md` | During `/crosscheck` and `/analyze` Pass M — per-feature overlap/dependency index; append a row at the end of `/specify` and `/breakdown` |
| `references/docs-spine.md` | During `/breakdown` (handoff ticket + Feature Doc) and `/analyze` Pass N — how specs, Jira Epics, Feature Docs, the Confluence manual, and drift contracts link together |
| `references/test-catalog-data-model.md` | **Whenever a feature touches Test, Panel, Sample Type, Lab Unit, or their junctions** — source-verified ER model, real cardinalities, junction consumption traces, and the five resolved tensions (specimen-is-identity, SAMPLETYPE_PANEL sync, domain build state, storage ownership, terminology store). Supersedes ad-hoc re-derivation |