import { ReactNode } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';

type AppScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: ReadonlyArray<Edge>;
  contentStyle?: StyleProp<ViewStyle>;
  gap?: number;
};

/**
 * Top-level screen wrapper. Provides safe-area padding, themed background,
 * and consistent horizontal padding + vertical rhythm for the content stack.
 *
 * Defaults to scrolling. Pass `scroll={false}` for fixed layouts.
 */
export function AppScreen({
  children,
  scroll = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
  gap,
}: AppScreenProps) {
  const t = useTheme();

  const contentContainerStyle = [
    styles.content,
    { paddingHorizontal: t.spacing.xl, paddingTop: t.spacing.lg, paddingBottom: t.spacing.huge },
    gap !== undefined ? { gap } : { gap: t.spacing.lg },
    contentStyle,
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.colors.background }]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentContainerStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
