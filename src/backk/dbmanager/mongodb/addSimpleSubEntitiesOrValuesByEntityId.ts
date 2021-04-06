import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';
import { EntityPreHook } from '../hooks/EntityPreHook';
import { PostHook } from '../hooks/PostHook';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import { PromiseErrorOr } from '../../types/PromiseErrorOr';
import tryExecuteEntityPreHooks from '../hooks/tryExecuteEntityPreHooks';
import MongoDbManager from '../MongoDbManager';
import { MongoClient, ObjectId } from 'mongodb';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import { HttpStatusCodes } from "../../constants/constants";

export default async function addSimpleSubEntitiesOrValuesByEntityId<T extends BackkEntity, U extends SubEntity>(
  client: MongoClient,
  dbManager: MongoDbManager,
  _id: string,
  subEntityPath: string,
  newSubEntities: Array<Omit<U, 'id'> | { _id: string } | string | number | boolean>,
  EntityClass: new () => T,
  options?: {
    ifEntityNotFoundUse?: () => PromiseErrorOr<T>,
    preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
    postHook?: PostHook<T>;
    postQueryOperations?: PostQueryOperations;
  }
): PromiseErrorOr<null> {
  if (options?.preHooks) {
    let [currentEntity, error] = await dbManager.getEntityById(_id, EntityClass, undefined, true, true);

    if (error?.statusCode === HttpStatusCodes.NOT_FOUND && options?.ifEntityNotFoundUse) {
      [currentEntity, error] = await options.ifEntityNotFoundUse();
    }

    if (!currentEntity) {
      return [null, error];
    }

    await tryExecuteEntityPreHooks(options?.preHooks ?? [], currentEntity);
  }

  if (typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, subEntityPath)) {
    // noinspection AssignmentToFunctionParameterJS
    newSubEntities = newSubEntities.map((subEntity: any) => subEntity._id);
  }

  const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
  let versionUpdate = {};
  if (entityPropertyNameToPropertyTypeNameMap.version) {
    // noinspection ReuseOfLocalVariableJS
    versionUpdate = { $inc: { version: 1 } };
  }

  let lastModifiedTimestampUpdate = {};
  if (entityPropertyNameToPropertyTypeNameMap.lastModifiedTimestamp) {
    lastModifiedTimestampUpdate = { $set: { lastModifiedTimestamp: new Date() } };
  }

  await client
    .db(dbManager.dbName)
    .collection(EntityClass.name.toLowerCase())
    .updateOne(
      { _id: new ObjectId(_id) },
      { ...versionUpdate, ...lastModifiedTimestampUpdate, $push: { [subEntityPath]: { $each: newSubEntities } } }
    );

  return [null, null];
}
