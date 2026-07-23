import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { listAllCategories } from '@/api/menu';
import { createStaff, listStaff, updateStaffAvailability } from '@/api/staff';
import { Button, Input, ScreenHeader } from '@/components/common';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { MenuCategory } from '@/types/menu';
import type { StaffMember } from '@/types/staff';
import type { UserRole } from '@/types/user';

const STAFF_ROLES: { role: UserRole; label: string }[] = [
  { role: 'CHEF', label: 'Chef' },
  { role: 'WAITER', label: 'Waiter' },
];

export default function AdminStaffScreen() {
  const { showError, showSuccess } = useToast();
  const { layoutParts } = useScreenLayout('tab');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CHEF');
  const [selectedAreas, setSelectedAreas] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [staffList, categoryList] = await Promise.all([listStaff(), listAllCategories()]);
      setStaff(staffList);
      setCategories(categoryList);
    } catch (error) {
      showError(
        'Could not load staff',
        error instanceof Error ? error.message : 'Check the backend connection.',
      );
    }
  }, [showError]);

  useEffect(() => {
    loadData().finally(() => setIsLoading(false));
  }, [loadData]);

  const toggleArea = (categoryId: number) => {
    setSelectedAreas((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId],
    );
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('CHEF');
    setSelectedAreas([]);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showError('Missing fields', 'Name, email, and password are required.');
      return;
    }
    if (password.length < 6) {
      showError('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (role === 'CHEF' && selectedAreas.length === 0) {
      showError('No areas selected', 'Pick at least one area the chef is great at.');
      return;
    }

    setIsSaving(true);
    try {
      const member = await createStaff({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        specialty_category_ids: role === 'CHEF' ? selectedAreas : [],
      });
      setStaff((current) => [...current, member]);
      closeForm();
      showSuccess('Staff member added', `${member.name} can now sign in.`);
    } catch (error) {
      showError(
        'Could not add staff',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (member: StaffMember, isAvailable: boolean) => {
    setStaff((current) =>
      current.map((m) => (m.id === member.id ? { ...m, is_available: isAvailable } : m)),
    );
    try {
      await updateStaffAvailability(member.id, isAvailable);
    } catch (error) {
      setStaff((current) =>
        current.map((m) => (m.id === member.id ? { ...m, is_available: !isAvailable } : m)),
      );
      showError(
        'Update failed',
        error instanceof Error ? error.message : 'Could not change availability.',
      );
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[layoutParts.scrollContent, styles.listContent]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title="Staff"
          subtitle="Add chefs with their specialty areas — orders route to them automatically"
        />

        <Button
          title="Add staff member"
          onPress={() => setShowForm(true)}
          style={styles.addButton}
        />

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Team</Text>
          <Text style={styles.sectionCount}>{staff.length}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : staff.length === 0 ? (
          <Text style={styles.hint}>No staff yet. Tap the button above to add your first chef.</Text>
        ) : (
          staff.map((member) => (
            <View key={member.id} style={styles.card}>
              <View style={styles.memberHeader}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name ?? member.email}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{member.role}</Text>
                </View>
              </View>

              {member.specialties.length > 0 ? (
                <View style={styles.specialtyRow}>
                  {member.specialties.map((area) => (
                    <View key={area.id} style={styles.specialtyBadge}>
                      <Ionicons name="restaurant-outline" size={12} color={colors.primaryDark} />
                      <Text style={styles.specialtyText}>{area.name}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.availabilityRow}>
                <Text
                  style={[
                    styles.availabilityLabel,
                    { color: member.is_available ? colors.success : colors.textMuted },
                  ]}
                >
                  {member.is_available ? 'Available for orders' : 'Off shift'}
                </Text>
                <Switch
                  value={member.is_available}
                  onValueChange={(value) => handleToggleAvailability(member, value)}
                  trackColor={{ true: colors.primary, false: colors.border }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForm}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New staff member</Text>
            <Pressable onPress={closeForm} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.roleRow}>
              {STAFF_ROLES.map(({ role: r, label }) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={[styles.roleChip, role === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, role === r && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Full name</Text>
            <Input
              placeholder="Jane Doe"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <Input
              placeholder="chef@restaurant.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.fieldLabel}>Temporary password</Text>
            <Input
              placeholder="Min. 6 characters"
              autoCapitalize="none"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {role === 'CHEF' ? (
              <>
                <Text style={styles.fieldLabel}>Great at (areas)</Text>
                {categories.length === 0 ? (
                  <Text style={styles.hint}>
                    No menu categories found — run `python scripts/seed_menu.py` in the backend.
                  </Text>
                ) : (
                  <View style={styles.areaRow}>
                    {categories.map((category) => {
                      const active = selectedAreas.includes(category.id);
                      return (
                        <Pressable
                          key={category.id}
                          onPress={() => toggleArea(category.id)}
                          style={[styles.areaChip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            ) : null}

            <Button
              title={isSaving ? 'Adding…' : 'Add member'}
              onPress={handleCreate}
              disabled={isSaving}
              style={styles.submitButton}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: spacing.screenTop,
  },
  addButton: {
    marginBottom: spacing.sectionGap,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardInner,
    marginBottom: spacing.lg,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  memberEmail: {
    marginTop: 2,
    fontSize: 13,
    color: colors.textMuted,
  },
  roleBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  specialtyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  specialtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  availabilityLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: spacing.screenHorizontal,
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs + 2,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  areaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  areaChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
