import { initializeDefaultJaegerTracing } from "./backk/observability/distributedtracinig/initializeTracing";

initializeDefaultJaegerTracing();

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import generateServicesDocumentation from './backk/documentation/generateServicesDocumentation';
import { postgreSqlDbManager } from './database/postgreSqlDbManager';
import createTablesAndIndexes from './backk/dbmanager/sql/operations/ddl/createTablesAndIndexes';
import defaultSystemAndNodeJsMetrics from "./backk/observability/metrics/defaultSystemAndNodeJsMetrics";
import log from "./backk/observability/logging/log";

async function bootstrap() {
  generateServicesDocumentation();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await createTablesAndIndexes(postgreSqlDbManager);
  await app.listen(3000);
  log('INFO', 'Service started', '');
}

bootstrap();
