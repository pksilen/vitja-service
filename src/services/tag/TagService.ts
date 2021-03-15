import Tag from './entities/Tag';
import TagName from './args/TagName';
import CrudEntityService from '../../backk/service/crudentity/CrudEntityService';
import { PromiseOfErrorOr } from '../../backk/types/PromiseOfErrorOr';
import _Id from "../../backk/types/id/_Id";

export default abstract class TagService extends CrudEntityService {
  abstract initializeDatabase(): PromiseOfErrorOr<null>;
  abstract migrateDbFromVersion1To2(): PromiseOfErrorOr<null>;
  abstract deleteAllTags(): PromiseOfErrorOr<null>;
  abstract createTag(arg: TagName): PromiseOfErrorOr<Tag>;
  abstract getTagsByName(arg: TagName): PromiseOfErrorOr<Tag[]>;
  abstract getTag(arg: _Id): PromiseOfErrorOr<Tag>;
  abstract deleteTag(arg: _Id): PromiseOfErrorOr<null>;
}
