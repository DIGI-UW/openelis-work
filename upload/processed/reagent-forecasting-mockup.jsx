import React, { useState } from 'react';
import {
  Grid, Column, Stack,
  DataTable, TableContainer, Table, TableHead, TableRow, TableHeader,
  TableBody, TableCell, TableToolbar, TableToolbarContent, TableToolbarSearch,
  TextInput, NumberInput, Toggle,
  Button, InlineNotification, Tag, Tile,
  Breadcrumb, BreadcrumbItem,
  Accordion, AccordionItem,
} from '@carbon/react';
import { Renew, Save, Warning, ChevronDown, ChevronUp } from '@carbon/icons-react';

const t = (key, fallback) => fallback || key;

// ── Sample Data ─────────────────────────────────────────────────────────────
const FORECAST_DATA = [
  { id: '1', facility: 'Kigali Central Lab',    cartridge: 'MTB/RIF Ultra', dos: 4,    stock: 12,  adc: 3.1,  status: 'CRITICAL',  threshold: 30 },
  { id: '2', facility: 'Butare District Lab',   cartridge: 'MTB/RIF Ultra', dos: 18,   stock: 54,  adc: 3.0,  status: 'LOW',       threshold: 30 },
  { id: '3', facility: 'Gisenyi Health Centre', cartridge: 'MTB/RIF Ultra', dos: 52,   stock: 104, adc: 2.0,  status: 'ADEQUATE',  threshold: 30 },
  { id: '4', facility: 'Musanze Lab',           cartridge: 'MTB/XDR',      dos: null,  stock: 8,   adc: null, status: 'INSUFFICIENT_DATA', threshold: 30 },
  { id: '5', facility: 'Rwamagana District',    cartridge: 'MTB/RIF Ultra', dos: 7,    stock: 21,  adc: 3.0,  status: 'CRITICAL',  threshold: 30 },
  { id: '6', facility: 'Nyamata Lab',           cartridge: 'MTB/RIF Ultra', dos: 41,   stock: 82,  adc: 2.0,  status: 'ADEQUATE',  threshold: 30 },
  { id: '7', facility: 'Huye Hospital Lab',     cartridge: 'MTB/XDR',      dos: 9,    stock: 18,  adc: 2.0,  status: 'LOW',       threshold: 14 },
];

const statusConfig = {
  CRITICAL:          { label: 'label.forecast.status.critical',          fallback: 'Critical',            kind: 'red' },
  LOW:               { label: 'label.forecast.status.low',               fallback: 'Low Stock',           kind: 'orange' },
  ADEQUATE:          { label: 'label.forecast.status.adequate',          fallback: 'Adequate',            kind: 'green' },
  OVERSTOCKED:       { label: 'label.forecast.status.overstocked',       fallback: 'Overstocked',         kind: 'purple' },
  INSUFFICIENT_DATA: { label: 'label.forecast.status.insufficientData',  fallback: 'Insufficient History',kind: 'gray' },
};

const headers = [
  { key: 'facility',   header: t('label.forecast.facility', 'Facility') },
  { key: 'cartridge',  header: t('label.forecast.cartridgeType', 'Cartridge Type') },
  { key: 'status',     header: t('label.forecast.status', 'Status') },
  { key: 'dos',        header: t('label.forecast.daysOfStock', 'Days of Stock') },
  { key: 'stock',      header: t('label.forecast.stockOnHand', 'Stock on Hand') },
  { key: 'adc',        header: t('label.forecast.adc', 'Avg Daily Use') },
  { key: 'threshold',  header: t('label.forecast.reorderThreshold', 'Reorder (days)') },
  { key: 'actions',    header: '' },
];

