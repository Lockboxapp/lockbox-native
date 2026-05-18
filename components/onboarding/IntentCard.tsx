// ============================================================
// components/onboarding/IntentCard.tsx
//
// Single intent option on Screen 2. Full-width pressable with
// emoji + label + description. Selected state: forest-green
// border + checkmark.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type IntentCardProps = {
  emoji: string;
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

export function IntentCard({
  emoji,
  label,
  description,
  selected,
  onPress,
}: IntentCardProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}. ${description}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? t.colors.surfaceAccent : t.colors.surface,
          borderColor: selected ? t.colors.accent : t.colors.border,
          borderWidth: selected ? 2 : 1,
          borderRadius: t.radius.xl,
          padding: t.spacing.lg,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={[
          styles.emojiWrap,
          { backgroundColor: t.colors.surfaceSubtle },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={[t.typography.title, { color: t.colors.text }]}>
          {label}
        </Text>
        <Text
          style={[
            t.typography.caption,
            { color: t.colors.textMuted, marginTop: 2 },
          ]}
        >
          {description}
        </Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color={t.colors.accent} />
      ) : (
        <View style={styles.checkPlaceholder} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiWrap: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  body: {
    flex: 1,
  },
  checkPlaceholder: {
    width: 22,
  },
});
