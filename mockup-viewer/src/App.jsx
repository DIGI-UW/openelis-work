import React, { useState, useEffect, Suspense } from 'react';
import { marked } from 'marked';
import './spec-styles.css';

/**
 * OpenELIS Global — Design Gallery
 *
 * Browse all JSX mockups with paired spec links.
 * Run: cd mockup-viewer && npm install && npm run dev
 * Deploy: GitHub Pages via Actions (automatic on push)
 *
 * Permalinks: each mockup has a hash-based URL like
 *   #/category/mockup-slug
 * e.g. #/pathology/cytology-case-view
 */

/** Generate a URL-safe slug from a mockup name */
export function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const MOCKUP_REGISTRY = [
  // ─── Admin & Configuration ───
  {
    name: 'Data Dictionary',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/data-dictionary.jsx')),
    description: 'Data dictionary management interface',
    specPath: 'designs/admin-config/data-dictionary.md',
    githubIssue: 1,
  },
  {
    name: 'Lab Units',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/lab-units.jsx')),
    description: 'Laboratory units configuration',
    specPath: 'designs/admin-config/lab-units.md',
    githubIssue: 2,
  },
  {
    name: 'Methods',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/methods.jsx')),
    description: 'Test methods management',
    specPath: 'designs/admin-config/methods.md',
    githubIssue: 3,
  },
  {
    name: 'Organizations Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/organizations-management.jsx')),
    description: 'Organizations and referring facilities management',
    specPath: 'designs/admin-config/organizations-management.md',
    githubIssue: 4,
  },
  {
    name: 'Panel',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/panel.jsx')),
    description: 'Test panel configuration',
    specPath: 'designs/admin-config/panel.md',
    githubIssue: 5,
  },
  {
    name: 'Range Editor',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/range-editor.jsx')),
    description: 'Normal range editor for test results',
    specPath: 'designs/admin-config/range-editor.md',
    githubIssue: 6,
  },
  {
    name: 'Result Options',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/result-options.jsx')),
    description: 'Result options (dictionary values) management',
    specPath: 'designs/admin-config/result-options.md',
    githubIssue: 7,
  },
  {
    name: 'Test Catalog',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-catalog.jsx')),
    description: 'Comprehensive test catalog management',
    specPath: 'designs/admin-config/test-catalog.md',
    githubIssue: 8,
  },

  {
    name: 'RBAC Management',
    category: 'admin-config',
    component: null,
    description: 'Role-based access control revamp — role management, permission matrix, user assignment',
    specPath: 'designs/rbac/rbac-revamp-prd.md',
    htmlUrl: 'designs/rbac/rbac-ui-mockup.html',
    added: '2026-03-04',
    githubIssue: 9,
  },
  {
    name: 'Password Policy Enhancements',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/password-enhancements.jsx')),
    description: 'OWASP-aligned password policy with force-reset on next login, length-based rules, and Unicode support',
    specPath: 'designs/admin-config/password-enhancements.md',
    added: '2026-03-15',
    status: 'draft',
    githubIssue: 51,
  },

  // ─── Analyzer Integration ───
  {
    name: 'Sysmex XP Field Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'Sysmex XP-100/XP-300 ASTM field mapping & bi-directional integration spec',
    specPath: 'designs/analyzer-integration/sysmex-xp-field-mapping-v0.1.md',
    jira: ['OGC-214'],
    added: '2026-03-05',
    githubIssue: 10,
  },
  {
    name: 'BioRad CFX Opus Connection Spec',
    category: 'analyzer-integration',
    component: null,
    description: 'BioRad CFX Opus Real-Time PCR — CSV/RDML export, LIMS integration via CFX Maestro',
    specPath: 'designs/analyzer-integration/biorad-cfx-opus-analyzer-connection-spec.md',
    added: '2026-03-05',
    githubIssue: 11,
  },
  {
    name: 'Sysmex XN-L Series Field Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'Sysmex XN-L Series (XN-330 through XN-550) ASTM host-query bi-directional integration spec',
    specPath: 'designs/analyzer-integration/sysmex-xn-field-mapping-v0.1.md',
    added: '2026-03-06',
    githubIssue: 12,
  },
  {
    name: 'DNA Technology DT-Prime Field Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'DNA Technology DT-Prime Real-Time PCR — XML file-based export, qualitative results parsing',
    specPath: 'designs/analyzer-integration/dna-technology-dtprime-field-mapping-v0.2.md',
    added: '2026-03-06',
    githubIssue: 13,
  },
  {
    name: 'Tecan Infinite F50 Connection Spec',
    category: 'analyzer-integration',
    component: null,
    description: 'Tecan Infinite F50 ELISA Reader — Magellan CSV/XML export, absorbance microplate reader',
    specPath: 'designs/analyzer-integration/tecan-infinite-f50-analyzer-connection-spec.md',
    added: '2026-03-06',
    relatedTo: ['Tecan Infinite F50 Companion Guide'],
    githubIssue: 14,
  },
  {
    name: 'Thermo Multiskan FC Connection Spec',
    category: 'analyzer-integration',
    component: null,
    description: 'Thermo Scientific Multiskan FC ELISA Reader — SkanIt CSV/TXT export, filter-based photometer',
    specPath: 'designs/analyzer-integration/thermo-multiskan-fc-analyzer-connection-spec.md',
    added: '2026-03-06',
    relatedTo: ['Thermo Multiskan FC Companion Guide'],
    githubIssue: 15,
  },
  {
    name: 'QuantStudio 5/7 Flex Field Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'QuantStudio 5 / 7 Flex HIV Viral Load — XLS export field mapping, 31-column Results sheet parsing',
    specPath: 'designs/analyzer-integration/quantstudio-field-mapping-spec-v131.md',
    jira: ['OGC-348'],
    added: '2026-03-06',
    relatedTo: ['QuantStudio 5/7 Flex Companion Guide'],
    githubIssue: 16,
  },
  {
    name: 'QuantStudio 5/7 Flex Companion Guide',
    category: 'analyzer-integration',
    component: null,
    description: 'QuantStudio 5 / 7 Flex setup & export guide — QS D&A software export walkthrough for lab staff',
    specPath: 'designs/analyzer-integration/quantstudio-companion-guide-v10.md',
    jira: ['OGC-348'],
    added: '2026-03-06',
    relatedTo: ['QuantStudio 5/7 Flex Field Mapping'],
    githubIssue: 17,
  },
  {
    name: 'FluoroCycler XT Integration Spec',
    category: 'analyzer-integration',
    component: null,
    description: 'FluoroCycler XT Real-Time PCR — Excel flat file manual workflow for HIV Viral Load',
    specPath: 'designs/analyzer-integration/fluorocycler-xt-integration-spec-v1.0.md',
    added: '2026-03-06',
    relatedTo: ['FluoroCycler XT Companion Guide'],
    githubIssue: 18,
  },
  {
    name: 'FluoroCycler XT Companion Guide',
    category: 'analyzer-integration',
    component: null,
    description: 'FluoroCycler XT setup & export guide — Excel template workflow for lab staff',
    specPath: 'designs/analyzer-integration/fluorocycler-xt-companion-setup-guide-v1.0.md',
    added: '2026-03-06',
    relatedTo: ['FluoroCycler XT Integration Spec'],
    githubIssue: 19,
  },
  {
    name: 'Tecan Infinite F50 Companion Guide',
    category: 'analyzer-integration',
    component: null,
    description: 'Tecan Infinite F50 companion setup guide — Madagascar custom Excel workflow (validated)',
    specPath: 'designs/analyzer-integration/tecan-infinite-f50-companion-guide.md',
    added: '2026-03-06',
    relatedTo: ['Tecan Infinite F50 Connection Spec'],
    githubIssue: 20,
  },
  {
    name: 'Thermo Multiskan FC Companion Guide',
    category: 'analyzer-integration',
    component: null,
    description: 'Thermo Multiskan FC companion setup guide — SkanIt export configuration for OpenELIS',
    specPath: 'designs/analyzer-integration/thermo-multiskan-fc-companion-guide.md',
    added: '2026-03-06',
    relatedTo: ['Thermo Multiskan FC Connection Spec'],
    githubIssue: 21,
  },
  {
    name: 'Analyzer File Upload',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/analyzer-file-upload.jsx')),
    description: 'Upload and process analyzer result files',
    specPath: 'designs/analyzer-integration/analyzer-file-upload.md',
    jira: ['OGC-173', 'OGC-189', 'OGC-214', 'OGC-224'],
    githubIssue: 22,
  },
  {
    name: 'Analyzer Mapping Templates',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/analyzer-mapping-templates.jsx')),
    description: 'Configure analyzer-to-test mapping templates',
    specPath: 'designs/analyzer-integration/astm-analyzer-mapping-addendum.md',
    jira: ['OGC-173'],
    githubIssue: 23,
  },
  {
    name: 'Flat File Analyzer Config',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/flat-file-analyzer-config.jsx')),
    description: 'Configure flat file (CSV/TSV) analyzer parsers',
    specPath: 'designs/analyzer-integration/flat-file-analyzer-config.md',
    jira: ['OGC-324'],
    githubIssue: 24,
  },
  {
    name: 'HL7 Analyzer Mapping',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/hl7-analyzer-mapping.jsx')),
    description: 'HL7 message field mapping for analyzers',
    specPath: 'designs/analyzer-integration/hl7-analyzer-mapping-addendum.md',
    jira: ['OGC-324'],
    githubIssue: 25,
  },
  // ─── Microbiology ───
  {
    name: 'AMR Module',
    category: 'microbiology',
    component: React.lazy(() => import('@designs/microbiology/amr-module.jsx')),
    description: 'Antimicrobial resistance testing and reporting module',
    specPath: 'designs/microbiology/amr-module.md',
    githubIssue: 26,
  },

  // ─── NCE ───
  {
    name: 'NCE Analytics',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-analytics.jsx')),
    description: 'Non-conforming event analytics dashboard',
    specPath: 'designs/nce/nce-analytics.md',
    githubIssue: 27,
  },
  {
    name: 'NCE Dashboard & CAPA',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-dashboard.jsx')),
    description: 'NCE dashboard with CAPA tracking',
    specPath: 'designs/nce/nce-dashboard.md',
    githubIssue: 28,
  },
  {
    name: 'NCE Results Entry',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-results-entry.jsx')),
    description: 'NCE investigation results entry form',
    specPath: 'designs/nce/nce-results-entry.md',
    githubIssue: 29,
  },
  {
    name: 'NCE Report',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-report.jsx')),
    description: 'Non-conformity report generation',
    specPath: 'designs/nce/nce-report.md',
    githubIssue: 30,
  },

  // ─── Pathology ───
  {
    name: 'Pathology Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/pathology-case-view.jsx')),
    description: 'Pathology case view and reporting redesign',
    specPath: 'designs/pathology/pathology-case-view.md',
    githubIssue: 31,
  },
  {
    name: 'IHC Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/ihc-case-view.jsx')),
    description: 'Immunohistochemistry case view and scoring',
    specPath: 'designs/pathology/ihc-case-view.md',
    githubIssue: 32,
  },

  {
    name: 'Cytology Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/cytology-case-view.jsx')),
    description: 'Cytology case view with Bethesda System wizard workflow',
    specPath: 'designs/pathology/cytology-case-view.md',
    githubIssue: 33,
  },

  // ─── Quality & EQA ───
  {
    name: 'EQA Enrollment',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/eqa-enrollment.jsx')),
    description: 'EQA program enrollment, self-enrollment, and provider management',
    specPath: 'designs/quality/eqa-enrollment-addendum.md',
    githubIssue: 34,
  },

  {
    name: 'Westgard Dashboard',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/westgard-dashboard.jsx')),
    description: 'Laboratory Instrument Compliance Dashboard with Westgard QC rules',
    specPath: 'designs/quality/westgard-rules.md',
    githubIssue: 35,
  },
  {
    name: 'Batch Workplan with Reagent QC',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/batch-workplan-reagent-qc.jsx')),
    description: 'Unified batch workplan with reagent lot assignment, QC verification, and automatic NCE generation on override',
    specPath: 'designs/quality/batch-workplan-reagent-qc.md',
    jira: ['OGC-427'],
    added: '2026-03-16',
    status: 'approved',
    githubIssue: 52,
    relatedTo: ['Analyzer Manual QC'],
  },
  {
    name: 'Analyzer Manual QC',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/analyzer-manual-qc.jsx')),
    description: 'Manual QC recording for analyzers — inline Pass/Fail entry on import page and quick-access from analyzer list',
    specPath: 'designs/quality/analyzer-manual-qc.md',
    jira: ['OGC-426'],
    added: '2026-03-16',
    status: 'approved',
    githubIssue: 53,
    relatedTo: ['Batch Workplan with Reagent QC'],
  },

  // ─── Results & Validation ───
  {
    name: 'Results Page',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/results-page.jsx')),
    description: 'Main results entry and review page',
    specPath: 'designs/results-validation/results-page.md',
    githubIssue: 36,
  },
  {
    name: 'Validation Page',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/validation-page.jsx')),
    description: 'Result validation workflow',
    specPath: 'designs/results-validation/validation-page.md',
    githubIssue: 37,
  },
  {
    name: 'Validation Page (Analyzer)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/analyzer-integration/validation-page.jsx')),
    description: 'Analyzer result validation workflow',
    specPath: 'designs/analyzer-integration/validation-page.md',
    githubIssue: 38,
  },

  {
    name: 'Validation Page v2 (Full Redesign)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/validation-page/validation-page-mockup-v2.jsx')),
    description: 'Full v2 redesign — multi-level validation pipeline, admin config, role-based levels, auto-validation',
    specPath: 'designs/validation-page/validation-page-requirements-v2.md',
    added: '2026-03-04',
    githubIssue: 39,
  },
  {
    name: 'Validation Page v2.1 (Stage 1)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/validation-page/validation-page-stage1-mockup.jsx')),
    description: 'Stage 1 scoped — multi-signature pipeline with minimal UI changes to existing validation page',
    specPath: 'designs/validation-page/validation-page-requirements-v2.1-stage1.md',
    added: '2026-03-04',
    githubIssue: 40,
  },
  {
    name: 'Validation Page v3 (Demographics)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/validation-page/validation-page-mockup-v3-demographics.jsx')),
    description: 'v3 adds patient sex and age (D-M-Y) columns for demographic-aware reference range verification',
    specPath: 'designs/validation-page/validation-patient-demographics-frs-v1.md',
    jira: ['OGC-291', 'OGC-343'],
    added: '2026-03-09',
    status: 'review',
    githubIssue: 50,
    relatedTo: ['Patient Demographics Mockup', 'Patient Demographics FRS'],
  },
  {
    name: 'Patient Demographics Mockup',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/validation-page/validation-patient-demographics-mockup.jsx')),
    description: 'Patient demographics display — sex tag, age calculation, patient info header with Carbon components',
    specPath: 'designs/validation-page/validation-patient-demographics-frs-v1.md',
    jira: ['OGC-291', 'OGC-343'],
    added: '2026-03-09',
    status: 'review',
    relatedTo: ['Validation Page v3 (Demographics)', 'Patient Demographics FRS'],
    githubIssue: 41,
  },
  {
    name: 'Patient Demographics FRS',
    category: 'results-validation',
    component: null,
    description: 'Patient Sex & Age Display on Validation Screen FRS v1.0 — D-M-Y age format, sex normalization',
    specPath: 'designs/validation-page/validation-patient-demographics-frs-v1.md',
    jira: ['OGC-291', 'OGC-343'],
    added: '2026-03-09',
    status: 'review',
    relatedTo: ['Validation Page v3 (Demographics)', 'Patient Demographics Mockup'],
    githubIssue: 42,
  },
  // ─── Reports ───
  {
    name: 'Patient Report Print Queue',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/patient-report-print-queue.jsx')),
    description: 'Push-based print queue for validated patient reports — auto-surfaces unprinted accessions with batch print and ISO 15189 audit trail',
    specPath: 'designs/reports/patient-report-print-queue.md',
    added: '2026-03-18',
    status: 'draft',
    githubIssue: 54,
  },
  {
    name: 'Positivity Rate Report',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/positivity-rate.jsx')),
    description: 'Positivity rate report and dashboard widget — per-test result-code-based positivity definitions, date-range filtering, DataTable with CSV export, and reusable tile for the home dashboard',
    specPath: 'designs/reports/positivity-rate.md',
    added: '2026-03-19',
    status: 'draft',
    githubIssue: 55,
  },
  {
    name: 'Disease Surveillance Dashboard',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/disease-surveillance-dashboard.jsx')),
    description: 'Public-health surveillance dashboard — weekly TB/HIV positivity trends, volume-by-site breakdowns, and FHIR-sourced aggregate indicators for program managers',
    specPath: null,
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 57,
  },

  // ─── Notifications ───
  {
    name: 'Notification Admin',
    category: 'notifications',
    component: React.lazy(() => import('@designs/notifications/notification-admin.jsx')),
    description: 'Unified notification admin — configure email and TextIt SMS alert rules, provider contact mapping, escalation chains, and notification log across all result and validation events',
    specPath: 'designs/notifications/email-notification-integration.md',
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 58,
    relatedTo: ['TextIt SMS Integration'],
  },
  {
    name: 'TextIt SMS Integration',
    category: 'notifications',
    component: React.lazy(() => import('@designs/notifications/textit-sms-integration.jsx')),
    description: 'TextIt SMS integration — admin configuration for API credentials, flow selection, message templates, and per-event trigger mapping for outbound SMS notifications',
    specPath: 'designs/notifications/textit-sms-integration.md',
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 59,
    relatedTo: ['Notification Admin'],
  },

  // ─── Inventory ───
  {
    name: 'Reagent Forecasting Workbench',
    category: 'inventory',
    component: React.lazy(() => import('@designs/inventory/reagent-forecasting-workbench.jsx')),
    description: 'National/regional reagent forecasting workbench — multi-facility days-of-stock table, critical/low alerts, ADC-based projections, and reorder planning for program managers',
    specPath: null,
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 60,
    relatedTo: ['Reagent Forecasting Facility View'],
  },
  {
    name: 'Reagent Forecasting Facility View',
    category: 'inventory',
    component: React.lazy(() => import('@designs/inventory/reagent-forecasting-facility.jsx')),
    description: 'Facility-level reagent stock view — per-cartridge days-of-stock monitoring, stock-count updates, and proactive reorder alerts for lab technicians at a single site',
    specPath: 'designs/inventory/reagent-forecasting-facility.md',
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 61,
    relatedTo: ['Reagent Forecasting Workbench'],
  },

  // ─── System ───
  {
    name: 'Audit Trail',
    category: 'system',
    component: React.lazy(() => import('@designs/system/audit-trail.jsx')),
    description: 'System audit trail viewer',
    specPath: 'designs/system/audit-trail.md',
    githubIssue: 43,
  },
  {
    name: 'Help Menu',
    category: 'system',
    component: React.lazy(() => import('@designs/system/help-menu.jsx')),
    description: 'In-app help menu and documentation links',
    specPath: 'designs/system/help-menu.md',
    githubIssue: 44,
  },
  {
    name: 'Analyzer Import',
    category: 'system',
    component: React.lazy(() => import('@designs/system/analyzer-import.jsx')),
    description: 'Bulk analyzer configuration import',
    specPath: 'designs/system/analyzer-import.md',
    githubIssue: 45,
  },

  // ─── Sample Collection ───
  {
    name: 'Sample Collection Redesign',
    category: 'sample-collection',
    component: null,
    description: 'Decoupled 4-step sample lifecycle: Enter Order → Collect Sample → Label & Store → QA Review',
    specPath: 'designs/sample-collection/sample-collection-redesign.md',
    htmlUrl: 'designs/sample-collection/sample-collection-redesign-mockup.html',
    jira: ['OGC-70'],
    added: '2026-03-04',
    githubIssue: 46,
  },

  // ─── Other ───
  {
    name: 'TAT Dashboard',
    category: 'other',
    component: React.lazy(() => import('@designs/other/tat-dashboard.jsx')),
    description: 'Turnaround time monitoring dashboard',
    specPath: 'designs/other/tat-dashboard.md',
    githubIssue: 47,
  },
  {
    name: 'Calendar Management',
    category: 'other',
    component: React.lazy(() => import('@designs/other/calendar-management.jsx')),
    description: 'Lab calendar and scheduling management',
    specPath: null,
    githubIssue: 48,
  },

  // ─── Figma-only entries (no JSX mockup) ───
  {
    name: 'Catalyst Lab Data Assistant',
    category: 'system',
    component: null,
    description: 'AI-powered lab data assistant with natural language querying, wizard-based report building, and contextual help',
    specPath: null,
    figmaUrl: 'https://www.figma.com/make/poDXKSr2IBgKbbjB1Fh9Sj/OpenELIS-Global-Template--Copy-?node-id=0-1',
    githubIssue: 49,
  },
];

