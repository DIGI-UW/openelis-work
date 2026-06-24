#!/usr/bin/env python3
"""
Publish an OpenELIS user-manual page to Confluence WITH images, automatically.

The Atlassian MCP connector can write a page body but cannot upload attachments, so this script
talks to the Confluence Cloud REST API directly: it uploads each PNG as a page attachment, then
sets the page body (storage format) with <ac:image> references to those attachments.

Auth (never pasted into chat): set these in the environment, or in ~/.openelis/confluence.env
(KEY=VALUE lines, chmod 600). The script reads that file if the env vars are unset.
  CONFLUENCE_BASE   default https://uwdigi.atlassian.net/wiki
  CONFLUENCE_EMAIL  your Atlassian account email
  CONFLUENCE_API_TOKEN   a token from https://id.atlassian.com/manage-profile/security/api-tokens

Input: a storage-format XHTML file whose image slots are tokens of the form  {{IMG:filename.png}}
and an images/ directory holding those PNGs. Each token is replaced with the uploaded attachment.

Usage:
  python3 confluence-publish.py --page <pageId> --xhtml <file.xhtml> --images <dir> [--dry-run]
  python3 confluence-publish.py --create --parent <pageId> --space OG --title "Adding a Patient" --xhtml ... --images ...
"""
import argparse, os, re, sys, json, base64, subprocess, urllib.request, urllib.error

def load_creds():
    env = dict(os.environ)
    cfg = os.path.expanduser("~/.openelis/confluence.env")
    if os.path.exists(cfg):
        for ln in open(cfg):
            ln = ln.strip()
            if ln and not ln.startswith("#") and "=" in ln:
                k, v = ln.split("=", 1); env.setdefault(k.strip(), v.strip())
    base = env.get("CONFLUENCE_BASE", "https://uwdigi.atlassian.net/wiki").rstrip("/")
    email = env.get("CONFLUENCE_EMAIL"); token = env.get("CONFLUENCE_API_TOKEN")
    if not (email and token):
        sys.exit("Missing CONFLUENCE_EMAIL / CONFLUENCE_API_TOKEN (env or ~/.openelis/confluence.env).")
    auth = base64.b64encode(f"{email}:{token}".encode()).decode()
    return base, auth

def api(base, auth, method, path, body=None):
    url = base + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Basic " + auth)
    req.add_header("Accept", "application/json")
    if data is not None: req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r: return json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} -> {e.code}: {e.read().decode()[:400]}")

def existing_attachments(base, auth, page):
    out = {}
    res = api(base, auth, "GET", f"/rest/api/content/{page}/child/attachment?limit=200")
    for a in res.get("results", []): out[a["title"]] = a["id"]
    return out

def upload_attachment(base, auth, page, filepath, existing):
    """curl handles multipart cleanly. Create, or update data if the filename already exists."""
    name = os.path.basename(filepath)
    common = ["-s", "-S", "-H", "Authorization: Basic " + auth, "-H", "X-Atlassian-Token: nocheck", "-F", f"file=@{filepath}"]
    if name in existing:
        url = f"{base}/rest/api/content/{page}/child/attachment/{existing[name]}/data"
    else:
        url = f"{base}/rest/api/content/{page}/child/attachment"
    r = subprocess.run(["curl", *common, "-X", "POST", url], capture_output=True, text=True)
    if r.returncode != 0 or '"statusCode"' in r.stdout and '"results"' not in r.stdout:
        print(f"  ! attachment {name}: {r.stdout[:200]}")
    else:
        print(f"  + attachment {name}")

import struct
def png_width(path):
    """Native pixel width from the PNG IHDR (no PIL needed)."""
    try:
        with open(path, "rb") as f:
            head = f.read(24)
        if head[:8] == b"\x89PNG\r\n\x1a\n" and head[12:16] == b"IHDR":
            return struct.unpack(">I", head[16:20])[0]
    except Exception:
        pass
    return None

def img_macro(name, width=None):
    w = f' ac:width="{width}"' if width else ''
    return f'<ac:image{w}><ri:attachment ri:filename="{name}" /></ac:image>'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--page"); ap.add_argument("--create", action="store_true")
    ap.add_argument("--parent"); ap.add_argument("--space"); ap.add_argument("--title")
    ap.add_argument("--xhtml", required=True); ap.add_argument("--images", required=True)
    ap.add_argument("--max-width", type=int, default=1020, help="max display width in px; small images keep native size")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    base, auth = load_creds()
    body = open(a.xhtml, encoding="utf-8").read()
    imgs = re.findall(r"\{\{IMG:([^}]+)\}\}", body)
    missing = [n for n in imgs if not os.path.exists(os.path.join(a.images, n))]
    if missing: sys.exit("Missing image files for tokens: " + ", ".join(missing))
    def repl(m):
        name = m.group(1); nat = png_width(os.path.join(a.images, name))
        width = min(nat, a.max_width) if nat else a.max_width  # never upscale small images
        return img_macro(name, width)
    final = re.sub(r"\{\{IMG:([^}]+)\}\}", repl, body)
    if a.dry_run:
        print("DRY RUN — images:", imgs); print(final[:600]); return

    # create the page first if needed (empty body), so attachments have a home
    page = a.page
    if a.create:
        created = api(base, auth, "POST", "/rest/api/content", {
            "type": "page", "title": a.title, "space": {"key": a.space},
            "ancestors": [{"id": a.parent}] if a.parent else [],
            "body": {"storage": {"value": "<p/>", "representation": "storage"}},
        })
        page = created["id"]; print("created page", page)

    existing = existing_attachments(base, auth, page)
    for n in sorted(set(imgs)):
        upload_attachment(base, auth, page, os.path.join(a.images, n), existing)

    cur = api(base, auth, "GET", f"/rest/api/content/{page}?expand=version")
    ver = cur["version"]["number"]; title = a.title or cur["title"]
    api(base, auth, "PUT", f"/rest/api/content/{page}", {
        "id": page, "type": "page", "title": title,
        "version": {"number": ver + 1, "message": "user-manual publish (images via REST)"},
        "body": {"storage": {"value": final, "representation": "storage"}},
    })
    print(f"published: {base}/spaces/_/pages/{page}")

if __name__ == "__main__":
    main()
