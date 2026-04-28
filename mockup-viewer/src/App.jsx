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
    tags: ['lookup-tables', 'reference-data', 'admin', 'configuration'],
  },
  {
    name: 'Lab Units',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/lab-units.jsx')),
    description: 'Laboratory units configuration',
    specPath: 'designs/admin-config/lab-units.md',
    githubIssue: 2,
    tags: ['units', 'measurement', 'admin', 'configuration'],
  },
  {
    name: 'Methods',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/methods.jsx')),
    description: 'Test methods management',
    specPath: 'designs/admin-config/methods.md',
    githubIssue: 3,
    tags: ['test-methods', 'admin', 'configuration'],
  },
  {
    name: 'Organizations Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/organizations-management.jsx')),
    description: 'Organizations and referring facilities management',
    specPath: 'designs/admin-config/organizations-management.md',
    githubIssue: 4,
    tags: ['organizations', 'sites', 'facilities', 'admin'],
  },
  {
    name: 'Barcode Configuration',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/barcode-config.jsx')),
    description: 'Barcode label configuration and printing — template design, field mapping, label previews, and bulk print queue for sample collection labels',
    specPath: 'designs/admin-config/barcode-config.md',
    added: '2026-04-13',
    status: 'draft',
    jira: ['OGC-527'],
    tags: ['barcode', 'labels', 'printing', 'admin', 'configuration', 'sample-collection'],
  },
  {
    name: 'Panel',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/panel.jsx')),
    description: 'Test panel configuration',
    specPath: 'designs/admin-config/panel.md',
    githubIssue: 5,
    tags: ['panels', 'test-groups', 'admin', 'configuration'],
  },
  {
    name: 'Range Editor',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/range-editor.jsx')),
    description: 'Normal range editor for test results',
    specPath: 'designs/admin-config/range-editor.md',
    githubIssue: 6,
    tags: ['reference-ranges', 'normal-values', 'age-sex', 'admin'],
  },
  {
    name: 'Result Options',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/result-options.jsx')),
    description: 'Result options (dictionary values) management',
    specPath: 'designs/admin-config/result-options.md',
    githubIssue: 7,
    tags: ['result-codes', 'dropdowns', 'admin', 'configuration'],
  },
  {
    name: 'Test Catalog',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-catalog.jsx')),
    description: 'Admin surface where lab managers define all tests offered — 14-section routed editor covering identity, result types, ranges, sample storage, panels, analyzers, alerts, AMR mapping, regulatory compliance thresholds, LOINC/SNOMED/CIEL/OCL terminology, and order entry configuration. Replaces five separate admin pages (Test, Section, Panel, Method, Reagent). v2.3: JSX–FRS reconciliation pass, Terminology Mappings section, Sample & Results Configuration, click-to-open row interaction, 226 i18n keys.',
    specPath: 'designs/admin-config/test-catalog.md',
    htmlUrl: 'designs/admin-config/test-catalog.html',
    added: '2026-04-27',
    status: 'draft',
    githubIssue: 8,
    jira: ['OGC-173'],
    tags: ['test-catalog', 'tests', 'admin', 'configuration', 'environmental', 'vector', 'LOINC', 'SNOMED'],
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
    tags: ['roles', 'permissions', 'access-control', 'security'],
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
    tags: ['security', 'authentication', 'password', 'admin'],
  },
  {
    name: 'Catalog Subscription',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/catalog-subscription-carbon.jsx')),
    description: 'Subscribe to external FHIR-based metadata catalogs (EUCAST, WHO, national reference labs) and selectively sync test definitions and clinical decision rules — field-level diff review preserves local customizations',
    specPath: 'designs/admin-config/catalog-subscription.md',
    htmlUrl: 'designs/admin-config/catalog-subscription.html',
    added: '2026-03-24',
    status: 'draft',
    githubIssue: 63,
    jira: ['OGC-447'],
    tags: ['FHIR', 'catalog', 'sync', 'interoperability'],
  },
  {
    name: 'Compliance Standards Administration',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/admin-config/compliance-standards-admin.jsx')),
    description: 'Admin configuration for compliance standards (ISO 15189, WHO, CLSI) — link standards to test catalog entries, QC rules, and sampling protocols. Part of the Vector/Environmental LIMS epic.',
    specPath: 'designs/admin-config/compliance-standards-admin.md',
    htmlUrl: 'designs/admin-config/compliance-standards-admin.html',
    added: '2026-04-02',
    status: 'draft',
    githubIssue: 72,
    jira: ['OGC-528'],
    tags: ['compliance', 'ISO-15189', 'standards', 'vector', 'environmental'],
  },
  {
    name: 'Sample Type Domain Classification',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/admin-config/sample-type-domain-classification.jsx')),
    description: 'Sample Type Domain Classification (S-04) — adds sampleDomain enum (CLINICAL/ENVIRONMENTAL/BOTH) to Sample Type entity, bulk assignment utility, and workflow toggle filtering. Addendum to OGC-296.',
    specPath: 'designs/admin-config/sample-type-domain-classification.md',
    htmlUrl: 'designs/admin-config/sample-type-domain-classification.html',
    added: '2026-04-03',
    status: 'draft',
    githubIssue: 75,
    jira: ['OGC-538', 'OGC-296'],
    tags: ['sample-type', 'domain', 'environmental', 'vector', 'classification', 'admin'],
  },
  {
    name: 'Sample Type Multi-Domain Addendum',
    category: 'admin-config',
    component: null,
    description: 'OGC-296 Addendum — replaces single-value sampleDomain enum with Set<SampleDomain> so a sample type can belong to multiple domain contexts simultaneously (Clinical, Environmental, Vector). Covers entity change, migration, API serialization as string array, and S-04 UI impact (CheckboxGroup replacing single Select).',
    specPath: 'designs/admin-config/sample-type-multi-domain-addendum.md',
    htmlUrl: 'designs/admin-config/sample-type-multi-domain-addendum.html',
    added: '2026-04-21',
    status: 'draft',
    githubIssue: 90,
    jira: ['OGC-296', 'OGC-538'],
    relatedTo: ['Sample Type Domain Classification'],
    tags: ['sample-type', 'domain', 'environmental', 'vector', 'classification', 'admin', 'OGC-296'],
  },
  {
    name: 'Concept Mapping & Multi-Coding',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/concept-mapping-multi-coding.jsx')),
    description: 'T-01 — polymorphic ConceptMapping table enabling any supported entity (Test, SampleType, VectorSpecies, VectorGroup, ComplianceThreshold) to carry multiple codings across multiple code systems. Builds out the stubbed Terminology tab in Test Editor with a shared <MultiCodingPanel> component. Primary-first FHIR CodeableConcept emission. Integrates with Catalog & Terminology Subscription (OGC-447 v1.1).',
    specPath: 'designs/admin-config/concept-mapping-multi-coding.md',
    htmlUrl: 'designs/admin-config/concept-mapping-multi-coding.html',
    added: '2026-04-21',
    status: 'draft',
    githubIssue: 91,
    jira: ['OGC-173', 'OGC-447', 'OGC-527'],
    relatedTo: ['Test Catalog', 'Catalog Subscription', 'Vector Specimen Types & Taxonomy'],
    tags: ['terminology', 'LOINC', 'FHIR', 'CodeableConcept', 'multi-coding', 'interoperability', 'vector', 'environmental', 'Indonesia'],
  },
  {
    name: 'User Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/user-management.jsx')),
    description: 'Phase 5 admin redesign — People & Access bucket. User list with role badges, inline create/edit with Carbon SideNav submenu, role assignment multi-select, account status toggle, last-login audit, and permission-gated actions. Covers ROLE_MANAGE and USER_MANAGE permission keys.',
    specPath: 'designs/admin-config/user-management.md',
    htmlUrl: 'designs/admin-config/user-management.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 96,
    tags: ['admin', 'users', 'roles', 'permissions', 'access-control', 'phase-5'],
  },
  {
    name: 'Test Accreditation & Report Logo Threshold',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-accreditation.jsx')),
    description: 'Manage accrediting bodies and per-test accreditations from two dedicated Carbon SideNav submenu pages under Test Catalog Management. Conditionally render per-body accreditation logos on patient result reports based on configurable logo visibility thresholds (Any accredited test vs. percentage). FRS v4.',
    specPath: 'designs/admin-config/test-accreditation.md',
    htmlUrl: 'designs/admin-config/test-accreditation.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 97,
    relatedTo: ['Test Catalog', 'Patient Report Print Queue', 'Patient Report Redesign'],
    tags: ['admin', 'accreditation', 'test-catalog', 'reports', 'logo', 'iso-15189'],
  },
  {
    name: 'Reporting Ranges by Method',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/reporting-ranges-by-method.jsx')),
    description: 'Per-method reporting ranges for Test Catalog — allowed-methods model per test, Methods admin page (P-01 table pattern), per-method range editor (inline row-expand), and CSV import extension. FRS v2.',
    specPath: 'designs/admin-config/reporting-ranges-by-method.md',
    htmlUrl: 'designs/admin-config/reporting-ranges-by-method.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 98,
    relatedTo: ['Test Catalog', 'Range Editor'],
    tags: ['admin', 'test-catalog', 'ranges', 'methods', 'reference-ranges', 'CSV'],
  },
  {
    name: 'Admin Shell',
    category: 'admin-config',
    component: null,
    description: 'Phase 5 admin shell design brief — the SideNav + header chrome that hosts every admin page. Defines the canonical two-column layout (240px SideNav + content column), breadcrumb pattern, page-level action bar placement, and responsive collapse behavior.',
    specPath: 'designs/admin-config/admin-shell.md',
    htmlUrl: 'designs/admin-config/admin-shell.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 99,
    tags: ['admin', 'shell', 'navigation', 'sidenav', 'layout', 'phase-5'],
  },
  {
    name: 'Admin Pattern Library',
    category: 'admin-config',
    component: null,
    description: 'Canonical Carbon component patterns for all OpenELIS admin pages — P-01 Admin Table, P-02 Inline Row-Expand Edit, P-03 Create Modal, P-04 Confirm-Delete Modal, P-05 Form Validation, P-06 Empty State, P-09 Breadcrumb + Header, P-13 Permission Gate. Reference for all Phase 5 admin page specs.',
    specPath: 'designs/admin-config/admin-pattern-library.md',
    htmlUrl: 'designs/admin-config/admin-pattern-library.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 100,
    tags: ['admin', 'patterns', 'carbon', 'design-system', 'phase-5', 'reference'],
  },
  {
    name: 'Admin Phase 5 Roadmap',
    category: 'admin-config',
    component: null,
    description: 'Roadmap for Phase 5 admin redesign — covers all admin pages bucketed into People & Access, Test Catalog, Configuration, QC & Quality, and Reports & Analytics. Sequencing, dependency graph, and spec completion status.',
    specPath: 'designs/admin-config/admin-phase5-roadmap.md',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 101,
    tags: ['admin', 'roadmap', 'planning', 'phase-5'],
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
    tags: ['analyzer', 'Sysmex', 'hematology', 'ASTM', 'field-mapping'],
  },
  {
    name: 'BioRad CFX Opus Connection Spec',
    category: 'analyzer-integration',
    component: null,
    description: 'BioRad CFX Opus Real-Time PCR — CSV/RDML export, LIMS integration via CFX Maestro',
    specPath: 'designs/analyzer-integration/biorad-cfx-opus-analyzer-connection-spec.md',
    added: '2026-03-05',
    githubIssue: 11,
    tags: ['analyzer', 'BioRad', 'PCR', 'qPCR', 'connection-spec'],
  },
  {
    name: 'Sysmex XN-L Series Field Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'Sysmex XN-L Series (XN-330 through XN-550) ASTM host-query bi-directional integration spec',
    specPath: 'designs/analyzer-integration/sysmex-xn-field-mapping-v0.1.md',
    added: '2026-03-06',
    githubIssue: 12,
    tags: ['analyzer', 'Sysmex', 'hematology', 'field-mapping'],
  },
  {
    name: 'DNA Technology DT-Prime Field Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'DNA Technology DT-Prime Real-Time PCR — XML file-based export, qualitative results parsing',
    specPath: 'designs/analyzer-integration/dna-technology-dtprime-field-mapping-v0.2.md',
    added: '2026-03-06',
    githubIssue: 13,
    tags: ['analyzer', 'PCR', 'HIV', 'viral-load', 'field-mapping'],
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
    tags: ['analyzer', 'Tecan', 'ELISA', 'connection-spec'],
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
    tags: ['analyzer', 'Thermo', 'ELISA', 'connection-spec'],
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
    tags: ['analyzer', 'QuantStudio', 'PCR', 'HIV', 'field-mapping'],
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
    tags: ['analyzer', 'QuantStudio', 'PCR', 'setup-guide'],
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
    tags: ['analyzer', 'FluoroCycler', 'PCR', 'ASTM'],
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
    tags: ['analyzer', 'FluoroCycler', 'PCR', 'setup-guide'],
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
    tags: ['analyzer', 'Tecan', 'ELISA', 'setup-guide'],
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
    tags: ['analyzer', 'Thermo', 'ELISA', 'setup-guide'],
  },
  {
    name: 'Analyzer File Upload',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/analyzer-file-upload.jsx')),
    description: 'Upload and process analyzer result files',
    specPath: 'designs/analyzer-integration/analyzer-file-upload.md',
    jira: ['OGC-173', 'OGC-189', 'OGC-214', 'OGC-224'],
    githubIssue: 22,
    tags: ['analyzer', 'file-upload', 'import', 'CSV'],
  },
  {
    name: 'Analyzer Mapping Templates',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/analyzer-mapping-templates.jsx')),
    description: 'Configure analyzer-to-test mapping templates',
    specPath: 'designs/analyzer-integration/astm-analyzer-mapping-addendum.md',
    jira: ['OGC-173'],
    githubIssue: 23,
    tags: ['analyzer', 'mapping', 'templates', 'configuration'],
  },
  {
    name: 'Flat File Analyzer Config',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/flat-file-analyzer-config.jsx')),
    description: 'Configure flat file (CSV/TSV) analyzer parsers',
    specPath: 'designs/analyzer-integration/flat-file-analyzer-config.md',
    jira: ['OGC-324'],
    githubIssue: 24,
    tags: ['analyzer', 'flat-file', 'CSV', 'configuration'],
  },
  {
    name: 'HL7 Analyzer Mapping',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/hl7-analyzer-mapping.jsx')),
    description: 'HL7 message field mapping for analyzers',
    specPath: 'designs/analyzer-integration/hl7-analyzer-mapping-addendum.md',
    jira: ['OGC-324'],
    githubIssue: 25,
    tags: ['analyzer', 'HL7', 'MLLP', 'mapping', 'interface'],
  },
  // ─── Microbiology ───
  {
    name: 'AMR Module',
    category: 'microbiology',
    component: React.lazy(() => import('@designs/microbiology/amr-module.jsx')),
    description: 'Antimicrobial resistance testing and reporting module',
    specPath: 'designs/microbiology/amr-module.md',
    githubIssue: 26,
    tags: ['microbiology', 'AMR', 'antibiotic-resistance', 'WHONET', 'culture'],
  },

  // ─── NCE ───
  {
    name: 'NCE Analytics',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-analytics.jsx')),
    description: 'Non-conforming event analytics dashboard',
    specPath: 'designs/nce/nce-analytics.md',
    githubIssue: 27,
    tags: ['NCE', 'non-conforming', 'quality', 'analytics'],
  },
  {
    name: 'NCE Dashboard & CAPA',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-dashboard.jsx')),
    description: 'NCE Register & CAPA Management — FRS v4.0. NCE dashboard with CAPA tracking, effectiveness review, and SideNav nav chrome update.',
    specPath: 'designs/nce/nce-dashboard-v4.0.md',
    added: '2026-04-24',
    githubIssue: 28,
    tags: ['NCE', 'CAPA', 'corrective-action', 'quality', 'dashboard'],
  },
  {
    name: 'NCE Results Entry',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-results-entry.jsx')),
    description: 'NCE investigation results entry form',
    specPath: 'designs/nce/nce-results-entry.md',
    githubIssue: 29,
    tags: ['NCE', 'non-conforming', 'results-entry', 'quality'],
  },
  {
    name: 'NCE Report',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-report.jsx')),
    description: 'Non-conformity report generation',
    specPath: 'designs/nce/nce-report.md',
    githubIssue: 30,
    tags: ['NCE', 'quality', 'report', 'non-conforming'],
  },

  // ─── Pathology ───
  {
    name: 'Pathology Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/pathology-case-view.jsx')),
    description: 'Pathology case view and reporting redesign',
    specPath: 'designs/pathology/pathology-case-view.md',
    githubIssue: 31,
    tags: ['pathology', 'histology', 'biopsy', 'case-management'],
  },
  {
    name: 'IHC Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/ihc-case-view.jsx')),
    description: 'Immunohistochemistry case view and scoring',
    specPath: 'designs/pathology/ihc-case-view.md',
    githubIssue: 32,
    tags: ['pathology', 'IHC', 'immunohistochemistry', 'staining'],
  },

  {
    name: 'Cytology Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/cytology-case-view.jsx')),
    description: 'Cytology case view with Bethesda System wizard workflow',
    specPath: 'designs/pathology/cytology-case-view.md',
    githubIssue: 33,
    tags: ['pathology', 'cytology', 'Bethesda', 'PAP-smear'],
  },

  // ─── Quality & EQA ───
  {
    name: 'EQA Enrollment',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/eqa-enrollment.jsx')),
    description: 'EQA program enrollment, self-enrollment, and provider management',
    specPath: 'designs/quality/eqa-enrollment-addendum.md',
    githubIssue: 34,
    tags: ['quality', 'EQA', 'proficiency-testing', 'external-QA'],
  },
  {
    name: 'EQA V1 ↔ V2 Crosswalk',
    category: 'quality',
    component: null,
    description: 'Reconciliation of the EQA workflow compilation against V1 FRS (eqa-requirements.md + eqa-enrollment-addendum.md) and existing mockup. Corrects ~30% of "Missing" flags in the compilation, establishes the true V2 amendment scope, and surfaces resolved decisions (separate eqa_participant_result entity, polymorphic eqa_scheme, Carbon port, tiered NCE integration, per-analyst competency).',
    specPath: 'designs/quality/eqa-v1-crosswalk.md',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 93,
    relatedTo: ['EQA Enrollment', 'EQA V2 Epic & Stories', 'EQA V2 Design Critique'],
    tags: ['quality', 'EQA', 'iso-15189', 'proficiency-testing', 'crosswalk', 'planning'],
  },
  {
    name: 'EQA V2 ↔ APHL ePT Platform Crosswalk',
    category: 'quality',
    component: null,
    description: 'Feature-by-feature comparison of OpenELIS EQA V2 MVP against APHL ePT (deforay/ept, AGPL-3.0) — the most widely deployed open-source PT platform in LMIC. Covers architectural comparison, differentiators of the integrated LIMS model, gaps (certificate issuance, multi-cycle analytics, cold-chain), and lessons for V2/V3 scoping. Informational; no binding scope changes.',
    specPath: 'designs/quality/eqa-v2-ept-platform-crosswalk.md',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 94,
    relatedTo: ['EQA Enrollment', 'EQA V2 Epic & Stories'],
    tags: ['quality', 'EQA', 'proficiency-testing', 'ePT', 'APHL', 'crosswalk', 'planning'],
  },
  {
    name: 'EQA V2 Epic & Stories',
    category: 'quality',
    component: null,
    description: 'Jira-ready Epic + Story set for EQA V2 MVP (V2.1–V2.5) and V3 Enhancements. Covers complete lifecycle: Cycle/Round entity + state machine, eqa_participant_result lifecycle, polymorphic eqa_scheme, eligible-analyst mapping, Carbon-port of V1 enrollment UI, cycle progress dashboard, auto-submit via FHIR + manual fallback, EQA→NCE tiered integration, Lab Performance dashboard, Analyst Competency view, In-House Blinding Workflow, and Provider-Side Program. V3 adds multi-cycle analytics, ISO 17043 full compliance, cold-chain receipt, and IQC correlation. Updated: panel receipt (V2.2 FR-V2.2-12) redesigned as EQA-conditional section on the standard Add Order screen — no separate modal. V3.2 extends the same section in-place with packaging checklist, tolerance validation, and disposition radio. Pending Casey approval before filing to OGC.',
    specPath: 'designs/quality/eqa-v2-epic-and-stories.md',
    htmlUrl: 'designs/quality/eqa-v2-preview.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 95,
    relatedTo: ['EQA Enrollment', 'EQA V1 ↔ V2 Crosswalk', 'EQA V2 ↔ APHL ePT Platform Crosswalk', 'EQA V2 Design Critique'],
    tags: ['quality', 'EQA', 'iso-15189', 'iso-17043', 'proficiency-testing', 'epic', 'planning', 'jira'],
  },
  {
    name: 'EQA V2 Design Critique',
    category: 'quality',
    component: null,
    description: 'Structural consistency scan of EQA V2 (Epic + Stories, preview, crosswalks) — five-pass /analyze across i18n, Carbon fidelity, interaction patterns, constitution alignment, and coverage gaps. 10 findings: 1 HIGH (per-analyst column integration point undocumented), 3 MEDIUM (label sheet affordance, repeat-shipment reprovisioning, provider IA role-conditional rendering), 4 LOW (terminology drifts). No V2 blockers; V3 expansion is clear to proceed. Follow-up addendum: panel receipt redesign rationale documented — receipt fields move to EQA-conditional section on standard Add Order, V3.2 cold-chain extension layers in-place on same section.',
    specPath: 'designs/quality/eqa-v2-critique.md',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 103,
    relatedTo: ['EQA V2 Epic & Stories', 'EQA V1 ↔ V2 Crosswalk'],
    tags: ['quality', 'EQA', 'design-critique', 'analyze', 'iso-15189', 'planning'],
  },

  {
    name: 'Westgard Dashboard',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/westgard-dashboard.jsx')),
    description: 'Laboratory Instrument Compliance Dashboard with Westgard QC rules',
    specPath: 'designs/quality/westgard-rules.md',
    githubIssue: 35,
    tags: ['quality', 'Westgard', 'QC-rules', 'IQC', 'dashboard'],
  },
  {
    name: 'Batch Workplan Reagent QC',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/batch-workplan-reagent-qc.jsx')),
    description: 'Unified batch workplan with reagent lot assignment, QC verification, and automatic NCE generation on override. v1.1: aligns with merged Westgard QC engine (OGC-41, PR #3390) — QC inline entry fires QCResultCreatedEvent → existing async Westgard evaluator; QC frequency moved from Reagent to QCControlLot; new QcRun entity removed (uses existing QCResult); PER_SHIFT frequency added; NCE override links to specific QCResult + QCRuleViolation.',
    specPath: 'designs/quality/batch-workplan-reagent-qc.md',
    jira: ['OGC-427'],
    added: '2026-03-16',
    status: 'approved',
    githubIssue: 52,
    relatedTo: ['Analyzer Manual QC'],
    tags: ['quality', 'batch', 'workplan', 'reagent-QC', 'westgard', 'NCE'],
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
    relatedTo: ['Batch Workplan Reagent QC'],
    tags: ['quality', 'QC', 'analyzer', 'manual-entry'],
  },
  {
    name: 'Environmental QC Rules',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/environmental-qc-rules.jsx')),
    description: 'Environmental QC Rules (S-08) — field blank, trip blank, duplicate sample (RPD), spike recovery. Per-standard QC protocol configuration, QC sample creation at order entry, inline QC results tab, and QC warning with acknowledgment modal on validation.',
    specPath: 'designs/quality/environmental-qc-rules.md',
    htmlUrl: 'designs/quality/environmental-qc-rules.html',
    added: '2026-04-10',
    status: 'draft',
    githubIssue: 79,
    jira: ['OGC-554', 'OGC-527'],
    tags: ['quality', 'QC', 'environmental', 'vector', 'field-blank', 'trip-blank', 'duplicate', 'spike-recovery'],
  },

  // ─── Vector Surveillance ───
  {
    name: 'Vector Specimen Types & Taxonomy',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/vector-reference-data.jsx')),
    description: 'Vector reference data (V-01) — species taxonomy (genus + species + subspecies), trap types, and vector sample types with pooling strategy. Establishes the foundation for vector surveillance by extending SampleType.sampleDomain with VECTOR, adding VectorSpecimenProfile for pooling configuration, and seeding ~40 species and 15 trap types used in Indonesia.',
    specPath: 'designs/vector-surveillance/vector-reference-data.md',
    htmlUrl: 'designs/vector-surveillance/vector-reference-data.html',
    added: '2026-04-13',
    status: 'draft',
    githubIssue: 80,
    jira: ['OGC-555', 'OGC-527'],
    tags: ['vector', 'species', 'taxonomy', 'trap-types', 'mosquito', 'tick', 'rodent', 'reference-data', 'pooling'],
  },
  {
    name: 'Vector Collection Workflow',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/vector-collection-workflow.jsx')),
    description: 'V-02 Vector Collection Workflow — extends the 4-step Sample Collection Redesign with a Vector domain toggle (Clinical | Environmental / Other | Vector). Adds CollectionLot entity with trap type, GPS coordinates (pre-filled from sampling site), pool flag, organism count, weather conditions, receipt confirmation, and S-09 eligibility gate integration at Step 4.',
    specPath: 'designs/vector-surveillance/vector-collection-workflow.md',
    htmlUrl: 'designs/vector-surveillance/vector-collection-workflow.html',
    added: '2026-04-17',
    status: 'draft',
    jira: ['OGC-527'],
    tags: ['vector', 'collection', 'workflow', 'sample-collection', 'Indonesia', 'mosquito', 'tick', 'GPS', 'pooling', 'eligibility-gate'],
  },
  {
    name: 'Vector Testing & Identification',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/vector-testing-identification.jsx')),
    description: 'V-03 Vector Testing & Identification (v1.11) — species identification workbench with inline per-specimen form, bulk-apply for homogeneous lots, physiological state capture (UNFED/BLOOD_FED/HALF_GRAVID/GRAVID per Detinova classification), molecular detail (target gene, assay, GenBank accession), pool deconvolution (positive pool → LABNO.X-Y aliquots → re-test). Blood-meal analysis, Plasmodium drug-resistance genotyping, and vector insecticide-resistance now in V-03 scope via reflex rules. Auto-suggests Blood-Meal Panel when physiologicalState = BLOOD_FED. Seed Panels: Dengue, Malaria, Chikungunya, Blood-Meal ID, Plasmodium Drug Resistance, Vector Insecticide Resistance. Reflex rules VR-01–VR-06.',
    specPath: 'designs/vector-surveillance/vector-testing-identification.md',
    htmlUrl: 'designs/vector-surveillance/vector-testing-identification.html',
    added: '2026-04-17',
    status: 'draft',
    jira: ['OGC-527', 'OGC-583'],
    tags: ['vector', 'identification', 'species', 'pathogen', 'panel', 'deconvolution', 'Indonesia', 'mosquito', 'molecular', 'PCR', 'pool', 'blood-meal', 'reflex', 'physiology'],
  },
  {
    name: 'Vector Surveillance Reporting',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/vector-surveillance-reporting.jsx')),
    description: 'V-04 Vector Surveillance Reporting (v1.3) — Apache Superset embedded via guest token JWT into Reports → Vector Surveillance. Six OHS SQL-on-FHIR views: vector_collection_density_daily, vector_specimen_ids, vector_pathogen_results, vector_mir_weekly (dual MIR: mir_classic + infection_rate_per_1000 with positive_resolution_pct), vector_collection_lots, vector_qc_monitoring. QC sample exclusion via analysis_qaevent join. Dashboard #7 QC Pass Rate. FHIR DiagnosticReport qaEventType extension. PDF export via headless Chromium. Threshold email alerts via Superset native engine.',
    specPath: 'designs/vector-surveillance/vector-surveillance-reporting.md',
    htmlUrl: 'designs/vector-surveillance/vector-surveillance-reporting.html',
    added: '2026-04-20',
    status: 'draft',
    jira: ['OGC-585', 'OGC-527'],
    tags: ['vector', 'surveillance', 'reporting', 'superset', 'dashboard', 'fhir', 'ohs', 'analytics', 'MIR', 'Indonesia', 'mosquito', 'QC', 'infection-rate'],
  },

  // ─── Results & Validation ───
  {
    name: 'Results Page',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/results-validation/results-page.jsx')),
    description: 'Main results entry and review page',
    specPath: 'designs/results-validation/results-page.md',
    githubIssue: 36,
    jira: ['OGC-517'],
    tags: ['results', 'data-entry', 'workflow', 'entry', 'environmental', 'vector'],
  },
  {
    name: 'Validation Page',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/results-validation/validation-page.jsx')),
    description: 'Result validation workflow',
    specPath: 'designs/results-validation/validation-page.md',
    githubIssue: 37,
    jira: ['OGC-343'],
    tags: ['validation', 'results', 'review', 'approval', 'environmental', 'vector'],
  },
  {
    name: 'Validation Page (Analyzer)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/analyzer-integration/validation-page.jsx')),
    description: 'Analyzer result validation workflow',
    specPath: 'designs/analyzer-integration/validation-page.md',
    githubIssue: 38,
    tags: ['validation', 'analyzer', 'results', 'review'],
  },

  {
    name: 'Validation Page v2 (Full Redesign)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/validation-page/validation-page-mockup-v2.jsx')),
    description: 'Full v2 redesign — multi-level validation pipeline, admin config, role-based levels, auto-validation',
    specPath: 'designs/validation-page/validation-page-requirements-v2.md',
    added: '2026-03-04',
    githubIssue: 39,
    tags: ['validation', 'redesign', 'results', 'review'],
  },
  {
    name: 'Validation Page v2.1 (Stage 1)',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/validation-page/validation-page-stage1-mockup.jsx')),
    description: 'Stage 1 scoped — multi-signature pipeline with minimal UI changes to existing validation page',
    specPath: 'designs/validation-page/validation-page-requirements-v2.1-stage1.md',
    added: '2026-03-04',
    githubIssue: 40,
    tags: ['validation', 'results', 'stage-1', 'incremental'],
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
    tags: ['validation', 'demographics', 'patient', 'results'],
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
    tags: ['patient', 'demographics', 'validation', 'results'],
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
    tags: ['patient', 'demographics', 'FRS', 'spec'],
  },
  {
    name: 'Compliance Evaluation Engine',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/results-validation/compliance-evaluation-engine.jsx')),
    description: 'S-05 v2.0 — Regulation-scoped reference ranges: numeric threshold evaluation (pass/marginal/exceedance/critical) against regulatory standard per test, unit conversion, override workflow with NCE link. v2.0 rewrite splits descriptive/categorical vocabulary to S-05a; focuses entirely on numeric range evaluation pattern parallel to S-08 QC evaluator.',
    specPath: 'designs/results-validation/compliance-evaluation-engine.md',
    htmlUrl: 'designs/results-validation/compliance-evaluation-engine.html',
    added: '2026-04-04',
    status: 'draft',
    githubIssue: 76,
    jira: ['OGC-547', 'OGC-527'],
    relatedTo: ['Reusable Categorical Vocabulary'],
    tags: ['compliance', 'evaluation', 'environmental', 'vector', 'results', 'thresholds'],
  },
  {
    name: 'Reusable Categorical Vocabulary',
    category: 'vector-surveillance',
    component: null,
    description: 'S-05a — Reusable categorical result vocabulary, split from S-05 v1.0. Admin surface for defining reusable descriptive tag sets (e.g. specimen quality flags, vector physiological state, clinical morphology) that can be attached to any test result type. Domain-neutral; extends beyond env/compliance use cases.',
    specPath: 'designs/results-validation/reusable-categorical-vocabulary.md',
    added: '2026-04-27',
    status: 'draft',
    relatedTo: ['Compliance Evaluation Engine'],
    jira: ['OGC-527'],
    tags: ['compliance', 'vocabulary', 'categorical', 'environmental', 'vector', 'clinical', 'results'],
  },
  // ─── Reports ───
  {
    name: 'Laporan Hasil — Compliance Report',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/reports/laporan-hasil-compliance-report.jsx')),
    description: 'Laporan Hasil (S-06) — formal Sertifikat Hasil Uji (Test Results Certificate) PDF generation for validated environmental orders. Dual e-signature, batch ZIP download, shared Report Print Configuration admin page.',
    specPath: 'designs/reports/laporan-hasil-compliance-report.md',
    htmlUrl: 'designs/reports/laporan-hasil-compliance-report.html',
    added: '2026-04-05',
    status: 'draft',
    githubIssue: 77,
    jira: ['OGC-552', 'OGC-527'],
    tags: ['compliance', 'report', 'environmental', 'vector', 'certificate', 'pdf', 'laporan-hasil'],
  },
  {
    name: 'LH Delivery — Sent Messages Tab',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/reports/lh-delivery-sent-messages.jsx')),
    description: 'S-06b Addendum — LH Delivery Notification: Sent Messages global main-menu tab. Per-channel delivery status (Email ✓/✗, WhatsApp ✓/✗) for Laporan Hasil, clinical, and future notifications. Extends OGC-437 (TextIt SMS) + OGC-439 (Email/SMTP) triggers with LH_COMPLETED event. Resend flow, delivery log modal, and secure customer download page with 30-day token.',
    specPath: 'designs/reports/lh-delivery-sent-messages.md',
    added: '2026-04-20',
    status: 'draft',
    githubIssue: 83,
    jira: ['OGC-587', 'OGC-552', 'OGC-527'],
    tags: ['compliance', 'notification', 'environmental', 'vector', 'SMS', 'email', 'delivery', 'laporan-hasil', 'Indonesia', 'SILNAS'],
  },
  {
    name: 'Patient Report Print Queue',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/patient-report-print-queue.jsx')),
    description: 'Push-based print queue for validated patient reports — auto-surfaces unprinted accessions with batch print and ISO 15189 audit trail',
    specPath: 'designs/reports/patient-report-print-queue.md',
    added: '2026-03-18',
    status: 'draft',
    githubIssue: 54,
    tags: ['reports', 'print', 'queue', 'patient-report'],
  },
  {
    name: 'Patient Report Redesign',
    category: 'reports',
    component: null,
    description: 'Full redesign of the patient result report — Carbon-aligned layout, accreditation logo, digital signature block, reference range display, result interpretation flagging. Ships two JRXML templates: patient_letter.jrxml (US Letter) and patient_a4.jrxml (A4), selected via Admin → General Configuration → Printed Reports Configuration. Companion patient_letter.jrxml implementation file co-located in designs/reports/. Covers the admin config surface, rendered output spec, and Jasper coordinate-level implementation notes.',
    specPath: 'designs/reports/patient-report-redesign.md',
    htmlUrl: 'designs/reports/patient-report-redesign.html',
    added: '2026-04-24',
    status: 'draft',
    githubIssue: 102,
    relatedTo: ['Patient Report Print Queue', 'Test Accreditation & Report Logo Threshold'],
    tags: ['reports', 'patient-report', 'print', 'accreditation', 'jasper', 'iso-15189', 'A4', 'letter', 'jrxml'],
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
    tags: ['reports', 'positivity', 'HIV', 'malaria', 'dashboard-widget'],
  },
  {
    name: 'Environmental Dashboard & Trend Analysis',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/reports/environmental-dashboard.jsx')),
    description: 'Environmental Dashboard (S-07) — site-level compliance rate trends, per-parameter drill-down, exceedance summary table, site comparison bar chart, CSV export. Monthly aggregation with 12-month default view.',
    specPath: 'designs/reports/environmental-dashboard.md',
    htmlUrl: 'designs/reports/environmental-dashboard.html',
    added: '2026-04-10',
    status: 'draft',
    githubIssue: 78,
    jira: ['OGC-553', 'OGC-527'],
    tags: ['compliance', 'environmental', 'vector', 'dashboard', 'trends', 'charts'],
  },
  {
    name: 'ENV Dashboard — Chart & PDF Export',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/reports/environmental-dashboard-chart-export.jsx')),
    description: 'S-07b Addendum — Chart PNG & Dashboard PDF Export. Per-chart hover download button (client-side SVG→PNG, 1200×800px @144dpi). Full-dashboard PDF export: config modal, server-side generation, cover page, one chart per page, exceedance table, footer. ROLE_ENV_EXPORT permission gates both actions. Annotated mockup shows new S-07b additions in context of the existing S-07 dashboard (gold dashed border = new, dimmed = existing).',
    specPath: 'designs/reports/environmental-dashboard-chart-export.md',
    added: '2026-04-20',
    status: 'draft',
    githubIssue: 84,
    jira: ['OGC-553', 'OGC-527'],
    tags: ['compliance', 'environmental', 'vector', 'dashboard', 'export', 'PNG', 'PDF', 'charts', 'Indonesia'],
  },
  {
    name: 'Disease Surveillance Dashboard',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/disease-surveillance-dashboard.jsx')),
    description: 'Public-health surveillance dashboard — weekly TB/HIV positivity trends, volume-by-site breakdowns, and FHIR-sourced aggregate indicators for program managers',
    specPath: 'designs/reports/disease-surveillance-dashboard.md',
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 57,
    tags: ['reports', 'surveillance', 'public-health', 'FHIR', 'dashboard'],
  },
  {
    name: 'Custom Data Export',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/custom-data-export.jsx')),
    description: '3-step report builder wizard with field selection, filter configuration, and scheduling — plus async My Report Queue and Saved Export Configurations panel',
    specPath: 'designs/reports/custom-data-export.md',
    htmlUrl: 'designs/reports/custom-data-export.html',
    added: '2026-03-25',
    status: 'draft',
    githubIssue: 70,
    jira: ['OGC-479', 'OGC-481', 'OGC-483'],
    tags: ['reports', 'export', 'CSV', 'data-export', 'async-queue'],
  },
  {
    name: 'TAT Report',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/tat-report.jsx')),
    description: 'Turn Around Time Report — summary stats, detail list, trends, and CSV export for lab performance analysis (OGC-307)',
    specPath: 'designs/reports/tat-report.md',
    githubIssue: null,
    jira: ['OGC-307', 'OGC-310'],
    tags: ['TAT', 'turnaround-time', 'report', 'analytics', 'performance'],
    relatedTo: ['Calendar Management', 'TAT Dashboard'],
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
    tags: ['notifications', 'email', 'SMS', 'alerts', 'admin'],
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
    tags: ['notifications', 'SMS', 'TextIt', 'messaging'],
  },

  // ─── Inventory ───
  {
    name: 'Reagent Forecasting Workbench',
    category: 'inventory',
    component: React.lazy(() => import('@designs/inventory/reagent-forecasting-workbench.jsx')),
    description: 'National/regional reagent forecasting workbench — multi-facility days-of-stock table, critical/low alerts, ADC-based projections, and reorder planning for program managers',
    specPath: 'designs/inventory/reagent-forecasting-workbench.md',
    added: '2026-03-23',
    status: 'draft',
    githubIssue: 60,
    relatedTo: ['Reagent Forecasting Facility View'],
    tags: ['inventory', 'reagents', 'forecasting', 'stock'],
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
    tags: ['inventory', 'reagents', 'forecasting', 'facility'],
  },

  // ─── System ───
  {
    name: 'Audit Trail',
    category: 'system',
    component: React.lazy(() => import('@designs/system/audit-trail.jsx')),
    description: 'System audit trail viewer',
    specPath: 'designs/system/audit-trail.md',
    githubIssue: 43,
    tags: ['audit', 'logging', 'compliance', 'security', 'system'],
  },
  {
    name: 'Help Menu',
    category: 'system',
    component: React.lazy(() => import('@designs/system/help-menu.jsx')),
    description: 'In-app help menu and documentation links',
    specPath: 'designs/system/help-menu.md',
    githubIssue: 44,
    tags: ['help', 'documentation', 'UI', 'navigation'],
  },
  {
    name: 'Analyzer Import',
    category: 'system',
    component: React.lazy(() => import('@designs/system/analyzer-import.jsx')),
    description: 'Bulk analyzer configuration import',
    specPath: 'designs/system/analyzer-import.md',
    githubIssue: 45,
    tags: ['analyzer', 'import', 'data-migration', 'system'],
  },
  {
    name: 'FHIR Outbound Push',
    category: 'system',
    component: React.lazy(() => import('@designs/system/fhir-outbound-push.jsx')),
    description: 'Event-driven FHIR R4 outbound push to a central national hub — DiagnosticReport bundle assembly on final validation, retry queue, delivery log, and admin configuration for endpoint, auth (API key, OAuth 2.0, Basic, Private Key JWT), and per-resource toggles',
    specPath: 'designs/system/fhir-outbound-push.md',
    added: '2026-03-24',
    status: 'draft',
    githubIssue: 62,
    jira: ['OGC-446'],
    relatedTo: ['FHIR Publication Settings'],
    tags: ['FHIR', 'interoperability', 'outbound', 'hub', 'integration'],
  },
  {
    name: 'FHIR Publication Settings',
    category: 'system',
    component: React.lazy(() => import('@designs/system/fhir-publication-settings.jsx')),
    description: 'Admin configuration page for FHIR R4 outbound publication — endpoint URL, per-resource toggles (DiagnosticReport, Observation, ServiceRequest, Device, Organization), authentication modes (API key, OAuth 2.0, Basic auth, Private Key JWT with public key upload), DHIS2 push URL, and live connection test. Companion admin UI for the FHIR Outbound Push pipeline (OGC-446).',
    added: '2026-04-27',
    status: 'draft',
    relatedTo: ['FHIR Outbound Push'],
    tags: ['FHIR', 'interoperability', 'outbound', 'admin', 'configuration', 'integration'],
  },
  {
    name: 'Storage Disposition FHIR',
    category: 'system',
    component: React.lazy(() => import('@designs/system/storage-disposition-fhir.jsx')),
    description: 'S-05b Addendum to S-05 (Compliance Evaluation Engine) — FHIR Specimen resource update triggered when ENV/Vector sample final disposition is recorded (Disposed or Biorepository). Animated FHIR push pipeline simulation: OpenELIS Storage → SPECIMEN_DISPOSITION_FINAL event → Async Queue → HAPI FHIR R4 → OHS ETL → Future Dashboard. Interactive Specimen JSON payload explorer with collapsible sections, disposition-type toggle, and specimen-final-disposition extension annotations. Best-effort non-blocking push with 3× retry, delivery logging, and sampleDomain gating for ENV/Vector orders only.',
    specPath: 'designs/system/storage-disposition-fhir.md',
    added: '2026-04-21',
    status: 'draft',
    githubIssue: 88,
    jira: ['OGC-547', 'OGC-527'],
    tags: ['FHIR', 'storage', 'disposition', 'biorepository', 'environmental', 'vector', 'Indonesia', 'SILNAS', 'HAPI', 'OHS', 'Bogor'],
  },
  {
    name: 'Lab Management Dashboard',
    category: 'system',
    component: React.lazy(() => import('@designs/system/lab-management-dashboard.jsx')),
    description: 'Cross-cutting lab management dashboard — real-time TAT monitoring, pending workload by section, analyzer status, reagent stock alerts, QC flags, and daily throughput metrics for lab managers',
    specPath: 'designs/system/lab-management-dashboard.md',
    htmlUrl: 'designs/system/lab-management-dashboard.html',
    added: '2026-03-24',
    status: 'draft',
    githubIssue: 64,
    jira: ['OGC-485'],
    tags: ['dashboard', 'KPI', 'TAT', 'management', 'real-time'],
  },
  {
    name: 'Electronic Signature',
    category: 'system',
    component: React.lazy(() => import('@designs/system/electronic-signature.jsx')),
    description: 'Electronic signature capture and audit trail for 21 CFR Part 11 compliance — authenticated sign-off for results validation, report release, and critical value acknowledgment',
    specPath: 'designs/system/electronic-signature.md',
    added: '2026-04-02',
    status: 'draft',
    githubIssue: 73,
    jira: ['OGC-532'],
    tags: ['security', 'e-signature', '21CFR11', 'compliance', 'audit'],
  },

  // ─── Sample Collection ───
  {
    name: 'Sample Collection Redesign',
    category: 'vector-surveillance',
    component: null,
    description: 'Decoupled 4-step sample lifecycle: Enter Order → Collect Sample → Label & Store → QA Review',
    specPath: 'designs/sample-collection/sample-collection-redesign.md',
    htmlUrl: 'designs/sample-collection/sample-collection-redesign-mockup.html',
    jira: ['OGC-70', 'OGC-354'],
    added: '2026-03-04',
    githubIssue: 46,
    tags: ['sample-collection', 'order-entry', 'workflow', 'labels', 'environmental', 'vector'],
  },
  {
    name: 'Sampling Site Registry',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/sample-collection/sampling-site-registry.jsx')),
    description: 'Environmental LIMS sampling site registry — manage sampling locations, GPS coordinates, site types, and compliance linkage to S-01 standards with hierarchical site grouping (S-02)',
    specPath: 'designs/sample-collection/sampling-site-registry.md',
    htmlUrl: 'designs/sample-collection/sampling-site-registry.html',
    added: '2026-04-02',
    status: 'draft',
    githubIssue: 71,
    jira: ['OGC-531'],
    tags: ['sample-collection', 'environmental', 'GPS', 'vector', 'sites'],
  },

  {
    name: 'Environmental Order Entry',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/sample-collection/environmental-order-entry.jsx')),
    description: 'S-03 v2.0 — 3-step wizard (Branch & Setup / Label & Store / QA-QC + Intake) at Reception for domain-assigned labs. Regulation-driven vs ad-hoc branch selector, sample manifest quantity table + CSV upload, per-sample NCE button, QC quick-add (Blank/Duplicate/Control), FHIR referral tag. v2.0 rewrite removes Step 4 receipt verification, simplifies regulatory reference to ad-hoc only.',
    specPath: 'designs/sample-collection/environmental-order-entry.md',
    htmlUrl: 'designs/sample-collection/environmental-order-entry.html',
    added: '2026-04-03',
    status: 'draft',
    githubIssue: 74,
    jira: ['OGC-537', 'OGC-527'],
    tags: ['environmental', 'order-entry', 'vector', 'compliance', 'sample-collection'],
  },
  {
    name: 'ENV Order — Sampling Uncertainty Field',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/sample-collection/sampling-uncertainty.jsx')),
    description: 'S-03b Addendum — Sampling Uncertainty field added to the Collection Conditions section (S-03 §5.3). ISO 17025 §7.6 field/sampling uncertainty: NumberInput value + unit type Select (%, mg/L, μg/L, CFU/100mL, Other). Mandatory by default, configurable optional per program. Carries forward to Step 2 via ENV-3-002. QA completeness check extended. Laporan Hasil reporting payload extended.',
    specPath: 'designs/sample-collection/sampling-uncertainty.md',
    added: '2026-04-20',
    status: 'draft',
    githubIssue: 85,
    jira: ['OGC-537', 'OGC-527'],
    tags: ['environmental', 'order-entry', 'vector', 'compliance', 'sample-collection', 'ISO-17025', 'uncertainty', 'Indonesia', 'SILNAS'],
  },
  {
    name: 'Referral-Out Notification',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/notifications/referral-out-notification.jsx')),
    description: 'X-01 Addendum — Configurable REFERRAL_OUT notification trigger added to existing Refer Out module. Extends OGC-437/OGC-439 dispatch pipeline with one new event type, Combined Triggers Page row (default OFF), Combined Templates Page editor with merge fields, and Sent Messages tab "Referral Out" type. Three scenes: triggers config, template editor with live preview, sent messages table.',
    specPath: 'designs/notifications/referral-out-notification.md',
    added: '2026-04-20',
    status: 'draft',
    githubIssue: 86,
    jira: ['OGC-527'],
    tags: ['notifications', 'referral', 'email', 'whatsapp', 'vector', 'environmental', 'admin-config', 'OGC-437', 'OGC-439'],
  },
  {
    name: 'Subcontract Management',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/notifications/subcontract-management.jsx')),
    description: 'S-03c Addendum to S-03 + V-02 — Structured subcontract tracking for ENV/Vector Refer Out referrals. Subcontract Metadata panel (handoff datetime, expected return, agreement ref, chain-of-custody contact). Five-state status workflow (DISPATCHED → RECEIVED → RESULTS_RETURNED → CLOSED). Subcontract Register page with overdue highlighting, status filters, and Advance Status modal. Audit log per transition. ISO 17025 §6.6 / §7.7 compliance. Superseded by S-14 Inter-Lab Transfer (generic to all order types).',
    specPath: 'designs/notifications/subcontract-management.md',
    added: '2026-04-20',
    status: 'draft',
    githubIssue: 87,
    jira: ['OGC-590', 'OGC-537', 'OGC-581', 'OGC-527'],
    relatedTo: ['Inter-Lab Transfer'],
    tags: ['referral', 'subcontract', 'environmental', 'vector', 'ISO-17025', 'chain-of-custody', 'Indonesia', 'SILNAS', 'Bogor'],
  },
  {
    name: 'SOP Deadline Calculation',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/sop-deadline-calculation.jsx')),
    description: 'S-03d v2.0 Addendum to S-03 (ENV/Vector only) — SOP holding-time auto-calculation and worklist deadline flagging. v2.0 splits the generic Required-By field to the GENERIC-OE spec; this spec covers only ENV/Vector holding-time: minimum sop_max_holding_hours across tests, live suggestion with most-restrictive-test annotation, manual override. Worklist Deadline column: green/amber/red tags, Approaching/Overdue filter chips.',
    specPath: 'designs/sample-collection/sop-deadline-calculation.md',
    htmlUrl: 'designs/sample-collection/sop-deadline-calculation.html',
    added: '2026-04-21',
    status: 'draft',
    githubIssue: 89,
    jira: ['OGC-593', 'OGC-537', 'OGC-527'],
    relatedTo: ['Required By Field', 'Environmental Order Entry'],
    tags: ['order-entry', 'SOP', 'deadline', 'holding-time', 'environmental', 'vector', 'worklist', 'Indonesia', 'SILNAS', 'Bogor', 'ISO-17025'],
  },
  {
    name: 'Informed Consent Capture',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/informed-consent.jsx')),
    description: 'Informed consent capture section for sample order entry (OGC-557) — collapsible accordion with consent checkbox and optional form reference number, auditable agent/timestamp record for ISO 15189 compliance. Reusable ConsentAccordionSection component for Add Order and Edit Order workflows.',
    specPath: 'designs/sample-collection/informed-consent.md',
    htmlUrl: 'designs/sample-collection/informed-consent.html',
    added: '2026-04-14',
    status: 'draft',
    jira: ['OGC-557'],
    tags: ['sample-collection', 'order-entry', 'consent', 'compliance', 'ISO-15189', 'Madagascar'],
  },
  {
    name: 'Required By Field',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/required-by-field.jsx')),
    description: 'GENERIC cross-cutting OE feature — Required-By date+time field on Order Entry Step 1 for all order types (clinical, env, vector, EQA). Unifies eqa_deadline into order.required_by. Reuses EQA DatePicker pattern. Split from S-03d v1.0; this generic piece belongs in the core OE backlog, not the Env/Vector epic.',
    specPath: 'designs/sample-collection/required-by-field.md',
    htmlUrl: 'designs/sample-collection/required-by-field.html',
    added: '2026-04-27',
    status: 'draft',
    relatedTo: ['SOP Deadline Calculation'],
    tags: ['sample-collection', 'order-entry', 'clinical', 'environmental', 'vector', 'EQA', 'deadline'],
  },
  {
    name: 'Inter-Lab Transfer',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/inter-lab-transfer.jsx')),
    description: 'S-14 — Inter-lab transfer and subcontract, addendum to the existing OE Refer Out / Referral module. Supersedes S-03c (env/vector subcontract). Merges general inter-lab transfer and env/vector subcontract into one addendum covering all order types: transfer metadata, chain-of-custody tracking, five-state status workflow, overdue highlighting.',
    specPath: 'designs/sample-collection/inter-lab-transfer.md',
    htmlUrl: 'designs/sample-collection/inter-lab-transfer.html',
    added: '2026-04-27',
    status: 'draft',
    relatedTo: ['Subcontract Management'],
    jira: ['OGC-527'],
    tags: ['referral', 'inter-lab', 'subcontract', 'environmental', 'vector', 'clinical', 'chain-of-custody', 'ISO-17025'],
  },

  {
    name: 'Pre-Analytical Eligibility Gate',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/pre-analytical-eligibility-gate.jsx')),
    description: 'S-09 v2.0 — Pre-analytical eligibility gate and resampling, rebased on S-03 v2.0 (Step 3 QA/QC). Criteria checklist with accept/reject/resample per sample, Resample sample_action on NCE inline form, Eligibility Worklist sidebar entry, per-SampleType acceptance criteria config, per-lab-unit gate behavior. v2.0 rebases on the 3-step S-03 wizard.',
    specPath: 'designs/sample-collection/pre-analytical-eligibility-gate.md',
    htmlUrl: 'designs/sample-collection/pre-analytical-eligibility-gate.html',
    added: '2026-04-16',
    status: 'draft',
    jira: ['OGC-527', 'OGC-580'],
    tags: ['sample-collection', 'environmental', 'vector', 'clinical', 'eligibility', 'nce', 'iso-15189', 'iso-17025', 'SILNAS'],
  },
  {
    name: 'Sample Collection Redesign v2.1 — Referral Addendum',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/sample-collection-referral-addendum.jsx')),
    description: 'v2.1 Addendum to Sample Collection Redesign — restores Refer Out workflow into Step 3 (Label & Store). Inline per-test referral assignment, bulk "Refer all" modal, REFERRED_OUT order status, QA bypass for fully-referred orders, partial referral handling, and Order Dashboard filters. Reuses existing Refer Out module mechanics and X-01 notification trigger.',
    specPath: 'designs/sample-collection/sample-collection-referral-addendum.md',
    htmlUrl: 'designs/sample-collection/sample-collection-referral-addendum.html',
    added: '2026-04-23',
    status: 'draft',
    githubIssue: 92,
    jira: ['OGC-354', 'OGC-527'],
    relatedTo: ['Sample Collection Redesign', 'Referral-Out Notification'],
    tags: ['sample-collection', 'referral', 'refer-out', 'order-status', 'clinical', 'environmental', 'vector'],
  },

  // ─── Other ───
  {
    name: 'TAT Dashboard',
    category: 'other',
    component: React.lazy(() => import('@designs/other/tat-dashboard.jsx')),
    description: 'Turnaround time monitoring dashboard',
    specPath: 'designs/other/tat-dashboard.md',
    githubIssue: 47,
    jira: ['OGC-310'],
    tags: ['TAT', 'turnaround-time', 'dashboard', 'performance'],
  },
  {
    name: 'Calendar Management',
    category: 'other',
    component: React.lazy(() => import('@designs/other/calendar-management.jsx')),
    description: 'Lab calendar and scheduling management',
    specPath: null,
    githubIssue: 48,
    jira: ['OGC-306', 'OGC-310'],
    tags: ['calendar', 'scheduling', 'holidays', 'admin'],
  },

  // ─── Blood Bank ───
  {
    name: 'Pre-Transfusion Testing',
    category: 'blood-bank',
    component: React.lazy(() => import('@designs/blood-bank/pretransfusion-testing.jsx')),
    description: 'Pre-transfusion testing worklist dashboard & request case view — compatibility-filtered unit selection, crossmatch result tracking, and supervisor approval workflow (Blood Bank Spec 4)',
    specPath: 'designs/blood-bank/pretransfusion-testing.md',
    added: '2026-03-24',
    status: 'draft',
    githubIssue: 65,
    jira: ['OGC-464'],
    tags: ['blood-bank', 'transfusion', 'crossmatch', 'compatibility'],
  },
  {
    name: 'Patient Blood Bank Record',
    category: 'blood-bank',
    component: React.lazy(() => import('@designs/blood-bank/patient-blood-bank-record.jsx')),
    description: 'Longitudinal patient blood bank record — ABO/Rh typing history, antibody screen results, transfusion history, special requirements, and active transfusion requests (Blood Bank Spec 3)',
    specPath: 'designs/blood-bank/patient-blood-bank-record.md',
    added: '2026-03-25',
    status: 'draft',
    githubIssue: 66,
    jira: ['OGC-459'],
    tags: ['blood-bank', 'patient', 'transfusion-history', 'ABO-Rh'],
  },
  {
    name: 'Blood Bank Admin Config',
    category: 'blood-bank',
    component: React.lazy(() => import('@designs/blood-bank/blood-bank-admin-config.jsx')),
    description: 'Admin configuration for blood bank component types, volume rules, storage conditions, crossmatch requirements, and expiry rules (Blood Bank Spec 1)',
    specPath: 'designs/blood-bank/blood-bank-admin-config.md',
    added: '2026-03-25',
    status: 'draft',
    githubIssue: 67,
    jira: ['OGC-455'],
    tags: ['blood-bank', 'admin', 'configuration'],
  },
  {
    name: 'Blood Unit Inventory',
    category: 'blood-bank',
    component: React.lazy(() => import('@designs/blood-bank/blood-unit-inventory.jsx')),
    description: 'Blood unit reception & inventory workbench — receive units from donors/suppliers, assign donation IDs, track storage locations, and manage unit lifecycle from receipt to transfusion (Blood Bank Spec 2)',
    specPath: 'designs/blood-bank/blood-unit-inventory.md',
    added: '2026-03-25',
    status: 'draft',
    githubIssue: 68,
    jira: ['OGC-457'],
    tags: ['blood-bank', 'inventory', 'units', 'stock'],
  },
  {
    name: 'Issue to Patient',
    category: 'blood-bank',
    component: React.lazy(() => import('@designs/blood-bank/issue-to-patient.jsx')),
    description: 'Issue-to-patient & emergency release — issue queue for approved transfusion requests, 4-item pre-issue safety checklist, emergency crossmatch-bypass workflow with supervisor sign-off (Blood Bank Spec 5)',
    specPath: 'designs/blood-bank/issue-to-patient.md',
    htmlUrl: 'designs/blood-bank/issue-to-patient.html',
    added: '2026-03-25',
    status: 'draft',
    githubIssue: 69,
    jira: ['OGC-461'],
    tags: ['blood-bank', 'transfusion', 'issue', 'emergency-release'],
  },

  // ─── Reference / Planning ───
  {
    name: 'Environmental & Vector Testing Roadmap',
    category: 'vector-surveillance',
    component: null,
    description: 'Architecture roadmap for the Environmental & Vector Testing Module (OGC-527 epic). Covers 3-layer build order: S-01–S-02 foundational infrastructure, S-03–S-04 integration, S-05–S-08 analytics/reporting, V-01–V-04 vector surveillance. Dependency graph, recommended implementation phases, and current spec completion status.',
    specPath: 'designs/other/environmental-vector-roadmap.md',
    added: '2026-04-13',
    status: 'draft',
    githubIssue: 81,
    jira: ['OGC-527'],
    tags: ['environmental', 'vector', 'roadmap', 'planning', 'architecture', 'compliance'],
  },
  {
    name: 'Patient ID Card Scanning',
    category: 'patient',
    component: React.lazy(() => import('@designs/patient/patient-id-card-scanning.jsx')),
    description: 'Patient ID card scanning and document management. Adds an Identification Documents accordion to patient registration and edit screens, plus a document count column and inline preview panel in patient search results. Supports file upload, camera capture, and clipboard paste; stores documents as FHIR Patient attachments with full audit trail and role-based permissions.',
    specPath: 'designs/patient/patient-id-card-scanning.md',
    htmlUrl: 'designs/patient/patient-id-card-scanning.html',
    added: '2026-04-13',
    status: 'draft',
    githubIssue: 82,
    jira: ['OGC-66'],
    tags: ['patient', 'document-management', 'FHIR', 'scanning', 'registration'],
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
    tags: ['AI', 'assistant', 'natural-language', 'reporting', 'chatbot'],
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
  'blood-bank',
  'inventory',
  'microbiology',
  'nce',
  'notifications',
  'pathology',
  'quality',
  'results-validation',
  'reports',
  'patient',
  'sample-collection',
  'vector-surveillance',
  'system',
  'other',
];

