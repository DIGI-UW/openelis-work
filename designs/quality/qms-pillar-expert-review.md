# QMS Pillar Expert Review — Open Questions

**To:** Subject-matter reviewer (QA / accreditation / quality systems)
**From:** Casey Iiams-Hauser
**Date:** 2026-04-23
**Reading time:** ~12 minutes
**Response format:** Inline answers + any "I'd push back on" notes
**Question count:** 0 remaining (all 15 resolved internally 2026-04-23 — see breakdown at bottom). This doc is preserved as a record of how the questions were settled. **No expert review needed at this time.**

---

## Context

We're designing the **QMS & Improvement** pillar for the new OpenELIS Quality Assurance menu. Three Sprint 3 leaf pages are specified at outline level:

1. **CAPA Register** — single view of all CAPAs across all NCEs
2. **Electronic Signature Log** — filterable log of every e-signature event
3. **Accreditation Status** — single-site rollup against ISO 15189:2022 + CAP COM + CAP GEN

Each outline includes scope, layout, data sources, permissions, and acceptance criteria — but each also has a handful of decisions where we'd benefit from a domain expert's reaction before we lock the FRS. That's what this doc is.

For each question below: a one-paragraph framing, our current recommendation, and the specific ask. Please react / agree / disagree / push back. Concrete examples from labs you've worked with are especially useful where you have them.

The full outlines are available in the OpenELIS Feature Design folder if you want context — but you should be able to answer these without reading them.

---

## A. CAPA Register (3 questions)

### A1. Lab-configurable "Completed (last N days)" tile window?

The page has a summary tile that counts CAPAs completed in the last 90 days as a quick "are we keeping up?" indicator.

- **Recommendation:** keep at 90 days for v1; lab-configurable in v2 if customers ask.
- **Ask:** is 90 days a sensible default for a clinical lab's QA review cadence, or should it be a different number? Should it be configurable from day one?

### A2. Effectiveness-review surfacing on this page

The CAPA Register's row expansion shows whether the parent NCE has had its effectiveness review (Pending / Due / Effective / Not Effective). Some labs may want a dedicated "Pending Effectiveness Review" tile or filter on this page, equivalent to the NCE Dashboard's Pending Verification view.

- **Recommendation:** **don't duplicate.** Effectiveness review is an NCE-level concern (one review per NCE, regardless of how many CAPAs it has). Labs go to the NCE Dashboard's "Pending Verification" view for that workflow. The CAPA Register's row expansion just *links* to the review when it exists.
- **Ask:** does the QA Officer's mental model of effectiveness review map to the NCE or to the CAPA? If it's CAPA-shaped in practice, our recommendation is wrong.

### A3. Bulk Mark-Complete UX — shared resolution note?

When a QA Officer needs to mark several CAPAs complete at once (a single training session that satisfied 5 Training-category CAPAs across NCEs, for example), the UX could use a single shared resolution note OR force per-CAPA notes within the bulk flow.

- **Recommendation:** **single shared note** in v1 (with a clear warning banner: "This note applies to all {N} selected CAPAs"); per-CAPA notes in v2 if labs ask.
- **Ask:** in your experience, do auditors / inspectors accept a shared note for "one training, multiple records?" Or is per-CAPA documentation expected even when the action is genuinely shared?

### ~~A4. CAPAs orphaned by a Closed-Recurrence NCE~~ — **resolved internally 2026-04-23**

Original CAPAs stay linked to the original NCE; the new (recurrence-linked) NCE gets its own CAPAs. "Linked-recurrence" badge on the original parent NCE column.

---

## B. Electronic Signature Log (2 questions)

### ~~B1. Schema audit~~ — **resolved via code audit 2026-04-23**

The four assumed audit tables don't exist. OpenELIS already has a unified `electronic_signature` table with `record_type` discriminator. Endpoint effort drops from ~6-8h to ~2-3h.

### ~~B2. IP / user-agent capture~~ — **resolved via code audit 2026-04-23**

`client_ip` and `user_agent` already captured by `electronic_signature`. No migration needed.

### ~~B3. Bulk-action signatures — N rows or 1 row?~~ — **resolved internally 2026-04-23**

5 rows, one per attested artifact. Every signature is its own attested event for inspection; reason text repeats fine.

### B4. Non-OpenELIS user signatures (API-driven)

Some labs have external systems pushing signatures via API (e.g., a connected EHR validating a result, an HL7 interface releasing a result). How should those signatures appear in the log?

- **Recommendation:** signer field shows the API client name with `(via API)` suffix; reason captured from the API call. This isn't in v1 MVP scope but is worth deciding the spec for v2.
- **Ask:** for labs you've worked with, do auditors accept "the EHR signed it" as equivalent to a human signature, or do they want the human signer's identity propagated through the API call?

### B5. Retention policy

How long should signature log entries be retained? Some regulations require 7 years (HIPAA), others longer (some states require 10 years or more for certain record types). Some inspectors want indefinite retention.

- **Recommendation:** **unlimited retention by default** in v1 (storage is cheap; deleting signed-record evidence is risky); make retention configurable in v2 if customers need policy enforcement (e.g., GDPR right-to-erasure pressure).
- **Ask:** are there jurisdictions you serve where unlimited retention causes a compliance problem (vs. a benefit)? GDPR is the obvious one; anything else?

---

## C. Accreditation Status — **page redesigned 2026-04-23**

The earlier draft for this page (clause-by-clause evidence rollup, mapped to ISO 15189 + CAP COM/GEN checklists) was **redirected to a self-attestation model**. The page is now a registry of accreditations the lab claims (with optional certificate uploads + date-driven status pills), plus a thin QA-evidence-at-a-glance section pointing to existing surfaces. No clause mappings, no auto-verification, no Outstanding/Met logic.

This collapses C1–C6 entirely. See `accreditation-status-outline.md` v0.2 for the new design. **No domain-expert input needed for Accreditation Status.**

---

## What we'd love back

For each question:
- **Agree** / **disagree, suggest X** / **need more context**
- For C1: a yes/no on whether you (or someone you know) can review the starter ISO 15189 mapping.
- Anything else you think we're missing — these specs cover what we've thought of, not necessarily what you've seen go wrong.

If easier, a 30-minute call works. We'd queue your written reactions either way and bring them into the Sprint 3 FRS finalization.

Thanks.

— Casey
