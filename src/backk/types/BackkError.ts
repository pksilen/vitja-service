export const errorResponseSymbol = Symbol();

export type BackkError = {
  [errorResponseSymbol]: true,
  statusCode: number;
  errorMessage: string;
  errorCode?: string;
  stackTrace?: string;
};
