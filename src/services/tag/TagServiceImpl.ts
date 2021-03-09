import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import TagService from './TagService';
import Tag from './entities/Tag';
import TagName from './args/TagName';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import DefaultPostQueryOperations from '../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { SalesItem } from '../salesitem/types/entities/SalesItem';
import { OnStartUp } from '../../backk/decorators/service/function/OnStartUp';
import DbTableVersion from '../../backk/dbmanager/version/DbTableVersion';
import { HttpStatusCodes } from '../../backk/constants/constants';
import tryGetSeparatedValuesFromTextFile from '../../backk/file/tryGetSeparatedValuesFromTextFile';
import executeForAll from '../../backk/utils/executeForAll';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';

@Injectable()
export default class TagServiceImpl extends TagService {
  constructor(dbManager: AbstractDbManager) {
    super({}, dbManager);
  }

  @OnStartUp()
  async initializeDatabase(): PromiseOfErrorOr<null> {
    let [, error] = await this.dbManager.getEntityByFilters({ entityName: 'Tag' }, DbTableVersion);

    if (error?.statusCode === HttpStatusCodes.NOT_FOUND) {
      [, error] = await this.dbManager.createEntity({ entityName: 'Tag' }, DbTableVersion, {
        preHooks: () => {
          const tags = tryGetSeparatedValuesFromTextFile('resources/tags1.txt');
          return executeForAll(tags, (tag) => this.createTag({ name: tag }));
        }
      });
    }

    return [null, error];
  }

  @OnStartUp()
  async migrateDbFromVersion1To2(): PromiseOfErrorOr<null> {
    const [tagDbTableVersion1, error] = await this.dbManager.getEntityByFilters(
      { entityName: 'Tag', version: 1 },
      DbTableVersion
    );

    if (!tagDbTableVersion1) {
      return [null, error?.statusCode === HttpStatusCodes.NOT_FOUND ? null : error];
    }

    return this.dbManager.updateEntity(tagDbTableVersion1, DbTableVersion, {
      preHooks: () => {
        const tags = tryGetSeparatedValuesFromTextFile('resources/tags2.txt');
        return executeForAll(tags, (tag) => this.createTag({ name: tag }));
      }
    });
  }

  @AllowForTests()
  deleteAllTags(): PromiseOfErrorOr<null> {
    return this.dbManager.executeInsideTransaction(async () => {
      const [, error] = await this.dbManager.deleteAllEntities(SalesItem);
      return error ? [null, error] : this.dbManager.deleteAllEntities(Tag);
    });
  }

  @AllowForEveryUser()
  @NoCaptcha()
  createTag({ name }: TagName): PromiseOfErrorOr<Tag> {
    return this.dbManager.createEntity({ name }, Tag);
  }

  @AllowForEveryUser()
  getTagsWhoseNameContains({ name }: TagName): PromiseOfErrorOr<Tag[]> {
    const filters = this.dbManager.getFilters<Tag>({ name: new RegExp(name) }, [
      new SqlExpression('name LIKE :name', { name: `%${name}%` })
    ]);

    return this.dbManager.getEntitiesByFilters(filters, Tag, new DefaultPostQueryOperations());
  }
}
