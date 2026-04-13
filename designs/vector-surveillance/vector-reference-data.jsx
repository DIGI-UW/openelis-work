/**
 * V-01 Vector Specimen Types & Taxonomy — Mockup v1.0
 * OpenELIS Global
 *
 * Admin → Vector Surveillance → Reference Data
 * Three tabs: Species | Trap Types | Vector Sample Types
 *
 * Carbon Design System. All strings via t(key, fallback).
 * Inline row expansion for edit (no edit modals). Modal only for destructive confirm.
 */
import { useState } from "react";
import {
  Bug, Layers, Beaker, Plus, Search, ChevronDown, ChevronRight,
  Edit3, MoreVertical, AlertTriangle, CheckCircle2, X, RefreshCw, Filter,
} from "lucide-react";

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Design tokens (Carbon-aligned)
// ---------------------------------------------------------------------------
const C = {
  blue60: "#0f62fe", blue10: "#edf5ff", blueText: "#0043ce",
  gray10: "#f4f4f4", gray20: "#e0e0e0", gray30: "#c6c6c6",
  gray50: "#8d8d8d", gray60: "#6f6f6f", gray70: "#525252", gray80: "#393939",
  gray90: "#262626", gray100: "#161616", white: "#ffffff",
  green10: "#defbe6", greenText: "#0e6027",
  red10: "#fff1f1", red50: "#da1e28",
  purple10: "#f6f2ff", purpleText: "#6929c4",
  teal10: "#d9fbfb", tealText: "#005d5d",
  warmGray10: "#f7f3f2", warmGrayText: "#565151",
};

const ORGANISM_GROUPS = {
  MOSQUITO:        { label: "Mosquito",         bg: C.green10,    color: C.greenText,  icon: "🦟" },
  TICK:            { label: "Tick",             bg: C.blue10,     color: C.blueText,   icon: "🕷️" },
  RODENT:          { label: "Rodent",           bg: C.purple10,   color: C.purpleText, icon: "🐀" },
  OTHER_ARTHROPOD: { label: "Other Arthropod",  bg: C.warmGray10, color: C.warmGrayText, icon: "🪰" },
  OTHER_ANIMAL:    { label: "Other Animal",     bg: C.gray10,     color: C.gray70,     icon: "🐾" },
};

const COLLECTION_METHODS = {
  LIGHT:         "Light",
  BAIT:          "Bait",
  GRAVID:        "Gravid",
  ADULT_RESTING: "Adult Resting",
  LARVAL:        "Larval",
  DRAG:          "Drag",
  SNAP:          "Snap",
  LIVE:          "Live Capture",
  OVIPOSITION:   "Oviposition",
  OTHER:         "Other",
};

