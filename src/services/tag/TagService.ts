import { BackkError } from "../../backk/types/BackkError";
import Tag from "./entities/Tag";
import TagName from "./args/TagName";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";

export default abstract class TagService extends CrudResourceService {
  abstract initializeDatabase(): Promise<BackkError | null>;
  abstract migrateDbFromVersion1To2(): Promise<BackkError | null>;
  abstract deleteAllTags(): Promise<BackkError | null>;
  abstract createTag(arg: TagName): Promise<[Tag, BackkError | null]>;
  abstract getTagsWhoseNameContains(arg: TagName): Promise<[Tag[], BackkError | null]>;
}
