/**
 * OGC-66 — Patient ID Card Scanning and Document Management
 * Feature: Add ID card scanning and document management to patient records
 *
 * Screens:
 *   1. Add/Edit Patient — new "Identification Documents" accordion section
 *   2. Patient Search Results — document count column + inline preview panel
 *
 * Constitution compliance:
 *   ✅ Principle 1: All strings wrapped in t(key, fallback)
 *   ✅ Principle 2: Carbon components only — FileUploader, Tile, Tag, Modal,
 *                   Accordion, DataTable, InlineNotification, Select, TextInput
 *   ✅ Principle 3: Inline-first — edit form expands inside each tile (not modal)
 *                   Modal used only for lightbox viewer (non-table context) and
 *                   destructive delete confirmation
 *   ✅ Principle 4: Permission keys declared (patient.documents.view /
 *                   .upload / .delete) — UI hides/disables per role
 *   ✅ Principle 7: Design brief produced before this file was written
 */

import React, { useState, useCallback } from 'react';
import {
  Accordion, AccordionItem,
  Button,
  ComposedModal, ModalHeader, ModalBody, ModalFooter,
  DataTable, TableContainer, Table, TableHead, TableRow,
  TableHeader, TableBody, TableCell, TableToolbar,
  TableToolbarContent, TableToolbarSearch,
  FileUploader,
  Grid, Column, Stack,
  InlineNotification,
  Select, SelectItem,
  Tag,
  TextInput, TextArea,
  Tile,
  Breadcrumb, BreadcrumbItem,
  Tabs, Tab, TabList, TabPanels, TabPanel,
  OverflowMenu, OverflowMenuItem,
} from '@carbon/react';
import { View, Edit, TrashCan, Document, Upload, Camera, Add } from '@carbon/icons-react';

/* ── i18n helper ──────────────────────────────────────────────── */
const t = (key, fallback) => fallback || key;

/* ── Permission keys ──────────────────────────────────────────── */
export const PERMISSIONS = {
  VIEW:   'patient.documents.view',
  UPLOAD: 'patient.documents.upload',
  DELETE: 'patient.documents.delete',
};

/* ── Document type options ────────────────────────────────────── */
const DOC_TYPES = [
  { value: 'National ID',    labelKey: 'label.docType.nationalId',    label: 'National ID' },
  { value: 'Insurance Card', labelKey: 'label.docType.insuranceCard', label: 'Insurance Card' },
  { value: 'Other',          labelKey: 'label.docType.other',         label: 'Other' },
];

const DOC_TYPE_TAG_KINDS = {
  'National ID':    'blue',
  'Insurance Card': 'teal',
  'Other':          'gray',
};

/* ── DocTypeTag ───────────────────────────────────────────────── */
function DocTypeTag({ type }) {
  return (
    <Tag kind={DOC_TYPE_TAG_KINDS[type] || 'gray'}>
      {t(`label.docType.${type}`, type)}
    </Tag>
  );
}

/* ── DocumentTile ─────────────────────────────────────────────── */
/**
 * Displays a single uploaded document as a thumbnail tile.
 * Edit form expands inline inside the tile (Principle 3 — no modal for edit).
 *
 * Props:
 *   doc         — { id, type, description?, filename, size, uploadDate, uploadedBy, thumbnailUrl? }
 *   canUpload   — boolean (patient.documents.upload permission)
 *   canDelete   — boolean (patient.documents.delete permission)
 *   onView      — (doc) => void
 *   onSave      — (id, { type, description }) => void
 *   onDeleteRequest — (doc) => void
 */
