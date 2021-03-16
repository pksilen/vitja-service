import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';
import { PromiseOfErrorOr } from '../../types/PromiseOfErrorOr';
import { BackkError } from '../../types/BackkError';

export interface ErrorDef {
  errorCode: string;
  message: string;
  statusCode?: number;
}

export type PreHook<T extends BackkEntity | SubEntity> =
  | {
      shouldExecutePreHook?: (entity: T) => boolean | PromiseOfErrorOr<boolean>;
      isSuccessfulOrTrue: (
        entity: T
      ) => PromiseOfErrorOr<BackkEntity | null> | Promise<boolean | BackkError | null | undefined> | boolean;
      error?: ErrorDef;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((
      entity: T
    ) =>
      | PromiseOfErrorOr<boolean | BackkEntity | null>
      | Promise<boolean | BackkError | null | undefined>
      | boolean);
