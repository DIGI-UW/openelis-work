# Mapping Library — reusable, verified fragments

> Start here before writing a new spec. Reuse a verified fragment instead of re-deriving it.
> Organized by what's reusable: **value maps** (qualitative results), **QC conventions**,
> **abnormal flags**, **transforms**, and **per-instrument field maps**.
>
> **Scope:** this library holds **mappings only** — field positions, value translations, QC
> rules, transforms. It does **not** hold implementation direction (no adapter/code guidance);
> specs describe the mapping, not how to build it.
>
> **Trust discipline:** every fragment carries a confidence rating and a source. `VALIDATED`
> = confirmed in production; `HIGH` = from a vendor LIS manual; `ILLUSTRATIVE` = plausible
> shape pending vendor confirmation — **never paste an ILLUSTRATIVE field position into a
> spec as fact.** When you confirm a fragment against a real manual or a captured message,
> upgrade its rating and note the source here so the next spec inherits the verified version.

---

## 1. Qualitative value maps (reusable across instruments)

Analyzer value → OpenELIS result option. The OpenELIS targets must be result options that
exist on the matched catalog test (per the Analyzer Types & Mapping FRS) — confirm per lab.

### Molecular / infectious-disease (e.g. GeneXpert, qualitative PCR)
| Analyzer value | OpenELIS result | Confidence | Source |
|---|---|---|---|
| `DETECTED` | Positive | HIGH | common GeneXpert convention |
| `NOT DETECTED` | Negative | HIGH | common GeneXpert convention |
| `INDETERMINATE` | Indeterminate | HIGH | — |
| `INVALID` | Invalid | HIGH | failed run |
| `ERROR` / `NO RESULT` | Error | HIGH | instrument error |
| `MTB DETECTED` / `MTB NOT DETECTED` | Positive / Negative | HIGH | GeneXpert MTB/RIF |
| `RIF RESISTANCE DETECTED` | Resistant | HIGH | GeneXpert RIF channel |
| `RIF RESISTANCE NOT DETECTED` | Susceptible | HIGH | — |

### Serology / rapid (reactive scale)
| Analyzer value | OpenELIS result | Confidence |
|---|---|---|
| `REACTIVE` / `R` | Reactive | HIGH |
| `NON-REACTIVE` / `NR` | Non-reactive | HIGH |
| `EQUIVOCAL` / `GRAY ZONE` | Equivocal | HIGH |

> When a value isn't here, follow the FRS learn-from-traffic rule (flag for review, never
> drop) — don't silently invent a mapping.

---

## 2. QC identification conventions (reusable OR-logic rules)

Any rule match = QC sample. Combine with the lab's local convention.

| Rule type | Field (ASTM / HL7 / CSV) | Value / pattern | Source / note |
|---|---|---|---|
| specimenIdPrefix | O.3 / OBR-3 / SampleID | `QC-` | common lab convention |
| specimenIdPrefix | O.3 / OBR-3 / SampleID | `CTRL-` | Bio-Rad Liquichek |
| specimenIdPrefix | O.3 / OBR-3 / SampleID | `CAL-` | calibrator runs |
| fieldEquals | O.16 / OBR-16 / SampleType | `QC` | instrument-set descriptor |
| specimenIdRegex | O.3 / OBR-3 / SampleID | `^(QC\|CTRL\|CAL).*` | catch-all |

---

## 3. Abnormal flag map (standard ASTM/HL7 — reuse verbatim)
| Flag | OpenELIS |
|---|---|
| H / L | HIGH / LOW |
| HH / LL | CRITICAL_HIGH / CRITICAL_LOW |
| N | NORMAL |
| A | ABNORMAL |
| `>` / `<` | GREATER_THAN / LESS_THAN (beyond reporting limit) |
| `*` | SUSPECT_FLAG |

---

## 4. Transform catalog (names used in specs)
| Transform | Meaning | Typical use |
|---|---|---|
| `PASSTHROUGH` | value used as-is | numeric chemistry/hematology |
| `VALUE_MAP` | analyzer value → OpenELIS value | qualitative (section 1) |
| `GREATER_LESS_FLAG` | strip/interpret `>`/`<` | results beyond reporting limit |
| `THRESHOLD_CLASSIFY` | numeric → band | e.g. confidence score → HIGH/LOW/NO ID |
| `CODED_LOOKUP` | code → master-list entry | organism ID → organism master |
| `SCALE` | multiply/divide | ratio 0–1.0 → percent 0–100 (see §5) |
| `DATETIME_PARSE` | parse to standard datetime | locale-dependent formats |

---

## 5. Known unit/locale gotchas (reusable warnings)
- **Finecare-style ratios:** instrument reports 0.0–1.0; OpenELIS expects 0–100% → `SCALE` ×100. Document the expected range at output and at import.
- **French-locale CSV (Madagascar et al.):** delimiter `;`, decimal separator `,`, dates `DD/MM/YYYY`, headers may be French, encoding often Latin-1 not UTF-8.
- **Encoding:** always state ASCII / Latin-1 / Windows-1252 / UTF-8 explicitly — never assume UTF-8.

---

## 6. Per-instrument field maps (grows over time)

> Seeded sparsely on purpose. Add a block when a spec is **VALIDATED** or built from a vendor
> manual, with the source. Treat `ILLUSTRATIVE` shapes as starting points to verify, not facts.

### Mindray BC-series (hematology) — HL7 v2.3.1 / MLLP
- Protocol: HL7 v2.3.1 over MLLP; OpenELIS role SERVER. Ports seen: **9100** (BC-5380), **9101** (BS-series chem) — *verify per install*.
- Results: numeric via OBX (NM); test codes in OBX-3 as `^^^CODE`. Standard abnormal flags (§3).
- Confidence: ILLUSTRATIVE for exact field positions/ports — confirm against the BC-5380 LIS manual.

### Cepheid GeneXpert — dual-mode (ASTM + HL7)
- Dual-mode: ASTM real-time and/or HL7; each mode is its own spec section + Jira story.
- Qualitative results → use the molecular value map (§1). Live code set varies by enabled assays (sites enable/disable) → expect codes the profile didn't predict; rely on learn-from-traffic.
- Confidence: HIGH for the value-map shape; ILLUSTRATIVE for field positions — confirm per assay/firmware.

### Thermo Indiko / Indiko Plus (clinical chemistry) — ASTM LIS2-A2
- Protocol: ASTM LIS2-A2; H/P/O/R/L records; numeric chemistry, `PASSTHROUGH`.
- Confidence: ILLUSTRATIVE — confirm field positions against the Indiko LIS interface manual.

---

## Maintenance
When a spec is validated in production, promote its fragments here with `VALIDATED` + source.
Cross-check new instruments against the openelis-design **spec-registry** so a duplicate
integration isn't specced from scratch.
