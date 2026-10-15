# FRS: OpenELIS Global In-App Help System

**Version:** 1.2
**Date:** 2026-10-15
**Author:** Casey Iiams-Hauser
**Status:** Ready for implementation
**Jira:** [OGC-737](https://uwdigi.atlassian.net/browse/OGC-737)
**Target release:** OpenELIS Global 3.3.0 (first release with in-app help)

---

## What changed in v1.2

v1.2 (2026-10-15, same day) simplifies v1.1 after review:

- **Refresh is manual, at release cut** (section 13). The proposed GitHub Actions workflow, its three triggers, CI gates and shared service account are dropped for v1. One command, run by the release manager, output reviewed as a normal pull request.
- **"View the latest version online"** link on every page, to its Confluence page (FR-V-12). This covers changes made between releases without any runtime dependency.
- **Authoring conventions** (section 13.3), adopted into the [user manual style guide](https://uwdigi.atlassian.net/wiki/spaces/OG/pages/1529872422) on 2026-10-15: version-applicability labels and `helpkey` labels. The pipeline honours version labels when present (FR-P-16).
- **Mockups updated** to v1.2: the HTML preview and JSX mockup show both guides, English and French, the fallback Tag, the WIP notice, the latest-online link and the 480 px layout.
- **Deferred:** the outdated-translation Tag and old-slug aliases (section 11).

## What changed in v1.1

v1.0 (2026-05-12) was written against the legacy "PART 1-16" User Manual. Between May and October the Confluence documentation was restructured and translated, and the frontend moved on. v1.1 re-bases the spec on what exists today.

| Area | v1.0 | v1.1 |
|---|---|---|
| Corpus | User Manual subtree under folder `261455874` ("PART N" pages), Admin Manual out of scope | The topic-folder manual created in the Sept 2026 reorg, **user and administrator folders both in scope** (FR-P-03) |
| Locales | English only at launch; one Confluence space per locale matched via `helpkey:` labels | **English and French at launch.** French is a parallel folder tree in the same space; pages are matched to their English source page id (FR-P-15) |
| Legacy pages | Not addressed | "(before X.Y.Z)" copies and the LEGACY Versions folders are **excluded** from a release build; "(legacy screen)" pages stay (FR-P-16) |
| Images | External (Google-hosted) URLs only | Confluence **attachments** (`media type: "file"`) downloaded through the authenticated API; external URLs still supported (FR-P-08) |
| ADF coverage | No `panel` handler | `panel`, `expand`, `inlineCard`, `status` and the rest of the live corpus survey (FR-P-05) |
| Authoring artifacts | Not addressed | Provenance sections stripped; "Work in progress" panels replaced by a standard viewer notice (FR-P-17) |
| Viewer shell | Mounted inside `App.jsx` `<Switch>` but required to have no OpenELIS chrome (impossible as written) | `Layout` gets a standalone mode for `/help` routes (FR-I-06) |
| Opening the tab | `"noopener=no,noreferrer"` (contradictory: `noreferrer` nulls `window.opener`) | `window.open("/help", "_blank")` with no feature string (FR-I-02) |
| Branding | `accentColor` and an unnamed "site name" property | Reuse `loadAndApplyBranding()`; site name is `BANNER_TEXT` (FR-V-01c) |
| Asset paths | Relative `assets/<hash>` (breaks under `/help/<slug>`) | Absolute `/help-content/assets/<hash>.<ext>`, shared across locales (FR-P-08) |
| Size | ≤25 MB target, current PNG set is 36 MB | Pipeline resizes and converts to WebP; budget enforced by the refresh script (NFR-04) |
| Dependencies | "Zero deps" pipeline that also builds a FlexSearch index | Named dependencies (section 8.1) |
| i18n API | `t(key, fallback)` | `react-intl` `intl.formatMessage({ id })`, keys in `en.json` and `fr.json` |
| a11y test | Manual Axe DevTools scan | Existing Playwright + `@axe-core/playwright` setup |
| Refresh | Maintainer runs a script locally | Manual at release cut with a checklist item and a reviewable PR (section 13; see v1.2) |

The dev bundle (`in-app-help-dev-bundle.zip`) is still useful for the converter's core node handling, but its 16 ADF fixtures and 402 Google-hosted PNGs describe the **old** manual. Re-pull fixtures from the new folders before building against them (AC-2).

---

## 1. Overview

OpenELIS Global surfaces user-facing help by opening an external URL in a new browser tab. That depends on internet access, gives no in-app navigation, search or deep linking, and cannot follow the user's language.

This feature replaces the external link with an in-app help viewer. Help content stays authored in Confluence (authoring workflow unchanged). A build-time pipeline exports it into static assets that ship with each OpenELIS release, and a Carbon-based viewer renders it in its own browser tab with a side-nav table of contents, full-text search and deep-linkable URLs, in English and French.

Two cooperating components:

- **Help Refresh Pipeline**: a Node.js script, run by hand at release cut (section 13). It walks the configured Confluence folders through the REST v2 API, converts ADF JSON to sanitized HTML chunks, downloads and optimizes images, resolves cross-page links, builds a TOC manifest and a search index per locale, and writes the output to `frontend/public/help-content/`. Output is committed and ships with the release.
- **Help Viewer**: a React component (`HelpViewer.jsx`) at `/help/:slug?`, opened in a new tab. It renders the active page's pre-built HTML through DOMPurify and provides side-nav navigation, search, deep links and locale fallback.

Settled decisions (revisit only with the product lead): Confluence is the source of truth; the pipeline is build-time only, with no runtime calls to Atlassian; content is version-pinned to each release.

---

## 2. User Stories

1. **As a lab technician**, I want the help to open in a separate browser tab so that I can keep my OpenELIS workflow visible alongside it.
2. **As a lab manager in a facility with unreliable internet**, I want help available offline, so staff can rely on it during normal operations.
3. **As a lab technician**, I want to search all help topics by keyword, so I can find the right page without browsing the whole table of contents.
4. **As a support engineer**, I want to send a colleague a direct link to a section of a help page.
5. **As a French-speaking lab technician**, I want the help in French when my OpenELIS session is in French, and to be told clearly when a page is only available in English.
6. **As a lab administrator**, I want the administrator guide in the same help viewer, so I don't need a second source for configuration tasks.
7. **As a documentation maintainer**, I want to keep authoring in Confluence and have each release's help refreshed through a reviewable pull request.
8. **As a lab technician**, I want to reach the newest online version of a page when I have internet, in case it changed after my release.

---

## 3. Functional Requirements

### 3.1 Pipeline (build-time)

| ID | Requirement |
|---|---|
| FR-P-01 | The pipeline MUST accept either saved ADF JSON fixtures (`--fixtures <dir>`, for offline development and tests) or live Confluence (`--live`). |
| FR-P-02 | In live mode the pipeline MUST authenticate with environment variables `CONFLUENCE_HOST`, `CONFLUENCE_EMAIL`, `CONFLUENCE_TOKEN`, and read pages with `GET /wiki/api/v2/pages/<id>?body-format=atlas_doc_format` plus the folder and children endpoints needed to walk the tree. |
| FR-P-03 | **Corpus.** The pipeline MUST walk the root folders listed per locale in `frontend/scripts/help-refresh.config.json` (see 4.5), preserving the Confluence parent/child hierarchy (folders and pages) in the manifest. Hierarchy and ordering MUST come from Confluence parent ids and child position, never from titles. The v1 English corpus is the topic-folder manual created in the Sept 2026 reorg, **both** the user-facing folders (Getting around OpenELIS; Orders and samples; Results, validation and reports; Pathology, immunohistochemistry and cytology; Environmental surveillance; Vector surveillance; Laboratory notebooks; Non-conforming events; Quality assurance) and the administrator folders (Getting started with administration; Users, organizations and providers; Test catalog; Site and system settings; Programs, rules and notifications; Result reporting and analyzers; Environmental and vector reference data). The top level of the TOC MUST show two sections, "User guide" and "Administrator guide". |
| FR-P-04 | Each page MUST be emitted to `<out>/<locale>/pages/<slug>.html`. The slug MUST be derived deterministically from the **English** page title (lower-case, ASCII-folded, emoji and punctuation removed); collisions resolved by a numeric suffix in Confluence tree order. A translated page MUST use the slug of its English source page (FR-P-15), so `/help/<slug>` names the same topic in every locale. |
| FR-P-05 | **ADF coverage.** The pipeline MUST handle every ADF node and mark type present in the live corpus. Before implementation, run a corpus survey (count of node types, marks and extension keys across all pages in scope) and commit it as `frontend/scripts/help-corpus-survey.json`. At minimum: `doc`, `paragraph`, `heading` (1-6), `text`, `hardBreak`, `rule`, `bulletList`, `orderedList` (preserving `order`/`start`), `listItem`, `blockquote`, `codeBlock`, `taskList`, `taskItem`, `table` / `tableRow` / `tableHeader` / `tableCell` (honouring `colspan` / `rowspan`), `mediaSingle` / `media` / `caption`, **`panel`** (mapped by `panelType`: info, note, warning, error, success → `oe-help-callout--<type>`), `expand` / `nestedExpand` (→ `<details><summary>`), `inlineCard` / `blockCard` (→ link, resolved as in FR-P-10), `status` (→ `oe-help-status` span), `emoji` (→ its text fallback), `mention` and `date` (→ plain text), `layoutSection` / `layoutColumn` (flattened in order), and `extension` (drop `toc`; visible placeholder for any other macro key). |
| FR-P-06 | Marks: `strong`, `em`, `code`, `link`, `underline`, `strike`, `subsup`, `textColor` (dropped), and the Confluence `border` mark on media (→ CSS class). |
| FR-P-07 | Blockquotes starting with `Note:`, `Warning:`, `Caution:`, `Verify:`, `Tip:`, `Info:` (and their French equivalents `Remarque :`, `Attention :`, `Avertissement :`, `Vérifier :`, `Astuce :`) or the emoji prefixes `⚠️`, `💡`, `ℹ️` MUST be emitted as callouts, as in v1.0. Panels (FR-P-05) are the preferred authoring form going forward. |
| FR-P-08 | **Images.** The pipeline MUST download every image the corpus references: (a) `media` with `type: "file"`: resolve the media `id` against the page's attachments (`GET /wiki/api/v2/pages/<id>/attachments`, match on `fileId`) and download with the same credentials; (b) `media` with `type: "external"`: plain HTTPS GET. Each image MUST be resized to a maximum width of 1600 px, converted to WebP (PNG kept only where WebP is larger), and stored once at `<out>/assets/<sha256-prefix>.<ext>`, shared across locales so identical screenshots dedupe. The `<img src>` MUST be the absolute path `/help-content/assets/<hash>.<ext>`. The media `alt` attribute MUST become the `<img alt>`; when absent, use the caption text. |
| FR-P-09 | Failed downloads MUST NOT abort the build. The element is emitted with `data-download-failed="true"` and class `oe-help-img--unresolved`, and counted in the manifest's `imagesFailed`. No remote `src` is emitted for an attachment (it would require Confluence auth); a visible placeholder is shown instead. |
| FR-P-10 | **Links**, two passes. Pass 1 walks and slugs every page in all locales; pass 2 renders. Any link whose URL contains `/pages/<numericId>` (any space key or case, e.g. `/wiki/spaces/oeg/pages/272760837`) or a tiny link that resolves to a page id MUST be rewritten: to `/help/<slug>` when the target is in the bundled corpus; otherwise to the canonical Confluence URL with class `oe-help-link--online` and `target="_blank"` (the viewer marks these as needing internet). Links that cannot be resolved at all get `data-broken-link="true"` and a visible `[broken link]` suffix. |
| FR-P-11 | One `manifest.json` per locale with: `locale`, `releaseVersion`, `generatedFrom` (ISO timestamp of the newest page version included, not wall-clock time, so output stays byte-identical), `sourceSpaceId`, and `pages` (ordered tree; each node: `slug`, `title`, `pageId`, `sourcePageId` (English id; equals `pageId` for English), `sourceUrl` (canonical Confluence URL of this page, by page id), `sourceVersion` (French only: the English version the translation was made from; recorded for a future outdated-translation Tag), `kind` (`folder` or `page`), `parentSlug`, `headings` (`level`, `text`, `slug`), `labels`, `wip` (boolean), `children`, `images`, `imagesFailed`). |
| FR-P-12 | One FlexSearch document index per locale at `<out>/<locale>/search-index.json`. Field weights: title 4, headings 2, body 1. English and French stop-word lists are mandatory at launch; other locales configurable. |
| FR-P-13 | Idempotent: two runs with no Confluence change MUST produce byte-identical output (stable key order, stable sort, no wall-clock timestamps, deterministic image encoding). |
| FR-P-14 | End-of-run summary, written to stdout and to `<out>/refresh-report.json` (not shipped to the browser): pages per locale, images downloaded, images failed, broken links, links to online-only pages, unknown node types and macros, pages excluded by FR-P-16 and why, French pages whose `sourceVersion` is behind the English version (report only), total output size. |
| FR-P-15 | **Translations.** The French corpus is the parallel folder tree in the same space ("Guide de l'utilisateur" `1704591386`, "Guide de l'administrateur" `1702396037`). Each French page MUST be matched to its English source page id using the translation tool's metadata (Lango content property, if exposed by the API); if unavailable, from the English page linked in the page's translation banner ("Cette page est une traduction de la page anglaise ..."). Unmatched French pages are reported in FR-P-14 and excluded. The translation banner itself MUST be removed from the rendered body; its information is kept in `sourceVersion`. |
| FR-P-16 | **Release pinning and legacy exclusion.** The config sets `releaseVersion` (e.g. `3.3.0`). The pipeline MUST exclude: the LEGACY Versions folders (English `1657864193`, French "Versions précédentes" `1679458382`) and everything under them; any page whose title ends in `(before <X.Y.Z>)` where `<X.Y.Z>` ≤ `releaseVersion` (and its French equivalent `(avant <X.Y.Z>)`); and the non-manual folders (Archived `1343979525`, Documentation Translations `1640824834`, Translation Sync Reports `1641644033`, and the authoring/review area). **Version labels take precedence:** if a page carries one or more `applies-vX-Y` labels (section 13.3), it is included only when `releaseVersion` matches one of them; the title rule applies only to pages without such labels. Pages titled `... (legacy screen)` MUST be **kept**: they describe screens still reachable in the release through configuration. Links to excluded pages resolve to the online Confluence URL per FR-P-10. |
| FR-P-17 | **Authoring-only content.** The pipeline MUST (a) remove the `Provenance` H2 section (heading through the next H2 or end of page) and its French equivalent `Provenance`; (b) replace a warning panel whose first strong text is `Work in progress.` / `Travail en cours.` with a marker the viewer renders as the standard notice `help.viewer.wip.notice`, and set `wip: true` in the manifest; (c) keep the `<Type> · <Audience>` label line, rendered as `oe-help-label`. (d) exclude pages labelled `doc-blocked`; pages in review (WIP) are included with the notice. Both rules are config switches. |
| FR-P-18 | The pipeline MUST refuse to write output that exceeds the size budget (NFR-04) unless run with `--allow-oversize`, and MUST exit non-zero on fatal errors. |

### 3.2 Viewer (runtime)

| ID | Requirement |
|---|---|
| FR-V-01 | `HelpViewer.jsx` is mounted at `/help/:slug?` as a `SecureRoute` in `App.jsx`, using `react-router-dom` v5 idioms (`useParams()`, `useHistory()`). It is intended to be opened in its own tab (FR-I-02). |
| FR-V-01a | On `/help` routes the page MUST NOT render the OpenELIS Header, side nav, dashboard or Footer (see FR-I-06). The viewer renders its own Carbon `Header` (48 px): brand mark, brand text, `Search`, locale indicator, "Return to OpenELIS", and below 1024 px a hamburger toggle for the TOC. |
| FR-V-01b | "Return to OpenELIS": if `window.opener` exists and is same-origin (checked in a `try`/`catch` reading `window.opener.location.origin`), call `window.opener.focus()` then `window.close()`. Otherwise navigate to `/`. |
| FR-V-01c | **Branding.** At mount the viewer MUST call the existing `loadAndApplyBranding()` from `components/utils/BrandingUtils.ts` (sets `--site-branding-header`, `--cds-interactive-01`, `--cds-interactive-02` and the favicon, exactly as the main app does), and use `headerLogoUrl` (prefixed with `config.serverBaseUrl`) as the brand mark, falling back to the same default logo the main Header uses. The header background uses `--site-branding-header`. Brand text is `help.viewer.brand` with `{siteName}` = `configurationProperties.BANNER_TEXT` from `ConfigurationContext` (e.g. "Madagascar OpenELIS Help"); if `BANNER_TEXT` is empty, use `help.viewer.title`. No colors are hard-coded. |
| FR-V-01d | If branding or configuration properties fail to load, the viewer renders with defaults and does not block. |
| FR-V-02 | **Locale.** The active locale is the one the app's `IntlProvider` is using. On mount and on locale change the viewer fetches `/help-content/<locale>/manifest.json`; if absent, it loads `/help-content/en/manifest.json`. For any page missing in the active locale, it loads the English page and shows a Carbon `Tag` `help.viewer.fallback.tag` next to the title. |
| FR-V-03 | Left navigation uses Carbon UIShell `SideNav` with the manifest tree: two top sections ("User guide", "Administrator guide"), folders as collapsible `SideNavMenu`, pages as `SideNavMenuItem`. The active page is highlighted and its ancestors expanded. |
| FR-V-04 | Selecting an entry sets the route to `/help/<slug>`; a direct visit to `/help/<slug>` loads that page and highlights it. `/help` with no slug shows a landing page listing the two guides and their folders. |
| FR-V-05 | Page HTML is fetched from `/help-content/<locale>/pages/<slug>.html` and passed through DOMPurify (config in FR-S-02) before `dangerouslySetInnerHTML`. Manifest and page fetches send `Cache-Control: no-cache`. |
| FR-V-06 | `/help/<slug>#<heading-id>` scrolls the heading into view after render. |
| FR-V-07 | Carbon `Search` in the header queries the locale's `search-index.json`, lazy-loaded on first focus. Results replace the TOC as a filtered list with highlighted snippets; Escape or clearing restores the TOC. Shortcut `/` focuses search. |
| FR-V-08 | Clicks on `/help/` links inside content use `history.push`. Links with `oe-help-link--online` open in a new tab and carry a visually hidden suffix `help.viewer.link.online` ("opens online documentation"). |
| FR-V-09 | Carbon `Breadcrumb` above the content: guide → folder(s) → page. |
| FR-V-10 | Loading states use Carbon `SkeletonText` / `InlineLoading`. |
| FR-V-11 | Error states use Carbon `InlineNotification`: manifest failure; page failure (retry + back to help home); unknown slug (not found + back to help home). |
| FR-V-12 | **Latest version online.** Every page shows a link `help.viewer.link.latest` under the title, to the page's `sourceUrl` (Confluence), opening in a new tab with the `help.viewer.link.online` hint. The bundled page remains the default; the link is for readers who have internet and want changes made after their release. |
| FR-V-13 | Pages with `wip: true` show an `InlineNotification kind="info"` (`help.viewer.wip.notice`) above the body. |

### 3.3 Integration

| ID | Requirement |
|---|---|
| FR-I-01 | `/help/:slug?` is a `SecureRoute` alongside the other top-level routes in `App.jsx`. |
| FR-I-02 | `HelpMenu.jsx` `openHelp(type)`: for `type === "manual"` and in-app mode (FR-I-04), call `window.open("/help", "_blank")` with **no feature string** (so `window.opener` is kept for FR-V-01b; same-origin, so this is safe), then `handlePanelToggle("")`. This path MUST NOT depend on `org.openelisglobal.help.manual.url` being set; the current early return on an empty URL applies only to legacy mode. |
| FR-I-03 | The other two Help menu entries keep their current behavior. (Their labels currently map `tutorials` → `banner.menu.help.about` and `release-notes` → `banner.menu.help.contact`; confirm this is intended while in the file, but changing it is out of scope.) |
| FR-I-04 | New property `org.openelisglobal.help.manual.useInApp`, default `true`, added to `volume/properties/common.properties`. It is already exposed by `GET /rest/properties` (which returns every `org.openelisglobal.*` key), so no backend code is needed. Missing or any value other than `false` means in-app. When `false` and the URL property is non-empty, `HelpMenu` uses the legacy `window.open(url, "_blank")`. Update the default `org.openelisglobal.help.manual.url` to the documentation space home, since folder `261455874` no longer holds the manual. |
| FR-I-05 | Bundled content lives at `frontend/public/help-content/` (`assets/` shared, `<locale>/` per locale) and is served by Vite (dev) and the frontend nginx (prod) as `/help-content/...`. |
| FR-I-06 | **Standalone shell.** `Layout.jsx` currently renders `Header` and `Footer` around every route. Add a standalone check (`pathname === "/help" \|\| pathname.startsWith("/help/")`, alongside the existing `isFocusedAuthRoute`). When true, `Layout` keeps its context providers (`ConfigurationContext`, `TranslationOverrideProvider`, `NotificationContext`) and renders `children` without `Header`, `Footer` or the `Content` wrapper. No other route changes behavior. |

---

## 4. Data Model

### 4.1 Output layout

```
frontend/public/help-content/
  assets/<hash>.webp            # shared by all locales
  en/manifest.json
  en/search-index.json
  en/pages/<slug>.html
  fr/manifest.json
  fr/search-index.json
  fr/pages/<slug>.html
frontend/scripts/help-refresh.mjs
frontend/scripts/help-refresh.config.json
frontend/scripts/help-corpus-survey.json
```

### 4.2 `manifest.json` (abridged)

```json
{
  "locale": "fr",
  "releaseVersion": "3.3.0",
  "generatedFrom": "2026-10-13T19:20:00Z",
  "sourceSpaceId": "52559895",
  "pages": [
    {
      "slug": "user-guide",
      "title": "Guide de l'utilisateur",
      "kind": "folder",
      "pageId": "1704591386",
      "sourcePageId": "<english user guide folder id>",
      "parentSlug": null,
      "children": [
        {
          "slug": "print-a-work-plan",
          "title": "Imprimer un plan de travail",
          "kind": "page",
          "pageId": "<french page id>",
          "sourcePageId": "272760837",
          "sourceVersion": 3,
          "parentSlug": "laboratory-notebooks",
          "labels": [],
          "wip": true,
          "headings": [{ "level": 2, "text": "En bref", "slug": "en-bref" }],
          "children": [],
          "images": 4,
          "imagesFailed": 0
        }
      ]
    }
  ]
}
```

### 4.3 Page chunk

A self-contained HTML fragment. Image sources are absolute `/help-content/assets/...`. Internal links are `/help/<slug>`. Headings carry stable `id`s derived from their text (collision suffixes as for slugs).

### 4.4 CSS class contract (pipeline → viewer)

| Class | Purpose |
|---|---|
| `oe-help-figure`, `--wide` / `--center` / `--left` / `--right` | Image + caption wrapper and layout |
| `oe-help-img`, `oe-help-img--bordered`, `oe-help-img--unresolved` | Image, border mark, failed download |
| `oe-help-table-wrap`, `oe-help-table` | Scrollable table wrapper and table (styled like Carbon DataTable) |
| `oe-help-callout`, `--note` / `--info` / `--warning` / `--error` / `--success` | Callouts from panels and promoted blockquotes (styled like Carbon InlineNotification) |
| `oe-help-label` | The `<Type> · <Audience>` line |
| `oe-help-status` | ADF `status` lozenge (styled like Carbon Tag) |
| `oe-help-expand` | `<details>` from `expand` |
| `oe-help-wip` | Marker replaced by the viewer's WIP notice |
| `oe-help-link--online` | Link to Confluence content not in the bundle |
| `oe-help-tasklist` | Task list |
| `oe-help-unsupported` | Visible placeholder for unknown macros |

### 4.5 `help-refresh.config.json`

```json
{
  "releaseVersion": "3.3.0",
  "spaceKey": "OG",
  "locales": {
    "en": {
      "sections": [
        { "slug": "user-guide", "rootFolderId": "<English user guide folder>" },
        { "slug": "administrator-guide", "rootFolderId": "<English administrator guide folder>" }
      ]
    },
    "fr": {
      "sections": [
        { "slug": "user-guide", "rootFolderId": "1704591386" },
        { "slug": "administrator-guide", "rootFolderId": "1702396037" }
      ]
    }
  },
  "excludeFolderIds": ["1657864193", "1679458382", "1343979525", "1640824834", "1641644033"],
  "maxImageWidth": 1600,
  "sizeBudgetMB": 25
}
```

The English guide folder ids are the parents of the topic folders listed in FR-P-03 (for example "Getting around OpenELIS" `1680015437`, "Orders and samples" `1679458388`, "Test catalog" `1679786110`). Confirm them in Confluence when writing the config; if the topic folders have no common parent, list each topic folder under its section instead.

---

## 5. UX & Interaction

### 5.1 Layout

The viewer opens in its own tab and has its own header (FR-V-01a). The user sizes the tab themselves (split screen, second monitor or full screen).

- **Header (48 px, sticky, `--site-branding-header` background):** brand mark and brand text on the left, `Search` in the centre, "Return to OpenELIS" on the right. Below 1024 px a hamburger opens the TOC as an overlay.
- **Left rail (280 px):** `SideNav` with "User guide" and "Administrator guide".
- **Main pane (max-width 920 px):** breadcrumb, title with the English-only Tag when applicable, "View the latest version online" link, WIP notice when applicable, page body.

Must remain usable at 480 px and 360 px wide (AC-16).

### 5.2 Navigation flows

- **Open:** Help icon → "User Manual" → a new tab opens at `/help`; the OpenELIS tab is unchanged.
- **TOC, cross-page link, bookmark, search:** as v1.0 (SPA navigation inside the help tab; URLs shareable).
- **Link to online-only content, or "View the latest version online":** opens Confluence in a new tab; needs internet.
- **Return to OpenELIS:** focuses the opener and closes the help tab, or navigates to `/` when there is no opener.

### 5.3 Empty / loading / error states

| State | Treatment |
|---|---|
| Manifest loading | Three `SkeletonText` rows in the rail; skeleton paragraphs in the main pane |
| Page loading | Main-pane skeleton; rail stays interactive |
| Search index loading | `InlineLoading` in the search area |
| Manifest fails | `InlineNotification kind="error"`: `help.viewer.error.manifest` |
| Page fails | `InlineNotification` with "Try again" and "Back to help home" |
| Unknown slug | `InlineNotification` "Page not found" with link to help home |
| No search results | `help.viewer.search.no-results` |

### 5.4 Keyboard and screen readers

`/` focuses search; every TOC entry reachable by Tab, Enter activates; Carbon `SideNav` arrow-key behavior; callouts use `role="note"`; the hamburger has an `aria-label` and `aria-expanded`.

---

## 6. Localization

All viewer strings use `react-intl` (`intl.formatMessage({ id })` / `<FormattedMessage>`), matching the rest of the frontend. Keys MUST be added to `frontend/src/languages/en.json` **and** `fr.json`; other locales fall back through the existing mechanism.

| Key | English | French |
|---|---|---|
| `help.viewer.title` | Help | Aide |
| `help.viewer.brand` | {siteName} Help | Aide {siteName} |
| `help.viewer.return-to-app` | Return to OpenELIS | Retour à OpenELIS |
| `help.viewer.search.placeholder` | Search help… | Rechercher dans l'aide… |
| `help.viewer.search.no-results` | No results for "{query}" | Aucun résultat pour « {query} » |
| `help.viewer.search.loading` | Loading search… | Chargement de la recherche… |
| `help.viewer.breadcrumb.home` | Help | Aide |
| `help.viewer.section.user` | User guide | Guide de l'utilisateur |
| `help.viewer.section.admin` | Administrator guide | Guide de l'administrateur |
| `help.viewer.menu.toggle` | Show or hide contents | Afficher ou masquer le sommaire |
| `help.viewer.fallback.tag` | Available in English only | Disponible en anglais uniquement |
| `help.viewer.link.latest` | View the latest version online | Voir la dernière version en ligne |
| `help.viewer.wip.notice` | This page is still being reviewed, so some details may change. | Cette page est en cours de relecture ; certains détails peuvent changer. |
| `help.viewer.link.online` | (opens online documentation) | (ouvre la documentation en ligne) |
| `help.viewer.error.manifest` | Help content could not be loaded. Please contact your administrator. | Le contenu de l'aide n'a pas pu être chargé. Contactez votre administrateur. |
| `help.viewer.error.page.title` | Page could not be loaded | La page n'a pas pu être chargée |
| `help.viewer.error.page.retry` | Try again | Réessayer |
| `help.viewer.error.page.home` | Back to help home | Retour à l'accueil de l'aide |
| `help.viewer.error.not-found.title` | Page not found | Page introuvable |
| `help.viewer.error.not-found.body` | The help page you requested does not exist. | La page d'aide demandée n'existe pas. |
| `help.viewer.loading.page` | Loading… | Chargement… |

French strings are drafts; check them against the "French translation glossary and tracking (fr-v1)" page before merge. Existing keys `banner.menu.help.usermanual`, `banner.menu.help.about`, `banner.menu.help.contact` are unchanged.

Content inside page chunks is not translated by the viewer; it comes translated from Confluence.

---

## 7. Permissions & Security

| ID | Requirement |
|---|---|
| FR-S-01 | `/help` is a `SecureRoute`; any logged-in user may read help; no new permission. The static files under `/help-content/` are served without authentication by the frontend nginx; this is acceptable because the same content is public on Confluence. |
| FR-S-02 | DOMPurify allowlist. **Tags:** `h1`-`h6`, `p`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `figure`, `figcaption`, `img`, `blockquote`, `aside`, `details`, `summary`, `code`, `pre`, `hr`, `br`, `strong`, `em`, `u`, `s`, `sub`, `sup`, `a`, `div`, `span`. **Attributes:** `class`, `id`, `href`, `src`, `alt`, `width`, `height`, `role`, `scope`, `start`, `colspan`, `rowspan`, `target`, `rel`, `data-broken-link`, `data-download-failed`. **Classes:** post-sanitize pass strips any class not starting with `oe-help-`. **href:** internal links must match `^/help/`; external links must be `https://` (or `http://`) and get `rel="noopener noreferrer"` and `target="_blank"`; `javascript:`, `data:`, `vbscript:`, `file:` rejected. **src:** must match `^/help-content/assets/`. **Forbidden:** `script`, `style`, `iframe`, `object`, `embed`, `link`, `meta`, `form`, `input`, `on*` attributes, `style` attributes. |
| FR-S-03 | The pipeline refuses non-HTTPS image URLs and SVG images (SVG can carry script); refused images count as `imagesFailed`. |
| FR-S-04 | The Confluence token is read from environment variables only, never written to output, logs or `refresh-report.json`, and never committed. Live mode exits with a clear message if a variable is missing. In v1 the person running the refresh uses their own Atlassian API token (read access to the space is enough). |

---

## 8. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | Offline: no runtime calls to Atlassian, Google or any external host, except when the user follows an `oe-help-link--online` link. |
| NFR-02 | Initial paint (manifest + first page) ≤500 ms on 4G, cold cache. |
| NFR-03 | Search ≤150 ms p95 from keystroke to results (debounce included), corpus up to 300 pages / 80,000 words per locale. |
| NFR-04 | Total `help-content/` size ≤25 MB for both locales together, after WebP conversion and cross-locale dedupe. The refresh refuses to write above budget (FR-P-18). If the corpus outgrows it, revisit (Git LFS or a separate content artifact) before raising the budget. |
| NFR-05 | Full live refresh of both locales ≤5 minutes on a maintainer laptop. |
| NFR-06 | WCAG 2.1 AA: landmarks (`header`, `nav`, `main`), contrast with deployment branding applied, visible focus, keyboard reachability, image alt text from the source. |

### 8.1 Dependencies

| Package | Where | Why |
|---|---|---|
| `dompurify` | `dependencies` | FR-V-05, FR-S-02 |
| `flexsearch` | `dependencies` | Runtime search and build-time index (same version, so the serialized index matches) |
| `sharp` | `devDependencies` | Image resize and WebP conversion (FR-P-08) |

No other new dependencies without review. The pipeline otherwise uses Node built-ins (`fetch`, `crypto`, `fs`).

---

## 9. Edge Cases & Failure Handling

| Case | Behavior |
|---|---|
| Page deleted between runs | Omitted; links to it become online links if the page still exists elsewhere, otherwise broken links; counted in the report |
| Page moved between folders | Slug unchanged (title-based); TOC position follows the new parent |
| Page renamed | New slug; an old bookmark shows "Page not found" with a link to help home (aliases deferred, section 11) |
| French page without an English match | Excluded; reported |
| English page without a French translation | French viewer shows the English page with the fallback Tag |
| Translation older than English | Shown as is; listed in the refresh report; reader can use the latest-online link |
| Unknown macro or node type | Visible placeholder; reported; build continues |
| Attachment download fails | Placeholder (FR-P-09); reported |
| Output over budget | Build fails (FR-P-18) |
| Two pages with the same title | Numeric suffix in tree order; reported |
| User switches language mid-session | Viewer reloads the manifest for the new locale and stays on the same slug |
| Same help URL opened with no opener | "Return to OpenELIS" goes to `/` |

---

## 10. Acceptance Criteria

1. **Deterministic output.** Two consecutive runs against the committed fixtures (`--fixtures`) produce byte-identical output. (FR-P-13)
2. **Live corpus.** A live run with the committed config produces both guides in `en` and `fr`, a corpus survey with no unhandled node types, zero fatal errors, and fewer than 1% failed images. The dev-bundle fixtures are replaced by fixtures pulled from the new folders. (FR-P-02, FR-P-03, FR-P-05, FR-P-15)
3. **Legacy excluded.** No page titled `(before 3.3.0)` or `(avant 3.3.0)` and nothing under the LEGACY Versions folders is in a 3.3.0 build; "Results Entry (legacy screen)" is present. (FR-P-16)
4. **Links resolve.** No chunk contains a `/wiki/` URL except in `oe-help-link--online` links; every internal link is `/help/<slug>`, online, or `data-broken-link`. (FR-P-10)
5. **Images local.** Every `<img src>` starts with `/help-content/assets/`. Images render on a deep link such as `/help/print-a-work-plan`. (FR-P-08)
6. **Authoring content stripped.** No chunk contains a Provenance section or the text "add a comment to this page"; WIP pages show `help.viewer.wip.notice`. (FR-P-17, FR-V-13)
7. **Standalone viewer.** `/help` renders the help header and TOC and does not render the OpenELIS Header, side nav or Footer; every other route is unchanged. (FR-V-01a, FR-I-06)
8. **Branding.** With custom branding (header color, primary color, header logo) and `BANNER_TEXT` "Madagascar OpenELIS", the help header shows that logo and color and reads "Madagascar OpenELIS Help"; with the branding endpoint failing, defaults render. (FR-V-01c, FR-V-01d)
9. **Deep link.** `/help/<slug>#<heading-id>` renders and scrolls to the heading, also when pasted into a new tab. (FR-V-04, FR-V-06)
10. **Search.** "work plan" (en) and "plan de travail" (fr) each return the work plan page within 150 ms after the index loads. (FR-V-07, NFR-03)
11. **Open from the menu.** Help → "User Manual" opens `/help` in a new tab; the original tab is unchanged; "Return to OpenELIS" focuses it and closes the help tab. Opened from a bookmark, it navigates to `/`. (FR-I-02, FR-V-01b)
12. **Kill switch.** With `useInApp=false` and a manual URL set, "User Manual" opens the URL as before. With the property absent, in-app mode is used. (FR-I-04)
13. **French.** With the session in French, help opens in French; a page with no translation shows English with the fallback Tag. (FR-V-02)
14. **Offline.** With external network blocked, the viewer works; the only requests are same-origin `/help-content/...` and the existing OpenELIS REST calls. (NFR-01)
15. **Accessibility.** A Playwright test using `@axe-core/playwright` on `/help`, a long page and a search result reports zero critical or serious violations, in both locales. (NFR-06)
16. **Narrow viewport.** At 480 px and 360 px the TOC collapses behind the hamburger, content has no horizontal scroll (tables scroll inside their wrapper), and search is reachable. (§5.1)
17. **Size budget.** `help-content/` ≤25 MB; the refresh refuses to write above it. (NFR-04, FR-P-18)
18. **Latest online.** Every page shows "View the latest version online", opening its Confluence page in a new tab. (FR-V-12)
19. **Version labels.** A page labelled only `applies-v3-2` is absent from a 3.3.0 build; a page labelled `applies-v3-2` and `applies-v3-3` is present. (FR-P-16)

---

## 11. Out of Scope (v1)

- **Context-aware "help for this screen" launcher.** Designed for later via a `helpKey` prop; the `helpKey` contract should not preclude also surfacing the SOP assigned to the current test (see SOP management below).
- **SOP management.** Lab SOPs are site-specific controlled documents stored in OpenELIS, not release-pinned product documentation, so they are not bundled, indexed or rendered by this viewer. A "Lab SOPs" entry in the Help menu belongs to the SOP management feature.
- Print view, feedback widget, reading analytics, in-app editing, single-page "whole manual" view.
- Locales beyond English and French (the model supports them; add when a translated tree exists).
- **Automated refresh** (GitHub Actions, scheduled or release-triggered runs, CI content gates, shared service account). Revisit if releases ship with stale help.
- **Outdated-translation Tag** (the data, `sourceVersion`, is already recorded).
- **Old-slug aliases** for renamed pages.
- Deployment-specific help overlays.
- Developer and implementer documentation (the "For Implementers" / "For SysAdmins-Operators" trees).

---

## 12. Decisions log

### Decided

1. **Repository location**: pipeline `frontend/scripts/help-refresh.mjs`, output `frontend/public/help-content/`, viewer `frontend/src/components/help/HelpViewer.jsx`. The developer may adjust.
2. **Corpus (revised 2026-10-15)**: the topic-folder manual, user **and** administrator guides. Supersedes v1.0's "User Manual subtree only".
3. **Rollout**: property kill switch, default `useInApp=true`.
4. **French at launch (2026-10-15)**: ship `en` and `fr`; match by English source page id rather than `helpkey:` labels (none exist; the translation tool already records the source page and version).
5. **Legacy pages (2026-10-15)**: excluded from a release build; sites on older releases keep the help bundled with their release. "(legacy screen)" pages stay.
6. **Authoring follow-up from v1.0 (closed)**: new pages use Confluence's native attachments and panels, which is what v1.0 asked authors to do.

7. **Refresh (2026-10-15, v1.2)**: manual, at release cut, by the release manager, reviewed as a pull request (section 13). Automation deferred.
8. **Inclusion gates**: WIP pages included with the notice; `doc-blocked` pages excluded (config switches).
9. **Hotfix releases** keep the help from their `.0` release unless the release manager chooses to refresh.
10. **Latest-online link** on every page instead of any runtime fetch.

11. **Mockups (2026-10-15)**: HTML preview and JSX mockup updated to v1.2 before build.
12. **Authoring conventions (2026-10-15)**: section 13.3 adopted into the user manual style guide (sections 5.1, 6 and 8 of that page).

---

## 13. Refreshing help content

### 13.1 Procedure (manual, at release cut)

1. On the release branch (or `develop` before cutting it), set `releaseVersion` in `help-refresh.config.json`.
2. Run `npm run help:refresh` from `frontend/` with `CONFLUENCE_HOST`, `CONFLUENCE_EMAIL`, `CONFLUENCE_TOKEN` set in the shell.
3. Read the summary (FR-P-14). Fix blockers in Confluence and re-run: unhandled node types, broken internal links, failed images, unmatched French pages.
4. Commit `frontend/public/help-content/` and open a PR titled `chore(help): refresh help content for <releaseVersion>`, pasting the summary into the PR body.
5. Review: docs owner for content (missing pages, WIP pages, French coverage); a developer for structure. Merge before tagging.

The release checklist gets one item: **"Help content refreshed and PR merged"**. The script also runs against the committed fixtures in normal frontend tests (AC-1), so the converter is exercised without credentials.

### 13.2 Ownership

- **Release manager:** runs the refresh and owns the checklist item.
- **Docs owner:** reviews the refresh PR for content.

### 13.3 Authoring conventions (adopted 2026-10-15)

Written into the [user manual style guide](https://uwdigi.atlassian.net/wiki/spaces/OG/pages/1529872422) (sections 5.1, 6 and 8). They keep the export simple and set up later features. None blocks v1.

| Convention | Purpose |
|---|---|
| **Link by page id** (already in the user manual style guide) | Internal links survive renames and moves, so the pipeline can resolve them |
| **Version labels `applies-vX-Y`** (e.g. `applies-v3-3`; hyphens because labels cannot contain dots) | The export picks pages by release (FR-P-16). Over time this can replace the "(before X.Y.Z)" duplicate-page pattern |
| **`helpkey-<screen>` labels** (e.g. `helpkey-order-entry`) | Sets up the deferred context-sensitive help: a screen maps to a label, the label to a page. Labels can be added now with no code |
| **Translations through Lango** (already in use) | Records the English source page, which the French matching relies on (FR-P-15) |
| **Images as Confluence attachments, callouts as panels** (already the practice for new pages) | Handled natively by the pipeline (FR-P-05, FR-P-08) |

## 14. Implementation slices

So the work can ship incrementally (or be split into child stories of an epic):

1. **Pipeline**: corpus walk, attachments, ADF handlers, translation matching, exclusions and version labels, stripping, images, links, manifest, index, report, size budget, fixtures, `npm run help:refresh`. AC-1 to AC-6, AC-17, AC-19.
2. **Viewer**: `Layout` standalone mode, `HelpViewer.jsx`, branding, TOC, page render, deep links, search, locale fallback, latest-online link, error states, narrow viewport, i18n keys. AC-7 to AC-10, AC-13 to AC-16, AC-18.
3. **Integration**: `HelpMenu.jsx` change, `useInApp` property, default URL update, Playwright tests for the open/return flow. AC-11, AC-12.

---

## Appendix A: Glossary

| Term | Definition |
|---|---|
| **ADF** | Atlassian Document Format, the JSON body format returned by the Confluence REST v2 API with `body-format=atlas_doc_format`. |
| **Corpus** | The Confluence folders and pages converted for a release (FR-P-03, FR-P-16). |
| **Guide** | One of the two top-level TOC sections: User guide, Administrator guide. |
| **Legacy copy** | A page titled `(before X.Y.Z)` kept in Confluence for sites on older releases; excluded from newer builds. |
| **Legacy screen page** | A page describing a screen still reachable through configuration, titled `(legacy screen)`; included. |
| **Manifest** | Per-locale TOC and metadata JSON. |
| **Slug** | URL-safe identifier from the English title; shared by all locales. |
| **Source page** | The English page a translation was made from. |
| **HelpKey** | Future identifier tying an OpenELIS screen to help content, carried as a `helpkey-<screen>` Confluence label (not used by v1 code). |
| **Version label** | `applies-vX-Y` Confluence label stating which releases a page applies to. |
