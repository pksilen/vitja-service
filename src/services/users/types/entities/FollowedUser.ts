import PublicUser from "./PublicUser";
import Entity from "../../../../backk/decorators/entity/Entity";

@Entity('User')
export default class FollowedUser extends PublicUser {
}
