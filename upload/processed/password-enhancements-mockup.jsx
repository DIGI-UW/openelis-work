import React, { useState, useCallback } from 'react';

/* ── i18n helper (top of every component) ── */
const t = (key, fallback) => fallback || key;

/* ── Shared password validation logic ── */
const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

const validatePassword = (password, confirmPassword, currentPassword = null) => {
  const errors = {};
  if (!password) {
    errors.password = [t('error.password.required', 'Password is required.')];
  } else {
    const pwErrors = [];
    if (password.length < MIN_LENGTH) {
      pwErrors.push(t('error.password.tooShort', `Password must be at least ${MIN_LENGTH} characters.`));
    }
    if (password.length > MAX_LENGTH) {
      pwErrors.push(t('error.password.tooLong', `Password must be no more than ${MAX_LENGTH} characters.`));
    }
    if (currentPassword && password === currentPassword) {
      pwErrors.push(t('error.password.sameAsCurrent', 'New password must be different from the current password.'));
    }
    if (pwErrors.length > 0) errors.password = pwErrors;
  }
  if (!confirmPassword) {
    errors.confirm = [t('error.password.required', 'Password is required.')];
  } else if (password && confirmPassword !== password) {
    errors.confirm = [t('error.password.mismatch', 'Passwords do not match.')];
  }
  return errors;
};

/* ══════════════════════════════════════════════════════════════
   VIEW 1: Enhanced Modify User Page
   Path: Home → Admin Management → User Management → Modify User
   ══════════════════════════════════════════════════════════════ */

