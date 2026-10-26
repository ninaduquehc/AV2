
# Políticas e Arquitetura de Segurança - GreenCode API

Este documento descreve os mecanismos de segurança implementados na GreenCode API para proteger a autenticação, controlar o acesso aos recursos e garantir a consistência das operações.

## 1. Proteção de Autenticação e Prevenção contra Timing Attacks

- **Bcrypt e hash falso:** no endpoint de login (`POST /auth/login`), a aplicação utiliza um hash falso (`HASH_FALSO`) quando o e-mail informado não corresponde a um usuário existente. A verificação de senha também é executada nesse cenário para reduzir diferenças no tempo de resposta.
- **Mensagens genéricas:** falhas de autenticação retornam a mensagem `E-mail ou senha inválidos.`, evitando revelar se determinado e-mail está cadastrado.
- **Proteção contra enumeração:** essas medidas dificultam a identificação de usuários válidos por meio da análise das respostas da API.

## 2. Controle Otimista de Concorrência (Optimistic Concurrency Control)

Para evitar condições de corrida (*Race Conditions*) e atualizações concorrentes indesejadas, a API utiliza controle de versão incremental por meio do campo `version`.

- A atualização considera o identificador do registro e sua versão atual.
- A operação utiliza `updateMany({ where: { id, version } })` para verificar se a versão esperada ainda corresponde à versão persistida.
- As operações são executadas dentro de transações do Prisma, conforme a implementação do projeto.
- Caso a versão tenha sido alterada por outra operação, a atualização pode ser rejeitada, evitando sobrescrever silenciosamente dados mais recentes.

## 3. Controle de Acesso Baseado em Papéis (RBAC)

A API utiliza controle de acesso baseado em papéis (*Role-Based Access Control — RBAC*).

### Perfis suportados

- **ADMIN:** acesso administrativo às funcionalidades autorizadas, incluindo a gestão de usuários e a criação de contratos.
- **OPERADOR:** acesso às funcionalidades operacionais autorizadas, como operações relacionadas a equipamentos, lotes e movimentações.
- **CLIENTE:** acesso de leitura às consultas e informações de rastreabilidade permitidas.

As permissões devem ser verificadas nas rotas e nos mecanismos de autorização correspondentes.

## 4. Proteção da Infraestrutura

### Rate Limiting

A aplicação utiliza `@fastify/rate-limit` para limitar a frequência das requisições.

- Limite configurado: 100 requisições por minuto por endereço IP.
- Objetivo: reduzir abusos, requisições excessivas e determinadas formas de negação de serviço.

### Cabeçalhos de Segurança HTTP

A aplicação utiliza `@fastify/helmet` para configurar cabeçalhos HTTP de segurança.

Esses cabeçalhos ajudam a reduzir a exposição a determinados riscos comuns em aplicações web.

## 5. Proteção de Credenciais e Variáveis de Ambiente

- Segredos, credenciais e configurações sensíveis devem ser armazenados em variáveis de ambiente.
- O arquivo `.env` não deve ser enviado ao repositório.
- O arquivo `.env.example` deve conter apenas valores de exemplo, sem credenciais reais.
- O segredo utilizado para assinar tokens JWT deve ser forte e mantido em sigilo.
- As credenciais padrão de desenvolvimento devem ser alteradas antes da implantação em ambientes expostos.

## 6. Validação de Dados

A API utiliza Zod para validar os dados recebidos pelas rotas.

A validação ajuda a rejeitar entradas inválidas antes que sejam processadas pelas regras de negócio, contribuindo para a integridade dos dados e a previsibilidade das respostas.

## 7. Considerações Finais

Os mecanismos descritos devem permanecer alinhados com a implementação real da aplicação.

Recomenda-se executar os testes automatizados após alterações nas rotas, na autenticação, nas permissões ou nas operações de persistência.
