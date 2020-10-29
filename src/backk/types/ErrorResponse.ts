export const errorResponseSymbol = Symbol();

export type ErrorResponse = {
  [errorResponseSymbol]: true,
  statusCode: number;
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
};
