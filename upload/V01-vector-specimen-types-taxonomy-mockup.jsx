/**
 * V-01: Vector Specimen Types & Taxonomy — Mockup v1.2
 *
 * Changes from v1.1 (2026-04-13):
 *   - Organism groups are no longer a hardcoded enum. Full CRUD on VectorGroup
 *     under Admin → Vector Surveillance → Groups. System-protected defaults
 *     (MOSQUITO, TICK, RODENT, OTHER_ARTHROPOD, OTHER_ANIMAL) ship read-only on
 *     code + deletion; labels and colors remain editable.
 *   - Reference data distribution now follows the OGC-447 FHIR Catalog
 *     Subscription pattern: HubBanner shows connection status; a "Pending
 *     Updates" SideNavMenuItem with red badge lets admins review / accept /
 *     reject hub-proposed changes. No "seed data" banner.
 *   - Working Add flows: Add Group / Add Species / Add Trap render an inline
 *     new-row form at the top of the table and persist to local state.
 *
 * Integration model (Option A, confirmed 2026-04-13):
 *   Vector Sample Types are NOT a separate page. They live inside the existing
 *   Sample Type admin (OGC-296 / S-04). V-01 contributes:
 *     (a) VECTOR added to the sampleDomain enum
 *     (b) Vector Profile Accordion in the Sample Type inline editor when
 *         sampleDomain = VECTOR
 *     (c) VECTOR filter chip in the Sample Type list toolbar
 *
 * Depends on OGC-447 (FHIR Catalog Subscription) for hub/pending infrastructure.
 */

import React, { useState, useMemo } from 'react';
import {
  Header, HeaderName, HeaderGlobalBar, HeaderGlobalAction,
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, SideNavLink, SideNavDivider,
  Breadcrumb, BreadcrumbItem,
  Grid, Column, Stack, Tile,
  TableContainer, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, TextArea, Select, SelectItem, NumberInput, MultiSelect,
  Button, Tag, InlineNotification, Accordion, AccordionItem,
} from '@carbon/react';
import {
  Add, Edit, TrashCan, Locked, ChevronDown, ChevronUp,
  UserAvatar, Bug, CloudDataOps, CheckmarkFilled, WarningFilled,
} from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Seed state (would come from API in real implementation)
// ---------------------------------------------------------------------------

const INITIAL_GROUPS = [
  { code: 'MOSQUITO', label: 'Mosquito', colorKind: 'green', description: 'Culicidae family; arbovirus and malaria vectors', system: true, active: true, speciesCount: 18, trapCount: 4, sampleTypeCount: 2 },
  { code: 'TICK', label: 'Tick', colorKind: 'blue', description: 'Ixodidae & Argasidae; rickettsial and borrelial vectors', system: true, active: true, speciesCount: 10, trapCount: 2, sampleTypeCount: 1 },
  { code: 'RODENT', label: 'Rodent', colorKind: 'purple', description: 'Rattus, Mus, Bandicota; reservoirs for Leptospira, Hantavirus', system: true, active: true, speciesCount: 7, trapCount: 2, sampleTypeCount: 1 },
  { code: 'OTHER_ARTHROPOD', label: 'Other arthropod', colorKind: 'warm-gray', description: 'Fleas, lice, mites, sandflies', system: true, active: true, speciesCount: 3, trapCount: 0, sampleTypeCount: 0 },
  { code: 'OTHER_ANIMAL', label: 'Other animal', colorKind: 'gray', description: 'Bats, civets, primates — zoonotic reservoirs', system: true, active: true, speciesCount: 2, trapCount: 0, sampleTypeCount: 0 },
];

const INITIAL_SPECIES = [
  { id: 'sp1', genus: 'Aedes', species: 'aegypti', subspecies: null, group: 'MOSQUITO', pathogens: ['Dengue', 'Zika', 'Chikungunya'], stages: ['ADULT', 'LARVA', 'PUPA', 'EGG'], active: true },
  { id: 'sp2', genus: 'Aedes', species: 'albopictus', subspecies: null, group: 'MOSQUITO', pathogens: ['Dengue', 'Chikungunya'], stages: ['ADULT', 'LARVA'], active: true },
  { id: 'sp3', genus: 'Anopheles', species: 'sundaicus', subspecies: null, group: 'MOSQUITO', pathogens: ['Plasmodium falciparum', 'Plasmodium vivax'], stages: ['ADULT', 'LARVA'], active: true },
  { id: 'sp4', genus: 'Culex', species: 'quinquefasciatus', subspecies: null, group: 'MOSQUITO', pathogens: ['Wuchereria bancrofti', 'JE virus'], stages: ['ADULT', 'LARVA'], active: true },
  { id: 'sp5', genus: 'Rhipicephalus', species: 'sanguineus', subspecies: null, group: 'TICK', pathogens: ['Ehrlichia canis', 'Babesia'], stages: ['ADULT', 'NYMPH'], active: true },
  { id: 'sp6', genus: 'Rattus', species: 'rattus', subspecies: 'diardii', group: 'RODENT', pathogens: ['Leptospira', 'Rickettsia'], stages: ['ADULT'], active: true },
  { id: 'sp7', genus: 'Rattus', species: 'norvegicus', subspecies: null, group: 'RODENT', pathogens: ['Leptospira', 'Hantavirus'], stages: ['ADULT'], active: true },
];

