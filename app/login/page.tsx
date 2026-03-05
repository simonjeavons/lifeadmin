'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center px-4 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-teal-700"
            >
              <path
                d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                fill="currentColor"
              />
            </svg>
            <span className="text-xl font-bold text-teal-700">LifeAdmin</span>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center">
              <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                  <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Check your email!</h2>
              <p className="text-slate-600 text-sm mb-1">
                We&apos;ve sent a magic link to
              </p>
              <p className="text-teal-700 font-semibold text-sm mb-6">{email}</p>
              <p className="text-slate-500 text-xs">
                Click the link in the email to sign in. The link expires in 1 hour.
              </p>
            </div>
          ) : (
            /* Sign in form */
            <>
              <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
                Sign in to LifeAdmin
              </h1>
              <p className="text-slate-500 text-sm text-center mb-6">
                Enter your email and we&apos;ll send you a magic link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-slate-800 placeholder-slate-400"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to home */}
        <p className="text-center mt-4 text-sm text-slate-500">
          <Link href="/" className="text-teal-700 hover:text-teal-800 font-medium">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
