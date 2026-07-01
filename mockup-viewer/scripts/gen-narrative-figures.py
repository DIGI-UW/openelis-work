#!/usr/bin/env python3
"""
Generate schematic phase diagrams for the AMR / Microbiology Workflow Walk-through
(Confluence page 1315209256, narrative v2.1). Outputs SVG + PNG into
mockup-viewer/public/narrative-figures/ so they publish to GitHub Pages and can be
embedded in the Confluence page by external URL.

Run:  python3 scripts/gen-narrative-figures.py
Deps: cairosvg  (pip install cairosvg --break-system-packages)
"""
import os, math, html
import cairosvg

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'narrative-figures')
os.makedirs(OUT, exist_ok=True)

FONT = "IBM Plex Sans, DejaVu Sans, Arial, sans-serif"
MONO = "IBM Plex Mono, DejaVu Sans Mono, monospace"

# palette
INK   = "#161616"; MUTED = "#5a6672"; LINE = "#c1c7cd"; PAGE = "#ffffff"; BANDBG = "#f4f7fb"
BLUE  = "#0f62fe"; BLUE_BG  = "#edf5ff"
NEW   = "#8a3ffc"; NEW_BG   = "#f6f0ff"
REUSE = "#697077"; REUSE_BG = "#eef1f4"
GREEN = "#198038"; GREEN_BG = "#defbe6"
RED   = "#da1e28"; RED_BG   = "#fff1f1"
AMBER = "#a06a00"; AMBER_BG = "#fff6e0"

KIND = {
    'blue':  (BLUE, BLUE_BG), 'new': (NEW, NEW_BG), 'reuse': (REUSE, REUSE_BG),
    'green': (GREEN, GREEN_BG), 'red': (RED, RED_BG), 'amber': (AMBER, AMBER_BG),
}

def esc(s): return html.escape(str(s), quote=True)

