// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    baseURL: '/soroban-nuxt/',
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  nitro: {
    // Not even seeing this in Nitro's docs; ChatGpt/Google gave me this...
    preset: "static",
  },
  telemetry: false,
  ssr: false,
})
