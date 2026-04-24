# Patient Report — Redesign Spec

> **Source file:** `src/main/resources/reports/patient.jrxml` (DIGI-UW/OpenELIS-Global-2, `develop`)
> **Deliverable type:** Visual redesign + coordinate-level implementation notes
> **Target implementation time:** ≤ 30 minutes for a Jasper-fluent dev (core hierarchy only — see §2)
> **Authored:** 2026-04-23 · **Owner:** Casey Iiams-Hauser
> **Companion:** [`patient-report-redesign-preview.html`](./patient-report-redesign-preview.html) — open in a browser to see the rendered design at real US Letter **and** A4 dimensions (toggle in the banner).

---

## 1. Goal

Refresh the visual design of the patient report without changing its data model, i18n keys, or structural behavior. Every field currently rendered stays in the output; every parameter currently wired stays wired. What changes is the **layout, typography, and visual hierarchy** so the report reads as the same product as the web app (Style Guide v1 tokens) rather than as a 2012-era Jasper template.

Two related deliverables ship alongside the redesign:

1. **Paper-size selection** — labs on US Letter paper and labs on A4 paper should both get a clean layout. We ship **two JRXML templates** (`patient_letter.jrxml` and `patient_a4.jrxml`) and a global admin setting that picks one.
2. **Printed Reports Configuration wiring** — the paper-size setting lives in the existing `Admin → General Configuration → Printed Reports Configuration` page (see §15).

**Driver:** Cleaner, more modern layout + deployments outside the US need A4 (per clarification 2026-04-23). Not i18n migration, not accreditation expansion, not branding customization — those can layer onto this redesign later.

## 2. What "30-minute job" means (core hierarchy scope)

The dev is not starting from a blank Jasper file. They open the existing `patient.jrxml` in Jaspersoft Studio (or iReport), rename it to `patient_letter.jrxml`, and do the following, in order.

**Committed scope for this ticket:**

1. **Insert a `<style>` block** at the top of the JRXML with the tokens from §6 (includes B&W-safe redundancy styles per §17). (2 min)
2. **Move and resize** the elements inside the `Accession Number` group header frame — from the current 11-cell grid to the two-column card in the new layout (§7.2). (~12 min, the biggest edit)
3. **Replace** the hard-coded `"  Nom, Prenom(s)"` static text with `$P{localization}.get("patientName")`. Add the i18n key to `MessageResources_*.properties`. (2 min)
4. **Adjust detail-row elements** — add the row-highlight conditional style, the abnormal arrow glyph (↑/↓) and method sub-line per §7.5, change font sizes per §6, nudge column widths. (~6 min)
5. **Rebuild the legend** in the column footer — replace the two concatenated text lines with five separate `<textField>` cells using the new legend labels (§7.6). (~3 min)
6. **Add the accreditation logo slot** to the existing person-group footer (§7.7a) and clean up stranded backcolor values (`#FF9999`, `#66FF66`, `#33FFFF` → `#FFFFFF`). (~2 min)
7. **Duplicate to A4** — copy `patient_letter.jrxml` → `patient_a4.jrxml`, change `pageWidth="612"` to `595`, `pageHeight="792"` to `842`, and scale the six horizontal widths called out in §16. (~3 min)
8. **Smoke test** both templates with the standard patient report fixture — verify the arrow glyph prints in B&W, the method sub-line appears when populated, and the accreditation logo renders (or stays blank via `onErrorType="Blank"` when the image parameter is null). (~3 min)

Total: ~33 min. An experienced Jasper dev will go faster.

**Backend sub-task (separate dev, not counted in the 33 min):** expose `methodName` on `PatientReportBean` — see §14 "Related backend work".

**Deferred to follow-on tickets** (documented here so the next dev can pick them up without re-specifying):

- §7.3 continuation-page strip (p2+ condensed header)
- §7.7 sign-off block restyle
- §7.1 status chip / corrected banner restyle
- §7.6 conclusion block (optional summary)
- §7.8 page footer redesign

These sections remain in the spec for reference but are not blocking the first merge.

## 3. Scope

**In scope.** Visual redesign of the patient-report template — the layout referenced by the single-patient, date-range, and accession-range generators. All three use the same `patient.jrxml`, confirmed per user: *"the patient report template is a single design, the others are just … which one to build."*

**Out of scope.**
- `PatientReportCDI*.jrxml`, `PatientPathologyReport.jrxml`, `Patient_ARV_*.jrxml`, `Patient_VL_*.jrxml`, and the 27 other patient-adjacent JRXMLs. Those are country-program variants and need their own design pass.
- The generic `GeneralHeader.jasper` and `CILNSPFooter.jasper` subreports — header/footer subreports stay as is; we slot into them via the existing `$P{headerName}`/`$P{footerName}` parameters.
- i18n message-key restructuring. We fix only one hard-coded string bug (`Nom, Prenom(s)`) and otherwise preserve the existing `localization.get(...)` keys.
- Backend data contract — no new fields added to `PatientReportBean` / whatever feeds the datasource.

## 4. User stories

- **As a clinician** reading a printed result, I want abnormal values to be visible from arm's length so I can triage at the top of the chart without squinting at a tiny H/L column.
- **As a clinician on a continuation page**, I want the patient and accession identifiers at the top of the page without a full demographics repeat so the page wastes no whitespace on data I already saw on page 1.
- **As a laboratory director signing off**, I want the "Verified by" block to be visually distinct from the result grid so my signature and name anchor the document legally.
- **As a MoH auditor** reviewing reports months later, I want the report header to clearly show issue date, accession, and patient code in machine-readable tabular-numeric form so data entry into audit systems is unambiguous.
- **As an OpenELIS deployer** applying a French or Khmer translation, I want no English (or French) text baked into the layout so my translation file fully controls every visible string.

## 5. Functional requirements

| ID | Requirement | Source |
|---|---|---|
| PR-01 | Every data field and parameter present in `patient.jrxml` v64fb1a8 continues to render in the redesigned report. See §9 field map. | Existing |
| PR-02 | Every visible text string is driven by `$P{localization}` or `$R{...}`. No hard-coded English or French. | Style Guide v1 §10; constitution MUST |
| PR-03 | First page of each accession includes the full patient + order demographics card. | Existing behavior preserved |
| PR-04 | Pages 2+ of the same accession show a condensed patient strip (patientName, age, gender, subjectNumber, accessionNumber, collectionDateTime), not the full demographics. | Existing behavior preserved |
| PR-05 | Rows where `abnormalResult == true` render with a colored left-edge rule and a soft row tint. High/low distinction via the existing `alerts` field value (`H` = red, `L` = blue, `*` = abnormal red). | New |
| PR-06 | Panel rows where `parentMarker == true` render with a shaded background and the child rows that follow are indented 14pt. | Existing, visual refresh |
| PR-07 | Rows where `note != null` render a secondary note row directly beneath the result row, visually linked to it. | Existing, visual refresh |
| PR-08 | Report status (`completeFlag`, `correctedResult`) is shown as a small Tag-style chip in the top-right of the page header. The boldface `Corrected Report` banner is retained only when `correctedResult == true`. | New |
| PR-09 | Legend in the column footer lists `H`, `L`, `*`, `R`, `C` on a single line with labels sourced from `$R{report.*}`. | Existing, visual refresh |
| PR-10 | Sign-off (person-group footer) has a 90pt-tall two-cell block: left cell = lab information, right cell = verified-by + signature image + date. | Existing, visual refresh |
| PR-11 | Typography uses IBM Plex Sans if the font-extension is installed; falls back to Helvetica otherwise. No external font download required. | Style Guide v1 §4 |
| PR-12 | Report prints on US Letter (612 × 792 pts) with 30pt L/R margins, 20pt T/B margins — unchanged from current JRXML. | Existing |

