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
  async initializeDatabase(): Promise<DbTableVersion | ErrorResponse> {
    const tagVersionOrErrorResponse = await this.dbManager.getEntityWhere(
      'entityName',
      'Tag',
      DbTableVersion
    );

    if (isErrorResponse(tagVersionOrErrorResponse, HttpStatusCodes.NOT_FOUND)) {
      return await this.dbManager.createEntity({ entityName: 'Tag' }, DbTableVersion, {
        preHookFunc: async () => {
          await this.createTag({ name: 'tag 1' });
          await this.createTag({ name: 'tag 2' });
        }
      });
    }

    return tagVersionOrErrorResponse;
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
