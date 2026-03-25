# Paste this into Claude.ai (web version with Atlassian MCP connected)

Using the Atlassian Jira tools, create the following Epic and 9 sub-tasks in the **OGC** project on **uwdigi.atlassian.net**.

**For ALL issues:**
- Assign to: **Reagan** (search for Reagan in the project members)
- Labels: `Indonesia`, `redesign`, `sample-collection`, `decoupling`, `environmental-samples`
- Priority: High (unless noted otherwise below)

This epic addresses two critical issues: (1) decoupling the monolithic AddOrder.js form into 4 independent steps, and (2) adding proper Environmental Sample workflow support.

---

## EPIC

**Summary:** Decouple Sample Collection Process & Support Environmental Workflows

**Description:**

Redesign the OpenELIS Global sample collection process by decomposing the monolithic AddOrder.js form into 4 independently routable steps: Enter Order, Collect Sample, Label & Store, and QA Review. This addresses two key problems:

1. **Decoupling**: The current AddOrder.js is a single monolithic form that forces all roles through one screen. This redesign separates it into 4 independent steps, each accessible as its own submenu item under "Add Order" in the sidebar, supporting different primary actors (physician, phlebotomist, lab tech, QA officer), and sharing order context via a unified OrderContext.

2. **Environmental Sample Support**: The current system lacks proper support for environmental sample workflows (GPS capture, location hierarchy, site-specific fields). This redesign adds unified clinical/environmental workflows controlled by lab unit configuration (Clinical, Environmental, or Both modes).

Additional scope includes: an Order Dashboard as the default landing page showing in-progress orders with search and external order acceptance; an Edit Order workflow (read-only by default with admin-gated test cancellation); and WCAG AA accessibility compliance.

**FRS:** 70+ requirements across 10 sections (NAV, ORD, COL, LBL, QA, EDT, CFG, XC, DSH, INC)
**Mockup:** Interactive HTML mockup with all 4 steps + Order Dashboard
**User Stories:** US-1 through US-25

---

## SUB-TASK 1: Navigation & Step Decoupling

**Summary:** Implement sidebar navigation, routing, and progress stepper for 4-step workflow

**Description:**
Implement the navigation infrastructure for the decoupled sample collection workflow.

Requirements (from FRS):
- NAV-1: Sidebar "Add Order" expands to 4 child items (Enter Order, Collect Sample, Label & Store, QA Review)
- NAV-2: Independent routing via /order/enter, /order/collect, /order/label, /order/qa
- NAV-3: Progress stepper at top of each step (completed/in-progress/pending states)
- NAV-4: Save & Next auto-advance with Save option to stay
- NAV-5: Order context summary card on all steps
- NAV-6: Barcode scan / lab number search bar on every step (loads order in read-only mode)
- NAV-7: Deprecate "Edit Order" sidebar item
- NAV-8: Inline scan feedback — green success or red error within 500ms

Acceptance Criteria:
- All 4 steps independently routable
- Stepper shows correct state per step
- Barcode scan loads order with inline success/error feedback
- Edit Order menu item deprecated

---

## SUB-TASK 2: Step 1 — Enter Order

**Summary:** Build Enter Order step with patient/provider search, test selection, and program fields

**Description:**
Implement the Enter Order step as a standalone page supporting clinical and environmental workflows.

Requirements (from FRS):
- ORD-1: Lab Number assignment (auto-generated or manual) at top of form
- ORD-1a: Print Labels section (collapsed by default, configurable label types)
- ORD-1b: Capture requester, site/department, priority, subject info; tests OPTIONAL
- ORD-2: Clinical shows patient search; Environmental shows location hierarchy
- ORD-3: "Both" mode shows Clinical/Environmental toggle
- ORD-4: Draft save support
- ORD-5: FHIR R4 order API endpoint
- ORD-6: ICD-10/ICD-11 code lookup
- ORD-7: Paginated test/panel selection with filters
- ORD-8: Unified search pattern for Provider and Site
- ORD-9: Patient summary card with photo
- ORD-10: Program-specific additional fields (e.g., VL Program)
- ORD-11: New Patient inline form matching existing Add/Modify Patient

Acceptance Criteria:
- Lab number generated and displayed prominently
- Patient, Provider, Site searches all follow unified pattern
- Program fields appear/disappear dynamically
- Order saves via FHIR R4 endpoint

---

## SUB-TASK 3: Step 2 — Collect Sample

**Summary:** Build Collect Sample step with test-to-sample assignment, inline choice popover, and CSV import

**Description:**
Implement the Collect Sample step supporting manual and batch sample collection. Includes environmental GPS capture support.

Requirements (from FRS):
- COL-1: Requested Tests table with panel group headers, sample type buttons, inline choice popover
- COL-2: Sample cards with type, quantity, UOM, optional collection data, auto-populated received-at-lab
- COL-3: Environmental GPS capture
- COL-4: NCE reporting per sample (replaces Rejected dropdown)
- COL-5: Multiple independent samples per order
- COL-11: Choose-or-create logic when matching sample exists
- COL-12: Print additional specimen labels
- COL-6 through COL-10: CSV template download, upload, preview with validation, import, position mapping

Acceptance Criteria:
- Clicking sample type button shows inline popover when match exists
- Tests assignable to multiple samples
- CSV import with row-level validation preview
- NCE section replaces rejection dropdown

---

## SUB-TASK 4: Step 3 — Label & Store

**Summary:** Build Label & Store step with print labels and inline storage assignment
**Priority:** Medium

**Description:**
Implement the labeling and storage step.

