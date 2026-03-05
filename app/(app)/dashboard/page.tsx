
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

type DueItem = {
  id: string
  type: 'bill' | 'vehicle_mot' | 'vehicle_tax' | 'vehicle_insurance' | 'vehicle_service' | 'task'
  title: string
  dueDate: string
  daysRemaining: number
  sourceType: string
}

function getBillTitle(type: string, provider: string): string {
  switch (type) {
    case 'subscription':
      return `${provider} renewal`
    case 'insurance':
      return `${provider} renewal`
    case 'rent_mortgage':
      return provider
    default:
      return `${provider} payment`
  }
}

function getVehicleLabel(vehicle: { registration: string; nickname: string | null }): string {
  return vehicle.nickname || vehicle.registration
}

function DaysBadge({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Overdue {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''}
      </span>
    )
  }
  if (days <= 7) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        {days} day{days !== 1 ? 's' : ''}
      </span>
    )
  }
  if (days <= 30) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        {days} days
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      {days} days
    </span>
  )
}

function ItemIcon({ type }: { type: DueItem['type'] }) {
  if (type === 'bill') {
    return (
      <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-blue-600" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round"/>
        </svg>
      </div>
    )
  }
  if (type.startsWith('vehicle')) {
    return (
      <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M5 17H3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2M5 17h14M7 11h.01M17 11h.01" strokeLinecap="round"/>
        </svg>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-purple-600" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}) {
  const { window: windowParam } = await searchParams
  const windowDays = windowParam === '7' ? 7 : windowParam === '90' ? 90 : 30

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get household
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, households(id, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!member) redirect('/onboarding')

  const householdId = member.household_id

  // Fetch bills, vehicles, tasks in parallel
  const [billsResult, vehiclesResult, tasksResult] = await Promise.all([
    supabase
      .from('bills')
      .select('id, provider, type, next_due_date, status')
      .eq('household_id', householdId)
      .eq('status', 'active'),
    supabase
      .from('vehicles')
      .select('id, registration, nickname, mot_expiry_date, tax_expiry_date, insurance_renewal_date, service_due_date')
      .eq('household_id', householdId),
    supabase
      .from('tasks')
      .select('id, title, due_date, status')
      .eq('household_id', householdId)
      .in('status', ['todo', 'doing']),
  ])

  const bills = billsResult.data ?? []
  const vehicles = vehiclesResult.data ?? []
  const tasks = tasksResult.data ?? []

  // Combine into unified due-soon items
  const allItems: DueItem[] = []

  for (const bill of bills) {
    if (!bill.next_due_date) continue
    allItems.push({
      id: `bill-${bill.id}`,
      type: 'bill',
      title: getBillTitle(bill.type, bill.provider),
      dueDate: bill.next_due_date,
      daysRemaining: getDaysRemaining(bill.next_due_date),
      sourceType: bill.type,
    })
  }

  for (const v of vehicles) {
    const label = getVehicleLabel(v)
    if (v.mot_expiry_date) {
      allItems.push({
        id: `vmot-${v.id}`,
        type: 'vehicle_mot',
        title: `${label} MOT due`,
        dueDate: v.mot_expiry_date,
        daysRemaining: getDaysRemaining(v.mot_expiry_date),
        sourceType: 'vehicle',
      })
    }
    if (v.tax_expiry_date) {
      allItems.push({
        id: `vtax-${v.id}`,
        type: 'vehicle_tax',
        title: `${label} road tax due`,
        dueDate: v.tax_expiry_date,
        daysRemaining: getDaysRemaining(v.tax_expiry_date),
        sourceType: 'vehicle',
      })
    }
    if (v.insurance_renewal_date) {
      allItems.push({
        id: `vins-${v.id}`,
        type: 'vehicle_insurance',
        title: `${label} insurance renewal`,
        dueDate: v.insurance_renewal_date,
        daysRemaining: getDaysRemaining(v.insurance_renewal_date),
        sourceType: 'vehicle',
      })
    }
    if (v.service_due_date) {
      allItems.push({
        id: `vsvc-${v.id}`,
        type: 'vehicle_service',
        title: `${label} service due`,
        dueDate: v.service_due_date,
        daysRemaining: getDaysRemaining(v.service_due_date),
        sourceType: 'vehicle',
      })
    }
  }

  for (const task of tasks) {
    if (!task.due_date) continue
    allItems.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      dueDate: task.due_date,
      daysRemaining: getDaysRemaining(task.due_date),
      sourceType: 'task',
    })
  }

  // Filter by window (include overdue always)
  const filteredItems = allItems.filter(
    (item) => item.daysRemaining <= windowDays
  )

  // Sort: overdue first (most overdue first), then soonest due
  filteredItems.sort((a, b) => {
    if (a.daysRemaining < 0 && b.daysRemaining < 0) return a.daysRemaining - b.daysRemaining
    if (a.daysRemaining < 0) return -1
    if (b.daysRemaining < 0) return 1
    return a.daysRemaining - b.daysRemaining
  })

  // Summary counts
  const activeBillCount = bills.length
  const vehicleCount = vehicles.length
  const openTaskCount = tasks.length

  const tabs = [
    { label: '7 days', value: '7' },
    { label: '30 days', value: '30' },
    { label: '90 days', value: '90' },
  ]

  const quickActions = [
    { label: 'Add Bill', href: '/bills?add=1', icon: 'bill' },
    { label: 'Add Vehicle', href: '/vehicles?add=1', icon: 'vehicle' },
    { label: 'Add Task', href: '/tasks?add=1', icon: 'task' },
    { label: 'Add Shopping', href: '/shopping', icon: 'shopping' },
  ]

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Due Soon section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-800">What&apos;s Due Soon</h2>
            {/* Window tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.value}
                  href={`/dashboard?window=${tab.value}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    String(windowDays) === tab.value
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm">Nothing due in the next {windowDays} days.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ItemIcon type={item.type} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.dueDate)}</p>
                  </div>
                </div>
                <DaysBadge days={item.daysRemaining} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors text-center"
            >
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                {action.icon === 'bill' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" strokeLinecap="round"/>
                  </svg>
                )}
                {action.icon === 'vehicle' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 17H3a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M5 17H3M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2M5 17h14M7 11h.01M17 11h.01" strokeLinecap="round"/>
                  </svg>
                )}
                {action.icon === 'task' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {action.icon === 'shopping' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-teal-600" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Household Summary */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Household Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/bills" className="bg-sky-50 hover:bg-sky-100 rounded-xl p-4 text-center transition-colors">
            <p className="text-3xl font-bold text-teal-700">{activeBillCount}</p>
            <p className="text-xs text-slate-500 mt-1">Active Bills</p>
          </Link>
          <Link href="/vehicles" className="bg-sky-50 hover:bg-sky-100 rounded-xl p-4 text-center transition-colors">
            <p className="text-3xl font-bold text-teal-700">{vehicleCount}</p>
            <p className="text-xs text-slate-500 mt-1">Vehicles</p>
          </Link>
          <Link href="/tasks" className="bg-sky-50 hover:bg-sky-100 rounded-xl p-4 text-center transition-colors">
            <p className="text-3xl font-bold text-teal-700">{openTaskCount}</p>
            <p className="text-xs text-slate-500 mt-1">Open Tasks</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