export const GITHUB_BASE = 'https://github.com/DIGI-UW/openelis-work/blob/main/';
export const GITHUB_REPO = 'DIGI-UW/openelis-work';
export const GITHUB_ISSUES_URL = `https://github.com/${GITHUB_REPO}/issues`;
export const JIRA_BASE = 'https://uwdigi.atlassian.net/browse/';
export const DEFAULT_ADDED = '2026-03-03'; // Initial gallery import date

export const categories = [
  'all',
  'admin-config',
  'analyzer-integration',
  'inventory',
  'microbiology',
  'nce',
  'notifications',
  'pathology',
  'quality',
  'results-validation',
  'reports',
  'sample-collection',
  'system',
  'other',
];

export const categoryLabels = {
  'all': 'All',
  'admin-config': 'Admin & Config',
  'analyzer-integration': 'Analyzer Integration',
  'inventory': 'Inventory & Supply',
  'microbiology': 'Microbiology',
  'nce': 'NCE',
  'notifications': 'Notifications',
  'pathology': 'Pathology',
  'quality': 'Quality & EQA',
  'results-validation': 'Results & Validation',
  'reports': 'Reports',
  'sample-collection': 'Sample Collection',
  'system': 'System',
  'other': 'Other',
};

/** Determine entry type for visual distinction */
export function getEntryType(mockup) {
  if (mockup.component) return 'jsx';
  if (mockup.htmlUrl) return 'html';
  if (mockup.figmaUrl) return 'figma';
  return 'spec';
}

