import { BackkError } from './BackkError';

export type ErrorOr<T> = T extends null
  ? Promise<BackkError | null>
  : Promise<[T, null] | [null, BackkError]>;
