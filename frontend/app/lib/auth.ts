import { useRuntimeConfig } from '#app'

export const validateCredentials = (username: string, password: string): boolean => {
  // Get credentials from runtime config (set via environment variables)
  const config = useRuntimeConfig()
  const validUser = config.public.appUser
  const validPassword = config.public.appPassword

  // Fallback to environment variables if config not available
  const user = validUser || process.env.NUXT_PUBLIC_APP_USER || ''
  const password_ = validPassword || process.env.NUXT_PUBLIC_APP_PASSWORD || ''

  // Failed to load credentials
  if (!user || !password_) {
    console.warn('App credentials not configured. Set NUXT_PUBLIC_APP_USER and NUXT_PUBLIC_APP_PASSWORD environment variables.')
    return false
  }

  return username === user && password === password_
}

export const getStoredAuthToken = (): string | null => {
  if (typeof localStorage === 'undefined') {
    return null
  }
  return localStorage.getItem('weekplanner-auth-token')
}

export const setAuthToken = (token: string): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('weekplanner-auth-token', token)
  }
}

export const clearAuthToken = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('weekplanner-auth-token')
  }
}

export const isAuthenticated = (): boolean => {
  const token = getStoredAuthToken()
  return token === 'authenticated'
}
