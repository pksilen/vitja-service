import { FunctionMetadata } from "./FunctionMetadata";

export type ServiceMetadata = {
  serviceName: string;
  functions: FunctionMetadata[];
  types: { [p: string]: object };
  validations: { [p: string]: any[] };
};
