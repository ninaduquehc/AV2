
# GreenCode API - Logística Reversa de E-Lixo ♻️

API RESTful desenvolvida com **Fastify, TypeScript, Prisma ORM e PostgreSQL/SQLite** para gerenciamento e rastreabilidade da logística reversa de resíduos eletrônicos.

## 🚀 Tecnologias

- **Node.js (v20+)** com **TypeScript**
- **Fastify** — Framework web de alta performance
- **fastify-type-provider-zod** — Integração de validação e tipagem
- **Prisma ORM** — Mapeamento objeto-relacional
- **Zod** — Validação de dados e schemas
- **Swagger UI / OpenAPI** — Documentação interativa da API
- **BCrypt** — Hashing de senhas
- **JWT** — Autenticação e controle de acesso baseado em papéis (RBAC)

## 📋 Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v20 ou superior
- npm

## 🔧 Configuração e Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/ninaduquehc/AV2.git
cd AV2
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua_chave_secreta_aqui"
PORT=3000
```

**Importante:** substitua o segredo JWT de exemplo por uma chave forte e mantenha o arquivo `.env` fora do controle de versão.

### 4. Execute as migrações do banco de dados

```bash
npx prisma migrate dev
```

### 5. Execute o Seed

Para inserir os dados iniciais no banco de dados:

```bash
npx prisma db seed
```

### 6. Inicie a aplicação

```bash
npm run dev
```

## 📖 Documentação da API (Swagger)

Com a aplicação em execução, acesse a documentação interativa para visualizar e testar os endpoints:

**Swagger UI:** http://localhost:3000/docs

## 🔐 Usuários Padrão (Seed)

Após executar o Seed, os seguintes usuários estarão disponíveis, conforme a configuração dos dados iniciais:

| E-mail | Senha | Perfil |
|---|---|---|
| `admin@greencode.com` | `admin123` | `ADMIN` |
| `operador@greencode.com` | `operador123` | `OPERADOR` |

**Atenção:** as credenciais acima são destinadas ao ambiente de desenvolvimento. Altere as senhas padrão antes de utilizar a aplicação em qualquer ambiente exposto.

## 🔑 Autenticação e Controle de Acesso (RBAC)

A API utiliza **JSON Web Token (JWT)** para autenticação. Nas rotas protegidas, envie o token no cabeçalho HTTP:

```http
Authorization: Bearer <seu_token_jwt>
```

O controle de acesso é realizado de acordo com os papéis dos usuários, conforme as permissões definidas na aplicação.

## 🗂️ Banco de Dados

O projeto utiliza o Prisma ORM para gerenciar o acesso e as migrações do banco de dados.

A configuração apresentada utiliza SQLite:

```env
DATABASE_URL="file:./dev.db"
```

O provedor do banco de dados deve ser compatível com o configurado no arquivo `prisma/schema.prisma`. Caso utilize PostgreSQL, ajuste o provedor e a variável `DATABASE_URL` conforme a configuração do projeto.

## 🧪 Testes

Para executar os testes automatizados, utilize:

```bash
npm test
```

Esse comando depende da existência de um script `test` configurado no arquivo `package.json`.

## 📄 Licença

Consulte o arquivo `LICENSE`, caso esteja presente no repositório, para obter informações sobre a licença do projeto.
