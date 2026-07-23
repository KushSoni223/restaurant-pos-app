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

import { createCmsPage, deleteCmsPage, listCmsPages, updateCmsPage } from '@/api/cms';
import { listAllRestaurants } from '@/api/restaurants';
import { listTables } from '@/api/tables';
import { getTaxSettings, updateTaxSettings } from '@/api/tax';
import { RestaurantQrSection } from '@/components/admin/RestaurantQrSection';
import { Button, Input, ScreenHeader } from '@/components/common';
import { Screen } from '@/components/common/Screen';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { useLogout } from '@/hooks/useLogout';
import { useScreenLayout } from '@/hooks/useScreenLayout';
import { useToast } from '@/hooks/useToast';
import type { CmsPage, CmsPageType } from '@/types/cms';
import type { Restaurant } from '@/types/restaurant';
import type { RestaurantTable } from '@/types/table';
import type { TaxSettings } from '@/types/tax';

const PAGE_TYPES: { value: CmsPageType; label: string }[] = [
  { value: 'ABOUT', label: 'About' },
  { value: 'TERMS', label: 'Terms' },
  { value: 'PRIVACY', label: 'Privacy' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'CUSTOM', label: 'Custom' },
];

export default function AdminSettingsScreen() {
  const handleLogout = useLogout();
  const { showError, showSuccess } = useToast();
  const { layoutParts } = useScreenLayout('tab');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [cmsPages, setCmsPages] = useState<CmsPage[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTax, setIsSavingTax] = useState(false);

  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxRatePercent, setTaxRatePercent] = useState('8');
  const [taxLabel, setTaxLabel] = useState('Sales Tax');
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [serviceChargeRatePercent, setServiceChargeRatePercent] = useState('0');
  const [serviceChargeLabel, setServiceChargeLabel] = useState('Service Charge');

  const [showPageForm, setShowPageForm] = useState(false);
  const [editingPage, setEditingPage] = useState<CmsPage | null>(null);
  const [pageSlug, setPageSlug] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [pageType, setPageType] = useState<CmsPageType>('CUSTOM');
  const [pagePublished, setPagePublished] = useState(false);
  const [isSavingPage, setIsSavingPage] = useState(false);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) ?? null;

  const loadRestaurants = useCallback(async () => {
    const list = await listAllRestaurants();
    setRestaurants(list);
    setSelectedRestaurantId((current) => current ?? list[0]?.id ?? null);
  }, []);

  const loadRestaurantSettings = useCallback(async () => {
    if (!selectedRestaurantId) {
      return;
    }
    const [tax, pages, tableList] = await Promise.all([
      getTaxSettings(selectedRestaurantId, { refresh: true, allowFallback: false }),
      listCmsPages(selectedRestaurantId),
      listTables(selectedRestaurantId),
    ]);
    setTaxSettings(tax);
    setTaxEnabled(tax.tax_enabled);
    setTaxRatePercent(String(Number((tax.tax_rate * 100).toFixed(2))));
    setTaxLabel(tax.tax_label);
    setServiceChargeEnabled(tax.service_charge_enabled);
    setServiceChargeRatePercent(String(Number((tax.service_charge_rate * 100).toFixed(2))));
    setServiceChargeLabel(tax.service_charge_label);
    setCmsPages(pages);
    setTables(tableList);
  }, [selectedRestaurantId]);

  useEffect(() => {
    loadRestaurants()
      .catch((error) => {
        showError(
          'Could not load restaurants',
          error instanceof Error ? error.message : 'Check admin login and backend.',
        );
      })
      .finally(() => setIsLoading(false));
  }, [loadRestaurants, showError]);

  useEffect(() => {
    if (!selectedRestaurantId) {
      return;
    }
    loadRestaurantSettings().catch((error) => {
      showError(
        'Could not load settings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    });
  }, [loadRestaurantSettings, selectedRestaurantId, showError]);

  const handleSaveTax = async () => {
    if (!selectedRestaurantId) {
      return;
    }
    const taxRate = Number(taxRatePercent) / 100;
    const serviceRate = Number(serviceChargeRatePercent) / 100;
    if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      showError('Invalid tax rate', 'Enter a percentage between 0 and 100.');
      return;
    }
    if (Number.isNaN(serviceRate) || serviceRate < 0 || serviceRate > 100) {
      showError('Invalid service charge', 'Enter a percentage between 0 and 100.');
      return;
    }

    setIsSavingTax(true);
    try {
      const updated = await updateTaxSettings(selectedRestaurantId, {
        tax_enabled: taxEnabled,
        tax_rate: taxRate,
        tax_label: taxLabel.trim() || 'Sales Tax',
        service_charge_enabled: serviceChargeEnabled,
        service_charge_rate: serviceRate,
        service_charge_label: serviceChargeLabel.trim() || 'Service Charge',
      });
      setTaxSettings(updated);
      showSuccess('Tax settings saved', 'Cart totals will use these values.');
    } catch (error) {
      showError(
        'Could not save tax settings',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingTax(false);
    }
  };

  const openCreatePage = () => {
    setEditingPage(null);
    setPageSlug('');
    setPageTitle('');
    setPageContent('');
    setPageType('CUSTOM');
    setPagePublished(false);
    setShowPageForm(true);
  };

  const openEditPage = (page: CmsPage) => {
    setEditingPage(page);
    setPageSlug(page.slug);
    setPageTitle(page.title);
    setPageContent(page.content);
    setPageType(page.page_type);
    setPagePublished(page.is_published);
    setShowPageForm(true);
  };

  const closePageForm = () => {
    setShowPageForm(false);
    setEditingPage(null);
  };

  const handleSavePage = async () => {
    if (!selectedRestaurantId) {
      return;
    }
    if (!pageSlug.trim() || !pageTitle.trim()) {
      showError('Missing fields', 'Slug and title are required.');
      return;
    }

    setIsSavingPage(true);
    try {
      if (editingPage) {
        const updated = await updateCmsPage(editingPage.id, {
          slug: pageSlug.trim().toLowerCase(),
          title: pageTitle.trim(),
          content: pageContent,
          page_type: pageType,
          is_published: pagePublished,
        });
        setCmsPages((current) => current.map((page) => (page.id === updated.id ? updated : page)));
        showSuccess('Page updated', updated.title);
      } else {
        const created = await createCmsPage(selectedRestaurantId, {
          slug: pageSlug.trim().toLowerCase(),
          title: pageTitle.trim(),
          content: pageContent,
          page_type: pageType,
          is_published: pagePublished,
          sort_order: cmsPages.length,
        });
        setCmsPages((current) => [...current, created]);
        showSuccess('Page created', created.title);
      }
      closePageForm();
    } catch (error) {
      showError(
        'Could not save page',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleDeletePage = async (page: CmsPage) => {
    try {
      await deleteCmsPage(page.id);
      setCmsPages((current) => current.filter((item) => item.id !== page.id));
      showSuccess('Page deleted', page.title);
    } catch (error) {
      showError(
        'Could not delete page',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  if (isLoading) {
    return (
      <Screen layout="tab" scrollable={false}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen layout="tab" scrollable={false} keyboardAware={false}>
      <ScreenHeader title="Settings" subtitle="Tax, charges, and content pages" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={layoutParts.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Restaurant</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.restaurantRow}>
          {restaurants.map((restaurant) => {
            const selected = restaurant.id === selectedRestaurantId;
            return (
              <Pressable
                key={restaurant.id}
                onPress={() => setSelectedRestaurantId(restaurant.id)}
                style={[styles.restaurantChip, selected && styles.restaurantChipSelected]}
              >
                <Text style={[styles.restaurantChipText, selected && styles.restaurantChipTextSelected]}>
                  {restaurant.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedRestaurant ? (
          <>
            <Text style={styles.restaurantMeta}>
              Scan code: {selectedRestaurant.scan_code}
              {selectedRestaurant.tagline ? ` · ${selectedRestaurant.tagline}` : ''}
            </Text>
            <RestaurantQrSection restaurant={selectedRestaurant} tables={tables} />
          </>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tax & charges</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable tax</Text>
            <Switch value={taxEnabled} onValueChange={setTaxEnabled} />
          </View>
          <Text style={styles.fieldLabel}>Tax rate (%)</Text>
          <Input
            value={taxRatePercent}
            onChangeText={setTaxRatePercent}
            keyboardType="decimal-pad"
            editable={taxEnabled}
          />
          <Text style={styles.fieldLabel}>Tax label</Text>
          <Input
            value={taxLabel}
            onChangeText={setTaxLabel}
            placeholder="Sales Tax"
            editable={taxEnabled}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Enable service charge</Text>
            <Switch value={serviceChargeEnabled} onValueChange={setServiceChargeEnabled} />
          </View>
          <Text style={styles.fieldLabel}>Service charge (%)</Text>
          <Input
            value={serviceChargeRatePercent}
            onChangeText={setServiceChargeRatePercent}
            keyboardType="decimal-pad"
            editable={serviceChargeEnabled}
          />
          <Text style={styles.fieldLabel}>Service charge label</Text>
          <Input
            onChangeText={setServiceChargeLabel}
            placeholder="Service Charge"
            editable={serviceChargeEnabled}
          />

          <Button
            title={isSavingTax ? 'Saving…' : 'Save tax settings'}
            onPress={handleSaveTax}
            disabled={!selectedRestaurantId || isSavingTax}
            style={styles.saveButton}
          />
          {taxSettings ? (
            <Text style={styles.hint}>
              Cart preview uses {taxSettings.tax_enabled ? `${Number((taxSettings.tax_rate * 100).toFixed(2))}% ${taxSettings.tax_label}` : 'no tax'}.
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Content pages</Text>
            <Button title="Add page" onPress={openCreatePage} style={styles.addPageButton} />
          </View>
          <Text style={styles.hint}>
            Published pages appear in the customer profile for this restaurant.
          </Text>

          {cmsPages.length === 0 ? (
            <Text style={styles.emptyText}>No pages yet. Add About, Terms, Privacy, or FAQ.</Text>
          ) : (
            cmsPages.map((page) => (
              <View key={page.id} style={styles.pageRow}>
                <Pressable style={styles.pageInfo} onPress={() => openEditPage(page)}>
                  <Text style={styles.pageTitle}>{page.title}</Text>
                  <Text style={styles.pageMeta}>
                    /{page.slug} · {page.page_type}
                    {page.is_published ? ' · Published' : ' · Draft'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => handleDeletePage(page)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Button title="Logout" onPress={handleLogout} variant="secondary" style={styles.logout} />
      </ScrollView>

      <Modal visible={showPageForm} animationType="slide" transparent onRequestClose={closePageForm}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingPage ? 'Edit page' : 'New page'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Title</Text>
              <Input value={pageTitle} onChangeText={setPageTitle} placeholder="About us" />
              <Text style={styles.fieldLabel}>Slug</Text>
              <Input
                onChangeText={setPageSlug}
                placeholder="about-us"
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>Page type</Text>
              <View style={styles.typeRow}>
                {PAGE_TYPES.map((type) => (
                  <Pressable
                    key={type.value}
                    onPress={() => setPageType(type.value)}
                    style={[styles.typeChip, pageType === type.value && styles.typeChipSelected]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        pageType === type.value && styles.typeChipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Content</Text>
              <Input
                value={pageContent}
                onChangeText={setPageContent}
                placeholder="Write your page content here…"
                multiline
                style={styles.contentInput}
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Published</Text>
                <Switch value={pagePublished} onValueChange={setPagePublished} />
              </View>
              <Button
                title={isSavingPage ? 'Saving…' : editingPage ? 'Update page' : 'Create page'}
                onPress={handleSavePage}
                disabled={isSavingPage}
                style={styles.saveButton}
              />
              <Button title="Cancel" onPress={closePageForm} variant="secondary" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 40,
  },
  scroll: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  restaurantRow: {
    marginBottom: spacing.sm,
  },
  restaurantChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  restaurantChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  restaurantChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  restaurantChipTextSelected: {
    color: colors.primaryDark,
  },
  restaurantMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sectionGap,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardInner,
    marginBottom: spacing.sectionGap,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  addPageButton: {
    paddingHorizontal: 12,
    minHeight: 36,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  pageInfo: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pageMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeChipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  typeChipTextSelected: {
    color: colors.primaryDark,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  logout: {
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
});
