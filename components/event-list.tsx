"use client"

import { useEffect, useState } from "react"
import { getSocket } from "@/lib/socket"
import { api } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle, FileText, Users, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

interface Event {
  id: string
  groupId: string
  kind: string
  title: string
  summary: string
  status: string
  dueDate?: string
  relatedMessageIds: string[]
  createdAt: string
  updatedAt: string
}

interface EventListProps {
  groupId: string
}

const eventKindLabels: Record<string, string> = {
  REQUEST: "Solicitação",
  RESPONSE: "Resposta",
  DEADLINE_MEETING: "Prazo/Reunião",
  DELIVERY_FILE: "Entrega de Arquivo",
  DECISION_APPROVAL: "Decisão/Aprovação",
  BLOCKER_RISK: "Bloqueio/Risco",
  IMPORTANT_INFO: "Informação Importante",
  FOLLOW_UP_TODO: "Follow-up/To-do",
}

const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  DONE: "Concluído",
  PARTIAL: "Parcial",
  NA: "N/A",
}

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  DONE: "bg-green-500/10 text-green-700 dark:text-green-400",
  PARTIAL: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  NA: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const eventIcons: Record<string, any> = {
  REQUEST: FileText,
  RESPONSE: Users,
  DEADLINE_MEETING: Clock,
  DELIVERY_FILE: FileText,
  DECISION_APPROVAL: CheckCircle2,
  BLOCKER_RISK: AlertCircle,
  IMPORTANT_INFO: Flag,
  FOLLOW_UP_TODO: Circle,
}

export function EventList({ groupId }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [groupId])

  useEffect(() => {
    const socket = getSocket()

    const handleEventCreated = async (event: Event) => {
      if (event.groupId !== groupId) return
      const resp = await api.get(`/groups/${groupId}/events`, { params: { limit: 100 } })
      setEvents(resp.data.data || [])
    }

    socket.on("event:created", handleEventCreated)
    return () => {
      socket.off("event:created", handleEventCreated)
    }
  }, [groupId])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const resp = await api.get(`/groups/${groupId}/events`, { params: { limit: 100 } })
      setEvents(resp.data.data || [])
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Carregando eventos...</div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum evento encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 p-4 h-full min-h-0">
      <div className="space-y-4 max-w-4xl mx-auto">
        {events.map((event) => {
          const Icon = eventIcons[event.kind] || Circle
          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base mb-2 text-balance">{event.title}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {eventKindLabels[event.kind] || event.kind}
                        </Badge>
                        <Badge variant="secondary" className={cn("text-xs", statusColors[event.status])}>
                          {statusLabels[event.status] || event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{event.summary}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {event.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(event.dueDate)}</span>
                    </div>
                  )}
                  {event.relatedMessageIds.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{event.relatedMessageIds.length} mensagens relacionadas</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </ScrollArea>
  )
}