const ModifyUserPage = () => {
  // Simulated existing user data
  const [formData, setFormData] = useState({
    loginName: 'Bill',
    password: '',
    repeatPassword: '',
    firstName: 'Hello',
    lastName: 'Hi',
    passwordExpirationDate: '03/15/2036', // 10 years from today (default)
    userTimeOut: '500',
    accountLocked: 'N',
    accountDisabled: 'N',
    isActive: 'Y',
    forcePasswordReset: true, // defaults ON when password fields are touched
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password' || field === 'repeatPassword') {
      if (!passwordTouched) setPasswordTouched(true);
    }
    setShowSuccess(false);
  };

  const handleSave = () => {
    // Only validate password if it was entered
    if (passwordTouched && (formData.password || formData.repeatPassword)) {
      const pwErrors = validatePassword(formData.password, formData.repeatPassword);
      if (Object.keys(pwErrors).length > 0) {
        setErrors(pwErrors);
        return;
      }
    }
    setErrors({});
    setShowSuccess(true);
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: '#f4f4f4', minHeight: '100vh' }}>
      {/* ── Header Bar ── */}
      <header style={{
        background: '#0f62fe', color: '#fff', height: '48px',
        display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>
          {t('app.title', 'OpenELIS Global')}
        </span>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {t('app.version', 'Version: 3.x')}
        </span>
      </header>

      <div style={{ display: 'flex' }}>
        {/* ── Sidebar (simplified) ── */}
        <nav style={{
          width: '256px', background: '#fff', borderRight: '1px solid #e0e0e0',
          minHeight: 'calc(100vh - 48px)', padding: '1rem 0'
        }}>
          {[
            'Reflex Tests Configuration', 'Analyzer Test Name', 'Lab Number Management',
            'Program Entry', 'Provider Management', 'Barcode Configuration', 'List Plugins',
            'Organization Management', 'Result Reporting Configuration',
          ].map(item => (
            <div key={item} style={{
              padding: '0.5rem 1rem', fontSize: '14px', color: '#525252', cursor: 'pointer'
            }}>{item}</div>
          ))}
          <div style={{
            padding: '0.5rem 1rem', fontSize: '14px', color: '#0f62fe',
            fontWeight: 600, background: '#e0e0e0', cursor: 'pointer'
          }}>
            {t('nav.userManagement', 'User Management')}
          </div>
          {[
            'Batch test reassignment', 'Test Management', 'Menu Configuration',
            'General Configurations', 'Application Properties',
          ].map(item => (
            <div key={item} style={{
              padding: '0.5rem 1rem', fontSize: '14px', color: '#525252', cursor: 'pointer'
            }}>{item}</div>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
          {/* Breadcrumb */}
          <nav style={{ fontSize: '14px', color: '#0f62fe', marginBottom: '0.5rem' }}>
            <a href="#" style={{ color: '#0f62fe', textDecoration: 'none' }}>
              {t('nav.home', 'Home')}
            </a>
            {' / '}
            <a href="#" style={{ color: '#0f62fe', textDecoration: 'none' }}>
              {t('nav.adminManagement', 'Admin Management')}
            </a>
            {' / '}
            <a href="#" style={{ color: '#0f62fe', textDecoration: 'none' }}>
              {t('nav.userManagement', 'User Management')}
            </a>
            {' /'}
          </nav>

          <h1 style={{ fontSize: '28px', fontWeight: 400, margin: '0 0 1.5rem 0', color: '#161616' }}>
            {t('heading.user.modify', 'Modify User')}
          </h1>

          {/* ── Success Notification ── */}
          {showSuccess && (
            <div style={{
              background: '#defbe6', border: '1px solid #24a148', borderLeft: '3px solid #24a148',
              padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start'
            }}>
              <div>
                <strong style={{ color: '#161616', fontSize: '14px' }}>
                  {t('message.password.resetSuccess', 'User saved successfully.')}
                </strong>
                {passwordTouched && formData.forcePasswordReset && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#161616' }}>
                    {t('message.password.resetSuccessForceReset',
                      'The user will be required to change their password at next login.')}
                  </p>
                )}
              </div>
              <button onClick={() => setShowSuccess(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#161616'
              }}>✕</button>
            </div>
          )}

          {/* ── Form ── */}
          <div style={{ background: '#fff', padding: '0' }}>
            {/* Login Name (read-only) */}
            <FormRow label={t('label.user.loginName', 'Login Name')} required>
              <input
                type="text"
                value={formData.loginName}
                readOnly
                style={{
                  ...inputStyle,
                  background: '#f4f4f4',
                  cursor: 'not-allowed'
                }}
              />
            </FormRow>

            {/* ── OWASP Password Requirements (UPDATED) ── */}
            <div style={{ padding: '1rem 0', borderBottom: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '320px', paddingRight: '2rem' }}>
                  <strong style={{ fontSize: '14px', color: '#161616' }}>
                    {t('label.password.requirements', 'Password must :')}
                  </strong>
                </div>
                <div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '14px', color: '#525252' }}>
                    <li>{t('label.password.req.minLength', 'Be at least 8 characters')}</li>
                    <li>{t('label.password.req.maxLength', 'Be no more than 64 characters')}</li>
                    <li>{t('label.password.req.anyChars', 'May contain any characters including spaces')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Password */}
            <FormRow label={t('label.password.newPassword', 'Password')} required>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={t('placeholder.password.newPassword', 'Enter new password')}
                  style={{
                    ...inputStyle,
                    borderColor: errors.password ? '#da1e28' : '#8d8d8d'
                  }}
                />
                <span style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer', color: '#525252'
                }}>👁</span>
              </div>
              {errors.password && (
                <div style={{ marginTop: '0.25rem' }}>
                  {errors.password.map((err, i) => (
                    <div key={i} style={{ color: '#da1e28', fontSize: '12px' }}>{err}</div>
                  ))}
                </div>
              )}
            </FormRow>

            {/* Repeat Password */}
            <FormRow label={t('label.password.confirmPassword', 'Repeat Password')} required>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={formData.repeatPassword}
                  onChange={(e) => handleChange('repeatPassword', e.target.value)}
                  placeholder={t('placeholder.password.confirmPassword', 'Re-enter new password')}
                  style={{
                    ...inputStyle,
                    borderColor: errors.confirm ? '#da1e28' : '#8d8d8d'
                  }}
                />
                <span style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer', color: '#525252'
                }}>👁</span>
              </div>
              {errors.confirm && (
                <div style={{ marginTop: '0.25rem' }}>
                  {errors.confirm.map((err, i) => (
                    <div key={i} style={{ color: '#da1e28', fontSize: '12px' }}>{err}</div>
                  ))}
                </div>
              )}
            </FormRow>

            {/* ── NEW: Force Password Reset Toggle ── */}
            <div style={{
              padding: '1rem 0', borderBottom: '1px solid #e0e0e0',
              display: 'flex', alignItems: 'flex-start'
            }}>
              <div style={{ width: '320px', paddingRight: '2rem' }}>
                <label style={{ fontSize: '14px', color: '#161616' }}>
                  {t('label.password.forceResetToggle', 'Force password reset on next login')}
                </label>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Carbon-style Toggle */}
                  <button
                    onClick={() => handleChange('forcePasswordReset', !formData.forcePasswordReset)}
                    style={{
                      width: '48px', height: '24px', borderRadius: '12px', border: 'none',
                      background: formData.forcePasswordReset ? '#24a148' : '#8d8d8d',
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
                    }}
                  >
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '3px',
                      left: formData.forcePasswordReset ? '27px' : '3px',
                      transition: 'left 0.2s'
                    }} />
                  </button>
                  <span style={{ fontSize: '14px', color: '#525252' }}>
                    {formData.forcePasswordReset
                      ? t('label.toggle.on', 'On')
                      : t('label.toggle.off', 'Off')}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#6f6f6f', margin: '0.5rem 0 0 0', maxWidth: '400px' }}>
                  {t('label.password.forceResetHelperText',
                    'When enabled, the user must change their password the next time they log in.')}
                </p>
              </div>
            </div>

            {/* ── Password Expiration Date (RETAINED — FR-AR-006) ── */}
            {/* Kept for countries with regulatory requirements for periodic expiry.
                Defaults to 10 years from the date the password is set. */}
            <FormRow label={t('label.password.expirationDate', 'Password Expiration Date')} required>
              <div style={{ position: 'relative', maxWidth: '200px' }}>
                <input
                  type="text"
                  value={formData.passwordExpirationDate}
                  onChange={(e) => handleChange('passwordExpirationDate', e.target.value)}
                  style={inputStyle}
                />
                <span style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer', color: '#525252', fontSize: '16px'
                }}>&#128197;</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6f6f6f', margin: '0.5rem 0 0 0' }}>
                {t('label.password.expirationHelperText',
                  'Defaults to 10 years from today. Adjust if local policy requires shorter expiry.')}
              </p>
            </FormRow>

            {/* First Name */}
            <FormRow label={t('label.user.firstName', 'First Name')} required>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                style={inputStyle}
              />
            </FormRow>

            {/* Last Name */}
            <FormRow label={t('label.user.lastName', 'Last Name')} required>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                style={inputStyle}
              />
            </FormRow>

            {/* User Time Out */}
            <FormRow label={t('label.user.userTimeOut', 'User Time Out (minutes)')} required>
              <input
                type="text"
                value={formData.userTimeOut}
                onChange={(e) => handleChange('userTimeOut', e.target.value)}
                style={inputStyle}
              />
            </FormRow>

            {/* Account Locked */}
            <FormRow label={t('label.user.accountLocked', 'Account Locked')} required>
              <RadioPair
                name="accountLocked"
                value={formData.accountLocked}
                onChange={(v) => handleChange('accountLocked', v)}
              />
            </FormRow>

            {/* Account Disabled */}
            <FormRow label={t('label.user.accountDisabled', 'Account Disabled')} required>
              <RadioPair
                name="accountDisabled"
                value={formData.accountDisabled}
                onChange={(v) => handleChange('accountDisabled', v)}
              />
            </FormRow>

            {/* Is Active */}
            <FormRow label={t('label.user.isActive', 'Is Active')} required>
              <RadioPair
                name="isActive"
                value={formData.isActive}
                onChange={(v) => handleChange('isActive', v)}
              />
            </FormRow>

            {/* Roles Section (placeholder) */}
            <div style={{
              margin: '2rem 0 1rem 0', padding: '1.5rem', background: '#fff',
              border: '1px solid #e0e0e0'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 400, margin: '0 0 0.5rem 0' }}>
                {t('heading.user.roles', 'Roles')}
              </h2>
              <p style={{ fontSize: '14px', color: '#525252', margin: 0 }}>
                {t('label.user.rolesDescription',
                  'There are two types of Roles. Global Roles which are set for the entire application and Lab Unit Roles which can be set for all Lab Units or specific Lab Units.')}
              </p>
            </div>

            {/* Save / Cancel buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button style={{
                background: '#0f62fe', color: '#fff', border: 'none', padding: '0.75rem 3rem',
                fontSize: '14px', cursor: 'pointer'
              }}>
                {t('button.save', 'Save')}
              </button>
              <button
                onClick={handleSave}
                style={{
                  background: 'transparent', color: '#0f62fe', border: '1px solid #0f62fe',
                  padding: '0.75rem 2rem', fontSize: '14px', cursor: 'pointer'
                }}
              >
                {t('button.cancel', 'Cancel')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ── Shared form row component ── */
const FormRow = ({ label, required, children }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', padding: '1rem 0',
    borderBottom: '1px solid #e0e0e0'
  }}>
    <div style={{ width: '320px', paddingRight: '2rem', paddingTop: '0.5rem' }}>
      <label style={{ fontSize: '14px', color: '#161616' }}>
        {label}{required && <span style={{ color: '#da1e28' }}>*</span>} :
      </label>
    </div>
    <div style={{ flex: 1, maxWidth: '420px' }}>
      {children}
    </div>
  </div>
);

