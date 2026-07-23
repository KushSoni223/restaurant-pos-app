import { StyleSheet, View } from 'react-native';

import { ProfileAvatar, ProfileInfoRow, profileScreenStyles } from '@/components/customer';
import { Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';

export default function ViewProfileScreen() {
  const { user } = useAuth();

  return (
    <Screen layout="stack" scrollable backgroundColor={colors.background}>
      <View style={styles.avatarSection}>
        <ProfileAvatar name={user?.name} email={user?.email} size={88} />
      </View>

      <View style={profileScreenStyles.card}>
        <ProfileInfoRow label="Full name" value={user?.name ?? 'Not set'} />
        <ProfileInfoRow label="Email" value={user?.email ?? 'Not set'} />
        <ProfileInfoRow label="Role" value={user?.role ?? 'CUSTOMER'} />
        <ProfileInfoRow label="User ID" value={String(user?.id ?? '—')} isLast />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
});
