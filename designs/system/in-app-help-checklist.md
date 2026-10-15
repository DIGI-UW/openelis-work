# FRS Quality Checklist — In-App Help System

**Companion to:** `help-menu.md` (FRS v1.2, 2026-10-15)
**Purpose:** "Unit tests for English." Validate that the FRS is complete, unambiguous, and ready for implementation. Run before creating the OGC Jira story.

**How to use:** Walk through each item. If you can't answer "yes" or point to a line in the FRS, that's a gap to fill. Items marked **CRITICAL** block implementation; the rest are quality polish.

---

## i18n / Localization

- [ ] Every viewer-emitted UI string has an i18n key listed in section 6 of the FRS (CRITICAL — constitution principle 1).
- [ ] Each key follows the `[category].[feature].[identifier]` convention (e.g., `help.viewer.search.placeholder`).
- [ ] Error messages, button labels, placeholders, and accessibility labels are all covered.
- [ ] The locale fallback behavior is specified for every text surface — both UI chrome (handled by the existing i18n provider) AND help content body (handled by FR-V-02's English fallback + Tag badge).
- [ ] Pipeline output paths use `/<locale>/` segments so additional locales can be added without code changes (FR-P-04, FR-V-02).
- [ ] The "Available in English only" Tag appears on any page missing in the active locale, (AC-13). Every page has the "View the latest version online" link (AC-18).

## Permissions & Security

- [ ] The `/help` route is a `SecureRoute` — authenticated users only (FR-S-01, FR-I-01). (CRITICAL)
- [ ] No new permission key is introduced for v1 — any logged-in user may read help. Confirm this is intentional.
- [ ] DOMPurify is required before every `dangerouslySetInnerHTML` assignment (FR-S-02, FR-V-05). (CRITICAL)
- [ ] The DOMPurify allowlist is enumerated: which tags, which attributes, which class names (FR-S-02).
- [ ] External links rendered from content carry `rel="noopener noreferrer"` and `target="_blank"`.
- [ ] The Confluence API token never appears in committed output (FR-S-04). (CRITICAL)
- [ ] The pipeline refuses remote SVG content (FR-S-03 — SVG can carry scripts).
- [ ] `window.open("/help", "_blank")` with no feature string keeps `window.opener` for Return to OpenELIS; the opener is used only after a same-origin check (FR-I-02, FR-V-01b).

## Carbon Design System

- [ ] The viewer uses Carbon `UIShell SideNav` / `SideNavItems` / `SideNavMenu` / `SideNavMenuItem` / `SideNavLink` for the TOC (FR-V-03). (CRITICAL — constitution principle 2)
- [ ] The viewer uses Carbon `Search` for the search input (FR-V-07).
- [ ] The viewer uses Carbon `Breadcrumb` for the path-from-root (FR-V-09).
- [ ] Loading states use Carbon `SkeletonText` / `Loading`, not custom spinners (FR-V-10).
- [ ] Error notifications use Carbon `InlineNotification` (FR-V-11).
- [ ] No hardcoded colors anywhere in the viewer — primary/secondary/accent come from CSS variables sourced from the Site Branding API (FR-V-01c).
- [ ] No Bootstrap, Tailwind, or external CSS classes used.
- [ ] Carbon DataTable styling applied to `.oe-help-table` so rendered Confluence tables look native.
- [ ] Carbon InlineNotification styling applied to `.oe-help-callout--note/info/warning` so promoted blockquotes look native.

## Pipeline correctness

- [ ] Idempotent runs produce byte-identical output (FR-P-13, AC-1). (CRITICAL — without this, every refresh PR is noisy.)
- [ ] Image filenames are content-hashed for stable dedupe (FR-P-08).
- [ ] Cross-page links are resolved in a two-pass build (FR-P-10).
- [ ] Internal Confluence URLs are rewritten to `/help/<slug>` (FR-P-10, AC-3).
- [ ] Hierarchy and order come from Confluence parent ids and child position, never from titles (FR-P-03).
- [ ] Slug collisions are resolved deterministically (FR-P-04 — numeric suffix).
- [ ] Every ADF node type in the committed corpus survey (`help-corpus-survey.json`) has a handler, including `panel`, `expand`, `inlineCard` and `status` (FR-P-05). (CRITICAL)
- [ ] Every mark seen in the corpus has a handler: `strong`, `em`, `code`, `link`, `underline`, `border` (FR-P-06).
- [ ] Unknown ADF node types and unknown extension macros emit a visible reviewer placeholder, not a silent failure (FR-P-05, edge case row).
- [ ] Build logs surface: total pages, total images, image failures, broken internal links, unknown macros (FR-P-14).

## Viewer behavior

- [ ] Deep links via URL hash work and scroll to the heading (FR-V-06, AC-6). (CRITICAL — required for shareable support links.)
- [ ] Search response time ≤150 ms p95, keystroke to results (NFR-03).
- [ ] Side rail collapses below 480px viewport so the help tab can be docked as a narrow strip beside OpenELIS (§5.1).
- [ ] Internal cross-page links in rendered content use `history.push`, not full page reload (FR-V-08).
- [ ] "Return to OpenELIS" closes the tab when opened via `window.open`, navigates to `/home` otherwise (FR-V-01b, AC-8a).
- [ ] The standalone header does NOT render the OpenELIS UIShell side menu, dashboard tiles, or module navigation (FR-V-01a, AC-5).

## Branding integration

- [ ] Help tab fetches `GET /rest/site-branding/` at mount (FR-V-01c).
- [ ] Branding is applied with the existing `loadAndApplyBranding()` (`--site-branding-header`, `--cds-interactive-01`, `--cds-interactive-02`, favicon); no new color logic (FR-V-01c). (CRITICAL)
- [ ] `headerLogoUrl` is used as the brand mark with `/images/openelis_logo.png` fallback.
- [ ] `faviconUrl` is applied to `<link rel="icon">`.
- [ ] Brand text uses `help.viewer.brand` with the deployment's `BANNER_TEXT` (FR-V-01c).
- [ ] If the branding endpoint is unavailable, the viewer renders with default branding and does NOT block the rest of the load (FR-V-01d). (CRITICAL — the help system can't fail because branding is broken.)
- [ ] AC-5a validates that custom branding actually shows up in the help tab.

## Acceptance criteria quality

- [ ] Every AC in section 10 is observable, specific, and falsifiable (something a QA could test). (CRITICAL)
- [ ] Every AC traces to a specific FR (the FR is referenced in parentheses).
- [ ] Edge cases are covered (network failures, missing locale, broken slugs, missing branding).
- [ ] The a11y criterion (AC-15) names a tool (`@axe-core/playwright` in the existing Playwright suite) and a threshold (zero critical/serious), in both locales.
- [ ] AC-1 (idempotent output) names a verification method (byte comparison).

## FRS–mockup alignment

- [ ] Every functional requirement has at least one corresponding UI element or behavior in the mockup.
- [ ] Every UI element in the mockup traces to a requirement.
- [ ] The mockup renders branding from the same Site Branding API (the `useSiteBranding` hook in `HelpViewer-mockup.jsx`).
- [ ] The mockup demonstrates the "Return to OpenELIS" header link.
- [ ] The preview demonstrates the new-tab open flow visually.

## Non-functional & resilience

- [ ] Offline operation requirement is testable — section 8 specifies "no runtime calls to Atlassian, Google CDN, or any external service" (NFR-01).
- [ ] Initial paint target (≤500ms on 4G) is named (NFR-02).
- [ ] Bundle size guardrail (≤25 MB for v1 corpus) is specified, with a fallback plan (Git LFS) if exceeded (NFR-04).
- [ ] Pipeline runtime target (≤90s for full v1 refresh) is specified (NFR-05).
- [ ] a11y target (WCAG 2.1 AA) is named (NFR-06).

## Scope clarity

- [ ] Section 11 (Out of Scope) is explicit: no in-app editing, no print view, no feedback widget, no analytics, no contextual help launcher (v1).
- [ ] Section 12 records the corpus decision: user and administrator guides, legacy copies excluded, English and French at launch.
- [ ] Section 12 records the rollout decision: phased via property, default useInApp=true in v1.
- [ ] The four open questions are explicitly closed (or named as still-open).

---

## v1.1 additions (2026-10-15)

- [ ] Corpus config lists the English and French guide root folders, and the excluded folders (FR-P-03, FR-P-16, 4.5).
- [ ] A 3.3.0 build contains no `(before 3.3.0)` / `(avant 3.3.0)` page and nothing from the LEGACY Versions folders; `(legacy screen)` pages are kept (AC-3). (CRITICAL)
- [ ] Confluence attachments (`media type: "file"`) are downloaded with authentication; image paths are absolute `/help-content/assets/...` (FR-P-08, AC-5). (CRITICAL)
- [ ] French pages are matched to their English source page id and share its slug (FR-P-15).
- [ ] Provenance sections are stripped and WIP panels become the standard notice (FR-P-17, AC-6).
- [ ] `Layout` renders `/help` routes without Header, side nav or Footer, and no other route changes (FR-I-06, AC-7). (CRITICAL)
- [ ] Size budget is enforced by the refresh script (NFR-04, FR-P-18).
- [ ] `applies-vX-Y` version labels override the title rule when present (FR-P-16, AC-19).
- [ ] The manual refresh procedure (section 13.1) is on the release checklist, and the converter runs against committed fixtures in frontend tests. (CRITICAL)

## Severity summary

If you can answer "yes" to every CRITICAL item above, the FRS is implementation-ready. Track any remaining "no" answers as gaps to resolve before opening the OGC Jira story.

CRITICAL items count: **16** (v1.0 items as revised, plus the v1.1 additions: legacy exclusion, attachments, standalone layout, release refresh procedure).
