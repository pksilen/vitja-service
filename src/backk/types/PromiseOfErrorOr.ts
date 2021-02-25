import { BackkError } from './BackkError';

export type PromiseOfErrorOr<T> = Promise<[T | null | undefined, BackkError | null | undefined]>;
