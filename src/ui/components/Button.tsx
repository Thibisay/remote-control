import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'outline';
  icon?: ReactNode;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', icon, disabled }: Props) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.outline,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.7 },
      ]}
    >
      {icon}
      <Text style={[styles.text, { color: primary ? colors.onPrimary : colors.onSurface }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
  },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1.5, borderColor: colors.outline },
  text: { fontSize: 16, fontWeight: '600' },
});
