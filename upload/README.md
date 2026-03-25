# Upload Folder

Drop files here for Claude to process. When you ask Claude to process the upload folder, it will:

1. **Identify** each file type (JSX mockup, MD spec, DOCX requirement, PDF manual, chat transcript, image, etc.)
2. **Auto-categorize** and move files to the correct location in the repo
3. **Update MANIFEST.yaml** with a new entry for each file, including linked objects
4. **Update INDEX.md** with cross-references

## Supported File Types

| Type | Destination | Manifest Category |
|------|-------------|-------------------|
| `.jsx` | `designs/<category>/` | `mockup` |
| `.md` (spec/FRS) | `designs/<category>/` | `spec` |
| `.md` (meeting notes) | `notes/meetings/` | `meeting-notes` |
| `.md` (decision log) | `notes/decisions/` | `decision` |
| `.docx` (requirements) | `assets/requirements-docs/` | `requirements-doc` |
| `.docx` (research) | `assets/research/` | `research-doc` |
| `.pdf` (manual) | `assets/vendor-manuals/` | `vendor-manual` |
| `.csv` / `.json` | `assets/reference-data/` | `reference-data` |
| `.png` / `.jpg` / `.svg` | `assets/images/` | `image` |
| `.txt` / `.md` (transcript) | `notes/transcripts/` | `chat-transcript` |

## Linking Objects

When you drop files, tell Claude what to link. For example:

> "Process uploads. The validation-page.jsx is related to Jira OEG-142 and this Figma link: https://figma.com/..."

Claude will add those links to the manifest entry automatically.

## After Processing

This folder should be empty after Claude finishes. All files get moved to their proper locations. If something can't be categorized, Claude will ask you.
