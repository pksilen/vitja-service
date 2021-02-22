import _Id from "../../../../backk/types/id/_Id";
import FavoriteSalesItem from "../entities/FavoriteSalesItem";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndFavoriteSalesItem extends _Id {
  favoriteSalesItem!: FavoriteSalesItem;
}