class Fig:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.el = []
    def add(self, s): self.el.append(s)
    def rect(self, x, y, w, h, fill, stroke=None, rx=10, sw=2, dash=None):
        d = f' stroke="{stroke}" stroke-width="{sw}"' if stroke else ''
        if dash: d += f' stroke-dasharray="{dash}"'
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"{d}/>')
    def line(self, x1, y1, x2, y2, color=LINE, sw=2, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"{d}/>')
    def text(self, x, y, s, size=15, color=INK, weight="400", anchor="start", font=FONT, spacing=None):
        ls = f' letter-spacing="{spacing}"' if spacing else ''
        self.add(f'<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" font-weight="{weight}" '
                 f'fill="{color}" text-anchor="{anchor}"{ls}>{esc(s)}</text>')
    def mlines(self, x, y, lines, size=14, color=INK, weight="400", anchor="middle", lh=18, font=FONT):
        for i, ln in enumerate(lines):
            self.text(x, y + i*lh, ln, size=size, color=color, weight=weight, anchor=anchor, font=font)
    def chip(self, x, y, label, kind='blue', size=12):
        c, bg = KIND[kind]
        w = 16 + len(label)*7.0
        self.rect(x, y, w, 22, bg, stroke=c, rx=11, sw=1.3)
        self.text(x + w/2, y + 15, label, size=size, color=c, weight="600", anchor="middle")
        return w
    def node(self, x, y, w, h, title_lines, kind='blue', tag=None, sub=None):
        c, bg = KIND[kind]
        self.rect(x, y, w, h, bg, stroke=c, rx=12, sw=2)
        self.rect(x, y, 6, h, c, rx=0)  # left accent
        cy = y + h/2 - (len(title_lines)-1)*9 + (4 if not sub else -6)
        self.mlines(x + w/2 + 3, cy + 5, title_lines, size=15, color=INK, weight="600", lh=18)
        if sub:
            self.mlines(x + w/2 + 3, y + h - 14, [sub], size=12, color=MUTED, lh=14)
        if tag:
            self.text(x + 14, y + 20, tag, size=11, color=c, weight="700", spacing="0.5")
    def arrow(self, p1, p2, color=BLUE, sw=2.4, label=None, dashed=False, lcolor=None, loff=(0,-7)):
        x1, y1 = p1; x2, y2 = p2
        dash = "7 6" if dashed else None
        ang = math.atan2(y2-y1, x2-x1)
        # stop short for arrowhead
        sx, sy = x2 - 11*math.cos(ang), y2 - 11*math.sin(ang)
        self.line(x1, y1, sx, sy, color=color, sw=sw, dash=dash)
        a = 9
        lx, ly = x2 - a*math.cos(ang - 0.42), y2 - a*math.sin(ang - 0.42)
        rx, ry = x2 - a*math.cos(ang + 0.42), y2 - a*math.sin(ang + 0.42)
        self.add(f'<polygon points="{x2},{y2} {lx},{ly} {rx},{ry}" fill="{color}"/>')
        if label:
            mx, my = (x1+x2)/2 + loff[0], (y1+y2)/2 + loff[1]
            self.text(mx, my, label, size=12, color=lcolor or MUTED, weight="500", anchor="middle")
    def header(self, kicker, title, sub=None):
        self.rect(0, 0, self.w, 86, BANDBG, rx=0)
        self.line(0, 86, self.w, 86, color="#dde3ea", sw=1)
        self.rect(0, 0, 8, 86, BLUE, rx=0)
        self.text(40, 34, kicker, size=14, color=BLUE, weight="700", spacing="1.2")
        self.text(40, 64, title, size=24, color=INK, weight="700")
        if sub:
            self.text(self.w-40, 52, sub, size=13, color=MUTED, anchor="end")
    def footer(self):
        self.text(40, self.h-16, "OpenELIS Global — Microbiology / AMR module · Workflow Walk-through v2.1",
                  size=12, color=MUTED)
        self.text(self.w-40, self.h-16, "schematic — see narrative for detail", size=12, color=MUTED, anchor="end")
    def legend(self, x, y, items):
        cx = x
        for label, kind in items:
            c, bg = KIND[kind]
            self.rect(cx, y, 16, 16, bg, stroke=c, rx=4, sw=1.4)
            self.text(cx+24, y+13, label, size=12, color=MUTED)
            cx += 34 + len(label)*7.0
    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" '
                f'viewBox="0 0 {self.w} {self.h}"><rect width="{self.w}" height="{self.h}" fill="{PAGE}"/>'
                + "".join(self.el) + "</svg>")
    def save(self, name):
        svg = self.svg()
        with open(os.path.join(OUT, name + ".svg"), "w") as f: f.write(svg)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=os.path.join(OUT, name + ".png"),
                         output_width=self.w*2, output_height=self.h*2)  # 2x for crisp
        print("wrote", name)

# convenience anchors
def bottom(x,y,w,h): return (x+w/2, y+h)
def top(x,y,w,h): return (x+w/2, y)
def right(x,y,w,h): return (x+w, y+h/2)
def left(x,y,w,h): return (x, y+h/2)

W = 1600

def flow_row(fig, y, items, x0=80, x1=1520, h=116, arrow_color=BLUE, gap=48):
    n = len(items)
    w = (x1 - x0 - gap*(n-1)) / n
    rects = []
    cx = x0
    for it in items:
        lines, kind = it[0], it[1]
        tag = it[2] if len(it) > 2 else None
        chip = it[3] if len(it) > 3 else None
        fig.node(cx, y, w, h, lines, kind=kind, tag=tag)
        if chip:
            cw = 16 + len(chip)*7.0
            fig.chip(cx + w/2 - cw/2, y + h + 10, chip, kind='reuse')
        rects.append((cx, y, w, h))
        cx += w + gap
    for i in range(n-1):
        fig.arrow(right(*rects[i]), left(*rects[i+1]), color=arrow_color)
    return rects

def caption(fig, lines):
    yb = fig.h - 70
    fig.line(40, yb-26, fig.w-40, yb-26, color="#e2e7ec", sw=1)
    fig.mlines(40, yb, lines, size=14, color=MUTED, anchor="start", lh=20)

