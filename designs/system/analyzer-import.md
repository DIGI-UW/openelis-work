# Analyzer Results Import Page Redesign - Requirements Specification

## Overview

Redesign of the Analyzer Results Import page with **critical focus on QC verification before patient result acceptance**. The page extracts control samples from the run, evaluates pass/fail status, and blocks patient result release when QC fails.

## Current Pain Points

| Issue | Description |
|-------|-------------|
| **No QC Extraction** | Control samples mixed with patient samples, not evaluated first |
| **No QC Gating** | Failed QC doesn't block patient result acceptance |
| **No Non-Conformity Handling** | No automatic flagging when QC fails |
| **No QA/QC Visibility** | Control results not shown during review |
| **No Interpretation Suggestions** | Techs can't see suggested interpretations |
| **No Delta Checks** | Previous results and significant changes not visible |

---

## Design Goals

1. **QC Extraction** - Identify and extract control samples from the run, display prominently at top
2. **QC-First Workflow** - Evaluate QC BEFORE allowing patient result acceptance
3. **Non-Conformity Handling** - Block saving when QC fails, mark results non-conforming
4. **QA/QC Sidebar** - Show QC history, reagent status, analyzer info
5. **Interpretation Suggestions** - Display suggested interpretation based on result value
6. **Delta Check Visibility** - Highlight significant changes from previous results

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Header: Home / [Analyzer Name]                              [Refresh] [Settings]    │
├───────────────────────────────────────────────────────────────┬─────────────────────┤
│                                                               │                     │
│  ┌═══════════════════════════════════════════════════════════┐│  QA/QC Sidebar     │
│  ║ QC RESULTS FROM THIS RUN                              [▼] ║│                     │
│  ║ ✓ All 3 controls passed - Patient results can be accepted║│  Current Run QC    │
│  ║                                                           ║│  [L1][L2][L3]      │
│  ║ [Level 1: ✓] [Level 2: ✓] [Level 3: ✓]                   ║│                     │
│  ╚═══════════════════════════════════════════════════════════╝│  Analyzer Info     │
│                                                               │                     │
│  ┌─ Non-Conformity Alert (if QC failed) ─────────────────────┐│  Recent QC History │
│  │ ⛔ QC failure - Results marked non-conforming             ││  [✓][✓][✓][✓][✓]   │
│  └───────────────────────────────────────────────────────────┘│                     │
│                                                               │  Reagent Status    │
│  ┌─ Search & Summary ────────────────────────────────────────┐│                     │
│  │ [Filter]    Total | Pending | Flagged | Critical | NC     ││                     │
│  └───────────────────────────────────────────────────────────┘│                     │
│                                                               │                     │
│  ┌─ Bulk Actions (disabled if QC failed) ────────────────────┐│                     │
│  │ [Save] [Retest] [Ignore]              [Save All Results]  ││                     │
│  └───────────────────────────────────────────────────────────┘│                     │
│                                                               │                     │
│  ┌─ Patient Results ─────────────────────────────────────────┐│                     │
│  │ Sample | Test | Result | QC | Flags | Interp. | Actions   ││                     │
│  │ (Non-conforming rows highlighted red, Save disabled)      ││                     │
│  └───────────────────────────────────────────────────────────┘│                     │
└───────────────────────────────────────────────────────────────┴─────────────────────┘
```

---

## Run Settings Panel

A consolidated settings panel for applying analyzer and reagent selections to all results in the import batch.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ⚙ Run Settings                    Applied to all 45 results in this run        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ANALYZER                         REAGENTS / CARTRIDGES USED THIS RUN  [Change] │
│ ┌─────────────────────┐          ┌──────────────────┐ ┌──────────────────┐     │
│ │ 🖥 Sysmex XN-L      │          │ 🧪 Cellpack DCL  │ │ 🧪 Lysercell WNR │     │
│ │ ● Online • QC Pass  │          │ LOT-2024-0892    │ │ LOT-2024-5678    │     │
│ └─────────────────────┘          │ Exp: 12/20 [FIFO]│ │ Exp: 12/25 [FIFO]│     │
│ ✓ Auto-assigned to all           └──────────────────┘ └──────────────────┘     │
│                                                                                 │
│                        ⚡ FIFO lots pre-selected. Applied to all saved results. │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Analyzer Display (Read-Only)

| Field | Description |
|-------|-------------|
| **Name** | Analyzer name from import source |
| **Status** | Online/Offline indicator |
| **QC Status** | Pass/Fail from most recent QC |

The analyzer is automatically determined from the import source and cannot be changed. It will be attached to all results when saved.

### Reagent/Cartridge Selection

| Feature | Behavior |
|---------|----------|
| **Source** | Reagents linked to analyzer in Test Catalog |
| **Default Selection** | FIFO lots pre-selected (oldest unexpired) |
| **Display** | Chips showing reagent name, lot number, expiration |
| **FIFO Badge** | Shows on lots selected via FIFO logic |
| **Expiring Warning** | Amber text for lots expiring within 7 days |

### "Change Lots" Modal

When clicking "Change Lots":

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Select Reagent Lots for This Run                                          [X]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ CELLPACK DCL                                                                    │
│ ○ LOT-2024-0892  Rcvd: 10/15/2024  Exp: 12/20/2024  [FIFO] ⚠ Expiring soon    │
│ ○ LOT-2024-1156  Rcvd: 11/01/2024  Exp: 03/15/2025                             │
│ ○ LOT-2024-1298  Rcvd: 11/20/2024  Exp: 05/30/2025                             │
│                                                                                 │
│ LYSERCELL WNR                                                                   │
│ ○ LOT-2024-5678  Rcvd: 10/20/2024  Exp: 12/25/2024  [FIFO] ⚠ Expiring soon    │
│ ○ LOT-2024-6012  Rcvd: 11/15/2024  Exp: 04/10/2025                             │
│                                                                                 │
│ FLUOROCELL WDF                                                                  │
│ ○ LOT-2024-9012  Rcvd: 11/01/2024  Exp: 02/28/2025  [FIFO]                     │
│                                                                                 │
│ ℹ Select the lots actually used for this analyzer run.                         │
│                                                                                 │
│                                              [Cancel]  [Apply to All Results]   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Application Behavior

| When | What Happens |
|------|--------------|
| **On Import Load** | Analyzer auto-assigned, FIFO reagent lots pre-selected |
| **On "Accept" (single)** | Result saved with run's analyzer + reagent selections |
| **On "Accept All"** | All results saved with run's analyzer + reagent selections |
| **On "Change Lots"** | New selections apply to all subsequent saves |

### Data Attached to Each Result

When a result is accepted/saved, the following is recorded:

```json
{
  "result_id": "12345",
  "analyzer_id": "sysmex-xn-l-001",
  "analyzer_name": "Sysmex XN-L",
  "reagent_lots": [
    { "reagent": "Cellpack DCL", "lot": "LOT-2024-0892" },
    { "reagent": "Lysercell WNR", "lot": "LOT-2024-5678" },
    { "reagent": "Fluorocell WDF", "lot": "LOT-2024-9012" }
  ],
  "run_timestamp": "2024-12-18T09:45:22Z"
}
```

---

## QC Results Section (CRITICAL - Top of Page)

### Purpose
Extract control samples from the imported run, display prominently, and evaluate pass/fail BEFORE allowing patient results to be accepted.

### QC Sample Identification

Control samples are identified by:
- Sample ID patterns (e.g., `QC-LOW-001`, `CTRL-L1`, `NEG-CTRL`)
- Patient ID reserved for controls (e.g., `QC-PATIENT`)
- Sample type flagged as control material
- Known control lot numbers from inventory

### QC Panel Header

| QC Status | Header Style | Message |
|-----------|--------------|---------|
| **All Pass** | Green border/background | "All X controls passed - Patient results can be accepted" |
| **Any Fail** | Red border/background | "QC FAILURE - Patient results marked as non-conforming" |
| **No QC** | Yellow border/background | "No QC samples detected in this run - Manual verification required" |

### QC Control Cards

For each control sample extracted from the run:

```
┌─────────────────────────────────────┐
│ ✓ PASS                   🕐 09:40:12│
│ Low Control                         │
│ QC-LOW-001                          │
│─────────────────────────────────────│
│ Result      │ Expected              │
│ 3.8         │ 3.5 - 4.2             │
│ x10^9/L     │                       │
└─────────────────────────────────────┘
```

### QC Card Fields

| Field | Description |
|-------|-------------|
| **Status Badge** | PASS (green) or FAIL (red) |
| **Run Time** | Time the control was analyzed |
| **Control Type** | Low Control, Normal Control, High Control, Positive, Negative |
| **Sample ID** | Control sample identifier |
| **Result** | Measured value with unit |
| **Expected Range** | Acceptable range |
| **Failure Reason** | (If failed) Why it failed |

### QC Panel Actions

| Action | Description |
|--------|-------------|
| **View Levey-Jennings Chart** | Navigate to LJ chart for trend analysis |
| **Create Non-Conformity Report** | (If failed) Create NC record |
| **Expand/Collapse** | Toggle detailed view |

### QC Failure Display

When a control fails:

```
┌─────────────────────────────────────┐
│ ✗ FAIL                   🕐 10:15:22│
│ Low Control                         │
│ QC-LOW-002                          │
│─────────────────────────────────────│
│ Result: 58 mg/dL                    │
│ Expected: 65 - 75 mg/dL             │
│─────────────────────────────────────│
│ ⚠ Failure: Result below acceptable │
│   range                             │
└─────────────────────────────────────┘
```

---

## Non-Conformity Alert Banner

Displayed when QC fails:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ⛔ Non-Conformity Alert                                        [View Non-Conformity]│
│                                                                                     │
│ QC failure detected in this run. All 6 patient results have been marked as         │
│ non-conforming and cannot be released until the non-conformity is resolved.        │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Non-Conformity Behavior

| Element | Behavior When QC Fails |
|---------|------------------------|
| **Import Button** | Disabled (grayed out) |
| **Retest** | Enabled - can mark for retest |
| **Ignore** | Enabled - can ignore results |
| **Patient Rows** | Red background, NC icon |
| **Result Status** | Cannot be released |

---

## Patient Results Table

### Table Header

| Column | Width | Description |
|--------|-------|-------------|
| **Select** | 60px | Checkbox for bulk actions |
| **Sample Info** | 200px | Lab number, patient name, NC icon if applicable |
| **Test Name** | 160px | Test name |
| **Result** | 120px | Value + unit (colored if abnormal) |
| **Range** | 120px | Normal range |
| **QC** | 80px | QC status badge (✓ or ✗) |
| **Flags** | 80px | Visual flag indicators |

### QC Status Column

| Status | Badge | Meaning |
|--------|-------|---------|
| **Pass** | `QC ✓` green | QC passed, can import |
| **Fail** | `QC ✗` red | QC failed, non-conforming |
| **N/A** | `QC —` gray | No QC data |

### Row States

| State | Visual Treatment |
|-------|------------------|
| **Normal** | Default white background |
| **Non-Conforming** | Red background, ⚠ icon |
| **Critical** | Orange background (if QC passed) |
| **Flagged** | Default background, flag icons displayed |

### Non-Conforming Row

```
│ ☐ │ ⚠ TESTA240000000004  │ WBC │ 6.16 │ 4.5-11.0 │ QC ✗ │ — │
│   │    Test, Patient     │     │      │          │      │   │
```

---

## QA/QC Sidebar

### Current Run QC Status (Prominent)

```
┌─────────────────────────────────────┐
│ Current Run: QC Passed              │
│ Run ID: RUN-2024-1218-001           │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │ L1  │ │ L2  │ │ L3  │            │
│ │ 3.8 │ │ 7.2 │ │18.5 │            │
│ │  ✓  │ │  ✓  │ │  ✓  │            │
│ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────┘
```

### Recent QC History

| Date/Time | Run ID | Status |
|-----------|--------|--------|
| 12/18 09:41 | RUN-1218-001 | ✓ PASS |
| 12/18 06:21 | RUN-1218-AM | ✓ PASS |
| 12/17 14:30 | RUN-1217-002 | ✓ PASS |
| 12/17 06:15 | RUN-1217-AM | ✓ PASS |

Link: "View Full QC History →"

### Analyzer Info

| Field | Value |
|-------|-------|
| Name | Sysmex XN-L |
| Status | Online |
| Last Calibration | 12/18/2025 06:00 |

### Reagent Status

For each reagent:
- Name, Lot number
- Expiration date
- Status: OK, EXPIRING (within 7 days), EXPIRED

---

## Bulk Actions Bar

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ☐ Select all   3 selected   [Select Normal Only]                               │
│                                                                                 │
│                                          [Import]  [Retest]  [Ignore]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Selection Actions

| Action | Description |
|--------|-------------|
| **Select all** | Checkbox to select/deselect all visible results |
| **Select Normal Only** | Link to select only results with no flags |

### Button Actions

| Button | When QC Passes | When QC Fails | Description |
|--------|----------------|---------------|-------------|
| **Import** | Enabled (teal) | Disabled (gray) | Import selected results into system |
| **Retest** | Enabled (amber) | Enabled (amber) | Mark selected for retesting |
| **Ignore** | Enabled (gray) | Enabled (gray) | Ignore selected results |

### Action Behavior

- Actions apply to **selected rows only**
- If no rows selected, show tooltip: "Select results first"
- Import attaches Run Settings (analyzer + reagent lots) to all imported results

---

## Data Models

### QCSample

```typescript
interface QCSample {
  id: string;
  sampleId: string;           // "QC-LOW-001"
  controlType: string;        // "Low Control", "Positive", "Negative"
  controlLevel: string;       // "Level 1", "Level 2", "Level 3"
  testName: string;
  testId: string;
  result: string;
  expectedRange: string;
  unit: string;
  status: 'pass' | 'fail';
  failureReason?: string;
  runTime: string;
  runDate: string;
  lotNumber?: string;
}
```

### RunQCStatus

```typescript
interface RunQCStatus {
  runId: string;
  runDate: string;
  runTime: string;
  analyzerId: string;
  analyzerName: string;
  overallStatus: 'pass' | 'fail' | 'none';
  qcSamples: QCSample[];
  patientSampleCount: number;
  nonConformityId?: string;
}
```

### ImportedResult (Updated)

```typescript
interface ImportedResult {
  id: string;
  labNumber: string;
  patient?: { name: string; id: string; };
  testName: string;
  testId: string;
  result: string;
  unit: string;
  normalRange: string;
  testDate: string;
  importTime: string;
  status: 'pending' | 'saved' | 'retest' | 'ignored';
  flags: Flag[];
  interpretation?: { suggested: Interpretation; };
  deltaCheck?: DeltaCheck;
  previousResult?: PreviousResult;
  
