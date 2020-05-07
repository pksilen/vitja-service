import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import generateDocs from './backk/generateDocs';
import entityContainer from './backk/entityContainer';
import { postgreSqlDbManager } from "./database/postgreSqlDbManager";

async function bootstrap() {
  generateDocs();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await entityContainer.createTables(postgreSqlDbManager);
  await app.listen(3000);
}

bootstrap();
