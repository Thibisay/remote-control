import { useEffect, useState, type ReactNode } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RemoteKey, TvApp, TvRemote } from '../tv';
import { CircleButton } from '../ui/components';
import {
  AddIcon,
  AppsIcon,
  BackIcon,
  DownIcon,
  HomeIcon,
  KeyboardIcon,
  LeftIcon,
  MicIcon,
  MuteIcon,
  PowerIcon,
  RemoveIcon,
  RightIcon,
  SettingsIcon,
  TvIcon,
  UpIcon,
  VolumeIcon,
} from '../ui/icons';
import { TV_APPS } from '../ui/apps';
import KeyboardPanel from './KeyboardPanel';
import NumpadPanel from './NumpadPanel';
import { colors } from '../ui/theme';

type Props = {
  remote: TvRemote;
  /** Name of the connected TV, or null when not connected. */
  tvName: string | null;
  onOpenTvList: () => void;
};

type Mode = 'dpad' | 'numpad' | 'keyboard';

const soon = (what: string) => Alert.alert(what, 'Próximamente.');

export default function RemoteScreen({
  remote,
  tvName,
  onOpenTvList,
}: Props) {
  // Which control is shown above the fixed bottom bar.
  const [mode, setMode] = useState<Mode>('dpad');
  const toggle = (m: Exclude<Mode, 'dpad'>) => setMode((cur) => (cur === m ? 'dpad' : m));

  // Android back closes the numpad/keyboard first, instead of leaving the app.
  useEffect(() => {
    if (mode === 'dpad') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setMode('dpad');
      return true;
    });
    return () => sub.remove();
  }, [mode]);

  const connected = tvName !== null;
  const key = (k: RemoteKey) => () => {
    remote.sendKey(k).catch(() => {});
  };
  const app = (a: TvApp) => () => {
    remote.openApp(a).catch(() => {});
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.selector} onPress={onOpenTvList} accessibilityRole="button">
          <TvIcon size={20} color={colors.primary} />
          <Text style={styles.selectorText} numberOfLines={1}>
            {tvName ?? 'Sin TV conectado'}
          </Text>
          <DownIcon size={20} color={colors.onVariant} />
        </Pressable>
        <CircleButton
          size={44}
          accessibilityLabel="Ajustes del TV"
          icon={<SettingsIcon size={22} />}
          disabled={!connected}
          onPress={key('settings')}
        />
        <CircleButton
          size={44}
          accessibilityLabel="Encender o apagar"
          icon={<PowerIcon size={22} color={colors.danger} />}
          disabled={!connected}
          onPress={key('power')}
        />
      </View>

      {mode === 'dpad' ? (
        <View style={[styles.apps, !connected && styles.dim]} pointerEvents={connected ? 'auto' : 'none'}>
          {TV_APPS.map((a) => (
            <Pressable key={a.id} style={styles.chip} onPress={app(a.id)} accessibilityRole="button">
              <View style={[styles.dot, { backgroundColor: a.color }]} />
              <Text style={styles.chipText} numberOfLines={1}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.body, !connected && styles.dim]} pointerEvents={connected ? 'auto' : 'none'}>
        {mode === 'numpad' ? <NumpadPanel remote={remote} tvName={tvName} /> : null}
        {mode === 'keyboard' ? <KeyboardPanel remote={remote} tvName={tvName} /> : null}
        {mode === 'dpad' ? (
          <>
            <View style={styles.dpad}>
              <Arrow style={styles.up} onPress={key('up')} icon={<UpIcon size={34} />} />
              <Arrow style={styles.down} onPress={key('down')} icon={<DownIcon size={34} />} />
              <Arrow style={styles.left} onPress={key('left')} icon={<LeftIcon size={34} />} />
              <Arrow style={styles.right} onPress={key('right')} icon={<RightIcon size={34} />} />
              <Pressable style={styles.ok} onPress={key('ok')} accessibilityRole="button">
                <Text style={styles.okText}>OK</Text>
              </Pressable>
            </View>

            <View style={styles.mid}>
              <Rocker
                label="Volumen"
                top={<AddIcon size={26} />}
                middle={<VolumeIcon size={22} color={colors.onVariant} />}
                bottom={<RemoveIcon size={26} />}
                onTop={key('volumeUp')}
                onBottom={key('volumeDown')}
              />
              <View style={styles.center}>
                <CircleButton size={56} label="Silencio" icon={<MuteIcon />} onPress={key('mute')} />
                <CircleButton size={56} label="Voz" icon={<MicIcon />} onPress={() => soon('Micrófono')} />
              </View>
              <Rocker
                label="Canal"
                top={<UpIcon size={26} />}
                middle={<Text style={styles.ch}>CH</Text>}
                bottom={<DownIcon size={26} />}
                onTop={key('channelUp')}
                onBottom={key('channelDown')}
              />
            </View>
          </>
        ) : null}
      </View>

      {/* Fixed bottom bar: always visible. Numbers and Keyboard switch the control above. */}
      <View style={[styles.bottom, !connected && styles.dim]} pointerEvents={connected ? 'auto' : 'none'}>
        <CircleButton label="Atrás" icon={<BackIcon />} onPress={key('back')} />
        <CircleButton label="Inicio" icon={<HomeIcon />} onPress={key('home')} />
        <CircleButton
          label="Números"
          icon={<AppsIcon color={mode === 'numpad' ? colors.primary : undefined} />}
          background={mode === 'numpad' ? colors.primaryContainer : undefined}
          onPress={() => toggle('numpad')}
        />
        <CircleButton
          label="Teclado"
          icon={<KeyboardIcon color={mode === 'keyboard' ? colors.primary : undefined} />}
          background={mode === 'keyboard' ? colors.primaryContainer : undefined}
          onPress={() => toggle('keyboard')}
        />
      </View>
    </View>
  );
}

function Arrow({ icon, onPress, style }: { icon: ReactNode; onPress: () => void; style: object }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.arrow, style, pressed && { opacity: 0.5 }]}
    >
      {icon}
    </Pressable>
  );
}

