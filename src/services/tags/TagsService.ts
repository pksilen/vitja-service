import { ErrorResponse } from "../../backk/types/ErrorResponse";
import BaseService from "../../backk/service/BaseService";
import Tag from "./entities/Tag";
import TagName from "./args/TagName";

export default abstract class TagsService extends BaseService {
  abstract deleteAllTags(): Promise<void | ErrorResponse>;
  abstract createTag(name: TagName): Promise<Tag | ErrorResponse>;
  abstract getTagsWhoseNameContains(name: TagName): Promise<Tag[] | ErrorResponse>;
}
