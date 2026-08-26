import { useEffect, useState } from 'react'

export function useRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/role')
      .then(res => res.json())
      .then(data => setRole(data.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false))
  }, [])

  return { role, loading }
}