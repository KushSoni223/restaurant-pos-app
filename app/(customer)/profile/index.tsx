import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ProfileAvatar, ProfileMenuItem, profileScreenStyles } from '@/components/customer';
import { SAFE_AREA_TAB, Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/hooks/useLogout';

const MENU_DIVIDER_INSET = spacing.cardInner + 40 + 14;

export default function ProfileHomeScreen() {
  const { user } = useAuth();
  const handleLogout = useLogout();

  return (
    <Screen
      edges={SAFE_AREA_TAB}
      scrollable
      backgroundColor={colors.background}
      contentStyle={profileScreenStyles.content}
    >
      <View style={[profileScreenStyles.card, styles.hero]}>
        <ProfileAvatar name={user?.name} email={user?.email} size={80} />
        <Text style={styles.name}>{user?.name ?? 'Guest User'}</Text>
        <Text style={styles.email}>{user?.email ?? 'No email set'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ?? 'CUSTOMER'}</Text>
        </View>
      </View>

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: spacing.cardInner,
    marginBottom: 20,
  },
  name: {
    marginTop: 16,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: MENU_DIVIDER_INSET,
  },
});
