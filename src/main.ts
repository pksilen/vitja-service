import { initializeDefaultJaegerTracing } from "./backk/observability/distributedtracinig/initializeTracing";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module";
import initializeBackk from "./backk/initialization/initializeBackk";

initializeDefaultJaegerTracing();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  initializeBackk(app);
}

bootstrap();
