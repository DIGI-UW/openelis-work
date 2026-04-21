/**
 * S-08 Environmental QC Rules — Mockup v1.0
 * OpenELIS Global
 *
 * Three screens via tab switcher:
 *   1. QC Protocol Configuration — Accordion within S-01 standard detail
 *   2. QC Tab on Results Entry — DataTable of linked QC samples + pass/fail
 *   3. QC Warning + Acknowledgment — Validation screen with warning banner
 *
 * Carbon Design System components. All strings via t(key, fallback).
 */
import { useState } from "react";
import {
  Settings, Shield, FlaskConical, Copy, Beaker, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Clock, Info, X, FileText
} from "lucide-react";

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const C = {
  blue60: "#0f62fe", gray10: "#f4f4f4", gray20: "#e0e0e0", gray30: "#c6c6c6",
  gray50: "#8d8d8d", gray60: "#6f6f6f", gray70: "#525252", gray80: "#393939",
  gray90: "#262626", gray100: "#161616", white: "#ffffff",
  green50: "#24a148", green10: "#defbe6", greenText: "#0e6027",
  yellow30: "#f1c21b", yellow10: "#fcf4d6", yellowText: "#6e4b00",
  red50: "#da1e28", red10: "#fff1f1",
  teal50: "#009d9a", purple60: "#8a3ffc",
};

const QC_TYPE_CONFIG = {
  FIELD_BLANK:    { label: "Field Blank",      icon: "🧪", color: C.blue60, bg: "#edf5ff",  desc: "Detect contamination from collection equipment" },
  TRIP_BLANK:     { label: "Trip Blank",        icon: "🚚", color: C.purple60, bg: "#f6f2ff", desc: "Detect contamination during transport" },
  DUPLICATE:      { label: "Duplicate Sample",  icon: "📋", color: C.teal50, bg: "#d9fbfb",  desc: "Assess measurement precision via RPD" },
  SPIKE_RECOVERY: { label: "Spike Recovery",    icon: "💉", color: C.yellowText, bg: C.yellow10, desc: "Verify analyte recovery in sample matrix" },
};

const STATUS_TAG = {
  PASS:    { bg: C.green10, color: C.greenText, label: "Pass", icon: "✓" },
  FAIL:    { bg: C.red10, color: C.red50, label: "Fail", icon: "✗" },
  PENDING: { bg: C.gray10, color: C.gray60, label: "Pending", icon: "⏳" },
};

// ---------------------------------------------------------------------------
// Mock data — QC protocol config
// ---------------------------------------------------------------------------
const MOCK_PROTOCOLS = [
  { qcType: "FIELD_BLANK", enabled: true, frequency: "PER_EVENT", frequencyN: null, acceptanceLower: 0, acceptanceUpper: 1, acceptanceUnit: "MDL_RELATIVE" },
  { qcType: "TRIP_BLANK", enabled: true, frequency: "PER_EVENT", frequencyN: null, acceptanceLower: 0, acceptanceUpper: 1, acceptanceUnit: "MDL_RELATIVE" },
  { qcType: "DUPLICATE", enabled: true, frequency: "PER_N_SAMPLES", frequencyN: 10, acceptanceLower: 0, acceptanceUpper: 20, acceptanceUnit: "PERCENT" },
  { qcType: "SPIKE_RECOVERY", enabled: false, frequency: "PER_EVENT", frequencyN: null, acceptanceLower: 75, acceptanceUpper: 125, acceptanceUnit: "PERCENT" },
];

