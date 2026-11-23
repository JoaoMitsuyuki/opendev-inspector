#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Command, InvalidArgumentError } from 'commander';
import { scanProject } from '../core/scanner.js';
import {
  MODULE_NAMES,
  SEVERITIES,
  type ModuleName,
  type Severity,
} from '../core/types.js';
import { renderJson } from '../reporters/json.js';
import { renderTerminal } from '../reporters/terminal.js';

const program = new Command();

program
  .name('opendev')
  .description('Local-first project security and health analyzer')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan a project without executing its code')
  .argument('[path]', 'project directory', '.')
  .option(
    '-m, --modules <list>',
    'comma-separated scanner modules',
    parseModules,
  )
  .option('-f, --format <format>', 'terminal or json', parseFormat, 'terminal')
  .option('-o, --output <file>', 'write the report to a file')
  .option(
    '--fail-on <severity>',
    'exit 1 at or above this severity',
    parseSeverity,
  )
  .option(
    '--max-file-size <bytes>',
    'maximum text file size',
    parsePositiveInteger,
    1_000_000,
  )
  .action(async (target: string, options: CliOptions) => {
    const result = await scanProject({
      root: target,
      modules: options.modules ?? [...MODULE_NAMES],
      maxFileSizeBytes: options.maxFileSize,
    });
    const report =
      options.format === 'json' ? renderJson(result) : renderTerminal(result);

    if (options.output) {
      await writeFile(path.resolve(options.output), `${report}\n`, 'utf8');
      if (options.format === 'terminal')
        console.log(`Report written to ${path.resolve(options.output)}`);
    } else {
      console.log(report);
    }

    if (options.failOn && reachesThreshold(result, options.failOn)) {
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});

interface CliOptions {
  modules?: ModuleName[];
  format: 'terminal' | 'json';
  output?: string;
  failOn?: Severity;
  maxFileSize: number;
}

function parseModules(value: string): ModuleName[] {
  const modules = value.split(',').map((item) => item.trim());
  const invalid = modules.filter(
    (item): item is string => !MODULE_NAMES.includes(item as ModuleName),
  );
  if (invalid.length > 0 || modules.length === 0) {
    throw new InvalidArgumentError(
      `Unknown module(s): ${invalid.join(', ') || value}. Available: ${MODULE_NAMES.join(', ')}`,
    );
  }
  return [...new Set(modules)] as ModuleName[];
}

function parseFormat(value: string): 'terminal' | 'json' {
  if (value !== 'terminal' && value !== 'json') {
    throw new InvalidArgumentError('Format must be terminal or json.');
  }
  return value;
}

function parseSeverity(value: string): Severity {
  if (!SEVERITIES.includes(value as Severity)) {
    throw new InvalidArgumentError(
      `Severity must be one of: ${SEVERITIES.join(', ')}.`,
    );
  }
  return value as Severity;
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError('Value must be a positive integer.');
  }
  return parsed;
}

function reachesThreshold(
  result: Awaited<ReturnType<typeof scanProject>>,
  threshold: Severity,
): boolean {
  const thresholdIndex = SEVERITIES.indexOf(threshold);
  return result.findings.some(
    (finding) => SEVERITIES.indexOf(finding.severity) <= thresholdIndex,
  );
}
