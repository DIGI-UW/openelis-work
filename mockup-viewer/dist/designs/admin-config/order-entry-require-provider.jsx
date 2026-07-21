// Route: /MasterListsPage/SampleEntryConfigurationMenu
// SideNav: Admin → General Configurations → Order Entry Configuration
// Breadcrumb: Home / Admin Management / Sample Entry Configuration Menu / Order Entry Configuration
//             (preserve the "Admin" vs "Admin Management" label drift — D-013)
//
// Require requesting provider — this feature adds ONE row to the existing Order Entry
// Configuration property table (Select radio / Name / Description / Value, edited via the
// existing "Modify" button). Nothing else on the page changes.
//
// The existing rows already render from the page's config-property list; this mockup shows a
// couple of them GREYED for context (disabled = existing) and the single NEW row highlighted.
// Do NOT re-implement the whole page — only the new `requireProviderEntry` row + its edit is new.

import React, { useState } from 'react';
import {
  Grid, Column, Breadcrumb, BreadcrumbItem, Button, Tag,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, RadioButton, InlineNotification, RadioButtonGroup,
} from '@carbon/react';

const t = (key, fallback) => fallback || key;

// Context only — these already exist on the page. Shown disabled/greyed.
const EXISTING_ROWS = [
  { id: 'eqaEnabled', name: 'eqaEnabled', description: 'If true, the EQA checkbox appears on Order Entry allowing a sample to be marked as an EQA sample', value: 'false' },
  { id: 'restrictFreeTextProviderEntry', name: 'restrictFreeTextProviderEntry', description: 'Restrict Free Text Provider Entry', value: 'false' },
  { id: 'restrictFreeTextRefSiteEntry', name: 'restrictFreeTextRefSiteEntry', description: 'Users cannot enter new referring sites through sample entry', value: 'false' },
];

const NEW_ROW_ID = 'requireProviderEntry';

export default function OrderEntryRequireProviderRow() {
  const [selectedId, setSelectedId] = useState(null); // only the new row is selectable here
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('true');         // default true = provider required

  const headers = ['select', 'name', 'description', 'value'];

  return (
    <Grid style={{ maxWidth: 1180, margin: '0 auto', paddingTop: '1rem' }}>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: 8 }}>
          <BreadcrumbItem href="#">{t('common.home', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.adminManagement', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="#">{t('breadcrumb.sampleEntryConfigMenu', 'Sample Entry Configuration Menu')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('orderEntryConfig.title', 'Order Entry Configuration')}</BreadcrumbItem>
        </Breadcrumb>

        <h1 style={{ fontWeight: 400, marginBottom: 16 }}>
          {t('orderEntryConfig.title', 'Order Entry Configuration')}
        </h1>

        {/* Existing page control — enabled once a row is selected */}
        <Button
          kind="primary"
          disabled={!selectedId}
          onClick={() => setEditing(true)}
          style={{ marginBottom: 8 }}
        >
          {t('button.modify', 'Modify')}
        </Button>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>{t('common.select', 'Select')}</TableHeader>
                <TableHeader>{t('common.name', 'Name')}</TableHeader>
                <TableHeader>{t('common.description', 'Description')}</TableHeader>
                <TableHeader>{t('common.value', 'Value')}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Existing rows — greyed, non-interactive (they already render on the page) */}
              {EXISTING_ROWS.map((r) => (
                <TableRow key={r.id} style={{ opacity: 0.45 }}>
                  <TableCell><RadioButton id={`sel-${r.id}`} labelText="" disabled /></TableCell>
                  <TableCell>
                    {r.name}
                    <Tag type="gray" size="sm" style={{ marginLeft: 8 }}>{t('mockup.existing', 'existing')}</Tag>
                  </TableCell>
                  <TableCell>{r.description}</TableCell>
                  <TableCell><code>{r.value}</code></TableCell>
                </TableRow>
              ))}

              {/* --- The one NEW row this feature adds --- */}
              <TableRow style={{ background: 'var(--cds-highlight)' }}>
                <TableCell>
                  <RadioButton
                    id={`sel-${NEW_ROW_ID}`}
                    labelText=""
                    checked={selectedId === NEW_ROW_ID}
                    onChange={() => { setSelectedId(NEW_ROW_ID); setEditing(false); }}
                  />
                </TableCell>
                <TableCell>
                  {t('orderEntryConfig.requireProviderEntry.name', 'Require requesting provider')}
                  <Tag type="blue" size="sm" style={{ marginLeft: 8 }}>{t('common.new', 'New')}</Tag>
                </TableCell>
                <TableCell>
                  {t('orderEntryConfig.requireProviderEntry.description',
                    'When on, staff must select a requesting provider to save an order. When off, the referring facility (Site Name) is required instead.')}
                </TableCell>
                <TableCell><code>{value}</code></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Modify editor — reuses the page's existing edit affordance for a boolean property */}
        {editing && (
          <div style={{ border: '1px solid var(--cds-interactive)', padding: 16, marginTop: 0 }}>
            <RadioButtonGroup
              legendText={t('orderEntryConfig.requireProviderEntry.name', 'Require requesting provider')}
              name="requireProviderEntry"
              valueSelected={value}
              onChange={(v) => setValue(v)}
            >
              <RadioButton labelText={t('orderEntryConfig.value.trueRequired', 'true — provider required (default)')} value="true" id="rpe-true" />
              <RadioButton labelText={t('orderEntryConfig.value.falseFacility', 'false — facility required instead')} value="false" id="rpe-false" />
            </RadioButtonGroup>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Button kind="primary" onClick={() => setEditing(false)}>{t('common.save', 'Save')}</Button>
              <Button kind="ghost" onClick={() => setEditing(false)}>{t('common.cancel', 'Cancel')}</Button>
            </div>
          </div>
        )}

        <InlineNotification
          kind="info"
          lowContrast
          hideCloseButton
          style={{ marginTop: 20, maxWidth: '100%' }}
          title={t('orderEntryConfig.effect.title', 'Effect on the order form')}
          subtitle={t('orderEntryConfig.effect.subtitle',
            'At true (default) the Requester → Provider field is required, as today. At false, Provider becomes optional (field stays visible) and Site Name becomes the required field — every order still carries a requester of record.')}
        />

        <InlineNotification
          kind="warning"
          lowContrast
          hideCloseButton
          style={{ marginTop: 12, maxWidth: '100%' }}
          title={t('orderEntryConfig.audit.title', 'Downstream data audit (implementation gate)')}
          subtitle={t('orderEntryConfig.audit.subtitle',
            'Setting the value to false requires null-safing every consumer that assumed a provider is present: order-entry validation (form + API), FHIR requester/Practitioner export, printed reports, Test Notification Provider Email/SMS channels, result routing, provider search/reports, DB nullability, labels, audit. See the FRS Downstream Data Audit section — completed by the developer and Claude Code as acceptance criteria.')}
        />
      </Column>
    </Grid>
  );
}
