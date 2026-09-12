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
    expect(within(browser).getAllByRole('listitem')).toHaveLength(38);
    await user.click(screen.getByRole('button', {name:'Sample / Order', exact:true}));
    await user.type(screen.getByLabelText('Find a field'), 'result');
    expect(within(browser).getByText('Result Value')).toBeVisible();
    await user.click(screen.getByRole('button', {name:'Added Result Value',exact:true}));
    expect(columnNames()).toHaveLength(7);
    await user.clear(screen.getByLabelText('Find a field'));
    expect(within(browser).queryByText('Result Value')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', {name:'Patient Demographics',exact:true}));
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
    expect(within(screen.getByRole('region', {name:'Available fields'})).getAllByRole('listitem')).toHaveLength(7);
    await user.click(screen.getByRole('radio', {name:/^Non-Conformance/}));
    expect(within(screen.getByRole('region', {name:'Available fields'})).getAllByRole('listitem')).toHaveLength(5);
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
