import { BackkError } from './BackkError';

export type PromiseOfErrorOr<T> = Promise<[T | null, BackkError | null]>;

export type ErrorOr<T> = [T | null, BackkError | null];
