// HelpViewer mockup: OpenELIS Global in-app help (FRS v1.3, OGC-737)
//
// Route:      /help/:slug?            (SecureRoute in App.jsx; opened in its own tab)
// Opened by:  Main header Help (?) -> "User Manual" -> window.open("/help", "_blank")
// Component:  frontend/src/components/help/HelpViewer.jsx
// Content:    frontend/public/help-content/{assets,en,fr}/...  (built by npm run help:refresh)
//
// What the real component does that this mockup fakes:
//   - Fetches /help-content/<locale>/manifest.json, falls back to /help-content/en/ (FR-V-02).
//   - Fetches /help-content/<locale>/pages/<slug>.html and sanitizes it with DOMPurify
//     using the allowlist in FRS FR-S-02 before dangerouslySetInnerHTML (FR-V-05).
//   - Lazy-loads /help-content/<locale>/search-index.json into FlexSearch on first focus (FR-V-07).
//   - Calls loadAndApplyBranding() from components/utils/BrandingUtils.ts and reads
//     BANNER_TEXT from ConfigurationContext (FR-V-01c). No colors are hard-coded.
//   - Uses react-intl (intl.formatMessage({ id })) with keys in en.json and fr.json (FRS section 6).
//   - Locale comes from the app's IntlProvider.
//
// Two small changes outside this component (FRS FR-I-02, FR-I-06) are sketched at the bottom.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Header, HeaderName, HeaderMenuButton, HeaderGlobalBar, HeaderGlobalAction,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavDivider,
  Search, Breadcrumb, BreadcrumbItem, Tag, InlineNotification, Link,
  SkeletonText, Tile, Theme, Grid, Column, Button,
} from '@carbon/react';
import { Undo, Launch } from '@carbon/icons-react';

// i18n stand-in: real code uses react-intl with these ids (FRS section 6).
const MESSAGES = {
  en: {
    'help.viewer.brand': '{siteName} Help',
    'help.viewer.return-to-app': 'Return to OpenELIS',
    'help.viewer.search.placeholder': 'Search help…',
    'help.viewer.search.no-results': 'No results for "{query}"',
    'help.viewer.breadcrumb.home': 'Help',
    'help.viewer.section.user': 'User guide',
    'help.viewer.section.admin': 'Administrator guide',
    'help.viewer.menu.toggle': 'Show or hide contents',
    'help.viewer.fallback.tag': 'Available in English only',
    'help.viewer.wip.notice': 'This page is still being reviewed, so some details may change.',
    'help.viewer.link.latest': 'View the latest version online',
    'help.viewer.link.online': '(opens online documentation)',
    'help.viewer.error.not-found.title': 'Page not found',
    'help.viewer.error.not-found.body': 'The help page you requested does not exist.',
    'help.viewer.error.page.home': 'Back to help home',
    'help.viewer.error.manifest': 'Help content could not be loaded. Please contact your administrator.',
    'help.viewer.error.page.title': 'Page could not be loaded',
    'help.viewer.error.page.retry': 'Try again',
    'help.viewer.toc.label': 'Help contents',
    'help.viewer.landing.lead': 'Guides for this OpenELIS release. Pick a topic, or search above.',
  },
  fr: {
    'help.viewer.brand': 'Aide {siteName}',
    'help.viewer.return-to-app': 'Retour à OpenELIS',
    'help.viewer.search.placeholder': 'Rechercher dans l’aide…',
    'help.viewer.search.no-results': 'Aucun résultat pour « {query} »',
    'help.viewer.breadcrumb.home': 'Aide',
    'help.viewer.section.user': 'Guide de l’utilisateur',
    'help.viewer.section.admin': 'Guide de l’administrateur',
    'help.viewer.menu.toggle': 'Afficher ou masquer le sommaire',
    'help.viewer.fallback.tag': 'Disponible en anglais uniquement',
    'help.viewer.wip.notice': 'Cette page est en cours de relecture ; certains détails peuvent changer.',
    'help.viewer.link.latest': 'Voir la dernière version en ligne',
    'help.viewer.link.online': '(ouvre la documentation en ligne)',
    'help.viewer.error.not-found.title': 'Page introuvable',
    'help.viewer.error.not-found.body': 'La page d’aide demandée n’existe pas.',
    'help.viewer.error.page.home': 'Retour à l’accueil de l’aide',
    'help.viewer.error.manifest': 'Le contenu de l’aide n’a pas pu être chargé. Contactez votre administrateur.',
    'help.viewer.error.page.title': 'La page n’a pas pu être chargée',
    'help.viewer.error.page.retry': 'Réessayer',
    'help.viewer.toc.label': 'Sommaire de l’aide',
    'help.viewer.landing.lead': 'Guides pour cette version d’OpenELIS. Choisissez un sujet ou faites une recherche.',
  },
};
const useT = (locale) => (id, vars = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), MESSAGES[locale]?.[id] || MESSAGES.en[id] || id);

