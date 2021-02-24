import { BackkError } from '../../types/BackkError';
import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';
import { PromiseOfErrorOr } from '../../types/PromiseOfErrorOr';

export interface ErrorCodeAndMessageAndStatus {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export type PreHook<T extends BackkEntity | SubEntity> =
  | {
      shouldExecutePreHook?: (entity: T) => boolean | PromiseOfErrorOr<boolean>;
      isSuccessfulOrTrue: (entity: T) => PromiseOfErrorOr<boolean | BackkEntity | null> | Promise<boolean> | boolean;
      errorMessage?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((entity: T) => PromiseOfErrorOr<boolean | BackkEntity | null> | Promise<boolean> | boolean);