/* ── Radio Y/N pair ── */
const RadioPair = ({ name, value, onChange }) => (
  <div style={{ display: 'flex', gap: '1.5rem', paddingTop: '0.5rem' }}>
    {['Y', 'N'].map(opt => (
      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '14px', cursor: 'pointer' }}>
        <input
          type="radio"
          name={name}
          checked={value === opt}
          onChange={() => onChange(opt)}
          style={{ accentColor: '#0f62fe' }}
        />
        {opt}
      </label>
    ))}
  </div>
);

const inputStyle = {
  width: '100%', padding: '0.65rem 0.75rem', fontSize: '14px',
  border: '1px solid #8d8d8d', borderBottom: '2px solid #8d8d8d',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
  fontFamily: "'IBM Plex Sans', sans-serif"
};


/* ══════════════════════════════════════════════════════════════
   VIEW 2: Change Password Page (Enhanced for Force Reset)
   Matches existing OpenELIS Change Password layout:
   two-column — form left, requirements right.
   When force_password_reset = true: info banner shown, Exit hidden.
   ══════════════════════════════════════════════════════════════ */

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const isForceReset = true; // Simulates force_password_reset = true

  const handleSubmit = () => {
    const errs = {};
    if (!currentPassword) {
      errs.current = [t('error.password.required', 'Password is required.')];
    }
    const pwErrs = validatePassword(newPassword, repeatPassword, currentPassword);
    Object.assign(errs, pwErrs);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setShowSuccess(true);
  };

  const fieldContainerStyle = { marginBottom: '1.25rem' };
  const passwordFieldStyle = { position: 'relative' };
  const eyeIconStyle = {
    position: 'absolute', right: '12px', top: '50%',
    transform: 'translateY(-50%)', cursor: 'pointer', color: '#525252',
    fontSize: '18px', background: 'none', border: 'none', padding: 0
  };

  return (
    <div style={{
      fontFamily: "'IBM Plex Sans', sans-serif", background: '#f4f4f4',
      minHeight: '100vh', display: 'flex', flexDirection: 'column'
    }}>
      {/* ── Header ── */}
      <header style={{
        background: '#0f62fe', color: '#fff', height: '48px',
        display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>
          {t('app.title', 'OpenELIS Global')}
        </span>
        <span style={{ fontSize: '12px', opacity: 0.7 }}>
          {t('app.version', 'Version: 3.x')}
        </span>
      </header>

      <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '960px' }}>

        {/* ── Force-reset info banner (only shown when force_password_reset = true) ── */}
        {isForceReset && (
          <div style={{
            background: '#edf5ff', borderLeft: '3px solid #0f62fe',
            padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '14px', color: '#161616'
          }}>
            {t('label.password.forceChangeInstructions',
              'Your administrator has required you to change your password before continuing.')}
          </div>
        )}

        {/* Success state */}
        {showSuccess && (
          <div style={{
            background: '#defbe6', borderLeft: '3px solid #24a148',
            padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '14px', color: '#161616'
          }}>
            {t('message.password.changeSuccess',
              'Your password has been changed successfully. Redirecting...')}
          </div>
        )}

        <h1 style={{ fontSize: '28px', fontWeight: 300, margin: '0 0 2rem 0', color: '#161616' }}>
          {t('heading.password.change', 'Change Password')}
        </h1>

        {/* ── Two-column layout: form left, requirements right ── */}
        <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start' }}>

          {/* LEFT: Form fields */}
          <div style={{ flex: '0 0 420px' }}>

            {/* Username (read-only) */}
            <div style={fieldContainerStyle}>
              <div style={passwordFieldStyle}>
                <input
                  type="text"
                  value="Bill"
                  readOnly
                  placeholder={t('label.password.username', 'Username')}
                  style={{
                    ...inputStyle, background: '#f4f4f4', color: '#161616',
                    cursor: 'not-allowed', borderBottom: '2px solid #0f62fe'
                  }}
                />
              </div>
            </div>

            {/* Current Password */}
            <div style={fieldContainerStyle}>
              <div style={passwordFieldStyle}>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setErrors({}); }}
                  placeholder={t('placeholder.password.currentPassword', 'Current Password')}
                  style={{
                    ...inputStyle, background: '#f4f4f4',
                    borderBottom: '2px solid #0f62fe',
                    borderColor: errors.current ? '#da1e28' : undefined
                  }}
                />
                <button style={eyeIconStyle} aria-label="Toggle visibility">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 3C4.5 3 1.7 5.1 0.5 8c1.2 2.9 4 5 7.5 5s6.3-2.1 7.5-5c-1.2-2.9-4-5-7.5-5zm0 8.3c-1.8 0-3.3-1.5-3.3-3.3S6.2 4.7 8 4.7s3.3 1.5 3.3 3.3S9.8 11.3 8 11.3zm0-5.3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              {errors.current && (
                <div style={{ marginTop: '0.25rem' }}>
                  {errors.current.map((err, i) => (
                    <div key={i} style={{ color: '#da1e28', fontSize: '12px' }}>{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Spacer between current and new */}
            <div style={{ height: '1.5rem' }} />

            {/* New Password */}
            <div style={fieldContainerStyle}>
              <div style={passwordFieldStyle}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrors({}); }}
                  placeholder={t('placeholder.password.newPassword', 'New Password')}
                  style={{
                    ...inputStyle, background: '#f4f4f4',
                    borderBottom: '2px solid #0f62fe',
                    borderColor: errors.password ? '#da1e28' : undefined
                  }}
                />
                <button style={eyeIconStyle} aria-label="Toggle visibility">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 3C4.5 3 1.7 5.1 0.5 8c1.2 2.9 4 5 7.5 5s6.3-2.1 7.5-5c-1.2-2.9-4-5-7.5-5zm0 8.3c-1.8 0-3.3-1.5-3.3-3.3S6.2 4.7 8 4.7s3.3 1.5 3.3 3.3S9.8 11.3 8 11.3zm0-5.3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              {errors.password && (
                <div style={{ marginTop: '0.25rem' }}>
                  {errors.password.map((err, i) => (
                    <div key={i} style={{ color: '#da1e28', fontSize: '12px' }}>{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Repeat Password */}
            <div style={fieldContainerStyle}>
              <div style={passwordFieldStyle}>
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => { setRepeatPassword(e.target.value); setErrors({}); }}
                  placeholder={t('placeholder.password.repeatPassword', 'Repeat Password')}
                  style={{
                    ...inputStyle, background: '#f4f4f4',
                    borderBottom: '2px solid #0f62fe',
                    borderColor: errors.confirm ? '#da1e28' : undefined
                  }}
                />
                <button style={eyeIconStyle} aria-label="Toggle visibility">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 3C4.5 3 1.7 5.1 0.5 8c1.2 2.9 4 5 7.5 5s6.3-2.1 7.5-5c-1.2-2.9-4-5-7.5-5zm0 8.3c-1.8 0-3.3-1.5-3.3-3.3S6.2 4.7 8 4.7s3.3 1.5 3.3 3.3S9.8 11.3 8 11.3zm0-5.3c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </button>
              </div>
              {errors.confirm && (
                <div style={{ marginTop: '0.25rem' }}>
                  {errors.confirm.map((err, i) => (
                    <div key={i} style={{ color: '#da1e28', fontSize: '12px' }}>{err}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleSubmit}
                disabled={showSuccess}
                style={{
                  background: '#0f62fe', color: '#fff', border: 'none',
                  padding: '0.85rem 2.5rem', fontSize: '14px',
                  cursor: showSuccess ? 'default' : 'pointer'
                }}
              >
                {t('button.password.submit', 'Submit')}
              </button>

              {/* Exit button — HIDDEN when force_password_reset is true (FR-FR-006) */}
              {!isForceReset && (
                <button style={{
                  background: '#393939', color: '#fff', border: 'none',
                  padding: '0.85rem 2.5rem', fontSize: '14px', cursor: 'pointer'
                }}>
                  {t('button.password.exit', 'Exit')}
                </button>
              )}

              {/* Visual indicator that Exit is hidden */}
              {isForceReset && (
                <span style={{
                  fontSize: '12px', color: '#6f6f6f', alignSelf: 'center', fontStyle: 'italic'
                }}>
                  {t('label.password.exitHidden', '(Exit disabled — password change required)')}
                </span>
              )}
            </div>
          </div>

          {/* RIGHT: Password requirements panel */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 1rem 0', color: '#161616' }}>
              {t('label.password.requirements', 'New Password must :')}
            </h3>
            <ul style={{
              margin: 0, paddingLeft: '1.25rem', fontSize: '14px',
              color: '#161616', lineHeight: '2'
            }}>
              <li>{t('label.password.req.minLength', 'Must be at least 8 characters')}</li>
              <li>{t('label.password.req.maxLength', 'May be up to 64 characters')}</li>
              <li>{t('label.password.req.anyChars', 'May contain any characters including spaces')}</li>
              <li>{t('label.password.req.notSame', 'Must not be the same as the current password')}</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};


/* ══════════════════════════════════════════════════════════════
   VIEW 3: User Management List — Enhanced with "Reset Required" column
   ══════════════════════════════════════════════════════════════ */

const UserManagementList = () => {
  const users = [
    { first: 'Service', last: 'External', login: 'serviceUser', expDate: '', resetReq: false, locked: '', disabled: '', active: 'N', timeout: '' },
    { first: 'Namanya', last: 'Abert', login: 'abertnamanya', expDate: '20/03/2033', resetReq: true, locked: 'N', disabled: 'N', active: 'Y', timeout: '480' },
    { first: 'analyzer', last: 'import', login: 'analyzerImport', expDate: '04/04/2034', resetReq: false, locked: 'N', disabled: 'N', active: 'Y', timeout: '480' },
    { first: 'Viro', last: 'Test', login: 'viro', expDate: '13/05/2034', resetReq: false, locked: 'N', disabled: 'N', active: 'Y', timeout: '480' },
    { first: 'hema', last: 'tology', login: 'hema', expDate: '04/07/2034', resetReq: true, locked: 'N', disabled: 'N', active: 'Y', timeout: '480' },
    { first: 'path', last: 'ology', login: 'path', expDate: '04/07/2034', resetReq: false, locked: 'N', disabled: 'N', active: 'Y', timeout: '480' },
    { first: 'Pascal', last: 'Gihozo', login: 'pascal', expDate: '14/07/2034', resetReq: false, locked: 'N', disabled: 'N', active: 'Y', timeout: '480' },
  ];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: '#f4f4f4', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#0f62fe', color: '#fff', height: '48px',
        display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '1rem'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>
          {t('app.title', 'OpenELIS Global')}
        </span>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar (simplified) */}
        <nav style={{
          width: '256px', background: '#fff', borderRight: '1px solid #e0e0e0',
          minHeight: 'calc(100vh - 48px)', padding: '1rem 0'
        }}>
          <div style={{
            padding: '0.5rem 1rem', fontSize: '14px', color: '#0f62fe',
            fontWeight: 600, background: '#e0e0e0'
          }}>
            {t('nav.userManagement', 'User Management')}
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: '1.5rem 2rem' }}>
          <nav style={{ fontSize: '14px', color: '#0f62fe', marginBottom: '0.5rem' }}>
            <a href="#" style={{ color: '#0f62fe', textDecoration: 'none' }}>
              {t('nav.home', 'Home')}
            </a>
            {' / '}
            <a href="#" style={{ color: '#0f62fe', textDecoration: 'none' }}>
              {t('nav.adminManagement', 'Admin Management')}
            </a>
            {' / '}
            <a href="#" style={{ color: '#0f62fe', textDecoration: 'none' }}>
              {t('nav.userManagement', 'User Management')}
            </a>
            {' /'}
          </nav>

          <h1 style={{ fontSize: '28px', fontWeight: 400, margin: '0 0 0.5rem 0' }}>
            {t('heading.user.management', 'User Management')}
          </h1>
          <p style={{ fontSize: '14px', color: '#525252', margin: '0 0 1.5rem 0' }}>
            {t('label.user.instructions',
              'Select a User to Modify or to Deactivate. You can set a Filter, Search for users, or Add a User along with the controls at the top.')}
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
            <button style={{
              background: '#e0e0e0', color: '#525252', border: 'none',
              padding: '0.65rem 1.5rem', fontSize: '14px', cursor: 'pointer'
            }}>
              {t('button.user.modify', 'Modify')}
            </button>
            <button style={{
              background: '#e0e0e0', color: '#525252', border: 'none',
              padding: '0.65rem 1.5rem', fontSize: '14px', cursor: 'pointer'
            }}>
              {t('button.user.deactivate', 'Deactivate')}
            </button>
            <button style={{
              background: '#0f62fe', color: '#fff', border: 'none',
              padding: '0.65rem 1.5rem', fontSize: '14px', cursor: 'pointer'
            }}>
              {t('button.user.add', 'Add')}
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: '14px', color: '#525252' }}>
              Showing 1 - 7 of 7
            </span>
          </div>

          {/* Search */}
          <div style={{
            padding: '1rem', background: '#fff', border: '1px solid #e0e0e0',
            marginBottom: '1rem'
          }}>
            <input
              type="text"
              placeholder={t('placeholder.user.search', 'Search By User Names...')}
              style={{ ...inputStyle, maxWidth: '100%' }}
            />
          </div>

          {/* ── Table with NEW "Reset Required" column ── */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse', fontSize: '14px',
              background: '#fff'
            }}>
              <thead>
                <tr style={{ background: '#e0e0e0' }}>
                  <th style={thStyle}>{t('label.user.select', 'Select')}</th>
                  <th style={thStyle}>{t('label.user.firstName', 'System User First Name')}</th>
                  <th style={thStyle}>{t('label.user.lastName', 'System User Last Name')}</th>
                  <th style={thStyle}>{t('label.user.loginName', 'System User Login Name')}</th>
                  <th style={thStyle}>{t('label.password.expirationDate', 'Password Expiration Date')}</th>
                  {/* NEW COLUMN */}
                  <th style={{ ...thStyle, background: '#d0e2ff' }}>
                    {t('label.password.columnResetRequired', 'Password Reset Required')}
                  </th>
                  <th style={thStyle}>{t('label.user.accountLocked', 'Account Locked')}</th>
                  <th style={thStyle}>{t('label.user.accountDisabled', 'Account Disabled')}</th>
                  <th style={thStyle}>{t('label.user.isActive', 'Is Active')}</th>
                  <th style={thStyle}>{t('label.user.userTimeOut', 'User Time Out (minutes)')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={tdStyle}><input type="checkbox" /></td>
                    <td style={tdStyle}>{u.first}</td>
                    <td style={tdStyle}>{u.last}</td>
                    <td style={tdStyle}>{u.login}</td>
                    <td style={tdStyle}>{u.expDate}</td>
                    {/* NEW: Reset Required badge */}
                    <td style={{ ...tdStyle, background: u.resetReq ? '#fff8e1' : 'transparent' }}>
                      {u.resetReq && (
                        <span style={{
                          display: 'inline-block', background: '#f1c21b', color: '#161616',
                          padding: '2px 10px', borderRadius: '24px', fontSize: '12px', fontWeight: 500
                        }}>
                          {t('label.password.resetRequired', 'Reset Required')}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{u.locked}</td>
                    <td style={tdStyle}>{u.disabled}</td>
                    <td style={tdStyle}>{u.active}</td>
                    <td style={tdStyle}>{u.timeout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend note */}
          <p style={{ fontSize: '12px', color: '#6f6f6f', marginTop: '0.75rem' }}>
            {t('label.password.resetRequiredNote',
              'Note: The new "Password Reset Required" column shows users who must change their password at next login. This can be triggered by an admin reset or by an expired password.')}
          </p>
        </main>
      </div>
    </div>
  );
};

const thStyle = {
  padding: '0.75rem 0.5rem', textAlign: 'left', fontSize: '13px',
  fontWeight: 600, color: '#161616', borderBottom: '2px solid #8d8d8d'
};
const tdStyle = {
  padding: '0.65rem 0.5rem', fontSize: '14px', color: '#161616'
};


/* ══════════════════════════════════════════════════════════════
   APP: Tab switcher to view all three screens
   ══════════════════════════════════════════════════════════════ */

const App = () => {
  const [activeView, setActiveView] = useState('list');

  const views = [
    { id: 'list', label: '1. User Management List (Enhanced)' },
    { id: 'modify', label: '2. Modify User (Enhanced)' },
    { id: 'changePassword', label: '3. Change Password (Force Reset)' },
  ];

  return (
    <div>
      {/* View switcher */}
      <div style={{
        background: '#161616', padding: '0.5rem 1rem',
        display: 'flex', gap: '0.25rem', fontFamily: "'IBM Plex Sans', sans-serif"
      }}>
        {views.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            style={{
              padding: '0.65rem 1rem', fontSize: '13px', border: 'none', cursor: 'pointer',
              background: activeView === v.id ? '#393939' : 'transparent',
              color: activeView === v.id ? '#fff' : '#c6c6c6',
              borderBottom: activeView === v.id ? '2px solid #0f62fe' : '2px solid transparent'
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Render active view */}
      {activeView === 'list' && <UserManagementList />}
      {activeView === 'modify' && <ModifyUserPage />}
      {activeView === 'changePassword' && <ChangePasswordPage />}
    </div>
  );
};

export default App;
