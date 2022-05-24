import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string) {
  const [state, setState] = useState<T | null>(null)

  useEffect(() => {
    const serialized = localStorage.getItem(key)
    const deserialized = serialized === null ? null : (JSON.parse(serialized) as T)
    setState(deserialized)
  }, [key])

  const setWithLocalStorage = (newValue: T | null) => {
    if (newValue === null) {
      localStorage.removeItem(key)
    } else {
      const serialized = JSON.stringify(newValue)
      localStorage.setItem(key, serialized)
    }
    setState(newValue)
  }

  return [state, setWithLocalStorage] as const
}
