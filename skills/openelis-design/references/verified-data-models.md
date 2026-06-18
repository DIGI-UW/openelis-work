# Verified Data Models

> Read during `/specify` Stage 1 and `/analyze` Pass G (Invented Data). These data models
> were field-verified in prior design sessions and/or against the live app. **Reuse these
> field lists — do not re-derive or invent.** When a feature touches one of these areas,
> pull the canonical field list from the area's FRS rather than guessing.
>
> Enforces design-addendum MUST A (reuse existing data; never invent domain concepts).

---

## Configuration / admin entities

| Area | Verified shape | Notes / gotchas |
|---|---|---|
| **Application / Common Properties** | 61 properties grouped into 7 domains; ~10 booleans (cross-cutting with Feature Flags) | UI title is "Common Properties" but standardize on "Application Properties". Live route `/MasterListsPage/commonproperties` |
| **Site Information** | 29 properties | C039 `patientSearchPassword` needs `PasswordInput`; C041 `bannerHeading` needs multi-locale editor; `TrainingInstallation` is destructive. Live route `/MasterListsPage/SiteInformationMenu` |
| **Validation Configuration** | 4 charset fields only: firstName, lastName, patientId, userName | Admins currently edit blind (audit C051 High) — key fix is a live "try a value" preview per charset |
| **WorkPlan Configuration** | 3 booleans: nextVisit, results, subject (on workplan) | Fix = live workplan preview showing columns conditionally. Live route `/MasterListsPage/WorkPlanConfigurationMenu` |
| **Order & Patient Entry** | 14 Order Entry + 8 Patient Entry = 22 properties | Merged into one page for B.2; conditional fields grey out when parent toggle is off |
| **Menu Configuration** | 5 scopes; 4 have trees of varying depth, Billing is URL+toggle only | Per-node "Side Nav Active" checkbox; "Show Child Elements" expand/collapse toggle. Parent route `/MasterListsPage/menuConfiguration` renders blank (BUG-49) — use the 7 sub-routes directly |
| **Validation charset / RETROCI study forms** | `useRetroCIStudyForms` flag gates hardcoded ARV/EID/VL/Indeterminate forms; off by default | Study Menu Configuration retires entirely under this flag |

## Notification / alerting

| Area | Verified shape | Notes |
|---|---|---|
| **Test Notification** | 4 channels (Patient Email, Patient SMS, Provider Email, Provider SMS); 3-tier template fallback (channel→test→system); 4 substitution variables; BCC on Provider Email only | Live route `/MasterListsPage/testNotificationConfigMenu` — per-test × 4-channel matrix |
| **Test Catalog Alerts** | per-test rule authoring; delivery via the Test Notification system; per-rule ack toggle couples to Critical Acknowledgment | Authoring + delivery are split concerns |

## Cross-cutting patterns

- **Feature Flags (admin MVP):** introduced as a 10th tab in Application Settings (hybrid
  auto-aggregate + curated dictionary). Menu Config = navigation-scoped flags.
- **External patient source:** `patientSearchURL` is admin-editable, but request/response
  format is hardcoded in Java — new endpoint types need engineering coordination.
- **Domain enum:** strictly CLINICAL / ENVIRONMENTAL / VECTOR — no BOTH, anywhere.

---

## Maintenance
Each row should cite its canonical FRS. When a new feature's data model gets verified, add
a row here so the next `/specify` reuses it. Cross-check `current-state-gotchas.md` for
what's built vs. not before relying on a row.