const INITIAL_TRAPS = [
  { id: 'tr1', name: 'BG-Sentinel Trap', target: 'MOSQUITO', description: 'CO₂-baited adult mosquito trap; widely used for Aedes surveillance', active: true },
  { id: 'tr2', name: 'CDC Light Trap', target: 'MOSQUITO', description: 'UV-light trap for nocturnal mosquitoes, especially Culex and Anopheles', active: true },
  { id: 'tr3', name: 'Ovitrap', target: 'MOSQUITO', description: 'Oviposition trap for Aedes egg collection in households', active: true },
  { id: 'tr4', name: 'Sherman Live Trap', target: 'RODENT', description: 'Folding aluminum live trap for small rodents', active: true },
  { id: 'tr5', name: 'Drag Cloth', target: 'TICK', description: 'White flannel cloth dragged through vegetation to collect questing ticks', active: true },
];

const INITIAL_SAMPLE_TYPES = [
  { id: 'st1', name: 'Serum', domain: 'CLINICAL', desc: 'Venous blood serum' },
  { id: 'st2', name: 'Surface Water', domain: 'ENVIRONMENTAL', desc: 'Surface water for potability or pollution testing' },
  { id: 'st3', name: 'Mosquito Pool — Aedes', domain: 'VECTOR', desc: 'Pool of up to 50 adult Aedes mosquitoes for arbovirus screening',
    vectorProfile: { strategy: 'POOL_FIXED', defaultPoolSize: 50, preservation: 'RNAlater', groups: ['MOSQUITO'], stages: ['ADULT'] } },
  { id: 'st4', name: 'Mosquito Pool — Anopheles', domain: 'VECTOR', desc: 'Variable pool for malaria vector identification',
    vectorProfile: { strategy: 'POOL_VARIABLE', defaultPoolSize: null, preservation: 'Silica gel', groups: ['MOSQUITO'], stages: ['ADULT'] } },
  { id: 'st5', name: 'Individual Rodent Tissue', domain: 'VECTOR', desc: 'Single rodent kidney/spleen for Leptospira testing',
    vectorProfile: { strategy: 'INDIVIDUAL', defaultPoolSize: null, preservation: 'Frozen (-80°C)', groups: ['RODENT'], stages: ['ADULT'] } },
];

const PENDING_UPDATES = [
  { id: 'pu1', kind: 'SPECIES', action: 'NEW', title: 'Aedes scutellaris', summary: 'New Aedes species proposed by hub; South Pacific arbovirus vector.', source: 'OpenELIS Community Hub · 2026-04-12' },
  { id: 'pu2', kind: 'SPECIES', action: 'UPDATE', title: 'Anopheles sundaicus — pathogen list change', summary: 'Hub adds "Plasmodium knowlesi" to pathogens list.', source: 'OpenELIS Community Hub · 2026-04-11' },
  { id: 'pu3', kind: 'TRAP', action: 'NEW', title: 'Gravid Aedes Trap (GAT)', summary: 'New trap type for gravid Aedes females.', source: 'OpenELIS Community Hub · 2026-04-10' },
  { id: 'pu4', kind: 'GROUP', action: 'UPDATE', title: 'MOSQUITO — description refinement', summary: 'Hub proposes updated description with CDC reference.', source: 'OpenELIS Community Hub · 2026-04-08' },
];

