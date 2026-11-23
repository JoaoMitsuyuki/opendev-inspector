import type { Finding, ScanResult } from '../core/types.js';

const ICONS = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
} as const;

export function renderTerminal(result: ScanResult): string {
  const lines = [
    'OpenDev Inspector',
    `Target: ${result.target}`,
    `Scanned ${result.summary.filesScanned} files in ${result.durationMs}ms`,
    '',
  ];

  if (result.findings.length === 0) {
    lines.push('No findings detected by the selected modules.');
  } else {
    for (const finding of result.findings)
      lines.push(...renderFinding(finding));
  }

  lines.push(
    '',
    `Summary: ${result.summary.findings} finding(s) | critical ${result.summary.bySeverity.critical} | high ${result.summary.bySeverity.high} | medium ${result.summary.bySeverity.medium} | low ${result.summary.bySeverity.low} | info ${result.summary.bySeverity.info}`,
  );
  if (result.errors.length > 0) {
    lines.push(
      `Warnings: ${result.errors.length}`,
      ...result.errors.map((error) => `  - ${error}`),
    );
  }
  lines.push(
    '',
    'Static analysis reduces risk but does not prove that a project is secure.',
  );
  return lines.join('\n');
}

function renderFinding(finding: Finding): string[] {
  const position = [
    finding.location.path,
    finding.location.line,
    finding.location.column,
  ]
    .filter((part) => part !== undefined)
    .join(':');
  return [
    `[${ICONS[finding.severity]}] ${finding.title} (${finding.ruleId})`,
    `  at ${position}`,
    `  ${finding.description}`,
    ...(finding.evidence ? [`  Evidence: ${finding.evidence}`] : []),
    `  Fix: ${finding.recommendation}`,
    '',
  ];
}
