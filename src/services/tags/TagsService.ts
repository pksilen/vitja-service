import { ErrorResponse } from "../../backk/types/ErrorResponse";
import Tag from "./entities/Tag";
import TagName from "./args/TagName";
import CrudResourceService from "../../backk/crudresource/CrudResourceService";
import DbTableVersion from "../../backk/dbmanager/version/DbTableVersion";

export default abstract class TagsService extends CrudResourceService {
  abstract initializeDbVersion1(): Promise<DbTableVersion | ErrorResponse>;
  abstract initializeDbVersion2(): Promise<void | ErrorResponse>;
  abstract deleteAllTags(): Promise<void | ErrorResponse>;
  abstract createTag(arg: TagName): Promise<Tag | ErrorResponse>;
  abstract getTagsWhoseNameContains(arg: TagName): Promise<Tag[] | ErrorResponse>;
}
