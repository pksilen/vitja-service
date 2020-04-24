import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import generateDocs from './backk/generateDocs';
import entityContainer from "./backk/entityContainer";

async function bootstrap() {
  generateDocs();
  entityContainer.createTables('public');
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.listen(3000);
}

bootstrap();
