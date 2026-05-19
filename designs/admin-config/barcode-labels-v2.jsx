/**
 * Barcode Labels v2 — Configurable Label Preset Management
 * Jira: OGC-285
 * Related v1: OGC-284 (Barcode Labels v1)
 * Relates to: OGC-761 (v2.5 Test Catalog Labels tab — consumes this preset system)
 *
 * Three views demonstrating: (1) Master Lists → Label Presets admin,
 * (2) Test Catalog → Labels tab consuming presets, (3) Enhanced Order Entry
 * with aggregation rules and source badges.
 *
 * MVP scope (post Casey decisions):
 *   - No custom content fields — content rows are picked from the system field set only.
 *   - No live SVG label preview — the editor is form fields only.
 *   - No manual-confirm generation mode — all linked presets generate automatically.
 *   - View 3 ends with a fully-rendered post-save Print Dialog (one Print button per preset).
 *   - View 3 demonstrates a Lock affordance when the test catalog disables override.
 *   - View 2 sidenav matches the v2.5 v1 list (9 items, no Reagents / Alerts / Reflex / Compliance yet).
 */

import React, { useState, useMemo } from 'react';
import {
  Grid,
  Column,
  Stack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  IconButton,
  Tag,
  Toggle,
  TextInput,
  NumberInput,
  Dropdown,
  Checkbox,
  InlineNotification,
  Modal,
  Form,
  FormGroup,
  Breadcrumb,
  BreadcrumbItem,
  Tile,
  Tooltip,
} from '@carbon/react';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Eye,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Lock,
  Printer,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  FlaskConical,
  Layers,
  Barcode,
  QrCode,
  ChevronRight,
} from 'lucide-react';

// =============================================================================
// SEED DATA — Label Presets (admin master list)
// =============================================================================

const INITIAL_PRESETS = [
  {
    id: 'p-order',
    name: 'Order Label',
    isDefault: true,
    category: 'Order',
    height: 25.4,
    width: 76.2,
    barcodeType: 'Code128',
    barcodeSize: 'Medium',
    isActive: true,
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
    id: 'p-specimen',
    name: 'Specimen Label',
    isDefault: true,
    category: 'Specimen',
    height: 25.4,
    width: 76.2,
    barcodeType: 'Code128',
    barcodeSize: 'Medium',
    isActive: true,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'patient-name', label: 'Patient Name', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'collection-date', label: 'Collection Date', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
      { id: 'collected-by', label: 'Collected By', locked: false, required: false },
    ],
    description: 'Default specimen-level label printed per sample container.',
  },
  {
    id: 'p-block',
    name: 'Block Label',
    isDefault: true,
    category: 'Pathology',
    height: 25.4,
    width: 50.8,
    barcodeType: 'Code128',
    barcodeSize: 'Small',
    isActive: true,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'block-id', label: 'Block ID', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
    ],
    description: 'Histology paraffin block identifier.',
  },
  {
    id: 'p-slide',
    name: 'Slide Label',
    isDefault: true,
    category: 'Pathology',
    height: 12.7,
    width: 44.5,
    barcodeType: 'DataMatrix',
    barcodeSize: 'Small',
    isActive: true,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'slide-id', label: 'Slide ID', locked: false, required: true },
      { id: 'stain', label: 'Stain Type', locked: false, required: true },
      { id: 'block-id', label: 'Block ID', locked: false, required: false },
    ],
    description: 'Microscope slide label — small, 2D barcode preferred.',
  },
  {
    id: 'p-cryo',
    name: 'Cryo Vial Label',
    isDefault: false,
    category: 'Storage',
    height: 25.4,
    width: 25.4,
    barcodeType: 'QR',
    barcodeSize: 'Small',
    isActive: true,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'storage-location', label: 'Storage Location', locked: false, required: true },
      { id: 'specimen-type', label: 'Specimen Type', locked: false, required: false },
      { id: 'collection-date', label: 'Collection Date', locked: false, required: false },
    ],
    description: 'Square label for cryogenic vial caps. QR code recommended.',
  },
  {
    id: 'p-aliquot',
    name: 'Aliquot Label',
    isDefault: false,
    category: 'Specimen',
    height: 19.0,
    width: 38.1,
    barcodeType: 'Code128',
    barcodeSize: 'Small',
    isActive: true,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'aliquot-seq', label: 'Aliquot Sequence', locked: false, required: true },
      { id: 'volume', label: 'Volume (mL)', locked: false, required: false },
      { id: 'parent-id', label: 'Parent Sample ID', locked: false, required: true },
    ],
    description: 'Daughter-tube aliquot derived from a primary specimen.',
  },
  {
    id: 'p-ffpe',
    name: 'FFPE Block',
    isDefault: false,
    category: 'Pathology',
    height: 25.4,
    width: 50.8,
    barcodeType: 'Code128',
    barcodeSize: 'Medium',
    isActive: true,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'block-id', label: 'Block ID', locked: false, required: true },
      { id: 'patient-id', label: 'Patient ID', locked: false, required: true },
      { id: 'case-number', label: 'Case Number', locked: false, required: false },
      { id: 'fixative', label: 'Fixative', locked: false, required: false },
    ],
    description: 'Formalin-fixed paraffin-embedded tissue block label.',
  },
  {
    id: 'p-cyto',
    name: 'Cytology Smear',
    isDefault: false,
    category: 'Pathology',
    height: 12.7,
    width: 44.5,
    barcodeType: 'DataMatrix',
    barcodeSize: 'Small',
    isActive: false,
    fields: [
      { id: 'lab-number', label: 'Lab Number', locked: true, required: true },
      { id: 'slide-id', label: 'Slide ID', locked: false, required: true },
      { id: 'prep-method', label: 'Prep Method', locked: false, required: false },
    ],
    description: 'Cytology smear slide. Deactivated pending pathology workflow review.',
  },
];

