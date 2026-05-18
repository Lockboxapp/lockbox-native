// ============================================================
// components/onboarding/LockTypeCard.tsx
//
// One lock-type option on Screen 5. Full-width pressable with:
//   - an animated lock icon (opens → closes on select)
//   - a "Most effective" tag for the HARD card + a faint tint
//   - expandable accordion rows (chevron rotates; the card
//     height transitions via reanimated LinearTransition)
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Badge } from '@/components/ui';
import type { OnboardingLockType } from '@/hooks/use-onboarding';
import { useTheme } from '@/hooks/use-theme';

export type LockAccordion = { question: string; answer: string };

type LockTypeCardProps = {
  lockType: OnboardingLockType;
  title: string;
  description: string;
  caveat: string;
  accordions: LockAccordion[];
  mostEffective?: boolean;
  selected: boolean;
  onSelect: () => void;
};

export function LockTypeCard({
  lockType,
  title,
  description,
  caveat,
  accordions,
  mostEffective,
  selected,
  onSelect,
}: LockTypeCardProps) {
  const t = useTheme();
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Lock icon: a small spring pop when the card becomes selected.
  const iconScale = useSharedValue(1);
  function handleSelect() {
    iconScale.value = withSpring(1.18, { damping: 6 }, () => {
      iconScale.value = withSpring(1);
    });
    onSelect();
  }
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const bg = selected
    ? t.colors.surfaceAccent
    : mostEffective
      ? t.colors.surfaceAccent
      : t.colors.surface;

  return (
    <Animated.View layout={LinearTransition.duration(200)}>
      <Pressable
        onPress={handleSelect}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[
          styles.card,
          {
            backgroundColor: bg,
            borderColor: selected ? t.colors.accent : t.colors.border,
            borderWidth: selected ? 2 : 1,
            borderRadius: t.radius.xl,
            padding: t.spacing.lg,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Animated.View
            style={[
              iconStyle,
              styles.iconWrap,
              {
                backgroundColor: selected
                  ? t.colors.accent
                  : t.colors.surfaceSubtle,
              },
            ]}
          >
            <Ionicons
              name={
                lockType === 'KEYHOLDER'
                  ? 'shield-checkmark'
                  : selected
                    ? 'lock-closed'
                    : 'lock-open-outline'
              }
              size={18}
              color={selected ? t.colors.onAccent : t.colors.text}
            />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={[t.typography.title, { color: t.colors.text }]}>
              {title}
            </Text>
          </View>
          {mostEffective ? (
            <Badge label="Most effective" variant="success" />
          ) : null}
          {selected ? (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={t.colors.accent}
            />
          ) : null}
        </View>

        <Text style={[t.typography.body, { color: t.colors.text }]}>
          {description}
        </Text>
        <Text style={[t.typography.caption, { color: t.colors.textMuted }]}>
          {caveat}
        </Text>

        <View style={styles.accordions}>
          {accordions.map((row, i) => (
            <AccordionRow
              key={row.question}
              row={row}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? null : i)}
            />
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AccordionRow({
  row,
  open,
  onToggle,
}: {
  row: LockAccordion;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTheme();
  const rotation = useSharedValue(0);
  rotation.value = withTiming(open ? 1 : 0, { duration: 180 });
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 90}deg` }],
  }));

  return (
    <View style={[styles.accordion, { borderTopColor: t.colors.divider }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.accordionHead}
        hitSlop={6}
      >
        <Text
          style={[
            t.typography.caption,
            {
              color: t.colors.text,
              fontFamily: t.fontFamily.sansSemiBold,
              flex: 1,
            },
          ]}
        >
          {row.question}
        </Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-forward" size={14} color={t.colors.textMuted} />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}>
          <Text
            style={[
              t.typography.caption,
              { color: t.colors.textMuted, marginTop: 4 },
            ]}
          >
            {row.answer}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordions: {
    marginTop: 4,
  },
  accordion: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    marginTop: 8,
  },
  accordionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