## 6. Visual tokens (the `<style>` block)

Paste this inside `<jasperReport>` after the `<parameter>` / before the `<queryString>` block. These styles align the PDF with Style Guide v1 tokens; use them as the `style=` attribute on `textField` / `staticText` / `frame` elements.

```xml
<!-- Typography and color tokens — align with Style Guide v1 -->
<style name="PageTitle" fontName="SansSerif" size="14" isBold="true" forecolor="#161616" pdfFontName="Helvetica-Bold"/>
<style name="FacilityMeta" fontName="SansSerif" size="9" forecolor="#525252" pdfFontName="Helvetica"/>
<style name="BlockLabel" fontName="SansSerif" size="7" isBold="true" forecolor="#525252" pdfFontName="Helvetica-Bold"/>
<style name="PatientName" fontName="SansSerif" size="11" isBold="true" forecolor="#161616" pdfFontName="Helvetica-Bold"/>
<style name="FieldLabel" fontName="SansSerif" size="8" forecolor="#525252" pdfFontName="Helvetica"/>
<style name="FieldValue" fontName="SansSerif" size="8" forecolor="#161616" pdfFontName="Helvetica"/>
<style name="FieldValueCode" fontName="Monospaced" size="8" forecolor="#161616" pdfFontName="Courier"/>
<style name="SectionTitle" fontName="SansSerif" size="9" isBold="true" forecolor="#295785" pdfFontName="Helvetica-Bold"/>
<style name="ColHeader" fontName="SansSerif" size="7" isBold="true" forecolor="#525252" pdfFontName="Helvetica-Bold"/>
<style name="ResultValue" fontName="SansSerif" size="9" forecolor="#161616" pdfFontName="Helvetica"/>
<style name="ResultValueAbnormal" fontName="SansSerif" size="9" isBold="true" forecolor="#da1e28" pdfFontName="Helvetica-Bold"/>
<style name="ResultArrow" fontName="SansSerif" size="10" isBold="true" forecolor="#161616" pdfFontName="Helvetica-Bold"/>
<style name="MethodSubline" fontName="SansSerif" size="7" forecolor="#6f6f6f" pdfFontName="Helvetica"/>
<style name="NoteRow" fontName="SansSerif" size="8" isItalic="true" forecolor="#525252" backcolor="#f4f4f4" pdfFontName="Helvetica-Oblique"/>
<style name="Legend" fontName="SansSerif" size="7" forecolor="#525252" pdfFontName="Helvetica"/>
<style name="PageFooterText" fontName="SansSerif" size="7" forecolor="#6f6f6f" pdfFontName="Helvetica"/>

<!-- Rule colors -->
<!-- Brand navy rule  #295785  – used on section underline, p2 strip accent -->
<!-- Error rule       #da1e28  – abnormal high / abnormal flag -->
<!-- Info rule        #0043ce  – abnormal low -->
<!-- Divider          #e0e0e0  – generic subtle rule -->
<!-- Divider strong   #c6c6c6  – column header underline -->
```

### Conditional style for abnormal rows

Jasper supports `<conditionalStyle>` inside a `<style>`. Add this to the result-row frame:

```xml
<style name="ResultRow" fontName="SansSerif" size="9" forecolor="#161616">
  <conditionalStyle>
    <conditionExpression><![CDATA[$F{abnormalResult} == Boolean.TRUE && "H".equals($F{alerts})]]></conditionExpression>
    <style backcolor="#fff1f1" forecolor="#161616" mode="Opaque"/>
  </conditionalStyle>
  <conditionalStyle>
    <conditionExpression><![CDATA[$F{abnormalResult} == Boolean.TRUE && "L".equals($F{alerts})]]></conditionExpression>
    <style backcolor="#f0f6ff" forecolor="#161616" mode="Opaque"/>
  </conditionalStyle>
  <conditionalStyle>
    <conditionExpression><![CDATA[$F{abnormalResult} == Boolean.TRUE]]></conditionExpression>
    <style backcolor="#fff1f1" forecolor="#161616" mode="Opaque"/>
  </conditionalStyle>
  <conditionalStyle>
    <conditionExpression><![CDATA[$F{parentMarker} == Boolean.TRUE]]></conditionExpression>
    <style backcolor="#f4f4f4" isBold="true" mode="Opaque"/>
  </conditionalStyle>
</style>
```

The left-edge color accent is drawn as a separate `<line>` element inside the detail band (not a style) — see §7.4.

## 7. Band-by-band implementation notes

All coordinates assume the existing 552pt column width (pageWidth 612, L/R margin 30). Coordinates are from the band's top-left; `x y w h` in that order.

### 7.1 Page header (138pt → keep at 138pt)

**No structural change.** The page header already slots in `$P{headerName}` (default `GeneralHeader.jasper`) as a subreport at `0 0 552 94`. Leave that alone.

**Changes to the elements below the subreport:**

- The existing `"correctedReport"` banner textField at `0 93 552 22` — change size from 13 to 11, add `mode="Opaque" backcolor="#b38600" forecolor="#FFFFFF"` so it becomes a colored bar (only renders when `$F{correctedResult}` is true — existing `printWhenExpression` preserved).
- The existing `$R{report.results} + " " + $F{completeFlag}` textField at `1 115 550 23` — demote to a right-aligned small chip: reduce to `420 115 131 16`, style `FacilityMeta`, add surrounding `<ellipse>` or rounded rectangle with `backcolor="#e8e8e8"` (for "Complete") or `#fcf4d6` (for "Partial"). Logic via conditional style on the completeFlag value.

### 7.2 Accession group header — first page frame (current height 84pt → new height 120pt)

This is the biggest change. Current: 11 cells in a dense 4-column grid. New: two columns, labels on the left, values on the right, 8pt vertical rhythm.

**Left column — PATIENT (x 0–270):**

