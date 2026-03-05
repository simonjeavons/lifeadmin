import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-teal-700"
              >
                <path
                  d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xl font-bold text-teal-700">LifeAdmin</span>
            </div>

            {/* Nav links - desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-teal-700 text-sm font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-teal-700 text-sm font-medium">
                How It Works
              </a>
              <a href="#pricing" className="text-slate-600 hover:text-teal-700 text-sm font-medium">
                Pricing
              </a>
              <Link href="/login" className="text-slate-600 hover:text-teal-700 text-sm font-medium">
                Login
              </Link>
            </div>

            {/* CTA button */}
            <Link
              href="/login"
              className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-sky-50 py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-4">
                Run Your Home Like a Business
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                All your bills, renewals and tasks &ndash; in one shared dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg text-center transition-colors"
                >
                  Get Started &ndash; it&apos;s Free
                </Link>
                <a
                  href="#how-it-works"
                  className="border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-6 py-3 rounded-lg text-center transition-colors"
                >
                  Watch Demo
                </a>
              </div>
            </div>

            {/* Right: Mock app preview */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {/* What's Due Soon */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">What&apos;s Due Soon</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700">Car Insurance Renewal</span>
                    </div>
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">5 days</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-600">
                          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700">Electricity Bill</span>
                    </div>
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">3 days</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                          <path d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M5 17H3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2M5 17h14M7 11h.01M17 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700">MOT for Ford Fiesta</span>
                    </div>
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">18 days</span>
                  </div>
                </div>
              </div>

              {/* Household Overview */}
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Household Overview</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-sky-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-teal-700">7</p>
                    <p className="text-xs text-slate-500 mt-1">Bills</p>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-teal-700">2</p>
                    <p className="text-xs text-slate-500 mt-1">Vehicles</p>
                  </div>
                  <div className="bg-sky-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-teal-700">5</p>
                    <p className="text-xs text-slate-500 mt-1">Tasks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Everything you need, in one place</h2>
            <p className="text-slate-600 text-lg">Stop losing track of important dates and payments.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-700">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M3 9H21M8 2V5M16 2V5M8 14H10M12 14H14M16 14H18M8 17H10M12 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Track Your Bills</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Never miss a payment. Track all your bills, subscriptions and insurance renewals with smart reminders.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-700">
                  <path d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M5 17H3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2M5 17h14M7 11h.01M17 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Manage Your MOT &amp; Tax</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Keep on top of MOT expiries, road tax, insurance renewals and service dates for all your vehicles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal-700">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Share Tasks &amp; Lists</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Collaborate with your household. Share tasks, shopping lists and reminders with family members in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Take Control Section */}
      <section id="how-it-works" className="py-16 bg-sky-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Take Control of Your Home Admin</h2>
            <p className="text-slate-600 text-lg">A clear overview of everything that matters.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Preview card 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                  <path d="M15 17H20L18.5955 15.5955C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40453 15.5955L4 17H9M15 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="text-sm font-semibold text-slate-800">Upcoming Reminders</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Home Insurance', days: '12 days', colour: 'text-amber-600 bg-amber-50' },
                  { label: 'Netflix renewal', days: '3 days', colour: 'text-red-600 bg-red-50' },
                  { label: 'Council Tax', days: '21 days', colour: 'text-amber-600 bg-amber-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.colour}`}>{item.days}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                  <path d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M5 17H3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2M5 17h14M7 11h.01M17 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <h3 className="text-sm font-semibold text-slate-800">MOT &amp; Tax Alerts</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Ford Fiesta MOT', days: '18 days', colour: 'text-amber-600 bg-amber-50' },
                  { label: 'Honda CR-V Tax', days: '45 days', colour: 'text-green-600 bg-green-50' },
                  { label: 'Ford Fiesta Tax', days: '7 days', colour: 'text-red-600 bg-red-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.colour}`}>{item.days}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview card 3 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600">
                  <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <h3 className="text-sm font-semibold text-slate-800">Subscription Tracker</h3>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Netflix', amount: '£17.99/mo' },
                  { label: 'Spotify Family', amount: '£17.99/mo' },
                  { label: 'Amazon Prime', amount: '£8.99/mo' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-xs font-medium text-slate-500">{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">Simplify Your Home Life Today</h2>
          <p className="text-slate-600 mb-8">Join thousands of households already saving time and money.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-10">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              readOnly
            />
            <Link
              href="/login"
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
            >
              Get Started Free
            </Link>
          </div>

          {/* As Seen In */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-4">As Seen In</p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <span className="text-slate-400 font-semibold text-sm">The Guardian</span>
              <span className="text-slate-400 font-semibold text-sm">Which?</span>
              <span className="text-slate-400 font-semibold text-sm">MoneySavingExpert.com</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-teal-300">
                  <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" fill="currentColor"/>
                </svg>
                <span className="font-bold text-white">LifeAdmin</span>
              </div>
              <p className="text-teal-300 text-sm leading-relaxed">
                Run your home like a business.
              </p>
            </div>

            {/* About */}
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">About</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Our Story</a></li>
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Blog</a></li>
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Careers</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Help Centre</a></li>
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Status</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-teal-300 hover:text-white text-sm transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-teal-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-teal-400 text-xs">
              &copy; {new Date().getFullYear()} LifeAdmin. All rights reserved.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-4">
              {/* Facebook */}
              <a href="#" className="text-teal-400 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                </svg>
              </a>
              {/* Twitter */}
              <a href="#" className="text-teal-400 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a href="#" className="text-teal-400 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
