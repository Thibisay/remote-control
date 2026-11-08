import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

type Props = {
  icon: ReactNode;
  onPress?: () => void;
  size?: number;
  background?: string;
  /** Small caption under the button. */
  label?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function CircleButton({
  icon,
  onPress,
  size = 52,
  background = colors.surface,
  label,
  disabled,
  accessibilityLabel,
}: Props) {
  return (
    <View style={[styles.slot, disabled && styles.disabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: background,
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        {icon}
      </Pressable>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { alignItems: 'center', gap: 6 },
  button: { alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.onVariant, fontSize: 11, fontWeight: '500' },
  disabled: { opacity: 0.4 },
});