const entryTypeConfig = {
  jsx:   { label: 'JSX Mockup', color: '#0f62fe', bg: '#edf5ff' },
  html:  { label: 'HTML Mockup', color: '#6929c4', bg: '#f3e8ff' },
  figma: { label: 'Figma', color: '#7c3aed', bg: '#f3e8ff' },
  spec:  { label: 'Spec Only', color: '#6f6f6f', bg: '#f4f4f4' },
};

/** Status configuration — entries default to 'draft' if not specified */
export const STATUS_DEFAULT = 'draft';
export const statusConfig = {
  draft:    { label: 'Draft',    color: '#8a3ffc', bg: '#f3e8ff', darkBg: '#8a3ffc22', icon: '✎' },
  review:   { label: 'In Review', color: '#f1c21b', bg: '#fff8e1', darkBg: '#f1c21b22', icon: '⏳' },
  approved: { label: 'Approved', color: '#198038', bg: '#defbe6', darkBg: '#19803822', icon: '✓' },
};
export const statusKeys = Object.keys(statusConfig);

/**
 * Build a GitHub "new comment" URL with a pre-filled status change template.
 * Used by the gallery UI so anyone can propose a status change — honor system.
 */
export function buildStatusChangeUrl(issueNumber, newStatus, designName) {
  if (!issueNumber) return null;
  const conf = statusConfig[newStatus];
  if (!conf) return null;
  const body = `**Status Change → ${conf.icon} ${conf.label}**\n\nDesign: ${designName}\nNew status: \`${newStatus}\`\nChanged by: _(your name)_\nDate: ${new Date().toISOString().slice(0, 10)}\n\nReason: `;
  return `${GITHUB_ISSUES_URL}/${issueNumber}#issuecomment-new?body=${encodeURIComponent(body)}`;
}

