"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSocket } from "@/lib/socket"

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

interface ConversationListProps {
  selectedGroupId: string | null
  onSelectGroup: (groupId: string) => void
}

export function ConversationList({ selectedGroupId, onSelectGroup }: ConversationListProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [search])

  useEffect(() => {
    const socket = getSocket()

    const handleGroupCreated = (group: Group) => {
      setGroups((prev) => {
        if (prev.some((g) => g.id === group.id)) return prev
        // Inserir no topo com leve destaque natural pelo updatedAt
        return [group, ...prev]
      })
    }

    const handleMessageCreated = (payload: { groupId: string }) => {
      setGroups((prev) => {
        // Atualiza contagem e updatedAt do grupo afetado sem refetch
        const next = prev.map((g) =>
          g.id === payload.groupId
            ? {
                ...g,
                _count: { messages: (g._count?.messages || 0) + 1 },
                updatedAt: new Date().toISOString(),
              }
            : g,
        )
        // Reordena por updatedAt desc para UI suave
        return [...next].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      })
    }

    socket.on("group:created", handleGroupCreated)
    socket.on("message:created", handleMessageCreated)
    return () => {
      socket.off("group:created", handleGroupCreated)
      socket.off("message:created", handleMessageCreated)
    }
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: "50" })
      if (search) params.append("search", search)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/groups?${params}`)
      const data = await response.json()
      setGroups(data.data || [])
    } catch (error) {
      console.error("[v0] Error fetching groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="w-full md:w-96 border-r border-border flex flex-col bg-sidebar-bg">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-semibold mb-4 text-foreground">Conversas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma conversa encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left",
                  selectedGroupId === group.id && "bg-muted",
                )}
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(group.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(group.updatedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{group._count.messages} mensagens</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
