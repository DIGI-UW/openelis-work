import { useState, useCallback } from "react";
import {
  Menu, Search, Bell, HelpCircle, User, ChevronRight, ChevronDown,
  Copy, Shield, ShieldCheck, ShieldX, Lock, PenTool, AlertTriangle,
  Eye, EyeOff, Check, X, CheckCircle, XCircle
} from "lucide-react";

// ─── OpenELIS Colors ───
const C = {
  headerBg: "#2e3e4f", teal: "#00695c", tealLight: "#e0f2f1",
  blue: "#0066d6", blueHover: "#0052ab", orange: "#e65100",
  orangeBg: "#fff3e0", orangeBorder: "#ffe0b2",
  red: "#d32f2f", redBg: "#fdecea", redBorder: "#f5c6cb",
  green: "#2e7d32", greenBg: "#e8f5e9", greenBorder: "#c8e6c9",
  gray50: "#f8f9fa", gray100: "#f4f4f4", gray200: "#e0e0e0", gray300: "#c6c6c6",
  gray400: "#a8a8a8", gray500: "#6f6f6f", gray600: "#525252", gray700: "#393939",
  gray800: "#262626", gray900: "#161616", white: "#ffffff", inputBg: "#e8e8e8",
};

// ═══════════════════════════════════════════════════════════════════════
// REUSABLE E-SIGNATURE SYSTEM
// These components are designed to be dropped into any OpenELIS workflow.
// The consuming screen just renders <ESignatureButton> and handles the
// onSign / onCancel callbacks.
// ═══════════════════════════════════════════════════════════════════════

// ─── Shared session state (would be React Context in real app) ───
let _esigSession = { active: false, count: 0, certified: false };
const useEsigSession = () => {
  const [, rerender] = useState(0);
  const update = useCallback((fn) => { fn(_esigSession); rerender(n => n + 1); }, []);
  return { session: _esigSession, update };
};

// ─── Meaning Badge ───
const MeaningBadge = ({ meaning, size = "sm" }) => {
  const cfg = {
    AUTHORED: { bg: "#e3f2fd", border: "#90caf9", text: "#1565c0", label: "Authored" },
    VALIDATED_AND_RELEASED: { bg: C.greenBg, border: C.greenBorder, text: C.green, label: "Validated & Released" },
    REJECTED: { bg: C.redBg, border: C.redBorder, text: C.red, label: "Rejected" },
  }[meaning];
  if (!cfg) return null;
  return <span style={{ display: "inline-block", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, borderRadius: 3, padding: size === "sm" ? "2px 8px" : "4px 12px", fontSize: size === "sm" ? 11 : 12, fontWeight: 600 }}>{cfg.label}</span>;
};