/**
 * Parse a comment body for status-change markers.
 * Returns the status key if found, or null.
 */
export function parseStatusFromComment(body) {
  if (!body) return null;
  // Match "New status: `draft`" or "Status Change → ✎ Draft"
  const backtickMatch = body.match(/New status:\s*`(\w+)`/i);
  if (backtickMatch && statusConfig[backtickMatch[1]]) return backtickMatch[1];
  // Fallback: match label
  for (const [key, conf] of Object.entries(statusConfig)) {
    if (body.includes(`Status Change → ${conf.icon} ${conf.label}`)) return key;
  }
  return null;
}

/** Format an ISO date string as "Mar 9, 2026" */
export function formatDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Find a mockup by its hash path (e.g. "pathology/cytology-case-view") */
export function findMockupByHash(hash) {
  // strip leading #/ or #
  const path = hash.replace(/^#\/?/, '');
  if (!path) return null;
  const [cat, ...slugParts] = path.split('/');
  const slug = slugParts.join('/');
  return MOCKUP_REGISTRY.find(
    (m) => m.category === cat && toSlug(m.name) === slug
  ) || null;
}

/** Build the hash string for a mockup */
export function toHash(mockup) {
  return `#/${mockup.category}/${toSlug(mockup.name)}`;
}

/** Configure marked for safe rendering */
marked.setOptions({
  gfm: true,
  breaks: true,
});

/** Fetch and render a markdown spec from the repo */
function SpecViewer({ specPath }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!specPath) return;
    setLoading(true);
    setError(null);
    // Fetch the raw markdown from the deployed site (it's in the public dir via vite copy)
    const url = import.meta.env.BASE_URL + specPath;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load spec (${res.status})`);
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [specPath]);

  if (loading) return <div style={styles.loading}>Loading spec...</div>;
  if (error) {
    return (
      <div style={styles.specError}>
        <p>Could not load spec inline.</p>
        <a href={GITHUB_BASE + specPath} target="_blank" rel="noopener" style={styles.link}>
          View on GitHub instead →
        </a>
      </div>
    );
  }

  return (
    <div
      className="spec-content"
      style={styles.specContent}
      dangerouslySetInnerHTML={{ __html: marked(content) }}
    />
  );
}

/**
 * Sanitize a comment body: strip HTML tags, remove links (URLs and markdown links),
 * and collapse excessive whitespace. This prevents spam and XSS in rendered comments.
 */
export function sanitizeComment(text) {
  if (!text) return '';
  return text
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove markdown image syntax ![alt](url) — must run before link regex
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '[image removed]')
    // Remove markdown links [text](url) → text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove raw URLs (http/https/ftp)
    .replace(/https?:\/\/\S+/gi, '[link removed]')
    .replace(/ftp:\/\/\S+/gi, '[link removed]')
    // Collapse excessive newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Format a GitHub API timestamp as a relative or absolute date */
function formatCommentDate(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Fetch and display GitHub Issue comments for a design entry */
function CommentViewer({ issueNumber, darkMode, theme: t, designName }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveStatus, setLiveStatus] = useState(null);

  useEffect(() => {
    if (!issueNumber) return;
    setLoading(true);
    setError(null);
    fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/comments`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    })
      .then((res) => {
        if (res.status === 403) throw new Error('Rate limited — try again in a minute');
        if (!res.ok) throw new Error(`GitHub API error (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setComments(data);
        // Derive live status from the most recent status-change comment
        for (let i = data.length - 1; i >= 0; i--) {
          const parsed = parseStatusFromComment(data[i].body);
          if (parsed) {
            setLiveStatus(parsed);
            break;
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [issueNumber]);

  const issueUrl = `${GITHUB_ISSUES_URL}/${issueNumber}`;

  if (loading) return <div style={{ ...styles.loading, color: t.textMuted }}>Loading discussion...</div>;
  if (error) {
    return (
      <div style={styles.specError}>
        <p style={{ color: t.textMuted }}>Could not load comments: {error}</p>
        <a href={issueUrl} target="_blank" rel="noopener" style={{ ...styles.link, color: t.accent }}>
          View discussion on GitHub →
        </a>
      </div>
    );
  }

  const effectiveStatus = liveStatus || STATUS_DEFAULT;
  const effConf = statusConfig[effectiveStatus];

  return (
    <div style={{ maxWidth: 700 }}>
      {/* Live status banner derived from comments */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 14px', marginBottom: 16, borderRadius: 8,
        background: darkMode ? effConf.darkBg : effConf.bg,
        border: `1px solid ${effConf.color}44`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{effConf.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: effConf.color }}>
            Current status: {effConf.label}
          </span>
          {liveStatus && (
            <span style={{ fontSize: 11, color: t.textMuted, fontStyle: 'italic' }}>(from comments)</span>
          )}
        </div>
        {/* Status change dropdown */}
        <div style={{ display: 'flex', gap: 6 }}>
          {statusKeys.filter(k => k !== effectiveStatus).map((key) => {
            const sc = statusConfig[key];
            const url = buildStatusChangeUrl(issueNumber, key, designName);
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  textDecoration: 'none', border: `1px solid ${sc.color}66`,
                  color: sc.color, background: darkMode ? sc.darkBg : sc.bg,
                }}
                title={`Change status to ${sc.label}`}
              >
                {sc.icon} → {sc.label}
              </a>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: t.textMuted }}>
          {comments.length} comment{comments.length !== 1 ? 's' : ''}
        </span>
        <a
          href={issueUrl + '#issue-comment-box'}
          target="_blank"
          rel="noopener"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: t.accent, color: '#fff', padding: '6px 14px',
            borderRadius: 6, fontSize: 13, textDecoration: 'none', fontWeight: 500,
          }}
        >
          Add Comment on GitHub
        </a>
      </div>
      {comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: t.textMuted }}>
          <p style={{ margin: 0 }}>No comments yet. Be the first to share feedback!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((c) => {
            const commentStatus = parseStatusFromComment(c.body);
            const isStatusChange = !!commentStatus;
            const scConf = isStatusChange ? statusConfig[commentStatus] : null;
            return (
            <div
              key={c.id}
              style={{
                border: `1px solid ${isStatusChange ? scConf.color + '44' : t.border}`,
                borderRadius: 8,
                padding: 14,
                background: isStatusChange
                  ? (darkMode ? scConf.darkBg : scConf.bg)
                  : (darkMode ? '#1c1c1c' : '#fafafa'),
                borderLeft: isStatusChange ? `3px solid ${scConf.color}` : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {c.user?.avatar_url && (
                    <img
                      src={c.user.avatar_url}
                      alt=""
                      style={{ width: 24, height: 24, borderRadius: 12 }}
                    />
                  )}
                  <span style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{c.user?.login || 'unknown'}</span>
                  {isStatusChange && (
                    <span style={{
                      ...styles.statusBadge,
                      background: darkMode ? scConf.darkBg : scConf.bg,
                      color: scConf.color,
                      borderColor: scConf.color + '44',
                      fontSize: 10,
                    }}>
                      {scConf.icon} → {scConf.label}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: t.textFaint }}>{formatCommentDate(c.created_at)}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: t.textSecondary, whiteSpace: 'pre-wrap' }}>
                {sanitizeComment(c.body)}
              </p>
            </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href={issueUrl} target="_blank" rel="noopener" style={{ fontSize: 12, color: t.accent, textDecoration: 'none' }}>
          View full discussion on GitHub →
        </a>
      </div>
    </div>
  );
}

/** Light and dark theme token maps (Carbon-inspired) */
export const themes = {
  light: {
    bg: '#ffffff',
    bgSubtle: '#f4f4f4',
    text: '#161616',
    textSecondary: '#525252',
    textMuted: '#6f6f6f',
    textFaint: '#a8a8a8',
    border: '#e0e0e0',
    borderInput: '#c6c6c6',
    cardBg: '#ffffff',
    headerBorder: '#0f62fe',
    accent: '#0f62fe',
    badgeBg: '#e0e0e0',
    specBadgeBg: '#d0e2ff',
    specBadgeColor: '#0043ce',
    searchBg: '#ffffff',
    tabBg: '#ffffff',
    previewBg: '#f4f4f4',
    errorBg: '#fff1f1',
    errorColor: '#da1e28',
    jiraBg: '#e8f5e9',
    jiraColor: '#1b5e20',
    jiraBorder: '#c8e6c9',
    relatedBg: '#edf5ff',
    cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cardShadowHover: '0 4px 12px rgba(0,0,0,0.15)',
    permalinkBg: '#e0e0e0',
    permalinkColor: '#393939',
  },
  dark: {
    bg: '#161616',
    bgSubtle: '#262626',
    text: '#f4f4f4',
    textSecondary: '#c6c6c6',
    textMuted: '#8d8d8d',
    textFaint: '#6f6f6f',
    border: '#393939',
    borderInput: '#525252',
    cardBg: '#262626',
    headerBorder: '#0f62fe',
    accent: '#78a9ff',
    badgeBg: '#393939',
    specBadgeBg: '#00264a',
    specBadgeColor: '#78a9ff',
    searchBg: '#262626',
    tabBg: '#262626',
    previewBg: '#1c1c1c',
    errorBg: '#3b1111',
    errorColor: '#ff8389',
    jiraBg: '#1a3320',
    jiraColor: '#6fdc8c',
    jiraBorder: '#24693d',
    relatedBg: '#002d5e',
    cardShadow: '0 1px 3px rgba(0,0,0,0.3)',
    cardShadowHover: '0 4px 12px rgba(0,0,0,0.5)',
    permalinkBg: '#393939',
    permalinkColor: '#c6c6c6',
  },
};

function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMockup, setSelectedMockup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState('preview'); // 'preview' or 'spec'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'draft', 'review', 'approved'
  const [localStatuses, setLocalStatuses] = useState(() => {
    // Load persisted status overrides from localStorage
    try {
      const stored = localStorage.getItem('oe-gallery-statuses');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  }); // { slug: statusKey }
  const [darkMode, setDarkMode] = useState(() => {
    // Default to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const t = darkMode ? themes.dark : themes.light;

  // On mount, check if the URL hash points to a mockup
  useEffect(() => {
    const mockup = findMockupByHash(window.location.hash);
    if (mockup) {
      setSelectedMockup(mockup);
      setActiveCategory(mockup.category);
    }
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    function onHashChange() {
      const mockup = findMockupByHash(window.location.hash);
      setSelectedMockup(mockup);
      if (mockup) setActiveCategory(mockup.category);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Helper to select a mockup and update the URL hash
  function selectMockup(mockup) {
    setSelectedMockup(mockup);
    setDetailTab('preview'); // Reset tab when switching entries
    if (mockup) {
      window.location.hash = toHash(mockup);
    } else {
      // Clear hash when going back to gallery
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }

  /** Resolve effective status: local override > static (from registry) > default */
  function getEffectiveStatus(mockup) {
    const slug = toSlug(mockup.name);
    if (localStatuses[slug]) return localStatuses[slug];
    return mockup.status || STATUS_DEFAULT;
  }

  /** Set status for a design (persisted to localStorage) */
  function setDesignStatus(mockup, newStatus) {
    const slug = toSlug(mockup.name);
    setLocalStatuses((prev) => {
      const next = { ...prev, [slug]: newStatus };
      try { localStorage.setItem('oe-gallery-statuses', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const filtered = MOCKUP_REGISTRY.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesStatus = statusFilter === 'all' || getEffectiveStatus(m) === statusFilter;
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.jira && m.jira.some((key) => key.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesStatus && matchesSearch;
  });

  const countByCategory = {};
  MOCKUP_REGISTRY.forEach((m) => {
    countByCategory[m.category] = (countByCategory[m.category] || 0) + 1;
  });

  // Also update body background when theme changes
  useEffect(() => {
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    document.body.style.transition = 'background 0.2s, color 0.2s';
  }, [darkMode, t.bg, t.text]);

  return (
    <div style={{ ...styles.container, background: t.bg, color: t.text }} data-theme={darkMode ? 'dark' : 'light'}>
      <header style={{ ...styles.header, borderBottomColor: t.headerBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ ...styles.title, color: t.text }}>OpenELIS Global — Design Gallery</h1>
            <p style={{ ...styles.subtitle, color: t.textMuted }}>
              {MOCKUP_REGISTRY.length} mockups across {Object.keys(countByCategory).length} categories
            </p>
          </div>
          <button
            onClick={() => setDarkMode((prev) => !prev)}
            style={{
              background: t.badgeBg,
              border: `1px solid ${t.border}`,
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: t.text,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.2s',
            }}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span style={{ fontSize: 16 }}>{darkMode ? '☀️' : '🌙'}</span>
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search mockups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ ...styles.search, background: t.searchBg, borderColor: t.borderInput, color: t.text }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...styles.statusSelect, background: t.searchBg, borderColor: t.borderInput, color: t.text }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statusKeys.map((key) => (
            <option key={key} value={key}>{statusConfig[key].icon} {statusConfig[key].label}</option>
          ))}
        </select>
        <div style={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); selectMockup(null); }}
              style={{
                ...styles.tab,
                background: t.tabBg,
                color: t.text,
                borderColor: t.borderInput,
                ...(activeCategory === cat ? { ...styles.tabActive, background: t.accent, color: '#fff', borderColor: t.accent } : {}),
              }}
            >
              {categoryLabels[cat]}
              {cat !== 'all' && countByCategory[cat] ? ` (${countByCategory[cat]})` : ''}
              {cat === 'all' ? ` (${MOCKUP_REGISTRY.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {selectedMockup ? (
        <div>
          <button onClick={() => selectMockup(null)} style={{ ...styles.backButton, color: t.accent }}>
            ← Back to Gallery
          </button>
          <div style={styles.mockupHeader}>
            <h2 style={{ margin: 0, color: t.text }}>{selectedMockup.name}</h2>
            <span style={{ ...styles.badge, background: t.badgeBg, color: t.textSecondary }}>{categoryLabels[selectedMockup.category]}</span>
            {(() => { const effSt = getEffectiveStatus(selectedMockup); const st = statusConfig[effSt]; return (
              <select
                value={effSt}
                onChange={(e) => setDesignStatus(selectedMockup, e.target.value)}
                style={{
                  ...styles.statusBadge,
                  background: darkMode ? st.darkBg : st.bg,
                  color: st.color,
                  borderColor: st.color + '44',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  paddingRight: 22,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${encodeURIComponent(st.color)}'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 6px center',
                }}
                title="Change design status"
                aria-label="Change design status"
              >
                {statusKeys.map((key) => (
                  <option key={key} value={key}>{statusConfig[key].icon} {statusConfig[key].label}</option>
                ))}
              </select>
            ); })()}
            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + toHash(selectedMockup);
                navigator.clipboard.writeText(url).then(() => {
                  alert('Permalink copied!');
                });
              }}
              style={{ ...styles.permalinkButton, background: t.permalinkBg, color: t.permalinkColor }}
              title="Copy permalink to clipboard"
            >
              Copy Link
            </button>
          </div>
          <p style={{ ...styles.description, color: t.textSecondary }}>
            {selectedMockup.description}
            <span style={{ ...styles.dateTag, color: t.textFaint }}>Added {formatDate(selectedMockup.added || DEFAULT_ADDED)}</span>
          </p>
          {selectedMockup.relatedTo && selectedMockup.relatedTo.length > 0 && (
            <div style={styles.relatedRow}>
              <span style={{ color: t.textMuted, fontSize: 13 }}>See also:</span>
              {selectedMockup.relatedTo.map((name) => {
                const related = MOCKUP_REGISTRY.find(m => m.name === name);
                return related ? (
                  <a
                    key={name}
                    href={'#'}
                    style={{ ...styles.relatedLink, color: t.accent, background: t.relatedBg }}
                    onClick={(e) => { e.preventDefault(); selectMockup(related); }}
                  >
                    {name}
                  </a>
                ) : null;
              })}
            </div>
          )}
          <div style={styles.links}>
            {selectedMockup.figmaUrl && (
              <a href={selectedMockup.figmaUrl} target="_blank" rel="noopener" style={styles.figmaLink}>
                <span style={styles.figmaIcon}>◆</span> Open in Figma
              </a>
            )}
            {selectedMockup.htmlUrl && (
              <a href={import.meta.env.BASE_URL + selectedMockup.htmlUrl} target="_blank" rel="noopener" style={styles.htmlLink}>
                ↗ Open Full Page
              </a>
            )}
            {selectedMockup.specPath && (
              <a href={GITHUB_BASE + selectedMockup.specPath} target="_blank" rel="noopener" style={{ ...styles.link, color: t.accent }}>
                View Spec on GitHub
              </a>
            )}
            {selectedMockup.jira && selectedMockup.jira.map((key) => (
              <a key={key} href={JIRA_BASE + key} target="_blank" rel="noopener" style={{ ...styles.jiraBadge, background: t.jiraBg, color: t.jiraColor, borderColor: t.jiraBorder }} onClick={(e) => e.stopPropagation()}>
                {key}
              </a>
            ))}
          </div>
          {/* Detail tabs: Preview / Spec / Discussion */}
          {(() => {
            const hasPreview = !!(selectedMockup.component || selectedMockup.figmaUrl || selectedMockup.htmlUrl);
            const hasSpec = !!selectedMockup.specPath;
            const hasDiscussion = !!selectedMockup.githubIssue;
            const tabList = [];
            if (hasPreview) tabList.push('preview');
            if (hasSpec) tabList.push('spec');
            if (hasDiscussion) tabList.push('discussion');
            // Default: first available tab, or detailTab if it's in the list
            const activeTab = tabList.includes(detailTab) ? detailTab : tabList[0] || 'preview';
            const tabLabel = { preview: 'Mockup Preview', spec: 'Spec Document', discussion: 'Discussion' };
            return (
              <>
                {tabList.length > 1 && (
                  <div style={{ ...styles.detailTabs, borderBottomColor: t.border }}>
                    {tabList.map((tab) => (
                      <button
                        key={tab}
                        style={{ ...styles.detailTab, color: t.textMuted, ...(activeTab === tab ? { ...styles.detailTabActive, color: t.accent, borderBottomColor: t.accent } : {}) }}
                        onClick={() => setDetailTab(tab)}
                      >
                        {tabLabel[tab]}
                      </button>
                    ))}
                  </div>
                )}
                {tabList.length === 1 && (
                  <div style={{ ...styles.detailTabs, borderBottomColor: t.border }}>
                    <button style={{ ...styles.detailTab, ...styles.detailTabActive, color: t.accent, borderBottomColor: t.accent }}>{tabLabel[tabList[0]]}</button>
                  </div>
                )}
                <div style={{ ...styles.preview, background: t.previewBg, borderColor: t.border }}>
                  {activeTab === 'discussion' && hasDiscussion ? (
                    <CommentViewer issueNumber={selectedMockup.githubIssue} darkMode={darkMode} theme={t} designName={selectedMockup.name} />
                  ) : activeTab === 'spec' && hasSpec ? (
                    <SpecViewer specPath={selectedMockup.specPath} />
                  ) : selectedMockup.component ? (
                    <Suspense fallback={<div style={{ ...styles.loading, color: t.textMuted }}>Loading mockup...</div>}>
                      <ErrorBoundary name={selectedMockup.name}>
                        <selectedMockup.component />
                      </ErrorBoundary>
                    </Suspense>
                  ) : selectedMockup.figmaUrl ? (
                    <div style={styles.figmaEmbed}>
                      <iframe
                        src={selectedMockup.figmaUrl.replace('/make/', '/embed/') + '&embed-host=share'}
                        style={{ ...styles.figmaIframe, borderColor: t.border }}
                        allowFullScreen
                        title={selectedMockup.name}
                      />
                      <p style={{ ...styles.figmaFallback, color: t.textMuted }}>
                        If the embed doesn't load,{' '}
                        <a href={selectedMockup.figmaUrl} target="_blank" rel="noopener" style={{ ...styles.link, color: t.accent }}>
                          open directly in Figma
                        </a>
                      </p>
                    </div>
                  ) : selectedMockup.htmlUrl ? (
                    <div style={styles.figmaEmbed}>
                      <iframe
                        src={import.meta.env.BASE_URL + selectedMockup.htmlUrl}
                        style={{ ...styles.figmaIframe, height: 800, borderColor: t.border }}
                        allowFullScreen
                        title={selectedMockup.name}
                      />
                      <p style={{ ...styles.figmaFallback, color: t.textMuted }}>
                        <a href={import.meta.env.BASE_URL + selectedMockup.htmlUrl} target="_blank" rel="noopener" style={{ ...styles.link, color: t.accent }}>
                          Open mockup in full page ↗
                        </a>
                      </p>
                    </div>
                  ) : (
                    <div style={{ ...styles.loading, color: t.textMuted }}>No preview available for this entry.</div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.length === 0 ? (
            <div style={{ ...styles.empty, color: t.textMuted }}>No mockups match your search.</div>
          ) : (
            filtered.map((mockup, i) => {
              const etype = getEntryType(mockup);
              const typeConf = entryTypeConfig[etype];
              const typeBgDark = darkMode ? typeConf.color + '22' : typeConf.bg; // subtle alpha in dark mode
              return (
              <div
                key={i}
                style={{ ...styles.card, background: t.cardBg, borderColor: t.border, borderLeft: `3px solid ${typeConf.color}`, boxShadow: t.cardShadow }}
                onClick={() => selectMockup(mockup)}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = t.cardShadowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = t.cardShadow)}
              >
                <div style={styles.cardHeader}>
                  <span style={{ ...styles.badge, background: t.badgeBg, color: t.textSecondary }}>{categoryLabels[mockup.category]}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ ...styles.typeBadge, background: typeBgDark, color: typeConf.color }}>{typeConf.label}</span>
                    {mockup.specPath && etype !== 'spec' && <span style={{ ...styles.specBadge, background: t.specBadgeBg, color: t.specBadgeColor }}>has spec</span>}
                    {mockup.githubIssue && <span style={{ ...styles.specBadge, background: darkMode ? '#00264a' : '#e1f5fe', color: darkMode ? '#78a9ff' : '#0277bd' }}>💬</span>}
                  </div>
                </div>
                <h3 style={{ ...styles.cardTitle, color: t.text }}>{mockup.name}</h3>
                <p style={{ ...styles.cardDesc, color: t.textSecondary }}>{mockup.description}</p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                  <span style={{ ...styles.cardDate, margin: 0 }}>{formatDate(mockup.added || DEFAULT_ADDED)}</span>
                  {(() => { const effSt = getEffectiveStatus(mockup); const st = statusConfig[effSt]; return (
                    <span style={{ ...styles.statusBadge, background: darkMode ? st.darkBg : st.bg, color: st.color, borderColor: st.color + '44', fontSize: 10, padding: '1px 6px' }}>
                      {st.icon} {st.label}
                    </span>
                  ); })()}
                </div>
                {mockup.jira && mockup.jira.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {mockup.jira.map((key) => (
                      <a key={key} href={JIRA_BASE + key} target="_blank" rel="noopener" style={{ ...styles.jiraBadge, background: t.jiraBg, color: t.jiraColor, borderColor: t.jiraBorder }} onClick={(e) => e.stopPropagation()}>
                        {key}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: '#da1e28', background: '#fff1f1', borderRadius: 8 }}>
          <h3>Failed to render: {this.props.name}</h3>
          <p>This mockup may have dependencies not available in the gallery viewer. View the JSX source on GitHub instead.</p>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  container: { fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", maxWidth: 1200, margin: '0 auto', padding: 24 },
  header: { marginBottom: 24, borderBottom: '2px solid #0f62fe', paddingBottom: 16 },
  title: { margin: 0, fontSize: 28, color: '#161616' },
  subtitle: { margin: '4px 0 0', color: '#6f6f6f', fontSize: 14 },
  toolbar: { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-start' },
  search: { padding: '8px 12px', border: '1px solid #c6c6c6', borderRadius: 4, fontSize: 14, flex: '1 1 200px', minWidth: 200 },
  tabs: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  tab: { padding: '6px 12px', border: '1px solid #c6c6c6', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' },
  tabActive: { background: '#0f62fe', color: '#fff', borderColor: '#0f62fe' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { margin: '0 0 4px', fontSize: 16 },
  cardDesc: { margin: 0, color: '#525252', fontSize: 13, lineHeight: 1.4 },
  badge: { background: '#e0e0e0', padding: '2px 8px', borderRadius: 12, fontSize: 11, textTransform: 'uppercase', fontWeight: 600 },
  specBadge: { background: '#d0e2ff', color: '#0043ce', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  backButton: { background: 'none', border: 'none', color: '#0f62fe', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16 },
  mockupHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  description: { color: '#525252', marginBottom: 16 },
  links: { display: 'flex', gap: 16, marginBottom: 24 },
  link: { color: '#0f62fe', fontSize: 14, textDecoration: 'none' },
  permalinkButton: { background: '#e0e0e0', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: '#393939', fontWeight: 500 },
  preview: { border: '1px solid #e0e0e0', borderRadius: 8, padding: 24, background: '#f4f4f4', minHeight: 400, overflow: 'auto' },
  loading: { textAlign: 'center', padding: 40, color: '#6f6f6f' },
  empty: { gridColumn: '1 / -1', textAlign: 'center', padding: 60, color: '#6f6f6f', fontSize: 15 },
  figmaLink: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1e1e1e', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 14, textDecoration: 'none', fontWeight: 500 },
  figmaIcon: { color: '#a259ff', fontSize: 14 },
  figmaBadge: { background: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  htmlLink: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f62fe', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 14, textDecoration: 'none', fontWeight: 500 },
  htmlBadge: { background: '#edf5ff', color: '#0f62fe', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  figmaEmbed: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  figmaIframe: { width: '100%', height: 600, border: '1px solid #e0e0e0', borderRadius: 8 },
  figmaFallback: { color: '#6f6f6f', fontSize: 13 },
  jiraBadge: { display: 'inline-block', background: '#e8f5e9', color: '#1b5e20', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, textDecoration: 'none', border: '1px solid #c8e6c9', cursor: 'pointer' },
  typeBadge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  cardDate: { display: 'block', marginTop: 6, fontSize: 11, color: '#a8a8a8' },
  dateTag: { display: 'inline-block', marginLeft: 12, fontSize: 12, color: '#a8a8a8', fontStyle: 'italic' },
  relatedRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
  relatedLink: { color: '#0f62fe', fontSize: 13, textDecoration: 'none', padding: '2px 10px', background: '#edf5ff', borderRadius: 12, fontWeight: 500 },
  detailTabs: { display: 'flex', gap: 0, marginBottom: 0, borderBottom: '2px solid #e0e0e0' },
  detailTab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#6f6f6f', borderBottom: '2px solid transparent', marginBottom: -2, transition: 'color 0.15s, border-color 0.15s' },
  detailTabActive: { color: '#0f62fe', borderBottomColor: '#0f62fe' },
  specContent: { padding: '8px 0', fontSize: 14, lineHeight: 1.7, color: '#161616', maxWidth: 800 },
  specError: { padding: 24, textAlign: 'center', color: '#6f6f6f' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid' },
  statusSelect: { padding: '8px 12px', border: '1px solid #c6c6c6', borderRadius: 4, fontSize: 14, cursor: 'pointer' },
};

export default App;
