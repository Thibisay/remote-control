import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TvRemote } from '../tv';
import { Button, Screen, TopBar } from '../ui/components';
import { BackspaceIcon, DownIcon } from '../ui/icons';
import { colors } from '../ui/theme';

type Props = { remote: TvRemote; tvName: string | null; onClose: () => void };

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['-', '0', 'back'],
];

/** Numeric keypad. Every tap is sent to the TV right away. */
export default function NumpadScreen({ remote, tvName, onClose }: Props) {
  const press = (k: string) => {
    const op = k === 'back' ? remote.sendKey('backspace') : remote.sendText(k);
    op.catch(() => {});
  };

  return (
    <Screen>
      <TopBar title="Números" icon={<DownIcon size={22} />} onBack={onClose} />
      <View style={styles.live}>
        <View style={styles.dot} />
        <Text style={styles.liveText}>
          {tvName ? `Enviando al TV al instante · ${tvName}` : 'Sin TV conectado'}
        </Text>
      </View>
      <View style={styles.grid}>
        {ROWS.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((k) => (
              <Pressable
                key={k}
                accessibilityRole="button"
                onPress={() => press(k)}
                style={({ pressed }) => [styles.key, pressed && { opacity: 0.5 }]}
              >
                {k === 'back' ? <BackspaceIcon size={24} /> : <Text style={styles.keyText}>{k}</Text>}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      <Button label="OK (confirmar en TV)" onPress={() => remote.sendKey('ok').catch(() => {})} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    marginBottom: 20,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  liveText: { color: colors.onSurface, fontSize: 15, fontWeight: '500' },
  grid: { gap: 12, marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    flex: 1,
    height: 84,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { color: colors.onSurface, fontSize: 30 },
});
