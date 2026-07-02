import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  onPress: () => void;
}

export function AuthFooterLink({ text, linkText, onPress }: AuthFooterLinkProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text} </Text>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={styles.link}>{linkText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  text: {
    fontSize: 14,
    color: colors.textMuted,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