// ─── Modal Shell ───
const Modal = ({ children, onClose, width = 440 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
    <div onClick={e => e.stopPropagation()} style={{ background: C.white, width, maxWidth: "95vw", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>{children}</div>
  </div>
);

// ─── Certification Modal ───
const CertificationModal = ({ user, onCertify, onCancel }) => {
  const [agreed, setAgreed] = useState(false);
  return (
    <Modal onClose={onCancel} width={520}>
      <div style={{ background: C.headerBg, color: C.white, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}><Shield size={18} /><span style={{ fontSize: 14, fontWeight: 600 }}>Electronic Signature Certification</span></div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: C.gray500, marginBottom: 12 }}>Required before first use — 21 CFR Part 11</div>
        <div style={{ background: C.gray100, border: `1px solid ${C.gray200}`, padding: 16, fontSize: 13, lineHeight: 1.7, color: C.gray700, maxHeight: 180, overflowY: "auto" }}>
          I, <strong>{user}</strong>, certify that my electronic signature, as used within this system, is the legally binding equivalent of my handwritten signature. I understand that electronic signatures executed under my credentials carry the same legal weight and accountability as traditional handwritten signatures, in accordance with 21 CFR Part 11.<br /><br />I acknowledge that I am solely responsible for all actions performed under my electronic signature, and that I will not share my credentials with any other individual.
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, cursor: "pointer", fontSize: 13, color: C.gray700 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: C.teal }} />
          <span>I have read and agree to the above certification.</span>
        </label>
      </div>
      <div style={{ padding: "12px 20px 16px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${C.gray200}` }}>
        <button onClick={onCancel} style={{ padding: "8px 20px", background: C.gray200, border: "none", fontSize: 13, cursor: "pointer", color: C.gray700 }}>Cancel</button>
        <button onClick={onCertify} disabled={!agreed} style={{ padding: "8px 20px", background: agreed ? C.blue : C.gray300, color: agreed ? C.white : C.gray500, border: "none", fontSize: 13, fontWeight: 600, cursor: agreed ? "pointer" : "not-allowed" }}>Certify</button>
      </div>
    </Modal>
  );
};

// ─── Full Auth Modal (first sign in session) ───
const FullAuthModal = ({ meaning, onSign, onCancel, context, requireReason }) => {
  const [userId, setUserId] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const needsReason = requireReason || meaning === "REJECTED";
  const canSign = userId && password && (!needsReason || reason.trim());
  const handleSign = () => { if (password === "wrong") { setError("Authentication failed. Please check your credentials and try again."); return; } setError(""); onSign({ userId, meaning, reason }); };
  return (
    <Modal onClose={onCancel}>
      <div style={{ background: C.headerBg, color: C.white, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}><Lock size={18} /><span style={{ fontSize: 14, fontWeight: 600 }}>Electronic Signature Required</span></div>
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 12, color: C.gray500, marginBottom: 12 }}>Full authentication required — first signature in session</div>
        <div style={{ background: C.gray100, border: `1px solid ${C.gray200}`, padding: "10px 12px", marginBottom: 16, fontSize: 12 }}>
          <div style={{ marginBottom: 6, color: C.gray500 }}>Signing action:</div>
          <MeaningBadge meaning={meaning} size="md" />
          {context && <div style={{ marginTop: 6, color: C.gray500 }}>{context}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 4 }}>User ID *</label>
          <input value={userId} onChange={e => { setUserId(e.target.value); setError(""); }} style={{ width: "100%", padding: "8px 10px", border: `1px solid ${error ? C.red : C.gray300}`, fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: needsReason ? 12 : 0 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 4 }}>Password *</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} autoFocus placeholder="Enter your password" style={{ width: "100%", padding: "8px 36px 8px 10px", border: `1px solid ${error ? C.red : C.gray300}`, fontSize: 13, boxSizing: "border-box" }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 8, top: 7, background: "none", border: "none", cursor: "pointer", color: C.gray400 }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        {needsReason && <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 4 }}>{meaning === "REJECTED" ? "Rejection Reason" : "Reason"} *</label><textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Provide reason..." style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} /></div>}
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: 12 }}><AlertTriangle size={14} /> {error}</div>}
      </div>
      <div style={{ padding: "12px 20px 16px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${C.gray200}` }}>
        <button onClick={onCancel} style={{ padding: "8px 20px", background: C.gray200, border: "none", fontSize: 13, cursor: "pointer", color: C.gray700 }}>Cancel</button>
        <button onClick={handleSign} disabled={!canSign} style={{ padding: "8px 20px", background: canSign ? (meaning === "REJECTED" ? C.red : C.blue) : C.gray300, color: canSign ? C.white : C.gray500, border: "none", fontSize: 13, fontWeight: 600, cursor: canSign ? "pointer" : "not-allowed" }}>Sign</button>
      </div>
    </Modal>
  );
};

// ─── Password-Only Modal (subsequent signs in session) ───
const PasswordOnlyModal = ({ meaning, signerName, onSign, onCancel, context, requireReason }) => {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const needsReason = requireReason || meaning === "REJECTED";
  const canSign = password && (!needsReason || reason.trim());
  const handleSign = () => { if (password === "wrong") { setError("Authentication failed. Please check your credentials and try again."); return; } setError(""); onSign({ meaning, reason }); };
  return (
    <Modal onClose={onCancel} width={400}>
      <div style={{ background: C.headerBg, color: C.white, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}><Lock size={18} /><span style={{ fontSize: 14, fontWeight: 600 }}>Electronic Signature</span></div>
      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 12px", background: C.gray100, border: `1px solid ${C.gray200}` }}>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: C.gray800 }}>{signerName}</div><div style={{ fontSize: 11, color: C.gray500 }}>admin</div></div>
          <MeaningBadge meaning={meaning} />
        </div>
        {context && <div style={{ fontSize: 11, color: C.gray500, marginBottom: 12 }}>{context}</div>}
        <div style={{ marginBottom: needsReason ? 12 : 0 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 4 }}>Password *</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} autoFocus placeholder="Enter your password" style={{ width: "100%", padding: "8px 36px 8px 10px", border: `1px solid ${error ? C.red : C.gray300}`, fontSize: 13, boxSizing: "border-box" }} />
            <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 8, top: 7, background: "none", border: "none", cursor: "pointer", color: C.gray400 }}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>
        {needsReason && <div><label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.gray700, marginBottom: 4 }}>{meaning === "REJECTED" ? "Rejection Reason" : "Reason"} *</label><textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Provide reason..." style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.gray300}`, fontSize: 13, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} /></div>}
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red, fontSize: 12 }}><AlertTriangle size={14} /> {error}</div>}
      </div>
      <div style={{ padding: "12px 20px 16px", display: "flex", justifyContent: "flex-end", gap: 8, borderTop: `1px solid ${C.gray200}` }}>
        <button onClick={onCancel} style={{ padding: "8px 20px", background: C.gray200, border: "none", fontSize: 13, cursor: "pointer", color: C.gray700 }}>Cancel</button>
        <button onClick={handleSign} disabled={!canSign} style={{ padding: "8px 20px", background: canSign ? (meaning === "REJECTED" ? C.red : C.blue) : C.gray300, color: canSign ? C.white : C.gray500, border: "none", fontSize: 13, fontWeight: 600, cursor: canSign ? "pointer" : "not-allowed" }}>Sign</button>
      </div>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// ESignatureButton — THE REUSABLE COMPONENT
