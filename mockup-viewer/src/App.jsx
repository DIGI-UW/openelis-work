import React, { useState, useEffect, Suspense } from 'react';
import { marked } from 'marked';
import './spec-styles.css';
import carbonCssUrl from '@carbon/styles/css/styles.min.css?url';

// ─── Carbon preview styles (lazy) ───
// Carbon JSX mockups emit cds--* classes, but the viewer doesn't bundle Carbon's
// global stylesheet (it carries resets/body styles that would leak into the gallery
// chrome and the self-styled Tailwind-era mockups). Instead, the prebuilt CSS is
// injected only while a Carbon mockup is actually mounted, and removed on unmount.
let carbonStyleRefs = 0;
let carbonStyleLink = null;
function acquireCarbonStyles() {
  carbonStyleRefs += 1;
  if (!carbonStyleLink) {
    carbonStyleLink = document.createElement('link');
    carbonStyleLink.rel = 'stylesheet';
    carbonStyleLink.href = carbonCssUrl;
    carbonStyleLink.dataset.carbonPreview = 'true';
    document.head.appendChild(carbonStyleLink);
  }
}
function releaseCarbonStyles() {
  carbonStyleRefs = Math.max(0, carbonStyleRefs - 1);
  if (carbonStyleRefs === 0 && carbonStyleLink) {
    carbonStyleLink.remove();
    carbonStyleLink = null;
  }
}

/**
 * Renders a JSX mockup, auto-detecting Carbon usage (cds--* classes) and
 * lazy-loading Carbon's stylesheet for the lifetime of the preview.
 */
