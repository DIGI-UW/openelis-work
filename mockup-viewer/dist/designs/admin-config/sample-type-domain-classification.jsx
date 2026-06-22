/**
 * S-04: Sample Type Domain Classification — React/Carbon Mockup
 *
 * Addendum to OGC-296 (Sample Type Management Module).
 * Shows:
 * - Sample Type list with Domain column and domain filter
 * - Basic Info tab with new Domain dropdown
 * - Bulk Domain Assignment accordion utility
 *
 * Dependencies: @carbon/react, @carbon/icons-react
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell,
  TextInput, TextArea, Select, SelectItem, Toggle,
  Button, InlineNotification, Tag, Tile, Accordion, AccordionItem,
  Tabs, Tab, TabList, TabPanels, TabPanel,
} from '@carbon/react';
import { Add, Edit, Save, ChevronDown, ChevronUp, Renew } from '@carbon/icons-react';

// i18n helper
const t = (key, fallback) => fallback || key;

// ─── Domain Config ────────────────────────────────────────────────
const DOMAIN_OPTIONS = [
  { value: 'CLINICAL', label: t('label.sampleType.domain.clinical', 'Clinical') },
  { value: 'ENVIRONMENTAL', label: t('label.sampleType.domain.environmental', 'Environmental') },
  { value: 'BOTH', label: t('label.sampleType.domain.both', 'Both') },
];

const DOMAIN_TAG_KIND = {
  CLINICAL: 'green',
  ENVIRONMENTAL: 'purple',
  BOTH: 'teal',
};

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_SAMPLE_TYPES = [
  { id: 1, name: 'Serum', description: 'Blood serum after centrifugation', active: true, domain: 'CLINICAL', testCount: 142, whonet: 'SER' },
  { id: 2, name: 'Whole Blood', description: 'Unprocessed blood sample', active: true, domain: 'CLINICAL', testCount: 87, whonet: 'BLD' },
  { id: 3, name: 'Urine', description: 'Spot or 24-hour urine', active: true, domain: 'CLINICAL', testCount: 63, whonet: 'URI' },
  { id: 4, name: 'Plasma', description: 'Anticoagulated plasma', active: true, domain: 'CLINICAL', testCount: 98, whonet: 'PLA' },
  { id: 5, name: 'CSF', description: 'Cerebrospinal fluid', active: true, domain: 'CLINICAL', testCount: 24, whonet: 'CSF' },
  { id: 6, name: 'Stool', description: 'Fecal specimen', active: true, domain: 'CLINICAL', testCount: 18, whonet: 'STL' },
  { id: 7, name: 'Surface Water', description: 'River, lake, or stream sample', active: true, domain: 'ENVIRONMENTAL', testCount: 42, whonet: null },
  { id: 8, name: 'Groundwater', description: 'Well or borehole water', active: true, domain: 'ENVIRONMENTAL', testCount: 38, whonet: null },
  { id: 9, name: 'Drinking Water', description: 'Treated potable water — tested in both clinical water quality and environmental monitoring', active: true, domain: 'BOTH', testCount: 56, whonet: null },
  { id: 10, name: 'Effluent / Wastewater', description: 'Industrial or municipal discharge', active: true, domain: 'ENVIRONMENTAL', testCount: 31, whonet: null },
  { id: 11, name: 'Ambient Air', description: 'Outdoor air quality sample', active: true, domain: 'ENVIRONMENTAL', testCount: 18, whonet: null },
  { id: 12, name: 'Topsoil', description: 'Surface soil (0–30 cm)', active: true, domain: 'ENVIRONMENTAL', testCount: 22, whonet: null },
  { id: 13, name: 'Sediment', description: 'River or lake bed sediment', active: true, domain: 'ENVIRONMENTAL', testCount: 15, whonet: null },
  { id: 14, name: 'Sputum', description: 'Expectorated or induced sputum', active: true, domain: 'CLINICAL', testCount: 12, whonet: 'SPT' },
  { id: 15, name: 'Sludge', description: 'Wastewater treatment sludge', active: true, domain: 'ENVIRONMENTAL', testCount: 9, whonet: null },
  { id: 16, name: 'Throat Swab', description: 'Oropharyngeal swab', active: true, domain: 'CLINICAL', testCount: 8, whonet: 'THR' },
];

// ─── Main Component ───────────────────────────────────────────────

export default function SampleTypeDomainClassification() {
  // View state
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [editingType, setEditingType] = useState(null);

  // Filter state
  const [searchText, setSearchText] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  // Data state (mutable for demo)
  const [sampleTypes, setSampleTypes] = useState(MOCK_SAMPLE_TYPES);

  // Bulk assignment state
  const [bulkChanges, setBulkChanges] = useState({});

  // Filtered list
  const filteredTypes = useMemo(() => {
    return sampleTypes.filter(st => {
      const matchesSearch = !searchText ||
        st.name.toLowerCase().includes(searchText.toLowerCase()) ||
        st.description.toLowerCase().includes(searchText.toLowerCase());
      const matchesDomain = !domainFilter || st.domain === domainFilter;
      return matchesSearch && matchesDomain;
    });
  }, [sampleTypes, searchText, domainFilter]);

  // Domain counts
  const domainCounts = useMemo(() => {
    const counts = { CLINICAL: 0, ENVIRONMENTAL: 0, BOTH: 0 };
    sampleTypes.forEach(st => counts[st.domain]++);
    return counts;
  }, [sampleTypes]);

  const envOrBothCount = domainCounts.ENVIRONMENTAL + domainCounts.BOTH;

  // Bulk assignment handlers
  const handleBulkChange = useCallback((id, newDomain) => {
    setBulkChanges(prev => {
      const original = sampleTypes.find(st => st.id === id)?.domain;
      if (newDomain === original) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: newDomain };
    });
  }, [sampleTypes]);

  const applyBulkChanges = useCallback(() => {
    setSampleTypes(prev => prev.map(st =>
      bulkChanges[st.id] ? { ...st, domain: bulkChanges[st.id] } : st
    ));
    setBulkChanges({});
  }, [bulkChanges]);

  // Edit a sample type
  const openEditor = useCallback((st) => {
    setEditingType({ ...st });
    setView('editor');
  }, []);

  const saveEditor = useCallback(() => {
    if (!editingType) return;
    setSampleTypes(prev => prev.map(st => st.id === editingType.id ? editingType : st));
    setView('list');
    setEditingType(null);
  }, [editingType]);

  // ─── LIST VIEW ────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div>
        <Stack gap={5}>
          {/* Page Header */}
          <Tile>
            <Grid>
              <Column lg={8} md={4} sm={4}>
                <h3>{t('heading.sampleType.management', 'Sample Type Management')}</h3>
                <p style={{ fontSize: '14px', color: 'var(--cds-text-secondary)', marginTop: 'var(--cds-spacing-03)' }}>
                  {t('heading.sampleType.subtitle', 'Configure sample types, display order, test associations, and domain classification.')}
                </p>
              </Column>
              <Column lg={8} md={4} sm={4} style={{ textAlign: 'right' }}>
                <Stack orientation="horizontal" gap={3} style={{ justifyContent: 'flex-end' }}>
                  <Tag type="green" size="sm">{domainCounts.CLINICAL} {t('label.sampleType.domain.clinical', 'Clinical')}</Tag>
                  <Tag type="purple" size="sm">{domainCounts.ENVIRONMENTAL} {t('label.sampleType.domain.environmental', 'Environmental')}</Tag>
                  <Tag type="teal" size="sm">{domainCounts.BOTH} {t('label.sampleType.domain.both', 'Both')}</Tag>
                </Stack>
              </Column>
            </Grid>
          </Tile>

          {/* Sample Type Table */}
          <TableContainer>
            {/* Custom toolbar — TableToolbarSearch expands to 100% width outside DataTable context,
                stacking items. Plain flexbox row avoids the issue. */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0 1rem', height: '3rem',
              background: 'var(--cds-layer)', borderBottom: '1px solid var(--cds-border-subtle-01)',
            }}>
              <TextInput
                id="sample-type-search"
                labelText={t('placeholder.sampleType.search', 'Search sample types...')}
                hideLabel
                placeholder={t('placeholder.sampleType.search', 'Search sample types...')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="sm"
                style={{ flex: '1 1 auto', maxWidth: '18rem' }}
              />
              <Select
                id="domain-filter"
                labelText={t('label.sampleType.filterDomain', 'Filter by domain')}
                hideLabel
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                style={{ minWidth: '160px' }}
              >
                <SelectItem value="" text={t('placeholder.sampleType.filter.domain', 'All domains')} />
                {DOMAIN_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                ))}
              </Select>
              <Button kind="primary" size="sm" renderIcon={Add} style={{ whiteSpace: 'nowrap' }}>
                {t('button.sampleType.add', 'Add Sample Type')}
              </Button>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>{t('label.sampleType.name', 'Name')}</TableHeader>
                  <TableHeader>{t('label.sampleType.domain', 'Domain')}</TableHeader>
                  <TableHeader>{t('label.sampleType.status', 'Status')}</TableHeader>
                  <TableHeader>{t('label.sampleType.testCount', 'Tests')}</TableHeader>
                  <TableHeader>{t('label.sampleType.whonet', 'WHONET')}</TableHeader>
                  <TableHeader>{t('label.sampleType.actions', 'Actions')}</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTypes.map(st => (
                  <TableRow key={st.id}>
                    <TableCell>
                      <span style={{ fontWeight: 500 }}>{st.name}</span>
                      <br />
                      <span style={{ fontSize: '12px', color: 'var(--cds-text-secondary)' }}>{st.description}</span>
                    </TableCell>
                    <TableCell>
                      <Tag type={DOMAIN_TAG_KIND[st.domain]} size="sm">
                        {t(`label.sampleType.domain.${st.domain.toLowerCase()}`, st.domain)}
                      </Tag>
                    </TableCell>
                    <TableCell>
                      <Tag type={st.active ? 'green' : 'gray'} size="sm">
                        {st.active ? t('label.active', 'Active') : t('label.inactive', 'Inactive')}
                      </Tag>
                    </TableCell>
                    <TableCell>{st.testCount}</TableCell>
                    <TableCell>{st.whonet || <span style={{ color: 'var(--cds-text-disabled)' }}>—</span>}</TableCell>
                    <TableCell>
                      <Button kind="ghost" size="sm" renderIcon={Edit} onClick={() => openEditor(st)}>
                        {t('button.edit', 'Edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* ── Bulk Domain Assignment (STD-3-001) ──────────────── */}
          <Accordion>
            <AccordionItem title={t('heading.sampleType.bulkDomain', 'Classify Sample Domains')}>
              <InlineNotification
                kind="info"
                title=""
                subtitle={t('message.sampleType.bulkDomain.info', 'Use this utility to quickly classify your existing sample types. This determines which sample types appear in Clinical vs. Environmental workflow modes.')}
                lowContrast
                hideCloseButton
              />

              <p style={{ fontSize: '13px', color: 'var(--cds-text-secondary)', margin: 'var(--cds-spacing-04) 0' }}>
                {envOrBothCount} {t('label.sampleType.bulkDomain.ofTotal', 'of')} {sampleTypes.length} {t('label.sampleType.bulkDomain.count', 'sample types classified as Environmental or Both')}
              </p>

              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>{t('label.sampleType.name', 'Name')}</TableHeader>
                    <TableHeader>{t('label.sampleType.bulkDomain.current', 'Current Domain')}</TableHeader>
                    <TableHeader>{t('label.sampleType.bulkDomain.new', 'New Domain')}</TableHeader>
                    <TableHeader>{t('label.sampleType.bulkDomain.testCount', 'Tests')}</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleTypes.map(st => (
                    <TableRow key={st.id} style={bulkChanges[st.id] ? { background: 'var(--cds-highlight)' } : {}}>
                      <TableCell style={{ fontWeight: 500 }}>{st.name}</TableCell>
                      <TableCell>
                        <Tag type={DOMAIN_TAG_KIND[st.domain]} size="sm">
                          {t(`label.sampleType.domain.${st.domain.toLowerCase()}`, st.domain)}
                        </Tag>
                      </TableCell>
                      <TableCell>
                        <Select
                          id={`bulk-domain-${st.id}`}
                          labelText={t('label.sampleType.newDomain', 'New Domain')}
                          hideLabel
                          size="sm"
                          value={bulkChanges[st.id] || st.domain}
                          onChange={(e) => handleBulkChange(st.id, e.target.value)}
                        >
                          {DOMAIN_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>{st.testCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-05)' }}>
                <Button
                  kind="primary" size="sm" renderIcon={Save}
                  onClick={applyBulkChanges}
                  disabled={Object.keys(bulkChanges).length === 0}
                >
                  {t('button.sampleType.bulkDomain.apply', 'Apply Changes')}
                  {Object.keys(bulkChanges).length > 0 && ` (${Object.keys(bulkChanges).length})`}
                </Button>
                <Button kind="ghost" size="sm" renderIcon={Renew}
                  onClick={() => setBulkChanges({})}
                  disabled={Object.keys(bulkChanges).length === 0}
                >
                  {t('button.sampleType.bulkDomain.reset', 'Reset')}
                </Button>
              </Stack>
            </AccordionItem>
          </Accordion>
        </Stack>
      </div>
    );
  }

  // ─── EDITOR VIEW ──────────────────────────────────────────────
  return (
    <div>
      <Stack gap={5}>
        {/* Editor Header */}
        <Tile>
          <Stack orientation="horizontal" gap={3} style={{ alignItems: 'center' }}>
            <Button kind="ghost" size="sm" onClick={() => { setView('list'); setEditingType(null); }}>
              {t('button.back', '← Back to List')}
            </Button>
            <h4 style={{ margin: 0 }}>
              {editingType?.name}
            </h4>
            <Tag type={DOMAIN_TAG_KIND[editingType?.domain]} size="sm">
              {t(`label.sampleType.domain.${editingType?.domain.toLowerCase()}`, editingType?.domain)}
            </Tag>
            {editingType?.active
              ? <Tag type="green" size="sm">{t('label.active', 'Active')}</Tag>
              : <Tag type="gray" size="sm">{t('label.inactive', 'Inactive')}</Tag>
            }
          </Stack>
        </Tile>

        {/* 5-Tab Editor (OGC-296 structure) */}
        <Tabs>
          <TabList>
            <Tab>{t('tab.sampleType.basicInfo', 'Basic Info')}</Tab>
            <Tab>{t('tab.sampleType.displayOrder', 'Display Order')}</Tab>
            <Tab>{t('tab.sampleType.tests', 'Associated Tests')}</Tab>
            <Tab>{t('tab.sampleType.storage', 'Storage & Disposal')}</Tab>
            <Tab>{t('tab.sampleType.whonet', 'WHONET Mapping')}</Tab>
          </TabList>
          <TabPanels>
            {/* ── Basic Info Tab (STD-2-001 — Domain field added) ── */}
            <TabPanel>
              <Tile style={{ padding: 'var(--cds-spacing-06)' }}>
                <Grid>
                  <Column lg={8} md={6} sm={4}>
                    <Stack gap={5}>
                      <TextInput
                        id="st-name"
                        labelText={t('label.sampleType.name', 'Name') + ' *'}
                        value={editingType?.name || ''}
                        onChange={(e) => setEditingType(prev => ({ ...prev, name: e.target.value }))}
                      />

                      <Toggle
                        id="st-active"
                        labelText={t('label.sampleType.active', 'Active')}
                        labelA={t('label.inactive', 'Inactive')}
                        labelB={t('label.active', 'Active')}
                        toggled={editingType?.active}
                        onToggle={(checked) => setEditingType(prev => ({ ...prev, active: checked }))}
                      />

                      {/* ─── NEW: Sample Domain (S-04) ─────────────── */}
                      <Select
                        id="st-domain"
                        labelText={t('label.sampleType.domain', 'Sample Domain') + ' *'}
                        value={editingType?.domain || 'CLINICAL'}
                        onChange={(e) => setEditingType(prev => ({ ...prev, domain: e.target.value }))}
                        helperText={t('label.sampleType.domain.helper', 'Determines which workflow mode (Clinical or Environmental) this sample type appears in.')}
                      >
                        {DOMAIN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                        ))}
                      </Select>
                      {/* ─── END NEW ───────────────────────────────── */}

                      <TextArea
                        id="st-description"
                        labelText={t('label.sampleType.description', 'Description')}
                        value={editingType?.description || ''}
                        onChange={(e) => setEditingType(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </Stack>
                  </Column>
                </Grid>

                <Stack orientation="horizontal" gap={3} style={{ marginTop: 'var(--cds-spacing-06)' }}>
                  <Button kind="primary" size="sm" renderIcon={Save} onClick={saveEditor}>
                    {t('button.save', 'Save')}
                  </Button>
                  <Button kind="ghost" size="sm" onClick={() => { setView('list'); setEditingType(null); }}>
                    {t('button.cancel', 'Cancel')}
                  </Button>
                </Stack>
              </Tile>
            </TabPanel>

            {/* Other tabs — placeholder content (already defined by OGC-296) */}
            <TabPanel>
              <Tile>
                <p style={{ color: 'var(--cds-text-secondary)' }}>
                  {t('label.sampleType.displayOrder.placeholder', 'Display Order — Drag-and-drop reordering for dropdown appearance. See OGC-296 for full specification.')}
                </p>
              </Tile>
            </TabPanel>
            <TabPanel>
              <Tile>
                <p style={{ color: 'var(--cds-text-secondary)' }}>
                  {t('label.sampleType.tests.placeholder', 'Associated Tests — Bidirectional test association management. See OGC-296 for full specification.')}
                </p>
              </Tile>
            </TabPanel>
            <TabPanel>
              <Tile>
                <p style={{ color: 'var(--cds-text-secondary)' }}>
                  {t('label.sampleType.storage.placeholder', 'Storage & Disposal — Default storage conditions, duration, disposal method. See OGC-296 for full specification.')}
                </p>
              </Tile>
            </TabPanel>
            <TabPanel>
              <Tile>
                <p style={{ color: 'var(--cds-text-secondary)' }}>
                  {t('label.sampleType.whonet.placeholder', 'WHONET Mapping — Map to WHONET specimen codes for AMR surveillance exports. See OGC-296 for full specification.')}
                </p>
              </Tile>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </div>
  );
}
