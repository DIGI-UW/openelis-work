# System Audit Trail

## Overview

Extend the existing order-level audit trail to include system-level operations such as test catalog changes, freezer operations, user management, and configuration changes. The unified audit trail provides a complete record of all significant actions for CLIA and ISO 15189 compliance.

**Target Release:** OpenELIS Global v3.2 (Q1 2026)

---

## Problem Statement

Current audit capabilities are limited to order-level operations. System-level changes that affect laboratory operations are not tracked, creating compliance gaps and making it difficult to:
- Track who changed test configurations
- Audit user permission changes
- Review freezer/storage operations
- Investigate configuration issues
- Meet CLIA and ISO 15189 audit requirements

---

## Solution

A unified Audit Trail system that:
- Tracks both order-level and system-level events
- Captures before/after values for all changes
- Provides comprehensive filtering and search
- Supports export for external auditors
- Retains records for 10+ years
- Meets CLIA and ISO 15189 requirements

---

## Tracked Operations

### Order-Level Events (Existing)
- Sample registration
- Sample collection
- Test ordering
- Result entry
- Result validation
- Result release
- Sample rejection
- Order modification
- Order cancellation

### System-Level Events (New)

#### Test Catalog Management
- Test created/modified/deactivated
- Panel created/modified/deactivated
- Method created/modified/deactivated
- Lab unit created/modified/deactivated
- Result option created/modified/deactivated
- Reference range changes
- Test-method associations changed
- Test-sample type associations changed

#### User Management
- User created/modified/deactivated
- User role assigned/removed
- User permissions changed
- User password reset
- User login/logout

#### Data Dictionary
- Category created/modified/deactivated
- Dictionary entry created/modified/deactivated
- Dictionary import completed
- Dictionary export performed

#### Instrument Management
- Instrument created/modified/deactivated
- Instrument-test mapping changed
- Analyzer connection configured

#### Quality Control
- QC lot created/modified
- QC range defined/modified
- QC rule configured

#### Storage/Freezer Operations
- Storage location created/modified
- Sample stored in location
- Sample retrieved from location
- Sample moved between locations
- Storage unit temperature logged
- Storage unit alarm acknowledged

#### System Configuration
- Site information changed
- Barcode configuration changed
- Result reporting configuration changed
- Print configuration changed
- Menu configuration changed
- Workplan configuration changed

#### Reporting
- Report template created/modified
- Report generated
- Batch report generated

#### Data Operations
- Data exported
- Data imported
- Batch operation performed
- Search index rebuilt

---

## Data Model

```sql
-- Audit Event (unified table for all audit events)
CREATE TABLE audit_event (
    id BIGSERIAL PRIMARY KEY,
    
    -- When and who
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES system_user(id),
    user_name VARCHAR(100) NOT NULL,  -- Denormalized for retention
    
    -- Event classification
    event_category VARCHAR(20) NOT NULL,  -- ORDER_LEVEL, SYSTEM_LEVEL
    action_type VARCHAR(50) NOT NULL,     -- CREATE, UPDATE, DELETE, VIEW, LOGIN, etc.
    
    -- What was affected
    entity_type VARCHAR(50) NOT NULL,     -- TEST, PANEL, USER, SAMPLE, etc.
    entity_id VARCHAR(100),               -- ID of affected entity
    entity_name VARCHAR(500),             -- Display name (denormalized)
    
    -- Related order (if applicable)
    order_id INTEGER,
    accession_number VARCHAR(50),
    
    -- Change details
    changes JSONB,                        -- Before/after values
    description TEXT,                     -- Human-readable summary
    
    -- Indexing
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_audit_timestamp ON audit_event(event_timestamp DESC);
CREATE INDEX idx_audit_user ON audit_event(user_id);
CREATE INDEX idx_audit_category ON audit_event(event_category);
CREATE INDEX idx_audit_action ON audit_event(action_type);
CREATE INDEX idx_audit_entity_type ON audit_event(entity_type);
CREATE INDEX idx_audit_entity_id ON audit_event(entity_id);
CREATE INDEX idx_audit_order ON audit_event(order_id);
CREATE INDEX idx_audit_accession ON audit_event(accession_number);

-- Partitioning by year for long-term retention (PostgreSQL 12+)
-- Consider partitioning audit_event by event_timestamp for 10-year retention

-- Action Type Reference
CREATE TABLE audit_action_type (
    code VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL  -- ORDER_LEVEL, SYSTEM_LEVEL, BOTH
);

-- Entity Type Reference
CREATE TABLE audit_entity_type (
    code VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL  -- ORDER_LEVEL, SYSTEM_LEVEL, BOTH
);
```

