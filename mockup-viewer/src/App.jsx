import React, { useState, useEffect, Suspense } from 'react';

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
function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const MOCKUP_REGISTRY = [
  // ─── Admin & Configuration ───
  {
    name: 'Data Dictionary',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/data-dictionary.jsx')),
    description: 'Data dictionary management interface',
    specPath: 'designs/admin-config/data-dictionary.md',
  },
  {
    name: 'Lab Units',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/lab-units.jsx')),
    description: 'Laboratory units configuration',
    specPath: 'designs/admin-config/lab-units.md',
  },
  {
    name: 'Methods',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/methods.jsx')),
    description: 'Test methods management',
    specPath: 'designs/admin-config/methods.md',
  },
  {
    name: 'Organizations Management',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/organizations-management.jsx')),
    description: 'Organizations and referring facilities management',
    specPath: 'designs/admin-config/organizations-management.md',
  },
  {
    name: 'Panel',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/panel.jsx')),
    description: 'Test panel configuration',
    specPath: 'designs/admin-config/panel.md',
  },
  {
    name: 'Range Editor',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/range-editor.jsx')),
    description: 'Normal range editor for test results',
    specPath: 'designs/admin-config/range-editor.md',
  },
  {
    name: 'Result Options',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/result-options.jsx')),
    description: 'Result options (dictionary values) management',
    specPath: 'designs/admin-config/result-options.md',
  },
  {
    name: 'Test Catalog',
    category: 'admin-config',
    component: React.lazy(() => import('@designs/admin-config/test-catalog.jsx')),
    description: 'Comprehensive test catalog management',
    specPath: 'designs/admin-config/test-catalog.md',
  },

  // ─── Analyzer Integration ───
  {
    name: 'Analyzer File Upload',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/analyzer-file-upload.jsx')),
    description: 'Upload and process analyzer result files',
    specPath: 'designs/analyzer-integration/analyzer-file-upload.md',
  },
  {
    name: 'Analyzer Mapping Templates',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/analyzer-mapping-templates.jsx')),
    description: 'Configure analyzer-to-test mapping templates',
    specPath: 'designs/analyzer-integration/astm-analyzer-mapping-addendum.md',
  },
  {
    name: 'Flat File Analyzer Config',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/flat-file-analyzer-config.jsx')),
    description: 'Configure flat file (CSV/TSV) analyzer parsers',
    specPath: 'designs/analyzer-integration/flat-file-analyzer-config.md',
  },
  {
    name: 'HL7 Analyzer Mapping',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/hl7-analyzer-mapping.jsx')),
    description: 'HL7 message field mapping for analyzers',
    specPath: 'designs/analyzer-integration/hl7-analyzer-mapping-addendum.md',
  },
  {
    name: 'Validation Page (Analyzer)',
    category: 'analyzer-integration',
    component: React.lazy(() => import('@designs/analyzer-integration/validation-page.jsx')),
    description: 'Analyzer result validation workflow',
    specPath: 'designs/analyzer-integration/validation-page.md',
  },

  // ─── Microbiology ───
  {
    name: 'AMR Module',
    category: 'microbiology',
    component: React.lazy(() => import('@designs/microbiology/amr-module.jsx')),
    description: 'Antimicrobial resistance testing and reporting module',
    specPath: 'designs/microbiology/amr-module.md',
  },

  // ─── NCE ───
  {
    name: 'NCE Analytics',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-analytics.jsx')),
    description: 'Non-conforming event analytics dashboard',
    specPath: 'designs/nce/nce-analytics.md',
  },
  {
    name: 'NCE Dashboard & CAPA',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-dashboard.jsx')),
    description: 'NCE dashboard with CAPA tracking',
    specPath: 'designs/nce/nce-dashboard.md',
  },
  {
    name: 'NCE Results Entry',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-results-entry.jsx')),
    description: 'NCE investigation results entry form',
    specPath: 'designs/nce/nce-results-entry.md',
  },
  {
    name: 'NCE Report',
    category: 'nce',
    component: React.lazy(() => import('@designs/nce/nce-report.jsx')),
    description: 'Non-conformity report generation',
    specPath: 'designs/nce/nce-report.md',
  },

  // ─── Pathology ───
  {
    name: 'Pathology Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/pathology-case-view.jsx')),
    description: 'Pathology case view and reporting redesign',
    specPath: 'designs/pathology/pathology-case-view.md',
  },
  {
    name: 'IHC Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/ihc-case-view.jsx')),
    description: 'Immunohistochemistry case view and scoring',
    specPath: 'designs/pathology/ihc-case-view.md',
  },

  {
    name: 'Cytology Case View',
    category: 'pathology',
    component: React.lazy(() => import('@designs/pathology/cytology-case-view.jsx')),
    description: 'Cytology case view with Bethesda System wizard workflow',
    specPath: 'designs/pathology/cytology-case-view.md',
  },

  // ─── Quality & EQA ───
  {
    name: 'EQA Enrollment',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/eqa-enrollment.jsx')),
    description: 'EQA program enrollment, self-enrollment, and provider management',
    specPath: 'designs/quality/eqa-enrollment-addendum.md',
  },

  {
    name: 'Westgard Dashboard',
    category: 'quality',
    component: React.lazy(() => import('@designs/quality/westgard-dashboard.jsx')),
    description: 'Laboratory Instrument Compliance Dashboard with Westgard QC rules',
    specPath: 'designs/quality/westgard-rules.md',
  },

  // ─── Results & Validation ───
  {
    name: 'Results Page',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/results-page.jsx')),
    description: 'Main results entry and review page',
    specPath: 'designs/results-validation/results-page.md',
  },
  {
    name: 'Validation Page',
    category: 'results-validation',
    component: React.lazy(() => import('@designs/results-validation/validation-page.jsx')),
    description: 'Result validation workflow',
    specPath: 'designs/results-validation/validation-page.md',
  },

  // ─── System ───
  {
    name: 'Audit Trail',
    category: 'system',
    component: React.lazy(() => import('@designs/system/audit-trail.jsx')),
    description: 'System audit trail viewer',
    specPath: 'designs/system/audit-trail.md',
  },
  {
    name: 'Help Menu',
    category: 'system',
    component: React.lazy(() => import('@designs/system/help-menu.jsx')),
    description: 'In-app help menu and documentation links',
    specPath: 'designs/system/help-menu.md',
  },
  {
    name: 'Analyzer Import',
    category: 'system',
    component: React.lazy(() => import('@designs/system/analyzer-import.jsx')),
    description: 'Bulk analyzer configuration import',
    specPath: 'designs/system/analyzer-import.md',
  },

  // ─── Other ───
  {
    name: 'TAT Dashboard',
    category: 'other',
    component: React.lazy(() => import('@designs/other/tat-dashboard.jsx')),
    description: 'Turnaround time monitoring dashboard',
    specPath: 'designs/other/tat-dashboard.md',
  },
  {
    name: 'Calendar Management',
    category: 'other',
    component: React.lazy(() => import('@designs/other/calendar-management.jsx')),
    description: 'Lab calendar and scheduling management',
    specPath: null,
  },
];

