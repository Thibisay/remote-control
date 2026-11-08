import type { ReactNode } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import { colors } from '../theme';

/** Dark full-screen container with the status-bar offset. */
export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: (StatusBar.currentHeight ?? 24) + 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});
