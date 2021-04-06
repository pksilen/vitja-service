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
  async initializeDbVersion1(): PromiseErrorOr<DbTableVersion> {
    return this.dbManager.getEntityByFilters({ entityName: 'Tag' }, DbTableVersion, {
      ifEntityNotFoundReturn: () =>
        this.dbManager.createEntity({ entityName: 'Tag' }, DbTableVersion, {
          preHooks: () =>
            this.dbManager.createEntities(
              tryGetSeparatedValuesFromTextFile('resources/tags1.txt').map((tag) => ({
                name: tag
              })),
              Tag
            )
        })
    });
  }

  @OnStartUp()
  async migrateDbFromVersion1To2(): PromiseErrorOr<DbTableVersion> {
    return this.dbManager.getEntityByFilters({ entityName: 'Tag', version: 1 }, DbTableVersion, {
      postHook: (tagDbTableVersion1) =>
        tagDbTableVersion1
          ? this.dbManager.updateEntity(tagDbTableVersion1, DbTableVersion, {
              preHooks: () =>
                this.dbManager.createEntities(
                  tryGetSeparatedValuesFromTextFile('resources/tags2.txt').map((tag) => ({
                    name: tag
                  })),
                  Tag
                )
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
