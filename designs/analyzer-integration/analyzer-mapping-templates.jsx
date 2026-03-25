import { useState, useCallback, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// i18n SIMULATION — all user-facing strings use localization tags
// ═══════════════════════════════════════════════════════════════════
const i18n = {
  "app.name": "OpenELIS Global", "app.version": "Version: 3.2.1.2",
  "nav.home": "Home", "nav.genericSample": "Generic Sample", "nav.order": "Order",
  "nav.patient": "Patient", "nav.storage": "Storage", "nav.analyzers": "Analyzers",
  "nav.analyzers.list": "Analyzers List", "nav.analyzers.errorDashboard": "Error Dashboard",
  "nav.analyzers.profileLibrary": "Profile Library",
  "nav.nonConform": "Non-Conform", "nav.workplan": "Workplan", "nav.pathology": "Pathology",
  "nav.immunohistochemistry": "Immunohistochemistry", "nav.cytology": "Cytology",
  "nav.results": "Results", "nav.validation": "Validation", "nav.reports": "Reports",
  "nav.admin": "Admin", "nav.billing": "Billing", "nav.aliquot": "Aliquot",
  "nav.notebook": "NoteBook", "nav.inventory": "Inventory", "nav.help": "Help",
  // Analyzer List
  "analyzer.list.title": "Analyzer List",
  "analyzer.list.subtitle": "Manage laboratory analyzers and field mappings",
  "analyzer.list.addAnalyzer": "Add Analyzer",
  "analyzer.list.totalAnalyzers": "Total Analyzers",
  "analyzer.list.active": "Active", "analyzer.list.inactive": "Inactive",
  "analyzer.list.pluginWarnings": "Plugin Warnings",
  "analyzer.list.search": "Search analyzers...",
  "analyzer.list.status": "Status", "analyzer.list.allStatuses": "All Statuses",
  "analyzer.list.col.name": "Name", "analyzer.list.col.profile": "Profile",
  "analyzer.list.col.labUnits": "Lab Units", "analyzer.list.col.connection": "Connection",
  "analyzer.list.col.testCodes": "Test Codes", "analyzer.list.col.status": "Status",
  "analyzer.list.col.lastModified": "Last Modified", "analyzer.list.col.actions": "Actions",
  // Overflow
  "analyzer.action.fieldMappings": "Field Mappings",
  "analyzer.action.testConnection": "Test Connection",
  "analyzer.action.copyMappings": "Copy Mappings",
  "analyzer.action.exportProfile": "Export Profile",
  "analyzer.action.edit": "Edit", "analyzer.action.delete": "Delete",
  // Modal
  "analyzer.modal.addTitle": "Add New Analyzer",
  "analyzer.modal.editTitle": "Edit Analyzer",
  "analyzer.modal.name": "Analyzer Name",
  "analyzer.modal.namePlaceholder": "e.g., Hematology Analyzer 1",
  "analyzer.modal.status": "Status",
  "analyzer.modal.profile": "Analyzer Profile",
  "analyzer.modal.profile.none": "None (Start from Scratch)",
  "analyzer.modal.profile.builtIn": "BUILT-IN",
  "analyzer.modal.profile.siteLibrary": "SITE LIBRARY",
  "analyzer.modal.profile.importFile": "Import from File...",
  "analyzer.modal.profile.search": "Search profiles...",
  "analyzer.modal.profile.info": "Profile Info",
  "analyzer.modal.profile.applied": "Profile will be applied on save",
  "analyzer.modal.labUnits": "Lab Units",
  "analyzer.modal.labUnits.placeholder": "Select lab units...",
  "analyzer.modal.labUnits.help": "Lab units this analyzer serves. Configured in Admin → Lab Units.",
  "analyzer.modal.pluginType": "Plugin Type",
  "analyzer.modal.pluginType.placeholder": "Select plugin type...",
  "analyzer.modal.pluginType.help": "Determines protocol and available profiles. Only installed plugins are shown.",
  "analyzer.modal.protocolVersion": "Protocol Version",
  "analyzer.modal.flatFile.title": "File Import Configuration",
  "analyzer.modal.flatFile.watchPath": "Watch Folder Path",
  "analyzer.modal.flatFile.watchPath.placeholder": "/opt/openelis/analyzer-import/",
  "analyzer.modal.flatFile.watchPath.help": "Network share or local path where the analyzer exports result files.",
  "analyzer.modal.flatFile.filePattern": "File Name Pattern",
  "analyzer.modal.flatFile.filePattern.placeholder": "*.csv",
  "analyzer.modal.flatFile.filePattern.help": "Glob pattern to match incoming files (e.g., *.csv, RESULTS_*.txt)",
  "analyzer.modal.flatFile.delimiter": "Column Delimiter",
  "analyzer.modal.flatFile.encoding": "File Encoding",
  "analyzer.modal.flatFile.hasHeader": "First Row is Header",
  "analyzer.modal.flatFile.pollInterval": "Poll Interval (seconds)",
  "analyzer.modal.flatFile.archivePath": "Archive Folder Path",
  "analyzer.modal.flatFile.archivePath.placeholder": "/opt/openelis/analyzer-archive/",
  "analyzer.modal.flatFile.archivePath.help": "Processed files are moved here. Leave empty to delete after import.",
  "analyzer.modal.connectionRole": "Connection Role",
  "analyzer.modal.serverMode": "Server (OpenELIS Listens)",
  "analyzer.modal.clientMode": "Client (OpenELIS Connects)",
  "analyzer.modal.listenPort": "Listen Port",
  "analyzer.modal.ipAddress": "IP Address",
  "analyzer.modal.portNumber": "Port Number",
  "analyzer.modal.connectionTimeout": "Connection Timeout (s)",
  "analyzer.modal.retryCount": "NAK Retry Count",
  "analyzer.modal.testConnection": "Test Connection",
  "analyzer.modal.cancel": "Cancel", "analyzer.modal.save": "Save",
  // Export
  "export.title": "Export Analyzer Profile",
  "export.profileName": "Profile Name",
  "export.description": "Description",
  "export.author": "Author",
  "export.tags": "Tags (comma-separated)",
  "export.download": "Download Profile",
  // Lab Unit filter
  "analyzer.list.labUnitFilter": "Lab Unit",
  "analyzer.list.allLabUnits": "All Lab Units",
  // Profile Library
  "profile.library.title": "Profile Library",
  "profile.library.subtitle": "Manage analyzer profiles — built-in, uploaded, and community profiles",
  "profile.library.importProfile": "Import Profile",
  "profile.library.totalProfiles": "Total Profiles",
  "profile.library.builtInCount": "Built-in",
  "profile.library.siteLibCount": "Site Library",
  "profile.library.inUseCount": "In Use",
  "profile.library.search": "Search profiles...",
  "profile.library.sourceFilter": "Source",
  "profile.library.allSources": "All Sources",
  "profile.library.pluginFilter": "Plugin Type",
  "profile.library.allPlugins": "All Plugin Types",
  "profile.library.col.name": "Profile Name",
  "profile.library.col.source": "Source",
  "profile.library.col.plugin": "Plugin",
  "profile.library.col.testCodes": "Tests",
  "profile.library.col.qcRules": "QC Rules",
  "profile.library.col.usedBy": "Used By",
  "profile.library.col.lastModified": "Last Modified",
  "profile.library.col.actions": "Actions",
  "profile.library.action.clone": "Clone to Site Library",
  "profile.library.action.edit": "Edit Profile",
  "profile.library.action.delete": "Delete Profile",
  "profile.library.action.export": "Export as JSON",
  "profile.library.action.viewDetails": "View Details",
  "profile.library.clone.title": "Clone Profile",
  "profile.library.clone.newName": "New Profile Name",
  "profile.library.clone.save": "Clone Profile",
  "profile.library.clone.info": "A copy will be created in your site library. You can then customize it.",
  "profile.library.edit.title": "Edit Profile",
  "profile.library.edit.save": "Save Changes",
  "profile.library.edit.inUseWarning": "This profile is in use by {count} analyzer(s). Changes will NOT affect existing configurations — only new analyzers selecting this profile.",
  "profile.library.edit.readOnly": "Built-in profiles cannot be edited. Clone it to your site library first.",
  "profile.library.delete.title": "Delete Profile",
  "profile.library.delete.confirm": "Are you sure you want to delete \"{name}\"? This cannot be undone.",
  "profile.library.delete.inUseBlock": "This profile is in use by {count} analyzer(s) and cannot be deleted. Remove it from all analyzers first.",
  "profile.library.import.title": "Import Analyzer Profile",
  "profile.library.import.dropzone": "Drag and drop a .json profile file here, or click to browse",
  "profile.library.import.requirements": "File must be a valid OpenELIS Analyzer Profile (.json) conforming to the profile schema.",
  "profile.library.import.save": "Import Profile",
  "profile.library.noneAnalyzers": "Not in use",
  "profile.library.detail.qcRules": "QC Identification Rules",
  "profile.library.detail.qcRules.description": "A sample is classified as QC if ANY rule matches (OR logic):",
  "profile.library.detail.testCodes": "Sample Test Code Mappings",
  "profile.library.detail.testCodes.showing": "Showing {shown} of {total} test codes",
  "profile.library.detail.abnormalFlags": "Abnormal Flag Mappings",
  "profile.library.detail.aggregation": "Result Aggregation",
  "profile.library.detail.extractionOverrides": "Field Extraction Overrides",
  "profile.library.detail.noOverrides": "Using standard field positions (no overrides)",
  "profile.library.analyzersUsing": "{count} analyzer(s)",
  // Field Mappings (carried from v2)
  "mapping.title": "Field Mappings",
  "mapping.subtitle": "Configure field mappings between analyzer and OpenELIS",
  "mapping.warning.required": "Required mappings are missing",
  "mapping.stat.totalMappings": "Total Mappings",
  "mapping.stat.requiredMappings": "Required Mappings",
  "mapping.stat.unmappedFields": "Unmapped Fields",
  "mapping.btn.queryAnalyzer": "Query Analyzer",
  "mapping.btn.testMapping": "Test Mapping",
  "mapping.btn.saveMappings": "Save Mappings",
  "mapping.tab.testCodes": "Test Codes", "mapping.tab.qcRules": "QC Rules",
  "mapping.tab.simulator": "Message Simulator",
  "mapping.tab.fieldExtraction": "Field Extraction",
  "mapping.tab.advanced": "Advanced",
  "mapping.testCodes.title": "Analyzer Fields (All)",
  "mapping.testCodes.search": "Search...",
  "mapping.testCodes.addMapping": "Add Mapping",
  "mapping.testCodes.bulkAdd": "Bulk Add",
  "mapping.testCodes.importCsv": "Import CSV",
  "mapping.testCodes.autoMatch": "Auto-Match",
  "mapping.testCodes.createNewTest": "Create New Test",
  "mapping.summary.title": "Mappings Summary",
  "mapping.summary.empty": "Select a field from the left panel to view or create mappings.",
  "mapping.summary.analyzerCode": "Analyzer Code",
  "mapping.summary.openelisTest": "OpenELIS Test",
  "mapping.summary.transform": "Transformation",
  "mapping.summary.analyzerUnit": "Analyzer Unit",
  "mapping.summary.openelisUnit": "OpenELIS Unit",
  "transform.passThrough": "Pass-through", "transform.greaterLessFlag": "Greater/Less Flag",
  "transform.valueMap": "Value Map", "transform.thresholdClassify": "Threshold Classify",
  "transform.codedLookup": "Coded Lookup",
  "qc.title": "QC Sample Identification",
  "qc.description": "A sample is identified as QC if ANY of these rules match:",
  "qc.addRule": "Add QC Rule", "qc.testRules": "Test QC Rules",
  "simulator.title": "Message Simulator", "simulator.clear": "Clear",
  "simulator.parse": "Parse",
  "simulator.empty": "Paste an ASTM message above and click Parse to validate your configuration.",
  // Select List Mapping
  "mapping.summary.resultType": "Result Type",
  "mapping.summary.selectList": "Select List Value Mapping",
  "mapping.summary.selectList.description": "Map analyzer values to OpenELIS select list options for this test.",
  "mapping.summary.selectList.analyzerValue": "Analyzer Value",
  "mapping.summary.selectList.openelisOption": "OpenELIS Option",
  "mapping.summary.selectList.addRow": "Add Mapping Row",
  "mapping.summary.selectList.unmapped": "No mapping — will reject",
  "mapping.summary.selectList.autoMap": "Auto-Map by Name",
  "mapping.summary.selectList.defaultAction": "Default (unmatched values)",
  // Query Analyzer
  "query.title": "Query Analyzer",
  "query.connecting": "Connecting to analyzer...",
  "query.retrieving": "Retrieving queued messages...",
  "query.success": "Connection successful",
  "query.discovered": "{count} new test code(s) discovered and added to mappings.",
  "query.noNew": "No new test codes discovered. All codes are already mapped.",
  "query.messageReceived": "Queued message received — available in Preview tab.",
  "query.noMessage": "No queued messages available from analyzer.",
  "query.failed": "Connection failed",
  "query.failedDetail": "Could not connect to analyzer. Check connection settings in the Advanced tab.",
  "query.step.connect": "Establishing TCP connection...",
  "query.step.handshake": "ASTM handshake (ENQ/ACK)...",
  "query.step.query": "Sending query request...",
  "query.step.receive": "Receiving response...",
  "query.step.parse": "Parsing message...",
  // Preview Tab
  "mapping.tab.preview": "Preview",
  "preview.title": "Import Preview",
  "preview.subtitle": "Shows how the captured message would appear in the Analyzer Import screen with current mappings.",
  "preview.noMessage": "No message available for preview. Use Query Analyzer to retrieve a queued message, or paste one in the Message Simulator.",
  "preview.analyzerInfo": "Analyzer Information",
  "preview.specimen": "Specimen",
  "preview.qcClassification": "QC Classification",
  "preview.resultsSummary": "Results as they would appear in Analyzer Import",
  "preview.parsingLog": "Parsing Log",
  "preview.acceptAll": "Accept All",
  "preview.rejectAll": "Reject All",
  "delete.title": "Delete Analyzer", "delete.cancel": "Cancel", "delete.delete": "Delete",
  "delete.confirm": "Are you sure you want to delete {name}? This action cannot be undone.",
};
const t = (key) => i18n[key] || key;

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const tk = {
  navBg: "#1a2a3a", navText: "#ccd6e0", navTextActive: "#ffffff",
  navHoverBg: "#243444", navActiveBg: "#0f62fe22", headerBg: "#0d1b2a",
  blue: "#0f62fe", blueHover: "#0043ce", blueLight: "#d0e2ff", blueBg: "#edf5ff",
  green: "#198038", greenBg: "#defbe6", red: "#da1e28", redBg: "#fff1f1",
  yellow: "#f1c21b", yellowBg: "#fcf4d6",
  g900: "#161616", g800: "#262626", g700: "#393939", g600: "#525252",
  g500: "#6f6f6f", g400: "#8d8d8d", g300: "#a8a8a8", g200: "#c6c6c6",
  g100: "#e0e0e0", g50: "#f4f4f4", g10: "#fafafa", white: "#ffffff",
  font: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'IBM Plex Mono', 'Menlo', monospace",
};

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════
const PLUGINS = [
  { id: "generic-astm", name: "Generic ASTM", protocol: "ASTM LIS2-A2", description: "ASTM LIS2-A2 / E1394 over TCP/IP. Supports standard and custom field extraction.", installed: true },
  { id: "generic-hl7", name: "Generic HL7", protocol: "HL7 v2.3.1", description: "HL7 v2.3.1 over MLLP/TCP. OBX-based result mapping.", installed: true },
  { id: "flat-file", name: "Flat File Import", protocol: "CSV / Delimited File", description: "File watcher for CSV, TSV, and delimited text files from a shared folder.", installed: true },
  { id: "astm-bidirectional", name: "ASTM Bidirectional", protocol: "ASTM LIS2-A2 (Bidirectional)", description: "ASTM with order download support. Phase 2 — not yet available.", installed: false },
];

const PROFILES = [
  { id: "indiko-plus-chemistry-v1", name: "Thermo Fisher Indiko Plus — Chemistry Panel", manufacturer: "Thermo Fisher", model: "Indiko Plus", protocol: "ASTM LIS2-A2", pluginType: "generic-astm", version: "1.0.0", author: "OpenELIS Community", testCount: 48, qcRules: 3, source: "BUILT_IN", description: "Standard chemistry profile for Indiko Plus with 48 test codes. Based on LIS Interface Manual v3.2.", defaultPort: 5000, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a2"],
    qcRulesDetail: [
      { type: "fieldEquals", field: "O.16", value: "QC", note: "Specimen descriptor field set to QC by instrument" },
      { type: "specimenIdPrefix", field: "O.3", value: "QC-", note: "Lab QC samples prefixed QC- by convention" },
      { type: "specimenIdPrefix", field: "O.3", value: "CTRL-", note: "Bio-Rad Liquichek control materials prefixed CTRL-" },
    ],
    sampleTestCodes: [
      { code: "0125", name: "Glucose", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0250", name: "BUN (Urea Nitrogen)", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0300", name: "Creatinine", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0415", name: "AST (SGOT)", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "0420", name: "ALT (SGPT)", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "0425", name: "Alkaline Phosphatase", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "0500", name: "Total Bilirubin", resultType: "NUMERIC", unit: "mg/dL", transform: "Greater/Less Flag" },
      { code: "0505", name: "Direct Bilirubin", resultType: "NUMERIC", unit: "mg/dL", transform: "Greater/Less Flag" },
      { code: "0600", name: "Total Protein", resultType: "NUMERIC", unit: "g/dL", transform: "Pass-through" },
      { code: "0610", name: "Albumin", resultType: "NUMERIC", unit: "g/dL", transform: "Pass-through" },
      { code: "0700", name: "Uric Acid", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0800", name: "Cholesterol Total", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", HH: "CRITICAL_HIGH", LL: "CRITICAL_LOW", N: "NORMAL", A: "ABNORMAL" },
    aggregation: { mode: "PER_MESSAGE", windowSeconds: null },
  },
  { id: "maldi-biotyper-astm-v1", name: "Bruker MALDI Biotyper sirius — Organism ID", manufacturer: "Bruker", model: "MALDI Biotyper sirius", protocol: "ASTM LIS2-A2", pluginType: "generic-astm", version: "1.0.0", author: "OpenELIS Community", testCount: 2, qcRules: 2, source: "BUILT_IN", description: "MALDI-TOF organism identification with confidence scoring and threshold classification.", defaultPort: 5001, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a3"],
    qcRulesDetail: [
      { type: "fieldEquals", field: "O.16", value: "QC", note: "Specimen descriptor for QC calibration spots" },
      { type: "fieldEquals", field: "H.12", value: "Q", note: "Processing ID = Q indicates QC run batch" },
    ],
    sampleTestCodes: [
      { code: "ORGANISM_ID", name: "Organism Identification", resultType: "ALPHANUMERIC", unit: null, transform: "Coded Lookup \u2192 Organism Master" },
      { code: "SCORE", name: "Confidence Score", resultType: "NUMERIC", unit: null, transform: "Threshold Classify: \u22652.0=HIGH, 1.7\u20131.99=LOW, <1.7=NO ID" },
    ],
    abnormalFlags: {},
    extractionOverrides: { "P.3": "Run UUID", "O.13": "Plate Position (A1\u2013H12)", "O.16": "Sample Type" },
    aggregation: { mode: "BY_SPECIMEN", windowSeconds: 10 },
  },
  { id: "vidas-immunoassay-v1", name: "bioM\u00e9rieux VIDAS — Immunoassay", manufacturer: "bioM\u00e9rieux", model: "VIDAS", protocol: "ASTM LIS2-A2", pluginType: "generic-astm", version: "1.0.0", author: "OpenELIS Community", testCount: 12, qcRules: 2, source: "BUILT_IN", description: "Immunoassay panel for VIDAS platform incl. thyroid, pregnancy, infectious serology.", defaultPort: 5002, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a6"],
    qcRulesDetail: [
      { type: "specimenIdPrefix", field: "O.3", value: "QC-", note: "Internal QC samples prefixed QC-" },
      { type: "fieldEquals", field: "O.16", value: "CONTROL", note: "O.16 set to CONTROL for calibrator/QC runs" },
    ],
    sampleTestCodes: [
      { code: "VID-TSH", name: "Thyroid Stimulating Hormone", resultType: "NUMERIC", unit: "\u00b5IU/mL", transform: "Pass-through" },
      { code: "VID-FT4", name: "Free T4", resultType: "NUMERIC", unit: "ng/dL", transform: "Pass-through" },
      { code: "VID-HCG", name: "\u03b2-hCG (Pregnancy)", resultType: "NUMERIC", unit: "mIU/mL", transform: "Greater/Less Flag" },
      { code: "VID-FERR", name: "Ferritin", resultType: "NUMERIC", unit: "ng/mL", transform: "Pass-through" },
      { code: "VID-CRP", name: "C-Reactive Protein", resultType: "NUMERIC", unit: "mg/L", transform: "Pass-through" },
      { code: "VID-TOXO-G", name: "Toxoplasma IgG", resultType: "NUMERIC", unit: "IU/mL", transform: "Threshold Classify: \u22658=Pos, 4\u20137.9=Equiv, <4=Neg" },
      { code: "VID-RUB-G", name: "Rubella IgG", resultType: "NUMERIC", unit: "IU/mL", transform: "Threshold Classify: \u226515=Pos, 10\u201314.9=Equiv, <10=Neg" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", P: "POSITIVE", N: "NEGATIVE", E: "EQUIVOCAL" },
    aggregation: { mode: "PER_MESSAGE", windowSeconds: null },
  },
  { id: "stago-st4-coag-v1", name: "Stago ST4 — Coagulation", manufacturer: "Stago", model: "ST4/STA-R", protocol: "ASTM LIS2-A2", pluginType: "generic-astm", version: "1.0.0", author: "OpenELIS Community", testCount: 8, qcRules: 2, source: "BUILT_IN", description: "Coagulation panel for Stago ST4 and STA-R series.", defaultPort: 5003, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a7"],
    qcRulesDetail: [
      { type: "specimenIdPrefix", field: "O.3", value: "QC-", note: "Stago System Control Normal/Abnormal prefixed QC-" },
      { type: "fieldEquals", field: "O.16", value: "QC", note: "Specimen descriptor field" },
    ],
    sampleTestCodes: [
      { code: "PT", name: "Prothrombin Time", resultType: "NUMERIC", unit: "sec", transform: "Pass-through" },
      { code: "INR", name: "Intl Normalized Ratio", resultType: "NUMERIC", unit: null, transform: "Pass-through" },
      { code: "APTT", name: "Activated PTT", resultType: "NUMERIC", unit: "sec", transform: "Pass-through" },
      { code: "FIB", name: "Fibrinogen (Clauss)", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "TT", name: "Thrombin Time", resultType: "NUMERIC", unit: "sec", transform: "Pass-through" },
      { code: "DIMER", name: "D-Dimer", resultType: "NUMERIC", unit: "\u00b5g/mL FEU", transform: "Greater/Less Flag" },
      { code: "AT3", name: "Antithrombin III", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "PC", name: "Protein C Activity", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", HH: "CRITICAL_HIGH", LL: "CRITICAL_LOW", N: "NORMAL" },
    aggregation: { mode: "BY_SPECIMEN", windowSeconds: 15 },
  },
  { id: "sysmex-xn-hema-v1", name: "Sysmex XN Series — Hematology", manufacturer: "Sysmex", model: "XN Series", protocol: "ASTM LIS2-A2", pluginType: "generic-astm", version: "1.0.0", author: "OpenELIS Community", testCount: 30, qcRules: 3, source: "BUILT_IN", description: "Complete CBC with 5-part differential for Sysmex XN-1000/2000/3000/9000.", defaultPort: 5004, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a1"],
    qcRulesDetail: [
      { type: "specimenIdPrefix", field: "O.3", value: "QC-", note: "e-CHECK (XN) control samples prefixed QC-" },
      { type: "fieldContains", field: "P.5", value: "CONTROL", note: "Patient name field contains CONTROL for QC runs" },
      { type: "specimenIdRegex", field: "O.3", value: "^(QC|CTRL|CAL).*", note: "Catch-all: QC, CTRL, or CAL prefixed IDs" },
    ],
    sampleTestCodes: [
      { code: "WBC", name: "White Blood Cell Count", resultType: "NUMERIC", unit: "10\u00b3/\u00b5L", transform: "Pass-through" },
      { code: "RBC", name: "Red Blood Cell Count", resultType: "NUMERIC", unit: "10\u2076/\u00b5L", transform: "Pass-through" },
      { code: "HGB", name: "Hemoglobin", resultType: "NUMERIC", unit: "g/dL", transform: "Pass-through" },
      { code: "HCT", name: "Hematocrit", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "MCV", name: "Mean Corpuscular Volume", resultType: "NUMERIC", unit: "fL", transform: "Pass-through" },
      { code: "MCH", name: "Mean Corpuscular Hb", resultType: "NUMERIC", unit: "pg", transform: "Pass-through" },
      { code: "PLT", name: "Platelet Count", resultType: "NUMERIC", unit: "10\u00b3/\u00b5L", transform: "Pass-through" },
      { code: "NEUT%", name: "Neutrophil %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "LYMPH%", name: "Lymphocyte %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "MONO%", name: "Monocyte %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "EO%", name: "Eosinophil %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "BASO%", name: "Basophil %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", HH: "CRITICAL_HIGH", LL: "CRITICAL_LOW", N: "NORMAL", "*": "SUSPECT_FLAG" },
    aggregation: { mode: "BY_SPECIMEN", windowSeconds: 5 },
  },
  { id: "mindray-bs-chem-v1", name: "Mindray BS-200/300/400 — Chemistry", manufacturer: "Mindray", model: "BS-200/300/400", protocol: "HL7 v2.3.1", pluginType: "generic-hl7", version: "1.0.0", author: "OpenELIS Community", testCount: 40, qcRules: 2, source: "BUILT_IN", description: "Chemistry panel for Mindray BS-series using HL7 v2.3.1 over MLLP. OBX-based result mapping with ^^^CODE format.", defaultPort: 9100, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a4"],
    qcRulesDetail: [
      { type: "specimenIdPrefix", field: "OBR.3", value: "QC-", note: "Specimen ID in OBR-3 prefixed QC- by lab convention" },
      { type: "fieldEquals", field: "OBR.16", value: "QC", note: "OBR-16 Ordering Provider set to QC for control runs" },
    ],
    sampleTestCodes: [
      { code: "^^^GLU", name: "Glucose", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "^^^BUN", name: "BUN (Urea Nitrogen)", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "^^^CREA", name: "Creatinine", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "^^^AST", name: "AST (SGOT)", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "^^^ALT", name: "ALT (SGPT)", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "^^^ALP", name: "Alkaline Phosphatase", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "^^^TBIL", name: "Total Bilirubin", resultType: "NUMERIC", unit: "mg/dL", transform: "Greater/Less Flag" },
      { code: "^^^TP", name: "Total Protein", resultType: "NUMERIC", unit: "g/dL", transform: "Pass-through" },
      { code: "^^^ALB", name: "Albumin", resultType: "NUMERIC", unit: "g/dL", transform: "Pass-through" },
      { code: "^^^CHOL", name: "Cholesterol Total", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", HH: "CRITICAL_HIGH", LL: "CRITICAL_LOW", N: "NORMAL", A: "ABNORMAL" },
    aggregation: { mode: "PER_MESSAGE", windowSeconds: null },
  },
  { id: "mindray-bc5380-hema-v1", name: "Mindray BC-5380 — Hematology", manufacturer: "Mindray", model: "BC-5380", protocol: "HL7 v2.3.1", pluginType: "generic-hl7", version: "1.0.0", author: "OpenELIS Community", testCount: 26, qcRules: 2, source: "BUILT_IN", description: "Hematology panel for Mindray BC-5380 using HL7 v2.3.1 over MLLP. Complete CBC with 5-part diff.", defaultPort: 9101, connectionRole: "SERVER", lastModified: "2026-01-15", modifiedBy: "System", usedBy: ["a5"],
    qcRulesDetail: [
      { type: "specimenIdPrefix", field: "OBR.3", value: "QC-", note: "Mindray hematology control prefixed QC-" },
      { type: "specimenIdRegex", field: "OBR.3", value: "^(QC|CTRL)\\d{1,2}-.*", note: "Pattern: QC1-LOT or CTRL2-LOT for multi-level controls" },
    ],
    sampleTestCodes: [
      { code: "^^^WBC", name: "White Blood Cell Count", resultType: "NUMERIC", unit: "10\u00b3/\u00b5L", transform: "Pass-through" },
      { code: "^^^RBC", name: "Red Blood Cell Count", resultType: "NUMERIC", unit: "10\u2076/\u00b5L", transform: "Pass-through" },
      { code: "^^^HGB", name: "Hemoglobin", resultType: "NUMERIC", unit: "g/dL", transform: "Pass-through" },
      { code: "^^^HCT", name: "Hematocrit", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "^^^PLT", name: "Platelet Count", resultType: "NUMERIC", unit: "10\u00b3/\u00b5L", transform: "Pass-through" },
      { code: "^^^NEUT%", name: "Neutrophil %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
      { code: "^^^LYMPH%", name: "Lymphocyte %", resultType: "NUMERIC", unit: "%", transform: "Pass-through" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", HH: "CRITICAL_HIGH", LL: "CRITICAL_LOW", N: "NORMAL" },
    aggregation: { mode: "BY_SPECIMEN", windowSeconds: 5 },
  },
  { id: "custom-indiko-modified", name: "Custom Indiko (modified QC rules)", manufacturer: "Thermo Fisher", model: "Indiko Plus", protocol: "ASTM LIS2-A2", pluginType: "generic-astm", version: "1.1.0", author: "Dr. Rakoto", testCount: 48, qcRules: 5, source: "SITE_LIBRARY", description: "Modified Indiko profile with additional QC prefix rules for Madagascar NRL site-specific QC naming.", defaultPort: 5000, connectionRole: "SERVER", lastModified: "2026-02-20", modifiedBy: "Dr. Rakoto", usedBy: [],
    qcRulesDetail: [
      { type: "fieldEquals", field: "O.16", value: "QC", note: "Standard QC descriptor" },
      { type: "specimenIdPrefix", field: "O.3", value: "QC-", note: "Standard QC prefix" },
      { type: "specimenIdPrefix", field: "O.3", value: "CTRL-", note: "Bio-Rad control prefix" },
      { type: "specimenIdPrefix", field: "O.3", value: "NRL-QC-", note: "Madagascar NRL site-specific QC prefix" },
      { type: "specimenIdRegex", field: "O.3", value: "^(QC|CTRL|CAL|NRL-QC).*", note: "Catch-all regex including NRL pattern" },
    ],
    sampleTestCodes: [
      { code: "0125", name: "Glucose", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0250", name: "BUN (Urea Nitrogen)", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0300", name: "Creatinine", resultType: "NUMERIC", unit: "mg/dL", transform: "Pass-through" },
      { code: "0415", name: "AST (SGOT)", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
      { code: "0420", name: "ALT (SGPT)", resultType: "NUMERIC", unit: "U/L", transform: "Pass-through" },
    ],
    abnormalFlags: { H: "HIGH", L: "LOW", HH: "CRITICAL_HIGH", LL: "CRITICAL_LOW", N: "NORMAL", A: "ABNORMAL" },
    aggregation: { mode: "PER_MESSAGE", windowSeconds: null },
  },
  { id: "genexpert-flatfile-v1", name: "Cepheid GeneXpert — TB Results", manufacturer: "Cepheid", model: "GeneXpert", protocol: "CSV / Delimited File", pluginType: "flat-file", version: "1.0.0", author: "OpenELIS Community", testCount: 4, qcRules: 1, source: "BUILT_IN", description: "CSV import for GeneXpert MTB/RIF and XDR results exported from GxAlert or GeneXpert Dx software.", defaultPort: null, connectionRole: null, lastModified: "2026-01-15", modifiedBy: "System", usedBy: [],
    qcRulesDetail: [
      { type: "fieldEquals", field: "Column:SampleType", value: "QC", note: "CSV column SampleType value equals QC for calibration cartridges" },
    ],
    sampleTestCodes: [
      { code: "MTB_DETECT", name: "MTB Detection", resultType: "ALPHANUMERIC", unit: null, transform: "Value Map: DETECTED\u2192Positive, NOT DETECTED\u2192Negative, INVALID\u2192Invalid, ERROR\u2192Error" },
      { code: "RIF_RESIST", name: "Rifampicin Resistance", resultType: "ALPHANUMERIC", unit: null, transform: "Value Map: DETECTED\u2192Resistant, NOT DETECTED\u2192Susceptible, INDETERMINATE\u2192Indeterminate" },
      { code: "SAMPLE_CT", name: "Sample Ct Value", resultType: "NUMERIC", unit: "cycles", transform: "Pass-through" },
      { code: "PROBE_CHECK", name: "Probe Check Control", resultType: "ALPHANUMERIC", unit: null, transform: "Value Map: PASS\u2192Pass, FAIL\u2192Fail" },
    ],
    abnormalFlags: {},
    aggregation: { mode: "PER_MESSAGE", windowSeconds: null },
  },
];

const LAB_UNITS = [
  { id: 1, name: "Hematology" }, { id: 2, name: "Clinical Chemistry" },
  { id: 3, name: "Microbiology" }, { id: 4, name: "Immunology / Serology" },
  { id: 5, name: "Parasitology" }, { id: 6, name: "Molecular Biology" },
  { id: 7, name: "Blood Bank" }, { id: 8, name: "Urinalysis" },
  { id: 9, name: "Coagulation" }, { id: 10, name: "TB Laboratory" },
];

const ANALYZERS = [
  { id: "a1", name: "Sysmex XN-1000", profileId: "sysmex-xn-hema-v1", labUnits: [1], connection: "Server :5004", testCodes: 30, status: "Active", lastModified: "2026-02-20" },
  { id: "a2", name: "Indiko Plus #1", profileId: "indiko-plus-chemistry-v1", labUnits: [2], connection: "Server :5000", testCodes: 48, status: "Active", lastModified: "2026-02-18" },
  { id: "a3", name: "MALDI Biotyper", profileId: "maldi-biotyper-astm-v1", labUnits: [3], connection: "Server :5001", testCodes: 2, status: "Setup", lastModified: "2026-02-15" },
  { id: "a4", name: "Mindray BS-380", profileId: "mindray-bs-chem-v1", labUnits: [2, 4], connection: "Server :9100", testCodes: 40, status: "Active", lastModified: "2026-02-14" },
  { id: "a5", name: "Mindray BC-5380", profileId: "mindray-bc5380-hema-v1", labUnits: [1], connection: "Server :9101", testCodes: 26, status: "Setup", lastModified: "2026-02-12" },
  { id: "a6", name: "VIDAS Unit 1", profileId: "vidas-immunoassay-v1", labUnits: [4], connection: "Server :5002", testCodes: 12, status: "Inactive", lastModified: "2026-01-30" },
  { id: "a7", name: "Stago ST4", profileId: "stago-st4-coag-v1", labUnits: [9], connection: "Server :5003", testCodes: 8, status: "Setup", lastModified: "2026-02-22" },
  { id: "a8", name: "Custom Analyzer", profileId: null, labUnits: [], connection: "-", testCodes: 0, status: "Setup", lastModified: "-" },
];

const OE_TESTS = [
  { id: "t01", name: "Glucose", code: "GLU", resultType: "NUMERIC", unit: "mg/dL" },
  { id: "t02", name: "Blood Urea Nitrogen", code: "BUN", resultType: "NUMERIC", unit: "mg/dL" },
  { id: "t03", name: "Creatinine", code: "CREA", resultType: "NUMERIC", unit: "mg/dL" },
  { id: "t04", name: "ALT (SGPT)", code: "ALT", resultType: "NUMERIC", unit: "U/L" },
  { id: "t05", name: "AST (SGOT)", code: "AST", resultType: "NUMERIC", unit: "U/L" },
  { id: "t06", name: "Sodium", code: "Na", resultType: "NUMERIC", unit: "mmol/L" },
  { id: "t07", name: "Potassium", code: "K", resultType: "NUMERIC", unit: "mmol/L" },
  { id: "t08", name: "Total Bilirubin", code: "TBIL", resultType: "NUMERIC", unit: "mg/dL" },
  { id: "t09", name: "WBC", code: "WBC", resultType: "NUMERIC", unit: "10^3/uL" },
  { id: "t10", name: "Hemoglobin", code: "HGB", resultType: "NUMERIC", unit: "g/dL" },
  // SELECT LIST tests — result is chosen from a predefined options list in the test catalog
  { id: "t11", name: "MTB Detection", code: "MTBDET", resultType: "SELECT_LIST", unit: null, options: [
    { id: "opt_pos", value: "Positive", displayOrder: 1 },
    { id: "opt_neg", value: "Negative", displayOrder: 2 },
    { id: "opt_inv", value: "Invalid", displayOrder: 3 },
    { id: "opt_err", value: "Error", displayOrder: 4 },
  ]},
  { id: "t12", name: "Rifampicin Resistance", code: "RIFRST", resultType: "SELECT_LIST", unit: null, options: [
    { id: "opt_res", value: "Resistant", displayOrder: 1 },
    { id: "opt_sus", value: "Susceptible", displayOrder: 2 },
    { id: "opt_ind", value: "Indeterminate", displayOrder: 3 },
  ]},
  { id: "t13", name: "Organism Identification", code: "ORGID", resultType: "SELECT_LIST", unit: null, options: [
    { id: "opt_ecoli", value: "Escherichia coli", displayOrder: 1 },
    { id: "opt_staph", value: "Staphylococcus aureus", displayOrder: 2 },
    { id: "opt_kleb", value: "Klebsiella pneumoniae", displayOrder: 3 },
    { id: "opt_pseudo", value: "Pseudomonas aeruginosa", displayOrder: 4 },
    { id: "opt_strep", value: "Streptococcus pneumoniae", displayOrder: 5 },
    { id: "opt_entero", value: "Enterococcus faecalis", displayOrder: 6 },
    { id: "opt_other", value: "Other (specify in comment)", displayOrder: 99 },
  ]},
  { id: "t14", name: "MALDI Confidence", code: "MALDISCORE", resultType: "SELECT_LIST", unit: null, options: [
    { id: "opt_high", value: "High Confidence (\u22652.0)", displayOrder: 1 },
    { id: "opt_low", value: "Low Confidence (1.7\u20131.99)", displayOrder: 2 },
    { id: "opt_noid", value: "No Identification (<1.7)", displayOrder: 3 },
  ]},
  { id: "t15", name: "Toxoplasma IgG Result", code: "TOXOG", resultType: "SELECT_LIST", unit: null, options: [
    { id: "opt_pos2", value: "Positive", displayOrder: 1 },
    { id: "opt_eq2", value: "Equivocal", displayOrder: 2 },
    { id: "opt_neg2", value: "Negative", displayOrder: 3 },
  ]},
  { id: "t16", name: "Alkaline Phosphatase", code: "ALP", resultType: "NUMERIC", unit: "U/L" },
  { id: "t17", name: "Cholesterol Total", code: "CHOL", resultType: "NUMERIC", unit: "mg/dL" },
];

const INIT_MAPPINGS = [
  { id: "f1", analyzerCode: "GLU", displayName: "Glucose", astmRef: "R.3", type: "NUMERIC", unit: "mg/dL", oeTestId: "t01", oeTestName: "Glucose", oeUnit: "mg/dL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "f2", analyzerCode: "BUN", displayName: "Blood Urea Nitrogen", astmRef: "R.3", type: "NUMERIC", unit: "mg/dL", oeTestId: "t02", oeTestName: "Blood Urea Nitrogen", oeUnit: "mg/dL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "f3", analyzerCode: "CREA", displayName: "Creatinine", astmRef: "R.3", type: "NUMERIC", unit: "mg/dL", oeTestId: "t03", oeTestName: "Creatinine", oeUnit: "mg/dL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "f4", analyzerCode: "ALT", displayName: "ALT", astmRef: "R.3", type: "NUMERIC", unit: "U/L", oeTestId: "t04", oeTestName: "ALT (SGPT)", oeUnit: "U/L", transform: "PASSTHROUGH", status: "mapped" },
  { id: "f5", analyzerCode: "CHOL", displayName: "Cholesterol", astmRef: "R.3", type: "NUMERIC", unit: "mg/dL", oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped" },
  { id: "f6", analyzerCode: "TBIL", displayName: "Total Bilirubin", astmRef: "R.3", type: "NUMERIC", unit: "mg/dL", oeTestId: "t08", oeTestName: "Total Bilirubin", oeUnit: "mg/dL", transform: "GREATER_LESS_FLAG", status: "mapped" },
  // SELECT LIST mappings — analyzer sends text values, mapped to select list options in OE test
  { id: "f7", analyzerCode: "MTB_DETECT", displayName: "MTB Detection", astmRef: "R.3", type: "ALPHANUMERIC", unit: null, oeTestId: "t11", oeTestName: "MTB Detection", oeUnit: "", transform: "VALUE_MAP", status: "mapped",
    valueMap: [
      { analyzerValue: "MTB DETECTED", oeOptionId: "opt_pos", oeOptionValue: "Positive" },
      { analyzerValue: "MTB NOT DETECTED", oeOptionId: "opt_neg", oeOptionValue: "Negative" },
      { analyzerValue: "INVALID", oeOptionId: "opt_inv", oeOptionValue: "Invalid" },
      { analyzerValue: "ERROR", oeOptionId: "opt_err", oeOptionValue: "Error" },
    ], defaultAction: "REJECT" },
  { id: "f8", analyzerCode: "RIF_RESIST", displayName: "Rifampicin Resistance", astmRef: "R.3", type: "ALPHANUMERIC", unit: null, oeTestId: "t12", oeTestName: "Rifampicin Resistance", oeUnit: "", transform: "VALUE_MAP", status: "mapped",
    valueMap: [
      { analyzerValue: "Rif Resistance DETECTED", oeOptionId: "opt_res", oeOptionValue: "Resistant" },
      { analyzerValue: "Rif Resistance NOT DETECTED", oeOptionId: "opt_sus", oeOptionValue: "Susceptible" },
      { analyzerValue: "INDETERMINATE", oeOptionId: "opt_ind", oeOptionValue: "Indeterminate" },
    ], defaultAction: "REJECT" },
  { id: "f9", analyzerCode: "ORGANISM_ID", displayName: "Organism Identification", astmRef: "R.3", type: "ALPHANUMERIC", unit: null, oeTestId: "t13", oeTestName: "Organism Identification", oeUnit: "", transform: "CODED_LOOKUP", status: "mapped",
    valueMap: [
      { analyzerValue: "Escherichia coli", oeOptionId: "opt_ecoli", oeOptionValue: "Escherichia coli" },
      { analyzerValue: "Staphylococcus aureus", oeOptionId: "opt_staph", oeOptionValue: "Staphylococcus aureus" },
      { analyzerValue: "Klebsiella pneumoniae", oeOptionId: "opt_kleb", oeOptionValue: "Klebsiella pneumoniae" },
    ], defaultAction: "PASS_THROUGH" },
  { id: "f10", analyzerCode: "ALP", displayName: "Alkaline Phosphatase", astmRef: "R.3", type: "NUMERIC", unit: "U/L", oeTestId: "t16", oeTestName: "Alkaline Phosphatase", oeUnit: "U/L", transform: "PASSTHROUGH", status: "mapped" },
];

// ═══════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════
const OverflowMenu = ({ items, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: 18, color: tk.g600, lineHeight: 1 }} onClick={() => setOpen(!open)}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 100, background: tk.navBg, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: item.danger ? "#ff8389" : tk.white, borderBottom: `1px solid rgba(255,255,255,.06)` }}
              onMouseEnter={(e) => { if (!item.danger) e.currentTarget.style.background = tk.blue; }}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => { onSelect(item.key); setOpen(false); }}>{item.label}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const Tag = ({ children, onRemove, color = tk.blue }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", fontSize: 11, fontWeight: 500, background: `${color}18`, color: color, marginRight: 4, marginBottom: 2 }}>
    {children}
    {onRemove && <span style={{ cursor: "pointer", fontSize: 13, lineHeight: 1, opacity: 0.7 }} onClick={onRemove}>×</span>}
  </span>
);

const TestComboBox = ({ value, onChange, onCreateNew }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value ? (OE_TESTS.find(t => t.id === value)?.name || "") : "");
  const ref = useRef(null);
  const filtered = OE_TESTS.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  useEffect(() => { if (value) { const test = OE_TESTS.find(t => t.id === value); if (test) setSearch(test.name); } }, [value]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, background: tk.white, color: tk.g900, boxSizing: "border-box" }} placeholder="Search tests..." value={search}
        onChange={(e) => { setSearch(e.target.value); if (value) onChange(null); setOpen(true); }} onFocus={() => setOpen(true)} />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: tk.white, border: `1px solid ${tk.g200}`, boxShadow: "0 4px 16px rgba(0,0,0,.1)", maxHeight: 240, overflowY: "auto" }}>
          {filtered.slice(0, 8).map(test => (
            <div key={test.id} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${tk.g50}` }}
              onMouseEnter={(e) => e.currentTarget.style.background = tk.blueBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => { onChange(test.id); setSearch(test.name); setOpen(false); }}>
              <div style={{ fontWeight: 500 }}>{test.name}</div>
              <div style={{ fontSize: 11, color: tk.g500 }}>{test.code} · {test.resultType} · {test.unit}</div>
            </div>
          ))}
          <div style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: tk.blue, fontWeight: 600, borderTop: `1px solid ${tk.g100}`, background: tk.g50 }}
            onClick={() => { onCreateNew(search); setOpen(false); }}>+ {t("mapping.testCodes.createNewTest")}</div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PROFILE SELECTOR COMBOBOX (FR-24)
// ═══════════════════════════════════════════════════════════════════
const ProfileSelector = ({ value, onChange, onImportFile, profiles = PROFILES }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const builtIn = profiles.filter(p => p.source === "BUILT_IN" && (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  const siteLib = profiles.filter(p => p.source === "SITE_LIBRARY" && (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  const selected = value ? profiles.find(p => p.id === value) : null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", border: `1px solid ${tk.g200}`, background: tk.white, cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1, padding: "10px 12px", fontSize: 14, color: selected ? tk.g900 : tk.g400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.name : t("analyzer.modal.profile.none")}
        </div>
        <div style={{ padding: "10px 12px", color: tk.g400, fontSize: 10 }}>▼</div>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 60, background: tk.white, border: `1px solid ${tk.g200}`, boxShadow: "0 8px 24px rgba(0,0,0,.12)", maxHeight: 400, overflowY: "auto" }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${tk.g100}` }}>
            <input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}
              placeholder={t("analyzer.modal.profile.search")} value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          {/* None */}
          <div style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, fontWeight: !value ? 600 : 400, background: !value ? tk.blueBg : "transparent", color: !value ? tk.blue : tk.g900 }}
            onMouseEnter={(e) => { if (value) e.currentTarget.style.background = tk.g50; }}
            onMouseLeave={(e) => { if (value) e.currentTarget.style.background = "transparent"; }}
            onClick={() => { onChange(null); setOpen(false); setSearch(""); }}>
            {t("analyzer.modal.profile.none")}
          </div>
          {/* Built-in */}
          {builtIn.length > 0 && (
            <>
              <div style={{ padding: "6px 16px", fontSize: 11, fontWeight: 700, color: tk.g500, background: tk.g50, textTransform: "uppercase", letterSpacing: ".5px" }}>{t("analyzer.modal.profile.builtIn")}</div>
              {builtIn.map(p => (
                <div key={p.id} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, background: value === p.id ? tk.blueBg : "transparent", borderBottom: `1px solid ${tk.g50}` }}
                  onMouseEnter={(e) => { if (value !== p.id) e.currentTarget.style.background = tk.g10; }}
                  onMouseLeave={(e) => { if (value !== p.id) e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { onChange(p.id); setOpen(false); setSearch(""); }}>
                  <div style={{ fontWeight: 500, color: value === p.id ? tk.blue : tk.g900 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: tk.g500, marginTop: 2 }}>{p.protocol} · {p.testCount} tests · v{p.version}</div>
                </div>
              ))}
            </>
          )}
          {/* Site Library */}
          {siteLib.length > 0 && (
            <>
              <div style={{ padding: "6px 16px", fontSize: 11, fontWeight: 700, color: tk.g500, background: tk.g50, textTransform: "uppercase", letterSpacing: ".5px" }}>{t("analyzer.modal.profile.siteLibrary")}</div>
              {siteLib.map(p => (
                <div key={p.id} style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, background: value === p.id ? tk.blueBg : "transparent", borderBottom: `1px solid ${tk.g50}` }}
                  onMouseEnter={(e) => { if (value !== p.id) e.currentTarget.style.background = tk.g10; }}
                  onMouseLeave={(e) => { if (value !== p.id) e.currentTarget.style.background = "transparent"; }}
                  onClick={() => { onChange(p.id); setOpen(false); setSearch(""); }}>
                  <div style={{ fontWeight: 500, color: value === p.id ? tk.blue : tk.g900 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: tk.g500, marginTop: 2 }}>{p.protocol} · {p.testCount} tests · v{p.version}</div>
                </div>
              ))}
            </>
          )}
          {/* Import */}
          <div style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: tk.blue, fontWeight: 600, borderTop: `1px solid ${tk.g100}`, background: tk.g50, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => { onImportFile(); setOpen(false); }}>
            📁 {t("analyzer.modal.profile.importFile")}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// LAB UNIT MULTI-SELECT (FR-25)
// ═══════════════════════════════════════════════════════════════════
const LabUnitMultiSelect = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  const filtered = LAB_UNITS.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ minHeight: 42, border: `1px solid ${tk.g200}`, background: tk.white, padding: "6px 8px", cursor: "pointer", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }} onClick={() => setOpen(!open)}>
        {selected.length === 0 && <span style={{ color: tk.g400, fontSize: 14, padding: "2px 4px" }}>{t("analyzer.modal.labUnits.placeholder")}</span>}
        {selected.map(id => {
          const u = LAB_UNITS.find(x => x.id === id);
          return u ? <Tag key={id} onRemove={(e) => { e.stopPropagation(); toggle(id); }}>{u.name}</Tag> : null;
        })}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 55, background: tk.white, border: `1px solid ${tk.g200}`, boxShadow: "0 4px 16px rgba(0,0,0,.1)", maxHeight: 260, overflowY: "auto" }}>
          <div style={{ padding: 8, borderBottom: `1px solid ${tk.g100}` }}>
            <input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="Filter lab units..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          {filtered.map(u => (
            <div key={u.id} style={{ padding: "8px 16px", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 8, background: selected.includes(u.id) ? tk.blueBg : "transparent" }}
              onMouseEnter={(e) => { if (!selected.includes(u.id)) e.currentTarget.style.background = tk.g10; }}
              onMouseLeave={(e) => { if (!selected.includes(u.id)) e.currentTarget.style.background = selected.includes(u.id) ? tk.blueBg : "transparent"; }}
              onClick={() => toggle(u.id)}>
              <div style={{ width: 16, height: 16, border: `2px solid ${selected.includes(u.id) ? tk.blue : tk.g300}`, background: selected.includes(u.id) ? tk.blue : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: tk.white, flexShrink: 0 }}>{selected.includes(u.id) ? "✓" : ""}</div>
              {u.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════
export default function AnalyzerMappingApp() {
  const [view, setView] = useState("list");
  const [selectedAnalyzer, setSelectedAnalyzer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showExportModal, setShowExportModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedNav, setExpandedNav] = useState("analyzers");

  // Profile library state
  const [showCloneModal, setShowCloneModal] = useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = useState(null);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [libSourceFilter, setLibSourceFilter] = useState("");
  const [libPluginFilter, setLibPluginFilter] = useState("");
  const [libSearch, setLibSearch] = useState("");
  const [expandedProfileId, setExpandedProfileId] = useState(null);
  const [cloneName, setCloneName] = useState("");
  const [editForm, setEditForm] = useState({ name: "", description: "", tags: "" });

  // Modal form state
  const [modalProfile, setModalProfile] = useState(null);
  const [modalLabUnits, setModalLabUnits] = useState([]);
  const [modalPluginType, setModalPluginType] = useState("");
  const [connectionRole, setConnectionRole] = useState("server");

  // Mappings page state
  const [activeTab, setActiveTab] = useState("testcodes");
  const [selectedField, setSelectedField] = useState(null);
  const [mappings, setMappings] = useState(INIT_MAPPINGS);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showInlineCreate, setShowInlineCreate] = useState(null);
  const [newTestForm, setNewTestForm] = useState({ name: "", code: "", resultType: "NUMERIC", unit: "", sampleType: "Serum" });
  const [qcRules, setQcRules] = useState([{ id: "qc1", type: "specimenIdPrefix", field: "O.3", value: "QC-" }, { id: "qc2", type: "fieldEquals", field: "O.16", value: "QC" }]);
  const [simMessage, setSimMessage] = useState("");
  // Query Analyzer state
  const [queryState, setQueryState] = useState(null); // null | "connecting" | "success" | "failed"
  const [querySteps, setQuerySteps] = useState([]);
  const [queryDiscovered, setQueryDiscovered] = useState([]);
  // Preview state — captured message for import preview
  const [previewMessage, setPreviewMessage] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLog, setPreviewLog] = useState([]);
  const [simResult, setSimResult] = useState(null);

  // List filters
  const [listLabUnitFilter, setListLabUnitFilter] = useState(null);

  const showToastMsg = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);
  const openMappings = (a) => { setSelectedAnalyzer(a); setView("mappings"); setActiveTab("testcodes"); setSelectedField(null); };

  const openAddModal = (editAnalyzer) => {
    if (editAnalyzer && typeof editAnalyzer === "object") {
      setModalProfile(editAnalyzer.profileId);
      setModalLabUnits(editAnalyzer.labUnits || []);
      const prof = editAnalyzer.profileId ? PROFILES.find(p => p.id === editAnalyzer.profileId) : null;
      setModalPluginType(prof?.pluginType || "");
    } else { setModalProfile(null); setModalLabUnits([]); setModalPluginType(""); }
    setShowAddModal(editAnalyzer || true);
  };

  // Profile selection effects
  const selectedProfile = modalProfile ? PROFILES.find(p => p.id === modalProfile) : null;
  const selectedPlugin = modalPluginType ? PLUGINS.find(p => p.id === modalPluginType) : null;
  const filteredProfiles = modalPluginType ? PROFILES.filter(p => p.pluginType === modalPluginType) : PROFILES;

  const onPluginChange = (pluginId) => {
    setModalPluginType(pluginId);
    // Clear profile if it doesn't match the new plugin type
    if (modalProfile) {
      const prof = PROFILES.find(p => p.id === modalProfile);
      if (prof && prof.pluginType !== pluginId) { setModalProfile(null); }
    }
    // Set connection role default for flat file
    if (pluginId === "flat-file") setConnectionRole("file");
    else setConnectionRole("server");
  };

  const onProfileChange = (profileId) => {
    setModalProfile(profileId);
    if (profileId) {
      const p = PROFILES.find(x => x.id === profileId);
      if (p) {
        if (p.connectionRole) setConnectionRole(p.connectionRole === "SERVER" ? "server" : "client");
        // Auto-set plugin type from profile if not already set
        if (!modalPluginType && p.pluginType) setModalPluginType(p.pluginType);
      }
    }
  };

  const addMapping = () => setMappings(prev => [...prev, { id: `f${Date.now()}`, analyzerCode: "", displayName: "", astmRef: "R.3", type: "NUMERIC", unit: "", oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "draft" }]);
  const updateMapping = (id, field, value) => setMappings(prev => prev.map(m => { if (m.id !== id) return m; const u = { ...m, [field]: value }; if (field === "oeTestId" && value) { const test = OE_TESTS.find(t => t.id === value); if (test) { u.oeTestName = test.name; u.oeUnit = test.unit; u.status = "mapped"; } } return u; }));
  const deleteMapping = (id) => setMappings(prev => prev.filter(m => m.id !== id));
  const doBulkAdd = () => { const codes = bulkText.split("\n").map(l => l.trim()).filter(Boolean); const existing = new Set(mappings.map(m => m.analyzerCode)); const newRows = [...new Set(codes)].filter(c => !existing.has(c)).map(code => ({ id: `f${Date.now()}_${code}`, analyzerCode: code, displayName: code, astmRef: "R.3", type: "NUMERIC", unit: "", oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped" })); setMappings(prev => [...prev, ...newRows]); setShowBulkAdd(false); setBulkText(""); showToastMsg(`Added ${newRows.length} test codes`); };
  const doCreateTest = () => { const newTest = { id: `t_new_${Date.now()}`, name: newTestForm.name, code: newTestForm.code, resultType: newTestForm.resultType, unit: newTestForm.unit }; OE_TESTS.push(newTest); updateMapping(showInlineCreate, "oeTestId", newTest.id); setShowInlineCreate(null); showToastMsg(`Test "${newTest.name}" created and mapped`); };
  // ═══ QUERY ANALYZER ═══
  const runQueryAnalyzer = () => {
    setQueryState("connecting");
    setQuerySteps([]);
    setQueryDiscovered([]);
    const steps = [
      { msg: t("query.step.connect"), delay: 600 },
      { msg: t("query.step.handshake"), delay: 800 },
      { msg: t("query.step.query"), delay: 500 },
      { msg: t("query.step.receive"), delay: 1200 },
      { msg: t("query.step.parse"), delay: 400 },
    ];
    let i = 0;
    const tick = () => {
      if (i < steps.length) {
        setQuerySteps(prev => [...prev, { msg: steps[i].msg, status: "done", time: new Date().toLocaleTimeString() }]);
        i++;
        setTimeout(tick, steps[i-1].delay);
      } else {
        // Simulate: discovered 2 new test codes + a queued message
        const newCodes = ["URIC", "PHOS"];
        const discovered = newCodes.filter(code => !mappings.find(m => m.analyzerCode === code));
        if (discovered.length > 0) {
          setMappings(prev => [...prev, ...discovered.map((code, idx) => ({
            id: `fq${Date.now()}_${idx}`, analyzerCode: code, displayName: code === "URIC" ? "Uric Acid" : "Phosphorus",
            astmRef: "R.3", type: "NUMERIC", unit: code === "URIC" ? "mg/dL" : "mg/dL",
            oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped"
          }))]);
        }
        setQueryDiscovered(discovered);
        // Set preview message (simulated queued ASTM message)
        const capturedMsg = "H|\\^&|||Indiko Plus^Thermo Fisher|||||||LIS2-A2\nP|1||PAT-2026-0412||Doe^Jane||19850315|F\nO|1|LAB-2026-0412||^^^GLU\\^^^BUN\\^^^CREA\\^^^ALT\\^^^TBIL\\^^^ALP\\^^^MTB_DETECT\\^^^RIF_RESIST|R|20260226103000||||N\nR|1|^^^GLU|105|mg/dL|70-100|H|F\nR|2|^^^BUN|22|mg/dL|7-20|H|F\nR|3|^^^CREA|0.9|mg/dL|0.6-1.2|N|F\nR|4|^^^ALT|45|U/L|7-56|N|F\nR|5|^^^TBIL|>2.5|mg/dL|0.1-1.2|HH|F\nR|6|^^^ALP|85|U/L|44-147|N|F\nR|7|^^^MTB_DETECT|MTB DETECTED|||A|F\nR|8|^^^RIF_RESIST|Rif Resistance NOT DETECTED||||F\nR|9|^^^URIC|8.5|mg/dL|3.5-7.2|H|F\nR|10|^^^PHOS|4.2|mg/dL|2.5-4.5|N|F\nL|1|N";
        setPreviewMessage(capturedMsg);
        parsePreviewMessage(capturedMsg);
        setQueryState("success");
      }
    };
    setTimeout(tick, 400);
  };

  // ═══ PREVIEW PARSER ═══
  const parsePreviewMessage = (msg) => {
    const lines = msg.split("\n");
    const log = [];
    const header = lines.find(l => l.startsWith("H|"));
    const patient = lines.find(l => l.startsWith("P|"));
    const order = lines.find(l => l.startsWith("O|"));
    const results = lines.filter(l => l.startsWith("R|"));
    
    const instrument = header ? (header.split("|")[4]?.split("^")[0] || "Unknown") : "Unknown";
    const specimen = order ? (order.split("|")[2] || "Unknown") : "Unknown";
    const patientName = patient ? (patient.split("|")[4]?.replace("^", ", ") || "Unknown") : "Unknown";
    const patientDob = patient ? (patient.split("|")[7] || "") : "";
    
    log.push({ level: "INFO", time: "10:30:01", msg: `Header parsed: instrument=${instrument}` });
    log.push({ level: "INFO", time: "10:30:01", msg: `Patient: ${patientName}, DOB: ${patientDob}` });
    log.push({ level: "INFO", time: "10:30:01", msg: `Order: specimen=${specimen}` });
    
    // Check QC rules
    const isQC = qcRules.some(rule => {
      if (rule.type === "specimenIdPrefix" && specimen.startsWith(rule.value)) return true;
      if (rule.type === "fieldEquals" && rule.field === "O.16") {
        const o16 = order ? order.split("|")[15] : "";
        return o16 === rule.value;
      }
      return false;
    });
    log.push({ level: "INFO", time: "10:30:01", msg: `QC classification: ${isQC ? "QC SAMPLE" : "PATIENT SAMPLE"} (${qcRules.length} rules evaluated)` });

    const parsed = results.map((r, ri) => {
      const f = r.split("|");
      const testId = f[2]?.replace(/\^/g, "") || "?";
      const val = f[3] || "";
      const units = f[4] || "";
      const refRange = f[5] || "";
      const flag = f[6] || "";
      const match = mappings.find(m => m.analyzerCode === testId);
      const oeTest = match?.oeTestId ? OE_TESTS.find(t => t.id === match.oeTestId) : null;
      
      let displayValue = val;
      let resolvedOption = null;
      let parseWarning = null;
      
      if (match && oeTest?.resultType === "SELECT_LIST" && match.valueMap) {
        const vm = match.valueMap.find(v => v.analyzerValue === val);
        if (vm) {
          resolvedOption = vm.oeOptionValue;
          displayValue = vm.oeOptionValue;
          log.push({ level: "INFO", time: `10:30:0${ri+2}`, msg: `${testId}: value "${val}" \u2192 select list option "${vm.oeOptionValue}"` });
        } else {
          parseWarning = `Unmatched value: "${val}" has no mapping to select list options`;
          log.push({ level: "WARN", time: `10:30:0${ri+2}`, msg: `${testId}: value "${val}" not found in value map. Default action: ${match.defaultAction || "REJECT"}` });
        }
      } else if (match && match.transform === "GREATER_LESS_FLAG" && (val.startsWith(">") || val.startsWith("<"))) {
        const op = val.match(/^([><]=?)/)?.[1] || "";
        const num = val.replace(/^[><]=?/, "");
        displayValue = val;
        log.push({ level: "INFO", time: `10:30:0${ri+2}`, msg: `${testId}: Greater/Less flag detected: operator="${op}", value="${num}"` });
      } else if (!match) {
        parseWarning = "Unmapped test code";
        log.push({ level: "WARN", time: `10:30:0${ri+2}`, msg: `${testId}: No mapping found for analyzer code "${testId}"` });
      } else {
        log.push({ level: "INFO", time: `10:30:0${ri+2}`, msg: `${testId}: \u2192 ${match.oeTestName} = ${val} ${units}` });
      }
      
      return { testId, rawValue: val, displayValue, units, refRange, flag, 
               oeName: match?.oeTestName || "\u2014 UNMAPPED \u2014",
               oeTestType: oeTest?.resultType || "NUMERIC",
               resolvedOption, parseWarning,
               status: match ? (parseWarning ? "warning" : "mapped") : "unmapped",
               isSelectList: oeTest?.resultType === "SELECT_LIST",
               accepted: match && !parseWarning };
    });
    
    log.push({ level: "INFO", time: "10:30:12", msg: `Parse complete: ${parsed.length} results, ${parsed.filter(p => p.status === "mapped").length} mapped, ${parsed.filter(p => p.status === "unmapped").length} unmapped, ${parsed.filter(p => p.status === "warning").length} warnings` });
    
    setPreviewData({ instrument, specimen, patientName, patientDob, isQC, results: parsed, timestamp: "2026-02-26 10:30:00" });
    setPreviewLog(log);
  };

  const runSimulator = () => { if (!simMessage.trim()) return; const lines = simMessage.split("\n"); const header = lines.find(l => l.startsWith("H|")); const results = lines.filter(l => l.startsWith("R|")); const order = lines.find(l => l.startsWith("O|")); const instrument = header ? header.split("|")[4]?.split("^")[0] || "Unknown" : "Unknown"; const specimen = order ? order.split("|")[2] || "Unknown" : "Unknown"; const parsed = results.map(r => { const f = r.split("|"); const testId = f[2]?.replace(/\^/g, "") || "?"; const val = f[3] || ""; const units = f[4] || ""; const flag = f[6] || ""; const match = mappings.find(m => m.analyzerCode === testId); return { testId, value: val, units, flag, oeName: match?.oeTestName || "UNMAPPED", status: match ? "matched" : "unmatched" }; }); setSimResult({ instrument, specimen, results: parsed, warnings: parsed.filter(p => p.status === "unmatched").length }); };

  const mappedCount = mappings.filter(m => m.status === "mapped").length;
  const unmappedCount = mappings.filter(m => m.status !== "mapped").length;
  const filteredAnalyzers = listLabUnitFilter ? ANALYZERS.filter(a => a.labUnits.includes(listLabUnitFilter)) : ANALYZERS;

  // ═══════════════════════════════════════════════════════════════
  // SIDEBAR
  // ═══════════════════════════════════════════════════════════════
  const NAV = [
    { key: "home", label: t("nav.home") },
    { key: "order", label: t("nav.order"), exp: true },
    { key: "patient", label: t("nav.patient"), exp: true },
    { key: "analyzers", label: t("nav.analyzers"), exp: true, children: [
      { key: "analyzersList", label: t("nav.analyzers.list") },
      { key: "profileLibrary", label: t("nav.analyzers.profileLibrary") },
      { key: "errorDashboard", label: t("nav.analyzers.errorDashboard") },
    ]},
    { key: "results", label: t("nav.results"), exp: true },
    { key: "validation", label: t("nav.validation"), exp: true },
    { key: "reports", label: t("nav.reports"), exp: true },
    { key: "admin", label: t("nav.admin") },
  ];

  const Sidebar = () => {
    const activeChild = view === "library" ? "profileLibrary" : "analyzersList";
    const analyzersExpanded = view === "list" || view === "mappings" || view === "library";
    return (
    <div style={{ width: 224, background: tk.navBg, color: tk.navText, overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: tk.headerBg, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: "#2a5a8a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: tk.white, fontWeight: 700 }}>OE</div>
        <div><div style={{ fontSize: 14, fontWeight: 600, color: tk.white }}>Test LIMS</div><div style={{ fontSize: 11, color: tk.g400 }}>{t("app.version")}</div></div>
      </div>
      <div style={{ flex: 1, paddingTop: 8 }}>
        {NAV.map(item => (
          <div key={item.key}>
            <div style={{ padding: "8px 12px 8px 16px", fontSize: 13, color: item.key === "analyzers" ? tk.navTextActive : tk.navText, background: item.key === "analyzers" ? tk.navActiveBg : "transparent", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: item.key === "analyzers" ? 600 : 400, borderLeft: item.key === "analyzers" ? `3px solid ${tk.blue}` : "3px solid transparent" }}
              onClick={() => item.exp && (item.key === "analyzers" ? null : setExpandedNav(expandedNav === item.key ? null : item.key))}>
              <span>{item.label}</span>{item.exp && <span style={{ fontSize: 10, color: tk.g400, transform: (item.key === "analyzers" ? analyzersExpanded : expandedNav === item.key) ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>}
            </div>
            {item.children && (item.key === "analyzers" ? analyzersExpanded : expandedNav === item.key) && item.children.map(child => (
              <div key={child.key} style={{ padding: "8px 16px 8px 40px", fontSize: 13, color: child.key === activeChild ? tk.navTextActive : tk.navText, fontWeight: child.key === activeChild ? 600 : 400, cursor: "pointer", background: child.key === activeChild ? "rgba(15,98,254,.08)" : "transparent" }}
                onClick={() => { if (child.key === "analyzersList") setView("list"); else if (child.key === "profileLibrary") setView("library"); }}
                onMouseEnter={(e) => { if (child.key !== activeChild) e.currentTarget.style.background = tk.navHoverBg; }}
                onMouseLeave={(e) => { if (child.key !== activeChild) e.currentTarget.style.background = "transparent"; }}>
                {child.label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // ANALYZER LIST VIEW
  // ═══════════════════════════════════════════════════════════════
  const ListView = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 28px", background: tk.white, borderBottom: `1px solid ${tk.g100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, marginBottom: 4 }}><span style={{ color: tk.g500 }}>Admin</span><span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span><span>Analyzer Management</span></div>
          <div style={{ fontSize: 13, color: tk.g500 }}>{t("analyzer.list.subtitle")}</div>
        </div>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }} onClick={() => openAddModal(true)}>{t("analyzer.list.addAnalyzer")} +</button>
      </div>
      {/* Stats */}
      <div style={{ display: "flex", margin: "0 28px", borderBottom: `1px solid ${tk.g100}`, background: tk.white }}>
        {[[t("analyzer.list.totalAnalyzers"), ANALYZERS.length], [t("analyzer.list.active"), ANALYZERS.filter(a => a.status === "Active").length], [t("analyzer.list.inactive"), ANALYZERS.filter(a => a.status === "Inactive").length]].map(([label, val], i) => (
          <div key={i} style={{ flex: 1, padding: "16px 24px", borderRight: i < 2 ? `1px solid ${tk.g100}` : "none" }}>
            <div style={{ fontSize: 12, color: tk.g500, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: tk.g900 }}>{val}</div>
          </div>
        ))}
      </div>
      {/* Filters */}
      <div style={{ margin: "0 28px", background: tk.white }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
          <span style={{ color: tk.g400 }}>🔍</span>
          <input style={{ border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent" }} placeholder={t("analyzer.list.search")} />
        </div>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}`, display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.list.status")}</div>
            <select style={{ width: 160, padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}` }}><option>{t("analyzer.list.allStatuses")}</option><option>Setup</option><option>Active</option><option>Inactive</option></select>
          </div>
          <div>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.list.labUnitFilter")}</div>
            <select style={{ width: 200, padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}` }} value={listLabUnitFilter || ""} onChange={(e) => setListLabUnitFilter(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t("analyzer.list.allLabUnits")}</option>
              {LAB_UNITS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            {["col.name","col.profile","col.labUnits","col.testCodes","col.status","col.actions"].map(k => (
              <th key={k} style={{ textAlign: "left", padding: "10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>{t(`analyzer.list.${k}`)}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredAnalyzers.map((a, i) => {
              const prof = a.profileId ? PROFILES.find(p => p.id === a.profileId) : null;
              return (
                <tr key={a.id} style={{ background: i % 2 === 1 ? tk.g10 : tk.white }}>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: tk.g500 }}>{a.connection}</div>
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                    {prof ? <span style={{ fontSize: 12 }}>{prof.manufacturer} {prof.model}</span> : <span style={{ color: tk.g400, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                    {a.labUnits.length > 0 ? a.labUnits.map(id => { const u = LAB_UNITS.find(x => x.id === id); return u ? <Tag key={id}>{u.name}</Tag> : null; }) : <span style={{ color: tk.g400, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>{a.testCodes}</td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                    <span style={{ padding: "4px 12px", fontSize: 12, fontWeight: 500, background: a.status === "Active" ? tk.greenBg : a.status === "Inactive" ? tk.redBg : tk.g50, color: a.status === "Active" ? tk.green : a.status === "Inactive" ? tk.red : tk.g700 }}>{a.status}</span>
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                    <OverflowMenu items={[
                      { key: "fieldMappings", label: t("analyzer.action.fieldMappings") },
                      { key: "testConnection", label: t("analyzer.action.testConnection") },
                      { key: "exportProfile", label: t("analyzer.action.exportProfile") },
                      { key: "edit", label: t("analyzer.action.edit") },
                      { key: "delete", label: t("analyzer.action.delete"), danger: true },
                    ]} onSelect={(key) => {
                      if (key === "fieldMappings") openMappings(a);
                      else if (key === "delete") setShowDeleteModal(a);
                      else if (key === "edit") openAddModal(a);
                      else if (key === "exportProfile") setShowExportModal(a);
                    }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // FIELD MAPPINGS VIEW (carried from v2 — test codes, QC, sim, etc.)
  // ═══════════════════════════════════════════════════════════════
  const MappingsView = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 28px", background: tk.white, borderBottom: `1px solid ${tk.g100}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          <span style={{ cursor: "pointer", fontSize: 16 }} onClick={() => setView("list")}>←</span>
          <span style={{ color: tk.g500 }}>Admin</span>
          <span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span>
          <span style={{ cursor: "pointer" }} onClick={() => setView("list")}>Analyzer Management</span>
          <span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span>
          <span>{selectedAnalyzer?.name}</span>
          <span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span>
          <span>{activeTab === "testcodes" ? t("mapping.tab.testCodes") : activeTab === "qcrules" ? t("mapping.tab.qcRules") : activeTab === "simulator" ? t("mapping.tab.simulator") : activeTab === "extraction" ? t("mapping.tab.fieldExtraction") : activeTab === "advanced" ? t("mapping.tab.advanced") : activeTab === "preview" ? t("mapping.tab.preview") : activeTab}</span>
        </div>
      </div>
      {unmappedCount > 0 && <div style={{ margin: "0 28px", padding: "12px 16px", background: tk.yellowBg, borderLeft: `3px solid ${tk.yellow}`, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: tk.yellow, color: tk.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>!</div>
        <div><strong>{t("mapping.warning.required")}</strong></div>
      </div>}
      <div style={{ display: "flex", margin: "0 28px", borderBottom: `1px solid ${tk.g100}`, background: tk.white }}>
        {[[t("mapping.stat.totalMappings"), mappings.length], [t("mapping.stat.requiredMappings"), mappedCount], [t("mapping.stat.unmappedFields"), unmappedCount, unmappedCount > 0 ? tk.red : null]].map(([label, val, color], i) => (
          <div key={i} style={{ flex: 1, padding: "16px 24px", borderRight: i < 2 ? `1px solid ${tk.g100}` : "none" }}><div style={{ fontSize: 12, color: tk.g500, marginBottom: 4 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 300, color: color || tk.g900 }}>{val}</div></div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 28px" }}>
        <button style={{ padding: "10px 20px", fontSize: 13, background: queryState === "connecting" ? tk.g100 : tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: queryState === "connecting" ? "wait" : "pointer" }} disabled={queryState === "connecting"} onClick={runQueryAnalyzer}>{queryState === "connecting" ? "\u23f3 " + t("query.connecting") : t("mapping.btn.queryAnalyzer")}</button>
        <button style={{ padding: "10px 20px", fontSize: 13, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}>{t("mapping.btn.testMapping")}</button>
        <button style={{ padding: "10px 20px", fontSize: 13, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }}>{t("mapping.btn.saveMappings")}</button>
      </div>
      <div style={{ display: "flex", borderBottom: `2px solid ${tk.g100}`, margin: "0 28px", background: tk.white }}>
        {[["testcodes", t("mapping.tab.testCodes")], ["qcrules", t("mapping.tab.qcRules")], ["simulator", t("mapping.tab.simulator")], ["extraction", t("mapping.tab.fieldExtraction")], ["advanced", t("mapping.tab.advanced")], ...(previewData ? [["preview", t("mapping.tab.preview") + " \u2728"]] : [])].map(([key, label]) => (
          <button key={key} style={{ padding: "12px 20px", fontSize: 13, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? tk.blue : tk.g600, background: "transparent", border: "none", borderBottom: activeTab === key ? `2px solid ${tk.blue}` : "2px solid transparent", cursor: "pointer", marginBottom: -2 }} onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>
      <div style={{ margin: "0 28px", background: tk.white, flex: 1, overflowY: "auto" }}>
        {/* TEST CODES TAB */}
        {activeTab === "testcodes" && (
          <div style={{ display: "flex" }}>
            <div style={{ flex: "0 0 58%", borderRight: `1px solid ${tk.g100}` }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tk.g100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t("mapping.testCodes.title")}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[t("mapping.testCodes.bulkAdd"), t("mapping.testCodes.importCsv"), t("mapping.testCodes.autoMatch")].map((label, i) => (
                    <button key={i} style={{ padding: "4px 8px", fontSize: 12, background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontWeight: 500 }} onClick={() => i === 0 ? setShowBulkAdd(true) : i === 2 ? showToastMsg("Auto-match found 2 matches") : null}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 420 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>{["Field Name", "ASTM Ref", "Type", "Status"].map((h, i) => <th key={i} style={{ textAlign: "left", padding: "10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {mappings.map(m => (
                      <tr key={m.id} style={{ background: selectedField === m.id ? tk.blueBg : m.status === "unmapped" ? `${tk.redBg}44` : tk.white, cursor: "pointer" }} onClick={() => setSelectedField(m.id)}>
                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}><div style={{ fontWeight: 500 }}>{m.displayName || m.analyzerCode || "(new)"}</div><div style={{ fontSize: 11, color: tk.g500, fontFamily: tk.mono }}>{m.analyzerCode}</div></td>
                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 12 }}>{m.astmRef}</td>
                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12 }}>{m.type}</td>
                        <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}><span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: m.status === "mapped" ? tk.greenBg : m.status === "unmapped" ? tk.redBg : tk.yellowBg, color: tk.g700 }}>{m.status === "mapped" ? "✓ Mapped" : m.status === "draft" ? "Draft" : "Unmapped"}</span></td>
                      </tr>
                    ))}
                    <tr><td colSpan={4} style={{ padding: "10px 16px", textAlign: "center", borderBottom: `1px solid ${tk.g100}` }}><button style={{ background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }} onClick={addMapping}>+ {t("mapping.testCodes.addMapping")}</button></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* Right panel */}
            <div style={{ flex: 1 }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tk.g100}`, fontSize: 15, fontWeight: 600 }}>{t("mapping.summary.title")}</div>
              {!selectedField ? <div style={{ padding: 40, textAlign: "center", color: tk.g500, fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>↙</div>{t("mapping.summary.empty")}</div> : (() => {
                const m = mappings.find(x => x.id === selectedField); if (!m) return null;
                return (
                  <div style={{ padding: 20 }}>
                    <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.analyzerCode")}</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={m.analyzerCode} onChange={(e) => { updateMapping(m.id, "analyzerCode", e.target.value); updateMapping(m.id, "displayName", e.target.value); }} /></div>
                    <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.openelisTest")}</div>
                      {showInlineCreate === m.id ? (
                        <div style={{ border: `1px solid ${tk.blue}`, background: tk.blueBg, padding: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: tk.blue }}>+ {t("mapping.testCodes.createNewTest")}</div>
                          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Test Name *</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} autoFocus value={newTestForm.name} onChange={(e) => setNewTestForm(f => ({ ...f, name: e.target.value, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) }))} /></div>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Test Code</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={newTestForm.code} onChange={(e) => setNewTestForm(f => ({ ...f, code: e.target.value }))} /></div>
                          </div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><button style={{ padding: "8px 12px", fontSize: 13, background: "transparent", color: tk.blue, border: "none", cursor: "pointer" }} onClick={() => setShowInlineCreate(null)}>Cancel</button><button style={{ padding: "8px 16px", fontSize: 13, background: tk.blue, color: tk.white, border: "none", cursor: "pointer", opacity: newTestForm.name ? 1 : .4 }} disabled={!newTestForm.name} onClick={doCreateTest}>Create & Map</button></div>
                        </div>
                      ) : <TestComboBox value={m.oeTestId} onChange={(id) => updateMapping(m.id, "oeTestId", id)} onCreateNew={(search) => { setShowInlineCreate(m.id); setNewTestForm({ name: search || "", code: (search || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10), resultType: "NUMERIC", unit: "", sampleType: "Serum" }); }} />}
                    </div>
                    <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.transform")}</div><select style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={m.transform} onChange={(e) => updateMapping(m.id, "transform", e.target.value)}><option value="PASSTHROUGH">{t("transform.passThrough")}</option><option value="GREATER_LESS_FLAG">{t("transform.greaterLessFlag")}</option><option value="VALUE_MAP">{t("transform.valueMap")}</option><option value="THRESHOLD_CLASSIFY">{t("transform.thresholdClassify")}</option><option value="CODED_LOOKUP">{t("transform.codedLookup")}</option></select></div>
                    {/* Units row — only for NUMERIC tests */}
                    {(() => { const oeTest = m.oeTestId ? OE_TESTS.find(t => t.id === m.oeTestId) : null; return !oeTest || oeTest.resultType === "NUMERIC"; })() && (
                      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.analyzerUnit")}</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={m.unit} onChange={(e) => updateMapping(m.id, "unit", e.target.value)} /></div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.openelisUnit")}</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, background: tk.g50, boxSizing: "border-box" }} value={m.oeUnit} readOnly /></div>
                      </div>
                    )}

                    {/* ═══ SELECT LIST VALUE MAPPING ═══ */}
                    {(() => {
                      const oeTest = m.oeTestId ? OE_TESTS.find(t => t.id === m.oeTestId) : null;
                      if (!oeTest || oeTest.resultType !== "SELECT_LIST") return null;
                      const vm = m.valueMap || [];
                      return (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 600 }}>{t("mapping.summary.selectList")}</span>
                            <button style={{ fontSize: 11, background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontWeight: 500 }}
                              onClick={() => {
                                // Auto-map by name matching
                                const autoMapped = oeTest.options.map(opt => {
                                  const existing = vm.find(v => v.oeOptionId === opt.id);
                                  if (existing) return existing;
                                  return { analyzerValue: opt.value.toUpperCase(), oeOptionId: opt.id, oeOptionValue: opt.value };
                                });
                                updateMapping(m.id, "valueMap", autoMapped);
                                showToastMsg("Auto-mapped " + autoMapped.length + " values by name");
                              }}>
                              {t("mapping.summary.selectList.autoMap")}
                            </button>
                          </div>
                          <div style={{ fontSize: 11, color: tk.g500, marginBottom: 8 }}>{t("mapping.summary.selectList.description")}</div>
                          <div style={{ border: `1px solid ${tk.g200}` }}>
                            {/* Header */}
                            <div style={{ display: "flex", background: tk.g50, borderBottom: `1px solid ${tk.g200}` }}>
                              <div style={{ flex: 1, padding: "6px 10px", fontSize: 11, fontWeight: 600, borderRight: `1px solid ${tk.g200}` }}>{t("mapping.summary.selectList.analyzerValue")}</div>
                              <div style={{ width: 24, padding: "6px 4px", fontSize: 11, color: tk.g400, textAlign: "center" }}>→</div>
                              <div style={{ flex: 1, padding: "6px 10px", fontSize: 11, fontWeight: 600, borderLeft: `1px solid ${tk.g200}` }}>{t("mapping.summary.selectList.openelisOption")}</div>
                              <div style={{ width: 28 }}></div>
                            </div>
                            {/* Rows */}
                            {vm.map((row, ri) => (
                              <div key={ri} style={{ display: "flex", borderBottom: `1px solid ${tk.g100}`, alignItems: "center" }}>
                                <div style={{ flex: 1, borderRight: `1px solid ${tk.g200}` }}>
                                  <input style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "none", fontFamily: tk.mono, boxSizing: "border-box", background: "transparent" }}
                                    value={row.analyzerValue}
                                    placeholder="Analyzer sends..."
                                    onChange={(e) => {
                                      const newVm = [...vm]; newVm[ri] = { ...newVm[ri], analyzerValue: e.target.value };
                                      updateMapping(m.id, "valueMap", newVm);
                                    }} />
                                </div>
                                <div style={{ width: 24, textAlign: "center", fontSize: 11, color: tk.g400 }}>→</div>
                                <div style={{ flex: 1, borderLeft: `1px solid ${tk.g200}` }}>
                                  <select style={{ width: "100%", padding: "8px 10px", fontSize: 12, border: "none", boxSizing: "border-box", background: "transparent" }}
                                    value={row.oeOptionId || ""}
                                    onChange={(e) => {
                                      const opt = oeTest.options.find(o => o.id === e.target.value);
                                      const newVm = [...vm]; newVm[ri] = { ...newVm[ri], oeOptionId: e.target.value, oeOptionValue: opt?.value || "" };
                                      updateMapping(m.id, "valueMap", newVm);
                                    }}>
                                    <option value="">— {t("mapping.summary.selectList.unmapped")} —</option>
                                    {oeTest.options.map(opt => <option key={opt.id} value={opt.id}>{opt.value}</option>)}
                                  </select>
                                </div>
                                <div style={{ width: 28, textAlign: "center" }}>
                                  <button style={{ background: "transparent", border: "none", cursor: "pointer", color: tk.g400, fontSize: 14, lineHeight: 1 }}
                                    onClick={() => { const newVm = vm.filter((_, idx) => idx !== ri); updateMapping(m.id, "valueMap", newVm); }}>×</button>
                                </div>
                              </div>
                            ))}
                            {/* Add row */}
                            <div style={{ padding: "6px 10px", textAlign: "center" }}>
                              <button style={{ background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500 }}
                                onClick={() => updateMapping(m.id, "valueMap", [...vm, { analyzerValue: "", oeOptionId: "", oeOptionValue: "" }])}>
                                + {t("mapping.summary.selectList.addRow")}
                              </button>
                            </div>
                          </div>
                          {/* Default action */}
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 11, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.selectList.defaultAction")}</div>
                            <select style={{ padding: "6px 10px", fontSize: 12, border: `1px solid ${tk.g200}` }}
                              value={m.defaultAction || "REJECT"}
                              onChange={(e) => updateMapping(m.id, "defaultAction", e.target.value)}>
                              <option value="REJECT">Reject (flag as error)</option>
                              <option value="PASS_THROUGH">Pass-through (store raw value)</option>
                              <option value="DEFAULT_VALUE">Use default option</option>
                            </select>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}><button style={{ padding: "8px 12px", fontSize: 13, background: "transparent", color: tk.red, border: "none", cursor: "pointer", fontWeight: 500 }} onClick={() => { deleteMapping(m.id); setSelectedField(null); }}>Delete Mapping</button></div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        {/* QC RULES */}
        {activeTab === "qcrules" && <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{t("qc.title")}</div>
          <div style={{ fontSize: 13, color: tk.g500, marginBottom: 16 }}>{t("qc.description")}</div>
          {qcRules.map((rule, i) => (
            <div key={rule.id} style={{ border: `1px solid ${tk.g200}`, padding: 16, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Rule {i + 1}</span><button style={{ background: "transparent", color: tk.red, border: "none", cursor: "pointer", fontSize: 12 }} onClick={() => setQcRules(p => p.filter(r => r.id !== rule.id))}>Remove</button></div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Type</div><select style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={rule.type} onChange={(e) => setQcRules(p => p.map(r => r.id === rule.id ? { ...r, type: e.target.value } : r))}><option value="fieldEquals">Field Equals</option><option value="specimenIdPrefix">Specimen ID Prefix</option><option value="specimenIdRegex">Specimen ID Pattern</option><option value="fieldContains">Field Contains</option></select></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Field</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={rule.field} onChange={(e) => setQcRules(p => p.map(r => r.id === rule.id ? { ...r, field: e.target.value } : r))} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Value</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={rule.value} onChange={(e) => setQcRules(p => p.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))} /></div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button style={{ background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }} onClick={() => setQcRules(p => [...p, { id: `qc${Date.now()}`, type: "fieldEquals", field: "", value: "" }])}>+ {t("qc.addRule")}</button>
            <button style={{ padding: "8px 16px", fontSize: 13, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}>{t("qc.testRules")}</button>
          </div>
        </div>}
        {/* SIMULATOR */}
        {activeTab === "simulator" && <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{t("simulator.title")}</div>
          <textarea style={{ width: "100%", minHeight: 140, padding: 12, fontSize: 13, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, resize: "vertical", boxSizing: "border-box" }} value={simMessage} onChange={(e) => setSimMessage(e.target.value)} placeholder={"H|\\^&|||Indiko Plus^Thermo|||||||\nO|1|LAB-2025-001||^^^GLU\\^^^BUN|\nR|1|^^^GLU|95|mg/dL|70-100|N|F\nR|2|^^^BUN|14|mg/dL|7-20|N|F\nL|1|N"} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", margin: "12px 0" }}>
            <button style={{ background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 }} onClick={() => { setSimMessage(""); setSimResult(null); }}>{t("simulator.clear")}</button>
            <button style={{ padding: "10px 20px", fontSize: 13, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }} onClick={runSimulator}>{t("simulator.parse")} ▶</button>
          </div>
          {!simResult ? <div style={{ padding: 40, textAlign: "center", color: tk.g500, fontSize: 13 }}>{t("simulator.empty")}</div> : <div>
            <div style={{ padding: "12px 16px", background: simResult.warnings > 0 ? tk.yellowBg : tk.greenBg, borderLeft: `3px solid ${simResult.warnings > 0 ? tk.yellow : tk.green}`, marginBottom: 16, fontSize: 13 }}>{simResult.warnings > 0 ? `⚠ ${simResult.warnings} unmatched` : "✓ All matched"}</div>
            <div style={{ fontSize: 13, marginBottom: 12 }}><strong>Instrument:</strong> {simResult.instrument} · <strong>Specimen:</strong> {simResult.specimen}</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr>{["Analyzer Code","OpenELIS Test","Value","Units","Flag","Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>{h}</th>)}</tr></thead>
              <tbody>{simResult.results.map((r, i) => (
                <tr key={i} style={{ background: r.status === "unmatched" ? tk.yellowBg : tk.white }}>
                  <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontWeight: 600 }}>{r.testId}</td>
                  <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}>{r.oeName}</td>
                  <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono }}>{r.value}</td>
                  <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}>{r.units}</td>
                  <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}>{r.flag || "—"}</td>
                  <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}><span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: r.status === "matched" ? tk.greenBg : tk.redBg }}>{r.status === "matched" ? "✓" : "⚠"}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>}
        </div>}
        {/* FIELD EXTRACTION */}
        {activeTab === "extraction" && <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Advanced Field Extraction</div>
          <div style={{ padding: "10px 14px", background: tk.blueBg, borderLeft: `3px solid ${tk.blue}`, fontSize: 13, marginBottom: 20 }}>ℹ These defaults work for most ASTM analyzers. Only change if your instrument uses non-standard field positions.</div>
          {[["Specimen ID Field", "O.3"], ["Test ID Field", "R.3"], ["Test ID Component", "4"], ["Result Value Field", "R.4"], ["Result Units Field", "R.5"], ["Abnormal Flag Field", "R.7"], ["Result Status Field", "R.8"], ["Result Timestamp Field", "R.13"], ["Sender ID Field", "H.5"]].map(([label, dflt]) => (
            <div key={label} style={{ display: "flex", gap: 16, marginBottom: 12, alignItems: "center" }}><div style={{ width: 220, fontSize: 13, fontWeight: 500 }}>{label}</div><input style={{ flex: 1, padding: "8px 12px", fontSize: 13, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder={dflt} /></div>
          ))}
        </div>}
        {/* ADVANCED */}
        {activeTab === "advanced" && <div style={{ padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Connection Settings</div>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.connectionRole")}</div><select style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={connectionRole} onChange={(e) => setConnectionRole(e.target.value)}><option value="server">{t("analyzer.modal.serverMode")}</option><option value="client">{t("analyzer.modal.clientMode")}</option></select></div>
          {connectionRole === "server" ? <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.listenPort")}</div><input style={{ width: 160, padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}` }} placeholder="5000" /></div> : <div style={{ display: "flex", gap: 16, marginBottom: 16 }}><div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.ipAddress")}</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="192.168.1.10" /></div><div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.portNumber")}</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="5000" /></div></div>}
        {/* ═══ PREVIEW TAB ═══ */}
        {activeTab === "preview" && previewData && <div style={{ padding: 0 }}>
          {/* Query Analyzer Status Banner */}
          {queryState === "success" && queryDiscovered.length > 0 && (
            <div style={{ padding: "12px 24px", background: tk.greenBg, borderBottom: `1px solid ${tk.g100}`, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span style={{ fontSize: 16 }}>\u2705</span>
              <div><strong>{t("query.discovered").replace("{count}", queryDiscovered.length)}</strong> New codes: {queryDiscovered.map(c => <code key={c} style={{ fontFamily: tk.mono, padding: "1px 6px", background: tk.white, border: `1px solid ${tk.g100}`, marginLeft: 4, fontSize: 11, fontWeight: 600 }}>{c}</code>)}</div>
            </div>
          )}
          
          {/* Analyzer Info Header */}
          <div style={{ padding: "16px 24px", background: tk.g50, borderBottom: `1px solid ${tk.g100}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t("preview.title")}</div>
                <div style={{ fontSize: 12, color: tk.g500 }}>{t("preview.subtitle")}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, color: tk.g600 }}>
                <div>Received: {previewData.timestamp}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 16 }}>
              <div style={{ padding: "10px 16px", background: tk.white, border: `1px solid ${tk.g100}`, flex: 1 }}>
                <div style={{ fontSize: 11, color: tk.g500, marginBottom: 2 }}>Instrument</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{previewData.instrument}</div>
              </div>
              <div style={{ padding: "10px 16px", background: tk.white, border: `1px solid ${tk.g100}`, flex: 1 }}>
                <div style={{ fontSize: 11, color: tk.g500, marginBottom: 2 }}>{t("preview.specimen")}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: tk.mono }}>{previewData.specimen}</div>
              </div>
              <div style={{ padding: "10px 16px", background: tk.white, border: `1px solid ${tk.g100}`, flex: 1 }}>
                <div style={{ fontSize: 11, color: tk.g500, marginBottom: 2 }}>Patient</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{previewData.patientName}</div>
              </div>
              <div style={{ padding: "10px 16px", background: previewData.isQC ? tk.yellowBg : tk.greenBg, border: `1px solid ${previewData.isQC ? tk.yellow : tk.green}`, flex: 1 }}>
                <div style={{ fontSize: 11, color: tk.g500, marginBottom: 2 }}>{t("preview.qcClassification")}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: previewData.isQC ? tk.yellow : tk.green }}>
                  {previewData.isQC ? "\ud83e\uddea QC Sample" : "\u2705 Patient Sample"}
                </div>
              </div>
            </div>
          </div>

          {/* Results Table — mirrors Analyzer Import screen */}
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t("preview.resultsSummary")}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "6px 14px", fontSize: 12, background: tk.green, color: tk.white, border: "none", cursor: "pointer" }}>{t("preview.acceptAll")}</button>
                <button style={{ padding: "6px 14px", fontSize: 12, background: tk.white, color: tk.g600, border: `1px solid ${tk.g200}`, cursor: "pointer" }}>{t("preview.rejectAll")}</button>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, border: `1px solid ${tk.g200}` }}>
              <thead><tr>
                <th style={{ width: 32, padding: "8px 10px", background: tk.g50, borderBottom: `2px solid ${tk.g100}` }}></th>
                {["Test Name", "Analyzer Code", "Result", "Units", "Ref. Range", "Flag", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {previewData.results.map((r, i) => (
                  <tr key={i} style={{ background: r.status === "unmapped" ? `${tk.redBg}44` : r.status === "warning" ? `${tk.yellowBg}88` : tk.white }}>
                    <td style={{ padding: "8px 10px", borderBottom: `1px solid ${tk.g100}`, textAlign: "center" }}>
                      <div style={{ width: 16, height: 16, border: `2px solid ${r.accepted ? tk.green : tk.g300}`, background: r.accepted ? tk.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: tk.white, cursor: "pointer" }}>
                        {r.accepted ? "\u2713" : ""}
                      </div>
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontWeight: 500 }}>
                      {r.oeName}
                      {r.isSelectList && <span style={{ marginLeft: 6, padding: "1px 6px", fontSize: 9, fontWeight: 600, background: "#e8daff", color: "#6929c4", verticalAlign: "middle" }}>SELECT LIST</span>}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 12 }}>{r.testId}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}` }}>
                      {r.isSelectList ? (
                        <div>
                          <div style={{ fontWeight: 500, color: r.resolvedOption ? tk.green : tk.red }}>
                            {r.resolvedOption || r.rawValue}
                          </div>
                          {r.resolvedOption && <div style={{ fontSize: 10, color: tk.g500 }}>raw: "{r.rawValue}"</div>}
                        </div>
                      ) : (
                        <span style={{ fontFamily: tk.mono, fontWeight: r.flag === "HH" || r.flag === "LL" ? 700 : 400, color: r.flag === "HH" || r.flag === "LL" ? tk.red : r.flag === "H" || r.flag === "L" ? "#b28600" : tk.g800 }}>
                          {r.displayValue}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12 }}>{r.units || "\u2014"}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12, color: tk.g500 }}>{r.refRange || "\u2014"}</td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}` }}>
                      {r.flag ? (
                        <span style={{ padding: "2px 8px", fontSize: 11, fontWeight: 600, background: r.flag === "HH" || r.flag === "LL" ? tk.redBg : r.flag === "H" || r.flag === "L" ? tk.yellowBg : r.flag === "A" ? "#e8daff" : tk.g50, color: r.flag === "HH" || r.flag === "LL" ? tk.red : r.flag === "H" || r.flag === "L" ? "#b28600" : r.flag === "A" ? "#6929c4" : tk.g600 }}>
                          {r.flag}
                        </span>
                      ) : <span style={{ color: tk.g400 }}>\u2014</span>}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}` }}>
                      {r.status === "mapped" && <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: tk.greenBg, color: tk.green }}>\u2713 Mapped</span>}
                      {r.status === "unmapped" && <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: tk.redBg, color: tk.red }}>\u26a0 Unmapped</span>}
                      {r.status === "warning" && <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: tk.yellowBg, color: "#b28600" }}>\u26a0 Warning</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Parsing Log */}
          <div style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <span>\ud83d\udcdd</span> {t("preview.parsingLog")}
              <span style={{ fontWeight: 400, fontSize: 12, color: tk.g500 }}>{previewLog.length} entries</span>
            </div>
            <div style={{ background: tk.navBg, padding: "12px 16px", maxHeight: 220, overflowY: "auto", fontFamily: tk.mono, fontSize: 11, lineHeight: 1.8 }}>
              {previewLog.map((entry, i) => (
                <div key={i} style={{ color: entry.level === "WARN" ? "#fdd13a" : entry.level === "ERROR" ? "#ff8389" : "rgba(255,255,255,.7)" }}>
                  <span style={{ color: "rgba(255,255,255,.35)", marginRight: 8 }}>{entry.time}</span>
                  <span style={{ fontWeight: 600, marginRight: 8, color: entry.level === "WARN" ? "#fdd13a" : entry.level === "ERROR" ? "#ff8389" : "#42be65" }}>[{entry.level}]</span>
                  {entry.msg}
                </div>
              ))}
            </div>
          </div>
        </div>}
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, marginTop: 28 }}>Result Aggregation</div>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Aggregation Mode</div><select style={{ width: 300, padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}` }}><option>Per Message</option><option>By Specimen</option><option>By Session</option></select></div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, marginTop: 28 }}>Abnormal Flag Mapping</div>
          <table style={{ borderCollapse: "collapse", fontSize: 13, maxWidth: 400 }}>
            <thead><tr><th style={{ textAlign: "left", padding: "8px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>Analyzer Flag</th><th style={{ textAlign: "left", padding: "8px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>OpenELIS Interpretation</th></tr></thead>
            <tbody>{[["N","Normal"],["L","Low"],["H","High"],["LL","Critical Low"],["HH","Critical High"],["A","Abnormal"],["(empty)","Normal"]].map(([f,i]) => <tr key={f}><td style={{ padding: "8px 16px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontWeight: 600 }}>{f}</td><td style={{ padding: "8px 16px", borderBottom: `1px solid ${tk.g100}` }}>{i}</td></tr>)}</tbody>
          </table>
        </div>}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // PROFILE LIBRARY VIEW (FR-23)
  // ═══════════════════════════════════════════════════════════════
  const ProfileLibraryView = () => {
    const filtered = PROFILES.filter(p => {
      if (libSourceFilter && p.source !== libSourceFilter) return false;
      if (libPluginFilter && p.pluginType !== libPluginFilter) return false;
      if (libSearch && !p.name.toLowerCase().includes(libSearch.toLowerCase()) && !p.manufacturer.toLowerCase().includes(libSearch.toLowerCase()) && !p.model.toLowerCase().includes(libSearch.toLowerCase())) return false;
      return true;
    });
    const builtInTotal = PROFILES.filter(p => p.source === "BUILT_IN").length;
    const siteLibTotal = PROFILES.filter(p => p.source === "SITE_LIBRARY").length;
    const inUseTotal = PROFILES.filter(p => p.usedBy.length > 0).length;
    const pluginLabel = (pluginId) => { const pl = PLUGINS.find(p => p.id === pluginId); return pl ? pl.name : pluginId; };

    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 28px", background: tk.white, borderBottom: `1px solid ${tk.g100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              <span style={{ color: tk.g500 }}>Admin</span><span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span><span style={{ cursor: "pointer" }} onClick={() => setView("list")}>Analyzer Management</span><span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span><span>{t("profile.library.title")}</span>
            </div>
            <div style={{ fontSize: 13, color: tk.g500 }}>{t("profile.library.subtitle")}</div>
          </div>
          <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }} onClick={() => setShowImportModal(true)}>
            {t("profile.library.importProfile")} +
          </button>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", margin: "0 28px", borderBottom: `1px solid ${tk.g100}`, background: tk.white }}>
          {[[t("profile.library.totalProfiles"), PROFILES.length], [t("profile.library.builtInCount"), builtInTotal], [t("profile.library.siteLibCount"), siteLibTotal], [t("profile.library.inUseCount"), inUseTotal]].map(([label, val], i) => (
            <div key={i} style={{ flex: 1, padding: "16px 24px", borderRight: i < 3 ? `1px solid ${tk.g100}` : "none" }}>
              <div style={{ fontSize: 12, color: tk.g500, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 300, color: tk.g900 }}>{val}</div>
            </div>
          ))}
        </div>
        {/* Filters */}
        <div style={{ margin: "0 28px", background: tk.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
            <span style={{ color: tk.g400 }}>🔍</span>
            <input style={{ border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent" }} placeholder={t("profile.library.search")} value={libSearch} onChange={(e) => setLibSearch(e.target.value)} />
            {libSearch && <span style={{ cursor: "pointer", color: tk.g400, fontSize: 13 }} onClick={() => setLibSearch("")}>✕</span>}
          </div>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}`, display: "flex", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("profile.library.sourceFilter")}</div>
              <select style={{ width: 160, padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}` }} value={libSourceFilter} onChange={(e) => setLibSourceFilter(e.target.value)}>
                <option value="">{t("profile.library.allSources")}</option>
                <option value="BUILT_IN">Built-in</option>
                <option value="SITE_LIBRARY">Site Library</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("profile.library.pluginFilter")}</div>
              <select style={{ width: 200, padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}` }} value={libPluginFilter} onChange={(e) => setLibPluginFilter(e.target.value)}>
                <option value="">{t("profile.library.allPlugins")}</option>
                {PLUGINS.filter(p => p.installed).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr>
              <th style={{ width: 32, padding: "10px 8px 10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}` }}></th>
              {["col.name","col.source","col.plugin","col.testCodes","col.qcRules","col.usedBy","col.lastModified","col.actions"].map(k => (
                <th key={k} style={{ textAlign: "left", padding: "10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 12, whiteSpace: "nowrap" }}>{t(`profile.library.${k}`)}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((p, i) => {
                const inUse = p.usedBy.length;
                const usingNames = p.usedBy.map(aid => { const a = ANALYZERS.find(x => x.id === aid); return a ? a.name : aid; });
                const isExpanded = expandedProfileId === p.id;
                const qcTypeLabel = (type) => ({ fieldEquals: "Field Equals", specimenIdPrefix: "Specimen ID Prefix", specimenIdRegex: "Specimen ID Pattern", fieldContains: "Field Contains" }[type] || type);
                return (
                  <React.Fragment key={p.id}>
                  <tr style={{ background: isExpanded ? tk.blueBg : i % 2 === 1 ? tk.g10 : tk.white, cursor: "pointer" }}
                    onClick={() => setExpandedProfileId(isExpanded ? null : p.id)}>
                    <td style={{ padding: "12px 8px 12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}`, verticalAlign: "top" }}>
                      <span style={{ fontSize: 12, color: tk.g500, display: "inline-block", transform: isExpanded ? "rotate(90deg)" : "rotate(0)", transition: "transform .15s" }}>▶</span>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}`, maxWidth: 280 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: tk.g500 }}>{p.manufacturer} {p.model} · v{p.version}</div>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}` }}>
                      <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: p.source === "BUILT_IN" ? tk.blueBg : tk.greenBg, color: p.source === "BUILT_IN" ? tk.blue : tk.green }}>
                        {p.source === "BUILT_IN" ? "Built-in" : "Site Library"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}`, fontSize: 12, color: tk.g700 }}>{pluginLabel(p.pluginType)}</td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}`, fontWeight: 500 }}>{p.testCount}</td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}` }}>{p.qcRules}</td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}` }}>
                      {inUse > 0 ? (
                        <span title={usingNames.join(", ")} style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: tk.greenBg, color: tk.green, cursor: "default" }}>
                          {inUse} analyzer{inUse > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: tk.g400 }}>{t("profile.library.noneAnalyzers")}</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}` }}>
                      <div style={{ fontSize: 12 }}>{p.lastModified}</div>
                      <div style={{ fontSize: 11, color: tk.g500 }}>{p.modifiedBy}</div>
                    </td>
                    <td style={{ padding: "12px 16px", borderBottom: isExpanded ? "none" : `1px solid ${tk.g100}` }} onClick={(e) => e.stopPropagation()}>
                      <OverflowMenu items={[
                        { key: "clone", label: t("profile.library.action.clone") },
                        ...(p.source === "SITE_LIBRARY" ? [{ key: "edit", label: t("profile.library.action.edit") }] : []),
                        { key: "export", label: t("profile.library.action.export") },
                        ...(p.source === "SITE_LIBRARY" ? [{ key: "delete", label: t("profile.library.action.delete"), danger: true }] : []),
                      ]} onSelect={(key) => {
                        if (key === "clone") { setCloneName(`${p.name} (Copy)`); setShowCloneModal(p); }
                        else if (key === "edit") { setEditForm({ name: p.name, description: p.description, tags: "" }); setShowEditProfileModal(p); }
                        else if (key === "export") setShowExportModal(p);
                        else if (key === "delete") setShowDeleteProfileModal(p);
                      }} />
                    </td>
                  </tr>

                  {/* ═══ EXPANDED DETAIL ROW ═══ */}
                  {isExpanded && (
                    <tr style={{ background: tk.g10 }}>
                      <td colSpan={9} style={{ padding: "0 16px 20px 48px", borderBottom: `1px solid ${tk.g100}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 4 }}>

                          {/* ── LEFT: QC RULES ── */}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: tk.g800, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 14 }}>🔬</span> {t("profile.library.detail.qcRules")}
                              <span style={{ fontWeight: 400, fontSize: 11, color: tk.g500, marginLeft: "auto" }}>
                                {p.qcRulesDetail?.length || 0} rule{(p.qcRulesDetail?.length || 0) !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: tk.g500, marginBottom: 8, fontStyle: "italic" }}>{t("profile.library.detail.qcRules.description")}</div>
                            {(p.qcRulesDetail || []).map((rule, ri) => (
                              <div key={ri} style={{ padding: "10px 14px", marginBottom: 6, background: tk.white, border: `1px solid ${tk.g100}`, fontSize: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 600, background: rule.type === "fieldEquals" ? "#e8daff" : rule.type === "specimenIdPrefix" ? tk.blueBg : rule.type === "specimenIdRegex" ? "#fff1de" : "#d4edda", color: rule.type === "fieldEquals" ? "#6929c4" : rule.type === "specimenIdPrefix" ? tk.blue : rule.type === "specimenIdRegex" ? "#b28600" : "#198038", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    {qcTypeLabel(rule.type)}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                                  <code style={{ fontFamily: tk.mono, fontSize: 12, fontWeight: 600, color: tk.g800, background: tk.g50, padding: "1px 6px" }}>{rule.field}</code>
                                  <span style={{ color: tk.g500 }}>{rule.type === "specimenIdPrefix" ? "starts with" : rule.type === "specimenIdRegex" ? "matches" : rule.type === "fieldContains" ? "contains" : "="}</span>
                                  <code style={{ fontFamily: tk.mono, fontSize: 12, fontWeight: 600, color: tk.blue, background: tk.blueBg, padding: "1px 6px" }}>{rule.value}</code>
                                </div>
                                {rule.note && <div style={{ fontSize: 11, color: tk.g500, marginTop: 4, fontStyle: "italic" }}>{rule.note}</div>}
                              </div>
                            ))}

                            {/* Abnormal Flags */}
                            {p.abnormalFlags && Object.keys(p.abnormalFlags).length > 0 && (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: tk.g800, display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>🚩</span> {t("profile.library.detail.abnormalFlags")}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {Object.entries(p.abnormalFlags).map(([flag, interp]) => (
                                    <span key={flag} style={{ padding: "3px 8px", fontSize: 11, fontWeight: 500, background: flag.includes("H") ? "#fff1f1" : flag.includes("L") ? "#e5f6ff" : tk.g50, color: flag.includes("H") ? "#da1e28" : flag.includes("L") ? "#0043ce" : tk.g700, border: `1px solid ${flag.includes("H") ? "#ffcfcf" : flag.includes("L") ? "#b8d9f5" : tk.g100}` }}>
                                      <code style={{ fontFamily: tk.mono }}>{flag}</code> → {interp}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Aggregation */}
                            {p.aggregation && (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: tk.g800, display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>📦</span> {t("profile.library.detail.aggregation")}
                                </div>
                                <div style={{ fontSize: 12, color: tk.g700, padding: "6px 10px", background: tk.white, border: `1px solid ${tk.g100}`, display: "inline-flex", gap: 8 }}>
                                  <span style={{ fontWeight: 500 }}>{p.aggregation.mode.replace(/_/g, " ")}</span>
                                  {p.aggregation.windowSeconds && <span style={{ color: tk.g500 }}>· {p.aggregation.windowSeconds}s window</span>}
                                </div>
                              </div>
                            )}

                            {/* Extraction overrides */}
                            {p.extractionOverrides ? (
                              <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: tk.g800, display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 14 }}>⚙</span> {t("profile.library.detail.extractionOverrides")}
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {Object.entries(p.extractionOverrides).map(([field, desc]) => (
                                    <span key={field} style={{ padding: "3px 8px", fontSize: 11, background: "#fff8e1", border: "1px solid #ffe082", color: tk.g800 }}>
                                      <code style={{ fontFamily: tk.mono, fontWeight: 600 }}>{field}</code> = {desc}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {/* ── RIGHT: TEST CODE MAPPINGS ── */}
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: tk.g800, display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 14 }}>🧪</span> {t("profile.library.detail.testCodes")}
                              <span style={{ fontWeight: 400, fontSize: 11, color: tk.g500, marginLeft: "auto" }}>
                                {t("profile.library.detail.testCodes.showing").replace("{shown}", (p.sampleTestCodes || []).length).replace("{total}", p.testCount)}
                              </span>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, background: tk.white, border: `1px solid ${tk.g100}` }}>
                              <thead><tr>
                                <th style={{ padding: "6px 10px", textAlign: "left", background: tk.g50, borderBottom: `1px solid ${tk.g100}`, fontWeight: 600, whiteSpace: "nowrap" }}>Code</th>
                                <th style={{ padding: "6px 10px", textAlign: "left", background: tk.g50, borderBottom: `1px solid ${tk.g100}`, fontWeight: 600 }}>Test Name</th>
                                <th style={{ padding: "6px 10px", textAlign: "left", background: tk.g50, borderBottom: `1px solid ${tk.g100}`, fontWeight: 600 }}>Type</th>
                                <th style={{ padding: "6px 10px", textAlign: "left", background: tk.g50, borderBottom: `1px solid ${tk.g100}`, fontWeight: 600 }}>Unit</th>
                                <th style={{ padding: "6px 10px", textAlign: "left", background: tk.g50, borderBottom: `1px solid ${tk.g100}`, fontWeight: 600 }}>Transform</th>
                              </tr></thead>
                              <tbody>
                                {(p.sampleTestCodes || []).map((tc, tci) => (
                                  <tr key={tci} style={{ background: tci % 2 === 1 ? tk.g10 : "transparent" }}>
                                    <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                                      <code style={{ fontFamily: tk.mono, fontSize: 11, fontWeight: 600, color: tk.g800 }}>{tc.code}</code>
                                    </td>
                                    <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, fontWeight: 500 }}>{tc.name}</td>
                                    <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, color: tk.g600 }}>{tc.resultType}</td>
                                    <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, color: tk.g600 }}>{tc.unit || "—"}</td>
                                    <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                                      {tc.transform === "Pass-through" ? (
                                        <span style={{ color: tk.g400 }}>—</span>
                                      ) : (
                                        <span style={{ padding: "1px 6px", fontSize: 10, fontWeight: 500, background: tc.transform.startsWith("Threshold") ? "#fff1de" : tc.transform.startsWith("Coded") ? "#e8daff" : tc.transform.startsWith("Value Map") ? "#d4edda" : tk.blueBg, color: tc.transform.startsWith("Threshold") ? "#b28600" : tc.transform.startsWith("Coded") ? "#6929c4" : tc.transform.startsWith("Value Map") ? "#198038" : tk.blue }}>
                                          {tc.transform}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {p.testCount > (p.sampleTestCodes || []).length && (
                              <div style={{ padding: "6px 10px", fontSize: 11, color: tk.g500, fontStyle: "italic", background: tk.white, borderTop: "none", border: `1px solid ${tk.g100}`, borderTop: "none" }}>
                                + {p.testCount - (p.sampleTestCodes || []).length} more test codes not shown in preview. Full mappings available when profile is applied to an analyzer.
                              </div>
                            )}

                            {/* Profile description */}
                            <div style={{ marginTop: 16, padding: "12px 14px", background: tk.white, border: `1px solid ${tk.g100}`, fontSize: 12 }}>
                              <div style={{ fontWeight: 600, marginBottom: 4, color: tk.g800 }}>Description</div>
                              <div style={{ color: tk.g600, lineHeight: 1.5 }}>{p.description}</div>
                              <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: tk.g500 }}>
                                <span>Author: {p.author}</span>
                                <span>·</span>
                                <span>Version: v{p.version}</span>
                                <span>·</span>
                                <span>Protocol: {p.protocol}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: tk.g500, borderBottom: `1px solid ${tk.g100}` }}>
                  No profiles match your filters. Try broadening your search or <span style={{ color: tk.blue, cursor: "pointer", fontWeight: 500 }} onClick={() => setShowImportModal(true)}>import a profile</span>.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MODALS
  // ═══════════════════════════════════════════════════════════════
  const Modal = ({ title, onClose, children, footer, wide }) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(22,22,22,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: tk.white, width: wide ? 640 : 560, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div><button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: tk.g600 }} onClick={onClose}>✕</button></div>
        <div style={{ padding: "0 24px 24px", flex: 1, overflowY: "auto" }}>{children}</div>
        <div style={{ display: "flex" }}>{footer}</div>
      </div>
    </div>
  );
  const FooterBtn = ({ label, onClick, kind = "primary" }) => <button style={{ flex: 1, padding: "16px 24px", fontSize: 14, fontWeight: 500, background: kind === "cancel" ? tk.g700 : kind === "danger" ? tk.red : tk.blue, color: tk.white, border: "none", cursor: "pointer", textAlign: "left" }} onClick={onClick}>{label}</button>;

  return (
    <div style={{ display: "flex", fontFamily: tk.font, fontSize: 14, color: tk.g900, minHeight: "100vh", background: tk.g50 }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ background: tk.headerBg, height: 48, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 20px", gap: 16 }}>
          {["🔍","🔔","👤"].map((ic,i) => <span key={i} style={{ color: tk.g300, cursor: "pointer", fontSize: 16 }}>{ic}</span>)}
        </div>
        {view === "list" ? <ListView /> : view === "library" ? <ProfileLibraryView /> : <MappingsView />}
      </div>

      {/* ── ADD/EDIT ANALYZER MODAL (FR-24) ── */}
      {showAddModal && (
        <Modal wide title={typeof showAddModal === "object" ? t("analyzer.modal.editTitle") : t("analyzer.modal.addTitle")} onClose={() => setShowAddModal(false)}
          footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowAddModal(false)} /><FooterBtn label={t("analyzer.modal.save")} onClick={() => { setShowAddModal(false); showToastMsg(selectedProfile ? `Analyzer saved — profile "${selectedProfile.name}" will be applied` : "Analyzer saved"); }} /></>}>
          
          {/* 1. ANALYZER NAME */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.name")} *</div>
            <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder={t("analyzer.modal.namePlaceholder")} defaultValue={typeof showAddModal === "object" ? showAddModal.name : ""} />
          </div>

          {/* 2. PLUGIN TYPE — determines protocol + filters profiles */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.pluginType")} *</div>
            <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={modalPluginType} onChange={(e) => onPluginChange(e.target.value)}>
              <option value="">{t("analyzer.modal.pluginType.placeholder")}</option>
              {PLUGINS.filter(p => p.installed).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {PLUGINS.filter(p => !p.installed).map(p => (
                <option key={p.id} value={p.id} disabled>🔒 {p.name} (not installed)</option>
              ))}
            </select>
            {selectedPlugin && (
              <div style={{ fontSize: 11, color: tk.g500, marginTop: 4, display: "flex", gap: 12 }}>
                <span><strong>Protocol:</strong> {selectedPlugin.protocol}</span>
                <span style={{ color: tk.g300 }}>·</span>
                <span>{selectedPlugin.description}</span>
              </div>
            )}
            {!modalPluginType && <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>{t("analyzer.modal.pluginType.help")}</div>}
          </div>

          {/* 3. ANALYZER PROFILE — filtered by plugin type */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.profile")}</div>
            <ProfileSelector value={modalProfile} onChange={onProfileChange} onImportFile={() => showToastMsg("File picker opened (simulated)")} profiles={filteredProfiles} />
            {!modalPluginType && <div style={{ fontSize: 11, color: tk.yellow, marginTop: 4 }}>Select a plugin type first to see matching profiles.</div>}
            {modalPluginType && filteredProfiles.length === 0 && <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>No profiles available for this plugin type. Use "Import from File" or start from scratch.</div>}
            {selectedProfile && (
              <div style={{ marginTop: 8, padding: "12px 16px", background: tk.blueBg, borderLeft: `3px solid ${tk.blue}`, fontSize: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, color: tk.blue }}>{t("analyzer.modal.profile.info")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", color: tk.g700 }}>
                  <span style={{ fontWeight: 500 }}>Manufacturer:</span><span>{selectedProfile.manufacturer}</span>
                  <span style={{ fontWeight: 500 }}>Model:</span><span>{selectedProfile.model}</span>
                  <span style={{ fontWeight: 500 }}>Protocol:</span><span>{selectedProfile.protocol}</span>
                  <span style={{ fontWeight: 500 }}>Test Codes:</span><span>{selectedProfile.testCount}</span>
                  <span style={{ fontWeight: 500 }}>QC Rules:</span><span>{selectedProfile.qcRules}</span>
                  <span style={{ fontWeight: 500 }}>Version:</span><span>v{selectedProfile.version} by {selectedProfile.author}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: tk.g500, fontStyle: "italic" }}>{selectedProfile.description}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: tk.blue, fontWeight: 500 }}>{t("analyzer.modal.profile.applied")}</div>
              </div>
            )}
          </div>

          {/* 4. LAB UNITS */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.labUnits")}</div>
            <LabUnitMultiSelect selected={modalLabUnits} onChange={setModalLabUnits} />
            <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>{t("analyzer.modal.labUnits.help")}</div>
          </div>

          {/* 5. STATUS */}
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.status")}</div><select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}><option>Setup</option><option>Active</option><option>Inactive</option><option>Validation</option></select></div>

          {/* 6. PROTOCOL (read-only, derived from plugin) */}
          {selectedPlugin && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.protocolVersion")}</div>
              <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", background: tk.g50, color: tk.g600 }} value={selectedPlugin.protocol} readOnly />
            </div>
          )}

          {/* 7a. TCP CONNECTION — for ASTM and HL7 plugins */}
          {(modalPluginType === "generic-astm" || modalPluginType === "generic-hl7") && (<>
            <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: tk.g800 }}>TCP Connection Settings</div>
            </div>
            <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.connectionRole")}</div><select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={connectionRole} onChange={(e) => setConnectionRole(e.target.value)}><option value="server">{t("analyzer.modal.serverMode")}</option><option value="client">{t("analyzer.modal.clientMode")}</option></select></div>
            {connectionRole === "server" ? (
              <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.listenPort")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="5000" defaultValue={selectedProfile?.defaultPort || ""} /></div>
            ) : (
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.ipAddress")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="192.168.1.10" /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.portNumber")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="5000" defaultValue={selectedProfile?.defaultPort || ""} /></div>
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.connectionTimeout")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="30" defaultValue="30" /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.retryCount")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="6" defaultValue="6" /></div>
            </div>
            <button style={{ padding: "10px 20px", fontSize: 13, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}>{t("analyzer.modal.testConnection")}</button>
          </>)}

          {/* 7b. FLAT FILE CONFIGURATION — for Flat File Import plugin */}
          {modalPluginType === "flat-file" && (<>
            <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: tk.g800 }}>{t("analyzer.modal.flatFile.title")}</div>
              <div style={{ fontSize: 12, color: tk.g500, marginBottom: 12 }}>Configure the file watcher to monitor a folder for incoming result files.</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.flatFile.watchPath")} *</div>
              <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder={t("analyzer.modal.flatFile.watchPath.placeholder")} />
              <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>{t("analyzer.modal.flatFile.watchPath.help")}</div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.flatFile.filePattern")} *</div>
                <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder={t("analyzer.modal.flatFile.filePattern.placeholder")} defaultValue="*.csv" />
                <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>{t("analyzer.modal.flatFile.filePattern.help")}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.flatFile.delimiter")}</div>
                <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}>
                  <option value=",">Comma (,)</option><option value="\t">Tab (⇥)</option><option value=";">Semicolon (;)</option><option value="|">Pipe (|)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.flatFile.encoding")}</div>
                <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}>
                  <option>UTF-8</option><option>ISO-8859-1</option><option>Windows-1252</option><option>US-ASCII</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.flatFile.pollInterval")}</div>
                <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} type="number" min="5" max="3600" defaultValue="30" />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: tk.blue, cursor: "pointer", position: "relative" }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: tk.white, position: "absolute", top: 2, right: 2, boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
              </div>
              <div style={{ fontSize: 13 }}>{t("analyzer.modal.flatFile.hasHeader")}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.flatFile.archivePath")}</div>
              <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder={t("analyzer.modal.flatFile.archivePath.placeholder")} />
              <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>{t("analyzer.modal.flatFile.archivePath.help")}</div>
            </div>
            <div style={{ padding: "10px 14px", background: tk.yellowBg, borderLeft: `3px solid ${tk.yellow}`, fontSize: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontWeight: 700, flexShrink: 0 }}>⚠</span>
              <span>Ensure the OpenELIS service account has read/write access to both the watch folder and archive folder. For network shares, mount the share on the server and use the local mount path.</span>
            </div>
          </>)}
        </Modal>
      )}

      {/* DELETE MODAL */}
      {showDeleteModal && <Modal title={t("delete.title")} onClose={() => setShowDeleteModal(null)} footer={<><FooterBtn label={t("delete.cancel")} kind="cancel" onClick={() => setShowDeleteModal(null)} /><FooterBtn label={t("delete.delete")} kind="danger" onClick={() => { setShowDeleteModal(null); showToastMsg("Analyzer deleted"); }} /></>}><p style={{ fontSize: 14, color: tk.g700, lineHeight: 1.5 }}>{t("delete.confirm").replace("{name}", showDeleteModal.name)}</p></Modal>}

      {/* EXPORT PROFILE MODAL (FR-22.4) */}
      {showExportModal && (
        <Modal title={t("export.title")} onClose={() => setShowExportModal(null)} footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowExportModal(null)} /><FooterBtn label={t("export.download")} onClick={() => { setShowExportModal(null); showToastMsg("Profile downloaded as JSON"); }} /></>}>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("export.profileName")} *</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue={`${showExportModal.name} Profile`} /></div>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("export.description")}</div><textarea style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", minHeight: 60, resize: "vertical" }} placeholder="Describe what this profile includes..." /></div>
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("export.author")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="Your name" /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("export.tags")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="chemistry, ASTM" /></div>
          </div>
          <div style={{ padding: "10px 14px", background: tk.g50, borderLeft: `3px solid ${tk.g200}`, fontSize: 12, color: tk.g600 }}>
            The exported profile will include: test code mappings, QC rules, value transformations, field extraction config, and abnormal flag mappings. Site-specific data (name, IP, test ID bindings) will be stripped.
          </div>
        </Modal>
      )}

      {/* BULK ADD MODAL */}
      {showBulkAdd && <Modal title={t("mapping.testCodes.bulkAdd")} onClose={() => setShowBulkAdd(false)} footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowBulkAdd(false)} /><FooterBtn label="Add Codes" onClick={doBulkAdd} /></>}>
        <div style={{ fontSize: 13, color: tk.g600, marginBottom: 8 }}>Paste analyzer test codes (one per line):</div>
        <textarea style={{ width: "100%", minHeight: 140, padding: 12, fontSize: 13, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, resize: "vertical", boxSizing: "border-box" }} placeholder={"GLU\nBUN\nCREA\nAST\nALT"} value={bulkText} onChange={(e) => setBulkText(e.target.value)} autoFocus />
        {bulkText.trim() && <div style={{ marginTop: 8, fontSize: 12, color: tk.g600 }}>{bulkText.split("\n").filter(l => l.trim()).length} codes will be added.</div>}
      </Modal>}

      {/* ── CLONE PROFILE MODAL ── */}
      {showCloneModal && (
        <Modal wide title={t("profile.library.clone.title")} onClose={() => setShowCloneModal(null)}
          footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowCloneModal(null)} /><FooterBtn label={t("profile.library.clone.save")} onClick={() => { setShowCloneModal(null); showToastMsg(`Profile cloned as "${cloneName}"`); }} /></>}>
          <div style={{ padding: "10px 14px", background: tk.blueBg, borderLeft: `3px solid ${tk.blue}`, fontSize: 13, marginBottom: 16 }}>
            ℹ {t("profile.library.clone.info")}
          </div>
          <div style={{ padding: "12px 16px", background: tk.g50, marginBottom: 16, fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Cloning from:</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", color: tk.g700 }}>
              <span style={{ fontWeight: 500 }}>Name:</span><span>{showCloneModal.name}</span>
              <span style={{ fontWeight: 500 }}>Source:</span><span>{showCloneModal.source === "BUILT_IN" ? "Built-in" : "Site Library"}</span>
              <span style={{ fontWeight: 500 }}>Plugin:</span><span>{PLUGINS.find(p => p.id === showCloneModal.pluginType)?.name}</span>
              <span style={{ fontWeight: 500 }}>Test Codes:</span><span>{showCloneModal.testCount}</span>
              <span style={{ fontWeight: 500 }}>QC Rules:</span><span>{showCloneModal.qcRulesDetail?.length || 0}</span>
            </div>
            {/* QC rules preview */}
            {showCloneModal.qcRulesDetail?.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${tk.g100}` }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>QC Rules included:</div>
                {showCloneModal.qcRulesDetail.map((rule, ri) => (
                  <div key={ri} style={{ fontSize: 11, color: tk.g600, display: "flex", gap: 6, marginBottom: 2, alignItems: "center" }}>
                    <span style={{ color: tk.g400 }}>•</span>
                    <code style={{ fontFamily: tk.mono, fontWeight: 500 }}>{rule.field} {rule.type === "specimenIdPrefix" ? "starts with" : rule.type === "specimenIdRegex" ? "matches" : rule.type === "fieldContains" ? "contains" : "="} "{rule.value}"</code>
                  </div>
                ))}
              </div>
            )}
            {/* Sample test codes preview */}
            {showCloneModal.sampleTestCodes?.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${tk.g100}` }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Sample test codes:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {showCloneModal.sampleTestCodes.slice(0, 8).map((tc, tci) => (
                    <span key={tci} style={{ padding: "2px 6px", fontSize: 10, background: tk.white, border: `1px solid ${tk.g100}`, fontFamily: tk.mono }}>{tc.code}</span>
                  ))}
                  {showCloneModal.testCount > 8 && <span style={{ padding: "2px 6px", fontSize: 10, color: tk.g500 }}>+{showCloneModal.testCount - 8} more</span>}
                </div>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("profile.library.clone.newName")} *</div>
            <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={cloneName} onChange={(e) => setCloneName(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Description</div>
            <textarea style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", minHeight: 60, resize: "vertical" }} defaultValue={showCloneModal.description} />
          </div>
        </Modal>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {showEditProfileModal && (() => {
        const inUse = showEditProfileModal.usedBy.length;
        const usingNames = showEditProfileModal.usedBy.map(aid => { const a = ANALYZERS.find(x => x.id === aid); return a ? a.name : aid; });
        return (
          <Modal wide title={t("profile.library.edit.title")} onClose={() => setShowEditProfileModal(null)}
            footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowEditProfileModal(null)} /><FooterBtn label={t("profile.library.edit.save")} onClick={() => { setShowEditProfileModal(null); showToastMsg(`Profile "${editForm.name}" updated`); }} /></>}>
            {/* IN-USE WARNING */}
            {inUse > 0 && (
              <div style={{ padding: "12px 16px", background: tk.yellowBg, borderLeft: `3px solid ${tk.yellow}`, fontSize: 13, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1, flexShrink: 0, color: tk.yellow }}>⚠</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("profile.library.edit.inUseWarning").replace("{count}", inUse)}</div>
                  <div style={{ fontSize: 12, color: tk.g600 }}>Currently used by: {usingNames.join(", ")}</div>
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Profile Name *</div>
              <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Manufacturer</div>
                <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue={showEditProfileModal.manufacturer} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Model</div>
                <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue={showEditProfileModal.model} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Description</div>
              <textarea style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", minHeight: 70, resize: "vertical" }} value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Version</div>
                <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue={showEditProfileModal.version} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Tags (comma-separated)</div>
                <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={editForm.tags} onChange={(e) => setEditForm(f => ({ ...f, tags: e.target.value }))} placeholder="chemistry, ASTM, custom" />
              </div>
            </div>
            <div style={{ padding: "12px 16px", background: tk.g50, fontSize: 12, color: tk.g600 }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", marginBottom: 10 }}>
                <span style={{ fontWeight: 500 }}>Plugin Type:</span><span>{PLUGINS.find(p => p.id === showEditProfileModal.pluginType)?.name} (read-only)</span>
                <span style={{ fontWeight: 500 }}>Protocol:</span><span>{showEditProfileModal.protocol} (read-only)</span>
                <span style={{ fontWeight: 500 }}>Test Codes:</span><span>{showEditProfileModal.testCount} (edit via Field Mappings after applying to an analyzer)</span>
                <span style={{ fontWeight: 500 }}>QC Rules:</span><span>{showEditProfileModal.qcRulesDetail?.length || 0} rules configured</span>
                <span style={{ fontWeight: 500 }}>Aggregation:</span><span>{showEditProfileModal.aggregation?.mode?.replace(/_/g, " ") || "N/A"}{showEditProfileModal.aggregation?.windowSeconds ? ` (${showEditProfileModal.aggregation.windowSeconds}s window)` : ""}</span>
              </div>
              {/* Inline QC rules summary */}
              {showEditProfileModal.qcRulesDetail?.length > 0 && (
                <div style={{ paddingTop: 8, borderTop: `1px solid ${tk.g100}` }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: tk.g700 }}>QC Rules (OR logic):</div>
                  {showEditProfileModal.qcRulesDetail.map((rule, ri) => (
                    <div key={ri} style={{ fontSize: 11, color: tk.g600, display: "flex", gap: 4, marginBottom: 2 }}>
                      <span style={{ color: tk.g400 }}>•</span>
                      <code style={{ fontFamily: tk.mono }}>{rule.field} {rule.type === "specimenIdPrefix" ? "starts with" : rule.type === "specimenIdRegex" ? "matches" : rule.type === "fieldContains" ? "contains" : "="} "{rule.value}"</code>
                      <span style={{ fontStyle: "italic", color: tk.g400 }}>— {rule.note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* ── DELETE PROFILE MODAL ── */}
      {showDeleteProfileModal && (() => {
        const inUse = showDeleteProfileModal.usedBy.length;
        const usingNames = showDeleteProfileModal.usedBy.map(aid => { const a = ANALYZERS.find(x => x.id === aid); return a ? a.name : aid; });
        const blocked = inUse > 0;
        return (
          <Modal title={t("profile.library.delete.title")} onClose={() => setShowDeleteProfileModal(null)}
            footer={<>
              <FooterBtn label={t("delete.cancel")} kind="cancel" onClick={() => setShowDeleteProfileModal(null)} />
              {!blocked && <FooterBtn label={t("delete.delete")} kind="danger" onClick={() => { setShowDeleteProfileModal(null); showToastMsg(`Profile "${showDeleteProfileModal.name}" deleted`); }} />}
            </>}>
            {blocked ? (
              <div style={{ padding: "16px", background: tk.redBg, borderLeft: `3px solid ${tk.red}`, fontSize: 13, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1, flexShrink: 0, color: tk.red }}>✕</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{t("profile.library.delete.inUseBlock").replace("{count}", inUse)}</div>
                  <div style={{ fontSize: 12, color: tk.g600, marginTop: 6 }}>Currently used by:</div>
                  <div style={{ marginTop: 4 }}>{usingNames.map((name, i) => <Tag key={i}>{name}</Tag>)}</div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: tk.g700, lineHeight: 1.5 }}>
                {t("profile.library.delete.confirm").replace("{name}", showDeleteProfileModal.name)}
              </p>
            )}
          </Modal>
        );
      })()}

      {/* ── IMPORT PROFILE MODAL ── */}
      {showImportModal && (
        <Modal wide title={t("profile.library.import.title")} onClose={() => setShowImportModal(false)}
          footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowImportModal(false)} /><FooterBtn label={t("profile.library.import.save")} onClick={() => { setShowImportModal(false); showToastMsg("Profile imported to site library"); }} /></>}>
          {/* Drop zone */}
          <div style={{ border: `2px dashed ${tk.g200}`, padding: "40px 24px", textAlign: "center", marginBottom: 20, cursor: "pointer", background: tk.g10, transition: "all .15s" }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = tk.blue; e.currentTarget.style.background = tk.blueBg; }}
            onDragLeave={(e) => { e.currentTarget.style.borderColor = tk.g200; e.currentTarget.style.background = tk.g10; }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = tk.green; e.currentTarget.style.background = tk.greenBg; showToastMsg("File received — validating..."); }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: tk.g700, marginBottom: 4 }}>{t("profile.library.import.dropzone")}</div>
            <div style={{ fontSize: 12, color: tk.g500 }}>{t("profile.library.import.requirements")}</div>
          </div>
          {/* Simulated "file selected" state */}
          <div style={{ padding: "12px 16px", background: tk.g50, border: `1px solid ${tk.g100}`, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, background: tk.blueBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{ }</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: tk.g700, fontFamily: tk.mono }}>indiko-plus-custom-v2.json</div>
              <div style={{ fontSize: 11, color: tk.g500 }}>4.2 KB · Uploaded just now</div>
            </div>
            <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: tk.greenBg, color: tk.green }}>✓ Valid</span>
          </div>
          {/* Preview of what will be imported */}
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Profile Preview</div>
          <div style={{ padding: "12px 16px", background: tk.white, border: `1px solid ${tk.g100}`, fontSize: 12, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px" }}>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Name:</span><span>Indiko Plus — Custom Chemistry v2</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Manufacturer:</span><span>Thermo Fisher Scientific</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Model:</span><span>Indiko Plus</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Plugin Type:</span><span>Generic ASTM</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Protocol:</span><span>ASTM LIS2-A2</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Test Codes:</span><span>52</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>QC Rules:</span><span>4</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Version:</span><span>2.0.0 by Dr. Rakoto</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Schema:</span><span>analyzer-profile/1.0</span>
            <span style={{ fontWeight: 500, color: tk.g600 }}>Compatibility:</span><span>OpenELIS ≥ 3.2.0</span>
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: tk.blueBg, borderLeft: `3px solid ${tk.blue}`, fontSize: 12 }}>
            This profile will be saved to your site library and will be available when creating new analyzers.
          </div>
        </Modal>
      )}

      {/* TOAST */}
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: tk.green, color: tk.white, padding: "12px 20px", fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>✓ {toast}</div>}
    </div>
  );
}
