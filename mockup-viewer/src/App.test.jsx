import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App, {
  toSlug,
  toHash,
  findMockupByHash,
  formatDate,
  getEntryType,
  MOCKUP_REGISTRY,
  GITHUB_BASE,
  GITHUB_REPO,
  GITHUB_ISSUES_URL,
  JIRA_BASE,
  DEFAULT_ADDED,
  categories,
  categoryLabels,
  themes,
  statusConfig,
  statusKeys,
  STATUS_DEFAULT,
  sanitizeComment,
} from './App';

// ═══════════════════════════════════════════════════════════════
// Unit tests — pure functions & data integrity
// ═══════════════════════════════════════════════════════════════

describe('toSlug', () => {
  it('converts a simple name to lowercase kebab-case', () => {
    expect(toSlug('Data Dictionary')).toBe('data-dictionary');
  });

  it('handles version numbers and parentheses', () => {
    expect(toSlug('Validation Page v2.1 (Stage 1)')).toBe('validation-page-v2-1-stage-1');
  });

  it('strips leading and trailing hyphens', () => {
    expect(toSlug('---hello---')).toBe('hello');
  });

  it('collapses consecutive special chars into a single hyphen', () => {
    expect(toSlug('HL7 Analyzer Mapping')).toBe('hl7-analyzer-mapping');
  });

  it('handles slashes in names', () => {
    expect(toSlug('QuantStudio 5/7 Flex Field Mapping')).toBe('quantstudio-5-7-flex-field-mapping');
  });

  it('returns empty string for empty input', () => {
    expect(toSlug('')).toBe('');
  });
});

describe('toHash', () => {
  it('builds the correct hash for a mockup', () => {
    const mockup = { name: 'Cytology Case View', category: 'pathology' };
    expect(toHash(mockup)).toBe('#/pathology/cytology-case-view');
  });

  it('handles categories with hyphens', () => {
    const mockup = { name: 'Data Dictionary', category: 'admin-config' };
    expect(toHash(mockup)).toBe('#/admin-config/data-dictionary');
  });
});

describe('findMockupByHash', () => {
  it('finds a mockup by its hash path', () => {
    const result = findMockupByHash('#/admin-config/data-dictionary');
    expect(result).not.toBeNull();
    expect(result.name).toBe('Data Dictionary');
  });

  it('handles hash without leading slash', () => {
    const result = findMockupByHash('#admin-config/data-dictionary');
    expect(result).not.toBeNull();
    expect(result.name).toBe('Data Dictionary');
  });

  it('returns null for empty hash', () => {
    expect(findMockupByHash('')).toBeNull();
    expect(findMockupByHash('#')).toBeNull();
    expect(findMockupByHash('#/')).toBeNull();
  });

  it('returns null for non-existent mockup', () => {
    expect(findMockupByHash('#/admin-config/does-not-exist')).toBeNull();
  });

  it('returns null for wrong category', () => {
    expect(findMockupByHash('#/pathology/data-dictionary')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// Registry data integrity tests
// ═══════════════════════════════════════════════════════════════

describe('MOCKUP_REGISTRY integrity', () => {
  it('has at least 30 entries', () => {
    expect(MOCKUP_REGISTRY.length).toBeGreaterThanOrEqual(30);
  });

  it('every entry has a name and category', () => {
    MOCKUP_REGISTRY.forEach((entry, i) => {
      expect(entry.name, `entry[${i}] missing name`).toBeTruthy();
      expect(entry.category, `entry[${i}] "${entry.name}" missing category`).toBeTruthy();
    });
  });

  it('every entry has a description', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      expect(entry.description, `"${entry.name}" missing description`).toBeTruthy();
    });
  });

  it('every category in registry is in the categories list', () => {
    const validCategories = new Set(categories);
    MOCKUP_REGISTRY.forEach((entry) => {
      expect(validCategories.has(entry.category),
        `"${entry.name}" has unknown category "${entry.category}"`
      ).toBe(true);
    });
  });

  it('has no duplicate names within the same category', () => {
    const seen = new Set();
    MOCKUP_REGISTRY.forEach((entry) => {
      const key = `${entry.category}/${toSlug(entry.name)}`;
      expect(seen.has(key),
        `Duplicate permalink: ${key} (entry "${entry.name}")`
      ).toBe(false);
      seen.add(key);
    });
  });

  it('every entry has either a component, specPath, figmaUrl, or htmlUrl', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      const hasContent = entry.component || entry.specPath || entry.figmaUrl || entry.htmlUrl;
      expect(hasContent,
        `"${entry.name}" has no component, specPath, figmaUrl, or htmlUrl`
      ).toBeTruthy();
    });
  });

  it('jira field is always an array of strings when present', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      if (entry.jira) {
        expect(Array.isArray(entry.jira),
          `"${entry.name}" jira field is not an array`
        ).toBe(true);
        entry.jira.forEach((key) => {
          expect(typeof key).toBe('string');
          expect(key).toMatch(/^OGC-\d+$/);
        });
      }
    });
  });

  it('specPath values look like valid relative paths', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      if (entry.specPath) {
        expect(entry.specPath, `"${entry.name}" specPath should start with designs/`)
          .toMatch(/^designs\//);
        expect(entry.specPath, `"${entry.name}" specPath should end with .md`)
          .toMatch(/\.md$/);
      }
    });
  });
});

