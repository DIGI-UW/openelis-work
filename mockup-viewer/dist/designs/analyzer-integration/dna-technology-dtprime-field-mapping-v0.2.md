# DNA Technology DT-Prime Field Mapping & Integration Specification

**Target Instrument:** DNA Technology DT-Prime (Real-Time PCR System)
**Manufacturer:** DNA Technology (Россия / Russia)
**OpenELIS Module:** PCR Analyzer XML Interface
**Version:** 0.2 (Draft — Results XML Validated)
**Date:** 2026-03-06
**Validated Against:**
- XML layout file: `Resultat DT-Prime-b63fc742.xml` — plate layout structure confirmed
- XML results file: `0-1c058892.xml` — full results schema confirmed (qualitative calls, `<test>/<result>` structure)
- Manual sections 5.3.3–5.3.4 (DNA Technology DT-Prime Operation Manual II)

---

## Validation Status

### Results XML schema confirmed — remaining unknowns are edge-case / multi-assay

- Interface type: **File-based XML export** (not TCP/IP ASTM)
- The DT-Prime does **not** push results to LIS over a network connection
- Operator manually triggers export via **"Exporting results as XML"** button in Archive → Data Analysis tab
- Resulting XML file is transferred to LIS (OpenELIS) via shared folder, manual upload, or file watcher
- Encoding: **windows-1251** (Cyrillic) — parser **must** handle this encoding explicitly

### Confirmed from both XML files

- Root element: `<package>`
- Protocol reference element: `<RealTime_PCR ProtocolPath="..."/>`
- Plate/cell structure: `<data><plate id="N"><cell x y name state>`
- Result structure per cell: `<test id="{assay_id}" value="{+|-}"><result name="qualitative" value="{+|-}"/></test>`
- **DT-Master interprets Ct thresholds internally** — exported XML contains final qualitative calls only (`"+"` / `"-"`), not raw Ct numeric values
- Result call vocabulary: `"+"` (detected/positive) and `"-"` (not detected/negative)
- Sample naming convention: accession number + optional replicate suffix (`A`, `B`)
- Controls: `C-` (negative), `C+` (positive)
- Protocol file extension: `.r96`
- Discordant replicate pair confirmed real-world example: one sample had A=`"+"`, B=`"-"` — hold-for-review logic validated

### Remaining unknowns (edge case / multi-assay)

- **Additional `state` values** on `<cell>` — only `"complete"` observed; values for `error`, `empty`, `cancelled` not confirmed
- **Multi-target assay structure** — whether multi-target kits produce multiple `<test>` elements per `<cell>`, or multiple `<result>` elements per `<test>`, not confirmed (single-target run only observed)
- **Quantitative assay output** — whether quant assays add a `<result name="ct" value="..."/>` child (numeric Ct) alongside `<result name="qualitative">` — not confirmed
- **Operator / timestamp / instrument serial fields** — not present in any observed XML; may not be exported at all
- **Additional control naming conventions** for other assay kits — only `C-`/`C+` confirmed

---

## 1. Communication Protocol

### 1.1 Interface Type: File-Based XML

The DT-Prime does **not** implement TCP/IP or serial ASTM communication. All LIS data transfer is file-based.

| Property | Value |
|----------|-------|
| Export trigger | Manual button: "Exporting results as XML" (Archive → Data Analysis tab) |
| Output format | XML, encoding windows-1251 |
| Transport | Shared folder, USB, or file watcher integration |
| Protocol file format | `.r96` (DT-Prime proprietary run file) |
| Secondary export formats | Excel (.xls/.xlsx), clipboard copy |

### 1.2 File Watcher Recommendation

OpenELIS should monitor a designated drop folder for new `.xml` files matching the DT-Prime naming pattern. On detection, the parser should:

1. Validate encoding (windows-1251)
2. Validate root element (`<package>`)
3. Check for presence of `<RealTime_PCR>` element
4. Parse plate and cell data
5. Move processed file to archive subfolder; move failed files to error subfolder

