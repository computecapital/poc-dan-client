"use client"

import axios from "axios"
import { getAccessToken } from "@/lib/auth"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()

  config.headers = config.headers || {}
  if (token) {
    (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status
    if (status === 401 && typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search
      const next = encodeURIComponent(current)
      window.location.href = `/login?next=${next}`
    }
    return Promise.reject(error)
  }
)