Requirements (from FRS):
- LBL-1: Display lab number (read-only) and collected samples
- LBL-2: Print Labels section (same config as Step 1, including Freezer Labels)
- LBL-3: Inline storage assignment (existing OpenELIS "Assign Storage Location" rendered inline)
- LBL-4: Container position field validation

Acceptance Criteria:
- Labels printable from this step
- Storage assignment inline (not modal)
- Barcode scan for quick assign
- Position format validated against storage location config

---

## SUB-TASK 5: Step 4 — QA Review

**Summary:** Build QA Review step with completeness dashboard, NCE reporting, and step-targeted reject

**Description:**
Implement the QA Review step.

Requirements (from FRS):
- QA-1: Completeness dashboard (green/yellow/red per step per sample)
- QA-2: Sample Review table with test assignments, status, NCE column
- QA-3: Collapsed NCE section for sample-level or order-level NCE
- QA-4: Auto-reject order when all samples rejected
- QA-5: Approve for testing OR reject to specific step (dropdown: Step 1/2/3)
- QA-6: Full audit trail across all steps

Acceptance Criteria:
- Dashboard shows completeness per step
- NCE can target specific sample or entire order
- Reject includes step dropdown selector
- Returned orders show "Returned from QA" indicator

---

## SUB-TASK 6: Edit Order Workflow

**Summary:** Implement read-only order loading, edit toggle, and admin-gated test cancellation with NCE
**Priority:** Medium

**Description:**
When an existing order is loaded via barcode scan, render all steps in read-only mode by default. Add edit toggle, test result status indicators, and role-based cancellation controls.

Requirements (from FRS):
- EDT-1: Read-only mode by default; "Edit" button in header enables fields
- EDT-2: Test result status indicators (Results Entered, Validated, No Results, Cancelled)
- EDT-3: Non-admin users cannot cancel tests with results (disabled button + tooltip)
- EDT-4: Admin cancellation of tests with results requires mandatory NCE entry
- EDT-5: Tests without results cancellable by any edit-permitted user
- EDT-6: Same 4-step screens used; user lands on current step; data pre-populated

Acceptance Criteria:
- Scanned orders load in read-only mode
- Edit button enables fields
- Cancel disabled for non-admins on tests with results
- NCE form mandatory before admin cancellation commits
- Audit trail records all cancellations

---

## SUB-TASK 7: Lab Unit Workflow Configuration

**Summary:** Add workflow type configuration to lab unit admin settings
**Priority:** Medium

**Description:**
Add configuration to lab unit admin to control clinical vs. environmental workflows. This is key for the Indonesia environmental sample use case.

Requirements (from FRS):
- CFG-1: Workflow Type dropdown (Clinical, Environmental, Both)
- CFG-2: Changing type immediately affects Enter Order and Collect Sample fields
- CFG-3: Preview of enabled fields in admin panel
- CFG-4: (P2) Custom field groups

---

## SUB-TASK 8: Cross-Cutting — Auto-save, Accessibility, Unified Search

**Summary:** Implement auto-save, WCAG AA accessibility, keyboard navigation, and unified search pattern

**Description:**
Cross-cutting concerns that apply to all steps.

Requirements (from FRS):
- XC-1: Auto-save every 30s on dirty forms + save status indicator + navigation warning
- XC-2: Unified search pattern for Patient, Provider, Site
- XC-3: WCAG AA contrast (helper text ≥ 4.5:1, no opacity-based disabled states)
- XC-4: 32px minimum touch targets
- XC-5: ARIA attributes (stepper, collapsibles, popovers)
- XC-6: Keyboard navigation with visible focus indicators

Acceptance Criteria:
- Auto-save works in low-connectivity environments
- All interactive elements keyboard-accessible
- Screen reader can navigate all steps
- All text meets contrast requirements

---

## SUB-TASK 9: Order Dashboard & Incoming Orders

**Summary:** Build unified Order Dashboard with in-progress queue, search, and incoming external order acceptance

**Description:**
Replace the separate "Search Incoming Test Requests" screen with a unified Order Dashboard that serves as the landing page for "Add Order." Default view shows the user's in-progress orders. Search queries internal lab orders by default, with an "Include external sources" toggle to also show incoming EMR/referral orders. Critical for Indonesia deployment where incoming orders from EMRs and referral labs need streamlined acceptance.

Requirements (from FRS):
- DSH-1: Dashboard as default landing page for "Add Order" parent menu
- DSH-2: Search within lab orders (patient name, lab number, national ID, referring lab number)
- DSH-3: "Include external sources" checkbox to reveal incoming EMR/referral orders
- DSH-4: Table with lab number, patient, facility, priority, current step (with progress bar), action buttons
- DSH-5: "+ New Order" button routes to Step 1
- DSH-6: Barcode quick-lookup bar (same behavior as NAV-6)
- DSH-7: Filter dropdowns (status, date range, priority)
- DSH-8: Returned-from-QA orders highlighted with "Fix Issue" button
- DSH-9: Pagination (25/50/100 items per page)
- INC-1 through INC-6: Incoming external order display, acceptance workflow, lab number options (Scan/Enter/Generate/Use Current)

Acceptance Criteria:
- Dashboard loads as default when clicking "Add Order"
- My in-progress orders shown without extra clicks
- Search returns internal results; toggle adds external
- Accept routes to Step 1 with pre-populated data
- Lab number field offers Scan/Enter/Generate/Use Current
- Returned-from-QA orders highlighted

---

**IMPORTANT:** After creating all issues, please provide me with:
1. The Epic issue key (e.g., OGC-XXX)
2. All 9 sub-task issue keys
3. Confirmation that all are assigned to Reagan with the Indonesia label
