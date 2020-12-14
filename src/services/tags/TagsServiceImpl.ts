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

@Injectable()
export default class TagsServiceImpl extends TagsService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
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
    return this.dbManager.getEntitiesByFilters(
      [new SqlExpression('name LIKE :name', { name: `%${name}%` })],
      Tag,
      new DefaultPostQueryOperations()
    );
  }
}