describe('categories & categoryLabels', () => {
  it('every category has a label', () => {
    categories.forEach((cat) => {
      expect(categoryLabels[cat], `category "${cat}" missing label`).toBeTruthy();
    });
  });

  it('includes "all" as the first category', () => {
    expect(categories[0]).toBe('all');
  });
});

describe('formatDate', () => {
  it('formats an ISO date as "Mon D, YYYY"', () => {
    expect(formatDate('2026-03-09')).toBe('Mar 9, 2026');
  });

  it('formats the default added date', () => {
    expect(formatDate(DEFAULT_ADDED)).toBe('Mar 3, 2026');
  });

  it('handles different months', () => {
    expect(formatDate('2026-01-15')).toBe('Jan 15, 2026');
    expect(formatDate('2026-12-25')).toBe('Dec 25, 2026');
  });
});

describe('added dates', () => {
  it('entries with added field have valid ISO dates', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      if (entry.added) {
        expect(entry.added, `"${entry.name}" has invalid added date`)
          .toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });
});

describe('getEntryType', () => {
  it('returns "jsx" for entries with a component', () => {
    expect(getEntryType({ component: () => {} })).toBe('jsx');
  });

  it('returns "html" for entries with htmlUrl but no component', () => {
    expect(getEntryType({ component: null, htmlUrl: 'foo.html' })).toBe('html');
  });

  it('returns "figma" for entries with figmaUrl but no component or htmlUrl', () => {
    expect(getEntryType({ component: null, figmaUrl: 'https://figma.com/...' })).toBe('figma');
  });

  it('returns "spec" for entries with only specPath', () => {
    expect(getEntryType({ component: null, specPath: 'foo.md' })).toBe('spec');
  });

  it('correctly classifies all registry entries', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      const type = getEntryType(entry);
      expect(['jsx', 'html', 'figma', 'spec']).toContain(type);
    });
  });
});

describe('relatedTo integrity', () => {
  it('all relatedTo references point to existing entries', () => {
    const names = new Set(MOCKUP_REGISTRY.map(m => m.name));
    MOCKUP_REGISTRY.forEach((entry) => {
      if (entry.relatedTo) {
        entry.relatedTo.forEach((relName) => {
          expect(names.has(relName),
            `"${entry.name}" references non-existent related entry "${relName}"`
          ).toBe(true);
        });
      }
    });
  });

  it('relatedTo links are bidirectional', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      if (entry.relatedTo) {
        entry.relatedTo.forEach((relName) => {
          const related = MOCKUP_REGISTRY.find(m => m.name === relName);
          if (related && related.relatedTo) {
            expect(related.relatedTo.includes(entry.name),
              `"${relName}" does not link back to "${entry.name}"`
            ).toBe(true);
          }
        });
      }
    });
  });
});

