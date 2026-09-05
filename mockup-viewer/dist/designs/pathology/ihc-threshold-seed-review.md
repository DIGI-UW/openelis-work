# IHC Interpretive Threshold Sets — Seed Content for Review

**Reviewer:** Casey (product sign-off standing in for clinical sign-off — noted as such in the handoff)
**Purpose:** every threshold value the IHC FRS proposes to seed, with its source, edition, date and a URL, so each row can be checked without reading the FRS.
**Status:** unreviewed. Nothing here ships until the Sign-off column is filled.

Confidence key: **VERIFIED** = fetched from a primary or authoritative secondary source, URL below · **PARTIAL** = secondary source or older edition · **NOT VERIFIED** = could not confirm; deliberately left empty rather than invented.

---

## Set 1 — `HER2_IHC_2023`

**Source:** ASCO/CAP HER2 Testing in Breast Cancer, Guideline Update, published online 7 June 2023 (*JCO* 10.1200/JCO.22.02864). The 2023 update **confirmed the 2018 focused-update criteria without changing them**, so these values are current.
**Effective:** 2023-06-07 · **Confidence:** VERIFIED

| Score | Criterion | Sign-off |
|---|---|---|
| `3+` | Complete, intense circumferential membrane staining in **> 10%** of tumour cells | ☐ |
| `2+` | Weak-to-moderate **complete** membrane staining in **> 10%** of tumour cells | ☐ |
| `1+` | **Incomplete**, faint or barely perceptible membrane staining in **> 10%** of tumour cells | ☐ |
| `0` | No staining observed | ☐ |

**Two design consequences to confirm alongside the numbers:**

| Item | Proposal | Sign-off |
|---|---|---|
| 0 and 1+ stored as distinct, non-collapsible values | Required — trastuzumab deruxtecan is indicated at IHC 1+ and at 2+/ISH-negative, so the distinction is therapy-determining | ☐ |
| "HER2-low" | **Not** an ASCO/CAP category — their 2023 panel explicitly declined to create one. ESMO's 2023 consensus does use the term. Proposal: configurable threshold-set vocabulary, off by default, underlying stored value stays the 0/1+/2+/3+ score | ☐ |

---

## Set 2 — `HER2_ISH_2023`

**Source:** ASCO/CAP 2018 focused update (*JCO* 10.1200/JCO.2018.77.8738), confirmed unchanged by the 2023 update. Corroborated against the CAP HER2 Breast Update Algorithms 2023 PDF and CAP Breast Biomarker template v1.6.0.0.
**Effective:** 2023-06-07 · **Confidence:** VERIFIED

| Group | HER2/CEP17 ratio | Average HER2 signals per cell | Result | Sign-off |
|---|---|---|---|---|
| 1 | ≥ 2.0 | ≥ 4.0 | **Positive** | ☐ |
| 2 | ≥ 2.0 | < 4.0 | Requires concurrent IHC review | ☐ |
| 3 | < 2.0 | ≥ 6.0 | Requires concurrent IHC review | ☐ |
| 4 | < 2.0 | ≥ 4.0 and < 6.0 | Requires concurrent IHC review | ☐ |
| 5 | < 2.0 | < 4.0 | **Negative** | ☐ |

| Item | Proposal | Sign-off |
|---|---|---|
| No ISH "equivocal" category | The 2018 update **abolished** it. Groups 2, 3 and 4 route to concurrent IHC review, not to "retest with an alternate assay". The December 2025 design still has the pre-2018 equivocal branch | ☐ |

*One caution on my own sourcing: one extraction from the CAP algorithms PDF mis-stated Group 2's signal threshold. The value in the table above (`≥ 2.0` ratio with `< 4.0` signals) is the one corroborated by two independent sources and is what I believe correct — but it is the single row I would most want a second pair of eyes on.*

---

## Set 3 — `ER_PGR_2020`

**Source:** ASCO/CAP Guideline Update, published January 2020 (*JCO* 10.1200/JCO.19.02309; print May 2020). No newer edition found.
**Effective:** 2020-01-13 · **Confidence:** VERIFIED

| Category | Criterion | Sign-off |
|---|---|---|
| Positive | **1% – 100%** of tumour nuclei staining | ☐ |
| **Low positive** | **1% – 10%** — carries a **mandatory reporting comment** | ☐ |
| Negative | 0 or **< 1%** | ☐ |

**Mandatory comment text** (threshold-set content, rendered into the report, not editable away — the pathologist may add to it):

> "1–10% staining is reported as low positive. There are limited data on endocrine responsiveness in this range."

