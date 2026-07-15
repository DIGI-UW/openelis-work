// Route: /MasterListsPage/reportManagement
// SideNav: Admin → Configuration → Report Management
// FRS: report-management.md
// Model: plugin-with-shipped-defaults — bundled default templates + per-deployment overrides,
//        always revertible. Version-agnostic mockup (breakdown decides v1/v2).

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableExpandHeader, TableExpandRow, TableExpandedRow,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  RadioButtonGroup, RadioButton, Select, SelectItem, FileUploader,
  Button, Tag, Modal, InlineNotification, Tile, Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Document, View, Renew, Upload, WarningAltFilled } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// --- Mock data: the reports OpenELIS ships, seeded from the real report inventory (FR-1/FR-9). ---
// Realistic deployment names; the patient report is the config-driven anchor.
const INITIAL_REPORTS = [
  {
    key: 'patientResult',
    name: 'Patient Result Report',
    category: 'Clinical',
    configurable: true,
    source: 'SHIPPED',              // SHIPPED | CUSTOM
    activeTemplate: 'patient_letter.jrxml',
    activeVersion: 'v3.2 (shipped)',
    variants: [
      { key: 'patient_letter', label: 'Letter — accredited layout' },
      { key: 'patient_a4', label: 'A4 — accredited layout' },
    ],
    activeVariant: 'patient_letter',
    settings: { paperSize: 'LETTER', accreditationLogoPosition: 'BOTTOM' },
    customTemplate: null,           // { filename, uploadedBy, uploadedAt } when uploaded
    newerDefaultAvailable: false,
  },
  {
    key: 'nonConformance',
    name: 'Non-Conformance Report',
    category: 'Quality',
    configurable: true,
    source: 'CUSTOM',
    activeTemplate: 'CPHL_NCE_custom.jrxml',
    activeVersion: 'custom · 2026-05-12',
    variants: [{ key: 'nce_standard', label: 'Standard NCE layout' }],
    activeVariant: 'nce_standard',
    settings: {},
    customTemplate: { filename: 'CPHL_NCE_custom.jrxml', uploadedBy: 'admin', uploadedAt: '2026-05-12' },
    newerDefaultAvailable: true,    // upgrade shipped a newer default while on custom
  },
  {
    key: 'workplan',
    name: 'Workplan',
    category: 'Operational',
    configurable: true,
    source: 'SHIPPED',
    activeTemplate: 'workplan_default.jrxml',
    activeVersion: 'v3.2 (shipped)',
    variants: [{ key: 'workplan_default', label: 'Default workplan layout' }],
    activeVariant: 'workplan_default',
    settings: {},
    customTemplate: null,
    newerDefaultAvailable: false,
  },
  {
    key: 'auditExport',
    name: 'Audit Trail Export',
    category: 'Administrative',
    configurable: false,            // resolution still hard-coded — read-only row (FR-9)
    source: 'SHIPPED',
    activeTemplate: 'audit_export.jrxml',
    activeVersion: 'v3.2 (shipped)',
    variants: [],
    activeVariant: null,
    settings: {},
    customTemplate: null,
    newerDefaultAvailable: false,
  },
];

const categoryTagKind = (c) =>
  ({ Clinical: 'blue', Operational: 'teal', Quality: 'purple', Administrative: 'warm-gray' }[c] || 'gray');

