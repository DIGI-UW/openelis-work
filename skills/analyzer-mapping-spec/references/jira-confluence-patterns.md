# Jira & Confluence Patterns

Constants for OpenELIS Global / UW Digi Atlassian workspace.

---

## Constants & what's deployment-driven

**Stable:**
```
cloudId:         57b4e32d-23d4-4a71-8985-82ac0274d145
Jira project:    OGC
Atlassian base:  https://uwdigi.atlassian.net
```

**Discover at runtime — do NOT hardcode:**
- **Story issue-type id** — varies; resolve via `getJiraProjectIssueTypesMetadata` for project OGC. (`10009` was the Story id at one point; verify, don't assume.)
- **Transition ids** — vary by workflow/project; resolve via `getTransitionsForJiraIssue`. (`21` was "Selected for Development" once — a Jira reorg to a 6-state workflow is proposed but not yet applied, so don't trust it.)

### Deployment Routing (pick parent epic / tracker / labels / assignee from the deployment)

| Deployment | Parent epic | Tracker page (space) | Default labels | Assignee |
|---|---|---|---|---|
| Madagascar | `OGC-304` (Madagascar Analyzers) | `1097531396` (`mdgoe`) | `Madagascar`, `analyzer-integration` | Piotr Mankowski (`5e765a025e755d0cd425c863`) |
| PNG / CPHL | `OGC-899` (PNG Phase II umbrella) | confirm per deployment | `PNG`, `Phase2`, `analyzer-integration` | confirm |
| Environmental / Vector | `OGC-527` | confirm per deployment | `vector` or `environmental`, `analyzer-integration` | confirm |
| Indonesia / SILNAS | confirm | confirm | `Indonesia`, `SILNAS`, `analyzer-integration` | confirm |

> Always **verify the epic key is current and open** before linking (Jira keys get closed/re-parented). Confirm a deployment's tracker page id and assignee rather than copying Madagascar's. Cross-check `openelis-design` → `references/module-inventory.md` and `references/jira-conventions.md` for the latest umbrella-epic list and label conventions.

---

## Creating a Jira Story

### Step 1: Create the issue

```json
Tool: createJiraIssue
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "projectKey": "OGC",
  "issueTypeId": "<resolve via getJiraProjectIssueTypesMetadata>",
  "summary": "[Instrument] — [Protocol] Analyzer Integration",
  "description": "<full technical description — see template below>",
  "parentKey": "<deployment epic from routing table, e.g. OGC-304 / OGC-899 / OGC-527>",
  "assigneeId": "<deployment owner, or omit for unassigned>"
}
```

### Story Description Template

```markdown
## Overview
[1–2 sentence summary of what this story delivers]

## Protocol
- Type: ASTM LIS2-A2 / HL7 v2.3.1 over MLLP / CSV Flat File
- Plugin: generic-astm / generic-hl7 / flat-file
- Default port: XXXX
- Connection role: SERVER (OpenELIS listens)

## Deliverables
1. Integration mapping spec (v1.0)
2. Companion analyzer setup guide
3. OpenELIS analyzer profile (JSON) for Profile Library
4. Analyzer Integration Tracker update

## Key Mappings
[Brief summary of test codes, record types, QC rules]

## Acceptance Criteria
- [ ] All [N] test codes mapped from analyzer output to OpenELIS test IDs
- [ ] QC identification rules configured and validated
- [ ] Abnormal flag mapping verified
- [ ] MLLP/TCP connection test passes (or ASTM listener confirmed)
- [ ] Sample message parsed correctly in Message Simulator
- [ ] Analyzer Integration Tracker updated with story link and confidence rating
- [ ] Profile exported as JSON and available in Profile Library

## References
- Vendor LIS manual: [title / version]
- Spec doc: [link or attachment name]
- Related stories: OGC-XXX (if blocking/blocked)
```

### Step 2: Add labels (separate API call — required due to API inconsistency)

```json
Tool: editJiraIssue
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "issueKey": "OGC-XXX",
  "labels": ["<deployment tag>", "analyzer-integration"]
}
```

Deployment label is from the routing table (`Madagascar` / `PNG` / `Indonesia` / `vector` / `environmental` / …) — add all that apply, always plus `analyzer-integration`.

### Step 3: Transition to "Selected for Development"

Resolve the transition id first (it is **not** a fixed `21`), then transition:

```json
Tool: getTransitionsForJiraIssue   // find the id whose name is "Selected for Development"
{ "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145", "issueKey": "OGC-XXX" }
```
```json
Tool: transitionJiraIssue
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "issueKey": "OGC-XXX",
  "transitionId": "<id from getTransitionsForJiraIssue>"
}
```

### Step 4: Set blocking relationships (if applicable)

Use **`createIssueLink`** (there is no `linkJiraIssues` tool). "OGC-X blocks OGC-Y":
```json
Tool: createIssueLink
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "inwardIssueKey": "OGC-X",   // blocker
  "outwardIssueKey": "OGC-Y",  // blocked
  "linkType": "Blocks"
}
```
If unsure of the exact link-type name, list them with `getIssueLinkTypes` first.

---

## Updating the Analyzer Integration Tracker

### Step 1: Fetch current page content

Use the **deployment's** tracker page id (Madagascar = `1097531396`; confirm others from the routing table):

```json
Tool: getConfluencePage
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "pageId": "<deployment tracker page id>"
}
```

Parse the existing markdown/storage content to find the tracker table.

### Step 2: Update the page

```json
Tool: updateConfluencePage
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "pageId": "1097531396",
  "title": "Analyzer Integration Tracker",
  "contentFormat": "markdown",
  "content": "<full page markdown with updated row>",
  "versionMessage": "Added OGC-XXX: [Instrument] integration spec"
}
```

### Tracker Table Row Format

Each analyzer row contains:

| Analyzer | Manufacturer | Protocol | Plugin | Jira | Confidence | Status | Notes |
|---|---|---|---|---|---|---|---|
| [Model] | [Mfr] | ASTM LIS2-A2 | generic-astm | [OGC-XXX](link) | HIGH | Spec Complete | [any special notes] |

**Status values:** `Not Started` → `Spec Complete` → `In Development` → `Deployed` → `Deprioritized / Out of Scope`

**Confidence values:** `N/A` → `HIGH` → `VALIDATED`

### Rules for tracker updates:
- Always preserve existing table rows — never delete rows for other analyzers
- Add new rows in the correct section (by protocol type or geography, matching existing structure)
- For deprioritized instruments, move to "Deprioritized / Out of Scope" section with a reason note
- Include the full Jira story URL in the link: `https://uwdigi.atlassian.net/browse/OGC-XXX`

---

## Adding a Comment to a Jira Issue

Use after delivering spec documents to summarize what was produced:

```json
Tool: addCommentToJiraIssue
{
  "cloudId": "57b4e32d-23d4-4a71-8985-82ac0274d145",
  "issueKey": "OGC-XXX",
  "body": "## Deliverables Summary\n\n**Spec doc:** [name, version]\n**Companion guide:** [name, version]\n**Mockup:** [attached / linked]\n**Tracker:** Updated — status set to Spec Complete, confidence HIGH\n\n[Any notable decisions or open questions]"
}
```

---

## Common Issues

| Problem | Fix |
|---|---|
| Labels not saving on createJiraIssue | Always add labels via separate editJiraIssue call |
| Confluence update fails with version conflict | Re-fetch page, get current version number, increment by 1 |
| Transition ID wrong | Use getTransitionsForJiraIssue to list available transitions for the issue |
| Story not appearing under OGC-304 | Verify parentKey is set correctly; check epic link field separately if needed |