LEG = [("new", 'new'), ("reuse / existing", 'reuse'), ("pipeline", 'blue'), ("output", 'green'), ("critical", 'red')]

# ── Figure: Overview ──────────────────────────────────────────────
def f_overview():
    f = Fig(W, 980)
    f.header("THE WHOLE WORKFLOW", "How the phases compose — order to surveillance",
             "narrative v2.1 · 2026-06-08")
    # inputs row
    iy = 110
    oe = (60, iy, 300, 80); sc = (430, iy, 300, 80); tc = (800, iy, 360, 80)
    f.node(*oe, ["Order Entry", "Step 1 · Program = MICROBIOLOGY"], kind='reuse')
    f.node(*sc, ["Sample Collection", "Sample row written"], kind='reuse')
    f.node(*tc, ["Test Catalog", "micro tests carry workflow_type + WHONET codes"], kind='reuse')
    f.arrow(right(*oe), left(*sc), color=REUSE)
    f.arrow(bottom(*tc), (980, 250), color=REUSE, dashed=True, label="reads")
    f.arrow(bottom(*sc), (580, 250), color=REUSE, label="post-save hook")
    # phase 0 resolver
    p0 = (430, 250, 540, 96)
    f.node(*p0, ["Phase 0 · M-03 resolver", "reads test.workflow_type → selects Case profile"], kind='blue', tag="ROUTING")
    f.chip(450, 360, "BACTERIOLOGY → M-04", kind='blue'); f.chip(720, 360, "MYCOBACTERIOLOGY_TB → M-14", kind='amber')
    # bacterial rail
    ry = 460
    items = [
        (["Phase 1", "Pre-analytical"], 'new', None, "RECEIVED→INCUBATING"),
        (["Phase 2", "Day 1 growth"], 'new', None, "ISOLATE"),
        (["Phase 3", "ID + AST"], 'new', None, "AST_IN_PROGRESS"),
        (["Phase 4", "Expert Rules"], 'new', None, "READY_REVIEW"),
        (["Phase 5", "Final report"], 'new', None, "FINAL_REPORTED"),
        (["Phase 6", "WHONET export"], 'green', None, "surveillance"),
        (["Phase 8", "GLASS / FHIR"], 'green', None, "central"),
    ]
    rects = flow_row(f, ry, items, x0=60, x1=1540, h=104, gap=30)
    f.arrow(bottom(*p0), top(*rects[0]), color=BLUE)
    # TB lane
    ty = 660
    tb = (60, ty, 1480, 86)
    f.node(*tb, ["Phase 7 · TB profile on the SAME M-04 workbench",
                 "AFB smear → GeneXpert (MTB ± rif-R) → MGIT/LJ culture (weeks) → species ID (MTB vs NTM) → DST at WHO critical conc. → MDR/pre-XDR/XDR"],
           kind='amber')
    f.arrow((760, 384), (260, ty), color=AMBER, dashed=True)
    f.text(70, 632, "Phase 0 routes here when workflow_type = MYCOBACTERIOLOGY_TB", size=12, color=AMBER, weight="600")
    # cross-cutting strip
    cy = 790
    f.text(60, cy-6, "CROSS-CUTTING (parallel to Phases 1–7)", size=12, color=MUTED, weight="700", spacing="0.8")
    cc = [("Macro Library — type .code → full text", 'reuse'),
          ("Antibiogram (M-13) — cumulative %S, read-only", 'reuse'),
          ("Alerts dashboard + QA/QC — reuse existing", 'reuse')]
    cwx = 60
    for label, kind in cc:
        w = 24 + len(label)*7.1
        f.rect(cwx, cy, w, 40, KIND[kind][1], stroke=KIND[kind][0], rx=8, sw=1.4)
        f.text(cwx+14, cy+25, label, size=13, color=INK)
        cwx += w + 24
    f.legend(60, 905, LEG)
    f.footer()
    f.save("00-overview")

