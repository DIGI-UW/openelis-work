# OGC-325 — HL7 Analyzer Mapping Addendum v1.1 + ASTM Profile System v1.2 — Comprehensive Design Session Transcript

Comprehensive Design Session Transcript
Date: February 27–March 3, 2026
Jira Tickets: OGC-325 (HL7), OGC-337 (ASTM v1.2 Profiles)
Related Tickets: OGC-324 (ASTM Analyzer Mapping Templates)
Author: Casey Iiams-Hauser
Profiling Approach: 1.2 style for ASTM and HL7 analyzer integrations

## Purpose of This Document

This transcript captures the full design rationale, decision points, trade-offs, and context behind the HL7 Analyzer Mapping Addendum and the ASTM Profile System v1.2 addendum. It is intended to serve as a reference for:

- Understanding why specific design choices were made
- Providing context that may not be fully captured in the spec or mockup deliverables
- Guiding future questions about the HL7 integration and profile system approaches
- Onboarding new contributors to the analyzer integration work

---

## Table of Contents

1. Starting Context and Approach
2. Milestone 1–3: Spec Foundation
3. Milestone 4: Base React Mockup — Design Decisions
4. Milestone 5: Value Mapping and Query Analyzer
5. Milestone 6: Preview Tab and Import Simulation
6. Non-Numeric Test Gap Analysis
7. Select List Integration — Design Rationale
8. ASTM v1.2 Addendum Work
9. Breadcrumb and Sidebar Navigation Fix
10. Cowork Migration
11. Remaining Gaps and Future Work
12. Deliverable Summary

---

## 1. Starting Context and Approach

### Background

The work began from a standing project decision to use the 1.2 style profiling approach for all ASTM and HL7 analyzer integrations in OpenELIS Global. This approach requires three deliverables per integration:

- A mapping document (the spec)
- A companion analyzer setup document (the mockup serves this role)
- An update to the Analyzer Integration Tracker

### Why HL7 as an Addendum (Not a Separate Spec)

The HL7 spec was structured as an addendum to the existing ASTM Analyzer Mapping Templates FRS (OGC-324) rather than a standalone document. This decision was driven by:

- ~70% feature overlap between ASTM and HL7 analyzer integration workflows (test code mapping, QC rules, value transformations, field extraction)
- Shared UI patterns — the same Carbon-based admin interface serves both protocols
- Maintenance burden — a single spec family is easier to keep in sync than two parallel documents
- Developer clarity — the addendum format makes it explicit which features are HL7-specific vs. shared

The addendum references ASTM FR numbers (FR-1 through FR-21) by cross-reference and adds HL7-specific requirements as FR-22 through FR-30.

### Milestone Structure

Work was divided into 6 milestones to manage complexity and allow incremental review:

| Milestone | Scope | Rationale |
|-----------|-------|-----------|
| M1 | Spec scaffold + HL7 segment catalog | Establish structural foundation and protocol-level differences |
| M2 | Functional requirements, business rules, user stories | Core behavioral spec |
| M3 | API endpoints, database tables, i18n tags, acceptance criteria | Implementation-ready detail |
| M4 | Base React mockup (7 tabs) | Visual validation of all spec features |
| M5 | Value Map editor + Query Analyzer | Most interactive features, needed separate attention |
| M6 | Preview tab with import simulation | End-to-end validation tool, most complex single feature |

---

## 2. Milestone 1–3: Spec Foundation

### HL7 v2.3.1 Segment Catalog

**Why v2.3.1 specifically:** Most clinical laboratory analyzers that support HL7 use v2.3.1 or v2.5.1. We chose v2.3.1 as the baseline because:

