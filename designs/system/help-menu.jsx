// HelpViewer mockup — OpenELIS Global in-app help (new-tab variant)
//
// Location target: frontend/src/components/help/HelpViewer.jsx
// Mounted at:       <Route path="/help/:slug?" exact component={HelpViewer} />
// Invoked from:     HelpMenu.jsx (User Manual button) via window.open('/help', '_blank')
//
// Design notes:
//   - The help viewer is INTENDED to open in a separate browser tab, so the user
//     can view OpenELIS and the help side-by-side. The OpenELIS UIShell side
//     menu is NOT rendered in this view — only a minimal standalone header
//     (brand + title + search + "Return to OpenELIS").
//   - If window.opener is set, "Return to OpenELIS" closes this tab; otherwise
//     it navigates to /home.
//   - In the real component:
//       * manifest, page HTML, search-index loaded from /help-content/<locale>/...
//       * page HTML sanitized through DOMPurify before innerHTML assignment.
//       * locale comes from the existing OpenELIS i18n provider.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Header, HeaderName, HeaderGlobalBar, HeaderGlobalAction, HeaderMenuButton,
  Grid, Column,
  SideNav, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem,
  Search,
  Breadcrumb, BreadcrumbItem,
  InlineNotification,
  Tag,
  SkeletonText,
  Button,
  Link as CarbonLink,
} from '@carbon/react';
import { Logout, Help as HelpIcon } from '@carbon/icons-react';
import { useParams, useHistory } from 'react-router-dom';

const t = (key, fallback) => fallback || key;

// ----- Fixtures (real impl fetches these) -----
const MOCK_MANIFEST = {
  locale: 'en',
  pages: [
    { slug: 'user-manual', title: 'User Manual', parentSlug: null, children: [
      { slug: 'part-1-navigating', title: 'PART 1: Navigating OpenELIS Global', parentSlug: 'user-manual',
        headings: [
          { level: 1, text: 'Introduction', slug: 'introduction' },
          { level: 2, text: 'How to login to OpenELIS', slug: 'how-to-login-to-openelis' },
        ], children: [] },
      { slug: 'part-4-entering-lab-orders', title: 'PART 4: Entering Lab Orders', parentSlug: 'user-manual', headings: [], children: [] },
    ]},
    { slug: 'admin-manual', title: 'Admin Manual', parentSlug: null, children: [
      { slug: 'admin-part-7b-analyzer-management', title: 'PART 7 B: Analyzer Management', parentSlug: 'admin-manual', headings: [], children: [] },
    ]},
  ]
};

// ----- Helpers -----
function flattenPages(pages, out = []) {
  pages.forEach(p => { out.push(p); if (p.children?.length) flattenPages(p.children, out); });
  return out;
}
function findPage(pages, slug) {
  for (const p of pages) {
    if (p.slug === slug) return p;
    if (p.children?.length) { const f = findPage(p.children, slug); if (f) return f; }
  }
  return null;
}
function buildBreadcrumb(pages, slug) {
  const flat = flattenPages(pages);
  const bySlug = new Map(flat.map(p => [p.slug, p]));
  const trail = []; let cur = bySlug.get(slug);
  while (cur) { trail.unshift(cur); cur = cur.parentSlug ? bySlug.get(cur.parentSlug) : null; }
  return trail;
}

// ----- Return to OpenELIS handler -----
function useReturnToOpenElis(history) {
  return useCallback(() => {
    // window.opener is set when this tab was opened via window.open from OpenELIS.
    // Same-origin check protects against tabs opened from external sites.
    const sameOriginOpener = window.opener &&
      (() => { try { return window.opener.location.origin === window.location.origin; }
               catch { return false; } })();
    if (sameOriginOpener) { window.close(); return; }
    history.push('/home');
  }, [history]);
}

