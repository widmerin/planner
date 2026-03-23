// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    public: {
      appUser: process.env.NUXT_PUBLIC_APP_USER,
      appPassword: process.env.NUXT_PUBLIC_APP_PASSWORD,
    },
  },
})
