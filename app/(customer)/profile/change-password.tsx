import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PasswordField } from '@/components/auth';
import { profileScreenStyles } from '@/components/customer';
import { Button, Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { useToast } from '@/hooks/useToast';

export default function ChangePasswordScreen() {
  const { showError, showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError('Missing fields', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      showError('Weak password', 'New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Password mismatch', 'New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      showError('Same password', 'Choose a different password than your current one.');
      return;
    }

    setIsSaving(true);
    try {
      // Frontend-only: password change will connect to the API later.
      await new Promise((resolve) => setTimeout(resolve, 500));
      showSuccess('Password updated', 'Your password has been changed successfully.');
      router.back();
    } catch {
      showError('Update failed', 'Could not change your password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen layout="stack" scrollable backgroundColor={colors.background}>
      <View style={profileScreenStyles.formCard}>
        <Text style={profileScreenStyles.hint}>
          Choose a strong password with at least 6 characters. This screen saves locally for now
          until the backend endpoint is added.
        </Text>
        <PasswordField
          label="Current password"
          placeholder="Enter current password"
          autoComplete="password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <PasswordField
          label="New password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <PasswordField
          label="Confirm new password"
          placeholder="Re-enter new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <Button
        title="Update Password"
        onPress={handleSave}
        disabled={isSaving}
        style={profileScreenStyles.actionButton}
      />
    </Screen>
  );
}