const GITHUB_BASE = 'https://github.com/caseyi/openelis-work/blob/main/';

const categories = [
  'all',
  'admin-config',
  'analyzer-integration',
  'microbiology',
  'nce',
  'pathology',
  'quality',
  'results-validation',
  'system',
  'other',
];

const categoryLabels = {
  'all': 'All',
  'admin-config': 'Admin & Config',
  'analyzer-integration': 'Analyzer Integration',
  'microbiology': 'Microbiology',
  'nce': 'NCE',
  'pathology': 'Pathology',
  'quality': 'Quality & EQA',
  'results-validation': 'Results & Validation',
  'system': 'System',
  'other': 'Other',
};

/** Find a mockup by its hash path (e.g. "pathology/cytology-case-view") */
function findMockupByHash(hash) {
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
function toHash(mockup) {
  return `#/${mockup.category}/${toSlug(mockup.name)}`;
}

function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedMockup, setSelectedMockup] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (mockup) {
      window.location.hash = toHash(mockup);
    } else {
      // Clear hash when going back to gallery
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }

  const filtered = MOCKUP_REGISTRY.filter((m) => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const countByCategory = {};
  MOCKUP_REGISTRY.forEach((m) => {
    countByCategory[m.category] = (countByCategory[m.category] || 0) + 1;
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>OpenELIS Global — Design Gallery</h1>
        <p style={styles.subtitle}>
          {MOCKUP_REGISTRY.length} mockups across {Object.keys(countByCategory).length} categories
        </p>
      </header>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search mockups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.search}
        />
        <div style={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...styles.tab,
                ...(activeCategory === cat ? styles.tabActive : {}),
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
          <button onClick={() => selectMockup(null)} style={styles.backButton}>
            ← Back to Gallery
          </button>
          <div style={styles.mockupHeader}>
            <h2 style={{ margin: 0 }}>{selectedMockup.name}</h2>
            <span style={styles.badge}>{categoryLabels[selectedMockup.category]}</span>
            <button
              onClick={() => {
                const url = window.location.origin + window.location.pathname + toHash(selectedMockup);
                navigator.clipboard.writeText(url).then(() => {
                  alert('Permalink copied!');
                });
              }}
              style={styles.permalinkButton}
              title="Copy permalink to clipboard"
            >
              Copy Link
            </button>
          </div>
          <p style={styles.description}>{selectedMockup.description}</p>
          <div style={styles.links}>
            {selectedMockup.specPath && (
              <a href={GITHUB_BASE + selectedMockup.specPath} target="_blank" rel="noopener" style={styles.link}>
                View Spec on GitHub
              </a>
            )}
          </div>
          <div style={styles.preview}>
            <Suspense fallback={<div style={styles.loading}>Loading mockup...</div>}>
              <ErrorBoundary name={selectedMockup.name}>
                <selectedMockup.component />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.length === 0 ? (
            <div style={styles.empty}>No mockups match your search.</div>
          ) : (
            filtered.map((mockup, i) => (
              <div
                key={i}
                style={styles.card}
                onClick={() => selectMockup(mockup)}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.badge}>{categoryLabels[mockup.category]}</span>
                  {mockup.specPath && <span style={styles.specBadge}>has spec</span>}
                </div>
                <h3 style={styles.cardTitle}>{mockup.name}</h3>
                <p style={styles.cardDesc}>{mockup.description}</p>
              </div>
            ))
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
};

export default App;
