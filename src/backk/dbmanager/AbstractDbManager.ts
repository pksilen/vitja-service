import { getNamespace, Namespace } from 'cls-hooked';
import { FilterQuery, MongoClient } from 'mongodb';
import { Pool } from 'pg';
import SqlExpression from './sql/expressions/SqlExpression';
import { RecursivePartial } from '../types/RecursivePartial';
import { ErrorResponse } from '../types/ErrorResponse';
import { PreHook } from './hooks/PreHook';
import { Entity } from '../types/Entity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import { Injectable } from '@nestjs/common';
import isErrorResponse from '../errors/isErrorResponse';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';

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

  abstract getDbManagerType(): string;
  abstract getDbHost(): string;
  abstract tryExecute<T>(dbOperationFunction: (pool: Pool | MongoClient) => Promise<T>): Promise<T>;
  abstract tryExecuteSql<T>(sqlStatement: string): Promise<Field[]>;
  abstract tryExecuteSqlWithoutCls<T>(sqlStatement: string, values?: any[]): Promise<Field[]>;
  abstract isDbReady(): Promise<boolean>;
  abstract tryReserveDbConnectionFromPool(): Promise<void>;
  abstract tryReleaseDbConnectionBackToPool(): void;
  abstract executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse>;

  abstract createEntity<T>(
    entity: Omit<T, '_id'>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  async createEntities<T>(
    entities: Array<Omit<T, '_id'>>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T[] | ErrorResponse> {
    return this.executeInsideTransaction(async () => {
      try {
        return await Promise.all(
          entities.map(async (entity, index) => {
            const entityOrErrorResponse = await this.createEntity(
              entity,
              entityClass,
              preHooks,
              postQueryOperations
            );
            if ('errorMessage' in entityOrErrorResponse && isErrorResponse(entityOrErrorResponse)) {
              entityOrErrorResponse.errorMessage =
                'Entity ' + index + ': ' + entityOrErrorResponse.errorMessage;
              throw entityOrErrorResponse;
            }
          })
        );
      } catch (errorResponse) {
        return errorResponse;
      }
    });
  }

  abstract addSubEntity<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntity: Omit<U, 'id'>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  abstract addSubEntities<T extends Entity, U extends object>(
    _id: string,
    subEntitiesPath: string,
    newSubEntities: Array<Omit<U, 'id'>>,
    entityClass: new () => T,
    subEntityClass: new () => U,
    preHooks?: PreHook | PreHook[],
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
    entity: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  updateEntities<T extends Entity>(
    entities: Array<RecursivePartial<T> & { _id: string }>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(entities, async (entity, index) => {
          const possibleErrorResponse = await this.updateEntity(entity, entityClass, preHooks);
          if (possibleErrorResponse) {
            possibleErrorResponse.errorMessage =
              'Entity ' + index + ': ' + possibleErrorResponse.errorMessage;
            throw possibleErrorResponse;
          }
        });
      } catch (errorResponse) {
        return errorResponse;
      }
    });
  }

  abstract deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract removeSubEntities<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract removeSubEntityById<T extends Entity>(
    _id: string,
    subEntitiesPath: string,
    subEntityId: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract deleteAllEntities<T>(entityClass: new () => T): Promise<void | ErrorResponse>;
}
