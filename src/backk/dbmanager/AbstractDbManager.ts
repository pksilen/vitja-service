import { ErrorResponse, Id, OptPostQueryOps, PostQueryOps } from '../Backk';
import { Pool } from 'pg';
import { FilterQuery, MongoClient } from "mongodb";
import SqlExpression from '../sqlexpression/SqlExpression';
import { getNamespace, Namespace } from 'cls-hooked';

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
    item: Partial<Omit<T, '_id'>>,
    entityClass: new () => T,
    Types: object
  ): Promise<Id | ErrorResponse>;

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

  abstract getItemsByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    Types: object,
    postQueryOperations?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse>;

  abstract getItemBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object
  ): Promise<T | ErrorResponse>;

  abstract getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    Types: object,
    postQueryOperations?: OptPostQueryOps
  ): Promise<T[] | ErrorResponse>;

  abstract updateItem<T extends { _id: string; id?: string }>(
    { _id, ...restOfItem }: Partial<T> & { _id: string },
    entityClass: new () => T,
    Types: object,
    preCondition?: Partial<T> | [string, Partial<T>]
  ): Promise<void | ErrorResponse>;

  abstract deleteItemById<T extends object>(
    _id: string,
    entityClass: new () => T,
    Types?: object,
    preCondition?: Partial<T> | [string, Partial<T>]
  ): Promise<void | ErrorResponse>;

  abstract deleteAllItems<T>(entityClass: new () => T): Promise<void | ErrorResponse>;
}
