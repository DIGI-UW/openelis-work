import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, NumberInput, MultiSelect,
  Checkbox, RadioButton, RadioButtonGroup, Toggle,
  Button, IconButton, InlineNotification, Tag, Modal, Loading,
  Accordion, AccordionItem,
  Tile, Pagination, Search, OverflowMenu, OverflowMenuItem, FormGroup,
} from '@carbon/react';
import {
  Add, Edit, TrashCan, ChevronDown, ChevronUp, Information, Renew,
  Download, Upload, Save, Draggable, Search as SearchIcon, Catalog,
  Settings, NotificationFilled, Email, Phone, Thermometer, Snowflake, Beaker,
  Activity, FlowConnection, ChartLine, Printer, Cpu, FlaskConical,
  CheckmarkOutline, WarningAlt, Filter, Locked, Unlocked, Close, Copy,
} from '@carbon/icons-react';

// ==================== I18N HELPER ====================
const t = (key, fallback) => fallback || key;

// ==================== MOCK DATA ====================
const mockTests = [
  { id: 1, name: 'Glucose, Fasting', section: 'Chemistry', sampleType: 'Serum', resultType: 'NUMERIC', loinc: '2345-7', status: 'Active', domain: 'CLINICAL', amr: false },
  { id: 2, name: 'HbA1c', section: 'Chemistry', sampleType: 'Whole Blood', resultType: 'NUMERIC', loinc: '4548-4', status: 'Active', domain: 'CLINICAL', amr: false },
  { id: 3, name: 'HBsAg', section: 'Serology', sampleType: 'Serum', resultType: 'SELECT_LIST', loinc: '16962-2', status: 'Active', domain: 'CLINICAL', amr: false },
  { id: 4, name: 'HIV Viral Load', section: 'Molecular', sampleType: 'Plasma', resultType: 'NUMERIC', loinc: '10689-0', status: 'Active', domain: 'CLINICAL', amr: false },
  { id: 5, name: 'CBC', section: 'Hematology', sampleType: 'Whole Blood', resultType: 'NUMERIC', loinc: '58410-2', status: 'Active', domain: 'CLINICAL', amr: false },
  { id: 6, name: 'Bilirubin, Total', section: 'Chemistry', sampleType: 'Serum', resultType: 'NUMERIC', loinc: '1975-2', status: 'Inactive', domain: 'CLINICAL', amr: false },
  { id: 7, name: 'Water Turbidity', section: 'Environmental', sampleType: 'Water', resultType: 'NUMERIC', loinc: null, status: 'Active', domain: 'ENVIRONMENTAL', amr: false },
  { id: 8, name: 'Lead in Drinking Water', section: 'Environmental', sampleType: 'Water', resultType: 'NUMERIC', loinc: null, status: 'Active', domain: 'ENVIRONMENTAL', amr: false },
  { id: 9, name: 'PM2.5', section: 'Environmental', sampleType: 'Air', resultType: 'NUMERIC', loinc: null, status: 'Active', domain: 'ENVIRONMENTAL', amr: false },
  { id: 10, name: 'Fecal Coliform', section: 'Environmental', sampleType: 'Water', resultType: 'SELECT_LIST', loinc: null, status: 'Active', domain: 'ENVIRONMENTAL', amr: false },
  { id: 11, name: 'Aedes pool RT-PCR Dengue', section: 'Molecular', sampleType: 'Mosquito Pool', resultType: 'SELECT_LIST', loinc: null, status: 'Active', domain: 'VECTOR', amr: false },
  { id: 12, name: 'Anopheles speciation', section: 'Molecular', sampleType: 'Mosquito Pool', resultType: 'SELECT_LIST', loinc: null, status: 'Active', domain: 'VECTOR', amr: false },
  { id: 13, name: 'Ampicillin Susceptibility', section: 'Microbiology', sampleType: 'Culture', resultType: 'SELECT_LIST', loinc: '18901-5', status: 'Active', domain: 'CLINICAL', amr: true },
  { id: 14, name: 'Ciprofloxacin Susceptibility', section: 'Microbiology', sampleType: 'Culture', resultType: 'SELECT_LIST', loinc: '18909-8', status: 'Active', domain: 'CLINICAL', amr: true },
];

// ==================== HELPER COMPONENTS ====================
/**
 * DomainTag — renders a colored tag based on test domain (CLINICAL, ENVIRONMENTAL, VECTOR)
 */
function DomainTag({ domain }) {
  const tagMap = {
    'CLINICAL': { kind: 'blue', label: 'Clinical' },
    'ENVIRONMENTAL': { kind: 'teal', label: 'Environmental' },
    'VECTOR': { kind: 'purple', label: 'Vector' },
  };
  const config = tagMap[domain] || { kind: 'gray', label: domain };
  return <Tag type={config.kind}>{config.label}</Tag>;
}

// ==================== TEST LIST VIEW ====================
/**
 * TestListView — displays paginated, filterable list of tests with click-to-open
 */
