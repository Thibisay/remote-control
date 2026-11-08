import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { TvDevice } from '../tv';
import { Button } from '../ui/components';
import { AddIcon, CheckIcon, TvIcon } from '../ui/icons';
import { colors } from '../ui/theme';

type Props = {
  visible: boolean;
  devices: TvDevice[];
  activeId: string | null;
  onSelect: (device: TvDevice) => void;
  onAdd: () => void;
  onClose: () => void;
};

/** Bottom sheet with the saved TVs. */
export default function TvListSheet(props: Props) {
  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {/* A Modal is a separate root: it needs its own provider to read the insets. */}
      <SafeAreaProvider>
        <SheetContent {...props} />
      </SafeAreaProvider>
    </Modal>
  );
}

function SheetContent({ devices, activeId, onSelect, onAdd, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Cerrar" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>Mis TVs</Text>
          <Text style={styles.count}>
            {devices.length} {devices.length === 1 ? 'guardado' : 'guardados'}
          </Text>
        </View>
        {devices.length === 0 ? (
          <Text style={styles.empty}>Aún no hay TVs guardados.</Text>
        ) : (
          devices.map((d) => {
            const active = d.id === activeId;
            return (
              <Pressable
                key={d.id}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => onSelect(d)}
                accessibilityRole="button"
              >
                <View style={[styles.avatar, active && { backgroundColor: colors.primary }]}>
                  <TvIcon size={22} color={active ? colors.onPrimary : colors.onVariant} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={[styles.sub, active && { color: colors.onSurface }]}>
                    {d.host} · {active ? 'Conectado' : 'Desconectado'}
                  </Text>
                </View>
                {active ? <CheckIcon size={22} color={colors.primary} /> : null}
              </Pressable>
            );
          })
        )}
        <Button label="Agregar TV" icon={<AddIcon size={22} color={colors.onPrimary} />} onPress={onAdd} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.outline },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.onSurface, fontSize: 20, fontWeight: '600' },
  count: { color: colors.onVariant, fontSize: 13 },
  empty: { color: colors.onVariant, fontSize: 14, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surfaceHigh,
  },
  rowActive: { backgroundColor: colors.primaryContainer },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  name: { color: colors.onSurface, fontSize: 16, fontWeight: '600' },
  sub: { color: colors.onVariant, fontSize: 13 },
});
