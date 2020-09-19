import { ErrorResponse, IdWrapper, PostQueryOperations } from '../Backk';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import SqlExpression from "../sqlexpression/SqlExpression";

export interface Field {
  name: string;
}

export default abstract class AbstractDbManager {
  readonly dbName?: string;
  readonly schema?: string;

  abstract tryExecute<T>(dbOperationFunction: (pool: Pool | MongoClient) => Promise<T>): Promise<T>;
  abstract tryExecuteSql<T>(sqlStatement: string): Promise<Field[]>;
  abstract isDbReady(): Promise<boolean>;

  abstract createItem<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object
  ): Promise<IdWrapper | ErrorResponse>;

  abstract getItems<T>(
    filters: object | SqlExpression[],
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: PostQueryOperations,
    entityClass: new () => T,
    Types: object
  ): Promise<T[] | ErrorResponse>;

  abstract getItemById<T>(_id: string, entityClass: new () => T, Types: object): Promise<T | ErrorResponse>;
  abstract getItemsByIds<T>(_ids: string[], entityClass: Function, Types: object): Promise<T[] | ErrorResponse>;

  abstract getItemBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: Function,
    Types: object
  ): Promise<T | ErrorResponse>;

  abstract getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: Function,
    Types: object
  ): Promise<T[] | ErrorResponse>;

  abstract updateItem<T extends { _id: string; id?: string }>(
    { _id, ...restOfItem }: T,
    entityClass: Function,
    Types: object,
    preCondition?: Partial<T>,
  ): Promise<void | ErrorResponse>;

  abstract deleteItemById(_id: string, entityClass: Function): Promise<void | ErrorResponse>;
  abstract deleteAllItems(entityClass: Function): Promise<void | ErrorResponse>;
}
