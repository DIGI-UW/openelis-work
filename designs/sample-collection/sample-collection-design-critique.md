# Design Critique: OpenELIS Global — Sample Collection Redesign

**Context:** 4-step wizard-with-shortcuts redesign of the monolithic Add Order form for OpenELIS Global. Steps: Enter Order → Collect Sample → Label & Store → QA Review. Built with IBM Carbon Design System conventions. Target users are clinical laboratory staff and phlebotomists in resource-limited settings.

---

## Overall Impression

The redesign successfully breaks a complex monolithic form into a clear, progressive workflow that matches how lab staff actually work. The strongest design decision is the shared Lab Number + barcode scan bar on every step, which supports real-world workflows where staff jump between steps non-linearly. The biggest opportunity is **information density management** — several sections pack a lot of controls tightly, which could overwhelm users on lower-resolution screens common in lab settings.

---

## Usability

| Finding | Severity | Recommendation |
|---------|----------|----------------|
| **Step 1 is very long** — Patient section alone has ~30 fields across search, new patient, and collapsible sub-sections (emergency contact, additional info). Combined with Program, Additional Order Info, Clinical Info, Provider, and Sample sections, a user must scroll extensively. | 🟡 Moderate | Consider whether the New Patient form should open as a full-screen overlay or dedicated route rather than inline. Patient creation is a distinct task that may warrant its own focus. |
| **Sample Choice Popover position** — The inline popover for choosing existing vs. new sample appears below the Requested Tests table, disconnected from the button that triggered it. On a long test list, the popover may be off-screen. | 🟡 Moderate | Position the popover directly adjacent to (or anchored below) the clicked button. In Carbon, use the `Popover` or `Tooltip` component with auto-placement so it stays visible near the trigger. |
| **Collection Data vs. Received at Lab** — Good separation, but the distinction may not be immediately clear to less-experienced staff. "Collection Data" could be confused with "when the sample was collected from storage" rather than "when the phlebotomist drew the sample." | 🟢 Minor | Add a brief inline hint like "When and by whom the specimen was physically drawn from the patient" to disambiguate. |
| **"+ Plasma (all)" button label** — Assigning all panel tests "to Plasma" is clear, but the "(all)" suffix is ambiguous — does it mean "all tests" or "all samples"? | 🟢 Minor | Consider "Assign all to Plasma" or "+ Plasma (all tests)" for clarity. |
| **No visible save indicator** — The wizard has Save, Save & Next, and Save as Draft buttons, but there's no auto-save or unsaved-changes warning. In environments with unreliable power/connectivity, data loss is a real risk. | 🔴 Critical | Add auto-save (or at minimum a dirty-state indicator) and an "unsaved changes" warning on navigation away. This is especially important for Step 1 which has many fields. Consider the Carbon `InlineNotification` for showing save status. |
| **Barcode scan bar lacks feedback state** — The scan bar is present on every step but has no visible loading/success/error state after scanning. Lab staff scan quickly and need immediate feedback. | 🟡 Moderate | After scan, show an inline success banner (green) with order summary, or an error state (red) if not found. Carbon `InlineNotification` is ideal here. |
| **CSV Import preview — no way to edit individual cells inline** — The description mentions "Fix Warnings" and editable cells, but the mockup shows a read-only table. | 🟢 Minor | Show at least one editable cell in the warning row (e.g., the "Unknown Type" cell with a dropdown) to communicate the edit-in-place capability. |
| **QA Review "Reject → Return to Step" lacks target step selection** — The button exists but there's no way to specify *which* step to return to. | 🟡 Moderate | Add a step dropdown next to the reject button, or make it a split-button with step options. |
| **Environmental workflow hides Patient section entirely** — For some environmental programs, a requesting contact (not patient) may still be needed. The Provider section handles this, but the mental model shift from "Patient" to "no person at all" is abrupt. | 🟢 Minor | Consider renaming "Patient" contextually to "Subject / Source" when environmental is active, or adding a brief note like "Environmental samples do not require a patient record." |

---

## Visual Hierarchy

**What draws the eye first:** The **stepper** (numbered circles with blue active state) correctly anchors orientation — users immediately know where they are in the workflow. This is the right element to lead with.

**Reading flow:** Top → stepper → context card → form sections. This is logical and follows the natural scanning pattern. The context card (Lab Number, Patient, Tests, Status) acts as a persistent anchor that reinforces "what order am I working on," which is critical in a multi-order environment.