### Changes JSON Structure

```json
{
  "before": {
    "name": "HIV 1/2 Antibody",
    "isActive": true,
    "labUnitId": 5
  },
  "after": {
    "name": "HIV 1/2 Antibody Screen",
    "isActive": true,
    "labUnitId": 5
  },
  "changedFields": ["name"]
}
```

---

## Page Layout

### System Events Page (`/audit-trail/system`)

Full-width table view for browsing and filtering system-level audit events.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header: System Events Audit Trail                        [Export â–¼]    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Filters:                                                                â”‚
â”‚ Date Range: [From] [To]  User: [Dropdown]  Action: [Dropdown]          â”‚
â”‚ Entity Type: [Dropdown]  Search: [________________]  [Apply] [Clear]    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Results: 1,247 events                                                   â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Timestamp          â”‚ User      â”‚ Action   â”‚ Entity      â”‚ Details  â”‚ â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚ â”‚ 2025-12-14 14:32   â”‚ J. Smith  â”‚ Updated  â”‚ Test: HIV   â”‚ [View]   â”‚ â”‚
â”‚ â”‚ 2025-12-14 14:28   â”‚ M. Jones  â”‚ Created  â”‚ User: A...  â”‚ [View]   â”‚ â”‚
â”‚ â”‚ 2025-12-14 14:15   â”‚ System    â”‚ Import   â”‚ Dictionary  â”‚ [View]   â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚ Pagination: [First] [Prev] Page 1 of 125 [Next] [Last]  Rows: [25 â–¼]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Order Events Page (`/audit-trail/order`)

Search-first interface for viewing all events related to a specific order.

#### Before Search
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header: Order Events Audit Trail                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                         â”‚
â”‚   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚   â”‚  Search by Lab Number                                           â”‚  â”‚
â”‚   â”‚  [LAB-2025-001234________________] [Search]                     â”‚  â”‚
â”‚   â”‚                                                                 â”‚  â”‚
â”‚   â”‚  Enter a Lab Number to view all audit events for that order.   â”‚  â”‚
â”‚   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚                                                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

#### After Search (Order Found)
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Header: Order Events Audit Trail                                        â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Order: LAB-2025-001234                                    [Clear] [Export]â”‚
â”‚ Patient: John Doe (PT-12345) | Ordered: Dec 14, 2025 | Tests: 5         â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ 12 events for this order                                                â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Timestamp       â”‚ User      â”‚ Action   â”‚ Entity     â”‚ Details      â”‚ â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤ â”‚
â”‚ â”‚ Dec 14, 2:32 PM â”‚ J. Smith  â”‚ Released â”‚ Result: Hgbâ”‚ [View]       â”‚ â”‚
â”‚ â”‚ Dec 14, 1:45 PM â”‚ M. Jones  â”‚ Validatedâ”‚ Result: Hgbâ”‚ [View]       â”‚ â”‚
â”‚ â”‚ Dec 14, 12:30   â”‚ R. Wilson â”‚ Entered  â”‚ Result: Hgbâ”‚ [View]       â”‚ â”‚
â”‚ â”‚ Dec 14, 10:00   â”‚ S. Davis  â”‚ Collectedâ”‚ Sample     â”‚ [View]       â”‚ â”‚
â”‚ â”‚ Dec 14, 9:30 AM â”‚ S. Davis  â”‚ Created  â”‚ Order      â”‚ [View]       â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

