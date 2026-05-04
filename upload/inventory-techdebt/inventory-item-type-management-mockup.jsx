import React, { useState, useMemo } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  Tile, TextInput, NumberInput, Select, SelectItem, Toggle,
  Button, Tag, Modal, InlineNotification,
  Breadcrumb, BreadcrumbItem,
} from '@carbon/react';
import { Add, Edit, Close, Save } from '@carbon/icons-react';

// i18n helper — replace with project's t() in real implementation
const t = (key, fallback) => fallback || key;

// Active deployment locales — drive this from system config in real build
const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

// Seed data — represents what comes pre-populated via Liquibase migration.
// In real component, fetch from /rest/inventory-item-type endpoint.
const SEED_ROWS = [
  {
    id: 1, code: 'REAGENT', name: 'Reagent',
    localized: { en: 'Reagent', fr: 'Réactif', id: 'Reagen' },
    active: true, sortOrder: 10, seeded: true,
  },
  {
    id: 2, code: 'TEST_KIT', name: 'Test Kit',
    localized: { en: 'Test Kit', fr: 'Kit de test', id: 'Kit Tes' },
    active: true, sortOrder: 20, seeded: true,
  },
  {
    id: 3, code: 'CONTROL', name: 'Control Material',
    localized: { en: 'Control Material', fr: 'Matériel de contrôle', id: 'Bahan Kontrol' },
    active: true, sortOrder: 30, seeded: true,
  },
  {
    id: 4, code: 'CALIBRATOR', name: 'Calibrator',
    localized: { en: 'Calibrator', fr: 'Calibrateur', id: '' },
    active: true, sortOrder: 40, seeded: true,
  },
  {
    id: 5, code: 'CONSUMABLE', name: 'Consumable',
    localized: { en: 'Consumable', fr: 'Consommable', id: 'Bahan Habis Pakai' },
    active: true, sortOrder: 50, seeded: true,
  },
  {
    id: 6, code: 'GENERAL_SUPPLY', name: 'General Supply',
    localized: { en: 'General Supply', fr: 'Fourniture générale', id: '' },
    active: true, sortOrder: 60, seeded: true,
  },
  {
    id: 7, code: 'STAIN', name: 'Stain',
    localized: { en: 'Stain', fr: 'Colorant', id: 'Pewarna' },
    active: false, sortOrder: 70, seeded: false,
  },
];

const StatusTag = ({ active }) => (
  active
    ? <Tag type="green">{t('label.active', 'Active')}</Tag>
    : <Tag type="gray">{t('label.inactive', 'Inactive')}</Tag>
);

const EditPanel = ({ row, isNew, activeLocale, onSave, onCancel, onDeactivate }) => {
  const [draft, setDraft] = useState({
    ...row,
    nameInLocale: row.localized[activeLocale.code] || row.name,
  });

  const updateName = (value) => {
    setDraft({
      ...draft,
      nameInLocale: value,
      localized: { ...draft.localized, [activeLocale.code]: value },
      name: isNew ? value : draft.name,
    });
  };

  const codeHint = isNew
    ? t('hint.itemtype.code.new',
       'Stable identifier used by integrations. Leave blank and we\'ll generate one from the name.')
    : t('hint.itemtype.code.locked',
       'Code is locked once saved so integrations and existing items keep working.');

  const nameHint = row.seeded
    ? t('hint.itemtype.name.seeded',
       'You can rename this seeded type for the current locale. Translations for other languages are managed by the system release.')
    : t('hint.itemtype.name.custom',
       'Saves as the name in your active locale. Other locales fall back to this value until separately translated.');

  return (
    <Tile style={{ padding: '1.25rem', backgroundColor: '#fafafa' }}>
      <Grid narrow>
        <Column lg={8} md={4} sm={4}>
          <TextInput
            id={`itemtype-code-${row.id}`}
            labelText={t('label.itemtype.code', 'Code')}
            value={draft.code}
            disabled={!isNew}
            placeholder={isNew ? t('placeholder.itemtype.code', 'Leave blank to auto-generate from name') : ''}
            helperText={codeHint}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
          />
        </Column>
        <Column lg={8} md={4} sm={4}>
          <TextInput
            id={`itemtype-name-${row.id}`}
            labelText={
              <>
                {t('label.itemtype.name', 'Name')}{' '}
                <span style={{ color: 'var(--cds-link-primary)', fontWeight: 600 }}>
                  · {t('label.editingin', 'Editing in')} {activeLocale.label}
                </span>
              </>
            }
            value={draft.nameInLocale}
            onChange={(e) => updateName(e.target.value)}
            helperText={nameHint}
          />
        </Column>
        <Column lg={4} md={2} sm={2} style={{ marginTop: '1rem' }}>
          <NumberInput
            id={`itemtype-sortorder-${row.id}`}
            label={t('label.itemtype.sortorder', 'Sort order')}
            value={draft.sortOrder}
            min={0}
            step={10}
            onChange={(e, { value }) => setDraft({ ...draft, sortOrder: value })}
          />
        </Column>
        <Column lg={4} md={2} sm={2} style={{ marginTop: '1rem' }}>
          <Toggle
            id={`itemtype-active-${row.id}`}
            labelText={t('label.itemtype.status', 'Status')}
            labelA={t('label.inactive', 'Inactive')}
            labelB={t('label.active', 'Active')}
            toggled={draft.active}
            onToggle={(checked) => setDraft({ ...draft, active: checked })}
          />
        </Column>
      </Grid>

      <Stack
        orientation="horizontal"
        gap={3}
        style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--cds-border-subtle)' }}
      >
        <Button kind="primary" size="md" renderIcon={Save} onClick={() => onSave(draft)}>
          {isNew ? t('button.add', 'Add item type') : t('button.save', 'Save changes')}
        </Button>
        <Button kind="ghost" size="md" onClick={onCancel}>
          {t('button.cancel', 'Cancel')}
        </Button>
        <div style={{ flex: 1 }} />
        {!isNew && draft.active && (
          <Button kind="danger--tertiary" size="md" onClick={() => onDeactivate(draft)}>
            {t('button.deactivate', 'Deactivate')}
          </Button>
        )}
      </Stack>
    </Tile>
  );
};