// Router stand-ins (react-router-dom v5 in the real app: useParams / useHistory / useLocation).
const useHelpRoute = (initial) => {
  const [route, setRoute] = useState(initial);
  return { ...route, push: (slug, hash) => setRoute({ slug, hash }) };
};

// ----- Manifest fixture (shape from FRS 4.2; one file per locale in production) -----
const CONF = 'https://uwdigi.atlassian.net/wiki/spaces/OG/pages/';
const MANIFESTS = {
  en: [
    { section: 'user', folders: [
      { slug: 'getting-around-openelis', title: 'Getting around OpenELIS', pages: [
        { slug: 'log-in-and-change-your-language', title: 'Log in and change your language', sourceUrl: CONF + '260931593' } ] },
      { slug: 'results-validation-and-reports', title: 'Results, validation and reports', pages: [
        { slug: 'print-a-work-plan', title: 'Print a work plan', sourceUrl: CONF + '272760837', wip: true,
          headings: [{ text: 'At a glance', slug: 'at-a-glance' }, { text: 'Step 4: Print the work plan', slug: 'step-4-print-the-work-plan' }] },
        { slug: 'results-entry-legacy-screen', title: 'Results Entry (legacy screen)', sourceUrl: CONF + '1653604361' } ] },
    ]},
    { section: 'admin', folders: [
      { slug: 'users-organizations-and-providers', title: 'Users, organizations and providers', pages: [
        { slug: 'admin-manage-sampling-sites', title: 'Admin: Manage sampling sites', sourceUrl: CONF + '1705083175', wip: true } ] },
    ]},
  ],
  fr: [
    { section: 'user', folders: [
      { slug: 'getting-around-openelis', title: 'Se repérer dans OpenELIS', pages: [
        { slug: 'log-in-and-change-your-language', title: 'Se connecter et changer de langue', sourceUrl: CONF + '260931593' } ] },
      { slug: 'results-validation-and-reports', title: 'Résultats, validation et rapports', pages: [
        { slug: 'print-a-work-plan', title: 'Imprimer un plan de travail', sourceUrl: CONF + '272760837', wip: true } ] },
    ]},
  ],
};

// Page chunks as the pipeline emits them (classes from FRS 4.4). Real code: fetch + DOMPurify.
const PAGES = {
  en: {
    'log-in-and-change-your-language': '<p class="oe-help-label">How-to · Lab staff</p><h2 id="step-1-log-in">Step 1: Log in</h2><ol><li>Type your <strong>Username</strong> and <strong>Password</strong>, then select <strong>Login</strong>.</li></ol>',
    'print-a-work-plan': '<p class="oe-help-label">How-to · Bench staff and lab supervisors</p><aside class="oe-help-callout oe-help-callout--info" role="note"><p><strong>OpenELIS 3.3.0.</strong> Sites on earlier releases can use <a class="oe-help-link--online" href="' + CONF + '1705378043" target="_blank" rel="noopener noreferrer">PART 7: WORK PLANS (before 3.3.0)</a>.</p></aside><h2 id="at-a-glance">At a glance</h2><div class="oe-help-table-wrap"><table class="oe-help-table"><tbody><tr><th>Purpose</th><td>List the tests waiting to be done and print the day’s work plan.</td></tr><tr><th>Where</th><td>Main menu → Workplan</td></tr></tbody></table></div><h2 id="step-4-print-the-work-plan">Step 4: Print the work plan</h2><ol start="6"><li>Select <strong>Print Workplan</strong>. The PDF opens in a new tab.</li></ol><p>Next: <a href="/help/results-entry-legacy-screen">Results Entry (legacy screen)</a>.</p>',
    'results-entry-legacy-screen': '<p class="oe-help-label">How-to · Analyst</p><aside class="oe-help-callout oe-help-callout--warning" role="note"><p>Shown only when <code>resultsEntryUnifiedRoute</code> is false.</p></aside>',
    'admin-manage-sampling-sites': '<p class="oe-help-label">How-to · Administrators</p><ol><li>Select <strong>Add sampling site</strong> and save. To stop using a site, <strong>Deactivate</strong> it.</li></ol>',
  },
  fr: {
    'log-in-and-change-your-language': '<p class="oe-help-label">Guide pratique · Personnel du laboratoire</p><h2 id="step-1-log-in">Étape 1 : Se connecter</h2><ol><li>Saisissez votre <strong>nom d’utilisateur</strong> et votre <strong>mot de passe</strong>.</li></ol>',
    'print-a-work-plan': '<p class="oe-help-label">Guide pratique · Personnel de paillasse et responsables</p><h2 id="step-4-print-the-work-plan">Étape 4 : Imprimer le plan de travail</h2><ol start="6"><li>Sélectionnez <strong>Imprimer le plan de travail</strong>.</li></ol>',
  },
};

