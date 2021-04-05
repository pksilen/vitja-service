import Tag from "./entities/Tag";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import { PromiseErrorOr } from "../../backk/types/PromiseErrorOr";
import TagName from "./args/TagName";
import DbTableVersion from "../../backk/dbmanager/version/DbTableVersion";

export default abstract class TagService extends CrudEntityService {
  abstract initializeDbVersion1(): PromiseErrorOr<DbTableVersion>;
  abstract migrateDbFromVersion1To2(): PromiseErrorOr<DbTableVersion>;

  abstract deleteAllTags(): PromiseErrorOr<null>;
  abstract createTag(arg: Tag): PromiseErrorOr<Tag>;
  abstract getTagsByName(arg: TagName): PromiseErrorOr<Tag[]>;
}
