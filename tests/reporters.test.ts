import { describe, expect, it } from 'vitest';
import type { ScanResult } from '../src/core/types.js';
import { renderTerminal } from '../src/reporters/terminal.js';

describe('terminal reporter', () => {
  it('renders findings, summary, and the security limitation', () => {
    const result: ScanResult = {
      schemaVersion: '1.0',
      tool: { name: 'OpenDev Inspector', version: '0.1.0' },
      target: '/project',
      startedAt: '2026-01-01T00:00:00.000Z',
      durationMs: 12,
      modules: ['config'],
      summary: {
        filesScanned: 2,
        findings: 1,
        bySeverity: { critical: 0, high: 1, medium: 0, low: 0, info: 0 },
      },
      findings: [
        {
          ruleId: 'config/sensitive-env-file',
          module: 'config',
          severity: 'high',
          title: 'Sensitive environment file present',
          description: 'An environment file was found.',
          recommendation: 'Use a sanitized example.',
          location: { path: '.env' },
        },
      ],
      errors: [],
    };

    const output = renderTerminal(result);
    expect(output).toContain('[HIGH] Sensitive environment file present');
    expect(output).toContain('Summary: 1 finding(s)');
    expect(output).toContain('does not prove that a project is secure');
  });
});
