# Multi-component mapping (analyzer connection specs)

## Multi-component mapping

Most tests produce one result and map **one analyzer result identifier → one OpenELIS test**. Some
assays produce several values at once — a multiplex molecular panel reports an overall call plus a value
(Ct/Cq) per **target gene / probe / fluorophore channel**. OpenELIS models those extra values as
**result components** (`test_result_component`) on a single test. When you author a mapping for such an
analyzer, map each reported target to a **component**, not a separate test.

### 1. First decide: separate tests, or one multi-component test?
Per assay, with the deployment:
- **One multi-component test (preferred for a true panel):** the overall call is the PRIMARY component;
  each target is its own component (numeric with unit "Ct"/"Cq", or qualitative). The whole panel is one
  analysis on one test.
- **Separate tests (legacy / when the lab already models them that way):** each target maps to its own
  test, as today. Still valid — do **not** silently merge existing separate tests into a multi-component
  test; that's a deliberate remodeling decision, not a mapping change.

State the choice explicitly in the connection spec's mapping section.

### 2. Map each target to a component by a STABLE code
- Resolution is two-step: **resolve the test first** (LOINC interlingua / `analyzer_test_map`), then the
  **component within that test**.
- Match the incoming target on a **stable code** — the component `code` (or its optional LOINC where the
  target is LOINC-coded). **Never** match on a translated / display label.
- If a mapping specifies no component, the value resolves to the test's **PRIMARY** component (today's
  behavior) — single-result analyzers need no change.

### 3. Multiplex data shape
- Instruments emit one row/record per target/channel (e.g. BioRad CFX Opus: one row per fluorophore per
  well; GeneXpert: per-probe). **Group by sample/well**, then map each row to its component.
- Numeric Ct/Cq is the component value; a **blank/absent Ct/Cq = no amplification / negative** for that
  channel. Qualitative calls map to dictionary/qualitative components.

### 4. Internal controls (yes) vs the QC program (no)
- An assay's **instrument-reported internal control** (GeneXpert SPC/PCC, a qPCR IPC / endogenous-control
  channel) **may be a component** — typically `show_on_report = false`. Map it like any other target.
- The **QC program** — control materials / QC samples, Levey-Jennings, Westgard, control lots, expected
  value + SD/uncertainty, pass/fail — is **not** a result component. Keep it in the QC domain. Rule of
  thumb: *components are result sub-values of the patient test; QC-material data lives in QC.*

### 5. Unmapped targets & backward compatibility
- A target the analyzer reports that has **no matching component** (on a test configured for component
  mapping) must surface as a **visible unmapped-result exception** (import error dashboard) — never
  silently dropped.
- Existing test-level flows are unchanged for single-component tests; do not re-point existing
  `analyzer_test_map` rows.

### Spec-authoring checklist (add to the connection-spec template)
- [ ] Is the assay multiplex? If so, one multi-component test or separate tests — decision recorded?
- [ ] Each target/channel mapped to a component `code` (or LOINC), not a label?
- [ ] Internal control(s) mapped as components (report-visibility set)?
- [ ] QC-program data kept out of components?
- [ ] Unmapped-target behavior stated?
- [ ] Blank-Ct / no-amplification handling stated?
