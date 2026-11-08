import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TvRemote } from '../tv';
import { Screen, TopBar } from '../ui/components';
import { BackspaceIcon, DownIcon, EnterIcon, ShiftIcon } from '../ui/icons';
import { colors } from '../ui/theme';

type Props = { remote: TvRemote; tvName: string | null; onClose: () => void };

const NUMBERS = '1234567890'.split('');
const ROW1 = 'qwertyuiop'.split('');
const ROW2 = 'asdfghjkl'.split('');
const ROW3 = 'zxcvbnm'.split('');

/** Full QWERTY keyboard. Every tap is sent to the TV right away. */
export default function KeyboardScreen({ remote, tvName, onClose }: Props) {
  const [shift, setShift] = useState(false);

  const char = (c: string) => {
    remote.sendText(shift ? c.toUpperCase() : c).catch(() => {});
    if (shift) setShift(false);
  };

  const letterKey = (c: string) => (
    <Key key={c} onPress={() => char(c)}>
      <Text style={styles.keyText}>{shift ? c.toUpperCase() : c}</Text>
    </Key>
  );

  return (
    <Screen>
      <TopBar title="Teclado" icon={<DownIcon size={22} />} onBack={onClose} />
      <View style={styles.live}>
        <View style={styles.dot} />
        <Text style={styles.liveText}>{tvName ? `Escribiendo en el TV · ${tvName}` : 'Sin TV conectado'}</Text>
      </View>
      <Text style={styles.hint}>Cada tecla se envía al TV al instante. Enter confirma en el TV.</Text>
      <View style={styles.spacer} />
      <View style={styles.kb}>
        <View style={styles.row}>{NUMBERS.map((c) => (
          <Key key={c} onPress={() => char(c)}>
            <Text style={styles.keyText}>{c}</Text>
          </Key>
        ))}</View>
        <View style={styles.row}>{ROW1.map(letterKey)}</View>
        <View style={[styles.row, styles.inset]}>{ROW2.map(letterKey)}</View>
        <View style={styles.row}>
          <Key wide high={shift} onPress={() => setShift((s) => !s)}>
            <ShiftIcon size={24} color={shift ? colors.primary : colors.onSurface} />
          </Key>
          {ROW3.map(letterKey)}
          <Key wide onPress={() => remote.sendKey('backspace').catch(() => {})}>
            <BackspaceIcon size={24} />
          </Key>
        </View>
        <View style={styles.row}>
          <Key wide onPress={() => char('.')}>
            <Text style={styles.keyText}>.</Text>
          </Key>
          <Key space onPress={() => char(' ')}>
            <Text style={styles.space}>espacio</Text>
          </Key>
          <Key wide onPress={() => char('@')}>
            <Text style={styles.keyText}>@</Text>
          </Key>
          <Key enter onPress={() => remote.sendKey('enter').catch(() => {})}>
            <EnterIcon size={24} color={colors.onPrimary} />
          </Key>
        </View>
      </View>
    </Screen>
  );
}

function Key(props: {
  children: React.ReactNode;
  onPress: () => void;
  wide?: boolean;
  space?: boolean;
  enter?: boolean;
  high?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.key,
        props.wide && styles.wide,
        props.space && styles.spaceKey,
        props.enter && styles.enterKey,
        props.high && { backgroundColor: colors.primaryContainer },
        pressed && { opacity: 0.5 },
      ]}
    >
      {props.children}
    </Pressable>
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
    marginBottom: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  liveText: { color: colors.onSurface, fontSize: 15, fontWeight: '500' },
  hint: { color: colors.onVariant, fontSize: 13 },
  spacer: { flex: 1 },
  kb: { gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  inset: { paddingHorizontal: 14 },
  key: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wide: { flex: 1.5, backgroundColor: colors.surfaceHigh },
  spaceKey: { flex: 5 },
  enterKey: { flex: 1.8, backgroundColor: colors.primary },
  keyText: { color: colors.onSurface, fontSize: 18, fontWeight: '500' },
  space: { color: colors.onVariant, fontSize: 15 },
});