//
// Props:
//   meaning      — "AUTHORED" | "VALIDATED_AND_RELEASED" | "REJECTED"
//   context      — Description string shown in modal (e.g. "Validate 3 results")
//   requireReason — Force reason field even for non-reject meanings
//   onSign       — Callback({ meaning, reason, userId }) after successful sign
//   onCancel     — Callback when user cancels
//   label        — Button text (defaults based on meaning)
//   disabled     — Disable the button
//   style        — Override button styles
//   children     — Custom button content (overrides label)
//
// Usage in any workflow:
//   <ESignatureButton
//     meaning="VALIDATED_AND_RELEASED"
//     context="Validate & release Potassium result for DEV0126..."
//     onSign={({ meaning, reason }) => { /* save to DB */ }}
//     onCancel={() => {}}
//   />
// ═══════════════════════════════════════════════════════════════════════

const ESignatureButton = ({ meaning, context, requireReason = false, onSign, onCancel, label, disabled = false, style: btnStyle, children }) => {
  const [modalType, setModalType] = useState(null); // null | "certification" | "fullAuth" | "passwordOnly"
  const { session, update } = useEsigSession();
  const signerName = "Admin Admin";

  const defaultLabels = { AUTHORED: "Save & Sign", VALIDATED_AND_RELEASED: "Validate & Sign", REJECTED: "Reject & Sign" };
  const defaultColors = { AUTHORED: C.blue, VALIDATED_AND_RELEASED: C.blue, REJECTED: C.red };
  const btnLabel = label || defaultLabels[meaning] || "Sign";
  const btnColor = defaultColors[meaning] || C.blue;

  const handleClick = () => {
    if (!session.certified) setModalType("certification");
    else if (!session.active) setModalType("fullAuth");
    else setModalType("passwordOnly");
  };

  const handleCertify = () => {
    update(s => { s.certified = true; });
    setModalType("fullAuth");
  };

  const handleSign = ({ userId, meaning: m, reason }) => {
    update(s => { s.active = true; s.count += 1; });
    setModalType(null);
    onSign?.({ meaning: m || meaning, reason, userId });
  };

  const handleCancel = () => { setModalType(null); onCancel?.(); };

  return (
    <>
      <button onClick={handleClick} disabled={disabled} style={{ padding: "8px 20px", background: disabled ? C.gray300 : btnColor, color: disabled ? C.gray500 : C.white, border: "none", fontSize: 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, ...btnStyle }}>
        {children || <><PenTool size={14} /> {btnLabel}</>}
      </button>
      {modalType === "certification" && <CertificationModal user={signerName} onCertify={handleCertify} onCancel={handleCancel} />}
      {modalType === "fullAuth" && <FullAuthModal meaning={meaning} context={context} requireReason={requireReason} onSign={handleSign} onCancel={handleCancel} />}
      {modalType === "passwordOnly" && <PasswordOnlyModal meaning={meaning} signerName={signerName} context={context} requireReason={requireReason} onSign={handleSign} onCancel={handleCancel} />}
    </>
  );
};


// ═══════════════════════════════════════════════════════════════════════
// DEMO APP — Shows the button in context of real OpenELIS screens
// ═══════════════════════════════════════════════════════════════════════

