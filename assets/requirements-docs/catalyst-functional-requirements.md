# Catalyst - OpenELIS Lab Data Assistant
## Functional Requirements Document

**Version:** 1.0  
**Date:** November 2025  
**Status:** Draft  

---

## 1. Executive Summary

Catalyst is an LLM-powered data assistant for OpenELIS Global that enables users to generate custom data extracts, reports, and dashboard widgets using natural language prompts. The feature provides a privacy-first architecture where the LLM only accesses database schema (never patient data), with all data processing occurring locally. Catalyst aims to replace the existing Jasper Reports and PSQL extract infrastructure with a more flexible, user-friendly reporting framework.

### 1.1 Target Users

- **Lab Managers** - Operational reporting, workload analysis, performance metrics
- **Case Managers** - Program-specific follow-up reports (HIV, TB, etc.)
- **QA Officers** - Quality indicators, turnaround times, rejection rates

### 1.2 Core Capabilities

- Natural language report/extract generation via LLM
- Custom dashboard widgets with drag-and-drop layout
- Scheduled recurring reports with configurable delivery
- Shareable reports and snapshots across users and lab units
- Fallback query builder UI for non-LLM operation
- Migration path for existing preset reports

---

## 2. User Interface Components

### 2.1 Catalyst Sidebar Launcher

**Location:** Microscope icon in the top navigation menu (persistent across all screens)

**Behavior:**
- Clicking the icon opens a fixed-width sidebar on the right side of the screen
- Sidebar appears alongside current content without obscuring it
- Collapsible via icon click or collapse button
- System remembers open/closed state across navigation
- Automatically pulls context from the current screen when launched (e.g., patient record, sample, program)

### 2.2 Chat Interface (Default Mode)

**Layout:**
- Conversation-style interface with message history
- User prompt input at bottom
- Results display area with preview functionality
- "Show Reasoning" expandable section for verbose LLM output

**Prompt Management:**
- Previous prompts saved automatically
- Users can star, rename, delete, or add prompts to collections
- Searchable prompt history

### 2.3 Wizard Mode (Structured Alternative)

**Purpose:** Guide users through report creation with structured questions

**Wizard Steps:**
1. **Output Type Selection** - Report, widget, graph, or data extract
2. **Output Format** - CSV, PDF, Excel, JSON, HL7/FHIR, custom delimited
3. **Data Elements** - Field selection with friendly names
4. **Filters & Parameters** - Date ranges, program filters, custom criteria
5. **Scheduling** - One-time or recurring (daily/weekly/monthly/cron)
6. **Delivery Options** - Archive location, notifications, export endpoint
7. **Sharing Configuration** - Personal, lab unit, or all users

**Toggle:** Users can switch between chat and wizard mode at any time

### 2.4 My Reports Section

**Location:** First item within the "Reports" menu

**Views:**
- List view (default)
- Search by name and description
- Sort options: name, last run, created date, next scheduled run
- Filter by: owned, shared with me, presets, scheduled, tags

**Organization:**
- Personal reports
- Shared with me (with option to hide individual items)
- Preset reports (system-provided)
- Archive (completed scheduled reports)

### 2.5 My Dashboard Section

**Location:** New dynamic menu item "My Dashboard"

**Capabilities:**
- Select which widgets/dashboard views to display
- Drag-and-drop widget arrangement
- Performance-managed widget limits
- Manual refresh button per widget
- Notification option when refresh completes

---

## 3. LLM Integration

### 3.1 Architecture

**Privacy Model:**
- LLM receives database schema and metadata only
- No patient data, sample data, or PHI transmitted to LLM
- All query execution occurs locally against the database

**Deployment Options (Admin Configurable):**
1. **Local** - LLM runs on the OpenELIS server (scaled-back model)
2. **Central** - LLM hosted on a more powerful server (e.g., Ministry of Health infrastructure)
3. **Cloud API** - Optional hooks to external LLM providers (OpenAI, Anthropic, etc.)

### 3.2 Schema Exposure

- Curated "safe" subset of tables/views exposed by default
- Friendly field name mappings (e.g., `pat_dob` → "Patient Date of Birth")
- Pre-built relationships and joins that the LLM understands
- Admin can restrict specific tables/fields from being queryable

### 3.3 Interaction Flow

