# Arquitetura

## Objetivos

O OpenDev Inspector separa interface, orquestração, scanners e relatórios. Assim, novas interfaces e verificações não exigem reescrever o núcleo. O MVP prioriza verificações locais determinísticas e limitações explícitas.

```text
CLI -> scanProject -> descoberta de arquivos -> registro de scanners -> achados -> relatórios
```

## Contratos

Cada scanner implementa uma interface `Scanner` pequena, possui um nome de módulo estável, recebe um contexto de análise somente leitura e retorna achados normalizados. Cada achado inclui identificador de regra, severidade, explicação, recomendação e localização. Os relatórios consomem apenas o contrato normalizado `ScanResult`.

## Limites de segurança

A descoberta não segue links simbólicos e ignora pastas de dependências, controle de versão, build e cobertura. Scanners leem apenas arquivos regulares com tamanho limitado. O núcleo nunca carrega módulos do projeto nem chama gerenciadores de pacotes. Evidências de segredos são mascaradas antes de entrar no resultado, portanto todos os formatos de relatório recebem a mesma proteção.

## Módulos do MVP

- `secrets`: padrões de credenciais com alta confiança e atribuições genéricas conservadoras.
- `config`: arquivos de ambiente sensíveis, modo estrito do TypeScript e usuário de contêiner.
- `dependencies`: manifestos inválidos, ausência de lockfile e versões sem limite.
- `quality`: presença de testes e documentação principal.

Consulta de vulnerabilidades conhecidas, relatórios SARIF/HTML, plugins, distribuição por GitHub Actions e regras específicas de frameworks ficam para depois do MVP.
