
# Políticas e Arquitetura de Segurança - GreenCode API

## 1. Proteção contra Timing Attacks e Brute Force no Login

- **Constant Time Lookup:** utilização de um hash fixo de 60 caracteres (`HASH_FALSO`) no `bcrypt.compare` quando o e-mail informado não está cadastrado, reduzindo diferenças no tempo de resposta e dificultando a enumeração de usuários.
- **Rate Limiting Estrito no Login:** o endpoint `/auth/login` é limitado a, no máximo, 5 requisições por minuto por endereço IP em ambientes de desenvolvimento e produção.
- **Ambiente de Testes:** o rate limiting do login é desativado automaticamente quando `NODE_ENV=test`.
- **Rate Limiting Global:** limite de 100 requisições por minuto por endereço IP para as demais rotas.

## 2. Bloqueio Otimista (Optimistic Concurrency Control - OCC)

A API utiliza controle otimista de concorrência para prevenir conflitos de escrita e condições de corrida (*race conditions*) durante atualizações concorrentes de equipamentos.

- A coluna `version` identifica a versão atual do registro.
- As atualizações verificam a versão esperada antes de modificar o registro.
- A operação utiliza consultas atômicas com `updateMany({ where: { id, version } })`.
- Quando uma atualização não pode ser realizada devido a um conflito de concorrência, a API retorna `409 Conflict`.

## 3. Máquina de Estados Finita (FSM) e Validação de Transições

Os equipamentos seguem um fluxo controlado de estados para garantir a rastreabilidade durante o processo de logística reversa.

- As transições de status devem respeitar as regras definidas pela máquina de estados.
- Tentativas de transições inválidas, como alterar diretamente de `RECEBIDO` para `DESCARTE`, são rejeitadas com `422 Unprocessable Entity`.
- Lotes com status `CANCELADO` bloqueiam novas movimentações dos equipamentos vinculados.

## 4. Segurança de Cabeçalhos HTTP

A aplicação utiliza a biblioteca `@fastify/helmet` para configurar cabeçalhos HTTP de segurança e ajudar a mitigar vulnerabilidades web comuns, incluindo:

- **XSS:** Cross-Site Scripting.
- **Clickjacking:** tentativas de inserir a aplicação em páginas maliciosas.
- **MIME Sniffing:** interpretação indevida do tipo de conteúdo pelo navegador.

## 5. Considerações Finais

As medidas descritas devem corresponder às configurações efetivamente implementadas na aplicação. Alterações nos mecanismos de autenticação, controle de concorrência, transições de status ou cabeçalhos de segurança devem ser acompanhadas de testes automatizados.

