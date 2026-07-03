import { useState } from 'react';
import { router } from 'expo-router';

import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthScreen,
  PasswordField,
} from '@/components/auth';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { getHomeRouteForRole } from '@/navigation/roleNavigation';

export default function LoginScreen() {
  const { login } = useAuth();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showError('Missing fields', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      showSuccess(
        'Welcome back!',
        user.name ? `Signed in as ${user.name}` : 'You have signed in successfully.',
      );
      router.replace(getHomeRouteForRole(user.role));
    } catch {
      showError('Login failed', 'Invalid credentials or server unavailable.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to manage orders, tables, and your kitchen."
      footer={
        <AuthFooterLink
          text="Don't have an account?"
          linkText="Sign up"
          onPress={() => router.push('/(auth)/signup')}
        />
      }
    >
      <AuthField
        label="Email"
        placeholder="you@restaurant.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <PasswordField
        label="Password"
        placeholder="Enter your password"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
      />
      <AuthButton
        title="Sign In"
        onPress={handleLogin}
        loading={isSubmitting}
        disabled={isSubmitting}
      />
    </AuthScreen>
  );
}
