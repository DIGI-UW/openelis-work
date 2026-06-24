---
name: openelis-user-manual
description: Author an OpenELIS Global user-manual entry (Word doc, Confluence-bound) for a feature or workflow, with an overview, numbered steps, and real cropped screenshots. Use whenever Casey wants to write/draft/update a user manual page, document a feature or workflow for the manual, or produce a how-to for OpenELIS. Captures media via the openelis-screenshots skill and builds the document with the docx skill. Hard rule: document only what is actually BUILT and verified on a live instance — never spec-only behavior.
---

# OpenELIS user-manual authoring

Produces a polished, Confluence-bound manual entry for an OpenELIS feature/workflow. Pairs with
two other skills: **`openelis-screenshots`** (captures the real screens + walkthrough video) and
**`docx`** (builds the Word document). Output is a draft for Casey to review, then publish to the
Confluence user manual.

## The one rule that matters most
**Document only shipped, verified behavior — not the spec.** Many OpenELIS designs are specced but
not yet built (e.g., environmental *regulation-driven test suggestion* is designed but, as of
v3.2.1.x, selecting a compliance standard does NOT auto-add tests — staff pick tests manually).
Before writing any step, confirm it on a live instance. If a capability is only in the FRS/spec,
either omit it or mark it clearly as "planned / not yet available" — never describe it as if a user
can do it today. When unsure, drive the live instance (via openelis-screenshots) and watch what
actually happens; log behavior to confirm.

## Workflow
1. **Scope & verify.** Identify the feature and the exact live route(s) (see
   `openelis-screenshots/routes.md`). Drive the real instance and confirm each step works as you'll
   describe it. Note required fields, gates (e.g., a Save button that stays disabled until X), and
   any behavior that differs from the spec. Pick the right instance: clinical flows →
   testing.openelis-global.org; environmental/vector → indonesiademo.openelis-global.org.
2. **Capture media** with the **openelis-screenshots** skill: one labeled screenshot per pertinent
   step plus the walkthrough video. For long forms, capture a full-page PNG **and section offsets**,
   then crop to the pertinent section so text is readable (recipe below). Save real demo data where
   allowed so screens show populated states, not empty forms. Mask PII.
3. **Structure the document** (see Outline). Lead with an Overview that gives context — what the
   feature is, who uses it, and when/why — before the steps.
4. **Build the .docx** with the docx skill (US Letter, Arial, themed headings, header/footer with
   page numbers, centered figures with italic captions). Validate it.
5. **Deliver for review.** Present the doc + video. Publish to Confluence only on Casey's explicit
   go (then it can be created/updated via the Atlassian connector in storage format).

## Outline (use this shape)
- **Title** (feature/workflow name).
- **Overview / context** — 2-4 sentences: what it is, who uses it, when and why. Name the workflow
  shape (e.g., "a three-step reception wizard"). State prerequisites/permissions and where to find
  it (menu path + route).
- **Step-by-step** — numbered steps, imperative voice, one cropped screenshot per pertinent step
  with a figure caption. Call out required fields and any gates ("Save & Next stays disabled until…").
- **Field reference** — a table of the key fields and notes.
- **Tips / notes** — shortcuts, gotchas, and how anomalies are handled (e.g., NCE).
- Keep claims to verified behavior; if you reference something not-yet-built, label it explicitly.

