import ShoppingCartItem from '../../shoppingcart/types/ShoppingCartItem';

export default class OrderWithoutId {
  userId!: string;
  shoppingCartItems!: ShoppingCartItem[];
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
