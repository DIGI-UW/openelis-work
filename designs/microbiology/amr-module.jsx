import React, { useState } from 'react';
import { Search, ChevronRight, ChevronDown, ChevronLeft, Plus, MoreVertical, Filter, Download, Upload, Clock, AlertTriangle, CheckCircle, XCircle, Edit2, Trash2, Eye, Settings, Database, FileText, Activity, Users, Beaker, Microscope, FlaskConical, TestTube2, Pill, Bug, AlertCircle, Info, ArrowRight, Calendar, User, MapPin, Building, Stethoscope, ClipboardList, BarChart3, Layers, GitBranch, Zap, Shield, RefreshCw, ExternalLink, Send, Printer, Mail, History, Flag, Play, Pause, Check, X, Home, Menu, Bell, HelpCircle, LogOut, Clipboard, Package, FileBarChart, Cog, UserCircle, Globe, Server, Link, Save, Copy, GripVertical, Thermometer, Droplets, Wind, Timer, BookOpen, Cloud, CloudDownload, Wifi, WifiOff } from 'lucide-react';

// ============================================================
// DESIGN TOKENS - OpenELIS Global Color Palette
// ============================================================
const colors = {
  tealPrimary: '#00695c',
  tealLight: '#00897b',
  tealLighter: '#e0f2f1',
  tealDark: '#004d40',
  orange: '#e65100',
  orangeLight: '#ff8f00',
  orangeLighter: '#fff3e0',
  green: '#2e7d32',
  greenLight: '#e8f5e9',
  red: '#c62828',
  redLight: '#ffebee',
  yellow: '#f9a825',
  yellowLight: '#fffde7',
  blue: '#1565c0',
  blueLight: '#e3f2fd',
  purple: '#7b1fa2',
  purpleLight: '#f3e5f5',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  white: '#ffffff',
  black: '#000000',
};

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const Badge = ({ variant = 'default', children, size = 'md' }) => {
  const variants = {
    success: { bg: colors.greenLight, color: colors.green, border: colors.green },
    error: { bg: colors.redLight, color: colors.red, border: colors.red },
    warning: { bg: colors.yellowLight, color: '#b8860b', border: colors.yellow },
    info: { bg: colors.blueLight, color: colors.blue, border: colors.blue },
    default: { bg: colors.gray100, color: colors.gray700, border: colors.gray400 },
    teal: { bg: colors.tealLighter, color: colors.tealPrimary, border: colors.tealPrimary },
    orange: { bg: colors.orangeLighter, color: colors.orange, border: colors.orange },
    purple: { bg: colors.purpleLight, color: colors.purple, border: colors.purple },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: size === 'sm' ? '2px 6px' : size === 'lg' ? '6px 12px' : '4px 10px',
      borderRadius: '4px',
      fontSize: size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px',
      fontWeight: 600,
      backgroundColor: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
};

const Button = ({ variant = 'primary', size = 'md', children, icon: Icon, onClick, disabled, fullWidth }) => {
  const variants = {
    primary: { bg: colors.tealPrimary, color: 'white', border: 'none' },
    secondary: { bg: 'white', color: colors.gray700, border: `1px solid ${colors.gray300}` },
    danger: { bg: colors.red, color: 'white', border: 'none' },
    ghost: { bg: 'transparent', color: colors.tealPrimary, border: 'none' },
    outline: { bg: 'transparent', color: colors.tealPrimary, border: `1px solid ${colors.tealPrimary}` },
    success: { bg: colors.green, color: 'white', border: 'none' },
  };
  const v = variants[variant] || variants.primary;
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px', gap: '4px' },
    md: { padding: '8px 16px', fontSize: '14px', gap: '6px' },
    lg: { padding: '12px 24px', fontSize: '16px', gap: '8px' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 500,
        backgroundColor: v.bg,
        color: v.color,
        border: v.border,
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
};

const Input = ({ label, required, placeholder, value, onChange, type = 'text', disabled, error, hint }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && (
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
        {label} {required && <span style={{ color: colors.red }}>*</span>}
      </label>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: `1px solid ${error ? colors.red : colors.gray300}`,
        borderRadius: '4px',
        backgroundColor: disabled ? colors.gray100 : 'white',
        boxSizing: 'border-box',
      }}
    />
    {hint && <div style={{ fontSize: '12px', color: colors.gray500, marginTop: '4px' }}>{hint}</div>}
    {error && <div style={{ fontSize: '12px', color: colors.red, marginTop: '4px' }}>{error}</div>}
  </div>
);

const Select = ({ label, required, options = [], value, onChange, placeholder, disabled, hint }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && (
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
        {label} {required && <span style={{ color: colors.red }}>*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: `1px solid ${colors.gray300}`,
        borderRadius: '4px',
        backgroundColor: disabled ? colors.gray100 : 'white',
        boxSizing: 'border-box',
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {hint && <div style={{ fontSize: '12px', color: colors.gray500, marginTop: '4px' }}>{hint}</div>}
  </div>
);

const Textarea = ({ label, required, placeholder, value, onChange, rows = 3, disabled }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && (
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
        {label} {required && <span style={{ color: colors.red }}>*</span>}
      </label>
    )}
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '10px 12px',
        fontSize: '14px',
        border: `1px solid ${colors.gray300}`,
        borderRadius: '4px',
        backgroundColor: disabled ? colors.gray100 : 'white',
        boxSizing: 'border-box',
        resize: 'vertical',
        fontFamily: 'inherit',
      }}
    />
  </div>
);

// ============================================================
// MACRO-ENABLED TEXT COMPONENTS
// ============================================================

// Macro definitions by category
const MACRO_LIBRARY = {
  clinical: [
    { code: '.feb', expansion: 'Fever, chills, and malaise.' },
    { code: '.uti', expansion: 'Dysuria, frequency, and urgency consistent with urinary tract infection.' },
    { code: '.sep', expansion: 'Clinical signs of sepsis. Blood cultures ordered.' },
    { code: '.pneu', expansion: 'Productive cough, fever, and abnormal chest findings.' },
    { code: '.abx', expansion: 'Patient currently on antibiotic therapy.' },
    { code: '.abx2w', expansion: 'Patient received antibiotics within the past 2 weeks.' },
    { code: '.dm', expansion: 'History of diabetes mellitus.' },
    { code: '.immuno', expansion: 'Immunocompromised patient.' },
    { code: '.cvc', expansion: 'Central venous catheter in place.' },
    { code: '.hosp', expansion: 'Hospitalized for more than 48 hours.' },
  ],
  gramStain: [
    { code: '.gpc', expansion: 'Gram positive cocci in clusters.' },
    { code: '.gpcp', expansion: 'Gram positive cocci in pairs.' },
    { code: '.gpcc', expansion: 'Gram positive cocci in chains.' },
    { code: '.gpr', expansion: 'Gram positive rods.' },
    { code: '.gnr', expansion: 'Gram negative rods.' },
    { code: '.gnc', expansion: 'Gram negative cocci.' },
    { code: '.gnd', expansion: 'Gram negative diplococci.' },
    { code: '.yeast', expansion: 'Yeast cells present.' },
    { code: '.wbc', expansion: 'White blood cells present.' },
    { code: '.wbc+', expansion: 'Many white blood cells present (>25/hpf).' },
    { code: '.epi', expansion: 'Epithelial cells present.' },
    { code: '.epi+', expansion: 'Many epithelial cells present, suggestive of contamination.' },
    { code: '.nobac', expansion: 'No bacteria seen on Gram stain.' },
    { code: '.mixed', expansion: 'Mixed gram positive and gram negative flora.' },
  ],
  colony: [
    { code: '.lact', expansion: 'Lactose-fermenting colonies on MacConkey agar.' },
    { code: '.nlact', expansion: 'Non-lactose-fermenting colonies on MacConkey agar.' },
    { code: '.bhemo', expansion: 'Beta-hemolytic colonies on blood agar.' },
    { code: '.ahemo', expansion: 'Alpha-hemolytic colonies on blood agar.' },
    { code: '.nhemo', expansion: 'Non-hemolytic (gamma) colonies on blood agar.' },
    { code: '.muc', expansion: 'Mucoid colonies observed.' },
    { code: '.pig', expansion: 'Pigmented colonies observed.' },
    { code: '.small', expansion: 'Small colony variants noted.' },
  ],
  culture: [
    { code: '.nml', expansion: 'No growth after 5 days of incubation.' },
    { code: '.ngr', expansion: 'No significant growth.' },
    { code: '.ng24', expansion: 'No growth at 24 hours. Incubation continued.' },
    { code: '.ng48', expansion: 'No growth at 48 hours. Incubation continued.' },
    { code: '.mix', expansion: 'Mixed flora isolated, suggestive of contamination. Clinical correlation recommended.' },
    { code: '.cnt', expansion: 'Considered contamination based on clinical context and culture findings.' },
    { code: '.iso', expansion: 'Isolated in pure culture.' },
    { code: '.pre', expansion: 'Preliminary identification. Final identification pending.' },
    { code: '.conf', expansion: 'Identification confirmed by additional testing.' },
    { code: '.col3', expansion: 'Colony count: 10Â³ CFU/mL.' },
    { code: '.col4', expansion: 'Colony count: 10â´ CFU/mL.' },
    { code: '.col5', expansion: 'Colony count: â‰¥10âµ CFU/mL (significant bacteriuria).' },
    { code: '.coll', expansion: 'Colony count: <10Â³ CFU/mL (not significant).' },
  ],
  organisms: [
    { code: '.ecoli', expansion: 'Escherichia coli' },
    { code: '.kleb', expansion: 'Klebsiella pneumoniae' },
    { code: '.saur', expansion: 'Staphylococcus aureus' },
    { code: '.mrsa', expansion: 'Methicillin-resistant Staphylococcus aureus (MRSA)' },
    { code: '.mssa', expansion: 'Methicillin-susceptible Staphylococcus aureus (MSSA)' },
    { code: '.cons', expansion: 'Coagulase-negative staphylococci' },
    { code: '.pseudo', expansion: 'Pseudomonas aeruginosa' },
    { code: '.efaec', expansion: 'Enterococcus faecalis' },
    { code: '.efaem', expansion: 'Enterococcus faecium' },
    { code: '.strep', expansion: 'Streptococcus species' },
    { code: '.spneu', expansion: 'Streptococcus pneumoniae' },
    { code: '.entero', expansion: 'Enterobacter species' },
    { code: '.proteus', expansion: 'Proteus mirabilis' },
    { code: '.acineto', expansion: 'Acinetobacter baumannii complex' },
    { code: '.candida', expansion: 'Candida species' },
  ],
  ast: [
    { code: '.dtneg', expansion: 'D-test performed, negative. Clindamycin reported as susceptible.' },
    { code: '.dtpos', expansion: 'D-test positive (inducible clindamycin resistance detected). Clindamycin reported as resistant.' },
    { code: '.esblc', expansion: 'ESBL confirmed by phenotypic testing. All penicillins, cephalosporins, and aztreonam reported as resistant regardless of MIC.' },
    { code: '.esblneg', expansion: 'ESBL screen negative.' },
    { code: '.mrsac', expansion: 'MRSA confirmed. All beta-lactams reported as resistant.' },
    { code: '.vrec', expansion: 'Vancomycin resistance confirmed (VRE).' },
    { code: '.cpec', expansion: 'Carbapenemase production confirmed. Contact infection control.' },
    { code: '.amp', expansion: 'Intrinsic ampicillin resistance (not reported).' },
    { code: '.cascd', expansion: 'Cascade reporting applied per laboratory protocol.' },
    { code: '.qcok', expansion: 'QC within acceptable limits.' },
    { code: '.retest', expansion: 'Result confirmed by repeat testing.' },
    { code: '.manual', expansion: 'Manual override applied per supervisor review.' },
  ],
  reporting: [
    { code: '.final', expansion: 'Final report. No further testing indicated.' },
    { code: '.prelim', expansion: 'Preliminary report. Final identification and susceptibility testing in progress.' },
    { code: '.amend', expansion: 'Amended report. Please disregard previous results.' },
    { code: '.addtest', expansion: 'Additional testing performed as requested.' },
    { code: '.contact', expansion: 'Critical value. Physician notified.' },
    { code: '.ic', expansion: 'Infection control notified per protocol.' },
    { code: '.repeat', expansion: 'Repeat culture recommended if clinically indicated.' },
    { code: '.corr', expansion: 'Clinical correlation recommended.' },
    { code: '.nfr', expansion: 'Normal flora recovered. No pathogens isolated.' },
    { code: '.cnsig', expansion: 'Coagulase-negative staphylococci isolated from single blood culture. May represent skin contamination. Clinical correlation required.' },
    { code: '.respfl', expansion: 'Upper respiratory flora isolated. No predominant pathogen identified.' },
  ],
  timeline: [
    { code: '.sub24', expansion: 'Subcultured to BAP and MAC at 24 hours.' },
    { code: '.sub48', expansion: 'Subcultured at 48 hours.' },
    { code: '.subbap', expansion: 'Subcultured to blood agar plate.' },
    { code: '.subchoc', expansion: 'Subcultured to chocolate agar.' },
    { code: '.submac', expansion: 'Subcultured to MacConkey agar.' },
    { code: '.subana', expansion: 'Subcultured for anaerobic culture.' },
    { code: '.gram', expansion: 'Gram stain performed.' },
    { code: '.pos', expansion: 'Positive signal detected by instrument.' },
    { code: '.posaer', expansion: 'Positive signal detected in aerobic bottle.' },
    { code: '.posana', expansion: 'Positive signal detected in anaerobic bottle.' },
    { code: '.read24', expansion: 'Plates read at 24 hours.' },
    { code: '.read48', expansion: 'Plates read at 48 hours.' },
    { code: '.vitek', expansion: 'VITEK 2 card inoculated for identification and susceptibility testing.' },
    { code: '.maldi', expansion: 'MALDI-TOF identification performed.' },
  ],
};

