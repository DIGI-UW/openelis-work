import React, { useState } from 'react';

// ============================================================================
// BARCODE CONFIGURATION PAGE MOCKUP
// Administration → Master Lists → Barcode Configuration
// ============================================================================

export default function BarcodeConfigurationPage() {
  const [config, setConfig] = useState({
    // Default counts
    orderDefault: 2,
    specimenDefault: 1,
    blockDefault: 0,
    slideDefault: 0,
    freezerDefault: 0,
    // Max counts
    orderMax: 10,
    specimenMax: 5,
    blockMax: 20,
    slideMax: 50,
    freezerMax: 10,
    // Dimensions
    orderHeight: 25.4,
    orderWidth: 76.2,
    specimenHeight: 25.4,
    specimenWidth: 76.2,
    blockHeight: 25.4,
    blockWidth: 76.2,
    slideHeight: 12.7,
    slideWidth: 44.5,
    freezerHeight: 25.4,
    freezerWidth: 50.8,
    // Other settings
    useOrderEntryFormat: false,
    preprinterPrefix: 'LNSP',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
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
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '16px',
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
        <div style={styles.successBanner}>
          ✓ Barcode configuration saved successfully
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
              <div>
                <label style={styles.label}>
                  Block
                  <span style={styles.newBadge}>NEW</span>
                </label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.blockDefault}
                  onChange={(e) => setConfig({ ...config, blockDefault: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label style={styles.label}>
                  Slide
                  <span style={styles.newBadge}>NEW</span>
                </label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.slideDefault}
                  onChange={(e) => setConfig({ ...config, slideDefault: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label style={styles.label}>
                  Freezer
                  <span style={styles.newBadge}>NEW</span>
                </label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.freezerDefault}
                  onChange={(e) => setConfig({ ...config, freezerDefault: parseInt(e.target.value) || 0 })}
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
              <div>
                <label style={styles.label}>
                  Block
                  <span style={styles.newBadge}>NEW</span>
                </label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.blockMax}
                  onChange={(e) => setConfig({ ...config, blockMax: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label style={styles.label}>
                  Slide
                  <span style={styles.newBadge}>NEW</span>
                </label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.slideMax}
                  onChange={(e) => setConfig({ ...config, slideMax: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label style={styles.label}>
                  Freezer
                  <span style={styles.newBadge}>NEW</span>
                </label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.freezerMax}
                  onChange={(e) => setConfig({ ...config, freezerMax: parseInt(e.target.value) || 0 })}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
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

            {/* Block Labels */}
            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>Block Labels</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Block ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Specimen Type
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} />
                  Case Number
                </label>
              </div>
            </div>

            {/* Slide Labels */}
            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>Slide Labels</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Slide ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Stain Type
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} />
                  Block ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} />
                  Case Number
                </label>
              </div>
            </div>

            {/* Freezer Labels */}
            <div style={{ backgroundColor: '#fafafa', padding: '16px', borderRadius: '8px', border: '2px solid #0f62fe' }}>
              <div style={{ fontWeight: 600, marginBottom: '12px' }}>
                Freezer Labels
                <span style={styles.newBadge}>NEW</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Patient ID
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Storage Location
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} defaultChecked />
                  Specimen Type
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} />
                  Collection Date
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" style={styles.checkboxInput} />
                  Expiry Date
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
          <div style={styles.grid3}>
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

            {/* Block */}
            <div style={styles.dimensionGroup}>
              <div style={styles.dimensionTitle}>Block</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Height</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.blockHeight}
                  onChange={(e) => setConfig({ ...config, blockHeight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
              <div>
                <label style={styles.label}>Width</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.blockWidth}
                  onChange={(e) => setConfig({ ...config, blockWidth: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
            </div>

            {/* Slide */}
            <div style={styles.dimensionGroup}>
              <div style={styles.dimensionTitle}>Slide</div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Height</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.slideHeight}
                  onChange={(e) => setConfig({ ...config, slideHeight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
              <div>
                <label style={styles.label}>Width</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.slideWidth}
                  onChange={(e) => setConfig({ ...config, slideWidth: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
            </div>

            {/* Freezer - NEW */}
            <div style={{ ...styles.dimensionGroup, border: '2px solid #0f62fe' }}>
              <div style={styles.dimensionTitle}>
                Freezer
                <span style={styles.newBadge}>NEW</span>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Height</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.freezerHeight}
                  onChange={(e) => setConfig({ ...config, freezerHeight: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                />
                <div style={styles.helperText}>Enter values in: mm</div>
              </div>
              <div>
                <label style={styles.label}>Width</label>
                <input
                  type="number"
                  style={styles.inputSmall}
                  value={config.freezerWidth}
                  onChange={(e) => setConfig({ ...config, freezerWidth: parseFloat(e.target.value) || 0 })}
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
