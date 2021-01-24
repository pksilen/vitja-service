/* eslint-disable @typescript-eslint/camelcase */
import { getNamespace, Namespace } from "cls-hooked";
import { FilterQuery } from "mongodb";
import SqlExpression from "./sql/expressions/SqlExpression";
import { RecursivePartial } from "../types/RecursivePartial";
import { ErrorResponse } from "../types/ErrorResponse";
import { PreHook } from "./hooks/PreHook";
import { Entity } from "../types/entities/Entity";
import { PostQueryOperations } from "../types/postqueryoperations/PostQueryOperations";
import { Injectable } from "@nestjs/common";
import isErrorResponse from "../errors/isErrorResponse";
import forEachAsyncParallel from "../utils/forEachAsyncParallel";
import UserDefinedFilter from "../types/userdefinedfilters/UserDefinedFilter";
import BaseService from "../service/BaseService";
import { SubEntity } from "../types/entities/SubEntity";
import __Backk__CronJobScheduling from "../scheduling/entities/__Backk__CronJobScheduling";
import __Backk__JobScheduling from "../scheduling/entities/__Backk__JobScheduling";
import MongoDbQuery from "./mongodb/MongoDbQuery";

export interface Field {
  name: string;
}

@Injectable()
export default abstract class AbstractDbManager {
  readonly schema: string;
  private services: BaseService[] = [];
  readonly dbName?: string;
  protected firstDbOperationFailureTimeInMillis = 0;

  constructor(schema: string) {
    this.schema = schema.toLowerCase();
  }

  addService(service: BaseService) {
    this.services.push(service);
  }

  getTypes(): Readonly<object> {
    return this.services.reduce((types, service) => ({ ...types, ...service.Types }), {
      __Backk__CronJobScheduling, __Backk__JobScheduling
    });
  }

  getType(Type: new () => any): new () => any {
    return (this.getTypes() as any)[Type.name] ?? Type;
  }

  getClsNamespace(): Namespace | undefined {
    return getNamespace('serviceFunctionExecution');
  }

  abstract getClient(): any;
  abstract getIdColumnType(): string;
  abstract getTimestampType(): string;
  abstract getVarCharType(maxLength: number): string;
  abstract getDbManagerType(): string;
  abstract getDbHost(): string;
  abstract tryExecuteSql<T>(sqlStatement: string): Promise<Field[]>;
  abstract tryExecuteSqlWithoutCls<T>(
    sqlStatement: string,
    values?: any[],
    shouldReportError?: boolean
  ): Promise<Field[]>;
  abstract isDbReady(): Promise<boolean>;
  abstract tryReserveDbConnectionFromPool(): Promise<void>;
  abstract tryReleaseDbConnectionBackToPool(): void;
  abstract tryBeginTransaction(): Promise<void>
  abstract cleanupTransaction(): void
  abstract executeInsideTransaction<T>(
    executable: () => Promise<T | ErrorResponse>
  ): Promise<T | ErrorResponse>;

  abstract createEntity<T>(
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  async createEntities<T>(
    entities: Array<Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>>,
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

  abstract addSubEntity<T extends Entity, U extends SubEntity>(
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

  abstract getAllEntities<T>(
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object,
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object | undefined,
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

  abstract getSubEntities<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<U[] | ErrorResponse>;

  abstract getEntitiesByIds<T>(
    _ids: string[],
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    entityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): Promise<T | ErrorResponse>;

  abstract getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    entityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): Promise<T[] | ErrorResponse>;

  abstract updateEntity<T extends Entity>(
    entity: RecursivePartial<T> & { _id: string },
    entityClass: new () => T,
    allowAdditionAndRemovalForSubEntityClasses: (new () => any)[] | 'all',
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  updateEntities<T extends Entity>(
    entities: Array<RecursivePartial<T> & { _id: string }>,
    entityClass: new () => T,
    allowAdditionAndRemovalForSubEntityClasses: (new () => any)[] | 'all',
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(entities, async (entity, index) => {
          const possibleErrorResponse = await this.updateEntity(
            entity,
            entityClass,
            allowAdditionAndRemovalForSubEntityClasses,
            preHooks
          );
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

  abstract updateEntityWhere<T extends Entity>(
    fieldPathName: string,
    fieldValue: any,
    entity: RecursivePartial<T>,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  abstract deleteEntityById<T extends object>(
    _id: string,
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse>;

  deleteEntitiesByIds<T extends object>(
    _ids: string[],
    entityClass: new () => T,
    preHooks?: PreHook | PreHook[]
  ): Promise<void | ErrorResponse> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(_ids, async (_id, index) => {
          const possibleErrorResponse = await this.deleteEntityById(_id, entityClass, preHooks);
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

  abstract deleteEntitiesWhere<T extends object>(
    fieldName: string,
    fieldValue: T[keyof T],
    entityClass: new () => T
  ): Promise<void | ErrorResponse>;

  abstract deleteEntitiesByFilters<T extends object>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object,
    entityClass: new () => T
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
