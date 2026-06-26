# Result & Validation v4 — Story Breakdown (PR-sized slices)

**Slicing rule (Claude Code pipeline):** one branch → one PR → one review per slice. Fewer, larger-but-coherent vertical slices, **dependency-ordered**, each independently shippable, each with machine-checkable acceptance criteria. Cross-cutting work (i18n keys, audit, permissions, cross-domain rendering) rolls *into* the functional slice, not separate stories. Points are a rough size only — the real unit is "a PR a reviewer can read in one sitting."

**Source:** `results-entry-v4-frs.md`, `validation-page-v4-frs.md`, `results-validation-config-v4-frs.md`, decisions D1–D22, dependency map `results-validation-v4-dependency-map.html`.

**Build order across surfaces:** **Configuration first** (foundational — supplies policy + flags + settings), then the **dependency-light** slices of Results Entry and Validation, then the **gated** (red-node) slices last, gray-stated until their dependency lands.

**Legend:** 🟢 ready (no unbuilt dependency) · 🔴 gated (waits on an unbuilt dependency, per the dependency map).

---

## Surface 1 — Result & Validation Configuration (OGC-343) · ship first

| # | Slice (PR) | Pts | Covers | Cross-cutting in this PR |
|---|---|---|---|---|
| C1 🟢 | **Validation policy core** — `validation_config` + `validation_level_config` schema, `Analysis` snapshot cols + status enum, lab-wide default panel (trigger + 0–5 levels + role selects), auto-validation at result-save, migration from the binary toggle, `useMultiLevelValidation` flag | 8 | FR-A1, A3, A4, F2 | audit (CONFIG_*, AUTO_VALIDATE), Envers on new tables, Admin perm |
| C2 🟢 | **Per-lab-unit overrides + preview** — override table (domain badge, inline edit, add, delete-revert with snapshot semantics), effective-config preview, summary banner, plain-terms policy sentence + stepper guidance | 5 | FR-A2, F1 | i18n keys, stale-page guard |
| C3 🟢 | **Consolidate result-entry settings + retire old page** — migrate the 13 legacy settings into grouped plain-language toggles (Result entry / Modification-rejection-retest / Release & display / Access & PII), the two new flags (bulk-release, retest-note), old-route **redirect** | 5 | FR-B1, C1, D1, E1, F3 | i18n relabels, audit on each toggle change |

*Note:* verify `validateTechnicalRejection` and `restrictFreeTextMethodEntry` behavior before C3's labels freeze (flagged in FRS).

---

## Surface 2 — Results Entry (OGC-811) · depends on Configuration

| # | Slice (PR) | Pts | Covers | Notes |
|---|---|---|---|---|
| R1 🟢 | **Worklist + polymorphic result cell + edit-state machine + cross-domain rendering** — `/Results` route consolidation, filters/Lab-Unit/status chips, numeric/dictionary/multi cell, read-only→Edit→Save per row, Clinical/Env/Vector rendering driven by Lab Unit | 8 | FR-A1–A5, M1–M4 | route consolidation behind a flag; i18n `.env`/`.vector` |
| R2 🟢 | **Expanded panel hierarchy** — work zone + reference zone (compact context strip, collapsed-but-summarized, **sticky layout** browser-local), **Method/Analyzer split**, dilution factor, **dual-axis notes** | 8 | FR-B1–B3, C1–C5, D5, J1–J2 | reads `Analysis.method`/`analyzerId`; Notes audit |
| R3 🟢 | **This-analysis History + contrast + critical handling** — inline paginated history (revisions/status/retests/corrections/notes/audit), icon+Tag AA flags, critical-value banner + Alerts ack (no Save gate) | 5 | FR-E1, H1, L1–L2 | Alerts integration (existing) |
| R4 🟢 | **Reject (inline NCE) + Refer-out + Aliquoting** — pull `InlineNceForm`; "Refer this test" inline form → Referral subsystem; in-view aliquoting (reuse existing fn) | 5 | FR-E1–E3, F1–F3, I1–I2 | gated by `allowResultRejection`; NCE/Referral modules exist |
| R5 🔴 | **Reagent capture (v2.1 model)** — per-test reagent list / FIFO lots / quantity-used / `ReagentConsumptionEvent`; v1 free-form picker fallback | 8 | FR-D1–D2 | **gated:** Test Catalog→Method→Reagent linkage |
| R6 🔴 | **Control capture + QC-fail signal** — RDT control line / manual QC value+expected+uncertainty+Pass/Fail | 5 | FR-D3–D4 | **gated:** manual/RDT control persistence (shared with Validation V-QC) |
| R7 🔴 | **Sample partial-use + disposal; interpretation rule buckets** — remaining-volume tracking, mark used-up→disposal; rule-driven interpretation buckets (macro + free-text ship in R2; rule buckets here) | 5 | FR-K1–K2, G1 | **gated:** SampleItem volume + disposal hand-off + per-test interp config |