// Branding as returned by GET /rest/site-branding (+ BANNER_TEXT from configuration properties).
const BRANDING = { headerColor: '#0f5e3b', primaryColor: '#0f5e3b', headerLogoUrl: null };
const BANNER_TEXT = 'Madagascar OpenELIS';

// "Return to OpenELIS": text button from 672 px, icon-only below (FRS 5.1).
const useNarrow = (px = 672) => {
  const q = typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${px - 1}px)`) : null;
  const [narrow, setNarrow] = useState(q ? q.matches : false);
  useEffect(() => { if (!q) return undefined; const h = (e) => setNarrow(e.matches); q.addEventListener('change', h); return () => q.removeEventListener('change', h); }, []); // eslint-disable-line
  return narrow;
};

const flatten = (tree) => tree.flatMap((s) => s.folders.flatMap((f) => f.pages.map((p) => ({ ...p, folder: f, section: s.section }))));

export default function HelpViewerMockup() {
  const [locale, setLocale] = useState('fr'); // demo toggle; real code reads IntlProvider
  const t = useT(locale);
  const route = useHelpRoute({ slug: 'print-a-work-plan', hash: null });
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  // FR-V-11: set from fetch failures in the real component ('manifest' | 'page' | null).
  const [loadError, setLoadError] = useState(null);
  const narrow = useNarrow();

  // FR-V-02: active-locale manifest, English as fallback.
  const manifest = MANIFESTS[locale] || MANIFESTS.en;
  const english = flatten(MANIFESTS.en);
  const local = flatten(manifest);
  const entry = local.find((p) => p.slug === route.slug);
  const page = entry || english.find((p) => p.slug === route.slug) || null;
  const isFallback = locale !== 'en' && page && !entry;
  const html = page ? (PAGES[locale]?.[route.slug] || PAGES.en[route.slug]) : null;

  // Tree shown in the SideNav: locale tree plus English-only pages, so nothing disappears.
  const tree = useMemo(() => MANIFESTS.en.map((s) => ({
    ...s,
    folders: s.folders.map((f) => {
      const lf = manifest.find((x) => x.section === s.section)?.folders.find((x) => x.slug === f.slug);
      return { ...f, title: lf?.title || f.title, pages: f.pages.map((p) => lf?.pages.find((x) => x.slug === p.slug) || p) };
    }),
  })), [manifest]);

  useEffect(() => { setLoading(true); const id = setTimeout(() => setLoading(false), 200); return () => clearTimeout(id); }, [route.slug, locale]);
  useEffect(() => { if (route.hash) document.getElementById(route.hash)?.scrollIntoView({ behavior: 'smooth' }); }, [route.hash, loading]);

  // FR-V-07: search (real code: FlexSearch over search-index.json).
  const results = useMemo(() => {
    if (query.trim().length < 2) return null;
    const q = query.toLowerCase();
    return english.map((p) => local.find((l) => l.slug === p.slug) || p)
      .filter((p) => p.title.toLowerCase().includes(q) || (PAGES[locale]?.[p.slug] || PAGES.en[p.slug] || '').toLowerCase().includes(q));
  }, [query, locale]); // eslint-disable-line

  // FR-V-08: in-content /help/ links route in-app.
  const onContentClick = (e) => {
    const a = e.target.closest('a');
    const href = a?.getAttribute('href') || '';
    if (href.startsWith('/help/')) { e.preventDefault(); const [s, h] = href.slice(6).split('#'); route.push(s, h); }
  };

  // FR-V-01b: Return to OpenELIS.
  const onReturn = () => {
    try {
      if (window.opener && window.opener.location.origin === window.location.origin) { window.opener.focus(); window.close(); return; }
    } catch (err) { /* cross-origin opener: fall through */ }
    window.location.assign('/');
  };

  const sectionLabel = (s) => t(s === 'user' ? 'help.viewer.section.user' : 'help.viewer.section.admin');

  return (
    <div style={{ '--cds-interactive-01': BRANDING.primaryColor }}>
      {/* Standalone header: no OpenELIS Header, side nav or Footer (FR-V-01a, FR-I-06). */}
      <Theme theme="g100">
        <Header aria-label={t('help.viewer.brand', { siteName: BANNER_TEXT })} style={{ position: 'relative', background: BRANDING.headerColor }}>
          <HeaderMenuButton aria-label={t('help.viewer.menu.toggle')} isActive={navOpen} onClick={() => setNavOpen(!navOpen)} isCollapsible />
          <HeaderName prefix="" href="/help">{t('help.viewer.brand', { siteName: BANNER_TEXT })}</HeaderName>
          <div style={{ flex: 1, maxWidth: 360, marginLeft: 16 }}>
            <Search size="sm" labelText={t('help.viewer.search.placeholder')} placeholder={t('help.viewer.search.placeholder')}
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <HeaderGlobalBar>
            <Tag type="outline" size="sm" style={{ alignSelf: 'center' }} onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}>{locale.toUpperCase()}</Tag>
            {narrow ? (
              <HeaderGlobalAction aria-label={t('help.viewer.return-to-app')} tooltipAlignment="end" onClick={onReturn}>
                <Undo size={20} />
              </HeaderGlobalAction>
            ) : (
              <Button kind="ghost" size="lg" renderIcon={Undo} onClick={onReturn}>{t('help.viewer.return-to-app')}</Button>
            )}
          </HeaderGlobalBar>
        </Header>
      </Theme>

      <Grid fullWidth condensed>
        {navOpen && loadError !== 'manifest' && (
          <Column sm={4} md={3} lg={4}>
          <SideNav aria-label={t('help.viewer.toc.label')} expanded isPersistent isChildOfHeader={false} style={{ position: 'relative', width: 280, height: 'auto' }}>
            <SideNavItems>
              {results ? (
                results.length === 0
                  ? <p style={{ padding: '1rem' }}>{t('help.viewer.search.no-results', { query })}</p>
                  : results.map((p) => (
                      <SideNavMenuItem key={p.slug} href={`/help/${p.slug}`} onClick={(e) => { e.preventDefault(); setQuery(''); route.push(p.slug); }}>{p.title}</SideNavMenuItem>))
              ) : tree.map((s, i) => (
                <React.Fragment key={s.section}>
                  {i > 0 && <SideNavDivider />}
                  <li style={{ padding: '1rem 1rem 0.25rem', fontSize: 12, fontWeight: 600 }}>{sectionLabel(s.section)}</li>
                  {s.folders.map((f) => (
                    <SideNavMenu key={f.slug} title={f.title} defaultExpanded={f.pages.some((p) => p.slug === route.slug)}>
                      {f.pages.map((p) => (
                        <SideNavMenuItem key={p.slug} href={`/help/${p.slug}`} isActive={p.slug === route.slug}
                          onClick={(e) => { e.preventDefault(); route.push(p.slug); }}>{p.title}</SideNavMenuItem>
                      ))}
                    </SideNavMenu>
                  ))}
                </React.Fragment>
              ))}
            </SideNavItems>
          </SideNav>
          </Column>
        )}

        <Column as="main" sm={4} md={navOpen ? 5 : 8} lg={navOpen ? 12 : 16} style={{ paddingBlock: 'var(--cds-spacing-07)' }}>
          {loadError === 'manifest' && (
            <InlineNotification kind="error" lowContrast hideCloseButton title={t('help.viewer.error.manifest')} />
          )}
          {loadError !== 'manifest' && !route.slug && (
            <section>
              <h1 className="cds--type-heading-05">{t('help.viewer.brand', { siteName: BANNER_TEXT })}</h1>
              <p className="cds--type-body-02" style={{ marginBlock: 'var(--cds-spacing-03) var(--cds-spacing-06)' }}>{t('help.viewer.landing.lead')}</p>
              <Grid condensed>
                {tree.map((s) => (
                  <Column key={s.section} sm={4} md={4} lg={8}>
                    <Tile>
                      <h2 className="cds--type-heading-03">{sectionLabel(s.section)}</h2>
                      {s.folders.map((f) => (
                        <div key={f.slug} style={{ marginTop: 'var(--cds-spacing-05)' }}>
                          <p className="cds--type-heading-compact-01">{f.title}</p>
                          {f.pages.map((p) => (
                            <div key={p.slug}><Link href={`/help/${p.slug}`} onClick={(e) => { e.preventDefault(); route.push(p.slug); }}>{p.title}</Link></div>
                          ))}
                        </div>
                      ))}
                    </Tile>
                  </Column>
                ))}
              </Grid>
            </section>
          )}
          {loadError !== 'manifest' && !page && route.slug && (
            <InlineNotification kind="error" lowContrast hideCloseButton
              title={t('help.viewer.error.not-found.title')} subtitle={t('help.viewer.error.not-found.body')} />
          )}
          {loadError !== 'manifest' && page && (
            <>
              <Breadcrumb noTrailingSlash>
                <BreadcrumbItem href="/help" onClick={(e) => { e.preventDefault(); route.push(null); }}>{t('help.viewer.breadcrumb.home')}</BreadcrumbItem>
                <BreadcrumbItem>{sectionLabel(page.section)}</BreadcrumbItem>
                <BreadcrumbItem>{(tree.find((s) => s.section === page.section)?.folders.find((f) => f.slug === page.folder.slug) || page.folder).title}</BreadcrumbItem>
                <BreadcrumbItem isCurrentPage>{page.title}</BreadcrumbItem>
              </Breadcrumb>
              <h1 className="cds--type-heading-05" style={{ marginTop: 'var(--cds-spacing-05)' }}>
                {page.title}{' '}
                {isFallback && <Tag type="gray">{t('help.viewer.fallback.tag')}</Tag>}
              </h1>
              {/* FR-V-12: latest version online */}
              <Link href={page.sourceUrl} target="_blank" rel="noopener noreferrer" renderIcon={Launch} style={{ marginBlock: 'var(--cds-spacing-03) var(--cds-spacing-05)' }}>
                {t('help.viewer.link.latest')}<span className="cds--visually-hidden"> {t('help.viewer.link.online')}</span>
              </Link>
              {/* FR-V-13: WIP notice */}
              {page.wip && <InlineNotification kind="info" lowContrast hideCloseButton title="" subtitle={t('help.viewer.wip.notice')} />}
              {loadError === 'page' ? (
                <InlineNotification kind="error" lowContrast hideCloseButton title={t('help.viewer.error.page.title')}
                  subtitle={<>
                    <Link href="#" onClick={(e) => { e.preventDefault(); setLoadError(null); }}>{t('help.viewer.error.page.retry')}</Link>{'  '}
                    <Link href="/help" onClick={(e) => { e.preventDefault(); setLoadError(null); route.push(null); }}>{t('help.viewer.error.page.home')}</Link>
                  </>} />
              ) : loading
                ? <SkeletonText paragraph lineCount={5} />
                : <Tile style={{ background: 'transparent', padding: 0 }}>
                    {/* Real code: dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, HELP_PURIFY_CONFIG) }} */}
                    <div className="oe-help-content" onClick={onContentClick} dangerouslySetInnerHTML={{ __html: html }} />
                  </Tile>}
            </>
          )}
        </Column>
      </Grid>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------
 * FR-I-02: HelpMenu.jsx, the "manual" entry (sketch)
 *
 *   const useInApp = properties["org.openelisglobal.help.manual.useInApp"] !== "false";
 *   const openHelp = (type) => {
 *     if (type === "manual" && useInApp) {
 *       window.open("/help", "_blank");      // no feature string: keeps window.opener
 *       handlePanelToggle("");
 *       return;
 *     }
 *     const url = helpUrls[type];
 *     if (url) { window.open(url, "_blank"); handlePanelToggle(""); }
 *   };
 *
 * FR-I-06: Layout.jsx standalone mode for /help (sketch)
 *
 *   const isStandaloneRoute = location.pathname === "/help" || location.pathname.startsWith("/help/");
 *   ...inside the providers:
 *   {isStandaloneRoute ? children : (<div className="d-flex ..."><Header .../> ... <Footer /></div>)}
 * ------------------------------------------------------------------------------------------ */
