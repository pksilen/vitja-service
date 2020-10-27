import { Injectable } from '@nestjs/common';
import { FilterQuery, MongoClient, ObjectId } from 'mongodb';
import { SalesItem } from '../../services/salesitems/types/entities/SalesItem';
import getInternalServerErrorResponse from '../errors/getInternalServerErrorResponse';
import getNotFoundErrorResponse from '../errors/getNotFoundErrorResponse';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field} from "./AbstractDbManager";
import getMongoDbProjection from "./mongodb/getMongoDbProjection";
import { ErrorResponse } from "../types/ErrorResponse";
import { PostQueryOps } from "../types/PostQueryOps";
import OptPostQueryOps from "../types/OptPostQueryOps";
import { RecursivePartial } from "../types/RecursivePartial";
import { PreHook } from "./hooks/PreHook";

@Injectable()
export default class MongoDbManager extends AbstractDbManager {
  private readonly mongoClient: MongoClient;

  constructor(uri: string, public readonly dbName: string) {
    super();
    this.mongoClient = new MongoClient(uri, { useNewUrlParser: true });
  }

  async tryExecute<T>(dbOperationFunction: (client: MongoClient) => Promise<T>): Promise<T> {
    if (!this.mongoClient.isConnected()) {
      await this.mongoClient.connect();
    }

    return await dbOperationFunction(this.mongoClient);
  }

  tryExecuteSql<T>(): Promise<Field[]> {
    throw new Error('Method not allowed.');
  }

  tryExecuteSqlWithoutCls<T>(): Promise<Field[]> {
    throw new Error('Method not allowed.');
  }

  executeInsideTransaction<T>(): Promise<T | ErrorResponse> {
    throw new Error('Method not allowed.');
  }

  async isDbReady(): Promise<boolean> {
    try {
      await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection('__backk__')
          .findOne({})
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  async createEntity<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object,
    preHooks?: PreHook | PreHook[]
  ): Promise<T | ErrorResponse> {
    // TODO implement maxItemCount
    try {
      const writeOperationResult = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .insertOne(item)
      );

      return this.getEntityById(writeOperationResult.insertedId.toHexString(), entityClass);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  createSubEntity<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    newSubItem: Omit<U, 'id'>,
    entityClass: new () => T,
    subItemEntityClass: new () => U,
    Types?: object
  ): Promise<T | ErrorResponse> {
    throw new Error();
  }

  async getEntities<T>(
    filters: FilterQuery<T>,
    { pageNumber, pageSize, sortBys, ...projection }: PostQueryOps,
    entityClass: new () => T
  ): Promise<T[] | ErrorResponse> {
    try {
      return await this.tryExecute((client) => {
        let cursor = client
          .db(this.dbName)
          .collection<SalesItem>(entityClass.name.toLowerCase())
          .find<T>(filters)
          .project(getMongoDbProjection(projection));

        if (sortBys) {
          const sortObj = sortBys.reduce(
            (accumulatedSortObj, { sortField, sortDirection }) => ({
              ...accumulatedSortObj,
              sortField: sortDirection === 'ASC' ? 1 : -1
            }),
            {}
          );

          cursor = cursor.sort(sortObj);
        }

        if (pageNumber && pageSize) {
          cursor = cursor.skip((pageNumber - 1) * pageSize).limit(pageSize);
        }

        return cursor.toArray();
      });
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getEntitiesCount<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T,
    Types: object
  ): Promise<number | ErrorResponse> {
    // TODO implement
    return Promise.resolve(0);
  }

  async getEntityById<T>(_id: string, entityClass: new () => T): Promise<T | ErrorResponse> {
    try {
      const foundItem = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .findOne<T>({ _id: new ObjectId(_id) })
      );

      if (foundItem) {
        return foundItem;
      }

      return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  getSubEntity<T extends object, U extends object, >(
    _id: string,
    subItemPath: string,
    entityClass: new () => T,
    Types: object
  ): Promise<U | ErrorResponse> {
    throw new Error('Not implemented');
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    // TODO implemennt postqueryOps
    try {
      const foundItems = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .find<T>({ _id: { $in: _ids.map((_id: string) => new ObjectId(_id)) } })
          .toArray()
      );

      if (foundItems) {
        return foundItems;
      }

      return getNotFoundErrorResponse(`Item with _ids: ${_ids} not found`);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getEntityBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): Promise<T | ErrorResponse> {
    try {
      const foundItem = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .findOne<T>({ [fieldName]: fieldValue })
      );

      if (foundItem) {
        return foundItem;
      }

      return getNotFoundErrorResponse(`Item with ${fieldName}: ${fieldValue} not found`);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getEntitiesBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse> {
    // TODO implement postQueryOps
    try {
      const foundItem = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .find<T>({ [fieldName]: fieldValue })
          .toArray()
      );

      if (foundItem) {
        return foundItem;
      }

      return getNotFoundErrorResponse(`Item with ${fieldName}: ${fieldValue} not found`);
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async updateEntity<T extends { _id: string; id?: string }>(
    { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    Types: object,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    // TODO add precondition check
    try {
      const updateOperationResult = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .updateOne({ _id: new ObjectId(_id) }, { $set: restOfItem })
      );

      if (updateOperationResult.matchedCount !== 1) {
        return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
      }
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async deleteEntityById<T>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    try {
      const deleteOperationResult = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .deleteOne({ _id: new ObjectId(_id) })
      );

      if (deleteOperationResult.deletedCount !== 1) {
        return getNotFoundErrorResponse(`Item with _id: ${_id} not found`);
      }
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  deleteSubEntities<T extends { _id: string; id?: string }>(
    _id: string,
    subItemsPath: string,
    entityClass: new () => T,
    Types?: object,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return Promise.resolve();
  }

  async deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    try {
      await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .deleteMany({})
      );
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  releaseDbConnectionBackToPool() {
    // TODO inmplement
  }

  reserveDbConnectionFromPool(): Promise<void> {
    // TODO inmplement
    return Promise.resolve(undefined);
  }
}