| Element | Position (x y w h) | Content | Style |
|---|---|---|---|
| Block label "Patient" | `0 0 270 10` | `$P{localization}.get("patient")` (new key, see §8) | BlockLabel |
| Rule under label | line `0 11 270 1` | — | color #e0e0e0 |
| Patient name | `0 14 180 14` | `$F{patientName}` | PatientName |
| Age+sex inline | `180 15 90 13` text-align right | `$R{report.age} + " " + $F{age} + " · " + $F{gender}` | FieldValue |
| "Patient code" label | `0 32 80 12` | `$P{localization}.get("patientCode")` | FieldLabel |
| Patient code value | `80 32 190 12` | `$F{subjectNumber}` | FieldValueCode |
| "National ID" label | `0 46 80 12` | `$P{localization}.get("idNational")` | FieldLabel |
| National ID value | `80 46 190 12` | `$F{nationalId}` | FieldValueCode |
| "Contact" label | `0 60 80 12` | `$P{localization}.get("contact")` (new key) | FieldLabel |
| Contact value | `80 60 190 12` | `$F{contactInfo}` | FieldValue |
| "Billing" label | `0 74 80 12` | `$P{billingNumberLabel}` | FieldLabel |
| Billing value | `80 74 190 12` | `$F{billingNumber}` | FieldValueCode |
| "ST Number" label (conditional `$P{useSTNumber}`) | `0 88 80 12` | `$P{localization}.get("stNumber")` (new) | FieldLabel |
| ST Number value (conditional) | `80 88 190 12` | `$F{stNumber}` | FieldValueCode |

**Right column — ORDER (x 282–552):**

| Element | Position | Content | Style |
|---|---|---|---|
| Block label "Order" | `282 0 270 10` | `$P{localization}.get("order")` (new) | BlockLabel |
| Rule under label | line `282 11 270 1` | — | #e0e0e0 |
| "Accession #" label | `282 14 90 12` | `$P{localization}.get("ordinanceNo")` | FieldLabel |
| Accession value | `372 14 180 12` | `$F{accessionNumber}` | FieldValueCode, bold |
| "Program" label | `282 28 90 12` | `$P{localization}.get("program")` | FieldLabel |
| Program value | `372 28 180 12` | `$F{labOrderType}` | FieldValue |
| "Prescriber" label | `282 42 90 12` | `$P{localization}.get("prescriber")` | FieldLabel |
| Prescriber value | `372 42 180 12` | `$F{contactInfo}` (same field reused — it holds prescriber info in this position per current JRXML) | FieldValue |
| "Referring site" label | `282 56 90 12` | `$P{localization}.get("referringSite")` | FieldLabel |
| Referring value | `372 56 180 12` | `$F{siteInfo}` | FieldValue |
| "Order date" label | `282 70 90 12` | `$P{localization}.get("orderDate")` | FieldLabel |
| Order date value | `372 70 180 12` | `$F{orderDate}` | FieldValue |
| "Received" label | `282 84 90 12` | `$P{localization}.get("receiptDate")` | FieldLabel |
| Received value | `372 84 180 12` | `$F{recievedDate}` | FieldValue |
| "Collected" label | `282 98 90 12` | `$P{localization}.get("specimenCollectTimes")` | FieldLabel |
| Collected value | `372 98 180 12` | `$F{collectionDateTime}` | FieldValue |

**Remove** the 29pt "specimen collect times" strip at `0 84 553 29` — that field now lives inside the order block.

### 7.3 Accession group header — continuation page strip (new)

When `$V{PAGE_NUMBER} > 1`, render a 22pt condensed strip instead of the full demographics frame.

| Element | Position | Content | Style |
|---|---|---|---|
| Left accent rule | line `0 0 3 22` | — | #295785 |
| Strip background | rectangle `3 0 549 22` | — | fill #f4f4f4 |
| Patient + demo | `10 3 220 16` | `$F{patientName} + " · " + $R{report.age} + " " + $F{age} + " · " + $F{gender}` | FieldValue, bold on name |
| Patient code | `240 3 120 16` | `$P{localization}.get("patientCode") + " " + $F{subjectNumber}` | FieldValue |
| Accession | `370 3 120 16` | `$P{localization}.get("ordinanceNo") + " " + $F{accessionNumber}` | FieldValue |
| Collected | `490 3 62 16` | `$F{collectionDateTime}` | FieldValue |

Control which renders via `printWhenExpression`:
- Full card: `$V{PAGE_NUMBER} == 1`
- Strip: `$V{PAGE_NUMBER} > 1`

### 7.4 Section group header (current 41pt → new 32pt)

Simplify the nested frame-of-column-headers into a clean section title + rule + compact column header row.

| Element | Position | Content | Style |
|---|---|---|---|
| Section title | `0 0 400 14` | `$F{testSection}` | SectionTitle, uppercase |
| Sample-type annotation | `0 0 552 14` (right-aligned, muted) | `$F{sampleType}` (new field use — see §9) | FieldLabel, italic |
| Underline rule | line `0 16 552 1` | — | #161616, pen 1.0 |
| Col: Test | `0 18 220 12` | `$P{localization}.get("test")` | ColHeader, left |
| Col: Spec | `224 18 40 12` | `$P{localization}.get("specimen")` | ColHeader, center |
| Col: Result | `268 18 90 12` | `$P{localization}.get("outcome")` | ColHeader, right |
| Col: Ref range | `362 18 100 12` | `$P{localization}.get("referenceValue")` | ColHeader, left |
| Col: Units | `466 18 54 12` | `$P{localization}.get("unit")` | ColHeader, left |
| Col: Flag | `524 18 28 12` | `$P{localization}.get("alert")` | ColHeader, center |
| Footer rule | line `0 31 552 1` | — | #c6c6c6 |

Remove the outer `<frame>` with 0.5pt pen on all sides — it's visually heavy and not needed once typography carries the hierarchy.

### 7.5 Detail band — result row (current 34pt → new 30pt main + optional 16pt note)

**Main row band (30pt — 22pt for the result line + 8pt for the method sub-line):**

| Element | Position | Content | Style |
|---|---|---|---|
| Left-edge accent | line `0 0 3 22` | — | conditional via §6: **solid** `#da1e28` when abnormal high, **dashed 2-2** `#0043ce` when abnormal low (`pen lineStyle="Dashed"`), transparent otherwise. Line style is the non-color redundant cue per §17. |
| Row background | rectangle `3 0 549 22` | — | uses ResultRow conditional style |
| Test name | `8 2 210 14` | `$F{testName}` markup="html" | ResultValue, with `padding-left: 14` when `parentMarker == false && panelName != null` (panel child) |
| Method sub-line | `8 15 320 8` | `$F{methodName}` | MethodSubline (7pt muted), `printWhenExpression="$F{methodName} != null && !$F{methodName}.isEmpty()"` — indents match the test-name column |
| Specimen sort | `224 2 40 18` | `$F{sampleSortOrder}` | ResultValue, center, mono |
| Arrow glyph | `256 2 10 18` | Unicode `\u2191` when `"H".equals($F{alerts})`, `\u2193` when `"L".equals($F{alerts})`, empty otherwise | ResultArrow, center — **the B&W-safe abnormal signal** (visible in any monochrome photocopy) |
| Result value | `268 2 90 18` | `$F{result}` markup="styled", text-align right | ResultValueAbnormal when `abnormalResult == true`, else ResultValue |
| Reference range | `362 2 100 18` | `$F{testRefRange}` | ResultValue, muted |
| Units | `466 2 54 18` | `$F{uom}` | ResultValue, muted |
| Flag | `524 2 28 18` | `$F{alerts}` markup="html" | ResultValueAbnormal, center |
| Bottom divider | line `3 29 549 1` | — | #e0e0e0 |