1. User types natural language prompt
2. LLM generates SQL query based on schema knowledge
3. System runs EXPLAIN to estimate complexity/row count
4. User previews results (paginated if large)
5. User refines via follow-up prompts
6. User saves report/extract/widget
7. User reruns from My Reports menu
8. User can return to Catalyst to refine/modify

### 3.4 Guardrails

| Guardrail | Implementation |
|-----------|----------------|
| Query complexity limits | Warn if joins exceed threshold or no date/filter constraints on large tables |
| Row count estimation | Run EXPLAIN or COUNT preview before full execution |
| Prompt injection protection | Sanitize inputs, restrict to SELECT statements only |
| Timeout thresholds | Kill long-running queries with user notification |
| Required filters | Mandate date ranges or program filters for certain data types |
| Broad query confirmation | "This will query all patients since 2015. Add a date filter?" |
| Audit logging | Track all queries, who ran them, when, parameters used |

### 3.5 Error Handling

- Plain language explanation of what went wrong
- Suggestions for how to fix the issue
- "Ask the assistant for help" option with error context
- Manual query editing as escape hatch
- "Report this as a bad suggestion" feedback mechanism
- Retry logic for transient failures

### 3.6 Fallback Mode (Query Builder UI)

**Available when:** LLM is unavailable or disabled by admin

**Components:**
- Table/field selector with search functionality
- Filter builder (field + operator + value)
- Grouping and aggregation options
- Abstracted join configuration (user-friendly, not raw SQL)
- Sort order selection
- Templates for common patterns:
  - Tests by date range
  - Turnaround time summary
  - Rejection rate by reason
  - Sample volume by test type

---

## 4. Report & Extract Management

### 4.1 Supported Output Types

| Type | Description | Default Format |
|------|-------------|----------------|
| Data Extract | Raw data export for analysis or external systems | CSV |
| Report | Formatted document with headers, summaries | PDF |
| Widget | Dashboard visualization component | In-app display |
| Graph/Chart | Standalone visualization | PNG/SVG or in-app |

### 4.2 Export Formats

- **CSV** - Default for data extracts
- **Excel (.xlsx)** - Formatted spreadsheets with multiple sheets
- **PDF** - Formatted reports with customizable headers
- **JSON** - Structured data for system integration
- **HL7/FHIR Bundle** - Healthcare interoperability standard
- **Custom Delimited** - User-specified delimiter

**Format Selection:** User-selectable per report with intelligent defaults based on output type

### 4.3 PDF Customization

- Header/footer configuration using existing admin-defined logos and facility info
- Option for default header or custom combination of elements
- Page orientation selection (portrait/landscape)
- Charts and visualizations embedded in PDF
- Print optimization options:
  - High contrast mode
  - Black & white optimized
  - Ink/paper efficient layouts

### 4.4 Data Extract Configuration (for External Systems)

- Field mapping (rename columns, reorder fields)
- Data transformation (date formats, code mappings)
- Header row inclusion toggle
- Schema change alerts ("contract" monitoring for downstream systems)
- Incremental/delta export support (only records changed since last run)

### 4.5 Metadata Stored Per Report

- Name
- Description
- Created date
- Last run timestamp
- Schedule configuration
- Owner (user ID)
- Shared with (users, lab units)
- Tags/categories
- Version history
- Associated parameters

### 4.6 Version History

**Automatic Tracking:**
- What changed (query, configuration, visualization)
- Who made the change
- When the change occurred
- Retain 10 most recent versions automatically

**Manual Snapshots:**
- Users can create named snapshots as rollback points
- Snapshots retained indefinitely until deleted

**Rollback:**
- One-click rollback to any saved version
- Side-by-side comparison: *Future Enhancement*

---

## 5. Scheduling & Delivery

### 5.1 Frequency Options

- Daily
- Weekly (specify day)
- Monthly (specify date)
- Custom cron expression

### 5.2 Quiet Hours

- Scheduled reports pause during configured hours
- Default: 7:00 AM - 6:00 PM local time
- Admin configurable per implementation

### 5.3 Delivery Options

| Option | Description |
|--------|-------------|
| In-app notification | Alert when report completes (if enabled) |
| User Archive | Save to My Reports > Archive |
| Export endpoint | Admin-configured location for system integration |

### 5.4 Archive Management

