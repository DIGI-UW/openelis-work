# Help Menu Feature
## Functional Requirements & User Stories
### OpenELIS Global

---

## Overview

A modern, integrated help system providing users with contextual assistance, documentation access, training resources, release information, an LLM-powered assistant placeholder (Catalyst), and customizable local support contact details.

---

## Functional Requirements

### FR-I18N: Internationalization & Language Support

1. The system SHALL use translatable text blocks for all UI text in the help menu (labels, buttons, messages, section headers).
2. The system SHALL manage all translatable strings through Transifex.
3. The system SHALL display help menu content in the user's currently set application language by default.
4. The system SHALL provide a language dropdown within the help panel when documentation is not available in the user's current language.
5. The system SHALL indicate which languages are available for each documentation section.
6. The system SHALL fall back to English if the user's language is not available and no alternative is selected.
7. The system SHALL persist language preference for help content separately from main application language (optional user override).
8. The system SHALL support all languages currently available in OpenELIS Global (English, French, and others as configured).

### FR-NAV: Help Menu Navigation & Access

1. The system SHALL display a Help icon (question mark) in the global header, visible from all screens.
2. The system SHALL open a slide-out side panel from the right when the Help icon is clicked.
3. The system SHALL allow users to close the help panel via X button, clicking outside the panel, or pressing Escape.
4. The system SHALL organize help content into three tabs: Documentation, Catalyst AI, and Support.
5. The system SHALL allow users to continue viewing and interacting with the main application while the help panel is open.
6. The system SHALL be accessible to all authenticated users regardless of role.
7. The system SHALL display all navigation labels and UI elements using translatable text keys.

### FR-DOC: Documentation Tab

The Documentation tab SHALL contain the following sections:

**End User Guide Section:**

1. The system SHALL provide links to: Navigating OpenELIS Global (login, home dashboard, menu navigation).
2. The system SHALL provide links to: Order Entry (creating orders, patient search, sample collection).
3. The system SHALL provide links to: Results Entry (entering results, result validation, analyzer imports).
4. The system SHALL provide links to: Validation (validating results, rejection workflows).
5. The system SHALL provide links to: Reports (patient reports, aggregate reports, routine exports).
6. The system SHALL provide links to: Quality Control documentation.
7. The system SHALL provide links to: Referred Samples (referral workflows, receiving referred samples).

**Administrator Guide Section:**

8. The system SHALL provide links to: Administration Module access.
9. The system SHALL provide links to: User Management (creating users, roles, permissions).
10. The system SHALL provide links to: Test Catalog Management (tests, panels, result ranges).
11. The system SHALL provide links to: Site Configuration (site ID, organization settings, geographic fields).
12. The system SHALL provide links to: Analyzer Configuration (ASTM mapping, bidirectional communication).
13. The system SHALL provide links to: Interoperability Settings (FHIR, consolidated server, client registry).

**Training Section:**

14. The system SHALL display a Training section at the end of the Documentation tab.
15. The system SHALL provide a link to the configured training site URL, or default to `training.openelis-global.org` if not configured.
16. The system SHALL provide links to the OpenELIS Global community resources (forum, wiki, weekly community call).

**Release Notes Section:**

17. The system SHALL display a Release Notes section at the end of the Documentation tab.
18. The system SHALL display the current OpenELIS Global version number.
19. The system SHALL provide a link to the latest release notes.
20. The system SHALL provide a link to the full release history/changelog.
21. The system SHALL provide a link to the Software Release Roadmap.

**General:**

22. The system SHALL open all documentation, training, and release note links in a new browser tab.
23. The system SHALL link to the language-appropriate version of documentation when available.
24. The system SHALL display all labels using translatable text keys managed in Transifex.

### FR-CAT: Catalyst AI Tab

1. The system SHALL include a Catalyst AI tab in the help panel.
2. The system SHALL display "Coming Soon" messaging for the Catalyst feature using translatable text keys.
3. The system SHALL provide a disabled/placeholder text input area for future natural language queries.
4. The system SHALL display a placeholder response area for future AI-generated answers.
5. The system SHALL respect Catalyst-specific permissions when the feature is enabled (defined in Catalyst Functional Requirements).
6. The system SHALL display all Catalyst placeholder UI text using translatable text keys managed in Transifex.

### FR-SUP: Support Tab

**User-Facing Display:**

