// Route: /MasterListsPage/TestCatalogList  and  /MasterListsPage/TestCatalogEditor/<id|new>/<section>
// SideNav: Admin → Test Catalog Management
// Test Catalog Editor — Completion & Correction (dev handoff mockup).
// Version-agnostic: shows the full feature. The dev slices the work (see breakdown guide).
// Grounded in the shipped TestCatalogList.jsx + Basic Info editor + docs screenshots.
import React, { useState } from "react";
import {
  Grid, Column, Section, Heading, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableSelectRow, TableSelectAll, TableToolbar,
  TableToolbarContent, TableToolbarSearch, TableBatchActions, TableBatchAction,
  Dropdown, ComboBox, Search, Pagination, Tag, Button, IconButton,
  TextInput, TextArea, NumberInput, RadioButtonGroup, RadioButton, Toggle,
  Accordion, AccordionItem, InlineNotification, Tile, Breadcrumb, BreadcrumbItem,
  SideNav, SideNavItems, SideNavLink, SideNavMenu, SideNavMenuItem,
} from "@carbon/react";
import { Add, TrashCan, ChevronUp, ChevronDown, Draggable, Edit } from "@carbon/icons-react";

const t = (key, fallback) => fallback || key;

// ---- Mock data (realistic, grounded) --------------------------------------
const ROWS = [
  { testId: 15, name: "Hemoglobin", sample: "Whole Blood", code: "Hemoglobin-Blood", domain: "CLINICAL", loinc: "718-7", active: true },
  { testId: 61, name: "Hemoglobin", sample: "Venous Blood", code: "Hemoglobin-Venous", domain: "CLINICAL", loinc: "30313-1", active: true },
  { testId: 62, name: "Hemoglobin", sample: "Capillary Blood", code: "Hemoglobin-Cap", domain: "CLINICAL", loinc: "718-7", active: true },
  { testId: 63, name: "Hemoglobin", sample: "Arterial Blood", code: "Hemoglobin-Art", domain: "CLINICAL", loinc: "", active: false },
  { testId: 70, name: "COVID-19 PCR", sample: "Sputum", code: "COVIDPCR", domain: "CLINICAL", loinc: "94500-6", active: true },
  { testId: 71, name: "Culture — Blood", sample: "Whole Blood", code: "CULT-BLD", domain: "CLINICAL", loinc: "600-7", active: true, amr: true },
];
const DOMAIN_OPTS = [{ id: "", label: "All domains" }, { id: "CLINICAL", label: "Clinical" }, { id: "ENVIRONMENTAL", label: "Environmental" }, { id: "VECTOR", label: "Vector" }];
const STATUS_OPTS = [{ id: "all", label: "All statuses" }, { id: "active", label: "Active" }, { id: "inactive", label: "Inactive" }];
const AMR_OPTS = [{ id: "", label: "Any" }, { id: "true", label: "AMR only" }, { id: "false", label: "Non-AMR" }];
const SAMPLE_TYPES = ["Whole Blood", "Venous Blood", "Capillary Blood", "Serum", "Sputum", "Urine", "Water"];

