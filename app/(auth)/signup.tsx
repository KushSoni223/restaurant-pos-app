import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthScreen,
  PasswordField,
} from '@/components/auth';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { getHomeRouteForRole } from '@/navigation/roleNavigation';

export default function SignupScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace(getHomeRouteForRole(user.role));
    } catch {
      Alert.alert('Sign up failed', 'Could not create account. Email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Create account"
      subtitle="Join as a customer to browse menus and place orders."
      footer={
        <AuthFooterLink
          text="Already have an account?"
          linkText="Sign in"
          onPress={() => router.back()}
        />
      }
    >
      <AuthField
        label="Full name"
        placeholder="Jane Doe"
        autoCapitalize="words"
        autoComplete="name"
        value={name}
        onChangeText={setName}
      />
      <AuthField
        label="Email"
        placeholder="you@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <PasswordField
        label="Password"
        placeholder="At least 6 characters"
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
      />
      <PasswordField
        label="Confirm password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={styles.note}>
        <Text style={styles.noteIcon}>ℹ️</Text>
        <Text style={styles.noteText}>
          Staff accounts (waiter, chef, admin) are created by your restaurant manager.
        </Text>
      </View>

      <AuthButton
        title="Create Account"
        onPress={handleSignup}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  noteIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 19,
  },
});
