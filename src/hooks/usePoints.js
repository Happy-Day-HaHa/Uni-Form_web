import { useEffect, useState } from 'react'
import { getPointBalance } from '../services/pointService'
import { useAuth } from './useAuth'

export function usePoints() {
  const { user } = useAuth()
  const [points, setPoints] = useState(0)
  useEffect(() => { if (user) getPointBalance(user.id).then(setPoints).catch(() => setPoints(0)) }, [user])
  return { points, refresh: () => user && getPointBalance(user.id).then(setPoints) }
}
