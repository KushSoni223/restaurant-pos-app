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

export type SafeAreaEdge = 'top' | 'bottom' | 'left' | 'right';

/** Full-screen layouts without a navigation header (auth, splash). */
export const SAFE_AREA_FULL: SafeAreaEdge[] = ['top', 'bottom', 'left', 'right'];

/** Screens inside tab navigators — header and tab bar handle vertical insets. */
export const SAFE_AREA_TAB: SafeAreaEdge[] = ['left', 'right'];

/** Screens inside a stack with a header but no tab bar. */
export const SAFE_AREA_STACK: SafeAreaEdge[] = ['left', 'right', 'bottom'];

interface ScreenProps {
  children: ReactNode;
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
  edges = SAFE_AREA_FULL,
  style,
  contentStyle,
  scrollContentStyle,
  backgroundColor = colors.surface,
  keyboardAware = true,
  scrollable = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const safeStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  const body = (
    <View
      style={[
        scrollable ? styles.scrollInner : styles.content,
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
  scrollInner: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