**Emphasis concerns:**
- The **Lab Number** field in Step 1 doesn't visually stand out enough given its importance. It's the most critical identifier across all steps, but it sits in a standard form section with the same weight as everything else. Consider a slightly elevated treatment — larger font, colored background, or a prominent badge-style display.
- The **Print Labels** section is intentionally collapsed, which is correct for secondary actions, but the 🖨 emoji icon may not render consistently across lab workstation browsers (often older Chrome or Firefox). Use a Carbon icon SVG instead.
- The **NCE report sections** use red text (`var(--cds-red-60)`) which correctly signals "caution/exception," but placing them collapsed inside each sample card means they could be missed entirely. Consider whether an NCE flag should appear as a persistent chip/badge on the sample card header when one has been filed.

---

## Consistency

| Element | Issue | Recommendation |
|---------|-------|----------------|
| **Button styles** | The mockup uses 5+ button variants: `btn-primary`, `btn-secondary`, `btn-ghost` with border, `btn-ghost` without border, and `btn-danger`. Some ghost buttons have borders (`border:1px solid var(--cds-blue-60)`) and some don't, creating visual inconsistency. | Standardize: primary actions = `btn-primary`, secondary/back = `btn-ghost` with border, destructive = `btn-danger`. Remove borderless ghost buttons for actions (keep only for inline links). |
| **Search patterns** | Patient search uses dedicated Search/External Search buttons. Provider search uses a search box with inline results. Site search uses a simple text input with inline disambiguation. Three different search patterns for similar operations. | Unify around the Provider Search pattern (search fields + Search button + inline results table) since it's the most robust. Apply it consistently to Patient, Provider, and Site searches. |
| **Tag/badge colors** | Panel tags = green (`#defbe6`), Test tags = red/pink (`#fff1f1`), Status badges = green/blue/gray, Selected badges = green. The red for tests could be misread as "error" or "rejected." | Consider using a neutral color (purple or teal) for test tags to avoid the red=error association. Reserve red exclusively for errors, rejections, and NCE states. |
| **Section header styles** | Some section headers use `<h3>` at 16px/500, others use `<h4>` at 14px/600, and some use 15px/500. Line heights and spacing vary. | Standardize on Carbon's productive heading tokens: `heading-03` for section headers, `heading-02` for sub-sections. |
| **Collapsible sections** | Four different collapse patterns: (1) chevron ▶ with toggle, (2) chevron ▼ with toggle, (3) onclick with `.hidden` class, (4) embedded in section header. | Pick one pattern (recommend: chevron ▶ rotating to ▼, Carbon `Accordion` component style) and apply everywhere. |
| **Form field widths** | Some inputs are full-width, some have `max-width`, some use `style="width:70px"`. The label quantity inputs are 70px wide which may be too narrow for some locales. | Use Carbon's grid-based column widths consistently. Small numeric inputs should be at least 80-96px for comfortable interaction. |

---

## Accessibility

**Color contrast:**
- Primary text (`var(--cds-gray-100)` = `#161616`) on white background: **passes WCAG AA** (contrast ratio ~17:1).
- Helper text (`var(--cds-gray-50)` = `#8d8d8d`) on white: **fails WCAG AA** for normal text (contrast ratio ~3.5:1, needs 4.5:1). This affects all the small explanatory notes throughout the mockup.
- Green status text (`var(--cds-green-60)` = `#198038`) on white: **passes AA** (~5.7:1).
- Red text (`var(--cds-red-60)` = `#da1e28`) on white: **passes AA** (~5.0:1).
- Disabled sample label row at `opacity:0.5`: likely **fails AA** — the reduced opacity drops already-marginal contrasts below threshold.

**Recommendation:** Bump helper text to `var(--cds-gray-60)` (`#6f6f6f`, ratio ~5.7:1). For disabled states, use `var(--cds-gray-50)` text with a strikethrough or "(unavailable)" label rather than opacity reduction.

**Touch targets:**
- The Print buttons (`padding:4px 12px`) produce very small hit areas (~28px tall), below the recommended 44px minimum for touch interfaces. Lab staff may use tablets or touchscreens.
- Radio buttons and checkboxes use browser defaults, which are typically 16×16px — too small for touch.

