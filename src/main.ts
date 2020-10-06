import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import entityContainer from './backk/annotations/entity/entityAnnotationContainer';
import generateDocs from './backk/generateDocs';
import { postgreSqlDbManager } from './database/postgreSqlDbManager';

async function bootstrap() {
  generateDocs();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await entityContainer.createTablesAndIndexes(postgreSqlDbManager);
  await app.listen(3000);
}

bootstrap();
