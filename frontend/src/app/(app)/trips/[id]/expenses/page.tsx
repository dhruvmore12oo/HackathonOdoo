'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, IndianRupee, TrendingUp, TrendingDown, Wallet, PieChart,
  Trash2, Edit3, Receipt, ShoppingBag, Utensils, Hotel, Plane, Car,
  Activity, AlertTriangle, Package, X,
} from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner, Badge, Input, Modal } from '@/components/ui';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useBudgetSummary } from '@/hooks/useExpenses';
import { useTrip } from '@/hooks/useTrips';
import { ROUTES } from '@/lib/constants';
import { canEditTrip, getTripRole } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils';
import type { Expense, ExpenseCategory, ExpenseStatus, BudgetSummary } from '@/types';

// ── Config ──
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  transport: { icon: Car, label: 'Transport', color: 'text-amber-600', bg: 'bg-amber-50' },
  food: { icon: Utensils, label: 'Food', color: 'text-red-500', bg: 'bg-red-50' },
  hotel: { icon: Hotel, label: 'Hotel', color: 'text-purple-500', bg: 'bg-purple-50' },
  lodging: { icon: Hotel, label: 'Lodging', color: 'text-purple-500', bg: 'bg-purple-50' },
  flights: { icon: Plane, label: 'Flights', color: 'text-blue-500', bg: 'bg-blue-50' },
  activities: { icon: Activity, label: 'Activities', color: 'text-green-500', bg: 'bg-green-50' },
  shopping: { icon: ShoppingBag, label: 'Shopping', color: 'text-orange-500', bg: 'bg-orange-50' },
  emergency: { icon: AlertTriangle, label: 'Emergency', color: 'text-red-600', bg: 'bg-red-50' },
  misc: { icon: Package, label: 'Misc', color: 'text-gray-500', bg: 'bg-gray-50' },
  other: { icon: Package, label: 'Other', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const STATUS_BADGES: Record<ExpenseStatus, string> = {
  planned: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-600',
};

// ══════════════════════════════════════
// BUDGET OVERVIEW CARDS
// ══════════════════════════════════════
function BudgetOverview({ summary }: { summary: BudgetSummary }) {
  const healthColors = { healthy: 'text-green-500', warning: 'text-amber-500', danger: 'text-red-500' };
  const healthBg = { healthy: 'bg-green-500', warning: 'bg-amber-500', danger: 'bg-red-500' };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="py-4 text-center">
          <Wallet className="h-5 w-5 text-brand-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Total Budget</p>
          <p className="font-bold text-gray-900">{formatCurrency(summary.total_budget)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 text-center">
          <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Spent</p>
          <p className="font-bold text-gray-900">{formatCurrency(summary.total_spent)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 text-center">
          <TrendingUp className={`h-5 w-5 mx-auto mb-1 ${healthColors[summary.budget_health]}`} />
          <p className="text-xs text-gray-400">Remaining</p>
          <p className={`font-bold ${healthColors[summary.budget_health]}`}>{formatCurrency(summary.remaining)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 text-center">
          <PieChart className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Used</p>
          <p className="font-bold text-gray-900">{summary.spent_percentage}%</p>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${healthBg[summary.budget_health]}`}
              style={{ width: `${Math.min(summary.spent_percentage, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ══════════════════════════════════════
// CATEGORY BREAKDOWN
// ══════════════════════════════════════
function CategoryBreakdownCard({ summary }: { summary: BudgetSummary }) {
  if (summary.category_breakdown.length === 0) return null;

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Spending by Category</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {summary.category_breakdown.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat.category] || CATEGORY_CONFIG.other;
          const Icon = cfg.icon;
          return (
            <div key={cat.category} className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${cfg.bg}`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{cfg.label}</span>
                  <span className="text-gray-900 font-semibold">{formatCurrency(cat.total)}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-brand-400 rounded-full" style={{ width: `${cat.percentage}%` }} />
                </div>
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{cat.percentage}%</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════
// EXPENSE ROW
// ══════════════════════════════════════
function ExpenseCard({ expense, canEdit, onEdit, onDelete }: {
  expense: Expense; canEdit: boolean; onEdit: (e: Expense) => void; onDelete: (id: string) => void;
}) {
  const cfg = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.other;
  const Icon = cfg.icon;

  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
      <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 text-sm truncate">{expense.title || expense.description}</h4>
          <Badge className={`text-[10px] ${STATUS_BADGES[expense.status]}`}>{expense.status}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
          {expense.vendor && <span>{expense.vendor}</span>}
          {expense.expense_date && <span>• {expense.expense_date}</span>}
          {expense.is_estimated && <span className="text-amber-500">• Estimated</span>}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-bold text-gray-900 text-sm">
          {formatCurrency(expense.amount * expense.quantity)}
        </p>
        {expense.quantity > 1 && (
          <p className="text-[10px] text-gray-400">{expense.quantity} × {formatCurrency(expense.amount)}</p>
        )}
      </div>

      {canEdit && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => onEdit(expense)} className="p-1 rounded hover:bg-gray-100">
            <Edit3 className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button onClick={() => onDelete(expense.id)} className="p-1 rounded hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ADD / EDIT EXPENSE MODAL
// ══════════════════════════════════════
function ExpenseModal({ expense, tripId, onClose }: {
  expense?: Expense | null; tripId: string; onClose: () => void;
}) {
  const { mutate: createExpense, isPending: creating } = useCreateExpense(tripId);
  const { mutate: updateExpense, isPending: updating } = useUpdateExpense(tripId);
  const isEdit = !!expense;

  const [form, setForm] = useState({
    description: expense?.description || '',
    title: expense?.title || '',
    category: expense?.category || 'misc' as ExpenseCategory,
    amount: expense?.amount || 0,
    quantity: expense?.quantity || 1,
    status: expense?.status || 'planned' as ExpenseStatus,
    vendor: expense?.vendor || '',
    payment_method: expense?.payment_method || '',
    expense_date: expense?.expense_date?.split('T')[0] || '',
    is_estimated: expense?.is_estimated || false,
    notes: expense?.notes || '',
  });

  const handleSave = () => {
    const payload = {
      ...form,
      amount: Number(form.amount),
      quantity: Number(form.quantity),
      expense_date: form.expense_date || null,
      vendor: form.vendor || null,
      payment_method: form.payment_method || null,
      notes: form.notes || null,
      title: form.title || null,
    };

    if (isEdit) {
      updateExpense({ id: expense!.id, ...payload }, { onSuccess: onClose });
    } else {
      createExpense(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Expense' : 'Add Expense'} size="lg">
      <div className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short title (optional)" />
        <Input label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (₹) *" type="number" value={String(form.amount)} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <Input label="Quantity" type="number" value={String(form.quantity)} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-base">Category</label>
            <select className="input-base" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-base">Status</label>
            <select className="input-base" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExpenseStatus })}>
              <option value="planned">📋 Planned</option>
              <option value="pending">⏳ Pending</option>
              <option value="paid">✅ Paid</option>
              <option value="refunded">↩️ Refunded</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Uber, Airbnb..." />
          <Input label="Date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
        </div>

        <div>
          <label className="label-base">Payment Method</label>
          <select className="input-base" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option value="">Select...</option>
            <option value="cash">💵 Cash</option>
            <option value="credit_card">💳 Credit Card</option>
            <option value="debit_card">💳 Debit Card</option>
            <option value="upi">📱 UPI</option>
            <option value="wallet">👛 Wallet</option>
            <option value="bank_transfer">🏦 Bank Transfer</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_estimated} onChange={(e) => setForm({ ...form, is_estimated: e.target.checked })} className="rounded" />
          This is an estimated expense
        </label>

        <div>
          <label className="label-base">Notes</label>
          <textarea className="input-base min-h-[60px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} isLoading={creating || updating} disabled={!form.description.trim()}>
            {isEdit ? 'Save Changes' : 'Add Expense'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════
// MAIN EXPENSES PAGE
// ══════════════════════════════════════
export default function ExpensesPage() {
  const params = useParams();
  const tripId = params.id as string;
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { data: expensesData, isLoading } = useExpenses(tripId, categoryFilter ? { category: categoryFilter } : undefined);
  const { data: summary, isLoading: summaryLoading } = useBudgetSummary(tripId);
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { mutate: deleteExpense } = useDeleteExpense(tripId);

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  if (isLoading || summaryLoading || tripLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  const canEdit = canEditTrip(getTripRole(trip));
  const expenses = expensesData?.data || [];

  return (
    <div className="animate-in space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={ROUTES.TRIP(tripId)} className="text-sm text-link inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to trip
          </Link>
          <h1 className="section-heading flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-500" />
            Budget & Expenses
          </h1>
        </div>
        {canEdit && (
          <Button onClick={() => { setEditingExpense(null); setShowModal(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            Add Expense
          </Button>
        )}
      </div>

      {/* Budget Overview */}
      {summary && <BudgetOverview summary={summary} />}

      {/* Warning Banner */}
      {summary && summary.budget_health === 'danger' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">Budget Exceeded!</p>
            <p className="text-xs text-red-600">You&apos;ve spent {formatCurrency(summary.total_spent)} of your {formatCurrency(summary.total_budget)} budget.</p>
          </div>
        </div>
      )}
      {summary && summary.budget_health === 'warning' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Approaching Budget Limit</p>
            <p className="text-xs text-amber-600">{summary.spent_percentage}% of your budget has been used.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Expense List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryFilter('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap
                ${!categoryFilter ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >All</button>
            {Object.entries(CATEGORY_CONFIG).filter(([k]) => !['lodging', 'other'].includes(k)).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(categoryFilter === key ? '' : key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap
                  ${categoryFilter === key ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >{cfg.label}</button>
            ))}
          </div>

          {/* Expenses */}
          {expenses.length > 0 ? (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  canEdit={canEdit}
                  onEdit={(e) => { setEditingExpense(e); setShowModal(true); }}
                  onDelete={(id) => deleteExpense(id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No expenses yet</p>
                {canEdit && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowModal(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Expense
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {summary && <CategoryBreakdownCard summary={summary} />}

          {summary && summary.recent_expenses.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {summary.recent_expenses.slice(0, 3).map((e) => {
                  const cfg = CATEGORY_CONFIG[e.category] || CATEGORY_CONFIG.other;
                  return (
                    <div key={e.id} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate">{e.title || e.description}</span>
                      <span className="font-semibold text-gray-900 shrink-0 ml-2">{formatCurrency(e.amount)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {summary && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Average</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.daily_average)}</p>
                <p className="text-xs text-gray-400 mt-1">per day</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {canEdit && showModal && (
        <ExpenseModal
          expense={editingExpense}
          tripId={tripId}
          onClose={() => { setShowModal(false); setEditingExpense(null); }}
        />
      )}
    </div>
  );
}
