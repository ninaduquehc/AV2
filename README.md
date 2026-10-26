
# GreenCode API — Gestão de Logística Reversa de E-Lixo ♻️

API RESTful desenvolvida com **Fastify, TypeScript, Prisma ORM, Zod e PostgreSQL** para a gestão de logística reversa, rastreabilidade de resíduos eletrônicos e controle de contratos entre organizações geradoras e operadoras.

---

## 🚀 Tecnologias Utilizadas

- **Node.js (v18+)** — Ambiente de execução JavaScript.
- **TypeScript** — Tipagem estática.
- **Fastify** — Framework web de alta performance.
- **Prisma ORM** — Modelagem e manipulação do banco de dados.
- **Zod** — Validação de dados.
- **fastify-type-provider-zod** — Integração de validação e tipagem no Fastify.
- **PostgreSQL** — Banco de dados relacional.
- **Swagger / OpenAPI 3.0** — Documentação interativa da API.
- **JWT (JSON Web Token)** — Autenticação de usuários.
- **Bcrypt** — Hashing seguro de senhas.
- **Jest** — Testes automatizados.

---

## 🔐 Autenticação e Controle de Acesso (RBAC)

A API utiliza autenticação por **JSON Web Token (JWT)**. Para acessar as rotas protegidas, envie o token no cabeçalho HTTP:

```http
Authorization: Bearer <seu_token_jwt>
```

### Papéis de usuário

O controle de acesso é baseado em papéis (*Role-Based Access Control — RBAC*).

| Papel | Permissões |
|---|---|
| `ADMIN` | Acesso administrativo, incluindo CRUD de usuários, contratos e organizações, além das operações de exclusão autorizadas. |
| `OPERADOR` | Cadastro e atualização de lotes e equipamentos, além do registro de movimentações. |
| `CLIENTE` | Acesso de leitura para consultas e rastreabilidade das informações autorizadas. |

As permissões efetivas dependem das regras de autorização configuradas nas rotas da aplicação.

---

## 📋 Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/)
- npm
- [PostgreSQL](https://www.postgresql.org/)
- Git

---

## ⚙️ Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_REPOSITORIO>
```

Substitua os valores entre `< >` pelo endereço e nome reais do repositório.

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto, utilizando o `.env.example` como referência.

Exemplo de configuração:

```ini
PORT=3000
HOST=0.0.0.0
JWT_SECRET=sua_chave_secreta_jwt_longa
DATABASE_URL="postgresql://usuario:senha@localhost:5432/greencode_db?schema=public"
CORS_ORIGIN="*"
```

**Importante:**

- Substitua as credenciais do banco de dados pelos valores do seu ambiente.
- Utilize um segredo JWT forte e exclusivo.
- Não compartilhe nem versione o arquivo `.env`.
- Em produção, configure o CORS para permitir somente as origens autorizadas.

### 4. Configurar o banco de dados

Com o PostgreSQL em execução e a variável `DATABASE_URL` configurada, execute as migrações do Prisma:

```bash
npx prisma migrate dev
```

Para popular o banco com os dados iniciais, execute:

```bash
npx prisma db seed
```

A execução do *seed* depende de sua configuração no projeto.

---

## 🛠️ Executando a Aplicação

### Modo de desenvolvimento

```bash
npm run dev
```

### Interface CLI

```bash
npm run cli
```

Os comandos dependem dos scripts configurados no arquivo `package.json`.

---

## 📚 Documentação da API

Com a aplicação em execução, acesse:

- **Swagger UI:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

A documentação Swagger permite visualizar os endpoints, consultar os schemas e testar as requisições disponíveis.

---

## 🧪 Testes Automatizados

Para executar os testes automatizados configurados no projeto, utilize:

```bash
npm test
```

Os testes podem abranger funcionalidades unitárias e de integração, conforme a implementação existente.

---

## 📐 Estrutura do Projeto

```text
src/
├── controllers/    # Controle das requisições e respostas HTTP
├── services/       # Regras de negócio e operações da aplicação
├── repositories/   # Acesso aos dados por meio do Prisma
├── routes/         # Rotas e schemas de validação Zod/Swagger
├── middlewares/    # Autenticação JWT e controle de acesso RBAC
├── models/         # Classes e modelos de erro personalizados
├── utils/          # Funções utilitárias e tratamento de erros
├── lib/            # Instâncias compartilhadas, como o Prisma Client
├── app.ts          # Configuração do Fastify e de seus plugins
└── server.ts       # Inicialização do servidor e encerramento controlado
```

---

## 🔄 Funcionalidades Principais

- Autenticação de usuários com JWT.
- Controle de permissões baseado em papéis (RBAC).
- Gerenciamento de organizações.
- Gerenciamento de contratos.
- Cadastro e atualização de lotes de resíduos eletrônicos.
- Cadastro e atualização de equipamentos.
- Registro de movimentações para rastreabilidade.
- Persistência de dados em PostgreSQL com Prisma ORM.
- Validação de dados utilizando Zod.
- Documentação interativa com Swagger.
- Testes automatizados com Jest.
- Verificação de disponibilidade por meio do endpoint de health check.
- Interface de linha de comando (CLI).

*Observação: a disponibilidade e o comportamento de cada funcionalidade dependem da implementação atual da API.*

---

## 🔒 Boas Práticas de Segurança

- Armazene segredos e credenciais em variáveis de ambiente.
- Não versione arquivos `.env` nem exponha tokens JWT.
- Armazene senhas utilizando hashing seguro, nunca em texto puro.
- Valide os dados de entrada antes de processá-los.
- Restrinja o acesso aos endpoints conforme o papel do usuário.
- Configure o CORS de acordo com os ambientes autorizados.
- Utilize HTTPS em ambientes de produção.
- Mantenha as dependências atualizadas.

---

## 👥 Contribuição

Para contribuir com o projeto:

1. Crie uma branch para sua alteração.
2. Implemente a funcionalidade ou correção.
3. Execute os testes automatizados.
4. Verifique se a aplicação inicia corretamente.
5. Envie suas alterações por meio de um Pull Request.

---

## 📄 Licença

Consulte o arquivo `LICENSE`, caso exista no repositório, para obter informações sobre a licença do projeto.