const validationData = [
  { id: "v1", sampleInfo: "20230000000002109", testName: "Amylase updated", sampleType: "Serum", normalRange: "6 - 7", result: "7", pastNotes: "Internal 11/10/2023 07:33 : Redo test\nInternal 07/05/2025 06:36 : Original Re", status: "pending", abnormal: false, signatures: [] },
  { id: "v2", sampleInfo: "20230000000002701", testName: "GPT/ALAT", sampleType: "Serum", normalRange: "7 - 40", result: "15", pastNotes: "", status: "pending", abnormal: false, signatures: [] },
  { id: "v3", sampleInfo: "20230000000002701", testName: "GOT/ASAT", sampleType: "Serum", normalRange: "3 - 40", result: "45", pastNotes: "", status: "pending", abnormal: true, signatures: [] },
  { id: "v4", sampleInfo: "20230000000002701", testName: "Creatinine", sampleType: "Serum", normalRange: "6 - 13", result: "11", pastNotes: "", status: "pending", abnormal: false, signatures: [] },
  { id: "v5", sampleInfo: "20230000000002701", testName: "Amylase updated", sampleType: "Serum", normalRange: "6 - 7", result: "1", pastNotes: "", status: "pending", abnormal: true, signatures: [] },
  { id: "v6", sampleInfo: "25-TST-000-01X", testName: "GPT/ALAT", sampleType: "Serum", normalRange: "7 - 40", result: "45", pastNotes: "", status: "pending", abnormal: true, signatures: [] },
  { id: "v7", sampleInfo: "25-TST-000-01X", testName: "GOT/ASAT", sampleType: "Serum", normalRange: "3 - 40", result: "45", pastNotes: "", status: "pending", abnormal: true, signatures: [] },
  { id: "v8", sampleInfo: "25-TST-000-01Y", testName: "Creatinine", sampleType: "Serum", normalRange: "6 - 13", result: "25", pastNotes: "", status: "pending", abnormal: true, signatures: [] },
];

const resultEntryData = [
  { id: "re1", lines: ["DEV01250000000000001-1", "John, Doe", "NINAAA001, M, 26/10/2021"], testDate: "29/10/2025", analyzer: "MANUAL", testName: "Medium corpuscular volum", sampleType: "Whole Blood", normalRange: "85.00 - 95.00" },
  { id: "re2", lines: ["DEV01250000000000001-1", "John, Doe", "NINAAA001, M, 26/10/2021"], testDate: "29/10/2025", analyzer: "MANUAL", testName: "Neutrophiles", sampleType: "Whole Blood", normalRange: "1500.00 - 700...", expanded: true },
  { id: "re3", lines: ["DEV01250000000000001-1", "John, Doe", "NINAAA001, M, 26/10/2021"], testDate: "29/10/2025", analyzer: "MANUAL", testName: "Eosinophiles", sampleType: "Whole Blood", normalRange: "0.00 - 400.00" },
];

