import { createHash } from 'node:crypto'

export const getConfiguredCredentials = () => {
  const username = process.env.APP_USER || process.env.NUXT_PUBLIC_APP_USER || ''
  const password = process.env.APP_PASSWORD || process.env.NUXT_PUBLIC_APP_PASSWORD || ''

  return {
    username,
    password,
  }
}

export const getSessionToken = () => {
  const { username, password } = getConfiguredCredentials()

  if (!username || !password) {
    return ''
  }

  return createHash('sha256').update(`${username}:${password}`).digest('hex')
}