---

## System Events Page

### Filters

Full filter bar for browsing system-level audit events:

- **Date Range**: From/To date pickers with quick presets (Today, Last 7 days, Last 30 days, Last 90 days, This year)
- **User Filter**: Searchable dropdown of all users with audit events
- **Action Type Filter**: Create, Update, Delete, View, Login/Logout, Import, Export
- **Entity Type Filter**: Grouped dropdown (Test Catalog, Users & Security, Configuration)
- **Search**: Free text search on entity name and description
- **Clear**: Reset all filters

### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Expand | 40px | No | Arrow to expand details |
| Timestamp | 150px | Yes | Date and time of event |
| User | 120px | Yes | User who performed action |
| Action | 100px | Yes | Action type badge |
| Entity Type | 120px | Yes | Type of entity affected |
| Entity | flex | No | Entity name/identifier |
| Details | 80px | No | View button to expand |

### Pagination
- Page size: 25, 50, 100
- Navigation: First, Previous, Page X of Y, Next, Last

---

## Order Events Page

### Search Interface

Prominent search box requiring Lab Number entry:
- Input field with placeholder: "Enter Lab Number (e.g., LAB-2025-001234)"
- Search button
- Helper text explaining the purpose
- Error message if order not found

### Order Header (After Search)

Displays order summary:
- Lab Number with status badge (Completed, In Progress, etc.)
- Patient name and ID
- Order date
- Test count
- "Clear" button to search another order
- "Export" button for this order's events

### Events List

Shows ALL events for the searched order (no pagination):
- Chronological order (newest first)
- Same columns as System Events (without sorting)
- Expandable row details

### Date Range
- From date picker
- To date picker
- Quick presets: Today, Last 7 days, Last 30 days, Last 90 days, This year

### User Filter
- Searchable dropdown
- Shows all users who have audit events
- Multi-select option

### Action Type Filter
- Dropdown with categories:
  - All Actions
  - Create
  - Update
  - Delete
  - View
  - Login/Logout
  - Import
  - Export
  - Other

### Entity Type Filter
- Grouped dropdown:
  - **Order Level**
    - Sample
    - Order
    - Result
  - **Test Catalog**
    - Test
    - Panel
    - Method
    - Lab Unit
    - Result Option
  - **Users & Security**
    - User
    - Role
    - Permission
  - **Configuration**
    - Dictionary
    - Instrument
    - QC
    - Storage/Freezer
    - System Settings

### Search
- Free text search
- Searches: entity name, description, accession number
- Debounced input

---

## Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Timestamp | 150px | Yes | Date and time of event |
| User | 120px | Yes | User who performed action |
| Action | 100px | Yes | Action type badge |
| Entity Type | 120px | Yes | Type of entity affected |
| Entity | flex | No | Entity name/identifier |
| Accession # | 120px | Yes | Order accession (order events only) |
| Details | 80px | No | View button to expand |

### Action Type Badges
- **Create** - Green badge
- **Update** - Blue badge
- **Delete** - Red badge
- **View** - Gray badge
- **Login** - Teal badge
- **Export** - Purple badge
- **Import** - Orange badge

---

## Event Details Panel

When user clicks "View" or expands a row:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Event Details                                                      [Ã—]  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                                         â”‚
â”‚ Timestamp:    December 14, 2025 at 2:32:15 PM                          â”‚
â”‚ User:         John Smith (jsmith)                                       â”‚
â”‚ Action:       Updated                                                   â”‚
â”‚ Entity:       Test - HIV 1/2 Antibody Screen (HIV-AB)                  â”‚
â”‚                                                                         â”‚
â”‚ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ â”‚
â”‚                                                                         â”‚
â”‚ Changes:                                                                â”‚
â”‚                                                                         â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”‚
â”‚ â”‚ Field           â”‚ Before              â”‚ After               â”‚        â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”‚
â”‚ â”‚ Name            â”‚ HIV 1/2 Antibody    â”‚ HIV 1/2 Antibody    â”‚        â”‚
â”‚ â”‚                 â”‚                     â”‚ Screen              â”‚        â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”‚
â”‚ â”‚ Report Name     â”‚ HIV Ab              â”‚ HIV 1/2 Ab Screen   â”‚        â”‚
â”‚ â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”‚
â”‚ â”‚ LOINC Code      â”‚ â€”                   â”‚ 75666-5             â”‚        â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â”‚
â”‚                                                                         â”‚
â”‚ Description:                                                            â”‚
â”‚ Test configuration updated: name, report name, and LOINC code changed  â”‚
â”‚                                                                         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Export

