import { useState, useCallback, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════
// i18n SIMULATION — all user-facing strings use localization tags
// HL7-specific tags use label.hl7.* namespace
// Shared tags from ASTM use label.analyzer.* namespace
// ═══════════════════════════════════════════════════════════════════
const i18n = {
  // Global
  "app.name": "OpenELIS Global",
  "app.version": "Version: 3.2.1.2",
  // Sidebar
  "nav.home": "Home",
  "nav.genericSample": "Generic Sample",
  "nav.order": "Order",
  "nav.patient": "Patient",
  "nav.storage": "Storage",
  "nav.analyzers": "Analyzers",
  "nav.analyzers.list": "Analyzers List",
  "nav.analyzers.errorDashboard": "Error Dashboard",
  "nav.nonConform": "Non-Conform",
  "nav.workplan": "Workplan",
  "nav.pathology": "Pathology",
  "nav.immunohistochemistry": "Immunohistochemistry",
  "nav.cytology": "Cytology",
  "nav.results": "Results",
  "nav.validation": "Validation",
  "nav.reports": "Reports",
  "nav.admin": "Admin",
  "nav.billing": "Billing",
  "nav.aliquot": "Aliquot",
  "nav.notebook": "NoteBook",
  "nav.inventory": "Inventory",
  "nav.help": "Help",
  // Analyzer List
  "analyzer.list.title": "Analyzer List",
  "analyzer.list.subtitle": "Manage laboratory analyzers and field mappings",
  "analyzer.list.addAnalyzer": "Add Analyzer",
  "analyzer.list.totalAnalyzers": "Total Analyzers",
  "analyzer.list.active": "Active",
  "analyzer.list.inactive": "Inactive",
  "analyzer.list.pluginWarnings": "Plugin Warnings",
  "analyzer.list.search": "Search analyzers...",
  "analyzer.list.status": "Status",
  "analyzer.list.allStatuses": "All Statuses",
  "analyzer.list.col.name": "Name",
  "analyzer.list.col.protocol": "Protocol",
  "analyzer.list.col.connection": "Connection",
  "analyzer.list.col.testUnits": "Test Units",
  "analyzer.list.col.status": "Status",
  "analyzer.list.col.lastMessage": "Last Message",
  "analyzer.list.col.actions": "Actions",
  // Overflow menu
  "analyzer.action.fieldMappings": "Field Mappings",
  "analyzer.action.testConnection": "Test Connection",
  "analyzer.action.copyMappings": "Copy Mappings",
  "analyzer.action.edit": "Edit",
  "analyzer.action.delete": "Delete",
  // Add/Edit Analyzer modal
  "analyzer.modal.addTitle": "Add New HL7 Analyzer",
  "analyzer.modal.editTitle": "Edit HL7 Analyzer",
  "analyzer.modal.name": "Analyzer Name",
  "analyzer.modal.namePlaceholder": "e.g., Mindray BC-5380",
  "analyzer.modal.status": "Status",
  "analyzer.modal.statusHelp": "Status transitions automatically based on analyzer state. Manual override to INACTIVE, SETUP, or VALIDATION only.",
  "analyzer.modal.pluginType": "Plugin Type",
  "analyzer.modal.analyzerType": "Analyzer Type",
  "analyzer.modal.protocolVersion": "Protocol Version",
  "analyzer.modal.cancel": "Cancel",
  "analyzer.modal.save": "Save",
  // HL7 MLLP Connection
  "label.hl7.connectionRole": "Connection Role",
  "label.hl7.connectionRole.server": "Server (OpenELIS Listens for MLLP)",
  "label.hl7.connectionRole.client": "Client (OpenELIS Connects to Analyzer)",
  "label.hl7.listenerMode": "Listener Mode",
  "label.hl7.listenerMode.shared": "Shared MLLP Port (route by MSH-3)",
  "label.hl7.listenerMode.dedicated": "Dedicated Port (per analyzer)",
  "label.hl7.senderAppFilter": "Sender Application (MSH-3)",
  "label.hl7.senderAppFilter.help": "Expected MSH-3 value from this analyzer. Used to route messages from the shared MLLP listener.",
  "label.hl7.senderFacilityFilter": "Sender Facility (MSH-4)",
  "label.hl7.listenPort": "Listen Port",
  "label.hl7.analyzerIpAddress": "Analyzer IP Address",
  "label.hl7.analyzerPort": "Analyzer Port",
  "label.hl7.connectionTimeout": "Connection Timeout (seconds)",
  "label.hl7.idleTimeout": "Idle Timeout (seconds)",
  "label.hl7.idleTimeout.help": "Close connection after inactivity. Set to 0 for persistent connection.",
  "label.hl7.maxConnections": "Max Concurrent Connections",
  "label.hl7.characterEncoding": "Character Encoding",
  "label.hl7.bidirectionalEnabled": "Bidirectional (Host Query)",
  "label.hl7.bidirectional.help": "When enabled, OpenELIS can send QRY^R02 messages to retrieve pending results.",
  "label.hl7.testConnection": "Test MLLP Connection",
  // ACK Config
  "label.hl7.ack.title": "ACK Response Configuration",
  "label.hl7.ack.mode": "ACK Response Mode",
  "label.hl7.ack.alwaysAccept": "Always Accept (AA)",
  "label.hl7.ack.alwaysAccept.help": "Sends AA for all parseable messages. Unmapped test codes are logged but do not block acknowledgment.",
  "label.hl7.ack.successOnly": "Accept on Success Only",
  "label.hl7.ack.successOnly.help": "Sends AA only if all OBX codes are mapped. Sends AE if any unmapped codes are found.",
  "label.hl7.ack.acceptWithErrors": "Accept with Errors",
  "label.hl7.ack.acceptWithErrors.help": "Sends AA if at least one OBX is mapped. Sends AE only if zero codes are mapped.",
  "label.hl7.ack.never": "Never (Suppress ACK)",
  "label.hl7.ack.never.help": "No ACK response is sent. Use only for analyzers that do not expect acknowledgment.",
  "label.hl7.ack.sendingApp": "ACK Sending Application",
  "label.hl7.ack.delayMs": "ACK Delay (ms)",
  "label.hl7.ack.includeErrorDetail": "Include Error Detail in ACK",
  "label.hl7.ack.dedupEnabled": "Duplicate Detection",
  "label.hl7.ack.dedupWindowMinutes": "Dedup Window (minutes)",
  "label.hl7.ack.duplicateDetected": "Duplicate message detected (MSH-10 already processed).",
  // Mapping page
  "mapping.title": "HL7 Field Mappings",
  "mapping.subtitle": "Configure HL7 v2.3.1 field mappings between analyzer and OpenELIS",
  "mapping.warning.required": "Required mappings are missing",
  "mapping.warning.requiredDesc": "Some required fields are not mapped. Please map all required fields before activating.",
  "mapping.stat.totalMappings": "Total Mappings",
  "mapping.stat.requiredMappings": "Required Mappings",
  "mapping.stat.unmappedFields": "Unmapped Fields",
  "mapping.btn.queryAnalyzer": "Query Analyzer",
  "mapping.btn.testMapping": "Test Mapping",
  "mapping.btn.saveMappings": "Save Mappings",
  // Mapping tabs — HL7 specific
  "mapping.tab.testCodes": "Test Codes",
  "mapping.tab.qcRules": "QC Rules",
  "mapping.tab.ackConfig": "ACK Config",
  "mapping.tab.simulator": "Message Simulator",
  "mapping.tab.preview": "Preview",
  "mapping.tab.extraction": "Field Extraction",
  "mapping.tab.advanced": "Advanced",
  // Test Codes tab — HL7 columns
  "mapping.testCodes.title": "HL7 Test Code Mappings",
  "mapping.testCodes.search": "Search test codes...",
  "mapping.testCodes.col.fieldName": "Test Code (OBX-3)",
  "mapping.testCodes.col.hl7Ref": "HL7 Ref",
  "mapping.testCodes.col.valueType": "OBX-2",
  "mapping.testCodes.col.unit": "Unit",
  "mapping.testCodes.col.openelisTest": "OpenELIS Test",
  "mapping.testCodes.col.transform": "Transform",
  "mapping.testCodes.col.status": "Status",
  "mapping.testCodes.addMapping": "Add Mapping",
  "mapping.testCodes.bulkAdd": "Bulk Add",
  "mapping.testCodes.importCsv": "Import CSV",
  "mapping.testCodes.autoMatch": "Auto-Match",
  "mapping.testCodes.mapped": "Mapped",
  "mapping.testCodes.unmapped": "Unmapped",
  "mapping.testCodes.draft": "Draft",
  "mapping.testCodes.active": "Active",
  "mapping.testCodes.createNewTest": "Create New Test",
  // Detail panel
  "mapping.summary.title": "Mapping Detail",
  "mapping.summary.empty": "Select a test code from the left panel to view or create mappings.",
  "mapping.summary.openelisTest": "OpenELIS Test",
  "mapping.summary.analyzerCode": "Analyzer Code (OBX-3.1)",
  "mapping.summary.displayName": "Display Name (OBX-3.2)",
  "mapping.summary.codingSystem": "Coding System (OBX-3.3)",
  "mapping.summary.valueType": "Value Type (OBX-2)",
  "mapping.summary.sampleType": "Sample Type",
  "mapping.summary.resultType": "Result Type",
  "mapping.summary.transform": "Transformation",
  "mapping.summary.unit": "Unit",
  "mapping.summary.analyzerUnit": "Analyzer Unit",
  "mapping.summary.openelisUnit": "OpenELIS Unit",
  // Transform types (shared with ASTM)
  "transform.passThrough": "Pass-through",
  "transform.greaterLessFlag": "Greater/Less Flag",
  "transform.valueMap": "Value Map",
  "transform.thresholdClassify": "Threshold Classify",
  "transform.codedLookup": "Coded Lookup",
  // QC Rules — HL7
  "qc.title": "QC Sample Identification",
  "qc.description": "A sample is identified as QC if ANY of these rules match:",
  "qc.ruleType.fieldEquals": "Segment Field Equals",
  "qc.ruleType.specimenIdPrefix": "Specimen ID Prefix (OBR-2)",
  "qc.ruleType.specimenIdRegex": "Specimen ID Pattern",
  "qc.ruleType.fieldContains": "Segment Field Contains",
  "qc.ruleType.patientNamePattern": "Patient Name Pattern (PID-5)",
  "qc.addRule": "Add QC Rule",
  "qc.testRules": "Test QC Rules",
  "qc.noRules": "No QC rules configured. At least one rule is required before activating.",
  "qc.fieldRef": "HL7 Field",
  "qc.matchValue": "Match Value",
  // Simulator — HL7
  "simulator.title": "HL7 Message Simulator",
  "simulator.paste": "Paste HL7 Message:",
  "simulator.clear": "Clear",
  "simulator.parse": "Parse",
  "simulator.empty": "Paste an HL7 message above and click Parse to validate your configuration.",
  "simulator.results": "Parse Results",
  "simulator.ackPreview": "ACK Response Preview",
  // Field Extraction — HL7
  "extraction.title": "Advanced Field Extraction",
  "extraction.info": "These defaults work for most HL7 analyzers. Only change if your instrument uses non-standard field positions.",
  // Value Map editor
  "valueMap.title": "Value Map Configuration",
  "valueMap.analyzerValue": "Analyzer Value (OBX-5.1)",
  "valueMap.openelisValue": "OpenELIS Value",
  "valueMap.addEntry": "Add Mapping Entry",
  "valueMap.defaultAction": "Default Action",
  "valueMap.defaultAction.reject": "Reject — flag unmapped values as errors",
  "valueMap.defaultAction.passThrough": "Pass-through — store raw value",
  "valueMap.defaultAction.default": "Default Value — use a fallback value",
  "valueMap.defaultValue": "Default Value",
  "valueMap.noEntries": "No value mappings configured. Add at least one mapping entry.",
  "valueMap.ceHint": "Map OBX-5.1 codes (not display text) to OpenELIS select list options.",
  "valueMap.selectListLinked": "Showing options from the mapped OpenELIS test's select list.",
  "valueMap.selectListEmpty": "The mapped OpenELIS test has no select list options defined. Add options in Test Catalog first, or use pass-through.",
  "valueMap.noTestMapped": "Map an OpenELIS test above to populate the select list dropdown.",
  "valueMap.typeMismatch": "Result type mismatch: OBX-2 is {obxType} (coded) but the mapped OpenELIS test expects {oeType}. Consider mapping to a CODED test instead.",
  "valueMap.autoPopulate": "Auto-populate from Select List",
  "valueMap.freeTextFallback": "Free text (no select list)",
  // Query Analyzer
  "query.title": "Query Analyzer — Discover Test Codes",
  "query.description": "Send QRY^R02 to request the analyzer's test menu via HL7.",
  "query.statusIdle": "Ready to query. The analyzer must be online and bidirectional mode must be enabled.",
  "query.statusQuerying": "Querying analyzer...",
  "query.statusSuccess": "Discovery complete. {count} test code(s) returned.",
  "query.statusFailed": "Query failed. Check connection settings and ensure bidirectional mode is enabled.",
  "query.discovered": "Discovered Test Codes",
  "query.col.code": "Code (OBX-3.1)",
  "query.col.displayName": "Display Name (OBX-3.2)",
  "query.col.codingSystem": "System (OBX-3.3)",
  "query.col.valueType": "Type (OBX-2)",
  "query.col.units": "Units",
  "query.col.status": "Status",
  "query.addSelected": "Add Selected to Mappings",
  "query.addAll": "Add All",
  "query.alreadyMapped": "Already Mapped",
  "query.new": "New",
  "query.send": "Send Query",
  "query.close": "Close",
  // Preview tab
  "preview.title": "Import Preview",
  "preview.description": "Simulate an HL7 import using a file or pasted message. No data will be saved.",
  "preview.uploadFile": "Upload HL7 File",
  "preview.orPaste": "or paste a message below",
  "preview.run": "Run Import Simulation",
  "preview.running": "Simulating import...",
  "preview.clear": "Clear",
  "preview.result.title": "Import Simulation Results",
  "preview.result.summary": "Summary",
  "preview.result.specimens": "Specimen(s) Parsed",
  "preview.result.testsMatched": "Tests Matched",
  "preview.result.testsUnmatched": "Tests Unmatched",
  "preview.result.qcDetected": "QC Samples",
  "preview.result.errors": "Errors",
  "preview.log.title": "Parse Log",
  "preview.log.timestamp": "Step",
  "preview.log.level": "Level",
  "preview.log.message": "Message",
  "preview.log.field": "HL7 Reference",
  "preview.log.info": "INFO",
  "preview.log.warn": "WARN",
  "preview.log.error": "ERROR",
  "preview.log.debug": "DEBUG",
  "preview.importTable.title": "Results Preview",
  "preview.importTable.specimen": "Specimen ID",
  "preview.importTable.code": "Code (OBX-3)",
  "preview.importTable.valueType": "Type",
  "preview.importTable.oeName": "OpenELIS Test",
  "preview.importTable.rawValue": "Raw Value",
  "preview.importTable.transformedValue": "Stored Value",
  "preview.importTable.units": "Units",
  "preview.importTable.flag": "Flag",
  "preview.importTable.qc": "QC",
  "preview.importTable.status": "Status",
  // Delete
  "delete.title": "Delete Analyzer",
  "delete.confirm": "Are you sure you want to delete {name}? This action cannot be undone and will remove all associated field mappings.",
  "delete.cancel": "Cancel",
  "delete.delete": "Delete",
};
const t = (key) => i18n[key] || key;

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS (matched to real OpenELIS / Carbon)
// ═══════════════════════════════════════════════════════════════════
const tk = {
  navBg: "#1a2a3a",
  navText: "#ccd6e0",
  navTextActive: "#ffffff",
  navHoverBg: "#243444",
  navActiveBg: "#0f62fe22",
  headerBg: "#0d1b2a",
  blue: "#0f62fe",
  blueHover: "#0043ce",
  blueLight: "#d0e2ff",
  blueBg: "#edf5ff",
  green: "#198038",
  greenBg: "#defbe6",
  red: "#da1e28",
  redBg: "#fff1f1",
  yellow: "#f1c21b",
  yellowBg: "#fcf4d6",
  yellowBorder: "#e0b400",
  purple: "#8a3ffc",
  purpleBg: "#f6f2ff",
  g900: "#161616",
  g800: "#262626",
  g700: "#393939",
  g600: "#525252",
  g500: "#6f6f6f",
  g400: "#8d8d8d",
  g300: "#a8a8a8",
  g200: "#c6c6c6",
  g100: "#e0e0e0",
  g50: "#f4f4f4",
  g10: "#fafafa",
  white: "#ffffff",
  font: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'IBM Plex Mono', 'Menlo', monospace",
};

// ═══════════════════════════════════════════════════════════════════
// MOCK DATA — HL7 analyzers
// ═══════════════════════════════════════════════════════════════════
const ANALYZERS = [
  { id: "h1", name: "Mindray BC-5380", type: "HEMATOLOGY", protocol: "HL7 v2.3.1", connection: "MLLP Shared :5000", msh3: "BC-5380", testUnits: "24", status: "Active", lastMessage: "2 min ago" },
  { id: "h2", name: "Mindray BS-480", type: "CHEMISTRY", protocol: "HL7 v2.3.1", connection: "MLLP Shared :5000", msh3: "BS-480", testUnits: "18", status: "Active", lastMessage: "5 min ago" },
  { id: "h3", name: "Sysmex XN-1000", type: "HEMATOLOGY", protocol: "HL7 v2.3.1", connection: "MLLP :5001", msh3: "XN-1000", testUnits: "32", status: "Validation", lastMessage: "1 hr ago" },
  { id: "h4", name: "Roche cobas c311", type: "CHEMISTRY", protocol: "HL7 v2.3.1", connection: "MLLP :5002", msh3: "COBAS", testUnits: "0", status: "Setup", lastMessage: "—" },
  { id: "h5", name: "Indiko Plus", type: "CHEMISTRY", protocol: "ASTM LIS2-A2", connection: "TCP :5100", msh3: "—", testUnits: "12", status: "Active", lastMessage: "10 min ago" },
];

const OE_TESTS = [
  { id: "t01", name: "Glucose", code: "GLU", resultType: "NUMERIC", unit: "mg/dL", sampleType: "Serum" },
  { id: "t02", name: "Blood Urea Nitrogen", code: "BUN", resultType: "NUMERIC", unit: "mg/dL", sampleType: "Serum" },
  { id: "t03", name: "Creatinine", code: "CREA", resultType: "NUMERIC", unit: "mg/dL", sampleType: "Serum" },
  { id: "t04", name: "ALT (SGPT)", code: "ALT", resultType: "NUMERIC", unit: "U/L", sampleType: "Serum" },
  { id: "t05", name: "AST (SGOT)", code: "AST", resultType: "NUMERIC", unit: "U/L", sampleType: "Serum" },
  { id: "t06", name: "WBC", code: "WBC", resultType: "NUMERIC", unit: "10*3/uL", sampleType: "Whole Blood" },
  { id: "t07", name: "RBC", code: "RBC", resultType: "NUMERIC", unit: "10*6/uL", sampleType: "Whole Blood" },
  { id: "t08", name: "Hemoglobin", code: "HGB", resultType: "NUMERIC", unit: "g/dL", sampleType: "Whole Blood" },
  { id: "t09", name: "Hematocrit", code: "HCT", resultType: "NUMERIC", unit: "%", sampleType: "Whole Blood" },
  { id: "t10", name: "Platelet Count", code: "PLT", resultType: "NUMERIC", unit: "10*3/uL", sampleType: "Whole Blood" },
  { id: "t11", name: "HIV Ag/Ab Combo", code: "HIVAG", resultType: "CODED", unit: "", sampleType: "Serum",
    selectListOptions: [
      { id: "sl01", displayValue: "Negative", code: "NEG" },
      { id: "sl02", displayValue: "Positive", code: "POS" },
      { id: "sl03", displayValue: "Indeterminate", code: "IND" },
    ]},
  { id: "t12", name: "HBsAg", code: "HBSAG", resultType: "CODED", unit: "", sampleType: "Serum",
    selectListOptions: [
      { id: "sl04", displayValue: "Negative", code: "NEG" },
      { id: "sl05", displayValue: "Positive", code: "POS" },
      { id: "sl06", displayValue: "Indeterminate", code: "IND" },
    ]},
  { id: "t13", name: "Total Cholesterol", code: "CHOL", resultType: "NUMERIC", unit: "mg/dL", sampleType: "Serum" },
  { id: "t14", name: "RPR", code: "RPR", resultType: "CODED", unit: "", sampleType: "Serum",
    selectListOptions: [
      { id: "sl07", displayValue: "Non-reactive", code: "NR" },
      { id: "sl08", displayValue: "Reactive", code: "R" },
      { id: "sl09", displayValue: "Weakly Reactive", code: "WR" },
    ]},
  { id: "t15", name: "Blood Group (ABO)", code: "ABO", resultType: "CODED", unit: "", sampleType: "Whole Blood",
    selectListOptions: [
      { id: "sl10", displayValue: "A", code: "A" },
      { id: "sl11", displayValue: "B", code: "B" },
      { id: "sl12", displayValue: "AB", code: "AB" },
      { id: "sl13", displayValue: "O", code: "O" },
    ]},
  { id: "t16", name: "Rh Factor", code: "RH", resultType: "CODED", unit: "", sampleType: "Whole Blood",
    selectListOptions: [
      { id: "sl14", displayValue: "Positive", code: "POS" },
      { id: "sl15", displayValue: "Negative", code: "NEG" },
    ]},
  { id: "t17", name: "Malaria RDT", code: "MALARIARDT", resultType: "CODED", unit: "", sampleType: "Whole Blood",
    selectListOptions: [
      { id: "sl16", displayValue: "Negative", code: "NEG" },
      { id: "sl17", displayValue: "P. falciparum", code: "PF" },
      { id: "sl18", displayValue: "P. vivax", code: "PV" },
      { id: "sl19", displayValue: "Mixed (Pf + Pv)", code: "MIX" },
      { id: "sl20", displayValue: "Invalid", code: "INV" },
    ]},
];

// HL7 test code mappings — includes OBX-2, OBX-3.2 display name, OBX-3.3 coding system
const INIT_MAPPINGS = [
  { id: "m1", analyzerCode: "WBC", displayName: "White Blood Cell Count", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "10*3/uL", oeTestId: "t06", oeTestName: "WBC", oeUnit: "10*3/uL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "m2", analyzerCode: "RBC", displayName: "Red Blood Cell Count", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "10*6/uL", oeTestId: "t07", oeTestName: "RBC", oeUnit: "10*6/uL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "m3", analyzerCode: "HGB", displayName: "Hemoglobin", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "g/dL", oeTestId: "t08", oeTestName: "Hemoglobin", oeUnit: "g/dL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "m4", analyzerCode: "HCT", displayName: "Hematocrit", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "%", oeTestId: "t09", oeTestName: "Hematocrit", oeUnit: "%", transform: "PASSTHROUGH", status: "mapped" },
  { id: "m5", analyzerCode: "PLT", displayName: "Platelet Count", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "10*3/uL", oeTestId: "t10", oeTestName: "Platelet Count", oeUnit: "10*3/uL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "m6", analyzerCode: "HIVAG", displayName: "HIV Ag/Ab Combo", codingSystem: "L", hl7Ref: "OBX-3", valueType: "CE", unit: "", oeTestId: "t11", oeTestName: "HIV Ag/Ab Combo", oeUnit: "", transform: "VALUE_MAP", status: "mapped" },
  { id: "m7", analyzerCode: "CHOL", displayName: "Total Cholesterol", codingSystem: "L", hl7Ref: "OBX-3", valueType: "SN", unit: "mg/dL", oeTestId: "t13", oeTestName: "Total Cholesterol", oeUnit: "mg/dL", transform: "PASSTHROUGH", status: "mapped" },
  { id: "m8", analyzerCode: "MCV", displayName: "Mean Corpuscular Volume", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "fL", oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped" },
  { id: "m9", analyzerCode: "MCH", displayName: "Mean Corpuscular Hemoglobin", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "pg", oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped" },
  { id: "m10", analyzerCode: "HBSAG", displayName: "HBsAg Screen", codingSystem: "L", hl7Ref: "OBX-3", valueType: "CE", unit: "", oeTestId: "t12", oeTestName: "HBsAg", oeUnit: "", transform: "VALUE_MAP", status: "mapped" },
  { id: "m11", analyzerCode: "RPR", displayName: "RPR Qualitative", codingSystem: "L", hl7Ref: "OBX-3", valueType: "CE", unit: "", oeTestId: "t14", oeTestName: "RPR", oeUnit: "", transform: "VALUE_MAP", status: "mapped" },
];

// ═══════════════════════════════════════════════════════════════════
// OVERFLOW MENU
// ═══════════════════════════════════════════════════════════════════
const OverflowMenu = ({ items, onSelect }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 8px", fontSize: 18, color: tk.g600, lineHeight: 1 }} onClick={() => setOpen(!open)}>⋮</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 100, background: tk.navBg, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,.25)" }}>
          {items.map((item, i) => (
            <div key={i}
              style={{ padding: "10px 16px", cursor: "pointer", fontSize: 13, color: item.danger ? "#ff8389" : tk.white, background: "transparent", borderBottom: `1px solid rgba(255,255,255,.06)` }}
              onMouseEnter={(e) => { if (!item.danger) e.currentTarget.style.background = tk.blue; }}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => { onSelect(item.key); setOpen(false); }}
            >{item.label}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// TEST COMBOBOX with inline create
// ═══════════════════════════════════════════════════════════════════
const TestComboBox = ({ value, onChange, onCreateNew }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value ? (OE_TESTS.find(t => t.id === value)?.name || "") : "");
  const ref = useRef(null);
  const filtered = OE_TESTS.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.code.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (value) { const test = OE_TESTS.find(t => t.id === value); if (test) setSearch(test.name); }
  }, [value]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, background: tk.white, color: tk.g900, boxSizing: "border-box" }}
        placeholder="Search tests..." value={search}
        onChange={(e) => { setSearch(e.target.value); if (value) onChange(null); setOpen(true); }}
        onFocus={() => setOpen(true)} />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: tk.white, border: `1px solid ${tk.g200}`, boxShadow: "0 4px 16px rgba(0,0,0,.1)", maxHeight: 240, overflowY: "auto" }}>
          {filtered.slice(0, 8).map(test => (
            <div key={test.id} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${tk.g50}` }}
              onMouseEnter={(e) => e.currentTarget.style.background = tk.blueBg}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              onClick={() => { onChange(test.id); setSearch(test.name); setOpen(false); }}>
              <div style={{ fontWeight: 500 }}>{test.name}</div>
              <div style={{ fontSize: 11, color: tk.g500 }}>{test.code} · {test.resultType} · {test.unit || "—"}</div>
            </div>
          ))}
          <div style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: tk.blue, fontWeight: 600, borderTop: `1px solid ${tk.g100}`, background: tk.g50 }}
            onClick={() => { onCreateNew(search); setOpen(false); }}>
            + {t("mapping.testCodes.createNewTest")} {search && <span style={{ fontWeight: 400, color: tk.g600 }}>"{search}"</span>}
          </div>
        </div>
      )}
    </div>
  );
};

// Value type badge colors
const vtColor = (vt) => {
  switch (vt) {
    case "NM": return { bg: tk.blueBg, color: tk.blue };
    case "CE": return { bg: tk.purpleBg, color: tk.purple };
    case "SN": return { bg: tk.yellowBg, color: "#7a5b00" };
    case "ST": return { bg: tk.g50, color: tk.g700 };
    case "TX": return { bg: tk.g50, color: tk.g700 };
    default: return { bg: tk.g50, color: tk.g600 };
  }
};

// ═══════════════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════════════
export default function HL7AnalyzerMappingApp() {
  const [view, setView] = useState("list");
  const [selectedAnalyzer, setSelectedAnalyzer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedNav, setExpandedNav] = useState("analyzers");
  // MLLP config state
  const [connectionRole, setConnectionRole] = useState("server");
  const [listenerMode, setListenerMode] = useState("shared");
  const [msh3Filter, setMsh3Filter] = useState("");
  // ACK config state
  const [ackMode, setAckMode] = useState("ALWAYS_ACCEPT");
  const [dedupEnabled, setDedupEnabled] = useState(true);
  // Mapping view state
  const [activeTab, setActiveTab] = useState("testcodes");
  const [selectedField, setSelectedField] = useState(null);
  const [mappings, setMappings] = useState(INIT_MAPPINGS);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [showInlineCreate, setShowInlineCreate] = useState(null);
  const [newTestForm, setNewTestForm] = useState({ name: "", code: "", resultType: "NUMERIC", unit: "", sampleType: "Serum" });
  // QC state
  const [qcRules, setQcRules] = useState([
    { id: "qc1", type: "specimenIdPrefix", field: "OBR-2", value: "CTRL-" },
    { id: "qc2", type: "patientNamePattern", field: "PID-5", value: ".*QC Control.*" },
  ]);
  // Simulator state
  const [simMessage, setSimMessage] = useState("");
  const [simResult, setSimResult] = useState(null);
  // Field extraction state
  const [extractionOpen, setExtractionOpen] = useState(false);
  // Value Map state (per mapping)
  const [valueMaps, setValueMaps] = useState({
    m6: { entries: [
      { id: "vm1", analyzerValue: "NEG", openelisValue: "Negative" },
      { id: "vm2", analyzerValue: "POS", openelisValue: "Positive" },
      { id: "vm3", analyzerValue: "IND", openelisValue: "Indeterminate" },
    ], defaultAction: "REJECT", defaultValue: "" },
    m10: { entries: [
      { id: "vm4", analyzerValue: "NEG", openelisValue: "Negative" },
      { id: "vm5", analyzerValue: "POS", openelisValue: "Positive" },
      { id: "vm6", analyzerValue: "EQV", openelisValue: "Indeterminate" },
    ], defaultAction: "REJECT", defaultValue: "" },
    m11: { entries: [
      { id: "vm7", analyzerValue: "NR", openelisValue: "Non-reactive" },
      { id: "vm8", analyzerValue: "R", openelisValue: "Reactive" },
    ], defaultAction: "DEFAULT", defaultValue: "Weakly Reactive" },
  });
  // Query Analyzer state
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryStatus, setQueryStatus] = useState("idle"); // idle, querying, success, failed
  const [queryResults, setQueryResults] = useState([]);
  const [querySelected, setQuerySelected] = useState(new Set());
  // Preview tab state
  const [previewMessage, setPreviewMessage] = useState("");
  const [previewRunning, setPreviewRunning] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLogFilter, setPreviewLogFilter] = useState("ALL");

  const showToastMsg = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);

  // Value Map helpers
  const getValueMap = (mappingId) => valueMaps[mappingId] || { entries: [], defaultAction: "REJECT", defaultValue: "" };
  const updateValueMap = (mappingId, updates) => setValueMaps(prev => ({ ...prev, [mappingId]: { ...getValueMap(mappingId), ...updates } }));
  const addValueMapEntry = (mappingId) => {
    const vm = getValueMap(mappingId);
    updateValueMap(mappingId, { entries: [...vm.entries, { id: `vm${Date.now()}`, analyzerValue: "", openelisValue: "" }] });
  };
  const updateValueMapEntry = (mappingId, entryId, field, value) => {
    const vm = getValueMap(mappingId);
    updateValueMap(mappingId, { entries: vm.entries.map(e => e.id === entryId ? { ...e, [field]: value } : e) });
  };
  const deleteValueMapEntry = (mappingId, entryId) => {
    const vm = getValueMap(mappingId);
    updateValueMap(mappingId, { entries: vm.entries.filter(e => e.id !== entryId) });
  };
  // Select list helpers for Value Map
  const getSelectListForMapping = (mapping) => {
    if (!mapping?.oeTestId) return null;
    const test = OE_TESTS.find(t => t.id === mapping.oeTestId);
    return test?.selectListOptions || null;
  };
  const autoPopulateFromSelectList = (mappingId) => {
    const mapping = mappings.find(m => m.id === mappingId);
    const options = getSelectListForMapping(mapping);
    if (!options || options.length === 0) return;
    const existing = new Set(getValueMap(mappingId).entries.map(e => e.openelisValue));
    const newEntries = options
      .filter(opt => !existing.has(opt.displayValue))
      .map(opt => ({ id: `vm${Date.now()}_${opt.code}`, analyzerValue: "", openelisValue: opt.displayValue }));
    if (newEntries.length > 0) {
      const vm = getValueMap(mappingId);
      updateValueMap(mappingId, { entries: [...vm.entries, ...newEntries] });
      showToastMsg(`Added ${newEntries.length} option(s) from select list`);
    }
  };
  const getResultTypeMismatch = (mapping) => {
    if (!mapping?.oeTestId) return null;
    const test = OE_TESTS.find(t => t.id === mapping.oeTestId);
    if (!test) return null;
    const codedOBX = ["CE", "CWE", "CNE"].includes(mapping.valueType);
    if (codedOBX && test.resultType === "NUMERIC") return { obxType: mapping.valueType, oeType: "NUMERIC" };
    if (mapping.valueType === "NM" && test.resultType === "CODED") return { obxType: "NM", oeType: "CODED" };
    return null;
  };

  // Query Analyzer helpers
  const MOCK_DISCOVERED_CODES = [
    { code: "WBC", displayName: "White Blood Cell Count", codingSystem: "L", valueType: "NM", units: "10*3/uL" },
    { code: "RBC", displayName: "Red Blood Cell Count", codingSystem: "L", valueType: "NM", units: "10*6/uL" },
    { code: "HGB", displayName: "Hemoglobin", codingSystem: "L", valueType: "NM", units: "g/dL" },
    { code: "HCT", displayName: "Hematocrit", codingSystem: "L", valueType: "NM", units: "%" },
    { code: "PLT", displayName: "Platelet Count", codingSystem: "L", valueType: "NM", units: "10*3/uL" },
    { code: "MCV", displayName: "Mean Corpuscular Volume", codingSystem: "L", valueType: "NM", units: "fL" },
    { code: "MCH", displayName: "Mean Corpuscular Hemoglobin", codingSystem: "L", valueType: "NM", units: "pg" },
    { code: "MCHC", displayName: "Mean Corpuscular Hgb Conc", codingSystem: "L", valueType: "NM", units: "g/dL" },
    { code: "RDW", displayName: "Red Cell Distribution Width", codingSystem: "L", valueType: "NM", units: "%" },
    { code: "MPV", displayName: "Mean Platelet Volume", codingSystem: "L", valueType: "NM", units: "fL" },
    { code: "NEUT%", displayName: "Neutrophil %", codingSystem: "L", valueType: "NM", units: "%" },
    { code: "LYMPH%", displayName: "Lymphocyte %", codingSystem: "L", valueType: "NM", units: "%" },
  ];
  const runQueryAnalyzer = () => {
    setQueryStatus("querying");
    setTimeout(() => {
      setQueryResults(MOCK_DISCOVERED_CODES);
      setQuerySelected(new Set());
      setQueryStatus("success");
    }, 1500);
  };
  const isCodeAlreadyMapped = (code) => mappings.some(m => m.analyzerCode === code);
  const toggleQuerySelect = (code) => {
    setQuerySelected(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };
  const addSelectedFromQuery = () => {
    const toAdd = queryResults.filter(r => querySelected.has(r.code) && !isCodeAlreadyMapped(r.code));
    const newMappings = toAdd.map(r => ({
      id: `m${Date.now()}_${r.code}`, analyzerCode: r.code, displayName: r.displayName, codingSystem: r.codingSystem,
      hl7Ref: "OBX-3", valueType: r.valueType, unit: r.units, oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped",
    }));
    setMappings(prev => [...prev, ...newMappings]);
    showToastMsg(`Added ${newMappings.length} test code(s) from query`);
    setShowQueryModal(false);
  };

  // Preview / Import simulation
  const runPreview = () => {
    if (!previewMessage.trim()) return;
    setPreviewRunning(true);
    setTimeout(() => {
      const lines = previewMessage.split("\n").map(l => l.trim()).filter(Boolean);
      const mshLine = lines.find(l => l.startsWith("MSH|"));
      if (!mshLine) {
        setPreviewResult({ error: "Invalid HL7 format. Expected MSH segment." });
        setPreviewRunning(false);
        return;
      }
      const mshFields = mshLine.split("|");
      const sendingApp = mshFields[2] || "Unknown";
      const messageId = mshFields[9] || "—";
      const timestamp = mshFields[6] || "—";
      const pidLine = lines.find(l => l.startsWith("PID|"));
      const patientName = pidLine ? (pidLine.split("|")[5] || "").replace("^", ", ") : "—";
      const obrLines = lines.filter(l => l.startsWith("OBR|"));
      const obxLines = lines.filter(l => l.startsWith("OBX|"));

      const log = [];
      let step = 1;
      const addLog = (level, msg, ref) => log.push({ step: step++, level, message: msg, ref: ref || "" });

      addLog("INFO", `Received HL7 message from ${sendingApp}`, "MSH-3");
      addLog("DEBUG", `Message Control ID: ${messageId}`, "MSH-10");
      addLog("DEBUG", `Message timestamp: ${timestamp}`, "MSH-7");
      if (pidLine) addLog("INFO", `Patient: ${patientName}`, "PID-5");
      else addLog("WARN", "No PID segment found in message", "PID");

      const specimens = [];
      const allResults = [];
      let qcCount = 0;
      let matchedCount = 0;
      let unmatchedCount = 0;
      let errorCount = 0;

      obrLines.forEach((obrLine, obrIdx) => {
        const obrFields = obrLine.split("|");
        const specimenId = obrFields[2] || `UNKNOWN-${obrIdx + 1}`;
        const panelInfo = (obrFields[4] || "").split("^");
        const panelCode = panelInfo[0] || "";
        const panelName = panelInfo[1] || "";
        addLog("INFO", `Specimen: ${specimenId} — Panel: ${panelCode} ${panelName}`, "OBR-2/OBR-4");

        // QC check
        let isQC = false;
        const matchedQcRules = [];
        qcRules.forEach(rule => {
          if (rule.type === "specimenIdPrefix" && specimenId.startsWith(rule.value)) {
            isQC = true; matchedQcRules.push(`Prefix "${rule.value}" matched`);
          }
          if (rule.type === "patientNamePattern" && patientName.match(new RegExp(rule.value, "i"))) {
            isQC = true; matchedQcRules.push(`Patient name matched "${rule.value}"`);
          }
        });
        if (isQC) {
          addLog("INFO", `QC sample detected (${matchedQcRules.join("; ")})`, "QC Rule");
          qcCount++;
        } else {
          addLog("DEBUG", "No QC rules matched — treating as patient sample", "QC Rule");
        }
        specimens.push({ specimenId, panelCode, panelName, isQC });
      });

      // If no OBR, create a default specimen
      if (obrLines.length === 0) {
        addLog("WARN", "No OBR segment found. Creating default specimen group.", "OBR");
        specimens.push({ specimenId: "UNKNOWN", panelCode: "", panelName: "", isQC: false });
      }

      obxLines.forEach((obxLine, obxIdx) => {
        const f = obxLine.split("|");
        const setId = f[1] || String(obxIdx + 1);
        const valueType = f[2] || "?";
        const codeField = (f[3] || "").split("^");
        const code = codeField[0] || "?";
        const displayName = codeField[1] || "";
        const rawValue = f[5] || "";
        const units = (f[6] || "").split("^")[0] || "";
        const refRange = f[7] || "";
        const flag = f[8] || "";
        const resultStatus = f[11] || "F";

        const match = mappings.find(m => m.analyzerCode === code);
        let transformedValue = rawValue;
        let status = "ok";
        let statusLabel = "✓ Imported";

        if (!match) {
          addLog("WARN", `Unmapped code: ${code} (${displayName}). Result will not be imported.`, `OBX-3 #${setId}`);
          unmatchedCount++;
          status = "unmapped";
          statusLabel = "⚠ Unmapped";
        } else {
          addLog("INFO", `Matched ${code} → ${match.oeTestName}`, `OBX-3 #${setId}`);
          matchedCount++;

          // Transform simulation
          if (match.transform === "VALUE_MAP" && valueMaps[match.id]) {
            const vm = valueMaps[match.id];
            const entry = vm.entries.find(e => e.analyzerValue === rawValue);
            if (entry) {
              transformedValue = entry.openelisValue;
              addLog("DEBUG", `Value Map: "${rawValue}" → "${transformedValue}"`, `OBX-5 #${setId}`);
            } else if (vm.defaultAction === "REJECT") {
              addLog("ERROR", `Value Map: unmapped value "${rawValue}" — REJECTED`, `OBX-5 #${setId}`);
              status = "error";
              statusLabel = "✕ Rejected";
              errorCount++;
            } else if (vm.defaultAction === "DEFAULT") {
              transformedValue = vm.defaultValue;
              addLog("WARN", `Value Map: unmapped value "${rawValue}" — using default "${vm.defaultValue}"`, `OBX-5 #${setId}`);
            } else {
              addLog("DEBUG", `Value Map: unmapped value "${rawValue}" — passing through`, `OBX-5 #${setId}`);
            }
          } else if (match.transform === "GREATER_LESS_FLAG") {
            const gMatch = rawValue.match(/^([<>]=?)\s*(.+)$/);
            if (gMatch) {
              transformedValue = gMatch[2];
              addLog("DEBUG", `Greater/Less Flag: "${rawValue}" → value="${gMatch[2]}", flag="${gMatch[1]}"`, `OBX-5 #${setId}`);
            }
          }

          // SN auto-parse
          if (valueType === "SN" && rawValue.includes("^")) {
            const snParts = rawValue.split("^");
            const operator = snParts[0] || "";
            const snValue = snParts[1] || rawValue;
            transformedValue = snValue;
            if (operator) addLog("DEBUG", `SN auto-parse: "${rawValue}" → value="${snValue}", operator="${operator}"`, `OBX-5 #${setId}`);
          }
        }

        allResults.push({
          specimen: specimens[0]?.specimenId || "UNKNOWN",
          code, displayName, valueType, rawValue, transformedValue, units, refRange, flag, resultStatus,
          oeName: match?.oeTestName || "UNMAPPED",
          isQC: specimens[0]?.isQC || false,
          status, statusLabel,
        });
      });

      // ACK simulation
      const ackCode = unmatchedCount > 0 ? (ackMode === "SUCCESS_ONLY" ? "AE" : "AA") : "AA";
      addLog("INFO", `ACK response: ${ackCode}${ackCode === "AE" ? ` (${unmatchedCount} unmapped codes)` : ""}`, "MSA-1");

      if (errorCount > 0) addLog("ERROR", `${errorCount} result(s) rejected by transformation rules`, "");
      addLog("INFO", `Import simulation complete: ${matchedCount} matched, ${unmatchedCount} unmatched, ${errorCount} error(s)`, "");

      setPreviewResult({
        sendingApp, messageId, timestamp, patientName,
        specimens, results: allResults, log,
        matchedCount, unmatchedCount, qcCount, errorCount,
        ackCode,
      });
      setPreviewRunning(false);
    }, 800);
  };

  const openMappings = (analyzer) => { setSelectedAnalyzer(analyzer); setView("mappings"); setActiveTab("testcodes"); setSelectedField(null); setExpandedNav("analyzers"); };

  const addMapping = () => {
    const id = `m${Date.now()}`;
    setMappings(prev => [...prev, { id, analyzerCode: "", displayName: "", codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "", oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "draft" }]);
  };

  const updateMapping = (id, field, value) => {
    setMappings(prev => prev.map(m => {
      if (m.id !== id) return m;
      const u = { ...m, [field]: value };
      if (field === "oeTestId" && value) {
        const test = OE_TESTS.find(t => t.id === value);
        if (test) {
          u.oeTestName = test.name; u.oeUnit = test.unit; u.status = "mapped";
          // Auto-suggest VALUE_MAP for coded OE tests with select lists when OBX is CE/CWE
          if (test.resultType === "CODED" && test.selectListOptions?.length > 0 && ["CE", "CWE", "CNE"].includes(m.valueType) && m.transform === "PASSTHROUGH") {
            u.transform = "VALUE_MAP";
          }
        }
      }
      return u;
    }));
  };

  const deleteMapping = (id) => setMappings(prev => prev.filter(m => m.id !== id));

  const doBulkAdd = () => {
    const codes = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    const existing = new Set(mappings.map(m => m.analyzerCode));
    const newRows = [...new Set(codes)].filter(c => !existing.has(c)).map(code => ({
      id: `m${Date.now()}_${code}`, analyzerCode: code, displayName: code, codingSystem: "L", hl7Ref: "OBX-3", valueType: "NM", unit: "",
      oeTestId: null, oeTestName: "", oeUnit: "", transform: "PASSTHROUGH", status: "unmapped",
    }));
    setMappings(prev => [...prev, ...newRows]);
    setShowBulkAdd(false); setBulkText("");
    showToastMsg(`Added ${newRows.length} test codes`);
  };

  const doCreateTest = () => {
    const newTest = { id: `t_new_${Date.now()}`, name: newTestForm.name, code: newTestForm.code, resultType: newTestForm.resultType, unit: newTestForm.unit, sampleType: newTestForm.sampleType };
    OE_TESTS.push(newTest);
    updateMapping(showInlineCreate, "oeTestId", newTest.id);
    setShowInlineCreate(null);
    showToastMsg(`Test "${newTest.name}" created and mapped`);
  };

  // HL7 message simulator
  const runSimulator = () => {
    if (!simMessage.trim()) return;
    const lines = simMessage.split("\n").map(l => l.trim()).filter(Boolean);
    const mshLine = lines.find(l => l.startsWith("MSH|"));
    if (!mshLine) { setSimResult({ error: "Message does not appear to be valid HL7. Expected MSH segment header." }); return; }
    const mshFields = mshLine.split("|");
    const sendingApp = mshFields[2] || "Unknown";
    const messageId = mshFields[9] || "—";
    const obrLine = lines.find(l => l.startsWith("OBR|"));
    const specimen = obrLine ? obrLine.split("|")[2] || "Unknown" : "Unknown";
    const panel = obrLine ? (obrLine.split("|")[4] || "").split("^") : [];
    const panelCode = panel[0] || "";
    const panelName = panel[1] || "";
    const obxLines = lines.filter(l => l.startsWith("OBX|"));
    const parsed = obxLines.map(line => {
      const f = line.split("|");
      const vType = f[2] || "?";
      const codeField = (f[3] || "").split("^");
      const code = codeField[0] || "?";
      const displayName = codeField[1] || "";
      const val = f[5] || "";
      const units = (f[6] || "").split("^")[0] || "";
      const refRange = f[7] || "";
      const flag = f[8] || "";
      const match = mappings.find(m => m.analyzerCode === code);
      return { code, displayName, valueType: vType, value: val, units, refRange, flag, oeName: match?.oeTestName || "UNMAPPED", status: match ? "matched" : "unmatched", transform: match?.transform || "—" };
    });
    const ackCode = parsed.length === 0 ? "AR" : parsed.some(p => p.status === "unmatched") ? (ackMode === "SUCCESS_ONLY" ? "AE" : "AA") : "AA";
    setSimResult({
      sendingApp, messageId, specimen, panelCode, panelName,
      results: parsed,
      warnings: parsed.filter(p => p.status === "unmatched").length,
      errors: 0,
      ackCode,
      ackMessage: `MSH|^~\\&|OpenELIS||${sendingApp}||${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}||ACK^R01|ACK${Date.now()}|P|2.3.1\nMSA|${ackCode}|${messageId}`,
    });
  };

  const mappedCount = mappings.filter(m => m.status === "mapped").length;
  const unmappedCount = mappings.filter(m => m.status === "unmapped" || m.status === "draft").length;

  const ACK_MODES = [
    { value: "ALWAYS_ACCEPT", label: t("label.hl7.ack.alwaysAccept"), help: t("label.hl7.ack.alwaysAccept.help") },
    { value: "SUCCESS_ONLY", label: t("label.hl7.ack.successOnly"), help: t("label.hl7.ack.successOnly.help") },
    { value: "ACCEPT_WITH_ERRORS", label: t("label.hl7.ack.acceptWithErrors"), help: t("label.hl7.ack.acceptWithErrors.help") },
    { value: "NEVER", label: t("label.hl7.ack.never"), help: t("label.hl7.ack.never.help") },
  ];

  // ═════════════════════════════════════════════════════════════════
  // SIDEBAR
  // ═════════════════════════════════════════════════════════════════
  const NAV = [
    { key: "home", label: t("nav.home") },
    { key: "genericSample", label: t("nav.genericSample"), exp: true },
    { key: "order", label: t("nav.order"), exp: true },
    { key: "patient", label: t("nav.patient"), exp: true },
    { key: "storage", label: t("nav.storage"), exp: true },
    { key: "analyzers", label: t("nav.analyzers"), exp: true, children: [
      { key: "analyzersList", label: t("nav.analyzers.list") },
      { key: "errorDashboard", label: t("nav.analyzers.errorDashboard") },
    ]},
    { key: "nonConform", label: t("nav.nonConform"), exp: true },
    { key: "workplan", label: t("nav.workplan"), exp: true },
    { key: "pathology", label: t("nav.pathology") },
    { key: "results", label: t("nav.results"), exp: true },
    { key: "validation", label: t("nav.validation"), exp: true },
    { key: "reports", label: t("nav.reports"), exp: true },
    { key: "admin", label: t("nav.admin") },
    { key: "help", label: t("nav.help"), exp: true },
  ];

  const Sidebar = () => (
    <div style={{ width: 224, background: tk.navBg, color: tk.navText, overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, background: tk.headerBg, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: "#2a5a8a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: tk.white, fontWeight: 700 }}>OE</div>
        <div><div style={{ fontSize: 14, fontWeight: 600, color: tk.white }}>Test LIMS</div><div style={{ fontSize: 11, color: tk.g400 }}>{t("app.version")}</div></div>
      </div>
      <div style={{ flex: 1, paddingTop: 8 }}>
        {NAV.map(item => (
          <div key={item.key}>
            <div style={{ padding: `8px 12px 8px 16px`, fontSize: 13, color: item.key === "analyzers" ? tk.navTextActive : tk.navText, background: item.key === "analyzers" ? tk.navActiveBg : "transparent", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: item.key === "analyzers" ? 600 : 400, borderLeft: item.key === "analyzers" ? `3px solid ${tk.blue}` : "3px solid transparent" }}
              onClick={() => item.exp && setExpandedNav(expandedNav === item.key ? null : item.key)}>
              <span>{item.label}</span>
              {item.exp && <span style={{ fontSize: 10, color: tk.g400, transform: expandedNav === item.key ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>}
            </div>
            {item.children && expandedNav === item.key && item.children.map(child => (
              <div key={child.key} style={{ padding: "8px 16px 8px 40px", fontSize: 13, color: child.key === "analyzersList" && view === "list" ? tk.navTextActive : tk.navText, fontWeight: child.key === "analyzersList" && view === "list" ? 600 : 400, cursor: "pointer" }} onClick={() => child.key === "analyzersList" && setView("list")}>{child.label}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════
  // ANALYZER LIST
  // ═════════════════════════════════════════════════════════════════
  const statusBadge = (s) => {
    const colors = { Active: { bg: tk.greenBg, color: tk.green }, Validation: { bg: tk.blueBg, color: tk.blue }, Setup: { bg: tk.yellowBg, color: "#7a5b00" }, Inactive: { bg: tk.g50, color: tk.g600 } };
    const c = colors[s] || colors.Setup;
    return <span style={{ padding: "4px 12px", fontSize: 12, fontWeight: 500, background: c.bg, color: c.color }}>{s}</span>;
  };

  const protocolBadge = (p) => {
    const isHL7 = p.includes("HL7");
    return <span style={{ padding: "3px 8px", fontSize: 11, fontWeight: 500, background: isHL7 ? tk.purpleBg : tk.blueBg, color: isHL7 ? tk.purple : tk.blue, fontFamily: tk.mono }}>{p}</span>;
  };

  const ListView = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 28px", background: tk.white, borderBottom: `1px solid ${tk.g100}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            <span style={{ color: tk.g500 }}>Admin</span><span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span><span>Analyzer Management</span>
          </div>
          <div style={{ fontSize: 13, color: tk.g500 }}>{t("analyzer.list.subtitle")}</div>
        </div>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setShowAddModal(true)}>
          {t("analyzer.list.addAnalyzer")} <span style={{ fontSize: 16 }}>+</span>
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 0, margin: "0 28px", borderBottom: `1px solid ${tk.g100}`, background: tk.white }}>
        {[
          [t("analyzer.list.totalAnalyzers"), ANALYZERS.length, null],
          [t("analyzer.list.active"), ANALYZERS.filter(a => a.status === "Active").length, tk.green],
          ["HL7 v2.3.1", ANALYZERS.filter(a => a.protocol.includes("HL7")).length, tk.purple],
          ["ASTM LIS2-A2", ANALYZERS.filter(a => a.protocol.includes("ASTM")).length, tk.blue],
        ].map(([label, val, color], i) => (
          <div key={i} style={{ flex: 1, padding: "16px 24px", borderRight: i < 3 ? `1px solid ${tk.g100}` : "none" }}>
            <div style={{ fontSize: 12, color: tk.g500, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: color || tk.g900 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ margin: "0 28px", background: tk.white }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
          <span style={{ color: tk.g400 }}>🔍</span>
          <input style={{ border: "none", outline: "none", fontSize: 14, color: tk.g900, flex: 1, background: "transparent" }} placeholder={t("analyzer.list.search")} />
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>
            {["col.name", "col.protocol", "col.connection", "col.testUnits", "col.status", "col.lastMessage", "col.actions"].map(k => (
              <th key={k} style={{ textAlign: "left", padding: "10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 13, color: tk.g900 }}>{t(`analyzer.list.${k}`)}</th>
            ))}
          </tr></thead>
          <tbody>
            {ANALYZERS.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 1 ? tk.g10 : tk.white }}>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                  <div style={{ fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: tk.g500 }}>{a.type} {a.msh3 !== "—" && <span style={{ fontFamily: tk.mono }}>· MSH-3: {a.msh3}</span>}</div>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>{protocolBadge(a.protocol)}</td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 12 }}>{a.connection}</td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>{a.testUnits}</td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>{statusBadge(a.status)}</td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12, color: tk.g500 }}>{a.lastMessage}</td>
                <td style={{ padding: "12px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                  <OverflowMenu items={[
                    { key: "fieldMappings", label: t("analyzer.action.fieldMappings") },
                    { key: "testConnection", label: t("analyzer.action.testConnection") },
                    { key: "copyMappings", label: t("analyzer.action.copyMappings") },
                    { key: "edit", label: t("analyzer.action.edit") },
                    { key: "delete", label: t("analyzer.action.delete"), danger: true },
                  ]} onSelect={(key) => {
                    if (key === "fieldMappings") openMappings(a);
                    else if (key === "delete") setShowDeleteModal(a);
                    else if (key === "edit") { setMsh3Filter(a.msh3 || ""); setShowAddModal(a); }
                  }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════
  // HL7 MAPPINGS VIEW
  // ═════════════════════════════════════════════════════════════════
  const MappingsView = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px", background: tk.white, borderBottom: `1px solid ${tk.g100}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
          <span style={{ cursor: "pointer", fontSize: 16 }} onClick={() => setView("list")}>←</span>
          <span style={{ color: tk.g500 }}>Admin</span>
          <span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span>
          <span style={{ cursor: "pointer", color: tk.blue }} onClick={() => setView("list")}>Analyzer Management</span>
          <span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span>
          <span>{selectedAnalyzer?.name}</span>
          <span style={{ color: tk.g400, fontWeight: 400 }}>{" > "}</span>
          <span>
            {activeTab === "testcodes" && t("mapping.tab.testCodes")}
            {activeTab === "qcrules" && t("mapping.tab.qcRules")}
            {activeTab === "ackconfig" && t("mapping.tab.ackConfig")}
            {activeTab === "simulator" && t("mapping.tab.simulator")}
            {activeTab === "preview" && t("mapping.tab.preview")}
            {activeTab === "extraction" && t("mapping.tab.extraction")}
            {activeTab === "advanced" && t("mapping.tab.advanced")}
          </span>
          {selectedAnalyzer && <span style={{ marginLeft: 8 }}>{protocolBadge(selectedAnalyzer.protocol)}</span>}
        </div>
        <div style={{ fontSize: 13, color: tk.g500 }}>{t("mapping.subtitle")}</div>
      </div>

      {/* Warning */}
      {unmappedCount > 0 && (
        <div style={{ margin: "0 28px", padding: "12px 16px", background: tk.yellowBg, borderLeft: `3px solid ${tk.yellow}`, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: tk.yellow, color: tk.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>!</div>
          <div><strong>{t("mapping.warning.required")}</strong> {t("mapping.warning.requiredDesc")}</div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", margin: "0 28px", borderBottom: `1px solid ${tk.g100}`, background: tk.white }}>
        {[
          [t("mapping.stat.totalMappings"), mappings.length, null],
          [t("mapping.stat.requiredMappings"), mappedCount, null],
          [t("mapping.stat.unmappedFields"), unmappedCount, unmappedCount > 0 ? tk.red : null],
        ].map(([label, val, color], i) => (
          <div key={i} style={{ flex: 1, padding: "16px 24px", borderRight: i < 2 ? `1px solid ${tk.g100}` : "none" }}>
            <div style={{ fontSize: 12, color: tk.g500, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 300, color: color || tk.g900 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 28px" }}>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }} onClick={() => { setShowQueryModal(true); setQueryStatus("idle"); setQueryResults([]); }}>{t("mapping.btn.queryAnalyzer")}</button>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}>{t("mapping.btn.testMapping")}</button>
        <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }}>{t("mapping.btn.saveMappings")}</button>
      </div>

      {/* Tabs — HL7: added ACK Config tab */}
      <div style={{ display: "flex", borderBottom: `2px solid ${tk.g100}`, margin: "0 28px", background: tk.white }}>
        {[
          ["testcodes", t("mapping.tab.testCodes")],
          ["qcrules", t("mapping.tab.qcRules")],
          ["ackconfig", t("mapping.tab.ackConfig")],
          ["simulator", t("mapping.tab.simulator")],
          ["preview", t("mapping.tab.preview")],
          ["extraction", t("mapping.tab.extraction")],
          ["advanced", t("mapping.tab.advanced")],
        ].map(([key, label]) => (
          <button key={key} style={{ padding: "12px 20px", fontSize: 13, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? tk.blue : tk.g600, background: "transparent", border: "none", borderBottom: activeTab === key ? `2px solid ${tk.blue}` : "2px solid transparent", cursor: "pointer", marginBottom: -2 }}
            onClick={() => setActiveTab(key)}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ margin: "0 28px", background: tk.white, flex: 1, overflowY: "auto" }}>

        {/* ── TEST CODES ── */}
        {activeTab === "testcodes" && (
          <div style={{ display: "flex" }}>
            <div style={{ flex: "0 0 58%", borderRight: `1px solid ${tk.g100}` }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tk.g100}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{t("mapping.testCodes.title")}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {[t("mapping.testCodes.bulkAdd"), t("mapping.testCodes.importCsv"), t("mapping.testCodes.autoMatch")].map((label, i) => (
                    <button key={i} style={{ padding: "4px 8px", fontSize: 12, background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontWeight: 500 }}
                      onClick={() => i === 0 ? setShowBulkAdd(true) : i === 2 ? showToastMsg("Auto-match found 3 matches") : null}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                <span style={{ color: tk.g400 }}>🔍</span>
                <input style={{ border: "none", outline: "none", fontSize: 13, flex: 1, background: "transparent" }} placeholder={t("mapping.testCodes.search")} />
                <select style={{ padding: "4px 8px", fontSize: 12, border: `1px solid ${tk.g200}`, background: tk.white }}>
                  <option>All</option><option>Mapped</option><option>Unmapped</option><option>Draft</option>
                </select>
              </div>
              <div style={{ overflowY: "auto", maxHeight: 420 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>
                    {[t("mapping.testCodes.col.fieldName"), t("mapping.testCodes.col.valueType"), t("mapping.testCodes.col.unit"), t("mapping.testCodes.col.status")].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "10px 16px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 13 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {mappings.map(m => {
                      const vt = vtColor(m.valueType);
                      return (
                        <tr key={m.id} style={{ background: selectedField === m.id ? tk.blueBg : m.status === "unmapped" ? `${tk.redBg}44` : tk.white, cursor: "pointer" }}
                          onClick={() => setSelectedField(m.id)}>
                          <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                            <div style={{ fontWeight: 500 }}>{m.displayName || m.analyzerCode || "(new)"}</div>
                            <div style={{ fontSize: 11, color: tk.g500, fontFamily: tk.mono }}>{m.analyzerCode}{m.codingSystem ? `^${m.codingSystem}` : ""}</div>
                            {m.oeTestName && <div style={{ fontSize: 11, color: tk.blue, marginTop: 2 }}>→ {m.oeTestName}</div>}
                          </td>
                          <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                            <span style={{ padding: "2px 8px", fontSize: 11, fontWeight: 600, fontFamily: tk.mono, background: vt.bg, color: vt.color }}>{m.valueType}</span>
                            {(() => { const mm = getResultTypeMismatch(m); return mm ? <span style={{ marginLeft: 4, fontSize: 10, color: "#b28600" }} title={`OBX-2 ${mm.obxType} → OE ${mm.oeType}`}>⚠</span> : null; })()}
                          </td>
                          <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 12 }}>{m.unit || "—"}</td>
                          <td style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}` }}>
                            <span style={{ padding: "3px 10px", fontSize: 11, fontWeight: 500, background: m.status === "mapped" ? tk.greenBg : m.status === "unmapped" ? tk.redBg : tk.yellowBg, color: tk.g700 }}>
                              {m.status === "mapped" ? "✓ Mapped" : m.status === "draft" ? "Draft" : "Unmapped"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr><td colSpan={4} style={{ padding: "10px 16px", borderBottom: `1px solid ${tk.g100}`, textAlign: "center" }}>
                      <button style={{ background: "transparent", color: tk.blue, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: "8px 12px" }} onClick={addMapping}>+ {t("mapping.testCodes.addMapping")}</button>
                    </td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "10px 16px", fontSize: 12, color: tk.g500, borderTop: `1px solid ${tk.g100}` }}>
                {mappings.length} codes · {t("mapping.testCodes.mapped")}: {mappedCount} · {t("mapping.testCodes.unmapped")}: {unmappedCount}
              </div>
            </div>

            {/* Right panel — detail */}
            <div style={{ flex: 1 }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${tk.g100}`, fontSize: 15, fontWeight: 600 }}>{t("mapping.summary.title")}</div>
              {!selectedField ? (
                <div style={{ padding: 40, textAlign: "center", color: tk.g500, fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>↙</div>{t("mapping.summary.empty")}
                </div>
              ) : (() => {
                const m = mappings.find(x => x.id === selectedField);
                if (!m) return null;
                const vt = vtColor(m.valueType);
                return (
                  <div style={{ padding: 20 }}>
                    {/* Analyzer code */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.analyzerCode")}</div>
                      <input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, background: tk.white, boxSizing: "border-box", fontFamily: tk.mono }} value={m.analyzerCode}
                        onChange={(e) => { updateMapping(m.id, "analyzerCode", e.target.value); }} placeholder="e.g. WBC" />
                    </div>
                    {/* Display name */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.displayName")}</div>
                      <input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, background: tk.white, boxSizing: "border-box" }} value={m.displayName}
                        onChange={(e) => updateMapping(m.id, "displayName", e.target.value)} placeholder="e.g. White Blood Cell Count" />
                    </div>
                    {/* Value type + coding system */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.valueType")}</div>
                        <select style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={m.valueType}
                          onChange={(e) => updateMapping(m.id, "valueType", e.target.value)}>
                          <option value="NM">NM — Numeric</option>
                          <option value="CE">CE — Coded Element</option>
                          <option value="SN">SN — Structured Numeric</option>
                          <option value="ST">ST — String</option>
                          <option value="TX">TX — Text</option>
                          <option value="FT">FT — Formatted Text</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.codingSystem")}</div>
                        <input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={m.codingSystem}
                          onChange={(e) => updateMapping(m.id, "codingSystem", e.target.value)} placeholder="L" />
                      </div>
                    </div>
                    {/* SN auto-parse info */}
                    {m.valueType === "SN" && (
                      <div style={{ padding: "10px 14px", background: tk.blueBg, marginBottom: 16, fontSize: 12, color: tk.blue, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>ℹ</span>
                        <span>{t("label.hl7.transform.snAutoInfo") || "This test sends Structured Numeric (SN) values. Greater/Less operators are automatically extracted from the SN format."}</span>
                      </div>
                    )}
                    {/* CE value map hint */}
                    {m.valueType === "CE" && m.transform === "PASSTHROUGH" && (
                      <div style={{ padding: "10px 14px", background: tk.yellowBg, marginBottom: 16, fontSize: 12, color: "#7a5b00", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>⚠</span>
                        <span>Coded values will be stored as raw code^text. Consider using Value Map for standardized storage.</span>
                      </div>
                    )}
                    {/* OpenELIS test */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.openelisTest")}</div>
                      {showInlineCreate === m.id ? (
                        <div style={{ border: `1px solid ${tk.blue}`, background: tk.blueBg, padding: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: tk.blue }}>+ {t("mapping.testCodes.createNewTest")}</div>
                          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Test Name *</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} autoFocus value={newTestForm.name} onChange={(e) => setNewTestForm(f => ({ ...f, name: e.target.value, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) }))} /></div>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Code *</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={newTestForm.code} onChange={(e) => setNewTestForm(f => ({ ...f, code: e.target.value }))} /></div>
                          </div>
                          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Result Type</div><select style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={newTestForm.resultType} onChange={(e) => setNewTestForm(f => ({ ...f, resultType: e.target.value }))}><option value="NUMERIC">Numeric</option><option value="CODED">Coded (Select List)</option><option value="TEXT">Text</option></select></div>
                            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Unit</div><input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={newTestForm.unit} onChange={(e) => setNewTestForm(f => ({ ...f, unit: e.target.value }))} /></div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ padding: "8px 16px", fontSize: 12, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }} onClick={doCreateTest} disabled={!newTestForm.name || !newTestForm.code}>Create & Map</button>
                            <button style={{ padding: "8px 16px", fontSize: 12, background: "transparent", color: tk.g600, border: `1px solid ${tk.g200}`, cursor: "pointer" }} onClick={() => setShowInlineCreate(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <TestComboBox value={m.oeTestId} onChange={(v) => updateMapping(m.id, "oeTestId", v)} onCreateNew={(s) => { setNewTestForm({ name: s, code: s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10), resultType: m.valueType === "CE" ? "CODED" : "NUMERIC", unit: m.unit || "", sampleType: "Serum" }); setShowInlineCreate(m.id); }} />
                      )}
                    </div>
                    {/* Result type comparison — OBX-2 vs OE test type */}
                    {m.oeTestId && (() => {
                      const oeTest = OE_TESTS.find(t => t.id === m.oeTestId);
                      const mismatch = getResultTypeMismatch(m);
                      const oeTypeBadge = { NUMERIC: { label: "Numeric", bg: tk.blueBg, color: tk.blue }, CODED: { label: "Coded (Select List)", bg: tk.purpleBg, color: tk.purple }, TEXT: { label: "Text", bg: tk.g50, color: tk.g600 } };
                      const obxBadge = vtColor(m.valueType);
                      const oeBadge = oeTypeBadge[oeTest?.resultType] || oeTypeBadge.TEXT;
                      return (
                        <div style={{ marginBottom: 16, padding: "10px 14px", background: mismatch ? `${tk.yellowBg}` : tk.g10, border: `1px solid ${mismatch ? "#deb95a" : tk.g100}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                            <span style={{ color: tk.g500 }}>{t("mapping.summary.resultType")}:</span>
                            <span style={{ padding: "2px 6px", fontSize: 10, fontWeight: 600, fontFamily: tk.mono, background: obxBadge.bg, color: obxBadge.color }}>{m.valueType}</span>
                            <span style={{ color: tk.g300 }}>→</span>
                            <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 500, background: oeBadge.bg, color: oeBadge.color }}>{oeBadge.label}</span>
                            {!mismatch && <span style={{ color: tk.green, fontSize: 11 }}>✓</span>}
                            {mismatch && <span style={{ color: "#b28600", fontSize: 11, fontWeight: 500 }}>⚠ Mismatch</span>}
                          </div>
                          {mismatch && (
                            <div style={{ fontSize: 11, color: "#7a5b00", marginTop: 6 }}>
                              {t("valueMap.typeMismatch").replace("{obxType}", mismatch.obxType).replace("{oeType}", mismatch.oeType)}
                            </div>
                          )}
                          {!mismatch && oeTest?.resultType === "CODED" && m.transform !== "VALUE_MAP" && (
                            <div style={{ fontSize: 11, color: tk.purple, marginTop: 6 }}>
                              💡 This OpenELIS test uses a select list. Consider switching to the "Value Map" transform to map analyzer codes to select list options.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {/* Transform */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.transform")}</div>
                      <select style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={m.transform}
                        onChange={(e) => updateMapping(m.id, "transform", e.target.value)}>
                        <option value="PASSTHROUGH">{t("transform.passThrough")}</option>
                        <option value="GREATER_LESS_FLAG">{t("transform.greaterLessFlag")}</option>
                        <option value="VALUE_MAP">{t("transform.valueMap")}</option>
                        <option value="THRESHOLD_CLASSIFY">{t("transform.thresholdClassify")}</option>
                        <option value="CODED_LOOKUP">{t("transform.codedLookup")}</option>
                      </select>
                    </div>
                    {/* VALUE MAP EDITOR — inline when transform is VALUE_MAP */}
                    {m.transform === "VALUE_MAP" && (() => {
                      const vm = getValueMap(m.id);
                      const selectList = getSelectListForMapping(m);
                      const hasSelectList = selectList && selectList.length > 0;
                      const mismatch = getResultTypeMismatch(m);
                      return (
                        <div style={{ marginBottom: 16, border: `1px solid ${tk.purple}44`, background: tk.purpleBg + "33", padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: tk.purple }}>{t("valueMap.title")}</div>
                            {hasSelectList && (
                              <button style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, color: tk.purple, background: "transparent", border: `1px solid ${tk.purple}55`, cursor: "pointer" }}
                                onClick={() => autoPopulateFromSelectList(m.id)}>{t("valueMap.autoPopulate")}</button>
                            )}
                          </div>
                          {/* Result type mismatch warning */}
                          {mismatch && (
                            <div style={{ padding: "8px 12px", background: tk.yellowBg, borderLeft: `3px solid #b28600`, fontSize: 12, color: "#7a5b00", marginBottom: 12 }}>
                              ⚠ {t("valueMap.typeMismatch").replace("{obxType}", mismatch.obxType).replace("{oeType}", mismatch.oeType)}
                            </div>
                          )}
                          {/* Context banners */}
                          {m.valueType === "CE" && hasSelectList && (
                            <div style={{ fontSize: 11, color: tk.purple, marginBottom: 8 }}>{t("valueMap.ceHint")}</div>
                          )}
                          {hasSelectList && (
                            <div style={{ padding: "6px 10px", background: tk.greenBg, fontSize: 11, color: tk.green, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                              ✓ {t("valueMap.selectListLinked")} ({selectList.length} options: {selectList.map(o => o.displayValue).join(", ")})
                            </div>
                          )}
                          {m.oeTestId && !hasSelectList && (
                            <div style={{ padding: "8px 12px", background: tk.yellowBg, fontSize: 11, color: "#7a5b00", marginBottom: 12 }}>
                              ⚠ {t("valueMap.selectListEmpty")}
                            </div>
                          )}
                          {!m.oeTestId && (
                            <div style={{ padding: "8px 12px", background: tk.g50, fontSize: 11, color: tk.g500, marginBottom: 12 }}>
                              ℹ {t("valueMap.noTestMapped")}
                            </div>
                          )}
                          {vm.entries.length === 0 && (
                            <div style={{ padding: "12px 16px", background: tk.yellowBg, fontSize: 12, marginBottom: 12 }}>{t("valueMap.noEntries")}</div>
                          )}
                          {/* Mapping rows */}
                          {vm.entries.map((entry, ei) => (
                            <div key={entry.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                {ei === 0 && <div style={{ fontSize: 10, color: tk.g500, marginBottom: 2 }}>{t("valueMap.analyzerValue")}</div>}
                                <input style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: `1px solid ${tk.g200}`, fontFamily: tk.mono, boxSizing: "border-box" }}
                                  placeholder={m.valueType === "CE" ? "e.g. NEG (OBX-5.1)" : "e.g. POS"} value={entry.analyzerValue}
                                  onChange={(e) => updateValueMapEntry(m.id, entry.id, "analyzerValue", e.target.value)} />
                              </div>
                              <div style={{ fontSize: 16, color: tk.g400, paddingTop: ei === 0 ? 14 : 0 }}>→</div>
                              <div style={{ flex: 1 }}>
                                {ei === 0 && <div style={{ fontSize: 10, color: tk.g500, marginBottom: 2 }}>{t("valueMap.openelisValue")}</div>}
                                {hasSelectList ? (
                                  <select style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box",
                                    background: entry.openelisValue && !selectList.some(o => o.displayValue === entry.openelisValue) ? tk.yellowBg : tk.white }}
                                    value={entry.openelisValue}
                                    onChange={(e) => updateValueMapEntry(m.id, entry.id, "openelisValue", e.target.value)}>
                                    <option value="">— Select —</option>
                                    {selectList.map(opt => (
                                      <option key={opt.id} value={opt.displayValue}>{opt.displayValue} ({opt.code})</option>
                                    ))}
                                    {/* If current value isn't in list, show it as orphaned */}
                                    {entry.openelisValue && !selectList.some(o => o.displayValue === entry.openelisValue) && (
                                      <option value={entry.openelisValue} style={{ color: "red" }}>⚠ {entry.openelisValue} (not in select list)</option>
                                    )}
                                  </select>
                                ) : (
                                  <input style={{ width: "100%", padding: "6px 10px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}
                                    placeholder="e.g. Negative" value={entry.openelisValue}
                                    onChange={(e) => updateValueMapEntry(m.id, entry.id, "openelisValue", e.target.value)} />
                                )}
                              </div>
                              <button style={{ background: "none", border: "none", cursor: "pointer", color: tk.red, fontSize: 14, paddingTop: ei === 0 ? 14 : 0 }}
                                onClick={() => deleteValueMapEntry(m.id, entry.id)}>✕</button>
                            </div>
                          ))}
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button style={{ padding: "6px 12px", fontSize: 12, fontWeight: 500, color: tk.purple, background: "transparent", border: `1px solid ${tk.purple}55`, cursor: "pointer" }}
                              onClick={() => addValueMapEntry(m.id)}>+ {t("valueMap.addEntry")}</button>
                            {!hasSelectList && m.oeTestId && (
                              <span style={{ fontSize: 11, color: tk.g400, alignSelf: "center" }}>{t("valueMap.freeTextFallback")}</span>
                            )}
                          </div>
                          {/* Default action */}
                          <div style={{ marginTop: 12, borderTop: `1px solid ${tk.purple}22`, paddingTop: 12 }}>
                            <div style={{ fontSize: 11, color: tk.g600, marginBottom: 4 }}>{t("valueMap.defaultAction")}</div>
                            <select style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}
                              value={vm.defaultAction} onChange={(e) => updateValueMap(m.id, { defaultAction: e.target.value })}>
                              <option value="REJECT">{t("valueMap.defaultAction.reject")}</option>
                              <option value="PASS_THROUGH">{t("valueMap.defaultAction.passThrough")}</option>
                              <option value="DEFAULT">{t("valueMap.defaultAction.default")}</option>
                            </select>
                            {vm.defaultAction === "DEFAULT" && (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 11, color: tk.g600, marginBottom: 2 }}>{t("valueMap.defaultValue")}</div>
                                {hasSelectList ? (
                                  <select style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}
                                    value={vm.defaultValue} onChange={(e) => updateValueMap(m.id, { defaultValue: e.target.value })}>
                                    <option value="">— Select default —</option>
                                    {selectList.map(opt => (
                                      <option key={opt.id} value={opt.displayValue}>{opt.displayValue} ({opt.code})</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input style={{ width: "100%", padding: "6px 10px", fontSize: 12, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}
                                    value={vm.defaultValue} onChange={(e) => updateValueMap(m.id, { defaultValue: e.target.value })} placeholder="Indeterminate" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Units */}
                    <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.analyzerUnit")}</div>
                        <input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={m.unit}
                          onChange={(e) => updateMapping(m.id, "unit", e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("mapping.summary.openelisUnit")}</div>
                        <input style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={m.oeUnit} readOnly />
                      </div>
                    </div>
                    {/* Delete */}
                    <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 16 }}>
                      <button style={{ padding: "8px 16px", fontSize: 12, fontWeight: 500, background: "transparent", color: tk.red, border: `1px solid ${tk.red}`, cursor: "pointer" }} onClick={() => { deleteMapping(m.id); setSelectedField(null); }}>Delete Mapping</button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── QC RULES ── */}
        {activeTab === "qcrules" && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("qc.title")}</div>
            <div style={{ fontSize: 13, color: tk.g500, marginBottom: 16 }}>{t("qc.description")}</div>
            {qcRules.length === 0 && (
              <div style={{ padding: "16px 20px", background: tk.yellowBg, borderLeft: `3px solid ${tk.yellow}`, fontSize: 13, marginBottom: 16 }}>{t("qc.noRules")}</div>
            )}
            {qcRules.map((rule, i) => (
              <div key={rule.id} style={{ padding: 16, border: `1px solid ${tk.g100}`, marginBottom: 12, background: tk.g10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Rule {i + 1}</span>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: tk.red, fontSize: 16 }}
                    onClick={() => setQcRules(prev => prev.filter(r => r.id !== rule.id))}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("qc.ruleType.fieldEquals").split(" ")[0]} Type</div>
                    <select style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={rule.type}
                      onChange={(e) => setQcRules(prev => prev.map(r => r.id === rule.id ? { ...r, type: e.target.value } : r))}>
                      <option value="specimenIdPrefix">{t("qc.ruleType.specimenIdPrefix")}</option>
                      <option value="specimenIdRegex">{t("qc.ruleType.specimenIdRegex")}</option>
                      <option value="fieldEquals">{t("qc.ruleType.fieldEquals")}</option>
                      <option value="fieldContains">{t("qc.ruleType.fieldContains")}</option>
                      <option value="patientNamePattern">{t("qc.ruleType.patientNamePattern")}</option>
                    </select>
                  </div>
                  {(rule.type === "fieldEquals" || rule.type === "fieldContains") && (
                    <div style={{ minWidth: 160 }}>
                      <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("qc.fieldRef")}</div>
                      <select style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={rule.field}
                        onChange={(e) => setQcRules(prev => prev.map(r => r.id === rule.id ? { ...r, field: e.target.value } : r))}>
                        <optgroup label="MSH — Message Header"><option value="MSH-3">MSH-3 Sending App</option><option value="MSH-11">MSH-11 Processing ID</option></optgroup>
                        <optgroup label="PID — Patient Identification"><option value="PID-3">PID-3 Patient ID</option><option value="PID-5">PID-5 Patient Name</option><option value="PID-8">PID-8 Sex</option></optgroup>
                        <optgroup label="OBR — Observation Request"><option value="OBR-2">OBR-2 Placer Order #</option><option value="OBR-4">OBR-4 Service ID</option><option value="OBR-15">OBR-15 Specimen Source</option><option value="OBR-24">OBR-24 Diag Service</option></optgroup>
                        <optgroup label="OBX — Observation/Result"><option value="OBX-3">OBX-3 Obs Identifier</option><option value="OBX-8">OBX-8 Abnormal Flag</option><option value="OBX-11">OBX-11 Result Status</option></optgroup>
                      </select>
                    </div>
                  )}
                  <div style={{ minWidth: 200, flex: 1 }}>
                    <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("qc.matchValue")}</div>
                    <input style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} value={rule.value}
                      onChange={(e) => setQcRules(prev => prev.map(r => r.id === rule.id ? { ...r, value: e.target.value } : r))}
                      placeholder={rule.type === "patientNamePattern" ? ".*QC Control.*" : rule.type === "specimenIdPrefix" ? "CTRL-" : ""} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}
                onClick={() => setQcRules(prev => [...prev, { id: `qc${Date.now()}`, type: "specimenIdPrefix", field: "OBR-2", value: "" }])}>+ {t("qc.addRule")}</button>
              <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.white, color: tk.g600, border: `1px solid ${tk.g200}`, cursor: "pointer" }}>{t("qc.testRules")}</button>
            </div>
          </div>
        )}

        {/* ── ACK CONFIG (HL7-only tab) ── */}
        {activeTab === "ackconfig" && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("label.hl7.ack.title")}</div>
            <div style={{ fontSize: 13, color: tk.g500, marginBottom: 20 }}>Configure how OpenELIS acknowledges received HL7 messages from this analyzer.</div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.ack.mode")}</div>
              <select style={{ width: 360, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={ackMode}
                onChange={(e) => setAckMode(e.target.value)}>
                {ACK_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <div style={{ padding: "10px 14px", background: tk.blueBg, marginTop: 8, fontSize: 12, color: tk.blue, maxWidth: 500 }}>
                ℹ {ACK_MODES.find(m => m.value === ackMode)?.help}
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.ack.sendingApp")}</div>
                <input style={{ width: 200, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="OpenELIS" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.ack.delayMs")}</div>
                <input type="number" style={{ width: 120, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="0" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.ack.includeErrorDetail")}</div>
                <select style={{ width: 100, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}>
                  <option value="true">On</option><option value="false">Off</option>
                </select>
              </div>
            </div>

            {/* Dedup section */}
            <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Duplicate Detection</div>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.ack.dedupEnabled")}</div>
                  <select style={{ width: 120, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={dedupEnabled ? "on" : "off"}
                    onChange={(e) => setDedupEnabled(e.target.value === "on")}>
                    <option value="on">On</option><option value="off">Off</option>
                  </select>
                </div>
                {dedupEnabled && (
                  <div>
                    <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.ack.dedupWindowMinutes")}</div>
                    <input type="number" style={{ width: 120, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="60" />
                  </div>
                )}
              </div>
              {dedupEnabled && (
                <div style={{ fontSize: 12, color: tk.g500, marginTop: 8 }}>
                  If MSH-10 (Message Control ID) has been seen within the dedup window, OpenELIS responds with AA but does not re-import results.
                </div>
              )}
            </div>

            {/* ACK template preview */}
            <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 20, marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>ACK Template Preview</div>
              <div style={{ fontFamily: tk.mono, fontSize: 12, background: tk.g50, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.6, border: `1px solid ${tk.g100}` }}>
{`MSH|^~\\&|OpenELIS||{MSH-3}|{MSH-4}|{timestamp}||ACK^R01|{ACK-ID}|P|2.3.1
MSA|${ackMode === "NEVER" ? "—" : ackMode === "ALWAYS_ACCEPT" ? "AA" : "{AA|AE|AR}"}|{MSH-10}|{error text}`}
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGE SIMULATOR ── */}
        {activeTab === "simulator" && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("simulator.title")}</div>
            <div style={{ fontSize: 13, color: tk.g500, marginBottom: 16 }}>{t("simulator.paste")}</div>
            <textarea style={{ width: "100%", minHeight: 120, padding: 12, fontSize: 12, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, resize: "vertical", boxSizing: "border-box", background: tk.g10, lineHeight: 1.5 }}
              placeholder={`MSH|^~\\&|BC-5380||OpenELIS||20260227120000||ORU^R01|MSG001|P|2.3.1\nPID|1||LAB-2026-001^^^L||Smith^John||19850315|M\nOBR|1|LAB-2026-001||CBC^Complete Blood Count^L\nOBX|1|NM|WBC^White Blood Cell Count^L||7.5|10*3/uL|4.0-11.0|N\nOBX|2|NM|RBC^Red Blood Cell Count^L||4.85|10*6/uL|4.5-5.5|N`}
              value={simMessage} onChange={(e) => setSimMessage(e.target.value)} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={{ padding: "8px 16px", fontSize: 13, background: tk.white, color: tk.g600, border: `1px solid ${tk.g200}`, cursor: "pointer" }} onClick={() => { setSimMessage(""); setSimResult(null); }}>{t("simulator.clear")}</button>
              <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }} onClick={runSimulator}>{t("simulator.parse")} ▶</button>
            </div>
            {!simResult && (
              <div style={{ padding: 30, textAlign: "center", color: tk.g400, fontSize: 13, marginTop: 16 }}>{t("simulator.empty")}</div>
            )}
            {simResult?.error && (
              <div style={{ padding: "12px 16px", background: tk.redBg, borderLeft: `3px solid ${tk.red}`, marginTop: 16, fontSize: 13, color: tk.red }}>{simResult.error}</div>
            )}
            {simResult && !simResult.error && (
              <div style={{ marginTop: 16 }}>
                <div style={{ padding: "12px 16px", background: simResult.warnings > 0 ? tk.yellowBg : tk.greenBg, borderLeft: `3px solid ${simResult.warnings > 0 ? tk.yellow : tk.green}`, fontSize: 13, marginBottom: 16 }}>
                  {simResult.warnings > 0 ? `⚠ Parsed with ${simResult.warnings} warning(s)` : "✓ HL7 message parsed successfully"}
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16, fontSize: 13 }}>
                  <div><span style={{ color: tk.g500 }}>Instrument (MSH-3):</span> <strong>{simResult.sendingApp}</strong></div>
                  <div><span style={{ color: tk.g500 }}>Message ID (MSH-10):</span> <strong style={{ fontFamily: tk.mono }}>{simResult.messageId}</strong></div>
                  <div><span style={{ color: tk.g500 }}>Specimen (OBR-2):</span> <strong style={{ fontFamily: tk.mono }}>{simResult.specimen}</strong></div>
                  {simResult.panelName && <div><span style={{ color: tk.g500 }}>Panel (OBR-4):</span> <strong>{simResult.panelCode} — {simResult.panelName}</strong></div>}
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr>
                    {["Code (OBX-3)", "Type", "OpenELIS Test", "Value", "Units", "Ref Range", "Flag", "Transform"].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "8px 12px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {simResult.results.map((r, i) => {
                      const vt = vtColor(r.valueType);
                      return (
                        <tr key={i} style={{ background: r.status === "unmatched" ? `${tk.redBg}44` : tk.white }}>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 12 }}>{r.code}</td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}` }}>
                            <span style={{ padding: "1px 6px", fontSize: 10, fontWeight: 600, fontFamily: tk.mono, background: vt.bg, color: vt.color }}>{r.valueType}</span>
                          </td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, color: r.status === "unmatched" ? tk.red : tk.g900, fontWeight: r.status === "unmatched" ? 500 : 400 }}>{r.oeName}</td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono }}>{r.value}</td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12 }}>{r.units}</td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12, fontFamily: tk.mono }}>{r.refRange}</td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}` }}>
                            {r.flag && <span style={{ padding: "2px 8px", fontSize: 11, background: r.flag === "N" || !r.flag ? tk.greenBg : tk.redBg, fontWeight: 500 }}>{r.flag || "N"}</span>}
                          </td>
                          <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12, color: tk.g500 }}>{r.transform === "PASSTHROUGH" || r.transform === "—" ? "—" : r.transform}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* ACK Preview */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("simulator.ackPreview")}</div>
                  <div style={{ fontFamily: tk.mono, fontSize: 12, background: tk.g50, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.6, border: `1px solid ${tk.g100}` }}>
                    {simResult.ackMessage}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <span style={{ padding: "3px 10px", fontWeight: 500, background: simResult.ackCode === "AA" ? tk.greenBg : tk.redBg, color: tk.g700 }}>
                      {simResult.ackCode === "AA" ? "✓ Application Accept" : simResult.ackCode === "AE" ? "⚠ Application Error" : "✕ Application Reject"}
                      {simResult.ackCode === "AA" && " — all codes mapped"}
                      {simResult.ackCode === "AE" && ` — ${simResult.warnings} unmapped code(s)`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PREVIEW (Import Simulation + Parse Log) ── */}
        {activeTab === "preview" && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("preview.title")}</div>
            <div style={{ fontSize: 13, color: tk.g500, marginBottom: 16 }}>{t("preview.description")}</div>

            {/* Input area */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
              <label style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                📄 {t("preview.uploadFile")}
                <input type="file" accept=".hl7,.txt" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => { setPreviewMessage(ev.target.result); setPreviewResult(null); };
                      reader.readAsText(file);
                    }
                  }} />
              </label>
              <span style={{ fontSize: 12, color: tk.g400 }}>{t("preview.orPaste")}</span>
            </div>
            <textarea style={{ width: "100%", minHeight: 100, padding: 12, fontSize: 12, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, resize: "vertical", boxSizing: "border-box", background: tk.g10, lineHeight: 1.5 }}
              placeholder={`MSH|^~\\&|BC-5380||OpenELIS||20260227120000||ORU^R01|MSG001|P|2.3.1\nPID|1||PAT-001^^^L||Smith^John||19850315|M\nOBR|1|LAB-2026-001||CBC^Complete Blood Count^L\nOBX|1|NM|WBC^White Blood Cell Count^L||7.5|10*3/uL|4.0-11.0|N||F\nOBX|2|NM|RBC^Red Blood Cell Count^L||4.85|10*6/uL|4.5-5.5|N||F\nOBX|3|NM|HGB^Hemoglobin^L||14.2|g/dL|12.0-16.0|N||F\nOBX|4|CE|HIVAG^HIV Ag/Ab Combo^L||NEG^Negative|||N||F`}
              value={previewMessage} onChange={(e) => setPreviewMessage(e.target.value)} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button style={{ padding: "8px 16px", fontSize: 13, background: tk.white, color: tk.g600, border: `1px solid ${tk.g200}`, cursor: "pointer" }}
                onClick={() => { setPreviewMessage(""); setPreviewResult(null); }}>{t("preview.clear")}</button>
              <button style={{ padding: "8px 16px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer" }}
                onClick={runPreview} disabled={previewRunning || !previewMessage.trim()}>
                {previewRunning ? t("preview.running") : t("preview.run")} {!previewRunning && "▶"}
              </button>
            </div>

            {/* Error state */}
            {previewResult?.error && (
              <div style={{ padding: "12px 16px", background: tk.redBg, borderLeft: `3px solid ${tk.red}`, marginTop: 16, fontSize: 13, color: tk.red }}>{previewResult.error}</div>
            )}

            {/* Results */}
            {previewResult && !previewResult.error && (
              <div style={{ marginTop: 20 }}>
                {/* Summary cards */}
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("preview.result.title")}</div>
                <div style={{ display: "flex", gap: 0, marginBottom: 16, border: `1px solid ${tk.g100}` }}>
                  {[
                    [t("preview.result.specimens"), previewResult.specimens.length, null],
                    [t("preview.result.testsMatched"), previewResult.matchedCount, tk.green],
                    [t("preview.result.testsUnmatched"), previewResult.unmatchedCount, previewResult.unmatchedCount > 0 ? "#b28600" : null],
                    [t("preview.result.qcDetected"), previewResult.qcCount, previewResult.qcCount > 0 ? tk.purple : null],
                    [t("preview.result.errors"), previewResult.errorCount, previewResult.errorCount > 0 ? tk.red : null],
                  ].map(([label, val, color], i) => (
                    <div key={i} style={{ flex: 1, padding: "12px 16px", borderRight: i < 4 ? `1px solid ${tk.g100}` : "none", background: tk.white }}>
                      <div style={{ fontSize: 11, color: tk.g500, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 300, color: color || tk.g900 }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Results table */}
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("preview.importTable.title")}</div>
                <div style={{ overflowX: "auto", marginBottom: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 800 }}>
                    <thead><tr>
                      {[
                        t("preview.importTable.specimen"), t("preview.importTable.code"), t("preview.importTable.valueType"),
                        t("preview.importTable.oeName"), t("preview.importTable.rawValue"), t("preview.importTable.transformedValue"),
                        t("preview.importTable.units"), t("preview.importTable.flag"), t("preview.importTable.qc"), t("preview.importTable.status"),
                      ].map((h, i) => (
                        <th key={i} style={{ textAlign: "left", padding: "8px 10px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {previewResult.results.map((r, i) => {
                        const vt = vtColor(r.valueType);
                        const rowBg = r.status === "error" ? `${tk.redBg}66` : r.status === "unmapped" ? `${tk.yellowBg}66` : tk.white;
                        return (
                          <tr key={i} style={{ background: rowBg }}>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 11 }}>{r.specimen}</td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                              <div style={{ fontFamily: tk.mono, fontWeight: 600, fontSize: 12 }}>{r.code}</div>
                              {r.displayName && <div style={{ fontSize: 10, color: tk.g500 }}>{r.displayName}</div>}
                            </td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                              <span style={{ padding: "1px 6px", fontSize: 10, fontWeight: 600, fontFamily: tk.mono, background: vt.bg, color: vt.color }}>{r.valueType}</span>
                            </td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}`, fontWeight: r.status === "unmapped" ? 500 : 400, color: r.status === "unmapped" ? tk.red : tk.g900 }}>{r.oeName}</td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono }}>{r.rawValue}</td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontWeight: r.rawValue !== r.transformedValue ? 600 : 400, color: r.rawValue !== r.transformedValue ? tk.blue : tk.g900 }}>{r.transformedValue}</td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}`, fontSize: 11 }}>{r.units}</td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                              {r.flag && <span style={{ padding: "2px 6px", fontSize: 10, background: r.flag === "N" || !r.flag ? tk.greenBg : r.flag === "H" || r.flag === "HH" ? tk.redBg : tk.yellowBg, fontWeight: 500 }}>{r.flag}</span>}
                            </td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                              {r.isQC && <span style={{ padding: "2px 6px", fontSize: 10, background: tk.purpleBg, color: tk.purple, fontWeight: 500 }}>QC</span>}
                            </td>
                            <td style={{ padding: "7px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                              <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 500,
                                background: r.status === "ok" ? tk.greenBg : r.status === "unmapped" ? tk.yellowBg : tk.redBg,
                                color: r.status === "ok" ? tk.green : r.status === "unmapped" ? "#7a5b00" : tk.red }}>
                                {r.statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Parse Log */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t("preview.log.title")}</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["ALL", "INFO", "WARN", "ERROR", "DEBUG"].map(level => (
                      <button key={level} style={{
                        padding: "3px 10px", fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none",
                        background: previewLogFilter === level ? tk.blue : tk.g50,
                        color: previewLogFilter === level ? tk.white : tk.g600,
                      }} onClick={() => setPreviewLogFilter(level)}>{level}</button>
                    ))}
                  </div>
                </div>
                <div style={{ border: `1px solid ${tk.g100}`, background: tk.g10, maxHeight: 300, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr>
                      {[t("preview.log.timestamp"), t("preview.log.level"), t("preview.log.field"), t("preview.log.message")].map((h, i) => (
                        <th key={i} style={{ textAlign: "left", padding: "6px 10px", background: tk.g50, borderBottom: `1px solid ${tk.g100}`, fontWeight: 600, fontSize: 11, position: "sticky", top: 0 }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {previewResult.log
                        .filter(entry => previewLogFilter === "ALL" || entry.level === previewLogFilter)
                        .map((entry, i) => {
                          const levelColors = { INFO: { bg: tk.blueBg, color: tk.blue }, WARN: { bg: tk.yellowBg, color: "#7a5b00" }, ERROR: { bg: tk.redBg, color: tk.red }, DEBUG: { bg: tk.g50, color: tk.g500 } };
                          const lc = levelColors[entry.level] || levelColors.DEBUG;
                          return (
                            <tr key={i} style={{ background: entry.level === "ERROR" ? `${tk.redBg}44` : "transparent" }}>
                              <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 11, color: tk.g400, width: 40 }}>{entry.step}</td>
                              <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, width: 60 }}>
                                <span style={{ padding: "1px 6px", fontSize: 10, fontWeight: 600, background: lc.bg, color: lc.color }}>{entry.level}</span>
                              </td>
                              <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 11, color: tk.g500, width: 100 }}>{entry.ref}</td>
                              <td style={{ padding: "5px 10px", borderBottom: `1px solid ${tk.g100}`, fontSize: 12 }}>{entry.message}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: tk.g400 }}>
                  {previewResult.log.length} log entries · Showing: {previewLogFilter === "ALL" ? "all" : previewLogFilter} ({previewResult.log.filter(e => previewLogFilter === "ALL" || e.level === previewLogFilter).length} entries)
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FIELD EXTRACTION ── */}
        {activeTab === "extraction" && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{t("extraction.title")}</div>
            <div style={{ padding: "10px 14px", background: tk.blueBg, fontSize: 12, color: tk.blue, marginBottom: 20 }}>
              ℹ {t("extraction.info")}
            </div>
            {[
              ["Specimen ID Field", "OBR-2", "label.hl7.extract.specimenIdField"],
              ["Test Code Field", "OBX-3", "label.hl7.extract.testCodeField"],
              ["Test Code Component", "1", "label.hl7.extract.testCodeComponent"],
              ["Test Display Name Component", "2", "label.hl7.extract.testDisplayComponent"],
              ["Result Value Field", "OBX-5", "label.hl7.extract.resultValueField"],
              ["Value Type Field", "OBX-2", "label.hl7.extract.valueTypeField"],
              ["Result Units Field", "OBX-6", "label.hl7.extract.resultUnitsField"],
              ["Units Component", "1", "label.hl7.extract.unitsComponent"],
              ["Abnormal Flag Field", "OBX-8", "label.hl7.extract.abnormalFlagField"],
              ["Result Status Field", "OBX-11", "label.hl7.extract.resultStatusField"],
              ["Result Timestamp Field", "OBX-14", "label.hl7.extract.resultTimestampField"],
              ["Sender Application Field", "MSH-3", "label.hl7.extract.senderAppField"],
              ["Patient ID Field", "PID-3", "label.hl7.extract.patientIdField"],
              ["Patient ID Component", "1", "label.hl7.extract.patientIdComponent"],
            ].map(([label, defaultVal, tag], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 220, fontSize: 13, color: tk.g700 }}>{label}</div>
                <input style={{ width: 120, padding: "8px 12px", fontSize: 13, border: `1px solid ${tk.g200}`, fontFamily: tk.mono, boxSizing: "border-box" }} placeholder={defaultVal} />
                <span style={{ fontSize: 11, color: tk.g400 }}>default: {defaultVal}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── ADVANCED ── */}
        {activeTab === "advanced" && (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Advanced Configuration</div>
            {/* Aggregation */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Result Aggregation</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Aggregation Mode</div>
                  <select style={{ width: 280, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}>
                    <option>Per Message (default)</option>
                    <option>Aggregate by Specimen ID (OBR-2)</option>
                    <option>Separate by OBR Panel Group</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Time Window (seconds)</div>
                  <input type="number" style={{ width: 120, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="30" />
                </div>
              </div>
            </div>
            {/* Auto-detect */}
            <div style={{ marginBottom: 24, borderTop: `1px solid ${tk.g100}`, paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Auto-Detect Test Codes</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Auto-detect unmapped codes</div>
                  <select style={{ width: 120, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}>
                    <option>Off</option><option>On</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>Max pending codes</div>
                  <input type="number" style={{ width: 120, padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="100" />
                </div>
              </div>
            </div>
            {/* Abnormal flags */}
            <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Abnormal Flag Mapping (OBX-8)</div>
              <table style={{ borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>OBX-8 Flag</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600 }}>OpenELIS Interpretation</th>
                </tr></thead>
                <tbody>
                  {[
                    ["N", "Normal"], ["L", "Low"], ["H", "High"], ["LL", "Critical Low"], ["HH", "Critical High"],
                    ["A", "Abnormal"], ["AA", "Very Abnormal"], ["<", "Below Low Normal"], [">", "Above High Normal"], ["(empty)", "Normal"],
                  ].map(([flag, interp], i) => (
                    <tr key={i}>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontWeight: 600 }}>{flag}</td>
                      <td style={{ padding: "8px 12px", borderBottom: `1px solid ${tk.g100}` }}>{interp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button style={{ marginTop: 8, padding: "6px 12px", fontSize: 12, color: tk.blue, background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}>+ Add Custom Flag</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════
  // MODAL RENDERER
  // ═════════════════════════════════════════════════════════════════
  const Modal = ({ title, onClose, children, footer, wide }) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(22,22,22,0.55)", zIndex: 800, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: tk.white, width: wide ? 640 : 560, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 16px 48px rgba(0,0,0,.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
          <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: tk.g600 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "0 24px 24px", flex: 1, overflowY: "auto" }}>{children}</div>
        <div style={{ display: "flex" }}>{footer}</div>
      </div>
    </div>
  );

  const FooterBtn = ({ label, onClick, kind = "primary" }) => {
    const bg = kind === "cancel" ? tk.g700 : kind === "danger" ? tk.red : tk.blue;
    return <button style={{ flex: 1, padding: "16px 24px", fontSize: 14, fontWeight: 500, background: bg, color: tk.white, border: "none", cursor: "pointer", textAlign: "left" }} onClick={onClick}>{label}</button>;
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", fontFamily: tk.font, fontSize: 14, color: tk.g900, minHeight: "100vh", background: tk.g50 }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <div style={{ background: tk.headerBg, height: 48, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 20px", gap: 16 }}>
          {["🔍","🔔","👤","❓"].map((ic,i) => <span key={i} style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: tk.g300, cursor: "pointer", fontSize: 16 }}>{ic}</span>)}
        </div>
        {view === "list" ? <ListView /> : <MappingsView />}
      </div>

      {/* Add/Edit HL7 Analyzer Modal — MLLP config */}
      {showAddModal && (
        <Modal wide title={typeof showAddModal === "object" ? t("analyzer.modal.editTitle") : t("analyzer.modal.addTitle")} onClose={() => setShowAddModal(false)}
          footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowAddModal(false)} /><FooterBtn label={t("analyzer.modal.save")} onClick={() => { setShowAddModal(false); showToastMsg("Analyzer saved"); }} /></>}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.name")}</div>
            <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder={t("analyzer.modal.namePlaceholder")} defaultValue={typeof showAddModal === "object" ? showAddModal.name : ""} />
          </div>
          {/* Status */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.status")}</div>
            <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue={typeof showAddModal === "object" ? showAddModal.status : "Setup"}>
              <option>Setup</option><option>Active</option><option>Inactive</option><option>Validation</option>
            </select>
          </div>
          {/* Plugin / type / protocol row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.pluginType")}</div><select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}><option>Generic HL7</option><option>Generic ASTM</option><option>Mindray BC-5380</option></select></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.analyzerType")}</div><select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}><option>Hematology</option><option>Chemistry</option><option>Immunology</option></select></div>
          </div>
          <div style={{ marginBottom: 16 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("analyzer.modal.protocolVersion")}</div>
            <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}><option>HL7 v2.3.1</option><option>ASTM LIS2-A2</option></select>
          </div>

          {/* HL7 MLLP section */}
          <div style={{ borderTop: `1px solid ${tk.g100}`, paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: tk.purple }}>MLLP Connection Configuration</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.connectionRole")}</div>
              <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={connectionRole} onChange={(e) => setConnectionRole(e.target.value)}>
                <option value="server">{t("label.hl7.connectionRole.server")}</option>
                <option value="client">{t("label.hl7.connectionRole.client")}</option>
              </select>
            </div>

            {connectionRole === "server" ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.listenerMode")}</div>
                  <select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} value={listenerMode} onChange={(e) => setListenerMode(e.target.value)}>
                    <option value="shared">{t("label.hl7.listenerMode.shared")}</option>
                    <option value="dedicated">{t("label.hl7.listenerMode.dedicated")}</option>
                  </select>
                </div>
                {listenerMode === "shared" ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.senderAppFilter")}</div>
                    <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box", fontFamily: tk.mono }} placeholder="e.g. BC-5380" value={msh3Filter} onChange={(e) => setMsh3Filter(e.target.value)} />
                    <div style={{ fontSize: 11, color: tk.g500, marginTop: 4 }}>{t("label.hl7.senderAppFilter.help")}</div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.listenPort")}</div>
                    <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="5001" />
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.senderFacilityFilter")}</div>
                  <input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="(optional)" />
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.analyzerIpAddress")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="192.168.1.10" /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.analyzerPort")}</div><input style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} placeholder="5000" /></div>
              </div>
            )}

            {/* Connection settings row */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 120 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.connectionTimeout")}</div><input type="number" style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="30" /></div>
              <div style={{ flex: 1, minWidth: 120 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.idleTimeout")}</div><input type="number" style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="300" /><div style={{ fontSize: 10, color: tk.g400, marginTop: 2 }}>0 = keep alive</div></div>
              <div style={{ flex: 1, minWidth: 100 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.maxConnections")}</div><input type="number" style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }} defaultValue="5" /></div>
              <div style={{ flex: 1, minWidth: 120 }}><div style={{ fontSize: 12, color: tk.g600, marginBottom: 4 }}>{t("label.hl7.characterEncoding")}</div><select style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: `1px solid ${tk.g200}`, boxSizing: "border-box" }}><option>UTF-8</option><option>ISO-8859-1</option><option>ASCII</option></select></div>
            </div>

            {/* Bidirectional toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: tk.g600 }}>{t("label.hl7.bidirectionalEnabled")}</div>
              <select style={{ padding: "6px 10px", fontSize: 13, border: `1px solid ${tk.g200}` }}><option>Off</option><option>On</option></select>
            </div>
            <div style={{ fontSize: 11, color: tk.g500, marginBottom: 16 }}>{t("label.hl7.bidirectional.help")}</div>
          </div>

          <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}>{t("label.hl7.testConnection")}</button>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <Modal title={t("delete.title")} onClose={() => setShowDeleteModal(null)}
          footer={<><FooterBtn label={t("delete.cancel")} kind="cancel" onClick={() => setShowDeleteModal(null)} /><FooterBtn label={t("delete.delete")} kind="danger" onClick={() => { setShowDeleteModal(null); showToastMsg("Analyzer deleted"); }} /></>}>
          <p style={{ fontSize: 14, color: tk.g700, lineHeight: 1.5 }}>{t("delete.confirm").replace("{name}", showDeleteModal.name)}</p>
        </Modal>
      )}

      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <Modal title={t("mapping.testCodes.bulkAdd")} onClose={() => setShowBulkAdd(false)}
          footer={<><FooterBtn label={t("analyzer.modal.cancel")} kind="cancel" onClick={() => setShowBulkAdd(false)} /><FooterBtn label="Add Codes" onClick={doBulkAdd} /></>}>
          <div style={{ fontSize: 13, color: tk.g600, marginBottom: 8 }}>Paste HL7 OBX-3.1 test codes (one per line):</div>
          <textarea style={{ width: "100%", minHeight: 140, padding: 12, fontSize: 13, fontFamily: tk.mono, border: `1px solid ${tk.g200}`, resize: "vertical", boxSizing: "border-box" }}
            placeholder={"WBC\nRBC\nHGB\nHCT\nPLT\nMCV\nMCH\nMCHC"} value={bulkText} onChange={(e) => setBulkText(e.target.value)} autoFocus />
          {bulkText.trim() && <div style={{ marginTop: 8, fontSize: 12, color: tk.g600 }}>{bulkText.split("\n").filter(l => l.trim()).length} codes will be added as unmapped rows.</div>}
        </Modal>
      )}

      {/* Query Analyzer Modal — HL7 QRY^R02 */}
      {showQueryModal && (
        <Modal wide title={t("query.title")} onClose={() => setShowQueryModal(false)}
          footer={<>
            <FooterBtn label={t("query.close")} kind="cancel" onClick={() => setShowQueryModal(false)} />
            {queryStatus === "success" && querySelected.size > 0 && (
              <FooterBtn label={`${t("query.addSelected")} (${querySelected.size})`} onClick={addSelectedFromQuery} />
            )}
          </>}>
          <div style={{ fontSize: 13, color: tk.g600, marginBottom: 16 }}>{t("query.description")}</div>

          {/* Status / action bar */}
          {queryStatus === "idle" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: "10px 14px", background: tk.blueBg, fontSize: 12, color: tk.blue, flex: 1 }}>
                ℹ {t("query.statusIdle")}
              </div>
              <button style={{ padding: "10px 20px", fontSize: 13, fontWeight: 500, background: tk.blue, color: tk.white, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                onClick={runQueryAnalyzer}>{t("query.send")} ▶</button>
            </div>
          )}
          {queryStatus === "querying" && (
            <div style={{ padding: "16px 20px", background: tk.blueBg, textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: tk.blue, marginBottom: 4 }}>⟳ {t("query.statusQuerying")}</div>
              <div style={{ width: "100%", height: 3, background: tk.g100, overflow: "hidden" }}>
                <div style={{ width: "40%", height: "100%", background: tk.blue, animation: "none" }} />
              </div>
            </div>
          )}
          {queryStatus === "failed" && (
            <div style={{ padding: "12px 16px", background: tk.redBg, borderLeft: `3px solid ${tk.red}`, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{t("query.statusFailed")}</span>
              <button style={{ padding: "6px 14px", fontSize: 12, background: tk.white, color: tk.blue, border: `1px solid ${tk.blue}`, cursor: "pointer" }}
                onClick={runQueryAnalyzer}>Retry</button>
            </div>
          )}
          {queryStatus === "success" && (
            <>
              <div style={{ padding: "10px 14px", background: tk.greenBg, borderLeft: `3px solid ${tk.green}`, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>✓ {t("query.statusSuccess").replace("{count}", queryResults.length)}</span>
                <button style={{ padding: "4px 10px", fontSize: 12, color: tk.blue, background: "transparent", border: "none", cursor: "pointer", fontWeight: 500 }}
                  onClick={() => {
                    const newCodes = queryResults.filter(r => !isCodeAlreadyMapped(r.code));
                    setQuerySelected(new Set(newCodes.map(r => r.code)));
                  }}>{t("query.addAll")} ({queryResults.filter(r => !isCodeAlreadyMapped(r.code)).length} new)</button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t("query.discovered")}</div>
              <div style={{ maxHeight: 340, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr>
                    <th style={{ width: 32, padding: "8px 6px", background: tk.g50, borderBottom: `2px solid ${tk.g100}` }}></th>
                    {[t("query.col.code"), t("query.col.displayName"), t("query.col.codingSystem"), t("query.col.valueType"), t("query.col.units"), t("query.col.status")].map((h, i) => (
                      <th key={i} style={{ textAlign: "left", padding: "8px 10px", background: tk.g50, borderBottom: `2px solid ${tk.g100}`, fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {queryResults.map((r) => {
                      const already = isCodeAlreadyMapped(r.code);
                      const selected = querySelected.has(r.code);
                      const vt = vtColor(r.valueType);
                      return (
                        <tr key={r.code} style={{ background: already ? tk.g50 : selected ? tk.blueBg : tk.white, opacity: already ? 0.6 : 1 }}>
                          <td style={{ padding: "6px 6px", borderBottom: `1px solid ${tk.g100}`, textAlign: "center" }}>
                            <input type="checkbox" checked={selected} disabled={already}
                              onChange={() => toggleQuerySelect(r.code)}
                              style={{ accentColor: tk.blue }} />
                          </td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontWeight: 600 }}>{r.code}</td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${tk.g100}` }}>{r.displayName}</td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 11 }}>{r.codingSystem}</td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                            <span style={{ padding: "1px 6px", fontSize: 10, fontWeight: 600, fontFamily: tk.mono, background: vt.bg, color: vt.color }}>{r.valueType}</span>
                          </td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${tk.g100}`, fontFamily: tk.mono, fontSize: 11 }}>{r.units}</td>
                          <td style={{ padding: "6px 10px", borderBottom: `1px solid ${tk.g100}` }}>
                            {already ? (
                              <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 500, background: tk.greenBg, color: tk.green }}>{t("query.alreadyMapped")}</span>
                            ) : (
                              <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 500, background: tk.yellowBg, color: "#7a5b00" }}>{t("query.new")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {querySelected.size > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: tk.blue, fontWeight: 500 }}>
                  {querySelected.size} code(s) selected — click "{t("query.addSelected")}" to add as unmapped rows
                </div>
              )}
            </>
          )}
        </Modal>
      )}

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: tk.green, color: tk.white, padding: "12px 20px", fontSize: 13, fontWeight: 500, zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,.15)" }}>✓ {toast}</div>}
    </div>
  );
}