// ===========================================================================
// Catalog list — adds New test (FR-1), row selection + Edit related (FR-6),
// Sample type column (FR-39), collapsible filters w/ typeahead sample type (FR-40).
// ===========================================================================
function CatalogList({ onNew, onOpen, onEditRelated }) {
  const headers = [
    { key: "name", header: t("label.testCatalog.basicInfo.name", "Name") },
    { key: "sample", header: t("label.testCatalog.list.col.sampleType", "Sample type") },
    { key: "code", header: t("label.testCatalog.basicInfo.code", "Code") },
    { key: "loinc", header: "LOINC" },
    { key: "domain", header: t("label.testCatalog.basicInfo.domain", "Domain") },
    { key: "status", header: t("label.testCatalog.list.col.status", "Status") },
  ];
  return (
    <Grid fullWidth>
      <Column lg={16}><Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t("home.label", "Home")}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t("breadcrums.admin.managment", "Admin Management")}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t("label.testCatalog.list", "Test Catalog")}</BreadcrumbItem>
      </Breadcrumb></Column>
      <Column lg={16}><Section><Heading>{t("label.testCatalog.list", "Test Catalog")}</Heading></Section></Column>

      {/* Filters row — New test sits at the LEFT, before Domain (FR-1) */}
      <Column lg={16}>
        <Stack orientation="horizontal" gap={5} style={{ alignItems: "flex-end", margin: "1rem 0", flexWrap: "wrap" }}>
          <Button renderIcon={Add} onClick={onNew}>{t("button.testCatalog.newTest", "New test")}</Button>
          <Dropdown id="f-domain" titleText={t("label.testCatalog.basicInfo.domain", "Domain")} label="" items={DOMAIN_OPTS} itemToString={(i) => (i ? i.label : "")} initialSelectedItem={DOMAIN_OPTS[0]} />
          <Dropdown id="f-status" titleText={t("label.testCatalog.list.col.status", "Status")} label="" items={STATUS_OPTS} itemToString={(i) => (i ? i.label : "")} initialSelectedItem={STATUS_OPTS[0]} />
          <Dropdown id="f-amr" titleText={t("label.testCatalog.list.filter.amr", "AMR")} label="" items={AMR_OPTS} itemToString={(i) => (i ? i.label : "")} initialSelectedItem={AMR_OPTS[0]} />
          {/* Sample type is a long list → typeahead ComboBox, not a static Dropdown (FR-40) */}
          <ComboBox id="f-sampletype" titleText={t("label.testCatalog.list.filter.sampleType", "Sample type")} placeholder={t("label.filter", "Filter…")} items={SAMPLE_TYPES} itemToString={(i) => i || ""} />
        </Stack>
      </Column>

      <Column lg={16}>
        <DataTable rows={ROWS.map((r) => ({ ...r, id: String(r.testId) }))} headers={headers}>
          {({ rows, headers: hdrs, getHeaderProps, getRowProps, getSelectionProps, getBatchActionProps, selectedRows, getTableProps, getToolbarProps }) => (
            <TableContainer>
              <TableToolbar {...getToolbarProps()}>
                <TableBatchActions {...getBatchActionProps()}>
                  <TableBatchAction renderIcon={Edit} onClick={() => onEditRelated(selectedRows)}>
                    {t("button.testCatalog.editRelated", "Edit related tests together")}
                  </TableBatchAction>
                </TableBatchActions>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder={t("label.testCatalog.list.search", "Search by name or code")} onChange={() => {}} />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    <TableSelectAll {...getSelectionProps()} />
                    {hdrs.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const src = ROWS.find((r) => String(r.testId) === row.id);
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })} onClick={() => onOpen(src)} style={{ cursor: "pointer" }}>
                        <TableSelectRow {...getSelectionProps({ row })} onClick={(e) => e.stopPropagation()} />
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === "domain" ? <Tag type="gray" size="sm">{src.domain}</Tag>
                              : cell.info.header === "status" ? <Tag type={src.active ? "green" : "cool-gray"} size="sm">{src.active ? "Active" : "Inactive"}</Tag>
                              : cell.info.header === "loinc" ? (src.loinc || <span style={{ color: "#6f6f6f" }}>— none —</span>)
                              : cell.info.header === "name" ? (<>{src.name} {src.amr && <Tag type="magenta" size="sm">AMR</Tag>}{src.active && !src.loinc && <Tag type="red" size="sm">No LOINC</Tag>}</>)
                              : cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <Pagination page={1} pageSize={25} pageSizes={[10, 25, 50, 100]} totalItems={176} onChange={() => {}} />
      </Column>
    </Grid>
  );
}