### Export Button
Dropdown with options:
- Export Current View (filtered results)
- Export Date Range
- Export All (admin only, with confirmation)

### Export Formats
- **CSV** - For spreadsheet analysis
- **PDF** - For auditor reports (formatted, paginated)

### Export Fields
- Timestamp
- User Name
- User ID
- Action Type
- Entity Type
- Entity ID
- Entity Name
- Description
- Changes (JSON for CSV, formatted for PDF)
- Accession Number (if applicable)

### Export Limits
- CSV: Up to 100,000 records
- PDF: Up to 10,000 records
- Larger exports require scheduled job

---

## Implementation Guidelines

### Audit Capture Points

#### Service Layer Interceptor
```java
@Aspect
@Component
public class AuditAspect {
    
    @Around("@annotation(Audited)")
    public Object auditOperation(ProceedingJoinPoint joinPoint) {
        // Capture before state
        Object beforeState = captureState(joinPoint);
        
        // Execute operation
        Object result = joinPoint.proceed();
        
        // Capture after state and log
        Object afterState = captureState(joinPoint);
        auditService.logEvent(buildAuditEvent(beforeState, afterState));
        
        return result;
    }
}
```

#### Annotation-Based Auditing
```java
@Audited(action = ActionType.UPDATE, entityType = EntityType.TEST)
public Test updateTest(Test test) {
    // Implementation
}
```

### Retention Strategy

#### Partitioning
- Partition audit_event table by year
- Keep recent partitions (2 years) on fast storage
- Move older partitions to archive storage
- Maintain queryability across all partitions

#### Archival
```sql
-- Create yearly partitions
CREATE TABLE audit_event_2025 PARTITION OF audit_event
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE audit_event_2024 PARTITION OF audit_event
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

## API Endpoints

### Query System Events

```
GET /api/audit/events
    Query Parameters:
    - fromDate: ISO datetime
    - toDate: ISO datetime
    - userId: integer (filter by user)
    - actionType: string (CREATE, UPDATE, etc.)
    - entityType: string (TEST, USER, etc.)
    - entityId: string
    - search: string (free text)
    - page: integer
    - size: integer (max 100)
    - sort: field,direction
    
    Response:
    {
      "content": [...system events],
      "totalElements": 1247,
      "totalPages": 50,
      "page": 0,
      "size": 25
    }
```

### Get Order Events by Lab Number

```
GET /api/audit/orders/{labNumber}/events
    
    Response (success):
    {
      "order": {
        "labNumber": "LAB-2025-001234",
        "patientName": "John Doe",
        "patientId": "PT-12345",
        "orderDate": "2025-12-14",
        "tests": ["CBC", "BMP", "Lipid Panel"],
        "status": "Completed"
      },
      "events": [...all events for this order],
      "eventCount": 12
    }
    
    Response (not found): 404 with error message
```

### Get Event Details

```
GET /api/audit/events/{id}
    Response:
    {
      "id": 12345,
      "eventTimestamp": "2025-12-14T14:32:15Z",
      "userId": 42,
      "userName": "John Smith",
      "eventCategory": "SYSTEM_LEVEL",
      "actionType": "UPDATE",
      "entityType": "TEST",
      "entityId": "101",
      "entityName": "HIV 1/2 Antibody Screen",
      "changes": {
        "before": {...},
        "after": {...},
        "changedFields": ["name", "reportName", "loincCode"]
      },
      "description": "Test configuration updated"
    }
