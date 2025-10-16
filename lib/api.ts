"use client"

import axios from "axios"

function getAuthFromUrl(): string | null {
  if (typeof window === "undefined") return null
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get("auth")
  } catch {
    return null
  }
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const auth = getAuthFromUrl()
  if (auth) {
    config.headers = config.headers || {}
    ;(config.headers as Record<string, string>)["cc-auth"] = auth
  }
  return config
})


