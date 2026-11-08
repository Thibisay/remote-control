import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { TvDevice, TvRemote } from '../tv';
import { Button, Screen, TopBar } from '../ui/components';
import { EditIcon, RefreshIcon, TvIcon, WarningIcon, BackIcon } from '../ui/icons';
import { colors } from '../ui/theme';

type Props = {
  remote: TvRemote;
  onBack: () => void;
  /** User picked a TV; the remote moves to `pairing`. */
  onPick: (device: TvDevice) => void;
};

type Phase = 'scanning' | 'results' | 'manual';

export default function SearchScreen({ remote, onBack, onPick }: Props) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [devices, setDevices] = useState<TvDevice[]>([]);
  const [ip, setIp] = useState('192.168.1.');
  const cancelled = useRef(false);

  const scan = () => {
    setPhase('scanning');
    remote
      .discover()
      .then((found) => {
        if (cancelled.current) return;
        setDevices(found);
        setPhase(found.length > 0 ? 'results' : 'manual');
      })
      .catch(() => {
        if (!cancelled.current) setPhase('manual');
      });
  };

  useEffect(() => {
    cancelled.current = false;
    scan();
    return () => {
      cancelled.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectByIp = () => {
    const host = ip.trim();
    if (!host) return;
    onPick({ id: `manual-${host}`, name: host, host, port: 6466 });
  };

  return (
    <Screen>
      <TopBar title="Buscar TVs" icon={<BackIcon size={22} />} onBack={onBack} />

      {phase === 'scanning' && (
        <>
          <Radar />
          <View style={styles.message}>
            <Text style={styles.heading}>Buscando TVs en tu red…</Text>
            <Text style={styles.hint}>
              Asegúrate de que el celular y el TV estén conectados a la misma red WiFi y que el TV esté
              encendido.
            </Text>
          </View>
          <View style={styles.spacer} />
          <Button
            label="Agregar por IP"
            variant="outline"
            icon={<EditIcon size={22} />}
            onPress={() => setPhase('manual')}
          />
        </>
      )}

      {phase === 'results' && (
        <>
          <Text style={styles.subtitle}>
            {devices.length} {devices.length === 1 ? 'TV encontrado' : 'TVs encontrados'} en tu red
          </Text>
          <View style={styles.list}>
            {devices.map((d) => (
              <View key={d.id} style={styles.row}>
                <View style={styles.avatar}>
                  <TvIcon size={22} color={colors.onVariant} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={styles.sub}>{d.host} · Android TV</Text>
                </View>
                <Pressable style={styles.chip} onPress={() => onPick(d)} accessibilityRole="button">
                  <Text style={styles.chipText}>Emparejar</Text>
                </Pressable>
              </View>
            ))}
          </View>
          <View style={styles.spacer} />
          <View style={styles.actions}>
            <Button label="Buscar de nuevo" variant="outline" icon={<RefreshIcon size={22} />} onPress={scan} />
            <Button
              label="Agregar por IP"
              variant="outline"
              icon={<EditIcon size={22} />}
              onPress={() => setPhase('manual')}
            />
          </View>
        </>
      )}

      {phase === 'manual' && (
        <>
          {devices.length === 0 && (
            <>
              <View style={styles.empty}>
                <View style={styles.warning}>
                  <WarningIcon size={40} color={colors.danger} />
                </View>
                <Text style={styles.heading}>No encontramos TVs</Text>
              </View>
              <View style={styles.tips}>
                <Text style={styles.tip}>• El TV está encendido y con WiFi</Text>
                <Text style={styles.tip}>• Celular y TV usan la misma red</Text>
                <Text style={styles.tip}>• “Control remoto de Android TV” activo en el TV</Text>
              </View>
            </>
          )}
          <Text style={styles.label}>Dirección IP del TV</Text>
          <TextInput
            value={ip}
            onChangeText={setIp}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
            placeholder="192.168.1.20"
            placeholderTextColor={colors.onVariant}
            style={styles.input}
          />
          <View style={styles.spacer} />
          <View style={styles.actions}>
            <Button label="Conectar" onPress={connectByIp} disabled={ip.trim().length < 7} />
            <Button label="Buscar de nuevo" variant="outline" icon={<RefreshIcon size={22} />} onPress={scan} />
          </View>
        </>
      )}
    </Screen>
  );
}

/** Concentric rings that pulse while scanning. */
function Radar() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  return (
    <View style={styles.radarWrap}>
      <View style={styles.radar}>
        <View style={[styles.ring, { width: 300, height: 300, backgroundColor: 'rgba(124,156,255,0.04)' }]} />
        <View style={[styles.ring, { width: 220, height: 220, backgroundColor: 'rgba(124,156,255,0.07)' }]} />
        <View style={[styles.ring, { width: 140, height: 140, backgroundColor: 'rgba(124,156,255,0.12)' }]} />
        <Animated.View style={[styles.pulse, { opacity, transform: [{ scale }] }]} />
        <View style={styles.core}>
          <TvIcon size={40} color={colors.onPrimary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  radarWrap: { height: 340, alignItems: 'center', justifyContent: 'center' },
  radar: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 150, borderWidth: 1.5, borderColor: 'rgba(124,156,255,0.35)' },
  pulse: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  core: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { alignItems: 'center', gap: 8, marginTop: 20 },
  heading: { color: colors.onSurface, fontSize: 20, fontWeight: '600', textAlign: 'center' },
  hint: { color: colors.onVariant, fontSize: 14, textAlign: 'center', paddingHorizontal: 12 },
  spacer: { flex: 1 },
  subtitle: { color: colors.onVariant, fontSize: 14, fontWeight: '500', marginBottom: 12 },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { color: colors.onSurface, fontSize: 16, fontWeight: '600' },
  sub: { color: colors.onVariant, fontSize: 13 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.primary },
  chipText: { color: colors.onPrimary, fontSize: 13, fontWeight: '600' },
  actions: { gap: 12 },
  empty: { alignItems: 'center', gap: 12, marginBottom: 16 },
  warning: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tips: { gap: 8, padding: 16, borderRadius: 16, backgroundColor: colors.surface, marginBottom: 20 },
  tip: { color: colors.onVariant, fontSize: 13 },
  label: { color: colors.onVariant, fontSize: 13, fontWeight: '500', marginBottom: 8 },
  input: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    color: colors.onSurface,
    fontSize: 16,
  },
});
