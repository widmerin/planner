import { createError, defineEventHandler, readBody, setCookie } from 'h3'
import { getConfiguredCredentials, getSessionToken } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string, password?: string }>(event)
  const { username, password } = getConfiguredCredentials()

  if (!username || !password) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Credentials are not configured',
    })
  }

  if (body.username !== username || body.password !== password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
    })
  }

  setCookie(event, 'weekplanner-session', getSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  return { ok: true }
})