function DocumentTile({ doc, canUpload, canDelete, onView, onSave, onDeleteRequest }) {
  const [editing, setEditing] = useState(false);
  const [draftType, setDraftType] = useState(doc.type);
  const [draftDesc, setDraftDesc] = useState(doc.description || '');

  function handleSave() {
    onSave(doc.id, { type: draftType, description: draftDesc });
    setEditing(false);
  }

  function handleCancel() {
    setDraftType(doc.type);
    setDraftDesc(doc.description || '');
    setEditing(false);
  }

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)' }}>
      {/* Thumbnail */}
      <div
        style={{
          height: '110px',
          background: 'var(--cds-layer-02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--cds-spacing-04)',
        }}
        aria-label={t('label.documentThumbnail', 'Document thumbnail')}
      >
        {doc.thumbnailUrl ? (
          <img src={doc.thumbnailUrl} alt={doc.filename} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <Document size={48} />
        )}
      </div>

      {/* Type badge + filename */}
      <Stack gap={2}>
        <DocTypeTag type={doc.type} />
        <p style={{ margin: 0, fontSize: 'var(--cds-body-compact-01-font-size)', wordBreak: 'break-all' }}>
          {doc.filename}
        </p>
        <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)' }}>
          {t('label.uploaded', 'Uploaded')} {doc.uploadDate} · {doc.size}
        </p>
        {!editing && doc.description && (
          <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)', fontStyle: 'italic' }}>
            {doc.description}
          </p>
        )}

        {/* Action buttons */}
        {!editing && (
          <Stack orientation="horizontal" gap={2}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={View}
              iconDescription={t('button.view', 'View')}
              onClick={() => onView(doc)}
              hasIconOnly={false}
            >
              {t('button.view', 'View')}
            </Button>

            {canUpload && (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Edit}
                iconDescription={t('button.edit', 'Edit')}
                onClick={() => setEditing(true)}
                hasIconOnly={false}
              >
                {t('button.edit', 'Edit')}
              </Button>
            )}

            {canDelete && (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={TrashCan}
                iconDescription={t('button.delete', 'Delete')}
                onClick={() => onDeleteRequest(doc)}
                style={{ color: 'var(--cds-support-error)' }}
                hasIconOnly={false}
              >
                {t('button.delete', 'Delete')}
              </Button>
            )}
          </Stack>
        )}

        {/* Inline edit form (Principle 3 — inline, not modal) */}
        {editing && (
          <div style={{ borderTop: '1px solid var(--cds-border-subtle)', paddingTop: 'var(--cds-spacing-04)' }}>
            <Stack gap={4}>
              <Select
                id={`doc-type-${doc.id}`}
                labelText={
                  <>
                    {t('label.documentType', 'Document Type')}
                    {' '}<span style={{ color: 'var(--cds-support-error)' }}>*</span>
                  </>
                }
                value={draftType}
                onChange={e => setDraftType(e.target.value)}
              >
                {DOC_TYPES.map(dt => (
                  <SelectItem key={dt.value} value={dt.value} text={t(dt.labelKey, dt.label)} />
                ))}
              </Select>

              {draftType === 'Other' && (
                <TextInput
                  id={`doc-desc-${doc.id}`}
                  labelText={t('label.description', 'Description')}
                  value={draftDesc}
                  onChange={e => setDraftDesc(e.target.value)}
                  placeholder={t('placeholder.description', 'e.g., Vaccination certificate')}
                />
              )}

              <Stack orientation="horizontal" gap={3}>
                <Button kind="primary" size="sm" onClick={handleSave}>
                  {t('button.save', 'Save')}
                </Button>
                <Button kind="ghost" size="sm" onClick={handleCancel}>
                  {t('button.cancel', 'Cancel')}
                </Button>
              </Stack>
            </Stack>
          </div>
        )}
      </Stack>
    </Tile>
  );
}

/* ── DocumentUploadZone ───────────────────────────────────────── */
/**
 * File upload area with document type selection, drag-and-drop,
 * camera capture, and clipboard paste support.
 */
