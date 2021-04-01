import { BackkEntity } from '../../../../types/entities/BackkEntity';
import { PromiseOfErrorOr } from '../../../../types/PromiseOfErrorOr';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';

export default async function addFieldValues<T extends BackkEntity>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  fieldName: string,
  values: (string | number | boolean)[],
  EntityClass: new () => T
): PromiseOfErrorOr<null> {
  throw new Error('Not implemented');
}
