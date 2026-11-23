import path from 'node:path';
import { discoverFiles } from './files.js';
import { scannerRegistry } from './registry.js';
import { SEVERITIES } from './types.js';
import type { Finding, ScanOptions, ScanResult, Severity } from './types.js';

const TOOL_VERSION = '0.1.0';

export async function scanProject(options: ScanOptions): Promise<ScanResult> {
  const started = performance.now();
  const startedAt = new Date().toISOString();
  const root = path.resolve(options.root);
  const discovery = await discoverFiles(root);
  const findings: Finding[] = [];
  const errors = [...discovery.errors];

  for (const moduleName of options.modules) {
    const scanner = scannerRegistry.get(moduleName);
    if (!scanner) {
      errors.push(`Scanner module not registered: ${moduleName}`);
      continue;
    }
    try {
      findings.push(
        ...(await scanner.scan({ ...options, root, files: discovery.files })),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${moduleName}: ${message}`);
    }
  }

  findings.sort(compareFindings);
  const bySeverity = Object.fromEntries(
    SEVERITIES.map((severity) => [severity, 0]),
  ) as Record<Severity, number>;
  for (const finding of findings) bySeverity[finding.severity] += 1;

  return {
    schemaVersion: '1.0',
    tool: { name: 'OpenDev Inspector', version: TOOL_VERSION },
    target: root,
    startedAt,
    durationMs: Math.round(performance.now() - started),
    modules: options.modules,
    summary: {
      filesScanned: discovery.files.length,
      findings: findings.length,
      bySeverity,
    },
    findings,
    errors,
  };
}

function compareFindings(a: Finding, b: Finding): number {
  const severity =
    SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity);
  if (severity !== 0) return severity;
  return a.location.path.localeCompare(b.location.path);
}
