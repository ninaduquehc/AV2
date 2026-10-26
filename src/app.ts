import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { z } from "zod";
import {
  createJsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

import { prisma } from "./lib/prisma.js";
import { authRoutes } from "./routes/auth.routes.js";
import { usuarioRoutes } from "./routes/usuario.routes.js";
import { appRoutes } from "./routes/index.js";
import { tratadorDeErros } from "./utils/http.js";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: a variável de ambiente JWT_SECRET é obrigatória e não foi configurada no .env");
}

export const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);
app.setErrorHandler(tratadorDeErros);
app.setNotFoundHandler((_req, reply) => reply.status(404).send({ error: "Rota não encontrada." }));

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
});

await app.register(jwt, { secret: process.env.JWT_SECRET });

await app.register(swagger, {
  openapi: {
    info: {
      title: "GreenCode API - Logística Reversa",
      description: "API RESTful para gestão de logística reversa e rastreabilidade de e-lixo.",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor Local de Desenvolvimento",
      },
    ],
    tags: [
      { name: "Autenticação", description: "Endpoints para emissão e validação de tokens JWT" },
      { name: "Usuários", description: "Gestão de usuários do sistema (Apenas Administradores)" },
      { name: "Organizações", description: "Cadastro de empresas parceiras, geradoras e desmontadoras" },
      { name: "Contratos", description: "Acordos e metas vinculados às organizações" },
      { name: "Lotes", description: "Lotes de recolhimento de resíduos eletrônicos" },
      { name: "Equipamentos", description: "Itens individuais triados e acompanhados no fluxo" },
      { name: "Movimentações", description: "Rastreabilidade e histórico de alterações com bloqueio otimista" },
      { name: "Health", description: "Verificação da saúde e funcionamento da API" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Informe o token JWT retornado no login",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  transform: createJsonSchemaTransform({ skipList: [] }),
});

await app.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
    persistAuthorization: true,
  },
});

app.get("/health", {
  schema: {
    tags: ["Health"],
    summary: "Verificar integridade da aplicação",
    security: [],
    response: {
      200: z.object({ status: z.string(), timestamp: z.string() }),
    },
  },
}, async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

await app.register(authRoutes);
await app.register(usuarioRoutes);
await app.register(appRoutes);