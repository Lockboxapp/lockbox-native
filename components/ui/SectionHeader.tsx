import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  size?: 'page' | 'section';
};

/**
 * Consistent section heading: optional uppercase eyebrow, title, optional
 * subtitle line, optional trailing element (e.g., an action link).
 *
 * `size="page"` for the top-of-screen hero heading, `size="section"` (default)
 * for sub-section headings within a screen.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  size = 'section',
}: SectionHeaderProps) {
  const t = useTheme();
  const titleStyle = size === 'page' ? t.typography.display : t.typography.h2;

  return (
    <View style={styles.wrap}>
      <View style={styles.text}>
        {eyebrow ? (
          <Text style={[t.typography.eyebrow, { color: t.colors.accent, marginBottom: t.spacing.xs }]}>
            {eyebrow}
          </Text>
        ) : null}
        <View style={styles.row}>
          <Text style={[titleStyle, { color: t.colors.text, flex: 1 }]}>{title}</Text>
          {trailing ? <View style={{ marginLeft: t.spacing.md }}>{trailing}</View> : null}
        </View>
        {subtitle ? (
          <Text
            style={[
              t.typography.body,
              { color: t.colors.textMuted, marginTop: t.spacing.sm },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  text: {
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
