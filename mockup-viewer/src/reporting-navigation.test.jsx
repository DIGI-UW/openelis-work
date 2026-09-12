import React from 'react';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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
