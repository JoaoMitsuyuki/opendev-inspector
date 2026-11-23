import type { Finding, Scanner } from '../core/types.js';
import { maskSecret, readSafeText, relativePath } from '../utils/text.js';

interface SecretRule {
  id: string;
  title: string;
  pattern: RegExp;
  valueGroup: number;
}

const RULES: SecretRule[] = [
  {
    id: 'secrets/aws-access-key',
    title: 'Possible AWS access key exposed',
    pattern: /\b(A(?:KIA|SIA)[A-Z0-9]{16})\b/g,
    valueGroup: 1,
  },
  {
    id: 'secrets/github-token',
    title: 'Possible GitHub token exposed',
    pattern:
      /\b((?:gh[opusr]_[A-Za-z0-9]{30,255}|github_pat_[A-Za-z0-9_]{20,255}))\b/g,
    valueGroup: 1,
  },
  {
    id: 'secrets/private-key',
    title: 'Private key material found',
    pattern: /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g,
    valueGroup: 1,
  },
  {
    id: 'secrets/generic-credential',
    title: 'Possible hard-coded credential',
    pattern:
      /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd)\b\s*[:=]\s*["']?([^\s"'`,;}{]{8,})["']?/gi,
    valueGroup: 1,
  },
];

const PLACEHOLDER =
  /^(?:\$\{|process\.env|import\.meta\.env|env\.|your[_-]|example|placeholder|change[_-]?me|xxx|test)/i;

export const secretsScanner: Scanner = {
  name: 'secrets',
  async scan(context) {
    const findings: Finding[] = [];

    for (const file of context.files) {
      const content = await readSafeText(file, context.maxFileSizeBytes);
      if (content === undefined) continue;

      for (const rule of RULES) {
        rule.pattern.lastIndex = 0;
        for (const match of content.matchAll(rule.pattern)) {
          const value = match[rule.valueGroup];
          if (!value || PLACEHOLDER.test(value)) continue;
          const offset = match.index ?? 0;
          const prefix = content.slice(0, offset);
          const line = prefix.split('\n').length;
          const lastNewline = prefix.lastIndexOf('\n');

          findings.push({
            ruleId: rule.id,
            module: 'secrets',
            severity: rule.id === 'secrets/private-key' ? 'critical' : 'high',
            title: rule.title,
            description:
              'A value matching a credential pattern was found in a project file.',
            recommendation:
              'Remove the credential, rotate it, and load the replacement from a secure secret store.',
            location: {
              path: relativePath(context.root, file),
              line,
              column: offset - lastNewline,
            },
            evidence: maskSecret(value),
          });
        }
      }
    }

    return deduplicate(findings);
  },
};

function deduplicate(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = `${finding.location.path}:${finding.location.line}:${finding.evidence}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
