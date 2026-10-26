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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Informe o token retornado por POST /auth/login",
        },
      },
    },
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