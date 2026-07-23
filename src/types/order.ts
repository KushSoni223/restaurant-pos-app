export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface CustomerOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: CustomerOrderItem[];
  total: number;
  createdAt: string;
  estimatedMinutes?: number;
}