Panel parent row uses the ResultRow conditional style's `parentMarker` branch (bg #f4f4f4, bold). Panel child rows (where `parentMarker == false`) indent the test name by 14pt. The method sub-line also prints inside panel-child rows but suppresses (via printWhen) on panel-parent rows, where it's semantically redundant (the parent aggregates multiple child methods).

**Optional note row (16pt, conditional on `$F{note} != null`):**

| Element | Position | Content | Style |
|---|---|---|---|
| Note background | rectangle `22 22 530 14` | — | fill #f4f4f4 |
| Left indicator | rectangle `22 22 2 14` | — | fill #c6c6c6 |
| Note label | `28 23 40 12` | "Note" (or `$P{localization}.get("note")`, new key) | BlockLabel |
| Note text | `72 23 478 14` | `$F{note}` markup="styled" | NoteRow |

### 7.6 Section group footer & column footer

Leave the section group footer empty (as it is now).

**Column footer (current 30pt, keep 30pt):**

Replace the two concatenated text lines with five one-line legend items plus a clinical-conclusion block that renders only on the last page of the accession.

| Element | Position | Content | Style |
|---|---|---|---|
| "Legend" label | `0 2 50 14` | `$R{report.legend}` | BlockLabel |
| H flag | `52 2 120 14` | `<b><color red>H</color></b> ` + `$R{report.aboveNormal}` markup="html" | Legend |
| L flag | `172 2 120 14` | `<b><color blue>L</color></b> ` + `$R{report.belowNormal}` | Legend |
| * flag | `292 2 100 14` | `<b><color red>*</color></b> ` + `$R{report.abnormal}` | Legend |
| R flag | `392 2 80 14` | `<b>R</b> ` + `$R{report.extLabReference}` | Legend |
| C flag | `472 2 80 14` | `<b>C</b> ` + `$R{report.confirmTest}` | Legend |
| Top rule | line `0 0 552 1` | — | #e0e0e0 |

**Conclusion block** (new, optional) — render only if `$F{conclusion} != null && !$F{conclusion}.isEmpty()`. Place in the column footer or a new summary band:

| Element | Position | Content | Style |
|---|---|---|---|
| Block label | `0 0 100 10` | `$P{localization}.get("clinicalConclusion")` (new key) | BlockLabel |
| Left accent | rectangle `0 12 3 40` | fill #295785 |
| Conclusion text | `10 12 542 40` (stretchy) | `$F{conclusion}` markup="styled" | FieldValue |

### 7.7a Accreditation logo slot (in-scope — minimal addition to existing sign-off)

The full typographic restyle of the sign-off in §7.7 is deferred, but the accreditation mark is small, independently useful, and anchors to the sign-off legally (ISO 15189 §7.4 ties accreditation claims to the verifying signatory). We add only the image slot + optional number line on top of the existing person-group footer frame.

**Changes to the existing `Person` group footer (no repositioning of current elements):**

| Element | Position (x y w h) | Content | Style |
|---|---|---|---|
| Accreditation image | `472 2 70 40` | `$P{accreditationImage}` | `<image onErrorType="Blank" hAlign="Right" vAlign="Top" scaleImage="RetainShape"/>` — renders blank when the parameter is null |
| Accreditation number | `372 44 170 10` | `$P{localization}.get("accreditedBy") + " " + $P{accreditationNumber}` | FacilityMeta, right-aligned, `printWhen="$P{accreditationNumber} != null && !$P{accreditationNumber}.isEmpty()"` |

Both renderers are parameter-driven. A site with no accreditation mark leaves `accreditationImage = null` and `accreditationNumber = null` and the footer looks identical to today's output. A site with an ISO 15189 mark passes in the PNG and the number `"ISO 15189:2022 · ACC-2024-0142"` and both render.

**Parameters to add** (see §10 update):

- `accreditationImage` (InputStream) — PNG or JPEG of the accreditation mark. Sized ≤ 70×40pt for the footer slot.
- `accreditationNumber` (String) — free-text accreditation reference (e.g. ISO 15189 scope number).

### 7.7 Person group footer — sign-off (current 61pt → new 90pt)

Current: a single horizontal box with two textFields and one image. Keep the same three pieces of information but typeset them like a legal sign-off, not a spreadsheet.

| Element | Position | Content | Style |
|---|---|---|---|
| Top rule | line `0 0 552 1` | — | #161616, pen 1.5 |
| Left cell bg | rectangle `0 2 330 88` | no fill | — |
| Left label "Lab info" | `10 6 310 10` | `$P{localization}.get("labInfomation")` | BlockLabel |
| Lab info text | `10 18 310 70` | (multiline, from site parameters + accreditation text) | FieldValue |
| Cell divider | line `332 2 1 88` | — | #c6c6c6 |
| Right label "Verified by" | `342 6 200 10` | `$P{localization}.get("signValidation")` | BlockLabel |
| Signature image | `342 22 200 40` | `$P{imagesPath} + "RTSign.jpg"` | onErrorType="Blank" |
| Signature rule | line `342 62 200 1` | — | #161616 |
| Director name | `342 64 120 14` | `$P{directorName}` | FieldValue, bold |
| Sign date | `462 64 80 14` | `$P{localization}.get("date") + " " + new Date()` | FieldValue, right |
| Director title | `342 78 200 10` | (static from site config) | FieldLabel |

### 7.8 Page footer (current 22pt, keep 22pt)

Replace the current three-element layout with a clean three-column footer:

| Element | Position | Content | Style |
|---|---|---|---|
| Left: generated timestamp | `0 6 240 12` | `$P{localization}.get("reportDate") + " " + new Date()` | PageFooterText |
| Center: accession + patient | `200 6 232 12` | `$P{localization}.get("ordinanceNo") + " " + $F{accessionNumber} + " · " + $P{localization}.get("patientCode") + " " + $F{subjectNumber}` | PageFooterText, center |
| Right: page X of Y | `432 6 120 12` | `"Page " + $V{PAGE_NUMBER} + " " + $P{localization}.get("about") + " " + $V{PAGE_NUMBER}` (keep the existing Group-evaluated "of Y" pattern) | PageFooterText, right |
| Top rule | line `0 0 552 1` | — | #e0e0e0 |

## 8. i18n keys — additions & fixes

### Fix

| Offending line | File | Fix |
|---|---|---|
| `<text><![CDATA[  Nom, Prenom(s)]]></text>` at JRXML group header, page-1 frame | `patient.jrxml` | Replace `<staticText>` with `<textField>` bound to `$P{localization}.get("patientName")` |