describe('constants', () => {
  it('GITHUB_BASE points to DIGI-UW repo', () => {
    expect(GITHUB_BASE).toContain('DIGI-UW/openelis-work');
    expect(GITHUB_BASE).toMatch(/\/blob\/main\/$/);
  });

  it('JIRA_BASE points to uwdigi Atlassian', () => {
    expect(JIRA_BASE).toBe('https://uwdigi.atlassian.net/browse/');
  });

  it('DEFAULT_ADDED is an ISO date string', () => {
    expect(DEFAULT_ADDED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ═══════════════════════════════════════════════════════════════
// Permalink stability tests — these protect against regressions
// when entries are renamed or reordered
// ═══════════════════════════════════════════════════════════════

describe('permalink stability', () => {
  const KNOWN_PERMALINKS = [
    '#/admin-config/data-dictionary',
    '#/admin-config/rbac-management',
    '#/analyzer-integration/sysmex-xp-field-mapping',
    '#/analyzer-integration/analyzer-file-upload',
    '#/analyzer-integration/quantstudio-5-7-flex-field-mapping',
    '#/analyzer-integration/fluorocycler-xt-integration-spec',
    '#/microbiology/amr-module',
    '#/nce/nce-analytics',
    '#/pathology/pathology-case-view',
    '#/pathology/cytology-case-view',
    '#/quality/eqa-enrollment',
    '#/quality/westgard-dashboard',
    '#/results-validation/results-page',
    '#/results-validation/validation-page',
    '#/results-validation/validation-page-analyzer',
    '#/results-validation/validation-page-v2-full-redesign',
    '#/results-validation/validation-page-v2-1-stage-1',
    '#/results-validation/validation-page-v3-demographics',
    '#/results-validation/patient-demographics-frs',
    '#/system/audit-trail',
    '#/sample-collection/sample-collection-redesign',
    '#/other/tat-dashboard',
    '#/system/catalyst-lab-data-assistant',
  ];

  KNOWN_PERMALINKS.forEach((hash) => {
    it(`resolves: ${hash}`, () => {
      const result = findMockupByHash(hash);
      expect(result, `Permalink broken: ${hash}`).not.toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Component rendering tests
// ═══════════════════════════════════════════════════════════════

describe('App component', () => {
  beforeEach(() => {
    // Clear hash before each test
    window.location.hash = '';
  });

  it('renders the gallery header', () => {
    render(<App />);
    expect(screen.getByText('OpenELIS Global — Design Gallery')).toBeInTheDocument();
  });

  it('renders the correct total mockup count', () => {
    render(<App />);
    const subtitle = screen.getByText(/mockups across/);
    expect(subtitle.textContent).toContain(`${MOCKUP_REGISTRY.length} mockups`);
  });

  it('renders category filter buttons', () => {
    render(<App />);
    // Category tabs include counts like "Admin & Config (9)" — use button role
    const buttons = screen.getAllByRole('button');
    const tabLabels = buttons.map(b => b.textContent);
    expect(tabLabels.some(t => t.includes('Admin & Config'))).toBe(true);
    expect(tabLabels.some(t => t.includes('Analyzer Integration'))).toBe(true);
    expect(tabLabels.some(t => t.includes('Pathology'))).toBe(true);
  });

  it('renders all cards in default "all" view', () => {
    render(<App />);
    // Each card has a title h3 — count them
    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles.length).toBe(MOCKUP_REGISTRY.length);
  });

  it('filters cards when a category is selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Count expected pathology entries
    const pathologyCount = MOCKUP_REGISTRY.filter(m => m.category === 'pathology').length;

    // Click Pathology tab button (not the badge spans)
    const buttons = screen.getAllByRole('button');
    const pathologyTab = buttons.find(b => b.textContent.includes('Pathology'));
    await user.click(pathologyTab);

    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles.length).toBe(pathologyCount);
  });

  it('search filters cards by name', async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByPlaceholderText('Search mockups...');
    await user.type(searchInput, 'cytology');

    const titles = screen.getAllByRole('heading', { level: 3 });
    titles.forEach((h3) => {
      expect(h3.textContent.toLowerCase()).toContain('cytology');
    });
  });

  it('search by Jira ticket key finds matching entries', async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByPlaceholderText('Search mockups...');
    await user.type(searchInput, 'OGC-291');

    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles.length).toBeGreaterThanOrEqual(1);
    // All results should have OGC-291 in their jira array
    titles.forEach((h3) => {
      const entry = MOCKUP_REGISTRY.find(m => m.name === h3.textContent);
      expect(entry.jira).toContain('OGC-291');
    });
  });

  it('shows "no mockups match" for nonsense search', async () => {
    const user = userEvent.setup();
    render(<App />);

    const searchInput = screen.getByPlaceholderText('Search mockups...');
    await user.type(searchInput, 'zzzzxyznonexistent');

    expect(screen.getByText('No mockups match your search.')).toBeInTheDocument();
  });

  it('clicking a card opens the detail view', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click the first card
    const firstEntry = MOCKUP_REGISTRY[0];
    const card = screen.getByText(firstEntry.name);
    await user.click(card);

    // Detail view should show back button and the h2 title
    expect(screen.getByText('← Back to Gallery')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(firstEntry.name);
  });

  it('back button returns to gallery view', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Open a card — click on the h3 title specifically
    const firstEntry = MOCKUP_REGISTRY[0];
    const h3s = screen.getAllByRole('heading', { level: 3 });
    const targetH3 = h3s.find(h => h.textContent === firstEntry.name);
    await user.click(targetH3);
    expect(screen.getByText('← Back to Gallery')).toBeInTheDocument();

    // Click back
    await user.click(screen.getByText('← Back to Gallery'));

    // Should be back in gallery grid (cards visible, not detail view)
    // Note: category filter stays on the entry's category after back navigation
    const titles = screen.getAllByRole('heading', { level: 3 });
    const expectedCount = MOCKUP_REGISTRY.filter(m => m.category === firstEntry.category).length;
    expect(titles.length).toBe(expectedCount);
  });

  it('detail view shows spec link for entries with specPath', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Find an entry with a specPath
    const entryWithSpec = MOCKUP_REGISTRY.find(m => m.specPath);
    await user.click(screen.getByText(entryWithSpec.name));

    const specLink = screen.getByText('View Spec on GitHub');
    expect(specLink).toHaveAttribute('href', GITHUB_BASE + entryWithSpec.specPath);
    expect(specLink).toHaveAttribute('target', '_blank');
  });

  it('detail view shows Jira badges for entries with jira keys', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Find an entry with Jira keys
    const entryWithJira = MOCKUP_REGISTRY.find(m => m.jira && m.jira.length > 0);
    await user.click(screen.getByText(entryWithJira.name));

    // Each Jira key should be a clickable link
    entryWithJira.jira.forEach((key) => {
      const jiraLink = screen.getByText(key);
      expect(jiraLink).toHaveAttribute('href', JIRA_BASE + key);
    });
  });

  it('card view shows Jira badges for entries with jira keys', () => {
    render(<App />);

    const entryWithJira = MOCKUP_REGISTRY.find(m => m.jira && m.jira.length > 0);
    // The Jira badge should appear in the card grid
    const jiraLinks = screen.getAllByText(entryWithJira.jira[0]);
    expect(jiraLinks.length).toBeGreaterThanOrEqual(1);
    expect(jiraLinks[0]).toHaveAttribute('href', JIRA_BASE + entryWithJira.jira[0]);
  });

  it('cards show "has spec" badge for non-spec-only entries with specPath', () => {
    render(<App />);
    const specBadges = screen.getAllByText('has spec');
    // "has spec" only shown for entries that have a specPath AND are not spec-only type
    const entriesWithSpecAndMockup = MOCKUP_REGISTRY.filter(m =>
      m.specPath && (m.component || m.htmlUrl || m.figmaUrl)
    );
    expect(specBadges.length).toBe(entriesWithSpecAndMockup.length);
  });

  it('navigates to a mockup via URL hash on mount', () => {
    window.location.hash = '#/admin-config/data-dictionary';
    render(<App />);

    // Should be in detail view
    expect(screen.getByText('← Back to Gallery')).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    const detailH2 = h2s.find(h => h.textContent === 'Data Dictionary');
    expect(detailH2).toBeTruthy();
  });

  it('detail view shows Mockup Preview / Spec Document tabs for entries with both', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Find an entry with both a component and a specPath
    const entryWithBoth = MOCKUP_REGISTRY.find(m => m.component && m.specPath);
    await user.click(screen.getByText(entryWithBoth.name));

    expect(screen.getByText('Mockup Preview')).toBeInTheDocument();
    expect(screen.getByText('Spec Document')).toBeInTheDocument();
  });

  it('detail view shows Spec Document tab for spec-only entries', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Find a spec-only entry (no component, no htmlUrl, no figmaUrl, but has specPath)
    const specOnly = MOCKUP_REGISTRY.find(m => !m.component && !m.htmlUrl && !m.figmaUrl && m.specPath);
    await user.click(screen.getByText(specOnly.name));

    expect(screen.getByText('Spec Document')).toBeInTheDocument();
    // Should NOT show "Mockup Preview" tab
    expect(screen.queryByText('Mockup Preview')).toBeNull();
  });

  it('clicking Spec Document tab switches to spec view', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Find an entry with both a component and a specPath
    const entryWithBoth = MOCKUP_REGISTRY.find(m => m.component && m.specPath);
    await user.click(screen.getByText(entryWithBoth.name));

    // Click the Spec Document tab
    const specTab = screen.getByText('Spec Document');
    await user.click(specTab);

    // In test env, fetch fails so we get either loading or the fallback error link
    // The important thing is the mockup preview is no longer shown and the spec viewer rendered
    const fallbackLink = await screen.findByText('View on GitHub instead →');
    expect(fallbackLink).toBeInTheDocument();
  });

  it('renders a dark mode toggle button', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(toggle).toBeInTheDocument();
  });

  it('toggles dark mode when clicking the toggle', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Initially light mode (jsdom has no matchMedia preference)
    const container = screen.getByText('OpenELIS Global — Design Gallery').closest('[data-theme]');
    expect(container).toHaveAttribute('data-theme', 'light');

    // Click to switch to dark
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    await user.click(toggle);

    expect(container).toHaveAttribute('data-theme', 'dark');

    // Now the button should say "Switch to light mode"
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});

