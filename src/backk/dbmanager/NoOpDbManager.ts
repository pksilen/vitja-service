import AbstractDbManager, { Field } from "./AbstractDbManager";
import { BackkEntity } from "../types/entities/BackkEntity";
import { SubEntity } from "../types/entities/SubEntity";
import MongoDbQuery from "./mongodb/MongoDbQuery";
import SqlExpression from "./sql/expressions/SqlExpression";
import { PromiseOfErrorOr } from "../types/PromiseOfErrorOr";

export default class NoOpDbManager extends AbstractDbManager {
  getModifyColumnStatement(): string {
    throw new Error('Not implemented');
  }

  addSubEntities<T extends BackkEntity, U extends object>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  addSubEntity<T extends BackkEntity, U extends SubEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  createEntity<T>(): PromiseOfErrorOr<T> {
    throw new Error('Not implemented');
  }

  deleteAllEntities<T>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  deleteEntitiesByFilters<T extends object>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  deleteEntitiesWhere<T extends object>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  deleteEntityById<T extends object>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  executeInsideTransaction<T>(): PromiseOfErrorOr<T> {
    throw new Error('Not implemented');
  }

  getAllEntities<T>(): PromiseOfErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getDbHost(): string {
    return '';
  }

  getDbManagerType(): string {
    return '';
  }

  getEntitiesByFilters<T>(): PromiseOfErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getEntitiesByIds<T>(): PromiseOfErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getEntitiesCount<T>(): PromiseOfErrorOr<number> {
    throw new Error('Not implemented');
  }

  getEntitiesWhere<T>(): PromiseOfErrorOr<T[]> {
    throw new Error('Not implemented');
  }

  getEntityById<T>(): PromiseOfErrorOr<T> {
    throw new Error('Not implemented');
  }

  getEntityWhere<T>(): PromiseOfErrorOr<T> {
    throw new Error('Not implemented');
  }

  getIdColumnType(): string {
    return '';
  }

  getSubEntities<T extends object, U extends object>(): PromiseOfErrorOr<U[]> {
    throw new Error('Not implemented');
  }

  getSubEntity<T extends object, U extends object>(): PromiseOfErrorOr<U> {
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

  removeSubEntities<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeSubEntityById<T extends BackkEntity>(): PromiseOfErrorOr<null> {
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

  updateEntity<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  updateEntityWhere<T extends BackkEntity>(): PromiseOfErrorOr<null> {
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

  getEntityByFilters<T>(): PromiseOfErrorOr<T> {
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

  updateEntitiesByFilters<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  getBooleanType(): string {
    throw new Error('Not implemented');
  }

  deleteEntityWhere<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeSubEntityByIdWhere<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  addFieldValues<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }

  removeFieldValues<T extends BackkEntity>(): PromiseOfErrorOr<null> {
    throw new Error('Not implemented');
  }
}