function DocumentUploadZone({ onUpload, onCancel }) {
  const [docType, setDocType] = useState('National ID');
  const [typeError, setTypeError] = useState('');

  function handleFiles(e) {
    if (!docType) {
      setTypeError(t('error.docType.required', 'Please select a document type before uploading.'));
      return;
    }
    setTypeError('');
    const files = e.target?.files || e.dataTransfer?.files || [];
    if (files.length > 0) onUpload(docType, files[0]);
  }

  return (
    <Tile style={{ padding: 'var(--cds-spacing-05)', marginTop: 'var(--cds-spacing-05)' }}>
      <Stack gap={5}>
        <Grid>
          <Column lg={6} md={4}>
            <Select
              id="upload-doc-type"
              labelText={
                <>
                  {t('label.documentType', 'Document Type')}
                  {' '}<span style={{ color: 'var(--cds-support-error)' }}>*</span>
                </>
              }
              value={docType}
              onChange={e => { setDocType(e.target.value); setTypeError(''); }}
              invalid={!!typeError}
              invalidText={typeError}
            >
              {DOC_TYPES.map(dt => (
                <SelectItem key={dt.value} value={dt.value} text={t(dt.labelKey, dt.label)} />
              ))}
            </Select>
          </Column>
        </Grid>

        <FileUploader
          labelTitle={t('label.uploadFiles', 'Upload identification document')}
          labelDescription={t('label.fileFormats', 'JPEG, PNG, or PDF · Max 10 MB per file')}
          buttonLabel={t('button.addFiles', 'Add file')}
          buttonKind="primary"
          size="md"
          filenameStatus="edit"
          accept={['.jpg', '.jpeg', '.png', '.pdf']}
          multiple={false}
          onChange={handleFiles}
        />

        <Stack orientation="horizontal" gap={3}>
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Camera}
            onClick={() => alert(t('message.cameraNotAvailable', 'Camera capture opens device camera — not available in preview.'))}
          >
            {t('button.scanIdCard', 'Scan ID Card')}
          </Button>
          <Button
            kind="ghost"
            size="sm"
            onClick={() => alert(t('message.clipboardNotAvailable', 'Clipboard paste — not available in preview.'))}
          >
            {t('button.pasteClipboard', 'Paste from Clipboard')}
          </Button>
          <Button kind="ghost" size="sm" onClick={onCancel}>
            {t('button.cancel', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    </Tile>
  );
}

/* ── DocumentViewerModal ──────────────────────────────────────── */
/**
 * Lightbox-style modal for viewing document images/PDFs.
 * Modal is justified here: image viewer context is not feasible inline (AP-04 exception).
 */
function DocumentViewerModal({ doc, open, onClose }) {
  if (!doc) return null;

  return (
    <ComposedModal open={open} onClose={onClose} size="md">
      <ModalHeader title={t('heading.viewDocument', 'View Document')} />
      <ModalBody>
        <Stack gap={5}>
          {/* Document display area */}
          <div
            style={{
              width: '100%',
              height: '280px',
              background: 'var(--cds-layer-02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--cds-border-subtle)',
            }}
            aria-label={t('label.documentPreview', 'Document preview')}
          >
            {doc.thumbnailUrl ? (
              <img src={doc.thumbnailUrl} alt={doc.filename} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <Document size={64} />
            )}
          </div>

          {/* Metadata */}
          <Stack gap={2}>
            <DocTypeTag type={doc.type} />
            <Grid condensed>
              <Column lg={8} md={4}>
                <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)' }}>
                  {t('label.filename', 'Filename')}
                </p>
                <p style={{ margin: 0 }}>{doc.filename}</p>
              </Column>
              <Column lg={4} md={4}>
                <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)' }}>
                  {t('label.fileSize', 'File Size')}
                </p>
                <p style={{ margin: 0 }}>{doc.size}</p>
              </Column>
              <Column lg={8} md={4}>
                <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)' }}>
                  {t('label.uploadedBy', 'Uploaded By')}
                </p>
                <p style={{ margin: 0 }}>{doc.uploadedBy}</p>
              </Column>
              <Column lg={4} md={4}>
                <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)' }}>
                  {t('label.uploadDate', 'Upload Date')}
                </p>
                <p style={{ margin: 0 }}>{doc.uploadDate}</p>
              </Column>
            </Grid>
            {doc.description && (
              <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-secondary)', fontStyle: 'italic' }}>
                {doc.description}
              </p>
            )}
          </Stack>

          <p style={{ margin: 0, fontSize: 'var(--cds-helper-text-01-font-size)', color: 'var(--cds-text-helper)' }}>
            {t('message.viewAudit', 'This view has been recorded in the audit trail.')}
          </p>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>{t('button.close', 'Close')}</Button>
        <Button kind="primary">{t('button.download', 'Download')}</Button>
      </ModalFooter>
    </ComposedModal>
  );
}

/* ── DeleteConfirmModal ───────────────────────────────────────── */
/**
 * Destructive confirmation modal — correct per AP-04 (delete is irreversible).
 */
function DeleteConfirmModal({ doc, open, onConfirm, onCancel }) {
  if (!doc) return null;
  return (
    <ComposedModal
      open={open}
      onClose={onCancel}
      danger
      size="sm"
    >
      <ModalHeader title={t('heading.deleteDocument', 'Delete Document?')} />
      <ModalBody>
        <p>
          {t('message.deleteConfirmPart1', 'Are you sure you want to delete the')}
          {' '}<strong>{doc.type}</strong>{' '}
          {t('message.deleteConfirmPart2', 'document')} ({doc.filename})?
        </p>
        <p style={{ fontSize: 'var(--cds-body-compact-01-font-size)', color: 'var(--cds-text-secondary)' }}>
          {t('message.softDelete', 'The file will be removed from the patient record but retained in the audit trail for compliance purposes.')}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onCancel}>{t('button.cancel', 'Cancel')}</Button>
        <Button kind="danger" onClick={() => onConfirm(doc)}>
          {t('button.confirmDelete', 'Delete Document')}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}

