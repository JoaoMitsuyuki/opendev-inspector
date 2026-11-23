# OpenDev Inspector

Local-first, open-source security and project health analyzer.

OpenDev Inspector scans a directory without executing project code. Its first MVP detects likely exposed secrets, insecure configuration, risky dependency declarations, and basic quality gaps. Reports are available for humans in the terminal and for tools as JSON.

> OpenDev Inspector performs static checks. A clean report does not prove that a project is secure.

## Status

Version `0.1.0` is an early local MVP. It is not published to npm yet.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Local setup

```bash
npm install
npm run build
node dist/cli/index.js scan .
```

During development:

```bash
npm run dev -- scan .
```

## Usage

```bash
# Run every module
opendev scan .

# Select modules
opendev scan . --modules secrets,dependencies

# Produce JSON
opendev scan . --format json --output report.json

# Return exit code 1 when a high-or-critical finding exists
opendev scan . --fail-on high
```

Available modules: `secrets`, `config`, `dependencies`, and `quality`.

By default, findings do not change the exit code. Invalid usage or a fatal CLI error returns code 2. `--fail-on` enables policy enforcement.

## Security and privacy model

- The scan is local and uploads no source code.
- Project scripts, builds, and installers are never executed.
- Detected credential values are masked in reports.
- Symbolic links and common generated or dependency directories are skipped.
- Text files larger than 1 MB are skipped by default; the limit is configurable.
- The scanner reports findings but never modifies the scanned project.

Dependency checks in this MVP are offline manifest checks. A later opt-in OSV integration may query public vulnerability data and will document exactly which package metadata leaves the machine.

Security vulnerabilities should be reported privately through GitHub's **Security** tab, not through a public issue. See [SECURITY.md](SECURITY.md).

## Development

```bash
npm run check
```

This runs linting, formatting verification, tests, and the TypeScript build. See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/architecture.md](docs/architecture.md).

Portuguese documentation: [README.pt-BR.md](README.pt-BR.md).

## License

MIT — see [LICENSE](LICENSE).