// Flatten all macros for global search
const ALL_MACROS = Object.values(MACRO_LIBRARY).flat();

const MacroTextarea = ({ label, required, placeholder, value = '', onChange, rows = 3, disabled, category = null, hint }) => {
  const [localValue, setLocalValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = React.useRef(null);
  
  // Get macros based on category or all
  const availableMacros = category ? (MACRO_LIBRARY[category] || ALL_MACROS) : ALL_MACROS;
  
  // Filter macros based on typed text
  const filteredMacros = filterText 
    ? availableMacros.filter(m => 
        m.code.toLowerCase().includes(filterText.toLowerCase()) || 
        m.expansion.toLowerCase().includes(filterText.toLowerCase())
      )
    : availableMacros;
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setLocalValue(newValue);
    
    // Check if user just typed a period
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastDotIndex = textBeforeCursor.lastIndexOf('.');
    
    if (lastDotIndex !== -1) {
      const textAfterDot = textBeforeCursor.substring(lastDotIndex + 1);
      // Show dropdown if there's a dot and no space after it
      if (!textAfterDot.includes(' ') && textAfterDot.length < 15) {
        setFilterText(textAfterDot);
        setShowDropdown(true);
        setSelectedIndex(0);
        
        // Position dropdown near cursor (simplified)
        if (textareaRef.current) {
          const rect = textareaRef.current.getBoundingClientRect();
          setDropdownPosition({ top: rect.height + 4, left: 0 });
        }
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
    
    onChange && onChange(e);
  };
  
  const insertMacro = (macro) => {
    const cursorPos = textareaRef.current?.selectionStart || localValue.length;
    const textBeforeCursor = localValue.substring(0, cursorPos);
    const textAfterCursor = localValue.substring(cursorPos);
    const lastDotIndex = textBeforeCursor.lastIndexOf('.');
    
    // Replace from the dot to cursor with the expansion
    const newValue = textBeforeCursor.substring(0, lastDotIndex) + macro.expansion + textAfterCursor;
    setLocalValue(newValue);
    setShowDropdown(false);
    setFilterText('');
    
    // Trigger onChange with synthetic event
    onChange && onChange({ target: { value: newValue } });
    
    // Focus back to textarea
    textareaRef.current?.focus();
  };
  
  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredMacros.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredMacros[selectedIndex]) {
        e.preventDefault();
        insertMacro(filteredMacros[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };
  
  return (
    <div style={{ marginBottom: '16px', position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
          {label} {required && <span style={{ color: colors.red }}>*</span>}
        </label>
      )}
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        rows={rows}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: `1px solid ${colors.gray300}`,
          borderRadius: '4px',
          backgroundColor: disabled ? colors.gray100 : 'white',
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      {hint && <div style={{ fontSize: '12px', color: colors.gray500, marginTop: '4px' }}>{hint}</div>}
      <div style={{ fontSize: '11px', color: colors.gray400, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ backgroundColor: colors.gray100, padding: '1px 4px', borderRadius: '2px', fontFamily: 'monospace' }}>.</span>
        Type period for macros
      </div>
      
      {/* Macro Dropdown */}
      {showDropdown && filteredMacros.length > 0 && (
        <div style={{
          position: 'absolute',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: `1px solid ${colors.gray300}`,
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}>
          {filteredMacros.slice(0, 10).map((macro, i) => (
            <div
              key={macro.code}
              onClick={() => insertMacro(macro)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: i === selectedIndex ? colors.tealLighter : 'white',
                borderBottom: i < filteredMacros.length - 1 ? `1px solid ${colors.gray100}` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: '12px', color: colors.tealPrimary, fontWeight: 600 }}>{macro.code}</code>
              </div>
              <div style={{ fontSize: '13px', color: colors.gray700, marginTop: '2px' }}>{macro.expansion}</div>
            </div>
          ))}
          {filteredMacros.length > 10 && (
            <div style={{ padding: '8px 12px', fontSize: '12px', color: colors.gray500, textAlign: 'center' }}>
              +{filteredMacros.length - 10} more results
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MacroInput = ({ label, required, placeholder, value = '', onChange, disabled, category = null, hint }) => {
  const [localValue, setLocalValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = React.useRef(null);
  
  const availableMacros = category ? (MACRO_LIBRARY[category] || ALL_MACROS) : ALL_MACROS;
  
  const filteredMacros = filterText 
    ? availableMacros.filter(m => 
        m.code.toLowerCase().includes(filterText.toLowerCase()) || 
        m.expansion.toLowerCase().includes(filterText.toLowerCase())
      )
    : availableMacros;
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setLocalValue(newValue);
    
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastDotIndex = textBeforeCursor.lastIndexOf('.');
    
    if (lastDotIndex !== -1) {
      const textAfterDot = textBeforeCursor.substring(lastDotIndex + 1);
      if (!textAfterDot.includes(' ') && textAfterDot.length < 15) {
        setFilterText(textAfterDot);
        setShowDropdown(true);
        setSelectedIndex(0);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
    
    onChange && onChange(e);
  };
  
  const insertMacro = (macro) => {
    const cursorPos = inputRef.current?.selectionStart || localValue.length;
    const textBeforeCursor = localValue.substring(0, cursorPos);
    const textAfterCursor = localValue.substring(cursorPos);
    const lastDotIndex = textBeforeCursor.lastIndexOf('.');
    
    const newValue = textBeforeCursor.substring(0, lastDotIndex) + macro.expansion + textAfterCursor;
    setLocalValue(newValue);
    setShowDropdown(false);
    setFilterText('');
    
    onChange && onChange({ target: { value: newValue } });
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredMacros.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filteredMacros[selectedIndex]) {
        e.preventDefault();
        insertMacro(filteredMacros[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };
  
  return (
    <div style={{ marginBottom: '16px', position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
          {label} {required && <span style={{ color: colors.red }}>*</span>}
        </label>
      )}
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '14px',
          border: `1px solid ${colors.gray300}`,
          borderRadius: '4px',
          backgroundColor: disabled ? colors.gray100 : 'white',
          boxSizing: 'border-box',
        }}
      />
      {hint && <div style={{ fontSize: '12px', color: colors.gray500, marginTop: '4px' }}>{hint}</div>}
      
      {/* Macro Dropdown */}
      {showDropdown && filteredMacros.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: `1px solid ${colors.gray300}`,
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
          marginTop: '4px',
        }}>
          {filteredMacros.slice(0, 8).map((macro, i) => (
            <div
              key={macro.code}
              onClick={() => insertMacro(macro)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: i === selectedIndex ? colors.tealLighter : 'white',
                borderBottom: i < filteredMacros.length - 1 ? `1px solid ${colors.gray100}` : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: '12px', color: colors.tealPrimary, fontWeight: 600 }}>{macro.code}</code>
              </div>
              <div style={{ fontSize: '13px', color: colors.gray700, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{macro.expansion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Checkbox = ({ label, checked, onChange, disabled }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
    <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ width: '16px', height: '16px' }} />
    {label}
  </label>
);

const Radio = ({ label, name, value, checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', marginRight: '16px' }}>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ width: '16px', height: '16px' }} />
    {label}
  </label>
);

const Card = ({ children, title, subtitle, actions, noPadding }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '8px',
    border: `1px solid ${colors.gray200}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  }}>
    {title && (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: `1px solid ${colors.gray200}`,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.gray900 }}>{title}</h3>
          {subtitle && <div style={{ fontSize: '13px', color: colors.gray500, marginTop: '4px' }}>{subtitle}</div>}
        </div>
        {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
      </div>
    )}
    <div style={{ padding: noPadding ? 0 : '20px' }}>{children}</div>
  </div>
);

const SummaryCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '8px',
    border: `1px solid ${colors.gray200}`,
    padding: '20px',
    borderLeft: `4px solid ${color}`,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: '13px', color: colors.gray600, marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: colors.gray900 }}>{value}</div>
        {subtitle && <div style={{ fontSize: '12px', color: colors.gray500, marginTop: '4px' }}>{subtitle}</div>}
      </div>
      {Icon && (
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon size={24} color={color} />
        </div>
      )}
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;
  const widths = { sm: '400px', md: '600px', lg: '800px', xl: '1000px' };
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: widths[size],
        maxWidth: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.gray200}`,
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: colors.gray900 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color={colors.gray500} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>{children}</div>
        {footer && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 20px',
            borderTop: `1px solid ${colors.gray200}`,
            backgroundColor: colors.gray50,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const DataTable = ({ columns, data, onRowClick, emptyMessage = 'No data available' }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ backgroundColor: colors.gray50 }}>
          {columns.map((col, i) => (
            <th key={i} style={{
              padding: '12px 16px',
              textAlign: col.align || 'left',
              fontWeight: 600,
              color: colors.gray700,
              borderBottom: `2px solid ${colors.gray200}`,
              whiteSpace: 'nowrap',
            }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: colors.gray500 }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray50}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {columns.map((col, j) => (
                <td key={j} style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid ${colors.gray100}`,
                  color: colors.gray800,
                  textAlign: col.align || 'left',
                }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

const TabNav = ({ tabs, activeTab, onChange }) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${colors.gray200}`, marginBottom: '20px' }}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        style={{
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: activeTab === tab.id ? 600 : 400,
          color: activeTab === tab.id ? colors.tealPrimary : colors.gray600,
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom: activeTab === tab.id ? `2px solid ${colors.tealPrimary}` : '2px solid transparent',
          cursor: 'pointer',
        }}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

const SidebarNavItem = ({ icon: Icon, label, active, progress, badge, locked, onClick }) => (
  <div
    onClick={!locked ? onClick : undefined}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      cursor: locked ? 'not-allowed' : 'pointer',
      backgroundColor: active ? colors.tealLighter : 'transparent',
      borderLeft: active ? `3px solid ${colors.tealPrimary}` : '3px solid transparent',
      opacity: locked ? 0.5 : 1,
    }}
  >
    {progress ? (
      <div style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: progress === 'complete' ? colors.green : progress === 'partial' ? colors.yellow : colors.gray300,
      }}>
        {progress === 'complete' ? <Check size={14} color="white" /> : <Icon size={14} color="white" />}
      </div>
    ) : Icon && (
      <Icon size={18} color={active ? colors.tealPrimary : colors.gray600} />
    )}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: active ? 600 : 400, color: active ? colors.tealPrimary : colors.gray800 }}>{label}</div>
      {badge && <div style={{ fontSize: '12px', color: colors.gray500 }}>{badge}</div>}
    </div>
    {locked && <Shield size={14} color={colors.gray400} />}
  </div>
);

const InterpBadge = ({ value }) => {
  const variants = {
    S: { bg: colors.greenLight, color: colors.green },
    I: { bg: colors.yellowLight, color: '#b8860b' },
    R: { bg: colors.redLight, color: colors.red },
  };
  const v = variants[value] || variants.S;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '4px',
      fontSize: '13px',
      fontWeight: 700,
      backgroundColor: v.bg,
      color: v.color,
    }}>
      {value}
    </span>
  );
};

const SectionDivider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 16px' }}>
    <div style={{ height: '1px', flex: 1, backgroundColor: colors.gray300 }} />
    <span style={{ fontSize: '12px', fontWeight: 600, color: colors.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <div style={{ height: '1px', flex: 1, backgroundColor: colors.gray300 }} />
  </div>
);

const TagInput = ({ label, tags = [], placeholder }) => (
  <div style={{ marginBottom: '16px' }}>
    {label && (
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
        {label}
      </label>
    )}
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: '8px 12px',
      border: `1px solid ${colors.gray300}`,
      borderRadius: '4px',
      minHeight: '44px',
      alignItems: 'center',
    }}>
      {tags.map((tag, i) => (
        <span key={i} style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          backgroundColor: colors.tealLighter,
          borderRadius: '4px',
          fontSize: '13px',
          color: colors.tealPrimary,
        }}>
          {tag}
          <X size={14} style={{ cursor: 'pointer' }} />
        </span>
      ))}
      <span style={{ color: colors.gray400, fontSize: '14px' }}>{placeholder || '+ Add...'}</span>
    </div>
  </div>
);

// ============================================================
// OPENELIS GLOBAL HEADER
// ============================================================
const OpenELISHeader = ({ currentLab, user, onMenuClick }) => (
  <header style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '48px',
    backgroundColor: colors.tealPrimary,
    color: 'white',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
        <Menu size={24} color="white" />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Microscope size={24} />
        <span style={{ fontWeight: 700, fontSize: '16px' }}>OpenELIS Global</span>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Building size={16} />
        {currentLab}
      </div>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', position: 'relative' }}>
        <Bell size={20} color="white" />
        <span style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', backgroundColor: colors.orange, borderRadius: '50%' }} />
      </button>
      <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
        <HelpCircle size={20} color="white" />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={18} />
        </div>
        <span style={{ fontSize: '13px' }}>{user}</span>
        <ChevronDown size={16} />
      </div>
    </div>
  </header>
);

// ============================================================
// OPENELIS GLOBAL SIDEBAR
// ============================================================
const OpenELISSidebar = ({ isOpen, currentView, onNavigate }) => {
  const [expandedMenus, setExpandedMenus] = useState(['order', 'results', 'microbiology', 'reports', 'admin']);
  
  const toggleMenu = (menu) => {
    setExpandedMenus(prev => 
      prev.includes(menu) ? prev.filter(m => m !== menu) : [...prev, menu]
    );
  };
  
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { 
      id: 'order', 
      label: 'Order', 
      icon: ClipboardList,
      children: [
        { id: 'order-entry', label: 'Order Entry' },
        { id: 'order-search', label: 'Order Search' },
        { id: 'batch-order', label: 'Batch Order Entry' },
        { id: 'electronic-orders', label: 'Electronic Orders' },
      ]
    },
    { 
      id: 'results', 
      label: 'Results', 
      icon: FileBarChart,
      children: [
        { id: 'results-entry', label: 'Results Entry' },
        { id: 'results-validation', label: 'Validation' },
        { id: 'results-search', label: 'Result Search' },
      ]
    },
    { 
      id: 'microbiology', 
      label: 'Microbiology', 
      icon: Bug,
      children: [
        { id: 'micro-dashboard', label: 'Dashboard' },
        { id: 'micro-pending', label: 'Pending Cultures' },
        { id: 'micro-ast', label: 'AST Worklist' },
      ]
    },
    { id: 'patient', label: 'Patient', icon: Users },
    { id: 'sample', label: 'Sample', icon: TestTube2 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'quality-control', label: 'Quality Control', icon: Shield },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3,
      children: [
        { id: 'routine-reports', label: 'Routine Reports' },
        { id: 'study-reports', label: 'Study Reports' },
        { id: 'whonet-export', label: 'WHONET Export' },
        { id: 'antibiogram', label: 'Antibiogram' },
      ]
    },
    { 
      id: 'admin', 
      label: 'Administration', 
      icon: Settings,
      children: [
        { id: 'test-management', label: 'Test Management' },
        { id: 'amr-config', label: 'AMR Configuration' },
        { id: 'site-info', label: 'Site Information' },
        { id: 'user-management', label: 'User Management' },
        { id: 'dictionaries', label: 'Dictionaries' },
      ]
    },
  ];
  
  if (!isOpen) return null;
  
  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'white',
      borderRight: `1px solid ${colors.gray200}`,
      height: 'calc(100vh - 48px)',
      overflowY: 'auto',
    }}>
      <nav style={{ padding: '8px 0' }}>
        {menuItems.map((item) => (
          <div key={item.id}>
            <div
              onClick={() => item.children ? toggleMenu(item.id) : onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: currentView === item.id ? colors.tealLighter : 'transparent',
                color: currentView === item.id ? colors.tealPrimary : colors.gray800,
              }}
            >
              <item.icon size={18} />
              <span style={{ flex: 1, fontSize: '14px', fontWeight: currentView === item.id ? 600 : 400 }}>{item.label}</span>
              {item.children && (expandedMenus.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
            </div>
            {item.children && expandedMenus.includes(item.id) && (
              <div style={{ backgroundColor: colors.gray50 }}>
                {item.children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => onNavigate(child.id)}
                    style={{
                      padding: '10px 16px 10px 46px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: currentView === child.id ? colors.tealLighter : 'transparent',
                      color: currentView === child.id ? colors.tealPrimary : colors.gray700,
                      fontWeight: currentView === child.id ? 600 : 400,
                    }}
                  >
                    {child.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

// ============================================================
// ORDER ENTRY WIZARD - STEPPER COMPONENT
// ============================================================
const StepperNav = ({ steps, currentStep }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0', marginBottom: '32px' }}>
    {steps.map((step, index) => {
      const isComplete = index < currentStep;
      const isCurrent = index === currentStep;
      
      return (
        <React.Fragment key={step.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isComplete ? colors.tealPrimary : isCurrent ? colors.blue : 'transparent',
              border: `2px solid ${isComplete ? colors.tealPrimary : isCurrent ? colors.blue : colors.gray300}`,
            }}>
              {isComplete ? (
                <Check size={14} color="white" />
              ) : isCurrent ? (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />
              ) : (
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.gray300 }} />
              )}
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: isCurrent ? 500 : 400,
              color: isComplete || isCurrent ? colors.gray900 : colors.gray500,
            }}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div style={{
              width: '80px',
              height: '2px',
              backgroundColor: isComplete ? colors.tealPrimary : colors.gray200,
              margin: '0 8px',
            }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ============================================================
// ORDER ENTRY WITH MICROBIOLOGY PROGRAM (WIZARD PATTERN)
// ============================================================
const OrderEntry = ({ onCreateMicroCase }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProgram, setSelectedProgram] = useState('routine');
  const [sampleType, setSampleType] = useState('');
  
  const steps = [
    { id: 'patient', label: 'Patient Info' },
    { id: 'program', label: 'Program Selection' },
    { id: 'sample', label: 'Add Sample' },
    { id: 'order', label: 'Add Order' },
  ];
  
  const programs = [
    { value: 'routine', label: 'Routine Testing' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'hiv', label: 'HIV Program' },
    { value: 'tb', label: 'TB Program' },
    { value: 'eqa', label: 'EQA/Proficiency Testing' },
  ];
  
  const isMicrobiology = selectedProgram === 'microbiology';
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (isMicrobiology && onCreateMicroCase) {
        onCreateMicroCase();
      }
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Program Selection - includes Microbiology fields when selected
        return (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${colors.gray200}` }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 600, color: colors.gray900 }}>Program</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
                Program
              </label>
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                style={{
                  width: '100%',
                  maxWidth: '500px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: `1px solid ${colors.gray300}`,
                  borderRadius: '4px',
                  backgroundColor: 'white',
                }}
              >
                {programs.map((prog) => (
                  <option key={prog.value} value={prog.value}>{prog.label}</option>
                ))}
              </select>
            </div>
            
            {/* Microbiology-specific fields - all appear in Program step */}
            {isMicrobiology && (
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.gray200}` }}>
                <div style={{ padding: '12px 16px', backgroundColor: colors.tealLighter, borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bug size={18} color={colors.tealPrimary} />
                  <span style={{ fontSize: '14px', color: colors.tealPrimary }}>
                    This will create a Microbiology Case for culture and susceptibility testing
                  </span>
                </div>
                
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: colors.gray800 }}>
                  Microbiology Case Details
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '800px' }}>
                  <Select 
                    label="Culture Protocol" 
                    required 
                    options={[
                      { value: 'blood-std', label: 'Blood Culture Standard' }, 
                      { value: 'urine-routine', label: 'Urine Routine' }, 
                      { value: 'respiratory-std', label: 'Respiratory Standard' },
                      { value: 'wound-culture', label: 'Wound Culture' },
                      { value: 'csf-urgent', label: 'CSF Urgent' },
                      { value: 'stool-enteric', label: 'Stool Enteric' },
                    ]} 
                    placeholder="Select protocol" 
                  />
                  <Select 
                    label="Patient Origin" 
                    options={[
                      { value: 'inpatient', label: 'Inpatient' }, 
                      { value: 'outpatient', label: 'Outpatient' }, 
                      { value: 'icu', label: 'ICU' },
                      { value: 'emergency', label: 'Emergency' },
                      { value: 'long-term', label: 'Long-term Care' },
                    ]} 
                    placeholder="Select origin" 
                  />
                  <Input label="Number of Sets" type="number" placeholder="e.g., 2 for blood culture" />
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <MacroTextarea 
                    label="Clinical History" 
                    placeholder="Enter relevant clinical information, symptoms, suspected diagnosis, prior antibiotic use, etc. Type '.' for macros."
                    rows={3}
                    category="clinical"
                  />
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Checkbox label="Patient has recent antibiotic exposure (within 2 weeks)" />
                  <Checkbox label="Notify clinician for positive blood culture (Critical Value)" />
                </div>
              </div>
            )}
          </div>
        );
      
      case 2: // Add Sample - Static fields for all programs
        return (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${colors.gray200}` }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: colors.gray900 }}>Add Sample</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '800px' }}>
              <Select 
                label="Sample Type" 
                required 
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                options={[
                  { value: 'blood', label: 'Blood' }, 
                  { value: 'urine', label: 'Urine' }, 
                  { value: 'sputum', label: 'Sputum' }, 
                  { value: 'csf', label: 'CSF' }, 
                  { value: 'wound', label: 'Wound Swab' },
                  { value: 'stool', label: 'Stool' },
                  { value: 'respiratory', label: 'Respiratory' },
                ]} 
                placeholder="Select sample type" 
              />
              <Input label="Collection Date" required type="date" />
              <Input label="Collection Time" type="time" />
              <Input label="Sample Source/Site" placeholder="e.g., Right arm, Midstream" />
            </div>
          </div>
        );
      
      case 3: // Add Order - Static fields for all programs
        return (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: `1px solid ${colors.gray200}` }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600, color: colors.gray900 }}>Add Order</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '800px' }}>
              <Input label="Lab Number" placeholder="Auto-generated" disabled />
              <Select 
                label="Ordering Provider" 
                required 
                options={[
                  { value: 'dr-smith', label: 'Dr. Smith' }, 
                  { value: 'dr-jones', label: 'Dr. Jones' },
                  { value: 'dr-chen', label: 'Dr. Chen' },
                ]} 
                placeholder="Select provider" 
              />
              <Select 
                label="Site/Ward" 
                options={[
                  { value: 'clinic', label: 'Clinic' }, 
                  { value: 'ward-a', label: 'Ward A' }, 
                  { value: 'ward-b', label: 'Ward B' },
                  { value: 'icu', label: 'ICU' },
                  { value: 'er', label: 'Emergency Room' },
                ]} 
                placeholder="Select site" 
              />
              <Input label="Requester Phone" placeholder="Contact number" />
            </div>
            
            {/* Order Summary */}
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: colors.gray50, borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: colors.gray700 }}>Order Summary</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: colors.gray500 }}>Program:</span>{' '}
                  <strong>{programs.find(p => p.value === selectedProgram)?.label}</strong>
                </div>
                <div>
                  <span style={{ color: colors.gray500 }}>Sample:</span>{' '}
                  <strong>{sampleType || 'Not selected'}</strong>
                </div>
                {isMicrobiology && (
                  <div>
                    <Badge variant="teal" size="sm">Microbiology Case</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div style={{ padding: '24px', backgroundColor: colors.gray50, minHeight: '100%' }}>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '28px', fontWeight: 300, color: colors.gray800 }}>Test Request</h1>
      <StepperNav steps={steps} currentStep={currentStep} />
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {renderStepContent()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '900px', margin: '24px auto 0' }}>
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>Back</Button>
        <Button variant="primary" onClick={handleNext} style={{ minWidth: '100px' }}>
          {currentStep === steps.length - 1 ? (isMicrobiology ? 'Create Case' : 'Submit') : 'Next'}
        </Button>
      </div>
    </div>
  );
};

// ============================================================
// PENDING CULTURES WORKLIST
// ============================================================
const PendingCultures = ({ onCaseClick }) => {
  const [filterStage, setFilterStage] = useState('all');
  const [filterSpecimen, setFilterSpecimen] = useState('all');
  const [filterTech, setFilterTech] = useState('all');
  const [showMyOnly, setShowMyOnly] = useState(false);

  const pendingCases = [
    { id: 'MC-2024-001245', labNo: 'BC24-0892', patient: 'MARTINEZ, Carlos', mrn: 'MRN-78234', specimen: 'Blood', source: 'R. Antecubital', protocol: 'Blood Std', stage: 'INCUBATING', stageDetail: 'Day 2 of 5', bottles: 'FA24012, FN24012', instrument: 'BacT/ALERT 3D', lastRead: '2024-12-23 06:00', tech: 'Williams, J.', priority: 'Routine', dueAction: null },
    { id: 'MC-2024-001244', labNo: 'BC24-0891', patient: 'JOHNSON, Mary', mrn: 'MRN-45123', specimen: 'Blood', source: 'L. Antecubital', protocol: 'Blood Std', stage: 'POSITIVE', stageDetail: 'Aerobic +', bottles: 'FA24011 (+), FN24011', instrument: 'BacT/ALERT 3D', lastRead: '2024-12-23 04:30', tech: 'Williams, J.', priority: 'STAT', dueAction: 'Subculture & Gram' },
    { id: 'MC-2024-001243', labNo: 'UC24-0456', patient: 'CHEN, Wei', mrn: 'MRN-92847', specimen: 'Urine', source: 'Midstream', protocol: 'Urine Routine', stage: 'INOCULATED', stageDetail: 'Plated', bottles: null, instrument: null, lastRead: null, tech: 'Johnson, M.', priority: 'Routine', dueAction: 'Read @ 24h' },
    { id: 'MC-2024-001242', labNo: 'BC24-0890', patient: 'SMITH, Robert', mrn: 'MRN-34521', specimen: 'Blood', source: 'Central Line', protocol: 'Blood Std', stage: 'INCUBATING', stageDetail: 'Day 4 of 5', bottles: 'FA24010, FN24010', instrument: 'BacT/ALERT 3D', lastRead: '2024-12-23 06:00', tech: 'Davis, K.', priority: 'Urgent', dueAction: null },
    { id: 'MC-2024-001241', labNo: 'RC24-0234', patient: 'GARCIA, Ana', mrn: 'MRN-67832', specimen: 'Sputum', source: 'Expectorated', protocol: 'Respiratory Std', stage: 'GROWTH', stageDetail: 'Mixed flora', bottles: null, instrument: null, lastRead: '2024-12-22 16:00', tech: 'Williams, J.', priority: 'Routine', dueAction: 'Isolate & ID' },
    { id: 'MC-2024-001240', labNo: 'WC24-0123', patient: 'PATEL, Raj', mrn: 'MRN-11923', specimen: 'Wound', source: 'R. Leg Ulcer', protocol: 'Wound Culture', stage: 'SUBCULTURE', stageDetail: 'Purity plate', bottles: null, instrument: null, lastRead: '2024-12-22 14:00', tech: 'Johnson, M.', priority: 'Routine', dueAction: 'Read purity' },
    { id: 'MC-2024-001239', labNo: 'BC24-0889', patient: 'WILSON, James', mrn: 'MRN-55421', specimen: 'Blood', source: 'PICC Line', protocol: 'Blood Std', stage: 'NO_GROWTH', stageDetail: 'Day 5 - Final', bottles: 'FA24009, FN24009', instrument: 'BacT/ALERT 3D', lastRead: '2024-12-23 06:00', tech: 'Davis, K.', priority: 'Routine', dueAction: 'Finalize' },
  ];

  const stageBadge = (stage, detail) => {
    const stages = {
      INCUBATING: { variant: 'info', label: 'Incubating', icon: Clock },
      POSITIVE: { variant: 'error', label: 'POSITIVE', icon: AlertTriangle },
      INOCULATED: { variant: 'default', label: 'Inoculated', icon: FlaskConical },
      GROWTH: { variant: 'warning', label: 'Growth', icon: Activity },
      SUBCULTURE: { variant: 'teal', label: 'Subculture', icon: GitBranch },
      NO_GROWTH: { variant: 'success', label: 'No Growth', icon: CheckCircle },
    };
    const s = stages[stage] || stages.INCUBATING;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <Badge variant={s.variant}>{s.label}</Badge>
        {detail && <span style={{ fontSize: '11px', color: colors.gray500 }}>{detail}</span>}
      </div>
    );
  };

  const filteredCases = pendingCases.filter(c => {
    if (filterStage !== 'all' && c.stage !== filterStage) return false;
    if (filterSpecimen !== 'all' && c.specimen !== filterSpecimen) return false;
    if (filterTech !== 'all' && c.tech !== filterTech) return false;
    if (showMyOnly && c.tech !== 'Williams, J.') return false;
    return true;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '8px' }}>Microbiology / Pending Cultures</div>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600, color: colors.gray900 }}>Pending Cultures</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard title="Total Pending" value={pendingCases.length} icon={FlaskConical} color={colors.blue} />
        <SummaryCard title="Incubating" value={pendingCases.filter(c => c.stage === 'INCUBATING').length} subtitle="Blood cultures" icon={Clock} color={colors.tealPrimary} />
        <SummaryCard title="Positive" value={pendingCases.filter(c => c.stage === 'POSITIVE').length} subtitle="Action required" icon={AlertTriangle} color={colors.red} />
        <SummaryCard title="Growth Detected" value={pendingCases.filter(c => c.stage === 'GROWTH').length} icon={Activity} color={colors.orange} />
        <SummaryCard title="Ready to Finalize" value={pendingCases.filter(c => c.stage === 'NO_GROWTH').length} icon={CheckCircle} color={colors.green} />
      </div>

      <Card noPadding>
        {/* Filters */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color={colors.gray400} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search Lab No, Patient, MRN..." style={{ width: '250px', padding: '10px 12px 10px 40px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}>
            <option value="all">All Stages</option>
            <option value="INCUBATING">Incubating</option>
            <option value="POSITIVE">Positive</option>
            <option value="INOCULATED">Inoculated</option>
            <option value="GROWTH">Growth</option>
            <option value="SUBCULTURE">Subculture</option>
            <option value="NO_GROWTH">No Growth</option>
          </select>
          <select value={filterSpecimen} onChange={(e) => setFilterSpecimen(e.target.value)} style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}>
            <option value="all">All Specimens</option>
            <option value="Blood">Blood</option>
            <option value="Urine">Urine</option>
            <option value="Sputum">Sputum</option>
            <option value="Wound">Wound</option>
          </select>
          <select value={filterTech} onChange={(e) => setFilterTech(e.target.value)} style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}>
            <option value="all">All Technicians</option>
            <option value="Williams, J.">Williams, J.</option>
            <option value="Johnson, M.">Johnson, M.</option>
            <option value="Davis, K.">Davis, K.</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: colors.gray600, cursor: 'pointer' }}>
            <input type="checkbox" checked={showMyOnly} onChange={(e) => setShowMyOnly(e.target.checked)} /> My Cases Only
          </label>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" icon={RefreshCw} size="sm">Refresh</Button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: colors.gray50 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Lab Number</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Patient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Specimen</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Protocol</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray700 }}>Stage</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Bottles/Media</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Last Read</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Due Action</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray700 }}>Priority</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Tech</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onCaseClick && onCaseClick(row)}
                  style={{ cursor: 'pointer', backgroundColor: row.stage === 'POSITIVE' ? colors.redLight : 'transparent' }}
                  onMouseEnter={(e) => { if (row.stage !== 'POSITIVE') e.currentTarget.style.backgroundColor = colors.gray50; }}
                  onMouseLeave={(e) => { if (row.stage !== 'POSITIVE') e.currentTarget.style.backgroundColor = 'transparent'; else e.currentTarget.style.backgroundColor = colors.redLight; }}
                >
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    <div style={{ fontWeight: 600, color: colors.tealPrimary }}>{row.labNo}</div>
                    <div style={{ fontSize: '12px', color: colors.gray500 }}>{row.id}</div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    <div>{row.patient}</div>
                    <div style={{ fontSize: '12px', color: colors.gray500 }}>{row.mrn}</div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    <div>{row.specimen}</div>
                    <div style={{ fontSize: '12px', color: colors.gray500 }}>{row.source}</div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>{row.protocol}</td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                    {stageBadge(row.stage, row.stageDetail)}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, fontSize: '13px', fontFamily: 'monospace' }}>
                    {row.bottles || 'â€”'}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, fontSize: '13px' }}>
                    {row.lastRead || 'â€”'}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    {row.dueAction ? (
                      <span style={{ color: row.stage === 'POSITIVE' ? colors.red : colors.orange, fontWeight: 500, fontSize: '13px' }}>
                        {row.dueAction}
                      </span>
                    ) : 'â€”'}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                    <Badge variant={row.priority === 'STAT' ? 'error' : row.priority === 'Urgent' ? 'warning' : 'default'} size="sm">{row.priority}</Badge>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>{row.tech}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: colors.gray500 }}>Showing {filteredCases.length} of {pendingCases.length} pending cultures</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" disabled>Previous</Button>
            <Button variant="ghost" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// AST WORKLIST
// ============================================================
const ASTWorklist = ({ onCaseClick }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPanel, setFilterPanel] = useState('all');
  const [showReadyOnly, setShowReadyOnly] = useState(false);

  const astItems = [
    { id: 'MC-2024-001234', labNo: 'BC24-0885', patient: 'DOE, John', organism: 'Staphylococcus aureus', whonet: 'sau', isolateNum: 1, panel: 'GP-AST', method: 'VITEK 2', status: 'COMPLETE', flags: 2, flagTypes: ['D-Test', 'Review'], tech: 'Williams, J.', started: '2024-12-22 14:00', priority: 'STAT' },
    { id: 'MC-2024-001233', labNo: 'UC24-0455', patient: 'SMITH, Jane', organism: 'Escherichia coli', whonet: 'eco', isolateNum: 1, panel: 'GN-UR', method: 'VITEK 2', status: 'IN_PROGRESS', flags: 0, flagTypes: [], tech: 'Johnson, M.', started: '2024-12-23 08:00', priority: 'Routine' },
    { id: 'MC-2024-001231', labNo: 'WC24-0122', patient: 'CHEN, Wei', organism: 'Staphylococcus aureus', whonet: 'sau', isolateNum: 1, panel: 'GP-AST', method: 'VITEK 2', status: 'COMPLETE', flags: 1, flagTypes: ['MRSA'], tech: 'Davis, K.', started: '2024-12-22 10:00', priority: 'Urgent' },
    { id: 'MC-2024-001231', labNo: 'WC24-0122', patient: 'CHEN, Wei', organism: 'Pseudomonas aeruginosa', whonet: 'pae', isolateNum: 2, panel: 'PSEUDO', method: 'VITEK 2', status: 'IN_PROGRESS', flags: 0, flagTypes: [], tech: 'Davis, K.', started: '2024-12-22 16:00', priority: 'Urgent' },
    { id: 'MC-2024-001230', labNo: 'BC24-0884', patient: 'GARCIA, Ana', organism: 'Klebsiella pneumoniae', whonet: 'kpn', isolateNum: 1, panel: 'GN-STD', method: 'VITEK 2', status: 'PENDING_SETUP', flags: 0, flagTypes: [], tech: 'Williams, J.', started: null, priority: 'Routine' },
    { id: 'MC-2024-001229', labNo: 'BC24-0883', patient: 'WILSON, James', organism: 'Enterococcus faecalis', whonet: 'efa', isolateNum: 1, panel: 'ENTERO', method: 'Disk Diffusion', status: 'READING', flags: 0, flagTypes: [], tech: 'Johnson, M.', started: '2024-12-22 09:00', priority: 'Routine' },
    { id: 'MC-2024-001228', labNo: 'RC24-0233', patient: 'BROWN, Lisa', organism: 'Streptococcus pneumoniae', whonet: 'spn', isolateNum: 1, panel: 'STREP', method: 'Etest', status: 'COMPLETE', flags: 1, flagTypes: ['Pen-R'], tech: 'Williams, J.', started: '2024-12-21 14:00', priority: 'STAT' },
  ];

  const statusBadge = (status) => {
    const statuses = {
      PENDING_SETUP: { variant: 'default', label: 'Pending Setup' },
      IN_PROGRESS: { variant: 'info', label: 'In Progress' },
      READING: { variant: 'teal', label: 'Reading' },
      COMPLETE: { variant: 'success', label: 'Complete' },
      QC_FAILED: { variant: 'error', label: 'QC Failed' },
    };
    const s = statuses[status] || statuses.PENDING_SETUP;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const filteredItems = astItems.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterPanel !== 'all' && item.panel !== filterPanel) return false;
    if (showReadyOnly && item.status !== 'COMPLETE') return false;
    return true;
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '8px' }}>Microbiology / AST Worklist</div>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600, color: colors.gray900 }}>AST Worklist</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard title="Total AST Tests" value={astItems.length} icon={TestTube2} color={colors.blue} />
        <SummaryCard title="Pending Setup" value={astItems.filter(i => i.status === 'PENDING_SETUP').length} icon={Clock} color={colors.gray500} />
        <SummaryCard title="In Progress" value={astItems.filter(i => i.status === 'IN_PROGRESS' || i.status === 'READING').length} icon={Activity} color={colors.tealPrimary} />
        <SummaryCard title="Ready for Review" value={astItems.filter(i => i.status === 'COMPLETE').length} subtitle={`${astItems.filter(i => i.status === 'COMPLETE' && i.flags > 0).length} with flags`} icon={CheckCircle} color={colors.green} />
        <SummaryCard title="Expert Flags" value={astItems.reduce((sum, i) => sum + i.flags, 0)} subtitle="Require attention" icon={AlertTriangle} color={colors.orange} />
      </div>

      <Card noPadding>
        {/* Filters */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color={colors.gray400} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input type="text" placeholder="Search Lab No, Patient, Organism..." style={{ width: '280px', padding: '10px 12px 10px 40px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }} />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}>
            <option value="all">All Status</option>
            <option value="PENDING_SETUP">Pending Setup</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="READING">Reading</option>
            <option value="COMPLETE">Complete</option>
          </select>
          <select value={filterPanel} onChange={(e) => setFilterPanel(e.target.value)} style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}>
            <option value="all">All Panels</option>
            <option value="GP-AST">GP-AST (Gram Positive)</option>
            <option value="GN-STD">GN-STD (Gram Negative)</option>
            <option value="GN-UR">GN-UR (Gram Neg Urine)</option>
            <option value="PSEUDO">PSEUDO (Pseudomonas)</option>
            <option value="ENTERO">ENTERO (Enterococcus)</option>
            <option value="STREP">STREP (Streptococcus)</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: colors.gray600, cursor: 'pointer' }}>
            <input type="checkbox" checked={showReadyOnly} onChange={(e) => setShowReadyOnly(e.target.checked)} /> Ready for Review Only
          </label>
          <div style={{ flex: 1 }} />
          <Button variant="secondary" icon={Upload} size="sm">Import Results</Button>
          <Button variant="secondary" icon={RefreshCw} size="sm">Refresh</Button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: colors.gray50 }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Lab Number</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Patient</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Organism</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Panel</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Method</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray700 }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray700 }}>Flags</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Started</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray700 }}>Priority</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: colors.gray700 }}>Tech</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: colors.gray700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onCaseClick && onCaseClick(row)}
                  style={{ cursor: 'pointer', backgroundColor: row.flags > 0 && row.status === 'COMPLETE' ? colors.yellowLight : 'transparent' }}
                  onMouseEnter={(e) => { if (!(row.flags > 0 && row.status === 'COMPLETE')) e.currentTarget.style.backgroundColor = colors.gray50; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = row.flags > 0 && row.status === 'COMPLETE' ? colors.yellowLight : 'transparent'; }}
                >
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    <div style={{ fontWeight: 600, color: colors.tealPrimary }}>{row.labNo}</div>
                    <div style={{ fontSize: '12px', color: colors.gray500 }}>Isolate #{row.isolateNum}</div>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>{row.patient}</td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    <div style={{ fontStyle: 'italic' }}>{row.organism}</div>
                    <code style={{ fontSize: '11px', backgroundColor: colors.gray100, padding: '1px 4px', borderRadius: '2px' }}>{row.whonet}</code>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>
                    <code style={{ backgroundColor: colors.tealLighter, color: colors.tealPrimary, padding: '2px 6px', borderRadius: '3px', fontSize: '12px' }}>{row.panel}</code>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>{row.method}</td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                    {statusBadge(row.status)}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                    {row.flags > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <Badge variant="warning" size="sm">{row.flags} flag{row.flags > 1 ? 's' : ''}</Badge>
                        <div style={{ fontSize: '11px', color: colors.gray500 }}>{row.flagTypes.join(', ')}</div>
                      </div>
                    ) : (
                      <span style={{ color: colors.gray400 }}>â€”</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, fontSize: '13px' }}>
                    {row.started || 'â€”'}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                    <Badge variant={row.priority === 'STAT' ? 'error' : row.priority === 'Urgent' ? 'warning' : 'default'} size="sm">{row.priority}</Badge>
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}` }}>{row.tech}</td>
                  <td style={{ padding: '14px 16px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {row.status === 'PENDING_SETUP' && (
                        <Button variant="ghost" size="sm" icon={Play}>Setup</Button>
                      )}
                      {row.status === 'READING' && (
                        <Button variant="ghost" size="sm" icon={Edit2}>Enter</Button>
                      )}
                      {row.status === 'COMPLETE' && (
                        <Button variant="ghost" size="sm" icon={Eye}>Review</Button>
                      )}
                      {row.status === 'IN_PROGRESS' && (
                        <Button variant="ghost" size="sm" icon={Clock}>View</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: colors.gray500 }}>Showing {filteredItems.length} of {astItems.length} AST tests</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" size="sm" disabled>Previous</Button>
            <Button variant="ghost" size="sm" disabled>Next</Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions Panel */}
      <div style={{ marginTop: '24px' }}>
        <Card title="Quick Actions">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="secondary" icon={Upload}>Import from Analyzer</Button>
            <Button variant="secondary" icon={Printer}>Print Pending List</Button>
            <Button variant="secondary" icon={Download}>Export to WHONET</Button>
            <Button variant="secondary" icon={BarChart3}>QC Dashboard</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================
// MICROBIOLOGY DASHBOARD
// ============================================================
const MicrobiologyDashboard = ({ onCaseClick }) => {
  const cases = [
    { id: 'MC-2024-001234', date: '2024-12-20', stage: 'AST_IN_PROGRESS', patient: 'DOE, John', specimen: 'Blood', organisms: 'S. aureus', tech: 'Williams, J.', priority: 'STAT' },
    { id: 'MC-2024-001233', date: '2024-12-19', stage: 'ORGANISM_ID', patient: 'SMITH, Jane', specimen: 'Urine', organisms: 'Pending ID', tech: 'Johnson, M.', priority: 'Routine' },
    { id: 'MC-2024-001232', date: '2024-12-19', stage: 'INCUBATING', patient: 'JONES, Bob', specimen: 'Sputum', organisms: '--', tech: 'Williams, J.', priority: 'Routine' },
    { id: 'MC-2024-001231', date: '2024-12-18', stage: 'READY_REVIEW', patient: 'CHEN, Wei', specimen: 'Wound', organisms: 'S. aureus, P. aeruginosa', tech: 'Davis, K.', priority: 'Urgent' },
    { id: 'MC-2024-001230', date: '2024-12-18', stage: 'FINAL_REPORTED', patient: 'GARCIA, Ana', specimen: 'CSF', organisms: 'No growth', tech: 'Johnson, M.', priority: 'STAT' },
  ];

  const stageBadge = (stage) => {
    const stages = {
      RECEIVED: { variant: 'default', label: 'Received' },
      INOCULATING: { variant: 'info', label: 'Inoculating' },
      INCUBATING: { variant: 'info', label: 'Incubating' },
      GROWTH_DETECTED: { variant: 'warning', label: 'Growth Detected' },
      ORGANISM_ID: { variant: 'warning', label: 'Organism ID' },
      AST_IN_PROGRESS: { variant: 'teal', label: 'AST In Progress' },
      READY_REVIEW: { variant: 'orange', label: 'Ready for Review' },
      PRELIM_REPORTED: { variant: 'info', label: 'Preliminary' },
      FINAL_REPORTED: { variant: 'success', label: 'Final Reported' },
    };
    const s = stages[stage] || stages.RECEIVED;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };
  
  const priorityBadge = (priority) => {
    const priorities = { STAT: 'error', Urgent: 'warning', Routine: 'default' };
    return <Badge variant={priorities[priority] || 'default'} size="sm">{priority}</Badge>;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '8px' }}>Microbiology / Dashboard</div>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600, color: colors.gray900 }}>Microbiology Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <SummaryCard title="Cases In Progress" value="12" icon={Activity} color={colors.blue} />
        <SummaryCard title="Awaiting Review" value="4" subtitle="2 urgent" icon={ClipboardList} color={colors.orange} />
        <SummaryCard title="Positive Cultures (Today)" value="3" icon={AlertTriangle} color={colors.red} />
        <SummaryCard title="Complete (Week)" value="28" icon={CheckCircle} color={colors.green} />
      </div>

      <Card noPadding>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}` }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} color={colors.gray400} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Search by Lab No or Patient Name" style={{ width: '280px', padding: '10px 12px 10px 40px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: colors.gray600 }}>
              <input type="checkbox" /> My Cases
            </label>
            <select style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}><option>All Status</option></select>
          </div>
        </div>

        <DataTable
          columns={[
            { header: 'Lab Number', key: 'id', render: (v) => <strong>{v}</strong> },
            { header: 'Request Date', key: 'date' },
            { header: 'Stage', key: 'stage', render: (v) => stageBadge(v) },
            { header: 'Patient', key: 'patient' },
            { header: 'Specimen', key: 'specimen' },
            { header: 'Organism(s)', key: 'organisms', render: (v) => <span style={{ fontStyle: v.includes('Pending') || v === '--' ? 'normal' : 'italic' }}>{v}</span> },
            { header: 'Priority', key: 'priority', render: (v) => priorityBadge(v) },
            { header: 'Technician', key: 'tech' },
          ]}
          data={cases}
          onRowClick={(row) => onCaseClick(row)}
        />
      </Card>
    </div>
  );
};

// ============================================================
// MICROBIOLOGY CASE DETAIL VIEW
// ============================================================
// ============================================================
// ADD TIMELINE EVENT MODAL
// ============================================================
const AddTimelineEventModal = ({ isOpen, onClose }) => {
  const [eventType, setEventType] = useState('');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Timeline Event" size="md" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary">Add Event</Button>
      </>
    }>
      <Select 
        label="Event Type" 
        required 
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        options={[
          { value: 'subculture', label: 'Subculture' },
          { value: 'reading', label: 'Plate Reading' },
          { value: 'gram', label: 'Gram Stain' },
          { value: 'positive', label: 'Positive Detection' },
          { value: 'nogrowth', label: 'No Growth' },
          { value: 'id', label: 'Organism Identification' },
          { value: 'ast', label: 'AST Setup' },
          { value: 'note', label: 'General Note' },
        ]} 
        placeholder="Select event type" 
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input label="Date" required type="date" />
        <Input label="Time" required type="time" />
      </div>
      
      <Select 
        label="Related Isolate" 
        options={[
          { value: '', label: 'N/A - General' },
          { value: '1', label: 'Isolate 1 - S. aureus' },
          { value: '2', label: 'Isolate 2 - Pending ID' },
        ]} 
      />
      
      {(eventType === 'subculture' || eventType === 'reading') && (
        <Select 
          label="Media" 
          options={[
            { value: 'bap', label: 'Blood Agar Plate (BAP)' },
            { value: 'mac', label: 'MacConkey Agar' },
            { value: 'choc', label: 'Chocolate Agar' },
            { value: 'cna', label: 'CNA Agar' },
            { value: 'thio', label: 'Thioglycollate Broth' },
          ]} 
          placeholder="Select media"
        />
      )}
      
      <MacroTextarea 
        label="Notes" 
        placeholder="Enter event details. Type '.' for macros."
        rows={3}
        category="timeline"
      />
    </Modal>
  );
};

// ============================================================
// ADD/EDIT ISOLATE MODAL
// ============================================================
const IsolateModal = ({ isOpen, onClose, isolate = null }) => {
  const isEdit = !!isolate;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Isolate' : 'Add Isolate'} size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary">{isEdit ? 'Save Changes' : 'Add Isolate'}</Button>
      </>
    }>
      <SectionDivider label="Preliminary Identification" />
      
      <MacroTextarea 
        label="Gram Stain Observations" 
        placeholder="Describe gram stain findings. Type '.' for macros (e.g., .gpc, .gnr)"
        rows={2}
        category="gramStain"
      />
      
      <MacroTextarea 
        label="Colony Morphology" 
        placeholder="Describe colony characteristics. Type '.' for macros (e.g., .bhemo, .muc)"
        rows={2}
        category="colony"
      />
      
      <MacroInput 
        label="Preliminary ID Notes" 
        placeholder="Initial observations. Type '.' for macros"
        category="culture"
      />
      
      <SectionDivider label="Final Identification" />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Select 
          label="ID Method" 
          required
          options={[
            { value: 'biochem', label: 'Biochemical' },
            { value: 'vitek', label: 'VITEK 2' },
            { value: 'maldi', label: 'MALDI-TOF MS' },
            { value: 'molecular', label: 'Molecular/PCR' },
            { value: 'manual', label: 'Manual ID' },
          ]} 
          placeholder="Select method"
        />
        <Input label="ID Confidence %" type="number" placeholder="e.g., 99.5" />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '6px' }}>
          Organism <span style={{ color: colors.red }}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <Search size={18} color={colors.gray400} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search organism name..." 
            style={{ width: '100%', padding: '10px 12px 10px 40px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }} 
          />
        </div>
        <div style={{ fontSize: '11px', color: colors.gray400, marginTop: '4px' }}>
          Type '.' for organism macros (e.g., .ecoli, .saur, .pseudo)
        </div>
      </div>
      
      <Input label="WHONET Code" placeholder="e.g., sau, eco" hint="3-5 character code" />
      
      <SectionDivider label="Clinical Significance" />
      
      <Select 
        label="Significance" 
        required
        options={[
          { value: 'significant', label: 'Clinically Significant' },
          { value: 'not-significant', label: 'Not Clinically Significant' },
          { value: 'contaminant', label: 'Probable Contaminant' },
          { value: 'colonizer', label: 'Colonizer' },
        ]} 
        placeholder="Select significance"
      />
      
      <MacroTextarea 
        label="Clinical Notes" 
        placeholder="Additional notes regarding this isolate. Type '.' for macros"
        rows={2}
        category="culture"
      />
      
      <Select 
        label="Default AST Panel" 
        options={[
          { value: 'gp-ast', label: 'GP-AST (Gram Positive Standard)' },
          { value: 'gn-std', label: 'GN-STD (Gram Negative Standard)' },
          { value: 'gn-ur', label: 'GN-UR (Gram Negative Urine)' },
          { value: 'pseudo', label: 'PSEUDO (Pseudomonas)' },
          { value: 'entero', label: 'ENTERO (Enterococcus)' },
          { value: 'strep', label: 'STREP (Streptococcus)' },
        ]} 
        placeholder="Auto-selected based on organism"
      />
    </Modal>
  );
};

// ============================================================
// EDIT AST RESULTS MODAL
// ============================================================
const EditASTModal = ({ isOpen, onClose }) => {
  const [showOverrideComment, setShowOverrideComment] = useState(false);
  
  const astData = [
    { antibiotic: 'Oxacillin', mic: 'â‰¤0.25', zone: '', interp: 'S', override: false },
    { antibiotic: 'Penicillin', mic: '>2', zone: '', interp: 'R', override: false },
    { antibiotic: 'Vancomycin', mic: '1', zone: '', interp: 'S', override: false },
    { antibiotic: 'Clindamycin', mic: 'â‰¤0.25', zone: '', interp: 'S', override: false },
    { antibiotic: 'Erythromycin', mic: '>8', zone: '', interp: 'R', override: false },
  ];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit AST Results - Isolate 1: S. aureus" size="xl" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" icon={RefreshCw}>Recalculate Interpretations</Button>
        <Button variant="primary">Save Changes</Button>
      </>
    }>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <Select 
          label="AST Panel" 
          options={[
            { value: 'gp-ast', label: 'GP-AST (Gram Positive)' },
          ]} 
        />
        <Select 
          label="Method" 
          options={[
            { value: 'vitek', label: 'VITEK 2' },
            { value: 'disk', label: 'Disk Diffusion' },
            { value: 'etest', label: 'Etest' },
            { value: 'mic', label: 'Broth Microdilution' },
          ]} 
        />
        <Select 
          label="Breakpoint Standard" 
          options={[
            { value: 'clsi2024', label: 'CLSI 2024 M100' },
            { value: 'clsi2023', label: 'CLSI 2023 M100' },
            { value: 'eucast14', label: 'EUCAST v14.0' },
          ]} 
        />
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Button variant="secondary" size="sm" icon={Upload}>Import from Analyzer</Button>
        <Button variant="ghost" size="sm">Apply Defaults</Button>
        <Button variant="ghost" size="sm">Clear All</Button>
      </div>
      
      <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: colors.gray50 }}>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Antibiotic</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '100px' }}>MIC (Î¼g/mL)</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '100px' }}>Zone (mm)</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '80px' }}>Interp</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '80px' }}>Override</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>WHONET</th>
              <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Report</th>
            </tr>
          </thead>
          <tbody>
            {astData.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}` }}>{row.antibiotic}</td>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}` }}>
                  <input type="text" defaultValue={row.mic} style={{ width: '100%', padding: '6px 8px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace' }} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}` }}>
                  <input type="text" defaultValue={row.zone} placeholder="â€”" style={{ width: '100%', padding: '6px 8px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace' }} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                  <select defaultValue={row.interp} style={{ padding: '6px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', backgroundColor: row.interp === 'S' ? colors.greenLight : row.interp === 'R' ? colors.redLight : colors.yellowLight }}>
                    <option value="S">S</option>
                    <option value="I">I</option>
                    <option value="R">R</option>
                  </select>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                  <input type="checkbox" onChange={(e) => setShowOverrideComment(e.target.checked)} />
                </td>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}` }}>
                  <code style={{ fontSize: '11px', color: colors.gray500 }}>{row.antibiotic.substring(0, 3).toUpperCase()}</code>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                  <select style={{ padding: '4px 8px', fontSize: '12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px' }}>
                    <option>Always</option>
                    <option>Cascade</option>
                    <option>Suppress</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showOverrideComment && (
        <div style={{ padding: '16px', backgroundColor: colors.yellowLight, borderRadius: '8px', border: `1px solid ${colors.yellow}`, marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color={colors.orange} />
            <span style={{ fontWeight: 600, color: colors.gray900 }}>Manual Override Selected</span>
          </div>
          <MacroTextarea 
            label="Override Justification" 
            required
            placeholder="Document reason for manual override. Type '.' for macros (e.g., .retest, .manual)"
            rows={2}
            category="ast"
          />
        </div>
      )}
      
      <MacroTextarea 
        label="General AST Comments" 
        placeholder="Additional comments for this AST test. Type '.' for macros"
        rows={2}
        category="ast"
      />
    </Modal>
  );
};

// ============================================================
// EXPERT REVIEW DECISION MODAL
// ============================================================
const ExpertReviewModal = ({ isOpen, onClose, flag }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expert Review Decision" size="md" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary">Apply Decision</Button>
      </>
    }>
      <div style={{ padding: '16px', backgroundColor: colors.yellowLight, borderRadius: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <AlertTriangle size={18} color={colors.orange} />
          <span style={{ fontWeight: 600 }}>D-Test Required</span>
        </div>
        <div style={{ fontSize: '14px', color: colors.gray700 }}>
          ERY-R + CLI-S pattern detected for <em>Staphylococcus aureus</em>. D-test recommended to detect inducible clindamycin resistance.
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: colors.gray700, marginBottom: '8px' }}>
          Decision <span style={{ color: colors.red }}>*</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '12px', border: `1px solid ${colors.gray200}`, borderRadius: '6px' }}>
            <input type="radio" name="decision" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Request D-Test</div>
              <div style={{ fontSize: '13px', color: colors.gray500 }}>Adds D-test to pending tests and timeline</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '12px', border: `1px solid ${colors.gray200}`, borderRadius: '6px' }}>
            <input type="radio" name="decision" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>D-Test Negative - Report CLI as S</div>
              <div style={{ fontSize: '13px', color: colors.gray500 }}>D-test performed and was negative</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '12px', border: `1px solid ${colors.gray200}`, borderRadius: '6px' }}>
            <input type="radio" name="decision" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>D-Test Positive - Report CLI as R</div>
              <div style={{ fontSize: '13px', color: colors.gray500 }}>D-test performed and was positive (inducible resistance)</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', padding: '12px', border: `1px solid ${colors.gray200}`, borderRadius: '6px' }}>
            <input type="radio" name="decision" style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Report CLI as R (Conservative)</div>
              <div style={{ fontSize: '13px', color: colors.gray500 }}>Report as resistant without performing D-test</div>
            </div>
          </label>
        </div>
      </div>
      
      <MacroTextarea 
        label="Justification / Notes" 
        placeholder="Document your decision. Type '.' for macros (e.g., .dtneg, .dtpos)"
        rows={3}
        category="ast"
      />
      
      <Input label="Reviewed By" disabled value="Williams, J." />
    </Modal>
  );
};

// ============================================================
// FINAL REPORT COMMENTS MODAL
// ============================================================
const FinalReportModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Final Report" size="lg" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" icon={Eye}>Preview Report</Button>
        <Button variant="success" icon={Send}>Release Final Report</Button>
      </>
    }>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: colors.gray700 }}>Checklist</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Checkbox label="All isolates identified and verified" checked />
          <Checkbox label="AST complete for all significant isolates" checked />
          <Checkbox label="All expert flags reviewed and addressed" checked />
          <Checkbox label="No pending additional tests" checked />
          <Checkbox label="Clinical correlation reviewed" />
        </div>
      </div>
      
      <SectionDivider label="Report Comments" />
      
      <MacroTextarea 
        label="Culture Results Summary" 
        placeholder="Summarize culture findings. Type '.' for macros"
        rows={3}
        category="culture"
      />
      
      <MacroTextarea 
        label="Interpretation / Clinical Comments" 
        placeholder="Add interpretive comments for clinician. Type '.' for macros (e.g., .corr, .repeat)"
        rows={3}
        category="reporting"
      />
      
      <MacroTextarea 
        label="Technologist Notes" 
        placeholder="Internal notes (not printed on report). Type '.' for macros"
        rows={2}
        category="reporting"
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Select 
          label="Reviewed By" 
          options={[
            { value: 'williams', label: 'Williams, J. (Supervisor)' },
            { value: 'johnson', label: 'Johnson, M. (Supervisor)' },
          ]} 
        />
        <Input label="Review Date/Time" type="datetime-local" />
      </div>
      
      <div style={{ padding: '12px 16px', backgroundColor: colors.blueLight, borderRadius: '6px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={18} color={colors.blue} />
        <span style={{ fontSize: '13px', color: colors.blue }}>
          Releasing final report will notify ordering provider and lock this case from further edits.
        </span>
      </div>
    </Modal>
  );
};

const MicrobiologyCaseDetail = ({ caseData, onBack }) => {
  const [activeSection, setActiveSection] = useState('ast-results');
  const [expandedIsolate, setExpandedIsolate] = useState(1);
  
  // Modal states
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [showIsolateModal, setShowIsolateModal] = useState(false);
  const [showASTModal, setShowASTModal] = useState(false);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const [showFinalReportModal, setShowFinalReportModal] = useState(false);

  const sections = [
    { id: 'case-info', label: 'Case Information', icon: FileText, progress: 'complete' },
    { id: 'culture-setup', label: 'Culture Setup', icon: FlaskConical, progress: 'complete' },
    { id: 'timeline', label: 'Timeline', icon: Clock, progress: 'complete', badge: '6 events' },
    { id: 'isolates', label: 'Isolates', icon: Bug, progress: 'complete', badge: '2 found' },
    { id: 'ast-results', label: 'AST Results', icon: TestTube2, progress: 'partial', badge: '1/2 done' },
    { id: 'expert-review', label: 'Expert Review', icon: AlertTriangle, progress: 'partial', badge: '2 flags' },
    { id: 'final-review', label: 'Final Review', icon: ClipboardList, progress: 'pending' },
    { id: 'reports', label: 'Reports', icon: FileText, progress: 'pending' },
  ];

  const astResults = [
    { antibiotic: 'Oxacillin', raw: 'â‰¤0.25', interp: 'S', report: true },
    { antibiotic: 'Penicillin', raw: '>2', interp: 'R', report: true },
    { antibiotic: 'Vancomycin', raw: '1', interp: 'S', report: true },
    { antibiotic: 'Clindamycin', raw: 'â‰¤0.25', interp: 'S', report: true, flags: 'dtest' },
    { antibiotic: 'Erythromycin', raw: '>8', interp: 'R', report: true },
    { antibiotic: 'Gentamicin', raw: 'â‰¤0.5', interp: 'S', report: 'cascade' },
    { antibiotic: 'TMP-SMX', raw: 'â‰¤10', interp: 'S', report: true },
    { antibiotic: 'Linezolid', raw: '2', interp: 'S', report: 'cascade' },
    { antibiotic: 'Daptomycin', raw: '0.5', interp: 'S', report: 'cascade' },
  ];

  const timelineEvents = [
    { time: '2024-12-20 16:45', type: 'ast', title: 'AST Setup Complete', user: 'Williams, J.', detail: 'VITEK 2 card GP-AST inoculated', color: colors.green },
    { time: '2024-12-20 14:30', type: 'id', title: 'Organism Identified', user: 'Williams, J.', detail: 'Isolate 1: Staphylococcus aureus', color: colors.green },
    { time: '2024-12-20 12:15', type: 'positive', title: 'POSITIVE - Aerobic Bottle', user: 'System', detail: 'Gram stain: GPC in clusters', color: colors.red },
    { time: '2024-12-20 08:30', type: 'culture', title: 'Culture Inoculated', user: 'Williams, J.', detail: 'Bottles: FA24001, FN24001', color: colors.blue },
    { time: '2024-12-20 08:00', type: 'received', title: 'Specimen Received', user: 'Reception', color: colors.gray400 },
  ];

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar Navigation */}
      <div style={{ width: '260px', backgroundColor: 'white', borderRight: `1px solid ${colors.gray200}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: `1px solid ${colors.gray200}` }}>
          <Button variant="ghost" size="sm" onClick={onBack} icon={ChevronLeft}>Back to Dashboard</Button>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>CASE</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: colors.tealPrimary }}>MC-2024-001234</div>
          </div>
        </div>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.gray200}`, fontSize: '12px', color: colors.gray500 }}>PROGRESS</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sections.map((section) => (
            <SidebarNavItem
              key={section.id}
              icon={section.icon}
              label={section.label}
              active={activeSection === section.id}
              progress={section.progress}
              badge={section.badge}
              onClick={() => setActiveSection(section.id)}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: colors.gray50 }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', backgroundColor: 'white', borderBottom: `1px solid ${colors.gray200}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, color: colors.gray900 }}>
                Microbiology Case - MC-2024-001234
              </h1>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: colors.gray600, alignItems: 'center' }}>
                <span><strong>Patient:</strong> DOE, John</span>
                <span><strong>DOB:</strong> 1975-03-15</span>
                <Badge variant="teal">AST In Progress</Badge>
                <Badge variant="error" size="sm">STAT</Badge>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" icon={Printer}>Print</Button>
              <Button variant="ghost" size="sm" icon={History}>History</Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {/* Case Information */}
          <Card title="Case Information">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Lab Number</div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>MC-2024-001234</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Request Date</div>
                <div style={{ fontSize: '14px' }}>2024-12-20</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Status</div>
                <Badge variant="teal">AST In Progress</Badge>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Priority</div>
                <Badge variant="error">STAT</Badge>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Specimen Type</div>
                <div style={{ fontSize: '14px' }}>Blood Culture</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Collection</div>
                <div style={{ fontSize: '14px' }}>12/20 08:00</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Received</div>
                <div style={{ fontSize: '14px' }}>12/20 08:45</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Assigned Tech</div>
                <div style={{ fontSize: '14px' }}>J. Williams</div>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Clinical History</div>
              <div style={{ fontSize: '14px', padding: '12px', backgroundColor: colors.gray50, borderRadius: '4px' }}>
                67yo male with fever, chills x3 days. History of diabetes. Rule out sepsis.
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <div style={{ marginTop: '24px' }}>
            <Card title="Timeline" actions={<Button variant="secondary" icon={Plus} size="sm" onClick={() => setShowTimelineModal(true)}>Add Event</Button>}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {timelineEvents.map((event, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', paddingBottom: i < timelineEvents.length - 1 ? '16px' : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: event.color }} />
                      {i < timelineEvents.length - 1 && (
                        <div style={{ width: '2px', flex: 1, backgroundColor: colors.gray200, marginTop: '4px' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.gray900 }}>{event.title}</span>
                        <span style={{ fontSize: '12px', color: colors.gray500 }}>{event.time}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: colors.gray500, marginBottom: '4px' }}>Recorded by: {event.user}</div>
                      {event.detail && <div style={{ fontSize: '13px', color: colors.gray700 }}>{event.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Isolates */}
          <div style={{ marginTop: '24px' }}>
            <Card title="Isolates" actions={<Button variant="secondary" icon={Plus} size="sm" onClick={() => setShowIsolateModal(true)}>Add Isolate</Button>}>
              <DataTable
                columns={[
                  { header: '#', key: 'num' },
                  { header: 'Organism', key: 'organism', render: (v, r) => <span style={{ fontStyle: r.confirmed ? 'italic' : 'normal', fontWeight: 500 }}>{v}</span> },
                  { header: 'ID Method', key: 'method' },
                  { header: 'AST Status', key: 'astStatus', render: (v) => <Badge variant={v === 'Complete' ? 'success' : v === 'In Progress' ? 'teal' : 'default'}>{v}</Badge> },
                  { header: 'Significance', key: 'significance', render: (v) => <Badge variant={v === 'Yes' ? 'success' : 'default'}>{v}</Badge> },
                  { header: 'WHONET', key: 'whonet', render: (v) => v !== '--' ? <code style={{ backgroundColor: colors.gray100, padding: '2px 6px', borderRadius: '3px' }}>{v}</code> : 'â€”' },
                ]}
                data={[
                  { num: 1, organism: 'Staphylococcus aureus', confirmed: true, method: 'VITEK 2 MS', astStatus: 'Complete', significance: 'Yes', whonet: 'sau' },
                  { num: 2, organism: 'Pending ID', confirmed: false, method: '--', astStatus: 'Not Started', significance: '--', whonet: '--' },
                ]}
              />
            </Card>
          </div>

          {/* AST Results */}
          <div style={{ marginTop: '24px' }}>
            <Card title="AST Results">
              <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: '8px', marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedIsolate(expandedIsolate === 1 ? null : 1)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: colors.tealLighter,
                    borderRadius: expandedIsolate === 1 ? '8px 8px 0 0' : '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {expandedIsolate === 1 ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span style={{ fontWeight: 600 }}>Isolate 1: <em>Staphylococcus aureus</em></span>
                    <Badge variant="success" size="sm">Complete</Badge>
                  </div>
                  <div style={{ fontSize: '13px', color: colors.gray600 }}>
                    Panel: GP-AST | Breakpoint: CLSI 2024 M100
                  </div>
                </div>
                {expandedIsolate === 1 && (
                  <div style={{ padding: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: colors.gray50 }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Antibiotic</th>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>Raw Value</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Interp</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Report</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {astResults.map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.gray100}` }}>{row.antibiotic}</td>
                            <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.gray100}`, fontFamily: 'monospace' }}>{row.raw}</td>
                            <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                              <InterpBadge value={row.interp} />
                            </td>
                            <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                              {row.report === true ? <Check size={18} color={colors.green} /> : 
                               row.report === 'cascade' ? <span style={{ fontSize: '12px', color: colors.gray500 }}>Cascade</span> : 
                               <X size={18} color={colors.gray400} />}
                            </td>
                            <td style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.gray100}`, textAlign: 'center' }}>
                              {row.flags === 'dtest' && <AlertTriangle size={18} color={colors.orange} />}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Expert Rule Alert */}
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: colors.yellowLight, borderRadius: '8px', border: `1px solid ${colors.yellow}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <AlertTriangle size={18} color={colors.orange} />
                        <span style={{ fontWeight: 600, color: colors.gray900 }}>Expert Rule Alert</span>
                      </div>
                      <div style={{ fontSize: '14px', color: colors.gray700, marginBottom: '12px' }}>
                        ERY-R + CLI-S: D-test recommended to detect inducible clindamycin resistance
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="primary" size="sm" onClick={() => setShowExpertModal(true)}>Review & Decide</Button>
                        <Button variant="ghost" size="sm">Dismiss</Button>
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                      <Button variant="secondary" icon={Edit2} size="sm" onClick={() => setShowASTModal(true)}>Edit Results</Button>
                      <Button variant="secondary" icon={RefreshCw} size="sm">Recalculate</Button>
                      <Button variant="ghost" icon={Eye} size="sm">View Breakpoints</Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Isolate 2 Collapsed */}
              <div style={{ border: `1px solid ${colors.gray200}`, borderRadius: '8px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  backgroundColor: colors.gray50,
                  borderRadius: '8px',
                  opacity: 0.6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ChevronRight size={20} />
                    <span style={{ fontWeight: 600 }}>Isolate 2: Pending ID</span>
                    <Badge variant="default" size="sm">Awaiting ID</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Expert Review */}
          <div style={{ marginTop: '24px' }}>
            <Card title="Expert Review">
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '12px 16px', backgroundColor: colors.redLight, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} color={colors.red} />
                  <span style={{ fontWeight: 600, color: colors.red }}>2 flags require attention</span>
                </div>
                <div style={{ padding: '12px 16px', backgroundColor: colors.greenLight, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} color={colors.green} />
                  <span style={{ fontWeight: 600, color: colors.green }}>5 rules auto-applied</span>
                </div>
              </div>

              <SectionDivider label="Flags Requiring Attention" />
              
              <div style={{ padding: '16px', border: `1px solid ${colors.yellow}`, borderRadius: '8px', backgroundColor: colors.yellowLight, marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={18} color={colors.orange} />
                  <span style={{ fontWeight: 600 }}>Inducible Clindamycin Resistance Check</span>
                  <Badge variant="warning" size="sm">Isolate 1</Badge>
                </div>
                <div style={{ fontSize: '14px', color: colors.gray700, marginBottom: '12px' }}>
                  ERY-R + CLI-S pattern detected. D-test recommended to confirm clindamycin susceptibility.
                </div>
                <Button size="sm" onClick={() => setShowExpertModal(true)}>Review & Decide</Button>
              </div>

              <SectionDivider label="Auto-Applied Rules" />
              
              <div style={{ padding: '12px 16px', backgroundColor: colors.gray50, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Check size={16} color={colors.green} />
                  <span style={{ fontSize: '14px' }}>Intrinsic Resistance: Ampicillin suppressed (Staph always R)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Check size={16} color={colors.green} />
                  <span style={{ fontSize: '14px' }}>MSSA Inference: OXA-S â†’ all beta-lactams reportable as S</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={16} color={colors.green} />
                  <span style={{ fontSize: '14px' }}>Cascade Applied: GEN, LZD, DAP hidden (1st line all S)</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: 'white',
          borderTop: `1px solid ${colors.gray200}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.orange }}>
            <AlertTriangle size={16} />
            <span style={{ fontSize: '14px' }}>Unsaved changes</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost">Discard</Button>
            <Button variant="secondary">Save Progress</Button>
            <Button variant="outline">Release Preliminary</Button>
            <Button variant="primary" onClick={() => setShowFinalReportModal(true)}>Release Final</Button>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <AddTimelineEventModal isOpen={showTimelineModal} onClose={() => setShowTimelineModal(false)} />
      <IsolateModal isOpen={showIsolateModal} onClose={() => setShowIsolateModal(false)} />
      <EditASTModal isOpen={showASTModal} onClose={() => setShowASTModal(false)} />
      <ExpertReviewModal isOpen={showExpertModal} onClose={() => setShowExpertModal(false)} />
      <FinalReportModal isOpen={showFinalReportModal} onClose={() => setShowFinalReportModal(false)} />
    </div>
  );
};

// ============================================================
// AMR CONFIGURATION MAIN SCREEN (SIMPLIFIED)
// ============================================================
const AMRConfiguration = () => {
  const [activeSection, setActiveSection] = useState('organisms');

  const sections = [
    { id: 'organisms', label: 'Organisms', icon: Bug },
    { id: 'antibiotics', label: 'Antibiotics', icon: Pill },
    { id: 'breakpoints', label: 'Breakpoint Tables', icon: BarChart3 },
    { id: 'panels', label: 'AST Panels', icon: Layers },
    { id: 'expert-rules', label: 'Expert Rules', icon: GitBranch },
    { id: 'reporting-rules', label: 'Reporting Rules', icon: FileText },
    { id: 'protocols', label: 'Culture Protocols', icon: FlaskConical },
    { id: 'hub', label: 'Hub Subscription', icon: Cloud },
  ];

  const organisms = [
    { name: 'Escherichia coli', whonet: 'eco', group: 'Enterobacterales', status: 'Active' },
    { name: 'Klebsiella pneumoniae', whonet: 'kpn', group: 'Enterobacterales', status: 'Active' },
    { name: 'Staphylococcus aureus', whonet: 'sau', group: 'Staphylococcus', status: 'Active' },
    { name: 'Pseudomonas aeruginosa', whonet: 'pae', group: 'Non-fermenter', status: 'Active' },
  ];

  const antibiotics = [
    { name: 'Ampicillin', whonet: 'AMP', class: 'Penicillin', aware: 'Access', status: 'Active' },
    { name: 'Ceftriaxone', whonet: 'CRO', class: 'Cephalosporin (3G)', aware: 'Watch', status: 'Active' },
    { name: 'Ciprofloxacin', whonet: 'CIP', class: 'Fluoroquinolone', aware: 'Watch', status: 'Active' },
    { name: 'Meropenem', whonet: 'MEM', class: 'Carbapenem', aware: 'Watch', status: 'Active' },
    { name: 'Colistin', whonet: 'COL', class: 'Polymyxin', aware: 'Reserve', status: 'Active' },
  ];

  const expertRules = [
    { name: 'MRSA Inference', type: 'Inferred Resistance', organism: 'S. aureus', trigger: 'OXA = R', action: 'All beta-lactams â†’ R', status: 'Active' },
    { name: 'D-Test Indicated', type: 'D-Test Required', organism: 'Staph/Strep', trigger: 'ERY = R, CLI = S', action: 'Flag for D-test', status: 'Active' },
    { name: 'ESBL Screen', type: 'Verification Required', organism: 'Enterobacterales', trigger: 'CTX = R OR CAZ = R', action: 'Flag, confirm', status: 'Active' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'organisms':
        return (
          <Card noPadding>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color={colors.gray400} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search organisms..." style={{ width: '250px', padding: '10px 12px 10px 40px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }} />
              </div>
              <Button icon={Plus}>Add Organism</Button>
            </div>
            <DataTable
              columns={[
                { header: 'Organism Name', key: 'name', render: (v) => <span style={{ fontStyle: 'italic' }}>{v}</span> },
                { header: 'WHONET', key: 'whonet', render: (v) => <code style={{ backgroundColor: colors.gray100, padding: '2px 6px', borderRadius: '3px' }}>{v}</code> },
                { header: 'Group', key: 'group' },
                { header: 'Status', key: 'status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'default'}>{v}</Badge> },
                { header: '', key: 'actions', render: () => <MoreVertical size={18} color={colors.gray400} style={{ cursor: 'pointer' }} /> },
              ]}
              data={organisms}
            />
          </Card>
        );
      
      case 'antibiotics':
        return (
          <Card noPadding>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color={colors.gray400} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search antibiotics..." style={{ width: '250px', padding: '10px 12px 10px 40px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }} />
              </div>
              <Button icon={Plus}>Add Antibiotic</Button>
            </div>
            <DataTable
              columns={[
                { header: 'Antibiotic Name', key: 'name' },
                { header: 'WHONET', key: 'whonet', render: (v) => <code style={{ backgroundColor: colors.gray100, padding: '2px 6px', borderRadius: '3px' }}>{v}</code> },
                { header: 'Class', key: 'class' },
                { header: 'AWaRe', key: 'aware', render: (v) => <Badge variant={v === 'Access' ? 'success' : v === 'Watch' ? 'warning' : 'error'} size="sm">{v}</Badge> },
                { header: 'Status', key: 'status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'default'}>{v}</Badge> },
                { header: '', key: 'actions', render: () => <MoreVertical size={18} color={colors.gray400} style={{ cursor: 'pointer' }} /> },
              ]}
              data={antibiotics}
            />
          </Card>
        );
      
      case 'expert-rules':
        return (
          <Card noPadding>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <select style={{ padding: '10px 12px', border: `1px solid ${colors.gray300}`, borderRadius: '4px', fontSize: '14px' }}><option>All Types</option></select>
              <Button icon={Plus}>Add Rule</Button>
            </div>
            <DataTable
              columns={[
                { header: 'Rule Name', key: 'name', render: (v) => <strong>{v}</strong> },
                { header: 'Type', key: 'type', render: (v) => <Badge variant={v.includes('Inferred') ? 'error' : v.includes('D-Test') ? 'warning' : 'info'} size="sm">{v}</Badge> },
                { header: 'Organism(s)', key: 'organism' },
                { header: 'Trigger', key: 'trigger', render: (v) => <code style={{ fontSize: '12px', backgroundColor: colors.gray100, padding: '2px 6px', borderRadius: '3px' }}>{v}</code> },
                { header: 'Action', key: 'action' },
                { header: 'Status', key: 'status', render: (v) => <Badge variant={v === 'Active' ? 'success' : 'default'}>{v}</Badge> },
              ]}
              data={expertRules}
            />
          </Card>
        );
      
      default:
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '16px', color: colors.gray500 }}>Select a configuration section from the sidebar</div>
            </div>
          </Card>
        );
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{ width: '240px', backgroundColor: 'white', borderRight: `1px solid ${colors.gray200}`, padding: '16px 0' }}>
        <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${colors.gray200}`, marginBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.gray900 }}>AMR Configuration</h2>
        </div>
        {sections.map((section) => (
          <SidebarNavItem
            key={section.id}
            icon={section.icon}
            label={section.label}
            active={activeSection === section.id}
            onClick={() => setActiveSection(section.id)}
          />
        ))}
      </div>
      <div style={{ flex: 1, backgroundColor: colors.gray50, overflow: 'auto', padding: '24px' }}>
        <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '8px' }}>
          Administration / AMR Configuration / {sections.find(s => s.id === activeSection)?.label}
        </div>
        <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600, color: colors.gray900 }}>
          {sections.find(s => s.id === activeSection)?.label}
        </h1>
        {renderContent()}
      </div>
    </div>
  );
};

