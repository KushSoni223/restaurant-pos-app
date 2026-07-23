import { Ionicons } from '@expo/vector-icons';
import { CameraMountError, CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button, Input } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';

interface RestaurantScannerProps {
  onScan: (code: string, source: 'qr' | 'manual') => Promise<void>;
  isResolving?: boolean;
}

const CAMERA_HEIGHT = 260;
const SCAN_COOLDOWN_MS = 2500;

export function RestaurantScanner({ onScan, isResolving = false }: RestaurantScannerProps) {
  const { showError } = useToast();
  const { contentPadding } = useScreenLayout('tabHeaderless');
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [hasScanned, setHasScanned] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const lastScanRef = useRef({ at: 0, data: '' });

  const handleBarcode = useCallback(
    async ({ data }: { data: string }) => {
      const trimmed = data.trim();
      if (!trimmed || hasScanned || isResolving || !isCameraReady) {
        return;
      }

      const now = Date.now();
      if (
        trimmed === lastScanRef.current.data &&
        now - lastScanRef.current.at < SCAN_COOLDOWN_MS
      ) {
        return;
      }

      lastScanRef.current = { at: now, data: trimmed };
      setHasScanned(true);
      try {
        await onScan(trimmed, 'qr');
      } catch (error) {
        setHasScanned(false);
        lastScanRef.current = { at: 0, data: '' };
        showError(
          'Scan failed',
          error instanceof Error ? error.message : 'Could not find that restaurant.',
        );
      }
    },
    [hasScanned, isCameraReady, isResolving, onScan, showError],
  );

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      showError('Enter a code', 'Type the restaurant code from the QR.');
      return;
    }
    try {
      await onScan(manualCode.trim(), 'manual');
    } catch (error) {
      showError(
        'Invalid code',
        error instanceof Error ? error.message : 'Restaurant not found.',
      );
    }
  };

  const handleMountError = useCallback(
    (event: { nativeEvent: { message: string } }) => {
      setIsCameraReady(false);
      showError(
        'Camera error',
        event.nativeEvent.message ||
          'Could not start the camera. Try closing and reopening the app.',
      );
    },
    [showError],
  );

  const canScan = isCameraReady && !hasScanned && !isResolving;
  const showCamera = Boolean(permission?.granted);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.screen, contentPadding]}>
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="qr-code-outline" size={32} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>Scan restaurant</Text>
          <Text style={styles.subtitle}>
            Scan the QR at your table to see that restaurant&apos;s menu and place your order.
          </Text>
        </View>

        {!permission ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : !permission.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>Camera access is needed to scan QR codes.</Text>
            <Button title="Allow camera" onPress={requestPermission} />
          </View>
        ) : (
          <>
            <View style={styles.cameraWrap} collapsable={false}>
              <CameraView
                style={styles.camera}
                facing="back"
                ratio={Platform.OS === 'android' ? '4:3' : undefined}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onCameraReady={() => setIsCameraReady(true)}
                onMountError={(event: CameraMountError) =>
                  handleMountError({ nativeEvent: { message: event.message } as { message: string } })
                }
                onBarcodeScanned={canScan ? handleBarcode : undefined}
              />
              <View style={styles.cameraOverlay} pointerEvents="none">
                <View style={styles.scanFrame} />
              </View>
              {!isCameraReady ? (
                <View style={styles.cameraLoading} pointerEvents="none">
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.cameraLoadingText}>Starting camera…</Text>
                </View>
              ) : null}
            </View>
            {isResolving ? (
              <View style={styles.statusBanner}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.statusBannerText}>Loading menu…</Text>
              </View>
            ) : null}
          </>
        )}

        <ScrollView
          style={styles.manualScroll}
          contentContainerStyle={styles.manualScrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.manualSection}>
            <Text style={styles.manualLabel}>Or enter code manually</Text>
            <Text style={styles.manualHint}>
              {showCamera
                ? 'Point the camera at a table QR, or type a code below.'
                : 'On a simulator, try TABLETAP or HARBOR. Table codes look like TABLETAP|8.'}
            </Text>
            <Input
              placeholder="Restaurant code"
              autoCapitalize="characters"
              value={manualCode}
              onChangeText={setManualCode}
            />
            <Button
              title={isResolving ? 'Loading…' : 'Continue'}
              onPress={handleManualSubmit}
              disabled={isResolving}
              style={styles.manualButton}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  intro: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  loader: {
    marginVertical: spacing.xxl,
  },
  permissionBox: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  permissionText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  cameraWrap: {
    width: '100%',
    height: CAMERA_HEIGHT,
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 180,
    height: 180,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cameraLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: spacing.sm,
  },
  cameraLoadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  manualScroll: {
    flex: 1,
  },
  manualScrollContent: {
    paddingBottom: spacing.tabScrollBottom,
  },
  manualSection: {
    marginTop: spacing.xs,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  manualHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  manualButton: {
    marginTop: spacing.md,
  },
});
