# Order Entry — Delivered vs Spec Crosswalk (Clinical · Environmental · Vector)

Companion to `clinical-order-entry-GATES.md`, `order-entry-FRS-v3-three-workflows.md`, `env-vector-order-entry-gaps-and-stories.md`. Feeds epic **OGC-1066**.

**Confidence key:** **[live]** = verified live this session (Clinical). **[infer]** = shared-wizard framework, expected to apply but not yet live-verified on this domain — re-verify. **Status:** Match (delivered = spec) · Drift (delivered ≠ spec, may be intended post-split — confirm) · Non-spec (gate the spec never asked for) · **CRITICAL** (blocking or data-integrity bug).

Note on shape: Clinical = Enter Order → **Collect** → Label & Store → QA Review. Environmental = Enter Order → Label & Store → QA Review (no Collect; sample/collection captured in the Enter-Order manifest). Vector = organism-based order entry → downstream species ID / deconvolution. So Collect-stage findings are clinical-specific; the rest of the framework is shared.

## A. Shared-wizard framework behaviours

| # | Behaviour | Spec | Clinical | Env | Vector | Status & call-out |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| Date | sampleXML sample `date`/`receivedDate` serialized MM/DD/YYYY vs configured DD/MM locale → server 400 + unrecoverable | dates use configured Date locale (Site Information) | **[live] FAILS** on Collect (day > 12) | **[infer]** Env orders **have saved** (Laporan Hasil populated) → likely uses a working path; **re-verify** sample-date serialization | **[infer] re-verify** | **CRITICAL** — fix serialization + bind to field + surface error (OGC-1067). Re-verify Env/Vector explicitly. |
| Qty | Quantity pre-fills `1` (false value) | blank/null; only persist an entered value | **[live]** defaults to 1 | **[infer]** manifest has quantity → likely same | **[infer]** | **CRITICAL — data integrity.** Default 1 writes a false quantity; null is correct, 1 is NOT. Fix once at the manifest/sample control (all domains). |
| Print/Storage | Save & Next blocked until Print All Labels + storage choice | optional; not a gate (LBL-3/NAV-4) | **[live]** gated | **[infer]** same Label & Store stage | (vector storage path — **[infer]**) | **Non-spec** — de-gate; skipping storage needs no click. Applies to all domains with the stage. |
| QA gate | QA checklist hard-blocks Submit | advisory; config-gated (BR-007) | **[live]** hard gate | **[infer]** Env QA Review same | **[infer]** | **Non-spec** — make advisory/config-gated (Samuel's setting). |
| Scroll | Stage loads scrolled to bottom | (load at top) | **[live]** | **[infer]** | **[infer]** | Non-spec UX — load at top. |
| Recover / clean state | Fatal unrecoverable error; stale Site/Provider leak into next order | recoverable; new order blank (XC-1/DSH-5) | **[live]** | **[infer]** | **[infer]** | **CRITICAL/Non-spec** — recoverable validation + reset OrderContext on new order. |
| Error surfacing | Generic "Save failed" hides server fieldError | surface field errors | **[live]** | **[infer]** | **[infer]** | Non-spec — surface the real error. |

## B. Per-domain required fields (vs spec / decisions)

| Field | Clinical | Env | Vector | Call-out |
| :-- | :-- | :-- | :-- | :-- |
| Sample Type + Tests at Enter Order | **[live] required** (forces advance) | **[infer]** | **[infer]** | **Drift vs ORD-1b** — must be **optional pre-population** (Option C). Fix all domains. |
| Site | required ([live], `*`) | required | required (per decision) | Match (Site genuinely needed). |
| Provider/Requester | required ([live]) | requester = Org + contact (≥1) | requester = Org + contact (≥1) | Confirm-intent; capture phone/email (Env/Vector). |
| Program | optional (decided) | optional | optional | Make non-mandatory (G2). |
| Compliance Standard | — | required | — | Match. |
| Collection Method | — | **optional** (decided; build may over-require — confirm) | — | Confirm Env build doesn't gate it. |
| Required-field source | — | — | — | All domains: read from the **legacy Order Entry / Patient Entry config** via the same API; don't hardcode. |

## C. Step-1 → Step-2 linkage (Option C)
- **Clinical:** Enter Order records requested tests (optional pre-pop); Collect derives proposed samples from tests' compatible sample types and the collector finalizes the test↔sample map. Bones exist (Requested Tests / Compatible Sample Types / Sample Assignments). **Primary redesign target.**
- **Env:** no Collect stage — the sample manifest is built at Enter Order; "what to draw" is a field-collection concern, not a phlebotomy step. Call out whether Env needs any collector-confirm step at all (likely not).
- **Vector:** organism/pool-based; the linkage concept maps to pool composition, not phlebotomy. Confirm scope — likely out of the Option-C clinical redesign.

## What to call out (summary for the epic)
1. **Two CRITICAL bugs to fix across the framework:** the sampleXML date serialization (save-blocker + unrecoverable) and the quantity-default-of-1 (data integrity). Both in OGC-1067; re-verify on Env/Vector.
2. **Resolve all non-spec gates** (print/storage, QA hard-gate, sample/tests-required, scroll, error-swallowing) — none are in the spec; bring the build back to spec.
3. **Per-domain required fields** are config-driven; only the per-domain decisions above differ — confirm Env Collection-Method and the Env/Vector Org-vs-contact requirement.
4. **Option-C linkage is essentially a clinical redesign**; Env/Vector likely don't need the collector-confirm step — confirm and scope out to keep it finishable.
5. **Re-verify Env + Vector live** for the shared-framework items (blocked behind the date bug if it affects them; test on a day ≤ 12 or after OGC-1067).
