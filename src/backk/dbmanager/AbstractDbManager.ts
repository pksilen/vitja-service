/* eslint-disable @typescript-eslint/camelcase */
import { getNamespace, Namespace } from 'cls-hooked';
import SqlExpression from './sql/expressions/SqlExpression';
import { RecursivePartial } from '../types/RecursivePartial';
import { PreHook } from './hooks/PreHook';
import { BackkEntity } from '../types/entities/BackkEntity';
import { PostQueryOperations } from '../types/postqueryoperations/PostQueryOperations';
import { Injectable } from '@nestjs/common';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import UserDefinedFilter from '../types/userdefinedfilters/UserDefinedFilter';
import BaseService from '../service/BaseService';
import { SubEntity } from '../types/entities/SubEntity';
import __Backk__CronJobScheduling from '../scheduling/entities/__Backk__CronJobScheduling';
import __Backk__JobScheduling from '../scheduling/entities/__Backk__JobScheduling';
import MongoDbQuery from './mongodb/MongoDbQuery';
import { PostHook } from './hooks/PostHook';
import { FilterQuery } from 'mongodb';
import { PromiseErrorOr } from '../types/PromiseErrorOr';
import { EntityPreHook } from "./hooks/EntityPreHook";
import DbTableVersion from "./version/DbTableVersion";

export interface Field {
  name: string;
}

@Injectable()
export default abstract class AbstractDbManager {
  private readonly services: BaseService[] = [];
  readonly schema: string;
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
      __Backk__JobScheduling,
      DbTableVersion
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
  abstract getBooleanType(): string;
  abstract getDbManagerType(): string;
  abstract getDbHost(): string;
  abstract shouldConvertTinyIntegersToBooleans(): boolean;
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
  abstract executeInsideTransaction<T>(executable: () => PromiseErrorOr<T>): PromiseErrorOr<T>;

  abstract createEntity<T extends BackkEntity>(
    entity: Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>,
    EntityClass: new () => T,
    options?: {
      preHooks?: PreHook | PreHook[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<T>;

  async createEntities<T extends BackkEntity>(
    entities: Array<Omit<T, '_id' | 'createdAtTimestamp' | 'version' | 'lastModifiedTimestamp'>>,
    EntityClass: new () => T,
    preHooks?: PreHook | PreHook[],
    postQueryOperations?: PostQueryOperations
  ): PromiseErrorOr<T[]> {
    return this.executeInsideTransaction(async () => {
      try {
        return await Promise.all(
          entities.map(async (entity, index) => {
            const [, error] = await this.createEntity(entity, EntityClass, {
              preHooks,
              postQueryOperations,
              postHook: undefined
            });

            if (error) {
              error.message = 'Entity ' + index + ': ' + error.message;
              throw error;
            }
          })
        );
      } catch (error) {
        return error;
      }
    });
  }

  // noinspection OverlyComplexFunctionJS
  abstract addSubEntity<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntity: Omit<U, 'id'> | { _id: string },
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<null>;

  // noinspection OverlyComplexFunctionJS
  abstract addSubEntities<T extends BackkEntity, U extends SubEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    newSubEntities: Array<Omit<U, 'id'> | { _id: string }>,
    EntityClass: new () => T,
    SubEntityClass: new () => U,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<null>;

  abstract getAllEntities<T>(
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseErrorOr<T[]>;

  abstract getEntitiesByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseErrorOr<T[]>;

  abstract getEntityByFilters<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseErrorOr<T>;

  abstract getEntitiesCount<T>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object | undefined,
    EntityClass: new () => T
  ): PromiseErrorOr<number>;

  abstract getEntityById<T>(
    _id: string,
    EntityClass: new () => T,
    options?: {
      postQueryOperations?: PostQueryOperations
      postHook?: PostHook<T>;
    }
  ): PromiseErrorOr<T>;

  abstract getSubEntity<T extends object, U extends object>(
    _id: string,
    subEntityJsonPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseErrorOr<U>;

  abstract getSubEntities<T extends object, U extends object>(
    _id: string,
    subEntityJsonPath: string,
    EntityClass: new () => T,
    postQueryOperations?: PostQueryOperations
  ): PromiseErrorOr<U[]>;

  abstract getEntitiesByIds<T>(
    _ids: string[],
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseErrorOr<T[]>;

  abstract getEntityWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    options?: {
      postQueryOperations?: PostQueryOperations,
      postHook?: PostHook<T>
    },
    isSelectForUpdate?: boolean
  ): PromiseErrorOr<T>;

  abstract getEntitiesWhere<T>(
    fieldPathName: string,
    fieldValue: any,
    EntityClass: new () => T,
    postQueryOperations: PostQueryOperations
  ): PromiseErrorOr<T[]>;

  abstract updateEntity<T extends BackkEntity>(
    entity: RecursivePartial<T> & { _id: string },
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<null>;

  abstract updateEntitiesByFilters<T extends BackkEntity>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    entity: Partial<T>,
    EntityClass: new () => T
  ): PromiseErrorOr<null>;

  updateEntities<T extends BackkEntity>(
    entities: Array<RecursivePartial<T> & { _id: string }>,
    EntityClass: new () => T
  ): PromiseErrorOr<null> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(entities, async (entity, index) => {
          const [, error] = await this.updateEntity(entity, EntityClass);

          if (error) {
            error.message = 'Entity ' + index + ': ' + error.message;
            throw error;
          }
        });
      } catch (error) {
        return error;
      }
    });
  }

