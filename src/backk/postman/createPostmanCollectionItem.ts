import { ServiceMetadata } from "../metadata/types/ServiceMetadata";
import { FunctionMetadata } from "../metadata/types/FunctionMetadata";

export default function createPostmanCollectionItem(
  serviceMetadata: ServiceMetadata,
  functionMetadata: FunctionMetadata,
  sampleArg: object | undefined,
  tests?: object
) {
  return {
    name: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
    request: {
      method: 'POST',
      header:
        sampleArg === undefined
          ? []
          : [
            {
              key: 'Content-Type',
              name: 'Content-Type',
              value: 'application/json',
              type: 'text'
            }
          ],
      body:
        sampleArg === undefined
          ? undefined
          : {
            mode: 'raw',
            raw: JSON.stringify(sampleArg, null, 4),
            options: {
              raw: {
                language: 'json'
              }
            }
          },
      url: {
        raw: 'http://localhost:3000/' + serviceMetadata.serviceName + '.' + functionMetadata.functionName,
        protocol: 'http',
        host: ['localhost'],
        port: '3000',
        path: [serviceMetadata.serviceName + '.' + functionMetadata.functionName]
      }
    },
    response: [],
    event: tests ? [tests] : undefined
  };
}