**Recommendation:** Increase all interactive element minimum heights to 32px (Carbon's small size) or 40px (default). Wrap checkboxes in Carbon's `Checkbox` component with full-width label click areas.

**Screen reader concerns:**
- The stepper uses visual indicators only (colored circles, checkmarks) with no `aria-label` or `role="progressbar"`.
- Collapsible sections use `onclick` handlers on `<div>` elements without `role="button"`, `tabindex`, or `aria-expanded` attributes.
- The sample choice popover has no focus trap or `aria-live` region announcement.

**Recommendation:** Add ARIA attributes during implementation. The mockup should note these requirements — consider adding a "developer notes" section flagging required ARIA patterns.

**Keyboard navigation:**
- No visible focus indicators defined in CSS (relies on browser defaults, which vary).
- Collapsible sections are only clickable, not keyboard-accessible.

**Recommendation:** Add `:focus-visible` styles using Carbon's focus ring (`box-shadow: 0 0 0 2px var(--cds-blue-60)`). Ensure all interactive elements are reachable via Tab.

---

## What Works Well

- **Wizard-with-shortcuts model** is excellent for this domain. Lab staff can follow the sequence for new orders but jump directly to any step for in-progress work. The sidebar + stepper dual-navigation is redundant in a good way.
- **Barcode scan bar on every step** is a smart design for the physical workflow — staff scan a tube and immediately land in the right context regardless of which step they're on.
- **Context card** (Lab Number, Patient, Tests, Status) provides persistent orientation that prevents "wrong order" mistakes, which are a real patient safety concern in labs.
- **Panel-level and test-level assignment** with deselection checkboxes gives the right level of granularity. The "(all)" pattern for panels saves clicks in the 90% case.
- **Inline sample choice popover** (choose existing vs. new draw) strikes a good balance between efficiency and control. Not auto-adding is the right call — explicit choice prevents silent errors.
- **NCE replacing the rejected dropdown** is a significant quality improvement. It forces structured documentation of *why* a sample is rejected rather than just flagging it.
- **Environmental/Clinical unified workflow** with toggle is clean. Sharing one form rather than two separate screens reduces maintenance burden and training overhead.
- **CSV bulk import with validation preview** is a strong feature for high-throughput labs receiving pre-collected samples. The row-level validation with status icons is immediately readable.

---

## Priority Recommendations

1. **Add auto-save or unsaved-changes protection** — This is the most impactful change for data integrity. Lab environments have unreliable connectivity and power. Losing a partially-entered order is a real workflow cost. Implement periodic auto-save to draft state, and warn on navigation away from dirty forms. This should be called out as a P0 in the FRS.

2. **Fix helper text contrast ratio** — Change `var(--cds-gray-50)` helper text to `var(--cds-gray-60)` throughout. This is a quick CSS change that affects every step and brings all explanatory text to WCAG AA compliance. The helper text carries important business logic notes (specimen gating, workflow type behavior, panel assignment rules) that users need to read clearly.

3. **Unify search patterns** — The three different search UIs (Patient, Provider, Site) should converge on one pattern. The Provider Search pattern (dedicated fields → Search button → inline results table → selected card) is the most complete. Applying it to Patient and Site searches improves learnability — staff learn one interaction model and apply it everywhere.

4. **Anchor the sample choice popover to its trigger** — When a user clicks "+ Plasma" on a test row, the popover should appear adjacent to that button, not at the bottom of the table. This prevents scroll-hunting and maintains context. During Carbon implementation, use `Popover` with `align="bottom-left"` and `autoAlign`.

5. **Increase touch target sizes** — Bring all buttons to a minimum 32px height and increase checkbox/radio hit areas. This is particularly important for the Print Labels table and the Requested Tests table, where the buttons are currently undersized. Lab staff wearing gloves or using tablets need larger targets.

6. **Break up Step 1 (Enter Order)** — Consider whether the "New Patient" form should be a separate route/overlay rather than inline. Step 1 currently contains 8 form sections with potentially 50+ fields when all are expanded. Progressive disclosure is already used (collapsible sections), but the sheer volume of the page may overwhelm new users. An alternative: make Step 1 a mini-wizard itself (Patient → Program → Clinical Info → Provider → Sample) with a sticky summary sidebar.

---

*Critique generated from the interactive HTML mockup. All findings are based on the static mockup; implementation in Carbon for React may resolve some consistency issues automatically through component library defaults.*
