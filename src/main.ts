import { initializeDefaultJaegerTracing } from "./backk/observability/distributedtracinig/initializeTracing";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module";
import { mySqlDbManager } from "./database/mySqlDatabaseManager";
import initializeHttpServerBackk from "./backk/initialization/initializeHttpServerBackk";

initializeDefaultJaegerTracing();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await initializeHttpServerBackk(app, mySqlDbManager);
  // await initializeKafkaConsumerBackk(appController, mySqlDbManager)
  // await initializeRedisConsumerBackk(appController, mySqlDbManager)
}

bootstrap();