// ===========================================================================
// Editor shell SideNav — "← All Tests / Editing: X" + section list.
// ===========================================================================
const SECTIONS = ["Basic Info", "Sample & Results", "Methods", "Ranges", "Sample Storage", "Panels", "Labels", "Terminology", "Reagents", "Analyzers", "Alerts", "Reflex & Calc", "Display Order"];
function EditorNav({ section, setSection, testName }) {
  return (
    <SideNav isFixedNav expanded aria-label="Test editor sections">
      <SideNavItems>
        <SideNavMenu title={t("label.testCatalog.editor", "Test Catalog Management")} defaultExpanded>
          <SideNavMenuItem href="#">← {t("label.testCatalog.list", "All Tests")}</SideNavMenuItem>
          <div style={{ padding: "0.5rem 1rem", color: "#6f6f6f", fontSize: 12 }}>{t("label.testCatalog.editing", "Editing")}: {testName}</div>
          {SECTIONS.map((s) => <SideNavMenuItem key={s} isActive={s === section} onClick={() => setSection(s)}>{s}</SideNavMenuItem>)}
        </SideNavMenu>
      </SideNavItems>
    </SideNav>
  );
}
function EditorHeader({ title, isNew }) {
  return (
    <>
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="#">{t("home.label", "Home")}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t("breadcrums.admin.managment", "Admin Management")}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t("label.testCatalog.editorCrumb", "Test Catalog Editor")}</BreadcrumbItem>
      </Breadcrumb>
      <Heading style={{ margin: "0.5rem 0 1rem" }}>{title}</Heading>
      <Stack orientation="horizontal" gap={3} style={{ marginBottom: "1.5rem" }}>
        <Button kind="primary">{t("button.save", "Save")}</Button>
        {!isNew && <Button kind="secondary">{t("title.testCatalog.saveAsNew", "Save as new test…")}</Button>}
        <Button kind="ghost">{t("button.cancel", "Cancel")}</Button>
      </Stack>
    </>
  );
}

// ===========================================================================
// Basic Info — blank = New test (FR-2/FR-3). Name/Code/Description editable (dependency #8).
// ===========================================================================
function BasicInfo({ isNew }) {
  return (
    <Section>
      <Heading style={{ fontSize: "2rem", marginBottom: "1rem" }}>{t("label.testCatalog.basicInfo", "Basic Info")}</Heading>
      {isNew && <InlineNotification kind="info" lowContrast hideCloseButton title={t("notification.testCatalog.creating", "Creating a new test")} subtitle={t("notification.testCatalog.creatingSub", "Fill in Basic Info and Save. The test is created Inactive; configure the sections at left.")} />}
      <Stack gap={6} style={{ maxWidth: 640, marginTop: "1rem" }}>
        <TextInput id="bi-name" labelText={t("label.testCatalog.testName", "Name")} defaultValue={isNew ? "" : "Amylase"} placeholder={isNew ? "e.g. Ferritin" : ""} />
        <TextInput id="bi-report" labelText={t("label.testCatalog.reportingName", "Reporting name")} defaultValue={isNew ? "" : "Amylase"} />
        <TextInput id="bi-code" labelText={t("label.testCatalog.testCode", "Code")} defaultValue={isNew ? "" : "Amylase-Serum"} helperText={isNew ? t("helper.testCatalog.codeAuto", "Auto-suggested from name; editable") : ""} />
        {/* "Lab Unit" is the canonical term for test_section */}
        <ComboBox id="bi-labunit" titleText={t("label.testCatalog.labUnit", "Lab Unit")} placeholder="Choose a Lab Unit…" items={["Chemistry", "Hematology", "Serology", "Microbiology"]} itemToString={(i) => i || ""} />
        <ComboBox id="bi-sampletype" titleText={t("label.testCatalog.specimenType", "Sample type")} placeholder="e.g. Serum" items={SAMPLE_TYPES} itemToString={(i) => i || ""} />
        <TextArea id="bi-desc" labelText={t("label.testCatalog.description", "Description")} rows={2} defaultValue={isNew ? "" : "Amylase(Serum)"} />
        <RadioButtonGroup name="domain" legendText={t("label.testCatalog.domain", "Domain")} defaultSelected={isNew ? undefined : "CLINICAL"}>
          <RadioButton labelText="Clinical" value="CLINICAL" id="d-c" />
          <RadioButton labelText="Environmental" value="ENVIRONMENTAL" id="d-e" />
          <RadioButton labelText="Vector" value="VECTOR" id="d-v" />
        </RadioButtonGroup>
        <Toggle id="bi-amr" labelText={t("label.testCatalog.amr", "AMR surveillance test")} labelA="No" labelB="Yes" toggled={false} />
        <Toggle id="bi-active" labelText={t("label.testCatalog.active", "Active")} labelA="No" labelB="Yes" toggled={!isNew} />
        <Toggle id="bi-orderable" labelText={t("label.testCatalog.orderable", "Orderable")} labelA="No" labelB="Yes" toggled={!isNew} />
        <Button kind="primary">{t("button.save", "Save")}</Button>
      </Stack>
    </Section>
  );
}

