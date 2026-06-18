# Profile Reuse — start from a real profile, don't retype mappings

> Analyzer configurations are captured as **profile JSON** (schema `analyzer-defaults/1.0`).
> Real, maintained profiles already exist. Before writing a spec, **find the closest existing
> profile and adapt it** — that is the reuse mechanism, not a hand-typed library in this skill.
> (An earlier version of this file kept a parallel hand-typed library; it drifted from reality
> and is removed. Read the real profiles instead.)
>
> **Scope:** mappings/config only — no implementation direction.

---

## Where profiles live (and an open question)

Profiles ship inside **distro** config sets. The one we've seen:
`DIGI-UW/openelis-madagascar-distro` → `configs/analyzer-profiles/{astm,hl7,file}/*.json`.

⚠ **A distro set is distro-specific, not the universal source of truth.** The Madagascar set
is *one deployment's* profiles (its LOINCs/tests reflect that catalog). Use it as a **reference
example to adapt**, not as the canonical registry for every site.

**Open question (dependency, not yet resolved):** where should a *canonical / community* profile
set live so it's reused across deployments? Candidates:
- the **analyzer plugins repo** (a community-maintained set), or
- a **base set packaged with openelis-global** (the "shipped base catalog of profiles" the
  Analyzer Types & Mapping FRS anticipates).

Until that's decided, treat distro sets as examples and **flag the canonical home as a
dependency** in specs that assume reusable shipped profiles. Don't declare any one distro as
the source.

---

## What's actually reusable (and what isn't)

Reuse is organized by **clinical panel, keyed by LOINC** — and it crosses manufacturers *and*
protocols. Evidence from the real profiles: the **Sysmex XN (ASTM)** and **Mindray BC-5380
(HL7)** CBC panels are identical — `WBC→6690-2`, `RBC→789-8`, `HGB→718-7`, … `BASO→704-7`, same
units — because CBC analytes are standardized by LOINC. So the reusable thing is *the panel's
LOINC map*, shared by analyzers that look unrelated.

> ⚠ **Reuse is conditional on the test catalog.** A profile maps an analyzer code to a **LOINC**;
> that only auto-matches a real test if the deployment's test catalog has a test carrying that
> LOINC. So the shipped/reused profiles work **out of the box only for deployments on the
> OpenELIS Global Default test catalog** (or any catalog that carries the same LOINCs).
> - **Default-TC deployments:** the panel LOINC map is genuinely reusable as-is.
> - **Custom-TC deployments:** matching the analyzer's LOINCs to *their own* catalog's tests is
>   **deployment-specific work** — not reusable, and must be redone per site. Don't present a
>   reused profile as plug-and-play for a custom catalog.
>
> **Make it work out of the box: part of every spec is adding the analyzer's LOINCs to the
> Default TC.** If a test the analyzer reports isn't carried (by LOINC) in the OpenELIS Global
> Default test catalog, the spec's job includes **contributing those LOINC-coded tests to the
> Default TC** so the profile matches automatically on a fresh install. (This is a data/contract
> contribution to the default catalog — not implementation direction.) Track it as a deliverable
> alongside the profile.

| Reusable across analyzers (copy, then confirm) | Per-instrument (do NOT blindly copy) |
|---|---|
| **Test → LOINC → unit / result_type** for a standard panel (CBC, basic chemistry, etc.) | **Transport**: RS-232 baud, TCP port, framing (e.g. BC-5380 = port 5380, MLLP) |
| Protocol-standard **abnormal-flag** semantics (table below) | **QC rules**: `targetField`/operand vary (GeneXpert & Sysmex use `FIELD_EQUALS O.12 = Q`) |
| The **profile schema** itself (same shape for every analyzer) | **identifier_pattern / msh3_pattern** (vendor string match) |
| Qualitative **native value sets** (`DETECTED`/`NOT DETECTED`) — see value handling below | **extractionOverrides / transforms / aggregationMode** (often empty; instrument-specific) |

---

## The profile schema (`analyzer-defaults/1.0`) — the data contract

This is the actual shape of a profile (and the format of the "profile JSON" deliverable). It is
a data contract, not implementation guidance.