# ── Figure: Phase 0 ──────────────────────────────────────────────
def f_phase0():
    f = Fig(W, 600)
    f.header("PHASE 0", "Workflow selection — the routing rule everything hangs off")
    src = (60, 150, 380, 96)
    f.node(*src, ["Ordered test", "carries workflow_type (data, not a clerk choice)"], kind='reuse')
    res = (560, 150, 360, 96)
    f.node(*res, ["M-03 resolver", "createCaseForSample(sampleId, workflowType)"], kind='blue', tag="AT SAMPLE-SAVE")
    f.arrow(right(*src), left(*res), color=BLUE, label="reads")
    # three profile branches
    b1 = (1040, 70, 500, 70); b2 = (1040, 165, 500, 70); b3 = (1040, 260, 500, 70)
    f.node(*b1, ["BACTERIOLOGY → M-04 bacterial profile"], kind='new')
    f.node(*b2, ["MYCOBACTERIOLOGY_TB → M-14 TB profile"], kind='amber')
    f.node(*b3, ["MYCOLOGY → future (M-15)"], kind='reuse')
    for b in (b1, b2, b3):
        f.arrow(right(*res), left(*b), color=LINE)
    # what the profile drives
    dy = 380
    f.text(60, dy-6, "The selected Case profile is the single source of truth — it drives:", size=14, color=INK, weight="600")
    drives = ["Sections rendered", "Breakpoint family", "Culture-protocol Method", "Reflex cascade", "WHONET export flavor"]
    dx = 60
    for d in drives:
        w = 20 + len(d)*7.3
        f.rect(dx, dy+10, w, 38, BLUE_BG, stroke=BLUE, rx=8, sw=1.4)
        f.text(dx+12, dy+34, d, size=13, color=BLUE, weight="500")
        dx += w + 18
    caption(f, ["One-protocol-per-case: a specimen needing routine culture AND TB = two ordered tests → two Cases,",
                "keyed (sample_item_id, workflow_type), sharing one SampleItem (no double accessioning), cross-linked as siblings."])
    f.footer()
    f.save("01-phase-0-workflow-selection")

# ── Figure: Phase 1 ──────────────────────────────────────────────
def f_phase1():
    f = Fig(W, 560)
    f.header("PHASE 1", "Pre-analytical — order, arrival, accessioning, culture setup", "MVP-1A")
    items = [
        (["Order Entry", "Step 1 micro fields"], 'reuse'),
        (["Sample Collection", "Sample row + post-save hook"], 'reuse'),
        (["Case created", "stage RECEIVED"], 'new', "NEW ENTITY"),
        (["Inoculation logged", "plates / bottles + lots"], 'new', None, "INCUBATING"),
    ]
    r = flow_row(f, 170, items, h=120)
    # QC lot input into inoculation
    f.text(r[3][0]+r[3][2]/2, 330, "← QC lot lookup (qc_lot) blocks expired/locked lots", size=12, color=MUTED, anchor="middle")
    caption(f, ["New: micro_case table + profile-aware service, Pending Cultures worklist, Timeline + Inoculation.",
                "Reuses Order Entry, Sample Collection, Test Catalog (default protocol from Test Catalog v2.5)."])
    f.footer()
    f.save("02-phase-1-pre-analytical")

# ── Figure: Phase 2 ──────────────────────────────────────────────
def f_phase2():
    f = Fig(W, 600)
    f.header("PHASE 2", "Analytical Day 1 — incubation, positive detection, gram stain, prelim ID", "MVP-1A")
    items = [
        (["INCUBATING", "morning worklist"], 'blue'),
        (["Positive signal /", "growth detected"], 'new', None, "POSITIVE_SIGNAL"),
        (["Gram stain +", "Isolate created"], 'new', "NEW ENTITY", "ORGANISM_ID"),
        (["Subculture", "to plates"], 'new'),
    ]
    r = flow_row(f, 170, items, h=120)
    # analyzer input
    an = (60, 360, 470, 70)
    f.node(*an, ["Analyzer channel (Phase 1A+)", "BacT/Alert pushes POSITIVE_SIGNAL"], kind='reuse')
    f.arrow(top(*an), bottom(*r[1]), color=REUSE, dashed=True)
    # critical out
    cr = (1070, 360, 470, 70)
    f.node(*cr, ["Critical notification (M-11)", "blood GNR → call-back + read-back"], kind='red')
    f.arrow(bottom(*r[2]), top(*cr), color=RED)
    caption(f, ["Critical results REUSE the existing notifications/alerts dashboard + TestNotificationService —",
                "M-11 adds only the inline Open→Acknowledged→Closed loop and the polymorphic CASE/ISOLATE/SAMPLE target. Macros debut here."])
    f.footer()
    f.save("03-phase-2-day1")

