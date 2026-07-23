export type OfferScope = 'RESTAURANT' | 'CATEGORY' | 'ITEM';
export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Offer {
  id: number;
  restaurant_id: number;
  badge_text: string;
  title: string;
  subtitle: string | null;
  discount_type: DiscountType;
  discount_value: number;
  scope: OfferScope;
  category_id: number | null;
  menu_item_id: number | null;
  valid_until_time: string | null;
  applies_dine_in: boolean;
  applies_takeaway: boolean;
  is_active: boolean;
  sort_order: number;
  category_name: string | null;
  menu_item_name: string | null;
}
