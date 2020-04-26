import { MongoClient, ObjectId } from 'mongodb';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorResponse, getMongoDbProjection, IdWrapper, PostQueryOperations } from '../Backk';
import { SalesItem } from '../../services/salesitems/types/SalesItem';

const uri = 'mongodb+srv://admin:admin@vitja-tjdze.mongodb.net/test?retryWrites=true&w=majority';

class MongoDbManager {
  mongoClient = new MongoClient(uri, { useNewUrlParser: true });

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

  async getItems<T>(
    filters: object,
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: PostQueryOperations,
    dbName: string,
    tableName: string
  ): Promise<T[]> {
    return await this.execute((client) => {
      let cursor = client
        .db(dbName)
        .collection<SalesItem>(tableName)
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

  async getItemById<T>(_id: string, dbName: string, tableName: string): Promise<T | ErrorResponse> {
    const foundItem = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
        .findOne<T>({ _id: new ObjectId(_id) })
    );

    if (foundItem) {
      return foundItem;
    }

    throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
  }

  async getItemsByIds<T>(_ids: string[], dbName: string, tableName: string): Promise<T[] | ErrorResponse> {
    const foundItems = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
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
    dbName: string,
    tableName: string
  ): Promise<T | ErrorResponse> {
    const foundItem = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
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
    dbName: string,
    tableName: string
  ): Promise<T[] | ErrorResponse> {
    const foundItem = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
        .find<T>({ [fieldName]: fieldValue })
        .toArray()
    );

    if (foundItem) {
      return foundItem;
    }

    throw new HttpException(`Item with ${fieldName}: ${fieldValue} not found`, HttpStatus.NOT_FOUND);
  }

  async createItem<T>(item: T, dbName: string, tableName: string): Promise<IdWrapper | ErrorResponse> {
    const writeOperationResult = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
        .insertOne(item)
    );

    return {
      _id: writeOperationResult.insertedId.toHexString()
    };
  }

  async deleteItemById(_id: string, dbName: string, tableName: string): Promise<void | ErrorResponse> {
    const deleteOperationResult = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
        .deleteOne({ _id: new ObjectId(_id) })
    );

    if (deleteOperationResult.deletedCount !== 1) {
      throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
    }
  }

  async deleteAllItems(dbName: string, tableName: string): Promise<void | ErrorResponse> {
    await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
        .deleteMany({})
    );
  }

  async updateItem<T extends { _id: string }>(
    { _id, ...restOfItem }: T,
    dbName: string,
    tableName: string
  ): Promise<void | ErrorResponse> {
    const updateOperationResult = await this.execute((client) =>
      client
        .db(dbName)
        .collection(tableName)
        .updateOne({ _id: new ObjectId(_id) }, { $set: restOfItem })
    );

    if (updateOperationResult.matchedCount !== 1) {
      throw new HttpException(`Item with _id: ${_id} not found`, HttpStatus.NOT_FOUND);
    }
  }
}

export default new MongoDbManager();