// ============================================================
// WHONET INTEGRATION SCREEN
// ============================================================
const WHONETIntegration = () => {
  const [activeTab, setActiveTab] = useState('export');

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '13px', color: colors.gray500, marginBottom: '8px' }}>Reports / WHONET Integration</div>
      <h1 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: 600, color: colors.gray900 }}>WHONET Integration</h1>

      <TabNav
        tabs={[
          { id: 'export', label: 'Export Generator' },
          { id: 'history', label: 'Export History' },
          { id: 'mapping', label: 'Code Mapping' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <Card title="Export Parameters">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Start Date" required type="date" />
              <Input label="End Date" required type="date" />
            </div>
            <Select label="Specimen Types" options={[{ value: 'all', label: 'All Specimens' }]} />
            <Select label="Patient Origin" options={[{ value: 'all', label: 'All Origins' }]} />
            <div style={{ marginBottom: '16px' }}>
              <Checkbox label="Include patient demographics" checked />
              <Checkbox label="First isolate per patient only" />
              <Checkbox label="Exclude contaminants" checked />
            </div>
            <Button icon={Download} fullWidth>Generate Export</Button>
          </Card>

          <Card title="Export Preview">
            <div style={{ padding: '20px', backgroundColor: colors.tealLighter, borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 700, color: colors.tealPrimary }}>1,247</div>
              <div style={{ fontSize: '14px', color: colors.tealPrimary }}>isolates match criteria</div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'mapping' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Organisms', mapped: 92, total: 100 },
              { label: 'Antibiotics', mapped: 48, total: 50 },
              { label: 'Specimens', mapped: 25, total: 25 },
              { label: 'Origins', mapped: 8, total: 8 },
            ].map((item) => (
              <div key={item.label} style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: `1px solid ${colors.gray200}` }}>
                <div style={{ fontSize: '13px', color: colors.gray600, marginBottom: '8px' }}>{item.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: item.mapped === item.total ? colors.green : colors.orange }}>{item.mapped}</span>
                  <span style={{ fontSize: '14px', color: colors.gray500 }}>/ {item.total}</span>
                </div>
                <div style={{ marginTop: '8px', height: '6px', backgroundColor: colors.gray200, borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(item.mapped / item.total) * 100}%`, height: '100%', backgroundColor: item.mapped === item.total ? colors.green : colors.orange }} />
                </div>
              </div>
            ))}
          </div>

          <Card title="Organism Mapping" actions={<Button variant="secondary" size="sm" icon={Plus}>Add Mapping</Button>}>
            <DataTable
              columns={[
                { header: 'OpenELIS Organism', key: 'local', render: (v) => <span style={{ fontStyle: 'italic' }}>{v}</span> },
                { header: 'WHONET Code', key: 'whonet', render: (v) => v ? <code style={{ backgroundColor: colors.gray100, padding: '2px 6px', borderRadius: '3px' }}>{v}</code> : <Badge variant="warning" size="sm">Unmapped</Badge> },
                { header: 'Status', key: 'status', render: (v) => <Badge variant={v === 'Verified' ? 'success' : v === 'Auto' ? 'info' : 'warning'} size="sm">{v}</Badge> },
              ]}
              data={[
                { local: 'Escherichia coli', whonet: 'eco', status: 'Verified' },
                { local: 'Klebsiella pneumoniae', whonet: 'kpn', status: 'Auto' },
                { local: 'Staphylococcus aureus', whonet: 'sau', status: 'Verified' },
                { local: 'Acinetobacter baumannii complex', whonet: null, status: 'Unmapped' },
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================================
// MAIN APPLICATION
// ============================================================
const AMRModuleComplete = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('micro-dashboard');
  const [selectedCase, setSelectedCase] = useState(null);

  const handleNavigate = (view) => {
    setCurrentView(view);
    setSelectedCase(null);
  };

  const handleCaseClick = (caseData) => {
    setSelectedCase(caseData);
    setCurrentView('case-detail');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'order-entry':
        return <OrderEntry onCreateMicroCase={() => handleNavigate('micro-dashboard')} />;
      case 'micro-dashboard':
        return <MicrobiologyDashboard onCaseClick={handleCaseClick} />;
      case 'micro-pending':
        return <PendingCultures onCaseClick={handleCaseClick} />;
      case 'micro-ast':
        return <ASTWorklist onCaseClick={handleCaseClick} />;
      case 'case-detail':
        return <MicrobiologyCaseDetail caseData={selectedCase} onBack={() => handleNavigate('micro-dashboard')} />;
      case 'amr-config':
        return <AMRConfiguration />;
      case 'whonet-export':
        return <WHONETIntegration />;
      default:
        return (
          <div style={{ padding: '24px' }}>
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h2 style={{ marginBottom: '16px', color: colors.gray700 }}>Welcome to OpenELIS Global</h2>
                <p style={{ color: colors.gray500, marginBottom: '24px' }}>Choose from the sidebar navigation to get started</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button onClick={() => handleNavigate('order-entry')}>Order Entry</Button>
                  <Button variant="secondary" onClick={() => handleNavigate('micro-dashboard')}>Microbiology Dashboard</Button>
                  <Button variant="secondary" onClick={() => handleNavigate('micro-pending')}>Pending Cultures</Button>
                  <Button variant="secondary" onClick={() => handleNavigate('micro-ast')}>AST Worklist</Button>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <OpenELISHeader
        currentLab="Central Hospital Laboratory"
        user="J. Williams"
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <OpenELISSidebar isOpen={sidebarOpen} currentView={currentView} onNavigate={handleNavigate} />
        <main style={{ flex: 1, overflow: 'auto', backgroundColor: colors.gray50 }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AMRModuleComplete;
