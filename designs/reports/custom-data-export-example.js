// Fictional data for the OpenELIS reporting design. No network or application APIs.
(() => {
  const fields = ['accessionNumber', 'collectionDate', 'labSection', 'testName', 'resultValue', 'resultUnit', 'resultStatus'];
  const labels = ['Accession Number', 'Collection Date', 'Lab Section', 'Test Name', 'Result Value', 'Result Unit', 'Result Status'];
  const defaults = { startDate: '', endDate: '', labSection: 'Virology', test: 'HIV viral load', resultStatus: 'Validated (finalized)', sampleStatus: 'All statuses', priority: 'All priorities', referringSite: '' };
  const make = (accessionNumber, collectionDate, resultValue, resultStatus = 'Validated') => ({ accessionNumber, collectionDate, labSection: 'Virology', testName: 'HIV viral load', resultValue, resultUnit: 'copies/mL', resultStatus });
  const records = [make('DEMO-0801', '2026-08-01', '<20'), make('DEMO-0812', '2026-08-12', '430'), make('DEMO-0831', '2026-08-31', '1200'), make('DEMO-0831', '2026-08-31', '1250'), make('DEMO-0824', '2026-08-24', ''), make('DEMO-0901', '2026-09-01', '85'), make('DEMO-0828', '2026-08-28', '210', 'Preliminary')];
  const august = { vars: [...fields], ...defaults, startDate: '2026-08-01', endDate: '2026-08-31' };
  function dateError(request) {
    if (!request.startDate || !request.endDate) return 'Choose both reporting dates.';
    const days = (Date.parse(request.endDate) - Date.parse(request.startDate)) / 86400000 + 1;
    if (!Number.isFinite(days) || days <= 0) return 'Date To must be on or after Date From.';
    return days > 90 ? 'Date range cannot exceed 90 days.' : '';
  }
  function limitation(request) {
    if (request.vars.some(key => !fields.includes(key))) return 'The downloadable example covers the seven monthly virology fields. The full export catalog remains in the specification; use the virology example to review a complete file.';
    if (request.sampleStatus !== 'All statuses' || request.priority !== 'All priorities' || request.referringSite) return 'This fictional file has no sample-status, priority or referring-site metadata. Clear those filters to review the virology example.';
    return '';
  }
  function select(request) {
    const status = request.resultStatus === 'Validated (finalized)' ? 'Validated' : request.resultStatus === 'Preliminary (technically accepted)' ? 'Preliminary' : request.resultStatus;
    return records.filter(row => row.collectionDate >= request.startDate && row.collectionDate <= request.endDate &&
      (request.labSection === 'all' || row.labSection === request.labSection) && (!request.test || row.testName === request.test) &&
      (status === 'All statuses' || row.resultStatus === status));
  }
  function configuration(request) {
    const { startDate, endDate, ...choices } = request;
    return { ...choices, vars: [...choices.vars] };
  }
  function restore(config) { return { ...defaults, ...config, vars: [...config.vars], startDate: '', endDate: '' }; }
  function csv(request) {
    const quote = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
    const selected = fields.filter(key => request.vars.includes(key));
    return '\uFEFF' + [selected.map(key => quote(labels[fields.indexOf(key)])).join(','), ...select(request).map(row => selected.map(key => quote(row[key])).join(','))].join('\r\n') + '\r\n';
  }
  globalThis.OpenElisExportExample = { fields, defaults, august, dateError, limitation, select, configuration, restore, csv };
})();
