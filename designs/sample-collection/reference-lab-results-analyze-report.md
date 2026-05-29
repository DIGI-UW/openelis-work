# /analyze Quality Report — Reference Lab Results

**Date:** 2026-05-28
**Artifacts reviewed:**
- `referral-redesign-brainstorm.md`
- `referral-redesign-frs.md`
- `referral-redesign-mockup.jsx`
- `referral-redesign-preview.html`

---

## Summary

Overall quality is solid for a first-pass FRS+mockup+preview bundle. The state model, IA placement, and Box-system integration are coherent. The Lab Context section is plain-English and ~90-second readable. No constitution MUSTs are violated. **Three CRITICAL i18n gaps** in the mockup need fixing before `/breakdown`. **One MEDIUM** finding on the spec needs a one-paragraph clarification (FHIR DiagnosticReport-vs-Result rendering). Everything else is LOW polish.

---

## Findings

| ID | Pass | Location | Issue | Severity | Fix |
|---|---|---|---|---|---|
| F-01 | A (i18n) | mockup.jsx · `TableContainer title="Outstanding referrals" description="…"` (and equivalents in ReturnedTable, HistoryTable) | Table titles and descriptions hardcoded in JSX, not in Localization table | **CRITICAL** | Wrap as `t('referral.table.outstanding.title', 'Outstanding referrals')` etc. Add 6 keys to §7 |
| F-02 | A (i18n) | mockup.jsx · ExpandPanel sub-headings ("Status detail", "Outcome detail", "Result") | Hardcoded strings | **CRITICAL** | Wrap each + add keys |
| F-03 | A (i18n) | mockup.jsx · OverflowMenuItem text ("Reject…", "Open in Result Entry"), button text ("Accept", "Accept to Analysis") | Hardcoded strings | **CRITICAL** | Wrap + verify already-listed keys in §7 cover them |
| F-04 | A (i18n) | FRS §7 Localization table | Missing keys: 6 table titles/descriptions, 3 expand-panel sub-headings, 2 OverflowMenuItem labels, 5 result-card labels ("Reference range:", "Test", "Value", "Units", "Notes") | HIGH | Add 16 keys |
| F-05 | G (invented data) | FRS §4.6 result-card display fields (`results[].range`, `results[].flag`, `results[].notes`) | These come from inbound FHIR `DiagnosticReport.Observation` resources, not the existing OpenELIS `Result` entity. Spec doesn't clarify the data source for the rendering — is this a transient view of DiagnosticReport JSON, or do we persist these fields somewhere before Accept? | MEDIUM | Add §4.6.1 "Returned-result data source: rendered directly from `DiagnosticReport.Observation` resources stored in the FHIR persistence layer; not persisted to a separate table. The Accept action persists into the standard `Result` entity by mapping Observation → Result." |
| F-06 | N (Lab Context) | FRS §1.1 | "FHIR" used without first-use expansion | LOW | "FHIR (Fast Healthcare Interoperability Resources)" on first use |
| F-07 | C (Carbon fidelity) | mockup.jsx · MetricTile component | Uses raw `<button>` with inline `borderLeft` instead of Carbon `Tile`. Justified — Carbon `Tile` doesn't have a thick-left-border variant; the deployed Sample Shipment dashboard uses the same custom pattern. Document the deviation. | LOW | Add comment block in JSX noting the lifted pattern from `/SampleShipment/dashboard` |
| F-08 | C (Carbon fidelity) | mockup.jsx · FilterChip component | Carbon `ChipSet` is not used (custom button group instead). Justified — Carbon `ChipSet` API is filter-pill style and works fine, but the lift target is to keep visual consistency with the empty/filter-chip patterns in the deployed app. Acceptable as long as accessibility (Tab navigation, ARIA `role="tablist"` NO — that would imply tabs; use `role="radiogroup"` with `aria-checked` per chip) is documented. | LOW | Add ARIA attributes to FilterChip in mockup; document in FRS NFR-2 |
| F-09 | E (coverage) | FR-INT-001 (Box-to-Referral back link section on Box detail page) | Not shown in mockup. Reasonable since the mockup is for the new Reference Lab Results page, and the back link lives on the existing Sample Shipment Box detail. Flag as a separate story in `/breakdown`. | LOW | No change — capture as a separate dependency story |
| F-10 | E (coverage) | FR-OE-001 (Order Entry Step 3 hook) | Not shown in mockup. Lives on the OGC-605 Order Entry wizard, not this surface. | LOW | No change — capture as dependency on OGC-605 |
| F-11 | E (coverage) | FR-INT-002 (Reconciliation gate on Box state) | Not shown in mockup. Lives on the existing Box state-transition UI. | LOW | No change — capture as a small dependency story |
| F-12 | B (Carbon fidelity) | mockup.jsx · expand panel "Mark Lost" button | Uses `kind="ghost"` with `renderIcon={WarningAlt}`. The deployed Sample Shipment doesn't have a "Mark Lost" precedent to reference. Pattern is fine but worth a screenshot review once built. | LOW | No change |
| F-13 | K (audit) | FRS §8.2 | `REFERRAL_LOST_REVERSED` listed but no UI surface in this FRS to invoke it (admin-only reverse). Either declare the admin UI as out-of-scope for this FRS or remove the verb. | LOW | Add to §9 Non-goals: "Admin UI to reverse a Lost referral — separate Sample Shipment admin work." Keep the verb in case the existing Sample Shipment admin already triggers it. |
| F-14 | F (cross-module harmonization) | FRS §4.4 Outstanding view, mockup display | "Days outstanding" uses 7/30 thresholds that match the Unassigned Samples aging convention (also 7/30 per the Box FRS §5.7 BR-029). Good harmonization. | — | No issue; documented for traceability |
| F-15 | I (stubbed preview) | preview.html · all three views | All views populated with realistic mock data. Activity logs realistic. Modals populated. NO stubs detected. ✓ | — | No issue |
| F-16 | H (multitenancy) | All artifacts | No Lab selector, Site filter, or tenant dropdown anywhere. Reference Lab is a destination Organization, not a tenant. ✓ | — | No issue |
| F-17 | J (permissions) | FRS §2.5, §8.1 | No invented per-action permission keys. Attaches to existing role bundles (Validator, Lab Manager, Analyst, Reception, Provider, Admin). ✓ | — | No issue |
| F-18 | L (Envers) | FRS §8.3 | No new entities; existing `@Audited` on `Referral` covers new columns. ✓ | — | No issue |
| F-19 | A (i18n) | mockup.jsx · `Outstanding referrals`, `${rows.length} referrals at reference labs awaiting results` description | Pluralization not handled (would read "1 referrals" with one row). Use ICU plural format or conditional. | MEDIUM | Use `t('referral.table.outstanding.desc', '{N} referrals at reference labs awaiting results', { N: rows.length })` with a fallback that handles plural |
| F-20 | E (coverage) | FRS §11 Open question 2 (multi-test Accept) | Spec leaves "per-test or all-or-nothing" undecided. This needs resolution before `/breakdown` because it affects v1 story estimation. | MEDIUM | Decide in next iteration; recommend per-test with a summary confirmation |
| F-21 | E (coverage) | FRS §11 Open question 3 (re-refer after Reject UX) | Affects FR-RETURNED-003 follow-through. Recommended yes; mockup currently doesn't surface the "re-refer?" prompt. | MEDIUM | Mockup the re-refer prompt as a Carbon `InlineNotification kind="info"` with a button on the original Analysis page (lives outside this FRS but worth a sketch) |