  abstract updateEntityWhere<T extends BackkEntity>(
    fieldPathName: string,
    fieldValue: any,
    entity: RecursivePartial<T>,
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[],
      postHook?: PostHook<T>,
      postQueryOperations?: PostQueryOperations
    }
  ): PromiseErrorOr<null>;

  abstract deleteEntityById<T extends BackkEntity>(
    _id: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[],
      postHook?: PostHook<T>,
      postQueryOperations?: PostQueryOperations
    }
  ): PromiseErrorOr<null>;

  deleteEntitiesByIds<T extends BackkEntity>(
    _ids: string[],
    EntityClass: new () => T
  ): PromiseErrorOr<null> {
    return this.executeInsideTransaction(async () => {
      try {
        return await forEachAsyncParallel(_ids, async (_id, index) => {
          const [, error] = await this.deleteEntityById(_id, EntityClass);

          if (error) {
            error.message = 'Entity ' + index + ': ' + error.message;
            throw error;
          }
        });
      } catch (error) {
        return error;
      }
    });
  }

  abstract deleteEntityWhere<T extends BackkEntity>(
    fieldName: string,
    fieldValue: T[keyof T],
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[],
      postHook?: PostHook<T>,
      postQueryOperations?: PostQueryOperations
    }
  ): PromiseErrorOr<null>;

  abstract deleteEntitiesWhere<T extends BackkEntity>(
    fieldName: string,
    fieldValue: any,
    EntityClass: new () => T
  ): PromiseErrorOr<null>;

  abstract deleteEntitiesByFilters<T extends BackkEntity>(
    filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | Partial<T> | object,
    EntityClass: new () => T
  ): PromiseErrorOr<null>;

  abstract removeSubEntities<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<null>;

  abstract removeSubEntityById<T extends BackkEntity>(
    _id: string,
    subEntitiesJsonPath: string,
    subEntityId: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<null>;

  abstract removeSubEntitiesWhere<T extends BackkEntity, U extends object>(
    fieldName: string,
    fieldValue: T[keyof T],
    subEntitiesJsonPath: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[],
      postHook?: PostHook<T>,
      postQueryOperations?: PostQueryOperations
    }
  ): PromiseErrorOr<null>;

  abstract removeSubEntityByIdWhere<T extends BackkEntity>(
    fieldName: string,
    fieldValue: T[keyof T],
    subEntitiesJsonPath: string,
    subEntityId: string,
    EntityClass: new () => T,
    options?: {
      preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
      postHook?: PostHook<T>;
      postQueryOperations?: PostQueryOperations;
    }
  ): PromiseErrorOr<null>;

  abstract deleteAllEntities<T>(EntityClass: new () => T): PromiseErrorOr<null>;

  abstract addFieldValues<T extends BackkEntity>(
    _id: string,
    fieldName: string,
    values: (string | number | boolean)[],
    EntityClass: new() => T
  ): PromiseErrorOr<null>;

  abstract removeFieldValues<T extends BackkEntity>(
    _id: string,
    fieldName: string,
    values: (string | number | boolean)[],
    EntityClass: new() => T
  ): PromiseErrorOr<null>;
}

