import { BackkError } from './BackkError';

export type PromiseOfErrorOr<T> = Promise<[T | null, BackkError | null]>;

export type ErrorOr<T extends object> = [T | null, BackkError | null];