# ── Figure: Phase 3 ──────────────────────────────────────────────
def f_phase3():
    f = Fig(W, 600)
    f.header("PHASE 3", "Analytical Day 2 — final ID, AST setup, interpretation", "MVP-1A")
    items = [
        (["Read subculture", "isolated colonies"], 'blue'),
        (["Final ID", "isolate.organism_id"], 'new'),
        (["AST Run created", "panel × breakpoint × method"], 'new', "NEW ENTITY", "AST_IN_PROGRESS"),
        (["AST results", "MIC / zone"], 'new'),
        (["S / I / R", "interpreted"], 'green'),
    ]
    r = flow_row(f, 170, items, h=120, gap=34)
    ref = (80, 360, 600, 86)
    f.node(*ref, ["Reference data (admin)", "M-01 Organism / Antibiotic / Panel · M-02 Breakpoint catalog (versioned)"], kind='reuse')
    f.arrow(top(*ref), bottom(*r[2]), color=REUSE, dashed=True, label="config")
    svc = (1000, 360, 540, 70)
    f.node(*svc, ["BreakpointLookupService", "MIC/zone → S/I/R, snapshots breakpoint version"], kind='new')
    f.arrow(top(*svc), bottom(*r[4]), color=NEW)
    caption(f, ["AST results land from the analyzer (VITEK 2 / Phoenix, Phase 1A+) or by manual entry (MVP-1A).",
                "A Ceftriaxone-R flag here is what triggers the Expert Rules in Phase 4."])
    f.footer()
    f.save("04-phase-3-day2-ast")

# ── Figure: Phase 4 ──────────────────────────────────────────────
def f_phase4():
    f = Fig(W, 620)
    f.header("PHASE 4", "Expert Rules + supervisor review", "Phase 1B (manual overrides in MVP-1A)")
    eng = (60, 150, 360, 110)
    f.node(*eng, ["Expert Rule engine", "runs on AST state-change"], kind='new', tag="PHASE 1B")
    f.arrow(right(*eng), (520, 205), color=NEW)
    rules = ["MRSA inference", "D-test required", "ESBL screen / confirm", "Cascade reporting", "Intrinsic resistance"]
    ry = 120
    for rr in rules:
        f.rect(540, ry, 360, 44, NEW_BG, stroke=NEW, rx=8, sw=1.4)
        f.text(560, ry+28, rr, size=14, color=INK)
        ry += 56
    flag = (980, 150, 280, 110)
    f.node(*flag, ["Flags on", "Expert Review panel", "(inline, not modal)"], kind='new')
    ovr = (980, 300, 280, 90)
    f.node(*ovr, ["Override applied", "original preserved"], kind='blue')
    rev = (1320, 220, 220, 110)
    f.node(*rev, ["Supervisor", "Mark Ready", "→ READY_REVIEW"], kind='green')
    f.arrow((900, 205), left(*flag), color=NEW)
    f.arrow(bottom(*flag), top(*ovr), color=BLUE)
    f.arrow(right(*flag), left(*rev), color=GREEN)
    caption(f, ["Rules are evaluated server-side after AST results land and surface as flags on the Case's inline Expert Review panel.",
                "A failed rule application auto-creates an NCE; critical resistance raises an alert via the existing dashboard."])
    f.footer()
    f.save("05-phase-4-expert-rules")

