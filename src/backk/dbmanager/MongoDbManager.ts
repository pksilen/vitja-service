import { Injectable } from '@nestjs/common';
import { FilterQuery, MongoClient, ObjectId } from 'mongodb';
import { SalesItem } from '../../services/salesitems/types/entities/SalesItem';
import SqlExpression from './sql/expressions/SqlExpression';
import AbstractDbManager, { Field } from './AbstractDbManager';
import getMongoDbProjection from './mongodb/getMongoDbProjection';
import { ErrorResponse } from '../types/ErrorResponse';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { Entity } from '../types/Entity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import createErrorResponseFromErrorMessageAndStatusCode from '../errors/createErrorResponseFromErrorMessageAndStatusCode';

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
    entity: Omit<T, '_id'>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    // TODO implement maxItemCount
    try {
      const writeOperationResult = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .insertOne(entity)
      );

      return this.getEntityById(writeOperationResult.insertedId.toHexString(), entityClass);
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  createSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
    throw new Error();
  }

  async getEntities<T>(
    filters: FilterQuery<T> | Partial<T> | SqlExpression[],
    entityClass: new () => T,
    { pageNumber, pageSize, sortBys, ...projection }: PostQueryOperations
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
      return createErrorResponseFromError(error);
    }
  }

  async getEntitiesCount<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T
  ): Promise<number | ErrorResponse> {
    // TODO implement
    throw new Error('Not implemented');
  }

  async getEntityById<T>(
    _id: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse> {
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

      return createErrorResponseFromErrorMessageAndStatusCode(`Item with _id: ${_id} not found`, 404);
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<U | ErrorResponse> {
    throw new Error('Not implemented');
  }

  async getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
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

      return createErrorResponseFromErrorMessageAndStatusCode(`Item with _ids: ${_ids} not found`, 404);
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  async getEntityBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
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

      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item with ${fieldName}: ${fieldValue} not found`,
        404
      );
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  async getEntitiesBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
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

      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item with ${fieldName}: ${fieldValue} not found`,
        404
      );
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  async updateEntity<T extends Entity>(
    { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
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
        return createErrorResponseFromErrorMessageAndStatusCode(`Item with _id: ${_id} not found`, 404);
      }
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  async deleteEntityById<T>(
    _id: string,
    entityClass: new () => T,
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
        return createErrorResponseFromErrorMessageAndStatusCode(`Item with _id: ${_id} not found`, 404);
      }
    } catch (error) {
      return createErrorResponseFromError(error);
    }
  }

  deleteSubEntities<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return Promise.resolve();
  }

  deleteSubEntityById<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    subEntityId: string,
    entityClass: new () => T,
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
      return createErrorResponseFromError(error);
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
