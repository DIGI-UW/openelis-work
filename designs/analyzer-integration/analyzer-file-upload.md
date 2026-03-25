# Analyzer File Upload — Functional Requirements Specification

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 3.0 |
| **Status** | Draft |
| **Module** | Analyzer Results Import — File Upload |
| **Jira** | OGC-324 |
| **Epic** | OGC-304 (Madagascar Analyzer Work) |
| **Location** | Results → Upload Analyzer File (sub-menu item) |
| **Date** | 2026-02-24 |

---

## 1. Overview

A standalone screen for manual analyzer file upload, accessible as a sub-menu item under Results. This screen allows laboratory technicians to select a file-based analyzer, upload an export file, preview and validate the parsed results, and submit them to the Analyzer Import review queue.

**Key architectural change in v3.0:** The preview area after file parsing uses a **slot-based plugin system**. Each analyzer plugin can optionally register a custom React preview component. When a plugin provides one, the preview slot renders that custom component instead of the default generic table. This enables domain-specific previews — such as the TB-Profiler plugin showing MDR classification, drug resistance tables with mutation detail, and sequencing QC gauges — while keeping the upload workflow consistent across all analyzers.

---

## 2. Context

### 2.1 What Already Exists

- **ASTM TCP/IP connections** — Background service for real-time instrument connections (Pattern A).
- **HL7 MLLP Listener** — Background service for HL7 v2.3.1 connections (Pattern D). See OGC-325.
- **File-watching services** — Background process monitors configured directories for new files and auto-parses them. Each file-import analyzer has a subdirectory under a global base path. See Flat File Import Analyzer Configuration FRS (OGC-329).
- **Analyzer Import page** — Existing page under Results → Analyzer Results for reviewing parsed results, QC evaluation, and acceptance.
- **Analyzer Management page** — Admin → Analyzers for configuring analyzers with protocol types (ASTM, HL7, File Import).

### 2.2 What This Feature Adds

A new **sub-menu item** under Results called "Upload Analyzer File" that provides:

1. An analyzer selector dropdown (file-based analyzers shown by default).
2. A file upload zone supporting drag-and-drop and file browser.
3. A **preview slot** that renders either a plugin-provided custom preview component or the default generic table preview.
4. A "Submit to Import Queue" action that pushes validated results to the Analyzer Results review page.

### 2.3 Plugin Preview Slot Architecture

The preview slot is a **render point** in the Upload Analyzer File page where parsed result data is displayed to the user before submission. The slot system works as follows:

1. **Backend parses the uploaded file** and returns a structured response containing both the standard `AnalyzerRunPreview` object (used by the generic preview and the submit endpoint) and an optional `customPreviewData` payload containing plugin-specific data.
2. **Frontend checks** whether the selected analyzer's plugin has registered a custom preview component.
3. **If a custom component exists**, the slot renders it, passing the full parsed response as props. The custom component is responsible for displaying domain-specific data (e.g., TB-Profiler's drug resistance table, QC gauges, lineage info).
4. **If no custom component exists**, the slot renders the **default generic table preview** showing rows of parsed results with validation status indicators.
5. **Both paths share** the same action bar (Submit to Import Queue / Cancel) and the same validation summary counters.

```
┌──────────────────────────────────────────────────────────┐
│ Upload Analyzer File                                      │
├──────────────────────────────────────────────────────────┤
│ [Analyzer Selector Dropdown]                              │
│ [File Upload Zone - drag/drop or browse]                  │
│                                                           │
│ ┌── Validation Summary ──────────────────────────────┐   │
│ │ Total: 1  │  Patient: 1  │  QC: 0  │  Warnings: 0 │   │
│ └────────────────────────────────────────────────────┘   │
│                                                           │
│ ┌── Preview Slot ────────────────────────────────────┐   │
│ │                                                     │   │
│ │  Plugin provides custom component?                  │   │
│ │    YES → Render <TBProfilerPreview data={...} />    │   │
│ │    NO  → Render <DefaultTablePreview rows={...} />  │   │
│ │                                                     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│                          [Cancel]  [Submit to Import Queue]│
└──────────────────────────────────────────────────────────┘
```

### 2.4 Plugin Component Contract

Each analyzer plugin can optionally export a `PreviewComponent` alongside its parser. The component receives:

```typescript
interface PreviewSlotProps {
  /** Standard parsed results (same structure regardless of plugin) */
  preview: AnalyzerRunPreview;
  /** Plugin-specific data returned by the parser (opaque to the framework) */
  customData: Record<string, unknown> | null;
  /** Callback to update the validation summary from the custom component */
  onValidationUpdate: (summary: ValidationSummary) => void;
  /** Selected analyzer metadata */
  analyzer: AnalyzerInfo;
  /** Uploaded file metadata */
  file: { name: string; size: number; type: string };
}
```

The `AnalyzerRunPreview` structure is the standard format that all parsers must produce:

```typescript
interface AnalyzerRunPreview {
  rows: ParsedResultRow[];
  validationSummary: ValidationSummary;
  metadata?: Record<string, string>;
}

interface ParsedResultRow {
  rowIndex: number;
  accessionNumber: string;
  testCode: string;
  testName: string;
  resultValue: string;
  resultUnit?: string;
  status: "valid" | "warning" | "error" | "qc";
  messages: ValidationMessage[];
}

interface ValidationSummary {
  total: number;
  patient: number;
  qc: number;
  valid: number;
  warnings: number;
  errors: number;
}
```

Plugins that provide custom preview components can include additional data in the `customData` field. For example, the TB-Profiler plugin returns:

```typescript
// TB-Profiler customData example
{
  classification: "MDR-TB",
  lineage: { main: "lineage2", sub: "lineage2.2.1", family: "Beijing" },
  species: "Mycobacterium tuberculosis",
  qcMetrics: {
    num_reads: 312456,
    pct_mapped: 95.4,
    median_depth: 87,
    cov30x: 96.2,
    mean_len: 4523,
    n50: 6234
  },
  drugResistance: [
    {
      drug: "Rifampicin",
      code: "RIF",
      status: "R",
      group: "First-Line",
      mutations: [
        { gene: "rpoB", change: "S450L", frequency: 98, depth: 112, whoGrading: "Assoc w R" }
      ]
    },
    // ... additional drugs
  ],
  qcThresholds: [
    { key: "pct_mapped", label: "Reads Mapped", unit: "%", pass: 90, warn: 80 },
    { key: "median_depth", label: "Median Depth", unit: "x", pass: 30, warn: 15 },
    { key: "cov30x", label: "Coverage at 30x", unit: "%", pass: 90, warn: 80 },
    { key: "num_reads", label: "Total Reads", unit: "", pass: 50000, warn: 25000 }
  ],
  perTargetDepth: [
    { gene: "rpoB", depth: 112, coverage: 100 },
    // ... additional targets
  ],
  pipelineMetadata: {
    software: "TB-Profiler",
    version: "6.3.0",
    dbVersion: "WHO-UCN-GTB-PCI-2023.5",
    analysisDate: "2025-02-19"
  },
  sequencingMetadata: {
    platform: "MinION",
    instrument: "MN42781",
    flowcell: "FLO-MIN114",
    kit: "SQK-RBK114.96",
    basecaller: "Dorado 0.5.3"
  }
}
```

### 2.5 Out of Scope

- ASTM TCP/IP connection management (existing background service).
- HL7 MLLP connection management (OGC-325).
- File-watching directory configuration (Admin → Analyzers, OGC-329).
- Parser plugin installation and management (backend-only deployment).
- QC evaluation, non-conformity handling, and result acceptance workflow (Analyzer Results page per parent FRS).
- Error Dashboard (separate story).
- **TB-Profiler custom preview component implementation** — the slot framework and `PreviewSlotProps` contract are defined here, but the actual `TBProfilerPreview` React component is tracked as a separate Jira story.
- Custom preview components for instruments other than TB-Profiler (queued for future).

### 2.6 Review Slot — Custom Preview on the Analyzer Results Page

The same slot system that powers the Upload preview also powers the **Analyzer Results review page**. When a pipeline analyzer's results arrive via the backend file watcher (not manual upload), the tech navigates to Results → Analyzer Results and selects the run. If the run's analyzer has a custom preview component registered, the review page renders it **instead of** the standard results table.

**Key difference from the upload slot:** The review slot operates in **review mode** rather than upload-preview mode. In review mode:

1. The `customData` is loaded from the database (persisted at parse time) rather than from a real-time parse response.
2. The component receives additional props for the review workflow: result acceptance callbacks, QC gating status, and non-conformity flags.
3. The action bar shows Accept / Retest / Ignore actions instead of Submit to Import Queue.

**Data flow for backend-imported results:**

```
File watcher detects new file in /pipeline/tbprofiler/incoming/
    → Backend parser plugin runs
    → Standard AnalyzerRun + ParsedResultRows created
    → customData JSON persisted to analyzer_run.custom_preview_data
    → Results appear on Analyzer Results page as "Pending"
    
Tech opens Analyzer Results → selects TB-Profiler run
    → Frontend fetches run detail including custom_preview_data
    → Frontend checks previewRegistry for custom review component
    → YES: Renders <TBProfilerPreview mode="review" ... />
    → NO: Renders standard results table (existing behavior)
```

**Unified component, two modes:** The custom preview component receives a `mode` prop that controls its behavior:

| Mode | Context | Source of customData | Action Bar | Additional Props |
|------|---------|---------------------|------------|-----------------|
| `upload` | Upload Analyzer File page | Real-time parse response | Submit to Import Queue / Cancel | `onValidationUpdate` |
| `review` | Analyzer Results page | Loaded from `analyzer_run.custom_preview_data` | Accept All / Retest / Ignore | `onAccept`, `onRetest`, `onIgnore`, `qcGatingStatus`, `nonConformityFlags` |

### 2.7 Updated Component Contract

The `PreviewSlotProps` interface is extended to support both modes:

```typescript
type PreviewMode = 'upload' | 'review';

interface PreviewSlotProps {
  /** Which context the component is rendering in */
  mode: PreviewMode;
  /** Standard parsed results */
  preview: AnalyzerRunPreview;
  /** Plugin-specific data (from parse response or from DB) */
  customData: Record<string, unknown> | null;
  /** Selected analyzer metadata */
  analyzer: AnalyzerInfo;
  /** Uploaded file metadata (upload mode only) */
  file?: { name: string; size: number; type: string };

  // ── Upload mode callbacks ──
  /** Update validation summary counters (upload mode) */
  onValidationUpdate?: (summary: ValidationSummary) => void;

  // ── Review mode callbacks ──
  /** Accept all results in the run (review mode) */
  onAcceptAll?: () => void;
  /** Retest selected results (review mode) */
  onRetest?: (resultIds: string[]) => void;
  /** Ignore selected results (review mode) */
  onIgnore?: (resultIds: string[]) => void;
  /** QC gating status — if QC failed, accept is blocked (review mode) */
  qcGatingStatus?: {
    passed: boolean;
    failedControls: string[];
    nonConformityId?: string;
  };
  /** Run-level metadata (review mode) */
  run?: {
    id: string;
    receivedAt: string;
    source: 'upload' | 'file_watcher' | 'astm' | 'hl7';
    status: 'pending' | 'partial' | 'accepted' | 'rejected';
  };
}
```

The custom component uses the `mode` prop to conditionally render:
- **Upload mode:** Classification + QC + Drug Resistance + Metadata + validation summary. No accept/retest actions.
- **Review mode:** Same visualization sections, plus a results action strip for each result row (accept / retest / ignore checkboxes), and a QC gating banner if QC failed.

---

## 3. Navigation

New sub-menu item under Results:

| Menu Item | Route | Description |
|-----------|-------|-------------|
| Analyzer Results | `/results/analyzer` | Existing review page |
| **Upload Analyzer File** | `/results/upload-analyzer-file` | This feature |

**Localization keys:**

| Key | Default (English) |
|-----|-------------------|
| `label.menu.results` | Results |
| `label.menu.results.analyzerResults` | Analyzer Results |
| `label.menu.results.uploadAnalyzerFile` | Upload Analyzer File |

---

## 4. UI Specification

### 4.1 Page Header

| Element | Description |
|---------|-------------|
| Breadcrumb | Results / Upload Analyzer File |
| Page title | `label.page.uploadAnalyzerFile` → "Upload Analyzer File" |

### 4.2 Analyzer Selector

A filterable dropdown showing configured analyzers.

| Element | Description | Localization Key |
|---------|-------------|-----------------|
| Label | "Select Analyzer" | `label.upload.selectAnalyzer` |
| Default filter | File-based analyzers only (protocol = `FILE_IMPORT` or `PIPELINE_IMPORT`) | — |
| Toggle | "Show all analyzers" | `label.upload.showAllAnalyzers` |
| Info card | Shown below dropdown on selection: analyzer name, protocol badge, accepted file types, plugin name + version | — |

**Protocol badges:**

| Badge Text | Color | Localization Key |
|------------|-------|-----------------|
| File Import | Teal (`#005d5d` on `#d9fbfb`) | `label.protocol.fileImport` |
| Pipeline Import | Purple (`#491d8b` on `#e8daff`) | `label.protocol.pipelineImport` |
| ASTM | Gray (`#393939` on `#e0e0e0`) | `label.protocol.astm` |
| HL7 | Blue (`#0043ce` on `#edf5ff`) | `label.protocol.hl7` |

### 4.3 File Upload Zone

| Element | Description | Localization Key |
|---------|-------------|-----------------|
| Drop zone | Drag-and-drop area with file browser fallback | — |
| Prompt text | "Drag and drop a file here, or click to browse" | `label.upload.dropPrompt` |
| Accepted types | Dynamic based on selected analyzer plugin | — |
| Max file size | 50 MB (configurable) | — |
| State: disabled | Gray, no interaction until analyzer selected | — |
| State: active | Blue dashed border | — |
| State: file loaded | Green background bar showing filename, size, "Parsed successfully" | — |
| State: parse error | Red background bar showing filename, error message | — |

### 4.4 Validation Summary Bar

Displayed after successful parse. Shows counters in a horizontal bar.

| Counter | Color | Localization Key |
|---------|-------|-----------------|
| Total results | Gray | `label.upload.summary.total` |
| Patient results | Default | `label.upload.summary.patient` |
| QC samples | Teal | `label.upload.summary.qc` |
| Warnings | Amber | `label.upload.summary.warnings` |
| Errors | Red | `label.upload.summary.errors` |

### 4.5 Preview Slot

The preview slot is the central content area after file parsing. It renders one of two components:

#### 4.5.1 Default Generic Table Preview

Used when the analyzer plugin does NOT register a custom preview component.

| Column | Description | Localization Key |
|--------|-------------|-----------------|
| Row | Row index from file | `label.upload.table.row` |
| Lab Number | Accession / sample ID | `label.upload.table.labNumber` |
| Test | Test name (mapped from analyzer code) | `label.upload.table.test` |
| Result | Result value + unit | `label.upload.table.result` |
| Status | Validation status icon (checkmark / warning / error / QC badge) | `label.upload.table.status` |

**Row styling:**

| Status | Background | Icon | Detail |
|--------|-----------|------|--------|
| Valid | White | Green checkmark | — |
| Warning | `#fcf4d6` (amber tint) | Amber triangle | Expandable row shows warning messages |
| Error | `#fff1f1` (red tint) | Red X | Expandable row shows error messages |
| QC | White | Teal "QC" badge | — |

**Inline editable fields:** When a Lab Number is not found in OpenELIS (ACCESSION_NOT_FOUND warning), the Lab Number cell becomes editable. The user can type a corrected accession number, and the system re-validates in real-time.

#### 4.5.2 Custom Plugin Preview (Example: TB-Profiler)

When the selected analyzer's plugin registers a custom preview component, the slot renders that component instead of the default table. The TB-Profiler plugin preview includes:

**Classification Banner:**
- MDR-TB / Pre-XDR-TB / XDR-TB / Sensitive badge (color-coded)
- Accession number and organism + lineage
- Resistant / Susceptible drug counts

**Sequencing Quality Control Section (collapsible):**
- Gauge cards for key QC metrics: Reads Mapped (%), Median Depth (x), Coverage at 30x (%), Total Reads
- Each gauge shows pass/warn/fail thresholds with color-coded status
- Expandable per-target gene depth table
- Overall QC pass/warn/fail badge in section header

**Drug Resistance Results Section (collapsible):**
- Grouped by drug category (First-Line, Second-Line, Group C)
- Each drug row shows: drug name, abbreviation code, Resistant/Susceptible badge
- Resistant drugs are expandable to show mutation detail table: Gene, Change, Frequency %, Depth, WHO Grading

**Pipeline and Sequencing Metadata Section (collapsible, default closed):**
- Two-column layout: Pipeline info (software, version, DB version, analysis date) and Sequencing info (platform, instrument, flowcell, kit, basecaller)

**Localization keys for TB-Profiler preview:**

| Key | Default (English) |
|-----|-------------------|
| `label.tbprofiler.classification.mdr` | MDR-TB |
| `label.tbprofiler.classification.preXdr` | Pre-XDR-TB |
| `label.tbprofiler.classification.xdr` | XDR-TB |
| `label.tbprofiler.classification.sensitive` | Sensitive |
| `label.tbprofiler.qc.title` | Sequencing Quality Control |
| `label.tbprofiler.qc.pass` | QC Pass |
| `label.tbprofiler.qc.warning` | QC Warning |
| `label.tbprofiler.qc.fail` | QC Fail |
| `label.tbprofiler.qc.readsMapped` | Reads Mapped |
| `label.tbprofiler.qc.medianDepth` | Median Depth |
| `label.tbprofiler.qc.coverage30x` | Coverage at 30x |
| `label.tbprofiler.qc.totalReads` | Total Reads |
| `label.tbprofiler.qc.perTargetDepth` | Per-Target Gene Depth |
| `label.tbprofiler.drugs.title` | Drug Resistance Results |
| `label.tbprofiler.drugs.resistant` | Resistant |
| `label.tbprofiler.drugs.susceptible` | Susceptible |
| `label.tbprofiler.drugs.firstLine` | First-Line |
| `label.tbprofiler.drugs.secondLine` | Second-Line |
| `label.tbprofiler.drugs.groupC` | Group C |
| `label.tbprofiler.drugs.gene` | Gene |
| `label.tbprofiler.drugs.change` | Change |
| `label.tbprofiler.drugs.frequency` | Frequency |
| `label.tbprofiler.drugs.depth` | Depth |
| `label.tbprofiler.drugs.whoGrading` | WHO Grading |
| `label.tbprofiler.metadata.title` | Pipeline and Sequencing Metadata |
| `label.tbprofiler.metadata.pipeline` | Pipeline |
| `label.tbprofiler.metadata.sequencing` | Sequencing |

### 4.6 Action Bar

Sticky footer with two buttons:

| Button | Type | Localization Key | Behavior |
|--------|------|-----------------|----------|
| Cancel | Ghost | `label.button.cancel` | Clears all state, returns to initial view |
| Submit to Import Queue | Primary | `label.upload.submit` | Submits valid results, redirects to Analyzer Results |

**Partial submit behavior:**
- When some rows have errors but valid records exist: Submit enabled. Confirmation dialog shows error/valid counts.
- When ALL rows have errors: Submit disabled. Message: "No valid records to submit" (`label.upload.noValidRecords`).
- QC gating for TB-Profiler: If sequencing QC fails (any metric below fail threshold), a warning banner appears above the action bar: "Sequencing quality control has failed. Results may be unreliable." (`label.tbprofiler.qc.failWarning`). Submit remains enabled but the warning is recorded with the submission.

---

## 5. Workflow

### 5.1 Standard Flow

```
1. User navigates to Results → Upload Analyzer File
2. User selects analyzer from dropdown
   → Info card appears showing analyzer details and plugin info
   → Upload zone becomes active
3. User uploads file (drag-drop or browse)
   → File sent to backend: POST /api/analyzers/{id}/upload/preview
   → Backend parses file using the analyzer's registered plugin
   → Response includes: AnalyzerRunPreview + optional customPreviewData
4. Frontend checks if plugin has registered a custom preview component
   → YES: Renders custom component in preview slot
   → NO: Renders default table preview in preview slot
5. Validation summary bar updates with counts
6. User reviews preview
   → Default table: can expand warning/error rows, edit lab numbers inline
   → Custom preview: interaction defined by the plugin component
7. User clicks "Submit to Import Queue"
   → POST /api/analyzers/{id}/upload/submit
   → Backend creates AnalyzerRun record
   → QC extraction runs automatically
   → User redirected to Analyzer Results page filtered to new run
   → Success notification displayed
```

### 5.2 TB-Profiler Specific Flow

The TB-Profiler plugin accepts either per-sample JSON (`results/{sample_id}.results.json`) or batch CSV (`tb-profiler collate` output). Per-sample JSON is preferred for full mutation detail.

```
1. User selects "MinION + TB-Profiler" from analyzer dropdown
   → Info card shows: "Pipeline Output Import (JSON)", plugin: "TB-Profiler Parser v1.0"
2. User uploads .json file (single sample) or .txt/.csv (batch collate)
3. Backend parses with TB-Profiler plugin:
   a. Extracts lineage, species, drug resistance, mutations, QC metrics
   b. Evaluates QC against configurable thresholds (depth, coverage, mapping)
   c. Maps drug resistance to OpenELIS test codes
   d. Returns AnalyzerRunPreview (standard rows) + customPreviewData (full TB detail)
4. Frontend renders TB-Profiler custom preview:
   → Classification banner (MDR-TB / Pre-XDR / XDR / Sensitive)
   → QC gauge cards with pass/warn/fail indicators
   → Drug resistance table grouped by drug category
   → Metadata sections (pipeline info, sequencing info)
5. User reviews classification, QC, and drug resistance
6. User submits → results enter standard import queue workflow
```

---

## 6. API Endpoints

### 6.1 Preview

`POST /api/analyzers/{adapterId}/upload/preview`

**Request:** `multipart/form-data` with `file` field.

**Response:**
```json
{
  "preview": {
    "rows": [ /* ParsedResultRow[] */ ],
    "validationSummary": { "total": 14, "patient": 14, "qc": 0, "valid": 14, "warnings": 0, "errors": 0 },
    "metadata": { "sampleId": "2502190002", "analysisDate": "2025-02-19" }
  },
  "customPreviewData": { /* plugin-specific, or null */ },
  "hasCustomPreview": true,
  "pluginInfo": {
    "id": "tbprofiler-json",
    "name": "TB-Profiler JSON Parser",
    "version": "1.0.0",
    "previewComponentId": "TBProfilerPreview"
  }
}
```

### 6.2 Submit

`POST /api/analyzers/{adapterId}/upload/submit?skipErrors=true`

**Request:** `multipart/form-data` with `file` field (re-uploaded) OR reference to cached preview.

**Response:**
```json
{
  "runId": "abc123",
  "resultCount": 14,
  "redirectUrl": "/results/analyzer?runId=abc123"
}
```

### 6.3 List File-Based Analyzers

`GET /api/analyzers?protocolType=file,pipeline`

Returns analyzers filtered to file-based and pipeline adapters. Includes `hasCustomPreview` boolean.

### 6.4 Check Custom Preview Availability

`GET /api/analyzer-plugins/{pluginId}`

Returns plugin metadata including whether a custom preview is registered. The frontend uses the `has_custom_preview` flag to decide whether to look up the component in the compiled-in `previewRegistry`.

**Response:**
```json
{
  "pluginId": "tbprofiler-json",
  "name": "TB-Profiler JSON Parser",
  "version": "1.0.0",
  "hasCustomPreview": true,
  "previewComponentKey": "tbprofiler-json"
}
```

### 6.5 Get Analyzer Run Detail (Review Mode)

`GET /api/analyzer-runs/{runId}`

Returns the full run detail including persisted `customPreviewData` for the review page. The Analyzer Results page calls this when a user selects a run.

**Response:**
```json
{
  "runId": "abc123",
  "analyzerId": 42,
  "analyzerName": "MinION + TB-Profiler",
  "pluginId": "tbprofiler-json",
  "hasCustomPreview": true,
  "source": "file_watcher",
  "receivedAt": "2026-02-24T14:30:00Z",
  "status": "pending",
  "resultCount": 14,
  "preview": {
    "rows": [ /* ParsedResultRow[] */ ],
    "validationSummary": { "total": 14, "patient": 14, "qc": 0, "valid": 14, "warnings": 0, "errors": 0 },
    "metadata": { "sampleId": "2502190002" }
  },
  "customPreviewData": { /* TB-Profiler data — same structure as upload response */ },
  "qcGatingStatus": {
    "passed": true,
    "failedControls": []
  }
}
```

---

## 7. Plugin Preview Component Loading

### 7.1 Component Registry (Compiled-In)

Custom preview components are **compiled into the main OpenELIS frontend bundle** and registered in a static map keyed by plugin ID. This avoids the complexity of dynamic module loading and keeps the build pipeline simple. New preview components are added by a developer, registered in the map, and included in the next release.

```typescript
// src/components/analyzerUpload/previewRegistry.ts
import React from 'react';
import type { PreviewSlotProps } from './PreviewSlotProps';

// Lazy-loaded but compiled into the main bundle via code-splitting
const TBProfilerPreview = React.lazy(
  () => import('./previews/TBProfilerPreview')
);

/**
 * Static registry of plugin ID → custom preview component.
 * To add a new custom preview:
 *   1. Create the component in ./previews/
 *   2. Add an entry here keyed by the backend plugin ID
 *   3. Rebuild and deploy
 */
export const previewRegistry: Record<
  string,
  React.LazyExoticComponent<React.FC<PreviewSlotProps>>
> = {
  'tbprofiler-json': TBProfilerPreview,
  // Future: 'hydrasys-csv': HYDRASYSPreview,
  // Future: 'quantstudio-csv': QuantStudioPreview,
};

/**
 * Resolve the preview component for a given plugin ID.
 * Returns null if no custom preview is registered (use default table).
 */
export function getPreviewComponent(pluginId: string) {
  return previewRegistry[pluginId] ?? null;
}
```

### 7.2 Preview Slot Rendering

The `PreviewSlot` component is reused on **both** the Upload Analyzer File page and the Analyzer Results review page. It uses the registry to decide what to render, and passes the `mode` prop through:

```tsx
// src/components/analyzerUpload/PreviewSlot.tsx
import React, { Suspense } from 'react';
import { getPreviewComponent } from './previewRegistry';
import { DefaultTablePreview } from './DefaultTablePreview';
import { PreviewErrorBoundary } from './PreviewErrorBoundary';
import { PreviewSkeleton } from './PreviewSkeleton';

export function PreviewSlot({
  mode,          // 'upload' | 'review'
  pluginId,
  preview,
  customData,
  analyzer,
  file,
  onValidationUpdate,
  // Review mode props:
  onAcceptAll,
  onRetest,
  onIgnore,
  qcGatingStatus,
  run,
}) {
  const CustomComponent = getPreviewComponent(pluginId);

  if (!CustomComponent) {
    return <DefaultTablePreview mode={mode} rows={preview.rows} />;
  }

  return (
    <PreviewErrorBoundary fallback={<DefaultTablePreview mode={mode} rows={preview.rows} />}>
      <Suspense fallback={<PreviewSkeleton />}>
        <CustomComponent
          mode={mode}
          preview={preview}
          customData={customData}
          analyzer={analyzer}
          file={file}
          onValidationUpdate={onValidationUpdate}
          onAcceptAll={onAcceptAll}
          onRetest={onRetest}
          onIgnore={onIgnore}
          qcGatingStatus={qcGatingStatus}
          run={run}
        />
      </Suspense>
    </PreviewErrorBoundary>
  );
}
```

**Usage on the Upload page (OGC-324):**
```tsx
<PreviewSlot mode="upload" pluginId={analyzer.pluginId} preview={parseResponse.preview}
  customData={parseResponse.customPreviewData} analyzer={analyzer} file={fileInfo}
  onValidationUpdate={handleValidationUpdate} />
```

**Usage on the Analyzer Results review page:**
```tsx
<PreviewSlot mode="review" pluginId={runDetail.pluginId} preview={runDetail.preview}
  customData={runDetail.customPreviewData} analyzer={runDetail.analyzer} run={runDetail.run}
  onAcceptAll={handleAcceptAll} onRetest={handleRetest} onIgnore={handleIgnore}
  qcGatingStatus={runDetail.qcGatingStatus} />
```

### 7.3 Fallback Behavior

- If the custom component throws a runtime error → `PreviewErrorBoundary` catches it, renders the default table preview, and shows a warning banner: "Custom preview unavailable. Showing standard table view." (`label.upload.customPreviewUnavailable`). Error details logged to console.
- Loading state → `PreviewSkeleton` shown while the code-split chunk loads (typically < 100ms since it is compiled into the same bundle).

### 7.4 Adding a New Custom Preview

Since preview components are compiled into the core bundle, the process is:

1. Create the React component in `src/components/analyzerUpload/previews/`.
2. Implement the `PreviewSlotProps` interface.
3. Add an entry in `previewRegistry.ts` keyed by the backend plugin ID string.
4. Build and deploy.

This is intentionally simple for the current scale. If the number of custom previews grows significantly (10+), the architecture can be revisited to support externally-bundled plugins loaded at runtime.

### 7.5 TB-Profiler Preview Component

The TB-Profiler preview is the **first custom preview component** and lives in the core OpenELIS codebase at `src/components/analyzerUpload/previews/TBProfilerPreview.tsx`. It is developed and tracked under a separate Jira story (see §14 Related Specifications). This component renders:

- MDR-TB / Pre-XDR / XDR / Sensitive classification banner
- Sequencing QC gauge cards with configurable thresholds
- Drug resistance results grouped by category with expandable mutation detail
- Pipeline and sequencing metadata panels

---

## 8. Validation Rules

### 8.1 Standard Validation (All Plugins)

| Code | Severity | Description | Localization Key |
|------|----------|-------------|-----------------|
| `ACCESSION_NOT_FOUND` | Warning | Accession number not found in OpenELIS | `label.upload.warn.accessionNotFound` |
| `DUPLICATE_ACCESSION` | Warning | Accession appears multiple times in file | `label.upload.warn.duplicateAccession` |
| `RESULT_EXISTS` | Warning | Result already exists for this test/accession | `label.upload.warn.resultExists` |
| `TEST_NOT_MAPPED` | Warning | Analyzer test code not mapped to OpenELIS test | `label.upload.warn.testNotMapped` |
| `VALUE_OUT_OF_RANGE` | Warning | Result value outside expected analytical range | `label.upload.warn.valueOutOfRange` |
| `PATIENT_MISMATCH` | Warning | Patient in file doesn't match patient on order | `label.upload.warn.patientMismatch` |
| `PARSE_ERROR` | Error | Row could not be parsed (malformed data) | `label.upload.error.parseError` |
| `MISSING_ACCESSION` | Error | Required accession number is empty | `label.upload.error.missingAccession` |
| `MISSING_RESULT` | Error | Required result value is empty | `label.upload.error.missingResult` |
| `INVALID_FORMAT` | Error | File format doesn't match expected analyzer structure | `label.upload.error.invalidFormat` |

### 8.2 TB-Profiler Specific Validation

| Code | Severity | Description | Localization Key |
|------|----------|-------------|-----------------|
| `QC_DEPTH_FAIL` | Warning | Median sequencing depth below minimum threshold | `label.tbprofiler.warn.depthFail` |
| `QC_COVERAGE_FAIL` | Warning | Coverage at 30x below minimum threshold | `label.tbprofiler.warn.coverageFail` |
| `QC_MAPPING_FAIL` | Warning | Percentage of reads mapped below minimum threshold | `label.tbprofiler.warn.mappingFail` |
| `QC_READS_FAIL` | Warning | Total read count below minimum threshold | `label.tbprofiler.warn.readsFail` |
| `LOW_VARIANT_FREQ` | Warning | Resistance mutation has variant frequency below 80% | `label.tbprofiler.warn.lowVariantFreq` |
| `NOVEL_MUTATION` | Warning | Mutation not in WHO catalogue — manual review recommended | `label.tbprofiler.warn.novelMutation` |
| `DB_VERSION_MISMATCH` | Warning | TB-Profiler database version differs from configured version | `label.tbprofiler.warn.dbVersionMismatch` |

---

## 9. Deduplication

- If uploaded file contains accession+test combinations already **Pending** in the import queue, preview shows `RESULT_EXISTS` warning. User can proceed (overwrites pending).
- If results are already **Saved/Accepted**, they cannot be overwritten. Warning indicates the result must be amended through the correction workflow.

---

## 10. Post-Submission Behavior

1. Backend creates `AnalyzerRun` record linked to selected analyzer.
2. QC extraction runs automatically.
3. User redirected to Analyzer Results review page filtered to the new run.
4. Success notification: `label.upload.submitSuccess` → "{count} results submitted for review."
5. Standard QC-first workflow applies (QC evaluation → gating → accept/retest/ignore).

For TB-Profiler submissions, additional post-processing:
- Drug resistance results are stored as structured AST data (not just flat result values).
- Lineage and classification metadata are stored as supplementary fields on the order.
- If the AMR module is enabled, resistance data is available for surveillance dashboards and WHONET export.

---

## 11. Data Model Additions

### 11.1 Plugin Preview Registration

```sql
-- Extends existing analyzer_plugin table
ALTER TABLE analyzer_plugin ADD COLUMN has_custom_preview BOOLEAN DEFAULT FALSE;
ALTER TABLE analyzer_plugin ADD COLUMN preview_component_key VARCHAR(100);
-- preview_component_key maps to the key in the frontend previewRegistry
-- e.g., 'tbprofiler-json' → looks up previewRegistry['tbprofiler-json']
```

### 11.2 Custom Preview Data Persistence

When a parser plugin returns `customPreviewData`, it must be persisted so the Analyzer Results review page can load it later (for backend-imported results, the upload preview response is never seen by the user).

```sql
-- Extends existing analyzer_run table
ALTER TABLE analyzer_run ADD COLUMN custom_preview_data JSONB;
ALTER TABLE analyzer_run ADD COLUMN plugin_id VARCHAR(100);
-- custom_preview_data: the plugin-specific payload (e.g., TB-Profiler's classification,
--   drug resistance, QC metrics, lineage, metadata). Persisted at parse time by the
--   file watcher or the upload/submit endpoint.
-- plugin_id: which parser plugin produced this run (links to previewRegistry key).

CREATE INDEX idx_run_custom_preview ON analyzer_run(id) WHERE custom_preview_data IS NOT NULL;
```

### 11.3 Upload Audit Record

```sql
CREATE TABLE analyzer_file_upload (
  id                  SERIAL PRIMARY KEY,
  analyzer_id         INTEGER NOT NULL REFERENCES analyzer(id),
  plugin_id           VARCHAR(100) NOT NULL,
  filename            VARCHAR(255) NOT NULL,
  file_size_bytes     BIGINT,
  file_hash_sha256    VARCHAR(64),
  uploaded_by         INTEGER NOT NULL REFERENCES system_user(id),
  uploaded_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  preview_result_json JSONB,
  submit_result_json  JSONB,
  analyzer_run_id     INTEGER REFERENCES analyzer_run(id),
  status              VARCHAR(20) NOT NULL DEFAULT 'PREVIEWED',
  -- status: PREVIEWED, SUBMITTED, CANCELLED, ERROR
  CONSTRAINT fk_upload_analyzer FOREIGN KEY (analyzer_id) REFERENCES analyzer(id)
);

CREATE INDEX idx_upload_by_analyzer ON analyzer_file_upload(analyzer_id, uploaded_at DESC);
CREATE INDEX idx_upload_by_user ON analyzer_file_upload(uploaded_by, uploaded_at DESC);
```

---

## 12. Permissions

| Permission Code | Description |
|----------------|-------------|
| `analyzer.upload.execute` | Upload files and submit to import queue |
| `analyzer.upload.view` | View the Upload Analyzer File page |

| Role | Permissions |
|------|-------------|
| Lab Technician | `analyzer.upload.view`, `analyzer.upload.execute` |
| Lab Manager | `analyzer.upload.view`, `analyzer.upload.execute` |
| System Administrator | All permissions |

---

## 13. Acceptance Criteria

### 13.1 Navigation & Layout
- [ ] **AC-01**: "Upload Analyzer File" appears as a sub-menu item under Results
- [ ] **AC-02**: Page uses correct breadcrumb: Results / Upload Analyzer File
- [ ] **AC-03**: Page title uses localization key `label.page.uploadAnalyzerFile`

### 13.2 Analyzer Selector
- [ ] **AC-04**: Dropdown shows only file-based and pipeline analyzers by default
- [ ] **AC-05**: "Show all analyzers" toggle reveals all configured analyzers
- [ ] **AC-06**: Info card appears on selection showing analyzer details and plugin info
- [ ] **AC-07**: Each analyzer shows protocol badge (File Import / Pipeline Import / ASTM / HL7)

### 13.3 File Upload
- [ ] **AC-08**: Upload zone is disabled until an analyzer is selected
- [ ] **AC-09**: Upload zone accepts only file types matching the selected analyzer's plugin
- [ ] **AC-10**: File size limit enforced client-side before upload (50 MB default)
- [ ] **AC-11**: Drag-and-drop and file browser both work
- [ ] **AC-12**: Loading indicator shown during file parse

### 13.4 Preview Slot — Default Table
- [ ] **AC-13**: Default table renders when plugin has no custom preview
- [ ] **AC-14**: Table columns show Row, Lab Number, Test, Result, Status
- [ ] **AC-15**: Warning rows styled amber with expandable detail
- [ ] **AC-16**: Error rows styled red with expandable detail
- [ ] **AC-17**: QC rows display teal QC badge
- [ ] **AC-18**: Lab Number is inline-editable when ACCESSION_NOT_FOUND warning present
- [ ] **AC-19**: Editing Lab Number triggers real-time re-validation

### 13.5 Preview Slot — Custom Component Framework
- [ ] **AC-20**: When a plugin with `hasCustomPreview=true` is selected, the compiled-in preview component renders
- [ ] **AC-21**: `previewRegistry` lookup returns the correct component for the plugin ID
- [ ] **AC-22**: `PreviewSlotProps` interface is exported and documented for future preview developers

### 13.6 Preview Slot — Fallback
- [ ] **AC-23**: If custom component throws runtime error, Error Boundary catches and falls back to default table
- [ ] **AC-24**: Warning banner shown when fallback is triggered: `label.upload.customPreviewUnavailable`
- [ ] **AC-25**: Suspense fallback (skeleton loader) shown during code-split chunk load

### 13.7 Validation Summary
- [ ] **AC-26**: Summary bar shows correct counts for total, patient, QC, warnings, errors
- [ ] **AC-27**: Counts update when custom component calls `onValidationUpdate`

### 13.8 Submission
- [ ] **AC-28**: Submit enabled when at least one valid record exists
- [ ] **AC-29**: Partial submit shows confirmation dialog with error/valid counts
- [ ] **AC-30**: Submit disabled when all rows have errors
- [ ] **AC-31**: Successful submission creates AnalyzerRun and redirects to review page
- [ ] **AC-32**: After submission, standard QC-first workflow applies
- [ ] **AC-33**: Cancel clears all state and returns to initial view

### 13.9 Audit & Security
- [ ] **AC-34**: File upload event recorded in `analyzer_file_upload` table
- [ ] **AC-35**: SHA-256 file hash stored for integrity verification
- [ ] **AC-36**: Permission `analyzer.upload.execute` required for upload and submit
- [ ] **AC-37**: All UI labels use localization keys (no hardcoded text)

---

## 14. Related Specifications

| Document | Relationship |
|----------|-------------|
| Analyzer Results Import FRS v2.0 | Parent spec — defines the Analyzer Results page where submitted results are reviewed |
| Flat File Import — Analyzer Configuration FRS v2.0 (OGC-329) | Admin configuration for file-import analyzers: plugin selection, subdirectory config, file watcher |
| HL7 MLLP Listener FRS v1.0 (OGC-325) | Parallel infrastructure for HL7-based analyzers |
| **TB-Profiler Custom Preview Component (NEW STORY)** | **Separate story** — implements `TBProfilerPreview.tsx` in core codebase using the slot framework defined here |
| MinION + TB-Profiler Field Mapping Spec v1.0 | Detailed JSON field mapping for the TB-Profiler parser plugin |
| MinION + TB-Profiler Companion Guide | Lab technician setup guide for TB-Profiler pipeline |
| AMR Configuration FRS v1.1 | Drug resistance data model used by TB-Profiler results |
| WHONET Integration FRS v1.1 | Export format for TB resistance surveillance data |
| Test Catalog FRS v2 | Analyzer test code mappings used during parse validation |
| System Audit Trail FRS | Tracks file upload events |
| Non-Conformity Event FRS | NCE workflow triggered when QC fails after submission |

---

## 15. Future Enhancements (Out of Scope v3)

1. **Batch upload** — Upload multiple files at once for batch processing.
2. **Drag-drop folder** — Drop an entire folder of files for automatic multi-file import.
3. **Custom preview components for other plugins** — e.g., HYDRASYS electrophoresis gel visualization, QuantStudio amplification curves.
4. **Plugin marketplace / registry** — Centralized discovery and installation of analyzer plugins.
5. **Preview component hot-reload** — Update plugin preview components without full application restart.

---

## 16. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-02-20 | Casey Iiams-Hauser | Initial release — basic upload workflow |
| 1.1 | 2025-02-21 | Casey Iiams-Hauser | Sub-menu navigation, English labels, localization key table |
| 1.2 | 2025-02-22 | Casey Iiams-Hauser | Cross-references to OGC-329 and OGC-325 |
| 2.0 | 2025-02-23 | Casey Iiams-Hauser | Version label bump, comprehensive scope |
| 3.0 | 2026-02-24 | Casey Iiams-Hauser | **Major**: Slot-based plugin preview system with compiled-in component registry. PreviewSlotProps contract with `mode` prop for upload vs. review contexts. Review slot on Analyzer Results page for backend-imported runs. customData persistence on analyzer_run table. TB-Profiler preview split to separate story. Error boundary + Suspense fallback. Upload audit table. Plugin-specific validation codes. |