// ----- HelpViewer -----
export default function HelpViewer() {
  const { slug } = useParams();
  const history = useHistory();
  const returnToApp = useReturnToOpenElis(history);
  const branding = useSiteBranding();

  const [manifest, setManifest] = useState(null);
  const [pageHtml, setPageHtml] = useState(null);
  const [pageError, setPageError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sideNavExpanded, setSideNavExpanded] = useState(true);

  const activeSlug = slug || (manifest && flattenPages(manifest.pages).find(p => p.children?.length === 0)?.slug);

  // Load manifest. Real impl fetches /help-content/<locale>/manifest.json with English fallback.
  useEffect(() => { setManifest(MOCK_MANIFEST); }, []);

  // Load page HTML. Real impl fetches and runs DOMPurify.
  useEffect(() => {
    if (!manifest || !activeSlug) return;
    setPageError(null); setPageHtml(null);
    // mockup: stub HTML
    setTimeout(() => setPageHtml(`<h1>${findPage(manifest.pages, activeSlug)?.title || activeSlug}</h1><p>Body…</p>`), 100);
  }, [manifest, activeSlug]);

  const searchResults = useMemo(() => {
    if (!manifest || searchQuery.length < 2) return null;
    const q = searchQuery.toLowerCase();
    return flattenPages(manifest.pages).filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.headings || []).some(h => h.text.toLowerCase().includes(q))
    );
  }, [manifest, searchQuery]);

  const handleContentClick = useCallback((e) => {
    const a = e.target.closest('a');
    if (a) { const href = a.getAttribute('href'); if (href?.startsWith('/help/')) { e.preventDefault(); history.push(href); } }
  }, [history]);

  const breadcrumb = manifest ? buildBreadcrumb(manifest.pages, activeSlug) : [];

  // -------- Loading state --------
  if (!manifest) {
    return (
      <>
        <StandaloneHeader onReturn={returnToApp} searchQuery="" onSearchChange={() => {}} branding={branding} />
        <Grid fullWidth>
          <Column lg={4}><SkeletonText paragraph lineCount={6} /></Column>
          <Column lg={12}><SkeletonText paragraph lineCount={12} /></Column>
        </Grid>
      </>
    );
  }

  return (
    <>
      <StandaloneHeader
        onReturn={returnToApp}
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value || '')}
        onSearchClear={() => setSearchQuery('')}
        onToggleSideNav={() => setSideNavExpanded(!sideNavExpanded)}
        branding={branding}
      />

      <Grid fullWidth condensed style={{ marginTop: '48px' /* sticky header offset */ }}>
        {/* TOC side rail (or search results) */}
        {sideNavExpanded && (
          <Column lg={4} md={3} sm={4}>
            <aside aria-label={t('help.viewer.title', 'Help')}
                   style={{ position: 'sticky', top: '48px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>
              <SideNav aria-label={t('help.viewer.title', 'Help')} isFixedNav expanded>
                <SideNavItems>
                  {searchResults === null ? (
                    manifest.pages.map(group => (
                      <SideNavMenu key={group.slug} title={group.title} defaultExpanded>
                        {group.children.map(c => (
                          <SideNavMenuItem
                            key={c.slug}
                            isActive={c.slug === activeSlug}
                            href={`/help/${c.slug}`}
                            onClick={(e) => { e.preventDefault(); history.push(`/help/${c.slug}`); }}
                          >{c.title}</SideNavMenuItem>
                        ))}
                      </SideNavMenu>
                    ))
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: '1rem', fontSize: '0.875rem' }}>
                      {t('help.viewer.search.no-results', `No results for "${searchQuery}"`)}
                    </div>
                  ) : (
                    searchResults.map(r => (
                      <SideNavLink
                        key={r.slug}
                        isActive={r.slug === activeSlug}
                        href={`/help/${r.slug}`}
                        onClick={(e) => { e.preventDefault(); history.push(`/help/${r.slug}`); setSearchQuery(''); }}
                      >{r.title}</SideNavLink>
                    ))
                  )}
                </SideNavItems>
              </SideNav>
            </aside>
          </Column>
        )}

        {/* Main content */}
        <Column lg={sideNavExpanded ? 12 : 16} md={sideNavExpanded ? 5 : 8} sm={4}>
          <main style={{ padding: '1rem 2rem', maxWidth: '920px' }}>
            <Breadcrumb noTrailingSlash>
              <BreadcrumbItem onClick={(e) => { e.preventDefault(); history.push('/help'); }} href="/help">
                {t('help.viewer.breadcrumb.home', 'Help')}
              </BreadcrumbItem>
              {breadcrumb.slice(1).map((b, i, arr) => (
                <BreadcrumbItem key={b.slug} isCurrentPage={i === arr.length - 1}
                  onClick={(e) => { e.preventDefault(); history.push(`/help/${b.slug}`); }}
                  href={`/help/${b.slug}`}>{b.title}</BreadcrumbItem>
              ))}
            </Breadcrumb>

            {pageError === 'not-found' && (
              <InlineNotification kind="warning" hideCloseButton
                title={t('help.viewer.error.not-found.title', 'Page not found')}
                actions={<Button kind="ghost" size="sm" onClick={() => history.push('/help')}>
                  {t('help.viewer.error.page.home', 'Back to home')}</Button>}
              />
            )}

            {!pageHtml && !pageError && <SkeletonText paragraph lineCount={10} />}

            {pageHtml && (
              <div className="oe-help-content"
                   onClick={handleContentClick}
                   // Real impl: DOMPurify.sanitize(rawHtml, {...})
                   dangerouslySetInnerHTML={{ __html: pageHtml }} />
            )}
          </main>
        </Column>
      </Grid>
    </>
  );
}

