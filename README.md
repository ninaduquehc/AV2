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
npm test
```

Ou individualmente:

```bash
npx ts-node src/testes/jornada.ts
npx ts-node src/testes/falhas.ts
npx ts-node src/testes/crud.ts
```

O primeiro simula a jornada completa (provisionamento → cadastros → movimentações →
rastreabilidade). O segundo valida os cenários de falha (CNPJ inválido, datas fora
da janela permitida, transições de status inválidas, justificativa obrigatória).
O terceiro cobre o CRUD completo (criar, listar, consultar, atualizar, remover) de organização,
contrato, lote, equipamento e usuário, incluindo integridade referencial e permissões por papel.
Todos usam uma pasta `data/` isolada, apagada no início de cada execução.

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

## CRUD por entidade
Todas as entidades seguem o mesmo padrão `<entidade> <criar|listar|consultar|atualizar|remover>`
(`usuario`, `organizacao`, `contrato`, `lote`, `equipamento`). Digite `ajuda` para a sintaxe completa.

- `listar` e `consultar` são leitura e ficam disponíveis a todos os papéis de cadastro, inclusive o auditor.
- `criar`, `atualizar` e `remover` exigem a permissão de escrita da entidade.
- Não se remove registro que tenha dependentes: organização com contratos/lotes, lote com
  equipamentos, equipamento já triado ou com movimentações, usuário administrador.
- Movimentações são trilha de auditoria imutável e só têm consulta (`relatorio rastrear`).
- Toda escrita é registrada no journal; senhas nunca vão para ele.