| Item | Proposal | Sign-off |
|---|---|---|
| Comment wording above | Paraphrases the guideline's requirement rather than quoting it. Reword freely — the requirement is that a qualifying comment appears, not this exact sentence | ☐ |
| Internal control status required for all 0–10% results | Required by the guideline. The screen will not mark the marker complete without it | ☐ |
| Allred as **optional supplementary score only** | In CAP's Breast Biomarker template v1.6.0.0 (March 2025), percentage and intensity are the *required* elements and Allred appears only as an "Alternative Scoring System Score". The December 2025 design makes Allred the primary derivation, which inverts this | ☐ |

---

## Set 4 — `KI67_IKWG_2021`

**Source:** International Ki-67 in Breast Cancer Working Group updated recommendations, 2021 (Nishimura / Nielsen et al., *JNCI* 113:808).
**Effective:** 2021-07-01 · **Confidence:** VERIFIED

| Band | Criterion | Actionable? | Sign-off |
|---|---|---|---|
| Low | **≤ 5%** | Yes | ☐ |
| Indeterminate | **> 5% and < 30%** | **No** — the guideline states concordance in this range "was less than acceptable" | ☐ |
| High | **≥ 30%** | Yes | ☐ |

**This is the set that most changes current behaviour, so it deserves the most scrutiny.**

| Item | Note | Sign-off |
|---|---|---|
| Retiring the hardcoded 20% cutpoint | 20% sits inside the band IKWG explicitly rejected. Its one regulatory anchor — the companion-diagnostic requirement on adjuvant abemaciclib — **was removed by the FDA in March 2023** | ☐ |
| Reporting an indeterminate result as indeterminate | The raw percentage is reported prominently as the durable observation; the band is the interpretation | ☐ |
| Endorsed use is narrow | IKWG endorses Ki-67 for prognosis in **stage I–II, ER+/HER2−** disease, to decide whether adjuvant chemotherapy can be avoided. Not endorsed for chemo-response prediction or routine neoadjuvant monitoring. Should the threshold set be scoped to that context, or applied generally with a note? **This is an open question, not a proposal** | ☐ |
| ESMO / St Gallen / WHO positions | **PARTIAL** — not directly verified. St Gallen historically used Ki-67 for luminal A/B separation without a fixed consensus cutpoint; I did not confirm current wording and have asserted no numbers from it | ☐ |

---

## Set 5 — `KI67_LEGACY_20` (deprecated, seeded deliberately)

**Proposal:** ship the legacy single-20% cutpoint as an explicitly **deprecated** set rather than deleting it, so that a site currently reporting against it can read back historical results under the rules those results were issued under. A deprecated set can be read but **cannot be applied to a new result**.

| Item | Sign-off |
|---|---|
| Ship a deprecated legacy set at all, rather than only the current one | ☐ |
| Deprecation note: "Local protocol — single 20% cutpoint. Regulatory anchor withdrawn by FDA, March 2023." | ☐ |

---

## Set 6 — `PD_L1_*` (partially seeded)

**Confidence:** VERIFIED for the rows below, from a 2025 review (*Front Oncol* 10.3389/fonc.2025.1581275). This is the set that justifies the composite key, because the cutoffs are **explicitly not interchangeable** across assays and scoring systems.

| Drug / indication | Assay (clone) | Scoring | Cutoff | Sign-off |
|---|---|---|---|---|
| Pembrolizumab, NSCLC | 22C3 | TPS | ≥ 50% or ≥ 1% (by line of therapy) | ☐ |
| Nivolumab + ipilimumab | 28-8 | TC | ≥ 1% | ☐ |
| Atezolizumab | SP142 | TC **or** IC | TC ≥ 50% **or** IC ≥ 10% | ☐ |
| Cemiplimab | 22C3 / SP263 | TPS / TC | TPS ≥ 50% or TC ≥ 50% | ☐ |

CPS thresholds elsewhere range **≥ 1 to ≥ 20** by indication and were **not** individually verified — deliberately not seeded.

| Item | Proposal | Sign-off |
|---|---|---|
| Seed only the four rows above; leave CPS-based indications empty | ☐ |
| Whether PD-L1 is in scope for the first IHC release at all | Open question — it may be cleaner to ship the mechanism with breast markers only | ☐ |

---

## Set 7 — `MMR_MSI` (named, deliberately empty)

**Source exists:** CAP guideline "Mismatch Repair and Microsatellite Instability Testing for Immune Checkpoint Inhibitor Therapy", October 2022, ASCO-endorsed (*JCO* 10.1200/JCO.22.02462). Six recommendations plus three good-practice statements, covering colorectal, endometrial, gastroesophageal, small bowel and other tumours.

**Specific loci counts and percentage-unstable thresholds: NOT VERIFIED.** Seeded empty. Inventing them would be worse than leaving the lab to author its own from the guideline.

| Item | Sign-off |
|---|---|
| Ship the set named but empty, with a link to the guideline | ☐ |

---

