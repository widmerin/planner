import { defineEventHandler, deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'weekplanner-session', {
    path: '/',
  })

  return { ok: true }
})