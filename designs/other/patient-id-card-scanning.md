# Patient ID Card Scanning and Management

## Issue Type
Story

## Summary
Add ability to scan and attach patient ID cards (National ID, Insurance cards) to patient records

## Description

### Overview
Allow users to scan, upload, and manage multiple identification cards (National ID, Insurance cards, etc.) for patients during patient registration and when updating patient records. These scanned cards should be stored in the FHIR Patient resource, displayed during patient search, and fully auditable.

### User Story
**As a** laboratory registration staff member  
**I want to** scan and attach patient ID cards (National ID, Insurance) to the patient record  
**So that** we can maintain digital copies of patient identification documents for verification and record-keeping

### Current Screens
- **Patient Search/Add Screen:** "Test Request" → "Patient Info" tab with search and "New Patient" button
- **Add New Patient Screen:** "Patient Information" form with demographics and additional information sections

---

## Acceptance Criteria

### 1. UI Components - Add New Patient Screen

**Location:** Add to the "Patient Information" section on the "Add a new patient" screen

- [ ] Add a new section titled "Identification Documents" below the existing patient information fields
- [ ] Include an "Add Document" or "Scan ID Card" button
- [ ] Display thumbnail previews of uploaded documents in a grid/list layout
- [ ] For each uploaded document, show:
  - [ ] Thumbnail preview of the image
  - [ ] Document type label (National ID, Insurance Card, Other)
  - [ ] Upload date/time
  - [ ] Action buttons: View (eye icon), Edit (pencil icon), Delete (trash icon)

### 2. Document Upload Functionality

- [ ] Support multiple upload methods:
  - [ ] File upload (drag-and-drop or file picker)
  - [ ] Camera/scanner integration for direct capture
  - [ ] Paste from clipboard
- [ ] Support common image formats: JPEG, PNG, PDF
- [ ] Maximum file size: 10MB per document
- [ ] Image optimization: Automatically compress/resize images for storage efficiency
- [ ] Allow multiple documents per patient (no fixed limit)

### 3. Document Type Selection

- [ ] Dropdown or radio button selection for document type:
  - [ ] National ID
  - [ ] Insurance Card
  - [ ] Other (with optional text field for description)
- [ ] Make document type a required field when uploading
- [ ] Allow editing of document type after upload

### 4. Patient Search Screen Integration

**Location:** "Test Request" → "Patient Info" tab → "Patient Results" table

- [ ] Add a new column to the patient search results table: "ID Documents"
- [ ] Display an icon/indicator showing number of attached documents (e.g., "📄 2" or document icon with count badge)
- [ ] Make the indicator clickable to preview documents in a modal/lightbox
- [ ] OR add a dedicated "View Documents" action button in the results row

### 5. Edit Patient Screen

- [ ] Display existing ID documents when editing a patient
- [ ] Allow adding new documents
- [ ] Allow viewing, editing (type/description), and deleting existing documents
- [ ] Show upload date and last modified date for each document

### 6. Document Viewing

- [ ] Clicking "View" opens document in a modal/lightbox overlay
- [ ] Support zoom in/out for image documents
- [ ] Support page navigation for PDF documents
- [ ] Include close button and navigation controls
- [ ] Display document metadata (type, upload date, uploaded by)

### 7. Document Editing

- [ ] Allow changing the document type
- [ ] Allow adding/editing optional description/notes
- [ ] Allow replacing the image (upload new version)
- [ ] Track version history if document is replaced

### 8. Document Deletion

- [ ] Require confirmation before deleting a document
- [ ] Soft delete: Mark as deleted but retain in database for audit purposes
- [ ] Only allow users with appropriate permissions to delete documents
- [ ] Log deletion in audit trail

### 9. FHIR Integration

- [ ] Store scanned ID cards as attachments in the FHIR Patient resource
- [ ] Use `Patient.photo` for patient photos (if applicable)
- [ ] Use `Patient.identifier` with appropriate system/type for ID numbers extracted from cards
- [ ] Consider using DocumentReference resource linked to Patient for ID card scans
- [ ] Include document metadata in FHIR resource:
  - [ ] `contentType` (MIME type)
  - [ ] `creation` date
  - [ ] `title` (document type: "National ID", "Insurance Card")
  - [ ] `url` or `data` (base64 encoded if embedded)

### 10. Audit Trail

All actions related to ID documents must be logged in the audit trail with the following information:

- [ ] **Action:** Upload, View, Edit (type change), Delete
- [ ] **User:** Username/ID of person performing action
- [ ] **Timestamp:** Date and time of action
- [ ] **Patient ID:** Associated patient identifier
- [ ] **Document Details:** 
  - Document type
  - File name
  - File size
  - For edits: old value → new value
- [ ] **IP Address:** User's IP address (if applicable)
- [ ] **Session ID:** For traceability

**Audit Log Examples:**
```
User: jsmith | Action: UPLOAD | Patient: P123456 | Document: National ID | File: national_id_front.jpg (2.3MB) | Timestamp: 2025-11-14 10:23:45
User: jsmith | Action: VIEW | Patient: P123456 | Document: Insurance Card | Timestamp: 2025-11-14 10:25:12
User: mjones | Action: EDIT | Patient: P123456 | Document: Changed type from "Other" to "Insurance Card" | Timestamp: 2025-11-14 11:15:33
User: admin | Action: DELETE | Patient: P123456 | Document: National ID (old_id.jpg) | Timestamp: 2025-11-14 14:30:21
```

### 11. Security & Permissions

- [ ] Implement role-based access control:
  - [ ] View documents: Registration staff, Lab technicians, Lab managers
  - [ ] Upload/Edit documents: Registration staff, Lab managers
  - [ ] Delete documents: Lab managers, System administrators only
