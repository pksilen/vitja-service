import { getNamespace, Namespace } from 'cls-hooked';
import { FilterQuery, MongoClient } from 'mongodb';
import { Pool } from 'pg';
import SqlExpression from './sql/expressions/SqlExpression';
import { RecursivePartial } from "../types/RecursivePartial";
import { ErrorResponse } from "../types/ErrorResponse";
import { PostQueryOps } from "../types/PostQueryOps";
import OptPostQueryOps from "../types/OptPostQueryOps";

export interface Field {
  name: string;
}

export default abstract class AbstractDbManager {
  private clsNamespaceName: string | undefined = undefined;
  readonly dbName?: string;
  readonly schema?: string;

  setClsNamespaceName(clsNamespaceName: string) {
    this.clsNamespaceName = clsNamespaceName;
  }

  getClsNamespace(): Namespace | undefined {
    if (!this.clsNamespaceName) {
      throw new Error('CLS namespace name must be set before calling getClsNamespace');
    }

    return getNamespace(this.clsNamespaceName);
  }

  abstract tryExecute<T>(dbOperationFunction: (pool: Pool | MongoClient) => Promise<T>): Promise<T>;
  abstract tryExecuteSql<T>(sqlStatement: string): Promise<Field[]>;
  abstract tryExecuteSqlWithoutCls<T>(sqlStatement: string, values?: any[]): Promise<Field[]>;
  abstract isDbReady(): Promise<boolean>;
  abstract reserveDbConnectionFromPool(): Promise<void>;
  abstract releaseDbConnectionBackToPool(): void;
  abstract executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse>;

  abstract createItem<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object,
    maxAllowedItemCount?: number,
    itemCountQueryFilter?: Partial<T>
  ): Promise<T | ErrorResponse>;

  abstract createSubItem<T extends { _id: string; id?: string }, U extends object>(
    _id: string,
    subItemsPath: string,
    newSubItem: Omit<U, 'id'>,
    entityClass: new () => T,
    subItemEntityClass: new () => U,
    Types?: object
  ): Promise<T | ErrorResponse>;

  abstract getItems<T>(
    filters: FilterQuery<T> | Partial<T> | SqlExpression[],
    postQueryOps: PostQueryOps,
    entityClass: new () => T,
    Types: object
  ): Promise<T[] | ErrorResponse>;

  abstract getItemsCount<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T,
    Types: object
  ): Promise<number | ErrorResponse>;

  abstract getItemById<T>(_id: string, entityClass: new () => T, Types: object): Promise<T | ErrorResponse>;

  abstract getSubItem<T extends object, U extends object>(
    _id: string,
    subItemPath: string,
    entityClass: new () => T,
    Types: object
  ): Promise<U | ErrorResponse>;

  abstract getItemsByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    Types: object,
    postQueryOperations?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse>;

  abstract getItemBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object
  ): Promise<T | ErrorResponse>;

  abstract getItemsBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object,
    postQueryOperations?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse>;

  abstract updateItem<T extends { _id: string; id?: string }>(
    { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    Types: object,
    itemPreCondition?: Partial<T> | string
  ): Promise<void | ErrorResponse>;

  abstract deleteItemById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    itemPreCondition?: Partial<T> | string
  ): Promise<void | ErrorResponse>;

  abstract deleteSubItems<T extends { _id: string; id?: string }>(
    _id: string,
    subItemsPath: string,
    entityClass: new () => T,
    Types?: object,
    preCondition?: object | string
  ): Promise<void | ErrorResponse>;

  abstract deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse>;
}
