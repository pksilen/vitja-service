import UserWithoutId from './UserWithoutId';
import Entity from "../../../backk/Entity";

@Entity
export default class User extends UserWithoutId {
  _id!: string;
}
