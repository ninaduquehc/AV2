# Justificativas de Decisões Arquiteturais & Trade-offs - GreenCode API

## 1. Fastify vs. Express
* **Opção Escolhida**: Fastify
* **Justificativa**: O Fastify oferece suporte nativo a schemas JSON e TypeScript, além de performance significativamente superior em requisições/segundo. Sua integração transparente com a biblioteca Zod através de `fastify-type-provider-zod` permite compilar schemas de entrada e saída simultaneamente para a OpenAPI (Swagger).
* **Alternativa Rejeitada**: Express (devido à falta de tipagem nativa rigorosa em rotas e suporte ultrapassado para rotas assíncronas).

## 2. Monólito Modular vs. Microsserviços
* **Opção Escolhida**: Monólito Modular (Layered Architecture)
* **Justificativa**: Para o escopo do projeto de logística reversa e rastreabilidade, o monólito modular reduz complexidade operacional e latência de rede, permitindo gerenciar transações atômicas `ACID` no banco de dados durante atualizações de Lotes e Movimentações em massa via `prisma.$transaction`.
* **Alternativa Rejeitada**: Microsserviços (traria complexidade desnecessária de consistência eventual e gerência de infraestrutura).

## 3. Autenticação via JWT (Stateless) vs. Sessão
* **Opção Escolhida**: JWT (JSON Web Token)
* **Justificativa**: Permite escalabilidade horizontal do backend sem a necessidade de manter estados de sessão em memória ou servidor de cache (ex: Redis). Permite incluir os perfis do RBAC (`ADMIN`, `OPERADOR`) na assinatura criptográfica do payload.
* **Alternativa Rejeitada**: Sessões com Cookies (exigiria um repositório centralizado de sessões).

## 4. Bloqueio Otimista (OCC) vs. Lock Pessimista
* **Opção Escolhida**: Optimistic Concurrency Control (OCC) via coluna `version`
* **Justificativa**: O OCC é a solução ideal para cenários de alta leitura e concorrência moderada de escrita. Evita que conexões do banco fiquem presas (*deadlocks* ou retenção de conexões) aguardando locks de linha. Caso dois operadores tentem atualizar o mesmo equipamento simultaneamente, a query atômica `UPDATE ... WHERE id = x AND version = v` rejeita a requisição defasada com `409 Conflict`.
* **Alternativa Rejeitada**: Locks Pessimistas (`SELECT ... FOR UPDATE`), rejeitado pelo risco de degradação da latência e degradação da esteira de triagem.

## 5. Scope do Bloqueio Otimista (Somente Equipamentos)
* **Opção Escolhida**: `version` concentrado na entidade `Equipamento`
* **Justificativa**: É no equipamento que ocorrem as escritas concorrentes reais na esteira de reciclagem e triagem em lote. Aplicar colunas de versão em entidades estáticas ou de baixíssima frequência de alteração (como Organizações e Contratos) adicionaria complexidade desnecessária sem ganho prático.

## 6. Cálculos Financeiros no Serviço de Contratos
* **Opção Escolhida**: Armazenamento flexível das cláusulas financeiras (Valor base, Tarifas por Kg de resíduo, Multa de SLA) via tipo `Json` do PostgreSQL e método de estimativa de custo no `ContratoService`.