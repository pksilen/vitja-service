import { initializeDefaultJaegerTracing } from "./backk/observability/distributedtracinig/initializeTracing";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module";
import { mongoDbManager } from "./database/mongoDbManager";
import initializeBackk from "./backk/initialization/initializeBackk";
import startHttpServer from "./backk/initialization/startHttpServer";

initializeDefaultJaegerTracing();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await initializeBackk(app, mongoDbManager);
  await startHttpServer(app)
  // await startKafkaConsumer(appController)
  // await startRedisConsumer(appController)
}

bootstrap();