```jsonc
{
  "$schema": "https://openelis-global.org/schemas/analyzer-defaults/1.0",
  "profileMeta": { "id": "...", "version": "x.y.z", "displayName": "...", "confidence": "HIGH" },
  "analyzer_name": "...", "manufacturer": "...", "category": "HEMATOLOGY|MOLECULAR|CHEMISTRY|...",
  "protocol": { "name": "ASTM|HL7", "version": "..." },
  "identifier_pattern": "REGEX",            // ASTM; HL7 also uses "msh3_pattern"
  "transport": ["RS-232","TCP/IP"],
  "transport_config": { "RS-232": {"default_baud_rate": 9600}, "TCP/IP": {"default_port": 5380, "framing": "MLLP"} },
  "communication": { "mode": "BOTH|RECEIVE", "supports_lis_initiated": true },
  "default_test_mappings": [
    { "test_code": "WBC", "test_name_hint": "White Blood Cells", "loinc": "6690-2", "unit": "10^3/uL" },
    { "test_code": "MTB", "loinc": "85362-2", "unit": "", "result_type": "qualitative", "values": ["DETECTED","NOT DETECTED"] }
  ],
  "configDefaults": {
    "connectionRole": "SERVER",
    "aggregationMode": "PER_MESSAGE|BY_SPECIMEN",
    "qcRules": [ { "ruleType": "FIELD_EQUALS", "targetField": "O.12", "operand": "Q", "isActive": true, "sortOrder": 1 } ],
    "extractionOverrides": {}, "flagMappings": {}, "transforms": {}
  },
  "notes": "Honest provenance — e.g. 'real HL7 captures still pending', 'RESEARCH CORRECTION ...'"
}
```

Real profiles carry a `confidence` and candid `notes` about what's verified vs assumed —
**respect them.** A `HIGH` profile with "real captures pending" is a seed, not a guarantee.

---

## Value handling (important — easy to get wrong)

Profiles **keep the analyzer's native values** (`DETECTED` / `NOT DETECTED`) and map the **test
by LOINC**. They do **not** rename values like `DETECTED → Positive` in the profile —
`flagMappings`/`transforms` are typically empty. Translation of a result value to one of the
lab's result options happens **against the matched catalog test's result options**, per the
Analyzer Types & Mapping FRS (verify-first, bound to the test's dictionary).

So in a spec: list the analyzer's native values and the test's LOINC; **do not** author a
"DETECTED→Positive" rename as if the profile did it. Let result-option matching resolve against
the catalog test.

---

## Abnormal-flag semantics (protocol-standard — the one safe invariant)

| Flag | OpenELIS | | Flag | OpenELIS |
|---|---|---|---|---|
| H / L | HIGH / LOW | | `>` / `<` | beyond upper / lower reporting limit |
| HH / LL | CRITICAL_HIGH / CRITICAL_LOW | | `*` | SUSPECT_FLAG |
| N | NORMAL | | A | ABNORMAL |

---

## How to reuse, step by step

1. **Look for an existing profile** for this instrument (or a sibling in the same family/panel)
   in a distro set, e.g. the Madagascar `configs/analyzer-profiles/`. Found one → start there.
2. **Keep the panel's LOINC map** (test_code → loinc → unit/result_type) — that's the reusable
   core, valid across vendors/protocols.
3. **Make it work out of the box on the Default TC:** check each LOINC against the **OpenELIS
   Global Default test catalog**. For any analyzer test whose LOINC the Default TC doesn't carry,
   the spec must include **adding that LOINC-coded test to the Default TC** (a deliverable). This
   is what makes the profile auto-match on a fresh install. Note explicitly that **custom-TC
   deployments must do their own LOINC↔catalog matching** — that part isn't reusable.
4. **Re-verify the per-instrument bits** against the vendor manual or a real captured message:
   transport/port/framing, identifier pattern, QC rule field, aggregation. Don't inherit these
   blindly — they differ even within a manufacturer.
5. **Carry the confidence + notes forward** honestly; downgrade if you couldn't verify.
6. If no profile exists, build one to the schema above and (once validated) contribute it back
   to wherever the canonical home lands — see the open question.

---

## Maintenance
This file documents the schema + reuse discipline; it deliberately does **not** copy the
profiles themselves (that would drift). When the canonical-home question is resolved, update the
"Where profiles live" section to point at it.