## Cropping recipe (readable section images from a long form)
In the capture spec: after filling the form, take a full-page screenshot and record each section
heading's document offset:
```js
await page.screenshot({ path: `${OUT}/_full.png`, fullPage: true, animations: 'disabled' });
const offsets = await page.evaluate(() => {
  const names = ['Lab Number','Sampling Site','Default Collection Conditions','Per-Sample Manifest'];
  const els = [...document.querySelectorAll('h2,h3,h4,div,label,span')];
  const out = { _dpr: devicePixelRatio };
  for (const n of names) { const e = els.find(x => (x.textContent||'').trim() === n && x.getBoundingClientRect().height < 60);
    if (e) out[n] = Math.round(e.getBoundingClientRect().top + scrollY); }
  return out;
});
require('fs').writeFileSync(`${OUT}/_offsets.json`, JSON.stringify(out));
```
Then crop in the sandbox with PIL (multiply offsets by `_dpr`; crop from one section's top to the
next section's top):
```python
from PIL import Image, json
im = Image.open('_full.png'); o = json.load(open('_offsets.json')); d = o['_dpr']
order = ['Lab Number','Sampling Site','Default Collection Conditions','Per-Sample Manifest']
ys = [(n, int(o[n]*d)) for n in order if n in o]
for i,(n,y) in enumerate(ys):
    y2 = ys[i+1][1] if i+1 < len(ys) else im.height
    im.crop((0, max(0,y-20), im.width, y2)).save(f'{n.lower().replace(" ","-")}.png')
```
Crops are full-resolution, so the section text stays legible in the doc.

## Document styling (docx)
- Page: US Letter (12240×15840 DXA), 1" margins. Font: Arial. Themed H1/H2 color per domain
  (clinical blue `15487F`, environmental green `1B5E20`).
- Header rule + footer with menu-path breadcrumb and page number.
- Images centered; cap very tall images by height (~800px) and wide ones by width (~600px);
  prefer cropped sections over full-page where legibility matters. Italic gray captions.
- Required `ImageRun` `type` + `altText`. Validate with the docx skill's `validate.py`.

## Confluence publishing — automated, images and all (WORKING)
Alongside the `.docx`, emit a **Confluence storage-format XHTML** + an `images/` folder; the publisher
uploads the PNGs as page attachments and embeds them. Verified end-to-end (the Atlassian MCP can write
a page body but cannot upload attachments, so we use the REST publisher).

Storage XHTML format: prose + plain captions, with each image slot a token on its own line:
`<p>{{IMG:01-search.png}}</p>` (one per screenshot; the matching PNG lives in `images/`). The publisher
replaces each token with `<ac:image><ri:attachment ri:filename="01-search.png"/></ac:image>`.

Publish (run on Casey's Mac; token lives in `~/.openelis/confluence.env`, never in chat):
```
cd ~/Documents/OpenELIS\ QA/docs-manual/publish
# new draft for review (parent 1189609473 = "New User Manual sections to be verified", space OG):
python3 confluence-publish.py --create --space OG --parent 1189609473 \
  --title "<Feature> (draft — verify)" --xhtml <section>.xhtml --images <section>/images
# update an existing page instead:
python3 confluence-publish.py --page <pageId> --xhtml <section>.xhtml --images <dir>
```
Re-runs are idempotent (attachments matched by filename, page version bumped). `--dry-run` previews.
Always publish a **draft under 1189609473 for verification first**; promote to the live manual only
after Casey signs off. The script + a worked Add-a-Patient example live in
`openelis-work/docs-manual/publish/` (see its README).

Fallbacks: **Word import** (Confluence → Insert → Import Word document on the `.docx` — images come
inline, needs no token) or **manual drag** (publish prose with empty `<p/>` slots + a grey
`[ drop image: ... ]` hint per figure; reader drags the PNG in).

Caption rule (all paths): captions describe the screen for the reader only — **never** include
"captured", "captured automatically", or tool/provenance wording; that would force a cleanup pass.
Link the new page from the relevant manual index; keep the walkthrough video as a linked asset.

## Provenance & staleness (feeds the Doc Freshness Tracker)
Every page you author must register a **provenance + drift contract** so it can be watched for going
stale. Add/extend an entry in `OpenELIS QA/docs-manual/contracts.json`:
- `id`, `title`, `manualDoc`, `captureSpec`
- `base` (the instance the manual documents) and `capturedVersion` (OpenELIS version captured against)
- `routes[]` — each with `path` and `anchors[]`: the on-load headings / field labels / buttons the
  manual relies on (e.g., "Lab Number", "Save & Next", "New Patient"). Pick anchors visible on
  initial load so the check doesn't false-positive on interactive-only elements.

`tests/docs/drift.check.spec.ts` visits each route and asserts the anchors exist; it writes
`docs-manual/drift-report.json` with per-section status: **ok** (anchors present, version matches) ·
**review** (instance version ≠ capturedVersion) · **drift** (a documented control is missing → the
UI changed, re-capture and re-verify) · **error** (route failed). The weekly `openelis-docs-drift-weekly`
scheduled task re-runs it, commits the report to `DIGI-UW/openelis-work` (`docs-manual/`), and the
**OpenELIS Doc Freshness Tracker** artifact renders it in its "Manual section UI drift" card. So when
this skill ships a page, it also makes that page self-monitoring: if the screen later changes, the
tracker flags the exact section and missing control. Re-run the capture and rebuild the doc, then
bump `capturedVersion`.

## Definition of done
Overview gives real context; every step is verified against the live build (no spec-only claims);
images are cropped and legible with captions; PII masked; a walkthrough video accompanies it; the
doc validates; and it's delivered for review before any publish.