- Reports saved to user's personal Archive
- **Global quota:** Admin-configurable, initial cap at 10 GB
- **Per-user quota:** Admin-configurable
- Archive accessible from My Reports section
- Archived reports can be viewed, copied, shared, or deleted

### 5.5 Resource Management

- Heavy operations can be interrupted with user confirmation
- Option to schedule heavy reports for off-peak execution
- Throttling to prevent system performance impact
- Staggered execution for multiple scheduled reports

---

## 6. Dashboard Widgets

### 6.1 Supported Widget Types

- Tables (paginated data grids)
- Bar charts
- Line charts (trends over time)
- Pie charts
- KPI cards (single metric display)

**Not in Scope:** Maps (future consideration)

### 6.2 Visualization Selection

- LLM suggests appropriate visualization based on data shape
- User can override or change visualization type
- Preview before saving

### 6.3 Layout & Performance

- Drag-and-drop widget arrangement
- Maximum widget count per dashboard (admin configurable)
- Staggered loading to prevent simultaneous heavy queries

### 6.4 Refresh Behavior

- **Default interval:** 24 hours
- **Configurable:** Per-widget refresh interval
- **Manual refresh:** Button per widget
- **Notification:** Optional alert when refresh completes

### 6.5 Interactivity (Future Enhancement if Resource-Efficient)

- Click chart segment to drill down
- Click KPI card to see underlying data
- Cross-filtering between widgets

### 6.6 Conditional Formatting & Alerts

- Configure thresholds per widget
- Visual indicators when thresholds breached:
  - Color changes (red/yellow/green)
  - Warning icons
- Integration with built-in OpenELIS alerts system
- Alert conditions:
  - Threshold breach (value above/below X)
  - Trend detection (X% change from previous period)
  - Missing data (expected results not returned)

---

## 7. Sharing & Permissions

### 7.1 Role-Based Access Control

Catalyst respects existing OpenELIS role-based permissions:
- Users can only query data they have permission to view
- Case managers restricted to their program's patients
- Lab managers may have broader access
- Queries for unauthorized data return permission error with admin contact suggestion

### 7.2 Report Sharing Levels

| Level | Who Can Share | Audience |
|-------|---------------|----------|
| Personal | Any user | Self only (default) |
| Lab Unit | Users with reports privileges for that unit | All users in that lab unit |
| All Users | Administrators only | Entire organization |

### 7.3 Shared Reports Behavior

- Shared reports appear in recipient's "Shared with Me" section
- Recipients can hide shared reports they don't need
- Shared reports show live data from current database (not snapshots)
- Recipients can duplicate and modify their own copy

### 7.4 Snapshot Sharing

- Specific data snapshots can be shared (point-in-time data)
- Snapshots include clear date/time stamp
- Use case: Share specific findings without ongoing access
- Snapshot sharing logged in audit trail

### 7.5 Preset Reports

- System-provided reports (~10 migrated from Jasper/PSQL)
- Users can view and run presets
- Users can duplicate and modify copies
- Only administrators can edit original presets
- Tagged with titles and descriptions
- Configurable per implementation (not all presets required)

---

## 8. Administration

### 8.1 Configuration Settings

| Setting | Description | Default |
|---------|-------------|---------|
| LLM Connection | Local, Central, or Cloud API | Local |
| LLM Model Selection | Choose from available models | Implementation-specific |
| Token Limits | Max tokens per query | Admin-defined |
| Rate Limiting | Queries per user per time period | Admin-defined |
| Global Archive Quota | Total storage for all archives | 10 GB |
| Per-User Archive Quota | Storage limit per user | Admin-defined |
| Quiet Hours Start | Begin pause for scheduled reports | 7:00 AM |
| Quiet Hours End | Resume scheduled reports | 6:00 PM |
| Export Endpoint | Default location for system extracts | Admin-defined |
| Max Widgets Per Dashboard | Performance limit | Admin-defined |

### 8.2 Admin Capabilities

- Disable LLM feature entirely (fallback to query builder only)
- Restrict specific tables/fields from being queryable
- View usage analytics:
  - Most frequently run reports
  - Heaviest queries
  - LLM usage statistics
- Manage all users' saved reports:
  - View any report
  - Delete reports
  - Reassign ownership
- Access "Unassigned" reports bucket (admin menu only)
- Deactivate reports for all users

### 8.3 User Departure Handling

