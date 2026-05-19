/**
 * Barcode Labels v2 — Configurable Label Preset Management
 * Jira: OGC-285 · Related v1: OGC-284 · Consumed by: OGC-761 (v2.5 Labels tab)
 *
 * Three views: (1) Master Lists → Label Presets admin, (2) Test Catalog →
 * Labels tab consuming presets, (3) Enhanced Order Entry with two tables
 * (Order Labels + Sample Labels) and post-save Print Dialog.
 *
 * MVP scope: no custom content fields, no live preview, no manual-confirm,
 * no barcode-dimension dropdown, integer mm only, Lab Number locked + first.
 * v2.3 adds per-scope flags (printsPerOrder / printsPerSample) plus four
 * independent quantity fields (default/max per order, default/max per sample).
 */

import React, { useState, useMemo } from 'react';
import {
  Stack, Tabs, TabList, Tab, TabPanels, TabPanel,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  Button, IconButton, Tag, Toggle, TextInput, NumberInput, Dropdown,
  FilterableMultiSelect, Checkbox, InlineNotification, Modal, Form, FormGroup,
  Breadcrumb, BreadcrumbItem, Tile, Tooltip,
} from '@carbon/react';
import {
  Plus, Edit, Copy, Trash2, Eye, GripVertical, ArrowUp, ArrowDown, Lock,
  Printer, Info, CheckCircle2, AlertTriangle, X, FlaskConical, Layers,
  Barcode, QrCode, ChevronRight,
} from 'lucide-react';

// =============================================================================
// SEED DATA — Label Presets (admin master list)
// =============================================================================

const INITIAL_PRESETS = [
  {
    id: 'p-order', name: 'Order Label', isDefault: true,
    height: 25, width: 76, barcodeType: 'Code128', isActive: true,
    printsPerOrder: true, printsPerSample: false,
    defaultPerOrder: 2, maxPerOrder: 10, defaultPerSample: 0, maxPerSample: 0,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'patient-name', label: 'Patient Name', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'patient-dob', label: 'Patient Date of Birth', locked: false, required: false },
      { id: 'site-id', label: 'Site ID', locked: false, required: false },
    ],
    description: 'Default order-level label printed when an order is created.',
  },
  {
    id: 'p-specimen', name: 'Specimen Label', isDefault: true,
    height: 25, width: 76, barcodeType: 'Code128', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 1, maxPerSample: 5,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'patient-name', label: 'Patient Name', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'collection-date', label: 'Collection Date and Time', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
      { id: 'collected-by', label: 'Collected By', locked: false, required: false },
    ],
    description: 'Default specimen-level label printed per sample container.',
  },
  {
    id: 'p-block', name: 'Block Label', isDefault: true,
    height: 25, width: 50, barcodeType: 'Code128', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 0, maxPerSample: 20,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'block-id', label: 'Block ID', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
    ],
    description: 'Histology paraffin block identifier.',
  },
  {
    id: 'p-slide', name: 'Slide Label', isDefault: true,
    height: 13, width: 44, barcodeType: 'DataMatrix', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 0, maxPerSample: 50,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'slide-id', label: 'Slide ID', locked: false, required: true },
      { id: 'stain-type', label: 'Stain Type', locked: false, required: true },
      { id: 'block-id', label: 'Block ID', locked: false, required: false },
    ],
    description: 'Microscope slide label — small, 2D barcode preferred.',
  },
  {
    id: 'p-freezer', name: 'Freezer Label', isDefault: true,
    height: 25, width: 50, barcodeType: 'Code128', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 0, maxPerSample: 10,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'storage-location', label: 'Storage Location', locked: false, required: true },
      { id: 'expiry-date', label: 'Expiry Date', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
    ],
    description: 'Long-term storage label for freezer racks and boxes.',
  },
  {
    id: 'p-cryo', name: 'Cryo Vial Label', isDefault: false,
    height: 25, width: 25, barcodeType: 'QR', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 2, maxPerSample: 10,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'storage-location', label: 'Storage Location', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
      { id: 'collection-date', label: 'Collection Date and Time', locked: false, required: false },
    ],
    description: 'Square label for cryogenic vial caps. QR code recommended.',
  },
  {
    id: 'p-aliquot', name: 'Aliquot Label', isDefault: false,
    height: 19, width: 38, barcodeType: 'Code128', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 4, maxPerSample: 20,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
      { id: 'collection-date', label: 'Collection Date and Time', locked: false, required: false },
    ],
    description: 'Daughter-tube aliquot derived from a primary specimen.',
  },
  {
    id: 'p-ffpe', name: 'FFPE Block', isDefault: false,
    height: 25, width: 50, barcodeType: 'Code128', isActive: true,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 4, maxPerSample: 12,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'block-id', label: 'Block ID', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'case-number', label: 'Case Number', locked: false, required: false },
    ],
    description: 'Formalin-fixed paraffin-embedded tissue block label.',
  },
  {
    id: 'p-cyto', name: 'Cytology Smear', isDefault: false,
    height: 13, width: 44, barcodeType: 'DataMatrix', isActive: false,
    printsPerOrder: false, printsPerSample: true,
    defaultPerOrder: 0, maxPerOrder: 0, defaultPerSample: 2, maxPerSample: 10,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'slide-id', label: 'Slide ID', locked: false, required: true },
      { id: 'stain-type', label: 'Stain Type', locked: false, required: false },
    ],
    description: 'Cytology smear slide. Deactivated pending pathology workflow review.',
  },
];

const BARCODE_TYPE_ITEMS = [
  { id: 'Code128', text: 'Code128 (1D linear)' },
  { id: 'QR', text: 'QR Code (2D)' },
  { id: 'DataMatrix', text: 'DataMatrix (2D, small footprint)' },
];

// Full system content field set from v2 FRS §2.4. Lab Number is locked + always
// required + first position; it is NOT included in the picker. The remaining 15
// fields are selectable via FilterableMultiSelect in the editor.
const AVAILABLE_FIELD_LIBRARY = [
  { id: 'patient-name', label: 'Patient Name' },
  { id: 'patient-id', label: 'Patient ID' },
  { id: 'patient-dob', label: 'Patient Date of Birth' },
  { id: 'patient-sex', label: 'Patient Sex' },
  { id: 'site-id', label: 'Site ID' },
  { id: 'collection-date', label: 'Collection Date and Time' },
  { id: 'collected-by', label: 'Collected By' },
  { id: 'tests', label: 'Tests' },
  { id: 'specimen-type', label: 'Specimen Type' },
  { id: 'block-id', label: 'Block ID' },
  { id: 'slide-id', label: 'Slide ID' },
  { id: 'stain-type', label: 'Stain Type' },
  { id: 'case-number', label: 'Case Number' },
  { id: 'storage-location', label: 'Storage Location' },
  { id: 'expiry-date', label: 'Expiry Date' },
];

