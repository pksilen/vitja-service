import AbstractDbManager, { Field } from "./AbstractDbManager";
import { BackkEntity } from "../types/entities/BackkEntity";
import { SubEntity } from "../types/entities/SubEntity";
import MongoDbQuery from "./mongodb/MongoDbQuery";
import SqlExpression from "./sql/expressions/SqlExpression";
import { PromiseErrorOr } from "../types/PromiseErrorOr";

export default class NoOpDbManager extends AbstractDbManager {
  getModifyColumnStatement(): string {
    throw new Error('Not implemented');
  }

  addSubEntitiesToEntityById<T extends BackkEntity, U extends object>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  addSubEntityToEntityById<T extends BackkEntity, U extends SubEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  createEntity<T>(): PromiseErrorOr<T> {
    throw new Error('Not implemented');
  }

  deleteAllEntities<T>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  deleteEntitiesByFilters<T extends object>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  deleteEntitiesByField<T extends object>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  deleteEntityById<T extends object>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  executeInsideTransaction<T>(): PromiseErrorOr<T> {
    throw new Error('Not implemented');
  }

  getAllEntities<T>(): PromiseErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getDbHost(): string {
    return '';
  }

  getDbManagerType(): string {
    return '';
  }

  getEntitiesByFilters<T>(): PromiseErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getEntitiesByIds<T>(): PromiseErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getEntityCount<T>(): PromiseErrorOr<number> {
    throw new Error('Not implemented');
  }

  getEntitiesByField<T>(): PromiseErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getEntityById<T>(): PromiseErrorOr<T> {
    throw new Error('Not implemented');
  }

  getEntityByField<T>(): PromiseErrorOr<T> {
    throw new Error('Not implemented');
  }

  getIdColumnType(): string {
    return '';
  }

  getSubEntitiesOfEntityById<T extends object, U extends object>(): PromiseErrorOr<U[]> {
    throw new Error('Not implemented');
  }

  getFirstSubEntityOfEntityById<T extends object, U extends object>(): PromiseErrorOr<U> {
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

  removeSubEntitiesFromEntityById<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeSubEntityFromEntityById<T extends BackkEntity>(): PromiseErrorOr<null> {
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

  updateEntity<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  updateEntityByField<T extends BackkEntity>(): PromiseErrorOr<null> {
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

  getEntityByFilters<T>(): PromiseErrorOr<T> {
    throw new Error('Not implemented');
  }

  isDuplicateEntityError(): boolean {
    throw new Error('Not implemented');
  }

  getFilters<T>(): Array<MongoDbQuery<T> | SqlExpression> | Partial<T> | object {
    throw new Error('Not implemented');
  }

  shouldConvertTinyIntegersToBooleans(): boolean {
    return false;
  }

  updateEntitiesByFilters<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  getBooleanType(): string {
    throw new Error('Not implemented');
  }

  deleteEntityByField<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeSubEntityFromEntityByField<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  addEntityFieldValues<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeEntityFieldValues<T extends BackkEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeSubEntitiesFromEntityByField<T extends BackkEntity, U extends object>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  addSubEntitiesToEntityByField<T extends BackkEntity, U extends SubEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }

  addSubEntityToEntityByField<T extends BackkEntity, U extends SubEntity>(): PromiseErrorOr<null> {
    throw new Error('Not implemented');
  }
}
