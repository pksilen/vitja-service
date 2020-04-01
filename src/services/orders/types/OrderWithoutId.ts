import ShoppingCartItem from '../../users/types/ShoppingCartItem';

export default class OrderWithoutId {
  userId!: string;
  shoppingCartItems!: ShoppingCartItem[];
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