export default function ReagentForecasting() {
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);
  const [expandedRow, setExpandedRow]       = useState(null);
  const [thresholdValues, setThresholdValues] = useState(
    Object.fromEntries(FORECAST_DATA.map(r => [r.id, r.threshold]))
  );
  const [savedRow, setSavedRow] = useState(null);
  const [recalcDone, setRecalcDone] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const criticalCount = FORECAST_DATA.filter(r => r.status === 'CRITICAL').length;
  const visibleData   = showAtRiskOnly
    ? FORECAST_DATA.filter(r => r.status === 'CRITICAL' || r.status === 'LOW')
    : FORECAST_DATA;

  const toggleRow = (id) => setExpandedRow(prev => prev === id ? null : id);

  const handleSaveThreshold = (row) => {
    setSavedRow(row.id);
    setExpandedRow(null);
    setTimeout(() => setSavedRow(null), 2500);
  };

  const handleRecalculate = () => {
    setRecalcDone(true);
    setTimeout(() => setRecalcDone(false), 3000);
  };

  return (
    <Grid style={{ padding: '1.5rem' }}>
      {/* Breadcrumb */}
      <Column lg={16}>
        <Breadcrumb>
          <BreadcrumbItem href="#">{t('nav.inventory', 'Inventory')}</BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>{t('heading.forecast.title', 'Reagent Forecasting')}</BreadcrumbItem>
        </Breadcrumb>
      </Column>

      {/* Page Title */}
      <Column lg={16} style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
        <Stack orientation="horizontal" gap={4} style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600, color: '#161616' }}>
              {t('heading.forecast.title', 'Reagent Forecasting')}
            </h2>
            <p style={{ color: '#525252', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              {t('heading.forecast.subtitle', 'GeneXpert cartridge stock-out prediction by facility')}
            </p>
          </div>
          <Button kind="ghost" size="sm" renderIcon={Renew} onClick={handleRecalculate}>
            {t('button.forecast.recalculate', 'Recalculate')}
          </Button>
        </Stack>
      </Column>

      {/* Recalculate notification */}
      {recalcDone && (
        <Column lg={16} style={{ marginBottom: '0.75rem' }}>
          <InlineNotification
            kind="info"
            title={t('message.forecast.recalculateStarted', 'Forecast recalculation started.')}
            subtitle="Results will update within a few minutes."
            hideCloseButton={false}
            onCloseButtonClick={() => setRecalcDone(false)}
          />
        </Column>
      )}

      {/* Save confirmation */}
      {savedRow && (
        <Column lg={16} style={{ marginBottom: '0.75rem' }}>
          <InlineNotification
            kind="success"
            title={t('message.forecast.thresholdSaved', 'Reorder threshold updated.')}
            hideCloseButton
          />
        </Column>
      )}

      {/* Critical alert banner */}
      {criticalCount > 0 && !alertDismissed && (
        <Column lg={16} style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="error"
            title={`${criticalCount} ${t('message.forecast.criticalAlert', 'site(s) have CRITICAL cartridge stock.')}`}
            subtitle={t('message.forecast.criticalAlertDetail', 'Immediate reorder action required. Expand rows for details.')}
            hideCloseButton={false}
            onCloseButtonClick={() => setAlertDismissed(true)}
          />
        </Column>
      )}

      {/* Global Config (collapsed by default) */}
      <Column lg={16} style={{ marginBottom: '1rem' }}>
        <Accordion>
          <AccordionItem title={t('heading.forecast.globalConfig', 'Global Forecasting Configuration')}>
            <Grid narrow>
              <Column lg={4} md={2} sm={4}>
                <NumberInput
                  id="lookback-window"
                  label={t('label.forecast.lookbackWindow', 'ADC Lookback Window (days)')}
                  min={30} max={180} value={90}
                  helperText="30–180 days. Applied to all facilities."
                />
              </Column>
              <Column lg={4} md={2} sm={4}>
                <NumberInput
                  id="default-threshold"
                  label={t('label.forecast.defaultReorderThreshold', 'Default Reorder Threshold (days)')}
                  min={1} max={365} value={30}
                  helperText="Used for facilities without a site-specific threshold."
                />
              </Column>
              <Column lg={16} style={{ marginTop: '1rem' }}>
                <Button kind="primary" size="sm" renderIcon={Save}>
                  {t('button.forecast.saveConfig', 'Save Global Config')}
                </Button>
              </Column>
            </Grid>
          </AccordionItem>
        </Accordion>
      </Column>

      {/* Main Forecasting Table */}
      <Column lg={16}>
        <DataTable rows={visibleData} headers={headers}>
          {({ rows, headers, getTableProps, getHeaderProps }) => (
            <TableContainer
              title={t('heading.forecast.tableTitle', 'Cartridge Stock Forecast')}
              description={`${t('label.forecast.asOf', 'As of')} 2026-03-23 06:00`}
            >
              <TableToolbar>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder={t('placeholder.forecast.search', 'Search facility or cartridge…')} />
                  <Button
                    kind={showAtRiskOnly ? 'primary' : 'ghost'}
                    size="sm"
                    renderIcon={Warning}
                    onClick={() => setShowAtRiskOnly(p => !p)}
                  >
                    {showAtRiskOnly
                      ? t('button.forecast.showAll', 'Show All Sites')
                      : t('button.forecast.showAtRisk', 'Show At-Risk Only')}
                  </Button>
                </TableToolbarContent>
              </TableToolbar>

              <Table {...getTableProps()} size="md">
                <TableHead>
                  <TableRow>
                    {headers.map(h => (
                      <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                        {h.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleData.map(row => {
                    const sc = statusConfig[row.status];
                    const isExpanded = expandedRow === row.id;
                    return (
                      <React.Fragment key={row.id}>
                        <TableRow style={row.status === 'CRITICAL' ? { backgroundColor: '#FFF1F1' } : {}}>
                          <TableCell>{row.facility}</TableCell>
                          <TableCell>{row.cartridge}</TableCell>
                          <TableCell>
                            <Tag type={sc.kind}>{t(sc.label, sc.fallback)}</Tag>
                          </TableCell>
                          <TableCell>
                            {row.dos !== null
                              ? <strong style={{ color: row.status === 'CRITICAL' ? '#DA1E28' : row.status === 'LOW' ? '#FF832B' : '#198038' }}>
                                  {row.dos} {t('label.forecast.days', 'days')}
                                </strong>
                              : <span style={{ color: '#6F6F6F', fontStyle: 'italic' }}>
                                  {t('label.forecast.notAvailable', '—')}
                                </span>}
                          </TableCell>
                          <TableCell>{row.stock} {t('label.forecast.units', 'cartridges')}</TableCell>
                          <TableCell>
                            {row.adc !== null
                              ? `${row.adc.toFixed(1)}/day`
                              : <span style={{ color: '#6F6F6F', fontStyle: 'italic' }}>
                                  {t('message.forecast.insufficientData', '< 14 days history')}
                                </span>}
                          </TableCell>
                          <TableCell>{row.threshold} {t('label.forecast.days', 'days')}</TableCell>
                          <TableCell>
                            <Button
                              kind="ghost"
                              size="sm"
                              renderIcon={isExpanded ? ChevronUp : ChevronDown}
                              onClick={() => toggleRow(row.id)}
                            >
                              {t('button.edit', 'Edit')}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Inline edit expansion */}
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={headers.length}>
                              <Tile style={{ padding: '1rem', backgroundColor: '#F4F4F4' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#161616' }}>
                                  {t('label.forecast.editThreshold', 'Edit reorder threshold for')} {row.facility} — {row.cartridge}
                                </p>
                                <Grid narrow>
                                  <Column lg={4} md={3} sm={4}>
                                    <NumberInput
                                      id={`threshold-${row.id}`}
                                      label={t('label.forecast.reorderThreshold', 'Reorder Threshold (days)')}
                                      min={1} max={365}
                                      value={thresholdValues[row.id]}
                                      onChange={(e, { value }) =>
                                        setThresholdValues(prev => ({ ...prev, [row.id]: value }))}
                                      helperText={t('label.forecast.thresholdHelp', 'Alert when days of stock falls below this value.')}
                                    />
                                  </Column>
                                </Grid>
                                <Stack orientation="horizontal" gap={3} style={{ marginTop: '1rem' }}>
                                  <Button kind="primary" size="sm" renderIcon={Save} onClick={() => handleSaveThreshold(row)}>
                                    {t('button.forecast.saveThreshold', 'Save Threshold')}
                                  </Button>
                                  <Button kind="ghost" size="sm" onClick={() => setExpandedRow(null)}>
                                    {t('button.cancel', 'Cancel')}
                                  </Button>
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
          )}
        </DataTable>
      </Column>

      {/* Summary Stats */}
      <Column lg={16} style={{ marginTop: '1.5rem' }}>
        <Grid narrow>
          {[
            { label: t('label.forecast.criticalSites', 'Critical Sites'),   value: FORECAST_DATA.filter(r=>r.status==='CRITICAL').length,          color: '#DA1E28' },
            { label: t('label.forecast.lowSites', 'Low Stock Sites'),       value: FORECAST_DATA.filter(r=>r.status==='LOW').length,               color: '#FF832B' },
            { label: t('label.forecast.adequateSites', 'Adequate Sites'),   value: FORECAST_DATA.filter(r=>r.status==='ADEQUATE').length,           color: '#198038' },
            { label: t('label.forecast.noDataSites', 'Insufficient Data'),  value: FORECAST_DATA.filter(r=>r.status==='INSUFFICIENT_DATA').length,  color: '#6F6F6F' },
          ].map(stat => (
            <Column lg={4} md={2} sm={2} key={stat.label}>
              <Tile style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</p>
                <p style={{ fontSize: '0.75rem', color: '#525252', marginTop: '0.25rem' }}>{stat.label}</p>
              </Tile>
            </Column>
          ))}
        </Grid>
      </Column>
    </Grid>
  );
}
