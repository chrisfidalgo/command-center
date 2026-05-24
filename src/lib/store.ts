'use client'

import { useState, useEffect } from 'react'

type StoreActions<T> = {
  add: (item: T) => void
  update: (id: string, patch: Partial<T>) => void
  remove: (id: string) => void
  set: (items: T[]) => void
}

export function useLocalStore<T extends { id: string }>(
  key: string,
  seeds: T[]
): [T[], StoreActions<T>, boolean] {
  const [items, setItems] = useState<T[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(key)
    setItems(saved ? JSON.parse(saved) : seeds)
    setMounted(true)
  // seeds intentionally omitted — only seed on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (mounted) localStorage.setItem(key, JSON.stringify(items))
  }, [items, mounted, key])

  const actions: StoreActions<T> = {
    add: (item) => setItems(prev => [...prev, item]),
    update: (id, patch) =>
      setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item))),
    remove: (id) => setItems(prev => prev.filter(item => item.id !== id)),
    set: (newItems) => setItems(newItems),
  }

  return [items, actions, mounted]
}