- [ ] Encrypt sensitive ID card images at rest
- [ ] Use HTTPS for transmission
- [ ] Implement access logging (who viewed which document when)

### 12. Data Validation

- [ ] Validate file type before upload
- [ ] Check file size limits
- [ ] Scan for malware/viruses before storing
- [ ] Validate image quality (minimum resolution, not corrupted)

---

## Technical Considerations

### Storage
- Decide on storage location:
  - Option 1: Database (as BLOB/base64) - easier backup, FHIR compliant
  - Option 2: File system with database reference - better performance for large files
  - Option 3: Cloud storage (S3, Azure Blob) with signed URLs - scalable
- Implement file naming convention: `patient_{patientId}_doc_{timestamp}_{documentType}.{ext}`

### Performance
- Implement lazy loading for document thumbnails in patient search results
- Use thumbnail generation for preview (don't load full resolution images)
- Implement pagination if patient has many documents

### FHIR Mapping
```json
{
  "resourceType": "Patient",
  "id": "patient-123",
  "identifier": [
    {
      "system": "http://openelis-global.org/national-id",
      "value": "ID-123456789"
    }
  ],
  "extension": [
    {
      "url": "http://openelis-global.org/fhir/StructureDefinition/patient-id-document",
      "extension": [
        {
          "url": "documentType",
          "valueString": "National ID"
        },
        {
          "url": "uploadDate",
          "valueDateTime": "2025-11-14T10:23:45Z"
        },
        {
          "url": "uploadedBy",
          "valueString": "jsmith"
        }
      ],
      "valueAttachment": {
        "contentType": "image/jpeg",
        "data": "base64EncodedImageData...",
        "title": "National ID - Front",
        "creation": "2025-11-14T10:23:45Z"
      }
    }
  ]
}
```

OR use DocumentReference:
```json
{
  "resourceType": "DocumentReference",
  "id": "doc-123",
  "status": "current",
  "type": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "47420-5",
        "display": "Functional status assessment note"
      }
    ],
    "text": "National ID Card"
  },
  "subject": {
    "reference": "Patient/patient-123"
  },
  "date": "2025-11-14T10:23:45Z",
  "author": [
    {
      "reference": "Practitioner/jsmith"
    }
  ],
  "content": [
    {
      "attachment": {
        "contentType": "image/jpeg",
        "url": "https://storage.openelis.org/documents/national_id_123.jpg",
        "title": "National ID - Front",
        "creation": "2025-11-14T10:23:45Z"
      }
    }
  ]
}
```

---

## UI/UX Mockup Notes

### Add New Patient Screen - New Section

**Identification Documents** section (below Additional Information):

```
┌─────────────────────────────────────────────────────────────┐
│ Identification Documents                                  ▲ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [+ Add Document]  [📷 Scan ID Card]                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  [Preview]  │  │  [Preview]  │  │  [Preview]  │        │
│  │   Image     │  │   Image     │  │   Image     │        │
│  │             │  │             │  │             │        │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤        │
│  │ National ID │  │Insurance Card│  │   Other     │        │
│  │ 2025-11-14  │  │ 2025-11-14  │  │ 2025-11-14  │        │
│  │ 👁 ✏️ 🗑      │  │ 👁 ✏️ 🗑      │  │ 👁 ✏️ 🗑      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Patient Search Results - Updated Table

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Last Name │First Name│Gender│Date of Birth│Health ID│National ID│Documents│Actions│
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Smith     │ John     │ M    │ 1985-03-15  │ H123456 │ N789012   │ 📄 3    │ [...]  │
│ Doe       │ Jane     │ F    │ 1990-07-22  │ H234567 │ N890123   │ 📄 2    │ [...]  │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                                      ↑
                                                           Clickable to view docs
```

---

## Definition of Done

- [ ] Code developed and unit tested
- [ ] Integration with FHIR Patient resource tested
- [ ] Audit logging implemented and verified
- [ ] UI matches Carbon Design System standards
- [ ] Security permissions implemented and tested
- [ ] Works on both desktop and tablet devices
- [ ] Documentation updated (user manual, technical docs)
- [ ] Code reviewed and approved
- [ ] Tested on testing.openelis-global.org
- [ ] All acceptance criteria verified by QA
- [ ] Regression testing completed
- [ ] Approved by Product Owner

---

## Related Issues
- OGC-59: Add the ability to capture or upload a photo to the patient (Related - photo vs ID cards)
- OGC-50: Add Diagnoses to the lab order (Related - patient information enhancement)

---

## Priority
Medium

## Labels
- patient-management
- FHIR
- document-management
- security
- audit-trail

## Deliverables
Multiple countries may benefit (Madagascar specifically mentioned ID card requirements in workplan)

---

## Questions/Notes

1. **Document Retention Policy:** How long should deleted documents be retained in the system for audit purposes?
2. **OCR Integration:** Future enhancement - should we extract text from ID cards (ID numbers, names) and auto-populate patient fields?
3. **Multi-page Documents:** Should we support multi-page documents (e.g., front and back of ID card as separate pages or single document)?
4. **Duplicate Detection:** Should system warn if uploading a document that looks identical to an existing one?
5. **Internationalization:** Document type labels need translation support for multiple languages

---

## Testing Scenarios

1. Upload single National ID card during new patient creation
2. Upload multiple documents (National ID + Insurance Card) for existing patient
3. View document from patient search results
4. Edit document type from "Other" to "Insurance Card"
5. Delete document and verify audit trail entry
6. Attempt to upload unsupported file type (should reject)
7. Attempt to upload file exceeding size limit (should reject)
8. Verify FHIR Patient resource contains document attachments
9. Verify user without delete permission cannot delete documents
10. Test on tablet device with camera integration
