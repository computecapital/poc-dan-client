"use client"

import { useEffect, useState, useCallback } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Calendar } from "lucide-react"
import { MessageList } from "@/components/message-list"
import { EventList } from "@/components/event-list"
import { getSocket } from "@/lib/socket"
import { api } from "@/lib/api"

interface Group {
  id: string
  whatsappGroupId: string
  name: string
  createdAt: string
  updatedAt: string
  _count: {
    messages: number
  }
}

interface ChatViewProps {
  groupId: string | null
}

export function ChatView({ groupId }: ChatViewProps) {
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchGroup = useCallback(async () => {
    if (!groupId) return

    try {
      setLoading(true)
      const resp = await api.get(`/groups/${groupId}`)
      setGroup(resp.data)
    } catch (error) {
      console.error("[v0] Error fetching group:", error)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (groupId) {
      fetchGroup()
    } else {
      setGroup(null)
    }
  }, [groupId, fetchGroup])

  // Atualiza contagem de mensagens do header suavemente
  useEffect(() => {
    if (!groupId) return
    const socket = getSocket()
    const handleMessageCreated = (payload: { groupId: string }) => {
      if (payload.groupId !== groupId) return
      setGroup((prev) => (prev ? { ...prev, _count: { messages: prev._count.messages + 1 } } : prev))
    }
    socket.on("message:created", handleMessageCreated)
    return () => {
      socket.off("message:created", handleMessageCreated)
    }
  }, [groupId])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!groupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <MessageSquare className="h-20 w-20 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">Selecione uma conversa</h2>
          <p className="text-muted-foreground">Escolha uma conversa da lista para ver as mensagens</p>
        </div>
      </div>
    )
  }

  if (loading || !group) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-screen min-h-0">
      {/* Header */}
      <div className="px-4 border-b border-border bg-card flex items-center gap-3 h-16 min-h-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(group.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{group.name}</h2>
          <p className="text-xs text-muted-foreground">{group._count.messages} mensagens</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="messages" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="w-full rounded-none border-b border-border bg-card justify-start h-16 min-h-0 shrink-0">
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2">
            <Calendar className="h-4 w-4" />
            Eventos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="flex-1 m-0 flex min-h-0 overflow-hidden">
          <MessageList groupId={groupId} />
        </TabsContent>

        <TabsContent value="events" className="flex-1 m-0 min-h-0 overflow-hidden">
          <EventList groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
