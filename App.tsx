import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PairingScreen from './src/screens/PairingScreen';
import RemoteScreen from './src/screens/RemoteScreen';
import SearchScreen from './src/screens/SearchScreen';
import TvListSheet from './src/screens/TvListSheet';
import { createTvRemote, useTvState, type TvDevice } from './src/tv';
import { Screen } from './src/ui/components';

type Route = 'remote' | 'search' | 'pairing';

export default function App() {
  const remote = useMemo(() => createTvRemote(), []);
  const state = useTvState(remote);
  const [route, setRoute] = useState<Route>('remote');
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState<TvDevice[]>([]);
  const [pairing, setPairing] = useState<TvDevice | null>(null);

  const connected = state.status === 'connected' ? state.device : null;

  // Go to the pairing screen as soon as the TV asks for a code.
  useEffect(() => {
    if (state.status === 'pairing') {
      setPairing(state.device);
      setRoute('pairing');
    }
    if (state.status === 'error' && route === 'search') {
      Alert.alert('No se pudo conectar', state.message);
    }
    if (state.status === 'connected') {
      const device = state.device;
      setSaved((list) => (list.some((d) => d.id === device.id) ? list : [...list, device]));
      setRoute((r) => (r === 'pairing' || r === 'search' ? 'remote' : r));
    }
  }, [state]);

  // Android back button: go back one level instead of closing the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (sheet) {
        setSheet(false);
        return true;
      }
      if (route === 'pairing') {
        cancelPairing();
        return true;
      }
      if (route !== 'remote') {
        setRoute('remote');
        return true;
      }
      return false;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, sheet]);

  const cancelPairing = () => {
    remote.disconnect().catch(() => {});
    setRoute('remote');
  };

  const pick = (device: TvDevice) => {
    remote.connect(device).catch(() => {});
  };

  let screen;
  switch (route) {
    case 'search':
      screen = <SearchScreen remote={remote} onBack={() => setRoute('remote')} onPick={pick} />;
      break;
    case 'pairing':
      screen = pairing ? <PairingScreen remote={remote} device={pairing} onCancel={cancelPairing} /> : null;
      break;
    default:
      screen = (
        <Screen>
          <RemoteScreen
            remote={remote}
            tvName={connected?.name ?? null}
            onOpenTvList={() => setSheet(true)}
          />
        </Screen>
      );
  }

  return (
    <SafeAreaProvider>
      {screen}
      <TvListSheet
        visible={sheet}
        devices={saved}
        activeId={connected?.id ?? null}
        onSelect={(d) => {
          setSheet(false);
          pick(d);
        }}
        onAdd={() => {
          setSheet(false);
          setRoute('search');
        }}
        onClose={() => setSheet(false)}
      />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
