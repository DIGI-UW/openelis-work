# Admin Shell — Design Brief

**Version:** 0.1 (draft, for Casey review)
**Date:** 2026-04-23
**Scope:** Phase 5 — the shell that hosts every admin page. *Not* the pages themselves.
**Depends on:** IA v2.3 (ratified), Pattern Library v1.0 (ratified 2026-04-20)
**Upstream dependency for:** every remaining Phase 5 page

---

## 1. Purpose

Give OpenELIS admins a single, predictable frame for every configuration task inside `/admin/*`. The shell decides: how admins arrive, how they navigate between buckets, how they know where they are, and how they get back out. Each bucket page then slots into this frame without re-deriving it.

## 2. Primary user action

Pick a bucket, then pick a page inside it, then do admin work. The shell exists to make those first two steps invisible.

## 3. Layout pattern

Carbon `SideNav` (left rail, fixed width 256px, expand-in-place accordion submenus) + main content area (fluid, Carbon grid, 2rem side padding). No secondary rail. No top bar redesign — the shell inherits whatever global OpenELIS header is in place.

## 4. Interaction model

| Element | Behaviour |
|---|---|
| **Route `/admin`** | Renders the **bucket index grid** — 11 clickable cards, one per bucket, with icon + name + one-line description + page count. No widgets, no data fetching. |
| **Sidenav bucket item** | Clicking the bucket name navigates to that bucket's landing page AND expands the bucket's submenu. Clicking again while already on the landing collapses it. Clicking the chevron only expands/collapses (no nav). |
| **Sidenav page item** | Navigates to `/admin/<bucket>/<page>`. Active page has the Carbon default active-state (3px left border in `$blue-60`, bold label, `$blue-10` row background). |
| **Multi-expand** | Any number of buckets may be expanded simultaneously. Expansion state is **not** persisted across sessions — each visit starts with just the current bucket expanded. |
| **Breadcrumb** | Every non-root admin page shows `Admin › [Bucket] › [Page]`. The "Admin" crumb links to `/admin` (the bucket grid). The bucket crumb links to that bucket's landing. |
| **Legacy bucket** | Pinned to the bottom of the rail, separated by a divider, items rendered in `$gray-60`, each item gets a small "Legacy" Tag. Does not visually differ from other buckets in its expand behaviour. |
| **Exit back to main app** | Via the existing global OpenELIS header — out of scope for this shell. The admin shell never tries to own that. |

## 5. Scope boundary

**In scope**

- Sidenav visual + structure for the 11 buckets
- Bucket index landing (`/admin`)
- Bucket landing page template (same frame for all 11 buckets)
- Breadcrumb pattern
- Active-state, empty-state, and loading-state conventions for the shell
- Route structure (`/admin`, `/admin/<bucket>`, `/admin/<bucket>/<page>`)
- Keyboard + screen-reader behaviour of the sidenav

**Out of scope**

- Global OpenELIS header (outside `/admin/*`)
- Any individual page content (User Management, Dictionary, etc.)
- Admin-to-operational-page deep links (Q1 option D deferred)
- Session / expansion state persistence across logins
- Permission-based bucket hiding (assumed — gated by `admin:<bucket>` permission or `ADMIN_MENU` during migration). Details pushed to Pattern P-13.

## 6. Carbon components

- `SideNav`, `SideNavItems`, `SideNavMenu`, `SideNavMenuItem`, `SideNavDivider`, `SideNavLink`
- `Breadcrumb`, `BreadcrumbItem`
- `Grid`, `Column`, `Tile`, `ClickableTile` (for bucket cards)
- `Tag` (for Legacy items + page-count badges on landing cards)
- `Button` (ghost for secondary actions on bucket landings)

## 7. Decisions locked this session

| # | Decision | Source |
|---|---|---|
| D1 | Scope = admin section only, `/admin/*`, 11 IA-v2.3 buckets | Q1 = A |
| D2 | Blank slate anchored to IA v2.3; 11 buckets locked; shell pattern open | Q2 = B |
| D3 | Expand-in-place accordion, multi-expand allowed, Carbon `SideNavMenu` default | Q3 = A |
| D4 | Bucket index grid at `/admin` (launcher-only, no widgets) | Q4 = B |
| D5 | Depth-2 only (bucket → page), no middle grouping | Q5 = A |
| D6 | Legacy bucket visually distinct — gray-60, pinned bottom, divider above, per-item "Legacy" Tag | Q6 = A |
| D7 | Carbon icon set locked for all 11 buckets (see Section 8 Icon column) | Icon walkthrough 2026-04-24 |

## 8. The 11 buckets and their pages (IA v2.3, from Phase 5 roadmap)

