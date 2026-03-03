# OpenELIS Global — Design Workspace

A centralized workspace for tracking mockups, specifications, and design changes for [OpenELIS Global](https://github.com/I-TECH-UW/OpenELIS-Global2). This repo serves as the single source of truth for design work, making it easy for designers, clients, and developers to stay aligned.

**Live Gallery:** [caseyi.github.io/openelis-work](https://caseyi.github.io/openelis-work/)
**Figma Template:** [OpenELIS Global Template](https://www.figma.com/make/15B8LmoBhZ5WgtYDI9MCHm/OpenELIS-Global-Template)

---

## Repo Structure

```
├── upload/                 # Drop files here for Claude to process
├── designs/                # Co-located mockup + spec pairs
│   ├── admin-config/       #   feature-name.jsx + feature-name.md
│   ├── analyzer-integration/
│   ├── microbiology/
│   ├── nce/
│   ├── pathology/
│   ├── quality/
│   ├── results-validation/
│   ├── system/
│   └── other/
├── notes/                  # Linked context objects
│   ├── transcripts/        #   Chat transcripts from Claude projects, Slack, etc.
│   ├── meetings/           #   Meeting notes
│   └── decisions/          #   Decision logs
├── assets/                 # Supporting files
│   ├── vendor-manuals/     #   Instrument PDFs
│   ├── reference-data/     #   Sample CSVs, JSONs
│   ├── requirements-docs/  #   DOCX requirements
│   ├── research/           #   Research documents
│   └── images/             #   Screenshots, diagrams
├── mockup-viewer/          # Vite + React gallery app (auto-deployed to GitHub Pages)
├── .templates/             # Templates for specs, handoffs, transcripts, decisions
├── MANIFEST.yaml           # Master manifest — every artifact with linked objects
└── INDEX.md                # Cross-referenced design index
```

## Quick Start

```bash
git clone https://github.com/caseyi/openelis-work.git
cd openelis-work/mockup-viewer
npm install
npm run dev
# Opens gallery at http://localhost:5173
```

## Upload Workflow (with Claude)

The primary way to add new artifacts:

1. **Drop files** into `upload/` — JSX mockups, MD specs, DOCX requirements, PDFs, chat transcripts, whatever
2. **Tell Claude** to process the upload folder, and mention any links:
   > "Process uploads. The validation-page.jsx is for Jira OGC-142, here's the Figma: https://figma.com/..."
3. **Claude will:**
   - Identify each file type and auto-categorize it to the right folder
   - Add/update entries in `MANIFEST.yaml` with full linked objects (Jira, Figma, Confluence, transcripts, meetings, decisions)
   - Register new JSX mockups in the gallery viewer
   - Update `INDEX.md` with cross-references
   - Commit with a descriptive message
4. **Push** and the gallery auto-deploys via GitHub Pages

## Linked Objects

Every artifact in `MANIFEST.yaml` can link to external references:

| Link Type | Example |
|-----------|---------|
| **Jira** | `OGC-142`, `OGC-324` |
| **Figma** | Figma design or prototype URLs |
| **Confluence** | Wiki pages, meeting notes, specs |
| **Transcripts** | Claude project conversations stored in `notes/transcripts/` |
| **Meetings** | Meeting notes stored in `notes/meetings/` |
| **Decisions** | Decision logs stored in `notes/decisions/` |
| **Other** | Any freeform URL or reference |

## Manual Workflow

If adding files without Claude:

1. **Place files** in the correct `designs/<category>/` folder (JSX + MD pairs share the same base name)
2. **Add a manifest entry** — copy from `.templates/MANIFEST_ENTRY.yaml`
3. **Register JSX mockups** in `mockup-viewer/src/App.jsx` → `MOCKUP_REGISTRY`
4. **Update `INDEX.md`** with a row linking the mockup and spec
5. **Commit** using the convention below

## Commit Convention

| Prefix | Use |
|--------|-----|
| `feat(design):` | New mockup or screen |
| `update(design):` | Changes to existing mockup |
| `fix(design):` | Corrections to designs |
| `spec:` | New or updated specification |
| `handoff:` | Developer handoff document |
| `docs:` | README, index, manifest, or documentation |
| `chore:` | Maintenance, cleanup |

## Tech Stack Context

OpenELIS Global uses **Carbon for React** (Carbon Design System) on the frontend. Mockups, specs, and handoff documents should reference Carbon components where applicable.

## Templates

| Template | Purpose |
|----------|---------|
| `.templates/SCREEN_SPEC.md` | Functional requirement spec for a screen |
| `.templates/COMPONENT_SPEC.md` | Spec for an individual component |
| `.templates/HANDOFF.md` | Developer handoff document |
| `.templates/CHANGELOG_ENTRY.md` | Design changelog entry |
| `.templates/MANIFEST_ENTRY.yaml` | New manifest entry with linked objects |
| `.templates/CHAT_TRANSCRIPT.md` | Chat transcript template |
| `.templates/MEETING_NOTES.md` | Meeting notes template |
| `.templates/DECISION_LOG.md` | Decision log template |
