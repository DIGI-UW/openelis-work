# Bruker MALDI Biotyper (MBT Compass IVD) — Analyzer Setup Guide
**OpenELIS Global | Analyzer Setup | PNG / CPHL Port Moresby**
Version: v1.0
Date: 2026-06-08
Confidence: MEDIUM-HIGH (instrument-side steps from BD/Bruker MBT Service Note 40; OpenELIS menu paths from the standard analyzer-management pattern, not yet verified on the live instrument)
Audience: Lab IT, Lab Manager, OpenELIS Administrator
Jira: OGC-323 · Companion to the *Bruker MALDI Biotyper sirius* integration spec (ASTM Communication Interface Spec v4.5, ORG + PRO records)

> The MALDI Biotyper is **identification-only** (organism + Bruker log score). It does not send AST — susceptibility comes from Phoenix/MGIT via BD EpiCenter (OGC-434). Set the MALDI up so its organism result lands on the isolate in the microbiology case, where it then drives AST panel selection.

---

## 1. Prerequisites

- OpenELIS Global with the AMR / Microbiology module deployed (organism master + isolate/case data model, OGC-782).
- **Decide the connection mode with the lab** — MBT Compass IVD supports either:
  - **ASTM socket** (real-time, bidirectional) — recommended; or
  - **CSV file exchange** (shared folder) — simpler, no live socket.
- Network path between the MBT Compass IVD workstation and the OpenELIS server (for ASTM: a TCP port on the OpenELIS side; for CSV: a shared folder both can reach).
- MBT Compass IVD admin credentials and access to the LIMS activation tools (below).
- OpenELIS role: Analyzer/Administrator.

---

## 2. Instrument-Side Configuration (MBT Compass IVD)

Per **MBT Service Note 40 (LIMS Integration), §5**. In MBT Compass IVD, OpenELIS (the LIMS) is the **server**; the MBT is the **client** that connects out.

### Option A — ASTM socket (recommended)

**Enable LIMS import (worklist: OpenELIS → MBT):**
1. Run the activation tool `MBT-Compass-IVD-Activate-LIMSImport.exe` (from the Bruker support FTP `…/Tools/LIMS integration/`).
2. In the ASTM import tool, enter the **OpenELIS server IP** (or PC name) and the **port** OpenELIS is listening on. *(There is no Bruker default port — use the port configured on the OpenELIS side; see §3 Step 2.)*

