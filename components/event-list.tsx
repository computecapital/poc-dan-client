"use client"

import { useEffect, useState } from "react"
import { getSocket } from "@/lib/socket"
import { api } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle, FileText, Users, Flag, Check, ChevronDown, ChevronUp } from "lucide-react"
import * as Select from "@radix-ui/react-select"
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
  observations?: string
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
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "DONE" | "PARTIAL" | "NA">("ALL")
  const [statusSaving, setStatusSaving] = useState<Record<string, boolean>>({})
  const [observationsEditing, setObservationsEditing] = useState<Record<string, string>>({})
  const [observationsSaving, setObservationsSaving] = useState<Record<string, boolean>>({})
  const [historyLoading, setHistoryLoading] = useState<Record<string, boolean>>({})
  const [statusHistory, setStatusHistory] = useState<Record<string, { from: string; to: string; changedAt: string }[]>>({})
  const [statusSavedTick, setStatusSavedTick] = useState<Record<string, boolean>>({})
  const [statusSavedTickLeaving, setStatusSavedTickLeaving] = useState<Record<string, boolean>>({})
  const [historyOpen, setHistoryOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchEvents()
  }, [groupId, statusFilter])

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
      const params: Record<string, string | number> = { limit: 100 }
      if (statusFilter !== "ALL") params.status = statusFilter
      const resp = await api.get(`/groups/${groupId}/events`, { params })
      setEvents(resp.data.data || [])
    } catch (error) {
      console.error("[v0] Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setStatusSaving((prev) => ({ ...prev, [eventId]: true }))
    try {
      await api.patch(`/events/${eventId}`, { status: newStatus })
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: newStatus, updatedAt: new Date().toISOString() } : ev)))
      setStatusSavedTick((prev) => ({ ...prev, [eventId]: true }))
      // inicia saída suave pouco antes de desmontar
      setTimeout(() => {
        setStatusSavedTickLeaving((prev) => ({ ...prev, [eventId]: true }))
      }, 900)
      setTimeout(() => {
        setStatusSavedTick((prev) => ({ ...prev, [eventId]: false }))
        setStatusSavedTickLeaving((prev) => {
          const next = { ...prev }
          delete next[eventId]
          return next
        })
      }, 1200)
    } catch (error) {
      console.error("[v0] Error updating status:", error)
    } finally {
      setStatusSaving((prev) => ({ ...prev, [eventId]: false }))
    }
  }

  const handleObservationsSave = async (eventId: string) => {
    const value = observationsEditing[eventId] ?? ""
    setObservationsSaving((prev) => ({ ...prev, [eventId]: true }))
    try {
      await api.patch(`/events/${eventId}`, { observations: value })
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, observations: value, updatedAt: new Date().toISOString() } : ev)))
    } catch (error) {
      console.error("[v0] Error updating observations:", error)
    } finally {
      setObservationsSaving((prev) => ({ ...prev, [eventId]: false }))
    }
  }

  const ensureHistoryLoaded = async (eventId: string) => {
    if (statusHistory[eventId] || historyLoading[eventId]) return
    setHistoryLoading((prev) => ({ ...prev, [eventId]: true }))
    try {
      const resp = await api.get(`/events/${eventId}/status-changes`)
      const list = resp.data?.data || []
      setStatusHistory((prev) => ({ ...prev, [eventId]: list }))
    } catch (error) {
      console.error("[v0] Error fetching status changes:", error)
    } finally {
      setHistoryLoading((prev) => ({ ...prev, [eventId]: false }))
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

  // Loading e vazio serão renderizados dentro do layout principal

  return (
    <ScrollArea className="flex-1 p-4 h-full min-h-0">
      <div className="max-w-4xl mx-auto mb-3 flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="status-filter">Status</label>
        <Select.Root value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <Select.Trigger id="status-filter" className="h-9 px-2 rounded-md border border-input bg-background text-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center justify-between min-w-40">
            <Select.Value aria-label={statusFilter}>
              {statusFilter === "ALL" ? "Todos" : (statusLabels as any)[statusFilter]}
            </Select.Value>
            <Select.Icon>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Content className="z-50 bg-background border border-input rounded-md shadow-md">
            <Select.ScrollUpButton className="flex items-center justify-center py-1 text-muted-foreground">
              <ChevronUp className="h-4 w-4" />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-1">
              <Select.Item value="ALL" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none data-[highlighted]:bg-muted">
                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>Todos</Select.ItemText>
              </Select.Item>
              <Select.Item value="OPEN" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none data-[highlighted]:bg-muted">
                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>{statusLabels.OPEN}</Select.ItemText>
              </Select.Item>
              <Select.Item value="DONE" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none data-[highlighted]:bg-muted">
                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>{statusLabels.DONE}</Select.ItemText>
              </Select.Item>
              <Select.Item value="PARTIAL" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none data-[highlighted]:bg-muted">
                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>{statusLabels.PARTIAL}</Select.ItemText>
              </Select.Item>
              <Select.Item value="NA" className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none data-[highlighted]:bg-muted">
                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>{statusLabels.NA}</Select.ItemText>
              </Select.Item>
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center py-1 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Root>
      </div>
      <div className="space-y-4 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-muted-foreground">Carregando eventos...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
            </div>
          </div>
        ) : (
        events.map((event) => {
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
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="outline" className="text-xs h-7">
                          {eventKindLabels[event.kind] || event.kind}
                        </Badge>
                        <Select.Root value={event.status} onValueChange={(v) => handleStatusChange(event.id, v)}>
                          <Select.Trigger disabled={!!statusSaving[event.id]} className={cn(
                            "h-7 px-2 rounded-md border border-input bg-background text-foreground text-xs outline-none inline-flex items-center justify-between min-w-32",
                            statusSaving[event.id] && "opacity-60"
                          )}>
                            <Select.Value aria-label={event.status}>
                              {(statusLabels as any)[event.status] || event.status}
                            </Select.Value>
                            <Select.Icon>
                              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Content className="z-50 bg-background border border-input rounded-md shadow-md">
                            <Select.Viewport className="p-1">
                              <Select.Item value="OPEN" className="relative flex cursor-pointer select-none items-center rounded-sm py-1 pl-6 pr-2 text-xs outline-none data-[highlighted]:bg-muted">
                                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </Select.ItemIndicator>
                                <Select.ItemText>{statusLabels.OPEN}</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="DONE" className="relative flex cursor-pointer select-none items-center rounded-sm py-1 pl-6 pr-2 text-xs outline-none data-[highlighted]:bg-muted">
                                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </Select.ItemIndicator>
                                <Select.ItemText>{statusLabels.DONE}</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="PARTIAL" className="relative flex cursor-pointer select-none items-center rounded-sm py-1 pl-6 pr-2 text-xs outline-none data-[highlighted]:bg-muted">
                                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </Select.ItemIndicator>
                                <Select.ItemText>{statusLabels.PARTIAL}</Select.ItemText>
                              </Select.Item>
                              <Select.Item value="NA" className="relative flex cursor-pointer select-none items-center rounded-sm py-1 pl-6 pr-2 text-xs outline-none data-[highlighted]:bg-muted">
                                <Select.ItemIndicator className="absolute left-1 inline-flex items-center justify-center">
                                  <Check className="h-3 w-3" />
                                </Select.ItemIndicator>
                                <Select.ItemText>{statusLabels.NA}</Select.ItemText>
                              </Select.Item>
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Root>
                        {statusSavedTick[event.id] && (
                          <Check
                            className={cn(
                              "h-3.5 w-3.5 text-green-600 dark:text-green-400",
                              statusSavedTickLeaving[event.id]
                                ? "animate-out fade-out duration-200 ease-out"
                                : "animate-in slide-in-from-left-2 duration-200 ease-out"
                            )}
                          />
                        )}
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
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Criado em {formatDateTime(event.createdAt)}</span>
                  </div>
                  {event.relatedMessageIds.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{event.relatedMessageIds.length} mensagens relacionadas</span>
                    </div>
                  )}
                </div>

                {/* Observações */}
                <details
                  className="rounded-md border border-border bg-muted/20"
                  onToggle={(e) => {
                    const open = (e.target as HTMLDetailsElement).open
                    if (open && observationsEditing[event.id] === undefined) {
                      setObservationsEditing((prev) => ({ ...prev, [event.id]: event.observations || "" }))
                    }
                  }}
                >
                  <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Observações</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{!event.observations && "Sem observações"}</span>
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <textarea
                      value={observationsEditing[event.id] ?? ""}
                      onChange={(e) => setObservationsEditing((prev) => ({ ...prev, [event.id]: e.target.value }))}
                      rows={4}
                      placeholder="Escreva observações"
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleObservationsSave(event.id)}
                        disabled={!!observationsSaving[event.id]}
                        className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {observationsSaving[event.id] ? "Salvando..." : "Salvar"}
                      </button>
                    </div>
                  </div>
                </details>

                {/* Histórico de status */}
                <details
                  className="rounded-md border border-border bg-muted/20"
                  onToggle={async (e) => {
                    const open = (e.target as HTMLDetailsElement).open
                    setHistoryOpen((prev) => ({ ...prev, [event.id]: open }))
                    if (open) await ensureHistoryLoaded(event.id)
                  }}
                >
                  <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between">
                    <span className="text-sm font-medium">Histórico de status</span>
                    <span className="flex items-center text-xs text-muted-foreground">
                      {historyOpen[event.id] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </summary>
                  <div className="px-3 pb-3 space-y-2 text-sm">
                    {(statusHistory[event.id] || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-border/60 pb-1">
                        <div className="flex items-center gap-2">
                          <Badge className={cn("text-xs", statusColors[item.from] || "")}>{statusLabels[item.from] || item.from}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge className={cn("text-xs", statusColors[item.to] || "")}>{statusLabels[item.to] || item.to}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDateTime(item.changedAt)}</span>
                      </div>
                    ))}
                    {!historyLoading[event.id] && (statusHistory[event.id]?.length || 0) === 0 && (
                      <div className="text-xs text-muted-foreground">Sem mudanças registradas.</div>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>
          )
        }))}
      </div>
    </ScrollArea>
  )
}
