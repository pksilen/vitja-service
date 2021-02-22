import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { BackkError } from '../../backk/types/BackkError';
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
import isErrorResponse from '../../backk/errors/isErrorResponse';
import tryGetSeparatedValuesFromTextFile from '../../backk/file/tryGetSeparatedValuesFromTextFile';
import executeForAll from '../../backk/utils/executeForAll';

@Injectable()
export default class TagServiceImpl extends TagService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @OnStartUp()
  async initializeDatabase(): Promise<BackkError | null> {
    let tagTableVersion = await this.dbManager.getEntityByFilters({ entityName: 'Tag' }, DbTableVersion);

    if (isErrorResponse(tagTableVersion, HttpStatusCodes.NOT_FOUND)) {
      tagTableVersion = await this.dbManager.createEntity({ entityName: 'Tag' }, DbTableVersion, () => {
        const tags = tryGetSeparatedValuesFromTextFile('resources/tags1.txt');
        return executeForAll(tags, (tag) => this.createTag({ name: tag }));
      });
    }

    return 'errorMessage' in tagTableVersion ? tagTableVersion : undefined;
  }

  @OnStartUp()
  async migrateDbFromVersion1To2(): Promise<BackkError | null> {
    const tagTableVersion1 = await this.dbManager.getEntityByFilters(
      { entityName: 'Tag', version: 1 },
      DbTableVersion
    );

    if ('errorMessage' in tagTableVersion1) {
      return isErrorResponse(tagTableVersion1, HttpStatusCodes.NOT_FOUND) ? undefined : tagTableVersion1;
    }

    return this.dbManager.updateEntity(tagTableVersion1, DbTableVersion, () => {
      const tags = tryGetSeparatedValuesFromTextFile('resources/tags2.txt');
      return executeForAll(tags, (tag) => this.createTag({ name: tag }));
    });
  }

  @AllowForTests()
  deleteAllTags(): Promise<BackkError | null> {
    return this.dbManager.executeInsideTransaction(async () => {
      return (
        (await this.dbManager.deleteAllEntities(SalesItem)) || (await this.dbManager.deleteAllEntities(Tag))
      );
    });
  }

  @AllowForEveryUser()
  @NoCaptcha()
  createTag({ name }: TagName): Promise<[Tag, BackkError | null]> {
    return this.dbManager.createEntity({ name }, Tag);
  }

  @AllowForEveryUser()
  getTagsWhoseNameContains({ name }: TagName): Promise<[Tag[], BackkError | null]> {
    const filters = this.dbManager.getFilters<Tag>({ name: new RegExp(name) }, [
      new SqlExpression('name LIKE :name', { name: `%${name}%` })
    ]);

    return this.dbManager.getEntitiesByFilters(filters, Tag, new DefaultPostQueryOperations());
  }
}
