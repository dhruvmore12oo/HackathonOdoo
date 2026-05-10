export const EXPENSE_CATEGORIES = [
  'transport', 'food', 'hotel', 'lodging', 'flights',
  'activities', 'shopping', 'emergency', 'misc', 'other',
] as const;
export type ExpenseCategoryType = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_STATUSES = ['planned', 'pending', 'paid', 'refunded', 'cancelled'] as const;
export type ExpenseStatusType = (typeof EXPENSE_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card', 'upi', 'wallet', 'bank_transfer', 'other'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  transport: '🚕 Transport',
  food: '🍽️ Food',
  hotel: '🏨 Hotel',
  lodging: '🏠 Lodging',
  flights: '✈️ Flights',
  activities: '🎯 Activities',
  shopping: '🛍️ Shopping',
  emergency: '🚨 Emergency',
  misc: '📦 Misc',
  other: '📋 Other',
};

export const CATEGORY_COLORS: Record<string, string> = {
  transport: '#f59e0b',
  food: '#ef4444',
  hotel: '#8b5cf6',
  lodging: '#8b5cf6',
  flights: '#3b82f6',
  activities: '#10b981',
  shopping: '#f97316',
  emergency: '#dc2626',
  misc: '#6b7280',
  other: '#6b7280',
};

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_WARNING_THRESHOLD = 80;
