/**
 * User Management — Phase 5 Page 1 (IA v2.3 · People & Access)
 * OpenELIS Global admin redesign mockup
 *
 * Traces to:
 *   - user-management-frs.md v1.0 (2026-04-23)
 *   - designs/rbac/rbac-revamp-prd.md v1.0
 *   - designs/rbac/rbac-ui-mockup.html (visual + interaction reference)
 *   - admin-pattern-library.md v1.0 (patterns P-01…P-13)
 *
 * Pattern IDs applied:
 *   P-01 admin shell · P-02 DataTable · P-03 toolbar/search/filter
 *   P-04 batch actions · P-05 inline row expansion · P-06 destructive confirm
 *   P-07 form conventions · P-08 tag mapping · P-09 inline notifications
 *   P-10 empty state · P-11 skeleton · P-12 pagination · P-13 permission gating
 *
 * i18n: every visible string wrapped in t(key, fallback). Keys match FRS §10.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Grid,
  Column,
  Stack,
  Breadcrumb,
  BreadcrumbItem,
  DataTable,
  DataTableSkeleton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableBatchActions,
  TableBatchAction,
  TableSelectRow,
  TableSelectAll,
  Pagination,
  TextInput,
  PasswordInput,
  NumberInput,
  Select,
  SelectItem,
  ComboBox,
  Toggle,
  Checkbox,
  DatePicker,
  DatePickerInput,
  Button,
  IconButton,
  InlineNotification,
  Tag,
  Modal,
  Tile,
  Accordion,
  AccordionItem,
} from '@carbon/react';
import {
  Add,
  Edit,
  TrashCan,
  ChevronDown,
  ChevronUp,
  Password,
  UserFollow,
  UserMultiple,
  WarningAlt,
} from '@carbon/icons-react';

/* -------------------------------------------------------------------------- */
/* i18n helper                                                                 */
/* -------------------------------------------------------------------------- */
const t = (key, fallback) => fallback || key;

/* -------------------------------------------------------------------------- */
/* Fixtures — mirror rbac-ui-mockup.html sample users                          */
/* -------------------------------------------------------------------------- */
const SAMPLE_USERS = [
  {
    id: 'u-001',
    firstName: 'Namanya',
    lastName: 'Abert',
    loginName: 'abertnamanya',
    email: 'abertnamanya@lab.org',
    phone: '+256-700-000001',
    pwdExpires: '15/07/2035',
    pwdExpired: false,
    status: 'active',
    timeoutMinutes: 480,
    assignments: [
      { id: 'a-1', roleId: 'r-global-admin', roleName: 'Global Administrator', roleType: 'admin', scopeType: 'global', scopeLabel: null },
      { id: 'a-2', roleId: 'r-reception', roleName: 'Reception', roleType: 'standard', scopeType: 'department', scopeLabel: 'Hematology (all units)' },
    ],
    provider: null,
  },
  {
    id: 'u-002',
    firstName: 'Viro',
    lastName: 'Test',
    loginName: 'virotest',
    email: 'viro.test@lab.org',
    phone: '',
    pwdExpires: '02/03/2035',
    pwdExpired: false,
    status: 'active',
    timeoutMinutes: 240,
    assignments: [
      { id: 'a-3', roleId: 'r-results', roleName: 'Results Entry', roleType: 'standard', scopeType: 'lab_unit', scopeLabel: 'Virology' },
    ],
    provider: null,
  },
  {
    id: 'u-003',
    firstName: 'Hema',
    lastName: 'Tology',
    loginName: 'hematology',
    email: 'hema.tology@lab.org',
    phone: '',
    pwdExpires: '18/11/2024',
    pwdExpired: true,
    status: 'active',
    timeoutMinutes: 480,
    assignments: [
      { id: 'a-4', roleId: 'r-validation', roleName: 'Validation', roleType: 'standard', scopeType: 'department', scopeLabel: 'Hematology (all units)' },
    ],
    provider: null,
  },
  {
    id: 'u-004',
    firstName: 'Sarah',
    lastName: 'Kollie',
    loginName: 'skollie',
    email: 'sarah.kollie@clinic.org',
    phone: '+231-770-112233',
    pwdExpires: '01/05/2035',
    pwdExpired: false,
    status: 'active',
    timeoutMinutes: 240,
    assignments: [
      { id: 'a-5', roleId: 'r-requester', roleName: 'Test Requester', roleType: 'requester', scopeType: 'lab_unit', scopeLabel: 'Immunology' },
    ],
    provider: {
      facility: 'St. Joseph Clinic',
      license: 'LR-2024-8812',
      specialty: 'internal-medicine',
      providerId: 'NPI-1245789654',
      phone: '+231-770-112233',
      email: 'sarah.kollie@clinic.org',
    },
  },
  {
    id: 'u-005',
    firstName: 'Jean',
    lastName: 'Mugisha',
    loginName: 'jmugisha',
    email: 'j.mugisha@lab.org',
    phone: '',
    pwdExpires: '22/09/2028',
    pwdExpired: false,
    status: 'inactive',
    timeoutMinutes: 480,
    assignments: [
      { id: 'a-6', roleId: 'r-reception', roleName: 'Reception', roleType: 'standard', scopeType: 'lab_unit', scopeLabel: 'Chemistry' },
    ],
    provider: null,
  },
];

