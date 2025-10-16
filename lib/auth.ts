"use client"

// Token & auth helpers for client-side usage

const ACCESS_TOKEN_KEY = "accessToken"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\]\\/+^])/g, "\\$1") + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires.toUTCString()}`
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  const fromStorage = window.localStorage?.getItem(ACCESS_TOKEN_KEY)
  if (fromStorage) return fromStorage
  return getCookie(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return
  window.localStorage?.setItem(ACCESS_TOKEN_KEY, token)
  setCookie(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  if (typeof window === "undefined") return
  window.localStorage?.removeItem(ACCESS_TOKEN_KEY)
  deleteCookie(ACCESS_TOKEN_KEY)
}
