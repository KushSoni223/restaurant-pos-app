export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export interface RestaurantTable {
  id: number;
  restaurant_id: number | null;
  number: string;
  capacity: number;
  status: TableStatus;
}

export interface SelectedTable {
  id: number;
  number: string;
}
