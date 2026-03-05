'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database'

type Vehicle = Tables<'vehicles'>

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '\u2013'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysRemaining(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  return Math.ceil((due.getTime() - today.getTime()) / 86400000)
}

function DateField({ label, dateStr }: { label: string; dateStr: string | null }) {
  const days = getDaysRemaining(dateStr)

  let badgeClass = ''
  let badgeText = ''

  if (dateStr && days !== null) {
    if (days < 0) {
      badgeClass = 'text-red-700 bg-red-100'
      badgeText = `Overdue ${Math.abs(days)}d`
    } else if (days <= 30) {
      badgeClass = 'text-red-700 bg-red-100'
      badgeText = `${days}d`
    } else if (days <= 90) {
      badgeClass = 'text-amber-700 bg-amber-100'
      badgeText = `${days}d`
    } else {
      badgeClass = 'text-green-700 bg-green-100'
      badgeText = `${days}d`
    }
  }

  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-slate-700">{formatDate(dateStr)}</p>
        {badgeText && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Add form
  const [addReg, setAddReg] = useState('')
  const [addNickname, setAddNickname] = useState('')
  const [addMot, setAddMot] = useState('')
  const [addTax, setAddTax] = useState('')
  const [addInsurance, setAddInsurance] = useState('')
  const [addService, setAddService] = useState('')
  const [addNotes, setAddNotes] = useState('')

  // Edit form
  const [editReg, setEditReg] = useState('')
  const [editNickname, setEditNickname] = useState('')
  const [editMot, setEditMot] = useState('')
  const [editTax, setEditTax] = useState('')
  const [editInsurance, setEditInsurance] = useState('')
  const [editService, setEditService] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const loadVehicles = useCallback(async (hid: string) => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('household_id', hid)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setVehicles(data ?? [])
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
        await loadVehicles(member.household_id)
      }
    }
    init()
  }, [loadVehicles])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('add') === '1') setShowAdd(true)
    }
  }, [])

  function resetAddForm() {
    setAddReg('')
    setAddNickname('')
    setAddMot('')
    setAddTax('')
    setAddInsurance('')
    setAddService('')
    setAddNotes('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !userId) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('vehicles').insert({
      household_id: householdId,
      created_by: userId,
      registration: addReg.toUpperCase().trim(),
      nickname: addNickname.trim() || null,
      mot_expiry_date: addMot || null,
      tax_expiry_date: addTax || null,
      insurance_renewal_date: addInsurance || null,
      service_due_date: addService || null,
      notes: addNotes.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      resetAddForm()
      setShowAdd(false)
      await loadVehicles(householdId)
    }
    setSubmitting(false)
  }

  function startEdit(v: Vehicle) {
    setEditingId(v.id)
    setEditReg(v.registration)
    setEditNickname(v.nickname ?? '')
    setEditMot(v.mot_expiry_date ?? '')
    setEditTax(v.tax_expiry_date ?? '')
    setEditInsurance(v.insurance_renewal_date ?? '')
    setEditService(v.service_due_date ?? '')
    setEditNotes(v.notes ?? '')
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !householdId) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        registration: editReg.toUpperCase().trim(),
        nickname: editNickname.trim() || null,
        mot_expiry_date: editMot || null,
        tax_expiry_date: editTax || null,
        insurance_renewal_date: editInsurance || null,
        service_due_date: editService || null,
        notes: editNotes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setEditingId(null)
      await loadVehicles(householdId)
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!householdId) return
    const supabase = createClient()
    await supabase.from('vehicles').delete().eq('id', id)
    setDeleteConfirmId(null)
    await loadVehicles(householdId)
  }

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  const VehicleFormFields = ({
    reg, setReg,
    nickname, setNickname,
    mot, setMot,
    tax, setTax,
    insurance, setInsurance,
    service, setService,
    notes, setNotes,
  }: {
    reg: string; setReg: (v: string) => void
    nickname: string; setNickname: (v: string) => void
    mot: string; setMot: (v: string) => void
    tax: string; setTax: (v: string) => void
    insurance: string; setInsurance: (v: string) => void
    service: string; setService: (v: string) => void
    notes: string; setNotes: (v: string) => void
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Registration *</label>
        <input
          required
          type="text"
          value={reg}
          onChange={(e) => setReg(e.target.value.toUpperCase())}
          placeholder="AB12 CDE"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm uppercase"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Nickname</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g. The Fiesta"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">MOT expiry</label>
        <input
          type="date"
          value={mot}
          onChange={(e) => setMot(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tax expiry</label>
        <input
          type="date"
          value={tax}
          onChange={(e) => setTax(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Insurance renewal</label>
        <input
          type="date"
          value={insurance}
          onChange={(e) => setInsurance(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Service due</label>
        <input
          type="date"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        />
      </div>
    </div>
  )

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Vehicles</h1>
        <button
          type="button"
          onClick={() => { setShowAdd(!showAdd); resetAddForm() }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Vehicle</h3>
          <form onSubmit={handleAdd}>
            <VehicleFormFields
              reg={addReg} setReg={setAddReg}
              nickname={addNickname} setNickname={setAddNickname}
              mot={addMot} setMot={setAddMot}
              tax={addTax} setTax={setAddTax}
              insurance={addInsurance} setInsurance={setAddInsurance}
              service={addService} setService={setAddService}
              notes={addNotes} setNotes={setAddNotes}
            />
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      {vehicles.length === 0 && !showAdd ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-400" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M5 17H3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2M5 17h14M7 11h.01M17 11h.01" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">No vehicles added yet</p>
          <p className="text-slate-400 text-xs mb-4">Track MOT, tax and insurance dates for your vehicles.</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Add your first vehicle
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-sm">
              {editingId === v.id ? (
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Edit Vehicle</h3>
                  <form onSubmit={handleEdit}>
                    <VehicleFormFields
                      reg={editReg} setReg={setEditReg}
                      nickname={editNickname} setNickname={setEditNickname}
                      mot={editMot} setMot={setEditMot}
                      tax={editTax} setTax={setEditTax}
                      insurance={editInsurance} setInsurance={setEditInsurance}
                      service={editService} setService={setEditService}
                      notes={editNotes} setNotes={setEditNotes}
                    />
                    {error && (
                      <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <p className="text-red-600 text-xs">{error}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-3 mt-4">
                      <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
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
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{v.registration}</h3>
                      {v.nickname && <p className="text-sm text-slate-500">{v.nickname}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(v)}
                        className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === v.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
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
                          onClick={() => setDeleteConfirmId(v.id)}
                          className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DateField label="MOT expiry" dateStr={v.mot_expiry_date} />
                    <DateField label="Tax expiry" dateStr={v.tax_expiry_date} />
                    <DateField label="Insurance renewal" dateStr={v.insurance_renewal_date} />
                    <DateField label="Service due" dateStr={v.service_due_date} />
                  </div>
                  {v.notes && (
                    <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">{v.notes}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
