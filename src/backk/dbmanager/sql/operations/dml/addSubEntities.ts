import { JSONPath } from 'jsonpath-plus';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { BackkError } from '../../../../types/BackkError';
import createBackkErrorFromError from '../../../../errors/createBackkErrorFromError';
import { BackkEntity } from '../../../../types/entities/BackkEntity';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import findParentEntityAndPropertyNameForSubEntity from '../../../../metadata/findParentEntityAndPropertyNameForSubEntity';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded from './utils/tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import { SubEntity } from '../../../../types/entities/SubEntity';
import getEntityById from '../dql/getEntityById';
import { PostHook } from '../../../hooks/PostHook';
import tryExecutePostHook from '../../../hooks/tryExecutePostHook';
import createBackkErrorFromErrorCodeMessageAndStatus from '../../../../errors/createBackkErrorFromErrorCodeMessageAndStatus';
import { BACKK_ERRORS } from '../../../../errors/backkErrors';
import getSingularName from '../../../../utils/getSingularName';
import { PromiseOfErrorOr } from '../../../../types/PromiseOfErrorOr';
import isBackkError from '../../../../errors/isBackkError';

export default async function addSubEntities<T extends BackkEntity, U extends SubEntity>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  versionOrLastModifiedTimestamp: string | 'any',
  subEntitiesJsonPath: string,
  newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
  EntityClass: new () => T,
  SubEntityClass: new () => U,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook,
  postQueryOperations?: PostQueryOperations
): PromiseOfErrorOr<T> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  // noinspection AssignmentToFunctionParameterJS
  SubEntityClass = dbManager.getType(SubEntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    const currentEntityOrErrorResponse = await getEntityById(
      dbManager,
      _id,
      EntityClass,
      postQueryOperations,
      true
    );

    let eTagCheckPreHook: PreHook<T>;
    let finalPreHooks = Array.isArray(preHooks) ? preHooks ?? [] : preHooks ? [preHooks] : [];

    if (versionOrLastModifiedTimestamp !== 'any' && typeof currentEntityOrErrorResponse === 'object') {
      if ('version' in currentEntityOrErrorResponse && !isNaN(parseInt(versionOrLastModifiedTimestamp, 10))) {
        eTagCheckPreHook = {
          isSuccessfulOrTrue: ({ version }) => version === versionOrLastModifiedTimestamp,
          errorMessage: BACKK_ERRORS.ENTITY_VERSION_MISMATCH
        };

        finalPreHooks = [eTagCheckPreHook, ...finalPreHooks];
      } else if ('lastModifiedTimestamp' in currentEntityOrErrorResponse) {
        eTagCheckPreHook = {
          isSuccessfulOrTrue: ({ lastModifiedTimestamp }) =>
            lastModifiedTimestamp?.getTime() === new Date(versionOrLastModifiedTimestamp).getTime(),
          errorMessage: BACKK_ERRORS.ENTITY_LAST_MODIFIED_TIMESTAMP_MISMATCH
        };

        finalPreHooks = [eTagCheckPreHook, ...finalPreHooks];
      }
    }

    await tryExecutePreHooks(finalPreHooks ?? [], currentEntityOrErrorResponse);

    await tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded(
      dbManager,
      currentEntityOrErrorResponse,
      EntityClass
    );

    const maxSubItemId = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesJsonPath }).reduce(
      (maxSubItemId: number, subItem: any) => {
        const subItemId = parseInt(subItem.id);
        return subItemId > maxSubItemId ? subItemId : maxSubItemId;
      },
      -1
    );

    const parentEntityClassAndPropertyNameForSubEntity = findParentEntityAndPropertyNameForSubEntity(
      EntityClass,
      SubEntityClass,
      dbManager.getTypes()
    );

    if (parentEntityClassAndPropertyNameForSubEntity) {
      const metadataForValidations = getFromContainer(MetadataStorage).getTargetValidationMetadatas(
        parentEntityClassAndPropertyNameForSubEntity[0],
        ''
      );

      const foundArrayMaxSizeValidation = metadataForValidations.find(
        (validationMetadata: ValidationMetadata) =>
          validationMetadata.propertyName === parentEntityClassAndPropertyNameForSubEntity[1] &&
          validationMetadata.type === 'arrayMaxSize'
      );

      if (
        foundArrayMaxSizeValidation &&
        maxSubItemId + newSubEntities.length >= foundArrayMaxSizeValidation.constraints[0]
      ) {
        // noinspection ExceptionCaughtLocallyJS
        throw createBackkErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS.MAX_ENTITY_COUNT_REACHED,
          errorMessage:
            parentEntityClassAndPropertyNameForSubEntity[0].name +
            '.' +
            parentEntityClassAndPropertyNameForSubEntity[1] +
            ': ' +
            BACKK_ERRORS.MAX_ENTITY_COUNT_REACHED.errorMessage
        });
      }
    }

    await forEachAsyncParallel(newSubEntities, async (newSubEntity, index) => {
      if (
        parentEntityClassAndPropertyNameForSubEntity &&
        typePropertyAnnotationContainer.isTypePropertyManyToMany(
          parentEntityClassAndPropertyNameForSubEntity[0],
          parentEntityClassAndPropertyNameForSubEntity[1]
        )
      ) {
        const [subEntity, error] = await dbManager.getEntityById(newSubEntity._id ?? '', SubEntityClass);

        if (error || !subEntity) {
          // noinspection ExceptionCaughtLocallyJS
          throw error;
        }

        const associationTable = `${EntityClass.name}_${getSingularName(
          parentEntityClassAndPropertyNameForSubEntity[1]
        )}`;
        const {
          entityForeignIdFieldName,
          subEntityForeignIdFieldName
        } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTable);

        dbManager.tryExecuteSql(
          `INSERT INTO ${dbManager.schema.toLowerCase()}.${associationTable.toLowerCase()} (${entityForeignIdFieldName.toLowerCase()}, ${subEntityForeignIdFieldName.toLowerCase()}) VALUES (${dbManager.getValuePlaceholder(
            1
          )}, ${dbManager.getValuePlaceholder(2)})`,
          [(currentEntityOrErrorResponse as any)._id, subEntity._id]
        );
      } else {
        const foreignIdFieldName = entityAnnotationContainer.getForeignIdFieldName(SubEntityClass.name);

        const [, error] = await dbManager.createEntity(
          {
            ...newSubEntity,
            [foreignIdFieldName]: (currentEntityOrErrorResponse as any)._id,
            id: (maxSubItemId + 1 + index).toString()
          } as any,
          SubEntityClass,
          undefined,
          false
        );

        if (error) {
          // noinspection ExceptionCaughtLocallyJS
          throw error;
        }
      }
    });

    const response = await dbManager.getEntityById(_id, EntityClass, postQueryOperations);

    if (postHook) {
      await tryExecutePostHook(postHook, response);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return response;
  } catch (errorOrBackkError) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isBackkError(errorOrBackkError) ? errorOrBackkError : createBackkErrorFromError(errorOrBackkError);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
