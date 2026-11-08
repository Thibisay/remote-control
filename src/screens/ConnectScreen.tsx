import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  MOCK_PAIRING_CODE,
  createTvRemote,
  useTvState,
  type TvDevice,
} from '../tv';

export default function ConnectScreen() {
  const remote = useMemo(() => createTvRemote(), []);
  const state = useTvState(remote);
  const [devices, setDevices] = useState<TvDevice[]>([]);
  const [code, setCode] = useState('');

  const search = async () => {
    setDevices(await remote.discover());
  };

  const submitCode = async () => {
    await remote.submitPairingCode(code);
    setCode('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Full Remote Control</Text>
      <Text style={styles.badge}>Modo de prueba: sin TV real</Text>

      {state.status === 'disconnected' && (
        <View style={styles.section}>
          <Button label="Buscar TVs" onPress={search} />
          {devices.length > 0 && (
            <FlatList
              style={styles.list}
              data={devices}
              keyExtractor={(device) => device.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.device}
                  onPress={() => remote.connect(item)}
                >
                  <Text style={styles.deviceName}>{item.name}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}

      {state.status === 'searching' && (
        <View style={styles.section}>
          <ActivityIndicator size="large" />
          <Text style={styles.message}>Buscando TVs en tu red…</Text>
        </View>
      )}

      {state.status === 'pairing' && (
        <View style={styles.section}>
          <Text style={styles.message}>
            Escribe el código que aparece en {state.device.name}
          </Text>
          <Text style={styles.hint}>(modo de prueba: usa {MOCK_PAIRING_CODE})</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Código"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <Button label="Emparejar" onPress={submitCode} />
          <Button label="Cancelar" variant="secondary" onPress={() => remote.disconnect()} />
        </View>
      )}

      {state.status === 'connected' && (
        <View style={styles.section}>
          <Text style={styles.message}>Conectado a {state.device.name}</Text>
          <Text style={styles.hint}>Los controles llegan en el siguiente paso.</Text>
          <Button label="Desconectar" variant="secondary" onPress={() => remote.disconnect()} />
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.section}>
          <Text style={[styles.message, styles.error]}>{state.message}</Text>
          <Button label="Volver a empezar" onPress={() => remote.disconnect()} />
        </View>
      )}
    </View>
  );
}

function Button({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, variant === 'secondary' && styles.buttonSecondary]}
    >
      <Text
        style={[styles.buttonText, variant === 'secondary' && styles.buttonTextSecondary]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: (NativeStatusBar.currentHeight ?? 24) + 16,
  },
  title: { fontSize: 24, fontWeight: '700' },
  badge: { marginTop: 4, color: '#b45309', fontSize: 13 },
  section: { marginTop: 32, gap: 12 },
  list: { marginTop: 8 },
  device: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  deviceName: { fontSize: 16 },
  message: { fontSize: 16 },
  hint: { color: '#64748b', fontSize: 13 },
  error: { color: '#b91c1c' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: { backgroundColor: '#e2e8f0' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#0f172a' },
});