---

## Surface 3 — Validation (OGC-817) · depends on Configuration + Results Entry

| # | Slice (PR) | Pts | Covers | Notes |
|---|---|---|---|---|
| V1 🟢 | **Triage queue + lanes + "Check before release" + filters** — queue with signals (NCE / Modified / Ack pending / Nonconforming), filter chips + counts, computed Clear vs Needs-review lanes (**fail-safe**), Method/Analyzer in panel not table | 8 | FR-A1–A4, B1, I1 | QC-fail chip lands with R6's dependency |
| V2 🟢 | **Review panel + per-row actions** — read-only review summary (Method/Analyzer split), Validate & release (e-sig), Modify (reason/role), this-analysis History, read-only reagent/QC review, dual-axis validation notes | 8 | FR-C1–C3, D1, D4–D6, E1, F1, G1 | e-signature module; `modify results role` |
| V3 🟢 | **Guarded bulk release** — "Release all clear (N)" over the Clear lane, scannable confirm list, one e-signature, admin bulk-release flag wiring | 5 | FR-B2–B4 | reads Configuration flag |
| V4 🟢 | **Reject-via-NCE + send-for-retest + concurrency** — reject opens inline NCE; retest note (required-ness per admin flag); stale-page guard; auto-validated view | 5 | FR-D2–D3, J1 | retest-note flag from Configuration |

---

## Coverage check
- Every FR across the three FRSs maps to at least one slice above ✅
- Every dependency-gated feature is isolated in its own 🔴 slice, sequenced after its dependency ✅
- Cross-cutting (i18n, audit, Envers, permissions, cross-domain) rolled into functional slices ✅
- v1-shippable thin slices first (C1, R1, V1 are each usable on their own) ✅
- Shared dependency: **manual/RDT control persistence** unblocks both R6 and the V1 QC-fail chip — build once.

## Sequencing summary
1. **C1 → C2 → C3** (Configuration) — unblocks everything.
2. **R1 → R2 → R3 → R4** and **V1 → V2 → V3 → V4** (ready slices) — can run largely in parallel once C1 lands; V-slices consume R data.
3. **R5, R6, R7** (gated) — schedule when their dependencies land; gray-state in the meantime.

## Created in Jira (2026-06-10)

New Epic **OGC-1016** — *Result & Validation Configuration (v4 consolidated)* — created for the config surface, linked (Relates) to OGC-343 (design) + OGC-579 (impl). All slices created as Stories, parented to their Epic, labelled `v4` + slice id (gated slices also `blocked`).

| Slice | Key | Parent Epic | State |
|---|---|---|---|
| C1 Validation policy core | OGC-1017 | OGC-1016 | 🟢 |
| C2 Per-unit overrides + preview | OGC-1018 | OGC-1016 | 🟢 |
| C3 Consolidate settings + retire old page | OGC-1019 | OGC-1016 | 🟢 |
| R1 Worklist + cell + edit-state + cross-domain | OGC-1020 | OGC-811 | 🟢 |
| R2 Expanded panel + Method/Analyzer + notes | OGC-1021 | OGC-811 | 🟢 |
| R3 This-analysis History + contrast + critical | OGC-1022 | OGC-811 | 🟢 |
| R4 Reject (NCE) + refer-out + aliquoting | OGC-1023 | OGC-811 | 🟢 |
| R5 Reagent capture (v2.1) | OGC-1024 | OGC-811 | 🔴 blocked |
| R6 Control capture + QC-fail signal | OGC-1025 | OGC-811 | 🔴 blocked |
| R7 Sample partial-use + disposal + interp rules | OGC-1026 | OGC-811 | 🔴 blocked |
| V1 Triage queue + lanes + signals + filters | OGC-1027 | OGC-817 | 🟢 |
| V2 Review panel + actions + history + notes | OGC-1028 | OGC-817 | 🟢 |
| V3 Guarded "Release all clear" | OGC-1029 | OGC-817 | 🟢 |
| V4 Reject-via-NCE + retest + concurrency | OGC-1030 | OGC-817 | 🟢 |

15 issues total (1 Epic + 14 Stories). All in Backlog. Story points were intentionally not set — the unit is "one reviewable PR" per slice, not points.
