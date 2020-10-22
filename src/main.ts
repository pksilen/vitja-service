import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module";
import generateDocs from "./backk/generateDocs";
import { postgreSqlDbManager } from "./database/postgreSqlDbManager";
import createTablesAndIndexes from "./backk/dbmanager/sqloperations/ddl/createTablesAndIndexes";

async function bootstrap() {
  generateDocs();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await createTablesAndIndexes(postgreSqlDbManager);
  await app.listen(3000);
}

bootstrap();
