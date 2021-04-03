import Tag from "./entities/Tag";
import CrudEntityService from "../../backk/service/crudentity/CrudEntityService";
import { PromiseOfErrorOr } from "../../backk/types/PromiseOfErrorOr";

export default abstract class TagService extends CrudEntityService {
  abstract initializeDatabase(): PromiseOfErrorOr<null>;
  abstract migrateDbFromVersion1To2(): PromiseOfErrorOr<null>;
  abstract deleteAllTags(): PromiseOfErrorOr<null>;
  abstract createTag(arg: Tag): PromiseOfErrorOr<Tag>;
  abstract getTagsByName(arg: Tag): PromiseOfErrorOr<Tag[]>;
}
