import { FilterQuery, MongoClient, ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { ErrorResponse, getMongoDbProjection, IdWrapper, OptPostQueryOps, PostQueryOps } from '../Backk';
import { SalesItem } from '../../services/salesitems/types/SalesItem';
import AbstractDbManager, { Field } from './AbstractDbManager';
import getInternalServerErrorResponse from '../getInternalServerErrorResponse';
import getNotFoundErrorResponse from '../getNotFoundErrorResponse';
import SqlExpression from '../sqlexpression/SqlExpression';

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

  async createItem<T>(item: Omit<T, '_id'>, entityClass: new () => T): Promise<IdWrapper | ErrorResponse> {
    try {
      const writeOperationResult = await this.tryExecute((client) =>
        client
          .db(this.dbName)
          .collection(entityClass.name.toLowerCase())
          .insertOne(item)
      );

      return {
        _id: writeOperationResult.insertedId.toHexString()
      };
    } catch (error) {
      return getInternalServerErrorResponse(error);
    }
  }

  async getItems<T>(
    filters: FilterQuery<T>,
    { pageNumber, pageSize, sortings, ...projection }: PostQueryOps,
    entityClass: new () => T
  ): Promise<T[] | ErrorResponse> {
    try {
      return await this.tryExecute((client) => {
        let cursor = client
          .db(this.dbName)
          .collection<SalesItem>(entityClass.name.toLowerCase())
          .find<T>(filters)
          .project(getMongoDbProjection(projection));

        if (sortings) {
          const sortObj = sortings.reduce(
            (accumulatedSortObj, { sortBy, sortDirection }) => ({
              ...accumulatedSortObj,
              sortBy,
              sortDirection: sortDirection === 'ASC' ? 1 : -1
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

  async getItemsCount<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T,
    Types: object
  ): Promise<number | ErrorResponse> {
    // TODO implement
    return Promise.resolve(0);
  }

  async getItemById<T>(_id: string, entityClass: new () => T): Promise<T | ErrorResponse> {
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

  async getItemsByIds<T>(
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

  async getItemBy<T>(
    fieldName: keyof T,
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

  async getItemsBy<T>(
    fieldName: keyof T,
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

  async updateItem<T extends { _id: string; id?: string }>(
    { _id, ...restOfItem }: T,
    entityClass: new () => T,
    preCondition?: Partial<T> | [string, Partial<T>]
  ): Promise<void | ErrorResponse> {
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

  async deleteItemById<T>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    preCondition?: Partial<T> | [string, Partial<T>]
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

  async deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
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