// ===========================================================================
// Sample & Results — result-type-first progressive disclosure (FR-27..37) + live preview.
// ===========================================================================
const COMMON_TYPES = [
  { id: "N", label: "Numeric", desc: "A measured number with a unit — e.g. 12.3 g/dL" },
  { id: "D", label: "Single-select list", desc: "One value from a fixed set — e.g. Detected / Not detected" },
  { id: "R", label: "Free text", desc: "A typed comment or description" },
];
const ADVANCED_TYPES = [
  { id: "M", label: "Multi-select list", desc: "One or more values from a list; no reference value" },
  { id: "C", label: "Cascading multi-select", desc: "Grouped options; pick multiple groups" },
  { id: "T", label: "Titer", desc: "A dilution ratio such as 1:10, 1:20" },
  { id: "A", label: "Alpha", desc: "Validated alphanumeric text — a code" },
];
function TypeCard({ opt, selected, onSelect }) {
  return (
    <Tile onClick={() => onSelect(opt.id)} style={{ cursor: "pointer", flex: 1, minWidth: 180, border: selected ? "2px solid #0f62fe" : "1px solid #c6c6c6", background: selected ? "#edf5ff" : "#fff" }}>
      <strong style={{ display: "block" }}>{opt.label}</strong>
      <span style={{ fontSize: 12, color: "#525252" }}>{opt.desc}</span>
    </Tile>
  );
}
function SampleResults() {
  const [rt, setRt] = useState("D");
  const [adv, setAdv] = useState(false);
  const [sig, setSig] = useState(1);
  const options = ["SARS-CoV-2 RNA NOT DETECTED", "SARS-CoV-2 RNA DETECTED", "RETEST — INCONCLUSIVE", "Invalid"];
  const coded = rt === "D" || rt === "M" || rt === "C";
  return (
    <Section>
      <Heading style={{ fontSize: "2rem" }}>{t("label.testCatalog.sampleResults", "Sample & Results")}</Heading>
      <p style={{ color: "#525252" }}>{t("helper.testCatalog.sampleResultsPurpose", "Define what a technician records for this test and how results are interpreted.")}</p>
      <Grid>
        <Column lg={10}>
          <Stack gap={6}>
            <Tile>
              <strong>{t("label.testCatalog.resultType", "How is this result captured?")}</strong>
              <Stack orientation="horizontal" gap={3} style={{ marginTop: 8, flexWrap: "wrap" }}>
                {COMMON_TYPES.map((o) => <TypeCard key={o.id} opt={o} selected={rt === o.id} onSelect={setRt} />)}
              </Stack>
              <Button kind="ghost" size="sm" renderIcon={adv ? ChevronUp : ChevronDown} onClick={() => setAdv(!adv)}>{t("label.testCatalog.advancedTypes", "Advanced / legacy types")}</Button>
              {adv && <Stack orientation="horizontal" gap={3} style={{ flexWrap: "wrap" }}>
                {ADVANCED_TYPES.map((o) => <TypeCard key={o.id} opt={o} selected={rt === o.id} onSelect={setRt} />)}
              </Stack>}
            </Tile>

            <Tile>
              <p style={{ color: "#525252" }}>{t("helper.testCatalog.componentVsMulti", "Add a component when the test measures several different things (e.g. a differential). Use Multi-select or Cascading (Advanced) when one result is chosen from a list of values.")}</p>
              <TextInput id="comp-label-0" labelText={t("label.testCatalog.componentLabel", "Component label")} defaultValue="COVID-19 PCR" />
              {rt === "N" && <>
                <ComboBox id="comp-uom-0" titleText={t("label.testCatalog.uom", "Unit of measure")} placeholder="Search units…" items={["g/dL", "g/L", "copies/mL", "%"]} itemToString={(i) => i || ""} />
                <NumberInput id="comp-sig-0" label={t("label.testCatalog.sigDigits", "Significant digits")} min={0} max={3} value={sig} onChange={(e, { value }) => setSig(value)} helperText={t("helper.testCatalog.sigDigitsExample", "Shown to the technician as {ex}").replace("{ex}", sig === 0 ? "12" : sig === 1 ? "12.3" : "12.34")} style={{ maxWidth: 160 }} />
                <InlineNotification kind="info" lowContrast hideCloseButton title="" subtitle={t("link.testCatalog.rangesCrossLink", "Normal & critical ranges are set in the Ranges section →")} />
              </>}
              {coded && <>
                {rt === "M" && <InlineNotification kind="info" lowContrast hideCloseButton subtitle={t("desc.testCatalog.resultTypeMultiSelect", "Technician may pick one or more values; no reference value.")} />}
                <DataTable rows={options.map((o, i) => ({ id: String(i), value: o, normal: i === 0 ? "Normal" : "", sort: i + 1 }))} headers={[{ key: "value", header: "Value" }, { key: "normal", header: "Normal" }, { key: "sort", header: "Sort" }]}>
                  {({ rows, headers, getHeaderProps, getTableProps }) => (
                    <Table {...getTableProps()}><TableHead><TableRow>{headers.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow></TableHead>
                      <TableBody>{rows.map((r) => <TableRow key={r.id}>{r.cells.map((c) => <TableCell key={c.id}>{c.info.header === "normal" && c.value ? <Tag type="green" size="sm">Normal</Tag> : c.value}</TableCell>)}</TableRow>)}</TableBody></Table>
                  )}
                </DataTable>
                <Button kind="tertiary" renderIcon={Add}>{t("button.testCatalog.addOption", "Add option")}</Button>
              </>}
              {rt === "R" && <InlineNotification kind="info" lowContrast hideCloseButton subtitle={t("note.testCatalog.freeTextNoExtras", "No units, significant digits, or ranges apply to free-text results.")} />}
              {rt === "T" && <InlineNotification kind="info" lowContrast hideCloseButton subtitle="Entered as a dilution ratio, e.g. 1:64." />}
              {rt === "A" && <InlineNotification kind="info" lowContrast hideCloseButton subtitle="Alphanumeric text, validated against allowed characters." />}
            </Tile>

            <Tile>
              <strong>{t("label.testCatalog.interpretations", "Flagging rules (interpretations)")} — optional</strong>
              {rt === "R" ? <p style={{ color: "#525252" }}>Flagging rules don't apply to free text.</p>
                : <div style={{ background: "#f4f4f4", border: "1px dashed #a8a8a8", padding: "1rem", textAlign: "center" }}>
                    {t("empty.testCatalog.noInterpretations", "No flagging rules yet. Add one to auto-mark results like 'Detected' as positive.")}
                    <div><Button kind="tertiary" size="sm" renderIcon={Add} style={{ marginTop: 8 }}>Add flagging rule</Button></div>
                  </div>}
            </Tile>
          </Stack>
        </Column>
        <Column lg={6}>
          {/* Live "Result entry preview" (FR-35) — reuses Results Entry rendering in production */}
          <Tile style={{ border: "1px solid #0f62fe", background: "#fafafa" }}>
            <h4 style={{ margin: 0 }}>{t("heading.testCatalog.resultEntryPreview", "Result entry preview")}</h4>
            <p style={{ fontSize: 12, color: "#6f6f6f" }}>{t("helper.testCatalog.resultEntryPreview", "This is what a technician will see when entering this result.")}</p>
            <label style={{ fontSize: 12 }}>COVID-19 PCR</label>
            {rt === "N" && <Stack orientation="horizontal" gap={3}><TextInput id="pv-n" labelText="" placeholder="12.3" /><span style={{ color: "#6f6f6f" }}>copies/mL</span></Stack>}
            {rt === "D" && <Dropdown id="pv-d" label="Select a result…" items={options} itemToString={(i) => i || ""} titleText="" />}
            {rt === "M" && options.map((o, i) => <div key={i}><input type="checkbox" /> {o}</div>)}
            {rt === "R" && <TextArea id="pv-r" labelText="" rows={3} placeholder="Type result…" />}
            {(rt === "T" || rt === "A" || rt === "C") && <TextInput id="pv-x" labelText="" placeholder={rt === "T" ? "1:64" : "…"} />}
          </Tile>
        </Column>
      </Grid>
    </Section>
  );
}

// ===========================================================================
// Panels — test-side membership + position (FR-41..45). Position shows real slot + context.
// ===========================================================================
function Panels() {
  const order = ["Glucose", "GOT/ASAT", "Amylase", "Créatininémie", "Total cholesterol"];
  return (
    <Section>
      <Heading style={{ fontSize: "2rem" }}>{t("label.testCatalog.panels", "Panels")}</Heading>
      <p style={{ color: "#525252" }}>Manage which panels this test belongs to, and its position within each.</p>
      <Stack gap={6} style={{ maxWidth: 760 }}>
        <ComboBox id="add-to-panel" titleText={t("label.testCatalog.panels.addToPanel", "Add to panel")} placeholder="Search panels…" items={["Bilan Biochimique", "Bilan Lipidique", "Complete Blood Count"]} itemToString={(i) => i || ""} />
        <DataTable rows={[{ id: "1", panel: "Bilan Biochimique", position: "3 of 5" }]} headers={[{ key: "panel", header: "Panel" }, { key: "position", header: t("label.testCatalog.panels.position", "Position") }, { key: "actions", header: "Actions" }]}>
          {({ rows, headers, getHeaderProps, getTableProps }) => (
            <Table {...getTableProps()}><TableHead><TableRow>{headers.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow></TableHead>
              <TableBody><TableRow>
                <TableCell>Bilan Biochimique</TableCell>
                <TableCell><Draggable /> 3 of 5 <IconButton kind="ghost" size="sm" label="Up"><ChevronUp /></IconButton><IconButton kind="ghost" size="sm" label="Down"><ChevronDown /></IconButton></TableCell>
                <TableCell><IconButton kind="ghost" size="sm" label="Remove from panel"><TrashCan /></IconButton></TableCell>
              </TableRow></TableBody></Table>
          )}
        </DataTable>
        <Button kind="ghost" renderIcon={Add}>{t("button.testCatalog.panels.createNew", "Create new panel")}</Button>
        {/* Position-in-panel context (fixes the blank Position field) */}
        <Tile>
          <strong>Position in "Bilan Biochimique"</strong>
          <p style={{ fontSize: 12, color: "#6f6f6f" }}>Drag or use ↑/↓ to move this test among the panel's tests.</p>
          {order.map((x, i) => (
            <div key={i} style={{ padding: "8px 10px", background: x === "Amylase" ? "#edf5ff" : "#fff", border: "1px solid #e0e0e0", marginTop: -1, display: "flex", justifyContent: "space-between" }}>
              <span>{i + 1}. {x} {x === "Amylase" && <Tag type="blue" size="sm">This test</Tag>}</span>
              {x === "Amylase" && <Draggable />}
            </div>
          ))}
        </Tile>
        <Button kind="primary">{t("button.save", "Save")}</Button>
      </Stack>
    </Section>
  );
}

// ===========================================================================
// Edit related tests together — combined shared-config editor (FR-6..14) + LOINC integrity (FR-15..18).
// ===========================================================================
function EditRelated() {
  const [sec, setSec] = useState("Ranges");
  const tests = [["Whole Blood", "718-7"], ["Venous Blood", "30313-1"], ["Capillary Blood", "718-7"]];
  return (
    <Section>
      <Heading style={{ fontSize: "2rem" }}>Editing 3 tests together</Heading>
      <Stack orientation="horizontal" gap={3} style={{ margin: "0.5rem 0 1.5rem" }}>
        <Button kind="primary">Save to all 3</Button><Button kind="ghost">Cancel</Button>
      </Stack>
      <InlineNotification kind="info" lowContrast hideCloseButton title="Editing 3 tests" subtitle="Hemoglobin (Whole Blood) · (Venous Blood) · (Capillary Blood). Shared settings apply to all 3; identity & LOINC stay per test." />
      <Tile>
        <strong>Identity & LOINC (per test — not shared)</strong>
        {tests.map((tst, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e0e0e0", padding: "8px 0" }}>
            <span>Hemoglobin ({tst[0]})</span><span>LOINC: <strong>{tst[1]}</strong> <Button kind="ghost" size="sm">Open test</Button></span>
          </div>
        ))}
        <InlineNotification kind="error" lowContrast hideCloseButton title="Duplicate LOINC" subtitle={t("warning.testCatalog.duplicateLoinc", "LOINC 718-7 is used by both Whole Blood and Capillary Blood. Incoming results for this code route to only one test (first match) — results may be sent to the wrong test.")} />
      </Tile>
      <div style={{ margin: "1rem 0" }}>
        {["Sample & Results", "Methods", "Ranges", "Sample Storage"].map((s) => <Button key={s} kind={s === sec ? "secondary" : "ghost"} size="sm" onClick={() => setSec(s)}>{s}</Button>)}
      </div>
      {sec === "Ranges" && <Tile>
        <strong>Normal & critical ranges — shared across all 3 tests</strong>
        <InlineNotification kind="warning" lowContrast hideCloseButton subtitle={t("helper.testCatalog.coverageGap", "Coverage gap: {span} is not covered.").replace("{span}", "30 years and older")} />
      </Tile>}
      {sec === "Sample & Results" && <Tile>
        <InlineNotification kind="warning" lowContrast hideCloseButton title="Differs across tests" subtitle="Significant digits: Whole/Venous = 1; Capillary = 2." />
        <Button kind="ghost" size="sm">Set all to…</Button>
      </Tile>}
    </Section>
  );
}

// ===========================================================================
// Demo shell (dev reference only). In production each surface mounts on its route.
// ===========================================================================
export default function TestCatalogCompletionMockup() {
  const [view, setView] = useState("list");
  const [section, setSection] = useState("Basic Info");
  const openSection = (s) => { setSection(s); setView(s === "Sample & Results" ? "sample" : s === "Panels" ? "panels" : "basic"); };
  return (
    <div>
      <Grid fullWidth style={{ borderBottom: "1px solid #e0e0e0", padding: "0.5rem 0" }}>
        <Column lg={16}><Stack orientation="horizontal" gap={2}>
          {[["list", "Catalog list"], ["create", "New test"], ["sample", "Sample & Results"], ["panels", "Panels"], ["related", "Edit related"]].map(([v, l]) =>
            <Button key={v} size="sm" kind={view === v ? "primary" : "ghost"} onClick={() => setView(v)}>{l}</Button>)}
        </Stack></Column>
      </Grid>
      {view === "list" && <CatalogList onNew={() => setView("create")} onOpen={() => setView("sample")} onEditRelated={() => setView("related")} />}
      {(view === "create" || view === "basic") && <Grid fullWidth><Column lg={4}><EditorNav section={section} setSection={openSection} testName={view === "create" ? "New test" : "Amylase"} /></Column><Column lg={12}><EditorHeader title={view === "create" ? "New test" : "Amylase"} isNew={view === "create"} /><BasicInfo isNew={view === "create"} /></Column></Grid>}
      {view === "sample" && <Grid fullWidth><Column lg={4}><EditorNav section="Sample & Results" setSection={openSection} testName="COVID-19 PCR (Sputum)" /></Column><Column lg={12}><EditorHeader title="COVID-19 PCR (Sputum)" /><SampleResults /></Column></Grid>}
      {view === "panels" && <Grid fullWidth><Column lg={4}><EditorNav section="Panels" setSection={openSection} testName="Amylase" /></Column><Column lg={12}><EditorHeader title="Amylase" /><Panels /></Column></Grid>}
      {view === "related" && <Grid fullWidth><Column lg={12}><EditRelated /></Column></Grid>}
    </div>
  );
}
