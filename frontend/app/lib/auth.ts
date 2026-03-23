export const login = async (username: string, password: string): Promise<void> => {
  await $fetch('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export const logout = async (): Promise<void> => {
  await $fetch('/api/auth/logout', {
    method: 'POST',
  })
}

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await $fetch<{ authenticated: boolean }>('/api/auth/session')
    return Boolean(response.authenticated)
  }
  catch {
    return false
  }
}
