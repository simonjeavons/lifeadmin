'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database'

type Household = Tables<'households'>
type Member = Tables<'household_members'>

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Household name edit
  const [householdName, setHouseholdName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)

  // Notification prefs (stored locally for now)
  const [notifyBills, setNotifyBills] = useState(true)
  const [notifyVehicles, setNotifyVehicles] = useState(true)
  const [notifyTasks, setNotifyTasks] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)
    setUserEmail(user.email ?? null)

    const { data: member } = await supabase
      .from('household_members')
      .select('household_id, households(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!member) {
      setLoading(false)
      return
    }

    const hh = member.households as Household
    setHousehold(hh)
    setHouseholdName(hh.name)

    const { data: membersData } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', member.household_id)

    setMembers(membersData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function saveHouseholdName(e: React.FormEvent) {
    e.preventDefault()
    if (!household) return
    setSavingName(true)
    setError(null)
    setSuccess(null)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('households')
      .update({ name: householdName.trim(), updated_at: new Date().toISOString() })
      .eq('id', household.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess('Household name updated.')
      await loadData()
    }
    setSavingName(false)
  }

  async function generateInvite() {
    if (!household || !userId) return
    setGeneratingInvite(true)
    setError(null)
    setInviteLink(null)

    const supabase = createClient()
    const { data: invite, error: inviteError } = await supabase
      .from('household_invites')
      .insert({
        household_id: household.id,
        created_by: userId,
        email: inviteEmail.trim() || null,
      })
      .select()
      .single()

    if (inviteError || !invite) {
      setError(inviteError?.message ?? 'Failed to generate invite.')
    } else {
      setInviteLink(`${window.location.origin}/invite/${invite.token}`)
    }
    setGeneratingInvite(false)
  }

  function copyInviteLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    })
  }

  async function removeMember(memberId: string) {
    if (!household) return
    setSaving(true)
    const supabase = createClient()
    const { error: removeError } = await supabase
      .from('household_members')
      .delete()
      .eq('id', memberId)

    if (removeError) setError(removeError.message)
    else await loadData()
    setSaving(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function RoleBadge({ role }: { role: string }) {
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${role === 'owner' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
        {role}
      </span>
    )
  }

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
      <label className="flex items-center justify-between py-3 cursor-pointer">
        <span className="text-sm text-slate-700">{label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}
          />
        </button>
      </label>
    )
  }

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Household name */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Household</h2>
        <form onSubmit={saveHouseholdName}>
          <div className="flex gap-3">
            <input
              type="text"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              required
              className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            <button
              type="submit"
              disabled={savingName}
              className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Members</h2>
        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-700">
                    {m.user_id === userId ? userEmail ?? 'You' : m.user_id.slice(0, 16) + '...'}
                  </p>
                  {m.user_id === userId && (
                    <span className="text-xs text-slate-400">(you)</span>
                  )}
                </div>
                <div className="mt-1">
                  <RoleBadge role={m.role} />
                </div>
              </div>
              {m.user_id !== userId && (
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  disabled={saving}
                  className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Invite someone</h2>
        <p className="text-slate-500 text-sm mb-4">Generate a link or invite by email.</p>

        <div className="flex gap-2 mb-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email (optional)"
            className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <button
            type="button"
            onClick={generateInvite}
            disabled={generatingInvite}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            {generatingInvite ? 'Generating...' : 'Generate link'}
          </button>
        </div>

        {inviteLink && (
          <div className="bg-sky-50 border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-teal-700 break-all font-mono flex-1">{inviteLink}</p>
            <button
              type="button"
              onClick={copyInviteLink}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
            >
              {inviteCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-4">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Notification preferences</h2>
        <p className="text-slate-500 text-xs mb-3">Email reminders for upcoming items.</p>
        <div className="divide-y divide-slate-100">
          <Toggle checked={notifyBills} onChange={setNotifyBills} label="Bill reminders" />
          <Toggle checked={notifyVehicles} onChange={setNotifyVehicles} label="Vehicle reminders (MOT, Tax, Insurance)" />
          <Toggle checked={notifyTasks} onChange={setNotifyTasks} label="Task due date reminders" />
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-1">Account</h2>
        {userEmail && (
          <p className="text-sm text-slate-500 mb-4">Signed in as <span className="font-medium text-slate-700">{userEmail}</span></p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
