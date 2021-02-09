import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { AllowForTests } from '../../backk/decorators/service/function/AllowForTests';
import { ErrorResponse } from '../../backk/types/ErrorResponse';
import TagsService from './TagsService';
import Tag from './entities/Tag';
import TagName from './args/TagName';
import { AllowForEveryUser } from '../../backk/decorators/service/function/AllowForEveryUser';
import SqlExpression from '../../backk/dbmanager/sql/expressions/SqlExpression';
import DefaultPostQueryOperations from '../../backk/types/postqueryoperations/DefaultPostQueryOperations';
import { NoCaptcha } from '../../backk/decorators/service/function/NoCaptcha';
import { SalesItem } from '../salesitems/types/entities/SalesItem';
import MongoDbManager from '../../backk/dbmanager/MongoDbManager';
import MongoDbQuery from '../../backk/dbmanager/mongodb/MongoDbQuery';
import { OnStartUp } from '../../backk/decorators/service/function/OnStartUp';
import DbTableVersion from '../../backk/dbmanager/version/DbTableVersion';
import { HttpStatusCodes } from '../../backk/constants/constants';
import isErrorResponse from '../../backk/errors/isErrorResponse';

@Injectable()
export default class TagsServiceImpl extends TagsService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @OnStartUp()
  async initializeDatabase(): Promise<void | ErrorResponse> {
    let tagTableVersionOrErrorResponse = await this.dbManager.getEntityByFilters(
      { entityName: 'Tag' },
      DbTableVersion
    );

    if (isErrorResponse(tagTableVersionOrErrorResponse, HttpStatusCodes.NOT_FOUND)) {
      tagTableVersionOrErrorResponse = await this.dbManager.createEntity(
        { entityName: 'Tag' },
        DbTableVersion,
        {
          preHookFunc: async () => {
            await this.createTag({ name: 'tag 1.1' });
            await this.createTag({ name: 'tag 1.2' });
          }
        }
      );
    }

    return 'errorMessage' in tagTableVersionOrErrorResponse ? tagTableVersionOrErrorResponse : undefined;
  }

  @OnStartUp()
  async migrateDbFromVersion1To2(): Promise<void | ErrorResponse> {
    const tagTableVersion1OrErrorResponse = await this.dbManager.getEntityByFilters(
      { entityName: 'Tag', version: 1 },
      DbTableVersion
    );

    if ('errorMessage' in tagTableVersion1OrErrorResponse) {
      return isErrorResponse(tagTableVersion1OrErrorResponse, HttpStatusCodes.NOT_FOUND)
        ? undefined
        : tagTableVersion1OrErrorResponse;
    }

    return this.dbManager.updateEntity(tagTableVersion1OrErrorResponse, DbTableVersion, [], {
      preHookFunc: async () => {
        await this.createTag({ name: 'tag 2.1' });
        await this.createTag({ name: 'tag 2.2' });
      }
    });
  }

  @AllowForTests()
  deleteAllTags(): Promise<void | ErrorResponse> {
    return this.dbManager.executeInsideTransaction(async () => {
      return (
        (await this.dbManager.deleteAllEntities(SalesItem)) || (await this.dbManager.deleteAllEntities(Tag))
      );
    });
  }

  @AllowForEveryUser()
  @NoCaptcha()
  createTag({ name }: TagName): Promise<Tag | ErrorResponse> {
    return this.dbManager.createEntity({ name }, Tag);
  }

  @AllowForEveryUser()
  getTagsWhoseNameContains({ name }: TagName): Promise<Tag[] | ErrorResponse> {
    const filters =
      this.dbManager instanceof MongoDbManager
        ? [new MongoDbQuery<Tag>({ name: new RegExp(name) })]
        : [new SqlExpression('name LIKE :name', { name: `%${name}%` })];

    return this.dbManager.getEntitiesByFilters(filters, Tag, new DefaultPostQueryOperations());
  }
}