const AVAILABLE_ROLES = [
  { id: 'r-reception', name: 'Reception', type: 'standard', scopeConstraint: 'any' },
  { id: 'r-results', name: 'Results Entry', type: 'standard', scopeConstraint: 'any' },
  { id: 'r-validation', name: 'Validation', type: 'standard', scopeConstraint: 'any' },
  { id: 'r-reports', name: 'Reports', type: 'standard', scopeConstraint: 'any' },
  { id: 'r-global-admin', name: 'Global Administrator', type: 'admin', scopeConstraint: 'global-only' },
  { id: 'r-user-admin', name: 'User Account Administrator', type: 'admin', scopeConstraint: 'global-only' },
  { id: 'r-audit', name: 'Audit Trail', type: 'admin', scopeConstraint: 'global-only' },
  { id: 'r-analyser-import', name: 'Analyser Import', type: 'admin', scopeConstraint: 'global-only' },
  { id: 'r-pathologist', name: 'Pathologist', type: 'specialty', scopeConstraint: 'any' },
  { id: 'r-cytopathologist', name: 'Cytopathologist', type: 'specialty', scopeConstraint: 'any' },
  { id: 'r-requester', name: 'Test Requester', type: 'requester', scopeConstraint: 'any' },
];

const DEPARTMENTS = [
  { id: 'd-hem', name: 'Hematology' },
  { id: 'd-chem', name: 'Chemistry' },
  { id: 'd-viro', name: 'Virology' },
  { id: 'd-immuno', name: 'Immunology' },
  { id: 'd-micro', name: 'Microbiology' },
];

const LAB_UNITS = [
  { id: 'lu-hem-1', name: 'Hematology — Bench 1' },
  { id: 'lu-chem-1', name: 'Chemistry' },
  { id: 'lu-viro-1', name: 'Virology' },
  { id: 'lu-immuno-1', name: 'Immunology' },
];

const SPECIALTIES = [
  { id: 'general-practice', name: 'General Practice' },
  { id: 'internal-medicine', name: 'Internal Medicine' },
  { id: 'pediatrics', name: 'Pediatrics' },
  { id: 'surgery', name: 'Surgery' },
  { id: 'obgyn', name: 'Obstetrics & Gynecology' },
];

/* -------------------------------------------------------------------------- */
/* Role-type Tag mapping (pattern P-08, FR-UM-05)                              */
/* -------------------------------------------------------------------------- */
const ROLE_TYPE_TAG = {
  standard: { kind: 'blue',      label: () => t('admin.common.roleType.standard',  'Standard')  },
  admin:    { kind: 'purple',    label: () => t('admin.common.roleType.admin',     'Admin')     },
  specialty:{ kind: 'teal',      label: () => t('admin.common.roleType.specialty', 'Specialty') },
  requester:{ kind: 'green',     label: () => t('admin.common.roleType.requester', 'Requester') },
};

/* -------------------------------------------------------------------------- */
/* Scope → colour (FR-UM-17): purple=global, teal=department, blue=lab_unit   */
/* -------------------------------------------------------------------------- */
const SCOPE_BORDER = {
  global:      '#8a3ffc',
  department:  '#007d79',
  lab_unit:    '#0f62fe',
};

const scopeLabelFor = (a) => {
  const prefix = t('admin.users.roles.scope.prefix', 'Scope:');
  if (a.scopeType === 'global') {
    return `${prefix} ${t('admin.users.roles.scopeLegend.global', 'Global')}`;
  }
  if (a.scopeType === 'department') {
    return `${prefix} ${t('admin.users.roles.scopeLegend.department', 'Department')} — ${a.scopeLabel}`;
  }
  return `${prefix} ${t('admin.users.roles.scopeLegend.labUnit', 'Lab Unit')} — ${a.scopeLabel}`;
};

/* -------------------------------------------------------------------------- */
/* Password validation — password-enhancements FR-PP-001…FR-PP-008            */
/* Returns ALL failed rules at once (FR-UM-31).                                */
/* -------------------------------------------------------------------------- */
const validatePassword = (pwd) => {
  const errors = [];
  if (!pwd || pwd.length < 8) errors.push(t('admin.users.password.rule.min', 'Must be at least 8 characters'));
  if (pwd && pwd.length > 64) errors.push(t('admin.users.password.rule.max', 'Must be 64 characters or fewer'));
  return errors;
};

/* ========================================================================== */
/*  Main page component                                                        */
/* ========================================================================== */