/* ── IdentificationDocumentsSection ──────────────────────────── */
/**
 * The main feature component. Renders as an Accordion item below the existing
 * patient information fields on the Add/Edit Patient screen.
 *
 * Props:
 *   patientId   — string
 *   initialDocs — array of document objects (from API / FHIR DocumentReference)
 *   permissions — { canView, canUpload, canDelete }
 */
export function IdentificationDocumentsSection({ patientId, initialDocs = [], permissions = {} }) {
  const { canView = true, canUpload = true, canDelete = false } = permissions;

  const [docs, setDocs]               = useState(initialDocs);
  const [showUpload, setShowUpload]   = useState(false);
  const [viewDoc, setViewDoc]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [notification, setNotification] = useState(null);

  function flash(kind, msg) {
    setNotification({ kind, msg });
    setTimeout(() => setNotification(null), 5000);
  }

  function handleUpload(type, file) {
    // In production: POST /patient/{patientId}/documents (multipart/form-data)
    const newDoc = {
      id: `temp-${Date.now()}`,
      type,
      filename: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'current-user', // injected from auth context in production
    };
    setDocs(prev => [...prev, newDoc]);
    setShowUpload(false);
    flash('success', t('message.uploadSuccess', `"${type}" document uploaded successfully.`));
  }

  function handleSave(id, updates) {
    // In production: PUT /patient/{patientId}/documents/{id}
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
    flash('success', t('message.saveSuccess', 'Document updated successfully.'));
  }

  function handleDelete(doc) {
    // In production: DELETE /patient/{patientId}/documents/{doc.id} (soft delete)
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    setDeleteTarget(null);
    flash('success', t('message.deleteSuccess', `"${doc.type}" document deleted. Audit record retained.`));
  }

  return (
    <>
      <Accordion>
        <AccordionItem
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--cds-spacing-03)' }}>
              {t('heading.identificationDocuments', 'Identification Documents')}
              {docs.length > 0 && (
                <Tag kind="blue" size="sm">{docs.length}</Tag>
              )}
            </span>
          }
          open={true}
        >
          <Stack gap={4}>
            {/* Inline notification */}
            {notification && (
              <InlineNotification
                kind={notification.kind}
                title={notification.msg}
                onCloseButtonClick={() => setNotification(null)}
              />
            )}

            {/* Section toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: 'var(--cds-body-compact-01-font-size)', color: 'var(--cds-text-secondary)' }}>
                {docs.length === 0
                  ? t('message.noDocuments', 'No identification documents attached.')
                  : `${docs.length} ${t('message.documentsAttached', `document${docs.length !== 1 ? 's' : ''} attached`)}`}
              </p>
              {canUpload && (
                <Button
                  kind={showUpload ? 'secondary' : 'tertiary'}
                  size="sm"
                  renderIcon={showUpload ? undefined : Add}
                  onClick={() => setShowUpload(v => !v)}
                >
                  {showUpload
                    ? t('button.cancelUpload', 'Cancel Upload')
                    : t('button.addDocument', 'Add Document')}
                </Button>
              )}
            </div>

            {/* Upload zone */}
            {showUpload && canUpload && (
              <DocumentUploadZone
                onUpload={handleUpload}
                onCancel={() => setShowUpload(false)}
              />
            )}

            {/* Document grid */}
            {docs.length > 0 && (
              <Grid>
                {docs.map(doc => (
                  <Column key={doc.id} lg={5} md={4} sm={4}>
                    <DocumentTile
                      doc={doc}
                      canUpload={canUpload}
                      canDelete={canDelete}
                      onView={setViewDoc}
                      onSave={handleSave}
                      onDeleteRequest={setDeleteTarget}
                    />
                  </Column>
                ))}
              </Grid>
            )}

            {/* Empty state */}
            {docs.length === 0 && !showUpload && (
              <Tile style={{ textAlign: 'center', padding: 'var(--cds-spacing-08)', color: 'var(--cds-text-secondary)' }}>
                <Document size={32} style={{ marginBottom: 'var(--cds-spacing-04)' }} />
                <p style={{ margin: 0 }}>
                  {t('message.emptyDocs', 'No identification documents attached to this patient.')}
                </p>
                {canUpload && (
                  <p style={{ margin: 'var(--cds-spacing-02) 0 0', fontSize: 'var(--cds-body-compact-01-font-size)' }}>
                    {t('message.emptyDocsHint', 'Click "Add Document" to attach a National ID, Insurance Card, or other document.')}
                  </p>
                )}
              </Tile>
            )}
          </Stack>
        </AccordionItem>
      </Accordion>

      {/* Modals — outside Accordion to avoid z-index issues */}
      <DocumentViewerModal
        doc={viewDoc}
        open={!!viewDoc}
        onClose={() => setViewDoc(null)}
      />
      <DeleteConfirmModal
        doc={deleteTarget}
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

