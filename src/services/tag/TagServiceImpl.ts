import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import TagService from './TagService';
import Tag from './entities/Tag';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import DefaultPostQueryOperations from '../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { OnStartUp } from '../../backk/decorators/service/function/OnStartUp';
import DbTableVersion from '../../backk/dbmanager/version/DbTableVersion';
import { HttpStatusCodes } from '../../backk/constants/constants';
import tryGetSeparatedValuesFromTextFile from '../../backk/file/tryGetSeparatedValuesFromTextFile';
import executeForAll from '../../backk/utils/executeForAll';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import TagName from './args/TagName';

@Injectable()
export default class TagServiceImpl extends TagService {
  constructor(dbManager: AbstractDbManager) {
    super({}, dbManager);
  }

  @OnStartUp()
  async initializeDbVersion1(): PromiseErrorOr<null> {
    let [, error] = await this.dbManager.getEntityByFilters({ entityName: 'Tag' }, DbTableVersion);

    if (error?.statusCode === HttpStatusCodes.NOT_FOUND) {
      [, error] = await this.dbManager.createEntity({ entityName: 'Tag' }, DbTableVersion, {
        preHooks: () => {
          const tags = tryGetSeparatedValuesFromTextFile('resources/tags1.txt');
          return executeForAll(tags, (tag) => this.dbManager.createEntity({ name: tag }, Tag));
        }
      });
    }

    return [null, error];
  }

  @OnStartUp()
  async migrateDbFromVersion1To2(): PromiseErrorOr<null> {
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
        return executeForAll(tags, (tag) => this.dbManager.createEntity({ name: tag }, Tag));
      }
    });
  }

  @AllowForTests()
  deleteAllTags(): PromiseErrorOr<null> {
    return this.dbManager.deleteAllEntities(Tag);
  }

  @AllowForEveryUser()
  @NoCaptcha()
  createTag(tag: Tag): PromiseErrorOr<Tag> {
    return this.dbManager.createEntity(tag, Tag);
  }

  @AllowForEveryUser()
  getTagsByName({ name }: TagName): PromiseErrorOr<Tag[]> {
    const filters = this.dbManager.getFilters<Tag>({ name: new RegExp(name) }, [
      new SqlExpression('name LIKE :name', { name: `%${name}%` })
    ]);

    return this.dbManager.getEntitiesByFilters(filters, Tag, {
      postQueryOperations: new DefaultPostQueryOperations()
    });
  }
}
