
# Políticas e Arquitetura de Segurança - GreenCode API

Este documento descreve os mecanismos de segurança utilizados na GreenCode API para proteger a autenticação, controlar o acesso aos recursos e preservar a consistência das operações.

## 1. Proteção contra Timing Attacks e Brute Force no Login

### Constant Time Lookup

A autenticação utiliza `bcrypt.compare` com um hash falso (`HASH_FALSO`) quando o e-mail informado não corresponde a um usuário existente.

Essa abordagem busca reduzir diferenças no tempo de resposta entre e-mails existentes e inexistentes, dificultando ataques de enumeração de usuários por análise temporal.

### Rate Limiting no Login

O endpoint `POST /auth/login` possui limite configurado de até 5 tentativas por minuto por endereço IP, conforme a configuração de segurança informada.

### Rate Limiting Global

Os demais endpoints possuem limite global de 100 requisições por minuto por endereço IP.

O objetivo é reduzir o abuso de requisições e mitigar determinadas tentativas automatizadas de sobrecarga.

## 2. Controle Otimista de Concorrência (Optimistic Concurrency Control)

A API utiliza controle de versão por meio do atributo `version` para reduzir o risco de condições de corrida (*Race Conditions*) durante atualizações concorrentes de equipamentos.

A estratégia descrita utiliza:

```typescript
updateMany({
    where: {
        id,
        version
    }
})
```

A atualização condicionada ao identificador e à versão esperada permite detectar alterações concorrentes. Se nenhum registro for atualizado, a aplicação deve tratar o caso conforme as regras de negócio.

A operação deve ser executada de maneira compatível com as transações e a estratégia de persistência utilizadas pelo Prisma.

## 3. Máquina de Estados Finita (FSM)

Os equipamentos seguem um fluxo controlado de estados durante o processo de logística reversa.

As transições permitidas devem ser validadas pela aplicação para impedir mudanças incompatíveis com o ciclo de rastreabilidade.

Tentativas de transição ilegal devem retornar `422 Unprocessable Entity`, conforme o comportamento definido para a API.

## 4. Controle de Acesso (RBAC)

O controle de acesso baseado em papéis (*Role-Based Access Control — RBAC*) restringe as operações de acordo com o perfil do usuário autenticado.

Os papéis definidos para o sistema são:

- `ADMIN`
- `OPERADOR`
- `CLIENTE`

Cada rota deve aplicar as permissões correspondentes à operação e ao perfil do usuário.

## 5. Boas Práticas de Segurança

- Armazenar segredos e credenciais em variáveis de ambiente.
- Não versionar arquivos `.env` com informações sensíveis.
- Utilizar senhas fortes e hashing seguro.
- Validar os dados recebidos pela API.
- Aplicar limites de requisições nos endpoints.
- Restringir o acesso aos recursos conforme as permissões configuradas.
- Manter as dependências atualizadas.
- Executar os testes automatizados após alterações nas regras de segurança.

## 6. Considerações Finais

As configurações e os mecanismos documentados devem corresponder à implementação efetiva da aplicação. Recomenda-se validar os limites de requisições, o comportamento de autenticação, as transições de estado e o controle de concorrência por meio de testes automatizados.
