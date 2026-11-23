export const SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
] as const;
export type Severity = (typeof SEVERITIES)[number];

export const MODULE_NAMES = [
  'secrets',
  'config',
  'dependencies',
  'quality',
] as const;
export type ModuleName = (typeof MODULE_NAMES)[number];

export interface FindingLocation {
  path: string;
  line?: number;
  column?: number;
}

export interface Finding {
  ruleId: string;
  module: ModuleName;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  location: FindingLocation;
  evidence?: string;
}

export interface ScanOptions {
  root: string;
  modules: ModuleName[];
  maxFileSizeBytes: number;
}

export interface ScanContext extends ScanOptions {
  files: string[];
}

export interface Scanner {
  name: ModuleName;
  scan(context: ScanContext): Promise<Finding[]>;
}

export interface ScanSummary {
  filesScanned: number;
  findings: number;
  bySeverity: Record<Severity, number>;
}

export interface ScanResult {
  schemaVersion: '1.0';
  tool: { name: 'OpenDev Inspector'; version: string };
  target: string;
  startedAt: string;
  durationMs: number;
  modules: ModuleName[];
  summary: ScanSummary;
  findings: Finding[];
  errors: string[];
}