const POOLING_STRATEGY = {
  INDIVIDUAL:    { label: "Individual",          bg: C.blue10,   color: C.blueText   },
  POOL_FIXED:    { label: "Pool — Fixed Size",    bg: C.purple10, color: C.purpleText },
  POOL_VARIABLE: { label: "Pool — Variable Size", bg: C.teal10,   color: C.tealText   },
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_SPECIES = [
  { id: 1, genus: "Aedes", species: "aegypti", subspecies: "", commonName: "Yellow Fever Mosquito", organismGroup: "MOSQUITO", pathogens: ["DENV", "CHIKV", "ZIKV", "YFV"], stages: ["EGG","LARVA","PUPA","ADULT"], active: true },
  { id: 2, genus: "Aedes", species: "albopictus", subspecies: "", commonName: "Asian Tiger Mosquito", organismGroup: "MOSQUITO", pathogens: ["DENV", "CHIKV", "ZIKV"], stages: ["EGG","LARVA","PUPA","ADULT"], active: true },
  { id: 3, genus: "Anopheles", species: "sundaicus", subspecies: "", commonName: "", organismGroup: "MOSQUITO", pathogens: ["PLASMODIUM_FALCIPARUM", "PLASMODIUM_VIVAX"], stages: ["LARVA","PUPA","ADULT"], active: true },
  { id: 4, genus: "Anopheles", species: "balabacensis", subspecies: "", commonName: "", organismGroup: "MOSQUITO", pathogens: ["PLASMODIUM_KNOWLESI"], stages: ["ADULT"], active: true },
  { id: 5, genus: "Culex", species: "quinquefasciatus", subspecies: "", commonName: "Southern House Mosquito", organismGroup: "MOSQUITO", pathogens: ["WNV", "WEE", "SLEV"], stages: ["LARVA","PUPA","ADULT"], active: true },
  { id: 6, genus: "Culex", species: "tritaeniorhynchus", subspecies: "", commonName: "", organismGroup: "MOSQUITO", pathogens: ["JEV"], stages: ["ADULT"], active: true },
  { id: 7, genus: "Ixodes", species: "scapularis", subspecies: "", commonName: "Blacklegged Tick", organismGroup: "TICK", pathogens: ["BORRELIA_BURGDORFERI", "ANAPLASMA_PHAGOCYTOPHILUM", "BABESIA_MICROTI"], stages: ["LARVA","NYMPH","ADULT","ENGORGED_ADULT"], active: true },
  { id: 8, genus: "Rhipicephalus", species: "sanguineus", subspecies: "", commonName: "Brown Dog Tick", organismGroup: "TICK", pathogens: ["RICKETTSIA_RICKETTSII"], stages: ["NYMPH","ADULT"], active: true },
  { id: 9, genus: "Rattus", species: "rattus", subspecies: "", commonName: "Black Rat", organismGroup: "RODENT", pathogens: ["LEPTOSPIRA", "YERSINIA_PESTIS"], stages: ["ADULT"], active: true },
  { id: 10, genus: "Rattus", species: "norvegicus", subspecies: "", commonName: "Brown Rat", organismGroup: "RODENT", pathogens: ["LEPTOSPIRA", "YERSINIA_PESTIS", "HANTAVIRUS"], stages: ["ADULT"], active: true },
  { id: 11, genus: "Phlebotomus", species: "papatasi", subspecies: "", commonName: "Sand Fly", organismGroup: "OTHER_ARTHROPOD", pathogens: ["LEISHMANIA_MAJOR"], stages: ["ADULT"], active: true },
  { id: 12, genus: "Armigeres", species: "subalbatus", subspecies: "", commonName: "", organismGroup: "MOSQUITO", pathogens: [], stages: ["ADULT"], active: false },
];

const MOCK_TRAPS = [
  { id: 1, code: "CDC_LT",    name: "CDC Light Trap",           target: "MOSQUITO",        method: "LIGHT",         description: "Standard New Jersey / CDC miniature light trap with CO2 augmentation option", active: true },
  { id: 2, code: "BG_SENT",   name: "BG-Sentinel Trap",          target: "MOSQUITO",        method: "ADULT_RESTING", description: "Host-seeking Aedes-targeted trap with BG-Lure", active: true },
  { id: 3, code: "OVITRAP",   name: "Ovitrap",                   target: "MOSQUITO",        method: "OVIPOSITION",   description: "Black jar for egg deposition monitoring (Aedes)", active: true },
  { id: 4, code: "HLC",       name: "Human Landing Catch",        target: "MOSQUITO",        method: "BAIT",          description: "Direct aspiration from human collector", active: true },
  { id: 5, code: "PSC",       name: "Pyrethrum Spray Collection", target: "MOSQUITO",        method: "ADULT_RESTING", description: "Indoor resting mosquito knockdown collection", active: true },
  { id: 6, code: "LARVAL_DIP",name: "Larval Dipping",             target: "MOSQUITO",        method: "LARVAL",        description: "Standard 350mL larval dipper for breeding site surveys", active: true },
  { id: 7, code: "TICK_DRAG", name: "Tick Drag",                  target: "TICK",            method: "DRAG",          description: "1m² white flannel drag across vegetation", active: true },
  { id: 8, code: "TICK_FLAG", name: "Tick Flag",                  target: "TICK",            method: "DRAG",          description: "Vertical flag sweep through dense understory", active: true },
  { id: 9, code: "SHERMAN",   name: "Sherman Live Trap",          target: "RODENT",          method: "LIVE",          description: "Folding aluminum live trap, small-to-medium rodents", active: true },
  { id: 10, code: "TOMAHAWK", name: "Tomahawk Live Trap",         target: "RODENT",          method: "LIVE",          description: "Wire-mesh live trap for larger rodents", active: true },
  { id: 11, code: "SNAP",     name: "Snap Trap",                  target: "RODENT",          method: "SNAP",          description: "Lethal trap for population reduction surveys", active: true },
  { id: 12, code: "PITFALL",  name: "Pitfall Trap",               target: "OTHER_ARTHROPOD", method: "LIVE",          description: "In-ground container trap for ground-dwelling arthropods", active: true },
];

const MOCK_VECTOR_SAMPLE_TYPES = [
  { id: 1, name: "Adult Mosquito Pool",      poolingStrategy: "POOL_FIXED",    defaultPoolSize: 25, preservation: "95% Ethanol / -80°C", allowedGroups: ["MOSQUITO"],                 stages: ["ADULT"] },
  { id: 2, name: "Mosquito Larvae",          poolingStrategy: "POOL_VARIABLE", defaultPoolSize: null, preservation: "70% Ethanol",       allowedGroups: ["MOSQUITO"],                 stages: ["LARVA","PUPA"] },
  { id: 3, name: "Mosquito Eggs (Ovitrap)",  poolingStrategy: "POOL_VARIABLE", defaultPoolSize: null, preservation: "Dry, Silica Gel",    allowedGroups: ["MOSQUITO"],                 stages: ["EGG"] },
  { id: 4, name: "Individual Tick",          poolingStrategy: "INDIVIDUAL",    defaultPoolSize: null, preservation: "70% Ethanol",       allowedGroups: ["TICK"],                     stages: ["NYMPH","ADULT","ENGORGED_ADULT"] },
  { id: 5, name: "Tick Pool",                poolingStrategy: "POOL_FIXED",    defaultPoolSize: 10, preservation: "RNAlater",            allowedGroups: ["TICK"],                     stages: ["NYMPH","ADULT"] },
  { id: 6, name: "Rodent Blood",             poolingStrategy: "INDIVIDUAL",    defaultPoolSize: null, preservation: "EDTA, -20°C",        allowedGroups: ["RODENT"],                   stages: ["ADULT"] },
  { id: 7, name: "Rodent Tissue (Spleen)",   poolingStrategy: "INDIVIDUAL",    defaultPoolSize: null, preservation: "RNAlater / -80°C",   allowedGroups: ["RODENT"],                   stages: ["ADULT"] },
  { id: 8, name: "Sand Fly Pool",            poolingStrategy: "POOL_FIXED",    defaultPoolSize: 30, preservation: "95% Ethanol",         allowedGroups: ["OTHER_ARTHROPOD"],          stages: ["ADULT"] },
];

// =====================================================================
// Shared styled components
// =====================================================================
function Tag({ bg, color, children, size = "default" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: size === "sm" ? "1px 8px" : "2px 10px",
      borderRadius: 24,
      fontSize: size === "sm" ? 11 : 12,
      fontWeight: 500,
      background: bg, color,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function OrganismTag({ group, size }) {
  const cfg = ORGANISM_GROUPS[group];
  return <Tag bg={cfg.bg} color={cfg.color} size={size}>{cfg.icon} {cfg.label}</Tag>;
}

// =====================================================================
// TAB 1: Vector Species
// =====================================================================
function SpeciesTab() {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("ALL");
  const [filterActive, setFilterActive] = useState("ACTIVE");
  const [seedBanner, setSeedBanner] = useState(null);

  const filtered = MOCK_SPECIES.filter(sp => {
    if (filterActive === "ACTIVE" && !sp.active) return false;
    if (filterActive === "INACTIVE" && sp.active) return false;
    if (filterGroup !== "ALL" && sp.organismGroup !== filterGroup) return false;
    if (search && !(`${sp.genus} ${sp.species} ${sp.commonName}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      {seedBanner && (
        <div style={{ background: C.green10, border: `1px solid ${C.greenText}`, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.greenText }}>
          <CheckCircle2 size={16} />
          {t("message.vectorRef.seedReloadComplete", `Seed reload complete: ${seedBanner.created} created, ${seedBanner.skipped} skipped.`)}
          <button onClick={() => setSeedBanner(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.greenText }}><X size={14} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ background: C.white, border: `1px solid ${C.gray20}`, display: "flex", alignItems: "center", borderBottom: "none" }}>
        <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderRight: `1px solid ${C.gray20}`, flex: 1 }}>
          <Search size={16} color={C.gray60} />
          <input
            placeholder={t("placeholder.vectorRef.search", "Search species…")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent", fontFamily: "inherit" }}
          />
        </div>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={toolbarSelect}>
          <option value="ALL">{t("placeholder.vectorRef.filterOrganismGroup", "All Organism Groups")}</option>
          {Object.entries(ORGANISM_GROUPS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)} style={toolbarSelect}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ALL">All</option>
        </select>
        <button
          onClick={() => setSeedBanner({ created: 3, skipped: 37 })}
          style={{ background: C.white, border: "none", borderLeft: `1px solid ${C.gray20}`, padding: "0 16px", height: 40, cursor: "pointer", fontSize: 13, color: C.gray70, display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}
        >
          <RefreshCw size={14} /> {t("button.vectorRef.reloadSeed", "Reload Seed Data")}
        </button>
        <button style={{ background: C.blue60, color: C.white, border: "none", padding: "0 20px", height: 40, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> {t("button.vectorRef.addSpecies", "Add Species")}
        </button>
      </div>

      {/* DataTable */}
      <div style={{ background: C.white, border: `1px solid ${C.gray20}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
              <th style={thStyle}>{t("label.vectorSpecies.genus", "Genus / Species")}</th>
              <th style={thStyle}>{t("label.vectorSpecies.commonName", "Common Name")}</th>
              <th style={thStyle}>{t("label.vectorSpecies.organismGroup", "Organism Group")}</th>
              <th style={thStyle}>{t("label.vectorSpecies.pathogens", "Pathogens")}</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sp => {
              const isExpanded = expandedId === sp.id;
              return (
                <>
                  <tr key={sp.id} style={{ borderBottom: `1px solid ${C.gray20}`, background: isExpanded ? C.blue10 : "transparent", cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : sp.id)}>
                    <td style={tdStyle}>
                      <span style={{ fontStyle: "italic", fontWeight: 500 }}>{sp.genus} {sp.species}</span>
                      {sp.subspecies && <span style={{ fontStyle: "italic", color: C.gray60 }}> {sp.subspecies}</span>}
                    </td>
                    <td style={{ ...tdStyle, color: sp.commonName ? C.gray90 : C.gray50 }}>
                      {sp.commonName || "—"}
                    </td>
                    <td style={tdStyle}><OrganismTag group={sp.organismGroup} /></td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {sp.pathogens.slice(0, 2).map(p => (
                          <Tag key={p} bg={C.gray10} color={C.gray70} size="sm">{p}</Tag>
                        ))}
                        {sp.pathogens.length > 2 && <Tag bg={C.gray10} color={C.gray70} size="sm">+{sp.pathogens.length - 2} more</Tag>}
                        {sp.pathogens.length === 0 && <span style={{ color: C.gray50, fontSize: 13 }}>—</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <Tag bg={sp.active ? C.green10 : C.gray10} color={sp.active ? C.greenText : C.gray60} size="sm">
                        {sp.active ? t("label.vectorSpecies.status.active", "Active") : t("label.vectorSpecies.status.inactive", "Inactive")}
                      </Tag>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {isExpanded ? <ChevronDown size={16} color={C.gray60} /> : <ChevronRight size={16} color={C.gray60} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: C.gray10, padding: "20px 24px", borderBottom: `1px solid ${C.gray20}` }}>
                        <SpeciesEditForm species={sp} onClose={() => setExpandedId(null)} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: C.gray60 }}>No species match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: C.gray60 }}>
        Showing {filtered.length} of {MOCK_SPECIES.length} species
      </div>
    </div>
  );
}

function SpeciesEditForm({ species, onClose }) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray20}`, padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
        <div>
          <label style={formLabel}>{t("label.vectorSpecies.genus", "Genus")} *</label>
          <input style={formInput} defaultValue={species.genus} />
          <div style={formHint}>First letter capitalized (e.g., Aedes)</div>
        </div>
        <div>
          <label style={formLabel}>{t("label.vectorSpecies.species", "Species")} *</label>
          <input style={formInput} defaultValue={species.species} />
          <div style={formHint}>Lowercase (e.g., aegypti)</div>
        </div>
        <div>
          <label style={formLabel}>{t("label.vectorSpecies.subspecies", "Subspecies")}</label>
          <input style={formInput} defaultValue={species.subspecies} placeholder="(optional)" />
        </div>
        <div>
          <label style={formLabel}>{t("label.vectorSpecies.commonName", "Common Name")}</label>
          <input style={formInput} defaultValue={species.commonName} />
        </div>
        <div>
          <label style={formLabel}>{t("label.vectorSpecies.organismGroup", "Organism Group")} *</label>
          <select style={formInput} defaultValue={species.organismGroup}>
            {Object.entries(ORGANISM_GROUPS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={formLabel}>{t("label.vectorSpecies.defaultTestPanel", "Default Test Panel")}</label>
          <select style={formInput} defaultValue="">
            <option value="">— None —</option>
            <option>Arbovirus RT-PCR (DENV/CHIKV/ZIKV)</option>
            <option>Malaria PCR Panel</option>
            <option>JEV RT-PCR</option>
            <option>Tick-borne Pathogen Panel</option>
          </select>
        </div>
      </div>

      {/* Accordion: Advanced */}
      <div style={{ borderTop: `1px solid ${C.gray20}`, marginBottom: 16 }}>
        <button onClick={() => setAdvancedOpen(!advancedOpen)} style={{
          width: "100%", background: "none", border: "none", padding: "12px 0", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: C.gray80, textAlign: "left", fontFamily: "inherit",
        }}>
          {advancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {t("label.vectorSpecies.advanced", "Advanced")}
        </button>
        {advancedOpen && (
          <div style={{ padding: "0 0 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={formLabel}>{t("label.vectorSpecies.pathogens", "Associated Pathogens")}</label>
              <div style={{ border: `1px solid ${C.gray30}`, padding: "8px 12px", background: C.white, display: "flex", gap: 6, flexWrap: "wrap", minHeight: 38 }}>
                {species.pathogens.map(p => (
                  <Tag key={p} bg={C.blue10} color={C.blueText} size="sm">{p} <X size={10} style={{ cursor: "pointer" }} /></Tag>
                ))}
                <span style={{ color: C.gray50, fontSize: 13 }}>+ Add pathogen…</span>
              </div>
            </div>
            <div>
              <label style={formLabel}>{t("label.vectorSpecies.lifecycleStages", "Lifecycle Stages")}</label>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {["EGG","LARVA","PUPA","NYMPH","ADULT","ENGORGED_ADULT"].map(s => (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.gray80 }}>
                    <input type="checkbox" defaultChecked={species.stages.includes(s)} /> {s.replace("_", " ")}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={formLabel}>{t("label.vectorSpecies.active", "Active")}</label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input type="checkbox" defaultChecked={species.active} /> Species is available for new collection lots
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: `1px solid ${C.gray20}` }}>
        <button style={btnPrimary}>{t("button.vectorRef.save", "Save")}</button>
        <button onClick={onClose} style={btnGhost}>{t("button.vectorRef.cancel", "Cancel")}</button>
        <div style={{ flex: 1 }} />
        <button style={{ ...btnGhost, color: C.red50, borderColor: C.red50 }}>{t("button.vectorRef.deactivate", "Deactivate")}</button>
      </div>
    </div>
  );
}

// =====================================================================
// TAB 2: Trap Types
// =====================================================================
function TrapTypesTab() {
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("ALL");

  const filtered = MOCK_TRAPS.filter(tr => {
    if (filterGroup !== "ALL" && tr.target !== filterGroup) return false;
    if (search && !(`${tr.code} ${tr.name}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      {/* Toolbar */}
      <div style={{ background: C.white, border: `1px solid ${C.gray20}`, display: "flex", alignItems: "center", borderBottom: "none" }}>
        <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, borderRight: `1px solid ${C.gray20}`, flex: 1 }}>
          <Search size={16} color={C.gray60} />
          <input
            placeholder="Search trap types…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 14, flex: 1, background: "transparent", fontFamily: "inherit" }}
          />
        </div>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} style={toolbarSelect}>
          <option value="ALL">All Targets</option>
          {Object.entries(ORGANISM_GROUPS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button style={{ background: C.blue60, color: C.white, border: "none", padding: "0 20px", height: 40, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={14} /> {t("button.vectorRef.addTrapType", "Add Trap Type")}
        </button>
      </div>

      {/* DataTable */}
      <div style={{ background: C.white, border: `1px solid ${C.gray20}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
              <th style={thStyle}>{t("label.trapType.code", "Code")}</th>
              <th style={thStyle}>{t("label.trapType.displayName", "Display Name")}</th>
              <th style={thStyle}>{t("label.trapType.targetOrganism", "Target")}</th>
              <th style={thStyle}>{t("label.trapType.collectionMethod", "Collection Method")}</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tr => {
              const isExpanded = expandedId === tr.id;
              return (
                <>
                  <tr key={tr.id} style={{ borderBottom: `1px solid ${C.gray20}`, background: isExpanded ? C.blue10 : "transparent", cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : tr.id)}>
                    <td style={{ ...tdStyle, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, fontSize: 13 }}>{tr.code}</td>
                    <td style={tdStyle}>{tr.name}</td>
                    <td style={tdStyle}><OrganismTag group={tr.target} /></td>
                    <td style={tdStyle}><Tag bg={C.teal10} color={C.tealText} size="sm">{COLLECTION_METHODS[tr.method]}</Tag></td>
                    <td style={tdStyle}><Tag bg={C.green10} color={C.greenText} size="sm">Active</Tag></td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {isExpanded ? <ChevronDown size={16} color={C.gray60} /> : <ChevronRight size={16} color={C.gray60} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: C.gray10, padding: "20px 24px", borderBottom: `1px solid ${C.gray20}` }}>
                        <TrapTypeEditForm trap={tr} onClose={() => setExpandedId(null)} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: C.gray60 }}>
        Showing {filtered.length} of {MOCK_TRAPS.length} trap types
      </div>
    </div>
  );
}

function TrapTypeEditForm({ trap, onClose }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray20}`, padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, marginBottom: 16 }}>
        <div>
          <label style={formLabel}>{t("label.trapType.code", "Code")} *</label>
          <input style={{ ...formInput, fontFamily: "'IBM Plex Mono', monospace" }} defaultValue={trap.code} />
          <div style={formHint}>Uppercase alphanumeric + underscore (e.g., CDC_LT)</div>
        </div>
        <div>
          <label style={formLabel}>{t("label.trapType.displayName", "Display Name")} *</label>
          <input style={formInput} defaultValue={trap.name} />
        </div>
        <div>
          <label style={formLabel}>{t("label.trapType.targetOrganism", "Target Organism Group")} *</label>
          <select style={formInput} defaultValue={trap.target}>
            {Object.entries(ORGANISM_GROUPS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={formLabel}>{t("label.trapType.collectionMethod", "Collection Method")} *</label>
          <select style={formInput} defaultValue={trap.method}>
            {Object.entries(COLLECTION_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={formLabel}>{t("label.trapType.description", "Description")}</label>
        <textarea style={{ ...formInput, minHeight: 70, resize: "vertical" }} defaultValue={trap.description} />
      </div>
      <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: `1px solid ${C.gray20}` }}>
        <button style={btnPrimary}>{t("button.vectorRef.save", "Save")}</button>
        <button onClick={onClose} style={btnGhost}>{t("button.vectorRef.cancel", "Cancel")}</button>
        <div style={{ flex: 1 }} />
        <button style={{ ...btnGhost, color: C.red50, borderColor: C.red50 }}>{t("button.vectorRef.deactivate", "Deactivate")}</button>
      </div>
    </div>
  );
}

// =====================================================================
// TAB 3: Vector Sample Types
// =====================================================================
function VectorSampleTypesTab() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: C.blue10, border: `1px solid ${C.blue60}`, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: C.blueText, display: "flex", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={16} />
        <span>
          These are Sample Types with <strong>sampleDomain = VECTOR</strong> (from S-04).
          To create a new vector Sample Type, use the Sample Types admin page — this tab only configures the Vector Specimen Profile.
        </span>
      </div>

      <div style={{ background: C.white, border: `1px solid ${C.gray20}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
              <th style={thStyle}>{t("label.vectorSampleType.name", "Sample Type")}</th>
              <th style={thStyle}>{t("label.vectorSampleType.allowedGroups", "Allowed Groups")}</th>
              <th style={thStyle}>{t("label.vectorSampleType.poolingStrategy", "Pooling")}</th>
              <th style={thStyle}>{t("label.vectorSampleType.defaultPoolSize", "Pool Size")}</th>
              <th style={thStyle}>{t("label.vectorSampleType.preservationMethod", "Preservation")}</th>
              <th style={{ ...thStyle, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_VECTOR_SAMPLE_TYPES.map(st => {
              const isExpanded = expandedId === st.id;
              const poolCfg = POOLING_STRATEGY[st.poolingStrategy];
              return (
                <>
                  <tr key={st.id} style={{ borderBottom: `1px solid ${C.gray20}`, background: isExpanded ? C.blue10 : "transparent", cursor: "pointer" }}
                      onClick={() => setExpandedId(isExpanded ? null : st.id)}>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{st.name}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {st.allowedGroups.map(g => <OrganismTag key={g} group={g} size="sm" />)}
                      </div>
                    </td>
                    <td style={tdStyle}><Tag bg={poolCfg.bg} color={poolCfg.color} size="sm">{poolCfg.label}</Tag></td>
                    <td style={{ ...tdStyle, color: st.defaultPoolSize ? C.gray90 : C.gray50 }}>
                      {st.defaultPoolSize || "—"}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 13 }}>{st.preservation}</td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {isExpanded ? <ChevronDown size={16} color={C.gray60} /> : <ChevronRight size={16} color={C.gray60} />}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ background: C.gray10, padding: "20px 24px", borderBottom: `1px solid ${C.gray20}` }}>
                        <VectorSampleTypeEditForm sampleType={st} onClose={() => setExpandedId(null)} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VectorSampleTypeEditForm({ sampleType, onClose }) {
  const [strategy, setStrategy] = useState(sampleType.poolingStrategy);
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray20}`, padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <label style={formLabel}>{t("label.vectorSampleType.poolingStrategy", "Pooling Strategy")} *</label>
        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
          {Object.entries(POOLING_STRATEGY).map(([k, v]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
              <input type="radio" name="strategy" checked={strategy === k} onChange={() => setStrategy(k)} />
              {v.label}
            </label>
          ))}
        </div>
      </div>

      {/* Progressive disclosure: only shown for POOL_FIXED */}
      {strategy === "POOL_FIXED" && (
        <div style={{ marginBottom: 20 }}>
          <label style={formLabel}>{t("label.vectorSampleType.defaultPoolSize", "Default Pool Size")} *</label>
          <input type="number" style={{ ...formInput, width: 160 }} defaultValue={sampleType.defaultPoolSize || 25} min={1} max={100} />
          <div style={formHint}>1 to 100 organisms per pool</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <label style={formLabel}>{t("label.vectorSampleType.allowedGroups", "Allowed Organism Groups")} *</label>
          <div style={{ border: `1px solid ${C.gray30}`, padding: "8px 12px", background: C.white, display: "flex", gap: 6, flexWrap: "wrap", minHeight: 38 }}>
            {sampleType.allowedGroups.map(g => (
              <OrganismTag key={g} group={g} size="sm" />
            ))}
            <span style={{ color: C.gray50, fontSize: 13 }}>+ Add group…</span>
          </div>
        </div>
        <div>
          <label style={formLabel}>{t("label.vectorSampleType.preservationMethod", "Preservation Method")}</label>
          <input style={formInput} defaultValue={sampleType.preservation} />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={formLabel}>{t("label.vectorSampleType.expectedStages", "Expected Lifecycle Stages")}</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["EGG","LARVA","PUPA","NYMPH","ADULT","ENGORGED_ADULT"].map(s => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.gray80 }}>
              <input type="checkbox" defaultChecked={sampleType.stages.includes(s)} /> {s.replace("_", " ")}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, paddingTop: 12, borderTop: `1px solid ${C.gray20}` }}>
        <button style={btnPrimary}>{t("button.vectorRef.save", "Save")}</button>
        <button onClick={onClose} style={btnGhost}>{t("button.vectorRef.cancel", "Cancel")}</button>
      </div>
    </div>
  );
}

// =====================================================================
// App Shell — Page header + tabs
// =====================================================================
export default function V01VectorReferenceDataMockup() {
  const [activeTab, setActiveTab] = useState("species");

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: C.gray10, minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.gray20}`, padding: "24px 32px 0" }}>
        <div style={{ fontSize: 14, color: C.gray60, marginBottom: 4 }}>
          <Bug size={16} style={{ verticalAlign: "middle" }} /> Admin / {t("nav.vectorRef.breadcrumb", "Vector Surveillance")} / Reference Data
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: C.gray100, margin: "4px 0" }}>
          {t("heading.vectorRef.title", "Vector Surveillance Reference Data")}
        </h1>
        <p style={{ fontSize: 14, color: C.gray60, margin: "4px 0 20px" }}>
          {t("heading.vectorRef.subtitle", "Manage species, trap types, and vector sample type profiles")}
        </p>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "none" }}>
          {[
            { key: "species",     label: t("tab.vectorRef.species",     "Species"),               icon: <Bug size={14} />,     count: MOCK_SPECIES.length },
            { key: "trapTypes",   label: t("tab.vectorRef.trapTypes",   "Trap Types"),            icon: <Layers size={14} />,  count: MOCK_TRAPS.length },
            { key: "sampleTypes", label: t("tab.vectorRef.sampleTypes", "Vector Sample Types"),   icon: <Beaker size={14} />,  count: MOCK_VECTOR_SAMPLE_TYPES.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "10px 20px", background: activeTab === tab.key ? C.gray10 : "transparent",
              border: "none", borderBottom: activeTab === tab.key ? `3px solid ${C.blue60}` : `3px solid transparent`,
              fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? C.gray100 : C.gray60,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
            }}>
              {tab.icon} {tab.label}
              <span style={{ padding: "1px 8px", background: C.gray20, color: C.gray70, borderRadius: 10, fontSize: 11, fontWeight: 500 }}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "species"     && <SpeciesTab />}
      {activeTab === "trapTypes"   && <TrapTypesTab />}
      {activeTab === "sampleTypes" && <VectorSampleTypesTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const thStyle = {
  padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600,
  color: C.gray60, textTransform: "uppercase", letterSpacing: 0.5,
};
const tdStyle = { padding: "10px 12px", verticalAlign: "middle", fontSize: 14, color: C.gray90 };
const toolbarSelect = {
  padding: "0 12px", height: 40, background: C.white, border: "none",
  borderRight: `1px solid ${C.gray20}`, fontSize: 13, color: C.gray80, fontFamily: "inherit", cursor: "pointer",
};
const formLabel = { display: "block", fontSize: 12, fontWeight: 500, color: C.gray70, marginBottom: 4 };
const formInput = {
  width: "100%", padding: "8px 12px", fontSize: 14, border: `1px solid ${C.gray30}`,
  background: C.white, color: C.gray90, boxSizing: "border-box", fontFamily: "inherit",
};
const formHint = { fontSize: 11, color: C.gray50, marginTop: 2 };
const btnPrimary = {
  background: C.blue60, color: C.white, border: "none", padding: "9px 20px",
  fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
};
const btnGhost = {
  background: "none", border: `1px solid ${C.gray30}`, padding: "8px 20px",
  fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: C.gray80,
};
