import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CircleButton } from './CircleButton';

type Props = { title: string; icon: ReactNode; onBack: () => void };

/** Title with a round leading button (back arrow or close chevron). */
export function TopBar({ title, icon, onBack }: Props) {
  return (
    <View style={styles.row}>
      <CircleButton size={44} icon={icon} onPress={onBack} accessibilityLabel="Volver" />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  title: { color: '#E6E8EE', fontSize: 20, fontWeight: '600' },
});
