import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getContentPadding,
  getHorizontalBleed,
  getLayoutEdges,
  getSafeAreaPadding,
  getScreenLayoutParts,
  getScreenPadding,
  type ScreenLayoutPreset,
  type SafeAreaEdge,
} from '@/layout/screenLayout';

export function useScreenLayout(preset: ScreenLayoutPreset = 'full') {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const edges = getLayoutEdges(preset);
    const horizontalBleed = getHorizontalBleed();

    return {
      preset,
      insets,
      edges,
      safePadding: getSafeAreaPadding(insets, edges),
      contentPadding: getContentPadding(preset, insets),
      screenPadding: getScreenPadding(preset, insets),
      layoutParts: getScreenLayoutParts(preset, insets),
      horizontalBleed,
    };
  }, [insets, preset]);
}

export type { ScreenLayoutPreset, SafeAreaEdge };