When a user leaves the organization:
1. Admin prompted to reassign user's reports to another user
2. If not reassigned, reports move to "Unassigned" bucket
3. Unassigned reports remain functional and accessible to admins
4. Admins can later reassign to active users
5. Users with copies of deactivated shared reports are prompted to decide action

### 8.4 Preset Report Management

- Export report definitions for inclusion in initializer
- Import report definitions in new deployments
- Configure which presets are active per implementation
- Tag and categorize presets

---

## 9. Data Integrity & Error Handling

### 9.1 Schema Change Handling

When database schema changes affect saved reports:

1. User prompted that schema has changed
2. Option to run report as-is with:
   - Missing data flagged
   - Warning icon (⚠️ triangle) on visualizations
   - Warning text in report headers
3. Prompt to edit report and address schema changes
4. For shared reports: recipients can accept updated version in their context

### 9.2 Large Result Set Handling

1. System warns user about large result set
2. If user confirms, results are paginated
3. Export options available for full dataset

### 9.3 Query Failure Handling

- Plain language error explanation
- Suggestions for resolution
- Option to "Ask the assistant for help"
- Manual query editing available
- Retry option for transient failures

---

## 10. Saved Parameters

### 10.1 Date Range Presets

- Last 7 days
- Last 30 days
- This month
- Last month
- This quarter
- This year
- Custom range

### 10.2 Saved Filter Sets

Users can save and reuse filter combinations:
- "My HIV patients"
- "Samples from Lab Unit X"
- "Rejected samples this week"
- Custom named filters

### 10.3 Runtime Parameter Prompts

- Reports can be configured to prompt for parameter values at runtime
- Default values can be specified
- Required vs. optional parameters

---

## 11. Integrations

### 11.1 OpenELIS Feature Integration

| Feature | Integration |
|---------|-------------|
| Patient Records | Pull patient context when launched from patient screen |
| Sample Management | Pull sample context when launched from sample screen |
| Programs | Link reports to HIV, TB, or other programs for filtering |
| Workplan | Access current tests in workflow, turnaround times |
| Scheduled Tasks | Use existing infrastructure for report scheduling |
| Alerts | Trigger built-in alerts based on widget conditions |
| Audit Trail | Log all report executions, exports, and sharing |

### 11.2 External System Integration

- Auto-export to admin-configured endpoints
- Schema change "contracts" alert downstream systems
- Text file output for external alerting systems
- HL7/FHIR bundle export for interoperability

---

## 12. Internationalization

### 12.1 Multi-Language Support

- Accept prompts in multiple languages
- Return explanations in user's configured language
- LLM model must support target language
- Fallback: prompt user to select from available languages

### 12.2 Localization

- Date formats per locale
- Number formats per locale
- Report headers in user's language

---

## 13. Accessibility & Print Optimization

### 13.1 Visual Accessibility

- High contrast chart options
- Charts optimized for black & white printing
- Clear visual hierarchy in reports

### 13.2 Print Efficiency

- Layouts optimized to minimize paper usage
- Ink-efficient color schemes available
- Print preview before export

### 13.3 Future Accessibility Considerations

- Screen reader support
- Keyboard navigation
- WCAG compliance targets

---

## 14. Notifications

### 14.1 Notification Triggers

- Report generation complete
- Scheduled report ready
- Threshold alert triggered
- Shared report received
- Schema change affecting saved report

### 14.2 Notification Channels

| Channel | Description |
|---------|-------------|
| In-app | Notification center within OpenELIS |
| Email | Configurable email delivery |
| SMS | If infrastructure exists |
| Text file | Write to file for external system integration |

### 14.3 Alert Configuration

- Per-user alert preferences
- Lab unit-wide alerts (for users with appropriate permissions)
- Organization-wide alerts (administrators only)

---

## 15. Onboarding & Help

### 15.1 First-Time User Experience

- Interactive tutorial/walkthrough
- Sample prompts to try
- Links to video tutorials
- Links to documentation

### 15.2 Contextual Help

- Tooltips explaining fields and options
- "How do I..." suggestions based on current screen
- Links to relevant documentation
- In-context examples

### 15.3 Feedback Mechanisms

- Rate LLM suggestions as helpful or unhelpful
- Flag reports not producing expected results
- Feature requests:
  - Route to OpenELIS Global Developers
  - Route to local system administrators

---

## 16. Audit & Compliance

