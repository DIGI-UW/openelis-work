# Companion Analyzer Setup Guide Template

The companion guide is a **lab-staff-facing document** written in plain language. It walks through configuring a specific analyzer end to end. It is distinct from the integration spec (which is developer-facing).

> **UI source of truth:** the *OpenELIS-side* steps describe the analyzer setup screens designed in the **`openelis-design`** skill (Analyzer Types & Mapping FRS) and the live app — **do not invent or freeze a UI here.** This skill owns the **instrument-side** configuration and the protocol details; for the OpenELIS-side flow, describe what the FRS/app actually do and keep it light enough that it doesn't rot when the UI ships. The current design flow is **inline, verify-first** (Instrument → Verify → Connect), with SideNav submenus and Carbon styling — not modals, not in-page tabs, not an `Admin → Analyzer Management` path.

---

## Document Header

```
# [Manufacturer] [Model] — Analyzer Setup Guide
**OpenELIS Global | Analyzer Setup | [Site/Deployment]**
Version: v1.0
Date: [YYYY-MM-DD]
Confidence: HIGH / MEDIUM-HIGH
Audience: Lab IT, Lab Manager, OpenELIS Administrator
```

Confidence rating for companion guides is often **MEDIUM-HIGH** because UI menu paths are documented from protocol manuals, not live instrument verification. Note this in the doc header.

---

## Standard Sections

### 1. Prerequisites
- OpenELIS version required
- Network connectivity to analyzer (IP address, port)
- Any instrument-side settings that must be configured first (e.g., LIS export enabled in instrument menu)
- Required user roles in OpenELIS

### 2. Instrument-Side Configuration
Step-by-step for enabling LIS output on the analyzer itself. Include:
- Menu path (as specific as possible from vendor docs)
- Settings to configure: LIS mode enable, IP address of LIS host, port number, protocol selection
- Any test code or result code configuration

**Example (Mindray BC-5380):**
```
On the analyzer touch screen:
1. Menu → Setup → LIS Setup
2. Set LIS Mode: Enabled
3. Host IP: [OpenELIS server IP]
4. Port: 9100
5. Protocol: HL7
6. Save and restart communication service
```

### 3. OpenELIS Configuration — follows the Analyzer Types & Mapping FRS

> Describe the OpenELIS-side setup **as the design defines it** (see `openelis-design` → Analyzer Types & Mapping FRS + live app). Don't restate a frozen screen-by-screen UI here; capture the instrument-specific values the administrator will enter, and let the flow track the FRS.

The current design flow is **inline in the Analyzers list** (not a modal) and proceeds **Instrument → Verify → Connect**:

- **Instrument** — the administrator searches for and picks this instrument; OpenELIS loads its profile. Provide the **manufacturer/model** to search for, the **profile name** if a shipped profile exists, and the **lab unit(s)** to assign. (If no profile exists yet, this is the "not listed → new profile" path — note the protocol and connection type.)
- **Verify** — the administrator confirms the profile's test-code and QC-code mappings (verify-first; mappings are not applied silently). Provide the **expected test codes** and **QC identifiers** so they know what a correct verify looks like, and call out any code that won't match the lab's catalog (it routes to Resolve → map-to-existing/add-in-Test-Catalog).
- **Connect** — provide the **TCP port** and **connection role** (usually SERVER / OpenELIS listens) and the **data flow** (one-way results, or two-way if the instrument supports it). A connection test reports the result in plain language.

Per-analyzer detail and field mappings live at `/analyzers/{id}/...` (e.g. `/analyzers/{id}/mappings`) — confirm the exact routes against the FRS/live app at authoring time.

### 4. Verifying a Live Result

Once the analyzer sends its first real sample, the administrator uses the design's **"send a result from the analyzer now"** reconciliation (per the FRS): the transmitted message is reconciled against the mappings live — matched items flip to *verified against the live message*, a new value or code surfaces inline to map, and an unmapped item is **never dropped** (it parks and raises an Alert). Provide, for this instrument: what a correct first message looks like (instrument id, a sample specimen id, expected codes) and which values are QC vs patient.

### 5. Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| No connection | Wrong port or analyzer not in LIS mode | Check instrument LIS settings; verify port |
| Test codes unmapped | Code not in the profile | Map it in the analyzer's Field Mappings (search the catalog), or add the test in Test Catalog first |
| All samples classified as QC | QC rule too broad | Review the prefix/regex pattern |
| Numeric parsing error | Decimal separator mismatch (French locale) | Enable locale-aware parsing |
| Missing results | Aggregation window too short | Increase the BY_SPECIMEN window in the profile |
| Analyzer flagged / Alert raised | Instrument sent an unmapped code or value | Resolve from the Alert — mapping it updates the profile so it maps automatically next time |

---

## Mockups (if needed) — use the `openelis-design` patterns

If a visual helps, build it with the **`openelis-design` React/Carbon + HTML-preview pattern** (CDN Carbon, Carbon design tokens, SideNav submenus, inline expansion) — **not** a hardcoded-color/tabs/modal template. There is no separate canonical mockup file for this skill; the design skill's Analyzer Types & Mapping prototype is the reference. Anything that reintroduces a dark-navy sidebar, in-page tabs, an Add-Analyzer modal, or an `Admin → Analyzer Management` path contradicts current design decisions (carbon-anti-patterns A1, D-003, D-005, D-027) and should not ship.

---

## Confidence Rating Guide

| Rating | Meaning |
|---|---|
| HIGH | Spec built directly from vendor LIS interface documentation; field positions verified |
| MEDIUM-HIGH | Companion guide UI steps derived from vendor docs but menu paths not verified on live instrument |
| VALIDATED | Confirmed working in production with actual instrument at deployment site |
| N/A | Spec not yet started |
