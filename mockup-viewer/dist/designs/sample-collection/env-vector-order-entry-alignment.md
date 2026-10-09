# Environmental and Vector Order Entry: Alignment Note

Date: 2026-09-25. Companion to `clinical-order-entry-v4-frs.md` (section L). Reviewed against develop @ 5e59f8d and the environmental order entry v2 spec, V-02 vector collection workflow, and related vector specs.

## Verdict

Neither domain needs its own redesign. Both need **alignment**:

- **What stays:** the domain content (sampling sites, compliance standards, pools, quality control samples).
- **What they adopt:** the step structure, save path, samples table and required-field model from the clinical design.

The clinical FRS already specifies the shared parts domain-neutrally (section L), so this alignment can follow without reworking it.

## Environmental: as built

- **Steps.** Three steps, Enter, Label and QA, at `/order/environmental/enter`, `/label` and `/qa`. There is no Collect step, and samples are created on Enter.
- **Save is not atomic.** This is the same class of defect as clinical:
  - Storage is saved as one request per sample.
  - Storage notes are patched per sample.
  - A fire-and-forget "storage skipped" call is sent.
  - Refer out is a separate full-order save, and dispatch is a further call.
- **Sampling-site defect, unique to environmental.** A sampling site is created or updated before validation and outside the save transaction.
  - A failed save still leaves a new site behind.
  - The order form can overwrite an existing site's name, code and type.
  - "Resolve by code" silently reuses a site that has the same code but a different name.
- **Dead and misplaced controls.**
  - The Print Labels panel does nothing, and it offers pathology Slide and Block labels.
  - Save as Draft is the same as Save.
  - Refer out sits on the Label step.
- **Required fields.**
  - There is one level only. Save and next is disabled with no reason given.
  - Container type and collection method are required by the spec but not enforced.
  - Blank collection and received times are silently stamped "now".
  - The holding-time clock starts from received time instead of collection time.

## Vector: as built

- **Steps.** Four steps: Enter, Label, QA and Complete. Complete is a confirmation page whose primary button is labelled "Cancel".
- **Pool fan-out.** A row with quantity N becomes N organism samples, and the parent is hard-deleted (conflicts with no-hard-delete).
- **Data loss.**
  - Lifecycle stage, trap type, traps deployed and trap nights are copied from the first row only. A second row with different values loses them.
  - The collector silently defaults to the requester's name.
- **Required fields.** They are the reverse of V-02: the code requires a site, which V-02 makes optional, and does not require a test, which V-02 requires.
- **Save.** The same non-atomic storage, referral and site calls as environmental.
- **Not built.** The V-02 statuses Draft, Received and Processing.

## Changes: environmental

1. Two steps: Enter Order, with the samples table always on, and Sample check, hidden when the environmental acceptance setting is Off. Remove `/label` and redirect it.
2. The shared samples table, with environmental columns (GPS, location details, hold time) and quality control child rows.
3. A whole-step save that includes storage, referral and the sampling-site create. The order save never rewrites an existing site.
4. The footer and the two-level required model:
   - **Save level:** site, requester, at least one sample.
   - **Complete level:** container type, collection method, and collection date and time for each sample.
5. Remove the Print Labels panel. Refer out moves to the sample row, keeping the subcontract and custody fields.
6. Move the environmental container dictionary into Container Types, with environmental categories and preservative as the additive.
7. Never stamp blank dates. Anchor holding time on collection time.
8. Mark environmental spec v2 §5.2 and §5.3 (the three-step wizard) as superseded.

## Changes: vector

1. Enter Order plus optional Sample check. The Complete page becomes the Save and finish confirmation, without the "Cancel" button.
2. The shared samples table with a pool group row; the actions apply to the pool.
3. Store lifecycle stage, trap type, traps deployed and trap nights for each sample. Leave the collector empty rather than defaulting it.
4. Make the required fields match V-02 (site optional, at least one test), and adopt the two levels and the To continue checklist.
5. A whole-step save. Fan-out voids the parent sample instead of deleting it.
6. Map V-02's Draft, Received and Processing onto the shared progress status.
7. Keep container types optional for vector.

## Numbering decision needed

Clinical now numbers samples `-1`, `-2` and aliquots `-1.1` (D-082). Vector pool deconvolution uses `LABNO.X-Y` today. Decide before adoption whether environmental and vector move to the clinical scheme or keep theirs.

## Related tickets

OGC-1051, OGC-1050, OGC-1049, OGC-1060, OGC-1161, OGC-1182, OGC-1192, and the environmental and vector part of OGC-1068.
