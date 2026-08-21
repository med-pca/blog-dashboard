import { createContext, useContext, useState, useEffect } from 'react'
import { API } from '../api/config.js'
import { logout as apiLogout } from '../api/admin'
const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [isAuth, setIsAuth] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/auth/me`, { credentials: 'include' })
      .then((r) => { if (r.ok) setIsAuth(true) })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const saveToken = () => setIsAuth(true)

  // The API call lives here so logout never happens before the token's jti is
  // blacklisted server-side. If the session already expired (401 paths) the call
  // fails silently, which is fine.
  const logout = () => {
    const done = apiLogout().catch(() => {})
    setIsAuth(false)
    return done
  }

  if (checking) return null

  return (
    <AdminAuthContext.Provider value={{ saveToken, logout, isAuth }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  return useContext(AdminAuthContext)
}