### 1.3 Naming Convention

Observed output filename pattern: `Resultat DT-Prime-[hash].xml`

> **[NEEDS VALIDATION]** — Confirm whether the filename is configurable or system-generated, and whether the naming pattern is consistent across all DT-Master software versions.

---

## 2. XML Record Structure

### 2.1 Root Element

```xml
<?xml version="1.0" encoding="windows-1251" standalone="yes"?>
<package>
  ...
</package>
```

| Field | XPath | Value | Notes |
|-------|-------|-------|-------|
| XML version | `xml/@version` | `1.0` | Always |
| Encoding | `xml/@encoding` | `windows-1251` | **Must decode before parsing** |
| Root | `/package` | — | Always `package` |

### 2.2 Protocol Reference Element

```xml
<RealTime_PCR ProtocolPath="C:\Users\user\Desktop\LA2M-[ASSAY]_Vector\[ASSAY] 06 03 2026 SERIE01.r96"/>
```

| Field | XPath | Example Value | Notes |
|-------|-------|---------------|-------|
| Protocol path | `/package/RealTime_PCR/@ProtocolPath` | `C:\Users\...\[ASSAY] 06 03 2026 SERIE01.r96` | Full Windows path to `.r96` run file |
| Assay name | Derived from filename | `[ASSAY]` | Extract from filename before date segment |
| Run date | Derived from filename | `06 03 2026` | **Format is user-defined** — see note below |
| Series/run ID | Derived from filename | `SERIE01` | Series number within date; spacing varies |