| # | Bucket | Carbon icon | Pages | Notes |
|---|---|---|---|---|
| 1 | **People & Access** | `UserMultiple` | User Management · Role Management · Provider Management · Organization Management | 4 pages |
| 2 | **Test Catalog** | `Catalog` | Test Management · Methods · Analyzer Test Name · Program Entry · Reflex Tests · Calculated Value Tests | 6 pages |
| 3 | **Reference Data** | `Book` | Dictionary Menu | 1 page |
| 4 | **Workflow Tuning** | `Flow` | NonConformity Configuration · Barcode Configuration · Batch Test Reassignment & Cancelation · Validation Configuration · Result Entry Configuration · Order Entry Configuration · Patient Entry Configuration · WorkPlan Configuration | 8 pages — longest submenu; if it feels crowded that's a signal to split, per D5 |
| 5 | **Subscriptions & Notifications** | `Notification` | Test Notification Configuration | 1 page |
| 6 | **Lab Setup** | `Building` | Site Information · Calendar Management · Language Management · Translation Management | 4 pages |
| 7 | **Lab Identity** | `ColorPalette` | Site Branding · Lab Number Management | 2 pages |
| 8 | **Integrations** | `Connect` | External Connections · List Plugins | 2 pages |
| 9 | **Reporting & Exchange** | `Report` | Result Reporting Configuration · Printed Report Configuration | 2 pages |
| 10 | **System Administration** | `Settings` | Application Properties · Notify User · Search Index Management · Logging Configuration · Global Menu Configuration · Billing Menu Configuration · Non-Conform Menu Configuration · Patient Menu Configuration · Study Menu Configuration | 9 pages |
| 11 | **Legacy** | `Archive` | MenuStatement Configuration · Field Validation Configuration · Legacy Admin | 3 pages — visually muted per D6 |

Total: 42 pages across 11 buckets.

## 9. Bucket landing page template

Every bucket landing (e.g. `/admin/people-access`, `/admin/test-catalog`) uses one shared template:

- Breadcrumb: `Admin › [Bucket]`
- H1: bucket name
- Subtitle: one-line description (same copy as used on the bucket index card)
- A grid of `ClickableTile` cards, one per page in the bucket, each with:
  - Page name (H3)
  - Short description (one sentence, pulled from Phase 5 roadmap notes)
  - Optional status tag: "New" (for redesigned pages post-Phase 5) or "Legacy" (in the Legacy bucket only)
- Empty-state copy only if the bucket has zero pages (unreachable in current IA, but guard against it)

This means defining the shell gives us the landing design for all 11 buckets in one go — Phase 5 no longer needs 11 separate bucket-landing designs.

## 10. Non-functional

- **Responsive:** Sidenav collapses to a hamburger-triggered overlay below 1056px (Carbon `md` breakpoint). Not designing mobile admin — but 13" laptops are real and the rail shouldn't eat a third of the screen.
- **Keyboard:** Tab cycles rail items in order; Enter/Space on a bucket item expands AND navigates (matches D4 click behaviour); `Esc` collapses the currently-focused expanded bucket.
- **Screen-reader:** Expansion state announced via `aria-expanded`; active item announced as "current page" via `aria-current="page"`.
- **Deep links:** Every bucket landing and page has a canonical URL; hitting it directly lands the user on the right page with the right bucket expanded in the rail.
- **i18n:** Every label in the rail, grid, and breadcrumb wrapped in `t(key, fallback)`.

## 11. What this brief doesn't decide (open for a follow-up pass)

1. **Page-count badge on rail items** — nice affordance or clutter? Currently in preview; happy to drop.
2. **"Recently edited" shortcut** — does `/admin` itself deserve a small "recently edited" row above or below the bucket grid? Explicitly excluded in Q4's D4 answer, but worth flagging as a follow-up if the grid feels cold.
3. **Cross-bucket search in the rail** — `Ctrl+K`-style command palette across all admin pages. Not designed in this pass; flag for Phase 6 if admins ask for it.
4. **Permission-based bucket hiding** — how a bucket the user can't access is presented (hidden entirely vs. shown-but-disabled). Needs a PM/security decision before I lock it.

## 12. Preview

`admin-shell-preview.html` — a clickable hash-routed preview showing the bucket grid landing, all 11 buckets expandable in the rail, and a bucket landing template. Page-level content is stubbed with a "Not yet designed" placeholder so the flow is exerciseable without the pages being built.

---

## Approval gate

Reply with one of:

- ✅ **Approved** — I lock the shell, update Pattern P-01, and move on to **Role Management** (Page 2 of the Top-5, since User Management is yours).
- ✏️ **Approved with changes** — call out what to adjust (icons, copy, interaction detail). I'll revise, re-share, then proceed.
- 🔄 **Rework** — the frame isn't right. Re-open whichever of Q1–Q6 is miscalled.
