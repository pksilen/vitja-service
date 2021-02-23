import Tag from "./entities/Tag";
import TagName from "./args/TagName";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

export default abstract class TagService extends CrudResourceService {
  abstract initializeDatabase(): PromiseOfErrorOr<null>;
  abstract migrateDbFromVersion1To2(): PromiseOfErrorOr<null>;
  abstract deleteAllTags(): PromiseOfErrorOr<null>;
  abstract createTag(arg: TagName): PromiseOfErrorOr<Tag>;
  abstract getTagsWhoseNameContains(arg: TagName): PromiseOfErrorOr<Tag[]>;
}
