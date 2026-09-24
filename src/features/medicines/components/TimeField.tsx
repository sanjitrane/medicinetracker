import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

export interface TimeFieldProps {
  label: string;
  /** 24h "HH:mm". */
  value: string;
  onChange: (nextValue: string) => void;
}

function toDate(time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour ?? 0, minute ?? 0, 0, 0);
  return date;
}

function toTimeString(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatDisplay(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = Number(hourStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelveHour}:${minute} ${period}`;
}

/**
 * Native alarm-time picker for one dose slot. iOS renders the picker inline
 * with `display="compact"`, which manages its own popover — Android has no
 * such mode, so the dialog is only mounted while `isOpen`, and closes itself
 * once the user picks a time or dismisses it.
 */
export function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (event: { type: string }, date?: Date) => {
    if (Platform.OS === 'android') {
      setIsOpen(false);
    }
    if (event.type === 'set' && date) {
      onChange(toTimeString(date));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={toDate(value)}
          mode="time"
          display="compact"
          onChange={handleChange}
          style={styles.iosPicker}
        />
      ) : (
        <>
          <Pressable
            onPress={() => setIsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${formatDisplay(value)}`}
            style={styles.pill}
          >
            <Text style={styles.pillText}>{formatDisplay(value)}</Text>
          </Pressable>
          {isOpen ? (
            <DateTimePicker value={toDate(value)} mode="time" display="default" onChange={handleChange} />
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  iosPicker: {
    marginLeft: -spacing.sm,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  pillText: {
    ...typography.label,
    color: colors.primaryDark,
  },
});
