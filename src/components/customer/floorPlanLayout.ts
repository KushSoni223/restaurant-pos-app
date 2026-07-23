/** Architectural slot positions (% of floor canvas). Matches a real dining room layout. */
export interface FloorPlanSlot {
  number: string;
  left: number;
  top: number;
}

export interface FloorZone {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export const FLOOR_ZONES: FloorZone[] = [
  { label: 'Window dining', left: 2, top: 16, width: 30, height: 58 },
  { label: 'Main hall', left: 32, top: 14, width: 36, height: 52 },
  { label: 'Garden patio', left: 70, top: 14, width: 28, height: 72 },
];

export const FLOOR_PLAN_SLOTS: FloorPlanSlot[] = [
  { number: '1', left: 10, top: 24 },
  { number: '2', left: 10, top: 40 },
  { number: '3', left: 22, top: 32 },
  { number: '4', left: 10, top: 58 },
  { number: '5', left: 38, top: 20 },
  { number: '6', left: 54, top: 20 },
  { number: '7', left: 42, top: 38 },
  { number: '8', left: 56, top: 38 },
  { number: '9', left: 76, top: 22 },
  { number: '10', left: 76, top: 38 },
  { number: '11', left: 76, top: 54 },
  { number: '12', left: 76, top: 70 },
];

export function getSlotForTable(number: string): FloorPlanSlot | undefined {
  return FLOOR_PLAN_SLOTS.find((slot) => slot.number === number);
}

export function getRestaurantInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