**Enable LIMS export (results: MBT → OpenELIS):**
3. Open the export web interface: `http://localhost:8280/mbt-admin/administration` (User: `Administrator`, Password: `smovxai6-IVD`) → **Export Configuration**.
4. Create/activate an **ASTM** export configuration:
   - Destination URI: `astm://<OpenELIS-IP>:<port>` (extension `none`).
   - Type: **Project**; Trigger: **After Project Result** (export once the run's identifications are final).
   - Transformation script: `project2lims.xsl` (set/confirm with Bruker so the emitted ORG + PRO records match what OpenELIS parses).

### Option B — CSV file exchange

1. Run `MBT-Compass-IVD-Activate-CSVImport.exe`.
2. **Import (worklist) folder:** default `MBT-IN`; delimiter `;`. The worklist OpenELIS writes needs at minimum **Position** and **ID** columns (optional: Name, SampleType, Description). Example row: `A1;BTS;Standard;Bts;…`.
3. **Export (results) folder:** in the web interface → Export Configuration, set a CSV config with `file:///<shared path>` destination and script parameter `outputType=CSV`. The MBT "Local System" user needs write permission to that folder.
4. Ensure both the MBT workstation and the OpenELIS server have access to the shared folders (IT may need to configure the share/permissions).

> **Sample types** the MBT recognises (set per spot): `Sample`, `Bloodculture`, `MycobacteriaSample`, `FilamentousFungiSample`, `NegativeIonModeSample`, and **`Bts`** (Bacterial Test Standard = calibrant/QC).

---

## 3. OpenELIS Configuration — Step by Step

Navigation: `Admin → Analyzer Management → Analyzers List`.

**Step 1: Add the Analyzer**
- Click **Add Analyzer**.
  - Name: `Bruker MALDI Biotyper sirius #1`
  - Plugin: **Generic ASTM** (Option A) or **Flat File** (Option B)
  - Profile: `Bruker MALDI Biotyper sirius — Microbiology ID v1.0`
  - Lab Unit: Bacteriology / AMR
  - Status: Setup

**Step 2: Configure Connection**
- *ASTM mode:* Connection Role: **Server** (OpenELIS listens). Set **Listen Port** to the port you gave the MBT in §2 (e.g., a free port in the lab's instrument range). Connection timeout 30 s; NAK retry 6. Click **Test Connection**.
- *CSV mode:* set the **poll folder** to the MBT export (results) folder, poll interval (e.g., 60 s), delimiter `;`, post-import action (archive/delete).

**Step 3: Assign Profile and Verify Field Mappings**
- Under **Field Mappings**, confirm the profile maps the v4.5 **ORG record → organism** result (CODED_LOOKUP into the Organism Master / WHONET vocabulary) and the **PRO record → log(score)** result.
- Confirm the score classification thresholds: **≥ 2.00 = secure species ID**, **1.70–1.99 = genus / low confidence**, **< 1.70 = no reliable ID**.
- Map any organism names that don't auto-match to the Organism Master.

**Step 4: Configure QC Rules**
- Under **QC Config**, add: **SampleType = `Bts`** (Bacterial Test Standard) → QC. Add the lab's accession conventions (`QC-`, `CTRL-`, regex `^(QC|CTRL|BTS|ATCC).*`). Rule logic: OR.

**Step 5: Run Communication Test**
- *ASTM:* use the **Message Simulator** to paste a sample MALDI ASTM message (H/P/O + ORG + PRO + L). Verify the parsing log shows instrument ID, isolate/target ID, QC classification (BTS = QC), organism resolved to the master, and the score classified.
- *CSV:* drop a sample results file in the poll folder and confirm the same.

---

## 4. Verifying a Live Result

1. Run an isolate (or the BTS calibrant) on the MALDI.
2. In `Analyzer Management → Bruker MALDI Biotyper sirius → Preview`, confirm the latest message appears.
3. Verify: instrument name, target/isolate ID resolves to the right microbiology case/isolate, BTS shows as **QC** (not patient), organism mapped, score + confidence tier shown.
4. Accept → the organism attaches to the isolate and becomes available to select the AST panel (Phoenix/MGIT via EpiCenter).

---

## 5. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| No ASTM connection | Wrong port, or MBT not pointed at the OpenELIS IP | Re-check the LIMS server IP/port in the MBT ASTM import tool; confirm OpenELIS listen port (§3 Step 2) |
| Export not arriving | Export config not activated, or wrong trigger | In web interface (`:8280`), confirm ASTM/CSV export config is **active** and trigger = After Project Result |
| Organism unmapped | Name/taxonomy code not in Organism Master | Add the mapping; confirm whether the transform emits plain species name vs Bruker taxonomy code |
| Fields don't match the parser | `project2lims.xsl` transform differs from the profile | Reconcile the deployed transform with the v4.5 ORG/PRO layout; update the profile |
| BTS treated as a patient | QC rule missing | Add SampleType=`Bts` QC rule (§3 Step 4) |
| CSV not imported | Folder share/permissions, or wrong delimiter/suffix | Verify share access for "Local System"; delimiter `;`; matching file suffix |
| Score parses wrong | Decimal separator / encoding | Confirm score decimal separator and file encoding |

---

## 6. Notes for the implementer
- Source-of-truth field layout is the **MALDI Biotyper ASTM Communication Interface Specification v4.5** (ORG + PRO records) referenced on the Analyzer Integration Tracker — pull it (and/or the deployed `project2lims.xsl`) before wiring the profile.
- Confirm with CPHL whether they run **ASTM socket or CSV**; the steps above cover both.
- Promote this guide to **VALIDATED** after the first live capture at CPHL.

## Versioning
| Version | Date | Changes |
|---|---|---|
| v1.0 | 2026-06-08 | Initial companion guide — instrument-side from MBT SN40; OpenELIS steps from standard analyzer-management pattern |
