# Docs Spine — connecting specs, dev work, and the user manual

> The documentation "spine" keeps three systems pointing at each other so nothing ships
> undocumented and no manual page silently rots:
>
> 1. **Design** — FRS + mockups (this skill), indexed in `references/spec-registry.md`.
> 2. **Dev** — Jira OGC Epics/Stories (`references/ogc-workflow.md`); code in
>    `DIGI-UW/OpenELIS-Global-2`.
> 3. **Docs/Training** — the Confluence user manual + walkthrough videos, authored by the
>    `openelis-user-manual` skill, monitored by drift contracts in
>    `openelis-work/docs-manual/contracts.json` and the weekly **Doc Freshness Tracker**.
>
> The **Feature Doc** Jira child issue (one per handoff ticket) is the join point of all three.
> Docs are tracked in **Jira, not GitHub** — there is no GitHub-issue mechanism for docs.

## The join point: the Feature Doc issue

One per handoff ticket — Epic **or** Story (one ticket ≈ one mockup ≈ one manual entry). Auto-created when the ticket reaches
**In Review** (automation is staged — verify it fired; create the child manually if it didn't).
Its body MUST carry the links below so anyone can traverse the spine in either direction:

- the **FRS** and **HTML preview** (design gallery permalinks)
- the **Confluence manual page** — added once drafted; link by **numeric page ID**, never title-slug
- the **drift contract id** in `contracts.json` — added when the page registers its contract

### Feature Doc body template (contentFormat: markdown)

    Documentation deliverable for [TICKET-KEY] — [feature name].

    **Spec:** [FRS](<gallery permalink>) · [Preview](<gallery permalink>)
    **Manual page:** _pending_ → https://uwdigi.atlassian.net/wiki/spaces/OG/pages/<pageId> once drafted
    **Drift contract:** _pending_ → contracts.json id `<id>` once registered

    Author via the `openelis-user-manual` skill — verified behavior only: document what is on
    the test instance after Acceptance, never the FRS. Tick **Docs N/A** instead for trivial work.

## When docs happen

Write the manual entry when the handoff ticket reaches **Acceptance** or later. The user-manual skill's
hard rule is "document only built, verified behavior," and Acceptance is the first status where
a human has verified the feature on testing.openelis-global.org. Never author a manual page
from the FRS.

## Traceability obligations by command

- **`/specify`** (registry upkeep): new `spec-registry.md` rows get **Docs = `—`**.
- **`/breakdown`** (ticket creation): add a **one-line** Documentation note to the ticket — a
  Feature Doc child is expected at In Review, using the template above. Set the registry row's
  **Docs = `pending`**.
- **`/analyze` Pass N** (docs impact): a redesign of a **built** feature whose registry row has
  a published page ID in `Docs` (or a `contracts.json` entry) will make that page drift when it
  ships. Flag it so the new ticket's Feature Doc includes re-capturing that page.
- **On publish** (done by `openelis-user-manual`): back-fill the Feature Doc links and report
  the page ID so this registry's `Docs` column gets updated.

## spec-registry `Docs` column values

| Value | Meaning |
|---|---|
| `—` | specced only; nothing shipped, no docs owed yet |
| `pending` | Epic created / shipping; Feature Doc owed or open |
| `N/A` | Docs N/A ticked on the Feature Doc (trivial work) |
| `<pageId>` | published manual page (Confluence numeric page ID) |

## Hygiene check (run alongside filters 10380/10381)

Every handoff ticket at In Review or later without Docs N/A ticked must have a Feature Doc child.
Plain JQL can't express "Epic without a Feature Doc child" directly, so reconcile two lists:

    project = OGC AND issuetype in (Epic, Story) AND status in ("In Review", "Acceptance", "Done")
    project = OGC AND issuetype = "Feature Doc"

Every handoff ticket in list 1 (Docs N/A unticked) should appear as a parent in list 2. Target: 0
uncovered. The auto-create automation is **staged, not confirmed enabled** — check with Casey
before assuming Feature Docs appear on their own; create missing ones manually.

## Drift contracts (owned by openelis-user-manual; read here for impact analysis)

Every manual page registers `id, title, manualDoc, captureSpec, base, capturedVersion,
routes[]` **plus the spine fields `jiraEpic`, `featureDoc`, `frs`** in
`openelis-work/docs-manual/contracts.json`. The weekly drift check
(`openelis-docs-drift-weekly`) then reports stale pages *with their owning Epic*, so a drift
flag routes straight back to the feature that changed.
