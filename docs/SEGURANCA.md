# Arquitetura e Diretrizes de Segurança - GreenCode API (AV2)

## 1. Autenticação e Gestão de Sessão (JWT & Bcrypt)
- **Tokens JWT:** A autenticação é realizada via token Bearer no cabeçalho `Authorization`. A sessão é válida por 8 horas, e o segredo de assinatura é configurado via variável de ambiente obrigatória `JWT_SECRET`.
- **Hashing de Senhas com Bcrypt:** Senhas são criptografadas com `bcrypt` (fator de custo 10) e nunca armazenadas em texto puro.
- **Proteção contra Timing Attacks e Enumeração:** No endpoint `POST /auth/login`, o sistema executa o `bcrypt.compare` mesmo quando o e-mail não é encontrado no banco de dados, utilizando um hash simulação. Isso garante tempo de resposta constante e impede que atacantes descubram quais e-mails estão cadastrados.
- **Normalização de Dados:** E-mails são higienizados com `trim().toLowerCase()` antes de qualquer consulta ou inserção.

## 2. Controle de Acesso Baseado em Papéis (RBAC)
O acesso às rotas é restrito pelo middleware `authorize` de acordo com a `role` contida no payload do JWT:
- **`ADMIN`:** Acesso total (gestão de usuários, criação e remoção de contratos, organizações e deleções de entidades).
- **`OPERADOR`:** Operações do dia a dia da logística reversa (cadastro de lotes, equipamentos e registro de movimentações de status).
- **`CLIENTE`:** Permissão estrita de leitura (consultas e rastreabilidade).

## 3. Integridade e Concorrência (Bloqueio Otimista e Transações)
- **Bloqueio Otimista (Optimistic Locking):** A entidade `Equipamento` possui um campo incremental `version`. Durante transições de status (individuais ou em massa), o sistema exige que a versão enviada pelo cliente corresponda à versão atual no banco. Se houver divergência, é lançado um `ConflitoDeVersaoError` (HTTP 409).
- **Operações Atômicas e Transacionais:** Processos críticos (como a movimentação em massa e a criação de lote acompanhado de equipamentos) são executados dentro de transações do banco via `prisma.$transaction`. Se qualquer item falhar, toda a operação sofre *rollback*.

## 4. Auditoria e Rastreabilidade
- Toda transição de status gera um registro imutável na tabela `MovimentacaoEquipamento`, armazenando a data/hora, o estado anterior, o novo estado, o usuário responsável (`usuarioId`) e observações opcionais.

---

## 5. Cenários de Falha e Comportamentos Esperados

| Cenário de Falha / Teste | Comportamento Esperado | Código HTTP |
|---|---|---|
| Credenciais inválidas no login | Rejeitado em tempo constante sem revelar se o e-mail existe | `401 Unauthorized` |
| Token JWT ausente ou expirado | Acesso negado pelos middlewares de autenticação | `401 Unauthorized` |
| Usuário OPERADOR tentando deletar contrato | Bloqueado pelo middleware RBAC | `403 Forbidden` |
| CNPJ inválido ou já cadastrado | Validação do Zod rejeita antes de chamar a regra de negócio / Banco captura duplicidade | `400 Bad Request` ou `409 Conflict` |
| Tentativa de alterar equipamento desatualizado | Concorrência detectada via bloqueio otimista (`version`) | `409 Conflict` |
| Vigência de fim de contrato anterior à de início | Rejeitado pela regra de negócio | `422 Unprocessable Entity` |
| Remoção de lote com equipamentos vinculados | Ação bloqueada para manter a integridade referencial | `409 Conflict` |
| Erro de validação de campos (Zod) | Retorna array estruturado `detalhes` mapeando cada campo e sua mensagem | `400 Bad Request` |