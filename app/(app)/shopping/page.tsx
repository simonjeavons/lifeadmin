'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Tables } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ShoppingItem = Tables<'shopping_items'>

export default function ShoppingPage() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listId, setListId] = useState<string | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [adding, setAdding] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const loadItems = useCallback(async (lid: string) => {
    const supabase = createClient()
    const { data, error: fetchError } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('shopping_list_id', lid)
      .order('created_at', { ascending: true })

    if (fetchError) setError(fetchError.message)
    else setItems(data ?? [])
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

      if (!member) return
      setHouseholdId(member.household_id)

      // Find or create shopping list
      let { data: list } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('household_id', member.household_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (!list) {
        const { data: newList, error: createError } = await supabase
          .from('shopping_lists')
          .insert({
            household_id: member.household_id,
            created_by: user.id,
            name: 'Shopping',
          })
          .select()
          .single()

        if (createError) {
          setError(createError.message)
          setLoading(false)
          return
        }
        list = newList
      }

      if (!list) {
        setLoading(false)
        return
      }

      setListId(list.id)
      await loadItems(list.id)
      setLoading(false)

      // Realtime subscription for cross-device sync
      const supabaseRt = createClient()
      const channel = supabaseRt
        .channel(`shopping_items_${list.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_items',
            filter: `shopping_list_id=eq.${list.id}`,
          },
          async () => {
            await loadItems(list!.id)
          }
        )
        .subscribe()

      channelRef.current = channel
    }

    init()

    return () => {
      if (channelRef.current) {
        const supabase = createClient()
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [loadItems])

  async function handleAddItem(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const name = newItem.trim()
    if (!name || !listId || !userId) return
    setAdding(true)

    // Optimistic add
    const tempId = `temp-${Date.now()}`
    const optimisticItem: ShoppingItem = {
      id: tempId,
      shopping_list_id: listId,
      created_by: userId,
      name,
      quantity: newQuantity.trim() || null,
      is_checked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setItems((prev) => [...prev, optimisticItem])
    setNewItem('')
    setNewQuantity('')

    const supabase = createClient()
    const { data: inserted, error: insertError } = await supabase
      .from('shopping_items')
      .insert({
        shopping_list_id: listId,
        created_by: userId,
        name,
        quantity: newQuantity.trim() || null,
        is_checked: false,
      })
      .select()
      .single()

    if (insertError) {
      // Roll back optimistic item
      setItems((prev) => prev.filter((i) => i.id !== tempId))
      setError(insertError.message)
    } else if (inserted) {
      // Replace temp item with real one
      setItems((prev) => prev.map((i) => (i.id === tempId ? inserted : i)))
    }
    setAdding(false)
  }

  async function toggleItem(item: ShoppingItem) {
    // Optimistic toggle
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_checked: !i.is_checked } : i))
    )

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('shopping_items')
      .update({ is_checked: !item.is_checked, updated_at: new Date().toISOString() })
      .eq('id', item.id)

    if (updateError) {
      // Roll back
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_checked: item.is_checked } : i))
      )
      setError(updateError.message)
    }
  }

  async function deleteItem(id: string) {
    // Optimistic delete
    setItems((prev) => prev.filter((i) => i.id !== id))

    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      if (listId) await loadItems(listId)
      setError(deleteError.message)
    }
  }

  async function deleteCheckedItems() {
    if (!listId) return
    const checkedIds = items.filter((i) => i.is_checked).map((i) => i.id)
    if (checkedIds.length === 0) return

    // Optimistic delete
    setItems((prev) => prev.filter((i) => !i.is_checked))

    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('shopping_items')
      .delete()
      .in('id', checkedIds)

    if (deleteError) {
      if (listId) await loadItems(listId)
      setError(deleteError.message)
    }
  }

  async function uncheckAll() {
    if (!listId) return
    const checkedIds = items.filter((i) => i.is_checked).map((i) => i.id)
    if (checkedIds.length === 0) return

    // Optimistic uncheck
    setItems((prev) => prev.map((i) => ({ ...i, is_checked: false })))

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('shopping_items')
      .update({ is_checked: false, updated_at: new Date().toISOString() })
      .in('id', checkedIds)

    if (updateError) {
      if (listId) await loadItems(listId)
      setError(updateError.message)
    }
  }

  const uncheckedItems = items.filter((i) => !i.is_checked)
  const checkedItems = items.filter((i) => i.is_checked)

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Shopping List</h1>
        <div className="flex items-center gap-2">
          {checkedItems.length > 0 && (
            <>
              <button
                type="button"
                onClick={uncheckAll}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Uncheck all
              </button>
              <button
                type="button"
                onClick={deleteCheckedItems}
                className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                Remove checked
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Quick add */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-5">
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item..."
            className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <input
            type="text"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="Qty"
            className="w-20 px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          <button
            type="submit"
            disabled={adding || !newItem.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      {/* Items list */}
      {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-slate-400" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Your shopping list is empty</p>
          <p className="text-slate-400 text-xs">Add items above to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {uncheckedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                onClick={() => toggleItem(item)}
                className="w-5 h-5 rounded border-2 border-slate-300 hover:border-teal-500 flex-shrink-0 flex items-center justify-center transition-colors"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800">{item.name}</p>
                {item.quantity && (
                  <p className="text-xs text-slate-400">{item.quantity}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}

          {checkedItems.length > 0 && (
            <>
              <div className="px-4 py-2 bg-slate-50">
                <p className="text-xs text-slate-400 font-medium">Checked ({checkedItems.length})</p>
              </div>
              {checkedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="w-5 h-5 rounded border-2 border-teal-500 bg-teal-500 flex-shrink-0 flex items-center justify-center transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-400 line-through">{item.name}</p>
                    {item.quantity && (
                      <p className="text-xs text-slate-300">{item.quantity}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
