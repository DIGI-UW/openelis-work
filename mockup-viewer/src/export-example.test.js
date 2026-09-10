import { describe, expect, it } from 'vitest';
import '../../designs/reports/custom-data-export-example.js';
const example = globalThis.OpenElisExportExample;

describe('fictional OpenELIS export example', () => {
  it('filters by collection period, test and result status without losing repeated accessions or blank values', () => {
    const rows = example.select(example.august);
    expect(rows).toHaveLength(5);
    expect(rows.filter(row=>row.accessionNumber==='DEMO-0831').map(row=>row.resultValue)).toEqual(['1200','1250']);
    expect(rows.find(row=>row.accessionNumber==='DEMO-0824').resultValue).toBe('');
    expect(example.select({...example.august, test:'Another test'})).toHaveLength(0);
    expect(example.select({...example.august, resultStatus:'All statuses'})).toHaveLength(6);
    expect(example.select({...example.august, endDate:'2026-09-01'})).toHaveLength(6);
  });
  it('saved configurations and expired re-runs require fresh reporting dates', () => {
    const config=example.configuration(example.august);
    expect(config).not.toHaveProperty('startDate');
    expect(example.restore(config)).toMatchObject({startDate:'',endDate:'',test:'HIV viral load'});
    config.vars.pop();
    expect(example.august.vars).toHaveLength(7);
    expect(example.dateError(example.restore(config))).toContain('both');
    expect(example.dateError({...example.august,endDate:'2026-07-31'})).toContain('on or after');
    expect(example.dateError({...example.august,endDate:'2026-12-31'})).toContain('90 days');
  });
  it('exports canonical column order, an Excel BOM, quoted text and blank cells without pretending unsupported fields exist', () => {
    const csv=example.csv({...example.august,vars:['resultValue','accessionNumber']});
    expect(csv.split('\r\n')).toHaveLength(7);
    expect(csv.startsWith('\uFEFF"Accession Number","Result Value"\r\n')).toBe(true);
    expect(csv).toContain('"DEMO-0824",""');
    expect(example.limitation({...example.august,vars:['patientName']})).toContain('seven monthly');
    expect(example.limitation({...example.august,priority:'Urgent'})).toContain('no sample-status');
    expect(example.limitation(example.august)).toBe('');
  });
});