const DOMAIN_TAG = { CLINICAL: 'blue', ENVIRONMENTAL: 'teal', BOTH: 'purple', VECTOR: 'green' };

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function AppShell({ page, setPage, pendingCount, children }) {
  return (
    <>
      <Header aria-label={t('header.app', 'OpenELIS Global')}>
        <HeaderName prefix="">{t('header.app', 'OpenELIS Global')}</HeaderName>
        <HeaderGlobalBar>
          <HeaderGlobalAction aria-label={t('header.user', 'User menu')}>
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>

      <SideNav aria-label={t('nav.side', 'Side navigation')} isFixedNav expanded>
        <SideNavItems>
          <SideNavLink>{t('nav.dashboard', 'Dashboard')}</SideNavLink>
          <SideNavLink>{t('nav.orderEntry', 'Order Entry')}</SideNavLink>
          <SideNavLink>{t('nav.results', 'Results')}</SideNavLink>
          <SideNavLink>{t('nav.validation', 'Validation')}</SideNavLink>
          <SideNavLink>{t('nav.reports', 'Reports')}</SideNavLink>
          <SideNavDivider />
          <SideNavLink isActive={page === 'sampleTypes'} onClick={() => setPage('sampleTypes')}>
            {t('nav.admin.sampleTypes', 'Sample Types')}
          </SideNavLink>
          <SideNavLink>{t('nav.admin.testCatalog', 'Test Catalog')}</SideNavLink>
          <SideNavLink>{t('nav.admin.standards', 'Compliance Standards')}</SideNavLink>
          <SideNavLink>{t('nav.admin.sites', 'Sampling Sites')}</SideNavLink>
          <SideNavLink>{t('nav.admin.analyzers', 'Analyzers')}</SideNavLink>

          {/* V-01 adds this submenu */}
          <SideNavMenu title={t('nav.admin.vector', 'Vector Surveillance')} renderIcon={Bug} defaultExpanded>
            <SideNavMenuItem isActive={page === 'groups'} onClick={() => setPage('groups')}>
              {t('nav.admin.vector.groups', 'Groups')}
            </SideNavMenuItem>
            <SideNavMenuItem isActive={page === 'species'} onClick={() => setPage('species')}>
              {t('nav.admin.vector.species', 'Species')}
            </SideNavMenuItem>
            <SideNavMenuItem isActive={page === 'traps'} onClick={() => setPage('traps')}>
              {t('nav.admin.vector.traps', 'Trap Types')}
            </SideNavMenuItem>
            <SideNavMenuItem isActive={page === 'pending'} onClick={() => setPage('pending')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {t('nav.admin.vector.pending', 'Pending Updates')}
                {pendingCount > 0 && (
                  <Tag type="red" size="sm">{pendingCount}</Tag>
                )}
              </span>
            </SideNavMenuItem>
          </SideNavMenu>

          <SideNavLink>{t('nav.admin.users', 'Users & Permissions')}</SideNavLink>
          <SideNavLink>{t('nav.admin.system', 'System Configuration')}</SideNavLink>
        </SideNavItems>
      </SideNav>

      <main style={{ marginLeft: '16rem', padding: '2rem' }}>{children}</main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Hub Status Banner (reuses OGC-447 FHIR Catalog Subscription pattern)
// ---------------------------------------------------------------------------

function HubBanner({ pendingCount, onReview }) {
  return (
    <Tile style={{ padding: '1rem', marginBottom: '1rem', borderLeft: '4px solid #0f62fe' }}>
      <Stack orientation="horizontal" gap={5}>
        <CloudDataOps size={24} style={{ color: '#0f62fe', flexShrink: 0, marginTop: '0.25rem' }} />
        <div style={{ flex: 1 }}>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
            <strong>{t('hub.name', 'OpenELIS Community Hub')}</strong>
            <Tag type="green" renderIcon={CheckmarkFilled}>{t('hub.status.connected', 'Connected')}</Tag>
          </Stack>
          <div style={{ fontSize: '0.875rem', color: '#525252' }}>
            {t('hub.summary', '12 reference catalogs available · 3 subscribed (Species, Traps, Groups) · Last sync 2026-04-13 06:00 UTC')}
          </div>
          {pendingCount > 0 && (
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <WarningFilled size={16} style={{ color: '#f1c21b' }} />
              <span style={{ fontSize: '0.875rem' }}>
                {t('hub.pending', '{n} proposed updates awaiting review').replace('{n}', pendingCount)}
              </span>
              <Button kind="ghost" size="sm" onClick={onReview}>{t('button.reviewUpdates', 'Review updates')}</Button>
            </div>
          )}
        </div>
        <Button kind="tertiary" size="sm">{t('button.syncNow', 'Sync now')}</Button>
      </Stack>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Groups Page — full CRUD with system-protected defaults
// ---------------------------------------------------------------------------

function GroupsPage({ groups, setGroups, onReviewPending, pendingCount }) {
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ code: '', label: '', colorKind: 'teal', description: '' });

  const referenceCount = (g) => g.speciesCount + g.trapCount + g.sampleTypeCount;

  function saveNew() {
    const code = form.code.trim().toUpperCase().replace(/\s+/g, '_');
    const label = form.label.trim();
    if (!code || !label) return;
    setGroups([
      ...groups,
      { code, label, colorKind: form.colorKind, description: form.description.trim(),
        system: false, active: true, speciesCount: 0, trapCount: 0, sampleTypeCount: 0 },
    ]);
    setForm({ code: '', label: '', colorKind: 'teal', description: '' });
    setAdding(false);
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem href="#">{t('crumb.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('crumb.vector', 'Vector Surveillance')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('page.groups', 'Groups')}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{t('page.groups', 'Organism Groups')}</h1>
      <p>{t('page.groups.subtitle',
        'High-level organism groupings used to classify species, trap types, and vector sample types. Five defaults ship with the system and are protected; admins may add additional groups.')}</p>

      <HubBanner pendingCount={pendingCount} onReview={onReviewPending} />

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('search.groups', 'Search group code or label')} />
            <Button renderIcon={Add} size="sm" onClick={() => setAdding(true)}>{t('button.addGroup', 'Add group')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader />
              <TableHeader>{t('col.code', 'Code')}</TableHeader>
              <TableHeader>{t('col.label', 'Label')}</TableHeader>
              <TableHeader>{t('col.color', 'Color')}</TableHeader>
              <TableHeader>{t('col.references', 'References')}</TableHeader>
              <TableHeader>{t('col.status', 'Status')}</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {adding && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Tile style={{ padding: '1rem', background: '#edf5ff' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{t('section.newGroup', 'New organism group')}</h4>
                    <Grid>
                      <Column sm={4} md={4} lg={3}>
                        <TextInput id="ng-code" labelText={t('label.code', 'Code *')}
                          helperText={t('help.codeFormat', 'UPPER_SNAKE_CASE; used as stable identifier.')}
                          value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                      </Column>
                      <Column sm={4} md={4} lg={3}>
                        <TextInput id="ng-label" labelText={t('label.displayLabel', 'Display label *')}
                          value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
                      </Column>
                      <Column sm={4} md={4} lg={3}>
                        <Select id="ng-color" labelText={t('label.color', 'Tag color')}
                          value={form.colorKind} onChange={e => setForm({ ...form, colorKind: e.target.value })}>
                          <SelectItem value="red" text="Red" />
                          <SelectItem value="magenta" text="Magenta" />
                          <SelectItem value="purple" text="Purple" />
                          <SelectItem value="blue" text="Blue" />
                          <SelectItem value="cyan" text="Cyan" />
                          <SelectItem value="teal" text="Teal" />
                          <SelectItem value="green" text="Green" />
                          <SelectItem value="warm-gray" text="Warm gray" />
                          <SelectItem value="gray" text="Gray" />
                        </Select>
                      </Column>
                      <Column sm={4} md={4} lg={3}>
                        <TextInput id="ng-desc" labelText={t('label.description', 'Description')}
                          value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                      </Column>
                    </Grid>
                    <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                      <Button kind="primary" size="sm" onClick={saveNew}>{t('button.create', 'Create group')}</Button>
                      <Button kind="ghost" size="sm" onClick={() => { setAdding(false); setForm({ code: '', label: '', colorKind: 'teal', description: '' }); }}>{t('button.cancel', 'Cancel')}</Button>
                    </Stack>
                  </Tile>
                </TableCell>
              </TableRow>
            )}

            {groups.map(g => (
              <React.Fragment key={g.code}>
                <TableRow>
                  <TableCell>
                    <Button kind="ghost" size="sm" onClick={() => setExpanded(expanded === g.code ? null : g.code)}
                      renderIcon={expanded === g.code ? ChevronUp : ChevronDown} />
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: 'monospace' }}>{g.code}</span>
                    {g.system && <Locked size={14} style={{ marginLeft: '0.5rem', color: '#6929c4', verticalAlign: 'middle' }} />}
                  </TableCell>
                  <TableCell>{g.label}</TableCell>
                  <TableCell><Tag type={g.colorKind}>{g.label}</Tag></TableCell>
                  <TableCell>
                    <span style={{ fontSize: '0.875rem', color: '#525252' }}>
                      {g.speciesCount} species · {g.trapCount} traps · {g.sampleTypeCount} sample types
                    </span>
                  </TableCell>
                  <TableCell><Tag type={g.active ? 'green' : 'gray'}>{g.active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}</Tag></TableCell>
                  <TableCell>
                    <Button kind="ghost" size="sm" renderIcon={Edit}>{t('button.edit', 'Edit')}</Button>
                  </TableCell>
                </TableRow>
                {expanded === g.code && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Tile style={{ padding: '1rem' }}>
                        {g.system && (
                          <InlineNotification kind="info" lowContrast hideCloseButton
                            title={t('msg.systemGroup.title', 'System-protected group')}
                            subtitle={t('msg.systemGroup.body',
                              `The code "${g.code}" and deletion are locked because this group ships with OpenELIS and is referenced by seed data and downstream reports. You may still edit the label, color, description, and active status.`)} />
                        )}
                        <Grid>
                          <Column sm={4} md={4} lg={3}>
                            <TextInput id={`gc-${g.code}`} labelText={t('label.code', 'Code *')} defaultValue={g.code} disabled={g.system} />
                          </Column>
                          <Column sm={4} md={4} lg={3}>
                            <TextInput id={`gl-${g.code}`} labelText={t('label.displayLabel', 'Display label *')} defaultValue={g.label} />
                          </Column>
                          <Column sm={4} md={4} lg={3}>
                            <Select id={`gk-${g.code}`} labelText={t('label.color', 'Tag color')} defaultValue={g.colorKind}>
                              <SelectItem value="red" text="Red" />
                              <SelectItem value="purple" text="Purple" />
                              <SelectItem value="blue" text="Blue" />
                              <SelectItem value="teal" text="Teal" />
                              <SelectItem value="green" text="Green" />
                              <SelectItem value="warm-gray" text="Warm gray" />
                              <SelectItem value="gray" text="Gray" />
                            </Select>
                          </Column>
                          <Column sm={4} md={4} lg={3}>
                            <TextInput id={`gd-${g.code}`} labelText={t('label.description', 'Description')} defaultValue={g.description} />
                          </Column>
                        </Grid>
                        <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                          <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
                          <Button kind="ghost" size="sm" onClick={() => setExpanded(null)}>{t('button.cancel', 'Cancel')}</Button>
                          {!g.system && (
                            <Button kind="danger--ghost" size="sm" renderIcon={TrashCan}
                              disabled={referenceCount(g) > 0}
                              title={referenceCount(g) > 0 ? t('msg.cannotDelete', 'Cannot delete: referenced by other records') : ''}>
                              {t('button.delete', 'Delete')}
                            </Button>
                          )}
                        </Stack>
                      </Tile>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Species Page — with working Add + inline new-row form
// ---------------------------------------------------------------------------

function SpeciesPage({ groups, species, setSpecies, pendingCount, onReviewPending }) {
  const [expanded, setExpanded] = useState(null);
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ genus: '', species: '', subspecies: '', group: groups[0]?.code, pathogens: '' });

  const groupByCode = useMemo(() => Object.fromEntries(groups.map(g => [g.code, g])), [groups]);
  const rows = useMemo(
    () => groupFilter === 'ALL' ? species : species.filter(s => s.group === groupFilter),
    [groupFilter, species]
  );

  function saveNew() {
    if (!form.genus.trim() || !form.species.trim()) return;
    setSpecies([
      { id: `sp${Date.now()}`, genus: form.genus.trim(), species: form.species.trim(),
        subspecies: form.subspecies.trim() || null, group: form.group,
        pathogens: form.pathogens.split(',').map(p => p.trim()).filter(Boolean),
        stages: ['ADULT'], active: true },
      ...species,
    ]);
    setForm({ genus: '', species: '', subspecies: '', group: groups[0]?.code, pathogens: '' });
    setAdding(false);
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem href="#">{t('crumb.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('crumb.vector', 'Vector Surveillance')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('page.species', 'Species')}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{t('page.species', 'Species')}</h1>
      <p>{t('page.species.subtitle',
        'Manage the taxonomy of mosquitoes, ticks, rodents, and other vector organisms. Species defined here are selectable during vector specimen collection (V-02) and identification (V-03).')}</p>

      <HubBanner pendingCount={pendingCount} onReview={onReviewPending} />

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('search.species', 'Search by genus, species, or pathogen')} />
            <Select id="group-filter" labelText="" hideLabel value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <SelectItem value="ALL" text={t('filter.allGroups', 'All groups')} />
              {groups.map(g => <SelectItem key={g.code} value={g.code} text={g.label} />)}
            </Select>
            <Button renderIcon={Add} size="sm" onClick={() => setAdding(true)}>{t('button.addSpecies', 'Add species')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader />
              <TableHeader>{t('col.genus', 'Genus')}</TableHeader>
              <TableHeader>{t('col.species', 'Species')}</TableHeader>
              <TableHeader>{t('col.subspecies', 'Subspecies')}</TableHeader>
              <TableHeader>{t('col.group', 'Group')}</TableHeader>
              <TableHeader>{t('col.pathogens', 'Pathogens')}</TableHeader>
              <TableHeader>{t('col.status', 'Status')}</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {adding && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Tile style={{ padding: '1rem', background: '#edf5ff' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{t('section.newSpecies', 'New species')}</h4>
                    <Grid>
                      <Column sm={4} md={2} lg={3}><TextInput id="nsp-genus" labelText={t('label.genus', 'Genus *')}
                        value={form.genus} onChange={e => setForm({ ...form, genus: e.target.value })} /></Column>
                      <Column sm={4} md={2} lg={3}><TextInput id="nsp-species" labelText={t('label.species', 'Species *')}
                        value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} /></Column>
                      <Column sm={4} md={2} lg={3}><TextInput id="nsp-subsp" labelText={t('label.subspecies', 'Subspecies (optional)')}
                        value={form.subspecies} onChange={e => setForm({ ...form, subspecies: e.target.value })} /></Column>
                      <Column sm={4} md={2} lg={3}>
                        <Select id="nsp-group" labelText={t('label.group', 'Group *')}
                          value={form.group} onChange={e => setForm({ ...form, group: e.target.value })}>
                          {groups.map(g => <SelectItem key={g.code} value={g.code} text={g.label} />)}
                        </Select>
                      </Column>
                    </Grid>
                    <TextInput id="nsp-path" labelText={t('label.pathogens', 'Pathogens (comma-separated)')}
                      value={form.pathogens} onChange={e => setForm({ ...form, pathogens: e.target.value })} />
                    <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                      <Button kind="primary" size="sm" onClick={saveNew}>{t('button.create', 'Create species')}</Button>
                      <Button kind="ghost" size="sm" onClick={() => setAdding(false)}>{t('button.cancel', 'Cancel')}</Button>
                    </Stack>
                  </Tile>
                </TableCell>
              </TableRow>
            )}

            {rows.map(r => {
              const g = groupByCode[r.group];
              return (
                <React.Fragment key={r.id}>
                  <TableRow>
                    <TableCell>
                      <Button kind="ghost" size="sm" onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        renderIcon={expanded === r.id ? ChevronUp : ChevronDown} />
                    </TableCell>
                    <TableCell><em>{r.genus}</em></TableCell>
                    <TableCell><em>{r.species}</em></TableCell>
                    <TableCell>{r.subspecies ? <em>ssp. {r.subspecies}</em> : '—'}</TableCell>
                    <TableCell><Tag type={g?.colorKind || 'gray'}>{g?.label || r.group}</Tag></TableCell>
                    <TableCell>{r.pathogens.slice(0,2).join(', ')}{r.pathogens.length>2?` +${r.pathogens.length-2}`:''}</TableCell>
                    <TableCell><Tag type={r.active ? 'green' : 'gray'}>{r.active ? t('status.active', 'Active') : t('status.inactive', 'Inactive')}</Tag></TableCell>
                    <TableCell><Button kind="ghost" size="sm" renderIcon={Edit}>{t('button.edit', 'Edit')}</Button></TableCell>
                  </TableRow>
                  {expanded === r.id && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Tile style={{ padding: '1rem' }}>
                          <Grid>
                            <Column sm={4} md={4} lg={4}><TextInput id={`g-${r.id}`} labelText={t('label.genus', 'Genus *')} defaultValue={r.genus} /></Column>
                            <Column sm={4} md={4} lg={4}><TextInput id={`s-${r.id}`} labelText={t('label.species', 'Species *')} defaultValue={r.species} /></Column>
                            <Column sm={4} md={4} lg={4}><TextInput id={`sub-${r.id}`} labelText={t('label.subspecies', 'Subspecies (optional)')} defaultValue={r.subspecies || ''} /></Column>
                          </Grid>
                          <Accordion>
                            <AccordionItem title={t('section.advanced', 'Advanced: pathogens & lifecycle stages')}>
                              <TextInput id={`p-${r.id}`} labelText={t('label.pathogens', 'Pathogens of interest')} defaultValue={r.pathogens.join(', ')} helperText={t('help.pathogens', 'Comma-separated. Selectable during vector testing (V-03).')} />
                              <TextInput id={`st-${r.id}`} labelText={t('label.stages', 'Lifecycle stages')} defaultValue={r.stages.join(', ')} />
                            </AccordionItem>
                          </Accordion>
                          <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                            <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
                            <Button kind="ghost" size="sm" onClick={() => setExpanded(null)}>{t('button.cancel', 'Cancel')}</Button>
                          </Stack>
                        </Tile>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Trap Types Page — with working Add
// ---------------------------------------------------------------------------

function TrapTypesPage({ groups, traps, setTraps, pendingCount, onReviewPending }) {
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', target: groups[0]?.code, description: '' });

  const groupByCode = useMemo(() => Object.fromEntries(groups.map(g => [g.code, g])), [groups]);

  function saveNew() {
    if (!form.name.trim()) return;
    setTraps([
      { id: `tr${Date.now()}`, name: form.name.trim(), target: form.target,
        description: form.description.trim(), active: true },
      ...traps,
    ]);
    setForm({ name: '', target: groups[0]?.code, description: '' });
    setAdding(false);
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem href="#">{t('crumb.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('crumb.vector', 'Vector Surveillance')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('page.traps', 'Trap Types')}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{t('page.traps', 'Trap Types')}</h1>
      <p>{t('page.traps.subtitle', 'Collection methods and devices used to capture vectors. Selectable when recording a Collection Lot (V-02).')}</p>

      <HubBanner pendingCount={pendingCount} onReview={onReviewPending} />

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('search.traps', 'Search trap name or description')} />
            <Button renderIcon={Add} size="sm" onClick={() => setAdding(true)}>{t('button.addTrap', 'Add trap type')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader />
              <TableHeader>{t('col.trapName', 'Trap name')}</TableHeader>
              <TableHeader>{t('col.target', 'Target organism group')}</TableHeader>
              <TableHeader>{t('col.description', 'Description')}</TableHeader>
              <TableHeader>{t('col.status', 'Status')}</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {adding && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Tile style={{ padding: '1rem', background: '#edf5ff' }}>
                    <h4 style={{ marginBottom: '1rem' }}>{t('section.newTrap', 'New trap type')}</h4>
                    <Grid>
                      <Column sm={4} md={4} lg={6}><TextInput id="ntr-name" labelText={t('label.trapName', 'Trap name *')}
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Column>
                      <Column sm={4} md={4} lg={6}>
                        <Select id="ntr-target" labelText={t('label.target', 'Target organism group *')}
                          value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                          {groups.map(g => <SelectItem key={g.code} value={g.code} text={g.label} />)}
                        </Select>
                      </Column>
                    </Grid>
                    <TextArea id="ntr-desc" labelText={t('label.description', 'Description')}
                      value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
                    <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                      <Button kind="primary" size="sm" onClick={saveNew}>{t('button.create', 'Create trap type')}</Button>
                      <Button kind="ghost" size="sm" onClick={() => setAdding(false)}>{t('button.cancel', 'Cancel')}</Button>
                    </Stack>
                  </Tile>
                </TableCell>
              </TableRow>
            )}

            {traps.map(tr => {
              const g = groupByCode[tr.target];
              return (
                <React.Fragment key={tr.id}>
                  <TableRow>
                    <TableCell>
                      <Button kind="ghost" size="sm" onClick={() => setExpanded(expanded === tr.id ? null : tr.id)}
                        renderIcon={expanded === tr.id ? ChevronUp : ChevronDown} />
                    </TableCell>
                    <TableCell><strong>{tr.name}</strong></TableCell>
                    <TableCell><Tag type={g?.colorKind || 'gray'}>{g?.label || tr.target}</Tag></TableCell>
                    <TableCell>{tr.description}</TableCell>
                    <TableCell><Tag type="green">{t('status.active', 'Active')}</Tag></TableCell>
                    <TableCell><Button kind="ghost" size="sm" renderIcon={Edit}>{t('button.edit', 'Edit')}</Button></TableCell>
                  </TableRow>
                  {expanded === tr.id && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Tile style={{ padding: '1rem' }}>
                          <Grid>
                            <Column sm={4} md={4} lg={6}><TextInput id={`tn-${tr.id}`} labelText={t('label.trapName', 'Trap name *')} defaultValue={tr.name} /></Column>
                            <Column sm={4} md={4} lg={6}>
                              <Select id={`tg-${tr.id}`} labelText={t('label.target', 'Target organism group *')} defaultValue={tr.target}>
                                {groups.map(gg => <SelectItem key={gg.code} value={gg.code} text={gg.label} />)}
                              </Select>
                            </Column>
                          </Grid>
                          <TextArea id={`td-${tr.id}`} labelText={t('label.description', 'Description')} defaultValue={tr.description} rows={3} />
                          <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                            <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
                            <Button kind="ghost" size="sm" onClick={() => setExpanded(null)}>{t('button.cancel', 'Cancel')}</Button>
                          </Stack>
                        </Tile>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Pending Updates Page — OGC-447 review pattern
// ---------------------------------------------------------------------------

function PendingUpdatesPage({ pending, setPending }) {
  function decide(id, decision) {
    setPending(pending.filter(p => p.id !== id));
    // In the real implementation this calls the Accept/Reject endpoint and
    // updates the VectorGroup/VectorSpeciesTaxonomy/VectorTrapType record.
    console.log('[stub] decision', decision, 'for', id);
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem href="#">{t('crumb.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem href="#">{t('crumb.vector', 'Vector Surveillance')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('page.pending', 'Pending Updates')}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{t('page.pending', 'Pending Updates from Community Hub')}</h1>
      <p>{t('page.pending.subtitle',
        'Proposed additions and revisions from the OpenELIS Community Hub. Review each change, then accept (merge into your local reference data) or reject (record decision and leave local data unchanged). Follows the OGC-447 subscription review pattern.')}</p>

      {pending.length === 0 && (
        <InlineNotification kind="success" title={t('msg.allCaughtUp.title', 'All caught up')}
          subtitle={t('msg.allCaughtUp.body', 'No proposed updates from the hub at this time.')}
          lowContrast hideCloseButton />
      )}

      <Stack gap={4}>
        {pending.map(p => (
          <Tile key={p.id} style={{ padding: '1rem' }}>
            <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center', marginBottom: '0.5rem' }}>
              <Tag type={p.kind === 'SPECIES' ? 'teal' : p.kind === 'TRAP' ? 'cyan' : 'purple'}>{p.kind}</Tag>
              <Tag type={p.action === 'NEW' ? 'green' : 'blue'}>{p.action}</Tag>
              <strong>{p.title}</strong>
            </Stack>
            <p style={{ color: '#525252' }}>{p.summary}</p>
            <p style={{ fontSize: '0.75rem', color: '#6f6f6f', marginBottom: '0.75rem' }}>{p.source}</p>
            <Stack orientation="horizontal" gap={3}>
              <Button kind="primary" size="sm">{t('button.reviewDiff', 'Review diff')}</Button>
              <Button kind="tertiary" size="sm" onClick={() => decide(p.id, 'ACCEPT')}>{t('button.accept', 'Accept')}</Button>
              <Button kind="danger--ghost" size="sm" onClick={() => decide(p.id, 'REJECT')}>{t('button.reject', 'Reject')}</Button>
            </Stack>
          </Tile>
        ))}
      </Stack>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sample Types Page — existing Sample Type admin with Vector Profile accordion
// ---------------------------------------------------------------------------

function SampleTypesPage({ groups, sampleTypes }) {
  const [expanded, setExpanded] = useState('st3');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const rows = useMemo(
    () => domainFilter === 'ALL' ? sampleTypes : sampleTypes.filter(s => s.domain === domainFilter),
    [domainFilter, sampleTypes]
  );

  const groupOptions = useMemo(
    () => groups.map(g => ({ id: g.code, label: g.label })),
    [groups]
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbItem href="#">{t('crumb.admin', 'Admin')}</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{t('page.sampleTypes', 'Sample Types')}</BreadcrumbItem>
      </Breadcrumb>
      <h1>{t('page.sampleTypes', 'Sample Types')}</h1>
      <p>{t('page.sampleTypes.subtitle',
        'Manage all sample types. Vector sample types are edited here via the Vector Profile section that appears when domain = Vector.')}</p>

      <InlineNotification kind="info"
        title={t('msg.integration.title', 'How V-01 integrates with Sample Type Management')}
        subtitle={t('msg.integration.body',
          'V-01 extends the existing Sample Type entity by adding VECTOR to the sampleDomain enum (introduced in S-04). When a sample type\'s domain is set to Vector, a Vector Profile accordion appears below Basic Info. Species, Trap Types, and Groups remain separate admin pages because they are independent reference tables, not per-sample-type configuration.')}
        lowContrast hideCloseButton />

      <TableContainer>
        <TableToolbar>
          <TableToolbarContent>
            <TableToolbarSearch placeholder={t('search.sampleTypes', 'Search sample type name')} />
            <Select id="domain-filter" labelText="" hideLabel value={domainFilter} onChange={e => setDomainFilter(e.target.value)}>
              <SelectItem value="ALL" text={t('filter.allDomains', 'All domains')} />
              <SelectItem value="CLINICAL" text="Clinical" />
              <SelectItem value="ENVIRONMENTAL" text="Environmental" />
              <SelectItem value="VECTOR" text="Vector" />
            </Select>
            <Button renderIcon={Add} size="sm">{t('button.addSampleType', 'Add sample type')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader />
              <TableHeader>{t('col.sampleType', 'Sample type')}</TableHeader>
              <TableHeader>{t('col.domain', 'Domain')}</TableHeader>
              <TableHeader>{t('col.description', 'Description')}</TableHeader>
              <TableHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(s => (
              <React.Fragment key={s.id}>
                <TableRow>
                  <TableCell>
                    <Button kind="ghost" size="sm" onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      renderIcon={expanded === s.id ? ChevronUp : ChevronDown} />
                  </TableCell>
                  <TableCell><strong>{s.name}</strong></TableCell>
                  <TableCell><Tag type={DOMAIN_TAG[s.domain]}>{s.domain}</Tag></TableCell>
                  <TableCell>{s.desc}</TableCell>
                  <TableCell><Button kind="ghost" size="sm" renderIcon={Edit}>{t('button.edit', 'Edit')}</Button></TableCell>
                </TableRow>
                {expanded === s.id && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Tile style={{ padding: '1rem' }}>
                        <Accordion>
                          <AccordionItem title={t('section.basicInfo', 'Basic Info')} open>
                            <Grid>
                              <Column sm={4} md={4} lg={6}>
                                <TextInput id={`n-${s.id}`} labelText={t('label.sampleTypeName', 'Sample type name *')} defaultValue={s.name} />
                              </Column>
                              <Column sm={4} md={4} lg={6}>
                                <Select id={`d-${s.id}`}
                                  labelText={t('label.domain', 'Domain *')}
                                  helperText={t('help.domain', 'VECTOR reveals the Vector Profile section. (VECTOR added by V-01; enum introduced by S-04.)')}
                                  defaultValue={s.domain}>
                                  <SelectItem value="CLINICAL" text="Clinical" />
                                  <SelectItem value="ENVIRONMENTAL" text="Environmental" />
                                  <SelectItem value="BOTH" text="Both" />
                                  <SelectItem value="VECTOR" text="Vector" />
                                </Select>
                              </Column>
                            </Grid>
                            <TextArea id={`desc-${s.id}`} labelText={t('label.description', 'Description')} defaultValue={s.desc} rows={2} />
                          </AccordionItem>

                          {/* V-01 contribution: Vector Profile progressive-discloses when domain = VECTOR */}
                          {s.domain === 'VECTOR' && s.vectorProfile && (
                            <AccordionItem title={t('section.vectorProfile', 'Vector Profile (added by V-01)')} open>
                              <Grid>
                                <Column sm={4} md={4} lg={6}>
                                  <Select id={`ps-${s.id}`} labelText={t('label.poolingStrategy', 'Pooling strategy *')} defaultValue={s.vectorProfile.strategy}>
                                    <SelectItem value="INDIVIDUAL" text={t('enum.strategy.individual', 'Individual (1 organism per sample)')} />
                                    <SelectItem value="POOL_FIXED" text={t('enum.strategy.poolFixed', 'Pool — fixed size')} />
                                    <SelectItem value="POOL_VARIABLE" text={t('enum.strategy.poolVariable', 'Pool — variable size')} />
                                  </Select>
                                </Column>
                                {s.vectorProfile.strategy === 'POOL_FIXED' && (
                                  <Column sm={4} md={4} lg={6}>
                                    <NumberInput id={`pz-${s.id}`}
                                      label={t('label.defaultPoolSize', 'Default pool size *')}
                                      helperText={t('help.defaultPoolSize', 'Prefilled as pool size when creating a Collection Lot.')}
                                      defaultValue={s.vectorProfile.defaultPoolSize || 1} min={1} />
                                  </Column>
                                )}
                              </Grid>
                              <Grid>
                                <Column sm={4} md={4} lg={6}>
                                  <TextInput id={`pr-${s.id}`} labelText={t('label.preservation', 'Preservation method *')} defaultValue={s.vectorProfile.preservation} />
                                </Column>
                                <Column sm={4} md={4} lg={6}>
                                  <MultiSelect id={`gr-${s.id}`}
                                    titleText={t('label.allowedGroups', 'Allowed organism groups *')}
                                    label={t('placeholder.selectGroups', 'Select groups')}
                                    items={groupOptions}
                                    initialSelectedItems={groupOptions.filter(o => s.vectorProfile.groups.includes(o.id))}
                                    itemToString={x => x.label}
                                    helperText={t('help.allowedGroups', 'Populated from the Groups admin page (V-01). Updating Groups here updates all vector sample types.')} />
                                </Column>
                              </Grid>
                              <TextInput id={`stg-${s.id}`} labelText={t('label.allowedStages', 'Allowed lifecycle stages')}
                                defaultValue={s.vectorProfile.stages.join(', ')}
                                helperText={t('help.allowedStages', 'Constrains stage selection in V-02 collection entry.')} />
                            </AccordionItem>
                          )}
                        </Accordion>
                        <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                          <Button kind="primary" size="sm">{t('button.save', 'Save')}</Button>
                          <Button kind="ghost" size="sm" onClick={() => setExpanded(null)}>{t('button.cancel', 'Cancel')}</Button>
                        </Stack>
                      </Tile>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Root component — owns state shared across pages
// ---------------------------------------------------------------------------

export default function V01VectorReferenceData() {
  const [page, setPage] = useState('groups');
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [species, setSpecies] = useState(INITIAL_SPECIES);
  const [traps, setTraps] = useState(INITIAL_TRAPS);
  const [sampleTypes] = useState(INITIAL_SAMPLE_TYPES);
  const [pending, setPending] = useState(PENDING_UPDATES);

  const goPending = () => setPage('pending');

  return (
    <AppShell page={page} setPage={setPage} pendingCount={pending.length}>
      {page === 'groups' && (
        <GroupsPage groups={groups} setGroups={setGroups}
          pendingCount={pending.length} onReviewPending={goPending} />
      )}
      {page === 'species' && (
        <SpeciesPage groups={groups} species={species} setSpecies={setSpecies}
          pendingCount={pending.length} onReviewPending={goPending} />
      )}
      {page === 'traps' && (
        <TrapTypesPage groups={groups} traps={traps} setTraps={setTraps}
          pendingCount={pending.length} onReviewPending={goPending} />
      )}
      {page === 'pending' && (
        <PendingUpdatesPage pending={pending} setPending={setPending} />
      )}
      {page === 'sampleTypes' && (
        <SampleTypesPage groups={groups} sampleTypes={sampleTypes} />
      )}
    </AppShell>
  );
}