export default function UserManagementPage({
  hasPermission = true,         // admin:user_management — pattern P-13
  loading = false,              // triggers P-11 skeleton
  users = SAMPLE_USERS,
}) {
  /* -------------------- table state -------------------- */
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [pageSize, setPageSize] = useState(25);
  const [pageNumber, setPageNumber] = useState(1);

  /* -------------------- expansion state -------------------- */
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [addUserOpen, setAddUserOpen] = useState(false);

  /* -------------------- edit + dirty tracking -------------------- */
  const [draft, setDraft] = useState(null);     // working copy of expanded user
  const [isDirty, setIsDirty] = useState(false);
  const [saveToast, setSaveToast] = useState(null); // { kind, title, body } | null

  /* -------------------- modals -------------------- */
  const [addAssignmentOpen, setAddAssignmentOpen] = useState(false);
  const [removeAssignmentTarget, setRemoveAssignmentTarget] = useState(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(null); // { proceedAction } | null
  const [forbiddenOpen, setForbiddenOpen] = useState(false);

  /* -------------------- derived filtered rows -------------------- */
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return users.filter((u) => {
      if (onlyActive && u.status !== 'active') return false;
      if (roleFilter && !u.assignments.some((a) => a.roleId === roleFilter)) return false;
      if (!q) return true;
      return (
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.loginName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, searchText, roleFilter, onlyActive]);

  const pageSlice = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageNumber, pageSize]);

  /* -------------------- permission gate (pattern P-13) -------------------- */
  if (!hasPermission) {
    return (
      <Grid fullWidth style={{ padding: '2rem' }}>
        <Column lg={16}>
          <InlineNotification
            kind="error"
            hideCloseButton
            title={t('admin.users.toast.forbidden', "You don't have permission to modify users")}
            subtitle=""
          />
        </Column>
      </Grid>
    );
  }

  /* -------------------- handlers -------------------- */
  const toggleRow = useCallback(
    (userId) => {
      const proceed = () => {
        if (expandedRowId === userId) {
          setExpandedRowId(null);
          setDraft(null);
          setIsDirty(false);
          return;
        }
        const u = users.find((x) => x.id === userId);
        setExpandedRowId(userId);
        setDraft(structuredClone(u));
        setIsDirty(false);
        setAddUserOpen(false);
      };
      if (isDirty) {
        setDiscardConfirmOpen({ proceedAction: proceed });
      } else {
        proceed();
      }
    },
    [expandedRowId, users, isDirty]
  );

  const openAddUser = () => {
    const proceed = () => {
      setExpandedRowId(null);
      setAddUserOpen(true);
      setDraft({
        id: 'new',
        firstName: '',
        lastName: '',
        loginName: '',
        email: '',
        phone: '',
        timeoutMinutes: 480,
        pwdExpires: '',
        pwdExpired: false,
        status: 'active',
        assignments: [],
        provider: null,
        tempPassword: '',
        forceResetOnNextLogin: true,
      });
      setIsDirty(false);
    };
    if (isDirty) setDiscardConfirmOpen({ proceedAction: proceed });
    else proceed();
  };

  const updateDraft = (patch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setIsDirty(true);
  };

  const removeAssignment = (assignmentId) => {
    setDraft((d) => ({
      ...d,
      assignments: d.assignments.filter((a) => a.id !== assignmentId),
    }));
    setIsDirty(true);
    setRemoveAssignmentTarget(null);
  };

  const hasRequesterRole = useMemo(
    () => draft?.assignments?.some((a) => {
      const role = AVAILABLE_ROLES.find((r) => r.id === a.roleId);
      return role?.type === 'requester';
    }),
    [draft]
  );

  /* -------------------- render -------------------- */
  return (
    <Grid fullWidth className="admin-user-mgmt" style={{ padding: '1.5rem 2rem' }}>
      {/* P-01 admin shell: breadcrumb + title + subtitle */}
      <Column lg={16}>
        <Breadcrumb noTrailingSlash style={{ marginBottom: '0.5rem' }}>
          <BreadcrumbItem href="/admin">
            {t('admin.users.breadcrumb.adminMgmt', 'Admin Management')}
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            {t('admin.users.breadcrumb.users', 'Users')}
          </BreadcrumbItem>
        </Breadcrumb>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 400, margin: 0 }}>
          {t('admin.users.page.title', 'User Management')}
        </h1>
        <p style={{ color: '#525252', marginTop: '0.25rem' }}>
          {t(
            'admin.users.page.subtitle',
            'Click a user row to expand and edit their role assignments.'
          )}
        </p>
      </Column>

      {/* top-level save/forbidden toasts */}
      {saveToast && (
        <Column lg={16} style={{ marginTop: '1rem' }}>
          <InlineNotification
            kind={saveToast.kind}
            title={saveToast.title}
            subtitle={saveToast.body}
            onCloseButtonClick={() => setSaveToast(null)}
          />
        </Column>
      )}

      {/* Add User inline panel (pattern P-05 new-row variant) */}
      {addUserOpen && (
        <Column lg={16} style={{ marginTop: '1rem' }}>
          <UserDetailPanel
            mode="create"
            draft={draft}
            isDirty={isDirty}
            hasRequesterRole={hasRequesterRole}
            onUpdate={updateDraft}
            onAddAssignment={() => setAddAssignmentOpen(true)}
            onRemoveAssignment={(a) => setRemoveAssignmentTarget(a)}
            onResetPassword={() => setResetPasswordOpen(true)}
            onCancel={() => {
              const close = () => {
                setAddUserOpen(false);
                setDraft(null);
                setIsDirty(false);
              };
              if (isDirty) setDiscardConfirmOpen({ proceedAction: close });
              else close();
            }}
            onSave={() => {
              setAddUserOpen(false);
              setDraft(null);
              setIsDirty(false);
              setSaveToast({
                kind: 'success',
                title: t('admin.users.toast.saved', 'Changes saved'),
                body: '',
              });
            }}
            onDeactivate={() => setDeactivateConfirmOpen(true)}
          />
        </Column>
      )}

      {/* User list table (pattern P-02) */}
      <Column lg={16} style={{ marginTop: '1rem' }}>
        {loading ? (
          <DataTableSkeleton
            columnCount={8}
            rowCount={5}
            showHeader={false}
            showToolbar={true}
          />
        ) : (
          <TableContainer title="" description="">
            {/* Toolbar (P-03) + batch actions (P-04) */}
            <TableToolbar>
              <TableToolbarContent>
                <TableToolbarSearch
                  placeholder={t(
                    'admin.users.search.placeholder',
                    'Search by name, login, or email…'
                  )}
                  persistent
                  onChange={(e) => setSearchText(e.target.value || '')}
                />
                <div style={{ width: 200 }}>
                  <Select
                    id="role-filter"
                    labelText=""
                    hideLabel
                    size="sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <SelectItem value="" text={t('admin.users.filter.role.placeholder', 'Filter by role')} />
                    {AVAILABLE_ROLES.map((r) => (
                      <SelectItem key={r.id} value={r.id} text={r.name} />
                    ))}
                  </Select>
                </div>
                <div style={{ alignSelf: 'center', marginRight: '1rem' }}>
                  <Checkbox
                    id="only-active"
                    labelText={t('admin.users.filter.onlyActive', 'Only Active')}
                    checked={onlyActive}
                    onChange={(_, { checked }) => setOnlyActive(checked)}
                  />
                </div>
                <Button
                  kind="primary"
                  renderIcon={UserFollow}
                  onClick={openAddUser}
                >
                  {t('admin.users.action.addUser', 'Add User')}
                </Button>
              </TableToolbarContent>
            </TableToolbar>

            {filtered.length === 0 ? (
              // Empty state (pattern P-10)
              <Tile style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <UserMultiple size={32} />
                <h3 style={{ marginTop: '0.5rem' }}>
                  {t('admin.users.empty.title', 'No users match your filters')}
                </h3>
                <Button
                  kind="ghost"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    setSearchText('');
                    setRoleFilter('');
                    setOnlyActive(false);
                  }}
                >
                  {t('admin.users.empty.clear', 'Clear filters')}
                </Button>
              </Tile>
            ) : (
              <>
                <Table size="md" useZebraStyles={false}>
                  <TableHead>
                    <TableRow>
                      <TableHeader style={{ width: 48 }} aria-label={t('admin.users.aria.expandRow', 'Expand user row')} />
                      <TableHeader>{t('admin.users.column.firstName', 'First Name')}</TableHeader>
                      <TableHeader>{t('admin.users.column.lastName', 'Last Name')}</TableHeader>
                      <TableHeader>{t('admin.users.column.loginName', 'Login Name')}</TableHeader>
                      <TableHeader>{t('admin.users.column.roles', 'Roles')}</TableHeader>
                      <TableHeader>{t('admin.users.column.pwdExpires', 'Pwd Expires')}</TableHeader>
                      <TableHeader>{t('admin.users.column.status', 'Status')}</TableHeader>
                      <TableHeader>{t('admin.users.column.timeout', 'Timeout')}</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageSlice.map((u) => (
                      <React.Fragment key={u.id}>
                        <TableRow
                          style={{
                            cursor: 'pointer',
                            opacity: u.status === 'inactive' ? 0.75 : 1,
                          }}
                          onClick={() => toggleRow(u.id)}
                        >
                          <TableCell>
                            <IconButton
                              kind="ghost"
                              size="sm"
                              label={t('admin.users.aria.expandRow', 'Expand user row')}
                              onClick={(e) => { e.stopPropagation(); toggleRow(u.id); }}
                            >
                              {expandedRowId === u.id ? <ChevronUp /> : <ChevronDown />}
                            </IconButton>
                          </TableCell>
                          <TableCell>{u.firstName}</TableCell>
                          <TableCell>{u.lastName}</TableCell>
                          <TableCell>
                            <code style={{ fontSize: '0.8125rem' }}>{u.loginName}</code>
                          </TableCell>
                          <TableCell>
                            <RolesCell assignments={u.assignments} />
                          </TableCell>
                          <TableCell>
                            {u.pwdExpires}
                            {u.pwdExpired && (
                              <Tag kind="red" size="sm" style={{ marginLeft: '0.5rem' }}>
                                {t('admin.users.pwdExpired', 'Expired')}
                              </Tag>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusCell status={u.status} />
                          </TableCell>
                          <TableCell>{u.timeoutMinutes} min</TableCell>
                        </TableRow>

                        {/* Inline expansion (pattern P-05) */}
                        {expandedRowId === u.id && (
                          <TableRow>
                            <TableCell colSpan={8} style={{ padding: 0, background: '#f4f4f4' }}>
                              <UserDetailPanel
                                mode="edit"
                                draft={draft}
                                isDirty={isDirty}
                                hasRequesterRole={hasRequesterRole}
                                onUpdate={updateDraft}
                                onAddAssignment={() => setAddAssignmentOpen(true)}
                                onRemoveAssignment={(a) => setRemoveAssignmentTarget(a)}
                                onResetPassword={() => setResetPasswordOpen(true)}
                                onCancel={() => {
                                  const close = () => {
                                    setExpandedRowId(null);
                                    setDraft(null);
                                    setIsDirty(false);
                                  };
                                  if (isDirty) setDiscardConfirmOpen({ proceedAction: close });
                                  else close();
                                }}
                                onSave={() => {
                                  setExpandedRowId(null);
                                  setDraft(null);
                                  setIsDirty(false);
                                  setSaveToast({
                                    kind: 'success',
                                    title: t('admin.users.toast.saved', 'Changes saved'),
                                    body: '',
                                  });
                                }}
                                onDeactivate={() => setDeactivateConfirmOpen(true)}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination (pattern P-12) */}
                <Pagination
                  totalItems={filtered.length}
                  pageSize={pageSize}
                  pageSizes={[25, 50, 100]}
                  page={pageNumber}
                  onChange={({ page, pageSize: ps }) => {
                    setPageNumber(page);
                    setPageSize(ps);
                  }}
                  itemsPerPageText={t('admin.common.pagination.itemsPerPage', 'Items per page:')}
                />
              </>
            )}
          </TableContainer>
        )}
      </Column>

      {/* Add Role Assignment Modal (FR-UM-19 → FR-UM-22) */}
      {addAssignmentOpen && (
        <AddRoleAssignmentModal
          open={addAssignmentOpen}
          onClose={() => setAddAssignmentOpen(false)}
          onAdd={(newAssignment) => {
            setDraft((d) => ({ ...d, assignments: [...(d?.assignments || []), newAssignment] }));
            setIsDirty(true);
            setAddAssignmentOpen(false);
          }}
        />
      )}

      {/* Remove Assignment confirm (pattern P-06) */}
      {removeAssignmentTarget && (
        <Modal
          open
          danger
          modalHeading={t('admin.users.roles.remove.confirm.title', 'Remove role assignment')}
          primaryButtonText={t('admin.users.roles.remove', 'Remove')}
          secondaryButtonText={t('admin.users.cancel', 'Cancel')}
          onRequestSubmit={() => removeAssignment(removeAssignmentTarget.id)}
          onRequestClose={() => setRemoveAssignmentTarget(null)}
        >
          <p>
            <strong>{removeAssignmentTarget.roleName}</strong>
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            {t(
              'admin.users.roles.remove.confirm.body',
              'The user will lose the permissions granted by this assignment on their next login or session refresh.'
            )}
          </p>
        </Modal>
      )}

      {/* Reset Password Modal (FR-UM-29, FR-UM-31) */}
      {resetPasswordOpen && (
        <ResetPasswordModal
          open
          onClose={() => setResetPasswordOpen(false)}
          onReset={() => {
            setResetPasswordOpen(false);
            setSaveToast({
              kind: 'success',
              title: t(
                'admin.users.toast.passwordReset',
                'Password reset. The user will be prompted to change it on their next login.'
              ),
              body: '',
            });
          }}
        />
      )}

      {/* Deactivate confirm (pattern P-06, FR-UM-33) */}
      {deactivateConfirmOpen && (
        <Modal
          open
          danger
          modalHeading={t('admin.users.deactivate.confirm.title', 'Deactivate user')}
          primaryButtonText={t('admin.users.deactivate.button', 'Deactivate')}
          secondaryButtonText={t('admin.users.cancel', 'Cancel')}
          onRequestSubmit={() => setDeactivateConfirmOpen(false)}
          onRequestClose={() => setDeactivateConfirmOpen(false)}
        >
          <p>
            {t(
              'admin.users.deactivate.confirm.sessionCount',
              'Active sessions that will be terminated: {count}'
            ).replace('{count}', '1')}
          </p>
          <p style={{ marginTop: '0.5rem' }}>
            {t(
              'admin.users.deactivate.confirm.assignmentsRetained',
              'Role assignments preserved (inert until reactivated): {n}'
            ).replace('{n}', String(draft?.assignments?.length ?? 0))}
          </p>
        </Modal>
      )}

      {/* Discard unsaved confirm (pattern P-06, FR-UM-15) */}
      {discardConfirmOpen && (
        <Modal
          open
          danger
          modalHeading={t('admin.users.discard.confirm.title', 'Discard unsaved changes?')}
          primaryButtonText={t('admin.users.discard.confirm.discard', 'Discard')}
          secondaryButtonText={t('admin.users.discard.confirm.keep', 'Keep editing')}
          onRequestSubmit={() => {
            const proceed = discardConfirmOpen.proceedAction;
            setDiscardConfirmOpen(null);
            proceed && proceed();
          }}
          onRequestClose={() => setDiscardConfirmOpen(null)}
        />
      )}
    </Grid>
  );
}

/* ========================================================================== */
/*  UserDetailPanel — inline expansion body (shared: edit + create)            */
/* ========================================================================== */

function UserDetailPanel({
  mode,                    // 'edit' | 'create'
  draft,
  isDirty,
  hasRequesterRole,
  onUpdate,
  onAddAssignment,
  onRemoveAssignment,
  onResetPassword,
  onCancel,
  onSave,
  onDeactivate,
}) {
  if (!draft) return null;

  return (
    <Tile
      style={{
        borderTop: '2px solid #0f62fe',       // blue-60 (FR-UM-13)
        background: '#edf5ff',                // blue-10
        padding: '1.5rem',
        margin: '0',
      }}
    >
      {/* Unsaved-changes bar (P-09, FR-UM-14 #1) */}
      {isDirty && (
        <InlineNotification
          kind="warning"
          lowContrast
          hideCloseButton
          title={t(
            'admin.users.unsaved.message',
            'Unsaved changes — click Save to apply or Close to discard.'
          )}
          subtitle=""
          style={{ maxWidth: '100%', marginBottom: '1rem' }}
        />
      )}

      {/* Summary bar (FR-UM-14 #2) */}
      {mode === 'edit' ? (
        <Grid condensed style={{ marginBottom: '1rem' }}>
          <Column lg={3}>
            <SummaryField label={t('admin.users.summary.login', 'Login')} value={draft.loginName} />
          </Column>
          <Column lg={4}>
            <SummaryField label={t('admin.users.summary.name', 'Name')} value={`${draft.firstName} ${draft.lastName}`} />
          </Column>
          <Column lg={3}>
            <SummaryField label={t('admin.users.summary.pwdExpires', 'Pwd Expires')} value={draft.pwdExpires} />
          </Column>
          <Column lg={3}>
            <SummaryField
              label={t('admin.users.summary.status', 'Status')}
              value={<StatusCell status={draft.status} />}
            />
          </Column>
          <Column lg={3} style={{ textAlign: 'right' }}>
            <Button kind="ghost" size="sm" renderIcon={Edit}>
              {t('admin.users.action.editAccount', 'Edit Account Info')}
            </Button>
          </Column>
        </Grid>
      ) : (
        /* Create mode: inline account-info form */
        <Grid condensed style={{ marginBottom: '1rem' }}>
          <Column lg={4}>
            <TextInput
              id="u-fn"
              labelText={t('admin.users.column.firstName', 'First Name')}
              value={draft.firstName}
              onChange={(e) => onUpdate({ firstName: e.target.value })}
            />
          </Column>
          <Column lg={4}>
            <TextInput
              id="u-ln"
              labelText={t('admin.users.column.lastName', 'Last Name')}
              value={draft.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
            />
          </Column>
          <Column lg={4}>
            <TextInput
              id="u-login"
              labelText={t('admin.users.column.loginName', 'Login Name')}
              value={draft.loginName}
              onChange={(e) => onUpdate({ loginName: e.target.value })}
            />
          </Column>
          <Column lg={4}>
            <TextInput
              id="u-email"
              labelText="Email"
              type="email"
              value={draft.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
            />
          </Column>
        </Grid>
      )}

      {/* Copy Permissions card (FR-UM-14 #3) */}
      <Tile
        light
        style={{
          background: '#ffffff',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid #e0e0e0',
        }}
      >
        <Stack orientation="horizontal" gap={4} style={{ alignItems: 'end' }}>
          <div style={{ flex: '0 0 auto', paddingBottom: '0.5rem' }}>
            <strong>{t('admin.users.copy.label', 'Copy Permissions From User:')}</strong>
          </div>
          <div style={{ flex: '1 1 240px', maxWidth: 320 }}>
            <ComboBox
              id="copy-from-user"
              items={SAMPLE_USERS.map((u) => ({ id: u.id, text: u.loginName }))}
              itemToString={(i) => (i ? i.text : '')}
              placeholder={t('admin.users.copy.placeholder', 'Enter username…')}
              titleText=""
            />
          </div>
          <Button kind="secondary" size="md">
            {t('admin.users.copy.apply', 'Apply')}
          </Button>
        </Stack>
      </Tile>

      {/* Role Assignments section (FR-UM-14 #4, FR-UM-17) */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, flex: 1 }}>
          {t('admin.users.roles.sectionTitle', 'Role Assignments')}
        </h3>
        <Button kind="primary" size="sm" renderIcon={Add} onClick={onAddAssignment}>
          {t('admin.users.roles.addAssignment', 'Add Role Assignment')}
        </Button>
      </div>

      {/* Scope legend (FR-UM-14 #5) */}
      <div
        style={{
          display: 'flex',
          gap: '1.25rem',
          padding: '0.5rem 0.75rem',
          background: '#ffffff',
          border: '1px solid #e0e0e0',
          marginBottom: '1rem',
          fontSize: '0.8125rem',
        }}
      >
        <ScopeSwatch color={SCOPE_BORDER.global} label={t('admin.users.roles.scopeLegend.global', 'Global')} />
        <ScopeSwatch color={SCOPE_BORDER.department} label={t('admin.users.roles.scopeLegend.department', 'Department')} />
        <ScopeSwatch color={SCOPE_BORDER.lab_unit} label={t('admin.users.roles.scopeLegend.labUnit', 'Lab Unit')} />
      </div>

      {/* Role assignment cards (FR-UM-17) */}
      <Stack gap={3} style={{ marginBottom: '1.5rem' }}>
        {draft.assignments.length === 0 && (
          <p style={{ color: '#525252', fontStyle: 'italic' }}>
            {t('admin.users.roles.none', 'No role assignments yet.')}
          </p>
        )}
        {draft.assignments.map((a) => {
          const typeMeta = ROLE_TYPE_TAG[a.roleType] || ROLE_TYPE_TAG.standard;
          return (
            <Tile
              key={a.id}
              style={{
                background: '#ffffff',
                padding: '0.875rem 1rem',
                borderLeft: `3px solid ${SCOPE_BORDER[a.scopeType]}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <Tag type={typeMeta.kind} size="sm">{typeMeta.label()}</Tag>
              <strong style={{ fontSize: '0.8125rem' }}>{a.roleName}</strong>
              <span style={{ color: '#525252', fontSize: '0.8125rem', flex: 1 }}>
                {scopeLabelFor(a)}
              </span>
              <Button
                kind="danger--ghost"
                size="sm"
                renderIcon={TrashCan}
                onClick={() => onRemoveAssignment(a)}
              >
                {t('admin.users.roles.remove', 'Remove')}
              </Button>
            </Tile>
          );
        })}
      </Stack>

      {/* Provider Metadata section (FR-UM-23, FR-UM-14 #7) */}
      {hasRequesterRole && (
        <Tile
          style={{
            background: '#ffffff',
            padding: '1rem',
            border: '1px solid #e0e0e0',
            marginBottom: '1.5rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            {t('admin.users.provider.title', 'Provider Metadata')}
          </h3>
          <p style={{ color: '#525252', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {t('admin.users.provider.visibilityNote', 'Shown when a Test Requester role is assigned.')}
          </p>
          <Grid condensed>
            <Column lg={8}>
              <TextInput
                id="pv-facility"
                labelText={t('admin.users.provider.facility', 'Facility / Organization')}
                required
                value={draft.provider?.facility || ''}
                onChange={(e) => onUpdate({ provider: { ...draft.provider, facility: e.target.value } })}
              />
            </Column>
            <Column lg={4}>
              <TextInput
                id="pv-license"
                labelText={t('admin.users.provider.license', 'License Number')}
                required
                value={draft.provider?.license || ''}
                onChange={(e) => onUpdate({ provider: { ...draft.provider, license: e.target.value } })}
              />
            </Column>
            <Column lg={4}>
              <Select
                id="pv-specialty"
                labelText={t('admin.users.provider.specialty', 'Specialty')}
                value={draft.provider?.specialty || ''}
                onChange={(e) => onUpdate({ provider: { ...draft.provider, specialty: e.target.value } })}
              >
                <SelectItem value="" text="—" />
                {SPECIALTIES.map((s) => (
                  <SelectItem key={s.id} value={s.id} text={s.name} />
                ))}
              </Select>
            </Column>
            <Column lg={4}>
              <TextInput
                id="pv-providerid"
                labelText={t('admin.users.provider.providerId', 'Provider ID')}
                helperText="NPI or local equivalent"
                value={draft.provider?.providerId || ''}
                onChange={(e) => onUpdate({ provider: { ...draft.provider, providerId: e.target.value } })}
              />
            </Column>
            <Column lg={4}>
              <TextInput
                id="pv-phone"
                labelText={t('admin.users.provider.phone', 'Phone')}
                value={draft.provider?.phone || ''}
                onChange={(e) => onUpdate({ provider: { ...draft.provider, phone: e.target.value } })}
              />
            </Column>
            <Column lg={4}>
              <TextInput
                id="pv-email"
                labelText={t('admin.users.provider.email', 'Email')}
                type="email"
                value={draft.provider?.email || ''}
                onChange={(e) => onUpdate({ provider: { ...draft.provider, email: e.target.value } })}
              />
            </Column>
          </Grid>
        </Tile>
      )}

      {/* Password & Session section (FR-UM-14 #8, FR-UM-28) */}
      <Tile
        style={{
          background: '#ffffff',
          padding: '1rem',
          border: '1px solid #e0e0e0',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          {t('admin.users.password.section', 'Password & Session')}
        </h3>
        <Grid condensed>
          <Column lg={4}>
            <Button kind="ghost" renderIcon={Password} onClick={onResetPassword} size="md">
              {t('admin.users.password.resetPassword', 'Reset Password')}
            </Button>
          </Column>
          <Column lg={6}>
            <div style={{ marginBottom: '1rem' }}>
              <Toggle
                id="force-reset"
                labelText={t('admin.users.password.forceReset', 'Force password reset at next login')}
                labelA=""
                labelB=""
                toggled={!!draft.forcePasswordReset}
                onToggle={(checked) => onUpdate({ forcePasswordReset: checked })}
              />
            </div>
          </Column>
          <Column lg={3}>
            <DatePicker datePickerType="single" dateFormat="d/m/Y">
              <DatePickerInput
                id="pwd-expiry"
                labelText={t('admin.users.password.expiration', 'Password Expiration Date')}
                placeholder="dd/mm/yyyy"
                value={draft.pwdExpires || ''}
                onChange={(e) => onUpdate({ pwdExpires: e.target.value })}
              />
            </DatePicker>
          </Column>
          <Column lg={3}>
            <NumberInput
              id="session-timeout"
              label={t('admin.users.session.timeout', 'Session Timeout (minutes)')}
              min={5}
              max={1440}
              step={5}
              value={draft.timeoutMinutes}
              onChange={(e, { value }) => onUpdate({ timeoutMinutes: value })}
            />
          </Column>
        </Grid>
      </Tile>

      {/* Actions row (FR-UM-14 #9) */}
      <Stack orientation="horizontal" gap={3}>
        <Button kind="primary" onClick={onSave}>
          {mode === 'create'
            ? t('admin.users.createUser', 'Create User')
            : t('admin.users.save', 'Save')}
        </Button>
        <Button kind="ghost" onClick={onCancel}>
          {t('admin.users.cancel', 'Cancel')}
        </Button>
        {mode === 'edit' && (
          <Button kind="danger--ghost" renderIcon={TrashCan} onClick={onDeactivate} style={{ marginLeft: 'auto' }}>
            {draft.status === 'inactive'
              ? t('admin.users.reactivate.button', 'Reactivate')
              : t('admin.users.deactivate.button', 'Deactivate')}
          </Button>
        )}
      </Stack>
    </Tile>
  );
}

/* ========================================================================== */
/*  AddRoleAssignmentModal — FR-UM-19 through FR-UM-22                         */
/* ========================================================================== */

function AddRoleAssignmentModal({ open, onClose, onAdd }) {
  const [roleId, setRoleId] = useState('');
  const [scopeType, setScopeType] = useState('');
  const [scopeId, setScopeId] = useState('');

  const role = AVAILABLE_ROLES.find((r) => r.id === roleId);
  const isGlobalOnly = role?.scopeConstraint === 'global-only';

  // FR-UM-20 — lock Scope to Global when role is global-only
  useEffect(() => {
    if (isGlobalOnly) {
      setScopeType('global');
      setScopeId('');
    }
  }, [isGlobalOnly]);

  const legal =
    !!roleId &&
    !!scopeType &&
    (scopeType === 'global' || !!scopeId);

  const targetOptions = scopeType === 'department' ? DEPARTMENTS : scopeType === 'lab_unit' ? LAB_UNITS : [];

  const submit = () => {
    if (!role) return;
    const scopeLabel =
      scopeType === 'global'
        ? null
        : (targetOptions.find((o) => o.id === scopeId) || {}).name || '';
    onAdd({
      id: `a-${Date.now()}`,
      roleId: role.id,
      roleName: role.name,
      roleType: role.type,
      scopeType,
      scopeLabel,
    });
  };

  return (
    <Modal
      open={open}
      modalHeading={t('admin.users.modal.addAssignment.title', 'Add Role Assignment')}
      primaryButtonText={t('admin.users.roles.addAssignment', 'Add Role Assignment')}
      secondaryButtonText={t('admin.users.cancel', 'Cancel')}
      primaryButtonDisabled={!legal}
      onRequestSubmit={submit}
      onRequestClose={onClose}
    >
      <p style={{ color: '#525252', fontSize: '0.8125rem', marginBottom: '1rem' }}>
        {t(
          'admin.users.modal.addAssignment.info',
          'Scope levels: Global = everywhere. Department = all lab units in that department. Lab Unit = single unit only.'
        )}
      </p>
      <Stack gap={5}>
        <Select
          id="add-role"
          labelText={t('admin.users.modal.addAssignment.role', 'Role')}
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
        >
          <SelectItem value="" text="—" />
          {['standard', 'admin', 'specialty', 'requester'].map((t_) => (
            <optgroup key={t_} label={ROLE_TYPE_TAG[t_].label()}>
              {AVAILABLE_ROLES.filter((r) => r.type === t_).map((r) => (
                <SelectItem key={r.id} value={r.id} text={r.name} />
              ))}
            </optgroup>
          ))}
        </Select>

        <Select
          id="add-scope"
          labelText={t('admin.users.modal.addAssignment.scope', 'Scope')}
          value={scopeType}
          disabled={isGlobalOnly}
          onChange={(e) => {
            setScopeType(e.target.value);
            setScopeId('');
          }}
        >
          <SelectItem value="" text="—" />
          <SelectItem value="global" text={t('admin.users.roles.scopeLegend.global', 'Global')} />
          <SelectItem value="department" text={t('admin.users.roles.scopeLegend.department', 'Department')} />
          <SelectItem value="lab_unit" text={t('admin.users.roles.scopeLegend.labUnit', 'Lab Unit')} />
        </Select>

        {isGlobalOnly && (
          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            title={t('admin.users.modal.addAssignment.globalOnlyHint', 'This role is always Global.')}
            subtitle=""
          />
        )}

        <Select
          id="add-target"
          labelText={t('admin.users.modal.addAssignment.target', 'Target (if scoped)')}
          value={scopeId}
          disabled={scopeType === 'global' || !scopeType}
          onChange={(e) => setScopeId(e.target.value)}
        >
          <SelectItem value="" text="—" />
          {targetOptions.map((o) => (
            <SelectItem key={o.id} value={o.id} text={o.name} />
          ))}
        </Select>
      </Stack>
    </Modal>
  );
}

/* ========================================================================== */
/*  ResetPasswordModal — FR-UM-29, FR-UM-31                                    */
/* ========================================================================== */

function ResetPasswordModal({ open, onClose, onReset }) {
  const [pwd, setPwd] = useState('');
  const [forceReset, setForceReset] = useState(true);   // FR-UM-29 default ON
  const [submitted, setSubmitted] = useState(false);
  const errors = validatePassword(pwd);

  const submit = () => {
    setSubmitted(true);
    if (errors.length > 0) return;
    onReset();
  };

  return (
    <Modal
      open={open}
      modalHeading={t('admin.users.modal.resetPassword.title', 'Reset Password')}
      primaryButtonText={t('admin.users.modal.resetPassword.submit', 'Reset Password')}
      secondaryButtonText={t('admin.users.cancel', 'Cancel')}
      onRequestSubmit={submit}
      onRequestClose={onClose}
    >
      <p style={{ color: '#525252', fontSize: '0.8125rem', marginBottom: '1rem' }}>
        {t(
          'admin.users.modal.resetPassword.info',
          'The user will be required to choose a new password the next time they log in.'
        )}
      </p>
      <Stack gap={5}>
        <PasswordInput
          id="tmp-pwd"
          labelText={t('admin.users.modal.resetPassword.temp', 'Temporary Password')}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          invalid={submitted && errors.length > 0}
          invalidText={
            /* FR-UM-31 — ALL unmet rules at once */
            errors.join(' · ')
          }
        />
        <Toggle
          id="reset-force"
          labelText={t('admin.users.password.forceReset', 'Force password reset at next login')}
          labelA=""
          labelB=""
          toggled={forceReset}
          onToggle={(checked) => setForceReset(checked)}
        />
      </Stack>
    </Modal>
  );
}

/* ========================================================================== */
/*  Small helpers                                                               */
/* ========================================================================== */

function RolesCell({ assignments }) {
  const visible = assignments.slice(0, 3);
  const overflow = assignments.length - visible.length;
  return (
    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
      {visible.map((a) => {
        const meta = ROLE_TYPE_TAG[a.roleType] || ROLE_TYPE_TAG.standard;
        return (
          <Tag key={a.id} type={meta.kind} size="sm" title={a.roleName}>
            {a.roleName}
          </Tag>
        );
      })}
      {overflow > 0 && <Tag type="gray" size="sm">{`+${overflow} more`}</Tag>}
    </div>
  );
}

function StatusCell({ status }) {
  const active = status === 'active';
  // Colour + text (WCAG 1.4.1, FR-UM-06)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: active ? '#24a148' : '#8d8d8d',
        }}
      />
      <span>
        {active
          ? t('admin.users.status.active', 'Active')
          : t('admin.users.status.inactive', 'Inactive')}
      </span>
    </div>
  );
}

function ScopeSwatch({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: 14,
          height: 14,
          background: color,
          borderRadius: 2,
        }}
      />
      <span>{label}</span>
    </div>
  );
}

function SummaryField({ label, value }) {
  return (
    <div>
      <div style={{ color: '#525252', fontSize: '0.75rem' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', marginTop: '0.125rem' }}>{value}</div>
    </div>
  );
}
