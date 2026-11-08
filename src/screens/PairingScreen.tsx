import type * as React from 'react';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTvState, type TvDevice, type TvRemote } from '../tv';
import { Button, Screen, TopBar } from '../ui/components';
import { BackIcon, TvIcon } from '../ui/icons';
import { colors } from '../ui/theme';

type Props = {
  remote: TvRemote;
  device: TvDevice;
  onCancel: () => void;
};

const CODE_LENGTH = 6;

/** Asks for the 6-character code the TV shows on screen. */
export default function PairingScreen({ remote, device, onCancel }: Props) {
  const state = useTvState(remote);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  const failed = state.status === 'error';
  const preparing = state.status === 'pairing' && !state.awaitingCode;
  const message = state.status === 'error' ? state.message : null;

  const onChange = (text: string) => {
    setCode(text.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, CODE_LENGTH));
  };

  const submit = async () => {
    setBusy(true);
    try {
      await remote.submitPairingCode(code);
    } catch {
      // The failure shows up through the connection state.
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setCode('');
    await remote.connect(device).catch(() => {});
    input.current?.focus();
  };

  return (
    <Screen>
      <TopBar title="Emparejar" icon={<BackIcon size={22} />} onBack={onCancel} />
      <View style={styles.hero}>
        <View style={styles.tv}>
          <TvIcon size={44} color={colors.primary} />
        </View>
        <Text style={styles.name}>{device.name}</Text>
        <Text style={styles.hint}>
          Mira la pantalla del TV y escribe el código de 6 caracteres que aparece.
        </Text>
      </View>

      {preparing ? (
        <Text style={styles.preparing}>
          Preparando el emparejamiento… La primera vez puede tardar unos segundos.
        </Text>
      ) : null}

      <Pressable style={[styles.boxes, preparing && { opacity: 0.4 }]} onPress={() => input.current?.focus()}>
        {Array.from({ length: CODE_LENGTH }, (_, i) => {
          const active = !failed && i === Math.min(code.length, CODE_LENGTH - 1);
          return (
            <View
              key={i}
              style={[
                styles.box,
                active && styles.boxActive,
                failed && { borderColor: colors.danger },
              ]}
            >
              <Text style={styles.char}>{code[i] ?? ''}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={input}
        value={code}
        onChangeText={onChange}
        autoFocus
        editable={!preparing}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={CODE_LENGTH}
        style={styles.hidden}
      />
      {message ? <Text style={styles.error}>{message}</Text> : null}

      <View style={styles.spacer} />
      <View style={styles.actions}>
        {failed ? (
          <Button label="Intentar de nuevo" onPress={retry} />
        ) : (
          <Button
            label={busy ? 'Emparejando…' : 'Emparejar'}
            onPress={submit}
            disabled={busy || preparing || code.length < CODE_LENGTH}
          />
        )}
        <Button label="Cancelar" variant="outline" onPress={onCancel} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 14, paddingTop: 12, marginBottom: 28 },
  tv: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.onSurface, fontSize: 18, fontWeight: '600' },
  hint: { color: colors.onVariant, fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  box: {
    width: 50,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderWidth: 2, borderColor: colors.primary },
  char: { color: colors.onSurface, fontSize: 26, fontWeight: '600' },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  preparing: { color: colors.onVariant, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginTop: 16 },
  spacer: { flex: 1 },
  actions: { gap: 12 },
});