### 16.1 Audit Trail Integration

All actions logged to existing OpenELIS audit trail:

| Action | Data Captured |
|--------|---------------|
| Report execution | Who, when, parameters, row count |
| Export download | Who, when, format, destination |
| Snapshot sharing | Who shared, with whom, when |
| Report creation/modification | Who, when, what changed |
| Permission changes | Who granted/revoked, to whom |

### 16.2 Not Logged

- Template sharing (no health data associated)
- Prompt history (personal productivity feature)

---

## 17. Phased Implementation

### 17.1 MVP (Phase 1)

**Core Functionality:**
- LLM chat interface for natural language queries
- CSV data extract generation
- Basic query builder fallback
- Save and rerun reports
- My Reports section
- Basic scheduling (daily/weekly/monthly)
- Personal report storage

**Infrastructure:**
- Local LLM integration
- Schema exposure configuration
- Basic guardrails (query limits, timeout, audit)
- Archive with quota management

### 17.2 Phase 2

**Enhanced Output:**
- Additional export formats (Excel, PDF, JSON)
- PDF customization (headers, orientation)
- HL7/FHIR bundle export

**Sharing & Collaboration:**
- Report sharing (lab unit, all users)
- Snapshot sharing
- Shared with me section

**Dashboard Foundation:**
- My Dashboard section
- Basic widgets (tables, KPI cards)
- Manual refresh

### 17.3 Phase 3

**Advanced Visualization:**
- Charts (bar, line, pie)
- Drag-and-drop dashboard layout
- Conditional formatting
- Alert integration

**Enhanced Scheduling:**
- Custom cron expressions
- Quiet hours
- Export endpoints for external systems

### 17.4 Phase 4

**Advanced Features:**
- Wizard mode
- Delta/incremental exports
- Schema change handling
- Version comparison (side-by-side)

**Interactivity:**
- Widget drill-down
- Cross-filtering
- Interactive charts

### 17.5 Future Considerations

- Map visualizations
- Advanced ML-based trend detection
- Natural language report narration
- Mobile-optimized dashboard views

---

## 18. Technical Notes

### 18.1 Frontend Framework

- Carbon Design System for React
- Consistent with existing OpenELIS Global UI patterns
- New components for:
  - Chat interface
  - Query builder
  - Dashboard grid
  - Widget library

### 18.2 Existing Report Migration

~10 existing Jasper/PSQL reports to be recreated as presets:
- Reports converted to Catalyst query format
- Included in initializer for new deployments
- Original reports phased out over time

### 18.3 Performance Considerations

- Query execution limits and timeouts
- Widget count limits per dashboard
- Staggered refresh for multiple widgets
- Archive quota enforcement
- Quiet hours for scheduled reports

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| Catalyst | The OpenELIS Lab Data Assistant feature |
| Widget | A dashboard component displaying data visualization |
| Preset | A system-provided report template |
| Snapshot | A point-in-time capture of report data for sharing |
| Archive | Storage location for completed scheduled reports |
| Quiet Hours | Time period when scheduled reports are paused |
| Delta Export | Export containing only records changed since last run |

---

## Appendix B: User Stories

### Lab Manager Stories
- As a lab manager, I want to ask "show me turnaround times by test type for last month" and get a report without writing SQL
- As a lab manager, I want to schedule a weekly workload summary that automatically runs every Monday morning
- As a lab manager, I want to share a dashboard with my team showing key performance indicators

### Case Manager Stories
- As a case manager, I want to generate a list of HIV patients due for follow-up this week
- As a case manager, I want to save my frequently-used patient filters so I can rerun them quickly
- As a case manager, I want to receive an alert when turnaround times exceed program thresholds

### QA Officer Stories
- As a QA officer, I want to track rejection rates by reason over time
- As a QA officer, I want to create a quality dashboard that updates daily
- As a QA officer, I want to export QC data in a format our external QA program requires

### Administrator Stories
- As an administrator, I want to control which database tables users can query
- As an administrator, I want to set storage quotas to manage system resources
- As an administrator, I want to reassign reports when staff members leave

---

## Appendix C: Related Documentation

- OpenELIS Global Technical Architecture
- Carbon Design System Guidelines
- Existing Report Inventory (for migration planning)
- Database Schema Documentation
- Role-Based Permission Matrix

---

*Document End*
