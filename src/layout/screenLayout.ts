import { StyleSheet, type ViewStyle } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

import { spacing } from '@/constants/spacing';

export type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right';

/**
 * Screen layout presets — pick the one that matches your navigator chrome.
 *
 * - `full` — no header/tab bar (auth, splash)
 * - `tab` — inside tabs with a visible stack header
 * - `tabHeaderless` — inside tabs with `headerShown: false` (menu, profile)
 * - `stack` — stack screen with header, no tab bar
 */
export type ScreenLayoutPreset = 'full' | 'tab' | 'tabHeaderless' | 'stack';

export const SCREEN_LAYOUT_PRESETS: Record<ScreenLayoutPreset, SafeAreaEdge[]> = {
  full: ['top', 'bottom', 'left', 'right'],
  tab: ['left', 'right'],
  tabHeaderless: ['top', 'left', 'right'],
  stack: ['left', 'right', 'bottom'],
};

/** @deprecated Use `SCREEN_LAYOUT_PRESETS.full` via `layout="full"` on `Screen`. */
export const SAFE_AREA_FULL = SCREEN_LAYOUT_PRESETS.full;

/** @deprecated Use `layout="tab"` on `Screen`. */
export const SAFE_AREA_TAB = SCREEN_LAYOUT_PRESETS.tab;

/** @deprecated Use `layout="tabHeaderless"` on `Screen`. */
export const SAFE_AREA_TAB_HEADERLESS = SCREEN_LAYOUT_PRESETS.tabHeaderless;

/** @deprecated Use `layout="stack"` on `Screen`. */
export const SAFE_AREA_STACK = SCREEN_LAYOUT_PRESETS.stack;

export function getLayoutEdges(preset: ScreenLayoutPreset): SafeAreaEdge[] {
  return SCREEN_LAYOUT_PRESETS[preset];
}

export function getSafeAreaPadding(
  insets: EdgeInsets,
  edges: SafeAreaEdge[],
): ViewStyle {
  return {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };
}

export function getContentPadding(
  preset: ScreenLayoutPreset,
  insets: EdgeInsets,
): ViewStyle {
  const edges = getLayoutEdges(preset);
  const usesTabBar = preset === 'tab' || preset === 'tabHeaderless';

  return {
    paddingTop: edges.includes('top')
      ? insets.top + spacing.screenTop
      : spacing.screenTop,
    paddingBottom: usesTabBar
      ? spacing.screenBottom + spacing.tabScrollBottom
      : edges.includes('bottom')
        ? insets.bottom + spacing.screenBottom
        : spacing.screenBottom,
    paddingLeft: edges.includes('left')
      ? insets.left + spacing.screenHorizontal
      : spacing.screenHorizontal,
    paddingRight: edges.includes('right')
      ? insets.right + spacing.screenHorizontal
      : spacing.screenHorizontal,
  };
}

export function getScreenPadding(
  preset: ScreenLayoutPreset,
  insets: EdgeInsets,
): ViewStyle {
  return getContentPadding(preset, insets);
}

export interface ScreenLayoutParts {
  /** Fixed header block — greeting, search, filters. */
  header: ViewStyle;
  /** Scrollable body content container. */
  scrollContent: ViewStyle;
}

/** Split layout for screens with a pinned header + scrolling body. */
export function getScreenLayoutParts(
  preset: ScreenLayoutPreset,
  insets: EdgeInsets,
): ScreenLayoutParts {
  const edges = getLayoutEdges(preset);
  const usesTabBar = preset === 'tab' || preset === 'tabHeaderless';
  const horizontalLeft = edges.includes('left')
    ? insets.left + spacing.screenHorizontal
    : spacing.screenHorizontal;
  const horizontalRight = edges.includes('right')
    ? insets.right + spacing.screenHorizontal
    : spacing.screenHorizontal;

  return {
    header: {
      paddingTop: edges.includes('top')
        ? insets.top + spacing.screenTop
        : spacing.screenTop,
      paddingLeft: horizontalLeft,
      paddingRight: horizontalRight,
    },
    scrollContent: {
      paddingLeft: horizontalLeft,
      paddingRight: horizontalRight,
      paddingBottom: usesTabBar
        ? spacing.screenBottom + spacing.tabScrollBottom
        : edges.includes('bottom')
          ? insets.bottom + spacing.screenBottom
          : spacing.screenBottom,
    },
  };
}

/** Pull a horizontal scroll row edge-to-edge while keeping item gutters aligned. */
export function getHorizontalBleed(): { container: ViewStyle; content: ViewStyle } {
  return {
    container: {
      marginHorizontal: -spacing.screenHorizontal,
    },
    content: {
      paddingHorizontal: spacing.screenHorizontal,
    },
  };
}

export const screenContentStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.sectionGap,
  },
});
