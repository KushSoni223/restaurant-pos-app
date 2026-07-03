import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

interface ProfileAvatarProps {
  name?: string;
  email?: string;
  size?: number;
}

function getInitials(name?: string, email?: string) {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  if (email?.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }

  return 'U';
}

export function ProfileAvatar({ name, email, size = 72 }: ProfileAvatarProps) {
  const fontSize = size * 0.34;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name, email)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  initials: {
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
});
