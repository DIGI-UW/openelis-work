import React, { useState } from 'react';

// ============================================================================
// BARCODE CONFIGURATION PAGE MOCKUP — Barcode Labels v1 (OGC-284), ADMIN SURFACE ONLY
// Administration → Master Lists → Barcode Configuration
//
// ⚠️ This mockup is for VISUAL FIDELITY ONLY — it uses raw HTML elements with
// inline styles instead of @carbon/react components. It accurately represents
// what the current admin page looks like to lab admins, but is NOT a
// Carbon-DSL handoff artifact. Engineering should consume the v2 mockup at
// designs/admin-config/barcode-labels-v2.jsx for Carbon component patterns.
//
// Scope (v1.2 — May 2026): the admin page configures ONLY the two system-
// default label types every OpenELIS deployment uses — Order and Specimen.
// Block, Slide, Freezer, and any other site-specific label types are managed
// in OGC-285 (Barcode Labels v2) as activatable seeded Label Presets.
//
// The Order Entry Labels section and the post-save print dialog (including
// editable per-row quantities) also ship as part of OGC-285. They are
// previewed in designs/admin-config/barcode-config.html under a clearly-marked
// "Designed for OGC-285 (Barcode Labels v2)" appendix; the full v2 design is
// at designs/admin-config/barcode-labels-v2.jsx.
// ============================================================================