function Rocker(props: {
  label: string;
  top: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
  onTop: () => void;
  onBottom: () => void;
}) {
  return (
    <View style={styles.rockerSlot}>
      <View style={styles.rocker}>
        <Pressable style={styles.rockerHalf} onPress={props.onTop} accessibilityRole="button">
          {props.top}
        </Pressable>
        <View style={styles.rockerHalf}>{props.middle}</View>
        <Pressable style={styles.rockerHalf} onPress={props.onBottom} accessibilityRole="button">
          {props.bottom}
        </Pressable>
      </View>
      <Text style={styles.rockerLabel}>{props.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  selectorText: { flex: 1, color: colors.onSurface, fontSize: 14, fontWeight: '500' },
  apps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  chip: {
    width: '31.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.onSurface, fontSize: 13, fontWeight: '500' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dim: { opacity: 0.4 },
  body: { flex: 1, justifyContent: 'space-between', marginTop: 18 },
  dpad: {
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: colors.surface,
    alignSelf: 'center',
  },
  arrow: { position: 'absolute', width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  up: { top: 10, left: 86 },
  down: { bottom: 10, left: 86 },
  left: { left: 10, top: 86 },
  right: { right: 10, top: 86 },
  ok: {
    position: 'absolute',
    top: 72,
    left: 72,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  okText: { color: colors.onSurface, fontSize: 22, fontWeight: '600' },
  mid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { gap: 14 },
  rockerSlot: { alignItems: 'center', gap: 6 },
  rocker: { width: 72, height: 156, borderRadius: 36, backgroundColor: colors.surfaceHigh },
  rockerHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rockerLabel: { color: colors.onVariant, fontSize: 11, fontWeight: '500' },
  ch: { color: colors.onVariant, fontSize: 12, fontWeight: '600' },
  bottom: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
});
