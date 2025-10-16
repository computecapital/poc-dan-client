"use client"

import axios from "axios"
import { getAuthFromUrl } from "@/lib/auth"

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

