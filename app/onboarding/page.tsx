'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

type Step = 1 | 2 | 3 | 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [householdName, setHouseholdName] = useState('My Home')
  const [householdId, setHouseholdId] = useState<string | null>(null)

  // Step 2 state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  // Step 3 state
  const [billProvider, setBillProvider] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billFrequency, setBillFrequency] = useState('monthly')
  const [billType, setBillType] = useState('bill')
  const [billNextDue, setBillNextDue] = useState('')

  // Step 4 state
  const [vehReg, setVehReg] = useState('')
  const [vehNickname, setVehNickname] = useState('')
  const [vehMot, setVehMot] = useState('')
  const [vehTax, setVehTax] = useState('')

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not logged in. Please sign in again.')
      setLoading(false)
      return
    }

    // Create household
    const { data: household, error: hhError } = await supabase
      .from('households')
      .insert({ name: householdName.trim() || 'My Home', created_by: user.id })
      .select()
      .single()

    if (hhError || !household) {
      setError(hhError?.message ?? 'Failed to create household.')
      setLoading(false)
      return
    }

    // Create household_member (owner)
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: user.id, role: 'owner' })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    setHouseholdId(household.id)
    setLoading(false)
    setStep(2)
  }

  async function handleStep2Continue(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!inviteEmail.trim()) {
      setStep(3)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !householdId) {
      setError('Session error. Please refresh.')
      setLoading(false)
      return
    }

    const { data: invite, error: inviteError } = await supabase
      .from('household_invites')
      .insert({
        household_id: householdId,
        created_by: user.id,
        email: inviteEmail.trim(),
      })
      .select()
      .single()

    if (inviteError || !invite) {
      setError(inviteError?.message ?? 'Failed to create invite.')
      setLoading(false)
      return
    }

    setInviteLink(`${window.location.origin}/invite/${invite.token}`)
    setLoading(false)
  }

  function handleStep2Skip() {
    setStep(3)
  }

  function handleStep2InviteContinue() {
    setStep(3)
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!billProvider.trim() || !billNextDue) {
      setStep(4)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !householdId) {
      setError('Session error. Please refresh.')
      setLoading(false)
      return
    }

    const amountPence = billAmount ? Math.round(parseFloat(billAmount) * 100) : null

    const { error: billError } = await supabase.from('bills').insert({
      household_id: householdId,
      created_by: user.id,
      provider: billProvider.trim(),
      type: billType,
      frequency: billFrequency,
      next_due_date: billNextDue,
      amount_pence: amountPence,
    })

    if (billError) {
      setError(billError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setStep(4)
  }

  function handleStep3Skip() {
    setStep(4)
  }

  async function handleStep4(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!vehReg.trim()) {
      await finishOnboarding()
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !householdId) {
      setError('Session error. Please refresh.')
      setLoading(false)
      return
    }

    const { error: vehError } = await supabase.from('vehicles').insert({
      household_id: householdId,
      created_by: user.id,
      registration: vehReg.toUpperCase().trim(),
      nickname: vehNickname.trim() || null,
      mot_expiry_date: vehMot || null,
      tax_expiry_date: vehTax || null,
    })

    if (vehError) {
      setError(vehError.message)
      setLoading(false)
      return
    }

    await finishOnboarding()
  }

  async function finishOnboarding() {
    setLoading(true)

    if (householdId) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Create default shopping list
        const { data: existingList } = await supabase
          .from('shopping_lists')
          .select('id')
          .eq('household_id', householdId)
          .limit(1)

        if (!existingList || existingList.length === 0) {
          await supabase.from('shopping_lists').insert({
            household_id: householdId,
            created_by: user.id,
            name: 'Shopping',
          })
        }
      }
    }

    router.push('/dashboard')
  }

  async function handleStep4Skip() {
    await finishOnboarding()
  }

  const steps = [
    { num: 1, label: 'Household' },
    { num: 2, label: 'Invite' },
    { num: 3, label: 'First Bill' },
    { num: 4, label: 'Vehicle' },
  ]

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 py-8 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-teal-700">
            <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" fill="currentColor"/>
          </svg>
          <span className="text-lg font-bold text-teal-700">LifeAdmin</span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step > s.num
                      ? 'bg-teal-600 text-white'
                      : step === s.num
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {step > s.num ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className={`text-xs ${step >= s.num ? 'text-teal-700 font-medium' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-1.5 bg-slate-200 rounded-full">
            <div
              className="absolute left-0 top-0 h-1.5 bg-teal-600 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">

          {/* Step 1: Household name */}
          {step === 1 && (
            <form onSubmit={handleStep1}>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Name your household</h2>
              <p className="text-slate-500 text-sm mb-6">This is how it will appear on your dashboard.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Household name
                </label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  placeholder="My Home"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </form>
          )}

          {/* Step 2: Invite member */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Invite a household member</h2>
              <p className="text-slate-500 text-sm mb-6">
                Share LifeAdmin with someone who lives with you. You can skip this for now.
              </p>

              {inviteLink ? (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Share this invite link:</p>
                  <div className="bg-sky-50 border border-slate-200 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs text-teal-700 break-all font-mono">{inviteLink}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink)
                    }}
                    className="w-full border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold py-2.5 rounded-lg transition-colors text-sm mb-3"
                  >
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={handleStep2InviteContinue}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStep2Continue}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email address (optional)
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleStep2Skip}
                      className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-lg transition-colors text-sm"
                    >
                      Skip
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                    >
                      {loading ? 'Sending...' : 'Continue'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Step 3: Add first bill */}
          {step === 3 && (
            <form onSubmit={handleStep3}>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Add your first bill</h2>
              <p className="text-slate-500 text-sm mb-6">
                Add a bill, subscription or insurance policy. You can skip this for now.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                  <input
                    type="text"
                    value={billProvider}
                    onChange={(e) => setBillProvider(e.target.value)}
                    placeholder="e.g. British Gas, Netflix"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={billType}
                      onChange={(e) => setBillType(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    >
                      <option value="bill">Bill</option>
                      <option value="subscription">Subscription</option>
                      <option value="insurance">Insurance</option>
                      <option value="rent_mortgage">Rent / Mortgage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                    <select
                      value={billFrequency}
                      onChange={(e) => setBillFrequency(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                      <option value="one_off">One-off</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (£)</label>
                    <input
                      type="number"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Next due date</label>
                    <input
                      type="date"
                      value={billNextDue}
                      onChange={(e) => setBillNextDue(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleStep3Skip}
                  className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Add first vehicle */}
          {step === 4 && (
            <form onSubmit={handleStep4}>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Add your first vehicle</h2>
              <p className="text-slate-500 text-sm mb-6">
                Track MOT, tax and insurance dates. You can skip this for now.
              </p>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration</label>
                    <input
                      type="text"
                      value={vehReg}
                      onChange={(e) => setVehReg(e.target.value.toUpperCase())}
                      placeholder="AB12 CDE"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
                    <input
                      type="text"
                      value={vehNickname}
                      onChange={(e) => setVehNickname(e.target.value)}
                      placeholder="e.g. The Fiesta"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">MOT expiry</label>
                    <input
                      type="date"
                      value={vehMot}
                      onChange={(e) => setVehMot(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax expiry</label>
                    <input
                      type="date"
                      value={vehTax}
                      onChange={(e) => setVehTax(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleStep4Skip}
                  disabled={loading}
                  className="flex-1 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Saving...' : 'Finish'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
