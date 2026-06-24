# Confluence auto-publish (images via REST)

Publishes a user-manual page to Confluence **with screenshots embedded**, no manual dragging.
The Atlassian MCP connector can write a page body but can't upload attachments, so this uses the
Confluence Cloud REST API directly (`confluence-publish.py`).

## One-time setup — your API token (never paste it into chat)
1. Create a token at https://id.atlassian.com/manage-profile/security/api-tokens
2. Store it on your Mac so the script can read it and Claude never sees the value:
   ```bash
   mkdir -p ~/.openelis && cat > ~/.openelis/confluence.env <<'EOF'
   CONFLUENCE_BASE=https://uwdigi.atlassian.net/wiki
   CONFLUENCE_EMAIL=caseyi@uw.edu
   CONFLUENCE_API_TOKEN=<paste-your-token-here>
   EOF
   chmod 600 ~/.openelis/confluence.env
   ```
   (Or export the same three as environment variables.)

## Publish
Update an existing page:
```bash
python3 confluence-publish.py --page <pageId> \
  --xhtml examples/add-patient.xhtml --images examples/images
```
Create a new page under a parent:
```bash
python3 confluence-publish.py --create --space OG --parent <parentPageId> \
  --title "Adding a Patient" --xhtml examples/add-patient.xhtml --images examples/images
```
`--dry-run` previews the resolved body and the image list without touching Confluence.

## Input format
- The XHTML is Confluence **storage format**. Each image slot is a token `{{IMG:filename.png}}`
  on its own line; the script uploads `images/filename.png` and replaces the token with
  `<ac:image><ri:attachment ri:filename="filename.png"/></ac:image>`.
- Captions are plain text — no "captured"/provenance wording.
- Re-running is safe: existing attachments are updated in place (matched by filename), and the page
  body is replaced (version bumped).

## Where the input comes from
The `openelis-user-manual` skill produces this storage XHTML + the matching `images/` folder for a
section (same screenshots used in the Word doc). For the two finished pages, examples/ has Add-a-Patient;
the Environmental page follows the same shape.
