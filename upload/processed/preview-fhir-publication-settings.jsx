import { useState } from "react";
import { CheckCircle, AlertCircle, Wifi, RefreshCw, Save, ChevronDown, ChevronUp, ExternalLink, Key, Copy, Upload, Trash2, ShieldCheck } from "lucide-react";

const t = (key, fallback) => fallback;

const RESOURCES = [
  { type: "DiagnosticReport", enabled: true,  lastPublished: "2026-03-23 08:14", count: 1842, errors: 3  },
  { type: "Observation",      enabled: true,  lastPublished: "2026-03-23 08:14", count: 3688, errors: 3  },
  { type: "ServiceRequest",   enabled: true,  lastPublished: "2026-03-23 08:14", count: 1842, errors: 0  },
  { type: "Device",           enabled: true,  lastPublished: "2026-03-22 17:00", count: 0,    errors: 0  },
  { type: "Organization",     enabled: true,  lastPublished: "2026-03-20 09:30", count: 0,    errors: 0  },
];

function Tag({ color, children }) {
  const colors = {
    green:  { bg: "#defbe6", text: "#0e6027", border: "#a7f0ba" },
    red:    { bg: "#fff1f1", text: "#a2191f", border: "#ffb3b8" },
    blue:   { bg: "#edf5ff", text: "#0043ce", border: "#a6c8ff" },
    gray:   { bg: "#f4f4f4", text: "#525252", border: "#e0e0e0" },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 2, padding: "2px 8px", fontSize: 12, fontWeight: 500,
    }}>
      {children}
    </span>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 4, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#161616", marginBottom: "1rem", borderBottom: "1px solid #f4f4f4", paddingBottom: "0.5rem" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, placeholder, type = "text", helper, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#525252" }}>{label}</label>
      <input
        readOnly
        type={type}
        defaultValue={value || ""}
        placeholder={placeholder}
        style={{
          border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px 12px",
          fontSize: 14, color: "#161616", background: "#fff", outline: "none",
          width: "100%", boxSizing: "border-box",
        }}
      />
      {helper && <span style={{ fontSize: 11, color: "#6f6f6f" }}>{helper}</span>}
    </div>
  );
}

