import { JSONPath } from 'jsonpath-plus';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
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

// noinspection OverlyComplexFunctionJS,FunctionTooLongJS
export default async function addSubEntities<T extends BackkEntity, U extends SubEntity>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  subEntitiesJsonPath: string,
  newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
  EntityClass: new () => T,
  SubEntityClass: new () => U,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook<T>,
  postQueryOperations?: PostQueryOperations
): PromiseOfErrorOr<null> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  // noinspection AssignmentToFunctionParameterJS
  SubEntityClass = dbManager.getType(SubEntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    const [currentEntity, error] = await getEntityById(
      dbManager,
      _id,
      EntityClass,
      postQueryOperations,
      undefined,
      true,
      true
    );

    if (!currentEntity) {
      throw error;
    }

    await tryExecutePreHooks(preHooks ?? [], currentEntity);
    await tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded(dbManager, currentEntity, EntityClass);
    const maxSubItemId = JSONPath({ json: currentEntity, path: subEntitiesJsonPath }).reduce(
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

    // noinspection DuplicatedCode
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
          message:
            parentEntityClassAndPropertyNameForSubEntity[0].name +
            '.' +
            parentEntityClassAndPropertyNameForSubEntity[1] +
            ': ' +
            BACKK_ERRORS.MAX_ENTITY_COUNT_REACHED.message
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

        if (!subEntity) {
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

        await dbManager.tryExecuteSql(
          `INSERT INTO ${dbManager.schema.toLowerCase()}.${associationTable.toLowerCase()} (${entityForeignIdFieldName.toLowerCase()}, ${subEntityForeignIdFieldName.toLowerCase()}) VALUES (${dbManager.getValuePlaceholder(
            1
          )}, ${dbManager.getValuePlaceholder(2)})`,
          [currentEntity?._id, subEntity._id]
        );
      } else {
        const foreignIdFieldName = entityAnnotationContainer.getForeignIdFieldName(SubEntityClass.name);

        const [, error] = await dbManager.createEntity(
          {
            ...newSubEntity,
            [foreignIdFieldName]: currentEntity?._id,
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

    if (postHook) {
      await tryExecutePostHook(postHook, null);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return [null, null];
  } catch (errorOrBackkError) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return [
      null,
      isBackkError(errorOrBackkError) ? errorOrBackkError : createBackkErrorFromError(errorOrBackkError)
    ];
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
