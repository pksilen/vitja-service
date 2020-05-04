import { MongoClient, ObjectId } from 'mongodb';
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ErrorResponse, getMongoDbProjection, IdWrapper, PostQueryOperations } from '../Backk';
import { SalesItem } from '../../services/salesitems/types/SalesItem';
import AbstractDbManager from './AbstractDbManager';

@Injectable()
export default class MongoDbManager extends AbstractDbManager {
  private readonly mongoClient: MongoClient;

  constructor(uri: string, public readonly dbName: string) {
    super();
    this.mongoClient = new MongoClient(uri, { useNewUrlParser: true });
  }

  async execute<T>(dbOperationFunction: (client: MongoClient) => Promise<T>): Promise<T> {
    try {
      if (!this.mongoClient.isConnected()) {
        await this.mongoClient.connect();
      }
      return await dbOperationFunction(this.mongoClient);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  executeSql<T>(): Promise<import("./AbstractDbManager").Field[]> {
    throw new Error("Method not allowed.");
  }

  async createItem<T>(item: Omit<T, '_id'>, entityClass: new () => T): Promise<IdWrapper | ErrorResponse> {
    const writeOperationResult = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .insertOne(item)
    );

    return {
      _id: writeOperationResult.insertedId.toHexString()
    };
  }

  async getItems<T>(
    filters: object,
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: PostQueryOperations,
    entityClass: new () => T
  ): Promise<T[] | ErrorResponse> {
    return await this.execute((client) => {
      let cursor = client
        .db(this.dbName)
        .collection<SalesItem>(entityClass.name.toLowerCase())
        .find<T>(filters)
        .project(getMongoDbProjection(projection));

      if (sortBy && sortDirection) {
        cursor = cursor.sort(sortBy, sortDirection === 'ASC' ? 1 : -1);
      }

      if (pageNumber && pageSize) {
        cursor = cursor.skip((pageNumber - 1) * pageSize).limit(pageSize);
      }

      return cursor.toArray();
    });
  }

  async getItemById<T>(_id: string, entityClass: new () => T): Promise<T | ErrorResponse> {
    const foundItem = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .findOne<T>({ _id: new ObjectId(_id) })
    );

    if (foundItem) {
      return foundItem;
    }

    throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
  }

  async getItemsByIds<T>(_ids: string[], entityClass: new () => T): Promise<T[] | ErrorResponse> {
    const foundItems = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .find<T>({ _id: { $in: _ids.map((_id: string) => new ObjectId(_id)) } })
        .toArray()
    );

    if (foundItems) {
      return foundItems;
    }

    throw new HttpException(`Item with _ids: ${_ids} not found`, HttpStatus.NOT_FOUND);
  }

  async getItemBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): Promise<T | ErrorResponse> {
    const foundItem = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .findOne<T>({ [fieldName]: fieldValue })
    );

    if (foundItem) {
      return foundItem;
    }

    throw new HttpException(`Item with ${fieldName}: ${fieldValue} not found`, HttpStatus.NOT_FOUND);
  }

  async getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): Promise<T[] | ErrorResponse> {
    const foundItem = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .find<T>({ [fieldName]: fieldValue })
        .toArray()
    );

    if (foundItem) {
      return foundItem;
    }

    throw new HttpException(`Item with ${fieldName}: ${fieldValue} not found`, HttpStatus.NOT_FOUND);
  }

  async updateItem<T extends { _id?: string; id?: string }>(
    { _id, ...restOfItem }: T,
    entityClass: new () => T
  ): Promise<void | ErrorResponse> {
    const updateOperationResult = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .updateOne({ _id: new ObjectId(_id) }, { $set: restOfItem })
    );

    if (updateOperationResult.matchedCount !== 1) {
      throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
    }
  }

  async deleteItemById<T>(_id: string, entityClass: new () => T): Promise<void | ErrorResponse> {
    const deleteOperationResult = await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .deleteOne({ _id: new ObjectId(_id) })
    );

    if (deleteOperationResult.deletedCount !== 1) {
      throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
    }
  }

  async deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse> {
    await this.execute((client) =>
      client
        .db(this.dbName)
        .collection(entityClass.name.toLowerCase())
        .deleteMany({})
    );
  }
}
