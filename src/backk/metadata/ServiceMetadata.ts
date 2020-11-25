import { FunctionMetadata } from "./FunctionMetadata";

export type ServiceMetadata = {
  serviceName: string;
  serviceDocumentation?: string
  functions: FunctionMetadata[];
  types: { [p: string]: object };
  publicTypes: { [p: string]: object };
  typesDocumentation?: object,
  validations: { [p: string]: any[] };
};
