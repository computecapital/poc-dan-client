"use client"

import { io, type Socket } from "socket.io-client"

let socketInstance: Socket | null = null

export function getSocket(): Socket {
  if (!socketInstance) {
    const url =
      (process.env.NEXT_PUBLIC_WS_URL as string) ||
      (process.env.NEXT_PUBLIC_API_URL as string) ||
      ""

    socketInstance = io(url, {
      transports: ["websocket"],
      autoConnect: true,
      withCredentials: true,
    })
  }

  return socketInstance
}


