
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Check current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Look up invite by token
  const { data: invite, error: inviteError } = await supabase
    .from('household_invites')
    .select('*, households(name)')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 font-[family-name:var(--font-geist-sans)]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-500">
              <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invalid invite link</h1>
          <p className="text-slate-500 text-sm mb-6">This invite link is not valid or has already been used.</p>
          <Link href="/" className="text-teal-700 hover:text-teal-800 text-sm font-medium">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  // Check if invite is expired
  const now = new Date()
  const expiresAt = new Date(invite.expires_at)
  if (now > expiresAt) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 font-[family-name:var(--font-geist-sans)]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-amber-500">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invite expired</h1>
          <p className="text-slate-500 text-sm mb-6">This invite link has expired. Please ask for a new one.</p>
          <Link href="/" className="text-teal-700 hover:text-teal-800 text-sm font-medium">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  // Check if already accepted
  if (invite.accepted_at) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 font-[family-name:var(--font-geist-sans)]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-500">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Already accepted</h1>
          <p className="text-slate-500 text-sm mb-6">This invite has already been used.</p>
          <Link href="/login" className="text-teal-700 hover:text-teal-800 text-sm font-medium">
            Sign in to LifeAdmin
          </Link>
        </div>
      </div>
    )
  }

  const householdName =
    invite.households && typeof invite.households === 'object' && 'name' in invite.households
      ? (invite.households as { name: string }).name
      : 'this household'

  // If user is logged in, accept the invite and redirect
  if (user) {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', invite.household_id)
      .eq('user_id', user.id)
      .single()

    if (!existingMember) {
      // Insert household_member
      await supabase.from('household_members').insert({
        household_id: invite.household_id,
        user_id: user.id,
        role: 'member',
      })
    }

    // Mark invite as accepted
    await supabase
      .from('household_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    redirect('/dashboard')
  }

  // Not logged in - redirect to login with invite token
  redirect(`/login?invite=${token}`)
}