// =============================================================================
// SEED DATA — Test Catalog → Labels tab (per-test preset linkage)
// =============================================================================

const INITIAL_TEST_LABEL_LINKS = [
  {
    id: 'tll-1',
    presetId: 'p-specimen',
    defaultQty: 1,
    maxQty: 5,
    allowOverride: true,
  },
  {
    id: 'tll-2',
    presetId: 'p-slide',
    defaultQty: 4,
    maxQty: 12,
    allowOverride: true,
  },
];

// =============================================================================
// SEED DATA — Enhanced Order Entry (view 3)
// =============================================================================

// View 3 split: two tables — Order Labels (one row, per-order columns) and Sample Labels
// (one row per sample, per-sample columns).
//
// Per-order presets: any active preset where printsPerOrder is true.
// Per-sample presets: any active preset where printsPerSample is true AND it's linked
// to a test on this order (or, when nothing is linked, the system per-sample defaults).
//
// Each Sample Labels cell is { qty, source, allowOverride } or null when N/A.
// `allowOverride: false` means the test catalog locks the quantity — the cell renders
// as a read-only display with a Lock icon instead of a NumberInput.

// Active per-order preset IDs for this scenario.
const ACTIVE_ORDER_LABEL_PRESETS = ['p-order'];

// Active per-sample preset IDs for this scenario — union of presets linked to tests
// on the order (Specimen, Slide, Cryo Vial, FFPE Block).
const ACTIVE_SAMPLE_LABEL_PRESETS = ['p-specimen', 'p-slide', 'p-cryo', 'p-ffpe'];

// Single Order row: one cell per per-order preset. Pre-populated from preset.defaultPerOrder.
const ORDER_LABEL_ROW = {
  id: 'order',
  label: 'Order',
  description: 'One row per order. Per-order quantities are lab-wide, not test-driven.',
  cells: {
    'p-order': { qty: 2, max: 10 },
  },
};

// Sample rows: one row per sample container on the order.
const SAMPLE_LABEL_ROWS = [
  {
    id: 'sample-1',
    label: 'Sample 1 — Blood / EDTA',
    description: 'CBC with Differential, HIV Rapid',
    cells: {
      'p-specimen': { qty: 1, source: 'from CBC', allowOverride: true },
      'p-slide': null,
      'p-cryo': { qty: 2, source: 'system default', allowOverride: true },
      'p-ffpe': null,
    },
  },
  {
    id: 'sample-2',
    label: 'Sample 2 — Tissue (lymph node)',
    description: 'Histopathology, IHC panel',
    cells: {
      'p-specimen': { qty: 1, source: 'from Histopath', allowOverride: true },
      // Locked: Histopath test catalog disables override on Slide Label.
      'p-slide': { qty: 8, source: 'from Histopath', allowOverride: false },
      'p-cryo': null,
      'p-ffpe': { qty: 4, source: 'from Histopath', allowOverride: true },
    },
  },
];

// =============================================================================
// UTILITY — small helpers
// =============================================================================

const findPreset = (presets, id) => presets.find((p) => p.id === id);

// Style for the locked-cell pill used in View 3 sample cells.
const LOCKED_PILL_STYLE = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '0.375rem 0.5rem', background: '#f4f4f4',
  border: '1px solid #e0e0e0', borderRadius: 2,
  color: '#393939', fontSize: '0.875rem', fontWeight: 500,
  cursor: 'help', width: 'fit-content',
};

