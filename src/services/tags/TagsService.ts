import { ErrorResponse } from "../../backk/types/ErrorResponse";
import Tag from "./entities/Tag";
import TagName from "./args/TagName";
import CrudResourceService from "../../backk/crudresource/CrudResourceService";

export default abstract class TagsService extends CrudResourceService {
  abstract initializeDatabase(): Promise<void | ErrorResponse>;
  abstract migrateDbFromVersion1To2(): Promise<void | ErrorResponse>;
  abstract deleteAllTags(): Promise<void | ErrorResponse>;
  abstract createTag(arg: TagName): Promise<Tag | ErrorResponse>;
  abstract getTagsWhoseNameContains(arg: TagName): Promise<Tag[] | ErrorResponse>;
}
