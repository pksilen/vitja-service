import { ErrorResponse, IdWrapper, PostQueryOperations } from '../Backk';
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';
import { Injectable } from '@nestjs/common';

export interface Field {
  name: string;
}

export default class AbstractDbManager {
  readonly dbName?: string;
  readonly schema?: string;

  execute<T>(dbOperationFunction: (pool: Pool | MongoClient) => Promise<T>): Promise<T> {
    throw new Error('Abstract method');
  }

  executeSql<T>(sqlStatement: string): Promise<Field[]> {
    throw new Error('Abstract method');
  }

  createItem<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types?: object
  ): Promise<IdWrapper | ErrorResponse> {
    throw new Error('Abstract method');
  }

  getItems<T>(
    filters: object,
    { pageNumber, pageSize, sortBy, sortDirection, ...projection }: PostQueryOperations,
    entityClass: new () => T
  ): Promise<T[] | ErrorResponse> {
    throw new Error('Abstract method');
  }

  getItemById<T>(_id: string, entityClass: new () => T): Promise<T | ErrorResponse> {
    throw new Error('Abstract method');
  }

  getItemsByIds<T>(_ids: string[], entityClass: Function): Promise<T[] | ErrorResponse> {
    throw new Error('Abstract method');
  }

  getItemBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: Function
  ): Promise<T | ErrorResponse> {
    throw new Error('Abstract method');
  }

  getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: Function
  ): Promise<T[] | ErrorResponse> {
    throw new Error('Abstract method');
  }

  updateItem<T extends { _id?: string; id?: string }>(
    { _id, ...restOfItem }: T,
    entityClass: Function,
    Types?: object
  ): Promise<void | ErrorResponse> {
    throw new Error('Abstract method');
  }

  deleteItemById(_id: string, entityClass: Function): Promise<void | ErrorResponse> {
    throw new Error('Abstract method');
  }

  deleteAllItems(entityClass: Function): Promise<void | ErrorResponse> {
    throw new Error('Abstract method');
  }
}
