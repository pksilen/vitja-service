import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdWrapper, PostQueryOperations } from '../Backk';

@Injectable()
export default class DbManager {
  createItem<T>(
    item: Omit<T, '_id'>,
    entityClass: new () => T,
    Types: object = {}
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

  getItemBy<T>(fieldName: keyof T, fieldValue: T[keyof T], entityClass: Function): Promise<T | ErrorResponse> {
    throw new Error('Abstract method')
  }

  getItemsBy<T>(
    fieldName: keyof T,
    fieldValue: T[keyof T],
    entityClass: Function
  ): Promise<T[] | ErrorResponse> {
    throw new Error('Abstract method')
  }

  updateItem<T extends { _id?: string; id?: string }>(
    { _id, ...restOfItem }: T,
    entityClass: Function,
    Types: object = {}
  ): Promise<void | ErrorResponse> {
    throw new Error('Abstract method')
  }

  deleteItemById(_id: string, entityClass: Function): Promise<void | ErrorResponse> {
    throw new Error('Abstract method')
  }

  deleteAllItems(entityClass: Function): Promise<void | ErrorResponse> {
    throw new Error('Abstract method')
  }
}
