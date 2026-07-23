import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import {
  getLayoutEdges,
  getScreenPadding,
  type SafeAreaEdge,
  type ScreenLayoutPreset,
} from '@/layout/screenLayout';

export {
  SAFE_AREA_FULL,
  SAFE_AREA_STACK,
  SAFE_AREA_TAB,
  SAFE_AREA_TAB_HEADERLESS,
  type SafeAreaEdge,
  type ScreenLayoutPreset,
} from '@/layout/screenLayout';

interface ScreenProps {
  children: ReactNode;
  /** Preferred — applies safe area + standard screen gutters automatically. */
  layout?: ScreenLayoutPreset;
  /** Manual edge override. Ignored when `layout` is set. */
  edges?: SafeAreaEdge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  scrollContentStyle?: ViewStyle;
  backgroundColor?: string;
  keyboardAware?: boolean;
  scrollable?: boolean;
}

export function Screen({
  children,
  layout = 'full',
  edges,
  style,
  contentStyle,
  scrollContentStyle,
  backgroundColor = colors.surface,
  keyboardAware = true,
  scrollable = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const resolvedEdges = edges ?? getLayoutEdges(layout);
  const screenPadding = edges ? undefined : getScreenPadding(layout, insets);

  const safeStyle = screenPadding ?? {
    paddingTop: resolvedEdges.includes('top') ? insets.top : 0,
    paddingBottom: resolvedEdges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: resolvedEdges.includes('left') ? insets.left : 0,
    paddingRight: resolvedEdges.includes('right') ? insets.right : 0,
  };

  // Scrollable screens must NOT use flex:1 on the inner body — that locks height
  // to the viewport and clips overflowing content (forms, lists, etc.).
  const body = (
    <View
      style={[
        scrollable ? styles.scrollBody : styles.content,
        { backgroundColor },
        safeStyle,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const keyboardBody =
    keyboardAware && scrollable ? (
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        <ScrollView
          style={[styles.flex, { backgroundColor }]}
          contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
    ) : keyboardAware ? (
      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
      >
        {body}
      </KeyboardAvoidingView>
    ) : (
      body
    );

  return (
    <View style={[styles.root, { backgroundColor }, style]}>
      {keyboardBody}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  scrollBody: {
    // Size to children so ScrollView can grow and scroll.
  },
  content: {
    flex: 1,
  },
});
