import AbstractDbManager, { Field } from "./AbstractDbManager";
import { Entity } from "../types/entities/Entity";
import { SubEntity } from "../types/entities/SubEntity";
import { ErrorResponse } from "../types/ErrorResponse";

export default class NoOpDbManager extends AbstractDbManager {
  addSubEntities<T extends Entity, U extends object>(): Promise<ErrorResponse | T> {
    throw new Error('Not implemented');
  }

  addSubEntity<T extends Entity, U extends SubEntity>(): Promise<ErrorResponse | T> {
    throw new Error('Not implemented');
  }

  createEntity<T>(): Promise<ErrorResponse | T> {
    throw new Error('Not implemented');
  }

  deleteAllEntities<T>(): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  deleteEntitiesByFilters<T extends object>(): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  deleteEntitiesWhere<T extends object>(): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  deleteEntityById<T extends object>(): Promise<void | ErrorResponse> {
    throw new Error('Not implemented');
  }

  executeInsideTransaction<T>(): Promise<ErrorResponse | T> {
    throw new Error('Not implemented');
  }

  getAllEntities<T>(): Promise<T[] | ErrorResponse> {
    throw new Error('Not implemented');
  }

  getDbHost(): string {
    return '';
  }

  getDbManagerType(): string {
    return '';
  }

  getEntitiesByFilters<T>(
  ): Promise<T[] | ErrorResponse> {
    throw new Error('Not implemented')
  }

  getEntitiesByIds<T>(
  ): Promise<T[] | ErrorResponse> {
    throw new Error('Not implemented')
  }

  getEntitiesCount<T>(
  ): Promise<number | ErrorResponse> {
    throw new Error('Not implemented')
  }

  getEntitiesWhere<T>(
  ): Promise<T[] | ErrorResponse> {
    throw new Error('Not implemented')
  }

  getEntityById<T>(
  ): Promise<ErrorResponse | T> {
    throw new Error('Not implemented')
  }

  getEntityWhere<T>(
  ): Promise<ErrorResponse | T> {
    throw new Error('Not implemented')
  }

  getIdColumnType(): string {
    return '';
  }

  getSubEntities<T extends object, U extends object>(
  ): Promise<U[] | ErrorResponse> {
    throw new Error('Not implemented')
  }

  getSubEntity<T extends object, U extends object>(
  ): Promise<ErrorResponse | U> {
    throw new Error('Not implemented')
  }

  getTimestampType(): string {
    return '';
  }

  getVarCharType(maxLength: number): string {
    return '';
  }

  isDbReady(): Promise<boolean> {
    return Promise.resolve(false);
  }

  removeSubEntities<T extends Entity>(
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented')
  }

  removeSubEntityById<T extends Entity>(
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented')
  }

  tryExecute<T>(): Promise<T> {
    throw new Error('Not implemented')
  }

  tryExecuteSql<T>(): Promise<Field[]> {
    throw new Error('Not implemented')
  }

  tryExecuteSqlWithoutCls<T>(
  ): Promise<Field[]> {
    throw new Error('Not implemented')
  }

  tryReleaseDbConnectionBackToPool(): void {
    // No operation
  }

  tryReserveDbConnectionFromPool(): Promise<void> {
      throw new Error('Not implemented')
  }

  updateEntity<T extends Entity>(
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented')
  }

  updateEntityWhere<T extends Entity>(
  ): Promise<void | ErrorResponse> {
    throw new Error('Not implemented')
  }
}
