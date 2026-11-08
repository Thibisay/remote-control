import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TvRemote } from '../tv';
import { BackspaceIcon, EnterIcon, ShiftIcon } from '../ui/icons';
import { colors } from '../ui/theme';

type Props = { remote: TvRemote; tvName: string | null };

const NUMBERS = '1234567890'.split('');
const ROW1 = 'qwertyuiop'.split('');
const ROW2 = 'asdfghjkl'.split('');
const ROW3 = 'zxcvbnm'.split('');

/** Full QWERTY keyboard. Every tap is sent to the TV right away. */
export default function KeyboardPanel({ remote, tvName }: Props) {
  const [shift, setShift] = useState(false);
  // What we have typed from this screen, shown on the phone. It is our own record of
  // the keys sent, not read back from the TV, so it can differ if the TV field had text.
  const [typed, setTyped] = useState('');

  const char = (c: string) => {
    const out = shift ? c.toUpperCase() : c;
    remote.sendText(out).catch(() => {});
    setTyped((t) => t + out);
    if (shift) setShift(false);
  };

  const backspace = () => {
    remote.sendKey('backspace').catch(() => {});
    setTyped((t) => t.slice(0, -1));
  };

  const search = () => {
    remote.sendKey('enter').catch(() => {});
    setTyped('');
  };

  const letterKey = (c: string) => (
    <Key key={c} onPress={() => char(c)}>
      <Text style={styles.keyText}>{shift ? c.toUpperCase() : c}</Text>
    </Key>
  );

  return (
    <View style={styles.root}>
      <View style={styles.live}>
        <View style={styles.dot} />
        <Text style={styles.liveText}>{tvName ? `Escribiendo en el TV · ${tvName}` : 'Sin TV conectado'}</Text>
      </View>
      <View style={styles.preview}>
        <Text style={typed ? styles.previewText : styles.previewEmpty} numberOfLines={2}>
          {typed ? `${typed}▏` : 'Lo que escribas aparecerá aquí'}
        </Text>
      </View>
      <Text style={styles.hint}>Cada tecla se envía al TV al instante. Buscar confirma en el TV.</Text>
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
          <Key wide onPress={backspace}>
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
          <Key enter onPress={search}>
            <View style={styles.searchContent}>
              <EnterIcon size={20} color={colors.onPrimary} />
              <Text style={styles.searchText}>Buscar</Text>
            </View>
          </Key>
        </View>
      </View>
    </View>
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
  root: { flex: 1, marginTop: 18 },
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
  preview: {
    minHeight: 64,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
    marginBottom: 12,
  },
  previewText: { color: colors.onSurface, fontSize: 20 },
  previewEmpty: { color: colors.onVariant, fontSize: 16 },
  searchContent: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  searchText: { color: colors.onPrimary, fontSize: 14, fontWeight: '600' },
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
  enterKey: { flex: 2.6, backgroundColor: colors.primary },
  keyText: { color: colors.onSurface, fontSize: 18, fontWeight: '500' },
  space: { color: colors.onVariant, fontSize: 15 },
});