export default function BarcodeConfigurationPage() {
  const [config, setConfig] = useState({
    // Default counts (Order + Specimen only — v1 admin scope)
    orderDefault: 2,
    specimenDefault: 1,
    // Max counts
    orderMax: 10,
    specimenMax: 5,
    // Dimensions
    orderHeight: 25.4,
    orderWidth: 76.2,
    specimenHeight: 25.4,
    specimenWidth: 76.2,
    // Other settings
    useOrderEntryFormat: false,
    preprinterPrefix: 'LNSP',
  });

  const [saved, setSaved] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // BC-3 cross-field validation: Default ≤ Max for Order and Specimen.
  const validateConfig = (c) => {
    const errors = [];
    const pairs = [
      ['Order', c.orderDefault, c.orderMax],
      ['Specimen', c.specimenDefault, c.specimenMax],
    ];
    pairs.forEach(([label, def, max]) => {
      if (Number(def) > Number(max)) {
        errors.push(`${label}: default (${def}) cannot exceed max (${max}).`);
      }
      if (Number(def) < 0 || Number(max) < 0) {
        errors.push(`${label}: counts must be non-negative.`);
      }
    });
    return errors;
  };

  const handleSave = () => {
    const errors = validateConfig(config);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setSaved(false);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const styles = {
    container: {
      fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#f4f4f4',
      minHeight: '100vh',
    },
    header: {
      marginBottom: '24px',
    },
    breadcrumb: {
      fontSize: '12px',
      color: '#666',
      marginBottom: '8px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      margin: 0,
      color: '#161616',
    },
    section: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px',
      overflow: 'hidden',
    },
    sectionHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#fafafa',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#161616',
      margin: 0,
    },
    sectionSubtitle: {
      fontSize: '13px',
      color: '#666',
      marginTop: '4px',
    },
    sectionBody: {
      padding: '20px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      maxWidth: '480px',
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '24px',
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
    },
    fieldGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: 500,
      color: '#525252',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    inputSmall: {
      width: '100%',
      padding: '8px 10px',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    helperText: {
      fontSize: '11px',
      color: '#888',
      marginTop: '4px',
    },
    dimensionGroup: {
      backgroundColor: '#fafafa',
      padding: '16px',
      borderRadius: '6px',
      border: '1px solid #e8e8e8',
    },
    dimensionTitle: {
      fontSize: '14px',
      fontWeight: 600,
      marginBottom: '12px',
      color: '#161616',
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#161616',
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '16px 20px',
      borderTop: '1px solid #e0e0e0',
      backgroundColor: '#fafafa',
    },
    primaryButton: {
      padding: '10px 20px',
      backgroundColor: '#0f62fe',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    secondaryButton: {
      padding: '10px 20px',
      backgroundColor: 'white',
      color: '#0f62fe',
      border: '1px solid #0f62fe',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
    },
    successBanner: {
      backgroundColor: '#defbe6',
      border: '1px solid #198038',
      borderRadius: '4px',
      padding: '12px 16px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#198038',
    },
    newBadge: {
      display: 'inline-block',
      padding: '2px 8px',
      backgroundColor: '#0f62fe',
      color: 'white',
      borderRadius: '12px',
      fontSize: '10px',
      fontWeight: 600,
      marginLeft: '8px',
      verticalAlign: 'middle',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.breadcrumb}>
          Administration → Master Lists → Barcode Configuration
        </div>
        <h1 style={styles.title}>Barcode Configuration</h1>
      </div>

      {saved && (
        <div
          style={styles.successBanner}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" style={{ marginRight: '8px' }}>✓</span>
          <span><strong>Saved.</strong> Barcode configuration saved successfully.</span>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            ...styles.successBanner,
            background: '#fff1f1',
            border: '1px solid #da1e28',
            color: '#a2191f',
          }}
        >
          <strong>Cannot save — validation errors:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Number Bar Code Label Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Number Bar Code Label</h2>
        </div>
        <div style={styles.sectionBody}>
          {/* Default Bar Code Labels */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Default Bar Code Labels
            </h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Indicate the default number of bar code labels which should be printed with every order and specimen.
            </p>
            <div style={styles.grid}>
              <div>
                <label style={styles.label}>Order</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.orderDefault}
                  onChange={(e) => setConfig({ ...config, orderDefault: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label style={styles.label}>Specimen</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.specimenDefault}
                  onChange={(e) => setConfig({ ...config, specimenDefault: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Maximum Bar Code Labels */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              Maximum Bar Code Labels
            </h3>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
              Indicate the maximum number of bar code labels that can be printed for each order or specimen.
              Once the maximum has been reached, a user will be unable to print additional labels.
            </p>
            <div style={styles.grid}>
              <div>
                <label style={styles.label}>Order</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.orderMax}
                  onChange={(e) => setConfig({ ...config, orderMax: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label style={styles.label}>Specimen</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.specimenMax}
                  onChange={(e) => setConfig({ ...config, specimenMax: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Code Label Elements Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Bar Code Label Elements</h2>
          <p style={styles.sectionSubtitle}>
            Check the box next to the optional elements that should appear on bar code labels. Lab Number is always included.
          </p>
        </div>
        <div style={styles.sectionBody}>
          {/* Mandatory Elements */}
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Mandatory Elements (all label types)</h3>
            <div style={{ fontSize: '14px', color: '#0f62fe' }}>• Lab Number</div>
          </div>

          {/* Optional Elements */}
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Optional Elements</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Order Labels */}
            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>Order Labels</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient Name
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient Date of Birth
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Site ID
                </label>
              </div>
            </div>

            {/* Specimen Labels */}
            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>Specimen Labels</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient Name
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient Date of Birth
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Collection Date and Time
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Collected By
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Tests
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient Sex
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preprinted Bar Code Accession number */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Preprinted Bar Code Accession number</h2>
        </div>
        <div style={styles.sectionBody}>
          <label style={styles.checkbox}>
            <input 
              type="checkbox" 
              style={styles.checkboxInput}
              checked={config.useOrderEntryFormat}
              onChange={(e) => setConfig({ ...config, useOrderEntryFormat: e.target.checked })}
            />
            Use the same accession number format and pool of available numbers as Order Entry Generation.
          </label>
          
          <div style={{ marginTop: '24px' }}>
            <label style={styles.label}>
              Prefix for pre-printed barcode labels (4 characters):
            </label>
            <input
              type="text"
              style={{ ...styles.input, maxWidth: '200px' }}
              value={config.preprinterPrefix}
              onChange={(e) => setConfig({ ...config, preprinterPrefix: e.target.value.slice(0, 4) })}
              maxLength={4}
            />
            <p style={styles.helperText}>
              NOTE: If this prefix has already been used, the numbering will continue from the last number generated.
            </p>
          </div>
        </div>
      </div>

      {/* Dimensions Bar Code Label */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Dimensions Bar Code Label</h2>
          <p style={styles.sectionSubtitle}>
            Indicate the dimensions that bar code labels should conform to when printing.
          </p>
        </div>
        <div style={styles.sectionBody}>
          <div style={styles.grid2}>
            {/* Order */}
            <div style={styles.dimensionGroup}>
              <div style={styles.dimensionTitle}>Order</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Height</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.orderHeight}
                  onChange={(e) => setConfig({ ...config, orderHeight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
              <div>
                <label style={styles.label}>Width</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.orderWidth}
                  onChange={(e) => setConfig({ ...config, orderWidth: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
            </div>

            {/* Specimen */}
            <div style={styles.dimensionGroup}>
              <div style={styles.dimensionTitle}>Specimen</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Height</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.specimenHeight}
                  onChange={(e) => setConfig({ ...config, specimenHeight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
              <div>
                <label style={styles.label}>Width</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.specimenWidth}
                  onChange={(e) => setConfig({ ...config, specimenWidth: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.secondaryButton}>Cancel</button>
          <button style={styles.primaryButton} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
