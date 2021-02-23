export const errorResponseSymbol = Symbol();

export type BackkError = {
  statusCode: number;
  message: string;
  errorCode?: string;
  stackTrace?: string;
};