- It is the most common version in deployed laboratory instruments globally
- It covers the core ORU^R01 (results) and QRY^R02 (query) message types
- v2.5.1 features (like expanded coded element types CWE/CNE) can be supported as backward-compatible extensions
- Many instruments in low-resource settings (OpenELIS Global's primary deployment context) use older HL7 versions

**Segment-to-ASTM mapping:** The spec includes a detailed field-level comparison between HL7 segments (MSH, PID, OBR, OBX) and ASTM records (H, P, O, R). This mapping table was critical for:

- Ensuring the generic plugin architecture could serve both protocols
- Identifying where HL7 has richer data (e.g., OBX-2 value type declaration) vs. where ASTM has it (e.g., simpler test ID format)
- Guiding the shared database schema design

### 9 Functional Requirements (FR-22 through FR-30)

**Key design decisions in the FRs:**

**FR-22 (MLLP Connection):** Chose to support both Shared MLLP Port (multiple analyzers on one port, routed by MSH-3) and Dedicated Port (one port per analyzer). The shared port model is important for sites with many analyzers but limited network infrastructure. MSH-3 (Sending Application) is the routing key because it is the most reliably populated identifier field.

**FR-23 (ACK Generation):** Four ACK modes were defined rather than a simple on/off because different deployment scenarios need different behavior:

- Always Accept (AA): For initial setup and testing — never reject messages
- Accept on Success Only: For production — ensures only fully-mapped results are accepted
- Accept with Errors: For transition periods — accepts partial results while flagging gaps
- Never (Suppress ACK): For analyzers that don't expect ACK responses or for debugging

**FR-24 (QC Rules):** Five QC rule types were chosen based on analysis of how real analyzers identify QC samples in HL7 messages. The most common patterns are specimen ID prefix (e.g., "CTRL-") and patient name pattern (e.g., "QC Control"). The HL7 field reference selector uses optgroups (MSH/PID/OBR/OBX) rather than a flat list because HL7 has ~100+ possible fields and grouping by segment makes the selector usable.

**FR-25 (Value Transformations):** Identical transformation types to ASTM but with HL7-specific parsing behavior. The key difference is that HL7 declares the value type in OBX-2 (NM, CE, SN, ST, TX, FT) whereas ASTM treats all result values as plain strings. This means the transformation engine can be smarter about parsing.

**FR-26 (Field Extraction):** Uses Segment-Field.Component notation (e.g., OBX-3.1) instead of ASTM's Record.Position notation (e.g., R.3). The 14 configurable fields were chosen as the minimum set needed to handle all known analyzer variations. The defaults work for ~95% of analyzers.

**FR-27 (Message Simulator) and FR-28 (Result Aggregation):** Carried forward from ASTM with HL7 adaptations.

### Business Rules (BR-18 through BR-25)

**Notable rules and their rationale:**

- **BR-19 (MSH-3 Routing):** When using shared MLLP port, MSH-3 is required for routing. If MSH-3 doesn't match any configured analyzer, the message is logged but not processed. This prevents silent data loss.
- **BR-21 (ACK Timing):** ACK must be sent within the configured timeout. If processing takes longer, send AA immediately and process asynchronously. This prevents analyzer-side timeouts.
- **BR-23 (Duplicate Detection):** Uses MSH-10 (Message Control ID) within a configurable time window. This handles the common case of analyzers retransmitting when they don't receive ACK in time.

### User Stories (12 across 4 Epics)

**Epics 9-12 were structured around the admin workflow:**

- Epic 9: Configure HL7 analyzer connection (MLLP setup, MSH-3 identification)
- Epic 10: Map HL7 test codes (OBX-3 mapping, value type handling)
- Epic 11: Configure ACK behavior (response modes, duplicate detection)
- Epic 12: Validate configuration (simulator, preview, auto-detection)

### API and Database Design

16 API endpoints follow RESTful patterns consistent with existing OpenELIS Global API. 7 database tables extend the ASTM schema with HL7-specific columns (e.g., mllp_listener_mode, ack_mode, msh3_sender_app).

### i18n Tags (120+)

Every user-facing string has an i18n tag. This is critical for OpenELIS Global which is deployed in 20+ countries with localization needs. Tags follow the existing label. and error. prefix conventions.

### Acceptance Criteria (AC-87 through AC-152)

66 acceptance criteria providing testable conditions for every functional requirement. Numbered sequentially from the ASTM spec's AC-86.

---

## 3. Milestone 4: Base React Mockup

### Why a React Mockup (Not Figma)

The mockup was built as a functional React component rather than static Figma screens because:

- **Interactivity:** The analyzer mapping workflow has complex state transitions (tab switching, inline editing, modal flows) that are better demonstrated with working code
- **Carbon Design System fidelity:** OpenELIS Global uses IBM Carbon for React; building in React ensures pixel-accurate representation
- **Reusability:** Components from the mockup can inform actual implementation
- Figma was used for reference: The OpenELIS Global Template Figma file was consulted for design tokens, spacing, and component patterns

### Design System Decisions

**Color tokens:** Used IBM Carbon's standard palette (blue-60, purple-60, green-50, red-60, yellow-30) mapped to semantic meanings:

- Blue: ASTM protocol, interactive elements
- Purple: HL7 protocol, coded/CE value types
- Green: success, mapped status, active
- Red: errors, unmapped status
- Yellow: warnings, SN value type, draft status

**Typography:** IBM Plex Sans for UI text, IBM Plex Mono for code/field references (analyzer codes, HL7 field positions, OBX-3 values). The monospace font is important for readability when displaying technical identifiers.

**Layout:** Dark navy sidebar (consistent with OpenELIS Global navigation) + white content area. The sidebar stays fixed while content scrolls.

### Analyzer List View Design

**Protocol badge:** Purple "HL7" / Blue "ASTM" badges were added because the list view needs to show both protocol types together. This is a departure from the ASTM-only mockup which didn't need protocol differentiation.

**MSH-3 in subtitle:** Showing the MSH-3 (Sending Application) value directly in the analyzer card subtitle (e.g., "HL7 v2.3.1 · MSH-3: BC-5380") was a deliberate choice. MSH-3 is the primary identifier for HL7 analyzers — admins need to see it at a glance to know which physical instrument a configuration maps to.

**Connection column:** Shows "MLLP Shared :2575" or "MLLP Dedicated :2576" because connection mode is the most operationally relevant detail for troubleshooting.

### MLLP Configuration Modal Design

**Connection Role toggle:** Server vs. Client. Most deployments use Server mode (OpenELIS listens on a port), but Client mode (OpenELIS connects to the analyzer) is needed for some network configurations, especially in cloud-hosted deployments behind NAT.

**Shared vs. Dedicated listener:** This is the most consequential configuration choice. Shared listeners save port resources but require MSH-3 routing. The modal shows contextual help text explaining the trade-off.

**MSH-3 filter field:** Only visible when Listener Mode = Shared, because it's only needed for routing. This conditional visibility reduces cognitive load for Dedicated mode setups.

### Tab Structure — 7 Tabs

The original ASTM mockup had 4 tabs (Field Mapping, Test Codes, QC Config, Communication). The HL7 mockup expanded to 7:

| Tab | Why Added |
|-----|-----------|
| Test Codes | Carried from ASTM, enhanced with OBX-2 badges |
| QC Rules | Carried from ASTM, adapted for HL7 field references |
| ACK Config | New for HL7 — ASTM uses ENQ/EOT framing, HL7 uses ACK messages |
| Message Simulator | Carried from ASTM, enhanced with ACK preview |
| Preview | New — full import simulation with parse log |
| Field Extraction | Carried from ASTM, notation changed to Segment-Field.Component |
| Advanced | Carried from ASTM, HL7-specific aggregation modes added |

**Tab ordering rationale:** Test Codes first because it's the most-used tab. ACK Config after QC Rules because ACK behavior depends on understanding QC classification. Preview after Simulator because it's a more advanced validation tool. Field Extraction and Advanced last because they're rarely changed after initial setup.

### OBX-2 Value Type Badges

The color-coded badges for OBX-2 value types (NM blue, CE purple, SN yellow, ST/TX gray) were one of the most important visual design decisions. In HL7, the value type determines:

- How the result value is parsed
- Which transformations are applicable
- Whether a select list mapping is needed
- How the SN auto-parse engine behaves

Making the value type visually prominent in the test codes table helps admins quickly identify which mappings need special attention (CE values almost always need Value Map configuration).

### SN Auto-Parse Banner

When a test code has OBX-2 = SN, an info banner explains that structured numeric values are automatically parsed. This was added because SN handling is one of the most confusing aspects of HL7 for non-developers — the banner preempts support questions.

### Mock Data Design

The 5 mock analyzers were chosen to represent common deployment scenarios:

- Sysmex XN-1000: High-volume hematology analyzer (HL7, shared port)
- BC-5380: Mid-range hematology (HL7, dedicated port)
- Cobas c311: Chemistry analyzer (HL7, shared port)
- GeneXpert: Molecular testing (HL7, client mode — represents instrument-initiated connections)
- Indiko Plus: Chemistry (ASTM — shows mixed-protocol list)

The 13 OpenELIS tests cover the most common laboratory tests globally: CBC panel (WBC, RBC, HGB, HCT, PLT), chemistry (Glucose, BUN, Creatinine, ALT, AST, Cholesterol), and serology (HIV Ag/Ab, HBsAg). These are representative of a typical OpenELIS Global deployment.

---

## 4. Milestone 5: Value Mapping and Query Analyzer

### Value Map Inline Editor — Design Rationale

**Why inline (not a separate modal):** The Value Map editor appears directly in the Test Codes detail panel when transform = VALUE_MAP. This was chosen over a separate modal because:

- Admins need to see the mapping context (analyzer code, OBX-2 type, OE test) while editing value maps
- Switching between the mapping row and a separate modal would break the visual connection
- The editor is compact enough to fit in the detail panel without scrolling issues

**Analyzer Value → OpenELIS Value arrow layout:** The arrow (→) between columns reinforces the directional nature of the mapping. This is important because the mapping is one-directional: analyzer sends coded values, OpenELIS stores display values.

**Default action: Reject / Pass-through / Default Value:** Three options rather than just "reject or accept" because real deployments need flexibility:

- Reject: Strict mode — unknown values are flagged as errors. Best for production.
- Pass-through: Store the raw value with a warning. Best for initial setup when not all codes are known yet.
- Default Value: Map all unknown values to a specific value (e.g., "Indeterminate"). Best for tests where unknown results should default to a safe interpretation.

### Query Analyzer Modal — Design Rationale

**Why QRY^R02:** The HL7 QRY^R02 message type allows a host system (OpenELIS) to query an analyzer for its test menu. Not all analyzers support this, but when available, it dramatically simplifies initial configuration — the admin doesn't need to manually enter every test code from the analyzer's documentation.

**Status states (Idle → Querying → Success/Failed):** The modal has explicit status states rather than just showing results because:

- MLLP connections can be slow or fail
- Admins need to know whether a timeout is normal or indicates a configuration problem
- The "Failed" state includes a Retry button for transient errors

**Already Mapped / New badges:** When query results come back, each discovered code is tagged as "Already Mapped" (green, checkbox disabled) or "New" (yellow, checkbox enabled). This prevents accidental duplicate mappings and makes it easy to see what's new.

**Add Selected / Add All buttons:** Bulk operations are essential because analyzers often send 20-50 test codes. Adding them one by one would be tedious.

### Mock Discovered Codes

The 12 mock discovered codes represent a full CBC panel (WBC, RBC, HGB, HCT, PLT, MCV, MCH, MCHC, RDW, MPV, NEUT%, LYMPH%). This was chosen because:

- CBC is the most common panel ordered in clinical laboratories
- It has enough codes (12) to demonstrate the value of bulk operations
- Some codes overlap with existing mappings (WBC, RBC, HGB, HCT, PLT — already mapped) while others are new (MCV, MCH, etc.), demonstrating the Already Mapped/New badge behavior

---

## 5. Milestone 6: Preview Tab and Import Simulation

### Why a Separate Preview Tab (vs. Enhancing the Simulator)

The Message Simulator (Tab 4) and Preview (Tab 5) serve different purposes:

| Feature | Message Simulator | Preview |
|---------|-------------------|---------|
| Input | Paste a single HL7 message | Paste or upload a file (potentially multiple messages) |
| Focus | Parse validation — are fields extracted correctly? | Import simulation — what would happen if this message were live? |
| Output | Parse results table + ACK preview | Summary cards + results table + full parse log |
| Audience | Initial configuration validation | Pre-go-live validation and troubleshooting |

The Preview tab exercises the full configuration chain (field extraction → test matching → QC detection → value transformation → ACK simulation) while the Simulator focuses on parsing correctness.

### Parse Log Design

The parse log was the most carefully designed element of M6. Key decisions:

**Step-by-step trace:** Each log entry has a step number, making it possible to follow the exact processing sequence. This is critical for debugging — if a result is unexpectedly rejected, the admin can trace through the log to see exactly where the failure occurred.

**4 log levels (INFO/WARN/ERROR/DEBUG):** Modeled after standard logging frameworks:

- INFO: Normal processing steps (message received, test matched, ACK generated)
- WARN: Non-fatal issues (unmapped codes, SN auto-parse edge cases)
- ERROR: Fatal issues (value map rejection, parse failures)
- DEBUG: Detailed internal processing (component extraction, transform details)

**Filterable buttons:** The level filter buttons let admins quickly narrow down to problems (ERROR only) or see everything (ALL). During initial setup, DEBUG is useful. During pre-go-live validation, WARN+ERROR is the focus.

**HL7 field references per log entry:** Each log entry includes the HL7 field reference (e.g., "OBX-3 #1", "MSH-3", "QC Rule") so admins can correlate log entries with the raw message.

### Simulation Engine Design

The simulation engine in the mockup is a simplified but realistic parser that:

- Parses MSH — extracts sender application, message ID, timestamp
- Parses PID — extracts patient name (for QC rule evaluation)
- Parses OBR — extracts specimen ID, panel code
- Evaluates QC rules — checks specimen ID prefix and patient name patterns
- Parses OBX — extracts test code, value type, result value, units, flags
- Matches test codes — looks up each OBX-3.1 in the mapping table
- Applies transforms — runs Value Map, Greater/Less Flag, SN auto-parse
- Generates ACK — determines ACK code based on configured ACK mode and results

This chain mirrors what the production implementation will do, making the Preview tab a genuine validation tool rather than just a cosmetic demo.

### Summary Cards Design

The 5 summary cards (Specimens, Matched, Unmatched, QC, Errors) use large numbers with semantic colors:

- Green for matched (good)
- Yellow/amber for unmatched (needs attention)
- Purple for QC (informational)
- Red for errors (action required)

This gives admins an instant visual assessment before diving into details.

---

## 6. Non-Numeric Test Gap Analysis

### The Question

After M6 was complete, the question was raised: "Can this design handle non-numeric tests?"

This was an important check because the initial mockup data was heavily weighted toward numeric tests (CBC panel, chemistry). The gap analysis revealed that while the architecture supported non-numeric tests, the UI implementation had significant gaps for coded/qualitative results.

### Gap Analysis Results

| Scenario | Current Status | Gap | Severity |
|----------|----------------|-----|----------|
| NM → Numeric | Works fully | None | — |
| CE → Select List | Value Map exists but uses free-text | No dropdown from OE select list; no type mismatch warning | HIGH |
| SN → Numeric | Auto-parse works | None | — |
| ST/TX → Text | Pass-through works | No explicit "store as text" confirmation | Low |
| Threshold Classify | Listed in dropdown | No range editor UI | Medium |
| Coded Lookup | Listed in dropdown | No table selector or case sensitivity toggle | Medium |
| NTE comments | Not represented | No extraction/storage config | Low |

### Why CE → Select List Was Highest Priority

The CE (Coded Element) gap was prioritized because:

- **Frequency:** Coded/qualitative tests are extremely common in OpenELIS Global deployments — HIV, HBsAg, RPR, malaria RDTs, blood typing. In many African and Southeast Asian deployments, these represent 30-50% of all analyzer-connected tests.
- **Error risk:** The free-text input for "OpenELIS Value" meant admins could type "Negative" when the actual select list value was "NEG" or "negative". This would cause silent import failures — the result would be stored but wouldn't match the expected coded value, leading to incorrect reporting.
- **User experience:** Admins shouldn't need to memorize or look up select list values. The dropdown should present them automatically.

### Decision: Fix CE → Select List First

The other gaps (Threshold Classify editor, Coded Lookup selector) were deferred because:

- They affect fewer real-world analyzers
- Their absence doesn't cause silent data corruption (unlike the CE gap)
- They can be added as incremental enhancements

---

## 7. Select List Integration — Design Rationale

### Data Model Change: selectListOptions on OE_TESTS

Added selectListOptions arrays to CODED tests in OE_TESTS. Each option has { id, displayValue, code }. This mirrors the Result Options data model from the Result Options Requirements spec.

### 7 CODED tests added with realistic select lists:

- **HIV Ag/Ab Combo:** Negative/Positive/Indeterminate (standard rapid test results)
- **HBsAg:** Negative/Positive/Indeterminate (hepatitis B screening)
- **RPR:** Non-reactive/Reactive/Weakly Reactive (syphilis screening)
- **Blood Group (ABO):** A/B/AB/O (blood typing)
- **Rh Factor:** Positive/Negative (blood typing)
- **Malaria RDT:** Negative/P. falciparum/P. vivax/Mixed/Invalid (malaria rapid diagnostic test — 5 options because multi-species detection is common)

These tests were chosen because they represent the most common coded results in OpenELIS Global's target deployments.

### Dropdown vs. Free-Text — Conditional Rendering

**Design decision:** The "OpenELIS Value" column in the Value Map editor renders as:

- Dropdown when the mapped OE test has a select list → constrained to valid values
- Free-text input when the OE test has no select list → flexible fallback

This conditional approach was chosen over "always dropdown" because:

- Some CODED tests may not have select lists defined yet
- Some NUMERIC tests may use Value Map for edge cases (e.g., mapping "QNS" to a coded value)
- The fallback ensures the feature works even with incomplete test catalog data

### Dropdown Shows displayValue (code)

Each dropdown option shows "Negative (NEG)" rather than just "Negative". The code in parentheses helps admins verify they're mapping to the correct option, especially when multiple options have similar display values.

### Auto-Populate Button

**Rationale:** When an admin selects a CODED OE test and switches to VALUE_MAP, they typically need one Value Map entry per select list option. The "Auto-populate from Select List" button pre-fills these rows, saving manual entry.

**Behavior details:**

- Leaves "Analyzer Value" empty — the admin must fill in what the analyzer sends
- Preserves existing entries — only adds options not already in the map
- Shows toast notification with count of added options

This is a productivity feature. In testing, manually creating 5-7 Value Map rows per coded test was the most time-consuming part of configuration.

### Orphaned Value Detection

**Problem:** If an admin configures a Value Map and then someone later edits the select list in Test Catalog (removes or renames an option), the Value Map entry becomes "orphaned" — it maps to a value that no longer exists.

**Solution:** The dropdown checks whether each entry's openelisValue exists in the current select list. If not, it shows with a yellow background and "⚠ (not in select list)" suffix.

This prevents a subtle class of bugs where configurations work initially but break after test catalog maintenance.

### Auto-Suggest VALUE_MAP

**Trigger:** When an admin selects a CODED OE test (with select list options) for a CE/CWE/CNE OBX and the current transform is Pass-through.

**Action:** Automatically switches the transform dropdown to VALUE_MAP.

**Rationale:** Pass-through on a CE → CODED mapping would store the raw OBX-5.1 code (e.g., "NEG") instead of the OpenELIS display value (e.g., "Negative"). This is almost never what the admin wants. Auto-switching saves a step and prevents misconfiguration.

**Not auto-switching when:** The transform is already something other than Pass-through (e.g., Coded Lookup). This respects intentional configuration choices.

### Result Type Mismatch Detection (FR-25.7)

**Problem:** Nothing in the original UI prevented mapping a CE OBX to a NUMERIC OE test, or an NM OBX to a CODED OE test. These mismatches would cause import failures or incorrect data storage.

**Solution:** A result type comparison row in the detail panel showing:

- OBX-2 badge → OE result type badge
- Checkmark when compatible
- Warning when incompatible

**Mismatch matrix:**

| OBX-2 | OE NUMERIC | OE CODED |
|-------|-----------|----------|
| NM | ✓ | ⚠ |
| CE/CWE/CNE | ⚠ | ✓ |
| ST/TX | ✓ | ✓ |
| SN | ✓ | ⚠ |

ST/TX (text) is compatible with both because text can represent either numeric or coded values as strings.

**Three UI locations for mismatch warnings:**

- Detail panel: Full comparison row with explanation text
- Table row: Small ⚠ icon next to OBX-2 badge (quick scan)
- Value Map editor: Yellow banner at top (contextual to the transform)

### Purple hint for CODED without VALUE_MAP

When an admin maps a CODED OE test but leaves the transform as Pass-through, a purple hint says "This OpenELIS test uses a select list. Consider switching to the Value Map transform." This is gentler than an error — it's a suggestion, not a block, because there may be legitimate reasons to use Pass-through on coded tests.

### Default Value Dropdown

When Default Action = DEFAULT and the OE test has a select list, the default value field also renders as a dropdown instead of free-text. This ensures the default value is always a valid select list option.

### Value Map Mock Data

Three pre-loaded coded test mappings demonstrate different configurations:

- **HIV Ag/Ab Combo (m6):** 3 entries (NEG→Negative, POS→Positive, IND→Indeterminate), default action = REJECT. Represents a strict production configuration.
- **HBsAg (m10):** 3 entries (NEG→Negative, POS→Positive, EQV→Indeterminate), default action = REJECT. Note: the analyzer sends "EQV" (equivocal) but OpenELIS maps to "Indeterminate" — this demonstrates code-to-display-value translation.
- **RPR (m11):** 2 entries (NR→Non-reactive, R→Reactive), default action = DEFAULT with default value = "Weakly Reactive". Demonstrates the default value feature — if the analyzer sends an unrecognized code, it defaults to "Weakly Reactive" rather than rejecting.

---

## 8. ASTM v1.2 Addendum Work

### Overview: Analyzer Profile System

The ASTM Analyzer Mapping Specification v1.2 addendum introduces the **Analyzer Profile System**, a portable JSON format for complete analyzer configurations. This addresses a critical operational challenge: how administrators can get new analyzers configured quickly and correctly without manual entry of every test code, QC rule, and extraction override.

With v1.0/v1.1 configuration surface established, profiles emerge as the new standard unit of deliverable for analyzer support. Rather than shipping compiled Java plugins, the OpenELIS community now ships JSON profile files that any site can import, customize, and share.

### FR-22: Analyzer Profile Format

#### Profile JSON Schema Design

The profile schema captures the complete analyzer configuration in portable JSON format, excluding only site-specific identifiers and runtime state:

**Included in Profile:**
- Connection defaults (role, default port, timeout, retry)
- Protocol version
- Field extraction positions
- Test code mappings with suggested OpenELIS test matches
- QC identification rules
- Abnormal flag mappings
- Value transformation rules and configs
- Aggregation mode and window

**NOT Included (Site-Specific):**
- Analyzer name
- Actual IP address (for client mode)
- Actual listen port (pre-filled from default, but user confirms)
- OpenELIS test ID bindings (resolved at import time)
- Database primary keys
- Runtime state (pending codes, last modified)
- Lab unit assignments (site-specific)
- Analyzer status (always starts as Setup)

#### Test Code Mapping Resolution Algorithm

When a profile is imported, the system attempts automatic matching using a three-tier algorithm:

1. **Exact code match:** If an OpenELIS test exists with the same testCode, auto-bind (status: mapped)
2. **Fuzzy name match:** If test code doesn't match but test name matches (case-insensitive), suggest as probable match (status: suggested)
3. **No match:** Leave unmapped with the suggested name visible for the administrator to resolve (status: unmapped)

The import summary displays match statistics: "X auto-matched, Y suggested, Z need manual mapping". This design respects the reality that test codes vary by site (some use "GLU", others use "GLUCOSE") while providing automation for the common cases.

#### Profile Version Compatibility

- profileVersion tracks the schema version (currently 1.0)
- compatibleOpenelisVersion uses semver range to indicate minimum OpenELIS version
- On import, the system validates both and warns if the profile was created for a newer version
- Backward compatibility: profiles from older schema versions are imported with defaults for missing sections

### FR-23: Profile Library

The system maintains a library of available analyzer profiles sourced from three channels:

#### Built-in Profiles

OpenELIS ships with profiles for common analyzers. These are read-only and cannot be deleted or modified but can be duplicated.

**Initial built-in catalog (target):**

| Profile ID | Manufacturer | Model | Protocol | Tests |
|------------|-------------|-------|----------|-------|
| indiko-plus-chemistry-v1 | Thermo Fisher | Indiko Plus | ASTM | ~48 |
| maldi-biotyper-astm-v1 | Bruker | MALDI Biotyper sirius | ASTM | Organism ID |
| vidas-immunoassay-v1 | bioMérieux | VIDAS | ASTM | ~12 |
| stago-st4-coag-v1 | Stago | ST4/STA-R | ASTM | ~8 |
| sysmex-xn-hema-v1 | Sysmex | XN Series | ASTM | ~30 |
| mindray-bs-chem-v1 | Mindray | BS-200/300/400 | HL7 | ~40 |
| mindray-bc5380-hema-v1 | Mindray | BC-5380 | HL7 | ~26 |

Built-in profiles are stored as JSON resources in the application package and loaded at startup.

#### Uploaded Profiles (Site Library)

Administrators can upload .json profile files to the site library. Uploaded profiles:

- Are validated against the profile JSON schema on upload
- Appear in the profile selector alongside built-in profiles
- Can be edited (metadata only — name, description, tags) or deleted by admins
- Are stored in the database (not filesystem) for portability

#### Community Repository Integration

The system supports importing profiles from the OpenELIS community repository:

- **Download & Import:** Administrator downloads a .json file from the community site and uploads it via the standard import flow
- **Future (Phase 2):** In-app browser for community profiles with one-click import
- **No auto-sync:** Profiles are not automatically updated from the repository. Each import is a point-in-time snapshot.

#### Profile Export

Any configured analyzer can be exported as a profile file:

- **Export action:** Available from the analyzer overflow menu (⋮ → "Export Profile")
- **Export behavior:** Serializes the current configuration to the profile JSON schema
- **Site-specific stripping:** The export process removes site-specific data (analyzer name, IP addresses, database IDs, OpenELIS test ID bindings) and replaces them with suggested names/codes
- **Metadata prompt:** Before export, user is prompted to provide profile name, description, author, and tags
- **File download:** Browser downloads {profileId}.json

### FR-24: Profile Selection in Analyzer Setup Modal Redesign

The "Add Analyzer" modal replaces the former "Analyzer Type" field with an "Analyzer Profile" selector, making profile selection the primary onboarding mechanism.

#### Revised Field Structure

| Field | Type | Source | Behavior |
|-------|------|--------|----------|
| Analyzer Name | Text input | Manual | Required. User enters site-specific name. |
| Analyzer Profile | Dropdown + Import | Profile Library | "None (Start from Scratch)" + all available profiles, grouped by source. Import button opens file picker. |
| Status | Dropdown | System | Default: Setup. Same as v1.0. |
| Lab Units | Multi-select (filterable) | System lab units | Select one or more lab units this analyzer serves. |
| Protocol Version | Dropdown | Profile or manual | Pre-filled when profile selected. Editable. |
| Connection Role | Dropdown | Profile or manual | Pre-filled when profile selected. Editable. |
| Listen Port / IP + Port | Conditional | Profile or manual | Pre-filled with profile defaults. User must confirm/adjust. |
| Connection Timeout | Number | Profile or manual | Pre-filled. Editable. |
| NAK Retry Count | Number | Profile or manual | Pre-filled. Editable. |

#### Profile Selector UI Design

The "Analyzer Profile" field is a searchable dropdown with grouped options using Carbon's `<ComboBox>` with custom group headers:

```
Analyzer Profile Dropdown
├─ None (Start from Scratch)
├─ BUILT-IN
│  ├─ Thermo Fisher Indiko Plus — Chemistry
│  ├─ Bruker MALDI Biotyper sirius — Organism ID
│  ├─ bioMérieux VIDAS — Immunoassay
│  └─ ...
├─ SITE LIBRARY
│  └─ Custom Indiko (modified QC rules)
└─ 📁 Import from File...
```

#### Profile Apply Behavior

When a profile is selected:

1. **Connection fields** pre-fill: role, default port, timeout, retry
2. **Protocol version** pre-fills from profileMeta.protocolVersion
3. **Info banner** appears below profile selector showing: profile name, version, author, test count, description snippet
4. **Modal saves** the analyzer with the profile reference
5. **On first visit to Field Mappings page:** Test code mappings, QC rules, extraction config, flag mappings, and transforms are populated from the profile. Auto-matching runs against existing OpenELIS tests
6. **Import summary notification** shows: "Profile loaded: X test codes (Y auto-matched, Z need mapping), N QC rules, flag mappings applied"

When "None (Start from Scratch)" is selected:
- All fields start empty/default
- Field Mappings page starts with empty tables
- Protocol version defaults to ASTM LIS2-A2

#### Import from File

The "Import from File" option at the bottom of the profile selector:

1. Opens the browser file picker (accept: .json)
2. Validates the file against the profile JSON schema
3. On success: applies the profile to the current modal AND adds it to the site library
4. On failure: displays validation errors inline
5. Option to "Import to library only" (save for later use without applying now)

### FR-25: Lab Unit Assignment

The system allows assignment of one or more lab units to each analyzer, replacing the former "Analyzer Type" (single-select lab department category) field.

#### Lab Unit Multi-Select

| Field | Type | Data Source |
|-------|------|-------------|
| Lab Units | `<FilterableMultiSelect>` | `/api/lab-units?isActive=true` |

- Displays all active lab units configured in the system
- User can select one or more lab units that this analyzer serves
- Selected lab units appear as tags/pills below the dropdown
- Searchable/filterable by lab unit name
- Optional — an analyzer can be saved without lab unit assignment during initial setup

#### Lab Unit Display

- Lab units appear on the Analyzer List table as a new "Lab Units" column, displaying tags
- Lab units are included in the Analyzer List search and filter capabilities
- The Analyzer List "Status" filter is supplemented with a "Lab Unit" filter dropdown

#### Lab Unit in Profile

- Profiles do NOT include lab unit assignments (these are site-specific)
- When a profile is applied, the Lab Units field remains empty for manual selection
- Lab units are included in profile export metadata as suggestedLabUnits (informational only, not auto-applied)

### Why Profiles Replace Compiled Java Plugins as the Deliverable

The shift from compiled plugins to JSON profiles represents a fundamental change in how analyzer integrations are delivered:

**Old Model (Plugins):**
- Integration team writes Java code for each analyzer
- Code is compiled into a .jar file
- Sites must deploy the new .jar and restart the application
- Updates require code review and recompilation
- Difficult to customize per site

**New Model (Profiles):**
- Integration team creates a JSON profile documenting the analyzer's configuration
- No compilation required — profiles are distributed as plain JSON files
- Sites can import profiles without application restart
- Sites can fork and customize profiles for their needs
- Profiles can be shared, versioned, and managed via the community repository
- Non-technical users can modify profiles if needed

**Why This Matters:**
1. **Democratization:** Sites can now contribute and share analyzer configurations without Java development skills
2. **Maintainability:** JSON is human-readable and easier to version-control than compiled code
3. **Flexibility:** Sites can customize profiles and export them back for sharing
4. **Portability:** Profiles move between versions of OpenELIS more easily than compiled plugins
5. **Community:** Profiles enable a true ecosystem where the community develops and shares configurations

### Test Code Auto-Matching Algorithm Details

The three-tier matching algorithm is critical for reducing manual configuration effort:

**Tier 1: Exact Code Match**
- Algorithm: Direct string match on testCode
- Status: mapped
- Confidence: 100%
- Example: Analyzer sends "GLU", OpenELIS has test with code "GLU" → auto-bind

**Tier 2: Fuzzy Name Match**
- Algorithm: Case-insensitive name comparison
- Status: suggested (user must review and accept)
- Confidence: 80-90%
- Example: Analyzer sends "GLUCOSE", OpenELIS has test "Glucose" → suggest match

**Tier 3: No Match**
- Status: unmapped
- Confidence: 0%
- Requires: Manual administrator action
- Prevents: Silent misconfiguration

The design respects that test naming conventions vary widely by region, laboratory type, and analyzer vendor. Exact matches are fully automated; suggested matches require validation (preventing incorrect mappings); unmapped codes remain visible for attention.

### Profile Export Sanitization Decisions

Export must strip all site-specific data to ensure that a profile exported from one site can be safely imported at another without exposing sensitive information:

**Data Stripped:**
- Database IDs (UUIDs, foreign keys) — not needed at import, re-generated
- Analyzer name — site-specific identifier
- IP addresses and actual port numbers — replaced with defaults
- OpenELIS test ID bindings — replaced with suggestedTestName + suggestedTestCode (fuzzy matching at import time)
- Lab unit assignments — replaced with suggestedLabUnits (informational only)
- Runtime state — pending codes, timestamps (not part of configuration)

**Data Preserved:**
- Test code mappings (analyzer code → test name)
- Value transformations and their configs
- QC identification rules
- Abnormal flag mappings
- Field extraction overrides
- Aggregation settings

This approach ensures that exported profiles are configuration blueprints, not database exports. They can be versioned, reviewed, and shared without security or privacy concerns.

---

## 9. Breadcrumb and Sidebar Navigation Fix

### Design Rationale for Navigation Hierarchy

The navigation structure needs to clearly reflect the conceptual hierarchy of analyzer configuration:

```
Admin (top-level)
  └─ Analyzer Management (where all analyzer work happens)
     └─ [Analyzer Name] (focus on specific analyzer)
        └─ [Sub-page: Test Codes, QC Config, etc.]
```

This hierarchy reinforces that:
- The analyzer list is the "home" for all analyzer configuration
- Each analyzer is a container for its configuration pages
- Tabs/sub-pages belong to a specific analyzer, not to the global admin context

This is especially important when admins manage 10+ analyzers and need to quickly orient themselves — the breadcrumb tells them exactly where they are.

### Target Breadcrumb Structure

The breadcrumb should display:

**List View:**
```
Admin > Analyzer Management
```

**Analyzer Overview:**
```
Admin > Analyzer Management > BC-5380
```

**Sub-pages:**
```
Admin > Analyzer Management > BC-5380 > Field Mappings
Admin > Analyzer Management > BC-5380 > Test Codes
Admin > Analyzer Management > BC-5380 > QC Config
Admin > Analyzer Management > BC-5380 > Communication (ASTM) / ACK Config (HL7)
```

Each breadcrumb segment must be clickable to navigate back up the hierarchy.

### Sidebar Behavior

The sidebar should:

1. **Highlight the current section:** When viewing analyzer sub-pages, the "Analyzers" section should be expanded and highlighted
2. **Show analyzer name:** If space permits, display the current analyzer name under the expanded Analyzers section
3. **Maintain consistency:** Both ASTM and HL7 mockups should implement the same breadcrumb and sidebar patterns

### Implementation Scope

**Applies to both:**
- ASTM Analyzer Mapping mockup (analyzer-mapping-templates-mockup.jsx)
- HL7 Analyzer Mapping mockup (hl7-analyzer-mapping-mockup.jsx)

**Status:** The breadcrumb fix was blocked by compute environment unavailability. To be completed in a follow-up session. This change should propagate to both mockups for consistency across the analyzer integration surface.

---

## 10. Cowork Migration

### Rationale for Migration

The analyzer integration design work is being migrated to Cowork for improved file management and collaboration. This move enables:

- **Better file organization:** Profiles, specs, mockups, and test data in a single shared workspace
- **Version control:** Track changes to profiles and configurations across multiple sites
- **Community collaboration:** Enable other labs and vendors to contribute analyzer profiles
- **Access control:** Manage permissions for who can edit profiles, add new analyzers, etc.

### Workflow Structure in Cowork

Files will be organized as:

```
/analyzer-integration/
  ├─ specifications/
  │  ├─ astm-analyzer-mapping-v1.0.md
  │  ├─ astm-analyzer-mapping-addendum-v1.1.md
  │  └─ astm-analyzer-mapping-addendum-v1.2-profiles.md
  ├─ hl7-analyzer-mapping-addendum-v1.1.md
  ├─ mockups/
  │  ├─ astm-analyzer-mapping-templates-mockup.jsx
  │  └─ hl7-analyzer-mapping-mockup.jsx
  ├─ profiles/
  │  ├─ built-in/
  │  │  ├─ indiko-plus-chemistry-v1.json
  │  │  ├─ maldi-biotyper-astm-v1.json
  │  │  └─ ...
  │  └─ community-submitted/
  └─ test-data/
     ├─ mock-analyzers.json
     ├─ mock-messages/
     └─ test-cases/
```

This organization makes it easy for contributors to find, understand, and extend analyzer integrations.

---

## 11. Remaining Gaps and Future Work

### Gaps Identified but Not Addressed

| Gap | Severity | Notes |
|-----|----------|-------|
| Threshold Classify editor UI | Medium | Need range table with min/max/label rows, overlap validation. Important for MALDI Biotyper (protein match scores). |
| Coded Lookup editor UI | Medium | Need master table selector (Organism Master, Antibiotic Master, Data Dictionary), case sensitivity toggle. Important for MALDI Biotyper (organism names). |
| CE component extraction config | Low | Currently always uses OBX-5.1 (code). Some analyzers might need OBX-5.2 (display text). Could add a "CE Store Component" dropdown. |
| NTE segment handling | Low | No extraction or storage config for HL7 comment segments. NTE can carry important clinical context. |
| Multi-line TX/FT storage | Low | No explicit handling for text results that span multiple OBX segments. Need concatenation rules. |
| ASTM breadcrumb fix | Medium | Breadcrumb hierarchy needs to be fixed in both ASTM and HL7 mockups. |

### Recommended Next Steps

1. **ASTM breadcrumb fix** — Apply to both mockups
2. **Threshold Classify editor** — Add range table UI to mockup, needed for MALDI Biotyper integration
3. **Coded Lookup editor** — Add master table selector, needed for MALDI Biotyper integration
4. **Update Analyzer Integration Tracker** — Add HL7 analyzer entries per 1.2 profiling approach
5. **Developer handoff** — Review spec + mockup with implementation team
6. **Community profile contributions** — Set up process for sites to submit profiles

---

## 12. Deliverable Summary

### Files Produced

| File | Lines | Description |
|------|-------|-------------|
| hl7-analyzer-mapping-addendum-v1_1.md | 2,133 | HL7 Functional Requirements Specification |
| hl7-analyzer-mapping-mockup.jsx | 2,111 | Interactive React mockup (Carbon Design System) |
| astm-analyzer-mapping-addendum-v1_2.md | 651 | ASTM Profile System Specification |
| OGC-325-comprehensive-transcript.md | [this file] | Comprehensive design session transcript covering both HL7 and ASTM v1.2 |

### HL7 Spec Contents

- 9 functional requirements (FR-22 through FR-30)
- 8 business rules (BR-18 through BR-25)
- 12 user stories across 4 epics (Epics 9–12)
- 16 API endpoints
- 7 database tables
- 120+ i18n localization tags
- 66 acceptance criteria (AC-87 through AC-152)
- FR-25.6: Select List Integration for Value Maps
- FR-25.7: Result Type Mismatch Detection

### HL7 Mockup Contents

- Analyzer list view with protocol badges
- Add/Edit modal with MLLP configuration
- 7 interactive tabs: Test Codes, QC Rules, ACK Config, Message Simulator, Preview, Field Extraction, Advanced
- Select list-integrated Value Map editor
- Query Analyzer modal
- Import simulation with parse log
- 17 mock OE tests (10 NUMERIC, 7 CODED with select list options)
- 11 mock test code mappings (8 NUMERIC, 3 CODED with value maps)

### ASTM v1.2 Profile System Contents

- FR-22: Analyzer Profile Format with complete JSON schema
- FR-23: Profile Library (Built-in, Site Library, Community Repository)
- FR-24: Profile Selection in Analyzer Setup modal redesign
- FR-25: Lab Unit Assignment (multi-select, replacing single "Analyzer Type")
- 2 new Business Rules (BR-18 through BR-21, with BR-22 for lab units)
- 2 new Epics with 4 new User Stories
- 7 new API endpoints
- 3 database schema additions
- 24 new localization tags
- 8 new acceptance criteria

### Jira Actions

- Comment posted to OGC-325 with HL7 deliverable summary
- Comment posted to OGC-337 with ASTM v1.2 profile system summary
- Files to be attached or linked per Jira workflow

### Outstanding Items

- ASTM breadcrumb fix (blocked by compute — follow-up session)
- Analyzer Integration Tracker update
- Threshold Classify and Coded Lookup editor UIs (future milestone)
- Cowork migration and workspace setup
- Community profile contribution workflow

### Profiling Approach Compliance

Per the 1.2 style profiling approach for ASTM and HL7 analyzer integrations:

**HL7 Integration (OGC-325):**
- Mapping doc — COMPLETE (hl7-analyzer-mapping-addendum-v1_1.md)
- Companion analyzer setup doc — COMPLETE (hl7-analyzer-mapping-mockup.jsx)
- Analyzer Integration Tracker update — TO DO (Tracker link)

**ASTM Profile System (OGC-337):**
- Profile specification — COMPLETE (astm-analyzer-mapping-addendum-v1_2.md)
- Profile library management — COMPLETE (API endpoints defined, mockup integration planned)
- Profile export/import — COMPLETE (schema and business rules defined)
- Lab Unit assignment — COMPLETE (FR-25, UI patterns defined)
- Database schema — COMPLETE (analyzer_profile, analyzer_lab_unit tables)
- Localization — COMPLETE (profile system tags + lab unit tags)

---

## Document Metadata

**Title:** OGC-325 — HL7 Analyzer Mapping Addendum v1.1 + ASTM Profile System v1.2 — Comprehensive Design Session Transcript

**Date:** February 27–March 3, 2026

**Status:** Complete

**Author:** Casey Iiams-Hauser

**Related Jira Tickets:**
- OGC-325: HL7 Analyzer Mapping Addendum v1.1
- OGC-337: Generic ASTM Plugin v1.1 (Analyzer Profile System)
- OGC-324: ASTM Analyzer Mapping Templates v1.0

**Keywords:** Analyzer integration, HL7, ASTM, profiles, mockup, design, requirements specification

---

*This comprehensive transcript serves as the authoritative reference for all design decisions, rationale, and context across both the HL7 analyzer mapping work and the ASTM profile system work. It should be consulted whenever questions arise about "why was this feature designed this way?" or "what alternatives were considered?"*
