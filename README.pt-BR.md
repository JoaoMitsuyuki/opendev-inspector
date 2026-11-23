# OpenDev Inspector

Analisador open source, local e focado em segurança e saúde técnica de projetos.

O OpenDev Inspector examina uma pasta sem executar o código do projeto. O primeiro MVP detecta possíveis segredos expostos, configurações inseguras, declarações arriscadas de dependências e lacunas básicas de qualidade. Os relatórios podem ser lidos no terminal ou exportados em JSON.

> O OpenDev Inspector realiza verificações estáticas. Um relatório limpo não comprova que o projeto seja seguro.

## Estado atual

A versão `0.1.0` é um MVP local inicial. Ela ainda não foi publicada no npm.

## Requisitos

- Node.js 20.19 ou mais recente
- npm 10 ou mais recente

## Preparação local

```bash
npm install
npm run build
node dist/cli/index.js scan .
```

Durante o desenvolvimento:

```bash
npm run dev -- scan .
```

## Uso

```bash
# Executar todos os módulos
opendev scan .

# Selecionar módulos
opendev scan . --modules secrets,dependencies

# Gerar JSON
opendev scan . --format json --output report.json

# Retornar código 1 quando houver achado alto ou crítico
opendev scan . --fail-on high
```

Módulos disponíveis: `secrets`, `config`, `dependencies` e `quality`.

Por padrão, achados não alteram o código de saída. Uso inválido ou erro fatal da CLI retorna código 2. A opção `--fail-on` permite aplicar uma política.

## Modelo de segurança e privacidade

- A análise é local e nenhum código-fonte é enviado.
- Scripts, builds e instaladores do projeto nunca são executados.
- Credenciais detectadas são mascaradas nos relatórios.
- Links simbólicos e pastas comuns de dependências ou arquivos gerados são ignorados.
- Arquivos de texto maiores que 1 MB são ignorados por padrão; o limite é configurável.
- A ferramenta apenas relata achados e nunca modifica o projeto analisado.

As verificações de dependências deste MVP são locais e analisam o manifesto. Uma futura integração opcional com OSV poderá consultar vulnerabilidades públicas e documentará exatamente quais metadados de pacotes saem da máquina.

Vulnerabilidades de segurança devem ser relatadas de forma privada pela aba **Security** do GitHub, nunca em uma issue pública. Consulte [SECURITY.md](SECURITY.md).

## Desenvolvimento

```bash
npm run check
```

Esse comando executa lint, verificação de formatação, testes e build TypeScript. Consulte [CONTRIBUTING.md](CONTRIBUTING.md) e [docs/architecture.pt-BR.md](docs/architecture.pt-BR.md).

## Licença

MIT — consulte [LICENSE](LICENSE).
