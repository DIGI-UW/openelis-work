// Report Management: developer handoff mockup (FRS: admin-redesign-frs.md v1.0 §13; formerly Part B of the patient report FRS)
// Route: /MasterListsPage/reportManagement   (old /MasterListsPage/PrintedReportsConfigurationMenu redirects here)
// SideNav: Admin › Config › Report Management, top level after Configuration (replaces "Printed Reports", D-065, D-156)
// Breadcrumb: Home / Admin Management / Report Management (D-192)
// Access: existing Admin role only (D-006). No new permission keys.
//
// Mock data only. Every string goes through t(key, fallback); keys are listed in admin-redesign-frs.md §15.4.
// V2-only sections render when showV2 is true (RM-12 to RM-19).
// Existing shipped components are NOT redrawn here: the Admin SideNav and page shell are reused as they ship (D-063).

import React, { useMemo, useState } from 'react';
import {
  Grid, Column, Stack, Breadcrumb, BreadcrumbItem, Tile, Button, Link, Tag,
  RadioButtonGroup, RadioButton, TextInput, Toggle, InlineNotification, Modal,
  FileUploaderButton, DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableExpandHeader, TableExpandRow, TableExpandedRow,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
} from '@carbon/react';
import { View, Reset } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// Report list comes from the existing report configuration records (reportconfiguration.Report,
// ReportCategory): display key, category, sort order, visibility (RM-4). Mocked here.
const REPORTS = [
  { id: 'patientCILNSP_vreduit', name: 'Patient Status Report', category: 'Clinical', template: 'patient_letter / patient_a4', configurable: true, hasA4: true },
  { id: 'patientCILNSP', name: 'Patient Report (full)', category: 'Clinical', template: 'PatientReportCDI', configurable: false },
  { id: 'pathology', name: 'Pathology Report', category: 'Clinical', template: 'PatientPathologyReport', configurable: false },
  { id: 'cytology', name: 'Cytology Report', category: 'Clinical', template: 'PatientCytologyReport', configurable: false },
  { id: 'TBPatientReport', name: 'TB Patient Report', category: 'Clinical', template: 'TBPatientReport', configurable: false },
  { id: 'activityReportByTest', name: 'Activity Report by Test', category: 'Management', template: 'ActivityReport', configurable: false },
  { id: 'rejection', name: 'Sample Rejection Report', category: 'Quality', template: 'RejectionReport', configurable: false },
];

const CUSTOM_TEMPLATES = [
  { id: 'cphl_patient_2026', label: 'cphl_patient_2026', pair: true, modified: '2026-09-20 16:02', usable: true },
  { id: 'cphl_patient_2025.jrxml', label: 'cphl_patient_2025.jrxml', pair: false, modified: '2025-11-03 10:11', usable: true },
  { id: 'draft_accred_footer.jrxml', label: 'draft_accred_footer.jrxml', pair: false, modified: '2026-09-25 08:47', usable: false,
    reasons: ['Unknown parameter: accreditationFooterTitle', 'Unknown field: specimenQualityCode'] },
];

