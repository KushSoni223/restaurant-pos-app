import { apiRequest } from './client';

export type ApiOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'PAID'
  | 'CANCELLED';

export interface ApiOrderItem {
  id: number;
  menu_item_id: number;
  menu_item_name: string | null;
  quantity: number;
  unit_price: string | number;
  notes: string | null;
  chef_id: number | null;
}

export interface ApiOrder {
  id: number;
  restaurant_id: number | null;
  table_id: number | null;
  table_number: string | null;
  waiter_id: number | null;
  waiter_name?: string | null;
  customer_id: number | null;
  status: ApiOrderStatus;
  notes: string | null;
  subtotal: string | number;
  tax: string | number;
  total: string | number;
  created_at: string;
  items: ApiOrderItem[];
}

export interface CreateOrderPayload {
  restaurant_id?: number;
  customer_id?: number;
  table_id?: number;
  waiter_id?: number;
  notes?: string;
  items: { menu_item_id: number; quantity: number; notes?: string }[];
}

export interface ListOrdersParams {
  restaurantId?: number;
  customerId?: number;
  status?: ApiOrderStatus;
}

function buildOrdersQuery(params?: ListOrdersParams): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  if (params.restaurantId != null) {
    search.set('restaurant_id', String(params.restaurantId));
  }
  if (params.customerId != null) {
    search.set('customer_id', String(params.customerId));
  }
  if (params.status) {
    search.set('status', params.status);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function createOrder(
  payload: CreateOrderPayload,
  authenticated = false,
): Promise<ApiOrder> {
  return apiRequest<ApiOrder>(
    '/api/v1/orders',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    authenticated,
  );
}

export async function listOrders(
  params?: ListOrdersParams,
  authenticated = false,
): Promise<ApiOrder[]> {
  return apiRequest<ApiOrder[]>(`/api/v1/orders${buildOrdersQuery(params)}`, {}, authenticated);
}

export async function getOrder(orderId: number): Promise<ApiOrder> {
  return apiRequest<ApiOrder>(`/api/v1/orders/${orderId}`, {}, true);
}

export async function fetchKitchenQueue(chefId?: number): Promise<ApiOrder[]> {
  const query = chefId != null ? `?chef_id=${chefId}` : '';
  return apiRequest<ApiOrder[]>(`/api/v1/kitchen/queue${query}`);
}

export async function updateOrderStatus(
  orderId: number,
  status: ApiOrderStatus,
  authenticated = false,
): Promise<ApiOrder> {
  return apiRequest<ApiOrder>(
    `/api/v1/orders/${orderId}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    authenticated,
  );
}
