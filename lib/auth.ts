"use client"

export function getAuthFromUrl(): string | null {
  if (typeof window === "undefined") return null
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get("auth")
  } catch {
    return null
  }
}