// Mock data — QC evaluations for an order
const MOCK_EVALUATIONS = [
  { qcType: "FIELD_BLANK", labNumber: "ENV-2026-001-FB", parameter: "Lead (Pb)", qcResult: "0.001 mg/L", parentResult: "—", calculated: "—", acceptance: "< MDL (0.003)", status: "PASS" },
  { qcType: "FIELD_BLANK", labNumber: "ENV-2026-001-FB", parameter: "pH", qcResult: "6.9 pH", parentResult: "—", calculated: "—", acceptance: "< MDL", status: "PASS" },
  { qcType: "FIELD_BLANK", labNumber: "ENV-2026-001-FB", parameter: "E. coli", qcResult: "0 CFU/100mL", parentResult: "—", calculated: "—", acceptance: "< MDL", status: "PASS" },
  { qcType: "TRIP_BLANK", labNumber: "ENV-2026-001-TB", parameter: "Lead (Pb)", qcResult: "0.004 mg/L", parentResult: "—", calculated: "—", acceptance: "< MDL (0.003)", status: "FAIL" },
  { qcType: "TRIP_BLANK", labNumber: "ENV-2026-001-TB", parameter: "pH", qcResult: "7.0 pH", parentResult: "—", calculated: "—", acceptance: "< MDL", status: "PASS" },
  { qcType: "DUPLICATE", labNumber: "ENV-2026-001-DUP", parameter: "Lead (Pb)", qcResult: "0.030 mg/L", parentResult: "0.032 mg/L", calculated: "RPD: 6.5%", acceptance: "≤20%", status: "PASS" },
  { qcType: "DUPLICATE", labNumber: "ENV-2026-001-DUP", parameter: "E. coli", qcResult: "52 CFU/100mL", parentResult: "45 CFU/100mL", calculated: "RPD: 14.4%", acceptance: "≤20%", status: "PASS" },
  { qcType: "DUPLICATE", labNumber: "ENV-2026-001-DUP", parameter: "Turbidity", qcResult: "4.1 NTU", parentResult: "3.8 NTU", calculated: "RPD: 7.6%", acceptance: "≤20%", status: "PASS" },
];