### New keys to add to `MessageResources_*.properties`

Add these to the message-resource bundles (English + French at minimum). The keys follow the same `camelCase` convention the current JRXML already uses.

| Key | EN | FR |
|---|---|---|
| `patient` | Patient | Patient |
| `order` | Order | Prescription |
| `contact` | Contact | Contact |
| `stNumber` | ST number | Numéro ST |
| `clinicalConclusion` | Clinical conclusion | Conclusion clinique |
| `note` | Note | Note |
| `patientName` | Last name, First name | Nom, Prénom(s) |
| `method` | Method | Méthode |
| `accreditedBy` | Accredited by | Accrédité par |

All other keys (`idNational`, `ordinanceNo`, `program`, `prescriber`, `referringSite`, `orderDate`, `receiptDate`, `patientCode`, `specimenCollectTimes`, `labInfomation`, `signValidation`, `test`, `specimen`, `outcome`, `referenceValue`, `unit`, `alert`, `status`, `analysisReport`, `correctedReport`, `about`, `reportDate`, `date`) are already used in the current JRXML and keep their existing translations.

## 9. Field map (all 38 fields → new placement)

| # | Field | Type | Current placement | New placement (section/band) | Notes |
|---|---|---|---|---|---|
| 1 | `patientName` | String | Accession group-header frame, 100×28 @ (100,28) | Patient block, patient name line | 15pt semibold |
| 2 | `age` | String | Frame @ (453,0) w=33 | Right of patient name, inline | Combined with gender |
| 3 | `gender` | String | Frame @ (525,0) w=28 | Right of age, inline | Single-letter M/F/U |
| 4 | `subjectNumber` | String | Frame @ (101,0) w=100 AND @ (100,1) w=96 (duplicated in page-2 frame) | Patient block "Patient code" row + page-2 condensed strip | Single source of truth |
| 5 | `nationalId` | String | Frame @ (286,0) w=117 | Patient block "National ID" row | |
| 6 | `contactInfo` | String | Frame @ (101,42) w=170 + @ (100,15) w=166 (page-2) | Patient block "Contact" row (patient phone) OR Order block "Prescriber" row — note current JRXML reuses the same field in two semantic contexts; preserve that behavior | Dual-use preserved |
| 7 | `billingNumber` | String | Frame @ (286,14) w=116 | Patient block "Billing #" row | |
| 8 | `stNumber` | String | Not currently placed in main page-1 frame; referenced via `useSTNumber` conditional | Patient block "ST Number" row (conditional on `$P{useSTNumber}`) | |
| 9 | `accessionNumber` | String | Frame @ (100,56) w=171 + @ (463,1) w=90 (page-2) | Order block "Accession #" line + page-2 strip + page footer | |
| 10 | `labOrderType` | String | Frame @ (371,56) w=182 | Order block "Program" row | |
| 11 | `siteInfo` | String | Frame @ (371,42) w=182 + @ (366,15) w=187 (page-2) | Order block "Referring site" row + person footer lab-info block | |
| 12 | `orderDate` | String | Frame @ (163,70) w=108 | Order block "Order date" row | |
| 13 | `recievedDate` | String (typo) | Frame @ (434,70) w=119 | Order block "Received" row | Keep field name as-is — backend dependency |
| 14 | `collectionDateTime` | String | Separate strip @ (0,84) w=553 h=29 | Order block "Collected" row + page-2 strip | |
| 15 | `testSection` | String | Section group-header title | Section group-header title | Uppercase, brand navy |
| 16 | `sampleType` | String | Not currently placed | Section group-header right-annotation | New use of existing field |
| 17 | `sampleSortOrder` | String | Detail col @ (111,0) w=35 | Detail col 2 "Spec" | Mono font |
| 18 | `panelName` | String | Used implicitly via parentMarker | Section header (optional) or panel parent row text | |
| 19 | `parentMarker` | Boolean | Detail row bg #E0E0E0 when true | Detail row conditional style (bg #f4f4f4 + bold) | |
| 20 | `separator` | Boolean | Controls detail visual break | Retained — handles blank row between panels | |
| 21 | `testName` | String | Detail col @ (0,0) w=111 | Detail col 1 | Panel children indent 14pt |
| 22 | `result` | String | Detail col @ (146,0) w=117, right-aligned | Detail col 4 "Result", right-aligned tabular | ResultValueAbnormal when abnormal |
| 23 | `analysisStatus` | String | Detail col @ (263,0) w=60 | Detail col (inline with result, small caps) OR drop from visible — evaluate with stakeholders; current content often redundant with `result` | See open question Q2 |
| 24 | `alerts` | String | Detail col @ (323,0) w=34, center | Detail col 6 "Flag" + drives row conditional styling | |
| 25 | `testRefRange` | String | Detail col @ (357,0) w=117 | Detail col 5 "Reference range" | Muted color |
| 26 | `uom` | String | Detail col @ (474,0) w=79 | Detail col 6 "Units" | Muted color |
| 27 | `note` | String | Secondary row @ (10,18) w=543, bg #F5F5F5 | Secondary row indented under result, bg #f4f4f4, italic muted | Uses `$F{note} != null` printWhen |
| 28 | `abnormalResult` | Boolean | Not visibly driving layout today | Drives row conditional style (bg tint + left accent) | |
| 29 | `correctedResult` | Boolean | Drives pageheader banner | Drives corrected banner (restyled) + "Corrected" chip in status strip | |
| 30 | `completeFlag` | String | Pageheader text "Results: <flag>" | Status chip in top-right (Complete/Partial/Corrected) | |
| 31 | `conclusion` | String | Not currently rendered in this JRXML | Optional summary block at end of accession — printWhen on non-empty | New position for existing field |
| 32 | `dept` | String | Not currently placed | Optional — can be added to person footer lab-info lines | |
| 33 | `commune` | String | Not currently placed | Optional — same as dept | |
| 34 | `healthRegion` | String | Not currently placed | Optional — same as dept | |
| 35 | `healthDistrict` | String | Not currently placed | Optional — same as dept | |
| 36 | `patientSiteNumber` | String | Not currently placed | Optional — Patient block supplementary row when populated | |
| 37 | `sampleId` | String | Not currently placed | Optional — adjacent to Accession # when different from accessionNumber | |
| 38 | `orderFinishDate` | String | Passed to header subreport | Unchanged — still in header subreport | |
| 39 | `methodName` | String | **Not on bean today** — see §14 Related backend work | Detail row sub-line at `8 15 320 8`, MethodSubline style (7pt muted), `printWhen="$F{methodName} != null && !$F{methodName}.isEmpty()"` | New field — ISO 15189 §7.4 examination procedure disclosure |

## 10. Parameters (all retained)

