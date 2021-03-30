import { BackkEntity } from "../../types/entities/BackkEntity";
import { SubEntity } from "../../types/entities/SubEntity";
import { EntityPreHook } from "../hooks/EntityPreHook";
import { PostHook } from "../hooks/PostHook";
import { PostQueryOperations } from "../../types/postqueryoperations/PostQueryOperations";
import { PromiseOfErrorOr } from "../../types/PromiseOfErrorOr";
import tryExecuteEntityPreHooks from "../hooks/tryExecuteEntityPreHooks";
import MongoDbManager from "../MongoDbManager";
import { MongoClient, ObjectId } from "mongodb";

export default async function addSimpleSubEntities<T extends BackkEntity, U extends SubEntity>(
  client: MongoClient,
  dbManager: MongoDbManager,
  _id: string,
  subEntityPath: string,
  newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
  EntityClass: new () => T,
  options?: {
    preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
    postHook?: PostHook<T>;
    postQueryOperations?: PostQueryOperations;
  }
): PromiseOfErrorOr<null> {
  if (options?.preHooks) {
    const [currentEntity, error] = await dbManager.getEntityById(_id, EntityClass, undefined, true, true);

    if (!currentEntity) {
      return [null, error];
    }

    await tryExecuteEntityPreHooks(options?.preHooks ?? [], currentEntity);
  }

  await client
    .db(dbManager.dbName)
    .collection(EntityClass.name.toLowerCase())
    .updateOne({ _id: new ObjectId(_id) }, { $push: { [subEntityPath]: { $each: newSubEntities } } });

  return [null, null];
}