**⚠️ Date format warning:** The protocol file is named manually by the operator. Two formats have been observed across two real output files:
- `02 23 2026 SERIE 01` — consistent with `MM DD YYYY` (February 23)
- `06 03 2026 SERIE01` — consistent with `DD MM YYYY` (March 6, today's date at time of export)

**Parser recommendation:** Extract the date string as-is and store it as `run_date_raw` (advisory metadata only). Do not attempt to parse or normalize it into a canonical date — the format is not reliably standardized. Use file creation timestamp or import timestamp as the authoritative run date for OpenELIS.

**Parser note:** The protocol path is a Windows filesystem path. Extract the filename component only. Do not attempt to resolve the path. Use the assay name segment for assay-to-test-code mapping.

> **[NEEDS VALIDATION]** — Confirm whether additional metadata (operator, instrument serial, reaction volume) appears as attributes on `<RealTime_PCR>` or as sibling elements in other run types. No such fields were observed in the two validated XML files.

### 2.3 Data / Plate Element

```xml
<data>
  <plate id="0">
    <cell x="6" y="1" name="C-" state="complete"> ... </cell>
    <cell x="6" y="2" name="tst0305002A" state="complete"> ... </cell>
    ...
  </plate>
</data>
```

| Field | XPath | Example | Notes |
|-------|-------|---------|-------|
| Plate ID | `/package/data/plate/@id` | `0` | Zero-indexed; most runs use single plate `id=0` |
| Cell column | `cell/@x` | `6` | 1-indexed column in thermal block matrix |
| Cell row | `cell/@y` | `2` | 1-indexed row in thermal block matrix |
| Sample name | `cell/@name` | `tst0305002A` | Sample/control identifier (see Section 3) |
| State | `cell/@state` | `complete` | Run state for this well |

**Confirmed state values:**

| State | Meaning |
|-------|---------|
| `complete` | Analysis finished successfully |
| `[NEEDS VALIDATION]` | Additional states (e.g., `error`, `empty`, `cancelled`) not yet confirmed from XML |

### 2.4 Result Data (Per Cell) — CONFIRMED

**Confirmed structure (from validated results XML):**

```xml
<cell x="6" y="2" name="tst0305002A" state="complete">
  <test id="[ASSAY_ID]" value="+">
    <result name="qualitative" value="+"/>
  </test>
</cell>
```

| Field | XPath (relative to `<cell>`) | Example | Notes |
|-------|------------------------------|---------|-------|
| Assay test ID | `test/@id` | `[ASSAY_ID]` | Assay/kit identifier string; maps to OpenELIS test code |
| Result call | `test/@value` | `+` or `-` | Final qualitative call — instrument-interpreted |
| Result type | `test/result/@name` | `qualitative` | Observed value: `"qualitative"` |
| Result value | `test/result/@value` | `+` or `-` | Same as `test/@value` in qualitative assays |

**Result call vocabulary (confirmed):**

| XML Value | Meaning | OpenELIS Result |
|-----------|---------|----------------|
| `+` | Target detected (Ct ≤ threshold) | `Detected` |
| `-` | Target not detected (Ct > threshold or no amplification) | `Not Detected` |

> **Important:** DT-Master performs all Ct-threshold comparison internally before export. The XML does **not** contain raw Ct numeric values. The `"+"` / `"-"` calls are the instrument's final interpreted result.

**Multi-target assay structure (not yet confirmed):**

For assays with multiple targets or an internal control channel, the structure is expected to include multiple `<test>` or `<result>` elements per `<cell>`. The confirmed structure above is from a single-target run. Until confirmed:
- Treat the first `<test>` element's `value` as the primary result
- If multiple `<test>` elements exist per `<cell>`, map each by `test/@id` to its OpenELIS test code
- If multiple `<result>` elements exist within one `<test>`, map by `result/@name`

> **[NEEDS VALIDATION]** — Multi-target assay XML structure (IC + primary target, or multi-pathogen panels). Also confirm whether quantitative assays add `<result name="ct" value="28.45"/>` as a sibling `<result>` element.

---

## 3. Sample Classification

### 3.1 Sample Name Patterns

| Pattern | Example | Classification |
|---------|---------|----------------|
| Accession + replicate suffix `A` | `tst0305002A` | Patient sample — replicate A |
| Accession + replicate suffix `B` | `tst0305002B` | Patient sample — replicate B |
| Accession only (no suffix) | `tst0305004` | Patient sample — singleton |
| `C-` | `C-` | Negative control |
| `C+` | `C+` | Positive control |
| `[NEEDS VALIDATION]` | — | Other control types (calibrator, standard) not yet observed |

### 3.2 Replicate Handling

When a sample appears with both `A` and `B` suffixes (e.g., `tst0305002A` and `tst0305002B`), these represent duplicate wells for the same accession. The parser must:

1. Group cells by base accession (strip trailing `A` or `B`)
2. Compare the `test/@value` calls across replicate pair
3. Apply concordance logic per table below
4. Report the consensus result to OpenELIS

**Concordance logic:**

| A call | B call | Consensus | Action |
|--------|--------|-----------|--------|
| `+` | `+` | `+` (Detected) | Auto-report |
| `-` | `-` | `-` (Not Detected) | Auto-report |
| `+` | `-` | Discordant | Hold for manual review — do not auto-report |
| `-` | `+` | Discordant | Hold for manual review — do not auto-report |

> **Real-world validation:** The validated results file (`0-1c058892.xml`) contains a confirmed discordant pair: one sample `A = "+"`, `B = "-"`. The hold-for-review path is confirmed as a real scenario.

> **Note:** Since no Ct values are exported, delta-Ct concordance checking is not applicable. Discordant determination is purely `"+"` vs `"-"`.

> **[NEEDS VALIDATION]** — Confirm whether the instrument software itself flags discordant replicates before export, or whether the LIS is solely responsible for replicate reconciliation.

### 3.3 Control Routing

| Sample Name | Router Behavior |
|-------------|----------------|
| `C-` | Route to QC module; do not create patient result |
| `C+` | Route to QC module; do not create patient result |
| All others | Route to patient result import |

**Run validity check:** Before importing any patient results, verify:
- At least one `C-` present with `test/@value = "-"`
- At least one `C+` present with `test/@value = "+"`

If either control fails, flag the entire run for manual review and hold all patient results.

> **[NEEDS VALIDATION]** — Control naming conventions for other assay kits not confirmed. Only `C-` and `C+` observed.

---

## 4. Test Code Mapping

### 4.1 Assay Identification

The assay identifier is extracted from two sources in the XML:

1. `<RealTime_PCR ProtocolPath="...">` — the `.r96` filename contains the assay name as the leading segment before the date
2. `<test id="...">` — each result cell's `<test>` element carries the assay/kit identifier string

Both should be used for test code mapping. If they conflict, `test/@id` takes precedence (it is the software-assigned kit identifier).

### 4.2 Observed Assay — Qualitative PCR (generic)

The specific assay observed in the validated file uses a single-target qualitative PCR kit. The table below uses generic placeholders; a real deployment mapping must be filled in per kit.

| Field | XML Source | Example | Notes |
|-------|-----------|---------|-------|
| Test identifier | `test/@id` | `[ASSAY_ID]` | Kit-specific string; maps to OpenELIS test |
| Result type | `test/result/@name` | `qualitative` | Confirm `"quantitative"` for quant assays |
| Result call | `test/@value` | `+` / `-` | Instrument-interpreted; map to Detected/Not Detected |
| LOINC code | External mapping table | `[TBD per assay]` | Assign per kit insert |
| OpenELIS test ID | Configuration | `PCR_[ASSAY]` | Define per site configuration |

### 4.3 Result Call Mapping (Confirmed)

| XML `test/@value` | OpenELIS Result | Abnormal Flag | Notes |
|-------------------|----------------|--------------|-------|
| `+` | `Detected` | `A` (abnormal) | Target amplified within threshold |
| `-` | `Not Detected` | `N` (normal) | No amplification or above threshold |
| _(discordant replicate)_ | `Indeterminate` | `I` | LIS-generated after replicate comparison |
| _(control failure)_ | `Invalid` | `E` (error) | LIS-generated if run controls fail |

> **[NEEDS VALIDATION]** — Confirm whether the instrument ever exports an `Invalid` or `Undetermined` call directly in `test/@value` (e.g., for IC failures on multi-channel assays). Only `+` and `-` have been observed in the validated file.

---

## 5. Result Interpretation Logic

```
STEP 1: Validate run controls
  Find cell where name = "C-"
  IF C- test/@value != "-":
    → Flag entire run as CONTROL_FAILURE
    → Hold ALL patient results for manual review
    → Do not auto-import

  Find cell where name = "C+"
  IF C+ test/@value != "+":
    → Flag entire run as CONTROL_FAILURE
    → Hold ALL patient results for manual review
    → Do not auto-import

STEP 2: Group samples by base accession
  FOR each cell where name NOT IN ["C-", "C+"]:
    Strip trailing "A" or "B" suffix → base_accession
    Group into replicate pairs or singletons

STEP 3: Determine per-sample result
  IF singleton (no A/B partner):
    result = cell test/@value

  IF replicate pair (both A and B present):
    IF A = "+" AND B = "+":  result = "+" (concordant positive)
    IF A = "-" AND B = "-":  result = "-" (concordant negative)
    IF A != B:               result = DISCORDANT → hold for review

STEP 4: Map result to OpenELIS vocabulary
  "+"          → "Detected"       (flag: Abnormal)
  "-"          → "Not Detected"   (flag: Normal)
  DISCORDANT   → "Indeterminate"  (flag: Review)
  CONTROL_FAIL → "Invalid"        (flag: Error)

STEP 5: Post result to OpenELIS
  FOR each result:
    → Match base_accession to OpenELIS order
    → Map test/@id to OpenELIS test code via assay_mappings config
    → Create result: accession, test_id, result_call, run_id, run_date_raw, assay_id
    → If accession not found: flag "Unmatched Accession" in import preview
```

> **Ct values:** Raw Ct numeric values are **not exported** in the DT-Prime XML. DT-Master applies threshold comparisons internally. If Ct values are required for audit or clinical record purposes, they must be obtained from a separate DT-Master report export (e.g., Excel/PDF) outside the LIS import workflow.

---

## 6. Parser Configuration Schema

```json
{
  "analyzer_name": "DNA-Technology-DT-Prime",
  "instrument_type": "real_time_pcr",
  "manufacturer": "DNA Technology",

  "file_interface": {
    "encoding": "windows-1251",
    "root_element": "package",
    "protocol_element": "RealTime_PCR",
    "protocol_path_attribute": "ProtocolPath",
    "plate_element": "plate",
    "cell_element": "cell",
    "file_pattern": "Resultat DT-Prime*.xml"
  },

  "cell_attributes": {
    "column": "x",
    "row": "y",
    "sample_name": "name",
    "state": "state"
  },

  "result_element": {
    "parent": "test",
    "assay_id_attribute": "id",
    "call_attribute": "value",
    "result_child_element": "result",
    "result_type_attribute": "name",
    "result_value_attribute": "value"
  },

  "protocol_path": {
    "extract_filename_only": true,
    "date_format": "USER_DEFINED",
    "date_format_note": "Not standardized — store raw date string as advisory metadata only",
    "assay_name_position": "leading_segment_before_date"
  },

  "sample_classification": {
    "negative_control_names": ["C-"],
    "positive_control_names": ["C+"],
    "replicate_suffixes": ["A", "B"]
  },

  "replicate_handling": {
    "enabled": true,
    "concordance_method": "call_match",
    "note": "No Ct values in export — concordance is purely + vs - call comparison",
    "discordant_action": "hold_for_review",
    "discordant_result": "Indeterminate"
  },

  "run_validity": {
    "require_negative_control": true,
    "require_positive_control": true,
    "hold_on_control_failure": true
  },

  "result_call_mapping": {
    "+":          {"openelis_result": "Detected",       "flag": "A"},
    "-":          {"openelis_result": "Not Detected",   "flag": "N"},
    "DISCORDANT": {"openelis_result": "Indeterminate",  "flag": "I"},
    "INVALID":    {"openelis_result": "Invalid",        "flag": "E"}
  },

  "assay_mappings": {
    "_comment": "Populate per deployment. Key is assay name segment from ProtocolPath filename.",
    "EXAMPLE_ASSAY": {
      "display_name": "[Kit Display Name]",
      "test_id_from_xml": "[test/@id value from instrument]",
      "openelis_test_id": "PCR_[ASSAY]",
      "loinc": "[TBD per kit insert]",
      "result_type": "qualitative"
    }
  }
}
```

---

## 7. Error Handling

| Scenario | Parser Behavior |
|----------|----------------|
| File encoding not windows-1251 | Log warning; attempt UTF-8 fallback; flag file for review |
| Root element not `<package>` | Reject file; log parse error; move to error folder |
| `<RealTime_PCR>` element absent | Reject file; log "not a DT-Prime results file" |
| `<cell>` has no `<test>` child | Accept cell as layout-only; log warning; flag result as incomplete |
| Protocol path unparseable | Accept file; log warning; set assay_name = UNKNOWN |
| Negative control `test/@value != "-"` | Hold entire run; alert operator; do not import |
| Positive control `test/@value != "+"` | Hold entire run; alert operator; do not import |
| Discordant replicate pair | Hold sample; report as Indeterminate; flag for review |
| `test/@id` not in assay_mappings config | Flag "Unmapped Assay" in import preview; do not auto-import |
| Accession not found in OpenELIS | Flag "Unmatched Accession"; hold result; include in preview |
| Duplicate accession in same file | Accept both; flag duplicates for review |
| File already processed (duplicate import) | Reject; log "duplicate file" with checksum |
| `cell/@state` value other than `"complete"` | Log state value; treat as incomplete; do not import result |

---

## 8. Localization Tags

| Context | Tag | Default (English) |
|---------|-----|-------------------|
| Detected | `label.result.detected` | Detected |
| Not detected | `label.result.notDetected` | Not Detected |
| Invalid | `label.result.invalid` | Invalid — Repeat Required |
| Indeterminate | `label.result.indeterminate` | Indeterminate — Repeat Recommended |
| Control failure | `label.run.controlFailure` | Run Held — Control Failure |
| Discordant replicates | `label.result.discordantReplicates` | Discordant Replicates — Manual Review Required |
| Unknown assay | `label.error.unknownAssay` | Unmapped Assay |
| Unmatched accession | `label.error.unmatchedAccession` | Accession Not Found in OpenELIS |
| Parse error | `label.error.parseError` | File Parse Error |

---

## 9. OpenELIS Integration Notes

- The DT-Prime is a **unidirectional** interface — it sends results only; it does not query OpenELIS for orders
- Accession numbers must exist in OpenELIS before results are imported; unmatched accessions are flagged in the import preview
- The PCR result type in OpenELIS should be configured as **qualitative** (Detected / Not Detected / Indeterminate / Invalid)
- **Ct values are not available** in the XML export — they are computed and consumed internally by DT-Master. If Ct values are required for the OpenELIS result record, a separate DT-Master Excel/PDF report workflow is needed outside of the automated XML import
- Run metadata (assay name from ProtocolPath, raw date string, series number) should be stored in the OpenELIS result note or audit log field
- The `test/@id` attribute is the machine-assigned assay identifier and should be used as the primary key for assay-to-test-code mapping, not the ProtocolPath filename

---

## 10. Validation Checklist

### Confirmed ✅

- [x] Root element `<package>` and `<RealTime_PCR ProtocolPath>` structure
- [x] Plate/cell structure: `<data><plate id><cell x y name state>`
- [x] Full result schema per cell: `<test id value><result name value>`
- [x] Result call vocabulary: `"+"` and `"-"` (not "Positive"/"Negative")
- [x] No Ct values in XML export — instrument-interpreted qualitative calls only
- [x] Sample naming: accession + optional A/B replicate suffix
- [x] Control names: `C-` and `C+`
- [x] Discordant replicate scenario (A=`+`, B=`-`) confirmed in real data
- [x] Protocol filename format is user-defined (not standardized)

### Pending — edge case / multi-assay

- [ ] `cell/@state` values beyond `"complete"` (e.g., `error`, `empty`)
- [ ] Multi-target assay XML structure (multiple `<test>` per `<cell>`, or multiple `<result>` per `<test>`)
- [ ] Quantitative assay — does it add `<result name="ct" value="..."/>` alongside qualitative?
- [ ] Instrument-generated `Invalid` or `Undetermined` in `test/@value` (IC failure case)
- [ ] Operator / timestamp / instrument serial fields (not present in any observed XML)
- [ ] Control naming conventions for other assay kits
- [ ] LOINC codes — assigned per kit, not confirmed generically
- [ ] Confirm file naming pattern is stable across DT-Master software versions

---

## 11. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-06 | Initial draft. Plate layout XML structure confirmed from `Resultat DT-Prime-b63fc742.xml`. Protocol/filename parsing from Operation Manual II sections 5.3.3–5.3.4. Full results XML schema, Ct field names, channel names, and result call vocabulary all pending validation. |
| 0.2 | 2026-03-06 | Results XML schema confirmed from `0-1c058892.xml`. Key findings: (1) DT-Master interprets Ct internally — no Ct values in XML export; (2) result structure is `<test id value><result name value>` not `<result channel ct>`; (3) result call vocabulary is `"+"` / `"-"` not "Positive"/"Negative"; (4) discordant replicate pair confirmed in real data; (5) ProtocolPath date format is user-defined and not standardized. Parser config JSON updated. Validation checklist updated with confirmed items. |