function Select({ label, value, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#525252" }}>{label}</label>
      <select defaultValue={value} style={{
        border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px 12px",
        fontSize: 14, color: "#161616", background: "#fff", width: "100%",
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 40, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
      background: on ? "#0f62fe" : "#8d8d8d", position: "relative", transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 22 : 2,
        width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  );
}

function Button({ children, primary, ghost, icon: Icon, onClick, small }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: small ? "6px 12px" : "10px 16px",
      background: primary ? "#0f62fe" : ghost ? "transparent" : "#393939",
      color: primary || !ghost ? "#fff" : "#0f62fe",
      border: ghost ? "1px solid #0f62fe" : "none",
      borderRadius: 2, fontSize: 14, fontWeight: 500, cursor: "pointer",
    }}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

const SAMPLE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a8mXvZ3kPqW5oRtN1
cFhJ7mYs4Lx9TqD2bK6nE0pA3wVuG8iR5dMcOyBfHlZ2NsXeP4gKtJ1QmU7r
vCnIoD3aWb6Fc5YhL8xEsT0uK2pR9lMdV4NqOzBgW1eHiS6jXcPfA7mYtR3b
K9uJ0vL5nEwDqC2xHo8sB4iT1pMfU3aW6Vc7yNrOzBgW1eHiS6jXcPfA7mYt
R3bK9uJ0vL5nEwDqC2xHo8sB4iT1pMfU3aW6Vc7yNrOzBgW1eHiS6jXcPfA7
mYtR3bK9uJ0vL5nEwDqC2xHo8sB4iT1pMfU3aW6Vc7yNrOzBgW1eHiQ==
-----END PUBLIC KEY-----`;

export default function FhirPublicationSettings() {
  const [authType, setAuthType] = useState("BEARER_TOKEN");
  const [pubMode, setPubMode]   = useState("SYNCHRONOUS");
  const [toggles, setToggles]   = useState(Object.fromEntries(RESOURCES.map(r => [r.type, r.enabled])));
  const [connStatus, setConnStatus] = useState(null);
  const [saved, setSaved]           = useState(false);
  const [advOpen, setAdvOpen]       = useState(false);

  // Private Key JWT state
  const [keyStatus, setKeyStatus]       = useState("NOT_CONFIGURED"); // NOT_CONFIGURED | ACTIVE
  const [showUploadKey, setShowUploadKey] = useState(false);
  const [keyMsg, setKeyMsg]             = useState(null); // { type: 'success'|'info'|'error', text }
  const [keyCopied, setKeyCopied]       = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleGenerateKey = () => {
    setKeyStatus("ACTIVE");
    setShowUploadKey(false);
    setKeyMsg({ type: "success", text: "Key pair generated. Copy the public key and register it on the HAPI FHIR server before enabling." });
    setTimeout(() => setKeyMsg(null), 6000);
  };

  const handleUploadKey = () => {
    setKeyStatus("ACTIVE");
    setShowUploadKey(false);
    setKeyMsg({ type: "success", text: "Private key uploaded and public key derived successfully." });
    setTimeout(() => setKeyMsg(null), 6000);
  };

  const handleCopyKey = () => {
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2500);
  };

  const handleRemoveKey = () => {
    setKeyStatus("NOT_CONFIGURED");
    setConfirmRemove(false);
    setKeyMsg({ type: "info", text: "Key pair removed. FHIR outbound push has been disabled." });
    setTimeout(() => setKeyMsg(null), 5000);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', Arial, sans-serif", background: "#f4f4f4", minHeight: "100vh", padding: "1.5rem" }}>
      {/* Header bar */}
      <div style={{ background: "#161616", color: "#fff", padding: "8px 1.5rem", margin: "-1.5rem -1.5rem 1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#8d8d8d" }}>Admin</span>
        <span style={{ color: "#525252" }}>/</span>
        <span style={{ fontSize: 13, color: "#8d8d8d" }}>Integration</span>
        <span style={{ color: "#525252" }}>/</span>
        <span style={{ fontSize: 13 }}>FHIR Publication Settings</span>
      </div>

      <div style={{ maxWidth: 960 }}>
        {/* Title */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: "#161616", margin: 0 }}>FHIR Publication Settings</h1>
          <p style={{ fontSize: 14, color: "#525252", marginTop: 4 }}>
            Configure how OpenELIS publishes lab results to the central FHIR repository for disease surveillance and Superset dashboards.
          </p>
        </div>

        {saved && (
          <div style={{ background: "#defbe6", border: "1px solid #a7f0ba", borderLeft: "4px solid #24a148", padding: "12px 16px", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={16} color="#0e6027" />
            <span style={{ fontSize: 14, color: "#0e6027", fontWeight: 500 }}>Settings saved successfully.</span>
          </div>
        )}

        {/* Connection */}
        <SectionCard title="FHIR Repository Connection">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "0.75rem" }}>
            <Field label={t("label.fhirOutbound.remoteUrl", "FHIR Repository URL")}
              placeholder="https://hapi.nationallab.pg/fhir"
              helper="The base URL of your central HAPI FHIR R4 server." />
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#525252", display: "block", marginBottom: 4 }}>
                {t("label.fhirOutbound.authType", "Authentication Type")}
              </label>
              <select value={authType} onChange={e => setAuthType(e.target.value)} style={{
                border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px 12px", fontSize: 14, width: "100%",
              }}>
                <option value="NONE">{t("label.fhirOutbound.authType.none", "None")}</option>
                <option value="BEARER_TOKEN">{t("label.fhirOutbound.authType.bearer", "Bearer Token")}</option>
                <option value="BASIC">{t("label.fhirOutbound.authType.basic", "Basic Auth")}</option>
                <option value="PRIVATE_KEY_JWT">{t("label.fhirOutbound.authType.privateKeyJwt", "Private Key JWT (Signed Assertion)")}</option>
              </select>
            </div>
          </div>

          {/* Bearer / Basic credential field */}
          {(authType === "BEARER_TOKEN" || authType === "BASIC") && (
            <div style={{ maxWidth: 480, marginBottom: "0.75rem" }}>
              <Field label={authType === "BASIC"
                  ? t("label.fhirOutbound.authUsername", "Username : Password")
                  : t("label.fhirOutbound.authToken", "Bearer Token")}
                type="password" placeholder="••••••••"
                helper="Stored encrypted at rest. Not shown after saving." />
            </div>
          )}

          {/* ── Private Key JWT section ── */}
          {authType === "PRIVATE_KEY_JWT" && (
            <div style={{ border: "1px solid #c6c6c6", borderRadius: 2, padding: "1rem", background: "#f4f4f4", marginBottom: "0.75rem" }}>

              {/* Key status row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Key size={14} color="#525252" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#161616" }}>
                    {t("heading.fhirOutbound.keyManagement", "Key Management")}
                  </span>
                  {keyStatus === "ACTIVE"
                    ? <Tag color="green"><ShieldCheck size={10} /> {t("label.fhirOutbound.keyStatus.active", "Active")}</Tag>
                    : <Tag color="red">{t("label.fhirOutbound.keyStatus.notConfigured", "Not Configured")}</Tag>}
                </div>
                {keyStatus === "ACTIVE" && !confirmRemove && (
                  <button onClick={() => setConfirmRemove(true)} style={{
                    background: "transparent", border: "1px solid #da1e28", color: "#da1e28",
                    borderRadius: 2, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <Trash2 size={11} /> {t("button.fhirOutbound.removeKey", "Remove Key")}
                  </button>
                )}
                {confirmRemove && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#da1e28" }}>Remove key and disable push?</span>
                    <button onClick={handleRemoveKey} style={{ background: "#da1e28", color: "#fff", border: "none", borderRadius: 2, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Confirm</button>
                    <button onClick={() => setConfirmRemove(false)} style={{ background: "transparent", border: "1px solid #8d8d8d", color: "#525252", borderRadius: 2, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                  </div>
                )}
              </div>

              {/* Active key details */}
              {keyStatus === "ACTIVE" && (
                <div style={{ display: "flex", gap: "2rem", fontSize: 12, color: "#525252", marginBottom: "0.75rem", background: "#fff", border: "1px solid #e0e0e0", borderRadius: 2, padding: "8px 12px" }}>
                  <span><strong>{t("label.fhirOutbound.keyAlgorithm", "Algorithm")}:</strong> RSA-2048</span>
                  <span><strong>{t("label.fhirOutbound.keyFingerprint", "Fingerprint")}:</strong> SHA256:a3b4c5d6e7f8a9b0</span>
                  <span><strong>{t("label.fhirOutbound.keyCreatedAt", "Generated")}:</strong> 2026-03-24 09:00</span>
                </div>
              )}

              {/* Key feedback notification */}
              {keyMsg && (
                <div style={{
                  marginBottom: "0.75rem", padding: "8px 12px", borderRadius: 2, fontSize: 13,
                  display: "flex", alignItems: "center", gap: 8,
                  background: keyMsg.type === "success" ? "#defbe6" : keyMsg.type === "info" ? "#edf5ff" : "#fff1f1",
                  border: `1px solid ${keyMsg.type === "success" ? "#a7f0ba" : keyMsg.type === "info" ? "#a6c8ff" : "#ffb3b8"}`,
                  color: keyMsg.type === "success" ? "#0e6027" : keyMsg.type === "info" ? "#0043ce" : "#a2191f",
                }}>
                  <CheckCircle size={14} />
                  {keyMsg.text}
                </div>
              )}

              {/* Generate + Upload buttons */}
              <div style={{ display: "flex", gap: 8, marginBottom: "0.75rem" }}>
                <button onClick={handleGenerateKey} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "#0f62fe", color: "#fff", border: "none",
                  borderRadius: 2, padding: "7px 14px", fontSize: 13, cursor: "pointer",
                }}>
                  <Key size={13} /> {t("button.fhirOutbound.generateKeyPair", "Generate New Key Pair")}
                </button>
                <button onClick={() => setShowUploadKey(p => !p)} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "transparent", color: "#0f62fe", border: "1px solid #0f62fe",
                  borderRadius: 2, padding: "7px 14px", fontSize: 13, cursor: "pointer",
                }}>
                  <Upload size={13} /> {t("button.fhirOutbound.uploadKey", "Upload Private Key (PEM)")}
                  {showUploadKey ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>

              {/* Upload accordion */}
              {showUploadKey && (
                <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 2, padding: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#525252", marginBottom: 4 }}>
                    Private Key (PKCS8 or PKCS1 PEM)
                  </div>
                  <textarea rows={5} placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"} style={{
                    width: "100%", fontFamily: "monospace", fontSize: 12,
                    border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px",
                    boxSizing: "border-box", resize: "vertical", color: "#161616",
                  }} />
                  <div style={{ marginTop: "0.5rem" }}>
                    <button onClick={handleUploadKey} style={{
                      background: "#393939", color: "#fff", border: "none",
                      borderRadius: 2, padding: "6px 14px", fontSize: 13, cursor: "pointer",
                    }}>
                      {t("button.fhirOutbound.uploadKey", "Upload Key")}
                    </button>
                  </div>
                </div>
              )}

              {/* Public key display */}
              {keyStatus === "ACTIVE" && (
                <div style={{ marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#525252" }}>
                      {t("label.fhirOutbound.publicKeyPem", "Public Key (PEM)")} — register this on the HAPI FHIR server
                    </label>
                    <button onClick={handleCopyKey} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      background: "transparent", color: keyCopied ? "#24a148" : "#0f62fe",
                      border: `1px solid ${keyCopied ? "#24a148" : "#0f62fe"}`,
                      borderRadius: 2, padding: "4px 10px", fontSize: 12, cursor: "pointer",
                    }}>
                      <Copy size={11} />
                      {keyCopied ? t("message.fhirOutbound.keyCopied", "Copied!") : t("button.fhirOutbound.copyPublicKey", "Copy Public Key")}
                    </button>
                  </div>
                  <textarea readOnly rows={5} value={SAMPLE_PUBLIC_KEY} style={{
                    width: "100%", fontFamily: "monospace", fontSize: 11,
                    border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px",
                    background: "#f4f4f4", resize: "none", boxSizing: "border-box", color: "#161616",
                  }} />
                </div>
              )}

              {/* JWT configuration fields */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <Field label={t("label.fhirOutbound.jwtIssuerId", "Issuer ID (iss / sub claim)")}
                  placeholder="png-site-portmoresby-lab"
                  helper="Must match the HAPI FHIR interceptor trusted-issuers table." />
                <Field label={t("label.fhirOutbound.jwtAudience", "JWT Audience (aud claim)")}
                  placeholder="https://hapi.nationallab.pg/fhir"
                  helper="Defaults to Remote FHIR Base URL if left blank." />
                <Field label={t("label.fhirOutbound.jwtExpiry", "Token Expiry (minutes)")}
                  value="10" helper="1–60 min. Default: 10." />
              </div>

              {/* Setup instruction callout */}
              <div style={{ background: "#edf5ff", border: "1px solid #a6c8ff", borderRadius: 2, padding: "10px 14px", fontSize: 13, color: "#0043ce", display: "flex", gap: 8 }}>
                <ShieldCheck size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>HAPI FHIR server setup required:</strong> Copy the public key above and register it in the HAPI FHIR server's <code style={{ background: "#dde1ff", padding: "1px 4px", borderRadius: 2 }}>fhir_trusted_issuers</code> table using the Issuer ID as the lookup key. See FRS Appendix B for full configuration instructions.
                </span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button ghost icon={Wifi} onClick={() => setConnStatus("success")}>
              {t("button.fhirOutbound.testConnection", "Test Connection")}
            </Button>
            {connStatus === "success" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#defbe6", border: "1px solid #a7f0ba", borderRadius: 2, padding: "6px 12px" }}>
                <CheckCircle size={14} color="#24a148" />
                <span style={{ fontSize: 13, color: "#0e6027" }}>
                  {t("message.fhirOutbound.testSuccess", "Connection successful — FHIR R4 CapabilityStatement received")}
                </span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Publication Mode */}
        <SectionCard title="Publication Mode">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#525252", display: "block", marginBottom: 4 }}>Publication Mode</label>
              <select value={pubMode} onChange={e => setPubMode(e.target.value)} style={{
                border: "1px solid #8d8d8d", borderRadius: 2, padding: "8px 12px", fontSize: 14, width: "100%",
              }}>
                <option value="SYNCHRONOUS">Synchronous (on result validation)</option>
                <option value="ASYNC_BATCH">Batch (scheduled interval)</option>
              </select>
            </div>
            {pubMode === "ASYNC_BATCH" && (
              <Field label="Batch Interval (minutes)" placeholder="15" helper="1–1440 minutes" />
            )}
          </div>
          {/* Retry Policy accordion */}
          <div style={{ marginTop: "1rem", border: "1px solid #e0e0e0", borderRadius: 2 }}>
            <button onClick={() => setAdvOpen(p => !p)} style={{
              width: "100%", background: "#f4f4f4", border: "none", padding: "10px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#525252",
            }}>
              Advanced: Retry Policy
              {advOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {advOpen && (
              <div style={{ padding: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <Field label="Retry Attempts" value="3" helper="0–10 retries on publish failure" />
                <Field label="Retry Interval (minutes)" value="5" helper="1–60 minutes between retries" />
              </div>
            )}
          </div>
        </SectionCard>

        {/* Resource Status Table */}
        <SectionCard title="Resource Publication Status">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f4f4f4" }}>
                {["Resource Type", "Publish", "Last Published", "Records (24h)", "Errors (24h)"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "#525252", fontSize: 12, borderBottom: "1px solid #e0e0e0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((r, i) => (
                <tr key={r.type} style={{ background: i % 2 === 0 ? "#fff" : "#f4f4f4" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{r.type}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <Toggle on={toggles[r.type]} onToggle={() => setToggles(p => ({ ...p, [r.type]: !p[r.type] }))} />
                  </td>
                  <td style={{ padding: "10px 12px", color: "#525252", fontSize: 13 }}>{r.lastPublished}</td>
                  <td style={{ padding: "10px 12px" }}>{r.count.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {r.errors > 0
                      ? <Tag color="red"><AlertCircle size={10} /> {r.errors} errors</Tag>
                      : <Tag color="green"><CheckCircle size={10} /> OK</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "0.75rem" }}>
            <Button ghost icon={RefreshCw} small>Publish Now</Button>
          </div>
        </SectionCard>

        {/* Dashboard Links */}
        <SectionCard title="Dashboard Links">
          <p style={{ fontSize: 13, color: "#525252", marginBottom: "1rem" }}>
            The Superset URL will appear as a <strong>"Dashboards"</strong> entry in the OpenELIS side navigation for users with the <code style={{ background: "#f4f4f4", padding: "1px 4px", borderRadius: 2 }}>dashboard.navigate</code> permission.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", maxWidth: 600 }}>
            <Field label="Superset Dashboard URL" placeholder="https://superset.your-program.org"
              helper="Opens in a new tab from the OpenELIS navigation menu." />
            <Field label="DHIS2 FHIR Push URL" placeholder="https://dhis2.ministry.gov/api/fhir/R4"
              helper="External DHIS2 instance. Receives FHIR bundle on each batch run." />
          </div>
          {/* Nav preview */}
          <div style={{ marginTop: "1rem", background: "#f4f4f4", border: "1px solid #e0e0e0", borderRadius: 2, padding: "0.75rem 1rem", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ExternalLink size={13} color="#0f62fe" />
            <span style={{ fontSize: 13, color: "#0f62fe", fontWeight: 500 }}>Dashboards</span>
            <span style={{ fontSize: 12, color: "#6f6f6f" }}>— will appear in side nav under Reports</span>
          </div>
        </SectionCard>

        {/* Save Bar */}
        <div style={{ display: "flex", gap: 8, paddingBottom: "2rem" }}>
          <Button primary icon={Save} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save Settings</Button>
          <Button ghost>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