1. The system SHALL display configured local support information in the Support tab.
2. The system SHALL display the support contact name.
3. The system SHALL display configured telephone numbers as clickable links (tel: links).
4. The system SHALL display configured email addresses as clickable links (mailto: links).
5. The system SHALL display configured web-based support links.
6. The system SHALL display the custom support message prominently (e.g., support hours, after-hours contacts).
7. The system SHALL show a default message if no local support is configured, using translatable text.
8. The system SHALL display all static labels in the Support tab using translatable text keys.

### FR-ADMIN: Admin Configuration (Help Menu Settings)

Accessible via Admin > Site Configuration > Help Menu Settings:

**Training Site Configuration:**

1. The system SHALL allow administrators to configure a custom training site URL.
2. The system SHALL use `training.openelis-global.org` as the default training site URL if no custom URL is configured.
3. The system SHALL validate that the configured training URL is a valid URL format before saving.

**Local Support Configuration:**

4. The system SHALL allow administrators to configure a support contact name.
5. The system SHALL allow administrators to configure one or more telephone numbers (no maximum limit).
6. The system SHALL allow administrators to configure one or more email addresses.
7. The system SHALL validate email address format before saving.
8. The system SHALL allow administrators to configure web-based support links (e.g., ticketing system URL).
9. The system SHALL allow administrators to enter a custom support message (free text, up to 500 characters).
10. The system SHALL persist all help menu configuration in the database.
11. The system SHALL display all configuration form labels using translatable text keys managed in Transifex.

---

## User Stories

### Lab Technician Stories

| ID | US-TECH-001 |
|---|---|
| **As a** | Lab Technician |
| **I want to** | quickly access help documentation while working |
| **So that** | I can get answers without leaving my current workflow |
| **Acceptance** | Given I am on any screen in OpenELIS, When I click the Help icon in the header, Then a help panel opens without navigating away from my current page. |

| ID | US-TECH-002 |
|---|---|
| **As a** | Lab Technician |
| **I want to** | find documentation about order entry |
| **So that** | I can learn how to properly create lab orders |
| **Acceptance** | Given I have the help panel open, When I navigate to the Documentation section, Then I see a link to "Order Entry" documentation that opens in a new tab. |

| ID | US-TECH-003 |
|---|---|
| **As a** | Lab Technician |
| **I want to** | contact local IT support when I have a system issue |
| **So that** | I can get help from someone who knows our specific setup |
| **Acceptance** | Given I have the help panel open, When I click the Support tab, Then I see my organization's support contact name, phone number, and email. |

| ID | US-TECH-004 |
|---|---|
| **As a** | Lab Technician |
| **I want to** | access training resources |
| **So that** | I can learn how to use the system effectively |
| **Acceptance** | Given I have the help panel open, When I scroll to the Training section in the Documentation tab, Then I see a link to the training site that opens in a new tab. |

| ID | US-TECH-005 |
|---|---|
| **As a** | Lab Technician |
| **I want to** | view help content in my preferred language |
| **So that** | I can understand the documentation in my native language |
| **Acceptance** | Given I have set my application language to French, When I open the help panel, Then all UI labels display in French. Given documentation is not available in French, When I view the Documentation tab, Then I see a language dropdown to select an available language. |

### Lab Supervisor Stories

| ID | US-SUP-001 |
|---|---|
| **As a** | Lab Supervisor |
| **I want to** | find documentation on QC procedures |
| **So that** | I can ensure my team follows proper quality control protocols |
| **Acceptance** | Given I have the help panel open on the Documentation tab, When I view the End User Guide section, Then I see a link to Quality Control documentation. |

| ID | US-SUP-002 |
|---|---|
| **As a** | Lab Supervisor |
| **I want to** | see what's new in the latest release |
| **So that** | I can inform my team about new features and changes |
| **Acceptance** | Given I have the help panel open on the Documentation tab, When I scroll to the Release Notes section, Then I see the current version number and a link to the latest release notes. |

| ID | US-SUP-003 |
|---|---|
| **As a** | Lab Supervisor |
| **I want to** | ask questions about my lab's data using natural language |
| **So that** | I can quickly get reporting insights without building complex queries |
| **Acceptance** | Given I have the help panel open, When I click the Catalyst AI tab, Then I see the "Coming Soon" placeholder for the AI assistant. |

### System Administrator Stories