export const categoryLabels = {
  'all': 'All',
  'admin-config': 'Admin & Config',
  'analyzer-integration': 'Analyzer Integration',
  'blood-bank': 'Blood Bank',
  'inventory': 'Inventory & Supply',
  'microbiology': 'Microbiology',
  'nce': 'NCE',
  'notifications': 'Notifications',
  'pathology': 'Pathology',
  'quality': 'Quality & EQA',
  'results-validation': 'Results & Validation',
  'reports': 'Reports',
  'patient': 'Patient',
  'sample-collection': 'Sample Collection',
  'vector-surveillance': 'Vector Surveillance',
  'system': 'System',
  'other': 'Other',
};

/** Determine entry type for visual distinction */
export function getEntryType(mockup) {
  if (mockup.htmlUrl) return 'html';
  if (mockup.component) return 'jsx';
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

/**
 * Parse the hash into a route object.
 * Supports:
 *   #/{category}/{slug}           → { mode: 'gallery', mockup }
 *   #/preview/{category}/{slug}   → { mode: 'preview', mockup }
 *   #/spec/{category}/{slug}      → { mode: 'spec', mockup }
 */
export function parseRoute(hash) {
  const path = hash.replace(/^#\/?/, '');
  if (!path) return { mode: 'gallery', mockup: null };
  const parts = path.split('/');
  if (parts[0] === 'preview' && parts.length >= 3) {
    const cat = parts[1];
    const slug = parts.slice(2).join('/');
    const mockup = MOCKUP_REGISTRY.find(m => m.category === cat && toSlug(m.name) === slug) || null;
    return { mode: 'preview', mockup };
  }
  if (parts[0] === 'spec' && parts.length >= 3) {
    const cat = parts[1];
    const slug = parts.slice(2).join('/');
    const mockup = MOCKUP_REGISTRY.find(m => m.category === cat && toSlug(m.name) === slug) || null;
    return { mode: 'spec', mockup };
  }
  const mockup = findMockupByHash(hash);
  return { mode: 'gallery', mockup };
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

// ─── Standalone Preview (full-screen mockup, no gallery chrome) ───

function StandalonePreview({ mockup }) {
  const previewRef = React.useRef(null);
  const [capturing, setCapturing] = React.useState(false);

  async function handleScreenshot() {
    if (!previewRef.current) return;
    setCapturing(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `${toSlug(mockup.name)}-screenshot.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
      alert('Screenshot capture failed. Try using your browser\'s built-in screenshot tool.');
    }
    setCapturing(false);
  }

  const slug = toSlug(mockup.name);
  const galleryUrl = `#/${mockup.category}/${slug}`;
  const specUrl = mockup.specPath ? `#/spec/${mockup.category}/${slug}` : null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', background: '#161616', color: '#f4f4f4', fontSize: '0.875rem', flexShrink: 0 }}>
        <a href={galleryUrl} style={{ color: '#78a9ff', textDecoration: 'none' }}>← Gallery</a>
        <span style={{ fontWeight: 600 }}>{mockup.name}</span>
        <span style={{ color: '#6f6f6f' }}>{categoryLabels[mockup.category] || mockup.category}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          {specUrl && <a href={specUrl} style={{ color: '#78a9ff', textDecoration: 'none' }}>View Spec</a>}
          <button
            onClick={handleScreenshot}
            disabled={capturing}
            style={{ background: '#0f62fe', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            {capturing ? 'Capturing...' : '📷 Screenshot'}
          </button>
        </div>
      </div>
      <div ref={previewRef} style={{ flex: 1, overflow: 'auto' }}>
        {mockup.htmlUrl ? (
          <iframe
            src={import.meta.env.BASE_URL + mockup.htmlUrl}
            style={{ width: '100%', height: 'calc(100vh - 42px)', border: 'none' }}
            title={mockup.name}
          />
        ) : mockup.component ? (
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading mockup...</div>}>
            <ErrorBoundary name={mockup.name}>
              <mockup.component />
            </ErrorBoundary>
          </Suspense>
        ) : mockup.figmaUrl ? (
          <iframe
            src={mockup.figmaUrl.replace('/make/', '/embed/') + '&embed-host=share'}
            style={{ width: '100%', height: 'calc(100vh - 42px)', border: 'none' }}
            title={mockup.name}
          />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#525252' }}>No preview available for this entry.</div>
        )}
      </div>
    </div>
  );
}

// ─── Standalone Spec (full-page rendered markdown, no gallery chrome) ───

function StandaloneSpec({ mockup }) {
  const [content, setContent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!mockup.specPath) return;
    fetch(import.meta.env.BASE_URL + mockup.specPath)
      .then(r => r.ok ? r.text() : Promise.reject(`HTTP ${r.status}`))
      .then(text => { setContent(text); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mockup.specPath]);

  const slug = toSlug(mockup.name);
  const galleryUrl = `#/${mockup.category}/${slug}`;
  const previewUrl = `#/preview/${mockup.category}/${slug}`;
  const rawUrl = import.meta.env.BASE_URL + mockup.specPath;
  const githubUrl = GITHUB_BASE + mockup.specPath;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', background: '#161616', color: '#f4f4f4', fontSize: '0.875rem', flexShrink: 0 }}>
        <a href={galleryUrl} style={{ color: '#78a9ff', textDecoration: 'none' }}>← Gallery</a>
        <span style={{ fontWeight: 600 }}>{mockup.name} — Spec</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <a href={previewUrl} style={{ color: '#78a9ff', textDecoration: 'none' }}>Preview</a>
          <a href={rawUrl} download style={{ color: '#78a9ff', textDecoration: 'none' }}>Download MD</a>
          <a href={githubUrl} target="_blank" rel="noopener" style={{ color: '#78a9ff', textDecoration: 'none' }}>GitHub</a>
        </div>
      </div>
      <div style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#525252', padding: '2rem' }}>Loading spec...</div>
        ) : content ? (
          <div className="spec-content" style={styles.specContent} dangerouslySetInnerHTML={{ __html: marked(content) }} />
        ) : (
          <div style={{ textAlign: 'center', color: '#525252', padding: '2rem' }}>
            <p>Could not load spec.</p>
            <a href={githubUrl} target="_blank" rel="noopener" style={{ color: '#0f62fe' }}>View on GitHub →</a>
          </div>
        )}
      </div>
    </div>
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
  // ─── Standalone route detection ───
  const [routeMode, setRouteMode] = useState(() => parseRoute(window.location.hash).mode);
  const [routeMockup, setRouteMockup] = useState(() => parseRoute(window.location.hash).mockup);

  useEffect(() => {
    function onHashChange() {
      const route = parseRoute(window.location.hash);
      setRouteMode(route.mode);
      setRouteMockup(route.mockup);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Render standalone modes immediately, bypassing the full gallery UI
  if (routeMode === 'preview' && routeMockup) {
    return <StandalonePreview mockup={routeMockup} />;
  }
  if (routeMode === 'spec' && routeMockup) {
    return <StandaloneSpec mockup={routeMockup} />;
  }

  // ─── Gallery mode (original) ───
  return <GalleryApp />;
}

function GalleryApp() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMockup, setSelectedMockup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
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
    const matchesTag = !activeTag || (m.tags && m.tags.includes(activeTag));
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      (m.jira && m.jira.some((key) => key.toLowerCase().includes(q))) ||
      (m.tags && m.tags.some((tag) => tag.toLowerCase().includes(q)));
    return matchesCategory && matchesStatus && matchesTag && matchesSearch;
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
        <div style={{ display: 'flex', flex: '1 1 200px', minWidth: 200, alignItems: 'center', gap: 6 }}>
          <input
            type="text"
            placeholder="Search by name, tag, Jira key…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setActiveTag(null); }}
            style={{ ...styles.search, flex: 1, minWidth: 0 }}
          />
          {activeTag && (
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: darkMode ? '#0043ce33' : '#d0e2ff', color: darkMode ? '#78a9ff' : '#0043ce', border: '1px solid ' + (darkMode ? '#0043ce88' : '#78a9ff'), whiteSpace: 'nowrap' }}
            >
              #{activeTag}
              <button onClick={() => setActiveTag(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'inherit', fontSize: 14, marginLeft: 2 }} title="Clear tag filter">×</button>
            </span>
          )}
        </div>
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
                  ) : selectedMockup.htmlUrl ? (
                    <div style={styles.figmaEmbed}>
                      <iframe
                        src={import.meta.env.BASE_URL + selectedMockup.htmlUrl}
                        style={{ ...styles.figmaIframe, height: 800, borderColor: t.border }}
                        allowFullScreen
                        title={selectedMockup.name}
                      />
                    </div>
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
                {mockup.tags && mockup.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {mockup.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={(e) => { e.stopPropagation(); setActiveTag(activeTag === tag ? null : tag); setSearchQuery(''); }}
                        title={`Filter by #${tag}`}
                        style={{
                          padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          background: activeTag === tag ? (darkMode ? '#0043ce55' : '#d0e2ff') : (darkMode ? '#3d3d3d' : '#f4f4f4'),
                          color: activeTag === tag ? (darkMode ? '#78a9ff' : '#0043ce') : (darkMode ? '#c6c6c6' : '#525252'),
                          border: activeTag === tag ? '1px solid ' + (darkMode ? '#78a9ff' : '#0043ce') : '1px solid ' + (darkMode ? '#525252' : '#e0e0e0'),
                          transition: 'all 0.15s',
                        }}
                      >
                        #{tag}
                      </button>
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