---

## Constitution check

No CRITICAL constitution violations.
- Principle 1 (i18n): mockup is mostly compliant but has 3 CRITICAL hardcoded-string gaps (F-01, F-02, F-03). Localization table is well-organized but missing 16 keys (F-04).
- Principle 2 (Carbon fidelity): two justified deviations (F-07, F-08) lifted from the deployed Sample Shipment UI; both documented.
- Principle 3 (interaction patterns): inline row expansion used, modals only for destructive confirmations. ✓
- Principle 4 (permissions): no invented per-action keys, existing role bundles attached. ✓
- Principle 5 (data reuse): all UI elements trace to real schema. One MEDIUM clarification needed on DiagnosticReport-vs-Result data source (F-05).
- Principle 6 (no multitenancy): clean. ✓
- Principle 7 (design brief): produced in brainstorm v2. ✓

---

## Recommended fix order

**Before `/breakdown` (CRITICAL):**
1. F-01, F-02, F-03 — wrap hardcoded strings in `t()`
2. F-04 — add 16 missing i18n keys to §7 of FRS

**Before build (HIGH/MEDIUM):**
3. F-05 — one paragraph in FRS §4.6.1 on DiagnosticReport-vs-Result rendering
4. F-19 — fix pluralization in table descriptions
5. F-20 — decide multi-test Accept behavior (per-test recommended)
6. F-21 — sketch the re-refer prompt on Analysis page (out-of-scope surface; just a note)

**LOW polish (can defer):**
7. F-06 — expand FHIR on first use
8. F-07, F-08 — document the Carbon deviations
9. F-13 — add Lost-reversal to §9 Non-goals

---

## Ready for `/breakdown`?

**After fixing F-01 through F-04**, yes. The CRITICAL findings are mechanical i18n cleanup — about 15 minutes of edits.

The MEDIUM findings are policy questions that can be answered during `/breakdown` Stage 1 or in the first build sprint without blocking story creation.
