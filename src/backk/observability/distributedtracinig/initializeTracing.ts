import { NodeTracerProvider } from '@opentelemetry/node';
import { SpanProcessor, SimpleSpanProcessor } from '@opentelemetry/tracing';
import { JaegerExporter,  } from '@opentelemetry/exporter-jaeger';
import { ExporterConfig } from "@opentelemetry/exporter-jaeger/build/src/types";

const provider = new NodeTracerProvider({
  plugins: {
    express: {
      enabled: false
    }
  }
});

provider.register();

export function initializeTracing(spanProcessor: SpanProcessor) {
  provider.addSpanProcessor(spanProcessor);
}

export function initializeDefaultJaegerTracing(jaegerExporterOptions?: ExporterConfig) {
  const cwd = process.cwd();
  const serviceName = cwd.split('/').reverse()[0];

  initializeTracing(
    new SimpleSpanProcessor(
      new JaegerExporter({
        serviceName,
        ...(jaegerExporterOptions ?? {})
      })
    )
  );
}