```

### Export System Events

```
POST /api/audit/export
    Body:
    {
      "format": "CSV" | "PDF",
      "filters": {
        "fromDate": "2025-01-01",
        "toDate": "2025-12-31",
        "entityTypes": ["TEST", "PANEL"]
      }
    }
    
    Response: File download or job ID for large exports
```

### Export Order Events

```
POST /api/audit/orders/{labNumber}/export
    Body:
    {
      "format": "CSV" | "PDF"
    }
    
    Response: File download
```

### Get Filter Options

```
GET /api/audit/filter-options
    Response:
    {
      "actionTypes": [
        { "code": "CREATE", "displayName": "Create" },
        { "code": "UPDATE", "displayName": "Update" },
        ...
      ],
      "entityTypes": [
        { "code": "TEST", "displayName": "Test", "category": "SYSTEM_LEVEL" },
        { "code": "SAMPLE", "displayName": "Sample", "category": "ORDER_LEVEL" },
        ...
      ],
      "users": [
        { "id": 1, "name": "John Smith", "username": "jsmith" },
        ...
      ]
    }
```

---

## Compliance Requirements

### CLIA Requirements
- All test result changes must be traceable
- User identification required for all entries
- Original values must be preserved (before/after)
- Records retained for at least 2 years (we exceed with 10)

### ISO 15189 Requirements
- Document control audit trail
- Personnel competency records
- Equipment maintenance logs
- Non-conformity tracking
- Traceability of all measurements

### Implementation Notes
- Audit records are immutable (no UPDATE or DELETE)
- System timestamp used (not user-provided)
- User context captured at time of action
- All changes captured, including batch operations

---

## Acceptance Criteria

### Event Capture
- [ ] All test catalog changes are logged
- [ ] All user management changes are logged
- [ ] All dictionary changes are logged
- [ ] All freezer/storage operations are logged
- [ ] All configuration changes are logged
- [ ] All login/logout events are logged
- [ ] Before/after values captured for updates
- [ ] User and timestamp automatically recorded

### User Interface
- [ ] Unified view with tabs for All/Order/System events
- [ ] Date range filter with presets
- [ ] User filter (searchable dropdown)
- [ ] Action type filter
- [ ] Entity type filter (grouped)
- [ ] Free text search
- [ ] Sortable columns
- [ ] Pagination
- [ ] Expandable row details with before/after diff

### Export
- [ ] Export current filtered view
- [ ] Export date range
- [ ] CSV format with all fields
- [ ] PDF format with formatting
- [ ] Large export handling

### Performance
- [ ] Page loads in under 2 seconds
- [ ] Filter changes respond in under 1 second
- [ ] Supports 10+ years of data
- [ ] Partitioned storage for retention

### Security
- [ ] Only Audit Trail role can access
- [ ] Audit records cannot be modified or deleted
- [ ] Export actions are themselves audited

---

## Navigation

**Menu Path:**
Reporting â†’ Audit Trail â†’ System Events
Reporting â†’ Audit Trail â†’ Order Events

### Menu Structure
```
Reporting
â”œâ”€ ... (other reports)
â””â”€ Audit Trail
   â”œâ”€ System Events    â† Browse/filter all system-level events
   â””â”€ Order Events     â† Search by Lab Number
```

Each is a separate page with its own URL:
- `/audit-trail/system` - System Events page
- `/audit-trail/order` - Order Events page

---

## Permissions

| Action | Required Permission |
|--------|-------------------|
| View audit trail | `AUDIT_TRAIL_VIEW` |
| Export audit data | `AUDIT_TRAIL_EXPORT` |
| View all user events | `AUDIT_TRAIL_VIEW` |
| View own events only | `AUDIT_TRAIL_VIEW_OWN` |

---

## Migration

### Existing Audit Data
- Migrate existing order-level audit events to new table
- Set event_category = 'ORDER_LEVEL' for migrated records
- Preserve original timestamps and user references
- Generate descriptions for historical records

### Historical Data
- System-level auditing starts from implementation date
- No retroactive system-level audit generation
