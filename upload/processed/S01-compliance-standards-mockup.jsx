/**
 * S-01: Compliance Standards Administration — React/Carbon Mockup
 *
 * Two screens:
 *   1. Admin → Test Management → Compliance Standards (standards CRUD + CSV import)
 *   2. Test Catalog → [Test Editor] → Compliance tab (vertical tab sidebar, per-test thresholds)
 *
 * The Test Editor uses a vertical tab sidebar (not horizontal Carbon Tabs) per test-catalog.jsx.
 * The "Compliance" tab is placed under a new Compliance section group after the Automation group.
 * Tab groups: Configuration | Organization | Resources | Automation | Compliance
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 * Companion FRS: S01-compliance-standards-admin-frs-v1.0.md
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack, SideNav, SideNavItems, SideNavMenuItem, SideNavMenu,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, TableSelectRow, TableSelectAll,
  TextInput, TextArea, Select, SelectItem, ComboBox, NumberInput, Toggle,
  Checkbox, RadioButton, RadioButtonGroup, DatePicker, DatePickerInput, MultiSelect,
  Button, IconButton, InlineNotification, Tag, Modal, Loading, Accordion, AccordionItem,
  Tile, Breadcrumb, BreadcrumbItem, OverflowMenu, OverflowMenuItem,
  FileUploader, FileUploaderDropContainer,
} from '@carbon/react';
import { Add, Edit, TrashCan, ChevronDown, ChevronUp, Download, Save, Renew, Copy, Upload, View } from '@carbon/icons-react';

// i18n helper — in production, this resolves to the active locale's message bundle
const t = (key, fallback) => fallback || key;

// ============================================================
// SCREEN 1: Compliance Standards List
// Admin → Test Management → Compliance Standards
// ============================================================

const statusKindMap = {
  ACTIVE: 'green',
  DRAFT: 'blue',
  SUPERSEDED: 'warm-gray',
  ARCHIVED: 'gray',
};

const mockStandards = [
  {
    id: '1', name: 'PP No. 22/2021 — Water Quality', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 22/2021', version: '2021', effectiveDate: '2021-02-02',
    countryRegion: 'Indonesia', status: 'ACTIVE', parameterGroupCount: 4, linkedTestCount: 47,
    isPreSeeded: true, sampleTypes: ['Water'],
    groups: [
      { id: 'g1', name: 'Physical Parameters', description: 'Turbidity, color, odor, taste, temperature', sortOrder: 1, thresholdCount: 6 },
      { id: 'g2', name: 'Inorganic Chemical Parameters', description: 'Heavy metals, pH, hardness, dissolved solids', sortOrder: 2, thresholdCount: 22 },
      { id: 'g3', name: 'Organic Chemical Parameters', description: 'Pesticides, solvents, disinfection byproducts', sortOrder: 3, thresholdCount: 14 },
      { id: 'g4', name: 'Microbiological Parameters', description: 'Total coliform, E. coli, fecal coliform', sortOrder: 4, thresholdCount: 5 },
    ],
  },
  {
    id: '2', name: 'PP No. 41/1999 — Ambient Air Quality', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 41/1999', version: '1999', effectiveDate: '1999-05-26',
    countryRegion: 'Indonesia', status: 'ACTIVE', parameterGroupCount: 2, linkedTestCount: 12,
    isPreSeeded: true, sampleTypes: ['Air'],
    groups: [
      { id: 'g5', name: 'Primary Pollutants', description: 'SO2, CO, NO2, O3, Pb, PM10, PM2.5', sortOrder: 1, thresholdCount: 7 },
      { id: 'g6', name: 'Secondary Pollutants', description: 'Dust, H2S, NH3, HCl', sortOrder: 2, thresholdCount: 5 },
    ],
  },
  {
    id: '3', name: 'WHO Drinking Water Guidelines', issuingBody: 'World Health Organization',
    regulationNumber: 'WHO/SDE/WSH/2022', version: '4th Ed. 2022', effectiveDate: '2022-03-21',
    countryRegion: 'International', status: 'ACTIVE', parameterGroupCount: 3, linkedTestCount: 34,
    isPreSeeded: false, sampleTypes: ['Water'],
    groups: [
      { id: 'g7', name: 'Chemical Contaminants', description: 'Arsenic, fluoride, lead, nitrate, etc.', sortOrder: 1, thresholdCount: 18 },
      { id: 'g8', name: 'Microbial Indicators', description: 'E. coli, total coliforms', sortOrder: 2, thresholdCount: 4 },
      { id: 'g9', name: 'Radiological Parameters', description: 'Gross alpha, gross beta activity', sortOrder: 3, thresholdCount: 2 },
    ],
  },
  {
    id: '4', name: 'PP No. 22/2021 — Water Quality (Draft v2)', issuingBody: 'Government of Indonesia',
    regulationNumber: 'PP 22/2021-rev', version: '2026 Draft', effectiveDate: '2026-01-01',
    countryRegion: 'Indonesia', status: 'DRAFT', parameterGroupCount: 4, linkedTestCount: 0,
    isPreSeeded: false, sampleTypes: ['Water'],
    groups: [],
  },
];

const sampleTypeOptions = ['Water', 'Air', 'Soil', 'Waste', 'Food', 'Sediment'];

function ComplianceStandardsList() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [notification, setNotification] = useState(null);
  const [addingNew, setAddingNew] = useState(false);

  const toggleRow = (id) => setExpandedRow((prev) => (prev === id ? null : id));

  const filteredStandards = useMemo(() => {
    return mockStandards.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (regionFilter && s.countryRegion !== regionFilter) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.issuingBody.toLowerCase().includes(q) ||
          s.regulationNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchText, statusFilter, regionFilter]);

  const headers = [
    { key: 'name', header: t('label.complianceStandard.name', 'Standard Name') },
    { key: 'issuingBody', header: t('label.complianceStandard.issuingBody', 'Issuing Body') },
    { key: 'regulationNumber', header: t('label.complianceStandard.regulationNumber', 'Regulation No.') },
    { key: 'version', header: t('label.complianceStandard.version', 'Version') },
    { key: 'effectiveDate', header: t('label.complianceStandard.effectiveDate', 'Effective Date') },
    { key: 'status', header: t('label.complianceStandard.status', 'Status') },
    { key: 'parameterGroupCount', header: t('label.complianceStandard.parameterGroups', 'Groups') },
    { key: 'linkedTestCount', header: t('label.complianceStandard.linkedTests', 'Linked Tests') },
    { key: 'actions', header: '' },
  ];

  return (
    <Grid>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb>
          <BreadcrumbItem href="#">{t('nav.admin', 'Admin')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('nav.testManagement', 'Test Management')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('nav.complianceStandard', 'Compliance Standards')}</BreadcrumbItem>
        </Breadcrumb>

        <Stack gap={5} style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <h1>{t('heading.complianceStandard.list', 'Compliance Standards')}</h1>

          {notification && (
            <InlineNotification
              kind={notification.kind}
              title={notification.title}
              subtitle={notification.subtitle}
              onClose={() => setNotification(null)}
            />
          )}

          <TableContainer>
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch
                  placeholder={t('placeholder.complianceStandard.search', 'Search by name, issuing body, or regulation number...')}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Select
                  id="status-filter"
                  labelText=""
                  inline
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <SelectItem value="" text={t('label.complianceStandard.status', 'All Statuses')} />
                  <SelectItem value="ACTIVE" text="Active" />
                  <SelectItem value="DRAFT" text="Draft" />
                  <SelectItem value="SUPERSEDED" text="Superseded" />
                  <SelectItem value="ARCHIVED" text="Archived" />
                </Select>
                <Select
                  id="region-filter"
                  labelText=""
                  inline
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                >
                  <SelectItem value="" text={t('label.complianceStandard.countryRegion', 'All Regions')} />
                  <SelectItem value="Indonesia" text="Indonesia" />
                  <SelectItem value="International" text="International" />
                </Select>
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={Upload}
                  onClick={() => setShowImportModal(true)}
                >
                  {t('button.complianceStandard.import', 'Import from CSV')}
                </Button>
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Add}
                  onClick={() => { setAddingNew(true); setExpandedRow(null); }}
                >
                  {t('button.complianceStandard.add', 'Add Standard')}
                </Button>
              </TableToolbarContent>
            </TableToolbar>

            <Table>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableHeader key={h.key}>{h.header}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Inline add form at top */}
                {addingNew && (
                  <TableRow>
                    <TableCell colSpan={headers.length}>
                      <StandardInlineForm
                        isNew
                        onSave={() => {
                          setAddingNew(false);
                          setNotification({ kind: 'success', title: t('message.complianceStandard.saveSuccess', 'Compliance standard saved successfully.') });
                        }}
                        onCancel={() => setAddingNew(false)}
                      />
                    </TableCell>
                  </TableRow>
                )}

                {filteredStandards.map((std) => (
                  <React.Fragment key={std.id}>
                    <TableRow>
                      <TableCell>
                        <Stack orientation="horizontal" gap={3}>
                          {std.name}
                          {std.isPreSeeded && (
                            <Tag size="sm" type="teal">{t('label.complianceStandard.preSeeded', 'Default')}</Tag>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>{std.issuingBody}</TableCell>
                      <TableCell>{std.regulationNumber}</TableCell>
                      <TableCell>{std.version}</TableCell>
                      <TableCell>{std.effectiveDate}</TableCell>
                      <TableCell>
                        <Tag type={statusKindMap[std.status]} size="sm">{std.status}</Tag>
                      </TableCell>
                      <TableCell>{std.parameterGroupCount}</TableCell>
                      <TableCell>
                        <Button kind="ghost" size="sm">{std.linkedTestCount}</Button>
                      </TableCell>
                      <TableCell>
                        <Stack orientation="horizontal" gap={2}>
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={expandedRow === std.id ? ChevronUp : ChevronDown}
                            onClick={() => toggleRow(std.id)}
                            hasIconOnly
                            iconDescription={t('button.complianceStandard.edit', 'Edit')}
                          />
                          <OverflowMenu size="sm" flipped>
                            <OverflowMenuItem
                              itemText={t('button.complianceStandard.edit', 'Edit')}
                              onClick={() => toggleRow(std.id)}
                            />
                            <OverflowMenuItem
                              itemText={t('button.complianceStandard.copy', 'Copy Standard')}
                            />
                            <OverflowMenuItem
                              itemText={t('button.complianceStandard.viewLinkedTests', 'View Linked Tests')}
                            />
                            {!std.isPreSeeded && (
                              <OverflowMenuItem
                                itemText={t('button.complianceStandard.archive', 'Archive')}
                                isDelete
                                onClick={() => {
                                  setArchiveTarget(std);
                                  setShowArchiveModal(true);
                                }}
                              />
                            )}
                          </OverflowMenu>
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {expandedRow === std.id && (
                      <TableRow>
                        <TableCell colSpan={headers.length}>
                          <StandardInlineForm
                            standard={std}
                            onSave={() => {
                              setExpandedRow(null);
                              setNotification({ kind: 'success', title: t('message.complianceStandard.saveSuccess', 'Compliance standard saved successfully.') });
                            }}
                            onCancel={() => setExpandedRow(null)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>

        {/* Archive Confirmation Modal */}
        <Modal
          open={showArchiveModal}
          modalHeading={t('heading.complianceStandard.archive', 'Archive Compliance Standard')}
          primaryButtonText={t('button.complianceStandard.archive', 'Archive')}
          secondaryButtonText={t('button.complianceStandard.cancel', 'Cancel')}
          danger
          onRequestClose={() => setShowArchiveModal(false)}
          onRequestSubmit={() => {
            setShowArchiveModal(false);
            setNotification({ kind: 'success', title: t('message.complianceStandard.archiveSuccess', 'Compliance standard archived.') });
          }}
        >
          <p>{t('message.complianceStandard.archiveConfirm', 'Are you sure you want to archive this compliance standard? Existing evaluated results will not be affected.')}</p>
        </Modal>

        {/* CSV Import Modal */}
        <CSVImportModal open={showImportModal} onClose={() => setShowImportModal(false)} />
      </Column>
    </Grid>
  );
}

// Inline Add/Edit Form for a Compliance Standard
function StandardInlineForm({ standard, isNew, onSave, onCancel }) {
  const [name, setName] = useState(standard?.name || '');
  const [issuingBody, setIssuingBody] = useState(standard?.issuingBody || '');
  const [regulationNumber, setRegulationNumber] = useState(standard?.regulationNumber || '');
  const [version, setVersion] = useState(standard?.version || '');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(standard?.status || 'DRAFT');

  return (
    <Tile>
      <h4 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        {isNew
          ? t('heading.complianceStandard.addNew', 'Add New Compliance Standard')
          : t('heading.complianceStandard.edit', 'Edit Compliance Standard')}
      </h4>
      <Grid>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="std-name"
            labelText={t('label.complianceStandard.name', 'Standard Name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="std-issuing-body"
            labelText={t('label.complianceStandard.issuingBody', 'Issuing Body')}
            value={issuingBody}
            onChange={(e) => setIssuingBody(e.target.value)}
            required
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <TextInput
            id="std-reg-number"
            labelText={t('label.complianceStandard.regulationNumber', 'Regulation Number')}
            value={regulationNumber}
            onChange={(e) => setRegulationNumber(e.target.value)}
            required
          />
        </Column>
        <Column lg={2} md={2} sm={4}>
          <TextInput
            id="std-version"
            labelText={t('label.complianceStandard.version', 'Version')}
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />
        </Column>
        <Column lg={2} md={2} sm={4}>
          <Select
            id="std-status"
            labelText={t('label.complianceStandard.status', 'Status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <SelectItem value="DRAFT" text="Draft" />
            <SelectItem value="ACTIVE" text="Active" />
            <SelectItem value="SUPERSEDED" text="Superseded" />
            <SelectItem value="ARCHIVED" text="Archived" />
          </Select>
        </Column>
        <Column lg={3} md={4} sm={4}>
          <DatePicker datePickerType="single">
            <DatePickerInput
              id="std-effective-date"
              labelText={t('label.complianceStandard.effectiveDate', 'Effective Date')}
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        </Column>
        <Column lg={3} md={4} sm={4}>
          <DatePicker datePickerType="single">
            <DatePickerInput
              id="std-expiry-date"
              labelText={t('label.complianceStandard.expiryDate', 'Expiry Date')}
              placeholder="yyyy-mm-dd"
            />
          </DatePicker>
        </Column>
        <Column lg={4} md={4} sm={4}>
          <ComboBox
            id="std-region"
            titleText={t('label.complianceStandard.countryRegion', 'Country / Region')}
            items={['Indonesia', 'International', 'United States', 'European Union', 'Madagascar', "Côte d'Ivoire"]}
            selectedItem={standard?.countryRegion || ''}
            placeholder={t('placeholder.complianceStandard.selectRegion', 'Select or type...')}
          />
        </Column>
        <Column lg={6} md={4} sm={4}>
          <MultiSelect
            id="std-sample-types"
            titleText={t('label.complianceStandard.sampleTypes', 'Applicable Sample Types')}
            items={sampleTypeOptions.map((s) => ({ id: s, label: s }))}
            initialSelectedItems={standard?.sampleTypes?.map((s) => ({ id: s, label: s })) || []}
            label={t('placeholder.complianceStandard.selectSampleTypes', 'Select sample types...')}
          />
        </Column>
        <Column lg={16} md={8} sm={4}>
          <TextArea
            id="std-description"
            labelText={t('label.complianceStandard.description', 'Description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Column>
      </Grid>

      {/* Parameter Groups Accordion — shown only in edit mode */}
      {!isNew && standard?.groups && standard.groups.length > 0 && (
        <div style={{ marginTop: 'var(--cds-spacing-05)' }}>
          <h5>{t('label.complianceStandard.parameterGroups', 'Parameter Groups')}</h5>
          <Accordion>
            {standard.groups.map((group) => (
              <AccordionItem
                key={group.id}
                title={
                  <Stack orientation="horizontal" gap={3}>
                    <span>{group.name}</span>
                    <Tag size="sm" type="gray">{group.thresholdCount} {t('label.complianceStandard.linkedTests', 'thresholds')}</Tag>
                  </Stack>
                }
              >
                <p style={{ marginBottom: 'var(--cds-spacing-03)' }}>{group.description}</p>
                <Button kind="ghost" size="sm" renderIcon={Add}>
                  {t('button.complianceStandard.linkTest', 'Link Test')}
                </Button>
              </AccordionItem>
            ))}
          </Accordion>
          <Button kind="ghost" size="sm" renderIcon={Add} style={{ marginTop: 'var(--cds-spacing-03)' }}>
            {t('button.complianceStandard.addGroup', 'Add Parameter Group')}
          </Button>
        </div>
      )}

      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={onSave}>
          {t('button.complianceStandard.save', 'Save')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.complianceStandard.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}

// CSV Import Modal
function CSVImportModal({ open, onClose }) {
  const [importScope, setImportScope] = useState('full');
  const [showPreview, setShowPreview] = useState(false);

  const mockPreviewRows = [
    { row: 1, standard: 'PP No. 22/2021', group: 'Physical Parameters', test: 'Turbidity', matchStatus: 'Matched', threshold: 'Max <= 25 NTU', validation: 'Valid' },
    { row: 2, standard: 'PP No. 22/2021', group: 'Physical Parameters', test: 'Color', matchStatus: 'Matched', threshold: 'Max <= 50 TCU', validation: 'Valid' },
    { row: 3, standard: 'PP No. 22/2021', group: 'Physical Parameters', test: 'Dissolved Oxygen (DO)', matchStatus: 'Matched', threshold: 'Min >= 4 mg/L', validation: 'Valid' },
    { row: 4, standard: 'PP No. 22/2021', group: 'Inorganic Chemical', test: 'Arsenic (As)', matchStatus: 'Matched', threshold: 'Max <= 0.05 mg/L', validation: 'Valid' },
    { row: 5, standard: 'PP No. 22/2021', group: 'Microbiological', test: 'Coliform sp.', matchStatus: 'Not Found', threshold: 'Max <= 5000 CFU/100mL', validation: 'Error: Test not found' },
  ];

  return (
    <Modal
      open={open}
      modalHeading={t('heading.complianceStandard.import', 'Import Compliance Standards from CSV')}
      primaryButtonText={showPreview ? t('button.complianceStandard.importConfirm', 'Import') : t('button.complianceStandard.uploadPreview', 'Upload & Preview')}
      secondaryButtonText={t('button.complianceStandard.cancel', 'Cancel')}
      onRequestClose={() => { onClose(); setShowPreview(false); }}
      onRequestSubmit={() => {
        if (!showPreview) {
          setShowPreview(true);
        } else {
          onClose();
          setShowPreview(false);
        }
      }}
      size="lg"
    >
      {!showPreview ? (
        <Stack gap={5}>
          <RadioButtonGroup
            legendText={t('label.complianceStandard.importScope', 'Import Scope')}
            name="import-scope"
            defaultSelected="full"
            onChange={(val) => setImportScope(val)}
          >
            <RadioButton labelText={t('label.complianceStandard.importScopeStandards', 'Standards & Groups only')} value="standards" id="scope-standards" />
            <RadioButton labelText={t('label.complianceStandard.importScopeFull', 'Standards, Groups & Thresholds')} value="full" id="scope-full" />
          </RadioButtonGroup>

          <FileUploader
            accept={['.csv']}
            buttonLabel={t('button.complianceStandard.selectFile', 'Select CSV file')}
            filenameStatus="edit"
            labelDescription={t('label.complianceStandard.importFileHint', 'Max file size: 5MB. Only .csv files accepted.')}
            labelTitle={t('label.complianceStandard.importFile', 'Upload File')}
          />

          <Button kind="ghost" size="sm" renderIcon={Download}>
            {t('button.complianceStandard.downloadTemplate', 'Download Template')}
          </Button>
        </Stack>
      ) : (
        <Stack gap={5}>
          <h4>{t('heading.complianceStandard.importPreview', 'Import Preview')}</h4>
          <Stack orientation="horizontal" gap={5}>
            <Tag type="blue">{t('label.complianceStandard.importTotalRows', 'Total Rows: 5')}</Tag>
            <Tag type="green">{t('label.complianceStandard.importValid', 'Valid: 4')}</Tag>
            <Tag type="red">{t('label.complianceStandard.importErrors', 'Errors: 1')}</Tag>
          </Stack>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{t('label.complianceStandard.importRow', 'Row')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.name', 'Standard')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.parameterGroups', 'Group')}</TableHeader>
                <TableHeader>{t('label.complianceThreshold.test', 'Test')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.importMatch', 'Match')}</TableHeader>
                <TableHeader>{t('label.complianceThreshold.thresholdType', 'Threshold')}</TableHeader>
                <TableHeader>{t('label.complianceStandard.importValidation', 'Status')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockPreviewRows.map((row) => (
                <TableRow key={row.row} style={row.validation.startsWith('Error') ? { borderLeft: '3px solid var(--cds-support-01)' } : {}}>
                  <TableCell>{row.row}</TableCell>
                  <TableCell>{row.standard}</TableCell>
                  <TableCell>{row.group}</TableCell>
                  <TableCell>{row.test}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={row.matchStatus === 'Matched' ? 'green' : 'red'}>{row.matchStatus}</Tag>
                  </TableCell>
                  <TableCell>{row.threshold}</TableCell>
                  <TableCell>
                    {row.validation === 'Valid'
                      ? <Tag size="sm" type="green">{row.validation}</Tag>
                      : <span style={{ color: 'var(--cds-support-01)' }}>{row.validation}</span>
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Checkbox id="skip-errors" labelText={t('button.complianceStandard.skipErrors', 'Skip error rows')} />
        </Stack>
      )}
    </Modal>
  );
}


// ============================================================
// SCREEN 2: Compliance Thresholds Tab
// Test Catalog → [Test Editor] → Compliance (vertical tab sidebar)
// ============================================================

const thresholdTypeKindMap = {
  MAX: 'red',
  MIN: 'blue',
  RANGE: 'teal',
  DESCRIPTIVE: 'purple',
};

const thresholdTypeLabels = {
  MAX: 'Max ≤',
  MIN: 'Min ≥',
  RANGE: 'Range',
  DESCRIPTIVE: 'Qualitative',
};

const mockThresholds = [
  { id: 't1', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters', thresholdType: 'MAX', valueUpper: 25, unit: 'NTU', effectiveDate: '2021-02-02', isActive: true },
  { id: 't2', standardName: 'WHO Drinking Water Guidelines', parameterGroup: 'Chemical Contaminants', thresholdType: 'MAX', valueUpper: 5, unit: 'NTU', effectiveDate: '2022-03-21', isActive: true },
  { id: 't3', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters', thresholdType: 'RANGE', valueLower: 6.5, valueUpper: 8.5, unit: 'pH', effectiveDate: '2021-02-02', isActive: true },
  { id: 't4', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Microbiological Parameters', thresholdType: 'MAX', valueUpper: 5000, unit: 'CFU/100mL', effectiveDate: '2021-02-02', isActive: true },
  { id: 't5', standardName: 'PP No. 22/2021 — Water Quality', parameterGroup: 'Physical Parameters', thresholdType: 'DESCRIPTIVE', valueDescriptive: 'No odor', unit: '—', effectiveDate: '2021-02-02', isActive: true },
];

function ComplianceThresholdsTab() {
  const [groupBy, setGroupBy] = useState('standard');
  const [expandedRow, setExpandedRow] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [notification, setNotification] = useState(null);

  const toggleRow = (id) => setExpandedRow((prev) => (prev === id ? null : id));

  const formatThresholdValue = (threshold) => {
    switch (threshold.thresholdType) {
      case 'MAX': return `≤ ${threshold.valueUpper} ${threshold.unit}`;
      case 'MIN': return `≥ ${threshold.valueLower} ${threshold.unit}`;
      case 'RANGE': return `${threshold.valueLower} – ${threshold.valueUpper} ${threshold.unit}`;
      case 'DESCRIPTIVE': return threshold.valueDescriptive;
      default: return '—';
    }
  };

  return (
    <Stack gap={5}>
      {notification && (
        <InlineNotification
          kind={notification.kind}
          title={notification.title}
          onClose={() => setNotification(null)}
        />
      )}

      <Stack orientation="horizontal" gap={3}>
        <Select
          id="group-by"
          labelText={t('label.complianceThreshold.groupBy', 'Group by')}
          inline
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
        >
          <SelectItem value="standard" text={t('label.complianceThreshold.groupBy.standard', 'Standard')} />
          <SelectItem value="parameterGroup" text={t('label.complianceThreshold.groupBy.parameterGroup', 'Parameter Group')} />
        </Select>
        <Button kind="primary" size="sm" renderIcon={Add} onClick={() => setAddingNew(true)}>
          {t('button.complianceThreshold.add', 'Add Threshold')}
        </Button>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>{t('label.complianceThreshold.standard', 'Standard')}</TableHeader>
              <TableHeader>{t('label.complianceThreshold.parameterGroup', 'Parameter Group')}</TableHeader>
              <TableHeader>{t('label.complianceThreshold.thresholdType', 'Type')}</TableHeader>
              <TableHeader>{t('label.complianceThreshold.value', 'Value')}</TableHeader>
              <TableHeader>{t('label.complianceThreshold.unit', 'Unit')}</TableHeader>
              <TableHeader>{t('label.complianceStandard.effectiveDate', 'Effective Date')}</TableHeader>
              <TableHeader>{t('label.complianceStandard.status', 'Status')}</TableHeader>
              <TableHeader>{''}</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {addingNew && (
              <TableRow>
                <TableCell colSpan={8}>
                  <ThresholdInlineForm
                    isNew
                    onSave={() => {
                      setAddingNew(false);
                      setNotification({ kind: 'success', title: t('message.complianceThreshold.saveSuccess', 'Compliance threshold saved successfully.') });
                    }}
                    onCancel={() => setAddingNew(false)}
                  />
                </TableCell>
              </TableRow>
            )}
            {mockThresholds.map((th) => (
              <React.Fragment key={th.id}>
                <TableRow>
                  <TableCell>{th.standardName}</TableCell>
                  <TableCell>{th.parameterGroup}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={thresholdTypeKindMap[th.thresholdType]}>
                      {t(`label.complianceThreshold.thresholdType.${th.thresholdType.toLowerCase()}`, thresholdTypeLabels[th.thresholdType])}
                    </Tag>
                  </TableCell>
                  <TableCell>{formatThresholdValue(th)}</TableCell>
                  <TableCell>{th.unit}</TableCell>
                  <TableCell>{th.effectiveDate}</TableCell>
                  <TableCell>
                    <Tag size="sm" type={th.isActive ? 'green' : 'gray'}>
                      {th.isActive ? 'Active' : 'Archived'}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      iconDescription={t('button.complianceThreshold.edit', 'Edit')}
                      renderIcon={expandedRow === th.id ? ChevronUp : ChevronDown}
                      onClick={() => toggleRow(th.id)}
                    />
                  </TableCell>
                </TableRow>
                {expandedRow === th.id && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <ThresholdInlineForm
                        threshold={th}
                        onSave={() => {
                          setExpandedRow(null);
                          setNotification({ kind: 'success', title: t('message.complianceThreshold.saveSuccess', 'Compliance threshold saved successfully.') });
                        }}
                        onCancel={() => setExpandedRow(null)}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

// Inline Add/Edit Form for a Compliance Threshold
function ThresholdInlineForm({ threshold, isNew, onSave, onCancel }) {
  const [thresholdType, setThresholdType] = useState(threshold?.thresholdType || 'MAX');

  return (
    <Tile>
      <h5 style={{ marginBottom: 'var(--cds-spacing-05)' }}>
        {isNew
          ? t('heading.complianceThreshold.addNew', 'Add Compliance Threshold')
          : t('heading.complianceThreshold.edit', 'Edit Compliance Threshold')}
      </h5>
      <Grid>
        <Column lg={4} md={4} sm={4}>
          <ComboBox
            id="th-standard"
            titleText={t('label.complianceThreshold.standard', 'Standard')}
            items={mockStandards.filter((s) => s.status === 'ACTIVE').map((s) => ({ id: s.id, label: s.name }))}
            selectedItem={threshold ? { id: '1', label: threshold.standardName } : null}
            placeholder={t('placeholder.complianceStandard.selectStandard', 'Select a compliance standard...')}
          />
        </Column>
        <Column lg={4} md={4} sm={4}>
          <Select
            id="th-group"
            labelText={t('label.complianceThreshold.parameterGroup', 'Parameter Group')}
            defaultValue={threshold?.parameterGroup || ''}
          >
            <SelectItem value="" text={t('placeholder.complianceThreshold.selectGroup', 'Select group...')} />
            <SelectItem value="Physical Parameters" text="Physical Parameters" />
            <SelectItem value="Inorganic Chemical Parameters" text="Inorganic Chemical Parameters" />
            <SelectItem value="Microbiological Parameters" text="Microbiological Parameters" />
          </Select>
        </Column>
        <Column lg={3} md={4} sm={4}>
          <Select
            id="th-type"
            labelText={t('label.complianceThreshold.thresholdType', 'Threshold Type')}
            value={thresholdType}
            onChange={(e) => setThresholdType(e.target.value)}
          >
            <SelectItem value="MAX" text={t('label.complianceThreshold.thresholdType.max', 'Max ≤')} />
            <SelectItem value="MIN" text={t('label.complianceThreshold.thresholdType.min', 'Min ≥')} />
            <SelectItem value="RANGE" text={t('label.complianceThreshold.thresholdType.range', 'Range')} />
            <SelectItem value="DESCRIPTIVE" text={t('label.complianceThreshold.thresholdType.descriptive', 'Qualitative')} />
          </Select>
        </Column>

        {/* Conditional value fields based on threshold type */}
        {(thresholdType === 'MIN' || thresholdType === 'RANGE') && (
          <Column lg={2} md={2} sm={4}>
            <NumberInput
              id="th-value-lower"
              label={t('label.complianceThreshold.valueLower', 'Lower Value')}
              value={threshold?.valueLower || 0}
              step={0.01}
            />
          </Column>
        )}
        {(thresholdType === 'MAX' || thresholdType === 'RANGE') && (
          <Column lg={2} md={2} sm={4}>
            <NumberInput
              id="th-value-upper"
              label={t('label.complianceThreshold.valueUpper', 'Upper Value')}
              value={threshold?.valueUpper || 0}
              step={0.01}
            />
          </Column>
        )}
        {thresholdType === 'DESCRIPTIVE' && (
          <Column lg={4} md={4} sm={4}>
            <TextInput
              id="th-value-descriptive"
              labelText={t('label.complianceThreshold.valueDescriptive', 'Descriptive Value')}
              value={threshold?.valueDescriptive || ''}
              placeholder={t('placeholder.complianceThreshold.descriptive', 'e.g., No odor, Clear, Absent')}
            />
          </Column>
        )}

        <Column lg={2} md={2} sm={4}>
          <TextInput
            id="th-unit"
            labelText={t('label.complianceThreshold.unit', 'Unit')}
            value={threshold?.unit || ''}
            placeholder="mg/L"
          />
        </Column>
        <Column lg={16} md={8} sm={4}>
          <TextArea
            id="th-notes"
            labelText={t('label.complianceThreshold.notes', 'Notes')}
            rows={2}
            placeholder={t('placeholder.complianceThreshold.notes', 'Regulatory notes or methodology reference...')}
          />
        </Column>
      </Grid>

      <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
        <Button kind="primary" size="sm" renderIcon={Save} onClick={onSave}>
          {t('button.complianceStandard.save', 'Save')}
        </Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>
          {t('button.complianceStandard.cancel', 'Cancel')}
        </Button>
      </Stack>
    </Tile>
  );
}


// ============================================================
// TEST EDITOR — Vertical Tab Sidebar (matches test-catalog.jsx)
// Demonstrates where the Compliance tab sits in the editor
// ============================================================

/**
 * The Test Editor uses a vertical tab sidebar with grouped sections.
 * This mirrors the established pattern from test-catalog.jsx:
 *   Configuration: Basic Info, Sample & Results, Ranges, Sample Storage
 *   Organization:  Display Order, Panels, Labels
 *   Resources:     Terminology, Reagents
 *   Automation:    Analyzers, Methods, Alerts, Reflex & Calc
 *   Compliance:    Compliance Thresholds  ← NEW (S-01)
 */

const testEditorTabs = {
  Configuration: [
    { id: 'basic', label: 'Basic Info' },
    { id: 'sample', label: 'Sample & Results' },
    { id: 'ranges', label: 'Ranges' },
    { id: 'storage', label: 'Sample Storage' },
  ],
  Organization: [
    { id: 'ordering', label: 'Display Order' },
    { id: 'panels', label: 'Panels' },
    { id: 'labels', label: 'Labels' },
  ],
  Resources: [
    { id: 'terminology', label: 'Terminology' },
    { id: 'reagents', label: 'Reagents' },
  ],
  Automation: [
    { id: 'analyzers', label: 'Analyzers' },
    { id: 'methods', label: 'Methods' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'reflex', label: 'Reflex & Calc' },
  ],
  Compliance: [
    { id: 'compliance', label: 'Compliance' },
  ],
};

function TestEditorWithCompliance() {
  const [activeTab, setActiveTab] = useState('compliance'); // Default to compliance for demo

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f4f4f4' }}>
      {/* Editor Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', padding: '1rem 1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Button kind="ghost" size="sm" href="#">← Back</Button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                Edit Test: Turbidity (NTU)
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-02)', margin: 0 }}>
                LOINC: 13965-9 &nbsp;|&nbsp; Sample Type: Water &nbsp;|&nbsp; Result Type: Numeric
              </p>
            </div>
          </div>
          <Stack orientation="horizontal" gap={3}>
            <Button kind="secondary" size="sm">Cancel</Button>
            <Button kind="primary" size="sm" renderIcon={Save}>Save Test</Button>
          </Stack>
        </div>
      </div>

      {/* Main Content: Vertical Tab Sidebar + Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Vertical Tab Sidebar — 14rem wide, white bg, right border */}
        <nav style={{ width: '14rem', background: '#fff', borderRight: '1px solid #e0e0e0', flexShrink: 0, overflowY: 'auto', padding: '0.5rem' }}>
          {Object.entries(testEditorTabs).map(([group, tabs]) => (
            <div key={group} style={{ marginBottom: '0.75rem' }}>
              <p style={{ padding: '0.375rem 0.75rem', fontSize: '0.6875rem', fontWeight: 600, color: '#a8a8a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group}
              </p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontWeight: 500,
                    border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
                    marginBottom: '2px', textAlign: 'left',
                    background: activeTab === tab.id ? '#defbe6' : 'transparent',
                    color: activeTab === tab.id ? '#0e6027' : '#525252',
                    borderLeft: activeTab === tab.id ? '3px solid #0e6027' : '3px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Tab Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <div style={{ maxWidth: '64rem' }}>
            {activeTab === 'compliance' && <ComplianceThresholdsTab />}
            {activeTab === 'basic' && (
              <p style={{ color: 'var(--cds-text-02)' }}>(Existing Basic Info tab content — see test-catalog.jsx)</p>
            )}
            {activeTab === 'ranges' && (
              <p style={{ color: 'var(--cds-text-02)' }}>(Existing Ranges tab content — see test-catalog.jsx RangeEditorV3)</p>
            )}
            {!['compliance', 'basic', 'ranges'].includes(activeTab) && (
              <p style={{ color: 'var(--cds-text-02)' }}>(Existing {activeTab} tab content — see test-catalog.jsx)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMBINED APP — Shows both screens with a tab toggle for demo
// ============================================================

export default function ComplianceStandardsApp() {
  const [activeScreen, setActiveScreen] = useState(0);

  return (
    <div>
      <Tabs selectedIndex={activeScreen} onChange={({ selectedIndex }) => setActiveScreen(selectedIndex)}>
        <TabList aria-label="Compliance Standards Screens">
          <Tab>{t('label.complianceStandard.title', 'Compliance Standards List')}</Tab>
          <Tab>{t('label.complianceThreshold.title', 'Compliance Tab (Test Editor)')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <ComplianceStandardsList />
          </TabPanel>
          <TabPanel>
            <TestEditorWithCompliance />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