// -----------------------------------------------------------------------------
// Branding hook — fetches /rest/site-branding/ and applies CSS variables to <html>.
// Real impl uses getFromOpenElisServer wrapper used elsewhere in the codebase.
// -----------------------------------------------------------------------------
function useSiteBranding() {
  const [branding, setBranding] = useState({
    headerLogoUrl: '/images/openelis_logo.png',
    primaryColor:   '#1d4ed8',
    secondaryColor: '#64748b',
    accentColor:    '#0891b2',
    siteName:       'OpenELIS Global',
    faviconUrl:     null,
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/rest/site-branding/').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/rest/properties').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([brand, props]) => {
      if (!mounted) return;
      setBranding(prev => ({
        ...prev,
        headerLogoUrl:  brand?.headerLogoUrl  || prev.headerLogoUrl,
        primaryColor:   brand?.primaryColor   || prev.primaryColor,
        secondaryColor: brand?.secondaryColor || prev.secondaryColor,
        accentColor:    brand?.accentColor    || prev.accentColor,
        faviconUrl:     brand?.faviconUrl     || prev.faviconUrl,
        siteName:       props?.['org.openelisglobal.banner.name'] || props?.siteName || prev.siteName,
      }));
    });
    return () => { mounted = false; };
  }, []);

  // Apply branding to CSS vars + favicon. Done in an effect so colors update live.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cds-interactive-01', branding.primaryColor);
    root.style.setProperty('--cds-interactive-02', branding.secondaryColor);
    root.style.setProperty('--cds-support-01',     branding.accentColor);
    if (branding.faviconUrl) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = branding.faviconUrl;
    }
  }, [branding]);

  return branding;
}

// -----------------------------------------------------------------------------
// Standalone header — replaces the OpenELIS UIShell inside the help tab.
// Brand mark, site name, search, and return-to-app — all respecting site branding.
// -----------------------------------------------------------------------------
function StandaloneHeader({ onReturn, searchQuery, onSearchChange, onSearchClear, onToggleSideNav, branding }) {
  return (
    <Header aria-label={`${branding.siteName} Help`}>
      {onToggleSideNav && <HeaderMenuButton aria-label="Toggle navigation" onClick={onToggleSideNav} isActive />}
      <HeaderName href="/help" prefix="">
        <img src={branding.headerLogoUrl} alt="" style={{ height: '20px', marginRight: '8px' }} />
        {branding.siteName} {t('help.viewer.title', 'Help')}
      </HeaderName>
      <div style={{ flex: 1, maxWidth: '480px', padding: '0 1rem' }}>
        <Search
          size="lg"
          labelText={t('help.viewer.search.placeholder', 'Search help…')}
          placeholder={t('help.viewer.search.placeholder', 'Search help…')}
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onSearchClear}
        />
      </div>
      <HeaderGlobalBar>
        <HeaderGlobalAction
          aria-label={t('help.viewer.return-to-app', 'Return to OpenELIS')}
          tooltipAlignment="end"
          onClick={onReturn}
        >
          <Logout size={20} />
        </HeaderGlobalAction>
      </HeaderGlobalBar>
    </Header>
  );
}