const CATEGORY_ITEMS = [
  { id: 'Order', text: 'Order' },
  { id: 'Specimen', text: 'Specimen' },
  { id: 'Pathology', text: 'Pathology' },
  { id: 'Storage', text: 'Storage' },
];

const BARCODE_TYPE_ITEMS = [
  { id: 'Code128', text: 'Code128 (1D linear)' },
  { id: 'QR', text: 'QR Code (2D)' },
  { id: 'DataMatrix', text: 'DataMatrix (2D, small footprint)' },
];

const BARCODE_SIZE_ITEMS = [
  { id: 'Small', text: 'Small' },
  { id: 'Medium', text: 'Medium' },
  { id: 'Large', text: 'Large' },
];

const AVAILABLE_FIELD_LIBRARY = [
  { id: 'patient-name', label: 'Patient Name' },
  { id: 'patient-id', label: 'Patient ID' },
  { id: 'patient-dob', label: 'Patient Date of Birth' },
  { id: 'patient-sex', label: 'Patient Sex' },
  { id: 'collection-date', label: 'Collection Date' },
  { id: 'collected-by', label: 'Collected By' },
  { id: 'specimen-type', label: 'Specimen Type' },
  { id: 'site-id', label: 'Site ID' },
  { id: 'tests', label: 'Tests Ordered' },
  { id: 'block-id', label: 'Block ID' },
  { id: 'slide-id', label: 'Slide ID' },
  { id: 'stain', label: 'Stain Type' },
  { id: 'case-number', label: 'Case Number' },
  { id: 'storage-location', label: 'Storage Location' },
  { id: 'expiry-date', label: 'Expiry Date' },
  { id: 'aliquot-seq', label: 'Aliquot Sequence' },
  { id: 'volume', label: 'Volume (mL)' },
  { id: 'parent-id', label: 'Parent Sample ID' },
  { id: 'fixative', label: 'Fixative' },
  { id: 'prep-method', label: 'Prep Method' },
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

// For the Order Entry view: which tests were ordered and what they contribute.
// Each row represents an entity (the order itself, or a sample container).
// Each cell is keyed by presetId; values are { qty, source, allowOverride? } or null when N/A.
// `allowOverride: false` means the test catalog locks the quantity — the cell renders
// as a read-only display with a Lock icon instead of a NumberInput.
const ORDER_ENTRY_ROWS = [
  {
    id: 'order',
    label: 'Order',
    description: 'Order-level labels (1 per order)',
    cells: {
      'p-order': { qty: 2, source: 'system default', allowOverride: true },
      'p-specimen': null,
      'p-slide': null,
      'p-ffpe': null,
      'p-cryo': null,
    },
  },
  {
    id: 'sample-1',
    label: 'Sample 1 — Blood / EDTA',
    description: 'CBC with Differential, HIV Rapid',
    cells: {
      'p-order': null,
      'p-specimen': { qty: 1, source: 'from CBC', allowOverride: true },
      'p-slide': null,
      'p-ffpe': null,
      'p-cryo': { qty: 2, source: 'system default', allowOverride: true },
    },
  },
  {
    id: 'sample-2',
    label: 'Sample 2 — Tissue (lymph node)',
    description: 'Histopathology, IHC panel',
    cells: {
      'p-order': null,
      'p-specimen': { qty: 1, source: 'from Histopath', allowOverride: true },
      // Locked: Histopath test catalog disables override on Slide Label.
      'p-slide': { qty: 8, source: 'from Histopath', allowOverride: false },
      'p-ffpe': { qty: 4, source: 'from Histopath', allowOverride: true },
      'p-cryo': null,
    },
  },
];

// Subset of presets actually used in this order (derived from selected tests)
const ACTIVE_ORDER_PRESETS = ['p-order', 'p-specimen', 'p-slide', 'p-ffpe', 'p-cryo'];

// =============================================================================
// UTILITY — small helpers
// =============================================================================

const categoryTagType = (category) => {
  switch (category) {
    case 'Order': return 'blue';
    case 'Specimen': return 'teal';
    case 'Pathology': return 'magenta';
    case 'Storage': return 'cyan';
    default: return 'gray';
  }
};

const findPreset = (presets, id) => presets.find((p) => p.id === id);

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
      category: 'Specimen',
      height: 25.4,
      width: 50.8,
      barcodeType: 'Code128',
      barcodeSize: 'Medium',
      isActive: true,
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
    { key: 'category', header: 'Category' },
    { key: 'dimensions', header: 'Dimensions (H × W mm)' },
    { key: 'barcodeType', header: 'Barcode Type' },
    { key: 'status', header: 'Status' },
    { key: 'actions', header: 'Actions' },
  ];

  const rows = presets.map((p) => ({
    id: p.id,
    name: p.name,
    isDefault: p.isDefault,
    category: p.category,
    dimensions: `${p.height.toFixed(1)} × ${p.width.toFixed(1)}`,
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
          subtitle="Order Label, Specimen Label, Block Label, and Slide Label are system defaults — they can be edited and deactivated, but not deleted."
          lowContrast
          hideCloseButton
        />

        <DataTable rows={rows} headers={headers}>
          {({ rows: r, headers: h, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer title="" description="">
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder="Search presets" persistent />
                  <Button kind="ghost" size="sm" onClick={() => {}}>
                    Filter by category
                  </Button>
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
                          <Tag type={categoryTagType(preset.category)} size="sm">{preset.category}</Tag>
                        </TableCell>
                        <TableCell>
                          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '0.8125rem' }}>
                            {preset.height.toFixed(1)} × {preset.width.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {preset.barcodeType === 'QR' ? (
                              <QrCode size={14} />
                            ) : preset.barcodeType === 'DataMatrix' ? (
                              <Layers size={14} />
                            ) : (
                              <Barcode size={14} />
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

  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [selectedNewField, setSelectedNewField] = useState(null);

  // Only system fields from AVAILABLE_FIELD_LIBRARY can be added. There is no
  // free-text or fixed-value custom field source in MVP.
  const fieldOptionsForAdd = useMemo(() => {
    const existing = new Set(preset.fields.map((f) => f.id));
    return AVAILABLE_FIELD_LIBRARY.filter((f) => !existing.has(f.id));
  }, [preset.fields]);

  const addField = () => {
    if (!selectedNewField) return;
    const fields = [
      ...preset.fields,
      { ...selectedNewField, locked: false, required: false },
    ];
    onChange({ ...preset, fields });
    setSelectedNewField(null);
    setAddPickerOpen(false);
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
              <Dropdown
                id="preset-category"
                titleText="Category"
                label="Choose category"
                items={CATEGORY_ITEMS}
                itemToString={(item) => (item ? item.text : '')}
                selectedItem={CATEGORY_ITEMS.find((c) => c.id === preset.category)}
                onChange={({ selectedItem }) =>
                  selectedItem && updateField('category', selectedItem.id)
                }
              />
            </Stack>
          </FormGroup>

          <FormGroup legendText="Dimensions (mm)">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <NumberInput
                id="preset-height"
                label="Height"
                helperText="Enter values in mm"
                value={preset.height}
                min={5}
                max={200}
                step={0.1}
                onChange={(e, { value }) => updateField('height', parseFloat(value) || 0)}
              />
              <NumberInput
                id="preset-width"
                label="Width"
                helperText="Enter values in mm"
                value={preset.width}
                min={5}
                max={200}
                step={0.1}
                onChange={(e, { value }) => updateField('width', parseFloat(value) || 0)}
              />
            </div>
          </FormGroup>

          <FormGroup legendText="Barcode">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Dropdown
                id="preset-barcode-type"
                titleText="Barcode type"
                label="Choose barcode type"
                items={BARCODE_TYPE_ITEMS}
                itemToString={(item) => (item ? item.text : '')}
                selectedItem={BARCODE_TYPE_ITEMS.find((c) => c.id === preset.barcodeType)}
                onChange={({ selectedItem }) =>
                  selectedItem && updateField('barcodeType', selectedItem.id)
                }
              />
              <Dropdown
                id="preset-barcode-size"
                titleText="Barcode size"
                label="Choose size"
                items={BARCODE_SIZE_ITEMS}
                itemToString={(item) => (item ? item.text : '')}
                selectedItem={BARCODE_SIZE_ITEMS.find((c) => c.id === preset.barcodeSize)}
                onChange={({ selectedItem }) =>
                  selectedItem && updateField('barcodeSize', selectedItem.id)
                }
              />
            </div>
          </FormGroup>

          <FormGroup legendText="Content fields">
            <p style={{ fontSize: '0.75rem', color: '#525252', marginBottom: '0.5rem' }}>
              Pick from the system field set. Drag handles are stubs in this mockup —
              use the arrow buttons to reorder. Lab Number is locked and always required.
            </p>
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

            {addPickerOpen ? (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: '#f4f4f4',
                  borderRadius: 2,
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Dropdown
                    id="add-system-field"
                    titleText="Add field from system field set"
                    label="Choose a field"
                    items={fieldOptionsForAdd}
                    itemToString={(item) => (item ? item.label : '')}
                    selectedItem={selectedNewField}
                    onChange={({ selectedItem }) => setSelectedNewField(selectedItem)}
                  />
                </div>
                <Button size="sm" onClick={addField} disabled={!selectedNewField}>
                  Add
                </Button>
                <Button
                  size="sm"
                  kind="ghost"
                  onClick={() => {
                    setAddPickerOpen(false);
                    setSelectedNewField(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={() => <Plus size={14} />}
                onClick={() => setAddPickerOpen(true)}
                style={{ marginTop: '0.5rem' }}
              >
                Add Field
              </Button>
            )}
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
  const presetItems = activePresets.map((p) => ({ id: p.id, text: p.name, category: p.category }));

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
      <aside
        style={{
          width: 260,
          background: '#ffffff',
          borderRight: '1px solid #e0e0e0',
          padding: '1rem 0',
          flexShrink: 0,
        }}
      >
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
          {[
            'Basic Info',
            'Sample & Results',
            'Methods',
            'Ranges',
            'Sample Storage',
            'Display Order',
            'Panels',
            'Labels',
            'Terminology Mappings',
          ].map((label) => {
            const active = label === 'Labels';
            return (
              <div
                key={label}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  background: active ? '#e0e0e0' : 'transparent',
                  borderLeft: active ? '3px solid #0f62fe' : '3px solid transparent',
                  color: active ? '#161616' : '#525252',
                  fontWeight: active ? 600 : 400,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
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
                              <Tag size="sm" type={categoryTagType(preset.category)}>
                                {preset.category}
                              </Tag>
                              <span style={{ fontSize: '0.75rem', color: '#525252', marginLeft: 6 }}>
                                {preset.height.toFixed(1)} × {preset.width.toFixed(1)} mm · {preset.barcodeType}
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
  const [rows, setRows] = useState(ORDER_ENTRY_ROWS);

  const activePresets = ACTIVE_ORDER_PRESETS.map((id) => findPreset(INITIAL_PRESETS, id)).filter(Boolean);

  const updateCell = (rowId, presetId, qty) => {
    setRows(
      rows.map((r) =>
        r.id !== rowId || !r.cells[presetId]
          ? r
          : { ...r, cells: { ...r.cells, [presetId]: { ...r.cells[presetId], qty } } }
      )
    );
  };

  const totals = useMemo(() => {
    const t = {};
    activePresets.forEach((p) => {
      t[p.id] = rows.reduce((sum, r) => sum + (r.cells[p.id]?.qty || 0), 0);
    });
    return t;
  }, [rows, activePresets]);

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

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
            Review the labels that will be generated for this order. Counts are pre-populated from the
            test catalog configuration and aggregated across the tests on each sample. Adjust within
            the maximum allowed, or accept the suggested values.
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

        <Tile>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Labels to print</h3>
              <p style={{ fontSize: '0.8125rem', color: '#525252' }}>
                Columns are derived from the active presets linked to the ordered tests. Empty cells
                indicate the preset doesn't apply to that row.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Tag type="blue" size="sm">
                <Printer size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                {grandTotal} labels total
              </Tag>
            </div>
          </div>

          <TableContainer>
            <Table size="md">
              <TableHead>
                <TableRow>
                  <TableHeader style={{ width: 240 }}>Entity</TableHeader>
                  {activePresets.map((p) => (
                    <TableHeader key={p.id}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#525252', fontWeight: 400 }}>
                          {p.height.toFixed(1)} × {p.width.toFixed(1)} mm
                        </div>
                      </div>
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div style={{ fontWeight: 500 }}>{row.label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#525252', marginTop: 2 }}>
                        {row.description}
                      </div>
                    </TableCell>
                    {activePresets.map((p) => {
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
                              <Tooltip
                                align="top"
                                label="Quantity locked by test catalog"
                              >
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '0.375rem 0.5rem',
                                    background: '#f4f4f4',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    color: '#393939',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'help',
                                    width: 'fit-content',
                                  }}
                                >
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
                                max={20}
                                onChange={(e, { value }) =>
                                  updateCell(row.id, p.id, parseInt(value) || 0)
                                }
                              />
                            )}
                            <Tag
                              size="sm"
                              type={cell.source.startsWith('from') ? 'teal' : 'cool-gray'}
                              style={{ width: 'fit-content' }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                {cell.source.startsWith('from') ? (
                                  <FlaskConical size={10} />
                                ) : (
                                  <CheckCircle2 size={10} />
                                )}
                                {cell.source}
                              </span>
                            </Tag>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow style={{ background: '#f4f4f4' }}>
                  <TableCell style={{ fontWeight: 600 }}>Total labels by preset</TableCell>
                  {activePresets.map((p) => (
                    <TableCell key={p.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Printer size={14} />
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{totals[p.id]}</span>
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

        <PostSavePrintDialog rows={rows} activePresets={activePresets} totals={totals} />
      </Stack>
    </div>
  );
}

// =============================================================================
// POST-SAVE PRINT DIALOG — rendered inline at the end of View 3.
// Static preview (not an interactive Modal) so reviewers can see the state
// without clicking Save. A "PREVIEW" tag marks it.
// =============================================================================

function PostSavePrintDialog({ rows, activePresets, totals }) {
  // Build one row per preset that has a non-zero total across the order.
  const presetRows = activePresets
    .filter((p) => (totals[p.id] || 0) > 0)
    .map((p) => {
      // Collect the row-level descriptions that drove this preset's count.
      const contributingRows = rows
        .filter((r) => r.cells[p.id] && r.cells[p.id].qty > 0)
        .map((r) => r.label.replace(/ —.*$/, ''));
      return {
        id: p.id,
        name: p.name,
        qty: totals[p.id],
        dim: `${p.height.toFixed(1)} × ${p.width.toFixed(1)} mm`,
        meta: contributingRows.length === 1 ? contributingRows[0] : `${contributingRows.length} sources`,
      };
    });

  return (
    <Tile
      style={{
        background: '#ffffff',
        border: '1px solid #c6c6c6',
        borderTop: '3px solid #24a148',
        padding: 0,
        marginTop: '0.5rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
          <CheckCircle2 size={20} color="#24a148" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#161616' }}>
              Order Saved Successfully
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#393939', marginTop: 2 }}>
              Lab Number:{' '}
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>
                24ORD00152
              </span>
            </div>
          </div>
        </div>
        <Tag type="blue" size="sm">PREVIEW</Tag>
      </div>

      {/* Body — one row per preset */}
      <div style={{ padding: '0.5rem 0.5rem 0' }}>
        <TableContainer>
          <Table size="md">
            <TableHead>
              <TableRow>
                <TableHeader>Label</TableHeader>
                <TableHeader style={{ width: 80 }}>Qty</TableHeader>
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
                      {r.meta}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600 }}>
                      ×{r.qty}
                    </span>
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
      <div
        style={{
          padding: '0.75rem 1.25rem 1rem',
          borderTop: '1px solid #e0e0e0',
          marginTop: '0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
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
      <div
        style={{
          background: '#161616',
          color: '#ffffff',
          padding: '0.75rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
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

      <Tabs
        selectedIndex={activeView}
        onChange={({ selectedIndex }) => setActiveView(selectedIndex)}
      >
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