// Source-tag renderer for View 3 sample cells.
function SourceTag({ source }) {
  const isFromTest = source.startsWith('from');
  return (
    <Tag size="sm" type={isFromTest ? 'teal' : 'cool-gray'} style={{ width: 'fit-content' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {isFromTest ? <FlaskConical size={10} /> : <CheckCircle2 size={10} />}
        {source}
      </span>
    </Tag>
  );
}

// =============================================================================
// VIEW 1 — Admin: Master Lists → Label Presets
// =============================================================================

function LabelPresetsAdminView() {
  const [presets, setPresets] = useState(INITIAL_PRESETS);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const openCreate = () => {
    setEditingPreset({
      id: `p-new-${Date.now()}`,
      name: '',
      isDefault: false,
      height: 25,
      width: 50,
      barcodeType: 'Code128',
      isActive: true,
      printsPerOrder: false,
      printsPerSample: true,
      defaultPerOrder: 0,
      maxPerOrder: 0,
      defaultPerSample: 1,
      maxPerSample: 5,
      fields: [
        { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      ],
      description: '',
    });
    setShowEditor(true);
  };

  const openEdit = (preset) => {
    setEditingPreset({ ...preset, fields: preset.fields.map((f) => ({ ...f })) });
    setShowEditor(true);
  };

  const duplicatePreset = (preset) => {
    const copy = {
      ...preset,
      id: `${preset.id}-copy-${Date.now()}`,
      name: `${preset.name} (copy)`,
      isDefault: false,
      isActive: true,
      fields: preset.fields.map((f) => ({ ...f })),
    };
    setPresets([...presets, copy]);
  };

  const deactivatePreset = (id) => {
    setPresets(presets.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
  };

  const reactivatePreset = (id) => {
    setPresets(presets.map((p) => (p.id === id ? { ...p, isActive: true } : p)));
  };

  const savePreset = () => {
    if (presets.some((p) => p.id === editingPreset.id)) {
      setPresets(presets.map((p) => (p.id === editingPreset.id ? editingPreset : p)));
    } else {
      setPresets([...presets, editingPreset]);
    }
    setShowEditor(false);
    setEditingPreset(null);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const headers = [
    { key: 'name', header: 'Preset Name' },
    { key: 'dimensions', header: 'Dimensions (H × W mm)' },
    { key: 'barcodeType', header: 'Barcode Type' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' },
  ];

  const rows = presets.map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    dimensions: `${p.height} × ${p.width}`,
    barcodeType: p.barcodeType,
    status: p.isActive ? 'Active' : 'Inactive',
    _preset: p,
  }));

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <Breadcrumb style={{ marginBottom: '0.75rem' }}>
        <BreadcrumbItem href="#">Administration</BreadcrumbItem>
        <BreadcrumbItem href="#">Master Lists</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Label Presets</BreadcrumbItem>
      </Breadcrumb>

      <Stack gap={5}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 400, marginBottom: '0.25rem' }}>Label Presets</h2>
            <p style={{ fontSize: '0.875rem', color: '#525252', maxWidth: 720 }}>
              Define reusable label templates. Each preset specifies dimensions, barcode type, and the
              content fields rendered on the label. Test catalog entries link to one or more presets to
              drive automatic label generation at order time.
            </p>
          </div>
          <Button
            renderIcon={() => <Plus size={16} />}
            onClick={openCreate}
          >
            Add Label Preset
          </Button>
        </div>

        {savedNotice && (
          <InlineNotification
            kind="success"
            title="Label preset saved"
            subtitle="Changes will apply to new orders and printed labels."
            onCloseButtonClick={() => setSavedNotice(false)}
            lowContrast
          />
        )}

        <InlineNotification
          kind="info"
          title="Defaults are protected"
          subtitle="Order Label, Specimen Label, Block Label, Slide Label, and Freezer Label are system defaults — they can be edited but not renamed or deactivated."
          lowContrast
          hideCloseButton
        />

        <DataTable rows={rows} headers={headers}>
          {({ rows: r, headers: h, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer title="" description="">
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder="Search presets" persistent />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    {h.map((header) => (
                      <TableHeader key={header.key} {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {r.map((row) => {
                    const preset = rows.find((x) => x.id === row.id)._preset;
                    return (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 500 }}>{preset.name}</span>
                            {preset.isDefault && (
                              <Tag type="gray" size="sm">Default</Tag>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#525252', marginTop: 2 }}>
                            {preset.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                            {preset.height} × {preset.width}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {preset.barcodeType === 'QR' ? (
                              <QrCode size={14} />
                            ) : preset.barcodeType === 'DataMatrix' ? (
                              <Layers size={14} />
                            ) : (
                              <Barcode
                                size={14}
                              />
                            )}
                            {preset.barcodeType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tag
                            type={preset.isActive ? 'green' : 'cool-gray'}
                            size="sm"
                          >
                            {preset.isActive ? 'Active' : 'Inactive'}
                          </Tag>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <IconButton label="Edit" kind="ghost" size="sm" onClick={() => openEdit(preset)}>
                              <Edit size={16} />
                            </IconButton>
                            <IconButton label="Duplicate" kind="ghost" size="sm" onClick={() => duplicatePreset(preset)}>
                              <Copy size={16} />
                            </IconButton>
                            {preset.isActive ? (
                              <IconButton
                                label="Deactivate"
                                kind="ghost"
                                size="sm"
                                onClick={() => deactivatePreset(preset.id)}
                              >
                                <X size={16} />
                              </IconButton>
                            ) : (
                              <Button kind="ghost" size="sm" onClick={() => reactivatePreset(preset.id)}>
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Stack>

      {showEditor && editingPreset && (
        <PresetEditorModal
          preset={editingPreset}
          onChange={setEditingPreset}
          onCancel={() => {
            setShowEditor(false);
            setEditingPreset(null);
          }}
          onSave={savePreset}
        />
      )}
    </div>
  );
}

// =============================================================================
// PRESET EDITOR — Modal: basic info, dimensions, barcode, system content fields
// =============================================================================

function PresetEditorModal({ preset, onChange, onCancel, onSave }) {
  const updateField = (key, value) => onChange({ ...preset, [key]: value });

  const moveFieldUp = (idx) => {
    if (idx === 0) return;
    const fields = [...preset.fields];
    [fields[idx - 1], fields[idx]] = [fields[idx], fields[idx - 1]];
    onChange({ ...preset, fields });
  };

  const moveFieldDown = (idx) => {
    if (idx === preset.fields.length - 1) return;
    const fields = [...preset.fields];
    [fields[idx + 1], fields[idx]] = [fields[idx], fields[idx + 1]];
    onChange({ ...preset, fields });
  };

  const removeField = (idx) => {
    if (preset.fields[idx].locked) return;
    const fields = preset.fields.filter((_, i) => i !== idx);
    onChange({ ...preset, fields });
  };

  const toggleFieldRequired = (idx) => {
    const fields = preset.fields.map((f, i) =>
      i === idx ? { ...f, required: !f.required } : f
    );
    onChange({ ...preset, fields });
  };

  // Only system fields from AVAILABLE_FIELD_LIBRARY can be added (no custom
  // free-text/fixed-value sources in MVP). MultiSelect's initialSelectedItems
  // reflects existing preset fields; toggling ON appends, OFF removes (locked
  // fields can never be removed).
  const existingFieldIds = useMemo(
    () => new Set(preset.fields.map((f) => f.id)),
    [preset.fields]
  );

  const initialSelectedFieldItems = useMemo(
    () => AVAILABLE_FIELD_LIBRARY.filter((f) => existingFieldIds.has(f.id)),
    [existingFieldIds]
  );

  const onFieldsMultiSelectChange = ({ selectedItems }) => {
    const selectedIds = new Set(selectedItems.map((i) => i.id));
    // Keep locked fields first, in their original order.
    const lockedFields = preset.fields.filter((f) => f.locked);
    // Keep currently selected unlocked fields in their existing order.
    const keptUnlocked = preset.fields.filter(
      (f) => !f.locked && selectedIds.has(f.id)
    );
    const keptIds = new Set([
      ...lockedFields.map((f) => f.id),
      ...keptUnlocked.map((f) => f.id),
    ]);
    // Append newly added fields in the order the library lists them.
    const newlyAdded = AVAILABLE_FIELD_LIBRARY
      .filter((f) => selectedIds.has(f.id) && !keptIds.has(f.id))
      .map((f) => ({ ...f, locked: false, required: false }));
    onChange({
      ...preset,
      fields: [...lockedFields, ...keptUnlocked, ...newlyAdded],
    });
  };

  return (
    <Modal
      open
      modalHeading={preset.name ? `Edit: ${preset.name}` : 'Add Label Preset'}
      primaryButtonText="Save preset"
      secondaryButtonText="Cancel"
      onRequestClose={onCancel}
      onRequestSubmit={onSave}
      size="md"
      preventCloseOnClickOutside
    >
      <Form>
        <Stack gap={5}>
          <FormGroup legendText="Basic information">
            <Stack gap={4}>
              <TextInput
                id="preset-name"
                labelText="Preset name"
                value={preset.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Cryo Vial Label"
              />
              <TextInput
                id="preset-description"
                labelText="Description (optional)"
                value={preset.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Short note for other admins"
              />
            </Stack>
          </FormGroup>

          <FormGroup legendText="Dimensions (mm)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <NumberInput
                id="preset-height"
                label="Height"
                helperText="Enter whole millimetres"
                value={preset.height}
                min={5}
                max={200}
                step={1}
                onChange={(e, { value }) => updateField('height', parseInt(value) || 0)}
              />
              <NumberInput
                id="preset-width"
                label="Width"
                helperText="Enter whole millimetres"
                value={preset.width}
                min={5}
                max={200}
                step={1}
                onChange={(e, { value }) => updateField('width', parseInt(value) || 0)}
              />
            </div>
          </FormGroup>

          <FormGroup legendText="Barcode">
            <Dropdown
              id="preset-barcode-type"
              titleText="Barcode type"
              label="Choose barcode type"
              helperText="Physical dimensions above determine the rendered footprint."
              items={BARCODE_TYPE_ITEMS}
              itemToString={(item) => (item ? item.text : '')}
              selectedItem={BARCODE_TYPE_ITEMS.find((c) => c.id === preset.barcodeType)}
              onChange={({ selectedItem }) =>
                selectedItem && updateField('barcodeType', selectedItem.id)
              }
            />
          </FormGroup>

          <FormGroup legendText="Print Scope & Quantities">
            <p style={{ fontSize: '0.75rem', color: '#525252', marginBottom: '0.75rem' }}>
              Per-order labels print once for the entire order. Per-sample labels print once for
              each sample on the order. Most labels are per-sample (Specimen, Block, Slide,
              Freezer). The Order Label is typically per-order. At least one scope must be
              selected.
            </p>
            <Stack gap={4}>
              <Checkbox
                id="prints-per-order"
                labelText="Per order — prints once per order"
                checked={preset.printsPerOrder}
                onChange={(_, { checked }) =>
                  updateField('printsPerOrder', checked)
                }
              />
              {preset.printsPerOrder && (
                <div
                  style={{
                    marginLeft: '1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <NumberInput
                    id="default-per-order"
                    label="Default per order"
                    helperText="Fallback in the Order row at order entry."
                    value={preset.defaultPerOrder}
                    min={0}
                    step={1}
                    onChange={(e, { value }) =>
                      updateField('defaultPerOrder', parseInt(value) || 0)
                    }
                  />
                  <NumberInput
                    id="max-per-order"
                    label="Max per order"
                    helperText="Caps the Order row NumberInput."
                    value={preset.maxPerOrder}
                    min={preset.defaultPerOrder}
                    step={1}
                    onChange={(e, { value }) =>
                      updateField('maxPerOrder', parseInt(value) || 0)
                    }
                  />
                </div>
              )}
              <Checkbox
                id="prints-per-sample"
                labelText="Per sample — prints once per each sample"
                checked={preset.printsPerSample}
                onChange={(_, { checked }) =>
                  updateField('printsPerSample', checked)
                }
              />
              {preset.printsPerSample && (
                <div
                  style={{
                    marginLeft: '1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <NumberInput
                    id="default-per-sample"
                    label="Default per sample"
                    helperText="Used when no test-link override exists."
                    value={preset.defaultPerSample}
                    min={0}
                    step={1}
                    onChange={(e, { value }) =>
                      updateField('defaultPerSample', parseInt(value) || 0)
                    }
                  />
                  <NumberInput
                    id="max-per-sample"
                    label="Max per sample"
                    helperText="Caps each Sample row cell."
                    value={preset.maxPerSample}
                    min={preset.defaultPerSample}
                    step={1}
                    onChange={(e, { value }) =>
                      updateField('maxPerSample', parseInt(value) || 0)
                    }
                  />
                </div>
              )}
              {!preset.printsPerOrder && !preset.printsPerSample && (
                <InlineNotification
                  kind="warning"
                  lowContrast
                  hideCloseButton
                  title="At least one scope required"
                  subtitle="Select Per order, Per sample, or both before saving."
                />
              )}
            </Stack>
          </FormGroup>

          <FormGroup legendText="Content fields">
            <p style={{ fontSize: '0.75rem', color: '#525252', marginBottom: '0.5rem' }}>
              Pick from the full system field set ({AVAILABLE_FIELD_LIBRARY.length} fields).
              Use the picker below to add or remove fields, then reorder with the arrow
              buttons. Lab Number is locked, always required, and pinned to the first
              position.
            </p>

            <div style={{ marginBottom: '0.75rem' }}>
              <FilterableMultiSelect
                id="content-fields-picker"
                titleText="Add content fields"
                helperText="Type to filter — all 15 system fields are available."
                placeholder="Search fields"
                items={AVAILABLE_FIELD_LIBRARY}
                itemToString={(item) => (item ? item.label : '')}
                initialSelectedItems={initialSelectedFieldItems}
                onChange={onFieldsMultiSelectChange}
                selectionFeedback="top-after-reopen"
              />
            </div>

            <div style={{ border: '1px solid #e0e0e0', borderRadius: 2 }}>
              {preset.fields.map((field, idx) => (
                <div
                  key={field.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderBottom:
                      idx === preset.fields.length - 1 ? 'none' : '1px solid #e0e0e0',
                    background: field.locked ? '#f4f4f4' : '#ffffff',
                  }}
                >
                  <GripVertical size={14} color="#a8a8a8" style={{ cursor: 'grab' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{field.label}</span>
                      {field.locked && (
                        <Tag type="gray" size="sm">
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={10} /> Locked
                          </span>
                        </Tag>
                      )}
                    </div>
                  </div>
                  <Checkbox
                    id={`req-${preset.id}-${field.id}`}
                    labelText="Required"
                    checked={field.required}
                    disabled={field.locked}
                    onChange={() => toggleFieldRequired(idx)}
                  />
                  <IconButton
                    label="Move up"
                    kind="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => moveFieldUp(idx)}
                  >
                    <ArrowUp size={14} />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    kind="ghost"
                    size="sm"
                    disabled={idx === preset.fields.length - 1}
                    onClick={() => moveFieldDown(idx)}
                  >
                    <ArrowDown size={14} />
                  </IconButton>
                  <IconButton
                    label="Remove"
                    kind="ghost"
                    size="sm"
                    disabled={field.locked}
                    onClick={() => removeField(idx)}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
            </div>
          </FormGroup>

          <FormGroup legendText="Status">
            <Toggle
              id="preset-active"
              labelText="Preset is active"
              labelA="Inactive"
              labelB="Active"
              toggled={preset.isActive}
              onToggle={(checked) => updateField('isActive', checked)}
            />
            <p style={{ fontSize: '0.75rem', color: '#525252', marginTop: '0.25rem' }}>
              Inactive presets stay in the master list but cannot be linked to new tests or
              printed for new orders.
            </p>
          </FormGroup>
        </Stack>
      </Form>
    </Modal>
  );
}

// =============================================================================
// VIEW 2 — Test Catalog → Labels tab (per-test preset linkage)
// =============================================================================

function TestCatalogLabelsView() {
  const [links, setLinks] = useState(INITIAL_TEST_LABEL_LINKS);
  const [globalAllowOverride, setGlobalAllowOverride] = useState(true);
  const [autoIncludeOrderLabel, setAutoIncludeOrderLabel] = useState(true);

  const activePresets = INITIAL_PRESETS.filter((p) => p.isActive);
  const presetItems = activePresets.map((p) => ({ id: p.id, text: p.name }));

  const updateLink = (id, patch) => {
    setLinks(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const removeLink = (id) => {
    setLinks(links.filter((l) => l.id !== id));
  };

  const addLink = () => {
    const next = {
      id: `tll-${Date.now()}`,
      presetId: 'p-specimen',
      defaultQty: 1,
      maxQty: 5,
      allowOverride: true,
    };
    setLinks([...links, next]);
  };

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
      {/* Mocked Test Editor SideNav */}
      <aside style={{ width: 260, background: '#ffffff', borderRight: '1px solid #e0e0e0', padding: '1rem 0', flexShrink: 0 }}>
        <div style={{ padding: '0 1rem 0.75rem', borderBottom: '1px solid #e0e0e0', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#525252', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Test Editor
          </p>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>
            CBC with Differential
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#525252', marginTop: 2 }}>
            Code: CBC-DIFF · Hematology
          </p>
        </div>
        <nav>
          {['Basic Info', 'Sample & Results', 'Methods', 'Ranges', 'Sample Storage', 'Display Order', 'Panels', 'Labels', 'Terminology Mappings'].map((label) => {
            const active = label === 'Labels';
            return (
              <div
                key={label}
                style={{
                  padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer',
                  background: active ? '#e0e0e0' : 'transparent',
                  borderLeft: active ? '3px solid #0f62fe' : '3px solid transparent',
                  color: active ? '#161616' : '#525252',
                  fontWeight: active ? 600 : 400,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                {label}
                {active && <ChevronRight size={14} />}
              </div>
            );
          })}
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
        <Breadcrumb style={{ marginBottom: '0.75rem' }}>
          <BreadcrumbItem href="#">Administration</BreadcrumbItem>
          <BreadcrumbItem href="#">Test Catalog</BreadcrumbItem>
          <BreadcrumbItem href="#">CBC with Differential</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>Labels</BreadcrumbItem>
        </Breadcrumb>

        <Stack gap={5}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.25rem' }}>Labels</h2>
            <p style={{ fontSize: '0.875rem', color: '#525252', maxWidth: 760 }}>
              Link this test to one or more label presets defined in{' '}
              <a href="#" style={{ color: '#0f62fe' }}>Master Lists → Label Presets</a>. Quantities entered here
              are applied automatically at order entry; users can override within the maximum if
              allowed below.
            </p>
          </div>

          <InlineNotification
            kind="info"
            title="How aggregation works"
            subtitle="When an order contains multiple tests, label counts per preset are summed across the tests on each sample. The Enhanced Order Entry view shows aggregated totals before printing."
            lowContrast
            hideCloseButton
          />

          <Tile>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.125rem' }}>
                  Linked Label Presets
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
                  Each row drives how many labels of that type the system will pre-fill at order entry.
                </p>
              </div>
              <Button
                kind="tertiary"
                size="sm"
                renderIcon={() => <Plus size={16} />}
                onClick={addLink}
              >
                Add Label Type
              </Button>
            </div>

            <TableContainer>
              <Table size="md">
                <TableHead>
                  <TableRow>
                    <TableHeader>Preset</TableHeader>
                    <TableHeader>Default Qty</TableHeader>
                    <TableHeader>Max Qty</TableHeader>
                    <TableHeader>Allow Override</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {links.map((link) => {
                    const preset = findPreset(INITIAL_PRESETS, link.presetId);
                    return (
                      <TableRow key={link.id}>
                        <TableCell style={{ minWidth: 240 }}>
                          <Dropdown
                            id={`preset-${link.id}`}
                            titleText=""
                            label="Choose preset"
                            items={presetItems}
                            itemToString={(item) => (item ? item.text : '')}
                            selectedItem={presetItems.find((p) => p.id === link.presetId)}
                            onChange={({ selectedItem }) =>
                              selectedItem && updateLink(link.id, { presetId: selectedItem.id })
                            }
                          />
                          {preset && (
                            <div style={{ marginTop: '0.375rem' }}>
                              <span style={{ fontSize: '0.75rem', color: '#525252' }}>
                                {preset.height} × {preset.width} mm · {preset.barcodeType}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 110 }}>
                          <NumberInput
                            id={`default-${link.id}`}
                            label=""
                            hideLabel
                            value={link.defaultQty}
                            min={0}
                            max={link.maxQty}
                            onChange={(e, { value }) =>
                              updateLink(link.id, { defaultQty: parseInt(value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell style={{ width: 110 }}>
                          <NumberInput
                            id={`max-${link.id}`}
                            label=""
                            hideLabel
                            value={link.maxQty}
                            min={link.defaultQty}
                            max={99}
                            onChange={(e, { value }) =>
                              updateLink(link.id, { maxQty: parseInt(value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            id={`override-${link.id}`}
                            labelText="Allow at order entry"
                            checked={link.allowOverride}
                            onChange={(_, { checked }) =>
                              updateLink(link.id, { allowOverride: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            label="Remove"
                            kind="ghost"
                            size="sm"
                            onClick={() => removeLink(link.id)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Tile>

          <Tile>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Test-level overrides
            </h3>
            <Stack gap={3}>
              <Toggle
                id="global-allow-override"
                labelText="Allow label count override at order entry for this test"
                labelA="Off"
                labelB="On"
                toggled={globalAllowOverride}
                onToggle={setGlobalAllowOverride}
              />
              <Toggle
                id="auto-include-order"
                labelText="Always include the Order Label preset when this test is ordered"
                labelA="Off"
                labelB="On"
                toggled={autoIncludeOrderLabel}
                onToggle={setAutoIncludeOrderLabel}
              />
            </Stack>
          </Tile>

          <Tile>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Eye size={16} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Order Entry Preview</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: '#525252', marginBottom: '1rem' }}>
              How labels will appear in step 4 of order entry when this test is the only one selected.
            </p>

            <div style={{ background: '#f4f4f4', padding: '1rem', borderRadius: 2 }}>
              <TableContainer>
                <Table size="sm">
                  <TableHead>
                    <TableRow>
                      <TableHeader />
                      {links.map((link) => {
                        const preset = findPreset(INITIAL_PRESETS, link.presetId);
                        return (
                          <TableHeader key={link.id}>
                            {preset?.name || 'Preset'}
                          </TableHeader>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Sample 1 — Blood / EDTA</TableCell>
                      {links.map((link) => (
                        <TableCell key={link.id}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{link.defaultQty}</span>
                            <Tag size="sm" type="cool-gray">from CBC</Tag>
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </Tile>
        </Stack>
      </main>
    </div>
  );
}

// =============================================================================
// VIEW 3 — Enhanced Order Entry (read-only preview)
// =============================================================================

function OrderEntryPreviewView() {
  // Per-order table state: one row, one cell per per-order preset column.
  const [orderRow, setOrderRow] = useState(ORDER_LABEL_ROW);
  // Per-sample table state: one row per sample, one cell per per-sample preset column.
  const [sampleRows, setSampleRows] = useState(SAMPLE_LABEL_ROWS);

  // Resolve the active preset objects for both tables, filtered by isActive +
  // the relevant scope flag.
  const orderPresets = ACTIVE_ORDER_LABEL_PRESETS
    .map((id) => findPreset(INITIAL_PRESETS, id))
    .filter((p) => p && p.isActive && p.printsPerOrder);

  const samplePresets = ACTIVE_SAMPLE_LABEL_PRESETS
    .map((id) => findPreset(INITIAL_PRESETS, id))
    .filter((p) => p && p.isActive && p.printsPerSample);

  const updateOrderCell = (presetId, qty) => {
    if (!orderRow.cells[presetId]) return;
    setOrderRow({
      ...orderRow,
      cells: {
        ...orderRow.cells,
        [presetId]: { ...orderRow.cells[presetId], qty },
      },
    });
  };

  const updateSampleCell = (rowId, presetId, qty) => {
    setSampleRows(
      sampleRows.map((r) =>
        r.id !== rowId || !r.cells[presetId]
          ? r
          : { ...r, cells: { ...r.cells, [presetId]: { ...r.cells[presetId], qty } } }
      )
    );
  };

  // Per-order totals: just the order row's per-preset qty.
  const orderTotals = useMemo(() => {
    const t = {};
    orderPresets.forEach((p) => {
      t[p.id] = orderRow.cells[p.id]?.qty || 0;
    });
    return t;
  }, [orderRow, orderPresets]);

  // Per-sample totals: sum across all sample rows per preset column.
  const sampleTotals = useMemo(() => {
    const t = {};
    samplePresets.forEach((p) => {
      t[p.id] = sampleRows.reduce((sum, r) => sum + (r.cells[p.id]?.qty || 0), 0);
    });
    return t;
  }, [sampleRows, samplePresets]);

  const orderTotalCount = Object.values(orderTotals).reduce((a, b) => a + b, 0);
  const sampleTotalCount = Object.values(sampleTotals).reduce((a, b) => a + b, 0);
  const grandTotal = orderTotalCount + sampleTotalCount;
  const sampleCount = sampleRows.length;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <Breadcrumb style={{ marginBottom: '0.75rem' }}>
        <BreadcrumbItem href="#">Order Entry</BreadcrumbItem>
        <BreadcrumbItem href="#">Add Order</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>Step 4 — Labels</BreadcrumbItem>
      </Breadcrumb>

      <Stack gap={5}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.25rem' }}>
            Labels
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#525252', maxWidth: 760 }}>
            Review the labels that will be generated for this order. The Order Labels table
            shows labels that print once for the entire order; the Sample Labels table shows
            labels that print once per sample. Counts pre-populate from the preset defaults
            (Order Labels) or the test catalog (Sample Labels) and can be overridden within
            the maximum allowed.
          </p>
        </div>

        <Tile style={{ background: '#edf5ff', borderLeft: '3px solid #0f62fe' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Info size={20} color="#0f62fe" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.125rem' }}>
                Order summary
              </p>
              <p style={{ fontSize: '0.8125rem', color: '#393939' }}>
                Patient: KOUASSI, Amélie (PT-118274) · 2 samples · 4 tests selected:&nbsp;
                <strong>CBC with Differential</strong>, <strong>HIV Rapid</strong>,&nbsp;
                <strong>Histopathology</strong>, <strong>IHC panel (CD20, CD3, Ki-67)</strong>
              </p>
            </div>
          </div>
        </Tile>

        {/* === ORDER LABELS TABLE === */}
        <Tile>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Order Labels</h3>
              <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
                Labels that print once for the entire order. Quantities are configured at the
                preset level and apply lab-wide regardless of which tests are ordered.
              </p>
            </div>
            <Tag type="blue" size="sm">
              <Printer size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {orderTotalCount} order label{orderTotalCount === 1 ? '' : 's'}
            </Tag>
          </div>

          <TableContainer>
            <Table size="md">
              <TableHead>
                <TableRow>
                  <TableHeader style={{ width: 240 }}>Entity</TableHeader>
                  {orderPresets.map((p) => (
                    <TableHeader key={p.id}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#525252', fontWeight: 400 }}>
                          {p.height} × {p.width} mm · max {p.maxPerOrder}
                        </div>
                      </div>
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{orderRow.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#525252', marginTop: 2 }}>
                      {orderRow.description}
                    </div>
                  </TableCell>
                  {orderPresets.map((p) => {
                    const cell = orderRow.cells[p.id];
                    if (!cell) {
                      return (
                        <TableCell key={p.id} style={{ textAlign: 'center', color: '#a8a8a8' }}>
                          —
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={p.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                          <NumberInput
                            id={`oe-order-${p.id}`}
                            label=""
                            hideLabel
                            size="sm"
                            value={cell.qty}
                            min={0}
                            max={p.maxPerOrder}
                            onChange={(e, { value }) =>
                              updateOrderCell(p.id, parseInt(value) || 0)
                            }
                          />
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow style={{ background: '#f4f4f4' }}>
                  <TableCell style={{ fontWeight: 600 }}>Total labels by preset</TableCell>
                  {orderPresets.map((p) => (
                    <TableCell key={p.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Printer size={14} />
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{orderTotals[p.id]}</span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Tile>

        {/* === SAMPLE LABELS TABLE === */}
        <Tile>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Sample Labels</h3>
              <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
                Labels that print once per sample. Columns are derived from the per-sample
                presets linked to the ordered tests. Empty cells indicate the preset doesn't
                apply to that sample.
              </p>
            </div>
            <Tag type="blue" size="sm">
              <Printer size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              {sampleTotalCount} sample label{sampleTotalCount === 1 ? '' : 's'}
            </Tag>
          </div>

          <TableContainer>
            <Table size="md">
              <TableHead>
                <TableRow>
                  <TableHeader style={{ width: 240 }}>Sample</TableHeader>
                  {samplePresets.map((p) => (
                    <TableHeader key={p.id}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#525252', fontWeight: 400 }}>
                          {p.height} × {p.width} mm · max {p.maxPerSample}
                        </div>
                      </div>
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{row.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#525252', marginTop: 2 }}>
                        {row.description}
                      </div>
                    </TableCell>
                    {samplePresets.map((p) => {
                      const cell = row.cells[p.id];
                      if (!cell) {
                        return (
                          <TableCell key={p.id} style={{ textAlign: 'center', color: '#a8a8a8' }}>
                            —
                          </TableCell>
                        );
                      }
                      const locked = cell.allowOverride === false;
                      return (
                        <TableCell key={p.id}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                            {locked ? (
                              <Tooltip align="top" label="Quantity locked by test catalog">
                                <div style={LOCKED_PILL_STYLE}>
                                  <Lock size={12} color="#525252" />
                                  <span>{cell.qty}</span>
                                </div>
                              </Tooltip>
                            ) : (
                              <NumberInput
                                id={`oe-${row.id}-${p.id}`}
                                label=""
                                hideLabel
                                size="sm"
                                value={cell.qty}
                                min={0}
                                max={p.maxPerSample}
                                onChange={(e, { value }) =>
                                  updateSampleCell(row.id, p.id, parseInt(value) || 0)
                                }
                              />
                            )}
                            <SourceTag source={cell.source} />
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow style={{ background: '#f4f4f4' }}>
                  <TableCell style={{ fontWeight: 600 }}>Total labels by preset</TableCell>
                  {samplePresets.map((p) => (
                    <TableCell key={p.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Printer size={14} />
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{sampleTotals[p.id]}</span>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#525252' }}>
              <strong>Source legend:</strong>{' '}
              <Tag type="teal" size="sm">
                <FlaskConical size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} /> from [test]
              </Tag>{' '}
              = derived from the test catalog's Labels tab.{' '}
              <Tag type="cool-gray" size="sm">
                <CheckCircle2 size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} /> system default
              </Tag>{' '}
              = pulled from Master Lists → Label Presets defaults.
            </p>
          </div>
        </Tile>

        <Tile style={{ background: '#f4f4f4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Printer size={18} color="#0f62fe" />
            <div style={{ flex: 1, fontSize: '0.8125rem', color: '#393939' }}>
              <strong>Total across both tables:</strong> {grandTotal} labels (
              {orderTotalCount} order + {sampleTotalCount} sample across {sampleCount}{' '}
              sample{sampleCount === 1 ? '' : 's'}).
            </div>
          </div>
        </Tile>

        <InlineNotification
          kind="info"
          title="Labels are not printable yet"
          subtitle="Labels will be printable after the order is saved and a lab number is assigned."
          lowContrast
          hideCloseButton
        />

        <Tile style={{ background: '#f4f4f4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} color="#f1c21b" />
            <div style={{ flex: 1, fontSize: '0.8125rem', color: '#393939' }}>
              <strong>Override audit:</strong> Edits to the auto-suggested values will be
              recorded on the order audit trail (user, timestamp, before → after).
            </div>
          </div>
        </Tile>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
          <Button kind="ghost">Back to step 3</Button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button kind="tertiary">Save draft</Button>
            <Button kind="primary">Save order & queue labels</Button>
          </div>
        </div>

        <PostSavePrintDialog
          orderRow={orderRow}
          orderPresets={orderPresets}
          orderTotals={orderTotals}
          sampleRows={sampleRows}
          samplePresets={samplePresets}
          sampleTotals={sampleTotals}
          sampleCount={sampleCount}
        />
      </Stack>
    </div>
  );
}

// =============================================================================
// POST-SAVE PRINT DIALOG — rendered inline at the end of View 3.
// Static preview (not an interactive Modal) so reviewers can see the state
// without clicking Save. A "PREVIEW" tag marks it.
// =============================================================================

function PostSavePrintDialog({
  orderRow,
  orderPresets,
  orderTotals,
  sampleRows,
  samplePresets,
  sampleTotals,
  sampleCount,
}) {
  // Build one entry per preset with a non-zero total, across both tables.
  // Order-scope rows come first (system seed order), then sample-scope rows.
  const orderPresetRows = orderPresets
    .filter((p) => (orderTotals[p.id] || 0) > 0)
    .map((p) => {
      const qtyPerOrder = orderRow.cells[p.id]?.qty || 0;
      return {
        id: `order-${p.id}`,
        name: p.name,
        qty: orderTotals[p.id],
        // Cap edits in the dialog at the preset's per-order max.
        max: p.maxPerOrder || 0,
        dim: `${p.height} × ${p.width} mm`,
        scope: 'Per order',
        // "1 × order = 2 labels"
        math: `${qtyPerOrder} × order = ${orderTotals[p.id]} label${orderTotals[p.id] === 1 ? '' : 's'}`,
      };
    });

  const samplePresetRows = samplePresets
    .filter((p) => (sampleTotals[p.id] || 0) > 0)
    .map((p) => {
      const contributingSamples = sampleRows.filter(
        (r) => r.cells[p.id] && r.cells[p.id].qty > 0
      );
      // If all contributing samples share a qty, render the clean "n × m samples"
      // form; otherwise render the sum of varying qtys for transparency.
      const qtys = contributingSamples.map((r) => r.cells[p.id].qty);
      const allSame = qtys.length > 0 && qtys.every((q) => q === qtys[0]);
      let math;
      if (allSame) {
        const qty = qtys[0];
        math = `${qty} × ${contributingSamples.length} sample${
          contributingSamples.length === 1 ? '' : 's'
        } = ${sampleTotals[p.id]} label${sampleTotals[p.id] === 1 ? '' : 's'}`;
      } else {
        math = `${qtys.join(' + ')} across ${contributingSamples.length} samples = ${
          sampleTotals[p.id]
        } labels`;
      }
      return {
        id: `sample-${p.id}`,
        name: p.name,
        qty: sampleTotals[p.id],
        // Per-sample preset max × number of contributing samples gives the
        // dialog-level cap (each sample's contribution is bounded by maxPerSample).
        max: (p.maxPerSample || 0) * Math.max(contributingSamples.length, 1),
        dim: `${p.height} × ${p.width} mm`,
        scope: 'Per sample',
        math,
      };
    });

  const presetRows = [...orderPresetRows, ...samplePresetRows];

  return (
    <Tile style={{ background: '#ffffff', border: '1px solid #c6c6c6', borderTop: '3px solid #24a148', padding: 0, marginTop: '0.5rem' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
          <CheckCircle2 size={20} color="#24a148" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#161616' }}>
              Order Saved Successfully
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#393939', marginTop: 2 }}>
              Lab Number:{' '}
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>24ORD00152</span>
            </div>
          </div>
        </div>
        <Tag type="blue" size="sm">PREVIEW</Tag>
      </div>

      {/* Editable-quantity helper banner */}
      <div
        role="note"
        style={{
          margin: '0.5rem 1rem 0',
          padding: '0.625rem 0.875rem',
          background: '#edf5ff',
          borderLeft: '3px solid #0f62fe',
          fontSize: '0.8125rem',
          color: '#161616',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
        }}
      >
        <span aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6.5" stroke="#0f62fe" strokeWidth="1.25" fill="none"/><circle cx="8" cy="5" r="0.75" fill="#0f62fe"/><path d="M8 7.5v4.5" stroke="#0f62fe" strokeWidth="1.25" strokeLinecap="round"/></svg>
        </span>
        <span>
          <strong>You can adjust quantities below before printing if needed.</strong>{' '}
          For example, if you'll create 4 aliquots, set Specimen Label to match. Per-type
          totals recalculate on Print and are saved to the order.
        </span>
      </div>

      {/* Body — one row per preset */}
      <div style={{ padding: '0.5rem 0.5rem 0' }}>
        <TableContainer>
          <Table size="md">
            <TableHead>
              <TableRow>
                <TableHeader>Label</TableHeader>
                <TableHeader style={{ width: 100 }}>Scope</TableHeader>
                <TableHeader style={{ width: 130 }}>Qty (editable)</TableHeader>
                <TableHeader style={{ width: 160 }}>Dimensions</TableHeader>
                <TableHeader style={{ width: 140, textAlign: 'right' }}>{''}</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {presetRows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div style={{ fontWeight: 500 }}>{r.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#525252', marginTop: 2 }}>
                      {r.math}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tag size="sm" type={r.scope === 'Per order' ? 'cyan' : 'teal'}>
                      {r.scope}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    <NumberInput
                      id={`pd-qty-${r.id}`}
                      hideLabel
                      label={`${r.name} quantity`}
                      value={r.qty}
                      min={0}
                      max={r.max || undefined}
                      size="sm"
                      // Static mockup — onChange is a no-op; engineering wires the
                      // recalculate-totals behavior at build time.
                      onChange={() => {}}
                    />
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem', color: '#393939' }}>
                      {r.dim}
                    </span>
                  </TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    <Button
                      kind="secondary"
                      size="sm"
                      renderIcon={() => <Printer size={14} />}
                    >
                      Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: '1px solid #e0e0e0', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '0.75rem', color: '#525252', flex: 1, minWidth: 240 }}>
          Each label type opens as a separate PDF in a new tab so different stocks can be used.
          Reprint anytime from Order View.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button kind="ghost" size="sm">Skip — Print Later</Button>
          <Button kind="primary" size="sm">Done</Button>
        </div>
      </div>
    </Tile>
  );
}

// =============================================================================
// TOP-LEVEL — sub-nav between the three views
// =============================================================================

export default function BarcodeLabelsV2() {
  const [activeView, setActiveView] = useState(0);

  return (
    <div style={{ fontFamily: 'IBM Plex Sans, -apple-system, BlinkMacSystemFont, sans-serif', minHeight: '100vh', background: '#f4f4f4' }}>
      {/* Banner / global header strip */}
      <div style={{ background: '#161616', color: '#ffffff', padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>OpenELIS Global</span>
          <span style={{ fontSize: '0.75rem', color: '#a8a8a8' }}>
            Barcode Labels v2 — Configurable Label Preset Management
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#a8a8a8' }}>
          <Tag type="purple" size="sm">OGC-285</Tag>
          <span>Mockup · not connected to backend</span>
        </div>
      </div>

      <Tabs selectedIndex={activeView} onChange={({ selectedIndex }) => setActiveView(selectedIndex)}>
        <TabList aria-label="Barcode Labels v2 views" contained>
          <Tab>1 · Admin: Label Presets</Tab>
          <Tab>2 · Test Catalog → Labels</Tab>
          <Tab>3 · Enhanced Order Entry</Tab>
        </TabList>
        <TabPanels>
          <TabPanel style={{ padding: 0 }}>
            <LabelPresetsAdminView />
          </TabPanel>
          <TabPanel style={{ padding: 0 }}>
            <TestCatalogLabelsView />
          </TabPanel>
          <TabPanel style={{ padding: 0 }}>
            <OrderEntryPreviewView />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
