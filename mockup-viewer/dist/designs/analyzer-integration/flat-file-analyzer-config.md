# Flat File Import — Analyzer Configuration

## Document Information

| Field | Value |
|-------|-------|
| **Version** | 2.0 |
| **Date** | 2026-02-23 |
| **Status** | Draft |
| **Module** | Admin → Analyzers (Analyzer Management) |
| **Jira** | OGC-329 |
| **Related Figma** | [Analyzer Field Mapping Feature](https://www.figma.com/make/QseQZxQyOWsqciEpLjwkxb/Analyzer-Field-Mapping-Feature) |
| **Related FRS** | HL7 MLLP Listener FRS §7.1 (Protocol dropdown), Analyzer File Upload FRS v1.1 (OGC-324) |

---

## 1. Purpose

Extend the existing Analyzer Management admin page (Admin → Analyzers) to support **flat file import analyzers** as a first-class protocol type alongside ASTM and HL7. This allows administrators to configure instruments that export results as CSV, TSV, or other flat file formats — specifying the parser plugin, shared folder path, and file-watching behavior — using the same UI they already use for ASTM/HL7 analyzers.

The existing Figma Make prototype (linked above) currently supports ASTM analyzers with fields for connection type, IP address, port, serial settings, and a test connection modal. This spec describes how to **extend** that UI to handle the File Import protocol type.

---

## 2. Architecture Overview

### 2.1 Shared Folder Model

OpenELIS uses a **single global base path** for all flat file analyzer imports. Each analyzer instance gets a **subdirectory** named after the analyzer (auto-generated from the analyzer name or configurable).

```
/opt/openelis/analyzer-imports/          ← Global base path (configured once in Site Settings)
├── quantstudio-7-flex/                  ← Auto-created per analyzer
│   ├── incoming/                        ← New files to process
│   ├── processed/                       ← Successfully parsed files (moved here)
│   └── errors/                          ← Files that failed parsing (moved here)
├── sebia-hydrasys/
│   ├── incoming/
│   ├── processed/
│   └── errors/
└── generic-csv/
    ├── incoming/
    ├── processed/
    └── errors/
```

| Setting | Scope | Where Configured |
|---------|-------|-----------------|
| **Base import path** | Global (one per site) | Admin → Site Settings → Analyzer Import Path |
| **Subdirectory name** | Per analyzer | Auto-generated from analyzer name; overridable in analyzer config |
| **Subdirectory structure** | System-managed | `incoming/`, `processed/`, `errors/` auto-created on save |

### 2.2 Processing Modes

Flat file analyzers support two processing modes:

| Mode | Description | When Used |
|------|-------------|-----------|
| **File Watcher (automatic)** | Background service monitors `incoming/` directory and auto-parses new files | Production steady-state — files dropped by instruments via network share |
| **Manual Upload** | Technician uploads file via Results → Upload Analyzer File (OGC-324) | USB transfer, ad-hoc imports, instruments without network share access |

Both modes use the same parser plugin. The File Watcher mode is configured here in Admin. The Manual Upload mode is the user-facing feature described in the Analyzer File Upload FRS.

### 2.3 Plugin Deployment Model

Parser plugins are **deployed on the backend first** — they are not installed or uploaded through the GUI. The typical workflow is:

1. **Developer/Admin** deploys a new parser plugin JAR to the OpenELIS plugin directory (e.g., `/opt/openelis/plugins/`) and restarts the service (or uses hot-reload if supported).
2. **Backend** registers the plugin on startup. The plugin advertises its ID, display name, supported file extensions, and version via the `GET /api/analyzer-plugins?protocol=FILE_IMPORT` endpoint.
3. **GUI** populates the Plugin Type dropdown from this endpoint. The administrator selects the appropriate pre-loaded plugin when configuring a new flat file analyzer.

The Admin UI does not provide a mechanism to upload, install, or manage plugin JARs. If no FILE_IMPORT plugins are registered, the Plugin Type dropdown will be empty and a helper message should indicate that a plugin must be deployed first.

---

## 3. UI Specification

### 3.0 Sidebar Navigation

The **Analyzers** sidebar section contains three sub-menu items. Clicking each navigates to its respective view within the same page shell (header + sidebar remain constant):

| Sub-Menu Item | Route / View | Description |
|---------------|-------------|-------------|
| **Analyzers List** | `/admin/analyzers` | List all configured analyzers (ASTM, HL7, File Import). Add/Edit/Delete. Default landing page. |
| **Upload Analyzer File** | `/admin/analyzers/upload` | Manual file upload screen (OGC-324). Select analyzer → upload file → parse & preview → submit to import queue. |
| **Error Dashboard** | `/admin/analyzers/errors` | View file-level and message-level errors across all analyzers. *(Separate FRS)* |

**Localization keys:**

| Key | Default (English) |
|-----|-------------------|
| `label.sidebar.analyzers` | Analyzers |
| `label.sidebar.analyzers.list` | Analyzers List |
| `label.sidebar.analyzers.upload` | Upload Analyzer File |
| `label.sidebar.analyzers.errors` | Error Dashboard |

### 3.1 Existing Add Analyzer Modal (Current State)

Based on the existing UI (v3.2.1.2), the "Add New Analyzer" modal currently has these fields:

| Field | Type | Current Behavior |
|-------|------|-----------------|
| **Analyzer Name** | TextInput | Free text (e.g., "Hematology Analyzer 1") |
| **Test Unit** | Dropdown | Select from configured Test Units (Lab Units / Laboratory Sections). Populates from `GET /api/test-units?active=true`. Examples: Hematology, Chemistry, Microbiology, Molecular Biology, Immunoassay. Used to filter analyzers by department. |
| **Plugin Type** | Dropdown | "Select plugin type..." — the analyzer plugin that will handle incoming messages |
| **Protocol Version** | Dropdown | ASTM LIS2-A2 (currently the only option) |
| **IP Address** | TextInput | e.g., 192.168.1.10 |
| **Port Number** | NumberInput | e.g., 5000 |
| **Test Connection** | Button | Opens Test Connection modal |
| **Status** | Dropdown | Setup (default). Transitions automatically; manual override to INACTIVE, SETUP, or VALIDATION only. |
| **Cancel / Save** | Buttons | Footer actions |

**Note:** The current UI labels this field "Analyzer Type" with values like HEMATOLOGY, CHEMISTRY. This redesign replaces it with a proper reference to the Test Unit entity (see Lab Units Management FRS), enabling filtering and ensuring consistency with the test catalog's unit assignments.

### 3.2 Extended Add Analyzer Modal (File Import)

When the user selects a **Protocol Version** that indicates file import, the modal dynamically swaps the connection fields (IP Address, Port, Test Connection) for file import configuration fields.

**Protocol Version dropdown gains new options:**

| Value | Label | Shows |
|-------|-------|-------|
| `ASTM_LIS2_A2` | ASTM LIS2-A2 | IP Address, Port, Test Connection (existing) |
| `HL7_MLLP` | HL7 v2.3.1 (MLLP) | IP Address, Port, Test Connection (per HL7 MLLP Listener FRS) |
| **`FILE_IMPORT`** | **File Import (CSV/Flat File)** | **File Import configuration fields (new — see §3.3)** |

### 3.3 File Import Configuration Fields

When Protocol Version = **File Import (CSV/Flat File)**, the following fields replace IP Address, Port, and Test Connection:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| **Subdirectory Name** | TextInput | No | Subdirectory under the global base path. Auto-populated from analyzer name (slugified: lowercase, hyphens, no spaces). Admin can override. |
| **Full Path** | Read-only display | — | Shows computed paths: `{base_path}/{subdirectory}/incoming/`, `.../processed/`, `.../errors/`. Updates live as subdirectory name changes. Styled as a light gray info panel. |
| **File Watcher** | Toggle | No | Enable background file watching on the `incoming/` directory. Default: On. |
| **Polling Interval** | NumberInput + "seconds" label | No | How often to check for new files. Default: 30. Only visible when File Watcher is On. Min: 5, Max: 3600. |
| **File Extensions** | TextInput (comma-separated) | Yes | Accepted file extensions (e.g., `.csv, .tsv`). Auto-populated from Plugin Type's `supportedExtensions` but overridable. |
| **Move Processed Files** | Toggle | No | Move successfully parsed files to `processed/`. Default: On. If Off, files are deleted after processing. |
| **Test Configuration** | Button | — | Replaces "Test Connection". Validates folder access, loads plugin, scans for files, parses first file as preview. |

**Note:** The **Test Unit** and **Plugin Type** dropdowns remain as-is — they work for all protocol versions. For file import analyzers, the Plugin Type selection determines which parser plugin is used (e.g., "QuantStudio CSV Parser", "Generic CSV Parser", "HYDRASYS CSV Parser"). The Plugin Type dropdown is already designed to hold different plugin types — file import plugins simply register alongside ASTM plugins.

### 3.4 Computed Path Display

Below the Subdirectory Name field, a read-only info panel shows the full directory structure:

```
Shared Folder Paths
────────────────────
Incoming:   /opt/openelis/analyzer-imports/quantstudio-7-flex/incoming/
Processed:  /opt/openelis/analyzer-imports/quantstudio-7-flex/processed/
Errors:     /opt/openelis/analyzer-imports/quantstudio-7-flex/errors/
```

This updates in real-time as the Subdirectory Name changes.

### 3.5 Test Configuration Modal (File Import)

For File Import analyzers, "Test Connection" becomes **"Test Configuration"** and opens a modal following the same visual pattern as the existing Test Connection modal, but with file-import-specific content:

**Header:** "Test Configuration" (subtitle: "Validate folder access and preview file parsing")

**Analyzer Information section (same pattern as Test Connection):**

| Field | Value |
|-------|-------|
| Name: | QuantStudio 7 Flex |
| Test Unit: | Molecular Biology |
| Plugin: | QuantStudio CSV Parser v1.0.0 |
| Path: | /opt/openelis/analyzer-imports/quantstudio-7-flex/incoming/ |

**Validation Steps section (replaces Connection Logs):**

Each step shows a status icon (✅ / ❌ / ⏳) and message:

```
✅ Folder access verified — read/write permissions OK
✅ Parser plugin loaded — QuantStudio CSV Parser v1.0.0
✅ Subdirectory structure created
📁 3 files found in incoming/ directory matching .csv
```

**First File Preview section (new — only appears if files found):**

Shows the first file parsed into a compact table:

```
First file: QuantStudio_Export_20250219_143022.csv (24.3 KB)

| Row | Lab Number      | Target       | CT    | Well |
|-----|-----------------|--------------|-------|------|
|  1  | LAB-2025-0100   | SARS-CoV-2 N | 22.5  | A1   |
|  2  | LAB-2025-0100   | ORF1ab       | 23.1  | A1   |
|  3  | LAB-2025-0101   | SARS-CoV-2 N | Undet.| A2   |
| ... | (15 more rows)  |              |       |      |

Parsed 18 results: 12 valid, 4 QC, 2 warnings, 0 errors
```

**Footer:** "Close" (secondary) + "Test Again" (primary) — same pattern as Test Connection modal.

**Error state (same visual pattern as "Connection Failed" badge):**

```
❌ Configuration Failed

Validation Logs:
  ✅ Parser plugin loaded
  ❌ Folder access error: Permission denied on /opt/openelis/.../incoming/
     Ensure the OpenELIS service account has read/write access to this directory.
```

### 3.6 First-Time Setup Behavior

When an administrator creates a new File Import analyzer and saves it:

1. **Directory creation:** The system automatically creates the subdirectory structure (`incoming/`, `processed/`, `errors/`) under the global base path.
2. **Initial scan:** If the File Watcher toggle is On, the file watcher immediately scans the `incoming/` directory for any existing files. If files are found, they are parsed and placed in the Analyzer Results review queue (same as if they had just arrived).
3. **Admin notification:** An inline notification appears: "Analyzer saved. File watcher started. {n} existing files found and queued for processing." (or "No existing files found in incoming directory.")

This means if a lab has been collecting export files in a folder before OpenELIS was configured, the initial setup will automatically pick up and process those historical files.

---

## 4. Global Base Path Configuration

The global base path is configured in **Admin → Site Settings** (not per-analyzer). This is a site-wide setting.

| Field | Type | Description |
|-------|------|-------------|
| **Analyzer Import Base Path** | TextInput | Absolute filesystem path where analyzer subdirectories are created. Default: `/opt/openelis/analyzer-imports/` |

**Validation:** On save, the system checks that the path exists and is writable. If not, shows an error with remediation instructions.

**Migration note:** If the site already has a file-watching service configured via properties files, the migration should populate this setting from the existing configuration.

---

## 5. Analyzers List Page Changes

The existing Analyzers list page shows a table with columns: **Name**, **Test Unit**, **Connection**, **Test Units**, **Status**, **Last Modified**, **Actions**. Summary cards show Total Analyzers, Active, Inactive, Plugin Warnings. Each row has an overflow menu (⋮) with: Field Mappings, Test Connection, Copy Mappings, Edit, Delete.

**Note:** The "Test Unit" column replaces the current "Type" column. It displays the name of the assigned Test Unit (Lab Unit) from the `lab_unit` table (e.g., "Hematology", "Chemistry", "Molecular Biology"). The "Test Units" count column is removed — the single Test Unit assignment replaces both. Analyzers not yet assigned to a test unit show "-".

### 5.1 Table Column Behavior for File Import Analyzers

File Import analyzers appear in the same table alongside ASTM/HL7 analyzers:

| Column | File Import Analyzer Display |
|--------|------------------------------|
| **Name** | Analyzer name. If File Watcher has errors, show red "Watcher Error" badge (same pattern as "Plugin Missing" badge). |
| **Test Unit** | Assigned Test Unit name (e.g., "Molecular Biology", "Electrophoresis"). Same as ASTM analyzers. Links to actual lab_unit record. |
| **Connection** | Shows `File Import` instead of IP:Port. Optionally shows subdirectory name in lighter text below. |
| **Test Units** | Same as ASTM — count of mapped test units |
| **Status** | Same status values (Setup, Active, Inactive, Validation). File Watcher state shown as secondary indicator. |
| **Last Modified** | Same as ASTM |
| **Actions** | Overflow menu — see §5.2 |

### 5.2 Actions Menu for File Import Analyzers

The overflow menu (⋮) adapts for File Import analyzers:

| Action | ASTM/HL7 | File Import | Description |
|--------|----------|-------------|-------------|
| Field Mappings | ✓ | ✓ | Navigate to field mappings page (same for both) |
| Test Connection | ✓ | — | Hidden for file import |
| **Test Configuration** | — | ✓ | Opens Test Configuration modal (§3.5) |
| **Scan Now** | — | ✓ | Triggers immediate scan of `incoming/` directory |
| Copy Mappings | ✓ | ✓ | Copy field mappings to another analyzer (same for both) |
| Edit | ✓ | ✓ | Open Edit Analyzer modal |
| **Pause/Resume Watcher** | — | ✓ | Toggle file watcher without opening edit modal |
| Delete | ✓ | ✓ | Delete analyzer (same for both) |

### 5.3 Summary Cards

The existing summary cards (Total Analyzers, Active, Inactive, Plugin Warnings) remain unchanged. File Import analyzers are counted in the same totals. A future enhancement could add a "Watcher Errors" card if file watcher issues become common.

### 5.4 Filters

The existing Status dropdown filter (All Statuses) works for File Import analyzers the same as ASTM. A **Test Unit** filter dropdown should also be added, populated from `GET /api/test-units?active=true`, allowing administrators to filter the analyzer list to a specific laboratory section (e.g., show only Hematology analyzers). A future enhancement could add a Protocol filter to show only File Import, ASTM, or HL7 analyzers.

---

## 6. API Endpoints

### 6.1 Analyzer CRUD (Existing — Extended)

The existing analyzer CRUD endpoints are extended to accept File Import configuration:

```
POST /api/analyzers
PUT  /api/analyzers/{id}
```

**Request body for File Import analyzer:**

```json
{
  "name": "QuantStudio 7 Flex",
  "testUnitId": 5,
  "pluginType": "quantstudio-csv-parser",
  "protocolVersion": "FILE_IMPORT",
  "status": "SETUP",
  "active": true,
  "fileImportConfig": {
    "subdirectoryName": "quantstudio-7-flex",
    "fileWatcherEnabled": true,
    "pollingIntervalSeconds": 30,
    "acceptedExtensions": [".csv"],
    "moveProcessedFiles": true
  }
}
```

**Note:** The `testUnitId` field replaces the current `analyzerType` string. It references the `lab_unit.id` from the Test Units (Lab Units) table. The `pluginType` field already exists in the current data model — it identifies which analyzer plugin handles incoming data. For ASTM analyzers, this is a message-handling plugin. For File Import analyzers, this is a file-parsing plugin. The `protocolVersion` field is extended from the current `ASTM_LIS2_A2` to include `HL7_MLLP` and `FILE_IMPORT`.

### 6.2 Test Configuration

```
POST /api/analyzers/{id}/test-file-import
```

**Response:**

```json
{
  "folderAccessible": true,
  "parserLoaded": true,
  "parserVersion": "1.0.0",
  "subdirectoryCreated": true,
  "fullIncomingPath": "/opt/openelis/analyzer-imports/quantstudio-7-flex/incoming/",
  "filesFound": 3,
  "matchingExtensions": [".csv"],
  "firstFilePreview": {
    "fileName": "QuantStudio_Export_20250219_143022.csv",
    "fileSize": "24.3 KB",
    "rowCount": 18,
    "columns": ["Lab Number", "Target", "CT Value", "Well"],
    "sampleRows": [
      { "labNumber": "LAB-2025-0100", "target": "SARS-CoV-2 N", "ct": "22.5", "well": "A1" },
      { "labNumber": "LAB-2025-0100", "target": "ORF1ab", "ct": "23.1", "well": "A1" },
      { "labNumber": "LAB-2025-0101", "target": "SARS-CoV-2 N", "ct": "Undetermined", "well": "A2" }
    ],
    "summary": { "valid": 12, "qc": 4, "warnings": 2, "errors": 0 }
  },
  "errors": []
}
```

### 6.3 List Installed Plugins

```
GET /api/analyzer-plugins?protocol=FILE_IMPORT
```

**Response:**

```json
[
  {
    "id": "quantstudio-csv-parser",
    "displayName": "QuantStudio CSV Parser",
    "description": "Thermo Fisher QuantStudio RT-PCR exports (.csv)",
    "supportedExtensions": [".csv"],
    "version": "1.0.0"
  },
  {
    "id": "generic-csv-parser",
    "displayName": "Generic CSV Parser",
    "description": "Configurable CSV/TSV parser with column mapping",
    "supportedExtensions": [".csv", ".tsv", ".txt"],
    "version": "1.0.0"
  }
]
```

### 6.4 Scan Now (Manual Trigger)

```
POST /api/analyzers/{id}/scan
```

Triggers an immediate scan of the `incoming/` directory. Returns the count of files found and queued.

### 6.5 Global Base Path

```
GET  /api/site-settings/analyzer-import-path
PUT  /api/site-settings/analyzer-import-path
```

### 6.6 Test Units (Existing — Used by Analyzer Form)

```
GET /api/test-units?active=true
```

Returns active Test Units (Lab Units) for the Test Unit dropdown in the Add/Edit Analyzer modal. This endpoint already exists for other admin screens (Lab Units Management, Test Catalog).

**Response:**

```json
[
  { "id": 1, "name": "Hematology", "code": "HEME" },
  { "id": 2, "name": "Chemistry", "code": "CHEM" },
  { "id": 3, "name": "Microbiology", "code": "MICRO" },
  { "id": 4, "name": "Immunoassay", "code": "IMMUNO" },
  { "id": 5, "name": "Molecular Biology", "code": "MOLBIO" },
  { "id": 6, "name": "Electrophoresis", "code": "ELECTRO" },
  { "id": 7, "name": "Coagulation", "code": "COAG" }
]
```

---

## 7. Localization Keys

| Key | English Default |
|-----|----------------|
| `label.sidebar.analyzers` | Analyzers |
| `label.sidebar.analyzers.list` | Analyzers List |
| `label.sidebar.analyzers.upload` | Upload Analyzer File |
| `label.sidebar.analyzers.errors` | Error Dashboard |
| `label.analyzer.protocolVersion.fileImport` | File Import (CSV/Flat File) |
| `label.analyzer.testUnit` | Test Unit |
| `label.analyzer.testUnit.placeholder` | Select test unit |
| `label.analyzer.testUnit.helper` | The laboratory section this analyzer belongs to |
| `label.analyzer.fileImport.sectionHeader` | File Import Configuration |
| `label.analyzer.fileImport.subdirectory` | Subdirectory Name |
| `label.analyzer.fileImport.subdirectory.helper` | Folder name under the global import path. Auto-generated from analyzer name. |
| `label.analyzer.fileImport.fullPath` | Shared Folder Paths |
| `label.analyzer.fileImport.fileWatcher` | File Watcher |
| `label.analyzer.fileImport.fileWatcher.helper` | Automatically scan for new files in the incoming directory |
| `label.analyzer.fileImport.pollingInterval` | Polling Interval (seconds) |
| `label.analyzer.fileImport.fileExtensions` | File Extensions |
| `label.analyzer.fileImport.fileExtensions.helper` | Comma-separated list of accepted extensions (e.g., .csv, .tsv) |
| `label.analyzer.fileImport.moveProcessed` | Move Processed Files |
| `label.analyzer.fileImport.moveProcessed.helper` | Move successfully parsed files to the processed/ directory. If off, files are deleted. |
| `label.analyzer.fileImport.testConfig` | Test Configuration |
| `label.analyzer.fileImport.testConfig.subtitle` | Validate folder access and preview file parsing |
| `label.analyzer.fileImport.testConfig.configOk` | Configuration OK |
| `label.analyzer.fileImport.testConfig.configFailed` | Configuration Failed |
| `label.analyzer.fileImport.testConfig.folderOk` | Folder access verified |
| `label.analyzer.fileImport.testConfig.parserOk` | Parser plugin loaded |
| `label.analyzer.fileImport.testConfig.subdirCreated` | Subdirectory structure created |
| `label.analyzer.fileImport.testConfig.filesFound` | {count} files found in incoming/ directory matching {extensions} |
| `label.analyzer.fileImport.testConfig.noFiles` | No files found in incoming/ directory |
| `label.analyzer.fileImport.testConfig.firstPreview` | First File Preview |
| `label.analyzer.fileImport.testConfig.parsed` | Parsed {total} results: {valid} valid, {qc} QC, {warnings} warnings, {errors} errors |
| `label.analyzer.fileImport.testConfig.folderError` | Folder access error |
| `label.analyzer.fileImport.testConfig.parserError` | Parser plugin error |
| `label.analyzer.fileImport.testConfig.validationLogs` | Validation Logs |
| `label.analyzer.fileImport.testConfig.testAgain` | Test Again |
| `label.analyzer.fileImport.connection.label` | File Import |
| `label.analyzer.fileImport.action.scanNow` | Scan Now |
| `label.analyzer.fileImport.action.testConfig` | Test Configuration |
| `label.analyzer.fileImport.action.pauseWatcher` | Pause Watcher |
| `label.analyzer.fileImport.action.resumeWatcher` | Resume Watcher |
| `label.analyzer.fileImport.badge.watcherError` | Watcher Error |
| `label.analyzer.fileImport.saved` | Analyzer saved. File watcher started. {count} existing files found and queued for processing. |
| `label.analyzer.fileImport.saved.noFiles` | Analyzer saved. File watcher started. No existing files found in incoming directory. |
| `label.siteSettings.analyzerImportPath` | Analyzer Import Base Path |
| `label.siteSettings.analyzerImportPath.helper` | Absolute filesystem path where analyzer import subdirectories are created |

---

## 8. User Scenarios

### Scenario 1: Configure a New QuantStudio Analyzer

1. Admin navigates to Admin → Analyzers. Sees the existing list of ASTM and HL7 analyzers.
2. Clicks "Add Analyzer". The Add Analyzer form opens.
3. Enters name: "QuantStudio 7 Flex". Selects Protocol: "File Import (CSV/Flat File)".
4. The form dynamically shows the File Import fields. ASTM/HL7 connection fields are hidden.
5. Selects Parser Plugin: "QuantStudio CSV Parser" from the dropdown. Description shows beneath: "Thermo Fisher QuantStudio RT-PCR exports (.csv)".
6. Subdirectory Name auto-populates: "quantstudio-7-flex". Full path display shows: `/opt/openelis/analyzer-imports/quantstudio-7-flex/incoming/`.
7. File Watcher toggle is On by default. Polling Interval shows 30 seconds.
8. File Extensions auto-populated from plugin: ".csv".
9. Admin clicks "Test Configuration". System:
   - Creates the subdirectory structure.
   - Loads the parser plugin.
   - Scans `incoming/` — finds 0 files.
   - Shows: "✅ Folder access verified. ✅ Parser plugin loaded. 📁 Subdirectory created. ℹ️ No files found."
10. Admin clicks "Save". Analyzer appears in the list with a teal "File Import" badge and "Watching" status.

### Scenario 2: First Setup with Existing Files

1. A lab has been collecting QuantStudio CSV exports in a folder for 3 months before OpenELIS was configured.
2. Admin copies the existing files into `/opt/openelis/analyzer-imports/quantstudio-7-flex/incoming/`.
3. Creates the QuantStudio analyzer (as in Scenario 1).
4. Clicks "Test Configuration". System finds 47 files matching `.csv`.
5. Preview shows the first file parsed: 96 results (full plate), 88 valid, 8 QC, 0 warnings, 0 errors.
6. Admin clicks "Save". File watcher starts and immediately processes all 47 files.
7. Notification: "Analyzer saved. File watcher started. 47 existing files found and queued for processing."
8. Technician navigates to Results → Analyzer Results and sees all historical results in the review queue.

### Scenario 3: Test Configuration Reveals a Problem

1. Admin creates a new File Import analyzer, selects the Generic CSV Parser, and clicks "Test Configuration".
2. System reports: "❌ Folder access error: Permission denied on `/opt/openelis/analyzer-imports/generic-csv/incoming/`."
3. Admin contacts IT to fix filesystem permissions, then re-tests. Now shows: "✅ Folder access verified."
4. 2 files found. First file preview shows parsing errors — wrong delimiter. Admin realizes they need a different parser plugin or the Generic CSV Parser needs configuration.
5. Admin switches to the correct plugin, re-tests, preview looks correct. Saves.

---

## 9. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC-1 | Protocol Version dropdown includes "File Import (CSV/Flat File)" option alongside ASTM LIS2-A2 and HL7 v2.3.1 |
| AC-2 | Selecting File Import hides IP Address, Port Number, and Test Connection; shows File Import configuration fields |
| AC-3 | Plugin Type dropdown includes file import parser plugins registered alongside ASTM plugins |
| AC-4 | Subdirectory Name auto-generates from analyzer name (slugified: lowercase, hyphens) |
| AC-5 | Full path display updates in real-time as subdirectory name changes |
| AC-6 | "Test Configuration" button opens a modal following the same visual pattern as the existing Test Connection modal |
| AC-7 | Test Configuration modal validates folder access, loads parser plugin, scans for files, and parses first file as preview |
| AC-8 | On first save with File Watcher enabled, existing files in `incoming/` are automatically processed |
| AC-9 | File Import analyzers show "File Import" in the Connection column of the Analyzers List table |
| AC-10 | Actions overflow menu shows "Test Configuration" and "Scan Now" for File Import analyzers (hides "Test Connection") |
| AC-11 | "Scan Now" action triggers immediate directory scan |
| AC-12 | "Pause/Resume Watcher" action toggles file watcher from the overflow menu without opening the edit modal |
| AC-13 | File Extensions field auto-populates from the selected Plugin Type's supported extensions |
| AC-14 | Subdirectory structure (`incoming/`, `processed/`, `errors/`) is auto-created on save |
| AC-15 | All UI labels use localization keys |

---

## 10. Design Notes for Figma

### Extending the Existing UI (v3.2.1.2)

The screenshots show the current implementation. The File Import feature extends these existing patterns:

**Add New Analyzer Modal (Image 3):**
- Current fields: Analyzer Name, Analyzer Type (→ becomes Test Unit), Plugin Type, Protocol Version (ASTM LIS2-A2), IP Address, Port Number, Test Connection, Status
- **Extension:** Add "File Import (CSV/Flat File)" to the Protocol Version dropdown. When selected, replace IP Address + Port Number + Test Connection with the file import fields (Subdirectory Name, Full Path display, File Watcher toggle, Polling Interval, File Extensions, Move Processed Files, Test Configuration button). Replace "Analyzer Type" with "Test Unit" dropdown linked to `lab_unit` records.
- The Test Unit and Plugin Type dropdowns remain — Plugin Type already supports different plugin registrations. File import parser plugins (QuantStudio CSV, HYDRASYS CSV, etc.) register alongside ASTM message-handling plugins.

**Analyzer List Table (Images 1-2):**
- Current columns: Name, Type (→ becomes Test Unit), Connection, Test Units (removed), Status, Last Modified, Actions
- **Extension:** File Import analyzers show "File Import" in the Connection column (instead of IP:Port or "-"). "Type" column becomes "Test Unit" linked to `lab_unit` records. "Test Units" count column removed. Everything else stays the same.
- Actions overflow menu (Image 2) gains "Test Configuration" and "Scan Now" for File Import analyzers; "Test Connection" is hidden.

**Test Connection Modal (Image 7):**
- Current pattern: Name, IP, Port, Connection Failed/Success badge, Connection Logs accordion
- **Adaptation for File Import:** Becomes "Test Configuration" modal. Shows Name, Type, Plugin, Path. Status badge becomes "Configuration OK" (green) or "Configuration Failed" (red). Connection Logs becomes "Validation Logs" showing step-by-step results. Adds First File Preview table section.

**Field Mappings Page (Images 4-6):**
- Current: Analyzer Fields table (Field Name, ASTM Ref, Type, Unit, Action), Query Analyzer, Test Mapping
- **For File Import:** The "ASTM Ref" column becomes "CSV Column" or "File Field" (the column header/position in the flat file). "Query Analyzer" becomes "Scan File" (reads a sample file to auto-discover column headers). "Test Mapping" / "Test Field Mappings" modal (Image 5) accepts a sample file upload instead of a sample ASTM message textarea.

### Modal Layout — File Import Variant

```
┌──────────────────────────────────────────────────────┐
│  Add New Analyzer                              ✕     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Analyzer Name                                       │
│  [QuantStudio 7 Flex                              ]  │
│                                                      │
│  Test Unit                                           │
│  [Molecular Biology                              ▾]  │
│                                                      │
│  Plugin Type                                         │
│  [QuantStudio CSV Parser                         ▾]  │
│  The analyzer plugin that will handle incoming files  │
│                                                      │
│  Protocol Version                                    │
│  [File Import (CSV/Flat File)                    ▾]  │
│                                                      │
│  ── File Import Configuration ───────────────────    │
│                                                      │
│  Subdirectory Name                                   │
│  [quantstudio-7-flex                              ]  │
│                                                      │
│  ┌─ Shared Folder Paths ─────────────────────────┐   │
│  │ Incoming:  /opt/openelis/.../incoming/         │   │
│  │ Processed: /opt/openelis/.../processed/        │   │
│  │ Errors:    /opt/openelis/.../errors/           │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  File Extensions                                     │
│  [.csv                                            ]  │
│                                                      │
│  File Watcher           [■ On]                       │
│  Polling Interval       [30] seconds                 │
│                                                      │
│  Move Processed Files   [■ On]                       │
│                                                      │
│  ┌──────────────────┐                                │
│  │ Test Configuration│                               │
│  └──────────────────┘                                │
│                                                      │
│  Status                                              │
│  [Setup                                          ▾]  │
│  Status transitions automatically based on analyzer  │
│  state. Manual override to INACTIVE, SETUP, or       │
│  VALIDATION only.                                    │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Cancel                              Save            │
└──────────────────────────────────────────────────────┘
```

### Test Configuration Modal — File Import

```
┌──────────────────────────────────────────────────────┐
│  Validate folder access and preview file parsing     │
│  Test Configuration                            ✕     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Name:    QuantStudio 7 Flex                         │
│  Unit:    Molecular Biology                          │
│  Plugin:  QuantStudio CSV Parser v1.0.0              │
│  Path:    .../quantstudio-7-flex/incoming/            │
│                                                      │
│  ┌─────────────────────────────────────┐             │
│  │ ✅ Configuration OK                 │   (green)   │
│  └─────────────────────────────────────┘             │
│                                                      │
│  ▾ Validation Logs                                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │ info: Checking folder access...                 │ │
│  │ info: Folder access verified (read/write OK)    │ │
│  │ info: Loading parser plugin...                  │ │
│  │ info: Parser loaded: QuantStudio CSV v1.0.0     │ │
│  │ info: Scanning for files matching .csv...       │ │
│  │ info: 3 files found in incoming/ directory      │ │
│  │ info: Parsing first file for preview...         │ │
│  │ info: Parsed 18 results (12 valid, 4 QC,       │ │
│  │       2 warnings, 0 errors)                     │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ── First File Preview ─────────────────────────── │
│  QuantStudio_Export_20250219_143022.csv (24.3 KB)    │
│                                                      │
│  ┌─────┬────────────────┬──────────┬──────┬──────┐   │
│  │ Row │ Lab Number     │ Target   │ CT   │ Well │   │
│  ├─────┼────────────────┼──────────┼──────┼──────┤   │
│  │  1  │ LAB-2025-0100  │ CoV-2 N  │ 22.5 │ A1   │   │
│  │  2  │ LAB-2025-0100  │ ORF1ab   │ 23.1 │ A1   │   │
│  │  3  │ LAB-2025-0101  │ CoV-2 N  │ Und. │ A2   │   │
│  │ ... │ (15 more rows) │          │      │      │   │
│  └─────┴────────────────┴──────────┴──────┴──────┘   │
│  Parsed 18 results: 12 valid, 4 QC, 2 warn, 0 err   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Close                            Test Again         │
└──────────────────────────────────────────────────────┘
```

---

## 11. Relationship to Other Features

| Feature | Relationship |
|---------|-------------|
| **Analyzer File Upload (OGC-324)** | Sibling sub-menu under Analyzers. Manual upload screen uses the same parser plugin to parse files. The plugin dropdown in that screen should match the plugins registered here. See [Analyzer File Upload FRS](analyzer-file-upload-frs.md). |
| **HL7 MLLP Listener (OGC-325)** | Parallel protocol type. Same Analyzer Management page, different config fields. |
| **ASTM Service (existing)** | Parallel protocol type. Same Analyzer Management page, different config fields. |
| **Field Mapping (Figma prototype)** | Flat file analyzers also need test code mapping (e.g., column "ALT" → OpenELIS test "Alanine Aminotransferase"). The existing Field Mapping page should work for File Import analyzers too. |
| **Error Dashboard (Figma prototype)** | Sibling sub-menu under Analyzers. Files that fail parsing go to the `errors/` directory. The Error Dashboard should show file-level errors for File Import analyzers. |