| ID | US-ADMIN-001 |
|---|---|
| **As a** | System Administrator |
| **I want to** | configure local support contact information |
| **So that** | users can reach the appropriate support team for our facility |
| **Acceptance** | Given I am in Admin > Site Configuration > Help Menu Settings, When I enter support contact details and save, Then all users see the updated information in the Support tab of the help panel. |

| ID | US-ADMIN-002 |
|---|---|
| **As a** | System Administrator |
| **I want to** | add a custom message about support hours |
| **So that** | users know when support is available and what to do after hours |
| **Acceptance** | Given I am in the Help Menu Settings, When I enter a custom message (e.g., "Support available Mon-Fri 8am-5pm. After hours call: +1-555-0199"), Then all users see this message in the Support tab. |

| ID | US-ADMIN-003 |
|---|---|
| **As a** | System Administrator |
| **I want to** | add multiple contact methods for support |
| **So that** | users can reach support via their preferred channel |
| **Acceptance** | Given I am in the Help Menu Settings, When I add multiple phone numbers, emails, and a ticketing system URL, Then all contact methods display in the Support tab with appropriate clickable links. |

| ID | US-ADMIN-004 |
|---|---|
| **As a** | System Administrator |
| **I want to** | access administrator documentation |
| **So that** | I can learn how to configure system settings |
| **Acceptance** | Given I have the help panel open, When I navigate to Documentation > Administrator Guide, Then I see links to User Management, Test Catalog, Site Configuration, and Interoperability documentation. |

| ID | US-ADMIN-005 |
|---|---|
| **As a** | System Administrator |
| **I want to** | ensure help menu text is available for translation |
| **So that** | users in different regions can use the help system in their language |
| **Acceptance** | Given all help menu UI strings are defined as translatable keys, When a translator accesses Transifex, Then they can translate all help menu labels, messages, and button text. |

| ID | US-ADMIN-006 |
|---|---|
| **As a** | System Administrator |
| **I want to** | configure a custom training site URL |
| **So that** | users are directed to our organization's training materials |
| **Acceptance** | Given I am in Admin > Site Configuration > Help Menu Settings, When I enter a custom training site URL and save, Then users see the training link in the Documentation tab pointing to our custom site. Given I leave the training URL field empty, When users view the Training section, Then the link points to the default training.openelis-global.org site. |

### Implementer Stories

| ID | US-IMP-001 |
|---|---|
| **As an** | Implementer |
| **I want to** | access the software roadmap |
| **So that** | I can plan for upcoming features and releases |
| **Acceptance** | Given I have the help panel open on the Documentation tab, When I scroll to the Release Notes section, Then I can access a link to the Software Release Roadmap. |

| ID | US-IMP-002 |
|---|---|
| **As an** | Implementer |
| **I want to** | find interoperability documentation |
| **So that** | I can configure connections to external systems like OpenMRS and client registries |
| **Acceptance** | Given I have the help panel open, When I navigate to Documentation > Administrator Guide > Interoperability, Then I find documentation on FHIR integration, consolidated server setup, and client registry configuration. |

| ID | US-IMP-003 |
|---|---|
| **As an** | Implementer |
| **I want to** | access community resources |
| **So that** | I can connect with other implementers and get additional support |
| **Acceptance** | Given I have the help panel open on the Documentation tab, When I scroll to the Training section, Then I see links to the OpenELIS wiki, forum, and community call information. |

---

## Documentation Tab Structure

The Documentation tab in the help panel should contain the following sections:

### End User Guide

- PART 1: NAVIGATING OpenELIS GLOBAL
  - Login and Authentication
  - Home Dashboard
  - Menu Navigation
- Order Entry
- Results Entry
- Validation
- Reports
- Quality Control
- Referred Samples

### Administrator Guide

- PART 3: ACCESSING THE OpenELIS GLOBAL ADMINISTRATION MODULE
- User Management
- Test Catalog Management
- Site Configuration
- Analyzer Configuration
- Interoperability Settings
  - FHIR API Configuration
  - Consolidated Server Connection
  - Client Registry Integration
  - OpenMRS Integration

### Training

- Training Site (default: training.openelis-global.org, admin-configurable)
- OpenELIS Global Wiki
- Community Forum (OpenELIS Talk)
- Weekly Community Call

### Release Notes

- Current Version Display
- Latest Release Notes
- Full Release History / Changelog
- Software Release Roadmap
