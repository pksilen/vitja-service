/* eslint-disable @typescript-eslint/camelcase */
import { getNamespace, Namespace } from "cls-hooked";
import SqlExpression from "./sql/expressions/SqlExpression";
import { RecursivePartial } from "../types/RecursivePartial";
import { PreHook } from "./hooks/PreHook";
import { BackkEntity } from "../types/entities/BackkEntity";
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
import { PostHook } from "./hooks/PostHook";
import { CreatePreHook } from "./hooks/CreatePreHook";
import { FilterQuery } from "mongodb";
import { ErrorOr } from "../types/ErrorOr";

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
      __Backk__CronJobScheduling,
      __Backk__JobScheduling
    });
  }

  getType(Type: new () => any): new () => any {
    return (this.getTypes() as any)[Type.name] ?? Type;
  }

  getClsNamespace(): Namespace | undefined {
    return getNamespace('serviceFunctionExecution');
  }

  abstract getClient(): any;
  abstract isDuplicateEntityError(error: Error): boolean;
  abstract getIdColumnType(): string;
  abstract getTimestampType(): string;
  abstract getVarCharType(maxLength: number): string;
  abstract getDbManagerType(): string;
  abstract getDbHost(): string;
  abstract getFilters<T>(
    mongoDbFilters: Array<MongoDbQuery<T>> | FilterQuery<T> | Partial<T> | object,
    sqlFilters: SqlExpression[] | SqlExpression | Partial<T> | object
  ): Array<MongoDbQuery<T> | SqlExpression> | Partial<T> | object;

  abstract getModifyColumnStatement(
    schema: string | undefined,
    tableName: string,
    columnName: string,
    columnType: string,
    isUnique: boolean
  ): string;

  abstract tryExecuteSql<T>(
    sqlStatement: string,
    values?: any[],
    shouldReportError?: boolean
  ): Promise<Field[]>;

  abstract tryExecuteSqlWithoutCls<T>(
    sqlStatement: string,
    values?: any[],
    shouldReportError?: boolean,
    shouldReportSuccess?: boolean
  ): Promise<Field[]>;

  abstract isDbReady(): Promise<boolean>;
  abstract tryReserveDbConnectionFromPool(): Promise<void>;
  abstract tryReleaseDbConnectionBackToPool(): void;
  abstract tryBeginTransaction(): Promise<void>;
  abstract cleanupTransaction(): void;
  abstract executeInsideTransaction<T>(
    executable: () => ErrorOr<T>
  ): ErrorOr<T>;

  abstract createEntity<T extends BackkEntity>(
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    EntityClass: new () => T,
    preHooks?: CreatePreHook | CreatePreHook[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  async createEntities<T extends BackkEntity>(
    entities: Array<Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>>,
    EntityClass: new () => T,
    preHooks?: CreatePreHook | CreatePreHook[],
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T[]> {
    return this.executeInsideTransaction(async () => {
      try {
        return await Promise.all(
          entities.map(async (entity, index) => {
            const entityOrErrorResponse = await this.createEntity(
              entity,
              EntityClass,
              preHooks,
              undefined,
              postQueryOperations
            );

            if ('errorMessage' in entityOrErrorResponse && isErrorResponse(entityOrErrorResponse)) {
              entityOrErrorResponse.errorMessage =
                'BackkEntity ' + index + ': ' + entityOrErrorResponse.errorMessage;
              throw entityOrErrorResponse;
            }
          })
        );
      } catch (errorResponse) {
        return errorResponse;
      }
    });
  }

  abstract addSubEntity<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    versionOrLastModifiedTimestamp: string | 'any',
    subEntitiesJsonPath: string,
    newSubEntity: Omit<U, 'id'> | { _id: string },
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  abstract addSubEntities<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    versionOrLastModifiedTimestamp: string | 'any',
    subEntitiesJsonPath: string,
    newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  abstract getAllEntities<T>(
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T[]>;

  abstract getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): ErrorOr<T[]>;

  abstract getEntityByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  abstract getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object | undefined,
    EntityClass: new () => T
  ): ErrorOr<number>;

  abstract getEntityById<T>(
    _id: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  abstract getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<U>;

  abstract getSubEntities<T extends object, U extends object>(
    _id: string,
    subEntityPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<[U[]>;

  abstract getEntitiesByIds<T>(
    _ids: string[],
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): ErrorOr<T[]>;

  abstract getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  abstract getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): ErrorOr<[T[]>;

  abstract updateEntity<T extends BackkEntity>(
    entity: RecursivePartial<T> & { _id: string },
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook
  ): ErrorOr<null>;

  updateEntities<T extends BackkEntity>(
    entities: Array<RecursivePartial<T> & { _id: string }>,
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[]
  ): ErrorOr<null> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(entities, async (entity, index) => {
          const possibleErrorResponse = await this.updateEntity(
            entity,
            EntityClass,
            preHooks
          );

          if (possibleErrorResponse) {
            possibleErrorResponse.errorMessage =
              'BackkEntity ' + index + ': ' + possibleErrorResponse.errorMessage;
            throw possibleErrorResponse;
          }
        });
      } catch (errorResponse) {
        return errorResponse;
      }
    });
  }

  abstract updateEntityWhere<T extends BackkEntity>(
    fieldPathName: string,
    fieldValue: any,
    entity: RecursivePartial<T>,
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook
  ): ErrorOr<null>;

  abstract deleteEntityById<T extends BackkEntity>(
    _id: string,
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook
  ): ErrorOr<null>;

  deleteEntitiesByIds<T extends BackkEntity>(
    _ids: string[],
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[]
  ): ErrorOr<null> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(_ids, async (_id, index) => {
          const possibleErrorResponse = await this.deleteEntityById(_id, EntityClass, preHooks);
          if (possibleErrorResponse) {
            possibleErrorResponse.errorMessage =
              'BackkEntity ' + index + ': ' + possibleErrorResponse.errorMessage;
            throw possibleErrorResponse;
          }
        });
      } catch (errorResponse) {
        return errorResponse;
      }
    });
  }

  abstract deleteEntitiesWhere<T extends BackkEntity>(
    fieldName: string,
    fieldValue: any,
    EntityClass: new () => T
  ): ErrorOr<null>;

  abstract deleteEntitiesByFilters<T extends BackkEntity>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T
  ): ErrorOr<null>;

  abstract removeSubEntities<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<[T>;

  abstract removeSubEntityById<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    subEntityId: string,
    EntityClass: new () => T,
    preHooks?: PreHook<T> | PreHook<T>[],
    postHook?: PostHook,
    postQueryOperations?: PostQueryOperations
  ): ErrorOr<T>;

  abstract deleteAllEntities<T>(EntityClass: new () => T): ErrorOr<null>;
}
