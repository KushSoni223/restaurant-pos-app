import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AuthField } from '@/components/auth';
import { profileScreenStyles } from '@/components/customer';
import { Button, SAFE_AREA_TAB, Screen } from '@/components/common';
import { colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Missing name', 'Please enter your full name.');
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({ name: name.trim() });
      showSuccess('Profile updated', 'Your changes have been saved.');
      router.back();
    } catch {
      showError('Update failed', 'Could not save your profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen
      edges={SAFE_AREA_TAB}
      scrollable
      backgroundColor={colors.background}
      contentStyle={profileScreenStyles.content}
    >
      <View style={profileScreenStyles.formCard}>
        <Text style={profileScreenStyles.hint}>
          Update your display name. Email changes require admin support.
        </Text>
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
          value={user?.email ?? ''}
          editable={false}
          selectTextOnFocus={false}
          style={profileScreenStyles.readOnlyInput}
        />
        <Text style={profileScreenStyles.readOnlyNote}>Email cannot be changed from the app yet.</Text>
      </View>

      <Button
        title="Save Changes"
        onPress={handleSave}
        disabled={isSaving}
        style={profileScreenStyles.actionButton}
      />
    </Screen>
  );
}
