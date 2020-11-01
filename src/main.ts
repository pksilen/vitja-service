import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app/app.module";
import generateServicesDocumentation from "./backk/documentation/generateServicesDocumentation";
import { postgreSqlDbManager } from "./database/postgreSqlDbManager";
import createTablesAndIndexes from "./backk/dbmanager/sql/operations/ddl/createTablesAndIndexes";

async function bootstrap() {
  generateServicesDocumentation();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await createTablesAndIndexes(postgreSqlDbManager);
  await app.listen(3000);
}

bootstrap();