function TestListView({ onEdit, onAdd }) {
  const [filters, setFilters] = useState({
    section: '',
    sampleType: '',
    resultType: '',
    status: '',
    domain: 'All Domains',
    amr: 'All',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredTests = useMemo(() => {
    return mockTests.filter((test) => {
      if (searchText && !test.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filters.section && test.section !== filters.section) return false;
      if (filters.sampleType && test.sampleType !== filters.sampleType) return false;
      if (filters.resultType && test.resultType !== filters.resultType) return false;
      if (filters.status && test.status !== filters.status) return false;
      if (filters.domain !== 'All Domains' && test.domain !== filters.domain) return false;
      if (filters.amr === 'AMR Only' && !test.amr) return false;
      if (filters.amr === 'Non-AMR' && test.amr) return false;
      return true;
    });
  }, [filters, searchText]);

  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTests.slice(start, start + pageSize);
  }, [filteredTests, currentPage]);

  const totalPages = Math.ceil(filteredTests.length / pageSize);

  const headers = [
    { key: 'name', header: t('admin.testCatalog.list.header.testName', 'Test Name') },
    { key: 'domain', header: t('admin.testCatalog.list.header.domain', 'Domain') },
    { key: 'section', header: t('admin.testCatalog.list.header.section', 'Section') },
    { key: 'sampleType', header: t('admin.testCatalog.list.header.sampleType', 'Sample Type') },
    { key: 'resultType', header: t('admin.testCatalog.list.header.resultType', 'Result Type') },
    { key: 'loinc', header: t('admin.testCatalog.list.header.loinc', 'LOINC') },
    { key: 'status', header: t('admin.testCatalog.list.header.status', 'Status') },
  ];

  const rows = paginatedTests.map((test) => ({
    id: `row-${test.id}`,
    name: test.name,
    domain: test.domain,
    section: test.section,
    sampleType: test.sampleType,
    resultType: test.resultType,
    loinc: test.loinc || '–',
    status: test.status,
    _test: test,
  }));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>{t('admin.testCatalog.list.header.title', 'Test Catalog Management')}</h1>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <Search
          labelText={t('admin.testCatalog.list.action.search', 'Search tests by name')}
          placeholder={t('admin.testCatalog.list.action.search', 'Search tests by name')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button
          kind="ghost"
          onClick={() => setShowFilters(!showFilters)}
          size="sm"
        >
          {t('admin.testCatalog.list.action.filters', 'Filters')}
        </Button>
        <Button kind="primary" onClick={onAdd} size="sm">
          {t('admin.testCatalog.list.action.addTest', '+ Add Test')}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div style={{ background: '#f4f4f4', border: '1px solid #d0d0d0', borderRadius: '4px', padding: '16px', marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          <FormGroup legendText={t('admin.testCatalog.list.label.section', 'Section')}>
            <Select
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              labelText={t('admin.testCatalog.list.label.section', 'Section')}
            >
              <SelectItem text={t('admin.testCatalog.common.option.allSections', 'All Sections')} value="" />
              <SelectItem text="Chemistry" value="Chemistry" />
              <SelectItem text="Hematology" value="Hematology" />
              <SelectItem text="Serology" value="Serology" />
              <SelectItem text="Microbiology" value="Microbiology" />
              <SelectItem text="Environmental" value="Environmental" />
              <SelectItem text="Molecular" value="Molecular" />
            </Select>
          </FormGroup>

          <FormGroup legendText={t('admin.testCatalog.list.label.sampleType', 'Sample Type')}>
            <Select
              value={filters.sampleType}
              onChange={(e) => setFilters({ ...filters, sampleType: e.target.value })}
              labelText={t('admin.testCatalog.list.label.sampleType', 'Sample Type')}
            >
              <SelectItem text={t('admin.testCatalog.common.option.allTypes', 'All Types')} value="" />
              <SelectItem text="Serum" value="Serum" />
              <SelectItem text="Plasma" value="Plasma" />
              <SelectItem text="Whole Blood" value="Whole Blood" />
              <SelectItem text="Water" value="Water" />
              <SelectItem text="Mosquito Pool" value="Mosquito Pool" />
            </Select>
          </FormGroup>

          <FormGroup legendText={t('admin.testCatalog.list.label.resultType', 'Result Type')}>
            <Select
              value={filters.resultType}
              onChange={(e) => setFilters({ ...filters, resultType: e.target.value })}
              labelText={t('admin.testCatalog.list.label.resultType', 'Result Type')}
            >
              <SelectItem text={t('admin.testCatalog.common.option.allTypes', 'All Types')} value="" />
              <SelectItem text="NUMERIC" value="NUMERIC" />
              <SelectItem text="SELECT_LIST" value="SELECT_LIST" />
              <SelectItem text="MULTI_SELECT" value="MULTI_SELECT" />
              <SelectItem text="FREE_TEXT" value="FREE_TEXT" />
            </Select>
          </FormGroup>

          <FormGroup legendText={t('admin.testCatalog.list.label.status', 'Status')}>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              labelText={t('admin.testCatalog.list.label.status', 'Status')}
            >
              <SelectItem text={t('admin.testCatalog.common.option.allStatuses', 'All Statuses')} value="" />
              <SelectItem text="Active" value="Active" />
              <SelectItem text="Inactive" value="Inactive" />
            </Select>
          </FormGroup>

          <FormGroup legendText={t('admin.testCatalog.list.label.domain', 'Domain')}>
            <Select
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              labelText={t('admin.testCatalog.list.label.domain', 'Domain')}
            >
              <SelectItem text={t('admin.testCatalog.common.option.allDomains', 'All Domains')} value="All Domains" />
              <SelectItem text="Clinical" value="CLINICAL" />
              <SelectItem text="Environmental" value="ENVIRONMENTAL" />
              <SelectItem text="Vector" value="VECTOR" />
            </Select>
          </FormGroup>

          <FormGroup legendText={t('admin.testCatalog.list.label.amrStatus', 'AMR Status')}>
            <Select
              value={filters.amr}
              onChange={(e) => setFilters({ ...filters, amr: e.target.value })}
              labelText={t('admin.testCatalog.list.label.amrStatus', 'AMR Status')}
            >
              <SelectItem text={t('admin.testCatalog.common.option.all', 'All')} value="All" />
              <SelectItem text="AMR Only" value="AMR Only" />
              <SelectItem text="Non-AMR" value="Non-AMR" />
            </Select>
          </FormGroup>
        </div>
      )}

      {/* Data Table */}
      <DataTable rows={rows} headers={headers}>
        {({ rows: tableRows, headers: tableHeaders, getRowProps, getTableProps }) => (
          <TableContainer title="">
            <Table {...getTableProps()} style={{ cursor: 'pointer' }}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => (
                    <TableHeader key={header.key}>{header.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tableRows.map((row) => (
                  <TableRow
                    key={row.id}
                    {...getRowProps({ row })}
                    onClick={() => onEdit(row._test)}
                    style={{ cursor: 'pointer' }}
                  >
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.info.header === 'name' ? (
                          <Button
                            kind="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(row._test);
                            }}
                            style={{ padding: 0, textAlign: 'left', fontWeight: 600 }}
                          >
                            {cell.value}
                          </Button>
                        ) : cell.info.header === 'domain' ? (
                          <DomainTag domain={cell.value} />
                        ) : cell.info.header === 'status' ? (
                          <Tag type={cell.value === 'Active' ? 'green' : 'gray'}>{cell.value}</Tag>
                        ) : (
                          cell.value
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      {/* Pagination */}
      <Pagination
        totalItems={filteredTests.length}
        pageSize={pageSize}
        pageSizes={[10, 25, 50, 100]}
        page={currentPage}
        onChange={({ page }) => setCurrentPage(page)}
        style={{ marginTop: '16px' }}
      />
    </div>
  );
}

// ==================== EDITOR SECTIONS ====================
/**
 * BasicInfoSection — test name, code, section(s), domain, flags (Active/Orderable/Internal QA)
 */
function BasicInfoSection({ test, setTest }) {
  return (
    <div>
      <h2>{t('admin.testCatalog.basicInfo.header.title', 'Basic Information')}</h2>
      <p>{t('admin.testCatalog.basicInfo.header.subtitle', 'Core test identity and classification')}</p>

      <TextInput
        labelText={t('admin.testCatalog.basicInfo.label.name', 'Test Name') + ' *'}
        value={test.name || ''}
        onChange={(e) => setTest({ ...test, name: e.target.value })}
        placeholder={t('admin.testCatalog.basicInfo.placeholder.name', '')}
        style={{ marginBottom: '16px' }}
      />

      <TextInput
        labelText={t('admin.testCatalog.basicInfo.label.reportingName', 'Reporting Name')}
        placeholder={t('admin.testCatalog.basicInfo.placeholder.reportingName', '')}
        style={{ marginBottom: '16px' }}
      />

      <TextInput
        labelText={t('admin.testCatalog.basicInfo.label.testCode', 'Test Code')}
        placeholder={t('admin.testCatalog.basicInfo.placeholder.testCode', 'e.g., GLU')}
        style={{ marginBottom: '16px' }}
      />

      <TextArea
        labelText={t('admin.testCatalog.basicInfo.label.description', 'Description')}
        placeholder={t('admin.testCatalog.basicInfo.placeholder.description', 'Enter test description...')}
        style={{ marginBottom: '16px' }}
      />

      <div style={{ marginBottom: '16px' }}>
        <label>{t('admin.testCatalog.basicInfo.label.testSections', 'Test Section(s)') + ' *'}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
          {['Chemistry', 'Hematology', 'Serology', 'Immunology', 'Microbiology', 'Urinalysis', 'Parasitology', 'Molecular'].map((s) => (
            <Checkbox key={s} labelText={s} id={`sec-${s}`} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label>{t('admin.testCatalog.basicInfo.label.domain', 'Domain') + ' *'}</label>
        <RadioButtonGroup
          legendText={t('admin.testCatalog.basicInfo.label.domain', 'Domain')}
          name="domain"
          valueSelected={test.domain || 'CLINICAL'}
          onChange={(val) => setTest({ ...test, domain: val })}
          style={{ marginTop: '8px' }}
        >
          <RadioButton labelText={t('admin.testCatalog.basicInfo.option.clinical', 'Clinical')} value="CLINICAL" id="domain-clinical" />
          <RadioButton labelText={t('admin.testCatalog.basicInfo.option.environmental', 'Environmental')} value="ENVIRONMENTAL" id="domain-env" />
          <RadioButton labelText={t('admin.testCatalog.basicInfo.option.vector', 'Vector')} value="VECTOR" id="domain-vec" />
        </RadioButtonGroup>
      </div>

      <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px', marginBottom: '16px' }}>
        <Checkbox labelText={t('admin.testCatalog.basicInfo.label.active', 'Active Test')} id="active-test" />
        <Checkbox labelText={t('admin.testCatalog.basicInfo.label.orderable', 'Orderable')} id="orderable-test" style={{ marginTop: '8px' }} />
        <Checkbox labelText={t('admin.testCatalog.basicInfo.label.internalQA', 'Internal QA — No Results Release')} id="qa-test" style={{ marginTop: '8px' }} />
        <Checkbox labelText={t('admin.testCatalog.basicInfo.label.amrTest', 'AMR Test')} id="amr-test" style={{ marginTop: '8px' }} />
      </div>
    </div>
  );
}

/**
 * SampleResultsSection — sample types, result type (NUMERIC/SELECT_LIST/MULTI_SELECT/FREE_TEXT), units, interpretations
 */
function SampleResultsSection({ test, setTest }) {
  const [resultType, setResultType] = useState('NUMERIC');
  const [selectOptions, setSelectOptions] = useState([
    { id: 1, value: 'Positive', display: 'Positive', active: true },
    { id: 2, value: 'Negative', display: 'Negative', active: true },
    { id: 3, value: 'Indeterminate', display: 'Indeterminate', active: true },
  ]);
  const [showInterpModal, setShowInterpModal] = useState(false);

  return (
    <div>
      <h2>{t('admin.testCatalog.sampleResults.header.title', 'Sample & Results Configuration')}</h2>
      <p>{t('admin.testCatalog.sampleResults.header.subtitle', 'Define sample types and result format')}</p>

      <div style={{ marginBottom: '16px' }}>
        <label>{t('admin.testCatalog.sampleResults.label.sampleTypes', 'Sample Type(s)') + ' *'}</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px' }}>
          {['Serum', 'Plasma', 'Whole Blood', 'Urine', 'CSF', 'Water', 'Mosquito Pool'].map((s) => (
            <Checkbox key={s} labelText={s} id={`st-${s}`} />
          ))}
        </div>
      </div>

      <Select
        labelText={t('admin.testCatalog.sampleResults.label.defaultSampleType', 'Default Sample Type')}
        style={{ marginBottom: '16px' }}
      >
        <SelectItem text={t('admin.testCatalog.common.option.select', 'Select...')} value="" />
      </Select>

      <Select
        labelText={t('admin.testCatalog.sampleResults.label.resultType', 'Result Type') + ' *'}
        value={resultType}
        onChange={(e) => setResultType(e.target.value)}
        style={{ marginBottom: '16px' }}
      >
        <SelectItem text="NUMERIC" value="NUMERIC" />
        <SelectItem text="SELECT_LIST" value="SELECT_LIST" />
        <SelectItem text="MULTI_SELECT" value="MULTI_SELECT" />
        <SelectItem text="FREE_TEXT" value="FREE_TEXT" />
      </Select>

      {resultType === 'NUMERIC' && (
        <>
          <Select labelText={t('admin.testCatalog.sampleResults.label.unitOfMeasure', 'Unit of Measure')} style={{ marginBottom: '16px' }}>
            <SelectItem text="mg/dL" value="mg/dL" />
            <SelectItem text="mmol/L" value="mmol/L" />
            <SelectItem text="g/dL" value="g/dL" />
          </Select>

          <NumberInput
            labelText={t('admin.testCatalog.sampleResults.label.significantDigits', 'Significant Digits')}
            min={0}
            max={6}
            style={{ marginBottom: '16px' }}
          />
        </>
      )}

      <TextInput
        labelText={t('admin.testCatalog.sampleResults.label.defaultResultValue', 'Default Result Value')}
        style={{ marginBottom: '16px' }}
      />

      {(resultType === 'SELECT_LIST' || resultType === 'MULTI_SELECT') && (
        <Tile style={{ marginBottom: '16px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>{t('admin.testCatalog.sampleResults.header.selectListOptions', 'Select List Options')}</h4>
          <div style={{ fontSize: '12px', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f4', borderBottom: '1px solid #d0d0d0' }}>
                  <th style={{ padding: '8px', textAlign: 'left' }}>≡</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Value</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Display Order</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Active</th>
                  <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectOptions.map((opt) => (
                  <tr key={opt.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={{ padding: '8px' }}>≡</td>
                    <td style={{ padding: '8px', fontFamily: 'monospace' }}>{opt.value}</td>
                    <td style={{ padding: '8px' }}>1</td>
                    <td style={{ padding: '8px' }}>
                      <Checkbox checked={opt.active} id={`opt-${opt.id}`} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <Button kind="ghost" size="sm">Edit</Button>
                      <Button kind="ghost" size="sm" style={{ marginLeft: '4px' }}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tile>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0 }}>{t('admin.testCatalog.sampleResults.header.resultInterpretations', 'Result Interpretations')}</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button kind="secondary" size="sm">{t('admin.testCatalog.sampleResults.action.copyFromTest', '📋 Copy from Test...')}</Button>
          <Button kind="primary" size="sm" onClick={() => setShowInterpModal(true)}>
            {t('admin.testCatalog.common.button.add', '+ Add Interpretation')}
          </Button>
        </div>
      </div>

      <div style={{ fontSize: '12px', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #d0d0d0' }}>
              <th style={{ padding: '8px', textAlign: 'left' }}>≡</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Code</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Label</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Value/Range</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Text</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Active</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[
              { code: 'GLU-CRIT-H', label: 'Critical High', type: 'red', value: '> 500', text: 'Critical hyperglycemia...' },
              { code: 'GLU-HI', label: 'High', type: 'warm-gray', value: '140-500', text: 'Elevated glucose...' },
              { code: 'GLU-NL', label: 'Normal', type: 'green', value: '70-100', text: 'Within normal range...' },
            ].map((int, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '8px' }}>≡</td>
                <td style={{ padding: '8px', fontFamily: 'monospace' }}>{int.code}</td>
                <td style={{ padding: '8px' }}>
                  <Tag type={int.type}>{int.label}</Tag>
                </td>
                <td style={{ padding: '8px' }}>{int.value}</td>
                <td style={{ padding: '8px', fontSize: '11px', maxWidth: '200px' }}>{int.text}</td>
                <td style={{ padding: '8px' }}>
                  <Checkbox checked id={`int-${idx}`} />
                </td>
                <td style={{ padding: '8px' }}>
                  <Button kind="ghost" size="sm">Edit</Button>
                  <Button kind="ghost" size="sm" style={{ marginLeft: '4px' }}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInterpModal && (
        <Modal
          open={showInterpModal}
          onRequestClose={() => setShowInterpModal(false)}
          modalHeading={t('admin.testCatalog.sampleResults.modal.addInterpretation', 'Add Interpretation')}
          primaryButtonText={t('admin.testCatalog.common.button.add', 'Add')}
          secondaryButtonText={t('admin.testCatalog.common.button.cancel', 'Cancel')}
        >
          <TextInput labelText={t('admin.testCatalog.sampleResults.label.code', 'Code') + ' *'} placeholder="e.g., GLU-HI" />
          <TextInput labelText={t('admin.testCatalog.sampleResults.label.label', 'Label') + ' *'} placeholder="e.g., High" style={{ marginTop: '16px' }} />
          <TextInput labelText={t('admin.testCatalog.sampleResults.label.valueRange', 'Value / Range') + ' *'} style={{ marginTop: '16px' }} />
          <TextArea labelText={t('admin.testCatalog.sampleResults.label.text', 'Interpretation Text')} style={{ marginTop: '16px' }} />
        </Modal>
      )}
    </div>
  );
}

/**
 * MethodsSection — link analytical methods, create inline methods
 */
function MethodsSection() {
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  const linkedMethods = [
    { code: 'HEX', name: 'Hexokinase', isDefault: true, date: '2024-01-01' },
    { code: 'GOX', name: 'Glucose Oxidase', isDefault: false, date: '2020-01-01' },
  ];

  const availableMethods = [
    { code: 'GOD-PAP', name: 'Enzymatic (GOD-PAP)' },
    { code: 'CLR', name: 'Colorimetric' },
    { code: 'ISE', name: 'Ion-Selective Electrode' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.methods.header.title', 'Associated Methods')}</h2>
          <p>{t('admin.testCatalog.methods.header.subtitle', 'Link analytical methods used to perform this test')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button kind="secondary" size="sm" onClick={() => setShowCopyModal(true)}>
            {t('admin.testCatalog.methods.action.copyFromTest', '📋 Copy from Test...')}
          </Button>
          <Button kind="primary" size="sm" onClick={() => { setShowLinkPanel(true); setShowCreateForm(false); }}>
            {t('admin.testCatalog.methods.action.linkMethod', '+ Link Method')}
          </Button>
        </div>
      </div>

      {showLinkPanel && (
        <Tile style={{ marginBottom: '16px', background: '#f9f9f9', borderStyle: 'dashed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong>{t('admin.testCatalog.methods.label.selectMethod', 'Select Method to Link')}</strong>
            <Button kind="ghost" size="sm" onClick={() => { setShowLinkPanel(false); setShowCreateForm(true); }}>
              {t('admin.testCatalog.methods.action.createNewMethod', '+ Create New Method')}
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {availableMethods.map((m) => (
              <Button key={m.code} kind="secondary" size="sm" style={{ justifyContent: 'flex-start' }}>
                <code style={{ background: '#e8e8e8', padding: '2px 4px', borderRadius: '2px', marginRight: '8px' }}>{m.code}</code>
                {m.name}
              </Button>
            ))}
          </div>
        </Tile>
      )}

      {showCreateForm && (
        <Tile style={{ marginBottom: '16px', background: '#e3f2fd', borderColor: '#0f62fe', borderStyle: 'solid' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            {t('admin.testCatalog.methods.label.createNewMethod', 'Create New Method')}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <TextInput
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder={t('admin.testCatalog.methods.placeholder.code', 'Code (e.g., HEX)')}
              style={{ width: '120px' }}
            />
            <TextInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('admin.testCatalog.methods.placeholder.methodName', 'Method name')}
              style={{ flex: 1 }}
            />
            <Button kind="primary" size="sm" onClick={() => { setShowCreateForm(false); setNewCode(''); setNewName(''); }}>
              {t('admin.testCatalog.methods.action.createLink', 'Create & Link')}
            </Button>
            <Button kind="secondary" size="sm" onClick={() => { setShowCreateForm(false); setNewCode(''); setNewName(''); }}>
              {t('admin.testCatalog.common.button.cancel', 'Cancel')}
            </Button>
          </div>
        </Tile>
      )}

      {linkedMethods.map((m) => (
        <Tile
          key={m.code}
          style={{
            marginBottom: '12px',
            borderColor: m.isDefault ? '#0f62fe' : '#e0e0e0',
            background: m.isDefault ? '#e3f2fd' : '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                background: m.isDefault ? '#bce5fe' : '#e8e8e8',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ⚙
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <code style={{ background: '#e8e8e8', padding: '2px 6px', borderRadius: '2px', fontWeight: 500 }}>
                  {m.code}
                </code>
                <strong style={{ fontSize: '14px' }}>{m.name}</strong>
                {m.isDefault && <Tag type="blue">{t('admin.testCatalog.methods.label.default', 'Default')}</Tag>}
              </div>
              <div style={{ fontSize: '12px', color: '#525252', marginTop: '4px' }}>
                {t('admin.testCatalog.methods.label.effective', 'Effective')}: {m.date}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {!m.isDefault && <Button kind="ghost" size="sm">{t('admin.testCatalog.methods.action.setDefault', 'Set Default')}</Button>}
              <Button kind="ghost" size="sm">Edit</Button>
              <Button kind="ghost" size="sm" style={{ color: '#da1e28' }}>Delete</Button>
            </div>
          </div>
        </Tile>
      ))}

      {showCopyModal && (
        <Modal
          open={showCopyModal}
          onRequestClose={() => setShowCopyModal(false)}
          modalHeading={t('admin.testCatalog.methods.modal.copyMethods', 'Copy Methods from Another Test')}
          primaryButtonText={t('admin.testCatalog.methods.action.copySelected', 'Copy Selected')}
          secondaryButtonText={t('admin.testCatalog.common.button.cancel', 'Cancel')}
        >
          <TextInput
            labelText={t('admin.testCatalog.methods.label.searchForTest', 'Search for test')}
            placeholder={t('admin.testCatalog.methods.placeholder.enterTestName', 'Enter test name...')}
            style={{ marginBottom: '16px' }}
          />
          <div style={{ marginBottom: '16px' }}>
            <label>{t('admin.testCatalog.methods.label.selectTest', 'Select test:')}</label>
            {['Fasting Glucose', 'Random Glucose', '2-Hour Glucose', 'HbA1c'].map((t, i) => (
              <div key={i} style={{ padding: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <RadioButton id={`srctest-${i}`} name="sourceTest" value={t} />
                <label htmlFor={`srctest-${i}`}>{t}</label>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/**
 * RangesSection — critical values, normal ranges, reference intervals with structured/table/visual views
 */
function RangesSection({ test }) {
  const [viewMode, setViewMode] = useState('structured');
  const [showAddModal, setShowAddModal] = useState(null); // null or { rangeType, prefill? }
  const [showCoveragePanel, setShowCoveragePanel] = useState(true);
  const [visualSex, setVisualSex] = useState('M');
  const [visualAge, setVisualAge] = useState(3);
  const [visualUnit, setVisualUnit] = useState('days');

  // Mock range data — neonatal-aware bilirubin-style ranges with intentional gap in Female
  const ranges = {
    normal: {
      M: [
        { age: '0 – 24 hours', low: 1, high: 100 },
        { age: '24 – 48 hours', low: 1, high: 120 },
        { age: '48 – 72 hours', low: 1, high: 140 },
        { age: '3 days – 5 days', low: 1, high: 155 },
        { age: '14 days – 1 month', low: 1, high: 130 },
        { age: '1 month – 1 year', low: 1, high: 115 },
        { age: '1 year – ∞', low: 5, high: 40 },
      ],
      F: [
        { age: '0 – 24 hours', low: 1, high: 105 },
        { age: '24 – 48 hours', low: 1, high: 130 },
        { age: '48 – 72 hours', low: 1, high: 155 },
        { age: '3 days – 55 days', low: 1, high: 175 },
        // intentional gap: 55 days – 1 year missing
        { age: '1 year – ∞', low: 5, high: 35 },
      ],
    },
    critical: {
      A: [
        { age: '0 – 23 hours', low: null, high: 7.9 },
        { age: '24 – 35 hours', low: null, high: 10.9 },
        { age: '36 – 47 hours', low: null, high: 13.9 },
        { age: '48 – 71 hours', low: null, high: 14.9 },
        { age: '72 hours – 13 days', low: null, high: 17.9 },
        { age: '14 days – ∞', low: null, high: 15.0 },
      ],
    },
    valid: { A: [{ age: '0 hours – ∞', low: 0, high: 600 }] },
    reporting: { A: [{ age: '0 hours – ∞', low: 0.1, high: 30 }] },
  };

  const rangeTypes = [
    { id: 'normal', label: t('admin.testCatalog.ranges.label.normal', 'Normal Range'), desc: 'Clinical reference values. Results outside flagged H/L on reports.', kind: 'green', barColor: '#a7f0ba' },
    { id: 'valid', label: t('admin.testCatalog.ranges.label.valid', 'Valid Range'), desc: 'Expected possible values. Entry outside prompts verification.', kind: 'blue', barColor: '#bce5fe' },
    { id: 'critical', label: t('admin.testCatalog.ranges.label.critical', 'Critical Range'), desc: 'Panic values requiring immediate clinical action.', kind: 'red', barColor: '#f8b8b8' },
    { id: 'reporting', label: t('admin.testCatalog.ranges.label.reporting', 'Reporting Range'), desc: 'Instrument limits. Results outside may need dilution/rerun.', kind: 'purple', barColor: '#e0c3fc' },
  ];

  const sexLabels = { M: t('admin.testCatalog.ranges.label.male', 'Male'), F: t('admin.testCatalog.ranges.label.female', 'Female'), A: t('admin.testCatalog.ranges.label.allSexes', 'All') };
  const sexKinds = { M: 'blue', F: 'purple', A: 'gray' };

  // Visual view: get applicable range for selected demographic (matches by sex preference, fallback to 'A')
  const getApplicableRange = (typeId) => {
    const byType = ranges[typeId];
    return (byType[visualSex] && byType[visualSex][0]) || (byType.A && byType.A[0]) || null;
  };

  // Flat list for table view
  const allRangesFlat = [];
  rangeTypes.forEach(type => {
    const byType = ranges[type.id];
    Object.keys(byType).forEach(sex => {
      byType[sex].forEach(r => allRangesFlat.push({ ...r, type: type.id, typeLabel: type.label, typeKind: type.kind, sex }));
    });
  });

  return (
    <div>
      <h2>{t('admin.testCatalog.ranges.header.title', 'Ranges & Reference Intervals')}</h2>
      <p>{t('admin.testCatalog.ranges.header.subtitle', 'Configure normal, critical, and reporting ranges by age and sex')}</p>

      {test && (test.domain === 'ENVIRONMENTAL' || test.domain === 'VECTOR') && (
        <InlineNotification
          kind="info"
          title={t('admin.testCatalog.ranges.notification.domainInfo', 'Domain Note')}
          subtitle={t('admin.testCatalog.ranges.notification.compliancePrimary', 'This is an Environmental/Vector test. Compliance thresholds are typically the primary evaluation surface for this domain.')}
          style={{ marginBottom: '16px' }}
        />
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button
          kind={viewMode === 'structured' ? 'primary' : 'ghost'}
          onClick={() => setViewMode('structured')}
          size="sm"
        >
          {t('admin.testCatalog.ranges.action.structuredView', 'Structured')}
        </Button>
        <Button
          kind={viewMode === 'table' ? 'primary' : 'ghost'}
          onClick={() => setViewMode('table')}
          size="sm"
        >
          {t('admin.testCatalog.ranges.action.tableView', 'Table')}
        </Button>
        <Button
          kind={viewMode === 'visual' ? 'primary' : 'ghost'}
          onClick={() => setViewMode('visual')}
          size="sm"
        >
          {t('admin.testCatalog.ranges.action.visualView', 'Visual')}
        </Button>
        <Button kind="ghost" onClick={() => setShowCoveragePanel(!showCoveragePanel)} size="sm">
          {t('admin.testCatalog.ranges.action.toggleCoverage', 'Coverage Validation')}
        </Button>
      </div>

      {showCoveragePanel && (
        <Tile style={{ background: '#f4f4f4', marginBottom: '16px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>{t('admin.testCatalog.ranges.header.ageCoverageValidation', 'Age Coverage Validation')}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Tile style={{ background: '#fff' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag type="blue">{t('admin.testCatalog.ranges.label.male', 'Male')}</Tag>
                <span style={{ fontSize: '12px', color: '#0d6f1f', fontWeight: 600 }}>✓ Complete Coverage</span>
              </div>
              <div style={{ padding: '8px', background: '#d1fce0', borderRadius: '3px', fontSize: '12px', color: '#0d6f1f' }}>
                {t('admin.testCatalog.ranges.notification.allAgesCompleteCoverage', 'All age ranges from birth to maximum age are covered.')}
              </div>
            </Tile>
            <Tile style={{ background: '#fff' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tag type="purple">{t('admin.testCatalog.ranges.label.female', 'Female')}</Tag>
                <span style={{ fontSize: '12px', color: '#ae1a1a', fontWeight: 600 }}>⚠ 1 Issue Found</span>
              </div>
              <div style={{ background: '#fee5e5', border: '1px solid #f8b8b8', padding: '8px', borderRadius: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ae1a1a', marginBottom: '2px' }}>GAP</div>
                    <div style={{ fontSize: '13px', color: '#ae1a1a' }}>{t('admin.testCatalog.ranges.gap.boundary', 'Gap: 55 days to 1 year')}</div>
                  </div>
                  <Button
                    kind="tertiary"
                    size="sm"
                    onClick={() => setShowAddModal({ rangeType: 'normal', prefill: { sex: 'F', ageFrom: 55, ageFromUnit: 'days', ageTo: 1, ageToUnit: 'years', low: 1, high: 130, source: '3 days – 55 days range' } })}
                  >
                    {t('admin.testCatalog.ranges.action.fillGap', '+ Fill Gap')}
                  </Button>
                </div>
                <div style={{ fontSize: '11px', color: '#525252', marginTop: '6px' }}>
                  {t('admin.testCatalog.ranges.gap.suggestedValues', 'Suggested values from adjacent range: Low=1, High=130')}
                </div>
              </div>
            </Tile>
          </div>
        </Tile>
      )}

      {viewMode === 'structured' && (
        <Accordion>
          {rangeTypes.map(type => {
            const byType = ranges[type.id];
            const totalCount = Object.values(byType).reduce((sum, arr) => sum + arr.length, 0);
            return (
              <AccordionItem
                key={type.id}
                title={
                  <span style={{ display: 'inline-flex', gap: '12px', alignItems: 'center' }}>
                    <Tag type={type.kind}>{type.label}</Tag>
                    <span style={{ fontSize: '12px', color: '#525252', fontWeight: 'normal' }}>{type.desc}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#525252' }}>{totalCount} range(s)</span>
                  </span>
                }
              >
                {Object.keys(byType).map(sex => {
                  const sexRanges = byType[sex];
                  if (sexRanges.length === 0) return null;
                  return (
                    <div key={sex} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <Tag type={sexKinds[sex]}>{sexLabels[sex]}</Tag>
                        <span style={{ fontSize: '11px', color: '#525252' }}>({sexRanges.length} ranges)</span>
                        <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
                      </div>
                      {sexRanges.map((r, idx) => {
                        const lowPct = r.low !== null ? Math.max(0, Math.min(100, (r.low / 200) * 100)) : 0;
                        const highPct = r.high !== null ? Math.max(0, Math.min(100, (r.high / 200) * 100)) : 100;
                        return (
                          <div key={idx} style={{ padding: '8px', background: '#f9f9f9', border: '1px solid #e8e8e8', borderRadius: '3px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                            <span style={{ width: '16px', color: '#a8a8a8' }}>{idx + 1}.</span>
                            <div style={{ width: '160px' }}>
                              <div style={{ fontSize: '10px', color: '#525252' }}>Age Range</div>
                              <div style={{ fontWeight: 500 }}>{r.age}</div>
                            </div>
                            <div style={{ width: '60px' }}>
                              <div style={{ fontSize: '10px', color: '#525252' }}>Low</div>
                              <div style={{ fontWeight: 500 }}>{r.low !== null ? r.low : '—'}</div>
                            </div>
                            <div style={{ width: '60px' }}>
                              <div style={{ fontSize: '10px', color: '#525252' }}>High</div>
                              <div style={{ fontWeight: 500 }}>{r.high !== null ? r.high : '—'}</div>
                            </div>
                            <div style={{ flex: 1, height: '18px', background: '#e8e8e8', borderRadius: '3px', position: 'relative' }}>
                              {r.low !== null && r.high !== null && (
                                <div style={{ position: 'absolute', left: `${lowPct}%`, width: `${highPct - lowPct}%`, height: '100%', background: type.barColor, borderRadius: '3px' }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              <Button kind="ghost" size="sm" hasIconOnly iconDescription="Edit" renderIcon={Edit}><Edit /></Button>
                              <Button kind="ghost" size="sm" hasIconOnly iconDescription="Copy to other sex" renderIcon={Copy} onClick={() => setShowAddModal({ rangeType: type.id, prefill: { sex: sex === 'M' ? 'F' : 'M', age: r.age, low: r.low, high: r.high, source: `Copied from ${sexLabels[sex]}: ${r.age}` } })}><Copy /></Button>
                              <Button kind="ghost" size="sm" hasIconOnly iconDescription="Delete" renderIcon={TrashCan}><TrashCan /></Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setShowAddModal({ rangeType: type.id })}>
                  {t('admin.testCatalog.ranges.action.addToType', `Add ${type.label}`)}
                </Button>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      {viewMode === 'table' && (
        <DataTable
          headers={[
            { key: 'type', header: t('admin.testCatalog.ranges.column.type', 'Type') },
            { key: 'sex', header: t('admin.testCatalog.ranges.column.sex', 'Sex') },
            { key: 'age', header: t('admin.testCatalog.ranges.column.ageRange', 'Age Range') },
            { key: 'low', header: t('admin.testCatalog.ranges.column.low', 'Low') },
            { key: 'high', header: t('admin.testCatalog.ranges.column.high', 'High') },
            { key: 'actions', header: t('admin.testCatalog.ranges.column.actions', 'Actions') },
          ]}
          rows={allRangesFlat.map((r, i) => ({ id: String(i), ...r }))}
        >
          {({ headers, rows, getTableProps, getHeaderProps, getRowProps }) => (
            <TableContainer>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map(h => (
                      <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, idx) => {
                    const orig = allRangesFlat[idx];
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        <TableCell><Tag type={rangeTypes.find(t => t.id === orig.type).kind}>{orig.typeLabel}</Tag></TableCell>
                        <TableCell><Tag type={sexKinds[orig.sex]}>{sexLabels[orig.sex]}</Tag></TableCell>
                        <TableCell>{orig.age}</TableCell>
                        <TableCell>{orig.low !== null ? orig.low : '—'}</TableCell>
                        <TableCell>{orig.high !== null ? orig.high : '—'}</TableCell>
                        <TableCell>
                          <Button kind="ghost" size="sm">{t('admin.testCatalog.common.button.edit', 'Edit')}</Button>
                          <Button kind="ghost" size="sm" style={{ color: '#da1e28' }}>{t('admin.testCatalog.common.button.delete', 'Del')}</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}

      {viewMode === 'visual' && (
        <div>
          <Tile style={{ background: '#f4f4f4', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('admin.testCatalog.ranges.label.viewRangesFor', 'View ranges for:')}</span>
            <Select id="visualSex" labelText="" hideLabel value={visualSex} onChange={e => setVisualSex(e.target.value)} size="sm">
              <SelectItem value="M" text={t('admin.testCatalog.ranges.label.male', 'Male')} />
              <SelectItem value="F" text={t('admin.testCatalog.ranges.label.female', 'Female')} />
            </Select>
            <span style={{ fontSize: '13px' }}>{t('admin.testCatalog.ranges.label.age', 'Age:')}</span>
            <NumberInput id="visualAge" hideLabel label="" value={visualAge} onChange={(_, { value }) => setVisualAge(value)} min={0} size="sm" style={{ width: '80px' }} />
            <Select id="visualUnit" labelText="" hideLabel value={visualUnit} onChange={e => setVisualUnit(e.target.value)} size="sm">
              <SelectItem value="hours" text="hours" />
              <SelectItem value="days" text="days" />
              <SelectItem value="weeks" text="weeks" />
              <SelectItem value="months" text="months" />
              <SelectItem value="years" text="years" />
            </Select>
          </Tile>

          <Tile style={{ background: '#f9f9f9', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', marginBottom: '16px' }}>
              {t('admin.testCatalog.ranges.label.showingRangesFor', 'Showing ranges applicable to:')} <strong>{sexLabels[visualSex]}, {visualAge} {visualUnit} old</strong>
            </div>
            {[
              { id: 'valid', label: t('admin.testCatalog.ranges.label.valid', 'Valid'), barColor: '#bce5fe', textColor: '#003da5' },
              { id: 'normal', label: t('admin.testCatalog.ranges.label.normal', 'Normal'), barColor: '#a7f0ba', textColor: '#0d6f1f' },
              { id: 'critical', label: t('admin.testCatalog.ranges.label.critical', 'Critical'), barColor: '#f8b8b8', textColor: '#ae1a1a' },
              { id: 'reporting', label: t('admin.testCatalog.ranges.label.reporting', 'Reporting'), barColor: '#e0c3fc', textColor: '#6e008d' },
            ].map(({ id, label, barColor, textColor }) => {
              const r = getApplicableRange(id);
              const lowPct = r && r.low !== null ? Math.max(0, Math.min(100, (r.low / 200) * 100)) : 0;
              const highPct = r && r.high !== null ? Math.max(0, Math.min(100, (r.high / 200) * 100)) : 100;
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '90px', fontSize: '13px', fontWeight: 500 }}>{label}</div>
                  <div style={{ flex: 1, height: '32px', background: '#e8e8e8', borderRadius: '3px', position: 'relative' }}>
                    {r ? (
                      <>
                        {r.low !== null && r.high !== null && (
                          <div style={{ position: 'absolute', left: `${lowPct}%`, width: `${highPct - lowPct}%`, height: '100%', background: barColor, borderRadius: '3px' }} />
                        )}
                        {r.low === null && r.high !== null && (
                          <div style={{ position: 'absolute', left: 0, width: `${highPct}%`, height: '100%', background: barColor, borderTopLeftRadius: '3px', borderBottomLeftRadius: '3px' }} />
                        )}
                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 500, color: textColor }}>
                          {r.low ?? '—'} – {r.high ?? '—'}
                        </span>
                      </>
                    ) : (
                      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontStyle: 'italic', color: '#a8a8a8' }}>
                        {t('admin.testCatalog.ranges.label.notDefinedForDemographic', 'Not defined for this demographic')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid #e0e0e0', marginTop: '12px' }}>
              {[{ c: '#bce5fe', l: 'Valid' }, { c: '#a7f0ba', l: 'Normal' }, { c: '#f8b8b8', l: 'Critical' }, { c: '#e0c3fc', l: 'Reporting' }].map(x => (
                <div key={x.l} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <div style={{ width: '14px', height: '14px', background: x.c, borderRadius: '2px' }} />
                  <span style={{ fontSize: '11px', color: '#525252' }}>{x.l}</span>
                </div>
              ))}
            </div>
          </Tile>
        </div>
      )}

      <Button kind="primary" renderIcon={Add} onClick={() => setShowAddModal({ rangeType: 'normal' })} style={{ marginTop: '16px' }}>
        {t('admin.testCatalog.ranges.action.addRange', 'Add Range')}
      </Button>

      {showAddModal && (
        <Modal
          open={!!showAddModal}
          onRequestClose={() => setShowAddModal(null)}
          modalHeading={t('admin.testCatalog.ranges.modal.addRange', `Add ${rangeTypes.find(t => t.id === showAddModal.rangeType)?.label || 'Range'}`)}
          primaryButtonText={t('admin.testCatalog.common.button.add', 'Add Range')}
          secondaryButtonText={t('admin.testCatalog.common.button.cancel', 'Cancel')}
        >
          {showAddModal.prefill?.source && (
            <InlineNotification kind="info" lowContrast title="" subtitle={`Values from: ${showAddModal.prefill.source}`} hideCloseButton style={{ marginBottom: '16px' }} />
          )}
          <FormGroup legendText={t('admin.testCatalog.ranges.label.appliesTo', 'Applies To')} style={{ marginBottom: '16px' }}>
            <RadioButtonGroup name="sex" valueSelected={showAddModal.prefill?.sex || 'A'} orientation="horizontal">
              <RadioButton labelText={t('admin.testCatalog.ranges.label.allSexes', 'All')} value="A" />
              <RadioButton labelText={t('admin.testCatalog.ranges.label.maleOnly', 'Male Only')} value="M" />
              <RadioButton labelText={t('admin.testCatalog.ranges.label.femaleOnly', 'Female Only')} value="F" />
            </RadioButtonGroup>
          </FormGroup>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <NumberInput id="ageFrom" label={t('admin.testCatalog.ranges.label.ageFrom', 'Age From')} value={showAddModal.prefill?.ageFrom ?? 0} min={0} />
            <NumberInput id="ageTo" label={t('admin.testCatalog.ranges.label.ageTo', 'Age To')} value={showAddModal.prefill?.ageTo ?? 999} min={0} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <NumberInput id="low" label={showAddModal.rangeType === 'critical' ? t('admin.testCatalog.ranges.label.criticalLow', 'Critical Low') : t('admin.testCatalog.ranges.label.low', 'Low')} value={showAddModal.prefill?.low ?? ''} placeholder={showAddModal.rangeType === 'critical' ? 'Leave blank if N/A' : '0'} />
            <NumberInput id="high" label={showAddModal.rangeType === 'critical' ? t('admin.testCatalog.ranges.label.criticalHigh', 'Critical High') : t('admin.testCatalog.ranges.label.high', 'High')} value={showAddModal.prefill?.high ?? ''} placeholder={showAddModal.rangeType === 'critical' ? 'Leave blank if N/A' : '100'} />
          </div>
        </Modal>
      )}
    </div>
  );
}

/**
 * SampleStorageSection — storage conditions, duration, disposal, special handling, override restricted, quick reference
 */
function SampleStorageSection() {
  const [overrideRestricted, setOverrideRestricted] = useState(false);
  const handlingOptions = [
    'Protect from light', 'Do not freeze', 'Do not refrigerate',
    'Keep upright', 'Centrifuge before storage', 'Aliquot before storage',
  ];

  return (
    <div>
      <h2>{t('admin.testCatalog.sampleStorage.header.title', 'Sample Storage')}</h2>
      <p>{t('admin.testCatalog.sampleStorage.header.subtitle', 'Define recommended storage conditions, duration, disposal, and special handling')}</p>

      <Tile style={{ marginBottom: '16px' }}>
        <h4 style={{ marginTop: 0 }}>{t('admin.testCatalog.sampleStorage.header.storageRequirements', 'Storage Requirements')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Select id="storage-conditions" labelText={t('admin.testCatalog.sampleStorage.label.storageConditions', 'Storage Conditions') + ' *'} defaultValue="refrigerator">
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.ultraLowFreezer', 'Ultra-low freezer (-80°C to -60°C)')} value="ultra-low" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.freezer', 'Freezer (-30°C to -15°C)')} value="freezer" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.refrigerator', 'Refrigerator (2°C to 8°C)')} value="refrigerator" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.coldRoom', 'Cold room (4°C to 8°C)')} value="cold-room" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.coolRoom', 'Cool room (15°C to 18°C)')} value="cool-room" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.roomTemp', 'Room temperature (18°C to 25°C)')} value="room-temp" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.controlledRoomTemp', 'Controlled room temp (20°C to 25°C)')} value="controlled-room" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.warmIncubator', 'Warm incubator (35°C to 37°C)')} value="warm-incubator" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.ambient', 'Ambient (uncontrolled)')} value="ambient" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.custom', 'Custom (specify below)')} value="custom" />
          </Select>
          <TextInput id="custom-storage" labelText={t('admin.testCatalog.sampleStorage.label.customStorage', 'Custom Storage Conditions')} placeholder="e.g., 2-8°C, protected from light" />
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>{t('admin.testCatalog.sampleStorage.label.maximumStorageDuration', 'Maximum Storage Duration *')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <NumberInput id="duration" hideLabel label="" defaultValue={72} min={1} style={{ flex: 1 }} />
              <Select id="duration-unit" labelText="" hideLabel defaultValue="hours" style={{ width: '120px' }}>
                <SelectItem text="Hours" value="hours" />
                <SelectItem text="Days" value="days" />
                <SelectItem text="Weeks" value="weeks" />
                <SelectItem text="Months" value="months" />
              </Select>
            </div>
          </div>
          <TextInput id="stability" labelText={t('admin.testCatalog.sampleStorage.label.stabilityNotes', 'Stability Notes')} placeholder="e.g., Stable for 7 days refrigerated" />
        </div>

        <FormGroup legendText={t('admin.testCatalog.sampleStorage.label.specialHandling', 'Special Handling Requirements')}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {handlingOptions.map(opt => (
              <Checkbox key={opt} id={`handling-${opt.replace(/\s+/g, '-')}`} labelText={opt} />
            ))}
          </div>
        </FormGroup>
      </Tile>

      <Tile style={{ marginBottom: '16px' }}>
        <h4 style={{ marginTop: 0, color: '#da1e28' }}>{t('admin.testCatalog.sampleStorage.header.disposalRequirements', 'Disposal Requirements')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Select id="disposal-method" labelText={t('admin.testCatalog.sampleStorage.label.disposalMethod', 'Disposal Method *')}>
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.biohazardWaste', 'Biohazard/Infectious waste bin')} value="biohazard" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.sharps', 'Sharps container')} value="sharps" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.chemicalDeactivation', 'Chemical deactivation')} value="chemical" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.incineration', 'Incineration')} value="incineration" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.autoclave', 'Autoclave then general waste')} value="autoclave" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.pharmaceutical', 'Pharmaceutical waste')} value="pharma" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.radioactive', 'Radioactive waste')} value="radioactive" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.generalWaste', 'General waste (non-hazardous only)')} value="general" />
            <SelectItem text={t('admin.testCatalog.sampleStorage.option.returnToManufacturer', 'Return to manufacturer')} value="return" />
          </Select>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', display: 'block' }}>{t('admin.testCatalog.sampleStorage.label.disposalTimeframe', 'Disposal Timeframe')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <NumberInput id="disposal-tf" hideLabel label="" placeholder="e.g., 7" min={1} style={{ flex: 1 }} />
              <Select id="disposal-unit" labelText="" hideLabel defaultValue="days" style={{ width: '120px' }}>
                <SelectItem text="Days" value="days" />
                <SelectItem text="Weeks" value="weeks" />
                <SelectItem text="Months" value="months" />
              </Select>
            </div>
          </div>
        </div>
      </Tile>

      <Tile style={{ marginBottom: '16px' }}>
        <h4 style={{ marginTop: 0, color: '#a18217' }}>{t('admin.testCatalog.sampleStorage.header.specialInstructions', 'Special Instructions')}</h4>
        <TextArea id="special-instructions" labelText="" hideLabel rows={4} placeholder={t('admin.testCatalog.sampleStorage.placeholder.specialInstructions', "Enter any special instructions that don't fit in the fields above...")} />
      </Tile>

      <Tile style={{ marginBottom: '16px', borderColor: overrideRestricted ? '#da1e28' : undefined }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Checkbox id="override-restricted" checked={overrideRestricted} onChange={(_, { checked }) => setOverrideRestricted(checked)} labelText="" hideLabel />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <strong style={{ fontSize: '14px' }}>{t('admin.testCatalog.sampleStorage.label.overrideRestricted', 'Override Restricted')}</strong>
              <Tag type="red">{t('admin.testCatalog.sampleStorage.label.locked', 'Locked')}</Tag>
            </div>
            <p style={{ fontSize: '13px', color: '#525252', margin: 0 }}>
              {t('admin.testCatalog.sampleStorage.helper.overrideRestricted', 'When enabled, order entry staff cannot modify storage or disposal requirements for this test. Use for critical tests where sample handling must be strictly controlled (e.g., HIV, controlled substances).')}
            </p>
            {overrideRestricted && (
              <InlineNotification kind="error" lowContrast title="" subtitle={t('admin.testCatalog.sampleStorage.notification.locked', 'Storage and disposal settings are locked. Only Lab Managers can modify these requirements.')} hideCloseButton style={{ marginTop: '12px' }} />
            )}
          </div>
        </div>
      </Tile>

      <Tile style={{ background: 'linear-gradient(to right, #e3f2fd, #d1f3f6)' }}>
        <h4 style={{ marginTop: 0 }}>{t('admin.testCatalog.sampleStorage.header.quickReference', 'Storage Condition Quick Reference')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px' }}>
          {[
            { name: 'Ultra-low Freezer', range: '-80°C to -60°C' },
            { name: 'Freezer', range: '-30°C to -15°C' },
            { name: 'Refrigerator', range: '2°C to 8°C' },
            { name: 'Cool Room', range: '15°C to 18°C' },
            { name: 'Room Temperature', range: '18°C to 25°C' },
            { name: 'Warm Incubator', range: '35°C to 37°C' },
          ].map(c => (
            <div key={c.name}>
              <strong>{c.name}</strong>
              <div style={{ color: '#525252' }}>{c.range}</div>
            </div>
          ))}
        </div>
      </Tile>
    </div>
  );
}

/**
 * DisplayOrderSection — drag-and-drop test reorder within selected sample type
 */
function DisplayOrderSection() {
  const [sampleType, setSampleType] = useState('serum');
  const [tests, setTests] = useState([
    { id: 1, name: 'Glucose, Fasting' },
    { id: 2, name: 'Hemoglobin A1c' },
    { id: 3, name: 'Creatinine' },
    { id: 4, name: 'BUN' },
    { id: 5, name: 'ALT (SGPT)' },
    { id: 6, name: 'AST (SGOT)' },
    { id: 7, name: 'Bilirubin, Total' },
    { id: 8, name: 'Albumin' },
  ]);

  const move = (idx, delta) => {
    if (idx + delta < 0 || idx + delta >= tests.length) return;
    const next = [...tests];
    [next[idx], next[idx + delta]] = [next[idx + delta], next[idx]];
    setTests(next);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.displayOrder.header.title', 'Test Display Order')}</h2>
          <p>{t('admin.testCatalog.displayOrder.header.subtitle', 'Drag and drop to reorder tests for this sample type')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px' }}>{t('admin.testCatalog.displayOrder.label.sampleType', 'Sample Type:')}</span>
          <Select id="sample-type" labelText="" hideLabel value={sampleType} onChange={e => setSampleType(e.target.value)} size="sm">
            <SelectItem value="serum" text="Serum" />
            <SelectItem value="plasma" text="Plasma" />
            <SelectItem value="whole_blood" text="Whole Blood" />
            <SelectItem value="urine" text="Urine" />
          </Select>
        </div>
      </div>

      {tests.map((test, idx) => (
        <Tile key={test.id} style={{ marginBottom: '8px', cursor: 'move' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Draggable size={16} style={{ color: '#a8a8a8' }} />
            <span style={{ width: '28px', color: '#525252', fontSize: '13px', fontWeight: 600 }}>{idx + 1}.</span>
            <span style={{ flex: 1, fontWeight: 500 }}>{test.name}</span>
            <Button kind="ghost" size="sm" hasIconOnly iconDescription="Move up" disabled={idx === 0} onClick={() => move(idx, -1)} renderIcon={ChevronUp}><ChevronUp /></Button>
            <Button kind="ghost" size="sm" hasIconOnly iconDescription="Move down" disabled={idx === tests.length - 1} onClick={() => move(idx, 1)} renderIcon={ChevronDown}><ChevronDown /></Button>
          </div>
        </Tile>
      ))}

      <p style={{ fontSize: '12px', color: '#525252', marginTop: '16px' }}>
        {t('admin.testCatalog.displayOrder.helper.orderInfo', 'This order determines how tests appear in order entry and result entry for the selected sample type.')}
      </p>
    </div>
  );
}

/**
 * PanelsSection — selectable panel cards with expandable position editor and inline panel creation
 */
function PanelsSection() {
  const [showCreate, setShowCreate] = useState(false);
  const [newPanelName, setNewPanelName] = useState('');
  const [selected, setSelected] = useState({ 1: 3, 3: 2 });
  const [expanded, setExpanded] = useState(null);

  const panels = [
    { id: 1, name: 'Basic Metabolic Panel', count: 8, tests: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium'] },
    { id: 2, name: 'Comprehensive Metabolic Panel', count: 14, tests: ['Glucose', 'BUN', 'Creatinine', 'Sodium', 'Potassium', 'Chloride', 'CO2', 'Calcium', 'Total Protein', 'Albumin', 'Bilirubin', 'ALP', 'AST', 'ALT'] },
    { id: 3, name: 'Lipid Panel', count: 4, tests: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'] },
    { id: 4, name: 'Liver Function Panel', count: 7, tests: ['Total Protein', 'Albumin', 'Bilirubin Total', 'Bilirubin Direct', 'ALP', 'AST', 'ALT'] },
    { id: 5, name: 'Renal Function Panel', count: 5, tests: ['BUN', 'Creatinine', 'eGFR', 'BUN/Creatinine Ratio', 'Uric Acid'] },
    { id: 6, name: 'Thyroid Panel', count: 3, tests: ['TSH', 'Free T4', 'Free T3'] },
  ];

  const togglePanel = (id, count) => {
    setSelected(prev => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
        setExpanded(null);
      } else {
        next[id] = count + 1;
        setExpanded(id);
      }
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.panels.header.title', 'Panel Membership')}</h2>
          <p>{t('admin.testCatalog.panels.header.subtitle', 'Select which panels should include this test and set display order')}</p>
        </div>
        <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setShowCreate(!showCreate)}>
          {t('admin.testCatalog.panels.action.createNew', 'Create New Panel')}
        </Button>
      </div>

      {showCreate && (
        <Tile style={{ background: '#e3f2fd', borderColor: '#0f62fe', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' }}>
            {t('admin.testCatalog.panels.label.newPanelName', 'New Panel Name')}
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <TextInput id="new-panel-name" labelText="" hideLabel value={newPanelName} onChange={e => setNewPanelName(e.target.value)} placeholder="Enter panel name..." style={{ flex: 1 }} />
            <Button kind="primary" size="sm" onClick={() => { setShowCreate(false); setNewPanelName(''); }}>{t('admin.testCatalog.common.button.create', 'Create')}</Button>
            <Button kind="secondary" size="sm" onClick={() => { setShowCreate(false); setNewPanelName(''); }}>{t('admin.testCatalog.common.button.cancel', 'Cancel')}</Button>
          </div>
        </Tile>
      )}

      {panels.map(p => {
        const isSelected = selected[p.id] !== undefined;
        const pos = selected[p.id] || (p.count + 1);
        const isExpanded = expanded === p.id;
        return (
          <Tile key={p.id} style={{ marginBottom: '12px', borderColor: isSelected ? '#0f62fe' : '#e0e0e0', borderWidth: isSelected ? 2 : 1, background: isSelected ? '#e3f2fd' : '#fff', padding: 0 }}>
            <div style={{ padding: '12px', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }} onClick={() => togglePanel(p.id, p.count)}>
              <Checkbox id={`panel-${p.id}`} checked={isSelected} onChange={() => {}} labelText="" hideLabel />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#525252' }}>{p.count} {t('admin.testCatalog.panels.label.tests', 'tests')}</div>
              </div>
              {isSelected && <Tag type="blue">{t('admin.testCatalog.panels.label.position', 'Position:')} {pos}</Tag>}
              {isSelected && (
                <Button kind="ghost" size="sm" hasIconOnly iconDescription="Toggle" onClick={e => { e.stopPropagation(); setExpanded(isExpanded ? null : p.id); }} renderIcon={isExpanded ? ChevronUp : ChevronDown}>
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
              )}
            </div>
            {isSelected && isExpanded && (
              <div style={{ borderTop: '1px solid #c6daf8', padding: '12px', background: '#fff', display: 'flex', gap: '16px' }}>
                <div style={{ width: '200px' }}>
                  <NumberInput id={`pos-${p.id}`} label={t('admin.testCatalog.panels.label.displayPosition', 'Display Position in Panel')} value={pos} min={1} max={p.count + 1} onChange={(_, { value }) => setSelected(prev => ({ ...prev, [p.id]: value || 1 }))} />
                  <small style={{ fontSize: '11px', color: '#a8a8a8', display: 'block', marginTop: '8px' }}>
                    {t('admin.testCatalog.panels.helper.orderInput', 'Enter a number or drag the test in the preview list')}
                  </small>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    {t('admin.testCatalog.panels.label.previewListHeader', 'Panel Test Order Preview')} <span style={{ color: '#a8a8a8', fontWeight: 'normal' }}>{t('admin.testCatalog.panels.helper.dragToReorder', '— drag to reorder')}</span>
                  </label>
                  <div style={{ background: '#fff', border: '1px solid #d0d0d0', borderRadius: '4px', padding: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                    {(() => {
                      const items = [];
                      p.tests.forEach((test, idx) => {
                        const position = idx + 1;
                        if (position === pos) {
                          items.push(
                            <div key={`this-${idx}`} style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 8px', background: '#bce5fe', border: '2px dashed #0f62fe', borderRadius: '3px', marginBottom: '2px', fontWeight: 600, color: '#003da5' }}>
                              <Draggable size={12} />
                              <span style={{ width: '20px' }}>{pos}.</span>
                              <span style={{ flex: 1 }}>{t('admin.testCatalog.panels.label.thisTest', '← THIS TEST')}</span>
                            </div>
                          );
                        }
                        items.push(
                          <div key={`row-${idx}`} style={{ display: 'flex', gap: '6px', padding: '4px 8px', fontSize: '12px' }}>
                            <span style={{ width: '20px', color: '#a8a8a8', marginLeft: '16px' }}>{position >= pos ? position + 1 : position}.</span>
                            <span>{test}</span>
                          </div>
                        );
                      });
                      if (pos > p.count) {
                        items.push(
                          <div key="this-end" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 8px', background: '#bce5fe', border: '2px dashed #0f62fe', borderRadius: '3px', marginTop: '2px', fontWeight: 600, color: '#003da5' }}>
                            <Draggable size={12} />
                            <span style={{ width: '20px' }}>{pos}.</span>
                            <span style={{ flex: 1 }}>{t('admin.testCatalog.panels.label.thisTest', '← THIS TEST')}</span>
                          </div>
                        );
                      }
                      return items;
                    })()}
                  </div>
                </div>
              </div>
            )}
          </Tile>
        );
      })}
    </div>
  );
}

/**
 * LabelsSection — label preset DataTable + Order Entry preview
 */
function LabelsSection() {
  const [allowOverride, setAllowOverride] = useState(true);
  const [labels] = useState([
    { id: 1, presetName: 'Specimen Label (50×25mm)', defaultQty: 1, maxQty: 5, allowOverride: true },
    { id: 2, presetName: 'Block Label (26×12mm)', defaultQty: 4, maxQty: 20, allowOverride: true },
    { id: 3, presetName: 'Slide Label (76×26mm)', defaultQty: 12, maxQty: 50, allowOverride: true },
    { id: 4, presetName: 'Freezer Label (38×19mm)', defaultQty: 2, maxQty: 10, allowOverride: false },
  ]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.labels.header.title', 'Default Labels for This Test')}</h2>
          <p>{t('admin.testCatalog.labels.header.subtitle', 'When this test is ordered, automatically suggest these labels')}</p>
        </div>
        <Button kind="primary" size="sm" renderIcon={Add}>
          {t('admin.testCatalog.labels.action.addLabelType', 'Add Label Type')}
        </Button>
      </div>

      <DataTable
        headers={[
          { key: 'preset', header: t('admin.testCatalog.labels.column.preset', 'Label Preset') },
          { key: 'defaultQty', header: t('admin.testCatalog.labels.column.defaultQty', 'Default Qty') },
          { key: 'maxQty', header: t('admin.testCatalog.labels.column.maxQty', 'Max Qty') },
          { key: 'allowOverride', header: t('admin.testCatalog.labels.column.allowOverride', 'Allow Override') },
          { key: 'actions', header: '' },
        ]}
        rows={labels.map(l => ({ id: String(l.id), ...l, preset: l.presetName }))}
      >
        {({ headers, rows, getTableProps, getHeaderProps }) => (
          <TableContainer>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>{headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow>
              </TableHead>
              <TableBody>
                {labels.map(l => (
                  <TableRow key={l.id}>
                    <TableCell>{l.presetName}</TableCell>
                    <TableCell><NumberInput id={`def-${l.id}`} hideLabel label="" defaultValue={l.defaultQty} min={1} size="sm" /></TableCell>
                    <TableCell><NumberInput id={`max-${l.id}`} hideLabel label="" defaultValue={l.maxQty} min={1} size="sm" /></TableCell>
                    <TableCell><Checkbox id={`ovr-${l.id}`} defaultChecked={l.allowOverride} labelText="" hideLabel /></TableCell>
                    <TableCell><Button kind="ghost" size="sm" hasIconOnly iconDescription="Delete" renderIcon={TrashCan}><TrashCan /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <Tile style={{ marginTop: '16px' }}>
        <h4 style={{ marginTop: 0 }}>{t('admin.testCatalog.labels.header.generationSettings', 'Label Generation Settings')}</h4>
        <Toggle id="allow-override" labelText={t('admin.testCatalog.labels.label.allowCountOverride', 'Allow label count override at order entry')} toggled={allowOverride} onToggle={setAllowOverride} />
        <small style={{ display: 'block', fontSize: '12px', color: '#525252', marginTop: '8px' }}>
          {t('admin.testCatalog.labels.helper.allowOverride', 'When enabled, users can modify label quantities during order entry. Individual label types can still be locked via the "Allow Override" column above.')}
        </small>
      </Tile>

      <Tile style={{ background: '#e3f2fd', borderColor: '#a8d8e8' }}>
        <h4 style={{ marginTop: 0, color: '#003da5' }}>{t('admin.testCatalog.labels.header.orderEntryPreview', 'Order Entry Preview')}</h4>
        <p style={{ fontSize: '13px', color: '#003da5', marginBottom: '12px' }}>
          {t('admin.testCatalog.labels.helper.orderEntryPreview', 'When this test is ordered, the Labels section will be pre-populated as follows:')}
        </p>
        <Tile style={{ background: '#fff' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{t('admin.testCatalog.labels.column.labelType', 'Label Type')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.labels.column.qty', 'Qty')}</TableHeader>
                <TableHeader>{t('admin.testCatalog.labels.column.source', 'Source')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {labels.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.presetName}</TableCell>
                  <TableCell>{l.allowOverride ? l.defaultQty : <Tag type="gray">{l.defaultQty}</Tag>}</TableCell>
                  <TableCell style={{ fontSize: '12px', color: '#525252' }}>{t('admin.testCatalog.labels.label.thisTest', 'This test')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Tile>
        <small style={{ display: 'block', fontSize: '12px', color: '#525252', marginTop: '8px' }}>
          ⚠ {t('admin.testCatalog.labels.helper.lockedNote', 'Gray quantities are locked and cannot be modified at order entry')}
        </small>
      </Tile>
    </div>
  );
}

/**
 * TerminologySection — LOINC/SNOMED/CIEL/OCL mappings list with inline Add Mapping form
 */
function TerminologySection() {
  const [mappings] = useState([
    { id: 1, source: 'LOINC', code: '1558-6', relationship: 'SAME_AS', displayName: 'Fasting glucose [Mass/volume] in Serum or Plasma' },
    { id: 2, source: 'SNOMED', code: '271062006', relationship: 'SAME_AS', displayName: 'Fasting blood glucose measurement' },
  ]);
  const sourceTagKind = { LOINC: 'blue', SNOMED: 'teal', CIEL: 'purple', OCL: 'warm-gray' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.terminology.header.title', 'Terminology Mappings')}</h2>
          <p>{t('admin.testCatalog.terminology.header.subtitle', 'Link this test to standard terminology codes for FHIR interoperability')}</p>
        </div>
        <Button kind="ghost" size="sm" renderIcon={Add}>{t('admin.testCatalog.terminology.action.addMapping', 'Add Mapping')}</Button>
      </div>

      {mappings.map(m => (
        <Tile key={m.id} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <Tag type={sourceTagKind[m.source]}>{m.source}</Tag>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <code style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{m.code}</code>
                  <Tag type="warm-gray">{m.relationship.replace('_', ' ')}</Tag>
                </div>
                <div style={{ fontSize: '13px', color: '#525252' }}>{m.displayName}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button kind="ghost" size="sm">{t('admin.testCatalog.common.button.edit', 'Edit')}</Button>
              <Button kind="ghost" size="sm" style={{ color: '#da1e28' }}>{t('admin.testCatalog.common.button.delete', 'Delete')}</Button>
            </div>
          </div>
        </Tile>
      ))}

      <Tile style={{ borderStyle: 'dashed' }}>
        <h4 style={{ marginTop: 0, fontSize: '13px' }}>{t('admin.testCatalog.terminology.header.addNewMapping', 'Add New Mapping')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 180px 80px', gap: '8px', alignItems: 'end' }}>
          <Select id="term-source" labelText={t('admin.testCatalog.terminology.label.source', 'Terminology Source')} size="sm">
            <SelectItem text={t('admin.testCatalog.common.option.select', 'Select...')} value="" />
            <SelectItem text="LOINC" value="LOINC" />
            <SelectItem text="SNOMED CT" value="SNOMED" />
            <SelectItem text="CIEL" value="CIEL" />
            <SelectItem text="OCL" value="OCL" />
          </Select>
          <TextInput id="term-code" labelText={t('admin.testCatalog.terminology.label.code', 'Code')} placeholder={t('admin.testCatalog.terminology.placeholder.code', 'Enter code')} size="sm" />
          <Select id="term-rel" labelText={t('admin.testCatalog.terminology.label.relationship', 'Relationship')} size="sm">
            <SelectItem text={t('admin.testCatalog.terminology.option.sameAs', 'Same As')} value="SAME_AS" />
            <SelectItem text={t('admin.testCatalog.terminology.option.broaderThan', 'Broader Than')} value="BROADER_THAN" />
            <SelectItem text={t('admin.testCatalog.terminology.option.narrowerThan', 'Narrower Than')} value="NARROWER_THAN" />
          </Select>
          <Button kind="primary" size="sm">{t('admin.testCatalog.common.button.add', 'Add')}</Button>
        </div>
        <small style={{ display: 'block', fontSize: '11px', color: '#a8a8a8', marginTop: '8px' }}>
          {t('admin.testCatalog.terminology.helper.lookup', 'Display name will be auto-populated from terminology lookup; editable if lookup fails.')}
        </small>
      </Tile>
    </div>
  );
}

/**
 * ReagentsSection — reagent cards with usage type, qty per test, current stock
 */
function ReagentsSection() {
  const reagents = [
    { id: 1, name: 'Glucose Reagent R1', manufacturer: 'Roche', usage: 'PRIMARY', qty: 100, unit: 'µL', stock: 2500 },
    { id: 2, name: 'Glucose Reagent R2', manufacturer: 'Roche', usage: 'SECONDARY', qty: 50, unit: 'µL', stock: 1200 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.reagents.header.title', 'Associated Reagents')}</h2>
          <p>{t('admin.testCatalog.reagents.header.subtitle', 'Link reagents from inventory to track consumption')}</p>
        </div>
        <Button kind="primary" size="sm" renderIcon={Add}>{t('admin.testCatalog.reagents.action.linkReagent', 'Link Reagent')}</Button>
      </div>

      {reagents.map(r => (
        <Tile key={r.id} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#d1f3f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px' }}>{r.name}</strong>
                <Tag type={r.usage === 'PRIMARY' ? 'blue' : 'green'}>{r.usage}</Tag>
              </div>
              <div style={{ fontSize: '13px', color: '#525252' }}>{r.manufacturer} • {r.qty} {r.unit} per test</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>{r.stock.toLocaleString()} {r.unit}</div>
              <div style={{ fontSize: '11px', color: '#525252' }}>{t('admin.testCatalog.reagents.label.currentStock', 'Current Stock')}</div>
            </div>
            <Button kind="ghost" size="sm" hasIconOnly iconDescription="Unlink" renderIcon={Close} style={{ color: '#da1e28' }}><Close /></Button>
          </div>
        </Tile>
      ))}

      <InlineNotification kind="info" lowContrast title="" subtitle={t('admin.testCatalog.reagents.notification.configuredIn', 'Reagents are configured in Administration → Master Lists → Reagents. Linking a reagent here records consumption per test run for inventory tracking.')} hideCloseButton />
    </div>
  );
}

/**
 * AnalyzersSection — analyzer cards with status badges + Link Analyzer modal with multi-select
 */
function AnalyzersSection() {
  const [showLink, setShowLink] = useState(false);
  const linked = [
    { id: 1, name: 'Cobas c 501', manufacturer: 'Roche', sn: 'SN-2024-0142', location: 'Chemistry Lab A', status: 'Online' },
    { id: 2, name: 'Cobas c 502', manufacturer: 'Roche', sn: 'SN-2024-0143', location: 'Chemistry Lab B', status: 'Online' },
  ];
  const available = [
    { id: 3, name: 'AU680', manufacturer: 'Beckman Coulter', sn: 'SN-2023-0098', location: 'Chemistry Lab A', status: 'Online' },
    { id: 4, name: 'Architect c8000', manufacturer: 'Abbott', sn: 'SN-2022-0456', location: 'Chemistry Lab C', status: 'Maintenance' },
    { id: 5, name: 'Vitros 5600', manufacturer: 'Ortho Clinical', sn: 'SN-2024-0201', location: 'STAT Lab', status: 'Online' },
  ];
  const statusKind = { Online: 'green', Maintenance: 'warm-gray', Offline: 'red' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.analyzers.header.title', 'Linked Analyzers')}</h2>
          <p>{t('admin.testCatalog.analyzers.header.subtitle', 'Select which analyzers can perform this test')}</p>
        </div>
        <Button kind="primary" size="sm" renderIcon={Add} onClick={() => setShowLink(true)}>{t('admin.testCatalog.analyzers.action.linkAnalyzer', 'Link Analyzer')}</Button>
      </div>

      {linked.map(a => (
        <Tile key={a.id} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#e8e8e8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px' }}>{a.name}</strong>
                <Tag type={statusKind[a.status]}>{a.status}</Tag>
              </div>
              <div style={{ fontSize: '13px', color: '#525252' }}>{a.manufacturer} • {a.location}</div>
              <div style={{ fontSize: '11px', color: '#a8a8a8', marginTop: '2px' }}>S/N: {a.sn}</div>
            </div>
            <Button kind="ghost" size="sm" hasIconOnly iconDescription="Unlink" renderIcon={Close} style={{ color: '#da1e28' }}><Close /></Button>
          </div>
        </Tile>
      ))}

      <InlineNotification kind="info" lowContrast title={t('admin.testCatalog.analyzers.notification.title', 'About Analyzer Linking')} subtitle={t('admin.testCatalog.analyzers.notification.body', 'Analyzers are configured in Administration → Master Lists → Analyzers. Test code mapping is configured separately in the analyzer interface setup. Linking an analyzer indicates this test can be performed on that instrument.')} hideCloseButton />

      {showLink && (
        <Modal
          open={showLink}
          onRequestClose={() => setShowLink(false)}
          modalHeading={t('admin.testCatalog.analyzers.modal.linkAnalyzer', 'Link Analyzers')}
          primaryButtonText={t('admin.testCatalog.analyzers.action.linkSelected', 'Link Selected')}
          secondaryButtonText={t('admin.testCatalog.common.button.cancel', 'Cancel')}
        >
          <FormGroup legendText={t('admin.testCatalog.analyzers.label.selectAnalyzers', 'Select Analyzers')}>
            <div style={{ border: '1px solid #d0d0d0', borderRadius: '4px', maxHeight: '280px', overflowY: 'auto' }}>
              {available.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                  <Checkbox id={`avail-${a.id}`} labelText="" hideLabel />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px' }}>{a.name}</strong>
                      <Tag type={statusKind[a.status]}>{a.status}</Tag>
                    </div>
                    <div style={{ fontSize: '12px', color: '#525252' }}>{a.manufacturer} • {a.location}</div>
                  </div>
                </div>
              ))}
            </div>
          </FormGroup>
        </Modal>
      )}
    </div>
  );
}

/**
 * AlertsSection — alert rule cards with channels, recipients, message templates + Add Rule modal (4 trigger types only)
 */
function AlertsSection() {
  const [showAdd, setShowAdd] = useState(false);
  const [rules, setRules] = useState([
    { id: 1, name: 'Critical Value Alert', enabled: true, trigger: 'Critical Value', triggerKind: 'red', channels: ['SMS', 'Email'], recipients: ['Ordering Physician'], smsTemplate: 'CRITICAL: {{test_name}} result {{result}} {{unit}} for {{patient_name}}. Please review immediately.' },
    { id: 2, name: 'Abnormal Result Notification', enabled: true, trigger: 'Abnormal (High or Low)', triggerKind: 'warm-gray', channels: ['Email'], recipients: ['Ordering Physician'], smsTemplate: '' },
    { id: 3, name: 'Positive Result Alert', enabled: false, trigger: 'Equals "Positive"', triggerKind: 'blue', channels: ['SMS'], recipients: ['Patient'], smsTemplate: 'Lab result ready for {{patient_name}}. Please contact your healthcare provider.' },
  ]);
  const channelKind = { SMS: 'blue', Email: 'purple' };
  const toggle = id => setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.alerts.header.title', 'Alert Rules')}</h2>
          <p>{t('admin.testCatalog.alerts.header.subtitle', 'Configure automated notifications when specific result conditions are met')}</p>
        </div>
        <Button kind="primary" size="sm" renderIcon={Add} onClick={() => setShowAdd(true)}>
          {t('admin.testCatalog.alerts.action.addRule', 'Add Rule')}
        </Button>
      </div>

      {rules.map(r => (
        <Tile key={r.id} style={{ marginBottom: '12px', padding: 0, opacity: r.enabled ? 1 : 0.7 }}>
          <div style={{ padding: '12px', background: '#f4f4f4', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.enabled ? '#24a148' : '#a8a8a8' }} />
              <strong style={{ fontSize: '14px' }}>{r.name}</strong>
              <Tag type={r.enabled ? 'green' : 'gray'}>{r.enabled ? 'Enabled' : 'Disabled'}</Tag>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button kind="ghost" size="sm" onClick={() => toggle(r.id)}>{r.enabled ? 'Disable' : 'Enable'}</Button>
              <Button kind="ghost" size="sm" hasIconOnly iconDescription="Edit" renderIcon={Edit}><Edit /></Button>
              <Button kind="ghost" size="sm" hasIconOnly iconDescription="Delete" renderIcon={TrashCan} style={{ color: '#da1e28' }}><TrashCan /></Button>
            </div>
          </div>
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.testCatalog.alerts.label.when', 'When')}</div>
                <Tag type={r.triggerKind}>{r.trigger}</Tag>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.testCatalog.alerts.label.notifyVia', 'Notify Via')}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {r.channels.map(c => <Tag key={c} type={channelKind[c]}>{c === 'SMS' ? '📱 ' : '📧 '}{c}</Tag>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.testCatalog.alerts.label.recipients', 'Recipients')}</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {r.recipients.map(rec => <Tag key={rec} type="gray">{rec}</Tag>)}
                </div>
              </div>
            </div>
            {r.smsTemplate && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#525252', textTransform: 'uppercase', marginBottom: '4px' }}>{t('admin.testCatalog.alerts.label.smsTemplate', 'SMS Template')}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', padding: '8px', background: '#f4f4f4', borderRadius: '3px' }}>{r.smsTemplate}</div>
              </div>
            )}
          </div>
        </Tile>
      ))}

      {showAdd && (
        <Modal
          open={showAdd}
          onRequestClose={() => setShowAdd(false)}
          modalHeading={t('admin.testCatalog.alerts.modal.addRule', 'Add Alert Rule')}
          primaryButtonText={t('admin.testCatalog.alerts.action.saveRule', 'Save Alert Rule')}
          secondaryButtonText={t('admin.testCatalog.common.button.cancel', 'Cancel')}
          size="lg"
        >
          <TextInput id="rule-name" labelText={t('admin.testCatalog.alerts.label.ruleName', 'Rule Name')} placeholder="e.g., Critical Value SMS Alert" style={{ marginBottom: '16px' }} />
          <FormGroup legendText={t('admin.testCatalog.alerts.label.alertWhen', 'Alert when result is:')} style={{ marginBottom: '16px' }}>
            <RadioButtonGroup name="trigger" valueSelected="critical" orientation="vertical">
              <RadioButton labelText={t('admin.testCatalog.alerts.option.allResults', 'All Results')} value="all" />
              <RadioButton labelText={t('admin.testCatalog.alerts.option.abnormal', 'Abnormal (outside normal range)')} value="abnormal" />
              <RadioButton labelText={t('admin.testCatalog.alerts.option.critical', 'Critical (panic value)')} value="critical" />
              <RadioButton labelText={t('admin.testCatalog.alerts.option.specificValue', 'Specific Value')} value="specific" />
            </RadioButtonGroup>
          </FormGroup>
          <FormGroup legendText={t('admin.testCatalog.alerts.label.sendVia', 'Send via:')} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Checkbox id="ch-sms" labelText="📱 SMS" />
              <Checkbox id="ch-email" labelText="📧 Email" />
            </div>
          </FormGroup>
          <FormGroup legendText={t('admin.testCatalog.alerts.label.recipientsLabel', 'Recipients:')} style={{ marginBottom: '16px' }}>
            <Stack gap={3}>
              <Checkbox id="rcp-physician" labelText={t('admin.testCatalog.alerts.option.orderingPhysician', 'Ordering Physician (from order)')} />
              <Checkbox id="rcp-patient" labelText={t('admin.testCatalog.alerts.option.patient', 'Patient (from patient record)')} />
              <Checkbox id="rcp-custom" labelText={t('admin.testCatalog.alerts.option.customRecipient', 'Custom recipient:')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginLeft: '24px' }}>
                <TextInput id="rcp-phone" labelText="" hideLabel placeholder="Phone: +1 555-123-4567" />
                <TextInput id="rcp-email" labelText="" hideLabel placeholder="Email: user@example.com" />
              </div>
            </Stack>
          </FormGroup>
          <TextArea id="sms-template" labelText={t('admin.testCatalog.alerts.label.smsTemplateLabel', 'SMS Template (160 char recommended)')} rows={3} placeholder="CRITICAL: {{test_name}} {{result}} {{unit}} for {{patient_name}}. Review immediately." />
          <small style={{ display: 'block', fontSize: '11px', color: '#525252', marginTop: '4px' }}>
            Variables: {'{{patient_name}}, {{patient_id}}, {{test_name}}, {{result}}, {{unit}}, {{reference_range}}'}
          </small>
        </Modal>
      )}
    </div>
  );
}

/**
 * ReflexCalcSection — bidirectional reflex display + calculated results, all read-only with edit links to Master Lists
 */
function ReflexCalcSection() {
  const reflexBy = [
    { id: 1, condition: '> 200 mg/dL', target: 'Hemoglobin A1c', mode: 'Suggest', modeKind: 'warm-gray' },
    { id: 2, condition: '= "Abnormal"', target: 'Glucose Tolerance Test', mode: 'Auto-order', modeKind: 'green' },
  ];
  const reflexInto = [
    { id: 101, sourceTest: 'Glucose Tolerance Test', condition: '2-hour result > 140' },
  ];
  const calcs = [
    { id: 201, name: 'LDL Cholesterol (Calculated)', formula: 'Total_Chol - HDL - (Triglycerides / 5)' },
  ];

  return (
    <div>
      <Tile style={{ marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0 }}>⚡ {t('admin.testCatalog.reflexCalc.header.reflexTests', 'Reflex Tests')}</h3>
        <p style={{ fontSize: '13px', color: '#525252' }}>{t('admin.testCatalog.reflexCalc.header.reflexSubtitle', 'Automatic test ordering based on results')}</p>

        <h4 style={{ fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>{t('admin.testCatalog.reflexCalc.header.triggeredBy', 'Rules triggered BY this test:')}</h4>
        {reflexBy.map(r => (
          <div key={r.id} style={{ padding: '12px', background: '#f4f4f4', border: '1px solid #e0e0e0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px' }}>
              <span style={{ color: '#525252' }}>IF result</span>
              <strong>{r.condition}</strong>
              <span style={{ color: '#525252' }}>→ ORDER</span>
              <strong style={{ color: '#0f62fe' }}>{r.target}</strong>
              <Tag type={r.modeKind}>{r.mode}</Tag>
            </div>
            <a href="#" style={{ fontSize: '13px', color: '#0f62fe', fontWeight: 500 }}>{t('admin.testCatalog.reflexCalc.action.editInMasterLists', 'Edit in Master Lists →')}</a>
          </div>
        ))}

        <h4 style={{ fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>{t('admin.testCatalog.reflexCalc.header.thatOrder', 'Rules that ORDER this test:')}</h4>
        {reflexInto.map(r => (
          <div key={r.id} style={{ padding: '12px', background: '#e3f2fd', border: '1px solid #bce5fe', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px' }}>
              <span style={{ color: '#0f62fe' }}>↳ </span>
              <strong>{r.sourceTest}</strong>
              <span style={{ color: '#525252' }}> when {r.condition}</span>
            </div>
            <a href="#" style={{ fontSize: '13px', color: '#0f62fe', fontWeight: 500 }}>{t('admin.testCatalog.reflexCalc.action.editInMasterLists', 'Edit in Master Lists →')}</a>
          </div>
        ))}

        <a href="#" style={{ display: 'inline-block', marginTop: '8px', fontSize: '13px', color: '#0f62fe', fontWeight: 500 }}>
          {t('admin.testCatalog.reflexCalc.action.addNewReflexRule', '+ Add New Reflex Rule in Master Lists →')}
        </a>
      </Tile>

      <Tile>
        <h3 style={{ marginTop: 0 }}>⚡ {t('admin.testCatalog.reflexCalc.header.calculatedResults', 'Calculated Results')}</h3>
        <p style={{ fontSize: '13px', color: '#525252' }}>{t('admin.testCatalog.reflexCalc.header.calculatedSubtitle', 'Formulas that compute results from other test values')}</p>

        <h4 style={{ fontSize: '13px', marginBottom: '8px' }}>{t('admin.testCatalog.reflexCalc.header.usingThisAsInput', 'Calculations that USE this test as input:')}</h4>
        {calcs.map(c => (
          <div key={c.id} style={{ padding: '12px', background: '#f3e8ff', border: '1px solid #e0c3fc', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '32px', height: '32px', background: '#e0c3fc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚡</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{c.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#525252', marginTop: '2px' }}>{c.formula}</div>
              </div>
            </div>
            <a href="#" style={{ fontSize: '13px', color: '#0f62fe', fontWeight: 500 }}>{t('admin.testCatalog.reflexCalc.action.editInMasterLists', 'Edit in Master Lists →')}</a>
          </div>
        ))}

        <h4 style={{ fontSize: '13px', marginBottom: '8px', marginTop: '16px' }}>{t('admin.testCatalog.reflexCalc.header.thisIsCalculated', 'This test IS a calculated result:')}</h4>
        <div style={{ padding: '16px', border: '2px dashed #d0d0d0', borderRadius: '4px', textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
          <div style={{ fontSize: '13px', color: '#525252', marginBottom: '8px' }}>
            {t('admin.testCatalog.reflexCalc.empty.notCalculated', "This test's result is not calculated from other values")}
          </div>
          <a href="#" style={{ fontSize: '13px', color: '#0f62fe', fontWeight: 500 }}>
            {t('admin.testCatalog.reflexCalc.action.configureInMasterLists', '+ Configure in Master Lists →')}
          </a>
        </div>
      </Tile>
    </div>
  );
}

/**
 * ComplianceSection — regulatory threshold DataTable with Group By + Add Threshold
 */
function ComplianceSection() {
  const [groupBy, setGroupBy] = useState('standard');
  const thresholds = [
    { id: 1, std: 'PP No. 22/2021 — Baku Mutu Air', grp: 'Parameter Fisika', type: 'MAX', value: '≤ 25 NTU', date: '2021-02-02' },
    { id: 2, std: 'WHO Drinking Water Guidelines', grp: 'Chemical Contaminants', type: 'MAX', value: '≤ 5 NTU', date: '2022-03-21' },
    { id: 3, std: 'EPA Method 180.1', grp: 'Reporting Limits', type: 'RANGE', value: '0.1–4000 NTU', date: '2018-01-15' },
  ];
  const typeKind = { MAX: 'red', MIN: 'blue', RANGE: 'teal', DESCRIPTIVE: 'purple' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h2>{t('admin.testCatalog.compliance.header.title', 'Compliance Thresholds')}</h2>
          <p>{t('admin.testCatalog.compliance.header.subtitle', 'Regulatory compliance thresholds for this test')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px' }}>{t('admin.testCatalog.compliance.label.groupBy', 'Group by:')}</span>
          <Select id="group-by" labelText="" hideLabel value={groupBy} onChange={e => setGroupBy(e.target.value)} size="sm">
            <SelectItem value="standard" text={t('admin.testCatalog.compliance.option.byStandard', 'Standard')} />
            <SelectItem value="parameter" text={t('admin.testCatalog.compliance.option.byParameterGroup', 'Parameter Group')} />
          </Select>
          <Button kind="primary" size="sm" renderIcon={Add}>
            {t('admin.testCatalog.compliance.action.addThreshold', 'Add Threshold')}
          </Button>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#525252', marginBottom: '12px' }}>
        {t('admin.testCatalog.compliance.helper.aboutThresholds', 'Environmental tests use these instead of (or alongside) clinical reference ranges. Full compliance standards are managed at Admin → Test Management → Compliance Standards.')}
      </p>

      <DataTable
        headers={[
          { key: 'std', header: t('admin.testCatalog.compliance.column.standard', 'Standard') },
          { key: 'grp', header: t('admin.testCatalog.compliance.column.parameterGroup', 'Parameter Group') },
          { key: 'type', header: t('admin.testCatalog.compliance.column.type', 'Type') },
          { key: 'value', header: t('admin.testCatalog.compliance.column.value', 'Value') },
          { key: 'date', header: t('admin.testCatalog.compliance.column.effectiveDate', 'Effective Date') },
          { key: 'actions', header: '' },
        ]}
        rows={thresholds.map(th => ({ id: String(th.id), ...th }))}
      >
        {({ headers, getTableProps, getHeaderProps }) => (
          <TableContainer>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map(h => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {thresholds.map(th => (
                  <TableRow key={th.id}>
                    <TableCell>{th.std}</TableCell>
                    <TableCell>{th.grp}</TableCell>
                    <TableCell><Tag type={typeKind[th.type]}>{th.type}</Tag></TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{th.value}</TableCell>
                    <TableCell style={{ color: '#525252' }}>{th.date}</TableCell>
                    <TableCell><Button kind="ghost" size="sm">{t('admin.testCatalog.common.button.edit', 'Edit')}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </div>
  );
}

// ==================== TEST EDITOR ====================
/**
 * TestEditor — main editor with SideNav and section dispatch
 */
function TestEditor({ test, setTest, onBack }) {
  const [currentSection, setCurrentSection] = useState('basic');

  const sections = [
    { id: 'basic', label: t('admin.testCatalog.section.basicInfo', 'Basic Info') },
    { id: 'sample', label: t('admin.testCatalog.section.sampleResults', 'Sample & Results') },
    { id: 'methods', label: t('admin.testCatalog.section.methods', 'Methods') },
    { id: 'ranges', label: t('admin.testCatalog.section.ranges', 'Ranges') },
    { id: 'storage', label: t('admin.testCatalog.section.sampleStorage', 'Sample Storage') },
    { id: 'order', label: t('admin.testCatalog.section.displayOrder', 'Display Order') },
    { id: 'panels', label: t('admin.testCatalog.section.panels', 'Panels') },
    { id: 'labels', label: t('admin.testCatalog.section.labels', 'Labels') },
    { id: 'terminology', label: t('admin.testCatalog.section.terminology', 'Terminology') },
    { id: 'reagents', label: t('admin.testCatalog.section.reagents', 'Reagents') },
    { id: 'analyzers', label: t('admin.testCatalog.section.analyzers', 'Analyzers') },
    { id: 'alerts', label: t('admin.testCatalog.section.alerts', 'Alerts') },
    { id: 'reflex', label: t('admin.testCatalog.section.reflexCalc', 'Reflex & Calc') },
  ];

  // Hide Compliance if CLINICAL domain
  const visibleSections = test.domain === 'CLINICAL'
    ? sections
    : [...sections, { id: 'compliance', label: t('admin.testCatalog.section.compliance', 'Compliance') }];

  return (
    <div>
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button kind="ghost" onClick={onBack}>
            ← {t('admin.testCatalog.editor.action.testList', 'Test List')}
          </Button>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{test.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button kind="secondary" onClick={onBack}>
            {t('admin.testCatalog.editor.action.cancel', 'Cancel')}
          </Button>
          <Button kind="primary">
            {t('admin.testCatalog.editor.action.save', 'Save Test')}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        {/* SideNav */}
        <div style={{ width: '280px', background: '#fff', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', fontSize: '13px', fontWeight: 600, color: '#525252' }}>
            {t('admin.testCatalog.sidenav.header.testCatalogManagement', 'Test Catalog Management')}
          </div>
          {visibleSections.map((sec) => (
            <div
              key={sec.id}
              onClick={() => setCurrentSection(sec.id)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                borderLeft: currentSection === sec.id ? '3px solid #0f62fe' : '3px solid transparent',
                background: currentSection === sec.id ? '#e3f2fd' : '#fff',
                color: currentSection === sec.id ? '#0f62fe' : '#525252',
                fontWeight: currentSection === sec.id ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {sec.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {test && (test.domain === 'ENVIRONMENTAL' || test.domain === 'VECTOR') && currentSection === 'ranges' && (
            <InlineNotification
              kind="info"
              title={t('admin.testCatalog.ranges.notification.title', 'Domain Note')}
              subtitle={`${t('admin.testCatalog.ranges.notification.compliancePrimary', 'This is an')} ${test.domain === 'ENVIRONMENTAL' ? 'Environmental' : 'Vector'} ${t('admin.testCatalog.ranges.notification.compliancePrimary2', 'test. Compliance thresholds are typically the primary evaluation surface for this domain.')}`}
              style={{ marginBottom: '24px' }}
            />
          )}

          {currentSection === 'basic' && <BasicInfoSection test={test} setTest={setTest} />}
          {currentSection === 'sample' && <SampleResultsSection test={test} setTest={setTest} />}
          {currentSection === 'methods' && <MethodsSection />}
          {currentSection === 'ranges' && <RangesSection test={test} />}
          {currentSection === 'storage' && <SampleStorageSection />}
          {currentSection === 'order' && <DisplayOrderSection />}
          {currentSection === 'panels' && <PanelsSection />}
          {currentSection === 'labels' && <LabelsSection />}
          {currentSection === 'terminology' && <TerminologySection test={test} />}
          {currentSection === 'reagents' && <ReagentsSection />}
          {currentSection === 'analyzers' && <AnalyzersSection />}
          {currentSection === 'alerts' && <AlertsSection />}
          {currentSection === 'reflex' && <ReflexCalcSection />}
          {currentSection === 'compliance' && <ComplianceSection />}
        </div>
      </div>
    </div>
  );
}

// ==================== APP ROOT ====================
/**
 * App — root component managing screen state (list vs editor) and test selection
 */
function App() {
  const [screen, setScreen] = useState('list');
  const [selectedTest, setSelectedTest] = useState(null);
  const [test, setTest] = useState(null);

  const handleEdit = (t) => {
    setSelectedTest(t);
    setTest({ ...t });
    setScreen('editor');
  };

  const handleAdd = () => {
    const blankTest = {
      id: null,
      name: t('admin.testCatalog.editor.placeholder.newTest', 'New Test'),
      section: '',
      sampleType: '',
      resultType: 'NUMERIC',
      loinc: null,
      status: 'Active',
      domain: 'CLINICAL',
      amr: false,
    };
    setSelectedTest(blankTest);
    setTest(blankTest);
    setScreen('editor');
  };

  if (screen === 'editor' && selectedTest) {
    return (
      <TestEditor
        test={test || selectedTest}
        setTest={setTest}
        onBack={() => {
          setScreen('list');
          setSelectedTest(null);
          setTest(null);
        }}
      />
    );
  }

  return (
    <div>
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '16px 24px' }}>
        <h1 style={{ margin: 0 }}>{t('admin.testCatalog.list.header.title', 'Test Catalog Management')}</h1>
      </div>
      <TestListView onEdit={handleEdit} onAdd={handleAdd} />
    </div>
  );
}

export default App;
