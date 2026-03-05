'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database'

type Task = Tables<'tasks'>
type Member = Tables<'household_members'>

type Status = 'todo' | 'doing' | 'done'
type Priority = 'low' | 'medium' | 'high'

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const STATUS_COLUMNS: { status: Status; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'doing', label: 'Doing' },
  { status: 'done', label: 'Done' },
]

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[priority] ?? 'bg-slate-100 text-slate-500'}`}>
      {priority}
    </span>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [activeTab, setActiveTab] = useState<Status>('todo')

  // Add form
  const [addTitle, setAddTitle] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addPriority, setAddPriority] = useState<Priority>('medium')
  const [addDueDate, setAddDueDate] = useState('')
  const [addAssignee, setAddAssignee] = useState('')

  const loadTasks = useCallback(async (hid: string) => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', hid)
      .order('created_at', { ascending: false })

    if (fetchError) setError(fetchError.message)
    else setTasks(data ?? [])
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

        const { data: membersData } = await supabase
          .from('household_members')
          .select('*')
          .eq('household_id', member.household_id)

        setMembers(membersData ?? [])
        await loadTasks(member.household_id)
      }
    }
    init()
  }, [loadTasks])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('add') === '1') setShowAdd(true)
    }
  }, [])

  function resetAddForm() {
    setAddTitle('')
    setAddNotes('')
    setAddPriority('medium')
    setAddDueDate('')
    setAddAssignee('')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!householdId || !userId) return
    setSubmitting(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('tasks').insert({
      household_id: householdId,
      created_by: userId,
      title: addTitle.trim(),
      notes: addNotes.trim() || null,
      priority: addPriority,
      due_date: addDueDate || null,
      assigned_to_user_id: addAssignee || null,
      status: 'todo',
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      resetAddForm()
      setShowAdd(false)
      await loadTasks(householdId)
    }
    setSubmitting(false)
  }

  async function moveTask(taskId: string, newStatus: Status) {
    if (!householdId) return
    const supabase = createClient()
    await supabase.from('tasks').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', taskId)
    await loadTasks(householdId)
  }

  async function deleteTask(taskId: string) {
    if (!householdId) return
    const supabase = createClient()
    await supabase.from('tasks').delete().eq('id', taskId)
    await loadTasks(householdId)
  }

  const tasksByStatus = (status: Status) => tasks.filter((t) => t.status === status)

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
        <button
          type="button"
          onClick={() => { setShowAdd(!showAdd); resetAddForm() }}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showAdd ? 'Cancel' : 'Add Task'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">New Task</h3>
          <form onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="What needs doing?"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Optional details"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Priority</label>
                <select
                  value={addPriority}
                  onChange={(e) => setAddPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  {PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Due date</label>
                <input
                  type="date"
                  value={addDueDate}
                  onChange={(e) => setAddDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Assign to</label>
                <select
                  value={addAssignee}
                  onChange={(e) => setAddAssignee(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {m.user_id === userId ? 'Me' : m.user_id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Saving...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile tabs */}
      <div className="md:hidden flex gap-1 bg-slate-100 rounded-lg p-1 mb-4">
        {STATUS_COLUMNS.map((col) => (
          <button
            key={col.status}
            type="button"
            onClick={() => setActiveTab(col.status)}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors ${
              activeTab === col.status ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'
            }`}
          >
            {col.label} ({tasksByStatus(col.status).length})
          </button>
        ))}
      </div>

      {/* Desktop: 3-column layout */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.status}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">{col.label}</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                {tasksByStatus(col.status).length}
              </span>
            </div>
            <TaskList
              tasks={tasksByStatus(col.status)}
              status={col.status}
              userId={userId}
              members={members}
              onMove={moveTask}
              onDelete={deleteTask}
            />
          </div>
        ))}
      </div>

      {/* Mobile: single active tab */}
      <div className="md:hidden">
        <TaskList
          tasks={tasksByStatus(activeTab)}
          status={activeTab}
          userId={userId}
          members={members}
          onMove={moveTask}
          onDelete={deleteTask}
        />
      </div>
    </div>
  )
}

function TaskList({
  tasks,
  status,
  userId,
  members,
  onMove,
  onDelete,
}: {
  tasks: Task[]
  status: Status
  userId: string | null
  members: Member[]
  onMove: (id: string, s: Status) => void
  onDelete: (id: string) => void
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
        <p className="text-slate-400 text-xs">No tasks here</p>
      </div>
    )
  }

  function getMemberLabel(uid: string | null): string {
    if (!uid) return ''
    if (uid === userId) return 'Me'
    const m = members.find((m) => m.user_id === uid)
    return m ? uid.slice(0, 6) : uid.slice(0, 6)
  }

  const nextStatuses: Record<Status, Status[]> = {
    todo: ['doing', 'done'],
    doing: ['todo', 'done'],
    done: ['todo', 'doing'],
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className={`text-sm font-medium ${status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.title}
            </p>
            {status !== 'done' && (
              <button
                type="button"
                onClick={() => onMove(task.id, 'done')}
                title="Mark done"
                className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-teal-400 hover:bg-teal-400 hover:border-teal-400 flex items-center justify-center transition-colors group"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-teal-400 group-hover:text-white">
                  <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-2">
            <PriorityBadge priority={task.priority} />
            {task.assigned_to_user_id && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {getMemberLabel(task.assigned_to_user_id)}
              </span>
            )}
            {task.due_date && (
              <span className="text-xs text-slate-400">{formatDate(task.due_date)}</span>
            )}
          </div>

          {task.notes && (
            <p className="text-xs text-slate-400 mb-2">{task.notes}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {nextStatuses[status as Status].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onMove(task.id, s)}
                className="text-xs px-2 py-1 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 capitalize transition-colors"
              >
                Move to {s === 'todo' ? 'To Do' : s === 'doing' ? 'Doing' : 'Done'}
              </button>
            ))}

            {deleteConfirmId === task.id ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { onDelete(task.id); setDeleteConfirmId(null) }}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Confirm delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs px-2 py-1 border border-slate-200 rounded-lg text-slate-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirmId(task.id)}
                className="text-xs px-2 py-1 border border-slate-200 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