## Cross-cutting decisions to confirm

| # | Decision | Sign-off |
|---|---|---|
| 1 | **Freeze at report, apply forward.** A threshold set's identity is written onto a result when entered; a later edition does not re-interpret a signed-out result. **This is our decision, not a cited requirement** — I could find no published rule on retrospective re-interpretation in either CAP's breakpoint FAQs or CLSI's implementation toolkit. The nearest analogue is the antimicrobial "breakpoints in use" practice of naming source and publication year and applying new editions prospectively | ☐ |
| 2 | **No therapy-eligibility statements.** The screen reports categories; the December 2025 design's "Patient eligible for HER2-targeted therapy" is removed and not replaced | ☐ |
| 3 | **Composite key.** `(marker, clone, assay/platform, scoring system, tumour type, drug or indication)` | ☐ |
| 4 | **No fallback.** A key combination with no matching set records the raw measurement and reports "Not interpreted", rather than applying a neighbouring set | ☐ |
| 5 | **Override permitted, reasoned, audited.** A pathologist may override a derived category; the raw value and the set that would have applied are both retained | ☐ |
| 6 | **What is stored per result:** raw measurement · clone · assay/platform · regulatory status · scoring method · threshold-set identity · derived category · control status · pre-analytic times. CAP requires the clone or probe and the scoring method on a predictive-marker report | ☐ |
| 7 | **Molecular subtype (Luminal A/B, HER2-enriched, triple-negative) stays parked.** Contested cutpoints, no single guideline owner. If it returns it must be threshold-set driven like everything else | ☐ |

---

## Sources

- [CAP — HER2 Testing in Breast Cancer (current guideline)](https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/recommendations-for-human-epidermal-growth-factor-2-testing-in-breast-cancer)
- [CAP — HER2 2023 Guideline Update](https://www.cap.org/cap-guidelines/her2-testing-in-breast-cancer-2023-guideline-update/)
- [CAP — HER2 Breast Update Algorithms 2023 (PDF)](https://documents.cap.org/documents/her2_breast_update_algorithms_2023.pdf)
- [JCO 2023 HER2 update — 10.1200/JCO.22.02864](https://ascopubs.org/doi/10.1200/JCO.22.02864)
- [JCO 2018 HER2 focused update — 10.1200/JCO.2018.77.8738](https://ascopubs.org/doi/10.1200/JCO.2018.77.8738)
- [ASCO Post — 2023 update confirms prior HER2 recommendations](https://ascopost.com/issues/july-25-2023/asco-cap-guideline-update-confirms-previous-recommendations-for-her2-testing-in-breast-cancer/)
- [CAP — ER/PgR Testing Guideline Update](https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/guideline-recommendations-for-immunohistochemical-testing-of-estrogen-and-progesterone-receptors-in-breast-cancer)
- [JCO 2020 ER/PgR update — 10.1200/JCO.19.02309](https://ascopubs.org/doi/10.1200/JCO.19.02309)
- [CAP Breast Biomarker Reporting Template v1.6.0.0, March 2025 (PDF)](https://documents.cap.org/documents/New-Cancer-Protocols-March-2025/Breast.Bmk_1.6.0.0.REL.CAPCP.pdf)
- [IKWG 2021 — Assessment of Ki67 in Breast Cancer, JNCI 113:808](https://academic.oup.com/jnci/article/113/7/808/6053794)
- [ASCO Post — FDA removes Ki-67 requirement from abemaciclib indication, March 2023](https://ascopost.com/news/march-2023/fda-expands-early-breast-cancer-indication-for-abemaciclib-plus-endocrine-therapy/)
- [Front Oncol 2025 — PD-L1 assays, scoring systems and cutoffs review](https://www.frontiersin.org/journals/oncology/articles/10.3389/fonc.2025.1581275/full)
- [CAP — MMR/MSI Testing for ICI Therapy, October 2022](https://www.cap.org/protocols-and-guidelines/cap-guidelines/current-cap-guidelines/mismatch-repair-and-microsatellite-instability-testing-for-immune-checkpoint-inhibitor-therapy)
- [ASCO endorsement of the CAP MMR/MSI guideline — 10.1200/JCO.22.02462](https://ascopubs.org/doi/10.1200/JCO.22.02462)
- [CAP — Breakpoint Assessment FAQs, MIC.11380 / MIC.11385 (PDF)](https://documents-cloud.cap.org/capprd-ccs-acc-resources/Breakpoint%20FAQs%20MIC.11380%20MIC.11385.pdf)
- [CLSI Breakpoint Implementation Toolkit (PDF)](https://clsi.org/media/zq5pypbs/breakpoint_implementation_toolkit.pdf)

---

*Prepared 2026-09-04. Every number above was checked against a source in this session; none was carried over from the December 2025 design.*