# ── Figure: Phase 5 ──────────────────────────────────────────────
def f_phase5():
    f = Fig(W, 560)
    f.header("PHASE 5", "Post-analytical — final report, distribution, amendments", "MVP-1A")
    items = [
        (["Supervisor releases", "READY_REVIEW"], 'green'),
        (["Micro report PDF", "new Jasper template"], 'new'),
        (["Distribute", "email · print · FHIR push"], 'reuse', None, "FINAL_REPORTED"),
    ]
    r = flow_row(f, 170, items, x0=80, x1=1180, h=120)
    am = (1240, 170, 300, 120)
    f.node(*am, ["Amendment", "new version, audit-trailed", "original never deleted"], kind='blue', tag="PHASE 1A+")
    f.arrow(right(*r[2]), left(*am), color=BLUE, label="v2", dashed=True)
    caption(f, ["Reuses the existing Patient Reports module — PDF generation, distribution pipeline, FHIR push — no new infrastructure.",
                "Critical-communication audit log per Case satisfies ISO 15189 §7.4 (reuses M-11)."])
    f.footer()
    f.save("06-phase-5-post-analytical")

# ── Figure: Phase 6 ──────────────────────────────────────────────
def f_phase6():
    f = Fig(W, 560)
    f.header("PHASE 6", "Surveillance — WHONET export (painless by design)", "Phase 1B")
    items = [
        (["Completed Cases", "read-only"], 'blue'),
        (["Dedup", "1 isolate / patient / organism / 7d"], 'new'),
        (["WHONET CSV", "extends WHONetReportService"], 'green'),
        (["National reference lab", "→ GLASS"], 'reuse'),
    ]
    r = flow_row(f, 175, items, h=120)
    f.text(r[1][0]+r[1][2]/2, 340, "codes pre-loaded + auto-mapped (M-01 seed); readiness = codes actually in the export",
           size=12, color=MUTED, anchor="middle")
    caption(f, ["M-09 EXTENDS OpenELIS's existing Reports→WHONET path — it does not build a parallel system.",
                "Antibiotic + breakpoint codes are read-through from test_amr_config; FHIR (Phase 8) is the lowest-effort path where available."])
    f.footer()
    f.save("07-phase-6-whonet")

# ── Figure: Phase 7 (TB) ─────────────────────────────────────────
def f_phase7():
    f = Fig(W, 640)
    f.header("PHASE 7", "Mycobacteriology / TB — the same M-04 workbench, in 'TB profile'", "TB cycle")
    items = [
        (["AFB smear", "same day · WHO grade"], 'amber', None, "SMEAR_DONE"),
        (["GeneXpert Ultra", "MTB ± rif-R"], 'red', None, "MOLECULAR_DONE"),
        (["MGIT / LJ culture", "weeks"], 'amber', None, "CULTURE_INCUBATING"),
        (["Species ID", "MTB vs NTM"], 'amber', None, "SPECIES_ID"),
        (["DST", "WHO critical conc."], 'amber', None, "DST → REVIEW"),
    ]
    r = flow_row(f, 165, items, h=118, gap=30)
    # off-ramp + classification
    f.text(r[1][0]+r[1][2]/2, 320, "rif-R → critical notify (M-11)", size=12, color=RED, anchor="middle", )
    f.text(r[3][0]+r[3][2]/2, 320, "NTM → off-ramp DST", size=12, color=MUTED, anchor="middle")
    cls = (1080, 360, 460, 80)
    f.node(*cls, ["Auto-classify from drug profile", "MDR / pre-XDR / XDR"], kind='red')
    f.arrow(bottom(*r[4]), top(*cls), color=RED)
    reuse = (60, 360, 760, 80)
    f.node(*reuse, ["Reuses M-04 Case/Isolate/Timeline · M-05 micro_ast_run (interpretation_method = CRITICAL_CONCENTRATION) · M-08 · M-11 · M-12"], kind='reuse')
    caption(f, ["TB is mostly profile configuration + the WHO-TB breakpoint family, not net-new infrastructure.",
                "Each step releases a staged interim report (clinicians can't wait weeks); DST reconciles with the molecular rif call."])
    f.footer()
    f.save("08-phase-7-tb")

