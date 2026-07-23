/** Shared spacing scale for layout, gutters, and component rhythm. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  /** Standard horizontal screen gutter. */
  screenHorizontal: 16,
  /** Extra top breathing room below the safe area / header. */
  screenTop: 12,
  /** Bottom padding for scroll content. */
  screenBottom: 24,
  /** Extra clearance so the last item clears the tab bar. */
  tabScrollBottom: 12,
  /** Vertical gap between major screen sections. */
  sectionGap: 20,
  cardInner: 16,
  cardRadius: 20,
} as const;
