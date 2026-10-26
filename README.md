# GreenCode API - Logística Reversa de E-Lixo ♻️

API RESTful para gestão de logística reversa, rastreabilidade e reciclagem de resíduos eletrônicos, desenvolvida com foco em alta integridade de dados, controle de concorrência e arquitetura em camadas.

---

## 🚀 Tecnologias

- **Node.js** (v20+) e **TypeScript**
- **Fastify** (com `fastify-type-provider-zod`)
- **Prisma ORM** e **PostgreSQL 16**
- **Zod** (validação de schemas e OpenAPI)
- **Vitest** (testes de integração automatizados)
- **Swagger UI** (documentação interativa das rotas)
- **Docker Compose** (containerização do banco de dados)

---

## 🎯 Principais Recursos e Regras de Negócio

- **Máquina de Estados Finita (FSM):** transições estritas e validadas para o ciclo de vida dos equipamentos, da recepção ao descarte ou reuso.
- **Controle de Concorrência Otimista (OCC):** prevenção de *race conditions* e edições simultâneas através do versionamento atômico (`version`).
- **Autenticação e RBAC:** controle de acesso baseado em perfis (`ADMIN`, `OPERADOR`, `CLIENTE`) via tokens JWT stateless.
- **Rastreabilidade e Auditoria:** histórico de movimentações por equipamento com proteção por chave estrangeira `Restrict`.
- **Cálculo Financeiro de Contratos:** estimativa de faturamento (valor base mensal + tarifa por kg + multa potencial) pela rota `GET /contratos/:id/faturamento?pesoTotalKg=100`, disponível para `ADMIN` e `OPERADOR`.
- **Resiliência:** tratamento centralizado de exceções, *rate limiting* contra ataques de força bruta e suporte a *Graceful Shutdown* (`SIGINT`/`SIGTERM`).

---

## 📋 Pré-requisitos

- **Node.js** v20 ou superior
- **npm** v10 ou superior
- **Docker** e **Docker Compose**

---

## 📦 Como Rodar a Aplicação

### 1. Clone o repositório e configure as variáveis de ambiente

Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/ninaduquehc/AV2.git
cd AV2
```

Copie o arquivo de exemplo das variáveis de ambiente.

**Linux / macOS (Bash):**

```bash
cp .env.example .env
```

**Windows (CMD):**

```cmd
copy .env.example .env
```

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

### 2. Inicie o PostgreSQL via Docker e instale as dependências

```bash
docker-compose up -d
npm install
```

### 3. Prepare o banco de dados

Execute as migrações e popule o banco com a massa de dados inicial (*seed*):

```bash
npm run migrate
npm run seed
```

### 4. Inicie o servidor em modo de desenvolvimento

```bash
npm run dev
```

---

## 📖 Documentação das Rotas (Swagger)

Com a aplicação em execução, acesse a documentação interativa OpenAPI no navegador:

**Swagger UI:** http://localhost:3000/docs

---

## 🔐 Credenciais Padrão para Testes (Seed)

Após executar `npm run seed`, utilize as credenciais abaixo para autenticação na API ou no Swagger.

| Perfil | E-mail | Senha | Permissões |
|---|---|---|---|
| **ADMIN** | `admin@greencode.com` | `admin123` | Acesso total: usuários, contratos, lotes, equipamentos e organizações |
| **OPERADOR** | `operador@greencode.com` | `operador123` | Gestão operacional: lotes, equipamentos e movimentações |

---

## 🧪 Testes Automatizados

Para executar a suíte de testes de integração com Vitest, utilize:

```bash
npm test
```

Os testes cobrem autenticação (401), RBAC (403), validações Zod (400), FSM (422), regras de negócio e concorrência otimista (409), movimentação em massa e cálculo de faturamento. Eles usam os dados do seed, então rode `npm run seed` antes.

---

## 📚 Documentação Complementar

- 🔒 **Segurança:** políticas de *rate limiting*, *timing attacks* e proteções web em [`DOCS/SEGURANCA.md`](DOCS/SEGURANCA.md).
- 📐 **Arquitetura e FSM:** diagrama de classes UML e fluxo de estados dos equipamentos em [`DOCS/UML.md`](DOCS/UML.md).
- 💡 **Decisões Técnicas:** justificativas de tecnologia, *trade-offs* e escolhas de design em [`DOCS/DECISOES.md`](DOCS/DECISOES.md).

---

## ✅ Validação Final e Execução dos Testes

Execute os comandos abaixo para popular o banco com os dados iniciais e executar os testes automatizados:

```bash
npm run seed
npm test
```