describe('themes', () => {
  it('light and dark themes have the same keys', () => {
    const lightKeys = Object.keys(themes.light).sort();
    const darkKeys = Object.keys(themes.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });

  it('all theme values are non-empty strings', () => {
    Object.entries(themes.light).forEach(([key, val]) => {
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    });
    Object.entries(themes.dark).forEach(([key, val]) => {
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    });
  });
});

describe('statusConfig', () => {
  it('has draft, review, and approved statuses', () => {
    expect(statusKeys).toContain('draft');
    expect(statusKeys).toContain('review');
    expect(statusKeys).toContain('approved');
  });

  it('each status has label, color, bg, darkBg, and icon', () => {
    statusKeys.forEach((key) => {
      const conf = statusConfig[key];
      expect(conf.label).toBeTruthy();
      expect(conf.color).toBeTruthy();
      expect(conf.bg).toBeTruthy();
      expect(conf.darkBg).toBeTruthy();
      expect(conf.icon).toBeTruthy();
    });
  });

  it('entries with status have valid status values', () => {
    MOCKUP_REGISTRY.forEach((m) => {
      if (m.status) {
        expect(statusKeys, `Invalid status "${m.status}" on "${m.name}"`).toContain(m.status);
      }
    });
  });

  it('STATUS_DEFAULT is a valid status key', () => {
    expect(statusKeys).toContain(STATUS_DEFAULT);
  });
});

describe('status filter', () => {
  it('renders a status filter dropdown', () => {
    render(<App />);
    const select = screen.getByRole('combobox', { name: /filter by status/i });
    expect(select).toBeInTheDocument();
  });

  it('filtering by review shows only review entries', async () => {
    const user = userEvent.setup();
    render(<App />);

    const reviewCount = MOCKUP_REGISTRY.filter(m => (m.status || STATUS_DEFAULT) === 'review').length;
    if (reviewCount === 0) return; // skip if no review entries

    const select = screen.getByRole('combobox', { name: /filter by status/i });
    await user.selectOptions(select, 'review');

    const titles = screen.getAllByRole('heading', { level: 3 });
    expect(titles.length).toBe(reviewCount);
  });
});

// ═══════════════════════════════════════════════════════════════
// sanitizeComment — anti-spam link removal
// ═══════════════════════════════════════════════════════════════

describe('sanitizeComment', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeComment('')).toBe('');
    expect(sanitizeComment(null)).toBe('');
    expect(sanitizeComment(undefined)).toBe('');
  });

  it('passes through plain text unchanged', () => {
    expect(sanitizeComment('This is a normal comment')).toBe('This is a normal comment');
  });

  it('strips HTML tags', () => {
    expect(sanitizeComment('Hello <b>bold</b> world')).toBe('Hello bold world');
    expect(sanitizeComment('<script>alert("xss")</script>')).toBe('alert("xss")');
    expect(sanitizeComment('<a href="http://evil.com">click me</a>')).toBe('click me');
  });

  it('strips http/https URLs', () => {
    expect(sanitizeComment('Visit https://example.com for info')).toBe('Visit [link removed] for info');
    expect(sanitizeComment('Go to http://example.com/page?q=1 now')).toBe('Go to [link removed] now');
  });

  it('strips ftp URLs', () => {
    expect(sanitizeComment('Download from ftp://files.example.com/data')).toBe('Download from [link removed]');
  });

  it('strips markdown links but keeps link text', () => {
    expect(sanitizeComment('See [the docs](https://example.com) for details'))
      .toBe('See the docs for details');
  });

  it('strips markdown images', () => {
    expect(sanitizeComment('Look at this ![alt text](https://img.com/pic.png)'))
      .toBe('Look at this [image removed]');
  });

  it('collapses excessive newlines', () => {
    expect(sanitizeComment('line1\n\n\n\n\nline2')).toBe('line1\n\nline2');
  });

  it('trims whitespace', () => {
    expect(sanitizeComment('  hello  ')).toBe('hello');
  });

  it('handles complex mixed content', () => {
    const input = 'Check <b>this</b> [link](https://spam.com) and https://evil.com please';
    const result = sanitizeComment(input);
    expect(result).not.toContain('https://');
    expect(result).not.toContain('<b>');
    expect(result).toContain('this');
    expect(result).toContain('link');
  });
});

