export type ErrorDefinition = {
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly statusCode?: number;
};

export type ErrorDefinitions = { [key: string]: ErrorDefinition };
