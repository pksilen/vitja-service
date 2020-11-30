import { initializeDefaultJaegerTracing } from "./backk/observability/distributedtracinig/initializeTracing";

initializeDefaultJaegerTracing();

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app/app.module';
import generateServicesDocumentation from './backk/documentation/generateServicesDocumentation';
import { postgreSqlDbManager } from './database/postgreSqlDbManager';
import initializeDatabase from './backk/dbmanager/sql/operations/ddl/initializeDatabase';
import defaultSystemAndNodeJsMetrics from "./backk/observability/metrics/defaultSystemAndNodeJsMetrics";
import log, { Severity } from "./backk/observability/logging/log";
import executeScheduledCronJobs from "./backk/scheduling/executeScheduledCronJobs";
import executeScheduledJobs from "./backk/scheduling/executeScheduledJobs";

async function bootstrap() {
  generateServicesDocumentation();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await initializeDatabase(postgreSqlDbManager);
  executeScheduledCronJobs(postgreSqlDbManager);
  executeScheduledJobs(postgreSqlDbManager);
  await app.listen(3000);
  log(Severity.INFO, 'Service started', '');
}

bootstrap();
