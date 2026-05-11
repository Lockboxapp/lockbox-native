import { Text, View } from 'react-native';

import { ActionButton } from './ActionButton';
import { AppCard } from './AppCard';
import { useTheme } from '@/hooks/use-theme';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  title?: string;
};

/**
 * Themed error card. Used when an API call fails — every screen
 * mounts this in place of its happy-path content and offers a
 * retry CTA when the caller passes `onRetry`.
 */
export function ErrorState({
  message,
  onRetry,
  title = 'Something went wrong',
}: ErrorStateProps) {
  const t = useTheme();
  return (
    <AppCard tone="subtle">
      <Text style={[t.typography.title, { color: t.colors.text }]}>{title}</Text>
      <Text style={[t.typography.body, { color: t.colors.textMuted }]}>
        {message}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: t.spacing.xs }}>
          <ActionButton title="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </AppCard>
  );
}
