import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import {
  ActionButton,
  AppCard,
  AppScreen,
  Badge,
  ErrorState,
  LoadingState,
  SectionHeader,
} from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/services/api';
import type { BankerInsight, BankerNudge } from '@/services/types';
import { formatCents } from '@/utils/format';

type BankerData = {
  nudge: BankerNudge;
  insights: BankerInsight[];
};

export default function BankerScreen() {
  const t = useTheme();
  const [data, setData] = useState<BankerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [nudgeRes, insightsRes] = await Promise.all([
        api.banker.nudge(),
        api.banker.insights(),
      ]);
      setData({ nudge: nudgeRes.nudge, insights: insightsRes.insights });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load Banker data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load('initial');
  }, [load]);

  return (
    <AppScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load('refresh')}
          tintColor={t.colors.accent}
        />
      }
    >
      <SectionHeader
        eyebrow="Your sidekick"
        title="The Banker"
        subtitle="Talk through decisions or review your financial signals."
        size="page"
      />

      {loading ? (
        <LoadingState caption="Loading insights…" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => load('initial')} />
      ) : data ? (
        <>
          <View style={styles.section}>
            <SectionHeader
              title="Chat"
              trailing={<Badge label="Beta" variant="flexible" />}
            />
            <AppCard gap={t.spacing.sm}>
              <BankerBubble
                role="banker"
                text={
                  data.nudge?.headline
                    ? `${data.nudge.headline}. ${data.nudge.body}`
                    : 'You are on track. Stay consistent.'
                }
              />
              <BankerBubble
                role="user"
                text="What should I fund first?"
              />
              <BankerBubble
                role="banker"
                text={
                  data.nudge && data.nudge.ctaAction === 'transfer'
                    ? `Start with ${data.nudge.ctaLabel.toLowerCase()} from your Wallet — it's the fastest way to catch up.`
                    : 'Open chat to talk it through with me.'
                }
              />
              <View style={{ marginTop: t.spacing.sm }}>
                <ActionButton
                  title="Open chat"
                  fullWidth
                  onPress={() => router.push('/banker-chat')}
                  leading={
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={16}
                      color={t.colors.onAccent}
                    />
                  }
                />
              </View>
            </AppCard>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Insights"
              subtitle="A read on your money this month."
            />
            <AppCard gap={0} padding={0}>
              {data.insights.map((item, idx) => (
                <View
                  key={item.key}
                  style={[
                    styles.insightRow,
                    {
                      paddingHorizontal: t.spacing.lg,
                      paddingVertical: t.spacing.md + 2,
                      borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: t.colors.divider,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[t.typography.label, { color: t.colors.textMuted }]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        t.typography.stat,
                        { color: t.colors.text, marginTop: 2 },
                      ]}
                    >
                      {formatCents(item.valueCents)}
                    </Text>
                    <Text
                      style={[
                        t.typography.caption,
                        { color: t.colors.textMuted, marginTop: 4 },
                      ]}
                    >
                      {item.caption}
                    </Text>
                  </View>
                  <Badge label={item.badge} variant={item.tone} />
                </View>
              ))}
            </AppCard>
          </View>
        </>
      ) : null}
    </AppScreen>
  );
}

function BankerBubble({ role, text }: { role: 'banker' | 'user'; text: string }) {
  const t = useTheme();
  const isBanker = role === 'banker';
  return (
    <View
      style={[
        styles.bubble,
        {
          alignSelf: isBanker ? 'flex-start' : 'flex-end',
          backgroundColor: isBanker ? t.colors.surfaceAccent : t.colors.accent,
          borderColor: isBanker ? t.colors.accentSoft : t.colors.accent,
          borderTopLeftRadius: isBanker ? 4 : t.radius.lg,
          borderTopRightRadius: isBanker ? t.radius.lg : 4,
          borderBottomLeftRadius: t.radius.lg,
          borderBottomRightRadius: t.radius.lg,
        },
      ]}
    >
      <Text
        style={[
          t.typography.body,
          { color: isBanker ? t.colors.text : t.colors.onAccent },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
