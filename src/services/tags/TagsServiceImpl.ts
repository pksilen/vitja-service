import { Injectable } from "@nestjs/common";
import AbstractDbManager from "../../backk/dbmanager/AbstractDbManager";
import { AllowForTests } from "../../backk/decorators/service/function/AllowForTests";
import { ErrorResponse } from "../../backk/types/ErrorResponse";
import TagsService from "./TagsService";
import Tag from "./entities/Tag";
import TagName from "./args/TagName";

@Injectable()
export default class TagsServiceImpl extends TagsService {
  constructor(
    dbManager: AbstractDbManager
  ) {
    super(dbManager);
  }

  @AllowForTests()
  deleteAllTags(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllEntities(Tag);
  }

  createTag(name: TagName): Promise<Tag | ErrorResponse> {
    throw new Error('Not implemented')
  }

  getTagsWhoseNameContains(name: TagName): Promise<Tag[] | ErrorResponse> {
    throw new Error('Not implemented')
  }
}
