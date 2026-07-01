# Jira Story Template

> Used by `/breakdown` when creating the Epic and child Stories. `/breakdown` is the only
> command that creates Jira tickets.

---

## Epic

- **Title:** the feature name
- **Issue type:** `Epic`
- **Description:** FRS Overview + links to the FRS, mockup, and breakdown plan in the gallery
- **Labels:** country/deployment + domain + compliance tags (propagated to every child story)
- **Linked program epic (optional):** "is part of" link to the umbrella epic (NOT a parent-child nest — Jira epic hierarchy is flat)

---

## Child Story

- **Title format:** `[feature]: [story summary] (v1)` — the `(v1)`/`(v2)`/`(v3)` suffix is mandatory. The summary names what a user can do, in plain language — never a technical layer or component (not "Results API", not "validation DAO")
- **Issue type:** `Story`
- **Epic Link:** the newly created mockup-Epic
- **Story Points:** Fibonacci estimate from the breakdown plan
- **Labels:** Epic's labels **plus** a version label (`v1`, `v2`, …) — the version label enables sprint filtering

### Description body

```
h3. Context
[1–2 sentences: what this story builds and where it sits in the feature]

h3. Navigation & URL
* Route: /MasterListsPage/<editorKey>
* SideNav: Admin → <Group> → <Page>

h3. Acceptance Criteria
# [Observable, testable criterion — traces to FR-x in the breakdown plan]
# [...]

h3. Cross-cutting (included in this story, not separate stories)
* Localization keys: label.<feature>.* (list them)
* Access: which role can perform each action in this story

h3. Out of scope
* [what this story deliberately excludes]
```

### Rules
- Each story is a user-facing capability, never a technical layer. No separate
  "backend"/"API" or "frontend"/"UI" stories for the same capability.
- Every acceptance criterion traces to an FR listed for this story in the breakdown plan.
- Cross-cutting work (localization, access) lives **inside** the user-facing story's
  acceptance criteria — never as separate stories.
- Use clickable markdown links for any FRS/mockup/Confluence references (contentFormat
  markdown renders clickable in the Atlassian MCP).
