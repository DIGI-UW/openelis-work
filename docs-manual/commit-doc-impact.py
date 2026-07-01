#!/usr/bin/env python3
"""
Commit -> doc impact scanner for the OpenELIS Doc Freshness pipeline (step 2 of the weekly run).

Two outputs, both consumed by the Doc Freshness Tracker artifact:
  1. Per-section `codeChanged` merged into drift-report.json — for EACH watched branch, the count of
     commits touching that section's uiPaths SINCE the section was captured (capturedDate). Extends
     the prior develop-only signal to develop + demo-silnas, with a per-branch breakdown.
  2. commit-doc-impact.json `uncovered` — frontend component areas changed in the recent window that
     match NO documented section's uiPaths = candidate NEW manual pages.

Surface-only: never files tickets. Run on the Mac (uses `gh api`; gh must be authenticated).
"""
import json, os, subprocess, datetime

REPO = "DIGI-UW/OpenELIS-Global-2"
BRANCHES = ["develop", "demo-silnas"]
# Operate in the script's own directory (the docs-manual it ships in), so the weekly run can place it
# in the harness docs-manual/ and step 3 copies the outputs to openelis-work alongside drift-report.json.
DM = os.path.dirname(os.path.abspath(__file__))
CONTRACTS = os.path.join(DM, "contracts.json")
DRIFT = os.path.join(DM, "drift-report.json")
OUT = os.path.join(DM, "commit-doc-impact.json")
COMP_PREFIX = "frontend/src/components/"
UNCOVERED_WINDOW_DAYS = 30


def gh_json(args):
    r = subprocess.run(["gh", "api"] + args, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("gh api failed: " + r.stderr.strip()[:200])
    return json.loads(r.stdout or "null")


def commits_for_path(branch, path, since):
    try:
        arr = gh_json(["-X", "GET", "repos/%s/commits" % REPO, "-f", "sha=" + branch,
                       "-f", "path=" + path, "-f", "since=" + since,
                       "--jq", '[.[]|{sha:.sha[0:7],date:.commit.committer.date,msg:(.commit.message|split("\\n")[0])}]'])
        return arr or []
    except Exception:
        return []


def head_sha(branch):
    return gh_json(["repos/%s/commits/%s" % (REPO, branch)])["sha"]


def base_from_window(branch, days):
    until = (datetime.datetime.utcnow() - datetime.timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    arr = gh_json(["-X", "GET", "repos/%s/commits" % REPO, "-f", "sha=" + branch,
                   "-f", "until=" + until, "-f", "per_page=1", "--jq", "[.[0].sha]"])
    return arr[0] if arr else None


def comp_dir(fn):
    return COMP_PREFIX + fn[len(COMP_PREFIX):].split("/", 1)[0]


def main():
    contracts = json.load(open(CONTRACTS))["sections"]
    rep = json.load(open(DRIFT)) if os.path.exists(DRIFT) else {"sections": []}
    by = {s["id"]: s for s in rep.get("sections", [])}

    # --- 1. per-section codeChanged across both branches, since each section's capturedDate ---
    all_ui = []
    for s in contracts:
        all_ui += [u.rstrip("/") for u in s.get("uiPaths", [])]
    all_ui = set(all_ui)

    for s in contracts:
        ui = s.get("uiPaths")
        if not ui:
            continue
        since = s.get("capturedDate", "2026-06-24") + "T00:00:00Z"
        branches = {}
        total = 0
        latest = None
        for br in BRANCHES:
            n = 0
            for p in ui:
                for c in commits_for_path(br, p, since):
                    n += 1
                    if latest is None or c["date"] > latest["date"]:
                        latest = {"sha": c["sha"], "date": c["date"][:10], "msg": c["msg"][:120], "branch": br}
            branches[br] = n
            total += n
        cc = {"count": total, "since": since[:10], "paths": ui, "branches": branches, "latest": latest}
        if s["id"] in by:
            by[s["id"]]["codeChanged"] = cc

    # --- 2. uncovered component areas (changed recently, documented by no section) ---
    uncovered = {}
    windows = {}
    for br in BRANCHES:
        head = head_sha(br)
        base = base_from_window(br, UNCOVERED_WINDOW_DAYS)
        if not base:
            windows[br] = {"commitCount": 0}
            continue
        cmp = gh_json(["repos/%s/compare/%s...%s" % (REPO, base, head)])
        windows[br] = {"base": base[:8], "head": head[:8], "commitCount": len(cmp.get("commits", [])),
                       "windowDays": UNCOVERED_WINDOW_DAYS}
        for f in [x["filename"] for x in cmp.get("files", []) if x["filename"].startswith(COMP_PREFIX)]:
            if any(f.startswith(u + "/") or f == u for u in all_ui):
                continue
            cd = comp_dir(f)
            u = uncovered.setdefault(cd, {"componentDir": cd, "branches": set(), "files": []})
            u["branches"].add(br)
            if f not in u["files"]:
                u["files"].append(f)

    unc_list = sorted(
        [{"componentDir": u["componentDir"], "branches": sorted(u["branches"]),
          "fileCount": len(u["files"]), "files": u["files"][:25]} for u in uncovered.values()],
        key=lambda r: -r["fileCount"])

    rep["codeSignalBranches"] = BRANCHES
    json.dump(rep, open(DRIFT, "w"), indent=2)
    impact = {
        "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "repo": REPO, "branchesWatched": BRANCHES, "windows": windows,
        "uncovered": unc_list,
    }
    json.dump(impact, open(OUT, "w"), indent=2)

    nchg = sum(1 for s in by.values() if s.get("codeChanged", {}).get("count", 0) > 0)
    print("merged codeChanged into drift-report.json (%d/%d sections changed since capture)" % (nchg, len(by)))
    print("wrote %s — %d uncovered area(s)" % (OUT, len(unc_list)))
    for r in unc_list[:10]:
        print("   ? %-44s %d file(s) %s" % (r["componentDir"], r["fileCount"], r["branches"]))


if __name__ == "__main__":
    main()
