import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { listCmsPages } from '@/api/cms';
import {
  ProfileAvatar,
  ProfileMenuItem,
  RestaurantBanner,
  ScreenIntro,
  TablePickerModal,
  ViewFloorPlanButton,
  profileScreenStyles,
} from '@/components/customer';
import { Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLogout } from '@/hooks/useLogout';
import { useToast } from '@/hooks/useToast';
import type { SelectedTable } from '@/types/table';
import type { CmsPage } from '@/types/cms';

const MENU_DIVIDER_INSET = spacing.cardInner + 40 + 14;

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const PAGE_ICONS: Record<CmsPage['page_type'], IoniconName> = {
  ABOUT: 'information-circle-outline',
  TERMS: 'document-text-outline',
  PRIVACY: 'shield-checkmark-outline',
  FAQ: 'help-circle-outline',
  CUSTOM: 'reader-outline',
};

const PAGE_LABELS: Record<CmsPage['page_type'], string> = {
  ABOUT: 'About',
  TERMS: 'Terms',
  PRIVACY: 'Privacy',
  FAQ: 'FAQ',
  CUSTOM: 'Info',
};

export default function ProfileHomeScreen() {
  const { user } = useAuth();
  const { restaurant, table, setTable } = useRestaurant();
  const handleLogout = useLogout();
  const { showSuccess } = useToast();
  const [cmsPages, setCmsPages] = useState<CmsPage[]>([]);
  const [showFloorPlan, setShowFloorPlan] = useState(false);

  const loadPages = useCallback(async () => {
    const restaurantId = restaurant?.id;
    if (restaurantId == null) {
      setCmsPages([]);
      return;
    }
    try {
      const pages = await listCmsPages(restaurantId, true);
      setCmsPages(pages);
    } catch {
      setCmsPages([]);
    }
  }, [restaurant?.id]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handleSelectTable = async (selected: SelectedTable) => {
    await setTable(selected);
    setShowFloorPlan(false);
    showSuccess('Table selected', `You're at table ${selected.number}`);
  };

  return (
    <Screen layout="tabHeaderless" scrollable backgroundColor={colors.background}>
      <ScreenIntro title="Profile" subtitle="Your account and restaurant information" icon="person-outline" />

      <View style={styles.content}>
        <View style={[profileScreenStyles.card, styles.hero]}>
          <ProfileAvatar name={user?.name} email={user?.email} size={72} />
          <Text style={styles.name}>{user?.name ?? 'Guest User'}</Text>
          <Text style={styles.email}>{user?.email ?? 'No email set'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role ?? 'CUSTOMER'}</Text>
          </View>
        </View>

        {restaurant ? (
          <View style={styles.restaurantSection}>
            <RestaurantBanner
              restaurant={restaurant}
              onChange={() => router.push('/(customer)/menu')}
            />
            <ViewFloorPlanButton onPress={() => setShowFloorPlan(true)} />
          </View>
        ) : null}

        {cmsPages.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Restaurant info</Text>
            <View style={profileScreenStyles.card}>
              {cmsPages.map((page, index) => (
                <View key={page.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/(customer)/profile/page/[slug]',
                        params: { slug: page.slug },
                      })
                    }
                    style={({ pressed }) => [styles.cmsRow, pressed && styles.cmsRowPressed]}
                  >
                    <View style={styles.cmsIconWrap}>
                      <Ionicons name={PAGE_ICONS[page.page_type]} size={18} color={colors.primaryDark} />
                    </View>
                    <View style={styles.cmsText}>
                      <Text style={styles.cmsTitle}>{page.title}</Text>
                      <Text style={styles.cmsSubtitle}>{PAGE_LABELS[page.page_type]} page</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Account</Text>
          <View style={profileScreenStyles.card}>
            <ProfileMenuItem
              icon="person-outline"
              title="View Profile"
              subtitle="See your account details"
              onPress={() => router.push('/(customer)/profile/view')}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="create-outline"
              title="Edit Profile"
              subtitle="Update your name and details"
              onPress={() => router.push('/(customer)/profile/edit')}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => router.push('/(customer)/profile/change-password')}
            />
            <View style={styles.divider} />
            <ProfileMenuItem
              icon="log-out-outline"
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              destructive
              showChevron={false}
            />
          </View>
        </View>
      </View>

      {restaurant ? (
        <TablePickerModal
          visible={showFloorPlan}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          restaurantTagline={restaurant.tagline}
          initialTable={table}
          viewOnly
          requireSelection={false}
          onClose={() => setShowFloorPlan(false)}
          onConfirm={handleSelectTable}
          confirmLabel="Select table {table}"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: spacing.cardInner,
    marginBottom: spacing.sectionGap,
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  email: {
    marginTop: 4,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  restaurantSection: {
    marginBottom: spacing.sectionGap,
  },
  section: {
    marginBottom: spacing.sectionGap,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  cmsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.cardInner,
    paddingVertical: 14,
    gap: 14,
  },
  cmsRowPressed: {
    backgroundColor: colors.background,
  },
  cmsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmsText: {
    flex: 1,
  },
  cmsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  cmsSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: MENU_DIVIDER_INSET,
  },
});
