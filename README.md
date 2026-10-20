# greencode

CLI de gestão de logística reversa de resíduos eletrônicos — Atividade Avaliativa
Individual 1, FATEC, prof. Gerson Penha.

## Requisitos
- Node.js 18+
- Windows 10+ ou Linux Ubuntu 24.04+ (ou derivados)

## Instalação
```bash
npm install
```

## Uso
```bash
npm run dev
```

Na primeira execução, o sistema entra em modo de provisionamento: pede a senha do
administrador e gera automaticamente a chave de criptografia AES-256. Nas execuções
seguintes, pede login diretamente.

Digite `ajuda` a qualquer momento para ver os comandos disponíveis ao seu papel, ou
`menu` para um modo guiado.

## Testes
```bash
npx ts-node src/testes/jornada.ts
npx ts-node src/testes/falhas.ts
```

O primeiro simula a jornada completa (provisionamento → cadastros → movimentações →
rastreabilidade). O segundo valida os cenários de falha (CNPJ inválido, datas fora
da janela permitida, transições de status inválidas, justificativa obrigatória).
Ambos usam uma pasta `data/` isolada, apagada no início de cada execução.

## Arquitetura
Veja `docs/SEGURANCA.md` para a justificativa das escolhas de criptografia, hash de
senhas, expiração de sessão e os cenários de falha cobertos.

Estrutura de pastas: `auth/` (autenticação e permissões), `cli/` (entrada, parser,
autocompletar), `commands/` (ações da CLI), `config/` (caminhos e provisionamento),
`models/` (entidades de domínio), `persistence/` (criptografia, journal,
repositório), `utils/`.

## Papéis
`administrador`, `operador_cadastro`, `gestor_almoxarifado`, `auditor` — permissões
definidas em `src/auth/permissoes.ts`.