export default function App() {
  const [activeScreen, setActiveScreen] = useState("validation");
  const [rows, setRows] = useState(validationData);
  const [saveChecked, setSaveChecked] = useState({});
  const [retestChecked, setRetestChecked] = useState({});
  const [toast, setToast] = useState(null);
  const [resultInputs, setResultInputs] = useState({});

  const showToast = (msg, type = "success") => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };

  // ─── Validation handlers using ESignatureButton callbacks ───
  const handleValidateSigned = (ids) => ({ meaning, reason }) => {
    const now = "02/09/2026 " + new Date().toLocaleTimeString("en-US", { hour12: false }) + " UTC";
    const sig = { meaning, name: "Admin Admin", time: now, ...(reason ? { reason } : {}) };
    setRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: meaning === "REJECTED" ? "rejected" : "validated", signatures: [...r.signatures, sig] } : r));
    setSaveChecked({}); setRetestChecked({});
    showToast(`${ids.length} result(s) ${meaning === "REJECTED" ? "rejected & signed" : "validated, released & signed"}`);
  };

  const handleResultEntrySigned = (ids) => ({ meaning }) => {
    const now = "02/09/2026 " + new Date().toLocaleTimeString("en-US", { hour12: false }) + " UTC";
    const sig = { meaning, name: "Admin Admin", time: now };
    setRows(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: "entered", signatures: [...r.signatures, sig] } : r));
    showToast(`${ids.length} result(s) saved & signed`);
  };

  const resetDemo = () => {
    _esigSession = { active: false, count: 0, certified: false };
    setRows(validationData); setSaveChecked({}); setRetestChecked({});
    showToast("Demo reset");
  };

  const saveIds = Object.entries(saveChecked).filter(([, v]) => v).map(([k]) => k).filter(id => rows.find(r => r.id === id)?.status === "pending");
  const retestIds = Object.entries(retestChecked).filter(([, v]) => v).map(([k]) => k).filter(id => rows.find(r => r.id === id)?.status === "pending");
  const allPendingIds = rows.filter(r => r.status === "pending").map(r => r.id);
  const normalPendingIds = rows.filter(r => r.status === "pending" && !r.abnormal).map(r => r.id);
  const resultEntryIds = rows.filter(r => r.status === "pending").map(r => r.id);

  const thStyle = { padding: "10px 12px", textAlign: "left", fontWeight: 600, color: C.gray600, fontSize: 12 };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", background: C.white, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); input:focus,textarea:focus,select:focus{outline:2px solid ${C.blue};outline-offset:0} *{box-sizing:border-box}`}</style>

      {/* ─── Header (clean, no session indicator) ─── */}
      <div style={{ background: C.headerBg, color: C.white, padding: "0 16px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Menu size={20} style={{ cursor: "pointer" }} />
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><Shield size={18} /></div>
          <div><div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>OpenELIS Global</div><div style={{ fontSize: 10, opacity: 0.7 }}>Version: 3.2.1.0</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[Search, Bell, User, HelpCircle].map((Icon, i) => <button key={i} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", padding: 8 }}><Icon size={18} /></button>)}
        </div>
      </div>

      {/* ─── Breadcrumb ─── */}
      <div style={{ padding: "8px 24px 0" }}>
        <div style={{ fontSize: 12, color: C.blue }}><span style={{ cursor: "pointer" }}>Home</span> <span style={{ color: C.gray400 }}>/</span></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 20, fontWeight: 400, color: C.gray900, margin: "4px 0 16px" }}>
            {activeScreen === "validation" ? "Validation" : activeScreen === "results" ? "Results" : "Standalone E-Signature Demo"}
          </h1>
          <div style={{ display: "flex", gap: 6 }}>
            {[["results", "Result Entry"], ["validation", "Validation"], ["standalone", "Standalone Demo"]].map(([s, label]) =>
              <button key={s} onClick={() => setActiveScreen(s)} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, background: activeScreen === s ? C.blue : C.white, color: activeScreen === s ? C.white : C.blue, border: `1px solid ${C.blue}`, cursor: "pointer" }}>{label}</button>
            )}
            <button onClick={resetDemo} style={{ padding: "5px 12px", fontSize: 11, fontWeight: 600, background: "#f3e5f5", color: "#7b1fa2", border: "1px solid #ce93d8", cursor: "pointer", marginLeft: 8 }}>Reset Demo</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>

        {/* ═══ STANDALONE DEMO ═══ */}
        {activeScreen === "standalone" && (
          <div>
            <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Reusable ESignatureButton Component</div>
              <div style={{ fontSize: 12, color: C.gray500, marginBottom: 16 }}>Drop this component into any workflow. It manages the full ceremony flow (certification → full auth → password-only) internally. The parent just handles the onSign callback.</div>
              <pre style={{ background: C.gray800, color: "#a5d6ff", padding: 16, fontSize: 11, lineHeight: 1.6, borderRadius: 4, overflowX: "auto", whiteSpace: "pre-wrap" }}>{`<ESignatureButton
  meaning="VALIDATED_AND_RELEASED"
  context="Validate & release Potassium result for DEV0126..."
  onSign={({ meaning, reason, userId }) => {
    // Your workflow logic here — save to DB, update state, etc.
  }}
  onCancel={() => {}}
/>`}</pre>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: C.gray700 }}>Try each button — they all share session state:</div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <ESignatureButton
                meaning="AUTHORED"
                context="Save results as authored — Result Entry"
                onSign={() => showToast("AUTHORED signature recorded")}
              />
              <ESignatureButton
                meaning="VALIDATED_AND_RELEASED"
                context="Validate & release selected results — Validation"
                onSign={() => showToast("VALIDATED_AND_RELEASED signature recorded")}
              />
              <ESignatureButton
                meaning="REJECTED"
                context="Reject result for retest — Validation"
                onSign={({ reason }) => showToast(`REJECTED signature recorded${reason ? `: ${reason}` : ""}`)}
              />
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: C.gray700 }}>Custom styled buttons with the same ceremony:</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <ESignatureButton
                meaning="VALIDATED_AND_RELEASED"
                context="Approve NCE investigation"
                onSign={() => showToast("NCE investigation approved & signed")}
                label="Approve Investigation"
                style={{ background: C.green, borderRadius: 4 }}
              />
              <ESignatureButton
                meaning="AUTHORED"
                context="Submit CAPA action"
                requireReason
                onSign={({ reason }) => showToast(`CAPA submitted: ${reason}`)}
                label="Submit CAPA"
                style={{ background: "#7b1fa2", borderRadius: 4 }}
              />
              <ESignatureButton
                meaning="VALIDATED_AND_RELEASED"
                context="Release final report"
                onSign={() => showToast("Report released & signed")}
                style={{ background: C.teal, borderRadius: 4 }}
              >
                <ShieldCheck size={14} /> Release Report
              </ESignatureButton>
            </div>

            <div style={{ background: C.gray50, border: `1px solid ${C.gray200}`, padding: 16, fontSize: 12, color: C.gray600, lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: C.gray700 }}>Component Props</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ borderBottom: `1px solid ${C.gray200}` }}><th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Prop</th><th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Type</th><th style={{ textAlign: "left", padding: "4px 8px", fontWeight: 600 }}>Description</th></tr></thead>
                <tbody>
                  {[
                    ["meaning", "string", '"AUTHORED" | "VALIDATED_AND_RELEASED" | "REJECTED"'],
                    ["context", "string", "Description shown in signing modal"],
                    ["requireReason", "boolean", "Force reason field even for non-reject"],
                    ["onSign", "function", "Callback with { meaning, reason, userId }"],
                    ["onCancel", "function", "Called when user cancels ceremony"],
                    ["label", "string", "Button text (defaults based on meaning)"],
                    ["disabled", "boolean", "Disable the button"],
                    ["style", "object", "Override button CSS"],
                    ["children", "ReactNode", "Custom button content (overrides label)"],
                  ].map(([p, t, d]) => <tr key={p} style={{ borderBottom: `1px solid ${C.gray100}` }}><td style={{ padding: "4px 8px", fontFamily: "monospace", color: C.blue }}>{p}</td><td style={{ padding: "4px 8px", color: C.gray500 }}>{t}</td><td style={{ padding: "4px 8px" }}>{d}</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ VALIDATION ═══ */}
        {activeScreen === "validation" && <>
          {/* Search */}
          <div style={{ marginBottom: 16, padding: "16px 20px", border: `1px solid ${C.gray200}` }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Search</div>
            <div style={{ fontSize: 12, color: C.gray500, marginBottom: 8 }}>Select Test Unit</div>
            <select style={{ width: "100%", maxWidth: 400, padding: "8px 10px", border: `1px solid ${C.gray300}`, fontSize: 13, appearance: "auto" }}><option>Biochemistry</option><option>Hematology</option></select>
          </div>

          {/* Banner */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: C.orangeBg, border: `1px solid ${C.orangeBorder}`, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><span style={{ color: C.orange, fontSize: 18 }}>⚠</span> = Sample or Order is nonconforming or Test has been rejected</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><input type="checkbox" onChange={e => { if (e.target.checked) { const c = {}; normalPendingIds.forEach(id => c[id] = true); setSaveChecked(c); } e.target.checked = false; }} style={{ accentColor: C.teal }} />Save All Normal</label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><input type="checkbox" onChange={e => { if (e.target.checked) { const c = {}; allPendingIds.forEach(id => c[id] = true); setSaveChecked(c); } e.target.checked = false; }} style={{ accentColor: C.teal }} />Save All Results</label>
              <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><input type="checkbox" onChange={e => { if (e.target.checked) { const c = {}; allPendingIds.forEach(id => c[id] = true); setRetestChecked(c); setSaveChecked({}); } e.target.checked = false; }} style={{ accentColor: C.teal }} />Retest All Tests</label>
            </div>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.gray200}`, fontSize: 13 }}>
            <thead><tr style={{ background: C.gray50, borderBottom: `2px solid ${C.gray200}` }}>
              {["Sample Info", "Test Name", "Normal Range", "Result", "Save", "Retest", "Notes", "Past Notes"].map(h => <th key={h} style={{ ...thStyle, textAlign: (h === "Save" || h === "Retest") ? "center" : "left" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(r => {
                const done = r.status !== "pending";
                const bg = r.status === "validated" ? C.greenBg : r.status === "rejected" ? C.redBg : C.white;
                return (
                  <tr key={r.id} style={{ background: bg, borderBottom: `1px solid ${C.gray200}` }}>
                    <td style={{ padding: 12, verticalAlign: "top" }}><div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Copy size={14} style={{ color: C.gray400, marginTop: 2, cursor: "pointer", flexShrink: 0 }} /><span style={{ fontFamily: "monospace", fontSize: 12 }}>{r.sampleInfo}</span></div></td>
                    <td style={{ padding: 12, verticalAlign: "top" }}><div>{r.testName}</div><div style={{ fontSize: 11, color: C.gray500 }}>({r.sampleType})</div></td>
                    <td style={{ padding: 12, verticalAlign: "top" }}>{r.normalRange}</td>
                    <td style={{ padding: 12, verticalAlign: "top" }}><span style={{ fontWeight: 600, color: r.abnormal ? C.red : C.gray800 }}>{r.result}</span></td>
                    <td style={{ padding: 12, textAlign: "center", verticalAlign: "top" }}>
                      {done ? (r.status === "validated" ? <CheckCircle size={16} color={C.green} /> : <XCircle size={16} color={C.red} />) :
                        <input type="checkbox" checked={!!saveChecked[r.id]} onChange={e => { setSaveChecked(p => ({ ...p, [r.id]: e.target.checked })); if (e.target.checked) setRetestChecked(p => ({ ...p, [r.id]: false })); }} style={{ accentColor: C.teal }} />}
                    </td>
                    <td style={{ padding: 12, textAlign: "center", verticalAlign: "top" }}>
                      {!done && <input type="checkbox" checked={!!retestChecked[r.id]} onChange={e => { setRetestChecked(p => ({ ...p, [r.id]: e.target.checked })); if (e.target.checked) setSaveChecked(p => ({ ...p, [r.id]: false })); }} style={{ accentColor: C.teal }} />}
                    </td>
                    <td style={{ padding: "12px 8px", verticalAlign: "top" }}>
                      {done ? <div style={{ fontSize: 11, color: C.gray500 }}>{r.signatures.map((s, i) => <div key={i}><span style={{ color: s.meaning === "VALIDATED_AND_RELEASED" ? C.green : C.red, fontWeight: 600 }}>{s.meaning === "VALIDATED_AND_RELEASED" ? "✓ Released" : "✗ Rejected"}</span> by {s.name}, {s.time}{s.reason && <div style={{ color: C.red }}>Reason: {s.reason}</div>}</div>)}</div>
                        : <textarea rows={1} style={{ width: "100%", padding: "4px 6px", border: `1px solid ${C.gray200}`, fontSize: 12, background: C.inputBg, resize: "vertical", fontFamily: "inherit" }} />}
                    </td>
                    <td style={{ padding: "12px 8px", verticalAlign: "top", fontSize: 11, color: C.gray500, maxWidth: 200 }}>{r.pastNotes && r.pastNotes.split("\n").map((l, i) => <div key={i}>{l}</div>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: `1px solid ${C.gray200}`, fontSize: 12, color: C.gray600, background: C.gray50 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>Items per page <select style={{ padding: "2px 4px", border: `1px solid ${C.gray300}`, fontSize: 12 }}><option>100</option></select> <span style={{ color: C.gray500 }}>1-{rows.length} of {rows.length} items</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>1 <span style={{ color: C.gray500 }}>of 1 page</span> <button style={{ background: "none", border: "none", color: C.gray400 }}>‹</button><button style={{ background: "none", border: "none", color: C.gray400 }}>›</button></div>
          </div>

          {/* Action buttons — using ESignatureButton */}
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            {saveIds.length > 0 && (
              <ESignatureButton
                meaning="VALIDATED_AND_RELEASED"
                context={`Validate & release ${saveIds.length} result(s)`}
                onSign={handleValidateSigned(saveIds)}
                label={`Save (${saveIds.length} to validate)`}
              />
            )}
            {retestIds.length > 0 && (
              <ESignatureButton
                meaning="REJECTED"
                context={`Reject ${retestIds.length} result(s) for retest`}
                onSign={handleValidateSigned(retestIds)}
                label={`Save (${retestIds.length} to retest)`}
              />
            )}
            {saveIds.length === 0 && retestIds.length === 0 && (
              <button disabled style={{ padding: "10px 24px", background: C.gray300, color: C.gray500, border: "none", fontSize: 14, fontWeight: 500, cursor: "not-allowed" }}>Save</button>
            )}
          </div>
        </>}

        {/* ═══ RESULTS ENTRY ═══ */}
        {activeScreen === "results" && <>
          <div style={{ marginBottom: 16, padding: "16px 20px", border: `1px solid ${C.gray200}` }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Search</div>
            <div style={{ fontSize: 12, color: C.gray500, marginBottom: 8 }}>Select Test Unit</div>
            <select style={{ width: "100%", maxWidth: 400, padding: "8px 10px", border: `1px solid ${C.gray300}`, fontSize: 13, appearance: "auto" }}><option>Hematology</option><option>Biochemistry</option></select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: C.orangeBg, border: `1px solid ${C.orangeBorder}`, fontSize: 13 }}><span style={{ color: C.orange, fontSize: 18 }}>⚠</span> = Sample or Order is nonconforming or Test has been rejected</div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.gray200}`, fontSize: 13 }}>
            <thead><tr style={{ background: C.gray50, borderBottom: `2px solid ${C.gray200}` }}>
              <th style={{ width: 30 }}></th>
              {["Sample Info", "Test Date", "Analyzer R...", "Test Name", "Normal Range", "Accept", "Result", "Current Result", "Notes"].map(h => <th key={h} style={{ ...thStyle, textAlign: h === "Accept" ? "center" : "left" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {resultEntryData.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${C.gray200}`, verticalAlign: "top" }}>
                  <td style={{ padding: "12px 4px 12px 12px", textAlign: "center" }}>{r.expanded ? <ChevronDown size={16} color={C.gray500} /> : <ChevronRight size={16} color={C.gray500} />}</td>
                  <td style={{ padding: 12 }}><div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}><Copy size={14} style={{ color: C.gray400, marginTop: 2, flexShrink: 0 }} /><div style={{ fontSize: 12, fontFamily: "monospace", lineHeight: 1.5 }}>{r.lines.map((l, i) => <div key={i}>{l}</div>)}</div></div></td>
                  <td style={{ padding: 12 }}>{r.testDate}</td>
                  <td style={{ padding: 12 }}>{r.analyzer}</td>
                  <td style={{ padding: 12 }}><div>{r.testName}</div><div style={{ fontSize: 11, color: C.gray500 }}>({r.sampleType})</div></td>
                  <td style={{ padding: 12 }}>{r.normalRange}</td>
                  <td style={{ padding: 12, textAlign: "center" }}><input type="checkbox" style={{ accentColor: C.teal }} /></td>
                  <td style={{ padding: 12 }}><input type="text" value={resultInputs[r.id] || ""} onChange={e => setResultInputs(p => ({ ...p, [r.id]: e.target.value }))} style={{ width: 80, padding: "4px 6px", border: `1px solid ${C.gray200}`, fontSize: 12, background: C.inputBg }} /></td>
                  <td style={{ padding: 12, color: C.gray500 }}></td>
                  <td style={{ padding: 12 }}><textarea rows={1} style={{ width: "100%", padding: "4px 6px", border: `1px solid ${C.gray200}`, fontSize: 12, background: C.inputBg, resize: "vertical", fontFamily: "inherit" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderTop: `1px solid ${C.gray200}`, fontSize: 12, color: C.gray600, background: C.gray50 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>Items per page <select style={{ padding: "2px 4px", border: `1px solid ${C.gray300}`, fontSize: 12 }}><option>100</option></select> <span style={{ color: C.gray500 }}>1-3 of 3 items</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>1 <span style={{ color: C.gray500 }}>of 1 page</span> <button style={{ background: "none", border: "none", color: C.gray400 }}>‹</button><button style={{ background: "none", border: "none", color: C.gray400 }}>›</button></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <ESignatureButton
              meaning="AUTHORED"
              context={`Sign ${resultEntryIds.length} result(s) as authored`}
              onSign={handleResultEntrySigned(resultEntryIds)}
              label="Save"
              style={{ padding: "10px 24px", fontSize: 14, fontWeight: 500 }}
            />
          </div>
        </>}

        {/* Guide */}
        <div style={{ marginTop: 24, marginBottom: 24, padding: 16, background: C.gray50, border: `1px solid ${C.gray200}`, fontSize: 12, color: C.gray600, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: C.gray700 }}>How to use this mockup</div>
          <strong>Validation:</strong> Check "Save" or "Retest" boxes → click Save button → e-signature ceremony triggers.<br />
          <strong>Result Entry:</strong> Click Save → "Authored" e-signature ceremony.<br />
          <strong>Standalone Demo:</strong> Shows the reusable ESignatureButton in isolation with different meanings, custom styles, and a props table.<br />
          <strong>Session flow:</strong> 1st ever → Certification. 1st in session → Full auth (User ID + Password). Subsequent → Password only.<br />
          <strong>Error test:</strong> Type "wrong" as password. <strong>Reset Demo:</strong> Clears session & certification state.
        </div>
      </div>

      {/* Toast */}
      {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2000, display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: toast.type === "success" ? C.green : C.red, color: C.white, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: 13 }}><CheckCircle size={16} />{toast.message}<button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: C.white, cursor: "pointer", marginLeft: 8 }}><X size={14} /></button></div>}
    </div>
  );
}