# ── Figure: Phase 8 (GLASS) ──────────────────────────────────────
def f_phase8():
    f = Fig(W, 540)
    f.header("PHASE 8", "Central surveillance — GLASS / consolidated-FHIR (M-15, the last module)")
    d1 = (60, 170, 360, 120); d2 = (60, 320, 360, 90)
    f.node(*d1, ["OpenELIS deployment A", "finalized AMR + TB results"], kind='blue')
    f.node(*d2, ["OpenELIS deployment B …", "each pushes its own"], kind='blue')
    fhir = (560, 220, 360, 120)
    f.node(*fhir, ["FHIR push", "DiagnosticReport + per-drug Observations", "(WHO AMR profiles)"], kind='new', tag="REUSES OE FHIR STACK")
    srv = (1060, 200, 480, 150)
    f.node(*srv, ["Consolidated FHIR server", "cross-lab first-isolate dedup", "→ GLASS submission / WHONET extract"], kind='green', tag="OUTSIDE ANY OE INSTANCE")
    f.arrow(right(*d1), left(*fhir), color=BLUE)
    f.arrow(right(*d2), (560, 300), color=BLUE)
    f.arrow(right(*fhir), left(*srv), color=NEW)
    caption(f, ["Complementary to — not a replacement for — the manual WHONET file path (Phase 6); a deployment may use either or both.",
                "Cross-lab aggregation stays outside any OE instance, so single-tenancy is preserved. Reuses FhirTransformService + the EQA submission pattern."])
    f.footer()
    f.save("09-phase-8-glass-fhir")

# ── Figure: Antibiogram ──────────────────────────────────────────
def f_antibiogram():
    f = Fig(W, 520)
    f.header("CROSS-CUTTING", "The Antibiogram — cumulative susceptibility report (M-13)")
    src = (60, 180, 380, 100)
    f.node(*src, ["AST results", "across completed Cases"], kind='blue')
    dd = (560, 180, 360, 100)
    f.node(*dd, ["First-isolate dedup", "shared with M-09"], kind='reuse')
    out = (1060, 180, 480, 100)
    f.node(*out, ["Cumulative %S per organism × drug", "CLSI M39 · read-only"], kind='green')
    f.arrow(right(*src), left(*dd), color=BLUE)
    f.arrow(right(*dd), left(*out), color=GREEN)
    caption(f, ["INTERNAL clinical artifact — guides this lab's empiric therapy before culture results are back.",
                "Distinct from WHONET/GLASS (external surveillance): same AST data, different consumer. Produces no new clinical data."])
    f.footer()
    f.save("10-antibiogram")

# ── Figure: Macro Library ────────────────────────────────────────
def f_macros():
    f = Fig(W, 520)
    f.header("CROSS-CUTTING", "The Macro Library — typing shortcuts for narrative fields", "Phase 1A+")
    typ = (60, 185, 300, 90)
    f.node(*typ, [".gpc", "tech types a code"], kind='blue')
    svc = (520, 185, 360, 90)
    f.node(*svc, ["MacroExpansionService", "category-filtered runtime"], kind='new')
    out = (1040, 185, 500, 90)
    f.node(*out, ["“Gram positive cocci in clusters”", "expanded inline"], kind='green')
    f.arrow(right(*typ), left(*svc), color=BLUE)
    f.arrow(right(*svc), left(*out), color=GREEN)
    f.text(60, 330, "Categories: clinical · gramStain · colony · culture · organisms · ast · reporting · timeline   ·   85 default macros",
           size=13, color=MUTED)
    caption(f, ["Not micro-specific — a cross-cutting OpenELIS feature (the LIS analog of EHR dot-phrases); micro is the first consumer.",
                "Small build, outsized UX impact — the first Phase 1A+ feature techs ask for within a week of MVP launch."])
    f.footer()
    f.save("11-macro-library")

if __name__ == "__main__":
    f_overview(); f_phase0(); f_phase1(); f_phase2(); f_phase3(); f_phase4()
    f_phase5(); f_phase6(); f_phase7(); f_phase8(); f_antibiogram(); f_macros()
    print("ALL DONE ->", OUT)