  // QC Fields
  qcStatus: 'pass' | 'fail' | 'none';
  nonConforming: boolean;
  nonConformityId?: string;
  notes?: string;
  
  // Analyzer & Reagent (from Run Settings)
  analyzerId?: string;
  analyzerName?: string;
  reagentLots?: ReagentLot[];
}

interface ReagentLot {
  reagentId: string;
  reagentName: string;
  lotNumber: string;
  expirationDate: string;
  receivedDate: string;
}
```

### RunSettings

```typescript
interface RunSettings {
  runId: string;
  analyzerId: string;
  analyzerName: string;
  analyzerStatus: 'online' | 'offline';
  analyzerQcStatus: 'pass' | 'fail' | 'pending';
  reagentLots: ReagentLot[];
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analyzers/{id}/runs/{runId}` | Get run with QC and patient results |
| GET | `/api/analyzers/{id}/runs/{runId}/qc` | Get QC samples from run |
| POST | `/api/analyzers/{id}/runs/{runId}/qc/evaluate` | Evaluate QC pass/fail |
| GET | `/api/analyzers/{id}/qc-history` | Get recent QC history |
| GET | `/api/analyzers/{id}/reagents` | Get reagents linked to analyzer |
| GET | `/api/reagents/{id}/lots` | Get available lots for a reagent (FIFO sorted) |
| PUT | `/api/analyzers/{id}/runs/{runId}/settings` | Update run settings (reagent lots) |
| POST | `/api/non-conformities` | Create non-conformity record |
| PUT | `/api/results/{id}` | Update result (blocked if NC) |
| POST | `/api/results/bulk` | Bulk update results (includes analyzer + reagent lots) |

---

## Acceptance Criteria

### QC Extraction
- [ ] Control samples identified and extracted from import batch
- [ ] QC samples displayed in dedicated section at top of page
- [ ] Each control shows: type, level, result, expected range, pass/fail, time
- [ ] Overall QC status clearly displayed
- [ ] QC panel collapsible

### QC-First Workflow
- [ ] QC evaluated before patient results can be actioned
- [ ] Save buttons disabled when QC fails
- [ ] Clear messaging about why actions blocked
- [ ] Retest remains available

### Non-Conformity Handling
- [ ] NC alert banner when QC fails
- [ ] All patient results marked non-conforming
- [ ] NC results have red background
- [ ] NC icon displayed
- [ ] Link to create/view NC report
- [ ] Results cannot be released until NC resolved

### QC Sidebar
- [ ] Current run QC status prominent
- [ ] Mini visualization of control values
- [ ] Recent QC history (last 5 runs)
- [ ] Link to full history
- [ ] Analyzer info
- [ ] Reagent status with expiration warnings

### Run Settings Panel
- [ ] Displays analyzer name auto-assigned from import source
- [ ] Shows analyzer online/offline status
- [ ] Shows analyzer QC pass/fail status
- [ ] Displays reagent/cartridge lots as selectable chips
- [ ] FIFO lots pre-selected by default (oldest unexpired)
- [ ] Expiring lots (within 7 days) show amber warning
- [ ] "Change Lots" button opens selection modal
- [ ] Modal shows all available lots per reagent with FIFO indicator
- [ ] Expired lots shown but not selectable
- [ ] Selected lots applied to ALL results when imported
- [ ] Analyzer ID attached to ALL results when imported
- [ ] Info message explains FIFO logic and application scope

### Bulk Actions
- [ ] Select all checkbox selects/deselects all visible results
- [ ] "Select Normal Only" link selects results with no flags
- [ ] Selected count displayed
- [ ] Import button enabled when QC passes, disabled when QC fails
- [ ] Retest button always enabled
- [ ] Ignore button always enabled
- [ ] Actions apply to selected rows only

### Patient Results Table
- [ ] Checkbox column for selection
- [ ] Sample info column shows lab number, patient name, NC icon
- [ ] Test name column
- [ ] Result column with value and unit (colored if abnormal)
- [ ] Range column shows normal range
- [ ] QC status column shows pass/fail badge
- [ ] Flags column shows flag icons
- [ ] NC rows highlighted with red background

---

## Workflow Scenarios

### Scenario 1: All QC Passes
1. Run imported from analyzer
2. System extracts 3 QC samples → ALL PASS
3. Green QC panel: "All controls passed"
4. Patient results can be imported normally
5. Each result shows "QC ✓"
6. User selects results (or Select Normal Only)
7. Click Import → results saved with analyzer + reagent lots

### Scenario 2: QC Fails
1. Run imported from analyzer
2. System extracts QC samples → Level 1 FAIL
3. Red QC panel with failure details
4. NC alert banner displayed
5. All patient results marked non-conforming
6. Import button disabled
7. Tech options: Retest, Ignore, Create NC Report

### Scenario 3: No QC in Run
1. Run imported from analyzer
2. No control samples detected
3. Yellow warning: "No QC in this run"
4. System checks last known QC status
5. If recent QC passed → Allow import with warning
6. If no recent QC → Require manual verification
