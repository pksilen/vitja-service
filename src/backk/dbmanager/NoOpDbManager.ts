import AbstractDbManager, { Field } from './AbstractDbManager';
import { BackkEntity } from '../types/entities/BackkEntity';
import { SubEntity } from '../types/entities/SubEntity';
import { BackkError } from '../types/BackkError';
import MongoDbQuery from './mongodb/MongoDbQuery';
import SqlExpression from './sql/expressions/SqlExpression';

export default class NoOpDbManager extends AbstractDbManager {
  getModifyColumnStatement(): string {
    throw new Error('Not implemented');
  }

  addSubEntities<T extends BackkEntity, U extends object>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  addSubEntity<T extends BackkEntity, U extends SubEntity>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  createEntity<T>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  deleteAllEntities<T>(): Promise<BackkError | null> {
    throw new Error('Not implemented');
  }

  deleteEntitiesByFilters<T extends object>(): Promise<BackkError | null> {
    throw new Error('Not implemented');
  }

  deleteEntitiesWhere<T extends object>(): Promise<BackkError | null> {
    throw new Error('Not implemented');
  }

  deleteEntityById<T extends object>(): Promise<BackkError | null> {
    throw new Error('Not implemented');
  }

  executeInsideTransaction<T>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  getAllEntities<T>(): Promise<[T[], BackkError | null]> {
    throw new Error('Not implemented');
  }

  getDbHost(): string {
    return '';
  }

  getDbManagerType(): string {
    return '';
  }

  getEntitiesByFilters<T>(): Promise<[T[], BackkError | null]> {
    throw new Error('Not implemented');
  }

  getEntitiesByIds<T>(): Promise<[T[], BackkError | null]> {
    throw new Error('Not implemented');
  }

  getEntitiesCount<T>(): Promise<[number,  BackkError | null> {
    throw new Error('Not implemented');
  }

  getEntitiesWhere<T>(): Promise<[T[], BackkError | null]> {
    throw new Error('Not implemented');
  }

  getEntityById<T>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  getEntityWhere<T>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  getIdColumnType(): string {
    return '';
  }

  getSubEntities<T extends object, U extends object>(): Promise<[U[], BackkError | null]> {
    throw new Error('Not implemented');
  }

  getSubEntity<T extends object, U extends object>(): Promise<BackkError | U> {
    throw new Error('Not implemented');
  }

  getTimestampType(): string {
    return '';
  }

  getVarCharType(): string {
    return '';
  }

  isDbReady(): Promise<boolean> {
    return Promise.resolve(false);
  }

  removeSubEntities<T extends BackkEntity>(): Promise<[T, BackkError | null]> {
    throw new Error('Not implemented');
  }

  removeSubEntityById<T extends BackkEntity>(): Promise<[T, BackkError | null]> {
    throw new Error('Not implemented');
  }

  tryExecute<T>(): Promise<T> {
    throw new Error('Not implemented');
  }

  tryExecuteSql<T>(): Promise<Field[]> {
    throw new Error('Not implemented');
  }

  tryExecuteSqlWithoutCls<T>(): Promise<Field[]> {
    throw new Error('Not implemented');
  }

  tryReleaseDbConnectionBackToPool(): void {
    // No operation
  }

  tryReserveDbConnectionFromPool(): Promise<void> {
    throw new Error('Not implemented');
  }

  updateEntity<T extends BackkEntity>(): Promise<BackkError | null> {
    throw new Error('Not implemented');
  }

  updateEntityWhere<T extends BackkEntity>(): Promise<BackkError | null> {
    throw new Error('Not implemented');
  }

  cleanupTransaction(): void {
    // No operation
  }

  getClient(): any {
    return undefined;
  }

  tryBeginTransaction(): Promise<void> {
    return Promise.resolve(undefined);
  }

  connectMongoDb(): Promise<void> {
    return Promise.resolve(undefined);
  }

  disconnectMongoDb(): Promise<void> {
    return Promise.resolve(undefined);
  }

  getEntityByFilters<T>(): Promise<BackkError | T> {
    throw new Error('Not implemented');
  }

  isDuplicateEntityError(error: Error): boolean {
    throw new Error('Not implemented');
  }

  getFilters<T>(
    mongoDbFilters: Array<MongoDbQuery<T>> | Partial<T> | object,
    sqlFilters: SqlExpression[] | Partial<T> | object
  ): Array<MongoDbQuery<T> | SqlExpression> | Partial<T> | object {
    throw new Error('Not implemented');
  }
}