// ---------------------------------------------------------------------------------------------
// Print defaults (RM-1 to RM-3)
// ---------------------------------------------------------------------------------------------
function PrintDefaults() {
  const [saved, setSaved] = useState('A4');
  const [paper, setPaper] = useState('A4');
  const [notice, setNotice] = useState(false);
  return (
    <Tile>
      <Stack gap={5}>
        <h4>{t('admin.reports.defaults.title', 'Print defaults')}</h4>
        <RadioButtonGroup
          legendText={t('admin.reports.defaults.paperSize', 'Paper size')}
          name="paper-size"
          valueSelected={paper}
          onChange={setPaper}
          helperText={t('admin.reports.defaults.paperSize.help', 'Applies to every report that has a Letter and an A4 layout.')}
        >
          <RadioButton id="paper-letter" value="LETTER" labelText={t('admin.reports.defaults.paperSize.letter', 'US Letter (8.5 × 11 in)')} />
          <RadioButton id="paper-a4" value="A4" labelText={t('admin.reports.defaults.paperSize.a4', 'A4 (210 × 297 mm)')} />
        </RadioButtonGroup>
        <div>
          <Button size="sm" kind="primary" disabled={paper === saved} onClick={() => { setSaved(paper); setNotice(true); }}>
            {t('common.save', 'Save')}
          </Button>
        </div>
        {notice && (
          <InlineNotification kind="success" lowContrast onClose={() => setNotice(false)}
            title={t('admin.reports.defaults.saved', 'Print defaults saved. New reports use them from now on.')} />
        )}
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------------------------
// Image control: square preview for logos, 4:1 for the signature (RM-7)
// ---------------------------------------------------------------------------------------------
function ImageSetting({ id, label, help, shape, initial }) {
  const [image, setImage] = useState(initial);
  const [invalid, setInvalid] = useState(false);
  const box = shape === 'square' ? { width: 96, height: 96 } : { width: 192, height: 48 };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const ok = ['image/png', 'image/jpeg'].includes(f.type) && f.size <= 2 * 1024 * 1024;
    setInvalid(!ok);
    if (ok) setImage(URL.createObjectURL(f)); // saves at once, as today; audited (RM-20)
  };
  return (
    <Stack gap={3}>
      <span className="cds--label">{label}</span>
      <div style={{ ...box, border: '1px solid var(--cds-border-strong-01)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cds-layer-01)' }}>
        {image
          ? <img src={image} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <span className="cds--label">{t('admin.reports.branding.none', 'No image')}</span>}
      </div>
      <Stack orientation="horizontal" gap={3}>
        <FileUploaderButton id={`${id}-upload`} size="sm" buttonKind="tertiary" accept={['.png', '.jpg', '.jpeg']}
          labelText={t('admin.reports.branding.replace', 'Replace')} disableLabelChanges onChange={onFile} />
        <Button size="sm" kind="ghost" disabled={!image} onClick={() => setImage(null)}>{t('admin.reports.branding.remove', 'Remove')}</Button>
      </Stack>
      <span className="cds--form__helper-text">{help}</span>
      {invalid && (
        <InlineNotification kind="error" lowContrast hideCloseButton
          title={t('admin.reports.branding.invalidImage', 'Choose a PNG or JPEG file up to 2 MB.')} />
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------------------------
// Template registry, V2 (RM-12 to RM-19)
// ---------------------------------------------------------------------------------------------
function TemplateSection({ active, selected, setSelected, previewed, onPreview, onRevert, history }) {
  const usable = CUSTOM_TEMPLATES.filter((c) => c.usable);
  const unusable = CUSTOM_TEMPLATES.filter((c) => !c.usable);
  return (
    <Stack gap={5}>
      <h5>{t('admin.reports.template.title', 'Template')}</h5>
      {active !== 'shipped' && (
        <InlineNotification kind="info" lowContrast hideCloseButton
          title={t('admin.reports.template.newerDefault', 'A newer shipped template is available. This report uses a custom template.')}
          actionButtonLabel={t('admin.reports.template.previewShipped', 'Preview shipped template')} />
      )}
      <RadioButtonGroup orientation="vertical" name="template" legendText={t('admin.reports.template.title', 'Template')}
        valueSelected={selected} onChange={setSelected}>
        <RadioButton id="tpl-shipped" value="shipped"
          labelText={`${t('admin.reports.template.shippedDefault', 'Shipped default')}: patient_letter / patient_a4`} />
        {usable.map((c) => (
          <RadioButton key={c.id} id={`tpl-${c.id}`} value={c.id}
            labelText={`${c.label} · ${t('admin.reports.template.meta', 'Configuration folder, modified {0}').replace('{0}', c.modified)}${c.pair ? ` · ${t('admin.reports.template.pair', 'Letter and A4 pair')}` : ''}`} />
        ))}
      </RadioButtonGroup>
      {unusable.map((c) => (
        <Stack key={c.id} gap={2}>
          <span>{c.label} <Tag type="red" size="sm">{t('admin.reports.template.notUsable', 'Not usable')}</Tag></span>
          {c.reasons.map((r) => <code key={r} className="cds--form-requirement" style={{ display: 'block' }}>{r}</code>)}
        </Stack>
      ))}
      <span className="cds--form__helper-text">
        {t('admin.reports.template.help', "Custom templates are placed in the server's configuration folder by the server operator. This page does not accept template uploads.")}
      </span>
      <Stack orientation="horizontal" gap={3}>
        <Button size="sm" kind="tertiary" renderIcon={View} onClick={onPreview}>{t('admin.reports.template.preview', 'Preview with sample data')}</Button>
        <Button size="sm" kind="danger--tertiary" renderIcon={Reset} disabled={active === 'shipped'} onClick={onRevert}>
          {t('admin.reports.template.revert', 'Revert to shipped default')}
        </Button>
      </Stack>
      {selected !== active && !previewed[selected] && (
        <span className="cds--form__helper-text">{t('admin.reports.template.previewFirst', 'Preview this template before activating it.')}</span>
      )}
      <DataTable
        rows={history}
        headers={[
          { key: 'date', header: t('admin.reports.template.history.col.date', 'Date') },
          { key: 'user', header: t('admin.reports.template.history.col.user', 'User') },
          { key: 'from', header: t('admin.reports.template.history.col.from', 'From') },
          { key: 'to', header: t('admin.reports.template.history.col.to', 'To') },
        ]}
        size="sm"
      >
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer title={t('admin.reports.template.history', 'Recent template changes')}>
            <Table {...getTableProps()}>
              <TableHead><TableRow>{headers.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}</TableRow></TableHead>
              <TableBody>{rows.map((r) => <TableRow key={r.id} {...getRowProps({ row: r })}>{r.cells.map((c) => <TableCell key={c.id}>{c.value}</TableCell>)}</TableRow>)}</TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </Stack>
  );
}

// ---------------------------------------------------------------------------------------------
// Patient Status Report row expansion (RM-7 to RM-11, plus V2 template section)
// ---------------------------------------------------------------------------------------------
function PatientReportSettings({ showV2 }) {
  const initial = { title: 'Dr.', given: 'Mary', surname: 'Kila', info: 'Port Moresby General Hospital campus, Boroko, NCD' };
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState(initial);
  const [notice, setNotice] = useState(null);
  const [active, setActive] = useState('shipped');
  const [selected, setSelected] = useState('shipped');
  const [previewed, setPreviewed] = useState({ shipped: true });
  const [revertOpen, setRevertOpen] = useState(false);
  const [history, setHistory] = useState([
    { id: 'h1', date: '2026-08-02 09:14', user: 'admin.kaupa', from: 'cphl_patient_2025.jrxml', to: 'Shipped default' },
  ]);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved) || selected !== active;
  const templateOk = selected === active || previewed[selected];
  const label = (id) => (id === 'shipped' ? t('admin.reports.template.shippedDefault', 'Shipped default') : id);

  const save = () => {
    setSaved(form);
    if (selected !== active) {
      setHistory([{ id: `h${history.length + 1}`, date: '2026-09-30 10:20', user: 'admin.kaupa', from: label(active), to: label(selected) }, ...history]);
      setActive(selected);
    }
    setNotice(t('admin.reports.saved', 'Report settings saved.'));
  };

  return (
    <Stack gap={7} style={{ padding: '1rem 0' }}>
      <Stack gap={5}>
        <h5>{t('admin.reports.branding.title', 'Header and branding')}</h5>
        <Grid narrow>
          <Column lg={5} md={4} sm={4}>
            <ImageSetting id="left-logo" shape="square" initial={null}
              label={t('admin.reports.branding.leftLogo', 'Left header logo')}
              help={t('admin.reports.branding.logoHelp', 'Square works best, at least 300 × 300 px. Other shapes are scaled to fit the square.')} />
          </Column>
          <Column lg={5} md={4} sm={4}>
            <ImageSetting id="right-logo" shape="square" initial={null}
              label={t('admin.reports.branding.rightLogo', 'Right header logo')}
              help={t('admin.reports.branding.logoHelp', 'Square works best, at least 300 × 300 px. Other shapes are scaled to fit the square.')} />
          </Column>
          <Column lg={6} md={8} sm={4}>
            <ImageSetting id="signature" shape="wide" initial={null}
              label={t('admin.reports.branding.signature', 'Lab director signature')}
              help={t('admin.reports.branding.signatureHelp', 'At least 800 × 200 px on a white background.')} />
          </Column>
        </Grid>
      </Stack>

      <Stack gap={5}>
        <h5>{t('admin.reports.lines.title', 'Header lines')}</h5>
        <div>
          <span className="cds--label">{t('admin.reports.lines.siteName', 'Lab name')}</span>
          <p>Central Public Health Laboratory <Link href="/MasterListsPage/configuration?setting=SiteName">{t('admin.reports.lines.siteNameLink', 'Edit in Configuration')}</Link></p>
        </div>
        <Grid narrow>
          <Column lg={3} md={2} sm={4}>
            <TextInput id="dir-title" labelText={t('admin.reports.lines.directorTitle', 'Lab director title')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Column>
          <Column lg={5} md={3} sm={4}>
            <TextInput id="dir-given" labelText={t('admin.reports.lines.directorGiven', 'Lab director given name')} value={form.given} onChange={(e) => setForm({ ...form, given: e.target.value })} />
          </Column>
          <Column lg={5} md={3} sm={4}>
            <TextInput id="dir-surname" labelText={t('admin.reports.lines.directorSurname', 'Lab director surname')} value={form.surname} onChange={(e) => setForm({ ...form, surname: e.target.value })} />
          </Column>
          <Column lg={13} md={8} sm={4} style={{ marginTop: '1rem' }}>
            <TextInput id="add-info" labelText={t('admin.reports.lines.additionalInfo', 'Additional site information line')} value={form.info} onChange={(e) => setForm({ ...form, info: e.target.value })}
              helperText={t('admin.reports.lines.pageNumbersNote', 'Pages are always numbered "Page x of y".')} />
          </Column>
        </Grid>
      </Stack>

      <Stack gap={3}>
        <h5>{t('admin.reports.accreditation.title', 'Accreditation')}</h5>
        <p>
          {t('admin.reports.accreditation.summary', 'Active accrediting bodies: {0}.').replace('{0}', 'ISO 15189 (PNGAS), SANAS')}{' '}
          <Link href="#">{t('admin.reports.accreditation.link', 'Manage accreditation')}</Link>
        </p>
        <span className="cds--form__helper-text">{t('admin.reports.accreditation.help', 'Marks print in the report header, up to three. Results outside the accredited scope are marked with †.')}</span>
      </Stack>

      <Stack gap={3}>
        <h5>{t('admin.reports.signatures.title', 'Signatures')}</h5>
        {/* Filled by OGC-302 (report-level e-signatures), including esig.report.show_lab_director_signature (RM-10) */}
        <p>{t('admin.reports.signatures.placeholder', 'Electronic signature settings will appear here.')}</p>
      </Stack>

      {showV2 && (
        <TemplateSection active={active} selected={selected} setSelected={setSelected} previewed={previewed} history={history}
          onPreview={() => { setPreviewed({ ...previewed, [selected]: true }); setNotice(t('admin.reports.template.previewDone', 'Preview opened in a new tab.')); }}
          onRevert={() => setRevertOpen(true)} />
      )}

      {notice && <InlineNotification kind="success" lowContrast title={notice} onClose={() => setNotice(null)} />}
      <Stack orientation="horizontal" gap={3}>
        <Button size="sm" kind="primary" disabled={!dirty || !templateOk} onClick={save}>{t('common.save', 'Save')}</Button>
        <Button size="sm" kind="secondary" disabled={!dirty} onClick={() => { setForm(saved); setSelected(active); }}>{t('common.cancel', 'Cancel')}</Button>
      </Stack>

      <Modal open={revertOpen} danger size="sm"
        modalHeading={t('admin.reports.template.revert.modal.title', 'Revert to shipped default?')}
        primaryButtonText={t('admin.reports.template.revert.modal.confirm', 'Revert')}
        secondaryButtonText={t('common.cancel', 'Cancel')}
        onRequestClose={() => setRevertOpen(false)}
        onRequestSubmit={() => {
          setHistory([{ id: `h${history.length + 1}`, date: '2026-09-30 10:21', user: 'admin.kaupa', from: label(active), to: label('shipped') }, ...history]);
          setActive('shipped'); setSelected('shipped'); setRevertOpen(false);
        }}>
        <p>{t('admin.reports.template.revert.modal.body', 'Revert {0} to the shipped template? The custom template stays in the configuration folder and can be selected again.').replace('{0}', 'Patient Status Report')}</p>
      </Modal>
    </Stack>
  );
}

// ---------------------------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------------------------
export default function ReportManagementPage({ showV2 = true }) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => REPORTS.filter((r) =>
    (showAll || r.configurable) && `${r.name} ${r.category}`.toLowerCase().includes(search.toLowerCase())), [search, showAll]);

  const headers = [
    { key: 'name', header: t('admin.reports.list.col.report', 'Report') },
    { key: 'category', header: t('admin.reports.list.col.category', 'Category') },
    { key: 'template', header: t('admin.reports.list.col.template', 'Template') },
  ];
  const hidden = REPORTS.filter((r) => !r.configurable).length;

  return (
    <Grid fullWidth>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('home.label', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/MasterListsPage">{t('breadcrums.admin.managment', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('admin.reports.title', 'Report Management')}</BreadcrumbItem>
        </Breadcrumb>
        <h2 style={{ marginTop: '1rem' }}>{t('admin.reports.title', 'Report Management')}</h2>
        <p style={{ marginBottom: '1.5rem' }}>{t('admin.reports.subtitle', 'Choose how OpenELIS prints reports for this lab.')}</p>
      </Column>

      <Column lg={16} md={8} sm={4} style={{ marginBottom: '1.5rem' }}>
        <PrintDefaults />
      </Column>

      <Column lg={16} md={8} sm={4}>
        <DataTable rows={visible} headers={headers}>
          {({ rows, headers: hdrs, getHeaderProps, getRowProps, getTableProps, getExpandHeaderProps }) => (
            <TableContainer>
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch persistent placeholder={t('admin.reports.list.search', 'Search reports')} onChange={(e) => setSearch(e.target ? e.target.value : '')} />
                  <Toggle id="show-not-configurable" size="sm" labelText="" hideLabel
                    labelA={t('admin.reports.list.showNotConfigurable', 'Show not configurable')}
                    labelB={t('admin.reports.list.showNotConfigurable', 'Show not configurable')}
                    toggled={showAll} onToggle={setShowAll} />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader {...getExpandHeaderProps()} />
                    {hdrs.map((h) => <TableHeader key={h.key} {...getHeaderProps({ header: h })}>{h.header}</TableHeader>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const report = REPORTS.find((r) => r.id === row.id);
                    const cells = [
                      <TableCell key="n">{report.name}</TableCell>,
                      <TableCell key="c"><Tag type="gray" size="sm">{report.category}</Tag></TableCell>,
                      <TableCell key="t">
                        {report.template}{' '}
                        {report.configurable
                          ? <Tag type="gray" size="sm">{t('admin.reports.source.shipped', 'Shipped default')}</Tag>
                          : <span className="cds--label">{t('admin.reports.source.managedInCode', 'Managed in code')} · {t('admin.reports.letterOnly', 'Letter only')}</span>}
                      </TableCell>,
                    ];
                    if (!report.configurable) {
                      // Not expandable in V1 (RM-5)
                      return <TableRow key={row.id} {...getRowProps({ row })}><TableCell />{cells}</TableRow>;
                    }
                    return (
                      <React.Fragment key={row.id}>
                        <TableExpandRow {...getRowProps({ row })}>{cells}</TableExpandRow>
                        {row.isExpanded && (
                          <TableExpandedRow colSpan={hdrs.length + 1}>
                            <PatientReportSettings showV2={showV2} />
                          </TableExpandedRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow><TableCell colSpan={hdrs.length + 1}>{t('admin.reports.list.empty', 'No reports match your search.')}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        {!showAll && (
          <p className="cds--form__helper-text" style={{ marginTop: '0.5rem' }}>
            {t('admin.reports.list.hiddenCount', '{0} reports are managed in code and hidden.').replace('{0}', String(hidden))}
          </p>
        )}
      </Column>
    </Grid>
  );
}
