import Tag from "./entities/Tag";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import { PromiseErrorOr } from "../../backk/types/PromiseErrorOr";
import TagName from "./args/TagName";

export default abstract class TagService extends CrudEntityService {
  abstract initializeDbVersion1(): PromiseErrorOr<null>;
  abstract migrateDbFromVersion1To2(): PromiseErrorOr<null>;

  abstract deleteAllTags(): PromiseErrorOr<null>;
  abstract createTag(arg: Tag): PromiseErrorOr<Tag>;
  abstract getTagsByName(arg: TagName): PromiseErrorOr<Tag[]>;
}