| Parameter | Type | New use |
|---|---|---|
| `SUBREPORT_DIR` | String | Unchanged |
| `siteId` | String | Unchanged |
| `siteName` | String | Facility header subreport |
| `directorName` | String | Person-footer sign-off cell |
| `headerName` | String | Unchanged |
| `usePageNumbers` | String | Unchanged — controls page-number printWhen |
| `additionalSiteInfo` | String | Facility header subreport |
| `useSTNumber` | Boolean | Controls printWhen on ST Number row in Patient block |
| `correctedReport` | Boolean | Unchanged — drives corrected banner |
| `billingNumberLabel` | String | Used as the Billing label in Patient block |
| `footerName` | String | Unchanged |
| `leftHeaderImage` | InputStream | Passed to header subreport |
| `rightHeaderImage` | InputStream | Passed to header subreport |
| `localization` | Map | Every visible string (more keys added — see §8) |
| `imagesPath` | String | Signature image path |
| `accreditationImage` | InputStream | **New.** PNG/JPEG of the accreditation mark. Rendered in the sign-off slot per §7.7a. Null-safe via `onErrorType="Blank"`. |
| `accreditationNumber` | String | **New.** Free-text accreditation reference (e.g. `"ISO 15189:2022 · ACC-2024-0142"`). Rendered below the mark when non-empty. |

## 11. Acceptance criteria

> **Note:** ACs flagged **(deferred)** belong to sections whose implementation is pushed to a follow-on ticket per the §2 scope trim. The first-round merge ships AC1, AC3, AC5, AC6, AC9, AC12, and all AC-CFG-* criteria (§15.4), plus the Letter/A4 equivalence ACs below.

