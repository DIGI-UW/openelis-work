// Locations & Organizations: developer handoff mockup (FRS v0.3)
// Route: /MasterListsPage/locations (+ /sites, /areas, /import)
// SideNav: Admin → Locations & Organizations → Organizations | Sampling Sites | Geographic Areas | Import / Export
// Redirects: /MasterListsPage/organizationManagement, /MasterListsPage/organizationEdit?ID=, vectorSurveillanceSetup/sampling-sites
// Mock data is Papua New Guinea. Replace with REST calls per the FRS; all strings go through t() with the FRS keys.
// Style note: add `.lo-highlight { background: var(--cds-highlight); }` for search-match highlighting.

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  SideNav, SideNavItems, SideNavMenu, SideNavMenuItem, Breadcrumb, BreadcrumbItem, Stack,
  Accordion, AccordionItem, Grid, Column, Link, Toggle, Tag, Button, InlineNotification,
  ActionableNotification, TableContainer, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TableBatchActions, TableBatchAction, Table, TableHead, TableRow, TableHeader, TableBody, TableCell,
  TableSelectAll, TableSelectRow, FilterableMultiSelect, ComboBox, Select, SelectItem, Checkbox, Tile,
  Pagination, Modal, UnorderedList, ListItem, StructuredListWrapper, StructuredListBody,
  StructuredListRow, StructuredListCell, FormGroup, TextInput, RadioButton, RadioButtonGroup,
  FileUploaderDropContainer, TileGroup, RadioTile,
} from '@carbon/react';
import { Add, Download, Misuse, CheckmarkOutline, RecentlyViewed, ChevronDown, ChevronRight } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ---------------------------------------------------------------------------
// Mock data (Papua New Guinea, matching the FRS CSV example)
// ---------------------------------------------------------------------------
const AREA_LEVELS = [
  { level: 1, name: 'Region' }, { level: 2, name: 'Province' },
  { level: 3, name: 'District' }, { level: 4, name: 'LLG' },
];
const TYPES = [
  { id: 'rc', name: 'referring clinic', label: 'Referring clinic', kind: 'facility' },
  { id: 'rl', name: 'referral lab', label: 'Referral lab', kind: 'facility' },
  { id: 'dept', name: 'dept', label: 'Ward / Dept', kind: 'unit' },
  { id: 'ss', name: 'sampling site', label: 'Sampling site', kind: 'site' },
  ...AREA_LEVELS.map(l => ({ id: 'L' + l.level, name: l.name, label: l.name, kind: 'area', level: l.level })),
];
const typeById = Object.fromEntries(TYPES.map(x => [x.id, x]));
const A = (id, name, code, level, parent, active = true) => ({ id, name, code, types: ['L' + level], parent, active, inUse: 0 });
const INITIAL = [
  A('a1', 'Southern Region', 'R-SOU', 1, null), A('a2', 'Momase Region', 'R-MOM', 1, null),
  A('a3', 'Highlands Region', 'R-HIG', 1, null), A('a4', 'Islands Region', 'R-ISL', 1, null),
  A('a5', 'National Capital District', 'P-NCD', 2, 'a1'), A('a6', 'Central Province', 'P-CEN', 2, 'a1'),
  A('a7', 'Morobe Province', 'P-MOR', 2, 'a2'), A('a8', 'Madang Province', 'P-MAD', 2, 'a2'),
  A('a9', 'Eastern Highlands Province', 'P-EHP', 2, 'a3'), A('a10', 'Western Highlands Province', 'P-WHP', 2, 'a3'),
  A('a11', 'East New Britain Province', 'P-ENB', 2, 'a4'),
  A('a12', 'Moresby South', 'NCD-MS', 3, 'a5'), A('a13', 'Moresby North-East', 'NCD-MNE', 3, 'a5'), A('a14', 'Moresby North-West', 'NCD-MNW', 3, 'a5'),
  A('a15', 'Kairuku-Hiri', 'CEN-KH', 3, 'a6'), A('a16', 'Lae', 'MOR-LAE', 3, 'a7'), A('a17', 'Huon Gulf', 'MOR-HG', 3, 'a7'),
  A('a18', 'Madang', 'MAD-MAD', 3, 'a8'), A('a19', 'Goroka', 'EHP-GKA', 3, 'a9'), A('a20', 'Mount Hagen', 'WHP-HAG', 3, 'a10'),
  A('a21', 'Kokopo', 'ENB-KOK', 3, 'a11'),
  A('a22', 'Lae Urban', 'LLG-LAEU', 4, 'a16'), A('a23', 'Ahi Rural', 'LLG-AHI', 4, 'a16'), A('a24', 'Wampar Rural', 'LLG-WAM', 4, 'a17'),
  A('a25', 'Hiri Rural', 'LLG-HIRI', 4, 'a15'), A('a26', 'Goroka Urban', 'LLG-GKAU', 4, 'a19'), A('a27', 'Hagen Urban', 'LLG-HAGU', 4, 'a20'),
  A('a28', 'Kokopo-Vunamami Urban', 'LLG-KOKU', 4, 'a21'), A('a29', 'Madang Urban', 'LLG-MADU', 4, 'a18'),
  A('a30', 'Bitapaka Rural', 'LLG-BITA', 4, 'a21', false),
  { id: 'f1', ids: [{ label: 'National facility code', value: 'NCD-0001' }, { label: 'DHIS2 ID', value: 'Rp1k2mPqH3x' }], cat: 'National referral hospital', own: 'Government', name: 'Port Moresby General Hospital', code: 'PMGH', types: ['rc'], parent: 'a12', active: true, inUse: 18412, open: 146, city: 'Port Moresby', street: 'Taurama Road, Boroko', phone: '+675 324 8200', contact: 'Dr. Anna Kila', email: 'lab@pmgh.gov.pg', lat: '-9.4705', lng: '147.1597' },
  { id: 'f2', ids: [{ label: 'National facility code', value: 'MOR-0001' }, { label: 'DHIS2 ID', value: 'Qw8LmZa21Ks' }], cat: 'Provincial hospital', own: 'Government', ref: { status: 'Approved', body: 'PNG Medical Laboratory Accreditation', num: 'ML-014', expiry: '2027-06-30', last: '2026-03-12', next: '2027-03-12', notes: 'TB culture and DST referrals.' }, name: 'Angau Memorial General Hospital', code: 'ANGAU', types: ['rc', 'rl'], parent: 'a22', active: true, inUse: 9240, open: 71, city: 'Lae', street: 'Markham Road', phone: '+675 472 1400', contact: 'Peter Sine', email: 'pathology@angau.gov.pg', lat: '-6.7224', lng: '146.9960' },
  { id: 'f3', ids: [{ label: 'National facility code', value: 'NCD-0107' }], cat: 'Urban clinic', own: 'Government', name: 'Tokarara Clinic', code: '', types: ['rc'], parent: 'a14', active: true, inUse: 402, open: 3, city: 'Port Moresby' },
  { id: 'f4', ids: [{ label: 'DHIS2 ID', value: 'Hj3Ks9Pw0Zb' }], cat: 'District hospital', own: 'Government', name: 'Gerehu General Hospital', code: '', types: ['rc'], parent: 'a14', active: true, inUse: 2310, open: 19, city: 'Port Moresby', lat: '-9.4050', lng: '147.1650' },
  { id: 'f5', ids: [], cat: 'Urban clinic', own: 'Church', name: 'Kilakila Clinic', code: 'NCD-KKC', types: ['rc'], parent: 'a12', active: false, inUse: 188, open: 0, city: 'Port Moresby' },
  { id: 'f6', ids: [{ label: 'National facility code', value: 'NCD-LAB-01' }, { label: 'DHIS2 ID', value: 'Lb7Nm2Qa9Xc' }], cat: 'Laboratory', own: 'Government', ref: { status: 'Approved', body: 'ISO 15189 (NATA)', num: '12391', expiry: '2026-11-30', last: '2025-08-30', next: '2026-08-30', notes: 'National reference lab. Viral load, HIV DNA PCR, influenza.' }, name: 'Central Public Health Laboratory', code: 'CPHL', types: ['rl'], parent: 'a12', active: true, inUse: 5120, open: 38, city: 'Port Moresby', contact: 'Lab Manager', phone: '+675 301 3700', lat: '-9.4712', lng: '147.1605' },
  { id: 'f7', ids: [{ label: 'National facility code', value: 'WHP-0001' }], cat: 'Provincial hospital', own: 'Government', name: 'Mount Hagen Provincial Hospital', code: 'MHPH', types: ['rc'], parent: 'a27', active: true, inUse: 6011, open: 44, city: 'Mount Hagen', registry: true, lat: '-5.8580', lng: '144.2300' },
  { id: 'f8', ids: [{ label: 'National facility code', value: 'NCD-0112' }], cat: 'Urban clinic', own: 'Church', formerNames: ['Nine Mile Clinic'], name: '9 Mile Urban Clinic', code: 'NCD-9MC', types: ['rc'], parent: 'a13', active: true, inUse: 1377, open: 12, city: 'Port Moresby', lat: '-9.4000', lng: '147.2250' },
  { id: 'f9', ids: [{ label: 'National facility code', value: 'EHP-0001' }], cat: 'Provincial hospital', own: 'Government', name: 'Goroka Provincial Hospital', code: 'GPH', types: ['rc'], parent: 'a26', active: true, inUse: 4880, open: 30, city: 'Goroka', lat: '-6.0830', lng: '145.3860' },
  { id: 'f10', ids: [], cat: 'Urban clinic', own: 'Church', name: '9 Mile  Urban Clinic', code: '', types: ['rc'], parent: 'a13', active: true, inUse: 26, open: 1, city: 'Port Moresby', phone: '+675 325 1190' },
  { id: 'u1', svc: 'Outpatient', name: 'Outpatient Department', code: 'PMGH-OPD', contact: 'Sister Ruth Moi', phone: '+675 324 8210', email: 'opd@pmgh.gov.pg', types: ['dept'], parent: 'f1', active: true, inUse: 7120, open: 52 },
  { id: 'u2', svc: 'Maternity', name: 'Maternity Ward', code: 'PMGH-MAT', contact: 'Sister Grace Tau', phone: '+675 324 8233', types: ['dept'], parent: 'f1', active: true, inUse: 3301, open: 29 },
  { id: 'u3', svc: 'Inpatient', name: 'Paediatric Ward', code: 'PMGH-PAED', types: ['dept'], parent: 'f1', active: true, inUse: 2654, open: 21 },
  { id: 'u4', svc: 'Inpatient', name: 'Medical Ward 3 (closed)', code: '', types: ['dept'], parent: 'f1', active: false, inUse: 410, open: 0 },
  { id: 'u5', svc: 'Emergency', name: 'Emergency Department', code: 'ANGAU-ED', contact: 'Dr. Mark Kaupa', phone: '+675 472 1411', email: 'ed@angau.gov.pg', types: ['dept'], parent: 'f2', active: true, inUse: 2890, open: 24 },
  { id: 'u6', svc: 'Inpatient', name: "Children's Ward", code: 'ANGAU-CW', types: ['dept'], parent: 'f2', active: true, inUse: 1702, open: 15 },
  { id: 'u7', svc: 'Inpatient', name: 'Medical Ward', code: 'ANGAU-MW', types: ['dept'], parent: 'f2', active: true, inUse: 2215, open: 18 },
  { id: 'u8', svc: 'Outpatient', name: 'TB Clinic', code: 'ANGAU-TB', types: ['dept'], parent: 'f2', active: true, inUse: 980, open: 14 },
  { id: 'u10', svc: 'Outpatient', name: 'Dental Clinic', code: 'PMGH-DEN', types: ['dept'], parent: 'f1', active: true, inUse: 512, open: 4 },
  { id: 'u11', svc: 'Outpatient', name: 'Kundiawa Road Outreach Clinic', code: 'MHPH-OUT', types: ['dept'], parent: 'f7', active: true, inUse: 220, open: 2, lat: '-5.9012', lng: '144.2760', contact: 'Sister Kila Pup' },
  { id: 'u9', svc: 'Outpatient', name: 'Antenatal Clinic', code: '', types: ['dept'], parent: 'f8', active: true, inUse: 640, open: 6 },
  { id: 's1', name: 'Bumbu Settlement light trap', code: 'VT-LAE-03', types: ['ss'], parent: 'a22', active: true, inUse: 112, open: 4, siteType: 'Vector trap', subtype: 'CDC light trap', zone: 'Peri-urban settlement', contact: 'John Wari', phone: '+675 7123 4567', lat: '-6.7160', lng: '147.0010', desc: 'Weekly Anopheles collection, overnight trap by the river bank.' },
  { id: 's2', name: 'Butibam village BG trap', code: 'VT-LAE-07', types: ['ss'], parent: 'a22', active: true, inUse: 64, open: 2, siteType: 'Vector trap', subtype: 'BG-Sentinel', zone: 'Coastal village', contact: 'Mary Kasu', lat: '-6.7320', lng: '147.0240' },
  { id: 's3', name: 'Laloki River intake', code: 'WS-CEN-01', types: ['ss'], parent: 'a25', active: true, inUse: 58, open: 1, siteType: 'Water source', subtype: 'River intake', zone: 'Rural river', lat: '-9.3560', lng: '147.2710' },
  { id: 's4', name: 'Goroka market soil plot', code: 'SO-GKA-01', types: ['ss'], parent: 'a26', active: false, inUse: 4, open: 0, siteType: 'Soil/sediment', subtype: 'Market ground', zone: 'Urban market' },
  { id: 's5', name: 'Waigani air monitor', code: 'AM-NCD-01', types: ['ss'], parent: 'a14', active: true, inUse: 20, open: 0, siteType: 'Air monitoring', subtype: 'PM2.5 station', zone: 'Urban roadside', lat: '-9.4270', lng: '147.1800' },
  { id: 's6', name: 'Nine Mile community water tank', code: 'WS-NCD-04', types: ['ss'], parent: 'a13', active: true, inUse: 31, open: 1, siteType: 'Water source', subtype: 'Storage tank', zone: 'Urban settlement', contact: 'Ward councillor', lat: '-9.3990', lng: '147.2270' },
];
const SITE_TYPES = ['Water source', 'Air monitoring', 'Vector trap', 'Soil/sediment', 'Other'];
const CATEGORIES = ['National referral hospital', 'Provincial hospital', 'District hospital', 'Health centre', 'Urban clinic', 'Aid post', 'Laboratory'];
const OWNERSHIP = ['Government', 'Church', 'Private', 'NGO', 'Other'];
const SERVICE_TYPES = ['Inpatient', 'Outpatient', 'Intensive care', 'Emergency', 'Maternity', 'Laboratory', 'Other'];
const labelSuggestions = data => [...new Set(['Code', 'CLIA', ...data.flatMap(r => (r.ids || []).map(i => i.label))].filter(Boolean))];
const REF_STATUSES = ['Approved', 'Under evaluation', 'Suspended', 'Not approved'];
const TODAY = '2026-09-27';
const refOverdue = r => r.ref && r.ref.next && r.ref.next < TODAY;
const refExpired = r => r.ref && r.ref.expiry && r.ref.expiry < TODAY;
// Seeded history (the live preview adds to it as you change things)
const SEED_HISTORY = {
  f1: [{ when: '2026-09-03 09:12', who: 'admin.ndoh', action: 'Edited', changes: [['Phone', '+675 325 6200', '+675 324 8200']] }],
  f3: [{ when: '2026-05-02 14:20', who: 'admin.ndoh', action: 'Edited', changes: [['Location', 'Moresby North-East', 'Moresby North-West']] }],
  f6: [{ when: '2025-08-30 11:05', who: 'q.manager', action: 'Referral review', changes: [['Last review date', '2024-08-28', '2025-08-30'], ['Next review due', '2025-08-28', '2026-08-30']] }],
  f7: [{ when: '2026-09-15 02:00', who: 'Registry sync', action: 'Updated from registry', changes: [['Name', 'Mt Hagen General Hospital', 'Mount Hagen Provincial Hospital']] }],
  f8: [{ when: '2025-11-20 10:31', who: 'admin.ndoh', action: 'Renamed', changes: [['Name', 'Nine Mile Clinic', '9 Mile Urban Clinic']] }],
};
const createdEntry = r => ({ when: '2026-08-19 15:40', who: 'Import run #12', action: 'Created', changes: [], note: 'organizations-png-2026-08.csv' });

