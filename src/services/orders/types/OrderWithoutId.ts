import ShoppingCartItem from '../../users/types/ShoppingCartItem';

export default class OrderWithoutId {
  buyerId!: string;
  shoppingCartItems!: ShoppingCartItem[];
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
