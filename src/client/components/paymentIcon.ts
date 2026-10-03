import {SpendableResource} from '@/common/inputs/Spendable';

// Resource icon class per spendable unit, where it differs from the unit name.
// Shared by the input field (PaymentUnit.vue) and the remainder column (PaymentForm.vue).
const ICON_NAMES: Partial<Record<SpendableResource, string>> = {
  kuiperAsteroids: 'asteroid',
  lunaArchivesScience: 'science',
  spireScience: 'science',
  auroraiData: 'auroraidata',
  seeds: 'seed',
};

export function paymentIconClass(unit: SpendableResource): string {
  return 'resource_icon--' + (ICON_NAMES[unit] ?? unit);
}