export function JsxMockupPreview({ mockup, fallback }) {
  const containerRef = React.useRef(null);
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof MutationObserver === 'undefined') return undefined;
    let acquired = false;
    const observer = new MutationObserver(() => check());
    const check = () => {
      if (!acquired && el.querySelector('[class*="cds--"]')) {
        acquired = true;
        acquireCarbonStyles();
        observer.disconnect();
      }
    };
    observer.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    check();
    return () => {
      observer.disconnect();
      if (acquired) releaseCarbonStyles();
    };
  }, [mockup]);
  return (
    <div ref={containerRef}>
      <Suspense fallback={fallback}>
        <ErrorBoundary name={mockup.name}>
          <mockup.component />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

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
    name: 'Test Catalog — Specimen Many-to-Many',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-catalog-specimen-mn.jsx')),
    description: 'One test associates many sample types (shared config, Phase 1) with per-specimen override for ranges/LOINC (Phase 2). Sample type single→multi on Basic Info; specimen-aware resolution replaces first-match (.get(0)); flat list shows one row per test with its specimens; multi-association is normal (not an error). Supersedes D-028 (specimen-is-identity) and retires the variant grouping + "Add specimen variant" copy subsystem. Hero case: environmental physical-chemistry across water types (Color/Turbidity span ~10 sample types on indonesiademo).',
    specPath: 'designs/admin-config/test-catalog-specimen-mn.md',
    htmlUrl: 'designs/admin-config/test-catalog-specimen-mn-preview.html',
    added: '2026-07-20',
    updated: '2026-07-20',
    status: 'draft',
    jira: ['OGC-1145'],
    githubIssue: 234,
    tags: ['test-catalog', 'specimen', 'many-to-many', 'sample-type', 'loinc', 'admin', 'configuration'],
  },
  {
    name: 'Test Catalog Editor — Completion & Correction',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-catalog-editor-completion.jsx')),
    description: 'Completes the unified Test Catalog editor: create a test in place, edit shared settings across same-analyte/different-specimen tests together, result-type-first Sample & Results with live preview, LOINC integrity warnings (missing + duplicate-active), Ranges bug fixes, and language fallback for names/labels.',
    specPath: 'designs/admin-config/test-catalog-editor-completion.md',
    htmlUrl: 'designs/admin-config/test-catalog-editor-completion.html',
    added: '2026-07-01',
    status: 'draft',
    jira: ['OGC-1112'],
    tags: ['test-catalog', 'loinc', 'ranges', 'result-types', 'i18n', 'admin', 'configuration'],
  },
  {
    name: 'Test Catalog Completion v2',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-catalog-completion-v2.jsx')),
    description: 'Consolidated Test Catalog FRS (v2) — the single implementing-agent handoff. Part A corrects delivered gaps in the shipped unified editor (custom label presets filtered out of the picker, terminology mappings missing display names, LOINC integrity warnings siloed in one section, half the combined shared-settings editor shipped, activation allowed on tests that cannot capture a result). Part B adds Manageability: grouped catalog view treating specimen variants of an assay as one family (link/unlink, issues toggle), create-in-place, add-specimen-variant with completeness rail + activation gate. FR-46–86. Supersedes the test-catalog-editor-completion and test-catalog-manageability work lists.',
    specPath: 'designs/admin-config/test-catalog-completion-v2.md',
    htmlUrl: 'designs/admin-config/test-catalog-panels-sampletypes.html',
    added: '2026-07-15',
    updated: '2026-07-15',
    status: 'draft',
    jira: ['OGC-1142'],
    tags: ['test-catalog', 'manageability', 'specimen-variant', 'loinc', 'activation-gate', 'admin', 'configuration'],
  },
  {
    name: 'Report Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/report-management.jsx')),
    description: 'Admin registry to choose, version, and override the report templates OpenELIS uses to render reports — see the active template per report, whether it is the shipped default or a custom override, pick a bundled variant, upload a custom template, preview, and revert to the shipped default (OGC-1111, Epic).',
    specPath: 'designs/admin-config/report-management.md',
    htmlUrl: 'designs/admin-config/report-management.html',
    added: '2026-07-01',
    status: 'draft',
    jira: ['OGC-1111'],
    tags: ['reports', 'templates', 'jasper', 'jrxml', 'admin', 'configuration'],
  },
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
    name: 'Lab Units Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/lab-units.jsx')),
    description: 'Lab Units Management (OGC-189) — v2.0, rebased on the real TEST_SECTION data model and aligned to the Test Catalog Management shell as a peer of Tests / Panels / Sample Types. Terminology is "Lab Unit" (never "test section"); no code field (no column exists); Description is required (NOT NULL). Domain is a declared dependency — unbuilt on develop despite OGC-361 (no test_section migration exists), so the single Clinical/Environmental/Vector domain requires a migration (backfill existing rows to Clinical, OGC-936 pattern).',
    specPath: 'designs/admin-config/lab-units.md',
    added: '2026-03-03',
    updated: '2026-07-15',
    status: 'draft',
    githubIssue: 2,
    jira: ['OGC-189'],
    tags: ['lab-units', 'test-section', 'test-catalog', 'domain', 'admin', 'configuration', 'OGC-189'],
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
    name: 'Require Requesting Provider (Order Entry)',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/order-entry-require-provider.jsx')),
    description: 'Optional Order Entry Configuration property (requireProviderEntry) that makes the requesting provider optional and the referring facility (Site Name) required instead; default keeps provider required. Includes a mandatory downstream null-safety data audit (9 consumers).',
    specPath: 'designs/admin-config/order-entry-require-provider.md',
    htmlUrl: 'designs/admin-config/order-entry-require-provider.html',
    added: '2026-07-17',
    status: 'draft',
    githubIssue: 229,
    jira: ['OGC-1143'],
    tags: ['order-entry', 'requester', 'provider', 'facility', 'admin', 'configuration', 'Madagascar'],
  },
  {
    name: 'Barcode Configuration',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/barcode-config.jsx')),
    description: 'Barcode label v1 — freezer labels and order entry label configuration, field mapping, and system label type setup (OGC-284 gap analysis + v1.1 cohesive rewrite)',
    specPath: 'designs/admin-config/barcode-config.md',
    htmlUrl: 'designs/admin-config/barcode-config.html',
    added: '2026-04-13',
    status: 'draft',
    jira: ['OGC-284'],
    tags: ['barcode', 'labels', 'printing', 'admin', 'configuration', 'sample-collection'],
  },
  {
    name: 'Barcode Labels v2',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/barcode-labels.jsx')),
    description: 'Admin-configurable label preset system — lab admins define custom label types with dimensions, barcode style, and content fields; Test Catalog declares label requirements; Order Entry aggregates into a deterministic label workload',
    specPath: 'designs/admin-config/barcode-labels.md',
    htmlUrl: 'designs/admin-config/barcode-labels.html',
    added: '2026-05-18',
    status: 'draft',
    jira: ['OGC-285'],
    tags: ['barcode', 'labels', 'presets', 'admin', 'configuration', 'test-catalog', 'order-entry'],
  },
  {
    name: 'Panel Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/panel.jsx')),
    description: 'Panel Management — Domain Upgrade (OGC-224) — v2.2, aligned to the verified Test Catalog data model and Manageability decisions. Managed as a Panels context in the Test Catalog Management shell (peer of Tests / Sample Types / Lab Units). Adds a single required domain (unbuilt on develop — Dependency 1, Clinical at launch, backfill existing panels to Clinical). A panel has no code (LOINC is its identifier), no lab unit (panels span sections; scoped by domain instead), and its sample types are DERIVED from member tests (SAMPLETYPE_PANEL stays backend-synced, never surfaced).',
    specPath: 'designs/admin-config/panel.md',
    htmlUrl: 'designs/admin-config/test-catalog-panels-sampletypes.html',
    added: '2026-03-03',
    updated: '2026-07-15',
    status: 'draft',
    githubIssue: 5,
    jira: ['OGC-224'],
    tags: ['panels', 'test-catalog', 'domain', 'test-groups', 'admin', 'configuration', 'OGC-224'],
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
    description: 'Admin surface where lab managers define all tests offered — 14-section routed editor covering identity, result types, ranges, sample storage, panels, analyzers, alerts, AMR mapping, regulatory compliance thresholds, LOINC/SNOMED/CIEL/OCL terminology, and order entry configuration. Replaces five separate admin pages (Test, Section, Panel, Method, Reagent). v2.4: Result Components + multi-reading — each test has N labeled subresult fields (e.g., noise = heading° + dB); per-component result type, unit (FK to master table via ComboBox + inline Add), ranges, and FHIR one-Observation-per-component mapping.',
    specPath: 'designs/admin-config/test-catalog.md',
    htmlUrl: 'designs/admin-config/test-catalog.html',
    added: '2026-04-27',
    status: 'draft',
    githubIssue: 8,
    jira: ['OGC-173'],
    tags: ['test-catalog', 'tests', 'admin', 'configuration', 'environmental', 'vector', 'LOINC', 'SNOMED'],
  },
  {
    name: 'Test Catalog FRS v2.4',
    category: 'admin-config',
    component: null,
    description: 'Test Catalog Management source-of-truth FRS (~3275 lines) — 14-section editor covering identity, result types, ranges, sample storage, display order, panels, terminology mappings, analyzers, alerts, AMR mapping, compliance, reagents, labels, reflex/calc, and localization hardening. Covers v1 (16 epics) and v2 (8 epics) delivery waves.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-requirements-v2.4.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-747','OGC-927','OGC-928','OGC-929','OGC-748','OGC-749','OGC-930','OGC-750','OGC-751','OGC-931','OGC-758','OGC-752','OGC-756','OGC-753','OGC-754','OGC-755','OGC-757','OGC-760','OGC-761','OGC-762','OGC-763','OGC-764','OGC-765','OGC-766','OGC-767'],
    tags: ['test-catalog', 'frs', 'spec', 'admin', 'v2.4'],
  },
  {
    name: 'Test Catalog FRS v2.5',
    category: 'admin-config',
    component: null,
    description: 'Test Catalog Management v2.5 staging companion — v1/v2 wave tags applied per section, 11 health-check fixes (D-01 through D-11) applied inline. Use alongside FRS v2.4 for implementation.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-requirements-v2.5.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-747','OGC-927','OGC-928','OGC-929','OGC-748','OGC-749','OGC-930','OGC-750','OGC-751','OGC-931','OGC-758','OGC-752','OGC-756','OGC-753','OGC-754','OGC-755','OGC-757','OGC-760','OGC-761','OGC-762','OGC-763','OGC-764','OGC-765','OGC-766','OGC-767'],
    tags: ['test-catalog', 'frs', 'spec', 'admin', 'v2.5', 'staging'],
  },
  {
    name: 'Test Catalog v2.5 — v1 Preview',
    category: 'admin-config',
    component: null,
    description: 'Standalone HTML preview of the v1 Test Catalog editor — 9 sections functional (Editor Scaffold, Test List, Basic Info, Sample & Results, Methods, Ranges, Sample Storage, Display Order, Panels, Terminology, Analyzers). Opens in any browser without a build step.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-requirements-v2.5.md',
    htmlUrl: 'designs/admin-config/test-catalog/test-catalog-preview-v2.5-v1.html',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-927','OGC-928','OGC-748','OGC-749','OGC-930','OGC-750','OGC-751','OGC-931','OGC-752','OGC-756','OGC-753','OGC-754','OGC-755'],
    tags: ['test-catalog', 'mockup', 'preview', 'html', 'admin', 'v1'],
  },
  {
    name: 'Test Catalog v2.5 — Design Critique',
    category: 'admin-config',
    component: null,
    description: 'Structured critique across IA, Carbon design system, accessibility, and clinical workflow — 18 punch-list items, all triaged and applied to the v2.5 FRS.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-v2.5-design-critique.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-927'],
    tags: ['test-catalog', 'design-critique', 'carbon', 'accessibility', 'admin'],
  },
  {
    name: 'Test Catalog v2.5 — Staging Review',
    category: 'admin-config',
    component: null,
    description: 'Earlier v1/v2 staging proposal documenting the split between delivery waves; historical context for the current epic structure.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-v2.5-staging-review.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-927'],
    tags: ['test-catalog', 'staging', 'planning', 'admin'],
  },
  {
    name: 'Test Catalog v2.5 — Epic Restructure Plan',
    category: 'admin-config',
    component: null,
    description: '1-mockup-per-epic restructure plan converting 2 umbrella epics (OGC-746, OGC-759) into 24 focused epics, each sized for a 2-week sprint.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-v2.5-epic-restructure.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-746','OGC-759','OGC-927'],
    tags: ['test-catalog', 'epic-restructure', 'planning', 'admin'],
  },
  {
    name: 'Test Catalog v2.5 — v1 Jira Story Breakdown',
    category: 'admin-config',
    component: null,
    description: 'Historical v1 story breakdown as originally filed under OGC-746 umbrella — 16 stories. Superseded by the per-epic restructure; preserved as reference.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-v2.5-v1-jira.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-747','OGC-927','OGC-928','OGC-929','OGC-748','OGC-749','OGC-930','OGC-750','OGC-751','OGC-931','OGC-758','OGC-752','OGC-756','OGC-753','OGC-754','OGC-755'],
    tags: ['test-catalog', 'jira', 'v1', 'story-breakdown', 'admin'],
  },
  {
    name: 'Test Catalog v2.5 — v2 Jira Story Breakdown',
    category: 'admin-config',
    component: null,
    description: 'Historical v2 story breakdown as originally filed under OGC-759 umbrella — 8 stories. Superseded by the per-epic restructure; preserved as reference.',
    specPath: 'designs/admin-config/test-catalog/test-catalog-v2.5-v2-jira.md',
    added: '2026-05-14',
    status: 'draft',
    jira: ['OGC-760','OGC-761','OGC-762','OGC-763','OGC-764','OGC-765','OGC-766','OGC-767'],
    tags: ['test-catalog', 'jira', 'v2', 'story-breakdown', 'admin'],
  },
  {
    name: 'Test Catalog — Microbiology Workflow Attribute',
    project: ['png'],
    category: 'admin-config',
    component: null,
    description: 'Test Catalog Basic Info: a nullable culture_workflow_type enum (None / Bacteriology / Mycobacteriology\u2013TB; Mycology reserved), orthogonal to Domain and the AMR flag; drives micro case routing (M-03/M-04). Foldable into Test Catalog v2.5 \u00a72.1 Basic Info.',
    specPath: 'designs/admin-config/test-catalog-microbiology-workflow-attribute.md',
    htmlUrl: 'designs/admin-config/test-catalog-microbiology-workflow-attribute.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-925'],
    tags: ['test-catalog', 'microbiology', 'png', 'workflow-type', 'basic-info', 'admin'],
  },
  {
    name: 'Admin Redesign — MVP Scope',
    category: 'admin-config',
    component: null,
    description: 'Umbrella scope/FRS for the OpenELIS admin redesign MVP — Admin Shell + consolidated pages (42→27 pages), and the per-feature configuration surfaces below.',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'redesign', 'mvp', 'scope'],
  },
  {
    name: 'Application Properties',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: consolidated Application/Common Properties editor (61 properties across 7 domains).',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/application-properties.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'application-properties', 'redesign'],
  },
  {
    name: 'Feature Flags',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: Feature Flags tab in Application Settings (hybrid auto-aggregate + curated dictionary).',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/feature-flags.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'feature-flags', 'redesign'],
  },
  {
    name: 'Menu Configuration',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: Menu Configuration across 5 scopes with per-node Side Nav Active + Show Child Elements toggles.',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/menu-configuration.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'menu-configuration', 'redesign'],
  },
  {
    name: 'Site Information',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: Site Information editor (29 properties; banner heading, patient-search, training installation).',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/site-information.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'site-information', 'redesign'],
  },
  {
    name: 'Validation Configuration',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: Validation Configuration with a live try-a-value charset preview (firstName/lastName/patientId/userName).',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/validation-rules.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'validation', 'redesign'],
  },
  {
    name: 'Test Notification',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: Test Notification config — 4 channels, 3-tier template fallback, substitution variables.',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/test-notification.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'notification', 'redesign'],
  },
  {
    name: 'Order & Patient Entry',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: merged Order Entry + Patient Entry configuration (22 properties; conditional fields grey out when parent toggle off).',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/order-patient-entry.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'order-entry', 'patient-entry', 'redesign'],
  },
  {
    name: 'WorkPlan Configuration',
    category: 'admin-config',
    component: null,
    description: 'Admin redesign: WorkPlan Configuration with live workplan preview showing columns conditionally (nextVisit/results/subject).',
    specPath: 'designs/admin-config/admin-mvp-scope.md',
    htmlUrl: 'designs/admin-config/workplan.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['admin', 'workplan', 'redesign'],
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
    name: 'Sample Type Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/sample-type-management.jsx')),
    description: 'Sample Type Management (OGC-296) — v2.1. Managed as a context in the Test Catalog Management shell (peer of Tests/Panels) with SideNav sections rather than a standalone 5-tab page. Sections: Basic Info (incl. required single Clinical/Environmental/Vector domain), Associated Tests (read-only — a test\'s specimen is its identity, so adding a test means creating a specimen variant in the Test Catalog), Display Order, Disposal (free-text reference), and Terminology (full mapper incl. WHONET for AMR surveillance exports). Grounded in the verified data model: domain needs a declared migration from the legacy TYPE_OF_SAMPLE.DOMAIN varchar(1); SAMPLETYPE_PANEL stays live in order entry.',
    specPath: 'designs/admin-config/sample-type-management.md',
    htmlUrl: 'designs/admin-config/test-catalog-panels-sampletypes.html',
    added: '2026-05-14',
    updated: '2026-07-14',
    status: 'draft',
    githubIssue: null,
    jira: ['OGC-296'],
    tags: ['sample-type', 'admin', 'test-catalog', 'domain', 'terminology', 'WHONET', 'AMR', 'OGC-296', 'global'],
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
    relatedTo: ['Test Catalog', 'Report Print Queue', 'Patient Report Redesign'],
    tags: ['admin', 'accreditation', 'test-catalog', 'reports', 'logo', 'iso-15189'],
  },
  {
    name: 'Reporting Ranges by Method',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/reporting-ranges-by-method.jsx')),
    description: 'Per-method reporting ranges for Test Catalog (FRS v2, full spec). Methods as first-class concepts: master Methods admin page (MANUAL/USER/PLUGIN sources, P-01 table pattern), per-method reporting range grid in test row-expand (Sub-2 + Sub-3), method-aware range lookup in result entry (Sub-4). CSV import extension. Covers full epic scope across all three sub-issues.',
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
  {
    name: 'Test Rules Authoring Redesign — MVP',
    category: 'admin-config',
    component: null,
    description: 'Unified replacement for the legacy Reflex Tests Management and Calculated Value Tests Management admin pages — one route at /admin/testRules. List view mixes Rules + Calculations + Algorithms + Multi-step calcs. Inline row expansion for simple rule authoring; dedicated full-width editors for Reflex (WHEN/THEN compose + formula bar), Numeric Calc (formula bar + live preview + flowchart), and Coded Calc (decision table, e.g. TB GenoType interpretation). Algorithm-as-graph canvas is Phase 2 reference. All five previews are cross-linked — open the list view and click through. FRS: 43 numbered FRs, full AST data model, 29 acceptance criteria, ~100 i18n keys.',
    specPath: 'designs/admin-config/test-rules-mvp-frs.md',
    htmlUrl: 'designs/admin-config/test-rules-list-view-preview.html',
    added: '2026-05-12',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['admin', 'test-rules', 'reflex', 'calculated-values', 'decision-table', 'formula-bar', 'analyzer-parameters', 'predicate-vocabulary', 'MVP', 'global'],
  },
  {
    name: 'Programs Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/programs-management.jsx')),
    description: 'Programs admin rework (v2, consolidated) — Domain (Clinical/Environmental/Vector) field matching Test Catalog & Lab Units; moves under Admin → Test Management; inline Edit/Add (no separate page); Deactivate/Reactivate lifecycle (no hard delete) with a Show-deactivated toggle; Carbon ContentSwitcher (Visual Builder ↔ JSON) with a live "Example" preview; multi Lab-unit select; heavy on-screen guidance; API & i18n reuse guardrails. Epic: OGC-781.',
    specPath: 'designs/admin-config/programs-management.md',
    htmlUrl: 'designs/admin-config/programs-management.html',
    added: '2026-05-27',
    updated: '2026-07-01',
    status: 'draft',
    jira: ['OGC-781'],
    tags: ['admin', 'programs', 'test-management', 'domain', 'fhir-questionnaire', 'visual-builder', 'json', 'live-preview', 'order-entry', 'global'],
  },
  {
    name: 'Additional Information Builder (contexts)',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/additional-info-builder.jsx')),
    description: 'One questionnaire builder, per-context via a SideNav submenu (Programs / per-domain Order form fields / Patient form fields); shipped fields hide-not-delete + collapse + JSON-exclusion. Part of OGC-781 (baked-in Additional Information).',
    specPath: 'designs/admin-config/programs-management.md',
    htmlUrl: 'designs/admin-config/additional-info-builder.html',
    added: '2026-07-17',
    status: 'draft',
    jira: ['OGC-781'],
    tags: ['programs','additional-information','fhir-questionnaire','builder','admin','madagascar'],
  },
  {
    name: 'Result & Validation Configuration v4',
    project: ['png'],
    category: 'admin-config',
    component: null,
    description: 'Consolidated admin page (v4) that retires the flat Result Entry Configuration table and the binary validate-all-results toggle. Replaces them with a plain-language grouped toggles panel (13 legacy settings re-labelled across 4 groups: Result Entry, Modification/Rejection/Retest, Release & Display, Access & PII), a multi-level validation policy panel (lab-wide default + per-lab-unit overrides with 0–5 levels, trigger modes, role selects), an effective-config preview, and a plain-terms policy sentence. Route: /admin/results-validation-configuration. Drives Results Entry v4 and Validation Page v4.',
    specPath: 'designs/admin-config/results-validation-config-v4.md',
    htmlUrl: 'designs/admin-config/results-validation-config-v4.html',
    added: '2026-06-10',
    status: 'draft',
    jira: ['OGC-1016', 'OGC-343'],
    tags: ['admin', 'results', 'validation', 'configuration', 'v4', 'multi-level', 'feature-flag', 'Indonesia', 'SILNAS', 'png-deliverable'],
  },

  // ─── Analyzer Integration ───
  {
    name: 'Analyzer Mapping - Multi-Component Column',
    category: 'analyzer-integration',
    component: null,
    description: 'Delta to the Analyzer Types & Mapping table: adds a Component selector so an instrument target/channel maps to a specific result_component of a test (not only a test), resolving test-then-component by a stable code. Extends the existing analyzer-mapping-templates.jsx rather than adding a new screen. See the Multi-component mapping section of the Analyzer Types & Mapping FRS. Epic OGC-1131 / story OGC-1136.',
    specPath: 'designs/analyzer-integration/analyzer-profile-mapping.md',
    htmlUrl: 'designs/analyzer-integration/analyzer-multicomponent-mapping-preview.html',
    added: '2026-07-14',
    status: 'draft',
    githubIssue: null,
    jira: ['OGC-1136', 'OGC-1131'],
    tags: ['analyzer', 'analyzer-integration', 'mapping', 'multi-component', 'result-component', 'molecular', 'ct', 'cq', 'pcr', 'multiplex', 'component-column'],
  },
  {
    name: 'Analyzer Types & Mapping',
    category: 'analyzer-integration',
    component: null,
    description: 'Completes the Generic ASTM/HL7/Flat-file module with reusable, forkable Analyzer Types and a lab-facing GUI to map an instrument\'s tests, result values, and QC codes to the catalog. Replaces the developer-facing "Analyzer Types" plugin-registry page; guided instrument-first setup whose normal path is verify. HTML prototype + version-agnostic FRS.',
    specPath: 'designs/analyzer-integration/analyzer-profile-mapping.md',
    htmlUrl: 'designs/analyzer-integration/analyzer-profile-mapping.html',
    added: '2026-06-18',
    status: 'draft',
    jira: ['OGC-1054'],
    relatedTo: ['Analyzer Types & Mapping — Gap Analysis'],
    tags: ['analyzer', 'mapping', 'profiles', 'analyzer-types', 'ASTM', 'HL7', 'flat-file', 'Madagascar'],
  },
  {
    name: 'Analyzer Types & Mapping — Gap Analysis',
    category: 'analyzer-integration',
    component: null,
    description: 'Functional gap analysis grounding the Analyzer Types & Mapping FRS: reviews ~20 shipped Madagascar profiles and the ASTM/HL7/flat-file addenda, surfacing the inconsistent value-handling that the feature normalizes.',
    specPath: 'designs/analyzer-integration/analyzer-profile-mapping-gap-analysis.md',
    added: '2026-06-18',
    status: 'draft',
    jira: ['OGC-1054'],
    relatedTo: ['Analyzer Types & Mapping'],
    tags: ['analyzer', 'mapping', 'gap-analysis', 'profiles', 'Madagascar'],
  },
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
    name: 'Bruker MALDI Biotyper Integration Spec',
    project: ['png'],
    category: 'analyzer-integration',
    component: null,
    description: 'Bruker MALDI Biotyper (MBT Compass IVD) microbial identification — ASTM LIS2-A2 socket or CSV flat file (PNG / CPHL Port Moresby).',
    specPath: 'designs/analyzer-integration/bruker-maldi-biotyper-integration-spec-v1.1.md',
    added: '2026-06-12',
    relatedTo: ['Bruker MALDI Biotyper Companion Guide'],
    jira: ['OGC-323'],
    tags: ['analyzer', 'Bruker', 'MALDI', 'microbiology', 'identification', 'ASTM', 'PNG'],
  },
  {
    name: 'Bruker MALDI Biotyper Companion Guide',
    project: ['png'],
    category: 'analyzer-integration',
    component: null,
    description: 'Bruker MALDI Biotyper (MBT Compass IVD) analyzer setup guide — instrument-side + OpenELIS configuration for organism-ID results.',
    specPath: 'designs/analyzer-integration/bruker-maldi-biotyper-companion-setup-guide-v1.0.md',
    added: '2026-06-12',
    relatedTo: ['Bruker MALDI Biotyper Integration Spec'],
    jira: ['OGC-323'],
    tags: ['analyzer', 'Bruker', 'MALDI', 'microbiology', 'setup-guide', 'PNG'],
  },
  {
    name: 'MinION TB-Profiler Field Mapping Spec',
    project: ['png'],
    category: 'analyzer-integration',
    component: null,
    description: 'MinION (Oxford Nanopore) + TB-Profiler WGS-based TB drug-susceptibility — field mapping & integration spec v2.2. Rides the existing flat-file analyzer plugin into the M-14 TB Case Workbench import channel (general JSON reader + sequencing-QC block + additive M-14 molecular-result fields); not a new pipeline module. Supersedes v1.0. PNG / CPHL.',
    specPath: 'designs/analyzer-integration/minion-tbprofiler-field-mapping-v2.2.md',
    added: '2026-06-22',
    status: 'draft',
    relatedTo: ['MinION TB-Profiler Setup Guide'],
    jira: ['OGC-318'],
    githubIssue: 182,
    tags: ['analyzer', 'MinION', 'Nanopore', 'TB-Profiler', 'tuberculosis', 'AMR', 'WGS', 'microbiology', 'field-mapping', 'PNG'],
  },
  {
    name: 'MinION TB-Profiler Setup Guide',
    project: ['png'],
    category: 'analyzer-integration',
    component: null,
    description: 'MinION + TB-Profiler analyzer setup guide — instrument/pipeline-side + OpenELIS flat-file-plugin configuration for importing TB WGS DST results into the M-14 case workbench.',
    specPath: 'designs/analyzer-integration/minion-tbprofiler-setup-guide-v1.0.md',
    added: '2026-06-22',
    status: 'draft',
    relatedTo: ['MinION TB-Profiler Field Mapping Spec'],
    jira: ['OGC-318'],
    githubIssue: 182,
    tags: ['analyzer', 'MinION', 'Nanopore', 'TB-Profiler', 'tuberculosis', 'setup-guide', 'PNG'],
  },
  {
    name: 'BD EpiCenter Integration Spec',
    project: ['png'],
    category: 'analyzer-integration',
    component: null,
    description: 'BD EpiCenter microbiology / AMR data manager — ASTM LIS2-A2 (E1394-97) aggregating Phoenix/MGIT susceptibility for OpenELIS (PNG / CPHL Port Moresby).',
    specPath: 'designs/analyzer-integration/bd-epicenter-integration-spec-v1.0.md',
    added: '2026-06-12',
    jira: ['OGC-434'],
    tags: ['analyzer', 'BD', 'EpiCenter', 'microbiology', 'AMR', 'AST', 'ASTM', 'PNG'],
  },
  {
    name: 'BioRad CFX Opus Connection Spec',
    category: 'analyzer-integration',
    component: null,
    description: 'BioRad CFX Opus Real-Time PCR — CSV/RDML/XLSX export, LIMS integration via CFX Maestro. v1.2: export file format validated against a real CFX Maestro 5.2 XLSX workbook (Indonesia).',
    specPath: 'designs/analyzer-integration/biorad-cfx-opus-analyzer-connection-spec.md',
    added: '2026-03-05',
    updated: '2026-06-18',
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
  // ─── Microbiology — M-* bundle (supersedes OGC-293 / amr-module) ───
  {
    name: 'M-00 Microbiology Module Parent',
    category: 'microbiology',
    component: null,
    description: 'Spine spec for the M-* bundle: glossary, RBAC matrix, data model overview, phase plan, out-of-scope, v1.1 → v2 diff map.',
    specPath: 'designs/microbiology/m-00-micro-module-parent.md',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-782'],
    tags: ['microbiology', 'parent-spec', 'mvp-1a'],
  },
  {
    name: 'M-NFR Non-Functional Requirements',
    category: 'microbiology',
    component: null,
    description: 'Ten cross-cutting NFRs for the Micro Module — offline, scale, audit, a11y (WCAG 2.1 AA), performance budget, retention, i18n, security, browser support, DB.',
    specPath: 'designs/microbiology/m-nfr-non-functional-requirements.md',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-783'],
    tags: ['microbiology', 'non-functional', 'cross-cutting', 'mvp-1a'],
  },
  {
    name: 'M-01 AMR Reference Data (Organism Master)',
    category: 'microbiology',
    component: null,
    description: 'Organism / Antibiotic / AST Panel / Culture Protocol masters with WHONET codes and groupings. Mockup shows Organism Master admin list.',
    specPath: 'designs/microbiology/m-01-amr-reference-data.md',
    htmlUrl: 'designs/microbiology/m-01-organism-master.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-786'],
    tags: ['microbiology', 'reference-data', 'WHONET', 'admin', 'mvp-1a'],
  },
  {
    name: 'M-02 Breakpoint Catalog',
    category: 'microbiology',
    component: null,
    description: 'Versioned CLSI + EUCAST breakpoint tables; AST Runs snapshot the breakpoint version at result time so publisher updates do not retroactively change interpretations.',
    specPath: 'designs/microbiology/m-02-breakpoint-catalog.md',
    htmlUrl: 'designs/microbiology/m-02-breakpoint-catalog.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-787'],
    tags: ['microbiology', 'breakpoint', 'CLSI', 'EUCAST', 'versioned', 'mvp-1a'],
  },
  {
    name: 'M-03 Order Entry Micro Hook',
    category: 'microbiology',
    component: null,
    description: 'Order Entry Step 1 amendment: when Program = MICROBIOLOGY, six micro-specific fields appear inline (Culture Protocol, Patient Origin, Number of Sets, Clinical History, Antibiotic Exposure, Critical Notify).',
    specPath: 'designs/microbiology/m-03-order-entry-micro-hook.md',
    htmlUrl: 'designs/microbiology/m-03-order-entry-step1.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-789'],
    tags: ['microbiology', 'order-entry', 'mvp-1a'],
  },
  {
    name: 'M-04 Isolate Modal',
    category: 'microbiology',
    component: null,
    description: 'Add / Edit Isolate modal — Gram stain, colony morphology, final ID, significance. Second example shows reidentification mode with versioning.',
    specPath: 'designs/microbiology/m-04-case-workbench-core.md',
    htmlUrl: 'designs/microbiology/m-04-isolate-modal.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-790'],
    tags: ['microbiology', 'case-workbench', 'modal', 'mvp-1a', 'phase-1a-plus'],
  },
  {
    name: 'M-06 Expert Rules Engine',
    category: 'microbiology',
    component: null,
    description: 'Configurable rules engine: MRSA inference, D-test required, ESBL screen/confirm, cascade reporting, intrinsic resistance verification. Phase 1B.',
    specPath: 'designs/microbiology/m-06-expert-rules-engine.md',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-793'],
    tags: ['microbiology', 'expert-rules', 'phase-1b'],
  },
  {
    name: 'M-07 Pending Cultures Worklist',
    category: 'microbiology',
    component: null,
    description: 'Primary morning-rounds tech surface — Cases by stage with red-highlighted positives and green-highlighted ready-to-finalize.',
    specPath: 'designs/microbiology/m-07-worklists.md',
    htmlUrl: 'designs/microbiology/m-07-pending-cultures.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-792'],
    tags: ['microbiology', 'worklist', 'mvp-1a'],
  },
  {
    name: 'M-04 Case Workbench \u2014 Interactive Prototype',
    category: 'microbiology',
    component: null,
    description: 'Clickable end-to-end case workup \u2014 start inoculation, add/identify isolates, set up + receive AST, log critical, release reports; stage, sidebar and next-step guidance update live; opens on the current step.',
    specPath: 'designs/microbiology/m-04-case-workbench-core.md',
    htmlUrl: 'designs/microbiology/m-04-case-workbench-prototype.html',
    added: '2026-06-05',
    status: 'draft',
    jira: ['OGC-790'],
    tags: ['microbiology', 'case-workbench', 'interactive', 'prototype', 'mvp-1a'],
  },
  {
    name: 'M-07 Worklist \u2014 Interactive Prototype',
    category: 'microbiology',
    component: null,
    description: 'Single shared Worklist (no per-case ownership) with a culture / AST grain toggle, needs-action cards, urgency sort, and folded-in resistance strip + recent activity; rows open the case. Analyzer results arrive automatically (no manual import).',
    specPath: 'designs/microbiology/m-07-worklists.md',
    htmlUrl: 'designs/microbiology/m-07-worklists-prototype.html',
    added: '2026-06-05',
    status: 'draft',
    jira: ['OGC-792'],
    tags: ['microbiology', 'worklist', 'interactive', 'prototype', 'mvp-1a'],
  },
  {
    name: 'Microbiology \u2014 Epic Dependency Graph',
    category: 'microbiology',
    component: null,
    description: 'Build-order dependency graph across the 14 micro epics (OGC-782\u2013795): foundations \u2192 catalog \u2192 case hub \u2192 operational \u2192 surveillance/hub. Planning aid.',
    htmlUrl: 'designs/microbiology/amr-micro-dependency-graph.svg',
    added: '2026-06-05',
    status: 'draft',
    jira: ['OGC-782'],
    tags: ['microbiology', 'dependency-graph', 'planning'],
  },
  {
    name: 'M-05 AST Entry \u2014 Interactive Prototype',
    category: 'microbiology',
    component: null,
    description: 'Inline AST entry (no modals) \u2014 type MIC to auto-interpret; switch breakpoint standard to re-compute (EUCAST vs CLSI); inline override with revert + reading history; no-breakpoint guidance; QC-fail recovery. Analyzer results auto-ingest, no manual import.',
    specPath: 'designs/microbiology/m-05-ast-entry-and-interpretation.md',
    htmlUrl: 'designs/microbiology/m-05-ast-entry-prototype.html',
    added: '2026-06-05',
    status: 'draft',
    jira: ['OGC-791'],
    tags: ['microbiology', 'ast', 'interactive', 'prototype', 'mvp-1a'],
  },
  {
    name: 'M-08 Macro Library',
    category: 'microbiology',
    component: null,
    description: 'Cross-cutting typing shortcuts: type .gpc, get "Gram positive cocci in clusters". 85 default macros across 8 categories. First Phase 1A+ feature.',
    specPath: 'designs/microbiology/m-08-macro-library.md',
    htmlUrl: 'designs/microbiology/m-08-macro-library.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-788'],
    tags: ['microbiology', 'macros', 'cross-cutting', 'ux-amplifier', 'phase-1a-plus'],
  },
  {
    name: 'M-09 WHONET Export',
    category: 'microbiology',
    component: null,
    description: 'Surveillance export with dedup parameters, validation pass, phenotype flag columns, lab profile bootstrap. To national reference lab. Phase 1B.',
    specPath: 'designs/microbiology/m-09-whonet-export.md',
    htmlUrl: 'designs/microbiology/m-09-whonet-export.html',
    added: '2026-05-15',
    status: 'draft',
    jira: ['OGC-794'],
    tags: ['microbiology', 'WHONET', 'surveillance', 'export', 'phase-1b'],
  },
  {
    name: 'M-10 Hub Subscription',
    category: 'microbiology',
    component: null,
    description: 'Unified admin for breakpoint + WHONET code + organism/antibiotic master updates from a central repository. OE pulls; never pushes. Phase 1B.',
    specPath: 'designs/microbiology/m-10-hub-subscription.md',
    htmlUrl: 'designs/microbiology/m-10-hub-subscription-prototype.html',
    added: '2026-05-15',
    updated: '2026-06-08',
    status: 'draft',
    jira: ['OGC-795'],
    tags: ['microbiology', 'hub-subscription', 'reference-data', 'phase-1b', 'interactive', 'prototype'],
  },
  {
    name: 'M-12 Test to Reagent Linkage',
    category: 'microbiology',
    component: null,
    description: 'General OE foundation: declare which reagent lots are required for a given test (ISO 15189 §7.3). Micro is the forcing function. Parallel pre-track to MVP-1A.',
    specPath: 'designs/microbiology/m-12-test-reagent-linkage.md',
    htmlUrl: 'designs/microbiology/m-12-test-reagent-linkage-prototype.html',
    added: '2026-05-15',
    updated: '2026-06-08',
    status: 'draft',
    jira: ['OGC-784'],
    tags: ['microbiology', 'reagent-linkage', 'iso-15189', 'cross-cutting', 'co-ship', 'mvp-1a', 'interactive', 'prototype'],
  },

  // ─── Microbiology — Guided Workflow Walkthrough (sequences the split prototypes) ─

  {
    name: 'Microbiology — Guided Workflow Walkthrough',
    category: 'microbiology',
    component: null,
    description: 'Guided step-through that sequences the split micro prototypes into one flow — per step a description + the embedded mockup + Prev/Next, with a Bacterial/TB branch toggle. Covers admin/config setup → order & routing → bacterial or TB work-up → reporting.',
    specPath: 'designs/microbiology/amr-micro-narrative.md',
    htmlUrl: 'designs/microbiology/amr-micro-workflow-flow.html',
    added: '2026-06-25',
    status: 'draft',
    jira: ['OGC-782'],
    tags: ['microbiology', 'walkthrough', 'flow', 'guided', 'interactive'],
  },

  // ─── Microbiology — Sync 5: TB / Antibiogram / GLASS / workflow-selection ─

  {
    name: 'M-14 TB Case — Interactive Prototype',
    category: 'microbiology',
    component: null,
    description: 'The M-04 Case Workbench shell as a TB profile: smear, MGIT/LJ culture, species ID, critical-concentration DST, molecular flags, staged interim reports.',
    specPath: 'designs/microbiology/m-14-mycobacteriology-tb.md',
    htmlUrl: 'designs/microbiology/m-14-tb-case-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-901'],
    tags: ['microbiology', 'mycobacteriology', 'tb', 'interactive', 'prototype', 'phase-2'],
  },
  {
    name: 'M-13 Antibiogram — Interactive Prototype',
    category: 'microbiology',
    component: null,
    description: 'Cumulative %S antibiogram (CLSI M39): organism × antibiotic matrix, first-isolate dedup, threshold suppression, PDF/CSV export.',
    specPath: 'designs/microbiology/m-13-antibiogram.md',
    htmlUrl: 'designs/microbiology/m-13-antibiogram-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-900'],
    tags: ['microbiology', 'antibiogram', 'reporting', 'interactive', 'prototype', 'phase-2'],
  },
  {
    name: 'M-04 Change Workflow / Unassigned',
    category: 'microbiology',
    component: null,
    description: 'M-04 §4.9 runtime escape hatch: re-classify an UNASSIGNED or mis-routed Case to the correct workflow_type (BACTERIOLOGY / MYCOBACTERIOLOGY_TB). 3 demo scenarios: unassigned, mis-routed-with-results, released-blocked.',
    specPath: 'designs/microbiology/m-04-case-workbench-core.md',
    htmlUrl: 'designs/microbiology/m-04-change-workflow-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-926'],
    tags: ['microbiology', 'case-workbench', 'workflow-type', 'interactive', 'prototype', 'phase-1a-plus'],
  },
  {
    name: 'M-04 Linked Cases — Shared Specimen',
    category: 'microbiology',
    component: null,
    description: 'Demonstrates Case keyed to sample_item_id × workflow_type: bacterial + TB on one sputum = two sibling Cases sharing one SampleItem. Worklist grouped siblings → bacterial case ↔ TB case sibling chip → order-entry 2-case preview.',
    specPath: 'designs/microbiology/m-04-case-workbench-core.md',
    htmlUrl: 'designs/microbiology/m-04-linked-cases-shared-specimen-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-790'],
    tags: ['microbiology', 'case-workbench', 'shared-specimen', 'sibling-cases', 'interactive', 'prototype', 'phase-1a-plus'],
  },
  {
    name: 'M-09 WHONET — Painless Export',
    category: 'microbiology',
    component: null,
    description: 'Extends the existing OpenELIS WHONetReportService seam: readiness indicator, bulk auto-map by name/OCL, 3-click export with WHO-GLASS defaults, configure-once unattended delivery.',
    specPath: 'designs/microbiology/m-09-whonet-export.md',
    htmlUrl: 'designs/microbiology/m-09-whonet-painless-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-794'],
    tags: ['microbiology', 'WHONET', 'surveillance', 'painless', 'interactive', 'prototype', 'phase-1b'],
  },
  {
    name: 'M-06 Expert Review — Inline Decision',
    category: 'microbiology',
    component: null,
    description: 'Expert Review section → inline Review & Decide panel: accept override / order confirmation / reject + confirmation loop. No modals (Principle 3).',
    specPath: 'designs/microbiology/m-06-expert-rules-engine.md',
    htmlUrl: 'designs/microbiology/m-06-expert-review-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-793'],
    tags: ['microbiology', 'expert-rules', 'inline', 'interactive', 'prototype', 'phase-1b'],
  },
  {
    name: 'M-11 Critical Notification — Inline',
    category: 'microbiology',
    component: null,
    description: 'Inline Log/Acknowledge/Close flow over the existing OpenELIS notifications entity. Open → Acknowledged → Closed. Reuses alerts dashboard as criticals filter; no new Alerts Dashboard build.',
    specPath: 'designs/microbiology/m-11-critical-result-acknowledgment.md',
    htmlUrl: 'designs/microbiology/m-11-critical-notification-prototype.html',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-785'],
    tags: ['microbiology', 'critical-ack', 'inline', 'interactive', 'prototype', 'phase-1a-plus'],
  },
  {
    name: 'M-13 Antibiogram',
    category: 'microbiology',
    component: null,
    description: 'Cumulative %S antibiogram (CLSI M39): organism × antibiotic matrix, first-isolate dedup, threshold suppression, data quality indicators, PDF/CSV export. Phase 2 reporting module.',
    specPath: 'designs/microbiology/m-13-antibiogram.md',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-900'],
    tags: ['microbiology', 'antibiogram', 'reporting', 'CLSI', 'surveillance', 'phase-2'],
  },
  {
    name: 'M-14 Mycobacteriology / TB',
    category: 'microbiology',
    component: null,
    description: 'M-04 Case Workbench extended for TB: workflow_type = MYCOBACTERIOLOGY_TB, smear microscopy, MGIT/LJ culture, species ID, WHO critical-concentration DST, molecular resistance flags (GeneXpert, Hain LPA), staged interim reports, WHONET-TB export.',
    specPath: 'designs/microbiology/m-14-mycobacteriology-tb.md',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-901'],
    tags: ['microbiology', 'mycobacteriology', 'tb', 'dst', 'whonet-tb', 'glass', 'phase-2'],
  },
  {
    name: 'M-15 GLASS — FHIR Surveillance',
    category: 'microbiology',
    component: null,
    description: 'OE pushes finalized AMR results to a consolidated FHIR server (WHO GLASS reporting path). Reuses FhirTransformService / FhirPersistanceService + EQA submission pattern. Backend/admin spec — no clinical mockup. Cross-lab aggregation stays outside OE.',
    specPath: 'designs/microbiology/m-15-glass-fhir-surveillance.md',
    added: '2026-06-08',
    status: 'draft',
    jira: ['OGC-918'],
    tags: ['microbiology', 'glass', 'fhir', 'surveillance', 'fhir-server', 'phase-2'],
  },
  {
    name: 'Microbiology AMR Narrative — v2.1',
    category: 'microbiology',
    component: null,
    description: 'v2.1 narrative: folds in four post-v2.0 decisions — Case keying is SampleItem × workflow_type (not 1:1 with Sample); WHONET (M-09) extends the existing export; M-11 critical notification reuses the notifications dashboard + TestNotificationService; Expert Review (M-06) and critical log-and-acknowledge (M-11) are inline panels, not modals. Cross-module context doc for the full M-00–M-15 bundle.',
    specPath: 'designs/microbiology/amr-micro-narrative.md',
    added: '2026-06-08',
    updated: '2026-06-12',
    status: 'draft',
    jira: ['OGC-782'],
    tags: ['microbiology', 'narrative', 'workflow-selection', 'tb', 'antibiogram', 'glass', 'v2.1'],
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
    component: null,
    description: 'Bethesda 2014 cytology case view — accordion layout grounded in real cytology_sample/cytology_diagnosis schema, HPV sibling-Analysis read-only display, anti-anchoring ASCCP recommendation UX, critical-result acknowledgment hook for HSIL+ findings.',
    specPath: 'designs/pathology/cytology-case-view.md',
    htmlUrl: 'designs/pathology/cytology-case-view.html',
    githubIssue: 33,
    updated: '2026-05-27',
    tags: ['pathology', 'cytology', 'Bethesda', 'PAP-smear', 'ASCCP', 'critical-results', 'v2'],
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
  {
    name: 'QA Menu v0.5 (IA Rehome)',
    category: 'quality',
    component: null,
    description: 'IA rehome for all existing QA-adjacent features — lands before v1 MVP. Three pillars: Statistical QC / EQA / QMS & Improvement. Rehomes QC Dashboard, EQA, NCE Register, and Audit Trail under a top-level Quality Assurance sidenav; 301 redirects on all legacy URLs. Madagascar GRIST UAT: LO-07-02 PASS, LO-07-03 SPLIT, LO-07-04 PASS.',
    specPath: 'designs/quality/qa-menu-v0.5.md',
    htmlUrl: 'designs/quality/qa-menu-v0.5.html',
    added: '2026-05-01',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['quality', 'QA-menu', 'IA', 'rehome', 'tech-debt', 'QC', 'EQA', 'NCE', 'audit-trail', 'Madagascar', 'GRIST'],
  },
  {
    name: 'QA Menu v1 MVP (QI Dashboard)',
    category: 'quality',
    component: null,
    description: 'MVP QA menu — single child node: QI Dashboard with four KPI tiles (Average TAT, Rejection Rate, Amendment Rate, NCE Pulse) computed from existing OpenELIS data. Includes three new REST wrappers, per-tile detail placeholders with filterable tables, permission registry additions (qa.view.overview, qa.view.qi, qa.manage.qi), and a QA Officer default role. Builds on top of the v0.5 IA container. ~45–55h with Claude.',
    specPath: 'designs/quality/qa-v1-mvp-frs.md',
    htmlUrl: 'designs/quality/qa-v1-preview.html',
    added: '2026-05-04',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['quality', 'QA-menu', 'QI-dashboard', 'TAT', 'rejection-rate', 'amendment-rate', 'NCE-pulse', 'MVP', 'KPI'],
  },
  {
    name: 'QA Menu v2 (E-Sig + Accreditation IA)',
    category: 'quality',
    component: null,
    description: 'v2 QA menu — adds the Electronic Signature Log, IA shell for Lab Accreditation Status (read-only, community-led), and full rehome stubs for all four pillars. Builds on v1 QI Dashboard. Does not ship net-new functional QI pages; those land in v3+. E-Sig Log replaces the four-table UNION ALL originally specced with a unified electronic_signature table.',
    specPath: null,
    htmlUrl: 'designs/quality/qa-v2-preview.html',
    added: '2026-05-04',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['quality', 'QA-menu', 'e-sig', 'electronic-signature', 'accreditation', 'IA', 'v2'],
  },
  {
    name: 'QA Menu — End State',
    category: 'quality',
    component: null,
    description: 'End-state vision for the full QA menu — all four pillars live (Statistical QC / EQA / QI / QMS & Improvement), full QI Dashboard with heatmap + Pareto charts on all QI pages, QI Configuration admin page, NCE Register modernization with CAPA + effectiveness review, EQA V2, read-only Accreditation Status (aligned to test-accreditation-frs.md), and the daily-focused QA Overview redesign. Reference target for the full release plan.',
    specPath: null,
    htmlUrl: 'designs/quality/qa-final-preview.html',
    added: '2026-05-04',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['quality', 'QA-menu', 'end-state', 'full-vision', 'QI-dashboard', 'NCE', 'CAPA', 'EQA', 'accreditation', 'heatmap', 'Pareto'],
  },
  {
    name: 'QA Westgard Phase 2',
    category: 'quality',
    component: null,
    description: 'Four bounded improvements to the existing Westgard/QC Dashboard module — organized in three priority tiers. Tier 1 (must-do, ~10–14h): active-violations alert banner + auto-create NCE on critical violations. Tier 2 (should-do, ~8–12h): statistical-method completion + sigma metrics display. Tier 3 (community candidate, ~10–15h): QC reporting/trend export (CSV + PDF). All tiers build on infrastructure already in OpenELIS.',
    specPath: 'designs/quality/qa-westgard-phase2-frs.md',
    htmlUrl: 'designs/quality/qa-westgard-phase2-preview.html',
    added: '2026-05-04',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['quality', 'westgard', 'QC', 'NCE', 'sigma-metrics', 'alert-banner', 'export', 'Phase-2'],
  },
  {
    name: 'QA Release Budget Calculator',
    category: 'quality',
    component: null,
    description: 'Interactive single-page budget calculator for the full QA release plan. Toggle individual items and use presets (Floor / Recommended / Inspector-ready / Stretch / Complete) to see total hours. Each item carries a one-line description, phase label, and hour range. Computed from the effort estimates in qa-release-plan.md and effort-estimate-with-claude.md.',
    specPath: 'designs/quality/qa-release-plan.md',
    htmlUrl: 'designs/quality/qa-release-budget-calculator.html',
    added: '2026-05-04',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['quality', 'planning', 'budget', 'effort-estimate', 'release-plan', 'interactive'],
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
    description: 'V-04 Vector Surveillance Reporting — Apache Superset dashboard embedded via guest token JWT into the Reports → Vector Surveillance page, backed by an OHS SQL-on-FHIR ETL pipeline that flattens HAPI FHIR resources into Postgres analytics views feeding 4–7 charts (trap catch trend, species distribution, MIR heatmap, pathogen positivity). NEW in v1.5 — Manual Entry Helper tab at /reports/vector-surveillance/manual-entry that accelerates manual submission to the Kemenkes Subdit Vektor SILANTOR portal: large-font numeric Tiles per metric with Copy IconButton, Aedes/Anopheles sub-tabs, Sporozoite-rate auto-gating below 95% positive resolution, and a Mark-Week-Submitted modal that writes an audit row. Admin field-map page at /admin/vector/manual-entry-fields lets deployments re-order and relabel metrics without code changes; metric list, cadence, and portal field tags are marked @TBD-Ida pending APHL Indonesia confirmation.',
    specPath: 'designs/vector-surveillance/vector-surveillance-reporting.md',
    htmlUrl: 'designs/vector-surveillance/vector-surveillance-reporting.html',
    added: '2026-04-20',
    status: 'draft',
    jira: ['OGC-585', 'OGC-527'],
    tags: ['vector', 'surveillance', 'reporting', 'superset', 'dashboard', 'fhir', 'ohs', 'analytics', 'MIR', 'Indonesia', 'mosquito', 'manual-entry', 'silantor', 'kemenkes', 'data-entry-helper'],
  },

  // ─── Results & Validation — v4 redesign ───
  {
    name: 'Results Entry v4',
    project: ['png'],
    category: 'results-validation',
    component: null,
    description: '⚠️ SUPERSEDED by the Multi-Component (integrated) FRS (results-entry-multicomponent.md). Results Entry consolidated redesign (v4) — per-row edit-state lock, Method + Analyzer split columns, inline NCE (real InlineNceForm field set), inline remaining-volume / disposal trigger, dual-axis notes, contrast-ratio critical flags, bulk-release action, cross-domain (Clinical/Environmental/Vector via Lab Unit). Supersedes v3 Results Page. Companion: Validation Page v4 and Result & Validation Configuration v4 (admin).',
    specPath: 'designs/results-validation/results-entry-v4.md',
    htmlUrl: 'designs/results-validation/results-entry-v4.html',
    added: '2026-06-10',
    status: 'draft',
    jira: [],
    tags: ['results', 'data-entry', 'workflow', 'v4', 'method-analyzer', 'nce', 'edit-state', 'cross-domain', 'Indonesia', 'SILNAS', 'png-deliverable'],
  },
  {
    name: 'Validation Page v4',
    project: ['png'],
    category: 'results-validation',
    component: null,
    description: '⚠️ SUPERSEDED by the Multi-Component (integrated) FRS (validation-multicomponent.md). Validation Page consolidated redesign (v4) — NCE / QC-fail / modification / critical-ack triage chips in the list view, smart bulk-release (excludes unreviewed criticals), Method + Analyzer split columns, inline rejection with NCE record, per-row review state, e-signature on release. Cross-domain (Clinical/Environmental/Vector). Companion: Results Entry v4 and Result & Validation Configuration v4.',
    specPath: 'designs/results-validation/validation-page-v4.md',
    htmlUrl: 'designs/results-validation/validation-page-v4.html',
    added: '2026-06-10',
    status: 'draft',
    jira: [],
    tags: ['validation', 'results', 'review', 'v4', 'bulk-release', 'nce', 'cross-domain', 'Indonesia', 'SILNAS', 'png-deliverable'],
  },

  // ─── Results & Validation — Multi-Component integrated FRSs (supersede v4) ───
  {
    name: 'Results Entry — Multi-Component (integrated)',
    project: ['png'],
    category: 'results-validation',
    component: null,
    description: 'New full Results Entry FRS that carries forward all v4 scope and natively integrates multi-component result entry — a test defining more than one result_component shows one result field per component, reusing the existing result-cell renderer; single-component tests are unchanged. First use case: molecular target gene + Ct (Xpert MTB/RIF, SARS-CoV-2). Rev 2026-07-15 adds §O Concurrency & multi-user behavior — per-result save scoping, optimistic stale-save rejection, and ephemeral session-bound "in review by" presence (no locking) — prompted by a Lab Unit whole-page-save overwrite incident. Supersedes the Results Entry v4 FRS. Companion: Validation Page — Multi-Component (integrated) and the v1 additive module.',
    specPath: 'designs/results-validation/results-entry-multicomponent.md',
    added: '2026-07-09',
    updated: '2026-07-15',
    status: 'draft',
    githubIssue: null,
    jira: ['OGC-811', 'OGC-1130', 'OGC-1131'],
    tags: ['results', 'data-entry', 'workflow', 'multi-component', 'result-component', 'molecular', 'ct', 'pcr', 'method-analyzer', 'cross-domain', 'concurrency', 'multi-user'],
  },
  {
    name: 'Validation Page — Multi-Component (integrated)',
    project: ['png'],
    category: 'results-validation',
    component: null,
    description: 'New full Validation Page FRS that carries forward all v4 scope and adds read-only multi-component display — for a test with more than one result_component the review panel shows every component (value, label, unit, range, flag) in order so the validator reviews the whole result before releasing. Supersedes the Validation Page v4 FRS. Companion: Results Entry — Multi-Component (integrated).',
    specPath: 'designs/results-validation/validation-multicomponent.md',
    added: '2026-07-09',
    status: 'draft',
    githubIssue: null,
    jira: ['OGC-817', 'OGC-1130', 'OGC-1131'],
    tags: ['validation', 'results', 'review', 'multi-component', 'result-component', 'read-only', 'method-analyzer', 'cross-domain'],
  },
  {
    name: 'Analyzer Ingestion — Multi-Component Results',
    project: ['png'],
    category: 'results-validation',
    component: null,
    description: 'FRS for analyzer ingestion of multi-component results — extends the analyzer import + mapping so a reported target/channel resolves to a (test, component) pair, not only a test. A multiplex molecular run (GeneXpert per-probe values, BioRad CFX Opus per-fluor Cq rows) populates a multi-component test\'s components automatically, matched on a stable component code; unmapped targets surface as visible exceptions; deployments that map channels to separate tests keep working unchanged. Reuses the OGC-1124 RESULT.component_id storage and the existing multi-result import path. Companion: Results Entry / Validation Page — Multi-Component (integrated).',
    specPath: 'designs/results-validation/analyzer-multicomponent-ingestion.md',
    added: '2026-07-09',
    status: 'draft',
    githubIssue: null,
    jira: ['OGC-1129', 'OGC-1131'],
    tags: ['analyzer', 'analyzer-integration', 'import', 'multi-component', 'result-component', 'molecular', 'ct', 'cq', 'pcr', 'multiplex', 'genexpert', 'biorad-cfx'],
  },
  {
    name: 'Result & Validation v4 — Dependency Map',
    category: 'results-validation',
    component: null,
    description: 'Interactive Mermaid dependency map for the v4 Results & Validation redesign — shows build order across Configuration (C1–C3), Results Entry (RE1–RE7), and Validation (V1–V4) slices. Green nodes are ready to build; red nodes are gated on unbuilt dependencies. Reference for the implementing pipeline.',
    specPath: null,
    htmlUrl: 'designs/results-validation/results-validation-v4-dependency-map.html',
    added: '2026-06-10',
    status: 'draft',
    jira: ['OGC-811', 'OGC-817', 'OGC-1016'],
    tags: ['results', 'validation', 'v4', 'dependency-map', 'build-order', 'diagram'],
  },
  {
    name: 'Results Entry v4 — Design Decisions',
    category: 'results-validation',
    component: null,
    description: 'Cross-surface design decisions log (D1–D22) for the v4 Results & Validation redesign. Covers edit-state machine (D1), inline NCE (D2), Method/Analyzer split (D3–D5), reagent capture (D6), dual-axis notes (D7), critical flags (D8–D9), bulk-release (D10), rejection (D11–D12), multi-level validation policy (D13–D15), config consolidation (D16–D18), and cross-domain behavior (D19–D22). Referenced by the FRSs — filename kept stable so cross-links hold.',
    specPath: 'designs/results-validation/results-entry-v4-decisions.md',
    added: '2026-06-10',
    status: 'draft',
    jira: ['OGC-811', 'OGC-817', 'OGC-343'],
    tags: ['results', 'validation', 'v4', 'decisions', 'design-decisions', 'cross-surface'],
  },
  {
    name: 'Results Validation v4 — Story Breakdown',
    category: 'results-validation',
    component: null,
    description: 'PR-sized story breakdown for the v4 Results & Validation redesign. 14 slices across Configuration (C1–C3), Results Entry (RE1–RE7), and Validation (V1–V4), dependency-ordered. Includes Jira key map (OGC-1016–1030), story points, covered FRS sections, and cross-cutting concerns per slice. Build order: Config first, then green-node RE/V slices, gated (red) slices last.',
    specPath: 'designs/results-validation/results-validation-v4-breakdown.md',
    added: '2026-06-10',
    status: 'draft',
    jira: ['OGC-811', 'OGC-817', 'OGC-1016'],
    tags: ['results', 'validation', 'v4', 'breakdown', 'story-map', 'pr-sized', 'jira'],
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
    jira: ['OGC-817', 'OGC-291', 'OGC-343'],
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
    jira: ['OGC-817', 'OGC-291', 'OGC-343'],
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
    jira: ['OGC-817', 'OGC-291', 'OGC-343'],
    added: '2026-03-09',
    status: 'review',
    relatedTo: ['Validation Page v3 (Demographics)', 'Patient Demographics Mockup'],
    githubIssue: 42,
    tags: ['patient', 'demographics', 'FRS', 'spec'],
  },
  {
    name: 'HIL Specimen Quality',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/hil-specimen-quality.jsx')),
    description: 'End-to-end capture, surfacing, and audit of specimen interference — Hemolysis, Icterus, Lipemia. Covers analyzer ingestion → validator UI → patient report. New admin page for severity-action thresholds. Extends Generic ASTM 1.2 profile with a specimen_quality_field_mapping slot. Lights up the dormant HIL chip already designed in the patient report redesign.',
    specPath: 'designs/results-validation/hil-specimen-quality.md',
    htmlUrl: 'designs/results-validation/hil-specimen-quality-preview.html',
    added: '2026-04-27',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['HIL', 'hemolysis', 'icterus', 'lipemia', 'specimen-quality', 'results', 'validation', 'analyzer', 'ASTM'],
  },
  {
    name: 'Multi-Component Result Entry v1',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/results-entry-multicomponent-v1.jsx')),
    description: 'V1 additive multi-value capture on the existing Results Entry & Validation page (SearchResultForm.jsx). A test that defines more than one result_component renders one result-entry field PER component, each produced by the same result-cell renderer the primary result uses today (chosen by the component result_type). Single-component tests are unchanged. First use case: molecular target gene + Ct (Xpert MTB/RIF, SARS-CoV-2). Consumes the OGC-949 M1 test_result_component model; replaces the PR #3831 scalar-column approach (no new analysis/test columns, no data migration). Self-contained module intended for a future fold-in to the OGC-811/817 inline results redesign.',
    specPath: 'designs/results-validation/results-entry-multicomponent-v1.md',
    htmlUrl: 'designs/results-validation/results-entry-multicomponent-v1-preview.html',
    jira: ['OGC-949'],
    added: '2026-07-08',
    status: 'draft',
    githubIssue: null,
    tags: ['results-entry', 'results', 'validation', 'multi-component', 'result-component', 'molecular', 'ct', 'pcr'],
  },
  {
    name: 'Reagent Usage on Result Entry v1',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/results-page-reagent-usage-v1.jsx')),
    description: 'Interim v1 — captures reagent lot usage at the point of result entry. Adds a Method & Reagents tab to the results entry page with lot selection, expiry display, and usage logging. Designed as a drop-in complement to the existing results page without requiring a full redesign.',
    specPath: 'designs/results-validation/results-page-reagent-usage-v1.md',
    htmlUrl: 'designs/results-validation/results-page-reagent-usage-v1-preview.html',
    added: '2026-04-27',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['reagent', 'lot', 'results-entry', 'method', 'usage', 'results'],
  },
  {
    name: 'Reagent Usage on Result Entry v2.1',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/results-page-reagent-usage-v2.1.jsx')),
    description: 'v2.1 iteration of the Method & Reagents tab — drop-in replacement for the existing ReagentLotSelection block. Refines lot picker UX, adds inline expiry warnings, and improves the usage audit trail display. No FRS change from v1; mockup-only update.',
    specPath: 'designs/results-validation/results-page-reagent-usage-v1.md',
    htmlUrl: 'designs/results-validation/results-page-reagent-usage-v2.1-preview.html',
    added: '2026-04-27',
    status: 'draft',
    githubIssue: null,
    jira: [],
    tags: ['reagent', 'lot', 'results-entry', 'method', 'usage', 'results', 'v2'],
  },
  {
    name: 'Compliance Evaluation Engine',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/results-validation/compliance-evaluation-engine.jsx')),
    description: 'S-05 v2.0 — Regulation-scoped reference ranges: numeric threshold evaluation per compliance standard × result component. 2026-04-28 amendment: evaluates per regulation (from M:N order_compliance_standard join) and per component (for multi-component tests). Existing fallback chain preserved. Splits descriptive/categorical vocabulary to S-05a.',
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
    name: 'Results Entry — Expanded Uncertainty (U) Capture',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/results-entry-expanded-uncertainty.jsx')),
    description: 'Results Entry screen enhancement (OGC-775, S-15a MVP) — adds an optional U (k=2) numeric column to the results table for ISO 17025 §7.8.3.1(c) expanded measurement uncertainty capture. Backward-compatible: labs without uncertainty leave the cell blank. The LHU v2.0 (OGC-552) conditional U column reads this value when populated. MVP scope only — no tooltips, admin toggle, or method-level prefill; those land in S-15a v2 if needed.',
    specPath: 'designs/results-validation/results-entry-expanded-uncertainty.md',
    htmlUrl: 'designs/results-validation/results-entry-expanded-uncertainty.html',
    added: '2026-05-28',
    status: 'draft',
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
    name: 'Environmental LHU',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/environmental-lhu.jsx')),
    description: 'Environmental Laporan Hasil Uji v2.0 — printable test result report for environmental samples (air, water, soil, sediment, food). v2.0 adds ISO/IEC 17025:2017 §7.8 report-face blocks (results-apply-only disclaimer, decision rule, end-of-report marker, reproduction restriction), conditional measurement uncertainty (U) column, subcontract disclosure, sampling responsibility, method validation status annotations, and amendment workflow. Inherits S-06 letterhead, e-signature, and print config. Multi-matrix result table with compliance icons, KAN accreditation handling, and Baku Mutu regulatory reference. Real data from PT. Unggulrejo Wasono & RS Permata Depok.',
    specPath: 'designs/vector-surveillance/environmental-lhu.md',
    htmlUrl: 'designs/vector-surveillance/environmental-lhu-annotated.html',
    added: '2026-04-28',
    updated: '2026-05-26',
    status: 'draft',
    relatedTo: ['Laporan Hasil — Compliance Report'],
    tags: ['report', 'environmental', 'laporan-hasil', 'LHU', 'pdf', 'certificate', 'Indonesia', 'SILNAS', 'KAN'],
  },
  {
    name: 'Vector LHU',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/vector-lhu.jsx')),
    description: 'Vector Laporan Hasil Uji v2.0 — printable surveillance report for BBLKM/Labkesmas. Four result-table modes: Species ID (PCR + arbovirus serotype/genotype), Surveillance Indices (MIR + MLE with 95% CIs per WHO 2021), Larval Population (HI/CI/BI + ABJ vs Kemenkes 95% target), and NEW Mode D Pupae Per Person Index (PPI) per WHO 2003 / Focks et al. 2000. Adds ISO 17025 §7.8 report-face blocks. Trap type, lure, deployment period, hierarchical geographic resolution (province → kelurahan → RT/RW). Deployment-configurable risk thresholds (PAHO 2017 + Permenkes 50/2017). Real data from BBLKM Jakarta Aedes aegypti.',
    specPath: 'designs/vector-surveillance/vector-lhu.md',
    htmlUrl: 'designs/vector-surveillance/vector-lhu-annotated.html',
    added: '2026-04-28',
    updated: '2026-05-26',
    status: 'draft',
    relatedTo: ['Laporan Hasil — Compliance Report'],
    tags: ['report', 'vector-surveillance', 'laporan-hasil', 'LHU', 'pdf', 'certificate', 'Indonesia', 'SILNAS', 'KAN', 'mosquito', 'entomology'],
  },
  {
    name: 'Collection Lot — Trap Details',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/vector-surveillance/collection-lot-trap-details.jsx')),
    description: 'V-02 Vector Collection Workflow form enhancement (OGC-777, V-05a STRETCH) — adds a "Trap Configuration" section to the existing CollectionLot edit form with four new optional fields: lure, deployment_start, deployment_end, storage_temperature_c. WHO entomological surveillance reproducibility requirements. Backward-compatible: existing CollectionLots remain valid with NULL values. LHU Mode A footnote auto-degrades when fields are null. STRETCH: partner labs do not yet capture this granularity.',
    specPath: 'designs/vector-surveillance/collection-lot-trap-details.md',
    htmlUrl: 'designs/vector-surveillance/collection-lot-trap-details.html',
    added: '2026-05-28',
    status: 'draft',
  },
  {
    name: 'Laporan Hasil — Compliance Report',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/reports/S06-laporan-hasil-compliance-report-mockup.jsx')),
    description: 'Laporan Hasil (S-06) — formal Sertifikat Hasil Uji (Test Results Certificate) PDF generation for validated environmental orders. Dual e-signature, batch ZIP download, shared Report Print Configuration admin page. Amended 2026-06-15 with §7a Domain Variants cross-reference to S06c (Environmental LHU) + S06d (Vector LHU) siblings.',
    specPath: 'designs/reports/S06-laporan-hasil-compliance-report-frs-v1.0.md',
    htmlUrl: 'designs/reports/S06-laporan-hasil-compliance-report-preview.html',
    added: '2026-04-05',
    status: 'draft',
    githubIssue: 77,
    jira: ['OGC-552', 'OGC-527'],
    relatedTo: ['Environmental LHU', 'Vector LHU'],
    tags: ['compliance', 'report', 'environmental', 'vector', 'certificate', 'pdf', 'laporan-hasil'],
  },
  {
    name: 'S06c — Environmental LHU',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/S06c-environmental-lhu-mockup.jsx')),
    description: 'S-06c — Environmental Laporan Hasil Uji (LHU) sibling spec to S06. Result table columns No. | Parameter | Hasil Uji | Baku Mutu | Satuan | Ket. (Metode dropped, in compact footnote). Water, food, ambient air, surface swabs, and physical conditions matrices. KAN per-parameter asterisk; multi-matrix bundling. Ships canonical Indonesian preview + bilingual annotated sibling.',
    specPath: 'designs/reports/S06c-environmental-lhu-frs-v1.0.md',
    htmlUrl: 'designs/reports/S06c-environmental-lhu-preview.html',
    added: '2026-06-15',
    status: 'draft',
    jira: ['OGC-552', 'OGC-527'],
    tags: ['report', 'pdf', 'lhu', 'environmental', 'kan', 'indonesia', 'compliance', 'laporan-hasil', 'bilingual'],
  },
  {
    name: 'S06d — Vector LHU',
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/S06d-vector-lhu-mockup.jsx')),
    description: 'S-06d — Vector surveillance Laporan Hasil Uji (LHU) sibling spec to S06. Three flexible result-table modes: A (Species ID via PCR), B (Surveillance Indices — MIR, infection rate, density), C (Larval Population Indices — House/Container/Breteau Index, Angka Bebas Jentik). Multi-LHU number bundling. Ships canonical Indonesian preview + bilingual annotated sibling.',
    specPath: 'designs/reports/S06d-vector-lhu-frs-v1.0.md',
    htmlUrl: 'designs/reports/S06d-vector-lhu-preview.html',
    added: '2026-06-15',
    status: 'draft',
    jira: ['OGC-552', 'OGC-527'],
    tags: ['report', 'pdf', 'lhu', 'vector', 'surveillance', 'pcr', 'larva', 'mir', 'kan', 'indonesia', 'laporan-hasil', 'bilingual'],
  },
  {
    name: 'LH Delivery — Sent Messages Tab',
    category: 'vector-surveillance',
    component: React.lazy(() => import('@designs/reports/lh-delivery-sent-messages.jsx')),
    description: 'S-06b Addendum — LH Delivery Notification: Sent Messages global main-menu tab. Per-channel delivery status (Email ✓/✗, WhatsApp ✓/✗) for Laporan Hasil, clinical, and future notifications. Extends OGC-437 (TextIt SMS) + OGC-439 (Email/SMTP) triggers with LH_COMPLETED event. Resend flow, delivery log modal, and secure customer download page with 30-day token.',
    specPath: 'designs/reports/lh-delivery-sent-messages.md',
    htmlUrl: 'designs/reports/lh-delivery-sent-messages-preview.html',
    added: '2026-04-20',
    status: 'draft',
    githubIssue: 83,
    jira: ['OGC-587', 'OGC-552', 'OGC-527'],
    tags: ['compliance', 'notification', 'environmental', 'vector', 'SMS', 'email', 'delivery', 'laporan-hasil', 'Indonesia', 'SILNAS'],
  },
  {
    name: 'Report Print Queue',
    project: ['png'],
    category: 'reports',
    component: React.lazy(() => import('@designs/reports/report-print-queue.jsx')),
    description: 'Report-type-agnostic print queue (v1.3): auto-surfaces validated-but-unprinted reports; completeness indicators, print recording via existing report tracking. r3 filter bar redesign — Facility / Ward / Requestor are FilterableMultiSelect with server-side typeahead, Lab No is a first-class toolbar lookup, Search by Patient opens inline, and targeted searches are exclusive (suspend browse filters).',
    specPath: 'designs/reports/report-print-queue.md',
    htmlUrl: 'designs/reports/report-print-queue.html',
    added: '2026-06-10',
    updated: '2026-07-06',
    status: 'draft',
    jira: ['OGC-1031'],
    tags: ['reports', 'print-queue', 'PNG'],
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
    relatedTo: ['Report Print Queue', 'Test Accreditation & Report Logo Threshold'],
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
    description: '3-step CSV report builder wizard with grain-family variable selection, filters, and sync/async routing — plus async My Report Queue and Saved Export Configurations. v1.1 (2026-07-15): grain families with color coding + legend, QC domain removed, single PII tag, overwrite-confirm for saved configs.',
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
    name: 'Inventory Module Redesign',
    category: 'inventory',
    component: null,
    description: 'Decision-support redesign of the Inventory module — Items board (catalog + live stock, count mode, tags), scan-first Receive, Reorder suggestions with learned lead time, median-based run-out window, per-location visibility, CSV import. Coordinates with Results Entry reagent-usage (consumption + FEFO) and OGC-657 (shared storage).',
    specPath: 'designs/inventory/inventory-redesign.md',
    htmlUrl: 'designs/inventory/inventory-redesign.html',
    added: '2026-07-23',
    status: 'draft',
    githubIssue: 237,
    tags: ['inventory','decision-support','reorder','fefo','redesign','OGC-438'],
  },
  {
    name: 'Inventory Item-Type Management',
    category: 'inventory',
    component: React.lazy(() => import('@designs/inventory/inventory-item-type-management.jsx')),
    description: 'Move the hard-coded "Type of Item" list into the Data Dictionary: managed item-type admin with add/edit/deactivate, replacing hardcoded values.',
    specPath: 'designs/inventory/inventory-item-type-management.md',
    htmlUrl: 'designs/inventory/inventory-item-type-management.html',
    added: '2026-06-12',
    status: 'draft',
    tags: ['inventory','item-type','data-dictionary','admin'],
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
    name: 'In-App Help System',
    category: 'system',
    component: React.lazy(() => import('@designs/system/help-menu.jsx')),
    description: 'Contextual in-app help viewer for OpenELIS Global — a slide-over panel triggered from a persistent Help button in the app shell. Delivers page-aware help articles (Markdown rendered to HTML), full-text search across all articles, related-articles suggestions, feedback thumbs (helpful / not helpful), and a "request help" escape hatch to the community forum. Content managed as static Markdown files in the repo. FRS v1.0 with full data model, i18n keys, acceptance criteria, and requirements checklist.',
    specPath: 'designs/system/help-menu.md',
    htmlUrl: 'designs/system/in-app-help-preview.html',
    added: '2026-05-12',
    status: 'draft',
    githubIssue: 44,
    jira: [],
    tags: ['help', 'documentation', 'UI', 'navigation', 'contextual-help', 'search', 'slide-over', 'global'],
  },
  {
    name: 'Analyzer Results Import (v2 redesign)',
    category: 'system',
    component: React.lazy(() => import('@designs/system/analyzer-import-redesign-v2.jsx')),
    description: 'OGC-288 redesign of the Analyzer Results Import review page. QC-first review with per-analysis accept/reject and the QC-fail action set (Retest / Report NCE / Reject / Accept despite QC failure), select-all + normal selection, a run-settings sidebar, and the G1-G13 bench-experience refinements. Multi-component-aware: per-target Ct/Cq values grouped by analysis, with unmapped targets surfaced as visible exceptions. Access moved to the results permission. Supersedes the wireframe-era Analyzer Import entry, carrying its QC-first / run-settings / sidebar mechanics forward in FRS form.',
    specPath: 'designs/system/analyzer-import-redesign-v2.md',
    htmlUrl: 'designs/system/analyzer-import-redesign-v2-preview.html',
    added: '2026-07-14',
    status: 'draft',
    githubIssue: null,
    jira: ['OGC-288', 'OGC-1131', 'OGC-1129'],
    tags: ['analyzer', 'analyzer-integration', 'import', 'results', 'qc', 'nce', 'non-conformity', 'multi-component', 'result-component', 'molecular', 'ct', 'review', 'system'],
  },
  {
    name: 'Analyzer Import',
    category: 'system',
    component: React.lazy(() => import('@designs/system/analyzer-import.jsx')),
    description: '[Superseded by Analyzer Results Import (v2 redesign), OGC-288] Bulk analyzer configuration import (wireframe-era analyzer results import redesign).',
    specPath: 'designs/system/analyzer-import.md',
    archived: true,
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
    component: null,
    description: 'Management Overview dashboard (v1, 2026-06 redesign) — what-needs-attention focus: pending workload by section, TAT health, analyzer/QC/reagent alerts, throughput. Part of the Dashboards & Home redesign FRS (Home + Management Dashboard, one epic).',
    specPath: 'designs/system/lab-management-dashboard.md',
    htmlUrl: 'designs/system/lab-management-dashboard.html',
    added: '2026-03-24',
    updated: '2026-06-12',
    status: 'draft',
    githubIssue: 64,
    jira: ['OGC-485'],
    tags: ['dashboard', 'KPI', 'TAT', 'management', 'real-time', 'redesign'],
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
    description: 'S-03 v2.0 — 3-step wizard (Branch & Setup / Label & Store / QA-QC + Intake) at Reception for domain-assigned labs. Regulation-driven vs ad-hoc branch selector, sample manifest quantity table + CSV upload, per-sample NCE, QC quick-add. 2026-04-28 amendment: multi-regulation M:N — Compliance Standard is now a MultiSelect; suggested tests union across selected standards; order_compliance_standard join table replaces single complianceStandardId column.',
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
    name: 'Clinical Order Entry (v2)',
    category: 'vector-surveillance',
    component: null,
    description: 'v2 clinical order-entry wizard (Enter Order \u2192 Collect \u2192 Label & Store \u2192 QA Review) realigned to the three-workflow spec. Adds the self-describing "Assign to" sample\u2194test menu at Collect, Ward/Unit/Department facility sub-unit, requester with Phone/Fax/Email + admin-gated add-new + edit-lock on found records, test search by name or code, blank-by-default quantity, de-gated print/storage, and the Sample Acceptance Checklist (S-09 / OGC-580) on QA Review.',
    specPath: 'designs/sample-collection/order-entry-frs-v3-three-workflows.md',
    htmlUrl: 'designs/sample-collection/clinical-order-entry-v2.html',
    added: '2026-06-25',
    status: 'draft',
    jira: ['OGC-1066', 'OGC-1067', 'OGC-1069'],
    tags: ['clinical', 'order-entry', 'sample-collection', 'collect', 'qa', 'requester'],
  },
  {
    name: 'Environmental Order Entry (v2)',
    category: 'vector-surveillance',
    component: null,
    description: 'v2 environmental order-entry. Requester = Requesting Organization + Requestor contact, both searched & stored like the clinical provider, with full Phone/Fax/Email, admin-gated add-new, and edit-lock on records pulled from search. Collection method optional; CSV bulk intake retained (Env/Vector only).',
    specPath: 'designs/sample-collection/order-entry-frs-v3-three-workflows.md',
    htmlUrl: 'designs/sample-collection/environmental-order-entry-v2.html',
    added: '2026-06-25',
    status: 'draft',
    jira: ['OGC-1066', 'OGC-1068'],
    tags: ['environmental', 'order-entry', 'requester', 'organization', 'CSV', 'sample-collection'],
  },
  {
    name: 'Vector Collection Workflow (v2)',
    category: 'vector-surveillance',
    component: null,
    description: 'v2 vector collection workflow. Requester relabeled to the shared Requesting Organization + Requestor element (identical to Environmental), with full Phone/Fax/Email, admin-gated add-new, and edit-lock on found records.',
    specPath: 'designs/sample-collection/order-entry-frs-v3-three-workflows.md',
    htmlUrl: 'designs/vector-surveillance/vector-collection-workflow-v2.html',
    added: '2026-06-25',
    status: 'draft',
    jira: ['OGC-1066', 'OGC-1068'],
    tags: ['vector', 'order-entry', 'requester', 'sample-collection'],
  },
  {
    name: 'Order Entry \u2014 Developer Reference',
    category: 'vector-surveillance',
    component: null,
    description: 'Single source of truth for the order-entry realignment (epic OGC-1066): north-star model, per-stage behavior, current\u2192required defect table with live evidence, anti-drift guardrails, and the story map (OGC-1067\u20131073). Anchor doc for Reagan + coding agents.',
    specPath: 'designs/sample-collection/order-entry-developer-reference.md',
    added: '2026-06-25',
    status: 'draft',
    jira: ['OGC-1066'],
    tags: ['order-entry', 'developer-reference', 'spec', 'sample-collection'],
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
    relatedTo: ['Subcontract Management', 'Reference Lab Results'],
    jira: ['OGC-527'],
    tags: ['referral', 'inter-lab', 'subcontract', 'environmental', 'vector', 'clinical', 'chain-of-custody', 'ISO-17025'],
  },

  {
    name: 'Reference Lab Results',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/reference-lab-results.jsx')),
    description: 'New SideNav item under Sample Shipment. Outstanding / Returned-needs-action / History views for tracking the data lifecycle of referrals after physical shipment. Migrates ReferralStatus enum to FHIR Task states; adds manual-entry path for non-OpenELIS reference labs; Accept/Reject with terminal close + re-collection notification; Box.Reconciled gate. Supersedes OGC-624 state-model scope.',
    specPath: 'designs/sample-collection/reference-lab-results.md',
    htmlUrl: 'designs/sample-collection/reference-lab-results.html',
    added: '2026-05-28',
    status: 'draft',
    relatedTo: ['Inter-Lab Transfer'],
    jira: ['OGC-796'],
    tags: ['referral', 'reference-lab', 'FHIR', 'sample-shipment', 'Madagascar', 'global', 'reconciliation', 'inter-lab'],
  },

  {
    name: 'Pre-Analytical Eligibility Gate',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/pre-analytical-eligibility-gate.jsx')),
    description: 'S-09 v3.0 — Pre-Analytical Eligibility Gate & Resampling, simplification rewrite of v2.0. Replaces the auto-evaluating per-SampleType criteria engine with a generic, manually-completed sample acceptance checklist at reception Step 3, plus a Resample action that rejects a sample and spawns a linked pre-populated draft order with requester notification. Configuration is a lightweight master list, fully decoupled from the Test Catalog editor (which removed the SampleType admin tab v2.0 depended on). No new status enum, no new permission keys. See analysis + story-breakdown docs.',
    specPath: 'designs/sample-collection/pre-analytical-eligibility-gate.md',
    htmlUrl: 'designs/sample-collection/pre-analytical-eligibility-gate.html',
    added: '2026-04-16',
    updated: '2026-06-16',
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
  {
    name: 'CSV Bulk Sample Intake',
    category: 'sample-collection',
    component: React.lazy(() => import('@designs/sample-collection/csv-bulk-sample-intake.jsx')),
    description: 'Bulk-load pre-collected Environmental/Vector samples into an order from a spreadsheet instead of keying them one at a time. A Bulk import samples action expands inline at the bottom of the Enter Order page: upload a CSV or XLSX manifest, map columns, validate each row three-state (Ready / advisory / required) against on-file sample types, tests and panels, set missing values in bulk or inline, normalize dates, then commit all-or-nothing through the existing order write path. v1 MVP; v2 saved import profiles; v3 container storage. Clinical out of scope.',
    specPath: 'designs/sample-collection/csv-bulk-sample-intake.md',
    htmlUrl: 'designs/sample-collection/csv-bulk-sample-intake.html',
    added: '2026-07-15',
    status: 'draft',
    jira: ['OGC-1138'],
    tags: ['sample-collection', 'environmental', 'vector', 'csv', 'bulk-import', 'order-entry'],
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

// ─── Customer / deployment projects ───────────────────────────────
// A mockup belongs to a project when its `project` array includes the key.
// Kept separate from freeform `tags` so customer scope is unambiguous
// (e.g. a 'PNG' tag meaning the .png image format never leaks in here).
export const projects = ['png'];

export const projectConfig = {
  png: {
    label: 'Papua New Guinea',
    short: 'PNG',
    org: 'CPHL — Central Public Health Laboratory, Port Moresby',
    blurb: 'OpenELIS Global designs in progress for the PNG / CPHL deployment. Browse the mockups and specifications below at your own pace.',
  },
};

export const projectLabels = Object.fromEntries(
  Object.entries(projectConfig).map(([k, v]) => [k, v.label])
);

/** True when a mockup is tagged for the given project. */
export function inProject(mockup, projectKey) {
  return Array.isArray(mockup.project) && mockup.project.includes(projectKey);
}

/** Emoji + one-line plain-language blurb per area — used by the Explore landing page
 *  so non-developers can orient by what the area does, not by its folder name. */
export const categoryIcons = {
  'admin-config': '⚙️', 'analyzer-integration': '🔬', 'blood-bank': '🩸',
  'inventory': '📦', 'microbiology': '🦠', 'nce': '⚠️', 'notifications': '🔔',
  'pathology': '🔬', 'quality': '✅', 'results-validation': '📋', 'reports': '📄',
  'patient': '🧑', 'sample-collection': '🧪', 'vector-surveillance': '🦟',
  'system': '🛠️', 'other': '📁',
};
export const categoryBlurbs = {
  'admin-config': 'Set up the lab — test catalog, users, reference data, labels.',
  'analyzer-integration': 'Connect instruments and map their results into OpenELIS.',
  'blood-bank': 'Blood donation and transfusion workflows.',
  'inventory': 'Track reagents, supplies and stock levels.',
  'microbiology': 'Cultures, susceptibility testing (AST) and AMR surveillance.',
  'nce': 'Non-conformance events and corrective actions.',
  'notifications': 'Alerts and critical-result notifications.',
  'pathology': 'Histology and cytology case review.',
  'quality': 'Quality control, EQA and proficiency testing.',
  'results-validation': 'Enter, review and validate patient results.',
  'reports': 'Printable results, certificates and summaries.',
  'patient': 'Patient registration and records.',
  'sample-collection': 'Order entry and specimen collection.',
  'vector-surveillance': 'Vector specimen testing and surveillance.',
  'system': 'Cross-cutting platform features — audit, help, assistant.',
  'other': 'Designs not yet sorted into a module.',
};

/** Design-code prefixes used in mockup names (e.g. "M-04", "S-03c", "V-01"). */
export const codePrefixes = {
  'M': 'Microbiology / AMR module spec',
  'S': 'Standards & Environmental module spec',
  'V': 'Vector Surveillance module spec',
  'F': 'Foundational / cross-cutting spec',
  'OGC': 'OpenELIS Global Jira ticket',
};

/** Plain-language glossary for non-developer browsers. Grouped for the modal. */
export const glossary = [
  { group: 'Design codes', terms: [
    { term: 'M-##', def: 'Microbiology / AMR module spec (e.g. M-04 Case Workbench).' },
    { term: 'S-##', def: 'Standards & Environmental module spec.' },
    { term: 'V-##', def: 'Vector Surveillance module spec.' },
    { term: 'OGC-####', def: 'A Jira ticket in the OpenELIS Global project.' },
    { term: 'FRS', def: 'Functional Requirements Specification — the formal write-up of a feature.' },
  ]},
  { group: 'Antimicrobial resistance (AMR)', terms: [
    { term: 'AMR', def: 'Antimicrobial Resistance — when microbes stop responding to drugs.' },
    { term: 'AST', def: 'Antimicrobial Susceptibility Testing — testing which drugs still work on an isolate.' },
    { term: 'MIC', def: 'Minimum Inhibitory Concentration — lowest drug concentration that stops growth (µg/mL).' },
    { term: 'S / I / R', def: 'Susceptible / Intermediate / Resistant — the interpreted AST result.' },
    { term: 'Breakpoint', def: 'The MIC/zone cutoff that turns a measurement into S, I, or R.' },
    { term: 'Antibiogram', def: 'A cumulative report of % susceptibility for each bug–drug pair.' },
    { term: 'Isolate', def: 'A single organism grown (isolated) from a patient specimen.' },
    { term: 'CLSI / EUCAST', def: 'The two standards bodies that publish breakpoint tables.' },
    { term: 'WHONET / GLASS', def: 'WHO tools/system for AMR surveillance data and global reporting.' },
  ]},
  { group: 'Lab & quality', terms: [
    { term: 'LIMS', def: 'Laboratory Information Management System — what OpenELIS is.' },
    { term: 'QC', def: 'Quality Control — running known samples to verify the test is working.' },
    { term: 'EQA', def: 'External Quality Assessment — proficiency testing against other labs.' },
    { term: 'TAT', def: 'Turn-Around Time — how long a test takes from order to result.' },
    { term: 'NCE', def: 'Non-Conformance Event — a logged deviation from procedure.' },
    { term: 'FHIR / HL7 / LOINC', def: 'Health-data interoperability standards for exchanging results and codes.' },
  ]},
];

/** Map a mockup name to a short code-prefix explanation, or null if it has no code. */
export function explainCode(name) {
  const m = /^([A-Z]{1,3})-[A-Z0-9]+[a-z]?\b/.exec(name || '');
  if (!m) return null;
  return codePrefixes[m[1]] || null;
}

/**
 * Guided journeys — curated, narrated step-throughs that sequence existing mockups
 * into a full workflow. Steps reference mockups by their exact registry `name`.
 * (Microbiology has its own richer HTML walkthrough, surfaced separately.)
 */
export const JOURNEYS = [
  {
    id: 'environmental-standards',
    icon: '🌱',
    title: 'Environmental & Standards',
    blurb: 'From defining a regulatory standard through an environmental sample to a compliance report.',
    steps: [
      { name: 'Compliance Standards Administration', blurb: 'Where the lab defines the regulatory standards it tests against — each with its analytes, units, and the limit a result must fall within. Everything downstream (order routing, pass/fail evaluation, the certificate) keys off what is configured here, so this is the natural starting point.' },
      { name: 'Sampling Site Registry', blurb: 'Environmental samples come from places, not patients. This registers the non-patient sampling sites — rivers, wells, treatment plants, facility rooms — so each sample can be tied to a known location and its history instead of a person.' },
      { name: 'Environmental Order Entry (v2)', blurb: 'The intake screen for a non-patient sample: choose the site, the applicable standard, and the tests to run. It is the environmental analogue of patient order entry, adapted for site-based, regulation-scoped sampling.' },
      { name: 'Results Entry — Expanded Uncertainty (U) Capture', blurb: 'Techs enter the measured values and, for accredited tests, the expanded measurement uncertainty (U) required by ISO/IEC 17025 §7.8. Capturing U here lets it flow straight onto the final certificate.' },
      { name: 'Environmental QC Rules', blurb: 'Before results are trusted, QC is evaluated against the configured rules. Violations are flagged so the run can be reviewed or repeated rather than reported blindly.' },
      { name: 'Compliance Evaluation Engine', blurb: 'The engine compares each result to its standard’s limit and assigns a compliant / non-compliant verdict. This determination is what the report ultimately certifies.' },
      { name: 'Environmental Dashboard & Trend Analysis', blurb: 'A monitoring surface across sites and over time — positivity, exceedances, and trends — so a program can spot problems that a single sample would never reveal.' },
      { name: 'Laporan Hasil — Compliance Report', blurb: 'The formal output: the Sertifikat Hasil Uji (certificate of analysis) reporting each result against its limit, with uncertainty and the compliance verdict, ready to issue.' },
    ],
  },
  {
    id: 'vector-surveillance',
    icon: '🦟',
    title: 'Vector Surveillance',
    blurb: 'Mosquito / vector specimens from field collection through identification to surveillance reporting.',
    steps: [
      { name: 'Vector Specimen Types & Taxonomy', blurb: 'The reference data the whole module rests on: the vector species and the specimen taxonomy (genus/species, life stage). Identification and reporting later draw from this controlled vocabulary, so it is configured first.' },
      { name: 'Vector Collection Workflow (v2)', blurb: 'Records a field collection event — trap, location, date, conditions — and the specimens it yielded. This is where a batch of field-caught vectors enters the system as trackable items rather than loose field notes.' },
      { name: 'Vector Testing & Identification', blurb: 'The workbench where collected specimens are identified to species and run through vector tests (e.g. pathogen detection). Results attach back to the collection event so they stay tied to where and when they were caught.' },
      { name: 'Vector Surveillance Reporting', blurb: 'Aggregates identifications and test results into surveillance indicators — abundance, infection rates, distribution — the numbers a vector-control program actually acts on.' },
      { name: 'Vector LHU', blurb: 'The vector results report (Laporan Hasil Uji) that packages the findings for the requesting program or public-health authority.' },
    ],
  },
  {
    id: 'test-catalog-setup',
    icon: '⚙️',
    title: 'Test Catalog Setup',
    blurb: 'Admin journey: build a test end-to-end — definition, ranges, workflow type, and reagents.',
    steps: [
      { name: 'Test Catalog', blurb: 'The home of every test the lab offers. Start here to browse the catalog and pick (or create) the test you want to configure end-to-end.' },
      { name: 'Test Catalog v2.5 — v1 Preview', blurb: 'The unified editor where a test is actually defined — its name, sample types, result type, and behavior. This single consolidated screen replaces the old scattered admin pages.' },
      { name: 'Reporting Ranges by Method', blurb: 'Reference and reporting ranges depend on the method used to run a test. Here you set those ranges per method so a result is interpreted (normal / abnormal / critical) correctly.' },
      { name: 'Test Catalog — Microbiology Workflow Attribute', blurb: 'A test can carry a workflow type that routes it down a specialized path — for example bacterial culture vs TB in the AMR module. This is where that attribute is set on the test.' },
      { name: 'M-12 Test to Reagent Linkage', blurb: 'Declares which reagent lots a test requires — the ISO 15189 §7.3 traceability link between a result and the materials that produced it. Microbiology forces the issue, but it is a general OpenELIS foundation.' },
      { name: 'Reagent Usage on Result Entry v2.1', blurb: 'Closes the loop: shows how the reagent lots declared above surface to the tech during result entry, so actual usage is captured against each result.' },
    ],
  },
];

/** Find a registry entry by its exact name (used by guided journeys). */
export function findMockupByName(name) {
  return MOCKUP_REGISTRY.find((m) => m.name === name) || null;
}

/** Resolve a "#/journey/<id>" hash to a journey, or null. */
export function journeyFromHash(hash) {
  const m = /^#\/?journey\/([\w-]+)/.exec(hash || '');
  if (!m) return null;
  return JOURNEYS.find((j) => j.id === m[1]) || null;
}

/** Determine entry type for visual distinction */
export function getEntryType(mockup) {
  if (mockup.htmlUrl) return 'html';
  if (mockup.component) return 'jsx';
  if (mockup.figmaUrl) return 'figma';
  return 'spec';
}

/**
 * Path to a card thumbnail (captured by scripts/capture-thumbnails.mjs) for HTML
 * prototypes. Returns null for entries without an HTML mockup; the <img> hides
 * itself on error, so a missing file just falls back to the text card.
 */
export function thumbUrl(mockup) {
  if (!mockup || !mockup.htmlUrl) return null;
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  return base + 'thumbnails/' + mockup.category + '__' + toSlug(mockup.name) + '.jpg';
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

/**
 * Permalink aliases — keep published permalinks resolving after a design is
 * archived/superseded (old links may be cited in Jira/Confluence). Maps an old
 * category/slug path to the current replacement card's category/slug path.
 * Added 2026-06-26 when the old single-screen micro mocks were folded into the
 * consolidated interactive prototypes.
 */
const PERMALINK_ALIASES = {
  'microbiology/m-04-case-workbench-core-case-detail': 'microbiology/m-04-case-workbench-interactive-prototype',
  'microbiology/m-05-ast-entry-interpretation': 'microbiology/m-05-ast-entry-interactive-prototype',
  'microbiology/m-07-ast-worklist': 'microbiology/m-07-worklist-interactive-prototype',
  'microbiology/m-11-critical-result-acknowledgment': 'microbiology/m-11-critical-notification-inline',
};

/** Find a mockup by its hash path (e.g. "pathology/cytology-case-view") */
export function findMockupByHash(hash) {
  // strip leading #/ or #
  let path = hash.replace(/^#\/?/, '');
  if (!path) return null;
  if (PERMALINK_ALIASES[path]) path = PERMALINK_ALIASES[path];
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
  if (parts[0] === 'project' && parts[1]) {
    const projectKey = parts[1];
    let mockup = null;
    if (parts.length >= 4) {
      const cat = parts[2];
      const slug = parts.slice(3).join('/');
      mockup = MOCKUP_REGISTRY.find(m => m.category === cat && toSlug(m.name) === slug) || null;
    }
    return { mode: 'project', project: projectKey, mockup };
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
          <JsxMockupPreview mockup={mockup} fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading mockup...</div>} />
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

/**
 * Explore landing page — the default (home) view for non-developer browsers.
 * Orients by area with plain-language blurbs + counts, surfaces guided journeys,
 * and shows the newest designs. Any search / filter / category switches back to
 * the flat grid.
 */
function LandingView({ t, darkMode, onPickCategory, onOpen, statusOf, journeys = [], onOpenJourney }) {
  const counts = {};
  MOCKUP_REGISTRY.forEach((m) => { counts[m.category] = (counts[m.category] || 0) + 1; });
  const cats = categories.filter((c) => c !== 'all' && counts[c]);
  const walkthroughs = MOCKUP_REGISTRY.filter((m) => m.tags && m.tags.includes('walkthrough'));
  const recent = [...MOCKUP_REGISTRY]
    .sort((a, b) => (b.added || DEFAULT_ADDED).localeCompare(a.added || DEFAULT_ADDED))
    .slice(0, 6);

  const sectionTitle = { fontSize: 18, fontWeight: 600, margin: '30px 0 12px', color: t.text };
  const tile = {
    textAlign: 'left', cursor: 'pointer', border: `1px solid ${t.border}`, borderRadius: 10,
    padding: 16, background: t.cardBg, boxShadow: t.cardShadow,
    transition: 'box-shadow .2s, transform .1s', font: 'inherit', color: 'inherit',
  };
  const hoverIn = (e) => { e.currentTarget.style.boxShadow = t.cardShadowHover; e.currentTarget.style.transform = 'translateY(-1px)'; };
  const hoverOut = (e) => { e.currentTarget.style.boxShadow = t.cardShadow; e.currentTarget.style.transform = 'none'; };

  return (
    <div>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: t.textSecondary, margin: '4px 0 0', maxWidth: 760 }}>
        Welcome to the OpenELIS design gallery. Browse by area below, follow a guided journey through a
        full workflow, or jump to the newest designs. You can search and filter from the bar above any time.
      </p>

      {(journeys.length > 0 || walkthroughs.length > 0) && (
        <>
          <div style={sectionTitle}>🧭 Guided journeys</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {journeys.map((j) => (
              <button key={j.id} onClick={() => onOpenJourney && onOpenJourney(j)} onMouseEnter={hoverIn} onMouseLeave={hoverOut}
                style={{ ...tile, borderLeft: `4px solid ${t.accent}` }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>
                  <span style={{ marginRight: 6 }}>{j.icon}</span>{j.title}
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: t.textMuted, background: t.badgeBg, borderRadius: 10, padding: '1px 8px' }}>{j.steps.length} steps</span>
                </div>
                <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.45 }}>{j.blurb}</div>
              </button>
            ))}
            {walkthroughs.map((m, i) => (
              <button key={'w' + i} onClick={() => onOpen(m)} onMouseEnter={hoverIn} onMouseLeave={hoverOut}
                style={{ ...tile, borderLeft: `4px solid ${t.accent}` }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: t.text, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.45 }}>{m.description}</div>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={sectionTitle}>Browse by area</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {cats.map((c) => (
          <button key={c} onClick={() => onPickCategory(c)} onMouseEnter={hoverIn} onMouseLeave={hoverOut} style={tile}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{categoryIcons[c] || '📁'}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, background: t.badgeBg, borderRadius: 12, padding: '2px 9px' }}>{counts[c]}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{categoryLabels[c] || c}</div>
            <div style={{ fontSize: 12.5, color: t.textSecondary, lineHeight: 1.45, marginTop: 3 }}>{categoryBlurbs[c] || ''}</div>
          </button>
        ))}
      </div>

      <div style={sectionTitle}>🆕 Recently added</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {recent.map((m, i) => {
          const st = statusConfig[statusOf(m)];
          const desc = m.description || '';
          return (
            <button key={i} onClick={() => onOpen(m)} onMouseEnter={hoverIn} onMouseLeave={hoverOut} style={tile}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: t.textMuted }}>{categoryLabels[m.category]}</span>
                <span style={{ fontSize: 11, color: t.textFaint }}>{formatDate(m.added || DEFAULT_ADDED)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text, marginBottom: 3 }}>{m.name}</div>
              <div style={{ fontSize: 12.5, color: t.textSecondary, lineHeight: 1.4 }}>{desc.slice(0, 110)}{desc.length > 110 ? '…' : ''}</div>
              {st && <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: darkMode ? st.darkBg : st.bg, color: st.color, border: `1px solid ${st.color}44` }}>{st.icon} {st.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Guided journey stepper — narrates a workflow one step at a time, embedding the
 * referenced mockup with Prev/Next and a clickable step list.
 */
function JourneyView({ journey, t, darkMode, onExit, onOpenMockup }) {
  const [idx, setIdx] = React.useState(0);
  const step = journey.steps[idx];
  const mockup = findMockupByName(step.name);
  const total = journey.steps.length;
  const code = mockup && explainCode(mockup.name);

  return (
    <div>
      <button onClick={onExit} style={{ ...styles.backButton, color: t.accent }}>← Back to Gallery</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 24 }}>{journey.icon}</span>
        <h2 style={{ margin: 0, color: t.text }}>{journey.title}</h2>
        <span style={{ ...styles.badge, background: t.badgeBg, color: t.textSecondary }}>Journey</span>
      </div>
      <p style={{ color: t.textSecondary, margin: '0 0 14px', fontSize: 14 }}>{journey.blurb}</p>

      {/* progress dots / step list */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {journey.steps.map((s, i) => (
          <button key={i} onClick={() => setIdx(i)} title={s.name}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 14, cursor: 'pointer', whiteSpace: 'nowrap',
              border: '1px solid ' + (i === idx ? t.accent : t.border),
              background: i === idx ? t.accent : (i < idx ? (darkMode ? '#1a3320' : '#defbe6') : t.cardBg),
              color: i === idx ? '#fff' : t.textSecondary, fontWeight: i === idx ? 600 : 500,
            }}>
            {i + 1}
          </button>
        ))}
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.cardBg, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: t.textMuted, marginBottom: 4 }}>STEP {idx + 1} OF {total}</div>
        <div style={{ fontSize: 17, fontWeight: 600, color: t.text, marginBottom: 4 }}>{step.name}</div>
        <p style={{ margin: 0, fontSize: 14, color: t.textSecondary, lineHeight: 1.5 }}>{step.blurb}</p>
        {code && <p style={{ margin: '6px 0 0', fontSize: 12, color: t.textMuted }}>{mockup.name.match(/^[A-Z]{1,3}-[A-Z0-9]+[a-z]?/)?.[0]} — {code}</p>}
        {mockup && (
          <button onClick={() => onOpenMockup(mockup)} style={{ marginTop: 8, background: 'none', border: 'none', padding: 0, color: t.accent, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            Open this mockup on its own →
          </button>
        )}
      </div>

      {/* embedded mockup */}
      <div style={{ ...styles.preview, background: t.previewBg, borderColor: t.border, padding: 0 }}>
        {mockup && mockup.htmlUrl ? (
          <iframe
            src={import.meta.env.BASE_URL + mockup.htmlUrl}
            style={{ ...styles.figmaIframe, height: 720, borderColor: t.border }}
            allowFullScreen
            title={step.name}
          />
        ) : (
          <div style={{ ...styles.loading, color: t.textMuted }}>
            {mockup ? 'This step is a spec — open it to read the document.' : `Mockup not found: ${step.name}`}
          </div>
        )}
      </div>

      {/* prev / next */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
          style={{ ...styles.permalinkButton, background: t.permalinkBg, color: t.permalinkColor, opacity: idx === 0 ? 0.5 : 1, cursor: idx === 0 ? 'default' : 'pointer', padding: '8px 16px' }}>
          ← Previous
        </button>
        <button onClick={() => setIdx((i) => Math.min(total - 1, i + 1))} disabled={idx === total - 1}
          style={{ background: idx === total - 1 ? t.badgeBg : t.accent, color: idx === total - 1 ? t.textMuted : '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: idx === total - 1 ? 'default' : 'pointer' }}>
          Next →
        </button>
      </div>
    </div>
  );
}

function App() {
  // ─── Standalone route detection ───
  const [routeMode, setRouteMode] = useState(() => parseRoute(window.location.hash).mode);
  const [routeMockup, setRouteMockup] = useState(() => parseRoute(window.location.hash).mockup);
  const [routeProject, setRouteProject] = useState(() => parseRoute(window.location.hash).project || null);

  useEffect(() => {
    function onHashChange() {
      const route = parseRoute(window.location.hash);
      setRouteMode(route.mode);
      setRouteMockup(route.mockup);
      setRouteProject(route.project || null);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Customer-facing project showcase (clean, no internal chrome)
  if (routeMode === 'project' && routeProject) {
    return <ProjectShowcase projectKey={routeProject} initialMockup={routeMockup} />;
  }

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
  const [activeProject, setActiveProject] = useState('all'); // 'all' or a project key
  const [showArchived, setShowArchived] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
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

  // Home (Explore landing) vs browse grid. Starts on home unless deep-linked to a mockup.
  const [home, setHome] = useState(() => !findMockupByHash(window.location.hash) && !journeyFromHash(window.location.hash));
  const [activeJourney, setActiveJourney] = useState(() => journeyFromHash(window.location.hash));

  // On mount, check if the URL hash points to a mockup or a journey
  useEffect(() => {
    const mockup = findMockupByHash(window.location.hash);
    if (mockup) {
      setSelectedMockup(mockup);
      setActiveCategory(mockup.category);
      setHome(false);
    } else if (journeyFromHash(window.location.hash)) {
      setHome(false);
    }
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    function onHashChange() {
      const mockup = findMockupByHash(window.location.hash);
      const journey = journeyFromHash(window.location.hash);
      setSelectedMockup(mockup);
      setActiveJourney(journey);
      if (mockup) { setActiveCategory(mockup.category); setHome(false); }
      else if (journey) { setHome(false); }
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Helper to select a mockup and update the URL hash
  function selectMockup(mockup) {
    setSelectedMockup(mockup);
    setDetailTab('preview'); // Reset tab when switching entries
    if (mockup) {
      setActiveJourney(null);
      setHome(false);
      window.location.hash = toHash(mockup);
    } else {
      // Clear hash when going back to gallery
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }

  function selectJourney(journey) {
    setSelectedMockup(null);
    setActiveJourney(journey);
    setHome(false);
    window.location.hash = journey ? `#/journey/${journey.id}` : '';
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
    const matchesArchived = showArchived ? true : !m.archived;
    const matchesProject = activeProject === 'all' || inProject(m, activeProject);
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
    return matchesArchived && matchesProject && matchesCategory && matchesStatus && matchesTag && matchesSearch;
  });

  const archivedCount = MOCKUP_REGISTRY.filter((m) => m.archived).length;
  const activeCount = MOCKUP_REGISTRY.length - archivedCount;
  const visibleForCounts = MOCKUP_REGISTRY.filter((m) => (showArchived ? true : !m.archived));
  const countByCategory = {};
  visibleForCounts.forEach((m) => {
    countByCategory[m.category] = (countByCategory[m.category] || 0) + 1;
  });

  // Default "home" view shows the Explore landing page (decoupled from the "All" tab,
  // so the All tab still shows the full flat grid).
  const isHome = home;
  function goHome() {
    setActiveCategory('all');
    setSearchQuery('');
    setActiveTag(null);
    setStatusFilter('all');
    selectMockup(null);
    setHome(true);
  }

  // Also update body background when theme changes
  useEffect(() => {
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
    document.body.style.transition = 'background 0.2s, color 0.2s';
  }, [darkMode, t.bg, t.text]);

  return (
    <div style={{ ...styles.container, background: t.bg, color: t.text }} data-theme={darkMode ? 'dark' : 'light'}>
      {glossaryOpen && (
        <div
          onClick={() => setGlossaryOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: t.cardBg, color: t.text, border: `1px solid ${t.border}`, borderRadius: 12, maxWidth: 640, width: '100%', padding: 24, boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 20, color: t.text }}>Glossary</h2>
              <button onClick={() => setGlossaryOpen(false)} aria-label="Close glossary"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: t.textMuted }}>×</button>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 13, color: t.textSecondary }}>
              Quick decoder for the design codes and lab acronyms used across the gallery.
            </p>
            {glossary.map((g) => (
              <div key={g.group} style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: t.accent, marginBottom: 6 }}>{g.group}</div>
                <dl style={{ margin: 0 }}>
                  {g.terms.map((tm) => (
                    <div key={tm.term} style={{ display: 'flex', gap: 12, padding: '5px 0', borderTop: `1px solid ${t.border}` }}>
                      <dt style={{ flex: '0 0 120px', fontWeight: 600, fontSize: 13, color: t.text }}>{tm.term}</dt>
                      <dd style={{ margin: 0, fontSize: 13, color: t.textSecondary, lineHeight: 1.45 }}>{tm.def}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
      <header style={{ ...styles.header, borderBottomColor: t.headerBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1
              style={{ ...styles.title, color: t.text, cursor: 'pointer' }}
              onClick={goHome}
              title="Back to the Explore home"
            >OpenELIS Global — Design Gallery</h1>
            <p style={{ ...styles.subtitle, color: t.textMuted }}>
              {activeCount} mockups across {Object.keys(countByCategory).length} categories{archivedCount ? ` · ${archivedCount} archived` : ''}
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
            onChange={(e) => { setSearchQuery(e.target.value); setActiveTag(null); setHome(false); }}
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
        {projects.length > 0 && (
          <select
            value={activeProject}
            onChange={(e) => { setActiveProject(e.target.value); selectMockup(null); setHome(false); }}
            style={{ ...styles.statusSelect, background: t.searchBg, borderColor: t.borderInput, color: t.text }}
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p} value={p}>{projectConfig[p].short} — {projectLabels[p]}</option>
            ))}
          </select>
        )}
        {activeProject !== 'all' && (
          <a
            href={`#/project/${activeProject}`}
            style={{ ...styles.statusSelect, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', background: t.accent, color: '#fff', borderColor: t.accent, fontWeight: 600, whiteSpace: 'nowrap' }}
            title="Open the clean, shareable customer view for this project"
          >
            Open customer view →
          </a>
        )}
        <button
          onClick={() => { setShowArchived((v) => !v); setHome(false); }}
          style={{ ...styles.statusSelect, cursor: 'pointer', background: showArchived ? t.accent : t.searchBg, color: showArchived ? '#fff' : t.text, borderColor: showArchived ? t.accent : t.borderInput, whiteSpace: 'nowrap' }}
          title="Show or hide archived (completed/retired) mockups"
          aria-label="Toggle archived mockups"
          aria-pressed={showArchived}
        >
          {showArchived ? '✓ ' : ''}Archived{archivedCount ? ` (${archivedCount})` : ''}
        </button>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setHome(false); }}
          style={{ ...styles.statusSelect, background: t.searchBg, borderColor: t.borderInput, color: t.text }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {statusKeys.map((key) => (
            <option key={key} value={key}>{statusConfig[key].icon} {statusConfig[key].label}</option>
          ))}
        </select>
        <button
          onClick={() => setGlossaryOpen(true)}
          style={{ ...styles.statusSelect, background: t.searchBg, borderColor: t.borderInput, color: t.text, cursor: 'pointer', whiteSpace: 'nowrap' }}
          title="Decode the M-/S-/V- codes and lab acronyms"
          aria-label="Open glossary"
        >
          ❔ Glossary
        </button>
        <div style={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); selectMockup(null); setHome(false); }}
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
              {cat === 'all' ? ` (${visibleForCounts.length})` : ''}
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
          {explainCode(selectedMockup.name) && (
            <p style={{ margin: '-8px 0 16px', fontSize: 13, color: t.textMuted }}>
              <button onClick={() => setGlossaryOpen(true)} style={{ background: 'none', border: 'none', padding: 0, color: t.accent, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}>
                {selectedMockup.name.match(/^[A-Z]{1,3}-[A-Z0-9]+[a-z]?/)[0]}
              </button>
              {' — '}{explainCode(selectedMockup.name)}.
            </p>
          )}
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
            // Walkthroughs are full-page HTML flows with their own left rail; give them
            // near-full-viewport width + height so the rail and embedded mockup both fit.
            const isWalkthrough = !!(selectedMockup.htmlUrl && selectedMockup.tags && selectedMockup.tags.includes('walkthrough'));
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
                <div style={{ ...styles.preview, background: t.previewBg, borderColor: t.border, ...(isWalkthrough && activeTab === 'preview' ? styles.previewWide : {}) }}>
                  {activeTab === 'discussion' && hasDiscussion ? (
                    <CommentViewer issueNumber={selectedMockup.githubIssue} darkMode={darkMode} theme={t} designName={selectedMockup.name} />
                  ) : activeTab === 'spec' && hasSpec ? (
                    <SpecViewer specPath={selectedMockup.specPath} />
                  ) : selectedMockup.htmlUrl ? (
                    <div style={{ ...styles.figmaEmbed, ...(isWalkthrough ? { width: '100%' } : {}) }}>
                      <iframe
                        src={import.meta.env.BASE_URL + selectedMockup.htmlUrl}
                        style={{ ...styles.figmaIframe, height: isWalkthrough ? '86vh' : 800, minHeight: isWalkthrough ? 820 : undefined, borderColor: t.border, borderRadius: isWalkthrough ? 0 : 8 }}
                        allowFullScreen
                        title={selectedMockup.name}
                      />
                    </div>
                  ) : selectedMockup.component ? (
                    <JsxMockupPreview mockup={selectedMockup} fallback={<div style={{ ...styles.loading, color: t.textMuted }}>Loading mockup...</div>} />
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
      ) : activeJourney ? (
        <JourneyView
          journey={activeJourney}
          t={t}
          darkMode={darkMode}
          onExit={() => { setActiveJourney(null); goHome(); }}
          onOpenMockup={(m) => selectMockup(m)}
        />
      ) : isHome ? (
        <LandingView
          t={t}
          darkMode={darkMode}
          journeys={JOURNEYS}
          onOpenJourney={selectJourney}
          onPickCategory={(c) => { setActiveCategory(c); selectMockup(null); setHome(false); }}
          onOpen={(m) => selectMockup(m)}
          statusOf={getEffectiveStatus}
        />
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
                {thumbUrl(mockup) && (
                  <div style={{ margin: '-16px -16px 12px', overflow: 'hidden', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottom: `1px solid ${t.border}`, background: t.previewBg, aspectRatio: '1000 / 480' }}>
                    <img
                      src={thumbUrl(mockup)}
                      alt=""
                      loading="lazy"
                      onError={(e) => { const p = e.currentTarget.parentElement; if (p) p.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
                    />
                  </div>
                )}
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
                        onClick={(e) => { e.stopPropagation(); setActiveTag(activeTag === tag ? null : tag); setSearchQuery(''); setHome(false); }}
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
  // Full-bleed wrapper for walkthrough previews: breaks out of the 1200px container to ~96vw.
  previewWide: { padding: 0, minHeight: 820, overflow: 'hidden', borderRadius: 8, position: 'relative', left: '50%', width: '96vw', marginLeft: '-48vw' },
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
  // No hardcoded color: the .spec-content CSS (incl. [data-theme="dark"] overrides) and
  // inherited theme color handle text. Setting color here would override the dark-mode CSS
  // and make body text/tables render near-black on the dark background.
  specContent: { padding: '8px 0', fontSize: 14, lineHeight: 1.7, maxWidth: 800 },
  specError: { padding: 24, textAlign: 'center', color: '#6f6f6f' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: '1px solid' },
  statusSelect: { padding: '8px 12px', border: '1px solid #c6c6c6', borderRadius: 4, fontSize: 14, cursor: 'pointer' },
};

// ─── Customer-facing Project Showcase ────────────────────────────
// Clean, shareable view scoped to one project. Deliberately hides all
// internal chrome: Jira keys, draft/review status, GitHub discussion.
function ProjectShowcase({ projectKey, initialMockup }) {
  const cfg = projectConfig[projectKey];
  const [darkMode, setDarkMode] = useState(false);
  const [selected, setSelected] = useState(initialMockup || null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTab, setDetailTab] = useState('preview');
  const t = darkMode ? themes.dark : themes.light;

  const items = MOCKUP_REGISTRY.filter((m) => inProject(m, projectKey) && !m.archived);

  useEffect(() => {
    function onHashChange() {
      const route = parseRoute(window.location.hash);
      setSelected(route.mode === 'project' ? route.mockup : null);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    document.body.style.background = t.bg;
    document.body.style.color = t.text;
  }, [darkMode, t.bg, t.text]);

  function select(m) {
    setSelected(m);
    setDetailTab('preview');
    if (m) {
      window.location.hash = `#/project/${projectKey}/${m.category}/${toSlug(m.name)}`;
    } else {
      window.location.hash = `#/project/${projectKey}`;
    }
  }

  const presentCats = Array.from(new Set(items.map((m) => m.category)));
  const filtered = items.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      m.name.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      categoryLabels[m.category].toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  if (!cfg) {
    return (
      <div style={{ ...styles.container, background: t.bg, color: t.text }} data-theme={darkMode ? 'dark' : 'light'}>
        <p style={{ padding: 40 }}>Unknown project &ldquo;{projectKey}&rdquo;.</p>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, background: t.bg, color: t.text }} data-theme={darkMode ? 'dark' : 'light'}>
      <header style={{ ...styles.header, borderBottomColor: t.headerBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <h1 style={{ ...styles.title, color: t.text }}>OpenELIS Global — {cfg.label} Designs</h1>
            <p style={{ ...styles.subtitle, color: t.textMuted, marginBottom: 4 }}>{cfg.org}</p>
            <p style={{ ...styles.subtitle, color: t.textMuted, maxWidth: 720 }}>{cfg.blurb}</p>
          </div>
          <button
            onClick={() => setDarkMode((p) => !p)}
            style={{ background: t.badgeBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: t.text, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span style={{ fontSize: 16 }}>{darkMode ? '☀️' : '🌙'}</span>
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {selected ? (
        <div>
          <button onClick={() => select(null)} style={{ ...styles.backButton, color: t.accent }}>
            ← Back to {cfg.short} designs
          </button>
          <div style={styles.mockupHeader}>
            <h2 style={{ margin: 0, color: t.text }}>{selected.name}</h2>
            <span style={{ ...styles.badge, background: t.badgeBg, color: t.textSecondary }}>{categoryLabels[selected.category]}</span>
          </div>
          <p style={{ color: t.textMuted, margin: '8px 0 16px', maxWidth: 760 }}>{selected.description}</p>

          {(() => {
            const hasPreview = selected.component || selected.htmlUrl || selected.figmaUrl;
            const hasSpec = !!selected.specPath;
            return (
              <>
                {hasPreview && hasSpec && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button onClick={() => setDetailTab('preview')} style={{ ...styles.tab, background: detailTab === 'preview' ? t.accent : t.tabBg, color: detailTab === 'preview' ? '#fff' : t.text, borderColor: detailTab === 'preview' ? t.accent : t.borderInput }}>Mockup Preview</button>
                    <button onClick={() => setDetailTab('spec')} style={{ ...styles.tab, background: detailTab === 'spec' ? t.accent : t.tabBg, color: detailTab === 'spec' ? '#fff' : t.text, borderColor: detailTab === 'spec' ? t.accent : t.borderInput }}>Spec Document</button>
                  </div>
                )}
                {hasPreview && (hasSpec ? detailTab === 'preview' : true) && (
                  <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                    {selected.htmlUrl ? (
                      <iframe title={selected.name} src={import.meta.env.BASE_URL + selected.htmlUrl} style={{ width: '100%', height: '80vh', border: 'none' }} />
                    ) : selected.component ? (
                      <JsxMockupPreview mockup={selected} fallback={<div style={styles.loading}>Loading preview…</div>} />
                    ) : selected.figmaUrl ? (
                      <iframe title={selected.name} src={selected.figmaUrl.replace('/make/', '/embed/').replace('/file/', '/embed/').replace('/design/', '/embed/')} style={{ width: '100%', height: '80vh', border: 'none' }} allowFullScreen />
                    ) : null}
                  </div>
                )}
                {hasSpec && (!hasPreview || detailTab === 'spec') && (
                  <SpecViewer specPath={selected.specPath} />
                )}
                {!hasPreview && !hasSpec && (
                  <p style={{ color: t.textMuted }}>No preview available for this entry yet.</p>
                )}
              </>
            );
          })()}
        </div>
      ) : (
        <>
          <div style={styles.toolbar}>
            <input
              type="text"
              placeholder="Search these designs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...styles.search, flex: '1 1 220px', minWidth: 0 }}
            />
            <div style={styles.tabs}>
              {['all', ...presentCats].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{ ...styles.tab, background: activeCategory === cat ? t.accent : t.tabBg, color: activeCategory === cat ? '#fff' : t.text, borderColor: activeCategory === cat ? t.accent : t.borderInput }}
                >
                  {cat === 'all' ? `All (${items.length})` : `${categoryLabels[cat]} (${items.filter((m) => m.category === cat).length})`}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ ...styles.empty, color: t.textMuted }}>
              {items.length === 0 ? 'No designs have been published for this project yet.' : 'No designs match your search.'}
            </div>
          ) : (
            <div style={styles.grid}>
              {filtered.map((m, i) => {
                const type = entryTypeConfig[getEntryType(m)];
                return (
                  <div
                    key={i}
                    onClick={() => select(m)}
                    style={{ ...styles.card, background: t.cardBg, borderColor: t.border, boxShadow: t.cardShadow, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ ...styles.badge, background: t.badgeBg, color: t.textSecondary }}>{categoryLabels[m.category]}</span>
                      <span style={{ ...styles.badge, background: darkMode ? type.color + '22' : type.bg, color: type.color }}>{type.label}</span>
                    </div>
                    <h3 style={{ margin: '0 0 6px', color: t.text, fontSize: 16 }}>{m.name}</h3>
                    <p style={{ margin: 0, color: t.textMuted, fontSize: 13, lineHeight: 1.5 }}>{m.description}</p>
                  </div>
                );
              })}
            </div>
          )}

          <footer style={{ marginTop: 40, paddingTop: 16, borderTop: `1px solid ${t.border}`, color: t.textMuted, fontSize: 12 }}>
            {items.length} design{items.length === 1 ? '' : 's'} · OpenELIS Global · University of Washington DIGI
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
