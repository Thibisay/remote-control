import { StatusBar } from 'expo-status-bar';

import ConnectScreen from './src/screens/ConnectScreen';

export default function App() {
  return (
    <>
      <ConnectScreen />
      <StatusBar style="auto" />
    </>
  );
}