const InventoryItemTypeManagement = () => {
  const [rows, setRows] = useState(SEED_ROWS);
  const [expandedId, setExpandedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeLocale, setActiveLocale] = useState(LOCALES[0]);

  const nameFor = (row) => row.localized[activeLocale.code] || row.name;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      r.code.toLowerCase().includes(q) ||
      nameFor(r).toLowerCase().includes(q)
    );
  }, [rows, search, activeLocale]);

  const blankRow = {
    id: -1, code: '', name: '',
    localized: { en: '', fr: '', id: '' },
    active: true, sortOrder: (rows.length + 1) * 10, seeded: false,
  };

  const handleSaveNew = (draft) => {
    const code = draft.code.trim() ||
      draft.nameInLocale.trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
    const newRow = {
      ...draft,
      id: Date.now(),
      code,
      name: draft.nameInLocale,
      localized: { ...draft.localized, [activeLocale.code]: draft.nameInLocale },
    };
    setRows([...rows, newRow]);
    setAdding(false);
    setNotification({
      kind: 'success',
      title: t('notify.added.title', 'Item type added'),
      subtitle: `${newRow.nameInLocale} (${code})`,
    });
  };

  const handleSaveEdit = (draft) => {
    const merged = {
      ...draft,
      localized: { ...draft.localized, [activeLocale.code]: draft.nameInLocale },
    };
    setRows(rows.map(r => r.id === draft.id ? merged : r));
    setExpandedId(null);
    setNotification({
      kind: 'success',
      title: t('notify.saved.title', 'Changes saved'),
      subtitle: `${draft.nameInLocale} · ${activeLocale.label}`,
    });
  };

  const handleDeactivate = (draft) => setConfirmDeactivate(draft);

  const confirmDeactivation = () => {
    setRows(rows.map(r =>
      r.id === confirmDeactivate.id ? { ...r, active: false } : r
    ));
    setNotification({
      kind: 'info',
      title: t('notify.deactivated.title', 'Item type deactivated'),
      subtitle: t('notify.deactivated.body',
        'Existing inventory items keep this type. It will no longer appear for new items.'),
    });
    setConfirmDeactivate(null);
    setExpandedId(null);
  };

  const headers = [
    { key: 'code', header: t('col.code', 'Code') },
    { key: 'name', header: `${t('col.name', 'Name')} (${activeLocale.label})` },
    { key: 'status', header: t('col.status', 'Status') },
    { key: 'sortOrder', header: t('col.sortorder', 'Sort order') },
    { key: 'actions', header: t('col.actions', 'Actions') },
  ];

  return (
    <Grid fullWidth condensed style={{ padding: '1rem 2rem', maxWidth: '1280px' }}>
      <Column lg={16} md={8} sm={4}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#">{t('breadcrumb.admin', 'Admin')}</BreadcrumbItem>
          <BreadcrumbItem href="#">
            {t('breadcrumb.generalconfig', 'General Configuration')}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('breadcrumb.inventory', 'Inventory')}</BreadcrumbItem>
        </Breadcrumb>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 400, margin: '0.5rem 0 0.25rem' }}>
          {t('page.itemtype.title', 'Inventory Item Types')}
        </h1>
        <p style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '60ch' }}>
          {t('page.itemtype.help',
            'Manage the list of types available when creating an inventory item. Adding, renaming, or deactivating a type takes effect on the Inventory Catalog form immediately — no code change or redeploy required.')}
        </p>

        {notification && (
          <InlineNotification
            kind={notification.kind}
            title={notification.title}
            subtitle={notification.subtitle}
            onCloseButtonClick={() => setNotification(null)}
            style={{ maxWidth: '100%', marginBottom: '1rem' }}
          />
        )}

        <DataTable rows={filtered.map(r => ({ ...r, id: String(r.id) }))} headers={headers}>
          {({ getTableProps, getTableContainerProps }) => (
            <TableContainer
              title={t('table.itemtype.title', 'Item types')}
              description={`${filtered.length} of ${rows.length} · ${t('table.itemtype.editingin', 'Editing in')} ${activeLocale.label}`}
              {...getTableContainerProps()}
            >
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch
                    placeholder={t('toolbar.search.placeholder', 'Search by code or name')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <Select
                    id="active-locale-select"
                    labelText=""
                    hideLabel
                    inline
                    size="md"
                    value={activeLocale.code}
                    onChange={(e) =>
                      setActiveLocale(LOCALES.find(l => l.code === e.target.value))
                    }
                  >
                    {LOCALES.map(loc => (
                      <SelectItem
                        key={loc.code}
                        value={loc.code}
                        text={`${t('toolbar.locale.label', 'Editing in:')} ${loc.label}`}
                      />
                    ))}
                  </Select>
                  <Button
                    kind="primary"
                    renderIcon={Add}
                    onClick={() => { setAdding(true); setExpandedId(null); }}
                    disabled={adding}
                  >
                    {t('button.add.itemtype', 'Add item type')}
                  </Button>
                </TableToolbarContent>
              </TableToolbar>

              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map(h => <TableHeader key={h.key}>{h.header}</TableHeader>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adding && (
                    <>
                      <TableRow style={{ background: 'var(--cds-layer-accent-01)' }}>
                        <TableCell colSpan={headers.length}
                          style={{ fontSize: '0.8125rem', color: 'var(--cds-link-primary)', fontWeight: 600 }}>
                          {t('table.itemtype.newrow', 'New inventory item type')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={headers.length} style={{ padding: 0 }}>
                          <EditPanel
                            row={blankRow}
                            isNew
                            activeLocale={activeLocale}
                            onSave={handleSaveNew}
                            onCancel={() => setAdding(false)}
                          />
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                  {filtered.map(row => (
                    <React.Fragment key={row.id}>
                      <TableRow>
                        <TableCell><code style={{ fontSize: '0.8125rem' }}>{row.code}</code></TableCell>
                        <TableCell>
                          {nameFor(row)}
                          {!row.localized[activeLocale.code] && (
                            <span style={{
                              marginLeft: '0.5rem',
                              color: 'var(--cds-text-helper)',
                              fontStyle: 'italic',
                              fontSize: '0.8125rem',
                            }}>
                              {t('label.fallback.shown', `(no ${activeLocale.label} translation — fallback shown)`)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell><StatusTag active={row.active} /></TableCell>
                        <TableCell>{row.sortOrder}</TableCell>
                        <TableCell>
                          <Button
                            kind="ghost"
                            size="sm"
                            renderIcon={expandedId === row.id ? Close : Edit}
                            onClick={() => {
                              setExpandedId(expandedId === row.id ? null : row.id);
                              setAdding(false);
                            }}
                          >
                            {expandedId === row.id
                              ? t('button.close', 'Close')
                              : t('button.edit', 'Edit')}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === row.id && (
                        <TableRow>
                          <TableCell colSpan={headers.length} style={{ padding: 0 }}>
                            <EditPanel
                              row={row}
                              isNew={false}
                              activeLocale={activeLocale}
                              onSave={handleSaveEdit}
                              onCancel={() => setExpandedId(null)}
                              onDeactivate={handleDeactivate}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>

        <p style={{
          marginTop: '1rem',
          fontSize: '0.75rem',
          color: 'var(--cds-text-helper)',
        }}>
          {t('footer.itemtype.summary',
            'Seeded types ship with translations baked in for all supported locales; you can adjust the name in your active locale only. Codes are locked once saved.')}
        </p>
      </Column>

      {confirmDeactivate && (
        <Modal
          open
          danger
          modalHeading={t('modal.deactivate.title', 'Deactivate item type?')}
          modalLabel={`${confirmDeactivate.code} — ${confirmDeactivate.name}`}
          primaryButtonText={t('button.deactivate.confirm', 'Yes, deactivate')}
          secondaryButtonText={t('button.cancel', 'Cancel')}
          onRequestClose={() => setConfirmDeactivate(null)}
          onRequestSubmit={confirmDeactivation}
        >
          <p>
            {t('modal.deactivate.body',
              'Deactivating this type will hide it from the Inventory Catalog → Item Add dropdown for new items. Existing inventory items already using this type will keep their assignment and continue to display the original label. You can reactivate this type at any time.')}
          </p>
        </Modal>
      )}
    </Grid>
  );
};

export default InventoryItemTypeManagement;
