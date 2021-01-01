import { initializeDefaultJaegerTracing } from "./backk/observability/distributedtracinig/initializeTracing";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module";
import { mongoDbManager } from "./database/mongoDbManager";
import initializeBackk from "./backk/initialization/initializeBackk";
import startHttpServer from "./backk/initialization/startHttpServer";
import { appController } from "./app/app.controller";
import { mySqlDbManager } from "./database/mySqlDatabaseManager";

initializeDefaultJaegerTracing();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await initializeBackk(appController, mongoDbManager);
  await startHttpServer(app)
  // await startKafkaConsumer(appController)
  // await startRedisConsumer(appController)
}

bootstrap();
