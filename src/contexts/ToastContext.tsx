import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';

type ToastType = 'error' | 'success';

interface ToastState {
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextValue {
  showError: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);

  const show = useCallback(
    (next: ToastState) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      setToast(next);
      opacity.setValue(0);
      translateY.setValue(-16);

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();

      hideTimer.current = setTimeout(hide, TOAST_DURATION_MS);
    },
    [hide, opacity, translateY],
  );

  const value = useMemo(
    () => ({
      showError: (title: string, message?: string) => show({ title, message, type: 'error' }),
      showSuccess: (title: string, message?: string) => show({ title, message, type: 'success' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.host,
            {
              top: insets.top + 12,
              opacity,
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable
            onPress={hide}
            style={[
              styles.toast,
              toast.type === 'error' ? styles.errorToast : styles.successToast,
            ]}
          >
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  errorToast: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  successToast: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  message: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
