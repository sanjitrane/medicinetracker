import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { colors, spacing, typography } from '@/constants/theme';
import { OCRServiceError } from '@/features/scanner/services/ocrService';
import { openAiOcrService } from '@/features/scanner/services/openAiOcrService';

type ScanState = 'ready' | 'capturing' | 'analyzing' | 'error';

/**
 * Camera → capture → OCR (architecture.md #14). The result never becomes a
 * medicine on its own — it's handed to the same form manual entry uses, as a
 * suggestion the user reviews and edits (architecture.md #14, #17).
 */
export default function ScannerScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>('ready');
  const [errorMessage, setErrorMessage] = useState('');

  const goToManualEntry = () => router.push('/medicines/manual');

  const capture = async () => {
    if (!cameraRef.current || state !== 'ready') return;

    setState('capturing');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) {
        throw new OCRServiceError('Could not capture a photo. Please try again.');
      }

      setState('analyzing');
      const result = await openAiOcrService.scanMedicine(photo.uri);
      router.push({ pathname: '/medicines/manual', params: { scan: JSON.stringify(result) } });
    } catch (error) {
      setErrorMessage(
        error instanceof OCRServiceError
          ? error.message
          : 'Something went wrong while scanning. Please try again or enter this medicine manually.'
      );
      setState('error');
    }
  };

  const retry = () => {
    setErrorMessage('');
    setState('ready');
  };

  if (!permission) {
    return (
      <Screen>
        <Text style={styles.message}>Checking camera permission…</Text>
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen contentContainerStyle={styles.permissionContent}>
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.message}>
          Medicine Tracker uses the camera to scan medicine packaging, so you don&apos;t have to
          type everything in by hand. Photos are only sent to the scanning service to read the
          label — they are not stored.
        </Text>

        {permission.canAskAgain ? (
          <Button label="Allow Camera Access" onPress={requestPermission} />
        ) : (
          <Button label="Open Settings" onPress={() => Linking.openSettings()} />
        )}
        <Button label="Enter Manually Instead" variant="ghost" onPress={goToManualEntry} />
      </Screen>
    );
  }

  if (state === 'error') {
    return (
      <Screen contentContainerStyle={styles.permissionContent}>
        <Text style={styles.title}>Scan failed</Text>
        <Text style={styles.message}>{errorMessage}</Text>

        <Button label="Try Again" onPress={retry} />
        <Button label="Enter Manually Instead" variant="ghost" onPress={goToManualEntry} />
      </Screen>
    );
  }

  const isBusy = state === 'capturing' || state === 'analyzing';

  return (
    <Screen padBottom={false} contentContainerStyle={styles.cameraContent}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View style={styles.controls}>
        {isBusy ? (
          <Text style={styles.busyText}>
            {state === 'capturing' ? 'Capturing…' : 'Reading the label…'}
          </Text>
        ) : (
          <Text style={styles.hint}>Fit the medicine name and dates in the frame</Text>
        )}

        <Button
          label={isBusy ? 'Please wait…' : 'Capture'}
          onPress={capture}
          disabled={isBusy}
          loading={isBusy}
        />
        <Button
          label="Enter Manually Instead"
          variant="ghost"
          onPress={goToManualEntry}
          disabled={isBusy}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: {
    ...typography.body,
    color: colors.textSecondary,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  permissionContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  cameraContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  camera: {
    flex: 1,
  },
  controls: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  busyText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
  },
});
