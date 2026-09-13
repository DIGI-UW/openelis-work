import React from 'react';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../designs/reports/custom-data-export-example.js';

let ReportingMock;
beforeAll(async () => {
  // Exercise the canonical inline mock, not a second implementation of its navigation.
  const html = readFileSync('../designs/reports/custom-data-export.html', 'utf8');
  const script = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/)[1]
    .replace('ReactDOM.createRoot(document.getElementById(\'root\')).render(<App/>);', '');
  // Compile in Node so the compiler does not inherit jsdom's browser globals.
  const code = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { readFileSync } from 'node:fs';
    import { transformWithEsbuild } from 'vite';
    const result = await transformWithEsbuild(readFileSync(0, 'utf8'), 'reporting-mock.jsx', { loader: 'jsx', jsx: 'transform' });
    process.stdout.write(result.code);
  `], { input: script, encoding: 'utf8' });
  window.OpenElisExportExample = globalThis.OpenElisExportExample;
  ReportingMock = new Function('React', `${code}\nreturn App;`)(React);
});

describe('reporting overview navigation', () => {
  it('returns from a draft and the queue without losing fields, dates or the current step', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await user.click(screen.getByRole('button', { name: 'Start a new export' }));
    await user.click(screen.getByRole('button', { name: 'Use fictional virology example' }));
    await user.click(screen.getByRole('button', { name: 'Next: Set Filters →' }));
    expect(screen.getByLabelText('Date From *')).toHaveValue('2026-08-01');

    await user.click(screen.getByRole('button', { name: '← Export overview' }));
    expect(screen.getByRole('heading', { name: 'Use a saved report' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Continue current export' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Date To *')).toHaveValue('2026-08-31');

    await user.click(screen.getByRole('button', { name: 'My Report Queue →' }));
    expect(screen.getByRole('button', { name: 'Continue current export' })).toBeVisible();
    const home = within(screen.getByRole('navigation')).getByRole('button', { name: 'Custom Data Export' });
    home.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Create a new export' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Continue current export' }));
    await user.click(screen.getByRole('button', { name: 'Next: Review & Submit →' }));
    expect(screen.getByRole('heading', { name: 'Selected Fields (7)' })).toBeVisible();
    expect(screen.getByText('📅 2026-08-01 → 2026-08-31 (31 days, sample collection date)')).toBeVisible();
  });

  it('makes saved reports reachable from the queue even without the sidebar', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await user.click(screen.getByRole('button', { name: 'My Report Queue →' }));
    expect(screen.queryByRole('button', { name: 'Continue current export' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '← Export overview' }));
    const saved = screen.getByRole('region', { name: 'Use a saved report' });
    await user.click(within(saved).getAllByRole('button', { name: 'Use report' })[0]);
    expect(screen.getByLabelText('Date From *')).toHaveValue('');
    expect(screen.getByLabelText('Date To *')).toHaveValue('');
    expect(screen.getByText('Saved report loaded. Choose a fresh reporting period.')).toBeVisible();
  });
});


const columnNames = () => within(screen.getByRole('list', {name:'CSV columns in order'}))
  .getAllByRole('listitem').map(row => row.querySelector('.column-name')?.textContent || row.textContent);
const openExample = async user => {
  await user.click(screen.getByRole('button', {name:'Start a new export'}));
  await user.click(screen.getByRole('button', {name:'Use fictional virology example'}));
};
const goToReview = async user => {
  await user.click(screen.getByRole('button', {name:'Next: Set Filters →'}));
  await user.click(screen.getByRole('button', {name:'Next: Review & Submit →'}));
};

describe('ordered reporting columns', () => {
  it('keeps the complete catalog searchable, blocks restricted additions and retains choices across groups', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await openExample(user);
    const browser = screen.getByRole('region', {name:'Available fields'});
    expect(within(browser).queryAllByRole('listitem')).toHaveLength(0);
    await user.click(screen.getByRole('button', {name:'Expand all',exact:true}));
    expect(within(browser).getAllByRole('listitem')).toHaveLength(38);
    await user.click(screen.getByRole('button', {name:'Sample / Order', exact:true}));
    await user.type(screen.getByLabelText('Find a field'), 'result');
    expect(within(browser).getByText('Result Value')).toBeVisible();
    await user.click(screen.getByRole('button', {name:'Added Result Value',exact:true}));
    expect(columnNames()).toHaveLength(7);
    await user.clear(screen.getByLabelText('Find a field'));
    expect(within(browser).getByText('Result Value')).toBeVisible();
    expect(screen.getByRole('button', {name:'Sample / Order',exact:true})).toHaveAttribute('aria-expanded','false');
    const locked=screen.getByRole('button', {name:'Add Patient Name',exact:true});
    expect(locked).toHaveAttribute('aria-disabled','true');
    await user.click(locked);
    expect(columnNames()).not.toContain('Patient Name');
    await user.click(screen.getByLabelText('Identifying-data access'));
    await user.click(locked);
    expect(columnNames().at(-1)).toBe('Patient Name');
    await user.click(screen.getByLabelText('Identifying-data access'));
    expect(columnNames().at(-1)).toBe('Patient Name');
    await user.click(screen.getByRole('button', {name:'Remove Patient Name',exact:true}));
    expect(columnNames()).toHaveLength(7);
    await user.click(screen.getByRole('button', {name:'Change type and clear fields'}));
    await user.click(screen.getByRole('radio', {name:/^Referrals/}));
    await user.click(screen.getByRole('button', {name:'Expand all',exact:true}));
    expect(within(screen.getByRole('region', {name:'Available fields'})).getAllByRole('listitem')).toHaveLength(7);
    await user.click(screen.getByRole('radio', {name:/^Non-Conformance/}));
    await user.click(screen.getByRole('button', {name:'Expand all',exact:true}));
    expect(within(screen.getByRole('region', {name:'Available fields'})).getAllByRole('listitem')).toHaveLength(5);
  });

  it('keeps search results grouped and selections stable while browsing, folding groups and reordering', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await user.click(screen.getByRole('button', {name:'Start a new export'}));
    await user.click(screen.getByRole('radio', {name:/^Sample & Testing/}));
    const fields = screen.getByRole('region', {name:'Available fields'});
    expect(within(fields).queryAllByRole('listitem')).toHaveLength(0);
    await user.click(screen.getByRole('button', {name:'Expand all',exact:true}));
    expect(within(fields).getAllByRole('listitem')).toHaveLength(38);
    await user.click(screen.getByRole('button', {name:'Add Accession Number',exact:true}));
    await user.click(screen.getByRole('button', {name:'Add Result Value',exact:true}));
    await user.click(screen.getByRole('button', {name:'Add Collection → Received (min)',exact:true}));
    const ordered = columnNames();
    expect(ordered).toEqual(['Accession Number','Result Value','Collection → Received (min)']);

    const sample = within(fields).getByRole('button', {name:'Sample / Order',exact:true});
    sample.focus();
    await user.keyboard('{Enter}');
    expect(sample).toHaveAttribute('aria-expanded','false');
    expect(sample).toHaveFocus();
    await user.type(screen.getByLabelText('Find a field'),'date');
    expect(sample).toHaveAttribute('aria-expanded','true');
    expect(within(fields).getByRole('button',{name:'Test Results',exact:true})).toHaveAttribute('aria-expanded','true');
    expect(within(fields).getByRole('button',{name:'Patient Demographics',exact:true})).toHaveAttribute('aria-expanded','true');
    await user.click(screen.getByRole('button',{name:'Add Collection Date',exact:true}));
    await user.click(screen.getByRole('button',{name:'Add Validation Date',exact:true}));
    await user.click(sample);
    expect(screen.getByLabelText('Find a field')).toHaveValue('date');
    expect(within(fields).getByText('Validation Date')).toBeVisible();
    expect(columnNames()).toEqual([...ordered,'Collection Date','Validation Date']);

    await user.click(screen.getByRole('button',{name:'Clear search',exact:true}));
    expect(screen.getByLabelText('Find a field')).toHaveFocus();
    expect(sample).toHaveAttribute('aria-expanded','false');
    expect(within(fields).getByRole('button',{name:'Test Results',exact:true})).toHaveAttribute('aria-expanded','true');
    await user.type(screen.getByLabelText('Find a field'),'not-a-field');
    expect(within(fields).getByText('No fields match your search.')).toBeVisible();
    expect(columnNames()).toHaveLength(5);
    await user.clear(screen.getByLabelText('Find a field'));
    await user.type(screen.getByLabelText('Find a field'),'turnaround');
    expect(within(fields).getAllByRole('listitem')).toHaveLength(5);
    await user.click(screen.getByRole('button',{name:'Move Result Value up',exact:true}));
    expect(columnNames().slice(0,2)).toEqual(['Result Value','Accession Number']);
    expect(screen.getByLabelText('Find a field')).toHaveValue('turnaround');
  });

  it('adds and removes only matching fields without changing an earlier cross-group selection', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await openExample(user);
    const ordered = columnNames();
    await user.type(screen.getByLabelText('Find a field'),'received');
    await user.click(screen.getByRole('button',{name:'Add all shown Sample / Order fields',exact:true}));
    expect(columnNames()).toEqual([...ordered,'Received Date','Received Time']);
    await user.click(screen.getByRole('button',{name:'Remove all shown Sample / Order fields',exact:true}));
    expect(columnNames()).toEqual(ordered);
    expect(screen.getByLabelText('Find a field')).toHaveValue('received');
  });

  it('starts folded, reveals only search hits and keeps search expansion separate from manual browsing', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await openExample(user);
    const fields = screen.getByRole('region', {name:'Available fields'});
    const catalog = within(fields).getByRole('region', {name:'Scrollable field catalog'});
    const ordered = columnNames();
    expect(within(catalog).getAllByRole('button')).toHaveLength(5);
    expect(within(catalog).getAllByRole('button').every(button=>button.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(within(fields).getByRole('button', {name:'Collapse all'})).toHaveAttribute('aria-disabled','true');

    await user.click(within(fields).getByRole('button', {name:'Sample / Order',exact:true}));
    await user.type(screen.getByLabelText('Find a field'),'date');
    expect(within(catalog).queryByRole('button', {name:'Patient Identifiers',exact:true})).not.toBeInTheDocument();
    expect(within(catalog).getByRole('button', {name:'Test Results',exact:true})).toHaveAttribute('aria-expanded','true');
    await user.click(within(fields).getByRole('button', {name:'Collapse all'}));
    expect(within(catalog).queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByLabelText('Find a field')).toHaveValue('date');
    await user.click(within(fields).getByRole('button', {name:'Expand all'}));
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(9);
    expect(within(catalog).queryByRole('button', {name:'Patient Identifiers',exact:true})).not.toBeInTheDocument();
    await user.click(within(fields).getByRole('button', {name:'Clear search'}));
    expect(within(catalog).getByRole('button', {name:'Sample / Order',exact:true})).toHaveAttribute('aria-expanded','true');
    expect(within(catalog).getByRole('button', {name:'Test Results',exact:true})).toHaveAttribute('aria-expanded','false');
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(13);

    const expand = within(fields).getByRole('button', {name:'Expand all'});
    expand.focus();
    await user.keyboard('{Enter}');
    expect(expand).toHaveFocus();
    expect(within(catalog).getAllByRole('listitem')).toHaveLength(38);
    await user.click(within(fields).getByRole('button', {name:'Collapse all'}));
    expect(within(catalog).queryAllByRole('listitem')).toHaveLength(0);
    expect(columnNames()).toEqual(ordered);
  });

  it('uses the chosen order in preview, review and saved reports while retaining keyboard focus and fresh dates', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await openExample(user);
    await user.click(screen.getByRole('button', {name:'Move Collection Date up'}));
    expect(screen.getByRole('button', {name:'Move Collection Date up'})).toHaveFocus();
    expect(screen.getByRole('button', {name:'Move Collection Date up'})).toHaveAttribute('aria-disabled','true');
    const ordered=columnNames();
    expect(ordered.slice(0,2)).toEqual(['Collection Date','Accession Number']);
    expect(within(screen.getByRole('table', {name:'CSV column preview'})).getAllByRole('columnheader').map(th=>th.textContent)).toEqual(ordered);
    await goToReview(user);
    expect(columnNames()).toEqual(ordered);
    await user.click(screen.getByLabelText('Save these report settings for later'));
    await user.type(screen.getByLabelText('Saved report name'), 'Date first');
    await user.click(screen.getByRole('button', {name:'Save report settings',exact:true}));
    await user.click(screen.getByRole('button', {name:'← Export overview'}));
    const saved=screen.getByText('Date first').closest('.saved-report');
    await user.click(within(saved).getByRole('button', {name:'Use report'}));
    expect(screen.getByLabelText('Date From *')).toHaveValue('');
    expect(screen.getByLabelText('Date To *')).toHaveValue('');
    await user.click(screen.getByRole('button', {name:'← Back'}));
    expect(columnNames()).toEqual(ordered);
    for (const name of ordered) await user.click(screen.getByRole('button', {name:`Remove ${name}`,exact:true}));
    expect(screen.getByLabelText('Find a field')).toHaveFocus();
    expect(screen.getByRole('button', {name:'Next: Set Filters →'})).toBeDisabled();
  });

  it('retries an immutable ordered request and downloads aligned headers and values after the draft changes', async () => {
    const user = userEvent.setup();
    render(<ReportingMock />);
    await openExample(user);
    await user.click(screen.getByRole('button', {name:'Move Collection Date up'}));
    await goToReview(user);
    await user.type(screen.getByLabelText('File name'),'Ordered monthly report');
    await user.selectOptions(screen.getByLabelText('Next export'),'failure');
    await user.click(screen.getByRole('button', {name:'Create CSV and add to queue'}));
    await user.click(screen.getAllByRole('button', {name:'Change',exact:true})[1]);
    await user.click(screen.getByRole('button', {name:'Move Collection Date down'}));
    expect(columnNames().slice(0,2)).toEqual(['Accession Number','Collection Date']);
    await user.click(screen.getByRole('button', {name:'My Report Queue →'}));
    const failed=screen.getByText('Ordered monthly report').closest('tr');
    await waitFor(()=>expect(within(failed).getByRole('button',{name:'Retry'})).toBeVisible(),{timeout:3000});
    await user.click(within(failed).getByRole('button',{name:'Retry'}));
    expect(within(failed).getByText('Failed')).toBeVisible();
    const retry=screen.getByText('Ordered monthly report · retry').closest('tr');
    const link=await within(retry).findByRole('link',{name:'Download'},{timeout:3000});
    const csv=decodeURIComponent(link.getAttribute('href').split(',').slice(1).join(','));
    expect(csv).toMatch(/^\uFEFF"Collection Date","Accession Number"/);
    expect(csv).toContain('"2026-08-01","DEMO-0801"');
    await user.click(screen.getByRole('button',{name:'Continue current export'}));
    expect(columnNames().slice(0,2)).toEqual(['Accession Number','Collection Date']);
  });
});
