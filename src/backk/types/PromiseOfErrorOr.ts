import { BackkError } from './BackkError';

export type PromiseOfErrorOr<T> = Promise<[T, null] | [null, BackkError]>;

export type ErrorOr<T> = [T, null] | [null, BackkError];
