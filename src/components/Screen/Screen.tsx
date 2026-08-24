import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandWatermark } from '@/components/BrandWatermark';
import { colors, spacing } from '@/constants/theme';

export interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView. Off for screens that manage their own list. */
  scrollable?: boolean;
  /** Pad for the home indicator / nav bar. Screens inside a Stack usually want this. */
  padBottom?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Standard screen shell: background colour, horizontal gutters and safe-area
 * handling in one place so individual screens do not each reinvent it.
 */
export function Screen({
  children,
  scrollable = false,
  padBottom = true,
  contentContainerStyle,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = padBottom ? Math.max(insets.bottom, spacing.lg) : 0;

  if (scrollable) {
    return (
      <View style={styles.root}>
        <BrandWatermark />
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPadding },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BrandWatermark />
      <View style={[styles.content, { paddingBottom: bottomPadding }, contentContainerStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
