import Tag from "./entities/Tag";
import TagName from "./args/TagName";
import CrudResourceService from "../../backk/service/crudresource/CrudResourceService";
import { ErrorOr } from "../../backk/types/ErrorOr";

export default abstract class TagService extends CrudResourceService {
  abstract initializeDatabase(): ErrorOr<null>;
  abstract migrateDbFromVersion1To2(): ErrorOr<null>;
  abstract deleteAllTags(): ErrorOr<null>;
  abstract createTag(arg: TagName): ErrorOr<Tag>;
  abstract getTagsWhoseNameContains(arg: TagName): ErrorOr<Tag[]>;
}