// =====================================================================
// SCREEN 1: QC Protocol Configuration
// =====================================================================
function QcProtocolConfig() {
  const [protocols, setProtocols] = useState(MOCK_PROTOCOLS);
  const [openPanels, setOpenPanels] = useState({ FIELD_BLANK: true });
  const [saved, setSaved] = useState(false);

  const togglePanel = (type) => setOpenPanels(p => ({ ...p, [type]: !p[type] }));

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: C.gray10, minHeight: "100vh" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.gray20}`, padding: "24px 32px 16px" }}>
        <div style={{ fontSize: 14, color: C.gray60, marginBottom: 4 }}>
          <Settings size={16} style={{ verticalAlign: "middle" }} /> Admin / Compliance Standards / PP No. 22/2021
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: C.gray100, margin: "4px 0" }}>
          {t("heading.qcProtocol.title", "QC Protocol")}
        </h1>
        <p style={{ fontSize: 14, color: C.gray60 }}>
          {t("heading.qcProtocol.subtitle", "Configure environmental quality control requirements for this standard")}
        </p>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        {saved && (
          <div style={{ background: C.green10, border: `1px solid ${C.greenText}`, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.greenText }}>
            <CheckCircle2 size={16} /> {t("message.qcProtocol.saved", "QC protocol saved.")}
            <button onClick={() => setSaved(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.greenText }}><X size={14} /></button>
          </div>
        )}

        {protocols.map(proto => {
          const cfg = QC_TYPE_CONFIG[proto.qcType];
          const open = !!openPanels[proto.qcType];
          return (
            <div key={proto.qcType} style={{ background: C.white, border: `1px solid ${C.gray20}`, marginBottom: -1 }}>
              <button onClick={() => togglePanel(proto.qcType)} style={{
                width: "100%", background: "none", border: "none", padding: "12px 16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, color: C.gray90, textAlign: "left", fontFamily: "inherit",
              }}>
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: C.gray50, marginLeft: 4 }}>— {cfg.desc}</span>
                <span style={{ marginLeft: "auto" }}>
                  <span style={{
                    padding: "2px 10px", borderRadius: 24, fontSize: 12, fontWeight: 500,
                    background: proto.enabled ? C.green10 : C.gray10,
                    color: proto.enabled ? C.greenText : C.gray60,
                  }}>
                    {proto.enabled ? t("label.qcProtocol.enabled", "Enabled") : "Disabled"}
                  </span>
                </span>
              </button>
              {open && (
                <div style={{ padding: "0 16px 20px", borderTop: `1px solid ${C.gray20}` }}>
                  <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <label style={cfgLabelStyle}>{t("label.qcProtocol.enabled", "Enabled")}</label>
                      <input type="checkbox" checked={proto.enabled} readOnly style={{ width: 18, height: 18 }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={cfgLabelStyle}>{t("label.qcProtocol.frequency", "Frequency")}</label>
                        <select style={cfgInputStyle} defaultValue={proto.frequency}>
                          <option value="PER_EVENT">{t("label.qcProtocol.frequencyPerEvent", "Every sampling event")}</option>
                          <option value="PER_N_SAMPLES">1 per N samples</option>
                        </select>
                      </div>
                      {proto.frequency === "PER_N_SAMPLES" && (
                        <div>
                          <label style={cfgLabelStyle}>N</label>
                          <input type="number" style={cfgInputStyle} defaultValue={proto.frequencyN} min={1} />
                        </div>
                      )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={cfgLabelStyle}>{t("label.qcProtocol.acceptanceLower", "Lower Bound")}</label>
                        <input type="number" style={cfgInputStyle} defaultValue={proto.acceptanceLower} />
                      </div>
                      <div>
                        <label style={cfgLabelStyle}>{t("label.qcProtocol.acceptanceUpper", "Upper Bound")}</label>
                        <input type="number" style={cfgInputStyle} defaultValue={proto.acceptanceUpper} />
                      </div>
                      <div>
                        <label style={cfgLabelStyle}>{t("label.qcProtocol.acceptanceUnit", "Unit")}</label>
                        <select style={cfgInputStyle} defaultValue={proto.acceptanceUnit}>
                          <option value="PERCENT">{t("label.qcProtocol.unitPercent", "Percent (%)")}</option>
                          <option value="ABSOLUTE">{t("label.qcProtocol.unitAbsolute", "Absolute Value")}</option>
                          <option value="MDL_RELATIVE">{t("label.qcProtocol.unitMdl", "Relative to MDL")}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={cfgLabelStyle}>{t("label.qcProtocol.parameters", "Parameters")}</label>
                      <div style={{ fontSize: 13, color: C.gray60, padding: "8px 0" }}>
                        {t("label.qcProtocol.allParameters", "All Parameters")} (pH, Turbidity, Lead, E. coli, Odor)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button onClick={() => setSaved(true)} style={{
          background: C.blue60, color: C.white, border: "none", padding: "11px 24px",
          fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", marginTop: 24,
        }}>
          {t("button.qcProtocol.save", "Save QC Protocol")}
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN 2: QC Tab on Results Entry
// =====================================================================
function QcResultsTab() {
  const failCount = MOCK_EVALUATIONS.filter(e => e.status === "FAIL").length;
  const passCount = MOCK_EVALUATIONS.filter(e => e.status === "PASS").length;
  const pendingCount = MOCK_EVALUATIONS.filter(e => e.status === "PENDING").length;
  const total = MOCK_EVALUATIONS.length;

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: C.gray10, minHeight: "100vh" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.gray20}`, padding: "24px 32px 16px" }}>
        <div style={{ fontSize: 14, color: C.gray60, marginBottom: 4 }}>
          <FlaskConical size={16} style={{ verticalAlign: "middle" }} /> Results Entry / ENV-2026-001 / Expanded Panel
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: C.gray100, margin: "4px 0" }}>
          {t("heading.qcTab.title", "QC")} {failCount > 0 && (
            <span style={{ fontSize: 16, padding: "2px 10px", borderRadius: 24, background: C.red10, color: C.red50, fontWeight: 600, marginLeft: 8 }}>
              ⚠ {failCount}
            </span>
          )}
        </h1>
        <p style={{ fontSize: 14, color: C.gray60 }}>
          {t("label.qcTab.summary", `QC Status: ${passCount} passed, ${failCount} failed, ${pendingCount} pending of ${total} evaluations`)}
        </p>
      </div>

      <div style={{ padding: "24px 32px" }}>
        {failCount > 0 && (
          <div style={{
            background: C.yellow10, border: `1px solid ${C.yellow30}`, padding: "12px 16px",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.yellowText,
          }}>
            <AlertTriangle size={16} />
            {t("message.qcWarning", `⚠ QC Warning: ${failCount} quality control check(s) failed for this order. Review before releasing results.`)}
          </div>
        )}

        <div style={{ background: C.white, border: `1px solid ${C.gray20}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: C.gray10, borderBottom: `1px solid ${C.gray20}` }}>
                <th style={thStyle}>{t("label.qcTab.qcType", "QC Type")}</th>
                <th style={thStyle}>{t("label.qcTab.labNumber", "Lab Number")}</th>
                <th style={thStyle}>{t("label.qcTab.parameter", "Parameter")}</th>
                <th style={thStyle}>{t("label.qcTab.qcResult", "QC Result")}</th>
                <th style={thStyle}>{t("label.qcTab.parentResult", "Parent Result")}</th>
                <th style={thStyle}>{t("label.qcTab.calculated", "Calculated")}</th>
                <th style={thStyle}>{t("label.qcTab.acceptance", "Acceptance")}</th>
                <th style={thStyle}>{t("label.qcTab.status", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EVALUATIONS.map((ev, i) => {
                const qcCfg = QC_TYPE_CONFIG[ev.qcType];
                const sCfg = STATUS_TAG[ev.status];
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.gray20}` }}>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 10px", borderRadius: 24, fontSize: 12, fontWeight: 500,
                        background: qcCfg.bg, color: qcCfg.color,
                      }}>
                        {qcCfg.icon} {qcCfg.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 500, fontSize: 13 }}>{ev.labNumber}</td>
                    <td style={tdStyle}>{ev.parameter}</td>
                    <td style={tdStyle}>{ev.qcResult}</td>
                    <td style={{ ...tdStyle, color: ev.parentResult === "—" ? C.gray50 : C.gray90 }}>{ev.parentResult}</td>
                    <td style={{ ...tdStyle, color: ev.calculated === "—" ? C.gray50 : C.gray90 }}>{ev.calculated}</td>
                    <td style={{ ...tdStyle, fontSize: 13 }}>{ev.acceptance}</td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "2px 10px", borderRadius: 24, fontSize: 12, fontWeight: 500,
                        background: sCfg.bg, color: sCfg.color,
                      }}>
                        {sCfg.icon} {sCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// SCREEN 3: QC Warning + Acknowledgment Modal
// =====================================================================
function QcAcknowledgment() {
  const [showModal, setShowModal] = useState(false);
  const [justification, setJustification] = useState("");
  const [checked, setChecked] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: C.gray10, minHeight: "100vh" }}>
      <div style={{ background: C.white, borderBottom: `1px solid ${C.gray20}`, padding: "24px 32px 16px" }}>
        <div style={{ fontSize: 14, color: C.gray60, marginBottom: 4 }}>
          <Shield size={16} style={{ verticalAlign: "middle" }} /> Validation / ENV-2026-001
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, color: C.gray100, margin: "4px 0" }}>
          Validate and Release
        </h1>
        <p style={{ fontSize: 14, color: C.gray60 }}>
          Intake Point A — Citarum River (SITE-042) · PP No. 22/2021
        </p>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 800 }}>
        {/* QC Warning Banner */}
        {!acknowledged && (
          <div style={{
            background: C.yellow10, border: `1px solid ${C.yellow30}`, padding: "16px 20px",
            marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: C.yellowText,
          }}>
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {t("message.qcWarning", "⚠ QC Warning: 1 quality control check(s) failed for this order.")}
              </div>
              <div style={{ fontSize: 13 }}>
                Trip Blank — Lead (Pb): 0.004 mg/L detected (acceptance: &lt; MDL 0.003 mg/L).
                Review the QC tab before releasing results.
              </div>
            </div>
          </div>
        )}

        {/* Acknowledged notice */}
        {acknowledged && (
          <div style={{
            background: C.green10, border: `1px solid ${C.greenText}`, padding: "12px 16px",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.greenText,
          }}>
            <CheckCircle2 size={16} />
            {t("label.qcAcknowledge.acknowledgedBy", "QC failures acknowledged by Dr. Bambang Sutrisno on 04/04/2026 16:40 WIB")}
          </div>
        )}

        {/* Order summary */}
        <div style={{ background: C.white, border: `1px solid ${C.gray20}`, padding: 20, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: C.gray80, marginBottom: 12 }}>Order Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><span style={{ color: C.gray60, width: 120, display: "inline-block" }}>Lab Number:</span> ENV-2026-001</div>
            <div><span style={{ color: C.gray60, width: 120, display: "inline-block" }}>Tests:</span> 5 (all results entered)</div>
            <div><span style={{ color: C.gray60, width: 120, display: "inline-block" }}>Compliance:</span> <span style={{ padding: "1px 8px", borderRadius: 24, fontSize: 11, background: C.red10, color: C.red50 }}>✗ Non-Compliant</span></div>
            <div><span style={{ color: C.gray60, width: 120, display: "inline-block" }}>QC Status:</span> <span style={{ padding: "1px 8px", borderRadius: 24, fontSize: 11, background: C.red10, color: C.red50 }}>✗ 1 Failure</span></div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => { if (!acknowledged) setShowModal(true); }}
            style={{
              background: !acknowledged ? C.blue60 : C.green50, color: C.white,
              border: "none", padding: "11px 24px", fontSize: 14, fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {acknowledged ? "✓ Released" : "Validate and Release"}
          </button>
          {!acknowledged && (
            <button style={{
              background: "none", border: `1px solid ${C.gray30}`, padding: "11px 24px",
              fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: C.gray80,
            }}>
              Cancel
            </button>
          )}
        </div>

        {/* Acknowledgment Modal */}
        {showModal && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}>
            <div style={{
              background: C.white, width: 520, borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.gray20}` }}>
                <h2 style={{ fontSize: 20, fontWeight: 400, color: C.gray100, margin: 0 }}>
                  {t("label.qcAcknowledge.title", "Acknowledge QC Failures")}
                </h2>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <div style={{
                  background: C.red10, padding: "12px 16px", marginBottom: 16,
                  fontSize: 13, color: C.red50, display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertTriangle size={16} />
                  1 QC failure detected. You must provide justification to release results.
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.gray70, marginBottom: 4 }}>
                    {t("label.qcAcknowledge.justification", "Justification")} <span style={{ color: C.red50 }}>*</span>
                  </label>
                  <textarea
                    value={justification}
                    onChange={e => setJustification(e.target.value)}
                    placeholder="Explain why results are being released despite QC failure (min. 10 characters)..."
                    style={{
                      width: "100%", minHeight: 80, padding: "8px 12px", fontSize: 14,
                      border: `1px solid ${C.gray30}`, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box",
                    }}
                  />
                  {justification.length > 0 && justification.length < 10 && (
                    <div style={{ fontSize: 12, color: C.red50, marginTop: 4 }}>
                      {t("error.qcAcknowledge.justificationRequired", "Justification is required (minimum 10 characters).")}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                    style={{ width: 18, height: 18, marginTop: 2 }} />
                  <label style={{ fontSize: 13, color: C.gray80, lineHeight: 1.4 }}>
                    {t("label.qcAcknowledge.checkbox", "I have reviewed the QC failures and accept responsibility for releasing these results")}
                  </label>
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.gray20}`, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button onClick={() => setShowModal(false)} style={{
                  background: "none", border: `1px solid ${C.gray30}`, padding: "8px 20px",
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: C.gray80,
                }}>
                  {t("button.qcAcknowledge.cancel", "Cancel")}
                </button>
                <button
                  onClick={() => { setShowModal(false); setAcknowledged(true); }}
                  disabled={justification.length < 10 || !checked}
                  style={{
                    background: justification.length >= 10 && checked ? C.red50 : C.gray30,
                    color: C.white, border: "none", padding: "8px 20px",
                    fontSize: 14, fontWeight: 500, cursor: justification.length >= 10 && checked ? "pointer" : "not-allowed",
                    fontFamily: "inherit",
                  }}
                >
                  {t("button.qcAcknowledge.confirm", "Confirm Release")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// App — tab switcher for all three screens
// =====================================================================
const TABS = [
  { key: "config", label: "S-01 → QC Protocol Config" },
  { key: "qctab", label: "Results → QC Tab" },
  { key: "acknowledge", label: "Validation → QC Warning" },
];

export default function S08EnvironmentalQcRulesMockup() {
  const [activeTab, setActiveTab] = useState("config");

  return (
    <div>
      <div style={{
        background: C.gray90, padding: "8px 16px", display: "flex", gap: 4, fontFamily: "'IBM Plex Sans', sans-serif",
      }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background: activeTab === tab.key ? C.blue60 : "transparent",
            color: C.white, border: "none", padding: "6px 16px", fontSize: 13,
            cursor: "pointer", borderRadius: 4, opacity: activeTab === tab.key ? 1 : 0.7, fontFamily: "inherit",
          }}>
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: C.gray30, fontSize: 11, alignSelf: "center" }}>S-08 Environmental QC Rules — Mockup v1.0</span>
      </div>

      {activeTab === "config" && <QcProtocolConfig />}
      {activeTab === "qctab" && <QcResultsTab />}
      {activeTab === "acknowledge" && <QcAcknowledgment />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const cfgLabelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: C.gray70, marginBottom: 4 };
const cfgInputStyle = {
  padding: "8px 12px", fontSize: 14, border: `1px solid ${C.gray30}`,
  background: C.white, color: C.gray90, width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};
const thStyle = {
  padding: "10px 12px", textAlign: "left", fontSize: 12, fontWeight: 600,
  color: C.gray60, textTransform: "uppercase", letterSpacing: 0.5,
};
const tdStyle = { padding: "10px 12px", verticalAlign: "middle", fontSize: 14, color: C.gray90 };