const PREVIEW_ROWS = [
  { line: 2, outcome: 'updated', type: 'referring clinic', code: 'PMGH', name: 'Port Moresby General Hospital', match: 'code', target: 'f1', diffs: [['Phone', '+675 324 8200', '+675 324 8248'], ['Contact name', 'Dr. Anna Kila', 'Dr. Joseph Tamu']] },
  { line: 3, outcome: 'unchanged', type: 'dept', code: 'PMGH-OPD', name: 'Outpatient Department', match: 'code', target: 'u1' },
  { line: 4, outcome: 'new', type: 'dept', code: 'PMGH-EYE', name: 'Eye Clinic', parent: 'PMGH' },
  { line: 5, outcome: 'updated', type: 'referring clinic', code: 'ANGAU', name: 'Angau Memorial General Hospital', match: 'code', target: 'f2', diffs: [['GPS latitude', '-6.7224', '-6.72238'], ['Contact name', 'Peter Sine', 'Dr. Lucy Aisi']] },
  { line: 6, outcome: 'new', type: 'referring clinic', code: 'LAE-BHC', name: 'Butibam Health Centre', parent: 'Lae Urban (LLG)' },
  { line: 7, outcome: 'updated', type: 'referring clinic', code: 'GGH', name: 'Gerehu General Hospital', match: 'name', target: 'f4', diffs: [['Code', '(none)', 'GGH']] },
  { line: 8, outcome: 'reactivated', type: 'referring clinic', code: 'NCD-KKC', name: 'Kilakila Clinic', match: 'code', target: 'f5' },
  { line: 9, outcome: 'decision', type: 'dept', code: '', name: 'Outpatient Department', parent: 'GGH', candidates: ['c1', 'c2'] },
  { line: 10, outcome: 'rejected', type: 'dept', code: 'HAG-99-LAB', name: 'Laboratory', reason: 'Parent HAG-99 not found (parentCode)' },
  { line: 11, outcome: 'decision', type: 'referring clinic', code: '', name: '9 Mile Urban Clinic', candidates: ['f8', 'c3'] },
  { line: 12, outcome: 'rejected', type: 'referring clinic', code: 'NCD-BAD', name: 'Badili Clinic', reason: 'GPS latitude "9,47" is not decimal degrees' },
  { line: 13, outcome: 'rename', type: 'referring clinic', code: '', name: 'Tokarara Urban Clinic', parent: 'Moresby North-West', pair: 'f3' },
  { line: 14, outcome: 'updated', type: 'referring clinic', code: 'MHPH', name: 'Mount Hagen Provincial Hospital', match: 'code', target: 'f7', registry: true, diffs: [['Name', 'Mount Hagen Provincial Hospital', 'Mt Hagen Provincial Hospital'], ['Phone', '(none)', '+675 542 1311']] },
];
const CANDIDATES = {
  c1: { name: 'Outpatient Department', code: '', parent: 'Gerehu General Hospital', active: true, inUse: 1402 },
  c2: { name: 'Outpatient department', code: 'GGH-OPD-OLD', parent: 'Gerehu General Hospital', active: false, inUse: 96 },
  f8: { name: '9 Mile Urban Clinic', code: 'NCD-9MC', parent: 'Moresby North-East', active: true, inUse: 1377 },
  c3: { name: '9 Mile  Urban Clinic', code: '', parent: 'Moresby North-East', active: true, inUse: 26 },
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
const kindOf = (r) => typeById[r.types[0]].kind;
const pathIds = (byId, id) => { const p = []; let c = byId[id]; while (c) { p.unshift(c.id); c = byId[c.parent]; } return p; };
const pathText = (byId, id) => pathIds(byId, id).map((x) => byId[x].name).join(' / ');
const areaOptions = (data, byId) => data.filter((r) => kindOf(r) === 'area' && r.active)
  .map((r) => ({ id: r.id, text: r.name, sub: `${typeById[r.types[0]].label} · ${pathText(byId, r.parent) || t('label.locations.area.topLevel', 'top level')}` }));

const INACTIVE_HELP = t('help.locations.status.inactive', 'Inactive records are hidden from order entry and other pickers. They still appear on existing orders and reports.');
const REG_HELP = t('help.locations.registry', 'Comes from the facility registry. The registry is the source of truth for this record.');

function ActiveToggle({ record, onChange }) {
  return (
    <Toggle
      id={`active-${record.id}`}
      size="sm"
      labelA={t('label.locations.status.inactive', 'Inactive')}
      labelB={t('label.locations.status.active', 'Active')}
      aria-label={`${t('label.locations.column.active', 'Active')}, ${record.name}`}
      toggled={record.active}
      onToggle={(on) => onChange(on)}
    />
  );
}

function LocationCell({ byId, id }) {
  if (!id) return <span className="cds--label">{t('label.locations.location.notSet', 'not set')}</span>;
  const ids = pathIds(byId, id);
  const last = byId[ids[ids.length - 1]];
  return (
    <div title={pathText(byId, id)}>
      <div><strong>{last.name}</strong> <span className="cds--label">· {typeById[last.types[0]].label}</span></div>
      {ids.length > 1 && <div className="cds--label">{ids.slice(0, -1).map((x) => byId[x].name).join(' / ')}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page explainers (FR-B0)
// ---------------------------------------------------------------------------
const INTRO = {
  facilities: t('help.locations.page.organizations', 'Organizations are the health facilities and laboratories your lab works with: the hospitals, clinics and health centres that send you patient samples, and the laboratories you refer samples to. Wards and departments inside an organization are listed under it. Organizations appear in order entry as the requesting site and in referrals as the destination lab.'),
  sites: t('help.locations.page.sites', 'Sampling sites are fixed places in the environment where samples are collected that do not come from a patient: a water source, a mosquito trap, an air monitor, a soil plot. A site does not order tests. It records where a sample was taken, so results can be compared over time at the same spot. Each site sits in a geographic area and can have its own GPS point and contact person.'),
  areas: t('help.locations.page.areas', 'Geographic areas are the administrative divisions of the country, for example Region, Province, District and LLG. They are used for patient addresses and to say where each organization and sampling site is. Most deployments load them once from the national list, then add or correct areas here. To add an area inside another one, use the + button on the parent row: "+ District" on Morobe Province adds a district in Morobe. Use "+ Add Region" at the top for a new top-level area.'),
  import: t('help.locations.page.import', 'Load or update organizations, wards / depts, sampling sites and geographic areas from CSV files, in the same format the system uses at installation. Nothing is saved until you review the preview and apply it.'),
};

function PageIntro({ view, go }) {
  const compare = view === 'facilities' || view === 'sites';
  return (
    <Stack gap={3} style={{ maxWidth: '60rem', marginBottom: '1rem' }}>
      <p className="cds--body-compact-01">{INTRO[view]}</p>
      {compare && (
        <Accordion size="sm">
          <AccordionItem title={t('label.locations.page.compare', 'Organization or sampling site: which do I need?')}>
            <Grid condensed>
              <Column lg={8} md={4} sm={4}>
                <h6>{t('label.locations.page.compare.orgTitle', 'Add an organization when...')}</h6>
                <p>{t('help.locations.page.compare.org', 'Add an organization when samples come from people seen there, when it orders tests or receives reports or referred samples, or when it has wards or departments that request tests.')}</p>
                <p className="cds--label">{t('label.locations.page.compare.orgExamples', 'Examples: Port Moresby General Hospital, 9 Mile Urban Clinic, Central Public Health Laboratory')}</p>
              </Column>
              <Column lg={8} md={4} sm={4}>
                <h6>{t('label.locations.page.compare.siteTitle', 'Add a sampling site when...')}</h6>
                <p>{t('help.locations.page.compare.site', 'Add a sampling site when samples come from the environment (water, soil, air or insects), when you collect at the same fixed spot again and again, or when you want results for that spot over time, on a map.')}</p>
                <p className="cds--label">{t('label.locations.page.compare.siteExamples', 'Examples: Bumbu Settlement light trap, Laloki River intake, Waigani air monitor')}</p>
              </Column>
            </Grid>
            <p className="cds--label">{t('help.locations.page.compare.tip', 'A water tank at a hospital is still a sampling site: the hospital is an organization, and the tank is a site placed in the same area.')}{' '}
              <Link href="#" onClick={(e) => { e.preventDefault(); go(view === 'facilities' ? 'sites' : 'facilities'); }}>
                {view === 'facilities' ? t('sidenav.label.admin.locations.sites', 'Sampling Sites') : t('sidenav.label.admin.locations.organizations', 'Organizations')}
              </Link></p>
          </AccordionItem>
        </Accordion>
      )}
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// App shell: SideNav submenus (D-003), breadcrumb (D-013), undo notification (FR-E4)
// ---------------------------------------------------------------------------
const VIEWS = {
  facilities: { label: t('sidenav.label.admin.locations.organizations', 'Organizations'), route: '/MasterListsPage/locations', kinds: ['facility'] },
  sites: { label: t('sidenav.label.admin.locations.sites', 'Sampling Sites'), route: '/MasterListsPage/locations/sites', kinds: ['site'] },
  areas: { label: t('sidenav.label.admin.locations.areas', 'Geographic Areas'), route: '/MasterListsPage/locations/areas', kinds: ['area'] },
  import: { label: t('sidenav.label.admin.locations.import', 'Import / Export'), route: '/MasterListsPage/locations/import' },
};

export default function LocationsAndOrganizations() {
  const [view, setView] = useState('facilities');
  const [data, setData] = useState(INITIAL);
  const [toast, setToast] = useState(null);
  const [importArea, setImportArea] = useState(null);
  const [log, setLog] = useState([]);
  const byId = useMemo(() => Object.fromEntries(data.map((r) => [r.id, r])), [data]);

  const notify = useCallback((subtitle, kind = 'success', action = null) => setToast({ subtitle, kind, action, key: Date.now() }), []);
  const audit = useCallback((ids, action, changes = []) => {
    const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setLog((l) => [...[].concat(ids).map((id) => ({ id, when, who: 'current user', action, changes })), ...l]);
  }, []);
  const historyOf = (id) => [...log.filter((e) => e.id === id), ...(SEED_HISTORY[id] || []), createdEntry(byId[id])];
  const go = (v, area) => { setView(v); if (area) setImportArea(area); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SideNav aria-label={t('sidenav.label.admin', 'Admin')} expanded isFixedNav isChildOfHeader={false}>
        <SideNavItems>
          <SideNavMenu title={t('sidenav.label.admin.locations', 'Locations & Organizations')} defaultExpanded>
            {Object.entries(VIEWS).map(([k, v]) => (
              <SideNavMenuItem key={k} href="#" isActive={view === k} onClick={(e) => { e.preventDefault(); setView(k); }}>{v.label}</SideNavMenuItem>
            ))}
          </SideNavMenu>
        </SideNavItems>
      </SideNav>
      <main style={{ flex: 1, padding: '1rem 2rem 3rem', minWidth: 0 }}>
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="/">{t('home.label', 'Home')}</BreadcrumbItem>
          <BreadcrumbItem href="/MasterListsPage">{t('breadcrums.admin.managment', 'Admin Management')}</BreadcrumbItem>
          <BreadcrumbItem href="/MasterListsPage/locations">{t('sidenav.label.admin.locations', 'Locations & Organizations')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{VIEWS[view].label}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="cds--type-productive-heading-05" style={{ margin: '.5rem 0' }}>{VIEWS[view].label}</h1>
        <PageIntro view={view} go={go} />
        {toast && (toast.action ? (
          <ActionableNotification key={toast.key} kind={toast.kind} lowContrast inline hideCloseButton={false} title="" subtitle={toast.subtitle}
            actionButtonLabel={toast.action.label} onActionButtonClick={() => { toast.action.fn(); setToast(null); }} onClose={() => setToast(null)}
            role="status" timeout={10000} style={{ maxWidth: '100%', marginBottom: '1rem' }} />
        ) : (
          <InlineNotification key={toast.key} kind={toast.kind} lowContrast title="" subtitle={toast.subtitle} onClose={() => setToast(null)} timeout={5000} style={{ maxWidth: '100%', marginBottom: '1rem' }} />
        ))}
        {view === 'import' && <ImportPage data={data} setData={setData} byId={byId} notify={notify} presetArea={importArea} audit={audit} />}
        {view === 'areas' && <AreasTree data={data} setData={setData} byId={byId} notify={notify} audit={audit} historyOf={historyOf} />}
        {(view === 'facilities' || view === 'sites') && <ListView key={view} view={view} data={data} setData={setData} byId={byId} notify={notify} go={go} audit={audit} historyOf={historyOf} />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organizations / Sampling Sites list (sections B, C, D, E)
// ---------------------------------------------------------------------------
function ListView({ view, data, setData, byId, notify, go, audit, historyOf }) {
  const cfg = VIEWS[view];
  const [q, setQ] = useState('');
  const [types, setTypes] = useState([]);
  const [cats, setCats] = useState([]);
  const [owns, setOwns] = useState([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [status, setStatus] = useState('active');
  const [locFilter, setLocFilter] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [expanded, setExpanded] = useState(null);
  const [adding, setAdding] = useState(false);
  const [sel, setSel] = useState([]);
  const [guard, setGuard] = useState(null);

  const ql = q.trim().toLowerCase();
  const has = (v) => v && v.toLowerCase().includes(ql);
  const matchNote = (r) => {
    if (!ql || has(r.name) || has(r.code) || has(r.shortName)) return null;
    const id = (r.ids || []).find((i) => has(i.value)); if (id) return `${id.label} ${id.value}`;
    const fn = (r.formerNames || []).find(has); if (fn) return t('label.locations.history.formerly', `Formerly ${fn}`);
    return null;
  };
  const matches = (r) => !ql || has(r.name) || has(r.code) || has(r.shortName) || !!matchNote(r);
  const statusOk = (r) => status === 'all' || (status === 'active' ? r.active : !r.active);
  const unitsOf = (id) => data.filter((r) => r.parent === id && kindOf(r) === 'unit');
  const childrenOf = (id) => data.filter((r) => r.parent === id);

  // FR-B6: a ward search opens its organization
  useEffect(() => {
    if (view !== 'facilities' || !ql) return;
    const w = data.find((r) => kindOf(r) === 'unit' && (has(r.name) || has(r.code)));
    const direct = data.some((r) => kindOf(r) === 'facility' && (has(r.name) || has(r.code)));
    if (w && !direct) setExpanded(w.parent);
  }, [q]);

  const rows = data.filter((r) => {
    if (!cfg.kinds.includes(kindOf(r))) return false;
    if (types.length && !r.types.some((x) => types.includes(x))) return false;
    if (cats.length && !cats.includes(r.cat)) return false;
    if (owns.length && !owns.includes(r.own)) return false;
    if (overdueOnly && !(refOverdue(r) || refExpired(r))) return false;
    if (!statusOk(r)) return false;
    if (locFilter && !pathIds(byId, r.parent).includes(locFilter)) return false;
    return view === 'facilities' && ql ? matches(r) || unitsOf(r.id).some(matches) : matches(r);
  });
  const exact = (r) => (ql && ((r.code || '').toLowerCase() === ql || (r.ids || []).some((i) => i.value.toLowerCase() === ql)) ? 1 : 0);
  rows.sort((a, b) => exact(b) - exact(a) || (sortBy === 'location' ? pathText(byId, a.parent).localeCompare(pathText(byId, b.parent)) : 0) || a.name.localeCompare(b.name));

  const setActive = (ids, on) => setData((d) => d.map((r) => (ids.includes(r.id) ? { ...r, active: on } : r)));
  const deactivateWithUndo = (ids, label) => {
    setActive(ids, false); audit(ids, 'Deactivated', [['Active', 'Yes', 'No']]);
    notify(t('message.locations.undo.deactivated', `${label} deactivated.`), 'success', { label: t('button.locations.undo', 'Undo'), fn: () => { setActive(ids, true); audit(ids, 'Reactivated (undo)', [['Active', 'No', 'Yes']]); } });
  };
  const askDeactivate = (r) => {
    const kids = childrenOf(r.id).filter((c) => c.active);
    if ((r.open || 0) > 0 || kids.length) setGuard({ r, kids }); else deactivateWithUndo([r.id], r.name);
  };
  const reactivate = (r) => {
    const p = byId[r.parent];
    if (p && !p.active) return notify(t('error.locations.reactivate.parentInactive', `Reactivate ${p.name} first.`), 'error');
    setActive([r.id], true); audit(r.id, 'Reactivated', [['Active', 'No', 'Yes']]); notify(`${r.name} ${t('message.locations.reactivated', 'reactivated.')}`);
    return null;
  };
  const kidLabel = (r) => (kindOf(r) === 'facility' ? t('label.locations.kind.wards', 'wards / depts') : t('label.locations.kind.records', 'records'));
  const typeItems = TYPES.filter((x) => cfg.kinds.includes(x.kind)).map((x) => ({ id: x.id, text: x.label }));
  const headers = [
    t('label.locations.column.name', 'Name'), t('label.locations.column.code', 'Code'), t('label.locations.column.type', 'Type'),
    t('label.locations.column.location', 'Location'), view === 'sites' ? t('label.locations.column.siteType', 'Site type') : t('label.locations.column.wards', 'Wards / Depts'),
    t('label.locations.column.inUse', 'In use'), t('label.locations.column.active', 'Active'), t('label.locations.column.actions', 'Actions'),
  ];

  return (
    <div>
      <TableContainer>
        <TableToolbar aria-label={t('label.locations.toolbar', 'Filters')}>
          <TableToolbarContent style={{ flexWrap: 'wrap', gap: '.5rem', alignItems: 'flex-end', padding: '.5rem 1rem' }}>
            <TableToolbarSearch persistent value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('placeholder.locations.search', 'Search by name, code or any identifier')} />
            <FilterableMultiSelect id={`type-${view}`} titleText={t('label.locations.filter.type', 'Type')} placeholder={t('label.locations.filter.type.all', 'All types')} items={typeItems} itemToString={(i) => (i ? i.text : '')}
              selectedItems={typeItems.filter((i) => types.includes(i.id))} onChange={({ selectedItems }) => setTypes(selectedItems.map((i) => i.id))} />
            <ComboBox id={`loc-${view}`} titleText={t('label.locations.filter.location', 'Location (includes areas beneath)')} placeholder={t('label.locations.filter.location.any', 'Any area')}
              items={areaOptions(data, byId)} itemToString={(i) => (i ? i.text : '')} selectedItem={areaOptions(data, byId).find((o) => o.id === locFilter) || null}
              onChange={({ selectedItem }) => setLocFilter(selectedItem ? selectedItem.id : null)} />
            {view === 'facilities' && (<>
              <FilterableMultiSelect id="cat" titleText={t('label.locations.field.category', 'Category')} placeholder={t('label.locations.filter.category.all', 'All categories')} items={CATEGORIES.map((c) => ({ id: c, text: c }))} itemToString={(i) => (i ? i.text : '')}
                onChange={({ selectedItems }) => setCats(selectedItems.map((i) => i.id))} />
              <FilterableMultiSelect id="own" titleText={t('label.locations.field.ownership', 'Ownership')} placeholder={t('label.locations.filter.ownership.all', 'All ownership')} items={OWNERSHIP.map((c) => ({ id: c, text: c }))} itemToString={(i) => (i ? i.text : '')}
                onChange={({ selectedItems }) => setOwns(selectedItems.map((i) => i.id))} />
            </>)}
            <Select id={`status-${view}`} labelText={t('label.locations.filter.status', 'Status')} value={status} onChange={(e) => setStatus(e.target.value)} helperText={status !== 'active' ? INACTIVE_HELP : undefined}>
              <SelectItem value="active" text={t('label.locations.status.active', 'Active')} />
              <SelectItem value="inactive" text={t('label.locations.status.inactive', 'Inactive')} />
              <SelectItem value="all" text={t('label.locations.status.all', 'All')} />
            </Select>
            {view === 'facilities' && <Checkbox id="overdue" labelText={t('label.locations.filter.reviewOverdue', 'Referral labs overdue for review or with expired accreditation only')} checked={overdueOnly} onChange={(_, { checked }) => setOverdueOnly(checked)} />}
            <Button kind="tertiary" size="md" onClick={() => go('import', 'organizations')}>{t('button.locations.import', 'Import')}</Button>
            <Button kind="tertiary" size="md" renderIcon={Download} onClick={() => notify(t('message.locations.export.done', `Exported ${rows.length} records in the import format.`), 'info')}>{t('button.locations.export', 'Export')}</Button>
            <Button size="md" renderIcon={Add} onClick={() => { setAdding(true); setExpanded(null); }}>{t('button.locations.add', 'Add')}</Button>
          </TableToolbarContent>
        </TableToolbar>
        {/* Selected filters always show their labels, never a bare count */}
        {(types.length || cats.length || owns.length || overdueOnly || locFilter || status !== 'active') ? (
          <div style={{ padding: '.5rem 1rem' }}>
            {types.map((id) => <Tag key={id} type="high-contrast" filter onClose={() => setTypes(types.filter((x) => x !== id))}>{typeById[id].label}</Tag>)}
            {cats.map((c) => <Tag key={c} type="high-contrast" filter onClose={() => setCats(cats.filter((x) => x !== c))}>{c}</Tag>)}
            {owns.map((c) => <Tag key={c} type="high-contrast" filter onClose={() => setOwns(owns.filter((x) => x !== c))}>{c}</Tag>)}
            {overdueOnly && <Tag type="high-contrast" filter onClose={() => setOverdueOnly(false)}>{t('label.locations.referral.overdue', 'Review overdue')}</Tag>}
            {locFilter && <Tag type="high-contrast" filter onClose={() => setLocFilter(null)}>{pathText(byId, locFilter)}</Tag>}
            <Button kind="ghost" size="sm" onClick={() => { setTypes([]); setCats([]); setOwns([]); setOverdueOnly(false); setLocFilter(null); setStatus('active'); setQ(''); }}>{t('label.locations.filter.clear', 'Clear filters')}</Button>
          </div>
        ) : null}
        {sel.length > 0 && (
          <TableBatchActions shouldShowBatchActions totalSelected={sel.length} onCancel={() => setSel([])}>
            <TableBatchAction renderIcon={Misuse} onClick={() => { deactivateWithUndo([...sel], `${sel.length} ${t('label.locations.kind.records', 'records')}`); setSel([]); }}>{t('button.locations.deactivate', 'Deactivate')}</TableBatchAction>
            <TableBatchAction renderIcon={CheckmarkOutline} onClick={() => { setActive(sel, true); audit(sel, 'Reactivated'); setSel([]); }}>{t('button.locations.reactivate', 'Reactivate')}</TableBatchAction>
            <TableBatchAction renderIcon={Download} onClick={() => setSel([])}>{t('button.locations.exportSelected', 'Export selected')}</TableBatchAction>
          </TableBatchActions>
        )}
        <Table size="md" aria-label={cfg.label}>
          <TableHead>
            <TableRow>
              <TableSelectAll id={`all-${view}`} name="all" ariaLabel={t('label.locations.selectAll', 'Select all rows')} checked={rows.length > 0 && sel.length === rows.length} onSelect={() => setSel(sel.length === rows.length ? [] : rows.map((r) => r.id))} />
              {headers.map((h, i) => (i === 3
                ? <TableHeader key={h} isSortable isSortHeader={sortBy === 'location'} sortDirection={sortBy === 'location' ? 'ASC' : 'NONE'} onClick={() => setSortBy(sortBy === 'location' ? 'name' : 'location')}>{h}</TableHeader>
                : <TableHeader key={h}>{h}</TableHeader>))}
            </TableRow>
          </TableHead>
          <TableBody>
            {adding && (
              <TableRow><TableCell colSpan={9} style={{ padding: 0 }}>
                <RecordForm isNew kind={view === 'sites' ? 'site' : 'facility'} data={data} byId={byId} notify={notify} audit={audit}
                  onCancel={() => setAdding(false)}
                  onSave={(rec) => { const id = `n${Date.now()}`; setData((d) => [{ ...rec, id, inUse: 0, open: 0 }, ...d]); audit(id, 'Created'); setAdding(false); setExpanded(id); notify(`${rec.name} ${t('message.locations.added', 'added.')}`); }} />
              </TableCell></TableRow>
            )}
            {rows.map((r) => {
              const isExp = expanded === r.id;
              const note = matchNote(r);
              return (
                <React.Fragment key={r.id}>
                  <TableRow>
                    <TableSelectRow id={`sel-${r.id}`} name={`sel-${r.id}`} ariaLabel={`${t('label.locations.select', 'Select')} ${r.name}`} checked={sel.includes(r.id)} onSelect={() => setSel(sel.includes(r.id) ? sel.filter((x) => x !== r.id) : [...sel, r.id])} />
                    <TableCell>
                      {r.name}{' '}
                      {r.registry && <Tag type="cyan" size="sm" title={REG_HELP}>{t('label.locations.source.registry', 'Registry')}</Tag>}
                      {refOverdue(r) && <Tag type="red" size="sm">{t('label.locations.referral.overdue', 'Review overdue')}</Tag>}
                      {refExpired(r) && <Tag type="warm-gray" size="sm">{t('label.locations.referral.expired', 'Accreditation expired')}</Tag>}
                      {note && <div className="cds--label">{note}</div>}
                    </TableCell>
                    <TableCell><code>{r.code || t('label.locations.none', 'none')}</code></TableCell>
                    <TableCell>{r.types.map((x) => <Tag key={x} type={typeById[x].kind === 'site' ? 'teal' : 'blue'} size="sm">{typeById[x].label}</Tag>)}{r.cat && <div className="cds--label">{r.cat}{r.own ? ` · ${r.own}` : ''}</div>}</TableCell>
                    <TableCell><LocationCell byId={byId} id={r.parent} /></TableCell>
                    <TableCell>{view === 'sites' ? r.siteType : unitsOf(r.id).filter((u) => u.active).length}</TableCell>
                    <TableCell>{(r.inUse || 0).toLocaleString()} <span className="cds--label">({r.open || 0} {t('label.locations.open', 'open')})</span></TableCell>
                    <TableCell title={r.active ? '' : INACTIVE_HELP}><ActiveToggle record={r} onChange={(on) => (on ? reactivate(r) : askDeactivate(r))} /></TableCell>
                    <TableCell>
                      <Button kind="ghost" size="sm" aria-expanded={isExp} aria-label={`${isExp ? t('button.close', 'Close') : t('button.edit', 'Edit')} ${r.name}`} onClick={() => { setExpanded(isExp ? null : r.id); setAdding(false); }}>
                        {isExp ? t('button.close', 'Close') : t('button.edit', 'Edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExp && (
                    <TableRow><TableCell colSpan={9} style={{ padding: 0 }}>
                      <RecordForm rec={r} kind={kindOf(r)} data={data} byId={byId} highlight={ql} statusFilter={status} history={historyOf(r.id)} notify={notify} audit={audit}
                        onCancel={() => setExpanded(null)}
                        onSave={(rec, changes) => { setData((d) => d.map((x) => (x.id === r.id ? { ...x, ...rec } : x))); if (changes.length) audit(r.id, 'Edited', changes); setExpanded(null); notify(`${rec.name} ${t('message.locations.saved', 'saved.')}`); }}
                        onUnits={setData} askDeactivate={askDeactivate} reactivate={reactivate} />
                    </TableCell></TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
        {rows.length === 0 && !adding && (
          <Tile style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p>{data.some((r) => cfg.kinds.includes(kindOf(r))) ? t('message.locations.empty.filtered', 'No records match these filters.') : t('message.locations.empty.none', 'No records yet. Add one, or import a file.')}</p>
            {/* FR-B8: point to matches in the other views */}
            {ql && Object.entries(VIEWS).filter(([k, v]) => k !== view && v.kinds).map(([k, v]) => {
              const n = data.filter((r) => v.kinds.includes(kindOf(r)) && matches(r)).length;
              return n ? <p key={k}><Link href="#" onClick={(e) => { e.preventDefault(); go(k); }}>{t('message.locations.search.elsewhere', `${n} matches in ${v.label}`)}</Link></p> : null;
            })}
          </Tile>
        )}
        <Pagination page={1} pageSize={25} pageSizes={[25, 50, 100]} totalItems={rows.length} />
      </TableContainer>

      {/* FR-E2: deactivation guard (destructive confirm, permitted modal) */}
      <Modal open={!!guard} danger modalHeading={guard ? `${t('button.locations.deactivate', 'Deactivate')} ${guard.r.name}?` : ''}
        primaryButtonText={guard ? t('button.locations.deactivate.only', `Deactivate ${guard.r.name} only`) : ''} secondaryButtonText={t('button.cancel', 'Cancel')}
        onRequestClose={() => setGuard(null)} onRequestSubmit={() => { deactivateWithUndo([guard.r.id], guard.r.name); setGuard(null); }}>
        {guard && (<Stack gap={4}>
          <p>{t('message.locations.deactivate.inUse', `${guard.r.name} has ${guard.r.open || 0} open orders and ${guard.kids.length} active ${kidLabel(guard.r)}.`)}</p>
          {guard.kids.length > 0 && <UnorderedList>{guard.kids.map((c) => <ListItem key={c.id}>{c.name} ({c.open || 0} {t('label.locations.openOrders', 'open orders')})</ListItem>)}</UnorderedList>}
          {guard.r.registry && <InlineNotification kind="warning" lowContrast hideCloseButton title="" subtitle={t('warning.locations.registry.deactivate', 'This record comes from the facility registry. The next sync may reactivate it; to close it for good, update the registry.')} />}
          <p className="cds--label">{INACTIVE_HELP}</p>
          {guard.kids.length > 0 && <Button kind="danger--tertiary" onClick={() => { deactivateWithUndo([guard.r.id, ...guard.kids.map((c) => c.id)], `${guard.r.name} + ${guard.kids.length}`); setGuard(null); }}>
            {t('button.locations.deactivate.withChildren', `Deactivate ${guard.r.name} and its ${guard.kids.length} ${kidLabel(guard.r)}`)}</Button>}
        </Stack>)}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// History timeline (section K)
// ---------------------------------------------------------------------------
function HistoryPanel({ name, entries }) {
  const [f, setF] = useState('all');
  const actions = [...new Set(entries.map((e) => e.action))];
  const shown = f === 'all' ? entries : entries.filter((e) => e.action === f);
  return (
    <Tile style={{ marginTop: '1rem' }}>
      <Stack orientation="horizontal" gap={5}>
        <h5>{t('label.locations.history.title', `History of ${name}`)}</h5>
        <Select id="hist-filter" size="sm" labelText="" hideLabel value={f} onChange={(e) => setF(e.target.value)}>
          <SelectItem value="all" text={t('label.locations.history.allChanges', 'All changes')} />
          {actions.map((a) => <SelectItem key={a} value={a} text={a} />)}
        </Select>
        <span className="cds--label">{t('help.locations.history.readOnly', 'Read-only. Kept for as long as the record exists.')}</span>
      </Stack>
      <StructuredListWrapper isCondensed>
        <StructuredListBody>
          {shown.map((e, i) => (
            <StructuredListRow key={i}>
              <StructuredListCell noWrap><strong>{e.action}</strong><div className="cds--label">{e.when} · {e.who}{e.note ? ` · ${e.note}` : ''}</div></StructuredListCell>
              <StructuredListCell>{(e.changes || []).map((c, j) => <div key={j}>{c[0]}: <s>{c[1] || '(empty)'}</s> → <strong>{c[2] || '(empty)'}</strong></div>)}</StructuredListCell>
            </StructuredListRow>
          ))}
        </StructuredListBody>
      </StructuredListWrapper>
    </Tile>
  );
}

// ---------------------------------------------------------------------------
// Record form (inline expansion, D-005). Sections per kind (FR-C3).
// ---------------------------------------------------------------------------
const FIELD_LABELS = { name: 'Name', code: 'Code', shortName: 'Short name', desc: 'Description', parent: 'Location', street: 'Street address', city: 'City', state: 'State / Province', lat: 'GPS latitude', lng: 'GPS longitude', contact: 'Contact name', phone: 'Phone', email: 'Email', web: 'Website', cat: 'Category', own: 'Ownership', siteType: 'Site type', subtype: 'Subtype', zone: 'Environmental zone' };
function diffRecord(a, b, byId) {
  const out = [];
  Object.keys(FIELD_LABELS).forEach((k) => { if ((a[k] || '') !== (b[k] || '')) out.push([FIELD_LABELS[k], k === 'parent' ? (a[k] ? byId[a[k]].name : '') : a[k], k === 'parent' ? (b[k] ? byId[b[k]].name : '') : b[k]]); });
  if (JSON.stringify(a.ids || []) !== JSON.stringify(b.ids || [])) out.push(['Identifiers', (a.ids || []).map((i) => `${i.label} ${i.value}`).join(', '), (b.ids || []).map((i) => `${i.label} ${i.value}`).join(', ')]);
  if (JSON.stringify(a.ref || {}) !== JSON.stringify(b.ref || {})) out.push(['Referral laboratory', '', 'updated']);
  return out;
}

function RecordForm({ rec, isNew, kind, areaLevel, data, byId, onCancel, onSave, onUnits, notify, audit, highlight, statusFilter, askDeactivate, reactivate, history }) {
  const [f, setF] = useState(rec ? { ...rec, ids: [...(rec.ids || [])], ref: rec.ref ? { ...rec.ref } : undefined }
    : { name: '', code: '', ids: [], types: kind === 'site' ? ['ss'] : kind === 'area' ? [`L${areaLevel}`] : ['rc'], parent: null, active: true });
  const [tried, setTried] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e && e.target ? e.target.value : e });
  const setRef = (k) => (e) => setF({ ...f, ref: { ...(f.ref || {}), [k]: e.target.value } });
  const lvl = kind === 'area' ? typeById[f.types[0]].level : null;
  const parentItems = kind === 'area'
    ? areaOptions(data, byId).filter((o) => typeById[byId[o.id].types[0]].level === lvl - 1)
    : areaOptions(data, byId);

  // Identifiers (section I): reporting code is f.code / f.codeLabel; others in f.ids
  const allIds = [{ label: f.codeLabel || 'Code', value: f.code || '', reporting: true }, ...(f.ids || []).map((i) => ({ ...i, reporting: false }))];
  const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();
  const idClash = (i) => i.value && data.find((r) => r.id !== f.id && kindOf(r) === kind && ((same(i.label, r.codeLabel || 'Code') && same(r.code, i.value)) || (r.ids || []).some((x) => same(x.label, i.label) && same(x.value, i.value))));
  const labelItems = labelSuggestions(data);
  const setId = (n, key, v) => (n === 0 ? setF({ ...f, [key === 'label' ? 'codeLabel' : 'code']: v }) : setF({ ...f, ids: f.ids.map((x, j) => (j === n - 1 ? { ...x, [key]: v } : x)) }));

  const badLat = f.lat && (Number.isNaN(+f.lat) || +f.lat < -90 || +f.lat > 90);
  const badLng = f.lng && (Number.isNaN(+f.lng) || +f.lng < -180 || +f.lng > 180);
  const dupName = f.name && data.find((r) => r.id !== f.id && r.active && same(r.name, f.name) && r.types.some((x) => f.types.includes(x)) && r.parent === f.parent);
  const isRef = kind === 'facility' && f.types.includes('rl');
  const errs = {
    name: !f.name.trim() && t('error.locations.name.required', 'Name is required'),
    ids: allIds.some(idClash),
    lat: badLat, lng: badLng,
    parent: kind === 'area' && lvl > 1 && !f.parent && t('error.locations.parent.required', 'Choose the parent area'),
    ref: isRef && !(f.ref && f.ref.status) && t('error.locations.referral.status', 'Choose an approval status'),
  };
  const ok = !Object.values(errs).some(Boolean);
  const save = () => {
    setTried(true); if (!ok) return;
    const out = { ...f, name: f.name.trim() };
    if (rec && rec.name !== out.name) out.formerNames = [...(rec.formerNames || []), rec.name];
    onSave(out, rec ? diffRecord(rec, out, byId) : []);
  };
  const fromRegistry = rec && rec.registry ? ` · ${t('label.locations.registry.field', 'From registry')}` : '';

  // Wards / depts (section D)
  const units = rec && kind === 'facility' ? data.filter((r) => r.parent === rec.id && kindOf(r) === 'unit' && (statusFilter !== 'active' || r.active)) : [];
  const [newUnits, setNewUnits] = useState([]);
  const [editing, setEditing] = useState(null);
  const [wf, setWf] = useState({});
  const [moving, setMoving] = useState(null);
  const orgItems = data.filter((r) => kindOf(r) === 'facility' && r.active && (!rec || r.id !== rec.id)).map((r) => ({ id: r.id, text: r.name }));

  const sections = [['identity', t('label.locations.section.identity', 'Identity')], ...(kind !== 'area' ? [['identifiers', t('label.locations.section.identifiers', 'Identifiers')], ['location', t('label.locations.section.location', 'Location')], ['contact', t('label.locations.section.contact', 'Contact')]] : [['location', t('label.locations.section.location', 'Location')]]),
    ...(isRef ? [['referral', t('label.locations.section.referral', 'Referral laboratory')]] : []), ...(kind === 'site' ? [['site', t('label.locations.section.site', 'Site details')]] : []), ...(kind === 'facility' && !isNew ? [['wards', t('label.locations.section.wards', 'Wards / Depts')]] : [])];
  const sid = (s) => `sec-${(rec && rec.id) || 'new'}-${s}`;

  return (
    <div style={{ padding: '1rem 1.5rem 0 3rem', background: 'var(--cds-layer-01)' }}>
      {rec && rec.registry && <InlineNotification kind="warning" lowContrast hideCloseButton title="" style={{ maxWidth: '100%' }}
        subtitle={t('warning.locations.registry.edit', 'This record comes from the facility registry. Changes to fields the registry supplies (marked "From registry") will be overwritten on the next sync. To change them for good, update the registry. Wards / depts and other local details you add here are kept.')} />}
      {sections.length > 3 && (
        <nav aria-label={t('label.locations.form.jump', 'Jump to')} className="cds--label" style={{ marginBottom: '.75rem' }}>
          {t('label.locations.form.jump', 'Jump to')}: {sections.map(([k, l], i) => <span key={k}>{i > 0 && ' · '}<Link href={`#${sid(k)}`} size="sm">{l}</Link></span>)}
        </nav>
      )}

      <FormGroup legendText={t('label.locations.section.identity', 'Identity')} id={sid('identity')}>
        <Grid condensed>
          <Column lg={8}><TextInput id="name" labelText={`${t('label.locations.column.name', 'Name')} *${fromRegistry}`} value={f.name} onChange={set('name')} invalid={tried && !!errs.name} invalidText={errs.name}
            warn={!!dupName} warnText={dupName ? t('warning.locations.name.duplicate', `Another active record named "${dupName.name}" exists here.`) : ''} /></Column>
          {kind === 'area'
            ? <Column lg={4}><TextInput id="code" labelText={t('label.locations.column.code', 'Code')} value={f.code || ''} onChange={set('code')} /></Column>
            : <Column lg={4}><TextInput id="short" labelText={t('organization.short.CI', 'Short name')} value={f.shortName || ''} onChange={set('shortName')} /></Column>}
          {kind === 'facility' && (<>
            <Column lg={8}>
              <FilterableMultiSelect id="types" titleText={`${t('label.locations.field.types', 'Organization type(s)')} *`} items={TYPES.filter((x) => x.kind === 'facility').map((x) => ({ id: x.id, text: x.label }))} itemToString={(i) => (i ? i.text : '')}
                initialSelectedItems={f.types.map((x) => ({ id: x, text: typeById[x].label }))} onChange={({ selectedItems }) => selectedItems.length && setF({ ...f, types: selectedItems.map((i) => i.id) })} />
            </Column>
            <Column lg={4}><Select id="cat-f" labelText={t('label.locations.field.category', 'Category')} value={f.cat || ''} onChange={set('cat')}><SelectItem value="" text={t('label.choose', 'Choose')} />{CATEGORIES.map((c) => <SelectItem key={c} value={c} text={c} />)}</Select></Column>
            <Column lg={4}><Select id="own-f" labelText={t('label.locations.field.ownership', 'Ownership')} value={f.own || ''} onChange={set('own')}><SelectItem value="" text={t('label.choose', 'Choose')} />{OWNERSHIP.map((c) => <SelectItem key={c} value={c} text={c} />)}</Select></Column>
          </>)}
          {kind !== 'area' && <Column lg={16}><TextInput id="desc" labelText={t('label.locations.field.description', 'Description')} value={f.desc || ''} onChange={set('desc')}
            placeholder={kind === 'site' ? t('help.locations.field.siteDescription', 'Include directions so someone else can find the exact spot') : ''} /></Column>}
        </Grid>
      </FormGroup>

      {kind !== 'area' && (
        <FormGroup legendText={t('label.locations.section.identifiers', 'Identifiers')} id={sid('identifiers')}>
          <Table size="sm" aria-label={t('label.locations.section.identifiers', 'Identifiers')} style={{ maxWidth: '48rem' }}>
            <TableHead><TableRow>
              <TableHeader>{t('label.locations.identifier.label', 'Label')}</TableHeader><TableHeader>{t('label.locations.identifier.value', 'Value')}</TableHeader>
              <TableHeader>{t('label.locations.identifier.reporting', 'Reporting code')}</TableHeader><TableHeader />
            </TableRow></TableHead>
            <TableBody>
              {allIds.map((i, n) => {
                const clash = idClash(i);
                return (
                  <TableRow key={n}>
                    <TableCell>
                      {/* Free text with suggestions (FR-I1): ComboBox allowing custom values */}
                      <ComboBox id={`idl-${n}`} titleText="" aria-label={t('label.locations.identifier.label', 'Label')} allowCustomValue items={labelItems}
                        selectedItem={i.label || null} onChange={({ selectedItem, inputValue }) => setId(n, 'label', selectedItem || inputValue || '')} placeholder="e.g. DHIS2 ID" />
                    </TableCell>
                    <TableCell><TextInput id={`idv-${n}`} labelText="" hideLabel aria-label={`${i.label} ${t('label.locations.identifier.value', 'Value')}`} value={i.value} onChange={(e) => setId(n, 'value', e.target.value)}
                      invalid={!!clash} invalidText={clash ? t('error.locations.identifier.duplicate', `${i.label} ${i.value} is already used by ${clash.name}`) : ''} /></TableCell>
                    <TableCell><RadioButton id={`idr-${n}`} name={`rep-${f.id || 'new'}`} labelText="" hideLabel checked={i.reporting}
                      onChange={() => { const others = allIds.filter((_, j) => j !== n).map((x) => ({ label: x.label, value: x.value })).filter((x) => x.value); setF({ ...f, code: i.value, codeLabel: i.label, ids: others }); }} /></TableCell>
                    <TableCell>{!i.reporting && <Button kind="ghost" size="sm" onClick={() => setF({ ...f, ids: f.ids.filter((_, j) => j !== n - 1) })}>{t('button.remove', 'Remove')}</Button>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setF({ ...f, ids: [...(f.ids || []), { label: '', value: '' }] })}>{t('button.locations.identifier.add', 'Add identifier')}</Button>
          <p className="cds--form__helper-text">{t('help.locations.identifiers', 'Type any label, or pick one already used. The reporting code shows as Code in lists, exports and reports. Every identifier is searchable and used to match import rows.')}</p>
        </FormGroup>
      )}

      <FormGroup legendText={t('label.locations.section.location', 'Location')} id={sid('location')}>
        <Grid condensed>
          <Column lg={8}>
            {/* Existing sampling-site address search stays above this picker (reuse; see FRS FR-C3) */}
            <ComboBox id="parent" titleText={kind === 'area' ? `${t('label.locations.filter.parent', 'Parent area')}${lvl > 1 ? ' *' : ''}` : t('label.locations.field.location', 'Location')}
              items={parentItems} itemToString={(i) => (i ? i.text : '')} selectedItem={parentItems.find((o) => o.id === f.parent) || null}
              onChange={({ selectedItem }) => setF({ ...f, parent: selectedItem ? selectedItem.id : null })} invalid={tried && !!errs.parent} invalidText={errs.parent}
              helperText={kind !== 'area' ? `${f.parent ? `${pathText(byId, f.parent)}. ` : ''}${t('help.locations.field.location', "Pick the most specific area you know. A district is fine if you don't know the LLG.")}` : undefined} />
          </Column>
          {kind !== 'area' && (<>
            <Column lg={8}><TextInput id="street" labelText={`${t('organization.streetAddress', 'Street address')}${fromRegistry}`} value={f.street || ''} onChange={set('street')} /></Column>
            <Column lg={4}><TextInput id="city" labelText={t('organization.city', 'City')} value={f.city || ''} onChange={set('city')} /></Column>
            <Column lg={4}><TextInput id="state" labelText={t('label.locations.field.state', 'State / Province')} value={f.state || ''} onChange={set('state')} /></Column>
            <Column lg={4}><TextInput id="lat" labelText={t('label.locations.field.gpsLatitude', 'GPS latitude')} value={f.lat || ''} onChange={set('lat')} placeholder="-9.4705"
              helperText={t('help.locations.field.gps', 'Decimal degrees, WGS84')} invalid={!!badLat} invalidText={t('error.locations.gps.range', 'Enter decimal degrees: latitude -90 to 90, longitude -180 to 180')} /></Column>
            <Column lg={4}><TextInput id="lng" labelText={t('label.locations.field.gpsLongitude', 'GPS longitude')} value={f.lng || ''} onChange={set('lng')} placeholder="147.1597"
              invalid={!!badLng} invalidText={t('error.locations.gps.range', 'Enter decimal degrees: latitude -90 to 90, longitude -180 to 180')} /></Column>
          </>)}
        </Grid>
      </FormGroup>

      {kind !== 'area' && (
        <FormGroup legendText={t('label.locations.section.contact', 'Contact')} id={sid('contact')}>
          <Grid condensed>
            <Column lg={4}><TextInput id="contact" labelText={t('label.locations.field.contactName', 'Contact name')} value={f.contact || ''} onChange={set('contact')} /></Column>
            <Column lg={4}><TextInput id="phone" labelText={t('label.locations.field.phone', 'Phone')} value={f.phone || ''} onChange={set('phone')} /></Column>
            <Column lg={4}><TextInput id="email" type="email" labelText={t('label.locations.field.email', 'Email')} value={f.email || ''} onChange={set('email')} /></Column>
            <Column lg={4}><TextInput id="web" labelText={t('organization.internetaddress', 'Website')} value={f.web || ''} onChange={set('web')} /></Column>
          </Grid>
        </FormGroup>
      )}

      {isRef && (
        <FormGroup legendText={`${t('label.locations.section.referral', 'Referral laboratory')} · ISO 15189 6.8`} id={sid('referral')}>
          {refOverdue(f) && <InlineNotification kind="error" lowContrast hideCloseButton title="" subtitle={t('message.locations.referral.overdueSince', `Review overdue since ${f.ref.next}. Record the review below, or change the approval status.`)} />}
          <Grid condensed>
            <Column lg={4}><Select id="ref-status" labelText={`${t('label.locations.referral.approval', 'Approval status')} *`} value={(f.ref || {}).status || ''} onChange={setRef('status')} invalid={tried && !!errs.ref} invalidText={errs.ref}>
              <SelectItem value="" text={t('label.choose', 'Choose')} />{REF_STATUSES.map((x) => <SelectItem key={x} value={x} text={x} />)}</Select></Column>
            <Column lg={4}><TextInput id="ref-body" labelText={t('label.locations.referral.accreditationBody', 'Accreditation body')} value={(f.ref || {}).body || ''} onChange={setRef('body')} /></Column>
            <Column lg={4}><TextInput id="ref-num" labelText={t('label.locations.referral.accreditationNumber', 'Accreditation number')} value={(f.ref || {}).num || ''} onChange={setRef('num')} /></Column>
            <Column lg={4}><TextInput id="ref-exp" type="date" labelText={t('label.locations.referral.accreditationExpiry', 'Accreditation expiry')} value={(f.ref || {}).expiry || ''} onChange={setRef('expiry')} /></Column>
            <Column lg={4}><TextInput id="ref-last" type="date" labelText={t('label.locations.referral.lastReview', 'Last review date')} value={(f.ref || {}).last || ''} onChange={setRef('last')} /></Column>
            <Column lg={4}><TextInput id="ref-next" type="date" labelText={t('label.locations.referral.nextReview', 'Next review due')} value={(f.ref || {}).next || ''} onChange={setRef('next')} warn={refOverdue(f)} warnText={t('label.locations.referral.overdue', 'Review overdue')} /></Column>
            <Column lg={8}><TextInput id="ref-notes" labelText={t('label.locations.referral.notes', 'Review notes')} value={(f.ref || {}).notes || ''} onChange={setRef('notes')} /></Column>
          </Grid>
        </FormGroup>
      )}

      {kind === 'site' && (
        <FormGroup legendText={t('label.locations.section.site', 'Site details')} id={sid('site')}>
          <Grid condensed>
            <Column lg={4}><Select id="site-type" labelText={t('vector.admin.samplingSite.type', 'Site type')} value={f.siteType || ''} onChange={set('siteType')}><SelectItem value="" text={t('label.choose', 'Choose')} />{SITE_TYPES.map((s) => <SelectItem key={s} value={s} text={s} />)}</Select></Column>
            <Column lg={4}><TextInput id="subtype" labelText={t('vector.admin.samplingSite.subtype', 'Subtype')} value={f.subtype || ''} onChange={set('subtype')} /></Column>
            <Column lg={8}><TextInput id="zone" labelText={t('label.locations.field.zone', 'Environmental zone')} value={f.zone || ''} onChange={set('zone')} /></Column>
          </Grid>
        </FormGroup>
      )}

      {kind === 'facility' && !isNew && (
        <FormGroup legendText={`${t('label.locations.section.wards', 'Wards / Depts')} (${units.filter((u) => u.active).length})`} id={sid('wards')}>
          <p className="cds--form__helper-text" style={{ marginBottom: '.5rem' }}>
            {t('help.locations.ward', 'Wards, departments or clinics inside this organization')}. {t('help.locations.ward.gps', `GPS is optional: leave it blank to use ${rec.name}'s location. Address is always ${rec.name}'s.`)}
          </p>
          <Table size="sm" aria-label={t('label.locations.section.wards', 'Wards / Depts')}>
            <TableHead><TableRow>
              {['Name', 'Code', 'Service type', 'Contact name', 'Phone', 'Email', 'GPS', 'In use', 'Active', 'Actions'].map((h) => <TableHeader key={h}>{t(`label.locations.ward.column.${h.replace(/\s/g, '')}`, h)}</TableHeader>)}
            </TableRow></TableHead>
            <TableBody>
              {units.map((u) => (editing === u.id ? (
                <TableRow key={u.id}>
                  <TableCell><TextInput id={`wn-${u.id}`} labelText="" hideLabel value={wf.name || ''} onChange={(e) => setWf({ ...wf, name: e.target.value })} /></TableCell>
                  <TableCell><TextInput id={`wc-${u.id}`} labelText="" hideLabel value={wf.code || ''} onChange={(e) => setWf({ ...wf, code: e.target.value })} /></TableCell>
                  <TableCell><Select id={`ws-${u.id}`} labelText="" hideLabel value={wf.svc || ''} onChange={(e) => setWf({ ...wf, svc: e.target.value })}>{SERVICE_TYPES.map((x) => <SelectItem key={x} value={x} text={x} />)}</Select></TableCell>
                  {['contact', 'phone', 'email'].map((k) => <TableCell key={k}><TextInput id={`w${k}-${u.id}`} labelText="" hideLabel value={wf[k] || ''} onChange={(e) => setWf({ ...wf, [k]: e.target.value })} /></TableCell>)}
                  <TableCell>
                    <TextInput id={`wlat-${u.id}`} labelText="" hideLabel placeholder={rec.lat ? `${rec.lat} (${t('label.locations.inherited', 'inherited')})` : 'Latitude'} value={wf.lat || ''} onChange={(e) => setWf({ ...wf, lat: e.target.value })} />
                    <TextInput id={`wlng-${u.id}`} labelText="" hideLabel placeholder={rec.lng ? `${rec.lng} (${t('label.locations.inherited', 'inherited')})` : 'Longitude'} value={wf.lng || ''} onChange={(e) => setWf({ ...wf, lng: e.target.value })} />
                  </TableCell>
                  <TableCell>{u.inUse.toLocaleString()}</TableCell>
                  <TableCell><Tag type={u.active ? 'green' : 'gray'} size="sm">{u.active ? t('label.locations.status.active', 'Active') : t('label.locations.status.inactive', 'Inactive')}</Tag></TableCell>
                  <TableCell>
                    <Button kind="secondary" size="sm" disabled={!(wf.name || '').trim()} onClick={() => { onUnits((d) => d.map((r) => (r.id === u.id ? { ...r, ...wf, name: wf.name.trim() } : r))); audit(u.id, 'Edited', diffRecord(u, wf, byId)); setEditing(null); }}>{t('button.save', 'Save')}</Button>
                    <Button kind="ghost" size="sm" onClick={() => setEditing(null)}>{t('button.cancel', 'Cancel')}</Button>
                    <Button kind="ghost" size="sm" onClick={() => { setEditing(null); setMoving(u.id); }}>{t('button.locations.moveWard', 'Move')}</Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={u.id} className={highlight && [u.name, u.code].some((v) => v && v.toLowerCase().includes(highlight)) ? 'lo-highlight' : ''}>
                  <TableCell>{u.name}</TableCell><TableCell><code>{u.code || t('label.locations.none', 'none')}</code></TableCell><TableCell>{u.svc}</TableCell>
                  <TableCell>{u.contact || '-'}</TableCell><TableCell>{u.phone || '-'}</TableCell><TableCell>{u.email || '-'}</TableCell>
                  <TableCell>{u.lat ? `${u.lat}, ${u.lng}` : rec.lat ? <span className="cds--label" title={`${t('label.locations.inherited', 'inherited')} ${rec.name}`}>{rec.lat}, {rec.lng} ({t('label.locations.inherited', 'inherited')})</span> : '-'}</TableCell>
                  <TableCell>{u.inUse.toLocaleString()}</TableCell>
                  <TableCell><ActiveToggle record={u} onChange={(on) => (on ? reactivate(u) : askDeactivate(u))} /></TableCell>
                  <TableCell>{moving === u.id
                    ? <ComboBox id={`mv-${u.id}`} titleText="" aria-label={t('button.locations.moveWard', 'Move')} items={orgItems} itemToString={(i) => (i ? i.text : '')}
                      onChange={({ selectedItem }) => { if (!selectedItem) return; onUnits((d) => d.map((r) => (r.id === u.id ? { ...r, parent: selectedItem.id } : r))); audit(u.id, 'Moved', [['Organization', rec.name, selectedItem.text]]); setMoving(null); }} />
                    : <Button kind="ghost" size="sm" aria-label={`${t('button.edit', 'Edit')} ${u.name}`} onClick={() => { setEditing(u.id); setWf({ ...u }); }}>{t('button.edit', 'Edit')}</Button>}</TableCell>
                </TableRow>
              )))}
              {newUnits.map((u, i) => (
                <TableRow key={`nu${i}`}>
                  <TableCell><TextInput id={`nun-${i}`} labelText="" hideLabel placeholder={t('label.locations.ward.namePlaceholder', 'Ward / dept name')} value={u.name} onChange={(e) => setNewUnits(newUnits.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /></TableCell>
                  <TableCell><TextInput id={`nuc-${i}`} labelText="" hideLabel placeholder={t('label.optional', 'Optional')} value={u.code} onChange={(e) => setNewUnits(newUnits.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} /></TableCell>
                  <TableCell><Select id={`nus-${i}`} labelText="" hideLabel value={u.svc} invalid={!u.svc} invalidText="" onChange={(e) => setNewUnits(newUnits.map((x, j) => (j === i ? { ...x, svc: e.target.value } : x)))}>
                    <SelectItem value="" text={`${t('label.locations.field.serviceType', 'Service type')} *`} />{SERVICE_TYPES.map((x) => <SelectItem key={x} value={x} text={x} />)}</Select></TableCell>
                  {['contact', 'phone', 'email'].map((k) => <TableCell key={k}><TextInput id={`nu${k}-${i}`} labelText="" hideLabel placeholder={t('label.optional', 'Optional')} value={u[k]} onChange={(e) => setNewUnits(newUnits.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} /></TableCell>)}
                  <TableCell className="cds--label">{rec.lat ? t('label.locations.inherits', 'inherits') : ''}</TableCell>
                  <TableCell /><TableCell><Tag type="blue" size="sm">{t('label.locations.draft', 'Draft')}</Tag></TableCell>
                  <TableCell><Button kind="ghost" size="sm" onClick={() => setNewUnits(newUnits.filter((_, j) => j !== i))}>{t('button.remove', 'Remove')}</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Stack orientation="horizontal" gap={3} style={{ marginTop: '.5rem' }}>
            <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => setNewUnits([...newUnits, { name: '', code: '', svc: '', contact: '', phone: '', email: '' }])}>{t('button.locations.addWard', 'Add ward / dept')}</Button>
            {newUnits.length > 0 && <Button kind="secondary" size="sm" disabled={newUnits.some((u) => !u.name.trim() || !u.svc)}
              onClick={() => { const created = newUnits.map((u, k) => ({ id: `nu${Date.now()}${k}`, ...u, name: u.name.trim(), types: ['dept'], parent: rec.id, active: true, inUse: 0, open: 0 })); onUnits((d) => [...d, ...created]); audit(created.map((c) => c.id), 'Created'); setNewUnits([]); }}>
              {t('button.locations.saveWards', `Save ${newUnits.length} new ward / dept`)}</Button>}
          </Stack>
        </FormGroup>
      )}

      {showHist && history && <HistoryPanel name={rec.name} entries={history} />}

      {/* FR-C1: sticky Save / Cancel bar */}
      <div style={{ position: 'sticky', bottom: 0, zIndex: 1, display: 'flex', gap: '.5rem', padding: '.75rem 0', background: 'var(--cds-layer-01)', borderTop: '1px solid var(--cds-border-subtle-01)' }}>
        <Button size="sm" onClick={save}>{t('button.save', 'Save')}</Button>
        <Button kind="ghost" size="sm" onClick={onCancel}>{t('button.cancel', 'Cancel')}</Button>
        {!isNew && history && <Button kind="ghost" size="sm" renderIcon={RecentlyViewed} aria-expanded={showHist} onClick={() => setShowHist(!showHist)}>{showHist ? t('button.locations.history.hide', 'Hide history') : `${t('button.locations.history', 'History')} (${history.length})`}</Button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Geographic Areas tree (FR-B7, FR-L1)
// ---------------------------------------------------------------------------
function AreasTree({ data, setData, byId, notify, audit, historyOf }) {
  const areas = data.filter((r) => kindOf(r) === 'area');
  const lvl = (r) => typeById[r.types[0]].level;
  const kids = (id) => areas.filter((r) => r.parent === id).sort((a, b) => a.name.localeCompare(b.name));
  const placed = (id) => data.filter((r) => r.parent === id && ['facility', 'site'].includes(kindOf(r)));
  const [open, setOpen] = useState(new Set(areas.filter((r) => lvl(r) === 1).map((r) => r.id)));
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('active');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [nf, setNf] = useState({ name: '', code: '' });
  const ql = q.trim().toLowerCase();
  const statusOk = (r) => status === 'all' || (status === 'active' ? r.active : !r.active);
  const hit = (r) => ql && [r.name, r.code, ...(r.formerNames || [])].some((v) => v && v.toLowerCase().includes(ql));
  const ancestors = (id) => { const out = []; let c = byId[id]; while (c && c.parent) { out.push(c.parent); c = byId[c.parent]; } return out; };
  const visible = useMemo(() => { if (!ql) return null; const v = new Set(); areas.filter((r) => hit(r) && statusOk(r)).forEach((r) => { v.add(r.id); ancestors(r.id).forEach((a) => v.add(a)); }); return v; }, [ql, data, status]);
  const isOpen = (id) => (visible ? visible.has(id) : open.has(id));
  const toggle = (id) => { const n = new Set(open); if (n.has(id)) n.delete(id); else n.add(id); setOpen(n); };
  const update = (id, patch) => setData((d) => d.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const rows = [];
  const walk = (r, depth) => { if (visible && !visible.has(r.id)) return; if (!visible && depth > 0 && !statusOk(r)) return; rows.push({ r, depth }); if (isOpen(r.id)) kids(r.id).forEach((c) => walk(c, depth + 1)); };
  areas.filter((r) => lvl(r) === 1).forEach((r) => walk(r, 0));
  const deactivate = (r) => {
    const ch = kids(r.id).filter((c) => c.active).length; const pl = placed(r.id).filter((c) => c.active).length;
    if (ch || pl) return notify(t('message.locations.area.inUse', `${r.name} still has ${ch} active areas inside it and ${pl} active organizations or sites placed in it. Deactivate or move those first.`), 'warning');
    update(r.id, { active: false }); audit(r.id, 'Deactivated');
    return notify(`${r.name} ${t('message.locations.deactivated', 'deactivated.')}`, 'success', { label: t('button.locations.undo', 'Undo'), fn: () => update(r.id, { active: true }) });
  };
  const onKeyDown = (e) => {
    const els = [...e.currentTarget.querySelectorAll('tr[data-id]')]; const i = els.indexOf(document.activeElement); if (i < 0) return;
    const id = els[i].dataset.id;
    if (e.key === 'ArrowDown' && els[i + 1]) { e.preventDefault(); els[i + 1].focus(); }
    if (e.key === 'ArrowUp' && els[i - 1]) { e.preventDefault(); els[i - 1].focus(); }
    if (e.key === 'ArrowRight' && kids(id).length && !isOpen(id)) { e.preventDefault(); toggle(id); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (isOpen(id) && kids(id).length) toggle(id); else { const p = els.find((x) => x.dataset.id === byId[id].parent); if (p) p.focus(); } }
    if (e.key === 'Enter') { e.preventDefault(); setEditing(editing === id ? null : id); }
  };
  const AddRow = ({ depth, level, parent }) => (
    <TableRow><TableCell colSpan={6} style={{ paddingLeft: `${1 + depth * 1.5}rem` }}>
      <Stack orientation="horizontal" gap={3}>
        <TextInput id="new-area" labelText={`${t('label.locations.area.new', 'New')} ${AREA_LEVELS[level - 1].name}${parent ? ` · ${parent.name}` : ''} *`} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
        <TextInput id="new-area-code" labelText={t('label.locations.column.code', 'Code')} value={nf.code} onChange={(e) => setNf({ ...nf, code: e.target.value })} />
        <Button size="sm" disabled={!nf.name.trim()} onClick={() => { const id = `na${Date.now()}`; setData((d) => [...d, { id, name: nf.name.trim(), code: nf.code, types: [`L${level}`], parent: parent ? parent.id : null, active: true, inUse: 0 }]); audit(id, 'Created'); setAdding(null); }}>{t('button.save', 'Save')}</Button>
        <Button kind="ghost" size="sm" onClick={() => setAdding(null)}>{t('button.cancel', 'Cancel')}</Button>
      </Stack>
    </TableCell></TableRow>
  );

  return (
    <TableContainer>
      <TableToolbar>
        <TableToolbarContent style={{ gap: '.5rem', alignItems: 'flex-end', padding: '.5rem 1rem' }}>
          <TableToolbarSearch persistent value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('placeholder.locations.area.search', 'Search areas by name or code')} />
          <Select id="area-status" labelText={t('label.locations.filter.status', 'Status')} value={status} onChange={(e) => setStatus(e.target.value)}>
            <SelectItem value="active" text={t('label.locations.status.active', 'Active')} /><SelectItem value="inactive" text={t('label.locations.status.inactive', 'Inactive')} /><SelectItem value="all" text={t('label.locations.status.all', 'All')} />
          </Select>
          <Button kind="ghost" size="md" disabled={areas.length >= 500} onClick={() => setOpen(new Set(areas.map((r) => r.id)))}>{t('button.locations.area.expandAll', 'Expand all')}</Button>
          <Button kind="ghost" size="md" onClick={() => setOpen(new Set())}>{t('button.locations.area.collapseAll', 'Collapse all')}</Button>
          <Button size="md" renderIcon={Add} onClick={() => { setAdding('root'); setNf({ name: '', code: '' }); }}>{`${t('button.locations.add', 'Add')} ${AREA_LEVELS[0].name}`}</Button>
        </TableToolbarContent>
      </TableToolbar>
      <Table size="md" role="treegrid" aria-label={t('sidenav.label.admin.locations.areas', 'Geographic Areas')} onKeyDown={onKeyDown}>
        <TableHead><TableRow>
          {[t('label.locations.column.name', 'Name'), t('label.locations.column.code', 'Code'), t('label.locations.column.level', 'Level'), t('label.locations.column.children', 'Child areas'), t('label.locations.column.active', 'Active'), t('label.locations.column.actions', 'Actions')].map((h) => <TableHeader key={h}>{h}</TableHeader>)}
        </TableRow></TableHead>
        <TableBody>
          {adding === 'root' && <AddRow depth={0} level={1} parent={null} />}
          {rows.map(({ r, depth }) => {
            const ch = kids(r.id); const L = lvl(r);
            return (
              <React.Fragment key={r.id}>
                <TableRow data-id={r.id} tabIndex={0} aria-level={L} aria-expanded={ch.length ? isOpen(r.id) : undefined} className={hit(r) ? 'lo-highlight' : ''}>
                  <TableCell style={{ paddingLeft: `${1 + depth * 1.5}rem` }}>
                    {ch.length ? <Button kind="ghost" size="sm" hasIconOnly renderIcon={isOpen(r.id) ? ChevronDown : ChevronRight} iconDescription={isOpen(r.id) ? t('button.collapse', 'Collapse') : t('button.expand', 'Expand')} onClick={() => !visible && toggle(r.id)} /> : <span style={{ display: 'inline-block', width: '2rem' }} />}
                    {L === 1 ? <strong>{r.name}</strong> : r.name}
                  </TableCell>
                  <TableCell><code>{r.code || t('label.locations.none', 'none')}</code></TableCell>
                  <TableCell><Tag type="warm-gray" size="sm">{L}. {typeById[r.types[0]].label}</Tag></TableCell>
                  <TableCell>{ch.length}</TableCell>
                  <TableCell><ActiveToggle record={r} onChange={(on) => { if (on) { const p = byId[r.parent]; if (p && !p.active) return notify(t('error.locations.reactivate.parentInactive', `Reactivate ${p.name} first.`), 'error'); update(r.id, { active: true }); return null; } return deactivate(r); }} /></TableCell>
                  <TableCell>
                    {L < AREA_LEVELS.length && r.active && <Button kind="ghost" size="sm" renderIcon={Add} onClick={() => { setAdding(r.id); setNf({ name: '', code: '' }); setOpen(new Set([...open, r.id])); }}>{AREA_LEVELS[L].name}</Button>}
                    <Button kind="ghost" size="sm" aria-label={`${t('button.edit', 'Edit')} ${r.name}`} onClick={() => setEditing(editing === r.id ? null : r.id)}>{t('button.edit', 'Edit')}</Button>
                  </TableCell>
                </TableRow>
                {editing === r.id && (
                  <TableRow><TableCell colSpan={6} style={{ padding: 0 }}>
                    <RecordForm rec={r} kind="area" data={data} byId={byId} notify={notify} audit={audit} history={historyOf(r.id)} onCancel={() => setEditing(null)}
                      onSave={(rec, changes) => { update(r.id, rec); if (changes.length) audit(r.id, 'Edited', changes); setEditing(null); }} />
                  </TableCell></TableRow>
                )}
                {adding === r.id && <AddRow depth={depth + 1} level={L + 1} parent={r} />}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      <p className="cds--label" style={{ padding: '.75rem 1rem' }}>{ql ? t('message.locations.area.searchContext', `${rows.filter(({ r }) => hit(r)).length} matches, shown with the areas they sit in`) : t('message.locations.area.loadOnExpand', 'Children load when a row is expanded.')}</p>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// Import / Export (section F)
// ---------------------------------------------------------------------------
function ImportPage({ data, setData, byId, notify, presetArea, audit }) {
  const [files, setFiles] = useState(presetArea === 'values' ? [{ name: 'png-values.csv', area: 'values', rows: 412 }] : []);
  const [mode, setMode] = useState('replace');
  const [stage, setStage] = useState('setup');
  const [dec, setDec] = useState({});
  const [ren, setRen] = useState({});
  const [remember, setRemember] = useState({});
  const [ack, setAck] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // FR-F3 Replace scope: types in the file; wards only under parents with ward rows; never registry records
  const inFileTypes = ['rc', 'dept'];
  const wardParents = ['f1', 'f4'];
  const matched = new Set(PREVIEW_ROWS.map((r) => r.target).filter(Boolean).concat(['f8', 'f9', 'u2', 'u3']));
  const renameRows = PREVIEW_ROWS.filter((r) => r.outcome === 'rename');
  const pending = new Set(renameRows.filter((r) => ren[r.line] !== 'different').map((r) => r.pair));
  const inScope = (r) => r.types.some((x) => inFileTypes.includes(x)) && (kindOf(r) !== 'unit' || wardParents.includes(r.parent));
  const toDeactivate = mode === 'replace' ? data.filter((r) => r.active && inScope(r) && !matched.has(r.id) && !r.registry && !pending.has(r.id)) : [];
  const decisions = PREVIEW_ROWS.filter((r) => r.outcome === 'decision');
  const undecided = decisions.filter((r) => !dec[r.line]).length + renameRows.filter((r) => !ren[r.line]).length;
  const counts = {
    new: PREVIEW_ROWS.filter((r) => r.outcome === 'new').length, updated: PREVIEW_ROWS.filter((r) => r.outcome === 'updated').length,
    unchanged: 39, reactivated: mode === 'replace' ? 1 : 0, deactivated: toDeactivate.length,
    decision: decisions.length + renameRows.length, rejected: PREVIEW_ROWS.filter((r) => r.outcome === 'rejected').length,
  };
  const scope = mode === 'replace'
    ? t('label.locations.import.replaceScope', 'This file has Referring clinic and Ward / Dept rows. Referral labs, sampling sites and geographic areas will not change. Wards / depts will only be replaced at Port Moresby General Hospital and Gerehu General Hospital. Registry records are never deactivated.')
    : t('help.locations.import.mode.merge', 'Add new records and update matching ones. Nothing else changes.');
  const OUT = { new: 'green', updated: 'blue', unchanged: 'gray', reactivated: 'teal', decision: 'purple', rename: 'magenta', rejected: 'red' };

  if (stage === 'done') return (
    <Tile>
      <h4>{t('label.locations.import.complete', 'Import complete')}</h4>
      <p>{counts.new} new, {counts.updated} updated, {counts.reactivated} reactivated, {counts.deactivated} deactivated, {counts.rejected} rejected.</p>
      <Button kind="tertiary" renderIcon={Download}>{t('button.locations.import.report', 'Download result report')}</Button>
    </Tile>
  );

  return (
    <Stack gap={6}>
      {stage === 'setup' && (<>
        <Tile>
          <h4>1. {t('label.locations.import.files', 'Files')}</h4>
          <FileUploaderDropContainer accept={['.csv']} multiple labelText={t('label.locations.import.drop', 'Drag CSV files here or click to browse (organizations-*.csv, *-levels.csv, *-values.csv)')}
            onAddFiles={() => setFiles([{ name: 'organizations-png-2026-09.csv', area: 'organizations', rows: 13 }])} />
          {files.map((fl, i) => (
            <Stack key={fl.name} orientation="horizontal" gap={4} style={{ marginTop: '.5rem', alignItems: 'flex-end' }}>
              <span>{fl.name} ({fl.rows} rows)</span>
              <Select id={`area-${i}`} labelText={t('label.locations.import.area', 'Area')} value={fl.area} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, area: e.target.value } : x)))}>
                <SelectItem value="organizations" text={t('label.locations.import.area.organizations', 'Facilities, wards & sites')} />
                <SelectItem value="levels" text={t('label.locations.import.area.levels', 'Geographic levels')} />
                <SelectItem value="values" text={t('label.locations.import.area.values', 'Geographic areas')} />
              </Select>
            </Stack>
          ))}
          <Button kind="ghost" size="sm" renderIcon={Download}>{t('button.locations.template', 'Download template')}</Button>
        </Tile>
        <Tile>
          <h4>2. {t('label.locations.import.mode', 'Import mode')}</h4>
          <TileGroup name="mode" valueSelected={mode} onChange={setMode}>
            <RadioTile value="merge" id="mode-merge"><strong>{t('label.locations.import.mode.merge', 'Add & update')}</strong><p>{t('help.locations.import.mode.merge', 'Add new records and update matching ones. Nothing else changes.')}</p></RadioTile>
            <RadioTile value="replace" id="mode-replace"><strong>{t('label.locations.import.mode.replace', 'Replace')}</strong><p>{t('help.locations.import.mode.replace', 'Also deactivate records of the types in this file that the file does not include. Nothing is deleted.')}</p></RadioTile>
          </TileGroup>
          {files.length > 0 && <InlineNotification kind="info" lowContrast hideCloseButton title={t('label.locations.import.forThisFile', 'For this file:')} subtitle={scope} style={{ maxWidth: '100%' }} />}
        </Tile>
        <Button disabled={!files.length} onClick={() => setStage('preview')}>{t('button.locations.import.preview', 'Preview')}</Button>
      </>)}

      {stage === 'preview' && (<>
        <InlineNotification kind="info" lowContrast hideCloseButton title="" subtitle={`${scope} ${t('message.locations.import.nothingSaved', 'Nothing has been saved.')}`} style={{ maxWidth: '100%' }} />
        <Grid condensed>
          {Object.entries(counts).map(([k, n]) => (
            <Column key={k} lg={2} md={2} sm={2}><Tile><div className="cds--type-productive-heading-05">{n}</div><div className="cds--label">{t(`label.locations.import.outcome.${k}`, k)}</div></Tile></Column>
          ))}
        </Grid>

        {renameRows.length > 0 && (
          <Tile>
            <h4>{t('label.locations.import.rename.title', 'Possible renames')}</h4>
            {renameRows.map((r) => { const old = byId[r.pair]; return (
              <RadioButtonGroup key={r.line} legendText={`${old.name} → ${r.name} (line ${r.line})`} name={`rn${r.line}`} valueSelected={ren[r.line]} onChange={(v) => setRen({ ...ren, [r.line]: v })}>
                <RadioButton id={`rn${r.line}-same`} value="same" labelText={t('label.locations.import.rename.same', 'Same place, renamed')} />
                <RadioButton id={`rn${r.line}-diff`} value="different" labelText={t('label.locations.import.rename.different', 'Different places')} />
              </RadioButtonGroup>
            ); })}
          </Tile>
        )}

        {decisions.length > 0 && (
          <Tile>
            <h4>{t('label.locations.import.outcome.decision', 'Needs decision')}</h4>
            {decisions.map((r) => (
              <Stack key={r.line} gap={2} style={{ marginBottom: '1rem' }}>
                <RadioButtonGroup legendText={`Line ${r.line}: ${r.type} "${r.name}"`} name={`d${r.line}`} orientation="vertical" valueSelected={dec[r.line]} onChange={(v) => setDec({ ...dec, [r.line]: v })}>
                  {r.candidates.map((c) => <RadioButton key={c} id={`d${r.line}-${c}`} value={c} labelText={`${t('label.locations.import.decision.use', 'Use this record')}: ${CANDIDATES[c].name} (${CANDIDATES[c].code || 'no code'}, ${CANDIDATES[c].parent}, ${CANDIDATES[c].inUse} orders)`} />)}
                  <RadioButton id={`d${r.line}-new`} value="new" labelText={t('label.locations.import.decision.new', 'Create new')} />
                  <RadioButton id={`d${r.line}-skip`} value="skip" labelText={t('label.locations.import.decision.skip', 'Skip row')} />
                </RadioButtonGroup>
                <Checkbox id={`rem-${r.line}`} labelText={t('label.locations.import.decision.remember', 'Remember this name')} disabled={!dec[r.line] || ['new', 'skip'].includes(dec[r.line])} checked={!!remember[r.line]} onChange={(_, { checked }) => setRemember({ ...remember, [r.line]: checked })} />
              </Stack>
            ))}
          </Tile>
        )}

        {mode === 'replace' && (
          <Tile>
            <h4>{t('label.locations.import.willDeactivate', 'Will be deactivated')} ({toDeactivate.length})</h4>
            <UnorderedList>{toDeactivate.map((r) => <ListItem key={r.id}>{r.name} ({kindOf(r) === 'unit' ? byId[r.parent].name : pathText(byId, r.parent)}) {r.open ? `: ${r.open} ${t('label.locations.openOrders', 'open orders')}` : ''}</ListItem>)}</UnorderedList>
          </Tile>
        )}

        <Table size="sm" aria-label={t('label.locations.import.rows', 'Rows')}>
          <TableHead><TableRow>{['Line', 'Outcome', 'Type', 'Code', 'Name', 'Detail'].map((h) => <TableHeader key={h}>{t(`label.locations.import.column.${h.toLowerCase()}`, h)}</TableHeader>)}</TableRow></TableHead>
          <TableBody>{PREVIEW_ROWS.map((r) => (
            <TableRow key={r.line}>
              <TableCell>{r.line}</TableCell><TableCell><Tag type={OUT[r.outcome]} size="sm">{t(`label.locations.import.outcome.${r.outcome}`, r.outcome)}</Tag></TableCell>
              <TableCell>{r.type}</TableCell><TableCell><code>{r.code || '-'}</code></TableCell><TableCell>{r.name}</TableCell>
              <TableCell>{r.reason || (r.diffs ? r.diffs.map((d) => `${d[0]}: ${d[1]} → ${d[2]}`).join('; ') : '')}{r.registry && ` · ${t('warning.locations.import.registryOverwrite', 'Will be overwritten by the next registry sync')}`}</TableCell>
            </TableRow>))}
          </TableBody>
        </Table>
        <Stack orientation="horizontal" gap={3}>
          <Button disabled={undecided > 0} onClick={() => setConfirm(true)}>{t('button.locations.import.apply', 'Apply')}</Button>
          <Button kind="secondary" onClick={() => setStage('setup')}>{t('button.back', 'Back')}</Button>
        </Stack>
      </>)}

      <Modal open={confirm} modalHeading={t('label.locations.import.confirm.title', 'Apply this import?')} primaryButtonText={t('button.locations.import.apply', 'Apply')} secondaryButtonText={t('button.cancel', 'Cancel')}
        primaryButtonDisabled={mode === 'replace' && !ack} onRequestClose={() => setConfirm(false)}
        onRequestSubmit={() => { setData((d) => d.map((r) => (toDeactivate.some((x) => x.id === r.id) ? { ...r, active: false } : r))); audit(toDeactivate.map((r) => r.id), 'Deactivated by import run'); setConfirm(false); setStage('done'); }}>
        <UnorderedList>
          <ListItem>{counts.new} {t('label.locations.import.outcome.new', 'New')}</ListItem><ListItem>{counts.updated} {t('label.locations.import.outcome.updated', 'Updated')}</ListItem>
          {mode === 'replace' && <ListItem>{counts.reactivated} {t('label.locations.import.outcome.reactivated', 'Reactivated')}, {counts.deactivated} {t('label.locations.import.outcome.deactivated', 'Deactivated')}</ListItem>}
          <ListItem>{counts.rejected} {t('label.locations.import.outcome.rejected', 'Rejected')}</ListItem>
        </UnorderedList>
        {mode === 'replace' && <Checkbox id="ack" labelText={t('label.locations.import.confirm.replace', `I understand ${counts.deactivated} records will be deactivated`)} checked={ack} onChange={(_, { checked }) => setAck(checked)} />}
      </Modal>
    </Stack>
  );
}
