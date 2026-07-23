import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getCmsPageBySlug } from '@/api/cms';
import { Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useToast } from '@/hooks/useToast';
import type { CmsPage } from '@/types/cms';

export default function CmsPageScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { restaurant } = useRestaurant();
  const { showError } = useToast();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!restaurant || !slug) {
      setIsLoading(false);
      return;
    }

    getCmsPageBySlug(restaurant.id, slug, true)
      .then(setPage)
      .catch((error) => {
        showError(
          'Page unavailable',
          error instanceof Error ? error.message : 'This page could not be loaded.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [restaurant, slug, showError]);

  return (
    <Screen layout="stack" scrollable={false}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : page ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{page.title}</Text>
          <Text style={styles.body}>{page.content}</Text>
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Page not found</Text>
          <Text style={styles.emptySubtitle}>This content may have been unpublished.</Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
