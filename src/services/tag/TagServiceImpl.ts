import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import TagService from './TagService';
import Tag from './entities/Tag';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { OnStartUp } from '../../backk/decorators/service/function/OnStartUp';
import DbTableVersion from '../../backk/dbmanager/version/DbTableVersion';
import tryGetSeparatedValuesFromTextFile from '../../backk/file/tryGetSeparatedValuesFromTextFile';
import { PromiseErrorOr } from '../../backk/types/PromiseErrorOr';
import TagName from './args/TagName';

@Injectable()
export default class TagServiceImpl extends TagService {
  constructor(dbManager: AbstractDbManager) {
    super({}, dbManager);
  }

  @OnStartUp()
  initializeDbVersion1(): PromiseErrorOr<DbTableVersion> {
    return this.dbManager.getEntityByFilters(DbTableVersion, { entityName: "Tag" }, {
      ifEntityNotFoundReturn: () =>
        this.dbManager.createEntity(DbTableVersion, { entityName: "Tag" }, {
          preHooks: () =>
            this.dbManager.createEntities(Tag, tryGetSeparatedValuesFromTextFile("resources/tags1.txt").map((tag) => ({
              name: tag
            })))
        })
    });
  }

  @OnStartUp()
  migrateDbFromVersion1To2(): PromiseErrorOr<DbTableVersion> {
    return this.dbManager.getEntityByFilters(DbTableVersion, { entityName: "Tag", version: 1 }, {
      ifEntityNotFoundReturn: () => Promise.resolve([null, null]),
      postHook: (tagDbTableVersion1) =>
        tagDbTableVersion1
          ? this.dbManager.updateEntity(DbTableVersion, tagDbTableVersion1, {
            preHooks: () =>
              this.dbManager.createEntities(Tag, tryGetSeparatedValuesFromTextFile("resources/tags2.txt").map((tag) => ({
                name: tag
              })))
          })
          : true
    });
  }

  @AllowForTests()
  deleteAllTags(): PromiseErrorOr<null> {
    return this.dbManager.deleteAllEntities(Tag);
  }

  @AllowForEveryUser()
  @NoCaptcha()
  createTag(tag: Tag): PromiseErrorOr<Tag> {
    return this.dbManager.createEntity(Tag, tag);
  }

  @AllowForEveryUser()
  getTagsByName({ name }: TagName): PromiseErrorOr<Tag[]> {
    const filters = this.dbManager.getFilters<Tag>({ name: new RegExp(name) }, [
      new SqlExpression('name LIKE :name', { name: `%${name}%` })
    ]);

    return this.dbManager.getEntitiesByFilters(Tag, filters);
  }
}