- [ ] AC1. Running the patient report for a single-accession fixture produces a one-page PDF identical in content fields to the previous JRXML (all 38 fields rendered where applicable).
- [ ] AC2. Running the patient report for a multi-accession date-range fixture produces one page per accession plus sign-off, with the condensed strip on all continuation pages. **(deferred — continuation strip §7.3)**
- [ ] AC3. When a result row has `abnormalResult == true` and `alerts == "H"`, the row background is `#fff1f1` and the left-edge accent is `#da1e28`.
- [ ] AC4. When a result row has `abnormalResult == true` and `alerts == "L"`, the row background is `#f0f6ff` and the left-edge accent is `#0043ce`. **(covered by AC3's conditional-style test matrix — merge in-scope)**
- [ ] AC5. When a result has `parentMarker == true`, the row background is `#f4f4f4` and the text is bold; the subsequent child rows (`parentMarker == false` where `panelName` matches) indent the test name by 14pt.
- [ ] AC6. When a result has `note != null`, a secondary 16pt row renders directly beneath with `$F{note}` in italic muted style.
- [ ] AC7. When `correctedResult == true`, the corrected banner renders in the page header with `backcolor="#b38600"` and `forecolor="#FFFFFF"`. **(deferred — §7.1)**
- [ ] AC8. The status chip in the top-right of the page header shows "Complete", "Partial", or "Corrected" backed by the corresponding `$F{completeFlag}` value, with Partial showing a warning-yellow background and Complete showing a success-green background. **(deferred — §7.1)**
- [ ] AC9. No hard-coded English or French strings appear in the JRXML visible elements. Running the report with `localization` set to a French `ResourceBundle` produces a fully French PDF. Running with English produces a fully English PDF.
- [ ] AC10. The sign-off block at the bottom of the last page of each person-group shows the laboratory information, the `RTSign.jpg` image (or a blank space if the image is missing — `onErrorType="Blank"` is preserved), the director name, and the report date. **(deferred — §7.7)**
- [ ] AC11. The page footer on every page shows "Report generated [datetime]" on the left, accession + patient code in the center, and "Page X of Y" on the right. `usePageNumbers == "false"` suppresses the page-number portion. **(deferred — §7.8)**
- [ ] AC12. The legend in the column footer shows five labeled flags (H / L / * / R / C) pulled from the `$R{report.*}` bundle.

**Letter/A4 equivalence ACs** (first-round merge):

- [ ] AC-PS-1. `patient_letter.jrxml` and `patient_a4.jrxml` render the same fixture with visually-equivalent layouts — same bands in the same order, same column order, same row heights; only the overall page width differs (612 vs 595 pts).
- [ ] AC-PS-2. Running the same fixture against both templates produces PDFs whose per-page content is byte-for-byte identical *except* for `/MediaBox` (paper size) and the horizontal positions of right-justified elements.
- [ ] AC-PS-3. Neither template hardcodes the paper size in metadata visible to clinicians — the filename and any on-document mentions refer to generic "patient report", not "letter" or "A4".

## 12. Open questions (non-blocking, flag for stakeholder review)

- **Q1.** Current JRXML field `analysisStatus` is rendered in the detail row at x=263 w=60, but its content often duplicates or is redundant with the result value. Should we keep it visible, demote it to a tag chip, or remove it from the visible output? **Suggested default:** keep as a small caps status tag inline with the result cell, until stakeholder review.
- **Q2.** Fields not currently placed anywhere in the page-1 frame but present in the dataset: `dept`, `commune`, `healthRegion`, `healthDistrict`, `patientSiteNumber`, `sampleId`. Are these intentionally hidden, or do some deployments expect them printed? **Suggested default:** print-when-non-empty in a supplementary "Site" line under the Patient block.
- **Q3.** Should panel parent rows show the panel name (`$F{panelName}`) as the row's label, or the `testName` field (which may be the panel-level aggregate result)? Current JRXML uses `testName` in both cases. **Suggested default:** keep `testName` rendering unchanged to avoid data-migration risk; just visually distinguish via conditional style.

## 13. Deliverables (this package)

| File | Purpose |
|---|---|
| `patient-report-redesign-preview.html` | Rendered preview at US-Letter **and** A4 dimensions. Toggle "Annotated bands" to see band boundaries + labels mapped to Jasper band names. Toggle "Paper size" to switch between Letter and A4 in the viewer. |
| `patient-report-redesign-spec.md` | This document. Hand to the dev with the preview. |
| `patient_letter.jrxml` | (Dev deliverable) — redesigned US-Letter template. Renamed from the existing `patient.jrxml`. |
| `patient_a4.jrxml` | (Dev deliverable) — A4 sibling, same layout, page size 595×842 pts and six widths scaled per §16. |

## 14. What's not in this package (by design)

- A pre-filled `patient.jrxml` with all the edits applied. That was the "Mockup + JRXML skeleton" fidelity option, which Casey did not select — the chosen fidelity is "Annotated mockup + field map". If you want me to go one step further and produce the JRXML file, say the word and I'll generate it.
- Actual `.properties` file edits. The keys to add are listed in §8 — adding them is trivial once the translator has the EN/FR text.
- Automated visual-regression tests. Suggest adding a small Jasper fixture harness if the team doesn't have one; out of scope for this redesign ticket.
- Redesign of the sister patient JRXMLs (`PatientReportCDI`, `Patient_ARV_*`, `Patient_VL_*`, `TBPatientReport`, `RetroCI_Patient_EID`). Those are a separate ticket per variant.

### Related backend work (separate sub-ticket)

The `methodName` field referenced in §7.5 and §9 row 39 is **not** currently populated on `PatientReportBean`. Before the JRXML method sub-line can render, a small backend change is needed:

1. Add `private String methodName;` + getter/setter to `org.openelisglobal.reports.action.implementation.reportBeans.PatientReportBean`.
2. In the bean populator (typically `PatientReport.setPatientInfo()` or the loop that walks `AnalysisItem` → `Analysis` → `Method`), set `methodName` from `analysis.getMethod().getMethodName()` when the method is non-null.
3. Null-safety: leave `methodName = null` when the analysis has no method assigned. The JRXML `printWhen` already handles the null case.

**Effort:** ~15 min for a dev familiar with the reports subsystem. **Files touched:** `PatientReportBean.java`, one populator class. **No DB change.** **No API contract change.** The backend ticket can ship in the same PR as the JRXML redesign or ship just before.

The existing `AnalysisItem` already carries method information in OpenELIS-Global-2 — this is a plumb-it-through change, not a net-new domain model.

---

## 15. Paper-size configuration — Letter vs A4

### 15.1 Where it lives

The setting goes into the **existing** admin page at `Admin → General Configuration → Printed Reports Configuration`. No new nav item, no new page.

Add one new field to that page:

| Field | Type | Options | Default | Applies to |
|---|---|---|---|---|
| `Printed report paper size` | Radio group (single-select) | `US Letter (8.5 × 11 in)` · `A4 (210 × 297 mm)` | `US Letter` | All printed reports (global setting) |

**Scope decision (2026-04-23 clarification):** Global default only. One setting applies to every printed report the deployment generates. If a future need emerges for per-report override, the config schema can extend cleanly — keep the field name `printedReport.defaultPaperSize` so a later `printedReport.patient.paperSize` slot doesn't conflict.

### 15.2 Persistence

Store as a single row in the `SiteInformation` table (or whichever key-value config table the existing `Printed Reports Configuration` page already writes to — the dev should inspect the page and use the same mechanism).

Suggested key: `printedReport.defaultPaperSize`
Suggested values (string): `LETTER` · `A4`

### 15.3 Template resolution

The report-generation code currently loads `patient.jrxml` by a hardcoded path. Replace that lookup with a small resolver:

```java
// Pseudocode — exact shape depends on the existing ReportServiceImpl
String paperSize = configService.getValue("printedReport.defaultPaperSize", "LETTER");
String template = switch (paperSize) {
    case "A4"     -> "patient_a4.jrxml";
    case "LETTER" -> "patient_letter.jrxml";
    default       -> "patient_letter.jrxml";
};
return loadJrxml("reports/" + template);
```

If the existing code uses a single template-name constant, add a `getPatientReportTemplate()` helper to keep the resolver in one place — the same helper will later serve the sister reports (CDI, ARV, VL, TB) once they ship their A4 siblings.

### 15.4 Acceptance criteria

- [ ] AC-CFG-1. `Admin → General Configuration → Printed Reports Configuration` shows a "Printed report paper size" radio group with `US Letter` / `A4` options.
- [ ] AC-CFG-2. Default when no value is set is `US Letter`.
- [ ] AC-CFG-3. Saving the setting persists it; reloading the page shows the saved value.
- [ ] AC-CFG-4. When `US Letter` is selected and a patient report is generated, the PDF uses `patient_letter.jrxml` (page size 612 × 792 pts).
- [ ] AC-CFG-5. When `A4` is selected and a patient report is generated, the PDF uses `patient_a4.jrxml` (page size 595 × 842 pts).
- [ ] AC-CFG-6. The field label and option labels come from `$P{localization}` / the `MessageResources` bundle — no hardcoded English or French.
- [ ] AC-CFG-7. Write enforcement: only a user with the existing "Configuration" admin permission can change the setting (no new permission key needed — reuse the page's existing guard).

### 15.5 i18n keys to add

| Key | EN | FR |
|---|---|---|
| `printedReport.paperSize.label` | Printed report paper size | Taille du papier pour les rapports imprimés |
| `printedReport.paperSize.letter` | US Letter (8.5 × 11 in) | US Letter (8,5 × 11 po) |
| `printedReport.paperSize.a4` | A4 (210 × 297 mm) | A4 (210 × 297 mm) |

---

## 16. A4 template — delta from the Letter version

The A4 template is not a ground-up redesign. It is a structural copy of `patient_letter.jrxml` with six attributes/widths changed. The dev produces it by duplicating the Letter file and applying this patch.

### 16.1 Page-level attributes

| Attribute | Letter value | A4 value | Notes |
|---|---|---|---|
| `pageWidth` | `612` | `595` | Jasper page width in pts |
| `pageHeight` | `792` | `842` | Jasper page height in pts |
| `columnWidth` | `552` | `535` | `pageWidth − leftMargin(30) − rightMargin(30)` |
| `leftMargin` | `30` | `30` | Unchanged |
| `rightMargin` | `30` | `30` | Unchanged |
| `topMargin` | `20` | `20` | Unchanged |
| `bottomMargin` | `20` | `20` | Unchanged |

> **96dpi rounding note for the screen preview:** A4 `595pt × 96/72 = 793.33px`, which the preview rounds to `794px`. This is a screen-rendering artifact only; the JRXML stays at `595pt` and the PDF is exact.

### 16.2 Widths to scale

Any element that spans the full column width (552pt in Letter) must narrow to 535pt in A4. Everything else keeps its Letter position. This keeps the two files visually near-identical and makes diff review straightforward.

| Element | Letter width | A4 width | Band |
|---|---|---|---|
| Subreport frame (`headerName`) | 552 | 535 | Page header, at `0 0 552 94` → `0 0 535 94` |
| Corrected banner textField | 552 | 535 | Page header, at `0 93 552 22` → `0 93 535 22` |
| Patient block column right edge | 270 | 262 | Acc group header — Patient column spans x 0–270 in Letter, → 0–262 in A4 |
| Order block column left edge | 282 | 274 | Acc group header — Order column starts at x=282 in Letter, → x=274 in A4 |
| Order block column right edge | 552 | 535 | Order column spans to x=552 in Letter, → x=535 in A4 |
| Section header + detail band | 552 | 535 | Section underline rule `0 16 552 1` → `0 16 535 1`; result-row bg rect `3 0 549 22` → `3 0 532 22`; note-row rect, footer rules, legend line — all full-width lines/rects trim from 552/549/550 to 535/532/533 respectively |

**Detail row column widths (scaled proportionally, 17pt removed from the two widest columns):**

| Column | Letter (x, w) | A4 (x, w) | Change |
|---|---|---|---|
| Test name | 8 – 218 (w=210) | 8 – 211 (w=203) | −7 |
| Specimen | 224 – 264 (w=40) | 217 – 257 (w=40) | shift −7 |
| Result | 268 – 358 (w=90) | 261 – 351 (w=90) | shift −7 |
| Ref range | 362 – 462 (w=100) | 355 – 452 (w=97) | shift −7, w −3 |
| Units | 466 – 520 (w=54) | 456 – 507 (w=51) | shift −10, w −3 |
| Flag | 524 – 552 (w=28) | 511 – 535 (w=24) | shift −13, w −4 |

(Coordinates above are inside the 535pt column; all values given are the x-start and the element width. The right edge of the Flag column lines up with the column-width boundary.)

### 16.3 Vertical space budget

A4 has 50pt more usable height than Letter (1002pt column height vs 952pt, after margins). The redesign does not use the extra 50pt for added content — it stays as bottom whitespace, pushing the `Person` footer further from the last result row. This is desirable: it gives the sign-off visual breathing room. No band heights change between the two templates.

### 16.4 Build steps (condensed — this is the "~3 min" step in §2)

1. `cp patient_letter.jrxml patient_a4.jrxml`
2. In the `<jasperReport>` opening tag, change `pageWidth="612"` → `595`, `pageHeight="792"` → `842`, `columnWidth="552"` → `535`.
3. Find-replace the literal strings in coordinates (regex over element attributes):
   - `width="552"` → `width="535"`
   - `width="550"` → `width="533"` (the inner rule width, if present)
   - `width="549"` → `width="532"` (the row-bg rectangle)
4. Patch the 6 detail-row x/width values per the table in §16.2.
5. Visual-diff the two JRXMLs in Jaspersoft Studio — they should look nearly identical side-by-side, with A4 slightly narrower.

### 16.5 File placement in the repo

Both templates live in `src/main/resources/reports/`:

```
src/main/resources/reports/
├── patient.jrxml           # legacy — keep until the next release, then remove
├── patient_letter.jrxml    # new — redesigned, US Letter
└── patient_a4.jrxml        # new — A4 sibling
```

**Migration note:** keep `patient.jrxml` on the filesystem (unchanged) for one release cycle so any deployment with a hardcoded direct path continues to work. Flip the resolver to `patient_letter.jrxml` / `patient_a4.jrxml`. Delete `patient.jrxml` in the release after.

---

## 17. Black-and-white legibility principle

Many OpenELIS deployments print reports on monochrome lasers or photocopy verified reports for the paper chart. A design that relies on color for its clinical signal (red abnormal high vs blue abnormal low) collapses to two near-identical grays under those conditions. **Every color cue in this redesign must have a non-color redundant signal** so a photocopy carries the same information as the color PDF.

### 17.1 Redundancy matrix

| Clinical signal | Color cue (on color printer) | Non-color redundancy (carries through B&W) | Where |
|---|---|---|---|
| Abnormal high | Row tint `#fff1f1` + left-edge **solid** `#da1e28` | **Bold** result value + **`↑`** arrow glyph (U+2191) + "H" flag in alerts column | §7.5 |
| Abnormal low | Row tint `#f0f6ff` + left-edge **dashed** `#0043ce` | **Bold** result value + **`↓`** arrow glyph (U+2193) + "L" flag + **dashed** left-edge (still visible as pattern in B&W) | §7.5 |
| Abnormal generic (`alerts == "*"`) | Row tint `#fff1f1` + left-edge solid `#da1e28` | Bold result value + `*` in alerts column | §7.5 |
| Panel parent row | Bg `#f4f4f4` (prints as pale gray in B&W, identical signal) | **Bold** testName + no color dependency | §7.5 |
| Corrected report banner | Bg `#b38600` gold | Bg prints as mid-gray; add a **1pt black top + bottom border** and **uppercase bold** text | §7.1 *(deferred)* |
| Section title | Forecolor `#295785` navy (prints as mid-gray) | **Uppercase** + **1pt black** underline rule (already black in §7.4) | §7.4 |
| Complete/Partial/Corrected status chip | Green / amber / gold bg | **Shape**: Complete = plain pill, Partial = pill with left-edge dashed border, Corrected = pill with solid 1pt black border | §7.1 *(deferred)* |
| Reference-range "out of range" | No color change (stays muted gray) | Same — ref range itself isn't what's abnormal; the result value is | §7.5 |

### 17.2 Print-test requirement

Before merging, print one representative fixture to: (a) a color laser, (b) a monochrome laser, (c) a photocopy of the monochrome output. All three must let a clinician identify abnormal rows without reading the alerts column — i.e. arrow + bold must carry the signal on their own.

If (c) fails, something is relying on color-only cue. The most common culprit is a tint that's too pale at photocopy stage — in that case, make the background tint darker (e.g. `#ffe4e4` instead of `#fff1f1`) rather than removing the pattern redundancy.

### 17.3 Font-size floors for clinical text

In B&W photocopy, any sub-7pt text risks becoming unreadable. This spec floors:

- Result value: 9pt (unchanged)
- Method sub-line: 7pt (at the floor — do not reduce)
- Legend: 7pt (at the floor)
- Page footer: 7pt (at the floor)
- Alert flag single char: 9pt

Anything 6pt or smaller (current JRXML has none) is forbidden going forward.

---

## Appendix A — Summary of current patient.jrxml visual anti-patterns

Pulled directly from the JRXML for the record. These are what the redesign fixes.

1. Hard-coded French: `<text><![CDATA[  Nom, Prenom(s)]]></text>` inside the accession group header frame, bypassing `$P{localization}`. (§8 fix)
2. Stranded backcolor values: frames with `backcolor="#FF9999"`, `forecolor="#66FF66"`, `backcolor="#33FFFF"` — hidden behind `printWhenExpression` but present in the XML. (§2 step 7 cleanup)
3. Flat 9pt SansSerif font size on every visible textField — no hierarchy between facility name, patient name, section title, result value. (§6 style block)
4. 11 bordered cells compressed into 84pt of vertical space in the page-1 patient frame — dense, hard to scan. (§7.2 redesign)
5. Single-letter Gender column (28pt wide) with single-letter Age column (33pt wide), bordered and right-aligned — awkward when i18n expands "M" to "Masculin" or "Homme". (§7.2 — combined inline row)
6. Alerts column 34pt wide with 9pt bold text — visually absent at arm's length. (§7.5 — row-level accent + tint)
7. Legend at column footer uses `" B = " + $R{report.belowNormal} + "  E = ..."` concatenation — two lines of cryptic codes. (§7.6 — five labeled legend items)
8. Person group footer uses equal-width left and right cells bordered on all sides with 0.5pt pens — reads as a spreadsheet. (§7.7 — typographic sign-off block)
9. Corrected-report banner is plain centered bold 13pt text — no color. (§7.1 — colored bar)
10. Page-2+ frame at y=15 puts the "Prescriber" label and value at the same row as the "Referring site" label and value — duplicating the prescriber entry already rendered on page 1, and using the same `$F{contactInfo}` field in two semantically different positions. Current behavior is preserved but flagged as Q1 for stakeholder review.

---

**End of spec.**
