// ============================================================
// components/onboarding/BoxNamePill.tsx
//
// The box-name pill shown at the top of Screen 4. Displays
// "[emoji] [Box name]" with a pencil affordance; tapping it
// swaps to an inline rename input that auto-saves on blur.
// ============================================================

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type BoxNamePillProps = {
  emoji: string;
  name: string;
  onRename: (next: string) => void;
};

export function BoxNamePill({ emoji, name, onRename }: BoxNamePillProps) {
  const t = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  function commit() {
    const trimmed = draft.trim();
    onRename(trimmed.length > 0 ? trimmed.slice(0, 40) : name);
    setEditing(false);
  }

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: t.colors.surfaceAccent,
          borderColor: t.colors.accentSoft,
        },
      ]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          onSubmitEditing={commit}
          autoFocus
          maxLength={40}
          returnKeyType="done"
          style={[
            t.typography.bodyStrong,
            styles.input,
            { color: t.colors.text },
          ]}
        />
      ) : (
        <Text style={[t.typography.bodyStrong, styles.name, { color: t.colors.text }]}>
          {name}
        </Text>
      )}
      <Pressable
        onPress={() => {
          if (editing) {
            commit();
          } else {
            setDraft(name);
            setEditing(true);
          }
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={editing ? 'Save box name' : 'Rename box'}
      >
        <Ionicons
          name={editing ? 'checkmark' : 'pencil'}
          size={16}
          color={t.colors.accent}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    maxWidth: 220,
  },
  input: {
    minWidth: 120,
    maxWidth: 220,
    padding: 0,
  },
});
