"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { FileText, Music, Play, Download } from "lucide-react"
import { useState } from "react"

interface Attachment {
  id: string
  kind: string
  mimeType: string
  path: string
  transcript?: string
  description?: string
  durationSec?: number
  bytes?: number
}

interface Message {
  id: string
  whatsappMsgId: string
  fromName: string
  fromNumber: string
  type: string
  text?: string
  sentAt: string
  attachments: Attachment[]
  repliedMessage?: {
    fromName: string
    type: string
    text?: string
  }
}

interface MessageBubbleProps {
  message: Message
  previousMessage?: Message
}

export function MessageBubble({ message, previousMessage }: MessageBubbleProps) {
  const isSameAuthor = previousMessage?.fromNumber === message.fromNumber
  const showAvatar = !isSameAuthor

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Reaction messages
  if (message.type === "reaction") {
    return (
      <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground py-1">
        <span className="font-medium">{message.fromName}</span>
        <span>reagiu com</span>
        <span className="text-2xl">{message.text}</span>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-2", showAvatar ? "mt-4" : "mt-1")}>
      {/* Avatar */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && (
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {getInitials(message.fromName)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 max-w-[70%]">
        {showAvatar && <div className="text-sm font-semibold text-foreground mb-1">{message.fromName}</div>}

        <div className="bg-chat-bubble-received rounded-2xl rounded-tl-sm p-3 shadow-sm">
          {/* Reply Preview */}
          {message.repliedMessage && (
            <div className="mb-2 pl-3 border-l-4 border-primary bg-muted/30 rounded p-2">
              <div className="text-xs font-semibold text-primary mb-1">{message.repliedMessage.fromName}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {message.repliedMessage.text || `[${message.repliedMessage.type}]`}
              </div>
            </div>
          )}

          {/* Attachments */}
          {message.attachments?.map((attachment) => (
            <AttachmentRenderer key={attachment.id} attachment={attachment} />
          ))}

          {/* Text */}
          {message.text && (
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">{message.text}</div>
          )}

          {/* Time */}
          <div className="text-xs text-muted-foreground mt-1 text-right">{formatTime(message.sentAt)}</div>
        </div>
      </div>
    </div>
  )
}

function AttachmentRenderer({ attachment }: { attachment: Attachment }) {
  const [isPlaying, setIsPlaying] = useState(false)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  // Image
  if (attachment.kind === "image" || attachment.mimeType?.startsWith("image/")) {
    return (
      <div className="mb-2 rounded-lg overflow-hidden">
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/files/${attachment.path}`}
          alt={attachment.description || "Image"}
          className="max-w-full h-auto max-h-96 object-contain"
        />
        {attachment.description && <div className="text-xs text-muted-foreground mt-1">{attachment.description}</div>}
      </div>
    )
  }

  // Video
  if (attachment.kind === "video" || attachment.mimeType?.startsWith("video/")) {
    return (
      <div className="mb-2 rounded-lg overflow-hidden">
        <video controls className="max-w-full h-auto max-h-96" src={`${process.env.NEXT_PUBLIC_API_URL}/files/${attachment.path}`}>
          Seu navegador não suporta vídeo.
        </video>
        {attachment.description && <div className="text-xs text-muted-foreground mt-1">{attachment.description}</div>}
      </div>
    )
  }

  // Audio
  if (attachment.kind === "audio" || attachment.mimeType?.startsWith("audio/")) {
    return (
      <div className="mb-2 bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <Play className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="text-sm font-medium text-foreground truncate">Áudio</div>
            </div>
            <div className="text-xs text-muted-foreground">{formatDuration(attachment.durationSec)}</div>
          </div>
          <audio src={`${process.env.NEXT_PUBLIC_API_URL}/files/${attachment.path}`} className="hidden" />
        </div>
        {attachment.transcript && (
          <div className="text-xs text-muted-foreground italic mt-2">&ldquo;{attachment.transcript}&rdquo;</div>
        )}
      </div>
    )
  }

  // Document
  return (
    <div className="mb-2 bg-muted/30 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {attachment.path.split("/").pop() || "Documento"}
          </div>
          <div className="text-xs text-muted-foreground">{formatBytes(attachment.bytes)}</div>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/files/${attachment.path}`}
          download
          className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Download className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
      {attachment.description && (
        <div className="text-xs text-muted-foreground mt-2">{attachment.description}</div>
      )}
    </div>
  )
}
