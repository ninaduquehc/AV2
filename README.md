
# GreenCode API - Logística Reversa de E-Lixo ♻️

API RESTful para gestão de logística reversa, rastreabilidade e reciclagem de resíduos eletrônicos.

## 🚀 Tecnologias

- **Node.js** v20+
- **TypeScript** e **Fastify**
- **Prisma ORM** e **PostgreSQL**
- **Zod** — Validação de dados e schemas OpenAPI
- **Vitest** — Testes automatizados de integração
- **Swagger UI** — Documentação interativa da API
- **Docker Compose** — Gerenciamento do ambiente de desenvolvimento

## 📋 Pré-requisitos

- Node.js v20 ou superior
- npm
- Docker e Docker Compose

## 📦 Como Rodar a Aplicação com Docker

### 1. Configure as variáveis de ambiente

Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/ninaduquehc/AV2.git
cd AV2
```

Copie o arquivo de exemplo das variáveis de ambiente:

```bash
cp .env.example .env
```

Configure as variáveis necessárias no arquivo `.env`.

### 2. Inicie o banco de dados PostgreSQL

```bash
docker-compose up -d
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Execute as migrações do banco de dados

```bash
npm run migrate
```

### 5. Popule o banco de dados

```bash
npm run seed
```

### 6. Inicie o servidor

```bash
npm run dev
```

## 📖 Documentação da API

Com a aplicação em execução, acesse a documentação interativa do Swagger:

**Swagger UI:** [http://localhost:3000/docs](http://localhost:3000/docs)

## 🧪 Rodando os Testes

Para executar os testes automatizados de integração:

```bash
npm test
```

A suíte de testes utiliza Vitest para validar funcionalidades como autenticação, controle de acesso baseado em papéis (RBAC), máquina de estados finita (FSM), controle otimista de concorrência (OCC) e regras de negócio.

## 🔐 Credenciais Padrão (Seed)

Após executar `npm run seed`, as seguintes credenciais estarão disponíveis para testes no ambiente de desenvolvimento:

| E-mail | Senha | Perfil |
|---|---|---|
| `admin@greencode.com` | `admin123` | `ADMIN` |
| `operador@greencode.com` | `operador123` | `OPERADOR` |

**Atenção:** essas credenciais são destinadas ao desenvolvimento. Altere as senhas padrão antes de utilizar a aplicação em ambientes expostos.

## 🔒 Segurança e Arquitetura

A API implementa mecanismos de autenticação JWT, controle de acesso baseado em papéis (RBAC), proteção contra ataques de temporização (*timing attacks*), limitação de requisições (*rate limiting*), validação de transições de estado e controle otimista de concorrência.

Para mais detalhes sobre a arquitetura e as políticas de segurança, consulte [`DOCS/SEGURANCA.md`](DOCS/SEGURANCA.md).

## 📐 Diagrama de Classes e Máquina de Estados

A documentação da arquitetura e do fluxo de estados dos equipamentos está disponível em [`DOCS/UML.md`](DOCS/UML.md).

## 🛠️ Validação Final

Para aplicar a migration de ajuste da chave estrangeira de movimentações, popular o banco e executar os testes:

```bash
npx prisma migrate dev --name ajuste_fkey_movimentacao_restrict
npm run seed
npm test
```