export default function ReportManagement() {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState(null);          // { kind, title }
  const [revertTarget, setRevertTarget] = useState(null);

  const update = useCallback((key, patch) => {
    setReports((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }, []);

  const filtered = useMemo(
    () => reports.filter((r) =>
      (r.name + r.category).toLowerCase().includes(query.toLowerCase())),
    [reports, query]
  );

  const headers = [
    { key: 'name', header: t('admin.reports.list.column.report', 'Report') },
    { key: 'category', header: t('admin.reports.list.column.category', 'Category') },
    { key: 'activeTemplate', header: t('admin.reports.list.column.activeTemplate', 'Active template') },
    { key: 'source', header: t('admin.reports.list.column.source', 'Source') },
    { key: 'status', header: t('admin.reports.list.column.status', 'Status') },
  ];

  const doRevert = () => {
    const r = revertTarget;
    update(r.key, {
      source: 'SHIPPED',
      activeTemplate: `${r.activeVariant || r.key}.jrxml`,
      activeVersion: 'v3.2 (shipped)',
      newerDefaultAvailable: false,
      // customTemplate retained (D-002) — deactivated, not deleted
    });
    setRevertTarget(null);
    setNotice({ kind: 'success', title: t('admin.reports.saved', 'Report settings saved') });
  };

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '1rem' }}>
          <BreadcrumbItem href="#">{t('breadcrumb.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.configuration', 'Configuration')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('admin.reports.title', 'Report Management')}</BreadcrumbItem>
        </Breadcrumb>

        <h2 style={{ marginBottom: '0.25rem' }}>{t('admin.reports.title', 'Report Management')}</h2>
        <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)' }}>
          Choose the template each report uses. Every report ships with a default you can always revert to;
          upload a custom template to override it.
        </p>

        {notice && (
          <InlineNotification
            kind={notice.kind}
            title={notice.title}
            lowContrast
            onCloseButtonClick={() => setNotice(null)}
            style={{ marginBottom: '1rem' }}
          />
        )}

        <DataTable rows={filtered.map((r) => ({ id: r.key, ...r }))} headers={headers}>
          {({ rows, headers, getHeaderProps, getRowProps, getExpandedRowProps, getTableProps, getExpandHeaderProps }) => (
            <TableContainer title="" description="">
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    persistent
                    placeholder="Search reports"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader {...getExpandHeaderProps()} />
                    {headers.map((h) => (
                      <TableHeader {...getHeaderProps({ header: h })} key={h.key}>{h.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const r = reports.find((x) => x.key === row.id);
                    return (
                      <React.Fragment key={row.id}>
                        <TableExpandRow {...getRowProps({ row })}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell><Tag type={categoryTagKind(r.category)}>{r.category}</Tag></TableCell>
                          <TableCell>
                            <span style={{ fontFamily: 'monospace' }}>{r.activeTemplate}</span>
                            <div style={{ fontSize: 12, color: 'var(--cds-text-secondary)' }}>{r.activeVersion}</div>
                          </TableCell>
                          <TableCell>
                            <Tag type={r.source === 'CUSTOM' ? 'blue' : 'gray'}>
                              {r.source === 'CUSTOM'
                                ? t('admin.reports.source.custom', 'Custom')
                                : t('admin.reports.source.shipped', 'Shipped default')}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            {!r.configurable ? (
                              <Tag type="gray">{t('admin.reports.notConfigurable', 'Managed in code — not yet configurable')}</Tag>
                            ) : r.source === 'CUSTOM' ? (
                              <Tag type="blue">{t('admin.reports.status.overridden', 'Overridden')}</Tag>
                            ) : (
                              <Tag type="green">{t('admin.reports.status.active', 'Active')}</Tag>
                            )}
                          </TableCell>
                        </TableExpandRow>

                        <TableExpandedRow {...getExpandedRowProps({ row })} colSpan={headers.length + 1}>
                          {r.configurable
                            ? <ReportDetail report={r} update={update} setNotice={setNotice} onRevert={() => setRevertTarget(r)} />
                            : <ReadOnlyDetail report={r} />}
                        </TableExpandedRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Column>

      {revertTarget && (
        <Modal
          open
          modalHeading={t('admin.reports.revert.modal.title', 'Revert to shipped default?')}
          primaryButtonText={t('admin.reports.revert.modal.confirm', 'Revert')}
          secondaryButtonText={t('admin.reports.revert.modal.cancel', 'Cancel')}
          onRequestClose={() => setRevertTarget(null)}
          onRequestSubmit={doRevert}
          danger
        >
          <p>
            Revert <strong>{revertTarget.name}</strong> to the shipped default template? Your custom
            template is kept and can be re-selected later.
          </p>
        </Modal>
      )}
    </Grid>
  );
}

function ReportDetail({ report: r, update, setNotice, onRevert }) {
  const [uploadError, setUploadError] = useState(null);

  const setSource = (source) => {
    if (source === 'CUSTOM' && !r.customTemplate) {
      setUploadError('Upload a custom template first, then select Custom override and Save.');
      return;
    }
    update(r.key, {
      source,
      activeTemplate: source === 'CUSTOM' ? r.customTemplate.filename : `${r.activeVariant}.jrxml`,
      activeVersion: source === 'CUSTOM' ? `custom · ${r.customTemplate.uploadedAt}` : 'v3.2 (shipped)',
    });
    setNotice({ kind: 'success', title: t('admin.reports.saved', 'Report settings saved') });
  };

  const onUpload = () => {
    // Simulated validation success — real validation checks parameter-compatibility (FR-5).
    update(r.key, { customTemplate: { filename: 'uploaded_template.jrxml', uploadedBy: 'you', uploadedAt: '2026-07-01' } });
    setNotice({ kind: 'info', title: t('admin.reports.detail.upload.success', 'Custom template validated. Select "Custom override" and Save to use it.') });
  };

  return (
    <Tile style={{ padding: '1.25rem', background: 'var(--cds-layer-02)' }}>
      {r.newerDefaultAvailable && (
        <InlineNotification
          kind="warning" lowContrast hideCloseButton
          title={t('admin.reports.upgrade.newDefaultAvailable', 'A newer shipped default is available for this report. You are on a custom override.')}
          style={{ marginBottom: '1rem', maxWidth: 'none' }}
        />
      )}

      <Grid>
        <Column lg={8} md={4} sm={4}>
          <Stack gap={5}>
            <div>
              <p style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--cds-text-secondary)' }}>
                {t('admin.reports.detail.activeTemplate.label', 'Active template')}
              </p>
              <p style={{ fontFamily: 'monospace' }}>{r.activeTemplate} <span style={{ color: 'var(--cds-text-secondary)' }}>· {r.activeVersion}</span></p>
            </div>

            <RadioButtonGroup
              legendText={t('admin.reports.detail.source.label', 'Template source')}
              name={`source-${r.key}`}
              valueSelected={r.source}
              onChange={setSource}
              orientation="vertical"
            >
              <RadioButton labelText={t('admin.reports.detail.source.shipped', 'Shipped default')} value="SHIPPED" id={`src-shipped-${r.key}`} />
              <RadioButton labelText={t('admin.reports.detail.source.custom', 'Custom override')} value="CUSTOM" id={`src-custom-${r.key}`} />
            </RadioButtonGroup>

            {r.variants.length > 1 && r.source === 'SHIPPED' && (
              <Select
                id={`variant-${r.key}`}
                labelText={t('admin.reports.detail.variant.label', 'Layout variant')}
                value={r.activeVariant}
                onChange={(e) => update(r.key, { activeVariant: e.target.value, activeTemplate: `${e.target.value}.jrxml` })}
              >
                {r.variants.map((v) => <SelectItem key={v.key} value={v.key} text={v.label} />)}
              </Select>
            )}
          </Stack>
        </Column>

        <Column lg={8} md={4} sm={4}>
          <Stack gap={5}>
            {/* Per-report settings absorbed from Printed Report config (FR-6) */}
            {('paperSize' in r.settings) && (
              <>
                <p style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--cds-text-secondary)' }}>
                  {t('admin.reports.detail.settings.label', 'Report settings')}
                </p>
                <Select
                  id={`paper-${r.key}`}
                  labelText={t('admin.reports.detail.paperSize.label', 'Paper size')}
                  value={r.settings.paperSize}
                  onChange={(e) => update(r.key, { settings: { ...r.settings, paperSize: e.target.value } })}
                >
                  <SelectItem value="LETTER" text="Letter" />
                  <SelectItem value="A4" text="A4" />
                </Select>
                <Select
                  id={`logo-${r.key}`}
                  labelText={t('admin.reports.detail.accreditationLogoPosition.label', 'Accreditation logo position')}
                  value={r.settings.accreditationLogoPosition}
                  onChange={(e) => update(r.key, { settings: { ...r.settings, accreditationLogoPosition: e.target.value } })}
                >
                  <SelectItem value="BOTTOM" text="Bottom of report (default)" />
                  <SelectItem value="TOP" text="Top of report" />
                </Select>
              </>
            )}

            <FileUploader
              labelTitle={t('admin.reports.detail.upload.label', 'Upload custom template (.jrxml)')}
              labelDescription="Must use only the parameters this report provides."
              buttonLabel="Add file"
              accept={['.jrxml']}
              filenameStatus="edit"
              onChange={onUpload}
            />
            {uploadError && (
              <InlineNotification kind="error" lowContrast title={uploadError} onCloseButtonClick={() => setUploadError(null)} style={{ maxWidth: 'none' }} />
            )}
          </Stack>
        </Column>
      </Grid>

      <Stack orientation="horizontal" gap={3} style={{ marginTop: '1.25rem' }}>
        <Button kind="tertiary" size="sm" renderIcon={View}>{t('admin.reports.detail.preview', 'Preview with sample data')}</Button>
        <Button kind="ghost" size="sm" renderIcon={Renew} onClick={onRevert}>{t('admin.reports.detail.revert', 'Revert to shipped default')}</Button>
      </Stack>
    </Tile>
  );
}

function ReadOnlyDetail({ report: r }) {
  return (
    <Tile style={{ padding: '1.25rem', background: 'var(--cds-layer-02)' }}>
      <InlineNotification
        kind="info" lowContrast hideCloseButton
        title={t('admin.reports.notConfigurable', 'Managed in code — not yet configurable')}
        subtitle={`${r.name} renders from ${r.activeTemplate} (${r.activeVersion}). Template selection for this report is resolved in code until the engine supports registry resolution for it.`}
        style={{ maxWidth: 'none' }}
      />
    </Tile>
  );
}
