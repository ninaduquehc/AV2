
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
- Docker
- Docker Compose

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

Configure os valores necessários no arquivo `.env`.

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

**Swagger UI:** http://localhost:3000/docs

## 🧪 Rodando os Testes

Para executar os testes automatizados:

```bash
npm test
```

Os testes utilizam Vitest, conforme a configuração do projeto.

## 🔐 Credenciais Padrão (Seed)

Após executar o Seed, as credenciais abaixo poderão ser utilizadas, caso estejam configuradas nos dados iniciais:

| E-mail | Senha | Perfil |
|---|---|---|
| `admin@greencode.com` | `admin123` | `ADMIN` |
| `operador@greencode.com` | `operador123` | `OPERADOR` |

**Atenção:** essas credenciais são destinadas ao ambiente de desenvolvimento. Altere as senhas padrão antes de utilizar a aplicação em ambientes expostos.

## 🔒 Segurança

A API implementa mecanismos de autenticação, controle de acesso baseado em papéis (RBAC), proteção contra tentativas de enumeração de usuários e controle de concorrência nas operações de atualização.

Para conhecer os mecanismos de segurança implementados, consulte o documento [`SEGURANCA.md`](SEGURANCA.md).

## 🛠️ Comandos Finais de Validação

Para iniciar o banco, aplicar as migrações, popular os dados e executar os testes:

```bash
docker-compose up -d
npm run migrate
npm run seed
npm test
```

**Observação:** os comandos `migrate` e `seed` precisam estar definidos no arquivo `package.json`. O arquivo `.env.example`, o serviço PostgreSQL do Docker Compose e as configurações do Vitest também devem existir no projeto.
