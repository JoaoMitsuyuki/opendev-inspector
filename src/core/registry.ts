import { configScanner } from '../scanners/config.js';
import { dependencyScanner } from '../scanners/dependencies.js';
import { qualityScanner } from '../scanners/quality.js';
import { secretsScanner } from '../scanners/secrets.js';
import type { ModuleName, Scanner } from './types.js';

export const scannerRegistry = new Map<ModuleName, Scanner>([
  ['secrets', secretsScanner],
  ['config', configScanner],
  ['dependencies', dependencyScanner],
  ['quality', qualityScanner],
]);
