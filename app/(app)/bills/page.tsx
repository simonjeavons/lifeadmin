'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database'

type Bill = Tables<'bills'>

const BILL_TYPES = [
  { value: 'bill', label: 'Bill' },
  { value: 'subscription', label: 'Subscription' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'rent_mortgage', label: 'Rent / Mortgage' },
]

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_off', label: 'One-off' },
]

const FILTERS = ['All', 'Bills', 'Subscriptions', 'Insurance', 'Active', 'Paused']

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysRemaining(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function formatAmount(pence: number | null): string {
  if (pence === null) return '\u2013'
  return '\u00a3' + (pence / 100).toFixed(2)
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    bill: 'bg-blue-100 text-blue-700',
    subscription: 'bg-purple-100 text-purple-700',
    insurance: 'bg-amber-100 text-amber-700',
    rent_mortgage: 'bg-teal-100 text-teal-700',
  }
  const labels: Record<string, string> = {
    bill: 'Bill',
    subscription: 'Sub',
    insurance: 'Insurance',
    rent_mortgage: 'Rent/Mortgage',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[type] ?? type}
    </span>
  )
}

function DaysBadge({ days }: { days: number }) {
  if (days < 0) return <span className="text-xs font-semibold text-red-600">Overdue {Math.abs(days)}d</span>
  if (days <= 7) return <span className="text-xs font-semibold text-red-600">{days}d</span>
  if (days <= 30) return <span className="text-xs font-semibold text-amber-600">{days}d</span>
  return <span className="text-xs font-semibold text-green-600">{days}d</span>
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Add form state
  const [addProvider, setAddProvider] = useState('')
  const [addType, setAddType] = useState('bill')
  const [addFrequency, setAddFrequency] = useState('monthly')
  const [addAmount, setAddAmount] = useState('')
  const [addDueDate, setAddDueDate] = useState('')
  const [addDescription, setAddDescription] = useState('')

  // Edit form state
  const [editProvider, setEditProvider] = useState('')
  const [editType, setEditType] = useState('bill')
  const [editFrequency, setEditFrequency] = useState('monthly')
  const [editAmount, setEditAmount] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const loadBills = useCallback(async (hid: string) => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('bills')
      .select('*')
      .eq('household_id', hid)
      .order('next_due_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBills(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: member } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (member) {
        setHouseholdId(member.household_id)
        await loadBills(member.household_id)
      }
    }
    init()
  }, [loadBills])

  // Check URL for ?add=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('add') === '1') setShowAdd(true)
    }
  }, [])

  function resetAddForm() {
    setAddProvider('')
    setAddType('bill')
    setAddFrequency('monthly')
    setAddAmount('')
    setAddDueDate('')
    setAddDescription('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !userId) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const amountPence = addAmount ? Math.round(parseFloat(addAmount) * 100) : null

    const { error: insertError } = await supabase.from('bills').insert({
      household_id: householdId,
      created_by: userId,
      provider: addProvider.trim(),
      type: addType,
      frequency: addFrequency,
      next_due_date: addDueDate,
      amount_pence: amountPence,
      description: addDescription.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      resetAddForm()
      setShowAdd(false)
      await loadBills(householdId)
    }
    setSubmitting(false)
  }

  function startEdit(bill: Bill) {
    setEditingId(bill.id)
    setEditProvider(bill.provider)
    setEditType(bill.type)
    setEditFrequency(bill.frequency)
    setEditAmount(bill.amount_pence !== null ? (bill.amount_pence / 100).toFixed(2) : '')
    setEditDueDate(bill.next_due_date)
    setEditDescription(bill.description ?? '')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !householdId) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const amountPence = editAmount ? Math.round(parseFloat(editAmount) * 100) : null

    const { error: updateError } = await supabase
      .from('bills')
      .update({
        provider: editProvider.trim(),
        type: editType,
        frequency: editFrequency,
        next_due_date: editDueDate,
        amount_pence: amountPence,
        description: editDescription.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setEditingId(null)
      await loadBills(householdId)
    }
    setSubmitting(false)
  }

  async function handleStatusToggle(bill: Bill) {
    if (!householdId) return
    const supabase = createClient()
    const newStatus = bill.status === 'active' ? 'paused' : 'active'
    await supabase.from('bills').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', bill.id)
    await loadBills(householdId)
  }

  async function handleDelete(id: string) {
    if (!householdId) return
    const supabase = createClient()
    await supabase.from('bills').delete().eq('id', id)
    setDeleteConfirmId(null)
    await loadBills(householdId)
  }

  const filteredBills = bills.filter((b) => {
    if (filter === 'All') return true
    if (filter === 'Bills') return b.type === 'bill'
    if (filter === 'Subscriptions') return b.type === 'subscription'
    if (filter === 'Insurance') return b.type === 'insurance'
    if (filter === 'Active') return b.status === 'active'
    if (filter === 'Paused') return b.status === 'paused'
    return true
  })

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Bills</h1>
        <button
          type="button"
          onClick={() => { setShowAdd(!showAdd); resetAddForm() }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? 'Cancel' : 'Add Bill'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Bill</h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Provider *</label>
                <input
                  required
                  type="text"
                  value={addProvider}
                  onChange={(e) => setAddProvider(e.target.value)}
                  placeholder="e.g. British Gas"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                <select
                  value={addType}
                  onChange={(e) => setAddType(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  {BILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount (&#163;)</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                <select
                  value={addFrequency}
                  onChange={(e) => setAddFrequency(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Next due date *</label>
                <input
                  required
                  type="date"
                  value={addDueDate}
                  onChange={(e) => setAddDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <input
                  type="text"
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  placeholder="Optional note"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-sky-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Bills list */}
      {error && !showAdd && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No bills found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {filteredBills.map((bill) => (
            <div key={bill.id}>
              {editingId === bill.id ? (
                /* Inline edit form */
                <div className="p-5">
                  <form onSubmit={handleEdit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Provider *</label>
                        <input
                          required
                          type="text"
                          value={editProvider}
                          onChange={(e) => setEditProvider(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                        >
                          {BILL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Amount (&#163;)</label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Frequency</label>
                        <select
                          value={editFrequency}
                          onChange={(e) => setEditFrequency(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                        >
                          {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Next due date *</label>
                        <input
                          required
                          type="date"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Normal row */
                <div className="flex items-center gap-3 px-5 py-4">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => startEdit(bill)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-slate-800">{bill.provider}</span>
                      <TypeBadge type={bill.type} />
                      {bill.status === 'paused' && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Paused</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{formatAmount(bill.amount_pence)}</span>
                      <span>&middot;</span>
                      <span className="capitalize">{bill.frequency}</span>
                      <span>&middot;</span>
                      <span>Due {formatDate(bill.next_due_date)}</span>
                      <DaysBadge days={getDaysRemaining(bill.next_due_date)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(bill)}
                      title={bill.status === 'active' ? 'Pause' : 'Resume'}
                      className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      {bill.status === 'active' ? 'Pause' : 'Resume'}
                    </button>

                    {deleteConfirmId === bill.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(bill.id)}
                          className="text-xs px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(bill.id)}
                        className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
