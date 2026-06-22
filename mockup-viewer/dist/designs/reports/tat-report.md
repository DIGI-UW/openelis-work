# TAT Report — Functional Requirements Specification

**Version:** 1.0  
**Date:** 2026-04-05  
**Status:** Implemented (PR #3290)  
**Jira:** [OGC-307](https://uwdigi.atlassian.net/browse/OGC-307), [OGC-310](https://uwdigi.atlassian.net/browse/OGC-310)  
**Implementation:** `frontend/src/components/reports/tat/` in OpenELIS-Global-2

## Overview

Turn Around Time (TAT) Report providing aggregate statistics, detail list, and trend analysis across 7 configurable workflow segments with Calendar Time and Working Time calculation modes.

## Key Features

- **7 TAT segments:** Order → Collection → Receipt → Testing → Result Entry → Validation (+ Overall)
- **Calculation modes:** Calendar Time (all hours) vs Working Time (excludes weekends + holidays)
- **10 filter controls:** Date range with 7 presets, Lab Unit, Test/Panel, Priority, Sample Type, Ordering Site, Segment, Calculation Mode, Include Cancelled/Rejected
- **Summary tab:** 7 stat cards (Total, Mean, Median, 90th%, Min, Max, Std Dev), histogram with distribution bins, breakdown table with drill-down
- **Detail List tab:** Sortable, paginated table with all milestone timestamps, STAT priority highlighting, column visibility toggle
- **Trends tab:** Daily/Weekly/Monthly aggregation with median + 90th percentile, volume overlay, multi-series comparison
- **Export:** CSV (up to 100K rows, decimal hours format)
- **Working Time info bar:** Shows excluded days count + link to Calendar Management

## Full Specification

See [spec.md](https://github.com/DIGI-UW/OpenELIS-Global-2/blob/develop/specs/310-turnaround-time/spec.md) in the main repository for the complete 25-requirement functional specification.

## Related Designs

- [Calendar Management](../other/calendar-management.jsx) — Admin page for holiday/weekend configuration (OGC-306)
- [TAT Dashboard](../other/tat-dashboard.jsx) — V2 real-time analytics dashboard (future)