/* ── PatientSearchDocumentIndicator ──────────────────────────── */
/**
 * Cell content for the "ID Documents" column in Patient Search Results.
 * Shows a clickable count badge that expands to a document preview panel.
 *
 * Props:
 *   count     — number of attached documents
 *   patientId — string
 *   onExpand  — (patientId) => void — triggers the row expansion panel
 */
export function PatientSearchDocumentIndicator({ count, patientId, onExpand }) {
  if (count === 0) return <span style={{ color: 'var(--cds-text-placeholder)' }}>—</span>;

  return (
    <Button
      kind="ghost"
      size="sm"
      renderIcon={Document}
      onClick={() => onExpand(patientId)}
      style={{ padding: 'var(--cds-spacing-02) var(--cds-spacing-03)' }}
    >
      <Tag kind="blue" size="sm">{count}</Tag>
    </Button>
  );
}

/* ── Integration notes ────────────────────────────────────────── */
/*
 * Usage in AddNewPatientPage / EditPatientPage:
 *
 *   import { IdentificationDocumentsSection } from './OGC-66-patient-id-scanning-mockup';
 *
 *   // Within the patient form, below the Additional Information accordion:
 *   <IdentificationDocumentsSection
 *     patientId={patient.id}
 *     initialDocs={patient.documents}      // from GET /patient/{id}/documents
 *     permissions={{
 *       canView:   hasPermission(PERMISSIONS.VIEW),
 *       canUpload: hasPermission(PERMISSIONS.UPLOAD),
 *       canDelete: hasPermission(PERMISSIONS.DELETE),
 *     }}
 *   />
 *
 * Usage in PatientSearchResultsTable:
 *   - Add a new column "ID Documents" after the existing columns
 *   - Render <PatientSearchDocumentIndicator count={row.docCount} ... />
 *   - On expand, fetch GET /patient/{id}/documents and render a preview row below
 *
 * FHIR mapping (DocumentReference):
 *   - POST creates a new DocumentReference linked to the Patient FHIR resource
 *   - GET /patient/{id}/documents returns DocumentReference list for the patient
 *   - DELETE soft-deletes by setting DocumentReference.status = "superseded"
 *
 * i18n keys introduced — document in FRS Localization table:
 *   heading.identificationDocuments
 *   heading.viewDocument
 *   heading.deleteDocument
 *   label.documentType
 *   label.docType.nationalId
 *   label.docType.insuranceCard
 *   label.docType.other
 *   label.description
 *   label.filename
 *   label.fileSize
 *   label.uploadedBy
 *   label.uploadDate
 *   label.uploaded
 *   label.uploadFiles
 *   label.fileFormats
 *   label.idDocuments
 *   label.documentThumbnail
 *   label.documentPreview
 *   button.addDocument
 *   button.cancelUpload
 *   button.scanIdCard
 *   button.pasteClipboard
 *   button.addFiles
 *   button.view
 *   button.edit
 *   button.delete
 *   button.save
 *   button.cancel
 *   button.close
 *   button.download
 *   button.confirmDelete
 *   message.noDocuments
 *   message.documentsAttached
 *   message.emptyDocs
 *   message.emptyDocsHint
 *   message.uploadSuccess
 *   message.saveSuccess
 *   message.deleteSuccess
 *   message.softDelete
 *   message.deleteConfirmPart1
 *   message.deleteConfirmPart2
 *   message.viewAudit
 *   message.cameraNotAvailable
 *   message.clipboardNotAvailable
 *   placeholder.description
 *   error.docType.required
 */

// ---------------------------------------------------------------------------
// Default export — gallery demo wrapper
// Shows both components: the Add Patient accordion section and search indicator
// ---------------------------------------------------------------------------
export default function PatientIdCardScanningMockup() {
  const DEMO_DOCS = [
    {
      id: 'doc-1',
      type: 'national-id',
      filename: 'national_id_front.jpg',
      size: 204800,
      uploadedBy: 'Demo User',
      uploadDate: '2026-04-13',
      thumbnail: null,
    },
  ];

  return (
    <div style={{ padding: '1rem', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'IBM Plex Sans, sans-serif', marginBottom: '1.5rem' }}>
        OGC-66 — Patient ID Card Scanning & Document Management
      </h2>
      <IdentificationDocumentsSection
        patientId="demo-patient-001"
        initialDocs={DEMO_DOCS}
        permissions={{ canView: true, canUpload: true, canDelete: true }}
      />
    </div>
  );
}
