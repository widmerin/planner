import { defineEventHandler, getCookie } from 'h3'
import { getSessionToken } from '../../utils/auth'

export default defineEventHandler((event) => {
  const sessionToken = getCookie(event, 'weekplanner-session')

  return {
    authenticated: Boolean(sessionToken) && sessionToken === getSessionToken(),
  }
})