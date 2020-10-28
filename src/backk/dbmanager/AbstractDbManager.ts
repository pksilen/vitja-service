import { getNamespace, Namespace } from "cls-hooked";
import { FilterQuery, MongoClient } from "mongodb";
import { Pool } from "pg";
import SqlExpression from "./sql/expressions/SqlExpression";
import { RecursivePartial } from "../types/RecursivePartial";
import { ErrorResponse } from "../types/ErrorResponse";
import { PreHook } from "./hooks/PreHook";
import { Entity } from "../types/Entity";
import { PostQueryOperations } from "../types/postqueryoperations/PostQueryOperations";
import { Injectable } from "@nestjs/common";

export interface Field {
  name: string;
}

@Injectable()
export default abstract class AbstractDbManager {
  private clsNamespaceName: string | undefined = undefined;
  private Types: object = {};
  readonly dbName?: string;
  readonly schema?: string;

  addTypes(Types: object) {
    this.Types = { ...this.Types, ...Types };
  }

  getTypes(): Readonly<object> {
    return this.Types;
  }

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

  abstract createEntity<T>(
    entity: Omit<T, '_id'>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  abstract createSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  abstract getEntities<T>(
    filters: FilterQuery<T> | Partial<T> | SqlExpression[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract getEntitiesCount<T>(
    filters: Partial<T> | SqlExpression[],
    entityClass: new () => T
  ): Promise<number | ErrorResponse>;

  abstract getEntityById<T>(
    _id: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  abstract getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<U | ErrorResponse>;

  abstract getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract getEntityBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  abstract getEntitiesBy<T>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract updateEntity<T extends Entity>(
    { _id, ...restOfItem }: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract deleteSubEntities<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse>;
}