// ═══════════════════════════════════════════════════════════════
// GitHub Issues integration constants & data
// ═══════════════════════════════════════════════════════════════

describe('GitHub Issues integration', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('GITHUB_REPO is correct', () => {
    expect(GITHUB_REPO).toBe('DIGI-UW/openelis-work');
  });

  it('GITHUB_ISSUES_URL derives from GITHUB_REPO', () => {
    expect(GITHUB_ISSUES_URL).toBe('https://github.com/DIGI-UW/openelis-work/issues');
  });

  it('githubIssue field is a positive integer when present', () => {
    MOCKUP_REGISTRY.forEach((entry) => {
      if (entry.githubIssue !== undefined) {
        expect(Number.isInteger(entry.githubIssue),
          `"${entry.name}" githubIssue should be an integer`).toBe(true);
        expect(entry.githubIssue,
          `"${entry.name}" githubIssue should be positive`).toBeGreaterThan(0);
      }
    });
  });

  it('entries with githubIssue show Discussion tab in detail view', async () => {
    const user = userEvent.setup();
    render(<App />);

    const entryWithIssue = MOCKUP_REGISTRY.find(m => m.githubIssue);
    if (!entryWithIssue) return; // skip if none wired yet

    await user.click(screen.getByText(entryWithIssue.name));
    expect(screen.getByText('Discussion')).toBeInTheDocument();
  });

  it('entries without githubIssue do NOT show Discussion tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    const entryWithoutIssue = MOCKUP_REGISTRY.find(m => !m.githubIssue && m.component);
    if (!entryWithoutIssue) return;

    // Use getAllByText in case name appears in both card grid and elsewhere, click first match
    const matches = screen.getAllByText(entryWithoutIssue.name);
    await user.click(matches[0]);

    // Should now be in detail view
    expect(screen.getByText('← Back to Gallery')).toBeInTheDocument();
    expect(screen.queryByText('Discussion')).toBeNull();
  });
});
