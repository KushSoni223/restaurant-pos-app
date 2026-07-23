import { apiRequest } from './client';
import type { Offer } from '@/types/offer';

interface ApiOffer extends Omit<Offer, 'discount_value'> {
  discount_value: string | number;
}

export async function listActiveOffers(restaurantId: number): Promise<Offer[]> {
  const offers = await apiRequest<ApiOffer[]>(
    `/api/v1/offers?restaurant_id=${restaurantId}&active_only=true`,
  );
  return offers.map((offer) => ({
    ...offer,
    discount_value: Number(offer.discount_value),
  }));
}
