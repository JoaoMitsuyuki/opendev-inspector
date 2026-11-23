# Architecture

## Design goals

OpenDev Inspector separates the interface, orchestration, scanners, and reporters so new front ends and checks do not require rewriting the core. The MVP favors deterministic local checks and explicit limitations.

```text
CLI -> scanProject -> file discovery -> scanner registry -> findings -> reporters
```

## Contracts

Each scanner implements a small `Scanner` interface, has a stable module name, receives a read-only scan context, and returns normalized findings. A finding includes a stable rule ID, severity, explanation, recommendation, and location. Reporters consume only the normalized `ScanResult` contract.

## Safety boundaries

Discovery never follows symbolic links and skips dependency, VCS, build, and coverage directories. Scanners read bounded regular files only. The core never loads project modules or invokes package-manager commands. Secret evidence must be masked before it enters a result object, so every reporter inherits the same protection.

## MVP modules

- `secrets`: high-confidence credential patterns plus conservative generic assignments.
- `config`: sensitive environment files, TypeScript strict mode, and container user checks.
- `dependencies`: malformed manifests, missing lockfiles, and unbounded versions.
- `quality`: presence of tests and primary documentation.

Known-vulnerability lookup, SARIF/HTML output, plugin loading, GitHub Actions distribution, and framework-specific rules remain post-MVP work.
