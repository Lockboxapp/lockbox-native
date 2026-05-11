import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type LoadingStateProps = {
  caption?: string;
};

/**
 * Themed loading indicator used while a screen is fetching its initial
 * payload. Keeps the screen quiet — no card chrome, just a spinner and
 * a muted caption — so it sits comfortably under the page header.
 */
export function LoadingState({ caption = 'Loading…' }: LoadingStateProps) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { paddingVertical: t.spacing.xxxl }]}>
      <ActivityIndicator color={t.colors.accent} />
      <Text
        style={[
          t.typography.caption,
          { color: t.colors.textMuted, marginTop: t.spacing.md },
        ]}
      >
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
