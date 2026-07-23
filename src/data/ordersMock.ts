import type { CustomerOrder } from '@/types/order';

export const MOCK_ORDERS: CustomerOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-1042',
    status: 'preparing',
    items: [
      { name: 'Grilled Salmon', quantity: 1, unitPrice: 18.99 },
      { name: 'Fresh Lime Mojito', quantity: 2, unitPrice: 5.5 },
    ],
    total: 29.99,
    createdAt: '2026-07-13T10:15:00',
    estimatedMinutes: 18,
  },
  {
    id: '2',
    orderNumber: 'ORD-1038',
    status: 'ready',
    items: [
      { name: 'Classic Cheeseburger', quantity: 2, unitPrice: 14.25 },
      { name: 'Cold Brew Iced Coffee', quantity: 1, unitPrice: 4.25 },
    ],
    total: 32.75,
    createdAt: '2026-07-12T19:40:00',
  },
  {
    id: '3',
    orderNumber: 'ORD-1021',
    status: 'completed',
    items: [
      { name: 'Chocolate Lava Cake', quantity: 1, unitPrice: 7.99 },
      { name: 'Bruschetta Trio', quantity: 1, unitPrice: 7.5 },
    ],
    total: 15.49,
    createdAt: '2026-07-10T13:20:00',
  },
  {
    id: '4',
    orderNumber: 'ORD-1015',
    status: 'cancelled',
    items: [{ name: 'Truffle Mushroom Pasta', quantity: 1, unitPrice: 16.5 }],
    total: 16.5,
    createdAt: '2026-07-08T12:05:00',
  },
];
